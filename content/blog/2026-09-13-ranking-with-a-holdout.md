---
title: We ranked 464 submarkets and threw away 273 more. The throwing away is the method.
slug: ranking-with-a-holdout
date: 2026-09-13
topic: Method
summary: Any list of the best places to buy is a claim about the future, and almost none of them can be checked. This one names its inputs, withholds a year of data to score its own error, counts what it could not answer, and publishes the states it cannot see at all.
---

Every ranked list of American real-estate markets you have ever read has the same two
problems, and neither of them is the ordering.

The first is that the list does not say what would make it wrong. It arrives as a finished
object — ten cities, twenty-five metros, a hundred neighbourhoods — with a plausible
narrative attached to each entry and no statement of the inputs, the weights, or the
window. You cannot check it. You cannot reproduce it. A year later nobody goes back and
asks whether it worked, because the list never committed to anything falsifiable in the
first place.

The second is that the list is silent about its own coverage. Somewhere behind it is a
data source, and that source does not cover the whole country evenly. Some markets are
thin. Some are absent. But a ranking is a dense object by construction — a hundred rows,
one through a hundred, no gaps — so a reader naturally assumes the hundred were drawn from
the whole country. Frequently they were drawn from about a quarter of it.

This article is about how our own submarket ranking handles both problems, because the
handling is not incidental to the product. It *is* the product. The ordering is the least
interesting thing in the file.

## What is actually being ranked

The unit is a ZIP submarket, not a metro. That choice was forced, and the file says so.

To score a place on what it pays *now* rather than what it has appreciated, you need two
series for the same geography over the same window: a home-value index and a rent index.
Both exist publicly. They do not cover the same places. At metro grain the overlap is
narrow enough that the file states it as the reason the metro was rejected as the unit:
too few metros carry both series to build a hundred-row list without repeating yourself
into meaninglessness. At ZIP grain the overlap is wider, so ZIP is the unit, and the file
records that reason rather than leaving the reader to assume ZIP was chosen for precision.
It was chosen for availability.

That is the first honest concession in the method and it sets the tone for the rest. A ZIP
code is not an economic region. It is a mail-routing polygon that sometimes straddles a
freeway, a school district boundary and two entirely different rental markets. Using it as
the unit buys coverage and pays for it in homogeneity. Both halves of that trade belong in
the open, because an analyst who does not know the unit is a postal artefact will read more
into a one-rank difference than the geometry can carry.

## The candidate set, and the third of it that did not survive

Start from every ZIP where both series exist: **{{fig:belts_candidates}} candidates**.

Then apply a data floor. A submarket must carry at least **{{fig:belts_min_points}} monthly
observations** in each series across the five-year window the sources publish. Below that
floor, a ZIP is not ranked at all. Not ranked low — not ranked. **{{fig:belts_skipped_thin}}
candidates** failed the floor and were set aside as thin series, and the count is published
in the coverage block rather than quietly absorbed.

What remains is **{{fig:belts_ranked}} ranked submarkets**, spanning
**{{fig:belts_counties}} counties** in **{{fig:belts_metros}} metros**, from which the
published hundred are drawn.

It is worth sitting with that ratio for a moment. More than a third of everything that
could conceivably have been scored was discarded before scoring began, on a rule fixed in
advance and stated in the file. The alternative — the thing almost every commercial ranking
does — is to score the thin ones anyway on whatever data is there, because a ranking with
more rows looks more authoritative than a ranking with fewer. A twelve-month series and a
sixty-month series then sit in the same column, ranked against each other, with nothing on
the page to tell you which is which.

That is not a subtle error. A short series systematically understates volatility, because
volatility is a property you can only observe over time. Mix short and long series in one
ranking with a volatility penalty in it, and you have built a machine that rewards being
new to the dataset. The floor exists to stop exactly that.

## Five components, and what each one is for

Each surviving submarket is scored on five things. The weights are published, which means
you can disagree with them precisely instead of vaguely.

{{chart:belts-weights}}

**Gross yield** is the largest single weight. It is the annualised rent index over the
value index — what the place pays now, before every operating cost. This is a screening
ratio and nothing else. It is not a return, it is not a cap rate, and it does not survive
contact with taxes, insurance, vacancy, management or capital expenditure. In coastal
Louisiana the insurance line alone can take more of it than the mortgage does. Yield ranks
first here because it is the component most directly about cash flow, which is the
doctrine the whole platform is built on — cash flow before capital gains — and because it
is the component least dependent on a model.

**Rent growth over twelve months** asks whether the cash side is moving in the right
direction. Note what is *not* in the weights: home-value growth. A place whose values are
climbing fast is not scored up for it. That is deliberate and it is the single most
opinionated thing in the method, so it should be stated plainly rather than buried: this
ranking does not reward appreciation.

**Drift** is rent growth minus value growth. It is the most interesting component and the
easiest to misread. Positive drift means rents are outrunning values — the yield is
widening, which is what you want if you are buying cash flow. Negative drift means values
are outrunning rents, which is what a market looks like when it is pricing in a future the
rent roll has not delivered yet. Drift is not a prediction. It is a description of a gap,
and the gap can close from either end.

**Volatility** of the value series carries a negative weight. A submarket whose index
whipsaws is harder to underwrite, and being hard to underwrite is a cost even when the
average is good.

**Holdout error** also carries a negative weight, and it is the component that makes this
list checkable at all.

## The holdout, and why it is a penalty rather than a gate

Withhold the last **{{fig:holdout_months}} months** of each series. Fit on everything
before them. Then compare what the fit expected against what actually happened in the
withheld year, and carry that error into the score as a penalty.

This is standard practice in any discipline that has to defend a forecast, and it is close
to absent from published real-estate rankings. The reason is not ignorance. It is that a
holdout is embarrassing. It produces a number that says, in public, *here is how wrong this
model was on data it had never seen*, and a ranking that reports its own error is easy to
attack in a way that a ranking of vibes is not.

Two design choices inside the holdout are worth defending.

The first: the error is a **penalty, not a filter**. A submarket with high holdout error
still appears, ranked lower. The alternative — dropping everything the model fits badly —
would quietly select for predictability and call it opportunity. Some real markets are
genuinely hard to model; a place recovering from a shock, a place with a new employer, a
place where the index is being dragged by a handful of transactions. Those places belong in
the list with their error visible, not excluded so the list can look tidy.

The second: the penalty is **small** — the lightest of the five weights. Model error is
evidence about the model, not about the building. Weighting it heavily would turn a
ranking of submarkets into a ranking of how well a particular curve fit a particular index,
which is a fact about our arithmetic and not about anywhere anyone can buy.

## Percentile ranks, not raw values

Each component is percentile-ranked across the candidate set before the weights are
applied. Nothing is scored on its raw magnitude.

This sounds like a technicality and is not. Yield, rent growth, drift, volatility and
holdout error are measured in different units with wildly different spreads. Combine the
raw numbers with weights and the weights do not mean what they say — whichever component
happens to have the widest numeric spread dominates the total regardless of the number you
wrote next to it. The published weight becomes decorative.

Percentile-ranking first makes the weights honest. A weight of a third really is a third of
the decision. It costs something: two submarkets separated by a hair in raw terms can be
separated by several percentile points if the candidates happen to bunch there, and the
compression at the tails means an extraordinary outlier scores the same as a merely
excellent one. That is the trade, and it is the right way round for a screen whose purpose
is to shorten a list for a human to look at, rather than to price anything.

## What happens when a submarket cannot answer

Here is the part that took the longest to get right, and it is the rule the rest of this
platform is built on: **a missing component is counted and reported, never imputed.**

When a submarket cannot answer one of the five questions, the score is computed over only
the components it *can* answer, and the unanswered ones are recorded on the row itself.
The obvious alternative — fill the gap with the median, or the metro average, or last
year's value — is a fabrication with a statistical costume on. It produces a complete-looking
table in which some cells are measurements and others are guesses, with nothing to tell
them apart, and every downstream consumer treats them identically because the table gives
them no reason not to.

In the published hundred, that reporting slot is currently empty: every row in the list
answered all five. This is worth saying out loud precisely because it is not a selling
point. The machinery for reporting unknowns exists, it is wired through the scoring, and
right now it happens to have nothing to say. If a future extraction brings in submarkets
with partial components, those rows will arrive carrying their gaps in public rather than
silently averaged into respectability.

An empty honesty mechanism is not a wasted one. It is the thing that lets you believe the
non-empty ones.

## The per-metro cap, which is an editorial choice and is labelled as one

No more than **{{fig:belts_metro_cap}} submarkets** from any single metro reach the
published list.

There is no statistical justification for this. It is a product decision: a list of a
hundred submarkets that is sixty percent one city is useless as a screen, however correct
each individual row might be, because the reader's next question is always *and where
else?* The cap answers that question at the cost of suppressing rows that the score itself
ranked higher.

What matters is that it is in the `method` block with the weights and the floor, not
applied silently after the fact. A reader who thinks the cap is wrong can see it, argue
with it, and reconstruct the uncapped ordering from the same file.

And it does not fix the underlying concentration. Even with the cap in force, the top two
metros account for **{{fig:belts_top2_share}}** of the ranked set's concentration measure.
The data is lumpy. The cap trims the visible symptom of that lumpiness; it does not make
the country evenly covered, and it would be dishonest to let it look as though it had.

## The map with thirty-nine holes in it

{{chart:belts-states}}

Twelve states carry both series well enough to be ranked. **{{fig:belts_absent}} states are
absent entirely.**

Absent does not mean bad. It means *not measured*. There is no score for Texas in this
file, and the correct reading of that is not "Texas scored poorly" — it is "this method,
on these sources, had nothing to say about Texas." Any other reading turns a coverage gap
into a judgment, which is how a great deal of confident nonsense gets written about places
that simply were not in somebody's dataset.

The chart above shows where the published hundred actually come from, and it is the chart
we would most like readers to look at before the ordering. A ranking's coverage map is more
informative than its top ten, because the coverage map tells you the shape of the question
that was asked. The top ten only tells you the answer.

Nothing in the method attempts to hide the holes. The coverage block names the present
states and the absent states as explicit lists — not a count, not a percentage, the actual
names — so that a reader in an absent state learns it in one line rather than by scanning
a hundred rows and slowly realising.

## What this ranking is not

It is not a list of properties. It ranks submarkets, and a submarket that scores well is a
place to start looking, not a thing to buy. Every parcel inside it still has to survive the
seven gates the platform applies to individual records: location, ownership economics,
condition and income, assessment and tax, title and instruments, regulation and permits.
A good ZIP full of bad parcels is a very ordinary situation.

It is not built on prices. The inputs are index values. An index value is a modelled
statistic about a set of homes, not a transaction, and the gap between the two is
especially wide in the non-disclosure states where no public price exists to model from.
The word *price* does not belong anywhere near these scores and we work hard to keep it
out.

It is not a return. Gross yield is rent over value before every cost. Treating it as a
return is the single most common error made with a number of this shape.

And it is not advice. It is a screen over public data, published with its method attached,
for a reader who is going to do their own work afterwards.

## Three questions this list gets asked

**"Why is my city not in it?"** Almost always because one of the two series does not cover
it, or covers it too thinly to clear the data floor. Rent indices are built from listing
and lease observations, and those are dense in places with a lot of professionally managed
rental stock and sparse in places without. That sparsity is not random: it correlates with
market size, with the share of single-family rentals held by individuals, and with how much
of the local rental market never touches a listing platform at all. A city can have a large,
active, entirely functional rental market and still be invisible to an index built this
way. **{{fig:belts_skipped_thin}} candidates** were set aside for exactly this reason, and
the honest thing to say about all of them is "not measured", not "not good".

**"Why is a cheap city at the top?"** Because the largest weight is a ratio with value in
the denominator, and that is on purpose. A ranking built on yield will always surface
places where the purchase number is small relative to the rent number, and those places
tend to be the ones the property press writes about least. That is most of the point. The
places that dominate coverage — the coastal metros, the appreciation stories — score on a
dimension this method deliberately does not weight. If you want a list of where values have
climbed, this is the wrong file.

But cheap is also where the underwriting gets hard, and the ranking will not tell you that.
A low value index compresses every operating cost into a larger share of the rent. Taxes,
insurance and capital expenditure do not shrink proportionally with purchase price —
a roof costs what a roof costs. The gross yield that put a submarket at the top of this
list is computed before all of it. We have written about what that does to an actual deal
in [the underwriting article](underwriting-without-comps.html); the short version is that
gross yield and the number at the bottom of a real operating statement can differ by more
than half, and the direction of the error is always the same one.

**"Does a high score mean I should buy there?"** No, and the structure of the platform is
built around that no. A score here moves a place onto a shortlist. What happens next is the
seven-gate work on individual parcels — the assessment roll, the title instruments, the
permit history, the flood and regulatory layer — none of which a submarket-level index can
speak to. The ranking narrows where to look. It cannot tell you what you will find.

## What "now" means, and how fast it goes stale

Every figure in this file carries an extraction date, and the file itself instructs the
next person to re-extract rather than edit. That is a small rule with a large consequence:
there is no path by which a number in this ranking gets hand-adjusted between refreshes.
If it is wrong, it is wrong the way the source is wrong, and re-running fixes it.

It also means the ranking has a shelf life, and we would rather state it than let a reader
assume permanence from the confident typography. The value and rent indices behind it
publish monthly. Twelve-month growth figures move slowly — a month of new data rarely
reorders the top of the list — but the holdout error moves faster, because each refresh
replaces the withheld year with a more recent one. A submarket whose error is low today can
score worse next quarter without anything happening to the actual buildings, purely because
the model met a year it fit less well.

That is a feature of the method rather than a defect in it, but it does mean the correct
mental model for this list is "a screen run on a date" rather than "a fact about these
places". The date is on the page for that reason.

## What the method still owes you

Three things are missing, and naming them is cheaper than being caught with them.

The first is **cost adjustment**. Every score here is built on gross yield, and the single
most valuable improvement would be a net figure — rent after taxes, insurance and a
reserve. Two of those three are obtainable at parcel grain from the assessment rolls we
already hold. Insurance is not: there is no public, comprehensive, machine-readable source
for what coverage actually costs at an address, and in the Gulf states that missing line is
frequently the difference between a deal and a disaster. We would rather publish a gross
figure labelled gross than a net figure with a guessed insurance number inside it.

The second is **finer geography**. The ZIP is a compromise forced by index coverage, and
the compromise is real: within a single ZIP in an older city you can cross two distinct
rental submarkets on foot in fifteen minutes. Census tract or block group would be better
and the series do not exist there.

The third is **a longer holdout**. Twelve months is one seasonal cycle. It catches a model
that is badly wrong; it does not distinguish reliably between a model that is right and one
that got a good year. Lengthening it costs candidates — a longer withheld window means a
higher effective data floor, and the floor already removes more than a third of the
candidate set — so it is a trade rather than a free improvement, and we have not yet made
it.

## How to prove it wrong

The best thing about a ranking with a published method is that disagreeing with it becomes
technical work rather than argument.

If you think appreciation should count, the weights are in the file — add it and re-rank.
If you think the data floor is too strict, lower it and see how many of the
{{fig:belts_skipped_thin}} thin series change the top hundred. If you think the per-metro
cap distorts more than it fixes, remove it; the uncapped ordering is recoverable from the
same rows. If you think the holdout window is too short to mean anything, lengthen it — and
if that reorders the list materially, you have found something real about the stability of
the score, which is a genuinely useful finding and one we would want to publish.

Every one of those experiments is available because the method is not a story about how
carefully we thought. It is a set of numbers you can change.

That is the difference between a ranking and a list. A list asks you to trust the person
who wrote it. A ranking hands you the machine.
