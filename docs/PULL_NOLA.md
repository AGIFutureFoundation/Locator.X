# The New Orleans expansion — what to pull, in what order, and why not the obvious thing

**The ask was thirty thousand more New Orleans properties that meet criteria. The measured
answer is that the obvious pull is the second-best one**, and this page shows the working
rather than asserting it. Everything here is produced by
`python3 scripts/standard_feasibility.py --plan`, which reads the Investment Standard out
of `src/standards.js` and the record's reach out of the coverage inventory, so neither can
drift from it.

## What "meets criteria" can even mean here

The Investment Standard states **15** requirements and grades each meets / fails /
**unknown**. Unknown is a first-class outcome, and in this market it is a large one:

| Market | Answerable today | Structurally unknown |
|---|---:|---|
| Orleans Parish | **6 of 15** | `cf` `cap` `grm` `dscr` `beocc` `norent` `sale` `fresh` `yield` |
| East Baton Rouge | **6 of 15** | the same nine |
| Jefferson Parish (the +30k target) | **3 of 15** | the nine above plus `built` `use` `size` — its parcel layer is not pulled at all |

A property in Orleans can score **at best 6 of 15**, and the count of unknowns travels with
the score. A screen reporting "N properties meet criteria" in New Orleans is either
counting nine unanswerable requirements as passes or counting them as failures. The second
rejects an entire metro for the sin of its state's recording practice. Neither is a screen
this platform will ship.

## Why the ceiling is where it is

**Two of the nine are permanent.** Louisiana is effectively a non-disclosure market in
Orleans and East Baton Rouge: recorded sale prices are not reliably public. `sale` and
`fresh` cannot be answered by any session, at any budget, ever. That is a `no public
record` row in [`states/coverage/louisiana.md`](states/coverage/louisiana.md), not a
backlog item, and the Comps desk already refuses to operate there by design.

**Seven of the nine are one missing feed.** `cf`, `cap`, `grm`, `dscr`, `beocc`, `norent`
and `yield` all fail for the same reason: **there is no packed rent figure**. The STR
licence registry is identified and the asking-rent row is `named`. This is obtainable.

## The ranked plan

| Priority | Pull | Market | Requirements | Records it lifts |
|---|---|---|---:|---|
| **1** | **Rent feed** | Orleans Parish | **6 → 13 of 15** | **213,381 already shipped** |
| 2 | Rent feed | East Baton Rouge | 6 → 13 of 15 | arrives with the pull |
| 3 | Parcel layer (`price`, `use`, `area`) | Jefferson Parish | 3 → 5 of 15 | the +30k arrives with the pull |
| 4 | Rent feed | Jefferson Parish | +1 further | as above |

**Priority 1 is not a new record. It is a new field on records already shipped**, and it
more than doubles what the standard can say about every one of them. Thirty thousand new
Jefferson parcels each land at 3 of 15 until that parish gets the same feed; 213,381
Orleans records go from 6 to 13 the day the rent feed lands.

That is the honest answer to "find 30k more that meet criteria": **do the Jefferson pull,
and do the rent feed first, because breadth without the rent feed buys records the
standard cannot grade.**

## Session plan

Mechanics are in [`PULL_RECIPE.md`](PULL_RECIPE.md) and the ground rules hold without
exception: **count query first, never a blind pull**; never conclude a field is empty from
a timeout — async-launch and poll; transfer each layer as it finishes; **PII stripped on
ingest**; record the disappointments in the recipe's additions log, because they are the
valuable findings.

### Step 1 — Orleans rent (priority 1)

- NOLA.gov short-term-rental licence registry: licence records with address and type
- Asking-rent sources per the `named` coverage row
- **Acceptance:** a rent figure joins to a parcel by address or parcel id, and the join
  rate is *measured and published*, not assumed. Rows that fail to join carry `unknown`
  and are counted — a 60% join rate is a usable feed honestly labelled; a 60% join rate
  reported as 100% is the failure this whole project exists to avoid.
- **Advances:** the Orleans `C` row from `named` to `pulled`, and seven Standard
  requirements across every shipped Orleans record.

### Step 2 — Jefferson Parish parcels (the +30k)

- Parish assessor / GIS parcel layer: geometry, parcel id, use code, assessed value,
  building area, year built, unit count where published
- **Count query first.** The parcel total is whatever the layer reports. This document
  deliberately states no expected count: nobody here has reached the endpoint, and a
  number written down before the count query is a number somebody will quote later.
- **Acceptance:** `tests/edition_sweep.js` on the rebuilt edition; the record count
  recorded in `docs/PUBLISH_MAP.md` and cross-checked by `market/validate_market.py`.
- **Advances:** the Jefferson `L/A` row from `blocked` to `pulled`; completes the metro;
  extends the `atlas_nola` footprint. The regionalization pairs already carry
  "Orleans & Jefferson", and `build_state.py`'s `nola` spec takes the data module.

### Step 3 — use-code crosswalk for Jefferson

Jefferson's use vocabulary must enter `crosswalk/usecodes.json` **with its source and
date**, from a measured groupBy or a published manual — never inferred from a description.
Until it does, `class_screen.py` counts Jefferson rows as unmatched and says so, which is
correct and is not a bug to route around.

## Egress, probed today

All eight New Orleans-area record hosts were probed from this container on **2026-09-15**
and every one returned `000`:

`gis.nola.gov` · `services.arcgis.com` · `nolagis.maps.arcgis.com` ·
`qpublic.schneidercorp.com` · `www.jpassessor.com` · `assessorpublicsearch.nola.gov` ·
`opendata.nola.gov` · `data.nola.gov`

This is the same policy-blocked class dated in
[`states/coverage/README.md`](states/coverage/README.md) — it is not an outage and not a
credential problem. **Every step above runs from the desktop browser pane.** No agent
session can complete them, and no agent session may fabricate their output: a pulled row
that was not pulled is the one unrecoverable error in this project.

## What this page will not do

It will not estimate the Jefferson parcel count, guess a join rate for the rent feed, or
state how many of the thirty thousand will meet criteria. Those are the outputs of the
session, and writing them down in advance is how an estimate becomes a quoted fact. The
count query answers the first, the measured join rate answers the second, and the standard
answers the third — **after** the data exists.
