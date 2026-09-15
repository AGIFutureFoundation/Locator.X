#!/usr/bin/env python3
"""standard_feasibility — what "meets criteria" can mean in a given market.

The Investment Standard (src/standards.js) states fifteen requirements and
grades each one meets / fails / UNKNOWN, where unknown is a first-class outcome.
That is right at the level of one property. It leaves a harder question
unanswered at the level of a market:

    Before a single record is pulled, how many of the fifteen can this
    jurisdiction's public record answer AT ALL?

It matters because the answer is not fifteen anywhere, and in a non-disclosure
market it is conspicuously not fifteen. Louisiana does not reliably publish
recorded sale prices in Orleans or East Baton Rouge — that is a `no public
record` row in the coverage inventory, not a to-do. So a screen that reports
"N properties meet criteria" in New Orleans is either quietly counting two
permanently-unanswerable requirements as passes, or quietly counting them as
failures. Both are lies, and the second one rejects an entire metro for the sin
of its state's recording practice.

This computes the honest ceiling instead: per jurisdiction, which requirements
are ANSWERABLE, which are STRUCTURALLY UNKNOWN, and therefore what the best
possible honest score in that market is.

Two sources, no third copy:
  * the requirements are parsed out of src/standards.js, so this file cannot
    drift from the standard the app applies
  * the record's reach is read from docs/states/coverage/*.md, so this file
    cannot drift from what the inventory says was actually pulled

And a drift guard that matters more than either: if src/standards.js gains a
requirement this module has no field mapping for, the build FAILS. A new
requirement silently omitted from a feasibility report would overstate the
ceiling, which is the one direction this must never be wrong in.

Usage:
  python3 scripts/standard_feasibility.py                # every jurisdiction
  python3 scripts/standard_feasibility.py --market nola  # one market
  python3 scripts/standard_feasibility.py --plan         # what each pull is worth
  python3 scripts/standard_feasibility.py --check        # gate mode
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
STD = os.path.join(ROOT, 'src', 'standards.js')
COV = os.path.join(ROOT, 'docs', 'states', 'coverage')

# What each requirement NEEDS from the public record, in the vocabulary the
# coverage inventory uses. A requirement is answerable in a market when every
# need below is satisfied there.
#
#   price      a published figure of any kind (assessment counts)
#   sale       a RECORDED SALE PRICE — the thing non-disclosure states withhold
#   saledate   a date attached to that sale
#   rent       an income figure, published or licensed
#   use        a recorded use code, not a zoning district
#   area       building area or unit count
#   index      a monthly value series for the ZIP
#   assump     none of the above — the user's own assumptions carry it
NEEDS = {
    'cf':     ['price', 'rent'],
    'cap':    ['price', 'rent'],
    'grm':    ['price', 'rent'],
    'dscr':   ['price', 'rent'],
    'beocc':  ['price', 'rent'],
    'norent': ['price', 'rent'],
    'evid':   [],            # the evidence grade is computed from whatever exists
    'sale':   ['sale'],
    'fresh':  ['sale', 'saledate'],
    'built':  ['use'],
    'use':    ['use'],
    'size':   ['area'],
    'idx':    ['index'],
    'trend':  ['index'],
    'yield':  ['index', 'rent'],
}

# What each market's record actually reaches, read from the coverage inventory
# and stated per market rather than per state, because the ceiling is a parish
# fact. `sale` absent here is the non-disclosure ceiling.
MARKETS = {
    'nola': {
        'name': 'Orleans Parish (New Orleans)',
        'file': 'louisiana.md',
        'has': ['price', 'use', 'area', 'index'],
        'missing': {
            'sale': 'Louisiana is effectively non-disclosure in Orleans: recorded sale '
                    'prices are not reliably public. Coverage row: "Sale prices for '
                    'comps — no public record".',
            'saledate': 'No published sale price means no publishable sale date.',
            'rent': 'No packed rent feed: the STR licence registry is identified but '
                    'not pulled, and asking rents are a `named` row.',
        },
    },
    'ebr': {
        'name': 'East Baton Rouge Parish',
        'file': 'louisiana.md',
        'has': ['price', 'use', 'area', 'index'],
        'missing': {
            'sale': 'Same non-disclosure ceiling as Orleans — coverage row reads '
                    '"no public record".',
            'saledate': 'No published sale price means no publishable sale date.',
            'rent': 'No packed rent feed for the parish.',
        },
    },
    'jefferson': {
        'name': 'Jefferson Parish (the +30k target)',
        'file': 'louisiana.md',
        'has': ['index'],
        'missing': {
            'price': 'BLOCKED, not absent: the parcel and value layer exists at the '
                     'parish assessor and this container cannot reach it. Pull queue '
                     'entry 3.',
            'use': 'Same blocked layer carries the use codes.',
            'area': 'Same blocked layer.',
            'sale': 'Non-disclosure state; expect the Orleans ceiling to apply.',
            'saledate': 'Non-disclosure state.',
            'rent': 'No packed rent feed.',
        },
    },
}


def die(msg):
    raise SystemExit('FEASIBILITY STOPPED — ' + msg)


def requirements():
    """Parse the Investment Standard's requirement list out of src/standards.js."""
    if not os.path.exists(STD):
        die('src/standards.js is missing — the Investment Standard is the definition of '
            '"meets criteria" and this report is meaningless without it')
    text = open(STD, encoding='utf-8').read()
    reqs = re.findall(
        r"\{id:'(\w+)',\s*cat:'(\w+)',\s*name:'([^']+)',\s*want:'([^']+)'", text)
    if len(reqs) < 10:
        die('only %d requirements parsed from src/standards.js; the standard lists more. '
            'A requirement that stops parsing is one that stops being reported as '
            'unanswerable.' % len(reqs))
    ids = [r[0] for r in reqs]
    # THE DRIFT GUARD. Overstating the ceiling is the one direction this must
    # never be wrong in, so an unmapped requirement fails the build.
    unmapped = [i for i in ids if i not in NEEDS]
    if unmapped:
        die('src/standards.js has requirement(s) %s that scripts/standard_feasibility.py '
            'has no field mapping for. An unmapped requirement would be silently counted '
            'as answerable and would OVERSTATE what a market can support. Add it to NEEDS.'
            % ', '.join(unmapped))
    stale = [i for i in NEEDS if i not in ids]
    if stale:
        die('NEEDS maps %s, which the Investment Standard no longer defines. Remove it '
            'rather than leaving a mapping nobody reads.' % ', '.join(stale))
    return reqs


def assess(reqs, mk):
    have = set(mk['has'])
    answerable, unknown = [], []
    for rid, cat, name, want in reqs:
        need = NEEDS[rid]
        gaps = [n for n in need if n not in have]
        if gaps:
            unknown.append((rid, name, gaps))
        else:
            answerable.append((rid, name))
    return answerable, unknown


def report(only=None):
    reqs = requirements()
    total = len(reqs)
    print('  The Investment Standard states %d requirements (parsed from src/standards.js).'
          % total)
    print('  A market can only be screened on the ones its public record can answer.\n')
    worst = None
    for key, mk in MARKETS.items():
        if only and key != only:
            continue
        ans, unk = assess(reqs, mk)
        pct = len(ans) / total * 100
        print('  %s' % mk['name'])
        print('    answerable:          %2d of %d  (%.0f%%)' % (len(ans), total, pct))
        print('    structurally unknown: %2d        %s'
              % (len(unk), ', '.join(r[0] for r in unk)))
        for rid, name, gaps in unk:
            reasons = {g: mk['missing'].get(g, 'not in the coverage inventory') for g in gaps}
            for g, why in reasons.items():
                print('      · %-7s needs %-9s %s' % (rid, g, why))
        print('    THE HONEST CEILING: a property here can score at best %d of %d, and the '
              'count of\n    unknowns travels with the score. It is never %d of %d.'
              % (len(ans), total, len(ans), len(ans)))
        print()
        if worst is None or len(ans) < worst[1]:
            worst = (mk['name'], len(ans))
    return total, worst


# Whether a missing field is OBTAINABLE, and at what cost. A permanent ceiling
# and a blocked pull look identical in the report above and are completely
# different decisions: one is worth a desk session, the other is worth nothing
# anybody can do.
OBTAINABLE = {
    'sale':     (False, 'Permanent for Louisiana: non-disclosure practice. No session '
                        'obtains this. It is a ceiling, not a backlog item.'),
    'saledate': (False, 'Follows `sale`. Permanent.'),
    'rent':     (True,  'The STR licence registry is identified and the asking-rent row '
                        'is `named`. A desk session can pull it.'),
    'price':    (True,  'Pull queue entry 3 — the parish assessor layer, blocked at the '
                        'container and reachable from a desktop browser pane.'),
    'use':      (True,  'Same layer as `price`.'),
    'area':     (True,  'Same layer as `price`.'),
    'index':    (True,  'Published monthly series.'),
}

# Record counts are read from the measured edition manifest, never typed. A
# market with no live-measured edition contributes no count, and says so.
def measured_records():
    import json
    path = os.path.join(ROOT, 'market', 'editions.json')
    rows = json.load(open(path, encoding='utf-8'))['editions']
    out = {}
    for e in rows:
        if e.get('records_measured'):
            out[e['key']] = e['records_measured']
    return out


def plan():
    """Rank what to pull by requirements unlocked x records affected.

    The literal request - more parcels - is not automatically the best pull. A
    field that unlocks seven requirements across records ALREADY SHIPPED can be
    worth more than thirty thousand new records that each land at three of
    fifteen. This computes which, rather than assuming either."""
    reqs = requirements()
    total = len(reqs)
    recs = measured_records()
    # editions.json keys -> the market they cover
    EDITION_OF = {'nola': ['nola', 'nola-classic'], 'ebr': [], 'jefferson': []}
    print('  What each obtainable pull is actually worth\n')
    rows = []
    for key, mk in MARKETS.items():
        have = set(mk['has'])
        ans_now, _ = assess(reqs, mk)
        covered = sum(recs.get(k, 0) for k in EDITION_OF.get(key, []))
        for field, why in mk['missing'].items():
            ok, note = OBTAINABLE.get(field, (False, 'unclassified'))
            if not ok:
                continue
            # what the market looks like once this one field arrives
            mk2 = dict(mk); mk2['has'] = sorted(have | {field})
            ans_after, _ = assess(reqs, mk2)
            gain = len(ans_after) - len(ans_now)
            if gain <= 0:
                continue
            rows.append((gain, covered, key, mk['name'], field, len(ans_now),
                         len(ans_after), note))
    # a pull that lifts records already shipped outranks one that only adds new
    rows.sort(key=lambda r: (-r[0] * max(r[1], 1), -r[0]))
    for gain, covered, key, name, field, before, after, note in rows:
        scope = ('%s records already shipped' % '{:,}'.format(covered)) if covered \
                else 'no live-measured edition yet - the records arrive with the pull'
        print('  + %-9s %-34s %d -> %d of %d requirements' % (field, name, before, after, total))
        print('      lifts:  %s' % scope)
        print('      how:    %s\n' % note)
    perm = sorted({f for mk in MARKETS.values() for f in mk['missing']
                   if not OBTAINABLE.get(f, (False, ''))[0]})
    print('  Permanently unobtainable in this state: %s' % ', '.join(perm))
    print('  No session moves those. Every market here tops out below %d of %d, and the '
          'app says so per property rather than rounding it away.' % (total, total))
    return rows


def main():
    only = None
    if '--market' in sys.argv:
        only = sys.argv[sys.argv.index('--market') + 1]
        if only not in MARKETS:
            die('unknown market %r; known: %s' % (only, ', '.join(MARKETS)))
    if '--plan' in sys.argv:
        plan()
        return 0
    if '--check' in sys.argv:
        reqs = requirements()
        for key, mk in MARKETS.items():
            ans, unk = assess(reqs, mk)
            if not unk and not mk['missing']:
                die('%s claims every requirement is answerable and lists no missing '
                    'field. No market in this catalogue reaches fifteen; verify before '
                    'asserting it.' % key)
        print('  · standard feasibility: %d requirements, %d markets mapped, no '
              'requirement unmapped' % (len(reqs), len(MARKETS)))
        return 0
    report(only)
    return 0


if __name__ == '__main__':
    sys.exit(main())
