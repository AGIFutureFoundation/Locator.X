/* ===== LXLINK — the shareable view ========================================
   An edition is one file with no server behind it. That is the product, and it
   means there is no "share this search" endpoint to hit and no session anyone
   can hand to a colleague: two people looking at the same file had, until now,
   no way to look at the same THING in it except by describing it in an email.

   So the view goes in the URL fragment. The fragment is the one part of a URL
   that a browser never sends to a server, which is exactly why it is the right
   place for this: a shared link travels in the email, not through us, and the
   no-server / no-accounts / no-tracking property survives intact. Nothing here
   is logged anywhere, because there is nowhere for it to be logged.

   THE RULE THIS FILE EXISTS TO KEEP: a link that asks for something this
   edition does not have is REPORTED, never silently dropped. A colleague's
   link built in the New Orleans edition, opened in the Bay Area edition, must
   not quietly show the unfiltered catalogue as though that were what they
   sent — that is the same laundering the worksheet contract forbids
   (docs/INTEROP.md), one screen further out. Every key that could not be
   applied is named, in a message the reader sees, and left unapplied.

   Written last in the module order so window.LX exists; every entry point
   checks anyway, because a module that assumes its host is present is a module
   that fails silently when the order changes. */
(function(){
  'use strict';
  const TOKEN_NONE = 'none';          // the no-district bucket, spelled for a URL
  const KEYS = ['v','county','city','district','kind','src','q','min','max','chips','sort','sel'];

  function LXok(){ return !!(window.LX && window.LX.state && window.LX.state.filters); }
  function $(s){ return document.querySelector(s); }
  function activeView(){ const el = document.querySelector('.view.active'); return el ? el.id : ''; }

  /* The boot state is the baseline: a page nobody has touched carries no hash,
     so a plain URL stays plain and a link is only produced once there is
     something worth linking to. */
  let BOOT = null;
  function boot(){
    if(BOOT) return BOOT;
    BOOT = {view: activeView(), sort: LXok() ? window.LX.state.sort : 'cap'};
    return BOOT;
  }

  function encode(){
    if(!LXok()) return '';
    const S = window.LX.state, f = S.filters, out = [];
    const add = (k, v) => { if(v !== undefined && v !== null && v !== '') out.push(k + '=' + encodeURIComponent(v)); };
    const view = activeView();
    if(view && view !== boot().view) add('v', view);
    add('county', f.county); add('city', f.city);
    if(f.district) add('district', f.district === window.LX.NO_DISTRICT ? TOKEN_NONE : f.district);
    add('kind', f.kind); add('src', f.src); add('q', f.q);
    add('min', f.min); add('max', f.max);
    const chips = Object.keys(f.chips || {}).filter(k => f.chips[k]).sort();
    if(chips.length) add('chips', chips.join(','));
    if(S.sort && S.sort !== boot().sort) add('sort', S.sort);
    add('sel', S.sel);
    return out.join('&');
  }

  function href(){
    const h = encode();
    return location.origin + location.pathname + location.search + (h ? '#' + h : '');
  }

  /* replaceState, never pushState: a filter keystroke is not a navigation, and
     forty history entries for one search makes the back button useless. On
     file:// some browsers refuse replaceState entirely, so the fallback writes
     the hash directly — which is why _writing guards the listener below. */
  let _writing = false;
  let _restoring = false;
  function sync(){
    if(!LXok() || _restoring) return '';   // a restore writes once, at the end, not six times
    const h = encode();
    const want = h ? '#' + h : '';
    if(location.hash === want) return h;
    _writing = true;
    try{ history.replaceState(null, '', location.pathname + location.search + want); }
    catch(e){ try{ location.hash = want; }catch(e2){} }
    setTimeout(() => { _writing = false; }, 0);
    return h;
  }

  function parse(hash){
    const raw = String(hash || '').replace(/^#/, '');
    if(!raw) return null;
    const got = {};
    raw.split('&').forEach(part => {
      const i = part.indexOf('='); if(i < 0) return;
      const k = part.slice(0, i);
      if(KEYS.indexOf(k) < 0) return;              // unknown keys are reported, not guessed at
      try{ got[k] = decodeURIComponent(part.slice(i + 1)); }catch(e){ got[k] = part.slice(i + 1); }
    });
    const unknown = raw.split('&').map(p => p.split('=')[0])
      .filter(k => k && KEYS.indexOf(k) < 0);
    return {got: got, unknown: unknown};
  }

  /* Drive the real controls rather than writing state behind them: the field's
     own handler is what rebuilds the dependent city list, re-renders the rails
     and re-runs the filter, and a restore that skipped it would leave the UI
     showing one thing and the filter doing another. */
  function setField(id, value){
    const el = document.getElementById(id);
    if(!el) return 'no such control';
    if(el.tagName === 'SELECT' && value !== ''
       && ![].some.call(el.options, o => o.value === value)) return 'not in this edition';
    el.value = value;
    el.dispatchEvent(new Event('input', {bubbles: true}));
    return null;
  }

  function restore(hash){
    if(!LXok()) return null;
    const p = parse(hash === undefined ? location.hash : hash);
    if(!p) return null;
    _restoring = true;
    try{ return apply(p); } finally { _restoring = false; sync(); }
  }

  function apply(p){
    const got = p.got, ignored = [], applied = [];
    const skip = (k, v, why) => ignored.push({key: k, value: v, why: why});
    const ok = k => applied.push(k);

    // county first: it rebuilds the city list the next line needs
    ['county','city','kind','src'].forEach(k => {
      if(got[k] === undefined) return;
      const err = setField({county:'fcounty', city:'fcity', kind:'fkind', src:'fsrc'}[k], got[k]);
      err ? skip(k, got[k], err) : ok(k);
    });
    ['q','min','max'].forEach(k => {
      if(got[k] === undefined) return;
      const err = setField({q:'q', min:'fmin', max:'fmax'}[k], got[k]);
      err ? skip(k, got[k], err) : ok(k);
    });

    if(got.district !== undefined && window.LX.focusDistrict){
      const want = got.district === TOKEN_NONE ? window.LX.NO_DISTRICT : got.district;
      const has = want === window.LX.NO_DISTRICT
        ? window.LX.allListings().some(l => !window.LX.districtOf(l))
        : window.LX.allListings().some(l => window.LX.districtOf(l) === want);
      if(has){ window.LX.focusDistrict(want); ok('district'); }
      else skip('district', got.district, 'no record in this edition carries it');
    }

    if(got.chips !== undefined){
      const want = new Set(got.chips.split(',').filter(Boolean));
      let any = false;
      document.querySelectorAll('#chips .chip').forEach(c => {
        const on = c.getAttribute('aria-pressed') === 'true';
        if(want.has(c.dataset.f) !== on){ c.click(); }
        if(want.has(c.dataset.f)){ want.delete(c.dataset.f); any = true; }
      });
      if(any) ok('chips');
      want.forEach(k => skip('chips', k, 'no such filter chip here'));
    }

    if(got.sort !== undefined){
      const err = setField('sort', got.sort);
      if(err) skip('sort', got.sort, err);
      else { const s = document.getElementById('sort');
             s.dispatchEvent(new Event('change', {bubbles: true})); ok('sort'); }
    }

    /* The selection is the key most likely to travel between editions, and the
       one whose silent failure would be worst: the drawer simply would not
       open and the link would look like it worked. */
    if(got.sel !== undefined){
      const l = window.LX.allListings().find(x => x.id === got.sel);
      if(l){ window.LX.select(got.sel, !!window.__lxmap); ok('sel'); }
      else skip('sel', got.sel, 'this edition does not carry that record');
    }

    if(got.v !== undefined){
      const el = document.getElementById(got.v);
      if(el && el.classList.contains('view')){ window.LX.showView(got.v); ok('v'); }
      else skip('v', got.v, 'no such screen in this edition');
    }

    p.unknown.forEach(k => skip(k, '', 'not a key this version understands'));
    const report = {applied: applied, ignored: ignored};
    LXLINK.lastReport = report;
    if(ignored.length) announce(report);
    return report;
  }

  /* One sentence, naming what was dropped and what was kept. A reader who gets
     a link that half-worked has to be told which half. */
  function announce(report){
    const parts = report.ignored.map(x => x.key + (x.value ? ' "' + x.value + '"' : '') + ' — ' + x.why);
    const msg = 'This link asked for ' + parts.length + ' thing' + (parts.length > 1 ? 's' : '')
      + ' this edition cannot show: ' + parts.join('; ')
      + (report.applied.length ? '. The rest of the link was applied.' : '.');
    try{ window.LX.toast(msg); }catch(e){}
    try{ console.warn('LXLINK: ' + msg); }catch(e){}
  }

  async function copy(){
    const url = href();
    let okd = false;
    try{ await navigator.clipboard.writeText(url); okd = true; }catch(e){}
    if(!okd){
      /* Clipboard access is denied in a sandboxed frame and on some file://
         contexts. Selecting the text is not a fallback anyone enjoys, and it
         is honest: the reader can still copy, and is told why. */
      try{
        const ta = document.createElement('textarea');
        ta.value = url; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:8px;bottom:8px;width:min(520px,80vw);height:52px;z-index:99999';
        document.body.appendChild(ta); ta.select();
        okd = document.execCommand && document.execCommand('copy');
        setTimeout(() => ta.remove(), okd ? 0 : 9000);
      }catch(e){}
    }
    try{ window.LX.toast(okd ? 'Link to this view copied — the filters travel in it, nothing is sent anywhere'
                             : 'Copying was blocked here — the link is selected below, copy it by hand'); }catch(e){}
    return okd;
  }

  const LXLINK = {encode: encode, href: href, sync: sync, restore: restore, parse: parse,
                  copy: copy, lastReport: null};
  window.LXLINK = LXLINK;

  function start(){
    if(!LXok()) return;
    boot();
    const b = document.getElementById('explink');
    if(b) b.addEventListener('click', copy);
    /* A link that carries state means the sender had already entered the app;
       leaving the reader on the cover would hide what they were sent. */
    const p = parse(location.hash);
    if(p && Object.keys(p.got).length){
      const enter = document.getElementById('coverenter');
      if(enter) enter.click();
    }
    restore();
    window.addEventListener('hashchange', () => { if(!_writing) restore(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else setTimeout(start, 0);
})();
