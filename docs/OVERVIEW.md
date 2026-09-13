# Locator.X — Platform Overview

A multi-section orientation to the whole system: what it is, how the pieces fit, where each
edition lives, and where to go deeper. If you read one document before the code, read this one.

---

## Contents

1. [What Locator.X is](#1-what-locatorx-is)
2. [The three layers](#2-the-three-layers)
3. [The LOCATOR framework](#3-the-locator-framework)
4. [The editions](#4-the-editions)
5. [Architecture and the build](#5-architecture-and-the-build)
6. [The data doctrine](#6-the-data-doctrine)
7. [The Academy](#7-the-academy)
8. [The evidence doctrine](#8-the-evidence-doctrine)
9. [Repository map](#9-repository-map)
10. [Documentation map](#10-documentation-map)

---

## 1. What Locator.X is

Locator.X is real-estate development and investment predictive tooling, plus the Academy that
teaches how to read what it produces. Every edition ships as a **single self-contained HTML
file** — map, underwriting engine, evidence layer and the whole 92-lesson curriculum inside one
page that runs with the network off.

Three commitments define it:

- **The framework is the workflow.** The LOCATOR deal screen runs *inside* the underwriting
  sheet (`src/locator.js`), not on a page about it.
- **Unknown is an answer.** A gate the record cannot answer returns **unknown**, never a quiet
  pass. Claiming certainty on an unanswerable gate is the one error the platform counts
  separately.
- **Measure before asserting.** The project's governing rule, earned the hard way: a roadmap
  once claimed the Academy cost "several MB per edition" and blocked content growth; measured,
  it was 104.8 KB packed and the whole argument was wrong.

Built by the AGI Future Foundation.

## 2. The three layers

| Layer | What it does | Where it lives |
|-------|--------------|----------------|
| **The platform** | Maps, scores and underwrites parcels; runs the seven-gate LOCATOR screen; solves for break-even at DSCR 1.20 | `src/locator.js`, `src/underwrite.js`, `src/outlook.js`, `src/dashboard.js` |
| **The evidence layer** | Grades every number it shows — coverage before any rate, no accuracy below a sample floor of 5, an explicit list of what it cannot answer | `src/evidence.js`, `src/standards.js`, `src/signals.js`, `src/telemetry.js` |
| **The Academy** | 19 tracks, 92 lessons, 50 curriculum items across 8 pillars and 4 levels, on an emotional-equity foundation | `src/academy.js`, the `*course.js` modules, `curriculum/` |

The layers are deliberately coupled: the Academy teaches the numbers the platform computes, the
platform refuses to show numbers the evidence layer cannot defend, and the level gates
(`src/gate.js`) grade curriculum levels as **capabilities on a real parcel**, not quiz scores.

## 3. The LOCATOR framework

The seven-gate deal screen. It spells the platform because it *is* the platform:

| Gate | Question it forces |
|------|--------------------|
| **L** — Location | Does the record support the location thesis, or just the brochure? |
| **O** — Ownership economics | Who owns it, on what basis, and what do they need? |
| **C** — Cash flow | Can the four income streams be named, sourced and defended? |
| **A** — Asset test | Asset or liability — does the building pay you, or do you pay it? |
| **T** — Terms & leverage | Does coverage survive a bad year, whatever the LTV says? |
| **O** — Outlook | Whose cap rate prices the exit, and what breaks the model? |
| **R** — Record | Is the decision written down before the outcome grades it? |

A gate the record cannot answer returns **unknown**. Scoring is asymmetric and unit-tested:
holding *unknown* on an unanswerable gate scores 100%; claiming certainty there scores 0 and is
counted as a **certainty error**; over-caution costs 50% and is not a certainty error.

Three companion frameworks structure the applied arcs: **EQUITY** (six relationship practices),
**BUILD** (five delivery practices), **PROOF** (five evidence practices).

## 4. The editions

Twelve built editions, each a self-contained HTML file of 2–16 MB (see
[`EDITIONS_MANIFEST.md`](EDITIONS_MANIFEST.md) for the full manifest and
[`PUBLISH_MAP.md`](PUBLISH_MAP.md) for where each is published):

| Edition | Scope |
|---------|-------|
| `uswide.html` | National baseline |
| `uscorridor.html` / `usnew5.html` | National corridor analyses |
| `bay-ledger.html` / `atlas_bay.html` | Bay Area premium market |
| `nola.html` / `atlas_nola.html` | New Orleans + Baton Rouge emerging market |
| `below100.html` / `income50.html` / `launi.html` / `match50.html` / `sheltercove.html` | Thematic screens (below-market, income, Louisiana university ring, matching, coastal) |

The three-market thesis — national baseline, Bay Area premium anchor, Louisiana value entry —
is documented in [`LOCATOR_X_PLATFORM_GUIDE.md`](LOCATOR_X_PLATFORM_GUIDE.md). The roadmap for
taking the same depth to further states is [`ROADMAP.md`](ROADMAP.md), and the state-by-state
operating process it builds toward is [`states/README.md`](states/README.md).

Standalone companion pages (no build needed) live in `pages/`: the learning environment, the
applied-courses catalog, the cohort review, the Louisiana developer deck and the pitch deck.

## 5. Architecture and the build

There is no bundler, no framework and no build server.

```
src/ (85 modules) ──┐
curriculum/ ────────┤──▶ lxbuild.py ──▶ one self-contained HTML file per edition
data modules ───────┘      (module registry, minify, gzip + base64 pack)
```

- `build_data_*.py` build the packed data modules from the raw pulls
  ([`PULL_RECIPE.md`](PULL_RECIPE.md) documents every pull).
- `build_*.py` — one per edition — select modules and data, then hand off to `lxbuild.py`.
- `curriculum/validate.py` is wired into **every** build as a gate that raises rather than
  warns (eight checks; see §7).
- Verification is done in a real browser: the Playwright fleet sweep drives each built edition
  and asserts 19 tracks, 92 lessons, contiguous slots, the seven LOCATOR gates in order, and
  zero page errors.

Paths derive from each script's own location; set `LOCATOR_X_ROOT` if the data tree lives
elsewhere.

## 6. The data doctrine

The ~4 GB of public-record data is **not committed** — see [`../data/README.md`](../data/README.md):

- Every field's provenance is documented; pulls are reproducible from
  [`PULL_RECIPE.md`](PULL_RECIPE.md).
- Some upstream feeds carry owner names and mailing addresses. **PII is stripped on ingest**,
  and the raw mirrors stay out of git because history is much harder to clean than a working
  tree.
- Where the record is thin, the product says so: the Comps desk explains why it cannot function
  in Orleans or East Baton Rouge parish rather than pretending it can.

## 7. The Academy

**19 tracks · 92 lessons · 50 curriculum items, every one live and backed by written content.**

Four layers: the trade; the record (case studies from published filings, each claim marked
documented, reported or disputed); the theory and the mind; and six applied arcs. Emotional
equity is drawn as the slab under the rest rather than as a pillar, because it is not a subject
you finish.

The curriculum is **data**: `curriculum/curriculum.py` is the single source of truth (50 items,
8 pillars, 4 levels, 4 frameworks, 6 doctrine principles); an item's status is derived, never
stored; `curriculum/validate.py` runs eight checks — four of which exist because a real bug got
through.

The catalog, separated by pillar with prerequisite flows and level-by-level detail, is in
[`../curriculum/courses/`](../curriculum/courses/README.md).

## 8. The evidence doctrine

The platform's honesty rules, each enforced in code, each taught in the
[Evidence, data & judgment pillar](../curriculum/courses/07-evidence-data-judgment.md):

1. **Frame before querying** — the most expensive errors are correct answers to questions
   nobody needed.
2. **Coverage before any rate** — a percentage without its denominator is an ambush.
3. **Medians on skewed data** — on right-skewed price data the mean is a tail and the median
   is a market; Wilson intervals in the Patterns panel.
4. **A sample floor of 5** — below it, no accuracy figure is shown at all.
5. **Fit on one half, measure on the other** — and cap what you compound.
6. **Unknown is an answer** — the certainty-error count is the headline metric, not the score.

`src/telemetry.js` applies the same standard to the app itself: it reports what one browser can
honestly measure and lists what it cannot — including one place where the app's own recording
is lossy.

## 9. Repository map

```
src/                 85 modules — app, Academy, underwriting, evidence layers
curriculum/          curriculum-as-data, validator, per-pillar course catalogs (courses/)
build*.py            33 builders — data modules, then one per edition
lxbuild.py           shared build library (module registry, minify, pack)
pages/               standalone companion pages
docs/                this overview, roadmap, platform guide, publish map, pull recipes,
                     state-by-state guides (states/), resource directory (resources/)
data/                README only — the tree itself is rebuilt locally, never committed
```

## 10. Documentation map

| Document | What it answers |
|----------|-----------------|
| [`../README.md`](../README.md) | Quick start, requirements, attribution and scope |
| **This overview** | How the whole system fits together |
| [`ROADMAP.md`](ROADMAP.md) | Versioned, multi-section plan — what ships next and why |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Version history |
| [`../curriculum/courses/`](../curriculum/courses/README.md) | The 50 courses, separated by pillar |
| [`states/README.md`](states/README.md) | The Locator.X process, state by state — all 50 states + DC |
| [`resources/README.md`](resources/README.md) | Property data sources, lenders, federal and state/county programs, cross-referenced |
| [`LOCATOR_X_PLATFORM_GUIDE.md`](LOCATOR_X_PLATFORM_GUIDE.md) | The three-market platform in operational detail |
| [`EDITIONS_MANIFEST.md`](EDITIONS_MANIFEST.md) | Every built edition, feature by feature |
| [`PUBLISH_MAP.md`](PUBLISH_MAP.md) | Where each edition is published |
| [`PULL_RECIPE.md`](PULL_RECIPE.md) | How every data field is pulled and rebuilt |
| [`../data/README.md`](../data/README.md) | Why the data is not committed; PII rules |
