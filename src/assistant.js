/* locator.x — the app-wide guide: a persistent floating assistant that follows the user
   into every section, not just the Home tab.

   Home's own "Guided tour" and "Ask a question" panels (home.js) already do this well
   when the user is sitting on Home. This module puts the same two tools — a step-by-step
   walk through every section, and a live search over the same help text — one click away
   from anywhere else in the app, so a user three tabs deep in Underwriting or Predictions
   never has to navigate back to Home to get unstuck. It is a thin second surface over
   home.js's own data (window.LXHome.VIEWS, .search) and voice.js's speak/listen — no new
   help content is invented here, and if home.js hasn't registered yet this renders nothing
   rather than guessing at content that doesn't exist. */
(function(){
'use strict';

function boot(){
  if(!window.LXHome || !window.LX){ setTimeout(boot, 60); return; }
  const VIEWS = LXHome.VIEWS;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  function esc(s){ const d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }

  let open = false, tab = 'tour', at = -1;

  function currentViewId(){
    const b = document.querySelector('nav.tabs button[aria-selected="true"]');
    return b ? b.dataset.view : null;
  }

  const wrap = document.createElement('div');
  wrap.id = 'lxguide';
  wrap.innerHTML =
    '<button id="lxgfab" type="button" aria-label="Open the app guide" ' +
      'title="Guide — a step-by-step tour and question search, from anywhere in the app">?</button>' +
    '<div id="lxgpanel" hidden role="dialog" aria-label="App guide">' +
      '<div class="lxghead">' +
        '<div class="lxgtabs">' +
          '<button type="button" data-t="tour" class="on">Tour this section</button>' +
          '<button type="button" data-t="ask">Ask a question</button>' +
        '</div>' +
        '<button type="button" id="lxgclose" aria-label="Close the guide">&times;</button>' +
      '</div>' +
      '<div id="lxgbody"></div>' +
    '</div>';
  document.body.appendChild(wrap);

  const style = document.createElement('style');
  style.textContent =
    '#lxgfab{position:fixed;left:18px;bottom:18px;z-index:4500;width:46px;height:46px;border-radius:50%;' +
      'background:var(--accent);color:#fff;border:none;font:700 19px/1 var(--sans,system-ui);cursor:pointer;' +
      'box-shadow:var(--shadow,0 6px 20px rgba(0,0,0,.25));display:flex;align-items:center;justify-content:center}\n' +
    '#lxgfab:hover{filter:brightness(1.08)}\n' +
    '#lxgpanel{position:fixed;left:18px;bottom:74px;z-index:4500;width:min(380px,calc(100vw - 36px));' +
      'max-height:min(560px,calc(100vh - 110px));display:flex;flex-direction:column;' +
      'background:var(--panel);border:1px solid var(--line);border-radius:var(--r-lg,14px);' +
      'box-shadow:var(--shadow,0 12px 34px rgba(0,0,0,.28));overflow:hidden}\n' +
    '.lxghead{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding:8px 6px 8px 12px;flex:none}\n' +
    '.lxgtabs{display:flex;gap:4px}\n' +
    '.lxgtabs button{border:1px solid var(--line);background:var(--panel2);color:var(--ink2);border-radius:999px;padding:5px 10px;font-size:11.5px;cursor:pointer}\n' +
    '.lxgtabs button.on{background:var(--accent);border-color:var(--accent);color:#fff}\n' +
    '#lxgclose{border:none;background:transparent;color:var(--muted);font-size:19px;line-height:1;cursor:pointer;padding:2px 8px}\n' +
    '#lxgbody{padding:12px;overflow:auto}\n' +
    '#lxgbody .lxgq{font-size:12.5px;color:var(--muted);margin:0 0 8px}\n' +
    '#lxgbody input[type=search]{width:100%;box-sizing:border-box;margin-bottom:8px}\n' +
    '#lxgbody .homehit{border-top:1px solid var(--line);padding:8px 0}\n' +
    '#lxgbody .homehit:first-child{border-top:none}\n' +
    '#lxgnav{display:flex;justify-content:space-between;gap:6px;margin-top:10px;flex-wrap:wrap}\n' +
    '@media (max-width:640px){ #lxgfab,#lxgpanel{left:10px} #lxgpanel{bottom:66px} }';
  document.head.appendChild(style);

  function renderTour(){
    const b = $('#lxgbody');
    const cv = currentViewId();
    const idx = VIEWS.findIndex(v => v[0] === cv);
    if(idx >= 0) at = idx; else if(at < 0) at = 0;
    const v = VIEWS[at];
    if(!v){ b.innerHTML = '<p class="lxgq">No section is open yet.</p>'; return; }
    b.innerHTML =
      '<div style="font-size:11px;color:var(--muted);letter-spacing:.04em;text-transform:uppercase">' + esc(v[1]) + ' &middot; ' + (at + 1) + ' of ' + VIEWS.length + '</div>' +
      '<h4 style="margin:4px 0 4px">' + esc(v[2]) + '</h4>' +
      '<p style="font-size:13px;color:var(--ink2);margin:0 0 6px">' + esc(v[3]) + '</p>' +
      '<p style="font-size:12.5px;color:var(--muted);margin:0"><b>Do this first.</b> ' + esc(v[4]) + '</p>' +
      (window.LXVoice ? LXVoice.speakButton('lxg-tour-' + at) : '') +
      '<div id="lxgnav">' +
        '<button class="btn" id="lxgprev"' + (at <= 0 ? ' disabled' : '') + '>&larr; Back</button>' +
        '<button class="btn primary" id="lxgopen">Open ' + esc(v[2]) + '</button>' +
        '<button class="btn" id="lxgnext"' + (at >= VIEWS.length - 1 ? ' disabled' : '') + '>Next &rarr;</button>' +
      '</div>';
    const p = $('#lxgprev'); if(p) p.onclick = () => { at = Math.max(0, at - 1); renderTour(); };
    const n = $('#lxgnext'); if(n) n.onclick = () => { at = Math.min(VIEWS.length - 1, at + 1); renderTour(); };
    const o = $('#lxgopen'); if(o) o.onclick = () => { try{ window.LX.showView(v[0]); }catch(e){} };
    if(window.LXVoice) LXVoice.wireSpeakButtons(b, function(id){
      const i = +id.split('-').pop(); const vv = VIEWS[i];
      return vv ? (vv[2] + '. ' + vv[3] + '. Do this first: ' + vv[4]) : '';
    });
  }

  function runSearch(qq){
    const box = $('#lxgans'); if(!box) return;
    qq = String(qq || '').trim();
    if(qq.length < 2){ box.innerHTML = ''; return; }
    const hits = LXHome.search(qq);
    if(!hits.length){
      box.innerHTML = '<p class="lxgq">Nothing in the help matches that. Try the Data sources or Governance sections.</p>';
      return;
    }
    box.innerHTML = hits.slice(0, 6).map(function(h, i){
      if(h.view){
        return '<div class="homehit"><div class="hq">' + esc(h.view[2]) + ' &middot; ' + esc(h.view[1]) + '</div>' +
          '<p>' + esc(h.view[3]) + '</p><button class="btn" data-go="' + esc(h.view[0]) + '">Open ' + esc(h.view[2]) + '</button></div>';
      }
      const e = h.e, sid = 'lxgqa-' + i;
      return '<div class="homehit" data-sid="' + sid + '"><div class="hq">' + esc(e.q) + '</div><p>' + esc(e.a) + '</p>' +
        (e.v ? '<button class="btn" data-go="' + esc(e.v) + '">Open</button> ' : '') +
        (window.LXVoice ? LXVoice.speakButton(sid) : '') + '</div>';
    }).join('');
    $$('#lxgans [data-go]').forEach(x => x.addEventListener('click', () => { try{ window.LX.showView(x.dataset.go); }catch(e){} }));
    if(window.LXVoice) LXVoice.wireSpeakButtons(box, function(id){
      const row = box.querySelector('[data-sid="' + id + '"]'); if(!row) return '';
      const hq = row.querySelector('.hq'), p = row.querySelector('p');
      return (hq ? hq.textContent : '') + '. ' + (p ? p.textContent : '');
    });
  }

  function renderAsk(){
    const b = $('#lxgbody');
    b.innerHTML =
      '<p class="lxgq">Type it the way you would say it — this searches the same help text as the Home tab, from wherever you are.</p>' +
      '<div style="display:flex;gap:6px;align-items:center">' +
        '<input type="search" id="lxgq" placeholder="e.g. what does the score mean, how is rent estimated" autocomplete="off" style="flex:1">' +
        (window.LXVoice && window.LXVoice.canListen ? '<button type="button" class="btn" id="lxgmic" title="Ask by voice">&#127908;</button>' : '') +
      '</div>' +
      '<div id="lxgans"></div>';
    const q = $('#lxgq'); if(q) q.addEventListener('input', () => runSearch(q.value));
    const mic = $('#lxgmic');
    if(mic && window.LXVoice) mic.onclick = () => {
      if(LXVoice.isListening()) return;
      mic.textContent = '\u{1F3A4}…';
      LXVoice.listen(function(t){ if(q){ q.value = t; runSearch(t); } }, function(){ mic.textContent = '\u{1F3A4}'; });
    };
  }

  function render(){ tab === 'tour' ? renderTour() : renderAsk(); }

  $('#lxgfab').addEventListener('click', () => {
    open = !open;
    $('#lxgpanel').hidden = !open;
    if(open) render();
  });
  $('#lxgclose').addEventListener('click', () => { open = false; $('#lxgpanel').hidden = true; });
  $$('.lxgtabs button', wrap).forEach(b => b.addEventListener('click', () => {
    tab = b.dataset.t;
    $$('.lxgtabs button', wrap).forEach(x => x.classList.toggle('on', x === b));
    render();
  }));

  /* Keep the tour panel following the user's actual navigation rather than going stale —
     watch the nav tabs' aria-selected attribute rather than touching app.js's showView(). */
  const navEl = document.querySelector('nav.tabs');
  if(navEl && window.MutationObserver){
    new MutationObserver(function(){ if(open && tab === 'tour') renderTour(); })
      .observe(navEl, {attributes: true, attributeFilter: ['aria-selected'], subtree: true});
  }

  window.LXGuide = {
    open: function(){ open = true; $('#lxgpanel').hidden = false; render(); },
    close: function(){ open = false; $('#lxgpanel').hidden = true; }
  };
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
