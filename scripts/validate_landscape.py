#!/usr/bin/env python3
"""validate_landscape — the market register cannot lose its sources.

docs/market/LANDSCAPE.md records what the research says other vendors charge.
Every row carries a source and a status from a fixed vocabulary, and this fails
the build when one stops doing so — the same parser-with-no-fallthrough rule
scripts/coverage_rollup.py applies to the record layer, because a pricing claim
about somebody else's product is exactly as unfalsifiable as an unsourced claim
about a parcel, and considerably more embarrassing to be caught on.

Checks:
  1. every table row names a tool, a job, a capability, a price and a status
  2. every status is one of the five the document defines
  3. a row that states a price carries a source link, unless its status says the
     vendor publishes no price
  4. an `unsourced` row states no figure at all — a price the research could not
     cite does not get to survive in the price cell
  5. `verified` and `changed` statuses carry an ISO date
  6. the document's own counts match the rows it lists

And docs/market/GAP.md sets that register against what this repository actually
ships, naming each module and its line count. Those are measurements, so:

  7. every `src/x.js` (N lines) claim in GAP.md names a file that exists
  8. every stated line count equals the file's real length

A capability claim backed by a file that shrank, moved or never existed is the
brochure failure mode this project exists to not have.

Usage: python3 scripts/validate_landscape.py
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DOC = os.path.join(ROOT, 'docs', 'market', 'LANDSCAPE.md')
GAP = os.path.join(ROOT, 'docs', 'market', 'GAP.md')
PLAN = os.path.join(ROOT, 'docs', 'market', 'PREMIUM_ROADMAP.md')

PLAIN = ('reported', 'no public price', 'unsourced')
DATED = ('verified', 'changed')


def die(msg):
    raise SystemExit('LANDSCAPE STOPPED — ' + msg)


def rows(text):
    out = []
    for line in text.split('\n'):
        if not line.startswith('| **'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) != 6:
            die('a register row has %d cells, not 6:\n  %s' % (len(cells), line[:120]))
        out.append(cells)
    return out


def check_gap():
    """GAP.md claims a module ships by naming it and its length. Both must hold."""
    if not os.path.exists(GAP):
        die('docs/market/GAP.md is missing — the register only means something '
            'next to a measured account of what this repository ships')
    if not os.path.exists(PLAN):
        die('docs/market/PREMIUM_ROADMAP.md is missing — the gap analysis is only '
            'half an argument without what follows from it')
    text = open(GAP, encoding='utf-8').read() + open(PLAN, encoding='utf-8').read()
    claims = re.findall(r'`(src/[a-z0-9_]+\.js)` \((\d+)(?: lines?)?\)', text)
    if len(claims) < 15:
        die('only %d measured module claims parsed from GAP.md and the roadmap; '
            'they make far more. '
            'A claim that stops parsing is a claim that stops being checked.'
            % len(claims))
    seen = {}
    for rel, stated in claims:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            die('GAP.md credits %s with a capability and the file does not exist'
                % rel)
        real = sum(1 for _ in open(path, encoding='utf-8'))
        if real != int(stated):
            die('GAP.md says %s is %s lines; it is %d. Re-measure before you '
                're-assert — the number is the point, not the decoration.'
                % (rel, stated, real))
        seen[rel] = real
    return len(claims), len(seen)


def main():
    if not os.path.exists(DOC):
        die('docs/market/LANDSCAPE.md is missing — the register is the only place '
            'competitor pricing claims may live')
    text = open(DOC, encoding='utf-8').read()
    reg = rows(text)
    if len(reg) < 20:
        die('only %d rows parsed from the register; it listed 25. A row that stops '
            'parsing is a claim that stops being checked.' % len(reg))

    priced = unpriced = nosource = 0
    for tool, job, cap, price, src, status in reg:
        name = re.sub(r'\*', '', tool)
        st = status.strip('`').strip()
        if not (name and job and cap and price and st):
            die('%s has an empty cell; every row states a tool, a job, what it does, '
                'a price and a status' % (name or '(unnamed row)'))
        # 'no public price' is the whole status, not a word plus a suffix
        head = st if st in PLAIN else st.split(' ')[0]
        if head not in PLAIN + DATED:
            die('%s carries status %r, which is outside the vocabulary the document '
                'defines (%s)' % (name, st, ', '.join(PLAIN + DATED)))
        if head in DATED:
            if not re.match(r'^(verified|changed) \d{4}-\d{2}-\d{2}$', st):
                die('%s is %s without an ISO date — a verification with no date is a '
                    'memory, not a check' % (name, head))
        has_link = '](http' in src
        if head == 'unsourced':
            if re.search(r'[$\u00a3\u20ac]\s?\d', price):
                die('%s is marked unsourced and still carries a figure (%s). An '
                    'unsourced price is a rumour with a decimal point; delete it '
                    'or find the vendor page.' % (name, price[:60]))
            nosource += 1
            continue
        if head == 'no public price':
            unpriced += 1
            continue
        priced += 1
        if not has_link:
            die('%s states a price (%s) with no source link. Every figure about '
                'somebody else\'s product carries where it came from.'
                % (name, price[:60]))

    stated = re.search(r'\*\*(\d+) tools\*\*', text)
    if stated and int(stated.group(1)) != len(reg):
        die('the document says %s tools and the table has %d rows'
            % (stated.group(1), len(reg)))
    mp = re.search(r'\*\*(\d+) carry a reported price\*\*', text)
    if mp and int(mp.group(1)) != priced:
        die('the document says %s priced rows and the table has %d'
            % (mp.group(1), priced))
    mu = re.search(r'\*\*(\d+) publish no public\s+price at all\*\*', text)
    if mu and int(mu.group(1)) != unpriced:
        die('the document says %s unpriced rows and the table has %d'
            % (mu.group(1), unpriced))
    mn = re.search(r'\*\*(\d+) (?:is|are) unsourced\*\*', text)
    if mn and int(mn.group(1)) != nosource:
        die('the document says %s unsourced rows and the table has %d'
            % (mn.group(1), nosource))

    verified = sum(1 for r in reg if r[5].strip('`').startswith('verified'))
    print('  · %d tools registered · %d priced, all sourced · %d publish no price · '
          '%d unsourced and stating no figure · %d verified against a vendor page'
          % (len(reg), priced, unpriced, nosource, verified))
    if verified == 0:
        print('  · nothing here is verified, and every row says so — see the '
              'egress probe dated in the document')
    nclaims, nmods = check_gap()
    print('  · GAP.md + roadmap: %d measured capability claims across %d modules, '
          'every line count re-counted' % (nclaims, nmods))
    return 0


if __name__ == '__main__':
    sys.exit(main())
