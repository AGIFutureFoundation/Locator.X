---
title: A number may not quietly change kind. That one rule shapes every screen we ship.
slug: a-number-may-not-change-kind
date: 2026-09-13
topic: Doctrine
summary: Every figure in an underwriting file is a public record, a document, a quote or a measurement — and the difference is the whole analysis. Here is the rule that stops an estimate from becoming a fact on the way between two screens, and the places it costs us a working feature.
---

Somewhere in every deal there is a spreadsheet cell containing an insurance number.

On Monday it was a rough figure somebody typed to see whether the deal was worth pursuing.
By Thursday it is in the model. By the following week it is in the summary the model
produced, then in the memo quoting the summary, and at no point did anything mark it as the
guess it started life as. It is now, functionally, a fact — the same colour, the same font
and the same authority as the tax figure that came off the county's own bill.

Nobody lied. Nobody even made a mistake, exactly. The number simply changed kind on the way
between two screens, because nothing in the toolchain was built to stop it.

This is the failure our whole interop layer exists to prevent, and it is worth explaining
because the prevention is unusually concrete: it costs us a feature that would otherwise
work, in a place users notice.

## The four kinds

Every input in an underwriting file has an answer that lives in exactly one of four places,
and which place it is determines everything about how much weight the number can carry.

**Public record.** An agency publishes it and anyone can re-pull it: the assessor's parcel
data, the tax collector's bill. Verifiable by a stranger, on demand, without your
cooperation. This is the strongest kind, and it is also the smallest category — far smaller
than most people assume before they go looking.

**Document.** It exists, but it must be produced by someone who has it: the rent roll, the
trailing-twelve operating statement, the short-term-rental report, the estoppel
certificates. **Rents are never public record.** That single sentence eliminates most of
what people believe they can look up about an income property.

**Quote or term sheet.** A live offer that expires: the insurance premium, the loan terms.
An offer is not a fact about the world. It is one counterparty's current willingness, valid
until it is not, and it can be withdrawn or repriced between the model and the closing
table.

**Measurement.** You take it yourself. The walk around the campus ring, the count of what is
actually on the block, the drive at 10pm on a Tuesday.

Then there is a fifth thing that is not a kind: **derived**. NOI, DSCR, break-even — these
are arithmetic over the four, and they inherit the weakest input's status. A DSCR computed
from a real tax bill, a real rent roll and a guessed insurance premium is a guess wearing
two decimal places.

## The rule

**A number must not migrate to a stronger kind silently.**

That is the entire rule, and everything below is what it costs to actually enforce it
rather than merely believe it.

The word doing the work is *silently*. Estimates are legitimate and necessary — you cannot
begin an analysis without some. What is not legitimate is an estimate arriving somewhere
downstream with nothing attached to say what it was, in a column beside numbers that were
pulled from a county's own system, rendered identically.

## Why kinds, and not a confidence score

The conventional way to express uncertainty about a number is to attach a number to it: a
confidence score, a data-quality percentage, a star rating. We considered it and rejected it,
and the reason generalises beyond this product.

A confidence score is a single ordering imposed on things that are not on one scale. It says
a figure is 0.8 good. It does not say what would make it better, who would have to do
something, or how long it stays true. Two figures both scoring 0.8 can require completely
different actions: one needs a phone call to a broker, the other needs somebody to walk a
block. The score erases exactly the distinction that determines the next step.

Kinds preserve it. "This is a document" tells you it exists, someone has it, and you must
demand it. "This is a quote" tells you it has an expiry and a counterparty. "This is public
record" tells you a stranger can check you. Each kind implies its own verification path, its
own failure mode and its own decay rate, and none of those survive being projected onto a
single axis between zero and one.

Scores also decay into decoration in a predictable way. Once the number exists, somebody
tunes it; once it is tuned, it is optimised; and a quality metric that has been optimised is
measuring the optimisation. A kind cannot be tuned, because it is not a judgment about the
figure — it is a statement about where the figure lives.

## Where it costs us a working feature

The platform has three surfaces where the same analysis lives: the app's record-driven
underwriting tab, a standalone worksheet, and an import panel that reads a worksheet back
into the app. One JSON contract moves an analysis between them.

The app knows a property's assessed value and tax line from the record. It also carries a
cost model that can produce a plausible insurance figure. The worksheet has an insurance
field. The obvious, helpful, universally-expected behaviour is for the export to fill that
field in with the app's estimate, so the user does not have to type it.

**The export leaves it null on purpose.**

The app's number is a model output. The worksheet's field demands a written quote — a kind
this platform treats as a live offer in hand. Writing one into the other would launder an
estimate into a quote at a system boundary, which is the exact laundering the rule forbids,
and it would happen invisibly because the receiving field looks identical either way.

The consequence is not cosmetic. Insurance is load-bearing in the debt-service coverage
arithmetic, so leaving it blank means the exported DSCR is **null** too. A user who exports
an analysis gets a file whose headline ratio is empty, with a provenance line explaining
that the insurance field was left blank deliberately and what would fill it. The ratio
appears the moment a real quote is typed at the desk.

We have watched people meet that empty cell. It reads as broken for about four seconds,
until the provenance line is read, at which point it reads as the most informative thing on
the screen. That four seconds is the price of the rule, paid every time, and it is worth it
because the alternative price is paid once, later, by somebody who financed against a number
nobody remembered was invented.

The rule runs in the other direction too. When the app imports a worksheet, those numbers
render **read-only and labelled typed-not-derived**. They never overwrite what the app
computed from the record. Two kinds of number, two visual treatments, neither able to
impersonate the other.

## Two maps, not one: sources and provenance

The worksheet format carries two separate annotations per field, and the separation is more
useful than it first appears.

**`sources`** answers *where does this kind of answer live?* — a stable fact about the world.
Property taxes live with the county tax collector. Rents live in a rent roll. This does not
change between deals or exporters; it is the four kinds applied to a specific field.

**`provenance`** answers *how did this particular exporter get this particular value?* — a
fact about one file. "Left blank on purpose, because the app's figure is a model estimate
and this field wants a quote." "An offer, not a record." "Not a rent roll."

Collapsing them, which every draft of this format wanted to do, loses the ability to say
something important: that a field was left empty *deliberately*, and why. A single
annotation field forces a choice between explaining the category and explaining this
instance, and whichever you choose, the blank cell becomes ambiguous — is it blank because
nobody got to it, or blank because filling it would have been a lie?

That ambiguity is not survivable in a format designed to travel. A file arrives on somebody
else's screen with no author present to ask. The two maps let the file answer both questions
in its own words.

## What a consumer of the format has to do

The contract is enforceable rather than aspirational because it tells every consumer exactly
how to behave, in four rules:

1. **Reject a file without the marker, out loud.** Never render a partial guess from
   something that might be a worksheet.
2. **Treat null as unknown, and propagate it.** Dependent outputs become null, and the
   missing fields are named. Never default a blank to zero — a missing insurance premium is
   not free insurance, and a missing vacancy rate is not full occupancy.
3. **Restore inputs exactly as typed.** No rounding, no normalising, no helpfully
   recalculating what somebody entered.
4. **Recompute the outputs rather than trusting the file's.** A file's arithmetic is a claim;
   the class arithmetic is the check.

Rule two is the one that takes discipline, because defaulting a blank to zero is the most
natural thing a program ever does. It is also the single most common mechanism by which
unknowns become assumptions in financial software: a blank cell in a sum contributes zero
and the total looks complete.

The round trip is locked by a headless-browser smoke test: an analysis exports, imports and
lands on exactly the same coverage ratio; an analysis carrying unknowns survives both
directions with the unknowns still named; both surfaces reject files that are not
worksheets; and the ratio completes the moment a real quote is supplied. Those assertions
are the rule made mechanical. A future change that "helpfully" fills the insurance field
fails a test with a name that explains why.

## The same rule across a bigger boundary

Exporting a screened set to somebody else's map is a harder version of the same problem,
because once a file is in QGIS or ArcGIS or a tileset, every caveat that was on our screen is
gone.

So the geospatial export carries its caveats inside the file. It is ordinary RFC 7946
GeoJSON — anything that reads GeoJSON reads it — with a header the standard explicitly
permits, and the header is not metadata garnish. It states the edition, the record count,
how many records were **dropped for having no geometry**, how many carry **estimated
prices**, and how many carry **approximate coordinates**. Three counts that any other
exporter would omit, each one a number somebody downstream needs in order to not
overinterpret the dots.

Every feature then carries its basis on the feature itself: what the price figure actually
is — in most of our coverage, an assessed value from a county roll, which is not a price and
is labelled as not a price — and what the geometry actually is. A consumer who strips our
header still cannot mistake an assessment for a sale, because the basis rides on each
record.

The header also carries an alias block mapping our field names to the industry's standard
listing-data vocabulary, and that block is marked **asserted, not verified**. We believe the
aliases are right. We have not validated them against a certified consumer of that standard.
Saying so costs nothing and prevents a specific downstream error, which is somebody wiring
our export into a system expecting strict conformance and discovering the difference in
production.

## The closing file, where the rule meets the law

The same doctrine governs the most legally sensitive thing the platform does: teaching what
a closing file contains.

The closing packet is data — **{{fig:packet_clauses}} clause families**,
**{{fig:packet_documents}} documents**, **{{fig:packet_contingencies}} contingencies**,
reviewed **{{fig:packet_reviewed}}**. Each document carries its kind, which is where the
four kinds reappear: **{{fig:packet_docs_document}}** of the
{{fig:packet_documents}} must be *demanded* from someone, and only
**{{fig:packet_docs_record}}** can be pulled from a public record. That ratio is the
education. A buyer who believes they can research their way to a complete picture has
mistaken a document-heavy file for a record-heavy one.

Then the part that matters most. All **{{fig:packet_state_sensitive}}** clause families are
state-sensitive — contract law is state law, layered with county recording practice and
municipal ordinance — and every one of them carries a **question for counsel** rather than a
statement of what the law is. **{{fig:packet_questions}} questions, zero assertions.**

The distinction is enforced mechanically: a test fails the build if any of those entries
stops ending in a question mark. It is a crude check and it encodes something real. A
sentence that ends in a question mark cannot be a legal conclusion. The gate makes it
structurally difficult for well-meaning helpfulness to drift into practising law, which is
the direction this kind of content always drifts, because a reader with a question wants an
answer and the writer wants to give them one.

The packet contains no clause language and drafts nothing. Anything transaction-shaped
anywhere in the platform — the offer generator included — ships marked non-binding in its
first line and verify-everything in its last.

## Unknown, assumed, and the one sentence the packet closes on

The packet's final rule is the reason all of this sits in one article rather than three.

> A buyer who signs with unknowns unresolved has converted "unknown" into "assumed".

That is the same laundering, at the only point where it costs real money. The contingencies
are the legal machinery for resolving unknowns before they become losses: the inspection
window converts condition unknowns into answers, the financing contingency resolves the
term-sheet unknown, the title work resolves what the record does and does not show.

Which reframes what the software is for. A tool that fills every field with its best
available guess produces a complete-looking analysis and leaves the user with no idea which
questions are still open. A tool that leaves the unknowns visibly unknown produces an
uglier screen and an accurate list of what has to happen before signing.

The blank insurance cell and the unresolved contingency are the same object. One is on a
screen and one is in a contract, and the platform's position is that the screen should look
like the contract rather than like a finished report.

## Three places the kinds contradict intuition

**The tax bill is public record, and the seller's bill is not your bill.** You can pull what
the current owner pays. In jurisdictions that reassess on transfer, what *you* will pay is a
different number produced by a process that has not run yet. The platform recomputes the tax
line at the buyer's basis rather than carrying the seller's forward, because carrying it
forward is a public-record number answering a question nobody asked.

**The assessed value is public record, and it is not a price.** It is the output of a
mass-appraisal process built to apportion tax, on a cycle, subject to statutory ratios and
exemptions and an appeals process. It is genuinely public, genuinely verifiable, and
genuinely not what the building would trade for. Public record is a statement about
verifiability, not about accuracy — which is why the kinds label where a number lives and
never how true it is.

**An offering memorandum is not a document, in this vocabulary.** It is prepared by the
seller's agent to sell the property. The rent roll behind it is a document; the T-12 behind
it is a document; the summary of them is marketing. It goes in the file as the thing that
tells you which documents to demand, never as the answer.

Each of these is a case where a number that feels solid is standing on something softer, or
a number that feels soft is perfectly verifiable. The vocabulary exists to make that visible
at a glance, which is a small thing on any one field and a large one across a file of forty.

## The version of this you can adopt in your own spreadsheet tomorrow

None of this requires our software, and the smallest useful version fits in one column.

Add a column next to every input in your model and put one of four words in it: **record**,
**document**, **quote**, **measurement**. Leave it blank where the value was invented, and
leave the value blank too if you can stand to.

Then do the only hard part: let the blanks propagate. If insurance is blank, your DSCR cell
shows blank, not a number computed with a zero in it. Most spreadsheets will fight you on
this — a blank in a sum is a zero — so the formula has to test for it explicitly and return
empty. It is about ten minutes of work per model and it changes what the model is for: it
stops being a machine that always produces an answer and becomes one that produces an answer
*or a list of what is missing*.

Two things happen within a week. The first is that the ratio of *document* to *record* rows
turns out to be much higher than expected, which recalibrates how much of the analysis
depends on someone handing you something. The second is that the blanks become a to-do list
with an owner attached to each line — call the broker, get the quote, walk the block — which
is a more actionable artefact than the completed model ever was.

The full machinery in this article exists because software crossing system boundaries needs
the rule enforced by tests and formats rather than by memory. The rule itself is one column
and a habit.

## Why this is a product decision, not only an ethical one

It would be reasonable to read all of the above as scrupulousness, and it is partly that.
But the load-bearing argument is narrower.

A tool whose numbers carry their kind is **checkable**. You can ask any figure where it came
from and get an answer that distinguishes a county's roll from somebody's estimate. A tool
whose numbers have all been flattened to the same weight cannot answer that question about
itself — not because it is hiding anything, but because the information was destroyed at the
boundary where the estimate was written into the field expecting a fact.

Once it is destroyed, no amount of care downstream recovers it. Which is why the rule is
enforced at boundaries, in tests, in the file format, and in a null that users briefly
mistake for a bug, rather than in a policy document that asks everyone to be careful.
