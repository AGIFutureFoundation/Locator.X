/* locator.x — Conversion lab: hotels & 5+ unit buildings converted to student housing
   or 2–3BR family units. Records are real (assessed basis); every valuation, capex and
   rent figure here is a MODEL, labeled as such, for screening only. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const L=()=>window.LX;
const CAP=0.055, BED_F=0.47, FAM_F=1.12;
function zori(l){ const X=L(); const z=X.M.zips[l.zip]; const r=z&&z.r? X.last(z.r):null; return r||3000; }
function model(l){
  const X=L();
  const zr=zori(l);
  const hotel=/hotel/i.test(l.kind||'');
  const sqft=l.sqft||null;
  const units=l.units||5;
  // modeled acquisition (market) value
  let mkt;
  if(hotel) mkt=units*140000; // per-key proxy, modeled
  else { const noi=units*zr*0.85*12*0.72; mkt=noi/CAP; }
  // student-housing plan
  const beds = sqft? Math.floor(sqft*0.75/420) : Math.round(units*1.6);
  const capexS = sqft? sqft*(hotel?160:120) : beds*55000;
  const noiS = beds*zr*BED_F*12*0.70;
  const valS = noiS/CAP;
  const profS = valS - mkt - capexS;
  // 2-3BR family plan
  const fam = sqft? Math.floor(sqft*0.78/900) : Math.max(3,Math.round(units*0.8));
  const capexF = sqft? sqft*100 : fam*80000;
  const noiF = fam*zr*FAM_F*12*0.72;
  const valF = noiF/CAP;
  const profF = valF - mkt - capexF;
  const best = profS>=profF? {plan:'Student housing', units:beds, unitName:'beds', capex:capexS, val:valS, prof:profS} : {plan:'2–3BR family units', units:fam, unitName:'units', capex:capexF, val:valF, prof:profF};
  return {hotel, mkt, beds, capexS, valS, profS, fam, capexF, valF, profF, best, zr};
}
let f={type:'all', county:'', minu:0, sort:'prof'};
/* WHO IS A CONVERSION CANDIDATE.

   This used to require l.cv, a flag only two of the seventeen data builders ever
   set — the same defect the house-hack finder carried on l.hh, in the same
   shape, on a different flag. Measured 2026-09-16 on the synthetic fleet: ZERO
   records carry cv and 1,250 of 2,500 qualify on their own record, so the
   Conversion lab rendered an empty screen and the map's conversion lens rendered
   a uniformly dim map, in every edition whose builder does not set the flag.

   Candidacy is a property of the RECORD, not of a builder: a lodging class or a
   building with five or more units says it. The flag is still honoured where a
   builder set it deliberately, so nothing that worked before stops working.

   Exported so src/app.js's map lens asks THIS function rather than keeping a
   second copy of the rule — the drift that cost this project its operating
   expense stack and its evidence field list. */
function candidate(l){
  if(!l) return false;
  if(l.cv) return true;
  if(/hotel|motel|lodging|sro/i.test(l.kind||'')) return true;
  return (l.units||0) >= 5;
}

function counties(){
  const X=L();
  const seen={};
  X.allListings().filter(candidate).forEach(l=>{ if(l.county) seen[l.county]=(seen[l.county]||0)+1; });
  return Object.keys(seen).sort((a,b)=>seen[b]-seen[a]);
}
function rows(){
  const X=L();
  let r=X.allListings().filter(candidate);
  if(f.type==='hotel') r=r.filter(l=>/hotel|motel|lodging/i.test(l.kind||''));
  if(f.type==='sro') r=r.filter(l=>/sro/i.test(l.kind||''));
  if(f.type==='comm') r=r.filter(l=>/commercial|industrial|mixed-use/i.test(l.kind||''));
  if(f.type==='apt') r=r.filter(l=>!/hotel|motel|sro|commercial|industrial|mixed-use|lodging/i.test(l.kind||''));
  if(f.county) r=r.filter(l=>l.county===f.county);
  if(f.minu) r=r.filter(l=>(l.units||0)>=f.minu);
  return r;
}
function render(){
  const root=$('#convroot'); if(!root) return;
  const X=L();
  const all=rows();
  const scored=all.map(l=>({l,m:model(l)})).sort((a,b)=> f.sort==='prof'? b.m.best.prof-a.m.best.prof : f.sort==='beds'? b.m.beds-a.m.beds : (b.l.units||0)-(a.l.units||0));
  const top=scored.slice(0,150);
  const totProf=scored.slice(0,100).reduce((s,x)=>s+Math.max(0,x.m.best.prof),0);
  const hotels=all.filter(l=>/hotel/i.test(l.kind||'')).length;
  root.innerHTML=`
  <h2 class="h2">Conversion lab — hotels &amp; apartment buildings → student housing</h2>
  <p class="lede" style="margin-top:0">${X.fmtN(all.length)} real buildings from the assessor rolls — ${X.fmtN(hotels)} hotels and ${X.fmtN(all.length-hotels)} 5+ unit buildings. Records are real; <b>every value, capex and rent below is a screening model</b> (ZIP ZORI × factors, ${(CAP*100).toFixed(1)}% exit cap), not an appraisal. Assessed prices are Prop 13 basis and usually far below market.</p>
  <div class="cards" style="margin-bottom:10px">
    <div class="tile"><div class="v">${X.fmtN(all.length)}</div><div class="l">conversion candidates in the catalog</div><div class="d">${X.fmtN(hotels)} hotels · ${X.fmtN(all.length-hotels)} apartment buildings</div></div>
    <div class="tile"><div class="v">${X.fmt$(totProf)}</div><div class="l">modeled profit across the top 100</div><div class="d">best plan per building, after modeled acquisition + conversion capex</div></div>
    <div class="tile"><div class="v">${top.length?X.fmtN(top[0].m.beds):'—'}</div><div class="l">student beds in the single largest play</div><div class="d">${top.length? X.esc(top[0].l.addr)+', '+X.esc(top[0].l.city):''}</div></div>
  </div>
  <div class="toolbar" style="margin-bottom:8px">
    <select id="cv_type"><option value="all">All conversion classes</option><option value="hotel">Hotels &amp; motels</option><option value="sro">SRO / residential hotels</option><option value="apt">Apartments &amp; large buildings</option><option value="comm">Commercial &amp; industrial</option></select>
    <select id="cv_cty"><option value="">All counties</option>${counties().map(c=>`<option>${X.esc(c)}</option>`).join('')}</select>
    <select id="cv_min"><option value="0">Any size</option><option value="10">10+ units/rooms</option><option value="20">20+</option><option value="50">50+</option></select>
    <select id="cv_sort"><option value="prof">Sort by modeled profit</option><option value="beds">Student beds</option><option value="units">Existing units/rooms</option></select>
  </div>
  <div style="overflow-x:auto"><table class="pl" style="min-width:920px"><tr style="font-weight:600"><td>Building</td><td>Type</td><td>Assessed (Prop 13)</td><td>Modeled market</td><td>Student plan</td><td>2–3BR plan</td><td>Best modeled profit</td></tr>
  ${top.map(x=>{ const l=x.l,m=x.m; return `<tr data-id="${l.id}" style="cursor:pointer">
    <td><b>${X.esc(l.addr)}</b><br><span style="color:var(--muted);font-size:11px">${X.esc(l.city)} · ${l.zip}${l.year?' · '+l.year:''}${l.sqft?' · '+X.fmtN(l.sqft)+' sf':''}</span></td>
    <td>${m.hotel? 'Hotel · '+l.units+' rooms' : l.units+' units'}</td>
    <td>${X.fmt$(l.price)}</td><td>${X.fmt$(m.mkt)}</td>
    <td>${X.fmtN(m.beds)} beds · capex ${X.fmt$(m.capexS)}<br><span class="${m.profS>0?'pos':'neg'}" style="font-size:11px">${(m.profS>0?'+':'')+X.fmt$(m.profS)}</span></td>
    <td>${X.fmtN(m.fam)} units · capex ${X.fmt$(m.capexF)}<br><span class="${m.profF>0?'pos':'neg'}" style="font-size:11px">${(m.profF>0?'+':'')+X.fmt$(m.profF)}</span></td>
    <td class="${m.best.prof>0?'pos':'neg'}"><b>${(m.best.prof>0?'+':'')+X.fmt$(m.best.prof)}</b><br><span style="font-size:11px;color:var(--muted)">${m.best.plan}</span></td></tr>`; }).join('')}</table></div>
  <p class="src" style="margin-top:8px">Model: student bed rent = ZIP ZORI × ${BED_F} (per bed), family rent = ZORI × ${FAM_F}; conversion capex $120–160/sf (cost library); exit at a ${(CAP*100).toFixed(1)}% cap. Hotels valued at a modeled $140k/key for acquisition. Zoning, permits (SB 4/SB 6, adaptive-reuse ordinances), and seismic work are NOT modeled — underwrite before believing any row. Click a row to open the record.</p>`;
  ['cv_type','cv_cty','cv_min','cv_sort'].forEach((id,i)=>{ const el=$('#'+id); el.value=[f.type,f.county,String(f.minu),f.sort][i]; el.addEventListener('change',()=>{ f={type:$('#cv_type').value, county:$('#cv_cty').value, minu:+$('#cv_min').value, sort:$('#cv_sort').value}; render(); }); });
  root.querySelectorAll('tr[data-id]').forEach(tr=>tr.addEventListener('click',()=>X.select(tr.dataset.id,true)));
}
window.LXConv={render, model, candidate};
})();
