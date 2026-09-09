# Record-coverage inventories — v1.1 wave one

The deepening pass promised in [roadmap §4](../../ROADMAP.md#4-v11--the-state-layer-wave-one):
for each wave state, a table of **which of the seven LOCATOR gates the public record can
actually answer, jurisdiction by jurisdiction** — the same honesty the Comps desk already
applies to Orleans and EBR, written down as inventory.

**The rule: no row without a source, no status without a date.** Where a feed has actually
been pulled, the row cites where that pull is documented
([`PULL_RECIPE.md`](../../PULL_RECIPE.md), the shipped editions). Where it has only been
*named*, the row says `pending` — that is an unknown held honestly, not a gap papered over.
"Named" means the office and portal are identified in the [state guide](../README.md);
"pulled" means rows came back and their quirks are recorded; "shipped" means the feed is
packed into a built edition and survived the fleet sweep.

## Status vocabulary

| Status | Meaning | What it takes to advance |
|--------|---------|--------------------------|
| `shipped YYYY-MM` | In a built edition; fleet-sweep verified | — |
| `pulled YYYY-MM` | Rows retrieved; field quirks documented in the pull recipe | Pack + sweep |
| `named` | Office/portal identified in the state guide; no pull yet | A probe pull with findings recorded |
| `blocked (reason)` | Attempted and refused (egress, tokens, paywall) — dated | A new route; the reason is the finding |
| `no public record` | The state/county does not publish it (e.g. sale prices in non-disclosure states) | Nothing — the ceiling is real; say so |

## Wave one states

| State | Why this wave | File |
|-------|---------------|------|
| Louisiana | Anchor market — `nola`, `atlas_nola`, `launi` editions ship from these feeds | [`louisiana.md`](louisiana.md) |
| California | Anchor market — `bay-ledger`, `atlas_bay` editions ship from these feeds | [`california.md`](california.md) |
| Florida | New wave state, chosen by data availability: the DOR statewide assessment rolls (NAL/SDF) are the best bulk entry point of any large state | [`florida.md`](florida.md) |

Corridor counties already pulled and documented outside the wave states (Wake NC,
Tippecanoe IN, Utah UT, Mahoning OH, Bernalillo NM, Maricopa AZ, Onondaga NY, …) keep
their findings in [`PULL_RECIPE.md`](../../PULL_RECIPE.md); they graduate into per-state
inventories when their states enter a wave.

## How a row is filled

1. Name the gate's question and the office that answers it (from the
   [state guide](../README.md)).
2. Probe the source (count query first — the pull recipe's step 3 — never a blind pull).
3. Record what came back **including the disappointments**: a 0%-populated field, a
   six-year-stale sales layer, a wrong-server conclusion. The pull recipe's additions log
   shows the format — the negative findings are the valuable ones.
4. Date the row. An undated status is treated as `named`.
