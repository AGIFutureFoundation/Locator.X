/* locator.x — scene cards: the Academy title-sequence library, shown in the app.

   content/academy_scenes.json holds the prompt paragraphs behind the Academy's
   generative title sequences — one continuous take per scene, written to the
   model's own steering rules and checked by scripts/build_scenes.py against
   the repository's place vocabulary so that no scene names a real place. This
   file shows those PROMPTS as text cards next to the material they back:

     - a Trade School track page gets the exterior/interior scenes whose `for`
       is that track id, under "Scenes behind this track";
     - a persona card in the hive gets the avatar scene(s) whose `for` is that
       persona id.

   TEXT ONLY. Nothing here is an image or a video. Renders, when they exist,
   are stored outside git (the data tree, like every other large artefact) and
   this module does not reference, embed or fetch one. What a card prints is
   the prompt, its kind, what it is for, and the boundary sentence: no real
   place, building, person or property is depicted, and nothing attaches to a
   parcel record. The sentence comes from the library's own `the_line`.

   DATA. window.LX_SCENES, a derived file (src/scenes_data.js) that
   scripts/gen_scenes_js.py generates from the JSON; its --check fails the build
   when the two drift. Read lazily so load order within the bundle is not a
   contract.

   HOOKS. tradeschool.js and personas.js are not edited. Both keep their render
   function module-local and call it directly from their own click handlers, so
   wrapping window.LXTS.render / window.LXPersonas.render catches only the
   calls made from outside (app.js on a tab switch; a host-level mount) — the
   wrappers are kept, guarded, because they are the cheap path, but the thing
   that actually catches an in-page re-render is a MutationObserver on #tsroot
   and #hiveroot. Every pass is idempotent: a block carries data-lxscenes and a
   second pass finds it and stops, so an observer firing on our own insertion
   is a no-op rather than a loop. Track identity comes from LXTS.render._open
   (the original function's property, read through the wrapper); persona
   identity comes from the data-persona attribute personas.js sets on each
   .hivecard.

   Loads under node with a stub window/document (tests/run.py 12d): nothing
   touches the DOM at top level beyond document.addEventListener. */
(function(){
'use strict';

var TRACK_KINDS = {exterior: 1, interior: 1};
var MARK = 'data-lxscenes';
var NOTE_FALLBACK = 'A prompt for a title sequence. Abstract on purpose: no real place, ' +
  'building, person or property is depicted, and nothing here attaches to a parcel record.';

function lib(){
  var d = window.LX_SCENES;
  return (d && Array.isArray(d.scenes)) ? d : {scenes: [], the_line: ''};
}
function scenes(){ return lib().scenes; }

/* The note under every card. The library's own `the_line` is the source; its
   first two sentences are the boundary (no real place / building / person /
   property; never attached to a parcel record) and the rest names the scripts
   that enforce it, which a reader of the app does not need. If the_line ever
   shrinks below the fallback's claim, the fallback is printed instead — the
   note is never weaker than the fallback. */
function note(){
  var line = String(lib().the_line || '');
  var m = /^(.*?\.)\s+(.*?\.)(?:\s|$)/.exec(line);
  var parts = m ? m[1] + ' ' + m[2] : line;
  var strong = /real place/.test(parts) && /parcel record/.test(parts) &&
               /real person/.test(parts) && /real property/.test(parts);
  return strong ? 'A prompt for a title sequence. ' + parts : NOTE_FALLBACK;
}

function forTrack(id){
  return scenes().filter(function(s){ return TRACK_KINDS[s.kind] && s['for'] === id; });
}
function forPersona(id){
  return scenes().filter(function(s){ return s.kind === 'avatar' && s['for'] === id; });
}

function el(tag, cls, text){
  var e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text != null) e.textContent = text;
  return e;
}

/* One card: eyebrow, title, the opening prompt, the evolution behind a
   disclosure, the boundary note. Built with textContent throughout, so the
   prompt text is never parsed as markup. */
function card(scene){
  if(!scene || typeof document.createElement !== 'function') return null;
  var c = el('div', 'tile scenecard');
  c.setAttribute('data-scene', String(scene.id || ''));
  var what = scene['for'] ? 'for ' + scene['for'] : (scene.pillar || '');
  c.appendChild(el('div', 'eyebrow', 'Scene · ' + (scene.kind || '') + (what ? ' · ' + what : '')));
  c.appendChild(el('b', null, scene.title || scene.id || ''));
  var p = el('p', 'src', scene.initial || '');
  p.style.marginTop = '6px';
  c.appendChild(p);
  if(scene.evolution){
    var d = el('details');
    d.appendChild(el('summary', 'src', 'Evolution — the same world, one thing changing'));
    d.appendChild(el('p', 'src', scene.evolution));
    c.appendChild(d);
  }
  var n = el('p', 'src', note());
  n.style.fontStyle = 'italic';
  c.appendChild(n);
  return c;
}

/* ---- Trade School: cards for the open track, at the bottom of #tsroot ---- */
function tsOpen(){
  try{
    var T = window.LXTS; if(!T || typeof T.render !== 'function') return null;
    var r = T.render.__lxorig || T.render;
    if(r._check || r._mod) return null;   /* a certification check or a module page, not the track page */
    return r._open || null;
  }catch(e){ return null; }
}
function decorateTrack(){
  if(typeof document.getElementById !== 'function') return;
  var root = document.getElementById('tsroot'); if(!root) return;
  var open = tsOpen();
  var have = root.querySelector('[' + MARK + ']');
  if(!open){ if(have) have.parentNode.removeChild(have); return; }
  if(have && have.getAttribute(MARK) === open) return;
  if(have) have.parentNode.removeChild(have);
  var list = forTrack(open); if(!list.length) return;
  var block = el('div');
  block.setAttribute(MARK, open);
  block.style.marginTop = '14px';
  block.appendChild(el('div', 'eyebrow', 'Scenes behind this track'));
  var grid = el('div', 'lessons');
  grid.style.marginTop = '8px';
  list.forEach(function(s){ var k = card(s); if(k) grid.appendChild(k); });
  block.appendChild(grid);
  root.appendChild(block);
}

/* ---- Personas: the avatar scene(s) inside each .hivecard[data-persona] ---- */
function decoratePersonas(){
  if(typeof document.getElementById !== 'function') return;
  var host = document.getElementById('hiveroot'); if(!host) return;
  var cards = host.querySelectorAll('[data-persona]');
  for(var i = 0; i < cards.length; i++){
    var pc = cards[i], id = pc.getAttribute('data-persona');
    if(!id || pc.querySelector('[' + MARK + ']')) continue;
    var list = forPersona(id); if(!list.length) continue;
    var block = el('div');
    block.setAttribute(MARK, id);
    block.style.marginTop = '10px';
    block.appendChild(el('div', 'eyebrow', 'Avatar scene'));
    list.forEach(function(s){ var k = card(s); if(k){ k.style.marginTop = '6px'; block.appendChild(k); } });
    pc.appendChild(block);
  }
}

/* ---- wiring: wrap the public renders (guarded), observe the two hosts ---- */
function wrap(obj, key, after){
  try{
    if(!obj || typeof obj[key] !== 'function' || obj[key].__lxorig) return;
    var orig = obj[key];
    var w = function(){ var r = orig.apply(this, arguments); try{ after(); }catch(e){} return r; };
    w.__lxorig = orig;
    /* tradeschool.js keeps its page state on the function object (render._open,
       _mod, _check); forward those so a reader of LXTS.render._open still sees it. */
    ['_open', '_mod', '_check'].forEach(function(p){
      try{ Object.defineProperty(w, p, {get: function(){ return orig[p]; },
                                        set: function(v){ orig[p] = v; }}); }catch(e){}
    });
    obj[key] = w;
  }catch(e){}
}
function observe(id, fn){
  try{
    if(typeof MutationObserver !== 'function' || typeof document.getElementById !== 'function') return;
    var host = document.getElementById(id); if(!host) return;
    new MutationObserver(function(){ try{ fn(); }catch(e){} }).observe(host, {childList: true});
  }catch(e){}
}
var tries = 0;
function boot(){
  try{
    wrap(window.LXTS, 'render', decorateTrack);
    wrap(window.LXPersonas, 'render', decoratePersonas);
    observe('tsroot', decorateTrack);
    observe('hiveroot', decoratePersonas);
    decorateTrack();
    decoratePersonas();
  }catch(e){}
  /* The bundle order puts both modules before this one, but a later edition
     may not; retry the wrap a few times rather than assume. */
  if((!window.LXTS || !window.LXPersonas) && typeof document.getElementById === 'function' &&
     tries++ < 25 && typeof setTimeout === 'function')
    setTimeout(boot, 200);
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

window.LXSceneCards = {forTrack: forTrack, forPersona: forPersona, card: card, note: note};
})();
