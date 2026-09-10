# The Locator.X process, state by state

The seven-gate LOCATOR screen is national; the record it runs on is not. Foreclosure regime,
tax-delinquency mechanics, disclosure law, closing custom, transfer taxes and where the parcel
record actually lives all change at the state line — and often again at the county line. This
directory is the state-by-state version of the process: **the same gates, localized inputs.**

> **Verify before relying.** Statutes, portals and programs change; county practice varies
> inside every state; several states are mid-reform on tax sales. Every classification below is
> the commonly cited baseline, not legal advice — confirm against the current statute, the
> county's own site, and local counsel before money moves. This layer is a navigation aid to
> the public record, nothing more. Last reviewed: 2026-09.

---

## Contents

- [How to run the process in any state](#how-to-run-the-process-in-any-state)
- [What changes at the state line](#what-changes-at-the-state-line)
- [The 50-state quick reference](#the-50-state-quick-reference)
- [The regional guides](#the-regional-guides)

---

## How to run the process in any state

The state-localized version of the seven gates. Work them in order; write **unknown** where the
state's record cannot answer — that is a finding, not a failure.

### L — Location
1. Find the **statewide parcel layer** if one exists (about half the states publish one); else
   the county GIS. The regional guides name the portal or the vendor pattern per state.
2. Pull the zoning layer from the municipality — zoning is local everywhere; the state guide
   only tells you who holds it.

### O — Ownership economics
3. Owner of record from the **assessor** (values) and the **recorder / register of deeds**
   (instruments). These are different offices in most states; the guides note where they merge.
4. Check the state's disclosure regime — what a seller must tell you shapes what you must find
   yourself. Caveat-emptor-leaning states put more weight on your own record pull.

### C — Cash flow
5. Rents: no state records them. Use the resources directory
   ([property data sources](../resources/property-data-sources.md)) and mark the evidence grade
   accordingly.
6. Operating costs that are state-set: property-tax cycle and reassessment rules, insurance
   climate (coastal wind/flood states price differently), mandatory inspections.

### A — Asset test
7. Run the Locator.X asset/liability verdict with state taxes and insurance in the expense
   stack, not national averages.

### T — Terms & leverage
8. Note the **security instrument and foreclosure regime** (quick reference below). Judicial
   states mean slower recovery for lenders — it is priced into terms; nonjudicial states price
   speed.
9. Match the deal to the lender landscape ([lenders](../resources/lenders.md)) and to the
   state's programs ([state & county programs](../resources/state-county-programs.md)).

### O — Outlook
10. Exit is priced by the **next buyer's debt** in that state: transfer taxes, title customs
    and assumability all land in the exit cap rate.
11. Distress pipeline: the state's tax-sale calendar and foreclosure volumes are public — the
    guides say which office publishes them.

### R — Record
12. Write the decision memo before the outcome grades it, citing the **specific state sources**
    used, with pull dates. A source-free row is a certainty error waiting to happen.

## What changes at the state line

| Dimension | The split | Why it moves your numbers |
|-----------|-----------|---------------------------|
| Foreclosure | **Judicial** (court-supervised, months–years) vs **nonjudicial** (power of sale, weeks–months) | Lender risk pricing, distress-pipeline speed, REO supply |
| Tax delinquency | **Lien certificate** vs **tax deed** vs **redeemable deed** | Whether delinquency is a yield play, an acquisition channel, or both; redemption periods set your capital lockup |
| Disclosure | Mandatory forms vs caveat-emptor-leaning | How much of gate O and A you must source yourself |
| Closing custom | **Attorney states** vs **escrow/title states** | Cost, speed, who you build the relationship with (E2's map changes) |
| Transfer tax | Zero to ~4%+ combined | Directly in the exit arithmetic (gate O) |
| Record access | Statewide parcel layer vs county-by-county, free vs paywalled | Your evidence grade ceiling per county |
| Redemption rights | Post-sale redemption in some states | Title seasoning and resale timing after distress purchases |

## The 50-state quick reference

Foreclosure = primary residential method in practice (many states allow both). Tax system =
predominant county practice; hybrids noted. Transfer tax = whether a state-level deed transfer
or recordation tax exists (local add-ons vary). HFA = the state housing finance agency, the
anchor for the program cross-reference.

| State | Guide | Foreclosure | Tax delinquency | Transfer tax | HFA |
|-------|-------|-------------|-----------------|--------------|-----|
| Alabama | [South Central](south-central.md#alabama) | Nonjudicial | Lien (moving to lien auctions broadly) | Yes (deed tax) | AHFA |
| Alaska | [Pacific](pacific.md#alaska) | Nonjudicial | Deed | No | AHFC |
| Arizona | [Mountain West](mountain-west.md#arizona) | Nonjudicial | Lien | Flat $2 (effectively none) | ADOH |
| Arkansas | [South Central](south-central.md#arkansas) | Both; nonjudicial common | Deed (state land commissioner) | Yes | ADFA |
| California | [Pacific](pacific.md#california) | Nonjudicial | Deed | Yes (county documentary) | CalHFA |
| Colorado | [Mountain West](mountain-west.md#colorado) | Nonjudicial (public trustee) | Lien | Yes (nominal doc fee) | CHFA |
| Connecticut | [Northeast](northeast.md#connecticut) | Judicial (incl. strict) | Redeemable deed | Yes | CHFA |
| Delaware | [Southeast](southeast.md#delaware) | Judicial (scire facias) | Deed (monition sale) | Yes (high, ~4% combined) | DSHA |
| DC | [Southeast](southeast.md#district-of-columbia) | Nonjudicial | Lien | Yes | DCHFA |
| Florida | [Southeast](southeast.md#florida) | Judicial | Hybrid: lien, then deed application | Yes (doc stamps) | Florida Housing |
| Georgia | [Southeast](southeast.md#georgia) | Nonjudicial | Redeemable deed | Yes | DCA / GHFA |
| Hawaii | [Pacific](pacific.md#hawaii) | Judicial (predominant) | Deed (redeemable) | Yes | HHFDC |
| Idaho | [Mountain West](mountain-west.md#idaho) | Nonjudicial | Deed | No | IHFA |
| Illinois | [Midwest](midwest.md#illinois) | Judicial | Lien | Yes | IHDA |
| Indiana | [Midwest](midwest.md#indiana) | Judicial | Lien | No | IHCDA |
| Iowa | [Midwest](midwest.md#iowa) | Judicial | Lien | Yes | Iowa Finance Authority |
| Kansas | [Midwest](midwest.md#kansas) | Judicial | Deed | No | KHRC |
| Kentucky | [South Central](south-central.md#kentucky) | Judicial | Lien (certificates of delinquency) | Yes | KHC |
| Louisiana | [South Central](south-central.md#louisiana) | Judicial (executory process) | Hybrid; lien-auction reform in transition | No state tax (NOLA doc tax) | LHC |
| Maine | [Northeast](northeast.md#maine) | Judicial | Deed (municipal lien → automatic foreclosure) | Yes | MaineHousing |
| Maryland | [Southeast](southeast.md#maryland) | Quasi-judicial (order to docket) | Lien | Yes (state + county) | Maryland DHCD |
| Massachusetts | [Northeast](northeast.md#massachusetts) | Nonjudicial (+ Land Court step) | Taking → Land Court foreclosure | Yes (deed excise) | MassHousing |
| Michigan | [Midwest](midwest.md#michigan) | Nonjudicial (by advertisement) | Deed (county/state forfeiture) | Yes | MSHDA |
| Minnesota | [Midwest](midwest.md#minnesota) | Nonjudicial (by advertisement) | Deed (state forfeiture) | Yes | Minnesota Housing |
| Mississippi | [South Central](south-central.md#mississippi) | Nonjudicial | Lien | No | MS Home Corporation |
| Missouri | [Midwest](midwest.md#missouri) | Nonjudicial | Lien | No | MHDC |
| Montana | [Mountain West](mountain-west.md#montana) | Nonjudicial | Lien | No | Montana Housing |
| Nebraska | [Midwest](midwest.md#nebraska) | Nonjudicial (trust deeds) | Lien | Yes | NIFA |
| Nevada | [Mountain West](mountain-west.md#nevada) | Nonjudicial | Deed | Yes | NV Housing Division |
| New Hampshire | [Northeast](northeast.md#new-hampshire) | Nonjudicial | Deed (to municipality) | Yes | NHHFA |
| New Jersey | [Northeast](northeast.md#new-jersey) | Judicial | Lien | Yes | NJHMFA |
| New Mexico | [Mountain West](mountain-west.md#new-mexico) | Judicial | Deed | No | New Mexico MFA |
| New York | [Northeast](northeast.md#new-york) | Judicial | Varies by county (lien and deed) | Yes (+ mansion tax) | NYS HCR |
| North Carolina | [Southeast](southeast.md#north-carolina) | Nonjudicial (clerk hearing) | Deed | Yes (excise) | NCHFA |
| North Dakota | [Midwest](midwest.md#north-dakota) | Judicial | Deed (county forfeiture) | No | NDHFA |
| Ohio | [Midwest](midwest.md#ohio) | Judicial | Both (lien certs in large counties; deed sales) | Yes | OHFA |
| Oklahoma | [South Central](south-central.md#oklahoma) | Judicial common (borrower may elect) | Deed | Yes (doc stamps) | OHFA (Oklahoma) |
| Oregon | [Pacific](pacific.md#oregon) | Nonjudicial (trust deeds) | Deed (county forfeiture) | No (one county exception) | OHCS |
| Pennsylvania | [Northeast](northeast.md#pennsylvania) | Judicial | Deed (upset → judicial sale) | Yes (state + local) | PHFA |
| Rhode Island | [Northeast](northeast.md#rhode-island) | Nonjudicial | Redeemable tax sale | Yes | RIHousing |
| South Carolina | [Southeast](southeast.md#south-carolina) | Judicial | Lien-style redeemable sale | Yes (deed recording fee) | SC Housing |
| South Dakota | [Midwest](midwest.md#south-dakota) | Both; judicial common | Lien (rarely sold; county holds) | Yes | SDHDA |
| Tennessee | [South Central](south-central.md#tennessee) | Nonjudicial | Redeemable deed | Yes | THDA |
| Texas | [South Central](south-central.md#texas) | Nonjudicial | Redeemable deed | No | TDHCA |
| Utah | [Mountain West](mountain-west.md#utah) | Nonjudicial | Deed | No | Utah Housing Corp |
| Vermont | [Northeast](northeast.md#vermont) | Judicial | Redeemable tax sale | Yes | VHFA |
| Virginia | [Southeast](southeast.md#virginia) | Nonjudicial | Deed (judicial sale) | Yes (recordation) | Virginia Housing |
| Washington | [Pacific](pacific.md#washington) | Nonjudicial | Deed | Yes (graduated REET) | WSHFC |
| West Virginia | [Southeast](southeast.md#west-virginia) | Nonjudicial | Lien (state auditor process) | Yes | WVHDF |
| Wisconsin | [Midwest](midwest.md#wisconsin) | Judicial | Deed (county forfeiture) | Yes | WHEDA |
| Wyoming | [Mountain West](mountain-west.md#wyoming) | Nonjudicial (by advertisement) | Lien | No | WCDA |

## The regional guides

Every state entry carries the same four sections — *Run the record here* (portals),
*Process notes* (foreclosure, tax sale, disclosure, closing custom), *Programs & money*
(HFA and state/county programs), and *Locator.X angle* (which gates the record answers well).

| Guide | States |
|-------|--------|
| [Northeast](northeast.md) | CT, ME, MA, NH, NJ, NY, PA, RI, VT |
| [Southeast](southeast.md) | DE, DC, FL, GA, MD, NC, SC, VA, WV |
| [South Central](south-central.md) | AL, AR, KY, LA, MS, OK, TN, TX |
| [Midwest](midwest.md) | IL, IN, IA, KS, MI, MN, MO, NE, ND, OH, SD, WI |
| [Mountain West](mountain-west.md) | AZ, CO, ID, MT, NV, NM, UT, WY |
| [Pacific](pacific.md) | AK, CA, HI, OR, WA |

## The 90-day path, localized

Curriculum item F6's ninety-day runway (calibrate → build flow → close or walk clean)
with every state-varying checkpoint mapped to these guides —
[`ninety-day-path.md`](ninety-day-path.md).

## Record-coverage inventories

The deepening layer (roadmap v1.1): per-state tables of which gates the record actually
answers, jurisdiction by jurisdiction, every row sourced and dated —
[`coverage/`](coverage/README.md). Wave one: [Louisiana](coverage/louisiana.md),
[California](coverage/california.md), [Florida](coverage/florida.md).

Cross-references: the program taxonomy and how to search it —
[`../resources/state-county-programs.md`](../resources/state-county-programs.md); lender
matching — [`../resources/lenders.md`](../resources/lenders.md); national and county data
sources — [`../resources/property-data-sources.md`](../resources/property-data-sources.md).
