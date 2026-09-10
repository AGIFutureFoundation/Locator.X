# North Carolina — record coverage (graduated corridor findings)

*Status vocabulary: [`README.md`](README.md). State process context:
[the NC entry](../southeast.md#north-carolina). Everything below is **measured** — pulled
over the browser-pane route and documented in [`PULL_RECIPE.md`](../../PULL_RECIPE.md)
(additions of 2026-09-04/05); each verdict was verified by a count or a groupBy against
the live endpoint, not inferred.*

## Wake County

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| L/A | Parcels, values, use classes | Full county pulled; `TYPE_USE_DECODE` carries a 110-value vocabulary (classes in the [crosswalk](../../../crosswalk/usecodes.json)); `LAND_CLASS_DECODE` has 24 values, not the 18 earlier assumed | pulled 2026-09-05 |
| A | Unit counts | **Trap:** `TOTUNITS` is a billing/appraisal unit count of any kind — county maximums are an office tower (1,902), a mini-warehouse (1,360), a municipal building and a college. Real only when ANDed with a residential decode | pulled 2026-09-05 |
| A | Floor area / beds / baths | `HEATEDAREA` is the only floor area; **no bedroom or bathroom field exists** | pulled 2026-09-05 |
| A | Values on condo/HOA shells | `TOTAL_VALUE_ASSD` is 0 on HOA and condo-complex shell parcels — value sits on the unit rows | pulled 2026-09-05 |
| — | Query mechanics | The MapServer returns **NULL for every statistic**; the FeatureServer sibling returns correct counts (cross-checked against 24 per-value count calls, exact match) | pulled 2026-09-05 |

Class identifiability: apartments 5+ (1,213 across GRDN/ELEV/THSE/MUTFAM), small MF 2–4
(3,125), lodging (the undocumented `H/M-*` family, 164) — the strongest measured NC county
in the [asset-class matrix](../../asset-classes/README.md#the-region-matrix--measured-not-assumed).

## Guilford County

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| L/O | Parcel keys | **`PIN` is not unique** — the same PIN appears on separate lots in one subdivision at different addresses and centroids; never key on PIN alone | pulled 2026-09-04 |
| A | Apartment identification | `LAND_CLASS` is plain English and reliable (`APART`) | pulled 2026-09-04 |
| A | Unit counts | **Trap:** `TOTAL_UNITS` is a complex-level count repeated onto every row and *absent on the largest apartments* (a $76M 2024-built `APART` parcel carries null). Rank on `TOTAL_PROP_VALUE` + `ACREAGE` instead | pulled 2026-09-04 |
| A | Apartment floor area | `APT_SC_SQRFT` is in the schema and **100% NULL** over all 223,275 parcels — do not plan around it | pulled 2026-09-04 |

## Chatham County

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| L | Zoning bands | **Trap:** pattern-defined band sets are not automatically disjoint — `ZONE_DESC` strings like "Planned Unit Development Institutional" match two band patterns, putting 407 PINs on two rows with different labels. Treat the band column as multi-label | pulled 2026-09-04 |

## What would move the grade

Mecklenburg (Charlotte) is the missing metro — `named` only; a groupBy probe there plus
the sales file (NC discloses prices via excise stamps) would give the state a full
valuation gate to set against Wake's asset-side depth.
