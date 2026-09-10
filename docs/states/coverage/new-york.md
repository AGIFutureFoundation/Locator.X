# New York — record coverage (graduated corridor findings)

*Status vocabulary: [`README.md`](README.md). State process context:
[the New York entry](../northeast.md#new-york). Measured over the browser-pane route,
[`PULL_RECIPE.md`](../../PULL_RECIPE.md) additions 2026-09-04. Upstate runs on the NYS
Tax Parcels service; NYC's ACRIS/PLUTO universe is a separate, richer system and stays
`named` here.*

## Onondaga County (Syracuse) — via NYS Tax Parcels

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| L/O | County selection | On `NYS_Tax_Parcels_Public` **FeatureServer/1**, `COUNTY_NAME` is reliable: exactly congruent with the `SWIS LIKE '31%'` workaround (181,909 parcels both ways, zero discrepancy). The SWIS-prefix trick is only needed on the MapServer sibling | pulled 2026-09-04 |
| O (own.) | Parcel keys | **`PRINT_KEY` is unique only within a municipality** — key Onondaga/Albany parcels on `(PRINT_KEY, CITYTOWN_NAME)`, never PRINT_KEY alone | pulled 2026-09-04 |
| A | Multifamily form | `USED_AS_DESC` is a plain-English use string ("Highrise apt", "Garden apt", "Walk-up apt", "Room/dorm") — **the best multifamily form descriptor in the corridor catalogue** ([crosswalk](../../../crosswalk/usecodes.json)) | pulled 2026-09-04 |
| A | Floor vs lot area | **Trap:** `SQ_FT` is LOT square footage. `GFA` is gross floor area, 89% populated in the 4xx band — the earlier "SQ_FT / GFA" phrasing conflated them | pulled 2026-09-04 |
| — | Query mechanics | `groupByFieldsForStatistics` returns null counts on this service — fall back to one `returnCountOnly` call per group; `LENGTH()` in a `where` 400s — build an explicit `IN (...)` list instead | pulled 2026-09-04 |

## New York City

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| All | ACRIS + DOF roll + PLUTO | Among the richest open property data anywhere ([state guide](../northeast.md#new-york)) — but not yet probed by this pipeline | named |

## What would move the grade

PLUTO is a documented bulk download the same shape as Florida's DOR rolls — one file,
every Manhattan-to-Staten-Island parcel. It is the single biggest `named`-to-`pulled`
jump available in the Northeast, and the rent-regulation overlay (the state guide's
underwriting event) joins to it by BBL.
