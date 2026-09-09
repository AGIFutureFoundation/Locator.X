/* locator.x - one property across time.
   ----------------------------------------------------------------------------
   The same replay that moves the whole app, narrowed to a single parcel. For each
   month in the published index this walks window.__lxAsOf forward and RE-DERIVES
   that property from that month's figures - its value, its rent, its cash flow
   after the mortgage, its cap rate and its Locator X score. Nothing is smoothed,
   interpolated or projected; every point is what this app would have said had you
   opened it that month with the same assumptions.

   That distinction matters and the panel says it out loud: this is the history of
   an index applied to one parcel, not the history of that parcel. Two identical
   buildings in the same ZIP produce identical curves here, because the only thing
   moving is the ZIP series. It shows how exposed a property is to its market, and
   it is not evidence about the building. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function N(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; }

var SERIES = [
  {id:'val',   name:'Typical value in this ZIP',      unit:'$',    slot:'asset',
   get:function(d, a){ return d && d.mk ? (d.mk.zhvi || d.mk.v || null) : null; }},
  {id:'rent',  name:'Typical rent in this ZIP',       unit:'$/mo', slot:'hack',
   get:function(d, a){ return d && d.mk ? (d.mk.zori || d.mk.r || null) : null; }},
  {id:'cf',    name:'Cash flow after the mortgage',   unit:'$/mo', slot:'value',
   get:function(d, a){ return d ? N(d.cfMo) : null; }},
  {id:'cap',   name:'Cap rate',                       unit:'%',    slot:'growth',
   get:function(d, a){ return d && isFinite(d.cap) ? d.cap * 100 : null; }},
  {id:'score', name:'Locator X score',                unit:'',     slot:'liab',
   get:function(d, a){ return a ? N(a.score) : null; }}
];

var CACHE = {};
function history(l, wantScore){
  var key = l.id + '|' + (wantScore ? 's' : '') + '|' + JSON.stringify(L().state.assump);
  if(CACHE[key]) return CACHE[key];
  var months = [];
  try{ months = L().M.months || []; }catch(e){}
  if(!months.length) return null;
  var prev = window.__lxAsOf;
  var rows = [];
  for(var t = 0; t < months.length; t++){
    window.__lxAsOf = t;
    var d = null, a = null;
    try{ d = L().deal(l); }catch(e){}
    if(wantScore){ try{ a = window.LXDash && LXDash.analyze(l); }catch(e){} }
    var pt = {m:months[t]};
    SERIES.forEach(function(s){ pt[s.id] = s.get(d, a); });
    rows.push(pt);
  }
  if(prev == null) delete window.__lxAsOf; else window.__lxAsOf = prev;
  var out = {months:months, rows:rows};
  CACHE[key] = out;
  return out;
}
function invalidate(){ CACHE = {}; }

/* small multiples: one sparkline per series, sharing the month axis */
function spark(rows, s, w, h){
  var vals = rows.map(function(r){ return r[s.id]; });
  var ok = vals.filter(function(v){ return v != null; });
  if(ok.length < 3) return '<div style="font-size:11.5px;color:var(--muted);padding:6px 0">'
    + esc(s.name) + ' &mdash; not published for this ZIP</div>';
  var lo = Math.min.apply(null, ok), hi = Math.max.apply(null, ok);
  if(hi === lo){ hi = lo + 1; }
  var P = window.LXPal, col = P.cat(s.slot);
  var pad = 3, iw = w - 8, ih = h - 2 * pad;
  var X = function(i){ return 4 + i / Math.max(1, vals.length - 1) * iw; };
  var Y = function(v){ return pad + (1 - (v - lo) / (hi - lo)) * ih; };
  var dd = '', started = false;
  vals.forEach(function(v, i){
    if(v == null){ started = false; return; }
    dd += (started ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1) + ' ';
    started = true;
  });
  var first = ok[0], last = ok[ok.length - 1];
  var chg = first ? (last - first) / Math.abs(first) * 100 : null;
  var zero = (lo < 0 && hi > 0) ? '<line x1="4" y1="' + Y(0).toFixed(1) + '" x2="' + (4 + iw) + '" y2="'
    + Y(0).toFixed(1) + '" stroke="var(--line)" stroke-width="1" stroke-dasharray="2,2"/>' : '';
  var fmt = function(v){
    if(s.unit === '$') return L().fmt$(Math.round(v));
    if(s.unit === '$/mo') return L().fmt$(Math.round(v)) + '/mo';
    if(s.unit === '%') return v.toFixed(2) + '%';
    return Math.round(v);
  };
  return '<div style="display:flex;align-items:center;gap:9px;padding:3px 0">'
    + '<div style="flex:none;width:132px;font-size:11.5px;color:var(--ink2);line-height:1.3">'
      + P.swatch(col, 'circle', 10) + esc(s.name) + '</div>'
    + '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:' + w + 'px;height:' + h + 'px;flex:none" role="img" aria-label="'
      + esc(s.name + ' from ' + rows[0].m + ' to ' + rows[rows.length - 1].m) + '">'
      + zero + '<path d="' + dd + '" fill="none" stroke="' + col + '" stroke-width="1.8" stroke-linejoin="round"/>'
      + '<circle cx="' + X(vals.length - 1).toFixed(1) + '" cy="' + Y(last).toFixed(1) + '" r="2.6" fill="' + col + '"/>'
    + '</svg>'
    + '<div style="flex:1;min-width:0;font-size:11.5px;line-height:1.35">'
      + '<b>' + fmt(last) + '</b>'
      + (chg != null ? ' <span style="color:' + (chg >= 0 ? 'var(--good)' : 'var(--bad)') + '">'
          + (chg >= 0 ? '+' : '') + chg.toFixed(1) + '%</span>' : '')
      + '<div style="color:var(--muted);font-size:10.5px">' + esc(String(rows[0].m).slice(0, 7))
      + ' to ' + esc(String(rows[rows.length - 1].m).slice(0, 7)) + '</div></div></div>';
}

/* the compact block used in the property drawer */
function drawer(l, opt){
  opt = opt || {};
  var H = history(l, !!opt.score);
  if(!H) return '';
  var rows = H.rows;
  var w = opt.w || 150, h = opt.h || 26;
  var body = SERIES.map(function(s){
    if(!opt.score && s.id === 'score') return '';
    return spark(rows, s, w, h);
  }).join('');
  var zip = l.zip ? ('ZIP ' + l.zip) : 'this market';
  return '<div class="sect"><p class="eyebrow" style="margin:0 0 4px">This property across time</p>'
    + body
    + '<p style="font-size:11.5px;color:var(--muted);margin:6px 0 0">Every point is this property '
    + '<b>re-derived at that month</b> from the published index for ' + esc(zip)
    + ' at your current assumptions &mdash; nothing is smoothed or projected. '
    + '<b>This is the history of an index applied to one parcel, not the history of the parcel.</b> '
    + 'Two identical buildings in the same ZIP produce the same curves, because the only thing moving is '
    + 'the market series. It shows how exposed this property is to its market; it is not evidence about the building.</p></div>';
}

/* the fuller panel used inside the underwriting sheet, with the derived read */
function sheet(l){
  var H = history(l, true);
  if(!H) return '<p style="font-size:12.5px;color:var(--muted)">This edition carries no published index months, so no history can be derived for this parcel.</p>';
  var rows = H.rows;
  var body = SERIES.map(function(s){ return spark(rows, s, 230, 34); }).join('');

  // the read: what the series actually say, stated plainly
  var notes = [];
  var cf = rows.map(function(r){ return r.cf; }).filter(function(v){ return v != null; });
  if(cf.length > 2){
    var pos = cf.filter(function(v){ return v > 0; }).length;
    notes.push(pos === 0
      ? 'Cash flow after the mortgage was <b>negative in every one of the ' + cf.length + ' months</b> on record at these assumptions. That is the finding, not a gap in the data.'
      : pos === cf.length
        ? 'Cash flow stayed positive across all ' + cf.length + ' months on record at these assumptions.'
        : 'Cash flow was positive in <b>' + pos + ' of ' + cf.length + '</b> months on record — it crosses zero inside the window, so the answer depends on when you ask.');
  }
  var val = rows.map(function(r){ return r.val; }).filter(function(v){ return v != null; });
  var rent = rows.map(function(r){ return r.rent; }).filter(function(v){ return v != null; });
  if(val.length > 2 && rent.length > 2){
    var vg = (val[val.length - 1] - val[0]) / val[0] * 100;
    var rg = (rent[rent.length - 1] - rent[0]) / rent[0] * 100;
    notes.push(Math.abs(vg - rg) < 2
      ? 'Value and rent moved together over the window (' + vg.toFixed(1) + '% against ' + rg.toFixed(1) + '%), so the yield is roughly where it started.'
      : vg > rg
        ? 'Value rose <b>' + vg.toFixed(1) + '%</b> while rent rose <b>' + rg.toFixed(1) + '%</b>. Price ran ahead of income, which compresses the yield — the gap is the part you are being asked to pay for on faith.'
        : 'Rent rose <b>' + rg.toFixed(1) + '%</b> against value at <b>' + vg.toFixed(1) + '%</b>. Income ran ahead of price, which expands the yield.');
  }
  if(!val.length) notes.push('No published value series exists for this ZIP, so the market half of this history is unavailable. The cash-flow line still moves with your assumptions but not with the market.');
  if(val.length > 2 && rent.length < 3) notes.push('<b>No published rent series exists for this ZIP</b>, so the rent this app uses does not move month to month — which is why the cash-flow line is flat while value climbs. That flatness is a gap in the source, not a finding about the property. Any income figure here rests on a rent assumption you should replace with local property-manager comparables before offering.');
  if(rent.length > 2 && val.length < 3) notes.push('A rent series exists for this ZIP but <b>no value series</b>, so the market direction half of this history is unavailable and only the income side moves.');

  return '<div style="margin-top:6px">' + body
    + '<div style="margin-top:8px;font-size:12.5px;color:var(--ink2);line-height:1.7">'
    + notes.map(function(n){ return '<div style="margin-bottom:4px">' + n + '</div>'; }).join('')
    + '</div>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:8px 0 0">Each point is this parcel re-derived at that month '
    + 'from the published index at your current assumptions. <b>It is the history of an index applied to this parcel, '
    + 'not the parcel’s own history</b> — there is no transaction history here beyond the single recorded sale on the '
    + 'record, and any two properties in the same ZIP will trace the same shape. Read it as market exposure, never as '
    + 'evidence about the building.</p></div>';
}

window.LXPropTime = {drawer:drawer, sheet:sheet, history:history, invalidate:invalidate, SERIES:SERIES};
})();
