#!/usr/bin/env python3
"""The link-rot sweep (roadmap v1.2): probe every external URL the repo cites as a source.

Covers the markdown documentation AND the sourced data files under market/ and
crosswalk/, because a row whose source URL has rotted is a row that can no longer
be checked — and those files carry the bulk of the platform's per-row citations.

Classifies each URL rather than pass/failing blindly:
  ok          2xx/3xx — alive
  auth-gated  401/403/999 — reachable but requires auth or blocks bots; not rot
  broken      404/410, 5xx, DNS failure, timeout — real rot, fix or remove
Exit code is 1 only when something is broken. Run quarterly (CI schedule) or by hand;
record the sweep date in the file headers you touch as a result.

--collect-only lists what would be probed, without network. The development container
has no general egress, so that is the mode this repository can verify locally; the
probing itself runs on GitHub runners.
"""
import os
import re
import ssl
import sys
import urllib.request

SKIP_DIRS = {".git", "node_modules", "__pycache__", "data", "raw", "geo", "pull"}
URL = re.compile(r"https?://[^\s<>()\"'\]`]+")
# Sourced data files whose per-row citations matter as much as the prose ones.
DATA_FILES = ("market/corridors.json", "market/projects.json", "market/campuses.json",
              "market/belts.json", "crosswalk/usecodes.json")
# The repo's own GitHub URLs are covered by the internal link checker, which resolves
# them against the tree rather than over the network; probing them here would only add
# rate-limit noise.
SELF = re.compile(r"^https?://github\.com/agifuturefoundation/locator\.x(?:$|[/.])", re.I)
# Published artifacts are private to their owner: anonymous probes cannot distinguish
# "gone" from "not yours", so a sweep result here would be meaningless either way.
# Their integrity is established by the sha256 manifest in market/editions.json and
# docs/PUBLISH_MAP.md, which is a stronger check than a 200 response.
ARTIFACT = re.compile(r"^https?://claude\.ai/code/artifact/", re.I)
TIMEOUT = 20
UA = {"User-Agent": "Mozilla/5.0 (Locator.X link-rot sweep; +https://github.com/agifuturefoundation/locator.x)"}


def harvest(path, root, found):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    for m in URL.finditer(text):
        url = m.group(0).rstrip(".,;:)]}`’”").rstrip('\\"')
        if SELF.match(url) or ARTIFACT.match(url):
            continue
        found.setdefault(url, set()).add(os.path.relpath(path, root))


def collect(root):
    found = {}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if name.endswith(".md"):
                harvest(os.path.join(dirpath, name), root, found)
    for rel in DATA_FILES:
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            # A declared source file that has vanished is a sweep gap, not a pass.
            raise SystemExit("link-rot: declared data file %s is missing" % rel)
        harvest(path, root, found)
    return found


def probe(url):
    ctx = ssl.create_default_context()
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, headers=UA, method=method)
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as resp:
                return resp.status
        except urllib.error.HTTPError as e:
            if method == "HEAD" and e.code in (405, 400, 501):
                continue  # server dislikes HEAD; retry as GET
            return e.code
        except Exception as e:
            if method == "HEAD":
                continue  # some hosts drop/reset HEAD but serve GET; never call it rot untried
            return "ERR " + type(e).__name__
    return "ERR"


def classify(status):
    if isinstance(status, int):
        if status < 400:
            return "ok"
        if status in (401, 403, 999, 429):
            return "auth-gated"
        return "broken"
    return "broken"


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    found = collect(root)
    if "--collect-only" in sys.argv:
        from_data = sum(1 for u, files in found.items()
                        if any(f.replace(os.sep, "/") in DATA_FILES for f in files))
        for url in sorted(found):
            print("%-6s %s" % (len(found[url]), url))
        print("\n%d URLs to probe · %d cited by a sourced data file"
              % (len(found), from_data))
        return 0
    buckets = {"ok": [], "auth-gated": [], "broken": []}
    for url in sorted(found):
        status = probe(url)
        kind = classify(status)
        buckets[kind].append((url, status, sorted(found[url])))
        print(f"{kind:10s} {status!s:8s} {url}")
    print()
    print(f"{len(buckets['ok'])} ok · {len(buckets['auth-gated'])} auth-gated · "
          f"{len(buckets['broken'])} broken · {len(found)} total")
    for url, status, files in buckets["broken"]:
        print(f"  BROKEN {status!s:8s} {url}  (in: {', '.join(files)})")
    return 1 if buckets["broken"] else 0


if __name__ == "__main__":
    sys.exit(main())
