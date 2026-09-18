# What the landscape does, what Locator.X does, and what it refuses to do

The [landscape register](LANDSCAPE.md) lists 25 tools investors actually buy. This
page sets that list against **what is in this repository today** — measured, module
by module, not described from memory. Every "ships" row names a file and its line
count, and `scripts/validate_landscape.py` fails the build if the file is missing or
the count has moved, so this page cannot quietly drift into a brochure.

Three columns matter more than the feature grid:

- **Ships** — it is in `src/`, it is in the built editions, a gate covers it.
- **Partial** — the mechanism exists, the coverage or the data behind it does not.
- **Refused** — the category buys it and this platform will not build it. Those rows
  are the argument, not an apology.

## The six jobs the tools are bought for

The research groups the category by job: **find** a property, **evaluate** it,
**contact and acquire** it, **finance** it, **operate** it, **exit** it. Taking them
in order is the only fair way to compare, because no tool in the register covers all
six either.

### 1. Find

| Capability | Category tools | Locator.X | Status |
|---|---|---|---|
| Nationwide record search and filtering | PropStream, PropertyRadar, DataTree | `src/views.js` (205 lines) stacks asset-class, land/building and plain-language price filters; `src/app.js` (1756) holds the record layer and map | **partial** — 8 editions shipped against 90 gate rows ([coverage](../states/coverage/README.md)), not nationwide |
| Parcel boundaries and field lookup | LandGlide, DealMachine | `src/app.js` map layers, `src/ar.js` (248) field view, `src/walk.js` (167) walkable destinations | **ships**, within an edition's footprint |
| Distress discovery | Foreclosure.com, PropertyRadar | `src/reo.js` (150) government-owned resale, `src/signals.js` (148) ten researched outside forces | **partial** — federal REO is live; county distress feeds are in [`PULL_QUEUE.md`](../PULL_QUEUE.md) |
| New-listing monitoring and diffing | DealMachine, REsimpli | `src/scout.js` (287) scans feeds, diffs, scores and writes a review digest per pass | **ships** |
| Below-market identification | PropStream filters, Mashvisor | `src/belowmarket.js` (175) — three independently-separated measures, none of them a single "discount" number | **ships** |
| Owner contact enrichment / skip tracing | PropStream, BatchLeads, DataSift, REISift, DealMachine | — | **refused**, see below |

### 2. Evaluate

| Capability | Category tools | Locator.X | Status |
|---|---|---|---|
| Deal underwriting (rental, flip, BRRRR, commercial) | DealCheck, BiggerPockets Pro | `src/underwrite.js` (599) buy box, auto pipeline, offer solver; `src/dev.js` (158) conversion math | **ships** |
| Comparable sales | PropStream, HouseCanary | `src/comps.js` (282) — a comparable is a **recorded sale with a date**, never a listing or an estimate | **ships** |
| Rent estimates | Rentometer, Mashvisor, AirDNA | `src/conv.js` (111) and `src/rebuild.js` (335) produce **models, labelled as models** | **partial** — no licensed rent feed; the label is the point |
| Market analytics and forecasts | Mashvisor, AirDNA, HouseCanary | `src/predict.js` (587) with a stated method and a **backtest that says whether to believe it**; `src/outlook.js` (225) | **ships** |
| STR-specific revenue modelling | AirDNA | `src/conv.js`, `src/campus.js` (250) student-housing demand | **partial** — lodging expansion scoped in [`HOTEL_EXPANSION.md`](../HOTEL_EXPANSION.md) |
| Source quality shown to the user | *nobody in the register* | `src/evidence.js` (223) grades every county feed; `src/sources.js` (176) catalogues how each source attaches; the **evidence lens** in `src/app.js` (1756) maps the grade across a whole market and names the field that market is missing most | **ships** — this has no equivalent in the category, and it is now spatial rather than per-property |
| Asset-class normalisation across jurisdictions | *nobody in the register* | [`crosswalk/usecodes.json`](../../crosswalk/usecodes.json), 48 codes across 8 jurisdictions, each with source + date | **ships** — no equivalent |

### 3. Contact and acquire

| Capability | Category tools | Locator.X | Status |
|---|---|---|---|
| CRM and pipeline | REsimpli, InvestorFuse | `src/underwrite.js` pipeline, `src/telemetry.js` (280) your own record | **partial** — single-operator, no team routing |
| Offer and closing-file discipline | *thinly covered* | `src/packet.js` (173) — the transaction as a **file**: documents to demand, clause families, the contingency that exists to be used | **ships** |
| Contract education | — | [`CONTRACT_ANATOMY.md`](../CONTRACT_ANATOMY.md) | **ships**, and draws the no-drafting line explicitly |
| Dialers, SMS, direct mail, postcards | BatchDialer, BatchLeads, DealMachine, REsimpli | — | **refused** |
| "Motivation" scoring of owners | PropStream, DataSift | — | **refused** |

### 4. Finance

| Capability | Category tools | Locator.X | Status |
|---|---|---|---|
| Loan modelling | DealCheck, BiggerPockets | `src/underwrite.js` offer solver; `src/hacks.js` (142) owner-occupied math against the published FHA ceiling | **ships** |
| Lender and program navigation | *nobody* | [`docs/resources/`](../resources/) lenders, programs, administrators | **ships** — navigation of the public record, never a recommendation |
| Lender marketplace / brokered placement | — | — | **refused** — that is advice with a commission attached |

### 5. Operate

| Capability | Category tools | Locator.X | Status |
|---|---|---|---|
| Property management, leasing, accounting | AppFolio, Buildium, Rentec, TenantCloud, RentRedi | — | **absent** — the report's "close the loop after acquisition" gap is real and unbuilt |
| Post-acquisition feedback into underwriting | *nobody does this well* | `src/actuals.js` (231) — the pipeline gains an **Acquired** stage, you record what a building actually did, and the desk compares it against what it underwrites for that same property today. Per property that is a fact; across four or more it is the systematic bias in your own underwriting, reported with its denominator | **ships** — and it refuses to print a median below a stated four-property floor, because a tendency computed from two is a decoration. It names the assumption a bias would move and **does not touch it**: tuning the desk toward the last three buildings would replace a stated assumption with an unstated one |

### 6. Exit

| Capability | Category tools | Locator.X | Status |
|---|---|---|---|
| Disposition lists | DealMachine | `src/geoexport.js` (199) filtered set as an interchange file | **partial** |
| Investor-facing memo | *nobody* | `src/uwexport.js` (370) — self-contained PDF memorandum and a rendered video reel, no external libraries | **ships** |
| Desk interoperability | *nobody* | `src/deskws.js` (91) + [`INTEROP.md`](../INTEROP.md), the worksheet JSON shape and the no-laundering rule | **ships** — no equivalent |

## What the report asked for, in its own terms

The research names five gaps. Scored honestly:

| The gap, as stated | Where this repo stands |
|---|---|
| "Replace the app stack" — one place for data, underwriting and portfolio | **Two of three.** Data and underwriting are in one file; portfolio and operations are not built. |
| "Make every decision explainable" | **Already the architecture.** `src/evidence.js`, `src/sources.js`, `src/comps.js` and `src/predict.js`'s backtest exist for this reason. It is not a roadmap item here; it is the reason the roadmap is slow. |
| An AI agent system | **Partial.** `src/rag.js` (224) is BM25 retrieval over the research corpus, in-page and offline, with grounded citation when the viewer grants the capability; `src/assistant.js` (174) and `src/walkthrough.js` (195) guide. No autonomous agent takes an action on a user's behalf, by design. |
| Strategy switchboard — compare hold / flip / BRRRR / STR on one property | **Ships**, as `src/switchboard.js` (455). Five strategies over one record, each column graded by its **weakest** input rather than its average, and columns resting on different kinds of input are shown side by side but deliberately **not ranked**. Where a strategy cannot be evaluated the column names the missing input; where the building rules it out, it says what about the building. |
| Close the loop after acquisition | **Not built.** See Operate, above. |

## What this platform will not build, and why

These are not backlog items. They are the boundary, and they cost real addressable
market — five of the register's most successful tools sell primarily on them.

1. **Skip tracing and owner contact enrichment.** Owner names and mailing addresses
   are stripped at ingest and never enter the repository ([`data/README.md`](../../data/README.md) §2:
   *"a committed mirror would preserve them forever in git history"*). A feature that
   sells the thing you deliberately threw away is not a feature you have.
2. **Autonomous outreach** — dialers, SMS blasts, direct-mail campaigns. The platform
   does not contact a property owner on a user's behalf. A system that acts on a
   record it graded `C` is worse than one that does nothing.
3. **"Motivation" and distress labels without evidence.** Naming a household as
   motivated is a claim about a person, made from a data join, with no way for that
   person to see or contest it. Where the record says *lis pendens filed on a date*,
   that is what the record layer shows. Everything past it is inference sold as fact.
4. **Recommendations.** Every state, program and lender surface is navigation of the
   public record with verify-before-relying language. No "best lender for you," no
   "buy this," no score that collapses a decision into a number the user did not build.
5. **Estimates presented as prices.** An assessment is an assessment. A model is a
   model. The register on the previous page holds competitors' pricing to the same
   standard it holds the platform's own numbers to.

The category's premium tier is largely priced on 1–3. Locator.X's premium argument has
to come from the rows in this table that read *no equivalent* — source grading, the
use-code crosswalk, the backtest, and the interop contract — which is what
[`PREMIUM_ROADMAP.md`](PREMIUM_ROADMAP.md) is built on.
