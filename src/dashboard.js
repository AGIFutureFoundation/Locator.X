/* locator.x — Locator X dashboard: scoring, recommendations, charts, lessons */
(function(){
'use strict';
const L = () => window.LX;
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(x,x0,x1,y0,y1)=>clamp(y0+(x-x0)/(x1-x0)*(y1-y0), Math.min(y0,y1), Math.max(y0,y1));
const pct=(v,d=1)=>L().fmtPct(v,d);

/* ---------- categories (fixed order; colors validated in both themes) ---------- */
const CATS = [
  {id:'asset', name:'Cash-flow asset', c:'--cat1', shape:'circle', blurb:'Pays you after the mortgage. The Locator X definition of an asset.'},
  {id:'hack', name:'House-hack candidate', c:'--cat2', shape:'square', blurb:'2–4 units you can buy with an owner-occupied loan; live in one, let the others carry it.'},
  {id:'value', name:'Value-add / ADU play', c:'--cat3', shape:'diamond', blurb:'Cash-flow negative as-is, but the lot, the unit count or the age give you a lever.'},
  {id:'growth', name:'Appreciation bet', c:'--cat4', shape:'triangle', blurb:'Negative cash flow in a rising ZIP. Speculation — fine if you call it that.'},
  {id:'liab', name:'Liability at this price', c:'--cat5', shape:'cross', blurb:'Rent covers too little of the loan and the market isn\'t bailing you out.'}
];
const CAT = Object.fromEntries(CATS.map(c=>[c.id,c]));
const FHA_4UNIT = 2326875; // 2025 FHA 4-unit limit, high-cost counties

function rentControl(l){
  const y=l.year, city=(l.city||'').toLowerCase(), multi=(l.units||1)>1 || /unit|plex|flat/i.test(l.kind||'');
  const sfrExempt = !multi && !/condo/i.test(l.kind||'') ? false : false;
  if(city==='san francisco' && y && y<1979 && (multi || /condo/i.test(l.kind||'')===false && l.units>1)) return {reg:'SF Rent Ordinance (built before June 1979)', level:'bad'};
  if(city==='oakland' && y && y<1983 && multi) return {reg:'Oakland Rent Adjustment Program (built before 1983)', level:'bad'};
  if(city==='berkeley' && y && y<1980 && multi) return {reg:'Berkeley Rent Stabilization (built before 1980)', level:'bad'};
  if(y && y<2011 && multi) return {reg:'AB 1482 statewide cap (5% + CPI, max 10%)', level:'warn'};
  if(!y && multi) return {reg:'Likely AB 1482 or local rent control — verify year built', level:'warn'};
  if(!multi) return {reg: /condo/i.test(l.kind||'') ? 'Condo — generally exempt from AB 1482 with proper notice' : 'Single-family — generally exempt from AB 1482 with proper notice', level:'good'};
  return {reg:'Newer building — AB 1482 exempt for 15 years from certificate of occupancy', level:'good'};
}
function valueAdd(l){
  const items=[]; let s=0;
  const multi=(l.units||1)>1;
  if(multi){ s+=25; items.push(`${l.units} units mean rents reset on every turnover and one vacancy never empties the building`); }
  if(l.lot && l.lot>=4000 && !/condo/i.test(l.kind||'')){ s+=25; items.push(`a ${L().fmtN(l.lot)} sf lot allows an ADU by right under state law, and an SB 9 lot split is possible`); }
  else if(l.lot && l.lot>=2500 && !/condo/i.test(l.kind||'')){ s+=15; items.push(`a ${L().fmtN(l.lot)} sf lot leaves room for a garage-conversion or small detached ADU`); }
  if(l.year && l.year<1960){ s+=15; items.push(`${l.year} construction means a renovation on turnover resets both rent and value`); }
  if(/store|flat/i.test(l.classdef||'')){ s+=10; items.push('a mixed-use / flats classification allows a commercial ground floor or an added unit'); }
  if(l.rooms && l.beds && l.rooms-l.beds>=5){ s+=10; items.push(`${l.rooms} rooms for ${l.beds} bedrooms leave room to add a bedroom`); }
  if(!l.sqft && !l.beds){ s+=10; items.push('the county record lacks building detail, so walk it — surprises cut both ways'); }
  return {score:clamp(s,0,100), items};
}
function breakEvenDown(d, l){
  // down payment % at which cash flow = 0
  const a=L().state.assump; const r=a.rate/100/12, n=a.term*12; const k = r>0? r/(1-Math.pow(1+r,-n)) : 1/n; // payment per $ of loan per month
  const maxLoan = d.noi/12/k; const down = 1 - maxLoan/d.P; return clamp(down*100, 0, 100);
}
let _ppsfCache=null;
function cityPpsfOf(city){ if(!_ppsfCache){ _ppsfCache={}; const X=L(); const by={}; X.allListings().forEach(x=>{ if(x.sqft) (by[x.city]=by[x.city]||[]).push(X.price(x)/x.sqft); }); for(const c in by) _ppsfCache[c]=X.median(by[c]); } return _ppsfCache[city]; }
const _SUF={STREET:'ST',AVENUE:'AVE',DRIVE:'DR',ROAD:'RD',BOULEVARD:'BLVD',COURT:'CT',PLACE:'PL',LANE:'LN',HIGHWAY:'HWY',PARKWAY:'PKWY',CIRCLE:'CIR',TERRACE:'TER',ALLEY:'ALY',SAINT:'ST'};
function anorm(a){ const s=String(a||'').toUpperCase().replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); const out=[]; for(const p of s.split(' ')){ if(p==='UNIT'||p==='APT'||p==='STE'||p==='SUITE') break; out.push(_SUF[p]||p); } return out.join(' '); }
function distressOf(l){
  const S=window.LXSIG2||{};
  /* East Baton Rouge: the parish publishes an adjudicated-property list — parcels
     it took for unpaid taxes. That is a hard public record of distress on the
     parcel itself, so it carries full evidence; its absence is not proof of
     health, only that this one list does not name the parcel. */
  if(l.county==='East Baton Rouge'){
    if(l.adj) return {s:88, e:1, v:'on the parish adjudicated list — taken for unpaid taxes', hard:2};
    return {s:18, e:0.55, v:'not on the parish adjudicated list'};
  }
  if(l.county==='Orleans' && (S.fc||S.code)){
    const k=anorm(l.addr);
    const fcv=S.fc&&S.fc[k], cdv=S.code&&S.code[k];
    if(fcv===1) return {s:95, e:1, v:'lien foreclosure — sheriff sale pending', hard:2};
    if(fcv===2) return {s:72, e:1, v:'lien-foreclosure case on record', hard:1};
    if(cdv) return {s:Math.min(78,42+cdv*5), e:0.9, v:'open code-enforcement case (stage '+cdv+')', hard:1};
    return {s:15, e:0.6, v:'no distress record on file'};
  }
  if(S.ev && l.zip && S.ev[l.zip]){
    const a2=S.ev[l.zip]; const rate=(a2[1]+a2[2])/Math.max(1,a2[0]);
    return {s:clamp(20+rate*160+(a2[3]>0?8:0),0,100), e:0.5, v:(a2[1]+a2[2])+' non-payment/late-payment evictions in ZIP, 24 mo'};
  }
  return {s:50, e:0.15, v:'no live distress feed for this county yet'};
}
function analyze(l){
  const X=L(); const d=X.deal(l); if(!d) return null;
  const mk=d.mk; const va=valueAdd(l); const rc=rentControl(l);
  const cityPpsf = cityPpsfOf(l.city);
  const ppsfHigh = d.ppsf && cityPpsf && d.ppsf > cityPpsf*1.3;
  const sus = l.cv ? true : (d.ppsf && cityPpsf) ? d.ppsf < cityPpsf*0.45 : (mk.zhvi ? d.P < mk.zhvi*0.35 : false);
  // ---- Locator X score v2: 11 evidence-weighted modalities with a 15% coverage floor ----
  // Each modality carries a base weight and an evidence factor e (how much real data backs
  // it for THIS record). Effective weight = base x max(0.15, e), renormalized to 100 — the
  // floor keeps every modality alive (coverage), evidence lets the well-documented ones lead.
  const eBasis = l.est? 0.5 : (l.priceDate? (l.priceDate>='2024-01-01'?1: l.priceDate>='2022-01-01'?0.85:0.6) : 0.45);
  const eMkt = (mk.zhvi&&mk.zori)?1:(mk.zhvi||mk.zori)?0.6:0.2;
  const eVa = (['lot','year','units','sqft'].filter(k=>l[k]!=null).length)/4;
  const eRisk = (l.year||!/units|plex|apartment/i.test(l.kind||''))?1:0.5;
  let fcG=null, fcE=0.2;
  try{ if(window.LXScout){ const zf=LXScout.zipFC(l.zip); if(zf&&zf.v){ fcG=zf.v.g12; fcE=Math.max(0.2, Math.min(1, zf.v.r2!=null? zf.v.r2 : 0.5)); } } }catch(e){}
  if(!_zipN){ _zipN={}; X.allListings().forEach(x=>{ if(x.zip) _zipN[x.zip]=(_zipN[x.zip]||0)+1; }); }
  const depth=_zipN[l.zip]||0;
  const ageMo = l.priceDate? Math.max(0,(Date.now()-new Date(l.priceDate).getTime())/2628e6) : null;
  /* The eleven score modalities.  Only the numbers are built for every record:
     the label and the formatted value are display-only, read for the focused
     row and for the cards actually on screen, and building all eleven strings
     for every one of 254,000 rows cost enough heap to kill the renderer when
     an assumption changed.  fw/fe/fs hold the arithmetic; `f`, with the strings,
     is assembled on first read and cached on the row. */
  const dd = distressOf(l);
  const fw = {cf:24, cap:12, dscr:12, yld:8, va:9, gr:9, risk:8, fc:8, bas:5, liq:5, dis:6};
  const fe = {cf:eBasis, cap:eBasis, dscr:eBasis, yld:eMkt, va:Math.max(0.25,eVa),
              gr:(mk.yoy==null?0.2:1), risk:eRisk, fc:fcE, bas:1, liq:(l.zip?1:0.2), dis:dd.e};
  const fs = {
    cf:   lerp(d.cfMo,-3000,1500,0,100),
    cap:  lerp(d.cap,2,8,0,100),
    dscr: lerp(d.dscr||0,0.5,1.35,0,100),
    yld:  lerp(d.gross,3,12,0,100),
    va:   va.score,
    gr:   lerp(mk.yoy==null?0:mk.yoy,-8,8,0,100),
    risk: clamp(100 - (rc.level==='bad'?35:rc.level==='warn'?15:0) - (/condo/i.test(l.kind||'')?20:0) - (ppsfHigh?15:0), 0, 100),
    fc:   fcG==null?50:lerp(fcG,-8,8,0,100),
    bas:  l.est?30: ageMo==null?40: ageMo<=24?100: ageMo<=48?70:45,
    liq:  clamp(Math.log10(Math.max(1,depth))/Math.log10(400)*100,0,100),
    dis:  dd.s
  };
  const FLABEL = {cf:'Cash flow (asset test)', cap:'Cap rate', dscr:'Debt coverage (DSCR)',
    yld:'Gross yield vs 1% rule', va:'Value you can add', gr:'Market momentum (ZIP 1-yr)',
    risk:'Regulatory & price risk', fc:'12-mo forecast (Scout)', bas:'Price-basis quality',
    liq:'Market depth (ZIP inventory here)', dis:'Distress & pre-listing (live records)'};
  function fvalue(k){ switch(k){
    case 'cf':   return (d.cfMo>0?'+':'')+X.fmt$(d.cfMo)+'/mo';
    case 'cap':  return pct(d.cap);
    case 'dscr': return d.dscr? d.dscr.toFixed(2):'\u2014';
    case 'yld':  return pct(d.gross);
    case 'va':   return va.score+'/100';
    case 'gr':   return mk.yoy==null?'\u2014':(mk.yoy>0?'+':'')+mk.yoy.toFixed(1)+'%';
    case 'risk': return rc.level==='bad'?'rent control':rc.level==='warn'?'AB 1482':'low';
    case 'fc':   return fcG==null?'\u2014':(fcG>0?'+':'')+fcG.toFixed(1)+'%';
    case 'bas':  return l.est?'modeled estimate': ageMo==null?'no sale date': ageMo<=24?'recent recorded sale': ageMo<=48?'recorded sale':'older sale';
    case 'liq':  return depth+' sites';
    case 'dis':  return dd.v;
    default:     return '';
  } }
  /* Effective weight = base x max(0.15, evidence), renormalised to 100. */
  { let tot=0; for(const k in fw){ fw[k]=fw[k]*Math.max(0.15, fe[k]==null?1:fe[k]); tot+=fw[k]; }
    for(const k in fw) fw[k]=+(fw[k]/tot*100).toFixed(1); }
  let score=0; for(const k in fw) score+=fw[k]*fs[k]/100;
  score = Math.round(score);
  let cat;
  if(d.cf>0) cat='asset';
  else if((l.units||1)>=2 && (l.units||1)<=4 && d.P<=FHA_4UNIT && d.dscr>=0.6) cat='hack';
  else if(va.score>=40 && d.dscr>=0.55) cat='value';
  else if(mk.yoy!=null && mk.yoy>=2.5 && d.dscr>=0.75) cat='growth';
  else cat='liab';
  const be=breakEvenDown(d,l);
  const a=L().state.assump;
  const rentNeeded = Math.max(0, (d.ds + d.opex)/(1-a.vacancy/100)/(1-a.mgmt/100*(1-a.vacancy/100))/12 - d.rentMo);
  const rentNeededPct = d.rentMo? rentNeeded/d.rentMo*100 : 0;
  // rate at which it breaks even (bisection)
  let rateBE=null; { const loan=d.loan, n=a.term*12; let lo=0.0001, hi=0.15; const pay=r=>{ const m=r/12; return loan*m/(1-Math.pow(1+m,-n))*12; }; if(d.noi>0 && pay(lo)<d.noi){ if(pay(hi)<=d.noi) rateBE=hi; else { for(let i=0;i<40;i++){ const mid=(lo+hi)/2; if(pay(mid)>d.noi) hi=mid; else lo=mid; } rateBE=lo; } } }
  const aduRent = (mk.zori||3000)*0.85;
  function buildLevers(){
  const levers=[];
  if(d.cf<=0){
    if(rentNeeded>0) levers.push(['Rent needed to break even', `$${X.fmtN(d.rentMo+rentNeeded)}/mo (+${pct(rentNeededPct,0)})`]);
    levers.push(['Down payment to break even', be>=99? 'cash purchase' : pct(be,0)]);
    if(rateBE!=null) levers.push(['Rate at which it breaks even', rateBE>=0.15?'any':pct(rateBE*100,2)]);
    if(va.items.some(i=>/ADU/.test(i))) levers.push(['Add an ADU (~$250k) renting at', `$${X.fmtN(aduRent)}/mo → cash flow ${(d.cfMo+aduRent*0.9-1900>0?'+':'')}${X.fmt$(d.cfMo+aduRent*0.9-1900)}/mo`]);
    if(cat==='hack') levers.push(['House-hack (3.5% FHA, live in one unit)', `housing cost ≈ ${X.fmt$(Math.max(0,-(d.noi*(l.units-1)/l.units - (d.P*0.965*(a.rate+0.3)/100/12*12*0.98))/12))}/mo vs renting`]);
    levers.push(['Seller carry at 4.5% instead of the bank', `cash flow ${(()=>{ const m=0.045/12,n=a.term*12; const p=d.loan*m/(1-Math.pow(1+m,-n))*12; const c=(d.noi-p)/12; return (c>0?'+':'')+X.fmt$(c); })()}/mo`]);
  } else {
    levers.push(['Cushion before it turns negative', `rent can fall ${pct(d.cf/d.rent*100,0)} or vacancy rise to ${pct(a.vacancy + d.cf/d.rent*100,0)}`]);
    levers.push(['Cash-on-cash vs. a 4.5% bond', pct(d.coc)+' vs 4.5%']);
    levers.push(['Five-year equity + cash flow', X.fmt$(d.proj[4].equity - d.P*a.down/100 + d.proj.reduce((s,p)=>s+p.cf,0))]);
  }
  return levers;
  }
  /* `levers` and `rec` are only ever read for a focused row, a card actually on
     screen, or a research report — a few dozen at a time out of as many as
     161,000 rows. Building them eagerly cost about a second of every render and
     several hundred megabytes of heap, so they are computed on first read and
     then cached on the row. */
  const out={l,d,score,cat,va,rc,be,rentNeeded,rentNeededPct,rateBE,ppsfHigh,cityPpsf,sus};
  let _lev=null, _rec=null, _f=null;
  Object.defineProperty(out,'f',{enumerable:false, get(){
    if(_f) return _f;
    _f={}; for(const k in fw) _f[k]={w:fw[k], e:fe[k], s:fs[k], label:FLABEL[k], v:fvalue(k)};
    return _f; }});
  Object.defineProperty(out,'levers',{enumerable:false, get(){ return _lev || (_lev=buildLevers()); }});
  Object.defineProperty(out,'rec',{enumerable:false, get(){ return _rec!=null? _rec : (_rec=recommend(l,d,cat,out.f,va,rc,be,rentNeeded)); }});
  return out;
}
function recommend(l,d,cat,f,va,rc,be,rentNeeded){
  const X=L(); const a=X.state.assump; const multi=(l.units||1)>1;
  switch(cat){
    case 'asset': return `Passes the asset test as-is: ${X.fmt$(d.cfMo)} a month after a ${a.down}%-down loan, DSCR ${d.dscr.toFixed(2)}. ${d.dscr>=1.2?'A lender will like it too.':'Thin coverage — one vacancy erases the year, so confirm the rent with three comps before you offer.'}${rc.level==='bad'?' It is rent-controlled: underwrite today\'s rent, not the upside.':''}`;
    case 'hack': return `As an investment it bleeds ${X.fmt$(-d.cfMo)} a month, but as a home it is a different animal: ${l.units} units under the FHA limit means 3.5% down, the other ${l.units-1} unit${l.units>2?'s':''} paying most of the mortgage, and a Prop 13 base locked at today's price. Live in it a year, then it is a rental with a cheap loan.`;
    case 'value': return `Not an asset yet, but ${va.items[0] || 'there is a lever'}. Rent needs to rise about ${pct(rentNeeded/d.rentMo*100,0)} to break even; an ADU or a renovation-and-reset on turnover gets there. Buy only with the project priced in and a contractor's number in hand.`;
    case 'growth': return `The rent covers ${Math.round((d.dscr||0)*100)}% of the loan; you would feed it ${X.fmt$(-d.cfMo)} a month and hope the ZIP's ${pct(d.mk.yoy)} trend continues. Locator X calls that a liability with a story. If you buy it, size the down payment to ${pct(be,0)} so it at least breaks even.`;
    default: return `Rent covers only ${Math.round((d.dscr||0)*100)}% of the loan and the ZIP is ${d.mk.yoy!=null&&d.mk.yoy<0?'falling':'flat'}. Breaking even takes ${be>=99?'an all-cash purchase':pct(be,0)+' down'} or ${pct(rentNeeded/d.rentMo*100,0)} more rent. Pass, or offer a price that makes the numbers work — the seller's price is their problem, the cash flow is yours.`;
  }
}

/* ---------- chart helpers ---------- */
let tip;
function tipShow(e, html){ if(!tip){ tip=document.createElement('div'); tip.className='viztip'; document.body.appendChild(tip); } tip.innerHTML=html; tip.style.display='block'; const x=e.clientX+14, y=e.clientY+14; tip.style.left=Math.min(x, innerWidth-tip.offsetWidth-10)+'px'; tip.style.top=Math.min(y, innerHeight-tip.offsetHeight-10)+'px'; }
function tipHide(){ if(tip) tip.style.display='none'; }
const svgNS='http://www.w3.org/2000/svg';
function el(tag, attrs, parent){ const e=document.createElementNS(svgNS, tag); for(const k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
function shape(g, kind, x, y, r, fill){ const a={fill, stroke:'var(--panel)', 'stroke-width':1.5}; switch(kind){ case 'square': return el('rect',Object.assign({x:x-r,y:y-r,width:2*r,height:2*r,rx:1.5},a),g); case 'diamond': return el('path',Object.assign({d:`M${x} ${y-r*1.3}L${x+r*1.3} ${y}L${x} ${y+r*1.3}L${x-r*1.3} ${y}Z`},a),g); case 'triangle': return el('path',Object.assign({d:`M${x} ${y-r*1.25}L${x+r*1.2} ${y+r}L${x-r*1.2} ${y+r}Z`},a),g); case 'cross': return el('path',{d:`M${x-r} ${y-r}L${x+r} ${y+r}M${x+r} ${y-r}L${x-r} ${y+r}`, stroke:fill,'stroke-width':2.5,'stroke-linecap':'round',fill:'none'},g); default: return el('circle',Object.assign({cx:x,cy:y,r},a),g); } }
function ring(score, cat, size=56, big=false){ const r=size/2-5, c=2*Math.PI*r, off=c*(1-score/100); return `<svg class="${big?'scorebig':'ring'}" viewBox="0 0 ${size} ${size}" aria-label="Score ${score}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(${CAT[cat].c})" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${size/2} ${size/2})"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central">${score}</text></svg>`; }

/* ---------- state ---------- */
let rows=[], catFilter='', zipFilter='', sortBy='score', focusId=null, gridShown=120;
let _rsig=null;
let _zipN=null;
let _sig=null;
function invalidate(){ _rsig=null; }
function compute(){ const X=L(); const sig=JSON.stringify([X.state.assump,X.state.overrides,X.allListings().length,(window.LXView&&window.LXView.active())?window.LXView.state:0]); if(sig===_sig && rows.length) return rows; _sig=sig; _ppsfCache=null; _zipN=null; const VW=(window.LXView&&window.LXView.active())? window.LXView : null; const base=VW? X.allListings().filter(l=>VW.pass(l)) : X.allListings();
  /* This used to read base.map(analyze).filter(Boolean), which on the largest
     edition holds three full 254,000-row arrays at once — the previous
     generation, the mapped one and the filtered one — and that peak was enough
     to kill the renderer when an assumption changed.  Releasing the previous
     generation first and filtering as we go keeps exactly one. */
  rows = [];
  const next = [];
  for(let i=0;i<base.length;i++){ const r=analyze(base[i]); if(r) next.push(r); }
  rows = next; return rows; }

/* ---------- render ---------- */
function render(){
  const X=L(); compute(); const a=X.state.assump;
  // quick assumptions
  $('#quick').innerHTML=`<div class="t">Your assumptions — drive everything</div>
    <label>Down payment % <input type="number" id="q_down" value="${a.down}" step="1"></label>
    <label>Interest rate % <input type="number" id="q_rate" value="${a.rate}" step="0.125"></label>
    <label class="full">Income method <select id="q_rm"><option value="yield" ${a.rentMethod==='yield'?'selected':''}>Long-term: ZIP rent-to-value × price</option><option value="beds" ${a.rentMethod==='beds'?'selected':''}>Long-term: rent × bedrooms</option><option value="rooms" ${a.rentMethod==='rooms'?'selected':''}>Co-living by the room</option><option value="bed" ${a.rentMethod==='bed'?'selected':''}>Student by the bed</option><option value="str" ${a.rentMethod==='str'?'selected':''}>Short-term rental (reg-adjusted)</option><option value="fmr" ${a.rentMethod==='fmr'?'selected':''}>Section 8 (HUD FMR)</option></select></label>
    <label>Vacancy % <input type="number" id="q_vac" value="${a.vacancy}"></label><label>Management % <input type="number" id="q_mgmt" value="${a.mgmt}"></label>`;
  [['q_down','down'],['q_rate','rate'],['q_rm','rentMethod'],['q_vac','vacancy'],['q_mgmt','mgmt']].forEach(([id,k])=>$('#'+id).addEventListener('change', e=>{ X.state.assump[k]= k==='rentMethod'? e.target.value : +e.target.value; X.saveAssump(); X.refresh(); render(); }));
  // tiles
  const clean=rows.filter(r=>!r.sus);
  /* An empty result set is an ordinary state — a filter or a lens that matches
     nothing — and the tiles below index into the top of a sorted list.  When
     there is nothing to rank, say so instead of throwing: this used to take the
     whole dashboard down, and with it the Scout digest that calls into it. */
  if(!rows.length || !clean.length){
    $('#dtiles').innerHTML = '<div class="tile" style="grid-column:1/-1"><div class="v">0</div>'
      + '<div class="l">no properties match the current filters</div>'
      + '<div class="d">Widen the buy box, clear the map filter, or reset the view to see the scored set again.</div></div>';
    const boards=$('#boards'); if(boards) boards.innerHTML='';
    const grid=$('#pgrid'); if(grid) grid.innerHTML='';
    const les=$('#lessons'); if(les) les.innerHTML='';
    _rsig=null;
    return;
  }
  const assets=clean.filter(r=>r.cat==='asset'), hacks=clean.filter(r=>r.cat==='hack'); const bestCf=clean.slice().sort((p,q)=>q.d.cfMo-p.d.cfMo)[0]; const bestScore=clean.slice().sort((p,q)=>q.score-p.score)[0];
  $('#dtiles').innerHTML=`<div class="tile"><div class="v" style="color:var(--cat1)">${X.fmtN(assets.length)} <span style="font-size:14px;color:var(--muted)">/ ${X.fmtN(rows.length)}</span></div><div class="l">cash-flow assets at your numbers</div><div class="d">${assets.length? 'Median cap '+pct(X.median(assets.map(r=>r.d.cap))) : 'None — try the levers below or a bigger down payment'}</div></div>
    <div class="tile"><div class="v">${X.median(rows.map(r=>r.score))}</div><div class="l">median Locator X score (0–100)</div><div class="d">top: ${bestScore.score} · ${X.esc(bestScore.l.addr)}, ${X.esc(bestScore.l.city)}</div></div>
    <div class="tile"><div class="v" style="color:${bestCf.d.cfMo>0?'var(--good)':'var(--bad)'}">${(bestCf.d.cfMo>0?'+':'')+X.fmt$(bestCf.d.cfMo)}<span style="font-size:14px;color:var(--muted)">/mo</span></div><div class="l">best cash flow on the map</div><div class="d">${X.esc(bestCf.l.addr)}, ${X.esc(bestCf.l.city)} · cap ${pct(bestCf.d.cap)}</div></div>
    <div class="tile"><div class="v" style="color:var(--cat2)">${X.fmtN(rows.filter(r=>(r.l.units||1)>=2&&(r.l.units||1)<=4&&r.d.P<=FHA_4UNIT).length)}</div><div class="l">house-hack candidates (2–4 units under the FHA limit)</div><div class="d">median price ${X.fmt$(X.median(rows.filter(r=>(r.l.units||1)>1).map(r=>r.d.P)))}</div></div>`;
  /* The heavy half of a render — boards, charts, grid, lesson picks — depends
     only on the computed rows, the focus and the filters. Switching tabs used
     to rebuild all of it for as many as 161,000 rows every time. */
  const rsig=JSON.stringify([_sig, focusId, catFilter, zipFilter, sortBy, gridShown]);
  if(rsig===_rsig) return;
  _rsig=rsig;
  renderBoards(); renderFocus(); renderCharts(); renderGrid(); renderLessons(); if(window.LXVis) LXVis.render(rows);
}
function boardRow(r, metric){ const X=L(); return `<div class="row" data-id="${r.l.id}"><b>${X.esc(r.l.addr)}</b><span class="m">${metric}</span><span class="s">${X.esc(r.l.city)} · ${X.esc(r.l.kind)} · ${X.fmt$(r.d.P)} · score ${r.score}</span></div>`; }
function renderBoards(){
  const X=L(); const by=(f,n=5)=>rows.filter(r=>!r.sus).filter(f.filter).sort(f.sort).slice(0,n);
  const boards=[
    {cat:'asset', title:'Cash-flow assets', why:'Highest cash flow after the mortgage — the first list a cash-flow investor reads.', filter:r=>r.d.cf>0, sort:(p,q)=>q.d.cfMo-p.d.cfMo, m:r=>'+'+X.fmt$(r.d.cfMo)+'/mo'},
    {cat:'hack', title:'House-hack candidates', why:'2–4 units under the FHA 4-unit limit, ranked by how much of the mortgage the other units pay.', filter:r=>(r.l.units||1)>=2&&(r.l.units||1)<=4&&r.d.P<=FHA_4UNIT, sort:(p,q)=>(q.d.dscr||0)-(p.d.dscr||0), m:r=>'DSCR '+(r.d.dscr||0).toFixed(2)},
    {cat:'value', title:'Value-add and ADU plays', why:'Big lots, old stock, extra units — where work turns a liability into an asset.', filter:r=>r.va.score>=40, sort:(p,q)=>(q.va.score*2+q.score)-(p.va.score*2+p.score), m:r=>'lever '+r.va.score+'/100'},
    {cat:'growth', title:'Strongest markets', why:'Highest one-year ZIP value change with a cap rate above 3% — appreciation with a floor.', filter:r=>r.d.mk.yoy!=null&&r.d.cap>=3, sort:(p,q)=>q.d.mk.yoy-p.d.mk.yoy, m:r=>(r.d.mk.yoy>0?'+':'')+r.d.mk.yoy.toFixed(1)+'%/yr'},
    {cat:'asset', title:'Highest cap rate', why:'Unlevered return — compare buildings before you compare loans.', filter:r=>true, sort:(p,q)=>q.d.cap-p.d.cap, m:r=>pct(r.d.cap)+' cap'},
    {cat:'liab', title:'Closest to breaking even', why:'Negative today but the smallest gap — the ones a better price or a seller carry would flip.', filter:r=>r.d.cf<=0, sort:(p,q)=>q.d.cfMo-p.d.cfMo, m:r=>X.fmt$(r.d.cfMo)+'/mo'}
  ];
  $('#boards').innerHTML=boards.map(b=>{ const list=by(b); return `<div class="board" style="--c:var(${CAT[b.cat].c})"><h3>${b.title}</h3><p>${b.why}</p>${list.length? list.map(r=>boardRow(r,b.m(r))).join('') : '<div class="empty">Nothing qualifies at these assumptions.</div>'}</div>`; }).join('');
  $$('#boards .row').forEach(r=>r.addEventListener('click', ()=>focusOn(r.dataset.id)));
}
function focusOn(id){ focusId=id; renderFocus(); renderGrid(); const f=$('#focus'); if(f) f.scrollIntoView({behavior:'smooth', block:'start'}); }
function renderFocus(){
  const X=L(); const r=rows.find(x=>x.l.id===focusId); const box=$('#focus'); if(!r){ box.innerHTML=''; return; }
  const d=r.d, a=X.state.assump, c=CAT[r.cat];
  // waterfall
  const steps=[['Gross rent',d.rent,'in'],['Vacancy',-d.vac],['Property tax',-d.tax],['Insurance',-d.ins],['Upkeep + CapEx',-(d.maint+d.capex)],['Management',-d.mgmt]]; if(d.hoa) steps.push(['HOA',-d.hoa]); steps.push(['NOI',d.noi,'sub']); steps.push(['Debt service',-d.ds]); steps.push(['Cash flow',d.cf,'total']);
  const W=460,H=230,pl=8,pt=10,pb=54; const maxV=Math.max(d.rent, Math.abs(d.cf))*1.05, minV=Math.min(0,d.cf)*1.1; const y=v=>pt+(maxV-v)/(maxV-minV)*(H-pt-pb); const bw=(W-2*pl)/steps.length;
  let run=0, wf=''; steps.forEach((s,i)=>{ const [name,v,kind]=s; let y0,y1,col; if(kind==='in'||kind==='sub'||kind==='total'){ y0=y(Math.max(0,v)); y1=y(Math.min(0,v)); run=v; col = kind==='total'? (v>0?'var(--good)':'var(--bad)') : (kind==='in'?'var(--cat2)':'var(--bay)'); } else { const from=run, to=run+v; y0=y(Math.max(from,to)); y1=y(Math.min(from,to)); run=to; col='var(--cat5)'; } const x=pl+i*bw+3; wf+=`<rect x="${x}" y="${y0}" width="${bw-6}" height="${Math.max(2,y1-y0)}" rx="3" fill="${col}"><title>${name}: ${X.fmtFull(v)}</title></rect><text x="${x+(bw-6)/2}" y="${H-pb+14}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${name.split(' ')[0]}</text><text x="${x+(bw-6)/2}" y="${H-pb+26}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${name.split(' ').slice(1).join(' ')}</text><text x="${x+(bw-6)/2}" y="${y0-4}" text-anchor="middle" font-size="9.5" font-family="var(--mono)" fill="var(--ink2)">${X.fmt$(Math.abs(v))}</text>`; });
  wf=`<svg viewBox="0 0 ${W} ${H}"><line x1="${pl}" x2="${W-pl}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line2)"/>${wf}</svg>`;
  // projection
  const P=d.proj; const W2=460,H2=200,pl2=44,pb2=26; const maxE=Math.max(...P.map(p=>p.equity)); const minC=Math.min(0,...P.map(p=>p.cf)); const y2=v=>10+(maxE-v)/(maxE-minC)*(H2-10-pb2); const bw2=(W2-pl2-10)/5;
  let pr=''; P.forEach((p,i)=>{ const x=pl2+i*bw2+8; pr+=`<rect x="${x}" y="${y2(p.equity)}" width="${bw2*0.4}" height="${y2(0)-y2(p.equity)}" rx="3" fill="var(--cat2)"><title>Year ${p.y} equity ${X.fmtFull(p.equity)}</title></rect><rect x="${x+bw2*0.45}" y="${Math.min(y2(0),y2(p.cf))}" width="${bw2*0.4}" height="${Math.abs(y2(0)-y2(p.cf))}" rx="3" fill="${p.cf>0?'var(--cat1)':'var(--cat5)'}"><title>Year ${p.y} cash flow ${X.fmtFull(p.cf)}</title></rect><text x="${x+bw2*0.42}" y="${H2-8}" text-anchor="middle" font-size="10" fill="var(--muted)">Yr ${p.y}</text>`; });
  [0,0.5,1].forEach(t=>{ const v=minC+(maxE-minC)*t; pr+=`<text x="${pl2-4}" y="${y2(v)+3}" text-anchor="end" font-size="9.5" font-family="var(--mono)" fill="var(--muted)">${X.fmt$(v)}</text><line x1="${pl2}" x2="${W2-6}" y1="${y2(v)}" y2="${y2(v)}" stroke="var(--line)"/>`; });
  pr=`<svg viewBox="0 0 ${W2} ${H2}">${pr}</svg><div class="legend2"><span><i style="--c:var(--cat2)"></i>Equity (value − loan)</span><span><i style="--c:var(--cat1)"></i>Annual cash flow</span></div>`;
  // donut of expenses
  const parts=[['Debt service',d.ds,'var(--cat4)'],['Property tax',d.tax,'var(--cat3)'],['Insurance',d.ins,'var(--cat2)'],['Upkeep',d.maint+d.capex,'var(--cat1)'],['Management',d.mgmt,'var(--cat5)'],['HOA',d.hoa,'var(--muted)']].filter(p=>p[1]>0); const tot=parts.reduce((s,p)=>s+p[1],0); let ang=-Math.PI/2, dn=''; parts.forEach(p=>{ const a2=ang+p[1]/tot*2*Math.PI; const x1=80+62*Math.cos(ang), y1=80+62*Math.sin(ang), x2=80+62*Math.cos(a2), y2v=80+62*Math.sin(a2); dn+=`<path d="M${x1} ${y1}A62 62 0 ${a2-ang>Math.PI?1:0} 1 ${x2} ${y2v}" fill="none" stroke="${p[2]}" stroke-width="22"><title>${p[0]}: ${X.fmtFull(p[1])} (${pct(p[1]/tot*100,0)})</title></path>`; ang=a2; });
  const dnHtml=`<div style="display:flex;gap:12px;align-items:center"><svg viewBox="0 0 160 160" style="width:150px;flex:none">${dn}<text x="80" y="76" text-anchor="middle" font-size="11" fill="var(--muted)">out per year</text><text x="80" y="94" text-anchor="middle" font-size="14" font-family="var(--mono)" fill="var(--ink)">${X.fmt$(tot)}</text></svg><div class="legend2" style="flex-direction:column;align-items:flex-start;gap:4px">${parts.map(p=>`<span><i style="--c:${p[2]}"></i>${p[0]} <b style="font-family:var(--mono);font-weight:500;margin-left:4px">${pct(p[1]/tot*100,0)}</b></span>`).join('')}</div></div>`;
  box.innerHTML=`<div class="focus" style="--c:var(${c.c})"><div class="fh">${ring(r.score,r.cat,84,true)}<div style="flex:1;min-width:240px"><div class="eyebrow">${X.esc(r.l.city)} · ${X.esc(r.l.nb||r.l.anb||r.l.zip)} · ${X.esc(r.l.kind)}</div><h3>${X.esc(r.l.addr)}</h3><div style="font-size:13px;color:var(--muted)">${X.fmt$(d.P)} · ${r.l.beds!=null?r.l.beds+' bd '+r.l.baths+' ba · ':''}${r.l.sqft? X.fmtN(r.l.sqft)+' sf · ':''}${r.l.year? 'built '+r.l.year+' · ':''}rent est. $${X.fmtN(d.rentMo)}/mo</div>${r.sus?`<div style="margin-top:8px"><span class="badge warn">Recorded price far below market — likely a partial-interest or family transfer, not a listing. Verify before relying on it.</span></div>`:""}<div class="verdict ${r.cat==='asset'?'good':r.cat==='liab'?'bad':'warn'}"><div><b>${c.name}</b><p>${r.rec}</p></div></div></div><div style="display:flex;flex-direction:column;gap:6px"><button class="btn primary" data-act="map">Open on map</button><button class="btn" data-act="research">Research this property</button><button class="btn" data-act="uw">Underwrite</button><button class="btn" data-act="tour">Tour inside · 360°</button><button class="btn" data-act="close">Close</button></div></div>
  <div class="fgrid">
    <div class="sub"><h4>Score breakdown</h4>${Object.values(r.f).map(x=>`<div class="factor" style="--c:var(${c.c})"><span>${x.label}<br><span style="color:var(--muted)">${x.v} · weight ${x.w}</span></span><div class="bar"><i style="width:${x.s.toFixed(0)}%"></i></div><b>${Math.round(x.s)}</b></div>`).join('')}</div>
    <div class="sub"><h4>Where the rent goes (annual)</h4>${wf}</div>
    <div class="sub"><h4>Levers — what would change the answer</h4><ul class="levers">${r.levers.map(x=>`<li><span>${x[0]}</span><span>${x[1]}</span></li>`).join('')}</ul>${r.va.items.length?`<h4 style="margin-top:10px">Value-add signals</h4><ul class="levers">${r.va.items.map(i=>`<li><span>${i}</span></li>`).join('')}</ul>`:''}<h4 style="margin-top:10px">Regulation</h4><div style="font-size:13px" class="${r.rc.level==='bad'?'neg':''}">${r.rc.reg}</div></div>
    <div class="sub"><h4>Five years at ${d.appr.toFixed(1)}% appreciation, ${a.rentGrowth}% rent growth</h4>${pr}</div>
    <div class="sub"><h4>Where the money goes out</h4>${dnHtml}</div>
    <div class="sub"><h4>The lesson this property teaches</h4><p style="font-size:13px;margin:0;line-height:1.5">${lessonFor(r)}</p></div>
  </div></div>`;
  $$('#focus [data-act]').forEach(b=>b.addEventListener('click', ()=>{ const act=b.dataset.act; if(act==='map') X.select(r.l.id, true); if(act==='research'){ window.LXResearch.subjectFrom(r.l); X.showView('research'); } if(act==='uw'){ X.showView('uw'); window.LXUW.openSheet(r.l.id); } if(act==='tour') X.openTour(r.l); if(act==='close'){ focusId=null; renderFocus(); renderGrid(); } }));
}
function lessonFor(r){ const X=L(); const d=r.d;
  if(r.cat==='asset') return `<b>Principle 1 — buy what pays you.</b> ${X.esc(r.l.addr)} puts ${X.fmt$(d.cfMo)} a month in the income column after every expense and the loan. Notice what makes it work: gross yield of ${pct(d.gross)} against a ${X.state.assump.rate}% loan. Everything else on this page is a variation on getting that gap wide enough.`;
  if(r.cat==='hack') return `<b>Principle 2 — build the asset column beside the paycheck.</b> Keep the day job and let it finance the ownership column. An owner-occupied 2–4 unit loan is the cheapest money an employee will ever borrow; the other units become your first business while your salary qualifies for the loan.`;
  if(r.cat==='value') return `<b>Principle 5 — value is invented, not found.</b> The listing price is what it is; the value is what you can make it. ${r.va.items[0]? r.va.items[0].charAt(0).toUpperCase()+r.va.items[0].slice(1)+'.' : 'The lever here is time and work.'} Financial intelligence is seeing the ${X.fmt$(r.rentNeeded)} a month that isn't there yet.`;
  if(r.cat==='growth') return `<b>Principle 3 — know an asset from a liability.</b> A house that costs you ${X.fmt$(-d.cfMo)} a month is a liability, even in a ZIP up ${pct(d.mk.yoy)} this year. Appreciation is the reward for owning an asset, not a substitute for one.`;
  return `<b>Principle 4 — the tax architecture decides the price:</b> the seller's Prop 13 base is a fraction of what yours will be at ${X.fmt$(d.P)}; at ${X.fmt$(d.tax)} a year in tax alone the numbers don't close. The only price that matters is the one where they do — offer that, or walk. There is always another deal.`;
}
function renderCharts(){
  const X=L();
  // matrix scatter
  { const box=$('#c_matrix'); box.innerHTML=''; const W=560,H=320,pl=54,pr=14,pt=14,pb=40; const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,style:'width:100%;height:auto;display:block'},box);
    const xs=rows.map(r=>r.d.cfMo), ys=rows.map(r=>r.d.mk.yoy==null?0:r.d.mk.yoy); let _xlo=-4000,_xhi=1500,_ylo=-6,_yhi=6; for(const v of xs){ if(v<_xlo)_xlo=v; if(v>_xhi)_xhi=v; } for(const v of ys){ if(v<_ylo)_ylo=v; if(v>_yhi)_yhi=v; } const xmin=Math.max(-8000,_xlo), xmax=Math.min(4000,_xhi), ymin=Math.max(-12,_ylo), ymax=Math.min(15,_yhi); const cx=v=>clamp(v,xmin,xmax), cy=v=>clamp(v,ymin,ymax);
    const X_=v=>pl+(v-xmin)/(xmax-xmin)*(W-pl-pr), Y_=v=>pt+(ymax-v)/(ymax-ymin)*(H-pt-pb);
    el('rect',{x:X_(0),y:pt,width:W-pr-X_(0),height:Y_(0)-pt,fill:'var(--good-soft)',opacity:.6},svg); el('rect',{x:pl,y:Y_(0),width:X_(0)-pl,height:H-pb-Y_(0),fill:'var(--bad-soft)',opacity:.5},svg);
    [[X_(0)+6,pt+14,'Asset & growing','start'],[pl+6,pt+14,'Liability, rising market','start'],[X_(0)+6,H-pb-6,'Asset, falling market','start'],[pl+6,H-pb-6,'Liability, falling market','start']].forEach(t=>el('text',{x:t[0],y:t[1],'font-size':10,fill:'var(--muted)','text-anchor':t[3]},svg).textContent=t[2]);
    el('line',{x1:pl,x2:W-pr,y1:Y_(0),y2:Y_(0),stroke:'var(--line2)'},svg); el('line',{x1:X_(0),x2:X_(0),y1:pt,y2:H-pb,stroke:'var(--line2)'},svg);
    [xmin,xmin/2,0,xmax].forEach(v=>el('text',{x:X_(v),y:H-pb+16,'font-size':10,'text-anchor':v===xmin?'start':v===xmax?'end':'middle',fill:'var(--muted)','font-family':'var(--mono)'},svg).textContent=(v===xmin?'≤ ':'')+X.fmt$(v)+'/mo');
    el('text',{x:(pl+W-pr)/2,y:H-6,'font-size':11,'text-anchor':'middle',fill:'var(--ink2)'},svg).textContent='Monthly cash flow after the mortgage →';
    [ymin,0,ymax].forEach(v=>el('text',{x:pl-6,y:Y_(v)+3,'font-size':10,'text-anchor':'end',fill:'var(--muted)','font-family':'var(--mono)'},svg).textContent=(v>0?'+':'')+v.toFixed(0)+'%');
    el('text',{x:12,y:(pt+H-pb)/2,'font-size':11,'text-anchor':'middle',fill:'var(--ink2)',transform:`rotate(-90 12 ${(pt+H-pb)/2})`},svg).textContent='ZIP value, 1-yr change →';
    const plotRows = rows.length>1400 ? rows.filter((r,i)=> r.cat!=='liab' || i%Math.ceil(rows.length/900)===0) : rows;
    plotRows.forEach(r=>{ const g=el('g',{style:'cursor:pointer'},svg); const s=shape(g, CAT[r.cat].shape, X_(cx(r.d.cfMo)), Y_(cy(r.d.mk.yoy==null?0:r.d.mk.yoy)), 3.2+Math.min(3.4,(r.l.units||1)*0.8), `var(${CAT[r.cat].c})`); s.setAttribute('opacity', plotRows.length>600?'0.62':'0.85'); if(r.d.cfMo<xmin||r.d.cfMo>xmax) s.setAttribute('opacity','0.55'); g.addEventListener('mousemove', e=>tipShow(e, `<b>${X.esc(r.l.addr)}</b>, ${X.esc(r.l.city)}<br>${CAT[r.cat].name} · score <b>${r.score}</b><br>cash flow <b>${X.fmt$(r.d.cfMo)}/mo</b> · ZIP <b>${r.d.mk.yoy==null?'—':(r.d.mk.yoy>0?'+':'')+r.d.mk.yoy.toFixed(1)+'%'}</b>`)); g.addEventListener('mouseleave', tipHide); g.addEventListener('click', ()=>{ tipHide(); focusOn(r.l.id); }); });
    box.insertAdjacentHTML('beforeend', `<div class="legend2">${CATS.map(c=>`<span>${window.LXPal?LXPal.swatch(LXPal.cat(c.id), c.shape, 12):`<i style="--c:var(${c.c})"></i>`}${c.name}</span>`).join('')}<span style="color:var(--muted)">· shape and colour both carry the category · point size = units${rows.length>1400?' · liability points sampled for legibility':''}</span></div>`);
  }
  // break-even down payment histogram
  { const box=$('#c_breakeven'); box.innerHTML=''; const bins=[[0,10],[10,20],[20,30],[30,40],[40,50],[50,60],[60,70],[70,80],[80,90],[90,101]]; const counts=bins.map(b=>rows.filter(r=>r.be>=b[0]&&r.be<b[1])); const W=560,H=300,pl=36,pr=14,pt=16,pb=44; const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,style:'width:100%;height:auto;display:block'},box); const max=Math.max(1,...counts.map(c=>c.length)); const bw=(W-pl-pr)/bins.length; const a=X.state.assump;
    counts.forEach((c,i)=>{ const h=c.length/max*(H-pt-pb); const x=pl+i*bw+3; /* ordinal, not identity: within reach -> reachable -> price problem, so this
         uses the reserved status scale rather than categorical slots */
      const col = bins[i][0]<a.down? 'var(--good)' : bins[i][0]<50? 'var(--warn)':'var(--bad)'; const rect=el('rect',{x,y:H-pb-h,width:bw-6,height:Math.max(h,c.length?2:0),rx:4,fill:col},svg); el('text',{x:x+(bw-6)/2,y:H-pb+14,'font-size':10,'text-anchor':'middle',fill:'var(--muted)','font-family':'var(--mono)'},svg).textContent=bins[i][0]+'%'; if(c.length) el('text',{x:x+(bw-6)/2,y:H-pb-h-4,'font-size':10,'text-anchor':'middle',fill:'var(--ink2)','font-family':'var(--mono)'},svg).textContent=c.length; rect.addEventListener('mousemove', e=>tipShow(e, `<b>${c.length}</b> propert${c.length===1?'y':'ies'} break even at ${bins[i][0]}–${Math.min(100,bins[i][1])}% down<br>${c.slice(0,3).map(r=>X.esc(r.l.addr)).join(', ')}${c.length>3?'…':''}`)); rect.addEventListener('mouseleave', tipHide); rect.style.cursor='pointer'; rect.setAttribute('tabindex','0'); rect.setAttribute('role','button'); const openBE=()=>{ tipHide(); window.LXPal&&LXPal.drill(`Break even at ${bins[i][0]}\u2013${Math.min(100,bins[i][1])}% down`, c.map(r=>r.l), {eyebrow:'Break-even down payment', note:`These are the records in that bar. At ${a.rate}% on a ${a.term}-year loan they reach zero cash flow somewhere in that down-payment band.`}); }; rect.addEventListener('click', openBE); rect.addEventListener('keydown', e2=>{ if(e2.key==='Enter'||e2.key===' '){ e2.preventDefault(); openBE(); } }); });
    el('text',{x:(pl+W-pr)/2,y:H-8,'font-size':11,'text-anchor':'middle',fill:'var(--ink2)'},svg).textContent=`Down payment needed for cash flow ≥ 0 at ${a.rate}% (your down payment: ${a.down}%)`;
    const xline=pl+(a.down/10)*bw; el('line',{x1:xline,x2:xline,y1:pt,y2:H-pb,stroke:'var(--accent)','stroke-dasharray':'4 3','stroke-width':1.5},svg); el('text',{x:xline+4,y:pt+10,'font-size':10,fill:'var(--accent-ink)'},svg).textContent='you';
    box.insertAdjacentHTML('beforeend', `<div class="legend2"><span><i style="--c:var(--good)"></i>Within your down payment</span><span><i style="--c:var(--warn)"></i>Reachable with more equity</span><span><i style="--c:var(--bad)"></i>Needs 50%+ — price problem</span><span style="color:var(--muted)">· click any bar to list the records in it</span></div>`);
  }
  // yield by city bars
  { const box=$('#c_yield'); box.innerHTML=''; const byCity={}; rows.forEach(r=>{ (byCity[r.l.city]=byCity[r.l.city]||[]).push(r); }); const list=Object.entries(byCity).map(([c,v])=>({c, y:X.median(v.map(r=>r.d.gross)), n:v.length, rows:v})).sort((a,b)=>b.y-a.y); const med=X.median(rows.map(r=>r.d.gross)); const W=560, rowH=18, pl=110, pr=50, H=list.length*rowH+30; const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,style:'width:100%;height:auto;display:block'},box); const max=Math.max(...list.map(x=>x.y))*1.1; const xs=v=>pl+v/max*(W-pl-pr);
    list.forEach((x,i)=>{ const y=8+i*rowH; const t=x.y/max; const col = window.LXPal? LXPal.seq(t) : `color-mix(in srgb, var(--seq2) ${Math.round(35+65*t)}%, var(--seq1))`; const rect=el('rect',{x:pl,y,width:xs(x.y)-pl,height:rowH-5,rx:3,fill:col},svg); el('text',{x:pl-6,y:y+rowH-8,'font-size':11,'text-anchor':'end',fill:'var(--ink)'},svg).textContent=x.c; el('text',{x:xs(x.y)+5,y:y+rowH-8,'font-size':11,fill:'var(--ink2)','font-family':'var(--mono)'},svg).textContent=pct(x.y); rect.addEventListener('mousemove', e=>tipShow(e, `<b>${x.c}</b> median gross yield <b>${pct(x.y)}</b> across ${x.n} propert${x.n===1?'y':'ies'}`)); rect.addEventListener('mouseleave', tipHide); rect.style.cursor='pointer'; rect.setAttribute('tabindex','0'); rect.setAttribute('role','button'); const openCity=()=>{ tipHide(); window.LXPal&&LXPal.drill(x.c, x.rows.map(r=>r.l), {eyebrow:'Median gross yield by city', note:`Median gross yield here is ${pct(x.y)}. Gross yield is annual rent over price before any expense \u2014 useful for ranking cities, never for underwriting a building.`}); }; rect.addEventListener('click', openCity); rect.addEventListener('keydown', e2=>{ if(e2.key==='Enter'||e2.key===' '){ e2.preventDefault(); openCity(); } }); });
    el('line',{x1:xs(med),x2:xs(med),y1:4,y2:H-16,stroke:'var(--accent)','stroke-dasharray':'4 3'},svg); el('text',{x:xs(med)+4,y:H-6,'font-size':10,fill:'var(--accent-ink)'},svg).textContent='Bay median '+pct(med);
  }
  // score histogram
  { const box=$('#c_hist'); box.innerHTML=''; const bins=[0,20,30,40,50,60,70,80,101]; const W=560,H=200,pl=30,pr=14,pt=14,pb=34; const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,style:'width:100%;height:auto;display:block'},box); const groups=[]; for(let i=0;i<bins.length-1;i++) groups.push({lo:bins[i],hi:bins[i+1],items:rows.filter(r=>r.score>=bins[i]&&r.score<bins[i+1])}); const max=Math.max(1,...groups.map(g=>g.items.length)); const bw=(W-pl-pr)/groups.length;
    groups.forEach((g,i)=>{ const x=pl+i*bw+3; const stacks={}; g.items.forEach(r=>stacks[r.cat]=(stacks[r.cat]||0)+1); let yv=H-pb; CATS.forEach(c=>{ const n=stacks[c.id]||0; if(!n) return; const h=n/max*(H-pt-pb); const rect=el('rect',{x,y:yv-h,width:bw-6,height:Math.max(1,h-2),rx:2,fill:`var(${c.c})`},svg); rect.addEventListener('mousemove', e=>tipShow(e, `Score ${g.lo}\u2013${Math.min(100,g.hi-1)} \u00b7 <b>${n}</b> ${c.name.toLowerCase()}<br><span style="color:var(--muted)">click to list them</span>`)); rect.addEventListener('mouseleave', tipHide); rect.style.cursor='pointer'; rect.setAttribute('tabindex','0'); rect.setAttribute('role','button'); const openSeg=()=>{ tipHide(); window.LXPal&&LXPal.drill(`${c.name} \u00b7 score ${g.lo}\u2013${Math.min(100,g.hi-1)}`, g.items.filter(r=>r.cat===c.id).map(r=>r.l), {eyebrow:'Score distribution', note:c.blurb}); }; rect.addEventListener('click', openSeg); rect.addEventListener('keydown', e2=>{ if(e2.key==='Enter'||e2.key===' '){ e2.preventDefault(); openSeg(); } }); yv-=h; }); el('text',{x:x+(bw-6)/2,y:H-pb+14,'font-size':10,'text-anchor':'middle',fill:'var(--muted)','font-family':'var(--mono)'},svg).textContent=g.lo+'–'+Math.min(100,g.hi-1); if(g.items.length) el('text',{x:x+(bw-6)/2,y:yv-4,'font-size':10,'text-anchor':'middle',fill:'var(--ink2)','font-family':'var(--mono)'},svg).textContent=g.items.length; });
    el('text',{x:(pl+W-pr)/2,y:H-6,'font-size':11,'text-anchor':'middle',fill:'var(--ink2)'},svg).textContent='Locator X score · stacked by category';
    box.insertAdjacentHTML('beforeend', `<div class="legend2">${CATS.map(c=>{ const n=rows.filter(r=>r.cat===c.id).length; return n? `<span>${window.LXPal?LXPal.swatch(LXPal.cat(c.id),'circle',11):''}${c.name} <b class="num">${n.toLocaleString()}</b></span>`:''; }).join('')}<span style="color:var(--muted)">· click any segment to list the records in it</span></div>`);
  }
}
function renderGrid(){
  const X=L(); const chips=$('#dcat'); chips.innerHTML=`<button class="chip" data-c="" aria-pressed="${catFilter===''}">All ${X.fmtN(rows.length)}</button>`+CATS.map(c=>`<button class="chip" data-c="${c.id}" aria-pressed="${catFilter===c.id}" style="${catFilter===c.id?`background:var(${c.c});border-color:var(${c.c});color:#fff`:''}">${c.name} ${X.fmtN(rows.filter(r=>r.cat===c.id).length)}</button>`).join('');
  $$('#dcat .chip').forEach(b=>b.addEventListener('click', ()=>{ catFilter=b.dataset.c; renderGrid(); }));
  $('#dsortsel').value=sortBy; $('#dsortsel').onchange=e=>{ sortBy=e.target.value; renderGrid(); };
  if(zipFilter){ const zc=document.createElement('button'); zc.className='chip'; zc.style.cssText='background:var(--accent);border-color:var(--accent);color:#fff'; zc.textContent='ZIP '+zipFilter+' ✕'; zc.addEventListener('click',()=>{ zipFilter=''; renderGrid(); }); chips.appendChild(zc); }
  let list=rows.filter(r=>!catFilter||r.cat===catFilter).filter(r=>!zipFilter||r.l.zip===zipFilter); list.sort((p,q)=>{ switch(sortBy){ case 'cf': return q.d.cfMo-p.d.cfMo; case 'cap': return q.d.cap-p.d.cap; case 'price': return p.d.P-q.d.P; case 'yoy': return (q.d.mk.yoy||0)-(p.d.mk.yoy||0); case 'bmkt': { const A=(()=>{try{const x=window.LXBM&&LXBM.assess(p.l);return x?x.idx:-1;}catch(e){return -1;}})(), B=(()=>{try{const x=window.LXBM&&LXBM.assess(q.l);return x?x.idx:-1;}catch(e){return -1;}})(); return B-A; } } return q.score-p.score; });
  const totalN=list.length; list=list.slice(0, gridShown);
  $('#pgrid').innerHTML=list.map(r=>{ const c=CAT[r.cat]; const d=r.d; return `<div class="pcard ${focusId===r.l.id?'sel':''}" data-id="${r.l.id}" style="--c:var(${c.c})">${ring(r.score,r.cat)}<div class="a">${X.esc(r.l.addr)}</div><div class="b">${X.esc(r.l.city)} · ${X.esc(r.l.kind)} · ${X.fmt$(d.P)}${r.l.src==='imp'?' · imported':''}${r.sus?' · ⚠ below-market transfer':''}</div>${(()=>{ let bm=null; try{ bm=window.LXBM&&LXBM.assess(r.l); }catch(e){} if(!bm||bm.idx<20) return '';
      const col=bm.idx>=45?'var(--good)':bm.idx>=25?'var(--warn)':'var(--muted)';
      return `<div class="bmbadge" title="${bm.hard?'Backed by a recorded sale or price-per-square-foot comps':'Assessed-basis signal only — tenure, not a purchase discount'}" style="font-size:11px;margin:3px 0 1px;color:${col};font-weight:600">◈ below-market index ${bm.idx}${bm.hard?' · sale/comps backed':' · basis only'}</div>`; })()}<div class="cat"><i></i>${c.name}</div><div class="bars"><div>Cash flow<b class="${d.cfMo>0?'pos':'neg'}">${(d.cfMo>0?'+':'')+X.fmt$(d.cfMo)}</b><div class="bar"><i style="width:${r.f.cf.s.toFixed(0)}%"></i></div></div><div>Cap rate<b>${pct(d.cap)}</b><div class="bar"><i style="width:${r.f.cap.s.toFixed(0)}%"></i></div></div><div>DSCR<b>${d.dscr?d.dscr.toFixed(2):'—'}</b><div class="bar"><i style="width:${r.f.dscr.s.toFixed(0)}%"></i></div></div></div><div class="rec">${r.rec.split('. ')[0]}.</div><div class="acts"><button class="btn" data-act="focus">Analyze</button><button class="btn" data-act="map">Map</button><button class="btn" data-act="research">Research</button><button class="btn" data-act="uw">Underwrite</button></div></div>`; }).join('');
  if(totalN>gridShown){ const b=document.createElement('button'); b.className='btn'; b.style.cssText='margin:12px auto;display:block'; b.textContent=`Show more (${totalN-gridShown} of ${totalN} remaining)`; b.addEventListener('click', ()=>{ gridShown+=120; renderGrid(); }); $('#pgrid').appendChild(b); }
  $$('#pgrid .pcard').forEach(card=>{ const id=card.dataset.id; card.addEventListener('click', e=>{ const act=e.target.dataset.act; if(act==='map'){ X.select(id,true); return; } if(act==='research'){ const l=X.allListings().find(x=>x.id===id); window.LXResearch.subjectFrom(l); X.showView('research'); return; } if(act==='uw'){ X.showView('uw'); window.LXUW.openSheet(id); return; } focusOn(id); }); });
}
function renderLessons(){
  const X=L(); const a=X.state.assump; const rowsC=rows.filter(r=>!r.sus); const n=rowsC.length; const assets=rowsC.filter(r=>r.cat==='asset'); const oneP=rowsC.filter(r=>r.d.one>=1).length; const hacks=rowsC.filter(r=>(r.l.units||1)>1);
  const hackBest=hacks.slice().sort((p,q)=>(q.d.dscr||0)-(p.d.dscr||0))[0]; const va=rowsC.filter(r=>r.va.score>=40); const rcCount=rowsC.filter(r=>r.rc.level==='bad').length; const medTax=X.median(rowsC.map(r=>r.d.tax));
  const link=r=>`<a href="#" data-id="${r.l.id}">${X.esc(r.l.addr)}, ${X.esc(r.l.city)}</a>`;
  const items=[
    {n:'01', t:'Buy what pays you', p:'An asset puts money in your pocket every month; a liability takes it out. The test is not the price or the neighborhood, it is the sign of the cash-flow line.', live:`<b>${X.fmtN(assets.length)} of ${X.fmtN(n)}</b> properties pass the test at ${a.down}% down and ${a.rate}%. ${assets.length? 'Best: '+link(assets.sort((p,q)=>q.d.cfMo-p.d.cfMo)[0])+' at '+X.fmt$(assets[0].d.cfMo)+'/mo.' : 'At these assumptions the Bay Area offers no assets — raise the down payment slider and watch when the first one appears.'}`},
    {n:'02', t:'Financial literacy is knowing the numbers before you buy', p:'Cap rate, DSCR, cash-on-cash and the 1% rule are the vocabulary. The biggest risk is never the market; it is the investor who cannot read an operating statement.', live:`Median cap rate <b>${pct(X.median(rows.map(r=>r.d.cap)))}</b>; median DSCR <b>${X.median(rows.map(r=>r.d.dscr||0)).toFixed(2)}</b>; only <b>${X.fmtN(oneP)}</b> propert${oneP===1?'y':'ies'} meet the 1% rule. That gap between price and rent is the whole story of this market.`},
    {n:'03', t:'Build the asset column beside the paycheck', p:'The journey runs from earning income to owning income. A salary is the tool that qualifies you for an owner-occupied loan on a small building.', live:`<b>${X.fmtN(hacks.length)}</b> two-to-four unit buildings on the map. ${hackBest? 'Strongest house-hack: '+link(hackBest)+' — the other units cover '+Math.round((hackBest.d.dscr||0)*100)+'% of the mortgage.' : ''}`},
    {n:'04', t:'Taxes and the power of structure', p:'Prop 13 freezes your tax base at the purchase price while rents float. Depreciation shelters cash flow. 1031 exchanges defer the gain. The rules are written for owners; use them.', live:`Median first-year property tax on these purchases: <b>${X.fmtFull(medTax)}</b>. Long-held sellers pay a fraction of that — the reason a seller carry can close a gap the bank cannot.`},
    {n:'05', t:'Value-add is where returns are made', p:'The deal on the market is rarely the deal you close. Extra units, ADUs, a room to add, a renovation on turnover: financial intelligence is seeing the income that isn\'t there yet.', live:`<b>${X.fmtN(va.length)}</b> properties carry a strong value-add signal (lot ≥ 4,000 sf, multiple units or pre-1960 stock). Top: ${va.slice(0,2).sort((p,q)=>q.va.score-p.va.score).map(link).join(' · ')||'—'}.`},
    {n:'06', t:'Work to learn, and know the rules of the game', p:'Rent control, AB 1482, soft-story retrofits and tenant relocation law are part of the Bay Area game. They do not make deals impossible; they make ignorance expensive.', live:`<b>${X.fmtN(rcCount)}</b> of the ${X.fmtN(n)} fall under a local rent ordinance by age and unit count; ${X.fmtN(rows.filter(r=>r.rc.level==='warn').length)} more sit under the statewide AB 1482 cap. Every research report on the Research tab spells out which regime applies.`}
  ];
  $('#lessons').innerHTML=items.map(i=>`<div class="lesson"><div class="n">${i.n}</div><h3>${i.t}</h3><p>${i.p}</p><div class="live">${i.live}</div></div>`).join('');
  $$('#lessons a[data-id]').forEach(x=>x.addEventListener('click', e=>{ e.preventDefault(); focusOn(x.dataset.id); }));
}
window.LXDash={render, analyze, invalidate, CATS, CAT, rentControl, valueAdd, ring, focusOn, cityPpsfOf, anorm, distressOf, get rows(){ return rows; },
  filterZip(zip, sort){ zipFilter=zip||''; if(sort) sortBy=sort; gridShown=120; renderGrid(); const g=document.querySelector('#pgrid'); if(g) g.scrollIntoView({behavior:'smooth', block:'start'}); }};
})();
