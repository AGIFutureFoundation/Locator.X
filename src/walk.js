/* ===== Locator.X — walkable destinations ==================================
   A walk measure built only from records this edition actually holds: parcels
   the county itself classifies as shops, restaurants, offices, clinics and the
   like, plus the campuses with published enrolment.

   WHAT IT IS NOT. It is not Walk Score®, and it is not a street-network walk.
   Distance here is straight-line from parcel centroid to parcel centroid, so a
   freeway, a rail cut, a canal or a gated block will make the real walk longer
   than the number says — sometimes impossibly longer. It counts destinations
   that exist as assessed parcels; a shop inside a mixed-use building the
   assessor codes as residential does not appear, and a parcel coded retail may
   be a vacant storefront. Treat it as "how much is nearby on the roll", which
   is a real and checkable thing, and walk the block before you believe it.
   ========================================================================= */
(function(){
  const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmtN=n=>n==null?'—':Math.round(n).toLocaleString();

  /* destination classes, each matched against the jurisdiction's own use text */
  const CLASSES=[
    {id:'shop',  name:'Shops & everyday errands', slot:1, re:/commercial\s*[—-]\s*(stores|retail|misc)|shopping center|^commercial$|service station|car wash|auto (repair|agency|dealership)|repair garage/i},
    {id:'eat',   name:'Eating & drinking',        slot:2, re:/restaurant|drive-in/i},
    {id:'work',  name:'Workplaces',               slot:3, re:/office|bank|industrial flex|data center|advanced-tech|trucking terminal|light industrial|industrial park/i},
    {id:'care',  name:'Health & care',            slot:4, re:/hospital|medical|dental|clinic|nursing|custodial|funeral/i},
    {id:'learn', name:'Learning',                 slot:5, re:/fraternity|sorority|school|college|universit/i},
    {id:'stay',  name:'Lodging & mixed use',      slot:6, re:/hotel|motel|mixed|apartment \+ commercial|recreation/i}
  ];
  function classOf(l){
    const k=String(l.kind||'')+' '+String(l.classdef||'');
    for(const c of CLASSES) if(c.re.test(k)) return c.id;
    return null;
  }
  const CLASS=Object.fromEntries(CLASSES.map(c=>[c.id,c]));

  /* 10-minute walk at a normal pace is about 800 m; 15 minutes about 1.2 km */
  const R10=800, R15=1200;

  const RAD=6371000;
  function metres(a,b,c,d){
    const t=Math.PI/180, x=(c-a)*t, y=(d-b)*t;
    const h=Math.sin(x/2)**2 + Math.cos(a*t)*Math.cos(c*t)*Math.sin(y/2)**2;
    return 2*RAD*Math.asin(Math.min(1,Math.sqrt(h)));
  }

  /* ---- spatial index, built once per edition ---- */
  let grid=null, gridN=0;
  const CELL=0.012;                       // ~1.3 km of latitude
  const key=(la,lo)=>Math.round(la/CELL)+':'+Math.round(lo/CELL);
  function build(){
    const X=window.LX; if(!X) return;
    const all=X.allListings();
    if(grid && gridN===all.length) return;
    grid={}; gridN=all.length;
    for(let i=0;i<all.length;i++){
      const l=all[i]; if(l.lat==null) continue;
      const c=classOf(l); if(!c) continue;
      const k=key(l.lat,l.lng);
      (grid[k]=grid[k]||[]).push({l, c});
    }
    // campuses count as learning destinations with a real headcount behind them
    try{
      (window.LXCampus&&LXCampus.LIST||[]).forEach(cp=>{
        const k=key(cp.lat,cp.lng);
        (grid[k]=grid[k]||[]).push({l:{id:'campus:'+cp.name, addr:cp.name, city:cp.city, kind:'Campus — '+fmtN(cp.enroll)+' enrolled', lat:cp.lat, lng:cp.lng, __campus:1}, c:'learn'});
      });
    }catch(e){}
  }
  function near(lat, lng, radius){
    build(); if(!grid) return [];
    const out=[]; const span=Math.ceil(radius/1000/1.3)+1;
    const ci=Math.round(lat/CELL), cj=Math.round(lng/CELL);
    for(let i=-span;i<=span;i++) for(let j=-span;j<=span;j++){
      const cellArr=grid[(ci+i)+':'+(cj+j)]; if(!cellArr) continue;
      for(const e of cellArr){
        const m=metres(lat,lng,e.l.lat,e.l.lng);
        if(m<=radius) out.push({l:e.l, c:e.c, m});
      }
    }
    out.sort((a,b)=>a.m-b.m);
    return out;
  }

  /* ---- the measure ----
     Diversity first, then count. Twenty auto-repair parcels and nothing else is
     not a walkable neighbourhood; one shop, one restaurant and one clinic is
     the start of one. So each class contributes a saturating count and the
     classes are summed, which caps any single class's contribution. */
  function score(l){
    if(!l || l.lat==null) return null;
    const hits=near(l.lat, l.lng, R15);
    const by={}; CLASSES.forEach(c=>by[c.id]={n10:0, n15:0, first:null});
    for(const h of hits){
      const b=by[h.c]; if(!b) continue;
      b.n15++; if(h.m<=R10) b.n10++;
      if(!b.first) b.first=h;
    }
    let s=0, present=0;
    for(const c of CLASSES){
      const n=by[c.id].n10;
      if(n>0) present++;
      s += Math.min(1, Math.log10(n+1)/1.1) * (c.id==='shop'||c.id==='eat' ? 1.25 : 1);
    }
    const max=CLASSES.reduce((a,c)=>a+(c.id==='shop'||c.id==='eat'?1.25:1),0);
    return {score: Math.round(100*s/max), present, by, hits,
            n10: hits.filter(h=>h.m<=R10).length, n15: hits.length};
  }
  const BAND=v=>v>=62?['Errands on foot','good']:v>=38?['Some errands on foot','warn']:v>=15?['A few destinations','warn']:['Car territory','bad'];

  /* ---- drawer panel ---- */
  function sheetHTML(l){
    const w=score(l);
    if(!w) return '';
    const P=window.LXPal;
    const band=BAND(w.score);
    const bars=CLASSES.map(c=>{
      const b=w.by[c.id]; const col=P? P.c(c.slot) : 'var(--ink2)';
      const pct=Math.min(100, Math.log10(b.n10+1)/1.1*100);
      return `<div style="display:flex;align-items:center;gap:8px;margin:3px 0">
        <span style="flex:0 0 148px;font-size:12px;display:flex;align-items:center;gap:6px">${P?P.swatch(col,'circle',10):''}${esc(c.name)}</span>
        <span class="bar" style="flex:1;height:9px"><i style="width:${pct.toFixed(0)}%;background:${col}"></i></span>
        <b class="num" style="flex:0 0 68px;text-align:right;font-size:12px">${b.n10} / ${b.n15}</b>
        ${b.n15? `<button class="btn" data-walkc="${c.id}" style="flex:none;padding:1px 7px;font-size:11px">list</button>`:'<span style="flex:none;width:44px"></span>'}
      </div>`;
    }).join('');
    return `<div class="sec" style="margin-top:12px" id="walksec">
      <h3>Walkable destinations</h3>
      <div style="display:flex;align-items:baseline;gap:10px;margin:0 0 6px">
        <span class="big num" style="font-size:30px">${w.score}</span>
        <span class="badge ${band[1]}">${esc(band[0])}</span>
        <span style="font-size:12px;color:var(--ink2)">${w.present} of ${CLASSES.length} kinds of destination within a 10-minute walk</span>
      </div>
      <p class="chartnote" style="margin:0 0 8px">Counts are <b>10-minute / 15-minute</b> walk radii (800 m and 1.2 km). Diversity is weighted above raw count: twenty auto-repair parcels are not a walkable neighbourhood.</p>
      ${bars}
      <div class="src">Built only from parcels this edition holds and the jurisdiction's own use classes, plus campuses with published enrolment. <b>Straight-line distance, not a street-network walk</b> — a freeway, rail cut or canal between you and a destination makes the real walk far longer, and this number will not know. A parcel coded retail may be a vacant storefront; a shop inside a building coded residential will not appear at all. It is a measure of what is on the roll nearby, which is checkable — go check it.</div>
    </div>`;
  }
  function bindSheet(l){
    const root=$('#walksec'); if(!root) return;
    const w=score(l); if(!w) return;
    $$('#walksec [data-walkc]').forEach(b=>b.addEventListener('click',()=>{
      const id=b.dataset.walkc;
      const rows=w.hits.filter(h=>h.c===id && !h.l.__campus).map(h=>h.l);
      const camp=w.hits.filter(h=>h.c===id && h.l.__campus);
      if(!rows.length && camp.length){ if(window.LX&&LX.toast) LX.toast(camp.map(c=>c.l.addr).join(', ')+' — campus, not a tracked parcel'); return; }
      window.LXPal&&LXPal.drill(CLASS[id].name+' within a 15-minute walk', rows,
        {eyebrow:'Walkable destinations',
         note:'Straight-line distance from this parcel, nearest first. These are parcels the jurisdiction classifies this way — not a verified list of open businesses.'});
    }));
  }

  /* ---- send a property into the walkable twin ---- */
  function walkTo(l){
    if(!window.LXTwin || !window.LX) return false;
    LX.showView('twin');
    setTimeout(()=>{
      try{
        LXTwin.render();
        const m=LXTwin.map;
        if(m && l.lat!=null){ m.jumpTo({center:[l.lng,l.lat], zoom:17.4, pitch:66, bearing:20}); }
      }catch(e){}
    }, 260);
    return true;
  }

  window.LXWalk={score, sheetHTML, bindSheet, walkTo, near, classOf, CLASSES, BAND};
})();
