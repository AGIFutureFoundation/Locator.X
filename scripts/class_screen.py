#!/usr/bin/env python3
"""Screen a pulled parcel dataset by Locator.X asset class — hotels, apartments,
5+ multifamily and the rest of the crosswalk's classes — under the evidence rules.

Usage:
    python3 scripts/class_screen.py <rows.json> <jurisdiction_id> [--value-field JV]

<rows.json> is a JSON array of row objects (e.g. the output of
`scripts/fl_nal_probe.py --out`, or any pull transferred per docs/PULL_RECIPE.md).
<jurisdiction_id> selects the vocabulary from crosswalk/usecodes.json — the
crosswalk names the use-code field, so the right column is never guessed.

Evidence rules enforced here, not merely recommended:
  * SAMPLE FLOOR OF 5 — no median or percentile is printed for a class with
    fewer than 5 valued rows; the class reports its count and 'below sample
    floor' instead (the V3 rule, in code).
  * MEDIANS, NOT MEANS — right-skewed price data; the mean is a tail.
  * UNMATCHED IS AN ANSWER — rows whose code maps to nothing are counted and
    reported as unmatched, never silently dropped, and the top unmatched codes
    are listed so the crosswalk can grow from evidence.
  * UNVERIFIED VOCABULARY IS FLAGGED — screening with a transcribed-but-
    unmeasured vocabulary (e.g. Florida before the NAL probe) prints a warning
    on every run.
"""
import json
import os
import sys
from collections import Counter, defaultdict

SAMPLE_FLOOR = 5
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def median(xs):
    xs = sorted(xs)
    n = len(xs)
    m = n // 2
    return xs[m] if n % 2 else (xs[m - 1] + xs[m]) / 2.0


def to_num(v):
    if v is None:
        return None
    s = str(v).replace(",", "").strip()
    if not s:
        return None
    try:
        x = float(s)
    except ValueError:
        return None
    return x if x > 0 else None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2:
        sys.exit(__doc__)
    rows_path, jid = args[0], args[1]
    value_field = "JV"
    if "--value-field" in sys.argv:
        value_field = sys.argv[sys.argv.index("--value-field") + 1]

    with open(os.path.join(ROOT, "crosswalk", "usecodes.json"), encoding="utf-8") as f:
        xw = json.load(f)
    juri = next((j for j in xw["jurisdictions"] if j["id"] == jid), None)
    if juri is None:
        sys.exit("unknown jurisdiction %r — have: %s"
                 % (jid, ", ".join(j["id"] for j in xw["jurisdictions"])))
    code_map = {c["code"]: c for c in juri["codes"]}
    unverified = [c["code"] for c in juri["codes"] if c.get("verified") is None]
    field = juri["field"].split("/")[0].strip()

    with open(rows_path, encoding="utf-8") as f:
        rows = json.load(f)
    if not isinstance(rows, list):
        sys.exit("rows file must be a JSON array of row objects")

    by_class = defaultdict(list)
    unmatched = Counter()
    missing_field = 0
    for r in rows:
        raw = r.get(field)
        if raw is None:
            missing_field += 1
            continue
        code = str(raw).strip()
        hit = code_map.get(code)
        if hit is None:
            unmatched[code or "(blank)"] += 1
            continue
        by_class[hit["class"]].append(to_num(r.get(value_field)))

    print("== class screen: %s (%s on field %r)" % (juri["name"], jid, field))
    print("rows: %d · matched: %d · unmatched: %d · missing %r: %d"
          % (len(rows), sum(len(v) for v in by_class.values()),
             sum(unmatched.values()), field, missing_field))
    if unverified:
        print("! VOCABULARY WARNING: %d codes in this jurisdiction are transcribed but "
              "unmeasured (%s) — results are provisional until the probe verifies them"
              % (len(unverified), ", ".join(unverified)))
    print()
    print("%-24s %7s %10s  %s" % ("class", "count", "valued", "median " + value_field))
    for cls in xw["classes"]:
        vals = by_class.get(cls, [])
        priced = [v for v in vals if v is not None]
        if not vals:
            continue
        if len(priced) < SAMPLE_FLOOR:
            med = "below sample floor (n=%d < %d)" % (len(priced), SAMPLE_FLOOR)
        else:
            med = "{:,.0f}".format(median(priced))
        print("%-24s %7d %10d  %s" % (cls, len(vals), len(priced), med))
    if unmatched:
        print()
        print("top unmatched codes (evidence for growing the crosswalk — never map them by guess):")
        for code, n in unmatched.most_common(15):
            print("  %-30s %d" % (code, n))
    for cv in juri.get("caveats", []):
        print("caveat: " + cv)
    return 0


if __name__ == "__main__":
    sys.exit(main())
