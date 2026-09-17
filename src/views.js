/* locator.x — view builder.
   Pick asset classes one at a time or stack several, split land from buildings, search on
   price in plain language, filter by target category, and save the whole arrangement as a
   named view. Everything downstream — dashboard, map, charts, below-market hunt — obeys it. */
(function(){
'use strict';
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const L=()=>window.LX, D=()=>window.LXDash;
const KEY='lxviews';

function isLand(l){
  const k=(l.kind||'').toLowerCase();
  if(/vacant|^land|\bland\b|lot only/.test(k) && !/building|apartment|hotel|warehouse|office/.test(k)) return true;
  return false;
}
const CLASSES=[
 {id:'mf',    name:'Multifamily 2–4',      test:l=>(l.units||1)>=2&&(l.units||1)<=4},
 {id:'apt',   name:'Apartments 5+',        test:l=>(l.units||1)>=5},
 {id:'hotel', name:'Hotels & lodging',     test:l=>/hotel|motel|lodging|\binn\b|sro|boarding|group quarters/i.test(l.kind||'')},
 {id:'comm',  name:'Commercial',           test:l=>/commercial|retail|office|store|shopping|restaurant|bank|medical|mixed.use|auto|parking|service station/i.test(l.kind||'')},
 {id:'ind',   name:'Industrial & storage', test:l=>/industrial|warehouse|storage|flex|terminal|data center|manufactur/i.test(l.kind||'')},
 {id:'condo', name:'Condo & townhouse',    test:l=>/condo|townhouse|co-op|cooperative|duet/i.test(l.kind||'')},
 {id:'sfr',   name:'Single-family',        test:l=>(l.units||1)<2 && /single.family|residential parcel|residence|home/i.test(l.kind||'') && !/condo|townhouse/i.test(l.kind||'')},
 /* THE CONVERSION CLASS WAS GATED ON A BUILDER FLAG, AND MOST BUILDERS DO NOT SET IT.

    src/conv.js had exactly this defect and was fixed: `l.cv` is written by a
    minority of the data builders, so the Conversion lab and the conversion map
    lens both rendered empty in every edition whose builder omitted it — not
    because those editions hold no convertible stock, but because nobody had
    ticked a box. The fix was to derive candidacy from the RECORD: a lodging use,
    or five or more units, is a conversion candidate whatever the flag says.

    This surface was missed. The view builder's Conversion class still asked for
    the flag alone, so the class classified nothing across all 14,024 fixture
    records while 1,209 of them carry five or more units and 395 are lodging.
    It now asks conv.js the same question the lab and the lens ask, and falls
    back to the same record test if that module is not loaded in this edition. */
 {id:'conv',  name:'Conversion class',
  test:l=>{ try{ if(window.LXConv && LXConv.candidate) return LXConv.candidate(l); }catch(e){}
            return !!l.cv || /hotel|motel|lodging|sro/i.test(l.kind||'') || (l.units||0) >= 5; }},
 {id:'land',  name:'Land only',            test:isLand}
];
/* Colour comes from the shared validated palette, assigned in fixed slot order
   and never cycled, so a class keeps its hue everywhere in the app and a filter
   that removes classes never repaints the survivors. */
CLASSES.forEach((c,i)=>{ Object.defineProperty(c,'c',{get(){ if(!window.LXPal) return 'var(--ink2)'; return i<8? LXPal.c(i+1) : LXPal.tok('--muted'); }}); });
const STRUCT=[['all','Land + buildings'],['bld','Buildings only'],['land','Land only']];
const DEF={classes:[], struct:'all', min:null, max:null, cats:[], stack:'stack', q:''};
let saved=(function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } })();
function load(n){ return saved&&saved[n]; }
let V=Object.assign({}, DEF, load('__last')||{});
function persist(){ try{ saved.__last=V; localStorage.setItem(KEY, JSON.stringify(saved)); }catch(e){} }

/* plain-language price search */
function parsePrice(q){
  if(!q) return null;
  const s=q.toLowerCase().replace(/[$,]/g,'').trim();
  const num=t=>{ const m=/^([\d.]+)\s*([km])?$/.exec(t.trim()); if(!m) return null;
    let v=parseFloat(m[1]); if(m[2]==='k') v*=1e3; else if(m[2]==='m') v*=1e6; else if(v<10000) v*=1000; return Math.round(v); };
  let m;
  if((m=/^(?:under|below|<|up to|max)\s*(.+)$/.exec(s))){ const v=num(m[1]); return v?{max:v, how:'under '+fmt(v)}:null; }
  if((m=/^(?:over|above|>|min|at least)\s*(.+)$/.exec(s))){ const v=num(m[1]); return v?{min:v, how:'over '+fmt(v)}:null; }
  if((m=/^(.+?)\s*(?:-|–|to)\s*(.+)$/.exec(s))){ const a=num(m[1]), b=num(m[2]); if(a&&b) return {min:Math.min(a,b), max:Math.max(a,b), how:fmt(a)+' to '+fmt(b)}; }
  const v=num(s);
  if(v) return {min:Math.round(v*0.9), max:Math.round(v*1.1), how:'around '+fmt(v)+' (±10%)'};
  return null;
}
function fmt(v){ return v>=1e6? '$'+(v/1e6).toFixed(v%1e6?1:0)+'M' : '$'+Math.round(v/1000)+'k'; }

/* the filter every other module asks */
function pass(l){
  if(V.struct==='bld' && isLand(l)) return false;
  if(V.struct==='land' && !isLand(l)) return false;
  if(V.classes.length){ const cs=CLASSES.filter(c=>V.classes.includes(c.id)); if(!cs.some(c=>c.test(l))) return false; }
  const p=L().price(l);
  if(V.min!=null && p<V.min) return false;
  if(V.max!=null && p>V.max) return false;
  if(V.cats.length){ let r=null; try{ r=D().analyze(l); }catch(e){} if(!r||!V.cats.includes(r.cat)) return false; }
  return true;
}
function active(){ return !!(V.classes.length || V.struct!=='all' || V.min!=null || V.max!=null || V.cats.length); }
function classOf(l){ for(const c of CLASSES){ if(c.test(l)) return c; } return null; }

/* ---------- render ---------- */
function render(){
  const host=$('#vbroot'); if(!host) return;
  const X=L();
  const cats=(D().CATS||[]);
  host.innerHTML=`<div class="tile" data-panel data-panel-title="View builder — asset classes, price, land vs buildings">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap">
      <div><p class="eyebrow">View builder</p><h3 style="margin:2px 0 2px">Look at one asset class, or stack several against each other</h3></div>
      <div class="toolbar" style="gap:6px">
        <select id="vbsaved" title="Saved views"><option value="">Saved views…</option>${Object.keys(saved).filter(k=>k!=='__last').map(k=>`<option>${X.esc(k)}</option>`).join('')}</select>
        <button class="btn" id="vbsave">Save view</button><button class="btn" id="vbclear">Clear</button>
      </div>
    </div>
    <div style="margin-top:8px"><span class="eyebrow" style="letter-spacing:.05em">Asset classes — click to stack</span>
      <div class="chips" id="vbclasses" style="margin-top:5px"></div></div>
    <div class="bbgrid" style="margin-top:10px">
      <label>Structure<select id="vbstruct">${STRUCT.map(s=>`<option value="${s[0]}" ${V.struct===s[0]?'selected':''}>${s[1]}</option>`).join('')}</select></label>
      <label>Price search<input id="vbq" value="${X.esc(V.q||'')}" placeholder="under 500k · 300k-700k · over 1m · 450k"></label>
      <label>Min price $<input type="number" id="vbmin" value="${V.min!=null?V.min:''}" step="25000"></label>
      <label>Max price $<input type="number" id="vbmax" value="${V.max!=null?V.max:''}" step="25000"></label>
      <label>Compare as<select id="vbstack"><option value="stack" ${V.stack==='stack'?'selected':''}>Stacked</option><option value="side" ${V.stack==='side'?'selected':''}>Side by side</option><option value="single" ${V.stack==='single'?'selected':''}>Single series</option></select></label>
    </div>
    <div style="margin-top:8px"><span class="eyebrow" style="letter-spacing:.05em">Target categories</span>
      <div class="chips" id="vbcats" style="margin-top:5px">${cats.map(c=>`<button class="chip" data-cat="${c.id}" aria-pressed="${V.cats.includes(c.id)}" style="${V.cats.includes(c.id)?`background:var(${c.c});border-color:var(${c.c});color:#fff`:''}">${c.name}</button>`).join('')}</div></div>
    <p class="src" id="vbstat" style="margin-top:10px"></p>
  </div>
  <div class="chart" id="vbchart" data-panel data-panel-title="Class comparison"></div>`;
  $('#vbclasses').innerHTML=CLASSES.map(c=>`<button class="chip" data-cls="${c.id}" aria-pressed="${V.classes.includes(c.id)}" style="${V.classes.includes(c.id)?`background:${c.c};border-color:${c.c};color:#fff`:''}">${c.name}</button>`).join('')
    +`<button class="chip" data-cls="__all" style="border-style:dashed">${V.classes.length?'clear classes':'all classes'}</button>`;
  $$('#vbclasses .chip').forEach(b=>b.addEventListener('click',()=>{
    const id=b.dataset.cls;
    if(id==='__all') V.classes=[];
    else V.classes = V.classes.includes(id)? V.classes.filter(x=>x!==id) : V.classes.concat(id);
    apply();
  }));
  $$('#vbcats .chip').forEach(b=>b.addEventListener('click',()=>{
    const id=b.dataset.cat;
    V.cats = V.cats.includes(id)? V.cats.filter(x=>x!==id) : V.cats.concat(id);
    apply();
  }));
  $('#vbstruct').addEventListener('change',e=>{ V.struct=e.target.value; apply(); });
  $('#vbstack').addEventListener('change',e=>{ V.stack=e.target.value; apply(); });
  $('#vbmin').addEventListener('change',e=>{ V.min=e.target.value===''?null:+e.target.value; V.q=''; apply(); });
  $('#vbmax').addEventListener('change',e=>{ V.max=e.target.value===''?null:+e.target.value; V.q=''; apply(); });
  const qh=()=>{ const p=parsePrice($('#vbq').value); V.q=$('#vbq').value;
    if(p){ V.min=p.min!=null?p.min:null; V.max=p.max!=null?p.max:null; } else if(!V.q){ V.min=null; V.max=null; }
    apply(); };
  $('#vbq').addEventListener('change',qh);
  $('#vbq').addEventListener('keydown',e=>{ if(e.key==='Enter') qh(); });
  $('#vbclear').onclick=()=>{ V=Object.assign({},DEF); apply(); };
  $('#vbsave').onclick=()=>{ const n=prompt('Name this view'); if(!n) return; saved[n]=JSON.parse(JSON.stringify(V)); persist(); render(); L().toast('View "'+n+'" saved'); };
  $('#vbsaved').addEventListener('change',e=>{ const n=e.target.value; if(!n) return; V=Object.assign({},DEF,saved[n]); apply(); });
  stat(); chart();
}
function apply(){
  persist();
  try{ D().render(); }catch(e){}
  try{ L().refresh(); }catch(e){}
  render();
  try{ if(window.LXPanels) LXPanels.scan('dash'); }catch(e){}
}
function stat(){
  const X=L(); const all=X.allListings();
  let n=0; const cap=V.cats.length? Math.min(all.length,45000) : all.length;
  for(let i=0;i<cap;i++) if(pass(all[i])) n++;
  const p=parsePrice(V.q);
  $('#vbstat').innerHTML=`<b>${n.toLocaleString()}</b> of ${cap.toLocaleString()} records match this view`
    +(V.classes.length? ' · classes: '+V.classes.map(id=>CLASSES.find(c=>c.id===id).name).join(' + ') : ' · every asset class')
    +(V.struct!=='all'? ' · '+STRUCT.find(s=>s[0]===V.struct)[1].toLowerCase() : '')
    +(p? ' · price '+p.how : (V.min!=null||V.max!=null)? ' · price '+(V.min!=null?fmt(V.min):'any')+'–'+(V.max!=null?fmt(V.max):'any') : '')
    +(V.cats.length? ' · categories: '+V.cats.join(', ') : '')
    +'. Land is separated from improved property by the county\'s own use description.';
}
function chart(){
  const box=$('#vbchart'); if(!box) return;
  const X=L(); const all=X.allListings();
  const sel = V.classes.length? CLASSES.filter(c=>V.classes.includes(c.id)) : CLASSES;
  const BANDS=[[0,250e3,'<$250k'],[250e3,500e3,'$250–500k'],[500e3,750e3,'$500–750k'],[750e3,1e6,'$750k–1M'],[1e6,2e6,'$1–2M'],[2e6,5e6,'$2–5M'],[5e6,1e12,'$5M+']];
  const M=sel.map(()=>BANDS.map(()=>0));
  const cap=all.length;
  for(let i=0;i<cap;i++){
    const l=all[i];
    if(V.struct==='bld'&&isLand(l)) continue; if(V.struct==='land'&&!isLand(l)) continue;
    const p=X.price(l); if(!p) continue;
    const bi=BANDS.findIndex(b=>p>=b[0]&&p<b[1]); if(bi<0) continue;
    sel.forEach((c,ci)=>{ if(c.test(l)) M[ci][bi]++; });
  }
  const W=980,H=330,pl=60,pr=14,pt=26,pb=54;
  const stacked=V.stack==='stack', single=V.stack==='single';
  const totals=BANDS.map((_,bi)=> stacked? M.reduce((t,r)=>t+r[bi],0) : Math.max(...M.map(r=>r[bi])));
  const max=Math.max(1,...totals);
  const bw=(W-pl-pr)/BANDS.length;
  let s=`<div class="eyebrow">Composition</div><h3>${V.classes.length? 'Selected classes' : 'Every asset class'} by price band — ${stacked?'stacked':single?'one series':'side by side'}</h3>
  <p class="chartnote">Counts of records in each price band. Click a class chip above to add or remove it; switch stacked / side-by-side / single in the view builder. This chart, the dashboard, the map and the below-market hunt all read the same view.</p>
  <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">`;
  BANDS.forEach((b,bi)=>{
    const x0=pl+bi*bw;
    let acc=0;
    const use=single? [sel[0]].filter(Boolean) : sel;
    use.forEach((c,ci)=>{
      const v=M[sel.indexOf(c)][bi]; if(!v) return;
      const h=(v/max)*(H-pt-pb);
      if(stacked){
        s+=`<rect x="${x0+6}" y="${H-pb-acc-h}" width="${bw-12}" height="${h}" fill="${c.c}" opacity="0.88"><title>${c.name} · ${b[2]} · ${v.toLocaleString()}</title></rect>`;
        acc+=h;
      } else {
        const n=use.length, sw=(bw-12)/n;
        s+=`<rect x="${x0+6+ci*sw}" y="${H-pb-h}" width="${Math.max(1,sw-2)}" height="${h}" fill="${c.c}" opacity="0.88"><title>${c.name} · ${b[2]} · ${v.toLocaleString()}</title></rect>`;
      }
    });
    s+=`<text x="${x0+bw/2}" y="${H-pb+16}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${b[2]}</text>`;
    const tot=M.reduce((t,r)=>t+r[bi],0);
    if(tot) s+=`<text x="${x0+bw/2}" y="${H-pb-(stacked?acc:(Math.max(...sel.map(c=>M[sel.indexOf(c)][bi]))/max)*(H-pt-pb))-5}" text-anchor="middle" font-size="10" font-family="var(--mono)" fill="var(--ink2)">${tot.toLocaleString()}</text>`;
  });
  s+=`<line x1="${pl}" x2="${W-pr}" y1="${H-pb}" y2="${H-pb}" stroke="var(--line2)"/></svg>
  <div class="chips" style="margin-top:6px">${(single?[sel[0]].filter(Boolean):sel).map(c=>`<span class="chip" style="font-size:11px"><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c.c};margin-right:5px"></i>${c.name}</span>`).join('')}</div>`;
  box.innerHTML=s;
}
window.LXView={render, pass, active, CLASSES, isLand, classOf, parsePrice, get state(){ return V; }};
function boot(){ try{ if(document.getElementById('vbroot')) render(); }catch(e){} }
if(document.readyState!=='loading') setTimeout(boot, 700); else document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot,700));
})();
