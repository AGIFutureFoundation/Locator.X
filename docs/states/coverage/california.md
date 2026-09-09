# California (Bay Area) — record coverage

*Status vocabulary and rules: [`README.md`](README.md). State process context:
[the California entry](../pacific.md#california). Feeds marked `shipped` are packed into
the `bay-ledger` and `atlas_bay` editions and passed the fleet sweep of 2026-09-09; the
browser-pane pull mechanics and their per-county quirks are documented in
[`PULL_RECIPE.md`](../../PULL_RECIPE.md) (the `/root/bayarea` pipeline).*

**The state's signature correction:** Prop 13 makes every assessed value a history lesson
(base year + ≤2%/yr), so assessment rows answer the *tax line*, not the *value* — and the
tax line itself resets at your purchase price. The inventory grades those as two different
questions on purpose.

## The Bay Area core (shipped editions)

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| L | Parcels, geometry, use | County assessor/GIS layers pulled via the browser-pane recipe (San Francisco, Alameda, Santa Clara, San Mateo, Contra Costa) | shipped 2026-09 (bay-ledger / atlas_bay) |
| O | Owner of record | County assessor rolls | pulled 2026-09 (PII stripped on ingest) |
| A | Assessed values | Assessor rolls | shipped 2026-09 — **graded as tax-line evidence, not market value** (Prop 13) |
| A | Projected tax at purchase | Reassessment-at-sale arithmetic (1% + local add-ons + parcel taxes) | shipped 2026-09 (the editions recompute; they never inherit the seller's bill) |
| C | Rent-regulation status | AB 1482 statewide cap + city ordinances (SF, Oakland rent boards) | named — per-parcel regulatory flag identified as a wanted layer; city registries vary |
| T | Deeds of trust, NOD filings | County recorder indexes | named — the pre-foreclosure NOD file is the richer pipeline (state guide), no packed feed yet |
| O | Sale prices for comps | Recorded transfers (California is a disclosure state; documentary transfer tax implies price) | pulled 2026-09 where the county layer publishes it — populated-rate quirks per county belong in the pull recipe log |
| O | Exit/transfer taxes | County documentary rates + city measures (SF tiers, Oakland, Berkeley) | named — rate table wanted for the exit solver |
| R | Permits | City open-data portals (SF Socrata, Oakland) | named |

## County-by-county notes

| County | Finding | Status |
|--------|---------|--------|
| San Francisco | City-county with strong open data; assessor roll + Socrata permits | shipped 2026-09 |
| Alameda | Parcels + roll pulled; Oakland's local measures move the tax line beyond the county base | shipped 2026-09 |
| Santa Clara | Parcels + roll pulled; tech-facility use codes drive the edition's category mix | shipped 2026-09 |
| San Mateo | Parcels + roll pulled | shipped 2026-09 |
| Contra Costa | Parcels + roll pulled | shipped 2026-09 |
| Marin / Sonoma / Napa / Solano | Ring counties — portals named, no pull | named |

## Statewide layers

| Layer | Source | Status |
|-------|--------|--------|
| Statewide parcels | State parcel layer / vendor aggregation | named — county-direct pulls preferred so far |
| Hazard overlays (the insurance line) | CAL FIRE hazard severity zones; USGS seismic; NFHL flood | named — wanted for insurance-adjusted DSCR, the same correction Louisiana taught |
| Soft-story retrofit inventories | SF/Oakland/LA mandate lists | named — a mappable capex flag on older multifamily |
| Entitlement streamlining eligibility (SB 9/35, AB 2011, density bonus) | State statute + local implementation | named — statute-level in the guide; parcel-level eligibility is a v2.0 conversion-engine question |

## What would move the grade most

1. The **NOD/trustee-sale feed** for the five core counties — the distress pipeline gate
   is the weakest shipped answer.
2. A per-parcel **rent-regulation flag** (built-before date × jurisdiction ordinance) —
   cheap to derive, large underwriting consequence.
3. CAL FIRE + flood overlays joined to parcels — makes the insurance line computable
   instead of anecdotal.
