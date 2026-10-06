#!/usr/bin/env python3
"""Generate curriculum/TRADE_SCHOOL.md — the docs-side catalog of the Trade School —
from the shipped modules themselves.

WHY THIS EXISTS. The 50-item curriculum has a source of truth (curriculum.py), a
generated catalog (courses/) and a gate that diffs them. The Trade School had none
of that: its tracks live only as code (src/tradeschool.js plus src/ts_*.js,
registering onto window.LXTS.TRACKS), so nothing outside the app said what it
teaches, and any document that tried would have been a hand copy with no check.

This script asks the app. curriculum/extract_tradeschool.js loads the real modules
under the same stub tests/trade_school_check.js uses and prints what registered —
track by track, module by module, with the file that registered each track — plus
the trade taxonomy counts from the generated src/trades_data.js. Every figure on the
page is one of those measurements. The only fixed text is the framing (what the
Trade School is beside the curriculum) and the sourcing section, whose one quoted
sentence is read out of src/tradeschool.js at build time so it cannot drift from
what the app shows.

    python3 curriculum/gen_tradeschool.py          # write curriculum/TRADE_SCHOOL.md
    python3 curriculum/gen_tradeschool.py --check  # regenerate to a string, exit 1 with a
                                                   # diff summary if the committed file differs

Raises - never warns - when node is missing, the extractor fails, a track has no
source file, or src/tradeschool.js no longer carries the certification wording and
the sourcing footnote this page quotes.
"""
import difflib
import html
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTRACT = os.path.join(ROOT, "curriculum", "extract_tradeschool.js")
TS_SRC = os.path.join(ROOT, "src", "tradeschool.js")
OUT = os.path.join(ROOT, "curriculum", "TRADE_SCHOOL.md")

sys.path.insert(0, os.path.join(ROOT, "curriculum"))
import curriculum as K  # noqa: E402  (the curriculum's item count is measured, not typed)

# The certification line this page prints. Each fragment must appear verbatim in
# src/tradeschool.js, or the generator refuses: the catalog states the check's
# rules only as long as the app enforces exactly those rules.
CERT_LINE = ("Certification: every module's drill question once, one attempt, no retries, "
             "≥ 75% first-attempt.")
CERT_EVIDENCE = ("one attempt each, no hints, no retries", "≥ 75% first-attempt",
                 "every module's question, once each, no retries")
FOOTNOTE_RE = re.compile(r'<p class="src"[^>]*>\s*(Licensing summaries in the California tracks.*?)</p>',
                         re.S)


def die(msg):
    raise SystemExit("gen_tradeschool: " + msg)


def measure():
    node = shutil.which("node")
    if not node:
        die("node is not on PATH; the catalog is measured from the shipped modules and "
            "cannot be produced without loading them")
    r = subprocess.run([node, EXTRACT], capture_output=True, text=True, cwd=ROOT)
    if r.returncode != 0:
        die("extract_tradeschool.js failed:\n" + (r.stdout + r.stderr)[-2000:])
    data = json.loads(r.stdout)
    if not data.get("tracks"):
        die("no tracks registered on window.LXTS.TRACKS")
    for t in data["tracks"]:
        if not t.get("source"):
            die("track %r registered but no file was recorded as registering it" % t.get("id"))
        if not t.get("modules"):
            die("track %r has no modules" % t.get("id"))
    return data


def source_text():
    with open(TS_SRC, encoding="utf-8") as fh:
        src = fh.read()
    for frag in CERT_EVIDENCE:
        if frag not in src:
            die("src/tradeschool.js no longer says %r - the certification line this page "
                "prints would be untrue; fix the page or the app, never the check" % frag)
    m = FOOTNOTE_RE.search(src)
    if not m:
        die("src/tradeschool.js render() no longer carries the sourcing footnote "
            "('Licensing summaries in the California tracks ...') this page quotes")
    footnote = re.sub(r"<[^>]+>", "", m.group(1))
    footnote = html.unescape(re.sub(r"\s+", " ", footnote)).strip()
    return footnote


def clean(s):
    return html.unescape(re.sub(r"\s+", " ", s)).strip()


def render(data, footnote):
    tracks = data["tracks"]
    trades = data["trades"]
    n_tracks = len(tracks)
    n_mod = sum(len(t["modules"]) for t in tracks)
    n_live = sum(1 for t in tracks for m in t["modules"] if m["hasLive"])
    by = trades.get("byStatus", {})
    status_bits = ", ".join("%d %s" % (by[k], k) for k in ("pattern", "state-specific", "federal") if k in by)
    extra = sorted(k for k in by if k not in ("pattern", "state-specific", "federal"))
    if extra:
        status_bits += ", " + ", ".join("%d %s" % (by[k], k) for k in extra)
    base = [t for t in tracks if t["source"] == "src/tradeschool.js"]
    deep = [t for t in tracks if t["source"] != "src/tradeschool.js"]

    L = []
    L.append("<!-- GENERATED by curriculum/gen_tradeschool.py from the shipped Trade School modules "
             "(src/tradeschool.js, src/ts_*.js, src/trades_data.js). Do not edit by hand: regenerate "
             "with python3 curriculum/gen_tradeschool.py; --check gates the build. -->")
    L.append("# The Trade School, catalogued")
    L.append("")
    L.append("> **GENERATED** by [`gen_tradeschool.py`](gen_tradeschool.py) from the shipped modules — "
             "every track and module below was loaded from `src/` by "
             "[`extract_tradeschool.js`](extract_tradeschool.js) and counted, not typed. Edit the "
             "modules, not this file; regenerate with `python3 curriculum/gen_tradeschool.py`. "
             "`--check` fails the build on a stale copy.")
    L.append("")
    L.append("The Trade School is the Academy's second body of lessons, beside the %d-item curriculum in "
             "[`curriculum.py`](curriculum.py) and its catalog in [`courses/`](courses/README.md). The "
             "curriculum teaches the subject by pillar and level; the Trade School teaches the **trade** by "
             "role — career tracks for the people a deal runs through (agents, lenders, managers, "
             "appraisers, contractors, developers, investors) and the counterparts they face. Each track "
             "has its own certification check, drawn from the modules' own drill questions, and seals a "
             "per-track credential in the app on a pass. Nothing here is accredited: no track confers a "
             "licence, a degree, continuing-education credit or standing with any regulator. It is "
             "education and navigation of the public record — what a requirement is, where it is "
             "published and how to verify it — never a recommendation, and never a substitute for the "
             "regulator's own page on the day you read it." % len(K.C))
    L.append("")
    L.append("**%d tracks · %d modules · %d with live components (drawn from the edition's own listings) · "
             "trade taxonomy: %d divisions, %d trades (%s).**"
             % (n_tracks, n_mod, n_live, trades["divisions"], trades["trades"], status_bits))
    L.append("")
    L.append("Tracks are listed in registry order — the order `window.LXTS.TRACKS` holds them after every "
             "module has loaded, which is the order the app renders. %d register in `src/tradeschool.js`; "
             "%d are deep tracks, each in its own `src/ts_*.js` file. \"Live\" marks a module that reads "
             "the running edition's listings into its lesson; the count of such modules is measured, "
             "not promised." % (len(base), len(deep)))
    L.append("")
    L.append("## Tracks")
    L.append("")
    L.append("| # | Track | Who it is for | Modules | Live | Registered by |")
    L.append("|---|-------|---------------|---------|------|---------------|")
    for i, t in enumerate(tracks, 1):
        live = sum(1 for m in t["modules"] if m["hasLive"])
        L.append("| %d | [%s](#%s) | %s | %d | %s | `%s` |"
                 % (i, clean(t["name"]), t["id"], clean(t["who"]), len(t["modules"]),
                    str(live) if live else "—", t["source"]))
    L.append("")
    for t in tracks:
        L.append('<a id="%s"></a>' % t["id"])
        L.append("")
        L.append("## %s" % clean(t["name"]))
        L.append("")
        L.append("*For:* %s · *Track id:* `%s` · *Source:* [`%s`](../%s)"
                 % (clean(t["who"]), t["id"], t["source"], t["source"]))
        L.append("")
        L.append(clean(t["blurb"]))
        L.append("")
        for n, m in enumerate(t["modules"], 1):
            L.append("%d. %s%s" % (n, clean(m["t"]), " · live" if m["hasLive"] else ""))
        L.append("")
        L.append(CERT_LINE)
        L.append("")
    L.append("## The certification check")
    L.append("")
    n_opts = sorted({m["drillOptions"] for t in tracks for m in t["modules"]})
    if len(n_opts) != 1:
        die("drill option counts differ across modules (%s); the catalog states one count" % n_opts)
    L.append("Every module carries one %d-option drill question. On the track page that drill is "
             "formative — unlimited tries, with the reason shown after a correct answer — and answering "
             "it marks the module *reviewed*. Reviewing every module unlocks the track's certification "
             "check, which asks the same questions again under different rules: all of them, once each, "
             "in one pass, no hints, no retries. A first-attempt score of 75%% or better seals the "
             "credential; a lower score is *not yet*, and the check can be retaken after review. The "
             "rules are quoted from the app, not restated: the generator refuses to write this page if "
             "`src/tradeschool.js` stops saying them. Every drill above was counted at %d options; "
             "[`tests/trade_school_check.js`](../tests/trade_school_check.js) fails the build on any "
             "other shape." % (n_opts[0], n_opts[0]))
    L.append("")
    L.append("## Where the words come from")
    L.append("")
    L.append("- **Original Locator.X writing.** Every lesson, drill and explanation in every track is "
             "written for Locator.X. No track reproduces a textbook, a course provider's material or a "
             "regulator's text.")
    L.append("- **The California tracks** (the tracks registered by `src/tradeschool.js` that touch "
             "licensing) summarise public pages of the California DRE, NMLS and BREA as read in "
             "September 2026, and say so inside the app. The footnote the Trade School page renders, "
             "quoted from `render()` in [`src/tradeschool.js`](../src/tradeschool.js):")
    L.append("")
    L.append("  > " + footnote)
    L.append("")
    L.append("- **The any-state tracks** (%s) state patterns — how a regulator is built, what every "
             "licence shares, how a scope is decomposed, where each approval in the permission stack is "
             "recorded — and **no state's numbers**: no hour count, fee, bond amount, window or deadline. "
             "Each such figure is named as a category the learner looks up with the issuing authority and "
             "records with the date. `tests/trade_school_check.js` requires every module in these tracks "
             "to carry a source paragraph and to contain no advice."
             % ", ".join("`%s` in `%s`" % (t["id"], t["source"]) for t in deep))
    L.append("- **The trade taxonomy** the contractor track's matching desk reads has one source, "
             "[`crosswalk/trades.json`](../crosswalk/trades.json). `src/trades_data.js` is generated from "
             "it by `scripts/gen_trades_js.py`, which also refuses any licence pattern containing a digit; "
             "the %d divisions and %d trades counted above are that file's, loaded through the app."
             % (trades["divisions"], trades["trades"]))
    L.append("")
    L.append("## Regenerating")
    L.append("")
    L.append("`python3 curriculum/gen_tradeschool.py` rewrites this page from the modules; "
             "`python3 curriculum/gen_tradeschool.py --check` (run by `tests/run.py`, so by CI) "
             "regenerates it to a string and fails on any difference from the committed copy. A module "
             "added, renamed or removed in `src/` without a regeneration is a red build, not a quiet "
             "drift.")
    return "\n".join(L) + "\n"


def main(argv):
    data = measure()
    footnote = source_text()
    md = render(data, footnote)
    n_tracks = len(data["tracks"])
    n_mod = sum(len(t["modules"]) for t in data["tracks"])
    if "--check" in argv:
        if not os.path.exists(OUT):
            print("gen_tradeschool --check: %s does not exist; run without --check"
                  % os.path.relpath(OUT, ROOT))
            return 1
        with open(OUT, encoding="utf-8") as fh:
            current = fh.read()
        if current != md:
            diff = list(difflib.unified_diff(current.splitlines(), md.splitlines(),
                                             "committed", "regenerated", lineterm="", n=0))
            changed = [l for l in diff[2:] if l[:1] in "+-" and not l.startswith(("+++", "---"))]
            print("gen_tradeschool --check: %s is not what the shipped modules generate - it has been "
                  "hand-edited, or a module changed and nobody regenerated. %d line(s) differ. Run "
                  "python3 curriculum/gen_tradeschool.py" % (os.path.relpath(OUT, ROOT), len(changed)))
            for l in changed[:20]:
                print("  " + l)
            if len(changed) > 20:
                print("  ... %d more" % (len(changed) - 20))
            return 1
        print("gen_tradeschool --check: curriculum/TRADE_SCHOOL.md matches the shipped modules "
              "(%d tracks, %d modules)" % (n_tracks, n_mod))
        return 0
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(md)
    print("wrote %s (%d tracks, %d modules)" % (os.path.relpath(OUT, ROOT), n_tracks, n_mod))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
