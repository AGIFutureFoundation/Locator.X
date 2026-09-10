#!/usr/bin/env python3
"""Build the national top-properties index — highest-valued lodging, apartments 5+,
commercial multifamily and the other crosswalk classes — from pulled datasets,
searchable by jurisdiction, city and district.

Usage:
    python3 scripts/top_screen.py [--top 25] [--classes lodging,apartments_5plus]
        [--out data/top_index.json] <rows.json>:<jurisdiction_id> [more pairs...]

Each input pair is a pulled row file (PII already stripped per docs/PULL_RECIPE.md)
plus the crosswalk jurisdiction whose vocabulary it uses. The output is one merged
index: top-N per (jurisdiction x class), a national top-N per class, and city/district
facets — the feed for pages/top-properties.html.

Evidence rules enforced:
  * RANK ONLY ON A DECLARED value_field. A jurisdiction whose crosswalk entry declares
    none is counted but NOT ranked, with the reason stated — unknown is an answer,
    never a guessed column.
  * VALUES ARE ASSESSMENTS, NOT PRICES. Every entry carries its value_field name and the
    jurisdiction's ranking_note (non-disclosure states say so there); the index never
    calls an assessed value a price.
  * DEDUPE BEFORE RANKING where the crosswalk declares a measured dedupe_key —
    multi-polygon rows would otherwise ladder the same parcel up the top list.
  * ZERO-VALUE ROWS ARE EXCLUDED AND COUNTED, never ranked as bargains (Wake's condo
    shells carry 0 by structure, per the measured caveat).
  * LOCALITY FACETS come only from declared locality_fields; absent means the
    jurisdiction ships without city/district search, and the index says so.
"""
import json
import os
import sys
from collections import Counter
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADDRESS_HINTS = ("PHY_ADDR1", "ADDR", "ADDRESS", "SITE_ADDR", "SITUS", "PROP_ADDR")


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


def parse_args(argv):
    top, classes, out, pairs = 25, None, None, []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--top":
            if i + 1 >= len(argv):
                sys.exit("--top needs a number")
            top = int(argv[i + 1]); i += 2
        elif a == "--classes":
            if i + 1 >= len(argv):
                sys.exit("--classes needs a comma list")
            classes = [c.strip() for c in argv[i + 1].split(",") if c.strip()]; i += 2
        elif a == "--out":
            if i + 1 >= len(argv):
                sys.exit("--out needs a path")
            out = argv[i + 1]; i += 2
        else:
            if ":" not in a:
                sys.exit("input must be <rows.json>:<jurisdiction_id>, got %r" % a)
            path, jid = a.rsplit(":", 1)
            pairs.append((path, jid)); i += 1
    if not pairs:
        sys.exit(__doc__)
    return top, classes, out, pairs


def main():
    top_n, want_classes, out, pairs = parse_args(sys.argv[1:])
    with open(os.path.join(ROOT, "crosswalk", "usecodes.json"), encoding="utf-8") as f:
        xw = json.load(f)
    juris = {j["id"]: j for j in xw["jurisdictions"]}
    classes = want_classes or list(xw["classes"])
    unknown = [c for c in classes if c not in xw["classes"]]
    if unknown:
        sys.exit("unknown classes %s — have: %s" % (unknown, ", ".join(xw["classes"])))

    entries, jsummaries = [], []
    for path, jid in pairs:
        j = juris.get(jid)
        if j is None:
            sys.exit("unknown jurisdiction %r — have: %s" % (jid, ", ".join(juris)))
        with open(path, encoding="utf-8") as f:
            rows = json.load(f)
        if not isinstance(rows, list):
            sys.exit("%s: rows file must be a JSON array" % path)
        code_map = {c["code"]: c for c in j["codes"]}
        field = j["field"].split("/")[0].strip()
        vfield = j.get("value_field")
        lfields = j.get("locality_fields", [])
        dkey = j.get("dedupe_key")
        unverified = any(c.get("verified") is None for c in j["codes"])

        matched = zero_or_blank = 0
        best = {}   # dedupe-key -> entry (max value)  |  or list when no dedupe key
        flat = []
        for r in rows:
            code = str(r.get(field, "") or "").strip()
            hit = code_map.get(code)
            if hit is None or hit["class"] not in classes:
                continue
            matched += 1
            e = {
                "jurisdiction": jid, "class": hit["class"], "code": code,
                "value": to_num(r.get(vfield)) if vfield else None,
                "value_field": vfield,
                "locality": {lf: (str(r.get(lf, "") or "").strip() or None) for lf in lfields},
                "address": next((str(r[h]).strip() for h in ADDRESS_HINTS
                                 if r.get(h)), None),
                "row": r,
            }
            if vfield and e["value"] is None:
                zero_or_blank += 1
                continue
            if dkey:
                k = tuple(str(r.get(kf, "") or "").strip() for kf in dkey)
                if k not in best or (e["value"] or 0) > (best[k]["value"] or 0):
                    best[k] = e
            else:
                flat.append(e)
        ranked = list(best.values()) if dkey else flat
        deduped_away = matched - zero_or_blank - len(ranked)
        jsummaries.append({
            "id": jid, "name": j["name"], "value_field": vfield,
            "locality_fields": lfields, "matched": matched,
            "excluded_zero_or_blank_value": zero_or_blank,
            "collapsed_by_dedupe": max(deduped_away, 0),
            "ranked": len(ranked) if vfield else 0,
            "unranked_reason": None if vfield else
                "no measured value_field declared in the crosswalk — counted, not ranked",
            "vocabulary_unverified": unverified,
            "ranking_note": j.get("ranking_note"),
            "caveats": j.get("caveats", []),
        })
        if vfield:
            entries.extend(ranked)

    entries.sort(key=lambda e: e["value"], reverse=True)
    per_class_juri, national, seen = {}, {}, Counter()
    for e in entries:
        kj = (e["jurisdiction"], e["class"])
        seen[kj] += 1
        if seen[kj] <= top_n:
            per_class_juri.setdefault("%s/%s" % kj, []).append(e)
        national.setdefault(e["class"], [])
        if len(national[e["class"]]) < top_n:
            national[e["class"]].append(e)

    cities = Counter(v for e in entries for f, v in e["locality"].items()
                     if v and "CITY" in f.upper())
    districts = Counter(v for e in entries for f, v in e["locality"].items()
                        if v and "CITY" not in f.upper())

    index = {
        "generated": date.today().isoformat(),
        "params": {"top": top_n, "classes": classes},
        "disclaimer": "Values are assessed/just values from public rolls — assessments, "
                      "not prices. Non-disclosure jurisdictions carry no sale prices at "
                      "all; see each jurisdiction's ranking_note. Navigation of the "
                      "public record, not a recommendation.",
        "jurisdictions": jsummaries,
        "national_top": national,
        "per_jurisdiction_top": per_class_juri,
        "facets": {"cities": dict(cities.most_common(200)),
                   "districts": dict(districts.most_common(200))},
    }

    print("== top-properties index: %d ranked entries from %d jurisdiction(s)"
          % (len(entries), len(pairs)))
    for js in jsummaries:
        line = "  %-14s matched %d · ranked %d" % (js["id"], js["matched"], js["ranked"])
        if js["excluded_zero_or_blank_value"]:
            line += " · excluded %d zero/blank-value" % js["excluded_zero_or_blank_value"]
        if js["collapsed_by_dedupe"]:
            line += " · collapsed %d duplicate rows" % js["collapsed_by_dedupe"]
        if js["unranked_reason"]:
            line += " · UNRANKED: " + js["unranked_reason"]
        if js["vocabulary_unverified"]:
            line += " · VOCABULARY UNVERIFIED"
        print(line)
    for cls, lst in national.items():
        print("\n-- national top %d · %s (by declared assessment fields; not prices) --"
              % (min(top_n, len(lst)), cls))
        for i, e in enumerate(lst[:10], 1):
            loc = ", ".join(v for v in e["locality"].values() if v) or "(no locality fields)"
            print("  %2d. %14s  %-12s %s%s" % (
                i, "{:,.0f}".format(e["value"]), e["jurisdiction"], loc,
                "  " + e["address"] if e["address"] else ""))
        if len(lst) > 10:
            print("      ... %d more in the index" % (len(lst) - 10))

    if out:
        os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            json.dump(index, f)
        print("\nwrote index -> %s (keep under data/: it is gitignored). "
              "Open pages/top-properties.html and load it." % out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
