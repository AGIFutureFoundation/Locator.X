---
title: What actually slows a Louisiana deal is the record, not the buildings.
slug: what-slows-a-louisiana-deal
date: 2026-09-13
topic: The state layer
summary: Seven frictions, ranked by how much each one blocks and by whether a platform can do anything about it — a non-disclosure market with civil-law title chains, expedited foreclosure, an insurance line that decides pro formas, and a tax figure that moves block by block.
---

Louisiana is a market where the buildings are available, the incentive programs are
genuinely generous, and deals still take longer than they should.

The reason is not the buildings and it is not the programs. It is that **the public record
answers fewer questions here than almost anywhere else** in our catalogue, and answers
several of them differently depending on which of sixty-four parishes you are standing in.
Development friction in Louisiana is records friction, and once you see it that way the
sequence of what to fix changes.

We keep a ranked page of those frictions: **{{fig:la_frictions}}** of them, each written with
what it is, what it blocks, what the platform does about it today, and — where one exists —
the probe that would advance it. This article walks that ranking, because the shape of it is
useful to anyone working the market whether or not they ever open our software.

## First, what this is not

The page this article draws on carries a caution at the top and it belongs here too.

It is a **synthesis of material already sourced in our own repository** — the Louisiana state
guide, the parish coverage inventory, and what the shipped editions measurably do and do not
hold. It is **not new legal research**. Our build environment has no route to parish,
clerk-of-court or state hosts — all four were probed and returned nothing — so not one claim
below was verified against a statute or a parish portal while it was written. Every claim
traces to a repository row that carries its own source and date, and where a rule is in flux
the page says so and names the probe rather than resolving it.

This is navigation of the public record, not advice. Louisiana is a civil-law jurisdiction
whose mechanics differ from every other state in the catalogue, which is precisely why it
gets its own page — and why nothing here should be relied on without current local counsel.

With that stated plainly: here is what actually costs time.

## Why rank frictions at all

Most market write-ups are organised by opportunity: here is what is cheap, here is what is
converting, here is where the jobs are going. Almost none are organised by what will cost you
time, which is strange, because time is the input a small operator has least of and the one
that kills the most deals.

Ranking by friction forces two useful disciplines. The first is that each entry has to say
what it *blocks* — not that it is difficult in general, but which specific activity stops
working. "Civil-law title chains are complex" is an observation. "A chain that looks clean in
a common-law state can carry an interest that surfaces in diligence rather than in a screen,
adding weeks" is a planning input.

The second is that each entry has to say what, if anything, advances it, and be willing to
answer *nothing*. Two of the seven have no probe at all: non-disclosure is statutory, and
civil-law title chains are an examiner's job. Writing "none" in that field is what keeps the
page from turning into a roadmap — and it is what tells a reader which constraints to design
around permanently rather than wait out.

A friction ranking is also the most portable artefact in the state layer. The programs change
with budget cycles and the coverage rows change with every pull, but the reasons a market is
slow are structural and move on the timescale of constitutional amendments. A reader who
internalises the seven below will still be right about this market next year.

## 1. Sale prices are not reliably disclosed

The blocker at the top of the list is the one that removes the industry's default method.

Louisiana follows non-disclosure practice, and our state guide records the consequence in the
bluntest language we use anywhere: **the comparable-sales desk cannot function in Orleans or
East Baton Rouge.** Not degrades. Cannot function.

What it blocks is most of what an underwriter wants: no reliable sale comps means no
market-derived value, no defensible price per unit, no exit assumption that traces to a
transaction. The assessor's roll still publishes an assessment, and an assessment is not a
price — a distinction this platform enforces everywhere and one that becomes load-bearing
rather than pedantic here.

What we do about it is say so. The comps desk is disabled rather than filled with estimates,
and the editions publish assessed values labelled as assessments. The honest output is the
smaller one.

**The probe that would advance it: none, for price.** This is a statutory and practice
constraint, not a data-access problem, and no amount of engineering fixes it. What can
advance is everything around it — rents, permits, code enforcement and short-term-rental
licences are published, and a rent-led underwrite does not need a sale comp. We have written
about how that underwrite actually works [elsewhere](underwriting-without-comps.html).

## 2. The tax-sale regime is mid-transition

Louisiana historically conveyed **tax sale title**, certificate-like, with a three-year
constitutional redemption. A 2023 constitutional amendment moves the system toward lien
auctions, and implementation is phasing in.

What that blocks is anyone bidding on distressed tax positions, because during a phase-in the
mechanics can differ by parish and by auction date. What you actually acquire — a lien, a
certificate, or title subject to redemption — is not answerable from a single statewide
statement, and a bidder who assumes otherwise has mispriced the thing they are buying.

Our guide flags it and instructs verifying each parish's current mechanics before bidding. It
does not publish a statewide rule, because there is not reliably one to publish.

The probe is parish-by-parish confirmation of current auction mechanics and redemption
handling, recorded per parish with a date, in the same shape as a coverage row. That converts
one statewide unknown into a set of per-parish knowns and honestly-named blanks, which is the
only real progress available on a question like this.

## 3. Civil-law title chains

Louisiana is a community-property state, and the guide records that **usufruct and
forced-heirship history complicate title chains**.

What it blocks is speed. A chain that would look clean in a common-law state can carry a
usufruct or a forced-heirship interest here, and that surfaces in diligence rather than in a
screen — weeks later, sometimes fatally to a deal that penciled.

What the platform does about it: **nothing automated, honestly.** This is a title-examiner
question and we do not pretend to answer it. What the state layer can do is stop treating a
Louisiana chain as though it behaved like an Arizona one. That is a smaller claim than
software usually makes and it is the true one.

It is worth pausing on why that entry stays in the ranked list despite having no product
answer. A friction list that only contains items the vendor can solve is a feature roadmap
wearing a research page's clothes. The point of ranking by *what it blocks* rather than by
*what we can ship* is that the biggest obstacles in a market are frequently ones no software
addresses, and a reader deserves to know that before they plan around a tool.

## 4. Foreclosure runs by executory process

Mortgages are granted by **authentic act**, and foreclosure proceeds by **executory
process** — judicial, but expedited, on a confession of judgment contained in the act. The
guide records no statutory post-sale redemption on mortgage foreclosure.

The consequence for modelling is specific and easy to get wrong in both directions at once:
Louisiana timelines are not comparable to either the judicial or the nonjudicial archetypes
used elsewhere in the state layer. A deal modelled on a generic "judicial state" timeline will
be wrong *slower to start and faster to finish* than the model expects.

This is the clearest example in the state layer of why per-state modelling exists at all. The
two-archetype simplification that every national tool uses — judicial versus nonjudicial —
does not have a slot for this, so a national tool either silently assigns Louisiana to the
wrong archetype or omits it. Both are worse than saying the archetypes do not fit here.

## 5. Insurance is the line that breaks coastal pro formas

The guide names insurance as **the crisis line** for Louisiana, with Citizens depopulation
rounds and Fortify Homes grants belonging in any coastal pro forma.

What it blocks is the underwrite itself. Which is exactly why our worksheet treats insurance
as a **quote** rather than an estimate, and why the app's export ships the insurance field
null rather than carrying a modelled guess across a system boundary — the no-laundering rule
we have described [in detail](a-number-may-not-change-kind.html).

In most markets that design decision reads as fastidious. In Louisiana it is the difference
between a real pro forma and a fictional one. An insurance figure produced by a national cost
model is not conservative or aggressive here; it is uninformed, because the actual number
depends on the specific structure, its mitigation features, its distance from water, and the
state of the carrier market in the month you ask. There is no public, comprehensive,
machine-readable source for it anywhere, and inventing one because the field looks empty is
how a pro forma becomes fiction while remaining arithmetically perfect.

## 6. The tax line moves block by block

A homestead exemption — recorded in the guide at $7,500 of assessed value — layered on top of
parish millage variance means the tax line changes materially over short distances.

What it blocks is any model that uses a single tax rate for a market. A parish-level average
is the wrong grain, and a metro-level one is not even close. This is also why the platform
recomputes the tax line at the buyer's basis rather than carrying the seller's bill forward:
the seller's bill is a real public-record number answering a question about the seller.

The practical test is easy to run and uncomfortable: take two properties a few blocks apart in
the same parish, pull both tax lines, and compare them to whatever rate your model uses. If
your model's number sits neatly between them, it is describing neither building.

## 7. Assessors are elected per parish

Parishes, not counties. Assessors elected per parish. Orleans publishes through its assessor
and the city's open-data portal — permits, code enforcement, short-term-rental licences — East
Baton Rouge through its own GIS, clerks of court record conveyances with Orleans' land records
online, and the state tax commission aggregates rolls.

What it blocks is anything statewide. Sixty-four parishes means up to sixty-four record
formats, field names and publication practices, and no amount of wishing produces a uniform
statewide feed.

**And here the page turns the instrument on us.** No Louisiana jurisdiction is mapped in our
own use-code crosswalk. The crosswalk carries {{fig:crosswalk_juris}} jurisdictions and not
one of them is in Louisiana — in a platform that ships two Louisiana editions holding
**{{fig:la_records}} measured parcel records** between them,
{{fig:nola_records}} and {{fig:nola_atlas_records}}. The anchor market's use-code vocabulary
is unmapped, which is why a class screen cannot yet run there at all.

The probe is one measured group-by on the use-code field per Louisiana jurisdiction, appended
to the crosswalk with its source and date. It is a probe, not a pull — it does not require
moving fifty thousand rows — and it is the cheapest item on the entire page.

Putting our own largest gap in the middle of a document about a market's frictions is
deliberate. The alternative version of this page ends at friction six and reads as a list of
things the market does wrong.

## How they compound

Taken one at a time each friction is survivable. The reason Louisiana deals run long is that
they interact, and the interaction has a shape worth naming.

Work through where a Louisiana underwrite's inputs actually live. The value: no reliable sale
price, so not public record. The insurance: a quote, by necessity, and often a slow one. The
rents: never public record anywhere, so a document you must demand. The tax line: public
record, but only at a grain fine enough to be recomputed per parcel rather than per market.
The title: a civil-law chain that a screen cannot read and an examiner has to open.

Which means that in this market **almost nothing that decides the deal can be screened from
public record alone.** In a disclosure state with ordinary title practice, a screen can get
you most of the way to a preliminary view and diligence confirms it. Here, the screen can tell
you what exists, what it is assessed at, how it is classified, what permits it has pulled and
whether code enforcement has been out — and then every remaining number requires either
somebody to hand you a document or somebody to write you a quote.

That is the real cost, and it is a sequencing cost rather than a difficulty one. The work is
not harder; it is less parallel. Each answer waits on a person. A deal timeline built on the
assumption that analysis and outreach happen simultaneously will be wrong here by exactly the
length of the slowest counterparty, and the slowest counterparty is usually the insurance
market.

The corollary is that the platform's honest role in Louisiana is narrower than in, say,
Maricopa County — and stating that narrow role accurately is more useful than implying a
capability the record cannot support. What a screen can genuinely do here is tell you which
buildings are worth spending a counterparty's time on. That is valuable. It is not an
underwrite.

## What actually accelerates a deal here

The frictions are only half the picture, and the other half is why anyone works this market
in the first place. The programs are real, and our guide records them with the same
discipline as everything else.

The **Restoration Tax Abatement** — a five-plus-five-year property-tax freeze on rehabilitation
in designated districts — is named in the guide as the New Orleans conversion deal-maker.
**State historic credits stack with the federal credit**, which is most of the arithmetic
behind the Central Business District and Warehouse District office-to-residential wave.
**Louisiana Housing Corporation** programs cover buyer programs, housing tax credits and HOME
funds. **Opportunity Zones** cover parts of Orleans and East Baton Rouge.

Each is a reason a Louisiana conversion pencils where the identical building elsewhere would
not. Each also has to be verified against current program rules before it is relied on,
because programs lapse and revive with budget cycles — a note that is not boilerplate here but
the standing instruction for this entire layer.

That combination is the market's real character, and it is why the friction ranking is not a
warning to stay away. High friction with strong incentives is a market that rewards people who
can actually navigate the record. Low friction with no incentives is a market where everyone
can do what you can do.

## What an honest Louisiana pro forma looks like

If the frictions above are real, a correct pro forma for a Louisiana income property has a
specific and slightly unfamiliar appearance.

**The value line is not a price.** It is an assessment from the roll, labelled as one, used for
what an assessment is good for — relative scale, tax computation, screening — and not as a
proxy for what the building trades at. If a number is needed for a value, it comes from the
income approach, which is the method the available data actually supports.

**The tax line is recomputed at your basis**, at parcel grain, with the homestead exemption
and the parish millage applied as they apply to you rather than to the seller.

**The insurance line is blank until a quote exists**, and every ratio downstream of it is
blank with it. This is the part that looks broken to anyone trained elsewhere, and it is the
single most accurate thing on the page: a coverage ratio computed without a real premium in a
market where the premium is the crisis line is not an estimate of the ratio, it is a
statement about the model.

**The rents come from a rent roll**, demanded, with the lease documents behind them — never
from a market survey standing in for an actual document.

**The title questions are listed as questions**, with the civil-law specifics named, because
knowing that usufruct and forced heirship are the things to ask about is most of what a
non-specialist can contribute before an examiner opens the chain.

What that produces is a pro forma with visible holes in it and a list of who has to fill each
one. Compared to the version where every field carries a plausible number, it looks
unfinished. It is the same document, with the difference that this one tells you what you do
not yet know.

## The order to work them in

The ranking ends with a work order, and the order is not the ranking. Blockers are sorted by
how much they hurt; work is sorted by what is cheapest to advance.

1. **Map the Louisiana use codes.** One probe per jurisdiction. Unblocks class screening on
   the anchor market, and it is the cheapest item on the page.
2. **Record tax-sale mechanics per parish**, dated, as coverage rows — converting a statewide
   unknown into per-parish knowns and named blanks.
3. **Lean the underwrite on what is published.** Rents, permits, code enforcement and STR
   licences are available where prices are not.
4. **Keep insurance a quote.** Not a modelling preference; a correctness requirement.

None of it needs a private data source. None of it is available to the container this was
written in, so all of it queues behind a desktop pull session that we have documented
step by step rather than pretending the constraint does not exist.

Which is the honest summary of the whole page: the work is known, the order is decided, the
sources are named, and the thing standing between here and there is a session at a machine
with a route to a parish server. Writing that down is less satisfying than shipping a feature,
and it is the reason the next person who picks this up starts from step one rather than from
scratch.
