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

### 2. A permit is not a delivered unit

Permits are authorisations. Some become buildings; some expire. And a metro-wide permit
count says nothing about *where* in the metro the units land, which for anyone actually
trying to house workers near a plant is the entire question. Units permitted forty minutes
away are a statistic, not a supply response.

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
