# Changelog

Versions follow the scheme in [`docs/ROADMAP.md`](docs/ROADMAP.md): minor versions add a layer,
major versions change what an edition is. Dates are recorded only where the event is verifiable
from the repository or the fleet-sweep record; earlier lineage is reconstructed and marked as
such.

## [Unreleased]

- **The real record layer joins the public site** — a new
  `scripts/build_crosswalk_page.py` renders `crosswalk/usecodes.json` into
  `crosswalk.html` at deploy time: all 8 jurisdictions, 48 code mappings
  (44 measured, 4 transcribed-unverified and flagged as such on the page),
  the 12,339 parcels behind the measured counts, each jurisdiction's value
  field ("an assessment, never a price"), ranking notes, and the caveats
  found the hard way — a straight rendering of the sourced data file,
  nothing invented at build time. The landing page gains a "real record
  layer" section: the crosswalk page plus links to the coverage
  inventories, the pull queue, and the interop contract on the public
  repository, with the synthetic-vs-real boundary stated in the section
  lede. Verified: 48 code rows and 4 unverified flags rendered, zero page
  errors.

- **The demo carries a large database** — the synthetic fleet scales to
  ~11,500 deterministic records (bay 2,500; below-market 1,500; corridors
  1,200 each; every edition sized to its character), exercising the app's
  list caps, pin caps and ranking engine at real volume while remaining
  obviously synthetic end to end. Page grows only 1.23 → 1.59 MB thanks to
  the packed pipeline. Fleet smoke rerun at scale: 11/11 editions, zero
  page errors; the criteria chip filtered 307 of 2,500 live.
- **Contract & underwriting anatomy** (`docs/CONTRACT_ANATOMY.md`) — the
  purchase-agreement clause families and the underwriting file taught as
  education: what each piece is for, which are state-sensitive (pointing at
  the sourced state guides), every underwriting number mapped to its kind
  per `docs/INTEROP.md`, and contingencies framed as the legal machinery
  for resolving unknowns. States its own boundary first: not a contract,
  not legal advice, and a "contract generator with all state and local
  laws built in" is refused by design — the platform does not draft
  binding language or assert statute-level claims without a source and a
  date. Linked from CLAUDE.md.

- **The whole app is under CI for the first time** — a new `fleet smoke`
  workflow builds the synthetic-fleet demo from source (no data tree) and
  drives every edition in headless Chromium via the committed
  `tests/fleet_smoke.js`: each of the eleven editions must load with zero
  page errors, its own title and fixture count, and the full version
  selector; the first edition also exercises the Locator-X-criteria chip as
  a real control. The smoke reads the fleet from the page itself rather
  than hardcoding it, runs on pushes and PRs that touch the shell, and
  complements — never replaces — the five validate gates and the data
  machine's real-edition sweep. Verified locally before commit: 11/11
  editions clean against the optimized build.
- **`docs/INTEROP.md`** — the worksheet JSON contract as a stable, citable
  interface: the exact shape, the four kinds of place a number can live,
  additive-only versioning, the conformance rules every consumer follows,
  and the no-laundering rule with its load-bearing example (the app's
  export ships `insurance: null` because an estimate is not a quote).
  Linked from CLAUDE.md's where-things-live table.

- **Optimized demo build** — `scripts/build_fleet_demo.py` now composes the
  public demo with the same compression machinery every shipped edition uses
  (`lxbuild.pack`: gzip + base64 + a synchronous script-element loader),
  applied to all three heavy payloads: the terser-minified shell, the
  minified eleven-edition fixture data, and MapLibre itself; only fflate,
  the decompressor, ships raw. Measured, not estimated: the file falls
  3.17 MB → 1.23 MB (−61%) and the gzip-transport wire size 0.91 MB →
  0.81 MB (−11%) against the previous build reconstructed from HEAD for a
  fair comparison. A `--fragment` flag emits the same page without the
  document skeleton for hosts that supply their own. The earlier
  uncompressed choice traded page weight for readable comments; with the
  repository public the readable source is one click away, so the visitor's
  download wins. Verified under headless Chromium: three editions on the
  document variant and one on the fragment, zero page errors, 14 selector
  entries each.

- **The public site carries the whole app** — with the repository public,
  `deploy-pages` now assembles the comprehensive website: `pages/` (landing +
  seven companion pages) plus `demo.html`, the complete 84-module application
  shell over deterministic synthetic fixtures, generated at deploy time by
  the new `scripts/build_fleet_demo.py` and never committed. The demo carries
  a version selector for every shipped edition in `build_state.py`'s registry
  — each on its own fictional-island map — with the three wave templates
  listed disabled with their real refusal reason, and a fixed banner stating
  that nothing on the page is a real record. Built with `lxbuild.standalone`
  (uncompressed, every rationale comment readable — the checkable-tool
  argument applied to the demo). The landing page gains the app card;
  `docs/PUBLISH_MAP.md` records the site layout, dated. Verified locally:
  the generated document loads with zero page errors, 14 selector entries,
  and the default edition's 90 fixtures.

- **`package.json` now declares everything a build actually needs** — `fflate`
  and `terser` were required by `lxbuild.py` (the gzip loader shell and the
  minifier) but missing from the dependency list, so `npm install` on a clean
  checkout could not feed a build; found by running a real assemble in this
  container. Both added with the lockfile committed for pinned installs, and
  `.build_cache/` (created by `lxbuild`'s minify cache) is now gitignored.

- **The map can show exactly the properties that meet the Locator X
  criteria** — a new "Meets the Locator X criteria" chip on the find/map
  filter row applies the full buy box from the Underwriting tab (price,
  score, cap rate, DSCR, units, evidence grade, category) to the map pins
  and the list. It is membership in the same `LXUW.matches()` set that tab
  computes — one definition of the criteria, never a second copy — and the
  count line names the active thresholds while the chip is on. Honesty
  edges handled out loud: a record whose DSCR is unknown cannot pass a
  DSCR floor and is excluded while the chip is on (the tooltip says so
  instead of hiding it), and if the match set cannot be computed the chip
  turns itself off with a toast rather than silently not filtering. No new
  property rows: adding records to the maps takes the desktop pull session
  (`docs/PULL_QUEUE.md`); this container cannot reach county hosts and
  fabricates nothing. Verified: syntax gates, `matches()` export under the
  stub harness, all repo gates; runtime behavior queued for the fleet
  sweep on the data machine.

- **The app exports to the desk — and refuses to launder its one estimate** —
  the record-driven Underwriting sheet gains a "Desk worksheet JSON" button:
  the open case in the standalone worksheet's own shape (per-unit rent, opex
  excl. taxes & insurance, the worksheet's own debt arithmetic), importable
  by the worksheet page and renderable by any edition's Desk-worksheet
  panel. The insurance field ships BLANK on purpose: the app carries an
  estimate, the worksheet field demands a written quote, and writing one
  into the other would launder a guess — so the exported DSCR reads unknown
  until a real quote is typed. Every input's derivation travels in a
  `provenance` map ("an offer, not a record", "not a rent roll", "not a
  T-12"), which the desk panel and the worksheet import note both display.
  Built as a pure `LXUW.deskRecord` function, verified end-to-end under
  headless Chromium (16 checks): the mapped reference case imports with its
  unknown intact and completes to DSCR 0.89 the moment the quote is typed.
- **Ninth evidence lesson: where a number lives** — the applied-courses
  evidence track teaches the four kinds the tooling now enforces (public
  record / demand the document / quote / measurement), the laundering
  failure the vocabulary exists to stop, and lands on the app's own
  deliberate blank; drill included, rendered and answered in the smoke.
- **`build_state.py --all`** — one entry point for the fleet: every filled
  spec runs, unfilled templates are skipped BY NAME (a refusal stays
  visible, never a silent no-op); `tests/run.py` drives the dry run through
  it and asserts all 11 specs + 3 named skips.
- **The whole fleet is spec-driven; four editions' eyebrows fixed** — every
  shipped edition now has a `build_state.py` spec, transcribed pair-for-pair
  and in execution order from its hand builder (nine added: `below`, `income`,
  `launi`, `match`, `nola-classic`, `sheltercove`, `uscorridor`, `usnew5`,
  `uswide`, joining `nola`/`bay`); all eleven dry-run clean. `tests/run.py`
  holds builder and spec in lockstep by AST comparison — the same pairs, in
  the same order, and the same title, or the suite fails — so a fix landing
  on one side can no longer drift from the other. The originals remain
  canonical until the fleet sweep proves byte-parity (roadmap v2.0).
  Enabling find: `check_pairs.py` upgraded to sequential semantics (each find
  must match *at its turn* against the mutating text, exactly as a builder
  runs), which surfaced thirteen more silent no-ops — nine dead generic
  `'SF Bay Area'` pairs whose only occurrence an earlier pair had already
  consumed, and four shadowed eyebrow replaces, meaning `launi`,
  `uscorridor`, `usnew5` and `uswide` had shipped a "New Orleans" dashboard
  eyebrow instead of their intended "Baton Rouge & Louisiana university
  cities" / "US growth corridors" wording since those lines were written.
  Fixed by folding the intended wording into the first (live) pair; 80 live
  pairs now verify sequentially clean across 14 builders.
- **Fleet parity gate; two dead pairs removed** — new `scripts/check_pairs.py`
  extracts every per-file builder's literal replace pairs via the `ast` module
  (no builder executed, no data or node_modules needed) and fails when a `find`
  no longer exists in current source, because `str.replace()` silently no-ops
  on a stale find and the edition ships the original prose. Its first run
  measured 38 flags across 14 builders: 20 were deliberate no-op placeholders
  (now skipped), and 18 were two genuinely dead pairs carried by nine builders
  (`'locator.x — Bay Area'`, `'San Francisco bay area'`) whose finds never
  matched any committed `src/body.html` — deleted, since the eyebrow retitle
  they aimed at is already covered by each builder's live
  `'Locator X dashboard · SF Bay Area'` pair. `tests/run.py` now runs the
  check (93 pairs verified) and proves the failure mode on a synthetic tree
  with one dead find, so the check itself is checked.
- **Every worksheet input names where its answer lives** — the underwriting
  worksheet's fields each carry a source line in one of four honest kinds:
  public record (assessor parcel record, tax collector's bill), demand the
  document (rent roll, T-12, STR report — rents and occupancy are not public
  record), quote / term sheet (insurance and loan terms are offers, not
  records), or measure it (the campus-ring walk). The unknowns banner, the
  assumptions ledger, and the JSON export all carry the same sources, so an
  unknown is now a navigation target, not a dead end — and the app's desk
  panel names where each missing answer lives when it renders an export that
  carries unknowns (older exports without sources still render). Smokes
  extended: 22 worksheet + 14 interop checks, all passing.
- **Nebraska landing rows** — `docs/states/coverage/nebraska.md` gains a
  landing-rows section for probes #1 (Douglas) and #4 (Lancaster): exactly
  what each probe measures, the repository row where the number lands (the
  crosswalk, this file's verdicts, the refusing `omaha-template` /
  `lincoln-template` specs), and an honest "not probed / template refuses,
  by design" status per row, so the desktop pull session writes into
  pre-built rows instead of prose. The pull queue's #1 and #4 entries link
  to the section and name the waiting scaffolds.
- **Desk-worksheet interop** — a standalone analysis can now travel into an
  edition. The underwriting worksheet gains an Import that is the exact inverse
  of its export (inputs come back as typed; a record exported with unknowns
  imports with the same unknowns, said out loud), and a new dependency-free
  `src/deskws.js` panel on the app's Underwriting tab renders a loaded export
  read-only beside the record-driven pipeline — desk numbers were typed by a
  person, so they are labeled as such and never overwrite anything the tab
  computed from the record; an export carrying unknowns shows the missing
  fields by name. Verified under headless Chromium (13 checks): the round trip
  restores DSCR 0.89 exactly, unknowns survive both import paths, and both
  surfaces reject non-worksheet files cleanly; the panel was exercised in a
  container-only harness with zero page errors. Editions pick the module up on
  their next build (wired once in `lxbuild.py`; fleet-sweep verification
  queued as usual).
- **Worksheet sensitivity strip; wave-two edition scaffolds** — the underwriting
  worksheet gains a sensitivity table (the same arithmetic with one input nudged
  at a time: interest rate ±0.50, the class's revenue driver ±5%; green clears
  the target, rendered only when the base DSCR is known; hand-verified nudges —
  rate +0.50 → DSCR 0.85 and rent −5% → 0.83 on the reference case). And
  `build_state.py` gains `omaha-template` and `lincoln-template` — the wave-two
  Nebraska markets from the Foundation directive, each refusing to build until
  the desktop pull session (queue #1 Douglas, #4 Lancaster + the UNL campus
  ring) fills the REQUIRED fields from measured results; the Omaha spec records
  the sourced disclosure-state note (documentary stamp, coverage row 2026-09-04)
  and defers the comps-desk decision to whoever fills it from the pull. Both
  refusals locked in `tests/run.py`.
- **Per-class underwriting worksheet (standalone)** —
  `pages/locator-x-underwriting-worksheet.html`: the platform's underwriting
  arithmetic on numbers the user supplies, for all four anchor classes —
  apartments 5+, hotels (RevPAR model, insurance labeled *quoted, incl.
  wind/storm* and required), small multifamily, and student housing (priced by
  the bed, 9- vs 12-month lease structure, summer occupancy separate) — with
  NOI, annual debt service, DSCR, and the bisection break-even solver against
  the Investment Standard's lender-ready DSCR 1.20 (target editable). The
  doctrine is enforced in the arithmetic: a blank load-bearing input makes every
  dependent output **unknown** with the missing fields named — never a quiet
  default — while optional income blanks are labeled "none recorded"; an
  assumptions ledger lists every entered number with a verify-before-relying
  note, and the JSON export carries the disclaimer and the missing-fields list.
  Verified under headless Chromium (16 checks): a hand-computed apartments case
  matches to the dollar (NOI 106,800, DSCR 0.89, break-even rent $1,270), the
  solved break-even occupancy fed back in reproduces DSCR 1.20, and
  unknown-propagation fires on a missing quoted-insurance line. Linked from the
  companion-pages landing card grid.
- **Voice layer completed across the Academy pages; viewer power tools** — the
  cohort-review page gains the same spoken guided tour as the learning
  environment, and the applied-courses reader gains a "Read this" control that
  reads the open lesson (or the cover) aloud and stops itself on navigation so
  the voice can never lag the page (browser text-to-speech only; controls never
  render without `speechSynthesis`). The top-properties viewer gains CSV export
  of the current filter result — header says `assessment`, never price, every
  row keeps its `value_field` label — plus keyboard navigation ("/" to search,
  arrows walk rows with a visible highlight, Escape clears). All verified under
  headless Chromium, the viewer against a real `top_screen.py` index built from
  the test suite's synthetic fixtures: 16 checks, zero page errors.
- **Learning-environment page: read-aloud + spoken guided tour** — the standalone
  learning environment (`pages/locator-x-learning-environment.html`) now carries the
  voice layer on a surface that ships without a build machine: a Listen button in the
  course sheet reads the sheet's own visible text, and a Guided tour button walks the
  page section by section, scrolling each into view and reading its own heading and
  lead copy. Browser text-to-speech only (local, no network); where speechSynthesis is
  absent neither control renders. Verified under headless Chromium: capability-gated
  rendering, tour start/highlight/stop lifecycle, zero page errors.
- **Walkthrough agent hardening** — `src/walkthrough.js`: a manual tab switch during a
  walk pauses the tour instead of the agent yanking the view back, and the highlight
  pulse respects `prefers-reduced-motion`.
- **Reproducible page screenshots** — `scripts/shoot_pages.js` captures all seven
  companion pages at 1920×1080, including deck slides via their ArrowRight navigation
  (a plain screenshot only ever shows slide one of a 100svh scroll-snap deck); output
  dir gitignored. First used by hand for the explainer video's style lock, now a
  one-command artifact.
- **Explainer-video production record** — `docs/marketing/explainer-video.md`: the
  locked narration (as measured against the speech gates), the screenshot-derived
  style decision, per-figure sources in this repo, and the dated production state
  (9/12 blocks, 11/12 takes; stopped by a measured credit exhaustion, resumable
  without regenerating anything).
- **User's guide button + voice walkthrough agent** — a visible "User's guide"
  header button (`src/body.html`) opens the existing app guide, and a new
  `src/walkthrough.js` module adds a hands-free walkthrough: the app opens each
  section in tour order, reads the same `LXHome.VIEWS` help text aloud through
  `voice.js` (browser text-to-speech, no network), highlights the active tab, and
  advances when the narration ends; where the browser implements speech
  recognition it also takes spoken commands (next / back / pause / resume /
  repeat / stop, with voice.js's Chrome-sends-audio-to-Google disclosure), and
  where speech is absent it steps silently on a visible timer rather than faking
  a capability. Content comes only from the written guide, so the spoken tour
  cannot drift from it. Wired once in `lxbuild.py`; every edition picks it up on
  its next build (build machine required — noted for the fleet sweep).
- **Doctrine smoke tests in CI** — `tests/run.py` (stdlib-only, synthetic fixtures,
  no data needed) locks the honesty guarantees a refactor could silently break: the
  NAL probe's PII strip and owner_out_of_state flag, class_screen's sample floor /
  unverified warning / unmatched surfacing / clean unknown-jurisdiction refusal,
  top_screen's declared-fields-only ranking with counted exclusions and correct
  national ordering, build_state's clean dry-run and template refusal, and the
  repo gates themselves. Wired as a fifth CI step; gate lists in CLAUDE.md and
  CONTRIBUTING.md updated.
- **Top-properties pipeline** — the national "find the top properties" machinery:
  crosswalk jurisdictions gain measured/documented `value_field`, `locality_fields`
  and `dedupe_key` declarations (absent means unknown — scripts must not guess);
  `scripts/top_screen.py` merges any number of pulled jurisdictions into one index
  (top-N per jurisdiction × class + national top-N, city/district facets, zero-value
  exclusions counted, unranked-with-reason where no value field is declared,
  assessments never called prices); `pages/top-properties.html` is the searchable
  viewer — bundles no data by design, loads a locally built index, shows each
  jurisdiction's evidence notes beside the numbers.
- **First record-layer case candidate (v1.3)** — `docs/cases/wework-lease-duration.md`:
  the duration mismatch from published filings, every claim marked documented/reported,
  sources verified 2026-09-10, with the three circulating restructuring figures kept
  deliberately separate. In-app porting follows the module supply workflow.
- **CLAUDE.md** — agent onboarding: the gates to run, the never-bent rules, where
  everything lives, and the environment gotchas (egress, dry-run, lockstep pairs).
- **Review fixes across the session's tooling** — six findings from a correctness pass:
  `build_state.py` now refuses (and dry-run flags) missing extra modules with the exact
  path instead of a raw traceback; the link sweep retries GET when a host drops HEAD
  (killing a false-rot path); `class_screen.py` and `fl_nal_probe.py` gained real flag
  parsing (flag-anywhere ordering, clean errors on missing values); `gen_courses.py`
  prereq lookups are defensive and an identity comprehension removed (catalog output
  byte-identical).
- **`docs/PULL_QUEUE.md`** — the ordered ten-probe queue for the next desktop data
  session: what each pull unlocks (Douglas NE seeds a market; one Orange FL file flips
  67 counties), which rows and crosswalk entries it advances, and the two build-machine
  verifications queued behind it (fleet sweep after the shell change; build_state parity).
- **Seven corridor states graduated into coverage inventories** — NC, OH, IN, UT, AZ,
  NM, NY (`docs/states/coverage/`): every row a measured 2026-09-04/05 finding cited to
  the pull recipe, including the field-reliability verdicts (Wake's TOTUNITS trap,
  Franklin's no-year-built-for-apartments, Marion's no-price ceiling, Bernalillo's
  wrong-server reversal, Sandoval's no-use-class ceiling, Onondaga's GFA-vs-SQ_FT).
  Egress routes dated in the coverage index: container curl and API-side WebFetch are
  both policy-blocked (2026-09-09/10); the desktop browser pane remains the only route
  to county records.
- **The 90-day path, state by state (v1.3)** — `docs/states/ninety-day-path.md`: F6's
  three phases (calibrate / build flow / close or walk clean) with every state-varying
  checkpoint mapped to the state guides — tax-line recompute rules, disclosure regimes,
  distress-channel mechanics, closing customs, the regional "big four" inspection lists,
  and what "won" means before a bid is final — plus four state archetypes.
- **Asset-class layer** — hotels / apartments 5+ / small multifamily / student housing /
  MHP / mixed: `crosswalk/usecodes.json` (48 sourced-and-dated code mappings across 8
  jurisdictions, gated by `crosswalk/validate_usecodes.py` in CI), `scripts/class_screen.py`
  (sample floor of 5 before any median, unmatched codes surfaced, unverified vocabularies
  warned), and `docs/asset-classes/README.md` — the measured region matrix and the
  criteria a new region must meet.
- **Nebraska opened (wave two, Foundation-directed)** — `docs/states/coverage/nebraska.md`:
  Omaha, Sarpy, Lincoln and the smaller metros as expansion candidates with anchors named
  and probes defined; nothing scored without data.
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
