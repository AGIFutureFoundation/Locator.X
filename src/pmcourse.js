/* ===== Locator.X — Delivering the project =================================
   Track 15. The execution layer: choosing which project to run, finding and
   protecting its value, leading people you do not employ, and holding a risk
   register and a contingency through a build. Covers the arc that strategic
   project-management courses conventionally teach, translated into the one
   domain where it is hardest — a development, where the decisions are
   irreversible, the schedule is a cost line, and half the actors do not work
   for you.

   SOURCING RULE, identical to gradschool.js, mindset.js and devcourse.js:
   every lesson here is ORIGINAL Locator.X writing. The topic arc is standard
   subject matter and is not ownable; the expression is, and none of it is
   copied, paraphrased at length, reskinned or adapted from any provider's
   syllabus, slides, video or text. No university, business school, publisher
   or course provider — named or unnamed, including any whose public outline
   covers similar ground — has reviewed, endorsed, sponsored, or is affiliated
   with this track. Completing it confers no accredited degree, diploma,
   licence or professional certification.

   Appends to window.LXTC.TRACKS only. */
(function(){
'use strict';
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s == null ? '' : s)); };
var TRACK_ID = 'deliver';

var FURTHER = {
  lincoln: 'Lincoln Institute of Land Policy, courses and open publications — lincolninst.edu/courses/',
  ocw431: 'MIT OpenCourseWare, 11.431J Real Estate Finance and Investment (Fall 2006) — ocw.mit.edu/courses/11-431j-real-estate-finance-and-investment-fall-2006/',
  ocw493: 'MIT OpenCourseWare, 11.493 Legal Aspects of Property and Land Use (Fall 2005) — ocw.mit.edu/courses/11-493-legal-aspects-of-property-and-land-use-fall-2005/',
  openstax: 'OpenStax, Principles of Finance (free, peer-reviewed textbook) — openstax.org/details/books/principles-finance-2e'
};
function reading(keys){
  return '<p class="src" style="margin-top:10px"><b>Further reading, freely accessible, not required and not reproduced here:</b><br>'
    + keys.map(function(k){ return esc(FURTHER[k]); }).join('<br>') + '</p>';
}
function builds(s){
  return '<p class="src" style="margin-top:10px"><b>Builds on, in this Academy:</b> ' + esc(s) + '</p>';
}

var TRACK = {
  id: TRACK_ID, name: 'Delivering the project', slot: 15,
  blurb: 'Eight lessons on execution — selecting the right project, finding where its value actually sits, '
    + 'protecting that value under cost pressure, leading consultants and contractors who do not work for you, '
    + 'and running a risk register and a contingency through a build that cannot be undone. The strategic '
    + 'project-management arc, translated into development, where every decision is irreversible and the '
    + 'schedule is a cost line. Original Locator.X writing; no institution has reviewed, endorsed or is '
    + 'affiliated with it, and it is not an accredited qualification.',
  modules: [

  {id: 'p1', t: 'The developer as project manager, and why a building is the hard case', body: `
   <p>Most project-management doctrine was written for work that can be revised. Ship a feature, watch it fail,
   ship a better one. A development inverts every assumption in that loop. The decisions are <b>irreversible</b> —
   a foundation poured in the wrong place is not iterated on, it is demolished. The feedback is <b>slow</b> —
   whether the unit mix was right is answered at lease-up, two years after the mix was fixed. And roughly half the
   parties whose decisions determine the outcome — the municipality, the utility, the neighbours, the bank's
   credit committee — <b>do not work for you and cannot be assigned a task</b>.</p>
   <p>That changes what the job is. On revisable work the manager's edge is speed of iteration. Here it is
   <b>sequencing</b>: doing the cheap, reversible, information-producing things before the expensive, irreversible
   ones, and refusing to let an optimistic schedule reorder them. Every dollar of design spent before entitlement
   is a dollar bet on a hearing. Every week of construction started before financing closes is a week of
   negotiating from weakness.</p>
   <p><b>Three jobs, not one.</b> The developer is simultaneously the <i>investor</i> (is this worth doing),
   the <i>project manager</i> (can it be done on this budget and schedule) and the <i>orchestrator</i> (will these
   eight parties act in a compatible order). Most failures traced back honestly are orchestration failures wearing
   a cost-overrun costume: something arrived out of sequence, and everything downstream absorbed it.</p>
   <p><b>What this app does with it.</b> The six gates in the applied-development track are the sequencing
   discipline written down. The platform's job at each one is narrow and useful: tell you what the record supports
   <i>before</i> you spend the next tranche, so a kill decision at gate 2 costs a feasibility study rather than an
   entitlement campaign.</p>`,
   drill: {q: 'What most distinguishes development project management from managing revisable work such as a software release?',
     opts: ['Development projects are larger in dollar terms',
       'Development decisions are largely irreversible, feedback arrives years later, and many determining actors are outside the team entirely — so sequencing cheap reversible steps ahead of expensive irreversible ones replaces fast iteration as the core discipline',
       'Development has more stakeholders to inform',
       'Software projects have no schedule risk'],
     a: 1, why: 'Scale and stakeholder count are differences of degree. Irreversibility is a difference in kind: it removes the iterate-and-correct loop that most management practice assumes, and puts the weight on ordering decisions so that the information you need arrives before the money you cannot get back.'},
   x: builds('Investment & development i3 “The development system: every actor, and the six gates”; Construction & the rebuild b3 “The schedule is a cost line, not a calendar”.')
      + reading(['lincoln'])},

  {id: 'p2', t: 'Choosing the project: a buy box is a strategy, not a filter', body: `
   <p>The highest-leverage project decision is which project. Execution excellence on the wrong asset produces a
   well-run loss. Yet selection is usually treated as whatever came across the desk, filtered by whatever felt
   affordable.</p>
   <p><b>A buy box written properly is a strategy statement.</b> It says what you believe, in numbers: which
   markets, which price band, which unit counts, which condition, which hold. Each line should be traceable to an
   edge you actually have — a trade relationship that makes a rebuild cheaper, a lender who knows you, a submarket
   you can read faster than the next buyer. A buy box with no edge behind any line is a wish list, and it will let
   in exactly the deals your competitors also saw.</p>
   <p><b>Strategic fit beats standalone return.</b> A 14% deal that uses a capability you already have and leaves
   your team intact can beat an 18% deal that consumes the next eighteen months and teaches you nothing reusable.
   Portfolio logic — concentration, correlation between your holdings, and what you learn — belongs in the
   selection decision, not only in the annual review.</p>
   <p><b>The discipline of the written no.</b> Recording why a deal was rejected is worth as much as recording why
   one was taken, and almost nobody does it. Six months later the rejected file tells you whether your criteria
   are calibrated or merely strict.</p>
   <p><b>What this app does with it.</b> The Underwrite tab's buy box is the strategy made executable, and the
   max-offer solver turns it around: instead of asking whether a listed price works, it computes the price at
   which it would. The counter — <i>N of Y pass the buy box</i> — is a live audit of your own criteria. If that
   number is zero across a whole market, the criteria are the finding, not the market.</p>`,
   drill: {q: 'Your buy box returns zero matches across an entire metro for six months. What is the most useful reading?',
     opts: ['The market is overpriced and you should wait indefinitely',
       'Loosen the numbers until deals appear',
       'The result is information about the criteria as much as the market: either the edge behind those lines does not apply here, or a line is set by habit rather than by an advantage you actually hold — and that is worth diagnosing before either waiting or loosening',
       'Switch to a different asset class immediately'],
     a: 2, why: 'A zero return is a measurement of the fit between your stated strategy and a real market. Waiting assumes the criteria are right; loosening assumes they are wrong. Diagnosing which line is binding, and whether an actual edge stands behind it, is the step that tells you which of those two responses is correct.'},
   x: builds('Foundations f2 “What counts as an asset in this doctrine”; Markets m2 “Supply is the thing that kills the thesis”; Investment & development i2 on postures and i8 on the decision memo.')
      + reading(['ocw431'])},

  {id: 'p3', t: 'Where the value actually hides in a building', body: `
   <p>Value management starts by refusing the summary. "Add value" is not a plan; it is a category. The useful
   exercise decomposes a project into the specific things a future occupant or buyer <b>pays extra for</b>, and
   ranks them by cost to deliver.</p>
   <p><b>Four places value usually hides.</b> <i>Unused legal capacity</i> — density, height or a permitted use
   the current building does not exploit. <i>Mispriced physical condition</i> — a defect that reads as expensive
   and is cheap, which is the whole trade in one line; its mirror, a defect that reads cheap and is structural, is
   how people lose. <i>Operational slack</i> — below-market rents, uncollected recoveries, an expense line nobody
   has tendered in years. <i>Use conversion</i> — the building is fine and the use is wrong.</p>
   <p><b>Rank by value per dollar, then by value per week.</b> A $40,000 item that adds $200,000 to value outranks
   a $400,000 item that adds $600,000 on ratio — but if the second one is what unlocks the refinance, the ranking
   inverts. Both orderings should be written down, because they answer different constraints.</p>
   <p><b>What the occupant pays for is not what the developer is proud of.</b> The test is willingness to pay,
   evidenced by comparable rents or comparable sales, not by conviction. A finish nobody in the submarket pays a
   premium for is a cost, however good it looks.</p>
   <p><b>What this app does with it.</b> The development and conversion engine models eleven strategies against a
   given parcel, and the conversion class exists precisely for the fourth category above — buildings whose
   recorded use is not their best use. The below-market index is the first category made searchable at scale.</p>`,
   drill: {q: 'A renovation item costs $40,000 and adds an estimated $200,000 of value. Another costs $400,000 and adds $600,000. Which should be done first?',
     opts: ['The $40,000 item, always — it has the better ratio',
       'The $400,000 item, always — it adds more absolute value',
       'It depends on the binding constraint: on capital efficiency the first wins on ratio, but if the second is what lifts the appraisal enough to unlock a refinance, its absolute contribution is what matters — both orderings should be written down because they answer different questions',
       'Neither — both ratios are too low to justify the work'],
     a: 2, why: 'Ratio ordering is right when capital is the scarce thing. Absolute ordering is right when a threshold — a refinance, a coverage test, a sale price — has to be cleared. Ranking without first naming which constraint binds produces a confident answer to a question nobody asked.'},
   x: builds('Construction & the rebuild b1 “What a number per square foot is really telling you”; Zoning & entitlements z1 “Density, height and coverage are three different limits”; Operations o1 on the inherited rent roll.')
      + reading(['lincoln'])},

  {id: 'p4', t: 'Value engineering is not cost cutting, and confusing them is expensive', body: `
   <p>The two words get used interchangeably on site and they are opposites. <b>Cost cutting</b> removes scope and
   accepts the loss of value that follows. <b>Value engineering</b> finds a different way to deliver the same
   function for less — a changed structural system, a resequenced trade, a substituted assembly that performs
   identically. One reduces what the building does; the other reduces what it costs to do it.</p>
   <p>Under budget pressure, cost cutting is what actually happens, because it is faster and requires no design
   work. The tell is a decision made in a meeting rather than by a consultant: removing a specification is a
   fifteen-second decision, re-engineering an assembly takes a week and a fee. Six of those fifteen-second
   decisions produce a building that is under budget and does not lease.</p>
   <p><b>The trade-off register.</b> Every proposed saving gets three columns: the dollars saved, the function
   changed, and the party who bears it — the occupant, the operator, or the next buyer. A saving whose cost lands
   on the next buyer shows up in the exit cap, which is where value engineering that was actually cost cutting
   goes to be discovered.</p>
   <p><b>Life-cycle, not first cost.</b> A cheaper assembly with a shorter life and higher maintenance is a
   transfer from the capital budget to the operating budget. If you are holding, you have paid yourself with your
   own money. If you are selling, you have moved the cost to a buyer who will price it — and the sophisticated
   ones do.</p>
   <p><b>What this app does with it.</b> The rebuild panel holds sourced cost anchors so a proposed saving can be
   checked against a real range rather than against a feeling. And the doctrine throughout is that a number's
   provenance travels with it — a saving justified by an unsourced figure is not a saving, it is an assertion.</p>`,
   drill: {q: 'Under budget pressure a team removes a specified assembly and books the saving. What has actually happened, and why does it matter?',
     opts: ['Value engineering — the budget improved with no consequence',
       'Cost cutting: scope and function were removed rather than delivered more cheaply. It matters because the lost function reappears later as weaker rent, higher operating cost, or a wider exit cap — and by then it is attributed to the market rather than to the decision',
       'Nothing meaningful — specifications are advisory',
       'A change order, which the contractor absorbs'],
     a: 1, why: 'Value engineering keeps the function and changes the method; removing the assembly keeps the method and loses the function. The consequence is real but deferred and diffuse, which is exactly why the trade-off register has to name the function changed and the party who bears it at the moment the saving is booked.'},
   x: builds('Construction & the rebuild b1 and b2 “Occupancy change is the hidden cost”; Holding, tax & exit t2 “The exit is priced by the next buyer’s debt”; Investment & development i6 on feasibility gates.')
      + reading(['lincoln'])},

  {id: 'p5', t: 'Leading people who do not work for you', body: `
   <p>A developer's authority over the people who determine the outcome is mostly <b>contractual and reputational,
   not managerial</b>. You cannot performance-manage a plan checker, a utility scheduler, or a subcontractor whose
   best crew is on someone else's job. Influence, sequence and being the client people want to work for do the job
   that direct authority does elsewhere.</p>
   <p><b>Three levers that actually move outside parties.</b> <i>Predictability</i> — paying on time and deciding
   on time buys you the good crew, and it is the cheapest advantage in the business. <i>Clarity</i> — a decision
   log that says what was decided, when, and by whom eliminates the most common source of delay, which is not
   disagreement but ambiguity. <i>Reciprocity over the long run</i> — you will meet the same consultants,
   inspectors and trades on the next four projects, and they price you accordingly.</p>
   <p><b>The consultant relationship is a scope problem before it is a people problem.</b> Most disputes with a
   designer or engineer trace to a scope that was never written precisely, not to competence. Write what is
   included, what triggers additional fee, and who signs off — in advance, when goodwill is cheapest.</p>
   <p><b>Distributed teams and the loss of the corridor.</b> When the team is remote, the incidental
   information — the thing overheard, the drawing glanced at — stops flowing, and nobody notices until something
   lands late. The replacement is deliberate: a short standing cadence and a written decision log, which is slower
   than a corridor and more reliable than one.</p>
   <p><b>What this app does with it.</b> The record locker exists for the same reason a decision log does: a
   decision you cannot reconstruct cannot be defended or learned from. The pattern is identical whether the
   counterparty is a partner, a lender, or your future self.</p>`,
   drill: {q: 'A project keeps slipping at handoffs between consultants, though every party is competent and available. What is the most likely cause?',
     opts: ['Insufficient staffing on the developer’s side',
       'A pricing problem — the consultants are underpaid',
       'Ambiguity rather than disagreement: scope boundaries and decision ownership were never written down precisely, so each handoff waits on someone to establish who decides what — which a decision log and a written scope resolve directly',
       'The schedule was too aggressive from the start'],
     a: 2, why: 'When capability and availability are both present and the work still slips at the seams, the seams are the problem. Delay from ambiguity is invisible in any individual party’s status report — everyone is genuinely waiting on someone else — and it is fixed by writing down what is included and who signs off, not by adding people or money.'},
   x: builds('Diligence & risk d1 “Read the building, then read the file”; Investment & development i3 on the eight actors and i8 on recording the decision.')
      + reading(['ocw493'])},

  {id: 'p6', t: 'The org chart is a constraint on what you can build', body: `
   <p>Whether a developer is one person with consultants, a small team, or an institution with committees changes
   which projects are executable — not merely how comfortable they are. A structure that cannot make a decision in
   a week cannot pursue a deal that requires one.</p>
   <p><b>The small-developer trade.</b> One or two principals with a bench of consultants is fast, cheap and
   fragile: decisions happen in a phone call, and the entire institutional memory is two people's attention.
   Everything that requires sustained parallel effort — three projects at once, a long entitlement, a partner
   reporting pack — competes for the same scarce resource. The honest constraint is not capital; it is decision
   bandwidth.</p>
   <p><b>The institutional trade is the mirror.</b> Committees add scrutiny and lose speed, which prices them out
   of the deals where speed is the edge. Neither structure is better; each is suited to a different deal, and the
   error is pursuing deals your structure cannot execute while blaming execution.</p>
   <p><b>Match the deal to the structure, explicitly.</b> Before pursuing, ask what the deal will require: how many
   simultaneous decisions, over what period, needing whose sign-off. If the answer exceeds what the organisation
   can supply, the choice is to change the structure, partner for the missing capacity, or decline — and declining
   for that reason is a mature decision, not a failure of nerve.</p>
   <p><b>What this app does with it.</b> The three access tiers map to exactly this: an individual working one
   metro, a team running several packages side by side, and an institution that needs source-by-source provenance
   for diligence at scale. Those are three different decision structures, and they need three different amounts of
   the platform.</p>`,
   drill: {q: 'A two-principal firm consistently loses competitive deals that require a decision within days. What is the binding constraint?',
     opts: ['Capital — they cannot move quickly because they lack funds',
       'Decision bandwidth: the structure’s scarce resource is the principals’ attention, and a deal requiring several fast simultaneous decisions exceeds what two people can supply — the fix is changing the structure, partnering for capacity, or declining that deal type deliberately',
       'Market knowledge',
       'Broker relationships'],
     a: 1, why: 'A small structure’s advantage is speed on a single decision; its limit is the number of decisions it can hold at once. Diagnosing the constraint as capital or relationships leads to raising money or networking, neither of which adds decision capacity. Naming it correctly makes the three real options visible.'},
   x: builds('Capital & structure c3 “Other people’s money changes what you owe”; Investment & development i7 on control rights and i3 on the eight actors; the Program tab’s access tiers.')
      + reading(['openstax'])},

  {id: 'p7', t: 'The risk register, the change order, and the contingency you must not spend', body: `
   <p>A risk register is not a list of worries. Each line carries four things: what could happen, roughly how
   likely, what it costs if it does, and — the one usually missing — <b>who owns it and what the trigger is</b>.
   A risk with no owner is not managed, and a risk with no trigger is not monitored; it is simply remembered
   occasionally.</p>
   <p><b>Triggers convert anxiety into a plan.</b> "Interest rates might rise" is a worry. "If the ten-year
   exceeds X before financing close, we re-price the exit and re-test the coverage" is a trigger with an action
   attached. The value is that the action is decided while you are calm, which is the only time you decide well.</p>
   <p><b>Change orders are the visible edge of an invisible process.</b> Most originate not in scope creep but in
   incomplete design that was priced as complete. A contractor bidding drawings that are 70% done is bidding an
   assumption, and the change orders are that assumption being resolved at a price set after you lost your
   leverage. The countermeasure is upstream: pay for design completeness before you tender, or tender in a way
   that prices the uncertainty explicitly.</p>
   <p><b>Contingency has an owner and a release schedule, or it is already spent.</b> An undesignated contingency
   is consumed early on things that were never contingencies, and the last third of the build finds it gone. The
   discipline: contingency is released by phase against defined criteria, and drawing it requires naming which
   register line it answers.</p>
   <p><b>What this app does with it.</b> Two features are this lesson made mechanical. The reserve doctrine —
   the reserve is the position, not a comfort — is the same rule. And the Outlook break-even solver is a trigger
   generator: it produces the exact market movement that would break a deal, which is a far more usable risk line
   than "the market could turn."</p>`,
   drill: {q: 'Why is an undesignated contingency usually gone before the phase that most needs it?',
     opts: ['Because contingencies are always set too low',
       'Because contractors deliberately consume them',
       'Because with no owner, no release criteria and no requirement to name which risk-register line a draw answers, it gets consumed early on ordinary costs that were never contingencies — leaving nothing for the late, expensive surprises it existed for',
       'Because lenders require it to be spent first'],
     a: 2, why: 'The failure is procedural, not arithmetic. A contingency without release criteria behaves as general budget: every early overrun has a plausible claim on it, no single draw looks unreasonable, and the aggregate is invisible until it is exhausted. Tying draws to named register lines makes the aggregate visible while it can still be managed.'},
   x: builds('Leverage l3 “The reserve is the position”; Construction b2 and b3; Diligence d2 “Water, in all its forms”; Investment & development i5 on the break-even solver.')
      + reading(['ocw431'])},

  {id: 'p8', t: 'Closing out, and the review that pays for the next project', body: `
   <p>Two things end a development, and only one of them is on the schedule. The first is <b>completion</b> —
   commissioning, certificates, warranties collected, as-builts filed, the operating documentation that the
   property manager will need in year four when nobody remembers who installed what. Skipped, it becomes an
   expensive archaeology project during the sale.</p>
   <p>The second is <b>stabilisation</b>, where the rent roll you underwrote meets the one you got. The gap
   between them is the single most informative number the project produces, and it is routinely never computed —
   because by then the team is on the next deal and the original assumptions live in a spreadsheet nobody opens.</p>
   <p><b>The post-project review, in four questions.</b> What did we assume? What actually happened? Which
   differences were forecastable with information we had, and which were genuinely not? And what will we do
   differently — stated as a change to a criterion, not as a resolution to be more careful. Only the third question
   is hard, and it is the one that separates a lesson from a story.</p>
   <p><b>Judge the decision, not the outcome.</b> A good decision can produce a bad outcome and a reckless one can
   produce a windfall. Reviewing outcomes alone teaches superstition. The review that compounds asks whether the
   decision was right given what was knowable at the time — which is only answerable if the reasoning was written
   down before the outcome was known.</p>
   <p><b>What this app does with it.</b> This is why the decision memo is written before close and stored: the
   review has something to compare against that memory cannot supply. And it is why the count of tests that could
   not be run travels with every score — because at review time, "we did not know" and "we did not check" have to
   be distinguishable, and only a record kept at the time can distinguish them.</p>`,
   drill: {q: 'Why does a post-project review that only compares outcomes to targets teach less than one that examines the decision itself?',
     opts: ['Because targets are usually set incorrectly',
       'Because outcomes are affected by factors outside the decision, so a good decision can produce a poor outcome and vice versa — judging by outcome alone teaches superstition, and only reasoning recorded before the result was known lets you separate a sound call from a lucky one',
       'Because outcome data is generally unavailable',
       'Because reviews should focus on team performance rather than results'],
     a: 1, why: 'Outcome and decision quality are correlated but not identical, and over a small number of projects the noise dominates. Without contemporaneous reasoning to check against, every review reconstructs the logic from the result — which reliably produces the conclusion that whatever worked was wise.'},
   x: builds('Markets m3 “Reading these screens honestly”; Investment & development i8 “Making the decision, and writing down why”; Investor mindset m4 on refusing false certainty; the Record Locker.')
      + reading(['ocw431','lincoln'])}
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
window.LXDeliver = {register: register, TRACK: TRACK};
})();
