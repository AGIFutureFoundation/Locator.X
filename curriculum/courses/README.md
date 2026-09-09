# The course catalog, separated by pillar

**50 curriculum items** (44 courses, 6 guides) · **209 modules** · **8 pillars** · **4 levels** · all 50 live.

This directory splits the single-file curriculum into one readable document per pillar. It is a **generated view**: the source of truth stays [`curriculum/curriculum.py`](../curriculum.py) / [`curriculum-50.csv`](../curriculum-50.csv), gated by the eight checks in [`validate.py`](../validate.py). If a table here disagrees with the CSV, the CSV wins.

## The eight pillars

| # | Pillar | Items | Modules | Levels covered |
|---|--------|-------|---------|----------------|
| 01 | [Emotional equity & relationships](01-emotional-equity.md) | 8 | 40 | 1, 2, 3, 4 |
| 02 | [Foundations & the Locator.X doctrine](02-foundations.md) | 6 | 24 | 1, 2 |
| 03 | [The numbers](03-the-numbers.md) | 7 | 28 | 1, 2, 3, 4 |
| 04 | [The asset](04-the-asset.md) | 7 | 28 | 1, 2, 3, 4 |
| 05 | [Capital & structure](05-capital-structure.md) | 7 | 28 | 2, 3, 4 |
| 06 | [Development & delivery](06-development-delivery.md) | 7 | 29 | 3, 4 |
| 07 | [Evidence, data & judgment](07-evidence-data-judgment.md) | 5 | 20 | 2, 3, 4 |
| 08 | [Market, practice & the long game](08-market-practice.md) | 3 | 12 | 2, 4 |

## The four levels

- **Level 1 — Orientation** — First contact: vocabulary, the income streams, the platform's numbers. (10 items)
- **Level 2 — Practitioner** — Working skills: the buy box, survival numbers, coverage, the relationship map in practice. (13 items)
- **Level 3 — Operator** — Running deals: entitlement, feasibility, pro formas, the lender's triangle, hard conversations. (14 items)
- **Level 4 — Principal** — Structuring and judgment: waterfalls, capital markets, partnerships, the exit, the thesis. (13 items)

## Pillar × level matrix

| Pillar | L1 | L2 | L3 | L4 |
|--------|----|----|----|----|
| [Emotional equity & relationships](01-emotional-equity.md) | E1 E2 | E3 E5 | E4 E7 | E6 E8 |
| [Foundations & the Locator.X doctrine](02-foundations.md) | F1 F2 F3 F5 | F4 F6 | — | — |
| [The numbers](03-the-numbers.md) | N1 N2 | N3 N4 | N6 N7 | N5 |
| [The asset](04-the-asset.md) | A1 A2 | A3 A4 A5 | A6 | A7 |
| [Capital & structure](05-capital-structure.md) | — | C1 C2 | C3 C4 | C5 C6 C7 |
| [Development & delivery](06-development-delivery.md) | — | — | D1 D2 D3 D4 D5 | D6 D7 |
| [Evidence, data & judgment](07-evidence-data-judgment.md) | — | V1 | V2 V3 | V4 V5 |
| [Market, practice & the long game](08-market-practice.md) | — | M1 | — | M2 M3 |

## Suggested order

Entry points (no prerequisites): **E1**, **F5**, **A1**.

1. **Start on the slab.** E1 first — nearly half the catalog lists it upstream.
2. **Foundations before numbers.** F1 → F2 → F3, then N1 → N2 → N3.
3. **Level gates are capabilities, not badges.** `src/gate.js` grades each level on a real parcel; the metric that matters is the certainty-error count, not the score.
4. **The developer route** (`src/routes.js`) reorders the same lessons by the six development gates — cheapest and most reversible step first.

## Full index

| ID | Title | Pillar | Level | Kind |
|----|-------|--------|-------|------|
| E1 | Emotional equity: the balance sheet nobody keeps | [Emotional equity & relationships](01-emotional-equity.md) | 1 | course |
| E2 | The relationship map: who actually moves your deals | [Emotional equity & relationships](01-emotional-equity.md) | 1 | course |
| E3 | Trust at speed: how reputation prices your terms | [Emotional equity & relationships](01-emotional-equity.md) | 2 | course |
| E4 | The hard conversation: money, delay and bad news | [Emotional equity & relationships](01-emotional-equity.md) | 3 | course |
| E5 | Negotiating for the second deal, not the first | [Emotional equity & relationships](01-emotional-equity.md) | 2 | course |
| E6 | Partners, families and the money conversations people avoid | [Emotional equity & relationships](01-emotional-equity.md) | 4 | course |
| E7 | Reading the room: emotion as market information | [Emotional equity & relationships](01-emotional-equity.md) | 3 | course |
| E8 | The long game: mentors, referrals and compounding goodwill | [Emotional equity & relationships](01-emotional-equity.md) | 4 | guide |
| F1 | How a building pays you | [Foundations & the Locator.X doctrine](02-foundations.md) | 1 | course |
| F2 | Asset or liability: the Locator.X test | [Foundations & the Locator.X doctrine](02-foundations.md) | 1 | course |
| F3 | Income you work for, income the building works for | [Foundations & the Locator.X doctrine](02-foundations.md) | 1 | course |
| F4 | Your buy box as a statement of who you are | [Foundations & the Locator.X doctrine](02-foundations.md) | 2 | course |
| F5 | Reading Locator.X: score, evidence grade, coverage | [Foundations & the Locator.X doctrine](02-foundations.md) | 1 | guide |
| F6 | From curiosity to first offer: the 90-day path | [Foundations & the Locator.X doctrine](02-foundations.md) | 2 | guide |
| N1 | NOI, and the four things people leave out | [The numbers](03-the-numbers.md) | 1 | course |
| N2 | Cap rate is a market opinion, not a property fact | [The numbers](03-the-numbers.md) | 1 | course |
| N3 | Cash-on-cash and DSCR: the two survival numbers | [The numbers](03-the-numbers.md) | 2 | course |
| N4 | NPV, IRR and the trap of the short hold | [The numbers](03-the-numbers.md) | 2 | course |
| N5 | Equity multiple, WACC and beating the money | [The numbers](03-the-numbers.md) | 4 | course |
| N6 | The pro forma that does not lie to you | [The numbers](03-the-numbers.md) | 3 | course |
| N7 | Sensitivity: which input actually decides | [The numbers](03-the-numbers.md) | 3 | course |
| A1 | Introduction to the real estate industry | [The asset](04-the-asset.md) | 1 | guide |
| A2 | The five commercial classes are five different businesses | [The asset](04-the-asset.md) | 1 | course |
| A3 | Property valuation: three approaches and when each fails | [The asset](04-the-asset.md) | 2 | course |
| A4 | Reading the lease clause by clause | [The asset](04-the-asset.md) | 2 | course |
| A5 | The rent roll you inherit is not the one you underwrote | [The asset](04-the-asset.md) | 2 | course |
| A6 | Turnover, WALT and the year the building re-leases itself | [The asset](04-the-asset.md) | 3 | course |
| A7 | Student housing and conversion stock | [The asset](04-the-asset.md) | 4 | course |
| C1 | Coverage is the only leverage test that matters | [Capital & structure](05-capital-structure.md) | 2 | course |
| C2 | What the loan really costs beyond the rate | [Capital & structure](05-capital-structure.md) | 2 | course |
| C3 | The lender's triangle: LTV, DSCR and debt yield | [Capital & structure](05-capital-structure.md) | 3 | course |
| C4 | Seller financing and creative terms | [Capital & structure](05-capital-structure.md) | 3 | course |
| C5 | Equity partners: pref, promote and the waterfall | [Capital & structure](05-capital-structure.md) | 4 | course |
| C6 | Real estate capital markets: public and private | [Capital & structure](05-capital-structure.md) | 4 | course |
| C7 | Securitisation: how a mortgage becomes a security | [Capital & structure](05-capital-structure.md) | 4 | guide |
| D1 | The development system: eight actors, six gates | [Development & delivery](06-development-delivery.md) | 3 | course |
| D2 | Zoning: density, height and coverage are three limits | [Development & delivery](06-development-delivery.md) | 3 | course |
| D3 | By right, conditional, and the word that costs a year | [Development & delivery](06-development-delivery.md) | 3 | course |
| D4 | Feasibility as a gate, not an opinion | [Development & delivery](06-development-delivery.md) | 3 | course |
| D5 | Construction cost, schedule and the contingency | [Development & delivery](06-development-delivery.md) | 3 | course |
| D6 | Value engineering is not cost cutting | [Development & delivery](06-development-delivery.md) | 4 | course |
| D7 | The development lab: one site, start to finish | [Development & delivery](06-development-delivery.md) | 4 | course |
| V1 | Framing the question before you touch the data | [Evidence, data & judgment](07-evidence-data-judgment.md) | 2 | course |
| V2 | Keys, joins and the duplicate that doubles your market | [Evidence, data & judgment](07-evidence-data-judgment.md) | 3 | course |
| V3 | Medians, skew and the sample-size floor | [Evidence, data & judgment](07-evidence-data-judgment.md) | 3 | course |
| V4 | Fitting, holding out and refusing to extrapolate | [Evidence, data & judgment](07-evidence-data-judgment.md) | 4 | course |
| V5 | Drawing a number so it cannot mislead | [Evidence, data & judgment](07-evidence-data-judgment.md) | 4 | course |
| M1 | Markets, jobs and where the money is going | [Market, practice & the long game](08-market-practice.md) | 2 | course |
| M2 | Disruption in commercial real estate | [Market, practice & the long game](08-market-practice.md) | 4 | guide |
| M3 | Holding, tax and the exit | [Market, practice & the long game](08-market-practice.md) | 4 | course |

## Regenerating

These files are emitted from the CSV. To regenerate after a curriculum change, re-run `python3 curriculum/gen_courses.py`, or rebuild the tables from `curriculum-50.csv` — then run `python3 curriculum/validate.py` before committing.