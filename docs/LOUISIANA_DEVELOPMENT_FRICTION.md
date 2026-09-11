# What slows development in Louisiana — the record frictions, and what each one blocks

> **What this is, and what it is not.** This is a synthesis of material already
> sourced in this repository — the Louisiana section of
> [`states/south-central.md`](states/south-central.md), the coverage inventory in
> [`states/coverage/louisiana.md`](states/coverage/louisiana.md), and what the shipped
> editions measurably do and do not hold. **It is not new legal research.** The
> development container has no egress to parish, clerk-of-court or state hosts (all four
> probed on 2026-09-11 returned `000`), so nothing here was verified against a statute or
> a parish portal in this session. Every claim traces to a repository row that carries its
> own source; where a rule is in flux this page says so and names the probe rather than
> resolving it.
>
> **This is navigation of the public record, not advice.** Nothing here is legal, tax or
> investment advice, and every mechanic below has to be verified against the current
> parish practice before anyone relies on it. Louisiana is a civil-law jurisdiction whose
> mechanics differ from every other state in this catalogue; that is precisely why it gets
> its own page.

Development friction in Louisiana is mostly **records friction**. The buildings are
available, the programs are generous, and the thing that actually costs a developer months
is that the public record answers fewer questions here than almost anywhere else in the
catalogue — and answers some of them differently per parish.

Ranked by how much each one blocks, and by whether the platform can do anything about it.

---

## 1. Sale prices are not reliably disclosed — the underwriting blocker

**What it is.** Louisiana follows non-disclosure practice. The state guide records the
consequence in the bluntest terms the platform has for any market: **the Comps desk cannot
function in Orleans or East Baton Rouge**, because sale prices are not reliably in the
public record.

**What it blocks.** Nearly everything an underwriter wants. No reliable sale comps means
no market-derived value, no defensible price-per-unit, no exit assumption that traces to a
transaction. The assessor's roll still publishes an **assessment**, and an assessment is
not a price — a distinction this platform enforces everywhere.

**What the platform does about it today.** It says so instead of guessing. The Comps desk
is disabled rather than filled with estimates, and the editions publish assessed values
labelled as assessments. This is the single clearest example of the platform's governing
rule doing real work: the honest output is a smaller one.

**The probe that would advance it.** None, for price. This is a statutory and practice
constraint, not a data-access problem, and no amount of scraping fixes it. What *can*
advance is everything around it: rent rolls, permits, code enforcement and short-term
rental licences are published, and a rent-led underwrite does not need a sale comp.

---

## 2. The tax-sale regime is mid-transition — a bidding trap

**What it is.** The state guide records that Louisiana historically conveyed **tax sale
title** (certificate-like) with a three-year constitutional redemption, and that a **2023
constitutional amendment moves the system toward lien auctions, with implementation
phasing in**.

**What it blocks.** Anyone bidding on distressed tax positions. During a phase-in the
mechanics can differ by parish and by auction date, so what you acquire — a lien, a
certificate, or title subject to redemption — is not answerable from a single statewide
statement.

**What the platform does about it.** The guide flags it and says **verify each parish's
current mechanics before bidding**. It does not publish a statewide rule, because there is
not reliably one.

**The probe.** Parish-by-parish confirmation of current auction mechanics and redemption
handling, recorded per parish with a date — the same shape as a coverage row. Until that
exists, a tax-sale screen for Louisiana would be asserting a uniformity that is not there.

---

## 3. Civil-law title chains — usufruct, forced heirship, community property

**What it is.** Louisiana is a community-property state, and the guide records that
**usufruct and forced-heirship history complicate title chains**.

**What it blocks.** Speed. A chain that looks clean in a common-law state can carry a
usufruct or a forced-heirship interest here, which surfaces in diligence rather than in a
screen and can add weeks — or kill a deal that penciled.

**What the platform does about it.** Nothing automated, honestly. This is a title-examiner
question and the platform does not pretend to answer it. What it can do is stop treating a
Louisiana chain as if it behaved like an Arizona one, which is why the state layer exists
at all.

---

## 4. Foreclosure runs by executory process

**What it is.** Mortgages are granted by **authentic act**, and foreclosure proceeds by
**executory process** — judicial but expedited, on a confession of judgment contained in
the act. The guide records **no statutory post-sale redemption on mortgage foreclosure**.

**What it means.** Timelines here are not comparable to either the judicial or the
nonjudicial archetypes used elsewhere in the state layer, so a Louisiana deal modelled on
a generic "judicial state" timeline will be wrong in both directions — slower to start,
faster to finish.

---

## 5. Insurance is the line that breaks coastal pro formas

**What it is.** The guide names insurance as **the crisis line** for Louisiana, with
Citizens depopulation rounds and Fortify Homes grants belonging in any coastal pro forma.

**What it blocks.** The underwrite itself. This is why the platform's underwriting
worksheet treats insurance as a **quote**, not an estimate, and why the app's export ships
`insurance: null` rather than carrying a guess across the boundary — the no-laundering
rule in [`INTEROP.md`](INTEROP.md). In Louisiana that design decision stops being
fastidious and starts being the difference between a real pro forma and a fictional one.

---

## 6. The tax line moves block by block

**What it is.** A **homestead exemption** (recorded in the guide at $7,500 assessed) plus
parish millage variance means the tax line changes materially over short distances.

**What it blocks.** Any model that uses a single tax rate for a market. A parish-level
average is the wrong grain here.

---

## 7. Assessors are elected per parish — so the record's shape varies

**What it is.** Parishes, not counties, and assessors are elected per parish. Orleans
publishes through the Orleans Parish Assessor and NOLA.gov open data (permits, code
enforcement, short-term-rental licences); East Baton Rouge through EBRGIS; clerks of court
record conveyances, with Orleans' Land Records Division online; the Louisiana Tax
Commission aggregates rolls.

**What it blocks.** Anything statewide. Sixty-four parishes means up to sixty-four record
formats, field names and publication practices.

**The measured gap, and it is this platform's own.** **No Louisiana jurisdiction is mapped
in [`../crosswalk/usecodes.json`](../crosswalk/usecodes.json).** The crosswalk carries
eight jurisdictions — Wake and Guilford (NC), Utah County (UT), Bernalillo (NM), Maricopa
(AZ), Onondaga (NY), plus statewide Ohio and Florida — and not one of them is in
Louisiana, even though the platform ships two Louisiana editions holding **213,381**
measured records between them (`nola` 87,578 and `atlas_nola` 125,803, measured
2026-09-11). The anchor market's use-code vocabulary is unmapped, which is why a class
screen — hotels included — cannot yet run there.

**The probe.** One measured `groupBy` on the use-code field per Louisiana jurisdiction,
appended to the crosswalk with source and date. It is the first item in
[`HOTEL_EXPANSION.md`](HOTEL_EXPANSION.md) §5 for exactly this reason, and it is a probe,
not a pull: it does not require moving 50,000 rows.

---

## What actually accelerates a Louisiana deal

The programs are real and are recorded in the guide with the same discipline: the
**Restoration Tax Abatement** (a 5+5-year property-tax freeze on rehab in districts —
named in the guide as the New Orleans conversion deal-maker), **state historic credits
stacking with federal** on the CBD/Warehouse District office-to-residential wave,
**Louisiana Housing Corporation** programs (buyer programs, LIHTC, HOME), and Opportunity
Zones across Orleans and EBR.

Each of those is a reason a Louisiana conversion pencils where the same building elsewhere
would not — and each has to be verified against current program rules before it is relied
on, because programs lapse and revive with budget cycles. That verification note is not
boilerplate here; it is the guide's own standing instruction for this layer.

---

## The order to work these in

1. **Map the Louisiana use codes** (§7). One probe per jurisdiction, unblocks class
   screening on the anchor market, and is the cheapest item on this page.
2. **Record tax-sale mechanics per parish** (§2), dated, as coverage rows — converting a
   statewide unknown into per-parish knowns and named blanks.
3. **Lean the underwrite on what is published** (§1). Rents, permits, code enforcement and
   STR licences are available where sale prices are not; a rent-led underwrite is the
   honest path through a non-disclosure state.
4. **Keep insurance a quote** (§5). Not a modelling decision — a correctness one.

Nothing above needs a private data source, and none of it is available to this container;
all of it runs from the desktop pull session documented in
[`PULL_RECIPE.md`](PULL_RECIPE.md) and queued in [`PULL_QUEUE.md`](PULL_QUEUE.md).
