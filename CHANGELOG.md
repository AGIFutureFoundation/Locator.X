# Changelog

Versions follow the scheme in [`docs/ROADMAP.md`](docs/ROADMAP.md): minor versions add a layer,
major versions change what an edition is. Dates are recorded only where the event is verifiable
from the repository or the fleet-sweep record; earlier lineage is reconstructed and marked as
such.

## [Unreleased]

- **Licence chosen** — Apache-2.0 for code (`LICENSE`, `NOTICE`), CC BY 4.0 for written
  content (`LICENSE-docs`); README licence section rewritten for the split.
- **CONTRIBUTING.md** — the doctrine as rules, the pre-PR checklist, contribution licensing.
- **CI** — `.github/workflows/validate.yml` runs the eight-check curriculum gate, a
  generated-catalog drift check, and the internal link check (`scripts/check_links.py`) on
  every push and PR.
- Documentation layer: platform overview ([`docs/OVERVIEW.md`](docs/OVERVIEW.md)), versioned
  roadmap ([`docs/ROADMAP.md`](docs/ROADMAP.md)), this changelog.
- Curriculum separated into per-pillar course catalogs
  ([`curriculum/courses/`](curriculum/courses/README.md)) with a regeneration script
  (`curriculum/gen_courses.py`) so the view cannot drift from `curriculum-50.csv`.
- State-by-state process guides for all 50 states and DC
  ([`docs/states/`](docs/states/README.md)).
- Cross-referenced resource directory — property data sources, lender landscape, federal and
  state/county programs ([`docs/resources/`](docs/resources/README.md)).
- Standalone learning-environment page restored to a valid self-contained document.

Pending for v1.0 (see roadmap §3): LICENSE, CI for the validator, CONTRIBUTING, PII audit
sign-off.

## 0.9.0 — 2026-09-09

The state imported as this repository's first full source drop.

- **Curriculum complete:** all 50 items live (F6, N6, N7, A1, A3, C7 and M2 crossed from
  designed to live), 19 tracks, 92 lessons; developer route resolves 34 lesson references
  across 10 tracks.
- **Fleet sweep:** all twelve editions driven under Playwright — 19 tracks, 92 lessons,
  contiguous slots, seven LOCATOR gates in order, zero page errors.
- Eight-check validator wired into every build as a raising gate.

## Earlier lineage (reconstructed, pre-versioning)

Ordered but undated; each entry survives in the code or docs it produced.

- **Three-market platform** — national baseline, Bay Area premium, New Orleans + Baton Rouge
  value editions with the master dashboard flow ([`docs/LOCATOR_X_PLATFORM_GUIDE.md`](docs/LOCATOR_X_PLATFORM_GUIDE.md)).
- **Corridor era** — the `build_data_uscorridor*` series (eight iterations) and the corridor
  editions catalogued in [`docs/EDITIONS_MANIFEST.md`](docs/EDITIONS_MANIFEST.md).
- **Evidence layer hardening** — coverage-before-rate, the sample floor of 5, Wilson
  intervals, the certainty-error metric and asymmetric gate scoring.
- **Curriculum-as-data migration** — status derived rather than stored; validator checks 3, 6,
  7 and 8 each added after a real bug got through (check 6 caught three shipped ordering bugs
  on its first run).
- **The measurement correction** — the "several MB per edition" claim that blocked content
  growth was measured at 104.8 KB packed (~1.4 KB per lesson) and reversed; "measure before
  asserting" became the governing rule.
