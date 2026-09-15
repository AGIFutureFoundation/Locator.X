# Use of proceeds — ring-fencing, written down before the money arrives

"Ring-fenced use of proceeds" is the second of the five commitments in
[`CAPITAL_STRUCTURE.md`](CAPITAL_STRUCTURE.md), and it is the one most often asserted and
least often documented. This page is what makes it checkable: a fixed schedule that
accompanies every raise, and budget guardrails with an arithmetic property the validator
enforces.

## The Use of Proceeds Schedule

One page, prepared and board-approved for **every** raise, at every entity, without
exception:

| Field | Required disclosure |
|---|---|
| Issuer | The exact legal entity receiving funds |
| Raise amount | Minimum, target and maximum where applicable |
| Security | SAFE, preferred equity, common equity, note, SPV interest, grant or contract |
| Time horizon | Expected months of runway, or the project period |
| Approved budget categories | Product, payroll, content, equipment, sales, legal, reserves |
| Restricted uses | What this capital is explicitly **not** funding |
| Intercompany payments | Any planned payment to an AGI affiliate, and the agreement governing it |
| Approval authority | Who may reallocate funds, and above what threshold |
| Reporting cadence | Monthly management reporting; quarterly investor reporting |
| Material-deviation rule | The point at which board or investor notice, or approval, is required |

The **restricted uses** and **intercompany payments** rows are the two that do real work.
The first is how an investor knows what they are not funding. The second is where hidden
economics would otherwise live in a group with this many affiliates.

## AGI Corp operating-company budget

**Management targets.** Ranges, not commitments; the low ends and high ends bracket 100%
so the budget can actually be constructed, which `scripts/validate_company.py` verifies
arithmetically rather than trusting.

| Use | Share | Guardrail |
|---|---:|---|
| Product, AI, data and engineering | 35%–45% | Core platform and customer-facing integrations first |
| Cognition.X curriculum and simulation IP | 15%–25% | Reusable content assets; customer-funded custom work where possible |
| Robotics pilots and lab partnerships | 10%–20% | Leases, partners and grants ahead of owned hardware inventory |
| Customer success and enterprise pilots | 10%–15% | Spend tied to conversion likelihood and measurable outcomes |
| Security, accessibility, privacy, compliance | 5%–10% | Foundational, not optional — and not the line that gets cut first |
| Sales and partnerships | 5%–10% | Validated ideal customer profiles and channel partners |
| G&A and contingency | 5%–10% | Runway reserve, legal and accounting readiness |

## Property SPV budget

| Use | Principle | Guardrail |
|---|---|---|
| Acquisition cost | Primary use | Limited to the named property or defined portfolio |
| Closing, legal, appraisal, inspection | Fully budgeted | Independent diligence, disclosed |
| Renovation or development | Fixed approved budget plus contingency | Change-order controls and dual approvals |
| Reserves | Required | Debt service, insurance, operating and capital reserves |
| Management fees | Clearly disclosed | Arm's-length agreement; AGI affiliate fees disclosed as such |
| Financing costs | Fully disclosed | Debt terms, guarantees, liens and refinancing assumptions stated |
| Distributions | Only as permitted by the documents | **No implied yield and no distribution promise** |
| Sponsor promote or carried interest | Clearly disclosed | Stated in the legal documents, never buried in an operating assumption |

The last two rows are load-bearing. A distribution assumption inside a model is an
arithmetic output; the moment it is repeated to an investor as an expectation it becomes
something else entirely. The language lint fails the build on that phrasing wherever it
appears in this repository.

## Grant and restricted funds

Restricted capital is tracked separately from the first dollar, never pooled with
operating cash, and never used for an activity the grant agreement does not permit.
Reporting, allowable-cost and IP conditions are honoured as written. This is the third of
the three capital pools the group keeps apart — operating, property, restricted — and
mixing it is the one that damages a mission-governed group fastest, because it is
simultaneously a breach and a story.
