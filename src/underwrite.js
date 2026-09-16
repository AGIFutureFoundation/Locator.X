/* locator.x — underwriting desk: buy box, auto pipeline, offer solver, full sheet */
(function(){
'use strict';
const L=()=>window.LX, D=()=>window.LXDash;
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pct=(v,d=1)=>L().fmtPct(v,d);
const STAGES=[['new','New','--stg-new'],['scr','Screened','--stg-scr'],['uw','Underwritten','--stg-uw'],['off','Offer drafted','--stg-off'],['pass','Passed','--stg-pass']];
const STG=Object.fromEntries(STAGES.map(s=>[s[0],s]));
const DEF_BB={maxPrice:2000000, minScore:35, minCap:3.5, minDscr:0.7, minUnits:1, city:'', county:'', minEvid:'any', cats:{asset:true,hack:true,value:true,growth:false,liab:false}, target:'dscr12'};
const TARGETS=[['dscr12','DSCR ≥ 1.20 (lender-ready)'],['dscr10','Break even (DSCR 1.0)'],['coc6','Cash-on-cash ≥ 6%'],['cf200','Cash flow ≥ $200/mo']];
const REHAB=[['none','As-is',0],['cosmetic','Cosmetic · $30/sf',30],['medium','Medium · $70/sf',70],['heavy','Heavy · $130/sf',130]];
let bb=Object.assign({}, DEF_BB, L().store('buybox')||{}); bb.cats=Object.assign({},DEF_BB.cats,(L().store('buybox')||{}).cats||{});
let scen=L().store('uwscen')||{}; let sheetId=null, gapShown=24, tblShown=200;
const saveBB=()=>L().store('buybox', bb); const saveScen=()=>L().store('uwscen', scen);
function S(id){ return scen[id]||(scen[id]={stage:'new'}); }

/* ---------- underwriting math ---------- */
function payK(rate, term){ const r=rate/100/12, n=term*12; return r>0? r/(1-Math.pow(1+r,-n))*12 : 12/n; } // annual payment per $ loan
function financeOptions(l, u){ // u: {offer, rehab, rentMo}
  const a=L().state.assump; const P=u.offer;
  const opts=[];
  opts.push({id:'conv', name:'Conventional investor', down:25, rate:a.rate, mi:0, note:'25% down · 30-yr'});
  const units=l.units||1; const fhaOk=units>=1&&units<=4 && P<=2326875;
  opts.push({id:'fha', name:'FHA house-hack', down:3.5, rate:a.rate-0.3, mi:0.55, note:'3.5% down · live in one unit · MIP 0.55%/yr', disabled:!fhaOk, ownerOcc:true});
  opts.push({id:'dscr', name:'DSCR loan', down:25, rate:a.rate+0.85, mi:0, note:'qualifies on the property, not your W-2'});
  opts.push({id:'seller', name:'Seller carry', down:15, rate:4.5, mi:0, note:'15% down · 4.5% note — the Prop 13 pitch'});
  /* ---- contract structures beyond a purchase-money loan ----
     These model the same down/rate/mi debt-service math the four options above
     use — the honest limit of what a single amortization formula can represent —
     with the note field carrying what actually differs about the paper. None of
     these change what the numbers below mean; they change what the buyer signs. */
  opts.push({id:'subto', name:'Subject-to existing loan', down:5, rate:Math.max(2.5,a.rate-2.25), mi:0,
    note:'take over payments on the seller’s existing note as-is — down covers their equity + costs, not a new loan (title/insurance/due-on-sale risk apply)'});
  opts.push({id:'wrap', name:'Wraparound mortgage', down:10, rate:Math.max(3,a.rate-0.75), mi:0,
    note:'seller’s underlying loan stays in place; buyer pays the seller on a new, larger wrap note that covers it'});
  opts.push({id:'leaseopt', name:'Master lease w/ option', down:5, rate:a.rate+0.25, mi:0,
    note:'control the property on a master lease with a fixed option price; down is the option fee, not equity, until exercised', ownerOcc:false});
  opts.push({id:'hardmoney', name:'Hard money / bridge', down:20, rate:a.rate+3.5, mi:1,
    note:'fast, short-term, expensive — pair with the refinance-exit math below to see the take-out'});
  opts.push({id:'assume', name:'Assumable VA/FHA', down:10, rate:Math.max(2.5,a.rate-1.5), mi:0.4,
    note:'formally assume the seller’s existing low-rate VA/FHA loan where the lender allows it — verify assumability before relying on this'});
  opts.push({id:'jv', name:'JV / equity partner (50/50)', down:50, rate:a.rate, mi:0,
    note:'a capital partner funds the other half of the cash below in exchange for half the cash flow and equity — this column still shows the deal’s own numbers, not your split'});
  return opts;
}
function underwrite(l, u){ // returns full sheet numbers for financing option u.fin
  const a=L().state.assump; const X=L();
  const P=u.offer, rehab=u.rehab||0, cont=(u.cont!=null?u.cont:10)/100;
  const rentMo=u.rentMo; const rent=rentMo*12;
  /* WHERE THIS SHEET'S RENT CAME FROM, carried so the LOCATOR screen can refuse
     to rule on it. A rent the user typed is 'given' whatever the market
     publishes; otherwise it is whatever LX.rentEstimate said, and 'none' means
     the 0.4%/mo rule of thumb. */
  const rentBasis = u.rentBasis || 'model';
  const vac=rent*a.vacancy/100, egi=rent-vac;
  /* One expense stack, shared with deal() in app.js, so the ranking engine and
     the underwriting sheet can never disagree again. */
  const _ox=X.opexOf(l, P, rent, egi, {selfManage:u.selfManage, hoa:u.hoa, util:u.util});
  const tax=_ox.tax, ins=_ox.ins, maint=_ox.maint, capex=_ox.capex, mgmt=_ox.mgmt, hoa=_ox.hoa, util=_ox.util;
  const opex=_ox.total, noi=egi-opex;
  const fin=u.finOpt; const down=fin.down/100; const loan=P*(1-down);
  const k=payK(fin.rate, a.term); const ds=loan*k + loan*(fin.mi||0)/100;
  const cf=noi-ds; const rehabAll=rehab*(1+cont);
  const cash=P*down + P*a.closing/100 + rehabAll;
  const dscr=ds>0? noi/ds : null; const coc=cash>0? cf/cash*100 : null;
  const capCost=noi/(P+rehabAll)*100;
  const beOcc = rent>0? clamp((opex+ds)/rent*100,0,200) : null;
  const arv=(u.arv!=null&&u.arv>0)? u.arv : P+rehabAll*1.5;
  // 5y IRR with exit
  /* Appreciation source, in order of how much it is worth trusting.

     The default used to be `mk.yoy` - the ZIP's LAST TWELVE MONTHS of change,
     extrapolated across five years with no error attached. One reading of a
     noisy series is the weakest possible basis for a five-year assumption, and
     it silently became the exit value in every IRR on this page.

     A twelve-month ordinary-least-squares fit on the log series is the same data
     read properly: it uses every month rather than the endpoints, it cannot be
     thrown by one odd print, and - the part that matters - it comes with a
     measured backtest band, which `yoy` never did. A user's own figure still
     wins over both, because it is the one number here that is a decision rather
     than an estimate. */
  const mk=X.marketFor(l);
  let appr, apprSrc;
  if(u.apprOverride!=null){ appr=u.apprOverride; apprSrc='scenario'; }
  else if(a.appr!=='' && a.appr!=null){ appr=+a.appr; apprSrc='yours'; }
  else {
    let fit=null;
    try{ const f=window.LXPredict && l.zip && LXPredict.forecastZip(l.zip,'val');
         if(f && f.annual!=null && isFinite(f.annual)) fit=f.annual*100; }catch(e){}
    if(fit!=null){ appr=fit; apprSrc='fitted'; }
    else if(mk.yoy!=null){ appr=mk.yoy; apprSrc='yoy'; }
    else { appr=2; apprSrc='default'; }
  }
  let v=arv, bal=loan, rr=rent, flows=[-cash];
  for(let y=1;y<=5;y++){ v*=1+appr/100; rr*=1+a.rentGrowth/100; const noiY=rr*(1-a.vacancy/100)-(tax*Math.pow(1.02,y-1)+ins+rr*(a.maint+a.capex)/100+(u.selfManage?0:rr*(1-a.vacancy/100)*a.mgmt/100)+hoa+util); const rm=fin.rate/100/12; for(let m=0;m<12;m++){ const i=bal*rm; bal-=(loan*k/12-i); } const cfy=noiY-ds; flows.push(y<5? cfy : cfy+v*0.94-bal); }
  let irr=null; { const npv=r0=>flows.reduce((s,c,i)=>s+c/Math.pow(1+r0,i),0); let lo=-0.9, hi=2; if(npv(lo)>0&&npv(hi)<0){ for(let i=0;i<60;i++){ const mid=(lo+hi)/2; if(npv(mid)>0) lo=mid; else hi=mid; } irr=lo; } }
  const eqMult = cash>0? (flows.slice(1).reduce((s,c)=>s+Math.max(0,c),0)+0)/cash : null;
  const fhaSelfSuff=(l.units||1)>=3 && u.finOpt.id==='fha'? rent*0.75>= (ds+tax+ins) : null;
  /* ---- ten more underwriting data points ----
     Every one of these is a direct arithmetic function of numbers already
     computed above — no new source, no new assumption, just more of the deal
     made legible in the units investors actually screen with. */
  const units2=l.units||1;
  const grm = rent>0? P/rent : null;                              // 1. gross rent multiplier
  const pricePerUnit = units2>0? P/units2 : null;                  // 2. $ per unit
  const pricePerSqft = l.sqft? P/l.sqft : null;                    // 3. $ per sq ft, purchase
  const rentPerSqft = l.sqft? rentMo/l.sqft : null;                // 4. $ per sq ft, monthly rent
  const onePctRule = P>0? rentMo/P*100 : null;                     // 5. the "1% rule" screen
  const debtYield = loan>0? noi/loan*100 : null;                   // 6. NOI / loan — a lender's stress metric
  const ltv = P>0? loan/P*100 : null;                              // 7. loan-to-value on price
  const ltc = (P+rehabAll)>0? loan/(P+rehabAll)*100 : null;        // 8. loan-to-cost incl. rehab
  const oer = egi>0? opex/egi*100 : null;                          // 9. operating expense ratio
  const paybackYears = cf>0? cash/cf : null;                       // 10. years to recoup cash from cash flow alone
  /* ---- the stress block: what a credit committee asks next ----
     Screening numbers say how the deal looks today. These say how far it can be
     pushed before it stops working, which is the question that decides whether
     you keep the building through a bad year (curriculum N3, C1, C3).

     All of it is arithmetic over the stack already computed above — no new
     source and no new assumption. Where an input is unknown the output is null
     and the sheet says so; nothing here defaults. */
  // Rent at which NOI exactly covers debt service. Invert the expense stack:
  // NOI = rent*(1-vac)*(1 - (maint+capex+mgmt shares)) - fixed, so solve for rent.
  const fixed = tax + ins + hoa + util;
  const varShare = (a.maint + a.capex)/100 + (u.selfManage? 0 : (1-a.vacancy/100)*a.mgmt/100);
  const netPerRent = (1 - a.vacancy/100) - varShare;   // NOI added per $1 of gross rent
  const breakevenRent = (ds>0 && netPerRent>0)? (ds + fixed)/netPerRent/12 : null;
  // How far rent can fall from here before DSCR hits 1.0. Negative means it is
  // already below, which is a different sentence from "0% cushion".
  const rentCushion = (breakevenRent!=null && rentMo>0)? (rentMo - breakevenRent)/rentMo*100 : null;
  // The rate at which this loan's payment eats the whole NOI, by bisection on
  // the same annuity factor the sheet uses everywhere else.
  let breakevenRate = null;
  if(loan>0 && noi>0){
    let lo=0, hi=40;
    if(loan*payK(hi, a.term) > noi){
      for(let i=0;i<50;i++){ const mid=(lo+hi)/2; if(loan*payK(mid, a.term) <= noi) lo=mid; else hi=mid; }
      breakevenRate = lo;
    }
  }
  const rateHeadroom = (breakevenRate!=null)? breakevenRate - fin.rate : null;
  // Lender sizing: the largest loan this NOI supports at a target coverage.
  const loanAtDscr = t => { const k2=payK(fin.rate, a.term); return (k2>0 && noi>0)? noi/t/k2 : null; };
  const maxLoan125 = loanAtDscr(1.25);
  const loanGap = (maxLoan125!=null)? maxLoan125 - loan : null;   // negative: the lender sizes you down
  // Three single-factor stresses and the combined one, each reported as a DSCR.
  const dscrAt = (rentMult, vacAdd, rateAdd) => {
    const r2 = rent*rentMult;
    const egi2 = r2*(1 - (a.vacancy+vacAdd)/100);
    const var2 = r2*(a.maint+a.capex)/100 + (u.selfManage? 0 : egi2*a.mgmt/100);
    const noi2 = egi2 - (fixed + var2);
    const ds2 = loan*payK(fin.rate+rateAdd, a.term) + loan*(fin.mi||0)/100;
    return ds2>0? noi2/ds2 : null;
  };
  const stress = {
    rate200: dscrAt(1, 0, 2),           // +200 bp at refinance or reset
    rent10:  dscrAt(0.90, 0, 0),        // rents 10% below the basis
    vac5:    dscrAt(1, 5, 0),           // five more points of vacancy
    all:     dscrAt(0.90, 5, 2)         // all three at once
  };
  const stressPass = Object.keys(stress).filter(k => stress[k]!=null && stress[k]>=1).length;
  return {P, rehab, rehabAll, rentMo, rentBasis, rent, vac, egi, tax, ins, maint, capex, mgmt, hoa, util, opex, noi, loan, ds, cf, cfMo:cf/12, cash, dscr, coc, capCost, beOcc, arv, irr, appr, apprSrc, flows, fhaSelfSuff,
    eqMult, grm, pricePerUnit, pricePerSqft, rentPerSqft, onePctRule, debtYield, ltv, ltc, oer, paybackYears,
    breakevenRent, rentCushion, breakevenRate, rateHeadroom, maxLoan125, loanGap, stress, stressPass};
}
function targetTest(uw){ switch(bb.target){ case 'dscr12': return uw.dscr!=null && uw.dscr>=1.2; case 'dscr10': return uw.dscr!=null && uw.dscr>=1.0; case 'coc6': return uw.coc!=null && uw.coc>=6; default: return uw.cfMo>=200; } }
function maxOffer(l, base){ // bisection on offer price; rent fixed
  const lo0=50000, hi0=Math.max(price0(l)*1.6, 400000); let lo=lo0, hi=hi0;
  const mk=u=>underwrite(l, Object.assign({}, base, {offer:u}));
  if(targetTest(mk(hi))) return hi; if(!targetTest(mk(lo))) return null;
  for(let i=0;i<40;i++){ const mid=(lo+hi)/2; if(targetTest(mk(mid))) lo=mid; else hi=mid; }
  return lo;
}
function price0(l){ return L().price(l); }
function baseInputs(l, s){ const X=L(); const r=D().analyze(l); const rentMo=(s&&s.rentMo)|| r.d.rentMo; const rp=(s&&s.rehabPreset)||'none'; const rate=REHAB.find(x=>x[0]===rp)[2]; const rehab=(s&&s.rehab!=null)? s.rehab : Math.round((l.sqft||1200)*rate); const uplift = rp==='none'?1: rp==='cosmetic'?1.08: rp==='medium'?1.15:1.25;
  const fin=(s&&s.fin)||'conv';
  return {offer:(s&&s.offer)||price0(l), rehab, cont:(s&&s.cont!=null)?s.cont:10, rentMo:Math.round(rentMo*((s&&s.rentMo)?1:uplift)), rentBasis:(s&&s.rentMo)? 'given' : (r.d.rentBasis||'model'), rehabPreset:rp, fin, finOpt:null, selfManage:!!(s&&s.selfManage), hoa:s&&s.hoa, util:s&&s.util, arv:s&&s.arv, analysis:r};
}
function withFin(l, u){ const opts=financeOptions(l,u); u.finOpt=opts.find(o=>o.id===u.fin&&!o.disabled)||opts[0]; u.opts=opts; return u; }

/* ---------- deep insights: how this deal stacks up against real peers ----------
   Every number here is a percentile rank against OTHER properties already in this
   edition's own catalog — no external benchmark, nothing invented. Peer group
   narrows from city to county to the whole edition so a thin city never reports
   a percentile off a handful of properties without saying so. */
function percentile(val, arr, lowerIsBetter){
  if(val==null || !isFinite(val)) return null;
  let below=0, total=0;
  for(const v of arr){ if(v==null || !isFinite(v)) continue; total++; if(lowerIsBetter? v>=val : v<=val) below++; }
  return total>=8 ? {pct: below/total*100, n: total} : null;
}
function deepInsights(l, uw){
  const X=L(); const all=D().rows.length? D().rows : (D().render(), D().rows);
  let peers=all.filter(r=>r.l.id!==l.id && r.l.city===l.city), label=X.esc(l.city);
  if(peers.length<20){ peers=all.filter(r=>r.l.id!==l.id && r.l.county===l.county); label=(l.county? X.esc(l.county)+' County':'the metro'); }
  if(peers.length<20){ peers=all.filter(r=>r.l.id!==l.id); label='the full catalog'; }
  const mine=all.find(r=>r.l.id===l.id);
  const rows=[
    ['Cap rate', percentile(uw.capCost, peers.map(r=>r.d.cap), false), v=>v.toFixed(1)+'%', 'beats'],
    ['DSCR', percentile(uw.dscr, peers.map(r=>r.d.dscr), false), v=>v.toFixed(2), 'beats'],
    ['Price / sq ft', percentile(uw.pricePerSqft, peers.map(r=>r.d.ppsf), true), v=>'$'+v.toFixed(0), 'is cheaper than'],
    ['The "1% rule"', percentile(uw.onePctRule, peers.map(r=>r.d.one), false), v=>v.toFixed(2)+'%', 'beats'],
    ['Locator X score', mine? percentile(mine.score, peers.map(r=>r.score), false) : null, v=>v.toFixed(0), 'beats'],
  ];
  return {label, peerN:peers.length, rows};
}
function insightsBlock(l, uw){
  try{
    const X=L(); const ins=deepInsights(l, uw);
    if(ins.peerN<8) return '';
    const cards=ins.rows.filter(r=>r[1]).map(([name,p,fmt,verb])=>{
      const good=p.pct>=60, bad=p.pct<40;
      return `<div class="out ${good?'good':bad?'bad':''}"><div class="v">${p.pct.toFixed(0)}<span style="font-size:12px">th pct</span></div><div class="l">${name} ${verb} ${p.pct.toFixed(0)}% of ${p.n} peers</div></div>`;
    }).join('');
    if(!cards) return '';
    return `<h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:16px 0 4px">Deep insight — how this deal ranks against ${ins.peerN} comparable properties in ${ins.label}</h4>
    <div style="font-size:11.5px;color:var(--muted);margin:0 0 6px;max-width:70ch">Percentile rank against every other property in this same peer group, computed from the same numbers on this page — not a third-party comp service.</div>
    <div class="outs">${cards}</div>`;
  }catch(e){ return ''; }
}

/* ---------- matches ---------- */
/* A CRITERION ABOUT RENT CANNOT BE MET BY A RULE OF THUMB.

   The cap-rate and DSCR floors are both rent-derived: change the rent and both
   move. Where a market publishes no rent at all, LX.rentEstimate falls back to
   `price x 0.004` - a rule of thumb anchored to nothing - and until now that
   produced a real-looking cap rate and a DSCR to three decimals which sailed
   through these floors. The record then "met the Locator X criteria" on a number
   nobody measured.

   Note the asymmetry that hid it: an UNKNOWN dscr becomes 0 through `||0` and is
   correctly excluded, so the one case that was handled was the one that looked
   broken. The fabricated case looked fine and passed.

   So a rent-derived floor now excludes a record whose rent has no basis, and
   says so in the funnel rather than silently shrinking the result. Nothing is
   excluded when neither floor is asked for - a buyer who has not set a rent
   criterion is not asking a rent question. */
function rentBlind(r){ return r && r.d && r.d.rentBasis === 'none'; }
function rentFloorOn(){ return (+bb.minCap > 0) || (+bb.minDscr > 0); }
function matches(){ const rowsD=D().rows.length? D().rows : (D().render(), D().rows); // ensure computed
  const rentGate = rentFloorOn();
  return rowsD.filter(r=>{ const l=r.l; if(price0(l)>bb.maxPrice) return false; if(r.score<bb.minScore) return false;
    if(rentGate && rentBlind(r)) return false;
    if(r.d.cap<bb.minCap) return false; if((r.d.dscr||0)<bb.minDscr) return false; if((l.units||1)<bb.minUnits) return false;
    if(bb.minEvid&&bb.minEvid!=='any'){ try{ const g=window.LXEvid&&LXEvid.grade(l); const ord={A:4,B:3,C:2,D:1};
      if(!g||(ord[g.band]||0) < (ord[bb.minEvid]||0)) return false; }catch(e){} } if(bb.city && l.city!==bb.city) return false; if(bb.county && l.county!==bb.county) return false; if(!bb.cats[r.cat]) return false; return true; }).sort((p,q)=>q.score-p.score);
}

/* ---------- render ---------- */
function render(){
  const X=L();
  // buy box
  $('#bbgrid').innerHTML=`
    <label>Max price $<input type="number" id="bb_maxPrice" value="${bb.maxPrice}" step="50000"></label>
    <label>Min score<input type="number" id="bb_minScore" value="${bb.minScore}"></label>
    <label title="Screen out records whose source does not publish enough to underwrite from">Min evidence<select id="bb_minEvid">${[['any','Any grade'],['D','D or better'],['C','C or better'],['B','B — most of the work is done'],['A','A — underwritable from the record']].map(o=>`<option value="${o[0]}"${bb.minEvid===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select></label>
    <label>Min cap %<input type="number" id="bb_minCap" value="${bb.minCap}" step="0.25"></label>
    <label>Min DSCR<input type="number" id="bb_minDscr" value="${bb.minDscr}" step="0.05"></label>
    <label>Min units<input type="number" id="bb_minUnits" value="${bb.minUnits}"></label>
    <label>City<select id="bb_city"><option value="">Any</option>${[...new Set(X.allListings().map(l=>X.esc(l.city)))].sort().map(c=>`<option ${bb.city===c?'selected':''}>${X.esc(c)}</option>`).join('')}</select></label>
    <label>County<select id="bb_county"><option value="">Any</option>${[...new Set(X.allListings().map(l=>X.esc(l.county)).filter(Boolean))].sort().map(c=>`<option ${bb.county===c?'selected':''}>${X.esc(c)}</option>`).join('')}</select></label>`;
  ['maxPrice','minScore','minCap','minDscr','minUnits','city','county','minEvid'].forEach(k=>$('#bb_'+k).addEventListener('change', e=>{ bb[k]= (k==='city'||k==='county'||k==='minEvid')? e.target.value : +e.target.value; saveBB(); render(); }));
  $('#bbreset').onclick=()=>{ bb=JSON.parse(JSON.stringify(DEF_BB)); saveBB(); render(); };
  $('#bbcats').innerHTML=D().CATS.map(c=>`<button class="chip" data-c="${c.id}" aria-pressed="${!!bb.cats[c.id]}" style="${bb.cats[c.id]?`background:var(${c.c});border-color:var(${c.c});color:#fff`:''}">${c.name}</button>`).join('');
  $$('#bbcats .chip').forEach(x=>x.addEventListener('click', ()=>{ bb.cats[x.dataset.c]=!bb.cats[x.dataset.c]; saveBB(); render(); }));
  $('#bbtarget').innerHTML=TARGETS.map(t=>`<button class="chip" data-t="${t[0]}" aria-pressed="${bb.target===t[0]}">${t[1]}</button>`).join('');
  $$('#bbtarget .chip').forEach(x=>x.addEventListener('click', ()=>{ bb.target=x.dataset.t; saveBB(); render(); }));
  const lib=$('#costlibwrap'); if(lib){ lib.innerHTML=window.LXDev.libPanel(); window.LXDev.bindLib(lib, ()=>{ render(); renderSheet(); }); }
  const ms=matches();
  renderFunnel(ms); renderGap(ms); renderTable(ms); renderSheet();
  $('#uwcount').textContent=`${X.fmtN(ms.length)} of ${X.fmtN(X.allListings().length)} pass the buy box`;
  $('#autouw').onclick=()=>autoUW(ms);
  try{ if(window.LXUWViz) LXUWViz.render(ms); }catch(e){}
  try{ if(window.LXUWX) LXUWX.panel(); }catch(e){}
}
function renderFunnel(ms){
  const X=L(); const total=X.allListings().length; const counts={new:0,scr:0,uw:0,off:0,pass:0};
  ms.forEach(r=>counts[S(r.l.id).stage]++);
  const rowsF=[['Universe', total, '--muted'],['Buy-box matches', ms.length, '--bay'],['Screened', counts.scr+counts.uw+counts.off, '--stg-scr'],['Underwritten', counts.uw+counts.off, '--stg-uw'],['Offers drafted', counts.off, '--stg-off']];
  const max=total;
  /* A record excluded because this market publishes no rent is NOT the same as
     one that failed the floor, and the funnel must not let it look that way: a
     buy box that quietly returns nothing in a rent-blind market reads as "no
     good deals here" when the truth is "this question cannot be asked here". */
  let blind = 0;
  if(rentFloorOn()){
    try{ const all = D().rows.length ? D().rows : (D().render(), D().rows);
         blind = all.filter(rentBlind).length; }catch(e){}
  }
  let note = `Passed: ${counts.pass}. Stages persist in this browser.`;
  if(blind){
    note += ` <b>${X.fmtN(blind)} of ${X.fmtN(total)} records are excluded because this market `
         +  `publishes no rent</b> — the cap-rate and DSCR floors are rent questions, and the only `
         +  `rent available here is a 0.4%/mo rule of thumb. They are not failing your criteria; `
         +  `they cannot be tested against them. Clear both rent floors to rank on what the record does carry.`;
  }
  $('#funnel').innerHTML=rowsF.map(r=>`<div class="funnelrow"><span>${r[0]}</span><div class="bar"><i style="--c:var(${r[2]});width:${Math.max(r[1]/max*100, r[1]?2:0)}%"></i></div><b>${X.fmtN(r[1])}</b></div>`).join('')+`<div style="font-size:11px;color:var(--muted);margin-top:6px">${note}</div>`;
}
function autoUW(ms){
  const X=L(); const btn=$('#autouw'); btn.disabled=true; const prog=$('#autoprog'); prog.innerHTML='<div class="uwprog"><i style="width:0%"></i></div><span id="uwpct"></span>';
  const bar=prog.querySelector('i'); let i=0; const todo=ms.slice(0, 400);
  const step=()=>{ const batch=todo.slice(i, i+25); batch.forEach(r=>{ const s=S(r.l.id); const base=withFin(r.l, baseInputs(r.l, s)); const mo=maxOffer(r.l, base); s.maxOffer=mo? Math.round(mo):null; s.gap= mo? (mo/price0(r.l)-1)*100 : null; if(s.stage==='new') s.stage= 'scr'; }); i+=batch.length; bar.style.width=(i/todo.length*100).toFixed(0)+'%'; prog.querySelector('#uwpct').textContent=` ${i}/${todo.length} screened`; if(i<todo.length) setTimeout(step, 10); else { saveScen(); btn.disabled=false; X.toast(`${todo.length} properties screened against ${TARGETS.find(t=>t[0]===bb.target)[1]}`); render(); } };
  step();
}
function gapColor(g){ return g==null? 'var(--muted)' : g>=0? 'var(--good)' : 'var(--cat3)'; }
function renderGap(ms){
  const X=L(); const box=$('#gapchart'); const withGap=ms.filter(r=>S(r.l.id).gap!=null).slice(0,gapShown);
  if(!withGap.length){ box.innerHTML='<p style="font-size:13px;color:var(--muted)">Run <b>Auto-underwrite all matches</b> to compute每 property’s maximum price and see the gaps here.'.replace('每',' every ')+'</p>'; return; }
  const W=980, rowH=22, pl=230, pr=90; const H=withGap.length*rowH+34; const maxAbs=Math.max(12,...withGap.map(r=>Math.abs(clamp(S(r.l.id).gap,-60,60))));
  const x0=pl+(W-pl-pr)/2; const xs=g=>x0 + clamp(g,-60,60)/maxAbs*(W-pl-pr)/2;
  let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">`;
  s+=`<line x1="${x0}" x2="${x0}" y1="6" y2="${H-24}" stroke="var(--line2)"/>`;
  withGap.forEach((r,i)=>{ const g=S(r.l.id).gap; const y=8+i*rowH; const x1=Math.min(x0, xs(g)), w=Math.abs(xs(g)-x0);
    s+=`<text x="${pl-8}" y="${y+11}" text-anchor="end" font-size="11" fill="var(--ink)">${X.esc(r.l.addr)}, ${X.esc(r.l.city)}</text>`;
    s+=`<rect x="${x1}" y="${y}" width="${Math.max(2,w)}" height="14" rx="3" fill="${gapColor(g)}"><title>${X.esc(r.l.addr)}: max ${X.fmt$(S(r.l.id).maxOffer)} vs ${X.fmt$(price0(r.l))} (${g>0?'+':''}${g.toFixed(0)}%)</title></rect>`;
    s+=`<text x="${xs(g)+(g>=0?5:-5)}" y="${y+11}" text-anchor="${g>=0?'start':'end'}" font-size="10.5" font-family="var(--mono)" fill="var(--ink2)">${g>0?'+':''}${g.toFixed(0)}% · ${X.fmt$(S(r.l.id).maxOffer)}</text>`; });
  s+=`<text x="${x0}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="var(--muted)">recorded price</text></svg>`;
  box.innerHTML=s + (ms.filter(r=>S(r.l.id).gap!=null).length>gapShown? `<button class="btn" id="gapmore" style="margin-top:8px">Show more</button>`:'');
  const gm=$('#gapmore'); if(gm) gm.onclick=()=>{ gapShown+=24; renderGap(matches()); };
}
function renderTable(ms){
  const X=L();
  $('#uwtable thead').innerHTML=`<tr><th>#</th><th>Property</th><th>City</th><th class="r">Score</th><th>Category</th><th class="r">Price</th><th class="r">Cap</th><th class="r">Cash flow</th><th class="r">DSCR</th><th class="r">Max offer @ target</th><th class="r">Gap</th><th class="r">Dev upside</th><th>Stage</th><th></th></tr>`;
  const shown=ms.slice(0,tblShown);
  $('#uwtable tbody').innerHTML=shown.map((r,i)=>{ const s=S(r.l.id); const st=STG[s.stage]; const c=D().CAT[r.cat]; return `<tr data-id="${r.l.id}"><td class="r">${i+1}</td><td><b>${X.esc(r.l.addr)}</b></td><td>${X.esc(r.l.city)}</td><td class="r"><b>${r.score}</b></td><td><span style="color:var(${c.c});font-weight:600;font-size:12px">●</span> ${c.name.split(' ')[0]}</td><td class="r">${X.fmt$(price0(r.l))}</td><td class="r">${pct(r.d.cap)}</td><td class="r ${r.d.cfMo>0?'pos':'neg'}">${X.fmt$(r.d.cfMo)}</td><td class="r">${r.d.dscr?r.d.dscr.toFixed(2):'—'}</td><td class="r">${s.maxOffer? X.fmt$(s.maxOffer):'—'}</td><td class="r" style="color:${gapColor(s.gap)}">${s.gap!=null? (s.gap>0?'+':'')+s.gap.toFixed(0)+'%':'—'}</td><td class="r">${(()=>{ const dv=window.LXDev.assess(r.l).best; return dv&&dv.profit>0? '<span class="pos">+'+X.fmt$(dv.profit)+'</span>' : '—'; })()}</td><td><select class="stagesel" data-id="${r.l.id}">${STAGES.map(x=>`<option value="${x[0]}" ${s.stage===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></td><td><button class="btn" data-act="sheet" data-id="${r.l.id}">Underwrite</button></td></tr>`; }).join('') + (ms.length>shown.length? `<tr><td colspan="14"><button class="btn" id="uwmore">Show all ${ms.length}</button></td></tr>`:'');
  const um=$('#uwmore'); if(um) um.onclick=()=>{ tblShown=ms.length; renderTable(ms); };
  $$('#uwtable .stagesel').forEach(sel=>sel.addEventListener('change', ()=>{ S(sel.dataset.id).stage=sel.value; saveScen(); renderFunnel(matches()); }));
  $$('#uwtable [data-act="sheet"]').forEach(b=>b.addEventListener('click', ()=>openSheet(b.dataset.id)));
}
function openSheet(id){ sheetId=id; renderSheet(); const el=$('#uwsheet'); if(el.firstChild) el.scrollIntoView({behavior:'smooth', block:'start'}); }
function renderSheet(){
  const X=L(); const box=$('#uwsheet'); if(!sheetId){ box.innerHTML=''; return; }
  const l=X.allListings().find(x=>x.id===sheetId); if(!l){ box.innerHTML=''; return; }
  const s=S(l.id); const u=withFin(l, baseInputs(l, s)); const uw=underwrite(l, u);
  const dev=window.LXDev.assess(l); const devSel=new Set(s.dev||[]);
  const applied=dev.list.filter(o=>devSel.has(o.id)&&o.feas!=='no');
  const devCapex=applied.reduce((t,o)=>t+o.capex,0), devRent=applied.reduce((t,o)=>t+o.addRent,0), devValue=applied.reduce((t,o)=>t+o.addValue,0);
  const uwAfter = applied.length? underwrite(l, Object.assign({},u,{rehab:u.rehab+devCapex, rentMo:u.rentMo+devRent, arv: uw.arv+devValue})) : null;
  let _bestFin=null,_bestCf=-1e18; u.opts.forEach(o=>{ if(o.disabled) return; const t=underwrite(l, Object.assign({},u,{finOpt:o})); if(t.cfMo>_bestCf){ _bestCf=t.cfMo; _bestFin=o.id; } });
  const finCards=u.opts.map(o=>{ if(o.disabled) return `<div class="fincard" style="opacity:.45"><b>${o.name}</b><div class="d">${o.note}</div><div class="cf">n/a</div></div>`; const t=underwrite(l, Object.assign({},u,{finOpt:o})); return `<div class="fincard" role="button" tabindex="0" aria-pressed="${u.finOpt.id===o.id}" data-fin="${o.id}"><b>${o.name}${o.id===_bestFin?' <span style="color:var(--good);font-size:10px">★ best cash flow</span>':''}</b><div class="d">${o.note} · ${o.rate.toFixed(2)}%</div><div class="cf ${t.cfMo>0?'pos':'neg'}">${(t.cfMo>0?'+':'')+X.fmt$(t.cfMo)}/mo · ${t.dscr?t.dscr.toFixed(2):'—'}</div></div>`; }).join('');
  const mo=s.maxOffer!=null? s.maxOffer : (()=>{ const v=maxOffer(l,u); if(v){ s.maxOffer=Math.round(v); s.gap=(v/price0(l)-1)*100; saveScen(); } return s.maxOffer; })();
  const tname=TARGETS.find(t=>t[0]===bb.target)[1];
  const ok=targetTest(uw);
  /* The due-diligence list used to be twelve hardcoded strings, written for San
     Francisco and shipped unchanged in every edition: it asked a New Orleans
     buyer for an SF 3R report and for rent-board history that Louisiana has no
     such thing as, and it never mentioned a franchise agreement to anyone
     buying a hotel. It is now the closing packet — generated from the Academy's
     own transaction checklist, filtered to this property's asset class, and
     joined to the edition's state (src/packet.js, docs/CLOSING_PACKET.md).

     Ticks are stored by item id. They used to be stored by POSITION, so every
     edit to the list silently re-pointed a saved tick at a different item;
     numbers left in an old scenario are dropped rather than reinterpreted. */
  const done=new Set((s.checks||[]).filter(x=>typeof x==='string'));
  const rates=[u.finOpt.rate-1,u.finOpt.rate-0.5,u.finOpt.rate,u.finOpt.rate+0.5,u.finOpt.rate+1];
  const offers=[0.85,0.9,0.95,1,1.05].map(k=>Math.round(u.offer*k/1000)*1000);
  const sens=`<table class="sens"><tr><th>Offer ↓ / Rate →</th>${rates.map(r=>`<th>${r.toFixed(2)}%</th>`).join('')}</tr>${offers.map(of=>`<tr><td>${X.fmt$(of)}${of===u.offer?' ←':''}</td>${rates.map(rt=>{ const t=underwrite(l, Object.assign({},u,{offer:of, finOpt:Object.assign({},u.finOpt,{rate:rt})})); return `<td class="${t.cfMo>0?'pos':'neg'}">${(t.cfMo>0?'+':'')+X.fmt$(t.cfMo)}</td>`; }).join('')}</tr>`).join('')}</table>`;
  const devLine=applied.length? `Planned improvements: ${applied.map(o=>o.name+' ('+X.fmt$(o.capex)+')').join('; ')}\n` : '';
  const draft=`LETTER OF INTENT — NON-BINDING\n\nProperty: ${window.LXPACKET? LXPACKET.addressLine(l) : [l.addr,l.city,l.zip].filter(Boolean).join(', ')}\nAPN: ${l.apn||'—'}\n\nPurchase price: ${X.fmtFull(u.offer)}\nEarnest money: ${X.fmtFull(Math.round(u.offer*0.03))} (3%)\nFinancing: ${u.finOpt.name} — ${u.finOpt.down}% down at ~${u.finOpt.rate.toFixed(2)}%\nInspection contingency: 10 days\nFinancing contingency: 21 days\nClose of escrow: 30 days\n${(l.units||1)>1?'Condition: delivery of estoppel certificates and current rent roll\n':''}${u.rehab>0?`Basis for price: ${X.fmtFull(u.rehab)} of documented repair scope (attached)\n`:''}${devLine}\nRationale (for your negotiation, not the letter):\n- At ${X.fmtFull(price0(l))} the property runs ${uw.cfMo<0?X.fmt$(-uw.cfMo)+'/mo negative':X.fmt$(uw.cfMo)+'/mo positive'} at ${u.finOpt.down}% down.\n- ${mo? `It meets "${tname}" at ${X.fmtFull(Math.round(mo))}.` : `It does not meet "${tname}" at any realistic price with these rents.`}\n- Rent basis: $${X.fmtN(u.rentMo)}/mo (${X.esc(u.analysis.d.rentHow)}).\n\nThis summary was generated by locator.x from public records and index data. Verify everything; not legal advice.`;
  box.innerHTML=`<div class="sheet"><div class="sheethead">${D().ring(u.analysis.score,u.analysis.cat,84,true)}<div style="flex:1;min-width:260px"><div class="eyebrow">Underwriting sheet · ${STG[s.stage][1]}</div><h3>${X.esc(l.addr)}, ${X.esc(l.city)}</h3><div style="font-size:13px;color:var(--muted)">Recorded ${X.fmt$(price0(l))} (${l.priceDate||'—'}) · ${X.esc(l.kind)}${l.sqft?' · '+X.fmtN(l.sqft)+' sf':''}${l.year?' · built '+l.year:''} · ${X.esc(l.nb||l.anb||l.zip||'')}</div>
    <div class="solver"><div><div class="v">${mo? X.fmt$(mo) : 'No price'}</div><div class="l">max offer for ${X.esc(tname)}</div></div><div><div class="v" style="color:${gapColor(s.gap)}">${s.gap!=null? (s.gap>0?'+':'')+s.gap.toFixed(0)+'%':'—'}</div><div class="l">vs recorded price</div></div><div><div class="v" style="color:${ok?'var(--good)':'var(--bad)'}">${ok?'PASSES':'FAILS'}</div><div class="l">at your current offer</div></div><button class="btn" id="useMax" ${mo?'':'disabled'}>Use max offer</button></div></div>
    <div style="display:flex;flex-direction:column;gap:6px"><button class="btn" id="uwmap">Open on map</button><button class="btn" id="uwres">Research report</button><button class="btn primary" id="uwpdf">Export PDF memo</button><button class="btn" id="uwreel">Render video reel</button><button class="btn" id="uwcopy">Copy sheet</button><button class="btn" id="uwdesk" title="This case in the standalone worksheet's JSON shape — insurance ships blank because the app only has an estimate and that field requires a quote">Desk worksheet JSON</button>${window.LXVoice?LXVoice.speakButton('uwsheet-'+l.id,null,'&#128266; Listen to summary'):''}<button class="btn" id="uwclose">Close</button></div></div>
  <div class="sheetgrid">
    <div class="in"><h4>Inputs</h4>
      <div class="inrow"><span>Offer price $</span><input type="number" id="u_offer" value="${u.offer}" step="10000"></div>
      <div class="inrow"><span>Rent (all units) $/mo</span><input type="number" id="u_rent" value="${u.rentMo}"></div>
      <h4 style="margin-top:12px">Rehab</h4>
      <div class="presets">${REHAB.map(rp=>`<button data-rp="${rp[0]}" aria-pressed="${u.rehabPreset===rp[0]}">${rp[1]}</button>`).join('')}</div>
      <div class="inrow"><span>Rehab budget $</span><input type="number" id="u_rehab" value="${u.rehab}" step="5000"></div>
      <div class="inrow"><span>Contingency %</span><input type="number" id="u_cont" value="${u.cont}"></div>
      <div class="inrow"><span>After-repair value $</span><input type="number" id="u_arv" value="${s.arv||''}" placeholder="${Math.round(uw.arv)}"></div>
      <h4 style="margin-top:12px">Operating</h4>
      <div class="inrow"><span>Self-manage</span><input type="checkbox" id="u_self" ${u.selfManage?'checked':''} style="width:auto;justify-self:end"></div>
      <div class="inrow"><span>HOA $/mo</span><input type="number" id="u_hoa" value="${s.hoa!=null?s.hoa:''}" placeholder="${/condo/i.test(l.kind||'')?450:0}"></div>
      <div class="inrow"><span>Owner-paid utilities $/mo</span><input type="number" id="u_util" value="${s.util!=null?s.util:''}" placeholder="${(l.units||1)>1? Math.round(Math.min(90*(l.units||1), u.rentMo*0.12)):0}"></div>
      <h4 style="margin-top:12px">Financing</h4>
      <div class="fincards">${finCards}</div>
    </div>
    <div>
      <div class="outs">
        <div class="out ${uw.cfMo>0?'good':'bad'}"><div class="v">${(uw.cfMo>0?'+':'')+X.fmt$(uw.cfMo)}</div><div class="l">Cash flow / mo</div></div>
        <div class="out ${uw.dscr>=1.2?'good':uw.dscr>=1?'warn':'bad'}"><div class="v">${uw.dscr?uw.dscr.toFixed(2):'—'}</div><div class="l">DSCR</div></div>
        <div class="out ${uw.coc>0?'good':'bad'}"><div class="v">${pct(uw.coc)}</div><div class="l">Cash-on-cash</div></div>
        <div class="out"><div class="v">${pct(uw.capCost)}</div><div class="l">Cap on total cost</div></div>
        <div class="out ${uw.beOcc<=90?'good':uw.beOcc<=100?'warn':'bad'}"><div class="v">${uw.beOcc? uw.beOcc.toFixed(0)+'%':'—'}</div><div class="l">Break-even occupancy</div></div>
        <div class="out"><div class="v">${X.fmt$(uw.cash)}</div><div class="l">Cash to close (incl. rehab)</div></div>
        <div class="out ${uw.irr!=null&&uw.irr>0.08?'good':uw.irr!=null&&uw.irr>0?'warn':'bad'}"><div class="v">${uw.irr!=null? (uw.irr*100).toFixed(1)+'%':'—'}</div><div class="l">5-yr IRR (sold yr 5)<div style="font-size:10px;color:var(--muted);margin-top:2px">at ${uw.appr.toFixed(1)}%/yr — ${uw.apprSrc==='yours'?'your figure':uw.apprSrc==='fitted'?'fitted 12-mo trend':uw.apprSrc==='yoy'?'last 12 months only':'no index; 2% assumed'}</div></div></div>
        <div class="out"><div class="v">${X.fmt$(uw.arv)}</div><div class="l">After-repair value</div></div>
        ${uw.fhaSelfSuff!=null? `<div class="out ${uw.fhaSelfSuff?'good':'bad'}"><div class="v">${uw.fhaSelfSuff?'PASS':'FAIL'}</div><div class="l">FHA self-sufficiency (3–4 units)</div></div>`:''}
      </div>
      <h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 4px">Ten more screening numbers</h4>
      <div class="outs">
        <div class="out"><div class="v">${uw.grm!=null?uw.grm.toFixed(1):'—'}</div><div class="l">Gross rent multiplier</div></div>
        <div class="out"><div class="v">${uw.pricePerUnit!=null?X.fmt$(uw.pricePerUnit):'—'}</div><div class="l">Price / unit</div></div>
        <div class="out"><div class="v">${uw.pricePerSqft!=null?'$'+uw.pricePerSqft.toFixed(0):'—'}</div><div class="l">Price / sq ft</div></div>
        <div class="out"><div class="v">${uw.rentPerSqft!=null?'$'+uw.rentPerSqft.toFixed(2):'—'}</div><div class="l">Rent / sq ft / mo</div></div>
        <div class="out ${uw.onePctRule!=null?(uw.onePctRule>=1?'good':uw.onePctRule>=0.8?'warn':'bad'):''}"><div class="v">${uw.onePctRule!=null?uw.onePctRule.toFixed(2)+'%':'—'}</div><div class="l">The "1% rule" (rent ÷ price)</div></div>
        <div class="out ${uw.debtYield!=null?(uw.debtYield>=10?'good':uw.debtYield>=8?'warn':'bad'):''}"><div class="v">${uw.debtYield!=null?uw.debtYield.toFixed(1)+'%':'—'}</div><div class="l">Debt yield (NOI ÷ loan)</div></div>
        <div class="out"><div class="v">${uw.ltv!=null?uw.ltv.toFixed(0)+'%':'—'}</div><div class="l">Loan-to-value</div></div>
        <div class="out"><div class="v">${uw.ltc!=null?uw.ltc.toFixed(0)+'%':'—'}</div><div class="l">Loan-to-cost (incl. rehab)</div></div>
        <div class="out ${uw.oer!=null?(uw.oer<=45?'good':uw.oer<=55?'warn':'bad'):''}"><div class="v">${uw.oer!=null?uw.oer.toFixed(0)+'%':'—'}</div><div class="l">Operating expense ratio</div></div>
        <div class="out"><div class="v">${uw.paybackYears!=null?uw.paybackYears.toFixed(1)+' yr':'∞'}</div><div class="l">Cash payback (cash flow only)</div></div>
        <div class="out"><div class="v">${uw.eqMult!=null?uw.eqMult.toFixed(2)+'×':'—'}</div><div class="l">5-yr equity multiple</div></div>
      </div>
      <h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:16px 0 4px">How far it can be pushed — the stress block</h4>
      <div style="font-size:11.5px;color:var(--muted);margin:0 0 6px;max-width:72ch">The screening numbers above say how the deal looks today. These say where it stops working — the questions a credit committee asks next, and the ones that decide whether you keep the building through a bad year. All arithmetic over the same stack; nothing new is assumed.</div>
      <div class="outs">
        <div class="out"><div class="v">${uw.breakevenRent!=null? X.fmt$(uw.breakevenRent):'—'}</div><div class="l">Break-even rent / mo<div style="font-size:10px;color:var(--muted);margin-top:2px">where NOI exactly covers debt service</div></div></div>
        <div class="out ${uw.rentCushion==null?'':uw.rentCushion>=20?'good':uw.rentCushion>=0?'warn':'bad'}"><div class="v">${uw.rentCushion!=null? (uw.rentCushion>0?'−':'+')+Math.abs(uw.rentCushion).toFixed(0)+'%':'—'}</div><div class="l">Rent cushion<div style="font-size:10px;color:var(--muted);margin-top:2px">${uw.rentCushion==null?'unknown':uw.rentCushion>=0? 'rent can fall this far first':'rent is already below break-even'}</div></div></div>
        <div class="out"><div class="v">${uw.breakevenRate!=null? uw.breakevenRate.toFixed(2)+'%':'—'}</div><div class="l">Break-even rate<div style="font-size:10px;color:var(--muted);margin-top:2px">${uw.rateHeadroom!=null? (uw.rateHeadroom>0? '+'+uw.rateHeadroom.toFixed(2)+' pts of headroom':'already past it'):'NOI does not cover any rate'}</div></div></div>
        <div class="out ${uw.loanGap==null?'':uw.loanGap>=0?'good':'bad'}"><div class="v">${uw.maxLoan125!=null? X.fmt$(uw.maxLoan125):'—'}</div><div class="l">Loan this NOI supports at DSCR 1.25<div style="font-size:10px;color:var(--muted);margin-top:2px">${uw.loanGap==null?'unknown':uw.loanGap>=0? X.fmt$(uw.loanGap)+' above the modeled loan':X.fmt$(-uw.loanGap)+' short — a lender sizes you down'}</div></div></div>
        <div class="out ${uw.stressPass>=3?'good':uw.stressPass>=2?'warn':'bad'}"><div class="v">${uw.stressPass}/4</div><div class="l">Stresses still covering debt</div></div>
      </div>
      <table class="sens" style="margin-top:8px"><tr><th>Stress</th><th>DSCR</th><th>Covers debt?</th></tr>
      ${[['Rate +200 bp','rate200'],['Rent −10%','rent10'],['Vacancy +5 pts','vac5'],['All three at once','all']].map(([lab,k])=>{ const v=uw.stress[k]; return `<tr><td>${lab}</td><td>${v!=null? v.toFixed(2):'—'}</td><td class="${v==null?'':v>=1?'pos':'neg'}">${v==null?'unknown':v>=1?'yes':'no'}</td></tr>`; }).join('')}
      </table>
      <div style="font-size:11px;color:var(--muted);margin:6px 0 0;max-width:72ch">A stress is not a forecast. It is the same deal with one input moved to a level that has happened before, which is the only honest way to ask what the margin of safety is. Unknown inputs stay unknown here too — a blank row is a missing input, never a passing one.</div>
      ${(()=>{ try{
        if(!window.LXPredict || !l.zip) return '';
        const f = LXPredict.forecastZip(l.zip, 'val');
        if(!f || f.lo==null || f.hi==null || !(f.last>0) || !f.points || !f.points.length) return '';
        const H = f.points.length;
        const lo = Math.pow(f.lo/f.last, 12/H)-1, hi = Math.pow(f.hi/f.last, 12/H)-1;
        const bear = underwrite(l, Object.assign({},u,{apprOverride: lo*100}));
        const bull = underwrite(l, Object.assign({},u,{apprOverride: hi*100}));
        const row = (label,t)=>`<div class="out ${t.irr!=null&&t.irr>0?'good':'bad'}"><div class="v">${t.irr!=null?(t.irr*100).toFixed(1)+'%':'—'}</div><div class="l">${label} 5-yr IRR<div style="font-size:10px;color:var(--muted);margin-top:2px">${t.appr.toFixed(1)}%/yr appreciation</div></div></div>`;
        return `<h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:16px 0 4px">Predictive tool — bear / base / bull, from the measured backtest band</h4>
        <div style="font-size:11.5px;color:var(--muted);margin:0 0 6px;max-width:70ch">Not three guesses — the low and high case are this ZIP's fitted trend run through the same out-of-sample backtest error the Predictions tab measures, then converted back to an annual rate. The base case is the fitted trend alone.</div>
        <div class="outs">${row('Bear', bear)}${row('Base', uw)}${row('Bull', bull)}</div>`;
      }catch(e){ return ''; } })()}
      ${window.LXLocator? LXLocator.panel(l, uw) : ''}
      ${insightsBlock(l, uw)}
      <h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:16px 0 6px">Sources — verify before you offer</h4>
      <div class="tile" style="font-size:12.5px;line-height:1.6">
        <div><b>Property record:</b> ${X.srcLine? X.srcLine(l) : X.esc(l.src||'—')}</div>
        ${(()=>{ try{ const mk=X.marketFor(l); return mk && mk.src? `<div style="margin-top:4px"><b>Market index (rent &amp; value trend):</b> ${X.srcLine? X.srcLine({src:mk.src}) : X.esc(mk.src)}</div>` : ''; }catch(e){ return ''; } })()}
        ${l.url?`<div style="margin-top:4px"><b>Original listing:</b> <a href="${X.esc(l.url)}" target="_blank" rel="noopener">${X.esc(l.url)}</a></div>`:''}
        <div style="margin-top:6px;color:var(--muted)">Every link opens the public agency's own portal in a new tab — click through and re-pull the record yourself before relying on any number here. Prices from a county roll are the post-sale assessed value, not necessarily today's market value; records marked "estimate" price from the ZIP's Zillow index because that county publishes no assessed values at all.</div>
      </div>
      <h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 6px">Annual operating statement</h4>
      <table class="pl"><tr><td>Gross rent ($${X.fmtN(u.rentMo)}/mo)</td><td>${X.fmtFull(uw.rent)}</td></tr><tr><td>Vacancy</td><td>−${X.fmtFull(uw.vac)}</td></tr><tr><td>Tax ${X.taxRate(l)}% · insurance · upkeep</td><td>−${X.fmtFull(uw.tax+uw.ins+uw.maint+uw.capex)}</td></tr>${uw.mgmt?`<tr><td>Management</td><td>−${X.fmtFull(uw.mgmt)}</td></tr>`:''}${uw.hoa?`<tr><td>HOA</td><td>−${X.fmtFull(uw.hoa)}</td></tr>`:''}${uw.util?`<tr><td>Owner-paid utilities</td><td>−${X.fmtFull(uw.util)}</td></tr>`:''}<tr class="total"><td>NOI</td><td>${X.fmtFull(uw.noi)}</td></tr><tr><td>Debt service (${u.finOpt.name}${u.finOpt.mi?', incl. MIP':''})</td><td>−${X.fmtFull(uw.ds)}</td></tr><tr class="total"><td>Cash flow</td><td class="${uw.cf>0?'pos':'neg'}">${X.fmtFull(uw.cf)}</td></tr></table>
      <h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 6px">Sensitivity — monthly cash flow</h4>
      ${sens}
      ${(()=>{ try{ return window.LXOutlookViz? LXOutlookViz.block(l,u,uw,{sect:false}) : ''; }catch(e){ return ''; } })()}
      ${(()=>{ const a2=L().state.assump; const stab=uw.arv+(applied.length?devValue:0); const newLoan=stab*0.75; const cashOut=Math.max(0,newLoan-uw.loan); const capLeft=Math.max(0,uw.cash+(applied.length?devCapex:0)-cashOut); const k2=payK(u.finOpt.rate+0.25,a2.term); const ds2=newLoan*k2; const rentStab=(u.rentMo+(applied.length?devRent:0))*12; const noi2=rentStab*(1-a2.vacancy/100)-(uw.tax+uw.ins+rentStab*(a2.maint+a2.capex)/100+(u.selfManage?0:rentStab*(1-a2.vacancy/100)*a2.mgmt/100)+uw.hoa+uw.util); const cf2=noi2-ds2; const roc= capLeft>0? cf2/capLeft*100 : null;
      return `<h4 style=\"font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:16px 0 4px\">Refinance exit — buy, rehab, rent, refinance, repeat</h4>
      <div class=\"outs\">
        <div class=\"out\"><div class=\"v\">${X.fmt$(stab)}</div><div class=\"l\">Stabilized value</div></div>
        <div class=\"out\"><div class=\"v\">${X.fmt$(newLoan)}</div><div class=\"l\">New loan @ 75% LTV</div></div>
        <div class=\"out ${cashOut>0?'good':''}\"><div class=\"v\">${X.fmt$(cashOut)}</div><div class=\"l\">Capital returned at refi</div></div>
        <div class=\"out\"><div class=\"v\">${X.fmt$(capLeft)}</div><div class=\"l\">Capital left in deal</div></div>
        <div class=\"out ${cf2>0?'good':'bad'}\"><div class=\"v\">${(cf2>0?'+':'')+X.fmt$(cf2/12)}</div><div class=\"l\">Cash flow / mo after refi</div></div>
        <div class=\"out ${capLeft<=0&&cf2>0?'good':roc!=null&&roc>8?'good':roc!=null&&roc>0?'warn':'bad'}\"><div class=\"v\">${capLeft<=0? (cf2>0?'∞ — all capital out':'—') : roc!=null? roc.toFixed(1)+'%':'—'}</div><div class=\"l\">Return on capital left in</div></div>
      </div>
      <div style=\"font-size:11px;color:var(--muted);margin:6px 0 0\">Refinance modeled at 75% of stabilized value, ${(u.finOpt.rate+0.25).toFixed(2)}% (seasoning and appraisal apply; lenders typically require 6–12 months). If capital returned covers your cash in, the remaining cash flow is a return on nothing left in the deal — the engine of the repeat cycle.</div>`; })()}
      <h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:16px 0 4px">Development &amp; conversion — can the units be modified, updated or converted?</h4>
      <div class="devsum"><b>Assessment:</b> ${X.esc(dev.zi.fam)}${l.year?' · built '+l.year:''}${l.lot?' · lot '+X.fmtN(l.lot)+' sf':''} · ${l.units||1} unit${(l.units||1)>1?'s':''}. ${X.esc(dev.summary)} Tick a play to fold its cost, rent and value into this sheet.</div>
      <div class="devcards">${dev.list.map(o=>{ const F=window.LXDev.FEAS[o.feas]; const on=devSel.has(o.id); return `<div class="devcard ${on?'on':''} ${o.feas==='no'?'na':''}"><div class="dh"><b>${o.name}</b><span class="badge ${F[1]}">${F[0]}</span></div><div class="basis">${o.basis}.</div>${o.capex?`<div class="nums"><span>Cost<b>${X.fmt$(o.capex)}</b></span>${o.addRent?`<span>Adds rent<b class="pos">+$${X.fmtN(o.addRent)}/mo</b></span>`:''}<span>Adds value<b>${X.fmt$(o.addValue)}</b></span><span>Profit<b class="${o.profit>0?'pos':'neg'}">${(o.profit>0?'+':'')+X.fmt$(o.profit)}</b></span><span>Timeline<b>~${o.months} mo</b></span></div>`:''}<div class="note">${o.note}</div>${o.feas!=='no'&&o.capex?`<label class="apply"><input type="checkbox" data-dev="${o.id}" ${on?'checked':''}> Apply to this sheet</label>`:''}</div>`; }).join('')}</div>
      ${uwAfter? `<div class="afterrow"><h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--bay);margin:0 0 8px">After development — ${applied.length} play${applied.length>1?'s':''} applied (${X.fmt$(devCapex)} additional capital, +$${X.fmtN(devRent)}/mo rent)</h4><div class="outs">
        <div class="out ${uwAfter.cfMo>0?'good':'bad'}"><div class="v">${(uwAfter.cfMo>0?'+':'')+X.fmt$(uwAfter.cfMo)}</div><div class="l">Cash flow / mo</div></div>
        <div class="out ${uwAfter.dscr>=1.2?'good':uwAfter.dscr>=1?'warn':'bad'}"><div class="v">${uwAfter.dscr?uwAfter.dscr.toFixed(2):'—'}</div><div class="l">DSCR</div></div>
        <div class="out ${uwAfter.coc>0?'good':'bad'}"><div class="v">${pct(uwAfter.coc)}</div><div class="l">Cash-on-cash</div></div>
        <div class="out"><div class="v">${pct(uwAfter.noi/(uwAfter.P+uwAfter.rehabAll)*100)}</div><div class="l">Yield on total cost</div></div>
        <div class="out ${uw.arv+devValue-(uwAfter.P+uwAfter.rehabAll)>0?'good':'bad'}"><div class="v">${X.fmt$(uw.arv+devValue-(uwAfter.P+uwAfter.rehabAll))}</div><div class="l">Equity created</div></div>
        <div class="out"><div class="v">${X.fmt$(uwAfter.cash)}</div><div class="l">Total cash in</div></div>
        <div class="out ${uwAfter.irr!=null&&uwAfter.irr>0.08?'good':uwAfter.irr!=null&&uwAfter.irr>0?'warn':'bad'}"><div class="v">${uwAfter.irr!=null?(uwAfter.irr*100).toFixed(1)+'%':'—'}</div><div class="l">5-yr IRR</div></div>
        <div class="out"><div class="v">${X.fmt$(uw.arv+devValue)}</div><div class="l">Stabilized value</div></div>
      </div><div style="font-size:11px;color:var(--muted);margin-top:6px">Stabilized: all applied work complete and the new rent in place. During construction, carry the as-is numbers plus the draw schedule.</div></div>`:''}
      <div class="two" style="margin-top:14px">
        <div>${window.LXPACKET? LXPACKET.render(l, {done}) : ''}<div class="toolbar" style="margin-top:8px"><button class="btn" id="copypacket">Copy closing file</button></div></div>
        <div><h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:0 0 6px">Draft offer terms</h4><div class="offerdraft" id="offerdraft">${X.esc(draft)}</div><div class="toolbar" style="margin-top:8px"><button class="btn primary" id="copydraft">Copy terms</button><button class="btn" id="markoff">Mark stage: Offer drafted</button></div></div>
      </div>
    </div>
  </div></div>`;
  const upd=(k,v)=>{ s[k]=v; saveScen(); renderSheet(); };
  $('#u_offer').addEventListener('change', e=>upd('offer', +e.target.value||price0(l)));
  $('#u_rent').addEventListener('change', e=>upd('rentMo', +e.target.value||u.rentMo));
  $('#u_rehab').addEventListener('change', e=>upd('rehab', +e.target.value||0));
  $('#u_cont').addEventListener('change', e=>upd('cont', +e.target.value||0));
  $('#u_arv').addEventListener('change', e=>upd('arv', e.target.value===''? null : +e.target.value));
  $('#u_hoa').addEventListener('change', e=>upd('hoa', e.target.value===''? null : +e.target.value));
  $('#u_util').addEventListener('change', e=>upd('util', e.target.value===''? null : +e.target.value));
  $('#u_self').addEventListener('change', e=>upd('selfManage', e.target.checked));
  $$('#uwsheet .presets button').forEach(b=>b.addEventListener('click', ()=>{ s.rehabPreset=b.dataset.rp; s.rehab=null; s.rentMo=null; saveScen(); renderSheet(); }));
  $$('#uwsheet .fincard[data-fin]').forEach(b=>{ const go=()=>{ s.fin=b.dataset.fin; if(s.stage==='new'||s.stage==='scr') s.stage='uw'; saveScen(); renderSheet(); renderFunnel(matches()); renderTable(matches()); }; b.addEventListener('click', go); b.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } }); });
  $('#useMax').addEventListener('click', ()=>{ if(s.maxOffer){ s.offer=s.maxOffer; if(s.stage==='new'||s.stage==='scr') s.stage='uw'; saveScen(); renderSheet(); } });
  $$('#uwsheet [data-dev]').forEach(c=>c.addEventListener('change', ()=>{ const set=new Set(s.dev||[]); c.checked? set.add(c.dataset.dev) : set.delete(c.dataset.dev); s.dev=[...set]; if(s.stage==='new'||s.stage==='scr') s.stage='uw'; saveScen(); renderSheet(); renderTable(matches()); renderFunnel(matches()); }));
  $$('#uwsheet .checklist input').forEach(c=>c.addEventListener('change', ()=>{ const set=new Set((s.checks||[]).filter(x=>typeof x==='string')); c.checked? set.add(c.dataset.pk) : set.delete(c.dataset.pk); s.checks=[...set]; saveScen(); renderSheet(); }));
  { const b=$('#copypacket'); if(b) b.addEventListener('click', ()=>{ const t=window.LXPACKET? LXPACKET.asText(l, done) : ''; navigator.clipboard.writeText(t).then(()=>X.toast('Closing file copied — take it to your attorney, not instead of one')).catch(()=>X.toast('Copy failed')); }); }
  $('#uwmap').onclick=()=>X.select(l.id,true); $('#uwres').onclick=()=>{ window.LXResearch.subjectFrom(l); X.showView('research'); };
  if(window.LXVoice) LXVoice.wireSpeakButtons($('#uwsheet'), function(){
    return `${l.addr}, ${l.city}. ${tname}. Recorded price ${X.fmt$(price0(l))}. `
      + `At your current offer of ${X.fmt$(u.offer)}, cash flow is ${X.fmt$(uw.cfMo)} a month, `
      + `DSCR ${uw.dscr?uw.dscr.toFixed(2):'not available'}, cash on cash ${pct(uw.coc)}. `
      + `${mo? `Maximum offer for this target is ${X.fmt$(Math.round(mo))}.` : 'This deal does not meet the target at any realistic price.'} `
      + `${ok? 'It passes at your current offer.' : 'It fails at your current offer.'}`;
  });
  const _extra={maxOffer:mo?Math.round(mo):null, gap:s.gap, draft, applied};
    try{
    if(window.LXPropTime){
      const _ptHost=document.createElement('div');
      _ptHost.className='tile';
      _ptHost.style.cssText='margin-top:12px';
      _ptHost.setAttribute('data-panel','');
      _ptHost.setAttribute('data-panel-title','This property across time');
      _ptHost.innerHTML='<p class="eyebrow" style="margin:0 0 2px">This property across time</p>'
        +'<p style="font-size:12.5px;color:var(--ink2);margin:0 0 6px;max-width:80ch">The same replay that moves the whole app, narrowed to this parcel and recomputed at your current assumptions.</p>'
        +window.LXPropTime.sheet(l);
      const _sh=$('#uwsheet .sheet')||$('#uwsheet');
      if(_sh) _sh.appendChild(_ptHost);
    }
  }catch(e){}
$('#uwpdf').onclick=()=>{ if(window.LXUWX) LXUWX.exportPDF(l,u,uw,_extra); };
  $('#uwreel').onclick=()=>{ const b=$('#uwreel'); if(!window.LXUWX||b.disabled) return; b.disabled=true; const t0=b.textContent;
    LXUWX.exportReel(l,u,uw,_extra,p=>{ b.textContent='Rendering '+Math.round(p*100)+'%'; }).finally(()=>{ b.disabled=false; b.textContent=t0; }); };
  $('#uwdesk').onclick=()=>{ const rec=deskRecord(l,u,uw,L().state.assump);
    const ael=document.createElement('a');
    ael.href=URL.createObjectURL(new Blob([JSON.stringify(rec,null,1)],{type:'application/json'}));
    ael.download='locator-x-desk-'+(l.id||'case')+'.json';
    document.body.appendChild(ael); ael.click();
    setTimeout(()=>{ URL.revokeObjectURL(ael.href); ael.remove(); },1000);
    X.toast('Desk worksheet exported — its insurance field is blank until you have a real quote'); };
  $('#uwclose').onclick=()=>{ sheetId=null; renderSheet(); };
  $('#markoff').onclick=()=>{ s.stage='off'; saveScen(); renderSheet(); renderFunnel(matches()); renderTable(matches()); X.toast('Stage set to Offer drafted'); };
  $('#copydraft').onclick=async()=>{ try{ await navigator.clipboard.writeText(draft); X.toast('Offer terms copied'); }catch(e){ X.toast('Clipboard blocked in this host'); } };
  $('#uwcopy').onclick=async()=>{ const md=`# Underwriting — ${l.addr}, ${l.city}\n\nOffer ${X.fmtFull(u.offer)} · Rent $${X.fmtN(u.rentMo)}/mo · Rehab ${X.fmtFull(uw.rehabAll)} · ${u.finOpt.name} (${u.finOpt.down}% @ ${u.finOpt.rate.toFixed(2)}%)\n\n| Metric | Value |\n|---|---|\n| NOI | ${X.fmtFull(uw.noi)} |\n| Cash flow | ${X.fmtFull(uw.cf)}/yr (${X.fmt$(uw.cfMo)}/mo) |\n| DSCR | ${uw.dscr?uw.dscr.toFixed(2):'—'} |\n| Cash-on-cash | ${pct(uw.coc)} |\n| Cap on cost | ${pct(uw.capCost)} |\n| Break-even occupancy | ${uw.beOcc?uw.beOcc.toFixed(0)+'%':'—'} |\n| Cash to close | ${X.fmtFull(uw.cash)} |\n| 5-yr IRR | ${uw.irr!=null?(uw.irr*100).toFixed(1)+'%':'—'} |\n| Max offer @ ${tname} | ${mo?X.fmtFull(Math.round(mo)):'n/a'} |\n\n${draft}\n`; try{ await navigator.clipboard.writeText(md); X.toast('Sheet copied as Markdown'); }catch(e){ X.toast('Clipboard blocked in this host'); } };
}
/* sheetFor(l) — the same {inputs, sheet} pair the underwriting tab builds for a
   property, exposed so other modules (the LOCATOR screen, the level gates) can
   compute against exactly what this tab shows rather than re-deriving it and
   drifting. Returns null if the property cannot be underwritten. */
function sheetFor(l){
  try{
    if(!l) return null;
    const s=S(l.id); const u=withFin(l, baseInputs(l, s)); const uw=underwrite(l, u);
    return {u:u, uw:uw};
  }catch(e){ return null; }
}
/* deskRecord — this sheet's case in the standalone worksheet's own JSON shape,
   so a desk can open it in pages/locator-x-underwriting-worksheet.html (Import)
   or any edition's Desk-worksheet panel. Pure function of its arguments — no
   globals — so it is testable outside the app runtime.

   The one field deliberately left BLANK is insurance: the worksheet's field is
   'Insurance — quoted' and demands a written quote, while this app carries an
   ESTIMATE from its cost model. Writing the estimate into a quote field would
   launder a guess into a stronger claim, so the export ships the unknown — the
   desk's DSCR stays unknown until a real quote is typed, which is the correct
   answer. Outputs follow the worksheet's own arithmetic over the exported
   inputs (per-unit rent, opex excl. taxes & insurance, no MI/MIP), not this
   sheet's richer stack, so the desk file recomputes to exactly what it says.
   Every input's derivation is named in `provenance`. */
function deskRecord(l, u, uw, a){
  const units=l.units||1, unitsAssumed=l.units==null;
  const rentUnit=Math.round(u.rentMo/units);
  const opexPct= uw.egi>0? Math.round((uw.opex-uw.tax-uw.ins)/uw.egi*1000)/10 : null;
  const inputs={ units:units, rentUnit:rentUnit, otherInc:null, vacancy:a.vacancy,
    opexPct:opexPct, taxes:Math.round(uw.tax), insurance:null,
    loan:Math.round(uw.loan), rate:Math.round(u.finOpt.rate*100)/100, amort:a.term };
  // the worksheet's arithmetic over the exported inputs, nothing more
  const gross=inputs.units*inputs.rentUnit*12, eff=gross*(1-inputs.vacancy/100);
  const r=inputs.rate/100/12, n=inputs.amort*12;
  const ads= inputs.loan>0? (r===0? inputs.loan/n*12 : inputs.loan*r/(1-Math.pow(1+r,-n))*12) : 0;
  const missing=['Insurance — quoted']; if(opexPct==null) missing.unshift('Operating expenses');
  const rentHow=(u.analysis&&u.analysis.d&&u.analysis.d.rentHow)||'index-derived';
  return {
    worksheet:'Locator.X per-class underwriting',
    asset_class: units>=5? 'Apartments 5+' : 'Small multifamily',
    generated:new Date().toISOString(),
    exported_from:'the record-driven Underwriting tab — '+l.addr+', '+l.city,
    inputs:inputs,
    provenance:{
      'Units': unitsAssumed? 'not in the record — 1 assumed by the app; verify before relying'
        : 'property record ('+(l.src||'this edition’s catalog')+')',
      'Rent per unit': 'the app’s rent basis ('+rentHow+'), divided across '+units+' unit(s) — not a rent roll',
      'Vacancy + credit loss': 'app assumption ('+a.vacancy+'%), not a T-12',
      'Operating expenses': 'the app’s expense stack excl. taxes & insurance, from its cost library — not a T-12',
      'Property taxes': 'assessed value × the jurisdiction’s tax rate as modeled by this edition',
      'Insurance — quoted': 'LEFT BLANK on purpose — the app carries an estimate ($'+Math.round(uw.ins).toLocaleString()+'/yr) and this field requires a written quote',
      'Loan amount': u.finOpt.name+' at '+u.finOpt.down+'% down on the offer price — an offer, not a record',
      'Interest rate': u.finOpt.name+' modeled rate'+(u.finOpt.mi? ' (MI/MIP excluded — the worksheet does not model it)':'')+' — an offer, not a record',
      'Amortization': 'app assumption ('+a.term+' years)'
    },
    outputs:{ effective_income:Math.round(eff), operating_expenses:null, noi:null,
      annual_debt_service:Math.round(ads), dscr:null, missing_required:missing },
    disclaimer:'Education, not advice; not a valuation. Exported from record-plus-assumption numbers: every input needs its document before relying, and the blank insurance field needs a real quote. Unknown means unknown.'
  };
}
window.LXUW={rentBlind, rentFloorOn, render, openSheet, underwrite, sheetFor, deskRecord, maxOffer, matches, get bb(){ return bb; }};
})();
