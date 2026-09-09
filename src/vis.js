/* locator.x — Motion & fabric dataviz: a Gapminder/Trendalyzer-style animated ZIP bubble
   chart (after Hans Rosling) and a 3D-shaded Voronoi bubble fabric of the catalog. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const L=()=>window.LX;
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const CATCOL={asset:'--cat1',hack:'--cat2',value:'--cat3',growth:'--cat4',liab:'--cat5'};
const CATNAME={asset:'Cash-flow asset',hack:'House-hack',value:'Value-add',growth:'Appreciation bet',liab:'Liability'};
/* Categorical hues come from the validated slot order and are assigned in
   fixed order, never cycled: a ninth county folds into a muted "Other" rather
   than being handed a generated hue that would collide with slot 1. The old
   list here carried four greens and an olive, which is exactly why counties
   blurred together. */
const P=()=>window.LXPal;
const ctyColor=i=> i<8 ? P().c(i+1) : P().tok('--muted');
let tip=null, mc=null, vor=null, playing=true, frame=12, raf=0, lastT=0, rowsRef=[];
const SPEED=1.15; // seconds per month

function tipEl(){ if(!tip){ tip=document.createElement('div'); tip.style.cssText='position:fixed;z-index:80;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:12px;box-shadow:var(--shadow);pointer-events:none;max-width:260px;display:none;color:var(--ink)'; document.body.appendChild(tip); } return tip; }
function tShow(e,html){ const t=tipEl(); t.innerHTML=html; t.style.display='block'; const w=t.offsetWidth; t.style.left=Math.min(innerWidth-w-8, e.clientX+12)+'px'; t.style.top=(e.clientY+12)+'px'; }
function tHide(){ if(tip) tip.style.display='none'; }
function toMarket(zip){ const X=L(); X.showView('market'); const mq=$('#mq'); if(mq){ mq.value=zip; mq.dispatchEvent(new Event('input')); } }
function setupCanvas(host, h){
  host.innerHTML=''; const c=document.createElement('canvas'); const w=host.clientWidth||640; const dpr=Math.min(2,window.devicePixelRatio||1);
  c.width=w*dpr; c.height=h*dpr; c.style.width=w+'px'; c.style.height=h+'px'; host.appendChild(c);
  const ctx=c.getContext('2d'); ctx.scale(dpr,dpr); return {c,ctx,w,h};
}
function sphere(ctx,x,y,r,color,alpha){
  ctx.save(); ctx.globalAlpha=alpha==null?0.92:alpha;
  const g=ctx.createRadialGradient(x-r*0.35,y-r*0.4,r*0.1,x,y,r);
  g.addColorStop(0,shade(color,55)); g.addColorStop(0.55,color); g.addColorStop(1,shade(color,-38));
  ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fillStyle=g; ctx.fill();
  ctx.beginPath(); ctx.arc(x-r*0.35,y-r*0.42,r*0.22,0,7); ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fill();
  ctx.restore();
}
function shade(hex,amt){
  const n=hex.replace('#',''); const v=n.length===3? n.split('').map(ch=>ch+ch).join(''):n;
  const r=Math.max(0,Math.min(255,parseInt(v.slice(0,2),16)+amt)), g=Math.max(0,Math.min(255,parseInt(v.slice(2,4),16)+amt)), b=Math.max(0,Math.min(255,parseInt(v.slice(4,6),16)+amt));
  return 'rgb('+r+','+g+','+b+')';
}

/* ================= motion chart ================= */
function buildMotion(){
  const X=L(); const M=X.M, BA=X.BA;
  const counts={}; BA.listings.forEach(l=>{ if(l.zip) counts[l.zip]=(counts[l.zip]||0)+1; });
  const ents=[]; const counties=[];
  Object.keys(M.zips).forEach(z=>{
    const e=M.zips[z]; if(!e.v||!e.r) return;
    const pts=[];
    for(let t=12;t<e.v.length;t++){
      if(e.v[t]&&e.r[t]&&e.v[t-12]) pts[t]={x:e.r[t]*12/e.v[t]*100, y:(e.v[t]/e.v[t-12]-1)*100, v:e.v[t]};
    }
    if(!pts.filter(Boolean).length) return;
    const county=e.county||'Other'; if(!counties.includes(county)) counties.push(county);
    ents.push({zip:z, city:e.city||'', county, n:counts[z]||0, pts});
  });
  counties.sort();
  const maxT=L().M.months.length-1;
  return {ents, counties, maxT};
}
function at(ent,f){
  const t0=Math.floor(f), t1=Math.min(Math.ceil(f), ent.pts.length-1);
  const a=ent.pts[t0], b=ent.pts[t1]||a; if(!a||!b) return a||b||null;
  const k=f-t0; return {x:a.x+(b.x-a.x)*k, y:a.y+(b.y-a.y)*k, v:a.v};
}
function drawMotion(){
  if(!mc) return;
  const {ctx,w,h,data}=mc; const X=L();
  const dark=matchMedia('(prefers-color-scheme: dark)').matches&&document.documentElement.dataset.theme!=='light'||document.documentElement.dataset.theme==='dark';
  ctx.clearRect(0,0,w,h);
  const pl=44,pr=12,pt=10,pb=34;
  const xmin=1.2,xmax=8.2,ymin=-14,ymax=16;
  const sx=x=>pl+(x-xmin)/(xmax-xmin)*(w-pl-pr), sy=y=>pt+(ymax-y)/(ymax-ymin)*(h-pt-pb);
  // big month label
  const mi=Math.round(frame); const mon=(X.M.months[Math.min(mi,data.maxT)]||'').slice(0,7);
  ctx.font='700 64px ui-monospace,monospace'; ctx.fillStyle=dark?'rgba(150,170,205,0.13)':'rgba(30,50,80,0.08)'; ctx.textAlign='center'; ctx.fillText(mon, w/2, h/2+22);
  // grid + axes
  ctx.strokeStyle=css('--line')||'#ddd'; ctx.fillStyle=css('--muted')||'#888'; ctx.lineWidth=1; ctx.font='10px ui-monospace,monospace';
  for(let gx=2;gx<=8;gx++){ ctx.globalAlpha=0.55; ctx.beginPath(); ctx.moveTo(sx(gx),pt); ctx.lineTo(sx(gx),h-pb); ctx.stroke(); ctx.globalAlpha=1; ctx.textAlign='center'; ctx.fillText(gx+'%', sx(gx), h-pb+14); }
  for(let gy=-10;gy<=15;gy+=5){ ctx.globalAlpha=0.55; ctx.beginPath(); ctx.moveTo(pl,sy(gy)); ctx.lineTo(w-pr,sy(gy)); ctx.stroke(); ctx.globalAlpha=1; ctx.textAlign='right'; ctx.fillText((gy>0?'+':'')+gy+'%', pl-6, sy(gy)+3); }
  ctx.strokeStyle=css('--ink2')||'#666'; ctx.globalAlpha=0.5; ctx.beginPath(); ctx.moveTo(pl,sy(0)); ctx.lineTo(w-pr,sy(0)); ctx.stroke(); ctx.globalAlpha=1;
  ctx.textAlign='left'; ctx.fillText('gross rental yield (ZORI × 12 ÷ ZHVI) →', pl, h-6);
  ctx.save(); ctx.translate(11,h-pb); ctx.rotate(-Math.PI/2); ctx.fillText('value growth, year over year →', 0, 0); ctx.restore();
  // bubbles, small first so leaders sit on top
  const f=Math.min(frame, data.maxT);
  const order=data.ents.slice().sort((a,b)=>a.n-b.n);
  mc.hit=[];
  order.forEach(ent=>{
    const p=at(ent,f); if(!p) return;
    const r=1.8+Math.sqrt(ent.n)*0.85;
    const x=sx(Math.max(xmin,Math.min(xmax,p.x))), y=sy(Math.max(ymin,Math.min(ymax,p.y)));
    const col=ctyColor(data.counties.indexOf(ent.county));
    if(mc.trail===ent.zip){ ctx.strokeStyle=col; ctx.globalAlpha=0.8; ctx.lineWidth=1.6; ctx.beginPath(); let started=false;
      for(let t=12;t<=Math.floor(f);t++){ const q=ent.pts[t]; if(!q) continue; const qx=sx(q.x),qy=sy(q.y); started? ctx.lineTo(qx,qy):ctx.moveTo(qx,qy); started=true; }
      ctx.stroke(); ctx.globalAlpha=1; }
    sphere(ctx,x,y,r,col, ent.n? 0.92:0.4);
    if(ent.n>=170){ ctx.fillStyle=css('--ink')||'#222'; ctx.font='600 10px system-ui'; ctx.textAlign='center'; ctx.fillText(ent.zip, x, y-r-4); }
    mc.hit.push({x,y,r:r+3,ent,p});
  });
  // legend
  let lx=pl+4, ly=pt+8; ctx.font='10px system-ui'; ctx.textAlign='left';
  data.counties.forEach((cn,i)=>{ const col=ctyColor(i); if(lx>w-140){ lx=pl+4; ly+=14; } ctx.fillStyle=col; ctx.beginPath(); ctx.arc(lx+4,ly-3,4,0,7); ctx.fill(); ctx.fillStyle=css('--muted'); ctx.fillText(cn, lx+11, ly); lx+=ctx.measureText(cn).width+26; });
}
function tick(ts){
  raf=requestAnimationFrame(tick);
  if(!mc || !$('#dash') || !$('#dash').classList.contains('active')) return;
  if(playing){
    if(lastT){ frame+=(ts-lastT)/1000/SPEED; const maxT=mc.data.maxT; if(frame>maxT){ frame=maxT; playing=false; updCtrl(); } }
    drawMotion(); syncScrub();
  }
  lastT=ts;
}
function syncScrub(){ const s=$('#mscrub'); if(s) s.value=frame; }
function updCtrl(){ const b=$('#mplay'); if(b) b.textContent=playing?'❚❚ Pause':'▶ Replay'; }
function renderMotion(){
  const host=$('#c_motion'); if(!host) return;
  const data=buildMotion();
  const s=setupCanvas(host, 400);
  mc={...s, data, trail:null, hit:[]};
  const ctrl=$('#c_motion_ctrl');
  ctrl.innerHTML=`<button class="btn" id="mplay">❚❚ Pause</button>
    <input type="range" id="mscrub" min="12" max="${data.maxT}" step="0.02" value="${Math.min(frame,data.maxT)}" style="flex:1;accent-color:var(--accent)">
    <span class="src" style="white-space:nowrap">bubble = ZIP · size = sites in catalog · color = county</span>`;
  ctrl.style.cssText='display:flex;gap:10px;align-items:center;margin-top:8px';
  $('#mplay').onclick=()=>{ if(!playing && frame>=data.maxT-0.05) frame=12; playing=!playing; updCtrl(); };
  $('#mscrub').addEventListener('input', e=>{ playing=false; updCtrl(); frame=+e.target.value; drawMotion(); });
  s.c.addEventListener('mousemove', e=>{
    const b=s.c.getBoundingClientRect(); const x=e.clientX-b.left, y=e.clientY-b.top;
    let best=null,bd=1e9; (mc.hit||[]).forEach(hh=>{ const d=(hh.x-x)**2+(hh.y-y)**2; if(d<bd && d<hh.r*hh.r*4){ bd=d; best=hh; } });
    if(best){ mc.trail=best.ent.zip; const X=L(); tShow(e, `<b>${best.ent.zip}</b> · ${X.esc(best.ent.city)}<br>yield ${best.p.x.toFixed(2)}% · growth ${(best.p.y>0?'+':'')+best.p.y.toFixed(1)}%<br>ZHVI $${X.fmtN(Math.round(best.p.v))} · ${best.ent.n} sites in catalog<br><span style="color:var(--muted)">click to open this market</span>`); if(!playing) drawMotion(); }
    else { if(mc.trail && !playing){ mc.trail=null; drawMotion(); } mc.trail=playing?mc.trail:null; tHide(); }
  });
  s.c.addEventListener('mouseleave', ()=>{ tHide(); });
  s.c.addEventListener('click', e=>{
    const b=s.c.getBoundingClientRect(); const x=e.clientX-b.left, y=e.clientY-b.top;
    let best=null,bd=1e9; (mc.hit||[]).forEach(hh=>{ const d=(hh.x-x)**2+(hh.y-y)**2; if(d<bd && d<hh.r*hh.r*4){ bd=d; best=hh; } });
    if(best) toMarket(best.ent.zip);
  });
  drawMotion();
  if(!raf) raf=requestAnimationFrame(tick);
}

/* ================= 3D Voronoi bubble fabric (live, time-aware, sorts the app) ================= */
const VS={crit:'cf', t:24, playing:false, raf:0, built:null, host:null};
const CRITS=[['cf','Median cash flow (now)'],['score','Locator X score (now)'],['yield','Gross yield — over time'],['growth','Value growth — over time'],['fcast','12-mo forecast (Scout)']];
const CRIT_SORT={cf:'cf', score:'score', yield:'cap', growth:'yoy', fcast:'yoy'};
function vorBuild(rows, host, opts){
  const X=L();
  const agg={};
  rows.forEach(r=>{ const z=r.l.zip; if(!z) return; const a=agg[z]||(agg[z]={n:0,lat:0,lng:0,cats:{},cf:[],sc:[],city:r.l.city});
    a.n++; a.lat+=r.l.lat; a.lng+=r.l.lng; a.cats[r.cat]=(a.cats[r.cat]||0)+1; a.cf.push(r.d.cfMo); a.sc.push(r.score); });
  const zips=Object.keys(agg).filter(z=>agg[z].n>=3);
  if(zips.length<6) return null;
  zips.forEach(z=>{ const a=agg[z]; a.lat/=a.n; a.lng/=a.n; a.cf.sort((p,q)=>p-q); a.sc.sort((p,q)=>p-q);
    a.mcf=a.cf[Math.floor(a.cf.length/2)]; a.msc=a.sc[Math.floor(a.sc.length/2)];
    a.dom=Object.keys(a.cats).sort((p,q)=>a.cats[q]-a.cats[p])[0]; a.share=a.cats[a.dom]/a.n;
    const mz=X.M.zips[z]; a.v=mz&&mz.v; a.r=mz&&mz.r; });
  const s=setupCanvas(host, opts&&opts.h||430); const {w,h}=s;
  const lats=zips.map(z=>agg[z].lat), lngs=zips.map(z=>agg[z].lng);
  const la0=Math.min(...lats), la1=Math.max(...lats), lo0=Math.min(...lngs), lo1=Math.max(...lngs);
  const ky=Math.cos(((la0+la1)/2)*Math.PI/180);
  const spanX=(lo1-lo0)*ky||0.01, spanY=(la1-la0)||0.01; const pad=26;
  const k=Math.min((w-2*pad)/spanX, (h-2*pad)/spanY);
  const pts=zips.map(z=>[pad+((agg[z].lng-lo0)*ky)*k+(w-2*pad-spanX*k)/2, h-pad-((agg[z].lat-la0))*k-(h-2*pad-spanY*k)/2]);
  zips.map(z=>agg[z]).sort((p,q)=>q.n-p.n).forEach((a,rank)=>{ a.big=rank<10; });
  const del=d3.Delaunay.from(pts); const v=del.voronoi([0,0,w,h]);
  return {...s, agg, zips, pts, del, v};
}
function hexRGBv(x){ const n=x.replace('#',''); return [parseInt(n.slice(0,2),16),parseInt(n.slice(2,4),16),parseInt(n.slice(4,6),16)]; }
function diverge(t,dark){
  const RED=hexRGBv(P().tok('--bad')), AMB=hexRGBv(P().tok('--warn')), GRN=hexRGBv(P().tok('--good'));
  t=Math.max(0,Math.min(1,t)); const [A,B2,kk]= t<0.5? [RED,AMB,t*2]:[AMB,GRN,(t-0.5)*2];
  return 'rgb('+Math.round(A[0]+(B2[0]-A[0])*kk)+','+Math.round(A[1]+(B2[1]-A[1])*kk)+','+Math.round(A[2]+(B2[2]-A[2])*kk)+')';
}
function critVal(a,z){
  const X=L(); const T=Math.round(VS.t);
  if(VS.crit==='cf') return a.mcf;
  if(VS.crit==='score') return a.msc;
  if(VS.crit==='yield'){ if(!a.v||!a.r||!a.v[T]||!a.r[T]) return null; return a.r[T]*12/a.v[T]*100; }
  if(VS.crit==='growth'){ if(!a.v||!a.v[T]||!a.v[T-12]) return null; return (a.v[T]/a.v[T-12]-1)*100; }
  if(VS.crit==='fcast'){ try{ const f=window.LXScout&&LXScout.zipFC(z); if(!f||!f.v) return null; const h=Math.round(VS.t); const now=f.v.at?f.v.at(0):null, fut=f.v.at?f.v.at(h):null; if(!now||!fut) return (f.v.g12!=null? f.v.g12*h/12 : null); return (fut/now-1)*100; }catch(e){ return null; } }
  return null;
}
function drawVor(){
  const B=VS.built; if(!B) return;
  const X=L(); const {ctx,w,h,agg,zips,pts,v}=B;
  const dark=matchMedia('(prefers-color-scheme: dark)').matches&&document.documentElement.dataset.theme!=='light'||document.documentElement.dataset.theme==='dark';
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle=dark?'#0d1626':'#f4f6f2'; ctx.fillRect(0,0,w,h);
  const vals=zips.map(z=>critVal(agg[z],z)).filter(x=>x!=null).sort((p,q)=>p-q);
  const lo=vals[Math.floor(vals.length*0.06)]??0, hi=(vals[Math.floor(vals.length*0.94)]??1);
  zips.forEach((z,i)=>{ const a=agg[z]; const val=critVal(a,z);
    ctx.beginPath(); v.renderCell(i,ctx);
    ctx.save(); ctx.clip();
    ctx.globalAlpha=0.5; ctx.fillStyle= val==null? (dark?'#2a3648':'#d8dcd4') : diverge((val-lo)/((hi-lo)||1),dark); ctx.fill();
    const g=ctx.createRadialGradient(pts[i][0],pts[i][1],4,pts[i][0],pts[i][1],90);
    g.addColorStop(0,'rgba(255,255,255,'+(dark?0.10:0.35)+')'); g.addColorStop(1,'rgba(0,0,0,'+(dark?0.28:0.10)+')');
    ctx.globalAlpha=1; ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.restore();
    ctx.beginPath(); v.renderCell(i,ctx); ctx.strokeStyle=dark?'rgba(220,232,255,0.16)':'rgba(20,40,70,0.18)'; ctx.lineWidth=1; ctx.stroke();
  });
  const order=zips.map((z,i)=>i).sort((a,b)=>agg[zips[a]].n-agg[zips[b]].n);
  order.forEach(i=>{ const z=zips[i], a=agg[z]; const col=css(CATCOL[a.dom])||'#888';
    const r=3+Math.sqrt(a.n)*0.9;
    ctx.beginPath(); ctx.ellipse(pts[i][0],pts[i][1]+r*0.55,r*0.9,r*0.32,0,0,7); ctx.fillStyle='rgba(0,0,0,'+(dark?0.4:0.22)+')'; ctx.fill();
    sphere(ctx,pts[i][0],pts[i][1],r,col,0.96);
    if(a.big){ ctx.fillStyle=dark?'#e8eefb':'#1c2836'; ctx.font='600 10px system-ui'; ctx.textAlign='center'; ctx.fillText(z, pts[i][0], pts[i][1]-r-4); }
  });
  // time label
  const timey=VS.crit==='yield'||VS.crit==='growth'||VS.crit==='fcast';
  if(timey){ const lbl= VS.crit==='fcast'? '+'+Math.round(VS.t)+' mo forecast' : (X.M.months[Math.round(VS.t)]||'').slice(0,7);
    ctx.font='700 38px ui-monospace,monospace'; ctx.fillStyle=dark?'rgba(150,170,205,0.18)':'rgba(30,50,80,0.10)'; ctx.textAlign='right'; ctx.fillText(lbl, w-14, 42); }
}
function vorTick(ts){
  VS.raf=requestAnimationFrame(vorTick);
  if(!VS.playing||!VS.built) return;
  const maxT=VS.crit==='fcast'?12:24, minT=VS.crit==='fcast'?0:12;
  VS.t+=0.09; if(VS.t>maxT){ VS.t=maxT; VS.playing=false; const b=$('#vplay'); if(b) b.textContent='▶ Play'; }
  const s=$('#vscrub'); if(s) s.value=VS.t;
  drawVor();
}
function renderVoronoi(rows){
  const host=$('#c_voronoi'); if(!host || typeof d3==='undefined' || !d3.Delaunay){ if(host) host.innerHTML='<p class="src">Voronoi engine unavailable.</p>'; return; }
  const X=L();
  host.innerHTML='';
  const ctl=document.createElement('div'); ctl.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap';
  const hasF=!!window.LXScout;
  ctl.innerHTML=`<select id="vcrit">${CRITS.filter(c=>hasF||c[0]!=='fcast').map(c=>`<option value="${c[0]}" ${VS.crit===c[0]?'selected':''}>${c[1]}</option>`).join('')}</select>
    <button class="btn" id="vplay">▶ Play</button>
    <input type="range" id="vscrub" min="12" max="24" step="0.05" value="${VS.t}" style="flex:1;min-width:120px;accent-color:var(--accent)">
    <span class="src" style="white-space:nowrap">click a territory → sorts the property grid</span>`;
  host.appendChild(ctl);
  const cv=document.createElement('div'); host.appendChild(cv);
  VS.built=vorBuild(rows, cv, null);
  if(!VS.built){ cv.innerHTML='<p class="src">Not enough mapped inventory for the fabric.</p>'; return; }
  const syncCtl=()=>{ const timey=VS.crit==='yield'||VS.crit==='growth'||VS.crit==='fcast'; const sc=$('#vscrub');
    sc.disabled=!timey; $('#vplay').disabled=!timey;
    if(VS.crit==='fcast'){ sc.min=0; sc.max=12; if(VS.t>12) VS.t=0; } else { sc.min=12; sc.max=24; if(VS.t<12) VS.t=24; }
    sc.value=VS.t; };
  syncCtl();
  $('#vcrit').addEventListener('change',e=>{ VS.crit=e.target.value; VS.playing=false; $('#vplay').textContent='▶ Play'; syncCtl(); drawVor(); });
  $('#vplay').addEventListener('click',()=>{ if(!VS.playing){ const maxT=VS.crit==='fcast'?12:24; if(VS.t>=maxT-0.1) VS.t=VS.crit==='fcast'?0:12; } VS.playing=!VS.playing; $('#vplay').textContent=VS.playing?'❚❚ Pause':'▶ Play'; });
  $('#vscrub').addEventListener('input',e=>{ VS.playing=false; $('#vplay').textContent='▶ Play'; VS.t=+e.target.value; drawVor(); });
  const B=VS.built;
  B.c.addEventListener('mousemove', e=>{
    const b=B.c.getBoundingClientRect(); const i=B.del.find(e.clientX-b.left, e.clientY-b.top);
    if(i==null||i<0){ tHide(); return; }
    const z=B.zips[i], a=B.agg[z]; const val=critVal(a,z);
    tShow(e, `<b>${z}</b> · ${X.esc(a.city)}<br>${a.n} sites · territory: <b style="color:${css(CATCOL[a.dom])}">${CATNAME[a.dom]}</b> (${Math.round(a.share*100)}%)<br>${CRITS.find(c=>c[0]===VS.crit)[1]}: <b>${val==null?'—':(VS.crit==='cf'? (val>0?'+':'')+X.fmt$(val)+'/mo' : val.toFixed(VS.crit==='score'?0:2)+(VS.crit==='score'?'':'%'))}</b><br>median cash flow ${(a.mcf>0?'+':'')+X.fmt$(a.mcf)}/mo · median score ${a.msc}<br><span style="color:var(--muted)">click to filter + sort the grid by this</span>`);
  });
  B.c.addEventListener('mouseleave', tHide);
  B.c.addEventListener('click', e=>{
    const b=B.c.getBoundingClientRect(); const i=B.del.find(e.clientX-b.left, e.clientY-b.top);
    if(i==null||i<0) return;
    const z=B.zips[i];
    if(window.LXDash&&LXDash.filterZip){ LXDash.filterZip(z, CRIT_SORT[VS.crit]); L().toast('Grid filtered to ZIP '+z+', sorted by '+CRITS.find(c=>c[0]===VS.crit)[1].toLowerCase()); }
  });
  drawVor();
  if(!VS.raf) VS.raf=requestAnimationFrame(vorTick);
}

/* ================= Scout market pulse — real-time visual overview ================= */
function scoutPulse(){
  const host=$('#scpulse'); if(!host) return;
  const X=L(); const M=X.M;
  // county cards from city+zip series
  const byCounty={};
  Object.keys(M.zips).forEach(z=>{ const e=M.zips[z]; if(!e.v) return; const c=e.county||'Other'; (byCounty[c]=byCounty[c]||[]).push({z,e}); });
  const invByCounty={}; X.allListings().forEach(l=>{ invByCounty[l.county]=(invByCounty[l.county]||0)+1; });
  const cards=Object.keys(byCounty).filter(c=>invByCounty[c]).map(c=>{
    const rowsC=byCounty[c];
    const agg=[]; for(let t=0;t<25;t++){ const vals=rowsC.map(x=>x.e.v[t]).filter(Boolean); agg.push(vals.length? vals.reduce((s,x)=>s+x,0)/vals.length : null); }
    const last=agg.filter(Boolean).slice(-1)[0], y13=agg[12];
    const yoy=last&&y13? (last/y13-1)*100:null;
    const rents=rowsC.map(x=>x.e.r&&x.e.r.filter(Boolean).slice(-1)[0]).filter(Boolean);
    const mr=rents.length? rents.sort((p,q)=>p-q)[Math.floor(rents.length/2)]:null;
    return `<div class="tile"><div class="eyebrow">${X.esc(c)} County</div>
      <div class="v" style="font-family:var(--mono)">${last?X.fmt$(Math.round(last)):'—'}<span style="font-size:12px;color:${yoy>0?'var(--good)':'var(--bad)'}"> ${yoy!=null?(yoy>0?'▲ +':'▼ ')+yoy.toFixed(1)+'%':''}</span></div>
      <div class="d">${X.fmtN(invByCounty[c])} sites tracked · median rent ${mr?'$'+X.fmtN(Math.round(mr)):'—'}/mo</div>
      ${X.spark(agg.filter(Boolean),260,36)}</div>`;
  }).join('');
  // movers: top rising / falling zips by 3-mo momentum
  const mv=Object.keys(M.zips).map(z=>{ const v=M.zips[z].v; if(!v) return null; const a=v.filter(Boolean); if(a.length<5) return null; const m3=(a[a.length-1]/a[a.length-4]-1)*100; return {z, m3, city:M.zips[z].city}; }).filter(Boolean).sort((p,q)=>q.m3-p.m3);
  const row=(x,up)=>`<div class="row" data-zip="${x.z}" style="display:flex;gap:8px;align-items:baseline;cursor:pointer;padding:3px 0;font-size:12px"><b style="color:${up?'var(--good)':'var(--bad)'};font-family:var(--mono)">${(x.m3>0?'+':'')+x.m3.toFixed(1)}%</b><span>${x.z} · ${X.esc(x.city||'')}</span></div>`;
  host.innerHTML=`<div class="cards" style="margin-bottom:10px">${cards}</div>
  <div class="grid2"><div class="chart"><div class="eyebrow">Market pulse</div><h3>Rising — 3-month momentum</h3>${mv.slice(0,7).map(x=>row(x,true)).join('')}</div>
  <div class="chart"><div class="eyebrow">Market pulse</div><h3>Cooling — 3-month momentum</h3>${mv.slice(-7).reverse().map(x=>row(x,false)).join('')}</div></div>`;
  host.querySelectorAll('[data-zip]').forEach(el=>el.addEventListener('click',()=>{ X.showView('market'); const mq=$('#mq'); if(mq){ mq.value=el.dataset.zip; mq.dispatchEvent(new Event('input')); } }));
}

function render(rows){ rowsRef=rows||rowsRef; try{ renderMotion(); }catch(e){} try{ renderVoronoi(rowsRef); }catch(e){} }
window.LXVis={render, scoutPulse};
})();
