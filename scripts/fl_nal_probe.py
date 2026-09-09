#!/usr/bin/env python3
"""Florida DOR NAL roll probe — the wave-one step defined in docs/states/coverage/florida.md.

Container egress to floridarevenue.com is blocked (CONNECT 403, verified 2026-09-09), so
the download happens over the desktop browser-pane route (docs/PULL_RECIPE.md); this
script is the ingest side, ready the moment a county's NAL file lands on disk.

Usage:
    python3 scripts/fl_nal_probe.py <path to NAL csv or zip> [--out data/fl_nal_<county>.json]

What it does, in doctrine order:
  1. PII strip ON INGEST: every OWN_* and FIDU_* column (owner and fiduciary names and
     mailing addresses) is dropped before anything is stored. One derived, non-identifying
     flag survives: owner_out_of_state (OWN_STATE != 'FL'). See data/README.md.
  2. Probe report, never a blind pull: row count, DOR use-code histogram, populated rates
     on the fields the platform needs, and the sale-qualification picture — Florida is a
     disclosure state, so QUAL_CD1 on recent years measures the usable comp supply.
  3. Nothing is guessed: a missing expected column is reported missing; DOR_UC codes are
     reported raw (band them only against the published DOR use-code manual, per the
     pull-recipe hard rule).

The report is what goes into PULL_RECIPE.md's additions log and moves the county's rows
in docs/states/coverage/florida.md from `named` to `pulled` — including the
disappointments, which are the valuable findings.
"""
import csv
import io
import json
import os
import sys
import zipfile
from collections import Counter

PII_PREFIXES = ("OWN_", "FIDU_")
KEEP_FIELDS = [
    "CO_NO", "PARCEL_ID", "DOR_UC", "PA_UC", "JV", "AV_SD", "AV_NSD", "TV_SD", "TV_NSD",
    "LND_VAL", "LND_SQFOOT", "TOT_LVG_AREA", "NO_BULDNG", "NO_RES_UNTS",
    "ACT_YR_BLT", "EFF_YR_BLT", "SALE_PRC1", "SALE_YR1", "SALE_MO1", "QUAL_CD1", "VI_CD1",
    "SALE_PRC2", "SALE_YR2", "QUAL_CD2", "PHY_ADDR1", "PHY_CITY", "PHY_ZIPCD",
    "CENSUS_BK", "MKT_AR", "NBRHD_CD", "TWN", "RNG", "SEC",
]
RATE_FIELDS = ["JV", "TOT_LVG_AREA", "NO_RES_UNTS", "ACT_YR_BLT", "SALE_PRC1", "SALE_YR1"]


def open_nal(path):
    if path.lower().endswith(".zip"):
        zf = zipfile.ZipFile(path)
        names = [n for n in zf.namelist() if n.lower().endswith(".csv")]
        if not names:
            sys.exit("no .csv inside %s" % path)
        if len(names) > 1:
            print("note: %d csv members, using %s" % (len(names), names[0]))
        return io.TextIOWrapper(zf.open(names[0]), encoding="latin-1", newline="")
    return open(path, encoding="latin-1", newline="")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = sys.argv[1]
    out = None
    if "--out" in sys.argv:
        out = sys.argv[sys.argv.index("--out") + 1]

    with open_nal(path) as f:
        reader = csv.DictReader(f)
        header = [h.strip().upper() for h in (reader.fieldnames or [])]
        canon = {h.strip().upper(): h for h in (reader.fieldnames or [])}

        pii_cols = [h for h in header if h.startswith(PII_PREFIXES)]
        missing = [k for k in KEEP_FIELDS if k not in header]
        own_state = canon.get("OWN_STATE")

        n = 0
        uc = Counter()
        populated = Counter()
        qual_recent = Counter()
        recent_sales = 0
        out_of_state = 0
        rows = [] if out else None

        for rec in reader:
            n += 1
            code = (rec.get(canon.get("DOR_UC", ""), "") or "").strip()
            uc[code or "(blank)"] += 1
            for k in RATE_FIELDS:
                src = canon.get(k)
                v = (rec.get(src, "") or "").strip() if src else ""
                if v and v not in ("0", "0.0", "0.00"):
                    populated[k] += 1
            yr = (rec.get(canon.get("SALE_YR1", ""), "") or "").strip()
            if yr.isdigit() and int(yr) >= 2023:
                recent_sales += 1
                q = (rec.get(canon.get("QUAL_CD1", ""), "") or "").strip()
                qual_recent[q or "(blank)"] += 1
            if own_state and (rec.get(own_state, "") or "").strip().upper() not in ("FL", ""):
                out_of_state += 1
            if rows is not None:
                r = {k: (rec.get(canon[k], "") or "").strip() for k in KEEP_FIELDS if k in canon}
                r["owner_out_of_state"] = bool(
                    own_state and (rec.get(own_state, "") or "").strip().upper() not in ("FL", ""))
                rows.append(r)  # PII columns are never read into r

    print("== NAL probe: %s" % os.path.basename(path))
    print("rows: %d" % n)
    print("PII columns dropped on ingest (%d): %s" % (len(pii_cols), ", ".join(pii_cols) or "none found"))
    if missing:
        print("EXPECTED COLUMNS MISSING (report these, do not improvise): %s" % ", ".join(missing))
    print("owner_out_of_state: %d (%.1f%%)" % (out_of_state, 100.0 * out_of_state / n if n else 0))
    print("-- populated rates (non-blank, non-zero) --")
    for k in RATE_FIELDS:
        print("  %-14s %6.1f%%" % (k, 100.0 * populated[k] / n if n else 0))
    print("-- DOR_UC top 40 (raw codes; band only against the published DOR manual) --")
    for code, c in uc.most_common(40):
        print("  %-8s %d" % (code, c))
    print("-- sales with SALE_YR1 >= 2023: %d; QUAL_CD1 distribution --" % recent_sales)
    for q, c in qual_recent.most_common(15):
        print("  %-8s %d" % (q, c))

    if out:
        os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            json.dump(rows, f)
        print("wrote %d stripped rows -> %s (keep under data/: it is gitignored)" % (len(rows), out))


if __name__ == "__main__":
    main()
