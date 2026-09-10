/* locator.x — the voice walkthrough: a hands-free agent that walks the whole app.

   The floating guide (assistant.js) answers "where am I and what does this section
   do" when the user asks. This module is the other direction: the user presses one
   button and the app drives itself — it opens each section in tour order, narrates
   what the section is for and what to do first (voice.js text-to-speech, in-browser,
   no network), then advances to the next when the narration ends. Where the browser
   also implements speech recognition, the same agent takes spoken commands ("next",
   "back", "pause", "resume", "repeat", "stop"), disclosed with the same caveat
   voice.js states: Chrome's recognizer sends audio to Google to do it.

   Honesty rules carried in from voice.js: nothing is simulated. If the browser has
   no speechSynthesis the walkthrough still works but says so in the bar and steps
   on a visible timer instead of pretending to speak; if there is no recognizer the
   mic control does not render at all. All content comes from LXHome.VIEWS — the
   same help text Home and the guide already show — so this can never drift from
   the written guide. */
(function(){
'use strict';

function boot(){
  if(!window.LXHome || !window.LX || !window.LXVoice){ setTimeout(boot, 60); return; }
  var VIEWS = LXHome.VIEWS;
  var V = window.LXVoice;
  var $ = function(s, el){ return (el || document).querySelector(s); };
  function esc(s){ var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }

  var active = false, playing = false, at = 0, timer = null, micOn = false;
  var SILENT_STEP_MS = 9000; // no-speech fallback pace: long enough to read a card

  var style = document.createElement('style');
  style.textContent =
    '#lxwalk{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:4600;' +
      'display:flex;align-items:center;gap:8px;max-width:min(680px,calc(100vw - 24px));' +
      'background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:8px 12px;' +
      'box-shadow:var(--shadow,0 12px 34px rgba(0,0,0,.28))}\n' +
    '#lxwalk .lxwtext{font-size:12.5px;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}\n' +
    '#lxwalk .lxwno{font-size:11px;color:var(--muted);flex:none}\n' +
    '#lxwalk button{border:1px solid var(--line);background:var(--panel2);color:var(--ink2);' +
      'border-radius:999px;min-width:30px;height:30px;padding:0 9px;font-size:13px;cursor:pointer;flex:none}\n' +
    '#lxwalk button.primary{background:var(--accent);border-color:var(--accent);color:#fff}\n' +
    '#lxwalk button.on{background:var(--accent);border-color:var(--accent);color:#fff}\n' +
    '.lxwalk-hi{outline:2px solid var(--accent) !important;outline-offset:2px;border-radius:6px;' +
      'animation:lxwalkpulse 1.2s ease-in-out infinite}\n' +
    '@keyframes lxwalkpulse{0%,100%{outline-offset:2px}50%{outline-offset:5px}}\n' +
    '@media (max-width:640px){ #lxwalk .lxwtext{display:none} }';
  document.head.appendChild(style);

  function tabButton(viewId){
    return document.querySelector('nav.tabs button[data-view="' + viewId + '"]');
  }
  function clearHighlight(){
    var el = document.querySelector('.lxwalk-hi');
    if(el) el.classList.remove('lxwalk-hi');
  }
  function narration(v){
    return v[1] + ' section. ' + v[2] + '. ' + v[3] + ' Do this first: ' + v[4];
  }

  function bar(){
    var el = $('#lxwalk');
    if(el) return el;
    el = document.createElement('div');
    el.id = 'lxwalk';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Voice walkthrough controls');
    el.innerHTML =
      '<button type="button" id="lxwback" title="Previous section">&#9198;</button>' +
      '<button type="button" id="lxwplay" class="primary" title="Pause">&#9208;</button>' +
      '<button type="button" id="lxwnext" title="Next section">&#9197;</button>' +
      '<span class="lxwno" id="lxwno"></span>' +
      '<span class="lxwtext" id="lxwtext"></span>' +
      (V.canListen ? '<button type="button" id="lxwmic" title="Voice commands: next, back, pause, resume, repeat, stop. Uses the browser recognizer (Chrome sends audio to Google).">&#127908;</button>' : '') +
      '<button type="button" id="lxwstop" title="End the walkthrough">&times;</button>';
    document.body.appendChild(el);
    $('#lxwback', el).onclick = function(){ go(at - 1); };
    $('#lxwnext', el).onclick = function(){ go(at + 1); };
    $('#lxwplay', el).onclick = function(){ playing ? pause() : resume(); };
    $('#lxwstop', el).onclick = stop;
    var mic = $('#lxwmic', el);
    if(mic) mic.onclick = function(){ micOn ? micStop() : micStart(); };
    return el;
  }

  function paint(v){
    $('#lxwno').textContent = (at + 1) + ' / ' + VIEWS.length;
    $('#lxwtext').textContent = V.canSpeak ? (v[1] + ' · ' + v[2])
      : (v[2] + ' — voice is not supported in this browser, stepping silently');
    $('#lxwplay').innerHTML = playing ? '&#9208;' : '&#9205;';
    $('#lxwplay').title = playing ? 'Pause' : 'Resume';
  }

  function clearTimer(){ if(timer){ clearTimeout(timer); timer = null; } }

  function advance(){
    if(!active || !playing) return;
    if(at + 1 >= VIEWS.length){ stop(); return; }
    go(at + 1);
  }

  function go(i){
    if(!active) return;
    clearTimer(); V.stopSpeak();
    at = Math.max(0, Math.min(VIEWS.length - 1, i));
    var v = VIEWS[at];
    try{ window.LX.showView(v[0]); }catch(e){}
    clearHighlight();
    var tb = tabButton(v[0]);
    if(tb) tb.classList.add('lxwalk-hi');
    paint(v);
    if(!playing) return;
    if(V.canSpeak){
      var spoke = V.speak(narration(v), function(){ timer = setTimeout(advance, 700); });
      if(!spoke) timer = setTimeout(advance, SILENT_STEP_MS);
    }else{
      timer = setTimeout(advance, SILENT_STEP_MS);
    }
  }

  function pause(){ playing = false; clearTimer(); V.stopSpeak(); paint(VIEWS[at]); }
  function resume(){ if(!active) return; playing = true; go(at); }

  function stop(){
    active = false; playing = false; clearTimer(); V.stopSpeak(); micStop();
    clearHighlight();
    var el = $('#lxwalk'); if(el) el.remove();
  }

  /* one-shot recognizer, restarted after each result while the mic stays on */
  function micStart(){
    if(!V.canListen || micOn) return;
    micOn = true;
    var mic = $('#lxwmic'); if(mic) mic.classList.add('on');
    micLoop();
  }
  function micLoop(){
    if(!micOn || !active) return;
    var ok = V.listen(function(t){
      t = String(t || '').toLowerCase();
      if(/\b(stop|end|quit|close)\b/.test(t)) stop();
      else if(/\b(next|forward|skip)\b/.test(t)) go(at + 1);
      else if(/\b(back|previous)\b/.test(t)) go(at - 1);
      else if(/\b(pause|wait|hold)\b/.test(t)) pause();
      else if(/\b(resume|play|continue|go)\b/.test(t)) resume();
      else if(/\b(repeat|again)\b/.test(t)) go(at);
    }, function(){ if(micOn && active) setTimeout(micLoop, 250); });
    if(!ok) micStop();
  }
  function micStop(){
    micOn = false;
    var mic = $('#lxwmic'); if(mic) mic.classList.remove('on');
  }

  document.addEventListener('keydown', function(ev){
    if(active && ev.key === 'Escape') stop();
  });

  function start(fromIdx){
    if(active){ go(fromIdx == null ? at : fromIdx); return; }
    active = true; playing = true;
    bar();
    go(fromIdx == null ? 0 : fromIdx);
  }

  /* The header "User's guide" button: opens the guide panel where both the
     written tour and this walkthrough are one click away. Wired here rather
     than in assistant.js so a build without this module leaves a dead button
     nowhere — the button only exists in body.html, and without this module
     it opens the guide directly. */
  var gb = document.getElementById('guidebtn');
  if(gb) gb.addEventListener('click', function(){
    if(window.LXGuide) LXGuide.open();
  });

  window.LXWalkthrough = {start: start, stop: stop, isActive: function(){ return active; }};
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
