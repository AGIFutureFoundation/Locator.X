# The investor-software landscape — as reported, and what we can verify

**Every figure on this page is a claim about somebody else's product, made by a
source on a date.** None of it was checked against a vendor's own checkout page
from this environment, because this environment cannot reach one: five vendor
hosts were probed on 2026-09-15 and every one returned `000`
(`www.propstream.com`, `batchleads.io`, `resimpli.com`, `www.buildium.com`,
`dealmachine.com`). That is the same egress wall the county-records work runs
into ([`../states/coverage/README.md`](../states/coverage/README.md)), and it is
recorded the same way rather than papered over.

So the table below is deliberately **not** a price comparison. It is a register
of claims, each carrying the source it came from and a status from a fixed
vocabulary. `scripts/validate_landscape.py` fails the build on a row that loses
its source or its status — the same rule the coverage inventory follows, applied
to market intelligence.

## The status vocabulary

| Status | Meaning | What it takes to advance |
|---|---|---|
| `reported` | A figure from the supplied research, with the source it cites. **Not verified here.** | Open the vendor's own pricing page and record what it says, with the date |
| `verified YYYY-MM-DD` | Someone opened the vendor page on that date and the figure matched | — |
| `changed YYYY-MM-DD` | Checked, and the vendor's figure differs from what was reported | Update the row and say what moved |
| `no public price` | The vendor publishes no tier: quote, enterprise or usage-based | Nothing, unless the vendor starts publishing |
| `unsourced` | The research named a figure but cited no source. **The figure is not repeated here** — an unsourced price is a rumour with a decimal point | Find the vendor's page, then the row becomes `verified` |

**Why this matters more than it looks.** A pricing claim in a pitch deck is the
easiest thing in the world to get wrong, and the most embarrassing to be caught
on: vendors change tiers quarterly, annual-effective and monthly figures get
mixed, and setup fees and per-seat minimums vanish in the retelling. A platform
whose first rule is that it never shows a number it cannot defend does not get
an exemption when the number is a competitor's.

## The register


| Tool | Job | What it does | Pricing as reported | Source | Status |
|---|---|---|---|---|---|
| **PropStream** | Data & lists | Nationwide records, ownership and mortgage data, comps, filters, lead lists, skip tracing, email/direct mail | Essentials $99/mo · Pro $199/mo · Elite $699/mo (annual-effective $81/$165/$583) | [source](https://www.propstream.com/news/how-much-does-propstream-cost) | `reported` |
| **BatchLeads** | Data & lists | Curated database, one-click list building, owner enrichment, skip tracing, outbound campaigns, CRM | Growth $119/mo · Professional $349/mo · Scale $749/mo · Enterprise custom | [source](https://batchleads.io/pricing) | `reported` |
| **DealMachine** | Field acquisition | Mobile lookup, map prospecting, owner identification, comps, skip tracing, postcards, dispositions | From $99–$119/mo depending on billing; mail is credit-metered | [source](https://www.dealmachine.com/blog/best-real-estate-investing-software-in-2026) | `reported` |
| **REsimpli** | Investor CRM | CRM, nationwide data, list building, dialer, SMS, direct mail, attribution, reporting | Basic $149/mo · Pro $299/mo · Enterprise $599/mo; annual Solo cited at $249/mo | [source](https://resimpli.com/blog/best-all-in-one-real-estate-investor-crm-in-2026/) | `reported` |
| **REISift** | Data hygiene | List cleansing, dedupe, stacking, USPS vacancy, address normalisation, statuses, exports | Essentials $49/mo · Professional $149/mo · Business $299/mo (older annual totals also cited) | [source](https://realestatebees.com/software/reisift/) | `reported` |
| **DataSift** | Data & scoring | Nationwide data, CRM, unlimited skip tracing, lead scoring, county distress data | Plans from $149/mo | [source](https://www.datasift.ai/pricing) | `reported` |
| **BatchDialer** | Outbound calling | Multi-line dialer, agent/team workflows, PropStream integration | Starter $119/agent/mo ($95 annual-effective); Pro and Enterprise above | [source](https://www.propstream.com/news/more-value-at-a-lower-price-what-batchdialers-new-plans-mean-for-propstream-users) | `reported` |
| **InvestorFuse** | Acquisition ops | Investor CRM, lead flows, routing, tasking, attribution, cost per contract and per closed deal | Essentials $147/mo · Pro $247/mo · Premium $377/mo; setup fees reported at $197/$497 | [source](https://www.realestateskills.com/blog/investorfuse) | `reported` |
| **DealTools** | Field acquisition | Property lookup, owner/contact data, driving for dollars, comping, lead management | Quote or subscription; no public tier in the source material | — (no source URL in the supplied research) | `no public price` |
| **PropertyRadar** | Parcel intelligence | Public-record data, mapping, parcel and ownership filters, distress research, lists | Geographic and usage-based; no single public tier | — (no source URL in the supplied research) | `no public price` |
| **LandGlide** | Parcel lookup | Parcel boundaries, ownership, APN detail, overlays, GPS field work | Not recorded — the research named a mobile subscription figure and cited nothing for it | — (no source URL in the supplied research) | `unsourced` |
| **Foreclosure.com** | Distress leads | Pre-foreclosure, auction, REO, tax lien and bankruptcy discovery with alerts | Paid subscription after trial; regional and promotional variation | — (no source URL in the supplied research) | `no public price` |
| **DataTree** | Title & documents | Property profiles, ownership history, deeds, mortgages, liens, tax data, document retrieval | Subscription and transaction-based; enterprise pricing | — (no source URL in the supplied research) | `no public price` |
| **DealCheck** | Underwriting | Rental, flip, BRRRR and commercial analysis; loan modelling; cap rate, CoC, IRR, GRM; reports | Free core; paid tiers described near $19/mo and $39/mo | [source](https://play.google.com/store/apps/details?id=com.fortnofffinancial.dealcheck_rentals&hl=en_US) | `reported` |
| **BiggerPockets Pro** | Underwriting & community | Rental/flip/BRRRR calculators, saved reports, market content, forums | Plus near $19/mo, Pro near $39/mo per the cited directory | [source](https://www.biggerpockets.com/forums/12/topics/1006482-real-estate-investing-software-a-directory) | `reported` |
| **Mashvisor** | Market analytics | Investment-property search, rental estimates, cash-flow and ROI analytics, STR and LTR analysis | Annual-effective Lite $39.99 · Standard $74.99 · Professional $99.99 · Enterprise custom | [source](https://www.bnbcalc.com/reviews/mashvisor-review-2026) | `reported` |
| **AirDNA** | STR analytics | Market analysis, Rentalizer revenue estimates, demand history, comp sets, rate calendars | Free tier · Research $125/mo · Host $150/mo · Property Manager and Enterprise by quote | [source](https://www.bnbcalc.com/reviews/airdna-review-2026) | `reported` |
| **Rentometer** | Rent comps | Rent comparables, rent reports, neighbourhood benchmarks, API access | Professional and enterprise subscriptions; usage-dependent | — (no source URL in the supplied research) | `no public price` |
| **CoStar** | Commercial data | Commercial inventory, sales and lease comps, ownership, analytics, tenants, portfolios | Custom enterprise, quote-based | — (no source URL in the supplied research) | `no public price` |
| **HouseCanary** | Valuation analytics | AVMs, property data, market analytics, rental estimates, risk and collateral analytics, API | Enterprise, quote-based | — (no source URL in the supplied research) | `no public price` |
| **AppFolio** | Property management | Leasing, resident portal, accounting, maintenance, payments, reporting, integrations | Core $1.40/unit/mo (min $280) · Plus $3.00 (min $900) · Max $5.00 (min $7,500) | [source](https://www.rentecdirect.com/blog/best-property-management-software-2026/) | `reported` |
| **Buildium** | Property management | Applications and screening, listings, payments, reporting, eSignatures, analytics, open API at Premium | Essential from $62/mo · Growth $192/mo · Premium $400/mo | [source](https://www.buildium.com/blog/best-real-estate-management-software/) | `reported` |
| **Rentec Direct** | Property management | Tenant and lease management, payments, accounting, reporting, maintenance | Pro $2.00/unit/mo (min $50) · PM $2.50/unit/mo (min $50); a current page cites Pro from $55/mo | [source](https://www.rentecdirect.com/blog/best-property-management-software-2026/) | `reported` |
| **TenantCloud** | Property management | Listings, applications, payments, maintenance, inspections, reconciliation, owner portal | Starter $18/mo · Growth $35/mo · Pro $60/mo (annual-effective $16.50/$32.10/$55) | [source](https://www.buildium.com/blog/best-real-estate-management-software/) | `reported` |
| **RentRedi** | Property management | Rent collection, screening, listings, maintenance, leasing, tenant communications | Grow $12/mo billed annually; Pro custom | [source](https://rentredi.com/blog/rentredi-vs-baselane-2026-landlord-software-comparison/) | `reported` |

## What the register says when you count it

- **25 tools**, of which **17 carry a reported price** and **7 publish no public
  price at all** — quote-only, enterprise or usage-metered. **1 is unsourced**:
  the research quoted a LandGlide subscription figure and cited nothing for it,
  so the figure is not on this page.
- **Zero rows are verified.** Not one figure here has been checked against the
  vendor's own page from this environment, and the table says so on every row
  rather than in a footnote.

## How to verify a row

1. Open the vendor's own pricing page — not a comparison blog, not a review site,
   not a directory. The register above cites what the research cited, and most of
   those are secondary.
2. Record the tier names and figures **as the vendor writes them**, including
   whether the figure is monthly, annual-effective, per seat, per unit, or per
   credit, and any minimum or setup fee.
3. Set the status to `verified YYYY-MM-DD`, or to `changed YYYY-MM-DD` with a
   note on what moved.
4. Where a vendor publishes no price, leave `no public price`. An estimate
   reconstructed from a sales call is not a published price and does not belong
   in this table.
5. An `unsourced` row states no figure at all. Do not restore one from memory or
   from the research that failed to cite it — find the vendor's page or leave the
   cell empty of numbers. The validator enforces this: it fails on a currency
   figure in an `unsourced` row.

Until a row is verified, **no public Locator.X material may quote its figure as
fact** — not a landing page, not a deck, not a comparison chart. The register
exists to make that rule checkable rather than remembered.

