/* locator.x - governance, security and compliance posture.
   ----------------------------------------------------------------------------
   Written for the reviewer who has to sign off on this tool, not for marketing.
   Every claim here is either verifiable from the running page or stated as a
   limitation. Where the honest answer is "partial" or "not assessed", it says so:
   a compliance page that claims full conformance it has not tested is worse than
   no page at all, because it moves the risk from visible to hidden. */
(function(){
'use strict';
var $ = function(s, el){ return (el||document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }

/* Facts measured from the live page rather than asserted. */
function audit(){
  var out = {};
  try{
    var all = L().allListings();
    out.records = all.length;
    var keys = {};
    for(var i=0;i<Math.min(all.length, 8000); i++){
      for(var k in all[i]) if(Object.prototype.hasOwnProperty.call(all[i],k)) keys[k]=1;
    }
    out.fields = Object.keys(keys).sort();
    var PII = /owner(?!Occ)|taxpayer|mail|phone|email|ssn|dob|race|ethnic|income|gender/i;
    out.piiFields = out.fields.filter(function(k){ return PII.test(k); });
  }catch(e){ out.err = String(e).slice(0,90); }
  out.eval = (typeof window.eval === 'function');
  out.storage = [];
  try{ localStorage.setItem('__lxprobe','1'); localStorage.removeItem('__lxprobe'); out.storage.push('localStorage'); }catch(e){}
  out.imported = (function(){ try{ return L().state.imported.length; }catch(e){ return 0; } })();
  return out;
}

var SECTIONS = [
  {id:'data', t:'Where every figure comes from',
   body:'<p>Nothing in this catalogue is generated, modelled or filled in. Every record is a row a named public body published, and each one carries a source note naming that body, what its value field actually means in that jurisdiction, and what it does not publish. Values are assessor figures unless the record says otherwise, and the app never presents an assessor value as a price somebody paid.</p>'+
        '<p>Where a source is a private republication of public data rather than the authority&rsquo;s own service, the record says so and warns that it can be withdrawn. Where a jurisdiction publishes zoning but no use class, records read &ldquo;Zoned for&hellip;&rdquo; and rank below verified uses. Where it publishes nothing usable, records are labelled unclassified rather than guessed.</p>'+
        '<p><b>No use code and no zoning district is ever inferred.</b> Each is either quoted from a published manual whose URL is on the record, read from a self-documenting plain-English field, or declined.</p>'},

  {id:'pii', t:'Personal data',
   body:'<p>The public records this app draws on frequently include owner names, taxpayer names and owner mailing addresses. <b>None of them are carried into this application.</b> The field list below is measured from the running page, not asserted.</p>'+
        '<p>The app holds no demographic data of any kind &mdash; no race, ethnicity, national origin, income, household composition, school ratings or crime statistics. Those are the classic proxies for protected class in a property-targeting tool and they are absent by design, not by omission.</p>'+
        '<p>One field deserves naming: some assessor rolls publish an <b>owner-occupancy or homestead-exemption flag</b>, which is a fact about a specific address. It is carried where the county publishes it, because it changes how a property is underwritten. It is not a name and cannot be resolved to a person from this app.</p>'},

  {id:'fair', t:'Fair housing &mdash; and one thing to push back on',
   body:'<p>This is a screening and underwriting tool, not a tenant-selection or advertising tool. It holds no protected-class data and produces no tenant-facing output, so the ordinary advertising and steering exposures under the Fair Housing Act do not arise here.</p>'+
        '<p><b>A reviewer should still look hard at one thing.</b> The below-market signal weights a property up when the roll shows it is <b>owner-occupied</b>, and again when it was <b>built before 1975</b>. Both are defensible underwriting inputs &mdash; owner-occupants deferring maintenance and older stock needing capital are real patterns. But together they describe a search for undercapitalised owner-occupants in older neighbourhoods, which is exactly the pattern that draws scrutiny around equity stripping, and pre-1975 stock correlates with historically disinvested areas.</p>'+
        '<p>It is surfaced here rather than buried because an organisation deploying this should decide deliberately whether to keep that weighting, not discover it in an audit. It can be removed without affecting anything else in the score.</p>'},

  {id:'sec', t:'Application security',
   body:'<p>The page contains <b>no <code>eval</code>, no <code>new Function</code>, no <code>document.write</code>, no <code>srcdoc</code> and no inline event-handler attributes</b>. Every handler is a property assignment, so the app runs under a strict content policy without needing <code>unsafe-inline</code> or <code>unsafe-eval</code>.</p>'+
        '<p>The untrusted surface is the import path &mdash; a pasted payload, a dropped CSV, or a live feed an operator points at. Everything arriving that way passes through a single choke point that strips markup, quotes and control characters before it can become a record. That is defence in depth, layered on top of escaping at the render sites, so a missed escape cannot become an injection.</p>'+
        '<p>URLs destined for a link are checked against a scheme allow-list. <code>javascript:</code>, <code>data:</code> and <code>vbscript:</code> are refused outright rather than sanitised, because a partial fix on a URL scheme is worse than none.</p>'+
        '<p>The page reaches the network only for map tiles and web fonts. <b>Every public-record source is a link an operator clicks</b> &mdash; the app never fetches, scrapes, caches or automates a records portal, and one of them states plainly that automated access is abuse.</p>'},

  {id:'store', t:'What is stored, and where',
   body:'<p>All state &mdash; the buy box, saved scenarios, the knowledgebase, Academy progress &mdash; lives in <b>this browser’s local storage on this device only</b>. Nothing is transmitted to Locator.X, to AGI Corp, or to any server. There is no account, no telemetry and no analytics beacon in the page.</p>'+
        '<p>The practical consequence for a public body: work done in this tool is <b>not automatically a record in any system</b>, and it is lost if the browser profile is cleared. If the work needs to be retained under a records-retention schedule, export it. Conversely, if it is subject to a public-records request, note that it exists on the device.</p>'},

  {id:'a11y', t:'Accessibility &mdash; stated honestly',
   body:'<p>Several things are done deliberately. Every categorical palette in the app was validated with a runnable checker rather than by eye, against colour-vision deficiency as well as normal vision, and <b>shape carries the same information as colour</b> in every chart, so nothing is encoded by colour alone. Light and dark are separately validated against their own surfaces. Charts have text alternatives in adjacent tables, and tabs use ARIA roles and selection state.</p>'+
        '<p><b>What has not been done:</b> this application has <b>not</b> been through a formal Section 508 or WCAG 2.1 AA audit, and it should not be described as conformant. Known gaps: the map and the 3D tower view are inherently visual and have no non-visual equivalent for the spatial relationships they show; keyboard navigation has not been tested end to end across all twenty tabs; screen-reader labelling of the dynamic chart regions is incomplete; and no assistive-technology testing has been performed.</p>'+
        '<p>An agency with a 508 obligation should treat that as work to be scoped, and should not accept a conformance claim from this page. The tabular views are the accessible path to the same underlying data today.</p>'},

  {id:'limits', t:'What this tool does not do',
   body:'<p>It does not value property. It does not give investment, legal or tax advice. It does not verify that a building exists, is occupied, or is in the condition its record implies. It does not check title, liens, easements or code violations. It does not replace an appraisal, a survey, an inspection, an environmental assessment or counsel.</p>'+
        '<p>An announced corporate project is an intention with a date and a source, <b>never a forecast of delivered jobs</b>. A permit is not a delivered unit. A published enrolment carries the term it was published for. An assessment roll can be years behind the market, and this app measures by how much rather than assuming.</p>'+
        '<p>Every underwriting memorandum it produces ends with a page listing what could not be verified for that specific parcel in that specific county. That page is the point of the document.</p>'}
];

function render(){
  var host = $('#compliroot'); if(!host) return;
  var a = audit();
  var h = '<div class="tiles" style="margin-bottom:14px">'
    + tile('Records in this edition', L().fmtN(a.records||0), 'every one a published public record')
    + tile('Personal-data fields', a.piiFields && a.piiFields.length ? esc(a.piiFields.join(', ')) : 'none', 'measured from the running page, not asserted')
    + tile('Data leaving this device', 'none', 'no account, no telemetry, no analytics')
    + tile('Imported by this operator', L().fmtN(a.imported||0), 'sanitised at the boundary before use')
    + '</div>';

  h += SECTIONS.map(function(s){
    return '<div class="chart" style="margin-bottom:12px"><p class="eyebrow">' + esc(s.t) + '</p>'
      + '<div style="font-size:13.5px;color:var(--ink2);line-height:1.75;max-width:84ch">' + s.body + '</div></div>';
  }).join('');

  h += '<div class="chart"><p class="eyebrow">Field inventory</p>'
    + '<h3 style="margin:2px 0 8px">Every field this edition carries</h3>'
    + '<p style="font-size:13px;color:var(--ink2);margin:0 0 8px">Read from the running page so it cannot drift from the claim above.</p>'
    + '<p style="font-family:var(--mono,monospace);font-size:12px;color:var(--ink2);line-height:1.9">'
    + (a.fields||[]).map(function(f){ return '<span style="display:inline-block;padding:1px 7px;margin:0 4px 4px 0;border:1px solid var(--line);border-radius:3px">' + esc(f) + '</span>'; }).join('')
    + '</p><p class="src">If a field that could identify a person ever appears in this list, that is a defect and should be reported before the edition is used.</p></div>';

  host.innerHTML = h;
  if(window.LXPanels) setTimeout(function(){ LXPanels.scan('compliance'); }, 140);
}
function tile(k, v, note){
  return '<div class="tile"><p class="eyebrow" style="margin:0">' + esc(k) + '</p>'
    + '<p class="big num" style="margin:4px 0 2px;font-size:' + (String(v).length > 18 ? '13px' : '') + '">' + v + '</p>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:0">' + esc(note) + '</p></div>';
}
window.LXCompliance = {render: render, audit: audit, SECTIONS: SECTIONS};
})();
