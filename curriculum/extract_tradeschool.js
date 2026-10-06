/* Collect every Trade School track actually shipped, by loading the real modules.
   No parsing, no assumptions — if a track registers on window.LXTS.TRACKS here it
   exists in the app. Same stub tests/trade_school_check.js loads the modules under;
   this script only reports what registered, and which file registered it.

   Run: node curriculum/extract_tradeschool.js   (curriculum/gen_tradeschool.py runs it)
   Prints one JSON object:
     {tracks:[{id,name,who,blurb,source:'src/<file>.js',modules:[{id,t,hasLive,drillOptions}]}],
      trades:{divisions:n, trades:n, byStatus:{pattern:n,'state-specific':n,federal:n}}} */
global.window = { LXTS: null };
global.document = { addEventListener: function(){}, querySelector: function(){ return null; },
                    querySelectorAll: function(){ return []; }, getElementById: function(){ return null; } };
global.localStorage = { getItem: function(){ return null; }, setItem: function(){} };
global.setTimeout = function(){ return 0; };
global.setInterval = function(){ return 0; };

var fs = require('fs');
var path = require('path');
var R = path.join(__dirname, '..', 'src') + path.sep;

var sourceOf = {};            // track id -> 'src/<file>.js' that registered it
var registered = {};          // LXTS* globals whose register() has been called

function tracks(){ return (window.LXTS && window.LXTS.TRACKS) || []; }

/* Load one module, call any appender it defined (they mount on DOMContentLoaded /
   setTimeout, both stubbed), and attribute every track that is new on TRACKS to it. */
function load(file){
  var before = {};
  tracks().forEach(function(t){ before[t.id] = true; });
  require(R + file);
  Object.keys(window).forEach(function(g){
    var o = window[g];
    if(g !== 'LXTS' && /^LXTS/.test(g) && o && typeof o.register === 'function' && !registered[g]){
      registered[g] = true;
      o.register();
    }
  });
  tracks().forEach(function(t){
    if(!before[t.id] && !sourceOf[t.id]) sourceOf[t.id] = 'src/' + file;
  });
}

load('tradeschool.js');                              // defines window.LXTS.TRACKS (base tracks)
load('trades_data.js');                              // defines window.LX_TRADES (generated)
fs.readdirSync(R).filter(function(f){ return /^ts_.*\.js$/.test(f); }).sort().forEach(load);

var out = tracks().map(function(t){
  return {
    id: t.id, name: t.name, who: t.who, blurb: t.blurb,
    source: sourceOf[t.id] || null,
    modules: (t.modules || []).map(function(m){
      return { id: m.id, t: m.t, hasLive: typeof m.live === 'function',
               drillOptions: (m.drill && Array.isArray(m.drill.opts)) ? m.drill.opts.length : 0 };
    })
  };
});

var X = window.LX_TRADES || {};
var byStatus = {};
var nTrades = 0;
(X.divisions || []).forEach(function(dv){
  (dv.trades || []).forEach(function(tr){
    nTrades++;
    var s = tr.licence_status || 'unknown';
    byStatus[s] = (byStatus[s] || 0) + 1;
  });
});

console.log(JSON.stringify({
  tracks: out,
  trades: { divisions: (X.divisions || []).length, trades: nTrades, byStatus: byStatus }
}, null, 1));
