#!/usr/bin/env python3
"""Check that every relative markdown link in the repo resolves to a real file.

Part of the documentation gate (see CONTRIBUTING.md). External URLs are not
fetched here — the roadmap's v1.2 link-rot sweep covers those; this check only
guards the internal cross-reference graph, which must never break.
"""
import os
import re
import sys

SKIP_DIRS = {".git", "node_modules", "__pycache__", "data", "raw", "geo", "pull"}
LINK = re.compile(r"\]\(([^)#\s]+?)(#[^)]*)?\)")

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    broken = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if not name.endswith(".md"):
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding="utf-8") as f:
                text = f.read()
            for m in LINK.finditer(text):
                link = m.group(1)
                if link.startswith(("http://", "https://", "mailto:")):
                    continue
                target = os.path.normpath(os.path.join(dirpath, link))
                if not os.path.exists(target):
                    broken.append((os.path.relpath(path, root), link))
    for source, link in broken:
        print(f"BROKEN  {source}: {link}")
    print(f"{len(broken)} broken relative links")
    return 1 if broken else 0

if __name__ == "__main__":
    sys.exit(main())
