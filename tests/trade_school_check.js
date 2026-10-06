/* Trade School eval: load the real modules and the generated trade taxonomy, and
   assert the shape every track, module, drill and trade must have.
   No parsing, no assumptions — if a track registers here it exists in the app.

   Run: node tests/trade_school_check.js      (tests/run.py runs it too)
   Exits 1 with the list of problems; prints one line per track on success. */
global.window = { LXTS: null };
global.document = { addEventListener: function(){}, querySelector: function(){ return null; },
                    querySelectorAll: function(){ return []; }, getElementById: function(){ return null; } };
global.localStorage = { getItem: function(){ return null; }, setItem: function(){} };
global.setTimeout = function(){ return 0; };
global.setInterval = function(){ return 0; };

var fs = require('fs');
var path = require('path');
var R = path.join(__dirname, '..', 'src') + path.sep;
var problems = [];

function must(cond, msg){ if(!cond) problems.push(msg); }

/* Drill gates from the 2026-10 review of the any-state tracks.
   (a) The correct option may not be longer than the longest distractor by more than
       MARGIN_MAX characters — the reviewer found the right answer was the longest option in
       27 of 30 deep-track drills. Applies to ALL tracks: first scoped to the deep tracks
       (ts_*.js) because the base California tracks in tradeschool.js failed it in 21 of 30
       drills (measured 2026-10-06; margins 22–106, e.g. principles/w2 +106, playbooks/p8 +85,
       playbooks/p2 +83); those 21 were rewritten the same day (re-measured: every base drill
       now within −2…+20) and the scope widened. MARGIN_EXEMPT names a track that is measured
       as failing and not yet reviewed; the gate checks the exemption is still earned and fails
       if it has gone stale.
   (b) No drill q, option or why in a deep track contains the word "should" — drills ask
       questions, they do not prescribe. Bodies are out of scope because ts_license.js l6
       quotes the pattern descriptively ("advertising language that describes who should
       live somewhere"). */
var MARGIN_MAX = 20;
var MARGIN_EXEMPT = {};
var drillChecked = 0, exemptSeen = {};

require(R + 'tradeschool.js');                       // defines window.LXTS.TRACKS
var baseIds = {};
((window.LXTS && window.LXTS.TRACKS) || []).forEach(function(t){ baseIds[t.id] = true; });

require(R + 'trades_data.js');                       // defines window.LX_TRADES (generated)

/* Deep tracks ship as src/ts_*.js. Some may not exist yet — skip missing,
   never fail on absence; fail only on what IS there and is wrong. */
var tsFiles = fs.readdirSync(R).filter(function(f){ return /^ts_.*\.js$/.test(f); }).sort();
tsFiles.forEach(function(f){
  try{ require(R + f); }
  catch(e){ problems.push(f + ': failed to load — ' + (e && e.message)); }
});
/* appenders mount on DOMContentLoaded/setTimeout, both stubbed — register directly */
Object.keys(window).forEach(function(g){
  var o = window[g];
  if(g !== 'LXTS' && o && typeof o.register === 'function' && /^LXTS/.test(g)){
    try{ o.register(); }catch(e){ problems.push(g + '.register() threw — ' + (e && e.message)); }
  }
});

var T = (window.LXTS && window.LXTS.TRACKS) || [];
must(T.length > 0, 'no tracks registered on window.LXTS.TRACKS');

var seenTrack = {}, moduleTotal = 0, lines = [];
T.forEach(function(t, ti){
  var tag = 'track #' + ti + (t && t.id ? ' (' + t.id + ')' : '');
  ['id','name','who','c','blurb'].forEach(function(k){
    must(t && typeof t[k] === 'string' && t[k].length > 0, tag + ': missing ' + k);
  });
  if(!t || !t.id) return;
  must(!seenTrack[t.id], tag + ': duplicate track id');
  seenTrack[t.id] = true;
  var mods = Array.isArray(t.modules) ? t.modules : [];
  must(mods.length >= 2, tag + ': fewer than 2 modules (' + mods.length + ')');
  var deep = !baseIds[t.id];                         // registered by a ts_*.js file
  var seenMod = {};
  mods.forEach(function(m, mi){
    var mt = tag + ' module #' + mi + (m && m.id ? ' (' + m.id + ')' : '');
    must(m && typeof m.id === 'string' && m.id, mt + ': missing id');
    if(m && m.id){ must(!seenMod[m.id], mt + ': duplicate module id within track'); seenMod[m.id] = true; }
    must(m && typeof m.t === 'string' && m.t, mt + ': missing t');
    var body = m && m.body;
    must(typeof body === 'string' && body.length >= 400,
         mt + ': body is not a string of at least 400 chars (' + (typeof body === 'string' ? body.length : typeof body) + ')');
    var d = m && m.drill;
    must(d && typeof d === 'object', mt + ': missing drill');
    if(d){
      must(typeof d.q === 'string' && d.q, mt + ': drill missing q');
      must(Array.isArray(d.opts) && d.opts.length === 4, mt + ': drill needs exactly 4 opts');
      must(Number.isInteger(d.a) && d.a >= 0 && d.a <= 3, mt + ': drill.a must be an integer 0..3');
      must(typeof d.why === 'string' && d.why.length >= 40, mt + ': drill.why shorter than 40 chars');
    }
    if(deep && typeof body === 'string'){
      must(/class="src"/.test(body), mt + ': deep-track module has no class="src" source paragraph');
      must(!/you should/i.test(body), mt + ': body says "you should" — the no-advice rule');
    }
    if(d && Array.isArray(d.opts) && d.opts.length === 4 && Number.isInteger(d.a) && d.a >= 0 && d.a <= 3){
      drillChecked++;
      var str = function(x){ return typeof x === 'string' ? x : ''; };
      /* (b) no "should" anywhere in the drill — deep tracks only */
      if(deep) [str(d.q)].concat(d.opts.map(str), [str(d.why)]).forEach(function(s, k){
        var where = k === 0 ? 'q' : k === 5 ? 'why' : 'opt ' + (k - 1);
        must(!/\bshould\b/i.test(s), mt + ': drill ' + where + ' says "should" — drills ask, they do not prescribe');
      });
      /* (a) correct option not longer than the longest distractor by more than MARGIN_MAX — all tracks */
      var correctLen = str(d.opts[d.a]).length;
      var longestOther = Math.max.apply(null, d.opts.filter(function(_, i){ return i !== d.a; }).map(function(o){ return str(o).length; }));
      var margin = correctLen - longestOther;
      if(MARGIN_EXEMPT[t.id]){
        exemptSeen[t.id] = exemptSeen[t.id] || { drills: 0, failing: 0 };
        exemptSeen[t.id].drills++; if(margin > MARGIN_MAX) exemptSeen[t.id].failing++;
      } else {
        must(margin <= MARGIN_MAX, mt + ': correct drill option is ' + margin + ' chars longer than the longest distractor (limit ' + MARGIN_MAX + ')');
      }
    }
  });
  moduleTotal += mods.length;
  lines.push('track ' + t.id + ' · ' + mods.length + ' modules');
});
/* an exemption is a measured gap, not a permanent pass: when the track comes right, remove it */
Object.keys(MARGIN_EXEMPT).forEach(function(id){
  if(!exemptSeen[id]) return;                          // track not shipped in this tree — nothing to check
  must(exemptSeen[id].failing > 0, 'MARGIN_EXEMPT.' + id + ' is stale — every drill now passes the margin rule; remove the exemption');
});
var exemptNote = Object.keys(exemptSeen).length ? '; exempt: ' + Object.keys(exemptSeen).join(', ') : '';

/* the generated taxonomy */
var X = window.LX_TRADES;
var tradeTotal = 0;
must(X && Array.isArray(X.divisions), 'window.LX_TRADES.divisions is missing');
if(X && Array.isArray(X.divisions)){
  must(X.divisions.length >= 10, 'LX_TRADES has fewer than 10 divisions (' + X.divisions.length + ')');
  var seenTrade = {};
  X.divisions.forEach(function(dv){
    (dv.trades || []).forEach(function(tr){
      tradeTotal++;
      must(tr && typeof tr.id === 'string' && tr.id, 'division ' + dv.code + ': trade without id');
      if(tr && tr.id){ must(!seenTrade[tr.id], 'duplicate trade id ' + tr.id); seenTrade[tr.id] = true; }
    });
  });
  must(tradeTotal >= 30, 'LX_TRADES has fewer than 30 trades (' + tradeTotal + ')');
}

if(problems.length){
  console.log('trade school: ' + problems.length + ' problem(s)');
  problems.forEach(function(p){ console.log('  ✗ ' + p); });
  process.exit(1);
}
lines.forEach(function(l){ console.log(l); });
if(drillChecked) console.log('drill checks: longest-option margin ≤ ' + MARGIN_MAX + ' (all tracks' + exemptNote + ') · no "should" in deep-track drills ✓');
console.log('trade school: ' + T.length + ' tracks · ' + moduleTotal + ' modules · ' + tradeTotal + ' trades ✓');
