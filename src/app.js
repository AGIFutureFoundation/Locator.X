(function(){
'use strict';
const BA = window.BA;
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const fmt$ = n => n==null||isNaN(n) ? '—' : (Math.abs(n)>=1e6 ? '$'+(n/1e6).toFixed(2)+'M' : Math.abs(n)>=1e3 ? '$'+Math.round(n/1e3)+'k' : '$'+Math.round(n));
const fmtFull = n => n==null||isNaN(n) ? '—' : '$'+Math.round(n).toLocaleString('en-US');
const fmtPct = (n,d=1) => n==null||isNaN(n)||!isFinite(n) ? '—' : n.toFixed(d)+'%';
const fmtN = n => n==null||isNaN(n) ? '—' : Math.round(n).toLocaleString('en-US');
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
/* The edition's state, spelled exactly as the 50-state table in
   docs/states/README.md spells it, because the closing packet joins on that
   name. build_state.py rewrites this one line per edition (the `state` key in
   SPECS), and an edition that spans several states leaves it null on purpose:
   the packet then reports every state-sensitive item as unanswerable from this
   record rather than picking a state. Unknown is an answer.

   It lived nowhere before, which is why the Letter of Intent printed ", CA "
   into a New Orleans address and the due-diligence checklist asked a Louisiana
   buyer for an SF 3R report. */
const EDITION_STATE = null;
function store(k, v){ try{ if(v===undefined) return JSON.parse(localStorage.getItem('bayledger.'+k)); localStorage.setItem('bayledger.'+k, JSON.stringify(v)); }catch(e){ return null; } }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('on'),2600); }

/* ---------------- theme ----------------
   Four choices, cycled by one button: Light and Dark (the original pair),
   Contrast (pure black/white surfaces over the same dark-derived data
   colors, for the widest separation) and Signal (light surfaces with the
   app's own red/amber/green investment-fit scale carried into the chrome
   as its accent, rather than kept only on the map lens). All four share the
   same CVD-validated category, sequential and status color tokens — only
   the base surface/ink/accent tokens differ per theme. */
const root=document.documentElement;
const THEMES=['light','dark','contrast','signal'];
const THEME_LABEL={light:'Light',dark:'Dark',contrast:'Contrast',signal:'Signal'};
function applyTheme(t){
  root.setAttribute('data-theme', t); store('theme', t);
  const b=$('#themebtn'); if(b){ b.textContent='Theme: '+THEME_LABEL[t]; b.title='Cycle theme (Light / Dark / Contrast / Signal) — currently '+THEME_LABEL[t]; }
  /* This runs once at boot, before initMap() below has created the map — a
     hard reference to `map` at that point is a TDZ ReferenceError, not just
     an empty map, so the guard has to be a try/catch rather than an `if`. */
  try{ restyleMap(); }catch(e){}
}
$('#themebtn').addEventListener('click', ()=>{
  const cur=root.getAttribute('data-theme')||'light';
  const i=THEMES.indexOf(cur);
  applyTheme(THEMES[(i<0?0:i)+1<THEMES.length?(i<0?0:i)+1:0]);
});
const savedTheme=store('theme');
const sysDark=matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme && THEMES.indexOf(savedTheme)>=0 ? savedTheme : (sysDark?'dark':'light'));
function css(name){ return getComputedStyle(root).getPropertyValue(name).trim(); }

/* ---------------- state ---------------- */
const CITY_TAX = {'Orleans':1.45,'San Francisco':1.18,'Alameda':1.32,'Contra Costa':1.25,'Santa Clara':1.25,'San Mateo':1.15,'Marin':1.15,'Sonoma':1.20,'Napa':1.15,'Solano':1.20};
const DEF_ASSUMP = {down:25, rate:6.4, term:30, vacancy:5, mgmt:8, maint:5, capex:3, ins:0.35, taxOverride:'', hoa:'', closing:2, rentMethod:'yield', appr:'', rentGrowth:3};
const state = {
  assump: Object.assign({}, DEF_ASSUMP, store('assump')||{}),
  stars: new Set(store('stars')||[]),
  overrides: store('overrides')||{},
  imported: store('imported')||[],
  rentMarkets: store('rentMarkets')||{},
  filters: {q:'', county:'', city:'', district:'', kind:'', src:'', min:'', max:'', chips:{}},
  sort:'cap', sel:null, layer:'none', lens:'fit', basemap:'vector', token: store('mapboxToken')||''
};
function saveAssump(){ dealBump(); store('assump', state.assump); }
/* allListings() used to build a fresh concatenation on every call, and it is
   called inside loops all over the app: on the 302,612-record editions that is
   a 302k-element array allocated per call, which the collector then has to
   sweep.  Nothing here mutates the result, so the joined array is built once
   and rebuilt only when the imported set changes. */
let _allCache = null, _allImpN = -1;
function allListings(){
  if(_allCache && _allImpN === state.imported.length) return _allCache;
  _allImpN = state.imported.length;
  /* a copy, never BA.listings itself, so no caller can sort or splice the
     master list out from under everything else */
  return _allCache = BA.listings.concat(state.imported);
}

/* ---------------- market helpers ---------------- */
const M = BA.market;
/* `window.__lxAsOf` is a month index into the published ZIP series. When it is
   set, every read of "the latest value" is answered as of that month instead,
   so the whole app — marketFor, deal, the score, the categories — recomputes at
   that point in the index history using the SAME formulas and the SAME
   assumptions. That is what the replay slider drives. It replays what this app
   would have said each month given that month's published index; it is not a
   record of past listings, past rents actually collected, or past cash flow. */
const last = arr => { if(!arr) return null; const ao=window.__lxAsOf; let n=arr.length-1; if(ao!=null&&ao>=0) n=Math.min(n, ao|0); for(let i=n;i>=0;i--) if(arr[i]!=null) return arr[i]; return null; };
const at = (arr,i) => arr && arr[i]!=null ? arr[i] : null;
function zipInfo(zip){ return M.zips[zip]; }
function marketFor(l){
  const z = zipInfo(l.zip); const c = M.cities[l.city];
  const zv=last(z&&z.v), zr=last(z&&z.r), cv=last(c&&c.v), cr=last(c&&c.r);
  const v = zv||cv, r = zr||cr;
  const src = zv&&zr ? 'ZIP '+l.zip : (cv&&cr ? l.city : (v&&r ? 'mixed' : 'none'));
  let yoy=null; const vv=(z&&z.v&&last(z.v))?z.v:(c&&c.v); if(vv){ const ao=window.__lxAsOf; const nEnd=(ao!=null&&ao>=0)? Math.min(vv.length-1, ao|0) : vv.length-1; const a=last(vv), b=at(vv, nEnd-12); if(a&&b) yoy=(a/b-1)*100; }
  let nbv=null; if(l.nb && M.nbs[l.city+'|'+l.nb]) nbv=M.nbs[l.city+'|'+l.nb];
  return {zhvi:v, zori:r, ratio: v&&r ? r/v : null, yoy, src, nbv, zv:z&&z.v, zr:z&&z.r};
}
const BED_F = {0:0.75,1:0.8,2:1.0,3:1.22,4:1.42,5:1.6};
// HUD Fair Market Rents, FY2026 (2BR anchors; other sizes scaled where HUD detail
// wasn't captured — items marked ~ are approximate; verify at huduser.gov).
const FMR = {
  'San Francisco': {0:2485,1:2977,2:3604,3:4604,4:5100, approx4:true},
  'San Mateo':     {0:2485,1:2977,2:3604,3:4604,4:5100, approx4:true},
  'Santa Clara':   {0:2621,1:2982,2:3483,3:4602,4:5150, approx4:true},
  'Alameda':       {0:2010,1:2420,2:2912,3:3730,4:4300, approx:true},
  'Orleans':       {0:1050,1:1180,2:1350,3:1720,4:1980, approx:true},
  'Humboldt':      {0:1010,1:1150,2:1350,3:1900,4:2200, approx:true}
};
function totalRooms(l){ const u=Math.max(1,l.units||1); if(l.beds!=null&&l.beds>0) return l.beds*u; if(l.sqft) return Math.max(u, Math.round(l.sqft/520)); return u*2; }
function strFactor(l){
  const city=(l.city||'').toLowerCase();
  if(city==='new orleans'){
    if(/FrenchQuarter|GardenDistrict/.test(l.nb||'')) return {f:0, why:'STRs are prohibited in the French Quarter and Historic Garden District'};
    return {f:0.35, why:'NOLA residential STR: owner-occupied, one permit per square, lottery when oversubscribed — modeled at a heavy regulatory discount'};
  }
  if(city==='san francisco') return {f:0.45, why:'SF: registered hosts only, primary residence, 90-night/yr cap un-hosted — modeled hosted-hybrid'};
  return {f:0.8, why:'verify the local STR ordinance; many Bay cities cap or register short-term rentals'};
}
function rentEstimate(l){
  const o = state.overrides[l.id]||{};
  if(o.rent) return {rent:o.rent, how:'your figure'};
  if(l.rent) return {rent:l.rent, how:'from your data'};
  const rm = state.rentMarkets[(l.city||'').toLowerCase()];
  const mk = marketFor(l);
  const meth = state.assump.rentMethod;
  if(meth==='rooms' && mk.zori){
    const b=totalRooms(l);
    return {rent: Math.round(b*mk.zori*0.62), how:'co-living: '+b+' rooms × ZIP typical rent × 0.62/room — check local occupancy and house-rule limits'};
  }
  if(meth==='str' && mk.zori){
    const sf=strFactor(l);
    if(sf.f===0) return {rent:0, how:'short-term rental: $0 — '+sf.why};
    return {rent: Math.round(mk.zori*1.9*0.65*sf.f*Math.max(1,l.units||1)), how:'short-term rental (modeled ADR ≈ 1.9× monthly rent ÷ 30, 65% occupancy, regulatory factor '+sf.f+') — '+sf.why};
  }
  if(meth==='fmr'){
    const t=FMR[l.county];
    if(t){ const b=Math.min(4, l.beds==null? 2 : l.beds); const r=t[b]*Math.max(1,l.units||1);
      return {rent: Math.round(r), how:'Section 8 / HUD Fair Market Rent FY2026, '+b+'BR'+((t.approx||t.approx4&&b===4)?' (~approximate — verify huduser.gov)':'')+' × units; landlords may not refuse vouchers in CA (source-of-income law)'}; }
  }
  if(meth==='bed' && mk.zori){
    const b=totalRooms(l);
    return {rent: Math.round(b*mk.zori*0.47), how:'student housing by the bed: '+b+' beds × ZIP typical rent × 0.47/bed — campus-proximity product'};
  }
  if(meth==='beds' || !mk.ratio){
    const base = rm ? rm.medianRent : mk.zori;
    if(base){ const b = l.beds==null? 2.5 : l.beds; const f = l.beds==null?1.1:(BED_F[Math.min(5,b)]||1.6); return {rent: Math.round(base*f*Math.max(1,l.units||1)), how: (rm?'city median rent':'ZIP typical rent')+' × bedroom factor'}; }
  }
  if(mk.ratio){ const prem = (l.units||1)>1 ? 1.2 : 1; return {rent: Math.round(price(l)*mk.ratio*prem), how:'ZIP rent-to-value ratio ('+(mk.ratio*100).toFixed(2)+'%/mo) × price'+(prem>1?' × 1.2 multi-unit premium':'')}; }
  return {rent: Math.round(price(l)*0.004), how:'fallback 0.4%/mo'};
}
function price(l){ const o=state.overrides[l.id]||{}; return o.price||l.price||0; }
function taxRate(l){ const a=state.assump; if(a.taxOverride!=='' && a.taxOverride!=null) return +a.taxOverride; return CITY_TAX[l.county]||1.2; }
/* THE OPERATING EXPENSE STACK, IN ONE PLACE.

   This used to be written twice - once here in deal() and once in
   underwrite() - and the two copies had drifted. deal() was missing owner-paid
   utilities entirely and had no floor on insurance, so it reported a HIGHER net
   operating income than the underwriting sheet for the same property at the same
   price and rent. Measured across 600 Baton Rouge properties: every single-unit
   record overstated NOI by about $557 a year, every multi-unit by about $4,300.
   On one 8-unit building it was $39,260 against the sheet's $30,299; on a small
   house, $1,764 against $837 - more than double.

   That was not a cosmetic inconsistency. deal() drives the Deals table, the map
   colours, the dashboard score, the CSV export, the below-market index, the
   pattern miner's outcomes and the Standard's income requirements. The whole app
   was ranking on an income figure that the one screen a buyer actually acts on
   disagreed with, and the ranking was optimistic in the direction that matters.

   Both callers now use this function, so they cannot drift again. Where they
   genuinely differ - the sheet lets a user override HOA, utilities and
   self-management - those arrive as options rather than as a second copy. */
function opexOf(l, P, rent, egi, o){
  o = o || {};
  const a = state.assump;
  const tax   = P * taxRate(l) / 100;
  /* a floor, because no carrier writes a policy for $250 a year */
  const ins   = Math.max(1200, P * a.ins / 100);
  const maint = rent * a.maint / 100;
  const capex = rent * a.capex / 100;
  const mgmt  = o.selfManage ? 0 : egi * a.mgmt / 100;
  const isCondo = /condo|townhouse/i.test(l.kind || '');
  const hoaMo = o.hoa != null ? o.hoa
              : ((a.hoa !== '' && a.hoa != null) ? +a.hoa : (isCondo ? 450 : 0));
  const hoa = hoaMo * 12;
  /* owner-paid common utilities on a multi-unit building: light, water and
     rubbish in the common areas are the landlord's on almost every plex */
  const units = l.units || 1;
  /* The per-door figure is an ESTIMATE, and an estimate that scales linearly
     with door count runs away on a large building: at 843 doors it charged
     $910k/yr against $24k of rent.  Owner-paid common utilities do not exceed
     a modest share of gross rent in any real operating statement, so the
     default is capped at 12% of gross rent.  A figure the user types in is
     their number and is never capped. */
  const utilMo = o.util != null ? o.util
               : (units > 1 ? Math.min(90 * units, rent * 0.12 / 12) : 0);
  const util = utilMo * 12;
  return {tax, ins, maint, capex, mgmt, hoa, util,
          total: tax + ins + maint + capex + mgmt + hoa + util};
}

/* deal() is a pure function of the listing, the assumption set and the as-of
   month, and most of the app calls it over every record: the deals table, the
   dashboard, the map colours, the below-market index, the pattern miner, the
   CSV export and the score all walk the same list and redo the same arithmetic.
   On the 302,612-record editions that measured as six full passes — the deals
   tab alone took 4.9s, the dashboard 4.0s, a refresh 6.2s — for numbers that
   cannot differ between passes.  The result is therefore cached per listing
   against a generation counter, which saveAssump() bumps, and against the
   as-of month, which the time scrubber moves.  Change any assumption and every
   consumer still recomputes, exactly once.  A WeakMap is used rather than a
   field on the listing so the records themselves are never mutated. */
let _dealGen = 0;
const _dealCache = new WeakMap();
function dealBump(){ _dealGen++; }

/* refresh() is the app's documented "recompute everything" entry point, and
   code inside and outside this file writes state.assump directly before
   calling it.  Rather than trust every caller to announce the change, refresh()
   fingerprints the assumption set and the per-listing overrides itself and
   bumps the generation when either moved.  Both are small objects — a dozen
   assumption keys and whatever the user has typed by hand — so the fingerprint
   costs microseconds, while a filter change, which touches neither, correctly
   keeps the cache. */
let _dealSig = null;
function dealSync(){
  let sig = null;
  try{ sig = JSON.stringify(state.assump) + '|' + JSON.stringify(state.overrides); }catch(e){}
  if(sig === null || sig !== _dealSig){ _dealSig = sig; _dealGen++; }
}

function deal(l){
  if(!l || typeof l !== 'object') return dealCompute(l);
  /* Only the live view is cached.  While the time scrubber holds an as-of
     month the answer changes on every frame of the replay, so a one-slot cache
     would be rewritten twenty-five times over and would retain a result object
     per listing for no benefit — on the 302,612-record edition that was enough
     to exhaust the renderer.  Time travel is transient; it computes fresh. */
  if(window.__lxAsOf != null) return dealCompute(l);
  const hit = _dealCache.get(l);
  if(hit && hit.gen === _dealGen) return hit.val;
  const val = dealCompute(l);
  _dealCache.set(l, {gen:_dealGen, val:val});
  return val;
}

function dealCompute(l){
  const a=state.assump, P=price(l); if(!P) return null;
  const re=rentEstimate(l); const rent=re.rent*12;
  const vac=rent*a.vacancy/100, egi=rent-vac;
  const ox=opexOf(l,P,rent,egi);
  const tax=ox.tax, ins=ox.ins, maint=ox.maint, capex=ox.capex, mgmt=ox.mgmt, hoa=ox.hoa, util=ox.util;
  const opex=ox.total, noi=egi-opex;
  const loan=P*(1-a.down/100), r=a.rate/100/12, n=a.term*12, pmt = r>0 ? loan*r/(1-Math.pow(1+r,-n)) : loan/n, ds=pmt*12;
  const cf=noi-ds, cash=P*a.down/100+P*a.closing/100;
  const mk=marketFor(l); const appr = (a.appr!==''&&a.appr!=null)? +a.appr : (mk.yoy!=null? mk.yoy : 2);
  return {P, rent, rentMo:re.rent, rentHow:re.how, vac, egi, tax, ins, maint, capex, mgmt, hoa, util, opex, noi, loan, pmt, ds, cf, cfMo:cf/12, cash, cap:noi/P*100, coc:cf/cash*100, grm:P/rent, dscr: ds>0? noi/ds : null, ppsf: l.sqft? P/l.sqft : null, one: re.rent/P*100, gross: rent/P*100, appr, mk,
    proj: (()=>{ const out=[]; let v=P, bal=loan, rr=rent, eq=0; for(let y=1;y<=5;y++){ v*=1+appr/100; rr*=1+a.rentGrowth/100; let ib=0; for(let m=0;m<12;m++){ const i=bal*r; ib+=i; bal-=(pmt-i); } const noi_y=rr*(1-a.vacancy/100)-(tax*Math.pow(1.02,y-1)+ins+ (rr*(a.maint+a.capex)/100) + rr*(1-a.vacancy/100)*a.mgmt/100 + hoa + util); out.push({y, value:v, equity:v-bal, cf:noi_y-ds, noi:noi_y}); } return out; })()
  };
}

/* ---------------- tabs ---------------- */
$$('nav.tabs button').forEach(b=>b.addEventListener('click', ()=>showView(b.dataset.view)));
/* An unknown view id used to switch EVERY view off and leave the chrome sitting
   over a blank page, with nothing logged anywhere — the failure looked exactly
   like a view that had rendered nothing. It was found by calling
   showView('underwrite') when the id is 'uw', which is also the typo that made
   a smoke-test assertion run against a sheet nobody could see. A name that does
   not exist is now a loud no-op: the current view stays up and the console says
   which id was wrong. */
function showView(v){ const _t=document.getElementById(v);
 if(!_t || !_t.classList.contains('view')){ try{ console.warn('showView: no such view: '+v); }catch(e){} return; }
 $$('nav.tabs button').forEach(b=>b.setAttribute('aria-selected', b.dataset.view===v)); try{ window.LXNav && LXNav.sync(v); }catch(e){} $$('.view').forEach(s=>s.classList.toggle('active', s.id===v)); if(v==='mapview' && map) setTimeout(()=>map.resize(),30); if(v==='mapview') setTimeout(lensNote,60); if(v==='home' && window.LXHome) LXHome.render(); if(v==='deals') renderDeals(); if(v==='market') renderMarket(); if(v==='guide') renderGuideLive(); if(v==='dash' && window.LXDash) window.LXDash.render(); if(v==='dash' && window.LXView) window.LXView.render(); if(v==='dash' && window.LXMotion) window.LXMotion.render(); if(v==='research' && window.LXResearch) window.LXResearch.show(); if(v==='uw' && window.LXUW) window.LXUW.render(); if(v==='uw' && window.LXConv) LXConv.render(); if(v==='hacks' && window.LXHH) window.LXHH.render(); if(v==='switchboard' && window.LXSB) window.LXSB.render(); if(v==='academy' && window.LXAcad) window.LXAcad.render(); if(v==='academy' && window.LXTS) LXTS.render(); if(v==='academy' && window.LXTC) LXTC.render(); if(v==='scout' && window.LXScout) window.LXScout.render(); if(v==='scout' && window.LXSig) LXSig.render(); if(v==='scout' && window.LXVis) LXVis.scoutPulse(); if(v==='scout' && window.LXRAG) LXRAG.render(); if(v==='program' && window.LXProg) LXProg.render(); if(v==='below' && window.LXBM) LXBM.render(); if(v==='patterns' && window.LXPat) LXPat.render(); if(v==='recon' && window.LXRecon) LXRecon.render(); if(v==='corridors' && window.LXCorridor) LXCorridor.render(); if(v==='evidence' && window.LXEvid) LXEvid.render(); if(v==='comps' && window.LXComps) LXComps.render(); if(v==='compliance' && window.LXCompliance) LXCompliance.render(); if(v==='corridorfield' && window.LXCorridorField) LXCorridorField.render(); if(v==='predict' && window.LXPredict) LXPredict.render(); if(v==='sources' && window.LXSources) LXSources.render(); if(v==='standard' && window.LXStdViz) LXStdViz.render(); if(v==='packages' && window.LXPkg) LXPkg.render(); if(v==='packages' && window.LXTiers) LXTiers.render(); if(v==='academy' && window.LXGrad) window.LXGrad.render(); if(v==='network' && window.LXNet) LXNet.render(); if(v==='reo' && window.LXReo) LXReo.render(); if(v==='scout' && window.LXCorp) LXCorp.render(); if(v==='scout' && window.LXCampus) LXCampus.render(); if(window.LXPanels) setTimeout(()=>LXPanels.scan(v), 260); if(v==='twin' && window.LXTwin) window.LXTwin.render(); linkSync(); }

/* ---------------- map ---------------- */
/* The 64-entry hardcoded Bay Area city list that used to live here is gone.
   It was drawn on EVERY edition's map: measured 2026-09-14 across all eleven,
   each one rendered 64 labels of which ZERO named a city in that edition's own
   records, at coordinates thousands of kilometres outside its footprint. A New
   Orleans map carried San Francisco, Oakland and San Jose. Labels now come from
   the records themselves - see addCityLabels() below. */
let map, markers={}, cityMarkers=[], nbMarkers=[], rasterOn=false, mapReady=false;
/* ---------- map lenses: multiple ways to color & size every point ---------- */
let _rowsById=null;
function rowsById(){ if(_rowsById) return _rowsById; _rowsById={}; try{ if(window.LXDash) LXDash.rows.forEach(r=>{ _rowsById[r.l.id]=r; }); }catch(e){} return _rowsById; }
function lensInvalidate(){ _rowsById=null; }
const LENSES={
 fit:{label:'Goal fit — red / yellow / green, sized by fit'},
 cat:{label:'Locator X category (5 colors)'},
 cf:{label:'Cash flow — pays you / close / feeds on you'},
 conv:{label:'Conversion class — hotels, SROs, large buildings'},
 estate:{label:'Estate-pipeline signal (long-tenure basis gap)'},
 dis:{label:'PREDICTIVE — live distress records (foreclosure, code, evictions)'},
 fcast:{label:'PREDICTIVE — 12-mo Scout forecast by ZIP'},
 bmkt:{label:'Below market — index from sale, $/sf and basis evidence'}
};
function lensOf(l){
 // returns {tier:0 green|1 yellow|2 red|3 dim, s:0..100 size driver, col}
 const mode=state.lens||'fit';
 const r=rowsById()[l.id];
 const G='#1F8A4C', Y='#D96F0E', R='#C42B55', DIM='#66748a';
 if(mode==='cat' && r){ const c={asset:'--cat1',hack:'--cat2',value:'--cat3',growth:'--cat4',liab:'--cat5'}[r.cat]; return {tier:r.cat==='asset'?0:r.cat==='liab'?2:1, s:r.score, col:css(c)}; }
 if(mode==='cf'){ const d=r?r.d:deal(l); if(!d) return {tier:3,s:30,col:DIM}; return d.cf>0? {tier:0,s:80,col:G} : (d.dscr>=0.85? {tier:1,s:55,col:Y} : {tier:2,s:30,col:R}); }
 if(mode==='conv'){ /* candidacy comes from conv.js so the lab and the lens can never disagree;
     the inline fallback matches it exactly and exists only for a build without that module. */
   const cand = (window.LXConv && LXConv.candidate) ? LXConv.candidate(l)
     : (!!l.cv || /hotel|motel|lodging|sro/i.test(l.kind||'') || (l.units||0)>=5);
   if(cand){ const u=Math.min(100,(l.units||5)); return {tier:0, s:30+u*0.7, col:css('--accent')}; } return {tier:3, s:14, col:DIM}; }
 if(mode==='estate'){ const mk2=r?r.d.mk:marketFor(l); const base=mk2&&mk2.zhvi? mk2.zhvi*((l.units||1)>1?(l.units)*0.62:1):null; const g=(!l.est&&base&&l.price)? Math.max(0,Math.min(1,(base-l.price)/base)) : null; if(g==null) return {tier:3,s:14,col:DIM}; return g>0.55? {tier:0,s:40+g*60,col:G} : g>0.3? {tier:1,s:30+g*60,col:Y} : {tier:2,s:20,col:R}; }
  if(mode==='bmkt'){ let a=null; try{ a=window.LXBM&&LXBM.assess(l); }catch(e){} if(!a) return {tier:3,s:14,col:DIM};
   return a.idx>=45? {tier:0,s:35+a.idx*0.7,col:G} : a.idx>=25? {tier:1,s:28+a.idx*0.5,col:Y} : {tier:2,s:20,col:R}; }
  if(mode==='dis'){ const dd=(window.LXDash&&LXDash.distressOf)? LXDash.distressOf(l):null; if(!dd||dd.e<0.4) return {tier:3,s:14,col:DIM}; return dd.s>=70? {tier:0,s:40+dd.s*0.6,col:G} : dd.s>=45? {tier:1,s:30+dd.s*0.5,col:Y} : {tier:2,s:18,col:R}; }
 if(mode==='fcast'){ let g=null,r2=0; try{ if(window.LXScout){ const zf=LXScout.zipFC(l.zip); if(zf&&zf.v){ g=zf.v.g12; r2=zf.v.r2||0; } } }catch(e){} if(g==null||r2<0.15) return {tier:3,s:14,col:DIM}; return g>=2.5? {tier:0,s:40+Math.min(60,g*8),col:G} : g>=0? {tier:1,s:35,col:Y} : {tier:2,s:30,col:R}; }
 // fit (default): evidence-weighted score terciles
 const sc=r? r.score : 40;
 return sc>=60? {tier:0,s:sc,col:G} : sc>=45? {tier:1,s:sc,col:Y} : {tier:2,s:Math.max(18,sc),col:R};
}

/* ---------- what a lens could actually classify -------------------------
   A lens that leaves every property dim draws a uniformly grey map and says
   nothing about why. The user cannot tell "this market has no distress on
   record" from "the distress layer is broken", and those are opposite
   findings. It is the same failure the coverage panel exists to prevent, one
   surface further out.

   Measured on the synthetic fleet 2026-09-16: three of the eight lenses left
   all 2,500 records dim. One (conversion) was a real defect, fixed by deriving
   candidacy from the record. Two were honest - the fixture carries no distress
   records and few confident ZIP fits - and were indistinguishable from the
   defect by looking at the map, which is the point of this note.

   So the lens reports its own reach: how many properties it could place, out of
   how many are in view, and what the rest were missing. Counted on the FILTERED
   set, because that is what is drawn. */
const LENS_BLIND = {
  cf:     'no rent or expense figure, so no cash flow can be computed',
  conv:   'not a lodging class and under five units',
  estate: 'no ZIP value index to compare a basis against',
  dis:    'no live distress record published for these parcels',
  fcast:  'no ZIP forecast that clears the model-fit floor',
  bmkt:   'not enough basis evidence to index against the market',
  cat:    'not scored by the ranking engine',
  fit:    'not scored by the ranking engine'
};
function lensReach(){
  const rows = filtered();
  let placed = 0;
  for(const l of rows){ try{ if(lensOf(l).tier !== 3) placed++; }catch(e){} }
  return {n: rows.length, placed: placed, dim: rows.length - placed};
}
function lensNote(){
  const el = $('#lensnote'); if(!el) return;
  const mode = state.lens || 'fit';
  const r = lensReach();
  if(!r.n){ el.textContent = ''; return; }
  if(r.placed === 0){
    el.innerHTML = '<b>This lens places none of the ' + fmtN(r.n) + ' properties in view</b> \u2014 '
      + esc(LENS_BLIND[mode] || 'the inputs it needs are not in these records')
      + '. The map is grey because the record is silent here, not because every property scored alike.';
    el.className = 'lensnote blind';
    return;
  }
  if(r.dim > 0){
    el.innerHTML = 'Placed ' + fmtN(r.placed) + ' of ' + fmtN(r.n) + '. The other '
      + fmtN(r.dim) + ' are dim because ' + esc(LENS_BLIND[mode] || 'this lens has no input for them') + '.';
    el.className = 'lensnote';
    return;
  }
  el.innerHTML = 'Placed all ' + fmtN(r.n) + ' properties in view.';
  el.className = 'lensnote';
}

const USE_GL = (()=>{ try{ if(typeof maplibregl==='undefined' || typeof CanvasMap==='undefined') return typeof maplibregl!=='undefined'; const c=document.createElement('canvas'); const gl=c.getContext('webgl2')||c.getContext('webgl'); if(!gl) return false; const u=URL.createObjectURL(new Blob(['self.close()'],{type:'text/javascript'})); const w=new Worker(u); w.terminate(); URL.revokeObjectURL(u); return true; }catch(e){ return false; } })();
const Marker = USE_GL ? maplibregl.Marker : CMarker;
function hexLerp(a,b,t){ const p=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; const A=p(a),B=p(b); return 'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')'; }
function colorsNow(){ return {water:css('--map-water'), land:css('--map-land'), urban:css('--map-urban'), park:css('--map-park'), road:css('--map-road'), road2:css('--map-road2'), rail:css('--map-rail'), line:css('--map-line'), nb:css('--map-nb'), bay:css('--bay'), ink:css('--ink')}; }
function buildStyle(){
  const c=colorsNow();
  const nb={type:'FeatureCollection', features:[].concat(BA.geo.nbsf.features, BA.geo.nboak.features, BA.geo.nbala.features)};
  return {version:8, sources:{
      land:{type:'geojson', data:BA.geo.counties}, urban:{type:'geojson', data:BA.geo.urban}, parks:{type:'geojson', data:BA.geo.parks}, zips:{type:'geojson', data:BA.geo.zips, promoteId:'zip'}, rivers:{type:'geojson', data:BA.geo.rivers}, rail:{type:'geojson', data:BA.geo.rail}, roads:{type:'geojson', data:BA.geo.roads}, nb:{type:'geojson', data:nb}
    }, layers:[
      {id:'bg', type:'background', paint:{'background-color':c.water}},
      {id:'land', type:'fill', source:'land', paint:{'fill-color':c.land}},
      {id:'urban', type:'fill', source:'urban', paint:{'fill-color':c.urban, 'fill-opacity':0.9}},
      {id:'parks', type:'fill', source:'parks', paint:{'fill-color':c.park}},
      {id:'zipfill', type:'fill', source:'zips', paint:{'fill-color':'#000', 'fill-opacity':0}},
      {id:'ziphover', type:'line', source:'zips', paint:{'line-color':c.ink, 'line-width':['case',['boolean',['feature-state','hover'],false],2,0]}},
      {id:'rivers', type:'line', source:'rivers', paint:{'line-color':c.water, 'line-width':1.2}},
      {id:'county', type:'line', source:'land', paint:{'line-color':c.line, 'line-width':1, 'line-dasharray':[3,2]}},
      {id:'nb', type:'line', source:'nb', minzoom:10.5, paint:{'line-color':c.nb, 'line-width':0.8, 'line-opacity':0.7}},
      {id:'rail', type:'line', source:'rail', paint:{'line-color':c.rail, 'line-width':1, 'line-dasharray':[4,3]}},
      {id:'roads-casing', type:'line', source:'roads', paint:{'line-color':c.line, 'line-width':['interpolate',['linear'],['zoom'],7,1.5,12,5]}, layout:{'line-cap':'round','line-join':'round'}},
      {id:'roads', type:'line', source:'roads', paint:{'line-color':['match',['get','type'],'Major Highway',c.road,c.road2], 'line-width':['interpolate',['linear'],['zoom'],7,0.8,12,3.2]}, layout:{'line-cap':'round','line-join':'round'}},
      {id:'zipline', type:'line', source:'zips', paint:{'line-color':c.ink, 'line-width':0.5, 'line-opacity':0}}
    ]};
}
function restyleMap(){ if(!map) return; if(!USE_GL){ map.draw(); applyLayer(); return; } const c=colorsNow(); if(map.getLayer('pts')) map.setPaintProperty('pts','circle-stroke-color',css('--panel')); map.setPaintProperty('bg','background-color',c.water); map.setPaintProperty('land','fill-color',c.land); map.setPaintProperty('urban','fill-color',c.urban); map.setPaintProperty('parks','fill-color',c.park); map.setPaintProperty('rivers','line-color',c.water); map.setPaintProperty('county','line-color',c.line); map.setPaintProperty('nb','line-color',c.nb); map.setPaintProperty('rail','line-color',c.rail); map.setPaintProperty('roads-casing','line-color',c.line); map.setPaintProperty('roads','line-color',['match',['get','type'],'Major Highway',c.road,c.road2]); map.setPaintProperty('ziphover','line-color',c.ink); map.setPaintProperty('zipline','line-color',c.ink); applyLayer(); if(mapReady) renderMarkers(); }
function initMap(){
  const REG=BA.region||null;
  if(USE_GL){ map = new maplibregl.Map({container:'map', style:buildStyle(), center:REG?REG.center:[-122.27,37.72], zoom:REG?REG.zoom:9.3, minZoom:REG?Math.min(9,(REG.zoom||9)-0.6):7.5, maxZoom:17, attributionControl:false, maxBounds:REG?REG.maxBounds:[[-124.2,36.2],[-120.2,39.2]]}); map.addControl(new maplibregl.NavigationControl({showCompass:false}), 'top-right'); }
  else { const nb={type:'FeatureCollection', features:[].concat(BA.geo.nbsf.features, BA.geo.nboak.features, BA.geo.nbala.features)}; map = new CanvasMap({container:'map', geo:{counties:BA.geo.counties, urban:BA.geo.urban, parks:BA.geo.parks, zips:BA.geo.zips, rivers:BA.geo.rivers, rail:BA.geo.rail, roads:BA.geo.roads, nb}, colors:colorsNow, center:(BA.region?BA.region.center:[-122.27,37.72]), zoom:(BA.region?BA.region.zoom:9.3), minZoom:BA.region?Math.min(9,(BA.region.zoom||9)-0.6):7.5, maxZoom:17, maxBounds:(BA.region?BA.region.maxBounds:[[-124.2,36.2],[-120.2,39.2]])}); $('#attrib').textContent += ' · Canvas renderer'; }
  window.__map=map;
  const COLLEGES_BAY=[['Stanford University',37.4275,-122.1697],['UC Berkeley',37.8719,-122.2585],['San Francisco State',37.7241,-122.4799],['University of San Francisco',37.7766,-122.4506],['UCSF Parnassus',37.7631,-122.4586],['San Jose State',37.3352,-121.8811],['Santa Clara University',37.3496,-121.9390],['City College of SF',37.7254,-122.4525],['De Anza College',37.3194,-122.0450],['Foothill College',37.3614,-122.1268],['Cal State East Bay',37.6577,-122.0566],['Laney College',37.7975,-122.2668],['Chabot College',37.6432,-122.1097],['Mills College',37.7811,-122.1837],['Menlo College',37.4483,-122.1839],['College of San Mateo',37.5344,-122.3350],['Skyline College',37.6295,-122.4681],['Canada College',37.4478,-122.2851],['Ohlone College',37.5304,-121.9126],['Mission College',37.3903,-121.9846],['West Valley College',37.2637,-122.0106],['Evergreen Valley College',37.3020,-121.7683],['Berkeley City College',37.8697,-122.2681]];
const COLLEGES_NOLA=[['Xavier University of Louisiana',29.9647,-90.1039],['Tulane University',29.9404,-90.1229],['Loyola University New Orleans',29.9346,-90.1225],['University of New Orleans',30.0277,-90.0679],['Dillard University',30.0217,-90.0491],['Southern University at New Orleans',30.0327,-90.0567],['Delgado Community College',29.9906,-90.1032]];
let collegeMarkers=[]; window.__collegesOn=true;
/* The legacy campus pin lists are hardcoded coordinates, and the region guess
     below reads only the first 500 records, so it is wrong for any edition whose
     counties it does not recognise - which is how 23 Bay Area universities came
     to be drawn on the Louisiana and national maps. The footprint rule decides
     now: a pin that the edition's own records cannot place is not drawn. */
  function collegesFor(){ const cs=new Set(allListings().slice(0,500).map(l=>l.county));
    const list = cs.has('Orleans') ? COLLEGES_NOLA : (cs.has('Humboldt') ? [] : COLLEGES_BAY);
    const keep = list.filter(c => inFootprint(c[1], c[2]));
    if(keep.length < list.length){ try{ console.warn('map: ' + (list.length - keep.length)
      + ' hardcoded campus pin(s) dropped - outside this edition\'s record footprint'); }catch(e){} }
    return keep; }
function addColleges(){ var _cm=0; try{ if(window.LXCampus) _cm=LXCampus.addMarkers(map, Marker)||0; }catch(e){}
  var _cd=0; try{ if(window.LXCampus) _cd=LXCampus.highlightMarkers(map, Marker)||0; }catch(e){}
  try{ if(window.LXCorp) LXCorp.addMarkers(map, Marker); }catch(e){}
  /* the campus layer carries published enrollment and covers both regions; the
     legacy pin list only runs where it found nothing to mount. */
  if(_cm>0){ const cb0=$('#collbtn'); if(_cd>0) cb0 && cb0.setAttribute('title','Toggle college markers & highlighted student-housing candidates'); if(cb0) cb0.addEventListener('click', ()=>{ window.__collegesOn=!window.__collegesOn; if(window.LXCampus){ LXCampus.toggle(window.__collegesOn); LXCampus.toggleDeals(window.__collegesOn); } cb0.setAttribute('aria-pressed', window.__collegesOn); }); return; }
 collegesFor().forEach(c=>{ const el=document.createElement('div'); el.className='campuspin'; el.style.cssText='font-size:20px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55));cursor:default'; el.textContent='🎓'; el.title=c[0]; el.dataset.lat=c[1]; el.dataset.lng=c[2]; const lb=document.createElement('div'); lb.style.cssText='position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:9px;font-weight:600;color:#1d3557;background:rgba(255,255,255,.85);padding:0 4px;border-radius:4px;white-space:nowrap;pointer-events:none'; lb.textContent=c[0]; el.appendChild(lb); const m=new Marker({element:el}).setLngLat([c[2],c[1]]).addTo(map); collegeMarkers.push(m); });
  const cb=$('#collbtn'); if(cb) cb.addEventListener('click', ()=>{ window.__collegesOn=!window.__collegesOn; collegeMarkers.forEach(m=>{ m.getElement().style.display=window.__collegesOn?'':'none'; }); cb.setAttribute('aria-pressed', window.__collegesOn); }); }
window.__lxmap=map; map.on('load', ()=>{ mapReady=true; if(BA.region&&BA.region.pois) BA.region.pois.filter(p=>inFootprint(p.lat,p.lng)).forEach(p=>{ const el=document.createElement('div'); el.className='campuspin'; el.style.cssText='font-size:18px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))'; el.textContent='🎓'; el.title=p.name; el.dataset.lat=p.lat; el.dataset.lng=p.lng; new Marker({element:el}).setLngLat([p.lng,p.lat]).addTo(map); }); addColleges(); addCityLabels(); addNbLabels(); renderMarkers(); zoomClass(); });
  map.on('zoom', zoomClass);
  map.on('error', e=>{ if(e && e.sourceId==='raster'){ $('#mapnotice').textContent='Live tiles could not load. Pages hosted on claude.ai block outside tile servers — open the downloaded file (or host it) to use Mapbox / OpenStreetMap tiles. Falling back to the built-in map.'; $('#mapnotice').classList.add('on'); setBasemap('vector', true); } });
  let hovered=null; const tip=document.createElement('div'); tip.className='pill'; tip.style.cssText='position:absolute;pointer-events:none;display:none;z-index:3;background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:6px 9px;font-size:12px;box-shadow:var(--shadow)'; $('#mapwrap').appendChild(tip);
  map.on('mousemove','zipfill', e=>{ if(state.layer==='none') return; const f=e.features[0]; if(hovered!==null && hovered!==f.id) map.setFeatureState({source:'zips',id:hovered},{hover:false}); hovered=f.id; map.setFeatureState({source:'zips',id:hovered},{hover:true}); const p=f.properties; const y = p.zhvi&&p.zori ? (p.zori*12/p.zhvi*100).toFixed(1)+'%' : '—'; tip.innerHTML=`<b>${p.zip}</b> ${p.city||''}<br>Value <span class="num">${fmt$(p.zhvi)}</span> · Rent <span class="num">${p.zori?'$'+fmtN(p.zori)+'/mo':'—'}</span><br>Gross yield <span class="num">${y}</span> · 1-yr <span class="num">${p.yoy!=null?(p.yoy>0?'+':'')+p.yoy+'%':'—'}</span>`; tip.style.display='block'; tip.style.left=(e.point.x+14)+'px'; tip.style.top=(e.point.y+14)+'px'; });
  map.on('mouseleave','zipfill', ()=>{ if(hovered!==null) map.setFeatureState({source:'zips',id:hovered},{hover:false}); hovered=null; tip.style.display='none'; });
  map.on('click','zipfill', e=>{ if(state.layer==='none') return; const p=e.features[0].properties; showView('market'); $('#mq').value=p.zip; renderMarket(p.zip); });
}
/* THE FOOTPRINT RULE: nothing gets a marker on this map that the edition's own
   records cannot place. The box is the records' own extent, padded, and every
   pin from a hardcoded list is checked against it before it is drawn.

   It exists because of what was measured here on 2026-09-14: 23 Bay Area
   university pins and 64 Bay Area city labels were rendering on all eleven
   editions, including the Louisiana and national ones - real places, correct
   coordinates, on entirely the wrong map. A pin nobody can tie to the records
   in front of them is a sample, not a finding. */
let _footprint, _footprintN = -1;
function editionFootprint(){
  const ls = allListings();
  if(_footprint !== undefined && _footprintN === ls.length) return _footprint;
  _footprintN = ls.length;
  let w = 1e9, s2 = 1e9, e = -1e9, n = -1e9, seen = 0;
  for(let i = 0; i < ls.length; i++){
    const l = ls[i];
    if(typeof l.lng !== 'number' || typeof l.lat !== 'number') continue;
    seen++;
    if(l.lng < w) w = l.lng; if(l.lng > e) e = l.lng;
    if(l.lat < s2) s2 = l.lat; if(l.lat > n) n = l.lat;
  }
  if(!seen) return _footprint = null;          // no coordinates: no claim either way
  const pad = Math.max(0.35, (e - w) * 0.12, (n - s2) * 0.12);
  return _footprint = {w: w - pad, s: s2 - pad, e: e + pad, n: n + pad};
}
function inFootprint(lat, lng){
  const f = editionFootprint();
  if(!f) return true;
  return lng >= f.w && lng <= f.e && lat >= f.s && lat <= f.n;
}

function zoomClass(){ const z=map.getZoom(); $('#map').classList.toggle('zoomed-out', z<10.6); cityMarkers.forEach(m=>{ const el=m.getElement(); const rank=+el.dataset.rank; el.classList.toggle('hid', (rank===2&&z<8.6)||(rank===3&&z<10)||(rank===4&&z<11.2)||(rank===1&&z>12.4)); }); nbMarkers.forEach(m=>m.getElement().classList.toggle('hid', z<12)); }
function addNbLabels(){ const feats=[].concat(BA.geo.nbsf.features, BA.geo.nboak.features, BA.geo.nbala.features); feats.forEach(f=>{ let xs=0,ys=0,n=0; const walk=c=>{ if(typeof c[0]==='number'){ xs+=c[0]; ys+=c[1]; n++; } else c.forEach(walk); }; walk(f.geometry.coordinates); if(!n) return; const el=document.createElement('div'); el.className='citylbl nb hid'; el.textContent=f.properties.name; const m=new Marker({element:el, anchor:'center'}).setLngLat([xs/n, ys/n]).addTo(map); nbMarkers.push(m); }); }
const CITY_LABEL_CAP = 250;
/* One label per city THIS EDITION HOLDS, at the centroid of that city's own
   records, ranked by how many records carry the name. The rank drives nothing
   but the zoom at which the label appears (zoomClass) - it is a record count,
   never a claim about which city matters. Clicking a label focuses that city,
   the same action the city rail's chip performs. */
function addCityLabels(){
  cityMarkers.forEach(m => { try{ m.remove(); }catch(e){} });
  cityMarkers = [];
  const cs = cityStats().filter(c => isFinite(c.cx) && isFinite(c.cy) && inFootprint(c.cy, c.cx));
  const n = cs.length;
  cs.slice(0, CITY_LABEL_CAP).forEach((c, i) => {
    const rank = i < Math.max(1, Math.round(n * 0.08)) ? 1
               : i < Math.round(n * 0.30) ? 2
               : i < Math.round(n * 0.60) ? 3 : 4;
    const el = document.createElement('div');
    el.className = 'citylbl' + (rank === 1 ? ' big' : '');
    el.dataset.rank = rank; el.dataset.city = c.city; el.dataset.n = c.n;
    /* the coordinate it was drawn at, so a test can check the placement against
       the records without reaching into the map's marker objects */
    el.dataset.lng = c.cx; el.dataset.lat = c.cy;
    el.title = c.city + ' \u2014 ' + fmtN(c.n) + ' records in this edition';
    el.textContent = c.city;
    el.addEventListener('click', ev => { ev.stopPropagation(); focusCity(c.city); });
    cityMarkers.push(new Marker({element: el, anchor: 'center'}).setLngLat([c.cx, c.cy]).addTo(map));
  });
  return cs.length;
}
const PIN_CAP=250;
function renderMarkers(){
  const fl=filtered(); const usePills=fl.length<=PIN_CAP; const vis=new Set((usePills?fl:fl.filter(l=>l.id===state.sel)).map(l=>l.id));
  allListings().forEach(l=>{
    let m=markers[l.id];
    if(!m){ if(!vis.has(l.id)) return; const el=document.createElement('div'); el.className='pin'; el.innerHTML='<div class="pill"></div><div class="dot"></div>'; el.addEventListener('click', ev=>{ ev.stopPropagation(); select(l.id, false); }); m=new Marker({element:el, anchor:'center'}).setLngLat([l.lng,l.lat]); markers[l.id]=m; }
    const el=m.getElement();
    if(vis.has(l.id)){ const d=deal(l); const LZ=lensOf(l); const pl=el.querySelector('.pill'); pl.textContent=fmt$(price(l)); pl.style.borderColor=LZ.col; pl.style.boxShadow='inset 3px 0 0 '+LZ.col; el.classList.toggle('cf', !!(d&&d.cf>0)); el.classList.toggle('neg', !!(d&&d.cf<=0)); el.classList.toggle('imp', l.src==='imp'); el.classList.toggle('sel', state.sel===l.id); el.style.zIndex = state.sel===l.id ? 20 : (l.src==='imp'?2:1); if(!m._added){ m.addTo(map); m._added=true; } }
    else if(m._added){ m.remove(); m._added=false; }
  });
  renderDots(usePills? [] : fl);
}
/* Rebuilding this FeatureCollection means allocating one object per record and
   re-tessellating the whole circle layer — for a quarter-million-record edition
   that's most of the cost of a "select a property on the map" click, and a bare
   selection change (no filter/lens/assumption change) touches none of the inputs
   this depends on.  A cheap O(1) fingerprint — length plus a few sampled ids —
   lets repeat calls with an unchanged set skip the rebuild and the setData()
   call entirely. */
let _dotsSig=null;
function renderDots(fl){
  const n=fl.length;
  const sig = n+'|'+state.lens+'|'+_dealGen+'|'+(n?fl[0].id+','+fl[(n/2)|0].id+','+fl[n-1].id:'');
  if(sig===_dotsSig && USE_GL && map && map.getSource && map.getSource('pts')) return;
  const feats=fl.map(l=>{ const L2=lensOf(l); return {type:'Feature', geometry:{type:'Point', coordinates:[l.lng,l.lat]}, properties:{id:l.id, col: l.src==='imp'? css('--accent') : L2.col, s:+L2.s.toFixed(0)}}; });
  if(USE_GL){
    const data={type:'FeatureCollection', features:feats};
    const paintC=['get','col'];
    const paintR=['interpolate',['linear'],['zoom'],9,['+',1.6,['*',['get','s'],0.028]],13,['+',2.5,['*',['get','s'],0.075]]];
    /* At the metro-wide default zoom, tens of thousands of overlapping circles
       read as a solid carpet rather than a legible scatter — a premium map
       should look calm zoomed out and resolve into individual properties as
       you zoom in, not the reverse. Opacity and stroke ramp up with zoom
       instead of being constant, so the same layer stays honest (every point
       is still there, still clickable) while looking considered rather than
       noisy at the scale most sessions actually open on. */
    const paintO=['interpolate',['linear'],['zoom'],8,0.38,10.5,0.6,13,0.88];
    const paintSW=['interpolate',['linear'],['zoom'],9,0,11,0.4,13,0.8];
    /* map.getSource() reaches into the style object, which maplibre leaves null
       until the style has loaded — so asking it anything before then throws
       rather than returning undefined.  The readiness test has to come first. */
    if(!map || !mapReady) return;
    if(map.isStyleLoaded && !map.isStyleLoaded()){
      /* a style reload is transient — come back once it settles rather than
         leaving the map without its dots until the next unrelated refresh */
      if(map.once) map.once('idle', ()=>{ try{ renderMarkers(); }catch(e){} });
      return;
    }
    _dotsSig=sig;
    if(!map.getSource('pts')){ map.addSource('pts',{type:'geojson', data});
      map.addLayer({id:'pts', type:'circle', source:'pts', paint:{'circle-radius':paintR,'circle-color':paintC,'circle-opacity':paintO,'circle-stroke-color':css('--panel'),'circle-stroke-width':paintSW}});
      map.on('click','pts', e=>{ if(e.features&&e.features[0]) select(e.features[0].properties.id, false); });
      map.on('mouseenter','pts', ()=>{ map.getCanvas().style.cursor='pointer'; }); map.on('mouseleave','pts', ()=>{ map.getCanvas().style.cursor=''; });
    } else { map.getSource('pts').setData(data); map.setPaintProperty('pts','circle-color',paintC); map.setPaintProperty('pts','circle-radius',paintR); map.setPaintProperty('pts','circle-opacity',paintO); map.setPaintProperty('pts','circle-stroke-width',paintSW); }
  } else if(map && map.setPoints){ map.setPoints(feats.map(f=>({lng:f.geometry.coordinates[0], lat:f.geometry.coordinates[1], id:f.properties.id, col:f.properties.col})), id=>select(id,false)); }
}
/* choropleth */
const LAYERS = {fcast:{label:'Forecast — ZIP value change, next 12 months (model)', prop:'fc', fmt:v=>(v>0?'+':'')+v.toFixed(1)+'%', stops:[-6,6], diverging:true}, zhvi:{label:'Typical home value (ZHVI)', prop:'zhvi', fmt:fmt$, stops:[500000,2500000]}, zori:{label:'Typical rent (ZORI, $/mo)', prop:'zori', fmt:v=>'$'+fmtN(v), stops:[2000,5500]}, yield:{label:'Gross yield (ZORI×12 ÷ ZHVI)', prop:'yield', fmt:v=>v.toFixed(1)+'%', stops:[3,7]}, yoy:{label:'1-year value change', prop:'yoy', fmt:v=>(v>0?'+':'')+v.toFixed(1)+'%', stops:[-8,8], diverging:true}};

/* ---------- ZIP statistics, baked onto the geometry ---------------------
   The five ZIP choropleth overlays paint from GEOJSON FEATURE PROPERTIES.
   Exactly one of them ever had its property written: scout.js writes `fc` onto
   every feature after it fits its forecasts. Nothing wrote `zhvi`, `zori` or
   `yoy`, ever, in any edition — so four of the five overlays painted a fully
   transparent map while applyLayer() still drew a legend with a colour ramp,
   dollar or percent endpoints, and a "Zillow Research" attribution line.

   That is worse than a blank layer. A blank layer looks broken; a legend under
   a blank layer asserts that data is being displayed and names a source for it.

   The data was never missing. M.zips[zip] carries the same value and rent
   series marketFor() reads for every property panel in the app — measured on
   the synthetic fleet, all 24 ZIP features had 36 months of both. It simply was
   never joined to the geometry.

   `last()` already honours window.__lxAsOf, so re-baking on a time scrub keeps
   the choropleth on the same month as the rest of the app rather than drifting
   to today while the panels show 2019. */
function bakeZipStats(){
  if(!window.BA || !BA.geo || !BA.geo.zips || !BA.geo.zips.features) return 0;
  let painted = 0;
  BA.geo.zips.features.forEach(ft => {
    const p = ft.properties, z = M.zips[p.zip];
    if(!z){ p.zhvi = null; p.zori = null; p.yoy = null; return; }
    const v = last(z.v), r = last(z.r);
    p.zhvi = (typeof v === 'number') ? v : null;
    p.zori = (typeof r === 'number') ? r : null;
    let yoy = null;
    if(z.v){
      const ao = window.__lxAsOf;
      const nEnd = (ao != null && ao >= 0) ? Math.min(z.v.length - 1, ao | 0) : z.v.length - 1;
      const a = last(z.v), b = at(z.v, nEnd - 12);
      if(a && b) yoy = +((a / b - 1) * 100).toFixed(1);
    }
    p.yoy = yoy;
    if(p.zhvi != null || p.zori != null) painted++;
  });
  return painted;
}
/* How many ZIPs the ACTIVE overlay can actually paint. Same question the lens
   note asks of the point layer, asked of the choropleth. */
function layerReach(mode){
  if(!window.BA || !BA.geo || !BA.geo.zips) return {n:0, painted:0};
  const feats = BA.geo.zips.features || [];
  const L = LAYERS[mode];
  if(!L) return {n: feats.length, painted: feats.length};
  let painted = 0;
  feats.forEach(f => {
    const p = f.properties;
    if(L.prop === 'yield') { if(typeof p.zhvi==='number' && typeof p.zori==='number' && p.zhvi>0) painted++; }
    else if(typeof p[L.prop] === 'number') painted++;
  });
  return {n: feats.length, painted: painted};
}


/* ---------- the colour scale, from THIS edition's own distribution -------
   LAYERS declares stops of [500000, 2500000] for typical home value, [2000,
   5500] for rent. Those are Bay Area numbers, and they were applied to every
   edition — the same defect as the sixty-four hard-coded Bay Area city labels
   that once drew on a New Orleans map.

   Measured on the synthetic fleet: its ZIPs span $319,637 to $774,948 against a
   legend reading $500k to $2.5M. The entire market occupied 22.8% of the ramp,
   every ZIP below $500k clamped to the palest shade, and the legend printed
   three figures that describe nowhere in the edition. The choropleth painted,
   and carried almost no information.

   Stops now come from the values actually present. Sequential layers take the
   10th to 90th percentile so a single outlier cannot flatten the rest;
   DIVERGING layers (year-on-year change, forecast) stay symmetric about zero,
   because on those the midpoint is a real quantity and moving it would make a
   falling market look flat. Below the sample floor the declared stops stand and
   the legend says the range is a default rather than a measurement — five ZIPs
   cannot describe a distribution. */
const LAYER_SAMPLE_FLOOR = 5;
function layerValues(mode){
  const L = LAYERS[mode]; if(!L || !window.BA || !BA.geo || !BA.geo.zips) return [];
  const out = [];
  (BA.geo.zips.features || []).forEach(f => {
    const p = f.properties;
    if(L.prop === 'yield'){
      if(typeof p.zhvi === 'number' && typeof p.zori === 'number' && p.zhvi > 0)
        out.push(p.zori * 12 / p.zhvi * 100);
    } else if(typeof p[L.prop] === 'number') out.push(p[L.prop]);
  });
  return out.sort((a, b) => a - b);
}
function layerStops(mode){
  const L = LAYERS[mode];
  const v = layerValues(mode);
  if(!L) return {stops: [0, 1], derived: false, n: 0};
  if(v.length < LAYER_SAMPLE_FLOOR) return {stops: L.stops, derived: false, n: v.length};
  const q = f => v[Math.min(v.length - 1, Math.max(0, Math.round((v.length - 1) * f)))];
  if(L.diverging){
    /* Zero has to stay in the middle: it is the line between a market that fell
       and one that rose. Take the widest excursion and mirror it. */
    const m = Math.max(Math.abs(q(0.10)), Math.abs(q(0.90)), 0.5);
    return {stops: [-m, m], derived: true, n: v.length};
  }
  let lo = q(0.10), hi = q(0.90);
  if(!(hi > lo)) { lo = v[0]; hi = v[v.length - 1]; }
  if(!(hi > lo)) return {stops: L.stops, derived: false, n: v.length};
  return {stops: [lo, hi], derived: true, n: v.length};
}

function applyLayer(){
  /* Baking mutates the geojson object; maplibre keeps its OWN copy of a source's
     data, so the paint expression would still read the pre-bake properties and
     the choropleth would stay transparent while the feature objects looked
     correct to every console probe. The re-set is what makes the join visible.
     Found by screenshotting the map instead of trusting the property values. */
  if(bakeZipStats() > 0) updateZipsSource();
  const L=LAYERS[state.layer]; const leg=$('#legend');
  if(!L){ if(USE_GL){ map.setPaintProperty('zipfill','fill-opacity',0); map.setPaintProperty('zipline','line-opacity',0); } else map.setChoropleth(null); leg.classList.remove('on'); return; }
  const curTheme=root.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const dark=curTheme==='dark'||curTheme==='contrast';
  const seq = dark ? ['#1c3a4d','#3a7ca6','#8ec5e8'] : ['#dbe9f2','#4f8fb8','#123c5c'];
  const div = dark ? ['#c45a5a','#3a3f3d','#4fa97a'] : ['#b8443f','#e8e6e0','#1f7a4a'];
  const cols = L.diverging? div : seq;
  const SC = layerStops(state.layer); const [a,b]=SC.stops; const mid=(a+b)/2;
  const isnum=p=>['==',['typeof',['get',p]],'number']; const val = L.prop==='yield' ? ['case',['all',isnum('zhvi'),isnum('zori'),['>',['get','zhvi'],0]], ['*',['/',['*',['get','zori'],12],['get','zhvi']],100], -999] : ['case',isnum(L.prop),['get',L.prop],-999];
  if(USE_GL){ map.setPaintProperty('zipfill','fill-color',['case',['<',val,-900],'rgba(0,0,0,0)',['interpolate',['linear'],val,a,cols[0],mid,cols[1],b,cols[2]]]);
  map.setPaintProperty('zipfill','fill-opacity', rasterOn?0.55:0.78); map.setPaintProperty('zipline','line-opacity',0.35); }
  else { map.setChoropleth(p=>{ let v; if(L.prop==='yield'){ v = (typeof p.zhvi==='number' && typeof p.zori==='number' && p.zhvi>0)? p.zori*12/p.zhvi*100 : null; } else v = typeof p[L.prop]==='number'? p[L.prop] : null; if(v==null) return null; const t=clamp((v-a)/(b-a),0,1); return t<0.5? hexLerp(cols[0],cols[1],t*2) : hexLerp(cols[1],cols[2],(t-0.5)*2); }); }
  const reach = layerReach(state.layer);
  if(reach.painted === 0){
    /* No legend. A colour ramp over a transparent map is a claim that data is
       shown, and naming a source under it makes the claim worse. */
    leg.innerHTML = `<div><b>${L.label}</b></div><div style="color:var(--warn);margin-top:3px">No ZIP in this edition publishes this figure, so nothing is shaded. The map is unshaded because the series is absent, not because every ZIP is equal.</div>`;
    leg.classList.add('on');
    return;
  }
  const short = reach.n - reach.painted;
  const scaleNote = SC.derived
    ? 'scale from this edition\u2019s ' + fmtN(SC.n) + ' ZIPs (10th\u201390th percentile)'
    : 'default scale \u2014 only ' + fmtN(SC.n) + ' ZIP' + (SC.n===1?'':'s') + ' carry this figure, below the sample floor';
  leg.innerHTML=`<div>${L.label}</div><div class="bar" style="background:linear-gradient(90deg,${cols[0]},${cols[1]},${cols[2]})"></div><div class="ends"><span>${L.fmt(a)}</span><span>${L.fmt(mid)}</span><span>${L.fmt(b)}</span></div><div style="color:var(--muted);margin-top:3px">Zillow Research · ${M.months[M.months.length-1]} · ${scaleNote}${short? ' · '+fmtN(short)+' of '+fmtN(reach.n)+' ZIPs unshaded' : ''}</div>`; leg.classList.add('on');
}
$('#layer').addEventListener('change', e=>{ state.layer=e.target.value; applyLayer(); });
function setBasemap(mode, silent){
  state.basemap=mode; $('#basemap').value=mode;
  // capture the shell's regionalized footer once, so restoring vector mode
  // restores the edition's own credits rather than a hard-coded region's
  if(!setBasemap._attrib0) setBasemap._attrib0=$('#attrib').textContent;
  if(USE_GL){ if(map.getLayer('raster')) map.removeLayer('raster'); if(map.getSource('raster')) map.removeSource('raster'); }
  const vecLayers=['land','urban','parks','rivers','county','nb','rail','roads-casing','roads'];
  if(mode==='vector'){ rasterOn=false; if(USE_GL) vecLayers.forEach(id=>map.setLayoutProperty(id,'visibility','visible')); else map.setRaster(null); cityMarkers.forEach(m=>m.getElement().style.display=''); applyLayer(); $('#attrib').textContent=setBasemap._attrib0; return; }
  let tiles, attrib;
  if(mode.startsWith('mapbox')){ let tok=state.token; if(!tok){ tok=prompt('Paste a Mapbox public access token (pk.…). It is stored only in this browser.'); if(!tok){ setBasemap('vector'); return; } state.token=tok; store('mapboxToken', tok); } const st=mode==='mapbox-satellite'?'satellite-streets-v12':'streets-v12'; tiles=[`https://api.mapbox.com/styles/v1/mapbox/${st}/tiles/512/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(tok)}`]; attrib='© Mapbox © OpenStreetMap · Improve this map'; }
  else if(mode==='esri-satellite'){ tiles=[ESRI_TILE]; attrib='Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community'; }
  else { tiles=['https://tile.openstreetmap.org/{z}/{x}/{y}.png']; attrib='© OpenStreetMap contributors'; }
  if(USE_GL){ map.addSource('raster',{type:'raster', tiles, tileSize: mode.startsWith('mapbox')?512:256, attribution:attrib});
  map.addLayer({id:'raster', type:'raster', source:'raster', paint:{'raster-opacity':1}}, 'land'); }
  else { map._rasterErr=false; map.setRaster(tiles, mode.startsWith('mapbox')?512:256); }
  rasterOn=true; if(USE_GL) vecLayers.forEach(id=>map.setLayoutProperty(id,'visibility','none')); cityMarkers.forEach(m=>m.getElement().style.display='none'); applyLayer();
  $('#attrib').textContent=attrib+' · Market data © Zillow Research'; if(!silent){ $('#mapnotice').classList.remove('on'); }
}
$('#basemap').addEventListener('change', e=>setBasemap(e.target.value));
const _lensEl=$('#lens'); if(_lensEl) _lensEl.addEventListener('change', e=>{ state.lens=e.target.value; renderMarkers(); lensNote(); const lg=$('#lenslegend'); if(lg){ lg.innerHTML= state.lens==='cat'? '<span><i style="background:var(--cat1)"></i>asset</span><span><i style="background:var(--cat2)"></i>hack</span><span><i style="background:var(--cat3)"></i>value</span><span><i style="background:var(--cat4)"></i>growth</span><span><i style="background:var(--cat5)"></i>liability</span>' : state.lens==='conv'? '<span><i style="background:var(--accent)"></i>conversion class · size = units</span><span><i style="background:#66748a"></i>other</span>' : state.lens==='dis'? '<span><i style="background:#1F8A4C"></i>hard distress on record</span><span><i style="background:#D96F0E"></i>elevated</span><span><i style="background:#66748a"></i>no live record</span>' : state.lens==='fcast'? '<span><i style="background:#1F8A4C"></i>ZIP forecast ≥ +2.5%</span><span><i style="background:#D96F0E"></i>flat-to-up</span><span><i style="background:#C42B55"></i>declining</span><span style="color:var(--muted)">dim = weak model fit</span>' : state.lens==='bmkt'? '<span><i style="background:#1F8A4C"></i>index ≥ 45</span><span><i style="background:#D96F0E"></i>25–45</span><span><i style="background:#C42B55"></i>under 25</span><span style="color:var(--muted)">size = index</span>' : '<span><i style="background:#1F8A4C"></i>best match</span><span><i style="background:#D96F0E"></i>close — needs a lever</span><span><i style="background:#C42B55"></i>weak fit</span><span style="color:var(--muted)">size = fit</span>'; } });
$('#fitbtn').addEventListener('click', fitToResults);
/* The city rail — one map per city, in one click.
   ----------------------------------------------------------------------------
   An edition carries a single region box: one centre, one zoom, one set of max
   bounds. That is right for a market edition and useless for finding a city
   inside one, because a catalogue spanning several cities opens showing all of
   them at once and offers no way to say "show me that one" short of filtering
   the list and then pressing Fit to results.

   The rail is built FROM THE RECORDS, not from a hand-kept list of places: the
   cities are whatever the records say they are, the counts are counts, and the
   bounds are computed from the coordinates each city actually holds. An edition
   whose records name one city renders no rail at all, because a chooser with a
   single choice is furniture.

   Selecting a city drives the same filter the dropdown does — there is one
   definition of "city selected", not two — and then frames the map on that
   city's own extent rather than on the edition's. */
/* ---------------- districts ----------------
   The record's own district: `nb` (a neighborhood-boundary join) falling back to
   `anb` (the assessor's own neighborhood code) - the same precedence the result
   list and the drawer already use, so the three cannot disagree.

   Most records have NEITHER, and that is the point of the coverage line. On the
   synthetic fixture four in five carry no neighborhood, and on a real assessor
   roll the share varies by jurisdiction. A rail that quietly showed only the
   named ones would present a fraction of the catalog as though it were all of
   it - the exact move this platform refuses everywhere else. So the unnamed
   records are counted, offered as their own selectable bucket, and named in the
   coverage line. Unknown is an answer.

   No geometry is invented here: a district's extent is the bounding box of the
   records that declare it, never a drawn boundary. */
const NO_DISTRICT = '\u0000none';
function districtOf(l){ return (l && (l.nb || l.anb)) || null; }

let _distCache = null, _distCacheN = -1;
function districtStats(){
  const ls = allListings();
  if(_distCache && _distCacheN === ls.length) return _distCache;
  const by = new Map(); let unnamed = 0;
  for(let i = 0; i < ls.length; i++){
    const l = ls[i];
    const d = districtOf(l);
    if(!d){ unnamed++; continue; }
    let r = by.get(d);
    if(!r){ r = {district:d, n:0, w:1e9, s:1e9, e:-1e9, nn:-1e9}; by.set(d, r); }
    r.n++;
    if(typeof l.lng === 'number'){ if(l.lng < r.w) r.w = l.lng; if(l.lng > r.e) r.e = l.lng; }
    if(typeof l.lat === 'number'){ if(l.lat < r.s) r.s = l.lat; if(l.lat > r.nn) r.nn = l.lat; }
  }
  _distCacheN = ls.length;
  return _distCache = {list:[...by.values()].sort((a,b) => b.n - a.n), unnamed:unnamed};
}

function focusDistrict(d){
  state.filters.district = d || '';
  refresh(); renderDistrictRail();
  if(!mapReady) return;
  if(!d || d === NO_DISTRICT){ fitToResults(); return; }
  const r = districtStats().list.find(x => x.district === d);
  if(!r || r.w > r.e) return;
  let w = r.w, s2 = r.s, e = r.e, n = r.nn;
  if(e - w < 0.004){ w -= 0.004; e += 0.004; }
  if(n - s2 < 0.004){ s2 -= 0.004; n += 0.004; }
  map.fitBounds([[w,s2],[e,n]], {padding:56, maxZoom:15.5, duration:650});
}

function renderDistrictRail(){
  const host = $('#districtrail'); if(!host) return;
  const st = districtStats(); const cs = st.list;
  // One district is not a choice, and an edition whose records name none is not
  // a rail - the same rule the city rail follows.
  if(cs.length < 2){ host.innerHTML = ''; host.style.display = 'none'; return; }
  host.style.display = '';
  const cur = state.filters.district;
  const named = cs.reduce((a, c) => a + c.n, 0);
  const total = named + st.unnamed;
  /* The sentinel never reaches the DOM. It contains a NUL so it cannot collide
     with a real neighborhood name, and a NUL does not survive a round-trip
     through an HTML attribute — written into data-district it came back as
     something else and the bucket selected nothing at all. The bucket is marked
     with its own flag instead, and the handler maps that flag to the sentinel. */
  const chip = (val, label, n) => '<button class="citychip' + (cur === val ? ' on' : '')
    + '" ' + (val === NO_DISTRICT ? 'data-none="1"' : 'data-district="' + esc(val) + '"')
    + ' title="' + esc(label + ' \u2014 ' + fmtN(n)
    + ' records in this edition') + '">' + esc(label) + ' <i>' + fmtN(n) + '</i></button>';
  host.innerHTML = '<span class="raillabel">Districts</span>'
    + chip('', 'All', total)
    + cs.map(c => chip(c.district, c.district, c.n)).join('')
    + (st.unnamed ? chip(NO_DISTRICT, 'No district on the record', st.unnamed) : '')
    + '<span class="railnote">' + fmtN(cs.length) + ' named \u00b7 '
    + (st.unnamed
        ? fmtN(st.unnamed) + ' of ' + fmtN(total) + ' records carry no district'
        : 'every record carries one')
    + '</span>';
  $$('#districtrail .citychip').forEach(b =>
    b.addEventListener('click', () =>
      focusDistrict(b.dataset.none ? NO_DISTRICT : b.dataset.district)));
}

/* Both rails are computed from allListings(), NOT from the filtered set, so
   their content cannot change while somebody types in the search box. They were
   recomputed on every keystroke anyway - two full passes over the catalog per
   character, and cityStats additionally called price() on every record to fill
   a `prices` array nothing ever read.

   Measured on the largest shipped edition's record count (uscorridor, 354,260),
   median of five keystrokes: 402.6 ms before, 334.0 ms after - the rails were
   68 ms of it. The rest is refresh() and is a separate problem. The cache key
   is the catalog length, the same idiom allListings() itself uses: the only
   thing that grows the catalog is an import, and an import changes the length. */
let _cityCache = null, _cityCacheN = -1;
function cityStats(){
  const ls = allListings();
  if(_cityCache && _cityCacheN === ls.length) return _cityCache;
  const by = new Map();
  for(let i = 0; i < ls.length; i++){
    const l = ls[i];
    if(!l.city) continue;
    let r = by.get(l.city);
    if(!r){ r = {city:l.city, n:0, w:1e9, s:1e9, e:-1e9, nn:-1e9, sx:0, sy:0, gn:0}; by.set(l.city, r); }
    r.n++;
    if(typeof l.lng === 'number'){ if(l.lng < r.w) r.w = l.lng; if(l.lng > r.e) r.e = l.lng; }
    if(typeof l.lat === 'number'){ if(l.lat < r.s) r.s = l.lat; if(l.lat > r.nn) r.nn = l.lat; }
    /* The centroid of the records that actually say they are in this city - the
       only coordinate for a place name this platform is entitled to draw. It is
       not the city's civic centre and does not claim to be. */
    if(typeof l.lng === 'number' && typeof l.lat === 'number'){ r.sx += l.lng; r.sy += l.lat; r.gn++; }
  }
  _cityCacheN = ls.length;
  const out = [...by.values()].sort((a,b) => b.n - a.n);
  out.forEach(r => { if(r.gn){ r.cx = r.sx / r.gn; r.cy = r.sy / r.gn; } });
  return _cityCache = out;
}

function focusCity(city){
  state.filters.city = city || '';
  const sel = $('#fcity'); if(sel) sel.value = state.filters.city;
  refresh();
  renderCityRail(); renderDistrictRail();
  if(!mapReady) return;
  if(!city){ fitToResults(); return; }
  const r = cityStats().find(x => x.city === city);
  if(!r || r.w > r.e) return;
  let {w, s, e, nn:n} = r;
  if(e - w < 0.01){ w -= 0.01; e += 0.01; }
  if(n - s < 0.01){ s -= 0.01; n += 0.01; }
  map.fitBounds([[w,s],[e,n]], {padding:56, maxZoom:14.5, duration:650});
}

function renderCityRail(){
  const host = $('#cityrail'); if(!host) return;
  const cs = cityStats();
  // One city is not a choice; no rail rather than a rail that does nothing.
  if(cs.length < 2){ host.innerHTML=''; host.style.display='none'; return; }
  host.style.display='';
  const cur = state.filters.city;
  const total = cs.reduce((a,c) => a + c.n, 0);
  host.innerHTML = '<button class="citychip' + (cur ? '' : ' on') + '" data-city="">'
    + 'All cities <i>' + fmtN(total) + '</i></button>'
    + cs.map(c => '<button class="citychip' + (cur === c.city ? ' on' : '') + '" data-city="'
        + esc(c.city) + '" title="' + esc(c.city + ' — ' + fmtN(c.n) + ' records in this edition')
        + '">' + esc(c.city) + ' <i>' + fmtN(c.n) + '</i></button>').join('');
  /* The map draws one label per city, capped; the rail lists every city either
     way, so when the cap bites it is said here rather than left as a silent
     difference between two surfaces showing the same thing. */
  host.insertAdjacentHTML('beforeend', '<span class="railnote">' + fmtN(cs.length)
    + ' cities in this edition'
    + (cs.length > CITY_LABEL_CAP
        ? ' \u00b7 the map labels the ' + fmtN(CITY_LABEL_CAP) + ' largest' : '')
    + '</span>');
  $$('#cityrail .citychip').forEach(b =>
    b.addEventListener('click', () => focusCity(b.dataset.city)));
}

function fitToResults(){ const ls=filtered(); if(!ls.length) return; let w=1e9,s=1e9,e=-1e9,n=-1e9; ls.forEach(l=>{ w=Math.min(w,l.lng); e=Math.max(e,l.lng); s=Math.min(s,l.lat); n=Math.max(n,l.lat); }); if(e-w<0.01){ w-=0.01; e+=0.01; } if(n-s<0.01){ s-=0.01; n+=0.01; } map.fitBounds([[w,s],[e,n]],{padding:60, maxZoom:14, duration:600}); }

/* ---------------- filters & list ---------------- */
/* The Type filter's vocabulary, aligned to the screening classes in
   crosswalk/usecodes.json. It used to stop at four buckets - sfr, multi, condo,
   apt - which left three of the crosswalk's six classes unreachable: a search
   for hotels was impossible, and the 4,443 lodging records measured across the
   shipped editions (market/edition_scale.json) fell into "5+ units" or "2-4
   units" because a hotel has many units.

   This is a DISPLAY heuristic over each record's own `kind` string, not the
   crosswalk's measured code mapping. Where the two disagree the crosswalk wins;
   this exists so a class is reachable in the UI, not to establish what a parcel
   is. Two ordering decisions are load-bearing, both settled against measured
   labels rather than guessed:

     * student housing is tested BEFORE lodging. Onondaga County's `Room/dorm`
       code maps to student_housing in the crosswalk, and the corridor editions
       render it as "Inn, lodge, rooming or fraternity house - Room/dorm" - a
       label that opens with two lodging words and is not lodging.
     * lodging is tested BEFORE the unit-count rules, which is what makes hotels
       findable at all.

   One label stays genuinely ambiguous: the Bay Area's "Hotel / motel / MH park"
   (171 records) is a compound the crosswalk cannot resolve, because no Bay Area
   county is mapped yet. It reads as lodging here so the stock is findable; the
   first probe in docs/HOTEL_EXPANSION.md is the groupBy that settles it. */
const KIND_CLASSES = ['sfr','multi','condo','apt','lodging','student','mhp'];
function kindClass(l){
  const k=(l.kind||'').toLowerCase();
  if(/dorm|student|fraternit|sororit|rooming house/.test(k)) return 'student';
  if(/hotel|motel|\binn\b|lodge|resort|hospitality|tourist cabin/.test(k)) return 'lodging';
  if(/mobile home|manufactured home|trailer park|\bmh park\b/.test(k)) return 'mhp';
  if(/condo|townhouse|pud/.test(k)) return 'condo';
  if(/5\+|apartment/.test(k)) return 'apt';
  if((l.units||1)>1 || /unit|plex/.test(k)) return 'multi';
  return 'sfr';
}
function filtered(){
  const f=state.filters, q=f.q.trim().toLowerCase();
  const VW=(window.LXView&&window.LXView.active())? window.LXView : null;
  /* A chart drill-down can pin a set of ids; while a pin is live the map shows
     exactly those records and the map toolbar carries a Clear button. */
  const PIN=window.__lxPinned;
  /* The criteria chip: membership in the same match set the Underwriting tab
     computes (LXUW.matches) — ONE definition of "meets the Locator X criteria",
     never a second copy of it here. If the set cannot be computed the chip
     turns itself off out loud, because silently not applying a filter the user
     switched on would be a quiet pass. Records whose DSCR is unknown cannot
     pass a DSCR floor, so they are excluded while the chip is on — the chip's
     tooltip says so rather than hiding it. */
  let BB=null;
  if(f.chips.bb){
    try{ BB=new Set(window.LXUW.matches().map(r=>r.l.id)); }
    catch(e){
      f.chips.bb=false; BB=null;
      const c=document.querySelector('#chips .chip[data-f="bb"]');
      if(c) c.setAttribute('aria-pressed','false');
      toast('The Locator X criteria set could not be computed — chip cleared');
    }
  }
  return allListings().filter(l=>{
    if(BB && !BB.has(l.id)) return false;
    if(PIN && !PIN.has(l.id)) return false;
    if(VW && !VW.pass(l)) return false;
    if(f.county && l.county!==f.county) return false; if(f.city && l.city!==f.city) return false;
    if(f.district){ const dn=districtOf(l);
      if(f.district===NO_DISTRICT){ if(dn) return false; } else if(dn!==f.district) return false; }
    if(f.kind && kindClass(l)!==f.kind) return false; if(f.src && (f.src==='imp')!==(l.src==='imp')) return false;
    const P=price(l); if(f.min && P<+f.min) return false; if(f.max && P>+f.max) return false;
    if(q && !(`${l.addr} ${l.city} ${l.zip} ${l.nb||''} ${l.anb||''} ${l.kind}`.toLowerCase().includes(q))) return false;
    if(f.chips.star && !state.stars.has(l.id)) return false; if(f.chips.tour && !hasTour(l)) return false;
    if(f.chips.cf||f.chips.one){ const d=deal(l); if(!d) return false; if(f.chips.cf && d.cf<=0) return false; if(f.chips.one && d.one<1) return false; }
    return true;
  });
}
/* Sorting the full result set used to build an id-keyed dictionary of every
   record's deal first — a 302,612-key object on every list render.  Asking the
   comparator for each number instead trades that allocation for O(n log n)
   lookups, which is worse again at this size: a 302k sort makes some five
   million comparisons.  So the key is decorated once into a plain numeric
   array — one pass, one small allocation — and the sort then only compares
   numbers. */
function sorted(ls){
  const s=state.sort;
  const n=ls.length;
  if(s==='date'){
    const idx=new Array(n); for(let i=0;i<n;i++) idx[i]=i;
    idx.sort((x,y)=>(ls[y].priceDate||'').localeCompare(ls[x].priceDate||''));
    const out=new Array(n); for(let i=0;i<n;i++) out[i]=ls[idx[i]]; return out;
  }
  const key=new Float64Array(n);
  for(let i=0;i<n;i++){
    const l=ls[i];
    switch(s){
      case 'cap':   { const d=deal(l); key[i] = -(d? d.cap : -1e9); break; }
      case 'cf':    { const d=deal(l); key[i] = -(d? d.cf  : -1e9); break; }
      case 'ppsf':  { const d=deal(l); const p=d? d.ppsf : null; key[i] = (p||1e9); break; }
      case 'price':  key[i] =  price(l); break;
      case 'priced': key[i] = -price(l); break;
      default:       key[i] = i;
    }
  }
  const idx=new Array(n); for(let i=0;i<n;i++) idx[i]=i;
  idx.sort((x,y)=> key[x]-key[y] || x-y);
  const out=new Array(n); for(let i=0;i<n;i++) out[i]=ls[idx[i]];
  return out;
}
let listShown=250;
function renderList(more){
  if(!more) listShown=250;
  const all=sorted(filtered()); const ls=all.slice(0,listShown); const list=$('#list'); list.innerHTML='';
  let countLine=`${fmtN(all.length)} of ${fmtN(allListings().length)} properties`;
  if(state.filters.chips.bb && window.LXUW){
    try{ const b=LXUW.bb; countLine+=` · Locator X criteria: score ≥ ${b.minScore}, cap ≥ ${b.minCap}%, DSCR ≥ ${b.minDscr}, ≤ ${fmt$(b.maxPrice)} (set on the Underwriting tab)`; }catch(e){}
  }
  $('#count').textContent=countLine;
  const frag=document.createDocumentFragment();
  ls.forEach(l=>{ const d=deal(l); const el=document.createElement('div'); el.className='card'+(state.sel===l.id?' sel':''); el.setAttribute('role','listitem'); el.dataset.id=l.id;
    const badge = d ? (d.cf>0 ? `<span class="badge good">+${fmt$(d.cfMo)}/mo</span>` : `<span class="badge bad">${fmt$(d.cfMo)}/mo</span>`) : '';
    el.innerHTML=`<div class="price">${fmt$(price(l))}</div><div class="badge">${badge}</div><div class="addr">${esc(l.addr)}${l.src==='imp'?' <span class="badge imp">imported</span>':''}</div><button class="star ${state.stars.has(l.id)?'on':''}" title="Save" aria-label="Save">★</button><div class="meta">${esc(l.nb||l.anb||'')}${l.nb||l.anb?' · ':''}${esc(l.city)} · ${esc(l.kind)}${l.beds!=null?` · ${l.beds} bd`:''}${l.baths!=null?` ${l.baths} ba`:''}${l.sqft?` · ${fmtN(l.sqft)} sf`:''}${d?` · cap <span class="num">${fmtPct(d.cap)}</span>`:''}</div>`;
    el.addEventListener('click', e=>{ if(e.target.classList.contains('star')){ toggleStar(l.id); e.stopPropagation(); return; } select(l.id, true); });
    frag.appendChild(el); });
  list.appendChild(frag);
  if(all.length>listShown){ const b=document.createElement('button'); b.className='btn'; b.style.cssText='margin:10px 14px;display:block'; b.textContent=`Show more (${all.length-listShown} remaining)`; b.addEventListener('click', ()=>{ listShown+=500; renderList(true); }); list.appendChild(b); }
  /* The header's median price used to be recomputed — sort included — on every
     single renderList() call: every filter change, every map click, every
     assumption edit.  At 288,949 records that sort alone measured in the
     hundreds of milliseconds, for a number that only actually changes when the
     inventory itself changes (an import, a clear).  Cached on the same
     condition. */
  if(_hstatN !== allListings().length){
    _hstatN = allListings().length;
    _hstatMedian = median(allListings().map(price));
  }
  $('#hstat').innerHTML=`<b>${fmtN(BA.listings.length)}</b> public records · <b>${fmtN(state.imported.length)}</b> imported · median <b>${fmt$(_hstatMedian)}</b>`;
}
let _hstatN=-1, _hstatMedian=0;
function median(a){ const s=a.filter(x=>x>0).sort((x,y)=>x-y); return s.length? (s.length%2? s[(s.length-1)/2] : (s[s.length/2-1]+s[s.length/2])/2) : 0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
/* ---------------- source links ----------------
   Every listing's `src` field is a plain-English citation ("SF Assessor secured
   roll (DataSF wv5m-vpq2)...") — real, but not clickable. Two ways to turn one
   into a real URL, in order of trust:
   1. A short list of the largest, well-known agencies this app cites most,
      pointed at their actual public home page or dataset page — checked by
      hand, not guessed from a pattern.
   2. Every county/parish pull script writes its own source string with the
      literal hostname it pulled from in parentheses, e.g. "(gis.mcassessor.
      maricopa.gov)" or "(pub.sagis.org)" — extracted generically so every
      corridor and Louisiana edition gets a correct link with no per-county
      entry needed here.
   If neither matches, no link is shown — a wrong link is worse than none. */
const SRC_LINKS=[
  [/DataSF|SF Assessor/i, 'https://data.sfgov.org/d/wv5m-vpq2'],
  [/Alameda County Assessor/i, 'https://www.acgov.org/assessor/'],
  [/Santa Clara County/i, 'https://www.sccassessor.org/'],
  [/San Mateo County/i, 'https://www.smcacre.org/'],
  [/Zillow (Research|ZHVI|ZORI)|Zillow Research/i, 'https://www.zillow.com/research/data/'],
  [/HUD eGIS|FHA Single-Family REO/i, 'https://www.hud.gov/program_offices/housing/sfh/reo'],
];
function sourceUrl(src){
  if(!src || typeof src!=='string') return null;
  for(const [rx,url] of SRC_LINKS) if(rx.test(src)) return url;
  const m=src.match(/\(([a-z0-9.-]+\.(gov|org|com|us|edu))(?:[\/\s][^)]*)?\)/i);
  return m? 'https://'+m[1] : null;
}
function srcLine(l){ const s=l&&l.src; if(!s) return esc(s||'—'); const u=sourceUrl(s); return u? `<a href="${u}" target="_blank" rel="noopener">${esc(s)}</a>` : esc(s); }
function toggleStar(id){ state.stars.has(id)?state.stars.delete(id):state.stars.add(id); store('stars',[...state.stars]); refresh(); }
/* The map toolbar collapses behind a button at EVERY width, not just on phones.
   It used to be permanently open on desktop, which put thirteen controls -
   overlay, lens, basemap, colleges, towers, sectors and their legends - in a
   slab across the top-left of the map, covering the content they exist to
   annotate. A map you cannot see is not a better map for having more knobs.

   What did NOT change: every control stays in the DOM whether the panel is
   open or shut, so deep links, keyboard paths and the modules that write into
   #towerctl / #sectorctl / the legend spans keep working untouched - the same
   rule the grouped navigation follows. The panel is hidden with the `hidden`
   attribute rather than a class, so assistive technology agrees with the eye
   about whether it is there.

   The choice persists: open it once and it stays open for that browser, because
   someone working a lens all afternoon should not re-open it on every view
   change. */
(function mapToolsToggle(){
  const btn=document.getElementById('maptoggle'), box=document.getElementById('maptools');
  if(!btn||!box) return;
  const KEY='lx_maptools_open';
  let open=false;
  try{ open = localStorage.getItem(KEY)==='1'; }catch(e){}
  const paint=()=>{ box.hidden=!open; btn.setAttribute('aria-expanded', String(open));
                    btn.classList.toggle('on', open); };
  btn.addEventListener('click', ()=>{
    open=!open;
    try{ localStorage.setItem(KEY, open?'1':'0'); }catch(e){}
    paint();
  });
  // Escape shuts it, the way every transient panel on a map should behave.
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape' && open){ open=false;
      try{ localStorage.setItem(KEY,'0'); }catch(e2){}
      paint(); btn.focus(); }
  });
  paint();
})();

/* The Dashboard and the Deals table score the WHOLE edition; the map shows the
   filtered set. Both are deliberate - they are portfolio views with their own
   filters - but both leaded with "Every property on the map", which was simply
   false whenever a map filter was on: the map read 1,042 of 2,500 while the
   Dashboard scored all 2,500 and said the two were the same set.

   The copy now says what each view actually scores, and this states the
   relationship out loud whenever the two differ, rather than leaving a silent
   discrepancy between two screens. Saying which set you are looking at is the
   same rule the coverage lines follow everywhere else. */
function renderScopeNote(){
  const all = allListings().length, shown = filtered().length;
  const same = shown >= all;
  const msg = same
    ? ''
    : 'Scoring all ' + fmtN(all) + ' records in this edition. The map is filtered to '
      + fmtN(shown) + ' right now — this view deliberately scores the whole catalog, '
      + 'so the two counts differ.';
  ['#dashscope', '#dealscope'].forEach(sel => {
    const el = $(sel); if(!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  });
}

function refresh(){ renderScopeNote(); linkSync(); dealSync(); lensNote(); /* map layers owned by other modules follow the same filter as the pins */ try{ if(window.LX3D && LX3D.refreshTowers) LX3D.refreshTowers(); }catch(e){} dealsShown = DEALS_PAGE; lensInvalidate(); renderList(); if(mapReady) renderMarkers(); if(state.sel) renderDrawer(); if(window.LXDash && $('#dash').classList.contains('active')) window.LXDash.render(); }
/* The view, written into the URL fragment by src/permalink.js. Called from
   refresh() and from showView() because between them they cover every way the
   filters, the selection or the screen can change. Guarded: an edition built
   without the module still runs. */
function linkSync(){ try{ if(window.LXLINK) window.LXLINK.sync(); }catch(e){} }

/* The text fields fire on every character, and one pass costs 332 ms on the
   largest shipped edition's record count (354,260) - so typing a five-letter
   street name blocked the main thread for most of two seconds re-rendering
   results nobody had finished asking for. The filter STATE is still read
   synchronously, so nothing observes a stale value; only the expensive
   re-render waits for a pause in typing. The dropdowns are not debounced:
   picking one is a finished decision. */
const FILTER_DEBOUNCE_MS = 180;
let _filterTimer = null;
['q','fcounty','fcity','fkind','fsrc','fmin','fmax'].forEach(id=>$('#'+id).addEventListener('input', ()=>{ const f=state.filters; f.q=$('#q').value; f.county=$('#fcounty').value; f.city=$('#fcity').value; f.kind=$('#fkind').value; f.src=$('#fsrc').value; f.min=$('#fmin').value; f.max=$('#fmax').value; if(id==='fcounty') fillCities();
  const apply=()=>{ _filterTimer=null; refresh(); renderCityRail(); renderDistrictRail(); };
  const typed = id==='q' || id==='fmin' || id==='fmax';
  clearTimeout(_filterTimer);
  if(typed) _filterTimer=setTimeout(apply, FILTER_DEBOUNCE_MS); else apply();
}));
$$('#chips .chip').forEach(c=>c.addEventListener('click', ()=>{ const on=c.getAttribute('aria-pressed')!=='true'; c.setAttribute('aria-pressed', on); state.filters.chips[c.dataset.f]=on; refresh(); }));
$('#sort').addEventListener('change', e=>{ state.sort=e.target.value; renderList(); linkSync(); });
/* The filtered set as an interchange file. Handlers live here rather than in
   geoexport.js so the module stays a pure function of its arguments and can be
   tested without the DOM. */
['expgeo','expcsv'].forEach((id,i)=>{ const b=$('#'+id); if(b) b.addEventListener('click', ()=>{ if(!window.LXGEO) return; i? LXGEO.exportCSV() : LXGEO.exportGeoJSON(); }); });
function fillCities(){ const sel=$('#fcity'); const cur=sel.value; const cs=[...new Set(allListings().filter(l=>!state.filters.county||l.county===state.filters.county).map(l=>l.city))].sort(); sel.innerHTML='<option value="">All cities</option>'+cs.map(c=>`<option>${esc(c)}</option>`).join(''); sel.value=cs.includes(cur)?cur:''; state.filters.city=sel.value; }
function fillCounties(){ const cs=[...new Set(allListings().map(l=>l.county).filter(Boolean))].sort(); $('#fcounty').innerHTML='<option value="">All counties</option>'+cs.map(c=>`<option>${esc(c)}</option>`).join(''); fillCities(); renderCityRail(); renderDistrictRail(); /* imported records can introduce a city this edition had never heard of, and the    map's labels come from the records now, so they are rebuilt with them. */ if(mapReady) try{ addCityLabels(); zoomClass(); }catch(e){} }

/* ---------------- selection & drawer ---------------- */
function select(id, fly){ state.sel=id; const l=allListings().find(x=>x.id===id); if(!l) return; showView('mapview'); if(fly) map.flyTo({center:[l.lng,l.lat], zoom:Math.max(map.getZoom(),13.2), duration:700, padding:{right: window.innerWidth>900? 420 : 0}}); refresh(); const c=$(`.card[data-id="${id}"]`); if(c) c.scrollIntoView({block:'nearest'}); }
function closeDrawer(){ state.sel=null; $('#drawer').classList.remove('open'); refresh(); }
function spark(vals, w=380, h=56, cls=''){ const v=vals.filter(x=>x!=null); if(v.length<2) return ''; const min=Math.min(...v), max=Math.max(...v), rng=(max-min)||1; const pts=vals.map((x,i)=>x==null?null:[i/(vals.length-1)*(w-8)+4, h-6-(x-min)/rng*(h-14)]).filter(Boolean); const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' '); const lastP=pts[pts.length-1]; return `<svg class="spark ${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d} L${lastP[0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z" fill="var(--bay-soft)"/><path d="${d}" fill="none" stroke="var(--bay)" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="${lastP[0].toFixed(1)}" cy="${lastP[1].toFixed(1)}" r="3.5" fill="var(--bay)"/></svg>`; }
function hasTour(l){ return !!(l.tour==='sf'||l.tour==='eb'||(l.tourUrl&&l.tourUrl.length)||(l.panos&&l.panos.length)); }
function heroFor(l){ if(l.photo) return `<img src="${esc(l.photo)}" alt="">`; const p = l.panos&&l.panos.length ? l.panos[0] : (l.tour==='eb'? BA.panos.p6 : (l.tour==='sf'? BA.panos.p0 : null)); if(!p) return `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1d2c47,#2d4268);color:#9fb4d8;font-size:13px;text-align:center;padding:12px">No interior imagery on file for this record — try the Satellite view</div>`; return `<img src="${p}" alt="" style="object-position:50% 45%">`; }
const ESRI_TILE='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
function satTiles(lat,lng,z){ const n=Math.pow(2,z); const xf=(lng+180)/360*n; const latr=lat*Math.PI/180; const yf=(1-Math.log(Math.tan(latr)+1/Math.cos(latr))/Math.PI)/2*n; return {x:Math.floor(xf), y:Math.floor(yf), fx:xf-Math.floor(xf), fy:yf-Math.floor(yf)}; }
function satHero(l, host){ const z=18; const t=satTiles(l.lat,l.lng,z); let html='<div class="satgrid" style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);background:#0c1524">';
  let err=0, tot=0;
  const y0=t.fy<0.5? t.y-1 : t.y;
  for(let dy=0;dy<2;dy++) for(let dx=-1;dx<=1;dx++){ const u=ESRI_TILE.replace('{z}',z).replace('{y}',y0+dy).replace('{x}',t.x+dx); html+=`<img class="sattile" src="${u}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`; tot++; }
  const px=((1+t.fx)/3*100).toFixed(1), py=(((t.y-y0)+t.fy)/2*100).toFixed(1);
  html+=`</div><div style="position:absolute;left:${px}%;top:${py}%;transform:translate(-50%,-50%);width:14px;height:14px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 2px rgba(0,0,0,.55);pointer-events:none"></div><div style="position:absolute;left:8px;bottom:6px;font-size:10px;color:#fff;text-shadow:0 1px 2px #000;pointer-events:none">Imagery: Esri, Maxar, Earthstar Geographics</div>`;
  host.insertAdjacentHTML('afterbegin', `<div id="satwrap" style="position:absolute;inset:0;z-index:1">${html}</div>`);
  host.querySelectorAll('#satwrap .sattile').forEach(img=>{ img.addEventListener('error', ()=>{ err++; if(err>=tot){ const w=host.querySelector('#satwrap'); if(w) w.innerHTML='<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;background:#0c1524;color:#9fb2cc;font-size:12px">Satellite tiles could not load here. Pages hosted on claude.ai block outside imagery servers — open the downloaded locator.x file to see the Esri World Imagery closeup.</div>'; } }); });
}
function toggleSat(l){ const hero=$('#drawer .hero'); if(!hero) return; const w=hero.querySelector('#satwrap'); const b=$('#satbtn'); if(w){ w.remove(); if(b) b.textContent='Satellite'; } else { satHero(l, hero); if(b) b.textContent='Photo'; } }
function renderDrawer(){
  const l=allListings().find(x=>x.id===state.sel); const dr=$('#drawer'); if(!l){ dr.classList.remove('open'); return; }
  const d=deal(l), a=state.assump, mk=d.mk, o=state.overrides[l.id]||{};
  const verdict = d.cf>0 ? ['good','Asset — it pays you', `At these assumptions the property puts ${fmt$(d.cfMo)} a month in your pocket after the mortgage (DSCR ${d.dscr?d.dscr.toFixed(2):'—'}). The asset test is passed; now verify the rent with real comps.`] : d.dscr>=0.85 ? ['warn','Close — needs a lever', `Cash flow is ${fmt$(d.cfMo)} a month. A larger down payment, a seller carry, an ADU or a rent reset on turnover would flip it. Otherwise this is a bet on appreciation.`] : ['bad','Liability at this price', `The rent covers ${d.dscr?Math.round(d.dscr*100):0}% of the loan. You would feed it ${fmt$(-d.cfMo)} a month. Buy it only with a plan that changes the income, not the hope that rates fall.`];
  const facts = [['Type', l.kind],['Units', l.units],['Beds / baths', l.beds!=null? `${l.beds} / ${l.baths}`:'—'],['Living area', l.sqft? fmtN(l.sqft)+' sf':'—'],['Lot', l.lot? fmtN(l.lot)+' sf':'—'],['Year built', l.year||'—'],['Stories', l.stories||'—'],['Zoning', l.zoning||'—'],['Neighborhood', l.nb||l.anb||'—'],['ZIP', l.zip||'—'],['APN', l.apn||'—'],['Sale recorded', l.priceDate||'—'],['Assessed land', l.land? fmt$(l.land):'—'],['Assessed improvements', l.imp? fmt$(l.imp):'—'],['Owner-occupied', l.ownerOcc===true?'yes (exemption)': l.ownerOcc===false?'no':'—'],['Status', l.status||'Sold (public record)']];
  const CT={'A':'A — steel frame','B':'B — reinforced concrete','C':'C — masonry','D':'D — wood frame'};
  try{ const bm=window.LXBM&&LXBM.assess(l);
    if(bm){ facts.push(['Below-market index', bm.idx+(bm.hard?' — backed by a sale or $/sf comps':' — assessed-basis signal only (tenure, not a discount)')]);
      const sp=bm.parts.find(p=>p.k==='sale'); if(sp) facts.push(['Recorded sale vs ZIP typical', sp.pct.toFixed(0)+'% under']);
      const qp=bm.parts.find(p=>p.k==='ppsf'); if(qp) facts.push(['Price per sq ft vs city median', qp.pct.toFixed(0)+'% under']); }
    const up=window.LXBM&&LXBM.upgrades(l);
    if(up&&up.unlocked>0) facts.push(['Upgrade upside (top 3 plays)', fmt$(up.unlocked)]);
  }catch(e){}
  if(l.ctype) facts.push(['Construction type', CT[l.ctype]||l.ctype]);
  if(l.front) facts.push(['Lot frontage', l.front+' ft']);
  if(l.depth) facts.push(['Lot depth', l.depth+' ft']);
  if(l.bsmt) facts.push(['Basement area', fmtN(l.bsmt)+' sf']);
  if(l.dist2) facts.push(['Supervisor district', l.dist2]);
  if(l.tra) facts.push(['Tax rate area', l.tra]);
  if(l.exv) facts.push(['Other exemption value', fmt$(l.exv)]);
  if(l.netv) facts.push(['Total net assessed value', fmt$(l.netv)]);
  if(l.absent) facts.push(['Absentee owner', 'yes — tax bill mails to a different ZIP']);
  dr.innerHTML=`<div class="dhead"><div><div class="eyebrow">${esc(l.city)} · ${esc(l.county)} County</div><h2>${esc(l.addr)}</h2><div style="color:var(--muted);font-size:12px;margin-top:2px">${l.src==='imp'?'Imported listing': l.est? 'Public parcel record · price = ZIP-level Zillow ZHVI ESTIMATE (county publishes no assessed values)' : 'Public record · price = post-sale assessed value'}${l.approx?' · location approximate (ZIP centroid)':''}</div></div><div style="margin-left:auto;display:flex;gap:6px;flex:none"><button class="iconbtn" id="dresearch" title="Run the research agents">Research</button><button class="iconbtn" id="dwalk" title="Drop into the walkable twin at this address">Walk here</button><button class="iconbtn" id="dclose" aria-label="Close">✕</button></div></div>
  <div class="dbody">
    ${(()=>{ try{ const g=window.LXEvid&&LXEvid.grade(l); if(!g) return '';
      const c=LXEvid.col(g.band);
      const miss=g.missing.length? '<div style="font-size:11.5px;color:var(--muted);margin-top:3px">This source does not publish '+g.missing.map(t=>esc(t[3])).join(', ')+'.</div>' : '<div style="font-size:11.5px;color:var(--muted);margin-top:3px">This source publishes every field the grade tests for.</div>';
      const ceil=g.zoningOnly? '<div style="font-size:11.5px;color:var(--warn);margin-top:3px">Selected by <b>zoning, not use</b> — the district permits this, which is not evidence that it stands here.</div>'
              : g.unclassified? '<div style="font-size:11.5px;color:var(--warn);margin-top:3px">The source publishes <b>no use class at all</b> for this parcel; it is here on location alone.</div>' : '';
      return '<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 12px;border-bottom:1px solid var(--line)">'
        +'<div style="flex:none;width:30px;height:30px;border-radius:6px;background:'+c+';color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px">'+g.band+'</div>'
        +'<div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:600">Evidence '+g.band+' — '+esc(g.label)+' <span style="color:var(--muted);font-weight:400">('+g.score+'/100)</span></div>'
        +miss+ceil+'</div></div>'; }catch(e){ return ''; } })()}
    ${(()=>{ const bits=[];
      /* The projCo/projKm fields are baked into the parcel data at build time and
         therefore know nothing about what has happened to the project since. Three
         Louisiana projects in this layer have been cancelled or closed outright, so
         a parcel whose baked neighbour is Air Products' Burnside complex would
         otherwise advertise $4.5bn of capital that was written off on 2026-06-30.
         Cross-reference the live project layer before saying a word about it. */
      if(l.projCo){
        let dead=null, atRisk=null;
        try{ const rec=(window.LXCORP||[]).find(x=>x.company===l.projCo);
             if(rec&&rec.dead) dead=rec; else if(rec&&rec.atRisk) atRisk=rec; }catch(e){}
        const where=(l.projKm!=null?l.projKm.toFixed(1)+' km away':'nearby');
        if(dead) bits.push('<b>'+esc(l.projCo)+'</b> \u2014 the project '+where
          +' was <b style="color:var(--bad)">cancelled or closed</b>. It is carried here as evidence and '
          +'contributes <b>nothing</b> to any score on this page.');
        else if(atRisk) bits.push('<b>'+esc(l.projCo)+'</b> announced project '+where
          +(l.projJobs?' \u2014 '+fmtN(l.projJobs)+' announced jobs':'')
          +' <span style="color:var(--warn)">\u2014 at risk; weighted at half</span>');
        else bits.push('<b>'+esc(l.projCo)+'</b> announced project '+where+(l.projJobs?' \u2014 '+fmtN(l.projJobs)+' announced jobs':''));
      }
      /* and a cancelled project the baked field never mentioned, found live */
      try{ const nr=window.LXCorp&&LXCorp.nearest(l);
        if(nr&&nr.dead&&nr.deadKm<=25&&nr.dead.company!==l.projCo)
          bits.push('<b>'+esc(nr.dead.company)+'</b> \u2014 a cancelled or closed project '
            +nr.deadKm.toFixed(1)+' km away'
            +(nr.dead.investment?' ('+LXCorp.fmt$(nr.dead.investment)+' withdrawn)':'')
            +'. Shown because a corridor that lost capital is not the same corridor.');
      }catch(e){}
      if(l.campName) bits.push('<b>'+esc(l.campName)+'</b> '+(l.campKm!=null?l.campKm.toFixed(1)+' km away':'nearby')+(l.campEnroll?' — '+fmtN(l.campEnroll)+' enrolled':''));
      if(!bits.length) return '';
      return '<div class="sect"><p class="eyebrow" style="margin:0 0 4px">What is nearby</p>'
        +'<div style="font-size:12.5px;line-height:1.7">'+bits.join('<br>')+'</div>'
        +'<p style="font-size:11.5px;color:var(--muted);margin:5px 0 0">Straight-line distance. An announced project is an intention with a date and a source, never a forecast of delivered jobs; enrolment carries the term it was published for.</p></div>'; })()}
    ${(()=>{ try{ return window.LXPropTime? LXPropTime.drawer(l,{score:false}) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{ return window.LXComps? LXComps.drawer(l) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{ return window.LXRooms? LXRooms.drawer(l) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{ return window.LXAR? LXAR.drawer(l) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{ return window.LXSources? LXSources.drawer(l) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{ return window.LXReo? LXReo.drawer(l) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{
      if(!window.LXStdViz || !window.LXUW) return '';
      const fin={id:'conv',name:'Conventional investor',down:state.assump.down,rate:state.assump.rate,mi:0};
      const uwx=LXUW.underwrite(l,{offer:d.P, rehab:0, cont:10, rentMo:d.rentMo, finOpt:fin});
      return LXStdViz.drawer(l, uwx);
    }catch(e){ return ''; } })()}
    ${(()=>{ try{
      if(!window.LXOutlookViz || !window.LXUW) return '';
      /* underwrite at the numbers already on this card - the drawer's own price
         and rent, overrides included - so the outlook describes what the reader
         is looking at rather than a second, different deal */
      const fin={id:'conv',name:'Conventional investor',down:state.assump.down,rate:state.assump.rate,mi:0};
      const uu={offer:d.P, rehab:0, cont:10, rentMo:d.rentMo, finOpt:fin};
      const uwx=LXUW.underwrite(l,uu);
      return LXOutlookViz.block(l,uu,uwx,{sect:true});
    }catch(e){ return ''; } })()}
    <div class="hero" style="position:relative">${heroFor(l)}<button class="tourbtn" id="tourbtn" style="z-index:2">${hasTour(l)?'Tour inside · 360°':'No tour available'}</button><button class="tourbtn" id="satbtn" style="z-index:2;left:auto;right:12px;background:#233047">Satellite</button></div>
    <div class="kpis">
      <div class="kpi"><div class="v">${fmt$(d.P)}</div><div class="l">Price${o.price?' (yours)':''}</div></div>
      <div class="kpi ${d.cap>=5.5?'good':d.cap>=4?'warn':'bad'}"><div class="v">${fmtPct(d.cap)}</div><div class="l">Cap rate</div></div>
      <div class="kpi ${d.cf>0?'good':'bad'}"><div class="v">${(d.cfMo>0?'+':'')+fmt$(d.cfMo)}</div><div class="l">Cash flow / mo</div></div>
      <div class="kpi"><div class="v">$${fmtN(d.rentMo)}</div><div class="l">Est. rent / mo</div></div>
      <div class="kpi ${d.coc>0?'good':'bad'}"><div class="v">${fmtPct(d.coc)}</div><div class="l">Cash-on-cash</div></div>
      <div class="kpi ${d.dscr>=1.2?'good':d.dscr>=1?'warn':'bad'}"><div class="v">${d.dscr?d.dscr.toFixed(2):'—'}</div><div class="l">DSCR</div></div>
    </div>
    <div class="verdict ${verdict[0]}"><div><b>${verdict[1]}</b><p>${verdict[2]}</p></div></div>
    <div class="sec"><h3>Your numbers</h3><div class="assump">
      <label>Price <input type="number" id="o_price" value="${o.price||''}" placeholder="${d.P}"></label>
      <label>Rent / mo <input type="number" id="o_rent" value="${o.rent||''}" placeholder="${d.rentMo}"></label>
      <label>Down % <input type="number" id="a_down" value="${a.down}" step="1"></label>
      <label>Rate % <input type="number" id="a_rate" value="${a.rate}" step="0.125"></label>
      <label>Vacancy % <input type="number" id="a_vacancy" value="${a.vacancy}"></label>
      <label>Management % <input type="number" id="a_mgmt" value="${a.mgmt}"></label>
      <label>Maint. % of rent <input type="number" id="a_maint" value="${a.maint}"></label>
      <label>CapEx % of rent <input type="number" id="a_capex" value="${a.capex}"></label>
      <label>Insurance % price/yr <input type="number" id="a_ins" value="${a.ins}" step="0.05"></label>
      <label>Tax rate % (${l.county}: ${taxRate(l)}) <input type="number" id="a_taxOverride" value="${a.taxOverride}" placeholder="county default" step="0.01"></label>
      <label>HOA $/mo <input type="number" id="a_hoa" value="${a.hoa}" placeholder="${d.hoa/12}"></label>
      <label>Appreciation %/yr <input type="number" id="a_appr" value="${a.appr}" placeholder="${d.appr.toFixed(1)} (ZIP 1-yr)" step="0.5"></label>
      <label>Income method <select id="a_rentMethod"><option value="yield" ${a.rentMethod==='yield'?'selected':''}>Long-term: ZIP rent-to-value × price</option><option value="beds" ${a.rentMethod==='beds'?'selected':''}>Long-term: typical rent × bedrooms</option><option value="rooms" ${a.rentMethod==='rooms'?'selected':''}>Co-living: rent by the room</option><option value="bed" ${a.rentMethod==='bed'?'selected':''}>Student housing: rent by the bed</option><option value="str" ${a.rentMethod==='str'?'selected':''}>Short-term rental (regulation-adjusted)</option><option value="fmr" ${a.rentMethod==='fmr'?'selected':''}>Section 8: HUD Fair Market Rent</option></select></label>
      <label>Loan term (yrs) <input type="number" id="a_term" value="${a.term}"></label>
    </div><div class="src">Rent basis: ${esc(d.rentHow)}. Market source: ${mk.src?srcLine({src:mk.src}):esc(mk.src)}. Assumptions apply to every property; price and rent overrides apply to this one.</div></div>
    <div class="sec"><h3>Annual pro forma</h3><table class="pl">
      <tr><td>Gross rent</td><td>${fmtFull(d.rent)}</td></tr><tr><td>Vacancy (${a.vacancy}%)</td><td>−${fmtFull(d.vac)}</td></tr>
      <tr><td>Property tax (${taxRate(l)}%)</td><td>−${fmtFull(d.tax)}</td></tr><tr><td>Insurance</td><td>−${fmtFull(d.ins)}</td></tr><tr><td>Maintenance + CapEx</td><td>−${fmtFull(d.maint+d.capex)}</td></tr><tr><td>Management</td><td>−${fmtFull(d.mgmt)}</td></tr>${d.hoa?`<tr><td>HOA</td><td>−${fmtFull(d.hoa)}</td></tr>`:''}
      <tr class="total"><td>Net operating income</td><td>${fmtFull(d.noi)}</td></tr>
      <tr><td>Debt service (${fmt$(d.loan)} @ ${a.rate}%, ${a.term} yr)</td><td>−${fmtFull(d.ds)}</td></tr>
      <tr class="total"><td>Cash flow</td><td class="${d.cf>0?'pos':'neg'}">${fmtFull(d.cf)}</td></tr>
      <tr><td>Cash to close (${a.down}% + ${a.closing}%)</td><td>${fmtFull(d.cash)}</td></tr>
      <tr><td>GRM · $/sf · 1% rule</td><td>${d.grm.toFixed(1)} · ${d.ppsf?'$'+fmtN(d.ppsf):'—'} · ${fmtPct(d.one,2)}</td></tr>
    </table></div>
    <div class="sec"><h3>Five-year view (${d.appr.toFixed(1)}% appreciation, ${a.rentGrowth}% rent growth)</h3><table class="pl"><tr><td style="color:var(--muted)">Year</td><td style="color:var(--muted)">Value · Equity · Cash flow</td></tr>${d.proj.map(p=>`<tr><td>${p.y}</td><td>${fmt$(p.value)} · ${fmt$(p.equity)} · <span class="${p.cf>0?'pos':'neg'}">${fmt$(p.cf)}</span></td></tr>`).join('')}</table></div>
    <div class="sec"><h3>Market context</h3>
      ${mk.zv? `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)"><span>ZIP ${l.zip} typical value</span><span class="num">${fmt$(last(mk.zv))} · ${mk.yoy!=null?(mk.yoy>0?'+':'')+mk.yoy.toFixed(1)+'% 1-yr':''}</span></div>${spark(mk.zv)}`:''}
      ${mk.zr? `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-top:8px"><span>ZIP ${l.zip} typical rent</span><span class="num">$${fmtN(last(mk.zr))}/mo · yield ${fmtPct(last(mk.zr)*12/last(mk.zv)*100)}</span></div>${spark(mk.zr)}`:''}
      ${mk.nbv? `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-top:8px"><span>${esc(l.nb)} typical value</span><span class="num">${fmt$(last(mk.nbv))}</span></div>${spark(mk.nbv)}`:''}
    </div>
    <div class="sec"><h3>Property facts</h3><div class="facts">${facts.map(f=>`<div><span>${f[0]}</span><span>${esc(f[1])}</span></div>`).join('')}</div>
    ${(()=>{ try{ return window.LXPat? LXPat.compsHTML(l) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{ const c=window.LXCampus&&LXCampus.suitability(l); if(!c) return '';
        return `<div class="sec" style="margin-top:12px"><h3>Campus demand</h3><div class="facts"><div><span>Nearest campus</span><span>${esc(c.campus.name)}</span></div><div><span>Distance</span><span>${c.km.toFixed(1)} km${c.km<=1.6?' — walkable':c.km<=4.8?' — bike or shuttle':''}</span></div><div><span>Enrolled (${esc(c.campus.term||'term n/a')})</span><span>${fmtN(c.campus.enroll)}</span></div><div><span>Student-housing fit</span><span>${c.score}/100</span></div></div><div class="src">Enrollment is the published headcount for the term shown. Proximity is a demand hypothesis to test against documented rent, not a rent premium — and it says nothing about whether leasing by the bed is permitted at this address.</div></div>`; }catch(e){ return ''; } })()}
    ${(()=>{ try{ return window.LXWalk? LXWalk.sheetHTML(l) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{ return window.LXRebuild? LXRebuild.sheetHTML(l) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{ return window.LXRecon? LXRecon.sheetHTML(l) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{ return window.LXRec? LXRec.lockerHTML(l) : ''; }catch(e){ return ''; } })()}
    ${(()=>{ try{ const n=window.LXCorp&&LXCorp.nearest(l); if(!n||n.km>40) return '';
        return `<div class="sec" style="margin-top:12px"><h3>Announced corporate project nearby</h3><div class="facts"><div><span>Project</span><span>${esc(n.p.company)} — ${esc(n.p.project||'')}</span></div><div><span>Location</span><span>${esc(n.p.city)}, ${esc(n.p.state)}${n.p.geo==='city'?' (city-level placement)':''}</span></div><div><span>Distance</span><span>${n.km.toFixed(1)} km</span></div><div><span>Announced capital</span><span>${n.p.investment?LXCorp.fmt$(n.p.investment):'not disclosed'}</span></div><div><span>Announced jobs</span><span>${n.p.jobs?fmtN(n.p.jobs):'not disclosed'}</span></div><div><span>Announced</span><span>${esc(n.p.announced||'—')}${n.p.status?' · '+esc(n.p.status):''}</span></div></div><div class="src">Announcements are intentions, not construction, and announced capital and headcounts routinely change or lapse. ${n.p.source?`<a href="${esc(n.p.source)}" target="_blank" rel="noopener">Source ↗</a>`:''}</div></div>`; }catch(e){ return ''; } })()}
    ${l.url?`<p style="margin:10px 0 0"><a href="${esc(l.url)}" target="_blank" rel="noopener">Open original listing ↗</a></p>`:''}
    <div class="src">Source: ${l.src==='imp'?esc(l.srcName||'your import'):srcLine(l)}.${l.src!=='imp'?' Under Proposition 13 the assessed value after a change of ownership equals the purchase price, so this is what the buyer paid; the land/improvement split is the assessor\'s allocation.':''} ${l.tour==='sf'||l.tour==='eb'?'Interior tour is a representative 360° set for this property type, not photos of this address.':''}</div></div>
  </div>`;
  dr.classList.add('open');
  $('#dclose').addEventListener('click', closeDrawer);
  $('#dresearch').addEventListener('click', ()=>{ if(window.LXResearch){ window.LXResearch.subjectFrom(l); showView('research'); } });
  { const wb=$('#dwalk'); if(wb) wb.addEventListener('click', ()=>{ if(window.LXWalk) LXWalk.walkTo(l); }); }
  try{ if(window.LXWalk) LXWalk.bindSheet(l); }catch(e){}
  try{ if(window.LXRebuild) LXRebuild.bindSheet(l); }catch(e){}
  try{ if(window.LXRecon) LXRecon.bindSheet(l); }catch(e){}
  try{ if(window.LXRec) LXRec.bind(l); }catch(e){}
  $('#tourbtn').addEventListener('click', ()=>openTour(l));
  $('#satbtn').addEventListener('click', ()=>toggleSat(l));
  ['down','rate','vacancy','mgmt','maint','capex','ins','taxOverride','hoa','appr','term','rentMethod'].forEach(k=>{ const el=$('#a_'+k); el.addEventListener('change', ()=>{ const v=el.value; state.assump[k]= (k==='rentMethod')? v : (v===''? '' : +v); saveAssump(); refresh(); }); });
  ['price','rent'].forEach(k=>{ const el=$('#o_'+k); el.addEventListener('change', ()=>{ const v=el.value; const ov=state.overrides[l.id]||{}; if(v==='') delete ov[k]; else ov[k]=+v; state.overrides[l.id]=ov; store('overrides', state.overrides); dealBump(); refresh(); }); });
}

/* ---------------- 360 tour (WebGL) ---------------- */
const ROOMS = {sf:[['Living room','p0'],['Kitchen','p1'],['Primary bedroom','p2'],['Bathroom','p3'],['In-law unit','p4'],['Backyard','p5']], eb:[['Living room','p6'],['Kitchen','p7'],['Primary bedroom','p8'],['Bathroom','p9'],['Garage / office','p10'],['Backyard','p11']]};
const tour = {gl:null, prog:null, tex:null, yaw:0, pitch:0, fov:72, drag:null, auto:true, raf:0, rooms:[], idx:0, open:false};
function glInit(){ const cv=$('#tourcv'); const gl=cv.getContext('webgl',{antialias:false, preserveDrawingBuffer:false}); if(!gl) return false; tour.gl=gl;
  const vs=`attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}`;
  const fs=`precision highp float;varying vec2 v;uniform sampler2D t;uniform float yaw,pitch,fov,aspect;void main(){float f=tan(fov*0.5);vec3 d=normalize(vec3(v.x*f*aspect,v.y*f,-1.0));float cp=cos(pitch),sp=sin(pitch);d=vec3(d.x,d.y*cp-d.z*sp,d.y*sp+d.z*cp);float cy=cos(yaw),sy=sin(yaw);d=vec3(d.x*cy+d.z*sy,d.y,-d.x*sy+d.z*cy);float u=atan(d.x,-d.z)/6.2831853+0.5;float vv=0.5-asin(clamp(d.y,-1.,1.))/3.1415927;gl_FragColor=texture2D(t,vec2(u,vv));}`;
  const sh=(ty,src)=>{ const s=gl.createShader(ty); gl.shaderSource(s,src); gl.compileShader(s); return s; };
  const pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(pr); gl.useProgram(pr); tour.prog=pr;
  const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW); const loc=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  tour.tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tour.tex); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  tour.u={yaw:gl.getUniformLocation(pr,'yaw'), pitch:gl.getUniformLocation(pr,'pitch'), fov:gl.getUniformLocation(pr,'fov'), aspect:gl.getUniformLocation(pr,'aspect')};
  return true; }
function glLoad(src){ const img=new Image(); img.crossOrigin='anonymous'; img.onload=()=>{ const gl=tour.gl; gl.bindTexture(gl.TEXTURE_2D,tour.tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false); try{ gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img); tour.ready=true; }catch(e){ $('#tournote').textContent='This image could not be used by WebGL (cross-origin). Host it with CORS headers or embed it.'; } }; img.onerror=()=>{ $('#tournote').textContent='Panorama could not be loaded. Inside claude.ai only embedded images load; open the downloaded file for images by URL.'; $('#tournote').classList.remove('hidden'); }; img.src=src; }
function glDraw(){ if(!tour.open) return; const gl=tour.gl, cv=gl.canvas; const w=cv.clientWidth*devicePixelRatio, h=cv.clientHeight*devicePixelRatio; if(cv.width!==w||cv.height!==h){ cv.width=w; cv.height=h; gl.viewport(0,0,w,h); }
  if(tour.auto && !tour.drag) tour.yaw+=0.0012; gl.uniform1f(tour.u.yaw,tour.yaw); gl.uniform1f(tour.u.pitch,tour.pitch); gl.uniform1f(tour.u.fov,tour.fov*Math.PI/180); gl.uniform1f(tour.u.aspect,w/h); if(tour.ready) gl.drawArrays(gl.TRIANGLES,0,3); tour.raf=requestAnimationFrame(glDraw); }
function openTour(l){ if(!hasTour(l)){ toast('No tour attached to this property'); return; }
  const t=$('#tour'); t.classList.add('open'); tour.open=true; $('#tourtitle').textContent=l.addr+', '+l.city; $('#tournote').textContent=''; $('#tournote').classList.add('hidden');
  const cv=$('#tourcv'), fr=$('#tourframe');
  if(l.panos&&l.panos.length){ tour.rooms=l.panos.map((u,i)=>['View '+(i+1),u]); }
  else if(l.tour==='sf'||l.tour==='eb'){ tour.rooms=ROOMS[l.tour].map(([n,k])=>[n,BA.panos[k]]); $('#tournote').textContent='Representative 360° rooms for this property type — generated illustrations, not photographs of this address. Attach your own tour in Your data.'; $('#tournote').classList.remove('hidden'); }
  else { tour.rooms=[]; }
  if(tour.rooms.length){ cv.classList.remove('hidden'); fr.classList.add('hidden'); fr.src='about:blank'; if(!tour.gl && !glInit()){ $('#tournote').textContent='WebGL is unavailable in this browser.'; $('#tournote').classList.remove('hidden'); return; } showRoom(0); tour.raf=requestAnimationFrame(glDraw); }
  else { cv.classList.add('hidden'); fr.classList.remove('hidden'); fr.src=l.tourUrl[0]; $('#rooms').innerHTML=''; $('#tournote').textContent='Third-party tour opened in a frame. If it stays blank the provider blocks embedding inside this host — use the link in the property facts.'; $('#tournote').classList.remove('hidden'); }
}
function showRoom(i){ tour.idx=i; tour.ready=false; tour.yaw=0; tour.pitch=0; tour.fov=72; glLoad(tour.rooms[i][1]); $('#rooms').innerHTML=tour.rooms.map((r,j)=>`<button aria-pressed="${j===i}">${esc(r[0])}</button>`).join(''); $$('#rooms button').forEach((b,j)=>b.addEventListener('click',()=>showRoom(j))); }
function closeTour(){ tour.open=false; cancelAnimationFrame(tour.raf); $('#tour').classList.remove('open'); $('#tourframe').src='about:blank'; }
$('#tourclose').addEventListener('click', closeTour);
(function(){ const cv=$('#tourcv'); let lastT=0;
  cv.addEventListener('pointerdown', e=>{ tour.drag={x:e.clientX,y:e.clientY,yaw:tour.yaw,pitch:tour.pitch}; cv.setPointerCapture(e.pointerId); tour.auto=false; });
  cv.addEventListener('pointermove', e=>{ if(!tour.drag) return; const k=tour.fov/cv.clientWidth*Math.PI/180; tour.yaw=tour.drag.yaw-(e.clientX-tour.drag.x)*k; tour.pitch=clamp(tour.drag.pitch+(e.clientY-tour.drag.y)*k,-1.4,1.4); });
  cv.addEventListener('pointerup', ()=>{ tour.drag=null; }); cv.addEventListener('pointercancel', ()=>{ tour.drag=null; });
  cv.addEventListener('wheel', e=>{ e.preventDefault(); tour.fov=clamp(tour.fov+e.deltaY*0.05,35,110); }, {passive:false});
  document.addEventListener('keydown', e=>{ if(!tour.open) return; if(e.key==='Escape') closeTour(); if(e.key==='ArrowRight' && tour.rooms.length) showRoom((tour.idx+1)%tour.rooms.length); if(e.key==='ArrowLeft' && tour.rooms.length) showRoom((tour.idx-1+tour.rooms.length)%tour.rooms.length); });
})();

/* ---------------- deals page ---------------- */
const DCOLS=[['addr','Property'],['city','City'],['kind','Type'],['P','Price','r'],['rentMo','Rent/mo','r'],['gross','Gross yield','r'],['cap','Cap rate','r'],['cfMo','Cash flow/mo','r'],['coc','Cash-on-cash','r'],['dscr','DSCR','r'],['ppsf','$/sf','r'],['grm','GRM','r'],['yoy','ZIP 1-yr','r'],['priceDate','Sale date']];
let dsort={k:'cap',dir:-1};
/* The table used to offer "Show all N rows", which wrote every row of the
   result set into the DOM in one go.  At 161,000 rows that hangs the tab and at
   302,612 it kills it outright, so the control now extends the table by a
   bounded page each time and the full set is exported, not rendered. */
const DEALS_PAGE = 400, DEALS_MAX_DOM = 5000;
let dealsShown = DEALS_PAGE;
function dealRows(){
  const q=($('#dq').value||'').toLowerCase(), s=$('#dsrc').value;
  /* Filter and underwrite in ONE pass, writing the two extra fields onto the
     deal object rather than Object.assign-ing it into a fresh one. On a
     300k-record edition the copy was a second full set of objects for nothing. */
  const src=allListings(), out=[];
  for(let i=0;i<src.length;i++){
    const l=src[i];
    if(s==='imp'&&l.src!=='imp') continue;
    if(s==='pub'&&l.src==='imp') continue;
    if(s==='star'&&!state.stars.has(l.id)) continue;
    if(q && !`${l.addr} ${l.city} ${l.zip} ${l.nb||''} ${l.kind}`.toLowerCase().includes(q)) continue;
    const d=deal(l)||{};
    d.l=l; d.yoy=d.mk?d.mk.yoy:null;
    out.push(d);
  }
  return out;
}
function renderDeals(){
  const rows=dealRows(); const k=dsort.k; rows.sort((a,b)=>{ const va=k in a? a[k] : a.l[k], vb=k in b? b[k] : b.l[k]; if(va==null) return 1; if(vb==null) return -1; return (typeof va==='string'? va.localeCompare(vb) : va-vb)*dsort.dir; });
  $('#dealtable thead').innerHTML='<tr>'+DCOLS.map(c=>`<th class="${c[2]||''}" data-k="${c[0]}">${c[1]}${dsort.k===c[0]?(dsort.dir>0?' ↑':' ↓'):''}</th>`).join('')+'</tr>';
  const shown=rows.slice(0, Math.min(dealsShown, rows.length));
  $('#dealtable tbody').innerHTML=shown.map(r=>`<tr class="clickable" data-id="${r.l.id}"><td>${state.stars.has(r.l.id)?'★ ':''}${esc(r.l.addr)}</td><td>${esc(r.l.city)}</td><td>${esc(r.l.kind)}</td><td class="r">${fmt$(r.P)}</td><td class="r">$${fmtN(r.rentMo)}</td><td class="r">${fmtPct(r.gross)}</td><td class="r">${fmtPct(r.cap)}</td><td class="r ${r.cfMo>0?'pos':'neg'}">${fmt$(r.cfMo)}</td><td class="r">${fmtPct(r.coc)}</td><td class="r">${r.dscr?r.dscr.toFixed(2):'—'}</td><td class="r">${r.ppsf?'$'+fmtN(r.ppsf):'—'}</td><td class="r">${r.grm?r.grm.toFixed(1):'—'}</td><td class="r ${r.yoy>0?'pos':r.yoy<0?'neg':''}">${r.yoy!=null?(r.yoy>0?'+':'')+r.yoy.toFixed(1)+'%':'—'}</td><td>${esc(r.l.priceDate||'')}</td></tr>`).join('') + (rows.length>shown.length
      ? `<tr><td colspan="14"><button class="btn" id="dealsmore">Show ${fmtN(Math.min(DEALS_PAGE, rows.length-shown.length))} more</button>`
        + `<span style="margin-left:10px;font-size:12px;color:var(--muted)">${fmtN(shown.length)} of ${fmtN(rows.length)} shown`
        + (shown.length>=DEALS_MAX_DOM ? ' — the table stops here to keep the page responsive; use Download CSV for the whole set.' : '')
        + `</span></td></tr>`
      : '');
  const dm=$('#dealsmore'); if(dm){
    if(shown.length>=DEALS_MAX_DOM){ dm.disabled=true; dm.title='Use Download CSV to take the full result set away with you.'; }
    else dm.addEventListener('click', ()=>{ dealsShown += DEALS_PAGE; renderDeals(); });
  }
  $$('#dealtable th').forEach(th=>th.addEventListener('click', ()=>{ const kk=th.dataset.k; dsort = dsort.k===kk? {k:kk,dir:-dsort.dir} : {k:kk, dir: ['addr','city','kind','priceDate'].includes(kk)?1:-1}; renderDeals(); }));
  $$('#dealtable tbody tr').forEach(tr=>tr.addEventListener('click', ()=>select(tr.dataset.id, true)));
  /* The four summary tiles used to be built like this:
         const all = allListings().map(l => deal(l)).filter(Boolean);
     ...which underwrites every record in the edition a SECOND time - `rows`
     above already holds exactly those results - and then walked the new array
     four more times with .map() to take four medians. On the 302,612-record
     corridor edition that is roughly 1.5 million objects and array slots
     allocated to print four numbers, and it killed the tab outright: eighteen
     other tabs rendered and this one closed the page.

     Same four numbers, one pass over the rows already computed, four scalar
     arrays instead of four object arrays, and the best cap rate tracked as a
     running maximum rather than by copying and sorting the whole set. */
  let cfp=0, n=0, best=null, bestCap=-Infinity;
  const caps=[], gross=[], prices=[], ppsf=[];
  for(let i=0;i<rows.length;i++){
    const d=rows[i];
    if(d.P==null) continue;                 /* not underwritable, not counted */
    n++;
    if(d.cf>0) cfp++;
    if(d.cap>0) caps.push(d.cap);
    if(d.gross>0) gross.push(d.gross);
    if(d.P>0) prices.push(d.P);
    if(d.ppsf>0) ppsf.push(d.ppsf);
    if(d.cap!=null && d.cap>bestCap){ bestCap=d.cap; best=d; }
  }
  $('#dealtiles').innerHTML=`<div class="tile"><div class="v">${fmtN(cfp)} / ${fmtN(n)}</div><div class="l">cash-flow positive at your assumptions</div><div class="d">${state.assump.down}% down · ${state.assump.rate}% · ${state.assump.rentMethod==='yield'?'ZIP yield rents':'bedroom-based rents'}</div></div><div class="tile"><div class="v">${fmtPct(median(caps))}</div><div class="l">median cap rate</div><div class="d">median gross yield ${fmtPct(median(gross))}</div></div><div class="tile"><div class="v">${fmt$(median(prices))}</div><div class="l">median price</div><div class="d">median $/sf ${ppsf.length?'$'+fmtN(median(ppsf)):'—'}</div></div>${best?`<div class="tile"><div class="v">${fmtPct(best.cap)}</div><div class="l">best cap rate in view</div><div class="d">${esc(best.l.addr)}, ${esc(best.l.city)}</div></div>`:''}`;
}
$('#dq').addEventListener('input', renderDeals); $('#dsrc').addEventListener('change', renderDeals);
function csv(){ let rows=dealRows(); const VW=(window.LXView&&window.LXView.active())? window.LXView : null; if(VW) rows=rows.filter(r=>VW.pass(r.l)); const cols=['id','addr','city','zip','county','kind','units','beds','baths','sqft','lot','year','price','priceDate','lat','lng']; const dc=['rentMo','gross','cap','cfMo','coc','dscr','ppsf','grm','noi']; const xc=['lxScore','category','belowMarketIndex','bmEvidence','saleGapPct','ppsfGapPct','basisGapPct','upgradeUpside','distress','assetClass','landOrBuilding']; const head=cols.concat(dc).concat(xc).join(','); const q=v=>v==null?'':(/[",\n]/.test(String(v))?'"'+String(v).replace(/"/g,'""')+'"':v); return head+'\n'+rows.map(r=>{
    const base=cols.map(c=>q(c==='price'?r.P:r.l[c])).concat(dc.map(c=>q(r[c]!=null&&isFinite(r[c])?Math.round(r[c]*100)/100:'')));
    let an=null,bm=null,up=null,dd=null,cl=null;
    try{ an=window.LXDash&&LXDash.analyze(r.l); }catch(e){}
    try{ bm=window.LXBM&&LXBM.assess(r.l); }catch(e){}
    try{ up=window.LXBM&&LXBM.upgrades(r.l); }catch(e){}
    try{ dd=window.LXDash&&LXDash.distressOf(r.l); }catch(e){}
    try{ cl=window.LXView&&LXView.classOf(r.l); }catch(e){}
    const part=k=>{ const p=bm&&bm.parts.find(x=>x.k===k); return p? Math.round(p.pct) : ''; };
    const ex=[ an?an.score:'', an?an.cat:'', bm?bm.idx:'', bm? (bm.hard? 'sale/comps backed':'basis only') : '',
      part('sale'), part('ppsf'), part('basis'), up&&up.unlocked>0? Math.round(up.unlocked):'',
      dd? dd.v : '', cl? cl.name : '', (window.LXView&&LXView.isLand(r.l))? 'land':'building' ].map(q);
    return base.concat(ex).join(',');
  }).join('\n'); }
$('#csvbtn').addEventListener('click', async()=>{ try{ await navigator.clipboard.writeText(csv()); toast('CSV copied'); }catch(e){ toast('Clipboard blocked — use Download'); } });
$('#dlbtn').addEventListener('click', ()=>{ const b=new Blob([csv()],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='locatorx-deals.csv'; document.body.appendChild(a); a.click(); a.remove(); toast('If nothing downloaded, this host blocks downloads — use Copy as CSV'); });

/* ---------------- market page ---------------- */
let mkSel=null;
function lineChart(svg, tipEl, months, vals, fmt){
  const W=600,H=220,pl=56,pr=16,pt=14,pb=28; const v=vals.map(x=>x==null?null:x); const nz=v.filter(x=>x!=null); if(nz.length<2){ svg.innerHTML=''; return; }
  const min=Math.min(...nz)*0.985, max=Math.max(...nz)*1.015; const x=i=>pl+i/(v.length-1)*(W-pl-pr), y=val=>pt+(1-(val-min)/(max-min))*(H-pt-pb);
  const pts=v.map((val,i)=>val==null?null:[x(i),y(val)]).filter(Boolean); const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const ticks=4; let g=''; for(let i=0;i<=ticks;i++){ const val=min+(max-min)*i/ticks; g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(val).toFixed(1)}" y2="${y(val).toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${pl-6}" y="${(y(val)+4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="var(--mono)">${fmt(val)}</text>`; }
  const xl=[0, Math.floor(v.length/2), v.length-1].map(i=>`<text x="${x(i).toFixed(1)}" y="${H-8}" text-anchor="${i===0?'start':i===v.length-1?'end':'middle'}" font-size="10" fill="var(--muted)" font-family="var(--mono)">${months[i].slice(0,7)}</text>`).join('');
  const lp=pts[pts.length-1];
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`); svg.innerHTML=`${g}${xl}<path d="${d} L${lp[0].toFixed(1)} ${(H-pb).toFixed(1)} L${pts[0][0].toFixed(1)} ${(H-pb).toFixed(1)} Z" fill="var(--bay-soft)"/><path d="${d}" fill="none" stroke="var(--bay)" stroke-width="2"/><circle cx="${lp[0].toFixed(1)}" cy="${lp[1].toFixed(1)}" r="4" fill="var(--bay)"/><line id="xh" x1="0" x2="0" y1="${pt}" y2="${H-pb}" stroke="var(--ink)" stroke-width="1" style="display:none"/><circle id="hp" r="4" fill="var(--ink)" style="display:none"/>`;
  const xh=svg.querySelector('#xh'), hp=svg.querySelector('#hp');
  svg.onmousemove=e=>{ const r=svg.getBoundingClientRect(); const px=(e.clientX-r.left)/r.width*W; let i=Math.round((px-pl)/(W-pl-pr)*(v.length-1)); i=clamp(i,0,v.length-1); if(v[i]==null) return; xh.setAttribute('x1',x(i)); xh.setAttribute('x2',x(i)); xh.style.display=''; hp.setAttribute('cx',x(i)); hp.setAttribute('cy',y(v[i])); hp.style.display=''; tipEl.style.display='block'; tipEl.textContent=`${months[i].slice(0,7)}  ${fmt(v[i])}`; tipEl.style.left=(e.clientX-r.left+12)+'px'; tipEl.style.top=(e.clientY-r.top-30)+'px'; };
  svg.onmouseleave=()=>{ xh.style.display='none'; hp.style.display='none'; tipEl.style.display='none'; };
}
function renderMarket(selKey){
  $('#mkmonth').textContent=M.months[M.months.length-1];
  const level=$('#mklevel').value, q=($('#mq').value||'').toLowerCase(), onlyRent=$('#mkrent').checked;
  const src = level==='zip'? M.zips : M.cities;
  let rows=Object.entries(src).map(([k,o])=>{ const v=last(o.v), r=last(o.r); const yoy = o.v&&last(o.v)&&at(o.v,o.v.length-13)? (last(o.v)/at(o.v,o.v.length-13)-1)*100 : null; const ry = o.r&&last(o.r)&&at(o.r,o.r.length-13)? (last(o.r)/at(o.r,o.r.length-13)-1)*100 : null; return {k, city:o.city||'', county:o.county||'', v, r, yield: v&&r? r*12/v*100 : null, yoy, ry, o}; });
  rows=rows.filter(x=>x.v && (!onlyRent||x.r) && (!q || `${x.k} ${x.city} ${x.county}`.toLowerCase().includes(q)));
  rows.sort((a,b)=>(b.yield||-1)-(a.yield||-1));
  if(selKey && src[selKey]) mkSel=selKey; if(!mkSel || !src[mkSel]) mkSel=rows[0]?rows[0].k:null;
  $('#mktable thead').innerHTML=`<tr><th>${level==='zip'?'ZIP':'City'}</th><th>${level==='zip'?'City':'Metro'}</th><th>County</th><th class="r">Typical value</th><th class="r">1-yr</th><th class="r">Typical rent</th><th class="r">Rent 1-yr</th><th class="r">Gross yield</th><th class="r">Value trend (25 mo)</th></tr>`;
  $('#mktable tbody').innerHTML=rows.map(x=>`<tr class="clickable ${x.k===mkSel?'sel':''}" data-k="${esc(x.k)}"><td><b>${esc(x.k)}</b></td><td>${esc(x.city)}</td><td>${esc(x.county)}</td><td class="r">${fmt$(x.v)}</td><td class="r ${x.yoy>0?'pos':x.yoy<0?'neg':''}">${x.yoy!=null?(x.yoy>0?'+':'')+x.yoy.toFixed(1)+'%':'—'}</td><td class="r">${x.r?'$'+fmtN(x.r):'—'}</td><td class="r ${x.ry>0?'pos':x.ry<0?'neg':''}">${x.ry!=null?(x.ry>0?'+':'')+x.ry.toFixed(1)+'%':'—'}</td><td class="r"><b>${fmtPct(x.yield)}</b></td><td class="r" style="width:140px">${spark(x.o.v,140,28).replace('class="spark','style="height:28px;width:130px" class="spark')}</td></tr>`).join('');
  $$('#mktable tbody tr').forEach(tr=>tr.addEventListener('click', ()=>renderMarket(tr.dataset.k)));
  const o=src[mkSel]; if(o){ const title = level==='zip'? `ZIP ${mkSel} · ${o.city||''}` : mkSel; $('#ct1').textContent=title+' — typical home value (ZHVI)'; $('#ct2').textContent=title+' — typical rent (ZORI)'; lineChart($('#chart1'), $('#chart1').parentElement.querySelector('.tip'), M.months, o.v||[], fmt$); lineChart($('#chart2'), $('#chart2').parentElement.querySelector('.tip'), M.months, o.r||[], v=>'$'+fmtN(v)); }
}
['mklevel','mq','mkrent'].forEach(id=>$('#'+id).addEventListener('input', ()=>renderMarket()));

/* ---------------- import adapters ---------------- */
function parseCSV(text){ const rows=[]; let row=[], cur='', q=false; for(let i=0;i<text.length;i++){ const ch=text[i]; if(q){ if(ch==='"'){ if(text[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=ch; } else if(ch==='"') q=true; else if(ch===','){ row.push(cur); cur=''; } else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&text[i+1]==='\n') i++; row.push(cur); rows.push(row); row=[]; cur=''; } else cur+=ch; } if(cur!==''||row.length){ row.push(cur); rows.push(row); } return rows.filter(r=>r.length>1||r[0]); }
const SYN = {addr:['address','streetaddress','street','unparsedaddress','full_address','fulladdress','property_address','situs','location'], city:['city','town','municipality'], zip:['zip','zipcode','postalcode','postal_code','zip_code'], lat:['lat','latitude','y'], lng:['lng','lon','long','longitude','x'], price:['price','listprice','list_price','askingprice','sale_price','saleprice','soldprice','amount','value','zestimate'], beds:['beds','bedrooms','bedroomstotal','br','bed'], baths:['baths','bathrooms','bathroomstotalinteger','bathroomstotal','ba','bath'], sqft:['sqft','livingarea','living_area','livingareavalue','area','building_sqft','gla','size'], lot:['lot','lotsize','lotareavalue','lotsizesquarefeet','lot_sqft','lot_area'], year:['year','yearbuilt','year_built','built'], units:['units','unitcount','numberofunits','number_of_units','unitstotal'], rent:['rent','rentzestimate','monthlyrent','rent_estimate','grossrent'], tour:['tour','virtualtour','virtualtoururlunbranded','virtualtoururl','tour_url','matterport','3dtour','panoramas','pano'], url:['url','link','hdpurl','detailurl','listing_url','href'], photo:['photo','image','imgsrc','thumbnail','picture','photo_url'], kind:['type','propertytype','hometype','property_type','propertysubtype','usecode','kind'], status:['status','homestatus','standardstatus','listingstatus'], id:['id','zpid','listingkey','listingid','apn','mlsid','parcel']};
function synIndex(headers){ const h=headers.map(x=>String(x).toLowerCase().replace(/[^a-z0-9]/g,'')); const idx={}; for(const k in SYN){ for(const s of SYN[k]){ const i=h.indexOf(s.replace(/[^a-z0-9]/g,'')); if(i>=0){ idx[k]=i; break; } } } return idx; }
function num(v){ if(v==null||v==='') return null; if(typeof v==='number') return v; const n=parseFloat(String(v).replace(/[$,\s]/g,'')); return isNaN(n)?null:n; }
function normKind(t, units){ const s=String(t||'').toLowerCase(); if(/condo|apartment_unit|townhome|townhouse/.test(s)) return /town/.test(s)?'Townhouse':'Condominium'; if(/multi|duplex|triplex|fourplex|quad|plex|2-4|units/.test(s)) return units>1? `${units} units` : 'Multi-family'; if(/lot|land/.test(s)) return 'Land'; if(units>1) return `${units} units`; return 'Single-family'; }
function zipCentroid(zip){ const f=BA.geo.zips.features.find(x=>x.properties.zip===String(zip)); if(!f) return null; let xs=0,ys=0,n=0; const walk=c=>{ if(typeof c[0]==='number'){ xs+=c[0]; ys+=c[1]; n++; } else c.forEach(walk); }; walk(f.geometry.coordinates); return n? [xs/n, ys/n] : null; }
let impSeq = (store('impSeq')||0);
function mk(rec, srcName){
  const l={id:'IMP'+(++impSeq), src:'imp', srcName, addr:rec.addr||'(no address)', city:rec.city||'', zip:rec.zip?String(rec.zip).slice(0,5):'', county:rec.county||'', lat:num(rec.lat), lng:num(rec.lng), price:num(rec.price), beds:num(rec.beds), baths:num(rec.baths), sqft:num(rec.sqft), lot:num(rec.lot), year:num(rec.year), units:num(rec.units)||1, rent:num(rec.rent), url:rec.url||null, photo:rec.photo||null, status:rec.status||null, priceDate:rec.date||null, apn:rec.id?String(rec.id):null, nb:null};
  l.kind=normKind(rec.kind, l.units);
  if(rec.tour){ const parts=String(rec.tour).split(',').map(s=>s.trim()).filter(Boolean); const imgs=parts.filter(p=>/\.(jpe?g|png|webp)(\?|$)/i.test(p)||p.startsWith('data:image')); if(imgs.length) l.panos=imgs; else if(parts.length) l.tourUrl=parts; }
  if(!l.county){ const z=M.zips[l.zip]; if(z&&z.county) l.county=z.county.replace(' County',''); else { const c=M.cities[l.city]; if(c&&c.county) l.county=c.county.replace(' County',''); } }
  if(!l.city && M.zips[l.zip]) l.city=M.zips[l.zip].city||'';
  if((l.lat==null||l.lng==null) && l.zip){ const c=zipCentroid(l.zip); if(c){ l.lng=c[0]+(Math.random()-0.5)*0.006; l.lat=c[1]+(Math.random()-0.5)*0.005; l.approx=true; } }
  return l;
}
function fromZillowProp(p, srcName){ const a=p.address||{}; const addr = typeof a==='string'? a : (a.streetAddress||p.streetAddress||''); const city = a.city||p.city||''; const zip=a.zipcode||p.zipcode||''; const photos=(p.compsCarouselPropertyPhotos||p.photos||[]); let photo=p.imgSrc||null; try{ if(!photo && photos.length){ const j=photos[0].mixedSources.jpeg; photo=j[j.length-1].url; } }catch(e){}
  const price = p.price && p.price>0 ? p.price : (p.lastSoldPrice||p.zestimate||null); const date = p.dateSold? new Date(p.dateSold).toISOString().slice(0,10) : (p.datePosted||null);
  return mk({addr, city, zip, lat:p.latitude, lng:p.longitude, price, beds:p.bedrooms, baths:p.bathrooms, sqft:p.livingAreaValue||p.livingArea, lot:p.lotAreaValue||p.lotAreaUnits==='sqft'?p.lotAreaValue:null, year:p.yearBuilt, units:p.unitCount, rent:p.rentZestimate, kind:p.homeType||p.propertyType, status:p.homeStatus||p.listingStatus, url:p.hdpUrl? (p.hdpUrl.startsWith('http')?p.hdpUrl:'https://www.zillow.com'+p.hdpUrl) : (p.detailUrl? (p.detailUrl.startsWith('http')?p.detailUrl:'https://www.zillow.com'+p.detailUrl):null), photo, id:p.zpid, date, tour:p.virtualTourUrl||null}, srcName); }
function fromReso(r, srcName){ let photo=null; try{ photo=(r.Media||[]).find(m=>m.MediaURL).MediaURL; }catch(e){} const units=r.NumberOfUnitsTotal||r.UnitsTotal||null; return mk({addr:r.UnparsedAddress||[r.StreetNumber,r.StreetName,r.StreetSuffix].filter(Boolean).join(' '), city:r.City, zip:r.PostalCode, lat:r.Latitude, lng:r.Longitude, price:r.ListPrice||r.ClosePrice, beds:r.BedroomsTotal, baths:r.BathroomsTotalInteger||r.BathroomsTotalDecimal, sqft:r.LivingArea, lot:r.LotSizeSquareFeet, year:r.YearBuilt, units, kind:(r.PropertySubType||r.PropertyType), status:r.StandardStatus, url:r.VirtualTourURLBranded||null, tour:r.VirtualTourURLUnbranded||null, photo, id:r.ListingKey||r.ListingId, date:r.CloseDate||r.ListingContractDate, county:r.CountyOrParish}, srcName); }
function fromRow(obj, srcName){ const keys=Object.keys(obj); const idx=synIndex(keys); const g=k=>idx[k]!=null? obj[keys[idx[k]]] : undefined; return mk({addr:g('addr'), city:g('city'), zip:g('zip'), lat:g('lat'), lng:g('lng'), price:g('price'), beds:g('beds'), baths:g('baths'), sqft:g('sqft'), lot:g('lot'), year:g('year'), units:g('units'), rent:g('rent'), tour:g('tour'), url:g('url'), photo:g('photo'), kind:g('kind'), status:g('status'), id:g('id')}, srcName); }
function importText(text, srcName){
  text=text.trim(); if(!text) return {listings:[], notes:['Nothing to import.']};
  const out=[], notes=[];
  let obj=null; try{ obj=JSON.parse(text); }catch(e){}
  if(obj){
    if(obj.data&&obj.data.marketPage){ const mp=obj.data.marketPage; const key=(mp.areaName||'').split(',')[0].trim().toLowerCase(); state.rentMarkets[key]={area:mp.areaName, date:mp.date, medianRent:mp.summary&&mp.summary.medianRent, yearly:mp.summary&&mp.summary.yearlyChange, temp:mp.marketTemperature&&mp.marketTemperature.temperature, available:mp.summary&&mp.summary.availableRentals, series:(mp.medianRentPriceOverTime&&mp.medianRentPriceOverTime.currentYear)||[], prev:(mp.medianRentPriceOverTime&&mp.medianRentPriceOverTime.prevYear)||[], hist:(mp.rentHistogram&&mp.rentHistogram.priceAndCount)||[], nearby:(mp.nearbyAreaTrends||[]).map(n=>({name:n.areaName, rent:n.medianRent}))}; store('rentMarkets', state.rentMarkets); notes.push(`Rent market for ${mp.areaName}: median $${fmtN(mp.summary&&mp.summary.medianRent)}/mo, ${mp.summary&&mp.summary.availableRentals} rentals. Listings in ${mp.areaName.split(',')[0]} now use it when the bedroom rent method is on.`); renderRentMarkets(); return {listings:out, notes}; }
    const arr = Array.isArray(obj)? obj : (obj.results||obj.props||obj.value||obj.features||obj.listings||obj.properties||obj.data&&(obj.data.results||obj.data.props||obj.data.listings)||(obj.property?[obj]:null)||(obj.zpid||obj.ListingKey||obj.address?[obj]:null));
    if(!arr){ notes.push('JSON recognized but no property array found (looked for results, props, value, features, listings).'); return {listings:out, notes}; }
    arr.forEach(item=>{ const p=item.property||item; if(p.type==='Feature'){ const g=p.geometry||{}; const pr=Object.assign({}, p.properties||{}); if(g.type==='Point'){ pr.lng=g.coordinates[0]; pr.lat=g.coordinates[1]; } out.push(fromRow(pr, srcName)); } else if(p.ListPrice!=null||p.ListingKey||p.UnparsedAddress) out.push(fromReso(p, srcName)); else if(p.zpid!=null||p.hdpUrl||p.homeType||p.zestimate!=null||p.latitude!=null&&p.address) out.push(fromZillowProp(p, srcName)); else out.push(fromRow(p, srcName)); });
  } else {
    const rows=parseCSV(text); if(rows.length<2){ notes.push('CSV needs a header row and at least one data row.'); return {listings:out, notes}; }
    const hdr=rows[0]; rows.slice(1).forEach(r=>{ const o={}; hdr.forEach((h,i)=>o[h]=r[i]); out.push(fromRow(o, srcName)); });
  }
  const bad=out.filter(l=>l.lat==null||l.lng==null||!l.price); const good=out.filter(l=>l.lat!=null&&l.lng!=null&&l.price);
  if(bad.length) notes.push(`${bad.length} row(s) skipped: no coordinates/ZIP or no price.`);
  const approx=good.filter(l=>l.approx).length; if(approx) notes.push(`${approx} placed at ZIP centroid (no coordinates given).`);
  const outside=good.filter(l=>l.lat<36.2||l.lat>39.2||l.lng<-124.2||l.lng>-120.2); if(outside.length) notes.push(`${outside.length} outside the Bay Area — kept, but the map is bounded to the region (use Fit to results on a filtered list to see them, or zoom out).`);
  return {listings:good, notes};
}
function doImport(text, srcName){ const {listings, notes}=importText(text, srcName);
  /* THE UNTRUSTED BOUNDARY. Everything arriving from a paste, a dropped file or a
     live API is stripped of markup, quotes and control characters here, once,
     before it becomes a record that hundreds of render sites will touch. */
  try{ if(window.LXSec) window.LXSec.hardenAll(listings); }catch(e){} if(listings.length){ state.imported=state.imported.concat(listings); store('imported', state.imported); store('impSeq', impSeq); fillCounties(); refresh(); renderMarkers(); } $('#implog').textContent=[`${listings.length} listing(s) imported from ${srcName}.`].concat(notes).join('\n'); $('#impcount').textContent=`${state.imported.length} imported in this browser`; if(listings.length){ toast(`${listings.length} imported`); } }
$('#importbtn').addEventListener('click', ()=>doImport($('#paste').value, 'pasted data'));
$('#file').addEventListener('change', e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>doImport(t, f.name)); e.target.value=''; });
const drop=$('#drop'); ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev, e=>{ e.preventDefault(); drop.classList.add('over'); })); ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev, e=>{ e.preventDefault(); drop.classList.remove('over'); })); drop.addEventListener('drop', e=>{ const f=e.dataTransfer.files[0]; if(f) f.text().then(t=>doImport(t, f.name)); });
$('#clearimp').addEventListener('click', ()=>{ state.imported.forEach(l=>{ const m=markers[l.id]; if(m&&m._added) m.remove(); delete markers[l.id]; }); state.imported=[]; store('imported', []); if(state.sel&&state.sel.startsWith('IMP')) state.sel=null; fillCounties(); refresh(); $('#implog').textContent='Imported listings removed.'; $('#impcount').textContent=''; });
$('#samplebtn').addEventListener('click', ()=>{ $('#paste').value=JSON.stringify({results:[{property:{zpid:15085600,address:{streetAddress:'2312 Telegraph Ave',city:'Oakland',state:'CA',zipcode:'94612'},latitude:37.8117,longitude:-122.2686,price:1195000,bedrooms:6,bathrooms:3,livingAreaValue:2960,lotAreaValue:3500,homeType:'MULTI_FAMILY',homeStatus:'FOR_SALE',rentZestimate:6400,hdpUrl:'/homedetails/15085600_zpid/',virtualTourUrl:''}},{property:{zpid:15187722,address:{streetAddress:'1531 Hopkins St',city:'Berkeley',state:'CA',zipcode:'94702'},latitude:37.8783,longitude:-122.2864,price:1450000,bedrooms:4,bathrooms:2,livingAreaValue:1980,lotAreaValue:5000,homeType:'SINGLE_FAMILY',homeStatus:'FOR_SALE',rentZestimate:5800,hdpUrl:'/homedetails/15187722_zpid/'}}]}, null, 1)+'\n\n'; toast('Sample Zillow-shaped JSON loaded — press Import'); });
$('#apibtn').addEventListener('click', fetchApi);
let apiTimer=null; $('#apiauto').addEventListener('change', e=>{ clearInterval(apiTimer); if(e.target.checked) apiTimer=setInterval(fetchApi, 600000); });
async function fetchApi(){ const url=$('#apiurl').value.trim(); if(!url) return; let headers={}; try{ headers=$('#apihdr').value.trim()? JSON.parse($('#apihdr').value) : {}; }catch(e){ $('#implog').textContent='Headers must be valid JSON.'; return; } $('#implog').textContent='Fetching…'; try{ const r=await fetch(url,{headers}); const t=await r.text(); if(!r.ok){ $('#implog').textContent=`HTTP ${r.status}: ${t.slice(0,300)}`; return; } doImport(t, 'live feed '+new URL(url).host); }catch(e){ $('#implog').textContent='Fetch failed: '+e.message+'\nInside claude.ai, outside servers are blocked by the page policy; open the downloaded file to use live feeds. Also check the API allows browser (CORS) requests.'; } }
function renderRentMarkets(){ const el=$('#rentmarket'); const ks=Object.keys(state.rentMarkets); if(!ks.length){ el.innerHTML=''; return; } el.innerHTML='<p class="eyebrow" style="margin:0 0 8px">Rent markets you imported</p>'+ks.map(k=>{ const r=state.rentMarkets[k]; const vals=r.series.map(s=>s.price); const hist=r.hist||[]; const maxc=Math.max(1,...hist.map(h=>h.count)); return `<div class="tile" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:baseline"><b>${esc(r.area)}</b><span style="font-size:12px;color:var(--muted)">${esc(r.date||'')} · ${esc(r.temp||'')}</span></div><div class="v" style="font-family:var(--mono);font-size:22px">$${fmtN(r.medianRent)}<span style="font-size:12px;color:var(--muted)">/mo median · ${r.yearly!=null?(r.yearly>0?'+':'')+r.yearly+'% y/y':''} · ${fmtN(r.available)} available</span></div>${vals.length>1?spark(vals,380,44):''}<div style="display:flex;align-items:flex-end;gap:1px;height:36px;margin-top:6px">${hist.map(h=>`<div title="$${h.price}: ${h.count}" style="flex:1;background:var(--bay);opacity:.8;height:${Math.max(2,h.count/maxc*36)}px"></div>`).join('')}</div><div style="font-size:11px;color:var(--muted)">Rent histogram · nearby: ${(r.nearby||[]).map(n=>`${esc(n.name)} $${fmtN(n.rent)}`).join(' · ')}</div></div>`; }).join(''); }

/* ---------------- guide live blocks ---------------- */
function renderGuideLive(){
  const all=BA.listings.map(l=>({l, d:deal(l)})).filter(x=>x.d); const cfp=all.filter(x=>x.d.cf>0); const a=state.assump;
  $('#live1').innerHTML=`<b>On this map right now:</b> with ${a.down}% down at ${a.rate}% and ZIP-level rents, <b>${fmtN(cfp.length)} of ${fmtN(all.length)}</b> public-record properties pass the asset test (positive cash flow after the mortgage). ${cfp.length? 'They are '+cfp.slice(0,4).map(x=>`<a href="#" data-sel="${x.l.id}">${esc(x.l.addr)}, ${esc(x.l.city)}</a>`).join('; ')+(cfp.length>4?' and more':'')+'.' : 'Change the assumptions in any drawer and this sentence updates.'}`;
  const zr=Object.entries(M.zips).map(([k,o])=>({k, city:o.city, y: last(o.v)&&last(o.r)? last(o.r)*12/last(o.v)*100 : null})).filter(x=>x.y); zr.sort((a,b)=>b.y-a.y); const med=median(zr.map(x=>x.y));
  const one=all.filter(x=>x.d.one>=1).length;
  $('#live3').innerHTML=`<b>Gross yield across ${zr.length} Bay Area ZIPs:</b> median <b>${fmtPct(med)}</b>; the 1% rule (12% gross) is met by <b>${fmtN(one)}</b> of the ${fmtN(all.length)} properties here. Highest-yield ZIPs in Zillow's files: ${zr.slice(0,6).map(x=>`<a href="#" data-zip="${x.k}">${x.k} ${esc(x.city||'')} (${x.y.toFixed(1)}%)</a>`).join(', ')}. Lowest: ${zr.slice(-3).map(x=>`${x.k} ${esc(x.city||'')} (${x.y.toFixed(1)}%)`).join(', ')}.`;
  const ex=all.filter(x=>(x.l.units||1)>1).sort((a,b)=>b.d.cap-a.d.cap)[0]||all.sort((a,b)=>b.d.cap-a.d.cap)[0];
  if(ex){ const d=ex.d, l=ex.l; $('#live4').innerHTML=`<b>Worked example — <a href="#" data-sel="${l.id}">${esc(l.addr)}, ${esc(l.city)}</a></b> (${esc(l.kind)}, sold ${l.priceDate} for ${fmtFull(d.P)}). Estimated rent $${fmtN(d.rentMo)}/mo → gross ${fmtFull(d.rent)}; after ${a.vacancy}% vacancy, ${taxRate(l)}% tax, insurance, ${a.maint+a.capex}% upkeep and ${a.mgmt}% management, NOI is <b>${fmtFull(d.noi)}</b> — a <b>${fmtPct(d.cap)}</b> cap rate. A ${a.down}%-down loan at ${a.rate}% costs ${fmtFull(d.ds)} a year, so cash flow is <b class="${d.cf>0?'pos':'neg'}">${fmtFull(d.cf)}</b> (${fmtPct(d.coc)} cash-on-cash, DSCR ${d.dscr.toFixed(2)}). ${d.cf>0?'That is an asset by the Locator X definition: it pays its owner.':'To make this an asset you would need roughly $'+fmtN((d.ds+d.opex)/(1-a.vacancy/100)/12/(1-a.mgmt/100)-d.rentMo)+' more rent per month, or a bigger down payment.'}`; }
  $$('#guide a[data-sel]').forEach(x=>x.addEventListener('click', e=>{ e.preventDefault(); select(x.dataset.sel, true); }));
  $$('#guide a[data-zip]').forEach(x=>x.addEventListener('click', e=>{ e.preventDefault(); showView('market'); $('#mq').value=x.dataset.zip; renderMarket(x.dataset.zip); }));
}
$('#toc').innerHTML=$$('#guide h2').map(h=>`<a href="#${h.id}">${h.textContent}</a>`).join('');
$$('#toc a').forEach(a=>a.addEventListener('click', e=>{ e.preventDefault(); const t=$(a.getAttribute('href')); t.scrollIntoView({behavior:'smooth', block:'start'}); }));

function updateZipsSource(){ if(USE_GL && mapReady && map.getSource && map.getSource('zips')) map.getSource('zips').setData(BA.geo.zips); else if(map && map.draw) map.draw(); }
/* ---------------- public API for dashboard/research ---------------- */
window.LX = {updateZipsSource, deal, dealBump, dealSync, opexOf, price, rentEstimate, taxRate, marketFor, allListings, filtered, select, showView, state, store, toast, esc, fmt$, fmtFull, fmtPct, fmtN, median, spark, last, at, M, BA, zipCentroid, refresh, saveAssump, mk, closeDrawer, fillCounties, hasTour, openTour, importText, sourceUrl, srcLine, EDITION_STATE, focusCity, focusDistrict, renderCityRail, renderDistrictRail, districtOf, NO_DISTRICT, editionFootprint, inFootprint, cityStats, CITY_LABEL_CAP};
/* ---------------- boot ---------------- */
fillCounties(); renderList(); initMap(); renderRentMarkets(); setTimeout(()=>{ try{ if(window.LXScout&&LXScout.autoStart) LXScout.autoStart(); }catch(e){} }, 800); setTimeout(()=>{ if(window.LXDash) window.LXDash.render(); },0); $('#impcount').textContent = state.imported.length? `${state.imported.length} imported in this browser` : '';
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !tour.open && state.sel) closeDrawer(); });
})();
