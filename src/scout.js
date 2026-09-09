/* locator.x — Scout & Forecast: predictive models over the ZIP series, hourly feed scanning,
   diff/score/match of new listings and changes, and a review digest per pass. */
(function(){
'use strict';
const L=()=>window.LX, D=()=>window.LXDash;
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const F$=n=>L().fmt$(n), FN=n=>L().fmtN(n), esc=s=>L().esc(s), pct=(v,d=1)=>L().fmtPct(v,d);

/* ================= Forecast agent ================= */
const FC={zip:{}, ready:false};
function fitSeries(vals){ // weighted log-linear fit on up to last 18 non-null points
  const pts=[]; vals.forEach((v,i)=>{ if(v!=null&&v>0) pts.push([i, Math.log(v)]); });
  if(pts.length<8) return null;
  const use=pts.slice(-18); const n=use.length;
  let sw=0,sx=0,sy=0,sxx=0,sxy=0;
  use.forEach(([x,y],j)=>{ const w=1+j; sw+=w; sx+=w*x; sy+=w*y; sxx+=w*x*x; sxy+=w*x*y; });
  const mx=sx/sw, my=sy/sw; const b=(sxy-sw*mx*my)/(sxx-sw*mx*mx || 1e-9); const a0=my-b*mx;
  let se=0; use.forEach(([x,y])=>{ const e=y-(a0+b*x); se+=e*e; });
  const sd=Math.sqrt(se/Math.max(1,n-2));
  let sst=0; use.forEach(([x,y])=>{ sst+=(y-my)*(y-my); });
  const r2=sst>0? 1-se/sst : 0;
  const lastX=pts[pts.length-1][0], lastV=Math.exp(pts[pts.length-1][1]);
  return {b, a:a0, sd, r2, lastX, lastV,
    at:h=>Math.exp(a0+b*(lastX+h)),                      // point forecast h months out
    lo:h=>Math.exp(a0+b*(lastX+h)-1.28*sd*Math.sqrt(h)), // ~80% band
    hi:h=>Math.exp(a0+b*(lastX+h)+1.28*sd*Math.sqrt(h)),
    g12:(Math.exp(12*b)-1)*100, gmo:Math.exp(b)-1};
}
function zipFC(zip){ if(FC.zip[zip]!==undefined) return FC.zip[zip]; const z=L().M.zips[zip]; if(!z){ return FC.zip[zip]=null; }
  const v=fitSeries(z.v||[]), r=fitSeries(z.r||[]); return FC.zip[zip]={v, r, city:z.city}; }
function buildAll(){ if(FC.ready) return; const X=L(); Object.keys(X.M.zips).forEach(zipFC);
  X.BA.geo.zips.features.forEach(ft=>{ const f=FC.zip[ft.properties.zip]; ft.properties.fc = f&&f.v? +f.v.g12.toFixed(1) : null; });
  X.updateZipsSource(); FC.ready=true; }
function propFC(l){ // 12-month path for one property under your assumptions
  const X=L(); const a=X.state.assump; const f=zipFC(l.zip); const d=X.deal(l); if(!d) return null;
  const gv=f&&f.v? f.v.g12 : 0; const gr=f&&f.r? f.r.g12 : 0;
  const rent12=d.rentMo*(1+gr/100);
  const egi=rent12*12*(1-a.vacancy/100);
  const noi12=egi - (d.tax + d.ins + rent12*12*(a.maint+a.capex)/100 + egi*a.mgmt/100 + d.hoa);
  const cf12=(noi12-d.ds)/12; const dscr12=d.ds>0? noi12/d.ds : null;
  const v12=d.P*(1+gv/100);
  const lerp=(x,x0,x1)=>clamp((x-x0)/(x1-x0),0,1)*100;
  const dScore=Math.round(0.30*(lerp(cf12,-3000,1500)-lerp(d.cfMo,-3000,1500)) + 0.10*(lerp(gv,-8,8)-lerp(d.mk.yoy==null?0:d.mk.yoy,-8,8)));
  let flipMo=null; if(d.cfMo<0 && f&&f.r && f.r.gmo>0){ const target=(d.ds+d.opex-d.hoa*0)/12/( (1-a.vacancy/100) ); // approx needed gross rent/mo before mgmt
    const need=(d.ds+d.opex)/12; // total out per month approx vs rent-derived in
    const inPerRent=(1-a.vacancy/100)*(1-a.mgmt/100)+ -(a.maint+a.capex)/100; // rough net-in per $ rent
    if(inPerRent>0){ const rentNeed=need/inPerRent; if(rentNeed>d.rentMo){ flipMo=Math.ceil(Math.log(rentNeed/d.rentMo)/Math.log(1+f.r.gmo)); } else flipMo=0; } }
  return {gv, gr, rent12, cf12, dscr12, v12, dScore, flipMo, conf: f&&f.v? (f.v.r2>0.75?'high':f.v.r2>0.45?'medium':'low') : 'none'};
}

/* ================= Scout agent (feeds, diff, match) ================= */
let SC=Object.assign({sources:[], enabled:false, autoUW:false, known:{}, log:[], lastScan:0}, L().store('scout')||{});
const saveSC=()=>{ if(SC.log.length>400) SC.log=SC.log.slice(-400); L().store('scout', SC); };
function keyOf(l){ return (l.apn||'')+'|'+(l.addr||'').toLowerCase()+'|'+(l.zip||''); }
function logItem(type, title, body, id){ SC.log.push({t:Date.now(), type, title, body, id}); }
function bb(){ return window.LXUW? window.LXUW.bb : null; }
/* Which asset classes the Scout is hunting. Defaults to the income classes the
   desk actually buys — apartments of five units and up, small multifamily,
   hotels and lodging, and commercial that can carry housing — and every known
   class can be switched on or off. A class filter never loosens the numeric buy
   box; it narrows what the box is applied to. */
const WANTDEF=['apt','mf','hotel','comm'];
function wantSet(){ return (SC.want && SC.want.length)? SC.want : WANTDEF; }
function classHit(l){
  const CL=(window.LXView&&LXView.CLASSES)||null;
  if(!CL) return true;
  const want=wantSet();
  if(want.indexOf('*')>=0) return true;
  for(const id of want){ const c=CL.find(x=>x.id===id); if(c){ try{ if(c.test(l)) return true; }catch(e){} } }
  return false;
}
function passesBB(r){ const l0=r.l; if(!classHit(l0)) return false; const B=bb(); if(!B) return true; const l=r.l; if(L().price(l)>B.maxPrice) return false; if(r.score<B.minScore) return false; if(r.d.cap<B.minCap) return false; if((r.d.dscr||0)<B.minDscr) return false; if((l.units||1)<B.minUnits) return false; if(B.city&&l.city!==B.city) return false; if(B.county&&l.county!==B.county) return false; if(!B.cats[r.cat]) return false; return true; }
async function fetchSource(s){ let headers={}; try{ headers=s.hdr? JSON.parse(s.hdr):{}; }catch(e){}
  const r=await fetch(s.url,{headers}); const t=await r.text(); if(!r.ok) throw new Error('HTTP '+r.status); return t; }
function scanText(text, srcName){
  const X=L(); const res=X.importText(text, srcName); const found=res.listings||[];
  let added=0, changed=0, matches=[];
  found.forEach(nl=>{ const k=keyOf(nl); const prev=SC.known[k];
    if(!prev){ // new listing
      SC.known[k]={p:nl.price, t:Date.now(), id:nl.id};
      X.state.imported.push(nl); added++;
      const r=D().analyze(nl); if(r){ const hit=passesBB(r);
        logItem(hit?'match':'new', (hit?'Buy-box match: ':'New: ')+nl.addr+', '+nl.city, `${F$(nl.price)} · ${nl.kind} · score ${r.score} (${D().CAT[r.cat].name})${hit?' — passes your buy box':''}`, nl.id);
        if(hit){ matches.push(r); if(SC.autoUW && window.LXUW){ /* stage via scenario store */ const scen=X.store('uwscen')||{}; scen[nl.id]=Object.assign(scen[nl.id]||{stage:'scr'},{stage:'scr'}); X.store('uwscen', scen); } } }
    } else { // change detection
      const ex=X.allListings().find(x=>x.id===prev.id);
      if(nl.price && prev.p && Math.abs(nl.price-prev.p)>Math.max(5000, prev.p*0.005)){ changed++;
        const dirn=nl.price<prev.p? 'cut' : 'raise';
        logItem('change', 'Price '+dirn+': '+nl.addr+', '+nl.city, `${F$(prev.p)} → ${F$(nl.price)} (${((nl.price/prev.p-1)*100).toFixed(1)}%)`, prev.id);
        if(ex){ ex.price=nl.price; if(ex.status!==nl.status) ex.status=nl.status; }
        SC.known[k].p=nl.price; SC.known[k].t=Date.now();
        if(ex){ const r=D().analyze(ex); if(r&&passesBB(r)&&dirn==='cut') { logItem('match','Now in the buy box after the cut: '+ex.addr, `score ${r.score} · ${D().CAT[r.cat].name}`, ex.id); matches.push(r); } }
      }
    } });
  if(added) { X.store('imported', X.state.imported); X.fillCounties(); X.refresh(); }
  return {found:found.length, added, changed, matches, notes:res.notes||[]};
}
async function scan(manualText){
  const X=L(); const started=Date.now(); let total={found:0, added:0, changed:0, matches:[]}; const perSrc=[];
  if(manualText){ try{ const r=scanText(manualText, 'pasted feed'); ['found','added','changed'].forEach(k=>total[k]+=r[k]); total.matches.push(...r.matches); perSrc.push('pasted: '+r.found+' items'); }catch(e){ perSrc.push('pasted: failed — '+e.message); } }
  else { for(const s of SC.sources){ try{ const t=await fetchSource(s); const r=scanText(t, s.name||'feed'); s.last=Date.now(); s.err=null; s.n=r.found; ['found','added','changed'].forEach(k=>total[k]+=r[k]); total.matches.push(...r.matches); perSrc.push(`${s.name}: ${r.found} items, ${r.added} new, ${r.changed} changed`); }
      catch(e){ s.err=e.message; perSrc.push(`${s.name}: failed — ${e.message}${location.hostname.includes('claude')?' (outside servers are blocked inside claude.ai — run the standalone copy for live polling)':''}`); } } }
  SC.lastScan=started;
  const best=total.matches.sort((a,b)=>b.score-a.score)[0];
  logItem('scan', `Scan complete — ${total.found} listings from ${manualText?'pasted data':SC.sources.length+' source'+(SC.sources.length===1?'':'s')}`,
    `${total.added} new · ${total.changed} price changes · ${total.matches.length} buy-box match${total.matches.length===1?'':'es'}${best? ' · best: '+best.l.addr+' (score '+best.score+')':''}${SC.autoUW&&total.matches.length? ' · auto-screened into the pipeline':''}\n${perSrc.join('\n')}`);
  saveSC(); render(); if(total.matches.length) X.toast(`${total.matches.length} new buy-box match${total.matches.length===1?'':'es'} found`);
}
/* The hourly clock used to exist only while the Scout tab was rendered. It now
   arms at boot and runs whichever tab you are on, and it takes one pass as soon
   as the app opens if the last one is more than fifty-five minutes old — that
   is the "check when someone logs in" behaviour. Inside claude.ai the page is
   sandboxed from outside servers, so a live feed only fetches in the downloaded
   or self-hosted copy; the pass still runs and reports honestly that it could
   not reach the source. */
let booted=false;
function autoStart(){
  if(booted) return; booted=true;
  arm();
  setTimeout(()=>{
    if(!SC.enabled || !SC.sources.length) return;
    if(Date.now()-(SC.lastScan||0) < 55*60e3) return;
    scan();
  }, 4000);
  setInterval(()=>{ statusChip(); }, 30e3);
  statusChip();
}
function statusChip(){
  const host=document.querySelector('header .brand'); if(!host) return;
  let el=document.getElementById('lxscoutchip');
  if(!el){
    el=document.createElement('button'); el.id='lxscoutchip'; el.className='btn';
    el.style.cssText='font-size:11px;padding:2px 8px';
    el.title='Scout — new-listing checks. Click to open the Scout desk.';
    el.addEventListener('click',()=>{ L().showView('scout'); });
    host.parentNode.insertBefore(el, host.nextSibling);
  }
  if(!SC.sources.length){ el.textContent='Scout: no feeds'; el.style.opacity='.65'; return; }
  el.style.opacity='1';
  if(!SC.enabled){ el.textContent='Scout: paused'; return; }
  const ms=Math.max(0, (SC.lastScan||0)+3600e3-Date.now());
  el.textContent='Scout: '+(SC.lastScan? 'next in '+Math.ceil(ms/60000)+'m' : 'arming');
}
let timer=null;
function arm(){ clearInterval(timer); if(!SC.enabled) return; timer=setInterval(()=>{ if(Date.now()-SC.lastScan>=3600e3 && SC.sources.length) scan(); tick(); }, 60e3); }
function tick(){ const el=$('#scnext'); if(!el) return; if(!SC.enabled||!SC.sources.length){ el.textContent=''; return; } const ms=Math.max(0, SC.lastScan+3600e3-Date.now()); el.textContent='· next in '+Math.ceil(ms/60000)+' min'; }

/* ================= Review agent (digest) ================= */
/* The flip scan below runs propFC — a 12-month re-underwrite — over every
   analyzed row, up to 354,000 of them on the largest edition. Measured as the
   single largest cost of opening the Scout tab (0.5-1.8s), and it was being
   paid again on every mode-toggle click and every tab revisit even though the
   underlying dashboard rows had not changed. Dashboard's own analyze() already
   memoizes its output behind a signature and only replaces its `rows` array
   when that signature actually changes (dashboard.js's compute()), so the
   array reference itself is a free, correct cache key here: the same
   reference in means the same rows came out, so the scan can be skipped. */
let _flipsCache={rowsRef:null, val:null};
function digest(){
  const X=L(); buildAll();
  const rows=D().rows.length? D().rows : (D().render(), D().rows);
  const clean=rows.filter(r=>!r.sus);
  const zf=Object.entries(FC.zip).filter(([k,f])=>f&&f.v).map(([k,f])=>({k, g:f.v.g12, city:f.city, r2:f.v.r2}));
  const rising=zf.filter(z=>z.g>0).length;
  let flips;
  if(_flipsCache.rowsRef===rows){ flips=_flipsCache.val; }
  else{
    flips=clean.map(r=>({r, p:propFC(r.l)})).filter(x=>x.p&&x.p.flipMo!=null&&x.p.flipMo>0&&x.p.flipMo<=12&&x.r.d.cfMo<0).sort((a,b)=>a.p.flipMo-b.p.flipMo);
    _flipsCache={rowsRef:rows, val:flips};
  }
  const cuts=SC.log.filter(x=>x.type==='change').slice(-5).reverse();
  const matches=SC.log.filter(x=>x.type==='match').slice(-5).reverse();
  const bestZip=zf.sort((a,b)=>b.g-a.g)[0];
  return {rows:clean, zf, rising, flips, cuts, matches, bestZip};
}

/* ================= rendering ================= */
let mode='now', selZip=null;
function render(){
  const X=L(); buildAll(); const dg=digest();
  $('#sctiles').innerHTML=`
    <div class="tile"><div class="v" style="color:${dg.rising>dg.zf.length/2?'var(--good)':'var(--warn)'}">${dg.rising}<span style="font-size:14px;color:var(--muted)"> / ${dg.zf.length}</span></div><div class="l">ZIPs forecast to rise over 12 months</div><div class="d">${dg.bestZip? 'strongest: '+dg.bestZip.k+' '+esc(dg.bestZip.city||'')+' ('+(dg.bestZip.g>0?'+':'')+dg.bestZip.g.toFixed(1)+'%)':''}</div></div>
    <div class="tile"><div class="v" style="color:var(--cat3)">${dg.flips.length}</div><div class="l">predicted category flips within a year</div><div class="d">${dg.flips[0]? dg.flips[0].r.l.addr+', '+dg.flips[0].r.l.city+' in ~'+dg.flips[0].p.flipMo+' mo':'liabilities turning asset on the model\'s rent path'}</div></div>
    <div class="tile"><div class="v">${SC.sources.length}</div><div class="l">feeds on the hourly clock ${SC.enabled?'· armed':'· paused'}</div><div class="d">${SC.lastScan? 'last scan '+new Date(SC.lastScan).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'no scans yet — add a source or paste a feed'}</div></div>
    <div class="tile"><div class="v" style="color:var(--accent)">${SC.log.filter(x=>x.type==='match').length}</div><div class="l">buy-box matches found by the scout</div><div class="d">${SC.autoUW?'auto-screened into the underwriting pipeline':'turn on auto-underwrite to stage them automatically'}</div></div>`;
  renderReco(dg); renderFan(); renderFlips(dg); renderZipTable(dg); renderSources(); renderDigest(dg); tick();
}
function renderReco(dg){
  const X=L(); const B=bb();
  $$('#scmode button').forEach(b=>b.setAttribute('aria-selected', b.dataset.m===mode));
  const cats=D().CATS.filter(c=>!B||B.cats[c.id]||c.id!=='liab');
  $('#screco').innerHTML=cats.map(c=>{
    let pool=dg.rows.filter(r=>r.cat===c.id);
    let rowsHtml='';
    if(mode==='now'){ pool=pool.filter(r=>passesBB(r)).sort((a,b)=>b.score-a.score).slice(0,4);
      rowsHtml=pool.map(r=>`<div class="row" data-id="${r.l.id}"><b>${esc(r.l.addr)}</b><span class="m">score ${r.score}</span><span class="s">${esc(r.l.city)} · ${F$(r.d.P)} · cap ${pct(r.d.cap)} · ${(r.d.cfMo>0?'+':'')+F$(r.d.cfMo)}/mo</span></div>`).join(''); }
    else { const scored=pool.map(r=>({r, p:propFC(r.l)})).filter(x=>x.p).sort((a,b)=>(b.r.score+b.p.dScore)-(a.r.score+a.p.dScore)).slice(0,4);
      rowsHtml=scored.map(({r,p})=>`<div class="row" data-id="${r.l.id}"><b>${esc(r.l.addr)}</b><span class="m">${r.score} → ${clamp(r.score+p.dScore,0,100)}</span><span class="s">${esc(r.l.city)} · ZIP path ${(p.gv>0?'+':'')+p.gv.toFixed(1)}% value, ${(p.gr>0?'+':'')+p.gr.toFixed(1)}% rent · cash flow ${(p.cf12>0?'+':'')+F$(p.cf12)}/mo in 12 mo · confidence ${p.conf}</span></div>`).join(''); }
    return `<div class="board" style="--c:var(${c.c})"><h3>${c.name}</h3><p>${mode==='now'? c.blurb : 'Ranked by today\'s score plus the model\'s 12-month score change.'}</p>${rowsHtml||'<div class="empty">Nothing passes the buy box here.</div>'}</div>`; }).join('');
  $$('#screco .row').forEach(el=>el.addEventListener('click', ()=>{ L().showView('uw'); window.LXUW.openSheet(el.dataset.id); }));
}
function renderFan(){
  const X=L(); const box=$('#scfan'); const zip=selZip|| (X.state.sel? (X.allListings().find(l=>l.id===X.state.sel)||{}).zip : null) || '94601';
  const z=X.M.zips[zip]; const f=zipFC(zip);
  if(!z||!f||!f.v){ box.innerHTML='<p style="font-size:13px;color:var(--muted)">No series for that ZIP — try one from the table below.</p>'; $('#scfantitle').textContent='ZIP forecast'; return; }
  $('#scfantitle').textContent=`ZIP ${zip} · ${esc(z.city||'')} — value and rent, 25 months back, 12 forward`;
  $('#scfit').textContent=`model fit r² ${f.v.r2.toFixed(2)} (${f.v.r2>0.75?'high':f.v.r2>0.45?'medium':'low'} confidence) · fitted drift ${(f.v.g12>0?'+':'')+f.v.g12.toFixed(1)}%/yr`;
  const hist=z.v||[]; const W=580,H=280,pl=56,pr=16,pt=12,pb=26; const n=hist.length; const horizon=12;
  const pts=[]; hist.forEach((v,i)=>{ if(v!=null) pts.push([i,v]); });
  const fut=[]; for(let h=1;h<=horizon;h++) fut.push([n-1+h, f.v.at(h), f.v.lo(h), f.v.hi(h)]);
  const all=[...pts.map(p=>p[1]), ...fut.map(p=>p[3]), ...fut.map(p=>p[2])];
  const min=Math.min(...all)*0.98, max=Math.max(...all)*1.02;
  const xx=i=>pl+i/(n-1+horizon)*(W-pl-pr), yy=v=>pt+(max-v)/(max-min)*(H-pt-pb);
  let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">`;
  [0,0.5,1].forEach(t=>{ const v=min+(max-min)*t; s+=`<line x1="${pl}" x2="${W-pr}" y1="${yy(v)}" y2="${yy(v)}" stroke="var(--line)"/><text x="${pl-5}" y="${yy(v)+3}" text-anchor="end" font-size="9.5" font-family="var(--mono)" fill="var(--muted)">${F$(v)}</text>`; });
  s+=`<path d="M${fut.map(p=>xx(p[0]).toFixed(1)+' '+yy(p[3]).toFixed(1)).join('L')} L${fut.slice().reverse().map(p=>xx(p[0]).toFixed(1)+' '+yy(p[2]).toFixed(1)).join('L')} Z" fill="var(--bay-soft)" opacity="0.9"/>`;
  s+=`<path d="${pts.map((p,i)=>(i?'L':'M')+xx(p[0]).toFixed(1)+' '+yy(p[1]).toFixed(1)).join('')}" fill="none" stroke="var(--bay)" stroke-width="2"/>`;
  s+=`<path d="M${xx(pts[pts.length-1][0]).toFixed(1)} ${yy(pts[pts.length-1][1]).toFixed(1)} ${fut.map(p=>'L'+xx(p[0]).toFixed(1)+' '+yy(p[1]).toFixed(1)).join('')}" fill="none" stroke="var(--bay)" stroke-width="2" stroke-dasharray="5 4"/>`;
  s+=`<line x1="${xx(n-1)}" x2="${xx(n-1)}" y1="${pt}" y2="${H-pb}" stroke="var(--line2)" stroke-dasharray="3 3"/><text x="${xx(n-1)}" y="${H-8}" text-anchor="middle" font-size="9.5" fill="var(--muted)">today</text>`;
  const end=fut[fut.length-1]; s+=`<text x="${xx(end[0])-4}" y="${yy(end[1])-6}" text-anchor="end" font-size="10.5" font-family="var(--mono)" fill="var(--ink)">${F$(end[1])}</text>`;
  s+=`</svg>`;
  if(f.r){ s+=`<div style="font-size:12px;color:var(--ink2);margin-top:6px">Rent path: $${FN(f.r.lastV)}/mo today → $${FN(f.r.at(12))}/mo in 12 months (${(f.r.g12>0?'+':'')+f.r.g12.toFixed(1)}%). Value and rent moving ${(f.v.g12>0)===(f.r.g12>0)?'together':'apart — yields are '+(f.r.g12>f.v.g12?'improving':'compressing')}.</div>`; }
  box.innerHTML=s;
}
function renderFlips(dg){
  const X=L(); const box=$('#scflips'); const list=dg.flips.slice(0,10);
  box.innerHTML = list.length? list.map(({r,p})=>`<div class="flip" data-id="${r.l.id}"><b>${esc(r.l.addr)}, ${esc(r.l.city)}</b><span class="m">asset in ~${p.flipMo} mo</span><span class="s">${F$(r.d.P)} · ${esc(r.l.kind)} · today ${F$(r.d.cfMo)}/mo → ${(p.cf12>0?'+':'')+F$(p.cf12)}/mo on the ZIP's ${(p.gr>0?'+':'')+p.gr.toFixed(1)}% rent path · confidence ${p.conf}</span></div>`).join('')
    : '<p style="font-size:13px;color:var(--muted)">No negative-cash-flow property flips positive within 12 months on current rent paths. Widen the buy box, or lower the down-payment slider and re-check.</p>';
  $$('#scflips .flip').forEach(el=>el.addEventListener('click', ()=>{ L().showView('uw'); window.LXUW.openSheet(el.dataset.id); }));
}
function renderZipTable(dg){
  const X=L(); const rows=dg.zf.slice().sort((a,b)=>b.g-a.g);
  $('#scziptable thead').innerHTML='<tr><th>ZIP</th><th>City</th><th class="r">Value today</th><th class="r">Model, 12 mo</th><th class="r">Rent, 12 mo</th><th class="r">Fit r²</th><th class="r">Properties here</th></tr>';
  const counts={}; X.allListings().forEach(l=>{ if(l.zip) counts[l.zip]=(counts[l.zip]||0)+1; });
  $('#scziptable tbody').innerHTML=rows.slice(0,30).map(z=>{ const f=FC.zip[z.k]; const v=X.M.zips[z.k]; return `<tr class="clickable" data-z="${z.k}"><td><b>${z.k}</b></td><td>${esc(z.city||'')}</td><td class="r">${F$(X.last(v.v))}</td><td class="r ${z.g>0?'pos':'neg'}">${(z.g>0?'+':'')+z.g.toFixed(1)}%</td><td class="r ${f.r&&f.r.g12>0?'pos':'neg'}">${f.r? (f.r.g12>0?'+':'')+f.r.g12.toFixed(1)+'%':'—'}</td><td class="r">${z.r2.toFixed(2)}</td><td class="r">${counts[z.k]||0}</td></tr>`; }).join('');
  $$('#scziptable tr.clickable').forEach(tr=>tr.addEventListener('click', ()=>{ selZip=tr.dataset.z; $('#sczip').value=selZip; renderFan(); $('#scfan').scrollIntoView({behavior:'smooth', block:'center'}); }));
}
function renderSources(){
  const box=$('#scsources');
  box.innerHTML = SC.sources.length? SC.sources.map((s,i)=>`<div class="srcrow"><b>${esc(s.name||'feed '+(i+1))}</b><span><button class="btn" data-del="${i}">Remove</button></span><span class="u">${esc(s.url)}</span><span class="st">${s.err? '⚠ '+esc(s.err) : s.last? 'last: '+new Date(s.last).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})+' · '+(s.n||0)+' items' : 'not scanned yet'}</span></div>`).join('')
    : '<p style="font-size:12.5px;color:var(--muted)">No feeds yet. Add a listing-search endpoint below — each scan diffs it against everything already known, scores what\'s new, and matches it to your buy box.</p>';
  $$('#scsources [data-del]').forEach(b=>b.addEventListener('click', ()=>{ SC.sources.splice(+b.dataset.del,1); saveSC(); renderSources(); }));
  { const box=$('#scwant');
    if(box){ const X=L(); const CL=(window.LXView&&LXView.CLASSES)||[]; const want=wantSet();
      const all=want.indexOf('*')>=0;
      box.innerHTML='<button class="chip'+(all?' on':'')+'" data-want="*">Every known category</button>'
        + CL.map(c=>{ const on=!all&&want.indexOf(c.id)>=0;
            const col=window.LXPal? (CL.indexOf(c)<8? LXPal.c(CL.indexOf(c)+1) : LXPal.tok('--muted')) : 'var(--ink2)';
            return '<button class="chip'+(on?' on':'')+'" data-want="'+c.id+'">'+(window.LXPal?LXPal.swatch(col,'circle',9):'')+' '+X.esc(c.name)+'</button>'; }).join('');
      Array.from(box.querySelectorAll('[data-want]')).forEach(b=>b.addEventListener('click',()=>{
        const id=b.dataset.want;
        if(id==='*'){ SC.want=['*']; }
        else { let w=(SC.want&&SC.want.indexOf('*')<0)? SC.want.slice() : WANTDEF.slice();
               const i=w.indexOf(id); if(i>=0) w.splice(i,1); else w.push(id);
               SC.want = w.length? w : ['*']; }
        saveSC(); render();
      }));
    } }
  $('#scen').checked=SC.enabled; $('#scauto').checked=SC.autoUW;
}
function fmtWhen(t){ const d=new Date(t); return d.toLocaleDateString([], {month:'short', day:'numeric'})+' '+d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }
function renderDigest(dg){
  const X=L();
  const bestNow=dg.rows.filter(r=>passesBB(r)).sort((a,b)=>b.score-a.score)[0];
  const bestFlip=dg.flips[0];
  $('#scdigest').innerHTML=`<div class="digestbox"><b>Today's review.</b> ${dg.rising} of ${dg.zf.length} ZIP models point up over the next year${dg.bestZip? ', led by '+dg.bestZip.k+' '+esc(dg.bestZip.city||'')+' at '+(dg.bestZip.g>0?'+':'')+dg.bestZip.g.toFixed(1)+'%':''}. ${bestNow? 'Best buy-box fit on the board: <b>'+esc(bestNow.l.addr)+', '+esc(bestNow.l.city)+'</b> (score '+bestNow.score+', '+D().CAT[bestNow.cat].name.toLowerCase()+').':'Nothing currently passes the buy box — loosen a threshold or let the scout hunt.'} ${bestFlip? 'Watch <b>'+esc(bestFlip.r.l.addr)+'</b>: the model has it cash-flow positive in ~'+bestFlip.p.flipMo+' months.':''} ${SC.log.filter(x=>x.type==='match').length? SC.log.filter(x=>x.type==='match').length+' scout matches logged to date.':''}</div>`;
  const items=SC.log.slice(-30).reverse();
  $('#sclog').innerHTML = items.length? items.map(x=>`<div class="feeditem"><div class="fh"><span><span class="badge ${x.type==='match'?'good':x.type==='change'?'warn':x.type==='scan'?'bay':''}">${x.type}</span> <b style="font-size:12.5px">${esc(x.title)}</b></span><span class="when">${fmtWhen(x.t)}</span></div><p style="white-space:pre-line">${esc(x.body)}</p>${x.id?`<p><a href="#" data-id="${esc(x.id)}">Underwrite ↗</a></p>`:''}</div>`).join('')
    : '<p style="font-size:12.5px;color:var(--muted)">No scans logged yet. The log records every new listing, price change and buy-box match the scout finds, newest first.</p>';
  $$('#sclog a[data-id]').forEach(a=>a.addEventListener('click', e=>{ e.preventDefault(); const id=a.dataset.id; if(X.allListings().find(l=>l.id===id)){ X.showView('uw'); window.LXUW.openSheet(id); } else X.toast('That listing is no longer loaded'); }));
}
/* ---------- events ---------- */
function bind(){
  $('#scmode').addEventListener('click', e=>{ const b=e.target.closest('button'); if(!b) return; mode=b.dataset.m; render(); });
  $('#sczip').addEventListener('change', e=>{ selZip=e.target.value.trim(); renderFan(); });
  $('#scadd').addEventListener('click', ()=>{ const url=$('#sc_url').value.trim(); if(!url) return; SC.sources.push({url, hdr:$('#sc_hdr').value.trim(), name:$('#sc_name').value.trim()||('feed '+(SC.sources.length+1))}); $('#sc_url').value=''; $('#sc_name').value=''; saveSC(); renderSources(); L().toast('Source added — Scan now or arm the hourly clock'); });
  $('#scnow').addEventListener('click', ()=>{ if(!SC.sources.length){ L().toast('Add a feed source first, or paste data below'); return; } scan(); });
  $('#scpastego').addEventListener('click', ()=>{ const t=$('#scpaste').value.trim(); if(t) scan(t); });
  $('#scen').addEventListener('change', e=>{ SC.enabled=e.target.checked; saveSC(); arm(); tick(); L().toast(SC.enabled?'Hourly scanning armed — runs while this page is open':'Hourly scanning paused'); });
  $('#scauto').addEventListener('change', e=>{ SC.autoUW=e.target.checked; saveSC(); });
}
let bound=false;
function render0(){ if(!bound){ bind(); bound=true; arm(); } render(); }
setTimeout(()=>{ try{ buildAll(); }catch(e){} }, 400);
window.LXScout={render:render0, zipFC, propFC, scan, autoStart, classHit, wantSet, WANTDEF, get cfg(){ return SC; }};
})();
