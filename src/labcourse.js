/* ===== Locator.X — The development lab ====================================
   Track 18. The capstone. One parcel, chosen by the learner in their own
   market, carried through all six gates with the arithmetic at each — and the
   platform computing alongside them at every step.

   This is curriculum item D7, and it is the most developer-specific thing in
   the fifty. Everything else in the Academy teaches a part; this assembles the
   parts against a real site the learner has to defend.

   The lab is deliberately NOT worked against a fixed example property. A worked
   example teaches you to follow arithmetic. A lab teaches you to produce it, on
   a site nobody has pre-screened, where the record may not answer the question
   you need answered. That difference is the whole point, and it is why every
   lesson ends with something to go and do rather than something to agree with.

   SOURCING RULE, as everywhere in this Academy: original Locator.X writing,
   nothing adapted from any third-party book, course, syllabus or programme, no
   institution or provider named or unnamed has reviewed, endorsed, sponsored or
   is affiliated with it, and completing it confers no accredited qualification.
   ========================================================================= */
(function(){
'use strict';
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s == null ? '' : s)); };

var TRACK_ID = 'lab';

function builds(s){
  return '<p class="src" style="margin-top:10px"><b>Builds on, in this Academy:</b> ' + esc(s) + '</p>';
}
function doit(s){
  return '<p class="src" style="margin-top:10px;border-left:3px solid var(--accent);padding-left:10px">'
    + '<b>On your own parcel:</b> ' + esc(s) + '</p>';
}

var TRACK = {
  id: TRACK_ID, name: 'The development lab — one parcel, six gates', slot: 18,
  blurb: 'The capstone. Choose a real parcel in your own market and carry it through every gate: site '
    + 'control, feasibility, entitlement, financing close, construction and stabilisation — with the '
    + 'arithmetic at each and this platform computing alongside you. Eight lessons, each ending in work '
    + 'to do on your site rather than a point to agree with. Original Locator.X writing; not an '
    + 'accredited qualification.',
  modules: [

  {id: 'x1', t: 'Choosing the site, and what site control actually buys', body: `
   <p>Pick a parcel now. Not a hypothetical, not a listing you like the photograph of — a real record in a
   market you can drive to, that this platform holds. Everything in this lab happens to that parcel, and the
   discomfort of working a site nobody pre-screened for you is the lesson.</p>
   <p><b>What makes a parcel worth a lab.</b> Not that it is a good deal — you do not know that yet, and half
   the value here is learning to kill it cheaply. What you want is a parcel where <i>something is unresolved</i>:
   a use that does not match the district, a building older than its neighbours, a lot larger than what stands
   on it, a price that looks wrong in either direction. A site with nothing unresolved has nothing to teach.</p>
   <p><b>Run LOCATOR on it before you get attached.</b> Seven gates, in order, from the underwriting sheet.
   Write down the verdict and — more useful — write down which gates returned <b>unknown</b>. Those are your
   diligence list, and they are the only part of the screen that tells you what to do next rather than what to
   think.</p>
   <p><b>Site control is buying time, not land.</b> An option or a contract with contingencies buys you the
   right to find out, for a fraction of the price of being wrong. The number that matters at this gate is not
   the purchase price; it is <b>how much you are risking to learn whether the purchase price is right</b>. If
   that number is large, you have not structured control, you have bought early.</p>
   <p><b>The three questions before you spend anything.</b> What would have to be true for this to work? What
   is the cheapest thing that would prove it false? And who else has to say yes? If you cannot answer the third
   one, you do not yet know what you are buying.</p>`,
   drill: {q: 'What makes a parcel a good candidate for this lab?',
     opts: ['A property that already pencils profitably on the current numbers',
       'The cheapest parcel available in the market',
       'One where something is unresolved — a use that does not match the district, a lot larger than what stands on it, a price that looks wrong — because a site with nothing unresolved has nothing to teach and no value to add',
       'A parcel with an existing entitlement in place'],
     a: 2, why: 'A deal that already pencils has had its thinking done by whoever priced it. The lab exists to build the judgment that finds and tests unresolved situations — which is also where the only edge you control, the value you can add, actually lives. Learning to kill such a site cheaply is worth as much as learning to buy one.'},
   x: builds('Investment & development i3 on the six gates; Delivering the project p2 on choosing the project; the LOCATOR screen on the underwriting sheet.')
      + doit('Choose the parcel. Run the LOCATOR screen on it and record the verdict and every gate that returned unknown. Write the three questions and answer the third one — who else has to say yes.')},

  {id: 'x2', t: 'Gate 2, forwards and backwards: what the land can be worth', body: `
   <p>Feasibility is one equation read in two directions, and the direction you read it in decides whether you
   are testing the deal or talking yourself into it.</p>
   <p><b>Forwards.</b> Value at completion, minus total development cost, minus the profit the risk requires,
   leaves what the land can be worth. Clean, and easy to flatter — every input is yours to choose.</p>
   <p><b>Backwards.</b> Start from the price you have actually been quoted. Now the equation produces a
   <i>requirement</i>: what the finished project must achieve to justify that number. A requirement can be
   checked against a market. A residual value cannot be checked against anything.</p>
   <p><b>Build the cost stack honestly.</b> Hard costs from the Rebuild panel's sourced anchors rather than from
   a per-foot number you remember. Soft costs — design, permits, legal, financing, insurance — which are the
   line first-time developers under-count by the widest margin. Carrying cost across a schedule you have not
   yet earned the right to believe. And contingency, which at this gate is not optional and not a percentage
   you like the sound of.</p>
   <p><b>The evidence ceiling applies here more than anywhere.</b> If your parcel's record is zoning-only, the
   platform caps its evidence grade at 55, and it is telling you something precise about your feasibility
   study: <b>you are working from a permission, not from a building.</b> A district that permits apartments is
   not evidence that apartments can be built, financed or filled on this lot. Note it in the study rather than
   letting it pass as fact.</p>`,
   drill: {q: 'Why is running the residual land value equation backwards — from a quoted land price — more honest than running it forwards?',
     opts: ['It produces a higher land value, which is more competitive',
       'It is arithmetically more accurate',
       'It produces a requirement the finished project must achieve, which can be checked against a real market — whereas a residual value computed forwards is an output of inputs you chose and can be checked against nothing',
       'It is the method lenders prefer'],
     a: 2, why: 'Both directions use the same equation; what differs is what you end up holding. Forwards you hold a number that agrees with your assumptions by construction. Backwards you hold a claim about the world — this must rent at X, or sell at Y — and the market can contradict a claim. Only the second one can fail the test.'},
   x: builds('Investment & development i6 on feasibility as a gate; Construction & the rebuild b1; the Rebuild panel’s sourced cost anchors; the Evidence tab’s ceilings.')
      + doit('Build the cost stack for your parcel and run the equation backwards from a real asking price. Write the requirement it produces as one sentence, then go and check that sentence against comparable rents or sales.')},

  {id: 'x3', t: 'The kill criteria you write before the model', body: `
   <p>Write down, now, what would make you walk. Before the spreadsheet exists. This lesson is short because
   the discipline is short, and almost nobody does it.</p>
   <p><b>Why the order matters.</b> Criteria set after the outputs are visible are not criteria; they are a
   justification with arithmetic attached. You will not notice yourself doing this. Everybody who has done it
   also did not notice — that is what makes writing them first the only defence.</p>
   <p><b>Four kill criteria that do real work.</b> An all-in cost per unit above which you walk. A required
   exit cap below today's market — because that is a rates bet wearing a development's clothing. An
   entitlement calendar longer than your capital can carry. And a coverage floor: if the finished building
   does not clear your DSCR at a stressed rate, it does not matter what it clears at today's.</p>
   <p><b>Two failures that look identical in a spreadsheet.</b> A project failing on <b>cost</b> is still
   actionable — value engineering, phasing, a different structural system, a renegotiated land price. A project
   failing on the <b>exit cap</b> requires the capital markets to move in your favour and there is nothing you
   can do to help. Both present as a thin margin. Only one is a development problem.</p>
   <p><b>The sensitivity question, in one line.</b> Which single input moves the outcome most, and do you
   control it? If the honest answer is the exit cap or the interest rate, your project's fate is not in your
   hands however well you build.</p>`,
   drill: {q: 'Your model shows the project clearing its hurdle only if the exit cap compresses 50 basis points. What kind of failure is that, and what follows?',
     opts: ['A cost failure — value engineering should be the next step',
       'A capital-markets bet rather than a development plan: cap-rate compression is a function of rates and investor appetite, which no amount of design or execution moves, so the correct response is to walk or to take the position knowingly rather than to optimise the build',
       'A financing failure — a different lender would solve it',
       'An acceptable assumption, since cap rates historically compress over long holds'],
     a: 1, why: 'It presents as a thin margin, exactly like a cost problem, and gets treated as one — which is why teams value-engineer a project whose problem was never the building. Nothing in your control moves the exit cap. Taking that bet deliberately is legitimate; taking it while believing you are developing is how the loss arrives as a surprise.'},
   x: builds('Investment & development i6; Delivering the project p7 on triggers decided while calm; Investor mindset m4 on refusing false certainty.')
      + doit('Write your four kill criteria in a file with today’s date, before you build the model. Then build the model.')},

  {id: 'x4', t: 'Gate 3: the calendar you do not control', body: `
   <p>Entitlement has the longest tail and the least control of any gate, and no amount of effort shortens a
   hearing calendar. What effort <i>can</i> do is reduce the number of hearings you need and the number of
   reasons to object at the ones you have.</p>
   <p><b>By right versus discretionary is the whole question.</b> A project that fits the district as written
   goes through staff review. A project needing a variance, a conditional use or a rezoning goes through
   politics. The cost difference is not the application fee; it is a year of carry and a probability of no.
   Establish which one you are in before anything else at this gate — and if you cannot tell from the record,
   that is a diligence item, not an assumption.</p>
   <p><b>Read the three limits separately.</b> Density, height and lot coverage are three different
   constraints, and exactly one of them binds your site. Developers routinely design against the wrong one and
   discover the real limit at review. Setbacks and parking are where a scheme that satisfied all three still
   fails to fit.</p>
   <p><b>Map the stakeholders before you need them.</b> Who is a gate and who is a bridge. Which neighbours
   have appeared at hearings before, and on which side. Which staff planner will actually read your
   application. This is the emotional-equity work arriving in its most concrete form: the deposits you made
   before you needed anything are the reason someone will take your call in advance of a hearing rather than
   after.</p>
   <p><b>Price the risk you do not hold.</b> Shreveport's two-year stall came from a city-owned drainage
   problem — a risk sitting with a party the developer could not direct and could not have found by studying
   the site harder. Name that class of risk at this gate, decide whether you can structure around it, and if
   you cannot, price the delay or do not proceed.</p>`,
   drill: {q: 'Why is establishing "by right versus discretionary" the first thing to settle at the entitlement gate?',
     opts: ['Because discretionary approvals cost more in application fees',
       'Because it determines whether you are in a staff review or in a political process — which differs by roughly a year of carrying cost and a real probability of refusal, and that difference changes whether the project is viable at all',
       'Because by-right projects do not require drawings',
       'Because lenders will not finance discretionary projects'],
     a: 1, why: 'The fee difference is trivial and the drawings are needed either way. What changes is the category of risk: staff review turns on whether you complied, and a discretionary process turns on whether enough people say yes. A year of carry plus a genuine chance of no is frequently the difference between a viable project and a dead one, so it belongs at the top of the gate rather than discovered inside it.'},
   x: builds('Zoning & entitlements z1 and z2; Delivering the project p1 and p5; Emotional equity q4 on gates and bridges; Investment & development i3 on Shreveport.')
      + doit('Determine whether your parcel’s scheme is by right or discretionary, and which of density, height or coverage actually binds it. If the record cannot tell you, write it on the diligence list rather than assuming.')},

  {id: 'x5', t: 'Gate 4: where every assumption meets someone paid to doubt it', body: `
   <p>Financing close is the gate where the numbers you have been carrying get examined by a party whose job is
   to find what is wrong with them. That is not an obstacle; it is the cheapest audit you will ever get, and
   the assumptions that do not survive it were going to fail later at a worse price.</p>
   <p><b>The lender's triangle decides the loan, not your model.</b> Loan-to-value, debt-service coverage and
   debt yield are tested together and the smallest answer wins. Which one binds moves with the rate
   environment: in a cheap-money market LTV binds and the conversation is about appraisal; when rates rise,
   coverage binds first and the loan shrinks even though your building did not change. Know which one is
   binding before you walk in, because it tells you which lever is worth arguing.</p>
   <p><b>Construction debt is a different animal.</b> It funds in draws against work in place, it carries
   interest reserve, and it converts — or does not — to permanent financing on terms set by a market you cannot
   see from here. The gap between construction and permanent is where developments die quietly, and the
   question to ask early is what happens if the take-out is not available on the day you need it.</p>
   <p><b>Terms reach backwards.</b> This is the gate that rewrites earlier ones. Shreveport's 99-year lease was
   approved for bank financing, not for the building — gate 4 reaching back and restructuring gate 1. Expect
   your capital stack to change your site control, your scheme, or both, and structure gate 1 loosely enough to
   survive it.</p>
   <p><b>What the credit memo says about you.</b> There is a paragraph in it about the sponsor that you never
   read, and it moves your rate, your recourse and your reserve. It was written from every previous interaction
   anyone at that institution had with you. This is the emotional-equity account being drawn on, at the exact
   moment it is most expensive to be short.</p>`,
   drill: {q: 'Rates rise sharply between your feasibility study and your financing application. Your building and its projected NOI are unchanged. What happens to the loan, and why?',
     opts: ['Nothing — the loan is sized on value, which has not changed yet',
       'The loan shrinks: the higher payment against unchanged NOI makes debt-service coverage the binding constraint before loan-to-value, so the coverage test caps the loan below what the value test would allow',
       'The lender increases the loan to compensate for higher carrying costs',
       'The loan is unchanged but the rate rises'],
     a: 1, why: 'All three tests are applied and the smallest result governs. A higher rate raises debt service while NOI stands still, so coverage binds first and sizes the loan down. The building did not change; the binding constraint did — which is why knowing which of the three is currently governing matters more than knowing any one of them in isolation.'},
   x: builds('Investment & development i5 on the lender’s triangle; Capital & structure c1 and c3; Emotional equity q2 on the credit memo you never read.')
      + doit('Size your project’s loan under all three tests and identify which one binds today. Then re-run it with rates 150bp higher and see whether the binding constraint changes.')},

  {id: 'x6', t: 'Gate 5: the schedule becomes a cost line', body: `
   <p>Until now the schedule was a plan. From the day you break ground it is money, spent per week whether or
   not anything happened that week.</p>
   <p><b>Carry is the cost nobody models properly.</b> Interest on drawn debt, property taxes, insurance,
   security, and your own time. A three-month delay on a project with meaningful carry can exceed the entire
   contingency, and it arrives without a change order to point at.</p>
   <p><b>Change orders are incomplete design, priced late.</b> Most originate not in scope creep but in
   drawings that were tendered at seventy per cent and bid as though complete. The contractor priced an
   assumption; the change order is that assumption being resolved after you lost your leverage. The
   countermeasure is upstream — pay for design completeness before tender, or tender in a way that prices the
   uncertainty explicitly.</p>
   <p><b>Contingency has an owner and a release schedule, or it is already spent.</b> Undesignated contingency
   is consumed early by ordinary overruns, each of which looks reasonable on its own, and the last third of the
   build finds it gone. Release it by phase, against criteria, and require every draw to name which risk-register
   line it answers.</p>
   <p><b>Value engineering is not cost cutting.</b> Under pressure the fifteen-second decision — remove the
   specification — beats the week-long one — re-engineer the assembly — every time, because it is faster and
   needs no fee. Six of those and you have a building that is under budget and does not lease. Every proposed
   saving gets three columns: dollars saved, function changed, and who bears it. A saving whose cost lands on
   the next buyer reappears in your exit cap.</p>`,
   drill: {q: 'A budget-pressured team removes a specified assembly and books the saving as value engineering. What has actually happened?',
     opts: ['Value engineering, correctly applied — the budget improved',
       'Cost cutting: the function was removed rather than delivered more cheaply, and the lost function returns later as weaker rent, higher operating cost or a wider exit cap — by which point it is attributed to the market rather than to the decision',
       'A change order the contractor absorbs',
       'A neutral substitution with no downstream effect'],
     a: 1, why: 'Value engineering keeps the function and changes the method; this kept the method and lost the function. The consequence is real but deferred and diffuse, which is exactly why the trade-off register has to record the function changed and the party who bears it at the moment the saving is booked, not at the moment the effect appears.'},
   x: builds('Delivering the project p4, p6 and p7; Construction & the rebuild b2 and b3; Leverage l3 “The reserve is the position”.')
      + doit('Write your contingency release schedule by phase, with the criteria for each draw, before the first one is requested.')},

  {id: 'x7', t: 'Gate 6: the rent roll you underwrote meets the one you got', body: `
   <p>Stabilisation is where every assumption becomes a fact, and the gap between the two is the most
   informative number the project will ever produce. It is also the number that is almost never computed,
   because by the time it is available the team is on the next deal.</p>
   <p><b>Lease-up is a schedule, not an event.</b> Absorption pace, concessions given to hit it, and the
   difference between the face rent you quote and the effective rent you receive once free months and tenant
   improvements are amortised. A project that hits its rents by giving three months free has not hit its
   rents.</p>
   <p><b>Operations start before you are ready.</b> The first ninety days set the tenancy for years — what gets
   fixed, what gets tolerated, and what the building's reputation becomes in its own submarket. Turnover is the
   only moment a unit tells you the truth about its condition and its real market rent.</p>
   <p><b>Close out properly, because nobody wants to.</b> Commissioning, certificates, warranties collected,
   as-builts filed, operating documentation written for someone who was not there. Skipped, it becomes an
   expensive archaeology project during the sale, and it is skipped almost every time.</p>
   <p><b>Compute the gap.</b> Underwritten NOI against actual NOI. Underwritten timeline against actual.
   Underwritten cost against actual. Three numbers, ten minutes, and they are the entire empirical content of
   the project. Write them down before you form an opinion about why.</p>`,
   drill: {q: 'A project hits its underwritten rents, but only by giving every new tenant three months free on a three-year lease. What has actually been achieved?',
     opts: ['The underwriting was accurate — the face rents were achieved as modelled',
       'A better outcome than modelled, since the concessions bought faster lease-up',
       'The rents were not achieved: three free months on thirty-six is roughly an eight per cent reduction in effective rent, so NOI is below underwriting and — because the exit is a multiple of NOI — the sale value is too',
       'It is neutral, because concessions are a one-time cost rather than a rent reduction'],
     a: 2, why: 'Face rent is what the lease says; effective rent is what you receive. Amortised across the term the concession is a permanent reduction for that tenancy, and it flows straight into NOI. Since the exit is priced as a multiple of NOI, an error that looks like a timing concession compounds into the sale price — which is why effective rent, not face rent, is the number that belongs in the model.'},
   x: builds('Operations & the rent roll o1 and o3; Investment & development i4 on face versus effective rent; Delivering the project p8 on close-out.')
      + doit('Compute the three gaps for your project — NOI, timeline, cost — as plain numbers, before writing a single sentence explaining them.')},

  {id: 'x8', t: 'The lab report: what you decided, and what you learned about yourself', body: `
   <p>The lab ends in a document, and the document is the point. Not because anyone will grade it, but because
   a decision you cannot reconstruct teaches you nothing, and this whole Academy is built on that one
   claim.</p>
   <p><b>The four parts.</b> The <b>thesis</b> in one sentence: what you believed that the seller did not, or
   what you could do that the last owner could not. The <b>three things that had to be true</b>, stated
   specifically enough that someone else could have checked them. The <b>kill criteria</b> you wrote at gate 2
   — unedited, including the ones you later talked yourself past. And the <b>pre-mortem</b> you wrote before
   committing, compared against what actually happened.</p>
   <p><b>Judge the decision, not the outcome.</b> A sound decision can produce a poor result and a reckless one
   can produce a windfall; over a small number of projects the noise dominates. The only question that
   compounds is whether the decision was right given what was knowable at the time — and that is answerable
   only because you wrote the reasoning down before you knew.</p>
   <p><b>Report the unknowns, not just the answers.</b> Which gates returned <b>unknown</b> on the LOCATOR
   screen at the start, and which of them you resolved, and which you proceeded on anyway. The last category is
   the honest one and the one people leave out. Whatever could not be checked travels with the answer — in a
   lab report as much as on a screen.</p>
   <p><b>And the part about you.</b> Where did you get impatient? Which gate did you rush because you had
   already decided? Whose call did you not return? The technical failures in development are recoverable and
   well documented. The behavioural ones repeat, quietly, across every project you will ever do — and a lab
   is the cheapest place you will ever get to find yours.</p>`,
   drill: {q: 'Why must the lab report compare the decision to what was knowable at the time, rather than comparing the outcome to the target?',
     opts: ['Because targets are usually set incorrectly at the outset',
       'Because outcomes are affected by factors outside the decision, so over a small number of projects a sound decision can produce a poor result and a reckless one a windfall — and judging by outcome alone teaches superstition rather than judgment',
       'Because outcome data is rarely available at stabilisation',
       'Because lenders require a decision audit'],
     a: 1, why: 'Decision quality and outcome quality are correlated but not identical, and across a handful of projects the noise dominates the signal. Without contemporaneous reasoning to check against, every review reconstructs the logic from the result and reliably concludes that whatever worked was wise — which is how a lucky call becomes a rule that fails on the next project.'},
   x: builds('Investment & development i8 on the decision memo; Delivering the project p8 on the post-project review; Evidence & analysis e8 on reproducibility; the Record Locker.')
      + doit('Write the lab report. Keep the kill criteria unedited, list the unknowns you proceeded on anyway, and answer the last paragraph honestly — that section is for you and nobody else.')}
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
window.LXLab = {register: register, TRACK: TRACK};
})();
