/* locator.x — pattern mining and predictive automations.
   Mines the loaded records for attribute combinations that actually predict a good outcome,
   shows the comparable set behind any property, and turns any pattern into a saved rule that
   flags matching records from then on. Everything is measured on this edition's own data —
   these are observed associations, not causal claims or forecasts. */
(function(){
'use strict';
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const L=()=>window.LX, D=()=>window.LXDash;
const KEY='lxauto';
let AUTO=(function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } })();
const save=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(AUTO)); }catch(e){} };

/* ---------- outcomes worth predicting ---------- */
const OUTCOMES=[
 {id:'score',kind:'rel', name:'Top-decile Locator.X score', q:0.90, metric:r=>r.score},
 {id:'cfrel',kind:'rel', name:'Top-decile cash flow (best in this edition)', q:0.90, metric:r=>r.d?r.d.cfMo:null},
 {id:'caprel',kind:'rel',name:'Top-decile cap rate', q:0.90, metric:r=>r.d?r.d.cap:null},
 {id:'dscr', kind:'rel', name:'Top-decile debt coverage (DSCR)', q:0.90, metric:r=>r.d?r.d.dscr:null},
 {id:'bmkt', kind:'rel', name:'Top-decile below-market index', q:0.90, metric:r=>{ try{ const a=window.LXBM&&LXBM.assess(r.l); return a?a.idx:null; }catch(e){ return null; } }},
 {id:'stud', kind:'rel', name:'Top-decile student-housing fit', q:0.90, metric:r=>{ try{ const s2=window.LXCampus&&LXCampus.suitability(r.l); return s2?s2.score:null; }catch(e){ return null; } }},
 {id:'cf',   kind:'abs', name:'Cash-flow positive at your assumptions', test:r=>!!r.d&&r.d.cf>0},
 {id:'cap6', kind:'abs', name:'Cap rate 6% or better',                  test:r=>!!r.d&&r.d.cap>=6},
 {id:'hack', kind:'abs', name:'Qualifies as a house hack',              test:r=>r.cat==='hack'}
];
/* ---------- the attributes we test ---------- */
/* An alias line that runs off the page hides the statistics it sits next to,
   which is worse than not showing the alias at all. One alias, clipped, with the
   rest on hover. */
function clipShort(t){ t=String(t||''); return t.length>34 ? t.slice(0,33).replace(/[ ,;:\u2014-]+$/,'')+'\u2026' : t; }
function clipLabel(t){ t=String(t||''); return t.length>52 ? t.slice(0,51).replace(/[ ,;:]+$/,'')+'\u2026' : t; }
function bandPrice(p){ if(p==null) return null; const B=[[0,250e3,'under $250k'],[250e3,500e3,'$250-500k'],[500e3,750e3,'$500-750k'],[750e3,1e6,'$750k-1M'],[1e6,2e6,'$1-2M'],[2e6,1e12,'over $2M']]; const b=B.find(x=>p>=x[0]&&p<x[1]); return b?b[2]:null; }
function bandUnits(u){ u=u||1; return u>=20?'20+ units':u>=5?'5-19 units':u>=2?'2-4 units':'single unit'; }
function bandYear(y){ if(!y) return null; return y<1940?'built pre-1940':y<1970?'built 1940-69':y<2000?'built 1970-99':'built 2000+'; }
function bandSqft(s){ if(!s) return null; return s<1000?'under 1,000 sf':s<2000?'1,000-2,000 sf':s<4000?'2,000-4,000 sf':'over 4,000 sf'; }

/* ---------- dimensions that come from the time series and from what happened
   to the corridor, rather than from the parcel record itself ----------

   These are the three that let a pattern say something a cross-section cannot.
   All three are computed once and cached, and all three return NULL where the
   input is missing - a ZIP with no published index does not become a zero
   trend, it drops out of the dimension entirely and the miner never sees it.
   That is the difference between "we do not know" and "it is flat", and only
   one of them is true. */
let TRENDQ = null;
function trendBands(){
  if(TRENDQ) return TRENDQ;
  TRENDQ = {val:{}, rent:{}, cutsV:null, cutsR:null};
  const P = window.LXPredict;
  if(!P) return TRENDQ;
  let D = null;
  try{ D = P.data(); }catch(e){}
  if(!D) return TRENDQ;
  const q = (arr, f) => { const v = arr.slice().sort((a,b)=>a-b); return v.length? v[Math.min(v.length-1, Math.floor(f*v.length))] : null; };
  for(const which of ['val','rent']){
    const src = which==='val' ? D.val : D.rent, rates = [], per = {};
    for(const z in src){
      let f = null; try{ f = P.forecastZip(z, which); }catch(e){}
      if(!f || f.annual == null || !isFinite(f.annual)) continue;
      per[z] = f.annual; rates.push(f.annual);
    }
    if(rates.length < 12){ continue; }          /* too few series to band at all */
    const c = [q(rates,0.25), q(rates,0.50), q(rates,0.75)];
    TRENDQ[which==='val'?'cutsV':'cutsR'] = c;
    for(const z in per){
      const r = per[z];
      TRENDQ[which][z] = r <= c[0] ? ('bottom quartile')
                       : r <= c[1] ? ('below median')
                       : r <= c[2] ? ('above median')
                                   : ('top quartile');
    }
  }
  return TRENDQ;
}
/* nearest cancelled or closed project - the merge of September 2026 put three
   dead Louisiana projects into the layer, and "sits inside 25 km of capital that
   was withdrawn" is a property of a location that no parcel field records */
function deadNear(l){
  try{
    const nr = window.LXCorp && LXCorp.nearest(l);
    if(!nr || !nr.dead || nr.deadKm == null) return null;
    return nr.deadKm <= 15 ? 'within 15km of a cancelled project'
         : nr.deadKm <= 40 ? 'within 40km of a cancelled project' : null;
  }catch(e){ return null; }
}

const DIMS=[
 {id:'city',  name:'City',        get:l=>l.city||null},
 {id:'kind',  name:'Property type',get:l=>l.kind||null},
 {id:'zip',   name:'ZIP',         get:l=>l.zip?('ZIP '+l.zip):null},
 {id:'price', name:'Price band',  get:l=>bandPrice(L().price(l))},
 {id:'units', name:'Unit count',  get:l=>bandUnits(l.units)},
 {id:'year',  name:'Vintage',     get:l=>bandYear(l.year)},
 {id:'sqft',  name:'Size',        get:l=>bandSqft(l.sqft)},
 /* l.priceDate is the assessor's recorded or reassessed value date, present
    on every record; l.sale/l.saleDate is a real transaction, populated only
    where one exists (comps.js's own 'sale' vs 'postsale' basis). This
    dimension used to read priceDate alone and call it a sale regardless -
    the same mislabeling four other places had (app.js's recordDate() fix) -
    so a record with no real sale at all could still be bucketed "sale since
    2024" on nothing but a reassessment date, and a record with a genuine
    recent sale but no priceDate fell to "no sale date". */
 {id:'basis', name:'Price basis', get:l=>l.est?'modeled estimate':(l.sale && l.saleDate? (l.saleDate>='2024-01-01'?'sale since 2024':'older recorded sale') : l.priceDate? (l.priceDate>='2024-01-01'?'assessed since 2024':'older assessed value') : 'no dated basis')},
 {id:'conv',  name:'Class',       get:l=>l.cv?'conversion class':null},
 {id:'land',  name:'Structure',   get:l=>{ try{ return window.LXView? (LXView.isLand(l)?'land only':'improved building') : null; }catch(e){ return null; } }},
 {id:'corp',  name:'Live project nearby', get:l=>{ try{ const n=window.LXCorp&&LXCorp.nearest(l); if(!n||n.km==null) return null; return n.km<=10? 'within 10km of a live announced project' : n.km<=25? 'within 25km of a live announced project' : null; }catch(e){ return null; } }},
 {id:'dead',  name:'Cancelled project', get:deadNear},
 {id:'vtrend',name:'ZIP value trend',   get:l=>{ const b=trendBands(); return (l.zip && b.val[l.zip]) || null; }},
 {id:'rtrend',name:'ZIP rent trend',    get:l=>{ const b=trendBands(); return (l.zip && b.rent[l.zip]) || null; }}
];

/* ---------- what makes a lift number mean anything ----------
   The engine below searches on the order of a hundred candidate patterns and
   then reports the largest lift it found. That is a maximum over many tests, and
   a maximum over many tests is biased upward even when nothing is going on: give
   a hundred fair coins twenty flips each and one of them will look loaded. Three
   guards, all of them cheap, all of them things a lift table normally omits:

     1. SPLIT. Patterns are found on one half of the records and their lift is
        MEASURED on the other half, which the search never saw. The held-out lift
        is what gets reported. The gap between the two is the overfitting, and it
        is printed rather than hidden.

     2. AN INTERVAL. A Wilson score interval on the hit rate, turned into a lift
        interval. A pattern whose interval covers 1.00 has not been shown to do
        anything, however large its point estimate, and this engine says so on
        the row instead of colouring it green.

     3. THE COUNT. How many candidates were tested is stated, so the reader can
        judge the maximum for what it is.

   Wilson rather than the normal approximation because the rates here are often
   near 0 or 1 with modest n, exactly where the normal interval runs past the
   ends of the scale and stops being a probability. */
const Z = 1.96;                                  /* 95% */
function wilson(h, n){
  if(!n) return [0, 1];
  const p = h / n, z2 = Z * Z;
  const d = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / d;
  const half = (Z / d) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
  return [Math.max(0, c - half), Math.min(1, c + half)];
}
/* a deterministic split, so the same edition always splits the same way and a
   pattern does not change its verdict when you switch tabs and come back */
function fold(i){ let x = (i * 2654435761) >>> 0; x ^= x >>> 15; return (x & 1) === 0; }

const MIN_SUPPORT=25;
const MIN_TEST=12;   /* below this the held-out half says nothing */

let mined=null, minedSig='', OUT='score';
function mine(){
  const X=L();
  const rows=D().rows.length? D().rows : (D().render(), D().rows);
  const sig=rows.length+':'+OUT+':'+(window.__lxAsOf==null?'-':window.__lxAsOf)+':'+((window.LXView&&LXView.active())?JSON.stringify(LXView.state):0);
  /* the trend dimensions are derived from the index at the current as-of month,
     so moving the month must invalidate them along with the mine */
  if(minedSig && minedSig.split(':')[2] !== String(window.__lxAsOf==null?'-':window.__lxAsOf)){ TRENDQ=null; try{ window.LXPredict&&LXPredict.invalidate(); }catch(e){} }
  if(mined&&minedSig===sig) return mined;
  const oc=OUTCOMES.find(o=>o.id===OUT)||OUTCOMES[0];
  const cap=Math.min(rows.length, (oc.kind==='rel'&&(oc.id==='bmkt'||oc.id==='stud'))?18000:45000);
  /* Stride sample, not the first N: the record order is source-grouped, so a
     head slice would mine one county's quirks and call them the market's. */
  const step=Math.max(1, Math.floor(rows.length/cap));
  const sample=[]; for(let i=0;i<rows.length && sample.length<cap;i+=step) sample.push(rows[i]);
  let base=0, thr=null, cover=null;
  const hit=new Array(sample.length);
  if(oc.kind==='rel'){
    /* A relative outcome asks "which attributes concentrate the best records in
       THIS edition" — it always has a base rate, so mining stays meaningful even
       where no property clears an absolute bar. The cut is a quantile of the
       records that actually carry the metric. */
    const vals=[];
    const mv=new Array(sample.length);
    for(let i=0;i<sample.length;i++){ const v=oc.metric(sample[i]); mv[i]=(v==null||!isFinite(v))?null:v; if(mv[i]!=null) vals.push(mv[i]); }
    cover=vals.length/Math.max(1,sample.length);
    vals.sort((a,b)=>a-b);
    thr = vals.length? vals[Math.min(vals.length-1, Math.floor(oc.q*vals.length))] : null;
    for(let i=0;i<sample.length;i++){ const h = thr!=null && mv[i]!=null && mv[i]>=thr; hit[i]=h; if(h) base++; }
  } else {
    for(let i=0;i<sample.length;i++){ const h=!!oc.test(sample[i]); hit[i]=h; if(h) base++; }
  }
  const baseRate=base/Math.max(1,sample.length);
  const tally={};
  for(let i=0;i<sample.length;i++){
    const l=sample[i].l;
    for(const d of DIMS){
      const v=d.get(l); if(v==null) continue;
      const k=d.id+''+v;
      const t=tally[k]||(tally[k]={n:0,h:0,dim:d,val:v});
      t.n++; if(hit[i]) t.h++;
    }
  }
  /* --- split into a search half and a held-out half --- */
  const trIdx=[], teIdx=[];
  for(let i=0;i<sample.length;i++) (fold(i)?trIdx:teIdx).push(i);
  const rateOf=idx=>{ let n=0,h=0; for(const i of idx){ n++; if(hit[i]) h++; } return {n,h,r:n?h/n:0}; };
  const trBase=rateOf(trIdx), teBase=rateOf(teIdx);

  /* measure one candidate on an arbitrary index set */
  const measure=(idx, test, want)=>{ let n=0,h=0; const mem=want?[]:null;
    for(const i of idx){ if(!test(sample[i].l)) continue; n++; if(hit[i]) h++; if(mem) mem.push(i); }
    return {n,h,mem}; };

  /* --- singles, searched on the TRAINING half only --- */
  const trTally={};
  for(const i of trIdx){
    const l=sample[i].l;
    for(const d of DIMS){ const v=d.get(l); if(v==null) continue;
      const k=d.id+''+v; const t=trTally[k]||(trTally[k]={n:0,h:0,dim:d,val:v});
      t.n++; if(hit[i]) t.h++; }
  }
  let tested=0;
  let singles=Object.values(trTally).filter(t=>t.n>=MIN_SUPPORT).map(t=>{
    tested++;
    return {dims:[t.dim.id], label:t.dim.name+': '+clipLabel(t.val), keys:[[t.dim.id,t.val]],
            trN:t.n, trRate:t.h/t.n, trLift:(t.h/t.n)/Math.max(1e-9,trBase.r)};
  });
  singles.sort((a,b)=>b.trLift-a.trLift);

  /* --- pairs, built from the strongest singles, still training-only --- */
  const top=singles.filter(s2=>s2.trN>=MIN_SUPPORT*2).slice(0,14);
  const pairs=[];
  for(let a=0;a<top.length;a++) for(let b=a+1;b<top.length;b++){
    if(top[a].dims[0]===top[b].dims[0]) continue;
    const da=DIMS.find(d=>d.id===top[a].dims[0]), db=DIMS.find(d=>d.id===top[b].dims[0]);
    const va=top[a].keys[0][1], vb=top[b].keys[0][1];
    const test=l=>da.get(l)===va&&db.get(l)===vb;
    const m2=measure(trIdx, test); tested++;
    /* Drop pairs where one attribute all but implies the other (ZIP x its own
       city): the pair restates the single and inflates the list. */
    if(m2.n>=0.92*Math.min(top[a].trN, top[b].trN)) continue;
    if(m2.n>=MIN_SUPPORT) pairs.push({dims:[da.id,db.id],
      label:da.name+': '+clipShort(va)+'  \u00d7  '+db.name+': '+clipShort(vb), keys:[[da.id,va],[db.id,vb]],
      trN:m2.n, trRate:m2.h/m2.n, trLift:(m2.h/m2.n)/Math.max(1e-9,trBase.r)});
  }

  /* --- score every candidate on the HELD-OUT half --- */
  const cands=singles.concat(pairs);
  const scored=[];
  for(const c of cands){
    const test=l=>c.keys.every(([id,val])=>{ const d=DIMS.find(x=>x.id===id); return d&&d.get(l)===val; });
    const m3=measure(teIdx, test, true);
    if(m3.n<MIN_TEST) continue;                  /* nothing to check it against */
    const rate=m3.h/m3.n;
    const lift=rate/Math.max(1e-9, teBase.r);
    const [lo,hi]=wilson(m3.h, m3.n);
    /* At a 100% hit rate Wilson's upper bound IS the rate, and the two arrive at
       the same number by different arithmetic - they can differ in the last bit.
       A point estimate must lie inside its own interval by construction, so it
       is clamped rather than left to a float comparison. */
    const lLo=Math.min(lift, lo/Math.max(1e-9, teBase.r));
    const lHi=Math.max(lift, hi/Math.max(1e-9, teBase.r));
    scored.push(Object.assign({}, c, {
      n:m3.n, h:m3.h, rate, lift,
      liftLo: lLo,
      liftHi: lHi,
      /* a pattern is only "held" if its interval clears 1 on data the search
         never touched. Everything else is a candidate, and is labelled one. */
      held: (lo/Math.max(1e-9, teBase.r)) > 1,
      shrink: c.trLift ? (c.trLift - lift)/c.trLift : null,
      mem: m3.mem
    }));
  }
  scored.sort((a,b)=>(b.held-a.held)||(b.liftLo-a.liftLo)||(b.n-a.n));

  /* --- collapse candidates that are the same records under two names ---
     "ZIP: 94010" and "City: Burlingame" cover the same 890 parcels and produce
     identical statistics, so an unfiltered table spends its top four rows saying
     two things twice. Keep the first, note the alias on it, and drop the rest.
     Overlap is measured on the held-out membership rather than guessed from the
     dimension names, because the relationship is a fact about these records and
     not about the schema - a city with one ZIP and a city with nine behave
     completely differently here. */
  const DUP=0.92;
  const preCollapse = scored.length;     /* after the MIN_TEST filter, before dedup */
  const kept=[];
  for(const c of scored){
    const setC=new Set(c.mem);
    let alias=null;
    for(const k of kept){
      let inter=0; for(const i of k.mem) if(setC.has(i)) inter++;
      if(inter >= DUP*Math.min(k.n, c.n)){ alias=k; break; }
    }
    if(alias){ (alias.aliases||(alias.aliases=[])).push(c.label); continue; }
    kept.push(c);
  }
  kept.forEach(c=>{ delete c.mem; });
  scored.length=0; Array.prototype.push.apply(scored, kept);

  /* The largest lift arithmetically possible is 1/base: a group in which the
     outcome happens every single time. Several patterns land exactly there, and
     a reader who does not know the ceiling reads 8.31x as "unusually strong"
     rather than "saturated, and so is everything tied with it". */
  const ceiling = teBase.r>0 ? 1/teBase.r : null;
  const medShrink=(()=>{ const v=scored.map(p=>p.shrink).filter(x=>x!=null&&isFinite(x)).sort((a,b)=>a-b);
    return v.length? v[Math.floor(v.length/2)] : null; })();

  const held=scored.filter(p=>p.held);
  mined={baseRate, sampled:sample.length, outcome:oc, thr, cover, hits:base,
         trN:trBase.n, teN:teBase.n, trBase:trBase.r, teBase:teBase.r,
         tested, heldCount:held.length, medShrink, ceiling,
         collapsed: preCollapse - scored.length,
         thinTest: cands.length - preCollapse,
         top:scored.slice(0,40),
         worst:scored.slice().sort((a,b)=>a.liftHi-b.liftHi).slice(0,8)};
  minedSig=sig;
  return mined;
}

/* ---------- comparable listing references ---------- */
function comps(l, k){
  const X=L(); const all=X.allListings(); const p0=X.price(l);
  const out=[];
  const cap=Math.min(all.length, 60000);
  for(let i=0;i<cap;i++){
    const x=all[i]; if(x.id===l.id) continue;
    if((x.kind||'')!==(l.kind||'')) continue;
    if(x.zip!==l.zip && x.city!==l.city) continue;
    const pu=Math.abs((X.price(x)-p0)/Math.max(1,p0));
    if(pu>0.45) continue;
    const du=(x.units||1)===(l.units||1)?0:0.25;
    const su=(l.sqft&&x.sqft)? Math.abs(x.sqft-l.sqft)/l.sqft : 0.2;
    out.push({l:x, d:pu*1.0+du+su*0.6, sameZip:x.zip===l.zip});
  }
  out.sort((a,b)=>a.d-b.d);
  return out.slice(0,k||8);
}

/* ---------- automations ---------- */
function evaluate(a){
  const X=L(); const all=X.allListings(); let n=0; const hits=[];
  const cap=Math.min(all.length, 60000);
  for(let i=0;i<cap;i++){
    const l=all[i];
    if(!a.keys.every(([dimId,val])=>{ const d=DIMS.find(x=>x.id===dimId); return d && d.get(l)===val; })) continue;
    n++; if(hits.length<250) hits.push(l);
  }
  return {n, hits};
}
function addAuto(pat, name){
  /* store the HELD-OUT figures and the interval, so a rule exported today and
     read back in six months still says how well it was actually shown to work
     rather than how well it looked to the search that found it */
  AUTO.push({id:'a'+Date.now().toString(36), name:name||pat.label, keys:pat.keys, label:pat.label,
    outcome:OUT, lift:+pat.lift.toFixed(2), liftLo:+pat.liftLo.toFixed(2), liftHi:+pat.liftHi.toFixed(2),
    held:!!pat.held, rate:+(pat.rate*100).toFixed(1), support:pat.n,
    created:new Date().toISOString().slice(0,10)});
  save();
}
function flagsFor(l){
  const out=[];
  AUTO.forEach(a=>{ if(a.keys.every(([dimId,val])=>{ const d=DIMS.find(x=>x.id===dimId); return d && d.get(l)===val; })) out.push(a); });
  return out;
}

/* ---------- render ---------- */
function render(){
  const root=$('#patroot'); if(!root) return;
  const X=L();
  const m=mine();
  const pctf=v=>(v*100).toFixed(1)+'%';
  root.innerHTML=`
  <div class="tile" data-panel data-panel-title="Pattern mining — controls">
    <p class="eyebrow">Pattern mining</p>
    <h3 style="margin:2px 0 6px">What actually predicts a good outcome in this market</h3>
    <p class="chartnote">Every record in this edition is scored for the outcome you pick. The records are then <b>split in half</b>: patterns are searched for in one half and their strength is <b>measured on the other half, which the search never saw</b>. The lift you see is that held-out figure, with a 95% interval. These are <b>observed associations in this dataset</b> — not causation, not a forecast, and not advice.</p>
    <p class="chartnote" style="border-left:3px solid var(--line);padding-left:9px"><b>Why the split.</b> This engine tests ${m.tested.toLocaleString()} candidate patterns and then shows you the biggest number it found. A biggest-of-many is high even when nothing is happening — give a hundred fair coins twenty flips each and one will look loaded. Reporting the in-sample lift of the winner of a hundred-way search is the single most common way a table like this misleads. So the winner is re-measured on data it was not chosen from, and the drop between the two is printed rather than hidden.</p>
    <div class="toolbar" style="gap:8px;flex-wrap:wrap;margin-top:8px">
      <select id="patout">${OUTCOMES.map(o=>`<option value="${o.id}" ${OUT===o.id?'selected':''}>Predict: ${o.name}</option>`).join('')}</select>
      <span style="font-family:var(--mono);font-size:12.5px;white-space:normal;flex:1;min-width:280px;line-height:1.7">base rate ${pctf(m.baseRate)} across ${m.sampled.toLocaleString()} records${m.outcome.kind==="rel"&&m.thr!=null?` &middot; cut at ${(+m.thr).toFixed(m.thr>200?0:2)}`:""}${m.outcome.kind==="rel"&&m.cover!=null?` &middot; metric present on ${pctf(m.cover)} of records`:""}<br>${m.trN.toLocaleString()} searched &middot; ${m.teN.toLocaleString()} held out &middot; ${m.tested.toLocaleString()} candidates tested &middot; <b>${m.heldCount}</b> survived${m.collapsed?` &middot; ${m.collapsed} collapsed as duplicates`:''}${m.ceiling?` &middot; ceiling ${m.ceiling.toFixed(2)}x`:''}</span>${m.baseRate===0?`<p class="chartnote" style="color:var(--warn);margin:8px 0 0"><b>No record in this edition meets that test</b> at your current assumptions — that is the finding, not a bug. Lift needs something to divide by, so switch to one of the top-decile outcomes to see which attributes concentrate the best records that do exist here.</p>`:""}${m.baseRate>=0.999?`<p class="chartnote" style="margin:8px 0 0">Every record meets that test, so no attribute can lift above it. Pick a narrower outcome.</p>`:""}
    </div>
  </div>
  <div class="chart" data-panel data-panel-title="Strongest patterns">
    <div class="eyebrow">Ranked by the low end of the held-out interval</div><h3>Where "${X.esc(m.outcome.name)}" survived a test on data the search never saw</h3>
    <p class="chartnote" style="margin:0 0 8px">Ranked by the <b>bottom</b> of each interval, not the point estimate — the question worth asking of a mined pattern is not how good it looked but how weak it might still be. ${m.heldCount? `<b>${m.heldCount} of ${m.tested.toLocaleString()}</b> candidates cleared a lift of 1.0 at the bottom of a 95% interval on held-out records.` : `<b>Not one of the ${m.tested.toLocaleString()} candidates cleared a lift of 1.0</b> at the bottom of its interval on held-out records. That is a real finding about this edition: the attributes on file do not separate this outcome. Rows below are shown as candidates so you can see what was tried.`}${m.medShrink!=null?(m.medShrink>0.02?` The median pattern lost <b>${(m.medShrink*100).toFixed(0)}%</b> of its lift when re-measured out of sample — that gap is what the search itself put there.`:` The median pattern lost essentially nothing out of sample (${(m.medShrink*100).toFixed(1)}%), which is what large support buys: with thousands of records behind each group there is little room to fit noise. That is a result, not a formality — the same search on a small edition shrinks hard.`):''}${m.ceiling?` <b>The ceiling is ${m.ceiling.toFixed(2)}x</b> — a group where the outcome happens every single time. Patterns tied at it are saturated, and the lift cannot separate them; read their support and their records instead.`:''}${m.collapsed?` ${m.collapsed} candidate${m.collapsed===1?' was':'s were'} dropped for covering the same records as a higher-ranked one under a different name — a ZIP and the city it sits in are one finding, not two.`:''}${m.thinTest?` A further ${m.thinTest} had fewer than ${12} records in the held-out half and were dropped rather than reported on a handful.`:''}</p>
    <div class="tablewrap"><table class="grid"><thead><tr><th>#</th><th>Pattern</th><th class="r">Held-out records</th><th class="r">Hit rate</th><th class="r">Lift (95% interval)</th><th>Verdict</th><th></th></tr></thead><tbody>
    ${m.top.slice(0,24).map((p,i)=>`<tr${p.held?'':' style="opacity:.66"'}><td class="r">${i+1}</td><td class="wrap" style="max-width:330px"><b title="${X.esc(p.label)}">${X.esc(p.label.length>78?p.label.slice(0,77).replace(/[ ×,;:]+$/,'')+'…':p.label)}</b>${p.aliases&&p.aliases.length?`<div style="font-size:10.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${X.esc(p.aliases.join(' · '))}">= ${X.esc(clipLabel(p.aliases[0]))}${p.aliases.length>1?` and ${p.aliases.length-1} more`:''}</div>`:''}${p.shrink!=null&&p.shrink>0.3?`<div style="font-size:10.5px;color:var(--muted)">looked ${p.trLift.toFixed(2)}x in the search half — lost ${(p.shrink*100).toFixed(0)}% out of sample</div>`:''}</td><td class="r">${p.n.toLocaleString()}</td><td class="r">${pctf(p.rate)}</td>
      <td class="r"><b style="color:${p.held?'var(--good)':'var(--muted)'}">${p.lift.toFixed(2)}x</b>${m.ceiling&&p.lift>=m.ceiling-1e-6?' <span style="font-size:10px;color:var(--muted)" title="the largest lift arithmetically possible for this outcome">at ceiling</span>':''} <span style="color:var(--muted);font-size:11px">${p.liftLo.toFixed(2)}–${p.liftHi.toFixed(2)}</span></td>
      <td style="font-size:11.5px">${p.held?'<span class="badge good">holds out</span>':'<span class="badge">interval spans 1.0 — not shown to do anything</span>'}</td>
      <td><button class="btn" data-see-pat="${i}">Show records</button> <button class="btn" data-mkauto="${i}"${p.held?'':' title="This pattern did not survive the held-out test"'}>Automate</button></td></tr>`).join('')}
    </tbody></table></div>
    <p class="src">A greyed row is not a weak pattern, it is <b>an unproven one</b>: its interval includes "does nothing", so the point estimate should not be read at all. Beware ZIP and city patterns that merely restate a market's price level, and remember the whole table is association in one edition's records. The honest use is as a screen — it says where to look first, and the underwriting still has to survive on its own numbers.</p>
  </div>
  <div class="chart" data-panel data-panel-title="Where it happens least">
    <div class="eyebrow">Inverse patterns</div><h3>Groups where "${X.esc(m.outcome.name)}" is rarest</h3>
    <p class="chartnote" style="margin:0 0 8px">Ranked by the <b>top</b> of the interval, the mirror of the table above: a group is only reliably poor if even its optimistic end sits below 1.0. Rows in grey are not proven poor either.</p>
    <div class="tablewrap"><table class="grid"><thead><tr><th>Pattern</th><th class="r">Records</th><th class="r">Hit rate</th><th class="r">Lift</th></tr></thead><tbody>
    ${m.worst.map(p=>`<tr><td>${X.esc(p.label)}</td><td class="r">${p.n.toLocaleString()}</td><td class="r">${pctf(p.rate)}</td><td class="r" style="color:${p.liftHi<1?'var(--bad)':'var(--muted)'}">${p.lift.toFixed(2)}x <span style="font-size:11px;color:var(--muted)">${p.liftLo.toFixed(2)}–${p.liftHi.toFixed(2)}</span></td></tr>`).join('')}
    </tbody></table></div>
    <p class="src">Just as useful as the winners: these are the buckets to stop spending weekends on.</p>
  </div>
  <div class="tile" data-panel data-panel-title="Predictive automations">
    <p class="eyebrow">Automations</p>
    <h3 style="margin:2px 0 6px">${AUTO.length} saved rule${AUTO.length===1?'':'s'} — every record is checked against them</h3>
    <p class="chartnote">Turn any pattern above into a standing rule. Saved rules are evaluated against the whole edition, flag matching properties wherever they appear, and travel as JSON so the daily refresh can apply them to tomorrow's new records too.</p>
    <div id="patautos" style="margin-top:8px"></div>
    <div class="toolbar" style="margin-top:8px"><button class="btn" id="patexp">Export rules</button><button class="btn" id="patimp">Import rules</button>${AUTO.length?'<button class="btn" id="patclear">Clear all</button>':''}</div>
    <div id="patio" style="display:none;margin-top:8px"><textarea id="patiotxt" style="width:100%;min-height:90px;font-family:var(--mono);font-size:11.5px"></textarea><div class="toolbar" style="margin-top:6px"><button class="btn primary" id="patioapply">Apply pasted rules</button></div></div>
  </div>
  <div id="pathits"></div>`;
  $('#patout').addEventListener('change',e=>{ OUT=e.target.value; render(); });
  /* click any pattern to see the actual records inside it — a lift number you
     cannot open is a number you cannot check */
  $$('#patroot [data-see-pat]').forEach(b=>b.addEventListener('click',()=>{
    const p2=m.top[+b.dataset.seePat]; if(!p2) return;
    const r=evaluate(p2);
    window.LXPal&&LXPal.drill(p2.label, r.hits, {eyebrow:'Records inside this pattern',
      note:`Measured on ${p2.n.toLocaleString()} held-out records the search never saw: hit rate ${(p2.rate*100).toFixed(1)}% against a held-out base rate of ${(m.teBase*100).toFixed(1)}% — lift ${p2.lift.toFixed(2)}x (95% interval ${p2.liftLo.toFixed(2)} to ${p2.liftHi.toFixed(2)}) on "${m.outcome.name}". ${p2.held?'The interval clears 1.0, so this held up out of sample.':'<b>The interval includes 1.0, so this pattern has not been shown to do anything</b> — read the records, not the multiple.'} The list shown here is every matching record in the edition, both halves. An observed association, not a cause and not a forecast.`});
  }));
  $$('#patroot [data-mkauto]').forEach(b=>b.addEventListener('click',()=>{
    const p=m.top[+b.dataset.mkauto];
    if(!p.held && !confirm('This pattern did not survive the held-out test — its 95% interval runs from '
      +p.liftLo.toFixed(2)+'x to '+p.liftHi.toFixed(2)+'x, which includes 1.0 (no effect).\n\n'
      +'Saving it as a standing rule will flag properties on the basis of something this edition\'s own '
      +'data does not support. Save it anyway?')) return;
    const nm=prompt('Name this automation', p.label);
    if(nm===null) return;
    addAuto(p, nm||p.label); render(); L().toast('Automation saved — matching properties are flagged from now on');
  }));
  renderAutos();
  $('#patexp').onclick=()=>{ $('#patio').style.display=''; $('#patiotxt').value=JSON.stringify(AUTO,null,1); };
  $('#patimp').onclick=()=>{ $('#patio').style.display=''; $('#patiotxt').value=''; $('#patiotxt').placeholder='Paste an exported rules array here, then Apply.'; };
  $('#patioapply').onclick=()=>{ try{ const a=JSON.parse($('#patiotxt').value); if(!Array.isArray(a)) throw 0; AUTO=a; save(); render(); L().toast(AUTO.length+' rules applied'); }catch(e){ L().toast('Not a valid rules array'); } };
  const pc=$('#patclear'); if(pc) pc.onclick=()=>{ if(confirm('Delete every saved automation?')){ AUTO=[]; save(); render(); } };
  try{ if(window.LXPanels) LXPanels.scan('patterns'); }catch(e){}
}
function renderAutos(){
  const box=$('#patautos'); if(!box) return;
  const X=L();
  if(!AUTO.length){ box.innerHTML='<p style="font-size:13px;color:var(--muted)">No automations yet. Press <b>Automate</b> on any pattern above to create one.</p>'; return; }
  box.innerHTML=AUTO.map((a,i)=>{
    const ev=evaluate(a);
    return `<div style="border-top:1px solid var(--line2);padding:8px 0;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap">
      <div style="flex:1;min-width:260px"><b style="font-size:13.5px">${X.esc(a.name)}</b>
        <div style="font-size:12px;color:var(--muted)">${X.esc(a.label)} · saved ${a.created} · ${a.lift}x${a.liftLo!=null?' <span title="95% interval on held-out records">('+a.liftLo+'–'+a.liftHi+')</span>':''} on "${X.esc((OUTCOMES.find(o=>o.id===a.outcome)||{}).name||a.outcome)}" at ${a.rate}% over ${a.support.toLocaleString()} held-out records${a.held===false?' <b style="color:var(--warn)">— saved without surviving the held-out test</b>':''}${a.liftLo==null?' <span style="color:var(--warn)">— saved before this app measured intervals; its lift is in-sample and overstated</span>':''}</div></div>
      <div style="font-family:var(--mono);font-size:15px"><b>${ev.n.toLocaleString()}</b> <span style="font-size:11px;color:var(--muted)">flagged now</span></div>
      <button class="btn" data-see="${i}">Show them</button><button class="btn" data-del="${i}">Delete</button></div>`;
  }).join('');
  $$('#patautos [data-del]').forEach(b=>b.addEventListener('click',()=>{ AUTO.splice(+b.dataset.del,1); save(); render(); }));
  $$('#patautos [data-see]').forEach(b=>b.addEventListener('click',()=>{
    const a=AUTO[+b.dataset.see]; const ev=evaluate(a);
    const box2=$('#pathits');
    box2.innerHTML=`<div class="chart" data-panel data-panel-title="Flagged properties"><div class="eyebrow">Automation hits</div><h3>${ev.n.toLocaleString()} properties match "${X.esc(a.name)}"</h3>
      <div class="tablewrap"><table class="grid"><thead><tr><th>#</th><th>Property</th><th>City</th><th>Type</th><th class="r">Price</th><th class="r">Score</th><th class="r">Cash flow</th><th></th></tr></thead><tbody>
      ${ev.hits.slice(0,60).map((l,i2)=>{ let r=null; try{ r=D().analyze(l); }catch(e){}
        return `<tr><td class="r">${i2+1}</td><td><b>${X.esc(l.addr)}</b></td><td>${X.esc(l.city)}</td><td style="font-size:12px">${X.esc(l.kind||'')}</td><td class="r">${X.fmt$(X.price(l))}</td><td class="r">${r?r.score:'-'}</td><td class="r ${r&&r.d.cfMo>0?'pos':'neg'}">${r?((r.d.cfMo>0?'+':'')+X.fmt$(r.d.cfMo)):'-'}</td><td><button class="btn" data-go="${l.id}">Open</button></td></tr>`; }).join('')}
      </tbody></table></div>${ev.n>60?'<p class="src">Showing the first 60 of '+ev.n.toLocaleString()+'.</p>':''}</div>`;
    $$('#pathits [data-go]').forEach(g=>g.addEventListener('click',()=>L().select(g.dataset.go,true)));
    box2.scrollIntoView({behavior:'smooth',block:'start'});
    try{ if(window.LXPanels) LXPanels.scan('patterns'); }catch(e){}
  }));
}
function compsHTML(l){
  const X=L(); const cs=comps(l,8);
  if(!cs.length) return '';
  const med=a=>{ const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
  const prices=cs.map(c=>X.price(c.l));
  return `<h4 style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 6px">Listing references — ${cs.length} closest comparables</h4>
  <div class="tablewrap"><table class="grid"><thead><tr><th>Property</th><th>City</th><th class="r">Price</th><th class="r">Units</th><th class="r">Sq ft</th><th class="r">Score</th></tr></thead><tbody>
  ${cs.map(c=>{ let r=null; try{ r=D().analyze(c.l); }catch(e){}
    return `<tr><td>${X.esc(c.l.addr)}${c.sameZip?' <span style="font-size:10px;color:var(--good)">same ZIP</span>':''}</td><td>${X.esc(c.l.city)}</td><td class="r">${X.fmt$(X.price(c.l))}</td><td class="r">${c.l.units||1}</td><td class="r">${c.l.sqft?X.fmtN(c.l.sqft):'-'}</td><td class="r">${r?r.score:'-'}</td></tr>`; }).join('')}
  </tbody></table></div><p class="src">Median of this reference set: ${X.fmt$(med(prices))}. Matched on property type, ZIP or city, and price within 45% — the same set the pattern miner draws on. Comparables from public records are a sanity check, not an appraisal.</p>`;
}
window.LXPat={render, mine, comps, compsHTML, flagsFor, evaluate, DIMS, get autos(){ return AUTO; }};
})();
