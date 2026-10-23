#!/usr/bin/env python3
"""make_qr — render a contact QR code into brand/qr/.

The QR is generated, never hand-drawn, so the encoded URL is the one in this
file and nothing else. Error correction is H (30%) so the code still scans when
printed small or partly covered by a logo sticker.

Needs `segno` (pure Python, no network): pip install segno

Usage:
  python3 scripts/make_qr.py                 regenerate every code below
  python3 scripts/make_qr.py --check         fail if a committed SVG is stale
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "brand", "qr")

# name -> URL. Supplied by the platform owner (2026-10-19); a link, not a
# biography — the instructor profile still ships empty.
CODES = {
    "linkedin-infogurus": "https://www.linkedin.com/in/infogurus",
}


def render(url):
    import segno
    qr = segno.make(url, error="h", micro=False)
    buf = io.BytesIO()
    qr.save(buf, kind="svg", scale=10, border=4, dark="#0b1f33", light="#ffffff",
            xmldecl=False, svgns=True, title=url)
    return qr, buf.getvalue().decode("utf-8")


def main():
    check = "--check" in sys.argv
    os.makedirs(OUT, exist_ok=True)
    stale = []
    for name, url in CODES.items():
        qr, svg = render(url)
        path = os.path.join(OUT, name + ".svg")
        if check:
            if not os.path.exists(path) or open(path, encoding="utf-8").read() != svg:
                stale.append(path)
            continue
        open(path, "w", encoding="utf-8").write(svg)
        qr.save(os.path.join(OUT, name + ".png"), scale=20, border=4,
                dark="#0b1f33", light="#ffffff")
        print("wrote", path, "->", url)
    if stale:
        sys.exit("stale QR (run scripts/make_qr.py): " + ", ".join(stale))


if __name__ == "__main__":
    main()
