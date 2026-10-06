/* locator.x — Trade School: deep training tracks for the real-estate trade.
   Original curriculum written for locator.x. Licensing facts summarized from the
   California DRE (dre.ca.gov) as of Sept 2026 — always verify with the regulator. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const L=()=>window.LX;
let sampleFn;
async function getSample(){ if(sampleFn!==undefined) return sampleFn; try{ sampleFn=(window.claude&&window.claude.use)? await window.claude.use('sample'):null; }catch(e){ sampleFn=null; } return sampleFn; }
const store=k=>{ try{ return JSON.parse(localStorage.getItem('tschool')||'{}')[k]; }catch(e){ return undefined; } };
const save=(k,v)=>{ try{ const o=JSON.parse(localStorage.getItem('tschool')||'{}'); o[k]=v; localStorage.setItem('tschool',JSON.stringify(o)); }catch(e){} };
function pickHack(){ const X=L(); return X.allListings().find(l=>l.hh&&l.units>=2&&l.sqft)||X.allListings()[0]; }
function pickBig(){ const X=L(); return X.allListings().filter(l=>(l.units||1)>=4).sort((a,b)=>b.units-a.units)[0]||X.allListings()[0]; }

const TRACKS=[
{id:'playbooks', name:'Counterpart playbooks', who:'Everyone who touches the deal', c:'--cat4',
 blurb:'Deals are made by people. For every counterpart — banker, agent, broker, seller, manager, contractor, title, city — the emotional-intelligence read, the relationship-based leadership move, and the industry best practice, step by step.',
 modules:[
  {id:'p1', t:'Banks & lenders — the file does the talking', body:`
   <p><b>Emotional intelligence.</b> A lender is paid to say no and promoted for never being embarrassed by a loan. Their core emotion is fear of the exception. Lower it: bring order, not enthusiasm. Never make a lender feel they’d have to defend you in a credit committee.</p>
   <p><b>Relationship leadership.</b> Treat the banker as a long-term partner, not a vending machine: share your 12-month acquisition plan before you need money, close small facilities cleanly to build the track record, send the annual property P&L unasked. The relationship is built between loans, not during them.</p>
   <p><b>Best practice.</b> Arrive with the complete package: two years of returns, a current personal financial statement, the property’s rent roll and trailing-12, your underwriting sheet (this desk exports it as a PDF memo), and the exact ask — amount, term, LTV, rate expectation. Ask every lender the same three questions — max LTV for this asset class, current spread over index, seasoning rules for a cash-out — and shop three of them, every time. Local credit unions and community banks hold loans on their books and can flex where the megabank’s software cannot.</p>`,
   drill:{q:'Your DSCR comes in at 1.18 and the bank wants 1.20. The relationship-first move is:', opts:['Argue the appraisal was low and ask for a second appraiser','Ask what structure gets to 1.20 — bigger down, rate buydown, seasoned rents','Threaten to move your deposits to the bank across the street','Resubmit the same file unchanged to a different loan officer at the same bank'], a:1, why:'Asking for the structure invites the lender to co-author the fix, which keeps them your advocate in committee. The other moves make you the exception they fear.'}},
  {id:'p2', t:'Listing agents — make their job easy, win the tie', body:`
   <p><b>Emotional intelligence.</b> A listing agent juggles a seller’s anxiety and their own reputation. Their nightmare is a buyer who falls out of escrow. Every signal you send should whisper <i>certainty</i>: verified funds, short clean contingencies, a lender who answers the phone.</p>
   <p><b>Relationship leadership.</b> You are not one transaction; you are pipeline. Return calls in minutes, do what you said dated and in writing, and after closing, send the thank-you and the referral. Agents remember buyers who made them look good in front of their seller — those buyers see the pocket listings.</p>
   <p><b>Best practice.</b> Before offering, call and ask: "What matters most to your seller besides price — timing, rent-back, as-is certainty?" Then build the offer around their answer and say so in the cover note. When you lose, ask what won. Track every agent you meet in the Deals pipeline with a note on what they care about.</p>`,
   drill:{q:'Two comparable offers sit on the listing agent’s desk; yours is $10k lower. What most often wins the tie — or the deal?', opts:['A love letter about the property and how you’d raise your kids there','Certainty: proof of funds, tight contingencies, a reachable lender, seller-shaped terms','Waiving the inspection sight-unseen to show you’re serious','A higher commission offered to the listing agent’s side'], a:1, why:'Agents steer sellers toward the offer that will actually close. Certainty and seller-shaped terms beat a small price gap; blind waivers just mark you as reckless.'}},
  {id:'p3', t:'Buyer brokers — hire a partner, lead the team', body:`
   <p><b>Emotional intelligence.</b> A good buyer broker’s fear is wasting months on a client who never writes an offer. Show them you are decisive: a written buy box (this desk prints yours), proof of funds, and a promise — "show me anything matching this and I’ll answer same day."</p>
   <p><b>Relationship leadership.</b> Lead like a principal, not a boss: set the standard (buy box), delegate the search, review together weekly, and give credit publicly when a find closes. Pay for excellence — never grind the person who finds your deals on their fee.</p>
   <p><b>Best practice.</b> Interview three; ask each for the last five transactions in your asset class and one investor client reference. Sign the shortest exclusivity that respects their work. Feed them your Locator X shortlists — agent time is best spent on access and negotiation, not discovery.</p>`,
   drill:{q:'Your broker keeps sending listings outside your buy box. The leadership move is:', opts:['Ignore the emails until the good ones start coming','Fire them and sign with a broker who promises to listen the first time','Re-anchor: walk the written buy box together and show why the last three misses failed it','Widen your criteria so they feel useful and the next batch fits'], a:2, why:'Most drift is a standards problem, not an effort problem. Leaders re-anchor to the written standard — and agree on the filter — before replacing people.'}},
  {id:'p4', t:'Sellers — solve the problem behind the price', body:`
   <p><b>Emotional intelligence.</b> Nobody sells a building for fun. Behind every sale is a driver — estate settlement, partnership split, tax bill, exhaustion, a foreclosure clock (this app now surfaces several of those drivers as signals). Your first job is to hear it. Ask, then be quiet: "What would a perfect outcome look like for you?"</p>
   <p><b>Relationship leadership.</b> Long-hold owners sell to people they trust with their building’s story. Play the long game the estate signal implies: introduce yourself years early, be useful with no ask — a contractor referral, a rent comp — and be remembered when the moment comes.</p>
   <p><b>Best practice.</b> Price is one of five levers: certainty, speed, as-is condition, rent-back, and structure (a seller carry can beat a higher cash offer after taxes — run both in the desk and show the math). Present the chosen structure as solving THEIR stated problem, never as your win. If they’re in distress, help with dignity or walk away; reputation compounds faster than any single deal.</p>`,
   drill:{q:'An inherited fourplex; three heirs; one lives out of state and wants out now. Which lever probably matters most?', opts:['Top price, even if it takes months to get there','Speed and certainty of close, with an as-is purchase','A long escrow so the heirs can clear out the house','Seller financing so the heirs keep an income stream'], a:1, why:'Estates optimize for a clean, fast, certain division. As-is certainty at a fair price routinely beats a higher, slower, riskier offer.'}},
  {id:'p5', t:'Property managers — the operator who makes the numbers real', body:`
   <p><b>Emotional intelligence.</b> Managers live between angry tenants and absent owners; the good ones quit owners who are cheap on repairs and slow on decisions. Be the owner they keep: decide fast, fund maintenance, back their judgment in the gray zone.</p>
   <p><b>Relationship leadership.</b> Set the standard once — response times, turn budgets, when to call you — then delegate outcomes, not tasks. Review the numbers monthly, walk the property quarterly together, and praise specifically ("the 12-day turn on unit 3 held our vacancy under 4%").</p>
   <p><b>Best practice.</b> Before buying anywhere, get a manager’s rent opinion — it’s the cheapest diligence there is, and this app’s rent figures are index estimates meant to be replaced by exactly that. Contract on performance: management fee, leasing fee, maintenance markup, in writing. Below ~16 units self-management teaches you the trade; above it, your time is better spent finding the next building.</p>`,
   drill:{q:'Your manager proposes a $220/mo rent bump on turnover; the desk’s index says $150. Whose number do you use?', opts:['Overrule them — the index is data and the manager is only guessing','The manager’s $220, a live local read, then verify with what actually leases','Split the difference at $185 and move on','Change managers — they are overpricing your units'], a:1, why:'A working manager’s comp beats a ZIP index. The index screens markets; the manager prices units. Verify with what actually leases.'}},
  {id:'p6', t:'Contractors — scope, schedule, respect', body:`
   <p><b>Emotional intelligence.</b> Contractors are burned constantly by owners who change scope mid-job and pay late. The best ones pick their clients. Signal you’re the good kind: decided scope, written change orders, payment on the agreed schedule to the day.</p>
   <p><b>Relationship leadership.</b> Pay fair, pay fast, and give your best crews the next job without rebidding every time — a trusted-crew premium of a few percent buys schedule priority that saves you a month of carrying costs. Public credit and referrals cost nothing and are remembered.</p>
   <p><b>Best practice.</b> Three bids on identical written scope for anything over ~$10k; check license and insurance certificates yourself (CSLB in California); never front-load payments beyond mobilization; hold retention until punch-list complete; tie draws to milestones you can see. Your rehab presets here are planning numbers — the bid is the truth.</p>`,
   drill:{q:'Mid-rehab you decide to add a bathroom. The professional move is:', opts:['Tell the foreman verbally so the crew can start it the same day','A signed change order — scope, price, schedule — before the work starts','Add it to the punch list at the end of the job','Negotiate it into the original price as a goodwill item'], a:1, why:'Verbal scope changes are where budgets, schedules and relationships die. Everything after the handshake is written.'}},
  {id:'p7', t:'Title, escrow & attorneys — the quiet professionals', body:`
   <p><b>Emotional intelligence.</b> Escrow officers manage forty files at once; the squeaky-clean file closes first. Attorneys bill to prevent disasters you can’t see. Neither is impressed by urgency theater — both respond to organized respect.</p>
   <p><b>Relationship leadership.</b> Use the same title/escrow team repeatedly and they’ll flag problems early, rush your recordings, and answer Saturday calls. Bring your attorney the deal BEFORE the LOI on anything creative (seller carry, entity purchase, tenancy-in-common) — an hour of review beats a lawsuit.</p>
   <p><b>Best practice.</b> Read the preliminary title report yourself, every line — liens, easements, unpermitted history (the desk’s checklist has it); ask the escrow officer "what’s still open?" every Friday; wire only on verified instructions confirmed by phone at a number you looked up independently. Wire fraud is the industry’s live epidemic, and it is unrecoverable.</p>`,
   drill:{q:'Day before closing, an email from "escrow" changes the wire instructions. You:', opts:['Wire to the new instructions — deadlines matter and the email came from escrow','Call escrow at the number on THEIR site, not the email, and verify by voice first','Reply to the email asking them to confirm the new account','Send a test wire of $100 and wait for escrow to confirm receipt'], a:1, why:'Changed-instruction emails are the signature of wire fraud. Independent phone verification at a number you looked up yourself is the industry-standard control; a reply just talks to the attacker.'}},
  {id:'p8', t:'City hall & permits — the counterpart everyone forgets', body:`
   <p><b>Emotional intelligence.</b> Planners and inspectors are professionals enforcing rules they didn’t write, dealing daily with people who treat them as obstacles. Approach as a colleague: learn the code sections yourself, ask "what would make this approvable?", and never make an inspector defend a shortcut.</p>
   <p><b>Relationship leadership.</b> Be the applicant whose plans are complete and whose corrections come back in days. Over a portfolio, the reputation compounds into faster counters, benefit-of-the-doubt calls, and early word on program changes (ADU amnesty, conversion incentives — the kind of programs this app’s conversion lab models).</p>
   <p><b>Best practice.</b> Book a pre-application meeting before buying any conversion play — cities will tell you for free what they’ll approve; verify the certificate of occupancy and permit history against what’s physically there (unpermitted units are bought at land value, not income value); and calendar every deadline the city gives you as if it were a loan contingency.</p>`,
   drill:{q:'The fourplex you’re buying shows three legal units in city records. The right basis for your offer is:', opts:['Four units — it rents as four today and every tenant is paying','Three units, the fourth at zero income with a legalization budget if feasible','Four units minus a small discount for the permit risk','Walk away always — unpermitted units are never worth the trouble'], a:1, why:'Income from an unpermitted unit can be shut off by one complaint. You buy the legal three; legalization of the fourth is upside you price as an option, informed by the city’s own guidance.'}}
 ]},
{id:'principles', name:'Locator.X wealth principles', who:'The philosophy under the protocols', c:'--cat5',
 blurb:'The operating principles behind every search protocol in this app — original Locator.X doctrine on assets, education, and building systems that pay you.',
 modules:[
  {id:'w1', t:'Buy what pays you — the asset test', body:`
   <p>The first Locator.X principle is a definition: <b>an asset puts money in your pocket; a liability takes it out</b>. Not "might appreciate" — pays you, this month, after every real expense. That definition is why the score’s heaviest modality is cash flow, why the dashboard sorts liabilities to the bottom, and why a beautiful building that loses $2,000 a month scores below a plain one that clears $400.</p>
   <p>Your own house sits in the gray zone: it shelters you but pays you nothing. The house-hack protocol exists to move it across the line — live in one unit while the others pay the mortgage, and your biggest expense becomes your first asset. Wealth building starts the day your money starts working the same hours you do.</p>`,
   drill:{q:'Which purchase best passes the asset test at closing?', opts:['A condo you’ll live in alone, hoping it appreciates faster than inflation','A fourplex where three rents cover the mortgage while you live in the fourth','A vacant lot in the path of growth, held until a builder calls','A boat you can charter someday when the season is right'], a:1, why:'Only the fourplex pays you from day one after real expenses. Appreciation hopes and someday-income are speculation, not the asset test.'}},
  {id:'w2', t:'Financial education is the real down payment', body:`
   <p>The gap between people who build wealth and people who don’t is rarely income — it is <b>literacy in the language of money</b>: reading an operating statement, knowing what a cap rate hides, feeling the difference between good debt (amortized by tenants against an income asset) and bad debt (serviced by your paycheck against a toy).</p>
   <p>That’s why this app teaches while it searches: every score expands into its eleven factors, every underwriting sheet shows its arithmetic, the Academy drills the skills, and the tutor refuses to hand you answers. Work to learn before you work to earn: your first deals pay you mostly in education, and that education compounds longer than any single building. The wealthy don’t work for money — they build and buy systems that earn it, and understanding the system IS the work.</p>`,
   drill:{q:'Your first small fourplex nets you only $250/mo for a lot of effort. Its real first-year return is:', opts:['The $3,000 — barely worth the hours you put in','The system: operating statement, lender, manager, rehab — reusable at scale','The depreciation deduction, which shelters part of your W-2 income','Nothing until it appreciates enough to refinance'], a:1, why:'The first deal’s compounding asset is competence. The $3,000 is real, but the reusable system — a live operating statement, a lender relationship, a manager, a rehab — is what you reuse on ten larger buildings.'}},
  {id:'w3', t:'Pay yourself first, then let assets buy the luxuries', body:`
   <p>The discipline: route a fixed share of every dollar into acquisition capital <b>before</b> lifestyle spending, and when you want a luxury, <b>buy an asset whose cash flow buys it</b>. The car payment that comes from a duplex’s rent costs you nothing forever; the same payment from your paycheck costs you every month.</p>
   <p>Practically: hold acquisition capital in its own account; set a buy box (the desk saves yours) so the capital deploys on criteria, not emotion; and let the pipeline’s funnel — universe, matches, screened, underwritten, offers — be your budget’s scoreboard. Discipline beats motivation because it’s still there on the bad weeks.</p>`,
   drill:{q:'You want a $700/mo toy. The Locator.X sequence is:', opts:['Buy it now — you earned it and the payment fits your salary','Finance it at 0% for 60 months and invest the difference','Cash flow first: an asset clearing $700/mo after reserves, then the toy','Never buy luxuries until the portfolio is fully paid off'], a:2, why:'Assets first, luxuries from the cash flow. The principle isn’t austerity — it’s sequencing: the toy funded by an asset is permanently free.'}},
  {id:'w4', t:'Make offers — the market rewards motion', body:`
   <p>Analysis without offers is entertainment. The protocol: underwrite in volume (the auto-underwriter screens hundreds), offer at YOUR number with honest justification (the solver computes the price at which a property meets your target; the memo shows the seller how you got there), and let the market say no. Ten respectful, defensible offers teach more than a year of reading, and every so often one is accepted at a number that shouldn’t have been possible.</p>
   <p>Rejection is data: track the gap between asking and your maximum in the gap chart; when the bars cluster near zero in one ZIP, that market has moved to you. Courage here isn’t recklessness — it’s the willingness to be told no by professionals, in writing, weekly.</p>`,
   drill:{q:'Your solver says $1.28M on a $1.5M listing. What do you do with that number?', opts:['Skip it — an offer 15% under asking burns the bridge with that agent','Offer $1.28M, courteously, with the underwriting memo attached, and move on','Offer $1.45M so the listing agent takes you seriously','Wait for a price cut and offer only when it drops near $1.3M'], a:1, why:'A documented, respectful offer at your number is professional practice, not insult. The memo turns "lowball" into "here’s the math"; sellers’ circumstances change, and yours is the offer on file when they do.'}},
  {id:'w5', t:'Build the system, then the team, then the portfolio', body:`
   <p>One rental is a job; a repeatable acquisition system is a business. The Locator.X protocol stack IS that system: signals find motivated situations → the score ranks them → the buy box filters → the desk underwrites → the memo makes the offer → the playbooks run the people → the refinance recycles the capital → the daily refresh restocks the funnel. Your job graduates from doing each step to <b>leading the team that runs it</b> — broker, lender, manager, contractor, bookkeeper — with the relationship principles from the playbooks track.</p>
   <p>Mind your own business: whatever pays your salary, this system is what you own. An hour a week in the pipeline, every week, outbuilds a heroic month once a year.</p>`,
   drill:{q:'What turns five rentals from five jobs into one business?', opts:['An LLC holding all five, with one bank account and one bookkeeper','More leverage, so the equity works harder per hour you spend','Written systems run by a team you lead, numbers reviewed on a cadence','A property in every city so no one market can hurt you'], a:2, why:'Entities and leverage are tools. The transformation is systematization — written criteria and playbooks, delegated operations, run by a team you lead and reviewed on a cadence.'}}
 ]},
{id:'agent', name:'Licensed agent → broker', who:'New and future agents', c:'--cat2',
 blurb:'The California licensing ladder, the fiduciary core of the job, and the field skills the exam cannot teach.',
 modules:[
  {id:'a1', t:'The licensing map (California DRE)', body:`
   <p><b>Salesperson.</b> 18 or older; three college-level courses of 45 hours each — <b>Real Estate Principles</b>, <b>Real Estate Practice</b>, and one elective (Finance, Appraisal, Property Management, Legal Aspects, Escrows and others qualify). Since January 1, 2024 the Practice course must include <b>implicit bias</b> and <b>fair-housing</b> components, the fair-housing part with role-play as both consumer and professional. Then the state exam (multiple choice; DRE publishes current format and the 70% pass bar) and fingerprinting.</p>
   <p><b>Broker.</b> Two years of full-time licensed salesperson experience within the last five (or equivalent, or a four-year degree with a real-estate major/minor) plus <b>eight</b> college-level courses — Practice, Legal Aspects, Finance, Appraisal, Economics or Accounting, and three electives — then the broker exam (75% pass bar per DRE).</p>
   <p><b>Staying licensed.</b> 45 hours of continuing education every four years. Source: dre.ca.gov → Examinees. Verify every number there before enrolling; rules change.</p>`,
   drill:{q:'A college friend with a bachelor’s degree in marketing wants a broker license without ever working as an agent. What is the fastest legitimate path?', opts:['Impossible — only two years of full-time salesperson work in the last five years counts, no exceptions','Two years of unlicensed equivalent experience or a 4-year degree with a real-estate major/minor, plus the 8 courses','Pass the salesperson exam twice, once per year, in place of the two years of experience','Take 45 hours of continuing education and the broker exam, skipping the eight college-level courses'], a:1, why:'DRE accepts two years of equivalent experience or a qualifying degree in place of salesperson time; the eight courses and the exam still apply.'}},
  {id:'a2', t:'Fiduciary duty and disclosure — the spine of the license', body:`
   <p>An agent is a <b>fiduciary</b>: loyalty, confidentiality, full disclosure, obedience to lawful instruction, reasonable care, and accounting for funds. California layers on statutory disclosure: the agency-relationship disclosure form, the seller’s <b>Transfer Disclosure Statement</b>, natural-hazard disclosure, and — since agency is negotiable — written confirmation of who represents whom. <b>Dual agency is legal in California only with the informed written consent of both sides</b>, and the dual agent may never disclose to either party that the other would take a different price.</p>
   <p>The practical test: before you say anything to the other side, ask <i>whose interest does this sentence serve?</i> If the answer is not “my client’s,” don’t say it.</p>`,
   drill:{q:'You represent the buyer. The listing agent casually asks, “How high will your client really go?” Your client authorized $1.4M; the offer is $1.3M. What do you say?', opts:['“They can stretch to 1.4 if pushed, but don’t tell the seller.”','“My client’s offer is $1.3M and it’s a strong one” — nothing more','“I can’t talk to you at all until my client is in the room.”','Reveal it only if the seller counters above $1.35M'], a:1, why:'Price authority is confidential client information. You advocate the offer; you never disclose reserve prices.'}},
  {id:'a3', t:'Fair housing in practice, not on the poster', body:`
   <p>Federal law (Fair Housing Act) protects race, color, national origin, religion, sex, familial status, and disability. California (FEHA and Unruh) adds — among others — marital status, sexual orientation, gender identity, source of income (including Section 8 vouchers), immigration status, and arbitrary characteristics. The violations that actually end careers are quiet ones: <b>steering</b> (“you’d be more comfortable in…”), unequal information (mentioning the ADU to one caller and not another), and screening standards applied unevenly.</p>
   <p>Discipline that works: script your property answers once and give every prospect the same script; describe the property, never the neighbors; apply written screening criteria in the order applications arrive.</p>`,
   drill:{q:'A relocating family asks, “Is this a good neighborhood for people like us?” The compliant, useful answer is:', opts:['Share your honest impression of the neighbors, since they asked directly and you know the block','“I can’t discuss demographics, but here are the school, commute and crime data and the property facts”','Change the subject to the kitchen remodel and hope they don’t ask again','Show them a different area you think fits a family like theirs better'], a:1, why:'Demographic characterization is steering. Point to objective third-party data sources — schools, commute, crime statistics — and stick to the property.'}},
  {id:'a4', t:'The transaction, end to end, on live records', body:`
   <p>Walk one deal through its skeleton: <b>list/offer → acceptance → escrow opens → disclosures & inspections (contingency clock) → appraisal → loan funding → closing & recording</b>. In this catalog every record shows the recorded outcome — price, date, APN. A Bay Area purchase typically runs 21–30 days of escrow; the contingencies (inspection, appraisal, loan) are the buyer’s exits, and removing them is the negotiation.</p>
   <p class="src" id="ts_a4live"></p>`,
   live:el=>{ const l=pickHack(); const d=L().deal(l); el.querySelector('#ts_a4live').innerHTML=`Field case: <b>${L().esc(l.addr)}, ${L().esc(l.city)}</b> — recorded ${l.priceDate||'n/a'} at ${L().fmt$(l.price)}. As an agent, name the three contingencies you would calendar, then check the underwriting sheet’s checklist for this property in the Underwrite tab.`; },
   drill:{q:'Your buyer’s appraisal comes in $60k under the accepted price and the appraisal contingency is still live. Which is NOT one of the four standard plays?', opts:['Renegotiate the price toward appraised value','Buyer covers the gap in cash','Challenge the appraisal with better comps','Quietly waive the loan contingency to force the lender to fund'], a:3, why:'Waiving the loan contingency doesn’t make a lender fund an under-appraised deal — it just puts the deposit at risk. The other three are the real menu.'}}
 ]},
{id:'investor', name:'Investor', who:'Buy-and-hold and value-add investors', c:'--cat1',
 blurb:'The Locator X doctrine as a discipline: underwrite, finance, force value, hold. The Academy missions drill it; these lessons are the theory of record.',
 modules:[
  {id:'i1', t:'Underwriting is the business', body:`
   <p>Everything else is marketing. An underwrite is five honest numbers: <b>income</b> (market rent, vacancy), <b>expenses</b> (taxes at the county rate on YOUR price under Prop 13, insurance, maintenance + capital reserve, management even if you self-manage), <b>debt</b> (rate, term, DSCR), <b>basis</b> (price + closing + rehab), and <b>exit</b> (what a tired-of-it-you sells for). The Underwrite tab automates the arithmetic; the judgment is in the rent number — never accept a rent you haven’t seen a comparable lease for.</p>`,
   drill:{q:'A pro forma shows 5% vacancy, $0 management (“I’ll self-manage”), and maintenance at 2% of rent on a 1908 triplex. The most dangerous line is:', opts:['Vacancy at 5% in a tight rental market','Management at $0 — self-managing has a cost','Maintenance on a 118-year-old building at 2%','All equally fine for a small building'], a:2, why:'Century-old multifamily runs real maintenance + capex; 2% of rent is fiction. Self-managing has a cost too, but deferred maintenance is what sinks holds.'}},
  {id:'i2', t:'Financing structures and when each wins', body:`
   <p><b>Conventional</b> (25% down) is the benchmark. <b>FHA owner-occupied</b> (3.5% down, 2–4 units, self-sufficiency test on 3–4 units) is the great cheat code for the first building — the House hacks tab runs its math on every eligible record. <b>DSCR loans</b> qualify the property, not you — rate premium for freedom. <b>Seller carry</b> converts a stubborn price into your terms: pay their number at your rate. Rule: negotiate price against rate; you can win the deal by conceding the one your spreadsheet cares less about.</p>`,
   drill:{q:'Seller wants $1.1M, firm, for a fourplex worth $1.0M by your underwrite. Which counter keeps their number and your yield?', opts:['Offer $900k cash','$1.1M with 20% down and a seller note at 4% for the balance','Walk immediately','$1.0M and split the difference on closing costs'], a:1, why:'Seller financing at a below-market rate can make their price your cash flow. Run both structures in the sheet before walking.'}},
  {id:'i3', t:'Forcing value: units, ADUs, and the development stack', body:`
   <p>Bought yield is fragile; built yield compounds. California hands multifamily investors statutory levers: <b>ADU state law</b> (ministerial approval for accessory units), <b>SB 9</b> (lot splits/duplexes on many single-family lots), soft-story retrofits that unlock insurance and financing, and condo conversion where local law allows. The Develop section inside every underwriting sheet prices eleven strategies with feasibility flags on the actual parcel — lot, zoning, age.</p>`,
   drill:{q:'Which value-add typically has the best cost-to-rent ratio on a Bay Area lot that already has a garage?', opts:['Full gut renovation','Garage ADU conversion','Adding a story','Condo conversion'], a:1, why:'Garage conversions reuse foundation, roof and utilities — the cheapest legal new unit in most of the Bay (the cost library prices it around $220k vs ~$500/sf for detached new build).'}},
  {id:'i4', t:'Taxes: the quiet half of returns', body:`
   <p>Four pillars, names only — bring a CPA: <b>Prop 13</b> caps assessed growth at 2%/yr on your purchase basis (why long holds win here); <b>depreciation</b> shelters cash flow (27.5-year straight line on improvements); <b>1031 exchange</b> defers gains into the next building (45-day identification, 180-day close); <b>Prop 19</b> changed inheritance reassessment — the old “keep the parents’ basis” play is mostly gone. None of this is advice; all of it is why two investors with identical buildings keep different amounts.</p>`,
   drill:{q:'You sell a fourplex with a $600k gain and want the tax deferred. The 1031 clock demands:', opts:['Close the replacement within 45 days','Identify in writing within 45 days and close within 180','Identify within 90 days, close within a year','Reinvest only the gain'], a:1, why:'45 days to identify, 180 to close, through a qualified intermediary — and you must replace both value and debt to fully defer.'}}
 ]},
{id:'lending', name:'Financing & lending', who:'Future MLOs and finance-minded agents', c:'--cat4',
 blurb:'How the money side actually decides, and the NMLS path if you want the license.',
 modules:[
  {id:'f1', t:'The MLO path (NMLS / SAFE Act)', body:`
   <p>Residential mortgage loan originators license through <b>NMLS</b>: 20 hours of SAFE-Act pre-licensure education (with a state-specific component), the SAFE MLO national test, background and credit review, and annual continuing education. California licenses through DRE (as a licensee with an MLO endorsement) or DFPI depending on employer. Source: nmlsconsumeraccess.org and mortgage.nationwidelicensingsystem.org — verify current hours there.</p>`,
   drill:{q:'A real-estate salesperson wants to originate loans at an independent mortgage company in California. They generally need:', opts:['Nothing extra — the DRE salesperson license already covers loan origination at any California lender','NMLS registration, 20h SAFE education, the national test, and the right endorsement/license for their employer type','Only the DRE broker license, since brokers can originate loans without any NMLS step','A CPA license, because originating is a financial rather than a real-estate activity'], a:1, why:'Originating is a separate licensed activity under the SAFE Act, layered on top of (or instead of) the DRE license depending on the shop.'}},
  {id:'f2', t:'How underwriters read your buyer', body:`
   <p>Three ratios rule: <b>LTV</b> (loan ÷ value — drives rate and MI), <b>DTI</b> (all monthly debt ÷ gross income — conventional strains past ~45–50%), and for investment property <b>DSCR</b> (NOI ÷ debt service — 1.20+ reads as safe). Rental income counts partially (commonly 75% of market rent) — which is exactly the haircut the House hacks tab applies. Reserves, seasoning of funds, and the appraisal close the file.</p>
   <p class="src" id="ts_f2live"></p>`,
   live:el=>{ const l=pickHack(); const d=L().deal(l); el.querySelector('#ts_f2live').innerHTML=`Live drill: <b>${L().esc(l.addr)}</b> — est. rent $${L().fmtN(d.rentMo)}/mo. At 75% credit, a lender counts $${L().fmtN(Math.round(d.rentMo*0.75))}/mo toward your buyer’s DTI.`; },
   drill:{q:'Buyer: $11k/mo gross income, $1.2k existing debts. New PITIA would be $5.2k, and the duplex’s other unit rents for $2.8k. DTI counting 75% of rent is roughly:', opts:['58% — dead','(5.2+1.2−2.1)/11 ≈ 39% — alive','32%','47%'], a:1, why:'75% of $2.8k = $2.1k offsets the housing payment: (5,200+1,200−2,100)/11,000 ≈ 39%. Rental credit is what makes house-hacks finance.'}},
  {id:'f3', t:'Rate math every professional should do in their head', body:`
   <p>Approximation worth memorizing: at ~6.5%, principal-and-interest is about <b>$6.32 per month per $1,000 borrowed</b> (30-year). So a $750k loan ≈ $4,740/mo P&I. Each 0.25% rate move shifts payment ~2.3%. Buying the rate down one point (1% of loan) typically buys ~0.25% — breakeven ≈ 4–5 years, so points only make sense for long holds. The sensitivity grid in every underwriting sheet shows this against the actual building.</p>`,
   drill:{q:'Rates drop 0.5% after your client locks. The lender says relocking costs 0.375 points. On a $800k loan kept ~8 years, you advise:', opts:['Never pay to relock — the lender set the rate and keeps the risk','Pay it: ~$3k cost vs ~$220/mo payment reduction — payback ~14 months','Wait for another 0.5% drop before paying anything to relock','Switch lenders mid-escrow regardless of timing to get the new rate'], a:1, why:'0.5% on $800k ≈ $250/mo. A ~$3,000 fee pays back in about a year — obvious for an 8-year hold. Run payback, not feelings.'}}
 ]},
{id:'pm', name:'Property management', who:'Owner-operators and PM careers', c:'--cat3',
 blurb:'California landlord-tenant law and the operating discipline that keeps NOI real.',
 modules:[
  {id:'p1', t:'The California rulebook in one page', body:`
   <p><b>AB 1482</b> caps rent increases at 5% + CPI (max 10%) and requires just cause for eviction on most multifamily older than 15 years — the Dashboard’s regulation flag shows which records carry stricter local regimes (SF pre-1979, Oakland pre-1983, Berkeley pre-1980). <b>Security deposits:</b> since July 1, 2024 (AB 12), generally capped at one month’s rent. <b>Habitability</b> is non-waivable; repair-and-deduct is the tenant’s statutory remedy. Screening: apply written criteria uniformly; source-of-income discrimination is illegal. Verify current text at leginfo.legislature.ca.gov — this changes yearly.</p>`,
   drill:{q:'Your Oakland fourplex (built 1962) tenant’s lease ends. Market is up 12%. You may raise rent:', opts:['12% — the lease ended and the state cap only binds mid-lease','5% + CPI up to 10% with proper notice — or less, under Oakland RAP’s stricter cap','0% — rent is frozen on any pre-1983 Oakland building','Any amount with 90-day notice, since AB 1482 exempts fourplexes'], a:1, why:'Pre-1983 Oakland multifamily sits under the local Rent Adjustment Program (often stricter than AB 1482). The dashboard flags this building bad-red for a reason.'}},
  {id:'p2', t:'Operations: the numbers a manager actually moves', body:`
   <p>A manager controls five levers: <b>days-vacant</b> (every turnover week ≈ 2% of annual unit revenue), <b>renewal rate</b> (a $100 concession beats a $4k turn), <b>maintenance triage</b> (emergency / urgent / scheduled — batching scheduled work cuts cost ~30%), <b>delinquency cadence</b> (day-3 reminder, day-6 notice, never personal), and <b>utility recovery</b> (RUBS where legal). Management fees run 6–8% in the Bay plus leasing fees; the assumption slider in this app defaults to 8% so owners price the truth.</p>`,
   drill:{q:'Unit rents $2,400. Tenant asks for $150/mo off to renew; a turnover means 3 weeks vacant, $1,800 paint/clean, $1,200 leasing fee. Renewing at the discount costs you over a year:', opts:['$1,800 — cheaper than the ~$4,800 turnover','Nothing','$4,800','More than the turnover'], a:0, why:'$150×12 = $1,800 vs ~$1,660 vacancy + $3,000 costs ≈ $4,700. Retention wins — and the relationship compounds.'}}
 ]},
{id:'valuation', name:'Valuation & appraisal', who:'Anyone who prices property', c:'--cat5',
 blurb:'Three approaches to value, the comp discipline behind them, and the appraiser licensing ladder.',
 modules:[
  {id:'v1', t:'Three approaches, one opinion', body:`
   <p><b>Sales comparison</b> (what did similar buildings fetch — king for 1–4 units), <b>income</b> (NOI ÷ cap rate — king for 5+), and <b>cost</b> (land + replacement − depreciation — sanity check and insurance). The Research tab’s comps agent runs sales comparison against this catalog; the Underwrite sheet is the income approach. An appraisal reconciles all three into one number — and says which it leaned on.</p>
   <p class="src" id="ts_v1live"></p>`,
   live:el=>{ const l=pickBig(); const d=L().deal(l); el.querySelector('#ts_v1live').innerHTML=`Income-approach drill on <b>${L().esc(l.addr)}, ${L().esc(l.city)}</b> (${l.units} units): NOI ${L().fmt$(d.noi)} ÷ price ${L().fmt$(d.P)} = ${d.cap.toFixed(2)}% cap. Ask: what cap rate do 5+ unit sales in this ZIP actually trade at?`; },
   drill:{q:'For a 12-unit building, the primary approach and its key input are:', opts:['Sales comparison; price per bedroom','Income; NOI and the market cap rate','Cost; replacement cost per sf','Automated model; the Zestimate'], a:1, why:'5+ residential is priced as an income stream. Comps inform the cap rate; the NOI you can defend is the battle.'}},
  {id:'v2', t:'Comp discipline (and the appraiser ladder)', body:`
   <p>A defensible comp set: same product type, ≤0.5mi urban, ≤6 months old, adjusted for beds/baths/size/condition — and you adjust the <i>comp toward the subject</i>, never the reverse. Document every adjustment. The California appraiser ladder (BREA: trainee → licensed → certified residential → certified general) trades education + supervised hours for scope; current hour requirements live at brea.ca.gov. Agents and investors aren’t appraisers — but the discipline is free to copy.</p>`,
   drill:{q:'Your best comp sold 4 months ago for $1.28M with one bath fewer than the subject. Baths adjust at ~$25k here. The adjusted comp value is:', opts:['$1.255M','$1.28M — no adjustment','$1.305M — add $25k to the comp','Throw it out'], a:2, why:'The comp is inferior (one bath fewer), so you adjust it up toward the subject: $1.28M + $25k = $1.305M.'}}
 ]},
{id:'dev', name:'Development & construction', who:'Value-add and ground-up builders', c:'--cat3',
 blurb:'Entitlements, the California housing statutes, and the pro forma that decides whether to build.',
 modules:[
  {id:'d1', t:'Entitlements: the permission stack', body:`
   <p>Every project clears the same wall: <b>zoning</b> (use, height, density, setbacks — the Develop panel reads the parcel’s code), <b>ministerial vs discretionary</b> approval (ADUs and SB 9 are ministerial — no hearings; bigger projects face review and CEQA), <b>building permits</b>, and <b>impact fees</b> (which can exceed $50k/unit in some Bay cities — price them first). The state’s housing statutes (ADU law, SB 9, SB 35/423 streamlining, density bonus) exist to punch through local resistance; learn them as tools.</p>`,
   drill:{q:'Fastest path to an approved second unit on a typical SF RH-1 lot with a garage is:', opts:['Rezone application','A discretionary conditional-use hearing','A ministerial ADU permit under state law','SB 35 streamlining'], a:2, why:'ADU approvals are ministerial by state statute — checklist compliance, not politics. That is why the ADU strategies dominate the Develop panel.'}},
  {id:'d2', t:'The development pro forma', body:`
   <p>Five lines decide go/no-go: <b>basis</b> (land + hard costs + soft costs ~25–35% of hard + financing), <b>schedule</b> (time is interest), <b>exit value</b> (new NOI ÷ market cap, or sale comps), <b>profit margin</b> (untrended ~15–20% of cost or walk), and <b>downside</b> (what if rents land 10% low and costs 15% high — still alive?). The after-development outputs in each underwriting sheet run exactly this on the parcel’s feasible strategies.</p>`,
   drill:{q:'A garage ADU: $220k all-in, adds $2,300/mo rent in a 5.0% cap submarket. Value created ≈', opts:['$220k — break even, the rent only covers the build cost','~$331k added value (27.6k NOI-ish ÷ 5%) → ~$110k profit','$552k — gross rent ÷ cap rate, no expenses','Nothing until sale — ADU value only shows at exit'], a:1, why:'~$27.6k/yr income (before expenses trims it) ÷ 5% cap ≈ $500k gross, realistically ~$330k after operating costs — comfortably above the $220k basis. Build.'}}
 ]}
];

function prog(){ return store('done')||{}; }
function trackPct(t){ const d=prog()[t.id]||{}; return Math.round(100*t.modules.filter(m=>d[m.id]).length/t.modules.length); }
/* THE CREDENTIAL USED TO BE ONE CLICK PER MODULE, UNLIMITED FREE RETRIES.
   Each module's drill was a single multiple-choice question with no lockout
   and no penalty for a wrong guess — "Not yet. ... try again" — so clicking
   every option in turn cleared any module in at most four tries with zero
   understanding required, and "Seal the credential" fired the moment all
   modules had been clicked through that way. That bar cannot support a
   credential anyone is asked to pay for, or trust.

   The per-module drill stays exactly as free-retry as it was — it is
   formative, the place a learner is SUPPOSED to be able to guess, get it
   wrong, and be told why — but it no longer gates the credential by
   itself, and its own language no longer says "verified" for a state
   unlimited guessing reaches. What gates sealCred() now is a distinct
   certification check: every module's own drill question, once each, in
   one pass, no retry — the same design academy.js's transfer check already
   uses for exactly this reason. Reusing each module's existing drill
   means no new content, only a new, harder way of asking it. */
function certified(){ return store('certified')||{}; }
function isCertified(t){ return !!certified()[t.id]; }
function certifiedCount(){ return TRACKS.filter(isCertified).length; }
async function sealCred(t, score){
  const payload={'@context':'https://www.w3.org/ns/credentials/v2', type:['VerifiableCredential','OpenBadgeCredential'], name:'Locator X Trade School — '+t.name,
    issuer:'locator.x Trade School (AGI Corp · AGI Future Foundation)', issuanceDate:new Date().toISOString(),
    credentialSubject:{type:'AchievementSubject', achievement:{type:'Achievement', name:t.name+' track',
      description:'Certification check passed: every module’s drill question, one attempt each, no hints, no retries.',
      criteria:{narrative:'First-attempt accuracy ≥ 75% across all '+t.modules.length+' modules in a single pass.'}},
      resultsSummary:Math.round(score*100)+'% first-attempt, '+t.modules.length+' modules, '+new Date().toISOString().slice(0,10), modules:t.modules.map(m=>m.t)}};
  let hash=''; try{ const b=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload))); hash=Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''); }catch(e){}
  const creds=store('creds')||[]; creds.push({track:t.id, name:payload.name, at:payload.issuanceDate, hash, score}); save('creds',creds);
  L().toast('Credential sealed: '+t.name+' — hash '+hash.slice(0,12)+'…');
}
function startCheck(t){ render._check={t, qi:0, correct:0, total:t.modules.length}; render._mod=null; render(); }
function renderCheck(){
  const root=$('#tsroot'); const st=render._check; const t=st.t; const m=t.modules[st.qi];
  root.innerHTML=`<div class="eyebrow">${t.name} certification check · question ${st.qi+1} of ${st.total} · one attempt each, no hints, no retries</div>
  <div class="tile" style="margin-top:8px"><p style="font-size:13px;margin:0 0 8px">${m.drill.q}</p>
  <div style="display:flex;flex-direction:column;gap:6px">${m.drill.opts.map((o,i)=>`<button class="btn" data-ans="${i}" style="text-align:left">${o}</button>`).join('')}</div>
  <p id="ts_cfb" class="src" style="margin-top:8px"></p></div>`;
  let answered=false;
  root.querySelectorAll('[data-ans]').forEach(b=>b.addEventListener('click',()=>{
    if(answered) return; answered=true;
    const ok=+b.dataset.ans===m.drill.a; if(ok) st.correct++;
    const fb=$('#ts_cfb'); fb.innerHTML=(ok?'<b style="color:var(--good)">Correct.</b> ':'<b style="color:var(--bad)">Missed — no retry in the check.</b> ')+m.drill.why
      +'<br><button class="btn primary" style="margin-top:8px" id="ts_cnext">'+(st.qi+1<st.total?'Next':'Score the check')+'</button>';
    $('#ts_cnext').addEventListener('click', ()=>{ if(st.qi+1<st.total){ st.qi++; renderCheck(); } else finishCheck(); });
  }));
}
async function finishCheck(){
  const st=render._check; const t=st.t; const score=st.correct/st.total; const pass=score>=0.75;
  const root=$('#tsroot');
  if(pass){ const c=certified(); c[t.id]={at:new Date().toISOString(), score}; save('certified', c); await sealCred(t, score);
    try{ if(window.LXAcad && LXAcad.render) LXAcad.render(); }catch(e){} /* refreshes the comprehensive-certification banner without a tab switch */ }
  root.innerHTML=`<div class="tile"><h3 style="margin:0 0 6px;font-family:var(--display)">${pass?'Certified':'Not yet'}</h3>
  <p style="font-size:14px">${st.correct} of ${st.total} correct (${Math.round(score*100)}%), one attempt each, pass ≥ 75%. ${pass? 'The '+t.name+' credential is sealed on the credential wall below.' : 'The check draws from the same module pool every time — review what you missed on the track page, then take the check again.'}</p>
  <button class="btn primary" id="ts_cback">Back to ${t.name}</button></div>`;
  render._check=null;
  $('#ts_cback').addEventListener('click', ()=>{ render._mod=null; render(); });
}
function render(){
  const root=$('#tsroot'); if(!root) return;
  if(render._check){ renderCheck(); return; }
  const open=render._open;
  if(!open){
    root.innerHTML=`<div class="cards">${TRACKS.map(t=>`<div class="tile" style="cursor:pointer;border-top:3px solid var(${t.c})" data-ts="${t.id}">
      <div class="eyebrow">${t.who}</div><b style="font-size:16px">${t.name}</b>
      <div style="font-size:12px;color:var(--muted);margin:6px 0 8px">${t.blurb}</div>
      <div style="height:6px;background:var(--line);border-radius:99px;overflow:hidden"><div style="height:100%;width:${trackPct(t)}%;background:var(${t.c})"></div></div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">${trackPct(t)}% reviewed${isCertified(t)?' · <b style="color:var(--good)">certified</b>':''}</div></div>`).join('')}</div>
    <p class="src" style="margin-top:10px">Licensing summaries in the California tracks are educational, drawn from the California DRE, NMLS and BREA public pages (Sept 2026). The any-state tracks (licensing navigator, property management, contractors) state patterns only and no state’s numbers; verify every requirement with your own regulator before enrolling or acting, and record the date you looked. "Reviewed" means the module's own drill was answered correctly, with unlimited retries — formative, not the credential's basis. A track's credential seals only after its certification check: every module's question, once each, no retries, ≥ 75% first-attempt.</p>`;
    root.querySelectorAll('[data-ts]').forEach(el=>el.addEventListener('click',()=>{ render._open=el.dataset.ts; render._mod=null; render(); }));
    return;
  }
  const t=TRACKS.find(x=>x.id===open); const d=prog()[t.id]||{};
  const mid=render._mod;
  if(!mid){
    root.innerHTML=`<button class="btn" id="ts_back">← All tracks</button>
    <h3 style="margin:10px 0 2px">${t.name}</h3><p style="color:var(--muted);font-size:13px;margin:0 0 10px">${t.blurb}</p>
    <div class="lessons">${t.modules.map((m,i)=>`<div class="tile" style="cursor:pointer" data-mod="${m.id}"><div class="eyebrow">Module ${i+1} ${d[m.id]?'· ✓ reviewed':''}</div><b>${m.t}</b></div>`).join('')}</div>
    ${isCertified(t)? `<p class="src" style="margin-top:10px"><b style="color:var(--good)">Certified</b> — credential on the wall below.</p>` : trackPct(t)===100? `<button class="btn primary" id="ts_check" style="margin-top:10px">Take the ${t.name} certification check</button>`:''}`;
    $('#ts_back').onclick=()=>{ render._open=null; render(); };
    root.querySelectorAll('[data-mod]').forEach(el=>el.addEventListener('click',()=>{ render._mod=el.dataset.mod; render(); }));
    const c=$('#ts_check'); if(c) c.onclick=()=>startCheck(t);
    return;
  }
  const m=t.modules.find(x=>x.id===mid);
  root.innerHTML=`<button class="btn" id="ts_back2">← ${t.name}</button>
  <div class="tile" style="margin-top:10px"><div class="eyebrow">${t.name} · ${m.t}</div>${m.body}
  <div style="border-top:1px solid var(--line);margin-top:10px;padding-top:10px">
    <b style="font-size:13px">Review it (${d[m.id]?'reviewed':'not yet'}) — unlimited tries, this is practice</b>
    <p style="font-size:13px;margin:6px 0">${m.drill.q}</p>
    <div style="display:flex;flex-direction:column;gap:6px">${m.drill.opts.map((o,i)=>`<button class="btn" data-ans="${i}" style="text-align:left">${o}</button>`).join('')}</div>
    <p id="ts_fb" class="src" style="margin-top:8px"></p>
    <button class="btn" id="ts_tutor" style="margin-top:6px">Probe me — Socratic tutor</button><span id="ts_tq" style="display:block;font-size:12px;color:var(--muted);margin-top:6px"></span>
  </div></div>`;
  $('#ts_back2').onclick=()=>{ render._mod=null; render(); };
  if(m.live){ try{ m.live(root); }catch(e){} }
  root.querySelectorAll('[data-ans]').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.ans; const fb=$('#ts_fb');
    if(i===m.drill.a){ const dd=prog(); (dd[t.id]=dd[t.id]||{})[m.id]=1; save('done',dd); fb.innerHTML='<b style="color:var(--good)">Reviewed.</b> '+m.drill.why; }
    else fb.innerHTML='<b style="color:var(--bad)">Not yet.</b> Think about which interest each option serves, and try again — the tutor never hands you the answer.';
  }));
  $('#ts_tutor').onclick=async()=>{
    const el=$('#ts_tq'); el.textContent='Thinking…';
    const fn=await getSample();
    if(!fn){ el.textContent='Tutor offline here. Reflect: (1) What would change your answer? (2) Where would you verify it in the primary source? (3) How would you explain it to a client in one sentence?'; return; }
    try{ const r=await fn(`You are a Socratic real-estate tutor. NEVER state answers or confirm which option is correct. Ask exactly 3 short probing questions that make a student reason about this topic: "${m.t}". Context: ${m.drill.q}. Plain text, numbered.`); el.textContent=r.text; }
    catch(e){ el.textContent='Tutor unavailable right now.'; }
  };
}
window.LXTS={render, TRACKS, certifiedCount, isCertified};
})();
