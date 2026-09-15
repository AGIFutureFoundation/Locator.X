<!-- The three-page investor deck. Every figure is a {{placeholder}} resolved at
     build time by scripts/deck_figures.py, which RUNS the measurement. There are
     deliberately no digits in this file outside the round-terms block, which is
     a management plan and is labelled as one. -->

# PAGE 1 — What this is

## Locator.X by AGI Corp

**Locator.X by AGI Corp turns fragmented property signals into verified, financeable, and actionable real-estate investments.**

AGI Corp is a technology-enabled real-estate development, acquisition and portfolio-owning company. Locator.X is its proprietary platform for discovering, verifying, underwriting, acquiring, developing, operating and selectively disposing of real-estate assets — and which it also licenses.

### The problem every investor tool shares

We registered {{landscape_tools}} tools investors actually buy — data and list vendors, dialers, CRMs, underwriting calculators, market analytics, property management. Every one of them is built to tell you what it knows. **Not one of them can tell you what it doesn't.**

That is not a missing feature. It is a structural inability. A product that has never said *"this county publishes no dated sale price, so this valuation cannot be supported"* cannot start saying it, because its entire pricing depends on coverage looking complete.

### What we built instead

A platform where every figure carries its evidence, and where the absence of evidence is a first-class answer.

- **{{records}}** parcel records live-measured across {{editions_measured}} of {{editions_total}} shipped editions, {{records_date}}
- **{{coverage_rows}}** coverage rows tracked honestly: {{coverage_shipped}} shipped, {{coverage_pulled}} pulled, {{coverage_named}} named, {{coverage_blocked}} blocked, {{coverage_norecord}} with no public record at all
- **{{usecodes}}** use codes mapped across {{jurisdictions}} jurisdictions, each carrying its source and date
- **{{submarkets}}** ranked submarkets across {{submarket_states}} states, {{corridors}} growth corridors, {{campuses}} campuses, {{projects}} announced projects, {{lodging}} lodging records
- **{{fleet_mb}} MB** of shipped editions, each a single self-contained file that runs with no server
- **{{modules}}** modules, **{{module_lines}}** lines of application code

### The proof is mechanical, not rhetorical

**{{gates}}** continuous-integration gates, each with failure modes proven by breaking the thing they protect. An assessed value is never presented as a transaction. A comparable is a recorded sale with a date or it is not a comparable. A strategy graded on a modelled figure is graded down for it, automatically.

Of the {{landscape_tools}} competitor prices we registered, **{{landscape_verified}}** are verified — because our own environment could not reach the vendors' pages, and we published that rather than quoting figures we could not check. That is the standard applied to our own numbers, in public, in a repository.

---

# PAGE 2 — Where it stands, including what is missing

## Honest position

A deck that lists only what works is a deck that gets discovered. This is the full picture, and it is generated from the same tables the engineering team works against.

### Shipping

- **{{capability_claims}}** measured capability claims, every module re-counted at build time
- Strategy engine comparing five investment plays on one record, each graded by the facts it rests on — and refusing to rank columns that rest on different quality of evidence
- In-app coverage panel stating what an edition **cannot** answer, recounted independently by the test fleet
- Academy: {{curriculum_items}} curriculum items, {{tracks}} tracks, {{lessons}} lessons
- {{articles}} long-form technical articles, {{article_words}} words, every figure resolved from measured data

### Not shipping, stated plainly

- **{{products_notbuilt}}** of {{products}} branded data products are **not built**; {{products_partial}} more are partial
- **{{agents_shipping}}** of {{agents}} agents ship outright; the rest are partial or absent
- All partial agents are blocked on one build: multi-user state, approval workflow, audit trail
- Real editions require a records session we cannot run from a sandboxed environment

### The scale ceiling, measured

Adding records costs **{{bytes_per_record}}** bytes on the wire and **{{heap_kb_per_record}}** KB in memory. The largest shipped edition holds {{largest_edition_records}} records in {{largest_edition_mb}} MB. Memory runs out roughly fifty times sooner than bandwidth does — a real engineering constraint we measured rather than discovered in production.

### Governance already in place

- **{{entities}}** entities, each stating what an investor does **not** automatically own
- **{{risks}}** risks, every one with a named owner and a mitigation; none claiming a risk is eliminated
- **{{linted_files}}** documents automatically linted for return projections, solicitation language and cross-entity ownership claims

---

# PAGE 3 — The round

## What is being discussed

<!--plan-->
| | |
|---|---|
| **Issuer** | AGI Corp — the exact legal entity, named on every instrument |
| **Instrument** | Post-money SAFE, valuation cap only — one standard form, unmodified |
| **Planning range** | $1.5M–$2.5M (a management plan, not an offer) |
| **Stage** | Pre-seed |
| **Exemption** | Regulation D, Rule 506(b) — accredited investors, no general solicitation |
| **Pro rata** | Side letter above a minimum cheque, not written into the instrument |
<!--/plan-->

### Use of proceeds

Core AI and shared IP; platform foundations for Cognition.X, Robotics.X and Locator.X; product team; security; customer pilots. Ring-fenced to the approved budget of the named issuer, with a board-approved Use of Proceeds Schedule attached to any financing.

We use one instrument form, unmodified, for every pre-seed cheque. No cap-and-discount stacking, no MFN layered on a cap, no bespoke side rights inside the instrument. The SAFE stack is modelled on a fully diluted basis — including the option-pool increase a Series A will require — **before** each new instrument is signed, not after the last one.

### What this does NOT convey

An interest in AGI Corp conveys rights in **AGI Corp only**. It does not convey ownership of any portfolio property, any asset-level SPV, or any other entity in the group — unless legal documents separately and explicitly establish that right.

Property capital enters a named SPV for a named asset. Operating capital never buys buildings. One cheque does not buy the group, and we would rather say so on this page than have it discovered in diligence.

### Why the discipline is the investment case

Every competitor sells volume: more records, more lists, more contacts. Competing there means competing with incumbent data licences and losing.

The defensible position is the one that is **expensive to fake**: a platform that says *we do not know* — and can prove it said so, in code, in CI, on every page. A product that has never had that mechanism cannot retrofit it, because the honesty is not a feature bolted on at the end; it is the architecture.

### Next step

Accredited investors reviewing this may request the diligence data room: entity register, risk register with named owners, capital structure, use-of-proceeds schedules, product roadmap, and the source repository with every validator readable.

**Contact AGI Corp to schedule a diligence conversation.**

---

*Private and confidential. This document is a summary for discussion with accredited investors and is not an offer to sell or a solicitation of an offer to buy any security. Any offering would be made only through definitive documents reviewed and approved by qualified securities, tax, real-estate and fund counsel. Figures describing the platform are measured at build time from the source repository and dated. Planning ranges are management plans and not commitments. Private placements are illiquid, high-risk investments and may result in the loss of the entire investment. Do not forward, post publicly or reproduce.*
