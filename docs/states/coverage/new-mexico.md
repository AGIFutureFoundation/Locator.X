# New Mexico — record coverage (graduated corridor findings)

*Status vocabulary: [`README.md`](README.md). State process context:
[the New Mexico entry](../mountain-west.md#new-mexico). Measured over the browser-pane
route, [`PULL_RECIPE.md`](../../PULL_RECIPE.md) additions 2026-09-04/05. The state
constant: **non-disclosure** — no sale price and no sale date on any layer probed; value
evidence is assessment-only and the evidence grade must say so.*

## Bernalillo County (Albuquerque)

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| — | The right server | **The county's own ArcGIS server is good and the earlier write-off was wrong-server error:** `assessormap.bernco.gov` Assessor_Parcels_Public — 257,283 parcels, 79 fields, no token, maxRecordCount 2000. The previous "no value, no year built, no use description" conclusion came from the state OSE layer | pulled 2026-09-05 |
| A | Values | `LANDVALUE` / `IMPTVALUE` / `TOTVALUE` / `NETTAXABLE` 99.9% populated | pulled 2026-09-05 |
| A | Use classes | `LUC_MSG`: a 152-value plain-English vocabulary, 100% populated — the apartment/hotel/MHP rows are in the [crosswalk](../../../crosswalk/usecodes.json) with counts (`O4U` = over 4 units, `U4U` = under) | pulled 2026-09-05 |
| A | Year built | `DWEL_YRBLT` (208,804 rows) and `COM_YRBLT` (12,325) both live; `C_DESCR` gives commercial class on 12,325 | pulled 2026-09-05 |
| O (outlook) | Sale prices | **no public record** — non-disclosure; nothing on this or any sibling layer | pulled 2026-09-05 |

Sibling worth knowing: `Enterprise_Assessment_And_Tax/Public_Access_Parcel_Data_EAT`
(256,034 rows, 53 fields — values but no use class); the `Commercial_Sales` folder is
empty of services.

## Sandoval County (Rio Rancho)

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| A | Use classes | **No usable use class at all** on the state OSE layer 23: `LandUseDescription` is the statutory valuation class only (0100/0200 res/non-res land), `CountyImprovementDescription` 100% empty, `StructureType` 100% empty, `StructureCount` 0%. **No apartment can be identified** — the ceiling is real; say so, never guess | pulled 2026-09-05 |
| L | Geometry | The OSE statewide 84-field schema has **no lat/lon columns** (a query on `latitude` 400s) — request geometry | pulled 2026-09-05 |

## What would move the grade

The lesson generalizes: **check for a county-run server before trusting the state
aggregate** — Bernalillo's reversal came from exactly that. Doña Ana (Las Cruces) and
Santa Fe are `named`; probe their county servers first, the OSE layer second.
