/* locator.x — what the building actually did, against what this desk said it would.
   ----------------------------------------------------------------------------
   docs/market/GAP.md carried one row whose honest name it gave itself: "Post-
   acquisition feedback into underwriting — src/predict.js backtest is the
   mechanism; nothing feeds it operating results yet. **partial** — the honest
   name for this is *not built*." This is that row.

   The pipeline ran new → screened → underwritten → offer drafted → passed, and
   stopped. Nothing came after the offer, so the desk never learned whether its
   own arithmetic had been right about anything it screened. A platform that
   grades every input it uses and backtests every forecast it draws had no
   measurement at all of the number it exists to produce.

   WHAT THIS IS. An owned-property ledger and the error it reveals. You record
   what a building actually did — what you paid, what rent you actually
   collected, what you actually spent — and this compares it against what the
   desk underwrote for that same property. Per property, that is a fact. Across
   several, it is the systematic bias in your own underwriting, which is the
   only figure here that can change how you underwrite the next one.

   THE RULE IT INHERITS. src/telemetry.js states the discipline this page also
   follows: state the denominator BEFORE any rate, and refuse to print a rate
   below a stated floor, even when that leaves the page looking empty. One
   property's error is a fact about one property. Four is the least this will
   call a tendency, and it says n every time. A bias computed from two buildings
   is a decoration, not a finding — and this repository already refuses that
   everywhere else.

   WHAT IT WILL NOT DO. It will not adjust the underwriting automatically. The
   desk's assumptions are the user's, and silently tuning them toward whatever
   the last three buildings did would replace a stated assumption with an
   unstated one — the same laundering docs/INTEROP.md refuses between the desk
   and the app. It reports the bias and names the assumption that would move. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var $$ = function(s, el){ return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function N(v){ var n = (typeof v === 'string') ? parseFloat(v.replace(/[^0-9.\-]/g, '')) : v;
  return (typeof n === 'number' && isFinite(n)) ? n : null; }

/* The floor. Below it this prints facts and no rates. */
var BIAS_FLOOR = 4;

var book = L().store('actuals') || {};
function save(){ L().store('actuals', book); }
function rec(id){ return book[id] || (book[id] = {}); }

/* ---- the comparison ----------------------------------------------------
   Underwritten figures come from the desk's own sheet for this property, so
   the comparison is against what the app WOULD say today at the user's current
   assumptions. That is the honest thing to compare: the question is whether
   this desk's method is biased, not whether a figure typed last year matched. */
function compare(l){
  var a = book[l.id];
  if(!a) return null;
  var X = L();
  var sh = null;
  try{ sh = window.LXUW && LXUW.sheetFor(l); }catch(e){ sh = null; }
  if(!sh || !sh.uw) return {id:l.id, l:l, err:'the desk could not assemble a sheet for this property'};
  var uw = sh.uw;
  var rows = [];
  function line(label, said, actual, unit, note){
    if(said == null || actual == null) return;
    rows.push({label:label, said:said, actual:actual, unit:unit,
               diff:actual - said, pct: said ? (actual - said) / Math.abs(said) * 100 : null, note:note});
  }
  line('Monthly rent', uw.rentMo, N(a.rentMo), '$/mo',
       'what the income method produced against what the tenant paid');
  line('Annual operating expenses', uw.opex, N(a.opexYr), '$/yr',
       'the shared expense stack against the real ledger');
  /* NOI is derived on both sides, so it is computed the same way from each — a
     comparison of two NOIs built by different formulas would measure the
     formulas, not the estimate. */
  var aEgi = (N(a.rentMo) != null) ? N(a.rentMo) * 12 * (1 - (X.state.assump.vacancy || 0) / 100) : null;
  var aNoi = (aEgi != null && N(a.opexYr) != null) ? aEgi - N(a.opexYr) : null;
  line('Net operating income', uw.noi, aNoi, '$/yr',
       'both sides computed as effective income minus operating expenses');
  line('Purchase price', uw.P, N(a.paid), '$',
       'the desk’s offer basis against the recorded closing price');
  return {id:l.id, l:l, rows:rows, acquired:a.on || null};
}

/* ---- the aggregate, which is the point ---------------------------------- */
function bias(){
  var X = L(), all = [];
  try{ all = X.allListings(); }catch(e){ return null; }
  var owned = all.filter(function(l){ return book[l.id] && book[l.id].own; });
  var by = {};
  owned.forEach(function(l){
    var c = compare(l);
    if(!c || !c.rows) return;
    c.rows.forEach(function(r){
      if(r.pct == null) return;
      (by[r.label] = by[r.label] || {label:r.label, pct:[], unit:r.unit}).pct.push(r.pct);
    });
  });
  var out = Object.keys(by).map(function(k){
    var v = by[k].pct.slice().sort(function(p, q){ return p - q; });
    var mid = v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : null;
    return {label:k, n:v.length, med:mid, lo:v[0], hi:v[v.length - 1]};
  });
  return {owned:owned.length, lines:out, floor:BIAS_FLOOR};
}

/* The assumption a given bias would move. Named, never applied — see the note
   at the top of this file about why this page does not tune the desk itself. */
var LEVER = {
  'Monthly rent': 'the income method, and the rent you accept without a lease to back it',
  'Annual operating expenses': 'the maintenance, capex and management percentages in Assumptions',
  'Net operating income': 'whichever of rent or expenses above is carrying the error',
  'Purchase price': 'nothing in the desk — this is what you negotiated, not what it estimated'
};

function pct1(v){ return (v == null) ? '—' : (v > 0 ? '+' : '') + v.toFixed(1) + '%'; }

function render(){
  var host = $('#actualsroot');
  if(!host) return;
  var X = L();
  var all = [];
  try{ all = X.allListings(); }catch(e){ return; }
  var owned = all.filter(function(l){ return book[l.id] && book[l.id].own; });
  var h = '';

  h += '<p class="eyebrow" style="margin:0 0 2px">Acquired · what the building actually did</p>'
    +  '<h3 style="margin:0 0 6px">Was this desk right?</h3>';

  if(!owned.length){
    h += '<p class="covwhy">Nothing is marked acquired yet. Set a property’s pipeline stage to '
      +  '<b>Acquired</b> in the matches table below, then record what it actually did — what you paid, '
      +  'the rent you actually collect, and what you actually spend in a year. This page then compares '
      +  'those against what the desk underwrites for that same property today, and once there are '
      +  BIAS_FLOOR + ' of them it will tell you which way your underwriting leans.</p>'
      +  '<p class="covwhy">Until then it will say nothing, because the error on one building is a fact '
      +  'about one building and a tendency computed from two is a decoration.</p>';
    host.innerHTML = h;
    return;
  }

  /* ---- the aggregate first, with its denominator in front of it ---------- */
  var b = bias();
  h += '<div class="tile" style="margin:0 0 12px">';
  if(b.owned < BIAS_FLOOR){
    h += '<p class="covwhy" style="margin:0"><b>' + X.fmtN(b.owned) + ' acquired</b> — below the '
      +  BIAS_FLOOR + '-property floor this page uses before it will call anything a tendency. '
      +  'Each building’s error is below and every one of them is a fact. A median computed from '
      +  b.owned + ' is not.</p>';
  } else {
    h += '<p class="covwhy" style="margin:0 0 8px">Across <b>' + X.fmtN(b.owned)
      +  '</b> acquired properties, the desk’s estimate against the ledger. A positive figure means '
      +  'the building did <b>better</b> than this desk said it would.</p>'
      +  '<table class="covtab"><thead><tr><th>Line</th><th>Median error</th><th>Range</th>'
      +  '<th>What would move it</th></tr></thead><tbody>';
    b.lines.forEach(function(r){
      h += '<tr><th>' + esc(r.label) + '</th>'
        +  '<td>' + pct1(r.med) + ' <span style="color:var(--muted)">(n=' + r.n + ')</span></td>'
        +  '<td>' + pct1(r.lo) + ' … ' + pct1(r.hi) + '</td>'
        +  '<td class="covwhy">' + esc(LEVER[r.label] || '—') + '</td></tr>';
    });
    h += '</tbody></table>'
      +  '<p class="covwhy" style="margin:8px 0 0">This page does not change your assumptions. Tuning them '
      +  'toward whatever the last few buildings did would replace a stated assumption with an unstated '
      +  'one, which is the laundering the desk’s own interop contract refuses.</p>';
  }
  h += '</div>';

  /* ---- per property ------------------------------------------------------ */
  owned.forEach(function(l){
    var c = compare(l);
    h += '<div class="tile" style="margin:0 0 10px"><div style="display:flex;justify-content:space-between;'
      +  'align-items:baseline;gap:10px;flex-wrap:wrap"><b>' + esc(l.addr) + ', ' + esc(l.city) + '</b>'
      +  '<button class="btn" data-actforget="' + esc(l.id) + '" style="font-size:12px">Remove</button></div>';
    if(c && c.err){ h += '<p class="covwhy">' + esc(c.err) + '</p></div>'; return; }
    h += '<table class="covtab"><thead><tr><th>Line</th><th>The desk said</th><th>It actually did</th>'
      +  '<th>Difference</th></tr></thead><tbody>';
    (c.rows || []).forEach(function(r){
      h += '<tr><th>' + esc(r.label) + '</th>'
        +  '<td>' + X.fmtFull(Math.round(r.said)) + '</td>'
        +  '<td>' + X.fmtFull(Math.round(r.actual)) + '</td>'
        +  '<td>' + pct1(r.pct) + '</td></tr>';
    });
    if(!(c.rows || []).length){
      h += '<tr><td colspan="4" class="covwhy">Nothing recorded for this property yet — fill the '
        +  'figures below and it will compare.</td></tr>';
    }
    h += '</tbody></table>';
    var a = book[l.id] || {};
    h += '<div class="uwgrid" style="margin-top:8px">'
      +  '<label>Paid <input type="number" data-act="paid" data-id="' + esc(l.id) + '" value="' + (a.paid == null ? '' : a.paid) + '" placeholder="closing price"></label>'
      +  '<label>Actual rent $/mo <input type="number" data-act="rentMo" data-id="' + esc(l.id) + '" value="' + (a.rentMo == null ? '' : a.rentMo) + '" placeholder="collected"></label>'
      +  '<label>Actual opex $/yr <input type="number" data-act="opexYr" data-id="' + esc(l.id) + '" value="' + (a.opexYr == null ? '' : a.opexYr) + '" placeholder="everything but debt"></label>'
      +  '<label>Acquired <input type="month" data-act="on" data-id="' + esc(l.id) + '" value="' + esc(a.on || '') + '"></label>'
      +  '</div></div>';
  });

  h += '<p class="src">Everything on this page is typed by you and stored in this browser only — it is '
    +  'never uploaded, and it travels with nothing. The comparison is against what the desk underwrites '
    +  '<b>today at your current assumptions</b>, not against a figure saved when you bought: the question '
    +  'is whether this method is biased, not whether one old number matched.</p>';

  host.innerHTML = h;

  $$('#actualsroot input[data-act]').forEach(function(el){
    el.addEventListener('change', function(){
      var r = rec(el.dataset.id);
      var k = el.dataset.act;
      r[k] = (el.value === '') ? null : (k === 'on' ? el.value : N(el.value));
      r.own = true;
      save(); render();
    });
  });
  $$('#actualsroot [data-actforget]').forEach(function(el){
    el.addEventListener('click', function(){
      delete book[el.dataset.actforget]; save(); render();
      try{ L().toast('Removed from the acquired ledger'); }catch(e){}
    });
  });
}

/* Called by the pipeline when a property's stage changes, so marking one
   Acquired puts it here without a second action. */
function markOwned(id, on){
  if(on){ rec(id).own = true; } else if(book[id]){ delete book[id].own; }
  save();
}

window.LXActuals = {render:render, compare:compare, bias:bias, markOwned:markOwned,
                    BIAS_FLOOR:BIAS_FLOOR, get book(){ return book; }};
})();
