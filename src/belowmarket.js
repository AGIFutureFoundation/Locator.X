/* locator.x — below-market assessment engine.
   Three independent, honestly-separated measures of "below market", plus the upgrade
   options that close the gap. Nothing here claims a discount the records don't support. */
(function(){
'use strict';
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const L=()=>window.LX, D=()=>window.LXDash;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* Typical value for a property of this shape in this ZIP, from the live index. */
function typicalFor(l){
  const mk=L().marketFor(l); if(!mk||!mk.zhvi) return null;
  const u=l.units||1;
  // a duplex is not 2x a median home; income stock scales sub-linearly on the value index
  const m = u>=20? u*0.42 : u>=5? u*0.5 : u>1? 1+(u-1)*0.62 : 1;
  return mk.zhvi*m;
}
/* 1. Recorded basis vs the ZIP's typical value. Under Prop 13 this is TENURE, not a discount. */
function basisGap(l){
  if(l.est) return null;
  const t=typicalFor(l), p=L().price(l);
  if(!t||!p) return null;
  return {pct: clamp((t-p)/t*100, -60, 95), t};
}
/* 2. Price per square foot against the city's median — a real comparative measure. */
function ppsfGap(l){
  if(!l.sqft||l.sqft<200) return null;
  const cp=D().cityPpsfOf(l.city); if(!cp) return null;
  const ppsf=L().price(l)/l.sqft;
  return {pct: clamp((cp-ppsf)/cp*100, -80, 90), ppsf, cityPpsf:cp};
}
/* 3. An actual recorded transaction (l.sale + l.saleDate — comps.js's own
   'sale' basis) that closed under the ZIP's typical value: the one figure
   here that is not an assessor's opinion. This used to run on l.priceDate
   and L().price(l) instead - the SAME assessed-value field measure #1
   (basisGap, two lines up) already hedges honestly as "Prop 13 tenure
   signal... NOT a purchase discount" - while this measure labelled the
   identical number "Recorded sale... an actual transaction, the strongest
   evidence here" and weighted it highest of the three. A record with no
   real sale at all could earn the "hard" (transaction-backed) tier that
   assess() computes and the UI both filters on and renders as a caveat,
   on nothing but a reassessment date. */
function saleGap(l){
  if(l.est||!(l.sale!=null&&l.saleDate)) return null;
  const age=(Date.now()-new Date(l.saleDate).getTime())/2628e6; // months
  if(age>42) return null;
  const t=typicalFor(l), p=l.sale;
  if(!t||!p) return null;
  return {pct: clamp((t-p)/t*100, -60, 90), months:Math.round(age)};
}
/* Composite — evidence-weighted, never averaging a measure that isn't there. */
function assess(l){
  const b=basisGap(l), q=ppsfGap(l), s=saleGap(l);
  const parts=[];
  if(s) parts.push({k:'sale', w:0.5, pct:s.pct, label:'Recorded sale '+fmtPct(s.pct)+' under ZIP typical', sub:'closed '+s.months+' months ago — an actual transaction, the strongest evidence here', strong:true});
  if(q) parts.push({k:'ppsf', w:0.3, pct:q.pct, label:'$'+Math.round(q.ppsf)+'/sf vs $'+Math.round(q.cityPpsf)+'/sf city median', sub:fmtPct(q.pct)+' below the median price per square foot in '+l.city, strong:true});
  if(b) parts.push({k:'basis', w:0.2, pct:b.pct, label:'Assessed basis '+fmtPct(b.pct)+' under ZIP typical value', sub:'Prop 13 tenure signal — a long hold, NOT a purchase discount. It marks an owner who may sell, not a price you can pay.', strong:false});
  if(!parts.length) return null;
  const tw=parts.reduce((t,p)=>t+p.w,0);
  const idx=parts.reduce((t,p)=>t+p.w*clamp(p.pct,0,90),0)/tw;
  const hard=parts.filter(p=>p.strong&&p.pct>0).length;         // measures backed by a transaction or comps
  return {idx:Math.round(idx), parts, hard, basis:b, ppsf:q, sale:s, typical:typicalFor(l)};
}
function fmtPct(v){ return (v>0?'':'')+v.toFixed(0)+'%'; }

/* Upgrade options — what closes the gap, priced from the development engine. */
function upgrades(l){
  let dv=null; try{ dv=window.LXDev.assess(l); }catch(e){ return null; }
  if(!dv) return null;
  const live=dv.list.filter(o=>o.feas!=='no'&&o.capex>0);
  const best=live.slice().sort((a,b)=>b.profit-a.profit).slice(0,3);
  const unlocked=best.reduce((t,o)=>t+Math.max(0,o.profit),0);
  return {best, unlocked, all:live.length, summary:dv.summary};
}

/* Which records qualify as the hunt: income property and upgrade candidates. */
const TYPES=[
 ['all','Every below-market match',()=>true],
 ['mf','Multifamily (2+ units)', l=>(l.units||1)>=2],
 ['apt','Apartment buildings (5+)', l=>(l.units||1)>=5],
 ['hotel','Hotels, motels, lodging', l=>/hotel|motel|lodging|sro|inn/i.test(l.kind||'')],
 ['upg','Residences with upgrade room', l=>(l.units||1)<=2 && (l.lot||l.sqft||l.year)],
 ['comm','Commercial & mixed use', l=>/commercial|office|retail|industrial|warehouse|mixed/i.test(l.kind||'')]
];
let ST={type:'all', min:15, hardOnly:false, shown:60};
let cache=null, cacheSig='';
function candidates(){
  const X=L(); const VW=(window.LXView&&window.LXView.active())? window.LXView : null;
  const sig=X.allListings().length+':'+ST.type+':'+ST.min+':'+ST.hardOnly+':'+(VW?JSON.stringify(VW.state):0);
  if(cache&&cacheSig===sig) return cache;
  const f=TYPES.find(t=>t[0]===ST.type)[2];
  const out=[];
  const all=X.allListings();
  const cap=Math.min(all.length, 120000);
  for(let i=0;i<cap;i++){
    const l=all[i];
    if(VW && !VW.pass(l)) continue;
    if(!f(l)) continue;
    const a=assess(l);
    if(!a||a.idx<ST.min) continue;
    if(ST.hardOnly && !a.hard) continue;
    out.push({l, a});
  }
  out.sort((p,q)=>q.a.idx-p.a.idx);
  cache=out.slice(0,4000); cache.scanned=cap; cache.total=out.length; cacheSig=sig;
  return cache;
}

/* ---------- render ---------- */
function render(){
  const root=$('#bmroot'); if(!root) return;
  const X=L();
  if(!root.dataset.built){
    root.dataset.built='1';
    root.innerHTML=`
    <div class="tile" data-panel data-panel-title="Below-market hunt — controls">
      <p class="eyebrow">The hunt</p>
      <h3 style="margin:2px 0 6px">Multifamily, apartment buildings, hotels and upgrade candidates trading under the market</h3>
      <p class="chartnote">Three measures run independently and only where the records support them: an actual <b>recorded sale</b> under the ZIP's typical value, a <b>price per square foot</b> under the city median, and the <b>assessed basis</b> gap. The first two are real comparative evidence. The third is Prop 13 tenure — it marks an owner who has held for decades and may sell, <b>not a price you can pay</b>. The index below weights them 50 / 30 / 20 and never averages in a measure it doesn't have.</p>
      <div class="toolbar" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <select id="bmtype">${TYPES.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join('')}</select>
        <label style="font-size:12px;color:var(--muted)">Min index <input type="number" id="bmmin" value="${ST.min}" min="0" max="90" style="width:70px"></label>
        <label style="font-size:12px;color:var(--muted)"><input type="checkbox" id="bmhard"> only where a sale or comps back it</label>
        <span id="bmcount" style="font-family:var(--mono);font-size:12.5px;margin-left:auto"></span>
      </div>
    </div>
    <div id="bm3d"></div>
    <div class="tablewrap" data-panel data-panel-title="Below-market candidates"><table class="grid" id="bmtable"><thead></thead><tbody></tbody></table></div>
    <div id="bmsheet"></div>`;
    $('#bmtype').addEventListener('change',e=>{ ST.type=e.target.value; ST.shown=60; refresh(); });
    $('#bmmin').addEventListener('change',e=>{ ST.min=+e.target.value||0; ST.shown=60; refresh(); });
    $('#bmhard').addEventListener('change',e=>{ ST.hardOnly=e.target.checked; ST.shown=60; refresh(); });
  }
  refresh();
}
function refresh(){
  const X=L(); const rows=candidates();
  $('#bmcount').textContent=rows.length? (rows.total||rows.length).toLocaleString()+' of '+(rows.scanned||0).toLocaleString()+' records scanned clear the bar · top '+rows.length.toLocaleString()+' ranked here' : 'no matches at this threshold';
  $('#bmtable thead').innerHTML='<tr><th>#</th><th>Property</th><th>City</th><th>Type</th><th class="r">Units</th><th class="r">Recorded</th><th class="r">ZIP typical</th><th class="r">Index</th><th>Evidence</th><th class="r">Upgrade upside</th><th></th></tr>';
  const shown=rows.slice(0,ST.shown);
  $('#bmtable tbody').innerHTML=shown.map((r,i)=>{
    const l=r.l, a=r.a;
    const ev=a.parts.map(p=>`<span class="chip" style="font-size:10px;padding:1px 6px;${p.strong?'border-color:var(--good);color:var(--good)':''}">${p.k==='sale'?'sale':p.k==='ppsf'?'$/sf':'basis'} ${p.pct.toFixed(0)}%</span>`).join(' ');
    const up=upgrades(l);
    return `<tr data-id="${l.id}"><td class="r">${i+1}</td><td><b>${X.esc(l.addr)}</b></td><td>${X.esc(l.city)}</td><td style="font-size:12px">${X.esc(l.kind||'')}</td><td class="r">${l.units||1}</td><td class="r">${X.fmt$(X.price(l))}${l.est?'<span style="color:var(--bad)">*</span>':''}</td><td class="r">${a.typical?X.fmt$(a.typical):'—'}</td><td class="r"><b style="color:${a.idx>=45?'var(--good)':a.idx>=25?'var(--warn)':'var(--ink2)'}">${a.idx}</b></td><td>${ev}</td><td class="r">${up&&up.unlocked>0?'<span class="pos">+'+X.fmt$(up.unlocked)+'</span>':'—'}</td><td><button class="btn" data-bm="${l.id}">Assess</button></td></tr>`;
  }).join('') + (rows.length>shown.length? `<tr><td colspan="11"><button class="btn" id="bmmore">Show more</button></td></tr>`:'');
  const mo=$('#bmmore'); if(mo) mo.onclick=()=>{ ST.shown+=60; refresh(); };
  $$('#bmtable [data-bm]').forEach(b=>b.addEventListener('click',()=>sheet(b.dataset.bm)));
  $$('#bmtable tr[data-id]').forEach(tr=>tr.addEventListener('dblclick',()=>X.select(tr.dataset.id,true)));
  try{ if(window.LX3D) LX3D.render(rows); }catch(e){}
  try{ if(window.LXPanels) LXPanels.scan('below'); }catch(e){}
}
function sheet(id){
  const X=L(); const l=X.allListings().find(x=>x.id===id); if(!l) return;
  const a=assess(l), up=upgrades(l), an=D().analyze(l);
  const box=$('#bmsheet');
  box.innerHTML=`<div class="tile" style="margin-top:14px" data-panel data-panel-title="Assessment — ${X.esc(l.addr)}">
    <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">
      ${D().ring(an.score, an.cat, 76, true)}
      <div style="flex:1;min-width:280px">
        <div class="eyebrow">Below-market assessment</div>
        <h3 style="margin:2px 0 4px">${X.esc(l.addr)}, ${X.esc(l.city)}</h3>
        <div style="font-size:13px;color:var(--muted)">${X.esc(l.kind||'')} · ${l.units||1} unit${(l.units||1)>1?'s':''}${l.sqft?' · '+X.fmtN(l.sqft)+' sf':''}${l.year?' · built '+l.year:''} · recorded ${X.fmt$(X.price(l))}${l.priceDate?' on '+l.priceDate:''}</div>
      </div>
      <div style="text-align:right"><div style="font-family:var(--mono);font-size:34px;font-weight:600;color:${a.idx>=45?'var(--good)':'var(--ink)'}">${a.idx}</div><div style="font-size:11px;color:var(--muted)">below-market index</div></div>
    </div>
    <div style="margin-top:12px">${a.parts.map(p=>`<div style="border-left:3px solid ${p.strong?'var(--good)':'var(--line2)'};padding:6px 12px;margin:8px 0;background:var(--panel2);border-radius:0 8px 8px 0">
      <b style="font-size:13px">${p.label}</b><div style="font-size:12.5px;color:var(--ink2);margin-top:2px">${p.sub}</div></div>`).join('')}
      ${!a.hard? '<p class="src" style="margin-top:6px"><b>Read this carefully:</b> nothing here is backed by a transaction or by comparable price-per-square-foot data — only the assessed basis. Treat it as a lead on a long-tenure owner, not as evidence the property is worth more than its basis.</p>':''}
    </div>
    ${up&&up.best.length? `<h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 6px">Upgrade options that close the gap</h4>
      <div class="devcards">${up.best.map(o=>`<div class="devcard"><div class="dh"><b>${o.name}</b><span class="badge">${o.months} mo</span></div><div class="basis">${o.basis}.</div>
        <div class="nums"><span>Cost<b>${X.fmt$(o.capex)}</b></span>${o.addRent?`<span>Adds rent<b class="pos">+$${X.fmtN(o.addRent)}/mo</b></span>`:''}<span>Adds value<b>${X.fmt$(o.addValue)}</b></span><span>Profit<b class="${o.profit>0?'pos':'neg'}">${(o.profit>0?'+':'')+X.fmt$(o.profit)}</b></span></div>
        <div class="note">${o.note}</div></div>`).join('')}</div>
      <p class="src">Combined upside on the three strongest plays: <b>${X.fmt$(up.unlocked)}</b>. Costs come from the editable cost library on the Underwrite tab — set them to your own contractor's numbers before trusting them.</p>`:''}
    <div class="toolbar" style="margin-top:10px"><button class="btn" id="bmmap">Open on map</button><button class="btn primary" id="bmuw">Underwrite it</button><button class="btn" id="bmclose">Close</button></div>
  </div>`;
  $('#bmmap').onclick=()=>X.select(l.id,true);
  $('#bmuw').onclick=()=>{ X.showView('uw'); setTimeout(()=>{ try{ window.LXUW.openSheet(l.id); }catch(e){} },300); };
  $('#bmclose').onclick=()=>{ box.innerHTML=''; };
  box.scrollIntoView({behavior:'smooth',block:'start'});
  try{ if(window.LXPanels) LXPanels.scan('below'); }catch(e){}
}
window.LXBM={render, assess, upgrades, candidates, get state(){ return ST; }};
})();
