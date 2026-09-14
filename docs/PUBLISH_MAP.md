# Locator.X — edition → artifact map

**Authoritative.** Each edition republishes to the URL below, in place. Verified 2026-09-09 by
matching every local build's `<title>` 1:1 against the published artifact titles; the five marked
(m) were additionally confirmed in the earlier republish manifest.

| Edition file | `<title>` | Artifact URL |
|---|---|---|
| bay-ledger.html  | Locator.X — powered by AGI Corp | https://claude.ai/code/artifact/0f9acddd-6a09-4e15-afdc-6096852c2262 (m) |
| uscorridor.html  | Locator X US Corridors        | https://claude.ai/code/artifact/5413f1db-d0de-45f9-ab15-df94b292109c (m) |
| uswide.html      | Locator X Conversion Stock    | https://claude.ai/code/artifact/8f87866b-c1af-4af2-9bd0-e3b0a04c8a94 (m) |
| usnew5.html      | Locator X New Corridors       | https://claude.ai/code/artifact/ee4f1a68-d0c6-4a4a-8757-78f248aa596e |
| nola.html        | Locator X New Orleans         | https://claude.ai/code/artifact/b9499a22-4263-4853-8dc7-f72c8f676b70 (m) |
| atlas_nola.html  | Locator X New Orleans Atlas   | https://claude.ai/code/artifact/219b9628-d80f-4cdf-9c6b-8a94bde665a3 (m) |
| atlas_bay.html   | Locator X Bay Atlas           | https://claude.ai/code/artifact/6bb81210-e4f2-47ad-9d39-ada84c9f1f6e |
| below100.html    | Locator X Below Market        | https://claude.ai/code/artifact/00e8755d-73fc-4a3b-85c6-17bc568d21ef |
| income50.html    | Locator X Income Fifty        | https://claude.ai/code/artifact/4f7cfea2-9328-4f43-8cf1-79d1944b4d70 |
| launi.html       | Locator X Baton Rouge         | https://claude.ai/code/artifact/4cacba36-41fb-46a7-ae73-a900860a4015 |
| match50.html     | Locator X Match Fifty         | https://claude.ai/code/artifact/aae444cf-cd04-446b-a637-0eeddc35b70f |
| sheltercove.html | Locator X Shelter Cove        | https://claude.ai/code/artifact/c421820d-c90e-420a-aec7-a22af4912c78 |

Companion pages (not editions):

| Page | Artifact URL |
|---|---|
| locator-x-learning-environment.html | https://claude.ai/code/artifact/180f4f61-5e3b-4758-bdad-081a715e826d |
| locator-x-applied-courses.html      | https://claude.ai/code/artifact/5d942573-fae0-4bb0-9163-403098a5effd |
| locator-x-cohort-review.html        | https://claude.ai/code/artifact/8c151cf7-78b0-48e1-83b5-ab7286f87e49 |
| locator-x-pitch-deck.html           | https://claude.ai/code/artifact/43d38316-2028-4ccb-9b21-400ed06f7349 |
| locator-x-louisiana-developer-deck.html | https://claude.ai/code/artifact/5adff6bc-2063-4257-83bb-e913eacc2bf8 |

## Record counts — the check that matters before republishing

**This check is mechanical now.** `node tests/edition_sweep.js` drives every built
edition in headless Chromium on the data machine and fails on a title that does not
match the table below, a record count that does not match the documented figure, a
page or map error, or a city label naming a place the edition's own records do not
carry. `scripts/publish_editions.sh` runs it between building and publishing and
stops if it fails, so a short build cannot reach an artifact URL. With no data tree
(any clean checkout, CI included) `--parse-only` verifies this document still parses.


File size is NOT the integrity check; the record count is. Verified 2026-09-09:

| Edition | Records | Matches the documented figure |
|---|---|---|
| bay-ledger | 182,124 | yes |
| uscorridor | 354,260 | yes |
| atlas_nola | 125,803 | yes |
| nola | 87,578 (85,000 Orleans + 2,578 Jefferson) | yes |

**This closes a flag carried for several sessions.** `nola` and `atlas_nola` were suspected of
building short because they came out at 5.6 / 4.9 MB against recorded published sizes of 15.13 /
12.21 MB. They are not short: the record counts are exact. The difference is the compression pass
that freed ~18 MB across the fleet. Nothing is missing, and republishing them is safe.


## Republish log — 2026-09-09

Each republish requires a fresh fetch of the live version first (the tool refuses a publish to an
artifact this conversation has not viewed). That fetch returns a large slice of the file, so the
cycle is expensive; the alternative is `force: true`, which skips the fetch but discards the live
version unread and must never be used without the user's explicit say-so.

| Edition | Republished |
|---|---|
| bay-ledger  | ✅ 2026-09-09 |
| uscorridor  | ✅ 2026-09-09 |
| nola        | ✅ 2026-09-09 |
| atlas_bay   | ✅ 2026-09-09 |
| uswide      | ✅ 2026-09-09 |
| atlas_nola  | ✅ 2026-09-09 |
| usnew5      | **pending** |
| below100    | **pending** |
| income50    | **pending** |
| launi       | **pending** |
| match50     | **pending** |
| sheltercove | **pending** |

**Six of twelve are current.** The six pending ones are the smaller editions; the user chose to
stop after the largest, because each republish costs a fetch that pulls a large slice of the file
into the session. Their local builds are already verified and ready — they need only the
fetch-then-publish cycle, in a later session.

Before publishing bay-ledger the live version was compared structurally against the new build:
19 h2 headings live vs 23 local, the only live-only heading being `Tradecraft — the rest of the
trade`, which a later pipeline change renamed to `Tradecraft — the whole library`. Nothing on the
live page was absent from the new build, so the new build is a strict successor. All 12 editions
come from the same `body.html` and module pipeline, so that comparison holds for the class.

## The public site — 2026-09-11

With the repository public, `.github/workflows/deploy-pages.yml` deploys the site on every
push to main: `pages/` verbatim, plus `demo.html` — the complete application shell over
deterministic SYNTHETIC fixtures, generated at deploy time by
`scripts/build_fleet_demo.py` and never committed. The demo carries a version selector for
every shipped edition in `build_state.py`'s registry (the three wave templates listed
disabled with their refusal reason) and asserts nothing about the real world: every record
sits on a fictional island near 0°N 0°E and the page says so in a fixed banner. Real
editions remain build products of the data machine, published per the map above.

## The editions channel — 2026-09-11

Real editions go live through a dedicated companion repository so the source
repo keeps its never-commit-built-editions rule:

1. On the data machine: `bash scripts/publish_editions.sh` — builds every
   filled spec (`build_state.py --all`), writes an integrity manifest
   (`editions.json`: file, title, bytes, sha256, build date, source commit),
   and force-pushes the set to `AGIFutureFoundation/Locator.X-editions`
   (public; create once with `gh repo create`). Publishing an EMPTY set is
   refused out loud — it would take live editions down silently.
2. On deploy: `scripts/build_editions_index.py` clones the companion repo,
   verifies every file against its manifest hash (a mismatch is refused and
   named on the page, never served), stages the verified editions under
   `/editions/`, and generates the index listing exactly what is live. With
   nothing published it renders an honest empty state, so the landing link
   always resolves and never overstates.
3. The site deploy triggers on the source repo, so after publishing editions
   run `gh workflow run 'deploy pages' -R AGIFutureFoundation/Locator.X` (or
   push anything) to pick them up.

## Install from the live artifacts — 2026-09-11

The user directed the editions channel to be loaded from **the HTML versions that
exist** — the live artifact set above — rather than waiting on a data-machine
rebuild. Executed in-session on 2026-09-11:

1. All twelve editions fetched from their published artifact URLs; every `<title>`
   matched this map 1:1.
2. The four editions with documented record counts were driven headless and
   re-counted live: **bay-ledger 182,124 · uscorridor 354,260 · atlas_nola
   125,803 · nola 87,578** — all exact matches, zero page errors. (A re-count of
   the remaining eight was declined mid-run; they are recorded as
   title-verified, never as measured.)
3. The set was staged with an `editions.json` manifest (sha256, bytes, build date
   from each artifact's last republish, measured counts where they exist) and
   verified end-to-end through `scripts/build_editions_index.py`:
   **12 live, 0 refused.**

| File | Key | Size | sha256 (first 16) | Built | Records |
|---|---|---|---|---|---|
| atlas_bay.html | bay-atlas | 6.76 MB | `4105792baec710dd` | 2026-09-09 | title-verified, not re-counted |
| atlas_nola.html | nola-classic | 4.88 MB | `e27ddb4470741831` | 2026-09-09 | 125,803 (measured 2026-09-11) |
| bay-ledger.html | bay | 10.93 MB | `d1644f62a15c49d7` | 2026-09-09 | 182,124 (measured 2026-09-11) |
| below100.html | below | 5.91 MB | `913afec23c8744e6` | 2026-09-07 | title-verified, not re-counted |
| income50.html | income | 4.24 MB | `fc3fdd3eeb4e29d1` | 2026-09-07 | title-verified, not re-counted |
| launi.html | launi | 6.28 MB | `afe57741bbb2bec8` | 2026-09-07 | title-verified, not re-counted |
| match50.html | match | 4.08 MB | `b001a21b955fa55d` | 2026-09-07 | title-verified, not re-counted |
| nola.html | nola | 5.60 MB | `4ab1a71a4378c28c` | 2026-09-09 | 87,578 (measured 2026-09-11) |
| sheltercove.html | sheltercove | 2.23 MB | `909b6f7f2c15cbd1` | 2026-09-07 | title-verified, not re-counted |
| uscorridor.html | uscorridor | 15.28 MB | `511fcb1434153574` | 2026-09-09 | 354,260 (measured 2026-09-11) |
| usnew5.html | usnew5 | 9.14 MB | `3b20f379ee224c6a` | 2026-09-07 | title-verified, not re-counted |
| uswide.html | uswide | 11.00 MB | `7e352579d5b19d35` | 2026-09-09 | title-verified, not re-counted |

**Blocked on one user-side step:** this session's GitHub credential cannot create
repositories (403), and `AGIFutureFoundation/Locator.X-editions` does not exist
yet. Create it once — `gh repo create AGIFutureFoundation/Locator.X-editions
--public` — and grant the Claude workspace access; the staged set then publishes
with `SKIP_BUILD=1 bash scripts/publish_editions.sh` from any checkout holding
these twelve files (their hashes above are the verification), or by re-running
the fetch-and-stage in a session. The editions stay live at their artifact URLs
in the meantime, and the site's `/editions/` page keeps saying honestly that
nothing is published to the channel yet.
