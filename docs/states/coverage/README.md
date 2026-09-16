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

**The sum of every row below is in [`ROLLUP.md`](ROLLUP.md)** — generated from these
files, never hand-written. Each file states its own coverage honestly; the roll-up
states the total, which is the one number none of them could give.

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
| Nebraska *(wave two, opened early by Foundation direction)* | Omaha + wider Nebraska as asset-class expansion candidates — anchors named, probes defined | [`nebraska.md`](nebraska.md) |

## Graduated corridor states

The corridor pulls of 2026-09-04/05 are now per-state inventories — every row measured
and cited to [`PULL_RECIPE.md`](../../PULL_RECIPE.md), including the field-reliability
verdicts (the deep-assessment layer: which value, area, year and unit fields actually
work, and which are documented traps):

| State | Measured counties | File |
|-------|-------------------|------|
| North Carolina | Wake, Guilford, Chatham | [`north-carolina.md`](north-carolina.md) |
| Ohio | Franklin, Mahoning (+ Trumbull `blocked`) | [`ohio.md`](ohio.md) |
| Indiana | Marion, Tippecanoe | [`indiana.md`](indiana.md) |
| Utah | Utah County | [`utah.md`](utah.md) |
| Georgia *(greenfield — portals identified 2026-09-16, nothing pulled)* | Fulton, DeKalb via qPublic | [`georgia.md`](georgia.md) |
| Nevada *(greenfield — portals identified 2026-09-16, nothing pulled)* | Clark, Washoe | [`nevada.md`](nevada.md) |
| Wisconsin *(greenfield — portals identified 2026-09-16, nothing pulled)* | Statewide parcel layer | [`wisconsin.md`](wisconsin.md) |
| Arizona | Maricopa | [`arizona.md`](arizona.md) |
| New Mexico | Bernalillo, Sandoval | [`new-mexico.md`](new-mexico.md) |
| New York | Onondaga (NYC `named`) | [`new-york.md`](new-york.md) |

## Egress routes, dated

- **Container `curl`** — county GIS/open-data hosts blocked as a class (CONNECT 403,
  verified 2026-09-09 across six Louisiana hosts and the FL DOR).
- **WebFetch (API-side fetch)** — probed 2026-09-10 against the known-good Bernalillo
  endpoint and re-tested 2026-09-16 against `data.nola.gov` and `www.census.gov`:
  **blocked by the same egress policy**, which returns an explicit `EGRESS_BLOCKED` for
  the domain. The agent proxy itself reports zero relay failures and full CA coverage, so
  the refusal is upstream organisation policy and not a trust or configuration problem —
  the proxy README is explicit that such denials are reported, never retried.
- **Web search** — re-tested 2026-09-16 and it **works**, which is the one thing in this
  section that is not a wall. It returns titles, URLs and publisher summaries; it does not
  return data. That is precisely enough to move a row from *nothing* to `named`, because
  `named` means the office and portal are identified — and it is the route by which the
  Georgia, Nevada and Wisconsin inventories were written without reaching a single
  endpoint. It can never advance a row past `named`: a portal identified is not a field
  list, a record count, or a value column, and this project does not let a search summary
  stand in for a pull.
- **Desktop browser pane** — the proven route ([`PULL_RECIPE.md`](../../PULL_RECIPE.md));
  all `named` probes queue behind a desktop session.

**The boundary, stated once.** An agent session can identify offices, portals and access
constraints, and can write an inventory honestly labelled `named`. It cannot count a
parcel, read a field list, or fill a value column. Everything past `named` needs the
desktop route, and a session that blurs the two has fabricated a pull.

## How a row is filled

1. Name the gate's question and the office that answers it (from the
   [state guide](../README.md)).
2. Probe the source (count query first — the pull recipe's step 3 — never a blind pull).
3. Record what came back **including the disappointments**: a 0%-populated field, a
   six-year-stale sales layer, a wrong-server conclusion. The pull recipe's additions log
   shows the format — the negative findings are the valuable ones.
4. Date the row. An undated status is treated as `named`.
