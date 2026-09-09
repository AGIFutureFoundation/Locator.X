/* locator.x - the predictions field, in three dimensions.
   ----------------------------------------------------------------------------
   Two surfaces, both drawn through the shared 3D bubble renderer so the
   predictions page reads as the same system as the map, the corridor field and
   the dashboards rather than a different chart library bolted on.

   THE FIELD is a Rosling scatter with the axes an investor actually trades on:
   the fitted annual VALUE trend across, the fitted annual RENT trend up. Each
   bubble is a ZIP; its size is how much stock it holds; its skin is the Voronoi
   mosaic of the housing categories that make it up. The quadrant a bubble sits
   in is the whole point - value climbing while rent stands still is yield
   compressing, which looks like good news on a price chart and is not.

   THE CONE is one ZIP's history and its projection. History is drawn as real
   published points. The projection is drawn as spheres that GROW along the path,
   and the band around them is the p10-p90 of the MEASURED backtest error, so the
   cone widens because the method was that wrong on held-out months, not because
   a distribution was assumed.

   Three rules the drawing obeys:
     1. A missing measure is never a zero. A ZIP with no rent series is not
        plotted at rent-trend-zero; it is not plotted.
     2. Colour never carries identity alone. Category is the mosaic, reliability
        is the ring WIDTH and its dash, and both are stated in the legend.
     3. The oscillation never changes a value. Cells breathe; areas do not. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function N(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; }

/* the same five categories the sector bubbles use - one visual language */
var CATS = [
  {id:'mf5',   slot:'asset', re:/apart|multi-?family5|5\+|20 to 39|40 or more|100 or more|25 to 99|multiple res/i, name:'Apartments, 5+'},
  {id:'mf24',  slot:'hack',  re:/duplex|triplex|fourplex|two family|three family|four family|4 to 19|twin home|2 units|3 units|4 units|multi-?family<4|under 4/i, name:'Small multifamily 2-4'},
  {id:'lodge', slot:'value', re:/hotel|motel|\binn\b|lodge|resort|tourist cabin|bed and breakfast|dorm|student|rooming|fratrnty|sorority|group/i, name:'Lodging and group'},
  {id:'comm',  slot:'growth',re:/commercial|office|retail|business|warehouse|shopping|restaurant|supermarket|industrial|bank/i, name:'Commercial and industrial'},
  {id:'other', slot:'liab',  re:/./, name:'Everything else'}
];
function catOf(l){ var k = l.kind || ''; for(var i=0;i<CATS.length;i++) if(CATS[i].re.test(k)) return CATS[i].id; return 'other'; }
function slotOf(id){ for(var i=0;i<CATS.length;i++) if(CATS[i].id === id) return CATS[i].slot; return 'liab'; }

var S = {pts:null, sel:null, hover:null, unsub:null, fieldCv:null, coneCv:null};

/* ---- assemble: one point per ZIP that has BOTH a value and a rent fit ---- */
function points(){
  if(S.pts) return S.pts;
  var P = window.LXPredict; if(!P) return [];
  var D = P.data(); if(!D) return [];
  var all;
  try{ all = L().allListings(); }catch(e){ return []; }
  var by = {};
  for(var i = 0; i < all.length; i++){
    var l = all[i], z = l.zip; if(!z) continue;
    var g = by[z] || (by[z] = {zip:z, n:0, mix:{}, metro:l.metro || l.city || ''});
    g.n++; var c = catOf(l); g.mix[c] = (g.mix[c] || 0) + 1;
  }
  var out = [];
  for(var z2 in by){
    var b = by[z2];
    if(b.n < 8) continue;
    var fv = P.forecastZip(z2, 'val'), fr = P.forecastZip(z2, 'rent');
    /* rule 1: both measures or nothing. A ZIP with one series is not a point at
       zero on the other axis - it is simply absent, and the note says so. */
    if(!fv || !fr) continue;
    if(fv.annual == null || fr.annual == null) continue;
    b.vx = fv.annual; b.ry = fr.annual;
    b.last = fv.last; b.end = fv.end; b.lo = fv.lo; b.hi = fv.hi;
    /* band width as a share of the projection = how much this method can be
       trusted on this data. It is the SAME backtest for every ZIP, so this
       ranks nothing; it is drawn so the reader cannot forget it. */
    b.spread = (fv.lo && fv.hi && fv.end) ? (fv.hi - fv.lo) / fv.end : null;
    /* the ring is THIS ZIP's own held-out error, not the pooled band - the pooled
       band is one number repeated on every bubble, which would look like an
       encoding while carrying nothing. */
    var ho = P.holdout ? P.holdout(D.val[z2]) : null;
    b.ho = ho ? ho.err : null;
    b.seeds = window.LXBub.seedsFor(b.mix, CATS.map(function(c){ return c.id; }), 44);
    b._ph = (parseInt(z2, 10) % 61) / 61 * 6;
    out.push(b);
  }
  out.sort(function(a, c){ return c.n - a.n; });
  S.pts = out.slice(0, 220);
  return S.pts;
}
function reset(){ S.pts = null; }

/* ---- the field ---------------------------------------------------------- */
function drawField(){
  var cv = S.fieldCv; if(!cv || !cv.isConnected) return;
  var pts = points();
  var P = window.LXPal;
  var w = cv.clientWidth || 720, h = cv.clientHeight || 440;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  if(cv.width !== Math.round(w*dpr)){ cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr); }
  var g = cv.getContext('2d');
  g.setTransform(dpr,0,0,dpr,0,0);
  g.clearRect(0,0,w,h);
  if(!pts.length){
    g.fillStyle = P.tok('--muted'); g.font = '13px system-ui'; g.textAlign = 'center';
    g.fillText('No ZIP in this edition carries both a value and a rent series long enough to fit.', w/2, h/2);
    return;
  }
  var PAD = {l:62, r:16, t:16, b:44};
  var xs = pts.map(function(p){ return p.vx; }), ys = pts.map(function(p){ return p.ry; });
  var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
  var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  var padx = (x1 - x0) * 0.12 || 0.02, pady = (y1 - y0) * 0.12 || 0.02;
  x0 -= padx; x1 += padx; y0 -= pady; y1 += pady;
  var X = function(v){ return PAD.l + (v - x0) / (x1 - x0) * (w - PAD.l - PAD.r); };
  var Y = function(v){ return h - PAD.b - (v - y0) / (y1 - y0) * (h - PAD.t - PAD.b); };

  /* recessive grid */
  g.strokeStyle = P.tok('--line'); g.lineWidth = 1;
  g.fillStyle = P.tok('--muted'); g.font = '10px system-ui';
  var ticks = function(a, b2){ var st = niceStep((b2-a)/5), o = [];
    for(var v = Math.ceil(a/st)*st; v <= b2; v += st) o.push(+v.toFixed(6)); return o; };
  g.textAlign = 'center';
  ticks(x0,x1).forEach(function(v){ var px = X(v);
    g.globalAlpha = 0.5; g.beginPath(); g.moveTo(px, PAD.t); g.lineTo(px, h-PAD.b); g.stroke(); g.globalAlpha = 1;
    g.fillText(pctS(v), px, h - PAD.b + 15); });
  g.textAlign = 'right';
  ticks(y0,y1).forEach(function(v){ var py = Y(v);
    g.globalAlpha = 0.5; g.beginPath(); g.moveTo(PAD.l, py); g.lineTo(w-PAD.r, py); g.stroke(); g.globalAlpha = 1;
    g.fillText(pctS(v), PAD.l - 7, py + 3); });

  /* the zero cross - the line that turns the field into four readable rooms */
  if(x0 < 0 && x1 > 0){ g.strokeStyle = P.tok('--ink2'); g.globalAlpha = 0.35; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(X(0), PAD.t); g.lineTo(X(0), h-PAD.b); g.stroke(); g.globalAlpha = 1; }
  if(y0 < 0 && y1 > 0){ g.strokeStyle = P.tok('--ink2'); g.globalAlpha = 0.35; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(PAD.l, Y(0)); g.lineTo(w-PAD.r, Y(0)); g.stroke(); g.globalAlpha = 1; }

  /* the diagonal: value and rent moving together. Above it rent is outrunning
     value (yield expanding); below it value is outrunning rent (compressing). */
  g.save(); g.setLineDash([5,5]); g.strokeStyle = P.tok('--ink2'); g.globalAlpha = 0.30; g.lineWidth = 1.5;
  var d0 = Math.max(x0, y0), d1 = Math.min(x1, y1);
  if(d1 > d0){ g.beginPath(); g.moveTo(X(d0), Y(d0)); g.lineTo(X(d1), Y(d1)); g.stroke(); }
  g.restore();
  g.globalAlpha = 1;

  var maxN = pts[0].n || 1;
  var t = window.LXBub.clock.t;
  /* biggest first so small bubbles land on top and stay clickable */
  pts.forEach(function(p){
    p._x = X(p.vx); p._y = Y(p.ry);
    p._r = Math.max(5, Math.min(30, 5 + Math.sqrt(p.n / maxN) * 25));
    var hot = S.sel === p.zip || (S.hover && S.hover.zip === p.zip);
    /* ring = how far THIS ZIP's own fit missed on the one month it was not shown.
       Thin green means it landed; thick amber means it did not. A ZIP too short
       to hold out gets NO ring - never a thin ring standing in for one. */
    var ring = null;
    if(p.ho != null){
      var e = Math.abs(p.ho), f = Math.min(1, e / 0.10);
      ring = {frac: 1, width: Math.max(1.3, 1.3 + f * 3.4),
              color: e > 0.06 ? P.tok('--warn') : e > 0.02 ? P.tok('--ink2') : P.tok('--good')};
    }
    window.LXBub.sphere(g, p._x, p._y, p._r, {
      seeds: p.seeds,
      colorOf: function(k){ return P.cat(slotOf(k)); },
      t: t + p._ph,
      alpha: hot ? 0.98 : 0.78,
      bg: P.tok('--bg'),
      ring: ring
    });
    if(hot || p._r > 21){
      g.fillStyle = P.tok('--ink'); g.font = '600 10px system-ui'; g.textAlign = 'center';
      g.fillText(p.zip, p._x, p._y + 3);
    }
  });

  /* axis titles - one axis per measure, never two scales on one */
  g.fillStyle = P.tok('--ink2'); g.font = '600 11px system-ui'; g.textAlign = 'center';
  g.fillText('Fitted annual VALUE trend', PAD.l + (w-PAD.l-PAD.r)/2, h - 6);
  g.save(); g.translate(13, PAD.t + (h-PAD.t-PAD.b)/2); g.rotate(-Math.PI/2);
  g.fillText('Fitted annual RENT trend', 0, 0); g.restore();

  /* quadrant words, faint, because a scatter nobody can read is decoration */
  g.font = '600 10px system-ui'; g.fillStyle = P.tok('--muted'); g.globalAlpha = 0.85;
  g.textAlign = 'right'; g.fillText('rent outrunning value  ·  yield expanding', w - PAD.r - 4, PAD.t + 12);
  g.fillText('value outrunning rent  ·  yield compressing', w - PAD.r - 4, h - PAD.b - 6);
  g.globalAlpha = 1;
}
function niceStep(x){ if(!(x>0)) return 1; var e = Math.pow(10, Math.floor(Math.log10(x))), f = x/e;
  return (f<1.5?1:f<3?2:f<7?5:10)*e; }
function pctS(v){ return (v>=0?'+':'') + (v*100).toFixed(v===0?0:1) + '%'; }

/* ---- the cone ----------------------------------------------------------- */
function drawCone(){
  var cv = S.coneCv; if(!cv || !cv.isConnected) return;
  var P = window.LXPal, PR = window.LXPredict;
  var w = cv.clientWidth || 720, h = cv.clientHeight || 300;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  if(cv.width !== Math.round(w*dpr)){ cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr); }
  var g = cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h);

  var pts = points();
  if(!pts.length || !PR){
    g.fillStyle = P.tok('--muted'); g.font = '13px system-ui'; g.textAlign = 'center';
    g.fillText('No ZIP in this edition carries both series, so there is no cone to draw.', w/2, h/2);
    var t0 = $('#pvconetitle'); if(t0) t0.textContent = 'Nothing to project here';
    return;
  }
  var zip = S.sel || pts[0].zip;
  var D = PR.data(); if(!D) return;
  var hist = D.val[zip]; var f = PR.forecastZip(zip, 'val');
  if(!hist || !f){ g.fillStyle = P.tok('--muted'); g.font='13px system-ui'; g.textAlign='center';
    g.fillText('No value series for ' + zip + '.', w/2, h/2); return; }

  var series = [], i;
  for(i = 0; i < hist.length; i++) if(hist[i] != null) series.push({i:i, v:hist[i]});
  var fut = f.points.map(function(v, k){ return {i: hist.length - 1 + k + 1, v: v}; });
  var lo = f.bt ? fut.map(function(p,k){ return p.v * (1 + f.bt.p10 * (k+1)/fut.length); }) : null;
  var hi = f.bt ? fut.map(function(p,k){ return p.v * (1 + f.bt.p90 * (k+1)/fut.length); }) : null;

  var allV = series.map(function(p){ return p.v; }).concat(fut.map(function(p){ return p.v; }));
  if(lo) allV = allV.concat(lo, hi);
  var v0 = Math.min.apply(null, allV), v1 = Math.max.apply(null, allV);
  var vp = (v1-v0)*0.14 || 1; v0 -= vp; v1 += vp;
  var i0 = series[0].i, i1 = fut.length ? fut[fut.length-1].i : series[series.length-1].i;
  var PAD = {l:68, r:14, t:14, b:30};
  var X = function(ix){ return PAD.l + (ix - i0)/(i1 - i0) * (w-PAD.l-PAD.r); };
  var Y = function(v){ return h - PAD.b - (v - v0)/(v1 - v0) * (h-PAD.t-PAD.b); };

  g.strokeStyle = P.tok('--line'); g.lineWidth = 1; g.fillStyle = P.tok('--muted');
  g.font = '10px system-ui'; g.textAlign = 'right';
  var st = niceStep((v1-v0)/4);
  for(var v = Math.ceil(v0/st)*st; v <= v1; v += st){
    g.globalAlpha=0.5; g.beginPath(); g.moveTo(PAD.l, Y(v)); g.lineTo(w-PAD.r, Y(v)); g.stroke(); g.globalAlpha=1;
    g.fillText(L().fmt$(Math.round(v)), PAD.l-7, Y(v)+3);
  }
  /* the boundary between recorded and projected, named on the page */
  var bx = X(series[series.length-1].i);
  g.save(); g.setLineDash([4,4]); g.strokeStyle = P.tok('--ink2'); g.globalAlpha=0.6; g.lineWidth=1.5;
  g.beginPath(); g.moveTo(bx, PAD.t); g.lineTo(bx, h-PAD.b); g.stroke(); g.restore(); g.globalAlpha=1;
  g.textAlign='left'; g.fillStyle=P.tok('--muted'); g.font='600 10px system-ui';
  g.fillText('projected', bx+5, PAD.t+10);
  g.textAlign='right'; g.fillText('published', bx-5, PAD.t+10);

  /* the measured band, as a filled cone */
  if(lo){
    g.beginPath();
    g.moveTo(bx, Y(series[series.length-1].v));
    for(i=0;i<fut.length;i++) g.lineTo(X(fut[i].i), Y(hi[i]));
    for(i=fut.length-1;i>=0;i--) g.lineTo(X(fut[i].i), Y(lo[i]));
    g.closePath();
    g.fillStyle = P.cat('growth'); g.globalAlpha = 0.16; g.fill(); g.globalAlpha = 1;
  }
  /* history: a 2px line, then real published points as small lit spheres */
  g.strokeStyle = P.cat('asset'); g.lineWidth = 2; g.beginPath();
  series.forEach(function(p,k){ k?g.lineTo(X(p.i),Y(p.v)):g.moveTo(X(p.i),Y(p.v)); }); g.stroke();
  var t = window.LXBub.clock.t;
  var every = Math.max(1, Math.round(series.length/14));
  series.forEach(function(p,k){
    if(k % every && k !== series.length-1) return;
    window.LXBub.sphere(g, X(p.i), Y(p.v), 5.5, {
      seeds: [{x:0,y:0,k:'a',ph:k*0.5}], colorOf:function(){ return P.cat('asset'); },
      t:t, alpha:0.95, bg:P.tok('--bg') });
  });
  /* projection: spheres that GROW along the path, because the uncertainty does */
  g.save(); g.setLineDash([6,4]); g.strokeStyle = P.cat('growth'); g.lineWidth = 2;
  g.beginPath(); g.moveTo(bx, Y(series[series.length-1].v));
  fut.forEach(function(p){ g.lineTo(X(p.i), Y(p.v)); }); g.stroke(); g.restore();
  fut.forEach(function(p,k){
    window.LXBub.sphere(g, X(p.i), Y(p.v), 4.5 + k*1.5, {
      seeds:[{x:0,y:0,k:'g',ph:k*0.8}], colorOf:function(){ return P.cat('growth'); },
      t:t, alpha:0.55 + k*0.05, bg:P.tok('--bg') });
  });

  var el = $('#pvconetitle');
  if(el){
    el.innerHTML = 'ZIP ' + esc(zip) + ' &mdash; ' + L().fmt$(Math.round(f.last))
      + ' now, ' + L().fmt$(Math.round(f.end)) + ' projected in ' + f.points.length + ' months'
      + (f.lo ? ' <span style="color:var(--muted);font-weight:400">(measured band '
        + L().fmt$(Math.round(f.lo)) + ' to ' + L().fmt$(Math.round(f.hi)) + ')</span>' : '');
  }
}

/* ---- interaction -------------------------------------------------------- */
function hit(e){
  var cv = S.fieldCv, r = cv.getBoundingClientRect();
  var mx = e.clientX - r.left, my = e.clientY - r.top, best = null, bd = 1e9;
  (S.pts||[]).forEach(function(p){
    if(p._x == null) return;
    var d = Math.hypot(p._x - mx, p._y - my);
    if(d < p._r + 4 && d < bd){ bd = d; best = p; }
  });
  return best;
}
function tipHTML(p){
  return '<b>ZIP ' + esc(p.zip) + '</b>' + (p.metro ? ' <span style="color:var(--muted)">' + esc(p.metro) + '</span>' : '')
    + '<div style="margin-top:3px">Value trend <b>' + pctS(p.vx) + '</b> a year &middot; rent trend <b>' + pctS(p.ry) + '</b></div>'
    + '<div>' + L().fmtN(p.n) + ' records in this edition</div>'
    + (p.ho != null ? '<div style="color:var(--muted)">Its own held-out month came in '
        + (p.ho >= 0 ? 'over' : 'under') + ' by ' + (Math.abs(p.ho)*100).toFixed(1) + '%</div>' : '')
    + (p.spread != null ? '<div style="color:var(--muted)">Pooled band spans '
        + (p.spread*100).toFixed(0) + '% of the projection</div>' : '')
    + '<div style="color:var(--muted);margin-top:3px">Click to draw its cone below.</div>';
}

/* ---- mount -------------------------------------------------------------- */
function mount(){
  var host = $('#pvfield'); if(!host) return;
  host.innerHTML = '<canvas id="pvfieldcv" style="width:100%;height:440px;display:block;cursor:pointer"></canvas>';
  S.fieldCv = $('#pvfieldcv');
  var ch = $('#pvcone');
  if(ch){ ch.innerHTML = '<canvas id="pvconecv" style="width:100%;height:300px;display:block"></canvas>';
          S.coneCv = $('#pvconecv'); }
  S.fieldCv.addEventListener('mousemove', function(e){
    var p = hit(e); var P = window.LXPal;
    if(p !== S.hover){ S.hover = p; drawField(); }
    if(p) P.tip(e, tipHTML(p)); else P.tipHide();
  });
  S.fieldCv.addEventListener('mouseleave', function(){ S.hover = null; window.LXPal.tipHide(); drawField(); });
  S.fieldCv.addEventListener('click', function(e){
    var p = hit(e); if(!p) return;
    S.sel = p.zip; drawField(); drawCone();
  });
  legend();
  drawField(); drawCone();
  if(!S.unsub && window.LXBub){
    S.unsub = window.LXBub.subscribe(function(){
      try{ if(document.querySelector('#predict.active')){ drawField(); drawCone(); } }catch(e){}
    });
  }
  window.addEventListener('resize', function(){ drawField(); drawCone(); });
}
function legend(){
  var el = $('#pvlegend'); if(!el) return;
  var P = window.LXPal;
  var sw = function(slot, label){
    return '<span style="display:inline-flex;align-items:center;gap:5px;margin-right:12px">'
      + '<span style="width:11px;height:11px;border-radius:50%;background:' + P.cat(slot) + ';display:inline-block"></span>'
      + esc(label) + '</span>'; };
  el.innerHTML = '<div style="font-size:11.5px;color:var(--ink2);line-height:1.9">'
    + '<div><b>Bubble skin</b> &mdash; the housing categories inside that ZIP: '
    + CATS.map(function(c){ return sw(c.slot, c.name); }).join('') + '</div>'
    + '<div><b>Bubble size</b> &mdash; how many records the ZIP holds in this edition. '
    + '<b>Ring</b> &mdash; how far <i>this ZIP&rsquo;s own</i> fit missed on the one month it was held out of: '
    + '<span style="color:var(--good)">thin and green</span> is within 2%, '
    + '<span style="color:var(--warn)">thick and amber</span> is over 6% out. That is a single observation '
    + 'rather than a distribution, and a ZIP too short to hold out gets no ring rather than a thin one.</div>'
    + '<div style="color:var(--muted)">A ZIP appears only if it carries <b>both</b> a value and a rent '
    + 'series long enough to fit. One missing series means the ZIP is absent, never plotted at zero.</div>'
    + '</div>';
}

window.LXPredictViz = {mount: mount, drawField: drawField, drawCone: drawCone, reset: reset,
                       select: function(z){ S.sel = z; drawField(); drawCone(); }};
})();
