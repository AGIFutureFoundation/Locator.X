/* locator.x - dataset correlations.
   ----------------------------------------------------------------------------
   Everything else on the Predictions tab fits ONE series at a time and tests
   it against its own held-out months. This module asks a different question:
   across the ZIPs (and, where an edition holds them, the corridors) this
   edition actually carries, do two measures move together at all?

   Every pair here is built from data the app already computed for the page
   above it - predict.js's own fitted trends and its own OLS fitter - so a
   number quoted here can never disagree with the number quoted next to it.
   Nothing is fit twice with different code.

   The discipline this module exists to enforce: a correlation coefficient is
   not a finding by itself. It ships with n, a plain-language strength label,
   a crude "distinguishable from zero" flag (a real two-sided t-test on r, not
   a fabricated significance figure), and - for the two pairs where causation
   is easy to imply and hard to support - an explicit sentence saying what it
   does and does not show. A pair below MINPAIR points is not computed as a
   coefficient at all; a pair below a still-usable-but-thin sample is shown
   with its sample size stated loudly rather than hidden in a tooltip. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }

var MINPAIR = 15;   // fewer paired ZIPs than this and a coefficient is noise, not a finding
var MINSMALL = 8;   // the floor below which even a "small sample" pair is not worth showing

function pearson(pts){
  var n = pts.length; if(n < 2) return null;
  var sx = 0, sy = 0, i;
  for(i = 0; i < n; i++){ sx += pts[i][0]; sy += pts[i][1]; }
  var mx = sx / n, my = sy / n, sxx = 0, syy = 0, sxy = 0;
  for(i = 0; i < n; i++){ var dx = pts[i][0] - mx, dy = pts[i][1] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
  if(sxx <= 0 || syy <= 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}
function strength(r){
  var a = Math.abs(r);
  if(a < 0.10) return 'negligible';
  if(a < 0.30) return 'weak';
  if(a < 0.50) return 'moderate';
  if(a < 0.70) return 'strong';
  return 'very strong';
}
/* A real two-sided test of r against zero (Fisher's t-approximation), used
   only as a directional flag - not reported as a p-value, because at the
   sample sizes some of these pairs carry a normal-approximation t-test is a
   rough tool, and the page says so. */
function distinguishable(r, n){
  if(r == null || n < 4) return null;
  var denom = Math.sqrt(Math.max(1e-9, 1 - r * r));
  var t = r * Math.sqrt(n - 2) / denom;
  return Math.abs(t) > 1.98;
}
function lastOf(arr){ if(!arr) return null; for(var i = arr.length - 1; i >= 0; i--) if(arr[i] != null) return arr[i]; return null; }

/* The index bundle and this edition's own parcels are two separate bundles
   (predict.js's own coverage() note applies here verbatim) - a ZIP can carry
   a published series while holding not one property in THIS edition. Every
   per-ZIP correlation below must be built only from ZIPs this edition
   actually holds parcels in, or a "correlation" for a 0%-coverage edition
   like usnew5 would silently describe a different state's index series and
   call it this edition's data. */
var _ez = null;
function edZips(){
  if(_ez) return _ez;
  _ez = {};
  try{
    var all = window.LX.allListings();
    for(var i = 0; i < all.length; i++){ var z = all[i].zip; if(z) _ez[z] = 1; }
  }catch(e){}
  return _ez;
}

function computePairs(){
  var P = window.LXPredict; if(!P) return null;
  var D = P.data(); if(!D) return null;
  var out = [];
  var ez = edZips();

  /* 1. value trend vs rent trend - the yield-compression thesis, quantified
     across every ZIP at once instead of read one bubble at a time. */
  var vr = [];
  for(var z in D.val){
    if(!ez[z] || !D.rent[z]) continue;
    var fv = P.forecastZip(z, 'val'), fr = P.forecastZip(z, 'rent');
    if(fv && fr && isFinite(fv.annual) && isFinite(fr.annual)) vr.push([fv.annual * 100, fr.annual * 100]);
  }
  if(vr.length >= MINPAIR) out.push({
    id: 'vr', label: 'Value trend vs. rent trend, by ZIP',
    x: 'Fitted annual value trend, %', y: 'Fitted annual rent trend, %',
    n: vr.length, r: pearson(vr), pts: vr,
    note: 'One point per ZIP carrying both series. A high positive r means value and rent are moving together '
      + 'at similar paces across this edition’s ZIPs, so yields are roughly holding. A low or negative r means '
      + 'the two are decoupling — the compression the forecast field above flags one bubble at a time, stated '
      + 'here as one number for the whole edition.'
  });

  /* 2. current yield level vs value trend - income vs growth, measured rather
     than assumed as a trade-off. */
  var yv = [];
  for(z in D.val){
    if(!ez[z] || !D.rent[z]) continue;
    var lastV = lastOf(D.val[z]), lastR = lastOf(D.rent[z]);
    var fv2 = P.forecastZip(z, 'val');
    if(lastV > 0 && lastR != null && fv2 && isFinite(fv2.annual)) yv.push([(lastR * 12 / lastV) * 100, fv2.annual * 100]);
  }
  if(yv.length >= MINPAIR) out.push({
    id: 'yv', label: 'Current gross yield vs. value trend, by ZIP',
    x: 'Gross yield now, rent × 12 / value, %', y: 'Fitted annual value trend, %',
    n: yv.length, r: pearson(yv), pts: yv,
    note: 'Tests whether this edition’s already-high-yielding ZIPs are the ones still appreciating fastest, or '
      + 'whether yield and appreciation trade off against each other here. A negative r is the classic '
      + 'income-vs-growth split; a flat or positive one says this edition’s market is not currently pricing that '
      + 'trade-off. Either way this describes the ZIPs, not any one property in them.'
  });

  /* 3. momentum - does a ZIP's own earlier growth predict its own later growth,
     using nothing but its own published history split in two? This is the
     closest an honest reading of ONE run of history can get to testing
     persistence, and the note says plainly that it is one run, not a
     replicated experiment. */
  var mom = [];
  var months = D.months || [];
  if(months.length >= 24){
    for(z in D.val){
      if(!ez[z]) continue;
      var series = D.val[z];
      if(!series || series.length < 24) continue;
      var n2 = series.length;
      var priorFit = P.fitLog(series, Math.max(0, n2 - 24), n2 - 12);
      var recentFit = P.fitLog(series, n2 - 12, n2);
      if(priorFit && recentFit){
        var pa = Math.pow(1 + priorFit.monthly, 12) - 1, ra = Math.pow(1 + recentFit.monthly, 12) - 1;
        if(isFinite(pa) && isFinite(ra)) mom.push([pa * 100, ra * 100]);
      }
    }
  }
  if(mom.length >= MINPAIR) out.push({
    id: 'mom', label: 'Earlier-window growth vs. later-window growth (momentum)',
    x: 'Annualised value trend, first half of the published window, %',
    y: 'Annualised value trend, second half of the published window, %',
    n: mom.length, r: pearson(mom), pts: mom,
    note: 'Splits each ZIP’s own published history into two non-overlapping 12-month windows and fits each '
      + 'independently. This is two windows of ONE historical run for every ZIP, not an out-of-sample test across '
      + 'different periods or markets — read it as suggestive of whether recent appreciation tends to persist '
      + 'in this data, never as proof of a repeatable effect.'
  });

  /* 4. corridor-level: announced jobs per permit vs the index trend the
     corridor is actually posting - only in editions that hold multiple
     corridors, and n is stated loudly because it is always small. */
  var ind = P.indicators ? P.indicators() : [];
  var jv = [];
  ind.forEach(function(row){
    if(row.jpp != null && row.valTrend != null && isFinite(row.jpp) && isFinite(row.valTrend)) jv.push([row.jpp, row.valTrend * 100]);
  });
  if(jv.length >= MINSMALL) out.push({
    id: 'jv', label: 'Jobs announced per housing permit vs. value trend, by corridor',
    x: 'Announced jobs per unit permitted', y: 'Median fitted annual value trend, %',
    n: jv.length, r: pearson(jv), pts: jv, small: true,
    note: 'Corridor-level: n is the number of corridors this edition holds property in, which is always far too '
      + 'few for a reliable coefficient — shown for direction only. An announced job is an intention with a date '
      + 'and a source, never a delivered job, so this tests whether announced pressure lines up with what the '
      + 'index is already doing, not whether it will.'
  });

  return out;
}

/* ---- rendering ------------------------------------------------------------ */
function scatterSVG(pair){
  var w = 520, h = 210, pad = {l: 46, r: 12, t: 10, b: 30};
  var xs = pair.pts.map(function(p){ return p[0]; }), ys = pair.pts.map(function(p){ return p[1]; });
  var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
  var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
  if(xmin === xmax){ xmin -= 1; xmax += 1; }
  if(ymin === ymax){ ymin -= 1; ymax += 1; }
  var xpad = (xmax - xmin) * 0.08, ypad = (ymax - ymin) * 0.08;
  xmin -= xpad; xmax += xpad; ymin -= ypad; ymax += ypad;
  var X = function(v){ return pad.l + (v - xmin) / (xmax - xmin) * (w - pad.l - pad.r); };
  var Y = function(v){ return h - pad.b - (v - ymin) / (ymax - ymin) * (h - pad.t - pad.b); };
  var dots = pair.pts.map(function(p){
    return '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3.1" fill="var(--accent)" fill-opacity="0.5"/>';
  }).join('');
  var zeroX = (0 > xmin && 0 < xmax) ? '<line x1="' + X(0).toFixed(1) + '" x2="' + X(0).toFixed(1) + '" y1="' + pad.t + '" y2="' + (h - pad.b) + '" stroke="var(--line)" stroke-dasharray="3,3"/>' : '';
  var zeroY = (0 > ymin && 0 < ymax) ? '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="var(--line)" stroke-dasharray="3,3"/>' : '';
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(pair.label) + ' scatter" style="width:100%;height:auto;max-width:540px;display:block">'
    + '<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + (h - pad.b) + '" y2="' + (h - pad.b) + '" stroke="var(--line)"/>'
    + '<line x1="' + pad.l + '" x2="' + pad.l + '" y1="' + pad.t + '" y2="' + (h - pad.b) + '" stroke="var(--line)"/>'
    + zeroX + zeroY + dots
    + '<text x="' + pad.l + '" y="' + (h - 6) + '" font-size="10" fill="var(--muted)">' + esc(pair.x) + '</text>'
    + '<text x="10" y="' + (pad.t + 10) + '" font-size="10" fill="var(--muted)">' + esc(pair.y) + '</text>'
    + '</svg>';
}
function barRow(pair){
  var P = window.LXPal, r = pair.r;
  var col = r == null ? 'var(--muted)' : P.div(r);
  var pct = r == null ? 0 : Math.min(100, Math.round(Math.abs(r) * 100));
  var sig = distinguishable(r, pair.n);
  return '<div style="margin:12px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12.5px;margin-bottom:4px;flex-wrap:wrap">'
    + '<span><b>' + esc(pair.label) + '</b>' + (pair.small ? ' <span style="color:var(--warn)">— small sample</span>' : '') + '</span>'
    + '<span style="color:var(--muted);white-space:nowrap">n=' + pair.n + (r != null ? ' &middot; r=' + r.toFixed(2) + ' (' + strength(r) + ')' : ' &middot; not computable') + '</span></div>'
    + '<div style="position:relative;height:9px;background:var(--line);border-radius:5px;overflow:hidden">'
    + '<div style="position:absolute;top:0;bottom:0;left:50%;width:2px;background:var(--ink2)"></div>'
    + (r != null ? '<div style="position:absolute;top:0;bottom:0;' + (r >= 0 ? 'left:50%' : 'right:50%') + ';width:' + (pct / 2) + '%;background:' + col + '"></div>' : '')
    + '</div>'
    + (r != null ? '<p style="font-size:11.5px;color:var(--muted);margin:4px 0 0">'
        + (sig ? 'Distinguishable from no relationship at roughly this sample size.'
               : '<b>NOT distinguishable from noise</b> at this sample size — read the sign cautiously, not the magnitude.')
        + '</p>' : '')
    + '</div>';
}

function render(){
  var host = $('#correlroot'); if(!host) return;
  var pairs = computePairs();
  if(!pairs || !pairs.length){
    host.innerHTML = '<p style="font-size:13px;color:var(--ink2);margin:0">Not enough paired ZIP series in this '
      + 'edition to compute a correlation honestly — every pair below needs at least ' + MINPAIR + ' ZIPs '
      + 'carrying both series being compared. Nothing is shown rather than a coefficient built on a handful of '
      + 'points dressed up as a finding.</p>';
    return;
  }
  var headline = pairs.filter(function(p){ return !p.small; }).slice(0, 2);
  var h = '<p style="font-size:13px;color:var(--ink2);max-width:84ch;margin:0 0 12px">Every correlation below is '
    + 'computed from the SAME fitted trends the rest of this tab already shows, across the ZIPs (or corridors) '
    + 'this edition actually carries. A coefficient (r) runs from −1 to +1; the strength labels below follow the '
    + 'usual convention and are not a statistical test by themselves. <b>Correlation is not causation</b>, and '
    + 'real-estate index series in the same region often move together because they share a regional shock, not '
    + 'because one causes the other — a strong r here is a reason to look closer, never a reason to stop looking.</p>';

  if(headline.length){
    h += '<div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));margin-bottom:14px">'
      + headline.map(function(p){
          return '<div><p style="font-size:12px;color:var(--ink2);margin:0 0 4px"><b>' + esc(p.label) + '</b> &middot; n=' + p.n
            + (p.r != null ? ' &middot; r=' + p.r.toFixed(2) : '') + '</p>' + scatterSVG(p)
            + '<p style="font-size:11.5px;color:var(--muted);margin:6px 0 0;max-width:52ch">' + p.note + '</p></div>';
        }).join('')
      + '</div>';
  }

  h += '<div style="max-width:70ch">' + pairs.map(barRow).join('') + '</div>';
  host.innerHTML = h;
  if(window.LXPanels) setTimeout(function(){ LXPanels.scan('predict'); }, 60);
}

window.LXCorrelate = {render: render, computePairs: computePairs, pearson: pearson};
})();
