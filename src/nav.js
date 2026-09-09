/* locator.x - grouped navigation.
   ----------------------------------------------------------------------------
   Twenty-eight flat tabs is not a menu, it is a wall. They are now six sections,
   and the section bar shows only the views inside the section you are in.

   Two rules this had to respect, because breaking either would have been worse
   than the wall:

   1. EVERY BUTTON STAYS IN THE DOM. Nothing is created or destroyed here; the
      inactive ones are hidden with CSS. Every existing LX.showView(id) call,
      every deep link, every keyboard path and every test that queries
      nav.tabs button keeps working exactly as before, and a view can be opened
      from anywhere without knowing which section owns it.

   2. THE GROUP FOLLOWS THE VIEW, NOT THE OTHER WAY ROUND. If code elsewhere in
      the app opens a view - the map linking to the underwriting sheet, a drill
      jumping to Comps - the section bar moves to that view's section by itself.
      A navigation that can show you a page while claiming you are somewhere
      else is worse than no grouping at all.

   On a narrow screen the two rows collapse into one sheet: a flat list of every
   view under its section heading. That is faster with a thumb than two rows of
   horizontal scrolling, and it reads in the same order to a screen reader. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var $$ = function(s, el){ return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

function tabs(){ return $$('nav.tabs button[data-view]'); }
function groups(){ return $$('.groupbar button[data-gsel]'); }
function groupOf(view){
  var b = $('nav.tabs button[data-view="' + view + '"]');
  return b ? b.dataset.group : null;
}

var current = null;

function showGroup(gid, opts){
  if(!gid) return;
  current = gid;
  groups().forEach(function(g){ g.setAttribute('aria-selected', String(g.dataset.gsel === gid)); });
  tabs().forEach(function(t){ t.classList.toggle('ingroup', t.dataset.group === gid); });
  /* keep the active view's button in sight when the row scrolls */
  var act = $('nav.tabs button.ingroup[aria-selected="true"]');
  if(act && act.scrollIntoView) try{ act.scrollIntoView({block:'nearest', inline:'nearest'}); }catch(e){}
  if(opts && opts.open){
    /* opening a section from the bar shows its first view, so a tap always
       lands somewhere rather than leaving an empty row */
    var first = $('nav.tabs button.ingroup');
    if(first && window.LX) LX.showView(first.dataset.view);
  }
}

/* called by app.js on every view change, so the section can never disagree
   with what is on screen */
function sync(view){
  var g = groupOf(view);
  if(g && g !== current) showGroup(g);
  else if(g){
    var act = $('nav.tabs button.ingroup[aria-selected="true"]');
    if(act && act.scrollIntoView) try{ act.scrollIntoView({block:'nearest', inline:'nearest'}); }catch(e){}
  }
  closeSheet();
}

/* The sheet is BUILT, not revealed.

   The first attempt showed the two existing rows as two fixed overlays, which
   stacked on top of each other: the section headings landed across the view
   names instead of above them. Two separately positioned lists cannot interleave.
   So the sheet is generated as one flow - heading, its views, next heading - and
   each row delegates to the real button, which stays the single source of truth
   for what is selected. Nothing is cloned and nothing is moved. */
function buildSheet(){
  var old = $('#navsheet'); if(old) old.remove();
  var sheet = document.createElement('div');
  sheet.id = 'navsheet';
  sheet.setAttribute('role', 'navigation');
  sheet.setAttribute('aria-label', 'All views');
  var active = $('nav.tabs button[aria-selected="true"]');
  groups().forEach(function(g){
    var gid = g.dataset.gsel;
    var mine = tabs().filter(function(t){ return t.dataset.group === gid; });
    if(!mine.length) return;
    var h = document.createElement('p');
    h.className = 'navsheet-h';
    h.textContent = g.textContent;
    sheet.appendChild(h);
    mine.forEach(function(t){
      var b = document.createElement('button');
      b.className = 'navsheet-b';
      b.textContent = t.textContent;
      b.dataset.go = t.dataset.view;
      if(active && t === active) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', function(){
        closeSheet();
        if(window.LX) LX.showView(t.dataset.view);
      });
      sheet.appendChild(b);
    });
  });
  document.body.appendChild(sheet);
  return sheet;
}
function openSheet(){ var a = $('#app'); if(!a) return;
  buildSheet();
  a.classList.add('navopen');
  var t = $('#navtoggle'); if(t) t.setAttribute('aria-expanded','true');
  var first = $('#navsheet .navsheet-b[aria-current], #navsheet .navsheet-b');
  if(first) try{ first.focus({preventScroll:true}); }catch(e){}
}
function closeSheet(){ var a = $('#app'); if(!a || !a.classList.contains('navopen')) return;
  a.classList.remove('navopen');
  var t = $('#navtoggle'); if(t) t.setAttribute('aria-expanded','false');
  var s2 = $('#navsheet'); if(s2) s2.remove();
  showGroup(current);
}

function init(){
  if(!$('.groupbar')) return;
  groups().forEach(function(g){
    g.addEventListener('click', function(){ showGroup(g.dataset.gsel, {open:true}); });
  });
  var t = $('#navtoggle');
  if(t) t.addEventListener('click', function(){
    $('#app').classList.contains('navopen') ? closeSheet() : openSheet();
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeSheet(); });
  /* start on whichever view is already selected */
  var sel = $('nav.tabs button[aria-selected="true"]');
  showGroup(sel ? sel.dataset.group : 'find');
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

window.LXNav = {sync: sync, showGroup: showGroup, groupOf: groupOf, close: closeSheet};
})();
