---
title: Fifty courses ship with the instructor's notes empty, and they will stay empty until he writes them.
slug: fifty-courses-empty-notes
date: 2026-09-13
topic: The Academy
summary: A curriculum generated from one source of truth, an annotation layer built for a voice that has not spoken yet, and a rule that turns out to be load-bearing — the platform asserts no words, no biography and no endorsement that the person whose byline it carries did not supply.
---

There is an empty JSON file in this repository with a flag in it reading `supplied: false`.
It is the instructor profile. It has a name and nothing else — no biography, no credentials,
no career summary, no photograph caption, no quote.

Every instinct in software and in marketing says to fill it. A draft biography could be
written in ten minutes from public information, marked clearly as provisional, and handed
over for correction. That is the normal, courteous, efficient way to unblock a page.

We will not, and this article is about why that decision turned out to be the most
structurally important one in the Academy — along with what the fifty courses around it are
actually made of.

## What is in the catalogue

**{{fig:course_items}} items**: {{fig:course_courses}} courses and
{{fig:course_guides}} guides, arranged across **{{fig:course_pillars}} pillars** and
**{{fig:course_levels}} levels**, with **{{fig:course_pathways}} pathways** through them for
readers arriving with different goals.

The levels are a sequence of capabilities rather than a difficulty gradient. Foundation:
read a building, a record and a screen — nothing here requires capital. Practitioner: from a
listing to a written offer with the arithmetic behind it. Operator: debt, leases, operations
and the first development gates. Principal: other people's capital, full development, and an
evidence discipline that survives diligence.

Each level states what you can *do* at the end of it, not what you will have been exposed
to. That is a deliberately harsh format to write against, because it makes an empty course
obvious: you cannot claim a reader can size a deal against a buy box and produce an auditable
decision memo unless something in the level actually teaches them to.

## What an item is made of

Every item in the catalogue carries the same fields, and the field list is the design.

A **promise** — one sentence saying what the item does for the reader, written as a claim
rather than a topic. "Treat trust as a capital account: it is deposited, drawn down, and it
compounds or it does not" is a promise. "Introduction to relationships" is a topic. A topic
cannot be failed; a promise can.

A list of **modules** — what is actually covered, in order, including the exercise where
there is one.

A **landing** — where this item connects to the rest of the platform. Not a cross-reference
for tidiness: the landing names the tool or record surface where the idea stops being a
lesson and becomes something you do. An item whose landing is hard to write is usually an
item that teaches a vocabulary rather than a capability, and noticing that is the point of
making the field mandatory.

The **doctrine lines** it teaches, by number. This is what lets us check, mechanically, that
every doctrine line the platform asserts is taught somewhere — and, in the other direction,
that no item claims to teach a line it does not touch.

And the **prerequisites**: {{fig:course_with_prereq}} of the {{fig:course_items}} items declare at least one, which is what makes the catalogue a graph rather than a list.

## Prerequisites are a graph, and pathways are the way through it

Because prerequisites are per-item rather than per-level, the catalogue is a directed graph
and not a queue. The {{fig:course_levels}} levels describe capability tiers; the prerequisite
edges describe what actually has to come first.

That distinction matters for real readers. Somebody who already underwrites for a living and
wants the development material does not need to walk the numbers pillar to reach it — they
need whatever the development items genuinely depend on, which is a much shorter list and one
the graph can compute. Somebody arriving with no background needs the opposite: an order, not
a menu.

So there are **{{fig:course_pathways}} pathways** — routes named for the outcome rather than
the level: the first deal, the developer, the analyst, the partner. Each is a walk through the
same graph for a reader with a different destination, and none of them invents new material.
A pathway that had to add an item to make sense would be evidence the catalogue had a hole,
which is a more useful signal than a pathway that quietly papers over one.

## Guides are not courses, and the difference is enforced

{{fig:course_guides}} of the {{fig:course_items}} items are guides rather than courses, and
the distinction is not about length.

A course teaches a capability and can be assessed: at the end, you can do a thing you could
not do before. A guide orients — how to read this platform's score and evidence grade, how
the industry is structured, what the ninety-day path from curiosity to a first offer actually
looks like, how a mortgage becomes a security, what is changing in commercial real estate.

Labelling them differently prevents a specific dishonesty. An orientation piece dressed as a
course implies an assessable outcome it does not have, which inflates the catalogue count and
leaves a reader who finished it wondering what they were supposed to have learned. Calling it
a guide sets the expectation correctly: this is a map, and the capability is elsewhere.

It also keeps the count honest. A catalogue of {{fig:course_items}} items where
{{fig:course_courses}} are courses is a different product from one where all
{{fig:course_items}} are courses, and the difference is exactly the kind of thing that
disappears in a marketing round.

## The pillar that goes first

The first pillar is not finance, not valuation, and not the record. It is **emotional equity
and relationships**, and it sits underneath everything else rather than beside it.

This is the single most contested design decision in the curriculum, and the argument for it
is not sentimental. In this industry, terms, access and second chances are priced by who you
have been to people. The off-market call, the lender who returns a call after a bad quarter,
the contractor who fits you in, the seller who takes your offer over a slightly higher one —
none of that is produced by a spreadsheet, and all of it shows up in returns. Treating it as
soft skills to be covered after the real material gets the causality backwards.

So it is taught as a balance sheet: four accounts, deposits, withdrawals, and an overdraft
you cannot see until you need the account and it is empty. Same register as the rest of the
curriculum, same insistence on naming the mechanism.

The remaining pillars run: foundations and doctrine, the numbers, the asset, capital and
structure, development and delivery, evidence and judgment, and market and practice. The
**{{fig:course_doctrine}} doctrine lines** run through all of them — cash flow before capital
gains; an asset is something that pays you; debt is good only when the building services it;
the value you can add is the only edge you control; whatever could not be checked travels
with the answer; relationships are the deal flow.

Every item maps to the doctrine lines it teaches. Not decoratively: the mapping is in the
data, and it is how we can tell that a doctrine line is being asserted in the marketing and
taught nowhere.

## One source of truth, and a gate that enforces it

The curriculum lives in a single Python file. The course pages are generated from it, and
the generator is run in the gate: regenerate, and if the output differs from what is
committed, the build fails.

This is the derived-things-are-generated rule applied to content rather than code, and it
closes a failure that every documentation system eventually suffers. Somebody fixes a typo
in a rendered course page. The fix is real, the page is better, and the source no longer
agrees with it. Six months later the generator runs, the page reverts, and nobody can
reconstruct what the fix was. Here, a hand edit to a generated page cannot survive the gate —
which reads as friction on the first day and as the reason the catalogue is internally
consistent on the hundredth.

There is a matching rule for status. Whether an item has written content behind it is
answered by exactly one function, whose docstring says it is the only way to ask. Not by a
field somebody maintains, not by a boolean in a config, not by checking whether a file looks
long enough. One accessor, derived from what is actually there.

The reason is that status fields rot in one direction only. Nobody ever marks their own work
incomplete. A status computed from the content cannot be optimistic on someone's behalf, and
today it reports **{{fig:course_live}} of {{fig:course_items}} items live** — which is a
claim we can make because we did not write it down by hand.

## The annotation layer, built for a voice that has not spoken

The courses carry a byline. Until recently the platform had no way for the person behind that
byline to say anything at all, which is the weakest form of a claim: a name attached to
material it did not write, with no visible register in which that person exists.

So there is an annotation layer. A note attaches to a lesson, a gate or a development-route
stage by stable id, and renders in a visibly different typographic register from doctrine
text — a practitioner speaking, not the platform. Every anchor is checked at build time, so a
note can never point at a lesson that no longer exists, and a note with an anchor but no body
fails the same check.

**It ships empty.** Not "empty for now, with placeholder examples". Empty, rendering as
nothing at all rather than as a grey box saying *instructor note coming soon* — because a
placeholder pretending to be a note is a claim that there is a voice here, made before there
is one.

The same rule governs the profile: no biography, no credential, no tenure claim, no quote,
no endorsement that the platform owner did not supply. The file has a flag saying it was not
supplied, and the build renders no profile page at all when that flag is false. It does not
render a partial one. It does not render a name with an empty subtitle.

## What the Academy will not teach

The no-advice rule runs through the curriculum as hard as through the software, and it
changes the writing in a way that is worth describing because it is not obvious from the
outside.

The Academy teaches anatomy, never conclusions. What a financing contingency is *for* and
which unknown it resolves — not whether to include one in your offer. What the clauses of a
purchase agreement do and which of them are state-sensitive — not what your state's law says.
How a lender reads a coverage ratio — not which lender to use or what ratio to target.

The clearest expression of this is in the transaction material, where every state-sensitive
item is written as a **question for counsel** rather than as a statement of law. The question
form is not a disclaimer bolted on afterwards; it is the sentence itself, and a build gate
checks that those entries still end in question marks. A reader finishes that material able
to brief an attorney precisely, which is worth more than a confident paragraph that might be
wrong in their state and is certainly not tailored to their deal.

This costs the Academy the thing readers most want, which is to be told what to do. It is
also the only version of the material that a platform without a licence, without knowledge of
your jurisdiction, and without sight of your deal has any business publishing.

## Why the empty file is load-bearing

Here is the argument that convinced us, and it is not an argument about honesty in the
abstract.

Everything else on this platform asks the reader to believe a claim about provenance. That an
assessed value was labelled an assessment because that is what it is. That a use code was
mapped from a measured query rather than inferred from its label. That a coverage row saying
`no public record` reflects a jurisdiction rather than our own tiredness. A user cannot verify
any of that from the outside. They are, in the end, extending trust.

An invented biography is the cheapest possible test of whether that trust is warranted — and
the easiest one to fail, because it costs nothing, helps everyone, and nobody would ever find
out. A platform willing to write a paragraph of plausible career history under someone else's
name has demonstrated exactly the disposition that produces an inferred use code at 2am.

The empty file is not fastidiousness. It is the same rule as the null insurance field and the
unmapped Louisiana codes, applied to a person: **we do not fill a gap with something
plausible because the gap is inconvenient.** Applying it where it costs us a nice-looking
page is what makes it credible where it costs a user money.

There is also a plainer point. Words attributed to a real person are that person's, and
attributing manufactured words to them — even flattering, even provisional, even clearly
marked — is not a decision a piece of software gets to make on their behalf.

## The queue, which is the useful half

The mechanism above is the boring part. The interesting part is what the annotation layer
does while it waits.

An instructor's time is the scarce input in any curriculum, and the standard approach is to
hand them the whole catalogue and ask where they would like to start — which converts their
scarce time into a browsing problem. Instead, the layer reads what learners have actually
recorded as they work: gate disagreements, certainty errors, theses carrying unsourced
figures, route stages walked past without reading, failed drills. Then it ranks the places
where a note from someone who has actually done this would be worth the most, and exports the
ranking as markdown that can be written against offline, away from the tool.

The ranking weights **certainty errors** most heavily — the moments where a learner was
confident and wrong. That is where a practitioner's sentence does work that no amount of
doctrine text does, because the doctrine text was already there and was already read and did
not prevent the error.

So the empty annotation layer is not an unfinished feature waiting on someone. It is a
finished feature whose input is someone's judgment, with the queue built so that the first
hour of that judgment lands where it matters instead of on lesson one.

## The same ninety days, fifty different sets of checkpoints

One guide in the catalogue runs from curiosity to a first offer over ninety days, in three
phases: calibrate, build flow, close or walk clean.

The sequence is the same everywhere. Almost every checkpoint inside it is not, and the
Academy's companion document localises them state by state rather than teaching one national
runway. Recomputing the tax line as if you owned it is the most state-shaped number in the
whole path — it resets on sale in California, never resets in Oregon, and flips on homestead
and ratio rules in several other states. Pricing insurance from quotes rather than trailing
bills is a formality in some markets and the survival number on the Gulf coast. The
disclosure regime decides how much diligence you must do yourself before you have any right
to be surprised.

A curriculum that taught the runway without that layer would be teaching a sequence of
actions whose content changes underneath the reader, which is worse than teaching nothing:
it produces confidence with no local grounding. Splitting it — the phases from the course,
the checkpoints from the state layer, each carrying its own sources — is more work and
means the guide cannot be finished in the way a general one could. It is also the only
version where "day 34" means anything specific to the person reading it.

## How the platform knows a course is real

The status function mentioned above is not checking a flag. It asks whether the item is
*backed* — whether shipped module content exists behind it — and an item with no backing
reports as designed rather than live, however complete its promise and module list look.

That is a meaningful distinction to enforce, because the catalogue entry is the easy part. A
promise, five module titles and a landing can be written for any subject in twenty minutes,
and a catalogue of fifty such entries looks exactly like a catalogue of fifty finished
courses from outside. Deriving the status from what is actually shipped means the difference
is visible from outside too.

The same wiring carries **{{fig:course_frameworks}} frameworks** — the named structures the
material returns to, including the gate framework the record layer uses everywhere — and
two supporting tracks that run alongside the pillars: the case material, where record-layer
claims are marked documented, reported or disputed rather than asserted flatly, and the
diligence track.

The case track deserves its own note. Teaching from real situations is how this subject is
best taught and is also where course material most often drifts into confident storytelling
about things the author read once. Marking each claim by what stands behind it — a document,
a report, a dispute — keeps the teaching value while making the evidentiary weight visible,
which is the same discipline the coverage rows apply to jurisdictions and the worksheet
applies to numbers. It would be strange to hold a tax figure to a standard the case studies
are exempt from.

## What this means for the reader

Practically: the Academy you can open today is the {{fig:course_items}}-item catalogue, the
{{fig:course_levels}} levels and the doctrine running through them. What you will not find is
a single sentence of practitioner voice, because none has been supplied.

That absence is visible rather than papered over, and it is the honest description of what the
platform currently is: a rigorous catalogue built by people who are very careful about
evidence, waiting on a voice that has not yet spoken. When notes appear they will be in a
different register, attributed, anchored to checked ids, and unmistakably somebody's own
words.

Until then, the layer renders nothing. Which is, exactly, what we know.
