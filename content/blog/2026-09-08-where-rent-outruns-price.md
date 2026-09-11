---
title: Where rent is outrunning price, and why that is the number worth ranking
slug: where-rent-outruns-price
date: 2026-09-08
topic: Market analysis
summary: Most market rankings are price-appreciation lists wearing an investment costume. Ranking on what a submarket pays now — and on the gap between rent growth and price growth — produces a different list, a defensible one, and a coverage statement you have to read first.
---

Almost every "best markets for real estate investment" list you have ever read is a price
appreciation list.

It may not say so. It will say *growth*, or *momentum*, or *hot markets*. But look at what
moves a city up the ranking and it is almost always that prices went up. Which is a strange
thing to rank on, because if you are buying an income asset, price going up before you
bought is not a benefit you receive. It is a cost you pay.

We built a ranking that deliberately does not work that way, published its weights, and —
this is the part most rankings skip — published what it does *not* cover before publishing
a single row.

## The coverage statement comes first, on purpose

We rank **{{fig:belts_ranked}} US ZIP-level submarkets**. Here is what that number is not:
it is not a national ranking.

Our index inputs carry both a home-value series and a rent series for ZIPs in
**{{fig:belts_states}} states**. The other **{{fig:belts_absent}}** are absent from the
bundle entirely. They are not ranked low. They are *not measured*, which is a different
claim, and conflating the two is the most common lie in market analytics.

{{chart:belts-states}}

Of **{{fig:belts_candidates}} ZIPs** carrying both series, {{fig:belts_ranked}} cleared a
data floor of {{fig:belts_min_points}} monthly observations. The rest were dropped for a
series too thin to trust, and dropped is a status we record rather than a silence.

There is a second honesty problem inside any ZIP-level national list, and we hit it
immediately: coverage is not evenly distributed. Only {{fig:belts_metros}} metros carry
both series at all, and the two largest supply about 44% of all candidates. A "top 100 US
submarkets" list drawn from that pool is, mathematically, mostly a description of two
cities.

So the ranking publishes two views: the list as it falls, and a view capped at eight per
metro. Neither is the "true" one. The capped view answers "where are the belts" and the raw
view answers "where do the individual best-scoring submarkets sit", and those are different
questions that deserve different lists.

## What the score is made of, and why

Five components, percentile-ranked across the candidate pool, weighted, and published:

{{chart:belts-weights}}

The weights encode a thesis, and the thesis is arguable — which is exactly why it is
printed rather than hidden behind the word *proprietary*.

**Gross yield, +34%.** What the submarket pays now, before every operating cost. It is a
screening ratio, not a return, and calling it a return is the single most common abuse of
this number in the industry. But as a first cut on "does this place pay", it is the most
honest input available.

**Rent growth over twelve months, +24%.** Demand expressed in rent rather than in price.
Rent is what a tenant will actually pay this month; price is what a buyer believes about the
future. When the two disagree, rent is the one with money behind it today.

**Drift, +22%.** This is the component most rankings leave out, and it is the most
interesting one. Drift is rent growth *minus* value growth.

A submarket where rents are outrunning prices has not yet repriced its own demand. Someone
is paying more to live there and the asset market has not caught up. A submarket where
prices outran rents is selling you someone else's optimism: the income did not move, the
expectation did.

Put crudely — and this is the whole argument of the ranking — **positive drift is the
market telling you something before the price tells you.**

**Volatility of the value series, −12%.** A penalty, not a bonus. A series that thrashes is
harder to underwrite regardless of its trend.

**Holdout error, −8%.** Also a penalty, and the subtle one. We fit the model without the
last {{fig:holdout_months}} months and ask it to predict them. A large error does not mean
the submarket is bad. It means *this method cannot see it* — which is a different warning,
and arguably a more useful one, because it tells you where not to trust your own tool.

## Missing components are counted, never imputed

One mechanical decision matters more than the weights.

Each submarket is scored over **only the components it can actually answer**. A missing
component is counted and shown; it is never filled in with the average of its peers.

This sounds pedantic until you consider the alternative. Imputing the mean for a missing
component does not produce a neutral result — it produces a submarket that looks *average*
on a dimension where it is in fact *unknown*, and average is a score, which means an unknown
has been silently converted into a middling measurement. Do that across a few thousand rows
and your ranking is substantially a ranking of data availability wearing the costume of a
ranking of markets.

The same rule runs through everything we build: unknown is an answer, and it is not the
same answer as "fine".

## What the ranking actually surfaces

Two patterns show up that a price-appreciation list would invert.

The first is that several of the strongest-scoring submarkets have *falling* twelve-month
values alongside rising rents. On an appreciation list they are losers. On drift they are
among the most interesting places in the dataset, because the income is moving in the
opposite direction to the price — which is the definition of a market that has not
repriced.

The second is the geography. The top of the list is not where a "hot markets" article would
send you. It is Milwaukee ZIPs, Shreveport, Oakland, Indianapolis, Columbus — places where
the entry price is low enough that the yield component has room to work, sitting next to
expensive coastal ZIPs that score well on rent growth and drift despite yields that would
look unimpressive alone.

That mix is the point. A single-factor list produces a single kind of place. A weighted list
over components that disagree with each other produces a list you have to think about.

## What it will never tell you

Three limits, stated as plainly as we can.

**It ranks submarkets, not properties.** A ZIP that scores well still has to survive the
seven gates on the actual parcel: the record, the use class, the physical asset, the
financing, the insurance quote. A good submarket full of bad buildings is a good submarket.

**Gross yield is not a return.** It is rent before operating costs, tax, vacancy, capital
expenditure and financing. It is a ratio for sorting a list, and any use beyond sorting a
list is misuse.

**Index values are not prices.** The value and rent figures are published index levels. They
are not what anything sold for, and in the non-disclosure states in this dataset, no such
public figure exists at all.

**And past index movement does not predict future index movement.** We include a component
explicitly designed to tell us when our own method cannot see a series, which should be read
as what it is: an admission that the method has a domain, and that the edges of it are
marked.

## Why publish the weights at all

The commercial instinct is to keep the scoring model closed. A published model can be
copied, argued with, and shown to be wrong.

That is the argument for publishing it.

A ranking that cannot be argued with cannot be checked, and a ranking that cannot be checked
is a brand, not a measurement. If someone disagrees that drift deserves 22%, we would like
to have that argument — it is a real question about how markets work, and the answer would
improve the ranking. What we would not like is a reader who assumes the number means more
than it does because they cannot see how it was made.

Every submarket in the ranking carries its yield, its rent growth, its drift, its
volatility, its holdout error and its rank, so anyone can rebuild the score, re-weight it to
their own thesis, and see what moves. Several things move a lot. That is informative too.

The coverage statement, the weights and the component table are all published together for
the same reason: they are the parts that let you decide how much of this to believe, and
handing a reader a rank without them is handing them a conclusion with the reasoning
removed.
