---
title: A whole market in one HTML file. We measured where that stops working.
slug: the-scale-ceiling
date: 2026-09-13
topic: Engineering
summary: Every edition of this platform is a single self-contained file with no server behind it. The obvious question is how far that goes, and the only honest answer is a measurement — so we drove each shipped edition in a headless browser and found the ceiling is memory, about fifty times before it is bandwidth.
---

Every edition of this platform is one HTML file.

Not a single-page app with an API behind it. Not a static shell that fetches data on load.
One file, containing the interface, the analytics, the curriculum and every property record,
which you can save to a disk, open with no network, and read in five years when whoever
was hosting it has moved on.

That architecture is unusual enough that the first question anyone technical asks is some
version of *how far does that possibly scale?* — usually in a tone suggesting the answer is
"not far". It is a fair question and it deserves a number rather than a defence.

So we measured it: every shipped edition driven in a headless browser, page weight, load
time and JavaScript heap recorded, on a dated pass against the published artifacts
themselves. This is what came back.

## Why one file, given the obvious objections

The objections are real, so start with what the shape buys.

**There is no key, no login and no server.** A user opens a file. Nothing phones home,
nothing rate-limits them, nothing expires. For a tool whose subject is public records, the
absence of a gatekeeper between a citizen and their county's own data is not a technical
detail, it is most of the ethical point.

**It is auditable as a unit.** One file is one dated snapshot. You can diff two editions.
You can hand one to a regulator, an instructor or a sceptic and they have *everything* —
the records, the scoring, the assumptions and the disclaimers — with no way for the version
they inspect to differ from the version someone else is using.

**It survives its infrastructure.** Every hosted analytics product in this sector is one
funding round away from being a dead link. A file on a disk is not.

**It cannot silently change under a user.** A hosted dataset can be corrected, re-scored or
quietly re-shaped between two visits, and the user has no way to know. An edition is
immutable by construction; a correction is a new edition with a new date.

The cost of all that is that everything has to fit. Which raises the actual engineering
question: fit into *what*, exactly? The usual assumption is bandwidth — that the limit is
how big a file people will download. That assumption is wrong by roughly the factor this
article is about.

## How it was measured

Method first, because a performance number without one is decoration.

Each shipped edition was fetched from its published artifact and title-verified on the same
day, then driven in headless Chromium with a raised heap limit. Load time is wall clock from
navigation start until the record store is a non-empty array in the page — not
`DOMContentLoaded`, not first paint, but the moment the data the page exists to show is
actually available. Heap is the browser's own used-heap figure read immediately after the
store is ready. One run per edition, single container, no warm cache.

**{{fig:scale_editions}} editions**, **{{fig:total_records}} parcel records** between them,
measured on **{{fig:scale_measured_on}}**.

What is *not* measured matters as much: interaction latency under a real pointer, memory
ceilings on actual mobile devices, and time-to-interactive as a human perceives it. Those
need a device lab, not a container, and claiming them from this pass would be exactly the
kind of unearned number the rest of this platform refuses to print.

## The two curves

{{chart:scale-bytes}}

Page weight, first, because it is the one everybody expects to be the problem.

The largest shipped edition holds **{{fig:corridor_records}} records** in
**{{fig:corridor_bytes_mb}} MB** of page. Across the measured editions, a record costs
about **{{fig:bytes_per_record}} bytes** on the wire. Fifty thousand more records add
**{{fig:mb_per_50k}} MB** to the file.

That is remarkably cheap, and it is cheap for an unglamorous reason: a property record, at
the grain a screening tool needs, is a small object. An identifier, a coordinate pair, a
handful of assessed figures, an area, a year, a use code, a short address. Compressed, it
is a few dozen bytes. You can put a very large number of those in a file that a
person will still cheerfully download.

Now the curve that actually binds.

{{chart:scale-heap}}

The same edition that weighs **{{fig:corridor_bytes_mb}} MB** on the wire holds
**{{fig:corridor_heap_mb}} MB of JavaScript heap** — about
**{{fig:corridor_heap_gb}} GB** — once the records are live objects in the page. A record
costs roughly **{{fig:heap_kb_per_record}} KB** in memory against
**{{fig:bytes_per_record}} bytes** on the wire: a factor of about
**{{fig:heap_vs_wire}}×**. Fifty thousand additional records add
**{{fig:mb_per_50k}} MB** to the download and **{{fig:heap_per_50k}} MB** to the heap.

So the ceiling is memory, and it arrives roughly fifty times sooner than the bandwidth
ceiling does. Every intuition that says "the file is too big" is aimed at the wrong axis.

## Why the gap is that large

Nothing pathological is happening. This is what a JavaScript object costs.

Data that is compact as text becomes, once parsed, a graph of individually allocated
objects: per-object headers, hash-map storage for named properties, pointers to boxed
numbers and interned strings, plus whatever the engine's hidden-class machinery keeps
alongside. A field that occupies four characters in the source text can easily occupy
dozens of bytes once it is a property on an object. Multiply by a dozen fields and several
hundred thousand records and you get a gigabyte from a fifteen-megabyte file without a
single line of wasteful code.

The compression on the wire makes the gap look worse than it is, too — repeated field names
and repeated use codes across hundreds of thousands of records compress beautifully and
then expand into fully distinct in-memory structures. The file benefits from the repetition;
the heap does not.

## The measurement that refused to behave

Load time did not come back monotonic, and the file says so in plain language rather than
smoothing it.

The smallest measured edition loaded **slower** than the next one up:
**{{fig:nola_load_s}} seconds** for the smaller against **{{fig:atlas_load_s}} seconds** for
the larger. That is backwards, and it stayed backwards after the obvious checks.

The honest reading is that a single run per edition, in one container, carries at least a
few seconds of noise — from container scheduling, from network variance fetching the
artifact, from whatever else the host was doing. The finding is not "load time is
non-monotonic in record count". The finding is "**this sample cannot tell you that it is**",
and the file records it in those terms, alongside the instruction to plan against the heap
figures, which *are* monotonic in record count and were measured by a mechanism with far
less run-to-run variance.

There was an obvious alternative available, which was to run it a few more times and publish
the run that looked tidy. Every performance chart you have ever seen in a product blog post
is downstream of a decision at exactly this fork. Publishing the anomaly with its
explanation costs a paragraph and buys the reader a reason to believe the numbers next to
it — including the largest edition's **{{fig:corridor_load_s}} seconds**, which is a real
number and not a small one.

## The thing everyone worries about is not the problem

Here is the result that reorganised our own priorities.

At **{{fig:corridor_records}} records** in the page, a full scan of the record store takes
about **{{fig:corridor_scan_ms}} ms** and a full sort takes about
**{{fig:corridor_sort_ms}} ms**.

Both are well inside a single animation frame's worth of perceptible delay for an
interaction a user deliberately triggered. The operation everyone assumes will be the
bottleneck — filtering and ranking a third of a million rows in a browser with no index and
no database — is, on measurement, not close to being the bottleneck. Modern engines run a
linear pass over a few hundred thousand objects faster than most people's mental model
allows for.

Which means the engineering effort that instinct wants to spend on query performance is
misallocated. It belongs on the heap. Every optimisation that reduces per-record memory
directly raises the number of records an edition can hold; every optimisation that speeds up
the scan makes an already-fast operation faster and buys nothing.

We know this specifically because we measured both instead of assuming either. The
assumption we walked in with was the common one, and it was wrong in the expensive
direction.

## What the ceiling means for how the product is shaped

Editions are regional. That is often read as a product or marketing decision — focus, local
expertise, a narrative about knowing a market. It is really an arithmetic one, and it is
better to say so.

At roughly **{{fig:heap_kb_per_record}} KB** of heap per record, an edition's record count
is set by the memory budget you are willing to demand of the machine at the other end. A
desktop browser with a few gigabytes of headroom handles the largest shipped edition.
A mid-range phone does not, and we have not measured where it stops, so we do not claim a
figure for it.

Everything else follows. A metro-scale edition is comfortable. A state-scale edition is a
decision. A national edition of full parcel records in one file is not an engineering
challenge to be overcome with cleverness; it is off the end of the curve by more than an
order of magnitude, and saying that clearly is more useful than a roadmap item promising it.

The corridor research shows the same arithmetic from the other side: across
**{{fig:corridor_areas}} metros** the confirmed record counts total
**{{fig:corridor_metro_records}}**, which is already well past what a single file can hold
as live objects — and that is a small selection of American metros, not a national sweep.
The split into editions is not a staging strategy on the way to one big file. It is the
shape the measurement dictates.

## The over-count we caught by measuring twice

One more finding from the same pass, because it is the most instructive mistake in the file.

The measurement also counts lodging stock per edition — hotels, motels, inns, resorts —
which feeds the expansion work. The first pass matched the record's `kind` field *and* its
`src` field against the lodging vocabulary, on the reasonable-sounding theory that a record
whose source is a hospitality dataset is a hospitality record.

It over-counted the largest edition by more than tenfold.

The cause is mundane and the lesson is not: a source string is not a use class. A feed
named for a category contains everything the publisher happened to put in it, and matching
on its name assigns a class by inference from a label — the exact error the crosswalk exists
to prevent, committed by the measurement tool rather than by the data. The bad figure was
discarded, the method was corrected to match only the classified field, and the discarded
pass is documented in the file so nobody re-invents it. The corrected count for that
edition is **{{fig:lodging_corridor}}**, against **{{fig:lodging_total}}** across all
measured editions.

What makes this worth telling is that the wrong number was *plausible*. A large national
edition holding tens of thousands of lodging records is not absurd on its face. Nothing
about the output flagged it. It was caught by someone asking what the matcher was actually
matching, which is a question that only gets asked if the method is written down where
somebody can read it.

## Why one run per edition, and not thirty

A reviewer will ask why we did not simply run it enough times to average out the noise, and
the answer is worth stating because it generalises.

Repeated runs in one container average over the *wrong* variance. They smooth the container's
own scheduling jitter while leaving every systematic factor — one machine, one network
path, one browser build, one moment in time — exactly as fixed as it was in a single run.
The resulting tight error bars would describe the stability of this container, not the
behaviour of the software anywhere else, and tight error bars are enormously persuasive.
That is the hazard: a more precise-looking number that is wrong in the same direction, with
its wrongness now hidden behind a confidence interval.

The measurement we actually needed was the heap curve against record count, which is
dominated by a real effect large enough that container noise does not threaten it, and which
came back cleanly monotonic across all
**{{fig:scale_editions}} editions**. The load-time figures were collected in the same pass
because they were nearly free, and they are reported with the caveat they earned rather than
polished until they looked like the heap figures.

So: one run, noted as one run, with the non-monotonic result left in view. If load time
ever becomes the number a decision rests on, it will need a different instrument — several
machines, several networks, repeated over days — and the right time to build that is when
something depends on it, not when it would make this article's chart look tidier.

## Who downloads fifteen megabytes, anyway

The bandwidth objection deserves a straight answer rather than a dismissal, because
"{{fig:corridor_bytes_mb}} MB" sounds heavy stated cold.

It is a one-time cost, paid once per edition rather than once per query, and it replaces a
session's worth of API round-trips that a hosted equivalent would spread across every
filter, pan and sort a user performs. A conventional tool that fetches a page of results
per interaction can easily move more bytes than this over a working session, in many more
round trips, each one an opportunity to be slow, rate-limited or down. It just moves them
invisibly, a little at a time, which feels lighter and frequently is not.

It is also a cost that buys something no incremental architecture can offer: after it is
paid, every subsequent operation is local. No latency, no quota, no outage, no dependency
on us continuing to exist. Sort the whole edition on a plane. Open it in a parish office
whose connection is a hotspot.

And it is honestly the wrong number to look at anyway, which is the point of this article.
The wire cost per record is **{{fig:bytes_per_record}} bytes**. The memory cost is
**{{fig:heap_kb_per_record}} KB**. Anyone arguing about the download is arguing about the
axis with roughly **{{fig:heap_vs_wire}}×** more headroom.

## What is actually in a record, and why none of it is padding

Per-record memory is the binding constraint, so the natural question is what each record is
carrying and whether it earns its place.

A record holds an identifier, a coordinate pair, the assessed figures, an area, a year
built, a use code, a short address and a neighbourhood or district label. There is no free
text, no history array, no nested owner object — owner fields are stripped at ingest and
never enter the file at all, which is a privacy rule first and turns out to be a memory
saving second.

Each surviving field answers a gate. The coordinate pair answers location. The assessed
figures and the tax line answer assessment and tax. The area, year and use code feed the
condition-and-income and the classification work. The district label is what makes the
navigation layer possible at all. Strip any of them and a question the platform claims to
answer stops being answerable — which is why "drop fields to fit more rows" is the cheapest
option on the table and the one we treat as a last resort rather than a first.

The one genuinely large item in the file is not the records. It is the curriculum, the
interface and the analytics that ship alongside them, and that is a fixed cost: it is the
same in an edition of twenty thousand records as in one of three hundred thousand. It shows
up clearly in the smallest editions, where the per-record arithmetic understates the file
size because a constant is being divided by a small number.

## Three things this measurement cannot tell you

**It cannot tell you what a phone does.** The heap figures come from a desktop-class
headless browser with a raised limit. Mobile browsers enforce far lower per-tab ceilings
and kill tabs that approach them without warning. We do not know where the largest edition
stops being openable on a mid-range phone, because we have not measured it, and we are not
going to guess at a number that would determine whether a user in the field can open the
tool at all.

**It cannot tell you how it feels.** Load-to-data-ready is a machine-defined moment, not a
human one. A page whose record store is populated may still be laying out, hydrating a map
or fetching fonts. Time-to-interactive as a person experiences it is a different
measurement with a different instrument, and nothing here licenses a claim about it.

**It cannot tell you about sustained interaction.** The scan and sort figures are single
operations on a quiet page. What happens to memory after twenty minutes of filtering,
selecting, exporting and map interaction — whether anything retains, whether the heap
settles or creeps — is a question about garbage-collection behaviour under real use, and it
needs a soak test we have not run.

All three are gaps in the same direction: the measurement describes a cold page on a
capable machine, which is the easiest case. Everything we do not know is on the harder side
of it, and stating that is more useful to a reader than the figures themselves.

## What we would change, and why we have not

Three optimisations would move the heap ceiling materially.

**A columnar store** — parallel typed arrays instead of an array of objects — would cut
per-record memory by a large multiple, because it eliminates the per-object overhead that
dominates the figure. It is the single highest-leverage change available. It costs
readability everywhere the records are touched, and the code that touches records is also
the code an auditor is most likely to read.

**Lazy materialisation** — keep the records as a compact buffer and build objects only for
what is on screen — would help similarly, at the cost of complicating every analytic that
currently runs a simple pass over everything, including the ones whose simplicity is the
reason their correctness is checkable.

**Dropping fields** is the cheapest option and the one we are least willing to take. Every
field in a record is there because some gate question needs it, and a screening tool that
has quietly discarded the assessment year or the use code to fit more rows has traded a
thing it can defend for a number it can advertise.

The current position is that the ceiling is not yet binding for the editions we ship, and
none of these changes should be made on the strength of a hypothetical. When an edition we
genuinely need exceeds what a real device can hold, the columnar store is the first move,
and the measurement that forced it will be published alongside it.

That is the whole discipline, applied to our own code rather than to a county's: do not
optimise what you have not measured, do not claim a ceiling you have not hit, and when the
numbers come back untidy, print them untidy.
