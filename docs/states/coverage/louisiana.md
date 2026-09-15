# Louisiana — record coverage

*Status vocabulary and rules: [`README.md`](README.md). State process context:
[the Louisiana entry](../south-central.md#louisiana). Feeds marked `shipped` are packed
into the `nola`, `atlas_nola` and `launi` editions and passed the fleet sweep of
2026-09-09.*

**The state's ceiling, stated up front:** Louisiana is effectively a non-disclosure market
in Orleans and East Baton Rouge — recorded sale prices are not reliably public. The Comps
desk **cannot function there and says so**; the valuation weight falls on assessments,
income evidence and permits. That is a `no public record` row, not a to-do.

## Orleans Parish

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| L | Parcel geometry, use, campus rings | Orleans Parish assessor rolls + NOLA open-data GIS layers | shipped 2026-09 (nola/atlas_nola/launi editions) |
| L | Zoning district per parcel | City of New Orleans CZO map layer | shipped 2026-09 (evidence ceiling of 55 applies — see the zoning courses) |
| O | Owner of record, exemptions | Orleans Parish Assessor; conveyances at the Clerk's Land Records Division | pulled 2026-09 (owner PII stripped on ingest per `data/README.md`) |
| C | Asking rents, STR licenses | NOLA.gov STR license registry; listing portals | named — registry identified; no packed feed yet |
| A | Assessed values, homestead status | Assessor roll (homestead $7,500 assessed; parish millage tables) | shipped 2026-09 |
| T | Mortgage instruments, executory filings | Clerk of Civil District Court | named — index identified; no pull yet |
| O | Sale prices for comps | — | **no public record** (non-disclosure practice; the Comps desk refuses here by design) |
| O | Tax-sale calendar & adjudicated property | City/parish tax sale + adjudicated-property program | named — lien-auction reform in transition, re-verify mechanics before relying |
| R | Permits, code enforcement | NOLA open data (permits, violations) | pulled 2026-09 (feeds the conversion and evidence layers) |

## East Baton Rouge Parish

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| L | Parcels, use classes | EBRGIS open data / assessor roll | shipped 2026-09 (nola edition's Baton Rouge corridor; `launi` campus ring) |
| O | Owner of record | EBR Assessor; Clerk of Court conveyances | pulled 2026-09 (PII stripped) |
| A | Assessed values, millage | Assessor roll + parish millage | shipped 2026-09 |
| O | Sale prices for comps | — | **no public record** (same non-disclosure ceiling as Orleans) |
| T/O | Foreclosure & tax-sale pipeline | Clerk of Court; parish tax collector | named |

## Jefferson Parish and the ring

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| L/A | Parcels, values | Jefferson Parish Assessor / GIS | **blocked** (geoportal.jeffparish.net: container egress CONNECT refused, probed 2026-09-09; route is the desktop browser pane per [`PULL_RECIPE.md`](../../PULL_RECIPE.md)) |
| All | Lafayette, St. Tammany, Caddo (campus ring for `launi`) | Parish assessors (actDataScout pattern covers several) | named |

*Egress re-probed 2026-09-15:* eight New Orleans-area record hosts — `gis.nola.gov`,
`services.arcgis.com`, `nolagis.maps.arcgis.com`, `qpublic.schneidercorp.com`,
`www.jpassessor.com`, `assessorpublicsearch.nola.gov`, `opendata.nola.gov` and
`data.nola.gov` — every one returned `000`. Six days on from the probe below, nothing has
opened. The ranked expansion plan is [`PULL_NOLA.md`](../../PULL_NOLA.md), which measures
what each pull is worth before spending a session on it.

*Egress note (2026-09-09):* data.nola.gov, ebrgis.opendata.arcgis.com, services.arcgis.com,
geoportal.jeffparish.net, latax.state.la.us and qpublic.schneidercorp.com were all probed
from the container and refused at CONNECT — the whole class of GIS/open-data hosts is
policy-blocked, not individual sites. Wave-one pulls for these rows go through the desktop
browser-pane route.

## Statewide layers

| Layer | Source | Status |
|-------|--------|--------|
| Assessment roll aggregation | Louisiana Tax Commission | named — bulk availability unverified |
| Insurance context (the survival line) | Citizens depopulation rounds; Fortify Homes program data | named — program pages identified in the state guide |
| Historic/RTA district boundaries | SHPO + city RTA districts | named — mappable subsidy layer, wanted for the conversion engine |

## What would move the grade most

Measured by `scripts/standard_feasibility.py --plan`, which computes how many of the
Investment Standard's fifteen requirements each pull unlocks, against how many records it
lifts. The ordering is not the intuitive one:

1. **The Orleans rent feed.** It takes Orleans from **6 to 13 of 15** answerable
   requirements across **213,381 records already shipped**. It is a new *field* on existing
   records rather than new records, and nothing else in this state comes close.
2. **A Jefferson Parish parcel pull** (largest parish by population; completes the metro).
   The records land at 3 of 15 until Jefferson gets a rent feed of its own — breadth is
   worth less here than the missing field is.
3. The Tax Commission bulk roll — one feed that would lift every rural parish from
   `named` to `pulled`.
4. The RTA/historic district polygons — turns the state guide's "deal-maker" claim into a
   mappable layer the feasibility gate can consume.

**Two requirements — `sale` and `fresh` — are permanently unanswerable here.** No session
moves them. Orleans tops out at 13 of 15 and the app states the residue per property
rather than rounding it away.
