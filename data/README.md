# Data

**No property data is committed to this repository.** The tree it is built from is about 4 GB,
and it is all derived from public records that are better fetched than mirrored. This file says
where each layer comes from and how to rebuild it.

Two reasons beyond size:

1. **Freshness.** A parcel file mirrored into git is wrong the day an assessor republishes. The
   builders pull, so a rebuild is current by construction.
2. **PII.** Several usable upstream feeds carry owner names and mailing addresses. The ingest
   scripts strip those fields; a committed mirror would preserve them forever in git history.
   Nothing under `data/` should ever be added to a commit — `.gitignore` enforces it, but the
   reason matters more than the rule.

## Rebuilding

Data modules are built first, then editions are built from them:

```bash
python3 build_data.py              # → data.js            (Bay Area, 5 counties)
python3 build_data_uscorridor.py   # → data_uscorridor.js (15 US growth-corridor metros)
python3 build_data_nola.py         # → data_nola.js       (Orleans + Jefferson)
python3 build_data_launi.py        # → data_launi.js      (East Baton Rouge)
# ... one per edition; see the table below
python3 build_sig2.py              # → sig2_*.js          (live cross-signals)
```

Then any edition builder packs a module into a single self-contained page:

```bash
python3 build.py                   # → bay-ledger.html
python3 build_uscorridor.py        # → uscorridor.html
```

## Edition → data module

| Edition | Data module | Signals | Coverage |
|---|---|---|---|
| `bay-ledger.html` | `data.js` | `sig2_bay.js` | 182,124 records · 5 Bay counties |
| `atlas_bay.html` | `data_atlas_bay.js` | `sig2_bay.js` | Bay full-market atlas |
| `below100.html` | `data_below.js` | `sig2_bay.js` | 100k below-market index |
| `income50.html` | `data_income.js` | `sig2_bay.js` | 50k Contra Costa income-class |
| `match50.html` | `data_match.js` | `sig2_bay.js` | 50k pre-scored |
| `sheltercove.html` | `data_sc.js` | `sig2_bay.js` | Humboldt / Shelter Cove |
| `nola.html` | `data_nola.js` | `sig2_nola.js` | 87,578 · Orleans + Jefferson |
| `atlas_nola.html` | `data_atlas_nola.js` | `sig2_nola.js` | 125,803 · NOLA full-market atlas |
| `launi.html` | `data_launi.js` | `sig2_launi.js` | East Baton Rouge |
| `uscorridor.html` | `data_uscorridor.js` | `sig2_uscorridor.js` | 354,260 · 15 corridor metros |
| `uswide.html` | `data_uswide.js` | `sig2_uscorridor.js` | Conversion stock |
| `usnew5.html` | `data_usnew5.js` | `sig2_uscorridor.js` | New corridors |

## The integrity check

**File size is not the integrity check — the record count is.** A compression pass in September
2026 cut roughly 18 MB across the fleet, which briefly made two editions look as though they had
lost most of their parcels. They had not; the counts above were exact. When a build looks small,
open it and count `LX.allListings().length` before concluding anything.

## Sources

`src/sources_data.js` is the machine-readable catalogue of every upstream feed: endpoint, join
key, update frequency, whether a key is required, rate limits actually measured rather than
assumed, licence, and the reason the field is believed to carry predictive signal. That file is
the authoritative answer to "where did this number come from"; this README only points at it.

The platform's own doctrine applies to its inputs: whatever could not be checked travels with the
answer. Coverage is reported per signal in the app rather than averaged away, and a record that
cannot answer a test returns *unknown* instead of quietly passing.
