# Ohio — record coverage (graduated corridor findings)

*Status vocabulary: [`README.md`](README.md). State process context:
[the Ohio entry](../midwest.md#ohio). Measured over the browser-pane route,
[`PULL_RECIPE.md`](../../PULL_RECIPE.md) additions 2026-09-04/05. The statewide constant:
county land-use codes follow **OAC Rule 5703-25-10** (the DTE codes in the
[crosswalk](../../../crosswalk/usecodes.json)) — but only the round codes; county
single-digit variants are not in the state rule and are banded by prefix, labeled
not-use-verified.*

## Franklin County (Columbus)

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| A | Use classes | `CLASSCD` is the Ohio DTE code, same numbering as Marion IN; prefix filtering (`LIKE '4%'`) is cleaner than the description-string list | pulled 2026-09-04 |
| A | Apartment floor area | **`RESFLRAREA` and `RESYRBLT` are single-family-only cards** — 0% and 5% populated across 12,397 apartment/commercial rows. `BLDGAREA` (74%) is the only working floor area, and **no year-built exists for an apartment parcel** in this layer | pulled 2026-09-04 |
| A | The condo flood | "CONDO 40+ RENTAL UNITS" rows are **individually-owned condo units** — 58,563 rows, max $794,500, zero above $2M. Excluded from complex screens deliberately | pulled 2026-09-04 |
| L | Geometry | `X_COORD`/`Y_COORD` are Ohio State Plane feet, not lat/lon — request geometry | pulled 2026-09-04 |

## Mahoning County (Youngstown)

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| O (outlook) | Sales | `SALEDATE` is 100% populated but most rows carry `SALEAMOUNT=0`; every **priced** sale is dated (71,769 = 71,769, zero price-without-date). 355 of 35,292 pulled rows carry implausible dates (1889…9999), only one of them priced | pulled 2026-09-05 |
| A | Use classes | Carries many single-digit DTE variants (404–409, 413, 414, 417, 501…) that the state rule does not define — banded by prefix only | pulled 2026-09-05 |

## Trumbull County

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| All | Any record at all | **blocked** — `webgis.`, `gis.` and `property.co.trumbull.oh.us` all refused by the browser pane; the whole domain, not just the expired-cert host | blocked 2026-09-05 |

## What would move the grade

Cuyahoga and Hamilton auditors publish bulk downloads (statutory duty — the
[state guide](../midwest.md#ohio) flags them): one bulk pull each would put Ohio's three
big metros on measured footing and let the DTE crosswalk rows carry per-county counts.
