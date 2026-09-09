/* ===== Locator.X — motion field ===========================================
   The Locator X matrix as a living chart: one bubble per city (or ZIP), moving
   across the plane month by month, growing with the count behind it, and
   subdivided INSIDE by a Voronoi mosaic whose cells are the property categories
   that make it up. Scrub the slider and the whole field replays.

   WHERE THE MOTION COMES FROM. Every frame sets an as-of month on the published
   ZIP index series and lets the app's own engine recompute — same rent model,
   same assumptions, same score, same categories. Nothing is interpolated into
   existence and nothing is invented. What moves is the index: the typical value
   and typical rent Zillow published for that ZIP in that month, and the
   12-month change measured at that month. Each property's PRICE stays the price
   on the public record — this is not a claim about what anything was listed or
   sold for in the past. Read it as: what this app would have told you each
   month, given the index published that month.
   ========================================================================= */
(function(){
  const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const L=()=>window.LX, D=()=>window.LXDash, P=()=>window.LXPal;
  const fmtN=n=>n==null?'—':Math.round(n).toLocaleString();
  /* nine asset classes against eight validated slots: the ninth folds to muted
     rather than wrapping onto slot 1, which would collide with Multifamily */
  const clsColor=i=>{ if(!P()) return '#888'; return (i>=0&&i<8)? P().c(i+1) : P().tok('--muted'); };

  /* ---- what the two axes can be ---- */
  const AXES=[
    {id:'cf',    name:'Cash flow after the mortgage', unit:'$/mo', get:g=>g.cf,
     note:'Median monthly cash flow across the group at your assumptions.'},
    {id:'yoy',   name:'ZIP value change, 1 year',     unit:'%',    get:g=>g.yoy,
     note:'Measured at the replay month, from the published value index.'},
    {id:'yield', name:'Gross yield',                  unit:'%',    get:g=>g.yield,
     note:'Annual typical rent over typical value — index over index, no assumptions in it.'},
    {id:'score', name:'Locator X score',              unit:'',     get:g=>g.score,
     note:'Median score across the group, recomputed at the replay month.'},
    {id:'rent',  name:'Typical rent',                 unit:'$/mo', get:g=>g.rent,
     note:'The ZIP rent index for that month.'},
    {id:'val',   name:'Typical value',                unit:'$',    get:g=>g.val,
     note:'The ZIP value index for that month.'},
    {id:'cap',   name:'Cap rate',                    unit:'%',    get:g=>g.cap,
     note:'Median net operating income over price across the group, before financing, at the replay month.'},
    {id:'dscr',  name:'Debt service coverage',       unit:'x',    get:g=>g.dscr,
     note:'Median NOI over annual debt service. Below 1.20 most lenders decline the loan.'},
    {id:'ppsf',  name:'Price per square foot',       unit:'$/sf', get:g=>g.ppsf,
     note:'Median recorded value over published building area — only from records that carry an area.'},
    {id:'units', name:'Units per property',          unit:'units',get:g=>g.units,
     note:'Median published unit count. Band lower bounds are marked as such on the records themselves.'},
    {id:'bmkt',  name:'Below-market index',          unit:'',     get:g=>g.bmkt,
     note:'Median evidence of a gap to market, keeping recorded sale, price per foot and basis separate.'}
  ];
  const AX=Object.fromEntries(AXES.map(a=>[a.id,a]));

  let S={x:'cf', y:'yoy', by:'city', _retried:0, t:null, playing:false, timer:null, speed:1,
         classes:[], trail:true, built:null, hover:null};

  /* ---- group the edition, then walk the index history ------------------- */
  const MONTHS=()=>{ try{ return L().M.months||[]; }catch(e){ return []; } };
  const median=a=>{ if(!a.length) return null; const b=a.slice().sort((x,y)=>x-y); const m=b.length>>1; return b.length%2?b[m]:(b[m-1]+b[m])/2; };

  function classesOf(l){
    if(!window.LXView) return [];
    return LXView.CLASSES.filter(c=>{ try{ return c.test(l); }catch(e){ return false; } }).map(c=>c.id);
  }
  function passClass(l){
    if(!S.classes.length) return true;
    if(!window.LXView) return true;
    for(const id of S.classes){ const c=LXView.CLASSES.find(x=>x.id===id); if(c){ try{ if(c.test(l)) return true; }catch(e){} } }
    return false;
  }

  let _cache={};
  function cacheKey(){
    const VW=(window.LXView&&window.LXView.active())? JSON.stringify(LXView.state) : '';
    let n=0; try{ n=L().allListings().length; }catch(e){}
    return [S.by, S.classes.slice().sort().join("|"), VW, n, (S.x==="score"||S.y==="score")?"sc":"", (S.x==="bmkt"||S.y==="bmkt")?"bm":"", JSON.stringify(L().state.assump)].join("~");
  }
  function build(){
    const X=L(); if(!X) return null;
    const ck=cacheKey();
    if(_cache.key===ck) return _cache.val;
    const months=MONTHS(); if(!months.length) return null;
    const all=X.allListings().filter(passClass);
    const VW=(window.LXView&&window.LXView.active())? window.LXView : null;
    const pool=VW? all.filter(l=>VW.pass(l)) : all;

    /* Group, and cap each group's sample so the replay stays interactive. The
       replay runs 25 months x groups x sample deal() calls, so the sample is
       sized against the budget rather than fixed: a 161,000-record edition with
       42 groups used to cost about four seconds to build. */
    const wantScore=(S.x==='score'||S.y==='score');
    const wantBm=(S.x==='bmkt'||S.y==='bmkt');
    const BUDGET=90000;                       // total deal() calls across the replay
    const SAMPLE=Math.max(30, Math.min(160, Math.floor(BUDGET/(25*38))));
    const G={};
    for(let i=0;i<pool.length;i++){
      const l=pool[i];
      const k = S.by==='zip' ? (l.zip||'') : (l.city||'');
      if(!k) continue;
      const g=G[k]||(G[k]={key:k, n:0, sample:[], mix:{}});
      g.n++;
      if(g.sample.length<SAMPLE) g.sample.push(l);
      classesOf(l).forEach(c=>g.mix[c]=(g.mix[c]||0)+1);
    }
    let groups=Object.values(G).filter(g=>g.n>=12).sort((a,b)=>b.n-a.n).slice(0, 42);
    /* A single-city edition (New Orleans, Baton Rouge) has exactly one city, so
       grouping by city gives one bubble and no field at all. Fall back to ZIP
       automatically rather than showing the user a single dot. */
    if(groups.length<4 && S.by==='city' && !S._retried){
      S._retried=1; S.by='zip';
      const sel=$('#mfby'); if(sel) sel.value='zip';
      const lb=$('#mfbylabel'); if(lb) lb.textContent='ZIP';
      const r=build(); S._retried=0; return r;
    }
    /* a small edition still deserves a field — drop the support floor rather
       than returning nothing */
    if(groups.length<3) groups=Object.values(G).filter(g=>g.n>=3).sort((a,b)=>b.n-a.n).slice(0,42);
    if(!groups.length) return null;

    /* walk the months; at each one the app recomputes from that month's index */
    const prev=window.__lxAsOf;
    const frames=[];
    for(let t=0;t<months.length;t++){
      window.__lxAsOf=t;
      const row=[];
      for(const g of groups){
        const cfs=[], sc=[], caps=[], dsc=[], pps=[], uns=[], bms=[];
        let val=null, rent=null, yoy=null;
        for(const l of g.sample){
          let d=null; try{ d=X.deal(l); }catch(e){}
          if(!d) continue;
          cfs.push(d.cfMo); caps.push(d.cap);
          if(d.dscr&&isFinite(d.dscr)) dsc.push(d.dscr);
          const _p=l.price, _s=l.sqft;
          if(_p&&_s&&_s>120) pps.push(_p/_s);
          if(l.units&&l.units>0) uns.push(l.units);
          if(wantBm&&bms.length<50){ try{ const b=window.LXBM&&LXBM.assess(l); if(b&&b.idx!=null) bms.push(b.idx); }catch(e){} }
          /* fill each market field from the first record that actually has it —
             a ZIP with a value series but no rent series must not veto rent
             coming from the next record in the same group */
          if(d.mk){ if(val==null) val=d.mk.zhvi||d.mk.v; if(rent==null) rent=d.mk.zori||d.mk.r; if(yoy==null) yoy=d.mk.yoy; }
          /* analyze() is far heavier than deal() — it runs the whole scoring
             ensemble — so only pay for it when an axis actually asks for the
             score. That alone was most of the build cost. */
          if(wantScore && sc.length<50){ try{ const a=D()&&D().analyze(l); if(a) sc.push(a.score); }catch(e){} }
        }
        const _cap=median(caps);
        row.push({key:g.key, n:g.n, mix:g.mix,
          cf: median(cfs), score: median(sc), val, rent, yoy,
          cap: (_cap!=null&&isFinite(_cap))? _cap*100 : null,
          dscr: median(dsc), ppsf: median(pps), units: median(uns), bmkt: median(bms),
          yield: (val&&rent)? rent*12/val*100 : null});
      }
      frames.push(row);
    }
    window.__lxAsOf = prev==null? null : prev;
    if(window.__lxAsOf==null) delete window.__lxAsOf;

    /* the mosaic inside each bubble: seeds in a unit circle, one per share
       slice, then a Voronoi over them. Computed ONCE — motion only moves and
       scales the cached cell paths, which is what keeps the replay smooth. */
    groups.forEach(g=>{ g.cells=mosaic(g.mix); });
    /* a 1-year change cannot exist before there are 12 months behind it, so the
       replay opens on the newest month and the slider says where the yoy axis
       starts having anything to say */
    if(S.t==null || S.t>months.length-1) S.t=months.length-1;
    const val={months, groups, frames, yoyFrom:12};
    _cache={key:ck, val};
    return val;
  }

  /* Voronoi-in-bubble. Seed count per category is proportional to its share, so
     the coloured area comes out proportional too; a phyllotaxis layout spreads
     the seeds evenly, and Lloyd relaxation inside the circle tidies the cells. */
  function mosaic(mix){
    const ids=Object.keys(mix).filter(k=>mix[k]>0);
    if(!ids.length) return [];
    const total=ids.reduce((a,k)=>a+mix[k],0);
    const N=Math.max(7, Math.min(34, ids.length*6));
    const seeds=[];
    ids.forEach(id=>{
      const k=Math.max(1, Math.round(N*mix[id]/total));
      for(let i=0;i<k;i++) seeds.push({id});
    });
    const n=seeds.length;
    const GA=Math.PI*(3-Math.sqrt(5));
    seeds.forEach((s,i)=>{
      const r=Math.sqrt((i+0.5)/n)*0.97, a=i*GA;
      s.x=r*Math.cos(a); s.y=r*Math.sin(a);
    });
    // group like ids together so cells form contiguous wedges, not confetti
    seeds.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));
    seeds.forEach((s,i)=>{
      const r=Math.sqrt((i+0.5)/n)*0.97, a=(i/n)*Math.PI*2*Math.max(1,Math.round(n/9)) + (i%3)*0.4;
      s.x=r*Math.cos(a); s.y=r*Math.sin(a);
    });
    if(!(window.d3 && d3.Delaunay)) return seeds.map(s=>({id:s.id, poly:null, x:s.x, y:s.y}));
    let pts=seeds.map(s=>[s.x,s.y]);
    let cells=null;
    for(let pass=0; pass<3; pass++){
      const del=d3.Delaunay.from(pts);
      const vor=del.voronoi([-1,-1,1,1]);
      cells=pts.map((p,i)=>vor.cellPolygon(i));
      if(pass<2){
        pts=cells.map((poly,i)=>{
          if(!poly) return pts[i];
          let cx=0,cy=0; for(const q of poly){ cx+=q[0]; cy+=q[1]; }
          cx/=poly.length; cy/=poly.length;
          const d=Math.hypot(cx,cy); if(d>0.94){ cx*=0.94/d; cy*=0.94/d; }
          return [cx,cy];
        });
      }
    }
    return seeds.map((s,i)=>({id:s.id, poly:cells[i], x:pts[i][0], y:pts[i][1]}));
  }

  /* ---------------------------------------------------------------- render */
  function render(){
    const host=$('#motionroot'); if(!host) return;
    if(!host.dataset.built){
      host.dataset.built='1';
      host.innerHTML=shell();
      wire(host);
    }
    S.built=build();
    paintChips();
    if(!S.built){
      const cv=$('#mfcv'); if(cv){ const ctx=cv.getContext('2d');
        cv.width=cv.clientWidth; cv.height=cv.clientHeight;
        ctx.fillStyle=(P()?P().tok('--muted'):'#888'); ctx.font='13px var(--sans)'; ctx.textAlign='center';
        ctx.fillText('Not enough records with a published index series to build a motion field'+(S.classes.length?' in the selected categories.':' in this edition.'), cv.width/2, cv.height/2);
      }
      return;
    }
    draw();
  }

  function shell(){
    return `
    <div class="chart tall" data-panel data-panel-title="Motion field — replay">
      <div class="eyebrow">Locator X matrix &middot; motion field</div>
      <h3 style="margin:2px 0 4px">Every market as a bubble, replayed month by month</h3>
      <p class="chartnote" style="margin:0 0 8px">One bubble per <b id="mfbylabel">city</b>; area is how many tracked records sit behind it; the mosaic inside is a Voronoi of the asset classes that make it up. Drag the slider to replay the published index history &mdash; at each month the app recomputes with its own formulas and your own assumptions. Prices stay the price on the public record; what moves is the ZIP's published value and rent index.</p>
      <div class="toolbar" style="gap:8px;margin:0 0 8px;flex-wrap:wrap">
        <label style="font-size:12px;color:var(--ink2)">x <select id="mfx"></select></label>
        <label style="font-size:12px;color:var(--ink2)">y <select id="mfy"></select></label>
        <label style="font-size:12px;color:var(--ink2)">group by <select id="mfby"><option value="city">city</option><option value="zip">ZIP</option></select></label>
        <label style="font-size:12px;color:var(--ink2)"><input type="checkbox" id="mftrail" checked> trails</label>
        <span style="flex:1"></span>
        <button class="btn primary" id="mfplay">&#9654; Play</button>
        <select id="mfspeed" title="Replay speed"><option value="0.5">0.5&times;</option><option value="1" selected>1&times;</option><option value="2">2&times;</option><option value="4">4&times;</option></select>
      </div>
      <p id="mfwarn" class="chartnote" style="margin:0 0 6px;color:var(--warn)"></p>
      <div id="mfchips" class="toolbar" style="gap:6px;margin:0 0 8px;flex-wrap:wrap"></div>
      <div style="position:relative"><canvas id="mfcv" style="width:100%;height:430px;display:block;border-radius:10px;border:1px solid var(--line);cursor:crosshair"></canvas></div>
      <div class="toolbar" style="gap:10px;margin:8px 0 0">
        <input type="range" id="mft" min="0" max="24" value="24" step="1" style="flex:1">
        <b class="num" id="mflabel" style="min-width:78px;text-align:right"></b>
      </div>
      <div id="mflegend"></div>
      <p class="src">The replay is a reconstruction from the published ZIP value and rent index, month by month, run through this app's own engine. It is <b>not</b> a record of past listings, rents actually collected, or cash flow anyone actually earned, and a group's bubble moving right does not mean any single property in it improved. Click a bubble to list the records behind it.</p>
    </div>`;
  }

  function paintChips(){
    const box=$('#mfchips'); if(!box) return;
    const CL=(window.LXView&&LXView.CLASSES)||[];
    box.innerHTML='<span style="font-size:11.5px;color:var(--muted);align-self:center">show</span>'
      + `<button class="chip${S.classes.length?'':' on'}" data-mfc="">All categories</button>`
      + CL.map(c=>{
          const on=S.classes.indexOf(c.id)>=0;
          const col=clsColor(CL.indexOf(c));
          return `<button class="chip${on?' on':''}" data-mfc="${esc(c.id)}">${P()?P().swatch(col,'circle',9):''} ${esc(c.name)}</button>`;
        }).join('');
    $$('#mfchips [data-mfc]').forEach(b=>b.addEventListener('click',()=>{
      const id=b.dataset.mfc;
      if(!id) S.classes=[];
      else { const i=S.classes.indexOf(id); if(i>=0) S.classes.splice(i,1); else S.classes.push(id); }
      S.built=build(); paintChips(); draw();
    }));
  }

  function wire(host){
    const selX=$('#mfx'), selY=$('#mfy');
    AXES.forEach(a=>{
      selX.insertAdjacentHTML('beforeend', `<option value="${a.id}"${a.id===S.x?' selected':''}>${a.name}</option>`);
      selY.insertAdjacentHTML('beforeend', `<option value="${a.id}"${a.id===S.y?' selected':''}>${a.name}</option>`);
    });
    const axisChanged=()=>{ if((S.x==='score'||S.y==='score'||S.x==='bmkt'||S.y==='bmkt')){ _cache={}; S.built=build(); } draw(); };
    selX.addEventListener('change',e=>{ S.x=e.target.value; axisChanged(); });
    selY.addEventListener('change',e=>{ S.y=e.target.value; axisChanged(); });
    $('#mfby').addEventListener('change',e=>{ S.by=e.target.value; $('#mfbylabel').textContent=S.by; S.built=build(); draw(); });
    $('#mftrail').addEventListener('change',e=>{ S.trail=e.target.checked; draw(); });
    $('#mfspeed').addEventListener('change',e=>{ S.speed=+e.target.value; if(S.playing){ stop(); play(); } });
    $('#mfplay').addEventListener('click',()=>S.playing?stop():play());
    const sl=$('#mft');
    sl.addEventListener('input',e=>{ S.t=+e.target.value; stop(); draw(); });
    const cv=$('#mfcv');
    cv.addEventListener('pointermove',e=>hover(e,cv));
    cv.addEventListener('pointerleave',()=>{ S.hover=null; P()&&P().tipHide(); draw(); });
    cv.addEventListener('click',()=>{ if(S.hover) openGroup(S.hover); });
    window.addEventListener('resize',()=>{ clearTimeout(window.__mfrz); window.__mfrz=setTimeout(draw,180); });
  }
  function play(){
    const months=MONTHS(); if(!months.length) return;
    S.playing=true; $('#mfplay').innerHTML='&#10073;&#10073; Pause';
    S.timer=setInterval(()=>{
      S.t=(S.t+1)%months.length;
      const sl=$('#mft'); if(sl) sl.value=S.t;
      draw();
    }, Math.max(90, 520/S.speed));
  }
  function stop(){ S.playing=false; clearInterval(S.timer); S.timer=null; const b=$('#mfplay'); if(b) b.innerHTML='&#9654; Play'; }

  let HIT=[];
  function draw(){
    const cv=$('#mfcv'); if(!cv||!S.built) return;
    const B=S.built, months=B.months;
    S.t=Math.min(S.t==null?months.length-1:S.t, months.length-1);
    const sl=$('#mft'); if(sl){ sl.max=months.length-1; sl.value=S.t; }
    const lab=$('#mflabel'); if(lab) lab.textContent=(months[S.t]||'').slice(0,7);
    const needsYoY=(S.x==='yoy'||S.y==='yoy');
    const warn=$('#mfwarn');
    if(warn) warn.innerHTML = (needsYoY && S.t<12)
      ? '<b>No 1-year change yet at this month.</b> A 12-month change needs twelve months behind it, and this index series starts at '+((months[0]||'').slice(0,7))+' — scrub to '+((months[12]||'').slice(0,7))+' or later, or pick a different axis.'
      : '';

    const ctx=cv.getContext('2d');
    const DPR=Math.min(2, window.devicePixelRatio||1);
    const W=cv.clientWidth||760, H=cv.clientHeight||430;
    cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
    const css=n=>P()? P().tok(n) : '#888';
    ctx.clearRect(0,0,W,H);

    const pl=64, pr=18, pt=16, pb=42;
    const ax=AX[S.x], ay=AX[S.y];
    /* scales are fixed across the WHOLE replay, so motion is real motion and
       not the axis rescaling underneath the bubbles */
    let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity, nmax=1;
    B.frames.forEach(row=>row.forEach(g=>{
      const vx=ax.get(g), vy=ay.get(g);
      if(vx!=null&&isFinite(vx)){ x0=Math.min(x0,vx); x1=Math.max(x1,vx); }
      if(vy!=null&&isFinite(vy)){ y0=Math.min(y0,vy); y1=Math.max(y1,vy); }
      nmax=Math.max(nmax,g.n);
    }));
    if(!isFinite(x0)){ ctx.fillStyle=css('--muted'); ctx.font='13px var(--sans)'; ctx.fillText('No group in this edition has a published index series for that measure.', 16, 30); return; }
    const padx=(x1-x0)*0.10||1, pady=(y1-y0)*0.10||1;
    x0-=padx; x1+=padx; y0-=pady; y1+=pady;
    const X_=v=>pl+(v-x0)/(x1-x0)*(W-pl-pr);
    const Y_=v=>H-pb-(v-y0)/(y1-y0)*(H-pt-pb);

    // grid + zero lines
    ctx.strokeStyle=css('--line'); ctx.lineWidth=1;
    for(let i=0;i<=4;i++){
      const y=pt+i*(H-pt-pb)/4; ctx.beginPath(); ctx.moveTo(pl,y); ctx.lineTo(W-pr,y); ctx.stroke();
      const x=pl+i*(W-pl-pr)/4; ctx.beginPath(); ctx.moveTo(x,pt); ctx.lineTo(x,H-pb); ctx.stroke();
    }
    ctx.fillStyle=css('--muted'); ctx.font='10px var(--mono)'; ctx.textAlign='right';
    for(let i=0;i<=4;i++){ const v=y1-(y1-y0)*i/4; ctx.fillText(fmtAx(v,ay), pl-6, pt+i*(H-pt-pb)/4+3); }
    ctx.textAlign='center';
    for(let i=0;i<=4;i++){ const v=x0+(x1-x0)*i/4; ctx.fillText(fmtAx(v,ax), pl+i*(W-pl-pr)/4, H-pb+14); }
    if(x0<0&&x1>0){ ctx.strokeStyle=css('--line2'); ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(X_(0),pt); ctx.lineTo(X_(0),H-pb); ctx.stroke(); ctx.setLineDash([]); }
    if(y0<0&&y1>0){ ctx.strokeStyle=css('--line2'); ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(pl,Y_(0)); ctx.lineTo(W-pr,Y_(0)); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle=css('--ink2'); ctx.font='11px var(--sans)';
    ctx.fillText(ax.name+(ax.unit?' ('+ax.unit+')':''), (pl+W-pr)/2, H-6);
    ctx.save(); ctx.translate(13,(pt+H-pb)/2); ctx.rotate(-Math.PI/2); ctx.textAlign='center';
    ctx.fillText(ay.name+(ay.unit?' ('+ay.unit+')':''), 0, 0); ctx.restore();

    // trails
    const row=B.frames[S.t];
    if(S.trail){
      ctx.lineWidth=1.4;
      row.forEach((g,gi)=>{
        ctx.beginPath(); let started=false;
        for(let t=Math.max(0,S.t-11); t<=S.t; t++){
          const q=B.frames[t][gi]; const vx=ax.get(q), vy=ay.get(q);
          if(vx==null||vy==null) continue;
          const px=X_(vx), py=Y_(vy);
          if(!started){ ctx.moveTo(px,py); started=true; } else ctx.lineTo(px,py);
        }
        ctx.strokeStyle='rgba(125,135,131,.30)'; ctx.stroke();
      });
    }

    // bubbles, far (large) first so small ones stay clickable on top
    HIT=[];
    const order=row.map((g,i)=>i).sort((a,b)=>row[b].n-row[a].n);
    for(const gi of order){
      const g=row[gi], src=B.groups[gi];
      const vx=ax.get(g), vy=ay.get(g);
      if(vx==null||vy==null||!isFinite(vx)||!isFinite(vy)) continue;
      const px=X_(vx), py=Y_(vy);
      const r=6+Math.sqrt(g.n/nmax)*Math.min(W,H)*0.115;
      drawBubble(ctx, px, py, r, src, S.hover===src.key);
      HIT.push({key:src.key, x:px, y:py, r, g});
    }
    // direct labels on the biggest few — identity is never colour alone
    ctx.font='600 11px var(--sans)'; ctx.textAlign='center'; ctx.fillStyle=css('--ink');
    HIT.slice(0,6).forEach(h=>{
      ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=3;
      ctx.strokeText(h.key, h.x, h.y-h.r-4); ctx.fillText(h.key, h.x, h.y-h.r-4);
    });
    paintLegend();
  }
  function fmtAx(v, a){
    if(a.id==='val') return '$'+(v/1000).toFixed(0)+'k';
    if(a.id==='rent'||a.id==='cf') return (v<0?'-$':'$')+Math.abs(Math.round(v)).toLocaleString();
    if(a.unit==='%') return v.toFixed(1)+'%';
    return Math.round(v).toLocaleString();
  }

  function drawBubble(ctx, cx, cy, r, src, hot){
    const CL=(window.LXView&&LXView.CLASSES)||[];
    const colOf=id=>clsColor(CL.findIndex(c=>c.id===id));
    ctx.save();
    ctx.beginPath(); ctx.arc(cx,cy,r,0,6.283); ctx.clip();
    if(src.cells && src.cells.length){
      src.cells.forEach(c=>{
        ctx.beginPath();
        if(c.poly){
          ctx.moveTo(cx+c.poly[0][0]*r, cy+c.poly[0][1]*r);
          for(let i=1;i<c.poly.length;i++) ctx.lineTo(cx+c.poly[i][0]*r, cy+c.poly[i][1]*r);
          ctx.closePath();
        } else { ctx.arc(cx+c.x*r, cy+c.y*r, r*0.28, 0, 6.283); }
        ctx.fillStyle=colOf(c.id); ctx.globalAlpha=hot?0.95:0.80; ctx.fill();
        ctx.globalAlpha=1;
        /* a 2px surface gap between fills keeps adjacent cells legible */
        ctx.strokeStyle=P()?P().tok('--panel'):'#fff'; ctx.lineWidth=1.6; ctx.stroke();
      });
    } else {
      ctx.fillStyle=P()?P().tok('--muted'):'#999'; ctx.globalAlpha=.6; ctx.fillRect(cx-r,cy-r,2*r,2*r); ctx.globalAlpha=1;
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx,cy,r,0,6.283);
    ctx.strokeStyle=hot? (P()?P().tok('--accent'):'#e24e1b') : 'rgba(30,40,38,.45)';
    ctx.lineWidth=hot?2.6:1.2; ctx.stroke();
  }

  function paintLegend(){
    const box=$('#mflegend'); if(!box) return;
    const CL=(window.LXView&&LXView.CLASSES)||[];
    const present={};
    (S.built.groups||[]).forEach(g=>Object.keys(g.mix).forEach(k=>present[k]=(present[k]||0)+g.mix[k]));
    const items=CL.filter(c=>present[c.id]).map(c=>({
      label:c.name, value:fmtN(present[c.id]),
      color:clsColor(CL.indexOf(c)), shape:'circle'}));
    box.innerHTML=(P()? P().legend(items, {note:'&middot; cells inside each bubble are a Voronoi of that market’s asset mix &middot; bubble area = records behind it'}) : '');
  }

  function hover(e, cv){
    const rect=cv.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    let hit=null;
    for(let i=HIT.length-1;i>=0;i--){ const h=HIT[i]; if((mx-h.x)**2+(my-h.y)**2 <= h.r*h.r){ hit=h; break; } }
    const key=hit? hit.key : null;
    if(key!==S.hover){ S.hover=key; draw(); }
    if(!hit){ P()&&P().tipHide(); return; }
    const CL=(window.LXView&&LXView.CLASSES)||[];
    const mix=Object.entries(hit.g.mix).sort((a,b)=>b[1]-a[1]).slice(0,5)
      .map(([k,v])=>{ const c=CL.find(x=>x.id===k); const col=clsColor(CL.findIndex(x=>x.id===k));
        return `${P()?P().swatch(col,'circle',9):''} ${esc(c?c.name:k)} <b>${fmtN(v)}</b>`; }).join('<br>');
    const months=S.built.months;
    P()&&P().tip(e, `<b>${esc(hit.key)}</b> &middot; ${(months[S.t]||'').slice(0,7)}<br>`
      + `${fmtN(hit.g.n)} records<br>`
      + `${esc(AX[S.x].name)}: <b>${hit.g[S.x]==null?'—':fmtAx(AX[S.x].get(hit.g),AX[S.x])}</b><br>`
      + `${esc(AX[S.y].name)}: <b>${hit.g[S.y]==null?'—':fmtAx(AX[S.y].get(hit.g),AX[S.y])}</b><br>`
      + `<span style="color:var(--muted)">asset mix</span><br>${mix}<br><span style="color:var(--muted)">click to list the records</span>`);
  }

  function openGroup(key){
    const X=L(); if(!X) return;
    const VW=(window.LXView&&window.LXView.active())? window.LXView : null;
    let rows=X.allListings().filter(passClass);
    if(VW) rows=rows.filter(l=>VW.pass(l));
    rows = rows.filter(l => S.by==='zip' ? String(l.zip)===String(key) : l.city===key);
    const months=S.built? S.built.months : [];
    window.LXPal&&LXPal.drill(key, rows, {eyebrow:'Motion field',
      note:`Every tracked record in ${key}${S.classes.length?' inside the selected categories':''}. The bubble’s position was computed from the ZIP index published in ${(months[S.t]||'').slice(0,7)}; these records and their prices are the current public record.`});
  }

  if(window.LXBub) window.LXBub.subscribe(function(){ try{ if(document.querySelector('#dash.active') && S.built && !S.playing) draw(); }catch(e){} });
  window.LXMotion={render, build, draw, get state(){ return S; }};
})();
