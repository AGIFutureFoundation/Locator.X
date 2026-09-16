# Locator.X — agent onboarding

Real-estate analytics platform + Academy. Every edition is one self-contained HTML file;
this repo is the **source** — built editions and the ~4 GB data tree are never committed.

## Run before any commit

```bash
python3 curriculum/validate.py        # eight checks; raises, never warns
python3 scripts/check_links.py        # internal markdown links
python3 crosswalk/validate_usecodes.py
python3 market/validate_market.py    # sourced market data; cross-checks PUBLISH_MAP
python3 scripts/validate_landscape.py # competitor claims keep their sources; module counts re-counted
python3 scripts/validate_company.py   # branded names name real modules; no securities-adjacent language
python3 scripts/build_deck.py --check  # the investor deck states no figure it did not measure
python3 scripts/standard_feasibility.py --check  # no market's criteria ceiling is overstated
python3 scripts/crosscheck_sources.py           # inventory and crosswalk agree on what is valued
python3 scripts/expansion_rank.py --check       # then: docs/EXPANSION.md must regenerate clean
python3 scripts/build_social.py --check         # public posts: measured figures, no markdown, under limit
python3 curriculum/gen_courses.py     # then: git diff must be clean on curriculum/courses/ and curriculum-50.csv
python3 tests/run.py                  # doctrine smoke tests (PII strip, sample floor, ...)
```

CI (`.github/workflows/validate.yml`) runs exactly these — thirteen gates now, and the last
seven also run inside `tests/run.py` so a clean local run cannot miss them. A red check is
real — the validator has no flake mode.

## The rules that are never bent

- **Measure before asserting.** No size/coverage/performance claim without the
  measurement. No factual doc row without a source and date.
- **Unknown is an answer.** Never convert an unanswerable question into a quiet pass —
  in code, in docs, in coverage tables (`named` / `blocked` / `no public record` are
  honest statuses, see `docs/states/coverage/README.md`).
- **Never fabricate a row, coordinate, price or use class** (`docs/PULL_RECIPE.md` hard
  rules). Use codes map only via measured groupBys or published manuals —
  `crosswalk/usecodes.json` carries source + date per code.
- **No PII, no data commits.** `data/` stays ignored; owner fields are stripped on
  ingest; git history cannot be cleaned later.
- **Derived things are generated, not edited.** `curriculum/courses/` **and
  `curriculum/curriculum-50.csv`** both come from `gen_courses.py`, which reads
  `curriculum.py` — the curriculum has **one** source of truth, not two (the CSV was
  hand-maintained beside it, with both called authoritative in different documents and
  nothing checking they agreed); an item's status comes from `status_of()`; the public site's
  `demo.html`, `crosswalk.html` and the seven market pages are built at deploy and
  never committed; regenerate, never patch.
- **Instructor notes and the instructor profile ship empty** until the platform owner
  supplies words (`src/notes.js`, `content/instructor-profile.json`; guides in
  `curriculum/INSTRUCTOR_NOTES.md` and `curriculum/INSTRUCTOR_PROFILE.md`). The
  platform asserts no words, **biography** or endorsement it was not given. Record-layer
  case claims are marked documented / reported / disputed (`docs/cases/`).
- **No advice.** Everything state/program/lender-shaped is navigation of the public
  record with verify-before-relying disclaimers, never a recommendation.
- **Never mix mission, software, property, robotics and investor economics.** Each capital
  pool is a separate entity with its own rights, budget and disclosure. **Locator.X, Inc.
  is a separate company founded by AGI Corp**, and its seed round (Part A) is legally
  apart from the Portfolio Basket (Part B): one cheque does not buy both, and
  `scripts/validate_company.py` fails the build if `docs/company/THE_ASK.md` loses a
  firewall sentence or gives both parts the same issuer; every entity in
  `docs/company/CAPITAL_STRUCTURE.md` states what an investor does **not** automatically
  own, and that cell may never be empty. One cheque never buys the group.
- **Nothing securities-adjacent, ever, without counsel.** No return projection stated as
  fact, no solicitation, no fund terms presented as agreed, no offering pitched as
  exposure across the group, and never an implication that software equity conveys
  ownership of portfolio property (`docs/company/FUNDING.md`).
  `scripts/validate_company.py` lints every `docs/` and `content/` markdown file for all
  four and fails the build on a match — a policy is remembered until the week it is
  inconvenient.

## Where things live

| Thing | Place |
|---|---|
| App + Academy modules (86) | `src/` (shared shell: `src/head.html`, `src/body.html`) |
| Builders | `build_*.py`; shared lib `lxbuild.py`; parameterised `build_state.py` (`--dry-run` verifies pairs against source) |
| Curriculum source of truth | `curriculum/curriculum.py` — **the only one**; `curriculum-50.csv` and `curriculum/courses/` are generated from it by `gen_courses.py` |
| State layer | `docs/states/` (guides, `coverage/` inventories, `ninety-day-path.md`) |
| Louisiana record friction | `docs/LOUISIANA_DEVELOPMENT_FRICTION.md` (what slows a deal, ranked, each with its probe) |
| Resources | `docs/resources/` (data sources, lenders, programs, administrators) |
| Asset classes | `crosswalk/usecodes.json` + `scripts/class_screen.py` + `docs/asset-classes/` |
| Measured market layer | `market/` (extracted from the shipped editions, never hand-edited) rendered by `scripts/build_market_pages.py` at deploy |
| Where to expand | `docs/EXPANSION.md` — **generated** by `scripts/expansion_rank.py`; every market ranked by what its record can answer against measured demand |
| Next data session | `docs/PULL_QUEUE.md` (ordered probes; ingest tools ready); New Orleans expansion ranked in `docs/PULL_NOLA.md` by `scripts/standard_feasibility.py --plan` |
| Articles (SEO/blog) | `content/blog/*.md` rendered by `scripts/build_blog.py`; every figure resolves from `market/*.json`, never typed inline |
| Instructor profile | `content/instructor-profile.json` — **ships empty**; guide in `curriculum/INSTRUCTOR_PROFILE.md` |
| Lodging expansion + edition scale ceiling | `docs/HOTEL_EXPANSION.md` (generated by `scripts/hotel_candidates.py`; measurements in `market/edition_scale.json`) |
| Desk ↔ app interop contract | `docs/INTEROP.md` (the worksheet JSON shape; the no-laundering rule) |
| Desk-browser pull protocol | `scripts/desk/pull_driver.js` (browser side) + `scripts/desk_ingest.py` (container side), driven end to end against a local fixture by `tests/desk_roundtrip.js`; mechanics in `docs/PULL_RECIPE.md`. The driver **refuses to fetch** an owner-identity field and refuses to report a partial pull as complete |
| Contract & underwriting anatomy | `docs/CONTRACT_ANATOMY.md` (education; the no-drafting line) |
| Company layer | `docs/company/` — positioning, pricing, portfolio strategy, funding boundary, agents; the **two-part ask** (`THE_ASK.md`) and the real-estate bundle (`PORTFOLIO_BASKET.md`); **and the capital layer**: entity register, mission rights, instruments, cap table, use of proceeds, risk register, investor reporting. Gated by `scripts/validate_company.py` |
| Market intelligence | `docs/market/` — the competitor register, the measured gap, the premium roadmap; gated by `scripts/validate_landscape.py` |
| Social copy | `content/social/*.md` — placeholders only, rendered by `scripts/build_social.py`; linted for solicitation like everything under `content/`, which matters most here because a post is public |
| Investor deck | `content/investor/DECK.md` — placeholders only, rendered by `scripts/build_deck.py`; every figure measured at build time by `scripts/deck_figures.py`. Pitch film: `scripts/make_investor_video.js` |
| Roadmap / history | `docs/ROADMAP.md` (every milestone names its proof) / `CHANGELOG.md` |
| Known gaps | `docs/KNOWN_GAPS.md` — defects that are **measured, known and not fixed yet**, each with its measurement and the stated cost of leaving it. An entry that cannot say how it was measured does not belong there |

## Environment gotchas

- This container has **no egress at all**: the agent proxy's gateway answers 403 to
  CONNECT for **every** host, `example.com` included (re-measured 2026-09-16; the proxy
  itself reports healthy, so it is upstream policy, not configuration). `WebSearch`
  works; `WebFetch`, curl and a local Chromium do not. Data pulls run over the desktop
  browser pane per `docs/PULL_RECIPE.md`, whose protocol is now shipped code with a
  fixture-driven round-trip test. Do not fake what you cannot fetch.
- `node_modules` is not installed by default; `build_state.py --dry-run` deliberately
  avoids needing it or any data.
- Regionalization pairs in builders must match `src/body.html` exactly, **at their
  turn in sequence** — `build_state.py --dry-run <spec>` and `scripts/check_pairs.py`
  both fail loudly on a stale or shadowed pair, and `tests/run.py` holds every hand
  builder and its spec in lockstep by AST comparison (every shipped edition has both).
- Full builds and the Playwright fleet sweep need the local data tree
  (`data/README.md`); from a clean checkout only the gates above can run.
