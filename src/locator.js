/* ===== Locator.X — the LOCATOR screen ======================================
   The seven-gate deal screen taught in the Academy, wired into the underwriting
   sheet so the framework is the product's workflow rather than a page about it.

   L  Location & legal capacity   what the record says you may do here
   O  Ownership economics        how it pays, four ways, and which you control
   C  Cash flow                  does it pay while you hold it
   A  Asset test                 can you name, source and defend the cash flows
   T  Terms & leverage           can the building service the debt
   O  Outlook                    what would have to be true, vs what is happening
   R  Record                     what could not be checked travels with the answer

   Every gate reads values this app already computes — nothing new is estimated
   here. Three verdicts, and the third is the point: a gate the record cannot
   answer returns UNKNOWN, never a quiet pass and never a fail. R is not a gate
   you pass; it is the disclosure that travels with the other six.
   ========================================================================= */
(function(){
'use strict';
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s == null ? '' : s)); };
var fmt$ = function(n){ return (window.LX && LX.fmt$) ? LX.fmt$(n) : ('$' + Math.round(n||0)); };
var n1 = function(v){ return (v==null || !isFinite(v)) ? null : Math.round(v*10)/10; };

var PASS='pass', WARN='warn', FAIL='fail', UNK='unknown';

function evidenceOf(l){
  try{ if(window.LXEvid && LXEvid.grade){ return LXEvid.grade(l); } }catch(e){}
  return null;
}

/* ---- the seven gates ---------------------------------------------------- */
function gates(l, uw){
  var g = [], ev = evidenceOf(l);
  var band = ev && (ev.band || ev.grade || ev.letter);
  var escore = ev && (ev.score != null ? ev.score : ev.total);

  /* L — location & legal capacity */
  (function(){
    var v, note, val;
    if(!ev){ v=UNK; val='—'; note='No evidence grade available for this record.'; }
    else {
      val = String(band||'—') + (escore!=null? ' · ' + Math.round(escore) : '');
      if(band==='A'){ v=PASS; note='The record supports underwriting: use, value and size are published.'; }
      else if(band==='B'){ v=PASS; note='Most of the paperwork is here. Verify what the grade says is missing.'; }
      else if(band==='C'){ v=WARN; note='Shortlist, not offer. A ceiling may be capping this — a permission is not a building.'; }
      else { v=UNK; note='A location and little else. Nothing here can be underwritten from the record alone.'; }
    }
    g.push({k:'L', t:'Location & legal capacity', q:'What does the record say you may do here?', v:v, val:val, note:note});
  })();

  /* O — ownership economics: how many of the four ways pay */
  (function(){
    var ways = [], miss = [];
    (uw.cfMo > 0) ? ways.push('cash flow') : miss.push('cash flow');
    (uw.loan > 0) ? ways.push('amortisation') : miss.push('amortisation');
    (uw.appr != null && uw.apprSrc !== 'default') ? ways.push('appreciation') : miss.push('appreciation');
    (uw.P > 0) ? ways.push('tax') : miss.push('tax');
    var v = ways.length >= 3 ? PASS : (ways.length === 2 ? WARN : UNK);
    if(uw.apprSrc === 'default') v = (ways.length >= 3 ? WARN : UNK);
    g.push({k:'O', t:'Ownership economics', q:'How does it pay, and which of the four do you control?',
      v:v, val: ways.length + ' of 4',
      note: 'Paying: ' + (ways.join(', ')||'none') + (miss.length? '. Not: ' + miss.join(', ') : '')
            + (uw.apprSrc==='default' ? '. Appreciation is a fallback default, not a fitted figure.' : '')});
  })();

  /* C — cash flow */
  (function(){
    var v, note;
    if(uw.cfMo == null || !isFinite(uw.cfMo)){ v=UNK; note='Cash flow cannot be computed from what is published.'; }
    else if(uw.cfMo > 0){ v=PASS; note='It pays while you hold it' + (uw.oer!=null? ', at a ' + n1(uw.oer) + '% expense ratio.' : '.'); }
    else { v=FAIL; note='It does not pay at this price. Cash flow before capital gains — this fails the first test.'; }
    g.push({k:'C', t:'Cash flow', q:'Does it pay while you hold it?',
      v:v, val: uw.cfMo==null? '—' : fmt$(Math.round(uw.cfMo)) + '/mo', note:note});
  })();

  /* A — asset test */
  (function(){
    var pays = uw.cfMo > 0;
    var sourced = ev && (band === 'A' || band === 'B');
    var v, note, val;
    if(pays && sourced){ v=PASS; val='Asset'; note='The cash flows can be named, sourced and defended before you own it.'; }
    else if(pays && !sourced){ v=UNK; val='Unproven'; note='It pays on these inputs, but the record cannot source them. That is a position wearing an asset’s numbers.'; }
    else if(!pays && sourced){ v=FAIL; val='Liability'; note='Well documented, and it takes money out of your pocket at this price.'; }
    else { v=UNK; val='Unknown'; note='Neither the payment nor the paperwork supports a verdict yet.'; }
    g.push({k:'A', t:'Asset test', q:'Can you name, source and defend the cash flows?', v:v, val:val, note:note});
  })();

  /* T — terms & leverage: the lender's triangle */
  (function(){
    var v, note;
    var d = uw.dscr, ltv = uw.ltv, dy = uw.debtYield;
    if(d == null || !isFinite(d)){ v=UNK; note='No debt service to test against.'; }
    else if(d >= 1.20){ v=PASS; note='The building services the debt with margin.'; }
    else if(d >= 1.00){ v=WARN; note='It covers, but with no room. A lender sizes to this and will shrink the loan.'; }
    else { v=FAIL; note='The building does not service the debt. Leverage is subtracting here.'; }
    var bits = [];
    if(d!=null) bits.push('DSCR ' + (Math.round(d*100)/100));
    if(ltv!=null) bits.push('LTV ' + n1(ltv) + '%');
    if(dy!=null) bits.push('debt yield ' + n1(dy) + '%');
    g.push({k:'T', t:'Terms & leverage', q:'Can the building service the debt?',
      v:v, val: d==null? '—' : (Math.round(d*100)/100), note: note + (bits.length? ' (' + bits.join(' · ') + ')' : '')});
  })();

  /* O — outlook */
  (function(){
    var v, note, src = uw.apprSrc;
    var label = {fitted:'fitted 12-month trend', yours:'your own figure', scenario:'this scenario',
                 yoy:'last twelve months, unfitted', 'default':'a fallback default'}[src] || src;
    if(src === 'fitted' || src === 'yours' || src === 'scenario'){
      v = PASS; note = 'Appreciation comes from ' + label + ', not from hope.';
    } else if(src === 'yoy'){
      v = WARN; note = 'Appreciation is ' + label + ' — two endpoints carrying a five-year assumption.';
    } else {
      v = UNK; note = 'No market fit for this ZIP. The figure shown is ' + label + ' and should not drive a decision.';
    }
    if(uw.cfMo <= 0 && v === PASS){ v = WARN; note += ' Note this deal needs the exit to work, because today it does not pay.'; }
    g.push({k:'O', t:'Outlook', q:'What would have to be true, against what the market is doing?',
      v:v, val: uw.appr==null? '—' : (n1(uw.appr) + '%/yr'), note:note});
  })();

  /* R — the record. Not a gate you pass: the disclosure that travels. */
  (function(){
    var unk = g.filter(function(x){ return x.v === UNK; }).length;
    var note;
    if(unk === 0) note = 'Every gate above resolved from the record. Nothing is being carried on assumption.';
    else note = unk + (unk===1? ' gate above could not be answered from the record. It is not a pass and it is not a fail — it is unpriced, and it travels with this decision.'
                              : ' gates above could not be answered from the record. They are not passes and not fails — they are unpriced, and they travel with this decision.');
    g.push({k:'R', t:'Record', q:'What could not be checked?', v:'report',
      val: unk + ' unknown', note:note, meta:true});
  })();

  return g;
}

function verdict(g){
  var six = g.filter(function(x){ return !x.meta; });
  var fails = six.filter(function(x){ return x.v === FAIL; }).length;
  var unks  = six.filter(function(x){ return x.v === UNK; }).length;
  var warns = six.filter(function(x){ return x.v === WARN; }).length;
  if(fails) return {t:'Fails the screen', c:'bad',  d: fails + (fails===1?' gate fails':' gates fail') + '. Fix the price or walk.'};
  if(unks)  return {t:'Not yet screenable', c:'warn', d: unks + (unks===1?' gate is':' gates are') + ' unanswerable from the record. Diligence, not a decision.'};
  if(warns) return {t:'Passes with margin to check', c:'warn', d: warns + (warns===1?' gate is':' gates are') + ' thin. Know which before you offer.'};
  return {t:'Clears all seven', c:'good', d:'Every gate resolved from the record and passed.'};
}

var COL = {pass:'var(--good)', warn:'var(--cat3)', fail:'var(--bad)', unknown:'var(--muted)', report:'var(--accent)'};
var MARK = {pass:'✓', warn:'!', fail:'✕', unknown:'?', report:'·'};

function panel(l, uw){
  if(!l || !uw) return '';
  var g, vd;
  try{ g = gates(l, uw); vd = verdict(g); }catch(e){ return ''; }
  return '<div class="tile" style="margin-top:12px">'
    + '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:2px">'
    +   '<p class="eyebrow" style="margin:0">The LOCATOR screen</p>'
    +   '<span class="badge ' + vd.c + '" style="font-size:11px">' + esc(vd.t) + '</span>'
    + '</div>'
    + '<p style="font-size:12px;color:var(--muted);margin:0 0 10px">' + esc(vd.d) + '</p>'
    + '<div style="display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden">'
    + g.map(function(x){
        var c = COL[x.v] || 'var(--muted)';
        return '<div style="background:var(--panel);padding:9px 11px;display:grid;'
          + 'grid-template-columns:22px 1fr auto;gap:10px;align-items:baseline'
          + (x.meta? ';border-top:1px solid var(--line2)':'') + '">'
          + '<span style="font-family:var(--mono);font-size:14px;font-weight:700;color:' + c + '">' + esc(x.k) + '</span>'
          + '<span><b style="font-size:12.5px">' + esc(x.t) + '</b>'
          +   '<span style="display:block;font-size:11.5px;color:var(--muted);line-height:1.5;margin-top:1px">' + esc(x.note) + '</span></span>'
          + '<span style="text-align:right;white-space:nowrap">'
          +   '<span class="num" style="font-size:12.5px;color:' + c + '">' + esc(x.val) + '</span>'
          +   '<span style="display:block;font-size:10px;color:' + c + '">' + (MARK[x.v]||'') + '</span></span>'
          + '</div>';
      }).join('')
    + '</div>'
    + '<p style="font-size:11px;color:var(--muted);margin:9px 0 0">Seven gates, taught in the Academy and computed here from the same '
    + 'record the rest of this sheet uses. A gate the record cannot answer returns <b>unknown</b> &mdash; never a quiet pass.</p>'
    + '</div>';
}

window.LXLocator = {panel: panel, gates: gates, verdict: verdict};
})();
