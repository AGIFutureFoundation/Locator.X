/* locator.x - the data resources catalogue, and the elevation lookup.
   ----------------------------------------------------------------------------
   Two things live here. The first is an honest inventory of the public sources
   this platform can join to a parcel: what each one is, how it attaches, how
   stale it is, what licence governs it, and - the part most catalogues omit -
   what was TESTED AND REJECTED and why. A rejected source that sounds useful is
   worth more written down than quietly forgotten, because otherwise the next
   person spends a day rediscovering that it returns nothing joinable.

   The second is elevation. The USGS 3DEP point service returns a real per-parcel
   ground elevation, and against a flood layer's base flood elevation that gives
   freeboard - which is the number insurers actually reprice on. It is fetched on
   demand for one property at a time, never in bulk, because a records service is
   not a bulk endpoint and this platform does not treat one as such. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }

var CAT = (window.LXSOURCES && window.LXSOURCES.resources) || [];
var REJ = (window.LXSOURCES && window.LXSOURCES.rejected) || [];
var FLAG = (window.LXSOURCES && window.LXSOURCES.flagged_for_human_decision) || [];

/* ---- elevation ----------------------------------------------------------
   Three traps, all observed live against the real service and all guarded here:
     1. `value` is not consistently typed - units=Meters returns a STRING,
        units=Feet returns a NUMBER. Coerce always.
     2. A point off the DEM returns HTTP 200 with a NON-JSON body
        ("Call failed. [Failed cloud operation...]"), so a bare JSON.parse throws
        on a 200. Read as text and guard.
     3. AcquisitionDate can be malformed - "1/0/2021", day zero. Keep it a string
        and never parse it into a Date. */
var EPQS = 'https://epqs.nationalmap.gov/v1/json';
var ECACHE = {};
function elevation(lat, lng, cb){
  var key = lat.toFixed(5) + ',' + lng.toFixed(5);
  if(ECACHE[key]){ cb(ECACHE[key]); return; }
  var url = EPQS + '?x=' + encodeURIComponent(lng) + '&y=' + encodeURIComponent(lat)
          + '&units=Feet&wkid=4326&includeDate=true';
  var done = function(o){ ECACHE[key] = o; cb(o); };
  try{
    fetch(url).then(function(r){ return r.text(); }).then(function(txt){
      var j = null;
      try{ j = JSON.parse(txt); }
      catch(e){ done({ok:false, why:'The elevation service returned a non-JSON body for this point, which is how it reports a location outside its coverage.'}); return; }
      var v = j && j.value;
      var num = (typeof v === 'string') ? parseFloat(v) : v;
      if(num == null || !isFinite(num)){ done({ok:false, why:'No elevation is published for this coordinate.'}); return; }
      done({ok:true, feet:num,
            res: j.resolution == null ? null : j.resolution,
            acquired: (j.attributes && j.attributes.AcquisitionDate) || null});
    }).catch(function(e){
      done({ok:false, why:'The elevation service could not be reached from this page. Pages hosted on claude.ai block outside servers; open the downloaded file to use it.'});
    });
  }catch(e){ done({ok:false, why:'Elevation lookup is unavailable here.'}); }
}

/* the drawer block: a button, because this is an on-demand single-point lookup
   and firing it for every card would hammer a public service */
function drawer(l){
  if(l.lat == null || l.lng == null) return '';
  var id = 'elev_' + String(l.id).replace(/[^a-z0-9]/gi, '');
  setTimeout(function(){
    var b = document.getElementById(id + '_b'); if(!b || b.dataset.w) return;
    b.dataset.w = '1';
    b.addEventListener('click', function(){
      var out = document.getElementById(id);
      b.disabled = true; b.textContent = 'Looking up…';
      elevation(l.lat, l.lng, function(o){
        b.style.display = 'none';
        if(!out) return;
        out.innerHTML = o.ok
          ? '<b>' + o.feet.toFixed(1) + ' ft</b> above sea level'
            + (o.res ? ' <span style="color:var(--muted)">· ' + o.res + ' m DEM</span>' : '')
            + (o.acquired ? ' <span style="color:var(--muted)">· acquired ' + esc(String(o.acquired)) + '</span>' : '')
            + '<div style="font-size:11.5px;color:var(--muted);margin-top:3px">USGS 3DEP ground elevation at this '
            + 'parcel&rsquo;s centroid. It is the <b>ground</b>, not the finished floor, and the difference between '
            + 'them is most of what decides a flood-insurance rating. Against a published base flood elevation it '
            + 'gives freeboard; this app does not compute that for you because the two must be surveyed to the same '
            + 'datum and this coordinate is a centroid.</div>'
          : '<span style="color:var(--muted)">' + esc(o.why) + '</span>';
      });
    });
  }, 60);
  return '<div class="sect"><p class="eyebrow" style="margin:0 0 4px">Elevation</p>'
    + '<button class="btn" id="' + id + '_b" style="font-size:12px">Look up ground elevation</button>'
    + '<div id="' + id + '" style="font-size:12.5px;line-height:1.6"></div></div>';
}

/* ---- the catalogue page -------------------------------------------------- */
function render(){
  var host = $('#srcroot'); if(!host) return;
  var byCat = {};
  CAT.forEach(function(s){ (byCat[s.category || 'other'] = byCat[s.category || 'other'] || []).push(s); });

  var needKey = CAT.filter(function(s){ return s.key_required && s.key_required !== false && s.key_required !== 'none'; });
  var restrictive = CAT.filter(function(s){ return s.licence && !/public domain|no restriction/i.test(String(s.licence)); });

  var h = '<div class="tiles" style="margin-bottom:14px">'
    + tile('Verified and joinable', CAT.length, 'each tested with a real request')
    + tile('Tested and rejected', REJ.length, 'written down so nobody re-tests them')
    + tile('Need a free key', needKey.length, 'obtainable, not yet wired')
    + tile('Restrictive licence', restrictive.length, 'read before shipping a derived field')
    + '</div>';

  h += '<div class="chart"><p class="eyebrow">What joins to a parcel</p>'
    + '<h3 style="margin:2px 0 8px">Fifteen public sources, each tested</h3>'
    + '<div class="tablewrap"><table class="tbl"><thead><tr><th>Source</th><th>Joins by</th>'
    + '<th>Freshness</th><th>Key</th><th>Why it leads</th></tr></thead><tbody>'
    + CAT.map(function(s){
        return '<tr><td><b>' + esc(s.name || '') + '</b>'
          + (s.category ? '<div style="font-size:11px;color:var(--muted)">' + esc(s.category) + '</div>' : '') + '</td>'
          + '<td style="font-size:12px">' + esc(clip(s.join_key, 130)) + '</td>'
          + '<td style="font-size:12px">' + esc(String(s.update_frequency || '—')) + '<div style="font-size:11px;color:var(--muted)">'
          + esc(String(s.latency || '')) + '</div></td>'
          + '<td style="font-size:12px">' + (s.key_required && s.key_required !== false && s.key_required !== 'none'
              ? '<span style="color:var(--warn)">yes</span>' : 'no') + '</td>'
          + '<td style="font-size:12px;min-width:230px">' + esc(clip(s.predictive_rationale, 340)) + '</td></tr>';
      }).join('')
    + '</tbody></table></div></div>';

  if(REJ.length){
    h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">Tested and rejected</p>'
      + '<h3 style="margin:2px 0 8px">The half of a data audit that usually goes unwritten</h3>'
      + '<p style="font-size:13px;color:var(--ink2);max-width:84ch;margin:0 0 10px">Each of these sounded useful '
      + 'and does not work. They are recorded so the next person does not spend a day rediscovering it. The most '
      + 'instructive is the sea-level-rise layer: it returned a hit at <b>every</b> level from 0 to 10 feet, '
      + 'identically, for three different coastal cities — because the polygon is the study-area extent, not '
      + 'inundation. A tool that trusted it would have reported flood exposure everywhere and been confidently wrong.</p>'
      + '<div class="tablewrap"><table class="tbl"><thead><tr><th>Source</th><th>Why it was rejected</th></tr></thead><tbody>'
      + REJ.map(function(r){
          return '<tr><td><b>' + esc(r.name || r.source || '') + '</b></td>'
            + '<td style="font-size:12.5px">' + esc(clip(r.reason || r.note, 520)) + '</td></tr>';
        }).join('')
      + '</tbody></table></div></div>';
  }

  h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">Two decisions taken deliberately</p>'
    + '<div style="font-size:13.5px;color:var(--ink2);line-height:1.8;max-width:84ch">'
    + '<p style="margin:0 0 8px"><b>No demographic source is in this list, and that is a choice.</b> Race, '
    + 'ethnicity, national origin, income, household composition, school ratings and crime statistics are the '
    + 'classic proxies for protected class in a property-targeting tool, and this platform holds none of them. '
    + 'Income-defined geographies were excluded on the same reasoning even where they were freely fetchable from '
    + 'a source already used here.</p>'
    + (FLAG.length ? '<p style="margin:0 0 6px"><b>Three things are flagged rather than decided</b>, because they sit '
        + 'close enough to that line that an organisation should decide deliberately rather than inherit the decision '
        + 'from this app:</p><ul style="margin:0 0 10px;padding-left:18px">'
        + FLAG.map(function(f){
            return '<li style="margin-bottom:6px"><b>' + esc(String(f.item || f.name || '')) + '</b> — '
              + esc(String(f.issue || '')) + (f.decision_needed ? ' <i>' + esc(String(f.decision_needed)) + '</i>' : '') + '</li>'; }).join('')
        + '</ul>' : '')
    + '<p style="margin:0"><b>One licence needs a legal read before anything derived from it ships.</b> The '
    + 'OpenStreetMap-derived amenity source is ODbL, which is share-alike: redistributing a derived database '
    + 'obliges attribution and ODbL licensing of the derivative. Everything else in the list is US federal '
    + 'public domain.</p></div></div>';

  host.innerHTML = h;
  if(window.LXPanels) setTimeout(function(){ LXPanels.scan('sources'); }, 140);
}
/* truncate on a word boundary and say so - a sentence cut mid-word reads as a
   rendering bug and costs the reader the point the sentence was making */
function clip(v, n){
  var t = String(v || '');
  if(t.length <= n) return t;
  var cut = t.slice(0, n), sp = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[,;:.\s]+$/, '') + '\u2026';
}
function tile(k, v, note){
  return '<div class="tile"><p class="eyebrow" style="margin:0">' + esc(k) + '</p>'
    + '<p class="big num" style="margin:4px 0 2px">' + v + '</p>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:0">' + esc(note) + '</p></div>';
}

window.LXSources = {render: render, elevation: elevation, drawer: drawer, CAT: CAT, REJ: REJ};
})();
