# Wisconsin — record coverage (greenfield, portals identified 2026-09-16)

*Status vocabulary: [`README.md`](README.md).*

**How this file was made, and its limit.** Every portal below was identified by **web
search from the development container on 2026-09-16**. Not one endpoint was reached: the
egress wall dated in [`README.md`](README.md) refused every data host tried, through both
`curl` and the fetch tool, and the agent proxy reported zero relay failures of its own —
the denial is upstream policy, not a misconfiguration. So every row is `named`, which is
exactly what `named` means in this project: *the office and portal are identified; no pull
yet.* Nothing here describes what the data contains, because nobody here has seen it.

**Why Wisconsin, ahead of states already inventoried.** It is greenfield with measured
demand: [`EXPANSION.md`](../../EXPANSION.md) ranks 22 submarkets here and the
**highest-scoring ZIP in the whole index** sits in this state. It also appears to be the
rare state with a *statewide* aggregated parcel layer, which if it holds would make it the
cheapest full-state edition in the catalogue.

## Statewide

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| L/A | Statewide parcel geometry, use and value attributes | Wisconsin State Cartographer's Office, Statewide Parcel Map Initiative data page — `sco.wisc.edu/parcels/data/` | named 2026-09-16 (identified by search; endpoint not reached) |
| L | Per-county parcel downloads (shapefile / file geodatabase) | SCO county data page — `sco.wisc.edu/parcels/data-county/` | named 2026-09-16 |
| — | Schema and field definitions | V10 schema documentation published by SCO | named 2026-09-16 — **read this before the pull**; the field list decides whether a value column exists, which is the gap that stopped four other states |
| — | Aggregation method and caveats | V10 Final Report, Wisconsin Department of Administration — `doa.wi.gov` | named 2026-09-16 |

**Reported by the source, not verified here:** the V10 aggregation is described as covering
roughly 3.56 million parcels in a file of roughly 1.6 GB. Those are the publisher's
figures repeated once, with their origin attached, and they are **not** a measurement this
project has made. The count query in [`../../PULL_RECIPE.md`](../../PULL_RECIPE.md) is what
turns them into one.

## What the first session should establish

1. **Does a VALUE column exist, and what is it called?** This is the question that
   determines whether Wisconsin can be ranked at all — four states already in the
   inventory carry no declared value field, and `scripts/crosscheck_sources.py` fails the
   build when the inventory claims a value the crosswalk cannot rank on.
2. Whether the statewide layer is genuinely uniform or a union of county schemas wearing
   one name. A "statewide" file whose columns vary by county is a per-county pull with
   extra steps, and the schema documentation should say which it is.
3. Whether recorded sale prices are present. Wisconsin's disclosure practice is not
   established in this repository and must not be assumed in either direction.
