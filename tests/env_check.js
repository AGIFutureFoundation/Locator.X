/* Environment-layer eval: load the real hive, lesson-chip and scene-card modules under
   the same stub window the Trade School eval uses, and assert the honesty rules
   docs/ENVIRONMENTS.md states — a drawn view says it is massing or derived, no avatar
   scene shows a face, no persona speaks the vocabulary of a pitch, the scene card
   carries the no-real-place boundary, and none of these modules can reach a network.
   No parsing, no assumptions — what is asserted is what the shipped module exports.

   Run: node tests/env_check.js      (tests/run.py 12e runs it too)
   Exits 1 with the list of problems; prints one summary line on success. */
global.window = {};
global.document = { addEventListener: function(){}, querySelector: function(){ return null; },
                    querySelectorAll: function(){ return []; }, getElementById: function(){ return null; } };
var store = {};
global.localStorage = { getItem: function(k){ return k in store ? store[k] : null; },
                        setItem: function(k, v){ store[k] = String(v); }, removeItem: function(k){ delete store[k]; } };
global.getComputedStyle = function(){ return { display: 'none' }; };
global.navigator = { language: 'en-US', userAgent: 'node' };
global.setTimeout = function(){ return 0; };
global.setInterval = function(){ return 0; };

var fs = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');
var R = path.join(ROOT, 'src') + path.sep;
var problems = [];

function must(cond, msg){ if(!cond) problems.push(msg); }
function str(x){ return typeof x === 'string' ? x : ''; }

['voice.js', 'personas.js', 'lessonmap.js', 'scenes_data.js', 'scenecards.js'].forEach(function(f){
  try{ require(R + f); }
  catch(e){ problems.push(f + ': failed to load — ' + (e && e.message)); }
});

/* ---- the lesson chips: a drawn view says what it is ----------------------- */
var LM = window.LXLessonMap;
var chips = (LM && Array.isArray(LM.CHIPS)) ? LM.CHIPS : [];
must(LM && Array.isArray(LM.CHIPS), 'window.LXLessonMap.CHIPS is missing');
var drawn = 0;
chips.forEach(function(c, i){
  var tag = 'chip #' + i + (c && c.label ? ' (' + c.label + ')' : '');
  must(c && typeof c.label === 'string' && c.label, tag + ': missing label');
  must(c && typeof c.title === 'string' && c.title, tag + ': missing title');
  must(c && typeof c.can === 'function' && typeof c.go === 'function', tag + ': missing can()/go()');
  if(!c) return;
  /* a chip opens a drawn view when its gate or its action names the twin, the AR
     block or the room program — read from the function source, not guessed */
  var src = str(c.can && c.can.toString()) + ' ' + str(c.go && c.go.toString());
  if(/LXTwin|LXAR|LXRooms/.test(src)){
    drawn++;
    must(/massing|derived/i.test(str(c.label) + ' ' + str(c.title)),
         tag + ': opens a 3D/AR/room view but neither label nor title says "massing" or "derived"');
  }
});
must(drawn > 0, 'no chip opens a drawn view — the massing/derived rule checked nothing');

/* ---- the scene library: shipped count equals the source, no face in any avatar ---- */
var SC = window.LX_SCENES;
var scenes = (SC && Array.isArray(SC.scenes)) ? SC.scenes : [];
must(SC && Array.isArray(SC.scenes), 'window.LX_SCENES.scenes is missing');
var jsonCount = -1;
try{
  var lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'academy_scenes.json'), 'utf8'));
  jsonCount = Array.isArray(lib.scenes) ? lib.scenes.length : -1;
}catch(e){ problems.push('content/academy_scenes.json: could not read — ' + (e && e.message)); }
must(jsonCount >= 1, 'content/academy_scenes.json holds no scenes');
must(scenes.length === jsonCount,
     'src/scenes_data.js ships ' + scenes.length + ' scenes but content/academy_scenes.json holds ' + jsonCount);
var avatars = 0;
scenes.forEach(function(s){
  if(!s || s.kind !== 'avatar') return;
  avatars++;
  ['initial', 'evolution'].forEach(function(k){
    var t = str(s[k]);
    must(/no face is shown|seen from behind/.test(t),
         'scene ' + s.id + ': ' + k + ' neither says "no face is shown" nor "seen from behind"');
  });
});
must(avatars > 0, 'no avatar scene in the library — the no-face rule checked nothing');

/* ---- the hive: a boundary per persona, no pitch in the opening line ------- */
var BANNED = ['good deal', 'you should', 'motivated'];
var P = window.LXPersonas;
var personas = (P && typeof P.list === 'function') ? P.list() : [];
must(P && typeof P.list === 'function', 'window.LXPersonas.list is missing');
must(personas.length > 0, 'no personas loaded');
personas.forEach(function(p, i){
  var tag = 'persona #' + i + (p && p.id ? ' (' + p.id + ')' : '');
  must(Array.isArray(p.never_says) && p.never_says.length > 0, tag + ': never_says is empty');
  var line = str(p.opening_line).toLowerCase();
  must(line.length > 0, tag + ': opening_line is empty');
  BANNED.forEach(function(b){
    must(line.indexOf(b) < 0, tag + ': opening_line contains the banned phrase "' + b + '"');
  });
});

/* ---- the scene card: the boundary sentence is on every card -------------- */
var S = window.LXSceneCards;
must(S && typeof S.note === 'function', 'window.LXSceneCards.note is missing');
if(S && typeof S.note === 'function'){
  var note = '';
  try{ note = str(S.note()); }catch(e){ problems.push('LXSceneCards.note() threw — ' + (e && e.message)); }
  must(/real place/.test(note), 'LXSceneCards.note() does not say "real place": ' + JSON.stringify(note));
}

/* ---- source level: none of these modules can reach a network ------------- */
var NET = [['fetch(', /\bfetch\(/], ['XMLHttpRequest', /XMLHttpRequest/], ['WebSocket', /WebSocket/]];
['personas.js', 'lessonmap.js', 'scenecards.js'].forEach(function(f){
  var text = '';
  try{ text = fs.readFileSync(R + f, 'utf8'); }catch(e){ problems.push(f + ': could not read source'); return; }
  NET.forEach(function(n){
    must(!n[1].test(text), f + ': source contains ' + n[0] + ' — the environment layer makes no network calls');
  });
});

if(problems.length){
  console.log('environment: ' + problems.length + ' problem(s)');
  problems.forEach(function(p){ console.log('  ✗ ' + p); });
  process.exit(1);
}
console.log('environment: ' + chips.length + ' chips · ' + scenes.length + ' scenes · ' + personas.length + ' personas · no network ✓');
