/* locator.x - sector bubbles on the live map.
   ----------------------------------------------------------------------------
   A Rosling-style field laid over the real geography. Each ZIP becomes one
   translucent bubble at its own centroid, sized by how much stock it holds and
   subdivided INSIDE by the housing categories that make it up, so the shape of a
   submarket is legible before you zoom into a single parcel.

   It runs on a canvas above the map rather than as a GL layer, because the inner
   mosaic and the hover need per-pixel control that fill-extrusion cannot give.
   The canvas is redrawn on move, and every bubble is placed by projecting its own
   centroid through the map, so it stays registered to the geography at any zoom.

   Time is real here. The whole app recomputes at window.__lxAsOf, so dragging the
   month slider re-derives every bubble from that month's published index - the
   size, the position and the growth ring all move because the underlying figures
   moved, not because anything is animated between two states. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function N(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; }

/* housing categories - the mosaic inside every bubble */
var CATS = [
  {id:'mf5',   slot:'asset', re:/apart|multi-?family5|5\+|20 to 39|40 or more|100 or more|25 to 99|multiple res/i,
   name:'Apartments, 5+ units'},
  {id:'mf24',  slot:'hack',  re:/duplex|triplex|fourplex|two family|three family|four family|4 to 19|twin home|2 units|3 units|4 units|multi-?family<4|under 4/i,
   name:'Small multifamily, 2-4 units'},
  {id:'lodge', slot:'value', re:/hotel|motel|\binn\b|lodge|resort|tourist cabin|bed and breakfast|dorm|student|rooming|fratrnty|sorority|group/i,
   name:'Lodging and group quarters'},
  {id:'comm',  slot:'growth',re:/commercial|office|retail|business|warehouse|shopping|restaurant|supermarket|industrial|bank/i,
   name:'Commercial and industrial'},
  {id:'other', slot:'liab',  re:/./,
   name:'Everything else, zoned-only and unclassified'}
];
function catOf(l){
  var k = l.kind || '';
  for(var i=0;i<CATS.length;i++) if(CATS[i].re.test(k)) return CATS[i].id;
  return 'other';
}

var S = {on:false, by:'zip', built:null, hover:null, cv:null, raf:0, minN:12, cap:260,
  playing:false, frame:null, speed:1, playRaf:0, lastT:0};
var REDUCED = false;
try{ REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}

/* ---- growth-over-time playback ------------------------------------------
   The whole app can recompute at any published month via window.__lxAsOf
   (see app.js / predict.js), but until now nothing let a person actually
   WATCH the sector field move through that history - only a static snapshot
   of "now". This walks the month axis forward, one build() per frame, each
   one drawn - so the field's growth is an actual sequence of real recomputed
   states, the same as scrubbing the slider by hand, just automated. window.
   __lxAsOf is only ever held during the single synchronous build() call for
   that frame, then restored - so playback here never leaks a stale as-of
   month into the rest of the app (the dashboard, the drawer, anything else
   reading "the latest value" mid-playback still gets the true latest). */
function monthsList(){
  if(S.months) return S.months;
  try{ S.months = (L().M.months || []).slice(); }catch(e){ S.months = []; }
  return S.months;
}
function buildAt(idx){
  if(idx == null) return build();
  var prev = window.__lxAsOf;
  window.__lxAsOf = idx;
  try{ return build(); }
  finally{ if(prev == null) delete window.__lxAsOf; else window.__lxAsOf = prev; }
}

/* ---- aggregate the filtered set into sectors --------------------------- */
function build(){
  var X = L();
  var rows;
  try{ rows = X.filtered ? X.filtered() : X.allListings(); }
  catch(e){ rows = X.allListings(); }
  var VW = (window.LXView && window.LXView.active()) ? window.LXView : null;
  if(VW) rows = rows.filter(function(l){ try{ return VW.pass(l); }catch(e){ return true; } });

  var by = {};
  for(var i=0;i<rows.length;i++){
    var l = rows[i];
    if(l.lat == null || l.lng == null) continue;
    var k = S.by === 'zip' ? (l.zip || '') : (l.city || '');
    if(!k) continue;
    var g = by[k] || (by[k] = {key:k, n:0, sx:0, sy:0, mix:{}, price:[], sample:[]});
    g.n++; g.sx += l.lng; g.sy += l.lat;
    var c = catOf(l); g.mix[c] = (g.mix[c] || 0) + 1;
    if(N(l.price)) g.price.push(l.price);
    if(g.sample.length < 40) g.sample.push(l);
  }
  var out = [];
  for(var kk in by){
    var b = by[kk];
    if(b.n < S.minN) continue;
    b.lng = b.sx / b.n; b.lat = b.sy / b.n;
    b.med = med(b.price);
    // the market series drives growth and the time dimension
    var mk = null;
    try{ mk = X.marketFor(b.sample[0]); }catch(e){}
    b.yoy = mk && mk.yoy != null ? mk.yoy : null;
    b.val = mk ? (mk.zhvi || mk.v || null) : null;
    b.rent = mk ? (mk.zori || mk.r || null) : null;
    b.seeds = window.LXBub.seedsFor(b.mix, CATS.map(function(c){ return c.id; }), 46);
    out.push(b);
  }
  out.sort(function(a, b2){ return b2.n - a.n; });
  return out.slice(0, S.cap);
}
function med(a){ if(!a.length) return null; var s = a.slice().sort(function(x,y){return x-y;}); return s[Math.floor(s.length/2)]; }

/* phyllotaxis seeds, one per share slice, so the mosaic is stable and the areas
   are proportional without needing a Voronoi library */
function mosaic(mix){
  var tot = 0; for(var k in mix) tot += mix[k];
  if(!tot) return [];
  var seeds = [], GOLD = Math.PI * (3 - Math.sqrt(5)), idx = 0, TOT = 40;
  CATS.forEach(function(c){
    var n = mix[c.id] ? Math.max(1, Math.round(mix[c.id] / tot * TOT)) : 0;
    for(var i=0;i<n;i++){
      var t = idx++, r = Math.sqrt(t / TOT) * 0.93, a = t * GOLD;
      seeds.push({x:Math.cos(a) * r, y:Math.sin(a) * r, k:c.id});
    }
  });
  return seeds;
}

/* ---- canvas over the map ------------------------------------------------ */
function canvas(){
  if(S.cv && document.body.contains(S.cv)) return S.cv;
  var map = window.__lxmap; if(!map || !map.getCanvasContainer) return null;
  var host = map.getCanvasContainer();
  var cv = document.createElement('canvas');
  cv.id = 'lxsectorcv';
  cv.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:3';
  host.appendChild(cv);
  S.cv = cv;
  cv.addEventListener('mousemove', function(){});
  return cv;
}

function draw(){
  var map = window.__lxmap, cv = canvas();
  if(!map || !cv || !S.built) return;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var w = map.getCanvas().clientWidth, h = map.getCanvas().clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  var g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  var P = window.LXPal;
  var maxN = 1;
  S.built.forEach(function(b){ if(b.n > maxN) maxN = b.n; });
  var z = map.getZoom();
  var scale = Math.max(0.55, Math.min(2.2, (z - 5) / 5));

  var drawn = 0;
  S.built.forEach(function(b){
    var p;
    try{ p = map.project([b.lng, b.lat]); }catch(e){ return; }
    if(p.x < -120 || p.y < -120 || p.x > w + 120 || p.y > h + 120) return;
    var rad = (7 + Math.sqrt(b.n / maxN) * 44) * scale;
    b._x = p.x; b._y = p.y; b._r = rad;
    drawn++;

    // drawn through the shared 3D renderer so every bubble surface in the app
    // reads as one system: a lit sphere whose skin is this sector's own mix
    window.LXBub.sphere(g, p.x, p.y, rad, {
      seeds: b.seeds,
      colorOf: function(k){ return P.cat(slotOf(k)); },
      t: window.LXBub.clock.t + (b._ph || (b._ph = Math.random() * 6)),
      alpha: (S.hover && S.hover.key === b.key) ? 0.97 : 0.80,
      bg: P.tok('--bg'),
      ring: b.yoy == null ? null : {
        frac: Math.max(0.06, Math.min(1, Math.abs(b.yoy) / 12)),
        color: b.yoy > 3 ? P.tok('--good') : b.yoy < -1 ? P.tok('--bad') : P.tok('--warn'),
        width: Math.max(1.5, Math.min(7, Math.abs(b.yoy) * 0.9))
      }
    });
    if(rad > 17){
      g.fillStyle = P.tok('--ink'); g.font = '600 10px system-ui'; g.textAlign = 'center';
      g.fillText(b.key, p.x, p.y + 3);
    }
  });
  S._drawn = drawn;
  legend();
}
function slotOf(id){
  for(var i=0;i<CATS.length;i++) if(CATS[i].id === id) return CATS[i].slot;
  return 'liab';
}

function legend(){
  var el = $('#seclegend'); if(!el) return;
  if(!S.on){ el.innerHTML = ''; return; }
  var P = window.LXPal;
  var months = monthsList();
  var idx = S.frame != null ? S.frame : window.__lxAsOf;
  var at = (idx != null && months[idx]) ? months[idx] : (months[months.length - 1] || '');
  el.innerHTML = '<div style="font-size:11px;color:var(--muted);line-height:1.6">'
    + '<b>' + L().fmtN(S._drawn || 0) + '</b> sectors drawn of ' + L().fmtN((S.built || []).length)
    + ' held &middot; bubble area = records in that ' + (S.by === 'zip' ? 'ZIP' : 'city')
    + ' &middot; the mosaic inside is its housing mix &middot; the outer ring is that sector&rsquo;s one-year index change'
    + (at ? ' at <b>' + esc(String(at).slice(0, 7)) + '</b>' : '')
    + (S.playing ? ' &middot; <b style="color:var(--accent)">playing growth reel</b>' : '') + '<br>'
    + CATS.map(function(c){ return '<span style="margin-right:10px;white-space:nowrap">'
        + P.swatch(P.cat(c.slot), 'circle', 11) + esc(c.name) + '</span>'; }).join('')
    + '</div>';
}

/* ---- interaction -------------------------------------------------------- */
function hit(e){
  if(!S.on || !S.built) return null;
  var map = window.__lxmap; if(!map) return null;
  var r = map.getCanvas().getBoundingClientRect();
  var x = e.clientX - r.left, y = e.clientY - r.top, best = null, bd = 9e9;
  S.built.forEach(function(b){
    if(b._x == null) return;
    var d = (b._x - x) * (b._x - x) + (b._y - y) * (b._y - y);
    if(d < b._r * b._r && d < bd){ bd = d; best = b; }
  });
  return best;
}
function bind(){
  var map = window.__lxmap; if(!map || S._bound) return;
  S._bound = true;
  map.on('move', function(){ if(S.on){ cancelAnimationFrame(S.raf); S.raf = requestAnimationFrame(draw); } });
  map.on('resize', function(){ if(S.on) draw(); });
  /* Guarded like the one in canvas(): a renderer whose shim lacks this
     method must lose the hover tooltip, never throw. */
  if(!map.getCanvasContainer) return;
  var cvc = map.getCanvasContainer();
  cvc.addEventListener('mousemove', function(e){
    if(!S.on) return;
    var b = hit(e);
    if((b && b.key) !== (S.hover && S.hover.key)){ S.hover = b; draw(); tip(b, e); }
    else if(b) tip(b, e);
  });
  cvc.addEventListener('click', function(e){
    if(!S.on) return;
    var b = hit(e); if(!b) return;
    try{
      var X = L(), ids = {};
      var rows = X.filtered ? X.filtered() : X.allListings();
      var pick = rows.filter(function(l){ return (S.by === 'zip' ? l.zip : l.city) === b.key; });
      if(window.LXPal && LXPal.drill) LXPal.drill(
        (S.by === 'zip' ? 'ZIP ' : '') + b.key + ' — ' + L().fmtN(b.n) + ' records',
        pick.slice(0, 600),
        'Every record this edition holds in that sector, at the current filters and replay month.');
    }catch(err){}
  });
}
function tip(b, e){
  var el = $('#sectip'); if(!el) return;
  if(!b){ el.style.display = 'none'; return; }
  var tot = 0; for(var k in b.mix) tot += b.mix[k];
  el.style.display = 'block';
  var r = window.__lxmap.getCanvas().getBoundingClientRect();
  el.style.left = Math.min(r.width - 250, Math.max(6, (e.clientX - r.left) + 14)) + 'px';
  el.style.top = Math.max(6, (e.clientY - r.top) - 10) + 'px';
  el.innerHTML = '<b>' + esc(b.key) + '</b> &middot; ' + L().fmtN(b.n) + ' records<br>'
    + CATS.filter(function(c){ return b.mix[c.id]; }).map(function(c){
        return '<span style="color:var(--muted)">' + esc(c.name) + '</span> '
          + Math.round(b.mix[c.id] / tot * 100) + '%';
      }).join('<br>')
    + (b.med ? '<br><span style="color:var(--muted)">median value</span> ' + L().fmt$(b.med) : '')
    + (b.yoy != null ? '<br><span style="color:var(--muted)">one-year index change</span> ' + b.yoy.toFixed(1) + '%' : '')
    + '<br><span style="color:var(--muted);font-size:10.5px">click to list them</span>';
}

function refresh(){ if(!S.on) return; S.built = S.playing ? buildAt(S.frame) : build(); draw(); }

function goToFrame(idx){
  var months = monthsList();
  if(!months.length) return;
  idx = Math.max(0, Math.min(months.length - 1, Math.round(idx)));
  S.frame = idx;
  S.built = buildAt(idx);
  draw(); legend();
  var sc = $('#secscrub'); if(sc && +sc.value !== idx) sc.value = idx;
}
function playTick(ts){
  if(!S.playing) return;
  S.playRaf = requestAnimationFrame(playTick);
  if(!S.lastT) S.lastT = ts;
  var dt = ts - S.lastT;
  // one month advances roughly every 550ms at 1x - slow enough to actually
  // watch a bubble's mosaic and ring change, fast enough that 25 months is a
  // one-off view rather than a chore. speed multiplies that rate.
  if(dt < 550 / S.speed) return;
  S.lastT = ts;
  var months = monthsList();
  var next = (S.frame == null ? 0 : S.frame) + 1;
  if(next >= months.length){ stopPlay(); goToFrame(months.length - 1); return; }
  goToFrame(next);
}
function startPlay(){
  var months = monthsList();
  if(!S.on || months.length < 2) return;
  if(S.frame == null || S.frame >= months.length - 1) S.frame = 0;
  S.playing = true; S.lastT = 0;
  cancelAnimationFrame(S.playRaf);
  S.playRaf = requestAnimationFrame(playTick);
  syncPlayCtl();
}
function stopPlay(){
  S.playing = false;
  cancelAnimationFrame(S.playRaf);
  syncPlayCtl();
}
function syncPlayCtl(){
  var b = $('#secplay'); if(b) b.textContent = S.playing ? '❚❚ Pause' : '▶ Play growth';
  legend();
}

function toggle(on){
  S.on = !!on;
  if(!S.on){
    stopPlay(); S.frame = null;
    if(S.cv) S.cv.style.display = 'none';
    var t = $('#sectip'); if(t) t.style.display = 'none';
    if(S._unsub){ S._unsub(); S._unsub = null; }
    var tc = $('#sectimectl'); if(tc) tc.style.display = 'none';
    legend(); return true;
  }
  var map = window.__lxmap; if(!map) return false;
  bind();
  S.built = build();
  if(!S.built.length){ S.on = false; return false; }
  if(S.cv) S.cv.style.display = '';
  draw();
  if(!S._unsub) S._unsub = window.LXBub.subscribe(function(){ if(S.on) draw(); });
  var months = monthsList();
  var tc = $('#sectimectl');
  if(tc){ tc.style.display = months.length > 1 ? 'flex' : 'none'; }
  var sc = $('#secscrub');
  if(sc && months.length > 1){ sc.max = months.length - 1; sc.value = months.length - 1; }
  return true;
}

function mount(){
  var host = $('#sectorctl'); if(!host || host.dataset.built) return;
  host.dataset.built = '1';
  host.innerHTML = '<button class="btn" id="secbtn" aria-pressed="false" '
    + 'title="Draw every ZIP as one translucent bubble, sized by its stock and subdivided by its housing mix">'
    + '◍ Sector bubbles</button>'
    + '<select id="secby" title="Group sectors by"><option value="zip">by ZIP</option><option value="city">by city</option></select>'
    + '<span id="sectimectl" style="display:none;align-items:center;gap:8px;flex:1;min-width:220px">'
    + '<button class="btn" id="secplay" title="Walk every sector through the full published month history, recomputed for real at each step - not tweened">▶ Play growth</button>'
    + '<input type="range" id="secscrub" min="0" max="0" step="1" value="0" style="flex:1;min-width:120px;accent-color:var(--accent)" '
    + 'title="Drag to any published month - every bubble recomputes from that month\'s index">'
    + '<select id="secspeed" title="Playback speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option>'
    + '<option value="2">2×</option><option value="4">4×</option></select></span>';
  $('#secbtn').addEventListener('click', function(){
    var ok = toggle(!S.on);
    $('#secbtn').textContent = S.on ? '◍ hide sectors' : '◍ Sector bubbles';
    $('#secbtn').setAttribute('aria-pressed', S.on);
    if(!ok && !S.on) L().toast('Not enough records in view to build sectors.');
  });
  $('#secby').addEventListener('change', function(e){ S.by = e.target.value; refresh(); });
  $('#secplay').addEventListener('click', function(){
    if(S.playing) stopPlay(); else startPlay();
  });
  $('#secscrub').addEventListener('input', function(e){
    stopPlay();
    goToFrame(+e.target.value);
  });
  $('#secspeed').addEventListener('change', function(e){ S.speed = +e.target.value || 1; });
  // months length is only known once app data is live, not at mount time
  setTimeout(function(){
    var months = monthsList(), sc = $('#secscrub');
    if(sc && months.length > 1) sc.max = months.length - 1;
    if(!months.length) { var pw = $('#secplay'); if(pw) pw.disabled = true; }
  }, 1200);
  if(!$('#sectip')){
    var t = document.createElement('div');
    t.id = 'sectip';
    t.style.cssText = 'position:absolute;display:none;z-index:6;pointer-events:none;background:var(--panel);'
      + 'border:1px solid var(--line);border-radius:6px;padding:7px 9px;font-size:12px;line-height:1.55;'
      + 'max-width:240px;box-shadow:0 4px 14px rgba(0,0,0,.18)';
    var map = window.__lxmap;
    if(map && map.getCanvasContainer && map.getCanvasContainer()) map.getCanvasContainer().appendChild(t);
  }
}

window.LXSectors = {mount:mount, toggle:toggle, refresh:refresh, build:build, CATS:CATS, state:S};
document.addEventListener('DOMContentLoaded', mount);
setTimeout(mount, 900);
})();
