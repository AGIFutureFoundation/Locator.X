# Locator.X pricing — management-set, not measured

Every figure on this page is a **management decision set by the platform owner**. That
is a different kind of claim from the rest of this repository, and the distinction is
the point of the page.

Elsewhere here, a number has to be measured before it can be asserted: a record count
is counted, a coverage percentage is recomputed, a competitor's price carries the source
that published it ([`../market/LANDSCAPE.md`](../market/LANDSCAPE.md)). A price for your
own product cannot work that way — nobody measures it, somebody chooses it. So it is
labelled **management-set** and held to the honesty rule that does apply: it is not
dressed up as anything else, and nothing here implies it was derived from data it was
not derived from.

## The tiers

| Tier | Price | Included | Label |
|---|---|---|---|
| **Explorer** | $39 per user / month | Single user | management-set |
| **Investor** | $129 per user / month | Single user | management-set |
| **Acquisitions** | $299 per organisation / month | 3 users | management-set |
| **Portfolio** | $699 per organisation / month | 10 users | management-set |
| **Enterprise** | custom | by agreement | management-set |

Additional revenue lines named in the operating brief, all **management-set** and none
of them currently metered by anything in this repository: included and paid additional
seats; data-enrichment, document and premium-record usage credits; portfolio analytics
and strategy modules; API and enterprise data integrations; implementation, migration
and configuration services; and internal AGI Corp use of the platform as the operating
system for company-owned real estate.

## Academy certification

| Credential | Price | What it certifies | Label |
|---|---|---|---|
| **Locator.X Certified Practitioner** | $500 one-time | Every graded surface in the training system, genuinely passed: all five Academy role transfer checks (`src/academy.js` — no hints, first-attempt accuracy ≥ 75%, mentor overrides excluded) and all eight Trade School track certification checks (`src/tradeschool.js` — every module's question once each, no retries, ≥ 75% first-attempt) | management-set |

The training itself stays free — every mission, drill and check that leads to the
credential is open in the app today; there is no license gate on any of it (`src/home.js`
and the investor deck both already say so of the platform generally). $500 prices the
comprehensive credential once it is genuinely earned, not access to earn it.

**What this figure cannot honestly claim.** This is a static, no-server, no-accounts
application by design — there is no payment processor, no checkout flow and no
server-side record of who paid, anywhere in this repository. $500 is a management-set
price for a credential this repository has no way to collect payment for yet; selling
it for real needs a payment integration this repository does not build. The credential
mechanics were hardened before this price was written down: both checks used to be
gameable (a one-click self-issued credential with no assessment, and a multiple-choice
question with unlimited free retries) — fixed and guarded in `tests/fleet_smoke.js`
before this row existed.

## What is deliberately not on this page

**No comparison to another vendor's price.** Not one figure in
[`../market/LANDSCAPE.md`](../market/LANDSCAPE.md) has been verified against a vendor's
own checkout page — five vendor hosts were probed from the development container on
2026-09-15 and every one returned `000`. The register's own rule applies without
exception here: *until a row is verified, no public Locator.X material may quote its
figure as fact.* A price-comparison chart built on unverified figures is the single
easiest way to be publicly wrong about a competitor, and it is not worth a slide.

**No claim that a tier maps to a capability that is not built.** Two of the eight
branded products in [`POSITIONING.md`](POSITIONING.md) are **not built** and four are
**partial**. Any tier description, landing page or deck that implies otherwise is
wrong on a fact this repository already knows. When tier feature lists are written,
they are written from that table.

**No return projections, yields or fund terms.** Those are not pricing, they are
securities-adjacent statements, and they are governed by [`FUNDING.md`](FUNDING.md).
