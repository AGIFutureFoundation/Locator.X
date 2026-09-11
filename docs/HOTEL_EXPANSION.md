# Lodging expansion — what the record can carry, and where to pull next

> **Generated** by `scripts/hotel_candidates.py` from `market/*.json` and
> `crosswalk/usecodes.json`. Do not edit; rerun after a measurement lands.

This plan answers three questions with measurements rather than intentions: what it
costs to grow an edition, what lodging stock the record already holds, and which
areas are worth a pull. **No property rows were generated anywhere in this work.**
Adding records is a data-machine job against the public record; a row this platform
invented would be indistinguishable from a row it measured, which is the one failure
it cannot recover from.

## 1. What growth actually costs — measured 2026-09-11

Four shipped editions were driven in headless Chromium at their real record counts.

| Edition | Records | Page bytes | Load | JS heap | Full scan | Sort |
|---|---:|---:|---:|---:|---:|---:|
| `nola` | 87,578 | 5.6 MB | 19.8 s | **347 MB** | 10.6 ms | 19.0 ms |
| `nola-classic` | 125,803 | 4.9 MB | 16.7 s | **415 MB** | 5.5 ms | 21.5 ms |
| `bay` | 182,124 | 10.9 MB | 18.0 s | **595 MB** | 15.7 ms | 172.2 ms |
| `uscorridor` | 354,260 | 15.3 MB | 26.1 s | **1020 MB** | 28.9 ms | 157.0 ms |

**The ceiling is memory, not bandwidth.** JS heap, not page weight. The largest shipped edition already holds 1.02 GB of heap at 354,260 records; page bytes at the same point are only 16 MB. Adding records costs roughly 54 bytes on the wire and 3 KB in memory, so memory runs out about fifty times sooner than bandwidth does.

Per 50,000 records added to an edition: **+2.57 MB** on the wire, **+~150 MB** of JS
heap, and roughly +2.5 s of load. So the request "50,000 more per area" is cheap in
bytes and expensive in memory:

| Edition | Today | With +50k | Projected heap |
|---|---:|---:|---:|
| `uscorridor` | 354,260 rec / 1020 MB heap | 404,260 rec | **1170 MB** ⚠️ |
| `bay` | 182,124 rec / 595 MB heap | 232,124 rec | **745 MB** |
| `nola-classic` | 125,803 rec / 415 MB heap | 175,803 rec | **565 MB** |
| `nola` | 87,578 rec / 347 MB heap | 137,578 rec | **497 MB** |

`uscorridor` is already at 1.00 GB of heap at 354,260 records. Adding 50,000 there takes it past
1.1 GB, which no phone survives and many laptops will not either. **Growth past this
point is an architecture change, not a bigger file** — the single-file edition holds
every record in memory at once by design, and that design has a record ceiling around
300–400k. The honest options, in order of how much they change what an edition *is*:

1. **Split by area, not by size.** A metro-scoped edition of 100–150k records stays
   under ~450 MB and keeps the single-file, network-off property intact. This is the
   cheapest path and needs no engine change — `build_state.py` already builds per-spec.
2. **Class-scoped editions.** A lodging-only edition of the same footprint carries a
   few thousand records, not a few hundred thousand (§2), so an entire national hotel
   edition fits inside one metro edition's budget.
3. **Defer the record store.** Keep the packed payload but hydrate lazily per viewport
   or per query. This breaks the "everything is in memory" assumption the ranking and
   underwriting engines are written against, so it is a real project, not a flag.

Option 2 is also the one that serves a hotel focus best, which is convenient rather
than a coincidence: lodging is a thin class in a thick record.

## 2. The lodging stock the record already holds

Counted by each record's own `kind` field — not a keyword sweep over free text.
(An earlier pass that also searched the source field over-counted `uscorridor` by more
than tenfold, 31,117 against 2,955; source strings are not use classes.)

| Edition | Lodging records | With a value | With units | Leading places |
|---|---:|---:|---:|---|
| `uscorridor` | **2,955** | 2,955 | 2,955 | Phoenix 557, Paradise Valley 460, Syracuse 318 |
| `bay` | **1,044** | 1,043 | 1,044 | San Francisco 633, Oakland 89, Concord 28 |
| `nola` | **322** | 322 | 322 | New Orleans 321, Jefferson Parish 1 |
| `nola-classic` | **122** | — | — | — |

**4,443 lodging records across the four measured editions**, and on the three that report
it, essentially every one carries both a value and a unit count — which is what the
per-class underwriting worksheet needs to run a hotel case. The vocabularies differ
sharply by jurisdiction and that difference is itself the finding: New Orleans records
a single flat `Hotel / lodging`, the Bay separates `Hotel` from `Motel` from
`SRO / residential hotel`, and the corridor counties carry six distinct spellings
including `Com Hotels` and `Inn, lodge, rooming or fraternity house`. A national
lodging screen cannot be a string match; it has to go through the crosswalk.

## 3. The gap that blocks a hotel screen today

The crosswalk maps a lodging class for **6 jurisdictions**:

| Jurisdiction | Lodging codes | Measured parcels | Value field | Verified |
|---|---:|---:|---|---|
| Maricopa County, AZ | 5 | 503 | `FCV_CUR` | 2026-09-04 |
| Wake County, NC | 5 | 164 | `TOTAL_VALUE_ASSD` | 2026-09-05 |
| Bernalillo County, NM | 2 | 162 | `TOTVALUE` | 2026-09-05 |
| Utah County, UT | 1 | 126 | — | 2026-09-05 |
| Ohio (statewide DTE codes; verified on Franklin and Mahoning) | 2 | — | — | 2026-09-05 |
| Florida (statewide DOR NAL use codes) | 1 | — | `JV` | transcribed, unverified |

**Neither Orleans Parish nor any Bay Area county is among them** — and those two hold
1,366 of the 4,443 measured lodging records above. The anchor markets carry the stock and
the crosswalk cannot yet name it. That is the first thing to fix, and it is a small
fix: a measured `groupBy` on each jurisdiction's use-code field, which is one probe
per county, not a pull of 50,000 rows.

## 4. The candidate areas — 96, in evidence tiers

**The ask was 100 areas; the measured sets yield 96.** The pool is every county the
ranking covers, every county a corridor area names, and every jurisdiction the
crosswalk maps — 76, 14 and 6 of them. Four more could be reached by widening a
threshold, but not by naming four areas nobody has measured, so the list stops where
the evidence does.

Ordered by what is known, not by what is hoped. Tier A is ready to screen; tier B has
proven stock and a missing vocabulary; tier C has a measured market and unknown
lodging. **Tier C's ranking signal is residential** — the value and rent indices
behind the submarket ranking measure homes, not hotels, so a high rank there is a
reason to look, never evidence of a hotel market.

### Tier A — the record publishes a lodging class (6)

Screenable now. Probe: run `scripts/class_screen.py` and confirm the counts still hold.

- **Maricopa County, AZ** — 5 lodging codes, 503 parcels measured
- **Wake County, NC** — 5 lodging codes, 164 parcels measured
- **Bernalillo County, NM** — 2 lodging codes, 162 parcels measured
- **Utah County, UT** — 1 lodging code, 126 parcels measured
- **Ohio (statewide DTE codes; verified on Franklin and Mahoning)** — 2 lodging codes, no measured count yet
- **Florida (statewide DOR NAL use codes)** — 1 lodging code, no measured count yet

### Tier B — lodging stock proven, vocabulary unmapped (14)

A shipped edition already holds lodging records here. Probe: one `groupBy` on the
jurisdiction's use-code field to map its lodging vocabulary into the crosswalk.

| Place | Lodging records held | From edition |
|---|---:|---|
| San Francisco | 633 | `bay` |
| Phoenix | 557 | `uscorridor` |
| Paradise Valley | 460 | `uscorridor` |
| New Orleans | 321 | `nola` |
| Syracuse | 318 | `uscorridor` |
| Indianapolis | 231 | `uscorridor` |
| Mesa | 159 | `uscorridor` |
| City Of Columbus | 129 | `uscorridor` |
| Oakland | 89 | `bay` |
| Concord | 28 | `bay` |
| Hayward | 22 | `bay` |
| Fremont | 21 | `bay` |
| Livermore | 20 | `bay` |
| Jefferson Parish | 1 | `nola` |

### Tier C — market measured, lodging unknown (76)

No lodging evidence either way. Probe: check whether the county assessor publishes a
use-code field at all, then a `groupBy` if it does; convert to tier A, or to
`blocked` / `no public record` with the reason dated.

| County / area | State | Metro or corridor | What is measured |
|---|---|---|---|
| Milwaukee County | WI | Milwaukee-Waukesha, WI | 10 ranked submarkets, best national rank #1 |
| Caddo Parish | LA | Shreveport-Bossier City, LA | 2 ranked submarkets, best national rank #2 |
| Alameda County | CA | San Francisco-Oakland-Berkeley, CA | 6 ranked submarkets, best national rank #3 |
| Marion County | IN | Indianapolis-Carmel-Anderson, IN | 16 ranked submarkets, best national rank #5 |
| Franklin County | OH | Columbus, OH | 9 ranked submarkets, best national rank #8 |
| San Francisco County | CA | San Francisco-Oakland-Berkeley, CA | 7 ranked submarkets, best national rank #10 |
| Kenosha County | WI | Chicago-Naperville-Elgin, IL-IN-WI | 2 ranked submarkets, best national rank #11 |
| Santa Clara County | CA | San Jose-Sunnyvale-Santa Clara, CA | 4 ranked submarkets, best national rank #13 |
| Washoe County | NV | Reno, NV | 8 ranked submarkets, best national rank #17 |
| Orleans Parish | LA | New Orleans-Metairie, LA | 7 ranked submarkets, best national rank #20 |
| Lyon County | NV | Fernley, NV | 1 ranked submarket, best national rank #24 |
| Sandoval County | NM | Albuquerque, NM | 2 ranked submarkets, best national rank #29 |
| Contra Costa County | CA | San Francisco-Oakland-Berkeley, CA | 4 ranked submarkets, best national rank #32 |
| Guilford County | NC | Greensboro-High Point, NC | 5 ranked submarkets, best national rank #33 |
| Lafayette Parish | LA | Lafayette, LA | 2 ranked submarkets, best national rank #36 |
| Albany County | NY | Albany-Schenectady-Troy, NY | 2 ranked submarkets, best national rank #40 |
| Solano County | CA | Vallejo, CA | 5 ranked submarkets, best national rank #46 |
| San Mateo County | CA | San Francisco-Oakland-Berkeley, CA | 3 ranked submarkets, best national rank #49 |
| Pinal County | AZ | Phoenix-Mesa-Chandler, AZ | 3 ranked submarkets, best national rank #64 |
| Hendricks County | IN | Indianapolis-Carmel-Anderson, IN | 1 ranked submarket, best national rank #70 |
| Sonoma County | CA | Santa Rosa-Petaluma, CA | 7 ranked submarkets, best national rank #75 |
| Saint Joseph County | IN | South Bend-Mishawaka, IN-MI | 1 ranked submarket, best national rank #78 |
| Utah County | UT | Provo-Orem, UT | 2 ranked submarkets, best national rank #88 |
| Douglas County | GA | Atlanta-Sandy Springs-Alpharetta, GA | 2 ranked submarkets, best national rank #90 |
| Rensselaer County | NY | Albany-Schenectady-Troy, NY | 1 ranked submarket, best national rank #92 |
| Licking County | OH | Columbus, OH | 1 ranked submarket, best national rank #95 |
| Forsyth County | NC | Winston-Salem, NC | 1 ranked submarket, best national rank #98 |
| Bryan County | GA | Savannah, GA | 1 ranked submarket, best national rank #107 |
| Maricopa County | AZ | Phoenix-Mesa-Chandler, AZ | 5 ranked submarkets, best national rank #112 |
| Wake County | NC | Raleigh-Cary, NC | 1 ranked submarket, best national rank #121 |
| Tippecanoe County | IN | Lafayette-West Lafayette, IN | 1 ranked submarket, best national rank #124 |
| Bernalillo County | NM | Albuquerque, NM | 2 ranked submarkets, best national rank #130 |
| Johnston County | NC | Raleigh-Cary, NC | 1 ranked submarket, best national rank #135 |
| Benton County | IN | Lafayette-West Lafayette, IN | named by a corridor area with published figures |
| Boone County | IN | Indianapolis-Carmel-Greenwood, IN | named by a corridor area with published figures |
| Bossier Parish | LA | Shreveport-Bossier City, LA (MSA) | named by a corridor area with published figures |
| Brown County | IN | Indianapolis-Carmel-Greenwood, IN | named by a corridor area with published figures |
| Calcasieu Parish | LA | Lake Charles, LA (MSA) | named by a corridor area with published figures |
| Carroll County | IN | Lafayette-West Lafayette, IN | named by a corridor area with published figures |
| Cass County, MI | IN | South Bend-Mishawaka, IN-MI | named by a corridor area with published figures |
| Chatham County | GA | Savannah, GA | named by a corridor area with published figures |
| Effingham County | GA | Savannah, GA | named by a corridor area with published figures |
| Franklin County | NC | Raleigh-Cary, NC | named by a corridor area with published figures |
| Hamilton County | IN | Indianapolis-Carmel-Greenwood, IN | named by a corridor area with published figures |
| Hancock County | IN | Indianapolis-Carmel-Greenwood, IN | named by a corridor area with published figures |
| Johnson County | IN | Indianapolis-Carmel-Greenwood, IN | named by a corridor area with published figures |
| Juab County | UT | Provo-Orem-Lehi, UT | named by a corridor area with published figures |
| Lafourche Parish | LA | Thibodaux, LA (Micropolitan) | named by a corridor area with published figures |
| Lincoln Parish | LA | Ruston, LA (Micropolitan) | named by a corridor area with published figures |
| Madison County | NY | Syracuse, NY | named by a corridor area with published figures |
| Madison County | IN | Indianapolis-Carmel-Greenwood, IN | named by a corridor area with published figures |
| Mahoning County | OH | Youngstown-Warren, OH | named by a corridor area with published figures |
| Morgan County | IN | Indianapolis-Carmel-Greenwood, IN | named by a corridor area with published figures |
| Natchitoches Parish | LA | Natchitoches, LA (Micropolitan) | named by a corridor area with published figures |
| Onondaga County | NY | Syracuse, NY | named by a corridor area with published figures |
| Oswego County | NY | Syracuse, NY | named by a corridor area with published figures |
| Ouachita Parish | LA | Monroe, LA (MSA) | named by a corridor area with published figures |
| Ozaukee County | WI | Milwaukee-Waukesha, WI + Racine-Mount Pleasant, WI | named by a corridor area with published figures |
| Pickaway County | OH | Columbus, OH | named by a corridor area with published figures |
| Putnam County | IN | Indianapolis-Carmel-Greenwood, IN | named by a corridor area with published figures |
| Racine County | WI | Milwaukee-Waukesha, WI + Racine-Mount Pleasant, WI | named by a corridor area with published figures |
| Randolph County | NC | Greensboro-High Point, NC | named by a corridor area with published figures |
| Rapides Parish | LA | Alexandria, LA (MSA) | named by a corridor area with published figures |
| Rockingham County | NC | Greensboro-High Point, NC | named by a corridor area with published figures |
| Saratoga County | NY | Albany-Schenectady-Troy, NY | named by a corridor area with published figures |
| Schenectady County | NY | Albany-Schenectady-Troy, NY | named by a corridor area with published figures |
| Schoharie County | NY | Albany-Schenectady-Troy, NY | named by a corridor area with published figures |
| Shelby County | IN | Indianapolis-Carmel-Greenwood, IN | named by a corridor area with published figures |
| St. Joseph County, IN | IN | South Bend-Mishawaka, IN-MI | named by a corridor area with published figures |
| Storey County | NV | Reno, NV | named by a corridor area with published figures |
| Tangipahoa Parish | LA | Hammond, LA (MSA) | named by a corridor area with published figures |
| Torrance County | NM | Albuquerque, NM | named by a corridor area with published figures |
| Trumbull County | OH | Youngstown-Warren, OH | named by a corridor area with published figures |
| Valencia County | NM | Albuquerque, NM | named by a corridor area with published figures |
| Washington County | WI | Milwaukee-Waukesha, WI + Racine-Mount Pleasant, WI | named by a corridor area with published figures |
| Waukesha County | WI | Milwaukee-Waukesha, WI + Racine-Mount Pleasant, WI | named by a corridor area with published figures |

## 5. What the data machine runs

None of this container's work can add a record: there is no data tree here and no
egress to a county or open-data host (all four probed hosts returned `000` on
2026-09-11). The sequence below runs where the data lives.

1. **Map the anchor markets' lodging vocabulary** (§3) — one `groupBy` per
   jurisdiction on Orleans and the Bay Area counties, appended to
   `crosswalk/usecodes.json` with source and date. Until this lands, a national
   lodging screen cannot include the two markets that hold the most lodging stock.
2. **Work tier B, then tier C**, in the order printed above, recording each result
   in `docs/states/coverage/` with an honest status — `pulled`, `blocked` or
   `no public record` — never a silent skip.
3. **Grow editions by splitting, not by swelling** (§1). A metro-scoped or
   lodging-scoped spec in `build_state.py` stays inside the memory budget; adding
   50,000 rows to `uscorridor` does not.
4. **Publish** with `bash scripts/publish_editions.sh`, which hash-verifies the set
   into the editions channel.

Every figure on this page is measured and dated. Where something is unknown it is
marked unknown and carries the probe that would settle it — which is the only
honest form a plan can take before the data is in hand.
