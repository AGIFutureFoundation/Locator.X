/* locator.x - the relational map.
   ----------------------------------------------------------------------------
   Everywhere else in this app the data is laid out on geography or on two chosen
   axes. This tab lays it out by RELATIONSHIP: a force-directed graph where the
   position of a node carries no meaning at all except its connections, so what
   you read is structure - which ZIPs a project actually reaches, which markets
   are held together by one employer, which cluster has capital arriving and
   which had it withdrawn.

   Nodes are drawn through the same lit-sphere renderer as every other bubble
   surface, and a ZIP's skin is the Voronoi mosaic of the housing categories
   inside it, so a node is not an abstract dot - it still shows what it is made
   of. Size is the stock behind it.

   THE LAYOUT IS NOT DATA. A force simulation puts a node where the springs
   settle, which depends on the random seed and the iteration count. Distance
   between two unconnected nodes means nothing; only the EDGES mean anything.
   Graph pictures invite over-reading, so the page says this out loud rather
   than letting a pleasing arrangement imply structure that is not there.

   The simulation is written here rather than pulled in: repulsion, springs and
   a weak centring pull, integrated with velocity damping. Roughly sixty lines,
   no dependency, and it stops on its own once the total movement falls below a
   threshold instead of running a fixed number of ticks forever. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function N(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; }

var CATS = [
  {id:'mf5',   slot:'asset', re:/apart|multi-?family5|5\+|20 to 39|40 or more|100 or more|25 to 99|multiple res/i},
  {id:'mf24',  slot:'hack',  re:/duplex|triplex|fourplex|two family|three family|four family|4 to 19|twin home|2 units|3 units|4 units|multi-?family<4|under 4/i},
  {id:'lodge', slot:'value', re:/hotel|motel|\binn\b|lodge|resort|tourist cabin|bed and breakfast|dorm|student|rooming|fratrnty|sorority|group/i},
  {id:'comm',  slot:'growth',re:/commercial|office|retail|business|warehouse|shopping|restaurant|supermarket|industrial|bank/i},
  {id:'other', slot:'liab',  re:/./}
];
function catOf(k){ k = k || ''; for(var i=0;i<CATS.length;i++) if(CATS[i].re.test(k)) return CATS[i].id; return 'other'; }
function slotOf(id){ for(var i=0;i<CATS.length;i++) if(CATS[i].id === id) return CATS[i].slot; return 'liab'; }

var S = {g:null, cv:null, sim:null, hover:null, sel:null, unsub:null, mode:'capital'};

/* ---- build the graph --------------------------------------------------- */
function build(mode){
  var X = L();
  var all;
  try{ all = X.filtered ? X.filtered() : X.allListings(); }catch(e){ all = X.allListings(); }
  if(!all || !all.length) return null;

  /* ZIP nodes, capped so the picture stays a picture */
  var byZip = {};
  for(var i = 0; i < all.length; i++){
    var l = all[i], z = l.zip; if(!z) continue;
    var g = byZip[z] || (byZip[z] = {id:'z' + z, kind:'zip', label:z, n:0, mix:{},
                                     lat:0, lng:0, metro:l.nb || l.county || l.city || ''});
    g.n++; g.mix[catOf(l.kind)] = (g.mix[catOf(l.kind)] || 0) + 1;
    if(l.lat != null){ g.lat += l.lat; g.lng += l.lng; }
  }
  var zips = [];
  for(var k in byZip){ var b = byZip[k]; if(b.n < 20) continue; b.lat /= b.n; b.lng /= b.n; zips.push(b); }
  zips.sort(function(a, b2){ return b2.n - a.n; });
  zips = zips.slice(0, 90);
  var zipIdx = {}; zips.forEach(function(z){ zipIdx[z.label] = z; });

  var nodes = zips.slice(), edges = [];

  /* metro nodes: containment edges */
  var metros = {};
  zips.forEach(function(z){
    var m = String(z.metro || '').trim(); if(!m) return;
    var mn = metros[m] || (metros[m] = {id:'m' + m, kind:'metro', label:m, n:0, mix:{}});
    mn.n += z.n;
    for(var c in z.mix) mn.mix[c] = (mn.mix[c] || 0) + z.mix[c];
    edges.push({a:mn, b:z, w:0.9, kind:'in'});
  });
  for(var mk in metros) nodes.push(metros[mk]);

  /* project and campus nodes: proximity edges, computed here rather than read
     off the baked projCo field, because that field does not know what has
     happened to a project since the parcels were built */
  function near(list, kindName, radiusKm, mk){
    (list || []).forEach(function(p){
      if(p.lat == null || p.lng == null) return;
      var hit = [];
      zips.forEach(function(z){
        if(z.lat == null) return;
        var d = window.LXCorp ? LXCorp.dist(z.lat, z.lng, p.lat, p.lng) : 1e9;
        if(d <= radiusKm) hit.push({z:z, d:d});
      });
      if(!hit.length) return;
      var node = mk(p, hit);
      nodes.push(node);
      hit.forEach(function(h){ edges.push({a:node, b:h.z, w:Math.max(0.15, 1 - h.d/radiusKm), kind:node.kind}); });
    });
  }
  if(mode === 'capital'){
    near(window.LXCORP, 'project', 30, function(p, hit){
      return {id:'p' + p.company + p.city, kind: p.dead ? 'dead' : 'project',
              label:p.company, n: p.investment ? Math.max(40, Math.log10(p.investment) * 260) : 120,
              mix:{}, dead:!!p.dead, atRisk:!!p.atRisk, meta:p, reach:hit.length};
    });
  } else {
    near((window.LXCAMPUS || []).map(function(c){
      return {company:c[0], city:c[1], lat:c[3], lng:c[4], enroll:c[5], term:c[6]};
    }), 'campus', 12, function(p, hit){
      return {id:'c' + p.company, kind:'campus', label:p.company,
              n: p.enroll ? Math.max(40, p.enroll / 8) : 80, mix:{}, meta:p, reach:hit.length};
    });
  }

  /* seed positions on a circle - deterministic, so the picture is the same
     every time you open the tab */
  nodes.forEach(function(nd, i){
    var a = i / nodes.length * Math.PI * 2;
    nd.x = Math.cos(a) * 200 + (i % 7) * 3;
    nd.y = Math.sin(a) * 200 + (i % 5) * 3;
    nd.vx = 0; nd.vy = 0;
    if(nd.kind === 'zip' || nd.kind === 'metro'){
      nd.seeds = window.LXBub.seedsFor(nd.mix, CATS.map(function(c){ return c.id; }), 40);
    }
    nd.r = nd.kind === 'metro' ? 16 : Math.max(5, Math.min(26, 4 + Math.sqrt(nd.n) * 0.30));
  });
  return {nodes:nodes, edges:edges, zips:zips.length, metros:Object.keys(metros).length};
}

/* ---- the simulation ----------------------------------------------------- */
function settle(G, iters){
  var n = G.nodes, e = G.edges;
  for(var it = 0; it < iters; it++){
    var moved = 0;
    /* repulsion, O(n^2) but n is capped near 150 so this is nothing */
    for(var i = 0; i < n.length; i++) for(var j = i + 1; j < n.length; j++){
      var a = n[i], b = n[j];
      var dx = b.x - a.x, dy = b.y - a.y;
      var d2 = dx*dx + dy*dy; if(d2 < 1) d2 = 1;
      var d = Math.sqrt(d2);
      var f = 2600 / d2;
      var ux = dx/d, uy = dy/d;
      a.vx -= ux*f; a.vy -= uy*f; b.vx += ux*f; b.vy += uy*f;
    }
    /* springs */
    for(var q = 0; q < e.length; q++){
      var ed = e[q], A = ed.a, B = ed.b;
      var dx2 = B.x - A.x, dy2 = B.y - A.y;
      var dd = Math.sqrt(dx2*dx2 + dy2*dy2) || 1;
      var rest = 60 + A.r + B.r;
      var f2 = (dd - rest) * 0.012 * ed.w;
      var ux2 = dx2/dd, uy2 = dy2/dd;
      A.vx += ux2*f2; A.vy += uy2*f2; B.vx -= ux2*f2; B.vy -= uy2*f2;
    }
    for(var t = 0; t < n.length; t++){
      var nd = n[t];
      nd.vx -= nd.x * 0.0016; nd.vy -= nd.y * 0.0016;   /* weak centring */
      nd.vx *= 0.82; nd.vy *= 0.82;                      /* damping */
      nd.x += nd.vx; nd.y += nd.vy;
      moved += Math.abs(nd.vx) + Math.abs(nd.vy);
    }
    if(moved / n.length < 0.05) break;   /* settled; stop rather than spin */
  }
  return G;
}

/* ---- draw --------------------------------------------------------------- */
function draw(){
  var cv = S.cv; if(!cv || !cv.isConnected || !S.g) return;
  var P = window.LXPal, G = S.g;
  var w = cv.clientWidth || 900, h = cv.clientHeight || 560;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  if(cv.width !== Math.round(w*dpr)){ cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr); }
  var g = cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h);

  var xs = G.nodes.map(function(n){ return n.x; }), ys = G.nodes.map(function(n){ return n.y; });
  var x0 = Math.min.apply(null,xs), x1 = Math.max.apply(null,xs);
  var y0 = Math.min.apply(null,ys), y1 = Math.max.apply(null,ys);
  var pad = 40;
  var sc = Math.min((w-pad*2)/Math.max(1,x1-x0), (h-pad*2)/Math.max(1,y1-y0));
  var cx = (x0+x1)/2, cy = (y0+y1)/2;
  var PX = function(x){ return w/2 + (x-cx)*sc; }, PY = function(y){ return h/2 + (y-cy)*sc; };

  var hot = S.sel || S.hover;
  var lit = null;
  if(hot){ lit = {}; lit[hot.id] = 1;
    G.edges.forEach(function(e){ if(e.a === hot) lit[e.b.id] = 1; if(e.b === hot) lit[e.a.id] = 1; }); }

  /* edges first, dimmed unless they touch the focused node */
  G.edges.forEach(function(e){
    var on = !lit || (e.a === hot || e.b === hot);
    g.globalAlpha = on ? 0.55 : 0.07;
    g.strokeStyle = e.kind === 'dead' ? P.tok('--bad') : e.kind === 'project' ? P.cat('growth')
                  : e.kind === 'campus' ? P.cat('value') : P.tok('--line2');
    g.lineWidth = on ? 1.4 : 0.8;
    if(e.kind === 'dead'){ g.save(); g.setLineDash([3,3]); }
    g.beginPath(); g.moveTo(PX(e.a.x), PY(e.a.y)); g.lineTo(PX(e.b.x), PY(e.b.y)); g.stroke();
    if(e.kind === 'dead') g.restore();
  });
  g.globalAlpha = 1;

  var t = window.LXBub ? window.LXBub.clock.t : 0;
  G.nodes.forEach(function(nd){
    var px = PX(nd.x), py = PY(nd.y), r = nd.r;
    nd._px = px; nd._py = py;
    var dim = lit && !lit[nd.id];
    var alpha = dim ? 0.16 : (nd === hot ? 0.99 : 0.85);
    if(nd.kind === 'zip' || nd.kind === 'metro'){
      window.LXBub.sphere(g, px, py, r, {
        seeds: nd.seeds, colorOf: function(k){ return P.cat(slotOf(k)); },
        t: t + (nd._ph || (nd._ph = (nd.label.length * 7) % 60 / 10)),
        alpha: alpha, bg: P.tok('--bg'),
        ring: nd.kind === 'metro' ? {frac:1, width:2.2, color:P.tok('--ink2')} : null
      });
    } else {
      var col = nd.dead ? P.tok('--bad') : nd.atRisk ? P.tok('--warn')
              : nd.kind === 'campus' ? P.cat('value') : P.cat('growth');
      window.LXBub.sphere(g, px, py, r, {
        seeds:[{x:0,y:0,k:'a',ph:0}], colorOf:function(){ return col; },
        t:t, alpha:alpha, bg:P.tok('--bg') });
      if(nd.dead){
        g.save(); g.globalAlpha = dim ? 0.2 : 0.9; g.strokeStyle = P.tok('--bg'); g.lineWidth = 2;
        g.beginPath(); g.moveTo(px-r*0.55, py-r*0.55); g.lineTo(px+r*0.55, py+r*0.55);
        g.moveTo(px+r*0.55, py-r*0.55); g.lineTo(px-r*0.55, py+r*0.55); g.stroke(); g.restore();
      }
    }
    if(!dim && (r > 13 || nd === hot)){
      g.fillStyle = P.tok('--ink'); g.font = '600 10px system-ui'; g.textAlign = 'center';
      var lab = nd.kind === 'zip' ? nd.label : String(nd.label).slice(0, 18);
      g.fillText(lab, px, py + r + 11);
    }
  });
  g.globalAlpha = 1;
}

/* ---- interaction -------------------------------------------------------- */
function hit(ev){
  var r = S.cv.getBoundingClientRect();
  var mx = ev.clientX - r.left, my = ev.clientY - r.top, best = null, bd = 1e9;
  (S.g ? S.g.nodes : []).forEach(function(n){
    if(n._px == null) return;
    var d = Math.hypot(n._px - mx, n._py - my);
    if(d < n.r + 5 && d < bd){ bd = d; best = n; }
  });
  return best;
}
function tip(n){
  var X = L();
  if(n.kind === 'zip')
    return '<b>ZIP ' + esc(n.label) + '</b><div>' + X.fmtN(n.n) + ' records</div>'
      + '<div style="color:var(--muted)">' + esc(n.metro || '') + '</div>';
  if(n.kind === 'metro')
    return '<b>' + esc(n.label) + '</b><div>' + X.fmtN(n.n) + ' records across its ZIPs</div>';
  if(n.kind === 'campus')
    return '<b>' + esc(n.label) + '</b><div>' + (n.meta.enroll ? X.fmtN(n.meta.enroll) + ' enrolled' : 'enrolment not published')
      + (n.meta.term ? ' (' + esc(n.meta.term) + ')' : '') + '</div>'
      + '<div style="color:var(--muted)">reaches ' + n.reach + ' ZIP' + (n.reach === 1 ? '' : 's') + ' within 12 km</div>';
  var p = n.meta;
  return '<b>' + esc(p.company) + '</b>' + (n.dead ? ' <span style="color:var(--bad)">CANCELLED</span>' : n.atRisk ? ' <span style="color:var(--warn)">AT RISK</span>' : '')
    + '<div>' + esc(String(p.project || '').slice(0, 90)) + '</div>'
    + '<div>' + (p.investment ? (window.LXCorp ? LXCorp.fmt$(p.investment) : p.investment) : 'capital not disclosed')
    + (p.jobs ? ' · ' + X.fmtN(p.jobs) + ' announced jobs' : '') + '</div>'
    + '<div style="color:var(--muted)">reaches ' + n.reach + ' ZIP' + (n.reach === 1 ? '' : 's') + ' within 30 km'
    + (n.dead ? ' — and contributes nothing to any score' : '') + '</div>';
}

/* ---- render ------------------------------------------------------------- */
function render(){
  var host = $('#netroot'); if(!host) return;
  var X = L();
  var G = build(S.mode);
  if(!G){ host.innerHTML = '<div class="chart"><p style="font-size:13.5px;color:var(--ink2);margin:0">'
    + 'Nothing loaded to map.</p></div>'; return; }
  settle(G, 420);
  S.g = G;

  var dead = G.nodes.filter(function(n){ return n.dead; });
  var proj = G.nodes.filter(function(n){ return n.kind === 'project' || n.kind === 'dead'; });
  var camp = G.nodes.filter(function(n){ return n.kind === 'campus'; });
  var orphan = G.nodes.filter(function(n){ return n.kind === 'zip' && !G.edges.some(function(e){
    return (e.a === n || e.b === n) && (e.kind === 'project' || e.kind === 'dead' || e.kind === 'campus'); }); });

  var h = '<div class="tiles" style="margin-bottom:14px">'
    + tile('ZIP nodes', X.fmtN(G.zips), 'the largest by record count in this edition')
    + tile(S.mode === 'capital' ? 'Projects reaching them' : 'Campuses reaching them',
           String(S.mode === 'capital' ? proj.length : camp.length),
           S.mode === 'capital' ? 'within 30 km of at least one mapped ZIP' : 'within 12 km of at least one mapped ZIP')
    + tile('Unreached ZIPs', String(orphan.length),
           S.mode === 'capital' ? 'no announced project within 30 km' : 'no campus within 12 km')
    + tile(S.mode === 'capital' ? 'Cancelled in the graph' : 'Enrolment mapped',
           S.mode === 'capital' ? String(dead.length) : X.fmtN(camp.reduce(function(t,c){ return t + (c.meta.enroll||0); }, 0)),
           S.mode === 'capital' ? 'drawn crossed out, edges dashed' : 'summed across mapped campuses')
    + '</div>';

  h += '<div class="chart tall"><p class="eyebrow">The relational map</p>'
    + '<h3 style="margin:2px 0 4px">' + (S.mode === 'capital'
        ? 'Which housing stock each announced project actually reaches'
        : 'Which housing stock each campus actually reaches') + '</h3>'
    + '<div class="recotabs" id="netmode" style="margin:6px 0 8px">'
    + '<button aria-selected="' + (S.mode==='capital') + '" data-m="capital">Capital</button>'
    + '<button aria-selected="' + (S.mode==='campus') + '" data-m="campus">Campuses</button></div>'
    + '<p style="font-size:13px;color:var(--ink2);max-width:88ch;margin:0 0 8px">Each large ringed sphere is a '
    + 'market; the smaller mosaic spheres are its ZIPs, skinned by the housing categories inside them and sized '
    + 'by stock. ' + (S.mode === 'capital'
        ? 'Solid single-colour nodes are announced projects, joined to every ZIP within 30 km. <b>Crossed-out nodes are '
          + 'projects that were cancelled or closed</b>, and their edges are dashed &mdash; those ZIPs were reached '
          + 'by capital that has since been withdrawn, which is a fact about them worth seeing in one picture.'
        : 'The single-colour nodes are campuses, joined to every ZIP within 12 km &mdash; the catchment inside which student '
          + 'demand is a real factor rather than a story.')
    + ' Hover a node to isolate its connections; click to pin.</p>'
    + legend()
    + '<canvas id="netcv" style="width:100%;height:560px;display:block;cursor:pointer"></canvas>'
    + '<p class="src"><b>Position carries no meaning.</b> A force layout puts a node where its springs settle; the '
    + 'distance between two unconnected nodes is an artefact of the simulation, not a measurement. Only the edges '
    + 'mean anything. Graph pictures invite over-reading and this one is no exception &mdash; read what is joined '
    + 'to what, and ignore what merely ended up nearby.</p></div>';

  host.innerHTML = h;
  S.cv = $('#netcv');
  S.cv.addEventListener('mousemove', function(e){
    var n = hit(e);
    if(n !== S.hover){ S.hover = n; draw(); }
    if(n) window.LXPal.tip(e, tip(n)); else window.LXPal.tipHide();
  });
  S.cv.addEventListener('mouseleave', function(){ S.hover = null; window.LXPal.tipHide(); draw(); });
  S.cv.addEventListener('click', function(e){ var n = hit(e); S.sel = (S.sel === n) ? null : n; draw(); });
  Array.prototype.forEach.call(host.querySelectorAll('#netmode button'), function(b){
    b.addEventListener('click', function(){ S.mode = b.dataset.m; S.sel = null; S.hover = null; render(); });
  });
  draw();
  if(!S.unsub && window.LXBub){
    S.unsub = window.LXBub.subscribe(function(){
      try{ if(document.querySelector('#network.active')) draw(); }catch(e){}
    });
  }
  window.addEventListener('resize', draw);
  if(window.LXPanels) setTimeout(function(){ LXPanels.scan('network'); }, 140);
}
/* The legend draws its swatches from the SAME P.cat() calls the canvas uses, so
   the words and the pixels cannot drift apart. An earlier draft described live
   projects as "green" in prose while the renderer painted them violet, which is
   the specific way a hand-written legend goes wrong. */
function legend(){
  var P = window.LXPal;
  var sw = function(col, label, dashed){
    return '<span style="display:inline-flex;align-items:center;gap:6px;margin-right:14px">'
      + '<span style="width:12px;height:12px;border-radius:50%;background:' + col + ';display:inline-block'
      + (dashed ? ';outline:1px dashed var(--bad);outline-offset:2px' : '') + '"></span>'
      + esc(label) + '</span>';
  };
  var cat = CATS.map(function(c, i){
    return sw(P.cat(c.slot), ['Apartments 5+','Small multifamily 2-4','Lodging and group','Commercial and industrial','Everything else'][i]);
  }).join('');
  return '<div style="font-size:11.5px;color:var(--ink2);line-height:2;margin:2px 0 6px">'
    + '<div><b>Node type</b> &nbsp;'
    + sw(P.tok('--ink2'), 'Market (ringed)')
    + (S.mode === 'capital'
        ? sw(P.cat('growth'), 'Live announced project') + sw(P.tok('--bad'), 'Cancelled or closed (crossed out, dashed edges)', true)
          + sw(P.tok('--warn'), 'At risk')
        : sw(P.cat('value'), 'Campus'))
    + '</div>'
    + '<div><b>ZIP skin</b> &nbsp;' + cat + '</div></div>';
}
function tile(k, v, note){
  return '<div class="tile"><p class="eyebrow" style="margin:0">' + esc(k) + '</p>'
    + '<p class="big num" style="margin:4px 0 2px">' + v + '</p>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:0">' + esc(note) + '</p></div>';
}
window.LXNet = {render: render, build: build, settle: settle};
})();
