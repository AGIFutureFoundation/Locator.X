/* ===== Locator.X — the instructor annotation layer =========================
   Prompt 7/10. The courses carry a byline — "Custom training by Chris
   Barideaux" — and until now the platform had no way for that person to say
   anything. A byline with no voice behind it is the weakest form of a claim.

   THE RULE THIS FILE IS BUILT AROUND: nothing here writes his words. NOTES
   ships empty and stays empty until the platform owner supplies real copy.
   No biography, credential, tenure claim, quote or endorsement is asserted
   anywhere in this platform that was not supplied by the platform owner, and
   an empty annotation layer renders as nothing at all rather than as a
   placeholder pretending to be a note.

   So this file is two things:

     1. THE MECHANISM. A note attaches to a lesson, a LOCATOR gate or a
        development-route stage by stable id, and renders in a visibly
        different register from doctrine text — a practitioner speaking, not
        the platform. Every anchor id is checked at build time, so a note can
        never point at a lesson that no longer exists.

     2. THE QUEUE, which is the actually useful half. An instructor's time is
        the scarce input, so this does not hand him ninety-two lessons and ask
        where he would like to start. It reads what the learner has already
        recorded — gate disagreements, certainty errors, theses carrying
        unsourced figures or unanswerable ground, route stages walked past
        without reading, failed drills — and ranks the places where a note
        from someone who has actually done this is worth the most. Then it
        exports that queue as markdown he can write against offline.

   The ranking is deliberately weighted toward CERTAINTY ERRORS, because that
   is the one habit this whole Academy exists to break, and it is the one place
   where "here is what I have seen go wrong" beats any amount of doctrine.
   ========================================================================= */
(function(){
'use strict';
var $ = function(s, r){ return (r||document).querySelector(s); };
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s==null?'':s)); };

/* ---- the notes themselves ------------------------------------------------
   Schema, one object per note:

     { on: 'lesson' | 'gate' | 'stage',
       id: 'lab.x3'  | 'T'    | 'feas',      // see anchors below
       body: 'One or two sentences, in the instructor\'s own words.',
       by:  'Chris Barideaux' }

   anchors — on:'lesson'  id is "track.lesson", e.g. 'invdev.i6', 'zone.z2'
             on:'gate'    id is a LOCATOR letter: L O C A T O2 R
             on:'stage'   id is a route stage: site feas ent fin build stab

   Empty by design. Supplied copy goes here and nowhere else.            */
var NOTES = [];

var BY_DEFAULT = 'Chris Barideaux';

function get(kind, id){
  var out = [];
  for(var i=0; i<NOTES.length; i++){
    var n = NOTES[i];
    if(n && n.on === kind && n.id === id && n.body) out.push(n);
  }
  return out;
}

/* Rendered in a different register from doctrine: warm rule, named voice.
   Returns '' when there is nothing to say, which is the normal case. */
function block(kind, id){
  var ns = get(kind, id);
  if(!ns.length) return '';
  return ns.map(function(n){
    return '<div style="border-left:3px solid var(--flag);background:var(--panel2);'
      + 'border-radius:0 8px 8px 0;padding:10px 12px;margin-top:10px">'
      + '<p class="eyebrow" style="margin:0 0 5px;color:var(--flag)">Instructor note</p>'
      + '<p style="font-size:13px;line-height:1.6;margin:0">' + esc(n.body) + '</p>'
      + '<p style="font-size:11.5px;color:var(--muted);margin:6px 0 0">&mdash; ' + esc(n.by || BY_DEFAULT) + '</p>'
      + '</div>';
  }).join('');
}

/* ---- reading what the learner has already recorded ---------------------- */
function readStore(key){
  try{ return JSON.parse(localStorage.getItem(key) || '{}') || {}; }catch(e){ return {}; }
}

function lessonName(track, lesson){
  var T = (window.LXTC && window.LXTC.TRACKS) || [];
  for(var i=0; i<T.length; i++){
    if(T[i].id !== track) continue;
    for(var j=0; j<T[i].modules.length; j++){
      if(T[i].modules[j].id === lesson) return {track:T[i].name, name:T[i].modules[j].t};
    }
  }
  return null;
}

var WEIGHT = {certainty:10, ground:8, opposite:6, walked:5, stray:4, drill:3};

function queue(){
  var rows = [], gates = readStore('lxgates'), route = readStore('lxroute'), prog = readStore('lxtradecraft');

  /* 1 & 2 — what happened at the level gates */
  Object.keys(gates).forEach(function(lk){
    var r = gates[lk]; if(!r || typeof r !== 'object') return;
    (r.dis || []).forEach(function(d){
      if(d.c === 'certainty'){
        rows.push({w:WEIGHT.certainty, kind:'gate', id:d.k, tag:'Certainty error',
          what:'Gate ' + (d.k === 'O2' ? 'O' : d.k) + ' — they returned "' + d.mine
             + '" where the record could not answer at all (' + lk + ').',
          why:'The one habit this Academy exists to break. A practitioner note here — a deal where an unanswerable gate was called and what it cost — outweighs any restatement of the doctrine.'});
      } else if(d.c === 'miss'){
        rows.push({w:WEIGHT.opposite, kind:'gate', id:d.k, tag:'Opposite call',
          what:'Gate ' + (d.k === 'O2' ? 'O' : d.k) + ' — they said "' + d.mine
             + '", the screen computed "' + d.theirs + '" (' + lk + ').',
          why:'They and the platform read the same record in opposite directions. Either the screen is missing something you would see, or they are — and only you can say which.'});
      }
    });
    /* 3 & 4 — the sentence they would defend */
    if(r.grounds) rows.push({w:WEIGHT.ground, kind:'gate', id:'R', tag:'Thesis on unanswerable ground',
      what:'Their level-four sentence leans on ' + r.grounds + ' gate' + (r.grounds===1?'':'s') + ' the record returned unknown for.',
      why:'The certainty error committed in prose, where it will never show up as a wrong number. This is the most valuable single place in the whole course for a war story.'});
    if(r.strays) rows.push({w:WEIGHT.stray, kind:'lesson', id:'invdev.i8', tag:'Unsourced figures',
      what:'Their level-four sentence carries ' + r.strays + ' figure' + (r.strays===1?'':'s') + ' that appear nowhere in the record.',
      why:'They are inventing numbers under pressure. How you actually source a figure in the field is worth more here than the rule that you must.'});
  });

  /* 5 — route stages walked past without reading */
  var G = (window.LXRoute && window.LXRoute.GATES) || [];
  G.forEach(function(g){
    if(!route[g.k]) return;
    var readCount = 0;
    g.lessons.forEach(function(l){ if(prog[l.t] && prog[l.t][l.id] === 1) readCount++; });
    if(readCount === 0 && g.lessons.length){
      rows.push({w:WEIGHT.walked, kind:'stage', id:g.k, tag:'Stage walked past',
        what:'They marked "' + g.name + '" reached with none of its ' + g.lessons.length + ' lessons completed.',
        why:'Moving fast through the gate you say you have cleared. One sentence on what you check before you would call this gate closed will land harder than the reading list.'});
    }
  });

  /* 6 — drills answered wrong */
  Object.keys(prog).forEach(function(tid){
    var t = prog[tid]; if(!t || typeof t !== 'object') return;
    Object.keys(t).forEach(function(mid){
      if(t[mid] !== 0) return;
      var nm = lessonName(tid, mid); if(!nm) return;
      rows.push({w:WEIGHT.drill, kind:'lesson', id:tid + '.' + mid, tag:'Drill missed',
        what:nm.track + ' — “' + nm.name + '”',
        why:'The written rationale told them why they were wrong. What it cannot tell them is how often this one actually bites.'});
    });
  });

  /* fold duplicates onto one anchor, keeping the strongest reason first */
  var byAnchor = {};
  rows.forEach(function(r){
    var k = r.kind + ':' + r.id;
    if(!byAnchor[k]) byAnchor[k] = {kind:r.kind, id:r.id, w:0, n:0, items:[]};
    byAnchor[k].w += r.w; byAnchor[k].n++; byAnchor[k].items.push(r);
  });
  var out = Object.keys(byAnchor).map(function(k){ return byAnchor[k]; });
  out.forEach(function(a){ a.items.sort(function(x,y){ return y.w - x.w; }); });
  out.sort(function(a,b){ return b.w - a.w; });
  return out;
}

function anchorLabel(a){
  if(a.kind === 'lesson'){
    var p = a.id.split('.'), nm = lessonName(p[0], p[1]);
    return nm ? (nm.track + ' · ' + nm.name) : a.id;
  }
  if(a.kind === 'gate'){
    var Q = {L:'Location & legal capacity', O:'Ownership economics', C:'Cash flow', A:'Asset test',
             T:'Terms & leverage', O2:'Outlook', R:'Record'};
    return 'LOCATOR gate ' + (a.id === 'O2' ? 'O' : a.id) + ' — ' + (Q[a.id] || a.id);
  }
  var G = (window.LXRoute && window.LXRoute.GATES) || [];
  for(var i=0; i<G.length; i++){ if(G[i].k === a.id) return 'Developer route, gate ' + G[i].n + ' — ' + G[i].name; }
  return a.id;
}

function markdown(){
  var q = queue();
  var lines = ['# Locator.X — instructor note queue', '',
    'Generated from one learner\'s recorded work in this browser. Ranked by where a',
    'practitioner note is worth the most, not by course order.', '',
    'Paste finished notes into the NOTES array in src/notes.js, using:', '',
    '    { on: \'lesson\'|\'gate\'|\'stage\', id: \'<anchor>\', body: \'…\', by: \'Chris Barideaux\' }', ''];
  if(!q.length){
    lines.push('_Nothing in the queue yet — it fills as a learner takes the level gates,',
               'writes a level-four thesis, walks the developer route and answers drills._');
  }
  q.forEach(function(a, i){
    lines.push('## ' + (i+1) + '. ' + anchorLabel(a));
    lines.push('`on: ' + a.kind + ' · id: ' + a.id + '` — weight ' + a.w + ' from ' + a.n + ' signal' + (a.n===1?'':'s'));
    lines.push('');
    a.items.forEach(function(it){
      lines.push('- **' + it.tag + '.** ' + it.what);
      lines.push('  - _Why here:_ ' + it.why);
    });
    lines.push('');
  });
  return lines.join('\n');
}

/* ---- the panel ----------------------------------------------------------- */
function render(){
  var host = $('#notesroot'); if(!host) return;
  var q = queue(), supplied = NOTES.filter(function(n){ return n && n.body; }).length;

  host.innerHTML = '<div class="chart">'
    + '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:4px">'
    +   '<div class="eyebrow" style="margin:0">Instructor note queue</div>'
    +   '<span class="badge">' + q.length + ' place' + (q.length===1?'':'s') + ' ranked</span>'
    +   '<span class="badge ' + (supplied? 'good':'') + '">' + supplied + ' note' + (supplied===1?'':'s') + ' supplied</span>'
    + '</div>'
    + '<p class="chartnote" style="margin:0 0 12px;max-width:88ch">'
    + 'Where a note from someone who has actually done this would be worth the most, built from what has been '
    + 'recorded in this browser rather than from course order. Weighted toward certainty errors &mdash; a verdict '
    + 'returned on a gate the record cannot answer &mdash; because that is the habit the whole Academy exists to break. '
    + 'Nothing on this page writes in the instructor&rsquo;s voice; the notes array ships empty and stays empty until '
    + 'real copy is supplied.</p>';

  if(!q.length){
    host.querySelector('.chart').innerHTML += '<p style="font-size:13px;color:var(--muted);line-height:1.6;margin:0">'
      + 'Nothing queued yet. It fills as you take a level gate, write the level-four sentence, walk the developer '
      + 'route, or miss a drill &mdash; the queue is a record of where the course actually met resistance, so it is '
      + 'empty until it has.</p></div>';
  } else {
    var body = q.slice(0, 12).map(function(a, i){
      return '<div style="border:1px solid var(--line);border-left:3px solid var(--'
        + (a.items[0].w >= WEIGHT.ground ? 'bad' : 'cat3') + ');border-radius:8px;padding:10px 12px;margin-bottom:7px">'
        + '<div style="display:flex;gap:9px;align-items:baseline;flex-wrap:wrap">'
        +   '<span class="num" style="font-weight:700">' + (i+1) + '</span>'
        +   '<b style="font-size:13px">' + esc(anchorLabel(a)) + '</b>'
        +   '<span style="margin-left:auto;font-size:11px;color:var(--muted)" class="num">weight ' + a.w + '</span>'
        + '</div>'
        + a.items.map(function(it){
            return '<p style="font-size:12.5px;margin:7px 0 0;line-height:1.55"><b>' + esc(it.tag) + '.</b> ' + esc(it.what) + '</p>'
                 + '<p style="font-size:12px;margin:3px 0 0;line-height:1.5;color:var(--muted)">' + esc(it.why) + '</p>';
          }).join('')
        + '<p class="src" style="margin:8px 0 0">Anchor <code>' + esc(a.kind) + ':' + esc(a.id) + '</code></p>'
        + '</div>';
    }).join('');
    host.querySelector('.chart').innerHTML +=
      body
      + (q.length > 12 ? '<p class="src" style="margin:0 0 8px">' + (q.length-12) + ' more below the fold — the export carries all of them.</p>' : '')
      + '<div class="toolbar" style="margin-top:8px"><button class="btn primary" id="nqcopy" style="font-size:12px">Copy the queue as markdown</button></div>'
      + '</div>';
    var b = $('#nqcopy');
    if(b) b.addEventListener('click', function(){
      var md = markdown();
      try{
        navigator.clipboard.writeText(md).then(function(){
          if(window.LX && LX.toast) LX.toast('Note queue copied as Markdown');
        }, function(){ if(window.LX && LX.toast) LX.toast('Clipboard blocked in this host'); });
      }catch(e){ if(window.LX && LX.toast) LX.toast('Clipboard blocked in this host'); }
    });
  }
}

function mount(){ render(); }
document.addEventListener('DOMContentLoaded', function(){ setTimeout(mount, 950); });
setTimeout(mount, 1450);

window.LXNotes = {NOTES:NOTES, get:get, block:block, queue:queue, markdown:markdown, render:render, mount:mount};
})();
