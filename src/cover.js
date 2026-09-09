/* locator.x — title page / cover screen.
   Purely presentational: shows once per browser tab session (sessionStorage,
   never localStorage, so a fresh tab always sees the title page again), then
   gets out of the way. Nothing here touches app state or boot order — the
   element is inert markup already in body.html by the time this runs. */
(function(){
'use strict';
function mount(){
  var el=document.getElementById('coverpage'); if(!el) return;
  try{
    var n=(window.BA && window.BA.listings && window.BA.listings.length) || 0;
    var st=document.getElementById('coverstat');
    if(st && n) st.textContent = n.toLocaleString()+' real records in this edition, every one sourced and linked';
  }catch(e){}
  var dismiss=function(){
    if(el.hidden) return;
    el.classList.add('leaving');
    setTimeout(function(){ el.hidden=true; el.classList.remove('leaving'); }, 380);
    try{ sessionStorage.setItem('lx.seenCover','1'); }catch(e){}
  };
  var reopen=function(){ el.hidden=false; el.classList.remove('leaving'); };
  var btn=document.getElementById('coverenter'); if(btn) btn.addEventListener('click', dismiss);
  el.addEventListener('click', function(e){ if(e.target===el || e.target.classList.contains('coverbg')) dismiss(); });
  document.addEventListener('keydown', function(e){ if(!el.hidden && (e.key==='Enter'||e.key==='Escape')) dismiss(); });
  var seen=false; try{ seen = sessionStorage.getItem('lx.seenCover')==='1'; }catch(e){}
  if(seen) el.hidden=true;
  var brand=document.querySelector('header .brand');
  if(brand){ brand.title='About Locator.X'; brand.addEventListener('click', reopen); }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
