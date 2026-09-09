/* ===== Locator.X — Tradecraft ============================================
   The parts of the trade the counterpart playbooks do not cover: what a
   building costs to change, what the code lets you change it into, how the
   money is structured, how the thing is actually run, what the tax code does to
   the return, and what kills deals in diligence.

   Written from the Locator.X doctrine and nothing else — cash flow before
   capital gains, an asset is something that pays you, debt is good only when
   the building services it, and the value you can add is the only edge you
   control. No third-party book, method or personality is referenced or implied.

   Every lesson ends in a drill with a wrong answer worth getting wrong, and
   most link straight into the tool that does the arithmetic, because a lesson
   you cannot immediately apply is entertainment.
   ========================================================================= */
(function(){
  const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const L=()=>window.LX;
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const KEY='lxtradecraft';
  let PR=(function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } })();
  const save=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(PR)); }catch(e){} };

  const TRACKS=[
  {id:'build', name:'Construction & the rebuild', slot:3,
   blurb:'Every value-add thesis is a construction thesis wearing a spreadsheet. This track is about the part that actually costs money.',
   modules:[
   {id:'b1', t:'What a number per square foot is really telling you', body:`
    <p>There are at least four different numbers that all get called "cost per square foot", and confusing them is how a project goes 40% over before a shovel moves.</p>
    <p><b>A permit-valuation rate</b> — like the ICC Building Valuation Data table this app quotes — exists so a building department can charge a fee. It is a national average, it carries no demolition, no site work, no design fees, no financing, and no adjustment for the fact that framers cost more in Oakland than in Monroe. It is a floor to sanity-check against, not a budget.</p>
    <p><b>A published remodel rate</b> — San Francisco's own Cost Schedule says $191 a foot, $225 with seismic work — is a valuation the city will accept on a permit application. Same caveat, one city.</p>
    <p><b>A regional factor</b> tells you how far a national average is from where you are. The published Area Cost Factors put Oakland at 1.28 and New Orleans at 0.96 against a US average of 1.00. That is a 33% spread between two cities in this catalogue, and applying a Bay Area number to a Louisiana building would put your budget out by a third before you did anything wrong.</p>
    <p><b>A contractor's number</b> is the only one you can build from, and you do not have it until three of them have walked the building.</p>
    <p><b>The doctrine.</b> A cost you have not had bid is an assumption, and an assumption in a construction budget is the single most expensive kind of optimism in this trade. Use the anchors to decide what is worth pricing. Use bids to decide what to buy.</p>`,
    drill:{q:'A national permit-valuation table says $158/sf for R-2 multifamily. You are budgeting a gut in Oakland. The most defensible next move is:',
      opts:['Use $158 — it is a published figure','Multiply by the published regional factor to get a sanity-check figure, then get three bids before committing',"Add 10% because construction always runs over",'Use the seller’s renovation estimate'],
      a:1, why:'The table is a fee basis, not a bid, and it is a national average. Scaling it regionally gives you a number good enough to decide whether the play is worth pricing — and nothing more. Only bids buy buildings.'}},
   {id:'b2', t:'Occupancy change is the hidden cost', body:`
    <p>Adding a unit inside a building you already own sounds cheap. It often is not, and the reason is rarely the framing.</p>
    <p>When you change what a building is <i>used</i> for — a hotel to apartments, an office to dwellings, a single-family to a triplex — you change its occupancy classification, and a change of occupancy pulls the whole building up to current code. Not the part you touched. The building. Egress, fire separation, sprinklers, accessibility, energy, and in many jurisdictions seismic or wind. That is why this app prices a lodging conversion at a gut rate plus twelve percent and a commercial-to-residential conversion at a gut plus twenty-five: the delta is not finishes, it is the code catching up with the building all at once.</p>
    <p>The corollary is the opportunity. A building that already <i>is</i> R-2 and stays R-2 while you re-partition it is a fundamentally cheaper project than one that has to change class, even if the drawings look similar. When you are screening, the cheapest added unit in the catalogue is almost always the one inside a building that is already residential and already has the plumbing stacks.</p>
    <p><b>The doctrine.</b> Ask what class the building is and what class your plan makes it, before you ask what the finishes cost. The answer to the first question sets the order of magnitude of the second.</p>`,
    drill:{q:'Two buildings, both 6,000 sf, both priced to add four units. One is a 6-unit apartment building being re-partitioned; the other is a vacant office floor. Assuming similar finishes, which is the cheaper project and why?',
      opts:['The office — open floor plates are easier to work in','The apartment building — it stays in the same occupancy class, so the code does not re-open the whole building','Identical — square footage is square footage','The office, because commercial contractors are cheaper'],
      a:1, why:'Open plates help with framing and hurt with light, air and plumbing. The decisive cost is the occupancy change: the office conversion pulls the entire floor up to current residential code, the re-partition does not.'}},
   {id:'b3', t:'The schedule is a cost line, not a calendar', body:`
    <p>Most novice budgets price materials and labour and stop. The schedule then quietly eats the margin from three directions at once.</p>
    <p><b>Carry.</b> You are paying interest on the construction draw the whole time. This app carries interest on half the budget for the build duration, which is the conventional approximation for a linear draw — eleven months at 9.5% on half of $600,000 is about $26,000 that appears nowhere in a contractor's bid.</p>
    <p><b>Lost rent.</b> Every month a unit is down is rent you do not collect and still pay taxes, insurance and debt service against. On an occupied building this is frequently larger than the contingency.</p>
    <p><b>Escalation and the change order.</b> A long schedule is exposed to price movement and to the discovery of things nobody could see through a wall. Contingency is not padding; it is the budget line for the walls you have not opened.</p>
    <p><b>The doctrine.</b> Underwrite the calendar. If the deal only works at nine months and the permit queue in that jurisdiction is running six, you have not found a deal, you have found a race you have not been told the length of. Call the building department and ask before you offer.</p>`,
    drill:{q:'Your rebuild pencils at a 14% return on cost with an 11-month schedule. The city tells you plan review alone is running 5 months. The right response is:',
      opts:['Proceed — the return has room','Re-run the pro-forma with the real timeline, including the extra carry and lost rent, and see whether it still clears','Start work without the permit to save time','Ask the contractor to work faster'],
      a:1, why:'Five months of review is five more months of carry and, on an occupied building, five more months of lost rent — both of which come straight off the return. Re-run it. If it still clears, you have a deal you can defend; if not, you have been saved by a phone call.'}}
  ]},
  {id:'zone', name:'Zoning & entitlements', slot:4,
   blurb:'The code decides what is possible before the market decides what is profitable. Read it in that order.',
   modules:[
   {id:'z1', t:'Density, height and coverage are three different limits', body:`
    <p>A district rarely constrains you one way. It constrains you several ways at once, and the binding constraint is whichever runs out first.</p>
    <p><b>Density</b> is stated either as units per acre or as a minimum lot area per dwelling unit. They are the same statement inverted: 43,560 square feet in an acre, so 1,500 sf per unit is 29 units an acre. When a code gives you one, you can always compute the other, and checking that they agree is a good test that you have read the table correctly.</p>
    <p><b>Height</b> is stated in feet, sometimes in storeys, often in both, and the lower of the two governs. Height limits are also the most commonly modified by an overlay.</p>
    <p><b>Coverage, setbacks and parking</b> are what actually stop most projects. A lot may permit twelve units by density and physically fit six once you take out the front setback, the side yards and the parking the code requires per unit.</p>
    <p><b>The doctrine.</b> The density number is a ceiling, not a plan. Compute all the limits, and build your pro-forma on the smallest one.</p>`,
    drill:{q:'A 12,000 sf lot is zoned at 17.4 units per acre. The code also requires 1.5 parking spaces per unit and a 25-foot front setback. What is the number you should underwrite?',
      opts:['4 units, from the density calculation','Whatever number survives density, setbacks, coverage and parking together — which is usually fewer than the density allows','17 units','Whatever the seller says the lot will take'],
      a:1, why:'12,000 sf at 17.4/acre is 4 units by density alone. Parking and setbacks may cut that to three or two. The binding constraint is whichever runs out first, and it is almost never density.'}},
   {id:'z2', t:'By right, conditional, and the word that costs a year', body:`
    <p>Use tables use more than two codes. In the Baton Rouge code this app reads, there are four: permitted, permitted-but-restricted, conditional through the Planning Commission, and conditional through the Metropolitan Council. Those are wildly different risks wearing similar letters.</p>
    <p><b>By right</b> means you file, you comply, you build. Your risk is schedule, not outcome.</p>
    <p><b>Restricted</b> means yes, with conditions written into the code itself — in some districts multifamily is permitted only on upper floors, or capped at half the floor area. You can read the condition and price it.</p>
    <p><b>Conditional</b> means a body of people votes. You can improve your odds with a good application and honest neighbourhood outreach, but you cannot guarantee the outcome, and the calendar belongs to someone else. Underwrite a conditional-use deal with an option or a contingency, never with your own money at risk on the assumption of approval.</p>
    <p><b>The doctrine.</b> Price certainty. A by-right project at a thinner margin frequently beats a conditional project at a fat one, because the fat one has a probability attached to it that nobody wrote down.</p>`,
    drill:{q:'Two identical returns: one by-right, one requiring a conditional use permit. What is the honest way to compare them?',
      opts:['They are the same — same return','Discount the conditional one by the probability of approval and the cost of the extra months, then compare','Prefer the conditional one — less competition','Prefer whichever the broker recommends'],
      a:1, why:'An unadjusted return on a project that might not be approved is not a return, it is a hope with a decimal point. Put a probability and a calendar on it and the two stop looking identical.'}},
   {id:'z3', t:'Overlays, historic districts, and the rules on top of the rules', body:`
    <p>The district table is the base layer. Sitting on top of it, invisible unless you look, are overlays, design districts, historic designations, corridor plans and sometimes a specific ordinance for one street.</p>
    <p>These almost never make a project easier. They add design review, restrict demolition, govern materials and window proportions, and add months. A historic designation can make the difference between a gut renovation and a project that is not economically possible at all — and the designation can attach to a district, not just a building, so the building itself need not be notable.</p>
    <p>They also occasionally add value: some historic designations carry tax credits large enough to change a marginal rehabilitation into a good one, and some corridor overlays grant density bonuses in exchange for design or affordability commitments.</p>
    <p><b>The doctrine.</b> Never underwrite off the zoning map alone. Pull the parcel's full profile — overlays, historic status, design district, flood zone — before you price the plan. This app's Record Locker opens exactly those pages for the parcel you are looking at.</p>`,
    drill:{q:'The zoning map shows A3.2, which permits multifamily by right at 17.4 units/acre. What is still unknown?',
      opts:['Nothing — the district governs','Whether an overlay, historic or design district, flood zone, or corridor plan adds requirements on top, and what the setbacks and parking actually leave you','The price','Nothing, if the seller confirms it'],
      a:1, why:'The district table is the base layer only. Overlays and designations sit on top of it and are the single most common source of "we could not build what we underwrote".'}}
  ]},
  {id:'capital', name:'Capital & structure', slot:2,
   blurb:'Debt is a tool with a blade. This track is about which end to hold.',
   modules:[
   {id:'c1', t:'Coverage is the only leverage test that matters', body:`
    <p>Loan-to-value tells you what a lender thinks the building is worth. Debt service coverage tells you whether the building can pay the loan. Only one of those protects you in a downturn.</p>
    <p>Coverage is net operating income divided by annual debt service. At 1.00 the building exactly pays its loan and nothing else — no vacancy, no roof, no eviction. At 1.25 you have a quarter of the payment as cushion, which is roughly one month of vacancy a year on a small building. Below 1.00 you are feeding it every month, and the only questions left are how long and from what.</p>
    <p>This is the arithmetic behind the Locator.X definition of an asset. An asset pays you. A building whose coverage is below one is not an asset that is temporarily underperforming; it is a liability with a story attached, and the story is usually about appreciation.</p>
    <p><b>The doctrine.</b> Buy coverage, not value. A building at a fair price with 1.3 coverage will still be yours in five years. A building at a bargain price with 0.8 coverage belongs to whoever refinances it.</p>`,
    drill:{q:'A building shows 0.85 coverage at your assumptions but sits in a ZIP appreciating 6% a year. Locator.X calls this:',
      opts:['An asset, because of the appreciation','A liability at this price — you feed it monthly and are betting the trend holds; if you buy it, size the down payment so it at least breaks even','A value-add play','A house hack'],
      a:1, why:'Appreciation is a market opinion; coverage is the building’s own arithmetic. You can buy a negative-coverage building deliberately — but call it what it is and size the equity so it stops bleeding.'}},
   {id:'c2', t:'The seller is a lender you have not asked yet', body:`
    <p>On a building that will not cover a bank loan at today's rates, the cheapest capital in the room is frequently the person selling it.</p>
    <p>Seller financing changes the arithmetic in three ways. The rate is negotiable and often below bank pricing, because the seller is comparing it to a bond, not to a mortgage desk. The terms are negotiable — interest-only for two years while you stabilise, a balloon at five, no personal guarantee. And the seller may prefer it, because carrying paper spreads their capital gain across years instead of realising it all at once.</p>
    <p>The reason to lead with the relationship rather than the term sheet is that the seller has to want you to succeed — their security is the building you are about to change. Show them the plan, the rent roll you expect, and the reserve. A seller who understands the plan will take a rate a bank would not.</p>
    <p><b>The doctrine.</b> Before you walk from a deal on financing, ask the question. The worst outcome is a no, and you were leaving anyway.</p>`,
    drill:{q:'A property is cash-flow negative at 6.5% bank debt but positive at 4.5%. The seller owns it free and clear and is retiring. The move is:',
      opts:['Walk away','Ask whether they would carry paper at 4.5%, and bring the plan and the reserve to the conversation','Offer less','Find a cheaper lender'],
      a:1, why:'A retiring owner with no mortgage is the textbook seller-carry counterpart: they are choosing between a lump-sum taxable gain and a steady secured yield. Ask, and bring the plan — their security is your execution.'}},
   {id:'c3', t:'Other people’s money changes what you owe, not just what you have', body:`
    <p>The moment you take outside capital, your job changes. You are no longer an investor making decisions for yourself; you are a fiduciary making them for someone who trusted you, and the standard of care and disclosure goes up sharply.</p>
    <p>Practically that means: written terms before money moves, a clear statement of what the investor gets and in what order, honest downside cases and not just the base case, separate bank accounts, and reporting on a schedule you keep even in a bad quarter — especially in a bad quarter.</p>
    <p>It also means securities law is now in the room. Pooling money from passive investors is generally the sale of a security, and the exemptions have real requirements. This is the point at which a securities lawyer stops being an expense and becomes the cheapest insurance in the deal.</p>
    <p><b>The doctrine.</b> Raise money only for a deal you would do with your own, on terms you would accept if you were on the other side of them. And say the hard number out loud before the wire, not after.</p>`,
    drill:{q:'You are raising from three passive friends for a fourplex rebuild. The first thing to do is:',
      opts:['Send the pro-forma and collect wires','Get written terms and securities advice before any money moves, and present the downside case alongside the base case','Take the money and paper it later','Give them equity and sort out reporting once it stabilises'],
      a:1, why:'Passive money in a pooled deal is generally a security, and "we will paper it later" is how friendships and licences end. Terms and advice first; downside case in the same document as the base case.'}}
  ]},
  {id:'ops', name:'Operations & the rent roll', slot:5,
   blurb:'The pro-forma is a hypothesis. Operations is the experiment that tests it every month.',
   modules:[
   {id:'o1', t:'The rent roll you inherit is not the rent roll you underwrote', body:`
    <p>Underwriting uses an index — a typical rent for a ZIP. Operations uses leases, and leases have people, terms, arrears, concessions, and in many places a legal ceiling on how fast they can move.</p>
    <p>Before you close, read every lease and reconcile it to the bank statements. Not the seller's rent roll — the deposits. The gap between what a rent roll claims and what actually landed is where the seller's optimism lives.</p>
    <p>Then check what you are allowed to do. This app flags rent regulation per property because it is the difference between "this rent is 30% under market" being an opportunity and being a permanent condition. Under regulation, the under-market rent is the asset's actual income for as long as that tenant stays, and the upside only arrives on turnover — which you cannot schedule and should not try to force.</p>
    <p><b>The doctrine.</b> Underwrite today's documented rent. Treat the gap to market as a call option with no expiry date and no guarantee of exercise, and never as income.</p>`,
    drill:{q:'A 1979 San Francisco fourplex has rents 35% under the ZIP index. The correct underwriting is:',
      opts:['Use market rent — the gap will close','Use the documented in-place rent, note the rent ordinance, and treat the gap as upside on turnover only','Average the two','Use market rent minus 10%'],
      a:1, why:'A pre-1979 San Francisco multifamily is under the rent ordinance. The in-place rent is the income. The gap is real but only realises on a turnover you do not control and must not engineer.'}},
   {id:'o2', t:'Leasing by the bed is a different business', body:`
    <p>Near a campus, the by-the-bed model can raise gross rent on the same building by a third or more. It also changes almost everything else about operating it.</p>
    <p>Turnover goes annual and synchronised — the whole building empties in one week in summer, which is both a scheduling gift for renovation and a cash-flow trough. Wear rises. Guarantors replace credit history. Management intensity roughly doubles: more leases, more deposits, more disputes between co-tenants who did not choose each other.</p>
    <p>And it is frequently regulated. Occupancy caps limiting unrelated adults per dwelling, rental registration, parking minimums per bed, and campus-adjacent overlays all exist specifically because this model exists. A building can be perfect for it and still not be permitted to do it.</p>
    <p><b>The doctrine.</b> Campus proximity is a demand hypothesis, not a rent premium. Before you underwrite a bed count, confirm the occupancy rules at that address, price the management, and model the summer trough honestly.</p>`,
    drill:{q:'A four-plex of 3-bedroom units sits 1.1 km from a 44,000-student campus. Twelve beds at $700 beats four units at $1,500. What must you confirm first?',
      opts:['That students want it','Whether the occupancy code, rental registration and any campus-adjacent overlay permit leasing that way at that address, and what management costs','The parking','Nothing — the arithmetic is clear'],
      a:1, why:'$8,400 against $6,000 is only real if it is legal and if it survives the management load and the summer vacancy. Occupancy caps on unrelated adults are exactly what stop this model, and they are address-specific.'}},
   {id:'o3', t:'Turnover is the only time the building is honest with you', body:`
    <p>A vacant unit is the one moment you can see the building without a tenant in the way — and the only moment you can raise the rent to market, change the layout, upgrade the systems, or discover what the last occupant was living with.</p>
    <p>Good operators plan for it. A turnover kit, a standing scope, a contractor already scheduled, and a decision made in advance about which improvements pay back within the expected hold. Bad operators treat each turnover as a surprise, take three weeks to decide, and pay the vacancy for the indecision.</p>
    <p>This is also where the value-add thesis actually gets executed. A renovation-on-turnover programme, unit by unit over several years, is lower-risk than a whole-building gut: it is self-funding, it does not require relocating anyone, and each unit tells you whether the rent premium you assumed is real before you commit to the next one.</p>
    <p><b>The doctrine.</b> Decide the turnover scope before the unit is empty. The cheapest renovation is the one already scheduled when the keys come back.</p>`,
    drill:{q:'You own a 12-unit building with rents 20% under market and a thesis of renovating on turnover. Two units come vacant in the same month. The disciplined move is:',
      opts:['Renovate both immediately to prove the thesis','Renovate one to the standing scope, lease it, measure the actual rent premium and days on market, then decide about the second','Wait for all twelve','Raise rents on the occupied units'],
      a:1, why:'The first renovated unit is your experiment. It costs one unit of vacancy to learn whether the premium you underwrote is real, and that answer is worth more than a month of speed.'}}
  ]},
  {id:'tax', name:'Holding, tax & exit', slot:7,
   blurb:'What you keep, not what you make. General information only — not tax or legal advice.',
   modules:[
   {id:'t1', t:'Depreciation is why real estate returns are not what they look like', body:`
    <p>The tax code lets you deduct the wearing out of the building — not the land — over a fixed life, even in years when the building is worth more than you paid. That non-cash deduction is why a property can distribute cash to you and still show a tax loss, and it is a large part of the after-tax return that never appears in a cap rate.</p>
    <p>Two consequences worth internalising early. First, the land portion is not depreciable, so a market where land is most of the value gives you less of this benefit than a market where the building is — which is one quiet reason the same cap rate is not the same return in two cities. Second, depreciation is recaptured when you sell. It is a deferral, not a gift, and treating it as permanent is how an exit produces a tax bill nobody budgeted for.</p>
    <p><b>The doctrine.</b> Understand it, use it, and never let it be the reason you buy. A deal that only works after tax is a deal that depends on a tax code that can change.</p>`,
    drill:{q:'Two buildings, same price, same cap rate. In one, the assessor allocates 70% of value to land; in the other, 30%. All else equal:',
      opts:['Identical after-tax returns','The 30%-land building has a larger depreciable basis and therefore a larger annual non-cash deduction','The 70%-land building is better','Land allocation does not affect tax'],
      a:1, why:'Only the improvement depreciates. A larger improvement share means a larger annual deduction — worth knowing when you compare a cap rate across two very different land markets. Confirm allocation and treatment with your own tax adviser.'}},
   {id:'t2', t:'The exit is priced by the next buyer’s debt, not by your work', body:`
    <p>You control the income. You do not control the cap rate that turns that income into a price, and the cap rate is mostly a function of what debt costs the next buyer.</p>
    <p>This is the trap in every value-add pro-forma: the plan assumes the building sells at the cap rate that prevailed when the plan was written. If rates rise a point between purchase and exit, cap rates typically follow, and the same net operating income is worth materially less. A project whose entire return depends on the exit cap holding is a bet on interest rates with a construction project attached.</p>
    <p>The defence is to make the income do the work. If the stabilised building covers its debt and pays you at the cap rate you bought at, you can hold through a bad exit window. If it only works on the sale, you must sell on someone else's schedule.</p>
    <p><b>The doctrine.</b> Underwrite the exit at a cap rate worse than today's. If it still clears, you have a deal. If it only clears at today's, you have a forecast.</p>`,
    drill:{q:'Your rebuild returns 18% on cost at a 6.5% exit cap. At 7.5% it returns 2%. The right conclusion is:',
      opts:['It is an 18% deal','The return is mostly a bet on the exit cap — check whether the stabilised building pays you while you hold, because that is what lets you refuse a bad exit','Sell faster','Use 6.5% — it is today’s number'],
      a:1, why:'A one-point move erasing sixteen points of return means the exit assumption, not your work, is producing the return. The building’s own coverage is what buys you the right to wait.'}}
  ]},
  {id:'found', name:'Foundations — how a building pays', slot:1,
   blurb:'Before any spreadsheet: the four separate ways a building returns money, why they behave differently, and why confusing them is the most common way people lose in this trade.',
   modules:[
   {id:'f1', t:'A building pays four different ways, and they are not interchangeable', body:`
    <p>Every return on a rental property comes from exactly four places. They arrive at different times, carry different risk, and are taxed differently. Treating them as one number is how a deal that looks good becomes a deal that starves you.</p>
    <p><b>1. Cash flow.</b> Rent collected, minus everything it costs to operate, minus the debt service. This is the only one that shows up in your bank account every month, and the only one that pays you if you never sell. It is also the only one you can verify from a rent roll and twelve bank statements.</p>
    <p><b>2. Amortisation.</b> Each mortgage payment retires a slice of principal. Your tenant is buying the building for you a few hundred dollars at a time. It is real, it is predictable to the dollar from an amortisation schedule, and it is completely invisible until you sell or refinance.</p>
    <p><b>3. Appreciation.</b> The building becomes worth more. This is the one everybody talks about and the only one you do not control. It is a market outcome, not a plan. In this catalogue you can watch it happen — the replay slider moves the whole app month by month — and you can also watch it not happen.</p>
    <p><b>4. Tax treatment.</b> Depreciation is a deduction you take against income for wear you did not pay cash for this year. It can make a property that produced real cash show a paper loss. Rules, limits and recapture are specific and personal; your adviser governs.</p>
    <p><b>The doctrine.</b> Underwrite on cash flow. Count amortisation. Treat appreciation as upside you did not pay for. Never buy a negative number today on the strength of a number the market has to hand you later — that is not investing, it is a bet with a mortgage attached.</p>
    <p><b>Where this bites in this app.</b> Of 73,826 Bay Area records, zero are cash-flow positive at present rents and prevailing financing. That is not a bug in the screen, it is the finding: an entire market where the only available return is the one you do not control. The Louisiana and corridor editions exist because that is not true everywhere.</p>`,
    drill:{q:'A property loses $180 a month after debt service, but the loan retires $610 of principal a month and the area has been appreciating. The most defensible reading is:',
      opts:['It makes money — $610 minus $180 is $430 a month','It loses $180 a month in cash and builds $610 of equity you cannot spend; whether that trade is acceptable depends on how long you can fund the loss','It makes money because it will appreciate','It is a bad deal because cash flow is negative'],
      a:1, why:'Amortisation is real but illiquid — it does not pay a roof or a vacancy. The honest statement keeps the two separate and then asks the only question that matters: can you fund the monthly gap for as long as you need to hold? Deals do not usually fail on the math, they fail on the runway.'}},
   {id:'f2', t:'What counts as an asset in this doctrine', body:`
    <p>The everyday accounting definition — a thing you own that has value — is true and nearly useless for deciding what to buy. Locator.X uses a narrower working test.</p>
    <p><b>The test.</b> An asset is something whose cash flows you can name, source and defend before you own it. If you cannot write down where the money comes in, what it costs to keep it coming, and what happens to both if the market goes sideways, you do not have an asset, you have a position.</p>
    <p>By that test a fourplex with a verified rent roll and twelve months of bank statements is an asset. The same fourplex with a seller-supplied pro forma and no statements is a position, until you have made it one or the other. A lot zoned for multifamily is neither — it is an option on a construction project you have not priced.</p>
    <p><b>Why this matters for the screens in this app.</b> Several of the corridor sources publish zoning but no use class. A record there says the district permits multifamily. It does not say a building stands on it. The classification field on those records reads "Zoned for…" precisely so the distinction cannot be lost, and the ranker scores a permission below a recorded use. When you see that phrase, you are looking at an option, and options are priced differently from buildings.</p>
    <p><b>The liability half.</b> The same test run backwards: anything whose costs you cannot name will eventually name them for you. Deferred capital expenditure is the classic — a roof at end of life is a liability sitting inside an asset, and it is invisible on every document except the one you get by climbing onto it.</p>`,
    drill:{q:'A listing shows a parcel classified "Zoned for Multi Family" with an assessor market value and no year built, no unit count and no building area. What do you actually have?',
      opts:['A multifamily building at a known value','A parcel whose district permits multifamily — an option on a project, not a verified building','A vacant lot','Insufficient information to say anything at all'],
      a:1, why:'The zoning is real information and so is the value; what is absent is any evidence of what stands there. That is an option on a development or conversion, and it should be underwritten as a construction project, not as an income property.'}},
   {id:'f3', t:'Income you work for, income the building works for', body:`
    <p>The practical distinction is not moral, it is structural: how much of the income stops when you stop.</p>
    <p><b>Labour income</b> stops when you do. It is the highest-certainty money most people will ever have and it is the thing that qualifies you for the loan. Nothing in this doctrine treats a job as a problem to escape; a stable income is the collateral that makes the first acquisition possible at all.</p>
    <p><b>Operating income</b> continues while the building is tenanted and managed — by you or by someone you pay. It does not run itself. The management line in a pro forma is not optional even when you self-manage; if you leave it out, you are paying yourself nothing and calling it profit.</p>
    <p><b>The honest arithmetic.</b> Replacing a salary with rents takes far more equity than most projections assume, because the number that has to be replaced is net of the costs the salary was quietly covering — health cover, retirement contributions, the vacancy you can absorb because a paycheque is arriving. Run the replacement number against net cash flow after management, capital reserve and a real vacancy assumption, never against gross rent.</p>
    <p><b>The doctrine.</b> Build operating income while labour income is still funding the reserve. The order matters: the reserve is what lets you hold through the month a boiler fails and a unit turns in the same week, and holding through that month is the whole game.</p>`,
    drill:{q:'A portfolio grosses $9,000 a month in rent. Which figure should be compared against the salary someone wants to replace?',
      opts:['The $9,000 gross','Gross less debt service','Net cash flow after operating expenses, debt service, management, a capital reserve and a realistic vacancy allowance','Net operating income'],
      a:2, why:'Gross rent is not income, and NOI is before debt service. Only the number left after every real cost — including management you may currently be donating and the reserve you will certainly need — is comparable to a paycheque.'}}]},

  {id:'read', name:'Reading the numbers', slot:6,
   blurb:'NOI, cap rate, cash-on-cash, DSCR — what each one actually measures, which are comparable across deals, and the specific ways a pro forma is built to mislead.',
   modules:[
   {id:'r1', t:'NOI, and the four things people leave out of it', body:`
    <p>Net operating income is gross scheduled rent, less vacancy and credit loss, less operating expenses, <i>before</i> debt service, depreciation, capital expenditure and income tax. It is the number the whole valuation stack rests on, which is exactly why it gets shaded.</p>
    <p><b>Left out, in order of frequency.</b> <b>Management</b> — omitted whenever the seller self-manages; put it back at market rate whether or not you intend to hire, because the building must be able to pay for its own management or it is a job, not an asset. <b>Vacancy</b> — a pro forma at 100% occupancy is describing a wish. <b>Capital reserve</b> — technically below the NOI line, but a building with a 25-year roof at year 24 has a cost that is certain and merely undated. <b>Repairs shaded as capital</b> — moving routine maintenance into a capital account flatters NOI while changing nothing about the building.</p>
    <p><b>The reconstruction.</b> Never accept a seller's NOI. Rebuild it: actual rents from the rent roll and leases, vacancy from the market rather than from the building's last twelve lucky months, taxes at what they will be after your purchase reassesses rather than what the seller pays, insurance at a real quote, management at market. The gap between the seller's number and yours is the negotiation.</p>
    <p><b>Reassessment is where this app is emphatic.</b> A long-held property under an assessment cap can carry a tax line a fraction of what a buyer will pay. An assessed basis is never a discount available to you — it is the seller's history, and it usually resets on sale.</p>`,
    drill:{q:'A seller shows NOI of $84,000. You find they self-manage, the roof is at end of life, and property tax will roughly double on reassessment. Your NOI is most likely:',
      opts:['$84,000 — NOI is a standardised figure','Higher, since you will manage it yourself','Materially lower, once management is priced at market and taxes are set at the post-sale figure — and separately there is a dated capital cost the NOI line never shows','Unknowable'],
      a:2, why:'Two of those corrections hit NOI directly and both push it down. The roof does not hit NOI at all — it is a capital item — but it is a real, certain cost, which is why it belongs in the offer even though it never appears in the cap-rate math.'}},
   {id:'r2', t:'Cap rate is a market opinion, not a property fact', body:`
    <p>Capitalisation rate is NOI divided by price. Read it as the market's current opinion of what a dollar of that income stream is worth, in that submarket, for that asset class, at this moment.</p>
    <p><b>What moves it.</b> Perceived risk, prevailing interest rates, and expected rent growth. A low cap rate is not automatically an overpriced building — it usually means buyers expect rents to rise or consider the income unusually safe. A high cap rate is not automatically a bargain — it often means the market has priced in something you have not found yet.</p>
    <p><b>The circularity to watch.</b> If you compute cap rate from a seller's inflated NOI, you get an inflated valuation and a rate you cannot compare to anything. Cap rates are only comparable when the NOIs behind them were built the same way — which, across brokers, they never are.</p>
    <p><b>Where it stops working.</b> Cap rate ignores financing entirely, so it says nothing about whether the deal works for <i>you</i> at <i>your</i> cost of debt. Two buyers can rationally pay different prices for the same income. It also ignores capital expenditure, so a building at a 7 cap needing a $400,000 envelope is not a 7 cap in any sense you can spend.</p>`,
    drill:{q:'Building A trades at a 4.2% cap in a coastal market, Building B at an 8.1% cap in a smaller inland one. Which is the better buy?',
      opts:['B — the higher cap rate means a better return','A — low cap rates indicate a safe market','Not answerable from cap rate alone; the spread is mostly compensation for different risk, growth and liquidity, and neither figure is comparable until both NOIs are rebuilt the same way','Whichever has better appreciation'],
      a:2, why:'The spread between those two numbers is the market paying you to accept something — thinner tenant demand, slower resale, more capital risk. Cap rate tells you the price of income; it does not tell you whether you want that income.'}},
   {id:'r3', t:'Cash-on-cash and DSCR — the two numbers that decide if you survive', body:`
    <p><b>Cash-on-cash</b> is annual pre-tax cash flow divided by the actual cash you put in — deposit, closing costs, and every dollar of initial capital work. It is the only common metric that reflects your financing, and therefore the only one that answers "what does this do for me".</p>
    <p><b>Debt service coverage ratio</b> is NOI divided by annual debt service. At 1.00 the building exactly pays its mortgage and nothing else. Most commercial lenders want 1.20 to 1.25 — the building must produce a fifth more income than the loan consumes. That margin is not the lender being greedy; it is the buffer that absorbs a vacancy without a default.</p>
    <p><b>Compute DSCR before you fall in love.</b> It is the fastest disqualifier in the trade and it takes one line. It also tells you the maximum loan the building will support, which is often a smaller number than the maximum loan you personally qualify for — and when those two disagree, the building is right.</p>
    <p><b>The stress test that matters.</b> Recompute DSCR at a rate 200 basis points higher and at 90% of your assumed rents, together. If the deal only survives at today's rate and full occupancy, it is not a deal, it is a bet on two things at once staying still.</p>`,
    drill:{q:'A property produces NOI of $61,000 against annual debt service of $58,000. What does the 1.05 DSCR tell you?',
      opts:['It is profitable, so the deal works','It clears the mortgage by about 5% — roughly three weeks of one unit vacant erases the margin, and most lenders will not fund it','It is a 5% return','Nothing without the cap rate'],
      a:1, why:'A 1.05 coverage ratio means almost nothing stands between an ordinary operating surprise and paying the mortgage out of pocket. Lenders require 1.20+ because that gap is where defaults live, and their threshold is better calibrated than most first-time optimism.'}}]},

  {id:'lev', name:'Leverage & the cost of money', slot:9,
   blurb:'Debt magnifies whatever is already true about a deal. This track is about how it works, what it costs, and the specific moments it turns from tool to trap.',
   modules:[
   {id:'l1', t:'Leverage magnifies the outcome, not the quality', body:`
    <p>Borrowing lets a given amount of equity control a larger asset, so every percentage outcome — good and bad — lands harder on the money you actually put in.</p>
    <p>Put $100,000 into a $100,000 building that gains 5% and you made $5,000, a 5% return on your cash. Put the same $100,000 down on a $400,000 building that gains 5% and the gain is $20,000 — 20% on your cash, less the interest you paid for the privilege. The identical mechanism runs in reverse: a 5% decline erases $20,000 of a $100,000 stake.</p>
    <p><b>The asymmetry that is easy to miss.</b> On the upside leverage is merely arithmetic. On the downside it interacts with a covenant. Losses do not just reduce your equity, they can breach a coverage ratio or a loan-to-value test and force a sale at exactly the moment prices are worst. That is the difference between an investment that goes down and one that goes away.</p>
    <p><b>The doctrine.</b> Leverage a cash-flowing asset, never a thesis. Debt on a building that pays its own way is a tool. The same debt on a building that needs a market move to work converts an opinion into an obligation, and the obligation is due monthly whether or not the opinion comes true.</p>`,
    drill:{q:'Two identical buildings, one bought all cash, one at 75% loan-to-value. Values fall 20%. What is the meaningful difference?',
      opts:['Neither owner is affected until they sell','The leveraged owner has lost 80% of their equity and may breach a loan covenant, which can force a sale at the worst moment; the cash owner has lost 20% of value and can simply hold','The leveraged owner loses more only if they sell','Leverage protects against downturns'],
      a:1, why:'The loss percentage is the least of it. Leverage removes the option to wait, and the option to wait is the single most valuable thing a property owner has in a downturn.'}},
   {id:'l2', t:'What the loan actually costs, beyond the rate', body:`
    <p>The interest rate is the most visible term and rarely the most expensive one.</p>
    <p><b>Amortisation period</b> sets the payment and therefore the DSCR. A 30-year schedule and a 20-year schedule at the identical rate produce very different monthly obligations and very different coverage.</p>
    <p><b>Term versus amortisation.</b> Most commercial loans amortise over 25 or 30 years but mature in 5, 7 or 10. At maturity the remaining balance is due and you must refinance — at whatever rate exists on that day, against whatever value the building has then. A loan maturing into a bad market is the most reliably fatal risk in income property, and it is fully visible at purchase.</p>
    <p><b>Recourse</b> decides whether a failure reaches your other assets. <b>Prepayment penalties</b> and defeasance can make an early exit cost six figures. <b>Reserve requirements</b> tie up cash you were counting as liquidity.</p>
    <p><b>The doctrine.</b> Underwrite the maturity, not just the payment. Write down the year the balance comes due, the balance at that date from the amortisation schedule, and what the building must be worth and earning to refinance it. If that requires a market better than today's, you have a dated problem, and you should know its date.</p>`,
    drill:{q:'A 7-year term amortising over 30 years at a comfortable payment. The single most important thing to model is:',
      opts:['The monthly payment','The interest rate','The balance outstanding in year 7 and whether the building can support a refinance of that balance at a plausibly higher rate','The closing costs'],
      a:2, why:'The payment is affordable by construction — the lender checked. What nobody checks for you is the refinancing event seven years out, where the balance is large, the rate is unknown, and the value is whatever the market decides. That is the risk you are actually taking.'}},
   {id:'l3', t:'The reserve is the position', body:`
    <p>Most property losses are not valuation losses. They are liquidity losses — an owner forced to sell or default because cash ran out during a period the asset itself was fine.</p>
    <p><b>What the reserve is for.</b> Turnover between tenants. A capital failure that will not wait. A rate reset. A stretch of vacancy that lasts a quarter rather than a month. None of these are unusual; they are the ordinary operating weather of owning buildings, and they arrive together more often than probability alone would suggest.</p>
    <p><b>Sizing it.</b> A defensible floor is six months of full debt service and fixed costs per property, plus the cost of the largest single capital item within five years of end of life. That last figure comes from an inspection, which is why the inspection is worth more than its fee.</p>
    <p><b>The doctrine.</b> A deal you can only close by spending the reserve is a deal you cannot close. This is the most commonly ignored rule in the trade and the most expensive one — the buyer who stretches on the deposit is the buyer who sells at the bottom, and they are usually the same person who was right about the building.</p>`,
    drill:{q:'A purchase pencils, but closing consumes every liquid dollar including what was set aside as reserve. The correct read is:',
      opts:['Acceptable — the property cash-flows from month one','The deal is unfunded; being right about the building does not help if an ordinary vacancy or capital failure forces a sale','Fine if the property is in a strong market','Fine if there is a home equity line available'],
      a:1, why:'Cash flow from month one assumes month one is normal. The reserve exists precisely for the months that are not, and buying without it converts every routine operating event into an existential one.'}}]},

  {id:'mkt', name:'Markets, jobs & where the money is going', slot:10,
   blurb:'Why announced capital moves rents, how long the lag is, what supply does to the thesis, and how to read the corridor screens in this app without over-reading them.',
   modules:[
   {id:'m1', t:'From an announcement to a rent, and how long that takes', body:`
    <p>An announced plant does not raise rents. A sequence does, and each step can fail.</p>
    <p><b>The chain.</b> Announcement → site work and construction employment (temporary, often housed differently) → hiring and relocation → household formation → absorption of existing units → rent pressure → new supply → equilibrium. From announcement to measurable rent effect is commonly two to five years, and the construction-employment phase can look like demand while being nothing of the kind.</p>
    <p><b>Where it breaks.</b> Projects are cancelled, delayed, or scaled back after the press release, and the press release is what the data captures. Announced job counts are the company's own figure, usually stated over a ten-year ramp, and rarely restated downward in public. Some roles are filled locally and generate no new household at all.</p>
    <p><b>How this app handles it.</b> Every project carries its announcement date, its source link and its stated job count as an announced figure, never as a delivered one. Proximity to announced capital is one term in the ranking, deliberately decaying with distance — it is a reason to look, never a reason to buy.</p>
    <p><b>The doctrine.</b> Trade the absorption, not the announcement. By the time an announcement is in a headline it is in the asking prices; what is not yet priced is whether the units actually fill, and that is visible in vacancy and days-on-market long before it is visible in a chart.</p>`,
    drill:{q:'A gigafactory announcement promises 3,000 jobs over ten years. Nearby asking prices jump 15% within a quarter. The most defensible position is:',
      opts:['Buy immediately before prices rise further','The announcement is already in the price; what is not priced is delivery and absorption — watch vacancy, permits and actual hiring, and be willing to conclude the trade has passed','Wait for the plant to open','Ignore it — announcements never matter'],
      a:1, why:'Announcements are public and instantly capitalised into asking prices. The edge is never in knowing the announcement; it is in judging delivery — and in being willing to walk when the price has already moved past the thesis.'}},
   {id:'m2', t:'Supply is the thing that kills the thesis', body:`
    <p>Demand growth gets the attention. Supply response decides the outcome.</p>
    <p><b>The mechanism.</b> Rising rents in a market that permits easily attract construction. New supply delivers in two to three years, and if it lands after the demand shock has run its course, rents flatten or fall exactly when the pro forma assumed growth. The markets that hold rent gains are the ones that cannot easily build — for reasons of zoning, land, geography or cost.</p>
    <p><b>How to read the signal.</b> Permits per capita is the sharpest available tell, and this app carries the trailing-twelve-month private housing units authorised for every corridor. Rank a corridor by capital <i>and</i> by how freely it can build, and the two rankings will disagree. That disagreement is the finding — high capital plus a constrained pipeline is a different investment from high capital plus a permissive one.</p>
    <p><b>Student housing is a specific case.</b> Enrolment is a demand floor that does not track the general economy, and campuses cannot relocate. But the walkable radius around a campus is genuinely fixed, which makes the constraint physical rather than regulatory. That is why the campus layer in this app scores a walk band, a bike band and a commuter band separately rather than a single distance.</p>`,
    drill:{q:'Two corridors have identical announced capital. One authorised 35,000 housing units last year, the other 4,000. What does that most likely mean?',
      opts:['The first is the better market — more construction means more growth','The second is more likely to convert the demand into sustained rent growth, because supply cannot respond as quickly; the first will likely see gains competed away','They are equivalent','The second is stagnant'],
      a:1, why:'A permissive market answers a demand shock with buildings, which is good for the region and bad for the rent line. A constrained one answers it with price. Neither is virtuous; they are different investments and should be underwritten differently.'}},
   {id:'m3', t:'Reading these screens honestly', body:`
    <p>This app puts several hundred thousand records on a map. That volume is a research surface, not a recommendation, and the distinctions below are the ones that keep it useful.</p>
    <p><b>A value is not a price.</b> Almost every record here carries an assessor's figure — full cash value in Arizona, market value in Ohio and North Carolina, full market value in New York, appraised value in Nevada, statutory market value in Louisiana. Each is an assessment, not a listing and not a transaction. Where a genuine recorded sale price exists it is carried separately and labelled, and in one county the sale price survives while the sale <i>date</i> does not — making those prices unusable as comparables.</p>
    <p><b>A zoning is not a use.</b> Several sources publish what a district permits and nothing about what stands there. Those records say "Zoned for…" and the ranking scores them below records with a verified use. Do not count them as inventory.</p>
    <p><b>An absence is not a zero.</b> Reno shows fewer records than other corridors because the county holds fewer multifamily parcels — that is the ceiling, not a sampling choice. Two counties of the Albany metro are missing because the state layer does not publish them. Boone County, where the largest Indiana capital sits, publishes no parcel API at all. Every one of these is stated on the corridor panel rather than smoothed over.</p>
    <p><b>The doctrine.</b> A screen narrows the field to what is worth a phone call. It never replaces the walk-through, the rent roll, the bank statements or the inspection. Every figure in this catalogue is a reason to investigate and none of them is a reason to buy.</p>`,
    drill:{q:'A corridor shows 5,688 records where others show 25,000. The correct inference is:',
      opts:['The pull failed and should be rerun','The county holds fewer qualifying parcels than the target — it is a real ceiling, and the panel says so','That corridor is less valuable','The data is lower quality there'],
      a:1, why:'A smaller count can mean a smaller market or a thinner source, and those are different facts with different consequences. This app states which one applies for every area — the discipline is to read that note rather than infer from the number.'}}]},
  {id:'cases', name:'Case studies — the documented record', slot:11,
   blurb:'Five real businesses, built only from published filings, court opinions and reporting. What the record actually shows about structure — including two expensive failures, which teach more than the wins.',
   modules:[
   {id:'c0', t:'How to read this track', body:`
    <p>Every claim in these five case studies carries a source, and each is marked one of three ways. <b>Documented</b> means a government filing, a court opinion, a company or official newsroom, or an established news organisation. <b>Reported</b> means it traces to the subject's own statement or a press release rather than an independent record — often true, never verified. <b>Disputed</b> means credible sources give materially different figures, and both are shown.</p>
    <p><b>What this track is not.</b> These are not endorsements, and no affiliation with any named person or company is implied or exists. Nothing here was licensed, adapted or reskinned from anyone's book, course or programme — the doctrine is Locator.X's own, and these are public-record case studies used to test it. Company and brand names appear as facts of corporate history; they are the trademarks of their owners.</p>
    <p><b>Why these five.</b> They were picked for structural variety, not fame: one about owning the underlying asset rather than a royalty on it, one about carrying cost, one about assembling a position, one about a house rule that governed conduct for sixty years, and two failures — a great investor wrong in the same year he was famously right, and a five-billion-dollar deal undone by a legal fact nobody priced.</p>
    <p><b>Read the failures first if you only read two.</b> Success stories are over-determined; you cannot tell which decision carried the outcome. A failure usually has one identifiable cause, which is why it teaches.</p>`,
    drill:{q:'A widely repeated figure about a business traces, when you follow it back, only to an interview with the founder. How should it be used?',
      opts:['As fact — the founder would know','As a reported claim, labelled as sourced to the founder, and never as the basis for a decision','Discarded entirely','As fact if several outlets repeat it'],
      a:1, why:'Founders are the best-informed and the most interested party at the same time. Repetition across outlets is not corroboration when every outlet is quoting the same interview. Use it, label it, and do not underwrite on it.'}},

   {id:'c1', t:'Owning the thing, not a percentage of the thing', body:`
    <p>In 1996 Percy Miller signed a distribution deal with Priority Records for his No Limit label under which <b>he retained ownership of his master recordings</b> — documented by the Louisiana Endowment for the Humanities' state encyclopedia. The trade press reports the split at 85/15 in No Limit's favour, but that figure traces to Miller's own account rather than to a contract or filing, so treat it as <b>reported</b>, not established.</p>
    <p><b>The structural point survives whether or not the percentage is exact.</b> A distribution deal buys a service. A record deal in the ordinary form buys the asset. Miller kept the asset and rented the pipe. The proof came in 2001: when he ended the Priority arrangement, he moved distribution to Universal and carried the catalogue with him. An artist who had sold his masters could not have done that — he would have had to leave them behind.</p>
    <p><b>The exact same distinction runs through property.</b> Owning a building and hiring a manager is Miller's structure. Owning a share of someone else's syndication is the other one. Both can make money. Only one of them lets you fire the operator and keep the asset, and that difference is invisible in a good year and decisive in a bad one.</p>
    <p><b>What the record does not show.</b> Miller is frequently described as a substantial real-estate owner in Louisiana. <b>No specific holding — no address, parcel, price or date, in New Orleans, Baton Rouge or anywhere else — could be verified in any source meeting this track's standard.</b> He was named the City of New Orleans' Entertainment Ambassador, which is documented. Widely circulated net-worth figures are excluded here entirely; they originate with valuation sites that publish no method.</p>
    <p><b>The doctrine.</b> Ask of any deal: at the end of it, who owns the asset? Every other term is negotiable. That one is the deal.</p>`,
    drill:{q:'An operator offers you 30% of the cash flow of a building they will own and manage, versus owning the building outright and paying them 8% of collections to manage it. Structurally, the important difference is:',
      opts:['The 30% is better because it requires no capital','In the second structure you own the asset and can replace the manager; in the first you own a claim on someone else’s asset and your only remedy is to exit','They are equivalent if the cash flows match','The first is safer because the operator carries the risk'],
      a:1, why:'Matching cash flows in year one tells you nothing about year five. Ownership is what determines who decides — whether to refinance, when to sell, and whether a bad operator can be removed. A claim on cash flow has none of those rights attached.'}},

   {id:'c2', t:'The carry is what kills you, not the purchase price', body:`
    <p>Curtis Jackson bought a roughly 51,657-square-foot estate in Farmington, Connecticut from Mike Tyson for <b>$4.1 million</b> (sources disagree on the year — CBS reports 2003, the Boston Globe 2004). He listed it in <b>2007</b> and sold it in <b>April 2019</b> for <b>$2.9 million</b>. Roughly twelve years on the market.</p>
    <p><b>First, a correction that matters more than the story.</b> The widely run "84% loss" headline measures the sale against the <b>2007 asking price</b> of $18.5–18.7 million, not against what he paid. Against his actual basis of $4.1 million, a $2.9 million sale is a loss of about <b>29%</b>. An asking price is not a basis, and a number computed against one is not a return. This exact error — measuring against a hoped-for figure instead of a paid one — is one of the most common ways people misjudge their own portfolios.</p>
    <p><b>Now the number that actually matters.</b> Documents connected to Jackson's 2015 bankruptcy filing put the carrying cost of the property at approximately <b>$70,000 a month</b>. Over the twelve years it sat on the market, that is on the order of ten million dollars — several times the headline loss on the sale, and it never appears in any story about the transaction.</p>
    <p>His own account of why he wanted out is about the same thing from the inside: unused areas of the house degraded whether or not anyone was in them. A large asset does not sit still and wait. It consumes.</p>
    <p><b>The doctrine.</b> Purchase price sets the loss you can take. <b>Carrying cost sets how long you can wait to avoid taking it</b> — and time on market is not a choice you make once, it is a bill you pay monthly. Before any purchase, write down the monthly cost of owning it with no income at all, then multiply by the longest realistic marketing period for that asset type in that market. If that number frightens you, the price was never the problem.</p>`,
    drill:{q:'Two properties, each bought for $500,000. One carries at $1,800 a month when vacant, the other at $9,000. Both markets can take two years to sell an asset like this. What is the real difference?',
      opts:['Nothing — the basis is identical','The second consumes about $216,000 over a two-year hold against $43,200 for the first, so its owner is far likelier to be forced into a bad sale','The second is a better asset because it costs more to run','It depends entirely on the sale price'],
      a:1, why:'The carry decides whether you get to choose your exit or have it chosen for you. Two identical bases can produce completely different outcomes purely because one owner can outwait a soft market and the other cannot.'}},

   {id:'c3', t:'Assembling the position before the subsidy arrives', body:`
    <p>This one sits inside this catalogue's own data — Shreveport-Bossier City is a live corridor here, and the parcels below are checkable against it.</p>
    <p><b>The sequence is the lesson.</b> The Shreveport project was announced publicly in <b>April 2024</b>. The Advocate, working from Caddo Parish records, mapped the actual purchases: entities connected to Jackson recorded downtown Shreveport property totalling <b>$4,646,122</b> — with addresses on Texas Street, Commerce Street, Market Street and Spring Street — acquired quietly between <b>May 2024 and December 2025</b>, an earlier report describing the buying as primarily cash. The Cooperative Endeavor Agreement with the State of Louisiana was finalised on <b>12 January 2026</b>: <b>up to $50 million in performance-based state funding</b> against roughly <b>$74 million</b> of private investment, for a stated total over $124 million.</p>
    <p><b>Read the order of those dates.</b> The land was assembled before the public money closed. Whatever else is true, that is how site assembly works everywhere: once a subsidy is announced, every remaining parcel reprices, and the assembler who waits pays the premium they created.</p>
    <p><b>Three constraints in this deal are worth more than the headline.</b></p>
    <p><b>The stall came from a site the developer did not own.</b> Occupancy of the leased former Millennium Studios campus was blocked from June 2023 by flooding and drainage at a <b>city-owned</b> site, with the city short of the funds to fix it. A risk sitting on the counterparty's balance sheet is still your delay.</p>
    <p><b>Lease term is a financing term.</b> G-Unit sought a <b>99-year</b> lease rather than the shorter term on offer specifically because a long leasehold was required to obtain bank financing; the city council approved it unanimously on <b>14 May 2026</b>. (Sources disagree on the length of the lease it replaced — 45 years per KTBS, 30 per BIZ Magazine.) Nothing about the building changed. Only the term did, and the term was what made it financeable.</p>
    <p><b>The subsidy is conditional and the conditions escalate</b> — two produced titles on a combined $5 million budget in year one, rising to seven productions and $25 million by year five, with Louisiana-resident labour rising to 80% by year three. Performance-based money is a loan against future behaviour, not a grant.</p>
    <p><b>Status as of this build, stated plainly.</b> It is <b>under construction and nothing is open</b>. At a June 2026 briefing to state officials the developer's own estimates were G Stage Arena 20–25% complete, G-Unit Studios about 10%, the G-Dome 15–20%. The projected $18.8 billion, 6,000-job, twenty-year impact is an <b>advocacy figure from a commissioned study</b>, not an outcome. And the surrounding incentive got tighter, not looser: Louisiana's film credit cap was reduced to <b>$125 million</b> for applications on or after 1 July 2025, with rollover eliminated.</p>
    <p><b>The doctrine.</b> Buy before the announcement or accept that you are paying for it. Then underwrite the three things that actually gate delivery — who controls the site, how long the ground lease runs, and what the money is conditioned on — because none of them appear in the press release.</p>`,
    drill:{q:'A developer holds a 30-year ground lease on a site and cannot obtain construction financing. The municipality offers to extend the term to 99 years at the same rent. What has changed?',
      opts:['Nothing of substance — the rent and the building are the same','The asset became financeable: lenders need the leasehold to outlast the amortisation with margin, so term length is a capital-access term, not a real-estate detail','The developer now owns the land','The site risk has been eliminated'],
      a:1, why:'A lender will not amortise a thirty-year loan against a thirty-year leasehold, because the collateral expires with the debt. Extending the term changes no physical thing and unlocks the entire capital stack — which is why the Shreveport council vote mattered more than any construction milestone that year.'}},

   {id:'c4', t:'A house rule, and its exact opposite', body:`
    <p><b>The rule.</b> The firm that became Coldwell Banker was founded in San Francisco on <b>27 August 1906</b> as Tucker, Lynch &amp; Coldwell, four months after the earthquake and fire. Those fires destroyed the public land records, so ownership itself became uncertain, and brokers exploited the confusion — reporting from SFGate and NBC News describes false "For Sale" signs planted on rubble and property bought cheaply from frightened owners to be flipped. Colbert Coldwell, then twenty-three, founded the firm expressly against that practice.</p>
    <p>The rule he and Benjamin Banker enforced is the part worth remembering: <b>employees were forbidden from owning property beyond their own residence</b>, on the reasoning that a broker cannot properly represent a client while competing with them for the same asset. That policy reportedly held until the 1970s — roughly sixty years of declining a whole category of profit in order to remove a conflict.</p>
    <p><b>The opposite.</b> Sixty years later Sam Zell built a career on precisely the transaction Coldwell refused. He began buying distressed real estate as a University of Michigan student, founded Equity Finance and Management in 1969, and was known in the industry as <b>"the grave dancer"</b> for acquiring and reviving distressed property in downturns. He took Equity Residential public on the NYSE in <b>August 1993</b>; by 2023 it was an S&amp;P 500 company of roughly $31 billion operating 79,322 apartment units.</p>
    <p><b>Both were right, and the difference is the seat you occupy.</b> Coldwell was an <b>agent</b> — paid to represent someone else's interest, where buying from your own client is a conflict no disclosure fully cures. Zell was a <b>principal</b> — buying with his own money, from willing sellers, at prices that reflected genuine risk he was taking on. Distress is not the ethical question. Whose interest you are paid to protect is.</p>
    <p><b>Know which seat you are in on every transaction</b>, because the answer changes what is permissible, and it can change inside a single deal — the moment you advise someone about an asset you would like to own, you have moved.</p>
    <p><b>A note on the record.</b> Coldwell Banker is an active registered trademark; this is factual corporate history and implies no affiliation or endorsement. The ownership chain: public in 1968, acquired by Sears in 1981, the commercial arm sold in 1989, and — <b>as of 9 January 2026 — its ultimate parent is Compass, Inc.</b>, which completed its acquisition of Anywhere Real Estate on that date. The company's own published history page has not caught up with that.</p>`,
    drill:{q:'You are engaged to advise a client on selling a small apartment building. You conclude it is underpriced and would like to buy it yourself. The defensible move is:',
      opts:['Buy it — you found the value','Disclose your interest, resign the advisory role, and let the client obtain independent representation before you bid, if you bid at all','Buy it through an entity so the conflict does not arise','Advise them to sell at the price, then buy from the purchaser later'],
      a:1, why:'You cannot be paid to get the highest price for a seller while trying to pay the lowest. The 1906 rule solved this by removing the temptation entirely; the modern minimum is disclosure plus stepping out of the advisory seat. Using an entity to obscure the conflict makes it worse, not better.'}},

   {id:'c5', t:'Two ways to lose, and neither was about the building', body:`
    <p><b>The first: being right and wrong in the same year.</b> In a transaction valued at <b>$39 billion</b> — $55.50 a share in cash, with the shareholder vote on 7 February 2007 — Sam Zell sold Equity Office Properties, the largest office owner in the United States, to Blackstone. It is remembered as one of the best-timed exits ever executed. (Some accounts date it 2006 and value it near $36 billion; the deal was announced in late 2006 and closed in early 2007, and the spread reflects assumed debt.)</p>
    <p>In <b>December 2007</b>, the same investor acquired Tribune Company for <b>$13 billion</b>. It filed for bankruptcy roughly a year later.</p>
    <p><b>The same man, the same year, opposite outcomes.</b> The office exit was decades of accumulated judgment about a market he had operated in since he was a student. Tribune was a different industry, on a leveraged structure, at a moment when credit was about to close. A track record is domain-specific and does not travel — and being demonstrably early to the top of one market provides no protection at all in another.</p>
    <p><b>The second: a legal fact nobody priced.</b> In 2006 a group led by Tishman Speyer, including BlackRock and major pension funds among them CalPERS, bought Stuyvesant Town and Peter Cooper Village in Manhattan for <b>$5.4 billion</b>. The business plan required deregulating rent-stabilised apartments and re-letting them at market rents. Residents sued.</p>
    <p>On <b>22 October 2009</b>, in <i>Roberts v Tishman Speyer</i>, the New York Court of Appeals held 5–2 that buildings receiving <b>J-51 tax benefits are excluded from luxury deregulation</b> — the owners had been taking a public subsidy that, as a matter of law, foreclosed the exact business plan the purchase price was based on. <b>The subsidy and the plan were incompatible from the day of purchase.</b> Creditors took the properties on 25 January 2010.</p>
    <p><b>Two proportions make this teach.</b> Tishman Speyer's own equity at risk was <b>$112 million against a $5.4 billion price — roughly 2%</b>. Nearly all of the loss fell on lenders and on public pension funds. And in December 2015 Blackstone and Ivanhoé Cambridge assumed ownership for <b>$5.3 billion</b> — slightly <i>below</i> the 2006 price, nine years later. <b>The buildings were fine the entire time.</b> An analyst at the takeover put it as investors having lost sight of real estate as an income-producing asset.</p>
    <p><b>The doctrine.</b> Neither of these failures was a real-estate failure. One was a capability failure — expertise assumed to transfer. The other was a diligence failure — a legal condition attached to a benefit the property was already receiving, discoverable before closing by anyone who asked what the J-51 filings obliged. <b>Read what the property is already receiving and what it owes in exchange</b>, and be honest about the boundary of what you actually know. Both are free. Neither was done.</p>`,
    drill:{q:'A stabilised apartment building has been receiving a municipal tax abatement for years. Your business plan is to renovate units and raise rents sharply. What must be established before the offer, not after?',
      opts:['The renovation budget','What the abatement legally obliges the owner to do — including any rent regulation it imposes for as long as it is claimed, and what happens if it is surrendered','The market rents nearby','The lender’s appraisal'],
      a:1, why:'This is the Stuyvesant Town failure exactly. A benefit the property receives almost always carries a condition, and that condition can prohibit the plan you are paying for. It is discoverable before closing from the filings, costs nothing, and a five-billion-dollar buyer group skipped it.'}}]},
  {id:'dd', name:'Diligence & risk', slot:8,
   blurb:'The list of things that have killed other people’s deals, so they do not have to kill yours.',
   modules:[
   {id:'d1', t:'Read the building, then read the file', body:`
    <p>Walk it before you read anything, so the file cannot tell you what to see. Roof age, water staining, foundation, the electrical panel, the heat source, the smell of the basement, whether the windows have been replaced and whether it was permitted. Then read the file and reconcile the two.</p>
    <p>The file is: permits and their final sign-offs, open code-enforcement cases, the title commitment and every exception on it, the survey, the flood determination, the insurance loss run, and the leases. Anything unpermitted that you can see is now yours to legalise or remove — and an unpermitted extra unit that the seller counted in the rent roll is the most common version of this in small multifamily.</p>
    <p>This app puts the permit, code-enforcement, deed and flood records for the parcel one click away in the Record Locker, and flags an adjudicated or foreclosure record where the jurisdiction publishes one. Use it before you offer, not after you are in contract.</p>
    <p><b>The doctrine.</b> Every unpermitted improvement is a liability that has not been invoiced yet.</p>`,
    drill:{q:'The rent roll shows five units. The assessor and the permit file both show four. The most likely explanation and the right response:',
      opts:['A recording error — proceed','An unpermitted fifth unit: verify with the building department, price legalisation or loss of that income, and re-underwrite on four units until proven otherwise','The seller added a unit legally and the county is behind','Ignore it — it is rented'],
      a:1, why:'Underwrite the income you can document and defend. If the fifth unit cannot be permitted, it is not income; it is a code case waiting for a complaint, and you will have bought it.'}},
   {id:'d2', t:'Water, in all its forms, is the expensive one', body:`
    <p>Flood zone determines whether a federally backed lender requires insurance and what it costs, and in some markets the premium is large enough to decide the deal on its own. Note that the flood zone on a parcel file is not the governing answer — the effective FIRM panel is, and it is published by FEMA for the address.</p>
    <p>Then there is water that does not come from a river: drainage across the site, a roof at the end of its life, plumbing that predates the current code, and the slow leak behind a wall that shows up as a stain and ends as a structural repair. In older housing stock — which is most of what is interesting in this catalogue — the plumbing and the roof are the two systems most likely to be at the end of their life at the same time.</p>
    <p>Insurance is where all of this lands. Get a real quote, on the real address, before you are committed. In several coastal and flood-exposed markets the premium has moved faster in recent years than rents have, and a pro-forma using last year's insurance number is already wrong.</p>
    <p><b>The doctrine.</b> Price the roof, the plumbing and the actual insurance quote. Those three have ended more small-multifamily deals than interest rates.</p>`,
    drill:{q:'A New Orleans double looks excellent on every metric in the app. Before offering, the single most decision-relevant unknown is usually:',
      opts:['The paint colour','A real insurance quote for that address plus the effective FEMA flood panel and the roof’s remaining life','The neighbours','The cap rate'],
      a:1, why:'In a flood-exposed market the insurance line can move the cash flow by more than any assumption on the underwriting tab, and the flood panel — not a parcel file’s zone label — is what governs the requirement.'}}
  ]}
  ];

  const done=(t,m)=>!!(PR[t]&&PR[t][m]);
  function mark(t,m,ok){ PR[t]=PR[t]||{}; PR[t][m]=ok?1:0; save(); }
  function counts(){ let n=0,d=0; TRACKS.forEach(t=>t.modules.forEach(m=>{ n++; if(done(t.id,m.id)) d++; })); return {n,d}; }

  let openId=null, wired=false, lastSig='';
  const safe=id=>id.replace(/\./g,'_');

  /* Render is split in two so the Academy stays fast as the Tradecraft library
     grows. The SHELL (tracks + lesson buttons) is built once per meaningful
     state change; lesson BODIES — which are by far the bulk of the markup — are
     inserted lazily the first time a lesson is opened and then kept in the DOM,
     so toggling is a class change rather than a full rebuild. Clicks are handled
     by one delegated listener on the host instead of re-attaching a listener per
     button on every render. Two consequences beyond speed: drill feedback in one
     lesson survives opening another, and returning to the Academy tab with
     nothing changed does no DOM work at all. */

  function bodyHTML(t, m, id){
    return `${window.LXVoice? `<div style="margin-bottom:6px">${LXVoice.speakButton(esc(id))}</div>` : ''}
      <div style="font-size:13.5px;line-height:1.62;color:var(--ink2)">${m.body}</div>
      <div style="border:1px solid var(--line2);border-radius:8px;padding:10px 12px;margin-top:10px;background:var(--panel2)">
        <p class="eyebrow" style="margin:0 0 6px">Drill</p>
        <p style="font-size:13px;margin:0 0 8px"><b>${esc(m.drill.q)}</b></p>
        <div style="display:grid;gap:5px">${m.drill.opts.map((o,i)=>`<button class="btn" data-ans="${esc(id)}" data-i="${i}" style="text-align:left;font-size:12.5px">${esc(o)}</button>`).join('')}</div>
        <div id="fb_${esc(safe(id))}" style="margin-top:8px"></div>
      </div>
      ${window.LXNotes? LXNotes.block('lesson', id) : ''}`;
  }

  function fill(id){
    const host=$('#tcroot'); if(!host) return null;
    const box=host.querySelector('#tcb_'+safe(id));
    if(!box) return null;
    if(box.dataset.filled!=='1'){
      const [tid,mid]=id.split('.');
      const t=TRACKS.find(x=>x.id===tid), m=t&&t.modules.find(x=>x.id===mid);
      if(!m) return null;
      box.innerHTML=bodyHTML(t,m,id);
      box.dataset.filled='1';
      if(window.LXVoice) LXVoice.wireSpeakButtons(box, function(sid){
        const [a,b]=sid.split('.');
        const tt=TRACKS.find(x=>x.id===a); const mm=tt&&tt.modules.find(x=>x.id===b);
        return mm? (mm.t+'. '+mm.body) : '';
      });
    }
    return box;
  }

  function setOpen(id){
    const host=$('#tcroot'); if(!host) return;
    if(openId && openId!==id){
      const prev=host.querySelector('#tcb_'+safe(openId));
      if(prev) prev.style.display='none';
    }
    if(openId===id){ const b=host.querySelector('#tcb_'+safe(id)); if(b) b.style.display='none'; openId=null; return; }
    const box=fill(id);
    if(box){ box.style.display=''; openId=id; }
  }

  function refreshCounters(tid){
    const host=$('#tcroot'); if(!host) return;
    const c=counts();
    const tile=host.querySelector('[data-tcdone]'); if(tile) tile.textContent=c.d+' / '+c.n;
    const t=TRACKS.find(x=>x.id===tid);
    if(t){
      const el=host.querySelector('[data-trkn="'+tid+'"]');
      if(el) el.textContent=t.modules.filter(m=>done(t.id,m.id)).length+'/'+t.modules.length;
    }
    lastSig=TRACKS.length+':'+c.d+':'+c.n;
  }

  function onClick(ev){
    const host=$('#tcroot'); if(!host) return;
    const ansBtn=ev.target.closest? ev.target.closest('[data-ans]') : null;
    if(ansBtn && host.contains(ansBtn)){
      const id=ansBtn.dataset.ans, [tid,mid]=id.split('.');
      const t=TRACKS.find(x=>x.id===tid), m=t&&t.modules.find(x=>x.id===mid);
      if(!m) return;
      const ok=(+ansBtn.dataset.i)===m.drill.a;
      mark(tid, mid, ok);
      const fb=host.querySelector('#fb_'+safe(id));
      if(fb) fb.innerHTML=`<div class="badge ${ok?'good':'bad'}" style="display:block;padding:8px 10px;font-size:12.5px;line-height:1.55">${ok?'Correct. ':'Not quite. '}${esc(m.drill.why)}</div>`;
      const row=host.querySelector('[data-tcrow="'+esc(id)+'"]');
      if(row){
        const P=window.LXPal, col=P? P.c(t.slot) : 'var(--ink2)';
        row.style.borderLeftColor = done(tid,mid)? 'var(--good)' : col;
      }
      const chk=host.querySelector('[data-chk="'+esc(id)+'"]');
      if(chk) chk.innerHTML = done(tid,mid)? '&#10003; ' : '';
      refreshCounters(tid);
      return;
    }
    const tcBtn=ev.target.closest? ev.target.closest('[data-tc]') : null;
    if(tcBtn && host.contains(tcBtn)) setOpen(tcBtn.dataset.tc);
  }

  function render(force){
    const host=$('#tcroot'); if(!host) return;
    const P=window.LXPal, c=counts();
    const sig=TRACKS.length+':'+c.d+':'+c.n;
    if(!force && host.dataset.built==='1' && sig===lastSig) return;  // warm revisit: nothing changed
    lastSig=sig;

    host.innerHTML=`
      <div class="cards" style="margin:0 0 12px">
        <div class="tile"><p class="eyebrow" style="margin:0">Tradecraft</p><p class="big num" style="margin:4px 0 2px" data-tcdone>${c.d} / ${c.n}</p><p style="font-size:11.5px;color:var(--muted);margin:0">drills passed</p></div>
        <div class="tile"><p class="eyebrow" style="margin:0">Tracks</p><p class="big num" style="margin:4px 0 2px">${TRACKS.length}</p><p style="font-size:11.5px;color:var(--muted);margin:0">the trade, the theory, the mindset, and the applied courses</p></div>
      </div>
      ${TRACKS.slice().sort((a,b)=>(a.slot||99)-(b.slot||99)).map(t=>{
        const col=P? P.c(t.slot) : 'var(--ink2)';
        const dn=t.modules.filter(m=>done(t.id,m.id)).length;
        return `<div class="chart" data-panel data-panel-title="${esc(t.name)}" style="margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">${P?P.swatch(col,'circle',12):''}<div class="eyebrow" style="margin:0">${esc(t.name)}</div><span style="margin-left:auto;font-size:11.5px;color:var(--muted)" class="num" data-trkn="${esc(t.id)}">${dn}/${t.modules.length}</span></div>
          <p class="chartnote" style="margin:4px 0 8px">${esc(t.blurb)}</p>
          ${t.modules.map(m=>{
            const id=t.id+'.'+m.id, ok=done(t.id,m.id);
            return `<div data-tcrow="${esc(id)}" style="border:1px solid var(--line);border-left:3px solid ${ok?'var(--good)':col};border-radius:8px;margin:6px 0">
              <button class="btn" data-tc="${esc(id)}" style="width:100%;text-align:left;border:0;background:none;padding:9px 11px;font-size:13.5px">
                <span data-chk="${esc(id)}">${ok?'&#10003; ':''}</span><b>${esc(m.t)}</b>
              </button>
              <div class="tcbody" id="tcb_${esc(safe(id))}" style="display:none;padding:0 12px 12px"></div>
            </div>`;
          }).join('')}
        </div>`;
      }).join('')}
      <p class="src">Locator.X doctrine, written for this app and nothing else. Construction, zoning and cost material here is general education, and the specific figures used in the examples are the sourced anchors shown on the Rebuild panel &mdash; not bids. Nothing in this track is legal, tax, securities or investment advice; the tax and capital material in particular is general information and your own adviser governs. The case-study track is factual business history compiled from published filings, court opinions and news reporting, each claim marked documented, reported or disputed and carrying its source. The applied courses cover subject matter that is standard in this field and taught widely; the topic arcs are not ownable, the writing here is original, and nothing in this Academy is adapted, licensed, reskinned or rebranded from any third-party book, course, syllabus or programme. It implies no affiliation with, sponsorship by, or endorsement from any person, company, university or course provider named or unnamed, and completing any track here confers no accredited degree, diploma or licence. Company and brand names are the trademarks of their respective owners.</p>`;

    host.dataset.built='1';
    openId=null;
    if(!wired){ host.addEventListener('click', onClick); wired=true; }
    if(window.LXPanels) setTimeout(()=>LXPanels.scan('academy'),140);
  }

  window.LXTC={render, TRACKS, counts, open:setOpen};
})();
