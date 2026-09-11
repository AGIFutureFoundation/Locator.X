---
title: We were holding 4,443 hotels that nobody could search for
slug: hotels-nobody-could-search-for
date: 2026-09-09
topic: The record layer
summary: The records were there. The filter had four buckets and none of them was lodging, so every hotel in the catalogue sat quietly inside "5+ units". This is what happens when a product's category vocabulary drifts from the vocabulary of the record underneath it.
---

The bug was not in the data. The data was fine.

Across four shipped editions our catalogue holds **{{fig:lodging_total}} lodging records** —
hotels, motels, resorts, residential hotels — each with a value and a unit count attached.
They were ingested correctly, stored correctly, mapped correctly, and rendered on the map
like everything else.

You could not find them. There was no way, in the product, to ask for a hotel.

## How a category vocabulary drifts

The property-type filter offered four options: single-family, two-to-four units,
condominium or townhouse, and five-plus units. Underneath, one function decided which
bucket a record fell into, by pattern-matching the record's own use description:

```
if condo|townhouse|pud  -> condo
if 5+|apartment         -> apt
if units > 1            -> multi
otherwise               -> sfr
```

Read it as a hotel. A hotel is not a condo. It does not say "apartment". It has many units,
so it lands in `multi`, or in `apt` if its description happened to contain the word. Every
lodging asset in the catalogue was quietly filed as residential, and the only way to see
one was to scroll past everything else.

This is not an exotic failure. It is the most ordinary failure in data products: **the
vocabulary the interface reasons in drifted apart from the vocabulary the record is written
in, and nothing in the system was responsible for noticing.**

The four buckets were not wrong when they were written. They were a reasonable reading of a
residential catalogue. Then the catalogue grew corridor markets, and commercial lodging
arrived, and the filter did not grow with it — because a filter that returns results never
looks broken.

{{chart:lodging-by-edition}}

## The vocabularies are genuinely different, and that is the real lesson

Here is what makes this more than a missing dropdown option. We looked at what the records
actually call themselves, and the jurisdictions do not agree with each other even slightly.

New Orleans records a single flat class: `Hotel / lodging`. All {{fig:lodging_nola}} of
them, one string.

The Bay Area splits the category five ways — `Hotel`, `Motel`, `Hotel / motel / MH park`,
`SRO / residential hotel`, `SRO hotel` — which is not fussiness. A single-room-occupancy
residential hotel is a fundamentally different asset from an airport Marriott: different
tenancy, different regulation, different income profile, different exit. San Francisco's
record makes the distinction because in San Francisco the distinction is consequential.

The corridor counties produce six more spellings again, including `Com Hotels` and the
magnificent `Inn, lodge, rooming or fraternity house — Room/dorm`.

{{chart:lodging-places}}

That last one is worth dwelling on, because it nearly caused a second bug on top of the
first. The string opens with two lodging words — *inn*, *lodge*. A naive classifier reads
it as a hotel. But the authoritative mapping for that jurisdiction, taken from the county's
own published code list, assigns it to **student housing**. The county is describing a
dormitory, and the words "inn" and "lodge" are in the label because the code covers a range
of congregate accommodation.

If we had matched on the obvious keyword, we would have moved 217 dormitory records into
the hotel bucket and called it a fix.

## String matching is a display convenience, not a classification system

The correction we shipped does two things, and the second matters more than the first.

The first is the obvious one: the filter now offers the full set of screening classes —
lodging, student housing and mobile-home park alongside the residential ones — and the
classifier tests them in an order settled against real labels rather than intuition.
Student housing is checked *before* lodging, precisely because of the dormitory case above.
Lodging is checked *before* the unit-count rules, which is what makes a hotel findable at
all.

The second is a statement about what that classifier is allowed to be. It is a **display
heuristic over the record's own description string**. It is not the authority on what a
parcel is. The authority is the crosswalk: a per-jurisdiction mapping from published use
codes to screening classes, each entry carrying the source it was verified against and the
date it was verified.

{{chart:crosswalk-classes}}

Where the heuristic and the crosswalk disagree, the crosswalk wins. The heuristic exists so
that a class is reachable in a dropdown, not so that it can decide a fact.

One label remains genuinely ambiguous and we have left it that way: the Bay Area's
`Hotel / motel / MH park` is a compound that could be lodging or could be a mobile-home
park, and no Bay Area county is mapped in our crosswalk yet, so nothing can resolve it. It
currently reads as lodging, so the stock is findable, and the code says in a comment that it
is unresolved and names the probe that would settle it. An ambiguity you have written down
is a task. An ambiguity you have quietly resolved is a bug with a confident face.

## The gap this exposed in our own coverage

Following the thread produced a finding about our own product that is more uncomfortable
than the original bug.

Our crosswalk covers {{fig:crosswalk_juris}} jurisdictions and {{fig:crosswalk_codes}}
codes, of which {{fig:lodging_juris}} publish a lodging class we have mapped. Not one of
those jurisdictions is in Louisiana or the Bay Area — our two anchor markets, holding
{{fig:lodging_bay}} and {{fig:lodging_nola}} lodging records respectively.

**The markets with the most hotel stock in the catalogue are the two whose lodging
vocabulary we have never mapped.**

That is not a data-acquisition problem. It does not require pulling 50,000 new rows. It
requires one measured `groupBy` on the use-code field per jurisdiction, recorded with its
source and its date — a probe, not a project. It is now the first item in our expansion
queue, ahead of every new market, because mapping a vocabulary we already hold records
against is worth more than acquiring records in a vocabulary we cannot read.

## How to stop this happening to you

Three things, in order of how much they would have helped us.

**Make the filter assert, not just render.** Our regression test now requires that every
screening class the product offers selects a non-empty set in the demo. An option that
filters to nothing is the same defect as no option at all, only harder to notice — and it
is exactly the state we shipped in. A test that checks the dropdown contains seven items
would have passed throughout.

**Make the demo data exercise every branch.** Our synthetic fixtures previously carried six
residential property types and nothing else, so no test could have caught a lodging bug
even in principle. They now carry one label per class, deliberately shaped like the real
ones — including the compound Bay Area string and the dormitory label — because the fixture
exists to exercise the classifier, not to look plausible.

**Write down where authority lives.** The single most useful artefact in this whole episode
was a file that says, per jurisdiction, what each published use code means, with a source
and a date. Not because it is glamorous, but because when the heuristic and the record
disagreed we had somewhere to look that was not an argument about what "lodge" means.

## The part that should worry you

We found this because we were measuring something else. We were benchmarking memory, drove
every view of the product looking for charts that rendered without a visual, and noticed a
count that did not make sense.

Nothing had errored. No test had failed. No user had complained — because a user searching
for hotels in a tool with no hotel option does not file a bug, they conclude the tool does
not cover hotels and leave.

Silent under-coverage is the hardest class of defect in any data product, because the
system's confidence is unchanged. The page still renders. The filter still filters. The
number in the corner still counts something. It is just counting a smaller world than the
one you loaded, and it will never tell you.

The only defence is to keep asking the data what it contains, rather than asking the
interface what it shows.
