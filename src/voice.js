/* locator.x — voice: real, browser-native text-to-speech and speech-to-text,
   nothing simulated and nothing routed through this app's own servers (it has
   none). Two capabilities, kept deliberately small:

   SPEAK (text-to-speech) uses window.speechSynthesis, which is built into the
   browser and runs without a network request in every engine that ships it.
   Used to read a lesson, a Q&A answer, or a tour step aloud. The voice may
   vary by the persona the user selected on Home (personas.js, the hive
   console): when window.LXPersonas exists and names a selected persona, its
   rate, pitch and lang are applied to the utterance; otherwise rate and pitch
   are 1.0 and the browser's default lang is used. A caller may also pass an
   explicit {rate, pitch, lang} as a third argument, which overrides the
   persona. Either way it is still the browser's own engine reading the same
   text — a persona changes how a block is read, never what it says — and
   nothing is sent anywhere. Rate and pitch are clamped to 0.8–1.2 here as
   well as by scripts/validate_personas.py.

   LISTEN (speech-to-text) uses SpeechRecognition / webkitSpeechRecognition.
   Where it exists it is real dictation — Chrome's implementation sends the
   audio to Google's recognition service to do it, which is disclosed here
   once rather than left as a silent surprise the first time a mic prompt
   appears. Where the browser does not implement it at all (Firefox, most of
   Safari as of this writing), the mic control simply does not render — this
   file never fakes a capability the browser does not have.

   Neither capability is available inside claude.ai's sandboxed preview
   (no audio device access there); both work once the page is downloaded and
   opened directly, which is stated in the button title rather than left to
   produce a silent, unexplained failure. */
(function(){
'use strict';
var synth = window.speechSynthesis || null;
var Rec = window.SpeechRecognition || window.webkitSpeechRecognition || null;

function stripHTML(html){
  var d = document.createElement('div');
  d.innerHTML = String(html || '');
  return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim();
}

/* rate and pitch live in 0.8–1.2 (the personas validator's bound); anything
   else — including absent — reads at 1.0 rather than at whatever was passed */
function clampVoice(x){ x = Number(x); return (x >= 0.8 && x <= 1.2) ? x : 1.0; }
/* the selected persona's voice settings, or null when there is no persona
   layer, no selection, or the lookup throws. LXPersonas.current() returns the
   selected persona's id today; a persona object is accepted too, so this does
   not break if that shape changes. */
function personaVoice(){
  try{
    var P = window.LXPersonas;
    if(!P || typeof P.current !== 'function') return null;
    var cur = P.current();
    if(cur && typeof cur === 'string' && typeof P.get === 'function') cur = P.get(cur);
    return (cur && cur.voice && typeof cur.voice === 'object') ? cur.voice : null;
  }catch(e){ return null; }
}

var speaking = false;
/* speak(text, onEnd, opts?) — opts is an optional {rate, pitch, lang} an
   explicit caller may pass; it overrides the selected persona, which in turn
   overrides the 1.0/1.0/browser-default baseline. The text is never altered. */
function speak(text, onEnd, opts){
  if(!synth) return false;
  try{
    synth.cancel(); // one utterance at a time, always
    var plain = typeof text === 'string' && /<[a-z][\s\S]*>/i.test(text) ? stripHTML(text) : String(text || '');
    if(!plain) return false;
    var u = new SpeechSynthesisUtterance(plain.length > 6000 ? plain.slice(0, 6000) + '…' : plain);
    var pv = personaVoice() || {};
    var o = (opts && typeof opts === 'object') ? opts : {};
    u.rate = clampVoice(o.rate != null ? o.rate : pv.rate);
    u.pitch = clampVoice(o.pitch != null ? o.pitch : pv.pitch);
    var lang = (typeof o.lang === 'string' && o.lang) || (typeof pv.lang === 'string' && pv.lang) || '';
    if(lang) u.lang = lang;
    u.onstart = function(){ speaking = true; };
    u.onend = function(){ speaking = false; if(onEnd) onEnd(); };
    u.onerror = function(){ speaking = false; if(onEnd) onEnd(); };
    synth.speak(u);
    return true;
  }catch(e){ return false; }
}
function stopSpeak(){ if(synth){ try{ synth.cancel(); }catch(e){} } speaking = false; }
function isSpeaking(){ return speaking; }

var listening = false;
function listen(onResult, onEnd){
  if(!Rec) return false;
  try{
    var r = new Rec();
    r.lang = (document.documentElement.getAttribute('lang') || 'en-US');
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = function(ev){
      var t = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : '';
      if(t && onResult) onResult(t);
    };
    r.onend = function(){ listening = false; if(onEnd) onEnd(); };
    r.onerror = function(){ listening = false; if(onEnd) onEnd(); };
    listening = true;
    r.start();
    return true;
  }catch(e){ listening = false; return false; }
}
function isListening(){ return listening; }

/* a small reusable "Listen" (speak-this-block) button, wired in place —
   callers pass a getter for the current plain/HTML text so the button keeps
   working even if the surrounding block re-renders. It reads through speak(),
   so the persona selected on Home (if any) sets its rate, pitch and lang. */
function speakButton(id, getText, label){
  return '<button type="button" class="btn" data-speak="' + id + '" title="' +
    (synth ? 'Read this aloud (text-to-speech, runs in your browser, no network needed)' : 'Not supported in this browser') +
    '"' + (synth ? '' : ' disabled') + '>' + (label || '&#128266; Listen') + '</button>';
}
function wireSpeakButtons(root, getTextById){
  if(!synth) return;
  var els = (root || document).querySelectorAll('[data-speak]');
  for(var i = 0; i < els.length; i++){
    (function(btn){
      btn.onclick = function(){
        if(isSpeaking()){ stopSpeak(); btn.textContent = '\u{1F50A} Listen'; return; }
        var txt = getTextById(btn.getAttribute('data-speak'));
        if(!txt) return;
        btn.textContent = '⏸ Stop';
        speak(txt, function(){ btn.textContent = '\u{1F50A} Listen'; });
      };
    })(els[i]);
  }
}

window.LXVoice = {
  canSpeak: !!synth, canListen: !!Rec,
  speak: speak, stopSpeak: stopSpeak, isSpeaking: isSpeaking,
  listen: listen, isListening: isListening,
  stripHTML: stripHTML, speakButton: speakButton, wireSpeakButtons: wireSpeakButtons
};
})();
