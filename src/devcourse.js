/* ===== Locator.X — Investment & development, applied ========================
   Track 14. A deeper, applied section covering the eight-topic arc that
   commercial real-estate investment-and-development courses conventionally
   teach — the investment logic, what drives value, the development system,
   property-level evaluation, leverage, feasibility, equity partners, and the
   decision itself — but built as a BLEND rather than a parallel course: every
   lesson names the Tradecraft lessons it stands on and deepens, and every
   lesson lands on something this application actually computes.

   SOURCING RULE, identical to gradschool.js and mindset.js: every lesson here
   is ORIGINAL Locator.X writing. The topic list is standard subject matter in
   this field and is not ownable; the expression is, and none of it has been
   copied, paraphrased at length, reskinned or adapted from any provider's
   syllabus, slides, videos or text. No university, business school, publisher
   or course provider — named or unnamed, including any whose public course
   outline covers similar ground — has reviewed, endorsed, sponsored, or is
   affiliated with this track. Completing it confers no accredited degree,
   diploma, licence or professional certification of any kind. Further reading
   points only at real, freely accessible material and reproduces none of it.

   Like gradschool.js and mindset.js, this file only APPENDS to
   window.LXTC.TRACKS (built by tradecraft.js, loaded earlier), so tradecraft's
   own rendering, drill scoring and localStorage progress ('lxtradecraft') pick
   it up for free with nothing else to wire. */
(function(){
'use strict';
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s == null ? '' : s)); };

var TRACK_ID = 'invdev';

var FURTHER = {
  ocw431: 'MIT OpenCourseWare, 11.431J Real Estate Finance and Investment (Fall 2006) — ocw.mit.edu/courses/11-431j-real-estate-finance-and-investment-fall-2006/',
  ocw433: 'MIT OpenCourseWare, 11.433J Real Estate Economics (Fall 2008) — ocw.mit.edu/courses/11-433j-real-estate-economics-fall-2008/',
  openstax: 'OpenStax, Principles of Finance (free, peer-reviewed textbook) — openstax.org/details/books/principles-finance-2e',
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
  id: TRACK_ID, name: 'Investment & development, applied', slot: 14,
  blurb: 'Eight applied lessons covering the arc a commercial real-estate investment-and-development course '
    + 'conventionally runs — why real estate at all, what drives value, the development system, property-level '
    + 'evaluation, leverage, feasibility, equity partners, and the decision — written as a deeper layer over the '
    + 'Tradecraft tracks rather than a substitute for them. Each lesson names the earlier lessons it stands on and '
    + 'ends on something this app computes. Original Locator.X writing throughout; the subject matter is standard '
    + 'in this field, the expression is ours, and no university, school, publisher or course provider has reviewed, '
    + 'endorsed or is affiliated with any of it. Finishing it is not an accredited qualification.',
  modules: [

  {id: 'i1', t: 'The logic of a real estate decision, and the four numbers that argue about it', body: `
   <p>Real estate earns a place in a portfolio for three structural reasons, and each one is also the reason it
   goes wrong. You can borrow several times your equity against an asset that produces its own debt service.
   You can depreciate a building against the income that same building generates. And the price is set by private
   negotiation rather than a public quote, so skill and information actually move the outcome. Leverage that
   magnifies a good year magnifies a bad one identically; depreciation is recaptured at exit; and a privately
   negotiated price means there is no market telling you when you have overpaid.</p>
   <p><b>Four return numbers, and what each one hides.</b> <i>Cash-on-cash</i> is honest about this year and silent
   about the exit. <i>Cap rate</i> is a market opinion about what the next buyer will pay, not a property fact.
   <i>IRR</i> is honest about timing and dishonest about scale: a 31% IRR on a nine-month flip and a 14% IRR on a
   seven-year hold are not the same business, and comparing them as if the first were better is the most common
   arithmetic error in this industry. <i>Equity multiple</i> is honest about scale and blind to time. Each of the
   four is a different projection of the same cash flows, and a deal that clears only one of them usually clears
   only that one for a structural reason worth finding.</p>
   <p><b>The cost of capital is the hurdle, not zero.</b> A weighted average cost of capital blends what the debt
   costs and what the equity requires, in the proportions actually used. A deal returning 9% against a blended cost
   of 11% is a deal that lost money while showing a positive return. Beating zero is not the test; beating the
   money you used is.</p>
   <p><b>Six risks, six different owners.</b> Market risk sits with the cycle. Credit and financing risk sits with
   the lender's appetite at your maturity, not at your close. Liquidity risk is the months it takes to sell.
   Entitlement risk sits with a municipality. Construction risk sits with a contractor and a schedule. Operating
   risk sits with you. Naming which party holds each one is more useful than a single "risk" adjective, because
   the ones you do not hold cannot be managed by working harder.</p>
   <p><b>What this app does with it.</b> The Outlook block inverts the whole question. Instead of asking what
   return a set of assumptions produces — where the assumptions do the work — the break-even solver asks what
   would have to be true for the deal to clear a 1.20 debt-service coverage, then sets that against what the ZIP
   has actually been doing. On one tested property that read <b>+19.6% annual rent growth required against +1.5%
   actual</b>. No forecast, no adjective: the size of the gap, in one line.</p>`,
   drill: {q: 'A sponsor pitches a 31% IRR on a nine-month hold as clearly better than a 14% IRR on a seven-year hold. What is wrong with the comparison?',
     opts: ['Nothing — a higher IRR is a better deal',
       'IRR is annualised, so it says nothing about how much money was made or whether the capital could actually be redeployed at that rate for the remaining years; scale and reinvestment are invisible to it',
       'IRR cannot be calculated on holds under a year',
       'The seven-year deal is automatically better because it holds longer'],
     a: 1, why: 'IRR normalises for time, which is exactly why it cannot be read as a ranking on its own. The nine-month figure assumes the capital keeps earning at that rate after it comes back, and it says nothing about the dollars produced — which is what the equity multiple is for. The two numbers answer different questions and neither ranks deals alone.'},
   x: builds('Foundations f1 “A building pays four different ways” and f3 “Income you work for, income the building works for”; Reading the numbers r3 “Cash-on-cash and DSCR”; Graduate g2 on the NPV/IRR mathematics and the multiple-root trap.')
      + reading(['ocw431','openstax'])},

  {id: 'i2', t: 'Property types and investor postures: what you are actually buying', body: `
   <p>The commercial classes are usually listed as though they were five flavours of the same thing. They are five
   different businesses, and the difference is lease length. <b>Multifamily</b> is many short leases: it reprices
   fast in both directions and pays for that privilege in turnover cost. <b>Office</b> is few long leases: it
   reprices slowly, which feels like safety until a rollover cliff arrives with three tenants on the same year.
   <b>Retail</b> looks like a lease business and is actually a credit business — your tenant's sales are your real
   security, whatever the guarantee says. <b>Industrial</b> is valued less by the box than by the dock doors, the
   clear height and the drive time to the road that matters. <b>Hospitality</b> is an operating company with a
   building attached; it reprices nightly and carries a management layer none of the others need.</p>
   <p>To those five this platform adds the class it works hardest: <b>conversion stock</b> — buildings whose
   current recorded use is not their best use. That class is not a property type on any assessor's roll. It is a
   judgment made against zoning, structure, campus proximity and price, which is precisely why it has to be
   derived rather than looked up, and why the derivation has to be visible.</p>
   <p><b>Four postures, defined by where the return comes from.</b> <i>Core</i> takes contracted income from a
   stabilised asset — the return is the rent roll. <i>Core-plus</i> adds mild improvement to that. <i>Value-add</i>
   earns its return by changing something operational or physical. <i>Opportunistic</i> earns it by creating
   something that did not exist, including entitlement. Each posture implies a different leverage level, a
   different hold and a different way to fail: core fails on the cycle, value-add fails on execution,
   opportunistic fails at a gate. The adjective on a pitch deck should match the posture in the model, and often
   does not.</p>
   <p><b>Why cross-asset historical return charts mislead.</b> A chart comparing decades of returns across classes
   is mostly comparing leverage and vintage. Two eras with different debt costs and different entry cap rates
   produce two different bets; the buildings are the least of it. Read those charts as a record of capital
   conditions, not as a ranking of asset quality.</p>
   <p><b>What this app does with it.</b> Posture can only be assigned where the record supports it. The Louisiana
   use-code map carries 40-plus codes for Jefferson Parish, so a duplex, a 24-unit building and a hotel are
   genuinely distinguishable there. Orleans publishes geometry and an identifier and no use code at all — so
   posture cannot be assigned from the record, and the app says <b>unknown</b> rather than guessing. That is not a
   defect in the analysis. It is a fact about the parish, and it belongs on the screen.</p>`,
   drill: {q: 'A parcel comes from a county that publishes geometry and a parcel ID but no recorded use. What posture should the platform assign it?',
     opts: ['Multifamily, since that is the most common class',
       'Value-add, since an unclassified property probably needs work',
       'None from the record — the honest output is unknown, and the evidence grade is capped accordingly',
       'Whatever the neighbouring parcels are classified as'],
     a: 2, why: 'A posture is a claim about what the asset is and what would earn the return. Neither can be derived from a coordinate. Inferring one from neighbours or from base rates would produce a confident-looking field with nothing behind it — which is the exact failure this platform grades for.'},
   x: builds('Reading the numbers r2 “Cap rate is a market opinion, not a property fact”; Markets m2 “Supply is the thing that kills the thesis”; the Evidence tab’s use-code coverage by parish.')
      + reading(['ocw433'])},

  {id: 'i3', t: 'The development system: every actor, and the six gates', body: `
   <p>A development is not a project with a manager. It is eight parties optimising eight different things at the
   same time: the <b>landowner</b> wants price and certainty; the <b>developer</b> wants the spread; the
   <b>equity</b> wants return per unit of risk and an exit; the <b>lender</b> wants to be repaid and is indifferent
   to your upside; the <b>designer and contractor</b> want a buildable scope and a paid schedule; the
   <b>municipality</b> wants tax base without political cost; the <b>community</b> wants the externalities managed;
   the <b>end user</b> wants space that works at a price they will pay. Only one of those parties carries every
   risk simultaneously, and it is the developer.</p>
   <p><b>The six gates.</b> Each is a real go/no-go with a real cost of being wrong.</p>
   <p>1. <b>Site control.</b> An option or a contract, not ownership — you are buying time to find out, and the
   price of that time is the only money that should be at risk this early.<br>
   2. <b>Feasibility.</b> The cheapest place to kill a project, and therefore the place where killing it is a
   success rather than a failure.<br>
   3. <b>Entitlement.</b> The longest tail and the least control. Nothing about working harder shortens a hearing
   calendar.<br>
   4. <b>Financing close.</b> Where every assumption you made is tested by someone paid to doubt it — and where
   terms reach backwards and rewrite decisions you thought were settled.<br>
   5. <b>Construction.</b> Where the schedule stops being a calendar and becomes a cost line.<br>
   6. <b>Stabilisation.</b> Where the rent roll you underwrote meets the rent roll you actually got.</p>
   <p>The governing rule: money spent before a gate is at risk of everything after it. The discipline is to spend
   the minimum that lets you decide, and to decide.</p>
   <p><b>Worked from the public record — Shreveport.</b> The Advocate mapped $4,646,122 of downtown parcels
   assembled between May 2024 and December 2025 — position taken before the state cooperative endeavour agreement
   closed on 12 January 2026. That is gate 1 executed well. Then two things this app records because the coverage
   does not: the two-year stall came from a <b>city-owned drainage problem</b> — a gate whose risk sat with a party
   the developer could not direct and could not have priced by studying the site harder — and the 99-year lease
   the council approved on 14 May 2026 was required for <b>bank financing, not for the building</b>, which is
   gate 4 reaching back and rewriting gate 1. As of June 2026 the project was under construction with nothing
   open.</p>`,
   drill: {q: 'The Shreveport project stalled two years on a city-owned drainage problem. What does that illustrate about the gate model?',
     opts: ['That site diligence was inadequate and better inspection would have found it',
       'That construction risk was mispriced by the contractor',
       'That some gate risk sits with a party the developer neither controls nor can price by studying the site — which is why naming the risk owner matters more than adjusting a contingency percentage',
       'That the entitlement gate should always be cleared before site control'],
     a: 2, why: 'The problem was not on the site and not in the developer’s scope; it was a municipal asset. No amount of additional site diligence surfaces it as a controllable risk. The useful move is identifying, at each gate, which party actually holds the risk — because the ones you do not hold cannot be managed by working harder, only by structuring around them or walking.'},
   x: builds('Construction & the rebuild b3 “The schedule is a cost line, not a calendar”; Zoning & entitlements z2 “By right, conditional, and the word that costs a year”; Case studies c3 “Assembling the position before the subsidy arrives”.')
      + reading(['lincoln'])},

  {id: 'i4', t: 'Reading the lease, then building the projection off it', body: `
   <p>A rent roll is a summary of documents you have not read. The lease is where the money actually lives, and
   six clauses decide most of it.</p>
   <p><b>Term and commencement</b> — when rent starts is not when the tenant took the space. <b>Escalations</b> —
   a fixed 2% in a 4% inflation environment is a lease that loses value every year it runs; CPI-linked shifts that
   risk back to the tenant; stepped rent front-loads or back-loads the yield depending on who wrote it.
   <b>Expense structure</b> — gross, modified gross or triple net decides who absorbs an insurance renewal, and a
   base-year gross lease quietly hands you every increase above that year, which is generous until the base year
   is a low outlier. <b>Tenant improvements and free rent</b> are capital, not concessions: amortise them across
   the term or you are underwriting a rent nobody is paying. <b>Renewal options</b> are free options written
   against you — the tenant exercises when the market is above the option rate and walks when it is below.
   <b>Co-tenancy and go-dark</b> clauses let a retail tenant reduce rent or leave because somebody else did.</p>
   <p><b>Face rent and effective rent.</b> A five-year lease at $30 per square foot with six months free and $50
   per square foot of tenant improvement is not a $30 lease. Spread the concessions across the term and the number
   you actually receive is materially lower. Brokers quote face; underwriters model effective; the gap between
   them is where optimistic projections come from.</p>
   <p><b>WALT and the rollover schedule.</b> Weighted average lease term tells you when the building has to
   re-lease itself. The question that follows is whether you will have capital available in that year — because
   rollover arrives with leasing commissions, downtime and a fresh round of tenant improvements at the same
   moment.</p>
   <p><b>The three lines people leave out.</b> Renewal commissions (cheaper than new leases, not free), downtime
   between tenants (months of zero on space you still pay to carry), and a capital reserve that is an actual
   schedule of components with lives rather than a percentage someone liked the look of.</p>
   <p><b>What this app does with it.</b> Unit counts from an assessor roll are unreliable in a specific,
   documented way: a class like "apartment building" rarely distinguishes a 5-unit from a 50-unit. The platform
   prefers square footage where both exist and <b>flags a derived unit count as derived</b> rather than presenting
   it as a fact. Any per-unit projection inherits that uncertainty whether or not the screen shows it — so the
   screen shows it.</p>`,
   drill: {q: 'A five-year lease is signed at $30/sqft face rent with six months free and $50/sqft of tenant improvement. Why is underwriting $30 wrong?',
     opts: ['It is not wrong — $30 is the contracted rent',
       'Because free rent and TI are capital costs spread across the term; the effective rent actually received is meaningfully below $30, and modelling face rent overstates both NOI and the exit value derived from it',
       'Because rent should always be underwritten at a 10% discount',
       'Because TI is a tenant expense, not a landlord expense'],
     a: 1, why: 'Six months of free rent on a sixty-month term is a tenth of the income given away, and the improvement allowance is landlord capital deployed to win the lease. Both belong amortised across the term. Underwriting face rent overstates NOI, and since the exit is a multiple of NOI, the error compounds into the sale price.'},
   x: builds('Operations & the rent roll o1 “The rent roll you inherit is not the rent roll you underwrote”, o2 “Leasing by the bed is a different business”, o3 “Turnover is the only time the building is honest with you”.')
      + reading(['ocw431'])},

  {id: 'i5', t: 'Leverage, and the exact point where it stops helping', body: `
   <p>Leverage is usually discussed as a dial between cautious and aggressive. It is not a dial; it is an
   inequality with a sign change. Borrowing adds to equity return only while the <b>unlevered yield on cost
   exceeds the all-in cost of debt</b>. Above that line every borrowed dollar lifts the equity return. Below it,
   every borrowed dollar subtracts — and the deal that looked conservative at 55% loan-to-value is destroying
   equity return at exactly the same rate a 75% deal would, just more slowly. The question is never how much
   leverage. It is which side of the line the yield sits on.</p>
   <p><b>The lender's triangle.</b> Three constraints size a loan — loan-to-value, debt-service coverage and debt
   yield — and only one of them binds at a time. In a low-rate market LTV usually binds, so the conversation is
   about appraisal. When rates rise, DSCR binds first: the building's income has not changed, but the payment has,
   so the loan shrinks. Debt yield — NOI divided by loan amount — ignores your interest rate and your amortisation
   entirely, which is precisely why lenders reach for it when they are nervous: it cannot be flattered by
   structuring.</p>
   <p><b>Refinance risk is the one that kills operating deals.</b> A property can cover its payment every month
   for five years and still fail, because at maturity the loan is sized against the rate environment of that day
   and the exit is priced by <b>the next buyer's debt</b>, not by your operations. This is the same mechanism as
   the exit-cap problem, arriving through the financing door instead of the sale.</p>
   <p><b>What this app does with it.</b> The break-even solver runs the inequality backwards. Rather than
   proposing a growth rate and reporting a coverage ratio, it bisects to the growth rate at which coverage lands
   exactly on 1.2000, and reports that against the ZIP's own fitted trend. When it returns <b>+19.6% required
   against +1.5% actual</b>, no judgment has been applied and no forecast made — the deal has simply been
   described in terms of the market it sits in.</p>`,
   drill: {q: 'Rates rise 150 basis points. A stabilised building’s NOI is unchanged and its appraised value has not yet moved. Why does the loan a lender will write get smaller?',
     opts: ['Because loan-to-value ratios are reduced whenever rates rise',
       'Because the debt-service payment rises against unchanged NOI, so debt-service coverage becomes the binding constraint before loan-to-value does',
       'Because the appraisal must be redone at the new rate',
       'It does not get smaller — the loan is sized on value, which has not changed'],
     a: 1, why: 'All three constraints are tested and the smallest loan wins. A higher rate raises the payment while NOI is flat, so the coverage test caps the loan below what the value test would allow. The building did not change; the binding constraint did — which is why knowing which of the three is binding matters more than knowing any one of them.'},
   x: builds('Leverage & the cost of money l1 “Leverage magnifies the outcome, not the quality”, l2 “What the loan actually costs, beyond the rate”, l3 “The reserve is the position”; Capital & structure c1 “Coverage is the only leverage test that matters”; Holding, tax & exit t2 “The exit is priced by the next buyer’s debt”.')
      + reading(['ocw431','openstax'])},

  {id: 'i6', t: 'Feasibility as a gate, not an opinion', body: `
   <p>The residual land value method is one equation read in two directions. Forwards: value at completion, minus
   total development cost, minus the profit the risk requires, leaves what the land can be worth. Backwards —
   from a land price you have actually been quoted — it tells you what the finished project must achieve to
   justify that price. The backwards direction is almost always the more honest one, because it produces a
   requirement you can check against a market rather than a number you can talk yourself into.</p>
   <p><b>The gate discipline.</b> Kill criteria are written <i>before</i> the model is run. A feasibility study
   whose thresholds are set after the outputs are on screen is not a test; it is a justification with a spreadsheet
   attached. Writing "we walk if all-in cost exceeds $X per unit, or if the required exit cap is below today's
   market" costs nothing before the model and is nearly impossible to hold to after it.</p>
   <p><b>Two failures that look identical in a spreadsheet.</b> A project that fails on <b>cost</b> is a project
   you can still act on — value engineering, phasing, a different structural system, a renegotiated land price. A
   project that fails on the <b>exit cap</b> is a project that requires the capital markets to move in your favour.
   Both show up as a thin margin. Only one of them is a development problem; the other is a bet on rates wearing a
   development's clothing.</p>
   <p><b>Sensitivity, in one line.</b> Which single input moves the outcome most, and do you have any control over
   it? If the answer is exit cap or interest rate, the project's fate is not in your hands regardless of how well
   you build.</p>
   <p><b>What this app does with it.</b> The evidence grade carries a hard ceiling for exactly this failure mode.
   A record selected by <b>zoning rather than recorded use caps at 55</b> — because a district permitting
   apartments is not evidence that a building stands there, and a feasibility study built on "the district
   permits it" is a study built on a permission. Lafayette Parish's 19,154 parcels are zoning-only for this
   reason and can never grade A on the public record, whatever else that record later gains. An unclassified
   record caps at 34.</p>`,
   drill: {q: 'A development pencils to an acceptable profit only if the exit capitalisation rate compresses 50 basis points from today’s market. How should that be characterised?',
     opts: ['A well-underwritten project with modest upside assumptions',
       'A cost problem that value engineering can solve',
       'A capital-markets bet rather than a development plan — the return depends on a variable the developer does not control and cannot execute against',
       'An entitlement risk'],
     a: 2, why: 'Cap-rate compression is a function of interest rates and investor appetite. No amount of design, procurement or execution moves it. A project that only works on that assumption is a rates position that happens to involve construction — worth taking knowingly, fatal to take by accident, and the distinction is the entire point of writing kill criteria before the model runs.'},
   x: builds('Construction & the rebuild b1 “What a number per square foot is really telling you”; Zoning & entitlements z1 “Density, height and coverage are three different limits”; Reading the numbers r2 “Cap rate is a market opinion”; the Evidence tab’s zoning-only and unclassified ceilings.')
      + reading(['lincoln','ocw433'])},

  {id: 'i7', t: 'Equity partners, and where the money actually ends up', body: `
   <p>A general partner raising equity is not selling access to a building. Limited partners can buy buildings.
   What is being sold is <b>execution</b> — the ability to run the six gates and survive the ones that go wrong.
   Priced correctly, the promote is payment for that. Priced badly, it is payment for showing up with a deal.</p>
   <p><b>The stack, in the order the money moves.</b> Return of capital first. Then a <b>preferred return</b> — a
   percentage on unreturned capital, and the first thing to check is whether it accrues and compounds or simply
   accrues, because over a long hold the difference is large. Then a <b>catch-up</b>, if the GP negotiated one, in
   which the GP takes a disproportionate share until the agreed split is restored on the whole distribution. Then
   the <b>promote</b>, in tiers: 80/20 to the first hurdle, 70/30 above it, sometimes a third tier above that. A
   <b>clawback</b> returns promote that later proves unearned — and a clawback with no security behind it is a
   promise, not a protection.</p>
   <p><b>The promote is priced in time as much as in dollars.</b> If the hurdle is an IRR, it is beaten by speed.
   That gives a GP a real incentive to sell earlier than a patient LP might want, and it is why sophisticated LPs
   ask for a multiple-based hurdle alongside the IRR one. Neither is wrong; they simply reward different
   behaviour, and the behaviour they reward is the behaviour you will get.</p>
   <p><b>Control is not a footnote to economics.</b> Major-decision rights, removal for cause, and the
   capital-call mechanism decide what happens when the plan does not. A partner who cannot call capital cannot
   defend their position; a partner who can be diluted heavily on a missed call has an economic interest that
   evaporates in exactly the scenario it was meant to survive.</p>
   <p><b>What this app does with it.</b> The Investment Standard's third status exists for this category of thing.
   A requirement the record cannot answer returns <b>unknown</b> — not pass, not fail — because a test you could
   not run is not a test you passed. A partnership term you have not read sits in the same category: it is not
   neutral, it is <i>unpriced</i>. Folding unknowns into "fine" is the single most expensive habit in private real
   estate.</p>`,
   drill: {q: 'An LP negotiates the preferred return up from 7% to 9% and, in exchange, gives up the right to remove the GP for cause. Sound trade?',
     opts: ['Yes — the preferred return is the economic core of the deal and 200 basis points is significant',
       'Yes, provided the promote tiers are unchanged',
       'No — a preferred return is only worth what it is actually paid, and the remedy when a GP stops performing is removal; trading the enforcement mechanism for a higher accrual buys a larger number on a document with less ability to collect it',
       'It makes no difference; pref and control are independent terms'],
     a: 2, why: 'Preferred return accrues whether or not it is paid. The scenario in which the higher pref matters most is precisely the scenario in which the GP is underperforming — and that is the scenario in which removal rights are the LP’s only real leverage. Improving the economics while surrendering the enforcement is a trade that pays off in good outcomes and fails in bad ones, which is backwards.'},
   x: builds('Capital & structure c2 “The seller is a lender you have not asked yet” and c3 “Other people’s money changes what you owe”; the Standard tab’s meets / fails / unknown model.')
      + reading(['ocw431'])},

  {id: 'i8', t: 'Making the decision, and writing down why', body: `
   <p>Everything up to this point produces inputs. This lesson is about the artefact that turns them into a
   decision you can be held to — and, more usefully, learn from.</p>
   <p><b>The decision memo, four parts.</b> The <b>thesis</b> in one sentence: what you believe that the seller
   does not, or what you can do that the last owner could not. The <b>three things that must be true</b> — not
   thirty; three, stated so specifically that each one could be checked by someone else. The <b>kill criteria</b>,
   written before diligence rather than after. And the <b>pre-mortem</b>: it is two years later and this failed —
   what happened? Written before close, that last paragraph is worth more than the rest of the memo combined,
   because it is the only part produced by a version of you that has not yet committed.</p>
   <p><b>Score the deal, then read the unknowns as data.</b> Against the Standard's fifteen requirements, consider
   two deals that both meet eleven. Deal A fails four. Deal B fails one and cannot answer three. Most tools present
   these identically, or quietly treat the unanswerable as passing. They are not the same deal. Deal A's four
   failures are known and priced — you can decide whether you accept them. Deal B's three unknowns are
   <i>unpriced risk that diligence could still resolve</i>, and the correct next action is to go resolve them,
   which is a completely different instruction from "accept or walk".</p>
   <p><b>Record it so the next one can be audited.</b> Not for compliance — because a decision you cannot
   reconstruct teaches you nothing. Two years on, the only way to know whether you were right for the right
   reasons is a memo written before the outcome was known. The Record Locker exists for this: the thesis, the
   criteria and the score as they stood on the day, not as memory reports them afterwards.</p>
   <p><b>And the closing honesty.</b> The count of tests that could not be run travels with the score, on every
   record, in every edition. That is the whole doctrine of this platform in one sentence, and it is deliberately
   the last thing this course says: a number is only worth what you know about where it came from.</p>`,
   drill: {q: 'Deal A meets 11 of 15 Standard requirements and fails 4. Deal B meets 11, fails 1, and returns unknown on 3. Both score 11. What is the practical difference?',
     opts: ['None — the scores are identical, so the deals are equivalent',
       'Deal B is better, because unknowns are more likely to resolve favourably than unfavourably',
       'Deal A is better, because at least its problems are visible',
       'They require different next actions: A’s four failures are known and can be accepted or rejected now, while B’s three unknowns are unpriced risk that further diligence could still resolve — so the correct response to B is to go and answer them, not to accept or walk'],
     a: 3, why: 'The score alone is not the decision. A failure is information you already have; an unknown is information you have not yet bought. Treating unknowns as passes understates risk, treating them as failures rejects deals over a gap in a county’s schema, and treating them as a work list is the only response that matches what they actually are.'},
   x: builds('Diligence & risk d1 “Read the building, then read the file” and d2 “Water, in all its forms”; Markets m3 “Reading these screens honestly”; Graduate g1 on sourcing standards; Investor mindset m4 on refusing to sound more certain than the backtest.')
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

window.LXInvDev = {register: register, TRACK: TRACK};
})();
