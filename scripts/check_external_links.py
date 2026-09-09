#!/usr/bin/env python3
"""The link-rot sweep (roadmap v1.2): probe every external URL in the repo's markdown.

Classifies each URL rather than pass/failing blindly:
  ok          2xx/3xx — alive
  auth-gated  401/403/999 — reachable but requires auth or blocks bots; not rot
  broken      404/410, 5xx, DNS failure, timeout — real rot, fix or remove
Exit code is 1 only when something is broken. Run quarterly (CI schedule) or by hand;
record the sweep date in the file headers you touch as a result.
"""
import os
import re
import ssl
import sys
import urllib.request

SKIP_DIRS = {".git", "node_modules", "__pycache__", "data", "raw", "geo", "pull"}
URL = re.compile(r"https?://[^\s<>()\"'\]`]+")
# The repo's own GitHub URLs: GitHub answers 404 (not 403) to anonymous requests while
# the repo is private, so probing them reports rot that isn't. The internal link checker
# covers self-references; the sweep skips them.
SELF = re.compile(r"^https?://github\.com/agifuturefoundation/locator\.x(?:$|[/.])", re.I)
TIMEOUT = 20
UA = {"User-Agent": "Mozilla/5.0 (Locator.X link-rot sweep; +https://github.com/agifuturefoundation/locator.x)"}


def collect(root):
    found = {}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if not name.endswith(".md"):
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding="utf-8") as f:
                text = f.read()
            for m in URL.finditer(text):
                url = m.group(0).rstrip(".,;:)]}`’”")
                if SELF.match(url):
                    continue
                found.setdefault(url, set()).add(os.path.relpath(path, root))
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
