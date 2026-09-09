# State and county programs — the taxonomy and the cross-reference

*Last reviewed: 2026-09. There are 50 states, 3,000+ counties and 19,000+ municipalities;
no list of their programs stays current. What stays true is the **taxonomy** — the kinds of
program that exist at each level — and the **search pattern** that finds each kind in any
jurisdiction. State-specific instances live in the [state guides](../states/README.md); the
federal sources most local programs re-package are in
[`federal-programs.md`](federal-programs.md).*

---

## Contents

1. [The three levels and who runs what](#1-the-three-levels)
2. [State-level program taxonomy](#2-state-level-program-taxonomy)
3. [County/municipal program taxonomy](#3-countymunicipal-program-taxonomy)
4. [The cross-reference: state guide ↔ program type](#4-the-cross-reference)
5. [Search patterns that find any program](#5-search-patterns)
6. [Cross-referencing lenders against programs](#6-cross-referencing-lenders-against-programs)
7. [Underwriting a subsidy honestly](#7-underwriting-a-subsidy-honestly)

---

## 1. The three levels

| Level | Anchor institutions | What they control |
|-------|--------------------|--------------------|
| **State** | HFA (see the [50-state table](../states/README.md#the-50-state-quick-reference)), housing/commerce departments, SHPO, green bank, bond authority | LIHTC QAP, buyer programs, state tax credits, PACE enabling law, disclosure/foreclosure statute |
| **County** | Treasurer/collector (tax sales), assessor, recorder, land bank, housing/community development dept, IDA/EDC | Tax-sale calendar, abatement administration, HOME/CDBG spending where entitlement, landbank inventory |
| **Municipal** | Housing dept, redevelopment agency/CRA, planning & zoning, PHA | Zoning and entitlement, TIF/PILOT deals, inclusionary rules, local abatements, code enforcement |

The same dollar often flows through all three ([federal-programs §8](federal-programs.md#8-how-federal-money-reaches-a-deal)).

## 2. State-level program taxonomy

Every state has some subset; the state entries flag standouts.

- **Homebuyer finance** — HFA first mortgages, DPA seconds/grants, MCC certificates.
  *Every* state has this; the HFA's participating-lender list doubles as a local-lender
  directory ([lenders §10](lenders.md#10-finding-actual-lenders-any-market)).
- **State LIHTC / workforce credits** — ~30 states pair a state credit with the federal;
  Iowa's workforce credit, Missouri's match, Ohio/Arizona's new credits are typical
  shapes.
- **Historic rehabilitation credits** — ~35 states; the strongest (VA and ME at 25%, SC
  mill credits, LA stacking) flip conversion feasibility — flagged per state.
- **Property-tax relief with investor consequences** — homestead exemptions/caps that
  vanish on investor purchase (FL Save Our Homes, SC 4→6%, ID exemption, LA homestead):
  the recompute-the-tax-line rule in every relevant state entry.
- **Renewal/enterprise zone credits** — ND Renaissance Zones, TX Chapter 380/381, NJ
  Aspire, DE DDD rebates.
- **Brownfield/VCP** — liability closure + remediation credits through the state
  environmental agency.
- **Green banks / energy funds & C-PACE** — statute-enabled, district-administered.
- **Disaster/resilience** — LA Fortify, FL My Safe Florida Home, CA wildfire hardening:
  insurance-line reducers where insurance is the crisis.
- **Land programs** — AR Land Commissioner, NM state auctions, school-trust land sales
  in the West.

## 3. County/municipal program taxonomy

- **Abatements & exemptions** — OH CRA, MO 353, MI OPRA/NEZ, WA MFTE, NYC 485-x,
  Philadelphia's abatement, Cook County incentive classes: applied-for, parcel-specific
  changes to the tax line. Always recorded somewhere public — the assessor's exemption
  field is the tell.
- **PILOTs / fee-in-lieu** — negotiated substitutes for taxes (NJ, TN/Memphis, SC
  FILOT): the operating line is a contract, not a millage — read the agreement.
- **TIF districts** — the default local development finance tool (IL/Chicago, NE/Omaha,
  ME, WI); as a buyer, know whether the district's increment claims future levies.
- **Land banks** — MI/OH/NY/MO models: inventory + compliance strings; a genuine
  acquisition channel ([property-data-sources §3](property-data-sources.md#3-distress-and-auction-channels)).
- **Rehab/DPA pools** — HOME/CDBG re-packaged locally
  ([federal-programs §7](federal-programs.md#7-block-grants-that-become-local-programs));
  found via the consolidated plan.
- **Façade/Main Street grants** — commercial-corridor micro-capex; Main Street America
  affiliates administer many.
- **Inclusionary & density bonus rules** — cost *and* opportunity (extra units for
  affordability); the municipal code's zoning chapter.
- **STR licensing regimes** — income-side constraint; the license registry is public
  data (NOLA's is in the state entry).
- **Code-enforcement & receivership programs** — Baltimore V2V, vacant-property
  registration fees: both a cost (fees) and a pipeline (receivership sales).

## 4. The cross-reference

Program types ↔ where the [state guides](../states/README.md) flag a strong instance.
(Not exhaustive — the guides carry the detail; this is the index by type.)

| Program type | Flagged in |
|--------------|-----------|
| Conversion-driving historic/mill credits | [LA](../states/south-central.md#louisiana), [VA](../states/southeast.md#virginia), [SC](../states/southeast.md#south-carolina), [ME](../states/northeast.md#maine), [MD](../states/southeast.md#maryland), [OH](../states/midwest.md#ohio), [WI](../states/midwest.md#wisconsin) |
| Rehab-abatement regimes | [LA (RTA)](../states/south-central.md#louisiana), [MO (353)](../states/midwest.md#missouri), [MI (OPRA/NEZ)](../states/midwest.md#michigan), [OH (CRA)](../states/midwest.md#ohio), [WA (MFTE)](../states/pacific.md#washington), [NYC (485-x)](../states/northeast.md#new-york), [PA (LERTA)](../states/northeast.md#pennsylvania), [DE (DDD)](../states/southeast.md#delaware), [ND (Renaissance)](../states/midwest.md#north-dakota) |
| Landbank acquisition channels | [MI](../states/midwest.md#michigan), [OH](../states/midwest.md#ohio), [MO/STL](../states/midwest.md#missouri), [IL/Cook](../states/midwest.md#illinois), [MD/Baltimore](../states/southeast.md#maryland) |
| Centralized state distress feeds | [AR](../states/south-central.md#arkansas), [NM](../states/mountain-west.md#new-mexico), [WV](../states/southeast.md#west-virginia), [ME (municipal)](../states/northeast.md#maine) |
| Investor tax-ratio traps (recompute the tax line) | [SC](../states/southeast.md#south-carolina), [FL](../states/southeast.md#florida), [CA (reset on sale)](../states/pacific.md#california), [OR (never resets)](../states/pacific.md#oregon), [ID](../states/mountain-west.md#idaho), [MN](../states/midwest.md#minnesota) |
| Negotiated PILOT/FILOT markets | [NJ](../states/northeast.md#new-jersey), [TN/Memphis](../states/south-central.md#tennessee), [SC](../states/southeast.md#south-carolina), [TX (PFC/HFC)](../states/south-central.md#texas) |
| Entitlement-reform tailwinds | [CA (SB9/35, density bonus)](../states/pacific.md#california), [OR (HB 2001)](../states/pacific.md#oregon), [MN (2040)](../states/midwest.md#minnesota), [MT (2023 package)](../states/mountain-west.md#montana), [UT (station areas)](../states/mountain-west.md#utah), [MA (40B)](../states/northeast.md#massachusetts), [FL (Live Local)](../states/southeast.md#florida) |
| Insurance-crisis programs | [LA (Fortify)](../states/south-central.md#louisiana), [FL (My Safe FL Home)](../states/southeast.md#florida), [CA wildfire](../states/pacific.md#california) |
| Tenant-rights underwriting events | [DC (TOPA)](../states/southeast.md#district-of-columbia), [NY (HSTPA)](../states/northeast.md#new-york), [CA (AB 1482 + local)](../states/pacific.md#california), [OR (SB 608)](../states/pacific.md#oregon), [WA (just cause)](../states/pacific.md#washington) |

## 5. Search patterns

The patterns that find any jurisdiction's version of each type — these outlive every list:

| Looking for | Pattern |
|-------------|---------|
| Everything the county funds | `"<county>" consolidated plan site:*.gov` — the HUD-mandated plan names every program and administrator ([why](federal-programs.md#7-block-grants-that-become-local-programs)) |
| Tax sale calendar & rules | `"<county>" treasurer tax sale` (collector/tax-claim bureau in PA; sheriff in some states — the state entry names the office) |
| Delinquency lists | Treasurer's site; state-centralized in AR/NM/WV |
| Abatement programs | `"<city>" tax abatement property` + the assessor's exemption codes |
| The QAP (affordable pipeline logic) | `"<state>" QAP qualified allocation plan <year>` |
| Buyer programs | The HFA's site (named per state in the [quick reference](../states/README.md#the-50-state-quick-reference)); HUD's per-state homebuying pages aggregate local DPA |
| Historic credit rules | `"<state>" SHPO rehabilitation tax credit` |
| Brownfields | `"<state>" voluntary cleanup program` |
| Zoning/entitlement | The municipality's code on Municode/American Legal/General Code — then the zoning map layer ([property-data-sources §2](property-data-sources.md#2-public-record-and-bulk-data)) |
| Landbank inventory | `"<county OR city>" land bank properties` |
| STR rules | `"<city>" short-term rental ordinance license` |

## 6. Cross-referencing lenders against programs

Programs and lenders are one system — match them deliberately:

- **HFA programs** ride on the HFA's **participating lender list** — the program picks
  the lender for you.
- **LIHTC deals** need the QAP score *and* a construction/perm stack that closes on the
  credit calendar — the [agency/HUD shops](lenders.md#3-agency-and-government-multifamily)
  live on this.
- **Abatement/PILOT deals**: the lender underwrites the *abated* tax line and its
  expiry cliff — bring the agreement, not the assessor's card.
- **C-PACE** requires mortgage-lender consent — raise it at term sheet, not at closing.
- **Landbank purchases** often exclude conventional financing timelines (compliance
  deadlines) — CDFIs and hard money bridge them
  ([lenders §6, §8](lenders.md#6-private-hard-money-and-creative)).
- **Assumable federal loans** (FHA/VA/USDA) are found in the recorder's index — a
  program fact discovered through a data source, which is the whole method.

## 7. Underwriting a subsidy honestly

The platform's rules applied to programs — because subsidies are where pro formas lie
most fluently:

1. **A program is a cash flow with a counterparty and an expiry**, not a discount.
   Model the cliff year explicitly (abatement expiries, HAP renewals, MFTE terms).
2. **Name the approval gate and its owner.** An un-awarded credit is a lottery ticket;
   feasibility ([D4](../../curriculum/courses/06-development-delivery.md)) runs on the
   as-of-right case with the award as upside — never the reverse.
3. **The zone doesn't fix the building.** OZ/zone benefits change the investor's taxes,
   not the asset test ([F2](../../curriculum/courses/02-foundations.md)).
4. **Record what you ruled out.** "Checked the consolidated plan, no applicable pool
   this cycle" is a memo line — the R gate treats absence as evidence too.
5. **Compliance is an operating cost.** Set-asides, reporting, prevailing wages —
   price the strings ([o-track operations lessons](../../curriculum/courses/04-the-asset.md)).
