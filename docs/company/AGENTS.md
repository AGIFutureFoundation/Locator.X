# The six agents — bounded, traceable, and never the decider

AGI Corp's brief specifies six AI agents. This page records each one's scope, the
boundary it may not cross, and **what exists in this repository today** — measured, the
way [`../market/GAP.md`](../market/GAP.md) measures everything else.

## The three rules that bind all six

1. **Bounded.** An agent acts only within a scope a human set, and it cannot widen its
   own scope. No agent here is authorised to transact, offer, contact an owner, commit
   capital, or change a buy box.
2. **Traceable.** Every output names its inputs and where each came from. The mechanisms
   already exist and are not optional decoration: `src/evidence.js` (223) grades a
   source, `src/sources.js` (176) says how it attaches, `src/comps.js` (282) refuses a
   comparable that is not a recorded sale with a date, `src/switchboard.js` (455) grades
   every strategy column by the facts it rests on, and `src/coverage.js` (340) states
   what the edition cannot answer at all.
3. **Human approval for anything material.** An agent proposes; a person decides. This
   is not a courtesy — it is the reason the platform can be honest about confidence,
   because a system that acts on a `C`-graded record is worse than one that does nothing.

**Never represents unverified information as fact.** That rule is already enforced
mechanically across this repository and applies to agent output without exception.

## The six

| Agent | Scope | Hard boundary | What ships today | Status |
|---|---|---|---|---|
| **Scout** | Monitors approved markets and buy boxes, detects qualifying properties and new event signals, explains why a property entered the pipeline | May not widen a buy box or a market; may not contact anyone | `src/scout.js` (287) — feed scanning, diff, score, match, and a review digest per pass; `src/signals.js` (148) outside forces; `src/patterns.js` (467) mined automations | **ships** |
| **Diligence** | Builds the property timeline and evidence package, finds missing diligence items, summarises ownership, debt, liens, permits, zoning, comps, risks and documents | **Never represents unverified information as fact**; may not retrieve or store owner PII | `src/records.js` (250) per-jurisdiction source assembly, `src/rag.js` (224) grounded retrieval with citation, `src/packet.js` (173) the closing file | **partial** — evidence assembly and citation ship; **ownership, debt and lien summarisation do not**, and the ownership half collides with the no-PII rule ([`POSITIONING.md`](POSITIONING.md)) |
| **Underwriting** | Generates initial scenarios, flags assumptions needing human review, produces base / downside / upside cases, compares strategies and capital structures | **Does not make final investment decisions** | `src/underwrite.js` (599) ten financing structures, offer solver and the stress block; `src/switchboard.js` (455) strategy comparison graded by facts; `src/predict.js` (587) forecasts that carry a backtest | **ships** — and the assumption-flagging the brief asks for is already the switchboard's lever list |
| **Acquisitions** | Call briefs, property summaries, follow-up tasks, pipeline updates; **drafts** outreach for human review; tracks aging leads and missing next actions | Must observe applicable privacy, calling, SMS, email and consent requirements. **Drafting for a human to review is in scope; sending is not** | `src/uwexport.js` (370) memo and reel, `src/deskws.js` (91) worksheet interop, `src/telemetry.js` (280) your own record | **partial** — briefs and summaries ship; **there is no pipeline aging, no task state and no multi-user workflow** |
| **Development** | Renovation and development scope options; tracks budgets, schedules, permits, contractors, contingencies and project risks; compares projected versus actual | May not represent a modelled cost as a quote | `src/dev.js` (158) feasibility, `src/rebuild.js` (335) construction cost, `src/conv.js` (111) conversion models — all labelled as models | **partial** — scope and cost modelling ship; **schedule, contractor, permit and risk tracking do not** |
| **Portfolio Learning** | Compares underwritten assumptions to actual outcomes across rent, occupancy, capex, rehab, expenses, financing and exit; recommends calibration | May not report a calibration below the sample floor | `src/predict.js` (587) holds the backtest mechanism this needs | **not built** — Phase 3 of [`../market/PREMIUM_ROADMAP.md`](../market/PREMIUM_ROADMAP.md); nothing feeds it operating results |

**Two of six ship outright, three are partial, one is absent.** All three partials are
blocked on the same missing thing: there is no multi-user state, no task or approval
workflow, and no audit trail across users. That is one build, and it unblocks the
Diligence Room, the Acquisitions agent and gate condition 8 in
[`PORTFOLIO_STRATEGY.md`](PORTFOLIO_STRATEGY.md) together.

## A boundary that moved, recorded precisely

[`../market/GAP.md`](../market/GAP.md) lists **autonomous outreach** — dialers, SMS
blasts, direct-mail campaigns — among the capabilities this platform refuses to build,
and that stands. The Acquisitions agent as specified does something different: it
**drafts** outreach for a human to review, send or discard. Drafting under human review
is in scope. Sending is not, and no agent acquires the ability to send by being asked
nicely.

The related refusal also stands unchanged: **no "motivation" or distress label without
evidence.** Where the record says *lis pendens filed on a date*, that is what is shown.
Everything past it is inference sold as fact, and it is a claim about a person who
cannot see or contest it.
