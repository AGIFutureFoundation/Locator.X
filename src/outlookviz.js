/* locator.x - the outlook, drawn.
   ----------------------------------------------------------------------------
   Two pictures, both in the same lit-sphere idiom as the Predictions page so the
   underwriting sheet reads as part of one system rather than a different tool.

   THE PATH CONE plots five-year cash flow on three paths - the measured p10, the
   central fit, and the measured p90 - with the break-even line drawn straight
   across it. Where the low path crosses below zero is the year this deal starts
   costing money if the market does what it has already been shown to do at its
   bad end. That crossing is the whole picture; everything else on it is context.

   THE REQUIREMENT BAR is the one an investor should read first: the rent growth
   this deal NEEDS in order to hold DSCR 1.20, drawn against what the ZIP has
   actually been doing and the measured band around that. If the requirement sits
   outside the band, the deal is betting on something the record does not support,
   and it says so in those words. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function pct(v, d){ return v == null ? '--' : (v >= 0 ? '+' : '') + (v * 100).toFixed(d == null ? 1 : d) + '%'; }

function niceStep(x){ if(!(x > 0)) return 1; var e = Math.pow(10, Math.floor(Math.log10(x))), f = x / e;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * e; }

/* ---- the cone ----------------------------------------------------------- */
function drawCone(cv, A){
  if(!cv || !cv.isConnected || !A || !A.paths) return;
  var P = window.LXPal, X = L();
  var w = cv.clientWidth || 640, h = cv.clientHeight || 260;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  if(cv.width !== Math.round(w * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);

  var lo = A.paths.low.years.map(function(y){ return y.cf; });
  var md = A.paths.mid.years.map(function(y){ return y.cf; });
  var hi = A.paths.high.years.map(function(y){ return y.cf; });
  var all = lo.concat(md, hi).concat([0]);
  var v0 = Math.min.apply(null, all), v1 = Math.max.apply(null, all);
  var pad = (v1 - v0) * 0.16 || 1000; v0 -= pad; v1 += pad;
  var PAD = {l:74, r:22, t:16, b:26};
  var Xp = function(y){ return PAD.l + (y - 1) / 4 * (w - PAD.l - PAD.r); };
  var Y = function(v){ return h - PAD.b - (v - v0) / (v1 - v0) * (h - PAD.t - PAD.b); };

  /* grid */
  g.strokeStyle = P.tok('--line'); g.lineWidth = 1; g.fillStyle = P.tok('--muted');
  g.font = '10px system-ui'; g.textAlign = 'right';
  var st = niceStep((v1 - v0) / 4);
  for(var v = Math.ceil(v0 / st) * st; v <= v1; v += st){
    g.globalAlpha = 0.5; g.beginPath(); g.moveTo(PAD.l, Y(v)); g.lineTo(w - PAD.r, Y(v)); g.stroke(); g.globalAlpha = 1;
    g.fillText(X.fmt$(Math.round(v)), PAD.l - 7, Y(v) + 3);
  }
  /* THE line: break-even. Everything below it is a property you are paying to own. */
  if(v0 < 0 && v1 > 0){
    g.save(); g.strokeStyle = P.tok('--bad'); g.lineWidth = 2; g.globalAlpha = 0.85;
    g.beginPath(); g.moveTo(PAD.l, Y(0)); g.lineTo(w - PAD.r, Y(0)); g.stroke(); g.restore();
    g.fillStyle = P.tok('--bad'); g.font = '600 10px system-ui'; g.textAlign = 'left';
    g.fillText('break-even', PAD.l + 4, Y(0) - 5);
  }
  /* the measured band as a filled cone */
  g.beginPath();
  for(var i = 0; i < 5; i++) (i ? g.lineTo : g.moveTo).call(g, Xp(i + 1), Y(hi[i]));
  for(var j = 4; j >= 0; j--) g.lineTo(Xp(j + 1), Y(lo[j]));
  g.closePath();
  g.fillStyle = P.cat('growth'); g.globalAlpha = 0.15; g.fill(); g.globalAlpha = 1;

  /* the central path, and lit spheres that GROW because the uncertainty does */
  g.strokeStyle = P.cat('asset'); g.lineWidth = 2; g.beginPath();
  md.forEach(function(c, i){ (i ? g.lineTo : g.moveTo).call(g, Xp(i + 1), Y(c)); }); g.stroke();
  var t = window.LXBub ? window.LXBub.clock.t : 0;
  md.forEach(function(c, i){
    if(!window.LXBub) return;
    window.LXBub.sphere(g, Xp(i + 1), Y(c), 5 + i * 1.1, {
      seeds:[{x:0, y:0, k:'a', ph:i * 0.7}],
      colorOf: function(){ return c >= 0 ? P.cat('asset') : P.tok('--bad'); },
      t:t, alpha:0.92, bg:P.tok('--bg') });
  });
  /* mark the first year the LOW path goes under water - the number to remember */
  var under = -1; for(var q = 0; q < 5; q++) if(lo[q] < 0){ under = q; break; }
  if(under >= 0){
    g.save(); g.setLineDash([3, 3]); g.strokeStyle = P.tok('--bad'); g.globalAlpha = 0.8;
    g.beginPath(); g.moveTo(Xp(under + 1), Y(lo[under])); g.lineTo(Xp(under + 1), Y(0)); g.stroke(); g.restore();
    g.globalAlpha = 1;
  }
  g.fillStyle = P.tok('--ink2'); g.font = '10px system-ui'; g.textAlign = 'center';
  for(var y2 = 1; y2 <= 5; y2++) g.fillText('yr ' + y2, Xp(y2), h - 8);
}

/* ---- the requirement bar ------------------------------------------------ */
function reqBar(A){
  if(!A || !A.reqDscr) return '';
  var P = window.LXPal;
  var need = A.reqDscr.impossible ? null : A.reqDscr.rate;
  var got = A.measured, lo = null;
  if(A.reqDscr.impossible){
    return '<div style="border-left:3px solid var(--bad);padding:7px 0 7px 10px;margin:8px 0">'
      + '<b style="color:var(--bad)">No rent growth clears DSCR 1.20 here.</b> Even at 25% a year '
      + 'the debt service is too large for the income this property produces. That is a statement '
      + 'about the price and the loan, not about the market.</div>';
  }
  if(A.reqDscr.atFloor){
    return '<div style="border-left:3px solid var(--good);padding:7px 0 7px 10px;margin:8px 0">'
      + '<b style="color:var(--good)">This clears DSCR 1.20 even with rents falling 15% a year.</b> '
      + 'The deal is not relying on rent growth, which is the strongest thing an underwriting can say.</div>';
  }
  var verdict, col;
  if(A.rentPinned && A.capCentral && A.capCentral.length){
    /* every path is pinned at the cap, so the cone carries no rent band; saying
       so is better than letting three identical paths imply a measured spread */
    return '<div style="border-left:3px solid var(--warn);padding:7px 0 7px 10px;margin:8px 0">'
      + '<div style="font-size:13.5px;line-height:1.65"><b>Needs ' + pct(need) + ' rent growth a year</b> to hold '
      + 'DSCR 1.20 in year five. This ZIP’s fitted trend is <b>' + pct(got) + '</b> — genuinely what the last '
      + 'twelve months did, and above the &plusmn;' + A.cap + '% ceiling this app will compound across five years. '
      + 'So the requirement is comfortably met on the recent record, though the paths below compound only '
      + '&plusmn;' + A.cap + '% a year rather than that. Read the requirement, not the spread.</div></div>';
  }
  if(got == null){ verdict = 'This ZIP publishes no rent index, so there is nothing to check that requirement against.'; col = 'var(--muted)'; }
  else if(need <= got - 0.02){ verdict = 'The requirement sits <b>comfortably under what this ZIP has actually been doing</b> — rent growth would have to fall by more than two points from its fitted trend before this deal failed on rent.'; col = 'var(--good)'; }
  else if(need <= got){ verdict = 'The requirement is <b>only just under what this ZIP has actually been doing</b>. There is very little room between the two.'; col = 'var(--warn)'; }
  else { verdict = 'The requirement is <b>above what this ZIP has actually been doing</b>. The deal is betting on an acceleration the record does not show.'; col = 'var(--bad)'; }

  return '<div style="border-left:3px solid ' + col + ';padding:7px 0 7px 10px;margin:8px 0">'
    + '<div style="font-size:13.5px;line-height:1.65"><b>Needs ' + pct(need) + ' rent growth a year</b> to hold '
    + 'DSCR 1.20 in year five'
    + (got != null ? '; this ZIP’s fitted trend is <b>' + pct(got) + '</b>' : '')
    + '. ' + verdict + '</div></div>';
}

/* ---- the block, for the sheet and for the drawer ------------------------ */
var SEQ = 0;
function block(l, u, uw, opts){
  opts = opts || {};
  var A; try{ A = window.LXOutlook && LXOutlook.assess(l, u, uw); }catch(e){ return ''; }
  if(!A) return '';
  var head = '<div class="' + (opts.sect ? 'sect' : 'chart') + '" style="margin-top:10px">'
    + '<p class="eyebrow" style="margin:0 0 4px">Outlook &middot; what the record says this deal needs</p>';
  if(!A.outlook || A.outlook.none){
    return head + '<p style="font-size:12.5px;color:var(--ink2);margin:0">'
      + esc((A.outlook && A.outlook.why) || 'No index series covers this property, so no outlook is drawn.')
      + '</p></div>';
  }
  var o = A.outlook, id = 'ocone' + (++SEQ);
  var comp = o.compress;
  var h = head;
  h += '<div style="font-size:13px;line-height:1.7;margin-bottom:6px">'
    + 'ZIP ' + esc(o.zip) + ' fitted trend: value <b>' + pct(o.valTrend) + '</b> a year'
    + (o.rentTrend != null ? ', rent <b>' + pct(o.rentTrend) + '</b>' : ', <span style="color:var(--muted)">no rent index published</span>')
    + (comp != null ? ' &mdash; ' + (comp > 0.01
        ? '<b>value is outrunning rent by ' + (comp * 100).toFixed(1) + ' points</b>, which is yield compressing: the same building costs more and pays the same.'
        : comp < -0.01
        ? '<b>rent is outrunning value by ' + (-comp * 100).toFixed(1) + ' points</b>, which is yield widening.'
        : 'the two are moving together.') : '')
    + (o.holdout != null ? ' <span style="color:var(--muted)">This ZIP’s own fit missed its held-out month by '
        + (Math.abs(o.holdout) * 100).toFixed(1) + '%.</span>' : '')
    + '</div>';
  if(A.capCentral && A.capCentral.length){
    h += '<p style="font-size:12px;color:var(--ink2);background:var(--panel2);border-left:3px solid var(--warn);'
      + 'padding:6px 9px;margin:0 0 8px;line-height:1.6"><b>The fitted trend is too steep to compound.</b> '
      + 'This ZIP’s twelve-month fit runs at ' + esc(A.capCentral.join(', ')) + ' a year. That is a correct '
      + 'reading of twelve months and an indefensible assumption for five &mdash; compounded it implies a market '
      + 'this app has no basis to assert &mdash; so the paths below are held at &plusmn;' + A.cap + '% a year. '
      + 'The trend quoted above is the raw figure; the paths are the capped one.</p>';
  } else if(A.capEdge && A.capEdge.length){
    h += '<p style="font-size:12px;color:var(--muted);margin:0 0 8px;line-height:1.6">'
      + 'The central rates below are the fitted trend as measured. The band edges ran past '
      + '&plusmn;' + A.cap + '% a year (' + esc(A.capEdge.join(', ')) + ') and are held there, '
      + 'so the outer paths understate the spread rather than overstating it.</p>';
  }
  h += reqBar(A);
  h += '<canvas id="' + id + '" style="width:100%;height:' + (opts.sect ? 210 : 250) + 'px;display:block"></canvas>';
  h += '<div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-top:8px">'
    + tile('Measured low end', A.paths.low, A.lo,
        'rents ' + shift(A.lo.rentMul) + ', exit ' + shift(A.lo.exitMul))
    + tile('Central', A.paths.mid, A.mid,
        'at the fitted trend: ' + pct(A.mid.appr/100,1) + ' value, ' + pct(A.mid.rent/100,1) + ' rent')
    + tile('Measured high end', A.paths.high, A.hi,
        'rents ' + shift(A.hi.rentMul) + ', exit ' + shift(A.hi.exitMul))
    + '</div>';
  var bp = A.bandPts || {};
  if(A.lo && A.lo.rentMul > 1.0005){
    h += '<p style="font-size:12px;color:var(--ink2);margin:0 0 6px;line-height:1.6">'
      + '<b>Note the low end is still above the central estimate.</b> On this edition\u2019s data the method '
      + 'under-predicted rent so consistently that even the ninetieth percentile of its error is negative \u2014 '
      + 'it essentially never came in high. So the pessimistic path is not pessimistic; it is simply the least '
      + 'favourable thing the method actually did. A real downside case is not in this measurement, and this app '
      + 'will not invent one.</p>';
  }
  h += '<p class="src" style="margin-top:6px">All three paths run the <b>same fitted growth rates</b>. '
    + 'What separates them is the <b>tenth and ninetieth percentile of the error this method actually '
    + 'made</b> on months it was never shown &mdash; applied once, as a level shift to rents and to the '
    + 'exit price, because a level miss is what the backtest measured. A ten-percent haircut is a number '
    + 'someone liked; this is a number the data produced. '
    + '<b>It is also a floor, not the whole of the uncertainty:</b> that error was measured at '
    + (bp.horizon || 6) + ' months, and nobody here has measured how wrong this method is at five years. '
    + 'Nothing on this page is a forecast of this property &mdash; a parcel has no history, only the index does.</p>';
  h += '</div>';

  setTimeout(function(){
    var cv = document.getElementById(id); if(!cv || cv.dataset.w) return;
    cv.dataset.w = '1';
    drawCone(cv, A);
    if(window.LXBub) window.LXBub.subscribe(function(){ try{ if(cv.isConnected) drawCone(cv, A); }catch(e){} });
    window.addEventListener('resize', function(){ try{ if(cv.isConnected) drawCone(cv, A); }catch(e){} });
  }, 70);
  return h;
}
function tile(name, p, rates, note){
  var X = L();
  var col = p.irr == null ? 'var(--muted)' : p.irr > 0.08 ? 'var(--good)' : p.irr > 0 ? 'var(--warn)' : 'var(--bad)';
  return '<div class="tile" style="padding:9px 11px">'
    + '<p class="eyebrow" style="margin:0">' + esc(name) + '</p>'
    + '<p class="big num" style="margin:3px 0 1px;color:' + col + '">'
    + (p.irr == null ? '--' : (p.irr * 100).toFixed(1) + '%') + '</p>'
    + '<p style="font-size:11px;color:var(--muted);margin:0">5-yr IRR &middot; ' + esc(note || '') 
    + '<br>yr-5 DSCR ' + (p.dscr5 == null ? '--' : p.dscr5.toFixed(2))
    + ' &middot; cash flow ' + X.fmt$(Math.round(p.cf5 / 12)) + '/mo</p></div>';
}
function shift(m){ return m == null || Math.abs(m - 1) < 0.0005 ? 'as measured'
  : ((m > 1 ? '+' : '') + ((m - 1) * 100).toFixed(1) + '%'); }

window.LXOutlookViz = {block: block, drawCone: drawCone};
})();
