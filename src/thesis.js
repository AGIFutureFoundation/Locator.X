/* ===== Locator.X — the level-four thesis ===================================
   Prompt 4b/10. Level four asks the learner for one sentence they would
   defend to a partner. Until now that sentence was recorded and echoed back
   and nothing more, which quietly made the most demanding part of the whole
   assessment the only part with no response.

   THE DECISION, AND WHY. Nothing in these editions can judge whether a
   sentence is any good. They are offline single files with no model behind
   them, and the doctrine this Academy exists to teach is that a tool must not
   assert what it cannot check. So the thesis is answered in two honest halves
   and the seam between them is stated out loud:

     · TWO MACHINE CHECKS, which are genuinely decidable, and which are
       reported as findings rather than as marks —
         1. figures that appear in the sentence but nowhere in this record;
         2. ground the sentence stands on that the record returned UNKNOWN for,
            which is the certainty error of the gates, committed in prose.
       Neither says the sentence is wrong. Both say something true about it
       that the learner can act on.

     · A FIVE-POINT RUBRIC the learner applies to themselves, derived line by
       line from the four-part decision memo taught in Investment &
       development i8 — the thesis, the three things that must be true, the
       kill criteria, and the pre-mortem. It is labelled self-assessed
       everywhere it appears and is never mixed into the agreement score.

   A model-graded variant was considered and declined. It could exist only in
   a hosted surface, which would make level four mean two different things
   depending on where it was taken; and grading prose by machine is exactly the
   unearned certainty this level is testing for. It stays open for the cohort
   layer, where a second human reads the sentence and the network and identity
   story is already different.
   ========================================================================= */
(function(){
'use strict';
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s==null?'':s)); };

/* ---- the rubric, taken from i8's four-part memo -------------------------- */
var RUBRIC = [
  {id:'t1', from:'the thesis',
   q:'Does it name what you believe that the seller does not — or what you can do that the last owner could not?',
   miss:'A sentence that only describes the building is a caption, not a thesis. The memo asks for the disagreement or the capability, because that is the only thing you are actually being paid for.'},
  {id:'t2', from:'three things that must be true',
   q:'Is it specific enough that someone else could check it without asking you what you meant?',
   miss:'i8 asks for claims stated so specifically that another person could go and check them. If yours needs you in the room to be understood, it has not been written down yet.'},
  {id:'t3', from:'sourcing',
   q:'Does every figure in it come from somewhere you could name out loud, right now?',
   miss:'A number you cannot source is an assumption wearing a number’s clothes. Name the source or drop the figure.'},
  {id:'t4', from:'the pre-mortem',
   q:'Can you state, without pausing, the one thing that would make this false?',
   miss:'The pre-mortem is written before you commit because it is the only part produced by a version of you that has not yet committed. If nothing could falsify the sentence, it is not a thesis — it is a hope.'},
  {id:'t5', from:'kill criteria',
   q:'Would you put your name on it, in this wording, in front of the partner whose money it is?',
   miss:'If the honest answer is "not in this wording", the wording is the finding. Rewrite it until you would.'}
];

var SELF = [
  {v:'yes',    l:'Yes'},
  {v:'partly', l:'Partly'},
  {v:'no',     l:'Not yet'}
];

/* ---- check one: figures the record does not contain ---------------------- */
/* Bare small integers, years and the record's own descriptive counts are not
   flagged — they are almost always prose ("three things", "a 1962 building"),
   and a check that cries wolf is a check people learn to skip. */
function knownFigures(l, u, uw){
  var X = window.LX, f = [];
  function add(v, kind){ if(v != null && isFinite(v) && v !== 0) f.push({v:Math.abs(v), kind:kind}); }
  var price = null; try{ price = X && X.price ? X.price(l) : null; }catch(e){}
  add(price, '$'); add(u && u.offer, '$'); add(u && u.rentMo, '$'); add(u && u.arv, '$');
  ['noi','cf','cfMo','rent','loan','cash','ds','arv','rehabAll','rehab','opex','egi'].forEach(function(k){ add(uw[k], '$'); });
  ['coc','ltv','debtYield','capCost','beOcc','appr'].forEach(function(k){ add(uw[k], '%'); });
  add(uw.irr != null ? uw.irr*100 : null, '%');
  add(uw.dscr, 'n');
  try{ var mo = window.LXUW && window.LXUW.maxOffer ? window.LXUW.maxOffer(l, u) : null; add(mo, '$'); }catch(e){}
  ['units','beds','baths','sqft','lot','year'].forEach(function(k){ add(l[k], 'n'); });
  return f;
}

function parseNums(text){
  var out = [], m;
  var re = /(\$\s?)?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s?(%|k\b|mm\b|m\b|bps\b)?/gi;
  while((m = re.exec(text))){
    var raw = m[0].trim();
    var n = parseFloat(m[2].replace(/,/g, ''));
    if(!isFinite(n)) continue;
    var unit = (m[3]||'').toLowerCase(), dollar = !!m[1], kind = 'n';
    if(unit === 'k'){ n *= 1e3; kind = '$'; }
    else if(unit === 'm' || unit === 'mm'){ n *= 1e6; kind = '$'; }
    else if(unit === '%'){ kind = '%'; }
    else if(unit === 'bps'){ n = n/100; kind = '%'; }
    else if(dollar){ kind = '$'; }
    /* prose, not claims */
    if(kind === 'n' && n === Math.round(n)){
      if(n <= 12) continue;                              /* "three", "5 units" */
      if(n >= 1850 && n <= 2100) continue;               /* a year */
    }
    out.push({raw:raw, n:n, kind:kind});
  }
  return out;
}

function matches(tok, figs){
  for(var i=0; i<figs.length; i++){
    var f = figs[i];
    if(tok.kind !== 'n' && f.kind !== 'n' && tok.kind !== f.kind) continue;
    var tol = Math.max(Math.abs(f.v) * 0.02, tok.kind === '%' ? 0.15 : 0.005);
    if(Math.abs(tok.n - f.v) <= tol) return true;
  }
  return false;
}

/* ---- check two: ground the record could not answer ----------------------- */
var GROUND = [
  {ix:0, name:'what the record says you may do here',
   w:['zoning','zoned','entitle','permit','by right','by-right','rezone','variance','density','far ','height','setback','buildable','legal use','land use']},
  {ix:1, name:'how the property actually pays',
   w:['amorti','depreciat','tax benefit','four ways','equity build','pays four','pays you back']},
  {ix:2, name:'whether it pays while you hold it',
   w:['cash flow','cashflow','cash-flow','noi','net operating','vacancy','operating income','rent roll']},
  {ix:3, name:'whether the cash flows can be sourced and defended',
   w:['cap rate','comparable','comps','market value','appraise','appraisal','worth ','valued at']},
  {ix:4, name:'whether the building services the debt',
   w:['dscr','debt service','loan-to-value','ltv','debt yield','leverage','refinanc','lender','coverage','interest rate','financ']},
  {ix:5, name:'what is happening to the market',
   w:['appreciate','appreciation','rent growth','trend','forecast','absorption','demand','upside','exit cap','market is','submarket']}
];

function groundsUnanswered(text, gates){
  var low = ' ' + String(text||'').toLowerCase() + ' ', out = [];
  GROUND.forEach(function(gr){
    var g = gates && gates[gr.ix]; if(!g || g.v !== 'unknown') return;
    var hit = null;
    for(var i=0; i<gr.w.length; i++){ if(low.indexOf(gr.w[i]) >= 0){ hit = gr.w[i].trim(); break; } }
    if(hit) out.push({letter:g.k, name:gr.name, gate:g.t, word:hit, note:g.note});
  });
  return out;
}

function check(text, computed){
  text = String(text||'');
  var words = text.trim() ? text.trim().split(/\s+/).length : 0;
  if(!words) return null;
  var figs = knownFigures(computed.l || {}, computed.u || {}, computed.uw || {});
  var stray = parseNums(text).filter(function(t){ return !matches(t, figs); });
  /* one entry per distinct written form */
  var seen = {}, out = [];
  stray.forEach(function(t){ if(!seen[t.raw]){ seen[t.raw] = 1; out.push(t.raw); } });
  return {words:words, sentences:(text.match(/[.!?](\s|$)/g)||[]).length, strays:out,
          grounds:groundsUnanswered(text, computed.g)};
}

/* ---- rendering ----------------------------------------------------------- */
function tally(self){
  var t = {yes:0, partly:0, no:0, answered:0};
  RUBRIC.forEach(function(r){ var v = self && self[r.id]; if(v){ t[v]++; t.answered++; } });
  return t;
}

function tallyLine(self){
  var t = tally(self);
  if(!t.answered) return 'Self-assessed — nothing here is scored by the platform.';
  return 'You scored yourself <b>' + t.yes + ' yes</b>, ' + t.partly + ' partly, ' + t.no
       + ' not yet, on ' + t.answered + ' of ' + RUBRIC.length + '. '
       + (t.answered < RUBRIC.length ? 'Finish the rest.'
          : t.no || t.partly ? 'The ones you marked below yes are the rewrite.'
          : 'Then it is ready to send — and you, not this page, said so.');
}

function panel(text, checks, self){
  if(!text || !checks) return '';
  var h = '<div style="border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-top:12px">'
    + '<div class="eyebrow" style="margin:0 0 6px">The sentence you would defend</div>'
    + '<p style="font-size:13.5px;line-height:1.55;margin:0 0 4px;padding-left:11px;border-left:3px solid var(--cat3)"><i>'
    + esc(text) + '</i></p>'
    + '<p class="chartnote" style="margin:0 0 12px">' + checks.words + ' words'
    + (checks.sentences > 1 ? ' · ' + checks.sentences + ' sentences, and the memo asks for one' : '')
    + '. Two things below can be checked against this record; the rest is yours to judge, and the page says which is which.</p>';

  /* machine check one */
  h += '<p style="font-size:12px;margin:0 0 4px"><b>Checked — figures against the record</b></p>';
  h += checks.strays.length
    ? '<p style="font-size:12.5px;line-height:1.55;margin:0 0 12px;color:var(--muted)">These appear in your sentence and nowhere in this record: <b style="color:var(--ink)">'
      + checks.strays.map(esc).join('</b>, <b style="color:var(--ink)">') + '</b>. '
      + 'That does not make them wrong — it makes them yours. Every one needs a source you can name, or it comes out.</p>'
    : '<p style="font-size:12.5px;line-height:1.55;margin:0 0 12px;color:var(--muted)">Every figure in your sentence traces to something this record computes. Good — that is the cheap half of sourcing, and most people skip it.</p>';

  /* machine check two */
  h += '<p style="font-size:12px;margin:0 0 4px"><b>Checked — ground the record could not answer</b></p>';
  h += checks.grounds.length
    ? checks.grounds.map(function(g){
        return '<p style="font-size:12.5px;line-height:1.55;margin:0 0 8px;padding-left:11px;border-left:3px solid var(--bad)">'
          + 'Your sentence rests on <b>' + esc(g.name) + '</b> (you wrote “' + esc(g.word) + '”), and gate <b>'
          + esc(g.letter) + ' — ' + esc(g.gate) + '</b> returned <b>unknown</b> on this record. '
          + esc(g.note || '') + ' This is the certainty error again, in prose: it will not show up as a wrong number, '
          + 'which is exactly why it survives into the memo.</p>';
      }).join('') + '<div style="margin-bottom:4px"></div>'
    : '<p style="font-size:12.5px;line-height:1.55;margin:0 0 12px;color:var(--muted)">Your sentence does not lean on any gate this record left unanswered. That is the thing level four is actually testing.</p>';

  /* self-applied rubric */
  h += '<p style="font-size:12px;margin:14px 0 2px"><b>Not checked — you assess this yourself</b></p>'
    + '<p class="chartnote" style="margin:0 0 10px">Five questions from the decision memo in <i>Investment &amp; development i8</i>. '
    + 'Nothing here reads your sentence. A tool that scored prose it cannot understand would be committing the error this level exists to catch.</p>';

  h += RUBRIC.map(function(r){
    var v = self && self[r.id];
    return '<div style="border:1px solid var(--line);border-radius:8px;padding:9px 11px;margin-bottom:7px">'
      + '<p style="font-size:12.5px;margin:0 0 2px">' + esc(r.q) + '</p>'
      + '<p class="chartnote" style="margin:0 0 7px">from ' + esc(r.from) + '</p>'
      + '<div class="chips" style="margin:0">'
      + SELF.map(function(s){
          return '<button class="chip' + (v===s.v?' on':'') + '" data-tr="' + r.id + '" data-v="' + s.v
               + '" style="font-size:11.5px">' + s.l + '</button>';
        }).join('')
      + '</div>'
      + (v && v !== 'yes' ? '<p class="trmiss" style="font-size:12px;line-height:1.5;margin:8px 0 0;color:var(--muted)">' + esc(r.miss) + '</p>' : '')
      + '</div>';
  }).join('');

  h += '<p id="trtally" style="font-size:12.5px;margin:10px 0 0">' + tallyLine(self) + '</p>';
  return h + '</div>';
}

window.LXThesis = {RUBRIC:RUBRIC, check:check, panel:panel, tally:tally, tallyLine:tallyLine};
})();
