#!/usr/bin/env python3
"""Gate for the asset-class crosswalk (crosswalk/usecodes.json).

Same posture as curriculum/validate.py: raises rather than warns, and every rule
exists because the pull recipe documents a real trap it prevents.

  1. every jurisdiction carries id, name, field, source and at least one code
  2. every code entry names a class that exists, and carries a verified date or
     an explicit null (transcribed-but-unmeasured)
  3. no duplicate code strings within a jurisdiction
  4. a jurisdiction with any unverified entry must say so in a caveat — an
     unmeasured code silently presented as measured is exactly the certainty
     error this platform counts
  5. measured_count, where present, is a positive integer
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    with open(os.path.join(HERE, "usecodes.json"), encoding="utf-8") as f:
        data = json.load(f)
    errs = []
    classes = set(data.get("classes", {}))
    if not classes:
        errs.append("no classes declared")
    n_codes = n_unverified = 0
    for j in data.get("jurisdictions", []):
        jid = j.get("id", "<missing id>")
        for field in ("id", "name", "field", "source"):
            if not j.get(field):
                errs.append("%s: missing %r" % (jid, field))
        codes = j.get("codes", [])
        if not codes:
            errs.append("%s: no codes" % jid)
        seen = set()
        has_unverified = False
        for c in codes:
            n_codes += 1
            code = c.get("code")
            if not code:
                errs.append("%s: code entry without a code string" % jid)
                continue
            if code in seen:
                errs.append("%s: duplicate code %r" % (jid, code))
            seen.add(code)
            if c.get("class") not in classes:
                errs.append("%s.%s: unknown class %r" % (jid, code, c.get("class")))
            if "verified" not in c:
                errs.append("%s.%s: no verified field (date or explicit null)" % (jid, code))
            elif c["verified"] is None:
                has_unverified = True
                n_unverified += 1
            elif not re.match(r"^\d{4}-\d{2}-\d{2}$", str(c["verified"])):
                errs.append("%s.%s: verified is not a YYYY-MM-DD date: %r" % (jid, code, c["verified"]))
            mc = c.get("measured_count")
            if mc is not None and (not isinstance(mc, int) or mc <= 0):
                errs.append("%s.%s: measured_count must be a positive int, got %r" % (jid, code, mc))
        if has_unverified:
            caveats = " ".join(j.get("caveats", [])).upper()
            if "UNVERIFIED" not in caveats:
                errs.append("%s: has unverified codes but no caveat saying UNVERIFIED" % jid)
    if errs:
        print("crosswalk INVALID:")
        for e in errs:
            print("  ! " + e)
        return 1
    print("  · %d jurisdictions · %d code mappings · %d transcribed-unverified (flagged)"
          % (len(data.get("jurisdictions", [])), n_codes, n_unverified))
    print("  ✓ crosswalk consistent: every code sourced, dated or explicitly unverified")
    return 0


if __name__ == "__main__":
    sys.exit(main())
