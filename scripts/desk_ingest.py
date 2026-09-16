#!/usr/bin/env python3
"""Ingest a desk-browser pull: reassemble the transferred slices, verify them,
strip PII, and write one canonical JSON file into the ignored data tree.

WHY THIS EXISTS. Container egress to every county GIS host is policy-blocked
(the gateway answers 403 to CONNECT for every host, re-measured 2026-09-16), so
the public record arrives over the desk browser, packed by
scripts/desk/pull_driver.js into gzip+base64 and carried across in 240,000-
character slices. docs/PULL_RECIPE.md described reassembling those slices with a
script at /root/bayarea/grab.py plus a hand-typed python one-liner that asserted
the length. That script was never in this repository and no longer exists
anywhere, so an operator following the recipe today fails at the transfer step
with a missing file — and the hand-typed assertion is exactly the kind of check
that gets skipped at 2am when the pull finally worked.

WHAT IT VERIFIES, none of it optional:

  1. Every intermediate slice is exactly 240,000 characters and only the last is
     short. A silently truncated slice produces a corrupt gzip stream, which
     sometimes still decompresses into fewer rows than were pulled.
  2. The reassembled base64 length matches the length the driver reported. This
     is the check the recipe asked an operator to type by hand.
  3. The envelope says the pull completed cleanly, carries its source URL, and
     its own row count matches the rows actually present.
  4. No column carries owner identity. The driver refuses these before fetching;
     this is the second gate, because one side refusing is a policy and two
     sides refusing is a guarantee.
  5. Every row has the same arity as the declared column list. A ragged row set
     means the map function and the column names disagree, and every consumer
     downstream would be reading a shifted column.

It writes nothing on any failure. A partial or unverifiable pull is reported and
discarded: a stub file is worse than no file, because the next session cannot
tell it from a real one.

Usage:
    python3 scripts/desk_ingest.py --slices <dir-or-file>... --out data/<name>.json
                                   [--expect-b64 <length>] [--jurisdiction <jid>]
    python3 scripts/desk_ingest.py --selftest
"""
import argparse
import base64
import gzip
import json
import os
import re
import sys

SLICE = 240000

# The same identity patterns the driver refuses before fetching. Kept in step
# with scripts/desk/pull_driver.js; tests/desk_roundtrip.js checks a pull whose
# column list carries one is refused HERE as well as there.
PII = [
    re.compile(p, re.I) for p in (
        r"^own[_ ]?", r"^fidu", r"owner.*name", r"name.*owner",
        r"^grantee", r"^grantor", r"^taxpayer", r"^mail.*name",
        r"^deed.*name", r"^first.?name$", r"^last.?name$", r"^full.?name$",
    )
]


def die(msg):
    sys.exit("desk_ingest: " + msg)


def pii_hits(cols):
    out = []
    for c in cols or []:
        t = str(c).strip()
        if any(p.search(t) for p in PII):
            out.append(t)
    return out


def read_slice(path):
    """One transferred slice. The bridge saves an overflowing tool result as a
    JSON envelope whose `text` holds the payload, so accept either that or a
    bare payload file — and strip only characters that cannot be base64, never
    by position. The envelope's own keys are alphanumeric and would survive a
    naive regex, which is the trap the old recipe warned about."""
    raw = open(path, encoding="utf-8", errors="replace").read()
    s = raw.strip()
    if s.startswith("{") or s.startswith("["):
        try:
            doc = json.loads(s)
        except ValueError:
            die("%s looks like a JSON envelope but does not parse" % path)
        text = None
        if isinstance(doc, dict):
            t = doc.get("text")
            if isinstance(t, list) and t:
                t = t[0]
            if isinstance(t, dict):
                t = t.get("text")
            text = t
        elif isinstance(doc, list) and doc:
            first = doc[0]
            text = first.get("text") if isinstance(first, dict) else None
        if not isinstance(text, str):
            die("%s is a JSON envelope with no string `text` payload" % path)
        s = text.strip()
    return re.sub(r"[^A-Za-z0-9+/=]", "", s)


def collect(paths):
    files = []
    for p in paths:
        if os.path.isdir(p):
            got = sorted(
                (os.path.join(p, f) for f in os.listdir(p)),
                key=lambda f: [int(x) if x.isdigit() else x
                               for x in re.split(r"(\d+)", os.path.basename(f))],
            )
            files.extend(g for g in got if os.path.isfile(g))
        else:
            files.append(p)
    if not files:
        die("no slice files found")
    return files


def ingest(paths, out, expect_b64=None, jurisdiction=None, quiet=False):
    files = collect(paths)
    parts = [read_slice(f) for f in files]

    # 1. slice geometry
    for i, (f, part) in enumerate(zip(files, parts)):
        last = i == len(parts) - 1
        if not last and len(part) != SLICE:
            die("slice %d (%s) is %d characters, not %d. Every intermediate slice must be "
                "exactly one slice wide; a short one means the transfer was truncated."
                % (i, os.path.basename(f), len(part), SLICE))
        if last and len(part) > SLICE:
            die("the last slice (%s) is %d characters, longer than one slice"
                % (os.path.basename(f), len(part)))
    b64 = "".join(parts)

    # 2. the length the driver reported
    if expect_b64 is not None and len(b64) != expect_b64:
        die("reassembled %d base64 characters but the driver packed %d. Slices are "
            "missing, duplicated or out of order — nothing was written."
            % (len(b64), expect_b64))

    try:
        env = json.loads(gzip.decompress(base64.b64decode(b64)))
    except Exception as e:  # noqa: BLE001 - the cause is reported, not swallowed
        die("the reassembled payload did not decode (%s: %s). This is what a truncated or "
            "reordered transfer looks like." % (type(e).__name__, e))

    # 3. the envelope means what it says
    if not isinstance(env, dict) or env.get("desk_pull") != 1:
        die("this is not a desk-pull envelope (no desk_pull marker)")
    if not env.get("source"):
        die("the envelope names no source URL. A pull whose origin is unrecorded cannot be "
            "re-pulled or cited, and this repository does not carry rows it cannot source.")
    rows = env.get("rows")
    if not isinstance(rows, list) or not rows:
        die("the envelope carries no rows")
    if env.get("n") != len(rows):
        die("the envelope claims %r rows and carries %d" % (env.get("n"), len(rows)))

    # 4. PII, refused a second time
    cols = env.get("columns")
    bad = pii_hits(cols) + pii_hits(str(env.get("requested_fields", "")).split(","))
    if bad:
        die("refused: the pull carries owner-identity column(s): %s. Owner fields are "
            "stripped on ingest and git history cannot be cleaned later." % ", ".join(sorted(set(bad))))

    # 5. row arity
    if cols:
        width = len(cols)
        ragged = [i for i, r in enumerate(rows) if not isinstance(r, list) or len(r) != width]
        if ragged:
            die("%d row(s) do not match the %d declared columns (first at index %d). A shifted "
                "column reads as real data downstream." % (len(ragged), width, ragged[0]))

    if jurisdiction:
        env["jurisdiction"] = jurisdiction
    env["ingested_b64_chars"] = len(b64)
    env["ingested_slices"] = len(parts)

    d = os.path.dirname(os.path.abspath(out))
    if d:
        os.makedirs(d, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(env, f)

    if not quiet:
        print("desk pull ingested")
        print("  source        %s" % env["source"])
        print("  jurisdiction  %s" % (env.get("jurisdiction") or "(unnamed)"))
        print("  rows          %d over %s page(s)" % (len(rows), env.get("pages", "?")))
        print("  columns       %s" % (", ".join(cols) if cols else "(undeclared)"))
        print("  transfer      %d slices, %d base64 chars, verified" % (len(parts), len(b64)))
        print("  pulled (UTC)  %s" % env.get("pulled_utc"))
        print("  wrote         %s" % out)
    return env


def selftest():
    """Round-trip the transport in-process: build an envelope, gzip+base64 it,
    slice it exactly as the browser does, and ingest it back. This does not
    replace tests/desk_roundtrip.js, which drives the REAL driver in a real
    browser against a fixture server; it is the fast check that the reassembly
    arithmetic and every refusal still hold."""
    import tempfile
    ok = []

    def case(name, fn):
        try:
            fn()
            ok.append("ok   " + name)
        except SystemExit as e:
            ok.append("FAIL " + name + " -> " + str(e))

    tmp = tempfile.mkdtemp()
    env = {"desk_pull": 1, "source": "https://example.invalid/q", "pages": 2,
           "columns": ["pin", "addr", "lat", "lng"], "n": 3,
           "rows": [["1", "a", 1.0, 2.0], ["2", "b", None, None], ["3", "c", 3.0, 4.0]]}
    b64 = base64.b64encode(gzip.compress(json.dumps(env).encode())).decode()

    def write(parts, d):
        os.makedirs(d, exist_ok=True)
        for i, p in enumerate(parts):
            open(os.path.join(d, "s.%d" % i), "w").write(p)
        return d

    # happy path
    d = write([b64], os.path.join(tmp, "a"))
    out = os.path.join(tmp, "a.json")
    got = ingest([d], out, expect_b64=len(b64), quiet=True)
    assert got["n"] == 3, got
    assert json.load(open(out))["source"] == env["source"]
    print("ok   round-trips %d rows through gzip+base64" % got["n"])

    # a wrong declared length is caught
    d = write([b64], os.path.join(tmp, "b"))
    try:
        ingest([d], os.path.join(tmp, "b.json"), expect_b64=len(b64) + 1, quiet=True)
        print("FAIL a wrong packed length was accepted")
        return 1
    except SystemExit:
        print("ok   refuses a length that disagrees with the driver")

    # PII is refused
    pii = dict(env, columns=["pin", "OWN_NAME", "lat", "lng"])
    p64 = base64.b64encode(gzip.compress(json.dumps(pii).encode())).decode()
    d = write([p64], os.path.join(tmp, "c"))
    outc = os.path.join(tmp, "c.json")
    try:
        ingest([d], outc, quiet=True)
        print("FAIL an owner-name column was ingested")
        return 1
    except SystemExit:
        print("ok   refuses an owner-identity column")
    if os.path.exists(outc):
        print("FAIL a refused pull still wrote a file")
        return 1
    print("ok   writes nothing when it refuses")

    # ragged rows are refused
    rag = dict(env, rows=[["1", "a", 1.0, 2.0], ["2", "b"]], n=2)
    r64 = base64.b64encode(gzip.compress(json.dumps(rag).encode())).decode()
    d = write([r64], os.path.join(tmp, "d"))
    try:
        ingest([d], os.path.join(tmp, "d.json"), quiet=True)
        print("FAIL a ragged row set was ingested")
        return 1
    except SystemExit:
        print("ok   refuses rows that do not match the declared columns")

    # A short intermediate slice is refused. The payload here is deliberately
    # INCOMPRESSIBLE: an earlier version of this case repeated one row 40,000
    # times, which gzipped so well that it never exceeded a single slice, so the
    # multi-slice path silently never ran and the case passed by not executing.
    # A guard that has never been seen to fail has not been shown to work.
    import random
    rnd = random.Random(7)
    big = [[("%08x" % rnd.getrandbits(32)) + ("%08x" % rnd.getrandbits(32)),
            "%d %s St" % (rnd.randrange(9999), ("%06x" % rnd.getrandbits(24))),
            round(rnd.uniform(29, 48), 6), round(rnd.uniform(-124, -70), 6)]
           for _ in range(24000)]
    long_env = dict(env, rows=big, n=len(big))
    l64 = base64.b64encode(gzip.compress(json.dumps(long_env).encode())).decode()
    if len(l64) <= SLICE:
        print("FAIL the multi-slice case is still under one slice (%d chars) - it would "
              "not exercise the path it claims to test" % len(l64))
        return 1
    parts = [l64[i:i + SLICE] for i in range(0, len(l64), SLICE)]
    # ... and the whole payload must round-trip across several slices first,
    # or the refusal below would prove nothing about the happy multi-slice path.
    d = write(parts, os.path.join(tmp, "e"))
    got = ingest([d], os.path.join(tmp, "e.json"), expect_b64=len(l64), quiet=True)
    if got["n"] != len(big):
        print("FAIL multi-slice round trip lost rows")
        return 1
    print("ok   round-trips %d rows across %d slices" % (len(big), len(parts)))

    parts[0] = parts[0][:-10]          # truncate an INTERMEDIATE slice
    d = write(parts, os.path.join(tmp, "f"))
    try:
        ingest([d], os.path.join(tmp, "f.json"), quiet=True)
        print("FAIL a truncated intermediate slice was ingested")
        return 1
    except SystemExit:
        print("ok   refuses a truncated intermediate slice")

    # Slices out of order decode to nothing useful; the length check cannot see
    # it, so this is the case that proves the decode failure is reported rather
    # than swallowed into an empty result.
    parts = [l64[i:i + SLICE] for i in range(0, len(l64), SLICE)]
    parts[0], parts[1] = parts[1], parts[0]
    d = write(parts, os.path.join(tmp, "g"))
    try:
        ingest([d], os.path.join(tmp, "g.json"), expect_b64=len(l64), quiet=True)
        print("FAIL slices in the wrong order were ingested")
        return 1
    except SystemExit:
        print("ok   refuses slices reassembled out of order")

    print("desk_ingest selftest clean")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--slices", nargs="*", default=[],
                    help="slice files, or a directory of them (sorted naturally)")
    ap.add_argument("--out", help="where to write the canonical JSON (under data/, which is ignored)")
    ap.add_argument("--expect-b64", type=int, default=None,
                    help="the b64 length lxpack reported — checked, not trusted")
    ap.add_argument("--jurisdiction", default=None)
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not a.slices or not a.out:
        ap.error("--slices and --out are required (or --selftest)")
    ingest(a.slices, a.out, a.expect_b64, a.jurisdiction)
    return 0


if __name__ == "__main__":
    sys.exit(main())
