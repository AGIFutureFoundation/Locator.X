# Arizona — record coverage (graduated corridor findings)

*Status vocabulary: [`README.md`](README.md). State process context:
[the Arizona entry](../mountain-west.md#arizona). Measured over the browser-pane route,
[`PULL_RECIPE.md`](../../PULL_RECIPE.md) additions 2026-09-04.*

## Maricopa County (Phoenix)

| Gate | Question | Verdict | Status |
|------|----------|---------|--------|
| — | Endpoint access | The MapServer's Services Directory is disabled — the HTML page renders an error but is still same-origin, so `/query` and `?f=json` both work from it | pulled 2026-09-04 |
| A | Lodging classes | Verified against the ADOR manual: hotels are **`04-1` only** (4th digit 0/1/2/8 = default / 2–4 stories / 5+ stories); `04-2` is *not* a separate hotel class — a "041x/042x" filter happens to work for the wrong reason. Motels `05-x` (05-1 / 05-2 with restaurant / 05-3 B&B); **resorts `06-x` — 503 parcels including the band's single highest value at $280M** ([crosswalk](../../../crosswalk/usecodes.json)) | pulled 2026-09-04 |
| A | Values | **`FCV_CUR` is a string with embedded commas and leading spaces** (`"  39,490,000"`). Server-side `CAST(... AS FLOAT)` verified correct (2,712 both ways) — but the safer pattern is keeping the raw string and parsing a numeric beside it | pulled 2026-09-04 |
| A | Floor area / year | `LIVING_SPACE` is 0% populated (31 of 13,732); `CONST_YEAR` is 100%; `SALE_PRICE` 50% — the layer is far richer than the earlier "coordinates + FCV" verdict | pulled 2026-09-04 |

Maricopa is the corridor set's lodging anchor: the resort tier is identifiable, counted,
and value-topped — the natural first market for the hospitality end of the
[asset-class layer](../../asset-classes/README.md).

## What would move the grade

Pima (Tucson) is `named`; its portal quality matches Maricopa's
([state guide](../mountain-west.md#arizona)). The February lien auctions are online in
most counties — the distress calendar is pullable the same way once a session has egress.
