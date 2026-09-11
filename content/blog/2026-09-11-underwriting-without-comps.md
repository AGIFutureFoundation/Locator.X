---
title: Louisiana does not publish sale prices. Here is how to underwrite anyway.
slug: underwriting-without-comps
date: 2026-09-11
topic: The record layer
summary: In a non-disclosure state the comparable-sales method does not degrade gracefully — it stops working. That is not a reason to guess. It is a reason to underwrite from the things the record does publish, and to say out loud which is which.
---

There is a moment, early in every Louisiana deal, when an analyst trained anywhere else
reaches for the comps and finds the drawer empty.

It is a genuinely disorienting experience, because the comparable-sales method is not one
technique among several in American real estate. It is the spine. Appraisal practice is
built on it. Lender underwriting assumes it. Every course, every model, every spreadsheet
template a new analyst has ever seen begins with a set of recent transactions and works
outward from them. Take that away and the ordinary response is not to switch methods — it
is to keep using the same method with worse inputs, quietly, and hope nobody asks.

That is the failure this article is about, and the alternative to it.

## What non-disclosure actually means

Most US states require, or in practice produce, a public record of what a property sold
for. The mechanism varies — a transfer tax stamp that reveals consideration, a statutory
disclosure requirement, a multiple-listing service whose data eventually reaches public
aggregators — but the effect is the same: you can find out what the building down the
street traded for.

Louisiana is one of the states where that is not reliably true. Conveyances are recorded —
the clerks of court do their job, and in Orleans the Land Records Division is online — but
the *price* is not dependably part of what becomes public. There is no state transfer tax
whose stamp would reveal consideration. Orleans levies a documentary transaction tax, but
that is a different instrument answering a different question.

Our own state guide records the consequence in the bluntest language we use anywhere in
the catalogue: **the comparable-sales desk cannot function in Orleans Parish or East Baton
Rouge.** Not "is less reliable there". Cannot function.

This matters more than it sounds, because Louisiana is not a marginal market. The two
Louisiana editions of our platform hold **{{fig:la_records}} measured parcel records**
between them — {{fig:nola_records}} in the New Orleans edition and
{{fig:nola_atlas_records}} in the parish atlas. That is a large, dense, economically
serious market in which the single most-used valuation method in the profession is
unavailable.

## The three things people do instead, and why two of them are worse than nothing

When the comps drawer is empty, practitioners reach for substitutes. It is worth being
precise about which substitutes are legitimate, because two of the three common ones are
actively dangerous.

### Substitute one: use the assessment as a price

This is the most common and the most damaging. The assessor's roll is public, it is
comprehensive, it has a number in a column, and the column is often labelled something
like "total value". It is *right there*.

It is not a price. An assessed value is a figure produced by a mass-appraisal process for
the purpose of apportioning tax. It is generated on a cycle, it is subject to statutory
ratios and exemptions, it is contested and adjusted through an appeal process that has
nothing to do with what a willing buyer would pay next Tuesday, and in many jurisdictions
it is deliberately not intended to track market value at all.

Louisiana makes this especially treacherous because of the homestead exemption — recorded
in our state guide at $7,500 of assessed value — layered on top of parish millage
variation. The tax line moves materially block to block, which means the relationship
between the assessed figure and anything market-like is not even consistent *within a
single parish*.

Our platform publishes assessed values. It publishes them everywhere, for every edition,
because they are real measured data from the public record and they are useful. And it
labels them, everywhere, without exception, as **assessments, never prices**. That label
is not legal throat-clearing. It is the difference between a number you can use and a
number that will quietly destroy a pro forma.

### Substitute two: import a national estimate

The second substitute is to pull a valuation estimate from a national data vendor — an
automated valuation model that produces a number for essentially every address in the
country.

The problem is not that these models are bad. Some are quite good. The problem is
**circularity**. An automated valuation model is trained on transactions. In a
non-disclosure state, the transactions it has are thinner, later, and systematically
non-random — the ones that surfaced through channels that do publish. A model output in a
non-disclosure market is an extrapolation wearing the costume of an observation, and
critically, it arrives with the same interface as a real measurement: one number, two
decimal places, no visible uncertainty.

If you would not accept "I estimated it" as an answer, you should not accept a vendor
estimate that does not disclose what it was estimated from.

### Substitute three: underwrite from income

The third substitute is the legitimate one, and it is the whole answer: **stop trying to
value the asset and start underwriting the cash flow.**

This is not a workaround. For income-producing property it is arguably the correct primary
method everywhere, and the comps habit is a residential inheritance that the commercial
side of the industry already largely abandoned. In a non-disclosure state it stops being a
philosophical preference and becomes the only honest path.

## What Louisiana does publish, and it is a great deal

Here is the thing that gets lost in the complaint about missing prices: the Louisiana
public record is, in several respects, *unusually good*.

Orleans Parish publishes through the Orleans Parish Assessor and through NOLA.gov open
data — and the open-data catalogue includes **permits, code enforcement cases, and
short-term rental licences**. East Baton Rouge publishes through EBRGIS. The clerks of
court record conveyances. The Louisiana Tax Commission aggregates rolls across parishes.

Consider what that set actually supports:

- **Permits** tell you what is being built, renovated, and converted, at address grain,
  with dates. That is a leading indicator of both supply and of owner intent, and it is
  the single best signal that a block is turning.
- **Code enforcement** tells you which buildings are in trouble. Distress shows up in the
  enforcement record long before it shows up in a price.
- **Short-term rental licences** tell you, at address grain, which units are in the
  nightly-rate market. In New Orleans that is not a curiosity — it is a material fact
  about the income profile of a whole category of small property.
- **The assessment roll** tells you the tax line, which is a real cash expense you need
  regardless of whether the assessed figure resembles market value.

None of that is a price. All of it is an *input to an income underwrite*, which is what
you should have been building anyway.

## The method: underwriting an asset whose price you cannot look up

The shape of an income underwrite is not exotic. What changes in a non-disclosure state is
where each input comes from and how confident you are allowed to be about it. We classify
every input into one of four kinds, and the classification is the discipline:

| Kind | What it means | Louisiana example |
|---|---|---|
| Public record | A figure published by a government body | Assessment, millage, permit history, code cases |
| Demand the document | A figure the seller has and must hand over | Rent roll, trailing twelve months of operating statements, service contracts |
| Quote or term sheet | A figure a third party must put in writing | Insurance premium, debt terms, construction bid |
| Measure it | A figure you generate yourself | Physical condition, unit mix verified by walking it |

The reason this matters is that **the four kinds have completely different failure
modes**, and mixing them is how a pro forma becomes fiction. A public-record figure can be
stale. A demanded document can be selectively produced. A quote can expire. A measurement
can be wrong. If every number arrives in the same font with no indication of which kind it
is, you cannot reason about any of it.

### Insurance is the line that breaks Louisiana pro formas

If you take one operational point from this article, take this one.

Our state guide names insurance as **the crisis line** for Louisiana. Coastal exposure,
carrier withdrawal, Citizens depopulation rounds, Fortify Homes grant programs — the
insurance market in this state has been in active dislocation, and premium is not a line
you can estimate from a percentage of value the way an underwriting template invites you
to.

This is why our own underwriting worksheet treats insurance as a **quote** — the third
kind — and not as an estimate. And it is why, when the application exports an underwriting
case to the standalone worksheet, it ships the insurance field as `null` rather than
carrying its own internal estimate across the boundary.

That decision looks fastidious in a spreadsheet. In Louisiana it is the difference between
a pro forma and a work of fiction. A deal that pencils at an estimated premium and fails
at a quoted one is not a deal that went wrong later; it is a deal that was never
underwritten.

## Three more frictions that slow a Louisiana deal

Non-disclosure is the headline, but it is not alone. Louisiana is a civil-law jurisdiction
— the only one in the United States — and several of its mechanics differ from every other
state in a catalogue.

**Title chains are genuinely more complex.** Louisiana is a community-property state, and
usufruct and forced-heirship history complicate chains in ways that do not surface in a
screen. They surface in diligence, weeks in, after you have spent money. This is a
title-examiner question and no software should pretend otherwise; what software *can* do
is stop treating a Louisiana chain as if it behaved like an Arizona one.

**Foreclosure runs by executory process.** Mortgages are granted by authentic act, and
foreclosure proceeds by executory process — judicial, but expedited by the confession of
judgment contained in the act, with no statutory post-sale redemption on mortgage
foreclosure. A Louisiana timeline modelled on a generic "judicial state" assumption will
be wrong in both directions: slower to begin, faster to finish.

**The tax-sale regime is mid-transition.** Louisiana historically conveyed tax sale title —
certificate-like — with a three-year constitutional redemption. A 2023 constitutional
amendment moves the system toward lien auctions, with implementation phasing in. During a
phase-in the mechanics can differ by parish and by auction date, which means what you
acquire at a tax sale is not answerable from a single statewide statement. Verify the
current mechanics for the specific parish before bidding. We decline to publish a statewide
rule here, because there is not reliably one to publish.

## What the platform does about all this

The honest answer is: less than we would like, and it says so.

The comparable-sales desk is **disabled** in Orleans and EBR rather than populated with
estimates. That was a product decision that cost us a feature in our anchor market, and it
is the correct one. A desk that produces confident-looking comparable values from a record
that does not contain them is worse than a desk that is switched off, because a switched-off
desk sends you to find the data and a confident one sends you to the closing table.

We publish assessments, labelled as assessments, everywhere.

And we have a gap of our own to disclose, because a platform that catalogues other people's
record problems should be loudest about its own. Our asset-class crosswalk — the mapping
from each jurisdiction's use-code vocabulary to the screening classes the platform
reasons in — covers **{{fig:crosswalk_juris}} jurisdictions** and
**{{fig:crosswalk_codes}} codes**.

{{chart:crosswalk-classes}}

Not one of those jurisdictions is in Louisiana. The anchor market, holding
{{fig:la_records}} measured records, has an unmapped use-code vocabulary — which means a
class screen cannot yet run there. Fixing it is not a data-acquisition project; it is a
single measured `groupBy` on the use-code field per jurisdiction, recorded with a source
and a date. It is the first item in our own queue, and we would rather write that sentence
than let a reader assume a coverage we do not have.

## The uncomfortable conclusion

The comparable-sales method is so deeply embedded in real-estate practice that its absence
reads as a defect in the market rather than as a fact about the record. It is not a defect.
It is a statutory and practice reality that is not going to change because an analyst finds
it inconvenient, and no amount of scraping, purchasing or modelling produces a public
record of a price that was never made public.

What you can do is underwrite from what exists: a rent roll you demanded, a tax line you
looked up, an insurance premium somebody quoted in writing, a permit history that tells you
what the block is doing, and a code-enforcement record that tells you which buildings are in
trouble. Then say — in the document, next to the number — which of those four kinds each
figure is.

An underwrite built that way in a non-disclosure state is more honest than a comps-driven
underwrite in a disclosure state, because every number in it has a named provenance and a
known failure mode. The discipline that non-disclosure forces on you is the discipline you
should have had anyway.

The empty drawer is not the problem. Pretending it is full is the problem.
