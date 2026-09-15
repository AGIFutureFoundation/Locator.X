/* ===== Locator.X — Screening a market that cannot answer you ==============
   Track 20. The skill no vendor teaches, because teaching it means admitting
   the problem exists: how to underwrite where the public record does not
   publish what your screen is asking for.

   This is not an edge case. Measured across this platform's own coverage
   inventory, no market it covers can answer more than 7 of the Investment
   Standard's 15 requirements today, and two of Louisiana's are unanswerable
   permanently — the state does not reliably publish recorded sale prices in
   Orleans or East Baton Rouge. A screen that reports "N properties meet
   criteria" in such a market is either counting unanswerable requirements as
   passes or counting them as failures. The second rejects an entire metro for
   the sin of its state's recording practice.

   Every lesson lands on a decision this application actually made, and three of
   them land on an error it made first and corrected — a course about admitting
   what you do not know would be demonstrating the opposite if it cited only its
   successes.

   SOURCING RULE, identical to the other appender tracks: every lesson is
   ORIGINAL Locator.X writing. The topic arc is standard subject matter and is
   not ownable; the expression is, and none of it is copied, paraphrased at
   length, reskinned or adapted from any provider's syllabus, slides, video or
   text. No university, business school, publisher, software vendor or course
   provider has reviewed, endorsed, sponsored, or is affiliated with this track,
   and completing it confers no accredited qualification.

   Appends to window.LXTC.TRACKS only. */
(function(){
'use strict';
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s == null ? '' : s)); };
var TRACK_ID = 'nondisc';

var FURTHER = {
  iaao: 'International Association of Assessing Officers, free standards and technical publications — iaao.org/resources',
  openstax: 'OpenStax, Introductory Statistics (free, peer-reviewed textbook) — openstax.org/details/books/introductory-statistics-2e',
  lincoln: 'Lincoln Institute of Land Policy, courses and open publications — lincolninst.edu/courses/',
  census: 'US Census Bureau, methodology and margin-of-error documentation — census.gov/programs-surveys/acs/technical-documentation.html'
};
function reading(keys){
  return '<p class="src" style="margin-top:10px"><b>Further reading, freely accessible, not required and not reproduced here:</b><br>'
    + keys.map(function(k){ return esc(FURTHER[k]); }).join('<br>') + '</p>';
}
function builds(s){
  return '<p class="src" style="margin-top:10px"><b>Builds on, in this Academy:</b> ' + esc(s) + '</p>';
}

var TRACK = {
  id: TRACK_ID, name: 'Screening a market that cannot answer you', slot: 20,
  blurb: 'Six lessons on underwriting where the record is silent — the three-state discipline that keeps '
    + '"unknown" from becoming a pass or a fail, why an assessment is never a price, what a non-disclosure '
    + 'market actually withholds and what it does not, grading a deal by its weakest fact rather than its '
    + 'average, reading a comparable strictly enough to throw most of them away, and deciding when the number '
    + 'you wanted does not exist. Every lesson lands on a measurement this platform published, including three '
    + 'errors it made first. Original Locator.X writing; no institution or vendor has reviewed, endorsed or is '
    + 'affiliated with it, and it is not an accredited qualification.',
  modules: [

  {id: 'nd1', t: 'Unknown is an answer, and it is neither of the other two', body: `
   <p>Every screen you will ever build asks questions the record sometimes cannot answer. There are exactly three
   honest outcomes for each one: the record <b>supports</b> the requirement, the record <b>contradicts</b> it, or
   <b>the record does not say</b>. Almost every tool in this trade carries two of the three.</p>
   <p>Collapsing unknown into <b>fail</b> is the common choice, and it looks conservative. It is not. It silently
   rejects whole counties for the sin of a thin schema — a county that publishes no year built has not told
   you the building is old, and it has not told you the building is new. Screening it out is a decision about
   the county's data department, dressed as a decision about the property.</p>
   <p>Collapsing unknown into <b>pass</b> is worse, because it is invisible. A property scoring nine of ten on
   complete data and a property scoring nine of ten on two published fields appear identical on the screen, and
   the second one is not a finding at all.</p>
   <p><b>What this platform does with it.</b> The Investment Standard returns meets / fails / unknown per
   requirement, and the count of unknowns travels with the score rather than being folded into it. Measured in
   Orleans Parish: 6 of 15 requirements are answerable at all. A property there can score at best 6 of 15, and
   the screen says 6 of 15 — never 6 of 6.</p>`,
   drill: {q: 'A county publishes no bedroom count. Your buy box requires three bedrooms or more. What should the screen return for a property there?',
     opts: ['Fail — it cannot be shown to meet the criterion, so exclude it',
       'Pass — most properties of that size have three bedrooms',
       'Unknown, carried separately from the score, with the count of unknowns reported alongside — because the record has said nothing about this building and both other answers invent a fact',
       'Fail, but flag it for manual review later'],
     a: 2, why: 'Fail and pass both fabricate. Fail attributes a property fact to a data-department decision and quietly deletes a whole county from your pipeline; pass makes a thin record look like a strong one. The third state costs a column on screen and is the only one that leaves you able to say what you actually know.'},
   x: builds('Foundations F5 “Reading Locator.X: score, evidence grade, coverage”; Evidence & analysis on the coverage floor.')
      + reading(['iaao'])},

  {id: 'nd2', t: 'An assessment is not a price, and the distance is not small', body: `
   <p>An assessed value is an assessor's opinion, produced on a cycle, for taxation, under statutory rules that
   often cap how fast it may move. A price is what one party paid another on a date. They are different kinds of
   fact, and the gap between them is not noise — it is systematic, it varies by jurisdiction, and in some
   places it is set by law.</p>
   <p>The practical consequences compound. An assessment cannot age: there is no transaction date to measure
   staleness against. It cannot tell you about the negotiation, the concessions, the deferred maintenance the
   buyer priced in. Under a cap like California's, it can reflect a purchase from decades ago sitting next to an
   identical building reassessed last year, and the two figures are both correct and not comparable.</p>
   <p><b>An error this platform made, and corrected.</b> The strategy switchboard graded an after-repair value as
   a recorded fact whenever the comparables engine returned enough rows — including when that engine was
   working from <i>post-sale assessed values</i>, its documented fallback where a county publishes no dated sale.
   On a fixture with zero dated sales, a flip graded <b>A</b>. It was arithmetically defensible and it was a
   valuation built on opinions. The basis now travels with the figure: an ARV from recorded sales grades the
   column on a record, an ARV from assessments grades it as a model and says so in the basis line. The same
   property now reads <b>C</b>.</p>
   <p><b>The rule.</b> An assessment is admissible evidence about a property. It is never presented as a price,
   and anything computed from it inherits that limit rather than shedding it.</p>`,
   drill: {q: 'Your comparables engine returns twelve rows in a non-disclosure county, all carrying assessed values rather than sale prices. What is the honest use of that output?',
     opts: ['Treat the median as a market value — twelve is a healthy sample',
       'Use it as assessment evidence, labelled as such, and grade anything derived from it as modelled rather than recorded — the sample size does not convert an opinion into a transaction',
       'Discard it entirely; only sales matter',
       'Average it with a listing-price estimate to triangulate'],
     a: 1, why: 'Sample size fixes noise, not kind. Twelve opinions are a better-measured opinion, not a price. The output is genuinely useful — assessments are a real published record — provided everything downstream carries the label rather than laundering it into a valuation.'},
   x: builds('The numbers N1-N3; Comps and the Evidence tab; Case studies on the documented record.')
      + reading(['iaao', 'lincoln'])},

  {id: 'nd3', t: 'What a non-disclosure market withholds, and what it does not', body: `
   <p>"Non-disclosure" names a narrow thing: the consideration paid in a transfer is not reliably part of the
   public record. It does not mean the record is empty, and treating it that way forfeits most of what is there.</p>
   <p>Measured in Orleans Parish, of the Investment Standard's 15 requirements, <b>9 are unanswerable today</b>.
   The important structure is that they fail for two completely different reasons:</p>
   <p><b>Two are permanent.</b> Whether a price is a recorded sale, and whether that sale is recent, both need a
   published transaction. No session at any budget obtains one. That is a ceiling, and the right response is to
   say so on every screen rather than to keep the requirement and score it as failed.</p>
   <p><b>Seven turn on a single missing input.</b> Cash flow, cap rate, gross rent multiplier, debt service
   coverage, break-even occupancy, independence from rent growth, and the yield spread all fail for the same
   reason — there is no packed rent figure. That is not a ceiling, it is an unfinished pull. Confusing the
   two produces a market written off as hopeless when it is one feed away from answering seven more questions.</p>
   <p><b>The discipline this teaches.</b> When a market disappoints a screen, separate the permanent from the
   unfinished before concluding anything. The question is never "is this market thin" — it is "which of my
   questions can this record answer, which can it never answer, and which is it one document away from
   answering".</p>`,
   drill: {q: 'A market fails eleven of your fifteen screening requirements. What is the first analytical move?',
     opts: ['Drop the market — eleven failures is decisive',
       'Lower the thresholds until enough properties pass',
       'Separate the failures into permanent record limits and unfinished data work, because the two have completely different responses and only the first is a property of the market',
       'Weight the four passing requirements more heavily'],
     a: 2, why: 'Eleven failures is not a finding until you know their causes. A permanent limit is a fact about the jurisdiction you must live with and disclose; an unfinished pull is a task. Lowering thresholds answers a different question than the one you asked, and dropping the market may be discarding one that a single feed would open.'},
   x: builds('Markets m1-m3; the state coverage inventories; Foundations F5 on coverage.')
      + reading(['lincoln', 'census'])},

  {id: 'nd4', t: 'A deal is as sound as its weakest fact, not its average', body: `
   <p>Put five strategies for one building side by side — hold, flip, refinance-and-hold, owner-occupied,
   conversion — and the table implies the five figures are equally supported. They are not. A flip needs an
   after-repair value, which needs recorded comparable sales. A hold needs a rent. A conversion is modelled end to
   end. Alignment in a table is an argument, and it has to be earned.</p>
   <p>So grade each column by its <b>weakest</b> input rather than its average. A deal is exactly as trustworthy
   as the softest number in it, and averaging lets one recorded fact carry three assumptions.</p>
   <p><b>The second error this platform made.</b> The first version of that grading counted the financing terms
   among the inputs. Every strategy involves at least one number the user chooses — a down payment, a rehab
   preset, a holding period — so every column graded <b>D</b>, on every property, in every edition. A grade
   that cannot move is decoration, and decoration that looks like rigour is worse than no grade at all.</p>
   <p><b>The distinction that fixed it.</b> An input is either a <b>fact the deal depends on</b> — rent,
   after-repair value, acquisition value, an exit cap rate, none of which you may decide — or a <b>lever you
   pull</b>, which is a decision. Uncertainty is the wrong word for a choice. Levers stay visible and adjustable
   and are excluded from the grade. With them out, the grade discriminates: on the same building a flip backed by
   recorded sales grades A, the refinance case grades C because it also needs a modelled rent, and the conversion
   grades D.</p>`,
   drill: {q: 'Two strategies for one property come back with the same headline profit. One rests on recorded sales, the other on a modelled rent and a modelled exit cap rate. How should they be presented?',
     opts: ['Ranked by profit — the arithmetic is the arithmetic',
       'Only the better-evidenced one should be shown',
       'Side by side with their evidence grades, explicitly not ranked, because ordering them would make the weaker-evidenced figure read as a finding',
       'Averaged into a single blended expectation'],
     a: 2, why: 'Ranking is a claim that the two numbers are comparable, and they are not — one is a measurement and the other is a scenario. Hiding the weaker one throws away a real option. Showing both, graded, unranked, is the only presentation that does not smuggle confidence the record has not supplied.'},
   x: builds('The numbers N1-N5; Investment & development i3; Evidence & analysis on stating uncertainty.')
      + reading(['openstax'])},

  {id: 'nd5', t: 'A comparable is a recorded sale with a date, or it is not one', body: `
   <p>The word "comparable" does most of the damage in this trade, because it sounds like a similarity judgement
   and is actually an evidence standard. A comparable is <b>a recorded transaction with a date</b>. A listing is
   an asking price. An estimate is a model. An assessment is an opinion. None of the three becomes a comparable
   by being nearby and similar.</p>
   <p>Applied strictly, the standard throws most candidates away, and that is the point — a market that
   returns four comparables under a real standard has told you something true, where the same market returns
   forty under a loose one and tells you nothing.</p>
   <p><b>Three traps this platform measured in real county data.</b> The first is the <b>portfolio deed</b>: when
   an entire complex trades, many counties write the whole transaction price onto every parcel in it. One
   $48 million deed appears on many rows and, used unchecked, becomes hundreds of comparables each wrong by
   orders of magnitude. The second is the <b>denominator</b>: a per-unit price needs a trustworthy unit count, and
   several counties publish a complex-level count stamped on every row, or a band lower bound rather than a
   count. The third is <b>mixing bases</b>: a set that silently blends recorded sales with assessed values
   produces a median that means nothing, so the two are never pooled.</p>
   <p><b>When the answer is nothing.</b> Where a county publishes no dated sale price at all, the honest output
   is not a wider radius or an older window — it is the sentence explaining why the market cannot support a
   comparable-based valuation, and a screen that says so.</p>`,
   drill: {q: 'A county publishes sale prices, but one recorded deed covers 140 condominium units and its full consideration appears on every one of those parcel rows. What does that do to a naive comparables query?',
     opts: ['Nothing meaningful — the median absorbs it',
       'It inflates the sample with 140 copies of one transaction, each carrying the whole building’s price as though it were a unit price, which can move a median by orders of magnitude',
       'It slightly widens the spread',
       'It only matters if the building is unusual'],
     a: 1, why: 'The failure is not noise, it is replication of a single event dressed as independent evidence — and because every copy carries the building price rather than a unit price, the error is in kind as well as degree. Deduplication before ranking, and a plausibility band on any per-unit figure, are not refinements; without them the query is wrong.'},
   x: builds('Comps and the Evidence tab; Evidence & analysis e2 on keys and joins; Case studies.')
      + reading(['iaao', 'openstax'])},

  {id: 'nd6', t: 'Deciding when the number you wanted does not exist', body: `
   <p>Everything above is diagnosis. The practical question remains: you have a building in front of you, the
   record cannot answer a third of your screen, and a decision is still required.</p>
   <p><b>Substitute evidence, never substitute confidence.</b> Where the sale price is unavailable, the weight
   falls on what is published — assessments read as assessments, income evidence, permit activity showing
   what an owner has actually spent, insurance and tax lines that constrain the cost side. This is a different
   and weaker basis, and the correct response is to widen the margin you require, not to write the missing number
   down with more decimal places.</p>
   <p><b>Buy the document.</b> The public record is not the only record. A seller's own closing statement, a
   lender's appraisal, a title commitment and an estoppel are all obtainable in diligence, and in a non-disclosure
   market the contract's inspection period is where the valuation actually gets made. Screening narrows the field;
   it does not close the deal.</p>
   <p><b>Say what you could not check.</b> Every memo carries the list of questions the record could not answer.
   That list is not an apology — it is the most load-bearing paragraph in the document, because it tells the
   next reader precisely where this analysis would break. A memo without one is not more confident; it is less
   informative.</p>
   <p><b>The third error, and the general lesson.</b> A report in this project once described four missing data
   rows as "likely a documentation gap" and recommended them as cheap work. Checked against a second independent
   record, three of the four were real gaps needing a data session, and a fourth was already covered. The guess
   had the word "likely" in front of it and was published anyway. Where two records of the same fact exist, read
   both before recommending anything — and where only one exists, say so.</p>`,
   drill: {q: 'You must present a property in a non-disclosure market to an investment committee. What belongs in the memo that would not be needed in a disclosure state?',
     opts: ['A larger number of comparables to compensate',
       'An explicit list of which screening questions the public record could not answer, what evidence stood in for them, and the wider margin required as a result',
       'A confidence percentage attached to the valuation',
       'Nothing — the analysis process is the same everywhere'],
     a: 1, why: 'More comparables of the wrong kind is not compensation, and a confidence percentage invents precision the record did not supply. Naming the unanswered questions, the substitute evidence and the margin taken is what lets a committee price the uncertainty instead of inheriting it unlabelled.'},
   x: builds('Diligence & risk d1-d2; the contract anatomy guide; Foundations F6 on the path to a written offer.')
      + reading(['lincoln', 'iaao'])}

  ]
};

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
window.LXNonDisc = {register: register, TRACK: TRACK};
})();
