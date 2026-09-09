/* locator.x - the corridor field.
   ----------------------------------------------------------------------------
   One bubble per METRO rather than per city, plotted on two corridor measures at
   once, sized by the stock this catalogue actually holds there, and subdivided
   inside by a Voronoi mosaic whose cells are that metro's property mix. The point
   is to make the disagreements visible: a metro can rank first on announced jobs
   per permit and last on anything you could buy, and one picture should show both.

   Every axis is computed from figures already carried on the corridor record with
   their own source and as-of date, or counted from the records in this edition.
   Nothing is modelled and nothing is interpolated. Where a metro is missing a
   figure it is drawn hollow rather than placed at zero, because a missing permit
   series and a permit count of zero are not the same fact. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var $$ = function(s, el){ return [].slice.call((el || document).querySelectorAll(s)); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function N(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; }

/* ---- the measures ------------------------------------------------------- */
var AX = [
  {id:'jpp',   name:'Announced jobs per housing unit permitted', unit:'',
   get:function(m){ return (m.jobs && m.permits) ? m.jobs / m.permits : null; },
   note:'Announced direct jobs over private housing units authorised in the trailing twelve months. Both halves are published figures with their own sources. A high number means the jobs are arriving faster than the housing - it is never a count of households.'},
  {id:'cpj',   name:'Announced capital per announced job', unit:'$',
   get:function(m){ return (m.capital && m.jobs) ? m.capital / m.jobs : null; },
   note:'A data centre and an assembly plant with the same price tag employ wildly different numbers of people. This is what separates them.'},
  {id:'ppc',   name:'Permits per 100k residents', unit:'',
   get:function(m){ return (m.permits && m.pop) ? m.permits / m.pop * 1e5 : null; },
   note:'How freely the market can build. A permissive market answers a demand shock with buildings; a constrained one answers it with price.'},
  {id:'spc',   name:'Students per 100k residents', unit:'',
   get:function(m){ return (m.students && m.pop) ? m.students / m.pop * 1e5 : null; },
   note:'Enrolment is a demand floor that does not track the general economy, and campuses cannot relocate.'},
  {id:'cpc',   name:'Announced capital per resident', unit:'$',
   get:function(m){ return (m.capital && m.pop) ? m.capital / m.pop : null; },
   note:'Announced capital against the population that has to absorb it.'},
  {id:'evid',  name:'Share of records you could underwrite', unit:'%',
   get:function(m){ return m.abShare == null ? null : m.abShare * 100; },
   note:'Records graded A or B on what their source publishes. This is a fact about the county recorder, not about the market.'},
  {id:'mfsh',  name:'Share of stock that is verified multifamily', unit:'%',
   get:function(m){ return m.mfShare == null ? null : m.mfShare * 100; },
   note:'A recorded multifamily or lodging use, not a zoning permission.'},
  {id:'val',   name:'Median published value', unit:'$',
   get:function(m){ return m.medPrice; },
   note:'The median value the jurisdiction publishes - an assessor figure in almost every county here, never a listing price.'},
  {id:'recs',  name:'Records in this catalogue', unit:'',
   get:function(m){ return m.n; },
   note:'How much of this metro this edition actually holds. A short count is either a real market ceiling or a thin source, and the corridor panel says which.'}
];
var AXI = {}; AX.forEach(function(a){ AXI[a.id] = a; });

var MFRE = /apart|duplex|triplex|fourplex|multi|two family|three family|four family|townhouse|student|dorm|rooming|multiple res|subsidize|mobile home park|hotel|motel|\binn\b|lodge|resort/i;
var ZONED = /^zoned\b/i, UNCL = /unclassified/i;

var S = {x:'jpp', y:'evid', built:null, hover:null};

/* ---- build one row per metro ------------------------------------------- */
function build(){
  var C = window.LXCORRIDORS; if(!C || !C.metros) return null;
  var all = L().allListings();
  var agg = {};
  for(var i=0;i<all.length;i++){
    var l = all[i], k = l.nb || l.county; if(!k) continue;
    var g = agg[k] || (agg[k] = {n:0, mf:0, zoned:0, uncl:0, price:[], mix:{}});
    g.n++;
    var kind = l.kind || '';
    if(ZONED.test(kind)) g.zoned++;
    else if(UNCL.test(kind)) g.uncl++;
    else if(MFRE.test(kind)) g.mf++;
    if(N(l.price)) g.price.push(l.price);
    var cat = ZONED.test(kind) ? 'zoned' : UNCL.test(kind) ? 'uncl' : MFRE.test(kind) ? 'mf' : 'other';
    g.mix[cat] = (g.mix[cat] || 0) + 1;
  }
  var ev = null;
  try{ ev = window.LXEvid && window.LXEvid.scorecard(); }catch(e){}
  var evBy = {}; if(ev) ev.forEach(function(r){ evBy[r.key] = r; });

  var med = function(a){ if(!a.length) return null; var s = a.slice().sort(function(x,y){return x-y;}); return s[Math.floor(s.length/2)]; };
  var rows = [];
  C.metros.forEach(function(m){
    var key = m.dataKey || m.metro;
    var g = agg[key];
    if(!g){ // try a loose match on the leading name
      var lead = String(m.metro).split(',')[0].split(' + ')[0];
      for(var kk in agg){ if(kk.indexOf(lead) === 0){ g = agg[kk]; key = kk; break; } }
    }
    var e = evBy[key];
    rows.push({
      key: m.metro, short: String(m.metro).split(',')[0].slice(0, 26),
      jobs: m.jobs || null, capital: m.capital || null, permits: m.permits || null,
      pop: (m.pop && m.pop.value) ? m.pop.value : (typeof m.pop === 'number' ? m.pop : null),
      students: m.students || null,
      n: g ? g.n : 0,
      mfShare: g && g.n ? g.mf / g.n : null,
      medPrice: g ? med(g.price) : null,
      abShare: e ? e.gradeShare : null,
      mix: g ? g.mix : {},
      live: !!(g && g.n)
    });
  });
  return rows;
}

/* ---- the mosaic inside each bubble -------------------------------------- */
var CATC = {mf:'asset', other:'hack', zoned:'value', uncl:'liab'};
var CATN = {mf:'recorded multifamily or lodging', other:'other recorded use',
            zoned:'zoning permission only', uncl:'no use class published'};
function mosaic(mix){
  var tot = 0, ks = [];
  for(var k in mix){ tot += mix[k]; ks.push(k); }
  if(!tot) return [];
  var seeds = [], GOLD = Math.PI * (3 - Math.sqrt(5)), idx = 0, TOTSEED = 44;
  ks.forEach(function(k){
    var n = Math.max(1, Math.round(mix[k] / tot * TOTSEED));
    for(var i=0;i<n;i++){
      var t = idx++ , r = Math.sqrt(t / TOTSEED) * 0.94, a = t * GOLD;
      seeds.push({x: Math.cos(a) * r, y: Math.sin(a) * r, k: k});
    }
  });
  return seeds;
}

/* ---- draw --------------------------------------------------------------- */
function draw(){
  var cv = $('#cfcanvas'); if(!cv) return;
  var rows = S.built; if(!rows) return;
  var ax = AXI[S.x], ay = AXI[S.y];
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var W = cv.clientWidth || 760, H = 430;
  cv.width = W * dpr; cv.height = H * dpr;
  var g = cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0);
  g.clearRect(0,0,W,H);
  var P = window.LXPal;
  var ink = P.tok('--ink2'), muted = P.tok('--muted'), line = P.tok('--line');
  var pl = 66, pr = 18, pt = 16, pb = 44;

  var pts = rows.map(function(r){ return {r:r, x:ax.get(r), y:ay.get(r)}; });
  var ok = pts.filter(function(p){ return p.x != null && p.y != null; });
  if(!ok.length){
    g.fillStyle = muted; g.font = '13px system-ui'; g.textAlign = 'center';
    g.fillText('No corridor in this edition publishes both of those measures.', W/2, H/2);
    return;
  }
  var xs = ok.map(function(p){return p.x;}), ys = ok.map(function(p){return p.y;});
  var x0 = Math.min.apply(null,xs), x1 = Math.max.apply(null,xs);
  var y0 = Math.min.apply(null,ys), y1 = Math.max.apply(null,ys);
  if(x1 === x0) x1 = x0 + 1; if(y1 === y0) y1 = y0 + 1;
  var padx = (x1-x0)*0.12, pady = (y1-y0)*0.12;
  x0 -= padx; x1 += padx; y0 -= pady; y1 += pady;
  var X = function(v){ return pl + (v-x0)/(x1-x0) * (W-pl-pr); };
  var Y = function(v){ return H-pb - (v-y0)/(y1-y0) * (H-pt-pb); };

  // grid
  g.strokeStyle = line; g.lineWidth = 1; g.font = '10px system-ui'; g.fillStyle = muted;
  for(var i=0;i<=4;i++){
    var gy = pt + i*(H-pt-pb)/4, gv = y1 - i*(y1-y0)/4;
    g.beginPath(); g.moveTo(pl,gy); g.lineTo(W-pr,gy); g.stroke();
    g.textAlign='right'; g.fillText(fmtAx(gv, ay.unit), pl-6, gy+3);
    var gx = pl + i*(W-pl-pr)/4, gxv = x0 + i*(x1-x0)/4;
    g.beginPath(); g.moveTo(gx,pt); g.lineTo(gx,H-pb); g.stroke();
    g.textAlign='center'; g.fillText(fmtAx(gxv, ax.unit), gx, H-pb+14);
  }
  g.fillStyle = ink; g.textAlign='center'; g.font='11px system-ui';
  g.fillText(ax.name, (pl+W-pr)/2, H-8);
  g.save(); g.translate(13,(pt+H-pb)/2); g.rotate(-Math.PI/2); g.textAlign='center';
  g.fillText(ay.name, 0, 0); g.restore();

  var maxN = Math.max.apply(null, rows.map(function(r){return r.n||1;}));
  // hollow markers first, for metros missing one of the two measures
  pts.forEach(function(p){
    if(p.x != null && p.y != null) return;
    var cx = p.x != null ? X(p.x) : pl + 8, cy = p.y != null ? Y(p.y) : H-pb-8;
    g.strokeStyle = muted; g.setLineDash([2,2]); g.beginPath();
    g.arc(cx, cy, 5, 0, Math.PI*2); g.stroke(); g.setLineDash([]);
  });
  ok.forEach(function(p){
    var cx = X(p.x), cy = Y(p.y);
    var rad = 9 + Math.sqrt((p.r.n||1)/maxN) * 26;
    var seeds = window.LXBub.seedsFor(p.r.mix, ['mf','other','zoned','uncl'], 46);
    window.LXBub.sphere(g, cx, cy, rad, {
      seeds: seeds,
      colorOf: function(k){ return P.cat(CATC[k] || 'hack'); },
      t: window.LXBub.clock.t + (p.r._ph || (p.r._ph = Math.random() * 6)),
      alpha: 0.93, bg: P.tok('--bg'),
      label: p.r.short, labelColor: ink
    });
    p._cx = cx; p._cy = cy; p._r = rad;
  });
  S._pts = ok;
}
function fmtAx(v, unit){
  if(unit === '$') return v >= 1e6 ? '$'+(v/1e6).toFixed(1)+'M' : v >= 1e3 ? '$'+Math.round(v/1e3)+'k' : '$'+Math.round(v);
  if(unit === '%') return Math.round(v)+'%';
  return Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : (Math.abs(v)>=10? Math.round(v) : v.toFixed(2));
}

function render(){
  var host = $('#cfroot'); if(!host) return;
  if(!host.dataset.built){
    host.dataset.built = '1';
    host.innerHTML =
      '<div class="chart"><p class="eyebrow">The corridor field</p>'
      + '<h3 style="margin:2px 0 6px">Every corridor on two measures at once</h3>'
      + '<p style="font-size:13px;color:var(--ink2);max-width:84ch;margin:0 0 10px">One bubble per metro, sized by how much stock this catalogue holds there, and subdivided inside by what that stock actually is. A metro can rank first on announced jobs per permit and last on anything you could buy; putting both on one picture is the point. A metro missing one of the two measures is drawn as a small dashed ring rather than placed at zero, because a missing series and a value of zero are different facts.</p>'
      + '<div class="toolbar" style="margin-bottom:8px">'
      + '<label style="font-size:12px;color:var(--ink2)">across <select id="cfx"></select></label> '
      + '<label style="font-size:12px;color:var(--ink2)">up <select id="cfy"></select></label></div>'
      + '<canvas id="cfcanvas" style="width:100%;height:430px;display:block"></canvas>'
      + '<div id="cflegend" class="legend2" style="margin-top:8px"></div>'
      + '<p id="cfnote" class="src"></p></div>'
      + '<div id="cftable"></div>';
    var sx = $('#cfx'), sy = $('#cfy');
    AX.forEach(function(a){
      var o1 = document.createElement('option'); o1.value = a.id; o1.textContent = a.name; sx.appendChild(o1);
      var o2 = document.createElement('option'); o2.value = a.id; o2.textContent = a.name; sy.appendChild(o2);
    });
    sx.value = S.x; sy.value = S.y;
    sx.addEventListener('change', function(e){ S.x = e.target.value; paint(); });
    sy.addEventListener('change', function(e){ S.y = e.target.value; paint(); });
    window.addEventListener('resize', function(){ if($('#cfcanvas')) draw(); });
  }
  S.built = build();
  paint();
  if(!S._unsub) S._unsub = window.LXBub.subscribe(function(){
    if(document.querySelector('#corridorfield.active')) draw();
  });
  if(window.LXPanels) setTimeout(function(){ LXPanels.scan('corridorfield'); }, 140);
}

function paint(){
  draw();
  var P = window.LXPal;
  var leg = $('#cflegend');
  if(leg) leg.innerHTML = Object.keys(CATN).map(function(k){
    return '<span>' + P.swatch(P.cat(CATC[k]), 'circle', 12) + esc(CATN[k]) + '</span>';
  }).join('') + '<span style="color:var(--muted)">· bubble area = records held here · the mosaic inside is that metro’s mix</span>';
  var note = $('#cfnote');
  if(note) note.innerHTML = esc(AXI[S.x].note) + ' &nbsp;&middot;&nbsp; ' + esc(AXI[S.y].note)
    + ' Announced capital and jobs are the figures companies and states published, each with its own announcement date and source. An announced project is an intention, never a forecast of delivered jobs.';
  table();
}

function table(){
  var host = $('#cftable'); if(!host || !S.built) return;
  var ax = AXI[S.x], ay = AXI[S.y];
  var rows = S.built.slice().sort(function(a,b){
    var av = ax.get(a), bv = ax.get(b);
    if(av == null) return 1; if(bv == null) return -1; return bv - av;
  });
  host.innerHTML = '<div class="chart"><p class="eyebrow">The same field as numbers</p>'
    + '<div class="tablewrap"><table class="tbl"><thead><tr><th>Corridor</th><th class="r">'
    + esc(ax.name) + '</th><th class="r">' + esc(ay.name)
    + '</th><th class="r">Records</th><th class="r">Verified multifamily</th><th class="r">Grade A/B</th></tr></thead><tbody>'
    + rows.map(function(r){
        var xv = ax.get(r), yv = ay.get(r);
        return '<tr><td><b>' + esc(r.key) + '</b>' + (r.live ? '' : ' <span style="color:var(--muted);font-size:11px">no records in this edition</span>') + '</td>'
          + '<td class="r">' + (xv == null ? '<span style="color:var(--muted)">not published</span>' : fmtAx(xv, ax.unit)) + '</td>'
          + '<td class="r">' + (yv == null ? '<span style="color:var(--muted)">not published</span>' : fmtAx(yv, ay.unit)) + '</td>'
          + '<td class="r">' + L().fmtN(r.n) + '</td>'
          + '<td class="r">' + (r.mfShare == null ? '—' : Math.round(r.mfShare*100) + '%') + '</td>'
          + '<td class="r">' + (r.abShare == null ? '—' : Math.round(r.abShare*100) + '%') + '</td></tr>';
      }).join('')
    + '</tbody></table></div><p class="src">Sorted by the across-axis. A blank is a measure that corridor does not publish, never a zero.</p></div>';
}

window.LXCorridorField = {render:render, build:build, AX:AX};
})();
