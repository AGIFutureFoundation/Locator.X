# The licensing & professional-practice track — outline, not yet built

A learning track for the people who want to practice professionally — real-estate
salesperson/agent, broker, property manager — rather than only invest through the platform.
This is **new, separate content**, not an addition to the Academy's 51-item curriculum:
[the roadmap's v1.3 note](ROADMAP.md#6-v13--curriculum-growth) deliberately froze that catalog
at its current count (*"The catalog is complete at 51; growth means depth, not count
inflation"*), and nothing in this track is written into `curriculum/curriculum.py`. It lives
here as an outline until it is built, the same honest "designed, not shipped" distance
`status_of()` already marks for an Academy item with no backing lesson content — just without
borrowing that catalog's own count to say so.

**Status: outline only. No lesson content has been written. No state's licensing requirement
has been sourced** — every specific claim below routes to
[`docs/resources/real-estate-licensing.md`](resources/real-estate-licensing.md), where every
row for every state currently reads `not yet sourced`, honestly, because it is.

> **Not legal advice, and not a substitute for state-approved pre-licensing education.** Most
> states require coursework from a state-approved provider before you may sit a licensing
> exam. Nothing here is state-approved pre-licensing coursework, and nothing here should be
> represented as satisfying a state's education requirement. This is an overview of how
> licensing systems are generally structured, for someone deciding whether to pursue a
> license — not a substitute for the approved course your state requires.

## Why this track, and why it is not advice

Locator.X's Academy teaches people to evaluate and underwrite real estate as investors. This
track is a different audience: people who want to **practice** in the industry — sell,
broker, or manage, under their state's license. The two audiences overlap (most agents and
brokers also invest), which is exactly why the existing Academy content — the asset test, the
numbers pillar, the evidence discipline — is assumed knowledge here rather than repeated.

## 1. Who needs a license, and for what

General structure (see
[`real-estate-licensing.md`](resources/real-estate-licensing.md#the-license-categories-general-industry-structure-not-a-state-specific-claim)
for the full category breakdown):

- **Salesperson/agent** — the entry license; in nearly every US state, a salesperson
  practices under a supervising broker rather than independently.
- **Broker** — typically requires salesperson experience plus additional education; permits
  independent practice and, often, supervising other licensees.
- **Property manager** — the least consistent category: some states license it separately,
  some fold it into the broker license, some require no state license at all for it. Which
  bucket your state falls into is a `not yet sourced` fact, not a guess this track will make
  for you.

**Module topics (not yet written):**
- Owner, operator, agent, broker and property manager as five different relationships to a
  property, and which ones the public actually needs a license to perform
- Why "real estate agent" and "Realtor" are not the same thing (the second is association
  membership, not a license category — and a trademarked term this project has not verified
  the current registration status of, so it is used here descriptively, with no trademark
  symbol asserted)
- The unlicensed-practice line: what you may legally do with no license at all (e.g., sell
  your own property) versus what requires one

## 2. The general shape of getting licensed

Nearly every US state's system follows the same rough shape — the specific numbers inside
that shape are exactly what is not yet sourced here:

1. **Pre-licensing education** — a state-mandated number of course hours from a
   state-approved provider.
2. **Background check / fingerprinting** — near-universal, timing varies.
3. **State licensing exam** — typically split into a national-content section and a
   state-law section; vendors and passing scores vary by state.
4. **Activation** — the license is typically issued inactive until sponsored by a supervising
   broker (for a salesperson license).
5. **Continuing education** — ongoing hour requirements to renew, on a cycle set by the
   state.

**Module topics (not yet written):**
- Walking the five stages against your own state once [its row](resources/real-estate-licensing.md#per-state-table)
  is sourced
- Reading a candidate handbook: what it actually promises versus what a test-prep vendor
  implies
- The cost stack: course fees, exam fees, license fees, E&O insurance, MLS/association dues
  — categories only; no figures until sourced per state

## 3. Broker licensing: the step beyond the salesperson license

**Module topics (not yet written):**
- Why most states gate the broker license behind salesperson experience, not just more
  classroom hours
- What independent practice actually changes: supervision duties, trust-account handling,
  advertising compliance
- The broker's expanded liability, and why E&O coverage terms change at this tier

## 4. Property management: the most inconsistent licensing landscape in the industry

**Module topics (not yet written):**
- The three-bucket reality (separate license / folded into broker license / no state
  license) and why a national template cannot answer this — it has to be sourced state by
  state
- Trust-account handling for security deposits and rent collection — a recurring compliance
  theme regardless of which licensing bucket a state uses
- Where Locator.X's own measured market layer (rent, vacancy signals) is useful to a
  practicing property manager versus where it stops being useful because it is market data,
  not a substitute for a lease or a local ordinance

## 5. Continuing education, renewal and reciprocity

**Module topics (not yet written):**
- Reading your own state's CE cycle once sourced, rather than assuming a national standard
  that does not exist
- Reciprocity: some state pairs recognize each other's license with reduced requirements,
  most do not — `not yet sourced` here too, and worth verifying directly before assuming it
- What lapses, and what has to be redone, when a license goes inactive

## 6. The license gets you in the room. Emotional equity keeps you in deals.

This is the deliberate blend the Academy's own foundation pillar already names — see
[`curriculum/courses/01-emotional-equity.md`](../curriculum/courses/01-emotional-equity.md),
the "slab under everything else, not a pillar you finish." A license is a credential; it is
not a client base, a referral pipeline, or a broker's trust. The Academy's existing E-pillar
content (E1–E8) is recommended **before or alongside** this track, not duplicated here:

- **E1 (Emotional equity: the balance sheet nobody keeps)** — the same trust-as-capital-account
  framing applies directly to a new agent's first year: deposits made before you need
  anything are the ones that pay out once you are licensed and have nothing else yet.
- **E2 (The relationship map)** — a new agent's "who moves my deals" map starts with their
  sponsoring broker, not a client; mapping that relationship honestly is month-one work.
- **E3 (Trust at speed)** — a license changes nothing about how reputation prices your
  terms; it just gives you a legal right to be in the terms-pricing conversation at all.
- **E7 (Reading the room)** — a core skill for an agent or property manager specifically,
  not just an investor: a tenant's hesitation, a seller's urgency and a landlord's nervousness
  are the daily data of the job.

**Module topics (not yet written):**
- A new-licensee's first-year relationship map, built the same way E2 teaches it
- Why the sponsoring-broker relationship is the first entry in that map, not an
  afterthought
- Client conversations that are legally and ethically different from investor conversations
  (fiduciary duty, disclosure obligations) — general shape only; specific duties are set by
  state law and are `not yet sourced`

## Branding and the instructor byline

The rest of the Academy carries the byline **"Custom training by Chris Barideaux"** once
`content/instructor-profile.json`'s `supplied` flag is set — see
[`curriculum/INSTRUCTOR_PROFILE.md`](../curriculum/INSTRUCTOR_PROFILE.md) for the schema and
the one rule that governs it: every word is his to write, and a checkable claim about his
background carries its own source. This track is designed to carry the same byline once that
file is supplied — nothing here invents biography, credential or endorsement in the meantime.

## Monetization

Pricing and packaging decisions for this track belong in `docs/company/` (gated by
`scripts/validate_company.py` for exactly the reason CLAUDE.md states: mission, software and
investor-economics layers are never mixed). This document stays scoped to the educational
content and its sourcing status; a pricing tier for a licensing track, if and when one is set,
is a `docs/company/PRICING.md` decision, not a line added here.

## What would turn this outline into shipped content

1. Source at least one state's requirements for all three license categories in
   [`real-estate-licensing.md`](resources/real-estate-licensing.md), with citations and
   dates, via a real regulatory-document pull (not a desk-browser ArcGIS pull — a different
   protocol, named in that file).
2. Write the module content for one section above against that sourced state, with every
   state-specific claim citing its row in the resource table.
3. Decide where this track's lessons live in the app (a new track module under `src/`,
   parallel to how `equity`/`found`/etc. back the existing Academy) — out of scope for this
   outline, which exists to define the shape before any code commits to it.
