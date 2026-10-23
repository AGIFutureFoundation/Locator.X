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

## Open

### Lesson figures are typed, not resolved (measured 2026-10-23)

Articles resolve every figure from `market/*.json` at build time; lessons do not. Measured
by counting percentage literals (`grep -oE '[0-9]+(\.[0-9]+)?%'`) in the lesson sources:
`src/academy.js` 30, `src/devcourse.js` 17, `curriculum/curriculum.py` 6,
`src/datacourse.js` 4, `src/widercourse.js` 4, `src/pmcourse.js` 3, `src/eqcourse.js` 1 —
**65 in all**, plus figures written as words, which this count cannot see. Most are worked
examples ("a 31% IRR on nine months"), which are teaching devices rather than market
claims, but nothing currently tells the two apart. The product whitepaper claimed every
lesson figure was measured; that sentence was narrowed to articles in the same change that
opened this entry (found by the 2026-10-23 doctrine review).

**Cost of leaving it:** a lesson can state a market figure ("under 4% here") that drifts
from the measured layer with no gate noticing. **Fix:** mark worked examples explicitly
and route every market-shaped figure through the same placeholder resolver the articles use.

## Closed

The one entry this file was created with — a rent-blind market
labelling records "Liability at this price" on a `price × 0.004` rule of thumb — was
closed by the `unrated` category state: the absence of a verdict rather than a sixth kind
of property, muted rather than given a sixth hue (five is already at the colour-blind
ceiling that `src/palette.js` documents), and off by default in the buy box because
nothing should rank on it.

**The guard**: `tests/fleet_smoke.js` asserts, on the `norent` fleet edition, that no
record is categorised `liab` where the market publishes no rent, that the absence is
visible as `unrated`, and — the other direction — that nothing is `unrated` in a market
that does publish rent, so the state cannot leak beyond the case it exists for. Measured
on that edition: 1,986 `unrated`, 514 `value` on their record-derived score, **zero**
`liab`. On `bay`, where rent is published, the categories are unchanged and nothing is
`unrated`. Break-tested — removing the state fails `norent`, and only `norent`.

An empty register is the honest state to leave this in, not a reason to delete the file:
the next measured-but-unfixed defect goes here rather than into a commit message nobody
re-reads.
