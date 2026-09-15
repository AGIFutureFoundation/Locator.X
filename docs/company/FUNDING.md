# Capital structure and the lines this repository will not cross

AGI Corp separates two kinds of capital, and the separation is the governing rule of
every document, page, deck and export this platform produces.

| | What it funds | What it does **not** convey |
|---|---|---|
| **A. Operating-company capital** | Locator.X product, intellectual property, data architecture, AI, engineering and go-to-market | **No ownership of any portfolio property.** An equity investment in the software company conveys rights in the software company only, unless legal documents explicitly and separately establish otherwise |
| **B. Property capital** | Acquisition, renovation, development, transaction costs, reserves and asset operations, at the asset-level SPV | No interest in the operating company, unless separately documented |

## The entity model

| Entity | Role |
|---|---|
| **AGI Corp** | Parent; owner of Locator.X intellectual property, trademarks, data architecture, operating strategy and the platform business |
| **Locator.X** | AGI Corp's proprietary property-intelligence, underwriting, acquisition, portfolio and AI-agent platform |
| **AGI Development Management, LLC** | Development and asset-management operator |
| **AGI Property Holdings, LLC** | Holding company for owned properties |
| **AGI asset-level SPVs** | Separate LLCs that acquire, finance, hold, renovate, develop, operate, refinance and sell specific properties or property clusters |

These are the platform owner's stated entities, recorded as supplied. This repository
asserts nothing about their formation status, jurisdiction, good standing or the
contents of their operating agreements, because it has not seen those documents.

## What may never appear in anything this platform produces

Any external fundraising, pooled vehicle, fund, syndication, securities offering,
investor solicitation, return projection or investor-rights document must be reviewed
and approved by qualified securities, tax, real-estate and fund counsel **before
external use**. Until that review exists, and regardless of how a request is phrased,
the following do not appear in this repository or in anything built from it:

1. **A projected, targeted or guaranteed return, yield, IRR, multiple or distribution
   stated as a settled fact.** The underwriting desk computes scenario figures for a
   specific property on stated assumptions, and labels them exactly that way. A scenario
   figure is not a projection of what an investor will receive, and must never be
   relayed as one.
2. **Public solicitation language for a securities offering** — an invitation to invest,
   a minimum, a close date, a raise amount presented as an open opportunity.
3. **Any statement that a software equity investor receives ownership of, or a claim on,
   portfolio properties.** See the table above. This one is worth stating twice because
   it is the easiest thing in the world to imply by putting the two capital stacks on
   one slide.
4. **Fund terms** — fees, carry, preferred returns, waterfalls — presented as agreed.
5. **A market-specific investment advantage claimed without supporting data and approved
   operating evidence.** "We have an edge in this market" is a claim about performance;
   until there is measured evidence, the honest statement is the mechanism, not the edge.

`scripts/validate_company.py` scans this repository's documentation and article content
for language in these categories and fails the build on a match. It is a blunt
instrument and it will occasionally object to an innocent sentence; that is the correct
trade, because the failure it prevents is not a typo.

## Why a lint and not a policy

A policy is remembered until the week it is inconvenient. Every other rule in this
project that mattered got a validator — the coverage inventories, the use-code
crosswalk, the market register, the module claims in
[`../market/GAP.md`](../market/GAP.md). The rules on this page are the ones where being
wrong is not an embarrassment but a legal exposure, so they get the same treatment,
and the check runs in CI beside the other six gates.
