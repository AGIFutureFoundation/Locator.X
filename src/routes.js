/* ===== Locator.X — the developer route =====================================
   Prompt 6/10. The Academy was built outward from foundations: how a building
   pays, then the numbers, then the asset, and development arrives late. That
   is the right shape for someone starting out and the wrong shape for someone
   who already controls a site, because it makes them read nine tracks before
   reaching the one they came for.

   This is a door, not a smaller house. Every lesson it names already exists
   and stays exactly where it is in the full library below; the route only
   changes the order you meet them in, and what you are doing while you do.

   Its spine is the six development gates taught in i3 and walked in Track 18,
   and it is deliberately ordered by IRREVERSIBILITY rather than by syllabus —
   cheap reversible steps ahead of expensive irreversible ones, which is the
   whole argument of D1. Each gate therefore carries three things a syllabus
   does not: the money that is actually at risk when you are standing there,
   the thing you must be able to answer before spending anything on the next
   gate, and the person who decides it. That last one is not decoration —
   emotional equity is this curriculum's stated foundation, and a gate is
   passed by a counterparty, not by a spreadsheet.
   ========================================================================= */
(function(){
'use strict';
var $ = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s==null?'':s)); };

var KEY = 'lxroute';
var done = {}; try{ done = JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ done = {}; }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(done)); }catch(e){} }

var GATES = [
  {n:1, k:'site', name:'Site control',
   risk:'An option fee and your time. The cheapest gate, and the only one you can walk away from for nothing.',
   act:{label:'Run the LOCATOR screen on a parcel', view:'uw',
        note:'Open the Underwrite tab, open any sheet, and read the seven gates at the top. Start with a parcel in a market you can drive to.'},
   who:{name:'The broker, and the owner', lesson:'q4', track:'equity',
        why:'Site control is an information relationship before it is a legal one. You hear about the parcel or you do not.'},
   lessons:[{t:'lab', id:'x1', n:'Choosing the site, and what site control actually buys'},
            {t:'invdev', id:'i3', n:'The development system: every actor, and the six gates'},
            {t:'zone', id:'z1', n:'Density, height and coverage are three different limits'},
            {t:'wider', id:'w1', n:'How the industry actually works, and who is paid by whom'}],
   proceed:'You can say, from the record and without guessing, what you are permitted to build here — and where the record goes silent.'},

  {n:2, k:'feas', name:'Feasibility',
   risk:'A study, a survey, an early cost opinion. Still small, and the last point at which walking away is free.',
   act:{label:'Price it both directions', view:'uw',
        note:'Run the max-offer solver against your buy box, then run the development engine on the same parcel. Residual land value forwards and backwards should meet in the middle, or you have found your assumption.'},
   who:{name:'Your own pre-commitment', lesson:'q6', track:'equity',
        why:'The kill criteria are written here because this is the last version of you that has not yet committed. After this gate you will want the deal to work.'},
   lessons:[{t:'lab', id:'x2', n:'Gate 2, forwards and backwards: what the land can be worth'},
            {t:'lab', id:'x3', n:'The kill criteria you write before the model'},
            {t:'invdev', id:'i6', n:'Feasibility as a gate, not an opinion'},
            {t:'wider', id:'w4', n:'The pro forma that cannot flatter you'},
            {t:'wider', id:'w5', n:'Sensitivity: finding the one input that decides'}],
   proceed:'Your kill criteria are written down, dated, and specific enough that someone else could apply them without you in the room.'},

  {n:3, k:'ent', name:'Entitlement',
   risk:'Consultants, drawings, hearing fees — and a calendar you do not control. The first gate where time itself is the cost.',
   act:{label:'Read what the record can and cannot certify', view:'evidence',
        note:'The Evidence tab shows the grade and the ceiling. A zoning-only record caps at 55 here: a permission is not a building, and this platform will not let that read as certainty.'},
   who:{name:'The staff planner, and the neighbours', lesson:'q3', track:'equity',
        why:'This is the gate with the longest tail and the least control, and it is decided by people whose incentives are not yours. Interests underneath positions is not a soft skill here; it is the schedule.'},
   lessons:[{t:'lab', id:'x4', n:'Gate 3: the calendar you do not control'},
            {t:'zone', id:'z2', n:'By right, conditional, and the word that costs a year'},
            {t:'zone', id:'z3', n:'Overlays, historic districts, and the rules on top of the rules'}],
   proceed:'You can state whether this is by right or discretionary, and you have priced the difference in months rather than described it in adjectives.'},

  {n:4, k:'fin', name:'Financing',
   risk:'Now the money commits, and so does someone else’s. Terms set here are lived with for the whole hold.',
   act:{label:'Find which lender test binds', view:'uw',
        note:'The financing sheet computes DSCR, LTV and debt yield together. All three are tested and the smallest loan wins — read which one that is on your parcel, today.'},
   who:{name:'The lender, and your equity partner', lesson:'q7', track:'equity',
        why:'A lender remembers you longer than the deal. The waterfall you negotiate here is a relationship you have to keep working inside for years.'},
   lessons:[{t:'lab', id:'x5', n:'Gate 4: where every assumption meets someone paid to doubt it'},
            {t:'invdev', id:'i5', n:'Leverage, and the exact point where it stops helping'},
            {t:'invdev', id:'i7', n:'Equity partners, and where the money actually ends up'},
            {t:'capital', id:'c1', n:'Coverage is the only leverage test that matters'},
            {t:'lev', id:'l2', n:'What the loan actually costs, beyond the rate'},
            {t:'wider', id:'w6', n:'Where the money behind your loan comes from'}],
   proceed:'You know which of the three tests binds this loan today, and what has to change in the market for a different one to bind instead.'},

  {n:5, k:'build', name:'Construction',
   risk:'Irreversible. Every dollar spent past here is spent whether or not the thesis survives.',
   act:{label:'Anchor the cost, then the schedule', view:'uw',
        note:'The rebuild anchors in the sheet give a cost per square foot to argue against. The schedule is the line most first projects leave out — carry it as a cost, not a calendar.'},
   who:{name:'The general contractor', lesson:'q2', track:'equity',
        why:'You are leading people who do not work for you. Predictability — paying on the day you said — buys more here than any clause you could have negotiated.'},
   lessons:[{t:'lab', id:'x6', n:'Gate 5: the schedule becomes a cost line'},
            {t:'build', id:'b1', n:'What a number per square foot is really telling you'},
            {t:'build', id:'b3', n:'The schedule is a cost line, not a calendar'},
            {t:'deliver', id:'p4', n:'Value engineering is not cost cutting, and confusing them is expensive'},
            {t:'deliver', id:'p7', n:'The risk register, the change order, and the contingency you must not spend'}],
   proceed:'The contingency has a named owner and a release schedule by phase, both written before the first draw.'},

  {n:6, k:'stab', name:'Stabilisation',
   risk:'The rent roll you underwrote meets the one you got. Nothing is at risk here that was not already spent — which is exactly why it is the gate people skip.',
   act:{label:'Write the lab report', view:'academy',
        note:'Then take the level-four gate on this parcel: commit to a verdict on all seven LOCATOR gates, count what the record could not answer, and write the one sentence you would defend to a partner.'},
   who:{name:'The tenants, and whoever backed you', lesson:'q8', track:'equity',
        why:'The people who funded this one decide whether there is a second one, and they decide it on how you reported the first — including the parts that went badly.'},
   lessons:[{t:'lab', id:'x7', n:'Gate 6: the rent roll you underwrote meets the one you got'},
            {t:'ops', id:'o1', n:'The rent roll you inherit is not the rent roll you underwrote'},
            {t:'ops', id:'o3', n:'Turnover is the only time the building is honest with you'},
            {t:'deliver', id:'p8', n:'Closing out, and the review that pays for the next project'},
            {t:'lab', id:'x8', n:'The lab report: what you decided, and what you learned about yourself'}],
   proceed:'You have written what you decided and why, before the outcome was known — the only version of this that will teach you anything in two years.'}
];

function lessonCount(){ var n=0; GATES.forEach(function(g){ n += g.lessons.length; }); return n; }
function trackCount(){
  var seen = {}, n = 0;
  GATES.forEach(function(g){
    g.lessons.forEach(function(l){ if(!seen[l.t]){ seen[l.t]=1; n++; } });
    if(!seen[g.who.track]){ seen[g.who.track]=1; n++; }
  });
  return n;
}

function render(){
  var host = $('#routeroot'); if(!host) return;
  var reached = GATES.filter(function(g){ return done[g.k]; }).length;

  host.innerHTML = '<div class="chart">'
    + '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:4px">'
    +   '<div class="eyebrow" style="margin:0">The developer route</div>'
    +   '<span class="badge ' + (reached===GATES.length?'good':'') + '">' + reached + ' of ' + GATES.length + ' gates marked</span>'
    + '</div>'
    + '<p class="chartnote" style="margin:0 0 12px;max-width:88ch">'
    + 'Six gates, ordered by how hard they are to undo rather than by syllabus — which is the whole argument of the '
    + 'development system lesson. ' + lessonCount() + ' lessons drawn from ' + trackCount()
    + ' tracks you already have, in the order the money is actually spent. Every one of them also stays where it was in '
    + 'the full library below; this route reorders your reading, it does not replace anything.</p>'
    + GATES.map(function(g){
        var on = !!done[g.k];
        return '<div style="border:1px solid var(--line);border-left:3px solid var(--' + (on?'good':'cat3') + ');'
          + 'border-radius:8px;padding:11px 13px;margin-bottom:8px">'
          + '<div style="display:flex;gap:9px;align-items:baseline;flex-wrap:wrap">'
          +   '<span class="num" style="font-weight:700">' + g.n + '</span>'
          +   '<b style="font-size:13.5px">' + esc(g.name) + '</b>'
          +   '<span style="margin-left:auto"><button class="chip' + (on?' on':'') + '" data-rg="' + g.k + '" '
          +     'style="font-size:11px">' + (on? 'Reached' : 'Mark reached') + '</button></span>'
          + '</div>'
          + '<p style="font-size:12px;color:var(--muted);margin:6px 0 0;line-height:1.5"><b>At risk here:</b> ' + esc(g.risk) + '</p>'
          + '<p style="font-size:12.5px;margin:8px 0 0;line-height:1.55"><b>Do this:</b> ' + esc(g.act.note) + '</p>'
          + '<div class="toolbar" style="margin:7px 0 0">'
          +   '<button class="btn" data-rv="' + esc(g.act.view) + '" style="font-size:12px">' + esc(g.act.label) + '</button>'
          + '</div>'
          + '<p style="font-size:12px;margin:9px 0 3px;color:var(--muted)"><b>Read, in this order</b></p>'
          + '<div class="chips" style="margin:0">'
          + g.lessons.map(function(l){
              return '<button class="chip" data-rt="' + esc(l.t) + '" data-rl="' + esc(l.id) + '" '
                   + 'title="' + esc(l.n) + '" style="font-size:11px">' + esc(l.id) + ' &middot; ' + esc(l.n.length>44? l.n.slice(0,42)+'…' : l.n) + '</button>';
            }).join('')
          + '</div>'
          + '<p style="font-size:12px;margin:9px 0 0;line-height:1.5;color:var(--muted)"><b>Who decides it:</b> '
          +   esc(g.who.name) + ' &mdash; ' + esc(g.who.why) + ' '
          +   '<button class="chip" data-rt="' + esc(g.who.track) + '" data-rl="' + esc(g.who.lesson) + '" style="font-size:10.5px">'
          +   esc(g.who.lesson) + '</button></p>'
          + '<p style="font-size:12.5px;margin:9px 0 0;line-height:1.55;padding-left:10px;border-left:2px solid var(--line)">'
          +   '<b>Do not spend on gate ' + (g.n+1<=GATES.length? g.n+1 : g.n) + ' until:</b> ' + esc(g.proceed) + '</p>'
          + (window.LXNotes ? window.LXNotes.block('stage', g.k) : '')
          + '</div>';
      }).join('')
    + '<p class="src" style="margin-top:6px">Marking a gate reached is your own record, kept in this browser. Nothing here '
    + 'grades you &mdash; the level gates further down do that, on a real parcel.</p>'
    + '</div>';
}

function onClick(ev){
  var t = ev.target.closest ? ev.target : null; if(!t) return;
  var b;
  if((b = t.closest('[data-rg]'))){
    var k = b.dataset.rg;
    done[k] = !done[k]; save(); render(); return;
  }
  if((b = t.closest('[data-rv]'))){
    var v = b.dataset.rv;
    try{ if(window.LX && LX.showView) LX.showView(v); }catch(e){}
    return;
  }
  if((b = t.closest('[data-rt]'))){
    /* the library keys a lesson as "track.lesson" — open that exact lesson and
       scroll to it, rather than dropping the reader at the top of a track and
       making them find it again. */
    var key = b.dataset.rt + '.' + b.dataset.rl;
    try{
      if(window.LXTC && window.LXTC.open){ LXTC.open(key); }
      var row = document.querySelector('#tcroot [data-tcrow="' + key + '"]');
      var host = row || document.getElementById('tcroot');
      if(host && host.scrollIntoView) host.scrollIntoView({behavior:'smooth', block:'center'});
    }catch(e){}
    return;
  }
}

var wired = false;
function mount(){
  var host = $('#routeroot'); if(!host) return;
  if(!wired){ host.addEventListener('click', onClick); wired = true; }
  render();
}
document.addEventListener('DOMContentLoaded', function(){ setTimeout(mount, 850); });
setTimeout(mount, 1350);
window.LXRoute = {render:render, mount:mount, GATES:GATES};
})();
