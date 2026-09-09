/* locator.x — voice: real, browser-native text-to-speech and speech-to-text,
   nothing simulated and nothing routed through this app's own servers (it has
   none). Two capabilities, kept deliberately small:

   SPEAK (text-to-speech) uses window.speechSynthesis, which is built into the
   browser and runs without a network request in every engine that ships it.
   Used to read a lesson, a Q&A answer, or a tour step aloud.

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

var speaking = false;
function speak(text, onEnd){
  if(!synth) return false;
  try{
    synth.cancel(); // one utterance at a time, always
    var plain = typeof text === 'string' && /<[a-z][\s\S]*>/i.test(text) ? stripHTML(text) : String(text || '');
    if(!plain) return false;
    var u = new SpeechSynthesisUtterance(plain.length > 6000 ? plain.slice(0, 6000) + '…' : plain);
    u.rate = 1.0; u.pitch = 1.0;
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
   working even if the surrounding block re-renders */
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
