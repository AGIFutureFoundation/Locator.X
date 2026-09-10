# Utah — record coverage (graduated corridor findings)

*Status vocabulary: [`README.md`](README.md). State process context:
[the Utah entry](../mountain-west.md#utah). Measured over the browser-pane route,
[`PULL_RECIPE.md`](../../PULL_RECIPE.md) additions 2026-09-05.*

## Utah County (Provo–Orem)

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| A | Use classes | `PROP_TYPE_DESCR` carries 37 values including the three that matter most and were previously missed: `LODGING` (126), `STUDENT HOUSING` (114), `MULTIPLE UNIT MIX` (37), plus `APARTMENTS` (718), `MOBILE HOME PARK` (57) — all in the [crosswalk](../../../crosswalk/usecodes.json) | pulled 2026-09-05 |
| A | Unit counts | **Trust matrix, not a yes/no:** `TOTAL_UNIT_COUNT` is trustworthy on APARTMENTS / STUDENT HOUSING / SUBSIDIZE HOUSING (max 478, median 12); **not a room count on LODGING** (one parcel shows 3,525 "units" in 83,568 sq ft); on CONDO rows it is the complex count repeated per unit | pulled 2026-09-05 |
| A | Year built | `YEARBLT_RES` is worthless for apartments (2.5% populated); use `YEAR_BUILT_1` (94%) for anything non-single-family | pulled 2026-09-05 |
| A | Roll vintage | `ASMT_YEAR` is **2027** on 36,333 of 36,350 rows — the roll is the 2027 tax year; date any value evidence accordingly | pulled 2026-09-05 |

The student-housing identifiability here is the strongest measured anywhere in the
corridor set — the BYU/UVU ring is the natural second market for the `launi` campus-ring
method ([asset-class matrix](../../asset-classes/README.md)).

## What would move the grade

Salt Lake County is `named` (strong portal, UGRC statewide parcels free —
[state guide](../mountain-west.md#utah)); a groupBy there completes the Wasatch Front.
Utah's terminal May tax deeds mean any distress screen built on this record clears title
day one — worth the probe.
