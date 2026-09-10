#!/usr/bin/env python3
"""Smoke tests for the tooling's doctrine guarantees — stdlib only, no data needed.

Each test locks a behavior the platform's honesty rules depend on, so a refactor
cannot silently un-enforce them:

  1. fl_nal_probe strips every OWN_*/FIDU_* column on ingest — no PII survives to
     the output rows, and the derived owner_out_of_state flag is correct.
  2. class_screen holds the sample floor of 5 (no median below it), warns on an
     unverified vocabulary, lists unmatched codes, and refuses an unknown
     jurisdiction with a clean message.
  3. top_screen ranks only on declared value fields (undeclared jurisdictions are
     UNRANKED with the reason), excludes and counts zero/blank values, orders the
     national top correctly across jurisdictions, and never calls a value a price.
  4. build_state --dry-run passes for nola/bay with zero '!' problems against the
     current shell, and the unfilled template refuses.
  5. The crosswalk gate and internal link check pass from the tree as committed.

Run: python3 tests/run.py    (CI runs it on every push and PR)
Everything writes only to a temp dir; fixtures are generated, obviously synthetic
values — nothing here asserts anything about the real world.
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAILURES = []


def run(args, expect_rc=0):
    r = subprocess.run([sys.executable] + args, capture_output=True, text=True, cwd=ROOT)
    out = r.stdout + r.stderr
    if (r.returncode == 0) != (expect_rc == 0):
        FAILURES.append("rc %d (wanted %s) from %s\n%s" % (r.returncode, expect_rc, args, out[-2000:]))
    return out


def check(cond, label, context=""):
    if not cond:
        FAILURES.append(label + ("\n" + context[-1500:] if context else ""))


def main():
    tmp = tempfile.mkdtemp(prefix="lxtests_")

    # ---- 1. fl_nal_probe: PII strip + derived flag -------------------------
    nal = os.path.join(tmp, "nal.csv")
    with open(nal, "w") as f:
        f.write("CO_NO,PARCEL_ID,DOR_UC,JV,SALE_YR1,QUAL_CD1,OWN_NAME,OWN_ADDR1,OWN_STATE,FIDU_NAME,PHY_ADDR1,PHY_CITY\n")
        f.write("48,T0001,003,1000000,2024,Q,TEST OWNER,1 TEST ST,FL,,10 SYNTH AVE,TESTVILLE\n")
        f.write("48,T0002,039,5000000,,,TEST LLC,2 TEST RD,NY,TEST TRUSTEE,11 SYNTH AVE,TESTVILLE\n")
        f.write("48,T0003,003,,2023,U,TEST CO,3 TEST LN,TX,,12 SYNTH AVE,TESTVILLE\n")
    out_json = os.path.join(tmp, "nal_out.json")
    out = run(["scripts/fl_nal_probe.py", nal, "--out", out_json])
    check("PII columns dropped on ingest (4)" in out, "probe: PII drop line missing", out)
    rows = json.load(open(out_json))
    leaked = [k for r in rows for k in r if k.startswith(("OWN_", "FIDU_"))]
    check(not leaked, "probe: PII keys leaked to output: %s" % leaked)
    check([r["owner_out_of_state"] for r in rows] == [False, True, True],
          "probe: owner_out_of_state flags wrong: %s" % [r["owner_out_of_state"] for r in rows])
    run(["scripts/fl_nal_probe.py", nal, "--out"], expect_rc=1)   # trailing flag refuses cleanly

    # ---- 2. class_screen: floor, warning, unmatched, unknown jid -----------
    screen_rows = ([{"DOR_UC": "003", "JV": str(100000 + i)} for i in range(6)]
                   + [{"DOR_UC": "039", "JV": "9000000"}] * 3          # n=3 < floor
                   + [{"DOR_UC": "999", "JV": "1"}] * 4)               # unmatched
    sr = os.path.join(tmp, "screen.json")
    json.dump(screen_rows, open(sr, "w"))
    out = run(["scripts/class_screen.py", sr, "florida_dor"])
    check("below sample floor (n=3 < 5)" in out, "screen: sample floor not enforced", out)
    check("VOCABULARY WARNING" in out, "screen: unverified-vocabulary warning missing", out)
    check("999" in out and "unmatched" in out, "screen: unmatched codes not surfaced", out)
    check("apartments_5plus" in out and "100,00" not in out.split("below")[0].split("apartments")[0],
          "screen: apartments row missing", out)
    out = run(["scripts/class_screen.py", sr, "nowhere_zz"], expect_rc=1)
    check("unknown jurisdiction" in out, "screen: unknown-jurisdiction message missing", out)

    # ---- 3. top_screen: declared-fields-only rank, exclusions, order ------
    fl = [{"DOR_UC": "039", "JV": "7000000", "PHY_CITY": "TESTVILLE", "PARCEL_ID": "A1"},
          {"DOR_UC": "039", "JV": "9000000", "PHY_CITY": "TESTVILLE", "PARCEL_ID": "A2"},
          {"DOR_UC": "003", "JV": "", "PHY_CITY": "TESTVILLE", "PARCEL_ID": "A3"}]   # blank -> excluded
    bn = [{"LUC_MSG": "HOTEL/MOTEL HI RISE", "TOTVALUE": "8000000", "PARCEL_ID": "B1"}]
    on = [{"USED_AS_DESC": "Highrise apt", "PRINT_KEY": "1-1", "CITYTOWN_NAME": "Testtown"}]
    p_fl, p_bn, p_on = (os.path.join(tmp, n) for n in ("fl.json", "bn.json", "on.json"))
    json.dump(fl, open(p_fl, "w")); json.dump(bn, open(p_bn, "w")); json.dump(on, open(p_on, "w"))
    idx_path = os.path.join(tmp, "idx.json")
    out = run(["scripts/top_screen.py", "--top", "3", "--out", idx_path,
               p_fl + ":florida_dor", p_bn + ":bernalillo_nm", p_on + ":onondaga_ny"])
    check("UNRANKED: no measured value_field" in out, "top: unranked-with-reason missing", out)
    check("excluded 1 zero/blank-value" in out, "top: zero-value exclusion not counted", out)
    idx = json.load(open(idx_path))
    lodging = [(e["value"], e["jurisdiction"]) for e in idx["national_top"]["lodging"]]
    check(lodging == [(9000000.0, "florida_dor"), (8000000.0, "bernalillo_nm"),
                      (7000000.0, "florida_dor")],
          "top: national lodging order wrong: %s" % lodging)
    check("not prices" in idx["disclaimer"], "top: assessment-not-price disclaimer missing")
    check(all(e["value_field"] for cls in idx["national_top"].values() for e in cls),
          "top: entry missing its value_field label")

    # ---- 4. build_state dry-run: clean pairs, template refuses -------------
    out = run(["build_state.py", "--dry-run", "nola", "bay"])
    check("    ! " not in out, "build_state: dry-run reported problems", out)
    run(["build_state.py", "--dry-run", "florida-template"], expect_rc=1)

    # ---- 5. repo gates hold from the committed tree ------------------------
    run(["crosswalk/validate_usecodes.py"])
    run(["scripts/check_links.py"])

    if FAILURES:
        print("FAIL — %d problem(s):" % len(FAILURES))
        for fmsg in FAILURES:
            print("  ✗ " + fmsg.replace("\n", "\n    "))
        return 1
    print("  ✓ all doctrine smoke tests pass (PII strip, sample floor, declared-field "
          "ranking, dry-run pairs, gates)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
