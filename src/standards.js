/* locator.x - the Investment Standard, written down and testable.
   ----------------------------------------------------------------------------
   Every screen in this platform has implied a definition of a good investment
   without ever stating one. This module states it: a named, versioned list of
   requirements grouped into categories, each one a function of the published
   record, each one returning a status you can argue with.

   THREE STATUSES, AND THE THIRD IS THE POINT.
     meets   - the record supports this requirement
     fails   - the record contradicts it
     unknown - the record does not say

   "Unknown" is a first-class outcome and is never quietly counted as either of
   the others. A county that publishes no year built does not make a property
   old, and it does not make it new. Most screening tools collapse unknown into
   fail, which silently rejects whole counties for the sin of a thin schema, or
   into pass, which is worse. Here a property is scored on what is KNOWN about it
   and the count of unknowns travels with the score, so a 9-of-10 on complete
   data and a 9-of-10 on two published fields never look alike.

   NOTHING HERE USES A PROTECTED CHARACTERISTIC. There is no requirement about
   who lives anywhere: no race, ethnicity, national origin, income, household
   composition, school rating or crime statistic is loaded by this app at all,
   which is a fair-housing decision and is stated on the Governance page. Every
   test below is about the BUILDING, the MONEY or the PUBLISHED RECORD. */
(function(){
'use strict';
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function N(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; }

var VERSION = '1.0';

/* Each requirement returns:
     true  -> meets      false -> fails      null -> unknown
   `why` explains a fail or an unknown in the reader's terms, never in ours. */
var CATS = [
  {id:'income', name:'Income', blurb:'Does the building pay for itself at your assumptions?'},
  {id:'debt',   name:'Debt',   blurb:'Would a lender and a bad year both survive it?'},
  {id:'basis',  name:'Basis and evidence', blurb:'Is the price real, and is there a record behind it?'},
  {id:'asset',  name:'The asset', blurb:'Is there a building, and does it have a use you can let?'},
  {id:'market', name:'The market', blurb:'Is the surrounding index doing anything, and do we know?'}
];

var REQS = [
  /* ---- income --------------------------------------------------------- */
  {id:'cf', cat:'income', name:'Cash-flow positive', want:'monthly cash flow above zero',
   test:function(c){ if(!c.uw) return null; return c.uw.cfMo > 0; },
   why:function(c){ return c.uw ? 'Runs ' + L().fmt$(Math.abs(Math.round(c.uw.cfMo))) + '/mo negative at your assumptions.'
                                : 'Not underwritable from the published record.'; }},
  {id:'cap', cat:'income', name:'Cap rate 5% or better', want:'net operating income at least 5% of price',
   /* underwrite() returns capCost, not cap - checking the wrong field made this
      requirement return "not published" on every property in every edition,
      which is the quietest possible way for a screen to do nothing */
   test:function(c){ if(!c.uw || c.uw.capCost == null || !isFinite(c.uw.capCost)) return null;
     return c.uw.capCost >= 5; },
   why:function(c){ return c.uw ? 'Cap on total cost is ' + c.uw.capCost.toFixed(1) + '%.' : 'No price or no rent basis.'; }},
  {id:'grm', cat:'income', name:'Not priced past 20x rent', want:'price under twenty times annual rent',
   test:function(c){ if(!c.uw || !c.uw.rent) return null; return (c.uw.P / c.uw.rent) <= 20; },
   why:function(c){ return c.uw && c.uw.rent ? 'Priced at ' + (c.uw.P/c.uw.rent).toFixed(1) + 'x annual rent.' : 'No rent basis published.'; }},

  /* ---- debt ----------------------------------------------------------- */
  {id:'dscr', cat:'debt', name:'DSCR 1.20 or better', want:'income covers debt service with 20% to spare',
   test:function(c){ if(!c.uw || c.uw.dscr == null) return null; return c.uw.dscr >= 1.20; },
   why:function(c){ return c.uw && c.uw.dscr != null ? 'Debt coverage is ' + c.uw.dscr.toFixed(2) + '.' : 'No financing modelled.'; }},
  {id:'beocc', cat:'debt', name:'Break-even occupancy under 85%', want:'room for vacancy before it costs money',
   test:function(c){ if(!c.uw || c.uw.beOcc == null) return null; return c.uw.beOcc <= 85; },
   why:function(c){ return c.uw && c.uw.beOcc != null ? 'Needs ' + c.uw.beOcc.toFixed(0) + '% occupancy to break even.' : 'Not computable here.'; }},
  {id:'norent', cat:'debt', name:'Does not depend on rent growth', want:'clears DSCR 1.20 without rents rising',
   test:function(c){ var A = c.out; if(!A || !A.reqDscr) return null;
     if(A.reqDscr.impossible) return false;
     if(A.reqDscr.atFloor) return true;
     return A.reqDscr.rate <= 0; },
   why:function(c){ var A = c.out;
     if(!A || !A.reqDscr) return 'No index series behind this ZIP, so the requirement cannot be solved.';
     if(A.reqDscr.impossible) return 'No rent growth clears DSCR 1.20 at this price and loan.';
     return 'Needs ' + (A.reqDscr.rate * 100).toFixed(1) + '% rent growth a year to hold DSCR 1.20.'; }},

  /* ---- basis and evidence --------------------------------------------- */
  {id:'evid', cat:'basis', name:'Evidence grade C or better', want:'enough published record to underwrite honestly',
   test:function(c){ if(!c.ev) return null; return c.ev.score >= 45; },
   why:function(c){ return c.ev ? 'Evidence grade ' + c.ev.band + ' (' + c.ev.score + '/100) — ' + c.ev.label + '.' : 'Not graded.'; }},
  {id:'sale', cat:'basis', name:'Price is a recorded sale', want:'a deed, not an assessment or an estimate',
   test:function(c){ var l = c.l;
     if(l.est) return false;
     if(l.sale != null && l.saleDate) return true;
     if(l.price == null) return null;
     return false; },
   why:function(c){ var l = c.l;
     if(l.est) return 'The price here is a modelled estimate, not a transaction.';
     if(l.sale != null && !l.saleDate) return 'A sale price is recorded with no date, so it cannot be aged.';
     return 'The figure is an assessed or published value, which is not a price anyone paid.'; }},
  {id:'fresh', cat:'basis', name:'Sale within five years', want:'a price the current market would recognise',
   test:function(c){ var d = c.l.saleDate; if(!d) return null;
     var y = +String(d).slice(0,4); if(!y) return null;
     return (new Date().getFullYear() - y) <= 5; },
   why:function(c){ return c.l.saleDate ? 'Last recorded sale ' + c.l.saleDate + '.' : 'No sale date published.'; }},

  /* ---- the asset ------------------------------------------------------ */
  {id:'built', cat:'asset', name:'There is a building', want:'an improvement on the parcel, not bare land',
   test:function(c){ try{ if(window.LXView) return !LXView.isLand(c.l); }catch(e){} return null; },
   why:function(){ return 'The record describes land with no improvement.'; }},
  {id:'use', cat:'asset', name:'A recorded residential or lodging use', want:'a use code, not a zoning district',
   test:function(c){ var k = c.l.kind || '';
     if(!k || /^unclass|^unknown/i.test(k)) return null;
     if(/zoned|zoning/i.test(k)) return null;      /* a zoning is not a use */
     return /resid|apart|duplex|triplex|fourplex|family|condo|townhouse|hotel|motel|lodg|dorm|student|multi/i.test(k); },
   why:function(c){ var k = c.l.kind || '';
     if(!k) return 'No use class is published for this parcel.';
     if(/zoned|zoning/i.test(k)) return 'Only a zoning district is published. A zoning is what may be built, not what is there.';
     return 'Recorded use is "' + k + '".'; }},
  {id:'size', cat:'asset', name:'Building area published', want:'a floor area to price and plan against',
   test:function(c){ return N(c.l.sqft) ? true : null; },
   why:function(){ return 'This county publishes no building area, so price per foot and any room program are unavailable.'; }},

  /* ---- the market ------------------------------------------------------ */
  {id:'idx', cat:'market', name:'Covered by a published index', want:'a monthly series for its ZIP',
   test:function(c){ var o = c.out && c.out.outlook; if(!o) return null; return !o.none && o.valTrend != null; },
   why:function(){ return 'No monthly index is published for this ZIP, so nothing on this page can speak to its market.'; }},
  {id:'trend', cat:'market', name:'Value trend not falling', want:'the index flat or rising',
   test:function(c){ var o = c.out && c.out.outlook; if(!o || o.none || o.valTrend == null) return null;
     return o.valTrend >= 0; },
   why:function(c){ var o = c.out && c.out.outlook;
     if(!o || o.none || o.valTrend == null) return 'No fitted value trend is available for this ZIP, so the direction of its market is unknown here.';
     return 'The fitted value trend is ' + (o.valTrend*100).toFixed(1) + '% a year.'; }},
  {id:'yield', cat:'market', name:'Yields not compressing hard', want:'value not outrunning rent by more than 3 points',
   test:function(c){ var o = c.out && c.out.outlook; if(!o || o.none || o.compress == null) return null;
     return o.compress <= 0.03; },
   why:function(c){ var o = c.out && c.out.outlook;
     if(!o || o.none || o.compress == null) return 'Both a value series and a rent series are needed to see whether yields are compressing, and this ZIP is missing one of them.';
     return 'Value is outrunning rent by ' + (o.compress*100).toFixed(1) + ' points a year: the same building costs more and pays the same.'; }}
];

/* ---- assess one property ------------------------------------------------ */
function context(l, uw){
  var c = {l:l, uw:uw || null, ev:null, out:null};
  try{ c.ev = window.LXEvid && LXEvid.grade ? LXEvid.grade(l) : null; }catch(e){}
  try{
    if(window.LXOutlook && uw){
      var fin = {id:'conv', name:'Conventional', down:L().state.assump.down, rate:L().state.assump.rate, mi:0};
      c.out = LXOutlook.assess(l, {offer:uw.P, rehab:0, cont:10, rentMo:uw.rentMo, finOpt:fin}, uw);
    } else if(window.LXOutlook){
      c.out = {outlook: LXOutlook.outlookFor(l)};
    }
  }catch(e){}
  return c;
}
function assess(l, uw){
  var c = context(l, uw);
  var rows = [], meets = 0, fails = 0, unknown = 0;
  for(var i = 0; i < REQS.length; i++){
    var r = REQS[i], v = null;
    try{ v = r.test(c); }catch(e){ v = null; }
    var st = v === true ? 'meets' : v === false ? 'fails' : 'unknown';
    if(st === 'meets') meets++; else if(st === 'fails') fails++; else unknown++;
    var why = null;
    if(st !== 'meets'){ try{ why = r.why(c); }catch(e){ why = null; } }
    rows.push({id:r.id, cat:r.cat, name:r.name, want:r.want, status:st, why:why});
  }
  var known = meets + fails;
  return {
    version: VERSION, rows: rows, meets: meets, fails: fails, unknown: unknown,
    total: REQS.length, known: known,
    /* scored on what is KNOWN, with the unknown count carried alongside so a
       score on two published fields never reads like a score on twelve */
    pct: known ? meets / known : null,
    confidence: REQS.length ? known / REQS.length : 0
  };
}

/* ---- roll it up across an edition -------------------------------------- */
var ROLL = null, ROLLSIG = '';
function rollup(){
  var X = L();
  var rows;
  try{ rows = window.LXDash && LXDash.rows && LXDash.rows.length ? LXDash.rows : null; }catch(e){ rows = null; }
  if(!rows){ try{ LXDash.render(); rows = LXDash.rows; }catch(e){ return null; } }
  if(!rows || !rows.length) return null;
  var sig = rows.length + ':' + VERSION;
  if(ROLL && ROLLSIG === sig) return ROLL;
  var cap = Math.min(rows.length, 6000);
  var step = Math.max(1, Math.floor(rows.length / cap));
  var per = {}, n = 0, full = 0, confSum = 0;
  /* "Clears every requirement" is zero in most markets, which is true and
     useless. The distribution of how MANY requirements a property fails is the
     thing that actually ranks a market, so it is counted alongside. */
  var dist = [];
  REQS.forEach(function(r){ per[r.id] = {meets:0, fails:0, unknown:0}; });
  for(var i = 0; i < rows.length && n < cap; i += step){
    var a;
    try{ a = assess(rows[i].l, rows[i].d); }catch(e){ continue; }
    n++; confSum += a.confidence;
    if(a.fails === 0 && a.meets > 0) full++;
    dist[a.fails] = (dist[a.fails] || 0) + 1;
    a.rows.forEach(function(x){ per[x.id][x.status]++; });
  }
  for(var k = 0; k < dist.length; k++) if(dist[k] == null) dist[k] = 0;
  ROLL = {n:n, sampled:rows.length, full:full, per:per, dist:dist,
          meanConfidence: n ? confSum/n : 0};
  ROLLSIG = sig;
  return ROLL;
}

window.LXStd = {assess: assess, rollup: rollup, REQS: REQS, CATS: CATS, VERSION: VERSION};
})();
