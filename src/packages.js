/* locator.x - the package registry.
   ----------------------------------------------------------------------------
   A published page has a hard ceiling of 16 MB. The app shell - all the code,
   the basemap, every engine on every tab - costs about 2.6 MB of that and is
   identical in every edition, which leaves roughly 12.4 MB for parcels. At the
   compressed size these records actually pack to, that is around 300,000
   properties in one package.

   So the platform does not grow by making one page bigger. It grows by adding
   PACKAGES: each one a complete copy of the app carrying a different slice of
   the country, each independently under the ceiling, each knowing about the
   others. This tab is that registry. It exists so the ceiling is a published
   engineering fact rather than a surprise, and so the frontier - what is
   covered, what is researched but not pulled, and why - is visible from inside
   any package rather than living in someone's head. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }

var CAP_MB = 16, SHELL_MB = 2.6, TARGET_MB = 15;
var PKGS = function(){ return (window.LXPACKAGES && window.LXPACKAGES.editions) || []; };
var HERE = function(){ return (window.LXPACKAGES && window.LXPACKAGES.self) || null; };

function bar(mb){
  var pctFull = Math.min(100, mb / CAP_MB * 100);
  var pctShell = Math.min(100, SHELL_MB / CAP_MB * 100);
  var col = mb > 15.2 ? 'var(--bad)' : mb > 13 ? 'var(--warn)' : 'var(--good)';
  return '<div style="display:flex;height:9px;border-radius:3px;overflow:hidden;background:var(--panel2);min-width:120px">'
    + '<i style="width:' + pctShell.toFixed(1) + '%;background:var(--line2)" title="app shell"></i>'
    + '<i style="width:' + Math.max(0, pctFull - pctShell).toFixed(1) + '%;background:' + col + '" title="parcel data"></i>'
    + '</div>';
}

function render(){
  var host = $('#pkgroot'); if(!host) return;
  var X = L(), list = PKGS(), here = HERE();
  if(!list.length){ host.innerHTML = '<div class="chart"><p style="font-size:13.5px;color:var(--ink2);margin:0">'
    + 'No package registry is carried in this build.</p></div>'; return; }

  var live = list.filter(function(p){ return p.records > 0; });
  var totalRec = live.reduce(function(t, p){ return t + (p.records || 0); }, 0);
  var totalMb = live.reduce(function(t, p){ return t + (p.mb || 0); }, 0);
  var headroom = live.reduce(function(t, p){ return t + Math.max(0, TARGET_MB - (p.mb || 0)); }, 0);
  var perMb = totalMb > SHELL_MB ? totalRec / (totalMb - SHELL_MB * live.length) : 0;

  var h = '<div class="tiles" style="margin-bottom:14px">'
    + tile('Packages', String(live.length), 'each a complete app under the 16 MB ceiling')
    + tile('Properties carried', X.fmtN(totalRec), 'across every package')
    + tile('Headroom left', headroom.toFixed(1) + ' MB',
           'about ' + X.fmtN(Math.round(headroom * 1048576 / 40)) + ' more records without a new package')
    + tile('Cost per record', perMb ? Math.round(1048576 / perMb) + ' bytes' : '—', 'compressed, in the shipped page')
    + '</div>';

  h += '<div class="chart"><p class="eyebrow">Why there is more than one page</p>'
    + '<h3 style="margin:2px 0 8px">The ceiling is 16 MB and the shell costs 2.6 of it</h3>'
    + '<p style="font-size:13.5px;color:var(--ink2);line-height:1.8;max-width:86ch;margin:0">'
    + 'Every package carries the same application &mdash; the map, the underwriting engine, the forecast field, '
    + 'the pattern miner, the standard &mdash; and a different slice of the country. The shell is about '
    + '<b>2.6 MB</b> and is identical everywhere; a published page may not exceed <b>16 MB</b>; so a package has '
    + 'roughly <b>12.4 MB</b> for parcels, which at the size these records compress to is around '
    + '<b>300,000 properties</b>. Growth therefore means more packages, not bigger ones. Splitting also keeps '
    + 'the thing usable: a browser that has to parse 300,000 records before drawing a map is already at the edge '
    + 'of what a laptop will do cheerfully, and the ceiling turns out to sit near the same place for both reasons.</p></div>';

  h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">The registry</p>'
    + '<h3 style="margin:2px 0 8px">Every package, what it covers, and how full it is</h3>'
    + '<div class="tablewrap"><table class="tbl"><thead><tr><th>Package</th><th>Covers</th>'
    + '<th class="r">Properties</th><th class="r">Size</th><th>Against the 15 MB target</th>'
    + '<th class="r">Index coverage</th><th></th></tr></thead><tbody>';
  list.forEach(function(p){
    var isHere = here && p.id === here;
    h += '<tr' + (isHere ? ' style="background:var(--panel2)"' : '') + '>'
      + '<td><b>' + esc(p.name) + '</b>' + (isHere ? ' <span class="badge good">you are here</span>' : '')
      + (p.note ? '<div style="font-size:11px;color:var(--muted)">' + esc(p.note) + '</div>' : '') + '</td>'
      + '<td class="wrap" style="font-size:12px;max-width:280px">' + esc((p.covers || []).join(', ')) + '</td>'
      + '<td class="r">' + (p.records ? X.fmtN(p.records) : '<span style="color:var(--muted)">—</span>') + '</td>'
      + '<td class="r">' + (p.mb ? p.mb.toFixed(1) + ' MB' : '—') + '</td>'
      + '<td>' + (p.mb ? bar(p.mb) : '') + '</td>'
      + '<td class="r">' + (p.coverage == null ? '<span style="color:var(--muted)">—</span>'
          : '<span style="color:' + (p.coverage >= 0.85 ? 'var(--good)' : p.coverage >= 0.4 ? 'var(--warn)' : 'var(--bad)') + '">'
            + Math.round(p.coverage * 100) + '%</span>') + '</td>'
      + '<td>' + (p.url && !isHere ? '<a class="btn" href="' + esc(p.url) + '" target="_blank" rel="noopener" style="font-size:11px">Open</a>' : '') + '</td>'
      + '</tr>';
  });
  h += '</tbody></table></div>'
    + '<p class="src">The grey part of each bar is the app shell, identical in every package; the coloured part is '
    + 'that package&rsquo;s parcels. <b>Index coverage</b> is the share of a package&rsquo;s properties sitting in a ZIP '
    + 'that has a published monthly series &mdash; below that share, nothing on the Predictions tab speaks to them.</p></div>';

  var front = (window.LXPACKAGES && window.LXPACKAGES.frontier) || [];
  if(front.length){
    h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">The frontier</p>'
      + '<h3 style="margin:2px 0 8px">Researched, and deliberately not pulled</h3>'
      + '<p style="font-size:13px;color:var(--ink2);max-width:86ch;margin:0 0 10px">Adding a market is not a matter '
      + 'of appetite. This platform will not classify a property without a use code or a published zoning key, and '
      + 'several markets with plenty of parcels have neither. Each one below was reached, tested and turned down for '
      + 'a stated reason, kept here so the week is not spent twice.</p>'
      + '<div class="tablewrap"><table class="tbl"><thead><tr><th>Market</th><th>What stops it</th></tr></thead><tbody>'
      + front.map(function(f){ return '<tr><td class="wrap" style="max-width:230px"><b>' + esc(f.name)
          + '</b></td><td class="wrap" style="font-size:12.5px;max-width:640px">'
          + esc(f.why) + '</td></tr>'; }).join('')
      + '</tbody></table></div></div>';
  }
  host.innerHTML = h;
  if(window.LXPanels) setTimeout(function(){ LXPanels.scan('packages'); }, 140);
}
function tile(k, v, note){
  return '<div class="tile"><p class="eyebrow" style="margin:0">' + esc(k) + '</p>'
    + '<p class="big num" style="margin:4px 0 2px">' + v + '</p>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:0">' + esc(note) + '</p></div>';
}
window.LXPkg = {render: render};
})();
