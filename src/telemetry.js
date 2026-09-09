/* ===== Locator.X — your record ============================================
   Prompt 10/10, first half. The instruction was "instrument it, and publish
   what it shows, including the parts that are unflattering." The unflattering
   part turned out to be the instrumentation itself, so that is what this page
   leads with.

   WHAT THIS IS NOT. These editions are self-contained single files with no
   network and no cross-viewer store, so everything below comes from ONE
   browser's localStorage: n = 1. That is not a distribution, and drawing it as
   one would be precisely the error this curriculum's own V-pillar teaches
   against — a rate computed from four answers is a decoration, not a finding.
   So this page:

     · states the denominator BEFORE any rate, the way the platform's score
       states coverage before the number;
     · refuses to print an accuracy figure below a stated sample floor, and
       says "too few answers" instead — including when that makes the page
       look empty, which early on it will;
     · lists what the stored data cannot answer, including one place where the
       app's own recording is lossy and this page therefore cannot report;
     · exports the record as markdown and JSON, because aggregation across
       many learners is a real question and one browser cannot answer it.

   The honest summary of this whole feature is that a course which teaches
   "whatever could not be checked travels with the answer" should be the last
   product to publish a confident chart over four data points.
   ========================================================================= */
(function(){
'use strict';
var $ = function(s, r){ return (r||document).querySelector(s); };
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s==null?'':s)); };

/* Below this many answered drills in a bucket, no rate is printed. Chosen to
   match the spirit of the app's 15% coverage floor rather than a convention:
   under five answers a single miss swings the figure by twenty points. */
var FLOOR = 5;

function readStore(key){
  try{ return JSON.parse(localStorage.getItem(key) || '{}') || {}; }catch(e){ return {}; }
}

function gather(){
  var prog = readStore('lxtradecraft'), gates = readStore('lxgates'),
      route = readStore('lxroute'), ts = readStore('tschool');
  var T = (window.LXTC && window.LXTC.TRACKS) || [];

  var tracks = T.map(function(t){
    var n = t.modules.length, ans = 0, ok = 0;
    t.modules.forEach(function(m){
      var v = prog[t.id] && prog[t.id][m.id];
      if(v === 1){ ans++; ok++; } else if(v === 0){ ans++; }
    });
    return {id:t.id, name:t.name, slot:t.slot, total:n, answered:ans, correct:ok};
  }).sort(function(a,b){ return a.slot - b.slot; });

  var lessons = tracks.reduce(function(a,t){ return a + t.total; }, 0);
  var answered = tracks.reduce(function(a,t){ return a + t.answered; }, 0);
  var correct  = tracks.reduce(function(a,t){ return a + t.correct;  }, 0);

  var levels = ['L1','L2','L3','L4'].map(function(k){ return gates[k] || null; });
  var taken = levels.filter(Boolean);
  var certainty = taken.reduce(function(a,r){ return a + (r.certainty||0); }, 0);
  var certGates = {};
  taken.forEach(function(r){ (r.dis||[]).forEach(function(d){
    if(d.c === 'certainty') certGates[d.k] = (certGates[d.k]||0) + 1; }); });

  var G = (window.LXRoute && window.LXRoute.GATES) || [];
  var stagesDone = G.filter(function(g){ return route[g.k]; }).length;

  var tsDone = 0; var tsProg = ts.done || {};
  Object.keys(tsProg).forEach(function(k){ tsDone += Object.keys(tsProg[k]||{}).length; });

  var l4 = gates.L4 || null;
  var rubric = (l4 && l4.rubric) || {};
  var rubricAnswered = Object.keys(rubric).length;

  return {tracks:tracks, lessons:lessons, answered:answered, correct:correct,
          levels:levels, taken:taken.length, certainty:certainty, certGates:certGates,
          stages:stagesDone, stagesTotal:G.length, tsDone:tsDone,
          l4:l4, rubricAnswered:rubricAnswered,
          untouched:tracks.filter(function(t){ return t.answered === 0; })};
}

/* A rate, or an honest refusal to give one. */
function rate(ok, n){
  if(n < FLOOR) return {ok:false, text:(n===0? 'not started' : n + ' answer' + (n===1?'':'s') + ' — below the floor')};
  return {ok:true, text:Math.round(ok/n*100) + '%', pct:Math.round(ok/n*100)};
}

function bar(t){
  var P = window.LXPal;
  var w = t.total ? Math.round(t.answered / t.total * 100) : 0;
  var col = t.answered ? (P ? P.seq(0.35 + 0.5 * (t.answered/t.total)) : 'var(--good)') : 'var(--line2)';
  return '<div style="display:flex;align-items:center;gap:9px;margin:0 0 5px">'
    + '<span style="flex:0 0 clamp(110px,20vw,190px);font-size:12px;color:var(--ink2);overflow:hidden;'
    +   'text-overflow:ellipsis;white-space:nowrap">' + esc(t.name) + '</span>'
    + '<span style="flex:1;height:9px;background:var(--panel2);border-radius:5px;overflow:hidden;min-width:60px">'
    +   '<i style="display:block;height:100%;width:' + w + '%;background:' + col + ';border-radius:5px"></i></span>'
    + '<span class="num" style="flex:0 0 62px;text-align:right;font-size:11.5px;color:var(--muted)">'
    +   t.answered + ' / ' + t.total + '</span>'
    + '</div>';
}

function render(){
  var host = $('#telroot'); if(!host) return;
  var d = gather();
  var overall = rate(d.correct, d.answered);
  var cov = d.lessons ? Math.round(d.answered / d.lessons * 100) : 0;

  var h = '<div class="chart">'
    + '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:4px">'
    +   '<div class="eyebrow" style="margin:0">Your record</div>'
    +   '<span class="badge">n = 1 &middot; this browser only</span>'
    + '</div>'
    + '<p class="chartnote" style="margin:0 0 14px;max-width:88ch">Coverage first, then anything derived from '
    + 'it &mdash; the same order the property score uses, for the same reason. Every figure here comes from one '
    + 'browser\'s stored progress, so nothing on this page is a distribution and none of it is drawn as one.</p>';

  /* --- coverage, the denominator --- */
  h += '<div class="cards" style="margin:0 0 14px">'
    + [['Drills answered', d.answered + ' / ' + d.lessons, cov + '% of the library'],
       ['Level gates taken', d.taken + ' / 4', d.taken? 'most recent kept' : 'none yet'],
       ['Route stages marked', d.stages + ' / ' + d.stagesTotal, 'self-reported'],
       ['Trade School modules', String(d.tsDone), 'verified answers only']
      ].map(function(c){
        return '<div class="tile"><p class="eyebrow" style="margin:0 0 4px">' + esc(c[0]) + '</p>'
          + '<p class="num" style="font-size:20px;margin:0">' + esc(c[1]) + '</p>'
          + '<p style="font-size:11px;color:var(--muted);margin:3px 0 0">' + esc(c[2]) + '</p></div>';
      }).join('') + '</div>';

  /* --- per-track coverage --- */
  h += '<p style="font-size:12.5px;margin:0 0 7px"><b>Where the answers actually are</b></p>'
    + d.tracks.map(bar).join('')
    + (d.untouched.length
        ? '<p style="font-size:12px;color:var(--muted);margin:8px 0 0;line-height:1.55"><b>'
          + d.untouched.length + ' of ' + d.tracks.length + ' tracks untouched.</b> '
          + 'Reading without answering the drill leaves no trace, so an untouched bar means no drill was answered '
          + 'there &mdash; not necessarily that nothing was read. The record cannot tell those apart.</p>'
        : '');

  /* --- accuracy, with the floor enforced --- */
  h += '<p style="font-size:12.5px;margin:16px 0 6px"><b>Accuracy, where there is enough of it to report</b></p>';
  if(!overall.ok){
    h += '<p style="font-size:12.5px;color:var(--muted);margin:0 0 8px;line-height:1.55">'
      + 'Across the whole library: <b>' + esc(overall.text) + '</b>. No percentage is printed below '
      + FLOOR + ' answers, because under five a single miss moves the figure twenty points and the number '
      + 'would say more about the sample than about you.</p>';
  } else {
    h += '<p style="font-size:12.5px;margin:0 0 8px;line-height:1.55">Across the whole library: <b>'
      + overall.text + '</b> of ' + d.answered + ' answered. Per track, only where the floor of ' + FLOOR
      + ' is met:</p>';
    var rows = d.tracks.map(function(t){ return {t:t, r:rate(t.correct, t.answered)}; })
                       .filter(function(x){ return x.r.ok; });
    h += rows.length
      ? '<div class="chips" style="margin:0 0 4px">' + rows.map(function(x){
          return '<span class="chip" style="font-size:11px">' + esc(x.t.name) + ' &middot; ' + x.r.text + '</span>';
        }).join('') + '</div>'
      : '<p style="font-size:12px;color:var(--muted);margin:0">No single track has ' + FLOOR
        + ' answers yet, so no per-track rate is shown.</p>';
  }

  /* --- the diagnostic number --- */
  h += '<p style="font-size:12.5px;margin:16px 0 6px"><b>Certainty errors &mdash; the number this course exists to move</b></p>';
  if(!d.taken){
    h += '<p style="font-size:12.5px;color:var(--muted);margin:0;line-height:1.55">No level gate taken yet, so there '
      + 'is nothing to report. This is the figure worth watching: a verdict returned on a gate the record cannot answer.</p>';
  } else {
    var gk = Object.keys(d.certGates);
    h += '<p style="font-size:12.5px;margin:0 0 6px;line-height:1.55"><b>' + d.certainty + '</b> across '
      + d.taken + ' gate ' + (d.taken===1?'attempt':'attempts') + '. '
      + (d.taken === 1
         ? 'One attempt is a reading, not a rate &mdash; it becomes a trend at three or four, and this page will not call it one before then.'
         : 'Still one learner: a change between attempts is a change in this record, not evidence about the course.')
      + '</p>'
      + (gk.length
          ? '<div class="chips" style="margin:0">' + gk.map(function(k){
              return '<span class="chip" style="font-size:11px">Gate ' + esc(k==='O2'?'O':k) + ' &middot; '
                   + d.certGates[k] + '&times;</span>'; }).join('') + '</div>'
          : '<p style="font-size:12px;color:var(--good);margin:0">None &mdash; no verdict was returned on an unanswerable gate.</p>');
  }

  /* --- the thesis --- */
  if(d.l4 && d.l4.thesis){
    h += '<p style="font-size:12.5px;margin:16px 0 6px"><b>The sentence you would defend</b></p>'
      + '<p style="font-size:12.5px;margin:0;line-height:1.55">'
      + (d.l4.strays ? '<b>' + d.l4.strays + '</b> figure' + (d.l4.strays===1?'':'s') + ' not in the record'
                     : 'Every figure traced to the record')
      + ' &middot; '
      + (d.l4.grounds ? '<b>' + d.l4.grounds + '</b> gate' + (d.l4.grounds===1?'':'s') + ' it leans on that the record could not answer'
                      : 'no reliance on unanswerable ground')
      + ' &middot; ' + d.rubricAnswered + ' of 5 rubric questions self-assessed.</p>';
  }

  /* --- what this cannot say --- */
  h += '<p style="font-size:12.5px;margin:16px 0 6px"><b>What this record cannot tell you</b></p>'
    + '<ul style="font-size:12.5px;color:var(--ink2);line-height:1.6;margin:0;padding-left:18px">'
    + '<li><b>Nothing about anyone else.</b> There is no cross-viewer store in these editions, by design &mdash; '
    +   'they are single files that run with the network off. Which drills fail most <i>across learners</i> is a real '
    +   'question and this page cannot answer it; the export below exists so that someone holding many records can.</li>'
    + '<li><b>Trade School accuracy is unknowable from what is stored.</b> That module records only correct answers, '
    +   'so a wrong one leaves no trace and no rate can honestly be computed. This is a limitation in the app\'s own '
    +   'recording, stated here rather than papered over with the completion count.</li>'
    + '<li><b>Reading is invisible.</b> Only an answered drill is recorded, so time spent and lessons read without '
    +   'answering do not appear at all.</li>'
    + '<li><b>It is one browser.</b> Clearing site data erases it, and a different device starts from nothing. '
    +   'Nothing here is a credential and none of it is transmitted anywhere.</li>'
    + '</ul>';

  h += '<div class="toolbar" style="margin-top:12px">'
    + '<button class="btn primary" id="telmd" style="font-size:12px">Copy this record as Markdown</button>'
    + '<button class="btn" id="teljson" style="font-size:12px">Copy as JSON</button></div>'
    + '<p class="src" style="margin-top:8px">Exported so records can be pooled by someone who has many. '
    + 'A pooled figure is still only as good as its coverage &mdash; carry the denominator with it.</p>'
    + '</div>';

  host.innerHTML = h;

  var md = $('#telmd'), js = $('#teljson');
  if(md) md.addEventListener('click', function(){ copy(markdown(d), 'Record copied as Markdown'); });
  if(js) js.addEventListener('click', function(){ copy(JSON.stringify(json(d), null, 2), 'Record copied as JSON'); });
}

function copy(text, msg){
  try{
    navigator.clipboard.writeText(text).then(
      function(){ if(window.LX && window.LX.toast) window.LX.toast(msg); },
      function(){ if(window.LX && window.LX.toast) window.LX.toast('Clipboard blocked in this host'); });
  }catch(e){ if(window.LX && window.LX.toast) window.LX.toast('Clipboard blocked in this host'); }
}

function json(d){
  return {
    schema:'locator.x/record/1', n:1, source:'single browser localStorage',
    generated:new Date().toISOString(),
    coverage:{lessons:d.lessons, answered:d.answered, correct:d.correct,
              levelsTaken:d.taken, routeStages:d.stages, routeStagesTotal:d.stagesTotal,
              tradeSchoolVerified:d.tsDone},
    floor:FLOOR,
    accuracyReportable:d.answered >= FLOOR,
    certaintyErrors:d.certainty, certaintyByGate:d.certGates,
    thesis:d.l4 ? {strays:d.l4.strays||0, grounds:d.l4.grounds||0, rubricAnswered:d.rubricAnswered} : null,
    tracks:d.tracks.map(function(t){
      return {id:t.id, name:t.name, total:t.total, answered:t.answered, correct:t.correct,
              rateReportable:t.answered >= FLOOR};
    }),
    cannotReport:['cross-learner anything','trade-school accuracy (only correct answers are stored)',
                  'reading without answering','anything from another device']
  };
}

function markdown(d){
  var o = rate(d.correct, d.answered);
  var L = ['# Locator.X — one learner record', '',
    '**n = 1, one browser.** Not a distribution. Coverage is stated before every derived figure,',
    'and no rate is printed below a floor of ' + FLOOR + ' answers.', '',
    '| Measure | Value |', '|---|---|',
    '| Drills answered | ' + d.answered + ' / ' + d.lessons + ' |',
    '| Level gates taken | ' + d.taken + ' / 4 |',
    '| Route stages marked | ' + d.stages + ' / ' + d.stagesTotal + ' |',
    '| Trade School verified | ' + d.tsDone + ' |',
    '| Overall accuracy | ' + o.text + ' |',
    '| Certainty errors | ' + d.certainty + ' across ' + d.taken + ' attempt(s) |', ''];
  L.push('## Per track', '', '| Track | Answered | Correct | Rate |', '|---|---|---|---|');
  d.tracks.forEach(function(t){
    var r = rate(t.correct, t.answered);
    L.push('| ' + t.name + ' | ' + t.answered + ' / ' + t.total + ' | ' + t.correct + ' | ' + r.text + ' |');
  });
  L.push('', '## What this cannot report', '',
    '- Anything about any other learner — these editions have no cross-viewer store.',
    '- Trade School accuracy — only correct answers are recorded there.',
    '- Reading without answering a drill.',
    '- Anything from another device or browser.', '');
  return L.join('\n');
}

function mount(){ render(); }
document.addEventListener('DOMContentLoaded', function(){ setTimeout(mount, 1000); });
setTimeout(mount, 1500);
window.LXTel = {render:render, mount:mount, gather:gather, json:json, markdown:markdown, FLOOR:FLOOR, rate:rate};
})();
