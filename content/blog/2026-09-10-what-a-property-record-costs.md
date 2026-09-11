---
title: We measured what a property record costs. The answer is not bandwidth.
slug: what-a-property-record-costs
date: 2026-09-10
topic: Engineering
summary: A parcel costs 54 bytes on the wire and about 3 KB in memory. That ratio decides the architecture of any analytics tool that puts a whole market in a browser — and it means the ceiling arrives about fifty times sooner than anyone plans for.
---

Every real-estate analytics product eventually has the same argument, and it is almost
always the wrong argument.

Somebody wants more records in the market view. Somebody else says the page is already too
heavy. The conversation becomes a negotiation about file size, and the compromise is a
number of records chosen because it felt safe. Nobody measures anything, because measuring
seems like it would take a week and the answer seems obvious.

We measured it. The answer was not obvious, and the thing everyone was arguing about turned
out not to be the constraint.

## The setup

Locator.X ships each market edition as a single self-contained HTML file. No server, no
API, no accounts — the whole application and the whole record set in one document that runs
with the network off. That architecture is the product, not an implementation detail: it
makes an edition archivable, auditable, and usable in a county office with bad wifi.

It also means every record is in memory, at once, for the whole session. Which makes the
question "how many records fits?" unusually load-bearing.

Four shipped editions were driven in headless Chromium at their real record counts, and we
recorded page bytes, time to a ready record store, and JavaScript heap immediately after.

## The wire cost: 54 bytes a record

Start with the number everyone expects to be the constraint.

{{chart:scale-bytes}}

The largest edition carries **{{fig:corridor_records}} parcel records** in
**{{fig:corridor_bytes_mb}} MB**. Across the four measured editions the packed cost works
out at about **{{fig:bytes_per_record}} bytes per record**.

Fifty-four bytes. For an address, a coordinate pair, a value, a unit count, a use class, a
year, a source label and a date.

That is not a typo, and it is not clever compression of a thin record. It is what happens
when you gzip a homogeneous columnar-ish payload of mostly-repeating strings and
mostly-similar numbers. Real-estate records compress extraordinarily well because they are
extraordinarily repetitive: the same street names, the same use classes, the same source
strings, the same rounded values, over and over.

At 54 bytes a record, adding **50,000 parcels to an edition costs {{fig:mb_per_50k}} MB**.
On any connection built this decade that is not a conversation. If bandwidth were the
constraint, you could put two million parcels in a file and ship it.

## The real cost: about 3 KB a record

Now the number nobody measures.

{{chart:scale-heap}}

The same edition that occupies {{fig:corridor_bytes_mb}} MB on disk occupies
**{{fig:corridor_heap_gb}} GB of JavaScript heap** once it is parsed and live. The Bay
Area edition, at {{fig:bay_records}} records, sits at {{fig:bay_heap_mb}} MB.

Across the measured set the cost is roughly **{{fig:heap_kb_per_record}} KB of heap per
record** — around fifty-five times the wire cost.

That ratio is the entire finding. **Memory runs out about fifty times sooner than
bandwidth does.**

### Why the gap is so large

None of this is mysterious once stated, but it is rarely stated:

- **Compression is gone the moment you parse.** A gzipped payload is small because of
  redundancy across records. A parsed object graph reinstates every one of those repeated
  strings and numbers as a live value.
- **Objects carry overhead per field and per object.** A JavaScript object with a dozen
  properties is not twelve values; it is twelve values plus a shape, plus pointers, plus
  allocation granularity.
- **Strings are not free and are not shared unless you share them.** Every `"Single
  family"` that is a distinct string is a distinct allocation. Interning use-class and
  city strings is one of the highest-leverage optimisations available, and it is invisible
  in a file-size measurement.
- **Derived structures multiply it.** Indexes, spatial buckets, filter caches and render
  layers all hold references, and several of them hold their own copies.

## What this means for "add 50,000 records"

Take the measurement forward honestly. Fifty thousand more records adds
{{fig:mb_per_50k}} MB to the file and about **{{fig:heap_per_50k}} MB to the heap.**

For a mid-sized edition, that is fine. For the largest, it is not: an edition already at
{{fig:corridor_heap_gb}} GB goes past 1.1 GB, and that is a number with hard consequences.
Mobile Safari will terminate a tab well before it. Many laptops will begin swapping. The
failure mode is not a slow page; it is a page that dies, and it dies *after* the user has
waited through the load.

So the honest answer to "can we add fifty thousand records per market?" is: **on some
editions yes, and on the largest ones that is not a data question, it is an architecture
question.**

The single-file edition holds every record in memory by design. That design has a ceiling,
and the measurement puts it somewhere around 300,000 to 400,000 records. Past that you are
not adding data, you are changing what an edition is.

## Three ways past the ceiling, in order of how much they cost you

**Split by area.** A metro-scoped edition of 100,000 to 150,000 records sits comfortably
under 450 MB and keeps every property that makes the single-file architecture valuable. It
requires no engine change at all — our builder is already spec-driven and builds per
region. This is the cheapest option by a wide margin and it is the one we recommend first.

**Split by class.** A lodging-only edition, or an apartments-only edition, carries a few
thousand records rather than a few hundred thousand. Across our four measured editions the
entire lodging inventory is **{{fig:lodging_total}} records** — an entire national hotel
edition fits inside one metro edition's memory budget with room to spare. If your users
segment by asset class anyway, this is close to free.

**Defer the record store.** Keep the packed payload but hydrate lazily, per viewport or per
query. This breaks the "everything is in memory" assumption that the ranking and
underwriting engines are written against, so it is a real project rather than a flag. Do it
when the first two options are exhausted, not before.

## The measurement discipline, briefly

Two notes on how these numbers were produced, because a performance figure without its
conditions is decoration.

**What we measured.** Page bytes as served. Wall time from navigation to a non-empty record
store. `usedJSHeapSize` immediately after the store is ready. One run per edition, one
container, one browser build, no warm cache.

**What we did not measure, and will not claim.** Perceived time-to-interactive. Interaction
latency under a real pointer. Device-specific memory ceilings. Those require a device lab,
and a single headless container is not one.

One honest wrinkle in the data: load time was **not** monotonic in record count in our
sample — the 87,578-record edition loaded slower than the 125,803-record one. That tells
you single-run load timings carry several seconds of noise, so we do not draw a slope
through them. The heap figures *were* monotonic, and they are the ones we plan against.

We also found the fixture bug that this kind of measurement exists to find. Our public
demo generates synthetic data, and its forecasting engine pools a backtest across index
series, returning nothing below **eight** of them. The fixture generated **six**. Off by
two — with the result that the platform's most distinctive feature, a confidence band
derived from measured backtest error, could not draw in the demo at all, while the page
displayed "not testable, too few series" as though that were a property of the method
rather than of the test data.

Nobody noticed for months, because nothing errored. It simply, quietly, showed less than it
had.

## The generalisable point

If you build anything that puts a large dataset in a browser — property, claims, logs,
telemetry, genomes — the instinct is to optimise the number you can see. File size is
visible. It is in the network tab. It has a bar chart.

Heap is invisible until it kills you, and it is the one that scales against you at fifty
times the rate.

Measure both. Plan against the second one. And when someone asks for fifty thousand more
rows, you will be able to answer with a number instead of a feeling — which is, in the end,
the whole argument for measuring anything.
