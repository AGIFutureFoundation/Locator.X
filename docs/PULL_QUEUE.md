# The pull queue — one desktop session's worth of probes, in order

Every route from the development container to county records is policy-blocked (dated in
[`states/coverage/README.md`](states/coverage/README.md#egress-routes-dated)); the proven
route is the desktop browser pane, mechanics in [`PULL_RECIPE.md`](PULL_RECIPE.md). This
file is the queue for that session: what to probe, in what order, and exactly which
repository rows each probe advances — so the session spends its time pulling, not
re-deriving the plan.

**Lodging expansion sits alongside this queue.**
[`HOTEL_EXPANSION.md`](HOTEL_EXPANSION.md) carries 96 candidate areas in evidence
tiers, generated from the measured layer, plus the measured cost of growing an
edition. Its first probe outranks most of this queue for a hotel focus: the anchor
markets hold the most lodging stock and have no lodging vocabulary mapped.

**Ground rules carried in from the recipe:** count query first, never a blind pull;
never conclude a field is empty from a timeout (async-launch and poll); transfer each
layer as soon as it finishes; PII stripped on ingest; record the disappointments in the
recipe's additions log — they are the valuable findings.

## The queue

| # | Probe | Target | One probe advances | Ingest ready |
|---|-------|--------|--------------------|--------------|
| 1 | **Douglas County, NE** groupBy on its use-class field | Douglas County Assessor / DOTComm GIS (find the ArcGIS REST root from the assessor site) | Omaha's [landing rows in `nebraska.md`](states/coverage/nebraska.md#landing-rows--exactly-what-the-pull-session-fills-and-where-it-lands); seeds a new [crosswalk](../crosswalk/usecodes.json) jurisdiction with measured counts; feeds `build_state.py omaha-template`, which refuses to build until this data exists | `crosswalk/validate_usecodes.py` gates the new entry; [`class_screen.py`](../scripts/class_screen.py) screens the pull |
| 2 | **Orange County, FL** NAL file (one download) | FL DOR data portal (floridarevenue.com Property Data Portal, NAL file for county 48) | Verifies the DOR code dictionary → flips the whole `florida_dor` crosswalk row from unverified; the same parser then covers **all 67 counties**; advances [`florida.md`](states/coverage/florida.md) | `python3 scripts/fl_nal_probe.py <file> [--out data/...]` — PII strip tested |
| 3 | **Jefferson Parish, LA** parcel layer | geoportal.jeffparish.net (ArcGIS) | Completes the NOLA metro in [`louisiana.md`](states/coverage/louisiana.md); extends the `atlas_nola` footprint | Regionalization pairs already carry "Orleans & Jefferson"; [`build_state.py`](../build_state.py) `nola` spec takes the data module |
| 4 | **Lancaster County, NE** groupBy | Lancaster County Assessor / GIS | Lincoln + the UNL campus ring — the `launi` method's second market ([landing rows](states/coverage/nebraska.md#landing-rows--exactly-what-the-pull-session-fills-and-where-it-lands)); feeds `build_state.py lincoln-template` | Same crosswalk/screen path as #1 |
| 5 | **NYC PLUTO** bulk download | NYC Planning — PLUTO/MapPLUTO release | The Northeast's single biggest `named`→`pulled` jump ([`new-york.md`](states/coverage/new-york.md)); BBL joins to the rent-regulation overlay | Bulk file, no scraping; document field verdicts in the recipe log |
| 6 | **Bay ring** — Marin, Sonoma, Napa, Solano | County assessor/GIS portals | Extends `atlas_bay` beyond the five shipped counties ([`california.md`](states/coverage/california.md)) | Existing `/root/bayarea` pipeline (recipe step 4 + grab.py transport) |
| 7 | **CA NOD/trustee-sale feed**, five core counties | County recorder indexes | The weakest shipped gate in the Bay editions — the distress pipeline | New feed; record mechanics in the recipe |
| 8 | **Salt Lake County, UT** groupBy | County assessor (UGRC parcels free) | Completes the Wasatch Front next to Utah County's measured rows ([`utah.md`](states/coverage/utah.md)) | Crosswalk + screen |
| 9 | **Mecklenburg County, NC** groupBy + excise-stamp sales | County assessor/GIS | Gives NC a valuation gate to set against Wake's asset depth ([`north-carolina.md`](states/coverage/north-carolina.md)) | Crosswalk + screen |
| 10 | **LA Tax Commission** statewide roll (bulk availability unverified) | latax.state.la.us | Lifts every rural parish at once ([`louisiana.md`](states/coverage/louisiana.md)) | Probe first — availability itself is the finding |

Ordering rationale: #1–2 are the two single-probe unlocks (a new market; 67 counties);
#3 completes an anchor market's metro; everything after deepens what already ships.

## After each probe, in this order

1. Append the findings — including negatives — to [`PULL_RECIPE.md`](PULL_RECIPE.md)'s
   additions log with the date.
2. Advance the state's rows in [`states/coverage/`](states/coverage/README.md)
   (`named` → `pulled`, or `blocked` with the reason).
3. If a use-class vocabulary came back: add the crosswalk entry **from the groupBy
   result** (counts + date), run `python3 crosswalk/validate_usecodes.py`.
4. Run `python3 scripts/class_screen.py` on the transferred rows — its unmatched-codes
   list is the research queue; never map a code by guess.
5. Feed the national index: `python3 scripts/top_screen.py --out data/top_index.json
   <rows>:<jid> ...` — every new pull deepens the same searchable top-properties index
   (`pages/top-properties.html`), ranked only on the crosswalk's declared value fields.
6. Commit with the gates green (`validate.py`, `check_links.py`, the crosswalk gate).

## When the session also holds the data tree

Two verifications are queued behind any machine that can build:

- **Fleet sweep after the shell change** — `src/app.js` now restores the map footer from
  a captured value; the sweep's zero-page-errors assertion across all twelve editions
  covers it.
- **`build_state.py` parity** — build `nola`/`bay` via both the original builders and
  the spec builder and diff the outputs; on byte parity the originals can be retired
  (roadmap v2.0).
