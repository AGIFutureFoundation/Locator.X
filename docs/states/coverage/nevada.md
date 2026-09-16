# Nevada — record coverage (greenfield, portals identified 2026-09-16)

*Status vocabulary: [`README.md`](README.md).*

**How this file was made, and its limit.** Portals identified by **web search from the
development container on 2026-09-16**; no endpoint was reached. Every row is `named`.
Nothing here describes the contents of any dataset.

Greenfield with measured demand: [`EXPANSION.md`](../../EXPANSION.md) ranks 17 submarkets
in this state. Unlike Wisconsin there is no statewide aggregation identified — Nevada
looks like a two-county job, which is fortunate, because two counties hold most of the
state's population.

## Clark County (Las Vegas)

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| L/A | Parcels, geometry, attributes | Clark County GIS open-data hub — `clarkcountygis-ccgismo.hub.arcgis.com` | named 2026-09-16 (identified by search; endpoint not reached) |
| — | Machine access | The hub is described as offering GeoServices, WMS and WFS endpoints alongside CSV / GeoJSON download | named 2026-09-16 — an ArcGIS hub implies the `/query` + `?f=json` pattern this project already uses elsewhere |

## Washoe County (Reno)

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| L/A | Countywide parcel layer | Washoe Open Data — `explore-washoe.opendata.arcgis.com/datasets/parcels` | named 2026-09-16 |
| O | Assessor mapping and parcel maintenance | Washoe County Assessor mapping office — `washoecounty.gov/assessor/Mapping/` | named 2026-09-16 |
| L | Bulk GIS downloads | Washoe County GIS data warehouse — `washoecounty.gov/gis/data_warehouse.php` | named 2026-09-16 |

## What the first session should establish

1. **The value column, by name**, in both counties — the same question that decides
   whether a market can be ranked at all.
2. Whether recorded sale prices are published. Nevada's disclosure practice is not
   established in this repository and is not assumed here.
3. Whether the two county schemas agree well enough to share one crosswalk entry, or
   need two.
