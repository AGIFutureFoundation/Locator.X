/* packet — the closing file, assembled from the record.
 *
 * The Academy teaches a transaction as a FILE, not as a form: the documents to
 * demand, the clause families to read, and the contingency that exists to
 * resolve each unknown. This module renders that teaching against an actual
 * property — its asset class decides which documents apply, and the edition's
 * state decides which of the sourced record-layer facts can be shown.
 *
 * THE LINE THIS MODULE DOES NOT CROSS (docs/CONTRACT_ANATOMY.md): it generates
 * no clause language and states no rule of law. Every state-sensitive item is
 * rendered as a QUESTION FOR COUNSEL. The four state facts it does show are
 * read straight out of docs/states/README.md, which carries their sources and
 * review date, and are parsed — never restated — by scripts/build_packet.py.
 *
 * Data: window.LXPACKETDATA (generated; src/packet_data.js).
 */
(function(){
'use strict';
const X = () => window.LX;
const P = () => window.LXPACKETDATA;
const esc = s => (window.LX ? LX.esc(String(s==null?'':s)) : String(s==null?'':s));

/* ---------- where this property is ----------
   In order of how much it is worth trusting: the record's own state, then the
   data module's region, then the edition constant build_state.py rewrites. A
   multi-state edition resolves to null and every consumer here says so. */
function stateName(l){
  if(l && l.state) return l.state;
  try{ if(window.BA && BA.region && BA.region.state) return BA.region.state; }catch(e){}
  try{ const s = X() && X().EDITION_STATE; if(s) return s; }catch(e){}
  return null;
}
function stateRow(l){
  const n = stateName(l); if(!n || !P()) return null;
  return P().states.find(s => s.state === n) || null;
}
/* The address line an offer document needs. Never invents a state: where the
   edition spans several, it prints a blank the reader must fill, labeled. */
function addressLine(l){
  const st = stateName(l);
  const tail = st ? st + ' ' + (l.zip || '') : '[STATE — not in this record] ' + (l.zip || '');
  return [l.addr, l.city, tail].filter(Boolean).join(', ').trim();
}

/* ---------- which documents this property needs ----------
   A display mapping over the record's own `kind` string, the same heuristic the
   Type filter uses (src/app.js kindClass) and for the same reason: it decides
   what to SHOW, never what a parcel is. Where the crosswalk disagrees, the
   crosswalk wins. */
function classesOf(l){
  const k = String((l && l.kind) || '').toLowerCase();
  const units = (l && l.units) || 1;
  const cs = new Set(['all']);
  if(/hotel|motel|inn\b|lodg|hospitality|resort|bed and breakfast/.test(k)) cs.add('lodging');
  else if(/dorm|student|fraternit|sororit/.test(k)) cs.add('student');
  else if(/mobile home|manufactured|trailer park|mhp|rv park/.test(k)) cs.add('mhp');
  else if(/condo|townhous/.test(k)) cs.add('condo');
  else if(/office|retail|industrial|warehouse|commercial/.test(k)) cs.add('commercial');
  if(units >= 5) cs.add('apartments');
  if(units >= 2) cs.add('multi');
  return cs;
}
function itemsFor(l){
  if(!P()) return [];
  const cs = classesOf(l);
  return P().documents.filter(d => d.classes.some(c => cs.has(c)));
}

/* ---------- render ----------
   `done` is a Set of item ids. Ids, not indices: the checklist this replaces
   stored positions, so any edit to the list silently re-pointed every saved
   tick at a different item. */
const KINDS = [
  ['public record', 'Public record — pull it yourself', 'Published by an agency. If you cannot re-pull it, it is not a record you have.'],
  ['document', 'Documents — demand them', 'They exist, but only the seller has them. Rents and operating history are never public record.'],
  ['quote', 'Quotes — get them in writing', 'A live offer that expires. An offer is not a fact about the world.'],
  ['measurement', 'Measurements — take them', 'Nobody hands these to you.']
];

function render(l, opts){
  opts = opts || {};
  const d = P(); if(!d || !l) return '';
  const done = opts.done || new Set();
  const items = itemsFor(l);
  const row = stateRow(l), st = stateName(l);
  const openN = items.filter(i => !done.has(i.id)).length;

  const kindBlocks = KINDS.map(([kind, title, note]) => {
    const list = items.filter(i => i.kind === kind);
    if(!list.length) return '';
    return '<div class="pkkind"><h5>' + esc(title) + ' <span>' + list.length + '</span></h5>'
      + '<div class="pknote">' + esc(note) + '</div>'
      + '<div class="checklist">' + list.map(i =>
          '<label class="' + (done.has(i.id) ? 'done' : '') + '" title="' + esc(i.why) + '">'
          + '<input type="checkbox" data-pk="' + esc(i.id) + '"' + (done.has(i.id) ? ' checked' : '') + '>'
          + esc(i.label)
          + ' <em class="pklesson" title="the course lesson that teaches this">' + esc(i.lesson) + '</em>'
          + '</label>').join('')
      + '</div></div>';
  }).join('');

  const stateBlock = row
    ? '<div class="pkstate"><b>' + esc(row.state) + '</b> — from the state table in the guides, which carries the sources and the review date.'
      + '<div class="pkfacts">'
      + '<div><span>Foreclosure</span><span>' + esc(row.foreclosure) + '</span></div>'
      + '<div><span>Tax delinquency</span><span>' + esc(row.tax_delinquency) + '</span></div>'
      + '<div><span>Transfer tax</span><span>' + esc(row.transfer_tax) + '</span></div>'
      + '<div><span>Housing finance agency</span><span>' + esc(row.hfa) + '</span></div>'
      + '</div>'
      + '<div class="pknote">These four are record-layer facts, not contract law. What the contract does in ' + esc(row.state) + ' is the question list below.</div></div>'
    : '<div class="pkstate pkunknown"><b>State — unknown for this record.</b> '
      + (st ? 'This edition names ' + esc(st) + ', which is not a row in the state table.'
            : 'This edition spans more than one state, and the record does not name its own.')
      + ' The universal items above still apply; the questions below are the ones to ask counsel '
      + 'in whichever state this parcel sits, and nothing here guesses which.</div>';

  const clauseRows = d.clauses.map(c =>
    '<tr><td><b>' + esc(c.family) + '</b><div class="pknote">' + esc(c.does) + '</div></td>'
    + '<td>' + esc(c.ask_counsel) + '</td>'
    + '<td class="pklesson">' + esc(c.lesson) + '</td></tr>').join('');

  const conts = d.contingencies.map(cg => {
    const open = items.filter(i => !done.has(i.id) && cg.resolves_kinds.indexOf(i.kind) >= 0);
    return '<div class="pkcont"><b>' + esc(cg.label) + '</b> — '
      + (open.length
          ? '<span class="pkopen">' + open.length + ' unresolved</span>: ' + esc(open.map(i => i.label).join('; '))
          : '<span class="pkdone">nothing outstanding in this file</span>')
      + '<div class="pknote">' + esc(cg.note) + '</div></div>';
  }).join('');

  return '<div class="packet">'
    + '<h4 class="pkh">Closing file — ' + items.length + ' items for this asset class, '
    + '<span class="' + (openN ? 'pkopen' : 'pkdone') + '">' + openN + ' still open</span></h4>'
    + '<div class="pknote" style="margin-bottom:8px">' + esc(d.what_this_is_not) + '</div>'
    + kindBlocks
    + stateBlock
    + '<h5 class="pkh2">Take these questions to counsel</h5>'
    + '<table class="pkclauses"><tr><th>Clause family</th><th>The question</th><th>Course</th></tr>'
    + clauseRows + '</table>'
    + '<h5 class="pkh2">What each contingency is still carrying</h5>'
    + conts
    + '<div class="pkrule">' + esc(d.closing_rule) + '</div>'
    + '</div>';
}

/* The packet as plain text, for the reader who takes it to an attorney. */
function asText(l, done){
  const d = P(); if(!d || !l) return '';
  done = done || new Set();
  const items = itemsFor(l), row = stateRow(l);
  const L = ['CLOSING FILE — ' + addressLine(l), '',
    'Not a contract, not legal advice, and not a claim about any state’s law.',
    'Generated by locator.x from the Academy’s transaction checklist.', ''];
  KINDS.forEach(([kind, title]) => {
    const list = items.filter(i => i.kind === kind);
    if(!list.length) return;
    L.push(title.toUpperCase());
    list.forEach(i => L.push('  [' + (done.has(i.id) ? 'x' : ' ') + '] ' + i.label + '  (' + i.lesson + ')'));
    L.push('');
  });
  L.push(row
    ? 'STATE — ' + row.state + ': foreclosure ' + row.foreclosure + '; tax delinquency '
      + row.tax_delinquency + '; transfer tax ' + row.transfer_tax + '; HFA ' + row.hfa
      + '\n  (record-layer facts from the state guides, which carry their sources and dates)'
    : 'STATE — unknown for this record. Nothing below assumes one.');
  L.push('', 'QUESTIONS FOR COUNSEL');
  d.clauses.forEach(c => L.push('  ' + c.family + ': ' + c.ask_counsel + '  (' + c.lesson + ')'));
  L.push('', d.closing_rule);
  return L.join('\n');
}

window.LXPACKET = {render, asText, itemsFor, classesOf, stateName, stateRow, addressLine};
})();
