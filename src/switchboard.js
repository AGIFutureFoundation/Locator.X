/* locator.x — the strategy switchboard: one property, every strategy, side by side.
   ----------------------------------------------------------------------------
   Four modules in this app each answer one strategy well and none of them answer
   together: underwrite.js holds buy-and-hold, hacks.js holds the owner-occupied
   case, dev.js and conv.js hold conversion. An investor looking at a building
   does not want four screens; they want to know which play this particular
   building is FOR.

   The obvious way to build that is a grid of five numbers, and the obvious way
   is wrong. A table that puts a flip's profit beside a hold's cash flow beside a
   conversion's projected value implies the five figures are equally supported by
   the record. They are not, and the gap is not small:

     · a HOLD needs a rent figure, which in most editions is modelled
     · a FLIP needs an after-repair value, which needs RECORDED COMPARABLE SALES,
       which roughly half the counties in this catalogue do not publish at all
     · a CONVERSION is modelled end to end — every figure in it is an assumption
       wearing a dollar sign

   So every column here carries its own BASIS: each input, where it came from, and
   what kind of thing it is (a record, a published figure, a model, an assumption).
   A column is graded by its WEAKEST input, never its average, because a deal is
   exactly as trustworthy as the softest number in it. Alignment in a table is an
   argument; this one has to earn it.

   Three states, and the difference between the last two is the whole point:

     computed — every input exists, the arithmetic ran, the basis is listed
     n/a      — the strategy does not apply to this property. A single-family has
                no house-hack column and a duplex has no hotel conversion. That is
                a FACT ABOUT THE BUILDING, not a gap in the data.
     blocked  — the strategy applies and an input is missing. The column says
                which input and why, quoting the module that knows (comps.js
                explains its own emptiness better than this file could).

   Nothing here defaults, and nothing here shows a zero it did not compute. A
   blank cell in a comparison table reads as "small"; a zero reads as "none". The
   honest rendering of an unanswerable question is the question, printed.

   No new source and no new data: every figure is drawn from the modules above
   through their own public interfaces. Where this file introduces an assumption
   of its own — a holding period, a cost of sale, a refinance LTV — that
   assumption appears in the basis list as an assumption, with its value, so a
   user can see the lever rather than discover it. */
(function(){
'use strict';
const L=()=>window.LX;
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));

/* THE KINDS OF INPUT, and the distinction the first version of this file got
   wrong.

   Grading a column by its weakest input is right. Counting a FINANCING TERM as
   a weak input is not, and the two together produce a grade that cannot vary:
   every strategy involves at least one number the user sets — a down payment, a
   rehab preset, a holding period — so every column graded D, on every property,
   in every edition. Measured on the synthetic fleet before this was fixed: five
   columns, five D's, on every record tried. A grade that can never move is
   decoration, and decoration that looks like rigour is worse than no grade.

   The distinction that makes the grade mean something: an input is either a
   FACT THE DEAL DEPENDS ON or a LEVER THE USER PULLS.

     · Rent, after-repair value, acquisition value, completed rents, an exit cap
       rate — these stand in for facts about the world. The user cannot decide
       them. How well the record supports them IS the quality of the column.
     · 25% down, a cosmetic rehab preset, a six-month hold, a 7% cost of sale —
       these are decisions. Uncertainty is not the right word for a choice. They
       stay in the basis list, visible and adjustable and marked as levers, and
       they do not enter the grade.

   With levers excluded the grade discriminates, which is the entire point: a
   flip whose ARV comes from recorded comparable sales grades A, the same
   property's BRRRR grades C because it also needs a modelled rent, and a
   conversion grades D because the figures it rests on are modelled end to end.
   That spread is the honest answer to "which play is this building for". */
const KINDS = ['record','published','model','assumption'];
const KINDNAME = {
  record:     'from the public record',
  published:  'a published figure',
  model:      'modelled',
  assumption: 'an assumption standing in for a fact'
};
const GRADE = {
  record:     {band:'A', text:'every fact this rests on is in the public record'},
  published:  {band:'B', text:'recorded facts plus a published figure'},
  model:      {band:'C', text:'rests on a modelled figure — screening only, not a valuation'},
  assumption: {band:'D', text:'rests on an assumption standing in for a fact nobody measured'}
};
/* The grade reads the facts and ignores the levers. A column with no facts left
   to grade cannot exist — every strategy here starts from a recorded price. */
function worst(basis){
  let w = 'record';
  for(const b of basis){ if(b.lever) continue;
    if(KINDS.indexOf(b.kind) > KINDS.indexOf(w)) w = b.kind; }
  return w;
}

/* The switchboard's own assumptions, in one place so they can be shown rather
   than buried. Each one appears in the basis of every column that uses it. */
const SB = {
  holdMonths: 6,      // flip/BRRRR holding period
  sellPct:    7,      // cost of sale: commission + closing, % of ARV
  refiLTV:    75      // BRRRR refinance loan-to-value against ARV
};

/* ---------- the after-repair value, and why it is usually missing ----------
   An ARV from anything other than recorded sales is a guess with a decimal
   point. comps.js already enforces that a comparable is a RECORDED SALE WITH A
   DATE and already explains, per market, why it came back empty. This asks it
   and relays the answer verbatim rather than inventing a fallback. */
function arvFrom(l){
  let res=null;
  try{ res = window.LXComps && window.LXComps.find(l); }catch(e){ res=null; }
  if(!res) return {ok:false, why:'The comparable-sales engine is not loaded in this edition.'};
  if(!res.enough) return {ok:false, why: res.why || 'Not enough recorded comparable sales in this market to support an after-repair value.', n:res.n};
  /* THE BASIS IS NOT A DETAIL. comps.js works from one of two things: recorded
     SALE PRICES, or post-sale ASSESSED VALUES where a county publishes no dated
     sale. Both are in the public record and they are not the same kind of fact —
     one is a transaction, the other is an assessor's opinion, and this project's
     oldest rule is that an assessment is never called a price. An after-repair
     value built on assessments is a model wearing a record's clothes, so the
     basis travels with the figure and decides the column's grade. */
  const solid = res.basis==='sale';
  const sf=l.sqft, un=l.units;
  if(sf && sf>150 && res.ppsf && res.ppsf.n>=3 && res.ppsf.med)
    return {ok:true, solid, arv: Math.round(res.ppsf.med*sf), how:'median $'+Math.round(res.ppsf.med)+'/sq ft across '+res.ppsf.n+' '+res.basisName+' × '+L().fmtN(sf)+' sq ft'+(solid?'':' — these are assessed values, not transactions, so this is an estimate of an estimate'), n:res.ppsf.n, from:res.from, to:res.to};
  if(un && res.ppu && res.ppu.n>=3 && res.ppu.med)
    return {ok:true, solid, arv: Math.round(res.ppu.med*un), how:'median $'+L().fmtN(Math.round(res.ppu.med))+'/unit across '+res.ppu.n+' '+res.basisName+' × '+un+' units'+(solid?'':' — these are assessed values, not transactions, so this is an estimate of an estimate'), n:res.ppu.n, from:res.from, to:res.to};
  return {ok:false, why:'This market has '+res.n+' comparable recorded sales, but none of them carry a usable size or unit count, so there is nothing to scale to this building. A sale price with no denominator cannot become a value here.'};
}

/* The underwriting desk's OWN sheet for this property, scenario and all.
   LXUW.sheetFor(l) returns {u, uw}: the inputs the desk assembled (offer, rehab,
   contingency, rent, financing) and the full sheet it computed from them. The
   switchboard takes both rather than rebuilding either, so a change to the
   desk's assumptions moves this screen with it and the two can never disagree.

   It returns null on any internal failure, and every caller here treats null as
   "cannot be evaluated" rather than substituting a default — a default here
   would be a number nobody chose, presented beside numbers somebody did. */
function sheet(l){
  try{ return window.LXUW && window.LXUW.sheetFor(l); }catch(e){ return null; }
}

/* ---------- the five strategies ---------------------------------------- */

function stratHold(l){
  const X=L(); const re=X.rentEstimate(l);
  if(!re || !re.rent) return blocked('hold','Buy and hold',
    'No rent figure can be produced for this record, and a hold is a rent decision. ' +
    'Nothing downstream — cash flow, DSCR, cash-on-cash — means anything without one.');
  const S=sheet(l);
  if(!S) return blocked('hold','Buy and hold',
    'The underwriting desk could not assemble a sheet for this record, so there is no hold to evaluate.');
  const u=S.u, uw=S.uw;
  /* READ THE BASIS, DO NOT SNIFF THE PROSE.

     This used to classify rent by regex over the `how` sentence: 'record' if it
     matched "your figure" or "from your data", and 'model' for everything else.
     Everything else includes the last branch of LX.rentEstimate — price x 0.004,
     a rule of thumb anchored to nothing, which fires wherever a market publishes
     no rent at all. Of the fourteen markets this repository has measured, eight
     publish none. So the strategy comparison graded an invented rent exactly as
     it graded a rent derived from a published ZIP series, and a hold column in a
     rent-blind market carried the same basis band as one in the Bay.

     rentEstimate now states its own basis, so this reads it. The mapping also
     makes 'published' mean something for the first time: a ZORI series, a city
     median or a HUD FMR table is someone's published figure, which is a stronger
     claim than a model and a weaker one than this parcel's own record. A rule of
     thumb is an assumption, and grades as the weakest kind there is. */
  const RENT_KIND = {given:'record', market:'published', model:'model', none:'assumption'};
  const rentKind = RENT_KIND[re.basis] || 'model';
  return {
    key:'hold', name:'Buy and hold', state:'computed',
    head:{label:'Cash flow', val:money(uw.cfMo)+'/mo', good:uw.cfMo>0},
    rows:[
      ['Monthly cash flow', money(uw.cfMo)],
      ['Cash-on-cash', uw.coc!=null? pct(uw.coc) : unknown()],
      ['DSCR', uw.dscr!=null? uw.dscr.toFixed(2) : unknown()],
      ['Cash in', money(uw.cash)],
      ['5-yr IRR', uw.irr!=null? pct(uw.irr*100) : unknown('no solvable IRR — the flows never cross zero')]
    ],
    basis:[
      {what:'Purchase price', kind:'record', how: X.srcLine? 'the record for this parcel' : 'the record'},
      {what:'Rent', kind:rentKind, how:re.how},
      {what:'Operating expenses', kind:'assumption', lever:true, how:'the shared expense stack at your assumption settings'},
      {what:'Financing', kind:'assumption', lever:true, how:u.finOpt.name+' — '+u.finOpt.note},
      {what:'Appreciation', kind: uw.apprSrc==='fitted'?'model':'assumption', lever: uw.apprSrc==='yours'||uw.apprSrc==='scenario', how: apprHow(uw.apprSrc)}
    ]
  };
}

function apprHow(src){
  return src==='fitted' ? 'a twelve-month least-squares fit on the ZIP series, with a measured backtest band'
       : src==='yours'  ? 'your own figure'
       : src==='yoy'    ? 'the ZIP’s last twelve months, extrapolated — the weakest of the three'
       : src==='scenario' ? 'your scenario override'
       : 'the 2% default, because nothing better exists for this ZIP';
}

function stratFlip(l){
  const X=L();
  if(/land|lot|vacant/i.test(l.kind||'') && !l.sqft)
    return na('flip','Flip','This is land with no structure on the record. There is nothing to repair and resell; the play here is development, not a flip.');
  const a=arvFrom(l);
  if(!a.ok) return blocked('flip','Flip', a.why);
  const S=sheet(l);
  if(!S) return blocked('flip','Flip','The underwriting desk could not assemble a sheet for this record, so the rehab figure a flip turns on does not exist.');
  const u=S.u; const P=X.price(l); const rehabAll=u.rehab*(1+(u.cont!=null?u.cont:10)/100);
  const monthly = P*X.taxRate(l)/100/12 + Math.max(1200,P*X.state.assump.ins/100)/12;
  const debt = P*0.8*(X.state.assump.rate+3.5)/100/12;         // bridge money, the usual flip instrument
  const carry = (monthly+debt)*SB.holdMonths;
  const sell  = a.arv*SB.sellPct/100;
  const profit= a.arv - P - rehabAll - carry - sell;
  const cash  = P*0.2 + P*X.state.assump.closing/100 + rehabAll;
  return {
    key:'flip', name:'Flip', state:'computed',
    head:{label:'Profit', val:money(profit), good:profit>0},
    rows:[
      ['After-repair value', money(a.arv)],
      ['Rehab incl. contingency', money(rehabAll)],
      ['Carry, '+SB.holdMonths+' months', money(carry)],
      ['Cost of sale', money(sell)],
      ['Return on cash', cash>0? pct(profit/cash*100) : unknown()]
    ],
    basis:[
      {what:'Purchase price', kind:'record', how:'the record for this parcel'},
      {what:'After-repair value', kind: a.solid?'record':'model', how:a.how+(a.from?' ('+a.from+'–'+a.to+')':'')},
      {what:'Rehab', kind:'assumption', lever:true, how:'the rehab preset on the underwriting desk'},
      {what:'Carry', kind:'assumption', lever:true, how:SB.holdMonths+' months of taxes, insurance and bridge interest'},
      {what:'Cost of sale', kind:'assumption', lever:true, how:SB.sellPct+'% of the after-repair value'}
    ]
  };
}

function stratBRRRR(l){
  const X=L(); const re=X.rentEstimate(l);
  if(!re || !re.rent) return blocked('brrrr','BRRRR',
    'A BRRRR ends as a rental, and no rent figure can be produced for this record. The refinance has nothing to qualify against.');
  const a=arvFrom(l);
  if(!a.ok) return blocked('brrrr','BRRRR',
    'The refinance is sized against an after-repair value, and there is none. ' + a.why);
  const S=sheet(l);
  if(!S) return blocked('flip','Flip','The underwriting desk could not assemble a sheet for this record, so the rehab figure a flip turns on does not exist.');
  const u=S.u; const P=X.price(l); const rehabAll=u.rehab*(1+(u.cont!=null?u.cont:10)/100);
  const monthly = P*X.taxRate(l)/100/12 + Math.max(1200,P*X.state.assump.ins/100)/12;
  const carry = monthly*SB.holdMonths;
  const allIn = P + rehabAll + carry + P*X.state.assump.closing/100;
  const refi  = a.arv*SB.refiLTV/100;
  const left  = allIn - refi;
  const uw    = S.uw;
  const k=(X.state.assump.rate/100/12), n=X.state.assump.term*12;
  const ds = k>0? refi*k/(1-Math.pow(1+k,-n))*12 : refi/X.state.assump.term;
  const cf = uw.noi - ds;
  /* Capital fully recovered is a real and celebrated BRRRR outcome, and it is
     also a division by a non-positive number. Say what happened instead. */
  const cocRow = left>0 ? ['Cash-on-cash on capital left in', pct(cf/left*100)]
                        : ['Cash-on-cash', unknown('all capital recovered at refinance — there is no cash left in to divide by, so this ratio has no value. The surplus is '+money(-left)+'.')];
  return {
    key:'brrrr', name:'BRRRR', state:'computed',
    head:{label:'Capital left in', val: left>0? money(left) : 'none — '+money(-left)+' out', good:left<=0},
    rows:[
      ['All-in cost', money(allIn)],
      ['Refinance at '+SB.refiLTV+'% of ARV', money(refi)],
      ['Capital left in', left>0? money(left) : money(0)+' (surplus '+money(-left)+')'],
      ['Cash flow after refinance', money(cf/12)+'/mo'],
      cocRow
    ],
    basis:[
      {what:'Purchase price', kind:'record', how:'the record for this parcel'},
      {what:'After-repair value', kind: a.solid?'record':'model', how:a.how},
      {what:'Rent', kind:/your figure|from your data/.test(re.how)?'record':'model', how:re.how},
      {what:'Rehab', kind:'assumption', lever:true, how:'the rehab preset on the underwriting desk'},
      {what:'Refinance', kind:'assumption', lever:true, how:SB.refiLTV+'% loan-to-value at your assumed rate — no lender has quoted this'}
    ]
  };
}

function stratHack(l){
  const u=l.units||1;
  if(u<2 || u>4) return na('hack','House hack',
    u>4 ? 'This building has '+u+' units on the record. Owner-occupied financing runs to four; above that it is a commercial loan and a different play.'
        : 'The record shows a single unit. A house hack needs somewhere for the tenant to live.');
  if(!window.LXHH) return blocked('hack','House hack','The house-hack finder is not loaded in this edition.');
  const h=window.LXHH.hack(l); const X=L();
  const re=X.rentEstimate(l);
  return {
    key:'hack', name:'House hack', state:'computed',
    head:{label:'Your cost to live here', val:money(h.cost)+'/mo', good: h.save!=null && h.save>0},
    rows:[
      ['Payment, taxes, insurance, MIP', money(h.pitia)+'/mo'],
      ['Other units’ rent', money(h.otherRent)+'/mo'],
      ['Rent covers', h.cover!=null? pct(h.cover)+' of the payment' : unknown()],
      ['Versus renting in this ZIP', h.save!=null? (h.save>0? money(h.save)+'/mo better' : money(-h.save)+'/mo worse') : unknown('this ZIP publishes no typical-rent figure to compare against')],
      ['Within the national FHA ceiling', h.elig? 'yes' : 'no — the recorded price is above it'],
      ['Cash to close', money(h.cashNeed)]
    ],
    basis:[
      {what:'Purchase price', kind:'record', how:'the record for this parcel'},
      {what:'Unit count', kind:'record', how:'the record — '+u+' units'},
      {what:'FHA ceiling', kind:'published', how:'the published national FHA loan limit for '+u+' units. A ceiling is not eligibility: a lender qualifies the borrower, not the building'},
      {what:'Rent', kind:/your figure|from your data/.test(re.how)?'record':'model', how:re.how},
      {what:'Financing', kind:'assumption', lever:true, how:'3.5% down, UFMIP financed, MIP 0.55%/yr at your assumed rate less 0.3'}
    ]
  };
}

function stratConv(l){
  const u=l.units||1; const hotel=/hotel|motel|lodg/i.test(l.kind||'');
  if(!hotel && u<5) return na('conv','Conversion',
    'Conversion here means a hotel or a 5+ unit building re-planned as student or family housing. This record is neither.');
  if(!window.LXConv) return blocked('conv','Conversion','The conversion lab is not loaded in this edition.');
  const m=window.LXConv.model(l);
  return {
    key:'conv', name:'Conversion', state:'computed',
    head:{label:'Modelled gain', val:money(m.best.prof), good:m.best.prof>0},
    rows:[
      ['Best plan', m.best.plan],
      ['Delivered', L().fmtN(m.best.units)+' '+m.best.unitName],
      ['Construction', money(m.best.capex)],
      ['Value on completion', money(m.best.val)],
      ['Gain over acquisition + build', money(m.best.prof)]
    ],
    basis:[
      {what:'Building size and class', kind:'record', how:'the record for this parcel'},
      {what:'Acquisition value', kind:'model', how: m.hotel? 'a modelled per-key proxy — not a recorded sale' : 'income capitalised at the lab’s cap rate — not a recorded sale'},
      {what:'Construction cost', kind:'assumption', lever:true, how:'the lab’s per-sq-ft rate for this conversion type'},
      {what:'Completed rents', kind:'model', how:'ZIP typical rent scaled to the planned unit mix'},
      {what:'Exit cap rate', kind:'assumption', how:'the lab’s single cap rate — no transaction supports it for this building'}
    ]
  };
}

/* ---------- helpers ----------------------------------------------------- */
function na(key,name,why){ return {key,name,state:'n/a',why}; }
function blocked(key,name,why){ return {key,name,state:'blocked',why}; }
function money(v){ return (v==null||!isFinite(v))? '—' : L().fmt$(Math.round(v)); }
function pct(v){ return (v==null||!isFinite(v))? '—' : L().fmtPct(v,1); }
function unknown(why){ return {unknown:true, why: why||'not enough in the record to answer'}; }

/* ---------- the comparison ---------------------------------------------- */
function compare(l){
  const cols=[stratHold(l), stratFlip(l), stratBRRRR(l), stratHack(l), stratConv(l)];
  for(const c of cols){
    if(c.state!=='computed') continue;
    c.worst = worst(c.basis);
    c.grade = GRADE[c.worst];
  }
  return cols;
}

/* Which columns may be ranked against each other. Only columns that share a
   grade band are comparable at a glance; the rest are shown and explicitly NOT
   ranked, because ranking them is the lie this module exists to avoid. */
function comparable(cols){
  const done=cols.filter(c=>c.state==='computed');
  if(done.length<2) return {ok:false, why:'Fewer than two strategies could be computed for this property, so there is nothing to compare.'};
  const bands=new Set(done.map(c=>c.worst));
  if(bands.size>1) return {ok:false, why:'These columns do not rest on the same quality of fact — '+
    done.map(c=>c.name+' is '+KINDNAME[c.worst]).join('; ')+
    '. They sit side by side because the building is the same. The numbers are not equivalent and are deliberately not ranked: putting them in order would make the weakest one look like a finding.'};
  return {ok:true, why:'Every computed column rests on facts that are '+KINDNAME[done[0].worst]+', so they may be read against each other.'};
}


/* ---------- rendering ---------------------------------------------------- */
/* The rendering rules are the module's argument made visible:

   · a computed column shows its grade band and its basis list, always expanded
     enough that the weakest input is on screen next to the headline number
   · an n/a column keeps its place in the row and says why the building rules it
     out — a missing column would read as an oversight
   · a blocked column is the same width as a computed one and carries the reason
     in full. It is not greyed into the background, because the thing the user
     most needs to know about this property may be that half the plays cannot be
     evaluated from what this county publishes. */
let SEL=null;

function pickable(){
  const X=L(); const rows=X.filtered();
  return rows.slice(0, 400);
}
function subject(){
  const X=L();
  if(SEL){ const f=X.allListings().find(l=>l.id===SEL); if(f) return f; }
  if(X.state.sel){ const f=X.allListings().find(l=>l.id===X.state.sel); if(f) return f; }
  const p=pickable(); return p.length? p[0] : null;
}

function cell(v){
  if(v && v.unknown) return '<span class="unk" title="'+L().esc(v.why)+'">unknown</span>';
  return L().esc(String(v));
}
function colHTML(c){
  const X=L();
  if(c.state==='n/a')
    return '<div class="sbcol sbna"><h3>'+X.esc(c.name)+'</h3>'
      +'<p class="sbstate">does not apply</p><p class="sbwhy">'+X.esc(c.why)+'</p></div>';
  if(c.state==='blocked')
    return '<div class="sbcol sbblocked"><h3>'+X.esc(c.name)+'</h3>'
      +'<p class="sbstate">cannot be evaluated</p><p class="sbwhy">'+X.esc(c.why)+'</p></div>';
  const g=c.grade;
  let h='<div class="sbcol sbgrade-'+g.band+'"><h3>'+X.esc(c.name)+'</h3>'
    +'<p class="sbhead '+(c.head.good?'good':'bad')+'"><span class="sblab">'+X.esc(c.head.label)+'</span>'
    +'<span class="sbval">'+X.esc(c.head.val)+'</span></p><table class="sbrows">';
  for(const r of c.rows) h+='<tr><th>'+X.esc(r[0])+'</th><td>'+cell(r[1])+'</td></tr>';
  const facts=c.basis.filter(b=>!b.lever), levers=c.basis.filter(b=>b.lever);
  h+='</table><p class="sbband"><b>'+g.band+'</b> — '+X.esc(g.text)+'</p><details class="sbbasis"><summary>'
    +facts.length+' fact'+(facts.length===1?'':'s')+' this rests on'
    +(levers.length? ', and '+levers.length+' lever'+(levers.length===1?'':'s')+' you set' : '')
    +'</summary><ul>';
  for(const b of facts)
    h+='<li><b>'+X.esc(b.what)+'</b> <em class="sbkind sbkind-'+b.kind+'">'+X.esc(KINDNAME[b.kind])+'</em><br>'+X.esc(b.how)+'</li>';
  if(levers.length){
    h+='</ul><p class="sblevers">These are decisions, not uncertainties. They change the '
      +'numbers above and deliberately do not change the grade — a choice you made is not '
      +'a gap in the record.</p><ul>';
    for(const b of levers)
      h+='<li><b>'+X.esc(b.what)+'</b> <em class="sbkind sbkind-lever">a lever you set</em><br>'+X.esc(b.how)+'</li>';
  }
  return h+'</ul></details></div>';
}

function render(){
  const X=L(); const host=document.getElementById('sbgrid'); if(!host) return;
  const sel=document.getElementById('sbpick');
  if(sel && !sel.dataset.filled){
    const rows=pickable();
    sel.innerHTML=rows.map(l=>'<option value="'+X.esc(l.id)+'">'+X.esc((l.addr||l.id)+' · '+(l.city||l.county||''))+'</option>').join('');
    sel.dataset.filled='1';
    sel.onchange=()=>{ SEL=sel.value; render(); };
  }
  const l=subject();
  if(!l){ host.innerHTML='<p class="sbwhy">This edition’s current filter matches no properties, so there is nothing to compare. Widen the view.</p>'; return; }
  if(sel) sel.value=l.id;
  const cols=compare(l); const cmp=comparable(cols);
  const done=cols.filter(c=>c.state==='computed').length;
  const na  =cols.filter(c=>c.state==='n/a').length;
  const blk =cols.filter(c=>c.state==='blocked').length;
  const head=document.getElementById('sbsubject');
  if(head) head.innerHTML='<b>'+X.esc(l.addr||l.id)+'</b> · '+X.esc(l.city||l.county||'')+' · '+X.esc(l.kind||'unclassified')
    +' · '+X.fmt$(X.price(l))+' on the record';
  const note=document.getElementById('sbnote');
  if(note) note.innerHTML='<b>'+done+' of 5 strategies evaluated.</b> '
    +(na? na+' do not apply to this building. ':'')
    +(blk? blk+' cannot be evaluated from what this county publishes. ':'')
    +'<br>'+X.esc(cmp.why);
  host.innerHTML=cols.map(colHTML).join('');
}

window.LXSB = {render, compare, comparable, arvFrom, worst, SB, GRADE, KINDNAME,
               stratHold, stratFlip, stratBRRRR, stratHack, stratConv};
})();
