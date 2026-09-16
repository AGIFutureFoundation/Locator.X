/* locator.x — the coverage panel: what this edition cannot answer.
   ----------------------------------------------------------------------------
   The repository has enforced "unknown is an answer" since the beginning: the
   coverage inventories carry `named` / `blocked` / `no public record` as first-
   class statuses, the validators refuse a row that quietly passes, and the
   strategy switchboard blocks a column rather than printing a zero it did not
   compute. All of that was true in the REPOSITORY and merely implied in the APP.
   A user opening an edition saw what it had. Nothing on screen said what it did
   not have, which is the more expensive half of the answer — and is precisely
   what a seller of a competing product will never tell them.

   This panel says it, per edition, measured at runtime.

   THE RULE THIS FILE LIVES OR DIES BY: a coverage panel that under-reports gaps
   is worse than no panel at all, because it converts an unknown into an implied
   pass — the exact failure the whole project is built to avoid. So nothing here
   is written down. Every number is counted from this edition's own records when
   the panel opens, the field definitions come from evidence.js rather than a
   second list that could drift from it, and tests/fleet_smoke.js RECOMPUTES the
   same figures independently and fails if the panel's printed numbers disagree
   with what the records actually say.

   Four things it reports, and each one is a measurement:

     1. FIELDS — for each of the seven record tests evidence.js grades on, how
        many of this edition's records carry it, and what question stops being
        answerable when they do not. A field at 0% is not a weak spot; it is a
        question this edition cannot be asked.
     2. CLASSIFICATION — records whose use is unclassified, or is a zoning
        district rather than a recorded use. A permission is not a building.
     3. STRATEGIES — a sample of records run through the switchboard, reporting
        how often each play is EVALUATED, BLOCKED and INAPPLICABLE, with the two
        non-computed states counted and explained SEPARATELY. Pooling them would
        be this panel committing the conflation the switchboard exists to
        prevent: "does not apply to this building" and "this county does not
        publish it" are opposite findings. This is the edition-level explanation
        of a blocked column — not "no comps for this address" but "this county
        publishes no dated sale price at all".
     4. FOOTPRINT — the counties and the record count this edition actually
        covers, because "not in this edition" is the most common unknown of all
        and the map does not say it.

   What this panel is NOT: a quality score. There is no number at the top. A
   single figure summarising an edition's coverage would be used as a ranking,
   and the point of the panel is the specific list of things you cannot do. */
(function(){
'use strict';
const L=()=>window.LX;
const $=(s,el=document)=>el.querySelector(s);
const N=v=>(typeof v==='number'&&isFinite(v))?v:null;
const ZONED=/^zoned\b/i, UNCL=/unclassified/i;

/* The sample size for the strategy probe. Running the full switchboard over
   every record would be honest and slow; the floor below is the same one
   tests/run.py enforces on the record layer — under it, the answer is
   "insufficient sample", printed, rather than a percentage nobody should read. */
const PROBE = 120, PROBE_FLOOR = 25;

/* WHICH RECORDS THIS PANEL IS DESCRIBING.

   It read allListings() everywhere, so it always described the whole edition —
   including when the user opened it while looking at a map filtered to one city.
   Both questions are real and they are not the same question: "what can this
   EDITION answer" decides whether to buy the edition, "what can THESE PROPERTIES
   answer" decides whether to make an offer here. The panel silently answered the
   first while the screen showed the second.

   Scope is now explicit. The panel follows the active filter, states which set it
   is describing, and says when the two differ — because a market whose edition
   grades well and whose current view does not is exactly the case a buyer needs
   to see. */
let SCOPE = 'view';
function scoped(){
  const X = L();
  const all = X.allListings();
  if(SCOPE === 'edition') return all;
  let f = null;
  try{ f = X.filtered(); }catch(e){ f = null; }
  return (f && f.length) ? f : all;
}
/* The scope state is reported with its own caveats rather than smoothed over.
   A filter that matches nothing leaves nothing to measure; the panel falls back
   to the edition in that case, but it SAYS SO. Silently describing 354,000
   records under a heading the user believes refers to the eleven on their screen
   is the same class of error as under-reporting a gap. */
function scopeState(){
  const X = L();
  const all = X.allListings().length;
  let view = all, ok = true;
  try{ const f = X.filtered(); view = f ? f.length : all; }catch(e){ ok = false; }
  const empty = ok && view === 0;
  const effective = (SCOPE === 'edition' || empty || !ok) ? 'edition' : 'view';
  return {all: all, view: view, ok: ok, empty: empty,
          filtered: ok && view < all, scope: SCOPE, effective: effective,
          n: effective === 'edition' ? all : view};
}
function setScope(s){
  if(s !== 'view' && s !== 'edition') return;
  SCOPE = s; render();
}

/* ---------- 1. fields -------------------------------------------------- */
function fields(){
  const rows=scoped();
  const T=(window.LXEvid && LXEvid.TESTS) || [];
  const n=rows.length;
  return T.map(t=>{
    let have=0;
    for(let i=0;i<n;i++){ try{ if(t[2](rows[i])) have++; }catch(e){} }
    return {key:t[0], name:t[3], why:t[4], have, n, pct: n? have/n*100 : null};
  });
}

/* ---------- 2. classification ------------------------------------------ */
function classification(){
  const rows=scoped(); const n=rows.length;
  let uncl=0, zoned=0, blank=0;
  for(const l of rows){
    const k=(l.kind||'').trim();
    if(!k) blank++;
    else if(UNCL.test(k)) uncl++;
    else if(ZONED.test(k)) zoned++;
  }
  return {n, uncl, zoned, blank, named: n-uncl-zoned-blank};
}

/* ---------- 3. strategies ---------------------------------------------- */
/* Why a SAMPLE and not the whole edition: the switchboard calls the comparable-
   sales engine, which is the expensive part, and a coverage panel that takes ten
   seconds to open is a coverage panel nobody opens. The sample is deterministic
   — an even stride through the edition's own order — so two runs agree and the
   fleet test can recompute it. */
function strategies(){
  const X=L(); const rows=scoped();
  if(!window.LXSB) return null;
  if(rows.length < PROBE_FLOOR)
    return {insufficient:true, n:rows.length, floor:PROBE_FLOOR};
  const step=Math.max(1, Math.floor(rows.length/PROBE));
  const seen=[]; const tally={};
  for(let i=0;i<rows.length && seen.length<PROBE;i+=step){
    let cols=null;
    try{ cols=window.LXSB.compare(rows[i]); }catch(e){ continue; }
    seen.push(rows[i]);
    for(const c of cols){
      const t=tally[c.key]||(tally[c.key]={name:c.name, computed:0, blocked:0, na:0, blockWhy:{}, naWhy:{}});
      if(c.state==='computed') t.computed++;
      /* The two non-computed states get SEPARATE reason tallies. Pooling them
         would be this panel committing the exact conflation the switchboard was
         built to prevent: "does not apply to this building" and "this county
         does not publish it" are opposite findings, and a single "reason it is
         not" column would let a data gap hide behind a structural one. */
      else if(c.state==='blocked'){ t.blocked++; const k=(c.why||'').slice(0,160); t.blockWhy[k]=(t.blockWhy[k]||0)+1; }
      else { t.na++; const k=(c.why||'').slice(0,160); t.naWhy[k]=(t.naWhy[k]||0)+1; }
    }
  }
  const top=o=>Object.keys(o).sort((a,b)=>o[b]-o[a])[0]||'';
  const out=Object.keys(tally).map(k=>{
    const t=tally[k];
    return {key:k, name:t.name, computed:t.computed, blocked:t.blocked, na:t.na,
            sampled:seen.length, topBlock:top(t.blockWhy), topNa:top(t.naWhy)};
  });
  return {sampled:seen.length, of:rows.length, rows:out};
}

/* ---------- 4. footprint ------------------------------------------------ */
function footprint(){
  const rows=scoped(); const c={};
  for(const l of rows){ const k=l.county||l.city||'(unnamed)'; c[k]=(c[k]||0)+1; }
  const list=Object.keys(c).map(k=>({name:k, n:c[k]})).sort((a,b)=>b.n-a.n);
  return {n:rows.length, counties:list};
}

/* ---------- the report -------------------------------------------------- */
function report(){
  const f=fields();
  /* A gap is a field ABSENT ON EVERY RECORD. Partial coverage is a different
     and lesser problem — it is reported with its percentage, and it is not
     called a gap, because calling a 94%-covered field a gap would make the real
     gaps harder to see. */
  const gaps=f.filter(x=>x.have===0);
  const thin=f.filter(x=>x.have>0 && x.pct<50);
  return {scope:scopeState(), fields:f, gaps, thin, classification:classification(),
          strategies:strategies(), footprint:footprint()};
}

/* ---------- rendering --------------------------------------------------- */
function pctTxt(p){ return p==null? 'unknown' : (p>=99.5&&p<100? '>99%' : p<=0.5&&p>0? '<1%' : Math.round(p)+'%'); }

/* The scope control. It is drawn from the report rather than written into the
   markup because both counts are live: the "on screen" figure changes every time
   the user touches a filter, and a stale number here would be a coverage claim
   that has drifted — the one thing this panel exists to prevent. */
function scopeBar(sc){
  const X=L();
  let h='<div class="covscope"><span class="covscopelab">Describing</span>'
    +'<button type="button" class="covscopebtn'+(sc.effective==='view'?' on':'')+'" data-covscope="view"'
    +' aria-pressed="'+(sc.effective==='view')+'">The '+X.fmtN(sc.view)+' on screen</button>'
    +'<button type="button" class="covscopebtn'+(sc.effective==='edition'?' on':'')+'" data-covscope="edition"'
    +' aria-pressed="'+(sc.effective==='edition')+'">All '+X.fmtN(sc.all)+' in this edition</button></div>';
  if(!sc.ok)
    h+='<p class="covscopenote">The active filter could not be read, so every figure below is counted from all '
      +X.fmtN(sc.all)+' records in this edition.</p>';
  else if(sc.empty)
    h+='<p class="covscopenote"><b>The current filter matches no records</b>, so there is nothing on screen to measure. '
      +'Every figure below is counted from all '+X.fmtN(sc.all)+' records in this edition instead.</p>';
  else if(!sc.filtered)
    h+='<p class="covscopenote">No filter is active, so both sets are the same '+X.fmtN(sc.all)+' records.</p>';
  else if(sc.effective==='view')
    h+='<p class="covscopenote">A filter is active. Every figure below is counted from the <b>'+X.fmtN(sc.view)
      +' records now on the map</b>, not the '+X.fmtN(sc.all)+' in the edition. An edition can grade well and still '
      +'hold a view that cannot be underwritten — and it is the view you would be making an offer in.</p>';
  else
    h+='<p class="covscopenote">Counted from all <b>'+X.fmtN(sc.all)+' records in this edition</b>, while the map is '
      +'filtered to '+X.fmtN(sc.view)+'. These figures describe what the edition can answer, not what is on screen.</p>';
  return h;
}

function render(){
  const X=L(); const host=$('#covbody'); if(!host) return;
  const r=report(); const sc=r.scope;
  const SET = sc.effective==='view'
    ? 'the '+X.fmtN(sc.n)+' records on screen'
    : 'this edition';
  let h=scopeBar(sc);

  /* --- the headline: the list, not a score --- */
  if(r.gaps.length===0){
    h+='<p class="covlede">Every field this desk grades on is present on at least one of '+SET+'. '
      +'That is not the same as complete — see the coverage percentages below, and the strategies these records still cannot support.</p>';
  } else {
    h+='<p class="covlede"><b>'+r.gaps.length+' of '+r.fields.length+' record fields are absent from '+SET+' entirely.</b> '
      +'Not thin — absent. '
      /* The reach of a gap depends on the set: an edition-wide gap survives any
         filter, a view-level one may not. Saying the stronger thing at view
         scope would overstate; saying the weaker thing at edition scope would
         understate. Both are wrong, so the sentence follows the scope. */
      +(sc.effective==='edition'
         ? 'Every question below is one this edition cannot be asked, whatever you filter or sort:'
         : 'Every question below is one these records cannot be asked — switch to the whole edition above to see whether a different filter would find them:')
      +'</p><ul class="covgaps">';
    for(const g of r.gaps) h+='<li><b>'+X.esc(g.name)+'</b> — 0 of '+X.fmtN(g.n)+' records. '+X.esc(g.why)+'</li>';
    h+='</ul>';
  }

  /* --- every field, with its measured coverage --- */
  h+='<h3>What the records carry</h3><table class="covtab"><thead><tr><th>Field</th><th>Records carrying it</th><th>What it is for</th></tr></thead><tbody>';
  for(const x of r.fields)
    h+='<tr class="'+(x.have===0?'covzero':x.pct<50?'covthin':'')+'"><th>'+X.esc(x.name)+'</th>'
      +'<td>'+X.fmtN(x.have)+' of '+X.fmtN(x.n)+' · '+pctTxt(x.pct)+'</td>'
      +'<td class="covwhy">'+X.esc(x.why)+'</td></tr>';
  h+='</tbody></table>';

  /* --- classification --- */
  const c=r.classification;
  h+='<h3>What the records are called</h3><p class="covwhy">'
    +X.fmtN(c.named)+' of '+X.fmtN(c.n)+' records carry a recorded use. ';
  if(c.zoned) h+='<b>'+X.fmtN(c.zoned)+'</b> carry a zoning district instead — a permission is not a building, and this desk will not treat one as the other. ';
  if(c.uncl) h+='<b>'+X.fmtN(c.uncl)+'</b> are unclassified in the source. ';
  if(c.blank) h+='<b>'+X.fmtN(c.blank)+'</b> carry no use string at all. ';
  if(!c.zoned && !c.uncl && !c.blank) h+='None are unclassified or zoning-only.';
  h+='</p>';

  /* --- strategies --- */
  h+='<h3>'+(sc.effective==='view'?'Which plays these records support':'Which plays this edition can evaluate')+'</h3>';
  const s=r.strategies;
  if(!s) h+='<p class="covwhy">The strategy switchboard is not loaded in this edition, so this cannot be measured here.</p>';
  else if(s.insufficient)
    h+='<p class="covwhy">This edition holds '+X.fmtN(s.n)+' records, below the '+s.floor
      +'-record floor this desk uses before reporting a rate. The answer is <b>insufficient sample</b>, not a percentage.</p>';
  else {
    h+='<p class="covwhy">Measured on '+X.fmtN(s.sampled)+' records sampled evenly across '
      +(sc.effective==='view'? 'the '+X.fmtN(s.of)+' on screen' : 'this edition’s '+X.fmtN(s.of))
      +'. A blocked play is not a defect in the tool — it is this county’s record layer, stated.</p>'
      /* Two reason columns, never one. The tally has always counted BLOCKED and
         INAPPLICABLE separately — "this county publishes no dated sale price"
         against "this building has one unit" — and this table used to read a
         field (`x.top`) that the tally never produced, so it printed an empty
         cell for every non-evaluable play: the panel promised a reason and gave
         none. They are now printed side by side, under their own headings,
         because pooling them would hide a data gap behind a structural one. */
      +'<table class="covtab"><thead><tr><th>Play</th><th>Evaluable</th>'
      +'<th>Blocked — the record layer</th><th>Inapplicable — the building</th></tr></thead><tbody>';
    for(const x of s.rows){
      const rate=x.sampled? Math.round(x.computed/x.sampled*100) : null;
      h+='<tr class="'+(x.computed===0?'covzero':'')+'"><th>'+X.esc(x.name)+'</th>'
        +'<td>'+X.fmtN(x.computed)+' of '+X.fmtN(x.sampled)+' · '+(rate==null?'unknown':rate+'%')+'</td>'
        +'<td class="covwhy">'+(x.blocked? X.fmtN(x.blocked)+' · '+X.esc(x.topBlock) : '—')+'</td>'
        +'<td class="covwhy">'+(x.na? X.fmtN(x.na)+' · '+X.esc(x.topNa) : '—')+'</td></tr>';
    }
    h+='</tbody></table>';
  }

  /* --- footprint --- */
  const fp=r.footprint;
  h+='<h3>'+(sc.effective==='view'?'What this view covers':'What this edition covers')+'</h3><p class="covwhy">'+X.fmtN(fp.n)+' records across '
    +fp.counties.length+' '+(fp.counties.length===1?'county or place':'counties or places')+': '
    +fp.counties.slice(0,12).map(x=>X.esc(x.name)+' ('+X.fmtN(x.n)+')').join(', ')
    +(fp.counties.length>12? ', and '+(fp.counties.length-12)+' more' : '')
    +'. '+(sc.effective==='edition'
        ? 'Anything outside this footprint is not thin coverage here — it is absent, and no filter in this app will find it.'
        : 'This is the footprint of the current filter, not of the edition — clear the filter, or switch scope above, to see everything the edition holds.')
    +'</p>';

  host.innerHTML=h;
  /* The sheet's own title is part of the claim, so it moves with the scope too —
     a heading that says "this edition" over figures counted from eleven filtered
     records would mislabel the whole panel. */
  const t=$('#covtitle');
  if(t) t.textContent = sc.effective==='view'
    ? 'What these ' + X.fmtN(sc.n) + ' properties cannot answer'
    : 'What this edition cannot answer';
  const eb=$('#coveyebrow');
  if(eb) eb.textContent = sc.effective==='view'
    ? 'Coverage \u00b7 measured from the records now on the map'
    : 'Coverage \u00b7 measured from this edition\u2019s own records';
  const pn=$('#covpanel');
  if(pn && t) pn.setAttribute('aria-label', t.textContent);
  host.querySelectorAll('[data-covscope]').forEach(b=>{
    b.onclick=()=>setScope(b.getAttribute('data-covscope'));
  });
}

function open(){
  const p=$('#covpanel'); if(!p) return;
  render(); p.classList.add('open'); p.setAttribute('aria-hidden','false');
}
function close(){
  const p=$('#covpanel'); if(!p) return;
  p.classList.remove('open'); p.setAttribute('aria-hidden','true');
}
function bind(){
  const b=$('#covopen'); if(b) b.onclick=open;
  const x=$('#covclose'); if(x) x.onclick=close;
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
}
if(document.readyState!=='loading') setTimeout(bind,0); else document.addEventListener('DOMContentLoaded',bind);

window.LXCov={render, report, open, close, bind, setScope, scopeState, scoped,
  fields, classification, strategies, footprint, PROBE, PROBE_FLOOR};
})();
