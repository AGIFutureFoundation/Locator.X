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
  9. The link-rot sweep still covers the sourced per-row citations.
 10. The generated lodging expansion plan matches the measured layer.
 11. The synthetic fixture builds reproducibly; no deploy-generated page is also
     committed under pages/; and every article
     figure and chart resolves from the committed measured data.

Run: python3 tests/run.py    (CI runs it on every push and PR)
Everything writes only to a temp dir; fixtures are generated, obviously synthetic
values — nothing here asserts anything about the real world.
"""
import json
import os
import re
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

    # ---- 4c. no view ships into every edition and opens in none ------------
    # Each spec hides the tabs that edition does not want. Nothing stopped a
    # view from being hidden by ALL of them, and one was: the house-hack finder
    # is inlined into all eleven editions and cannot be opened in any. Every
    # spec author made a local decision; the emergent result was nobody's.
    #
    # The check runs BOTH ways. An undeclared view hidden everywhere fails, and
    # so does a declared view that some edition has started showing again —
    # otherwise the declaration table rots into a lie nobody notices.
    body_html = open(os.path.join(ROOT, "src/body.html"), encoding="utf-8").read()
    all_views = set(re.findall(r'data-view="([a-z0-9]+)"', body_html))
    shipped_specs = {k: v for k, v in build_state.SPECS.items()
                     if not k.endswith("-template")}
    check(len(shipped_specs) == 11,
          "reachability: expected 11 shipped specs, found %d" % len(shipped_specs))
    hidden_everywhere = {v for v in all_views
                         if all(v in sp["hide_tabs"] for sp in shipped_specs.values())}
    declared = set(build_state.UNREACHABLE_VIEWS)
    undeclared = sorted(hidden_everywhere - declared)
    check(not undeclared,
          "reachability: %s ship%s in every edition and open%s in none, undeclared"
          % (", ".join(undeclared), "s" if len(undeclared) == 1 else "",
             "s" if len(undeclared) == 1 else ""),
          "Either give an edition a reason to show it, drop it from "
          "lxbuild.MODULES, or declare it in build_state.UNREACHABLE_VIEWS "
          "with the reason.")
    stale = sorted(declared - hidden_everywhere)
    check(not stale,
          "reachability: %s declared unreachable but some edition now shows it"
          % ", ".join(stale),
          "Remove it from build_state.UNREACHABLE_VIEWS — a stale declaration "
          "is worse than none.")
    for v, why in build_state.UNREACHABLE_VIEWS.items():
        check(v in all_views,
              "reachability: %r is declared unreachable but is not a view in "
              "src/body.html at all" % v)
        check(len(why or "") > 40,
              "reachability: %r is declared without a real reason" % v)

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

    # ---- 9. the link-rot sweep actually covers the sourced citations -------
    # The sweep walked only markdown, where this repo keeps almost no URLs, so
    # it exited zero while checking essentially nothing. The per-row citations
    # live in the data files; assert they are in the sweep set so the coverage
    # cannot silently go vacuous again.
    out = run(["scripts/check_external_links.py", "--collect-only"])
    tail = out.strip().splitlines()[-1] if out.strip() else ""
    cited = 0
    m = re.search(r"(\d+) cited by a sourced data file", tail)
    if m:
        cited = int(m.group(1))
    check(cited >= 300,
          "link-rot: only %d URLs come from sourced data files - the sweep has gone "
          "vacuous over the citations that matter" % cited, tail)
    check("opportunitylouisiana.gov" in out,
          "link-rot: the announced-project sources are not in the sweep set")
    check("laregents.edu" in out or "subr.edu" in out,
          "link-rot: the campus enrolment sources are not in the sweep set")

    # ---- 10. the lodging expansion plan is derived, not drifting -----------
    run(["scripts/hotel_candidates.py", "--check"])

    # ---- 10b. corridor pull readiness is derived from the probe record ------
    # "Add properties to the corridors" is 24 different jobs and the difference
    # is already measured in market/corridors.json. The page that sorts them
    # must never be hand-edited away from those verdicts.
    run(["scripts/corridor_readiness.py", "--check"])

    # ---- 10c. the coverage roll-up is derived, and the vocabulary is closed --
    # Eleven state files hold ninety gate rows; the sum was stated nowhere. The
    # roll-up states it, and refuses to bucket a status outside the five terms
    # the directory's own README defines - an invented status is exactly the
    # drift that directory exists to prevent.
    run(["scripts/coverage_rollup.py", "--check"])

    # ---- 10d. generative video stays inside its boundary --------------------
    # The Academy scene library is the one place this platform generates
    # pictures rather than reporting them. The generator refuses any prompt that
    # names a real place, reads like an address, is a tagline rather than a
    # paragraph, asks for more than one shot, or fails to re-establish its world
    # before morphing. A synthesized picture of a real address is a stronger
    # claim than a fabricated number, and this platform refuses the number.
    run(["scripts/build_scenes.py", "--check"])
    scenes = json.load(open(os.path.join(ROOT, "content/academy_scenes.json"),
                            encoding="utf-8"))
    # Scan the PROMPTS, not the document. The library's own policy sentence
    # says generative video never attaches to a parcel record, and a blanket
    # scan of the file flagged that sentence — the gate was reading the rule as
    # a violation of itself.
    prompts = " ".join(sc.get("initial", "") + " " + sc.get("evolution", "")
                       for sc in scenes["scenes"]).lower()
    for word in ("parcel", "listing", "property record", "assessed", "for sale"):
        check(word not in prompts,
              "a scene prompt mentions %r — generative video never depicts a "
              "record on this platform" % word)
    check("the_line" in scenes and "never" in scenes["the_line"].lower(),
          "scene library does not state the boundary it operates under")

    # ---- 12. the closing packet is derived, and states nothing on its own ---
    run(["scripts/build_packet.py", "--check"])
    packet = json.load(open(os.path.join(ROOT, "content/closing_packet.json"),
                            encoding="utf-8"))
    # Every state-sensitive clause must be a QUESTION. The whole reason this
    # platform can ship transaction material at all is that it asks rather than
    # asserts (docs/CONTRACT_ANATOMY.md), and the failure mode is a well-meaning
    # edit that turns one row into a statement of what some state's law is.
    for c in packet["clauses"]:
        check(c["ask_counsel"].rstrip().endswith("?"),
              "clause %r does not ask a question: %r" % (c["id"], c["ask_counsel"]),
              "state-sensitive rows are questions for counsel, never claims about "
              "what the law says")
    # The packet's state layer must be exactly what the guides publish. If the
    # generated table ever carries a state the sourced table does not, something
    # invented a row.
    pjs = open(os.path.join(ROOT, "src/packet_data.js"), encoding="utf-8").read()
    pdata = json.loads(pjs[pjs.index("=") + 1:].rstrip().rstrip(";"))
    guides = open(os.path.join(ROOT, "docs/states/README.md"), encoding="utf-8").read()
    for st in pdata["states"]:
        check(("| %s |" % st["state"]) in guides,
              "packet carries state %r, which is not a row in docs/states/README.md"
              % st["state"])
    check(len(pdata["states"]) == 51,
          "packet state layer has %d rows, not 51 (50 states + DC)"
          % len(pdata["states"]))

    # ---- 12b. no edition ships a hardcoded state in its paperwork ----------
    # The Letter of Intent printed ", CA " into every address in every edition,
    # including the New Orleans ones, because the state was a literal in
    # src/underwrite.js rather than a fact resolved from the record. The state
    # now comes from EDITION_STATE, which build_state.py rewrites per spec.
    uwsrc = open(os.path.join(ROOT, "src/underwrite.js"), encoding="utf-8").read()
    check(", CA " not in uwsrc and ", CA$" not in uwsrc,
          "src/underwrite.js contains a hardcoded state — paperwork must resolve "
          "the state from the record (src/packet.js addressLine)")
    import build_state as _bs
    multi = {"uscorridor", "usnew5", "uswide"}
    for key, spec in _bs.SPECS.items():
        pairs = [b for a, b in spec["app_pairs"] if "EDITION_STATE" in a]
        if key in multi or key.endswith("-template"):
            check(not pairs,
                  "spec %r declares a state, but it spans several (or is a refusing "
                  "template) — it must resolve to unknown" % key)
        else:
            check(len(pairs) == 1,
                  "spec %r does not declare its state; its closing packet would "
                  "report unknown for an edition that covers exactly one state" % key)
            if pairs:
                name = pairs[0].split("'")[1]
                check(("| %s |" % name) in guides,
                      "spec %r declares state %r, which is not a row in the state "
                      "table" % (key, name))

    # ---- 11c. the synthetic fixture is actually deterministic --------------
    # The fixture calls itself deterministic, and was not: it emitted the city
    # series from a set(), whose iteration order over strings moves with
    # PYTHONHASHSEED, so three builds of identical code produced three different
    # files. Only key ORDER moved, inside a packed payload nobody diffs, which
    # is why it survived. Build the fixture twice and compare the decompressed
    # payloads — the page bytes carry a gzip timestamp, so compare content.
    import base64 as _b64, gzip as _gz
    def _payloads(path):
        txt = open(path, encoding="utf-8", errors="replace").read()
        return [_gz.decompress(_b64.b64decode(m.group(1)))
                for m in re.finditer(r'atob\("([A-Za-z0-9+/=]{200,})"\)', txt)]
    # Say the actual cause rather than letting a FileNotFoundError out of the
    # builder stand in for it: the fleet demo inlines d3-delaunay, maplibre,
    # fflate and terser, and CI failed for six runs with a traceback that never
    # named the missing install.
    if not os.path.isdir(os.path.join(ROOT, "node_modules", "d3-delaunay")):
        FAILURES.append(
            "node_modules is absent, so the fixture determinism guard cannot "
            "build the demo. Run `npm ci` (CI does this before the smokes).")
    d1 = os.path.join(tempfile.mkdtemp(), "a.html")
    d2 = os.path.join(tempfile.mkdtemp(), "b.html")
    run(["scripts/build_fleet_demo.py", d1, "--fragment"])
    run(["scripts/build_fleet_demo.py", d2, "--fragment"])
    if os.path.exists(d1) and os.path.exists(d2):
        p1, p2 = _payloads(d1), _payloads(d2)
        check(p1 == p2, "the synthetic fixture is not reproducible: two builds of "
                        "identical code produced different payloads")
    else:
        FAILURES.append("fixture determinism check could not build the demo")

    # ---- 11b. every article figure resolves from committed data ------------
    # An article states numbers in prose and draws them in charts; both come from
    # market/*.json at build time so the two can never disagree. This fails if an
    # article asks for a figure or a chart the data cannot answer.
    run(["scripts/build_blog.py", "--check"])

    # ---- 11b2. the walkthrough packer still carries its copy --------------
    # scripts/pack_walkthrough.py builds the single-file tour, and the part a
    # human actually reads - the chapter captions and the ready-to-post text -
    # lives in that file rather than in the footage. An empty caption ships a
    # silent chapter, so the copy is checked even though the video is not here.
    run(["scripts/pack_walkthrough.py", "--check"])

    # ---- 11b3. competitor claims keep their sources -----------------------
    # docs/market/LANDSCAPE.md is the ONLY place a pricing claim about another
    # vendor may live, and docs/market/GAP.md is the only place this repository
    # claims a capability against one. Both are the easiest documents in the
    # project to quietly inflate - nobody re-counts a competitor's tier sheet,
    # and nobody re-counts a module they wrote. The validator re-counts both: a
    # priced row without a source link, a status outside the vocabulary, an
    # undated verification, a figure surviving in an unsourced row, or a module
    # line count that has drifted all stop the build.
    run(["scripts/validate_landscape.py"])

    # ---- 11b4. the company layer cannot drift into a pitch deck -----------
    # docs/company/ is where a product NAME meets a product, and where
    # securities-adjacent language would first appear. Being wrong about a
    # competitor's price is embarrassing; stating a projected return as fact,
    # soliciting an investment, or implying that software equity conveys
    # ownership of portfolio property is a legal exposure. The operating brief
    # forbids all three pending counsel review, and every rule in this project
    # that mattered got a validator rather than a policy - a policy is
    # remembered until the week it is inconvenient.
    run(["scripts/validate_company.py"])

    # ---- 11b5. the investor deck states no figure it did not measure --------
    # content/investor/DECK.md carries {{placeholders}} and no digits. A deck is
    # the one document that gets screenshotted, forwarded and quoted back six
    # months later, so a number typed into it is a number nobody will ever
    # re-check. build_deck.py --check re-measures every figure, refuses a
    # placeholder nothing measures, refuses a measured figure nobody quotes, and
    # refuses a digit outside the fenced round-terms block - which states a
    # management plan and a rule number, neither of which can be measured.
    run(["scripts/build_deck.py", "--check"])

    # ---- 11b8. social copy states no figure it did not measure -------------
    # Same rule as the deck, for a sharper reason: a number in a public post
    # cannot be corrected in anybody else's feed. build_social.py also refuses
    # markdown emphasis, which LinkedIn renders as literal asterisks on the one
    # word meant to carry weight, and a post over the platform's character
    # limit, which the feed truncates mid-sentence - usually on the qualifier.
    # The securities lint in validate_company.py covers content/ too, so a
    # solicitation in a PUBLIC post fails the build twice over.
    run(["scripts/build_social.py", "--check"])

    # ---- 11b6. the feasibility map cannot overstate a market ---------------
    # scripts/standard_feasibility.py reports how many of the Investment
    # Standard's requirements a market's public record can answer AT ALL. Its
    # one dangerous failure is silently OVERSTATING a ceiling, which is what
    # happens if src/standards.js gains a requirement the field map does not
    # know about: an unmapped requirement counts as answerable. The script fails
    # the build in that case rather than quietly reporting a better market than
    # exists.
    run(["scripts/standard_feasibility.py", "--check"])

    # ---- 11b6. the curriculum has ONE source of truth ---------------------
    # curriculum-50.csv was hand-maintained ALONGSIDE curriculum.py, and both
    # were called "the source of truth" in different documents - including in
    # the README that gen_courses.py emits. Two authoritative copies of the same
    # facts with nothing checking they agree is a drift waiting to happen: the
    # CSV feeds the course pages and scripts/build_packet.py, curriculum.py
    # feeds validate.py, gen_env.py and the blog, so a title changed in one
    # would keep being cited from the other until somebody noticed by eye.
    #
    # The CSV is now derived. This regenerates it and fails if the file on disk
    # is not what curriculum.py says - the same regenerate-and-diff check
    # curriculum/courses/ and docs/EXPANSION.md already get. It catches a
    # hand-edited CSV and a curriculum.py change nobody regenerated after,
    # which are the same failure from opposite ends.
    csv_path = os.path.join(ROOT, "curriculum", "curriculum-50.csv")
    before = open(csv_path, encoding="utf-8").read()
    run(["curriculum/gen_courses.py"])
    after = open(csv_path, encoding="utf-8").read()
    check(before == after,
          "curriculum/curriculum-50.csv is not what curriculum.py generates - it has been "
          "hand-edited, or curriculum.py changed and nobody regenerated. There is one source "
          "of truth and it is curriculum.py; regenerate, never patch.")

    # ---- 11b7. the expansion ranking is generated, and regenerates clean ----
    # docs/EXPANSION.md is a derived document: it ranks every market by what its
    # public record can answer against measured submarket demand. Derived things
    # are generated, never edited, so the check is the same one gen_courses.py
    # gets - regenerate and diff. A hand-edited expansion ranking is a strategy
    # document that has quietly stopped matching the inventory it claims to read.
    # The coverage inventory and the crosswalk record the same fact twice, for
    # two different readers. Nothing checked they agreed until an expansion
    # report guessed "probably a documentation gap" and the crosswalk said
    # otherwise for three of four markets. A guess that survives one round
    # becomes a plan in the next.
    run(["scripts/crosscheck_sources.py"])
    run(["scripts/expansion_rank.py", "--check"])
    before = open(os.path.join(ROOT, "docs", "EXPANSION.md"), encoding="utf-8").read()
    run(["scripts/expansion_rank.py", "--write", os.path.join(ROOT, "docs", "EXPANSION.md")])
    after = open(os.path.join(ROOT, "docs", "EXPANSION.md"), encoding="utf-8").read()
    check(before == after,
          "docs/EXPANSION.md is not what scripts/expansion_rank.py generates - it has "
          "been hand-edited, or the inventory moved under it. Regenerate, never patch.")

    # ---- 11c. the published-edition map still parses ----------------------
    # tests/edition_sweep.js is the gate between "built with real data" and
    # "republished": it checks each built edition's title and RECORD COUNT against
    # docs/PUBLISH_MAP.md, because file size is not the integrity check and a short
    # build looks exactly like a good one. The sweep itself needs the data tree, so
    # what runs here is its --parse-only mode: the document it is driven by must
    # keep parsing, and must keep naming every edition and every documented count.
    node = shutil.which("node")
    if not node:
        FAILURES.append("node is not on PATH, so the edition-sweep parse check "
                        "could not run — it is the only thing guarding the "
                        "published-edition map from becoming unparseable")
    else:
        r = subprocess.run([node, "tests/edition_sweep.js", "--parse-only"],
                           capture_output=True, text=True, cwd=ROOT)
        out = r.stdout + r.stderr
        check(r.returncode == 0, "edition_sweep --parse-only failed", out[-1500:])
        m = re.search(r"edition_sweep: (\d+) editions .*?, (\d+) carrying", out)
        check(bool(m), "edition_sweep --parse-only printed no summary line", out[-800:])
        if m:
            check(int(m.group(1)) >= 12,
                  "docs/PUBLISH_MAP.md now parses to %s editions — it listed 12; a row "
                  "that stops parsing is an edition that stops being checked before "
                  "republish" % m.group(1))
            check(int(m.group(2)) >= 4,
                  "only %s edition(s) carry a documented record count — the count is "
                  "THE integrity check before a republish" % m.group(2))

    # ---- 11. no generated page is ALSO committed under pages/ --------------
    # The market pages became a deploy-time build product, and a committed copy
    # survived the change anyway: it was never actually recorded as deleted, so
    # the repository carried stale duplicates of files the deploy regenerates.
    # They shadowed nothing at deploy (the generator runs after the copy) which
    # is exactly why nobody noticed. Assert the two sets are disjoint.
    gendir = tempfile.mkdtemp()
    run(["scripts/build_market_pages.py", gendir])
    generated = {f for f in os.listdir(gendir) if f.endswith(".html")}
    committed = set(os.listdir(os.path.join(ROOT, "pages")))
    both = sorted(generated & committed)
    check(not both,
          "pages/: %s %s generated at deploy AND committed - a derived file with a "
          "stale twin" % (", ".join(both), "is" if len(both) == 1 else "are"))
    shutil.rmtree(gendir, ignore_errors=True)
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
