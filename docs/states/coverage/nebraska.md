# Nebraska — record coverage and expansion candidates

*Status vocabulary and rules: [`README.md`](README.md). State process context:
[the Nebraska entry](../midwest.md#nebraska). Added to the wave by Foundation direction
(2026-09-09): Omaha and the wider Nebraska regions as asset-class expansion candidates —
apartments 5+, lodging, student housing. Nothing here is pulled yet; candidate regions
are held at `named` with the probe that would qualify them, per the
[asset-class criteria](../../asset-classes/README.md#what-matches-the-locatorx-criteria-means-for-a-new-region).*

## Why Nebraska screens as promising — and what must be verified

The M1 chain (jobs → households → rents) has visible anchors here, but an anchor is a
hypothesis until the record prices it. Each candidate names its anchor and the probe
that converts it to evidence:

| Region | The anchor (public, verifiable) | What a probe must confirm |
|--------|--------------------------------|---------------------------|
| **Omaha (Douglas Co.)** | Headquarters density for a metro its size (Berkshire Hathaway, Union Pacific, Kiewit, Mutual of Omaha), UNMC medical-center expansion, steady in-migration | Apartment stock identifiable in the assessor vocabulary; rent evidence; TIF-district boundaries (Omaha uses TIF broadly — a parcel's increment status changes the tax line) |
| **Sarpy Co. (Papillion/La Vista/Bellevue)** | Data-center corridor buildout (hyperscaler campuses), Offutt AFB stability | Whether growth lands in rentable stock or single-family; utility/infrastructure timelines |
| **Lincoln (Lancaster Co.)** | State capital + University of Nebraska (~25k students) — the campus-ring lens the `launi` edition is built on | Student-housing identifiability in the assessor vocabulary; the campus ring priced against Louisiana's for comparison |
| **Grand Island (Hall Co.) / Kearney (Buffalo Co.)** | Ag-processing employment, I-80 logistics, UNK in Kearney | Whether counts clear the sample floor at all — small-metro medians sit on thin samples (V3 binds) |
| **Norfolk / Columbus / Fremont** | Manufacturing and processing employers | Same sample-floor question; Fremont additionally sits in the Omaha commute shed |

**The honest counterweights,** from the [state guide](../midwest.md#nebraska): trust
deeds foreclose nonjudicially but *mortgages judicially* — instrument matters; the March
tax-lien sales are round-robin (statutory 14%, allocation by luck — yield only, not an
acquisition channel); documentary-stamp tax exists; outside Omaha/Lincoln the V3 sample
floor binds almost everywhere.

## Record coverage

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| L/A | Parcels, values — Douglas Co. | Douglas County Assessor/Register of Deeds (dcassessor / DOTComm GIS) | named |
| L/A | Parcels, values — Sarpy Co. | Sarpy County Assessor / GIS | named |
| L/A | Parcels, values — Lancaster Co. | Lancaster County Assessor / GIS | named |
| L/A | Smaller counties (Hall, Buffalo, Madison, Dodge, Platte, Scotts Bluff) | Vanguard / GIS Workshop portal pattern ([vendor table](../../resources/property-data-sources.md#7-the-county-portal-vendor-patterns)) | named |
| A | Statewide standardized valuations | Nebraska's state valuation lookup (property assessment division) | named — the statewide layer that would lift rural counties at once |
| O (own.) | Instruments | County registers of deeds (Douglas/Lancaster/Sarpy online) | named |
| O (outlook) | Sale prices | Nebraska is a **disclosure** state (documentary stamp) — recorded consideration exists | named — good comp ceiling once pulled |
| T/O | Distress pipeline | Trustee notices (trust deeds); March round-robin lien sales at county treasurers | named — lien channel is yield-only by design |
| C | Rents | No public record; listing evidence + leases only | no public record (as everywhere) |
| — | Asset-class vocabulary | Unknown until a groupBy probe — **not in the crosswalk yet**; Douglas County is the probe that matters most | named |

*Egress note:* the container cannot reach county GIS hosts (verified as a class,
2026-09-09 — see [Louisiana's note](louisiana.md)); Nebraska probes run over the desktop
browser-pane route per [`PULL_RECIPE.md`](../../PULL_RECIPE.md).

## The probe order

1. **Douglas County groupBy** on its use-class field — one call answers whether Omaha's
   apartments/lodging are identifiable, and seeds the crosswalk entry with measured
   counts (the [growing-the-layer loop](../../asset-classes/README.md#growing-the-layer)).
2. **Lancaster County** — same probe, plus the UNL campus ring for the student-housing
   lens (`launi`'s method, second market).
3. **Sarpy County** — completes the metro; the data-center corridor is mappable from
   parcels + permits.
4. **The state valuation lookup** — bulk availability unverified; if it exports, rural
   Nebraska lifts from `named` in one feed.

Wave placement: Nebraska opens **wave two** (user-directed) alongside completing wave
one's Florida probe; the [roadmap §4](../../ROADMAP.md#4-v11--the-state-layer-wave-one)
tracks both.
