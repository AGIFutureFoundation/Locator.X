<!-- The product whitepaper. Every figure is a {{placeholder}} resolved at build
     time by scripts/deck_figures.py, which RUNS the measurement — the same
     module content/investor/DECK.md uses. There are no digits in this file
     outside placeholders. This document is deliberately separate from
     content/investor/DECK.md: it describes the PLATFORM, never the company,
     the entities, or any ask — docs/company/ owns that layer, and the two are
     never mixed (CLAUDE.md: "never mix mission, software, property, robotics
     and investor economics"). -->

# What Locator.X is

## A map that says what it does not know

**Locator.X turns a county's own public records into a map you can actually underwrite from — and the one thing it refuses to do is guess.**

Most property software tells you what it knows. Locator.X is built around a harder discipline: when a county publishes no dated sale price, no rent feed, or no use-code manual, the platform says so in the product itself — in the map, in the dashboard, in the score — instead of filling the gap with a plausible number nobody can trace back to a source.

- **{{records}}** parcel records live-measured across {{editions_measured}} of {{editions_total}} shipped editions, {{records_date}}
- **{{modules}}** application modules, **{{module_lines}}** lines of code — one self-contained file per edition, no server required
- **{{usecodes}}** use-code mappings across {{jurisdictions}} jurisdictions, each one sourced and dated
- **{{fleet_mb}} MB** across the whole shipped fleet

---

# Nine ways to look at the same property

Every record on the map can be colored and sized by any of nine lenses — not nine separate products, nine separate *questions* about the same parcel:

- **Goal fit** — the default lens: how well a property matches the plan you set, sized by fit, colored red/yellow/green
- **Locator X category** — asset, house-hack, value-add, growth, liability, or unrated, by the platform's own cash-flow-first test
- **Cash flow** — colored by the modeled monthly number, never disguised as a guaranteed one
- **Conversion class** — sized by unit count, for stock that could plausibly convert use
- **Estate-pipeline signal** — cross-referenced against the eleven signals below
- **Predictive: live distress records** and **Predictive: near-term forecast** — modeled, and labeled as modeled
- **Below market (index)** — relative to the ZIP's own published index, not a flat national number
- **Evidence grade** — how much real record actually backs this parcel, as its own first-class lens rather than a hidden asterisk

A property that scores well on *fit* and poorly on *evidence grade* is not hidden — it is shown exactly that way, on the map, at the same time.

---

# Eleven cross-signals — and the one that scores nothing, on purpose

Locator.X checks every record against eleven outside signals: estate pipelines, lock-in, corporate ownership, insurance exposure, foreclosure (two angles), blight, permit activity, short-term-rental conversion, federal REO, and fair-market-rent bands.

The eleventh signal is bankruptcy-estate sales — federal trustee sales that move below market and fast. It is wired into the product, and it scores **nothing**, deliberately: the federal courts that publish these filings do not offer a bulk, parcel-keyed feed, so rather than approximate a match the platform never can verify, the signal stays visibly present and visibly empty until a real court-record pull lands. A signal that cannot be answered honestly is shown as unanswered, not quietly dropped from the product.

---

# Coverage, broken down honestly

Every data point the platform could plausibly carry is tracked in one inventory, and every row gets one of five honest statuses — never a silent blank.

{{chart_coverage}}

**{{coverage_rows}}** rows tracked this way: **{{coverage_shipped}}** shipped, **{{coverage_pulled}}** pulled, **{{coverage_named}}** named but not yet pulled, **{{coverage_blocked}}** blocked on a real, stated obstacle, and **{{coverage_norecord}}** where no public record exists at all. The fifth category is not a failure state — a county that publishes nothing is a fact about the county, not a bug in the product.

---

# The measured market layer

Beyond the parcel map, the platform ranks where to look next using the same measure-first discipline:

- **{{submarkets}}** ranked submarkets across **{{submarket_states}}** states
- **{{corridors}}** growth corridors, **{{campuses}}** campuses, **{{projects}}** announced projects tracked
- **{{lodging}}** lodging records benchmarked

Every market page is rendered from this measured layer at deploy time — never hand-typed, never stale by construction.

---

# The Academy teaches what the platform measures

{{chart_academy}}

**{{curriculum_items}}** curriculum items across **{{tracks}}** tracks and **{{lessons}}** lessons, plus **{{articles}}** long-form technical articles (**{{article_words}}** words) — every figure in every lesson and article resolves from the same measured data the map itself runs on, not a separately-maintained copy that can drift out of sync.

---

# The proof is mechanical, not written

**{{gates}}** continuous-integration gates run before anything ships, and **{{capability_claims}}** measured capability claims are re-counted at every build — not asserted once and left to go stale. A validator that claims to check something is only trusted here after someone deliberately breaks the thing it protects and confirms the check actually fails. That discipline is what this whitepaper's own numbers are built from.

---

# Request a walkthrough

This whitepaper is generated the same way the Academy and the market pages are: every figure above was measured from the running platform at build time, not written by hand. Seeing it live is the natural next step — ask for a walkthrough of the map, the signals, and the coverage panel on real (or clearly-labeled synthetic) data.

---

*This whitepaper describes the Locator.X platform only. It is informational, not an offer, solicitation, or description of any investment, security, or financial return — that material, where it exists, lives in a separate, separately-governed document.*
