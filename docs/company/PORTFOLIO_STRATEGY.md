# AGI Corp portfolio strategy and the acquisition gate

AGI Corp seeks to build a curated portfolio of properties where Locator.X provides an
identifiable sourcing, underwriting, diligence, development, operating or disposition
advantage. Everything on this page is a **management target** or a **plan** as supplied
by the platform owner — not a measurement, and not a description of a portfolio that
exists. No property has been acquired on the strength of anything in this repository,
and this page does not imply one has.

## Initial sleeves

| Sleeve | Target allocation | Label |
|---|---|---|
| Workforce housing and small multifamily | 35%–45% | management target |
| Single-family value-add and build-to-rent | 20%–30% | management target |
| Small commercial, mixed-use and redevelopment | 15%–25% | management target |
| Land, entitlement and infill development | 5%–15% | management target |
| Special situations reserve — distressed, seller-finance, tax-default, recapitalisation | 5%–10% | management target |

## Initial geography

**Plan:** focus first on one primary acquisition market and one adjacent expansion
market; build local data advantage, operator relationships, repeatable diligence,
contractor networks and financing relationships before expanding.

**The constraint this platform places on that plan:** a market-specific investment
advantage may not be claimed without supporting data and approved operating evidence.
Today the record layer covers 8 shipped editions against 90 coverage-gate rows
([`../states/coverage/README.md`](../states/coverage/README.md)), and
[`../market/PREMIUM_ROADMAP.md`](../market/PREMIUM_ROADMAP.md) §2.2 names the county
pull queue as the long pole. Depth of record in one market is the thing that would make
the advantage claim true; until then the honest statement is the mechanism, not the edge.

## The acquisition gate

A property moves forward only when **all** of the following hold. This is a gate, not a
scorecard: there is no total, and a miss is not offset by a strength elsewhere.

| # | Condition | What in the platform bears on it |
|---|---|---|
| 1 | Fits an approved sleeve and market | The buy box in `src/underwrite.js` (595) and the view builder in `src/views.js` (205) |
| 2 | Meets defined return, leverage, cash-flow, contingency and **downside-case** thresholds | `src/underwrite.js` stress block: break-even rent, break-even rate, rate headroom, DSCR at stress |
| 3 | Has a written value-creation plan beyond general appreciation | `src/switchboard.js` (438) names which plays the record can support, and which it cannot |
| 4 | Passes ownership, title, tax, lien, zoning, permit, physical-condition, insurance, financing and legal diligence | `src/records.js` (250) assembles the per-jurisdiction sources; **ownership, title and lien retrieval are user-side** — the platform links, it does not hold |
| 5 | Has confidence-scored supporting data and clearly logged open questions | `src/evidence.js` (223) grades the inputs; `src/coverage.js` (340) states what the edition cannot answer at all |
| 6 | Has at least two credible exit paths where practical | `src/switchboard.js` — but note that where it reports **blocked**, that is a genuine absence of an exit analysis, not a pass |
| 7 | Falls within diversification and concentration limits | **Not built.** There is no portfolio object above the property; Phase 1.4 of the premium roadmap |
| 8 | Receives approval from the designated human investment committee | **Not built.** There is no approval workflow, no multi-user state and no audit trail; see `Locator.X Diligence Room` in [`POSITIONING.md`](POSITIONING.md) |

**Two of the eight gate conditions have no platform support at all**, and one more is
user-side by design. That is stated here so the gate is run by people who know which
parts the software does not check — a gate believed to be automated and is not is worse
than a gate everyone knows is manual.

## What this page is not

It is not a description of assets under management, a track record, a projection of
returns, or an offer. Anything of that kind is governed by [`FUNDING.md`](FUNDING.md)
and requires counsel review before external use.
