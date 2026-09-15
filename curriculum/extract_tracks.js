/* Collect every Academy track actually shipped, by loading the real modules.
   No parsing, no assumptions — if a track registers here it exists in the app. */
global.window = { LXTC: null };
global.document = { addEventListener: function(){}, querySelector: function(){ return null; },
                    querySelectorAll: function(){ return []; }, getElementById: function(){ return null; } };
global.localStorage = { getItem: function(){ return null; }, setItem: function(){} };
global.setTimeout = function(){ return 0; };
global.setInterval = function(){ return 0; };

var path = require('path');
var R = path.join(__dirname, '..', 'src') + path.sep;
require(R + 'tradecraft.js');                       // defines window.LXTC.TRACKS (11 base tracks)
['gradschool','mindset','devcourse','pmcourse','datacourse','eqcourse','labcourse','widercourse',
 'nondisccourse']
  .forEach(function(m){ require(R + m + '.js'); });

var T = (window.LXTC && window.LXTC.TRACKS) || [];
// the appenders mount on DOMContentLoaded/setTimeout, both stubbed — register directly
['LXGrad','LXMindset','LXInvDev','LXDeliver','LXEvidenceCourse','LXEquity','LXLab','LXWider',
 'LXNonDisc']
  .forEach(function(g){ if(window[g] && window[g].register) window[g].register(); });
T = (window.LXTC && window.LXTC.TRACKS) || [];

var out = {}, ids = {};
T.forEach(function(t){
  out[t.id] = {slot: t.slot, name: t.name, lessons: t.modules.length};
  ids[t.id] = t.modules.map(function(m){ return m.id; });
});

/* The developer route names lessons by (track, id). Those references live in a
   separate file from the lessons themselves, so nothing but a check keeps them
   honest — a renamed or removed lesson would leave a dead chip in the route and
   the app would not complain. Emit them so validate.py can. */
var routes = [];
try{
  require(R + 'routes.js');
  (window.LXRoute ? window.LXRoute.GATES : []).forEach(function(g){
    g.lessons.forEach(function(l){ routes.push({gate:g.n, track:l.t, lesson:l.id}); });
    routes.push({gate:g.n, track:g.who.track, lesson:g.who.lesson});
  });
}catch(e){ routes = null; }

/* Instructor notes anchor to a lesson, a LOCATOR gate or a route stage by id.
   Those anchors are supplied copy in a file of their own, so nothing but a
   check keeps them pointing at things that exist. Emit them too. */
var notes = [];
try{
  require(R + 'notes.js');
  notes = (window.LXNotes ? window.LXNotes.NOTES : []).map(function(n){
    return {on:n.on, id:n.id, hasBody: !!(n && n.body)};
  });
}catch(e){ notes = null; }

var stages = [];
try{ stages = (window.LXRoute ? window.LXRoute.GATES : []).map(function(g){ return g.k; }); }catch(e){}

console.log(JSON.stringify({tracks: out, lessonIds: ids, routes: routes, notes: notes, stages: stages}, null, 1));
