/* locator.x - boundary hardening.
   ----------------------------------------------------------------------------
   This app renders public-record strings and USER-SUPPLIED IMPORTS into HTML. The
   county feeds are cleaned when the edition is built, so the untrusted surface at
   runtime is the import path: a pasted payload, a dropped CSV, or a live API the
   operator points at. Anything arriving that way is stripped of markup and control
   characters before it can become a record, so a hostile file cannot put script
   into the page regardless of which of the app's render sites touches it.

   This is defence in depth, not a substitute for escaping at the render site. Both
   are in place: escaping where the string is written, and a choke point here so a
   missed escape somewhere cannot become an injection. */
(function(){
'use strict';
/* C0 and C1 control characters, plus the characters that open a tag or close an
   attribute value. Replaced rather than deleted so an address stays readable. */
var CTRL = /[\u0000-\u001F\u007F-\u009F]/g;
var QUOTE = /["'`]/g;
function clean(v){
  if(typeof v !== 'string') return v;
  return v.replace(CTRL, ' ')
          .replace(/</g, '‹').replace(/>/g, '›')
          .replace(QUOTE, '’')
          .slice(0, 600);
}
function harden(o){
  if(!o || typeof o !== 'object') return o;
  for(var k in o){
    if(!Object.prototype.hasOwnProperty.call(o, k)) continue;
    var v = o[k];
    if(typeof v === 'string') o[k] = clean(v);
    else if(Array.isArray(v)){ for(var i=0;i<v.length;i++) if(typeof v[i]==='string') v[i]=clean(v[i]); }
    else if(v && typeof v === 'object') harden(v);
  }
  return o;
}
function hardenAll(rows){
  if(!rows) return rows;
  for(var i=0;i<rows.length;i++) harden(rows[i]);
  return rows;
}

/* A URL destined for an href must use a scheme we can vouch for. javascript:, data:
   and vbscript: are refused outright rather than sanitised, because a partial fix on
   a URL scheme is worse than no fix at all. */
function safeUrl(u){
  var s = String(u || '').trim();
  if(!/^https?:\/\//i.test(s)) return null;
  if(/[\u0000-\u001F\u007F-\u009F <>"'`]/.test(s)) return null;
  return s;
}

/* What the page does and does not do, for a reviewer who deserves an answer rather
   than a guess. Nothing here is self-enforcing; the host content policy enforces. */
var POSTURE = {
  eval:false, newFunction:false, documentWrite:false, srcdoc:false, inlineHandlers:false,
  storage:['localStorage'],
  network:'Map tiles and web fonts only. Every public-record source in the Record Locker is a LINK the operator clicks, never fetched, scraped or cached by the page.',
  pii:'No owner names, no taxpayer names, no mailing addresses, no contact details, no demographic data.'
};
window.LXSec = {clean:clean, harden:harden, hardenAll:hardenAll, safeUrl:safeUrl, POSTURE:POSTURE};
})();
