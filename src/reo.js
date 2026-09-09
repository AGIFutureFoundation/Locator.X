/* locator.x - government-owned resale, and the honest limits around it.
   ----------------------------------------------------------------------------
   This tab exists because "find me foreclosures" is the most common request a
   real-estate tool gets and the most commonly answered dishonestly. Here is what
   was actually found when the question was researched properly in September 2026.

   WHAT IS HERE. HUD's own eGIS service publishes every FHA single-family home
   HUD has taken back after an insured mortgage foreclosed and is now offering
   for sale - 5,513 of them nationally, with coordinates, and with NO borrower,
   owner or occupant data of any kind, by the publisher's design. That is a real
   bank-owned resale feed from the entity that owns the homes.

   WHAT IS NOT HERE, AND WHY. Pre-foreclosure - Notice of Default, Lis Pendens,
   Trustee's Sale - DOES NOT EXIST as free open data. Socrata's cross-portal
   catalogue returns zero results for "lis pendens"; San Francisco's open-data
   portal returns zero for "foreclosure"; the recorders in Maricopa, Franklin and
   the Bay Area counties publish per-document search screens, not bulk data. The
   commercial services that do sell it - RealtyTrac, Auction.com and the listing
   portals - prohibit automated access in their terms, and this platform does not
   break terms of service to get data. So the honest answer is that the single
   most-wanted layer in this category is a paid, contractual capability, and no
   amount of engineering here substitutes for it.

   THREE DIFFERENT THINGS, NEVER CONFLATED. Government REO is a completed
   foreclosure now for sale. TAX distress is a parcel behind on property taxes -
   legally unrelated to a mortgage, and a tax-defaulted parcel is not a home in
   foreclosure. Aggregate delinquency is a county-level statistic about loans,
   not a list of addresses. Tools that blend these three into one "distress"
   badge are describing something that does not exist. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }

var D = function(){ return window.LXREO || null; };
function rows(){ var d = D(); return d ? d.rows : []; }

/* index REO by ZIP once, so a property lookup is O(1) */
var BYZIP = null;
function byZip(){
  if(BYZIP) return BYZIP;
  BYZIP = {};
  rows().forEach(function(r){ var z = r[4]; if(!z) return; (BYZIP[z] = BYZIP[z] || []).push(r); });
  return BYZIP;
}

/* the drawer block: how much government-owned resale sits in this ZIP */
function drawer(l){
  var d = D(); if(!d || !l || !l.zip) return '';
  var here = byZip()[l.zip] || [];
  if(!here.length) return '';
  var near = [];
  if(l.lat != null && window.LXCorp){
    here.forEach(function(r){
      if(r[6] == null) return;
      var km = LXCorp.dist(l.lat, l.lng, r[6], r[7]);
      near.push({r:r, km:km});
    });
    near.sort(function(a,b){ return a.km - b.km; });
  }
  return '<div class="sect"><p class="eyebrow" style="margin:0 0 4px">HUD-owned resale in this ZIP</p>'
    + '<div style="font-size:12.5px;line-height:1.65"><b>' + here.length + '</b> HUD-owned home'
    + (here.length === 1 ? '' : 's') + ' currently offered for sale in ZIP ' + esc(l.zip)
    + (near.length && near[0].km < 50 ? ', nearest <b>' + near[0].km.toFixed(1) + ' km</b> away' : '') + '.'
    + '</div>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:5px 0 0">These are homes HUD took back after an '
    + 'FHA-insured mortgage foreclosed and is now selling. A cluster of them says something about the '
    + 'neighbourhood&rsquo;s recent credit experience; it is <b>not</b> a list of homes currently in foreclosure, '
    + 'and this app has no such list because none is published free. Case numbers and addresses only &mdash; no '
    + 'borrower or occupant data exists in this layer.</p></div>';
}

function render(){
  var host = $('#reoroot'); if(!host) return;
  var X = L(), d = D();
  if(!d){ host.innerHTML = '<div class="chart"><p style="font-size:13.5px;color:var(--ink2);margin:0">'
    + 'No government-resale layer is carried in this build.</p></div>'; return; }

  /* how much of it lands in the ZIPs this edition actually holds */
  var mine = {}, all;
  try{ all = X.allListings(); }catch(e){ all = []; }
  for(var i = 0; i < all.length; i++) if(all[i].zip) mine[all[i].zip] = 1;
  var inEdition = rows().filter(function(r){ return r[4] && mine[r[4]]; });
  var byState = {}; rows().forEach(function(r){ byState[r[3]] = (byState[r[3]] || 0) + 1; });
  var st = Object.keys(byState).map(function(k){ return [k, byState[k]]; })
            .sort(function(a,b){ return b[1] - a[1]; });
  var byStep = {}; rows().forEach(function(r){ byStep[r[5]] = (byStep[r[5]] || 0) + 1; });

  var h = '<div class="tiles" style="margin-bottom:14px">'
    + tile('HUD-owned, nationally', X.fmtN(d.n), 'FHA single-family REO offered for sale')
    + tile('In this edition’s ZIPs', X.fmtN(inEdition.length), 'joinable to stock you can actually see here')
    + tile('States covered', String(st.length), 'the layer is national')
    + tile('Personal records', '0', 'case number and address only, by the publisher’s design')
    + '</div>';

  h += '<div class="chart" style="border-left:4px solid var(--warn)"><p class="eyebrow">Read this before using this tab</p>'
    + '<h3 style="margin:2px 0 8px">Pre-foreclosure is not available as free data. Anywhere.</h3>'
    + '<div style="font-size:13.5px;color:var(--ink2);line-height:1.8;max-width:88ch">'
    + '<p style="margin:0 0 8px">The layer below is <b>completed</b> foreclosures that HUD now owns and is selling. '
    + 'It is not a list of homes about to be foreclosed, and this platform does not have one. That was researched '
    + 'properly rather than assumed: Socrata&rsquo;s cross-portal catalogue returns <b>zero</b> datasets for '
    + '&ldquo;lis pendens&rdquo;, San Francisco&rsquo;s open-data portal returns <b>zero</b> for &ldquo;foreclosure&rdquo;, '
    + 'and the recorders in Maricopa, Franklin and the Bay Area counties publish per-document search screens rather '
    + 'than bulk data. Notice of Default, Lis Pendens and Trustee&rsquo;s Sale are a paid, contractual capability.</p>'
    + '<p style="margin:0 0 8px"><b>The commercial listing portals were not scraped and will not be.</b> Zillow, '
    + 'Redfin, Realtor.com, RealtyTrac and Auction.com all prohibit automated access in their terms. A tool that '
    + 'breaks those terms to fill a tab is a liability wearing a feature&rsquo;s clothes, and the data it returns '
    + 'cannot be cited to anyone.</p>'
    + '<p style="margin:0"><b>Three different things, never blended.</b> Government REO is a finished foreclosure '
    + 'for sale. <b>Tax</b> distress is a parcel behind on property taxes &mdash; legally unrelated to any mortgage, '
    + 'and a tax-defaulted parcel is not a home in foreclosure. Aggregate delinquency is a county statistic about '
    + 'loans, not a list of addresses. Any product that merges these into one &ldquo;distress&rdquo; score is '
    + 'describing something that does not exist.</p></div></div>';

  h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">Where it is</p>'
    + '<h3 style="margin:2px 0 8px">HUD-owned homes for sale, by state</h3>'
    + '<div class="tablewrap"><table class="tbl"><thead><tr><th>State</th><th class="r">Homes</th><th>Share</th></tr></thead><tbody>'
    + st.slice(0, 18).map(function(p){
        return '<tr><td><b>' + esc(p[0]) + '</b></td><td class="r">' + X.fmtN(p[1]) + '</td>'
          + '<td><div style="height:9px;border-radius:3px;background:var(--panel2);min-width:130px">'
          + '<i style="display:block;height:9px;border-radius:3px;width:' + (p[1]/st[0][1]*100).toFixed(1)
          + '%;background:var(--warn)"></i></div></td></tr>'; }).join('')
    + '</tbody></table></div>'
    + '<p class="src">Source: ' + esc(d.source) + '. Sale step 1&ndash;6 is HUD&rsquo;s own marketing stage, not a '
    + 'measure of condition. ' + esc(d.note) + '</p></div>';

  if(inEdition.length){
    h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">In this edition</p>'
      + '<h3 style="margin:2px 0 8px">' + X.fmtN(inEdition.length) + ' of them sit in ZIPs this package holds</h3>'
      + '<div class="tablewrap"><table class="tbl"><thead><tr><th>Case</th><th>Address</th><th>City</th>'
      + '<th>ZIP</th><th class="r">Sale step</th></tr></thead><tbody>'
      + inEdition.slice(0, 60).map(function(r){
          return '<tr><td style="font-family:var(--mono);font-size:11.5px">' + esc(r[0]) + '</td>'
            + '<td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + ', ' + esc(r[3]) + '</td>'
            + '<td>' + esc(r[4] || '') + '</td><td class="r">' + (r[5] == null ? '—' : r[5]) + '</td></tr>'; }).join('')
      + '</tbody></table></div>'
      + (inEdition.length > 60 ? '<p class="src">Showing the first 60 of ' + X.fmtN(inEdition.length) + '.</p>' : '')
      + '</div>';
  }
  host.innerHTML = h;
  if(window.LXPanels) setTimeout(function(){ LXPanels.scan('reo'); }, 140);
}
function tile(k, v, note){
  return '<div class="tile"><p class="eyebrow" style="margin:0">' + esc(k) + '</p>'
    + '<p class="big num" style="margin:4px 0 2px">' + v + '</p>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:0">' + esc(note) + '</p></div>';
}
window.LXReo = {render: render, drawer: drawer, byZip: byZip};
})();
