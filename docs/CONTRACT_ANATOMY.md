# Purchase-contract & underwriting anatomy — education, not a legal document

**What this page is not, stated first.** It is not a contract, not a form, not
legal advice, and not a survey of "all state and local laws" — no document can
honestly claim that: real-estate contract law is state law layered with parish/
county recording practice and municipal ordinances, it changes, and only a
licensed attorney in the relevant state can say what a given clause does
*today* for a given deal. Anything on this platform that looks
transaction-shaped carries the same rule as the app's own offer generator,
which ships **"LETTER OF INTENT — NON-BINDING"** in its first line and
"Verify everything; not legal advice" in its last. This page teaches the
*anatomy* — what the standard pieces of a purchase agreement and an
underwriting file are for, which of them are state-sensitive, and where each
number in them lives — so a reader can brief their attorney and lender well
instead of signing what they cannot name.

## The contract, clause by clause — what each piece is FOR

| Clause family | What it does | State/local sensitivity — verify locally |
|---|---|---|
| Parties & capacity | Names who binds whom; entities need authority documents | Entity law and signing formalities vary by state |
| Property description | The legal description, not the mailing address | Descriptions follow the local recording system (plats, metes-and-bounds, squares in Louisiana practice) — the parish/county record is the source |
| Purchase price & deposit | Price, earnest money, who holds it, when it becomes at-risk | Escrow/trust-account rules and deposit remedies are state-regulated |
| Financing contingency | The exit if the loan fails: amount, rate ceiling, deadline | Deadlines and notice mechanics are contract-drafted but enforced under state law |
| Inspection / due-diligence | The exit for condition, with a defined window and delivery duties | Access, repair-negotiation, and re-inspection practices vary regionally |
| Disclosures | What the seller must tell the buyer | **Heavily state-specific** — disclosure forms, natural-hazard and flood regimes, lead paint (a federal layer), local point-of-sale ordinances; your state's guide in [`docs/states/`](states/) maps the instrument families the record shows |
| Title & survey | Marketable title, exceptions, the title commitment, survey objections | Title practice (attorney states vs title-company states), survey standards, and homestead rules differ by state |
| Closing & possession | Where, when, who conducts it, when keys change hands | Closing agents (attorney/escrow/title) and deed forms are state practice |
| Prorations & taxes | Splitting taxes, rents, deposits at closing | Assessment cycles and reassessment-on-sale behavior differ — the platform's tax line exists because "the seller's bill" is often not "your bill" |
| Default & remedies | What happens if either side walks: liquidated damages, specific performance | Remedy enforceability is state law; foreclosure regimes (judicial vs nonjudicial, instrument-dependent) are mapped per state in [`docs/states/`](states/) |
| Assignment | Whether the buyer can assign the contract | Assignment and wholesaling rules are increasingly state-regulated |
| Tenant provisions | Estoppels, rent roll delivery, deposits transfer, lease assumption | Landlord-tenant law is state and often city law (rent regulation where it exists) |

For income property, the contract rides with an **underwriting file** — and
every number in it has an address in one of the four kinds this platform
enforces everywhere ([`docs/INTEROP.md`](INTEROP.md)):

| Underwriting item | Kind | Where it lives |
|---|---|---|
| Assessed value, parcel, use class | public record | assessor / recorder, per jurisdiction |
| Tax bill | public record | tax collector — recompute at your basis |
| Rent roll, leases, estoppels | document | demand them; rents are never public record |
| T-12 operating statements | document | measured history, not hope |
| Insurance | quote | a written quote in hand — never an assumption |
| Loan terms | quote / term sheet | offers, not records |
| DSCR, NOI, break-even | derived | arithmetic over the above — unknown inputs make unknown outputs, out loud |

The contract's contingencies are, in this frame, **the legal machinery for
resolving unknowns before they become losses**: the inspection window resolves
condition unknowns, the financing contingency resolves the term-sheet unknown,
title review resolves the record unknowns. A buyer who signs with unknowns
unresolved has converted "unknown" into "assumed" — the exact laundering this
platform refuses in its worksheets.

## What the platform ships, and the line it will not cross

- The app's Underwriting tab assembles a **closing file** from the record — the
  documents to demand grouped by evidence kind, the clause families above as a
  list of **questions for counsel**, and the contingency each unresolved unknown
  belongs to. It is generated from the Academy's own transaction checklist
  ([`CLOSING_PACKET.md`](CLOSING_PACKET.md), regenerated by
  `scripts/build_packet.py`), filtered to the property's asset class, and joined
  to the edition's state. It contains no clause language.
- The four state facts it shows — foreclosure regime, tax-delinquency mechanics,
  transfer tax, housing finance agency — are **parsed** out of the state table in
  [`states/README.md`](states/README.md), which carries their sources and review
  date. They are never restated here, and where an edition spans more than one
  state the packet reports the state as unknown rather than choosing one.
- The app's Underwriting tab generates a **non-binding LOI draft** from the
  case's own numbers, labeled as such, for the reader to take to counsel. Its
  address line names a state only when the record supports one; otherwise it
  prints a labeled blank for the reader to fill. It used to print `CA` into
  every address in every edition, New Orleans included — a hardcoded literal,
  now a resolved fact, with a gate in `tests/run.py` that fails the build if a
  state literal reappears in the paperwork.
- The worksheets and desk exports carry per-field provenance and refuse to
  fill a quote field with an estimate ([`docs/INTEROP.md`](INTEROP.md)).
- The state guides in [`docs/states/`](states/) map, with sources and dates,
  the *record-layer* facts that contracts touch: instruments, foreclosure
  regime, disclosure status, tax sale mechanics — navigation of the public
  record, never drafting advice.
- The line: this platform does not generate binding contract language and
  does not assert statute-level claims without a source and a date. A
  "contract generator with all state and local laws built in" would violate
  both halves of that sentence, so it is refused by design — the honest
  product is the anatomy above plus a well-briefed attorney.
