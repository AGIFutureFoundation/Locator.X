# The worksheet JSON contract — desk ↔ app interop

One record format lets an analysis travel between the three underwriting
surfaces without ever laundering a number. This page is the contract; the
implementations are [`pages/locator-x-underwriting-worksheet.html`](../pages/locator-x-underwriting-worksheet.html)
(export + import), [`src/deskws.js`](../src/deskws.js) (the app's read-only
Desk-worksheet panel), and `LXUW.deskRecord` in
[`src/underwrite.js`](../src/underwrite.js) (the app's own export).

## The shape

```json
{
  "worksheet": "Locator.X per-class underwriting",
  "asset_class": "Apartments 5+",
  "generated": "2026-09-10T18:22:01.000Z",
  "exported_from": "the record-driven Underwriting tab — 108 Placeholder Blvd, Fixtureton",
  "inputs":  { "units": 20, "rentUnit": 1000, "otherInc": null, "vacancy": 5,
               "opexPct": 40, "taxes": 20000, "insurance": null,
               "loan": 1500000, "rate": 7, "amort": 30 },
  "sources": { "Property taxes": "public record — the county tax collector’s bill …" },
  "provenance": { "Insurance — quoted": "LEFT BLANK on purpose — …" },
  "outputs": { "effective_income": 228000, "operating_expenses": null,
               "noi": null, "annual_debt_service": 119754, "dscr": null,
               "missing_required": ["Insurance — quoted"] },
  "disclaimer": "Education, not advice; not a valuation. …"
}
```

| Field | Required | Meaning |
|---|---|---|
| `worksheet` | yes | The literal marker `"Locator.X per-class underwriting"`. Every consumer rejects a file without it, out loud. |
| `asset_class` | yes | The display name of a class the worksheet defines (`Apartments 5+`, `Small multifamily`, `Hotels`, `Student housing`). Import refuses an unknown class by name. |
| `generated` | yes | ISO timestamp of the export. |
| `inputs` | yes | Keyed by the worksheet's **field ids**. `null` means blank — and blank means **unknown**, never zero. Values are restored exactly as typed. |
| `outputs` | yes | The worksheet arithmetic over `inputs`, including `missing_required`: the labels of required fields left blank. A blank load-bearing input makes every dependent output `null`. |
| `disclaimer` | yes | Travels with the record; renderers display it. |
| `exported_from` | no | Where the record came from (the app names the property; the worksheet omits it). |
| `sources` | no | Field label → where its answer lives, in the four kinds below. |
| `provenance` | no | Field label → how *this exporter* derived the value ("an offer, not a record", "not a rent roll"). The app's export always includes it. |

**Versioning is additive.** New keys may appear; consumers ignore keys they do
not know and render older exports without them. No key ever changes meaning.

## The four kinds — where a number lives

Every input's answer has an address in exactly one kind (taught in full by the
applied-courses evidence track, lesson 9):

- **public record** — an agency publishes it; anyone can re-pull it (assessor
  parcel, tax bill).
- **document** — it exists but must be produced (rent roll, T-12, STR report).
  Rents and occupancy are never public record.
- **quote / term sheet** — a live offer that expires (insurance premium, loan
  terms). An offer is not a fact about the world.
- **measurement** — take it yourself (the campus-ring walk).

## The rule that is never bent: no laundering

A number must not migrate to a stronger kind silently. The load-bearing
consequence in this contract: **the app's export leaves `inputs.insurance`
null on purpose** — the app carries a cost-model *estimate*, the worksheet
field demands a written *quote*, and writing one into the other would launder
a guess. The exported `outputs.dscr` is therefore `null` until a real quote is
typed at the desk, and `provenance` says exactly why. Symmetrically, the app's
Desk-worksheet panel renders imported desk numbers **read-only** and labeled
typed-not-derived: they never overwrite anything the app computed from the
record.

## Conformance — what every consumer must do

1. Reject a file whose `worksheet` marker or `inputs` is missing, with a plain
   message; never render a partial guess.
2. Treat `null` inputs as unknown: propagate to dependent outputs, name the
   missing fields (from `missing_required` or recomputed), never default.
3. Restore inputs exactly as typed on import; recompute outputs with the
   class arithmetic rather than trusting the file's `outputs`.
4. Display the `disclaimer`, and `exported_from` / `provenance` when present.

The end-to-end behavior is locked by the headless-Chromium smokes recorded in
[`CHANGELOG.md`](../CHANGELOG.md): a round trip restores DSCR 0.89 exactly, an
export carrying unknowns survives both paths with the unknowns named, both
surfaces reject non-worksheet files, and the app's export completes to DSCR
0.89 the moment the missing quote is typed.

---

# The geospatial interchange — taking a screened set out

The worksheet contract above moves one analysis between underwriting surfaces.
This one moves a **set** out of the platform entirely: into QGIS, into ArcGIS,
into a Mapbox tileset, into anyone else's map. Implementation:
[`src/geoexport.js`](../src/geoexport.js), reachable from the **GeoJSON** and
**CSV** buttons above the result list, which export whatever is currently
filtered.

## The shape

Plain [RFC 7946](https://datatracker.ietf.org/doc/html/rfc7946) GeoJSON —
`FeatureCollection` of `Point` features in WGS 84, longitude first — with one
foreign member, `lx`, carrying the header. RFC 7946 permits foreign members, so
a consumer that ignores `lx` still reads a valid file.

```json
{ "type": "FeatureCollection",
  "lx": { "format": "Locator.X geospatial interchange", "version": 1,
          "generated": "2026-09-11T22:40:12.000Z", "edition": "Locator X New Orleans Atlas",
          "records": 1204, "dropped_without_geometry": 3,
          "estimated_prices": 87, "approximate_coordinates": 12,
          "reso_alias": { "addr": "UnparsedAddress", "apn": "ParcelNumber" },
          "disclaimer": "Education, not advice; not a valuation and not a listing feed. …" },
  "features": [ { "type": "Feature", "id": "nola-0001",
      "geometry": { "type": "Point", "coordinates": [-90.0715, 29.9511] },
      "properties": { "addr": "…", "price": 210000, "price_date": "2024-06-11",
        "lx:price_basis": "post-sale assessed value from the county roll — …",
        "lx:geometry_basis": "parcel location as published by the record",
        "lx:source": "Orleans Parish Assessor",
        "lx:derived_cap_pct": 6.41, "lx:derived_dscr": 1.12 } } ] }
```

## The two fields that exist because of the no-laundering rule

A record that leaves the app loses the interface that qualified it. Two
qualifications are load-bearing and therefore travel on **every feature**:

| Field | Why it cannot be dropped |
|---|---|
| `lx:price_basis` | A price here is normally the **post-sale assessed value** from a county roll. Where a county publishes no assessed values it is a **ZIP-level index estimate**, which is not a price at all, and an imported row is neither. Emitting all three as `price` would launder the weakest into the strongest — the same failure the worksheet's blank insurance field exists to prevent. |
| `lx:geometry_basis` | Most coordinates are the parcel. Some are the **ZIP centroid**, because the record carried no parcel geometry. Shipping a centroid as a point is how a fabricated coordinate enters somebody else's dataset, and once there it is indistinguishable from a surveyed one. |

Derived numbers are namespaced `lx:derived_` and the header says what they are:
arithmetic over this app's assumptions, not measurements and not a valuation.

`records` counts the rows asked for; `features` counts the ones that could be
features. Rows with no coordinate are dropped, and
`dropped_without_geometry` publishes how many — a consumer reading only
`features` is entitled to know what it is not seeing.

## The RESO alias block, and what it does not claim

`lx.reso_alias` maps fourteen of our field names to their RESO Data Dictionary
equivalents, as a convenience for a consumer joining this to an MLS-shaped
schema. It is **asserted, not verified**: the build container has no egress to
reso.org (probed 2026-09-11), so the names could not be checked against the
published dictionary or pinned to a version. It is therefore a mapping to
check, never a conformance claim — which is why the aliases sit in a separate
block rather than becoming the property names. Fields with no confident
equivalent are **absent rather than guessed**.

## Conformance — what a consumer must do

1. Read `lx:price_basis` before treating `price` as a price. A row whose basis
   says "NOT a price" is an index level.
2. Read `lx:geometry_basis` before treating a coordinate as a parcel location.
3. Treat `null` as unknown, never as zero — the same rule as the worksheet.
4. Carry `lx.disclaimer` wherever the data goes.

Locked by `tests/fleet_smoke.js`, which exports an estimated-price row, a
ZIP-centroid row and a row with no coordinate, and fails if any of the three
loses its label or its count.
