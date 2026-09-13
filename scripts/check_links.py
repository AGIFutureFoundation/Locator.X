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


def blog_slugs(root):
    """The slugs scripts/build_blog.py will publish, read from the frontmatter.

    An article that links to a sibling article writes the rendered filename -
    `other-article.html` - because that is what the link has to say in the
    built site, where the pages are siblings in articles/. On disk that target
    does not exist, so the plain file check below would call every cross-link
    broken. Resolving against the slugs keeps the check real: a link to an
    article that is not there still fails, and it fails for the right reason.
    """
    src = os.path.join(root, "content", "blog")
    slugs = set()
    if not os.path.isdir(src):
        return slugs
    for name in sorted(os.listdir(src)):
        if not name.endswith(".md"):
            continue
        with open(os.path.join(src, name), encoding="utf-8") as f:
            for line in f:
                if line.startswith("slug:"):
                    slugs.add(line.split(":", 1)[1].strip())
                    break
    return slugs


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    slugs = blog_slugs(root)
    blog_dir = os.path.join(root, "content", "blog")
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
                if (os.path.abspath(dirpath) == blog_dir and "/" not in link
                        and link.endswith(".html")):
                    if link[:-len(".html")] not in slugs:
                        broken.append((os.path.relpath(path, root),
                                       link + " (no article with that slug)"))
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
