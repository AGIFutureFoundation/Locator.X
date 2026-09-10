#!/usr/bin/env python3
"""check_pairs — every per-file builder's literal replace pairs must match source.

str.replace() cannot fail: when the shell prose changes under a builder, a stale
'find' silently no-ops and that edition ships with the ORIGINAL text. That is not
hypothetical — this check's first run (2026-09-10) found two pairs carried by nine
builders ('locator.x — Bay Area', 'San Francisco bay area') whose finds had never
matched any committed src/body.html: their editions were building with those
replacements silently skipped. build_state.py --dry-run guards its own spec
registry the same way; this guards the per-file builders, from a clean checkout —
no data tree, no node_modules, and no builder is executed.

What it extracts, via the ast module:
  - every (find, replace) tuple in a `for a,b in [...]: X = X.replace(a, b)` loop
  - every direct `X = X.replace('literal', 'literal')` call
  - every `X = re.sub(r'pattern', repl, X, ...)` with a literal pattern
where X is body, head, or app. Deliberate no-ops (find == replace) are skipped —
two builders keep them as placeholders. The app source is the src/ modules
concatenated, the same shortcut build_state.py --dry-run documents: enough to
verify app pairs without node_modules.

Exit 1 with every stale pair named. Run: python3 scripts/check_pairs.py
(tests/run.py runs it, so CI holds this on every push and PR. An optional
root argument points it at another tree — the test suite uses that to prove
a stale pair actually fails, not just that today's pairs pass.)
"""
import ast
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = ("body", "head", "app")


def extract(path):
    """(kind, target, literal) for every checkable replacement in one builder."""
    tree = ast.parse(open(path, encoding="utf-8").read())
    found = []
    for node in ast.walk(tree):
        # for a,b in [(find, repl), ...]: X = X.replace(a, b)
        if isinstance(node, ast.For) and isinstance(node.iter, ast.List):
            target = None
            for st in node.body:
                if (isinstance(st, ast.Assign) and isinstance(st.value, ast.Call)
                        and isinstance(st.value.func, ast.Attribute)
                        and st.value.func.attr == "replace"
                        and isinstance(st.value.func.value, ast.Name)):
                    target = st.value.func.value.id
            if target in TARGETS:
                for el in node.iter.elts:
                    if (isinstance(el, ast.Tuple) and len(el.elts) == 2
                            and all(isinstance(e, ast.Constant) for e in el.elts)
                            and el.elts[0].value != el.elts[1].value):
                        found.append(("replace", target, el.elts[0].value))
        if not (isinstance(node, ast.Assign) and isinstance(node.value, ast.Call)
                and isinstance(node.value.func, ast.Attribute)):
            continue
        call, fn = node.value, node.value.func
        # X = X.replace('literal', 'literal')
        if (fn.attr == "replace" and isinstance(fn.value, ast.Name)
                and fn.value.id in TARGETS and len(call.args) == 2
                and all(isinstance(a, ast.Constant) for a in call.args)
                and call.args[0].value != call.args[1].value):
            found.append(("replace", fn.value.id, call.args[0].value))
        # X = re.sub(r'pattern', repl, X, ...)
        if (fn.attr == "sub" and isinstance(fn.value, ast.Name) and fn.value.id == "re"
                and len(call.args) >= 3 and isinstance(call.args[0], ast.Constant)
                and isinstance(call.args[2], ast.Name) and call.args[2].id in TARGETS):
            found.append(("re.sub", call.args[2].id, call.args[0].value))
    return found


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else ROOT

    def read(p):
        return open(os.path.join(root, p), encoding="utf-8").read()

    src = {"body": read("src/body.html"), "head": read("src/head.html")}
    # src modules only: pairs never target the vendored libraries, and this keeps
    # the check runnable without node_modules (same rationale as the dry run).
    modules = re.findall(r"'(src/[^']+\.js)'", read("lxbuild.py"))
    src["app"] = "\n".join(read(m) for m in modules)

    builders = sorted(
        os.path.basename(p) for p in glob.glob(os.path.join(root, "build_*.py"))
        if not os.path.basename(p).startswith("build_data")
        and os.path.basename(p) != "build_state.py")   # has its own --dry-run

    total, stale = 0, []
    for b in builders:
        pairs = extract(os.path.join(root, b))
        total += len(pairs)
        for kind, target, lit in pairs:
            ok = (re.search(lit, src[target]) if kind == "re.sub"
                  else lit in src[target])
            if not ok:
                stale.append((b, kind, target, lit))
        print("  %-30s %3d pairs %s" % (b, len(pairs),
              "ok" if not any(s[0] == b for s in stale) else "STALE"))

    if stale:
        print("\nSTALE PAIRS — these replacements silently no-op today:")
        for b, kind, target, lit in stale:
            print("  %s: %s on %s finds nothing: %r" % (b, kind, target, lit))
        print("Fix the builder (or delete a pair whose text left the shell for good).")
        return 1
    print("  ✓ %d literal pairs across %d builders all match current source"
          % (total, len(builders)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
