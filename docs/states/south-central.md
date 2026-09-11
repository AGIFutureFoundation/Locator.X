# South Central — AL · AR · KY · LA · MS · OK · TN · TX

State-by-state localization of the [Locator.X process](README.md). Regional threads: mostly
nonjudicial, fast foreclosure clocks (Texas's first-Tuesday sale, Tennessee trust deeds)
against judicial Kentucky/Oklahoma and Louisiana's civil-law system, which is its own legal
world; redeemable-deed tax sales in TX/TN/GA-style form; no state transfer tax in TX/LA/MS/MO;
and the actDataScout / DEVNET / county-CAD portal patterns. Louisiana gets extra depth — it is
one of the platform's three anchor markets. Verify everything against the current source; see
the [disclaimer](README.md).

---

## Alabama

**Run the record here.** County revenue commissioners publish assessment/parcel search
(Delta Computer Systems and Flagship GIS host many); probate judges record instruments, with
online indexes in the urban counties (Jefferson, Madison, Mobile).

**Process notes.** Nonjudicial foreclosure under mortgages with power of sale — fast.
Delinquent taxes historically sold as certificates/liens with a **three-year redemption**
(plus possessory quirks unique to Alabama); counties have been converting to online lien
auctions — verify each county's current mode. Caveat-emptor state for used residential
property, one of the strictest — the record pull *is* the disclosure. Deed tax modest.

**Programs & money.** AHFA (Step Up buyer program, LIHTC + state workforce housing credit);
historic credit; municipal industrial development boards abate property tax through
bond-lease structures.

**Locator.X angle.** Caveat emptor pushes the whole O/A burden onto your own record work —
budget diligence accordingly. Huntsville's defense-driven growth is the state's clearest M1
(jobs-to-rents) case.

## Arkansas

**Run the record here.** actDataScout (Apprentice/DataScout) covers most counties' assessor
and often circuit-clerk records — one subscription, most of the state; the AR GIS Office
publishes statewide parcels. Circuit clerks record deeds.

**Process notes.** Both foreclosure tracks exist; **nonjudicial** under the Statutory
Foreclosure Act is common. Tax-delinquent land forfeits to the **State Land Commissioner**,
which runs public auctions and an online post-auction store — a centralized statewide deed
channel. Transfer tax present. Title companies close.

**Programs & money.** ADFA (ADFA Move-Up, down-payment assistance, LIHTC); historic credit;
Opportunity Zone overlaps in the Delta.

**Locator.X angle.** The Land Commissioner's list is a ready-made statewide distress feed
with published minimums — screen it against the buy box wholesale. Northwest Arkansas
(Benton/Washington counties) runs a different market clock from the Delta; split the state
into two buy boxes.

## Kentucky

**Run the record here.** PVAs (property valuation administrators) publish per-county sites,
most behind modest subscriptions (Jefferson/Fayette are solid); county clerks record deeds.
The state publishes a parcel viewer of mixed vintage.

**Process notes.** Judicial foreclosure through master commissioner sales. Delinquent tax
bills become **certificates of delinquency** sold to third-party purchasers at county clerk
sales (priority-registration process) — a lien channel with statutory interest. Transfer tax
on deeds. Attorney involvement customary.

**Programs & money.** KHC (Kentucky Housing Corporation: buyer loans, DPA, LIHTC); historic
credit; Louisville's landbank and Lexington's affordable fund are the metro program layers.

**Locator.X angle.** Master-commissioner sale calendars are published per county — a
predictable judicial pipeline. PVA data quality varies; grade coverage per county before
trusting a median.

## Louisiana

*(Anchor market — the platform ships NOLA and Baton Rouge editions; see
[`../LOCATOR_X_PLATFORM_GUIDE.md`](../LOCATOR_X_PLATFORM_GUIDE.md) and the Louisiana
developer deck in `pages/`.)*

**The friction, ranked:** [`../LOUISIANA_DEVELOPMENT_FRICTION.md`](../LOUISIANA_DEVELOPMENT_FRICTION.md)
synthesises what in this record actually slows a development — non-disclosure first — and
names the probe for each.

**Run the record here.** Parishes, not counties. Assessors are elected per parish — Orleans
publishes through the Orleans Parish Assessor and NOLA.gov open data (permits, code
enforcement, short-term-rental licenses); East Baton Rouge through EBRGIS. Clerks of court
record conveyances; Orleans' Land Records Division is online. The Louisiana Tax Commission
aggregates rolls. **The Comps desk cannot function in Orleans or EBR** — sale prices are not
reliably disclosed (non-disclosure practice), which is exactly why the platform says so
instead of guessing.

**Process notes.** Civil law: **mortgages via authentic act**, foreclosure by **executory
process** — judicial but expedited (confession of judgment in the act); no statutory
post-sale redemption on mortgage foreclosure. Tax sales historically conveyed **tax sale
title** (certificate-like) with a three-year constitutional redemption; a 2023 constitutional
amendment moves the system toward **lien auctions** with implementation phasing in — verify
each parish's current mechanics before bidding. Community-property state; usufruct and
forced-heirship history complicate title chains. No state transfer tax (Orleans levies a
documentary transaction tax). Homestead exemption ($7,500 assessed) plus parish millage
variance moves the tax line block by block.

**Programs & money.** Louisiana Housing Corporation (buyer programs, LIHTC, HOME);
**Restoration Tax Abatement** (RTA — 5+5-year property-tax freeze on rehab in districts,
the New Orleans conversion deal-maker); state historic credit stacking with federal on the
CBD/Warehouse District office-to-residential wave; Opportunity Zones across Orleans/EBR;
insurance is the crisis line — Citizens depopulation rounds and Fortify Homes grants belong
in any coastal pro forma.

**Locator.X angle.** The evidence doctrine was hardened here: non-disclosure caps the
valuation gate, so the platform leans on income, permits, and roll data instead of comps.
The A7 campus-ring lens (`launi` edition) and the RTA/historic stack are the state's core
theses. Insurance-adjusted DSCR is the survival number; quote it, never trail it.

## Mississippi

**Run the record here.** County tax assessors publish through Delta Computer Systems or
county GIS in the larger counties; chancery clerks record land instruments. MARIS hosts
statewide parcels.

**Process notes.** Nonjudicial trust-deed foreclosure. Annual county **tax lien sales**
(online in many counties) with **two-year redemption**, then a tax deed matures — strict
notice requirements generate frequent title litigation; quiet title is near-standard after
maturity. No transfer tax. Title work leans on attorneys.

**Programs & money.** Mississippi Home Corporation (buyer programs, LIHTC); historic credit;
county industrial abatements. Insurance on the coast prices like Louisiana's.

**Locator.X angle.** Tax-lien maturities plus quiet-title cost is the real all-in basis on
distress entries — model the legal line explicitly. Thin comp counts keep the V3 sample
floor binding outside Jackson/Gulfport/DeSoto.

## Oklahoma

**Run the record here.** County assessors publish online (OKAssessor network covers many);
county clerks' land records are on OKCountyRecords for a large share of counties. The Tax
Commission publishes rolls; Oklahoma City and Tulsa counties have strong portals.

**Process notes.** Both tracks exist; borrowers can compel judicial, so **judicial
foreclosure is the practical default**. County treasurers hold **June resale (deed)
auctions** for multi-year delinquencies — genuine deed sales with published lists. Doc-stamp
transfer tax. Title attorneys and abstractors persist (abstract-of-title custom is a real
closing-cost line unique to OK/KS practice).

**Programs & money.** Oklahoma Housing Finance Agency (buyer DPA, LIHTC); tribal HUD-184
lending is a meaningful channel statewide (Oklahoma leads the country); TIF used in OKC/Tulsa
core redevelopment.

**Locator.X angle.** Abstract costs move small-deal closing economics — put them in the
model. June resale lists are a clean annual distress screen.

## Tennessee

**Run the record here.** The Comptroller's Real Estate Assessment Data (padctn-style portals)
covers most counties centrally — statewide assessment search for free; registers of deeds
online per county. Davidson (Nashville) and Shelby (Memphis) have deep local portals.

**Process notes.** Nonjudicial trust-deed foreclosure, fast. Delinquent-tax lawsuits produce
chancery **tax sales** treated as **redeemable deeds** — redemption up to a year, shortened
for vacancy/blight. No state income tax; transfer tax on deeds. Title companies close;
attorney involvement common.

**Programs & money.** THDA (Great Choice buyer loans, LIHTC); PILOTs through city/county
industrial development boards (Memphis uses them heavily for multifamily); state historic
credit absent — federal-only stacking.

**Locator.X angle.** The statewide assessment portal makes Tennessee one of the cheapest
states to screen at gate A. Memphis vs Nashville is a two-regime state: same statutes,
opposite market clocks — separate buy boxes.

## Texas

**Run the record here.** County Appraisal Districts (CADs) publish rich parcel/valuation data
with bulk downloads in the metros (HCAD, DCAD, TCAD, BCAD); county clerks record deeds
(often via TexasFile/CountyClerkRecords). **Non-disclosure state** — sale prices are not
public; comps come from MLS access or vendors, and the evidence grade must say so.

**Process notes.** Nonjudicial trust-deed foreclosure, **first Tuesday of the month**,
fastest large-state clock in the country. Property-tax lawsuits produce **redeemable tax
deeds**: 25% premium if redeemed in six months (two years homestead/ag) — a priced option,
not a discount. No transfer tax; no state income tax; property taxes are correspondingly
heavy and protest culture is an annual expense-management discipline. Title companies close
on promulgated rates.

**Programs & money.** TDHCA (My First Texas Home, LIHTC) and TSAHC (DPA statewide); Chapter
380/381 municipal/county incentive agreements; PFC/HFC property-tax exemption structures for
multifamily (heavily reformed 2023 — verify current law before underwriting the exemption).

**Locator.X angle.** Texas is the platform's clearest case for the coverage discipline:
valuations everywhere, prices nowhere — grade the gap instead of filling it with wishes.
Protest-adjusted tax lines and quoted insurance make the A gate honest; the first-Tuesday
cadence and 25%/6-month redemption premium are exact numbers — use them exactly.
