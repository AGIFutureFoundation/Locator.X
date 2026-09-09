/* locator.x — retrieval system (RAG) over the research corpus.
   BM25 lexical retrieval, fully in-page so it scales with the corpus and works offline;
   when the viewer grants the `sample` capability, top passages are handed to Claude for a
   grounded, cited synthesis — retrieve → augment → generate. */
(function(){
'use strict';
const L=()=>window.LX;
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));

/* ---------- the 16 expansion research modules (public-record signal areas 8–23) ---------- */
const LIB=[
{id:'taxdelinq', t:'Tax delinquency & defaulted rolls', s:'County tax collector',
 w:'Every California county tax collector publishes a defaulted-tax list — parcels five or more years delinquent become subject to the tax sale (R&T §3691). Orleans Parish runs adjudicated-property auctions through CivicSource.',
 h:'Pull the county tax-defaulted list (SF Treasurer-Tax Collector publishes auction lists; Alameda posts its "public auction" parcel file; Orleans adjudications are on data.nola.gov). Match APNs against the atlas.',
 sc:'A delinquent APN is one of the strongest distress markers in public record: score it like a basis-gap estate signal but with a shorter fuse — the owner must cure or lose the parcel.',
 c:'Delinquency lists lag by months; always re-verify with the collector before contact. Redemption often happens at the deadline.'},
{id:'probate', t:'Probate filings', s:'Superior court probate index',
 w:'Estates that hold real property pass through probate; the court index (searchable by county) names the decedent, the personal representative, and often the property. Probate sales frequently clear below market because the estate optimizes for speed and certainty.',
 h:'Search the county superior-court probate index weekly; cross-reference decedent surnames against long-hold owners flagged by the estate signal (30+ year basis gap). Louisiana successions play the same role in Orleans Parish.',
 sc:'Layer on top of the basis-gap estate signal: a probate hit upgrades an estate-signal property from "eventually" to "in motion now".',
 c:'Court indexes are public but scraping terms vary; respectful manual search or licensed data vendors. Never contact families in the first weeks of a filing.'},
{id:'nod', t:'Notices of default & trustee sales', s:'County recorder',
 w:'California foreclosures start with a recorded Notice of Default (NOD), then a Notice of Trustee Sale ~90 days later. Both are public recorder documents with the APN on their face.',
 h:'County recorder grantor/grantee search on document type NOD/NTS — there is no free bulk feed for this anywhere verified: a cross-portal search of every US government Socrata site returns zero mortgage-related datasets for "lis pendens" and none for "notice of default," and data.sfgov.org alone returns zero results for "foreclosure." Maricopa, Franklin and the Bay Area recorders all publish per-document search UIs, not bulk files — plan on manual recorder search (or a paid ATTOM/RealtyTrac feed) rather than an open-data pull. Louisiana is judicial — watch the civil district court docket and sheriff-sale calendar instead.',
 sc:'An NOD is a hard distress event: pre-foreclosure outreach windows are short. Weight it above every soft signal; pair with equity math (recorded basis vs ZIP value) to see whether a workout is possible.',
 c:'Most NODs cure. The play is helping an equity-rich owner solve a liquidity problem — not chasing auctions, where pros with cash dominate.'},
{id:'codeenf', t:'Code-enforcement & blight cases', s:'City open data',
 w:'Open code-enforcement cases mark deferred maintenance, absentee fatigue, or a stalled project. SF publishes DBI complaints; Oakland publishes code-enforcement cases; New Orleans publishes blight/BlightStatus cases on data.nola.gov.',
 h:'Filter open cases older than 12 months at multifamily and commercial addresses; join by address/APN to the atlas. Repeat complaints at one parcel are the tell.',
 sc:'Score as a value-add flag: the condition discount is documented in the public file before you ever tour.',
 c:'A violation also prices remediation risk into YOUR underwriting — pull the full case file, not just the count.'},
{id:'mechlien', t:'Mechanics liens', s:'County recorder',
 w:'A recorded mechanics lien means a contractor was not paid — often a renovation that ran out of money mid-flight. Those owners hold half-finished buildings that conventional buyers cannot finance.',
 h:'Recorder search by document type; match APNs. A lien plus an expired building permit (already in the permit signal) is the classic stalled-flip pattern.',
 sc:'Weight like heavy-rehab value-add with a motivated seller; the lien amount tells you the minimum hole in the project.',
 c:'Liens can be disputed or already settled without a recorded release. Title will surface everything anyway — this is a lead signal, not diligence.'},
{id:'evict', t:'Eviction & rent-board activity', s:'Courts and rent boards',
 w:'SF publishes eviction notices by type (Ellis Act, OMI, nuisance) on DataSF; Oakland and Berkeley rent boards log petitions. Ellis Act filings in particular mark owners exiting the rental business — buildings that often trade soon after.',
 h:'DataSF dataset 5cei-gny5 (eviction notices) joined by address; watch Ellis and OMI clusters by block.',
 sc:'An Ellis filing on a 5+ unit building is a strong forward-listing signal; also a regulatory flag for your own plan, since re-rental restrictions follow the parcel.',
 c:'Eviction data is about people losing housing — use it to find sellers, never to pressure tenants. Restrictions travel with the deed.'},
{id:'bizchurn', t:'Business-license churn', s:'City license registries',
 w:'Ground-floor commercial vacancy shows up first as license closures. SF publishes registered business locations with start/end dates; New Orleans publishes occupational licenses.',
 h:'Count closures minus openings per block over trailing 12 months; a corridor losing licenses re-prices its mixed-use buildings well before the assessor catches up.',
 sc:'Feed into the corp-signal ZIP layer as a hyper-local overlay: block-level churn beats county WARN notices for retail corridors.',
 c:'License data is noisy (renewals, moves, home businesses). Use trends, not single events.'},
{id:'fire', t:'Fire & incident records', s:'Fire department open data',
 w:'Structure-fire incidents are published by SF Fire (DataSF) and NOFD. A burned multifamily building is the hardest possible sale for its owner and often transacts as-is to whoever can carry the rebuild.',
 h:'Filter incident type to structure fire at 2+ unit addresses in the last 24 months; join to the atlas by address.',
 sc:'Extreme value-add flag: pair with the permit signal to see whether the owner started repairs (permit pulled = staying; nothing after 12 months = candidate).',
 c:'Insurance, habitability and tenant right-to-return rules apply; underwrite the legal timeline, not just construction.'},
{id:'vacancy', t:'USPS vacancy data', s:'HUD Aggregated USPS data',
 w:'HUD publishes USPS address-vacancy counts by census tract quarterly — the closest thing to a public occupancy sensor. Tracts with rising long-term-vacant residential counts hold the boarded-up buildings every value-add buyer is looking for.',
 h:'HUD USPS files (huduser.gov, free account) by tract; map tract → ZIP; flag atlas properties in high/rising-vacancy tracts, especially large buildings.',
 sc:'A tract-level multiplier on the conversion score: vacancy is where conversions to student and family housing are politically easiest.',
 c:'Tract-level only — it tells you where to hunt, not which door. Ground-truth with a drive-by.'},
{id:'divorce', t:'Family-court dissolutions', s:'Superior court civil index',
 w:'Dissolution cases routinely force the sale of jointly-held property; the civil index is public. Investors watch it in every market; few do it respectfully.',
 h:'County civil index search by case type; match respondent names to owner names on long-hold parcels. Louisiana community-property partitions serve the same role.',
 sc:'A soft forward-listing signal, weaker than probate: many couples keep or refinance. Use only as a tiebreaker between otherwise-equal leads.',
 c:'This is sensitive personal data — market to the address with a generic "we buy" letter if at all; never reference the filing.'},
{id:'bankruptcy', t:'Bankruptcy filings (owner entities)', s:'PACER / court RSS',
 w:'When an LLC that owns buildings files Chapter 7 or 11, its schedule A lists every parcel. Court-supervised sales follow. PACER exposes new filings; free RSS feeds cover each district.',
 h:'Watch NDCal and EDLa bankruptcy feeds for debtor names matching LLC owners you\'ve mapped through absentee-owner mail ZIPs; §363 sales are announced in the docket.',
 sc:'Corporate-distress signal at parcel precision — the strongest version of the corp signal.',
 c:'Bankruptcy sales need court approval and overbid procedures; the docket is the diligence.'},
{id:'upzoning', t:'Rezoning & upzoning dockets', s:'Planning commission agendas',
 w:'Value is created the day the zoning changes, years before construction. SB 9 lot splits, SB 35/423 streamlining, density-bonus projects, and each city\'s housing-element rezonings are all public process with published parcel lists.',
 h:'Track planning-commission agendas and each city\'s housing-element rezoning inventory (state HCD publishes them). San Jose\'s opportunity-housing areas and SF\'s Family Zoning plan name parcels directly.',
 sc:'Prospective upside score: a parcel inside a proposed rezoning at today\'s zoning price is the cleanest asymmetric bet in the dataset.',
 c:'Political processes slip and shrink; buy only what works under current zoning, and treat the upzone as a free option.'},
{id:'schools', t:'School enrollment trends', s:'CDE DataQuest / LDOE',
 w:'Family demand follows schools. California DataQuest publishes enrollment by school and year; Louisiana LDOE the same. Multi-year enrollment growth marks the neighborhoods where 2–3 BR family conversions rent instantly.',
 h:'Pull 5-year enrollment deltas for elementary schools near candidate properties; positive deltas + rising rents = the family-conversion map.',
 sc:'Demand-side multiplier for the family-housing conversion strategy (the counterpart to Xavier-distance for student housing).',
 c:'Enrollment also falls when families are priced out — read it against rent trend, never alone.'},
{id:'crime', t:'Incident trend by tract', s:'City open data',
 w:'Both SF and New Orleans publish incident-level police data. The investable fact is the trajectory, not the level: tracts improving from a high base re-price fastest.',
 h:'Compute 3-year incident slope per tract; overlay on the atlas. Improving-tract properties at declining-tract prices are the arbitrage.',
 sc:'Momentum modifier on the growth modality — same math as ZIP price momentum, applied to a leading quality-of-life series.',
 c:'Reporting practices change and distort series; compare within one city only, and never redline — the signal is change, not category.'},
{id:'capital', t:'Transit & capital-plan corridors', s:'Transit agency budgets',
 w:'BART extensions, VTA\'s Silicon Valley phase II, Caltrain electrification infill, New Orleans RTA corridor studies — adopted capital plans list stations and alignments years ahead. Walk-shed parcels re-price when service starts.',
 h:'Map adopted (not aspirational) capital projects; flag atlas parcels within 800m of a funded future station.',
 sc:'Long-horizon growth modality input — patient-money counterpart to the momentum signals.',
 c:'Only funded, approved phases count. Planning documents are full of lines that never get built.'},
{id:'distressmap', t:'The real distress-data landscape: what\'s actually free', s:'Cross-source research, Sept 2026',
 w:'A full pass across every free foreclosure/distress source found the thing everyone assumes exists — bulk Notices of Default or Lis Pendens — does not: a nationwide catalogue search returns zero mortgage-related datasets for "lis pendens" and none for "notice of default," and data.sfgov.org alone returns zero results for "foreclosure." What is real and free: (1) HUD\'s FHA REO layer — live, national, per-property, zero owner PII, wired into this platform as the Federal REO cross-signal; (2) county tax distress — delinquency, tax default, adjudication and in-rem petitions, parcel-keyed but legally distinct from mortgage foreclosure; (3) aggregate mortgage delinquency — CFPB by county, FHFA by metro, a leading indicator that never resolves to an address. Of the counties and parishes this platform covers, only East Baton Rouge, Milwaukee and Wake have a real county-specific distress feed; San Francisco, Alameda, Santa Clara and San Mateo have nothing free at the property level, and Orleans\' own sheriff-sale dataset is excluded — eight years stale and built around named defendants rather than parcels.',
 h:'Four verified sources carry natural-person data that must be stripped before ingest, not just flagged: East Baton Rouge Parish adjudicated-property (owner, ownadd, owncity), Milwaukee\'s in-rem petition PDFs (the Owners line and mortgage-parties block), Sonoma County\'s tax-default file (mailaddress1-4 — the first sampled row read "C/O M TERESA HERRERA ESQ"), and USDA\'s frozen-2018 REO file (agent names and phone numbers in remarks). In every case the parcel identifier, address, dates and amounts survive the drop intact. Sonoma is documented here as an unused reference template — the concrete proof that a Bay Area county could publish this and currently doesn\'t.',
 sc:'Don\'t score a county as clean just because nothing is wired for it: the honest state for San Francisco, Alameda, Santa Clara and San Mateo is "unmeasured," not "zero distress." Where a real feed exists — HUD REO now, tax-distress feeds if EBR/Milwaukee/Wake get wired later — weight it as a hard signal; everywhere else, say plainly that mortgage pre-foreclosure isn\'t covered rather than implying a clean read.',
 c:'HUD REO is FHA loans only, a narrow slice of all foreclosure activity, and genuinely small (75 CA cases, 115 LA cases nationwide at pull time). Commercial aggregators — RealtyTrac/ATTOM and peers — are the only comprehensive national NOD/Lis Pendens source, and they are paid and ToS-restricted: categorically out of scope for this platform, not a gap to work around.'}];

/* ---------- corpus ---------- */
let docs=null, idf=null, avgdl=0;
const STOP=new Set('the a an and or of to in for on with at by from is are was be as it its this that these those you your'.split(' '));
const tok=s=>String(s).toLowerCase().replace(/[^a-z0-9\s%$]/g,' ').split(/\s+/).filter(w=>w.length>1&&!STOP.has(w));
function buildCorpus(){
  if(docs) return docs;
  docs=[];
  const add=(id,title,src,text)=>{ const tks=tok(title+' '+text); docs.push({id,title,src,text,tks,tf:count(tks)}); };
  const count=a=>{ const m={}; a.forEach(w=>m[w]=(m[w]||0)+1); return m; };
  LIB.forEach(m=>add('lib:'+m.id, m.t, m.s, [m.w,m.h,m.sc,m.c].join(' ')));
  // live signal research already in the page
  try{ if(window.LXSig && window.LXSig.docs) window.LXSig.docs().forEach(d=>add('sig:'+d.id, d.t, d.s||'Cross-signal engine', d.text)); }catch(e){}
  // record-locker source catalogue + whatever the user has saved per property
  try{ if(window.LXRec && window.LXRec.docs) window.LXRec.docs().forEach(d=>add(d.id, d.t, d.s||'Record locker', d.x)); }catch(e){}
  // methodology
  add('m:evidence','How the evidence grade works and what it does not mean','Methodology','Every record is graded A to D on WHAT ITS SOURCE ACTUALLY PUBLISHES, never on how good the deal looks. Seven weighted tests: a recorded use (22), a published value (20), a size in units or building area (18), a year built (13), a recorded sale price (12), a lot area (9), building detail such as beds baths or storeys (6). A is 78 or above and means underwritable from the record; B is 58; C is 36 and means enough to shortlist but not to offer; D is a location and little else. Two ceilings override the arithmetic: a record selected by ZONING rather than use can never exceed 55, because a district permitting something is not evidence a building stands there, and a record the source leaves unclassified can never exceed 34 however complete the rest of it is. A grade is a statement about the paperwork and never about the asset. A grade A record can be a terrible buy and a grade D record an excellent one you cannot yet verify. What it tells you is how much diligence the county has already done and therefore where your own time has to go. The corridor scorecard ranks each area twice, once by announced private capital and once by how much stock is good enough to underwrite, because those two rankings disagree and the disagreement is where the work is.');
  add('m:comps','What counts as a comparable sale, and the three defects that had to be fixed','Methodology','A comparable is a RECORDED SALE CARRYING A RECORDED DATE. Not an assessor value dressed up as a price, not a sale whose year is unknown, not a parcel in another metro. Comparables are drawn from the same market, same broad class of multifamily lodging or commercial, units within 0.4 to 2.5 times, floor area within 0.45 to 2.2 times, age within thirty years, inside fourteen kilometres, sold within six years. Ranges are quoted as an interquartile spread rather than an average because dispersion is what tells you whether a market is priced or merely traded. Under five qualifying sales the desk states why and stops; an unpriced asset is an honest output and a comparable set of two is not. THREE DEFECTS WERE FOUND AND FIXED. First, portfolio deeds: when a whole complex trades many counties write the entire transaction price onto every parcel in it, and Franklin County carries condominium units on the roll at fifty three thousand five hundred dollars each with a recorded sale price of one hundred and seventy million, which pushed that county median sale to value ratio to 162 times before detection. Any price appearing on the same date against four or more parcels is treated as a portfolio deed and excluded. Second, sale dates were being dropped in normalisation and had to be recovered from the raw pulls; Saint Joseph County publishes four thousand three hundred and forty seven sale prices and a date on twelve of them, Washoe publishes prices with no dates at all, and Marion publishes no sale price whatsoever, so those counties drop out. Third, vacant land breaks the roll ratio because a lot carried at a nominal few thousand and sold at a development price gives an arithmetically correct and completely misleading number, so the roll signal is improved property only. TWO VALUATION BASES exist and are never mixed in one median: a recorded sale, and a post sale assessed value which in California resets to the purchase price on transfer and tracks the deal closely but is an assessment and not the deed. Per unit ratios are clamped between eight thousand and nine hundred thousand and per square foot between eight and fifteen hundred, because several counties publish a complex level unit count stamped on every row of a development and unit counts derived from a class description are band lower bounds rather than counts.');
  add('m:roll','Cross referencing two public records to find a stale assessment roll','Methodology','Every county publishes two numbers about the same parcel: what its assessor thinks it is worth and what somebody actually paid. Dividing the second by the first across every dated recorded sale in the last three years says how current the roll is. Above 1.00 the roll is behind the market, buyers are paying more than the published value, and any screen that trusts assessed values will systematically understate that county. Below 1.00 the roll is ahead, or the recorded transfers include non arm length deeds. The measure uses improved property only with both sides above twenty five thousand dollars and a minimum of forty dated sales per county, reports the median with its interquartile range rather than an average, and excludes portfolio deeds. It does not adjust for family conveyances, donations or successions, which Louisiana parishes record alongside cash sales and which Tangipahoa marks unverified on every row. An extreme ratio almost always means the two numbers describe different things rather than a real market signal.');
  add('m:score','How the Locator X score works','Methodology','Evidence-weighted ensemble of eleven modalities: cash flow, cap rate, DSCR, gross yield, value-add potential, growth momentum, risk, Scout forecast, price-basis quality, market depth, and live distress records (lien foreclosures, code-enforcement cases, non-payment eviction rates). Each modality weight is multiplied by the evidence behind it with a 15% floor, then renormalized to 100 — an estimated value moves the score less than a recent recorded sale.');
  add('m:recon','How the 3D reconstruction is built and what it is not','Methodology','The massing model is derived, never observed. Floors come from a recorded story count where one exists, otherwise from unit count and use class. Footprint is floor area divided by floors, capped at 62 percent of the recorded lot. Plan proportion follows regional form: pre-1945 New Orleans and Baton Rouge houses and doubles are drawn narrow and deep because that is how they sit on those lots; postwar ranches are drawn wide. Roof form and facade material are schematic conventions selected from region, vintage and use class — clapboard on an early Louisiana cottage, brick on a mid-century one, stucco on a San Francisco flat, ribbed metal on an industrial shed. Colour is a deterministic hash of the record id inside a regionally plausible palette. NONE of this is evidence about the actual building: it is a diagram of what the record implies, and it must never be presented to a lender, seller or partner as an image of the property. The Record Locker exists precisely so the real aerials, panorama and permit file are one click away.');
  add('m:locker','What the Record Locker does and refuses to do','Methodology','For each property it assembles the public-record and imagery sources that exist for that jurisdiction: assessor and parcel record, deed and lien index, permit and code-enforcement file, FEMA flood panel, census geography, street-level panorama, current aerial and historic aerial series. A source marked DIRECT has a tested deep link that lands on the address — the San Francisco Property Information Map, the FEMA Map Service Center, historic aerials, and the Google and OpenStreetMap coordinate links. A source marked SEARCH opens the correct official page; those forms cannot be addressed from a URL, some sit behind a terms checkbox or a CAPTCHA, and the app copies the address to the clipboard instead of pretending otherwise. Locator.X never fetches, scrapes or caches any of these portals — San Francisco DBI among others states that automated access to its system is abuse. Saved links and notes live in the browser only and export as JSON.');
  add('m:est','What the price labels mean','Methodology','Prices marked estimate are ZIP-level Zillow home-value-index scaling, used only where the county publishes no assessed values. Prop 13 assessed-basis prices can sit far below market for long-held parcels — the gap itself is the estate signal. Nothing in the catalog is a fabricated listing; every record traces to a county roll, parcel GIS file or licensed index.');
  add('m:below','How the below-market assessment works','Methodology','Three measures run independently and are never averaged when one is missing. A recorded sale under the ZIP typical value carries half the weight, because a closed transaction is the strongest evidence public record offers. Price per square foot under the city median carries thirty percent. The Prop 13 assessed-basis gap carries twenty percent and is labeled for what it is: tenure. A basis far below the ZIP typical value means the owner has held for decades, which makes them a likely future seller — it is NOT a price you can pay, and the app says so on every record where basis is the only evidence. The composite index runs 0 to 90; anything backed by a sale or comps is flagged sale/comps backed.');
  add('m:upgrade','Upgrade options that close the gap','Methodology','Every below-market assessment prices the development plays that could close its gap: ADU and second-unit additions, interior modernization, unit conversion, and where zoning allows it, adding units. Each play carries a cost, added monthly rent, added value, profit and a timeline, drawn from the cost library on the Underwrite tab — which is editable, so replace the defaults with your own contractor bids before trusting any of it.');
  add('m:3d','The live 3D dashboards','Methodology','The opportunity cube plots every candidate on three axes at once — cap rate across, below-market index vertical, monthly cash flow in depth — sized by unit count and colored by score tier, spinning slowly and clickable through to an assessment. The market skyline renders an isometric tower per city, height being the count of below-market candidates. The ZIP towers extrude the live map itself: each ZIP rises to its median value for whichever metric you pick — below-market index, Locator X score, cash flow, live distress records or the twelve-month forecast — with the camera pitched into 3D.');
  add('m:views','Building custom views','Methodology','The view builder on the dashboard filters everything downstream at once — dashboard cards, the map, the charts and the below-market hunt. Nine asset classes can be viewed one at a time or stacked together: multifamily 2-4, apartments 5+, hotels and lodging, commercial, industrial and storage, condo and townhouse, single-family, conversion class, and land only. A structure selector separates land from improved buildings using each county own use description. Price accepts plain language — under 500k, 300k-700k, over 1m, or a bare number for a ten percent band around it. Target categories filter to asset, house hack, value-add, growth or liability. Views can be saved by name and reloaded.');
  add('m:income','Six ways a building earns','Methodology','Rent methods modeled per property: whole-unit market rent from the ZIP rent index; per-bedroom; room-by-room (rooms times ZIP rent times 0.62); student per-bed near universities; short-term-stay where licensing allows (New Orleans French Quarter and Garden District excluded — licenses are not issued there); and HUD Fair Market Rent for voucher tenancies (FY2026: SF 2BR $3,604, San Jose $3,483, Oakland $2,912).');
  // live market snapshot from real data
  try{
    const M=L().M; const byC={};
    Object.keys(M.zips||{}).forEach(z=>{ const e=M.zips[z]; if(!e.v) return; const c=e.county||'Other'; (byC[c]=byC[c]||[]).push(e); });
    const bits=Object.entries(byC).map(([c,rows])=>{
      const lasts=rows.map(e=>e.v.filter(Boolean).slice(-1)[0]).filter(Boolean);
      const y13=rows.map(e=>e.v[12]).filter(Boolean);
      if(!lasts.length) return null;
      const avg=lasts.reduce((s,x)=>s+x,0)/lasts.length, avg13=y13.length? y13.reduce((s,x)=>s+x,0)/y13.length:null;
      return c+' county average home value $'+Math.round(avg/1000)+'k'+(avg13?', year over year '+((avg/avg13-1)*100).toFixed(1)+'%':'');
    }).filter(Boolean);
    if(bits.length) add('m:market','Current market snapshot','Live index data', bits.join('. '));
  }catch(e){}
  // idf
  const df={}; docs.forEach(d=>{ new Set(d.tks).forEach(w=>df[w]=(df[w]||0)+1); });
  idf={}; const N=docs.length;
  Object.entries(df).forEach(([w,n])=>idf[w]=Math.log(1+(N-n+0.5)/(n+0.5)));
  avgdl=docs.reduce((s,d)=>s+d.tks.length,0)/N;
  return docs;
}
function search(q, k){
  buildCorpus();
  const qt=tok(q); if(!qt.length) return [];
  const k1=1.5,b=0.75;
  return docs.map(d=>{
    let sc=0;
    qt.forEach(w=>{ const f=d.tf[w]||0; if(f) sc+=(idf[w]||0)*f*(k1+1)/(f+k1*(1-b+b*d.tks.length/avgdl)); });
    return {d,sc};
  }).filter(r=>r.sc>0).sort((a,b2)=>b2.sc-a.sc).slice(0,k||5);
}
function propMatches(q){
  const X=L(); const qt=tok(q); if(!qt.length) return [];
  const zips=qt.filter(w=>/^\d{5}$/.test(w));
  const kinds=['hotel','sro','apartment','warehouse','office','commercial','duplex','triplex','fourplex','parking','industrial','units','large'];
  const kq=qt.filter(w=>kinds.includes(w));
  const cq=qt.map(w=>w[0].toUpperCase()+w.slice(1));
  if(!zips.length&&!kq.length) return [];
  return X.allListings().filter(l=>{
    if(zips.length&&!zips.includes(String(l.zip))) return false;
    if(kq.length&&!kq.some(w=>(l.kind||'').toLowerCase().includes(w==='units'?'unit':w))) return false;
    if(cq.length&&zips.length===0&&kq.length===0) return false;
    return true;
  }).slice(0,40);
}
let sampleFn;
async function getSample(){ if(sampleFn!==undefined) return sampleFn; try{ sampleFn=(window.claude&&window.claude.use)? await window.claude.use('sample'):null; }catch(e){ sampleFn=null; } return sampleFn; }

/* ---------- UI ---------- */
function render(){
  const root=$('#ragroot'); if(!root||root.dataset.done) return; root.dataset.done='1';
  buildCorpus();
  root.innerHTML=`
  <div class="tile" style="margin-bottom:18px">
    <p class="eyebrow">Ask the research system</p>
    <h3 style="margin:4px 0 6px">Retrieval over ${docs.length} research modules — scales as the library grows</h3>
    <p class="chartnote">Type a question about signals, sourcing, methods or a market ("how do I find pre-foreclosures", "student housing demand", "94601 apartments"). The system retrieves the most relevant passages by BM25 ranking, entirely in this page. Where the viewer has granted it, Claude can synthesize the retrieved passages into one grounded answer.</p>
    <div class="toolbar" style="gap:8px"><input id="ragq" type="search" placeholder="Ask about signals, methods, markets…" style="flex:1;max-width:520px"><button class="btn primary" id="raggo">Search</button><button class="btn" id="ragsyn" style="display:none">Synthesize with Claude</button></div>
    <div id="ragout" style="margin-top:10px"></div>
  </div>
  <div class="tile" style="margin-bottom:18px">
    <p class="eyebrow">Research library — 16 further public-record signal areas</p>
    <p class="chartnote">Beyond the ten live cross-signals: sixteen more public-record collection points, each with where the record lives, how to pull it, and how it folds into the score. Click to expand.</p>
    <div id="raglib"></div>
  </div>`;
  $('#raglib').innerHTML=LIB.map((m,i)=>`
    <details class="libcard" style="border-top:1px solid var(--line2);padding:8px 0">
      <summary style="cursor:pointer;display:flex;gap:10px;align-items:baseline"><b>${i+8}. ${m.t}</b><span style="font-size:12px;color:var(--muted)">${m.s}</span></summary>
      <div style="font-size:13.5px;line-height:1.55;padding:8px 0 4px;max-width:820px">
        <p style="margin:0 0 6px">${m.w}</p>
        <p style="margin:0 0 6px"><b>How to collect:</b> ${m.h}</p>
        <p style="margin:0 0 6px"><b>In the score:</b> ${m.sc}</p>
        <p style="margin:0;color:var(--muted)"><b>Caution:</b> ${m.c}</p>
      </div>
    </details>`).join('');
  const go=async()=>{
    const q=$('#ragq').value.trim(); if(!q) return;
    const hits=search(q,5); const props=propMatches(q);
    const X=L();
    $('#ragout').innerHTML=(hits.length? hits.map(h=>`
      <div style="border-left:3px solid var(--bay);padding:6px 12px;margin:8px 0;background:var(--panel2);border-radius:0 8px 8px 0">
        <div style="font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)">${X.esc(h.d.src)} · relevance ${h.sc.toFixed(1)}</div>
        <b style="font-size:13.5px">${X.esc(h.d.title)}</b>
        <p style="font-size:13px;margin:4px 0 0;line-height:1.5">${X.esc(h.d.text.length>420? h.d.text.slice(0,420)+'…' : h.d.text)}</p>
      </div>`).join('') : '<p style="font-size:13px;color:var(--muted)">No research passages matched — try different words.</p>')
      +(props.length? `<div style="margin-top:8px"><span class="eyebrow">Matching properties</span><div class="chips" style="margin-top:4px">${props.slice(0,12).map(l=>`<button class="chip" data-sel="${l.id}">${X.esc(l.addr)}, ${X.esc(l.city)}</button>`).join('')}${props.length>12?`<span style="font-size:12px;color:var(--muted)">+${props.length-12} more</span>`:''}</div></div>`:'');
    $$('#ragout [data-sel]').forEach(b=>b.addEventListener('click',()=>X.select(b.dataset.sel,true)));
    window.__ragHits=hits; window.__ragQ=q;
    const sf=await getSample(); const sb=$('#ragsyn'); if(sb){ sb.style.display=sf&&hits.length?'':'none'; }
  };
  $('#raggo').onclick=go;
  $('#ragq').addEventListener('keydown',e=>{ if(e.key==='Enter') go(); });
  $('#ragsyn').onclick=async()=>{
    const sf=await getSample(); if(!sf||!window.__ragHits) return;
    const out=$('#ragout'); const box=document.createElement('div');
    box.style.cssText='border:1px solid var(--line2);border-radius:10px;padding:12px;margin-top:10px;font-size:13.5px;line-height:1.6;white-space:pre-wrap';
    box.textContent='Thinking…'; out.prepend(box);
    const ctx=window.__ragHits.map((h,i)=>`[${i+1}] ${h.d.title} (${h.d.src}): ${h.d.text}`).join('\n\n');
    try{
      const r=await sf(`You are the research assistant inside locator.x, an investment-property research tool. Answer the user's question using ONLY the retrieved passages below. Cite passages as [1], [2]… Do not invent facts, prices or sources; if the passages don't cover it, say so.\n\nRetrieved passages:\n${ctx}\n\nQuestion: ${window.__ragQ}`, {onText:t=>{ box.textContent=t.text; }});
      box.textContent=r.text;
    }catch(e){ box.textContent= e&&e.code==='declined'? 'Synthesis declined.' : 'Synthesis unavailable in this view — the retrieved passages above are the answer.'; }
  };
}
window.LXRAG={render, search, LIB};
})();
