/* locator.x - who each package is for.
   ----------------------------------------------------------------------------
   The Packages tab above this section is the engineering truth: twelve
   editions, a hard 16 MB ceiling, a registry that states exactly what each one
   carries. This section adds the commercial framing on top of that same,
   unmodified registry - never a second, prettier set of numbers.

   One constraint shapes everything below: every edition ships the identical
   application. There is no feature this app has that a smaller package lacks
   - the map, the underwriting sheet, the forecast field, the pattern miner,
   the Standard, the Academy, all of it, in every package. So a "tier" here is
   never a feature gate dressed up as a price point; it is a plain statement
   of which SCOPE of data fits which kind of buyer, derived from the real
   record counts already in the registry, not a separate opinion about them. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
var PKGS = function(){ return (window.LXPACKAGES && window.LXPACKAGES.editions) || []; };
var HERE = function(){ return (window.LXPACKAGES && window.LXPACKAGES.self) || null; };

/* bands are derived from the registry's own record counts, not a hand-kept
   list of names - so this never drifts out of sync with what actually ships */
var BANDS = [
  {id: 'starter', name: 'Single metro', max: 60000, cat: 1,
   who: 'An individual investor or a house-hacker working one market by hand',
   pitch: 'Everything this platform does, scoped to one metro you already know - light enough to learn the whole '
     + 'app on in an afternoon, and small enough that every property in it is one you could plausibly close on.'},
  {id: 'team', name: 'Metro, at depth', max: 150000, cat: 3,
   who: 'A brokerage team or a small investment shop running a real book of business',
   pitch: 'The same market, carried at enough depth to screen a whole pipeline - comps, evidence grading, the '
     + 'Standard’s pass/fail rollup - without switching tools between sourcing, underwriting and diligence.'},
  {id: 'institutional', name: 'Growth corridor, national', max: Infinity, cat: 5,
   who: 'An institutional desk, a fund, or a research team screening at portfolio scale',
   pitch: 'Multi-metro corridor coverage with the leading-indicator and dataset-correlation tooling built for '
     + 'comparing markets against each other, not just properties within one.'}
];
function bandOf(records){
  for(var i = 0; i < BANDS.length; i++) if((records || 0) <= BANDS[i].max) return BANDS[i];
  return BANDS[BANDS.length - 1];
}

function hero(){
  var P = window.LXPal;
  var cats = [1, 2, 3, 4, 5, 6, 7, 8];
  var w = 640, h = 92, n = cats.length;
  var bars = cats.map(function(c, i){
    var bw = w / n, bh = 28 + (Math.sin(i * 1.7) * 0.5 + 0.5) * (h - 40);
    var x = i * bw + bw * 0.14, bw2 = bw * 0.72;
    var col = P ? P.c(c) : 'var(--accent)';
    return '<rect x="' + x.toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + bw2.toFixed(1) + '" height="' + bh.toFixed(1)
      + '" rx="' + (bw2 / 2).toFixed(1) + '" fill="' + col + '" fill-opacity="0.82"/>';
  }).join('');
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Decorative bar motif in the platform\'s categorical palette" '
    + 'style="width:100%;max-width:640px;height:auto;display:block;margin:2px 0 4px">' + bars + '</svg>';
}

function tierBlock(band, pkgs){
  var P = window.LXPal, X = L();
  var col = P ? P.c(band.cat) : 'var(--accent)';
  var recTot = pkgs.reduce(function(t, p){ return t + (p.records || 0); }, 0);
  return '<div class="chart" style="border-top:3px solid ' + col + '">'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
    + (P ? P.swatch(col, 'circle', 13) : '') + '<h3 style="margin:0">' + esc(band.name) + '</h3>'
    + '<span style="margin-left:auto;font-size:11.5px;color:var(--muted)" class="num">' + pkgs.length + ' package' + (pkgs.length === 1 ? '' : 's') + '</span></div>'
    + '<p style="font-size:12.5px;color:var(--ink2);margin:0 0 6px"><b>' + esc(band.who) + '</b></p>'
    + '<p style="font-size:13px;color:var(--ink2);line-height:1.7;margin:0 0 10px;max-width:64ch">' + esc(band.pitch) + '</p>'
    + (pkgs.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px 10px;font-size:12px">'
      + pkgs.map(function(p){
          var isHere = HERE() && p.id === HERE();
          return '<span style="white-space:nowrap;color:var(--ink2)">' + (isHere ? '<b>' : '') + esc(p.name)
            + (isHere ? ' <span class="badge good" style="font-size:9.5px">you are here</span></b>' : '')
            + ' <span style="color:var(--muted)">(' + X.fmtN(p.records || 0) + ')</span></span>';
        }).join('<span style="color:var(--line2)">&middot;</span>')
      + '</div><p class="src" style="margin-top:8px">' + X.fmtN(recTot) + ' properties total in this band, this build.</p>' : '')
    + '</div>';
}

function render(){
  var host = $('#tiersroot'); if(!host) return;
  var list = PKGS();
  if(!list.length){ host.innerHTML = ''; return; }
  var live = list.filter(function(p){ return p.records > 0; });
  var grouped = {};
  BANDS.forEach(function(b){ grouped[b.id] = []; });
  live.forEach(function(p){ grouped[bandOf(p.records).id].push(p); });

  var h = hero();
  h += '<p style="font-size:13px;color:var(--ink2);max-width:86ch;margin:0 0 14px">Same application in every '
    + 'package &mdash; the map, the underwriting sheet, the Investment Standard, the forecast field, the Academy '
    + 'and the new graduate track below all ship in every edition without exception. What changes band to band is '
    + 'purely <b>scope</b>: how much of the country one package carries, derived here straight from the registry’s '
    + 'own record counts rather than a separate marketing figure.</p>';

  h += '<div style="display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-bottom:16px">'
    + BANDS.map(function(b){ return tierBlock(b, grouped[b.id]); }).join('') + '</div>';

  h += '<div class="chart"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
    + (window.LXPal ? window.LXPal.swatch('var(--accent)', 'diamond', 13) : '')
    + '<h3 style="margin:0">Education &amp; workforce training</h3></div>'
    + '<p style="font-size:13px;color:var(--ink2);line-height:1.7;margin:0 0 8px;max-width:72ch">Not a fourth data '
    + 'band &mdash; a use case that runs across every one of them. Every package carries the full Academy: the '
    + 'practitioner Tradecraft track, the role-based mission simulator with its self-issued portable credentials, '
    + 'and now a <b>Graduate &amp; Professional Certificate</b> track written at the register of a graduate '
    + 'real-estate-finance or urban-economics course, with citations to real open coursework and public research '
    + 'rather than a licensed textbook. A cohort, a bootcamp, or a college program can stand up a curriculum on '
    + 'live public-record data without this platform selling itself as an accredited institution at any point in '
    + 'that pitch &mdash; the certificate it issues says exactly what it is and is not, in its own text, every '
    + 'time it is generated.</p>'
    + '<p class="src">See the Academy tab’s Graduate &amp; professional certificate track for the six lessons and '
    + 'the certificate itself.</p></div>';

  host.innerHTML = h;
  if(window.LXPanels) setTimeout(function(){ LXPanels.scan('packages'); }, 140);
}
window.LXTiers = {render: render, BANDS: BANDS};
})();
