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
  4. build_state --dry-run passes for every shipped edition's spec with zero '!'
     problems against the current shell, the unfilled templates refuse, and each
     hand builder's pairs match its spec exactly (lockstep, compared by AST).
  5. check_pairs holds fleet parity: every per-file builder's literal replace
     pairs match current source, and a synthetic tree with one dead find fails —
     the check itself is checked, not just today's pairs.
  6. The crosswalk gate, the market-data gate and the internal link check pass from
     the tree as committed.
  7. The market gate's cross-file rule fires on a drifted record count.
  8. The market pages render, and render their unknowns as unknowns.

Run: python3 tests/run.py    (CI runs it on every push and PR)
Everything writes only to a temp dir; fixtures are generated, obviously synthetic
values — nothing here asserts anything about the real world.
"""
import json
import os
import shutil
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
    out = run(["build_state.py", "--dry-run", "--all"])
    check("    ! " not in out, "build_state: dry-run reported problems", out)
    check("skipping 3 unfilled template(s)" in out,
          "build_state: --all did not name the skipped templates", out)
    check(out.count("spec '") == 11, "build_state: --all did not cover all 11 specs", out)
    run(["build_state.py", "--dry-run", "florida-template"], expect_rc=1)
    run(["build_state.py", "--dry-run", "omaha-template"], expect_rc=1)
    run(["build_state.py", "--dry-run", "lincoln-template"], expect_rc=1)

    # ---- 4b. spec registry and hand builders stay in lockstep --------------
    # Every shipped edition has both a hand builder (canonical until byte
    # parity) and a spec. The pairs must be IDENTICAL, in the same order —
    # a fix landing in one but not the other is the drift this fails on.
    sys.path.insert(0, ROOT)
    sys.path.insert(0, os.path.join(ROOT, "scripts"))
    import check_pairs
    import build_state
    LOCKSTEP = {
        "build_atlas_nola.py": "nola", "build_atlas_bay.py": "bay",
        "build_below.py": "below", "build_income.py": "income",
        "build_launi.py": "launi", "build_match.py": "match",
        "build_nola.py": "nola-classic", "build_sc.py": "sheltercove",
        "build_uscorridor.py": "uscorridor", "build_usnew5.py": "usnew5",
        "build_uswide.py": "uswide",
    }
    for bfile, skey in sorted(LOCKSTEP.items()):
        got = check_pairs.extract(os.path.join(ROOT, bfile))
        body = [(f, r) for _, k, t, f, r in got if k == "replace" and t == "body"]
        app = [(f, r) for _, k, t, f, r in got if k == "replace" and t == "app"]
        titles = [r for _, k, t, f, r in got if k == "re.sub" and t == "head"]
        spec = build_state.SPECS[skey]
        check(body == [tuple(p) for p in spec["body_pairs"]],
              "lockstep: %s body pairs differ from spec %r" % (bfile, skey),
              "builder: %s\nspec:    %s" % (body, spec["body_pairs"]))
        check(app == [tuple(p) for p in spec["app_pairs"]],
              "lockstep: %s app pairs differ from spec %r" % (bfile, skey),
              "builder: %s\nspec:    %s" % (app, spec["app_pairs"]))
        check(titles == ["<title>%s</title>" % spec["title"]],
              "lockstep: %s title differs from spec %r" % (bfile, skey),
              "builder: %s vs spec title %r" % (titles, spec["title"]))

    # ---- 5. check_pairs: fleet parity, and the failure mode itself ---------
    out = run(["scripts/check_pairs.py"])
    check("all match current source" in out, "pairs: fleet parity check failed", out)
    ptree = os.path.join(tmp, "pairtree")
    os.makedirs(os.path.join(ptree, "src"))
    open(os.path.join(ptree, "src", "body.html"), "w").write("<p>real text</p>")
    open(os.path.join(ptree, "src", "head.html"), "w").write("<title>t</title>")
    open(os.path.join(ptree, "src", "app.js"), "w").write("var x = 1\n")
    open(os.path.join(ptree, "lxbuild.py"), "w").write("MODULES = ['src/app.js']\n")
    open(os.path.join(ptree, "build_synth.py"), "w").write(
        "for a,b in [('real text','regional text'),('gone text','x')]:\n"
        "    body = body.replace(a, b)\n")
    out = run(["scripts/check_pairs.py", ptree], expect_rc=1)
    check("'gone text'" in out, "pairs: a stale find did not fail the check", out)

    # ---- 6. repo gates hold from the committed tree ------------------------
    run(["crosswalk/validate_usecodes.py"])
    run(["market/validate_market.py"])
    run(["scripts/check_links.py"])

    # ---- 7. the market gate's cross-file rule actually fires ---------------
    # A measured record count that no longer matches docs/PUBLISH_MAP.md is the
    # exact drift the rule exists to catch, so prove it on a synthetic tree
    # rather than trusting that it would.
    mtree = tempfile.mkdtemp()
    shutil.copytree(os.path.join(ROOT, "market"), os.path.join(mtree, "market"))
    os.makedirs(os.path.join(mtree, "docs"))
    shutil.copy(os.path.join(ROOT, "docs", "PUBLISH_MAP.md"),
                os.path.join(mtree, "docs", "PUBLISH_MAP.md"))
    edpath = os.path.join(mtree, "market", "editions.json")
    with open(edpath, encoding="utf-8") as fh:
        ed = json.load(fh)
    drifted = None
    for e in ed["editions"]:
        if "records_measured" in e:
            e["records_measured"] += 1
            drifted = e["file"]
            break
    with open(edpath, "w", encoding="utf-8") as fh:
        json.dump(ed, fh)
    out = run(["market/validate_market.py", mtree], expect_rc=1)
    check(drifted in out and "PUBLISH_MAP" in out,
          "market: a record count drifting from PUBLISH_MAP did not fail the gate", out)

    # ---- 8. the market pages actually render ------------------------------
    # The pages are a deploy-time build product, so a renderer that crashes on
    # an honest null would break the site with every gate still green. Render
    # the set and read it back for the three things the data says must show.
    msite = tempfile.mkdtemp()
    run(["scripts/build_market_pages.py", msite])
    pages = {}
    for name in ("market-dashboard.html", "new-orleans-louisiana.html", "sf-bay-area.html",
                 "high-potential-belts.html", "jobs-to-housing.html", "core-cities.html",
                 "louisiana-universities.html"):
        path = os.path.join(msite, name)
        if not os.path.exists(path):
            FAILURES.append("market pages: %s was not written" % name)
            continue
        with open(path, encoding="utf-8") as fh:
            pages[name] = fh.read()
        check(len(pages[name]) > 8000, "market pages: %s is suspiciously small" % name)
    # A Python None or nan reaching the page is a missing figure rendered as a
    # word instead of as an honest blank - the exact bug an unknown invites.
    for name, html in pages.items():
        for leak in (">None<", ">nan<", "None,", "nan%"):
            check(leak not in html,
                  "market pages: %s leaked a raw %s into the rendered page"
                  % (name, leak.strip("><,%")))
    check("net loss" in pages.get("jobs-to-housing.html", ""),
          "market pages: the negative jobs figure is not drawn as a net loss")
    check("no basis line in the record" in pages.get("new-orleans-louisiana.html", ""),
          "market pages: a headcount with no jobsBasis is not marked as such")
    check("not re-counted" in pages.get("market-dashboard.html", ""),
          "market pages: an edition with no live-measured count is not marked as such")

    # The live data's four unknown enrolments all sit outside Louisiana, so the
    # campus page never renders one. Put a null where the page WILL read it and
    # prove the renderer neither crashes on it nor prints it as a number.
    usite, umarket = tempfile.mkdtemp(), os.path.join(mtree, "market")
    cpath = os.path.join(umarket, "campuses.json")
    with open(cpath, encoding="utf-8") as fh:
        camp = json.load(fh)
    ci = {k: i for i, k in enumerate(camp["fields"])}
    blanked = None
    for rowc in camp["campuses"]:
        if rowc[ci["state"]] == "LA":
            rowc[ci["enrolled"]], rowc[ci["term"]] = None, None
            blanked = rowc[ci["name"]]
            break
    with open(cpath, "w", encoding="utf-8") as fh:
        json.dump(camp, fh)
    run(["scripts/build_market_pages.py", usite, umarket])
    upath = os.path.join(usite, "louisiana-universities.html")
    if not os.path.exists(upath):
        FAILURES.append("market pages: an unknown Louisiana enrolment stopped the render")
    else:
        with open(upath, encoding="utf-8") as fh:
            uhtml = fh.read()
        check(blanked in uhtml,
              "market pages: a campus with no published enrolment was dropped from the "
              "page instead of listed as unknown")
        check("not published" in uhtml and "no published enrolment" in uhtml,
              "market pages: an unknown enrolment is not said out loud", uhtml[:400])
        check(">None<" not in uhtml and "None</td>" not in uhtml,
              "market pages: a null enrolment leaked onto the page as None")
    shutil.rmtree(usite, ignore_errors=True)
    shutil.rmtree(msite, ignore_errors=True)
    shutil.rmtree(mtree, ignore_errors=True)

    if FAILURES:
        print("FAIL — %d problem(s):" % len(FAILURES))
        for fmsg in FAILURES:
            print("  ✗ " + fmsg.replace("\n", "\n    "))
        return 1
    print("  ✓ all doctrine smoke tests pass (PII strip, sample floor, declared-field "
          "ranking, dry-run pairs, fleet parity, gates)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
