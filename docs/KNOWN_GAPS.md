# Known gaps — measured defects that are not fixed yet

This repository is strict about honest statuses everywhere else. Coverage rows carry
`named` / `blocked` / `no public record`. The strategy switchboard separates `blocked`
from `n/a`. The coverage panel refuses to print a percentage under its sample floor. But
there was nowhere to record the third status a **defect** can have — known, measured, and
deliberately not fixed yet — so a finding either got fixed in the round that found it or
survived only in a commit message nobody re-reads.

That is the gap this file closes. It is not a wish list and not a backlog of ideas.

**The rule for an entry here.** Every row is a defect that has been *measured*, with the
measurement written down, and a stated reason it is not fixed. "Not fixed" is a decision
with a cost, and the cost is named. An entry that cannot state how it was measured does
not belong here — that is a hunch, and hunches go in a commit message or nowhere.

**Removing an entry** means the defect is fixed and something gates it. Delete the row in
the same change that fixes it, and name the guard in the commit.

---

## 1. A rent-blind market still labels records "Liability"

**Measured.** 2026-09-16, on the `norent` fleet edition (the `bay` fixture with every rent
series removed, so exactly one variable changes). All 2,500 records return
`LX.rentEstimate(l).basis === 'none'` — the `price × 0.004` rule of thumb — and any record
whose value-add score is below 40 falls through the category chain in `src/dashboard.js`
to `cat='liab'`, rendered as **Liability**.

**Why it is wrong.** Every branch above that fall-through is a rent question: `asset`
tests `d.cf>0`, `hack` and `growth` test `d.dscr`, and all of those descend from the rule
of thumb where `d.rentBasis === 'none'`. So the app tells the user a property is a
liability on the strength of a rent nobody measured. "Cannot be categorised without a rent
feed" and "is a liability" are different findings, and this is the conflation
`src/switchboard.js` exists to prevent one layer down.

**How much of the footprint.** Rent is never public record. Of the fourteen markets this
repository has measured, **eight publish none** — see
[`EXPANSION.md`](EXPANSION.md) and `scripts/standard_feasibility.py --check`. This is the
common case, not a corner.

**What is already fixed.** PR #93: `rentEstimate` declares its basis, `deal()` carries it,
the buy box's rent-derived floors refuse a baseless rent and the funnel says why, and the
record-derived value-add play was ungated from a fabricated DSCR. Then the LOCATOR screen
(`src/locator.js`), which had the *same* defect on the teaching surface — its asset-test
gate returned "Liability · well documented, and it takes money out of your pocket" about a
building with no rent — now returns `Unproven` and says the rent is not documented. Its
cash-flow and ownership-economics gates refuse too.

**So this entry is now specifically the dashboard's category chain**, which is the last
place the word "Liability" is still applied to a record whose rent was invented. The
LOCATOR fix is the template: each of those gates already had the right words and simply
never reached them, whereas the category chain has no honest state to reach.

**Why it is not fixed.** An honest answer needs a sixth category state threaded through
`CATS`/`CAT` in `src/dashboard.js`, the persisted `cats` object in `DEF_BB` in
`src/underwrite.js` (localStorage, so an older saved buy box will lack the key), the
buy-box chips, and the fixed-order categorical hues in `src/palette.js`. That is wider
than the change that found it should have been, and half a category state is worse than
none.

**The cost of leaving it.** In a rent-blind market — the majority of the measured
footprint — the app makes a confident negative claim about a building it has no rent for.
That is the same class of error as a fabricated number, wearing a label instead of a
figure.

**When it is fixed**, `tests/fleet_smoke.js` must assert that no record in a rent-blind
edition is labelled Liability purely for want of rent, and that assertion must be
break-tested: remove the new state and confirm it fails on `norent` and only `norent`.
