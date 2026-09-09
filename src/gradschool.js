/* ===== Locator.X — Graduate & Professional Certificate =====================
   A university-register addition to the Academy, sitting beside Tradecraft
   rather than replacing it: Tradecraft teaches the trade as it is practiced;
   this track teaches the theory underneath it, at the register of a graduate
   real-estate-finance or urban-economics course.

   SOURCING RULE, stated once and held to everywhere below: every lesson here
   is ORIGINAL Locator.X writing. Nothing is copied, paraphrased at length, or
   reskinned from any course, textbook or publisher. Where a lesson leans on a
   named institution's open material, it cites the institution and links the
   real, freely accessible page — MIT OpenCourseWare, OpenStax, the Lincoln
   Institute of Land Policy, or a named federal working paper — as further
   reading, never as a source of copied text. No institution named in these
   citations has reviewed, endorsed, sponsored or is affiliated with this
   track, and finishing it confers no accredited degree, diploma, licence or
   professional certification of any kind. That is stated again, explicitly,
   on the certificate this track can generate once every lesson is passed.

   This file only APPENDS to window.LXTC.TRACKS (built by tradecraft.js,
   loaded earlier) — tradecraft.js itself is untouched, so its own rendering,
   progress-tracking and localStorage key ('lxtradecraft') all pick this
   track up for free, exactly like every other track. The certificate panel
   below is the one genuinely new piece of UI, and it mounts into its own
   #gradcert container (declared in body.html right after #tcroot) so it
   never has to fight tradecraft.js's own re-renders for the DOM. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s == null ? '' : s)); };

var TRACK_ID = 'grad';
var LESSON_IDS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

var FURTHER = {
  ocw431: 'MIT OpenCourseWare, 11.431J Real Estate Finance and Investment (Fall 2006) — ocw.mit.edu/courses/11-431j-real-estate-finance-and-investment-fall-2006/',
  ocw432: 'MIT OpenCourseWare, 11.432J Real Estate Capital Markets (Spring 2007) — ocw.mit.edu/courses/11-432j-real-estate-capital-markets-spring-2007/',
  ocw433: 'MIT OpenCourseWare, 11.433J Real Estate Economics (Fall 2008) — ocw.mit.edu/courses/11-433j-real-estate-economics-fall-2008/',
  ocw434: 'MIT OpenCourseWare, 11.434J Advanced Topics in Real Estate Finance (Spring 2007) — ocw.mit.edu/courses/11-434j-advanced-topics-in-real-estate-finance-spring-2007/',
  ocw493: 'MIT OpenCourseWare, 11.493 Legal Aspects of Property and Land Use (Fall 2005) — ocw.mit.edu/courses/11-493-legal-aspects-of-property-and-land-use-fall-2005/',
  openstax: 'OpenStax, Principles of Finance (free, peer-reviewed textbook) — openstax.org/details/books/principles-finance-2e',
  lincoln: 'Lincoln Institute of Land Policy, courses and open publications — lincolninst.edu/courses/',
  fhfa: 'Contat, Hopkins, Mejia & Suandi, "When Climate Meets Real Estate: A Survey of the Literature," FHFA Working Paper 23-05 (2024) — fhfa.gov/document/wp2305.pdf'
};
function reading(keys){
  return '<p class="src" style="margin-top:10px"><b>Further reading, freely accessible, not required and not reproduced here:</b><br>'
    + keys.map(function(k){ return esc(FURTHER[k]); }).join('<br>') + '</p>';
}

var TRACK = {
  id: TRACK_ID, name: 'Graduate & professional certificate', slot: 12,
  blurb: 'The theory underneath the trade, at the register of a graduate finance or urban-economics course — the '
    + 'mathematics, the models, the case law and the research literature that Tradecraft’s practitioner lessons '
    + 'assume. Original Locator.X writing throughout; further reading points to real, freely accessible university '
    + 'and public-agency material and copies none of it. Completing every lesson unlocks a dated certificate of '
    + 'completion issued by this application — not an accredited degree, and not affiliated with any institution '
    + 'named in the citations below.',
  modules: [
  {id: 'g1', t: 'How this track differs, and where its sources come from', body: `
   <p>Tradecraft, the track above, teaches the trade as it is practiced: what a number means, what a lender will
   ask, what kills a deal. This track teaches the layer underneath — the mathematics, the economic models, the
   case law and the empirical research that the practitioner lessons assume without deriving.</p>
   <p>The sourcing rule is the same one the case-study track uses, adapted for theory instead of business history:
   every lesson is <b>original writing</b>, and every institution named is cited as a pointer to real, freely
   accessible further reading — a syllabus, an open textbook, a public agency's own working paper — never as
   material this app has copied or paraphrased at length from. No course, university, publisher or agency named
   anywhere in this track has reviewed, endorsed, sponsored, or is affiliated with it. That includes MIT
   OpenCourseWare, OpenStax and the Lincoln Institute of Land Policy, whose open materials are cited as further
   reading in the lessons that follow.</p>
   <p><b>What finishing it gets you.</b> A certificate of completion generated by this application once all six
   lessons are passed, with your name, the date, and a content-hash credential id — the same honest, self-issued
   pattern this Academy already uses for its role credentials elsewhere. It is not a degree, a diploma, or a
   professional licence, and it does not substitute for one. Treat it the way you would treat a certificate from
   any self-paced course platform: evidence you did the work, not evidence of accreditation.</p>`,
   drill: {q: 'A lesson in this track cites an MIT OpenCourseWare syllabus as further reading. What does that citation mean?',
     opts: ['MIT has reviewed and endorsed this lesson', 'The lesson’s text was adapted from that syllabus with permission',
       'The citation points to real, freely accessible material on the same topic; the lesson itself is original writing with no institutional affiliation or endorsement',
       'Completing this lesson earns MIT continuing-education credit'],
     a: 2, why: 'Every citation in this track is a pointer to real further reading, not a source of copied text, and carries no endorsement or affiliation whatsoever — stated once here and true of every lesson that follows.'}},
  {id: 'g2', t: 'The mathematics of real estate finance: NPV, IRR, and the trap of multiple roots', body: `
   <p>Net present value discounts every future cash flow back to today at a chosen rate and sums them; it answers
   "is this worth more than what I put in, at the return I require." Internal rate of return finds the discount
   rate at which NPV equals zero; it answers "what return does this cash flow stream actually imply." They usually
   agree on which of two deals is better. They do not always exist as a single clean number.</p>
   <p><b>The trap.</b> IRR is the root of a polynomial in the discount rate, one term per period. By Descartes'
   rule of signs, a cash flow stream can have as many positive real roots as it has sign changes. A simple
   buy-hold-sell stream (outflow, then inflows, then a final sale inflow) has one sign change and one clean IRR.
   A rebuild with a mid-project capital call — positive early cash flow, a large negative draw in year three for a
   second phase, positive again after — has two sign changes and can produce <i>two</i> mathematically valid IRRs,
   both technically correct and neither individually meaningful. This app's own five-year outlook path
   (<code>LXOutlook.path()</code>) sidesteps the problem by construction: it runs one fitted rate forward rather
   than solving for an implied rate backward from an irregular stream, which is exactly why it never needs to
   handle multiple roots.</p>
   <p><b>The doctrine.</b> When a cash flow stream changes sign more than once, do not trust IRR at all — read NPV
   at a stated, defensible discount rate instead, or use a modified IRR (MIRR) that reinvests interim cash flows
   at an explicit rate before solving for a single return. A return metric that can silently have two right
   answers is not a metric you can defend in an investment committee memo.</p>`,
   drill: {q: 'A redevelopment’s cash flow is: −$2.0M (purchase), +$0.3M, +$0.3M, −$1.5M (phase-two capital call), +$0.4M, +$4.2M (sale). What is the honest read of its IRR?',
     opts: ['Solve for IRR and report it — that is what the metric is for',
       'This stream has more than one sign change, so IRR may have multiple mathematically valid roots; report NPV at a stated discount rate, or a MIRR, instead',
       'Average the per-period returns','IRR is only defined for streams with a single outflow, so none of these methods apply'],
     a: 1, why: 'The stream changes sign three times (out, in, out, in), so by Descartes’ rule it can have up to three positive real IRRs. A metric that can have three different "correct" answers is not one to quote in a memo — NPV at a stated rate, or MIRR, gives a single defensible number.'}},
  {id: 'g3', t: 'Urban economic theory: the bid-rent function and why location has a price of its own', body: `
   <p>The bid-rent model asks a simple question: how much would each type of land use pay for a parcel at a given
   distance from the center of economic activity, and how does that willingness to pay change with distance? The
   answer is a downward-sloping curve for every use — but the <i>slope</i> differs by use, and the slope is the
   whole story.</p>
   <p>Retail and office uses value centrality highly: an extra block of distance measurably costs them footfall or
   agglomeration benefit, so their bid-rent curve is steep — they will pay a premium to be central and drop off
   fast as distance grows. Residential use values space and quiet more than it values being adjacent to the
   center, so its curve is flatter. Where the curves cross determines the boundary between a commercial core and
   the residential ring around it — not zoning, in the model's pure form, though in practice zoning ratifies and
   hardens a boundary the market would have drawn on its own gradient.</p>
   <p>Two things this app measures are direct descendants of this theory. The sector bubbles' one-year index
   change by ZIP is, in effect, a snapshot of where the bid-rent surface is currently moving fastest. And the
   agglomeration logic behind "jobs per permit" as a leading indicator on the Predictions tab is the same
   force that steepens a bid-rent curve in the first place: a corridor attracting concentrated employment is a
   corridor where the willingness to pay for proximity is rising.</p>`,
   drill: {q: 'In the classic bid-rent model, why is a downtown retail corridor typically surrounded by a residential ring rather than the reverse?',
     opts: ['Zoning always requires it', 'Retail’s bid-rent curve is steeper (values centrality more) than residential’s, so retail outbids residential near the center and loses that advantage faster with distance, leaving residential to win the rest of the gradient',
       'Residential land is always cheaper to build on', 'The model does not address land use mix, only price'],
     a: 1, why: 'The differing slopes are the mechanism: a steeper bid-rent curve wins the most central land, and a flatter one wins everywhere the steep curve has already fallen below it. Zoning typically ratifies this gradient rather than creating it from nothing.'},
   x: reading(['ocw433'])},
  {id: 'g4', t: 'Capital markets: how a mortgage becomes a security, and why cap rates track the ten-year', body: `
   <p>A single mortgage is a bilateral loan. Pooled with thousands of others, sliced into tranches with different
   claims on the pool's cash flow and different exposure to default, and sold to investors, it becomes a
   commercial mortgage-backed security (CMBS) — a capital-markets instrument whose price is set the way a bond's
   is, not the way a building's is. That securitization is what lets a local lender's balance sheet turn over and
   keep originating loans instead of holding every one to maturity, and it is also what connects a single
   property's financing cost to the broader bond market's mood on any given day.</p>
   <p>The connection that matters most for underwriting is the relationship between a cap rate and the risk-free
   rate. In its simplest Gordon-growth form, a cap rate approximates a required discount rate minus an expected
   growth rate, and the discount rate itself is built from a risk-free base (conventionally proxied by the
   ten-year Treasury yield) plus a risk premium specific to real estate and to the asset. When the ten-year rises
   and neither the growth expectation nor the risk premium moves to offset it, the arithmetic pushes cap rates up
   — which, because value is NOI divided by cap rate, pushes value down for an unchanged income stream. This is
   the mechanism behind "rates went up, so values came down" headlines, stated as arithmetic rather than
   sentiment.</p>
   <p>This app's own outlook block runs a version of the same logic in reverse: rather than assuming a cap-rate
   move, it solves by bisection for the rent growth rate a deal needs to clear a target DSCR, and compares that
   requirement to what the ZIP has actually been doing — which is the underwriting-desk version of asking whether
   the market's implied growth assumption is realistic before the financing terms are locked in.</p>`,
   drill: {q: 'The ten-year Treasury yield rises one point and stays there. Real estate cash flow growth expectations and risk premiums are unchanged. What does the simple cap-rate identity (discount rate ≈ risk-free rate + risk premium − growth) imply?',
     opts: ['Cap rates should fall, raising values', 'Cap rates should rise, which — with NOI unchanged — implies lower value (value = NOI ÷ cap rate)',
       'Nothing changes; cap rates are set independently of interest rates', 'Only new construction is affected, not existing buildings'],
     a: 1, why: 'A higher risk-free rate raises the required discount rate with growth and risk premium held fixed, which the identity translates directly into a higher cap rate — and a higher cap rate divided into the same NOI produces a lower implied value.'},
   x: reading(['ocw431', 'ocw432', 'openstax'])},
  {id: 'g5', t: 'Land use law: the constitutional architecture behind every zoning table in this app', body: `
   <p>Every zoning district this app reads — density, height, coverage, use tables — rests on a single 1926
   Supreme Court decision: <i>Village of Euclid, Ohio v. Ambler Realty Co.</i>, 272 U.S. 365. Ambler Realty owned
   land the Village of Euclid had zoned to exclude industrial use, cutting its value; Ambler argued the zoning
   ordinance was an unconstitutional taking of property without compensation. The Court disagreed, holding that
   comprehensive use-based zoning is a valid exercise of a municipality's police power — the same authority that
   lets a city regulate nuisances and public health — provided it is not "clearly arbitrary and unreasonable,
   having no substantial relation to the public health, safety, morals, or general welfare." That single sentence
   is the constitutional floor every zoning code in this catalogue still stands on, and the case is why
   use-segregated, district-based zoning is called <b>Euclidean zoning</b> to this day.</p>
   <p>Two doctrines built on top of Euclid matter for reading any specific parcel's zoning, and both appear
   throughout this app's own data: a <b>variance</b> is site-specific relief from a code requirement (a setback,
   a height limit) granted where strict application would cause unnecessary hardship unique to that parcel — it
   does not rezone the district. A <b>taking</b> claim revives when regulation goes further than Euclid
   contemplated: under <i>Lucas v. South Carolina Coastal Council</i> (1992), a regulation that eliminates all
   economically viable use of a parcel can require compensation even though Euclid-style zoning in general does
   not. Between those two poles sits the overwhelming majority of zoning disputes this app's Governance and
   Record Locker tabs point a user toward researching for any specific parcel, rather than adjudicating.</p>`,
   drill: {q: '<i>Village of Euclid v. Ambler Realty Co.</i> (1926) is significant because it:',
     opts: ['Struck down zoning as an unconstitutional taking', 'Upheld comprehensive use-based zoning as a valid exercise of municipal police power, establishing the constitutional basis for "Euclidean" district zoning still in use today',
       'Created the modern variance process', 'Required every city to adopt zoning'],
     a: 1, why: 'Euclid upheld zoning’s constitutionality against a takings challenge, provided it bears a substantial relation to public health, safety, morals or welfare — the foundation every use-district zoning table in this app’s data ultimately rests on.'},
   x: reading(['ocw493'])},
  {id: 'g6', t: 'Climate risk in underwriting: what the research literature actually finds', body: `
   <p>This app's Data sources tab already states a hard limit plainly: the NOAA sea-level-rise layer it evaluated
   returned an identical hit at every rise scenario from zero to ten feet for three different cities, because the
   polygon it serves is the study-area extent, not a real inundation boundary — and a tool that trusted it would
   have reported flood exposure everywhere and been confidently wrong. That finding is not an isolated data quirk;
   it sits inside a broader, actively researched question: does the housing market price physical climate risk
   correctly at all?</p>
   <p>A 2024 Federal Housing Finance Agency working paper surveying this literature (Contat, Hopkins, Mejia &amp;
   Suandi, "When Climate Meets Real Estate: A Survey of the Literature," FHFA WP 23-05) reports a meta-analysis
   finding an average price discount of roughly <b>3.9%</b> for properties in mapped flood zones — but with two
   important qualifications the survey stresses: the discount is inconsistent and time-varying, largest
   immediately after a disaster and fading as memory fades, and the literature finds housing markets are
   <b>unlikely to have fully priced in longer-horizon, chronic hazards like sea-level rise</b> at all. In other
   words, the market prices a flood after it happens better than it prices a slow-moving risk before it does.</p>
   <p>This is directly actionable for how this app's own sources should be read. Its FEMA National Flood Hazard
   Layer and Letters of Map Revision give a legally defined, currently mapped flood zone — a real regulatory fact.
   Its 3DEP elevation lookup gives ground elevation, explicitly not finished-floor elevation, and this app
   correctly declines to compute freeboard from it because the two must be surveyed to the same datum. Neither
   source, nor any source in this catalogue, tells you what a property's flood risk will be in twenty years — and
   the research above is a specific reason to distrust a market price that implies the current mapped zone is the
   whole of the risk.</p>`,
   drill: {q: 'Per the FHFA literature survey cited in this lesson, what does the research broadly find about how the housing market prices physical climate risk?',
     opts: ['Markets fully and efficiently price all climate risk into value immediately', 'Recently mapped flood-zone properties show a modest average discount (roughly 3.9% in a meta-analysis) that is largest right after a disaster and fades over time, while longer-horizon chronic risks like sea-level rise appear substantially underpriced',
       'Climate risk has no measurable effect on real estate prices anywhere', 'Only wildfire risk is priced; flood risk is not'],
     a: 1, why: 'The survey’s meta-analysis finds a real but partial and fading flood-zone discount, and separately flags that slower-moving hazards such as sea-level rise are unlikely to be fully capitalized into current prices at all — a market that prices the visible risk better than the creeping one.'},
   x: reading(['fhfa', 'lincoln'])}
  ]
};
/* the modules array above stores extra "further reading" HTML on .x rather
   than folding it into .body, so it can be appended after the drill without
   disturbing tradecraft.js's existing body/drill layout */
TRACK.modules.forEach(function(m){ if(m.x){ m.body = m.body + m.x; delete m.x; } });

function register(){
  if(!window.LXTC || !window.LXTC.TRACKS) return false;
  if(window.LXTC.TRACKS.some(function(t){ return t.id === TRACK_ID; })) return true;
  window.LXTC.TRACKS.push(TRACK);
  return true;
}

/* ---- certificate ---------------------------------------------------------
   Reuses tradecraft.js's own progress store (key 'lxtradecraft') read-only,
   so there is exactly one source of truth for "which drills has this learner
   passed" and this file never has to write to it. The credential-id pattern
   (a SHA-256 content hash) mirrors the one academy.js already uses for its
   role credentials, so the app has one honest, consistent idiom for "this
   was issued by this application" rather than two different ones. */
var KEY = 'lxtradecraft';
function pr(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ return {}; } }
function doneCount(){
  var t = (pr()[TRACK_ID]) || {};
  var n = 0;
  LESSON_IDS.forEach(function(id){ if(t[id]) n++; });
  return n;
}
async function digestOf(obj){
  try{
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(obj)));
    return Array.prototype.map.call(new Uint8Array(buf), function(b){ return b.toString(16).padStart(2, '0'); }).join('');
  }catch(e){ return 'unavailable'; }
}
function ensurePrintCSS(){
  if(document.getElementById('gradprintcss')) return;
  var s = document.createElement('style'); s.id = 'gradprintcss';
  s.textContent = '@media print{ body *{visibility:hidden!important} #gradcertcard, #gradcertcard *{visibility:visible!important} '
    + '#gradcertcard{position:fixed;left:0;top:20px;width:92%} }';
  document.head.appendChild(s);
}
var certName = '';
function renderCert(){
  var host = $('#gradcert'); if(!host) return;
  var n = doneCount(), total = LESSON_IDS.length;
  if(n === 0){ host.innerHTML = ''; return; }
  if(n < total){
    host.innerHTML = '<div class="chart"><p class="eyebrow" style="margin:0">Graduate &amp; professional certificate</p>'
      + '<p style="font-size:13px;color:var(--ink2);margin:6px 0 0"><b>' + n + ' of ' + total + '</b> graduate lessons '
      + 'passed. Finish every lesson in the Graduate &amp; professional certificate track above to unlock a dated '
      + 'certificate of completion.</p></div>';
    return;
  }
  if($('#gradcertout')) return; // already showing the generator/certificate — do not blow away a typed name or a generated card
  host.innerHTML = '<div class="chart"><p class="eyebrow" style="margin:0">Graduate &amp; professional certificate</p>'
    + '<h3 style="margin:4px 0 8px">All ' + total + ' graduate lessons passed</h3>'
    + '<p style="font-size:13px;color:var(--ink2);margin:0 0 10px">Enter the name to print on the certificate, then generate it. '
    + 'This is a self-issued completion certificate — see the note on the certificate itself for exactly what that does and does not mean.</p>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
    + '<input id="gradname" type="text" placeholder="Name for the certificate" value="' + esc(certName) + '" '
    + 'style="flex:1;min-width:220px;padding:7px 9px;border:1px solid var(--line);border-radius:6px;background:var(--panel2);color:var(--ink)">'
    + '<button class="btn" id="gradgen">Generate certificate</button></div>'
    + '<div id="gradcertout" style="margin-top:12px"></div></div>';
  var inp = $('#gradname'); if(inp) inp.addEventListener('input', function(e){ certName = e.target.value; });
  var btn = $('#gradgen'); if(btn) btn.addEventListener('click', generateCert);
}
async function generateCert(){
  var out = $('#gradcertout'); if(!out) return;
  var name = (certName || '').trim() || 'Locator.X learner';
  var now = new Date();
  var record = {issuer: 'Locator.X Academy (self-issued by this application)', name: name,
    track: 'Graduate & professional certificate', lessons: LESSON_IDS.length, completedAt: now.toISOString()};
  var digest = await digestOf(record);
  ensurePrintCSS();
  out.innerHTML = '<div id="gradcertcard" style="border:1px solid var(--line);border-radius:12px;padding:22px;background:var(--panel2);max-width:640px">'
    + '<p style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0">Locator.X Academy &middot; Certificate of completion</p>'
    + '<h2 style="margin:8px 0 2px;font-size:22px">' + esc(name) + '</h2>'
    + '<p style="margin:0 0 14px;font-size:14px;color:var(--ink2)">has completed the <b>Graduate &amp; Professional Certificate</b> track &mdash; '
    + LESSON_IDS.length + ' lessons on real-estate finance mathematics, urban economic theory, capital markets, land-use law and the '
    + 'climate-risk research literature.</p>'
    + '<p style="font-size:12px;color:var(--muted);margin:0">Issued ' + esc(now.toLocaleDateString()) + ' &middot; credential id ' + esc(digest.slice(0, 16)) + '</p>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:12px 0 0;line-height:1.6"><b>This is a Locator.X Academy completion certificate, self-issued by '
    + 'this application.</b> It is not an accredited degree, diploma, or professional certification, is not issued or endorsed by MIT, OpenStax, the Lincoln '
    + 'Institute of Land Policy, the Federal Housing Finance Agency, or any other institution named in this track’s further-reading citations, and does '
    + 'not substitute for one.</p>'
    + '<button class="btn" id="gradprint" style="margin-top:12px">Print / save as PDF</button></div>';
  var pb = $('#gradprint'); if(pb) pb.addEventListener('click', function(){ window.print(); });
}

var mounted = false, lastN = -1;
function tick(){
  var sec = document.getElementById('academy');
  if(sec && sec.classList.contains('active')){
    var n = doneCount();
    if(n !== lastN){ lastN = n; renderCert(); }
  }
}
function mount(){
  if(mounted) return; mounted = true;
  register();
  renderCert();
  setInterval(tick, 1500);
}
document.addEventListener('DOMContentLoaded', mount);
setTimeout(mount, 1000);

window.LXGrad = {register: register, render: renderCert, doneCount: doneCount, TRACK: TRACK};
})();
