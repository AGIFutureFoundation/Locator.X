/* locator.x — house-hack finder: FHA owner-occupied math over the full 2-4 unit inventory */
(function(){
'use strict';
const L=()=>window.LX, D=()=>window.LXDash;
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const FHAL={1:1209750,2:1548975,3:1872225,4:2326875};
const pct=(v,d=1)=>L().fmtPct(v,d);
let f={city:'', units:'', fha:true, ss:false, cash:'', sus:false}, shown=200, computed=null;

function pay(loan, rate, term){ const r=rate/100/12, n=term*12; return r>0? loan*r/(1-Math.pow(1+r,-n)) : loan/n; }
function hack(l){
  const X=L(); const a=X.state.assump; const P=X.price(l); const units=Math.min(4, l.units||2);
  const elig=P<=FHAL[units];
  const loanBase=P*0.965, loan=loanBase*1.0175;               // 3.5% down, UFMIP 1.75% financed
  const rate=Math.max(3, a.rate-0.3);
  const pi=pay(loan, rate, a.term), mip=loanBase*0.0055/12;
  const tax=P*X.taxRate(l)/100/12, ins=Math.max(1200,P*a.ins/100)/12;
  const pitia=pi+mip+tax+ins;
  const re=X.rentEstimate(l); const totRent=re.rent;          // all units, monthly
  const otherRent=totRent*(units-1)/units;
  const upkeep=totRent*(a.maint+a.capex)/100, util=45*units;
  const cost=pitia+upkeep+util-otherRent*(1-a.vacancy/100);   // your monthly cost to live there
  const mk=X.marketFor(l); const zipRent=mk.zori||null;       // what renting typical home in that ZIP costs
  const save=zipRent!=null? zipRent-cost : null;
  const ss=units>=3? totRent*0.75>=pitia : null;              // FHA self-sufficiency
  const an=D().analyze(l); const sus=an? an.sus : false;
  const cover=pitia>0? otherRent/pitia*100 : null;
  const cashNeed=P*0.035+P*a.closing/100;
  return {l,P,units,elig,rate,pitia,pi,mip,tax,ins,totRent,otherRent,cost,zipRent,save,ss,cover,cashNeed,rentHow:re.how,sus};
}
/* WHO IS A CANDIDATE. This used to require l.hh, a flag only build_data.py (the
   Bay builder) ever sets — so in every other edition the finder computed over an
   empty set and rendered an empty screen, which is why all eleven specs hid the
   tab. Measured 2026-09-15 across the fleet: every edition carries 2-4 unit
   stock (750, 450, 360, 300, 270, 240, 180, 180, 8 ...) and NOT ONE record
   anywhere carries hh.

   Owner-occupied 2-4 unit candidacy is a property of the record, not of a
   builder: the unit count says it. The flag is still honoured where a builder
   set it deliberately. */
/* Exported so twin.js asks THIS function instead of keeping its own copy of the
   rule. Every surface that has kept a private copy of a candidacy rule in this
   project has drifted from it: the operating-expense stack, the evidence field
   list, and the conversion lab, which was gated on a flag two of seventeen
   builders set while the map lens kept a second copy of the same mistake. */
function candidate(l){
  if(!l) return false;
  const u = l.units || 1;
  return (l.hh || (u >= 2 && u <= 4)) && u >= 2 && u <= 4;
}
function candidates(){ return L().allListings().filter(candidate); }
/* The sale dates this edition's candidates actually carry — the lede used to
   assert "sold 2022–2024 in San Francisco and Alameda County" in every edition,
   including the Louisiana and national ones. */
function dateRange(rows){
  const ds = rows.map(h => (h.l.priceDate || '').slice(0, 4)).filter(y => /^\d{4}$/.test(y));
  if(!ds.length) return '';
  const lo = ds.reduce((a, b) => a < b ? a : b), hi = ds.reduce((a, b) => a > b ? a : b);
  return lo === hi ? ', recorded ' + lo : ', recorded ' + lo + '\u2013' + hi;
}
function compute(){ computed=candidates().map(hack); return computed; }
function filteredRows(){
  const rows=(computed||compute()).filter(h=>{
    if(f.city && h.l.city!==f.city) return false;
    if(f.units && String(h.units)!==f.units) return false;
    if(f.fha && !h.elig) return false;
    if(f.ss && h.ss===false) return false;
    if(f.cash && h.cashNeed>+f.cash) return false;
    if(!f.sus && h.sus) return false;
    return true;
  });
  rows.sort((a,b)=>(b.save??-1e9)-(a.save??-1e9));
  return rows;
}
function render(){
  const X=L(); compute();
  const all=computed; $('#hhtotal').textContent=all.length.toLocaleString('en-US');
  const rng=$('#hhrange'); if(rng) rng.textContent=dateRange(all);
  /* An edition with no 2-4 unit stock says so rather than drawing empty tiles,
     an empty chart and a headless table. */
  if(!all.length){
    $('#hhtiles').innerHTML='<div class="tile" style="grid-column:1/-1"><div class="v">None</div>'
      + '<div class="l">this edition carries no two-to-four-unit records</div>'
      + '<div class="d">The finder needs a unit count of 2\u20134 on the record. Nothing is '
      + 'hidden here \u2014 there is nothing to show.</div></div>';
    $('#hhchart').innerHTML=''; $('#hhboards').innerHTML='';
    $('#hhtable thead').innerHTML=''; $('#hhtable tbody').innerHTML='';
    $('#hhcount').textContent='0 match';
    return;
  }
  const cs=[...new Set(all.map(h=>h.l.city))].sort(); const sel=$('#hh_city'); const cur=f.city;
  sel.innerHTML='<option value="">All cities</option>'+cs.map(c=>`<option ${cur===c?'selected':''}>${X.esc(c)}</option>`).join('');
  const rows=filteredRows();
  $('#hhcount').textContent=`${rows.length.toLocaleString('en-US')} match`;
  const paying=rows.filter(h=>h.cost<=0).length, beatRent=rows.filter(h=>h.save!=null&&h.save>0).length;
  const best=rows[0]; const cheapest=rows.slice().sort((a,b)=>a.cashNeed-b.cashNeed)[0]; const ssn=rows.filter(h=>h.ss===true).length;
  $('#hhtiles').innerHTML=`
    <div class="tile"><div class="v" style="color:var(--cat2)">${rows.length.toLocaleString('en-US')}</div><div class="l">house-hack candidates match your filters</div><div class="d">${all.length.toLocaleString('en-US')} two-to-four-unit records in this edition${X.esc(dateRange(all))}</div></div>
    <div class="tile"><div class="v" style="color:${beatRent?'var(--good)':'var(--bad)'}">${beatRent}</div><div class="l">cheaper than renting in their ZIP</div><div class="d">${paying? paying+' of them pay YOU to live there':'at FHA 3.5% down and '+(X.state.assump.rate-0.3).toFixed(2)+'%'}</div></div>
    <div class="tile"><div class="v">${best? X.fmt$(best.cost)+'/mo' : '—'}</div><div class="l">best deal vs renting — your cost</div><div class="d">${best? X.esc(best.l.addr)+', '+X.esc(best.l.city)+' ('+best.units+' units)':''}</div></div>
    <div class="tile"><div class="v">${cheapest? X.fmt$(cheapest.cashNeed):'—'}</div><div class="l">smallest cash to close</div><div class="d">${cheapest? X.esc(cheapest.l.addr)+', '+X.esc(cheapest.l.city):''} · ${ssn} pass self-sufficiency</div></div>`;
  renderChart(rows); renderBoards(rows); renderTable(rows);
}
function renderChart(rows){
  const X=L(); const box=$('#hhchart'); const top=rows.filter(h=>h.zipRent!=null).slice(0,25);
  if(!top.length){ box.innerHTML='<p style="font-size:13px;color:var(--muted)">Nothing matches — loosen the filters.</p>'; return; }
  const W=980, rowH=24, pl=250, pr=30; const H=top.length*rowH+40;
  const vals=top.flatMap(h=>[h.cost,h.zipRent]); const min=Math.min(0,...vals), max=Math.max(...vals)*1.05;
  const xs=v=>pl+(v-min)/(max-min)*(W-pl-pr);
  let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">`;
  s+=`<line x1="${xs(0)}" x2="${xs(0)}" y1="6" y2="${H-28}" stroke="var(--line2)"/><text x="${xs(0)}" y="${H-16}" text-anchor="middle" font-size="10" fill="var(--muted)">$0</text>`;
  top.forEach((h,i)=>{ const y=10+i*rowH+7; const a=xs(h.cost), b=xs(h.zipRent); const good=h.cost<h.zipRent;
    s+=`<text x="${pl-8}" y="${y+4}" text-anchor="end" font-size="11" fill="var(--ink)">${X.esc(h.l.addr)}, ${X.esc(h.l.city)} · ${h.units}u</text>`;
    s+=`<line x1="${Math.min(a,b)}" x2="${Math.max(a,b)}" y1="${y}" y2="${y}" stroke="${good?'var(--good)':'var(--cat5)'}" stroke-width="2" opacity="0.55"/>`;
    s+=`<circle cx="${b}" cy="${y}" r="5" fill="var(--panel)" stroke="var(--ink2)" stroke-width="1.5"><title>ZIP ${h.l.zip} typical rent $${X.fmtN(h.zipRent)}/mo</title></circle>`;
    s+=`<circle cx="${a}" cy="${y}" r="5.5" fill="${good?'var(--good)':'var(--cat5)'}" stroke="var(--panel)" stroke-width="1.5"><title>${X.esc(h.l.addr)} — your cost ${X.fmt$(h.cost)}/mo as owner-occupant</title></circle>`;
    s+=`<text x="${Math.max(a,b)+8}" y="${y+4}" font-size="10.5" font-family="var(--mono)" fill="${good?'var(--good)':'var(--cat5)'}">${h.save>0?'saves $'+X.fmtN(h.save):'costs $'+X.fmtN(-h.save)+' more'}</text>`; });
  s+=`</svg><div class="legend2"><span><i style="--c:var(--good)"></i>Your monthly cost (owner-occupant)</span><span style="display:inline-flex;align-items:center;gap:5px"><i style="background:var(--panel);border:1.5px solid var(--ink2)"></i>ZIP typical rent</span></div>`;
  box.innerHTML=s;
}
function renderBoards(rows){
  const X=L(); const by={};
  rows.forEach(h=>{ (by[h.l.city]=by[h.l.city]||[]).push(h); });
  const cities=Object.entries(by).sort((a,b)=>b[1].length-a[1].length).slice(0,8);
  $('#hhboards').innerHTML=cities.map(([city,hs])=>{ const top=hs.slice(0,4); return `<div class="board" style="--c:var(--cat2)"><h3>${X.esc(city)}</h3><p>${hs.length} candidates · median cost ${X.fmt$(X.median(hs.map(h=>h.cost)))}/mo vs typical rent ${X.fmt$(X.median(hs.filter(h=>h.zipRent).map(h=>h.zipRent)))}/mo</p>${top.map(h=>`<div class="row" data-id="${h.l.id}"><b>${X.esc(h.l.addr)}</b><span class="m">${h.cost<=0?'+':''}${X.fmt$(Math.abs(h.cost))}/mo${h.cost<=0?' to you':''}</span><span class="s">${h.units} units · ${X.fmt$(h.P)} · other units cover ${h.cover?h.cover.toFixed(0):'—'}% of PITI${h.ss===true?' · self-sufficient':''}</span></div>`).join('')}</div>`; }).join('');
  $$('#hhboards .row').forEach(r=>r.addEventListener('click', ()=>{ L().showView('uw'); window.LXUW.openSheet(r.dataset.id); }));
}
function renderTable(rows){
  const X=L();
  $('#hhtable thead').innerHTML=`<tr><th>#</th><th>Property</th><th>City</th><th class="r">Units</th><th class="r">Price paid</th><th class="r">Sale/record</th><th class="r">Est. rent (all)</th><th class="r">PITI+MIP</th><th class="r">Your cost/mo</th><th class="r">ZIP rent</th><th class="r">You save</th><th>Coverage</th><th>FHA ceiling</th><th></th></tr>`;
  const list=rows.slice(0,shown);
  $('#hhtable tbody').innerHTML=list.map((h,i)=>{ const cvr=Math.min(130,h.cover||0); return `<tr data-id="${h.l.id}"><td class="r">${i+1}</td><td><b>${X.esc(h.l.addr)}</b>${h.l.nb?`<br><span style="font-size:11px;color:var(--muted)">${X.esc(h.l.nb)}</span>`:''}</td><td>${X.esc(h.l.city)}</td><td class="r">${h.units}${/secondary/i.test(h.l.kind)?' (SFR+ADU)':''}</td><td class="r">${X.fmt$(h.P)}</td><td class="r">${(X.recordDate(h.l)||'').slice(0,7)}</td><td class="r">$${X.fmtN(h.totRent)}</td><td class="r">$${X.fmtN(h.pitia)}</td><td class="r" style="color:${h.cost<(h.zipRent??Infinity)?'var(--good)':'var(--bad)'};font-weight:600">${h.cost<=0? '+$'+X.fmtN(-h.cost)+' to you' : '$'+X.fmtN(h.cost)}</td><td class="r">${h.zipRent?'$'+X.fmtN(h.zipRent):'—'}</td><td class="r ${h.save>0?'pos':'neg'}">${h.save!=null? (h.save>0?'+':'')+'$'+X.fmtN(h.save):'—'}</td><td><div style="width:90px" class="bar-outer"><div style="height:7px;border-radius:4px;background:var(--panel2);overflow:hidden"><i style="display:block;height:100%;width:${cvr/1.3}%;background:${h.cover>=100?'var(--good)':h.cover>=75?'var(--cat3)':'var(--cat5)'}"></i></div><span style="font-size:10px;color:var(--muted)">${h.cover?h.cover.toFixed(0)+'% of PITI':''}</span></div></td><td>${h.elig? (h.ss===false? '<span class="badge warn" title="Within the national FHA ceiling, but 75% of gross rent does not cover the payment — the 3–4 unit self-sufficiency test.">within ceiling · self-suff fails</span>' : '<span class="badge good" title="Within the 2025 national FHA ceiling. Limits are set per county between a floor and that ceiling, so this is an upper bound, not eligibility — check the county.">within ceiling</span>') : '<span class="badge bad" title="Above even the national high-cost ceiling, so no county limit reaches it.">over ceiling</span>'}</td><td style="white-space:nowrap"><button class="btn" data-act="uw">Underwrite</button> <button class="btn" data-act="map">Map</button></td></tr>`; }).join('') + (rows.length>shown? `<tr><td colspan="14"><button class="btn" id="hhmore">Show ${Math.min(500,rows.length-shown)} more of ${rows.length}</button></td></tr>`:'');
  const hm=$('#hhmore'); if(hm) hm.onclick=()=>{ shown+=500; renderTable(filteredRows()); };
  $$('#hhtable [data-act]').forEach(b=>b.addEventListener('click', e=>{ const id=b.closest('tr').dataset.id; if(b.dataset.act==='map') X.select(id,true); else { const s=(L().store('uwscen')||{}); X.showView('uw'); window.LXUW.openSheet(id); } }));
}
['hh_city','hh_units'].forEach(id=>$('#'+id).addEventListener('change', e=>{ f[id.slice(3)]=e.target.value; shown=200; render(); }));
$('#hh_fha').addEventListener('change', e=>{ f.fha=e.target.checked; render(); });
$('#hh_ss').addEventListener('change', e=>{ f.ss=e.target.checked; render(); });
$('#hh_sus').addEventListener('change', e=>{ f.sus=e.target.checked; render(); });
$('#hh_cash').addEventListener('input', e=>{ f.cash=e.target.value; render(); });
window.LXHH={render, hack, candidate};
})();
