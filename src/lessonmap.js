/* locator.x — lesson → map / twin / room program / AR chips.
   ----------------------------------------------------------------------------
   The Trade School's live modules name a real listing from the edition and write
   one sentence about it. This module puts up to four small buttons after that
   sentence so the learner can go and look at the record the lesson is using:

     Open on map             LX.select(id, true)          — the Map tab, flown to the record's point
     Massing in 3D           LX.showView('twin') + LXTwin.render() + LXTwin.openCatalog(id)
     Room program (derived)  LX.select(id, true), then scroll the drawer to LXRooms.drawer(l)'s block
     Massing in AR           LX.select(id, true), then scroll the drawer to LXAR.drawer(l)'s block

   Every chip is feature-detected at render time AND at click time against the
   entry points above — a chip is never drawn for a view this edition hides or a
   module this build did not ship, and a click that finds the view gone says so
   in one toast instead of failing silently.

   Honesty: the Twin and the AR block draw PROCEDURAL massing — footprint from
   recorded area ÷ storeys, height from storeys × a typical floor-to-floor — not
   the building (src/twin.js and src/ar.js both say so on their own pages). The
   room program is DERIVED from recorded counts and areas, not a walked plan
   (src/rooms.js). The chip labels say "massing" and "derived" themselves, and
   each title repeats it, so the button does not promise more than the view
   delivers. The only listing field this module reads is `id`; nothing from the
   record is displayed here.

   Loads under node with a stub window/document: nothing touches the DOM at top
   level. */
(function(){
'use strict';
var L = function(){ return window.LX; };

function toast(msg){ try{ var X = L(); if(X && typeof X.toast === 'function') X.toast(msg); }catch(e){} }

/* the view is in this edition: its section exists and its tab is not hidden by
   the edition's hide_tabs CSS (build_state._hide_css sets display:none on both) */
function viewOpen(id){
  try{
    var sec = document.getElementById(id);
    if(!sec || !sec.classList || !sec.classList.contains('view')) return false;
    var btn = document.querySelector('nav.tabs button[data-view="' + id + '"]');
    if(btn && typeof getComputedStyle === 'function' && getComputedStyle(btn).display === 'none') return false;
    return true;
  }catch(e){ return false; }
}

/* the listing as the edition holds it now — a lesson may outlive an import */
function loaded(l){
  try{ var X = L(); if(!X || !l || !X.allListings) return null; return X.allListings().find(function(x){ return x.id === l.id; }) || null; }catch(e){ return null; }
}

/* scroll the open map drawer to the section whose eyebrow starts with `label` */
function scrollDrawerTo(label, tries){
  var left = tries == null ? 12 : tries;
  try{
    var dr = document.getElementById('drawer');
    var ey = dr ? Array.prototype.slice.call(dr.querySelectorAll('.sect .eyebrow')) : [];
    var hit = ey.filter(function(e){ return (e.textContent || '').trim().indexOf(label) === 0; })[0];
    if(hit){ var sect = hit.closest ? hit.closest('.sect') : hit.parentNode; (sect || hit).scrollIntoView({behavior:'smooth', block:'start'}); return; }
  }catch(e){}
  if(left > 0) setTimeout(function(){ scrollDrawerTo(label, left - 1); }, 150);
  else toast('That block did not render in the drawer for this record');
}

/* ---- the four chips: {label, title, can(l), go(l)} ----------------------- */
var CHIPS = [
  {label:'Open on map',
   title:'Opens the Map tab and flies to this record’s recorded point.',
   can:function(){ var X = L(); return !!(X && typeof X.select === 'function' && viewOpen('mapview')); },
   go:function(l){ L().select(l.id, true); }},

  {label:'Massing in 3D',
   title:'Opens the Twin tab on this site: a procedural massing block (recorded area ÷ storeys), not the building’s surveyed shape.',
   can:function(){ var X = L(), T = window.LXTwin; return !!(X && typeof X.showView === 'function' && T && typeof T.render === 'function' && typeof T.openCatalog === 'function' && viewOpen('twin')); },
   go:function(l){
     var X = L(), T = window.LXTwin;
     X.showView('twin');
     setTimeout(function(){
       try{ T.render(); }catch(e){}
       var left = 40;
       (function wait(){
         try{
           var fb = document.getElementById('twinfallback');
           if(fb && !fb.hidden){ toast('The 3D twin needs WebGL, which this device is not running; the record is still on the Map tab'); return; }
           if(T.map){ try{ T.openCatalog(l.id); }catch(e){ toast('The twin opened but could not focus this site'); } return; }
         }catch(e){ toast('The twin did not open here; the record is still on the Map tab'); return; }
         if(--left > 0) setTimeout(wait, 150); else toast('The 3D twin did not finish loading here');
       })();
     }, 60);
   }},

  {label:'Room program (derived)',
   title:'Opens this record’s drawer at its room program, derived from recorded counts and areas, not a walked floor plan.',
   can:function(){ var X = L(), R = window.LXRooms; return !!(X && typeof X.select === 'function' && R && typeof R.drawer === 'function' && viewOpen('mapview')); },
   go:function(l){ L().select(l.id, true); setTimeout(function(){ scrollDrawerTo('Rooms and construction'); }, 200); }},

  {label:'Massing in AR',
   title:'Opens this record’s drawer at the AR block: a schematic massing box from recorded area and storeys, not a scan of the building.',
   can:function(l){
     var X = L(), A = window.LXAR;
     if(!(X && typeof X.select === 'function' && A && typeof A.drawer === 'function' && typeof A.boxFor === 'function' && viewOpen('mapview'))) return false;
     try{ return !!A.boxFor(l); }catch(e){ return false; }   /* land, or no massing: nothing to stand up */
   },
   go:function(l){ L().select(l.id, true); setTimeout(function(){ scrollDrawerTo('Massing in your space'); }, 200); }}
];

function onClick(c, l){
  return function(ev){
    try{ if(ev && ev.preventDefault) ev.preventDefault(); }catch(e){}
    try{
      if(!c.can(l)){ toast(c.label + ' is not available in this edition'); return; }
      var cur = loaded(l);
      if(!cur){ toast('That listing is no longer loaded'); return; }
      c.go(cur);
    }catch(e){ toast(c.label + ' is not available in this edition'); }
  };
}

/* chips(listing) -> HTMLElement (a <span> row) when a DOM exists, else '' */
function chips(l){
  if(!l || typeof document === 'undefined' || typeof document.createElement !== 'function') return '';
  try{
    var row = document.createElement('span');
    row.className = 'lx-lessonmap-row';
    row.style.cssText = 'display:inline-flex;gap:4px;flex-wrap:wrap;vertical-align:middle;margin-left:6px';
    var n = 0;
    CHIPS.forEach(function(c){
      var ok = false;
      try{ ok = !!c.can(l); }catch(e){ ok = false; }
      if(!ok) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.style.cssText = 'font-size:12px;padding:2px 8px;line-height:1.4';
      b.textContent = c.label;
      b.title = c.title;
      b.setAttribute('aria-label', c.label + '. ' + c.title);
      b.addEventListener('click', onClick(c, l));
      row.appendChild(b); n++;
    });
    return n ? row : '';
  }catch(e){ return ''; }
}

/* attach(root, listing): fill every .lx-lessonmap inside root */
function attach(root, l){
  if(!root || !l || typeof root.querySelectorAll !== 'function') return 0;
  var hosts = Array.prototype.slice.call(root.querySelectorAll('.lx-lessonmap')), n = 0;
  hosts.forEach(function(h){
    try{
      while(h.firstChild) h.removeChild(h.firstChild);
      var row = chips(l);
      if(row && typeof row !== 'string'){ h.appendChild(row); n++; }
    }catch(e){}
  });
  return n;
}

window.LXLessonMap = {chips: chips, attach: attach, CHIPS: CHIPS};
})();
