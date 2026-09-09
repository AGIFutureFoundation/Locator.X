/* locator.x Academy — Gamification 2.0 flipped training for new agents.
   Acquire with agents (micro-missions on live data) · apply with mentors · verify competency · portable credentials. */
(function(){
'use strict';
const L=()=>window.LX, D=()=>window.LXDash;
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const F$=n=>L().fmt$(n), FN=n=>L().fmtN(n), esc=s=>L().esc(s);

/* ---------------- persistent learner state ---------------- */
const P0={role:null, prof:{}, missions:{}, creds:[], srl:[], overrides:[], tel:{answers:0, correct:0, hints:0, ms:0}};
let P=Object.assign({}, P0, L().store('academy')||{}); P.prof=P.prof||{}; P.missions=P.missions||{}; P.creds=P.creds||[]; P.srl=P.srl||[]; P.overrides=P.overrides||[]; P.tel=Object.assign({},P0.tel,P.tel||{});
const save=()=>L().store('academy', P);
function prof(track){ return P.prof[track]!=null? P.prof[track] : 0.45; }
function bumpProf(track, d){ P.prof[track]=clamp(prof(track)+d, 0.05, 1); save(); }
function tol(track){ return 0.10 - prof(track)*0.06; }   // ±10% → ±4%

/* ---------------- roles ---------------- */
const ROLES=[
 {id:'analyst', c:'--cat1', ic:'Σ', name:'Deal Analyst', why:'Reads a building the way a lender reads it: rent, NOI, cap, DSCR, cash-on-cash — fast and without a spreadsheet open.'},
 {id:'buyer', c:'--cat2', ic:'⚑', name:'Buyer\'s Agent · Investors', why:'Turns a buyer\'s criteria into a clean early offer: buy box, house-hack math, maximum defensible price, terms that close.'},
 {id:'listing', c:'--cat3', ic:'◫', name:'Listing Strategist', why:'Prices from evidence: comps, $/sf, the ZIP\'s trend, the seller\'s Prop 13 story and the tax at the closing table.'},
 {id:'dev', c:'--cat4', ic:'⌂', name:'Development Advisor', why:'Sees the building that isn\'t there yet: ADUs, added units, SB 9, and what a dollar of construction buys.'},
 {id:'care', c:'--cat5', ic:'♥', name:'Compliance & Care', why:'The wisdom layer: rent control, fair housing, disclosure — the rules that make a career durable and a community served.'}
];
const ROLE=Object.fromEntries(ROLES.map(r=>[r.id,r]));

/* ---------------- property pickers (the ZPD dial chooses the arena) ---------------- */
function pool(track){
  const X=L(); const p=prof(track); const all=X.allListings().filter(l=>l.src!=='imp'&&l.price>100000);
  const easy=l=>(l.units||1)===1 && l.sqft && l.beds!=null && !/condo/i.test(l.kind||'') && l.price>500000 && l.price<1600000;
  const mid=l=>(l.units||1)<=2 && l.sqft;
  const hard=l=>(l.units||1)>=2 || /condo/i.test(l.kind||'') || (l.year&&l.year<1940);
  const f = p<0.45? easy : p<0.7? mid : hard;
  const c=all.filter(f); return c.length?c:all;
}
function pick(track, extra){ let c=pool(track); if(extra) { const c2=c.filter(extra); if(c2.length>4) c=c2; else { const c3=L().allListings().filter(l=>l.src!=='imp').filter(extra); if(c3.length) c=c3; } } return c[Math.floor(Math.random()*c.length)]; }
const propLine=l=>`${l.addr}, ${l.city} — ${l.kind}${l.beds!=null?`, ${l.beds} bd ${l.baths} ba`:''}${l.sqft?`, ${FN(l.sqft)} sf`:''}${l.year?`, built ${l.year}`:''}, recorded at ${F$(L().price(l))} (${l.priceDate||'public record'})`;

/* ---------------- question helpers ---------------- */
function qn(q, ans, unit, hints, fb, opt){ return Object.assign({type:'num', q, ans, unit:unit||'', hints, fb}, opt||{}); }
function qm(q, opts, correct, hints, fb){ return {type:'mc', q, opts, correct, hints, fb}; }

/* ---------------- missions (all original content; themes credited at catalog level) ---------------- */
const MISSIONS=[
/* ---- Deal Analyst ---- */
{id:'a1', role:'analyst', min:3, title:'The Sunday call', std:'Income approach — estimate rent and NOI',
 brief:'A client rings about a listing they just toured. You have four minutes to give them numbers they can trust.',
 make(){ const l=pick('analyst'); const d=L().deal(l); return {l,
  trigger:`Your phone buzzes at an open house: <b>“We just walked ${esc(l.addr)} in ${esc(l.city)} — is it a rental or a money pit? Call me back in five.”</b><br>Subject: ${esc(propLine(l))}. Work from the app's assumptions (${L().state.assump.down}% down at ${L().state.assump.rate}%).`,
  analyze:{view:'mapview', id:l.id, note:'Open it on the map — the drawer computes nothing you can\'t do by hand, but check yourself against it after you answer.'},
  qs:[ qn('First rep: what does this property rent for per month, all units together, using the ZIP rent-to-value method?', d.rentMo, '$/mo',
        ['Which two ZIP numbers make the ratio? One is a rent index, one is a value index.','Ratio = ZIP typical rent ÷ ZIP typical value. Multiply it by the price. Multi-unit buildings get a 1.2 premium.','You are within one step: price × (ZORI ÷ ZHVI), ×1.2 if 2+ units.'],
        `Estimated rent is $${FN(d.rentMo)}/mo — the ZIP's rent-to-value ratio applied to the price. An index estimate starts the conversation; three comps from a property manager finish it.`),
       qn('Second rep: annual net operating income (NOI) at the app\'s expense assumptions?', d.noi, '$/yr',
        ['NOI is income after operating costs but before any loan.','Gross rent − vacancy − tax − insurance − upkeep − management. The drawer\'s pro-forma lists each line.','Take the gross rent ×12, subtract ~5% vacancy, then property tax (≈'+L().taxRate(l)+'% of price), insurance, upkeep and management.'],
        `NOI ≈ ${F$(d.noi)}. Everything above the debt line. This is the number a cap rate is built on — and the number a lender trusts before they trust you.`),
       qn('Third rep: the cap rate, to one decimal.', +(d.cap).toFixed(1), '%',
        ['Cap rate ignores the loan entirely.','NOI ÷ price × 100.','Divide the NOI you just computed by the recorded price.'],
        `Cap ≈ ${d.cap.toFixed(1)}%. Under 4% here means the price is carrying a story; over 5.5% in this market means look for the catch — condition, tenancy, or location.`) ]}; } },
{id:'a2', role:'analyst', min:4, title:'Coverage is character', std:'Debt metrics — DSCR and cash flow',
 brief:'A lender will ask one question about the building before any question about the borrower.',
 make(){ const l=pick('analyst', x=>(x.units||1)>=2); const d=L().deal(l); return {l,
  trigger:`Your client wants to offer on <b>${esc(l.addr)}, ${esc(l.city)}</b> (${esc(l.kind)}). Their lender's first question will be coverage. Subject: ${esc(propLine(l))}.`,
  analyze:{view:'mapview', id:l.id, note:'The drawer shows DSCR live; compute it yourself first.'},
  qs:[ qn('Annual debt service on a '+L().state.assump.down+'%-down, '+L().state.assump.rate+'%, 30-year loan?', d.ds, '$/yr',
        ['Loan amount first: price × (1 − down%).','Monthly payment = loan × r/(1−(1+r)^−360), r = rate/12. Then ×12.','Loan is '+F$(d.loan)+'. Apply the mortgage constant for '+L().state.assump.rate+'%.'],
        `Debt service ≈ ${F$(d.ds)}/yr. The mortgage constant at ${L().state.assump.rate}% is about ${(d.ds/d.loan*100).toFixed(2)}% of the loan per year — memorize it and you can underwrite in your head.`),
       qn('DSCR to two decimals — the coverage the lender reads first.', +(d.dscr||0).toFixed(2), '',
        ['It is a ratio of two annual numbers you already have.','NOI ÷ annual debt service.','Divide '+F$(d.noi)+' by '+F$(d.ds)+'.'],
        `DSCR ≈ ${(d.dscr||0).toFixed(2)}. Investor lenders want 1.20–1.25. Below 1.0 the building doesn't pay its own mortgage — that is the line between an asset and a liability, written in a lender's language.`),
       qm('The DSCR you computed means:', [
         'The building covers '+Math.round((d.dscr||0)*100)+'% of its own loan payment from operations',
         'The buyer earns '+Math.round((d.dscr||0)*100)+'% on their down payment',
         'The building appreciates '+Math.round((d.dscr||0)*100)+'% of the loan per year'],0,
        ['DSCR compares operations to the payment — nothing else.','Coverage: how much of the mortgage the NOI pays.'],
        'Exactly — coverage of the payment from operations. Cash-on-cash and appreciation are different questions with different denominators.') ]}; } },
{id:'a3', role:'analyst', min:5, title:'The velocity of money', std:'Return on equity and equity recycling',
 brief:'Catalog theme (Three Master Secrets, 2006): dollars should never sleep. Measure how hard each dollar in this deal works — and when to move it.',
 make(){ const l=pick('analyst'); const d=L().deal(l); const y5=d.proj[4]; const roe5=(d.proj[4].cf + (d.proj[4].value*L().state.assump.appr===''?0:0) )/1; const eq5=y5.equity; const cf5=y5.cf; const roe=+((cf5 + (y5.value*(d.appr/100)))/eq5*100).toFixed(1); return {l,
  trigger:`Same building, longer clock: <b>${esc(l.addr)}, ${esc(l.city)}</b>. Your investor plans to hold five years. The question that separates analysts from cheerleaders: <b>how hard is each trapped dollar working by year five?</b>`,
  analyze:{view:'dash', id:l.id, note:'The focus panel\'s five-year chart shows equity building while cash flow moves.'},
  qs:[ qn('Cash invested today ('+L().state.assump.down+'% down + '+L().state.assump.closing+'% costs)?', d.cash, '$',
        ['Two percentages of the price, added.','Down payment plus closing costs.','Price × '+(L().state.assump.down+L().state.assump.closing)+'%.'],
        `Cash in ≈ ${F$(d.cash)}. Every return metric is a fraction with this on the bottom — at first.`),
       qn('Projected equity at the end of year 5 (value minus loan balance), from the five-year table?', Math.round(eq5), '$',
        ['Equity = projected value − remaining loan.','The dashboard focus panel and the drawer both print the year-5 row.','Read the year-5 equity from the five-year view; amortization plus appreciation built it.'],
        `Equity ≈ ${F$(eq5)}. Notice what happened: the dollars multiplied, but they also went to sleep inside the walls.`),
       qm('Return on equity is falling by year 5 even though cash flow grew. The velocity-of-money move is:', [
         'Refinance or 1031-exchange the trapped equity into the next income property, if the numbers after the move still cover',
         'Hold forever — equity in the walls is the safest return',
         'Sell immediately regardless of basis and taxes'],0,
        ['The theme is keeping dollars working, not keeping buildings forever or churning them.','Compare the return ON EQUITY of staying vs. redeploying — after the costs of the move.'],
        'Right. When cash flow ÷ equity sinks below what redeployed equity could earn, the disciplined move is a refi or a 1031 — sized so the property still covers its debt afterward. Velocity, never recklessness.') ]}; } },
{id:'a4', role:'analyst', min:5, title:'Bubble-proof it', std:'Stress testing — rates, vacancy, break-even',
 brief:'Catalog theme (Bubble-Proof Real Estate Investing, 2006): a deal you keep through a downturn beats two you surrender. Stress this one.',
 make(){ const l=pick('analyst', x=>(x.units||1)>=1); const a=L().state.assump; const d=L().deal(l);
  const r2=a.rate+1; const rm=r2/100/12, n=a.term*12; const pay2=d.loan*rm/(1-Math.pow(1+rm,-n))*12; const dscr2=+(d.noi/pay2).toFixed(2);
  const be=+(((d.opex+d.ds)/d.rent)*100).toFixed(0); return {l,
  trigger:`The market turns a year after closing on <b>${esc(l.addr)}, ${esc(l.city)}</b>: rates are up a point, a tenant gives notice, and your investor calls scared. Bubble-proofing happens BEFORE the offer — run it now.`,
  analyze:{view:'uw', id:l.id, note:'The underwriting sheet\'s sensitivity grid shows every one of these cells.'},
  qs:[ qn('If the loan had been written 1 point higher ('+r2+'%), what is the DSCR? (two decimals)', dscr2, '',
        ['Only the payment changes; NOI doesn\'t care about your loan.','Recompute the payment at '+r2+'% on the same loan, divide NOI by it.','Payment at '+r2+'% ≈ '+F$(pay2)+'/yr.'],
        `DSCR falls to ${dscr2}. One point of rate moved coverage by ${((d.dscr||0)-dscr2).toFixed(2)}. A bubble-proof deal holds above 1.0 at purchase-rate-plus-one; this one ${dscr2>=1?'does':'does not'}.`),
       qn('Break-even occupancy: what percent of the gross rent must arrive every month to cover ALL expenses and the mortgage?', be, '%',
        ['Everything out ÷ everything possible in.','(Operating expenses + debt service) ÷ gross scheduled rent.','('+F$(d.opex)+' + '+F$(d.ds)+') ÷ '+F$(d.rent)+'.'],
        `Break-even ≈ ${be}%. ${be<=90?'There is a real vacancy cushion.':be<=100?'Thin cushion — one bad month erases the year.':'Over 100%: the building needs the owner\'s wallet even when full. That is the definition of fragile.'}`),
       qm('Which purchase survives a downturn, all else equal?', [
         'DSCR 1.25 at a fixed rate with six months of reserves',
         'DSCR 0.9 on an adjustable loan, no reserves, but a hotter ZIP',
         'Whichever has the higher projected appreciation'],0,
        ['Downturns attack coverage and liquidity, not stories.','Fixed cost of debt + coverage + reserves is the armor.'],
        'Coverage, fixed debt cost and reserves are the bubble-proof kit. Appreciation is what you\'re allowed to enjoy for surviving.') ]}; } },
/* ---- Buyer's Agent ---- */
{id:'b1', role:'buyer', min:4, title:'Move early, move clean', std:'Offer construction — price discipline and terms',
 brief:'Catalog theme (Three Master Secrets, 2006): the prepared early offer, priced from evidence, beats the highest late one often enough to build a career on.',
 make(){ const l=pick('buyer'); const d=L().deal(l); const a=L().state.assump;
  const k=(r=>{const m=r/100/12,n=a.term*12;return m/(1-Math.pow(1+m,-n))*12;})(a.rate);
  let lo=50000, hi=L().price(l)*1.6; const test=P=>{ const tax=P*L().taxRate(l)/100, ins=Math.max(1200,P*a.ins/100); const opx=d.opex-d.tax-d.ins+tax+ins; const noi=d.egi-opx; return noi - P*(1-a.down/100)*k; };
  if(test(hi)<0){ for(let i=0;i<40;i++){ const mid=(lo+hi)/2; if(test(mid)>=0) lo=mid; else hi=mid; } } else lo=hi;
  const maxP=Math.round(lo/1000)*1000; const emd=Math.round(L().price(l)*0.03); return {l,
  trigger:`A well-priced ${esc(l.kind).toLowerCase()} hits the market Thursday: <b>${esc(l.addr)}, ${esc(l.city)}</b> — ${esc(propLine(l))}. Offers are “as they come.” Your investor wants it <b>only if it can break even</b>. You have tonight.`,
  analyze:{view:'uw', id:l.id, note:'The underwrite sheet\'s solver does this exact search — do it by hand once, then trust the tool.'},
  qs:[ qn('The ceiling: at what price does this building break even (DSCR 1.0) at '+a.down+'% down and '+a.rate+'%? Round to the nearest $1,000.', maxP, '$',
        ['The rent doesn\'t change with your offer; taxes do.','Find the price where NOI equals the loan payment. Bisect: try a price, recompute tax, NOI, payment.','The app\'s max-offer solver at "Break even" target gives the same number — check the Underwrite tab.'],
        `Break-even price ≈ ${F$(maxP)} — ${maxP<L().price(l)? (100-maxP/L().price(l)*100).toFixed(0)+'% below the recorded price. That gap is your negotiation, in writing.' : 'at or above the record — this one works at the ask.'}`),
       qn('Earnest money at 3% of the recorded price — the clean-offer signal?', emd, '$',
        ['Three percent of the price.','0.03 × recorded price.','Multiply the recorded price by 0.03.'],
        `EMD ≈ ${F$(emd)}. A real deposit, short clean contingencies and proof of funds is what “moving early” actually means — speed is credibility, not haste.`),
       qm('The seller\'s agent hints a higher offer may come Monday. The early-offer discipline is:', [
         'Deliver tonight at your evidence-backed number with a short, honest expiration — and let the ceiling you computed hold',
         'Wait to see Monday\'s number, then beat it',
         'Offer over the ceiling now and plan to renegotiate in escrow'],0,
        ['Discipline means the number came from underwriting, not from the auction.','An expiring clean offer converts preparation into leverage; renegotiation games burn reputations.'],
        'Yes — the early clean offer with an expiration. If someone pays more than the building earns, that was never your buyer\'s deal to win.') ]}; } },
{id:'b2', role:'buyer', min:5, title:'The house-hack pitch', std:'Owner-occupied financing — FHA math',
 brief:'Your renter-client thinks ownership here is impossible. Show them the building where tenants pay most of the note.',
 make(){ const l=pick('buyer', x=>x.hh && (x.units||1)>=2 && (x.units||1)<=4); const h=window.LXHH.hack(l); return {l,
  trigger:`Your client pays $${FN(h.zipRent||3500)}/mo in rent and “can never buy here.” You pull <b>${esc(l.addr)}, ${esc(l.city)}</b> — ${h.units} units at ${F$(h.P)}. FHA owner-occupied, 3.5% down. Change their mind with arithmetic.`,
  analyze:{view:'hacks', id:l.id, note:'The House hacks tab computes this whole pitch — after you do.'},
  qs:[ qn('Cash to close at 3.5% down plus '+L().state.assump.closing+'% costs?', Math.round(h.cashNeed), '$',
        ['Two small percentages of the price.','(3.5% + closing%) × price.','Multiply '+F$(h.P)+' by '+(3.5+L().state.assump.closing)+'%.'],
        `≈ ${F$(h.cashNeed)} — the whole entry ticket. Compare that to the 25% an investor loan wants: owner-occupancy is the cheapest leverage a W-2 earner will ever touch.`),
       qn('With the other '+(h.units-1)+' unit'+(h.units>2?'s':'')+' rented (5% vacancy), what is your client\'s net monthly cost to live there — PITI+MIP plus upkeep and utilities minus that rent?', Math.round(h.cost), '$/mo',
        ['Start from the full payment, then subtract what the tenants bring.','PITI+MIP ≈ $'+FN(h.pitia)+'; other units ≈ $'+FN(h.otherRent)+' before vacancy.','Payment + upkeep + utilities − other-unit rent × 0.95.'],
        `≈ ${h.cost<=0? '+$'+FN(-h.cost)+'/mo TO the client':'$'+FN(h.cost)+'/mo'} — against $${FN(h.zipRent||0)}/mo to rent in the same ZIP. ${h.save>0? 'The tenants just funded the difference: $'+FN(h.save)+'/mo of housing cost gone.':'Here the hack trails renting — keep hunting; the finder ranks better ones.'}`),
       qm('It\'s a '+h.units+'-unit purchase on FHA. Which rule must you brief before writing the offer?', [
         h.units>=3? 'Self-sufficiency: 75% of ALL units\' market rent must cover the full payment, or FHA won\'t insure the loan' : 'Owner occupancy: your client must move in within 60 days and live there at least one year',
         'FHA forbids renting the other units',
         'FHA loans cannot be used on buildings older than 1990'],0,
        ['One of these is a real FHA rule; two are myths.','Occupancy and (for 3–4 units) self-sufficiency are the gates.'],
        h.units>=3? 'Self-sufficiency is the 3–4-unit gate — this building '+(h.ss? 'passes at these rents.':'fails at these rents, so the offer must be priced down or the loan rethought.') : 'One year of real occupancy — misrepresenting it is federal loan fraud, and the cheap loan isn\'t worth a career.') ]}; } },
{id:'b3', role:'buyer', min:4, title:'Problems are inventory', std:'Sourcing — motivated sellers and off-market signals',
 brief:'Catalog theme (Three Master Secrets, 2006): when a problem pops up, an agent sees paperwork — an investor\'s agent sees the deal behind it.',
 make(){ const X=L(); const rowsD=D().rows.length?D().rows:(D().render(),D().rows); const sus=rowsD.filter(r=>r.sus && (r.l.units||1)>=1); const r0=sus.length? sus[Math.floor(Math.random()*sus.length)] : rowsD[0]; const l=r0.l; const gap=+((1-X.price(l)/(r0.cityPpsf&&l.sqft? r0.cityPpsf*l.sqft : X.price(l)*1.6))*100).toFixed(0); const ind=r0.cityPpsf&&l.sqft? Math.round(r0.cityPpsf*l.sqft) : Math.round(X.price(l)*1.6); return {l,
  trigger:`Scanning the roll you find <b>${esc(l.addr)}, ${esc(l.city)}</b> recorded at ${F$(X.price(l))} — flagged ⚠ far below market. Not a listing: a signal. Somebody transferred this building without an auction. Your move is research, not a bid.`,
  analyze:{view:'research', id:l.id, note:'Run the research agents — the comps agent prices the gap, the links open the recorder trail.'},
  qs:[ qn('Using the city\'s median $/sf'+(l.sqft?` and this building's ${FN(l.sqft)} sf`:' and a comparable basis')+', what would it likely trade for at market? (±10% is fine)', ind, '$',
        ['The flag means the recorded price is NOT market — rebuild market from $/sf.','City median $/sf × building sf.','The research report\'s comps agent prints exactly this "indicated value".'],
        `Indicated ≈ ${F$(ind)} — the recorded ${F$(X.price(l))} is a partial-interest or family transfer, not a price you can buy at. But it tells you the ownership just changed hands quietly.`),
       qm('The professional read of a below-market transfer plus a long-held neighbor parcel is:', [
         'A door-knock and a letter: new heirs or partial owners often want a clean exit, and you can be the prepared buyer\'s agent when they do',
         'Offer the recorded price — it\'s public, so it must be available',
         'Report it — below-market transfers are illegal'],0,
        ['The record is a breadcrumb about motivation, not a menu price.','Probate, divorce, partnership dissolution — problems that surface as odd transfers — are tomorrow\'s inventory.'],
        'Right. Odd transfers mark motivated ownership. The agent who arrives early, informed and respectful — with a fair number already underwritten — is the one the family calls when they decide.'),
       qm('Ethics gate before any outreach:', [
         'Fair, honest dealing: no pressure on distressed owners, no lowball framed as rescue, full agency disclosure',
         'Whatever closes the deal fastest',
         'Contact only owners who already listed'],0,
        ['The theme is opportunity IN problems, never profiting FROM confusion.','Reputation compounds better than any single spread.'],
        'The career is built on the second deal each client gives you — and the referrals from how you handled the first.') ]}; } },
/* ---- Listing Strategist ---- */
{id:'l1', role:'listing', min:4, title:'Price it like an appraiser', std:'Sales comparison — $/sf and adjustments',
 brief:'Your CMA is your credibility. Build the number from evidence the seller can check.',
 make(){ const l=pick('listing', x=>x.sqft&&(x.units||1)===1); const X=L(); const ppsf=D().cityPpsfOf(l.city)||900; const ind=Math.round(ppsf*l.sqft/1000)*1000; const subj=Math.round(X.price(l)/l.sqft); return {l,
  trigger:`A homeowner in ${esc(l.nb||l.city)} asks what their place would fetch. Twin of the subject: <b>${esc(l.addr)}</b> — ${FN(l.sqft)} sf, recorded at ${F$(X.price(l))}. Build the evidence, not the flattery.`,
  analyze:{view:'market', id:l.id, note:'The Market tab holds the ZIP trend; the Deals table sorts the comps by $/sf.'},
  qs:[ qn('The subject sold at what price per square foot?', subj, '$/sf',
        ['Two numbers, one division.','Recorded price ÷ living area.',F$(X.price(l))+' ÷ '+FN(l.sqft)+' sf.'],
        `$${FN(subj)}/sf. Every comp becomes comparable only after this division.`),
       qn(`${esc(l.city)}'s median for this data set is $${FN(ppsf)}/sf. At that median, this home's indicated value is? (nearest $1,000)`, ind, '$',
        ['Median $/sf × subject sf.','Multiply and round.',FN(ppsf)+' × '+FN(l.sqft)+'.'],
        `≈ ${F$(ind)} before adjustments. The subject traded ${subj>ppsf?'above':'below'} the city median — your listing presentation must explain WHY (condition, block, light, layout), or correct the seller's number with it.`),
       qm('The seller wants to list 15% above your evidence “to leave room.” The strategist\'s answer:', [
         'Show the data: overpriced listings go stale, chase the market down, and net less — price at evidence, market hard, let competition do the lifting',
         'Take the listing at their number — you can reduce later',
         'Refuse the listing'],0,
        ['Days-on-market is priced into every buyer\'s offer.','The first two weeks are the whole auction.'],
        'Evidence, then strategy: an at-market price in week one creates the multiple-offer dynamic that an aspirational price kills. Stale is expensive.') ]}; } },
{id:'l2', role:'listing', min:3, title:'Read the ZIP before you speak', std:'Market analytics — trend, rent, yield',
 brief:'Sellers ask “how\'s the market?” Answer with their ZIP, not the news.',
 make(){ const X=L(); const l=pick('listing', x=>!!X.M.zips[x.zip]); const z=X.M.zips[l.zip]; const v=X.last(z.v), v13=X.at(z.v,z.v.length-13); const yoy=+((v/v13-1)*100).toFixed(1); const r=X.last(z.r); const gy=r? +((r*12/v)*100).toFixed(1):null; return {l,
  trigger:`Listing appointment tomorrow in <b>${l.zip} (${esc(l.city)})</b>. You get one chance to sound like the person who actually knows this ZIP.`,
  analyze:{view:'market', id:l.id, note:'Market tab → type the ZIP. The charts are your talking points.'},
  qs:[ qn('The ZIP\'s typical home value moved how much over the last 12 months? (one decimal, negative if down)', yoy, '%',
        ['Latest value vs. 13 months back.','(now ÷ year-ago − 1) × 100.','The Market table\'s 1-yr column prints it.'],
        `${yoy>0?'+':''}${yoy}% — ${yoy>0?'a rising ZIP: urgency is honest.':'a soft ZIP: pricing discipline is the kindness.'} Say the number, then say what it means for their week-one strategy.`),
       gy!=null? qn('Gross yield of the ZIP (annual typical rent ÷ typical value)?', gy, '%',
        ['Rent ×12 over value.','ZORI×12 ÷ ZHVI ×100.','$'+FN(r)+'×12 ÷ '+F$(v)+'.'],
        `${gy}%. Above ~5% investors will show up at this listing; below 4% your buyer pool is owner-occupants — stage and market accordingly.`) :
       qm('No rent index exists for this ZIP. Your yield talking point comes from:',['The city-level ZORI as the nearest honest proxy, said as such','Make up a number — nobody checks','Skip investors entirely'],0,['Honesty about data beats precision theater.'],'Proxy plus disclosure beats fabrication every time.'),
       qm('The trend line matters to a LISTING because:', [
         'It sets week-one strategy: rising ZIP → price tight and let competition run; falling ZIP → price ahead of the decline before the comps catch down',
         'It changes the commission','It only matters to buyers'],0,
        ['Strategy follows direction.','In a falling market, the first accurate price wins; the third reduction loses.'],
        'Direction sets strategy. An agent who prices a falling ZIP off last spring\'s comps is marketing a memory.') ]}; } },
{id:'l3', role:'listing', min:4, title:'The seller\'s Prop 13 story', std:'Seller economics — taxes, transfer costs, carry',
 brief:'A long-held owner\'s decision is a tax decision. Read their side of the table before the appointment.',
 make(){ const X=L(); const l=pick('listing', x=>x.city==='San Francisco'||x.county==='Alameda'); const P=X.price(l);
  const tt=(function(P,city){ const c=(city||'').toLowerCase(); if(c==='san francisco'){ const r=P<=250000?0.5:P<=999999?0.68:P<=4999999?0.75:P<=9999999?2.25:P<=24999999?5.5:6; return {amt:P*r/100, why:'SF tiered transfer tax ('+r+'%)'};} if(c==='oakland'){ const r=P<=300000?1:P<=2000000?1.5:P<=5000000?1.75:2.5; return {amt:P*r/100+P*0.0011, why:'Oakland '+r+'% + county $1.10/1k'};} return {amt:P*0.0011, why:'county $1.10 per $1,000'}; })(P, l.city);
  const amt=Math.round(tt.amt); return {l,
  trigger:`The owner of <b>${esc(l.addr)}, ${esc(l.city)}</b> has held since the nineties. Their tax basis is a fraction of today's ${F$(P)}. Before you talk price, understand what leaving costs THEM.`,
  analyze:{view:'research', id:l.id, note:'The regulation agent itemizes the transfer tax; the guide\'s tax chapter covers 1031 and the basis step-up.'},
  qs:[ qn(`Transfer tax if it sells at the recorded ${F$(P)} (${tt.why})?`, amt, '$',
        ['A percentage (or per-$1,000 rate) of the price.','Apply the city\'s tier to the full price.','The research report\'s regulation agent computes this line.'],
        `≈ ${F$(amt)} at the closing table, usually seller-paid here. Say it before they discover it.`),
       qm('Their capital gain is enormous and they fear the tax. The advisory move (with their CPA) is:', [
         'Lay out the real menu: 1031 exchange into income property, seller-carry to spread gain, the $250/500k primary exclusion if they lived there, or holding for the step-up — then let them choose informed',
         'Tell them taxes are not your problem','Promise the gain can be avoided entirely'],0,
        ['You are the one who brings the menu, the CPA prices it.','Seller-carry doubles as YOUR buyer\'s financing.'],
        'The agent who explains the seller\'s tax menu wins listings from the agent who only talks price — and the seller-carry option you just taught may finance your own investor\'s purchase.'),
       qm('Why does the seller\'s low Prop 13 basis make seller financing rational for THEM?', [
         'An installment sale spreads the recognized gain across years while the note pays them more than a CD — their tax problem becomes their income stream',
         'It lets them keep the property tax rate','It avoids transfer tax'],0,
        ['Think about WHEN gain is recognized in an installment sale.','A 5% note on a large gain often nets more after-tax than a lump sum.'],
        'Installment treatment spreads the gain; the note yields more than cash equivalents. That is why the “Prop 13 pitch” in the app\'s financing cards exists.') ]}; } },
/* ---- Development Advisor ---- */
{id:'d1', role:'dev', min:5, title:'Find the hidden unit', std:'Feasibility — zoning, ADU law, add-a-unit economics',
 brief:'The listing shows a building. The advisor sees the entitlement around it.',
 make(){ const X=L(); const l=pick('dev', x=>!/condo/i.test(x.kind||'')&&x.lot>=2500); const dev=window.LXDev.assess(l); const best=dev.best||dev.list.find(o=>o.capex>0); return {l,
  trigger:`Your investor closes on <b>${esc(l.addr)}, ${esc(l.city)}</b>${l.lot?` — ${FN(l.lot)} sf lot`:''}${l.zoning?`, zoned ${esc(l.zoning)}`:''}. “What can we DO with it?” is the only question. The development engine has an answer — earn it by hand first.`,
  analyze:{view:'uw', id:l.id, note:'The sheet\'s Development & conversion section is the answer key.'},
  qs:[ qn(`The strongest play the engine finds is “${esc(best.name)}.” Its estimated cost?`, best.capex, '$',
        ['The cost library drives it — $/sf × area, or a lump sum.','Check the renovation cost library on the Underwrite tab for the line item.','The play\'s card prints cost, rent added and value.'],
        `≈ ${F$(best.capex)}. ${esc(best.basis)}.`),
       qn('Value created by that play, per the engine? (±10%)', best.addValue, '$',
        ['Income plays are valued from the new NOI at the ZIP\'s own yield.','New annual rent × ~70% (to NOI) ÷ the local cap basis.','The card prints "Adds value".'],
        `≈ ${F$(best.addValue)} of value for ${F$(best.capex)} of cost — profit ≈ ${F$(best.profit)}. Development math is just underwriting with a construction line.`),
       qm('State ADU law matters to this advisory because:', [
         'Approval is MINISTERIAL — the city must issue the permit if the standards are met, which converts “maybe someday” into an underwritable plan',
         'It waives building codes','It applies only to new construction'],0,
        ['Ministerial vs. discretionary is the whole game.','No neighborhood hearing can kill a conforming ADU.'],
        'Ministerial approval is why the ADU line belongs in an underwriting sheet at all: it is entitlement you can count on, not entitlement you hope for.') ]}; } },
{id:'d2', role:'dev', min:4, title:'A dollar of construction', std:'Cost estimation — $/sf discipline',
 brief:'Clients hear one renovation number on TV and it is always wrong. Calibrate them with the library.',
 make(){ const X=L(); const C=window.LXDev.costs(); const l=pick('dev', x=>x.sqft>0); const cos=Math.round(l.sqft*C.cosmetic), gut=Math.round(l.sqft*C.gut); const adu=Math.round(C.aduSf*C.detachedAdu); return {l,
  trigger:`Walking <b>${esc(l.addr)}, ${esc(l.city)}</b> (${FN(l.sqft)} sf) your client says “we'll just redo everything, maybe fifty grand?” Recalibrate — kindly, with the cost library.`,
  analyze:{view:'uw', id:l.id, note:'The editable cost library on the Underwrite tab holds every rate; adjust it to your contractor\'s bids.'},
  qs:[ qn(`Cosmetic refresh of the whole ${FN(l.sqft)} sf at the library's $${C.cosmetic}/sf?`, cos, '$',
        ['One multiplication.','sf × $/sf.','Paint, floors, fixtures — the lightest tier.'],
        `≈ ${F$(cos)} — and that is the CHEAP tier. “Fifty grand” buys ${FN(50000/C.cosmetic)} sf of cosmetic work here.`),
       qn(`Full gut of the same area at $${C.gut}/sf?`, gut, '$',
        ['Same multiplication, heavier rate.','sf × gut rate.','To the studs: systems, permits, design.'],
        `≈ ${F$(gut)}. The spread between cosmetic and gut — ${F$(gut-cos)} — is why the FIRST question on any renovation is scope, not color.`),
       qn(`A detached ADU at the library's defaults (${C.aduSf} sf at $${C.detachedAdu}/sf)?`, adu, '$',
        ['Area × rate.','Utilities and design are inside the rate.','The dev engine uses exactly this figure.'],
        `≈ ${F$(adu)} — against a new rental unit's income stream forever. Cost per square foot is the language; value per square foot is the argument.`) ]}; } },
/* ---- Compliance & Care ---- */
{id:'c1', role:'care', min:4, title:'Know the rules of the game', std:'Rent regulation — SF/Oakland/Berkeley ordinances and AB 1482',
 brief:'Underwriting rent you cannot legally charge is not optimism, it is malpractice.',
 make(){ const l=pick('care', x=>(x.units||1)>=2 && x.year); const rc=D().rentControl(l); const correct= rc.level==='bad'?0: rc.level==='warn'?1:2; return {l,
  trigger:`Your investor assumes they can raise every rent to market at <b>${esc(l.addr)}, ${esc(l.city)}</b> (${esc(l.kind)}, built ${l.year}). Before the offer: which regime governs these units?`,
  analyze:{view:'research', id:l.id, note:'The regulation agent names the regime and why.'},
  qs:[ qm('This building falls under:', [
         'Local rent control ('+esc(l.city)+' ordinance — the building\'s age and unit count trigger it)',
         'The statewide AB 1482 cap (5% + CPI, max 10%) but not local control',
         'Generally exempt (with proper notice)'], correct,
        ['Three dates matter: SF pre-June-1979, Oakland pre-1983, Berkeley pre-1980 — for multi-unit buildings.','AB 1482 covers most rentals older than 15 years that local law doesn\'t.'],
        esc(rc.reg)+'. Underwrite the rents that exist; model increases at the lawful cap, not at your hopes.'),
       qm('A tenant in a rent-controlled unit pays half of market. The lawful value-add path is:', [
         'Wait for natural turnover (or negotiate a fair, voluntary, documented buyout under the city\'s buyout ordinance) — then reset to market',
         'Serve a large rent increase and see if they leave',
         'Refuse services until they move'],0,
        ['Two of these are harassment — a crime in SF and Oakland, and a lawsuit everywhere.','Turnover and lawful buyouts are the only doors.'],
        'Turnover and regulated buyouts. Anything that pressures a tenant out is tenant harassment — criminal exposure, treble damages, and the end of a license.'),
       qm('Why does the app show BOTH the current rent basis and the ZIP\'s market rent?', [
         'Because the spread between them is the value-add — but only the lawful path to it (turnover, buyout, new ADU exempt from control) may be priced into an offer',
         'To make listings look better','Regulators require it'],0,
        ['The spread is real; the path is constrained.','Price the path, not just the spread.'],
        'The spread is the opportunity; the ordinance is the route. An advisor prices both.') ]}; } },
{id:'c2', role:'care', min:4, title:'Serve first', std:'Fair housing and fiduciary duty — California practice',
 brief:'Catalog theme (wealth-creation venues): lasting practices are built on households served, not deals extracted. The law agrees.',
 make(){ const l=pick('care'); return {l,
  trigger:`Three moments from one ordinary week at your desk. Each has exactly one professional answer.`,
  analyze:{view:'guide', id:l.id, note:'The guide\'s team chapter and the DRE\'s fair-housing coursework are the long form.'},
  qs:[ qm('A buyer asks you to find “a neighborhood without families with kids.” You:', [
         'Decline the criterion — familial status is protected under the Fair Housing Act and FEHA; offer objective criteria (noise levels, unit layouts) instead',
         'Quietly filter the search the way they asked',
         'Show only 55+ communities without explaining why'],0,
        ['Steering by protected class is illegal even when the CLIENT requests it.','Redirect to lawful, objective criteria.'],
        'Familial status, race, religion, national origin, disability, sex, orientation, source of income (in California, including Section 8) — none may steer a search. You decline the criterion, keep the client, and document it.'),
       qm('Your investor-client wants to offer on a duplex; you privately want it too. Fiduciary duty says:', [
         'The client\'s interest comes first: disclose any personal interest in writing, and step out of their way — you bid only if they pass, informed',
         'Outbid them — business is business',
         'Buy it through an LLC they don\'t know about'],0,
        ['Agency is a fiduciary relationship: loyalty, disclosure, priority.','Concealed self-dealing is license-ending.'],
        'Loyalty and written disclosure. Every regulator, and every referral network, remembers which one you chose.'),
       qm('A first-time buyer qualifies but barely, in a fragile month for rates. Serving first means:', [
         'Show the stress test — payment at rate-plus-one, reserves after closing — and let them choose with eyes open, even if it costs you this commission',
         'Close fast before rates move','Tell them real estate always goes up'],0,
        ['The bubble-proof discipline applies to clients, not just investors.','A commission is one month; a served household refers for decades.'],
        'The stress test conversation is the practice-builder. Households you protected in the fragile month become the neighborhood that calls only you.') ]}; } }
];
/* crew mission */
const CREW={id:'crew', title:'Crew mission — four faults, one building', min:7,
 brief:'Cooperative play: a real 2–4 unit with four subsystems failing at once. Each chair diagnoses one. Solo learners rotate chairs.',
 make(){ const l=pick('analyst', x=>(x.units||1)>=2&&x.year&&x.year<1978) || pick('analyst', x=>(x.units||1)>=2); const d=L().deal(l); const rc=D().rentControl(l); const C=window.LXDev.costs(); const be=+(((d.opex+d.ds)/d.rent)*100).toFixed(0);
  return {l, trigger:`Escrow opens in 10 days on <b>${esc(l.addr)}, ${esc(l.city)}</b> — ${esc(propLine(l))}. Four chairs, four subsystems, one go/no-go memo.`,
  chairs:[
   {role:'analyst', name:'Analyst chair', qs:[ qn('Break-even occupancy of the building as underwritten?', be, '%', ['(opex+debt)÷gross rent.','Both numbers are in the drawer\'s pro-forma.','('+F$(d.opex)+'+'+F$(d.ds)+')÷'+F$(d.rent)+'.'], `${be}% — the cushion (or absence of one) the whole crew builds around.`) ]},
   {role:'buyer', name:'Agent chair', qs:[ qm('Inspection surfaces a $60k sewer lateral. The clean-offer response:',[ 'A repair credit or price reduction request backed by the bid — in writing, inside the contingency window','Waive it to keep the seller happy','Walk immediately'],0,['Documented, in-window, evidence-backed.','The contingency exists exactly for this.'],'Evidence-backed credit request inside the window — the discipline that makes early offers safe to write.') ]},
   {role:'dev', name:'Developer chair', qs:[ qn('Soft-story retrofit at the cost library rate?', C.softStory, '$', ['One line in the library.','Pre-1978 multi-unit → retrofit line.','The Underwrite tab\'s library prints it.'], `${F$(C.softStory)} — mandatory in the ordinance cities; it belongs in the offer price, not the surprise column.`) ]},
   {role:'care', name:'Compliance chair', qs:[ qm('The building\'s tenancies are governed by:',[esc(rc.reg),'No regulation applies to any Bay Area rental','Rules only apply after purchase'],0,['Age + unit count + city.','The research regulation agent names it.'],esc(rc.reg)+' — the memo\'s rent-growth line must obey it.') ]}
  ]}; }};

/* ---------------- transfer checks & credentials ---------------- */
function transferQs(role){
  const m1=MISSIONS.filter(m=>m.role===role); const picks=[]; const used=new Set();
  while(picks.length<Math.min(4,m1.length)){ const m=m1[Math.floor(Math.random()*m1.length)]; if(used.has(m.id)) continue; used.add(m.id); const inst=m.make(); picks.push({m, inst, q:inst.qs[Math.floor(Math.random()*inst.qs.length)]}); }
  return picks;
}
async function issueCred(role, summary){
  const r=ROLE[role]; const now=new Date().toISOString();
  const cred={'@context':['https://www.w3.org/ns/credentials/v2','https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'],
    type:['VerifiableCredential','OpenBadgeCredential'], issuer:{id:'urn:locatorx:academy', type:'Profile', name:'locator.x Academy (AGI Corp)'},
    validFrom:now, name:r.name+' — verified competency',
    credentialSubject:{type:'AchievementSubject', achievement:{type:'Achievement', name:r.name, description:'Behavioral-transfer check passed on novel public-record properties: '+summary, criteria:{narrative:'Mixed novel-fault check, no hints, tightened tolerance, first-attempt accuracy ≥ 75%.'}}, resultsSummary:summary}};
  let digest='';
  try{ const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(cred))); digest=[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join(''); }catch(e){ digest='unavailable'; }
  cred.proof={type:'DataIntegrityProof', cryptosuite:'sha256-digest', created:now, proofValue:digest};
  P.creds.push({role, at:now, digest, cred}); save(); return cred;
}

/* ---------------- rendering ---------------- */
let view={mission:null, inst:null, qi:0, hintsUsed:0, firstTry:0, tries:0, t0:0, chair:0, transfer:null};
function render(){
  const X=L(); $('#acadN').textContent=X.allListings().length.toLocaleString('en-US');
  $('#dayloop').innerHTML=[['Acquire','Home · 20–40 min','Agent-guided micro-missions on live public-record properties deliver the concept and the first three reps. The tutor scaffolds; it never hands over the answer.','--cat2'],
    ['Apply','Field · most of the day','Shop-floor time with your mentor: open houses, listing appointments, inspections — the missions name what to practice there.','--cat1'],
    ['Reflect','Evening · 10 min','A self-regulated-learning log: what broke, which hint unlocked it, what transfers to a live client tomorrow.','--cat3'],
    ['Verify','Weekly','A behavioral-transfer check on a novel property, no hints, tighter tolerance. Pass → a portable machine-verifiable credential.','--cat4']]
    .map(x=>`<div class="dayphase" style="--c:var(${x[3]})"><div class="t">${x[0]}</div><b>${x[1]}</b><p>${x[2]}</p></div>`).join('');
  renderRoles(); renderMain(); renderLib(); renderPillars(); renderSRL(); renderMentor(); renderCreds();
}
function mastery(role){ const ms=MISSIONS.filter(m=>m.role===role); const done=ms.filter(m=>(P.missions[m.id]||{}).stars>0).length; return {done, total:ms.length, pct: done/ms.length*100, cred: P.creds.some(c=>c.role===role)}; }
function renderRoles(){
  $('#acadroles').innerHTML='<p class="eyebrow" style="margin:0 0 8px">Identity — log in to a chair, not a chapter</p><div class="rolegrid">'+ROLES.map(r=>{ const m=mastery(r.id); return `<div class="rolecard ${P.role===r.id?'on':''}" data-r="${r.id}" style="--c:var(${r.c})"><span class="mnum">${m.done}/${m.total}${m.cred?' ★':''}</span><div class="ic">${r.ic}</div><b>${r.name}</b><p>${r.why}</p><div class="mast"><i style="width:${m.pct}%"></i></div></div>`; }).join('')+'</div>';
  $$('#acadroles .rolecard').forEach(c=>c.addEventListener('click', ()=>{ P.role=c.dataset.r; view.mission=null; view.transfer=null; save(); render(); }));
}
function renderMain(){
  const box=$('#acadmain'); const role=P.role;
  if(!role){ box.innerHTML='<p style="color:var(--muted);font-size:14px">Pick a chair above — missions, telemetry and credentials attach to the role, and the difficulty dial follows your performance in it.</p>'; return; }
  if(view.transfer){ renderTransfer(box); return; }
  if(view.mission){ renderPlayer(box); return; }
  const r=ROLE[role]; const ms=MISSIONS.filter(m=>m.role===role); const mast=mastery(role); const p=prof(role);
  const crewOpen=Object.values(P.missions).filter(x=>x.stars>0).length>=3;
  const tOpen=mast.done>=ms.length;
  box.innerHTML=`<div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:4px 0 2px"><h2 class="h2" style="margin:0">${r.name} — mission map</h2><span class="zpd">ZPD dial <span class="dial"><i style="left:${(p*100).toFixed(0)}%"></i></span> ${p<0.45?'building the base':p<0.7?'at the edge':'expert band'} · tolerance ±${(tol(role)*100).toFixed(0)}%</span></div>
  <p style="font-size:13px;color:var(--ink2);max-width:75ch;margin:4px 0 6px">Two-to-seven-minute loops: <b>Trigger → Analyze → Troubleshoot → Feedback</b>. Every mission runs on a real recorded sale chosen at your difficulty band, and every rep maps to a stated competency. Mastery is first-attempt accuracy — repeat any mission on a fresh property whenever you like.</p>
  <div class="missmap">${ms.map(m=>{ const st=P.missions[m.id]||{}; return `<div class="mission ${st.stars>0?'done':''}" data-m="${m.id}"><div class="mh"><b>${m.title}</b><span class="mm">${m.min} min</span></div><p>${m.brief}</p><div class="std">Competency: ${m.std}</div><div class="stars">${st.stars? '★'.repeat(st.stars)+'☆'.repeat(3-st.stars)+' best' : '☆☆☆ not yet verified'}</div></div>`; }).join('')}
  <div class="mission ${crewOpen?'':'locked'}" data-m="crew"><div class="mh"><b>${CREW.title}</b><span class="mm">${CREW.min} min</span></div><p>${CREW.brief}</p><div class="std">Competency: cooperative multi-fault diagnosis</div><div class="stars">${(P.missions.crew||{}).stars? '★ cleared':'unlocks after any 3 missions'}</div></div></div>
  <div class="transfer"><b>Weekly verify — behavioral-transfer check.</b> ${tOpen? 'All '+r.name+' missions cleared: a novel-property check with no hints and a tightened tolerance is open. Pass it and the credential is issued to your wall.' : 'Clears after all '+ms.length+' missions in this chair ('+mast.done+'/'+ms.length+').'} <button class="btn primary" id="startTransfer" ${tOpen?'':'disabled'}>Start the check</button>${mast.cred? ' <span class="badge good">credential issued</span>':''}</div>`;
  $$('#acadmain .mission').forEach(el=>el.addEventListener('click', ()=>{ const id=el.dataset.m; if(el.classList.contains('locked')) return; startMission(id); }));
  const st=$('#startTransfer'); if(st) st.addEventListener('click', startTransfer);
}
function startMission(id){ const m= id==='crew'? CREW : MISSIONS.find(x=>x.id===id); view={mission:m, inst:m.make(), qi:0, hintsUsed:0, firstTry:0, tries:0, t0:Date.now(), chair:0, transfer:null, phase:0, answered:[]}; renderMain(); const el=$('#acadmain'); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }
function allQs(){ const m=view.mission, i=view.inst; return m===CREW? i.chairs.flatMap(c=>c.qs) : i.qs; }
function renderPlayer(box){
  const X=L(); const m=view.mission, inst=view.inst; const role=P.role; const r=ROLE[role]; const crew=(m===CREW);
  const qs= crew? inst.chairs[view.chair].qs : inst.qs; const q=qs[view.qi];
  const total= crew? inst.chairs.length : inst.qs.length; const idx= crew? view.chair : view.qi;
  const phases=['Trigger','Analyze','Troubleshoot','Feedback'];
  box.innerHTML=`<div class="player" style="--c:var(${r.c})"><div class="ph"><div style="flex:1;min-width:250px"><div class="eyebrow">${crew?'Crew mission':'Micro-mission'} · ${m.min} min band · rep ${idx+1}/${total}</div><h3>${m.title}</h3></div><button class="btn" id="pquit">Exit mission</button></div>
  <div class="loopbar">${phases.map((p,i)=>`<span class="${i===view.phase?'on':''}">${p}</span>`).join('')}</div>
  <div class="trigger">${inst.trigger}</div>
  ${inst.analyze&&view.phase>=1? `<div style="font-size:12.5px;color:var(--ink2);margin:8px 0"><b>Analyze:</b> ${esc(inst.analyze.note)} <button class="btn" id="popen" style="font-size:11px;padding:3px 8px">Open ${inst.analyze.view==='mapview'?'the map':'the '+inst.analyze.view+' tab'}</button> <span style="color:var(--muted)">(the mission stays here)</span></div>`:''}
  ${crew? `<div class="crewtabs">${inst.chairs.map((c,i)=>`<button aria-selected="${i===view.chair}" data-ch="${i}">${c.name}${(view.answered||[]).includes('c'+i)?' ✓':''}</button>`).join('')}</div>`:''}
  <div id="qzone"></div>
  <div class="telem"><span>Session accuracy <b id="tacc">${view.tries? Math.round(view.firstTry/Math.max(1,view.qi+(crew?view.chair:0))*100)+'%':'—'}</b></span><span>Hints used <b>${view.hintsUsed}</b></span><span>Clock <b id="tclock"></b></span><span style="color:var(--muted)">Telemetry feeds the ZPD dial — hints cost stars, never progress.</span></div>
  <div class="tutor"><div class="th">Dialectical tutor — scaffolds, never answers</div><div class="tlog" id="tlog"><div class="tmsg tut">Ask me anything about the concept. I will answer with the next question you need, a definition, or where to look in the app — never the number.</div></div><div class="tin"><input id="tq" placeholder="e.g. what actually counts as an operating expense?"><button class="btn" id="task">Ask</button></div></div></div>`;
  if(view.phase===0){ setTimeout(()=>{ view.phase=1; renderMain(); }, 50); return; }
  $('#pquit').addEventListener('click', ()=>{ view.mission=null; renderMain(); });
  const po=$('#popen'); if(po) po.addEventListener('click', ()=>{ if(inst.analyze.id) X.select(inst.analyze.id, true); else X.showView(inst.analyze.view); });
  $$('.crewtabs button').forEach(b=>b.addEventListener('click', ()=>{ view.chair=+b.dataset.ch; view.qi=0; renderMain(); }));
  renderQ(q, qs);
  const t0=view.t0; const tick=()=>{ const el=$('#tclock'); if(!el) return; const s=Math.floor((Date.now()-t0)/1000); el.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); if(view.mission) setTimeout(tick, 1000); }; tick();
  bindTutor(q);
}
function fmtAns(q){ return q.unit==='$'||q.unit==='$/mo'||q.unit==='$/yr'||q.unit==='$/sf'? F$(q.ans) : (q.ans+(q.unit?' '+q.unit:'')); }
function renderQ(q, qs){
  const zone=$('#qzone'); const role=P.role; const t= view.transferMode? tol(role)*0.6 : tol(role);
  zone.innerHTML=`<div class="qcard"><div class="qq">${q.q}</div>${q.type==='num'? `<div class="qrow"><input type="number" id="qans" step="any" placeholder="${q.unit||'number'}"><button class="btn primary" id="qgo">Check</button><span style="font-size:11px;color:var(--muted)">tolerance ±${(t*100).toFixed(0)}%</span></div>` : q.opts.map((o,i)=>`<div class="mcopt" data-i="${i}">${o}</div>`).join('')}<div id="qfb"></div><div class="hintrow"><button class="btn" id="qhint" ${view.transferMode?'disabled':''}>${view.transferMode?'No hints in a transfer check':'Hint ('+(q._h||0)+'/3)'}</button><div id="qhints" style="flex:1;display:flex;flex-direction:column;gap:5px"></div></div></div>`;
  let answered=false; q._tries=q._tries||0;
  const finish=(ok)=>{ if(answered) return; answered=true; P.tel.answers++; if(ok) P.tel.correct++; save();
    const fb=$('#qfb'); fb.innerHTML=`<div class="fb ${ok?'ok':'no'}"><b>${ok? (q._tries===0?'First-try. ':'Solved. ') : 'Not this time — the answer was '+ (q.type==='num'? fmtAns(q) : 'option '+(q.correct+1))+'. '}</b>${q.fb}</div><button class="btn primary" style="margin-top:8px" id="qnext">${nextLabel()}</button>`;
    if(ok && q._tries===0 && (q._h||0)===0) view.firstTry++;
    view.tries++; bumpProf(P.role, ok? (q._tries===0?0.05:0.02) : -0.07);
    $('#qnext').addEventListener('click', advance);
  };
  if(q.type==='num'){ const go=()=>{ const v=parseFloat($('#qans').value); if(isNaN(v)) return; q._tries=q._tries||0; const ok=Math.abs(v-q.ans)<=Math.max(Math.abs(q.ans)*t, q.unit==='%'?0.35: q.unit===''?0.06:60); if(ok||q._tries>=1) finish(ok); else { q._tries++; $('#qfb').innerHTML='<div class="fb no">Not within tolerance — one more attempt. Recheck which two numbers the formula wants.</div>'; P.tel.answers++; save(); } };
    $('#qgo').addEventListener('click', go); $('#qans').addEventListener('keydown', e=>{ if(e.key==='Enter') go(); }); $('#qans').focus(); }
  else { $$('#qzone .mcopt').forEach(el=>el.addEventListener('click', ()=>{ if(answered) return; $$('#qzone .mcopt').forEach(x=>x.classList.remove('pick')); el.classList.add('pick'); const ok=+el.dataset.i===q.correct; if(!ok) q._tries++; finish(ok); })); }
  $('#qhint').addEventListener('click', ()=>{ q._h=(q._h||0); if(q._h>=3) return; const h=q.hints[q._h]; q._h++; view.hintsUsed++; P.tel.hints++; save(); $('#qhints').insertAdjacentHTML('beforeend', `<div class="hint">${h}</div>`); $('#qhint').textContent='Hint ('+q._h+'/3)'; bumpProf(P.role, -0.01); });
  function nextLabel(){ const m=view.mission, i=view.inst; if(view.transfer) return view.qi+1<view.transfer.length? 'Next fault' : 'Score the check'; if(m===CREW){ const qs2=i.chairs[view.chair].qs; if(view.qi+1<qs2.length) return 'Next'; return view.chair+1<i.chairs.length? 'Next chair' : 'Debrief'; } return view.qi+1<i.qs.length? 'Next rep' : 'Debrief'; }
}
function advance(){
  const m=view.mission, i=view.inst;
  if(view.transfer){ if(view.qi+1<view.transfer.length){ view.qi++; renderTransfer($('#acadmain')); } else finishTransfer(); return; }
  view.phase=2;
  if(m===CREW){ const qs=i.chairs[view.chair].qs; (view.answered=view.answered||[]).push('c'+view.chair); if(view.qi+1<qs.length){ view.qi++; } else if(view.chair+1<i.chairs.length){ view.chair++; view.qi=0; } else { return debrief(); } renderMain(); return; }
  if(view.qi+1<i.qs.length){ view.qi++; renderMain(); } else debrief();
}
function debrief(){
  const m=view.mission; const n=allQs().length; const acc=view.firstTry/n;
  const stars= acc>=0.999&&view.hintsUsed===0?3 : acc>=0.66?2 : acc>=0.33?1 : 0;
  const prev=P.missions[m.id]||{}; P.missions[m.id]={stars:Math.max(prev.stars||0, stars), runs:(prev.runs||0)+1, last:new Date().toISOString().slice(0,10)}; save();
  const mins=((Date.now()-view.t0)/60000).toFixed(1);
  $('#acadmain').innerHTML=`<div class="player" style="--c:var(${ROLE[P.role].c})"><div class="loopbar"><span>Trigger</span><span>Analyze</span><span>Troubleshoot</span><span class="on">Feedback</span></div>
  <h3 style="font-family:var(--display)">Debrief — ${m.title}</h3>
  <p style="font-size:14px">${stars>=2? 'Verified. ':'Logged. '}First-attempt accuracy <b class="num">${Math.round(acc*100)}%</b> · ${view.hintsUsed} hint${view.hintsUsed===1?'':'s'} · ${mins} min. ${'★'.repeat(stars)+'☆'.repeat(3-stars)} ${stars===3?'— clean sweep, no scaffold.':stars>=2?'— mastery credited; rerun for the clean sweep.':'— run it again on a fresh property; mastery is first-attempt accuracy, and the property changes every run.'}</p>
  <p style="font-size:13px;color:var(--ink2)"><b>Apply with your mentor:</b> take today's subject property to the field — ${m===CREW?'walk a real 2–4 unit with your team and assign the four chairs out loud.':'pull the same numbers on the next live listing you tour, out loud, in under four minutes.'} <b>Reflect tonight:</b> one line each in the log below — what broke, which hint unlocked it, what transfers.</p>
  <div class="toolbar"><button class="btn primary" id="dagain">Run again (new property)</button><button class="btn" id="dback">Mission map</button></div></div>`;
  $('#dagain').addEventListener('click', ()=>startMission(m.id)); $('#dback').addEventListener('click', ()=>{ view.mission=null; render(); });
}
/* transfer check */
function startTransfer(){ view={mission:null, transfer:transferQs(P.role), qi:0, hintsUsed:0, firstTry:0, tries:0, t0:Date.now(), transferMode:true, phase:2, results:[]}; renderMain(); }
function renderTransfer(box){
  const r=ROLE[P.role]; const t=view.transfer; const item=t[view.qi]; const q=item.q;
  box.innerHTML=`<div class="player" style="--c:var(${r.c})"><div class="eyebrow">Behavioral-transfer check · fault ${view.qi+1} of ${t.length} · novel property · no hints · tightened tolerance</div><h3 style="font-family:var(--display)">${r.name} — verify</h3>
  <div class="trigger">${item.inst.trigger}</div><div id="qzone"></div>
  <div class="toolbar"><button class="btn" id="pquit">Abandon check</button></div></div>`;
  renderQ(q, [q]);
  $('#pquit').addEventListener('click', ()=>{ view.transfer=null; view.transferMode=false; renderMain(); });
  // record result via advance(): wrap by tracking firstTry before/after in finish (already counted)
}
async function finishTransfer(){
  const n=view.transfer.length; const acc=view.firstTry/n; const pass=acc>=0.75;
  const box=$('#acadmain'); const r=ROLE[P.role];
  if(pass){ const summary=`${Math.round(acc*100)}% first-attempt on ${n} novel faults, ${new Date().toISOString().slice(0,10)}`; await issueCred(P.role, summary); }
  box.innerHTML=`<div class="player" style="--c:var(${r.c})"><h3 style="font-family:var(--display)">${pass?'Competency verified':'Not yet — and that is fine'}</h3>
  <p style="font-size:14px">First-attempt accuracy <b class="num">${Math.round(acc*100)}%</b> on ${n} novel faults (pass ≥ 75%). ${pass? 'The credential is on your wall below — machine-readable, portable, hash-sealed. Show the JSON to anyone; the hash verifies it wasn\'t edited.' : 'The check regenerates with different properties every attempt. Re-run the weakest mission once, then come back — mastery-batched means the check waits for you, not the calendar.'}</p>
  <div class="toolbar"><button class="btn primary" id="tback">Back to the map</button></div></div>`;
  view.transfer=null; view.transferMode=false;
  $('#tback').addEventListener('click', ()=>render());
  renderCreds(); renderRoles(); renderMentor();
}
/* tutor (Claude via sample; hint-ladder fallback) */
let sampleFn;
async function getSample(){ if(sampleFn!==undefined) return sampleFn; try{ sampleFn = (window.claude&&window.claude.use)? await window.claude.use('sample') : null; }catch(e){ sampleFn=null; } return sampleFn; }
function bindTutor(q){
  const send=async()=>{ const inp=$('#tq'); const txt=inp.value.trim(); if(!txt) return; inp.value=''; const log=$('#tlog');
    log.insertAdjacentHTML('beforeend', `<div class="tmsg you">${esc(txt)}</div>`); log.scrollTop=log.scrollHeight;
    const s=await getSample();
    if(!s){ const h=q.hints[Math.min((q._h||0), q.hints.length-1)]; log.insertAdjacentHTML('beforeend', `<div class="tmsg tut">${esc('Offline scaffold: '+h+' — and ask yourself which of the two numbers in the formula you already trust.')}</div>`); log.scrollTop=log.scrollHeight; return; }
    log.insertAdjacentHTML('beforeend', `<div class="tmsg tut" id="tstream">Thinking…</div>`);
    try{ await s(`You are the Dialectical Tutor inside locator.x Academy, a real-estate training app. A learner is mid-mission. HARD RULES: never state the final answer, the final number, or which option is correct; never do the last step of arithmetic for them; respond in at most 3 sentences, Socratic — a guiding question, a definition, or where to look. If they ask for the answer outright, decline warmly and narrow their focus instead.\n\nThe question they are working on: "${q.q}"\nThe concept behind it: ${q.fb.slice(0,220)}\nTheir message: ${txt}`,
      {modelTier:'quick', cache:false, onText:({text})=>{ const el=$('#tstream'); if(el) el.textContent=text; const lg=$('#tlog'); if(lg) lg.scrollTop=lg.scrollHeight; }});
      const el=$('#tstream'); if(el) el.removeAttribute('id');
    }catch(e){ const el=$('#tstream'); if(el){ el.textContent= e&&e.code==='not_granted'? 'Claude isn\'t enabled for this page — the hint ladder still scaffolds.' : 'Tutor unavailable right now — use the hint ladder.'; el.removeAttribute('id'); } }
  };
  $('#task').addEventListener('click', send); $('#tq').addEventListener('keydown', e=>{ if(e.key==='Enter') send(); });
}
/* reading room */
function renderLib(){
  const items=[
   ['01','Move early with a clean offer','Theme from “Three Master Secrets of Real Estate Success” (Trump University audio course, 2006).','Speed built on preparation: the buyer whose underwriting, funds and terms are ready on day one wins deals the highest bidder never sees. In this app: the max-offer solver plus 3% EMD plus short honest contingencies IS the early offer.', 'b1','Drill it: Move early, move clean'],
   ['02','Opportunity arrives dressed as a problem','Theme from the same course: find the deal when problems pop up.','Probate, odd transfers, stalled permits, tired landlords — problems create the only sellers not running an auction. The ⚠ below-market-transfer flags and long-hold records in this app are a problem-finding radar. Ethics first: serve the person, then the spread.', 'b3','Drill it: Problems are inventory'],
   ['03','The velocity of money','Named theme of the 2006 course: keep your dollars working around the clock.','Return on equity falls as equity grows. The discipline is measuring it yearly and moving sleeping dollars — refinance, 1031, an ADU on land you already own — only when the redeployed dollar still covers its debt.', 'a3','Drill it: The velocity of money'],
   ['04','Bubble-proof underwriting','Theme from “Bubble-Proof Real Estate Investing” (Trump University audio course, 2006).','You cannot time cycles; you can own buildings that survive them. Fixed debt cost, DSCR that holds at rate-plus-one, break-even occupancy under 95%, and reserves. Every underwriting sheet in this app has the stress grid built in.', 'a4','Drill it: Bubble-proof it'],
   ['05','Success is a system, not a streak','Title theme of “Guaranteed Success for the Real Estate Investors” (2008).','Pipelines beat inspiration: a written buy box, every candidate screened the same way, stages tracked, offers drafted from templates. The Underwrite tab is that system made software — your job is to run it weekly.', null,'Open the Underwrite desk'],
   ['06','Wealth that stays in the community','Theme of the wealth-creation and leadership-training ventures in the catalog.','A durable practice creates owners, not just closings: first-time buyers stress-tested honestly, house-hacks that end rent, fair housing observed to the letter. The Compliance & Care chair is where this is drilled.', 'c2','Drill it: Serve first']];
  $('#acadlib').innerHTML=items.map(x=>`<div class="lesson"><div class="n">${x[0]}</div><h3>${x[1]}</h3><p style="font-size:11px;color:var(--muted)">${x[2]}</p><p>${x[3]}</p><div class="live"><a href="#" data-m="${x[4]||''}">${x[5]}</a></div></div>`).join('');
  $$('#acadlib a').forEach(a=>a.addEventListener('click', e=>{ e.preventDefault(); const mid=a.dataset.m; if(!mid){ L().showView('uw'); return; } const m=MISSIONS.find(x=>x.id===mid); P.role=m.role; save(); startMission(mid); renderRoles(); $('#acadmain').scrollIntoView({behavior:'smooth'}); }));
}
function renderPillars(){
  $('#acadpillars').innerHTML=[
   ['Identity shift','You log in as a chair — Deal Analyst, Listing Strategist — inside a live Bay Area data room. Missions are client crises with an address, never chapters.'],
   ['Adaptive challenge','Telemetry (first-attempt accuracy, hint requests, latency) moves a proficiency dial per chair; it picks harder properties and tightens tolerances at the edge of your ability — never boredom, never anxiety.'],
   ['Action loops','Every mission is a 2–7 minute Trigger → Analyze → Troubleshoot → Feedback loop on a real recorded sale, mapped to a stated competency.'],
   ['Team diagnostics','The crew mission puts four chairs on one building at once — analyst, agent, developer, compliance — the shape of a real brokerage team.'],
   ['Portable credentials','A novel-property transfer check with no hints issues an Open Badges 3.0 / W3C VC-shaped credential with a content hash — verifiable without calling anyone.']]
   .map((x,i)=>`<div class="tile"><div class="l" style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-ink);font-weight:700">Pillar ${i+1}</div><div style="font-weight:600;margin:3px 0 4px">${x[0]}</div><div class="d">${x[1]}</div></div>`).join('');
}
function renderSRL(){
  const box=$('#srl'); const today=new Date().toISOString().slice(0,10); const t=P.srl.find(x=>x.d===today)||{d:today, broke:'', hint:'', transfer:''};
  box.innerHTML=`<div class="srlrow"><label>What broke today?</label><textarea id="srl1">${esc(t.broke)}</textarea></div>
  <div class="srlrow"><label>Which hint or question unlocked it?</label><textarea id="srl2">${esc(t.hint)}</textarea></div>
  <div class="srlrow"><label>What transfers to a live client tomorrow?</label><textarea id="srl3">${esc(t.transfer)}</textarea></div>
  <button class="btn primary" id="srlsave">Save tonight's log</button>
  ${P.srl.slice(-3).reverse().filter(x=>x.d!==today||x.broke).map(x=>`<div class="srlpast"><b class="num">${x.d}</b> — broke: ${esc(x.broke||'—')} · unlocked: ${esc(x.hint||'—')} · transfers: ${esc(x.transfer||'—')}</div>`).join('')}`;
  $('#srlsave').addEventListener('click', ()=>{ const e={d:today, broke:$('#srl1').value.trim(), hint:$('#srl2').value.trim(), transfer:$('#srl3').value.trim()}; P.srl=P.srl.filter(x=>x.d!==today).concat([e]); save(); L().toast('Logged — reflection is the rep that makes the others stick'); renderSRL(); });
}
function renderMentor(){
  const box=$('#mentor'); const acc=P.tel.answers? Math.round(P.tel.correct/P.tel.answers*100) : null;
  box.innerHTML=`<p style="font-size:12px;color:var(--ink2);margin:0 0 8px">The agentic engine handles mechanics — pacing, telemetry, feedback, scaffolds. The mentor owns wisdom: ethics calls, creative provocation, field application and the Socratic debrief — and can override the engine, logged.</p>
  ${ROLES.map(r=>{ const m=mastery(r.id); return `<div class="mrow" style="--c:var(${r.c})"><span>${r.name}</span><div class="bar"><i style="width:${m.pct}%"></i></div><b>${m.done}/${m.total}${m.cred?' ★':''}</b></div>`; }).join('')}
  <div class="telem" style="margin-top:10px"><span>Lifetime accuracy <b>${acc==null?'—':acc+'%'}</b></span><span>Answers <b>${P.tel.answers}</b></span><span>Hints <b>${P.tel.hints}</b></span><span>Reflections <b>${P.srl.length}</b></span></div>
  <div class="toolbar" style="margin-top:10px"><button class="btn" id="ovr">Mentor override: mark current chair verified</button></div>
  ${P.overrides.length? `<div style="font-size:11px;color:var(--muted);margin-top:6px">Override log: ${P.overrides.map(o=>`${o.d} — ${esc(o.what)}`).join(' · ')}</div>`:''}`;
  $('#ovr').addEventListener('click', async()=>{ if(!P.role){ L().toast('Pick a chair first'); return; } const r=ROLE[P.role]; P.overrides.push({d:new Date().toISOString().slice(0,10), what:'verified '+r.name+' by mentor authority'}); await issueCred(P.role, 'Mentor override — human authority, logged '+new Date().toISOString().slice(0,10)); save(); L().toast('Override logged and credential issued — the human outranks the engine'); render(); });
}
function renderCreds(){
  const box=$('#acadcreds'); if(!P.creds.length){ box.innerHTML='<p style="font-size:13px;color:var(--muted)">No credentials yet. They are earned in the weekly verify — or granted by mentor override, which is logged as exactly that.</p>'; return; }
  box.innerHTML='<div class="badgewall">'+P.creds.map((c,i)=>{ const r=ROLE[c.role]; return `<div class="cred" style="--c:var(${r.c})"><div class="seal">${r.ic}</div><b>${r.name}</b><div class="meta">issued ${c.at.slice(0,10)}<br>sha-256 ${String(c.digest).slice(0,18)}…<br>Open Badges 3.0 / W3C VC shape</div><button class="btn" data-cp="${i}">Copy credential JSON</button></div>`; }).join('')+'</div>';
  $$('#acadcreds [data-cp]').forEach(b=>b.addEventListener('click', async()=>{ try{ await navigator.clipboard.writeText(JSON.stringify(P.creds[+b.dataset.cp].cred, null, 1)); L().toast('Credential JSON copied — hash-sealed and portable'); }catch(e){ L().toast('Clipboard blocked in this host'); } }));
}
window.LXAcad={render};
})();
