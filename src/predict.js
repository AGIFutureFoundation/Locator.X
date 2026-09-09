/* locator.x - predictions, and the backtest that says whether to believe them.
   ----------------------------------------------------------------------------
   Every forecasting tool in this trade shows a line going up and a confidence band
   pulled out of the air. This one refuses to do that. The method is stated, it is
   deliberately simple, and before any projection is drawn it is RUN BACKWARDS
   against the data the app already holds: hold out the last H months, project from
   the earlier window only, and compare against what actually happened.

   The band you see is that measured error, not an assumed distribution. If the
   backtest says the method was wrong by 4% at six months, the band is 4% wide and
   the page says so. Where the backtest is bad, the page says the method does not
   work for that series rather than drawing it prettier.

   What it will not do: it will not forecast an individual property. A parcel has
   one recorded value and no history; the only thing with a history here is the ZIP
   index. Projecting a parcel would be dressing a market series in a street address. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function N(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; }

var HORIZON_SHORT = 6;     // months projected, short horizon
var WINDOW_SHORT  = 12;    // months fitted on, short horizon
var HORIZON_LONG  = 36;    // months projected, long horizon — three years
var WINDOW_LONG   = 24;    // months fitted on, long horizon. A three-year projection fit
                            // on the same twelve months as a six-month one would be
                            // reading noise as trend, so the long mode leans on twice
                            // the history. Still one parameter; still a constant-growth fit.
var LONG_MINMONTHS = WINDOW_LONG + HORIZON_LONG; // 60 — the least history that lets the
                            // long horizon be backtested out-of-sample at all: fit on
                            // WINDOW_LONG months, hold out HORIZON_LONG, compare.
var MINPTS  = 14;         // a series shorter than this is not forecast at all
var MODE = 'short';        // 'short' | 'long' — which horizon is currently shown
var HORIZON = HORIZON_SHORT, WINDOW = WINDOW_SHORT;  // active values; setMode() reassigns these

/* ---- the method, stated once -------------------------------------------
   Ordinary least squares on the last WINDOW months of the log series, which is a
   constant-growth-rate fit. Chosen because it has one parameter, cannot oscillate,
   and its failure mode (missing a turn) is obvious in a backtest rather than
   hidden. Anything fancier would fit this much data better and generalise worse.

   Two horizons are offered, never blended: a 6-month read and a 3-year read. The
   long one only ever appears where there is enough published history to backtest
   it exactly the way the short one is backtested — hold out the last 36 months,
   fit on what came before, compare the projection against what the index
   actually did over those three years. Where that history is not published, the
   toggle for it does not render, rather than projecting three years off a curve
   nobody has checked. */
function longOK(){ var D = data(); return !!D && D.months.length >= LONG_MINMONTHS; }
function setMode(m){
  if(m !== 'short' && m !== 'long') return;
  if(m === 'long' && !longOK()) return;
  if(m === MODE) return;
  MODE = m;
  HORIZON = m === 'long' ? HORIZON_LONG : HORIZON_SHORT;
  WINDOW  = m === 'long' ? WINDOW_LONG  : WINDOW_SHORT;
  invalidate();
  render();
}
function fitLog(vals, from, to){
  var n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for(var i = from; i < to; i++){
    var v = vals[i];
    if(v == null || v <= 0) continue;
    var x = i, y = Math.log(v);
    n++; sx += x; sy += y; sxx += x * x; sxy += x * y;
  }
  if(n < 6) return null;
  var d = n * sxx - sx * sx;
  if(!d) return null;
  var b = (n * sxy - sx * sy) / d;
  var a = (sy - b * sx) / n;
  return {a: a, b: b, n: n, monthly: Math.exp(b) - 1};
}
function project(fit, i){ return fit ? Math.exp(fit.a + fit.b * i) : null; }

/* ---- the backtest ------------------------------------------------------- */
function backtest(series, H){
  H = H || HORIZON;
  var errs = [], used = 0, skipped = 0;
  for(var k in series){
    var v = series[k];
    if(!v || v.length < MINPTS + H){ skipped++; continue; }
    var cut = v.length - H;
    var fit = fitLog(v, Math.max(0, cut - WINDOW), cut);
    if(!fit){ skipped++; continue; }
    var act = v[v.length - 1], pred = project(fit, v.length - 1);
    if(act == null || pred == null || act <= 0){ skipped++; continue; }
    errs.push((pred - act) / act);
    used++;
  }
  if(errs.length < 8) return null;
  errs.sort(function(a, b){ return a - b; });
  var q = function(p){ var i = (errs.length - 1) * p; var lo = Math.floor(i), hi = Math.ceil(i);
    return lo === hi ? errs[lo] : errs[lo] + (errs[hi] - errs[lo]) * (i - lo); };
  var abs = errs.map(Math.abs).sort(function(a, b){ return a - b; });
  return {
    n: used, skipped: skipped, horizon: H,
    median: q(0.5), p10: q(0.10), p90: q(0.90),
    mae: abs[Math.floor(abs.length / 2)],
    within2: errs.filter(function(e){ return Math.abs(e) <= 0.02; }).length / errs.length,
    within5: errs.filter(function(e){ return Math.abs(e) <= 0.05; }).length / errs.length,
    bias: errs.reduce(function(a, b){ return a + b; }, 0) / errs.length
  };
}

/* ---- one ZIP's OWN held-out error --------------------------------------
   The pooled backtest above gives a band, and that band is the same number for
   every ZIP - which makes it useless as a per-bubble encoding even though it
   looks like one. This gives the per-ZIP version: fit on the twelve months
   before the holdout, predict the last month, and report the signed error on
   the one month the fit never saw.

   It is ONE observation, not a distribution, and the page says so. One
   observation is still a real measurement of this series, which is more than a
   pooled percentile repeated 300 times can claim. */
function holdout(series, H){
  H = H || HORIZON;
  if(!series || series.length < MINPTS + H) return null;
  var cut = series.length - H;
  var fit = fitLog(series, Math.max(0, cut - WINDOW), cut);
  if(!fit) return null;
  var act = series[series.length - 1], pred = project(fit, series.length - 1);
  if(act == null || pred == null || act <= 0) return null;
  return {err: (pred - act) / act, months: H, actual: act, predicted: pred};
}

/* ---- pull the two index series out of the edition ---------------------- */
var CACHE = null;
function data(){
  if(CACHE) return CACHE;
  var M = null;
  try{ M = L().M; }catch(e){}
  if(!M || !M.zips || !M.months) return null;
  var val = {}, rent = {}, nv = 0, nr = 0;
  for(var z in M.zips){
    var r = M.zips[z];
    if(r && r.v && r.v.filter(function(x){ return x != null; }).length >= MINPTS){ val[z] = r.v; nv++; }
    if(r && r.r && r.r.filter(function(x){ return x != null; }).length >= MINPTS){ rent[z] = r.r; nr++; }
  }
  CACHE = {months: M.months, val: val, rent: rent, nv: nv, nr: nr,
           btVal: backtest(val), btRent: backtest(rent)};
  return CACHE;
}
function invalidate(){ CACHE = null; COV = null; }

/* ---- coverage --------------------------------------------------------------
   The question this answers is the one that decides whether anything else on the
   page means anything: do the ZIPs that carry an index series overlap the ZIPs
   that carry parcels in THIS edition? They are two separate bundles, and there is
   no rule that says they must line up. Measured across the twelve editions this
   ranges from 100% down to zero, and an edition at zero would otherwise render a
   confident, fully-populated forecast page describing ZIPs in which it holds not
   one property. So it is measured, stated at the top of the page in the same size
   as everything else, and below a floor the field simply is not drawn. */
var COV = null;
function coverage(){
  if(COV) return COV;
  var D = data(); if(!D) return null;
  var all;
  try{ all = L().allListings(); }catch(e){ return null; }
  var n = all.length, inVal = 0, inBoth = 0, zips = {}, zv = 0, zb = 0;
  for(var i = 0; i < n; i++){
    var z = all[i].zip; if(!z) continue;
    if(!zips[z]){ zips[z] = 1; if(D.val[z]) zv++; if(D.val[z] && D.rent[z]) zb++; }
    if(D.val[z]) inVal++;
    if(D.val[z] && D.rent[z]) inBoth++;
  }
  var nz = Object.keys(zips).length;
  COV = {records:n, zips:nz, recVal:inVal, recBoth:inBoth,
         pctVal: n ? inVal / n : 0, pctBoth: n ? inBoth / n : 0,
         zipVal: zv, zipBoth: zb, idxZips: Object.keys(D.val).length};
  return COV;
}

/* ---- forecast one ZIP, honestly ---------------------------------------- */
function forecastZip(zip, which){
  var D = data(); if(!D) return null;
  var s = (which === 'rent' ? D.rent : D.val)[zip];
  var bt = (which === 'rent' ? D.btRent : D.btVal);
  if(!s) return null;
  var fit = fitLog(s, Math.max(0, s.length - WINDOW), s.length);
  if(!fit) return null;
  var last = null, lastI = -1;
  for(var i = s.length - 1; i >= 0; i--){ if(s[i] != null){ last = s[i]; lastI = i; break; } }
  if(last == null) return null;
  var pts = [];
  for(var h = 1; h <= HORIZON; h++) pts.push(project(fit, lastI + h));
  var end = pts[pts.length - 1];
  return {
    zip: zip, which: which, last: last, points: pts, end: end,
    monthly: fit.monthly, annual: Math.pow(1 + fit.monthly, 12) - 1,
    change: (end - last) / last,
    /* The band is the backtest's measured error - but applied in the right
       DIRECTION, which is easy to get backwards and was.

       The error is recorded as err = (predicted - actual) / actual, so the
       actual equals predicted / (1 + err). A NEGATIVE error therefore means the
       method came in LOW and reality was higher. Adding the error to the
       projection, as this did, put the band on the wrong side of the point
       estimate: this method's p10 is -3.9% and its p90 +1.2%, i.e. it runs cold,
       so the honest band leans UP and the old one leaned down.

         lo = end / (1 + p90)   the largest over-prediction -> smallest actual
         hi = end / (1 + p10)   the largest under-prediction -> largest actual */
    lo: bt ? end / (1 + bt.p90) : null,
    hi: bt ? end / (1 + bt.p10) : null,
    bt: bt
  };
}

/* ---- leading indicators per corridor, from what is already carried ----- */
function indicators(){
  var C = window.LXCORRIDORS; if(!C || !C.metros) return [];
  var D = data();
  var all = L().allListings();
  var byMetro = {};
  for(var i = 0; i < all.length; i++){
    var l = all[i], k = l.nb || l.county; if(!k) continue;
    var g = byMetro[k] || (byMetro[k] = {zips: {}, n: 0});
    g.n++; if(l.zip) g.zips[l.zip] = 1;
  }
  var out = [];
  C.metros.forEach(function(m){
    var key = m.dataKey || m.metro, g = byMetro[key];
    var fz = [], fr = [];
    if(g && D){
      for(var z in g.zips){
        var f = forecastZip(z, 'val'); if(f) fz.push(f.annual);
        var f2 = forecastZip(z, 'rent'); if(f2) fr.push(f2.annual);
      }
    }
    var med = function(a){ if(!a.length) return null; var s = a.slice().sort(function(x,y){return x-y;}); return s[Math.floor(s.length/2)]; };
    out.push({
      metro: m.metro, n: g ? g.n : 0, zips: fz.length,
      valTrend: med(fz), rentTrend: med(fr),
      jobs: m.jobs || null, permits: m.permits || null,
      jpp: (m.jobs && m.permits) ? m.jobs / m.permits : null,
      students: m.students || null
    });
  });
  /* A corridor this edition holds no property in is not a row with dashes in it -
     it is a corridor this edition cannot speak to, and listing twenty of them
     buries the two it can. Dropped, and the count is stated below the table. */
  var total = out.length;
  out = out.filter(function(r){ return r.n > 0; });
  out.sort(function(a, b){
    if(a.jpp == null) return 1; if(b.jpp == null) return -1; return b.jpp - a.jpp;
  });
  out.dropped = total - out.length;
  return out;
}

/* ---- rendering ---------------------------------------------------------- */
function pct(v, d){ return v == null ? '—' : (v >= 0 ? '+' : '') + (v * 100).toFixed(d == null ? 1 : d) + '%'; }

function btBlock(bt, label){
  if(!bt) return '<p style="font-size:13px;color:var(--ink2);margin:0">This edition does not carry enough '
    + esc(label) + ' series to backtest the method, so <b>no projection is offered for it</b>. '
    + 'A forecast that has not been tested against held-out months is a drawing, not a prediction.</p>';
  var good = bt.within5 >= 0.6;
  return '<div style="font-size:13px;color:var(--ink2);line-height:1.8">'
    + 'Held out the last <b>' + bt.horizon + ' months</b> of <b>' + L().fmtN(bt.n) + '</b> ZIP series, fitted on the '
    + WINDOW + ' months before the cut, and compared the projection against what actually happened.<br>'
    + 'Median error <b>' + pct(bt.median, 2) + '</b> &middot; typical absolute error <b>' + (bt.mae * 100).toFixed(2) + '%</b> &middot; '
    + '<b>' + Math.round(bt.within2 * 100) + '%</b> landed within 2% and <b>' + Math.round(bt.within5 * 100) + '%</b> within 5%.<br>'
    + 'Systematic bias <b>' + pct(bt.bias, 2) + '</b> — '
    + (Math.abs(bt.bias) < 0.005 ? 'effectively unbiased over this window.'
       : bt.bias > 0 ? 'the method runs <b>hot</b>: it over-predicted more often than not, so read the projection as a ceiling.'
                     : 'the method runs <b>cold</b>: it under-predicted more often than not.')
    + '<br><b>' + (good ? 'Usable at this horizon' : 'NOT reliable at this horizon')
    + '</b> — ' + (good
        ? 'a constant-growth fit tracked this index closely enough over ' + bt.horizon + ' months to be worth reading, with the band below set to the measured error rather than an assumed one.'
        : 'fewer than three in five projections landed within 5%. The projections below are shown anyway, with their real error, precisely so the weakness is visible rather than hidden.')
    + '</div>';
}

function render(){
  var host = $('#predroot'); if(!host) return;
  invalidate();
  var D = data();
  if(!D){
    host.innerHTML = '<div class="chart"><p style="font-size:13.5px;color:var(--ink2);margin:0">'
      + 'This edition carries no published monthly index series, so there is nothing to project and nothing to '
      + 'backtest. A predictions page with no series behind it would be an invention, so none is drawn.</p></div>';
    return;
  }
  var ind = indicators();

  var cv = coverage();
  var h = '';

  /* the coverage statement goes FIRST, because it decides what the rest is worth.
     NOTE: this assigns h (not +=) since it must always be the opening block —
     anything appended before this point would be silently discarded. */
  if(cv){
    var pc = Math.round(cv.pctVal * 100);
    var tone = pc >= 85 ? 'good' : pc >= 40 ? 'warn' : 'bad';
    var col = pc >= 85 ? 'var(--good)' : pc >= 40 ? 'var(--warn)' : 'var(--bad)';
    h = '<div class="chart" style="border-left:4px solid ' + col + ';margin-bottom:14px">'
      + '<p class="eyebrow" style="margin:0 0 3px">Coverage &middot; read this before anything below</p>'
      + '<h3 style="margin:0 0 6px">' + pc + '% of this edition&rsquo;s ' + L().fmtN(cv.records)
      + ' records sit in a ZIP that has an index series</h3>'
      + '<p style="font-size:13px;color:var(--ink2);max-width:88ch;margin:0 0 6px">The parcels and the monthly '
      + 'index arrive in two separate bundles and nothing guarantees they cover the same ZIPs. This edition holds '
      + 'parcels in <b>' + L().fmtN(cv.zips) + '</b> ZIPs; <b>' + L().fmtN(cv.zipVal) + '</b> of those carry a '
      + 'value series and <b>' + L().fmtN(cv.zipBoth) + '</b> carry both value and rent. The index bundle itself '
      + 'holds ' + L().fmtN(cv.idxZips) + ' ZIPs, most of which hold no property here.</p>'
      + (pc >= 85
         ? '<p style="font-size:13px;color:var(--ink2);margin:0">Coverage is good, so a forecast on this page '
           + 'describes the same geography the parcels are in.</p>'
         : pc >= 40
         ? '<p style="font-size:13px;color:var(--warn);margin:0"><b>Coverage is partial.</b> Roughly '
           + (100 - pc) + '% of the parcels in this edition sit in a ZIP with no published series, so nothing '
           + 'below speaks to them. Read every projection as covering the measured part only.</p>'
         : '<p style="font-size:13px;color:var(--bad);margin:0"><b>Coverage is too thin to forecast from.</b> '
           + 'The index bundle in this edition does not meaningfully overlap the ZIPs its parcels are in, so the '
           + 'forecast field and the projection cone are not drawn. Drawing them would produce a confident page '
           + 'about ZIPs in which this edition holds almost no property &mdash; which is worse than an empty '
           + 'page, because it looks like an answer. The fix is a matching index bundle for these metros, not a '
           + 'wider error band.</p>')
      + '</div>';
  }

  /* horizon toggle — only appears where the long horizon can actually be
     backtested (LONG_MINMONTHS of published history); otherwise there is
     nothing to switch to and the toggle would just be an unearned promise. */
  if(longOK()){
    h += '<div class="chart" style="margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
      + '<p class="eyebrow" style="margin:0">Horizon</p>'
      + '<div class="segctl" role="group">'
      + '<button type="button" data-hz="short" class="' + (MODE==='short'?'on':'') + '">6 months</button>'
      + '<button type="button" data-hz="long" class="' + (MODE==='long'?'on':'') + '">3-year outlook</button>'
      + '</div>'
      + '<p style="font-size:12.5px;color:var(--muted);margin:0">'
      + (MODE==='long'
         ? 'Fit on the ' + WINDOW_LONG + ' months before a cut, held-out against the ' + HORIZON_LONG + ' months after it — the same out-of-sample test as the 6-month read, just run at three-year range on the ' + D.months.length + ' months of published history this edition carries.'
         : 'Switch to see the same method backtested at a 3-year range on this edition&rsquo;s ' + D.months.length + ' months of published history.')
      + '</p></div>';
  }

  h += '<div class="tiles" style="margin-bottom:14px">'
    + tile('Record coverage', cv ? Math.round(cv.pctVal * 100) + '%' : '—', 'parcels in a ZIP with a series')
    + tile('ZIP value series', L().fmtN(D.nv), 'long enough to fit and test')
    + tile('Projection horizon', HORIZON + ' months', 'fitted on the ' + WINDOW + ' months before')
    + tile('Value method, tested', D.btVal ? Math.round(D.btVal.within5 * 100) + '% within 5%' : 'not testable',
           D.btVal ? 'on ' + L().fmtN(D.btVal.n) + ' held-out series' : 'too few series')
    + '</div>';

  h += '<div class="chart"><p class="eyebrow">The method, and the test that decides whether to trust it</p>'
    + '<h3 style="margin:2px 0 8px">Backtest before forecast</h3>'
    + '<p style="font-size:13px;color:var(--ink2);max-width:84ch;margin:0 0 10px">The method is an ordinary '
    + 'least-squares fit on the log of the last ' + WINDOW + ' months — a constant-growth-rate model with one '
    + 'parameter. It was chosen because it cannot oscillate and because its failure mode, missing a turning '
    + 'point, shows up plainly in a backtest instead of hiding. Anything more elaborate would fit this much '
    + 'data better and generalise worse.</p>'
    + '<div style="display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">'
    + '<div><p class="eyebrow" style="margin:0 0 4px">Value index</p>' + btBlock(D.btVal, 'value') + '</div>'
    + '<div><p class="eyebrow" style="margin:0 0 4px">Rent index</p>' + btBlock(D.btRent, 'rent') + '</div>'
    + '</div>'
    + '<p class="src">The band on every projection below is the 10th-to-90th percentile of the measured '
    + 'backtest error, applied to the projected value. It is not a confidence interval from a distributional '
    + 'assumption — it is how wrong this method actually was on this data.</p></div>';

  /* the 3D forecast field - drawn only where the geographies actually overlap */
  var FIELD_FLOOR = 0.15;
  if(cv && cv.pctVal >= FIELD_FLOOR){
  h += '<div class="chart tall" style="margin-top:14px"><p class="eyebrow">The forecast field</p>'
    + '<h3 style="margin:2px 0 4px">Every ZIP placed by what its value and its rent are actually doing</h3>'
    + '<p style="font-size:13px;color:var(--ink2);max-width:84ch;margin:0 0 8px">Across: the fitted annual '
    + 'value trend. Up: the fitted annual rent trend. The dashed diagonal is where the two move together &mdash; '
    + '<b>above it rent is outrunning value and yields are widening; below it value is outrunning rent and '
    + 'yields are compressing</b>, which looks like good news on a price chart and is not, because the same '
    + 'building now costs more and pays the same. Bubble size is how much stock the ZIP holds; the skin is the '
    + 'mosaic of housing categories inside it; the ring is how wide the measured backtest band is. '
    + 'Hover for the numbers, click a bubble to draw its cone.</p>'
    + '<div id="pvfield"></div><div id="pvlegend" style="margin-top:8px"></div></div>';

  h += '<div class="chart tall" style="margin-top:14px"><p class="eyebrow">Projection cone</p>'
    + '<h3 style="margin:2px 0 4px" id="pvconetitle">Select a ZIP above</h3>'
    + '<p style="font-size:13px;color:var(--ink2);max-width:84ch;margin:0 0 8px">Solid line and lit points are '
    + '<b>published</b> months. The dashed path and the growing spheres are <b>projected</b>, and the cone '
    + 'around them is the tenth-to-ninetieth percentile of the error this method actually made on held-out '
    + 'months. It widens with distance because that is what the backtest measured, not because a distribution '
    + 'was assumed. A cone that looks wide is the honest picture of a ' + HORIZON + '-month forecast on '
    + D.months.length + ' months of data.</p>'
    + '<div id="pvcone"></div></div>';
  }

  /* dataset correlations - built from the same fitted trends above, across
     every ZIP (and, where held, corridor) this edition carries, rather than
     one series at a time. Unconditional: it has its own internal
     not-enough-data message and must not be gated behind whether this
     edition happens to hold multiple corridors. */
  h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">Dataset correlations</p>'
    + '<h3 style="margin:2px 0 8px">What moves with what, across every ZIP this edition holds</h3>'
    + '<div id="correlroot"></div></div>';

  /* per-corridor leading indicators */
  if(ind.length){
  h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">Leading indicators by corridor</p>'
    + '<h3 style="margin:2px 0 8px">What is moving before prices do</h3>'
    + '<p style="font-size:13px;color:var(--ink2);max-width:84ch;margin:0 0 10px">Announced jobs per housing '
    + 'unit permitted is the pressure; the fitted index trend is what the market has actually been doing. '
    + '<b>The two disagreeing is the interesting case</b> — high pressure with a flat index is either an '
    + 'opportunity or a signal that the announcement is not converting, and this app cannot tell you which. '
    + 'An announced job is an intention with a date and a source, never a delivered job.</p>'
    + '<div class="tablewrap"><table class="tbl"><thead><tr><th>Corridor</th><th class="r">Jobs per permit</th>'
    + '<th class="r">Value trend, annualised</th><th class="r">Rent trend, annualised</th>'
    + '<th class="r">ZIP series</th><th class="r">Records</th></tr></thead><tbody>'
    + ind.map(function(r){
        var vt = r.valTrend, rt = r.rentTrend;
        var col = function(v){ return v == null ? 'var(--muted)' : v > 0.02 ? 'var(--good)' : v < -0.01 ? 'var(--bad)' : 'var(--ink2)'; };
        return '<tr><td><b>' + esc(r.metro) + '</b></td>'
          + '<td class="r">' + (r.jpp == null ? '<span style="color:var(--muted)">not published</span>' : r.jpp.toFixed(2)) + '</td>'
          + '<td class="r" style="color:' + col(vt) + '">' + pct(vt) + '</td>'
          + '<td class="r" style="color:' + col(rt) + '">' + pct(rt) + '</td>'
          + '<td class="r">' + (r.zips || '<span style="color:var(--muted)">0</span>') + '</td>'
          + '<td class="r">' + L().fmtN(r.n) + '</td></tr>';
      }).join('')
    + '</tbody></table></div>'
    + '<p class="src">A blank trend means no ZIP in that corridor carries an index series long enough to fit — '
    + 'a gap in the published data, never a flat market. Trends are the median across that corridor&rsquo;s ZIPs.'
    + (ind.dropped ? ' <b>' + ind.dropped + '</b> further corridor' + (ind.dropped === 1 ? ' is' : 's are')
        + ' tracked by this platform but hold no parcel in this edition, so ' + (ind.dropped === 1 ? 'it is' : 'they are')
        + ' not listed here rather than shown as a row of dashes.' : '')
    + '</p></div>';
  }

  /* the strongest and weakest projected ZIPs, with their real bands */
  var fz = [];
  for(var z in D.val){ var f = forecastZip(z, 'val'); if(f) fz.push(f); }
  fz.sort(function(a, b){ return b.annual - a.annual; });
  if(fz.length >= 6){
    var rows = fz.slice(0, 8).concat(fz.slice(-4));
    h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">Projected ZIP value trend</p>'
      + '<h3 style="margin:2px 0 8px">The eight fastest and four slowest, with their measured error band</h3>'
      + '<div class="tablewrap"><table class="tbl"><thead><tr><th>ZIP</th><th class="r">Latest index</th>'
      + '<th class="r">Fitted annual rate</th><th class="r">Projected in ' + HORIZON + ' months</th>'
      + '<th class="r">Backtest band</th></tr></thead><tbody>'
      + rows.map(function(f){
          return '<tr><td><b>' + esc(f.zip) + '</b></td>'
            + '<td class="r">' + L().fmt$(Math.round(f.last)) + '</td>'
            + '<td class="r" style="color:' + (f.annual > 0 ? 'var(--good)' : 'var(--bad)') + '">' + pct(f.annual) + '</td>'
            + '<td class="r">' + L().fmt$(Math.round(f.end)) + '</td>'
            + '<td class="r" style="color:var(--muted)">' + (f.lo ? L().fmt$(Math.round(f.lo)) + ' to ' + L().fmt$(Math.round(f.hi)) : '—') + '</td></tr>';
        }).join('')
      + '</tbody></table></div>'
      + '<p class="src">A fitted rate is what the last ' + WINDOW + ' months implies if nothing changes, which is '
      + 'the one thing that never holds. Read the band, not the point.</p></div>';
  }

  h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">What this will not do</p>'
    + '<div style="font-size:13.5px;color:var(--ink2);line-height:1.8;max-width:84ch">'
    + '<p style="margin:0 0 8px"><b>It will not forecast an individual property.</b> A parcel here has one '
    + 'recorded value and no history. The only thing with a history is the ZIP index, so projecting a parcel '
    + 'would be dressing a market series in a street address and calling it insight.</p>'
    + '<p style="margin:0 0 8px"><b>It does not know about anything that has not happened yet.</b> A rate move, '
    + 'a plant cancellation, a zoning change or a hurricane are all invisible to a curve fitted on past months. '
    + 'This catalogue records four Louisiana projects that were announced and then cancelled or abandoned '
    + 'outright; none of them appeared in any index until long after.</p>'
    + '<p style="margin:0"><b>It is not investment advice</b> and no figure here is a valuation. Use it to rank '
    + 'where to spend attention, never as a basis for an offer.</p></div></div>';

  host.innerHTML = h;
  host.querySelectorAll('button[data-hz]').forEach(function(btn){
    btn.addEventListener('click', function(){ setMode(btn.getAttribute('data-hz')); });
  });
  if(window.LXPredictViz && document.getElementById('pvfield')){ try{ LXPredictViz.reset(); LXPredictViz.mount(); }catch(e){} }
  if(window.LXCorrelate && document.getElementById('correlroot')){ try{ LXCorrelate.render(); }catch(e){} }
  if(window.LXPanels) setTimeout(function(){ LXPanels.scan('predict'); }, 140);
}
function tile(k, v, note){
  return '<div class="tile"><p class="eyebrow" style="margin:0">' + esc(k) + '</p>'
    + '<p class="big num" style="margin:4px 0 2px">' + v + '</p>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:0">' + esc(note) + '</p></div>';
}

window.LXPredict = {render: render, forecastZip: forecastZip, backtest: backtest, coverage: coverage, holdout: holdout,
                    indicators: indicators, data: data, invalidate: invalidate, fitLog: fitLog, project: project,
                    setMode: setMode, longOK: longOK, mode: function(){ return MODE; },
                    horizon: function(){ return HORIZON; }, window: function(){ return WINDOW; }};
})();
