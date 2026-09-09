/* locator.x - the outlook: what the index says about this one property, and
   what the deal needs from it.
   ----------------------------------------------------------------------------
   The underwriting sheet has always been a snapshot with two assumptions bolted
   on: an appreciation rate and a rent-growth rate. Both were guesses. The
   appreciation default was the ZIP's LAST TWELVE MONTHS of change - one reading,
   extrapolated for five years, with no error attached - and rent growth was a
   flat 3% typed into a settings panel.

   This module replaces both with something measured, and then does the thing
   that actually decides a deal: it asks what growth rate the property NEEDS in
   order to clear your target, and puts that number next to what the market has
   actually been doing and how wrong that measurement has been.

   Three rules it does not break:
     1. No series, no outlook. A ZIP with no published index gets a sentence
        saying so, never a zero trend and never a default that looks measured.
     2. The band is the backtest's, not an assumption. Every path here comes from
        the p10-p90 of the error this method actually made on held-out months.
     3. A required rate is not a forecast. "You need +2.1% a year" is a fact about
        the deal; whether the market delivers it is not something this app knows. */
(function(){
'use strict';
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function N(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; }

/* ---- the per-property outlook ------------------------------------------ */
function outlookFor(l){
  if(!l || !l.zip) return null;
  var P = window.LXPredict; if(!P) return null;
  var D = null; try{ D = P.data(); }catch(e){}
  if(!D) return null;

  var fv = null, fr = null;
  try{ fv = P.forecastZip(l.zip, 'val'); }catch(e){}
  try{ fr = P.forecastZip(l.zip, 'rent'); }catch(e){}
  if(!fv && !fr){
    return {none:true, zip:l.zip,
      why:'No monthly index is published for ZIP ' + l.zip + ', so this property has no measured '
        + 'trend behind it. The appreciation and rent-growth figures in the sheet are your '
        + 'assumptions alone - which is a fine place to start and a bad place to finish.'};
  }
  var ho = null;
  try{ ho = P.holdout(D.val[l.zip]); }catch(e){}

  /* The pooled backtest band, as a LEVEL factor - and deliberately not as a rate.

     err = (predicted - actual) / actual, so actual = predicted / (1 + err); a
     negative error means the method came in low. That is the whole measurement:
     how far off the LEVEL of the index was after six months.

     The first version of this turned that level error into an annual growth-rate
     adjustment by raising it to the 12/h power and compounding it across a
     five-year hold. That is wrong, and wrong in a way that looks sophisticated:
     a 1.16x level error at six months became "+16% a year, forever", which blew
     past the extrapolation cap on every property tested and pinned all three
     paths to the ceiling. A one-off level miss is not evidence about a long-run
     growth rate.

     So the band is applied as what it is: a single level shift on rents and on
     the exit value, at the size the method actually missed by. Six months of
     measured error is a FLOOR on five years of uncertainty, never the whole of
     it, and the page says so rather than implying the band is complete. */
  var bt = D.btVal, btr = D.btRent;
  var band = function(b){
    if(!b) return null;
    return {loF: 1/(1 + b.p90),     /* the largest over-prediction -> lowest level */
            hiF: 1/(1 + b.p10),     /* the largest under-prediction -> highest level */
            horizon: b.horizon || 6};
  };
  return {
    zip: l.zip,
    valTrend: fv ? fv.annual : null,
    rentTrend: fr ? fr.annual : null,
    valBand: band(bt), rentBand: band(btr),
    /* the same band expressed as a plain annual-rate delta, for reading rather
       than for arithmetic - a factor of 1.04 is +4 points on a rate near zero */
    valBandPts: bt ? {lo:(band(bt).loF-1)*100, hi:(band(bt).hiF-1)*100} : null,
    rentBandPts: btr ? {lo:(band(btr).loF-1)*100, hi:(band(btr).hiF-1)*100} : null,
    holdout: ho ? ho.err : null,
    months: D.months ? D.months.length : null,
    /* the read that a price chart hides */
    compress: (fv && fr && fv.annual != null && fr.annual != null)
      ? fv.annual - fr.annual : null
  };
}

/* ---- what rate does this deal NEED? ------------------------------------
   Bisection on the rent-growth rate that makes the five-year IRR clear a target.
   Solved rather than guessed because the relationship runs through debt service,
   an expense stack that grows at its own rate, and a sale at year five - there is
   no closed form worth trusting and a slider is not an answer. */
function requiredRate(runner, target, lo, hi){
  lo = lo == null ? -0.15 : lo; hi = hi == null ? 0.25 : hi;
  var f = function(r){ var v = runner(r); return (v == null || !isFinite(v)) ? null : v - target; };
  var a = f(lo), b = f(hi);
  if(a == null || b == null) return null;
  if(a > 0) return {rate: lo, atFloor: true};        /* clears even at the floor */
  if(b < 0) return {rate: null, impossible: true};   /* fails even at the ceiling */
  for(var i = 0; i < 48; i++){
    var m = (lo + hi) / 2, v = f(m);
    if(v == null) return null;
    if(v < 0) lo = m; else hi = m;
  }
  return {rate: (lo + hi) / 2};
}

/* ---- run one five-year path at a given pair of rates -------------------
   A reduced copy of the sheet's own year loop. It is deliberately the same
   arithmetic: if this diverged from the sheet, the outlook would be describing a
   different deal from the one on screen. */
function path(l, u, uw, apprPct, rentPct, mul){
  mul = mul || {};
  var rentMul = mul.rent == null ? 1 : mul.rent;
  var exitMul = mul.exit == null ? 1 : mul.exit;
  var X = L(), a = X.state.assump;
  var fin = u.finOpt, k = uw.ds && uw.loan ? null : null;
  var loan = uw.loan, ds = uw.ds;
  var v = uw.arv, bal = loan, rr = uw.rent * rentMul;
  var flows = [-uw.cash], years = [];
  var tax = uw.tax, ins = uw.ins, hoa = uw.hoa, util = uw.util;
  var rm = fin.rate / 100 / 12, ann = loan ? (ds - loan * (fin.mi || 0) / 100) : 0;
  for(var y = 1; y <= 5; y++){
    v *= 1 + apprPct / 100;
    rr *= 1 + rentPct / 100;
    var noiY = rr * (1 - a.vacancy / 100)
             - (tax * Math.pow(1.02, y - 1) + ins + rr * (a.maint + a.capex) / 100
                + (u.selfManage ? 0 : rr * (1 - a.vacancy / 100) * a.mgmt / 100) + hoa + util);
    for(var m = 0; m < 12; m++){ var i2 = bal * rm; bal -= (ann / 12 - i2); }
    var cfy = noiY - ds;
    years.push({y:y, value:v, noi:noiY, cf:cfy, dscr: ds > 0 ? noiY / ds : null, bal:bal});
    flows.push(y < 5 ? cfy : cfy + v * exitMul * 0.94 - bal);
  }
  var irr = null;
  var npv = function(r0){ return flows.reduce(function(s, c, i){ return s + c / Math.pow(1 + r0, i); }, 0); };
  if(npv(-0.9) > 0 && npv(2) < 0){
    var lo = -0.9, hi = 2;
    for(var q = 0; q < 60; q++){ var mid = (lo + hi) / 2; if(npv(mid) > 0) lo = mid; else hi = mid; }
    irr = lo;
  }
  return {irr:irr, years:years, exit:years[4].value * exitMul,
          exitNet:years[4].value * exitMul * 0.94 - years[4].bal,
          dscr5:years[4].dscr, cf5:years[4].cf, flows:flows};
}

/* ---- the whole outlook for one underwriting ---------------------------- */
function assess(l, u, uw){
  var o = outlookFor(l);
  if(!o || o.none) return {outlook:o};
  var vT = o.valTrend == null ? null : o.valTrend * 100;
  var rT = o.rentTrend == null ? null : o.rentTrend * 100;
  if(vT == null && rT == null) return {outlook:o};

  var vb = o.valBand, rb = o.rentBand;

  /* THE EXTRAPOLATION CAP.
     A twelve-month fit describes twelve months. ZIP 94103's rent index really did
     run from $3,383 to $4,287 in thirteen months - the fit is a correct reading of
     the record - but compounding +25.8% a year across a five-year hold puts rents
     at 3.15x, which no rent index sustains and which this app has no basis to
     assert. So the rate CARRIED INTO THE MULTI-YEAR MODEL is capped, the raw
     fitted figure is still reported, and the page says the cap fired and why.
     Same discipline as the room program: a model's arithmetic must not run past
     what its input can support. */
  var CAP = 10;
  /* Two different things can hit the ceiling and they mean different things, so
     they are recorded separately. A capped CENTRAL trend means this ZIP's own
     twelve-month fit is steeper than anything worth compounding for five years.
     A capped EDGE means only the pessimistic or optimistic path ran past it,
     which is far less interesting and must not be reported as though the fitted
     trend itself were extreme - the first draft of this note did exactly that
     and printed "the fitted trend runs at +27.6%" for a ZIP whose fitted trend
     was +9.8%. */
  var capCentral = [], capEdge = [];
  var cap = function(v, what, into){
    if(v == null) return v;
    if(v > CAP){ into.push(what + ' +' + v.toFixed(1) + '%'); return CAP; }
    if(v < -CAP){ into.push(what + ' ' + v.toFixed(1) + '%'); return -CAP; }
    return v;
  };
  var midAppr = cap(vT == null ? uw.appr : vT, 'value', capCentral);
  var midRent = cap(rT == null ? L().state.assump.rentGrowth : rT, 'rent', capCentral);
  var mid = {appr: midAppr, rent: midRent};


  /* All three paths run the SAME fitted growth rates. What separates them is the
     measured level error, applied once - because that is the only thing the
     backtest measured. */
  var loMul = {rent: rb ? rb.loF : 1, exit: vb ? vb.loF : 1};
  var hiMul = {rent: rb ? rb.hiF : 1, exit: vb ? vb.hiF : 1};
  var paths = {
    low:  path(l, u, uw, mid.appr, mid.rent, loMul),
    mid:  path(l, u, uw, mid.appr, mid.rent),
    high: path(l, u, uw, mid.appr, mid.rent, hiMul)
  };
  var loP = {appr: mid.appr, rent: mid.rent, rentMul: loMul.rent, exitMul: loMul.exit};
  var hiP = {appr: mid.appr, rent: mid.rent, rentMul: hiMul.rent, exitMul: hiMul.exit};
  /* what rent growth is required to hold DSCR 1.20 in year five, and to make the
     five-year IRR clear 8%? Two different questions and both worth asking. */
  var reqDscr = requiredRate(function(r){
    var p = path(l, u, uw, mid.appr, r * 100); return p.dscr5;
  }, 1.20);
  var reqIrr = requiredRate(function(r){
    var p = path(l, u, uw, mid.appr, r * 100); return p.irr;
  }, 0.08);

  return {outlook:o, mid:mid, lo:loP, hi:hiP, paths:paths, reqDscr:reqDscr, reqIrr:reqIrr,
          cap: CAP, capCentral: capCentral, capEdge: capEdge,
          rawAppr: vT, rawRent: rT,
          /* Compared against the RAW fitted trend, not the capped one. The cap
             exists to stop this app compounding a twelve-month reading across
             five years; it must not also rewrite what the market actually did.
             A requirement of +7.9% against a real +25.8% is the true comparison,
             even though only +10% is carried into the paths. */
          measured: rT == null ? null : rT / 100,
          measuredLo: null,   /* the band is a level, not a rate - see band() */
          bandPts: {rentLo: rb ? (rb.loF-1)*100 : null, rentHi: rb ? (rb.hiF-1)*100 : null,
                    valLo: vb ? (vb.loF-1)*100 : null, valHi: vb ? (vb.hiF-1)*100 : null,
                    horizon: (rb&&rb.horizon)||(vb&&vb.horizon)||6},
          rentPinned: rT != null && Math.abs(rT) > CAP};
}

window.LXOutlook = {outlookFor: outlookFor, assess: assess, path: path, requiredRate: requiredRate};
})();
