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

PATHWAYS. content/tradeschool_paths.json is the one place a learning pathway (an
ordered walk across tracks for one kind of learner, ending in a named deliverable) is
written. This script validates every step against the modules the extractor loaded:
a step naming a track or module that is not on disk fails the build with the id
named. A path may list a track under "pending_tracks" while that track is written but
not yet shipped; its steps then render the module id marked "(pending)" and a warning
is printed. The allowance is temporary by construction: the generator FAILS the moment
a pending track exists, so the field has to be removed when the track ships.

Raises - never warns - when node is missing, the extractor fails, a track has no
source file, src/tradeschool.js no longer carries the certification wording and
the sourcing footnote this page quotes, or a pathway step names anything that was
not loaded.
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
PATHS = os.path.join(ROOT, "content", "tradeschool_paths.json")
PATH_STEPS = (8, 12)        # a pathway is a walk, not a track and not a module list
PATH_ID_RE = re.compile(r"^[a-z][a-z0-9-]*$")
MODULE_ID_RE = re.compile(r"^[a-z]+[0-9]+$")

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


def one_sentence(s):
    """True for a non-empty string that ends in one terminator and holds no other."""
    s = s.strip()
    return bool(s) and s[-1] in ".!?" and len(re.findall(r"[.!?](?:\s|$)", s)) == 1


def load_paths(data):
    """Read content/tradeschool_paths.json and hold every step to the extracted
    modules. Returns the paths with each step resolved to {track, module, title,
    pending}; raises on any step that names something not loaded."""
    if not os.path.exists(PATHS):
        die("%s is missing; the Pathways section is read from it, never typed"
            % os.path.relpath(PATHS, ROOT))
    with open(PATHS, encoding="utf-8") as fh:
        doc = json.load(fh)
    for key in ("_about", "reviewed", "paths"):
        if key not in doc:
            die("%s lacks %r" % (os.path.relpath(PATHS, ROOT), key))
    if not re.fullmatch(r"\d{4}-\d{2}", str(doc["reviewed"])):
        die("tradeschool_paths.json 'reviewed' must be YYYY-MM, got %r" % doc["reviewed"])
    paths = doc["paths"]
    if not isinstance(paths, list) or not paths:
        die("tradeschool_paths.json 'paths' must be a non-empty list")

    on_disk = {t["id"]: {m["id"]: m for m in t["modules"]} for t in data["tracks"]}
    seen_ids = set()
    out = []
    for i, p in enumerate(paths):
        where = "path #%d (%r)" % (i + 1, p.get("id"))
        for key in ("id", "name", "who", "blurb", "steps", "ends_in"):
            if not p.get(key):
                die("%s lacks %r" % (where, key))
        if not PATH_ID_RE.match(p["id"]):
            die("%s: id must be a lowercase slug" % where)
        if p["id"] in seen_ids:
            die("%s: duplicate path id" % where)
        seen_ids.add(p["id"])
        if not one_sentence(p["ends_in"]):
            die("%s: ends_in must be exactly one sentence naming the deliverable, got %r"
                % (where, p["ends_in"]))
        pending = p.get("pending_tracks", [])
        if not isinstance(pending, list) or not all(isinstance(x, str) for x in pending):
            die("%s: pending_tracks must be a list of track ids" % where)
        for tid in pending:
            if tid in on_disk:
                die("%s: pending_tracks names %r, but that track exists on disk (registered "
                    "with %d modules). The allowance is for a track that has not shipped; "
                    "remove %r from pending_tracks in %s - the field is temporary, never "
                    "permanent" % (where, tid, len(on_disk[tid]), tid, os.path.relpath(PATHS, ROOT)))
        steps = p["steps"]
        if not isinstance(steps, list) or not (PATH_STEPS[0] <= len(steps) <= PATH_STEPS[1]):
            die("%s: a pathway has %d-%d steps, this one has %s"
                % (where, PATH_STEPS[0], PATH_STEPS[1],
                   len(steps) if isinstance(steps, list) else "no list"))
        resolved, used_pending, seen_steps = [], set(), set()
        for n, s in enumerate(steps, 1):
            tid, mid = s.get("track") if isinstance(s, dict) else None, s.get("module") if isinstance(s, dict) else None
            if not tid or not mid:
                die("%s step %d: every step is {track, module}, got %r" % (where, n, s))
            if (tid, mid) in seen_steps:
                die("%s step %d: %s/%s is already a step of this path" % (where, n, tid, mid))
            seen_steps.add((tid, mid))
            if tid in on_disk:
                if mid not in on_disk[tid]:
                    die("%s step %d: track %r has no module %r (it has: %s)"
                        % (where, n, tid, mid, ", ".join(on_disk[tid])))
                resolved.append({"track": tid, "module": mid,
                                 "title": clean(on_disk[tid][mid]["t"]), "pending": False})
            elif tid in pending:
                if not MODULE_ID_RE.match(mid):
                    die("%s step %d: pending module id %r is not of the form letters+digits"
                        % (where, n, mid))
                used_pending.add(tid)
                resolved.append({"track": tid, "module": mid, "title": None, "pending": True})
            else:
                die("%s step %d: track %r is not registered on window.LXTS.TRACKS (registered: %s)"
                    % (where, n, tid, ", ".join(on_disk)))
        unused = sorted(set(pending) - used_pending)
        if unused:
            die("%s: pending_tracks names %s but no step uses it; a pending track is listed "
                "only while a step walks into it" % (where, ", ".join(map(repr, unused))))
        for tid in sorted(used_pending):
            print("gen_tradeschool: WARNING %s steps into pending track %r, which is not on disk; "
                  "its %d step(s) render as '(pending)'. Remove it from pending_tracks in %s once "
                  "src/ts_%s.js ships - the generator will fail until you do."
                  % (where, tid, sum(1 for r in resolved if r["track"] == tid),
                     os.path.relpath(PATHS, ROOT), tid), file=sys.stderr)
        out.append({"id": p["id"], "name": p["name"], "who": p["who"], "blurb": p["blurb"],
                    "steps": resolved, "ends_in": p["ends_in"].strip(),
                    "pending": sorted(used_pending)})
    return {"reviewed": doc["reviewed"], "paths": out}


def render(data, footnote, pathways):
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
    paths = pathways["paths"]
    n_paths = len(paths)
    n_steps = sum(len(p["steps"]) for p in paths)
    n_pending = sum(1 for p in paths for s in p["steps"] if s["pending"])
    pending_tracks = sorted({t for p in paths for t in p["pending"]})
    steps_bit = "%d steps" % n_steps
    if n_pending:
        steps_bit += " (%d of them into a track not yet on disk)" % n_pending

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
             "trade taxonomy: %d divisions, %d trades (%s) · %d pathways · %s.**"
             % (n_tracks, n_mod, n_live, trades["divisions"], trades["trades"], status_bits,
                n_paths, steps_bit))
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
    L.append("## Pathways")
    L.append("")
    L.append("A pathway is an ordered walk across tracks for one kind of learner, ending in one named "
             "deliverable. The %d below are written in "
             "[`content/tradeschool_paths.json`](../content/tradeschool_paths.json) (reviewed %s) and "
             "nowhere else; every step was resolved against the modules loaded above, so a step naming "
             "a track or module that is not on disk fails the build with the id named. Titles are the "
             "modules' own. A pathway orders lessons; it recommends nothing, and finishing one seals no "
             "credential — the certification check belongs to each track."
             % (n_paths, pathways["reviewed"]))
    if pending_tracks:
        L.append("")
        L.append("**Pending:** %d step(s) walk into %s, listed under `pending_tracks` because the track "
                 "is written but not yet registered on `window.LXTS.TRACKS`. Those steps show a module "
                 "id, not a title. The allowance expires on its own: the generator fails the build the "
                 "moment a track named there exists, so the field cannot outlive the gap it covers."
                 % (n_pending, ", ".join("`%s`" % t for t in pending_tracks)))
    L.append("")
    for p in paths:
        L.append('<a id="path-%s"></a>' % p["id"])
        L.append("")
        L.append("### %s" % clean(p["name"]))
        L.append("")
        L.append("*For:* %s · *Path id:* `%s` · %d steps" % (clean(p["who"]), p["id"], len(p["steps"])))
        L.append("")
        L.append(clean(p["blurb"]))
        L.append("")
        for n, s in enumerate(p["steps"], 1):
            if s["pending"]:
                L.append("%d. `%s` · `%s` (pending)" % (n, s["track"], s["module"]))
            else:
                L.append("%d. [`%s`](#%s) · %s" % (n, s["track"], s["track"], s["title"]))
        L.append("")
        L.append("*Ends in:* %s" % clean(p["ends_in"]))
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
             "drift; so is a pathway edited in `content/tradeschool_paths.json` without one, and so is "
             "a pathway step that names a module no track carries.")
    return "\n".join(L) + "\n"


def main(argv):
    data = measure()
    footnote = source_text()
    pathways = load_paths(data)
    md = render(data, footnote, pathways)
    n_tracks = len(data["tracks"])
    n_mod = sum(len(t["modules"]) for t in data["tracks"])
    n_paths = len(pathways["paths"])
    n_steps = sum(len(p["steps"]) for p in pathways["paths"])
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
              "(%d tracks, %d modules, %d pathways, %d steps)" % (n_tracks, n_mod, n_paths, n_steps))
        return 0
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(md)
    print("wrote %s (%d tracks, %d modules, %d pathways, %d steps)"
          % (os.path.relpath(OUT, ROOT), n_tracks, n_mod, n_paths, n_steps))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
