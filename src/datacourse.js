/* ===== Locator.X — Evidence, analysis & honest visualization ==============
   Track 16. The analytical layer this whole platform is built on, taught as
   curriculum: framing a question before querying it, relational keys and the
   duplicate that doubles a market, statistics on skewed price data, fitting
   and holding out, the PII and licence rules that govern what may ship, and
   drawing a number so it cannot mislead.

   Every lesson lands on a decision this application has actually made — and,
   where relevant, on an error it made first and corrected. That is deliberate:
   a course on analytical honesty that cited only its successes would be
   demonstrating the opposite of its subject.

   SOURCING RULE, identical to gradschool.js, mindset.js, devcourse.js and
   pmcourse.js: every lesson is ORIGINAL Locator.X writing. The topic arc is
   standard subject matter and is not ownable; the expression is, and none of
   it is copied, paraphrased at length, reskinned or adapted from any
   provider's syllabus, slides, video or text. No university, business school,
   publisher, software vendor or course provider — named or unnamed, including
   any whose public outline covers similar ground — has reviewed, endorsed,
   sponsored, or is affiliated with this track, and completing it confers no
   accredited qualification.

   Appends to window.LXTC.TRACKS only. */
(function(){
'use strict';
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s == null ? '' : s)); };
var TRACK_ID = 'evidence';

var FURTHER = {
  openstax: 'OpenStax, Introductory Statistics (free, peer-reviewed textbook) — openstax.org/details/books/introductory-statistics-2e',
  openstaxfin: 'OpenStax, Principles of Finance (free, peer-reviewed textbook) — openstax.org/details/books/principles-finance-2e',
  ocw433: 'MIT OpenCourseWare, 11.433J Real Estate Economics (Fall 2008) — ocw.mit.edu/courses/11-433j-real-estate-economics-fall-2008/',
  lincoln: 'Lincoln Institute of Land Policy, courses and open publications — lincolninst.edu/courses/'
};
function reading(keys){
  return '<p class="src" style="margin-top:10px"><b>Further reading, freely accessible, not required and not reproduced here:</b><br>'
    + keys.map(function(k){ return esc(FURTHER[k]); }).join('<br>') + '</p>';
}
function builds(s){
  return '<p class="src" style="margin-top:10px"><b>Builds on, in this Academy:</b> ' + esc(s) + '</p>';
}

var TRACK = {
  id: TRACK_ID, name: 'Evidence, analysis & honest visualization', slot: 16,
  blurb: 'Eight lessons on the analytical discipline this platform runs on — framing the question before '
    + 'querying, relational keys and the join that doubles a market, statistics on skewed price data, fitting '
    + 'and holding out, the PII and licensing rules that decide what may ship, drawing a number so it cannot '
    + 'mislead, and building so the same inputs produce the same answer twice. Every lesson lands on a decision '
    + 'this app actually made, including three modelling errors it made first and corrected. Original Locator.X '
    + 'writing; no institution or vendor has reviewed, endorsed or is affiliated with it, and it is not an '
    + 'accredited qualification.',
  modules: [

  {id: 'e1', t: 'The toolkit, and what each tool quietly assumes', body: `
   <p>Every analytical tool encodes assumptions, and the assumptions are invisible until they are wrong. A
   <b>spreadsheet</b> assumes the data fits in one rectangle and that a human will notice when a formula stops
   covering the last row — it is unmatched for thinking and structurally unsafe for anything that must be
   reproduced. A <b>relational database</b> assumes entities have stable, unique keys, which is exactly the
   assumption public parcel data violates. A <b>notebook</b> assumes you will run cells in order, and quietly
   permits a state that no fresh run could reproduce. A <b>dashboard</b> assumes the question is already known and
   only the numbers change.</p>
   <p>The practical rule: <b>match the tool to the failure you most need to avoid</b>. Exploring an unfamiliar
   dataset, you need to see everything and change direction fast. Shipping something a stranger will act on, you
   need reproducibility, and a spreadsheet cannot give it to you.</p>
   <p><b>The number of tools is not the skill.</b> Fluency in five tools with no framing discipline produces
   confident answers to unexamined questions faster. The scarce capability is knowing which question is being
   asked and what would make the answer wrong.</p>
   <p><b>What this app does with it.</b> Every edition is built by a script from source data, not assembled by
   hand — which is why a figure can be regenerated and checked. The registry figures in this platform's own
   documentation are described as <i>read off the built page</i> rather than typed from memory, because a number
   nobody can re-derive is a number nobody can defend.</p>`,
   drill: {q: 'You are preparing an analysis that a lender will act on and that must be re-runnable in six months. Which tool property matters most?',
     opts: ['Interactive charting, so the lender can explore',
       'Reproducibility — that the same inputs, re-run, produce the same outputs, with the transformation steps recorded rather than performed by hand; without it neither you nor anyone else can verify or defend the figure later',
       'The largest possible row capacity',
       'Familiarity — whichever tool you know best'],
     a: 1, why: 'Exploration and reproduction are different jobs with different failure modes. A hand-built analysis can be right and still be indefensible, because there is no way to demonstrate that the number came from the data rather than from a step someone forgot. When someone else acts on the figure, the audit trail is part of the deliverable.'},
   x: builds('Markets m3 “Reading these screens honestly”; Investment & development i8 on recording the decision.')
      + reading(['openstax'])},

  {id: 'e2', t: 'Framing the question before you touch the data', body: `
   <p>The most expensive analytical errors are not computational. They are answers to questions nobody needed,
   produced quickly and correctly. Framing is the step that prevents it, and it is three sentences long.</p>
   <p><b>What decision does this change?</b> If no answer changes any action, the analysis is entertainment. Write
   the decision first — buy, walk, re-price, re-check — and the analysis narrows immediately.</p>
   <p><b>What would change my mind?</b> Naming, in advance, the result that would falsify your expectation is the
   single most effective guard against finding what you set out to find. If nothing could change your mind, you
   are not analysing, you are assembling support.</p>
   <p><b>What would make this answer wrong?</b> Usually a data property rather than a formula: a missing
   population, a duplicate, a definition that shifted mid-series, a filter applied before rather than after an
   aggregation.</p>
   <p><b>The population question comes before every other one.</b> "The average price in this market" means
   nothing until you say which records are in the market. Sold or listed? Which period? Arm's-length only? A
   change of population moves an average far more than any modelling choice downstream, and it is the assumption
   least often stated.</p>
   <p><b>What this app does with it.</b> Coverage travels with every screen for this reason. A signal that scores
   15% of the current record set is reported as scoring 15% — the platform ships a coverage bar chart per signal
   precisely so a low denominator is visible rather than averaged away, and holds a coverage floor below which a
   modality is not allowed to speak.</p>`,
   drill: {q: 'Two analysts report different average prices for the same market from the same source file. What is the most likely explanation?',
     opts: ['One made an arithmetic error',
       'They used different software',
       'They defined the population differently — sold versus listed, a different period, arm’s-length filtering, or a property-type inclusion rule — which moves an average far more than any downstream modelling choice and is the assumption least often stated',
       'The source file changed between the two runs'],
     a: 2, why: 'Arithmetic errors are rare and tool differences are rarer still. Population definition is where the divergence almost always lives, and because it feels like a preliminary rather than a finding, it usually goes unrecorded — which is why stating the population is the first line of any honest analysis, not a footnote.'},
   x: builds('Markets m3 “Reading these screens honestly”; Investment & development i2 on what the record supports; the Scout tab’s per-signal coverage chart.')
      + reading(['openstax'])},

  {id: 'e3', t: 'Keys, joins, and the duplicate that doubles your market', body: `
   <p>Relational thinking is one idea with expensive consequences: data lives in tables, tables are connected by
   keys, and <b>a key that is not unique will silently multiply your rows</b>. In public property data, keys are
   not unique far more often than the documentation admits.</p>
   <p><b>Three real examples from this platform's own ingest.</b> In Bossier Parish, <code>OBJECTID</code> is a
   join row rather than a parcel — summing without de-duplicating counts some parcels several times. In Onondaga
   County, <code>PRINT_KEY</code> is unique only <i>within a municipality</i>, so a county-wide join on it merges
   unrelated parcels. In Guilford County, <code>PIN</code> repeats across lots in a subdivision. Each of these
   inflates a market count, and none announces itself: the totals simply come out larger, which is the direction
   nobody questions.</p>
   <p><b>Join types decide who survives.</b> An inner join silently drops every record without a match — which,
   when the right-hand table is an income-classification file covering part of a parish, quietly restricts your
   analysis to the classified subset while the row count still looks large. A left join keeps everything and makes
   the gap visible as nulls. Making the gap visible is almost always the correct choice.</p>
   <p><b>Verify counts across the join, every time.</b> Rows before, rows after, distinct keys on each side. If the
   count grew, the key was not unique. If it shrank, records were dropped and you should know exactly which.</p>
   <p><b>What this app does with it.</b> The Jefferson Parish integration was explicitly checked for identifier
   collisions against the Orleans parcel base before merging, and a partial Bossier pull was completed by
   paginating the remaining rows and verifying the recovered tail against the layer's own count — zero overlap,
   zero gap — rather than assuming the pull had finished.</p>`,
   drill: {q: 'After joining a parcel table to a classification table, your row count rises from 94,000 to 118,000. What has happened?',
     opts: ['The classification table added new parcels to the analysis',
       'The join key is not unique on at least one side, so single parcels matched multiple rows and were duplicated — any sum, average or count computed now overstates the market, and the fix is de-duplication on a genuinely unique key before aggregating',
       'The join succeeded normally; row growth is expected',
       'The parcel table contained hidden records that the join revealed'],
     a: 1, why: 'A join cannot create parcels. Growth means one row matched several, and every aggregate downstream is now inflated in a way that looks like a larger, healthier dataset. This is the direction of error nobody audits, which is why comparing row counts and distinct key counts on both sides of every join is a mechanical step rather than a judgment call.'},
   x: builds('Investment & development i2 on use-code coverage by parish; Diligence d1 “Read the building, then read the file”.')
      + reading(['openstax'])},

  {id: 'e4', t: 'Medians, skew, and the sample-size floor', body: `
   <p>Property prices are right-skewed: a floor near zero, no ceiling, and a long thin tail of exceptional
   assets. On that shape the <b>mean is pulled by the tail and the median is not</b> — which is why every
   headline figure in this platform is a median. A market whose mean price is $520,000 and whose median is
   $385,000 is not contradicting itself; it is telling you the tail is heavy, and the median is the number a
   typical transaction resembles.</p>
   <p><b>Dispersion matters as much as centre.</b> Two submarkets with identical medians and different spreads are
   different businesses: one is predictable, the other is a mix of two populations that should probably have been
   analysed separately. A histogram answers in one glance what a summary statistic cannot answer at all.</p>
   <p><b>The sample-size floor.</b> Below some count, a ZIP-level statistic is noise wearing a decimal point. The
   fix is not a better estimator; it is a floor, declared in advance, below which the platform declines to report
   rather than reporting quietly and precisely. A number with four significant figures and eleven observations
   behind it is a lie told in a confident font.</p>
   <p><b>Intervals, and the honest null.</b> A rate estimated from a sample carries an interval, and an interval
   that includes the no-effect value means the pattern <b>has not been shown to do anything</b> — however large the
   point estimate looks. This platform states that in exactly those words. A held-out Baton Rouge pattern reading
   <b>1.77× with an interval of 1.67–1.87 over 3,806 records</b> is a finding; a larger point estimate whose
   interval spans 1.00 is not.</p>
   <p><b>Correlation is not the finding people read it as.</b> Two series that move together may share a cause,
   may be coincidence across a short window, or may be the same thing measured twice. The dataset-correlations
   panel exists to make co-movement inspectable, not to license a causal sentence.</p>`,
   drill: {q: 'A screen reports a pattern with a hit-rate multiple of 2.4×, and a confidence interval of 0.87–4.10. How should it be reported?',
     opts: ['As a strong pattern — 2.4× is a large effect',
       'As a moderate pattern, discounted for uncertainty',
       'As not shown to do anything: the interval includes 1.00, the no-effect value, so the data are consistent with the pattern having no effect at all — the size of the point estimate does not change that, and reporting it as a finding would be presenting noise as signal',
       'As invalid data that should be excluded'],
     a: 2, why: 'A wide interval spanning the null means the sample cannot distinguish the effect from nothing. The point estimate is the centre of a range that includes "no effect", so leading with 2.4× communicates a confidence the data does not support. The honest report names the interval and says plainly that nothing has been demonstrated — which is different from saying the pattern is absent.'},
   x: builds('Reading the numbers r1 and r2; Investor mindset m4 “Overconfidence and the illusion of a clean number”; the Patterns and Dataset Correlations panels.')
      + reading(['openstax','ocw433'])},

  {id: 'e5', t: 'Fitting, holding out, and refusing to extrapolate', body: `
   <p>A model that explains the past perfectly has usually memorised it. The guard is <b>holding data out</b>:
   search for patterns on one deterministic half, measure them on the other, and report only what survives the
   crossing. Deterministic matters — a random split that changes each run lets you re-roll until something works,
   which is searching disguised as validating.</p>
   <p><b>Simple beats clever on short, noisy series.</b> This platform fits a one-parameter constant-growth trend
   by ordinary least squares over twelve months rather than a richer model, because on a series this short a more
   flexible model fits the noise and reports its own noise back as insight. The backtest is what justifies the
   choice, not the elegance of the method.</p>
   <p><b>Fitted trend, not last-twelve-months.</b> Taking the endpoint-to-endpoint change makes the answer a
   hostage to two months. A fitted line uses every observation and is far harder to move with one outlier.</p>
   <p><b>Extrapolation needs a cap, and here is why.</b> Compounding a short-window rate over years produces
   arithmetic that is technically correct and practically absurd. This platform's own uncapped extrapolation once
   turned a real +25.8% thirteen-month print into <b>3.15× over five years</b> — a number no market produces and
   no reviewer would have accepted if it had shipped. The cap is ±10% per year, and it exists because the error
   happened here.</p>
   <p><b>Two more errors, recorded rather than quietly fixed.</b> A backtest band was once oriented backwards, and
   a <i>level</i> error was once compounded as though it were a <i>growth rate</i>. Both are written up with the
   arithmetic. A track on analytical honesty that listed only successes would be teaching the opposite of its
   subject.</p>`,
   drill: {q: 'Why does this platform search for patterns on one deterministic half of the data and measure them on the other, rather than splitting randomly each run?',
     opts: ['Deterministic splitting is computationally faster',
       'Because a split that changes on each run lets you re-run until a pattern clears the threshold — that is searching disguised as validating, and it manufactures findings from noise; a fixed split means the measurement half is genuinely untouched by the search',
       'Random splits are statistically invalid',
       'Because deterministic splits produce larger samples'],
     a: 1, why: 'The purpose of a hold-out is that the measuring data played no part in choosing what to measure. A re-rollable split silently restores the contamination: each new draw is another chance for noise to clear the bar, and only the successful draw gets reported. Fixing the split removes that degree of freedom entirely.'},
   x: builds('Graduate g2 on the NPV/IRR mathematics; Investor mindset m4 on refusing false certainty; Markets m3; the Predictions, Outlook and Patterns modules.')
      + reading(['openstax','openstaxfin'])},

  {id: 'e6', t: 'PII, licences, and the things that must not ship', body: `
   <p>Analytical capability is bounded by rules that are not analytical. Two matter constantly in public property
   data.</p>
   <p><b>Personal information.</b> Many assessor and distress feeds carry owner names, and sometimes mailing
   addresses that are somebody's home. The rule this platform holds is a <b>mandatory drop on ingest</b> — the
   field is removed as the record is read, not filtered at display, because a field that exists in the payload
   will eventually be exposed by something. When federal REO data was integrated, what shipped was case number and
   property address only, with <b>zero owner PII</b>, and that constraint was recorded alongside the count.</p>
   <p><b>Licences are not a formality.</b> Open data is not the same as unrestricted data. Share-alike terms can
   attach obligations to a derived product; some agency datasets require a signed use agreement before ingest.
   Two such items sit open in this platform's own backlog rather than being quietly used first — an open-database
   licence review, and a data-use-agreement registration. Shipping first and reading the licence later is a
   business risk disguised as a technical shortcut.</p>
   <p><b>Aggregation is not automatically anonymisation.</b> A statistic over a small enough group can identify its
   members, which is why a small-count suppression rule belongs beside the sample-size floor rather than being
   treated as a separate concern.</p>
   <p><b>And the hardest one: correcting yourself in public.</b> A research module in this platform once claimed
   that counties expose free bulk notice-of-default data. They do not — no such free feed was found anywhere
   verified — and the module was rewritten to say so plainly rather than being softened or deleted. Of eleven
   covered jurisdictions, only three publish a genuine jurisdiction-specific distress feed.</p>`,
   drill: {q: 'A source feed contains owner names. Why drop the field at ingest rather than filter it at display?',
     opts: ['Display filtering is slower to compute',
       'Because a field present in the payload will eventually escape through some path — an export, a debug view, a search index, a future feature written by someone who did not know — whereas a field never ingested cannot leak; the display filter protects one surface, the ingest drop protects all of them',
       'Because assessors require it contractually',
       'There is no meaningful difference between the two approaches'],
     a: 1, why: 'A display filter is a promise that every current and future surface will remember to apply it. Dropping at ingest removes the data from the system entirely, so no later feature, export or index can expose what was never stored. It is the difference between a policy and a guarantee.'},
   x: builds('Diligence & risk d1; Investment & development i7 on unpriced unknowns; the Sources, Compliance and Federal REO modules.')
      + reading(['lincoln'])},

  {id: 'e7', t: 'Drawing a number so it cannot mislead', body: `
   <p>A chart is an argument made in geometry, and most chart errors are argumentative rather than aesthetic.</p>
   <p><b>One axis.</b> Two measures on two vertical scales in one frame is the most common serious chart error in
   business analysis: the apparent relationship between the lines is set by the scale choices, so the analyst can
   produce correlation or its absence at will without changing a single number. Two measures of different scale
   belong in two charts, in small multiples, or indexed to a common base.</p>
   <p><b>Colour does one job at a time.</b> Distinct categories take distinct hues in a fixed order that never
   changes when a filter changes the series count — colour follows the entity, never its rank, or a filter
   repaints the survivors and the reader learns nothing. Magnitude takes one hue, light to dark. Polarity takes
   two hues with a neutral middle. A rainbow ramp for magnitude invents boundaries the data does not have.</p>
   <p><b>Colour-blind safety is computed, not judged.</b> This platform's categorical palette was run through a
   validator and its measured perceptual separations recorded in the stylesheet next to the colours, because
   whether two hues are distinguishable under common colour-vision deficiencies is a measurement, not a matter of
   taste. Where two series must be separable, identity is carried by a legend and by direct labels as well as by
   hue — never by colour alone.</p>
   <p><b>Label what the chart reaches.</b> Every axis label should name a value the chart actually attains, digits
   should align in columns, and any number in running text should be formatted the way a person writes it. This
   application had a real bug of exactly that kind — twelve places rendering raw digit strings such as
   "182124 public records" instead of the comma-formatted numerals used correctly everywhere else. Small, visible,
   and corrosive to trust in every other number on the page.</p>
   <p><b>Density is a design problem with an honest answer.</b> Tens of thousands of overlapping points at metro
   zoom read as a solid carpet. The fix used here was zoom-interpolated opacity and stroke — every point still
   rendered, still clickable, nothing hidden — rather than sampling the data down and calling the picture the
   dataset.</p>`,
   drill: {q: 'Why is a dual-axis chart — two measures on two vertical scales in one frame — treated as a serious error rather than a stylistic choice?',
     opts: ['Because dual axes are harder to render correctly',
       'Because the apparent relationship between the two lines is determined by the arbitrary scale choices, so the same data can be made to show strong correlation or none at all without altering a single value — the chart asserts a relationship that the analyst, not the data, created',
       'Because readers dislike them',
       'Because colour-blind readers cannot distinguish the two lines'],
     a: 1, why: 'The crossings, gaps and apparent co-movement are artefacts of where each scale was set. That makes the visual claim unfalsifiable and unreproducible — two analysts can present opposite pictures from identical data, both technically accurate. Two charts, small multiples, or a common index preserve the comparison without manufacturing the relationship.'},
   x: builds('Markets m3 “Reading these screens honestly”; Investor mindset m4; the app’s validated categorical palette and the Scout coverage chart.')
      + reading(['openstax'])},

  {id: 'e8', t: 'Reproducibility: the build that produces the same answer twice', body: `
   <p>The last discipline is the one that makes the other seven durable. An analysis nobody can re-run is a claim,
   not a result — and six months later, when the number is questioned, the difference matters entirely.</p>
   <p><b>Automate the path, not just the arithmetic.</b> The value of a build script is not saved keystrokes; it is
   that the transformation from source to figure is <b>written down in executable form</b>. Every manual step is a
   step that will be performed differently next time, by someone who was not told about the exception.</p>
   <p><b>Determinism is a feature you must choose.</b> Fixed splits, sorted inputs, pinned versions, no reliance on
   dictionary ordering or wall-clock time. A pipeline that produces slightly different output on each run cannot be
   audited, because no discrepancy can be attributed.</p>
   <p><b>Verify the artefact, not the intention.</b> This platform's practice is to check the built page — record
   counts, file size against the ceiling, zero console errors across every edition — rather than to trust that the
   build did what the script says. The two diverge more often than anyone expects, and the divergence is the
   interesting part.</p>
   <p><b>Recompute, do not retype.</b> Figures quoted in documentation here are described as read off the built
   page for a reason: a number transcribed once becomes a number maintained forever by memory. When the underlying
   data changes, transcribed figures become quietly false while looking exactly as authoritative as they did when
   they were true.</p>
   <p><b>And the closing rule, which is the whole platform in a sentence.</b> Whatever could not be checked travels
   with the answer. The coverage percentage, the evidence grade, the count of tests that could not be run — none of
   those are caveats appended to a result. They are part of the result, and an analysis that drops them on the way
   to a summary has not simplified anything. It has removed the reader's ability to judge it.</p>`,
   drill: {q: 'A colleague reports a headline figure produced by a series of manual spreadsheet steps. The figure is correct. What is still wrong?',
     opts: ['Nothing — a correct figure is a correct figure',
       'The manual steps were probably slower than scripting them',
       'It cannot be reproduced or audited: no one — including its author six months later — can demonstrate that the number came from the data rather than from a step misremembered or skipped, so when it is questioned there is nothing to check, and when the source data updates the figure becomes silently stale',
       'Spreadsheets are inaccurate for large datasets'],
     a: 2, why: 'Correctness today and defensibility over time are different properties. An unreproducible figure has no way to be re-derived, no way to be corrected systematically when an input changes, and no way to distinguish a genuine result from a fortunate error — which is why the executable path from source to figure is part of the deliverable, not overhead attached to it.'},
   x: builds('Investment & development i8 “Making the decision, and writing down why”; Delivering the project p8 on the post-project review; Graduate g1 on sourcing standards.')
      + reading(['openstax','lincoln'])}
  ]
};
TRACK.modules.forEach(function(m){ if(m.x){ m.body = m.body + m.x; delete m.x; } });

function register(){
  if(!window.LXTC || !window.LXTC.TRACKS) return false;
  if(window.LXTC.TRACKS.some(function(t){ return t.id === TRACK_ID; })) return true;
  window.LXTC.TRACKS.push(TRACK);
  return true;
}
var mounted = false;
function mount(){ if(mounted) return; mounted = true; register(); }
document.addEventListener('DOMContentLoaded', mount);
setTimeout(mount, 1000);
window.LXEvidenceCourse = {register: register, TRACK: TRACK};
})();
