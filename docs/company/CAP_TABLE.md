# Cap-table planning

**Illustrative planning model. Not legal, tax or investment advice, and not a
representation of any actual capitalisation.** Every figure below is a **management
target** — a planning range chosen by the platform owner, not a measurement and not a
commitment. No security has been issued on the strength of anything on this page.

## Pre-seed planning ranges

| Ownership category | Before pre-seed | After a $2M–$2.5M pre-seed | Note |
|---|---:|---:|---|
| Founders and core early team | 80%–90% | 60%–75% | Enough ownership left for long-term incentives and future rounds |
| Employee option pool | 10%–15% | 10%–15% | Reserve only what the next 12–18 months of hiring needs |
| Pre-seed investors and SAFE holders | 0%–10% | 15%–25% | Depends on cap, discount, SAFE stack and round size |
| Advisors | 0%–3% | 1%–3% | Restricted, vesting-based grants only |
| Foundation mission rights | Usually non-economic, or a small economic stake | Defined by charter and agreements | Governance rights used carefully; **no hidden economic overhang** |
| Future seed reserve | Not issued | Plan for a further 15%–25% dilution | Model this *before* setting early terms, not after |

## The mistakes that are expensive to reverse

Each of these is cheap to avoid now and costly or impossible to unwind later. That
asymmetry is why they are written down before the first instrument is signed.

1. **Multiple SAFEs with inconsistent caps, discounts, MFN clauses, side letters and
   pro-rata rights.** The single most common reason a seed round stalls in diligence.
2. **Advisor equity without vesting, deliverables or IP assignment.**
3. **An oversized option pool granted before the hiring plan exists.**
4. **Failing to model conversion of every SAFE, note, option, warrant and founder share on
   a fully diluted basis** — the number that matters is never the one on the common-stock
   line.
5. **Mixing PBC mission voting rights with vague economic rights.** Mission rights are
   governance; if they carry economics, both must be stated explicitly
   ([`MISSION_RIGHTS.md`](MISSION_RIGHTS.md)).
6. **Giving property investors an unclear claim on AGI Corp's operating-company IP.**
7. **Cross-collateralising real-estate SPVs with the operating company** without explicit
   board and investor approval. This one can take the platform down with a building.
8. **Using grant funds for activities the grant agreement does not permit.**
9. **Promising future liquidity, distributions, yields or return outcomes.** Enforced by
   the language lint in `scripts/validate_company.py`, not by memory.

## Terms a priced seed round will ask for

| Term | What the investor is protecting | A founder-workable position |
|---|---|---|
| 1x non-participating liquidation preference | Capital returned ahead of common in a weak exit | Standard and generally acceptable; resist participating preferred |
| Pro-rata right | Ability to maintain ownership in later rounds | Offer to major investors above a defined threshold |
| Information rights | Visibility into financial and operating performance | Quarterly reporting to major investors; protect confidential customer and data information |
| Board seat or observer | Governance visibility and influence | Start with an observer or one lead-investor seat; keep the board small |
| Protective provisions | Consent over extraordinary actions | Limit to charter changes, senior securities, sale, liquidation, large debt, option-pool expansion |
| Founder vesting | Founder commitment | Four years with a one-year cliff; credit service already given where appropriate |
| Option pool | Hiring capacity | Model the dilution before agreeing the size |
| Right of first refusal and co-sale | Orderly ownership transfers | Standard, but should not block legitimate founder liquidity without reason |
| Drag-along | Ability to complete an approved sale | Include protective thresholds, and address PBC mission considerations in the charter |

### Additions specific to a PBC

The six governing documents listed in [`MISSION_RIGHTS.md`](MISSION_RIGHTS.md) — the
Mission Rights Agreement, Conflict-of-Interest Policy, Shared Services Agreement, Public
Benefit Reporting Policy, Independent Director Policy and Mission-Safe Exit Protocol —
exist to remove ambiguity from exactly these negotiations. **None of the six exists yet.**
An investor asking for them is asking a reasonable question, and the honest answer today
is that they are specified and unwritten.
