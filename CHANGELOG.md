# Changelog

Versions follow the scheme in [`docs/ROADMAP.md`](docs/ROADMAP.md): minor versions add a layer,
major versions change what an edition is. Dates are recorded only where the event is verifiable
from the repository or the fleet-sweep record; earlier lineage is reconstructed and marked as
such.

## [Unreleased]

- **The walkthrough as one downloadable file** — `scripts/pack_walkthrough.py`
  packs the recorded chapters and their poster frame into a single self-contained
  HTML document with the video inside it: no player embed, no CDN, no hosting.
  Open it from a disk with the network off and it plays. That is the same
  property every edition has, applied to the thing that explains the editions,
  which is what makes it postable, DM-able and archivable without depending on a
  video host still existing next year.

  The file carries share cards (`og:` / `twitter:`), a chapter rail, per-chapter
  copy, and three ready-to-paste captions whose every figure is measured and
  published in this repository. `--only` cuts a shorter version for a feed: seven
  chapters pack to 26.2 MB, a three-chapter cut to 12.5 MB.

  Built files are never committed (the same rule the editions follow); the packer
  is. `--check` verifies the copy a human actually reads — a chapter caption or a
  post that ships empty is a silent chapter — and `tests/run.py` runs it, since
  the footage itself cannot be in CI.

- **The product tour, recorded from the running application** —
  `scripts/record_walkthrough.js` drives the built app in headless Chromium and
  records seven chapters: the single-file edition, navigating by the record, a
  property drawer, underwriting and the closing file, the interchange formats and
  the shareable view, the three map layers, and the Academy with the coverage
  table. Captions are written into the page as an overlay, so the explanation and
  the thing being explained are the same recording.

  Nothing in it is a mockup, a re-creation or a generated image of a place —
  [`docs/GENERATIVE_VIDEO.md`](docs/GENERATIVE_VIDEO.md) draws that line and
  product footage belongs on this side of it. Each chapter records in its own
  browser context (Playwright finalises a video when a context closes) and opens
  the edition at a shareable-view URL rather than clicking its way back to a
  state, which is `src/permalink.js` earning its keep.

  One real bug found while writing it: setting `scrollTop` on a view element does
  nothing — every view scrolls through its own `.page` child and the drawer
  through `.dbody` — so the first cut held three chapters of a static screen. The
  recorder now animates the real scroll containers.

- **The gate between "built with real data" and "republished"** —
  `tests/edition_sweep.js`. `docs/PUBLISH_MAP.md` has said for weeks that file size
  is not the integrity check and the record count is; that check was performed by
  hand. It runs now: every built edition is driven in headless Chromium on the data
  machine and checked against the map — its `<title>`, its record count against the
  documented figure, zero page errors, zero map-error-channel rejections, and the
  footprint rule (every city label names a city the edition's own records carry and
  sits inside them; no campus pin outside the record footprint). A short build looks
  exactly like a good one, so `scripts/publish_editions.sh` now runs the sweep
  between building and publishing and refuses to publish if it fails.

  With no data tree — any clean checkout, CI included — `--parse-only` verifies the
  document it is driven by still parses, and `tests/run.py` fails if
  `docs/PUBLISH_MAP.md` stops naming all twelve editions or loses a documented
  record count. Proven by breaking it: unlinking one row and blurring one count
  fails with *"docs/PUBLISH_MAP.md now parses to 11 editions — it listed 12"* and
  *"only 2 edition(s) carry a documented record count"*.

- **Every map carried another region's cities** — measured on 2026-09-14 across
  all eleven editions: each one drew **67 place labels of which zero named a city
  that edition's own records carry**, plus **23 Bay Area university pins**. A New
  Orleans map labelled San Francisco, Oakland and San Jose; the US-corridor map
  pinned Stanford and UC Berkeley. The coordinates were correct and the places
  are real — they were simply on the wrong map, with nothing tying any of them to
  the records in front of the user.

  The cause was a 64-entry hardcoded Bay Area city list in `src/app.js` that no
  builder regionalised, and a campus fallback list chosen by guessing the region
  from the counties of the first 500 records.

  **Labels now come from the records.** One per city the edition actually holds,
  at the centroid of that city's own records, ranked by how many records carry
  the name — a record count, never a claim about which city matters. The label is
  also a control: clicking it focuses that city, the same action its rail chip
  performs. The city rail says how many cities exist and, when the 250-label cap
  bites, that the map labels the largest.

  **And a footprint rule, because this will happen again.** The edition's records
  define a padded bounding box, and no pin from any hardcoded list is drawn
  outside it. The Bay Area campus pins vanish from every edition that is not the
  Bay Area; the editions' own sourced POIs survive (the Baton Rouge fixture keeps
  its university). Measured after: 0 stray pins, and every city label naming a
  city in its own edition.

  Guarded on **every** edition rather than the first, because the defect was on
  every edition, and all four guards proven by breaking what they protect:
  appending one Bay Area label fails with *"1 city label(s) name a place not in
  this edition: San Francisco"*; moving a label off its records fails with *"3
  city label(s) sit outside their own records"*; removing the footprint filter
  fails with *"23 campus pin(s) outside this edition's record footprint: Stanford
  University, UC Berkeley, San Francisco State"*.

- **The 3D ZIP-tower layer ignored the map's filter** — every other thing on that
  map (pins, dots, property towers, the sector aggregation) draws the filtered
  set; this one read the whole edition, so filtering to one city left towers
  standing over records the filter had removed, with nothing on screen saying
  which set they described. It reads the same set as the map now, rebuilds when
  the filter moves, and its legend states the scope: *"12 ZIPs from 2,500 records
  in this edition"* against *"5 ZIPs from 1,042 records matching the current map
  filter"*. Building the source no longer deep-clones the whole ZIP collection,
  which matters now that it rebuilds on filter changes rather than only on toggle.

- **"Every candidate in three dimensions at once" drew the first 900** — the
  opportunity cube's heading claimed everything while `buildPts` sliced to 900 of
  a ranked set that reaches 1,981 in the demo fixture alone. The heading no longer
  says every, and the cube states what it is drawing: *"Drawing the top 900 of
  1,981 candidates that clear the threshold — the ranking is complete, the cube is
  a window on its head."*

- **The fleet smoke prints every error, not the first** — `errs[0]` hid two real
  failures behind a louder one while proving the guards above. Both the per-edition
  and the no-WebGL runs now print the whole list.

  Cost of all of it: **186 bytes** of built page (1,886,607 → 1,886,793 on the
  fleet demo), measured by building before and after.

- **A view you can send to someone** — an edition is one file with no server
  behind it, which is the product and which meant, until now, that two people
  holding the same file had no way to look at the same *thing* in it. There was
  no shareable state anywhere in the app: no fragment, no query, nothing. A
  colleague got "open the New Orleans one, filter to Mid-City, search Canal,
  it's the fourth one down".

  `src/permalink.js` puts the view in the URL fragment — screen, filters, chips,
  sort, the open property — and restores it on load. The fragment is the one
  part of a URL browsers never send to a server, so the no-server /
  no-accounts / no-tracking property is intact: a shared link travels in the
  email, not through us, and there is nowhere for it to be logged. A **Link**
  button sits with the GeoJSON and CSV exports; an untouched page keeps a clean
  URL, and a filter keystroke uses `replaceState` rather than filling the back
  button with forty entries.

  **The rule it exists to keep is the interesting half.** A link built in one
  edition and opened in another asks for records, cities and screens that are
  not there, and the tempting behaviour — apply what fits, drop the rest — hands
  the reader the whole unfiltered catalogue looking exactly like what they were
  sent. Every key that cannot be applied is named to the reader instead, in one
  sentence, and none of them is applied: *"This link asked for 3 things this
  edition cannot show: city "Nowheresville" — not in this edition; sel
  "not-a-real-id" — this edition does not carry that record; …"*. Same rule as
  the worksheet contract's refusal to launder a number, one screen further out
  ([`docs/INTEROP.md`](docs/INTEROP.md)).

  It costs **2.5 KB of built page** — the fleet demo goes 1,884,059 → 1,886,607
  bytes, 0.135% — measured by building the same demo twice with the module in
  and out of `lxbuild.MODULES`, not estimated from the source file.

  Both halves are guarded in `tests/fleet_smoke.js` and both guards were proven
  by breaking what they protect: the round trip is asserted by **reloading the
  page at the link** rather than calling restore in place (dropping `city` from
  the encoder fails with *"the view did not reach the URL"*), and the
  half-works case asserts all three absent keys are reported, none applied, and
  the reader actually told (silencing the unknown-record report fails with
  *"a link asking for three absent things reported: city,v"*).

- **Two views claimed to score "every property on the map" and did not** — the
  Dashboard and the Deals table both score the *whole edition*; the map shows the
  filtered set. With a filter on, the map read **1,042 of 2,500** while the
  Dashboard scored all **2,500** and its own lede asserted the two were the same
  set. That is not a silent discrepancy between screens, it is a false sentence
  in the interface, on a platform whose first rule is measure before asserting.

  The copy now says what each view actually scores, and a live scope note states
  the relationship whenever the two differ — *"Scoring all 2,500 records in this
  edition. The map is filtered to 1,042 right now — this view deliberately
  scores the whole catalog, so the two counts differ."* Silent when the scopes
  agree.

  Nothing about what either view computes has changed. They are portfolio views
  with their own filters and that is deliberate; the defect was describing them
  as something else. Both halves are guarded and proven: restoring the old copy
  fails with *"a view still claims it scores every property on the map"*, and
  removing the note fails with *"the scope note stayed hidden while the map was
  filtered"*.

- **The map's error channel is now watched on every edition** — it is where a
  whole class of failure speaks that neither a thrown exception nor a `pageerror`
  ever sees, and it is how the property-tower layer went unrendered in every
  edition while every signal the tests looked at said it worked. Nothing was
  listening. `tests/fleet_smoke.js` now hooks `map.on('error')` as soon as the
  map exists and fails the edition on anything it says.

  A sweep of all 29 views with every overlay switched on found **zero** further
  rejections — the towers were the only one. That negative is worth as much as
  the fix, and it is a real negative rather than a vacuous one: reinstating the
  data-driven opacity makes the same sweep report four errors naming both
  layers.

  Both guards proven independently — the tower-specific one by restoring the bad
  opacity, the generic channel watch by adding an unrelated invalid layer, which
  fails editions the tower assertion never touches.

- **The property-tower field has never rendered, in any edition** — the layer
  asked for a data expression on `fill-extrusion-opacity` to draw the emphasised
  top decile solid and the rest faint. MapLibre does not support data
  expressions on that property: it answered *"layers.lxptower.paint.fill-extrusion-opacity:
  data expressions not supported"* on the map's own error channel and **refused
  the layer**. Not an exception and not a page error — `addLayer` returned,
  `paint()` returned true, `toggle()` reported success, the button flipped to
  "hide towers" and the legend drew. The source was added and the layer never
  existed. Nothing in the repository was listening to the channel where that
  failure speaks.

  The emphasis is preserved exactly by splitting on the same flag with a
  `filter` — which *is* supported — and giving each of the two layers a static
  opacity.

- **A tower is one property, and now opens it** — every tower has carried its
  record id in the feature since the layer was written, and clicking one did
  nothing, so the tallest and most interesting marks on the map were the only
  ones you could not open. They now answer a click the way the dot layer always
  has, with the cursor change so the mark looks clickable before you try it.

  Locked by a fleet-smoke assertion that watches the map's **error channel**,
  checks the layers are really in the style, that features carry ids, that
  selecting one opens the drawer, and that switching off removes both layers.
  Restoring the data-driven opacity fails it by name.

- **Typing in the search box cost three seconds of blocked main thread** — one
  filter pass costs **332 ms** at the largest shipped edition's measured record
  count (uscorridor, 354,260), and the field re-rendered on every character, so
  a five-letter street name blocked the main thread for **3,177 ms**. It is now
  **0.4 ms**, with the identical result: 59,090 of 354,260 both ways. The filter
  *state* is still read synchronously so nothing observes a stale value; only
  the expensive re-render waits 180 ms for a pause in typing. Dropdowns are not
  debounced — picking one is a finished decision.

- **The two rails recomputed the whole catalog on every keystroke** — `cityStats()`
  and `districtStats()` are computed from `allListings()`, not from the filtered
  set, so their content cannot change while somebody types; they were recomputed
  anyway, two full passes per character. `cityStats` additionally called
  `price()` on every record to fill a `prices` array **nothing ever read**. Both
  are now memoized on the catalog length — the same idiom `allListings()` itself
  uses — which took the keystroke from 402.6 ms to 334.0 ms before the debounce
  landed on top.

  Both are locked by a fleet-smoke assertion on the *behaviour*: the count must
  not move on the keystroke itself, must have moved once the window passes, and
  must restore when the box is cleared. Removing the debounce fails it.

- **Generative video, bounded before it was built** — the boundary is decided
  once in [`GENERATIVE_VIDEO.md`](docs/GENERATIVE_VIDEO.md) and enforced by a
  gate: synthesized pictures may appear in Academy and brand material where
  nothing is depicted as a real place, and **never** attach to a parcel, a
  property, an address, a real building or a named real city, county, parish or
  state. The reason is that a synthesized picture of a real address is a
  *stronger* claim than a fabricated number, not a weaker one — more persuasive,
  harder to caveat, and it survives being screenshotted away from every
  disclaimer attached to it.

  The existing **Render video reel** is unaffected and is the model of what a
  property-facing video is allowed to be here: canvas-drawn from the case's own
  measured numbers, depicting no place at all.

  `content/academy_scenes.json` holds five title-sequence scene pairs, rendered
  by `scripts/build_scenes.py`, which refuses to build if a prompt names a real
  place (vocabulary built from the repository's own state table, county and
  parish names and shipped city list, so it grows as coverage does), reads like
  an address, mentions a record, is a tagline rather than a paragraph, asks for
  more than one shot, or fails to re-establish its world before morphing. Each
  rule was proven by writing a scene that breaks it.

  Nothing connects to a model: no credential is stored and no edition gains a
  runtime dependency. The library is text, which is reviewable and gated without
  a network.

- **One view shipped into every edition and opened in none** — each spec lists
  the tabs its edition hides, and nothing stopped a view from being hidden by
  *all* of them. One was: the house-hack finder is inlined into all eleven
  editions (10,424 bytes of source, 8,488 minified) and cannot be opened in any
  of them. The only editions whose specs would show it are the three refusing
  templates, which never load. Every spec author made a sensible local decision;
  the emergent result — surface that ships and cannot be reached — was nobody's
  decision and was invisible to everything.

  It is now a **declaration** (`build_state.UNREACHABLE_VIEWS`) rather than an
  accident, and `tests/run.py` fails **both ways**: a view hidden everywhere that
  is not declared, and a view declared that some edition has started showing
  again. The second half matters as much as the first, or the table quietly rots
  into a lie. Declaring it is not endorsing it — whether to drop the module from
  `lxbuild.MODULES` or give an edition a reason to show it is an open question
  for the platform owner, and the declaration says so.

- **The record layer, summed for the first time** — eleven state files in
  `docs/states/coverage/` answer the seven LOCATOR gates for their counties, one
  row per gate, each carrying a status from the fixed vocabulary the directory's
  own README defines. Ninety of those rows exist and **the total was stated
  nowhere**: each file was honest about itself and no one could see the sum.
  `scripts/coverage_rollup.py` reads every row and writes
  [`ROLLUP.md`](docs/states/coverage/ROLLUP.md).

  What it shows is worth knowing. **8 of 90 rows are in a built edition.**
  Another **50 have been pulled but not packed** — the rows came back, their
  quirks are documented, and they are still not in front of a user. That backlog
  is larger than everything still unprobed (26 `named`), and it is the biggest
  piece of finished work sitting behind the shipping step. Five states are 100%
  pulled and 0% shipped: North Carolina (10 rows), Indiana (9), New Mexico (7),
  Arizona (4), Utah (4).

  The script's one judgement is refusing to make one: a status that does not
  begin with one of the five vocabulary terms stops the build rather than being
  bucketed by guess, because an invented status is exactly the drift that
  directory exists to prevent. Proven by putting `mostly done` into a state file
  and watching it refuse by name.

- **Districts are a navigation axis, and the rail states its own coverage** — the
  map could be browsed by city but not by district, though every record already
  carries one (`nb`, falling back to the assessor's `anb` — the precedence the
  list and drawer already used). The district rail groups the records by it,
  reframes the map on the district's measured extent, and — the part that
  matters — offers **the records that carry no district as their own selectable
  bucket**, with a coverage line saying how many that is. On the fixture: *3
  named · 2,000 of 2,500 records carry no district.* A rail that quietly showed
  only the named ones would present a fifth of the catalog as though it were all
  of it. No boundary is invented: a district's extent is the bounding box of the
  records that declare it, never a drawn polygon.

- **The fixture's neighborhoods were not places** — they were assigned
  `nbs[i % 3]`, by position in the loop, so every neighborhood was scattered
  across the whole island and a district's extent was the entire map. The
  district framing could not be demonstrated or tested. They are now three
  contiguous bands by cell latitude, and each district spans 20–50% of the
  island rather than 100%. Still only one record in five carries one, because a
  roll that names a neighborhood for every parcel is not the roll anybody gets.

- **Corridor pull readiness, generated from the probe record** — "add properties
  to the corridors" is 24 different jobs, and the difference was already
  measured in `market/corridors.json` and buried in prose. `scripts/corridor_readiness.py`
  reads each metro's `parcel` block and writes
  [`docs/CORRIDOR_PULL_READINESS.md`](docs/CORRIDOR_PULL_READINESS.md): **15 of
  24 corridors can gain properties from a session that starts today**, 5 were
  never probed, and 4 carry recorded verdicts (one endpoint answers perfectly
  with a roll that cannot carry a screen; one has no roll at all). Five of the
  confirmed corridors recorded an actual `returnCountOnly` result, totalling
  **571,912 parcels** — and every one of them is in Louisiana, which puts the
  largest confirmed block of pullable parcels in the same state as the New
  Orleans editions, sharing one use-code vocabulary. It classifies from the
  prober's own explicit verdict and refuses to assign one where the note records
  none.

- **The second map renderer was broken, and no test had ever run it** — the
  platform ships two map implementations, MapLibre GL and a CanvasMap fallback
  for machines with no WebGL, and every test run used the GL one. `CanvasMap`
  implemented thirty methods of the MapLibre shim and not `getCanvasContainer()`,
  so on the fallback the sector-fabric overlay threw a `TypeError` and its
  control silently did nothing. Fixed as parity, not as a patch: the shim
  implements `getCanvasContainer()` and `getCanvas()`, `resize()` now emits the
  `resize` event MapLibre emits and overlays listen for, and the two unguarded
  call sites degrade instead of throwing. `tests/fleet_smoke.js` gained a second
  pass with WebGL disabled — and says so loudly if the browser ignores the flags,
  rather than reporting a pass it did not earn.

- **An unknown view id blanked the whole app, silently** — `showView()` toggles
  `.active` on every view whose id matches, so a name matching nothing switched
  them all off and left the chrome over an empty page with nothing logged. Found
  by calling `showView('underwrite')` when the id is `uw` — the same typo sitting
  in the closing-packet assertions committed an hour earlier, which read the
  sheet out of the DOM and passed while the app on screen was blank. The id is
  now refused loudly, and the test asserts the sheet is **visible**, not merely
  present.

- **The paperwork stopped being written in California** — two defects with one
  cause: the transaction material was literals rather than facts resolved from
  the record. The Letter of Intent printed `, CA ` into every address in every
  edition, so a New Orleans property's offer draft said the parcel was in
  California; and the twelve-item due-diligence checklist was written for San
  Francisco and shipped unchanged everywhere, asking a Louisiana buyer for an SF
  3R report and for rent-board history Louisiana has no such thing as, while
  never mentioning a franchise agreement to anyone buying a hotel. Its ticks
  were stored by POSITION, so any edit silently re-pointed every saved tick at a
  different item.

  Both are replaced by a **closing file assembled from the record**:
  `content/closing_packet.json` (12 clause families, 24 document requests, 3
  contingencies, each citing the course lesson that teaches it), generated by
  `scripts/build_packet.py` into `src/packet_data.js` and
  [`docs/CLOSING_PACKET.md`](docs/CLOSING_PACKET.md), rendered against a
  property by `src/packet.js`. It drafts no clause language and states no rule
  of law: every state-sensitive item is a **question for counsel**, and the only
  state facts shown — foreclosure regime, tax-delinquency mechanics, transfer
  tax, HFA — are *parsed* out of the state guides that carry their sources and
  dates, never restated. Measured: a hotel draws 21 items including the STR
  report and the franchise agreement; a single-family house draws 13 and
  neither. A multi-state edition reports the state as **unknown** and prints a
  labeled blank rather than guessing one.

- **The underwriting says where the deal stops working** — break-even rent and
  the cushion to it, break-even rate and headroom, the loan this NOI supports at
  DSCR 1.25, and DSCR under +200 bp, rent −10%, vacancy +5 pts and all three at
  once. All arithmetic over the stack already computed; unknown inputs stay
  unknown, and a blank row is a missing input rather than a pass.

- **A screened set can leave the platform without being laundered** —
  `src/geoexport.js` writes the filtered set as RFC 7946 GeoJSON and as CSV over
  the same columns, for QGIS, ArcGIS, a Mapbox tileset or anyone else's map.
  Every feature carries `lx:price_basis` (a price here is an assessed value, or
  a ZIP-level index estimate that is **not a price**, or an imported row that is
  neither) and `lx:geometry_basis` (the parcel, or a **ZIP centroid** that is
  not the parcel), because both qualifications vanish the moment a record leaves
  the interface that made them visible. Rows without a coordinate are dropped
  *and counted*. The RESO Data Dictionary aliases ship in a separate block
  marked asserted-not-verified: no egress to reso.org from the build container
  (probed 2026-09-11). Contract in [`docs/INTEROP.md`](docs/INTEROP.md).

- **One map framing per city** — every edition carried a single `region` box, so
  a multi-city edition always opened at a bounding box that framed none of its
  cities. The city rail reads the cities out of the records, renders one chip
  each with its count, and reframes the map on that city's own measured extent.
  An edition naming one city renders no rail, because one city is not a choice.

- **CI had been red for six runs without finding anything** — `tests/run.py`
  builds the synthetic fleet demo, the builders inline d3-delaunay, maplibre,
  fflate and terser from `node_modules`, and the workflow never installed them.
  Three checks failed with a `FileNotFoundError` naming a path instead of a
  cause. The workflow now runs `npm ci`, and the determinism guard states the
  cause itself when the install is absent. A gate that cannot run is not a gate.

- **The front door is generated, and leads with coverage** — the landing page
  was a static card grid that described the platform in adjectives while every
  figure a visitor would want lived a click away. It is now built by
  `scripts/build_landing.py` from the same committed data the market pages and
  the articles read: **749,765 parcel records measured**, 12 editions, 464
  submarkets ranked, 48 use codes, 24 corridor areas, 4,443 lodging records —
  each one moving when the measurement moves, with nobody having to remember to
  edit a paragraph.

  Beside the headline sits a tile map of the 51 jurisdictions with the twelve
  the index bundle actually covers filled and the thirty-nine absent drawn
  hollow, captioned *absent means not measured, never scored low*. Every inner
  page states its coverage before its conclusions; the front page had been the
  one place that did not. Cards are grouped by what a visitor came to do —
  start here, the measured record, learn the trade — rather than listed flat,
  and `pages/index.html` leaves the repository so it cannot drift from the data
  it now reports (the generated-vs-committed guard covers it).

- **The synthetic fixture was never deterministic** — it says "deterministic"
  in its own docstring and three builds of identical code produced three
  different files. The cause was `set(citymap.values())`: iteration order over
  a set of strings moves with `PYTHONHASHSEED`, so the city series came out in
  a different order every run. Only the key ORDER moved, never a value, inside
  a packed base64 payload nobody diffs — which is exactly why it survived every
  build, every deploy and every fleet smoke. Sorted, and `tests/run.py` now
  builds the fixture twice and compares the decompressed payloads (the page
  bytes carry a gzip timestamp, so the comparison has to be on content).
  Verified by reinstating the `set()` and watching the suite name it.

- **`scripts/placegen.py`** — the geography machinery lifted out of the fleet
  demo into a shared module with two profiles: `market_island()` (coast, street
  grid, districts, parks, river, rail — what the demo uses) and `campus()`, for
  a trades campus: an irregular boundary, a quad, hall footprints on two arcs
  with the loud wide-door bays pushed to the edge the way a real trades campus
  is laid out, bent walking paths rather than straight spokes, zones, and
  stations placed **on** the path network for the same reason parcels sit on
  streets. Halls carry their trade, kind and zone, so a caller can colour,
  filter or route by discipline without inventing a join. Deterministic given a
  seed, and invented — the module docstring is explicit that it exists to
  exercise a renderer honestly, never to imply a survey.

- **The demo map became a place** — the fixture drew its island as one
  rectangle, its parks as two more and its roads as three straight lines, then
  scattered property uniformly inside the box. It rendered as confetti on a
  beige rectangle, which told a viewer nothing about whether the renderer works
  and nothing about whether the app reads like a city. It now generates an
  irregular coastline from three harmonics, a street grid rotated off true
  north with diagonals, districts and parks as irregular polygons, a meandering
  river with a tributary and a rail line with a spur — every polyline clipped to
  the coast — and places **every property on a street**, which is the single
  thing that makes a parcel map look like a place rather than a scatter plot.
  27 road features, 73 coastline points, all still invented and all still on a
  fictional island near 0°N 0°E.

  One artifact found and fixed on the way: property ZIPs were chosen as "every
  other ZIP", which on a six-wide grid is alternating *columns* — so the whole
  catalogue drew as three vertical stripes down the island. A seeded sample
  scatters them. A stripe looks like a bug because it was one.

- **Two more articles** — the submarket ranking (why drift is the component
  most rankings leave out, and why the coverage statement is printed before the
  first row) and announced jobs per housing unit permitted (the four specific
  ways that ratio lies, and the corridor area where it goes legitimately
  negative). Five articles, 7,567 words, every figure resolving from the
  measured data at build time.

- **Articles, with every figure generated rather than typed** — a new
  `content/blog/` plus `scripts/build_blog.py` renders long-form articles in
  the house style at deploy time. The design rule is that an article states a
  number by naming it (`{{fig:corridor_heap_gb}}`) and draws a chart by naming
  it (`{{chart:scale-heap}}`), and both resolve from `market/*.json` at build
  time — so an article can never quote one figure in a sentence and draw a
  different one in its chart, which is the ordinary failure of writing about
  your own data. `tests/run.py` fails any article asking for a figure or chart
  the measured data cannot answer. Three articles ship: underwriting in a
  non-disclosure state, what a property record actually costs in memory, and
  the 4,443 lodging records the product could not search for.

- **The instructor profile ships empty, like the notes layer** —
  `content/instructor-profile.json` and `curriculum/INSTRUCTOR_PROFILE.md` are
  the paved road for the profile that leads into the courses, and they contain
  **no drafted biography**. The annotation layer's founding rule already
  covered this in as many words: the platform asserts no words, *biography* or
  endorsement it was not supplied. A biography is a set of claims about a real
  person's life; a platform that refuses to invent a parcel's sale price does
  not get to invent one. The guide carries the shape, the supply workflow, and
  one rule that is not stylistic — a claim about a feeling or a motive needs no
  reference, a checkable claim does. Unsupplied, the build renders no profile
  page at all rather than a placeholder.

- **The market pages were generated AND committed** — making them a deploy-time
  build product removed them from `pages/`, except the deletion was never
  actually recorded, so seven stale copies stayed in the repository. Nothing
  broke, which is why nobody noticed: the deploy copies `pages/` first and the
  generator overwrites afterwards, so the served site was always correct while
  the committed twins drifted further behind with every later fix. Removed for
  real, and `tests/run.py` now asserts the generated set and the committed set
  are disjoint — verified by restoring the duplicates and watching the suite
  name all seven.

- **The demo could never draw the thing the platform is for** — `predict.js`
  pools its backtest across series and returns null below **eight** of them;
  the synthetic fixture generated **six** ZIPs. Off by two, and the
  consequence was that the measured-error band — the single most distinctive
  thing this platform does — could not draw in the public demo at all, while
  the predictions page advertised "not testable, too few series" as though
  that were a property of the method rather than of the fixture.

  The fixture now carries **24 index ZIPs with property in 12 of them**, which
  fixes two things at once. The backtest runs (`VALUE METHOD, TESTED` goes
  from "not testable" to **100%**, and the band draws), and the coverage panel
  finally says something true: it always claimed "the index bundle holds N
  ZIPs, most of which hold no property here" while every ZIP held property.
  Separate bundles that do not cover the same ZIPs is what real editions look
  like, and it is what that panel exists to state.

  Each series also gets its own seeded wobble. Perfectly smooth curves let the
  log-linear fit land almost exactly, and the honest consequence of that is a
  band near zero width — a demo advertising an accuracy the method does not
  have on real series. `fleet_smoke.js` now asserts the band actually draws
  and that the page never reads "not testable", so the fixture cannot slip
  back under the floor unnoticed.

- **`docs/LOUISIANA_DEVELOPMENT_FRICTION.md`** — what in the Louisiana record
  actually slows a development, ranked by what each blocks, synthesised from
  material already sourced in the repository (the state guide, the coverage
  inventory, the measured editions) rather than from new legal research: this
  container has no egress to parish, clerk or state hosts, and the page says
  so at the top. Non-disclosure of sale prices leads, because it is the one
  that disables a whole desk — the Comps desk cannot function in Orleans or
  EBR, and the platform's answer is to say so rather than estimate. Then the
  2023 tax-sale transition (mid-phase-in, so verify per parish before
  bidding), civil-law title chains, executory process, insurance as the line
  that breaks coastal pro formas, block-by-block millage, and per-parish
  assessors. Each carries what it blocks, what the platform does about it, and
  the probe that would advance it.

  It also records a measured gap that is this platform's own: **no Louisiana
  jurisdiction is mapped in the crosswalk**, although the two Louisiana
  editions hold 213,381 measured records between them — so a class screen
  cannot run on the anchor market. That is one `groupBy` per jurisdiction, and
  it is already the first probe in the lodging expansion plan.

- **Predictions leads with the answer** — the page opened with roughly 180
  words of method and put its first number below the fold, so a reader had to
  earn the answer by reading an essay. The method is unchanged and one click
  away under the lede; above it now sits the headline projection. **Which ZIP
  gets the headline is a doctrine decision, not a design one:** the obvious
  choice is the biggest projected move, which is exactly what a page should
  not lead with, because the largest forecast is usually the least trustworthy
  series. It leads instead with the series whose own held-out month came
  closest — where the method has earned the most trust on this edition's data
  — and states that error in the card. The drawing animates because the shape
  is the finding: history is fixed and draws first, the projection extends
  from its last published point, and the measured band widens with the horizon
  because that is how the error grew. Values never move, only the reveal, and
  the finished state is drawn immediately under reduced motion. Where the
  backtest is not testable the card says so and draws no band.

- **The Type filter reaches every screening class — hotels included** — the
  app classified property into four buckets (`sfr`, `multi`, `condo`, `apt`),
  which left three of the crosswalk's six screening classes unreachable: there
  was no way to search for a hotel, and the 4,443 lodging records measured
  across the shipped editions fell into "5+ units" because a hotel has many
  units. `kindClass()` now returns the crosswalk's vocabulary and the filter
  offers lodging, student housing and mobile-home park alongside the
  residential classes. Two orderings are load-bearing and both were settled
  against measured labels rather than guessed: student housing is tested
  before lodging, because Onondaga's `Room/dorm` code maps to student_housing
  while the editions render it as "Inn, lodge, rooming or fraternity house —
  Room/dorm"; and lodging is tested before the unit-count rules, which is what
  makes hotels findable at all. Verified against the 16 real `kind` strings
  measured in the shipped editions — every one classifies as the crosswalk
  says. The synthetic fixtures gain a label per class (including the Bay's
  compound "Hotel / motel / MH park") so the demo exercises every branch, and
  `fleet_smoke.js` now asserts each class selects a non-empty set — an option
  that filters to nothing being the same defect as no option, only harder to
  notice.

- **The map is visible again: tools are a disclosure at every width** — the
  map toolbar was permanent on desktop, putting thirteen controls in a slab
  across the top-left of the map they exist to annotate. It now sits behind a
  single Layers control at all widths, shut by default, with the choice
  remembered per browser and Escape to close. Every control stays in the DOM
  open or shut, so deep links, keyboard paths and the modules writing into the
  tower/sector/legend slots are untouched — the rule the grouped navigation
  already follows. **A real bug surfaced doing it:** `.maptools` sets an
  explicit `display`, which beats the browser's `[hidden]{display:none}`, so
  the attribute did nothing outside the old mobile media query — the panel
  read as hidden to a script while staying visible to the eye, and the first
  version of the test asserted the attribute and passed while the screenshot
  showed it open. The override is now stated once for every width and the
  smoke asserts visibility.

- **The gloss pass** — a surface layer over the existing tokens, not a second
  design system: every colour resolves from `--panel` / `--line` / `--ink`, so
  light, dark and high-contrast keep working. The section bar becomes a
  segmented control, tabs and buttons become pills with a light gloss and a
  settle-easing, cards answer the pointer, figures are tabular, and focus
  rings are visible everywhere. Vibrancy is applied only where something sits
  behind it — the map tools, the cover card — because translucency over a flat
  grid costs a compositor layer and shows nothing. High contrast opts out of
  translucency entirely, and every transition sits inside the reduced-motion
  guard.

- **The edition scale ceiling, measured — and it is memory** — four shipped
  editions were driven headless at their real record counts and the result
  changes what "add 50,000 records per area" means. A record costs **54 bytes**
  packed but **~3 KB of JS heap**, so `uscorridor` already sits at **1.02 GB of
  heap** at 354,260 records while its page is only 16 MB. Adding 50k costs
  +2.57 MB on the wire and **+150 MB in memory**; on the two largest editions
  that lands past 1.1 GB, which no phone survives. The single-file edition
  holds every record in memory by design, and that design has a ceiling near
  300–400k records — so growth past it is an architecture change (split by
  area or by class), not a bigger file. Recorded with its method in
  `market/edition_scale.json`, including what was *not* measured.

- **The lodging record, counted** — 4,443 lodging records across the four
  measured editions (`uscorridor` 2,955, `bay` 1,044, `nola` 322,
  `nola-classic` 122), essentially all carrying both a value and a unit count.
  Counted by each record's own `kind` field: a first pass that also searched
  the source field over-counted `uscorridor` more than tenfold (31,117 against
  2,955) and was discarded, because source strings are not use classes. The
  vocabularies differ sharply by jurisdiction — one flat `Hotel / lodging` in
  New Orleans against six spellings in the corridor counties — so a national
  lodging screen has to go through the crosswalk, not a string match.

- **`docs/HOTEL_EXPANSION.md`** — 96 candidate areas in three evidence tiers,
  generated by `scripts/hotel_candidates.py` from the measured layer and
  drift-checked in `tests/run.py`. Tier A is screenable now (6 jurisdictions
  whose record publishes a lodging class); tier B has proven stock and an
  unmapped vocabulary (14); tier C has a measured market and unknown lodging
  (76). The headline gap: **neither Orleans Parish nor any Bay Area county
  maps a lodging class**, yet those two hold 1,366 of the measured lodging
  records — the anchor markets carry the stock and the crosswalk cannot name
  it. The ask was 100 areas; the measured sets yield 96, and the list stops
  where the evidence does rather than being padded to a round number. Tier C's
  ranking signal is stated as residential, so a high rank is a reason to look
  and never evidence of a hotel market.

- **The lineage documents point at the measured layer** — the platform guide
  and the editions manifest carried the corridor era's illustrative figures
  behind a "historical document" banner, which was honest but left a reader
  with nowhere to go for the real numbers. Both banners now name where the
  measured record layer is (`market/editions.json` for the live record
  counts) and link the figure-by-figure reconciliation, so the lineage is
  navigable rather than merely disclaimed.

- **The link-rot sweep was passing over nothing; now it checks the citations
  that matter** — v1.2 shipped the sweep claiming it covered "every URL in
  `docs/resources/` and `docs/states/`", proven by the script exiting zero.
  Measured 2026-09-11: those directories hold **zero URLs** between them, 6
  and 20 files respectively, because their rows cite agencies and statutes by
  name rather than by link. The sweep exited zero over nothing — a vacuous
  proof, and the certainty error this platform exists to catch.

  `scripts/check_external_links.py` now walks the sourced data files as well
  as markdown: **361 URLs** from `market/` and `crosswalk/` (project
  announcements, campus enrolment sources, permit and population series)
  against 3 from markdown. Published artifact URLs are skipped by design —
  they are private to their owner, so an anonymous probe cannot tell "gone"
  from "not yours", and the sha256 manifest is the stronger check. A
  `--collect-only` mode lists the set without network, which is what this
  egress-less container can verify; the probing runs on GitHub runners.
  `tests/run.py` asserts the data-file citation count and two known source
  hosts, so the coverage cannot go vacuous again — verified by reinstating
  the markdown-only sweep, which the suite names. The roadmap's v1.2
  milestone carries the correction and its measurement.

- **The roadmap reconciled with what is actually true** — §2 still read "the
  repository is release-ready; flipping it public is a Foundation switch",
  which stopped being true two days and fifty-three commits ago. Measured
  rather than assumed before rewriting: `v1.0.0` is tagged at `529513d`
  (2026-09-09), the GitHub API reports the repository `public` with
  Apache-2.0 detected, and `origin/main` carries 53 commits since the tag.
  §2 now says so and names the three layers that landed in them, each with
  its check.

  The distribution layer — the public site and the editions channel — had
  shipped with no roadmap entry at all, so it gains one as **v1.4** (§7),
  with a proof column per item and its two open items stated as blockers
  carrying the measurement that establishes each: GitHub Pages is not
  enabled (`has_pages: false`, measured 2026-09-11, which is also why
  `configure-pages` fails every run) and the editions companion repository
  does not exist. Both are repository settings, not code. Distribution joins
  the standing workstreams and the sequencing graph; the sequencing note's
  claim that the licence is the only hard external dependency is replaced by
  the two that actually remain. Sections after v1.3 renumber; the four
  documents linking to roadmap §4 and §5 point below the insertion and are
  unaffected (link gate green).

- **The market renderer is now under test, including the path the live data
  never reaches** — `tests/run.py` renders all seven market pages from the
  committed data and reads them back for what the data says must show: the
  net-loss ratio, the unmarked headcounts, the un-recounted editions, and no
  raw Python `None` anywhere on a page. Then it does the part that matters:
  all four unknown enrolments in the live data sit outside Louisiana, so the
  campus page never renders one and the null-handling code is never exercised
  — so the suite writes a null into a Louisiana row on a synthetic market tree
  (`build_market_pages.py` takes an optional market dir, as the gate takes an
  optional root) and proves the page still renders, still lists that campus,
  says "not published" beside it, and leaks no `None`. Verified by reinstating
  the original bug: sorting on the null crashes the render and the suite names
  it. A passing test that cannot fail is not a test.

- **The market layer becomes data plus a renderer, and gains a gate** — the
  seven market pages stop being hand-committed HTML and become a build
  product, the same status as `demo.html` and `crosswalk.html`. The figures
  they render now live in `market/` as five sourced data files extracted from
  the shipped editions (24 corridor areas with 20 dropped and 37 caveats, 73
  announced projects, 152 campuses, the 464-submarket belts ranking, the 12
  published editions with their hashes), each carrying its extraction
  provenance; `scripts/build_market_pages.py` renders all seven at deploy
  time, so a page can no longer drift from the data it claims to show.

  `market/validate_market.py` gates the data in the crosswalk gate's raising
  posture, and writing it found three real defects. **A figure's absence means
  different things in different fields:** `permits` and `pop` come from
  external published series where absent is not zero, but `jobs` and `records`
  are counts over sets this platform holds, where `0` ("this catalogue holds
  nothing here") and negative are real measured values — Natchitoches carries
  −450 announced jobs from a closure, and the page now draws it as a net loss
  instead of sorting it silently. **Four campuses publish no enrolment at
  all:** they were `null` in the source and the renderer would have crashed on
  the first Louisiana one (`-None`) while quietly swallowing the rest into
  city totals; they now render "not published", stay counted as campuses, and
  are excluded from every total with the exclusion stated beside it. **Only 29
  of 44 announced headcounts carry an explicit `jobsBasis`:** the other 15 now
  say "no basis line in the record — read the headcount as the announcement's
  own, unconfirmed" rather than showing a dash that reads as "none".

  The gate's eighth rule is cross-file: every measured record count must
  appear in `docs/PUBLISH_MAP.md`, so the data and the documented verification
  cannot drift apart. `tests/run.py` proves that rule fires by drifting a
  count on a synthetic tree, the same way it proves the stale-pair check.
  Market gate joins the CI set; all six gates green.

- **The measured market layer joins the public site, mined from the shipped
  editions themselves** — six new market pages and a master dashboard, every
  figure extracted 2026-09-11 from the live published editions and carrying
  the source and as-of date those editions publish. `market-dashboard.html`
  lists all twelve shipped editions with their live record counts: four
  measured this session by driving the published artifacts headless
  (bay-ledger 182,124 · uscorridor 354,260 · atlas_nola 125,803 · nola
  87,578 — each matching the documented 2026-09-09 verification exactly,
  zero page errors), the other eight marked fetched-and-title-verified
  rather than silently trusted. `new-orleans-louisiana.html` and
  `sf-bay-area.html` join each market's measured editions to its
  High-Potential-Belts submarkets and its sourced project record (42
  Louisiana / 19 California announcements with per-row status and
  jobs-basis). `high-potential-belts.html` republishes the 464-submarket
  rent-versus-price ranking with both published views, its open weights and
  its coverage stated first; expansion is named as a data job — absent
  states join when their ZIPs carry both series, never before.
  `jobs-to-housing.html` renders the corridor record's announced-jobs per
  permitted-unit measure across 24 areas with all 37 carried caveats;
  `core-cities.html` lists the corridor anchors live, staged and dropped —
  dropped named rather than hidden; `louisiana-universities.html` renders
  the 49-campus Louisiana enrolment record behind the Baton Rouge edition,
  source and term per row. All eleven site pages driven headless: zero page
  errors, every internal link resolving.

- **The corridor-era dashboards join the repository as annotated lineage** —
  the three surviving pages of the earlier three-map dashboard generation
  are preserved under `pages/legacy/`, each behind a fixed banner stating
  its figures are illustrative, with the un-preserved Bay page's links
  repointed at the live Bay ledger. Their completion summary lands as
  `docs/CORRIDOR_PROJECT_COMPLETION_SUMMARY.md` under the same historical
  header as the platform guide, opening with a figures reconciliation
  against the measured layer: the one figure it got exactly right (87,578
  New Orleans records) and the ones that match no measurement (500K
  national / 245K Bay / 120K Baton Rouge, and every score, tier, median
  and percentile), with the strategy sections kept as lineage only.

- **The editions channel: one command from data machine to live site** —
  `scripts/publish_editions.sh` (run where the data tree lives) builds every
  filled edition and publishes the HTML plus an integrity manifest to the
  public companion repo `Locator.X-editions`; `scripts/build_editions_index.py`
  (run by deploy-pages) clones it, verifies every file against its sha256
  before it may appear, stages the verified editions under `/editions/`, and
  generates the index of exactly what is live. Refusals are loud twice over:
  publishing an empty set is refused (it would silently take editions down),
  and a hash mismatch is named on the page rather than served. With nothing
  published yet the page renders an honest empty state, so the new landing
  card always resolves. All three paths verified locally: empty state,
  verified staging, and a deliberately corrupted file refused by name.
  Channel documented in docs/PUBLISH_MAP.md.

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
