# Changelog

Versions follow the scheme in [`docs/ROADMAP.md`](docs/ROADMAP.md): minor versions add a layer,
major versions change what an edition is. Dates are recorded only where the event is verifiable
from the repository or the fleet-sweep record; earlier lineage is reconstructed and marked as
such.

## [Unreleased]

- **Instructor-notes authoring guide (v1.3 groundwork)** — `curriculum/INSTRUCTOR_NOTES.md`:
  schema, validated anchor vocabulary, the supply workflow, and a Level-1 worksheet of
  prompts. No drafted copy — the layer's founding rule is that notes ship empty until
  the platform owner supplies real words.
- **Deployment guide** — `docs/DEPLOYMENT.md`: what deploys, both routes with their
  activation conditions, the Vercel token drop-in steps, and how full editions publish.
- **Historical banners** — `EDITIONS_MANIFEST.md` and `LOCATOR_X_PLATFORM_GUIDE.md`
  marked as corridor-era lineage; `PUBLISH_MAP.md` remains the authoritative edition map.
- **`build_state.py` (v2.0 groundwork)** — the parameterised state/market edition
  builder: specs instead of copy-pasted builders, `--dry-run` verification of every
  regionalization pair against current source, the evidence ceiling as a `hide_tabs`
  parameter, and a Florida template that refuses to build until filled in. Its first
  dry run surfaced three stale pairs in the original atlas builders (content fix
  tracked separately; parity preserved via `known_stale`).
- **Companion pages deployment wired** — `pages/index.html` landing page plus two
  deploy routes: `.github/workflows/deploy-pages.yml` (GitHub Pages — activates when
  the repository is public; the first run confirmed Pages cannot be created on this
  private repo) and `.github/workflows/deploy-vercel.yml` (armed but dormant until a
  `VERCEL_TOKEN` secret is added). The full editions remain build products per the
  publish map.
- **Wave-one probes dated** — Louisiana GIS/open-data hosts (NOLA, EBR, Jefferson,
  Tax Commission, qPublic) probed from the container 2026-09-09: the whole host class
  is egress-blocked; rows updated to `blocked` with the desktop route named.
- **v1.2 complete** — the lender↔deal matching matrix
  ([`docs/resources/lenders.md` §9](docs/resources/lenders.md#9-the-matching-matrix)) and
  the federal-program → state-administrator mapping
  ([`docs/resources/state-administrators.md`](docs/resources/state-administrators.md)):
  LIHTC allocator, SHPO and state-historic-credit status for all 50 states + DC, with
  the allocator exceptions (CTCAC, DCA, EOHLC, HCR, DC DHCD) called out, plus routing
  patterns for HOME/CDBG, PHAs, brownfields, C-PACE, USDA and weatherization.
- **Link-rot sweep shipped (v1.2 tooling)** — `scripts/check_external_links.py`
  classifies every external URL (ok / auth-gated / broken); a quarterly scheduled
  workflow (`.github/workflows/link-rot.yml`) runs it where egress is open.
- **Florida NAL ingest ready** — `scripts/fl_nal_probe.py` parses a downloaded DOR
  NAL csv/zip with the PII strip on ingest (verified: no `OWN_*`/`FIDU_*` fields
  survive), populated-rate report, raw use-code histogram, and the sale-qualification
  picture. The download itself is `blocked` from the container (egress 403, dated in
  the coverage inventory); the desktop browser-pane route completes it.
- v1.1 wave one begins: per-state record-coverage inventories
  ([`docs/states/coverage/`](docs/states/coverage/README.md)) for Louisiana and California
  (anchor markets, shipped-feed rows cited) and Florida (the new wave state, chosen for
  the DOR statewide rolls), with the status vocabulary that keeps unfetched sources
  honestly marked `named` or `no public record`.

## 1.0.0 — 2026-09-09

All five public-release gates closed (roadmap §3). The repository is release-ready;
visibility is a Foundation switch.

- **Licence chosen** — Apache-2.0 for code (`LICENSE`, `NOTICE`), CC BY 4.0 for written
  content (`LICENSE-docs`); README licence section rewritten for the split.
- **Attribution review** — the Foundation confirmed the attribution and scope section as
  written (2026-09-09).
- **History audit** — every blob in `git` history checked; no data mirrors, no PII; only
  `data/README.md` has ever been tracked under `data/`.
- **CONTRIBUTING.md** — the doctrine as rules, the pre-PR checklist, contribution licensing.
- **CI** — `.github/workflows/validate.yml` runs the eight-check curriculum gate, a
  generated-catalog drift check, and the internal link check (`scripts/check_links.py`) on
  every push and PR; first runs green.
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
