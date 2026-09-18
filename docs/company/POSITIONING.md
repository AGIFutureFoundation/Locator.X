# Locator.X by AGI Corp — positioning, and what actually ships behind each name

**Positioning, as set by the platform owner:** *Locator.X by AGI Corp turns fragmented
property signals into verified, financeable, and actionable real-estate investments.*

**Locator.X, Inc. is a separate company**, founded by AGI Corp, which holds founder equity;
the seed round in [`THE_ASK.md`](THE_ASK.md) sells the rest. It is the system for
discovering, verifying, underwriting, acquiring, developing, operating, optimising and
selectively disposing of real-estate assets — used by AGI Property Holdings' Portfolio
Basket under a written, arm's-length services agreement, and licensed to others. It is not
positioned as a general-purpose SaaS product.

This page exists because a brand name is a promise, and a promise is a claim. Each of
the eight branded data products below is set against **what is in this repository
today**, measured module by module. `scripts/validate_company.py` fails the build when a
name here claims a module that does not exist, or a line count that has moved.

Three statuses, and the third is not an embarrassment — it is a roadmap entry with a
date attached to nothing yet:

- **ships** — in `src/`, in the built editions, covered by a gate
- **partial** — the mechanism exists; the coverage, the data or the scope does not
- **not built** — named, specified, and absent

## The eight names

| Name | What it means | What ships today | Status |
|---|---|---|---|
| **Locator.X Intelligence** | Unified property, market, owner, comp and risk data | `src/app.js` (1756) record layer, `src/evidence.js` (223) per-source grading, `src/sources.js` (176) source catalogue, `src/comps.js` (282) recorded-sale comparables, `src/signals.js` (148) outside forces | **partial** — 8 editions shipped against 90 coverage-gate rows; **owner data is excluded by policy**, see the open question below |
| **AGI Opportunity Index** | Explainable buy-box and opportunity score | `src/dashboard.js` (421) scoring and ranking, `LXUW.matches` buy box in `src/underwrite.js` (599), `src/standards.js` (205) the Investment Standard written down and testable | **ships** — and it is explainable by construction: `src/evidence.js` grades the inputs and `src/coverage.js` (340) states what the edition cannot answer at all |
| **AGI Property Graph** | Relationship graph for parcels, entities, debt, permits, transactions and related assets | `src/network.js` (367) relational map over parcels and places, `src/corp.js` (137) announced corporate projects, `src/records.js` (250) per-jurisdiction record assembly | **partial** — parcel and project relationships ship; **entity, debt and lien graphs do not**, and the entity half collides with the no-PII rule |
| **Locator.X Diligence Room** | Source-linked evidence and investment-committee workspace | `src/records.js` (250) Record Locker, `src/packet.js` (173) the transaction as a file, `src/sources.js` (176) provenance | **partial** — evidence assembly and provenance ship; **there is no multi-user workspace, no approval workflow and no audit trail across users** |
| **AGI Development Signal** | Zoning, entitlement, construction, demand and infill-development intelligence | `src/dev.js` (158) conversion and modification feasibility, `src/rebuild.js` (335) construction cost and rebuild, `src/campus.js` (250) student demand, `src/corp.js` (137) announced expansion | **partial** — feasibility and cost ship; **permit and entitlement feeds are not pulled** ([`../PULL_QUEUE.md`](../PULL_QUEUE.md)) |
| **Locator.X Strategy Engine** | Investment scenario and capital-stack comparison | `src/switchboard.js` (455) five strategies over one record, each graded by the facts it rests on; `src/underwrite.js` (599) ten financing structures and the offer solver | **ships** |
| **AGI Portfolio Pulse** | Actual-versus-underwritten portfolio learning | — | **not built** — Phase 3 of [`../market/PREMIUM_ROADMAP.md`](../market/PREMIUM_ROADMAP.md). `src/predict.js` (587) already holds the backtest mechanism this would use; nothing feeds it operating results |
| **AGI Risk Ledger** | Risk tracking, diligence status and approval controls | — | **not built** — the nearest shipping thing is `src/compliance.js` (103), which states the platform's own governance posture, not a per-asset risk ledger |

**Two of eight are absent and four are partial.** That is the honest count today, and it
is published here rather than discovered later by someone who bought the name.

## Trademark status

The eight names above are used as AGI Corp's product and brand names. This repository
makes **no claim that any of them is a registered trademark**, and the
registered-trademark symbol appears nowhere in its documentation;
`scripts/validate_company.py` fails the build if one appears. Registration status is
a matter of record at a trademark office, and this project does not assert a fact it has
not checked — least of all about itself.

## The open question this page cannot resolve

The brief specifies **AGI Property Graph** as a relationship graph over "parcels,
**entities**, debt, permits, transactions and related assets", and specifies **Locator.X
Intelligence** as unified property, market, **owner**, comp and risk data.

The platform does not have owner data and cannot currently get it. Owner names and
mailing addresses are **stripped at ingest** and never enter the repository, for the
reason stated in [`../../data/README.md`](../../data/README.md) §2: *"a committed mirror
would preserve them forever in git history."* The same policy is why skip tracing and
owner enrichment are on the refuse list in [`../market/GAP.md`](../market/GAP.md), and
five of the highest-priced tools in [`../market/LANDSCAPE.md`](../market/LANDSCAPE.md)
sell primarily on that capability.

This is a decision for the platform owner, not an engineering problem, and it has three
honest resolutions:

1. **Keep the policy.** The entity and owner layers stay out. `AGI Property Graph`
   covers parcels, permits, transactions and related assets, and its description is
   corrected to say so. Nothing else changes.
2. **Separate the store.** Owner and entity data live in a system that is *not* this
   git repository — access-controlled, retention-limited, never mirrored into source
   control — and the platform joins to it at runtime. This preserves the reason for the
   rule (git history cannot be cleaned) while allowing the capability. It is real work
   and it needs a privacy review before a line of it is written.
3. **Change the policy.** Defensible only with a documented lawful basis, a retention
   schedule and a deletion path, reviewed by counsel. Recorded here as an option so that
   choosing it is a decision rather than a drift.

Until one is chosen, this page describes the graph **as it is built**, not as it is
named, and no external material may describe the owner or entity layer as shipping.
