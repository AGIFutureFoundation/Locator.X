# Property data sources

*Last reviewed: 2026-09. Every entry: what it answers, and its failure mode. State-specific
portals live in the [state guides](../states/README.md); this file is the national layer.*

---

## Contents

1. [Listing portals (asking-price layer)](#1-listing-portals)
2. [Public-record and bulk data (the record itself)](#2-public-record-and-bulk-data)
3. [Distress and auction channels](#3-distress-and-auction-channels)
4. [Commercial listing and CRE data](#4-commercial-listing-and-cre-data)
5. [Data vendors and APIs](#5-data-vendors-and-apis)
6. [Demographic, economic and hazard layers](#6-demographic-economic-and-hazard-layers)
7. [The county portal vendor patterns](#7-the-county-portal-vendor-patterns)

---

## 1. Listing portals

The asking-price layer. **Answers:** what sellers hope; days-on-market; photo evidence of
condition. **Failure mode everywhere:** askings are not closings; inventory skews retail;
estimate models (Zestimate et al.) are opinions with unpublished error bands per submarket —
never a comp.

| Source | Distinct use | Watch out |
|--------|--------------|-----------|
| Zillow | Deepest consumer reach; rental listings; research data downloads (ZHVI/ZORI indices) | Index revisions; estimate ≠ value |
| Realtor.com | Closest to MLS truth (direct feeds) | Coverage follows MLS membership |
| Redfin | Fast MLS updates in covered metros; downloadable market data center | Metro coverage only |
| Trulia | Neighborhood/crime overlays | Same data as Zillow underneath |
| Homes.com / Movoto | Secondary checks | Thin in rural areas |
| Craigslist / Facebook Marketplace | FSBO and small-landlord rentals — the un-listed market | Scams; no history |
| Apartments.com / Zumper / Rent. | Rent asks for the C gate's income side | Concessions invisible in asks |
| LoopNet / Crexi | Commercial listings (see §4) | Retail-priced CRE; the good deals rarely list |

**Rents discipline:** rent asks feed gate C only at the *evidence grade of an ask*. Confirm
with leases, not listings — [A5, the rent roll you inherit](../../curriculum/courses/04-the-asset.md).

## 2. Public-record and bulk data

The record itself — where the L, O and A gates are actually answered.

- **County assessor / appraiser** — values, characteristics, exemptions. The state guides
  name each state's portal pattern. *Failure mode:* assessment ≠ market value (worst in
  base-year states: CA Prop 13, OR Measure 50, PA base years — see the state entries).
- **County recorder / register of deeds** — deeds, mortgages, liens, assignments. *Failure
  mode:* index-only online in many counties; images paywalled; legal descriptions, not
  addresses.
- **Statewide rolls where they exist** — FL DOR NAL files, NJ MOD-IV, MD SDAT, OH auditor
  bulk files, TX CAD exports, MT cadastral, MassGIS L3: free full-market screening. The
  state guides flag every one.
- **Clerk of court dockets** — foreclosure filings (judicial states), evictions, probate
  (pre-market inventory). *Failure mode:* PACER-style per-page costs in some states;
  name-keyed, not parcel-keyed.
- **Federal bankruptcy courts (PACER)** — Chapter 7/11/13 trustee and debtor-in-possession
  real property, sold under 11 U.S.C. §363 "free and clear" of liens once the court approves
  a sale motion. A filed motion or "Notice of Sale of Estate Property" is often the earliest
  public signal — weeks before the property reaches any listing portal. *Failure mode:*
  PACER is federal, not county, and there is no single national feed — each of the 90+
  district courts posts its own notices (search `<district> bankruptcy court notice of
  sale`), and PACER itself charges per page viewed. Large Chapter 11 cases route notices
  through a claims/noticing agent instead of the court's own site — Stretto, Kroll
  Restructuring Administration, Epiq, KCC, Donlin Recano, Omni Agent Solutions — the same
  "recognize the vendor" pattern as §7's county portals, one layer up the court system.
- **Census TIGER + state parcel programs** — geometry to hang everything on.
- **GIS open-data portals** (city/county ArcGIS hubs) — zoning, permits, code enforcement,
  STR licenses. Permits are the leading indicator the M1 course builds on.
- **HUD datasets** — FMRs and Small-Area FMRs (rent reasonableness), income limits, LIHTC
  database, multifamily insured portfolio, REAC scores.
- **FHFA / FEMA / EPA** — HPI indexes; flood maps (NFHL); environmental screens (ECHO,
  Superfund). Flood zone is an insurance line, not a footnote.

**Bulk-first rule:** wherever a state offers roll files (FL, OH, TX CADs, NJ, MD…), screen
wholesale before browsing retail — one download replaces ten thousand page views. This is
the platform's own build pattern ([`PULL_RECIPE.md`](../PULL_RECIPE.md)).

## 3. Distress and auction channels

Each channel's mechanics are state-set — always pair with the state entry.

| Channel | What it is | Where the list lives |
|---------|-----------|----------------------|
| Pre-foreclosure | NOD/lis pendens filings | Recorder (nonjudicial) or court docket (judicial) |
| Foreclosure auction | Trustee/sheriff sales | Trustee notices, sheriff sites, legal newspapers; aggregators: Auction.com, ServiceLink, Hubzu, Xome |
| REO | Lender-owned post-auction | Fannie HomePath, Freddie HomeSteps, HUD Home Store (FHA), VA REO (VRM), bank REO pages |
| Tax lien sales | Yield instrument, sometimes deed path | County treasurer/collector; platforms: RealAuction, GovEase, SRI, Bid4Assets, LienHub (FL) |
| Tax deed sales | Deed at auction (terminal in UT/CA/WA; redeemable in TX/GA/TN) | County treasurer/tax-claim; same platforms |
| Land banks | Side-door inventory with strings | Detroit LB, Cuyahoga, Genesee, Cook, St. Louis LRA — see MI/OH/IL/MO entries |
| State-centralized | AR Land Commissioner, NM T&R auctions, WV Auditor | The state entries flag each |
| Probate / estate | Pre-market, motivated fiduciaries | Probate dockets; obituary-to-parcel joins |
| HOA / municipal liens | NV super-priority hazard; code-lien foreclosures (FL) | County dockets |
| Bankruptcy estate sale | Trustee/debtor-in-possession real property sold under §363, court-approved and often below market to move fast | PACER filings; the case's own claims/noticing agent site (see §2); a small group of brokers specialize in court-ordered sales and carry direct trustee relationships |
| Receivership sale | State-court-appointed receiver liquidating a distressed commercial asset — a civil remedy, not bankruptcy, so it runs under state law (procedure varies by state) rather than federal §363 | The case docket naming the receiver; the receiver's own retained broker; a few national platforms specialize in receivership listings |
| Government seized / surplus | Federal forfeiture and excess real property | GSA (realestatesales.gov, gsaauctions.gov), US Marshals Service real estate (auctioned via Bid4Assets), IRS/Treasury seized-property sales (~300 public auctions/yr) |

**The evidence rule for auctions:** "sold" is not a fact until redemption/upset windows
close — NC's upset bids, MI/MN redemption, TX/GA redemption premiums. The state entry gives
the clock; gate R records it.

## 4. Commercial listing and CRE data

- **LoopNet / Crexi / Brevitas / TenX** — marketed CRE. *Failure mode:* adverse selection;
  broker books move first.
- **CoStar** — the incumbent database (owns LoopNet, TenX, Apartments.com). Comps, rents,
  vacancy. Paywall is steep; county-record triangulation covers much of it for small deals.
- **Broker research** (CBRE, JLL, Cushman & Wakefield, Colliers, Marcus & Millichap, NKF)
  — free quarterly market reports: cap-rate and vacancy context for gate O.
- **NCREIF / NAREIT / Trepp / Moody's CRE (REIS)** — institutional indices, CMBS
  performance; Trepp's delinquency prints lead private-market distress by quarters.
- **SEC EDGAR** — REIT 10-Ks disclose cap rates, NOI and asset-level detail: free
  institutional comps, the record layer's favorite trick.

## 5. Data vendors and APIs

For when screening outgrows portals. All resell the same county record with different
cleaning; the failure mode is uniform — **vendor lag and silent gaps vs the courthouse.**

- **ATTOM, CoreLogic, First American DataTree, Black Knight (ICE), LexisNexis** —
  national parcel/deed/mortgage/foreclosure files, licensed.
- **Regrid** — parcels + standardized schema, friendlier licensing tiers.
- **Cherre, Estated/Datafiniti, BatchData, PropStream, DealMachine** — API-first or
  investor-tool tiers on the same substrate.
- **Melissa / Smarty** — address hygiene (the V2 join-key lesson, as a product).

**Doctrine:** a vendor field you have not reconciled against one county's own record is an
unverified field ([V2 — keys, joins and the duplicate that doubles your market](../../curriculum/courses/07-evidence-data-judgment.md)).

## 6. Demographic, economic and hazard layers

The M1 (jobs-to-rents) inputs and the insurance lines:

- **Census ACS + LEHD/LODES** (commute flows), **BLS QCEW/CES** (employment by county),
  **BEA** (income), **IRS SOI migration** — who is moving where with what income.
- **State labor departments** — WARN notices: layoffs land in rents on a lag you can trade.
- **FEMA NFHL, USGS seismic, state wildfire maps, NOAA surge** — hazard = insurance =
  DSCR. The LA/FL/CA entries show how these reprice whole submarkets.
- **University enrollment data (IPEDS)** — the campus-ring layer behind the `launi`
  edition and [A7](../../curriculum/courses/04-the-asset.md).
- **FAA/DOT/state DOT project lists + corporate announcements** — the corporate-projects
  layer; announcements → jobs → rents, with the lags M1 teaches.

## 7. The county portal vendor patterns

Most of America's 3,000+ counties outsource their portals to a handful of vendors —
recognize the vendor and you already know the UI, the data depth and the export path:

| Vendor pattern | Typical footprint |
|----------------|-------------------|
| **Beacon / qPublic** (Schneider Geospatial) | GA, FL panhandle, IA, IN, IL downstate, MN, the Carolinas — hundreds of counties |
| **Vision Government Solutions** | New England town assessors (CT, MA, NH, RI) |
| **Tyler iasWorld / EagleWeb** | PA, OH pockets, mountain-state recorders |
| **DEVNET wEdge** | IL collar counties, scattered Midwest |
| **actDataScout** (DataScout) | AR, LA parishes, OK pockets |
| **BS&A Online** | Michigan, overwhelmingly |
| **Vanguard / GIS Workshop** | NE, ND, SD, WY, MT counties |
| **Delta / Flagship** | AL, MS |
| **RealAuction / GovEase / SRI / Bid4Assets** | Tax-sale platforms (FL, AZ, MD, IN, CA counties respectively and overlapping) |

The pattern is the resource: a new county's portal is usually one of these — check the
footer logo before learning a "new" system.
