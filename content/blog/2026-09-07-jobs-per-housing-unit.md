---
title: Announced jobs per housing unit permitted, and the four ways that ratio lies
slug: jobs-per-housing-unit
date: 2026-09-07
topic: Market analysis
summary: Divide announced jobs by housing units permitted and you get a number that ranks corridor markets against each other on the same published basis. You also get a number that is wrong in at least four specific ways, and a market where it goes negative.
---

A company announces twenty thousand jobs in a metro. The metro permitted four thousand
housing units last year. Somebody does the division, gets five, and writes a headline about
a housing crisis.

The division is fine. The headline is not, and the gap between them is worth a careful
article, because this ratio is genuinely useful and almost universally misused.

## What we compute, precisely

For each corridor area we carry two published figures:

- **Announced direct jobs** — from company and state economic-development announcements,
  each with a source and a date.
- **Housing units permitted in the trailing twelve months** — trailing sums of monthly
  observations from the Census Building Permits Survey.

Divide. That is the whole calculation. There is no model, no adjustment, no seasonality
correction, and no proprietary anything.

{{chart:jobs-per-permit}}

We compute it across **{{fig:corridor_areas}} corridor areas**, and we carry
**{{fig:corridor_caveats}} caveats** on the underlying record — which should tell you
something about the ratio-to-caveat ratio of this particular measure.

## Where the jobs number actually comes from

"Announced direct jobs" is a summary of something much lumpier, and the lumps matter.

Behind the **{{fig:corridor_areas}} corridor areas** sit **{{fig:corridor_projects}} individual
projects**, carrying **${{fig:corridor_capital_b}} billion** of announced capital and
**{{fig:corridor_jobs}} announced direct jobs** in total, as of {{fig:corridor_as_of}}. Every
project row carries a source URL that was actually fetched when the row was written — not a
citation copied from a press summary, but a page someone opened.

**{{fig:corridor_projects_nojobs}} of those projects publish no jobs figure at all.** Their
jobs field is null, not zero, and that distinction is the file's governing rule: *where a
source stated no number, the field is null rather than estimated.* A company announcing
"thousands of jobs" without a number has told you something real about scale and nothing
countable, and converting that into a countable figure — even a conservative one — is the
moment a research file turns into a model wearing a research file's clothes.

The consequence is that the announced-jobs totals in this table are systematically
**conservative**, and the direction of that bias is knowable rather than mysterious. Whenever
you see one of these figures, the true announced total is the published number plus an
unknown contribution from the projects that never published one.

The same rule produces a metro whose jobs total is null entirely: {{fig:corridor_jobs_null}}
of the areas has no countable announced-jobs figure, and it renders as unavailable rather
than as zero. A zero would say the announcements are absent. Null says the count is.

## The four ways it lies

### 1. An announced job is not a filled job

This is the big one, and it is not a theoretical concern.

Announcements are downsized, delayed and cancelled with a regularity that would embarrass
any other category of published number. Semiconductor fabs slip years. Battery plants get
resized between announcement and groundbreaking. Some projects are announced, celebrated,
and quietly never built at all.

Our own project record carries exactly this: Louisiana projects that were announced and then
cancelled or abandoned outright, still in the dataset, marked as cancelled, contributing
nothing to any score. We keep them visible because a corridor that lost capital is not the
same as a corridor that never attracted any, and deleting the failures would make the record
look like a list of successes.

Every project row carries its status — announced only, under construction, cancelled — and
where the record captured it, a **jobs basis** line stating whose figure the headcount is
and whether anything was independently confirmed. Most of the largest numbers in economic
development announcements are company-stated and unconfirmed. That is not an accusation; it
is just what the source is, and a reader deserves to know which numbers were checked by
someone other than the party announcing them.

### A note on whose number this is, and what is excluded

Two details from the file are worth surfacing because they show what "announced direct jobs"
smuggles.

The largest single jobs figure in the table is attributed to a company executive via a
secondary source, and the file says so in the caveat rather than presenting the number as
though it had come from a filing. The same company later announced a very large expansion
that published **no incremental jobs number at all** — so the metro's total is, on its own
file's assessment, understated, and the caveat says that too. A dataset willing to say "our
own number is probably too low here, and here is why" is doing something unusual: the
incentive in economic-development data runs entirely the other way.

The second detail: **construction jobs are excluded everywhere.** One project alone cites tens
of thousands of construction jobs over several years, and none of them are in these totals.
Construction employment is real, large, and temporary, and mixing it with operating headcount
produces a number that describes two different phenomena on two different timescales. Housing
demand from a four-year construction workforce is a genuine thing — it is also a different
thing, with a different duration and often a different geography, and it deserves its own
count rather than inflating this one.

### 2. A permit is not a delivered unit

Permits are authorisations. Some become buildings; some expire. And a metro-wide permit
count says nothing about *where* in the metro the units land, which for anyone actually
trying to house workers near a plant is the entire question. Units permitted forty minutes
away are a statistic, not a supply response.

### A note on what the permit figure is, exactly

The denominator deserves the same scrutiny as the numerator.

Each permit figure is a **trailing twelve-month sum of monthly observations** from the Census
Building Permits Survey, taken from the published series for that metro, with the window
stated on the row. Across the areas that have such a series the figures total
**{{fig:corridor_permits_total}} units authorised**. Nothing is annualised from a partial
year, nothing is seasonally adjusted, and no figure is interpolated.

**{{fig:corridor_no_permits}} of the {{fig:corridor_areas}} areas have no published
metro-level series**, and those rows render as *not drawn* rather than as zero or as a blank.
This is the same distinction the negative-jobs row depends on, in the other direction: a
measured zero is a fact, an absent series is an absence, and a chart that renders them
identically is lying about one of them.

There is one more omission worth naming because its absence is easy to miss. For several of
these metros the source publishes no separate multifamily series — no five-plus-unit split —
so no multifamily figure is claimed for them. Anyone analysing a corridor for apartment
demand wants exactly that split, which makes it the most tempting thing in the table to
approximate from total permits. It is not there because the source does not publish it, and
that sentence is the whole of our position on it.

### 3. Household formation per job is never 1.0

The ratio quietly implies that each new job needs one new housing unit. It does not.

The real figure varies with wage level, with how many hires relocate versus already live in
the metro, with household size, and with how many of the jobs are filled by people who
change jobs rather than change address. A construction phase and an operating phase produce
completely different demands from the same announcement.

There is no universal conversion factor. Anyone who offers you one is selling something.

### 4. The two halves are not measured at the same time

The jobs figure is an announcement — a point event, often about a future spread over years.
The permit figure is a trailing twelve-month sum — a window that has already closed. You are
dividing a claim about the future by a measurement of the recent past, and the result is
dimensionally strange even when both inputs are accurate.

## So why compute it at all

Because **relative** comparison on a **consistent basis** is still worth a great deal, and
that is the only claim we make for it.

Every area in the table is measured the same way from the same two sources. If area A shows
eight and area B shows one, that difference is real in the sense that matters: the
announcement-to-permit relationship is genuinely eight times more lopsided in A. It is a
ranking device, and read as a ranking device it is one of the better leading indicators
available from purely public data.

It is not a count of households. It is not a forecast. It is not a rent projection. We say
so on the page, next to the number, because the caption is where a measure like this either
gets honest or gets away with something.

## Small areas break this ratio in both directions

One structural property of the measure deserves its own warning, because it is invisible in a
sorted chart: **the ratio is far more volatile in small areas than in large ones**, and
sorting puts the volatile ones at both ends.

In a large metro, the denominator is tens of thousands of permitted units a year and the
numerator is the sum of several independent announcements. Both are, in effect, averages over
many events, and the ratio moves slowly. In a micropolitan area, a single announcement can be
the entire numerator and a single year's permitting can swing the denominator by a third.
The same measure, computed identically, is a stable indicator in one place and a near-single
observation in the other.

The consequence is that the top of a sorted list of this ratio is systematically enriched for
small areas — not because those markets are more strained, but because small numbers move
further. This is the same effect that makes small schools appear at both the top and the
bottom of test-score rankings, and it fools people in exactly the same way.

Two defences, neither of them clever. First, the area's population and its permit count are
both on the row, so the reader can see what the ratio is computed from; a ratio of eight over
a denominator of four hundred is a different object from a ratio of eight over forty thousand,
and both are visible. Second, we do not publish a composite score that folds this ratio into
other measures, because folding is precisely what destroys the reader's ability to notice
that one input was built from a single event.

The honest reading of a sorted chart of this measure is therefore not "these are the most
strained markets". It is "these are the markets where announced employment is largest
relative to recent permitting, and the ones at the extremes are the ones to check the
denominator on first."

## The area where the ratio goes negative

One corridor area in our record carries **negative announced jobs**.

This is not a data error, and we were careful to confirm that before letting it through. A
closure or cancellation contributes negatively to the announced-jobs total, and in a small
micropolitan area a single closure can outweigh everything announced. The result is a
negative numerator and a negative ratio, which the page draws in the warning colour and
labels as a net loss.

It would have been easy to clamp that at zero. Almost every dashboard does, usually without
saying so, because a negative bar looks like a bug and a zero bar looks like a floor.

Clamping would have destroyed the most informative row in the table. An area losing jobs
faster than it builds housing is in a completely different situation from an area with no
announcements, and a chart that renders them identically has thrown away the distinction it
exists to show. Our validator is explicit about this: for fields that are counts over sets
we hold, zero and negative are **real measured values**, and only the externally published
series — permits, population — are required to be positive, because for those, absent is
genuinely different from zero.

That distinction between "a measured zero" and "no published figure" runs through the whole
table. An area with no published permit series shows **not drawn**, not a blank that looks
like nothing and not a zero that looks like no building.

## The delays, named

The file does not leave "announcements slip" as a general caution. It names which ones, in
its caveats, because a general caution changes nobody's behaviour and a specific one does.

A flagship semiconductor project in one corridor has slipped by at least five years against
its original schedule — production now expected at the turn of the decade against an
original target several years back. Another large fab broke ground only this year for first
output around 2030. A battery complex has reportedly paused part of its build. And the file
states plainly how few of these metros have an anchor plant that is **already producing**: a
small minority of the areas in the table.

Sit with that last one, because it reframes the whole dataset. Most of the announced jobs in
most of these corridors are not late, not cancelled, and not yet real. They are commitments
with dates attached, and the dates are mostly in the future, and the history of such dates is
not encouraging.

That is not an argument against tracking them. Announcements genuinely move land markets
years before the first shift is hired, and being early to that is most of the opportunity.
It is an argument for a status column that is read before the number — and for a dataset
willing to keep its delays in writing, where they can embarrass the number sitting next to
them.

## Live corridors and studied ones

{{fig:corridor_studied}} of the {{fig:corridor_areas}} areas are marked *studied* rather than
*live*: researched and carried in the file, but not standing behind a shipped edition. The
remaining {{fig:corridor_live}} are live.

Keeping both in one file with a flag, rather than splitting them into what-we-ship and
what-we-looked-at, has a purpose. The studied areas are mostly small Louisiana markets where
the research produced a clear answer and the answer was "not yet" — and that answer is worth
as much as a positive one to anyone deciding where to spend a month. It also means the ratio
can be read across a wider set than the product covers, with the coverage distinction visible
rather than implied by absence.

## What the ratio is for, and where the file stops being about jobs

There is a column in this file that has nothing to do with housing demand and is arguably the
most consequential one: whether a free, machine-readable parcel or assessment endpoint exists
for the metro, and whether somebody actually fetched it.

**{{fig:corridor_parcel_confirmed}} of the {{fig:corridor_areas}} areas** have one confirmed —
layer metadata retrieved, field count recorded, record cap noted. For the rest, the jobs
story may be excellent and the record layer still cannot be built, which means no amount of
corridor enthusiasm turns into a product there.

It also contains the observation that quietly caps several of the most-discussed corridors in
the country: the states carrying some of the largest announcements are **non-disclosure
states**, so no sale price appears in their appraisal data at all. The corridor with the best
jobs-to-permits ratio in the table can simultaneously be a market where the comparable-sales
method does not work — a combination that sounds contradictory only if you assume economic
momentum and record quality are correlated. They are not related at all.

Which is the real use of this file, and of the ratio inside it. The ratio ranks where to look.
The parcel column decides where the looking can actually be done. Reading either one alone
produces a confident plan that fails for reasons the other column would have named.

One more consequence of keeping both kinds of area in view: the negative row and the
not-drawn rows are both small-area phenomena, and both would have disappeared from a table
restricted to large metros. The measure's most instructive failures live exactly where the
measure is weakest, which is an argument for publishing the weak rows with their inputs
visible rather than for trimming the table to the places where the ratio behaves.

## What to do with the number

Three legitimate uses:

**Rank attention, not decisions.** A high ratio tells you a market is worth a week of your
time before its neighbours are. It does not tell you to buy anything.

**Pair it with what the record can actually answer.** Announced jobs are the least reliable
figure in this whole system. Permits, code enforcement, and the assessment roll are all more
solid. Use the ratio to choose where to look, then underwrite from things that have already
happened.

**Read the status column before the number.** An area whose jobs total is dominated by a
single announced-only project with a company-stated headcount is a different proposition
from one built of several projects under construction. The ratio is identical; the
underlying confidence is not remotely.

**Re-check it on a cadence, not once.** Both halves of this ratio move, and they move for
different reasons: the numerator changes when somebody announces, cancels or quietly resizes,
and the denominator changes every month as a new observation enters the trailing window and
an old one leaves. A ratio you computed six months ago is two stale numbers in a trench coat.
Every figure in our file carries its as-of date for this reason, and the correct question to
ask of any corridor statistic — ours included — is not "is this right" but "when was this
true".

## The general principle

A crude ratio published with its limitations is more useful than a sophisticated model
published without them.

We could dress this up. We could apply a household-formation coefficient, discount announced
jobs by a historical realisation rate, adjust permits for a completion factor, and output a
"housing pressure index" with a proprietary methodology and two decimal places. It would
look far more impressive, and every one of those adjustments would be a parameter we could
not defend from public data.

Instead: two published numbers, one division, and four paragraphs about what it does not
mean. The reader can see the whole thing and disagree with any part of it.

That is not a lesser product than the index. It is the same product with the assumptions
left where you can see them.
