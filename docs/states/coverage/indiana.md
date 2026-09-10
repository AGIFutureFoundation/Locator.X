# Indiana — record coverage (graduated corridor findings)

*Status vocabulary: [`README.md`](README.md). State process context:
[the Indiana entry](../midwest.md#indiana). Measured over the browser-pane route,
[`PULL_RECIPE.md`](../../PULL_RECIPE.md) additions 2026-09-04/05.*

## Marion County (Indianapolis)

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| A | Building attributes | **The layer's ceiling is low and real:** no building area, no year built, no bedrooms and **no sale price at all**. `ESTSQFT` is lot area (trap confirmed); `ACREAGE` is a string. The only completeness fields are acreage and assessed values | pulled 2026-09-05 |
| A | Use classes | Uses the same DTE-style 401/402/403/410/411/419 numbering as Ohio ([crosswalk](../../../crosswalk/usecodes.json) `ohio_dte` row applies, same caveats) | pulled 2026-09-05 |
| L | Geometry duplication | Multi-polygon confirmed: 3,861 polygon rows collapse to 3,681 parcels on `STATEPARCELNUMBER` — de-duplicate before summing anything | pulled 2026-09-05 |
| — | Query mechanics | The Indianapolis lesson, now a hard rule: **never conclude a field is unpopulated from a timeout.** Four prior attempts wrongly wrote off a field that async-launch-and-poll proved 100% populated | pulled 2026-09-04 |

## Tippecanoe County (Lafayette / Purdue ring)

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| O (outlook) | Sales recency | **Trap:** the layer named "Sales Current Year" is 2020; the whole available sales history spans 2017–2020, six years stale. `SoldDate` 100% populated (16,574), `SoldPrice` 95.5% — but stale | pulled 2026-09-05 |
| O (outlook) | Sale prices | **Document-price trap:** `SoldPrice` repeats the full deed consideration onto every parcel of a multi-parcel deed — one $48.375M portfolio deed appears on many rows | pulled 2026-09-05 |
| O (own.) | Transfer currency | `mtransferDate` IS current (max 2025-11-03) even though the sales layers stop in 2020 — ownership moves are visible, prices are not | pulled 2026-09-05 |
| L/O | Keys | Join is `Sales.ParcelNumber` == `STKEY` == `StKeyFull` with punctuation stripped (verified to exactly 1 parcel). 40,634 polygons collapse to 30,852 distinct keys; `PIN` null on 7,431 parcels, `StKeyFull` on 515 | pulled 2026-09-05 |
| A | Class vocabularies | The sales layers use a **different** `mpropertyclass` vocabulary from the parcel layer ("Res-1-Family 0 - 9.99 acres" vs "1 Family Dwell - Platted Lot") — never join classes across the two | pulled 2026-09-05 |

## What would move the grade

Indiana discloses nothing statewide on price beyond county practice; the Beacon-pattern
counties around Indianapolis are `named`. The state's cheap entry (free parcels, no
transfer tax — [state guide](../midwest.md#indiana)) makes it a strong screen-wholesale
candidate the moment two or three more counties get the Wake-style groupBy treatment.
