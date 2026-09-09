/* ===== Locator.X — Orientation & the wider picture ========================
   Track 19. The last seven curriculum items, and the seven that belong to no
   single stage of a deal: how the industry actually works, how you get from
   nothing to a written offer, how value is established, how to build a model
   that does not flatter you, which input actually decides, where the money
   comes from, and what is genuinely changing.

   The track walks the four levels in order — orientation, then practice, then
   the model, then the system — so finishing it is also a tour of the whole
   curriculum's arc. It completes the fifty: every curriculum item now has
   written lessons behind it.

   Curriculum items: A1, F6, A3, N6, N7, C7, M2.

   SOURCING RULE, as everywhere in this Academy: original Locator.X writing,
   nothing adapted from any third-party book, course, syllabus or programme, no
   institution or provider named or unnamed has reviewed, endorsed, sponsored or
   is affiliated with it, and completing it confers no accredited qualification.
   ========================================================================= */
(function(){
'use strict';
var esc = function(s){ return (window.LX ? window.LX.esc(s) : String(s == null ? '' : s)); };
var TRACK_ID = 'wider';

var FURTHER = {
  openstax: 'OpenStax, Principles of Finance (free, peer-reviewed textbook) — openstax.org/details/books/principles-finance-2e',
  ocw433: 'MIT OpenCourseWare, 11.433J Real Estate Economics (Fall 2008) — ocw.mit.edu/courses/11-433j-real-estate-economics-fall-2008/',
  lincoln: 'Lincoln Institute of Land Policy, courses and open publications — lincolninst.edu/courses/',
  fhfa: 'Contat, Hopkins, Mejia & Suandi, "When Climate Meets Real Estate: A Survey of the Literature," FHFA Working Paper 23-05 (2024) — fhfa.gov/document/wp2305.pdf'
};
function reading(keys){
  return '<p class="src" style="margin-top:10px"><b>Further reading, freely accessible, not required and not reproduced here:</b><br>'
    + keys.map(function(k){ return esc(FURTHER[k]); }).join('<br>') + '</p>';
}
function builds(s){
  return '<p class="src" style="margin-top:10px"><b>Builds on, in this Academy:</b> ' + esc(s) + '</p>';
}
function item(id, name){
  return '<p class="src" style="margin-top:10px"><b>Curriculum item:</b> ' + esc(id) + ' &mdash; ' + esc(name) + '</p>';
}

var TRACK = {
  id: TRACK_ID, name: 'Orientation & the wider picture', slot: 19,
  blurb: 'The seven lessons that belong to no single stage of a deal &mdash; how the industry works and who '
    + 'is paid by whom, the ninety-day path from curiosity to a written offer, how value is actually '
    + 'established, building a pro forma that cannot flatter you, finding the one input that decides, where '
    + 'the money behind your loan comes from, and what is genuinely changing. Walks the four levels in order. '
    + 'Completing it takes the curriculum to fifty of fifty written. Original Locator.X writing; not an '
    + 'accredited qualification.',
  modules: [

  {id: 'w1', t: 'How the industry actually works, and who is paid by whom', body: `
   <p>Almost every confusing thing a newcomer meets in this business resolves once you know how the person
   in front of them is compensated. Start there, and most behaviour stops looking mysterious.</p>
   <p><b>Owners</b> hold the asset and take the residual — everything left after everyone else is paid, which
   is why they carry the risk and why the upside is theirs. <b>Operators and property managers</b> are usually
   paid a percentage of collected income, so their incentive is occupancy and collection, not your capital
   value. <b>Brokers</b> are paid on closing, not on outcome: a broker who talks you out of a bad deal earns
   nothing for it, which tells you exactly how much weight to give unsolicited enthusiasm and exactly how
   valuable an honest broker is. <b>Lenders</b> are paid interest and are indifferent to your upside — they
   are structurally pessimistic, and that pessimism is free diligence. <b>Appraisers</b> are paid for an
   opinion and are legally exposed to it. <b>Contractors</b> are paid for scope: anything not in the scope is
   a change order, and that is not sharp practice, it is the contract working as written.</p>
   <p><b>Where a small operator actually has an advantage.</b> Not capital, and not information — the big
   institutions have more of both. It is <b>speed of decision</b>, willingness to do work that does not scale,
   and the ability to hold an asset that is too small to be worth an institution's attention. Every one of
   those is a structural advantage and none of them can be bought.</p>
   <p><b>Public and private, briefly.</b> Institutional capital reaches property through funds, REITs and
   separate accounts, each with its own fee structure and its own clock. The clock is what matters to you: a
   fund near the end of its life is a motivated seller for reasons that have nothing to do with the building.</p>
   <p><b>What this app does with it.</b> The Program tab's three tiers exist because these are three different
   decision structures, not three price points — an individual working one metro, a team running several
   packages, and an institution that needs source-by-source provenance for diligence at scale.</p>`,
   drill: {q: 'A broker is unusually enthusiastic about a listing. What does their compensation structure tell you about how to weight that?',
     opts: ['Enthusiasm signals a genuinely good deal, since their reputation depends on repeat business',
       'They are paid on closing rather than on your outcome, so enthusiasm carries no information about deal quality — a broker who talked you out of a bad purchase would earn nothing for it, which is exactly why an honest one is valuable and why the default weight on enthusiasm is zero',
       'It means the property is overpriced',
       'Broker incentives are aligned with buyers through agency duties'],
     a: 1, why: 'Agency duties are real and most brokers are honest, but the compensation structure means enthusiasm is uninformative either way — it is present on good deals and bad ones. The useful read is not cynicism but calibration: weight what they show you, not how they feel about it, and value disproportionately the broker who tells you something that costs them a commission.'},
   x: item('A1','Introduction to the real estate industry')
      + builds('Emotional equity q4 on mapping the eight actors; Delivering the project p6 on structure as a constraint; the Program tab’s tiers.')},

  {id: 'w2', t: 'From curiosity to a written offer: ninety days', body: `
   <p>The most common failure in this business is not a bad purchase. It is <b>never making an offer</b> —
   reading indefinitely, analysing indefinitely, and calling that diligence. This is a sequence that ends in a
   written offer, and the offer is the point whether or not it is accepted.</p>
   <p><b>Weeks 1&ndash;3: decide what you are, on paper.</b> Read the doctrine. Write your asset test in your
   own words. Choose <i>one</i> market you can drive to, and write a buy box where every line traces to an
   advantage you actually hold. A buy box with no edge behind any line is a wish list, and it will admit
   exactly the deals your competitors also saw.</p>
   <p><b>Weeks 4&ndash;7: underwrite twenty properties badly, then well.</b> Twenty is the number. The first
   five will be slow and wrong, the next ten will be fast and wrong in a consistent direction you can then
   correct, and the last five will be useful. Run the LOCATOR screen on every one of them and record which
   gates returned <b>unknown</b>. That list, accumulating across twenty properties, teaches you more about
   your market's public record than any amount of reading about it.</p>
   <p><b>Weeks 8&ndash;11: three relationships, deliberately.</b> One broker who works your box, one lender who
   will tell you what they would actually fund, and one inspector or contractor who will walk a building with
   you. Not networking &mdash; three specific people, each of whom you have given something to before you asked
   for anything. This is the emotional-equity account being opened rather than drawn on.</p>
   <p><b>Week 12: write the offer.</b> With the decision memo behind it: the thesis in one sentence, the three
   things that must be true, the kill criteria, and the pre-mortem. If the offer is rejected you have lost
   nothing and learned where your number sits against the market. If it is accepted you had already written
   down why.</p>
   <p><b>The honest warning.</b> Ninety days is enough to make a competent first offer. It is not enough to
   make you good, and anyone who tells you otherwise is selling something. What it is enough for is to stop
   being someone who reads about this.</p>`,
   drill: {q: 'Why does the ninety-day path insist on underwriting roughly twenty properties before making an offer, rather than waiting for a promising one?',
     opts: ['Because twenty is the number needed to find a genuinely good deal',
       'Because volume builds speed, and speed wins competitive deals',
       'Because the first several will be slow and wrong, the middle ones wrong in a consistent direction you can then detect and correct, and only the last few are useful — you cannot calibrate against a single property, and the accumulated list of gates your market leaves unanswered is itself the most valuable output',
       'Because most listings are overpriced, so a large sample is needed'],
     a: 2, why: 'A single underwriting cannot tell you whether your assumptions are biased, because you have nothing to compare them against. Twenty produces a pattern in your own errors — and the running record of which LOCATOR gates your market cannot answer is a map of that market’s public record that no amount of reading substitutes for.'},
   x: item('F6','From curiosity to first offer: the 90-day path')
      + builds('Foundations f2 on the asset test; Delivering the project p2 on the buy box; Emotional equity q5 on investing first; Investment & development i8 on the decision memo; the LOCATOR screen.')},

  {id: 'w3', t: 'Valuation: three approaches, and the conditions that break each one', body: `
   <p>There are three ways to establish what a property is worth, they routinely disagree, and the
   reconciliation is judgment rather than arithmetic. Knowing <i>which one is broken here</i> matters more
   than knowing all three.</p>
   <p><b>The income approach</b> capitalises stabilised net operating income. It is the right approach for
   anything that produces rent, and it inherits every weakness of the cap rate: it is a market opinion about
   what the next buyer will pay, so the income approach is only as good as the cap rate you can defend. It
   breaks when the income is not stabilised &mdash; a building mid-lease-up, or one whose rents are so far
   below market that today's NOI describes the last owner rather than the asset.</p>
   <p><b>The sales comparison approach</b> reads recent transactions of similar assets. It is the most
   intuitive and the most fragile: it needs enough genuinely comparable sales, recently, with disclosed
   prices. <b>In Orleans Parish and East Baton Rouge no deed-recorded sale date is published at all</b>, so a
   comparable-sales desk cannot function there &mdash; not "is harder", cannot function. In thin markets it
   fails quietly instead, by widening the definition of comparable until the answer is whatever you wanted.</p>
   <p><b>The cost approach</b> asks what it would cost to replace the improvements, less depreciation, plus
   land. It anchors the other two and it is the only one that works on a special-purpose building nobody sells.
   Its blind spot is that replacement cost has nothing to do with what anybody will pay: a building can cost
   $4m to replace and be worth $2m, and the cost approach will tell you $4m all the way down.</p>
   <p><b>Reconciling three answers.</b> Do not average them. Decide which approach the asset and the market
   actually support, weight that one, and write down why the others were discounted. A valuation without that
   sentence is a number without a method.</p>`,
   drill: {q: 'You are valuing a property in a parish that publishes no deed-recorded sale dates. What follows?',
     opts: ['Use the sales comparison approach with a wider radius to find enough comparables',
       'The sales comparison approach cannot function there — not merely harder, unavailable — so weight the income approach where the asset produces rent, anchor with cost, and state plainly in the valuation that comparables were unavailable rather than substituting looser ones',
       'Average all three approaches to compensate for the missing data',
       'Use the cost approach exclusively, since it needs no market data'],
     a: 1, why: 'Widening the radius does not recover the missing information; it manufactures comparables that are not comparable and produces a confident number with nothing behind it. The honest response is the one the platform applies to its own screens — name what could not be obtained, weight what can be defended, and let the gap travel with the answer instead of papering over it.'},
   x: item('A3','Property valuation: three approaches and when each fails')
      + builds('Reading the numbers r1 and r2; Evidence & analysis e2 on population and coverage; the Comps desk and why it cannot function in Orleans or EBR.')
      + reading(['ocw433'])},

  {id: 'w4', t: 'The pro forma that cannot flatter you', body: `
   <p>A pro forma is a set of assumptions wearing the costume of a result. Every one of them is yours to
   choose, which means the only useful discipline is making each choice <b>visible, sourced and
   challengeable</b> rather than making it conservative.</p>
   <p><b>One assumption per line, with its source beside it.</b> Not a rent number &mdash; a rent number and
   where it came from: three comparable units, this listing, the current lease, the platform's ZIP figure. An
   assumption whose source is "market" is an assumption with no source. This single habit does more for a
   model's honesty than any amount of sensitivity analysis performed afterwards.</p>
   <p><b>Growth rates are the softest thing in the document.</b> Rent growth, expense growth and appreciation
   compound across the hold, so a small optimism in each becomes a large one at the exit. Take them from a
   fitted series with a measured band where one exists; where none does, say so and use something you could
   defend to a hostile reader.</p>
   <p><b>The three lines people leave out</b>, every time: leasing commissions on renewals as well as new
   leases, downtime between tenants on space you still carry, and a capital reserve that is an actual schedule
   of components with lives rather than a percentage someone liked the look of.</p>
   <p><b>Build it so someone else can audit it.</b> Inputs separated from calculations, no hard-coded numbers
   buried inside formulas, and a single assumptions block a reader can attack without reverse-engineering the
   arithmetic. The test is not whether the model is right &mdash; you cannot know that yet. The test is whether
   a competent hostile reader could find where you are wrong in ten minutes. If they cannot, that is a defect
   and not a defence.</p>`,
   drill: {q: 'What is the practical test of whether a pro forma is honest?',
     opts: ['That its assumptions are conservative relative to market averages',
       'That its projected returns clear the required hurdle with margin',
       'That a competent hostile reader could find where you are wrong within about ten minutes — inputs separated from calculations, every assumption sourced on its own line, nothing hard-coded inside a formula; a model that resists that inspection is defective, not defended',
       'That it has been reviewed by a second person'],
     a: 2, why: 'Conservatism is not honesty — a conservative model with hidden assumptions is just as unauditable as an aggressive one, and a second reviewer cannot help if the structure conceals where the choices live. Honesty here is structural: the model exposes its own soft points, so being wrong becomes visible early rather than at exit.'},
   x: item('N6','The pro forma that does not lie to you')
      + builds('Reading the numbers r1; Evidence & analysis e1 and e8 on reproducibility; Investment & development i4 on effective rent; the Underwrite financing sheets.')
      + reading(['openstax'])},

  {id: 'w5', t: 'Sensitivity: finding the one input that decides', body: `
   <p>Every model has one input that matters far more than the rest, and it is very often not the one being
   argued about in the meeting. Sensitivity analysis is how you find it, and the whole exercise fits in two
   questions: <b>which input moves the outcome most, and do you control it?</b></p>
   <p><b>One-way, then two-way.</b> Move each assumption alone across a defensible range and record how far
   the outcome travels; that ranks them. Then take the top two and vary them together, because they often
   interact &mdash; exit cap and rent growth are not independent, and a table that treats them as independent
   understates the tail.</p>
   <p><b>The break-even table beats the point estimate.</b> Rather than "at 3% rent growth the IRR is 14%",
   ask "what rent growth does this need to clear my floor?" The second form is checkable against a market and
   the first is not. This platform's Outlook block does exactly that inversion: it bisects to the growth rate
   at which coverage lands on 1.20 and sets that against what the ZIP has actually been doing. When it returns
   <b>+19.6% required against +1.5% actual</b>, no forecast has been made &mdash; the deal has simply been
   described in terms of its market.</p>
   <p><b>Now sort the sensitive inputs into two piles.</b> Controllable &mdash; renovation scope, rent
   strategy, expense management, the price you pay. Not controllable &mdash; interest rates, the exit cap,
   the cycle. If the input that decides your outcome is in the second pile, you are not developing or
   operating; you are taking a position on rates that happens to involve a building. That can be a legitimate
   trade, but it should be a decision rather than a discovery.</p>
   <p><b>And the honest limit.</b> Sensitivity explores the model, not the world. It cannot price the risk you
   did not model at all &mdash; the drainage problem on the city's land, the tenant who was never coming. Those
   live in the risk register, not in the spreadsheet.</p>`,
   drill: {q: 'Sensitivity analysis shows the exit capitalisation rate is by far the most influential input on your returns. What does that finding actually tell you?',
     opts: ['That you should model the exit cap more precisely',
       'That the outcome is governed by something you do not control — rates and investor appetite — so this is a capital-markets position rather than an operating or development plan, and it should be taken knowingly or not at all',
       'That the hold period should be extended to average out cap-rate movement',
       'That the model contains an error, since operations should dominate'],
     a: 1, why: 'More precision on an uncontrollable input buys nothing — you cannot forecast it and you cannot influence it. The value of the finding is categorical: it tells you what kind of bet the deal actually is. Recognising that before closing turns an accidental rates position into a deliberate one, which is the difference between a considered risk and a surprise.'},
   x: item('N7','Sensitivity: which input actually decides')
      + builds('Investment & development i5 and i6; The development lab x3 on kill criteria; Evidence & analysis e5 on refusing to extrapolate; the Outlook break-even solver.')},

  {id: 'w6', t: 'Where the money behind your loan comes from', body: `
   <p>Your lender is frequently not the party that ends up holding your loan, and the machinery in between
   decides your terms, your flexibility and who answers the phone when something goes wrong.</p>
   <p><b>Pooling and tranching, plainly.</b> Many commercial mortgages are gathered into a pool, and claims on
   that pool's cash flows are sold in slices of different seniority. The senior slices are paid first and rated
   highest; the junior slices absorb losses first and are paid more for it. Nothing about this is exotic &mdash;
   it is a queue &mdash; but the consequence for a borrower is direct: <b>the loan is written to be sold</b>, so
   its terms are shaped by what the pool needs rather than by what suits your building.</p>
   <p><b>Which is why securitised loans are rigid.</b> A bank holding your loan on its own book can renegotiate,
   because it owns the decision. A securitised loan cannot be varied without affecting everyone in the queue,
   so the flexibility that felt available at closing is not there when you need it. Prepayment is where this
   bites hardest: defeasance and yield-maintenance provisions exist to protect the pool's expected cash flows,
   and they can make an early exit far more expensive than the headline rate ever suggested.</p>
   <p><b>The special servicer is a different counterparty.</b> While the loan performs you deal with a master
   servicer who is essentially an administrator. If it stops performing you are transferred to a special
   servicer whose duty runs to the bondholders and not to you, who is compensated differently, and who has no
   relationship with you at all. This is the one place in this business where emotional equity buys you very
   little, and knowing that in advance is the point.</p>
   <p><b>What to read from the market.</b> Issuance volume and spreads on new deals are a live signal about the
   cost and availability of the debt your <i>next</i> buyer will use &mdash; which is what actually prices your
   exit. That is the same mechanism as the exit cap, arriving through the financing door.</p>`,
   drill: {q: 'Why is a securitised loan materially less flexible than one a bank holds on its own book?',
     opts: ['Securitised loans carry higher interest rates, so lenders are less willing to negotiate',
       'Because the loan was written to be sold into a pool: varying its terms affects everyone holding a claim on that pool, so no single party owns the decision to renegotiate — the flexibility that seemed available at closing is structurally absent when you need it',
       'Because securitised loans are always non-recourse',
       'Because the original lender no longer exists after the sale'],
     a: 1, why: 'It is not pricing or malice — it is that the counterparty who could say yes has been replaced by a structure that has no mechanism for saying it. A bank holding its own paper can weigh a modification against its own interest. Once claims are distributed across a queue of investors, that authority is gone, which is why prepayment and modification terms must be read at closing rather than assumed to be negotiable later.'},
   x: item('C7','Securitisation: how a mortgage becomes a security')
      + builds('Graduate g4 on capital markets and why cap rates track the ten-year; Capital & structure c2 on what the loan really costs; Investment & development i5 on refinance risk.')
      + reading(['openstax'])},

  {id: 'w7', t: 'What is actually changing, and how to tell', body: `
   <p>Every era believes its disruption is unprecedented, and buildings outlive most of them. The useful skill
   is separating a change in <b>how space is used</b> — which is structural and slow — from a change in
   sentiment, which is loud and fast.</p>
   <p><b>Where demand has genuinely moved.</b> Distributed work changed office demand in a way that has not
   reverted, and it changed it unevenly: quality and location separated rather than the whole class declining,
   so an average office statistic now describes almost nothing. Logistics and last-mile distribution absorbed
   demand that used to sit in retail. Housing formation and affordability continue to drive residential
   demand independently of the cycle. Each of those is a change in use, and each shows up in leases before it
   shows up in prices.</p>
   <p><b>Climate is arriving through insurance, not through weather.</b> For most operators the cost is not a
   catastrophe; it is a premium that reprices annually, a deductible that changes, and eventually a market that
   will not quote at all. That flows straight into NOI and therefore into value, and it is doing so now in
   specific places rather than eventually everywhere. The research literature here is genuinely unsettled on
   magnitudes, and this platform's graduate track says so rather than picking a convenient number.</p>
   <p><b>Technology in underwriting: what helps and what flatters.</b> Better data helps &mdash; more records,
   faster, with provenance. Automated valuation flatters, because it produces a confident figure whose
   uncertainty is invisible. The distinction is not the sophistication of the method; it is whether the output
   carries its own coverage and its own error band. A model that cannot tell you what it does not know is not
   an advance over a spreadsheet, it is a spreadsheet that argues back.</p>
   <p><b>How to tell a change from a mood.</b> Three tests. Does it show up in signed leases, not sentiment
   surveys? Does it persist across a full cycle rather than a shock? And does it change what a tenant will pay
   for a given square foot, or only what an investor will pay for a given NOI? The last one is the sharpest:
   the first is a demand change and the second is a capital-markets change, and they mean entirely different
   things for what you should do next.</p>`,
   drill: {q: 'What is the sharpest test for distinguishing a structural change in real estate demand from a shift in investor sentiment?',
     opts: ['Whether it is widely reported in industry press over a sustained period',
       'Whether transaction volumes rise or fall',
       'Whether it changes what a tenant will pay for a given square foot, or only what an investor will pay for a given NOI — the first is a demand change and the second is a capital-markets change, and they call for entirely different responses',
       'Whether it persists for more than twenty-four months'],
     a: 2, why: 'Coverage and volume both respond to sentiment as readily as to substance, and duration alone cannot separate a slow mood from a fast structural shift. Tenant willingness to pay is the demand signal; investor willingness to pay for the same income stream is the pricing signal. Confusing them leads to repositioning a building when the building was never the problem.'},
   x: item('M2','Disruption in commercial real estate')
      + builds('Markets m1-m3; Graduate g6 on what the climate literature actually finds; Evidence & analysis e7 on numbers that cannot mislead.')
      + reading(['fhfa','lincoln'])}
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
window.LXWider = {register: register, TRACK: TRACK};
})();
