/* locator.x — personas: the hive console. One voice per agent in
   docs/company/AGENTS.md (Scout, Diligence, Underwriting, Acquisitions,
   Development, Portfolio Learning) plus the app-wide guide (assistant.js).

   A persona is a way of READING an agent's output aloud — a speech rate, a
   pitch, a tone, an opening line that states the agent's boundary, and a list
   of things it will never say. It is not a capability: nothing here lets an
   agent do anything AGENTS.md forbids, and nothing here puts words in an
   agent's mouth. speak(id, text) prefixes nothing and appends nothing. The
   only text any persona ever utters unprompted is its own opening line, and
   that line is its boundary.

   DATA. The block between the @personas.json markers is a copy of
   content/agents/personas.json, embedded so the single-file editions carry it.
   The JSON is the source of truth: scripts/validate_personas.py fails the
   build if this copy differs from it (and --sync rewrites it), and checks the
   JSON's scope / boundary / status against the AGENTS.md table word for word.

   VOICE. voice.js's LXVoice.speak(text, onEnd) pins rate and pitch at 1.0 and
   exposes no way to set them, and that file is deliberately not extended. So a
   persona drives the SAME browser engine (window.speechSynthesis) directly with
   its own rate and pitch, calling LXVoice.stopSpeak() first so voice.js's
   one-utterance-at-a-time rule still holds; where speechSynthesis is absent it
   falls back to LXVoice.speak as-is (which then also returns false — no engine,
   nothing is simulated). The guide's external preset voice id is for
   pre-rendered narration outside the app; inside the app every persona uses the
   browser engine. The Listen buttons voice.js wires elsewhere in the app
   (lessons, tour, Q&A) still read at 1.0/1.0 — the selected persona does not
   reach them, and this file does not pretend it does.

   MOUNT. Renders into #hiveroot when that element exists; otherwise nothing.
   Loads under node with a stub window/document (tests/run.py 12d). */
(function(){
'use strict';

var DATA = /*@personas.json*/{
  "_about": "The hive: one persona per agent in docs/company/AGENTS.md, plus the app-wide guide. A persona is a voice and a boundary, not a capability: it changes how an agent's output is read aloud and what it refuses to say, never what the agent is allowed to do. scope, boundary and status are copied word for word from the AGENTS.md table and scripts/validate_personas.py fails the build when they drift. The only text a persona ever speaks unprompted is its own opening_line, which states its boundary. src/personas.js carries an embedded copy of this file that the same validator diffs (python3 scripts/validate_personas.py --sync rewrites it).",
  "reviewed": "2026-10",
  "rules": [
    "Bounded. An agent acts only within a scope a human set, and it cannot widen its own scope. No agent here is authorised to transact, offer, contact an owner, commit capital, or change a buy box.",
    "Traceable. Every output names its inputs and where each came from.",
    "Human approval for anything material. An agent proposes; a person decides."
  ],
  "always": "Never represents unverified information as fact.",
  "personas": [
    {
      "id": "scout",
      "name": "Scout",
      "role": "Watches the approved markets and buy boxes and reports what entered the pipeline and why.",
      "scope": "Monitors approved markets and buy boxes, detects qualifying properties and new event signals, explains why a property entered the pipeline",
      "boundary": "May not widen a buy box or a market; may not contact anyone",
      "status": "ships",
      "personality": {
        "traits": [
          "brisk",
          "literal",
          "watchful"
        ],
        "tone": "Brisk and list-shaped: it names each property that entered the pipeline, the box it matched and the signal that put it there. It reports what changed since the last pass and stops; it never characterises an owner or a market it was not given."
      },
      "voice": {
        "engine": "browser-speechSynthesis",
        "rate": 1.15,
        "pitch": 1.05,
        "lang": "en-US",
        "external_preset_voice_id": null
      },
      "opening_line": "I watch the markets you approved and tell you what entered the pipeline and why; I never widen the box.",
      "never_says": [
        "this is a good deal",
        "the owner is motivated",
        "I added a market for you",
        "it looks distressed",
        "you should look at this one"
      ]
    },
    {
      "id": "diligence",
      "name": "Diligence",
      "role": "Assembles the property timeline and evidence package and names what is still missing from it.",
      "scope": "Builds the property timeline and evidence package, finds missing diligence items, summarises ownership, debt, liens, permits, zoning, comps, risks and documents",
      "boundary": "Never represents unverified information as fact; may not retrieve or store owner PII",
      "status": "partial",
      "personality": {
        "traits": [
          "slow",
          "citing",
          "exact"
        ],
        "tone": "Slow, and it cites: every statement names the record it came from and the evidence grade that record carries. Anything it cannot verify it marks unverified rather than saying it, and an owner's identity it does not look up at all."
      },
      "voice": {
        "engine": "browser-speechSynthesis",
        "rate": 0.85,
        "pitch": 0.95,
        "lang": "en-US",
        "external_preset_voice_id": null
      },
      "opening_line": "I assemble the record and cite every line of it; what I cannot verify I mark unverified, and I never look up an owner's identity.",
      "never_says": [
        "the title is clean",
        "the owner is motivated",
        "the owner's name is",
        "a C-graded record stated as certain",
        "probably fine"
      ]
    },
    {
      "id": "underwriting",
      "name": "Underwriting",
      "role": "Builds the base, downside and upside cases and flags every assumption a person must check.",
      "scope": "Generates initial scenarios, flags assumptions needing human review, produces base / downside / upside cases, compares strategies and capital structures",
      "boundary": "Does not make final investment decisions",
      "status": "ships",
      "personality": {
        "traits": [
          "measured",
          "explicit",
          "numerate"
        ],
        "tone": "States the assumptions before the numbers, every time, and says which lever each case rests on. It compares strategies by the facts under them and hands the comparison back without a verdict."
      },
      "voice": {
        "engine": "browser-speechSynthesis",
        "rate": 1.0,
        "pitch": 0.9,
        "lang": "en-US",
        "external_preset_voice_id": null
      },
      "opening_line": "I state the assumptions before the numbers, run the base, downside and upside cases, and leave the decision to you.",
      "never_says": [
        "you should offer",
        "this is a good deal",
        "the return is guaranteed",
        "a price it did not compute",
        "buy now"
      ]
    },
    {
      "id": "acquisitions",
      "name": "Acquisitions",
      "role": "Drafts the call briefs, summaries and outreach a person reviews, and tracks what has no next action.",
      "scope": "Call briefs, property summaries, follow-up tasks, pipeline updates; drafts outreach for human review; tracks aging leads and missing next actions",
      "boundary": "Must observe applicable privacy, calling, SMS, email and consent requirements. Drafting for a human to review is in scope; sending is not",
      "status": "partial",
      "personality": {
        "traits": [
          "organised",
          "plain",
          "deferential"
        ],
        "tone": "Plain and organised: a brief is a list of facts with their sources, a draft is marked as a draft, and a lead with no next action is named as such. It drafts and never sends, and it says which consent rule applies before it writes a word of outreach."
      },
      "voice": {
        "engine": "browser-speechSynthesis",
        "rate": 1.05,
        "pitch": 1.0,
        "lang": "en-US",
        "external_preset_voice_id": null
      },
      "opening_line": "I draft the brief and the outreach for you to read; I do not send, call or text anyone.",
      "never_says": [
        "I sent it",
        "I called the owner",
        "the owner is motivated",
        "offer now"
      ]
    },
    {
      "id": "development",
      "name": "Development",
      "role": "Lays out renovation and development scope options as labelled models and compares projected to actual.",
      "scope": "Renovation and development scope options; tracks budgets, schedules, permits, contractors, contingencies and project risks; compares projected versus actual",
      "boundary": "May not represent a modelled cost as a quote",
      "status": "partial",
      "personality": {
        "traits": [
          "concrete",
          "cautious",
          "itemised"
        ],
        "tone": "Names what is a model every time a cost appears, with the inputs the model used and the contingency it carries. It separates projected from actual in the same breath and never lets a modelled figure stand where a quote would."
      },
      "voice": {
        "engine": "browser-speechSynthesis",
        "rate": 0.95,
        "pitch": 0.9,
        "lang": "en-US",
        "external_preset_voice_id": null
      },
      "opening_line": "Every cost I give you is a model with its inputs named; none of it is a quote.",
      "never_says": [
        "the contractor quoted",
        "this cost is firm",
        "it will appreciate",
        "permits are a formality"
      ]
    },
    {
      "id": "portfolio",
      "name": "Portfolio Learning",
      "role": "Compares what was underwritten to what actually happened and recommends calibration only where the sample allows it.",
      "scope": "Compares underwritten assumptions to actual outcomes across rent, occupancy, capex, rehab, expenses, financing and exit; recommends calibration",
      "boundary": "May not report a calibration below the sample floor",
      "status": "not built",
      "personality": {
        "traits": [
          "patient",
          "statistical",
          "candid"
        ],
        "tone": "Patient and statistical: it reports a calibration with its sample size and says below the sample floor when it is, instead of a number. It is not built yet and says so before anything else."
      },
      "voice": {
        "engine": "browser-speechSynthesis",
        "rate": 0.9,
        "pitch": 1.0,
        "lang": "en-US",
        "external_preset_voice_id": null
      },
      "opening_line": "I am not built yet; when I am, I will compare underwritten assumptions to actual outcomes and report nothing below the sample floor.",
      "never_says": [
        "a calibration below the sample floor",
        "the model is proven",
        "will appreciate",
        "three results are a trend"
      ]
    },
    {
      "id": "guide",
      "name": "The guide",
      "role": "The existing assistant's tour and help voice: it reads the section tour and the help corpus aloud from anywhere in the app.",
      "scope": "reads help text that already exists",
      "boundary": "invents no content",
      "status": "ships",
      "ships_as": "src/assistant.js",
      "personality": {
        "traits": [
          "calm",
          "orderly",
          "helpful"
        ],
        "tone": "Calm and orderly: it reads the help that is already written, one section at a time, in the order the tour goes. When the help has no answer it says so rather than guessing."
      },
      "voice": {
        "engine": "browser-speechSynthesis",
        "rate": 1.0,
        "pitch": 1.0,
        "lang": "en-US",
        "external_preset_voice_id": "6705e465-7b52-5915-a1d8-b1222885e01d",
        "external_engine": "seed_audio (Higgsfield) — used only for pre-rendered narration outside the app; the app itself uses the browser engine"
      },
      "opening_line": "I read you the help that is already written, in order, and I invent nothing.",
      "never_says": [
        "this is a good deal",
        "you should",
        "I think the answer is",
        "something the help text does not say"
      ]
    }
  ]
}/*@end personas.json*/;

var PERSONAS = (DATA && DATA.personas) || [];
var RULES = (DATA && DATA.rules) || [];
var ALWAYS = (DATA && DATA.always) || '';
var KEY = 'lxpersona';
var DEFAULT_ID = 'guide';

function byId(id){
  for(var i = 0; i < PERSONAS.length; i++) if(PERSONAS[i].id === id) return PERSONAS[i];
  return null;
}
function list(){ return PERSONAS.slice(); }
function get(id){ return byId(id); }

/* ---- selection, remembered per browser (a convenience, never state) ---- */
var selected = null;
function storage(){
  try{ if(typeof localStorage !== 'undefined' && localStorage) return localStorage; }catch(e){}
  try{ return window.localStorage || null; }catch(e){ return null; }
}
function current(){
  if(selected) return selected;
  try{
    var s = storage();
    var v = s ? s.getItem(KEY) : null;
    if(v && byId(v)) selected = v;
  }catch(e){}
  return selected || DEFAULT_ID;
}
function set(id){
  if(!byId(id)) return false;
  selected = id;
  try{ var s = storage(); if(s) s.setItem(KEY, id); }catch(e){}
  try{ markSelected(); }catch(e){}
  return true;
}

/* ---- speaking: the persona's rate and pitch, nothing added to the text ---- */
function clamp(x){ x = Number(x); if(!(x >= 0.8 && x <= 1.2)) return 1.0; return x; }
var speakingId = null;
function speak(id, text, onEnd){
  var p = byId(id);
  if(!p) return false;
  var plain = String(text == null ? '' : text);
  if(window.LXVoice && typeof window.LXVoice.stripHTML === 'function' && /<[a-z][\s\S]*>/i.test(plain)){
    plain = window.LXVoice.stripHTML(plain);
  }
  plain = plain.replace(/\s+/g, ' ').trim();
  if(!plain) return false;
  var synth = window.speechSynthesis || null;
  var U = window.SpeechSynthesisUtterance || null;
  var done = function(){ speakingId = null; if(onEnd) onEnd(); };
  if(!synth || !U){
    /* no engine here to set a rate on — voice.js's speak as-is, which returns
       false in the same situation rather than simulating speech */
    return (window.LXVoice && typeof window.LXVoice.speak === 'function')
      ? window.LXVoice.speak(plain, onEnd) : false;
  }
  try{
    if(window.LXVoice && typeof window.LXVoice.stopSpeak === 'function') window.LXVoice.stopSpeak();
    else synth.cancel();
    var u = new U(plain.length > 6000 ? plain.slice(0, 6000) + '…' : plain);
    u.rate = clamp(p.voice && p.voice.rate);
    u.pitch = clamp(p.voice && p.voice.pitch);
    u.lang = (p.voice && p.voice.lang) || 'en-US';
    u.onend = done; u.onerror = done;
    speakingId = id;
    synth.speak(u);
    return true;
  }catch(e){ speakingId = null; return false; }
}
function stop(){
  try{
    if(window.LXVoice && typeof window.LXVoice.stopSpeak === 'function') window.LXVoice.stopSpeak();
    else if(window.speechSynthesis) window.speechSynthesis.cancel();
  }catch(e){}
  speakingId = null;
}

/* ---- the console ---- */
function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c];
  });
}
var STYLE_ID = 'lxpersonas-style';
var CSS =
  '.hive{margin:18px 0}\n' +
  '.hive .hivehead{margin:0 0 10px}\n' +
  '.hive .hivehead h2{margin:0 0 4px}\n' +
  '.hive .hiverules{margin:0 0 14px;padding:10px 12px;border:1px solid var(--line,#ddd);border-radius:var(--r-lg,12px);background:var(--panel2,transparent);font-size:12.5px;color:var(--ink2,inherit)}\n' +
  '.hive .hiverules ol{margin:6px 0 0 18px;padding:0}\n' +
  '.hive .hiverules li{margin:2px 0}\n' +
  '.hive .hivegrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}\n' +
  '.hive .hivecard{border:1px solid var(--line,#ddd);border-radius:var(--r-lg,12px);background:var(--panel,transparent);padding:12px 14px;display:flex;flex-direction:column;gap:6px}\n' +
  '.hive .hivecard.on{outline:2px solid var(--accent,#3366cc);outline-offset:-1px}\n' +
  '.hive .hivetop{display:flex;align-items:center;justify-content:space-between;gap:8px}\n' +
  '.hive .hivetop h3{margin:0;font-size:15px}\n' +
  '.hive .hivepill{font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:3px 8px;border:1px solid var(--line,#ddd);color:var(--ink2,inherit);white-space:nowrap}\n' +
  '.hive .hivepill.s-ships{background:var(--accent,#3366cc);border-color:var(--accent,#3366cc);color:#fff}\n' +
  '.hive .hivepill.s-partial{border-style:dashed}\n' +
  '.hive .hivepill.s-notbuilt{opacity:.7;text-decoration:line-through}\n' +
  '.hive .hiverole{margin:0;font-size:12.5px;color:var(--muted,#777)}\n' +
  '.hive .hivek{font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#777);margin-top:4px}\n' +
  '.hive .hivev{font-size:12.5px;color:var(--ink2,inherit);margin:0}\n' +
  '.hive .hiveboundary{font-weight:600}\n' +
  '.hive .hivetraits{display:flex;gap:4px;flex-wrap:wrap}\n' +
  '.hive .hivetraits span{font-size:11px;border:1px solid var(--line,#ddd);border-radius:999px;padding:2px 8px}\n' +
  '.hive .hiveline{font-size:13px;font-style:italic;margin:0;padding-left:10px;border-left:3px solid var(--accent,#3366cc)}\n' +
  '.hive .hivenever{margin:0 0 0 16px;padding:0;font-size:12px;color:var(--muted,#777)}\n' +
  '.hive .hiveact{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}\n' +
  '.hive .hivenote{font-size:11.5px;color:var(--muted,#777);margin:8px 0 0}\n';

function ensureStyle(){
  if(!document.getElementById || document.getElementById(STYLE_ID)) return;
  var st = document.createElement('style');
  st.id = STYLE_ID;
  st.textContent = CSS;
  (document.head || document.body).appendChild(st);
}
function pillClass(status){
  return 's-' + String(status || '').replace(/\s+/g, '').toLowerCase();
}
function card(p){
  var pers = p.personality || {};
  var v = p.voice || {};
  var isCur = p.id === current();
  return '<div class="hivecard' + (isCur ? ' on' : '') + '" data-persona="' + esc(p.id) + '">' +
    '<div class="hivetop"><h3>' + esc(p.name) + '</h3>' +
      '<span class="hivepill ' + pillClass(p.status) + '">' + esc(p.status) + '</span></div>' +
    '<p class="hiverole">' + esc(p.role) + '</p>' +
    '<div class="hivek">Scope</div><p class="hivev">' + esc(p.scope) + '</p>' +
    '<div class="hivek">Hard boundary</div><p class="hivev hiveboundary">' + esc(p.boundary) + '</p>' +
    '<div class="hivek">Traits</div><div class="hivetraits">' +
      (pers.traits || []).map(function(t){ return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
    '<div class="hivek">How it speaks</div><p class="hivev">' + esc(pers.tone) + '</p>' +
    '<div class="hivek">Opening line</div><p class="hiveline">' + esc(p.opening_line) + '</p>' +
    '<div class="hivek">Never says</div><ul class="hivenever">' +
      (p.never_says || []).map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
    '<div class="hivek">Voice</div><p class="hivev">browser speech, rate ' + esc(v.rate) + ', pitch ' + esc(v.pitch) +
      (v.external_preset_voice_id ? ' · external preset ' + esc(v.external_preset_voice_id) + ' (' + esc(v.external_engine) + ')' : '') + '</p>' +
    '<div class="hiveact">' +
      '<button type="button" class="btn" data-hear="' + esc(p.id) + '" title="Speaks this persona\'s opening line — its boundary — in its own rate and pitch. Runs in your browser; not available in a sandboxed preview.">&#128266; Hear the boundary</button>' +
      '<button type="button" class="btn' + (isCur ? ' primary' : '') + '" data-pick="' + esc(p.id) + '">' + (isCur ? 'Selected' : 'Select') + '</button>' +
    '</div>' +
  '</div>';
}
var hostEl = null;
function render(host){
  if(!host) return;
  hostEl = host;
  ensureStyle();
  var canSpeak = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  host.innerHTML =
    '<div class="hive">' +
      '<div class="hivehead"><p class="eyebrow">The hive</p><h2>Seven voices, each bounded by the words in AGENTS.md</h2>' +
        '<p class="hiverole">A persona is how an agent\'s output is read aloud, not what the agent may do. Scope, boundary and status below are the agent table verbatim; a build fails if they drift. ' +
        'The only thing a persona says unprompted is its own boundary.</p></div>' +
      '<div class="hiverules"><b>The rules that bind all of them.</b><ol>' +
        RULES.map(function(r){ return '<li>' + esc(r) + '</li>'; }).join('') + '</ol>' +
        (ALWAYS ? '<div style="margin-top:6px"><b>Always:</b> ' + esc(ALWAYS) + '</div>' : '') + '</div>' +
      '<div class="hivegrid">' + PERSONAS.map(card).join('') + '</div>' +
      '<p class="hivenote">' + (canSpeak
        ? 'Speech runs in your browser (speechSynthesis), no network needed.'
        : 'This browser or preview exposes no speech engine, so the Hear buttons do nothing rather than simulate a voice.') + '</p>' +
    '</div>';
  var hears = host.querySelectorAll('[data-hear]');
  for(var i = 0; i < hears.length; i++) (function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-hear');
      if(speakingId === id){ stop(); btn.innerHTML = '&#128266; Hear the boundary'; return; }
      var p = byId(id); if(!p) return;
      var ok = speak(id, p.opening_line, function(){ btn.innerHTML = '&#128266; Hear the boundary'; });
      if(ok) btn.innerHTML = '&#9208; Stop';
    });
  })(hears[i]);
  var picks = host.querySelectorAll('[data-pick]');
  for(var j = 0; j < picks.length; j++) (function(btn){
    btn.addEventListener('click', function(){ set(btn.getAttribute('data-pick')); });
  })(picks[j]);
}
function markSelected(){
  if(!hostEl) return;
  var cur = current();
  var cards = hostEl.querySelectorAll('[data-persona]');
  for(var i = 0; i < cards.length; i++){
    var c = cards[i], on = c.getAttribute('data-persona') === cur;
    c.className = 'hivecard' + (on ? ' on' : '');
    var b = c.querySelector('[data-pick]');
    if(b){ b.className = 'btn' + (on ? ' primary' : ''); b.textContent = on ? 'Selected' : 'Select'; }
  }
}

/* ---- the assistant hook ---- assistant.js registers window.LXGuide with
   open() and close() only; its speech goes through LXVoice.speakButton /
   wireSpeakButtons and never through a speak() of its own. So this hook is
   guarded on a path that does not exist today: if a later assistant.js exposes
   LXGuide.speak(text, onEnd), the selected persona's rate and pitch apply to
   it; until then nothing is wrapped and nothing is claimed. */
var hookTries = 0;
function hookGuide(){
  try{
    var g = window.LXGuide;
    if(!g){ if(hookTries++ < 50 && typeof setTimeout === 'function') setTimeout(hookGuide, 200); return; }
    if(typeof g.speak !== 'function' || g.__lxpersona) return;
    var orig = g.speak;
    g.speak = function(text, onEnd){
      return speak(current(), text, onEnd) || orig.apply(g, arguments);
    };
    g.__lxpersona = true;
  }catch(e){}
}

function mount(){
  try{
    if(typeof document.getElementById === 'function'){
      var host = document.getElementById('hiveroot');
      if(host) render(host);
    }
  }catch(e){}
  if(typeof document.getElementById === 'function') hookGuide();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();

window.LXPersonas = { list: list, get: get, speak: speak, stop: stop, current: current, set: set, render: render };
})();
