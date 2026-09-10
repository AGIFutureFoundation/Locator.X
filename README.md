# Locator.X

Real-estate development and investment predictive tooling, plus the Academy that teaches how to
read what it produces. Every edition is a **single self-contained HTML file** — the map, the
underwriting engine, the evidence layer and the whole 92-lesson curriculum ship inside one page
that runs with the network off.

Built by the AGI Future Foundation.

---

## What is in here

This repository holds the **source**. The built editions and the ~4 GB of public-record data are
not committed; see [`data/README.md`](data/README.md) for why and how to rebuild them.

```
src/                 84 modules — the app, the Academy, the underwriting and evidence layers
curriculum/          the curriculum as data, the validator that keeps it honest, and the
                     course catalog separated by pillar (curriculum/courses/)
build*.py            33 builders — data modules, then one per edition
lxbuild.py           the shared build library (module registry, minify, pack)
pages/               standalone companion pages (cohort review, learning environment, decks)
docs/                overview, roadmap, platform notes, publish map, pull recipes, the
                     state-by-state process guides (docs/states/) and the cross-referenced
                     resource directory (docs/resources/)
```

## Documentation

| Start here | |
|---|---|
| [`docs/OVERVIEW.md`](docs/OVERVIEW.md) | Multi-section orientation to the whole system |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Versioned roadmap, v0.9 → v2.0, with proofs per milestone |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history |
| [`curriculum/courses/`](curriculum/courses/README.md) | The 50 courses, separated by pillar — tables, prerequisite flows, level detail |
| [`docs/states/`](docs/states/README.md) | The Locator.X process, state by state — all 50 states + DC across six regional guides |
| [`docs/resources/`](docs/resources/README.md) | Property data sources, the lender landscape, federal and state/county programs — cross-referenced |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | The doctrine as rules, the pre-PR checklist, contribution licensing |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | What deploys, over which routes, and what each needs |
| [`docs/asset-classes/`](docs/asset-classes/README.md) | Hotels, apartments, 5+ multifamily — the sourced use-code crosswalk, the doctrine-enforcing class screen, and the measured region matrix |
| [`docs/PULL_QUEUE.md`](docs/PULL_QUEUE.md) | The ordered probe queue for the next data session — what each pull unlocks, ingest tools ready |
| [`docs/cases/`](docs/cases/wework-lease-duration.md) | Record-layer case candidates — published filings, every claim marked documented / reported / disputed |

## Requirements

- Python 3.9+
- Node 18+ (`npm install` for `maplibre-gl`, `d3-delaunay`, `playwright`, `ipfs-car`)

Nothing else. There is no bundler, no framework and no build server: `lxbuild.py` concatenates
the module list, minifies, gzips the data and base64s it into one file.

## Quick start

The curriculum system runs from a clean checkout with no data at all:

```bash
git clone https://github.com/agifuturefoundation/locator.x.git
cd locator.x
python3 curriculum/validate.py
```

Expected output:

```
  · 50 curriculum items · 50 live · 0 designed
  · 19 tracks shipped · 92 lessons
  · developer route: 34 lesson references across 10 tracks
  · instructor notes: none supplied yet — the layer renders nothing, by design
  ✓ curriculum and shipped content agree
```

To build an edition you need its data module first — see [`data/README.md`](data/README.md).

Paths are derived from each script's own location, so the tree works wherever it is checked out.
Set `LOCATOR_X_ROOT` if the data tree lives somewhere other than the repo.

---

## The Academy

**19 tracks · 92 lessons · 50 curriculum items, every one backed by written content.**

Four layers: the trade (how a building pays, capital, construction, zoning, operations, the
numbers, holding and exit, diligence, leverage, markets); the record (case studies from published
filings, each claim marked documented, reported or disputed); the theory and the mind (a graduate
register, and the decision biases that misprice real estate specifically); and six applied arcs —
investment and development, delivering the project, evidence and honest visualization, emotional
equity and relationships, a development lab that carries one parcel through all six gates, and an
orientation track on the wider industry.

Emotional equity is drawn as the slab under the rest rather than as a pillar, because it is not a
subject you finish.

### The frameworks

| | |
|---|---|
| **LOCATOR** | the seven-gate deal screen — Location, Ownership economics, Cash flow, Asset test, Terms & leverage, Outlook, Record. It spells the platform because it *is* the platform. |
| **EQUITY** | six relationship practices (Track 17) |
| **BUILD** | five delivery practices |
| **PROOF** | five evidence practices |

### What makes it testable

- **The LOCATOR screen runs inside the underwriting sheet** (`src/locator.js`) — the framework is
  the product's workflow, not a page about it. A gate the record cannot answer returns **unknown**,
  never a quiet pass.
- **Level gates** (`src/gate.js`) grade the four curriculum levels as capabilities on a real
  parcel. The headline metric is deliberately not the score but the **certainty-error count** —
  a verdict returned on a gate the record cannot answer. Scoring is asymmetric and unit-tested:
  holding *unknown* on an unanswerable gate scores 100%; claiming certainty there scores 0 and is
  counted separately; over-caution costs 50% and is not a certainty error.
- **The level-four thesis** (`src/thesis.js`) is answered in two honest halves: two machine checks
  that are decidable (figures that appear nowhere in the record; ground the sentence leans on that
  the record returned unknown — the certainty error committed in prose), and a five-point rubric
  the learner applies to themselves. No model grades the sentence, and the page says so.
- **The developer route** (`src/routes.js`) reorders the same lessons by the six development
  gates, from the cheapest and most reversible step to the most irreversible. A door, not a
  smaller house.
- **Your record** (`src/telemetry.js`) reports what one browser can honestly measure — coverage
  before any rate, no accuracy figure below a sample floor of 5, and an explicit list of what it
  cannot answer, including one place where the app's own recording is lossy.

## The curriculum is data, and the build enforces it

`curriculum/curriculum.py` is the single source of truth: 50 items, 8 pillars, 4 levels,
4 frameworks, 6 doctrine principles. An item's **status is derived**, never stored — `status_of()`
reads a `BACKS` map from item to the Academy track that actually provides its lessons.

`curriculum/validate.py` runs **eight checks** and is wired into every build as a gate that raises
rather than warns:

1. every item has a backing entry, and there are no stray keys
2. every backing track actually ships, loaded from the real modules
3. the drift check — stored status vs derived status
4. orphan tracks
5. referential integrity: prerequisites, levels, pathways; every item in exactly one level
6. no prerequisite sits at a higher level than the item that needs it
7. every developer-route lesson reference resolves
8. every instructor-note anchor resolves, and no note is bodyless

Checks 3, 6, 7 and 8 each exist because a real bug got through. Check 6 caught three shipped
ordering bugs on its first run. The rule the project now runs on: **measure before asserting** —
an earlier roadmap claimed the Academy cost "several MB per edition" and blocked content growth;
measured, it was 104.8 KB packed, about 1.4 KB per lesson, and the whole argument was wrong.

## Verification

Editions are checked in a real browser, not by inspection:

```bash
npm install
python3 curriculum/validate.py          # the curriculum gate
node curriculum/extract_tracks.js       # what the app actually registers
```

The full-fleet sweep drives each built edition under Playwright and asserts 19 tracks, 92 lessons,
contiguous slots, the seven LOCATOR gates in order, the route and rubric controls, and **zero page
errors**. All twelve editions passed on 2026-09-09.

## Attribution and scope

Course material is original to Locator.X. Topic coverage in this field is standard and not
ownable; nothing here is copied, paraphrased at length or adapted from any provider's syllabus,
slides, book or programme. No university, business school, publisher or course provider has
reviewed, endorsed or is affiliated with this material, and completing any part of it confers no
accredited degree, diploma, licence or professional certification.

Curriculum themes credited to Curtis Oakes's published catalogue carry a no-affiliation notice in
the app; Coldwell Banker appears only as sourced factual business history. Company and brand names
are the trademarks of their respective owners.

Nothing in this repository is legal, tax, securities or investment advice. Construction, zoning
and cost material is general education. Property data is public record; see
[`data/README.md`](data/README.md) for sourcing and for the PII-stripping rule on ingest.

## Licence

Split by kind of work, the standard foundation pattern:

- **Code** — the [Apache License 2.0](LICENSE): `src/`, `build*.py`, `lxbuild.py`, the
  curriculum tooling (`curriculum/*.py`, `curriculum/extract_tracks.js`), and `scripts/`.
  Permissive, with an explicit patent grant and the attribution mechanics of the
  [`NOTICE`](NOTICE) file.
- **Written content** — [Creative Commons Attribution 4.0](LICENSE-docs) (CC BY 4.0):
  `docs/`, `curriculum/courses/`, the course text in the curriculum CSV, `data/README.md`,
  and the prose of `pages/`. Reuse freely with attribution:
  *"Locator.X, AGI Future Foundation, CC BY 4.0."*

The `NOTICE` file carries the copyright line and the attribution and no-advice statements;
they travel with any redistribution under Apache-2.0 §4(d).
