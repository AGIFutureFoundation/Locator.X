/* locator.x — development & conversion engine: can the units be modified, updated or converted,
   what does it cost per square foot, and which play creates the most value. */
(function(){
'use strict';
const L=()=>window.LX, D=()=>window.LXDash;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- editable cost library (Bay Area, 2026 — midpoints of typical contractor ranges) ---------- */
const DEF_COSTS={
  cosmetic:{v:45, l:'Cosmetic refresh $/sf', n:'paint, floors, fixtures, light landscaping (typ. $30–60)'},
  medium:{v:115, l:'Medium remodel $/sf', n:'kitchen + baths + systems touch-ups, no layout change (typ. $80–150)'},
  gut:{v:265, l:'Gut renovation $/sf', n:'to the studs, new systems, permits (typ. $200–350)'},
  addition:{v:600, l:'New addition $/sf', n:'ground-up added area incl. design & permits (typ. $450–750)'},
  kitchen:{v:60000, l:'Kitchen, each', n:'mid-grade full kitchen (typ. $40–90k)'},
  bath:{v:32000, l:'Bathroom, each', n:'full bath remodel (typ. $20–50k)'},
  garageAdu:{v:220000, l:'Garage / basement ADU conversion', n:'~450–550 sf within the envelope (typ. $150–300k)'},
  detachedAdu:{v:500, l:'Detached ADU $/sf', n:'new backyard unit incl. utilities (typ. $400–650/sf)'},
  jadu:{v:110000, l:'Junior ADU (≤500 sf inside)', n:'kitchenette + separate entry (typ. $80–150k)'},
  legalizeUnit:{v:190000, l:'Add / legalize one unit in envelope', n:'ground-floor or basement unit to code (typ. $150–280k)'},
  condoConv:{v:80000, l:'Condo conversion, per building', n:'survey, map, legal, DRE — 2-unit bypass (typ. $60–110k)'},
  softStory:{v:130000, l:'Soft-story seismic retrofit', n:'2–4 unit wood frame (typ. $80–180k)'},
  rewire:{v:15000, l:'Rewire, per unit', n:'knob-and-tube / fuse panel replacement (typ. $10–20k)'},
  repipe:{v:12000, l:'Repipe, per unit', n:'galvanized to copper/PEX (typ. $8–16k)'},
  roof:{v:28000, l:'Roof replacement', n:'typ. $18–40k'},
  foundation:{v:85000, l:'Foundation / bolting work', n:'bolting to partial replacement (typ. $30–150k+)'},
  sb9:{v:130000, l:'SB 9 lot split soft costs', n:'survey, map, fees, utility separation (typ. $90–180k)'},
  aduSf:{v:750, l:'Detached ADU size, sf', n:'default new-build ADU area'}
};
let COSTS=null;
function costs(){ if(!COSTS){ COSTS={}; const saved=L().store('costlib')||{}; for(const k in DEF_COSTS) COSTS[k]= saved[k]!=null? +saved[k] : DEF_COSTS[k].v; } return COSTS; }
function setCost(k,v){ costs()[k]= v; const saved=L().store('costlib')||{}; saved[k]=v; L().store('costlib', saved); }
function resetCosts(){ L().store('costlib', {}); COSTS=null; }

/* ---------- helpers ---------- */
function capBasis(l){ // value a landlord pays for $1 of NOI in this market: use ZIP gross yield, floored
  const mk=L().marketFor(l); const gy=(mk.zhvi&&mk.zori)? mk.zori*12/mk.zhvi : 0.045; return clamp(gy*0.62, 0.04, 0.065); }
function incomeValue(l, addNOI){ return addNOI/capBasis(l); }
function zoneInfo(l){
  const z=(l.zoning||'').toUpperCase();
  if(/^RH-?1|^RH1/.test(z)) return {fam:'single-family zone (RH-1)', max:1, sf:true};
  if(/^RH-?2|^RH2/.test(z)) return {fam:'two-family zone (RH-2)', max:2};
  if(/^RH-?3|^RH3/.test(z)) return {fam:'three-family zone (RH-3)', max:3};
  if(/^RM/.test(z)) return {fam:'residential-mixed zone ('+z+')', max:4};
  if(/^RTO/.test(z)) return {fam:'transit-oriented residential ('+z+')', max:4};
  if(/^NC|^UMU|^MU|^C-|^RC/.test(z)) return {fam:'mixed-use / commercial zone ('+z+')', max:4, mixed:true};
  if(/^M1|^M2|^PDR/.test(z)) return {fam:'industrial zone ('+z+')', max:l.units||1, ind:true};
  return {fam: z? 'zone '+z : (l.county==='Alameda'? 'zoning not in county feed — verify locally' : 'zoning unknown'), max:null};
}
const FEAS={yes:['Feasible by right','good'], likely:['Likely feasible','good'], maybe:['Case-by-case','warn'], no:['Not available','bad']};

/* ---------- the assessment ---------- */
function assess(l){
  const X=L(); const C=costs(); const mk=X.marketFor(l);
  const units=l.units||1, condo=/condo|townhouse/i.test(l.kind||''), sqft=l.sqft||(units*900), lot=l.lot||0, year=l.year||null;
  const zi=zoneInfo(l); const rc=D().rentControl(l);
  const zipRent=mk.zori||3200;                       // typical home rent in ZIP
  const unitRent = (X.rentEstimate(l).rent)/units;   // current per-unit estimate
  const ppsf=D().cityPpsfOf? (D().cityPpsfOf(l.city)||900) : 900;
  const out=[];
  const add=(o)=>{ o.profit=(o.addValue||0)-(o.capex||0); o.roi=o.capex? o.profit/o.capex : 0; out.push(o); };

  // 1. Interior modernization (always assessable)
  { const age = year? (2026-year) : 60; const scope = age>70? 'medium' : 'cosmetic';
    const capex=Math.round(sqft*C[scope]); const upl= scope==='medium'?0.16:0.09;
    const addRent=Math.round(unitRent*units*upl); const addValue=Math.round(incomeValue(l, addRent*12*0.7)+capex*0.5);
    add({id:'reno', name: scope==='medium'? 'Modernize the units (medium remodel)' : 'Refresh the units (cosmetic)', feas:'yes',
      basis:`Interior work is permit-light; ${year? 'built '+year+', ':''}${sqft.toLocaleString()} sf at $${C[scope]}/sf`,
      capex, addRent, addValue, months: scope==='medium'?5:2,
      note: rc.level==='bad'? 'Rent-controlled tenancies: the higher rent arrives on turnover, not by notice — phase the work unit by unit.' : 'Rent resets at the next lease.'}); }
  // 2. Systems renewal (defensive, pre-1960)
  if(year && year<1965){ const capex=Math.round((C.rewire+C.repipe)*units + (year<1945? C.foundation*0.5:0));
    add({id:'systems', name:'Systems renewal (electrical, plumbing'+(year<1945?', foundation':'')+')', feas:'yes',
      basis:`Built ${year}: knob-and-tube or fuse panels and galvanized supply are probable; insurers increasingly require the work`,
      capex, addRent:0, addValue:Math.round(capex*0.9), months:3,
      note:'Buys insurability and prevents the five-figure surprise mid-hold; price it into the offer, not the upside.'}); }
  // 3. Soft-story retrofit (required, multi pre-1978)
  if(units>=2 && year && year<1978 && !condo){ add({id:'soft', name:'Soft-story seismic retrofit', feas:'yes',
    basis:'Pre-1978 wood-frame multi-unit: SF, Oakland and Berkeley mandate retrofits; garages under living space are the trigger',
    capex:C.softStory, addRent:0, addValue:Math.round(C.softStory*0.8), months:4,
    note:'Not optional in the ordinance cities — treat as a price adjustment at purchase. Grants/soft loans sometimes offset it.'}); }
  // 4. Garage / basement ADU conversion
  if(!condo && units<=4){ const feas=(l.stories||2)>=2 || lot>=2500 ? 'likely' : 'maybe';
    const addRent=Math.round(zipRent*0.62); const capex=C.garageAdu;
    add({id:'gadu', name:'Convert garage / ground floor to an ADU', feas,
      basis:'State ADU law (Gov. Code §66310 et seq.) requires ministerial approval of one conversion ADU per lot; setbacks don\'t apply inside the envelope',
      capex, addRent, addValue:Math.round(incomeValue(l, addRent*12*0.72)), months:9,
      note:'New ADUs are exempt from local rent control (AB 1482 applies after 15 yrs). Parking replacement is not required near transit.'}); }
  // 5. Detached ADU
  if(!condo && lot>=4000){ const sf2=C.aduSf; const capex=Math.round(sf2*C.detachedAdu); const addRent=Math.round(zipRent*0.75);
    add({id:'dadu', name:`Build a detached ADU (~${sf2} sf)`, feas:'yes',
      basis:`Lot ${lot.toLocaleString()} sf: a detached ADU up to 1,200 sf is approvable by right with 4-ft rear/side setbacks`,
      capex, addRent, addValue:Math.round(incomeValue(l, addRent*12*0.75)), months:12,
      note:'Utility connections drive cost variance; prefab drops $/sf. Feeds the appraisal as income, not always as $/sf.'}); }
  // 6. JADU inside a single-family home
  if(!condo && units===1 && sqft>=1400){ const addRent=Math.round(zipRent*0.45);
    add({id:'jadu', name:'Carve out a junior ADU (≤500 sf inside)', feas:'yes',
      basis:'JADU law allows one within the walls of a single-family home with an efficiency kitchen; owner-occupancy required',
      capex:C.jadu, addRent, addValue:Math.round(incomeValue(l, addRent*12*0.75)), months:5,
      note:'The cheapest unit you can create; pairs with a detached ADU on the same lot (both are allowed).'}); }
  // 7. Add / legalize a unit up to the zoned maximum
  if(!condo && zi.max && units<zi.max){ const roomFor=Math.max(0, Math.floor(sqft/520)-units); const n=Math.min(zi.max-units, Math.max(roomFor, lot>=2500?1:0)); if(n>0){ const addRent=Math.round(zipRent*0.7)*n; const capex=C.legalizeUnit*n;
    add({id:'unit', name:`Add ${n} unit${n>1?'s':''} within the envelope (to the zoned ${zi.max})`, feas:'likely',
      basis:`${zi.fam} allows ${zi.max} units; the building has ${units}. Ground-floor or basement build-out, ministerial in most SF RH/RM cases`,
      capex, addRent, addValue:Math.round(incomeValue(l, addRent*12*0.72)), months:12,
      note:'Check the 3R report for unwarranted space that can be legalized — often the cheapest path to the extra unit.'}); } }
  // 8. SB 9: second primary unit / lot split in single-family zones
  if(!condo && zi.sf && units===1){ const addRent=Math.round(zipRent*0.8);
    add({id:'sb9u', name:'SB 9: add a second primary dwelling', feas:'likely',
      basis:'SB 9 (Gov. Code §65852.21) makes two units on a single-family lot ministerial in urbanized areas',
      capex:Math.round(900*C.addition*0.75), addRent, addValue:Math.round(incomeValue(l, addRent*12*0.75)), months:14,
      note:'Cannot demolish rent-controlled or recently tenanted housing; owner-occupancy affidavit (3 yrs) for splits.'});
    if(lot>=4800){ const newSf=1200; const capex=C.sb9+Math.round(newSf*C.addition); const addValue=Math.round(newSf*ppsf*1.05);
      add({id:'sb9s', name:'SB 9 urban lot split + new home on the rear lot', feas:'maybe',
        basis:`Lot ${lot.toLocaleString()} sf splits into two ≥1,200 sf parcels; the new parcel takes up to two units`,
        capex, addRent:0, addValue, months:20,
        note:'The exit is a sale of the new parcel/home at retail $/sf — a development project, not a landlord project.'}); } }
  // 9. Condo conversion / TIC
  if(units===2 && (l.city==='San Francisco')){ const addValue=Math.round(sqft*ppsf*0.12);
    add({id:'condo', name:'Condo-convert the two units', feas:'maybe',
      basis:'SF\'s conversion lottery is suspended, but 2-unit buildings with both units owner-occupied for a year may bypass it',
      capex:C.condoConv, addRent:0, addValue, months:18,
      note:'No evictions in the lookback or the bypass dies. TIC sale is the fallback at a smaller premium.'}); }
  else if(units>=3 && units<=4 && l.city==='San Francisco'){ add({id:'condo', name:'Condo conversion (3–4 units)', feas:'no',
      basis:'SF suspended the condo-conversion lottery for 3+ unit buildings; no current path', capex:0, addRent:0, addValue:0, months:0,
      note:'TIC structuring is the only fractional exit; price no conversion upside.'}); }
  // 10. Ground-floor commercial activation
  if(zi.mixed && /store|flat/i.test(l.classdef||'')){ const csf=Math.round(sqft*0.3); const addRent=Math.round(csf*3.2);
    add({id:'comm', name:'Activate the ground-floor commercial space', feas:'likely',
      basis:`${zi.fam}: the classification (${l.classdef}) indicates street-front space; neighborhood retail rents ≈ $2.50–4/sf/mo`,
      capex:Math.round(csf*90), addRent, addValue:Math.round(incomeValue(l, addRent*12*0.7)), months:7,
      note:'Vacancy risk is higher than residential; a lease in hand before close is worth more than the buildout.'}); }
  // 11. Rear/vertical addition (owner product)
  if(!condo && units===1 && zi.max===1 && sqft<1800 && lot>=2500 && !zi.sf===false){ }
  if(!condo && sqft && lot>=2500 && sqft<2600 && units<=2){ const sf3=Math.min(600, Math.round(lot*0.15)); const capex=Math.round(sf3*C.addition);
    add({id:'addn', name:`Rear or vertical addition (~${sf3} sf)`, feas:'maybe',
      basis:'RH zones allow additions within height/rear-yard limits; discretionary review is the risk in SF, simpler in the East Bay',
      capex, addRent:0, addValue:Math.round(sf3*ppsf*1.1), months:14,
      note:'Value shows up at sale ($/sf), not in rent — an owner-occupant or flip play.'}); }
  out.sort((a,b)=>{ const fo={yes:0,likely:1,maybe:2,no:3}; return (fo[a.feas]-fo[b.feas]) || (b.roi-a.roi); });
  const doable=out.filter(o=>o.feas!=='no'&&o.capex>0);
  const best=doable.slice().sort((a,b)=>b.profit-a.profit)[0];
  const bestRent=doable.filter(o=>o.addRent>0).sort((a,b)=>b.addRent/Math.max(1,b.capex)-a.addRent/Math.max(1,a.capex))[0];
  return {list:out, best, bestRent, zi, summary: best? `${best.name} is the strongest play: ${L().fmt$(best.capex)} in, ~${L().fmt$(best.addValue)} of value out${best.addRent?` and $${L().fmtN(best.addRent)}/mo of new rent`:''}.` : 'No development lever beyond keeping the building sound.'};
}

/* ---------- cost library panel ---------- */
function libPanel(){
  const C=costs();
  return `<details class="tile" style="margin-top:14px"><summary style="cursor:pointer;font-weight:600;font-size:13px">Renovation &amp; construction cost library — Bay Area 2026, editable <span style="color:var(--muted);font-weight:400">(drives every estimate below)</span></summary>
  <div class="costgrid">${Object.keys(DEF_COSTS).map(k=>`<label>${DEF_COSTS[k].l}<input type="number" data-cost="${k}" value="${C[k]}"><span>${DEF_COSTS[k].n}</span></label>`).join('')}</div>
  <div class="toolbar" style="margin-top:8px"><button class="btn" id="costreset">Reset to defaults</button><span style="font-size:11px;color:var(--muted)">Midpoints of typical 2026 contractor ranges for the Bay Area; permits, design and contingency included in the lump sums. Edit to match your bids — every sheet and suggestion recomputes.</span></div></details>`;
}
function bindLib(root, onChange){
  root.querySelectorAll('[data-cost]').forEach(inp=>inp.addEventListener('change', ()=>{ setCost(inp.dataset.cost, +inp.value||DEF_COSTS[inp.dataset.cost].v); if(onChange) onChange(); }));
  const rb=root.querySelector('#costreset'); if(rb) rb.addEventListener('click', ()=>{ resetCosts(); if(onChange) onChange(); });
}
window.LXDev={assess, costs, libPanel, bindLib, FEAS, DEF_COSTS};
})();
