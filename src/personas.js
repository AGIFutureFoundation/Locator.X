/* locator.x — personas: the hive console. One voice per agent in
   docs/company/AGENTS.md (Scout, Diligence, Underwriting, Acquisitions,
   Development, Portfolio Learning) plus the app-wide guide (assistant.js).

   A persona is a way of READING an agent's output aloud — a speech rate, a
   pitch, a tone, an opening line that states the agent's boundary, and a list
   of things it will never say. It is not a capability: nothing here lets an
   agent do anything AGENTS.md forbids, and nothing here puts words in an
   agent's mouth. speak(id, text) prefixes no words and appends none; a text
   longer than 6,000 characters is cut there for the engine, the same cut
   voice.js makes, with one ellipsis marking the cut, and the panel shows the
   whole text. The only text any persona ever utters unprompted is its own
   opening line, and that line is its boundary.

   DATA. The block between the @personas.json markers is a copy of
   content/agents/personas.json, embedded so the single-file editions carry it.
   The JSON is the source of truth: scripts/validate_personas.py fails the
   build if this copy differs from it (and --sync rewrites it), and checks the
   JSON's scope / boundary / status against the AGENTS.md table word for word.

   VOICE. voice.js's LXVoice.speak(text, onEnd, opts) reads with the browser's
   own engine (window.speechSynthesis), applies the selected persona's rate,
   pitch and lang when LXPersonas names one, and takes an explicit
   {rate, pitch, lang} as its third argument. speak(id, text) here hands that
   function the persona's own voice object, after LXVoice.stopSpeak(), so the
   one-utterance-at-a-time rule holds. Where voice.js is not loaded the same
   engine is driven directly with the same settings; where there is no engine
   at all, speak returns false and nothing is simulated. The Listen buttons
   voice.js wires elsewhere in the app (lessons, tour, Q&A) read in the selected
   persona's voice through the same path. The guide's external preset voice id
   is data for pre-rendered narration outside the app: nothing in the app reads
   it, sends anything, or names an engine other than the browser's.

   MECHANISMS. Each card lists the modules AGENTS.md's "What ships today"
   column names for its agent, with a mark: present (that module's export
   exists at render time) or not loaded. The table is MECH below, keyed by
   persona id, with the citation beside it. Presence is a typeof check on a
   global; nothing is called. Portfolio Learning's one mechanism is marked
   "mechanism only — nothing feeds it", which is AGENTS.md's own wording.

   READOUT. Scout and Underwriting carry a "Read one real output" button when,
   and only when, a read-only value the app has already computed exists and is
   non-empty: Scout's latest pass log (LXScout.cfg.log) and the switchboard's
   own assumption list (LXSB.SB). The button shows that text with a line naming
   the module it came from and the as-of date when the output carries one, and
   speaks it in the persona's voice with no words prefixed or appended.
   Where the value is missing or empty the button is not drawn — never a
   placeholder sentence. Nothing here calls scan(), digest(), compare() or any
   other function that computes, mutates or stores. A one-line status under the
   cards counts the mechanisms this edition loaded.

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
      "role": "Assembles the property timeline and evidence package with a citation on every line; its ownership, debt and lien summaries are not built yet.",
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
      "opening_line": "I assemble the record and cite every line of it; what I cannot verify I mark unverified, I never look up an owner's identity, and my ownership, debt and lien summaries are not built yet.",
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
      "role": "Drafts the call briefs and property summaries a person reviews; its outreach drafting, lead aging and task tracking are not built yet.",
      "scope": "Call briefs, property summaries, follow-up tasks, pipeline updates; drafts outreach for human review; tracks aging leads and missing next actions",
      "boundary": "Must observe applicable privacy, calling, SMS, email and consent requirements. Drafting for a human to review is in scope; sending is not",
      "status": "partial",
      "personality": {
        "traits": [
          "organised",
          "plain",
          "deferential"
        ],
        "tone": "Plain and organised: a brief is a list of facts with their sources, and anything it drafts is marked as a draft. It never sends, calls or texts, and it names the consent rule that applies before any word of outreach is drafted."
      },
      "voice": {
        "engine": "browser-speechSynthesis",
        "rate": 1.05,
        "pitch": 1.0,
        "lang": "en-US",
        "external_preset_voice_id": null
      },
      "opening_line": "I draft the brief for you to read and never send, call or text anyone; my outreach drafting and lead aging are not built yet.",
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
      "role": "Lays out renovation and development scope options as labelled models; its schedule, permit, contractor and risk tracking is not built yet.",
      "scope": "Renovation and development scope options; tracks budgets, schedules, permits, contractors, contingencies and project risks; compares projected versus actual",
      "boundary": "May not represent a modelled cost as a quote",
      "status": "partial",
      "personality": {
        "traits": [
          "concrete",
          "cautious",
          "itemised"
        ],
        "tone": "Names what is a model every time a cost appears, with the inputs the model used and the contingency it carries. It never lets a modelled figure stand where a quote would, and it says that its tracking of schedules, permits and contractors is not built yet."
      },
      "voice": {
        "engine": "browser-speechSynthesis",
        "rate": 0.95,
        "pitch": 0.9,
        "lang": "en-US",
        "external_preset_voice_id": null
      },
      "opening_line": "Every cost I give you is a model with its inputs named, none of it is a quote, and my schedule, permit and contractor tracking is not built yet.",
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
      "role": "Will compare what was underwritten to what happened and report calibration only above the sample floor; it is not built yet.",
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
      "role": "The User's guide's spoken walkthrough: it reads the written tour and the answers the question search already holds, one section at a time.",
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
        "tone": "Calm and orderly: it reads the help that is already written, one section at a time, in the order the tour goes. It speaks only what the help already says, so a question the help does not cover gets no answer from it."
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

/* ---- the mechanisms AGENTS.md names per agent ----
   docs/company/AGENTS.md, table column "What ships today", one row per agent;
   `global` is the window export each module makes (grep `window.LX... =` in
   each file). The guide is not an AGENTS.md agent: its module comes from the
   JSON's ships_as, which validate_personas.py rule 3 checks exists.
   src/deskws.js exports nothing by design ("dependency-free on purpose"), so
   the only honest probe for it is the file input it renders into #deskwsroot;
   an edition without that container shows it as not loaded, which is true of
   the panel. */
function m(module, global){ return {module: module, global: global}; }
var MECH = {
  scout:        [m('src/scout.js', 'LXScout'), m('src/signals.js', 'LXSig'), m('src/patterns.js', 'LXPat')],
  diligence:    [m('src/records.js', 'LXRec'), m('src/rag.js', 'LXRAG'), m('src/packet.js', 'LXPACKET')],
  underwriting: [m('src/underwrite.js', 'LXUW'), m('src/switchboard.js', 'LXSB'), m('src/predict.js', 'LXPredict')],
  acquisitions: [m('src/uwexport.js', 'LXUWX'), {module: 'src/deskws.js', global: null, probe: '#deskwsfile'}, m('src/telemetry.js', 'LXTel')],
  development:  [m('src/dev.js', 'LXDev'), m('src/rebuild.js', 'LXRebuild'), m('src/conv.js', 'LXConv')],
  portfolio:    [{module: 'src/predict.js', global: 'LXPredict', note: 'mechanism only \u2014 nothing feeds it'}],
  guide:        [m('src/assistant.js', 'LXGuide')]
};
function loaded(mch){
  try{
    if(mch.global) return !!window[mch.global];
    if(mch.probe && typeof document.querySelector === 'function') return !!document.querySelector(mch.probe);
  }catch(e){}
  return false;
}
function mechanisms(id){
  return (MECH[id] || []).map(function(x){
    return {module: x.module, global: x.global || null, note: x.note || null, loaded: loaded(x)};
  });
}
/* N of M, counting each module once however many cards name it (predict.js
   serves Underwriting and Portfolio Learning). */
function mechCount(){
  var seen = {}, n = 0, mm = 0;
  for(var id in MECH) if(Object.prototype.hasOwnProperty.call(MECH, id)){
    for(var i = 0; i < MECH[id].length; i++){
      var x = MECH[id][i];
      if(seen[x.module]) continue;
      seen[x.module] = true; mm++;
      if(loaded(x)) n++;
    }
  }
  return {loaded: n, total: mm};
}
function statusLine(){
  var c = mechCount();
  return 'Hive: ' + c.loaded + ' of ' + c.total + ' mechanisms loaded in this edition \u00b7 nothing here decides, transacts or contacts';
}

/* ---- read one real output: already computed, read-only, nothing added ----
   OWNER FIELDS. The two shapes read here carry none: a scout log item is
   {t, type, title, body, id} (src/scout.js:56) and LXSB.SB is three numbers
   (src/switchboard.js:101). The rule is still enforced at the reading point —
   any key that names a person (owner, name, mail, phone, contact, person) is
   dropped before a value is displayed or spoken — so a later field added to
   either shape cannot reach a voice through this file. */
var OWNERISH = /owner|^name$|_name$|mail|phone|contact|person/i;
function scrub(o){
  var out = {};
  if(!o || typeof o !== 'object') return out;
  for(var k in o) if(Object.prototype.hasOwnProperty.call(o, k) && !OWNERISH.test(k)) out[k] = o[k];
  return out;
}
function stripTags(s){
  s = String(s == null ? '' : s);
  try{ if(window.LXVoice && typeof window.LXVoice.stripHTML === 'function') return window.LXVoice.stripHTML(s); }catch(e){}
  return s.replace(/<[^>]*>/g, ' ');
}
function pad2(n){ return (n < 10 ? '0' : '') + n; }
function asOf(t){
  var d = new Date(t);
  if(isNaN(d.getTime())) return null;
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
var READ = {
  /* LXScout.cfg (src/scout.js:286) is a getter over SC, the scout's stored
     state (src/scout.js:53): the log every pass appends to and lastScan, the
     start time of the latest pass (src/scout.js:104). The pass's own lines are
     the log items stamped at or after lastScan, ending in its 'scan' digest
     line (src/scout.js:106). digest() (src/scout.js:160) is NOT used: it is
     unexported and re-underwrites every row, so it is not read-only. */
  scout: function(){
    var S = window.LXScout;
    if(!S) return null;
    var sc = null;
    try{ sc = S.cfg; }catch(e){ return null; }
    if(!sc || !(sc.lastScan > 0) || !Array.isArray(sc.log)) return null;
    var lines = [];
    for(var i = 0; i < sc.log.length; i++){
      var it = sc.log[i];
      if(!it || !(it.t >= sc.lastScan)) continue;
      it = scrub(it);
      var line = [it.title, it.body].map(stripTags).map(function(x){ return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean).join(' \u2014 ');
      if(line) lines.push(line);
    }
    if(!lines.length) return null;
    return {text: lines.join('. '), module: 'src/scout.js', via: 'LXScout.cfg.log, the latest pass', asof: asOf(sc.lastScan)};
  },
  /* LXSB.SB (src/switchboard.js:101, exported at :453) — "the switchboard's
     own assumptions, in one place so they can be shown rather than buried":
     the levers every strategy column lists. The per-column lever array is
     built inside compare(), which computes, so it is not read here. The keys
     and values are read as the app holds them; no words are added. */
  underwriting: function(){
    var B = window.LXSB;
    if(!B || !B.SB || typeof B.SB !== 'object') return null;
    var sb = scrub(B.SB), parts = [];
    for(var k in sb) if(Object.prototype.hasOwnProperty.call(sb, k)){
      var v = sb[k];
      if(typeof v === 'number' || typeof v === 'string') parts.push(k + ' ' + stripTags(v).replace(/\s+/g, ' ').trim());
    }
    if(!parts.length) return null;
    return {text: parts.join(', '), module: 'src/switchboard.js', via: 'LXSB.SB, the switchboard\'s assumption list', asof: null};
  }
};
function readout(id){
  var f = READ[id];
  if(typeof f !== 'function') return null;
  var r = null;
  try{ r = f(); }catch(e){ r = null; }
  if(!r || !r.text || !String(r.text).trim()) return null;
  return r;
}
function srcLine(r){
  return 'From ' + r.module + ' (' + r.via + ')' + (r.asof ? ' \u00b7 as of ' + r.asof : '');
}

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
var speakingBtn = null;   /* the console button whose label reads Stop while speaking */
function speak(id, text, onEnd){
  var p = byId(id);
  if(!p) return false;
  var plain = String(text == null ? '' : text);
  if(window.LXVoice && typeof window.LXVoice.stripHTML === 'function' && /<[a-z][\s\S]*>/i.test(plain)){
    plain = window.LXVoice.stripHTML(plain);
  }
  plain = plain.replace(/\s+/g, ' ').trim();
  if(!plain) return false;
  var V = window.LXVoice || null;
  var done = function(){ speakingId = null; speakingBtn = null; if(onEnd) onEnd(); };
  var opts = {rate: clamp(p.voice && p.voice.rate), pitch: clamp(p.voice && p.voice.pitch),
              lang: (p.voice && p.voice.lang) || 'en-US'};
  if(V && typeof V.speak === 'function'){
    /* voice.js: the browser engine, cancelled first, this persona's settings;
       returns false where there is no engine rather than simulating speech */
    try{ if(typeof V.stopSpeak === 'function') V.stopSpeak(); }catch(e){}
    var ok = false;
    try{ ok = V.speak(plain, done, opts) === true; }catch(e){ ok = false; }
    speakingId = ok ? id : null;
    return ok;
  }
  var synth = window.speechSynthesis || null;
  var U = window.SpeechSynthesisUtterance || null;
  if(!synth || !U) return false;   /* no engine, nothing spoken */
  try{
    synth.cancel();
    /* the same 6,000-character cut voice.js makes, marked the same way */
    var u = new U(plain.length > 6000 ? plain.slice(0, 6000) + '…' : plain);
    u.rate = opts.rate; u.pitch = opts.pitch; u.lang = opts.lang;
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
  if(speakingBtn){
    try{ speakingBtn.innerHTML = speakingBtn.hasAttribute('data-readout') ? RO_LABEL : HEAR_LABEL; }catch(e){}
    speakingBtn = null;
  }
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
  '.hive .hivenote{font-size:11.5px;color:var(--muted,#777);margin:8px 0 0}\n' +
  '.hive .hivemech{margin:0;padding:0;list-style:none;font-size:12px}\n' +
  '.hive .hivemech li{display:flex;gap:6px;align-items:baseline;flex-wrap:wrap;margin:1px 0}\n' +
  '.hive .hivemech code{font-size:11.5px}\n' +
  '.hive .hivemark{font-size:10px;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:1px 7px;border:1px solid var(--line,#ddd);color:var(--muted,#777);white-space:nowrap}\n' +
  '.hive .hivemark.m-on{border-color:var(--accent,#3366cc);color:var(--accent,#3366cc)}\n' +
  '.hive .hivemechnote{font-size:11.5px;color:var(--muted,#777);font-style:italic}\n' +
  '.hive .hiveread{font-size:12.5px;margin:6px 0 0;padding:8px 10px;border:1px dashed var(--line,#ddd);border-radius:var(--r-lg,12px);color:var(--ink2,inherit)}\n' +
  '.hive .src{font-size:11px;color:var(--muted,#777);margin:2px 0 0}\n' +
  '.hive .hivestatus{font-size:12.5px;margin:12px 0 0;color:var(--ink2,inherit)}\n';

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
var RO_LABEL = '&#128214; Read one real output';
var HEAR_LABEL = '&#128266; Hear the boundary';
function mechRows(p){
  var ms = mechanisms(p.id);
  if(!ms.length) return '<li><span class="hivemark">none named</span></li>';
  return ms.map(function(x){
    return '<li><code>' + esc(x.module) + '</code>' +
      '<span class="hivemark' + (x.loaded ? ' m-on' : '') + '">' + (x.loaded ? 'present' : 'not loaded') + '</span>' +
      (x.note ? '<span class="hivemechnote">' + esc(x.note) + '</span>' : '') + '</li>';
  }).join('');
}
function card(p){
  var pers = p.personality || {};
  var v = p.voice || {};
  var isCur = p.id === current();
  var ro = readout(p.id);   /* null unless a real, non-empty value exists right now */
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
    '<div class="hivek">Voice</div><p class="hivev">browser speech, rate ' + esc(v.rate) + ', pitch ' + esc(v.pitch) + '</p>' +
    '<div class="hivek">In this edition</div><ul class="hivemech" data-mech="' + esc(p.id) + '">' + mechRows(p) + '</ul>' +
    '<div class="hiveact">' +
      '<button type="button" class="btn" data-hear="' + esc(p.id) + '" title="Speaks this persona\'s opening line — its boundary — in its own rate and pitch. Runs in your browser; not available in a sandboxed preview.">' + HEAR_LABEL + '</button>' +
      (ro ? '<button type="button" class="btn" data-readout="' + esc(p.id) + '" title="Reads, in this voice, a value the app already computed (' + esc(ro.module) + '). No words are prefixed or appended; nothing is computed, scanned or stored.">' + RO_LABEL + '</button>' : '') +
      '<button type="button" class="btn' + (isCur ? ' primary' : '') + '" data-pick="' + esc(p.id) + '">' + (isCur ? 'Selected' : 'Select') + '</button>' +
    '</div>' +
    '<div data-out="' + esc(p.id) + '"></div>' +
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
      '<p class="hivestatus" data-hivestatus>' + esc(statusLine()) + '</p>' +
      '<p class="hivenote">' + (canSpeak
        ? 'Speech runs in your browser (speechSynthesis), no network needed.'
        : 'This browser or preview exposes no speech engine, so the Hear buttons do nothing rather than simulate a voice.') + '</p>' +
    '</div>';
  var hears = host.querySelectorAll('[data-hear]');
  for(var i = 0; i < hears.length; i++) (function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-hear');
      if(speakingBtn === btn){ stop(); return; }
      var p = byId(id); if(!p) return;
      stop();   /* resets whichever other button read Stop; speak() cancels the engine itself */
      var ok = speak(id, p.opening_line, function(){ btn.innerHTML = HEAR_LABEL; });
      if(ok){ speakingBtn = btn; btn.innerHTML = '&#9208; Stop'; }
    });
  })(hears[i]);
  var reads = host.querySelectorAll('[data-readout]');
  for(var k = 0; k < reads.length; k++) (function(btn){
    btn.addEventListener('click', function(){
      if(speakingBtn === btn){ stop(); return; }
      var id = btn.getAttribute('data-readout');
      var r = readout(id);   /* read again now: the app may have moved on */
      var outEl = host.querySelector('[data-out="' + id + '"]');
      if(!r){
        /* the value is gone or empty: the button goes with it, no stand-in text */
        if(outEl) outEl.innerHTML = '';
        if(btn.parentNode) btn.parentNode.removeChild(btn);
        return;
      }
      if(outEl) outEl.innerHTML = '<p class="hiveread">' + esc(r.text) + '</p><p class="src">' + esc(srcLine(r)) + '</p>';
      stop();
      var ok = speak(id, r.text, function(){ btn.innerHTML = RO_LABEL; });
      if(ok){ speakingBtn = btn; btn.innerHTML = '&#9208; Stop'; }
    });
  })(reads[k]);
  var picks = host.querySelectorAll('[data-pick]');
  for(var j = 0; j < picks.length; j++) (function(btn){
    btn.addEventListener('click', function(){ set(btn.getAttribute('data-pick')); });
  })(picks[j]);
}
/* Modules that boot on DOMContentLoaded after this one (deskws.js renders its
   probe element then) are not visible at first render, so the marks and the
   status line are recomputed once at window load. Nothing else is touched. */
function refreshMech(){
  if(!hostEl || typeof hostEl.querySelectorAll !== 'function') return;
  var rows = hostEl.querySelectorAll('[data-mech]');
  for(var i = 0; i < rows.length; i++){
    var p = byId(rows[i].getAttribute('data-mech'));
    if(p) rows[i].innerHTML = mechRows(p);
  }
  var st = hostEl.querySelector('[data-hivestatus]');
  if(st) st.textContent = statusLine();
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

/* No hook into the assistant: its Listen buttons go through LXVoice.speak,
   which reads LXPersonas.current() itself, so the selected persona reaches
   them without this file wrapping anything. */
function mount(){
  try{
    if(typeof document.getElementById === 'function'){
      var host = document.getElementById('hiveroot');
      if(host) render(host);
    }
  }catch(e){}
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
try{ if(typeof window.addEventListener === 'function') window.addEventListener('load', function(){ try{ refreshMech(); }catch(e){} }); }catch(e){}

window.LXPersonas = { list: list, get: get, speak: speak, stop: stop, current: current, set: set, render: render,
                      mechanisms: mechanisms, readout: readout, status: mechCount };
})();
