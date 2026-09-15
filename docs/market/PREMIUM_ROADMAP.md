# The premium roadmap — what makes this worth paying for

This is the product roadmap that falls out of [`LANDSCAPE.md`](LANDSCAPE.md) (what the
category sells) and [`GAP.md`](GAP.md) (what this repository measurably ships). It is
scoped to **features and integrations**, and it sits under
[`../ROADMAP.md`](../ROADMAP.md), which governs versions, data waves and distribution.
Where the two disagree, the version roadmap wins.

Every item below carries four things, and an item without all four is not on the list:

- **Why** — the register row or investor job it answers.
- **Proof** — the check that says it shipped. A gate, a test, or a measured number. Not
  a demo.
- **Blocker** — what must be true first. `none` means it can be built today, in this
  container, with no data pull and no egress.
- **Cost of being wrong** — what a sloppy version of this feature would assert that it
  cannot defend. This column is why several obvious features are not here.

## The premium argument, stated once

Twenty-five tools sell **volume**: more records, more lists, more contacts, more calls.
Competing on volume means competing with PropStream's data licences and BatchLeads'
dialer minutes, and losing. The four rows in [`GAP.md`](GAP.md) that read *no equivalent
in the category* — source grading (`src/evidence.js`), the use-code crosswalk
(`crosswalk/usecodes.json`), the backtest (`src/predict.js`), and the interop contract
([`../INTEROP.md`](../INTEROP.md)) — are not features the category forgot. They are
features that are **expensive to fake**, because each one is a mechanism for saying *we
do not know*, and a tool that has never said that cannot start.

So the premium tier is: **the deal you can defend in a lender's conference room.** Every
figure traceable to a record, a date and a grade; every model labelled a model; every
absence named. That is what the roadmap buys, in this order.

## Phase 1 — Build now, no data required

These need nothing this container cannot reach. They are the highest ratio of investor
value to blocker in the whole plan.

### 1.1 The strategy switchboard — **shipped**

One property, every strategy, side by side: buy-and-hold, flip, BRRRR, house hack,
conversion. `src/underwrite.js` (552), `src/conv.js` (88), `src/dev.js` (158) and
`src/hacks.js` (137) each answered one and none of them answered together;
`src/switchboard.js` (438) asks all five through those modules' own public interfaces
and re-derives none of them — the underwriting desk's own sheet, the house-hack
finder's own math, the conversion lab's own model, and comps.js's own account of why
it came back empty. Each column is graded on the **facts** it rests on; the levers a
user sets (down payment, rehab preset, holding period) are listed but excluded, because
a first cut that counted them graded every column D on every property in every edition,
and a grade that cannot move is decoration.

- **Why** — the single best-supported request in the research, and the one gap that needs
  no new data. The register's underwriting tools (DealCheck, BiggerPockets) model one
  strategy per run.
- **Proof** — `tests/fleet_smoke.js` opens the switchboard in all 11 editions and asserts
  five columns render, every column carries one of the three states, no computed column
  is missing its grade band or its basis list, and — the assertion that matters — a
  non-computed column carries a named reason rather than a blank or a zero.
- **Blocker** — none. **Shipped.**
- **Cost of being wrong** — a comparison table implies the strategies are equally
  supported by the record. They are not: a flip needs comps, a BRRRR needs a rent model.
  Each column carries its own evidence grade, and where two columns rest on different
  kinds of input the screen says so and refuses to rank them.

### 1.2 The coverage panel — what this edition cannot answer — **shipped**

The oldest outstanding app recommendation. Every edition should be able to say, in the
app, which questions its record layer cannot answer: fields the county does not publish,
use codes not mapped, the parcels outside the footprint.

- **Why** — "unknown is an answer" is currently enforced in the repository and only
  implied in the UI. No tool in the register does this at all.
- **Proof** — `tests/fleet_smoke.js` opens the panel in all 11 editions and asserts the
  named-gap count is non-zero and each gap names its source; `tests/edition_sweep.js`
  cross-checks the panel against the coverage inventory row for that edition.
- **Blocker** — none. **Shipped** as `src/coverage.js` (227): field coverage measured
  through `src/evidence.js`'s own tests rather than a second list that could drift from
  them, classification counts, an edition-level strategy probe, and the footprint. There
  is deliberately no overall score — a single number would be read as a ranking, and the
  useful answer is the specific list.
- **Cost of being wrong** — a coverage panel that under-reports gaps is worse than none,
  because it converts an unknown into an implied pass. Nothing in it is written down:
  `tests/fleet_smoke.js` recounts every field independently from the records and fails
  if the panel's printed numbers disagree by one.

### 1.3 Strategy-aware buy box

`LXUW.matches` holds one buy box. Premium investors run several concurrently, one per
strategy and market, and want to know which properties cross into a box this week.

- **Why** — REsimpli and InvestorFuse sell pipeline; nothing in the register lets the buy
  box itself be a first-class, versioned, shareable object.
- **Proof** — round-trip through `src/permalink.js` (241) and `src/views.js` (189): a box
  encoded into a URL restores to the identical matched set, and reports every key it
  could not apply — the rule `permalink.js` already enforces.
- **Blocker** — none.
- **Cost of being wrong** — a box that silently drops an unmet criterion returns matches
  that do not match. `permalink.js` already refuses to apply a partial restore; this must
  inherit that behaviour rather than reinvent it.

### 1.4 Portfolio view

The register's operate tools (AppFolio, Buildium, Rentec, TenantCloud, RentRedi) all
begin at the portfolio. Locator.X has no object above the property.

- **Why** — the report's "replace the app stack" gap: data and underwriting live in one
  file, portfolio does not exist.
- **Proof** — a portfolio of *n* records reproduces, to the cent, the sum of the *n*
  individual underwrites; a fleet-smoke assertion holds the two in agreement.
- **Blocker** — none for the read-only view. Operating actuals are Phase 3.
- **Cost of being wrong** — a portfolio total that blends modelled and recorded figures
  without marking which is which. Every aggregate carries the worst evidence grade among
  its inputs, not the average.

## Phase 2 — Integrations that respect the boundary

Each of these is an integration the category treats as table stakes, re-cut so it does
not import a claim the platform could not defend.

### 2.1 Import contract, widened

`src/deskws.js` (91) and [`../INTEROP.md`](../INTEROP.md) already define a worksheet
JSON shape with a **no-laundering rule** — an imported number never loses its provenance
on the way in. Extend the same contract to MLS exports, CSV lead lists and the register's
own export formats.

- **Why** — investors arrive with a stack. Import is the cheapest way to be the place they
  work, and the most dangerous way to inherit somebody else's unsourced figures.
- **Proof** — an import fixture per format, each asserting that every imported field
  arrives carrying its origin, and that a field with no stated origin is graded as such
  rather than adopted.
- **Blocker** — none; fixtures can be synthetic and marked synthetic.
- **Cost of being wrong** — this is the laundering risk in its purest form. A PropStream
  CSV imported without provenance turns a vendor's estimate into a Locator.X figure. The
  no-laundering rule exists for precisely this and must be tested, not trusted.

### 2.2 County record integrations, by the queue

Not a new mechanism — the existing one, run. [`../PULL_QUEUE.md`](../PULL_QUEUE.md) holds
the ordered probes and [`../PULL_RECIPE.md`](../PULL_RECIPE.md) the mechanics.

- **Why** — 8 editions shipped against 90 gate rows. Depth of record, not breadth of
  contact, is the product.
- **Proof** — `tests/edition_sweep.js` on the rebuilt edition; the coverage inventory row
  advances from `named` to `pulled` to `shipped` with a date.
- **Blocker** — **hard.** This container has no egress to county or GIS hosts (dated in
  [`../states/coverage/README.md`](../states/coverage/README.md)); it runs over the
  desktop browser pane. This is a user-side session, not an agent task.
- **Cost of being wrong** — fabricating a row to fill a gap. The one unrecoverable error
  in the project.

### 2.3 Document and title retrieval, linked not mirrored

DataTree sells deeds, mortgages and liens. `src/records.js` (250) already assembles the
sources that exist per jurisdiction and keeps what the user gathers.

- **Why** — closes the Evaluate job without licensing a document corpus.
- **Proof** — per-jurisdiction link resolution checked the way
  `scripts/check_links.py` checks internal links: a dead source link is a failed build.
- **Blocker** — none for link assembly; retrieval stays user-side.
- **Cost of being wrong** — implying a document was retrieved and verified when a link
  was merely offered.

### 2.4 Rent and STR signal, honestly sourced

`src/conv.js` and `src/rebuild.js` produce models labelled as models. The premium version
needs a defensible rent signal.

- **Why** — Rentometer, Mashvisor and AirDNA are bought for exactly this, and the register
  shows no public price for Rentometer at all.
- **Proof** — a backtest in the shape `src/predict.js` (587) already uses: a stated
  method, a holdout, and a published error. A rent estimate with no error bar does not
  ship.
- **Blocker** — a licensed feed or a defensible public proxy. **Unresolved**, and named as
  unresolved rather than quietly modelled.
- **Cost of being wrong** — a rent number is the input every other number multiplies. An
  unsourced one contaminates the whole memo.

## Phase 3 — Close the loop

The report's fifth gap, and the one nothing in the register does well: operating results
feeding back into underwriting.

### 3.1 Actuals against the underwrite

For a property the user owns, record what actually happened — rent achieved, capex spent,
days vacant — and score the original underwrite against it.

- **Why** — this is the only feature that compounds. Every other tool's forecast is
  unfalsifiable because nothing ever checks it.
- **Proof** — `src/predict.js`'s backtest mechanism, pointed at the user's own history:
  published error by strategy and by market, the same way the corridor forecasts already
  publish theirs.
- **Blocker** — Phase 1.4 (portfolio) and a user-entered actuals layer. Note that actuals
  are the user's own data and never leave the file, which is consistent with the
  single-file architecture and with [`../INTEROP.md`](../INTEROP.md).
- **Cost of being wrong** — a backtest computed over a sample too small to mean anything.
  The sample floor that `tests/run.py` already enforces on the record layer applies here
  without exception; below it, the answer is `insufficient history`, printed.

### 3.2 Underwriting calibration

Once 3.1 has history, the offer solver can state its own accuracy: *your last 14 hold
underwrites ran 8% optimistic on opex.*

- **Why** — the premium argument made concrete. No competitor can say this because none
  of them keep score.
- **Proof** — the published error figure, with *n*, recomputed at build and never typed.
- **Blocker** — 3.1, plus enough history to clear the sample floor.
- **Cost of being wrong** — quoting a calibration from four deals. State *n* beside every
  figure or omit the figure.

## What is deliberately not on this roadmap

Carried from [`GAP.md`](GAP.md) so it cannot be quietly re-added: skip tracing and owner
contact enrichment; dialers, SMS and direct-mail campaigns; "motivation" labels;
lender placement and recommendations; and any estimate presented as a price. Five of the
register's most successful products sell primarily on the first three. The addressable
market this forfeits is real and is the price of the rest of the document.

Pricing tiers are also **not** on this roadmap. The research proposes five of them; a tier
sheet is a commitment to what a customer gets, and this project does not publish a number
it has not measured — including its own. Tiers follow the features, not the other way
round.

## Sequencing

Phase 1 is four features, none blocked, and it is where the premium argument becomes
visible in the app rather than true in the repository. Phase 2.1 (import contract)
belongs beside it, because import is how a new user arrives and the no-laundering rule is
cheapest to enforce before there is volume. Phase 2.2 is the long pole and is not an
agent task — it is desk sessions, one queue entry at a time. Phase 3 cannot start until
someone has owned a property through a cycle, which is a calendar constraint, not an
engineering one, and saying so is more useful than scheduling it.
