# Georgia — record coverage (greenfield, portals identified 2026-09-16)

*Status vocabulary: [`README.md`](README.md).*

**How this file was made, and its limit.** Portals identified by **web search from the
development container on 2026-09-16**; no endpoint was reached. Every row is `named`.

Greenfield with measured demand, though the thinnest of the three:
[`EXPANSION.md`](../../EXPANSION.md) ranks 4 submarkets here. It is listed because the
access pattern is already familiar — Georgia's assessor portals run on the **qPublic /
Schneider** platform this project has met before in Louisiana, where
`qpublic.schneidercorp.com` is one of the hosts the egress wall refuses.

## Statewide access pattern

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| — | Per-county assessor portals | Georgia Boards of Assessors directory on qPublic — `qpublic.net/ga/gaassessors/` | named 2026-09-16 |
| — | **Access constraint** | Some qPublic county sites publish limited data as a public service; **fuller property data is behind a paid subscription** | named 2026-09-16 — this is a licensing question before it is a technical one, and it must be settled before a pull, not during one |

## Named counties

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| L/A | Fulton County parcels, real property | qPublic — `qpublic.schneidercorp.com/Application.aspx?App=FultonCountyGA` | named 2026-09-16 |
| L/A | DeKalb County parcels, real property | qPublic — `qpublic.schneidercorp.com/Application.aspx?App=DekalbCountyGA` | named 2026-09-16 |

**Reported by the source, not verified here:** the Fulton portal is described as carrying
assessment information from the last certified tax roll with a data upload dated 4/9/2026.
Repeated once with its origin attached; not a measurement this project has made.

## What the first session should establish

1. **Whether bulk access is permitted at all**, and on what terms. A subscription portal
   is a contract question, and this project does not scrape around one.
2. The value column by name, if bulk access exists.
3. Whether a qPublic county exposes a machine endpoint, or only an interactive search —
   the two are completely different pulls, and the Louisiana experience suggests the
   latter.
