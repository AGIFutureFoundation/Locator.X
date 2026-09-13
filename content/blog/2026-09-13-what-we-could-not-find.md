---
title: Some of our coverage rows say the record does not exist. Proving that cost as much as finding data.
slug: what-we-could-not-find
date: 2026-09-13
topic: The record layer
summary: A coverage map with no holes in it is not a coverage map. Ours has five statuses, ninety rows and a vocabulary the build refuses to let anyone stretch — including three ceilings that will never move and fifty rows of finished work nobody has seen yet.
---

There is a particular kind of slide in every real-estate data pitch: the map of the United
States, uniformly shaded, captioned *nationwide coverage*.

It is almost never a lie in the narrow sense. Somewhere behind it is a table with a row for
every county, and every row has something in it. What the slide does not say is what that
something is — whether the county was actually pulled or merely listed, whether the field
you care about came back populated or came back empty, whether the vendor has a feed or a
plan to have a feed. One shade of blue covers all of it, and the reader is left to assume
the best, which is what the shading is for.

We build the opposite artefact, and this article is about what it costs and why it is worth
it.

## Five words, and a build that will not accept a sixth

Every coverage claim in this platform carries one of exactly five statuses.

- **`shipped`** — the feed is packed into a built edition and survived the fleet sweep. A
  user can see these rows on a map right now.
- **`pulled`** — rows came back from the source and their field quirks are documented. Real
  data, in hand, not yet in front of anyone.
- **`named`** — the office and the portal are identified; no probe has run. This is the
  research queue, honestly labelled as a queue.
- **`blocked`** — a pull was attempted and refused, and the reason is recorded with a date.
  Egress, a token wall, a paywall, a vendor viewer with no endpoint behind it.
- **`no public record`** — the jurisdiction does not publish it. Not "we haven't got to it".
  There is nothing to get.

The vocabulary is enforced mechanically. The roll-up generator parses every state file, and
a status it does not recognise does not get bucketed by best guess — it stops the build with
the offending text quoted and the five legal terms printed. This matters more than it
sounds. The failure mode of a status vocabulary is not that someone writes nonsense; it is
that someone writes something *reasonable-sounding* — "partial", "in progress", "available"
— which then gets silently sorted into whichever bucket the parser's fallthrough happens to
favour, usually the flattering one. A parser with no fallthrough cannot do that.

The generated roll-up is checked by the test suite for staleness, so the sum cannot drift
from the files it sums. Nobody can improve the numbers by editing the summary.

## What the sum actually says

**{{fig:gate_rows}} gate rows**, across **{{fig:gate_files}} state files** and
**{{fig:gate_juris}} jurisdictions**. Each row is one gate question — location, ownership
economics, condition and income, assessment and tax, title and instruments, regulation and
permits — asked of one jurisdiction and answered with one status and a date.

| Status | Rows |
|---|---:|
| `shipped` | {{fig:gate_shipped}} |
| `pulled` | {{fig:gate_pulled}} |
| `named` | {{fig:gate_named}} |
| `blocked` | {{fig:gate_blocked}} |
| `no public record` | {{fig:gate_norecord}} |

Read that table the way we do. **{{fig:gate_shipped}} of {{fig:gate_rows}} rows are in front
of a user.** That is the honest denominator, and it is not a flattering number. The
uniformly-shaded map would have rendered all {{fig:gate_rows}} of these in the same blue.

## The fifty rows nobody has seen

The largest single bucket is `pulled`: **{{fig:gate_pulled}} rows** where the data came
back, the field quirks are written down — which value column is populated and which is a
trap, which sales layer is six years stale, which endpoint caps at a page size that shapes
how you have to query it — and which are still not packed into anything a user can open.

That is finished work sitting behind the shipping step. It is a bigger number than
everything still unprobed, and noticing it was the whole reason the roll-up exists. Each
individual state file stated its own coverage honestly; none of them could see the shape of
the pile. The sum was the one fact no file could give, and when we finally computed it the
answer was not "we need to pull more" — the instinct every team has by default — it was
"we have pulled far more than we have shipped, and the bottleneck is not where we assumed".

A coverage table that only ever pushes you to acquire more data is not measuring you. This
one changed what we did next.

## Three ceilings

Three rows carry `no public record`, and they are the most important rows in the file
because they are the ones that will never move.

Two of them are the same finding in two parishes: **sale prices, in Orleans and East Baton
Rouge**. Louisiana does not reliably make the consideration in a conveyance public. The
clerks record the instrument; the price is not dependably part of what becomes searchable.
No amount of engineering changes this. There is no endpoint to find, no token to obtain, no
partnership to sign. The comparable-sales desk cannot function there, which is a sentence
we have written about at length [elsewhere](underwriting-without-comps.html), and the
coverage row exists so that nobody on this project ever spends a week rediscovering it.

The third is **rents, in Nebraska**. Same shape: the public record does not carry it.

The distinction between this status and `blocked` is the one that took the most discipline
to hold. `blocked` means *we* could not get it — a fact about our access, which a different
route might fix tomorrow. `no public record` means *nobody* can get it — a fact about the
jurisdiction, which no route fixes. Collapsing the two, in either direction, produces a
specific failure: treat a ceiling as a blocker and you burn engineering time forever on
something that does not exist; treat a blocker as a ceiling and you stop looking for a route
that was there the whole time.

Three rows. Each one a door that is not locked but walled.

## Blocked, dated, and honest about whose problem it is

Three rows carry `blocked`, and the honesty required there runs in a direction that is easy
to get wrong.

This build environment has no outbound route to county GIS and open-data hosts. That was
established by probe, not assumption: a class of hosts answered a connect refusal, the
alternative fetch path was tested against a known-good endpoint and refused by the same
policy, and both facts are written down with their dates. Every unprobed source queues
behind a route that does work — a desktop browser session, documented step by step.

Here is the trap. An environment blocker is *our* constraint. It says nothing whatsoever
about whether the public can reach the data. Writing "blocked" on a row that a member of the
public could open in a browser in four seconds, without saying which kind of blocked it is,
would be a quiet slander of a county that is doing its job. So the reason is part of the
status, always, and it names the mechanism: egress policy here, versus a token wall or a
vendor portal there. A reader can tell in one line whether the obstacle is ours or theirs.

The ones that are genuinely theirs get the same treatment in reverse. A county whose
"public records" route ends at a vendor map viewer with no documented endpoint behind it is
not a county with an API we failed to find. That is a finding about the county, and it goes
in the file as one.

## Proving a negative properly

The corridor research is where this discipline gets expensive, and it is the clearest
example of what we mean by measuring before asserting.

The corridor file holds **{{fig:corridor_areas}} metros** carrying
**{{fig:corridor_jobs}} verified announced direct jobs** and
**${{fig:corridor_capital_b}} billion** of announced capital, of which
**{{fig:corridor_parcel_confirmed}}** have a free machine-readable parcel or
assessment endpoint that was *actually fetched and confirmed* — layer metadata retrieved,
field count recorded, record cap noted, token requirement established. Not "has an open data
portal". Fetched.

Alongside them sit **{{fig:corridor_dropped}} dropped metros**, and the dropped list is the
part of the file we are proudest of.

A dropped metro is not an empty row. Each carries the reason it was dropped and the evidence
for the reason. One large metro's entry records that a key county publishes no free
machine-readable parcel or assessment data at all — a conclusion reached by enumerating the
county's own open-data catalogue feed and checking what was in it, rather than by searching
for ten minutes and giving up. Another records that the appraisal district publishes no API
but does publish certified rolls as downloadable shapefiles, with the URL, which makes it a
different kind of "no" entirely — a no to the automated route and a yes to the manual one.
A third records that the county routes public property records through a vendor viewer with
no documented endpoint.

**{{fig:corridor_dropped_parcel}} of the dropped metros have confirmed parcel data and were
dropped for other reasons.** That row shape — good data, dropped anyway — only exists
because the evidence and the decision are recorded separately. A file that stored only the
outcome would have lost it.

This is slower than the alternative by a large factor. A negative finding, done properly,
costs about as much as a positive one and produces nothing you can put on a map. What it
produces is the ability to never do that work again, and the ability to say "no" in public
with something behind it.

## How a row gets filled in

The procedure is four steps and it is written down, because a coverage inventory is only as
trustworthy as its dullest habit.

1. **Name the gate's question and the office that answers it.** Not "the county" — the
   specific office, from the state guide. Assessment and conveyance records usually live in
   different buildings under different statutes, and a row that does not know which one it
   is asking has not really been researched.
2. **Probe with a count query first, never a blind pull.** Ask the endpoint how many rows
   match before asking for the rows. A count query is cheap, it is polite to a public
   server, and it tells you immediately whether the layer you found is the layer you want
   or an empty stub with a promising name.
3. **Record what came back, including the disappointments.** A field that is populated for
   zero percent of records is a finding. A sales layer six years stale is a finding. The
   conclusion that you were querying the wrong server for an hour is a finding. These are
   the entries that save the next person a day, and they are exactly the entries a
   results-oriented log format throws away.
4. **Date it.** An undated status is treated as `named`, whatever it claims to be. This is
   the rule that stops optimism from ageing into fact: a row that says `pulled` with no date
   is, operationally, a row where somebody remembers pulling something.

Step three is the one that separates this from an ordinary data inventory. Most engineering
logs record what worked, because what worked is what you carry forward. But in public-record
work the failures carry nearly all of the transferable knowledge. Everyone who approaches a
county's data hits the same six walls in the same order. Writing down which wall you hit,
and at what URL, converts a week of someone's frustration into a paragraph.

## The gates are not evenly answered, and that shapes the product

Counting by jurisdiction tells you where we have been. Counting by gate tells you what the
platform can currently *do*, which is a more useful number and a less comfortable one.

The deepest-answered gate is **{{fig:gate_deepest}}**, with
**{{fig:gate_deepest_rows}} rows**. That is not an accident of interest: assessment rolls
are the single most consistently published machine-readable artefact in American local
government. Every jurisdiction that publishes anything publishes a roll, because the roll is
how the money gets collected. It is the floor of the entire industry's data supply, and it
is why so many products are, underneath, an assessment roll with a design system on top.

The thinnest is **{{fig:gate_thinnest}}**, with **{{fig:gate_thinnest_rows}} rows**. Permits
and regulatory status are published by a different office, on a different system, with a
different update cadence, and frequently not in machine-readable form at all. A permit
history is also the gate that matters most for anyone actually changing a building's use,
which is the gap between what the data supply makes easy and what a user needs.

We would rather show that asymmetry than smooth it. A platform whose assessment layer is
deep and whose permit layer is thin should say so, because the alternative is a user who
assumes the permit answer is as solid as the tax answer and finds out otherwise at the worst
possible moment. The shape of the coverage is part of the product's honest description of
itself.

## The one thing the coverage table is not

It is not a scoreboard, and the generated page says so in its own words: a state with many
`named` rows is not behind a state with few. It may simply have been written up in more
detail. A jurisdiction that publishes less has fewer rows to claim in the first place.

This is a real hazard with any inventory that counts things. The instant you publish counts
by state, someone reads the biggest number as the best state, and the pressure to make your
own numbers look good starts pushing on what you choose to write down. The defence is
structural rather than moral: the roll-up counts what the files say, in the vocabulary they
are required to use, and it refuses to compute a rank, a score, a percentage-complete or a
grade. There is no headline number to game.

The same discipline runs through the use-code crosswalk, where
**{{fig:crosswalk_codes}} codes** across **{{fig:crosswalk_juris}} jurisdictions** each
carry the source and date for the mapping from a local code to an asset class. A use code
that has not been mapped from a published manual or a measured groupBy does not get a class
assigned by inference from its label, however obvious the label looks. "Commercial — misc"
is not a class, it is a string, and a mapping invented from it would be indistinguishable
in the output from one read off a county's own manual.

## What it takes to move each status

The vocabulary carries its own advancement rules, which is what keeps it from being
decorative.

- `named` → `pulled` needs a probe pull with findings recorded, including the
  disappointments. A zero-percent-populated field is a finding. A stale layer is a finding.
- `pulled` → `shipped` needs packing into an edition and surviving the fleet sweep — the
  headless pass that drives every shipped edition and fails on anything the browser
  quietly rejected.
- `blocked` → anything needs a new route, and the old reason stays in the file as history
  rather than being erased.
- `no public record` → nothing. There is no advancement path. That is what a ceiling is.

Four of those five have a next action. Writing down which rows *don't* is the entire point:
a queue that contains impossible items is a queue nobody trusts, and a team that cannot tell
the difference between hard and impossible will spend its best weeks on the impossible ones
because they feel like the frontier.

## The cost, stated plainly

It would be dishonest to write an article about honesty without pricing it.

**It is slower.** A properly evidenced negative — enumerate the catalogue, fetch the layer
metadata, record the field count and the record cap, write the reason — takes roughly as
long as a successful pull and yields nothing anyone can look at. Across the dropped metros
in the corridor file, that is weeks of work whose entire output is the sentence "not here,
and here is how we know".

**The map is smaller.** Every competitor's coverage map has more colour on it than ours,
and will continue to, because their map includes everything they believe they could get and
ours includes only what we actually have. There is no version of this discipline that wins
the screenshot comparison.

**It complicates the sale.** "We cover fewer jurisdictions than you were told by the last
three vendors, and here is a table of exactly which ones, including three we will never
cover" is a harder opening than a blue map. It is a better second meeting and a worse first
one.

What we get back is narrow and, we think, decisive: nothing in the platform has to be
walked back. A figure that ships has a source and a date behind it. A row that is absent is
absent on the record, with a reason a user can read. No one on this project has to remember
which claims were solid and which were aspirational, because the vocabulary does not permit
an aspirational claim to be written down as a fact — and the build will not let one through
even if someone tries.

Those weeks of evidenced negatives also compound in a way the flattering version does not.
The dropped metros are not dead weight; they are a map of where the American public record
is genuinely hard, organised by the mechanism of the difficulty. When a county changes its
posture — a new portal, a published endpoint, a vendor contract that lapses — we know
precisely what it was blocked on and what to re-probe. A team that never wrote the reason
down has to start over, and usually does, about every eighteen months.

## Why publish this at all

The commercial argument against publishing a coverage table like this is obvious. It shows
{{fig:gate_shipped}} shipped rows where a competitor's slide shows a blue map. It names
three things we will never have. It puts a number on our own backlog.

The argument for it is that everything else we publish depends on it being there. The
platform's central claim is that it will not show a figure it cannot defend — that an
assessment is never called a price, that a use class is never inferred from a label, that a
missing component is reported rather than imputed. A reader has no way to verify any of
that from the inside. What they can verify is whether we are willing to write down the
things that make us look worse, in a format that a build refuses to let us soften later.

The coverage table is the cheapest available proof that the rest of it is true. That is why
it has holes in it, and why the holes are labelled.
