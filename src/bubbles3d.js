/* locator.x - the 3D tessellated bubble renderer.
   ----------------------------------------------------------------------------
   One renderer, used by every bubble surface in the app: the motion field, the
   corridor field and the sector bubbles on the live map. Drawing them all through
   the same function is what makes them read as one system rather than three charts
   that happen to use circles.

   A bubble here is a sphere whose SURFACE is a Voronoi tessellation of its own
   composition. Each cell is a real share of that group - a housing category, a
   property class - so the mosaic is data, not texture. The three-dimensionality is
   doing a job too: the lit hemisphere and the rim light let a viewer separate
   overlapping bubbles that a flat chart would merge into one blob, which is the
   failure mode of every Gapminder-style field once the bubbles get dense.

   The oscillation is deliberately small. Cells breathe on a slow phase offset so a
   dense field stays legible and the eye can follow one bubble through a replay,
   but the AREA of every cell stays proportional to its share at all times - the
   motion never changes what the picture says. Anything that would misreport a
   value is not animated. Respects prefers-reduced-motion. */
(function(){
'use strict';
var TAU = Math.PI * 2;
var GOLD = Math.PI * (3 - Math.sqrt(5));

var REDUCED = false;
try{ REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}

/* ---- composition -> seeds ------------------------------------------------
   Phyllotaxis places seeds evenly in the unit disc; giving each category a seed
   count proportional to its share makes the resulting Voronoi areas proportional
   too, without needing a weighted-Voronoi solver. */
function seedsFor(mix, order, total){
  var tot = 0, k;
  for(k in mix) tot += mix[k];
  if(!tot) return [];
  var N = total || 46, out = [], idx = 0;
  (order || Object.keys(mix)).forEach(function(key){
    var v = mix[key]; if(!v) return;
    var n = Math.max(1, Math.round(v / tot * N));
    for(var i = 0; i < n; i++){
      var t = idx++, r = Math.sqrt(t / N) * 0.95, a = t * GOLD;
      out.push({x: Math.cos(a) * r, y: Math.sin(a) * r, k: key, ph: (t * 0.7) % TAU});
    }
  });
  return out;
}

/* ---- colour helpers ----------------------------------------------------- */
function toRGB(c){
  if(!c) return [128,128,128];
  c = String(c).trim();
  if(c[0] === '#'){
    if(c.length === 4) return [parseInt(c[1]+c[1],16), parseInt(c[2]+c[2],16), parseInt(c[3]+c[3],16)];
    return [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
  }
  var m = c.match(/rgba?\(([^)]+)\)/);
  if(m){ var p = m[1].split(','); return [+p[0], +p[1], +p[2]]; }
  return [128,128,128];
}
function shade(rgb, f, a){
  var r = Math.max(0, Math.min(255, Math.round(rgb[0] * f)));
  var g = Math.max(0, Math.min(255, Math.round(rgb[1] * f)));
  var b = Math.max(0, Math.min(255, Math.round(rgb[2] * f)));
  return 'rgba(' + r + ',' + g + ',' + b + ',' + (a == null ? 1 : a) + ')';
}

/* ---- the bubble ---------------------------------------------------------
   opts: {seeds, colorOf, t, alpha, ring:{frac,color,width}, label, labelColor,
          bg, step, flat} */
function sphere(g, cx, cy, r, opts){
  opts = opts || {};
  var seeds = opts.seeds || [];
  var colorOf = opts.colorOf || function(){ return '#888'; };
  var t = REDUCED ? 0 : (opts.t || 0);
  var alpha = opts.alpha == null ? 0.9 : opts.alpha;
  if(r < 1.2) return;

  /* contact shadow - what actually separates a bubble from the plate */
  if(!opts.flat && r > 6){
    g.save();
    g.globalAlpha = alpha * 0.20;
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(cx + r * 0.10, cy + r * 0.16, r * 0.98, r * 0.94, 0, 0, TAU); g.fill();
    g.restore();
  }

  /* the tessellated surface: nearest-seed fill in a spherical projection, so the
     cells compress toward the rim exactly as they would on a real sphere */
  g.save();
  g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
  g.globalAlpha = alpha;
  var step = opts.step || (r > 30 ? 2 : r > 14 ? 2 : 3);
  if(seeds.length){
    for(var yy = -r; yy < r; yy += step){
      for(var xx = -r; xx < r; xx += step){
        var q = xx * xx + yy * yy;
        if(q > r * r) continue;
        var ux = xx / r, uy = yy / r;
        /* spherical un-projection: pull sample points toward the rim so the
           tessellation wraps a ball instead of tiling a flat disc */
        var d2 = ux * ux + uy * uy;
        var z = Math.sqrt(Math.max(0, 1 - d2));
        var k = 1 / (0.55 + 0.45 * z);
        var sx = ux * k, sy = uy * k;
        var bd = 9e9, bk = null;
        for(var s = 0; s < seeds.length; s++){
          var sd = seeds[s];
          /* the oscillation: each seed drifts on its own slow phase. The drift is
             a fraction of a cell so shares stay readable at every frame. */
          var ox = t ? Math.cos(t * 0.7 + sd.ph) * 0.035 : 0;
          var oy = t ? Math.sin(t * 0.9 + sd.ph) * 0.035 : 0;
          var dx = (sd.x + ox) - sx, dy = (sd.y + oy) - sy;
          var dd = dx * dx + dy * dy;
          if(dd < bd){ bd = dd; bk = sd.k; }
        }
        var rgb = toRGB(colorOf(bk));
        /* lambert-ish shading from a light up and to the left, plus a touch of
           ambient so the terminator never goes flat black */
        var lx = -0.45, ly = -0.55, lz = 0.70;
        var lam = Math.max(0, ux * lx + uy * ly + z * lz);
        var f = 0.62 + 0.72 * lam;
        g.fillStyle = shade(rgb, f, 1);
        g.fillRect(cx + xx, cy + yy, step, step);
      }
    }
  } else {
    g.fillStyle = 'rgba(140,140,140,0.5)';
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  if(!opts.flat){
    /* specular highlight */
    var hg = g.createRadialGradient(cx - r * 0.34, cy - r * 0.40, r * 0.03,
                                    cx - r * 0.34, cy - r * 0.40, r * 0.85);
    hg.addColorStop(0, 'rgba(255,255,255,0.42)');
    hg.addColorStop(0.35, 'rgba(255,255,255,0.10)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalAlpha = alpha; g.fillStyle = hg;
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    /* rim darkening, which is what reads as roundness */
    var rg = g.createRadialGradient(cx, cy, r * 0.62, cx, cy, r);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(0,0,0,0.30)');
    g.fillStyle = rg;
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  }
  g.restore();
  g.globalAlpha = 1;

  /* growth ring: an arc whose sweep is the magnitude being reported */
  if(opts.ring && opts.ring.frac != null){
    var fr = Math.max(0.03, Math.min(1, Math.abs(opts.ring.frac)));
    g.strokeStyle = opts.ring.color || '#888';
    g.lineWidth = opts.ring.width || 2.5;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(cx, cy, r + (opts.ring.width || 2.5) * 0.9 + 1.5, -Math.PI / 2, -Math.PI / 2 + TAU * fr);
    g.stroke();
    g.lineCap = 'butt';
  }
  /* a thin ring in the surface colour keeps overlapping bubbles apart */
  if(opts.bg){
    g.strokeStyle = opts.bg; g.lineWidth = 1.5;
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
  }
  if(opts.label && r > 15){
    g.fillStyle = opts.labelColor || '#111';
    g.font = '600 ' + Math.max(9, Math.min(12, r * 0.36)) + 'px system-ui';
    g.textAlign = 'center';
    g.fillText(opts.label, cx, cy + r + 12);
  }
}

/* ---- a shared clock so every surface oscillates in step ------------------ */
var CLOCK = {t: 0, raf: 0, subs: []};
function subscribe(fn){
  if(CLOCK.subs.indexOf(fn) < 0) CLOCK.subs.push(fn);
  start();
  return function(){ var i = CLOCK.subs.indexOf(fn); if(i >= 0) CLOCK.subs.splice(i, 1); };
}
function start(){
  if(CLOCK.raf || REDUCED) return;
  var last = performance.now();
  var loop = function(now){
    CLOCK.raf = requestAnimationFrame(loop);
    if(now - last < 55) return;          // ~18fps is plenty for a slow breathe
    last = now;
    CLOCK.t += 0.055;
    if(document.hidden) return;
    for(var i = 0; i < CLOCK.subs.length; i++){ try{ CLOCK.subs[i](CLOCK.t); }catch(e){} }
  };
  CLOCK.raf = requestAnimationFrame(loop);
}
function stop(){ if(CLOCK.raf){ cancelAnimationFrame(CLOCK.raf); CLOCK.raf = 0; } }

window.LXBub = {
  sphere: sphere, seedsFor: seedsFor, subscribe: subscribe,
  start: start, stop: stop, clock: CLOCK, reduced: REDUCED
};
})();
