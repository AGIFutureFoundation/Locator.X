# Capital structure — what an investor is buying, stated before they ask

The first diligence question is not "how big is the market". It is **"what am I
buying?"** A group that runs mission governance, software, robotics hardware and
real-estate assets can answer that badly in a dozen ways, and every one of them
is discovered later rather than sooner.

> **AGI is building mission-governed commercial platforms for AI readiness, workforce
> training, simulation, robotics, and real-estate intelligence. Our capital structure is
> designed to separate operating-company risk, property-asset risk, and public-benefit
> governance while preserving a shared technology and mission advantage.**
>
> **Investors receive economic exposure only to the entity and assets identified in their
> financing documents. AGI does not commingle capital across operating subsidiaries,
> property vehicles, grant-funded programs, or public-benefit initiatives without explicit
> legal authority, board approval, and investor disclosure.**

**The essential rule:** do not mix mission, software, property, robotics hardware and
investor economics inside an unclear entity structure. Separate each capital pool, define
its rights, and disclose the risks plainly.

## The five commitments

1. **Clear entity ownership** — every instrument names the exact issuer.
2. **Ring-fenced use of proceeds** — capital funds only the approved budget of that issuer
   or SPV ([`USE_OF_PROCEEDS.md`](USE_OF_PROCEEDS.md)).
3. **Defined governance** — board composition, voting, founder rights, mission rights,
   investor protections and conflicts procedures are documented
   ([`MISSION_RIGHTS.md`](MISSION_RIGHTS.md)).
4. **Honest risk disclosure** — material risks described without claiming guaranteed
   outcomes ([`RISK_REGISTER.md`](RISK_REGISTER.md)).
5. **Mission with commercial discipline** — public-benefit commitments are protected and
   do not create ambiguity around commercial authority or investor economics.

## The entity register

Every row carries the same five facts, and the **last column is the one that prevents the
lawsuit**. `scripts/validate_company.py` fails the build if any cell in it is empty.

| Entity | Capital purpose | What an investor owns | Use of proceeds | What investors do NOT own automatically |
|---|---|---|---|---|
| **AGI Future Foundation PBC** | Mission governance, public-benefit initiatives, fellowships, standards, research, scholarships | PBC equity or mission-aligned economic interest, if it raises capital directly | Public-benefit programs, governance, research, impact reporting, approved shared services | Any direct interest in AGI Corp, Locator.X, Cognition.X, Robotics.X or any property vehicle unless expressly documented |
| **AGI Corp** | Parent operating company, shared IP platform, and **founder of Locator.X, Inc.** | Equity or a SAFE / convertible instrument in AGI Corp | Core IP, platform infrastructure, AI and data systems, shared technical teams, security, legal, central operations | Direct ownership of real-estate assets, and any direct interest in Locator.X, Inc.'s separate seed round |
| **Locator.X, Inc.** | **Separate company. Real-estate intelligence, underwriting, acquisition workflow and portfolio analytics — raising its own seed round (Part A)** | Preferred equity or a post-money SAFE in Locator.X, Inc. | The earmarks in [`THE_ASK.md`](THE_ASK.md): record-layer expansion, the collaboration layer, the two unbuilt products, data licences, security, go-to-market, reserve | **Any ownership of, or claim on, any property, any SPV, or any distribution from the Portfolio Basket.** Platform fees and any documented sponsor promote are revenue of the company, not a property interest |
| **Cognition.X** | Education, training, simulation, content and enterprise learning | Parent-company equity, or direct subsidiary equity depending on the round | Learning platform, curriculum, simulation content, customer success, enterprise pilots, integrations | Any direct interest in Locator.X, Inc., property assets or unrelated AGI commercial lines |
| **Robotics.X / AGI Robotics Lab** | Robotics simulation, lab partnerships, hardware pilots, workforce training | AGI Corp equity, dedicated subsidiary equity, equipment financing, grant participation or project financing | Robotics curriculum, simulation environments, leased equipment, labs, integrations, safety programs | Direct ownership of unrelated software or real estate unless expressly included |
| **AGI Development Management, LLC** | Development and asset-management operator | Operating-entity interest where offered | Development management, asset management, project supervision | Ownership of the properties it manages, or equity in any platform company |
| **AGI Property Holdings, LLC** | Holding company for owned properties; **sponsor of the Portfolio Basket** | Holding-company interest where offered | Holding-entity capitalisation, basket sponsorship, reserves | Equity in AGI Corp, Locator.X, Inc., Cognition.X or Robotics.X unless expressly offered |
| **Locator.X Portfolio Basket I, LLC** | **The real-estate bundle (Part B).** Acquisition, renovation, operation, refinance or sale of a defined basket of assets sourced and underwritten on the platform | Membership interests in the Basket, per its operating agreement | The earmarks in [`PORTFOLIO_BASKET.md`](PORTFOLIO_BASKET.md): acquisition equity, renovation, closing costs, reserves, formation, contingency | **Any equity in Locator.X, Inc., AGI Corp or any other group entity.** Basket economics come from the Basket's own assets and from nothing else |
| **Asset-level SPVs** | A single property or property cluster beneath the Basket | Where offered separately: membership interest, preferred equity or a debt note | Purchase price, closing costs, rehab, reserves, debt service, operating expenses | Equity in any platform company, and the assets of any other SPV |

## Ownership architecture

```text
AGI Future Foundation PBC
│
├── Holds defined mission-protection rights
├── Publishes impact reporting
└── Does not manage day-to-day operating decisions
     │
     ▼
AGI Corp  (commercial parent / core IP owner / FOUNDER)
│
├── Cognition.X          (education and workforce platform)
├── Robotics.X           (simulation, labs, robotics readiness)
├── AGI Development Management, LLC
│
├── Locator.X, Inc.  ◀── PART A: raising its own seed round
│     · a separate company, founded by AGI Corp
│     · AGI Corp holds founder equity; seed investors hold the rest
│     · earns platform fees, and a documented promote, from the Basket
│     · owns NO property
│
└── AGI Property Holdings, LLC   (sponsor)
      │
      └── Locator.X Portfolio Basket I, LLC  ◀── PART B: property capital
            │   · separate books, separate bank account, separate investors
            │   · uses the Locator.X platform under a written, arm's-length
            │     services agreement — the tie is CONTRACTUAL, not ownership
            ├── SPV 001
            ├── SPV 002
            └── SPV 003
```

This is the **intended** architecture as supplied by the platform owner. This repository
asserts nothing about formation status, jurisdiction, good standing or the contents of any
operating agreement, because it has not seen those documents. An architecture diagram is a
plan until a certificate says otherwise.

## The one pitch that is never made

The single most damaging thing a group like this can say is that one cheque buys the whole
group. It is also the easiest thing to say by accident, because it is what an enthusiastic
founder actually feels.

**Never:**

> ~~"Invest in AGI and receive exposure to our AI, training, robotics, real estate, and
> foundation portfolio."~~

**Always:**

> "This offering is issued by *[exact entity]*. Proceeds will be used solely for *[approved
> budget]*. The investor receives *[exact security]* in *[exact entity]*. Any ownership,
> licence, revenue-sharing or shared-services relationship with AGI-affiliated entities is
> described in the transaction documents."

`scripts/validate_company.py` lints every markdown file under `docs/` and `content/` for
the first form and fails the build on a match. This protects the investor from confusion
and AGI from the litigation that confusion produces.

## Intercompany relationships are documented, not assumed

Shared IP, shared staff and shared services between these entities are the reason the
group has an advantage, and they are also where hidden economics live. Each relationship
is governed by a written agreement — a **Shared Services Agreement** covering IP licences,
staff allocation, cost sharing, data rights and transfer pricing; a
**Conflict-of-Interest Policy** covering AGI Corp, the PBC, the subsidiaries, founders,
advisors and the property SPVs; and board approval with independent review above a defined
materiality threshold. Related-party transactions appear in investor reporting
([`INVESTOR_REPORTING.md`](INVESTOR_REPORTING.md)) rather than being discovered in
diligence.

## Securities posture

Private placements can be illiquid, high-risk investments, including the possibility of
complete loss; securities may be restricted and difficult to resell ([SEC Office of
Investor Education](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/private)).
Most venture financings must fit an available offering exemption, commonly Regulation D
for accredited investors; under Rule 506(b), if non-accredited investors participate the
issuer must provide specified disclosure and financial information, and general
solicitation is prohibited ([SEC, private placements under Rule
506(b)](https://www.sec.gov/resources-small-businesses/exempt-offerings/private-placements-rule-506b)).

**These citations are recorded as supplied and have not been verified from this
environment** — it has no egress to external hosts, dated in
[`../states/coverage/README.md`](../states/coverage/README.md), the same wall the
county-records work runs into. They are a pointer for counsel, not a legal conclusion, and
nothing in this repository is legal advice. Every offering, instrument and investor
communication requires review by qualified securities, tax, real-estate and fund counsel
before external use ([`FUNDING.md`](FUNDING.md)).
