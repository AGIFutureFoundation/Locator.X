# market — the measured market layer

The sourced data behind the public site's market pages. Same posture as
[`crosswalk/usecodes.json`](../crosswalk/usecodes.json): committed measured data with its
provenance attached, gated by a validator that raises rather than warns, and rendered
by a script rather than hand-maintained as HTML.

**These files are extracted, not authored.** Every row came out of a live published
Locator.X edition (or the published belts analysis) on 2026-09-11 by fetching the
artifact and decompressing the payload it ships. Nothing was re-keyed, recomputed or
filled in. **Re-extract rather than edit** — a hand-edit here is a figure with no
source, which is the one thing this layer exists to prevent.

| File | What it holds | Extracted from |
|---|---|---|
| `corridors.json` | 24 metro/micropolitan corridor areas — announced jobs, permits (TTM), population, each with its as-of date and source; plus 20 dropped areas and 37 caveats | `usnew5` (`window.LXCORRIDORS`) |
| `projects.json` | 73 announced projects — capital, headcount, status, the announcement URL, and (where the record carries one) a `jobsBasis` line naming whose figure the headcount is | `usnew5` (`window.LXCORP`) |
| `campuses.json` | 152 campuses — enrolment, the term it was published for, kind, coordinates, source | `launi` (`window.LXCAMPUS`) |
| `belts.json` | The High-Potential Belts ranking — 464 ranked submarkets, both published views, the open weights, and the coverage statement | the published belts analysis |
| `editions.json` | The 12 shipped editions — sha256, byte size, URL, and each one's record-count status | the live artifact set (`docs/PUBLISH_MAP.md`) |

## The gate

```bash
python3 market/validate_market.py
```

Eight rules, each preventing a specific way this data could start lying. Three are
worth knowing about because they encode judgements rather than schema:

- **A figure's absence is a fact, and which fact depends on the field.** `permits` and
  `pop` come from external published series, so absent must mean absent and a zero
  would be a fabrication — they are required to be positive when present. `jobs` and
  `records` are counts over sets this platform holds, so `0` ("this catalogue holds
  nothing here") and negative ("a closure took more jobs than the announcements
  brought") are real measured values. Natchitoches carries `jobs: -450` and the page
  draws it as a net loss.
- **Enrolment may be unknown.** Four campuses publish no enrolment figure. They are
  carried with `null`, listed on the page as *not published*, counted as campuses and
  excluded from every total — with the exclusion stated next to the total. A `0` in
  that field fails the gate, because a zero wearing a count's clothes is worse than a
  blank.
- **The cross-file rule.** Every edition's measured record count must appear in
  [`docs/PUBLISH_MAP.md`](../docs/PUBLISH_MAP.md). The data file and the documented
  verification cannot drift apart silently — if one changes, the gate fails until the
  other agrees.

The gate also *reports* the honest asymmetries rather than hiding or failing on them:
29 of 44 announced headcounts carry an explicit basis line, and the renderer marks the
other 15 as *no basis line in the record — read the headcount as the announcement's
own, unconfirmed* rather than leaving a dash the reader would take for "none".

## The pages

```bash
python3 scripts/build_market_pages.py <site_dir>
```

Writes the seven market pages (dashboard, New Orleans & Louisiana, SF Bay Area,
High-Potential Belts, jobs-to-housing, core cities, Louisiana universities). Run by
`deploy-pages` at deploy time and **never committed** — like `demo.html` and
`crosswalk.html`, the rendered page is a build product so it cannot drift from the data
it claims to show.

## Refreshing this layer

The editions are the upstream. When an edition republishes with new records, re-extract
rather than patching a row: fetch the artifact, decompress the payload, replace the
whole file, re-run the gate, and update `docs/PUBLISH_MAP.md` if a measured count
changed (the cross-file rule will insist). Expanding the belts to more states is a data
job on the index bundle, not an edit here — the 39 absent states join when their ZIPs
carry both a value and a rent series, never before.
