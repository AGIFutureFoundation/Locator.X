/* ===== Locator.X — the level gates ========================================
   Prompt 4/10. The four curriculum levels are written as capabilities, not as
   course counts — "produce a decision memo someone else could audit" — and
   until now nothing tested them. This does.

   The exercise: the learner picks a real parcel from the live data, commits to
   their own verdict on each LOCATOR gate BEFORE seeing the platform's, and is
   then shown where the two disagreed and why.

   Two things make this worth building rather than another quiz.

   1. It is graded against a computed verdict on a real record, not against an
      answer key. The platform can be wrong, says so, and the feedback teaches
      the reasoning rather than asserting the mark.

   2. The headline metric is not the score. It is the CERTAINTY ERROR count —
      the number of gates where the learner returned pass or fail on something
      the record cannot answer. That is the platform's entire doctrine, made
      testable: claiming certainty the evidence does not support is a different
      and worse failure than being wrong, and it is the one habit this whole
      Academy exists to break. Excess caution — unknown where the record did
      resolve — is reported separately and much more gently, because it is.
   ========================================================================= */
(function(){
'use strict';
var $ = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s==null?'':s)); };
var fmt$ = function(n){ return (window.LX && LX.fmt$) ? LX.fmt$(n) : ('$'+Math.round(n||0)); };

var KEY = 'lxgates';
var store = {}; try{ store = JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ store={}; }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(store)); }catch(e){} }

var VERDICTS = [
  {v:'pass',    l:'Pass',    d:'The record supports it'},
  {v:'warn',    l:'Caution', d:'It clears, but thinly'},
  {v:'fail',    l:'Fail',    d:'It does not clear'},
  {v:'unknown', l:'Unknown', d:'The record cannot answer this'}
];

var LEVELS = [
  {n:1, name:'Foundation', task:'Read the record',
   ask:['L','C','A'],
   brief:'Three gates. Can you look at a record and know what it supports — before any arithmetic you did yourself?',
   extra:null},
  {n:2, name:'Practitioner', task:'Underwrite and price',
   ask:['L','O','C','A','T','O2','R'],
   brief:'All seven gates, then commit to the highest price at which you would still buy it.',
   extra:'offer'},
  {n:3, name:'Operator', task:'Structure it',
   ask:['L','O','C','A','T','O2','R'],
   brief:'All seven gates, then name which of the three lender tests actually binds this loan today.',
   extra:'bind'},
  {n:4, name:'Principal', task:'Defend it',
   ask:['L','O','C','A','T','O2','R'],
   brief:'All seven gates, then state how many of them the record could not answer — and write the one sentence you would defend to a partner.',
   extra:'unknowns'}
];

var GATE_Q = {
  L:  'Location & legal capacity — does the record say what you may do here?',
  O:  'Ownership economics — do enough of the four ways it pays actually resolve?',
  C:  'Cash flow — does it pay while you hold it?',
  A:  'Asset test — can the cash flows be named, sourced and defended?',
  T:  'Terms & leverage — does the building service the debt?',
  O2: 'Outlook — is the appreciation figure sourced rather than assumed?',
  R:  'Record — did the six gates above resolve from the record?'
};
var GATE_IX = {L:0, O:1, C:2, A:3, T:4, O2:5, R:6};

/* ---- candidate parcels: a deterministic spread across the live data ------ */
function candidates(){
  var X = window.LX; if(!X || !X.allListings) return [];
  var all;
  try{ all = X.allListings(); }catch(e){ return []; }
  if(!all || !all.length) return [];
  var step = Math.max(1, Math.floor(all.length/97));
  var out = [];
  for(var i=0; i<all.length && out.length<8; i+=step){
    var l = all[i];
    if(l && l.id) out.push(l);
  }
  return out;
}

function gatesFor(l){
  if(!window.LXUW || !window.LXUW.sheetFor || !window.LXLocator) return null;
  var sh = LXUW.sheetFor(l); if(!sh) return null;
  try{ return {g: LXLocator.gates(l, sh.uw), uw: sh.uw, u: sh.u, l: l}; }catch(e){ return null; }
}

/* ---- scoring ------------------------------------------------------------ */
var ORDER = {pass:0, warn:1, fail:2};
function compare(mine, theirs){
  if(theirs === 'unknown' && mine === 'unknown') return {k:'held',  t:'Held the line'};
  if(theirs === 'unknown')                       return {k:'certainty', t:'Certainty error'};
  if(mine === 'unknown')                         return {k:'cautious', t:'Over-cautious'};
  if(mine === theirs)                            return {k:'match', t:'Agreed'};
  if(Math.abs(ORDER[mine]-ORDER[theirs]) === 1)  return {k:'near',  t:'One step apart'};
  return {k:'miss', t:'Opposite call'};
}
var WEIGHT = {match:1, held:1, near:0.5, cautious:0.5, miss:0, certainty:0};
var TONE = {match:'good', held:'good', near:'warn', cautious:'warn', miss:'bad', certainty:'bad'};

function score(answers, computed, lvl){
  var rows = [], pts = 0, max = 0, certainty = 0;
  lvl.ask.forEach(function(k){
    var ix = GATE_IX[k], cg = computed.g[ix];
    if(!cg) return;
    var theirs = cg.v === 'report' ? (cg.val.indexOf('0 ') === 0 ? 'pass' : 'unknown') : cg.v;
    var mine = answers[k] || 'unknown';
    var c = compare(mine, theirs);
    if(c.k === 'certainty') certainty++;
    pts += WEIGHT[c.k]; max += 1;
    rows.push({k:k, q:GATE_Q[k], mine:mine, theirs:theirs, cmp:c, why:cg.note, val:cg.val, name:cg.t});
  });
  return {rows:rows, pts:pts, max:max, pct: max? Math.round(pts/max*100) : 0, certainty:certainty};
}

/* ---- render ------------------------------------------------------------- */
var state = {lvl:null, pid:null, answers:{}, extra:'', thesis:'', rubric:{}, result:null};

function chip(k, v, on){
  return '<button class="chip' + (on?' on':'') + '" data-g="' + k + '" data-v="' + v.v + '" '
    + 'title="' + esc(v.d) + '" style="font-size:11.5px">' + esc(v.l) + '</button>';
}

function render(){
  var host = $('#gateroot'); if(!host) return;
  var done = LEVELS.filter(function(L){ return store['L'+L.n]; }).length;

  if(!state.lvl){
    host.innerHTML =
      '<div class="cards" style="margin:0 0 12px">'
      + '<div class="tile"><p class="eyebrow" style="margin:0">Level gates passed</p>'
      +   '<p class="big num" style="margin:4px 0 2px">' + done + ' / 4</p>'
      +   '<p style="font-size:11.5px;color:var(--muted);margin:0">graded against a real record</p></div>'
      + '<div class="tile"><p class="eyebrow" style="margin:0">How this is graded</p>'
      +   '<p style="font-size:12px;color:var(--ink2);margin:5px 0 0;line-height:1.55">You commit to a verdict on each gate '
      +   '<b>before</b> seeing the platform\'s. The headline is not the score &mdash; it is how often you claimed '
      +   'pass or fail on a gate the record cannot answer.</p></div>'
      + '</div>'
      + LEVELS.map(function(L){
          var r = store['L'+L.n];
          return '<div class="chart" style="margin-bottom:10px">'
            + '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">'
            +   '<span class="badge ' + (r? (r.certainty? 'warn':'good') : '') + '" style="font-size:11px">Level ' + L.n + '</span>'
            +   '<b style="font-size:14px">' + esc(L.task) + '</b>'
            +   '<span style="font-size:11.5px;color:var(--muted)">' + esc(L.name) + '</span>'
            +   '<span style="margin-left:auto;font-size:11.5px;color:var(--muted)" class="num">'
            +     (r? r.pct + '% · ' + r.certainty + ' certainty ' + (r.certainty===1?'error':'errors') : 'not attempted') + '</span>'
            + '</div>'
            + '<p class="chartnote" style="margin:5px 0 9px">' + esc(L.brief) + '</p>'
            + '<button class="btn' + (r?'':' primary') + '" data-start="' + L.n + '">'
            +   (r? 'Attempt again' : 'Start the gate') + '</button></div>';
        }).join('')
      + '<p class="src">Graded against the LOCATOR verdict this platform computes for the same parcel. '
      + 'Disagreeing with the screen is not automatically wrong &mdash; the screen states its own limits, and where '
      + 'you differ you are shown its reasoning rather than a mark. Passing a level gate is a record of applied work '
      + 'on a real property, not an accredited qualification.</p>';
    return;
  }

  var L = state.lvl;
  var cands = candidates();
  if(!cands.length){
    host.innerHTML = '<div class="tile"><p style="font-size:13px;margin:0">No properties are loaded in this edition, '
      + 'so the level gates cannot run here. Open an edition with listings.</p>'
      + '<button class="btn" data-back="1" style="margin-top:10px">Back</button></div>';
    return;
  }

  if(!state.pid){
    host.innerHTML = '<div class="chart"><div class="eyebrow" style="margin:0 0 4px">Level ' + L.n + ' &middot; ' + esc(L.task) + '</div>'
      + '<p class="chartnote" style="margin:0 0 10px">Pick the parcel you will be graded on. They differ deliberately &mdash; '
      + 'some of these cannot be answered from the record, and noticing that is part of the test.</p>'
      + '<div style="display:grid;gap:6px">'
      + cands.map(function(l){
          return '<button class="btn" data-pick="' + esc(l.id) + '" style="text-align:left;font-size:12.5px">'
            + '<b>' + esc(l.addr||'—') + '</b>, ' + esc(l.city||'') + ' &middot; ' + fmt$(LX.price(l))
            + (l.kind? ' &middot; ' + esc(l.kind):'') + (l.units? ' &middot; ' + l.units + 'u':'') + '</button>';
        }).join('')
      + '</div><button class="btn" data-back="1" style="margin-top:10px">Back</button></div>';
    return;
  }

  var l = LX.allListings().find(function(x){ return x.id === state.pid; });
  var computed = l && gatesFor(l);
  if(!computed){
    host.innerHTML = '<div class="tile"><p style="font-size:13px;margin:0">That parcel cannot be underwritten here. Pick another.</p>'
      + '<button class="btn" data-pick="" style="margin-top:10px">Choose again</button></div>';
    return;
  }

  if(!state.result){
    host.innerHTML = '<div class="chart">'
      + '<div class="eyebrow" style="margin:0 0 3px">Level ' + L.n + ' &middot; ' + esc(L.task) + '</div>'
      + '<p style="font-size:13px;margin:0 0 2px"><b>' + esc(l.addr||'') + '</b>, ' + esc(l.city||'') + ' &middot; ' + fmt$(LX.price(l)) + '</p>'
      + '<p class="chartnote" style="margin:0 0 12px">Commit to a verdict on each gate. You will not see the platform\'s until you submit.</p>'
      + L.ask.map(function(k){
          return '<div style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;margin-bottom:7px">'
            + '<p style="font-size:12.5px;margin:0 0 7px">' + esc(GATE_Q[k]) + '</p>'
            + '<div class="chips" style="margin:0">'
            + VERDICTS.map(function(v){ return chip(k, v, state.answers[k]===v.v); }).join('')
            + '</div></div>';
        }).join('')
      + (L.extra === 'offer' ? '<label class="field" style="font-size:12.5px;display:block;margin:10px 0">Your maximum offer, in dollars'
          + '<input id="gx" type="number" step="1000" value="' + esc(state.extra) + '" style="width:180px;margin-left:8px"></label>' : '')
      + (L.extra === 'bind' ? '<div style="margin:10px 0"><p style="font-size:12.5px;margin:0 0 6px">Which lender test binds this loan today?</p>'
          + '<div class="chips" style="margin:0">'
          + ['LTV','DSCR','Debt yield'].map(function(o){
              return '<button class="chip' + (state.extra===o?' on':'') + '" data-x="' + o + '" style="font-size:11.5px">' + o + '</button>';
            }).join('') + '</div></div>' : '')
      + (L.extra === 'unknowns' ? '<label class="field" style="font-size:12.5px;display:block;margin:10px 0">How many of the six gates could the record NOT answer?'
          + '<input id="gx" type="number" min="0" max="6" value="' + esc(state.extra) + '" style="width:90px;margin-left:8px"></label>'
          + '<label class="field" style="font-size:12.5px;display:block;margin:8px 0">The one sentence you would defend to a partner'
          + '<textarea id="gthesis" style="width:100%;min-height:54px;margin-top:5px">' + esc(state.thesis||'') + '</textarea></label>' : '')
      + '<div class="toolbar" style="margin-top:10px"><button class="btn primary" data-submit="1">Submit and compare</button>'
      + '<button class="btn" data-back="1">Cancel</button></div></div>';
    return;
  }

  /* ---- results ---- */
  var R = state.result;
  host.innerHTML = '<div class="chart">'
    + '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:3px">'
    +   '<div class="eyebrow" style="margin:0">Level ' + L.n + ' &middot; ' + esc(L.task) + '</div>'
    +   '<span class="badge ' + (R.certainty? 'bad' : (R.pct>=70?'good':'warn')) + '">' + R.pct + '% agreement</span>'
    +   '<span class="badge ' + (R.certainty? 'bad':'good') + '">' + R.certainty + ' certainty ' + (R.certainty===1?'error':'errors') + '</span>'
    + '</div>'
    + '<p class="chartnote" style="margin:0 0 12px">'
    + (R.certainty
        ? 'You returned a verdict on ' + R.certainty + ' ' + (R.certainty===1?'gate':'gates') + ' the record cannot answer. That is the error this Academy exists to break &mdash; it is worse than being wrong, because being wrong is visible and this is not.'
        : 'You claimed no certainty the record does not support. That is the hardest part of this and you did it.')
    + '</p>'
    + R.rows.map(function(r){
        var same = r.cmp.k==='match' || r.cmp.k==='held';
        return '<div style="border:1px solid var(--line);border-left:3px solid var(--' 
          + (TONE[r.cmp.k]==='good'?'good':TONE[r.cmp.k]==='bad'?'bad':'cat3') + ');border-radius:8px;padding:9px 11px;margin-bottom:7px">'
          + '<div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">'
          +   '<span class="num" style="font-weight:700">' + esc(r.k==='O2'?'O':r.k) + '</span>'
          +   '<b style="font-size:12.5px">' + esc(r.name) + '</b>'
          +   '<span style="margin-left:auto;font-size:11px" class="badge ' + TONE[r.cmp.k] + '">' + esc(r.cmp.t) + '</span>'
          + '</div>'
          + '<p style="font-size:12px;color:var(--muted);margin:5px 0 0">You said <b>' + esc(r.mine) + '</b> &middot; '
          +   'the screen said <b>' + esc(r.theirs) + '</b> (' + esc(r.val) + ')</p>'
          + (same? '' : '<p style="font-size:12px;color:var(--ink2);margin:4px 0 0;line-height:1.5">' + esc(r.why) + '</p>')
          + (window.LXNotes? LXNotes.block('gate', r.k) : '')
          + '</div>';
      }).join('')
    + (R.extraNote? '<div class="tile" style="margin-top:4px"><p style="font-size:12.5px;margin:0;line-height:1.55">' + R.extraNote + '</p></div>' : '')
    + ((R.thesis && window.LXThesis)? LXThesis.panel(R.thesisText, R.thesis, state.rubric) : '')
    + '<p class="src" style="margin-top:10px">Where you and the screen disagreed you were shown its reasoning, not a mark. '
    + 'If you still think you were right, write down why &mdash; that is the Record Locker discipline, and in two years it is '
    + 'the only thing that will tell you whether you read this well.</p>'
    + '<div class="toolbar" style="margin-top:10px"><button class="btn primary" data-back="1">Back to the gates</button></div></div>';
}

/* ---- events ------------------------------------------------------------- */
/* capture() pulls whatever the learner has typed into state BEFORE anything
   re-renders. Without it, a full render() on a chip click rebuilds the inputs
   from state and silently discards typed text — which cost a level-four learner
   their thesis, the most effortful thing in the assessment. Selecting a verdict
   now mutates only the chips it affects and does not re-render at all. */
function capture(){
  var gx = $('#gx'); if(gx) state.extra = gx.value;
  var th = $('#gthesis'); if(th) state.thesis = th.value;
}
function paintChips(group, attr, val){
  $$('#gateroot [' + attr + '="' + group + '"]').forEach(function(el){
    el.classList.toggle('on', el.dataset.v === val);
  });
}
/* The self-assessed rubric repaints in place for the same reason the verdict
   chips do: a full render() here would discard the sentence being judged. */
function setRubric(id, v){
  state.rubric[id] = v;
  $$('#gateroot [data-tr="' + id + '"]').forEach(function(el){
    el.classList.toggle('on', el.dataset.v === v);
  });
  var row = $('#gateroot [data-tr="' + id + '"]');
  var box = row && row.closest ? row.closest('div[style*="border-radius:8px"]') : null;
  if(box){
    var miss = null, R = window.LXThesis;
    if(R){ R.RUBRIC.forEach(function(r){ if(r.id === id) miss = r.miss; }); }
    var p = box.querySelector('p.trmiss');
    if(v !== 'yes' && miss){
      if(!p){ p = document.createElement('p'); p.className = 'trmiss';
        p.setAttribute('style','font-size:12px;line-height:1.5;margin:8px 0 0;color:var(--muted)');
        box.appendChild(p); }
      p.textContent = miss;
    } else if(p){ p.remove(); }
  }
  var tl = $('#trtally'); if(tl && window.LXThesis) tl.innerHTML = LXThesis.tallyLine(state.rubric);
  var rec = store['L4'];
  if(rec){ rec.rubric = state.rubric; save(); }
}
function paintExtraChips(val){
  $$('#gateroot [data-x]').forEach(function(el){
    el.classList.toggle('on', el.dataset.x === val);
  });
}
function onClick(ev){
  var t = ev.target.closest ? ev.target : null; if(!t) return;
  var b;
  if((b = t.closest('[data-start]'))){ state = {lvl:LEVELS[+b.dataset.start-1], pid:null, answers:{}, extra:'', thesis:'', rubric:{}, result:null}; render(); return; }
  if((b = t.closest('[data-back]'))){ state = {lvl:null, pid:null, answers:{}, extra:'', thesis:'', rubric:{}, result:null}; render(); return; }
  if((b = t.closest('[data-pick]'))){ capture(); state.pid = b.dataset.pick || null; state.result=null; render(); return; }
  /* targeted: no re-render, so typed fields survive */
  if((b = t.closest('[data-g]'))){ state.answers[b.dataset.g] = b.dataset.v; paintChips(b.dataset.g, 'data-g', b.dataset.v); return; }
  if((b = t.closest('[data-x]'))){ state.extra = b.dataset.x; paintExtraChips(b.dataset.x); return; }
  if((b = t.closest('[data-tr]'))){ setRubric(b.dataset.tr, b.dataset.v); return; }
  if((b = t.closest('[data-submit]'))){ submit(); return; }
}
/* keep state current as they type, so nothing depends on capture() alone */
function onInput(ev){
  if(ev.target.id === 'gx') state.extra = ev.target.value;
  if(ev.target.id === 'gthesis') state.thesis = ev.target.value;
}
function submit(){
  var L = state.lvl; if(!L) return;
  var miss = L.ask.filter(function(k){ return !state.answers[k]; });
  if(miss.length){ alert('Commit to a verdict on every gate first — ' + miss.length + ' still open.'); return; }
  capture();
  var l = LX.allListings().find(function(x){ return x.id === state.pid; });
  var computed = gatesFor(l); if(!computed) return;
  var R = score(state.answers, computed, L);

  if(L.extra === 'offer'){
    var mine = +state.extra || 0, theirs = null;
    try{ theirs = LXUW.maxOffer(l, computed.u); }catch(e){}
    if(theirs && mine){
      var gap = (mine - theirs)/theirs*100;
      R.extraNote = '<b>Your maximum offer ' + fmt$(mine) + ' against the solver\'s ' + fmt$(theirs) + '</b> — '
        + (Math.abs(gap)<=10 ? 'within ten per cent. You priced it.'
           : gap>0 ? 'you would pay ' + Math.round(gap) + '% more than the buy box supports. Find which assumption of yours is carrying that.'
                   : 'you would pay ' + Math.round(-gap) + '% less. Conservative is survivable, but you will lose deals you could have held.');
    } else if(mine){ R.extraNote = '<b>The solver could not price this one</b>, so your offer of ' + fmt$(mine) + ' stands unchecked. That is itself a finding.'; }
  }
  if(L.extra === 'bind'){
    var uw = computed.uw, binds = 'LTV';
    if(uw.dscr != null && uw.dscr < 1.25) binds = 'DSCR';
    else if(uw.debtYield != null && uw.debtYield < 8) binds = 'Debt yield';
    R.extraNote = '<b>Binding test: ' + binds + '</b> (DSCR ' + (uw.dscr!=null?Math.round(uw.dscr*100)/100:'—')
      + ' · LTV ' + (uw.ltv!=null?Math.round(uw.ltv)+'%':'—') + ' · debt yield ' + (uw.debtYield!=null?Math.round(uw.debtYield*10)/10+'%':'—') + '). '
      + (state.extra===binds ? 'You called it.' : 'You said ' + esc(state.extra||'—') + '. All three are tested and the smallest loan wins — re-read which one that is here.');
  }
  if(L.extra === 'unknowns'){
    var actual = computed.g.filter(function(x){ return x.v==='unknown'; }).length;
    var said = +state.extra;
    R.extraNote = '<b>Gates the record could not answer: ' + actual + '. You said ' + (isFinite(said)?said:'—') + '.</b> '
      + (said===actual ? 'Correct — and knowing the size of what you cannot know is the whole of level four.'
                       : 'The count matters more than the verdicts: it is what travels with the decision.')
      + (state.thesis? '' : '<br><br>No sentence was written. That box is the level, not an optional extra &mdash; the gates can be re-run.');
    if(state.thesis && window.LXThesis){
      try{ R.thesis = LXThesis.check(state.thesis, computed); R.thesisText = state.thesis; }catch(e){ R.thesis = null; }
    }
  }

  state.result = R;
  store['L'+L.n] = {pct:R.pct, certainty:R.certainty, at:Date.now(), pid:state.pid,
    /* the disagreements themselves, compactly — this is what the instructor
       note queue ranks on, and a count alone cannot say WHERE it happened */
    dis: R.rows.filter(function(r){ return r.cmp.k !== 'match' && r.cmp.k !== 'held'; })
               .map(function(r){ return {k:r.k, mine:r.mine, theirs:r.theirs, c:r.cmp.k}; })};
  if(L.extra === 'unknowns' && state.thesis){
    store['L'+L.n].thesis = state.thesis;
    store['L'+L.n].rubric = state.rubric;
    if(R.thesis){ store['L'+L.n].strays = R.thesis.strays.length; store['L'+L.n].grounds = R.thesis.grounds.length; }
  }
  save();
  render();
}

var wired = false;
function mount(){
  var host = $('#gateroot'); if(!host) return;
  if(!wired){ host.addEventListener('click', onClick); host.addEventListener('input', onInput); wired = true; }
  render();
}
document.addEventListener('DOMContentLoaded', function(){ setTimeout(mount, 900); });
setTimeout(mount, 1400);
window.LXGate = {render:render, mount:mount, score:score, LEVELS:LEVELS};
})();
