# AGI Corp — the company layer

AGI Corp is a technology-enabled real-estate development, acquisition and
portfolio-owning company. It owns **Locator.X**, its proprietary real-estate
intelligence and investment operating platform.

> **Locator.X by AGI Corp turns fragmented property signals into verified, financeable,
> and actionable real-estate investments.**

Locator.X is not positioned as a general-purpose SaaS product. It is the system AGI Corp
uses to discover, verify, underwrite, acquire, develop, operate, optimise and selectively
dispose of real-estate assets — and which it also licenses.

**AGI Corp's investment edge is intended to come from proprietary data, explainable AI,
disciplined underwriting, repeatable acquisition workflows, and actual-versus-underwritten
learning.** Three of those five have shipping mechanisms in this repository today; the
fifth does not exist yet. Which is which is the subject of these pages, and it is stated
rather than implied.

## The five documents

| Document | What it settles | The kind of claim it makes |
|---|---|---|
| [`POSITIONING.md`](POSITIONING.md) | The eight branded data products, each set against the modules that implement it | **measured** — every name claiming `ships` or `partial` must name a real module at its real line count |
| [`PRICING.md`](PRICING.md) | The five subscription tiers and the other revenue lines | **management-set** — a price is chosen, not measured, and the page says so on every row |
| [`PORTFOLIO_STRATEGY.md`](PORTFOLIO_STRATEGY.md) | Sleeves, geography, and the eight-condition acquisition gate | **management target** and **plan** — no property has been acquired on the strength of anything here |
| [`FUNDING.md`](FUNDING.md) | The operating-company / property-capital separation, the entity model, and the language that may never ship | **boundary** — enforced by a lint, not a policy |
| [`AGENTS.md`](AGENTS.md) | The six agents, each one's hard boundary, and what exists today | **measured**, with the same module rule as positioning |

## The capital layer

The group runs mission governance, software, robotics hardware and real-estate assets. The
essential rule is that these are never mixed inside an unclear entity structure — each
capital pool is separated, its rights defined, and its risks disclosed plainly.

| Document | What it settles | The kind of claim it makes |
|---|---|---|
| [`THE_ASK.md`](THE_ASK.md) | **The two-part ask** — Part A, the Locator.X, Inc. seed; Part B, the property bundle — with earmarks and the firewall between them | **plan** — targets and earmarks, never an offer |
| [`PORTFOLIO_BASKET.md`](PORTFOLIO_BASKET.md) | The real-estate bundle: thesis, the sponsor conflict and its controls, and what the platform does and does not contribute | **plan** |
| [`CAPITAL_STRUCTURE.md`](CAPITAL_STRUCTURE.md) | The entity register — for each entity, what an investor owns, what proceeds fund, and **what they do not automatically own** | **boundary** — the last column may never be empty |
| [`MISSION_RIGHTS.md`](MISSION_RIGHTS.md) | The PBC's narrow reserved matters, and the longer list it may **not** approve | **boundary**, plus six governing documents that do not exist yet |
| [`INSTRUMENTS.md`](INSTRUMENTS.md) | Financing instruments by stage, and the planned programmes | **plan** — planning ranges, never an offer |
| [`SAFE_TERMS.md`](SAFE_TERMS.md) | The pre-seed SAFE in detail: which form, which terms to refuse, offering mechanics, and the Series A readiness checklist | **recommendation** — counsel drafts and approves every instrument |
| [`CAP_TABLE.md`](CAP_TABLE.md) | Pre-seed planning ranges, expensive mistakes, terms a priced round expects | **management target**, explicitly illustrative |
| [`USE_OF_PROCEEDS.md`](USE_OF_PROCEEDS.md) | The schedule every raise carries, and budget guardrails | **management target** — ranges verified able to sum to 100% |
| [`RISK_REGISTER.md`](RISK_REGISTER.md) | 24 risks, each with its mechanism, mitigation and a named owner | **honest disclosure** — no row claims a risk is eliminated |
| [`INVESTOR_REPORTING.md`](INVESTOR_REPORTING.md) | Quarterly investor reporting and the annual public-benefit report | **plan** |

## The four kinds of claim, kept apart

The operating brief requires that facts, assumptions, management targets and future plans
be clearly distinguished. That is the same discipline the rest of this repository already
runs on, applied to the company rather than to a parcel:

- a **fact** is measured, and names its measurement
- an **assumption** is a stand-in for a fact nobody has measured
- a **management target** is a decision the platform owner made
- a **plan** is a future intention, with nothing yet to measure

The most common failure in a company document is not a lie; it is a target printed in the
typeface of a fact.

## What the layer currently says about itself

Counted from the pages, not from memory: of the eight branded data products, **two are
not built and four are partial**. Of the six agents, **one ships outright, four are
partial and one is absent**. Of the eight acquisition-gate conditions, **two have no
platform support at all** and one is user-side by design. Three of the agent partials are
blocked on the same missing build — multi-user state, task and approval workflow, and an
audit trail across users — which is also acquisition-gate condition 8.

## The open decision

[`POSITIONING.md`](POSITIONING.md) carries one question this repository cannot answer for
itself: the brief specifies owner and entity intelligence, and owner fields are **stripped
at ingest** and never enter this repository ([`../../data/README.md`](../../data/README.md) §2).
Three honest resolutions are set out there. Until one is chosen, no external material may
describe the owner or entity layer as shipping.

## Enforcement

`scripts/validate_company.py` runs in `tests/run.py` beside the other gates. It fails the
build on an unindexed document, a branded name with no status or no module, a module line
count that has drifted, a pricing tier not labelled management-set, a registered-trademark
symbol anywhere in the documentation, or language in any `docs/` or `content/` markdown
file that projects a return as fact, solicits an investment, presents fund terms as
agreed, or implies that software equity conveys ownership of portfolio property.
