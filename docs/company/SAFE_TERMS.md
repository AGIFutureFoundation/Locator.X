# The SAFE, done to industry standard

The pre-seed instrument in [`INSTRUMENTS.md`](INSTRUMENTS.md) is a post-money SAFE issued
by AGI Corp. This page is the recommendation in detail: which form, which terms, which
combinations to refuse, and the housekeeping that decides whether the seed round closes
smoothly or spends six weeks in diligence.

**A management recommendation, not legal advice and not an offer.** Counsel drafts and
approves every instrument before use.

## Use one form, unmodified

**Recommendation: the Y Combinator post-money SAFE, valuation cap only, unmodified.**

The single strongest predictor of a clean seed round is that every pre-seed instrument is
the same document with one number changed. The moment two SAFEs differ in structure rather
than in amount, the cap table stops being computable in a spreadsheet and starts requiring
a lawyer and a week.

| Decision | Recommendation | Why |
|---|---|---|
| Form | YC post-money SAFE | The market default; investors recognise it and do not re-paper it |
| Cap or discount | **Cap only** | A cap alone is legible. Cap-and-discount makes every conversion a two-branch calculation, and the benefit to the investor is small |
| MFN | Avoid in the priced instrument | MFN on top of a cap means the terms are unknown until the last SAFE signs. Use only for a genuinely uncapped early cheque |
| Pro rata | Side letter, above a minimum cheque | Keeps it out of the SAFE itself and limits it to investors who will actually exercise |
| Discount stacking | Refuse | Cap + discount + MFN + side rights in one instrument is the classic unfinanceable pre-seed |
| Side letters | Track every one | An untracked side letter is discovered at the Series A, by the buyer's counsel |

A SAFE is an agreement under which the company promises a future ownership interest on a
triggering event such as a future equity financing or an acquisition. Unlike convertible
notes, SAFEs generally carry no maturity date, do not accrue interest, and create no
creditor rights ([SEC, common startup
securities](https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/common-startup-securities)).
**Recorded as supplied and not verified from this environment**, which has no egress; a
pointer for counsel, not a legal conclusion.

## Post-money versus pre-money, and why it matters here

A post-money SAFE fixes the investor's percentage of the company at conversion. A
pre-money SAFE does not: each additional SAFE dilutes the earlier ones, and founders
routinely discover at the priced round that they sold more than they thought.

The post-money form moves that uncertainty onto the founder, where it belongs, because the
founder is the party who controls how many SAFEs get signed. **The consequence is that the
SAFE stack must be modelled before each new instrument, not after the last one.** That is
a discipline, not a formality: every SAFE signed is a percentage of the company sold at a
price set today.

## What to model before signing anything

For every prospective instrument, on a fully diluted basis:

1. Conversion of **every** outstanding SAFE at its own cap
2. The option pool, including the increase a Series A investor will require **before** the
   round prices — the pool shuffle that founders consistently forget
3. Warrants, advisor grants and any promised-but-unissued equity
4. Founder shares and their vesting state
5. The resulting founder ownership after the next round, not this one

If the founder ownership after a modelled Series A falls below what is needed to keep the
team motivated for another five years, the pre-seed terms are wrong, and it is far cheaper
to learn that now. [`CAP_TABLE.md`](CAP_TABLE.md) holds the planning ranges.

## Offering mechanics

| Item | Standard practice | Note for AGI Corp |
|---|---|---|
| Exemption | Regulation D, typically Rule 506(b) for accredited investors | Under Rule 506(b) **general solicitation is prohibited**, and if non-accredited investors participate the issuer must provide specified disclosure and financial information ([SEC](https://www.sec.gov/resources-small-businesses/exempt-offerings/private-placements-rule-506b)) |
| Investor status | Accredited-investor process before signature | Counsel specifies the method; 506(b) relies on reasonable belief, 506(c) requires verification and permits solicitation |
| Federal filing | Form D, generally within 15 days of first sale | Counsel files |
| State filings | Blue-sky notice filings where required | Driven by investor residence |
| Materials | One deck, one memo, one data room, version-controlled | The deck in `content/investor/` is built from measured figures and dated |
| Communications | Directed to known contacts; nothing broadcast | A public post about an open round is the thing 506(b) forbids |

**This is why the deck's call to action requests a diligence conversation rather than
announcing an open round.** It is not timidity; it is the difference between a private
placement and a general solicitation, and the exemption depends on it.

## Housekeeping that decides the Series A

Investor counsel will ask for all of this. Having it ready is worth more than a better
cap, because it is the difference between a two-week close and a two-month one.

- [ ] Delaware incorporation in good standing, with the PBC charter and public benefit stated
- [ ] Founder IP assignment signed by **every** founder and early contributor
- [ ] Contractor and employee IP assignment, including anyone who wrote code before incorporation
- [ ] Founder vesting in place, with any credit for prior service documented
- [ ] 83(b) elections filed and receipts retained
- [ ] Board consents for every issuance, with a complete minute book
- [ ] An equity plan adopted, with the reserve sized to the hiring plan
- [ ] A cap-table system of record, not a spreadsheet emailed between people
- [ ] Every side letter filed with the instrument it modifies
- [ ] The six governing documents in [`MISSION_RIGHTS.md`](MISSION_RIGHTS.md)
- [ ] Intercompany agreements per [`CAPITAL_STRUCTURE.md`](CAPITAL_STRUCTURE.md)

**Most of this list does not exist yet.** It is a checklist, published so the gaps are
tracked rather than discovered, and so the work happens before a term sheet rather than
during one.

## The PBC-specific item most founders miss

A Delaware PBC board must balance stockholder economic interests, the interests of those
materially affected, and the chartered public benefit ([Delaware Code title 8, ch. 1,
subch. XV](https://delcode.delaware.gov/title8/c001/sc15/) — recorded as supplied, not
verified here). Institutional investors will ask what that means for an exit.

The answer must exist in writing **before** the conversation: the Mission-Safe Exit
Protocol in [`MISSION_RIGHTS.md`](MISSION_RIGHTS.md). An investor who asks how mission
rights behave in a change of control and receives an improvised answer has learned
something about the company that no deck will correct.

## What is never done, whatever the instrument

The boundaries in [`FUNDING.md`](FUNDING.md) apply to every SAFE conversation, email, deck
and data-room document: no return stated as guaranteed, no projection presented as fact,
no fund terms presented as agreed, no offering pitched as exposure across the group, and
never an implication that an interest in AGI Corp carries economics in a property SPV or
another subsidiary. `scripts/validate_company.py` lints this repository for all of it.
