/* locator.x — panel window manager.
   Every major box on screen gets chrome: collapse/expand, pop out into a draggable,
   resizable floating window, dock back, and close. A taskbar tracks anything hidden or
   floating so nothing is ever lost. Layout persists per browser. */
(function(){
'use strict';
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const KEY='lxpanels';
let S={}; try{ S=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ S={}; }
const save=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} };
let zTop=4000;
const reg={};           // id -> {wrap, panel, ph, title, view}

function titleOf(el){
  const t=el.getAttribute('data-panel-title');
  if(t) return t;
  const h=el.querySelector('h2,h3,.eyebrow,h4');
  let s=h? h.textContent.trim() : '';
  if(!s){ const th=el.querySelector('thead th'); s=th? 'Table — '+th.textContent.trim() : 'Panel'; }
  return s.replace(/\s+/g,' ').slice(0,52);
}
function idOf(el, view, i){
  if(el.id) return el.id;
  if(el.getAttribute('data-panel-id')) return el.getAttribute('data-panel-id');
  const t=titleOf(el).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,34);
  return view+':'+t+':'+i;
}
function eligible(el){
  if(el.closest('.lxwrap')) return false;                 // already wrapped
  if(el.querySelector('#map, .maplibregl-map, canvas.cm')) return false;  // never wrap the live map
  if(el.closest('#map')) return false;
  if(el.offsetParent===null && !el.closest('.view.active')) return false;
  return true;
}

function chrome(id, title){
  const d=document.createElement('div');
  d.className='lxbar';
  d.innerHTML='<button class="lxb lxcol" title="Collapse / expand (double-click header)" aria-label="Collapse">▾</button>'
    +'<span class="lxt">'+title.replace(/[<>&]/g,'')+'</span>'
    +'<span class="lxsp"></span>'
    +'<button class="lxb lxfloat" title="Pop out into a movable window">⤢</button>'
    +'<button class="lxb lxdock" title="Dock back into the page" hidden>⤡</button>'
    +'<button class="lxb lxclose" title="Hide — reopen from the tray">×</button>';
  return d;
}

function wrapOne(el, view, i){
  if(!eligible(el)) return;
  const id=idOf(el, view, i);
  if(reg[id] && document.contains(reg[id].wrap)) return;
  const wrap=document.createElement('div');
  wrap.className='lxwrap';
  wrap.dataset.pid=id;
  el.parentNode.insertBefore(wrap, el);
  const ph=document.createElement('div'); ph.className='lxph'; ph.dataset.pid=id; ph.hidden=true;
  wrap.parentNode.insertBefore(ph, wrap);
  const bar=chrome(id, titleOf(el));
  wrap.appendChild(bar); wrap.appendChild(el);
  reg[id]={wrap, panel:el, ph, title:titleOf(el), view};
  bar.querySelector('.lxcol').addEventListener('click', ()=>toggleCollapse(id));
  bar.querySelector('.lxfloat').addEventListener('click', ()=>float(id));
  bar.querySelector('.lxdock').addEventListener('click', ()=>dock(id));
  bar.querySelector('.lxclose').addEventListener('click', ()=>hide(id));
  bar.addEventListener('dblclick', e=>{ if(e.target.closest('.lxb')) return; toggleCollapse(id); });
  bar.addEventListener('pointerdown', e=>startDrag(e, id));
  const st=S[id];
  if(st){ if(st.f) float(id, st.f, true); if(st.c) toggleCollapse(id, true); if(st.h) hide(id, true); }
  return id;
}

function toggleCollapse(id, force){
  const r=reg[id]; if(!r) return;
  const on = force!=null? force : !r.wrap.classList.contains('lxcollapsed');
  r.wrap.classList.toggle('lxcollapsed', on);
  const b=r.wrap.querySelector('.lxcol'); if(b) b.textContent = on? '▸' : '▾';
  S[id]=Object.assign({}, S[id], {c:on||undefined}); if(!on&&S[id]) delete S[id].c;
  save(); tray();
}
function float(id, pos, silent){
  const r=reg[id]; if(!r || r.wrap.classList.contains('lxfloating')) return;
  const rect=r.wrap.getBoundingClientRect();
  r.ph.hidden=false; r.ph.style.height=Math.min(rect.height,120)+'px';
  r.ph.innerHTML='<span>'+r.title.replace(/[<>&]/g,'')+' — floating</span><button class="lxb">dock back</button>';
  r.ph.querySelector('button').onclick=()=>dock(id);
  document.body.appendChild(r.wrap);
  r.wrap.classList.add('lxfloating');
  const w=pos&&pos.w? pos.w : Math.min(Math.max(rect.width, 420), 880, window.innerWidth-60);
  const h=pos&&pos.h? pos.h : Math.min(Math.max(rect.height+34, 260), window.innerHeight-90);
  const x=pos&&pos.x!=null? Math.min(pos.x, window.innerWidth-160) : Math.min(rect.left, window.innerWidth-w-24);
  const y=pos&&pos.y!=null? Math.min(pos.y, window.innerHeight-80) : 84;
  Object.assign(r.wrap.style, {left:Math.max(4,x)+'px', top:Math.max(4,y)+'px', width:w+'px', height:h+'px', zIndex:++zTop});
  r.wrap.querySelector('.lxfloat').hidden=true; r.wrap.querySelector('.lxdock').hidden=false;
  if(!r.wrap.querySelector('.lxgrip')){ const g=document.createElement('div'); g.className='lxgrip'; g.title='Drag to resize'; r.wrap.appendChild(g); g.addEventListener('pointerdown', e=>startResize(e,id)); }
  r.wrap.addEventListener('pointerdown', ()=>{ r.wrap.style.zIndex=++zTop; });
  S[id]=Object.assign({}, S[id], {f:{x:Math.max(4,x), y:Math.max(4,y), w, h}});
  save(); if(!silent) tray(); else tray();
  try{ if(window.LX && LX.state && LX.state.lens) {} }catch(e){}
}
function dock(id){
  const r=reg[id]; if(!r) return;
  if(!document.contains(r.ph)){ // its section re-rendered underneath — drop the stale copy
    r.wrap.remove(); delete reg[id]; if(S[id]) delete S[id].f; save(); tray();
    const v=(document.querySelector('.view.active')||{}).id; if(v) scan(v);
    return; }
  r.ph.parentNode.insertBefore(r.wrap, r.ph);
  r.wrap.classList.remove('lxfloating');
  r.wrap.style.cssText='';
  r.ph.hidden=true; r.ph.innerHTML='';
  r.wrap.querySelector('.lxfloat').hidden=false; r.wrap.querySelector('.lxdock').hidden=true;
  if(S[id]) delete S[id].f;
  save(); tray();
}
function hide(id, silent){
  const r=reg[id]; if(!r) return;
  if(r.wrap.classList.contains('lxfloating')) dock(id);
  r.wrap.classList.add('lxhidden');
  S[id]=Object.assign({}, S[id], {h:true}); save(); tray();
  if(!silent && window.LX && LX.toast) LX.toast('Hidden — reopen it from the panel tray (bottom-right)');
}
function show(id){
  const r=reg[id]; if(!r) return;
  r.wrap.classList.remove('lxhidden');
  if(S[id]) delete S[id].h; save(); tray();
  r.wrap.scrollIntoView({behavior:'smooth', block:'center'});
}

/* ---------- drag & resize ---------- */
let drag=null;
function startDrag(e, id){
  const r=reg[id]; if(!r || !r.wrap.classList.contains('lxfloating')) return;
  if(e.target.closest('.lxb')) return;
  const b=r.wrap.getBoundingClientRect();
  drag={id, dx:e.clientX-b.left, dy:e.clientY-b.top};
  r.wrap.style.zIndex=++zTop;
  r.wrap.setPointerCapture&&r.wrap.setPointerCapture(e.pointerId);
  e.preventDefault();
}
let rez=null;
function startResize(e, id){
  const r=reg[id]; const b=r.wrap.getBoundingClientRect();
  rez={id, x:e.clientX, y:e.clientY, w:b.width, h:b.height};
  e.preventDefault(); e.stopPropagation();
}
document.addEventListener('pointermove', e=>{
  if(drag){ const r=reg[drag.id]; if(!r) return;
    const x=Math.max(2, Math.min(e.clientX-drag.dx, window.innerWidth-120));
    const y=Math.max(2, Math.min(e.clientY-drag.dy, window.innerHeight-40));
    r.wrap.style.left=x+'px'; r.wrap.style.top=y+'px'; }
  if(rez){ const r=reg[rez.id]; if(!r) return;
    const w=Math.max(300, rez.w+(e.clientX-rez.x)), h=Math.max(160, rez.h+(e.clientY-rez.y));
    r.wrap.style.width=w+'px'; r.wrap.style.height=h+'px'; }
});
document.addEventListener('pointerup', ()=>{
  if(drag){ const r=reg[drag.id]; const b=r&&r.wrap.getBoundingClientRect();
    if(b){ S[drag.id]=Object.assign({},S[drag.id],{f:{x:b.left,y:b.top,w:b.width,h:b.height}}); save(); } drag=null; }
  if(rez){ const r=reg[rez.id]; const b=r&&r.wrap.getBoundingClientRect();
    if(b){ S[rez.id]=Object.assign({},S[rez.id],{f:{x:b.left,y:b.top,w:b.width,h:b.height}}); save(); } rez=null; }
});

/* ---------- tray ---------- */
function tray(){
  let t=$('#lxtray');
  if(!t){ t=document.createElement('div'); t.id='lxtray'; document.body.appendChild(t); }
  Object.keys(reg).forEach(id=>{ const r=reg[id]; if(!document.contains(r.wrap)) delete reg[id]; });
  const items=Object.keys(reg).filter(id=>{ const r=reg[id]; return r.wrap.classList.contains('lxhidden')||r.wrap.classList.contains('lxfloating')||r.wrap.classList.contains('lxcollapsed'); });
  if(!items.length){ t.innerHTML=''; t.classList.remove('on'); return; }
  t.classList.add('on');
  t.innerHTML='<div class="lxth">Panels ('+items.length+')<button class="lxb" id="lxresetall" title="Return every panel to its normal place">reset all</button></div>'
    + items.map(id=>{ const r=reg[id]; const st=r.wrap.classList.contains('lxhidden')?'hidden':r.wrap.classList.contains('lxfloating')?'floating':'collapsed';
      return '<button class="lxti" data-pid="'+id+'"><i class="'+st+'"></i>'+r.title.replace(/[<>&]/g,'')+' <em>'+st+'</em></button>'; }).join('');
  $$('#lxtray .lxti').forEach(b=>b.addEventListener('click', ()=>{
    const id=b.dataset.pid, r=reg[id];
    if(r.wrap.classList.contains('lxhidden')) show(id);
    else if(r.wrap.classList.contains('lxfloating')){ r.wrap.style.zIndex=++zTop; r.wrap.animate([{outline:'3px solid var(--accent)'},{outline:'0'}],{duration:700}); }
    else { toggleCollapse(id,false); r.wrap.scrollIntoView({behavior:'smooth',block:'center'}); }
  }));
  const ra=$('#lxresetall'); if(ra) ra.onclick=resetAll;
}
function resetAll(){
  Object.keys(reg).forEach(id=>{ const r=reg[id];
    if(r.wrap.classList.contains('lxfloating')) dock(id);
    r.wrap.classList.remove('lxhidden','lxcollapsed');
    const b=r.wrap.querySelector('.lxcol'); if(b) b.textContent='▾';
    delete S[id]; });
  save(); tray();
  if(window.LX&&LX.toast) LX.toast('Layout reset — every panel back in place');
}
function collapseAll(view){
  Object.keys(reg).forEach(id=>{ const r=reg[id]; if(view && r.view!==view) return; if(!r.wrap.classList.contains('lxfloating')) toggleCollapse(id,true); });
}
function expandAll(view){
  Object.keys(reg).forEach(id=>{ const r=reg[id]; if(view && r.view!==view) return; toggleCollapse(id,false); r.wrap.classList.remove('lxhidden'); if(S[id]) delete S[id].h; });
  save(); tray();
}

/* ---------- scan ---------- */
function scan(view){
  const sec = view? document.getElementById(view) : document;
  if(!sec) return;
  const els=Array.from(sec.querySelectorAll('.chart, .tablewrap, [data-panel]'));
  els.forEach((el,i)=>{ try{ wrapOne(el, view||'all', i); }catch(e){} });
  tray();
}
function bindHeader(){
  if($('#lxlayout')) return;
  const brand=$('header .brand'); if(!brand) return;
  const b=document.createElement('button');
  b.id='lxlayout'; b.className='btn'; b.title='Screen layout — collapse, expand or reset every panel';
  b.textContent='▤ Layout';
  b.addEventListener('click', e=>{
    e.stopPropagation();
    let m=$('#lxmenu');
    if(m){ m.remove(); return; }
    m=document.createElement('div'); m.id='lxmenu';
    const v=(document.querySelector('.view.active')||{}).id||'';
    m.innerHTML='<button data-a="col">Collapse all panels on this tab</button>'
      +'<button data-a="exp">Expand all panels on this tab</button>'
      +'<button data-a="colall">Collapse everything</button>'
      +'<button data-a="reset">Reset layout</button>'
      +'<div class="lxhint">Every box has ▾ collapse, ⤢ pop-out (drag to move, corner to resize) and × hide. Hidden and floating boxes stay listed in the tray at the bottom right.</div>';
    document.body.appendChild(m);
    const r=b.getBoundingClientRect(); m.style.left=Math.max(8,r.left)+'px'; m.style.top=(r.bottom+6)+'px';
    m.querySelectorAll('button').forEach(x=>x.addEventListener('click',()=>{
      const a=x.dataset.a;
      if(a==='col') collapseAll(v); else if(a==='exp') expandAll(v); else if(a==='colall') collapseAll(null); else resetAll();
      m.remove();
    }));
    setTimeout(()=>document.addEventListener('click', function h(){ const mm=$('#lxmenu'); if(mm) mm.remove(); document.removeEventListener('click',h); }),0);
  });
  brand.parentNode.insertBefore(b, brand.nextSibling);
}
function init(){
  bindHeader();
  const v=(document.querySelector('.view.active')||{}).id||'dash';
  scan(v);
}
window.LXPanels={scan, init, collapseAll, expandAll, resetAll, tray};
if(document.readyState!=='loading') setTimeout(init, 900); else document.addEventListener('DOMContentLoaded', ()=>setTimeout(init,900));
})();
