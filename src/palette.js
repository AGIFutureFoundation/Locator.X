/* ===== Locator.X — chart colour + interaction layer =======================
   One place that answers three questions for every chart in the app:
     1. what colour is this mark          (LXPal.c / cat / seq / div)
     2. what does it say when you hover   (LXPal.tip)
     3. what happens when you click it    (LXPal.drill)

   Colour follows the entity, never its rank, and never the count of series on
   screen: filtering a chart down to three categories must not repaint the
   survivors. Categorical hues come from the validated eight-slot set defined in
   the stylesheet — read through CSS custom properties so a theme change moves
   every chart at once. Sequential is one hue light-to-dark; diverging is two
   hues around a neutral grey. Status colours are reserved for good/warning/bad
   and are never handed out as series colours.
   ========================================================================= */
(function(){
  const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* ---- resolved token cache; invalidated when the theme moves ---- */
  let cache={};
  function tok(name){
    if(name in cache) return cache[name];
    const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return (cache[name]= v || '#888888');
  }
  function flush(){ cache={}; }
  try{
    const mq=window.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener? mq.addEventListener('change',flush) : mq.addListener(flush));
    new MutationObserver(flush).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  }catch(e){}

  /* slot 1..8 — fixed order, never cycled. A ninth series folds into "Other". */
  const c=n=>tok('--cat'+Math.max(1,Math.min(8,n)));
  const SEQ=['--seq1','--seq2','--seq3','--seq4','--seq5'];
  function seq(t){                       // t in 0..1 -> one hue, light to dark
    if(!isFinite(t)) return tok('--seq1');
    const x=Math.max(0,Math.min(1,t))*(SEQ.length-1);
    return tok(SEQ[Math.round(x)]);
  }
  function div(t){                       // t in -1..1 -> two hues, neutral middle
    if(!isFinite(t)) return tok('--divmid');
    if(Math.abs(t)<0.08) return tok('--divmid');
    return t<0 ? tok('--divneg') : tok('--divpos');
  }
  /* the five property categories, in the order every chart stacks them */
  const CATORDER=['asset','hack','value','growth','liab'];
  function cat(id){
    const i=CATORDER.indexOf(id);
    return i>=0 ? c(i+1) : tok('--muted');
  }
  const SHAPE={asset:'circle', hack:'square', value:'diamond', growth:'triangle', liab:'cross'};
  /* Shape is the second channel. At five hues no ordering clears the all-pairs
     colour-blind floor, so any chart that puts all five on a plane at once —
     the map, the scatter, the bubble field — must carry shape as well. */
  function shapePath(kind, x, y, r){
    switch(kind){
      case 'square':   return `M${x-r} ${y-r}h${2*r}v${2*r}h${-2*r}Z`;
      case 'diamond':  return `M${x} ${y-r*1.3}L${x+r*1.3} ${y}L${x} ${y+r*1.3}L${x-r*1.3} ${y}Z`;
      case 'triangle': return `M${x} ${y-r*1.25}L${x+r*1.2} ${y+r}L${x-r*1.2} ${y+r}Z`;
      case 'cross':    return `M${x-r} ${y-r}L${x+r} ${y+r}M${x+r} ${y-r}L${x-r} ${y+r}`;
      default:         return null;   // circle — caller draws <circle>
    }
  }
  function swatch(color, shape, size){
    const s=size||11, r=s/2-1;
    const p=shapePath(shape, s/2, s/2, r);
    const body = p
      ? (shape==='cross'
         ? `<path d="${p}" stroke="${color}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`
         : `<path d="${p}" fill="${color}"/>`)
      : `<circle cx="${s/2}" cy="${s/2}" r="${r}" fill="${color}"/>`;
    /* explicit inline sizing: the app's chart CSS stretches any svg inside a
       .chart to full width, and a legend key must never inherit that */
    return `<svg class="lxsw" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true" style="width:${s}px;height:${s}px;min-width:${s}px;max-height:${s}px;flex:none;display:inline-block;vertical-align:-1px">${body}</svg>`;
  }

  /* ---- legend: always present for two or more series -------------------- */
  function legend(items, opt){
    opt=opt||{};
    if(!items || items.length<2) return '';
    return `<div class="lxlegend" role="list">`+items.map((it,i)=>
      `<span role="listitem" class="lxlgi${it.dim?' dim':''}"${it.key!=null?` data-lgkey="${esc(it.key)}" tabindex="0"`:''}>`
      + swatch(it.color||c(i+1), it.shape||'circle')
      + `<span>${esc(it.label)}</span>`
      + (it.value!=null? `<b class="num">${esc(it.value)}</b>`:'')
      + `</span>`).join('')
    + (opt.note? `<span class="lxlgnote">${opt.note}</span>`:'')
    + `</div>`;
  }

  /* ---- hover tooltip ---------------------------------------------------- */
  let tipEl=null;
  function tip(e, html){
    if(!tipEl){ tipEl=document.createElement('div'); tipEl.className='viztip'; document.body.appendChild(tipEl); }
    tipEl.innerHTML=html; tipEl.style.display='block';
    const x=e.clientX+14, y=e.clientY+14;
    tipEl.style.left=Math.min(x, innerWidth-tipEl.offsetWidth-10)+'px';
    tipEl.style.top=Math.min(y, innerHeight-tipEl.offsetHeight-10)+'px';
  }
  function tipHide(){ if(tipEl) tipEl.style.display='none'; }

  /* ---- drill-down: every mark can open the rows behind it ---------------
     This is the contract that makes the charts interoperable. A chart marks
     any element (SVG, canvas hit-region proxy, table cell) with a payload and
     calls LXPal.bind on its root; clicking opens the same panel everywhere,
     listing the actual records, each row a link into the property drawer. */
  let panel=null;
  function ensurePanel(){
    if(panel && document.contains(panel)) return panel;
    panel=document.createElement('div');
    panel.id='lxdrill'; panel.setAttribute('role','dialog'); panel.setAttribute('aria-label','Records behind this mark');
    panel.innerHTML='<div class="lxdhead"><div><p class="eyebrow" id="lxdeye"></p><h3 id="lxdtitle"></h3><p id="lxdsub"></p></div>'
      +'<div class="lxdacts"><button class="btn" id="lxdcsv">CSV</button><button class="btn" id="lxdmap">Show on map</button><button class="iconbtn" id="lxdclose" aria-label="Close">&#10005;</button></div></div>'
      +'<div class="lxdbody"><div class="tablewrap"><table class="grid" id="lxdtable"><thead></thead><tbody></tbody></table></div></div>';
    document.body.appendChild(panel);
    panel.querySelector('#lxdclose').addEventListener('click', closeDrill);
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && panel.classList.contains('open')) closeDrill(); });
    return panel;
  }
  function closeDrill(){ if(panel) panel.classList.remove('open'); }

  let lastRows=[];
  const COLS=[['addr','Address'],['city','City'],['kind','Type'],['units','Units','num'],
              ['price','Price','num'],['score','Score','num'],['cfMo','Cash flow / mo','num'],['cap','Cap rate','num']];
  function rowOf(l){
    const X=window.LX, D=window.LXDash;
    let d=null, score=null, cat=null;
    try{ d=X.deal(l); }catch(e){}
    try{ const a=D&&D.analyze(l); if(a){ score=a.score; cat=a.cat; } }catch(e){}
    return {l, d, score, cat};
  }
  function fmt(v, k){
    const X=window.LX;
    if(v==null||v==='') return '—';
    if(k==='price') return X.fmt$(v);
    if(k==='cfMo') return X.fmt$(v);
    if(k==='cap') return (+v).toFixed(2)+'%';
    return typeof v==='number'? Math.round(v).toLocaleString() : String(v);
  }
  function drill(title, listings, meta){
    const X=window.LX; if(!X) return;
    meta=meta||{};
    const rows=(listings||[]).slice(0, 400).map(rowOf);
    lastRows=rows;
    const p=ensurePanel();
    p.querySelector('#lxdeye').textContent=meta.eyebrow||'Records behind this mark';
    p.querySelector('#lxdtitle').textContent=title||'Selection';
    p.querySelector('#lxdsub').innerHTML=(listings.length>rows.length
        ? `Showing the first ${rows.length.toLocaleString()} of <b>${listings.length.toLocaleString()}</b> records. `
        : `<b>${rows.length.toLocaleString()}</b> record${rows.length===1?'':'s'}. `)
      + (meta.note||'Click any row to open it on the map and in the drawer.');
    p.querySelector('#lxdtable thead').innerHTML='<tr>'+COLS.map(c2=>`<th class="${c2[2]==='num'?'r':''}">${c2[1]}</th>`).join('')+'</tr>';
    p.querySelector('#lxdtable tbody').innerHTML=rows.map(r=>{
      const col=r.cat? cat(r.cat) : tok('--muted');
      return '<tr class="clickable" data-id="'+esc(r.l.id)+'">'+COLS.map((c2,i)=>{
        const k=c2[0]; let v;
        if(k==='score') v=r.score;
        else if(k==='cfMo') v=r.d? r.d.cfMo : null;
        else if(k==='cap') v=r.d? r.d.cap : null;
        else if(k==='price') v=X.price(r.l);
        else v=r.l[k];
        const style = i===0 ? ` style="border-left:3px solid ${col};padding-left:8px"` : '';
        return '<td class="'+(c2[2]==='num'?'r':'')+'"'+style+'>'+esc(fmt(v,k))+'</td>';
      }).join('')+'</tr>';
    }).join('');
    $$('#lxdtable tbody tr').forEach(tr=>tr.addEventListener('click',()=>{
      closeDrill(); if(window.LX&&LX.select) LX.select(tr.dataset.id, true);
    }));
    p.querySelector('#lxdcsv').onclick=()=>{
      const head=COLS.map(c2=>c2[1]).join(',');
      const q=v=>v==null?'':(/[",\n]/.test(String(v))?'"'+String(v).replace(/"/g,'""')+'"':v);
      const body=rows.map(r=>COLS.map(c2=>{
        const k=c2[0];
        if(k==='score') return q(r.score);
        if(k==='cfMo') return q(r.d? Math.round(r.d.cfMo):'');
        if(k==='cap') return q(r.d? r.d.cap.toFixed(2):'');
        if(k==='price') return q(X.price(r.l));
        return q(r.l[k]);
      }).join(',')).join('\n');
      const blob=new Blob([head+'\n'+body],{type:'text/csv'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
      a.download='locator.x-selection.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    };
    p.querySelector('#lxdmap').onclick=()=>{
      closeDrill();
      try{ window.LXPal.filterTo(rows.map(r=>r.l.id)); }catch(e){}
    };
    p.classList.add('open');
  }

  /* push a set of ids into the map as a temporary highlight filter */
  let pinned=null;
  function filterTo(ids){
    pinned=new Set(ids||[]);
    window.__lxPinned=pinned;
    if(window.LX){ LX.showView('mapview'); LX.refresh&&LX.refresh(); if(LX.toast) LX.toast(pinned.size+' records highlighted on the map — press Clear in the map toolbar to release'); }
    mountClear();
  }
  function clearFilter(){ pinned=null; window.__lxPinned=null; const b=$('#lxpinclear'); if(b) b.remove(); if(window.LX) LX.refresh&&LX.refresh(); }
  function mountClear(){
    if($('#lxpinclear')) return;
    const bar=$('#maptools')||$('.maptools')||$('#mapview .toolbar');
    if(!bar) return;
    const b=document.createElement('button'); b.className='btn'; b.id='lxpinclear'; b.textContent='Clear highlight';
    b.addEventListener('click', clearFilter); bar.appendChild(b);
  }

  /* ---- bind: turn [data-drill] elements into real controls -------------- */
  function bind(root){
    root=root||document;
    $$('[data-drill]', root).forEach(el=>{
      if(el.__lxb) return; el.__lxb=1;
      el.style.cursor='pointer';
      if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
      if(!el.getAttribute('role')) el.setAttribute('role','button');
      const fire=()=>{
        let spec=null;
        try{ spec=JSON.parse(el.getAttribute('data-drill')); }catch(e){ return; }
        resolve(spec, el);
      };
      el.addEventListener('click', fire);
      el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fire(); } });
      const t=el.getAttribute('data-tip');
      if(t){
        el.addEventListener('pointermove', e=>tip(e, t));
        el.addEventListener('pointerleave', tipHide);
        el.addEventListener('focus', e=>tip({clientX:el.getBoundingClientRect().right, clientY:el.getBoundingClientRect().top}, t));
        el.addEventListener('blur', tipHide);
      }
    });
  }
  /* a drill spec is declarative so charts never hold record arrays in the DOM */
  const RESOLVERS={};
  function register(name, fn){ RESOLVERS[name]=fn; }
  function resolve(spec, el){
    tipHide();
    if(!spec) return;
    if(spec.k && RESOLVERS[spec.k]){
      const r=RESOLVERS[spec.k](spec, el);
      if(r && r.rows) drill(r.title||spec.t||'Selection', r.rows, r.meta||{eyebrow:spec.e});
      return;
    }
    if(spec.ids && window.LX){
      const all=LX.allListings(); const set=new Set(spec.ids);
      drill(spec.t||'Selection', all.filter(l=>set.has(l.id)), {eyebrow:spec.e});
    }
  }
  /* generic resolver: filter all listings by simple field predicates */
  register('f', (spec)=>{
    const X=window.LX; if(!X) return null;
    const D=window.LXDash;
    let rows=X.allListings();
    const VW=(window.LXView&&window.LXView.active())? window.LXView : null;
    if(VW) rows=rows.filter(l=>VW.pass(l));
    const f=spec.f||{};
    if(f.city) rows=rows.filter(l=>l.city===f.city);
    if(f.zip) rows=rows.filter(l=>String(l.zip)===String(f.zip));
    if(f.county) rows=rows.filter(l=>l.county===f.county);
    if(f.kind) rows=rows.filter(l=>l.kind===f.kind);
    if(f.pmin!=null) rows=rows.filter(l=>X.price(l)>=f.pmin);
    if(f.pmax!=null) rows=rows.filter(l=>X.price(l)<f.pmax);
    if(f.umin!=null) rows=rows.filter(l=>(l.units||1)>=f.umin);
    if(f.umax!=null) rows=rows.filter(l=>(l.units||1)<=f.umax);
    if(f.cat && D){ rows=rows.filter(l=>{ try{ const a=D.analyze(l); return a && a.cat===f.cat; }catch(e){ return false; } }); }
    if(f.smin!=null && D){ rows=rows.filter(l=>{ try{ const a=D.analyze(l); return a && a.score>=f.smin; }catch(e){ return false; } }); }
    if(f.smax!=null && D){ rows=rows.filter(l=>{ try{ const a=D.analyze(l); return a && a.score<f.smax; }catch(e){ return false; } }); }
    return {rows, title:spec.t||'Selection', meta:{eyebrow:spec.e, note:spec.n}};
  });

  window.LXPal={c, cat, CATORDER, SHAPE, seq, div, tok, flush, swatch, shapePath,
                legend, tip, tipHide, drill, bind, register, resolve, filterTo, clearFilter,
                get pinned(){ return pinned; }};
})();
