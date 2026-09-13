---
title: "Commercial" is not a use class. Eight counties, forty-eight codes and twenty-six traps.
slug: nobody-agrees-what-commercial-means
date: 2026-09-13
topic: The record layer
summary: The use code is the most load-bearing field in any property dataset and the least portable. Ours are mapped only from a measured query or a published manual, each carrying its source and date — and the caveats we found along the way are worth more than the mappings.
---

Ask any property database for apartment buildings and something has to decide what an
apartment building is.

That decision is not made by the database. It is made, separately, by every assessor's
office in the United States, for the purpose of collecting tax, using a vocabulary that
office invented and maintains for itself. One county writes `GRDN APT`. Another uses a
three-digit statutory code. A third has a hierarchical scheme where the interesting
distinction lives in a suffix that appears in no published document. None of them were
designed to be compared with each other, because none of them were designed to be compared
with anything.

Everything downstream — every filter, every screen, every "multifamily in your market"
search on every platform in this industry — rests on somebody's translation of those
vocabularies into a common one. The translation is the product. It is also, almost
universally, invisible.

## Why this is the field that decides everything

A property record's other fields degrade gracefully when they are wrong. An assessed value
off by fifteen percent still ranks the parcel roughly where it belongs. A stale year-built
misleads mildly. A missing floor area shows up as a blank.

A use code that is wrong does not degrade. It removes the parcel from every search that
should have found it, or inserts it into every search that should not have — silently, with
no blank cell anywhere to signal that something happened. A screen that returns forty
buildings when the correct answer is sixty looks exactly like a screen that returns forty
when the correct answer is forty. There is no visible failure mode. The only way to know is
to check the mapping, which is precisely what a national dataset with an undisclosed
crosswalk will not let you do.

So the crosswalk is published as data, with sources and dates, and this article is about
what building it actually turned up.

## The rule, and the number of things it produces

One rule governs the whole file: **a code is mapped only from a measured query against the
live layer, or from a manual the jurisdiction itself published.** Never from the label.

That sounds almost too obvious to state until you look at what it forbids. A code whose
description reads `APARTMENT - GARDEN` may not be classed as apartments because it says
apartment. Somebody has to run a group-by against the actual layer, see how many parcels
carry the code, and record the count and the date — or find the county's own code manual
and transcribe it, marked as transcribed.

What that rule has produced so far: **{{fig:crosswalk_codes}} codes** across
**{{fig:crosswalk_juris}} jurisdictions**, mapped into **{{fig:crosswalk_classes}} screening
classes**, standing on **{{fig:crosswalk_measured}} measured parcels**.

**{{fig:crosswalk_verified}}** of those codes were verified against a live layer on a dated
pull. **{{fig:crosswalk_unverified}}** were transcribed from a published manual and have not
yet been measured against live data, and they carry a null verification date that says so.
That distinction is visible in the file rather than smoothed away, because a code read off a
PDF and a code counted in a layer are different kinds of knowledge and the difference
matters the first time a manual turns out to be three revisions behind the system.

{{chart:crosswalk-classes}}

## Why there are only six classes

The target vocabulary is deliberately small: **{{fig:crosswalk_classes}} screening classes**,
and no more.

Lodging. Purpose-built apartments of five units and up. Small multifamily, two to four
units — the agency-financeable end, which is a genuinely different financing world rather
than a size gradient. Student housing. Mobile-home parks. Mixed residential: store-or-office
over apartments, and residential conversions.

A larger vocabulary is easy to write and impossible to sustain. Every additional class is a
line that must be drawn identically in every jurisdiction, by people reading local code
strings, forever. Split apartments into garden, walk-up, elevator and high-rise and you have
created four boundaries that the source data mostly cannot adjudicate: a county that writes
one apartment code has no opinion about which of your four it is, so either you guess or
three of your classes are empty there.

The six exist because each one changes what a reader must *do* next. The document you demand
is different: a hotel's operating history is a different artefact from an apartment's rent
roll. The financing is different at the two-to-four boundary. The lease length is different
by an order of magnitude between lodging and apartments. The regulatory exposure is
different for student housing and for mobile-home parks, sharply so in some states. A class
that does not change the next action is a facet, not a class, and facets belong on the raw
string where they can be filtered without pretending to be structure.

The small vocabulary also fails visibly. When a code does not fit any of the six, there is
nowhere convenient to put it, which forces the question rather than allowing a shrug into a
general bucket. Products with a forty-class taxonomy almost always have one class doing
enormous silent work, usually called other, and nobody ever audits it.

## Twenty-six caveats, which are the actual product

The mappings took an afternoon each. The caveats took the rest, and there are
**{{fig:crosswalk_caveats}}** of them. Four are worth reproducing in spirit because each one
represents a wrong answer somebody would otherwise ship.

**A unit count that is not a unit count.** One county publishes a field whose name reads
unambiguously as a count of units. It is a billing and appraisal unit count of *any* kind —
it counts whatever the appraisal treats as a unit for that parcel's valuation method. It is
only a dwelling-unit count when it is combined with a residential decode. Take it at its
name and you will produce a list of two-hundred-unit apartment buildings that are actually
commercial parcels with two hundred billable somethings.

**A server that answers, incorrectly, in silence.** For one jurisdiction, the map service
endpoint returns NULL for every statistic — not an error, not an empty result set, a
perfectly well-formed response with nulls in it. The feature service sibling, same data,
same fields, returns the real numbers. Query the wrong one and your group-by comes back
looking like a jurisdiction with no apartments at all. This is the single most dangerous
class of data defect in public GIS work: the endpoint that is confidently wrong rather than
unavailable.

**A suffix documented nowhere.** One county's lodging codes carry family suffixes that
appear in no public documentation at all. The honest handling is to treat the family as
lodging, keep the raw string on the record, and say in the caveat that the sub-distinction
is unknown. Not to invent a taxonomy for the suffix because a pattern is visible.

**A value field that is zero for real reasons.** On one county's rolls, the total assessed
value is zero on homeowners'-association and condominium shell parcels, because the value
sits on the individual unit rows instead. A ranking that sorts on that field and filters out
zeros silently deletes an entire ownership structure from the results. This is why
**{{fig:crosswalk_value_fields}}** of the {{fig:crosswalk_juris}} jurisdictions declare an
explicit value field and a ranking note: what a top-properties list may honestly sort on,
and what that sort does to the rows it cannot see.

Notice the shape these share. Every one is a case where the data answers your question
fluently and the answer is wrong, with nothing on screen to indicate it. They are not
discovered by reading documentation. They are discovered by running a query, getting a
number, and asking whether that number is plausible — which is a habit, not a tool.

## How one mapping actually gets made

The procedure is five steps and it is the same every time.

1. **Find the layer, and then find out whether it is the right one.** Jurisdictions commonly
   publish the same data through several endpoints with different behaviour. The one linked
   from the public-facing page is frequently not the one that answers aggregate queries
   correctly.
2. **Ask for a count before asking for rows.** A count query tells you whether the field you
   intend to group on exists, is populated, and holds what you expect — at a fraction of the
   cost to a public server that is doing you a favour by existing.
3. **Group by the use-code field and read the whole distribution.** Not just the codes you
   are looking for. The long tail is where the surprises live: the code with four parcels
   that turns out to govern the entire student-housing stock, the code with forty thousand
   parcels that is the county's way of saying vacant.
4. **Hunt for the county's own manual.** If it exists, it converts your inference into a
   transcription. If it does not exist, that is itself a finding and belongs in the caveats.
5. **Write the caveats before writing the mappings.** Whatever confused you will confuse the
   next person, and it is at its most legible in the hour you spend confused.

Step five is the one that most obviously pays. A caveat written during the work reads
"TOTUNITS is a billing unit count, not dwelling units — only meaningful ANDed with a
residential decode." A caveat reconstructed three weeks later reads "check TOTUNITS
carefully", which helps nobody.

## Keeping the raw string

Classification here is additive. The original code stays on the record alongside the class
it was mapped to, always.

The reason is that a class is our opinion and the code is the county's fact. If we later
decide that a code was mapped wrongly, every affected record can be re-derived, because the
input survived. If the raw string had been overwritten with the class at ingest — the
efficient choice, the one that saves bytes and simplifies the schema — the error would be
permanent and invisible, and the only repair would be re-pulling the source.

It also means anyone can check us. A reader who knows a jurisdiction well can look at what
the record actually says and disagree with where we put it. That is not a courtesy; it is
the only mechanism by which a crosswalk built by people who do not live in all eight
jurisdictions gets corrected.

## Statewide schemes are easier, and rarer than you would hope

Two of the jurisdictions here are statewide code sets rather than county ones — a state
department of taxation's scheme and a state revenue department's assessment-roll codes.
These are genuinely better: one vocabulary, published, applied by every county in the
state, and when you verify it against two counties you have reason to expect the third to
behave.

But statewide does not mean uniform in practice. Counties apply a shared scheme with local
habits: which codes they actually use, how they treat edge cases, whether a code that
exists in the manual has any parcels behind it at all. So even a statewide mapping is
verified per county where it has been verified at all, and the file records which counties
it was checked against rather than implying the whole state.

The rest are county vocabularies, and a county vocabulary is exactly as portable as it
sounds: not at all. A mapping built for one county is a starting hypothesis for its
neighbour and nothing more.

## The jurisdiction that is missing, and why that is in the article

The most conspicuous absence in the crosswalk is Louisiana — the platform's anchor market,
the subject of more of our state-layer work than anywhere else, and the source of the
largest pair of parcel editions we ship.

Its use codes are not mapped. Which means the class screen — the tool that answers "show me
the small multifamily in this parish" — does not run there. Asked for a jurisdiction it has
no vocabulary for, it exits and prints the list of jurisdictions it does have. It does not
degrade to matching on label text, and there is no flag that makes it.

(The same screen prints a vocabulary warning when a jurisdiction's codes include ones
transcribed from a manual but not yet measured against a live layer. Running on partially
verified ground is allowed; running on it silently is not.)

Inferring would be easy. The labels are in the data, they are in English, and a plausible
mapping could be produced in an hour. It would also be indistinguishable, in the output,
from the {{fig:crosswalk_verified}} mappings that were actually measured — same column,
same class name, same confident filter behaviour — and that indistinguishability is exactly
the problem. One unsourced mapping in a file of sourced ones does not add a little
coverage; it removes the meaning of the whole column.

So the gap stays, and it is named here rather than only in a config file, because an
anchor-market gap is the kind of thing a platform is tempted to keep quiet about.

## Why you cannot simply buy this

The obvious objection is that national datasets already exist with a unified land-use
column, so why do any of this.

They do exist, and the unified column is real work by real people. The problem is that the
mapping is the vendor's, it is not published, and it is not versioned in anything you can
see. You cannot ask which local code produced a given classification. You cannot tell
whether a category changed meaning between two vintages of the file. You cannot check
whether your market's peculiar code — the one that governs half the stock you care about —
was handled or bucketed into other.

For a general-purpose national product that is a reasonable trade. For a tool whose entire
premise is that a user can audit every number it shows, it is not available: an unauditable
field at the base of the stack makes every audited field above it decorative.

The crosswalk is also, genuinely, the least glamorous artefact this platform produces. It
is a JSON file of code strings. Nobody will ever screenshot it. It is what determines
whether any search on any map anywhere in the product returns the right buildings.

## What a use code cannot tell you

Even perfectly mapped, this field answers a narrower question than people ask of it, and the
gap is worth naming because it is where confident analysis goes wrong.

**A use code is not zoning.** It records how the assessor classifies the property for
valuation, which reflects how the building is used now — including uses that are legal
nonconforming, grandfathered, or frankly unpermitted. Zoning records what may be built or
operated there under current ordinance. The two disagree constantly, and the disagreement is
often exactly the opportunity or exactly the trap. A conversion play lives precisely in that
gap, and neither field alone can see it.

**A use code is not a business model.** Two parcels sharing a lodging code can be an
extended-stay property with ninety-day tenancies and a resort with three-night stays. The
screening class says what kind of building it is. It says nothing about how the income is
actually produced, and the income structure is most of the underwriting.

**A use code is not current.** It changes when the assessor changes it, which happens on the
assessment cycle or when something triggers a review — not when the building changes use. A
property converted last year may carry its old classification for another cycle. The
verification date in the crosswalk is about our mapping of the vocabulary; the freshness of
any individual parcel's code is the county's cycle, and we do not control or claim it.

**A use code says nothing about condition, income or title.** It is one gate of several, and
the platform's structure reflects that: classification narrows the set, and everything that
decides whether a specific building is worth anything happens afterwards, on documents that
are not public record at all.

## One question to ask any property dataset

If you take one practical thing from this article, make it a question to ask of any product
that offers you a national or multi-state property search:

**"For this result, which local code produced this classification, and when was that mapping
verified?"**

It is a fair question with a short correct answer. A system that has done the work can tell
you the source field, the code string, and a date. A system that cannot tell you is not
necessarily wrong — it may well be mostly right — but you have no way to distinguish its
right answers from its wrong ones, which means you cannot use it for anything where being
wrong matters.

Watch for three specific evasions. The first is a description of the *target* taxonomy in
place of the mapping — a page explaining what the vendor means by multifamily, which is not
an answer about how your county's codes reach it. The second is a coverage claim standing in
for a provenance claim: "all 3,000+ counties" describes reach, not correctness, and the
counties hardest to classify are exactly the ones where a blanket claim is least likely to
hold. The third is a confidence score, which quantifies a model's certainty about a mapping
nobody has verified, and which reads as rigour while being, in the strict sense, a number
about a guess.

Our own answer is the crosswalk file: the field name, the code string, the class, the
measured parcel count and the verification date, per code, published. It covers
{{fig:crosswalk_juris}} jurisdictions, which is a much smaller answer than the ones you will
be offered elsewhere. It is an answer.

## What this costs, and what comes next

It is slow. Each jurisdiction is a day or more: find the layer, confirm which endpoint
answers honestly, run the group-bys, read the counts, hunt for a published manual, write
the caveats. The result is **{{fig:crosswalk_codes}} codes**, which is a small number to
show for it.

It does not generalise. There is no clever approach that maps the next county faster,
because the next county's vocabulary is a different vocabulary. This work is linear in
jurisdictions forever.

And it is never finished, because codes change. A county revises its scheme, adds a
category, retires another. Every mapping carries a date for that reason — not as
bookkeeping, but because a two-year-old mapping is a hypothesis about a system that may
have moved.

What comes next is Louisiana, for the reason above: the market where we have the most
records is the market where classification is most blocked, and that ordering is backwards.
After that, the jurisdictions where rows are already pulled and sitting unpacked — mapping
their codes is the cheapest coverage available anywhere in the project, because the data is
already in hand.

Neither of those will produce a chart worth looking at. Both determine whether the charts
that do exist are true.
