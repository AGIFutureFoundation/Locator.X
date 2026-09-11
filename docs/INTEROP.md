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
