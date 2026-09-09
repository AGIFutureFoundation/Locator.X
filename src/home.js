/* ===== Locator.X — Home: what this is, how to use it, and a place to ask =====
   Three things live here and nothing else:

     1. An honest description of what this edition holds and what it will not
        tell you. A tool that underwrites property has to say plainly where its
        numbers come from before it shows anybody a number.
     2. A guided tour that walks the six sections and twenty-eight views in the
        order a person would actually use them, and opens each one.
     3. A question box over a written help corpus. It searches text this file
        carries — it does not call out to anything, it works with the network
        off, and when it has no good answer it says so instead of guessing.

   The corpus is deliberately written as answers, not as feature blurbs. "What
   does the score mean" is a question somebody types; "Locator X Score v2" is
   not.
   ========================================================================= */
(function(){
'use strict';
var $  = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
var L = function(){ return window.LX; };

/* ---------------------------------------------------------------- the views */
/* One entry per view: the section it belongs to, what it is for in a sentence,
   and what a person should do with it first. Order is the tour order. */
var VIEWS = [
  ['dash','Find','Dashboard',
   'Every record in this edition, scored 0–100 and sorted, with the tiles that say how many actually pay for themselves at your numbers.',
   'Read the four tiles first. They answer "is there anything here" before you look at a single property.'],
  ['mapview','Find','Map',
   'The same set on a map, coloured by whichever lens you pick — cash flow, score, below-market, distress or the ZIP forecast. The Sector bubbles toggle in the map toolbar draws every ZIP as one translucent bubble sized by its stock and split by housing mix, with a Play button that walks the whole field through its published month history — a real recomputation at every step, not an animation between two states.',
   'Change the lens with the toolbar above the map. Turn on Sector bubbles to see a submarket before you zoom into one parcel, then press Play to watch it move.'],
  ['deals','Find','Deals',
   'The scored set as a sortable table: price, rent, cap rate, cash-on-cash, DSCR, price per foot, gross rent multiplier, ZIP trend.',
   'Click a column heading to sort. Download CSV takes the whole result set away with you — the table itself stops at a few thousand rows so the page stays responsive.'],
  ['below','Find','Below market',
   'Records priced under what the evidence says the ZIP supports, separated into ones backed by a recorded sale or comps and ones resting only on an assessed basis.',
   'Trust the hard-backed ones. An assessed basis is a statement about how long somebody has owned a property, never a discount you can buy at.'],
  ['market','Find','Market',
   'The published monthly value and rent series for every ZIP in the footprint, with yields and the twelve-month change.',
   'Use it to sanity-check a single property against its ZIP before underwriting it.'],
  ['scout','Find','Scout',
   'A twelve-month model for each ZIP, the properties that would change category if those paths hold, and a log of what changed since the last scan.',
   'Look at the model fit (r²) before you lean on any forecast. A low fit means the series is too noisy to extrapolate, and the page says so.'],

  ['uw','Analyse','Underwrite',
   'The full sheet for one property: offer, rehab, financing, rent, the whole expense stack, NOI, debt service, cash flow, DSCR, cash-on-cash, break-even occupancy and a five-year projection.',
   'Change the offer and the rent first — those two move the answer more than everything else combined.'],
  ['comps','Analyse','Comps',
   'Nearby recorded sales of like kind, with the portfolio-deed detection that stops one bulk transfer from being read as a price on every unit in it.',
   'Check how many comps there are before you believe the median. Three sales is an anecdote.'],
  ['evidence','Analyse','Evidence',
   'A grade for how much published record actually backs each property, and which specific fields are missing.',
   'Anything below a C is a record too thin to underwrite honestly. That is information, not a defect.'],
  ['standard','Analyse','Standard',
   'Fifteen requirements in five categories that a property has to meet to qualify as a good investment on this platform, each answered meets / fails / unknown.',
   '"Unknown" is a real answer and is never counted as a pass. If the record does not say, the platform will not pretend it does.'],
  ['patterns','Analyse','Patterns',
   'Mined rules of the form "records like this tend to end up like that", each with a confidence interval and a held-out test — not a fit to the same data that produced it.',
   'Read the interval, not the headline rate. A rule with a wide interval is a rule with little behind it.'],
  ['predict','Analyse','Predictions',
   'Forecasts for the ZIP series with error bands taken from backtests of the same method, plus how much of the edition is covered by a published index at all. Below the forecast field, the Dataset Correlations panel shows a pairwise coefficient matrix across the platform’s own numeric fields — value trend, rent trend, cap rate, permits, hazard exposure and more — every cell labelled with its sample size and greyed out below a minimum-pair floor rather than shown on too few ZIPs to mean anything.',
   'Check coverage first. A forecast for a ZIP with no series is not a cautious forecast, it is no forecast. Read a correlation cell’s n before its colour — the panel states co-movement, never a cause.'],

  ['corridors','Markets','Growth corridors',
   'Announced corporate and institutional projects near the footprint, with jobs, capital and status — and cancelled projects carried at zero weight rather than quietly dropped.',
   'A cancelled project stays visible on purpose. Knowing that a corridor thesis died is worth as much as knowing one exists.'],
  ['corridorfield','Markets','Corridor field',
   'The corridors as a field over time: where the money went, when, and how the surrounding inventory moved with it.',
   'Scrub the timeline. A corridor that only looks good at one month is not a corridor.'],
  ['network','Markets','Relational map',
   'A force-directed graph of how records, ZIPs, corridors, employers and campuses connect to each other.',
   'The legend draws its swatches from the same colours the renderer uses, so what you see named is what you see drawn.'],
  ['reo','Markets','Bank-owned',
   'Published government-held and bank-owned inventory, carried with no owner names and no personal columns of any kind.',
   'This is a published list, not a foreclosure feed. Pre-foreclosure is not open data anywhere, and this platform will not invent it.'],
  ['research','Markets','Research',
   'The research workspace: what has been gathered on a place, what is still assumption, and where each figure came from.',
   'Every claim here carries its source. If a line has no source, treat it as a question, not a finding.'],
  ['packages','Markets','Packages',
   'How this edition is built and how much room is left: the record count, the compressed size and the ceiling each package has to fit inside. Below the registry, the Tiers section maps what already ships — one package, several packages side by side, or the full registry — onto who would use each: an individual investor, a team or brokerage, or an institutional researcher. It is a positioning read of existing features, not a paywall — nothing here is gated.',
   'Read this before asking for another city. It tells you what a new package can hold. The tier descriptions tell you which existing tabs matter most for your own use case.'],

  ['recon','Property','3D & records',
   'One property reconstructed from its public record — massing, room program, elevation — with links out to the county portals the record came from.',
   'Room sizes are derived from the recorded area and are labelled as derived. They are a plan, not a measurement.'],
  ['twin','Property','Twin',
   'The property in context: the block around it, the ground under it, and the regulatory fabric it sits in.',
   'Turn on the satellite ground when you need to see what is actually next door.'],
  ['hacks','Property','House hacks',
   'Two-to-four-unit records under the FHA limit ranked by what living in one would cost you per month against renting in the same ZIP.',
   'Self-sufficiency is the test that kills most three-and-four-unit FHA deals. The column says which ones pass it.'],
  ['program','Property','Program',
   'What could be added: units, an ADU, a conversion — each with the capital it takes, the rent it adds and the value it creates.',
   'Nothing here is entitled or approved. It is what the lot and the code appear to allow, which is where a feasibility study starts, not ends.'],

  ['academy','Learn','Academy',
   'The Locator.X curriculum — twelve tracks, forty lessons — the doctrine this platform underwrites by, taught against live records from this edition rather than invented examples. The twelfth track, Graduate & Professional Certificate, works at greater depth from the platform’s own modules — the forecast method, the correlations panel, the Standard’s testable framework — and issues a self-generated certificate on completion that is explicitly non-accredited: a record of coursework, not a credential from any institution.',
   'Start at the first module. Each one ends on a real property you can open. The graduate track assumes you have already been through tracks 1–11.'],
  ['guide','Learn','Investor guide',
   'The written guide: how to read every number this platform produces, and what each one does not mean.',
   'The sections on "a value is not a price" and "a zoning is not a use" are the two most expensive mistakes to make.'],

  ['compliance','System','Governance',
   'What this platform will and will not hold, stated publicly: no owner names, no mailing addresses, no contact details, no demographic data of any kind.',
   'Read this before deploying the platform anywhere it will be relied on. The commitments are binding on every edition.'],
  ['sources','System','Data sources',
   'Every source behind this edition, what it covers, when it was pulled, and its licence.',
   'Follow a source link when a number surprises you. That is faster than arguing with the number.'],
  ['data','System','Your data',
   'Import your own listings, override a price or a rent on any record, and export what you have built. It stays in this browser.',
   'Nothing you import or override leaves your machine. Clearing it here clears it for good.'],
  ['platforms','System','Mapping review',
   'How the mapping and rendering layers are put together, and what each one is allowed to do.',
   'Useful when you are deciding whether the platform can run inside your own environment.']
];

/* ------------------------------------------------------------ the help corpus */
/* Written as answers to questions people actually type. `k` is extra search
   vocabulary — synonyms and the words somebody uses before they know ours. */
var QA = [
  {q:'What is Locator.X?',
   k:'what is this platform about purpose overview locator x agi corp',
   a:'A real-estate investment platform that scores, underwrites, maps and forecasts property from public records. It takes recorded data — assessor rolls, recorded sales, published ZIP index series, announced corporate projects, published government-held inventory — and turns it into a number you can act on, while showing you exactly which record every figure came from. It is not a listing service and it does not carry live market listings.',
   v:'compliance'},

  {q:'Where does the data come from?',
   k:'sources data provenance where do the numbers come from public records assessor',
   a:'County assessor and recorder files, published monthly ZIP value and rent series, published corporate project announcements, published institutional enrollment figures, and published government-held property inventory. The Data sources view lists every one with its coverage, pull date and licence. Nothing is scraped from commercial listing sites — their terms prohibit automated access, so the platform does not do it.',
   v:'sources'},

  {q:'What does the score mean?',
   k:'score 0-100 rating locator x score how is it calculated ranking',
   a:'Eleven weighted modalities — cash flow, cap rate, debt coverage, gross yield, value-add potential, market momentum, regulatory and price risk, the twelve-month ZIP forecast, price-basis quality, market depth and distress signals. Each carries a base weight multiplied by an evidence factor: how much real published data backs that modality for this specific record. A modality with almost no evidence keeps a 15% floor rather than dropping out, and the weights are renormalised to 100. A high score on a thin record is therefore still a thin record — check the Evidence grade alongside it.',
   v:'dash'},

  {q:'Why do two properties with the same price score differently?',
   k:'score differs same price why different ranking compare',
   a:'Because price is one input among eleven, and because the evidence behind each record differs. A property with a recent recorded sale, a published building area and a covered ZIP index carries full weight on the modalities that use them; one with an estimated basis and no area carries the 15% floor on those. Open both in Underwrite and compare the expense stacks — that usually shows it in one line.',
   v:'uw'},

  {q:'Is the price a real price?',
   k:'price accurate real asking price value assessed basis estimate',
   a:'It is the last recorded sale price where one exists, and the date is shown beside it. Where no sale is recorded the figure is a modelled estimate and is labelled as one. It is never an asking price — this platform holds no listings. A value is not a price, an assessed basis is not a discount, and the platform will not present either as if it were.',
   v:'below'},

  {q:'What is a below-market property here?',
   k:'below market discount cheap undervalued bargain deal',
   a:'A record priced under what the evidence says its ZIP supports. The view separates two kinds: hard-backed, where a recorded sale or price-per-foot comps support the gap, and assessed-basis-only, where the gap comes from how long somebody has owned the property. The second kind is a statement about tenure, not a discount you can buy at, and the platform says so on every row.',
   v:'below'},

  {q:'How is rent estimated?',
   k:'rent estimate rental income how much rent gross rent method',
   a:'Two methods, switchable in the assumptions: a bedroom-based estimate, and a ZIP-yield estimate derived from the published rent series. Which one produced a given figure is shown on the record. Neither is a lease. If you have an actual rent, override it on that record in Your data and every number downstream will follow it.',
   v:'data'},

  {q:'What expenses are in the cash flow?',
   k:'expenses opex operating costs insurance taxes maintenance capex management hoa utilities noi',
   a:'Property tax at the county rate, insurance with a floor of $1,200 a year, maintenance and capital reserve as a share of rent, management as a share of effective gross income unless you self-manage, HOA where the record is a condo or townhouse, and owner-paid common utilities on multi-unit buildings. The same function computes them for the ranking engine and for the underwriting sheet, so the two can never disagree.',
   v:'uw'},

  {q:'Why is there a utility charge on a building I would not pay utilities for?',
   k:'utilities owner paid utility charge multi unit wrong too high',
   a:'Owner-paid common utilities are a default estimate on multi-unit records — light, water and rubbish in common areas are the landlord’s on most plexes. The default is $90 per door per month, capped so it never exceeds 12% of gross rent. Type your own figure in the underwriting sheet and yours is used instead, uncapped.',
   v:'uw'},

  {q:'What is DSCR and what number should I want?',
   k:'dscr debt coverage ratio lender loan qualify 1.2',
   a:'Net operating income divided by annual debt service. Below 1.0 the property does not cover its own loan. Most lenders on small income property want 1.20 or better. The Standard view checks it as one of its fifteen requirements and tells you what rent growth it would take to get there.',
   v:'standard'},

  {q:'What is break-even occupancy?',
   k:'break even occupancy vacancy how empty can it be',
   a:'The share of the year the property has to be rented before it stops losing money — operating expenses plus debt service, over gross rent. Above about 85% is tight: it means a single long vacancy puts the year underwater.',
   v:'uw'},

  {q:'Can I trust the forecasts?',
   k:'forecast prediction accuracy reliable trust model r2 backtest',
   a:'Only as far as the page says you can. Every forecast carries an error band taken from backtesting the same method on held-out months, and a model fit (r²) for that specific ZIP. Multi-year extrapolation is capped at ±10% a year, and where the cap binds the page says so and separates the fitted trend from the capped edge. A ZIP with no published series gets no forecast at all rather than a confident-looking flat line.',
   v:'predict'},

  {q:'Why does a ZIP have no data?',
   k:'no data missing zip blank empty coverage no series unknown',
   a:'Because no monthly index is published for it. Coverage is shown on the Predictions view as a percentage of the edition. An absence is not a zero, and the platform will not fill a gap with a plausible-looking number.',
   v:'predict'},

  {q:'What is the Dataset Correlations panel?',
   k:'correlation correlations panel dataset relationship coefficient matrix predict',
   a:'A pairwise Pearson-r matrix across the platform’s own numeric fields — value trend, rent trend, cap rate, cash flow, permits, hazard exposure, category mix — computed live from whatever edition is loaded, on the Predictions tab. A cell only shows a coefficient when enough ZIPs carry both fields; below that floor it reads "insufficient data" instead of a number that would look precise on three points. It is co-movement in the published record, not a claim about cause — the panel says so, and the strongest reads are usually the edition-specific ones, not the obvious value-versus-rent pair.',
   v:'predict'},

  {q:'Can I watch the map change over time?',
   k:'sector bubbles play growth animation time slider watch move history playback',
   a:'Yes — the Sector bubbles toggle in the Map view toolbar draws every ZIP as a bubble split by housing mix, and the Play button beside it steps through every published month, recomputing the whole field for real at each step rather than tweening between two snapshots. Drag the scrub bar to any month directly, or use the speed selector to slow it down.',
   v:'mapview'},

  {q:'What does "unknown" mean on a Standard requirement?',
   k:'unknown standard requirement not published fails meets three states',
   a:'That the published record does not answer the question. It is a first-class answer, never counted as a pass and never counted as a failure, and each one explains what is missing. A platform that turned unknowns into passes would be more comfortable and less useful.',
   v:'standard'},

  {q:'How do I underwrite a specific property?',
   k:'underwrite analyse property sheet how to analyze offer rehab financing',
   a:'Open it from anywhere — click it on the map, in Deals, or in the Dashboard grid — and the Underwrite tab loads its sheet. Set your offer, rehab budget and financing at the top; everything below recalculates. The five-year projection and the refinance block sit at the bottom.',
   v:'uw'},

  {q:'How do I change my assumptions?',
   k:'assumptions settings down payment interest rate vacancy management change defaults',
   a:'The assumption row on the Dashboard sets down payment, interest rate, vacancy, management and the rent method for the whole platform at once. Every score, map colour, table and forecast downstream reflects them immediately.',
   v:'dash'},

  {q:'How do I export what I have found?',
   k:'export download csv save spreadsheet take away data out',
   a:'Download CSV on the Deals view takes the entire filtered result set, not just the rows on screen. The Underwrite sheet exports a single property. Your data exports anything you have imported or overridden.',
   v:'deals'},

  {q:'Can I add my own listings or correct a price?',
   k:'import my own listings add data override price rent correct fix wrong',
   a:'Yes. Your data imports CSV listings and lets you override the price or the rent on any record. Both stay in this browser and are used by every calculation from that moment on. Nothing you enter is transmitted anywhere.',
   v:'data'},

  {q:'Does this show foreclosures?',
   k:'foreclosure pre-foreclosure distressed auction bank sale reo lis pendens',
   a:'It shows published government-held and bank-owned inventory, which is real published data. It does not show pre-foreclosure, because pre-foreclosure is not published as open data anywhere the platform can lawfully reach — the open-data portals return nothing for it, and the commercial sites that carry it prohibit automated access. The platform would rather say that than sell you a list it made up.',
   v:'reo'},

  {q:'Who owns these properties?',
   k:'owner name owner names landlord who owns top owners portfolio',
   a:'The platform does not carry owner names, taxpayer names, mailing addresses or contact details in any edition, and the Governance page states that publicly. What it can do is detect portfolio deeds — one recorded transfer covering several parcels — which shows you concentrated ownership as a pattern without naming a person.',
   v:'compliance'},

  {q:'Why is there no crime, school or demographic data?',
   k:'crime schools demographics income race neighborhood quality safety',
   a:'A deliberate fair-housing decision. Race, ethnicity, national origin, income, household composition, school ratings and crime are not carried in any edition and will not be added. The platform ranks property on what the property does, not on who lives near it.',
   v:'compliance'},

  {q:'What is a growth corridor?',
   k:'corridor growth corporate project jobs investment new development announced',
   a:'A place where announced corporate or institutional capital is large enough to change the housing demand around it. Each project carries its capital, its jobs figure, its status and its source. Cancelled projects stay visible and carry zero weight — the fact that a thesis died is worth knowing.',
   v:'corridors'},

  {q:'What is the campus layer for?',
   k:'campus university college student housing enrollment school near',
   a:'Student housing. Each campus carries its published enrolment, the term that figure refers to and its source, and the inventory within walking, biking and driving bands is counted. Proximity to a campus is a demand hypothesis to be tested against documented rent — it is not itself a rent premium.',
   v:'corridors'},

  {q:'Why does the room program say "derived"?',
   k:'rooms room sizes derived square feet layout floor plan bedrooms',
   a:'Because it is. The county publishes a building area, a bedroom count and a bathroom count; the individual room sizes are apportioned from those using planning allowances, and their total can never exceed the recorded area. It is a plan of what would fit, not a measurement of what is there.',
   v:'recon'},

  {q:'Does this work on a phone?',
   k:'mobile phone tablet ipad responsive small screen touch',
   a:'Yes. Below about 860 pixels the two navigation rows collapse into a single sheet listing every view under its section heading, which is faster with a thumb than two rows of horizontal scrolling and reads in the same order to a screen reader. The tables scroll inside their own containers rather than pushing the page sideways.',
   v:'dash'},

  {q:'Does it work offline?',
   k:'offline internet connection network no wifi download self contained',
   a:'The whole edition is one self-contained page: the records, the index series, the models and the code all travel inside it. Once it has loaded, everything except the map tiles and the outbound record links works with the network off.',
   v:'packages'},

  {q:'Why is there more than one edition?',
   k:'editions versions why several packages different apps split size limit',
   a:'A single page has a hard size ceiling, so the inventory is split into editions by geography and by filter — a metro atlas, a below-market cut, an income cut, a corridor cut. The Packages view shows what each one holds and how much room is left in it.',
   v:'packages'},

  {q:'Which edition should I use?',
   k:'tiers which edition use for me team individual institutional researcher recommend',
   a:'The Tiers section on the Packages view maps existing features onto three uses: an individual working one metro or one strategy at a time, a team or brokerage comparing several packages and training new people through the Academy, and an institutional or research use pulling the full registry for portfolio-scale screening. It is a guide to what already ships, not a paywall — every edition carries the same underwriting engine.',
   v:'packages'},

  {q:'Is there a certificate program?',
   k:'certificate graduate professional accredited degree credential academy track 12',
   a:'The Academy’s twelfth track, Graduate & Professional Certificate, works at greater depth from the platform’s own live modules and issues a certificate on completion. It is explicitly non-accredited — Locator.X grants no degree and holds no accreditation from any body — and the certificate itself says so. Treat it as a record of coursework completed here, not a credential a licensing board or employer will recognise by default.',
   v:'academy'},

  {q:'Something looks wrong. What should I do?',
   k:'wrong error bug incorrect mistake wrong number report problem broken',
   a:'Open the record and follow its source link — every figure traces to a published record, and the fastest way to settle a disagreement is to read the record. If the source says something different from the platform, that is a defect worth reporting. If the platform says "unknown" or "not published", that is the platform being accurate about a gap, not a defect.',
   v:'sources'},

  {q:'Is any of this financial advice?',
   k:'advice financial advisor legal recommendation should i buy invest',
   a:'No. It is analysis of published records under assumptions you control. It does not know your finances, your tax position or your risk tolerance, and no line in it is a recommendation to buy or not buy. Verify anything you act on against the primary record and take professional advice.',
   v:'compliance'}
];

/* ------------------------------------------------------------------ searching */
/* Small, deterministic and entirely local: tokenise, then score each entry by
   how many query terms it matches in its question, its keywords and its body,
   weighted in that order. Nothing here calls out anywhere. */
var STOP = {the:1,a:1,an:1,is:1,are:1,do:1,does:1,of:1,to:1,in:1,on:1,for:1,and:1,or:1,
  it:1,this:1,that:1,what:1,how:1,why:1,i:1,my:1,me:1,you:1,can:1,should:1,'':1};

function terms(s){
  return String(s||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').split(/\s+/)
    .filter(function(t){ return t && !STOP[t] && t.length>1; });
}

function search(q){
  var ts = terms(q);
  if(!ts.length) return [];
  var out = [];
  QA.forEach(function(e){
    var hq = (e.q||'').toLowerCase(), hk = (e.k||'').toLowerCase(), ha = (e.a||'').toLowerCase();
    var s = 0, hit = 0;
    ts.forEach(function(t){
      var got = false;
      if(hq.indexOf(t) >= 0){ s += 6; got = true; }
      if(hk.indexOf(t) >= 0){ s += 4; got = true; }
      if(ha.indexOf(t) >= 0){ s += 1; got = true; }
      if(got) hit++;
    });
    /* every term has to land somewhere, or a one-word coincidence outranks a
       real match */
    if(hit === ts.length || (ts.length > 2 && hit >= ts.length - 1)) out.push({e:e, s:s, hit:hit});
  });
  VIEWS.forEach(function(v){
    var hay = (v[2]+' '+v[3]+' '+v[4]).toLowerCase();
    var s = 0, hit = 0;
    ts.forEach(function(t){ if(hay.indexOf(t) >= 0){ s += 3; hit++; } });
    if(hit === ts.length) out.push({view:v, s:s, hit:hit});
  });
  out.sort(function(a,b){ return (b.hit-a.hit) || (b.s-a.s); });
  return out.slice(0, 8);
}

/* ---------------------------------------------------------------------- tour */
var tourAt = -1;

function tourStep(i){
  if(i < 0 || i >= VIEWS.length) return;
  tourAt = i;
  var v = VIEWS[i];
  var box = $('#hometour');
  if(box){
    box.innerHTML =
      '<div class="homestepno">Step ' + (i+1) + ' of ' + VIEWS.length + ' &middot; ' + esc(v[1]) + '</div>'
      + '<h3>' + esc(v[2]) + '</h3>'
      + '<p>' + esc(v[3]) + '</p>'
      + '<p class="homefirst"><b>Do this first.</b> ' + esc(v[4]) + '</p>'
      + '<div class="homenav">'
      +   '<button class="btn" id="tourprev"' + (i===0?' disabled':'') + '>&larr; Back</button>'
      +   '<button class="btn primary" id="touropen">Open ' + esc(v[2]) + '</button>'
      +   '<button class="btn" id="tournext"' + (i===VIEWS.length-1?' disabled':'') + '>Next &rarr;</button>'
      +   '<button class="btn" id="tourend">End tour</button>'
      +   (window.LXVoice ? LXVoice.speakButton('tour-' + i) : '')
      + '</div>';
    var p = $('#tourprev'); if(p) p.onclick = function(){ tourStep(i-1); };
    var n = $('#tournext'); if(n) n.onclick = function(){ tourStep(i+1); };
    var o = $('#touropen'); if(o) o.onclick = function(){ try{ L().showView(v[0]); }catch(e){} };
    var x = $('#tourend');  if(x) x.onclick = function(){ tourAt = -1; render(); };
    if(window.LXVoice) LXVoice.wireSpeakButtons(box, function(id){
      var idx = +id.slice(5); var vv = VIEWS[idx];
      return vv ? (vv[2] + '. ' + vv[3] + '. Do this first: ' + vv[4]) : '';
    });
  }
  var bar = $('#homebar');
  if(bar) bar.style.width = Math.round((i+1)/VIEWS.length*100) + '%';
}

/* -------------------------------------------------------------------- render */
function groupCounts(){
  var g = {}, order = [];
  VIEWS.forEach(function(v){ if(!g[v[1]]){ g[v[1]] = []; order.push(v[1]); } g[v[1]].push(v); });
  return {g:g, order:order};
}

function factLine(){
  var X = L(); if(!X) return '';
  var n = 0, zips = 0, cities = 0;
  try{ n = X.allListings().length; }catch(e){}
  try{ zips = Object.keys(X.M.zips||{}).length; }catch(e){}
  try{
    var seen = {}; var all = X.allListings();
    for(var i=0;i<all.length;i+=Math.max(1, Math.floor(all.length/4000))){
      if(all[i] && all[i].city) seen[all[i].city] = 1;
    }
    cities = Object.keys(seen).length;
  }catch(e){}
  var fmt = function(v){ try{ return L().fmtN(v); }catch(e){ return String(v); } };
  return '<div class="hometiles">'
    + '<div class="tile"><div class="v">' + fmt(n) + '</div><div class="l">records in this edition</div>'
      + '<div class="d">every one from a published record, none from a listing site</div></div>'
    + '<div class="tile"><div class="v">' + fmt(zips) + '</div><div class="l">ZIPs with a published index series</div>'
      + '<div class="d">a ZIP without one gets no forecast rather than a guess</div></div>'
    + '<div class="tile"><div class="v">' + fmt(cities) + (cities>=200?'+':'') + '</div><div class="l">cities represented</div>'
      + '<div class="d">sampled across the set</div></div>'
    + '<div class="tile"><div class="v">28</div><div class="l">views in six sections</div>'
      + '<div class="d">the tour below walks them in the order you would use them</div></div>'
    + '</div>';
}

function render(){
  var root = $('#homeroot'); if(!root) return;
  var gc = groupCounts();

  root.innerHTML =
    '<div class="homehero">'
    +  '<h2>Locator.X</h2>'
    +  '<p class="homelede">A real-estate investment platform built on published records. It scores, underwrites, maps and forecasts property — and it shows you the record behind every figure, so you can disagree with it on the evidence rather than on faith.</p>'
    + '</div>'

    + factLine()

    + '<div class="homerules" data-panel data-panel-title="What this platform will not do">'
    +  '<h3>What it will not do</h3>'
    +  '<ul>'
    +   '<li><b>It will not invent a record.</b> Every price, area, unit count and date comes from a published source, or the field says it is unknown. An absence is never filled with a zero.</li>'
    +   '<li><b>It will not confuse a value with a price.</b> An assessed basis tells you how long somebody has owned a property. It is not a discount, and no page here presents it as one.</li>'
    +   '<li><b>It will not guess a use or a zoning.</b> A code is only interpreted against a published manual, cited by URL, or a self-documenting description. Otherwise it declines.</li>'
    +   '<li><b>It will not carry personal data.</b> No owner names, no taxpayer names, no mailing addresses, no contact details, in any edition.</li>'
    +   '<li><b>It will not carry demographic data.</b> No race, ethnicity, national origin, income, household composition, school ratings or crime. A fair-housing decision, and a permanent one.</li>'
    +   '<li><b>It will not scrape commercial listing sites.</b> Their terms prohibit automated access, so the platform does not do it — which is also why it holds no live asking prices.</li>'
    +  '</ul>'
    + '</div>'

    + '<div class="homeask" data-panel data-panel-title="Ask a question">'
    +  '<h3>Ask a question</h3>'
    +  '<p class="homesub">Type it the way you would say it. This searches the help written into this page — it works with the network off, and when it has nothing good it says so.</p>'
    +  '<div class="homeqrow" style="display:flex;gap:6px;align-items:center">'
    +   '<input type="search" id="homeq" placeholder="e.g. what does the score mean, why is there no crime data, how is rent estimated" autocomplete="off" style="flex:1">'
    +   (window.LXVoice && window.LXVoice.canListen
          ? '<button type="button" class="btn" id="homemic" title="Ask by voice (speech-to-text, runs in your browser)">&#127908;</button>'
          : '')
    +  '</div>'
    +  '<div id="homeans"></div>'
    +  '<div class="homechips">' + QA.slice(0,6).map(function(e,i){
          return '<button class="chip" data-qa="' + i + '">' + esc(e.q) + '</button>'; }).join('') + '</div>'
    + '</div>'

    + '<div class="hometourbox" data-panel data-panel-title="Guided tour">'
    +  '<h3>Guided tour</h3>'
    +  '<p class="homesub">Twenty-eight views, in the order you would actually use them. Each step opens the real view.</p>'
    +  '<div class="homeprog"><span id="homebar"></span></div>'
    +  '<div id="hometour">'
    +    '<p>Start at the Dashboard and work forward, or jump to any section below.</p>'
    +    '<div class="homenav"><button class="btn primary" id="tourstart">Start the tour</button></div>'
    +  '</div>'
    + '</div>'

    + '<div class="homemap" data-panel data-panel-title="Every view">'
    +  '<h3>Every view</h3>'
    +  gc.order.map(function(name){
         return '<div class="homegrp"><h4>' + esc(name) + '</h4><div class="homecards">'
           + gc.g[name].map(function(v){
               return '<button class="homecard" data-go="' + esc(v[0]) + '">'
                 + '<b>' + esc(v[2]) + '</b><span>' + esc(v[3]) + '</span></button>'; }).join('')
           + '</div></div>';
       }).join('')
    + '</div>';

  /* wiring */
  var s = $('#tourstart'); if(s) s.onclick = function(){ tourStep(0); };
  if(tourAt >= 0) tourStep(tourAt);

  $$('#homeroot .homecard').forEach(function(b){
    b.onclick = function(){ try{ L().showView(b.dataset.go); }catch(e){} };
  });
  $$('#homeroot .chip').forEach(function(b){
    b.onclick = function(){ var e = QA[+b.dataset.qa]; var box = $('#homeq');
      if(box){ box.value = e.q; } answer(e.q); };
  });
  var q = $('#homeq');
  if(q) q.addEventListener('input', function(){ answer(q.value); });
  var mic = $('#homemic');
  if(mic && window.LXVoice) mic.onclick = function(){
    if(LXVoice.isListening()) return;
    mic.textContent = '\u{1F3A4}…';
    LXVoice.listen(function(transcript){
      if(q){ q.value = transcript; answer(transcript); }
    }, function(){ mic.textContent = '\u{1F3A4}'; });
  };
}

function answer(qs){
  var box = $('#homeans'); if(!box) return;
  var qq = String(qs||'').trim();
  if(qq.length < 2){ box.innerHTML = ''; return; }
  var hits = search(qq);
  if(!hits.length){
    box.innerHTML = '<div class="homenone">Nothing in the help matches that. '
      + 'Two places usually have it: <b>Data sources</b> says where a figure came from, and '
      + '<b>Governance</b> says what the platform will and will not hold. '
      + '<button class="btn" data-go2="sources">Data sources</button> '
      + '<button class="btn" data-go2="compliance">Governance</button></div>';
  } else {
    box.innerHTML = hits.map(function(h){
      if(h.view){
        return '<div class="homehit"><div class="hq">' + esc(h.view[2]) + ' &middot; ' + esc(h.view[1]) + '</div>'
          + '<p>' + esc(h.view[3]) + '</p>'
          + '<button class="btn" data-go2="' + esc(h.view[0]) + '">Open ' + esc(h.view[2]) + '</button></div>';
      }
      var e = h.e;
      var v = VIEWS.filter(function(x){ return x[0] === e.v; })[0];
      var sid = 'qa-' + QA.indexOf(e);
      return '<div class="homehit"><div class="hq">' + esc(e.q) + '</div><p>' + esc(e.a) + '</p>'
        + (v ? '<button class="btn" data-go2="' + esc(e.v) + '">Open ' + esc(v[2]) + '</button> ' : '')
        + (window.LXVoice ? LXVoice.speakButton(sid) : '')
        + '</div>';
    }).join('');
  }
  $$('#homeans [data-go2]').forEach(function(b){
    b.onclick = function(){ try{ L().showView(b.dataset.go2); }catch(e){} };
  });
  if(window.LXVoice) LXVoice.wireSpeakButtons(box, function(id){
    if(id.indexOf('qa-') === 0){ var e = QA[+id.slice(3)]; return e ? (e.q + '. ' + e.a) : ''; }
    return '';
  });
}

window.LXHome = {render:render, search:search, VIEWS:VIEWS, QA:QA};

/* Home is the view the app opens on, and showView() is not called for the
   section that is already active in the markup, so it paints itself once the
   rest of the app has finished booting. */
function boot(){
  var sec = document.getElementById('home');
  if(sec && sec.classList.contains('active')) { try{ render(); }catch(e){} }
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 0); });
else setTimeout(boot, 0);
})();
