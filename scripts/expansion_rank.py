#!/usr/bin/env python3
"""expansion_rank — which region Locator.X should cover next, measured.

Two things decide whether a market is worth an edition, and most expansion
decisions are made on only the first:

  DEMAND      does anybody want to invest there? Measured from the ranked
              submarket index in market/belts.json - real ZIPs, scored, with
              their own holdout error attached.
  FEASIBILITY can the public record there answer the questions this platform
              asks? Measured by walking docs/states/coverage/*.md against the
              Investment Standard's requirements, the same way
              scripts/standard_feasibility.py does for Louisiana.

A market with demand and no record is a market where this platform ships a
beautiful map that cannot answer a question. Louisiana is the worked example:
Orleans has real demand and tops out at 13 of 15 requirements FOREVER, because
the state does not publish sale prices. Knowing that before building the edition
is worth more than any amount of enthusiasm after.

So every candidate below carries three numbers:

  now      requirements answerable from feeds already shipped or pulled
  ceiling  requirements answerable if every NAMED and BLOCKED row were pulled
  gap      ceiling - now, i.e. how many pulls away the ceiling is

and the ranking is by ceiling first, because a low ceiling is permanent and a
large gap is merely work.

CLASSIFIER HONESTY. Each coverage row's question is mapped to the record fields
it supplies by explicit keyword. A row that matches nothing is REPORTED AND
COUNTED, and contributes no capability. That direction is deliberate: an
unclassified row makes a market look worse than it is, and understating a
market's ceiling costs a delayed edition, while overstating it costs a shipped
edition that cannot answer its own screen. The counts are printed so the
classifier's blind spots are visible rather than assumed away.

Usage:
  python3 scripts/expansion_rank.py                 # the ranked report
  python3 scripts/expansion_rank.py --write <path>  # generate the document
  python3 scripts/expansion_rank.py --check         # gate mode
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import standard_feasibility as SF  # the requirement list and the NEEDS map

COV = os.path.join(ROOT, 'docs', 'states', 'coverage')
BELTS = os.path.join(ROOT, 'market', 'belts.json')
XWALK = os.path.join(ROOT, 'crosswalk', 'usecodes.json')

# Which crosswalk jurisdictions sit in which coverage file. The crosswalk is a
# SECOND, INDEPENDENT record of whether a value field exists - it declares the
# field top_screen.py is allowed to rank on, measured against a live layer. When
# the inventory and the crosswalk disagree about a market, one of them is wrong,
# and saying which is worth more than either on its own.
XWALK_OF = {
    'utah': ['utah_co_ut'], 'ohio': ['ohio_dte'], 'new-york': ['onondaga_ny'],
    'north-carolina': ['wake_nc', 'guilford_nc'], 'new-mexico': ['bernalillo_nm'],
    'arizona': ['maricopa_az'], 'florida': ['florida_dor'],
    # Indiana's own coverage file states it: "Uses the same DTE-style
    # 401/402/403/410/411/419 numbering as Ohio (crosswalk ohio_dte row applies,
    # same caveats)". The mapping is documented, not inferred.
    'indiana': ['ohio_dte'],
}

# NEGATION. The verdict column carries the measured detail, and a keyword scan
# over it is actively dangerous: Indiana's building-attributes row reads "no
# building area, no year built and no sale price at all ... the only completeness
# fields are acreage and assessed values". Four field words appear; three are
# denials. Crediting them would present a non-disclosure county as a
# sale-publishing market - the worst possible direction to be wrong in.
#
# So the verdict is read CLAUSE BY CLAUSE, and a clause carrying a negation
# contributes nothing. An explicit denial is also worth keeping: it is a
# field-level "no public record", stated by whoever did the pull.
NEG = re.compile(r'\b(no|not|never|without|absent|missing|lacks?|none)\b', re.I)
CLAUSE = re.compile(r'[.;]|\band\b|,')


# A verdict may only credit a VALUE when it names the column. This is not
# pedantry: crosswalk/usecodes.json declares the `value_field` that
# top_screen.py is allowed to rank on, and a market whose inventory says "value
# evidence exists" without naming the field is a market nothing can rank.
#
# Utah's roll-vintage row says "date any value evidence accordingly" and
# Indiana's says "the only completeness fields are acreage and assessed values".
# Both report that values exist. Neither names a column, and neither crosswalk
# entry declares one - so the platform cannot rank either, and crediting them
# put the inventory in contradiction with the crosswalk. A value you cannot name
# is a value you cannot rank.
FIELD_TOKEN = re.compile(r'`[A-Za-z_][A-Za-z0-9_]{2,}`')
NAMED_ONLY = {'price'}




def verdict_fields(text):
    """Positive field evidence in a verdict, and the fields it explicitly denies."""
    pos, neg = set(), set()
    for clause in CLAUSE.split(text or ''):
        low = clause.lower()
        hit = []
        for pat, fs in VERDICT_CLASSIFY:
            if re.search(pat, low):
                hit.extend(fs)
        if not hit:
            continue
        if NEG.search(low):
            neg.update(hit)
            continue
        named = bool(FIELD_TOKEN.search(clause))
        pos.update(f for f in hit if named or f not in NAMED_ONLY)
    return pos, neg


def crosswalk_values():
    """Per coverage file: does ANY of its crosswalk jurisdictions declare a
    value field? Returns None where the crosswalk covers the state at all."""
    js = {j['id']: j for j in json.load(open(XWALK, encoding='utf-8'))['jurisdictions']}
    stray = [i for ids in XWALK_OF.values() for i in ids if i not in js]
    if stray:
        die('XWALK_OF names crosswalk jurisdiction(s) %s that crosswalk/usecodes.json '
            'does not define. A mapping to a jurisdiction that no longer exists would '
            'silently stop cross-checking that state.' % ', '.join(stray))
    out = {}
    for state, ids in XWALK_OF.items():
        declared = [i for i in ids if js[i].get('value_field')]
        out[state] = {'ids': ids, 'declared': declared,
                      'fields': {i: js[i].get('value_field') for i in ids}}
    return out

# Which record field a coverage row supplies, by keyword on its question text.
#
# EVERY matching pattern contributes. An earlier version stopped at the first
# match, which quietly cost a market every field after the first: Florida's
# richest row reads "use code, assessed and just value, sale history" and was
# credited with the sale alone, putting a disclosure state below a
# non-disclosure one in the ranking. One row can answer several questions, and
# the classifier now says so.
CLASSIFY = [
    (r'sale price|sales? histor|recorded sale|qualification|sale-qualification',
     ['sale', 'saledate']),
    # A rent FIGURE only. A rent-regulation flag says whether a cap applies, and
    # a short-term-rental licence says a property is registered; neither is an
    # income number, and crediting them inflated California's ceiling from 7 to
    # 14 - an edition that could not have answered a single cash-flow question.
    # Overstating a ceiling ships a map that cannot answer its own screen.
    (r'\brents?\b|asking rent|rent roll|income figure', ['rent']),
    (r'use class|use code|parcel|geometry|land class|apartment identification|'
     r'lodging class|class vocabular|use vocabular',
     ['use']),
    (r'floor area|building area|unit count|beds|baths|sq ?ft|building attribute',
     ['area']),
    (r'assessed|just value|\bvalues?\b|valuation|millage|apprais|\btax\b',
     ['price']),
]
# Rows that legitimately supply nothing the Standard tests. Naming them keeps
# them out of the unclassified count, which is the number that matters.
# "Values" means money in a gate LABEL and means enum cardinality in PROSE.
# Utah's use-class verdict reads "`PROP_TYPE_DESCR` carries 37 values" - a count
# of distinct codes, in a clause that also names a field, which satisfied both
# the keyword and the named-column rule and credited the state with a price.
# The verdict therefore uses a stricter price pattern than the question does.
VERDICT_CLASSIFY = [
    (pat if 'price' not in fs
     else r'assessed|just value|market value|apprais|millage|valuation|total value',
     fs) for pat, fs in CLASSIFY
]

NOT_A_FIELD = re.compile(
    r'owner of record|owner fields|foreclosure|docket|deed|lien|permit|violation|'
    r'code enforcement|tax-sale|tax sale|adjudicat|mortgage|executory|insurance|'
    r'historic|district boundar|parcel keys|condo flood|homestead|exemption|'
    r'rent-regulation|str licen|short-term rental licen|transfer tax|exit/transfer|'
    r'distress pipeline|smaller counties', re.I)

STATUS_NOW = re.compile(r'\b(shipped|pulled)\b', re.I)
STATUS_PERMANENT = re.compile(r'no public record', re.I)


def die(msg):
    raise SystemExit('EXPANSION STOPPED — ' + msg)


def rows():
    """Every gate row in the coverage inventory, with its state and status."""
    out = []
    for fn in sorted(os.listdir(COV)):
        if not fn.endswith('.md') or fn in ('README.md', 'ROLLUP.md'):
            continue
        state = fn[:-3]
        for line in open(os.path.join(COV, fn), encoding='utf-8'):
            m = re.match(r'^\|\s*([A-Z/]+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$',
                         line)
            if not m:
                continue
            gate, question, source, status = m.groups()
            out.append({'state': state, 'gate': gate, 'q': question,
                        'source': source, 'status': status})
    if len(out) < 50:
        die('only %d coverage rows parsed; the inventory holds far more. A row that '
            'stops parsing is a market this report silently misjudges.' % len(out))
    return out


def fields_for(q):
    if NOT_A_FIELD.search(q):
        return [], False
    low = q.lower()
    got = []
    for pat, fs in CLASSIFY:
        if re.search(pat, low):
            got.extend(fs)
    if got:
        return sorted(set(got)), False
    return [], True          # unclassified: contributes nothing, and is counted


def by_state():
    reqs = SF.requirements()
    st = {}
    unclassified = []
    for r in rows():
        s = st.setdefault(r['state'], {'now': set(), 'ceiling': set(),
                                       'permanent': set(), 'rows': 0, 'unk': 0})
        s['rows'] += 1
        fs, unk = fields_for(r['q'])
        if unk:
            s['unk'] += 1
            unclassified.append((r['state'], r['q'][:70]))
            continue
        # The verdict column carries measured detail the question column does
        # not. Read it with negation handling, and let an explicit denial
        # override a positive found elsewhere in the same row.
        #
        # The exclusion list applies to the VERDICT TOO. Skipping that let the
        # rent-regulation bug back in through a side door: California's
        # regulation row was excluded by its question and then re-credited with
        # `rent` because its verdict mentions "Oakland rent boards". A rent board
        # is not a rent figure, and the ceiling went 7 -> 14 on the strength of
        # it - the same overstatement, the same market, a second time.
        vpos, vneg = ((set(), set()) if NOT_A_FIELD.search(r['q'])
                      else verdict_fields(r.get('source', '')))
        fs = sorted((set(fs) | vpos) - vneg)
        if not fs:
            continue
        if STATUS_PERMANENT.search(r['status']):
            s['permanent'].update(fs)
            continue
        s['ceiling'].update(fs)
        if STATUS_NOW.search(r['status']):
            s['now'].update(fs)
    # every market has a published ZIP index; it is not a county feed
    for s in st.values():
        s['now'].add('index')
        s['ceiling'].add('index')
    out = {}
    for name, s in st.items():
        now = len(SF.assess(reqs, {'has': sorted(s['now']), 'missing': {}})[0])
        ceil = len(SF.assess(reqs, {'has': sorted(s['ceiling']), 'missing': {}})[0])
        # What the market reaches if a rent FIGURE existed. Measured separately
        # because rent turned out to be the binding constraint in every market
        # in the catalogue, which is not a conclusion any single state's
        # inventory could have shown.
        withrent = len(SF.assess(reqs, {'has': sorted(s['ceiling'] | {'rent'}),
                                        'missing': {}})[0])
        out[name] = {'now': now, 'ceiling': ceil, 'gap': ceil - now,
                     'withrent': withrent, 'rows': s['rows'], 'unk': s['unk'],
                     'permanent': sorted(s['permanent']),
                     'fields': sorted(s['ceiling'])}
    return out, len(reqs), unclassified


def demand():
    """Ranked submarkets per state, from the measured index."""
    d = json.load(open(BELTS, encoding='utf-8'))
    top = d.get('top100') or []
    belts = d.get('belts') or []
    pool = top + [b for b in belts if isinstance(b, dict) and b.get('state')]
    agg = {}
    for z in pool:
        s = z.get('state')
        if not s:
            continue
        a = agg.setdefault(s, {'n': 0, 'best': None, 'scores': []})
        a['n'] += 1
        sc = z.get('score')
        if sc is not None:
            a['scores'].append(sc)
            if a['best'] is None or sc > a['best']:
                a['best'] = sc
    for s, a in agg.items():
        a['median'] = sorted(a['scores'])[len(a['scores']) // 2] if a['scores'] else None
    return agg


# coverage filenames -> the USPS code the submarket index uses
ABBR = {'arizona': 'AZ', 'california': 'CA', 'florida': 'FL', 'indiana': 'IN',
        'louisiana': 'LA', 'nebraska': 'NE', 'new-mexico': 'NM', 'new-york': 'NY',
        'north-carolina': 'NC', 'ohio': 'OH', 'utah': 'UT'}
NAME = {v: k.replace('-', ' ').title() for k, v in ABBR.items()}


def unnamed_values():
    """Rows that report a value and never name the column.

    The most actionable line in this whole report: the pull measured a value,
    the inventory wrote it down in prose, and nobody recorded WHICH COLUMN. The
    ranking engine needs a name. Recovering it is a documentation task against
    an existing pull, not a new data session - but it is not a task anyone can
    do from the words alone, which is why it is listed rather than guessed."""
    out = []
    for r in rows():
        if NOT_A_FIELD.search(r['q']):
            continue
        src = r.get('source', '')
        for clause in CLAUSE.split(src):
            low = clause.lower()
            if NEG.search(low):
                continue
            if any(re.search(p, low) for p, fs in VERDICT_CLASSIFY if 'price' in fs):
                if not FIELD_TOKEN.search(clause):
                    out.append((r['state'], r['q'], clause.strip()[:72]))
                break
    return out


def thin_rows(cand):
    """Markets with no value row, each cross-checked against the crosswalk.

    Shared by the console report and the generated document so the two cannot
    tell different stories about the same market - the drift this repository
    keeps finding wherever one fact is computed twice."""
    xw = crosswalk_values()
    out = []
    for _a, _b, _c2, code, c, _e in cand:
        if 'price' in c['fields']:
            continue
        state = next((k for k, v in ABBR.items() if v == code), None)
        x = xw.get(state)
        if x is None:
            kind = 'unknown — the crosswalk does not cover this state'
        elif x['declared']:
            jid = x['declared'][0]
            kind = 'DOCUMENTATION gap — %s declares `%s`' % (jid, x['fields'][jid])
        else:
            kind = 'REAL gap — %s declares no value field either' % ', '.join(x['ids'])
        out.append((NAME.get(code, code), c, kind))
    return out


def report_data():
    cov, total, unclassified = by_state()
    dem = demand()
    covered = {ABBR[k]: v for k, v in cov.items() if k in ABBR}

    cand = []
    for code, c in covered.items():
        d = dem.get(code, {})
        cand.append((c['ceiling'], c['now'], -c['gap'], code, c, d))
    cand.sort(reverse=True)
    return cand, [c for c in sorted((code, a) for code, a in dem.items()
                                    if code not in covered)], total, unclassified


def report():
    cand, green, total, unclassified = report_data()
    print('  The Investment Standard states %d requirements.' % total)
    print('  now = answerable from feeds already shipped or pulled')
    print('  ceiling = answerable if every named and blocked row were pulled')
    print('  A low ceiling is permanent. A large gap is only work.\n')
    print('  %-16s %4s %8s %5s %10s %8s  %s' %
          ('state', 'now', 'ceiling', 'gap', '+rent feed', 'submkts', 'permanent gaps'))
    for ceiling, now, _neg, code, c, d in cand:
        print('  %-16s %4d %8d %5d %10d %8s  %s' %
              (NAME.get(code, code), now, ceiling, c['gap'], c['withrent'],
               (str(d.get('n', 0)) if d else '0'),
               ', '.join(c['permanent']) or '—'))
    best = max(c['withrent'] for _a, _b, _c2, _d, c, _e in cand)
    capped = [NAME.get(code, code) for _a, _b, _c2, code, c, _e in cand
              if c['ceiling'] == c['withrent'] - 7]
    print('\n  A rent figure is worth SEVEN requirements in %d of %d markets — cf, cap, '
          'grm, dscr,\n  beocc, norent and yield all fail for the same missing input. '
          'No amount of new\n  territory raises any ceiling above %d until it exists; '
          'with it, the best market\n  in the catalogue reaches %d of %d.'
          % (len(capped), len(cand), max(c['ceiling'] for _a, _b, _c2, _d, c, _e in cand),
             best, total))

    # A market that gains only one requirement from a rent feed is missing
    # something more basic - almost always a VALUE row. Whether that is a
    # documentation gap or a real one is not a guess: thin_rows() asks the
    # crosswalk, which recorded the same fact independently.
    thin = thin_rows(cand)
    if thin:
        print('\n  Markets a rent feed barely helps, because no VALUE row is recorded.')
        print('  Cross-checked against crosswalk/usecodes.json, which independently')
        print('  declares the field top_screen.py may rank on:')
        for name, c, kind in thin:
            print('    %-16s ceiling %d, +%d from rent  \u00b7  %s'
                  % (name, c['ceiling'], c['withrent'] - c['ceiling'], kind))

    un = unnamed_values()
    if un:
        print('\n  Values reported in prose, with no column named. The pull measured '
              'them;\n  nobody recorded WHICH FIELD, so nothing can rank them. A '
              'documentation task\n  against an existing pull \u2014 not a new session, '
              'and not something to guess:')
        for state, q, clause in un:
            print('    %-14s %-24s \u201c%s\u201d' % (state, q[:24], clause))

    print('\n  Greenfield \u2014 measured submarket demand, no coverage inventory:')
    if not green:
        print('    none')
    for code, a in green[:12]:
        print('    %-4s %3d ranked submarkets   best score %s' %
              (code, a['n'], ('%.1f' % a['best']) if a['best'] is not None else 'unknown'))
    if len(green) > 12:
        print('    ... and %d more' % (len(green) - 12))

    if unclassified:
        print('\n  Unclassified coverage rows (contribute nothing; listed so the '
              'classifier\'s blind spots are visible):')
        for s, q in unclassified[:8]:
            print('    %-15s %s' % (s, q))
        if len(unclassified) > 8:
            print('    ... and %d more' % (len(unclassified) - 8))
    return cand, green, total, unclassified


DOC_HEAD = """# Where Locator.X should expand next — measured, not chosen

**Generated by `scripts/expansion_rank.py`. Do not edit by hand** — regenerate it. Every
figure comes from walking the coverage inventory against the Investment Standard's
requirements and joining the measured submarket index; nothing here is typed.

Two things decide whether a market is worth an edition, and expansion decisions are
usually made on only the first. **Demand** — does anyone want to invest there — is measured
from the ranked submarket index. **Feasibility** — can the public record there answer the
questions this platform asks — is measured from the coverage inventory. A market with
demand and no record is a market where this platform ships a beautiful map that cannot
answer a question.

"""


def write(path):
    cand, green, total, unclassified = report_data()
    L = []
    L.append(DOC_HEAD)
    L.append('## The finding that outranks every region\n')
    best = max(c['withrent'] for _a, _b, _c2, _d, c, _e in cand)
    ceil_now = max(c['ceiling'] for _a, _b, _c2, _d, c, _e in cand)
    seven = sum(1 for _a, _b, _c2, _d, c, _e in cand if c['withrent'] - c['ceiling'] >= 7)
    L.append('**No market in this catalogue can answer more than %d of the %d requirements, '
             'and the reason is the same everywhere: there is no rent figure.** `cf`, `cap`, '
             '`grm`, `dscr`, `beocc`, `norent` and `yield` all fail for that one missing '
             'input. A rent feed is worth **seven requirements** in %d of the %d markets '
             'below.\n' % (ceil_now, total, seven, len(cand)))
    L.append('No amount of new territory raises any ceiling above %d until that feed exists. '
             'With it, the best market in the catalogue reaches **%d of %d**. Expansion is '
             'the second lever here, not the first.\n' % (ceil_now, best, total))
    L.append('## Every covered market, ranked\n')
    L.append('| Market | Answerable now | Ceiling | Pulls to ceiling | With a rent feed | '
             'Ranked submarkets | Permanently unanswerable |')
    L.append('|---|---:|---:|---:|---:|---:|---|')
    for _a, _b, _c2, code, c, d in cand:
        L.append('| **%s** | %d | %d | %d | **%d** | %s | %s |'
                 % (NAME.get(code, code), c['now'], c['ceiling'], c['gap'], c['withrent'],
                    (d.get('n', 0) if d else 0), ', '.join('`%s`' % p for p in c['permanent']) or '—'))
    L.append('\n*Ceiling* is what the market reaches if every `named` and `blocked` row were '
             'pulled. A low ceiling is permanent; a large gap is only work.\n')

    thin = thin_rows(cand)
    if thin:
        L.append('## Markets a rent feed barely helps\n')
        L.append('These gain almost nothing from a rent feed because no **value row** is '
                 'recorded for them. The obvious reading is that the inventory simply never '
                 'wrote the row down — so each is cross-checked against '
                 '`crosswalk/usecodes.json`, which independently declares the field '
                 '`top_screen.py` is allowed to rank on, measured against a live layer. '
                 'Where both records are silent, the gap is real and needs a data session, '
                 'not an edit:\n')
        L.append('| Market | Ceiling | Gain from a rent feed | Cross-check |')
        L.append('|---|---:|---:|---|')
        for name, c, kind in thin:
            L.append('| %s | %d | +%d | %s |'
                     % (name, c['ceiling'], c['withrent'] - c['ceiling'], kind))
        L.append('\n`scripts/crosscheck_sources.py` fails the build when the two records '
                 'disagree in the dangerous direction — an inventory promising a value the '
                 'ranking engine cannot rank on, which makes a market read as expandable '
                 'and screen into nothing.\n')

    un = unnamed_values()
    if un:
        L.append('## Values reported in prose, with no column named\n')
        L.append('The most recoverable line on this page. In each of these rows the pull '
                 'measured a value and the inventory wrote it down in words — and nobody '
                 'recorded **which field**. `crosswalk/usecodes.json` declares the column '
                 '`top_screen.py` is allowed to rank on, so a value nobody named is a '
                 'value nothing can rank.\n')
        L.append('This is a documentation task against an existing pull, not a new data '
                 'session. It is also not something to guess: the column name has to come '
                 'from the pull, not from the prose.\n')
        L.append('| State | Row | What the inventory says |')
        L.append('|---|---|---|')
        for state, q, clause in un:
            L.append('| %s | %s | "%s" |' % (state, q, clause))
        L.append('')

    L.append('## Greenfield — demand measured, no inventory written\n')
    if green:
        L.append('| State | Ranked submarkets | Best score |')
        L.append('|---|---:|---:|')
        for code, a in green:
            L.append('| %s | %d | %s |' % (code, a['n'],
                     ('%.1f' % a['best']) if a['best'] is not None else 'unknown'))
        L.append('\nThese carry measured demand and no coverage inventory at all. Writing '
                 'one is a desk afternoon and tells you whether an edition is possible '
                 'before anyone builds one.\n')
    else:
        L.append('None — every state with measured demand has an inventory.\n')

    L.append('## What the classifier could not read\n')
    if unclassified:
        L.append('%d coverage rows matched no field pattern. They **contribute nothing** to '
                 'any score above, which understates those markets rather than overstating '
                 'them — the safe direction, since overstating a ceiling ships an edition '
                 'that cannot answer its own screen. Listed so the blind spots are visible:\n'
                 % len(unclassified))
        for s, q in unclassified:
            L.append('- `%s` — %s' % (s, q))
        L.append('')
    else:
        L.append('Every coverage row was classified.\n')
    open(path, 'w', encoding='utf-8').write('\n'.join(L))
    return path, len(cand), len(green)


def main():
    if '--write' in sys.argv:
        path = sys.argv[sys.argv.index('--write') + 1]
        p, n, g = write(path)
        print('  · wrote %s — %d covered markets, %d greenfield states' % (p, n, g))
        return 0
    if '--check' in sys.argv:
        cov, total, unclassified = by_state()
        if not cov:
            die('no state parsed from the coverage inventory')

        # TWO TRAPS THIS CLASSIFIER FELL INTO, PINNED SO NEITHER RETURNS.
        #
        # 1. Negation. Indiana's building-attributes row denies a sale price in
        #    the same sentence that reports assessed values. Crediting the
        #    denial would present a non-disclosure county as a sale-publishing
        #    market.
        ind = [r for r in rows() if r['state'] == 'indiana'
               and r['q'] == 'Building attributes']
        if ind:
            pos, neg = verdict_fields(ind[0]['source'])
            if 'sale' in pos or 'sale' not in neg:
                die('the verdict reader credited a DENIED sale field on Indiana\'s '
                    'building-attributes row, whose text reads "no sale price at all". '
                    'A keyword scan that ignores negation turns a non-disclosure county '
                    'into a disclosure market.')
            # Indiana reports assessed values in PROSE and names no column, so
            # it must NOT be credited - the crosswalk declares no rankable field
            # either, and crediting it put the two records in contradiction.
            # The finding is surfaced instead, by unnamed_values() below.
            if 'price' in pos:
                die('Indiana was credited with a value field from prose alone. Its row '
                    'reports assessed values without naming a column, and ohio_dte '
                    'declares none - so nothing can rank it, and crediting it puts the '
                    'inventory in contradiction with the crosswalk.')
        # 2. The exclusion list must apply to the verdict as well as the
        #    question, or an excluded row re-credits itself through its own
        #    detail. California's rent-REGULATION row mentions "rent boards".
        ca = [r for r in rows() if r['state'] == 'california'
              and 'Rent-regulation' in r['q']]
        if ca:
            if not NOT_A_FIELD.search(ca[0]['q']):
                die('California\'s rent-regulation row is no longer excluded by question. '
                    'A regulation flag is not an income figure.')
            if 'rent' in cov['california']['fields']:
                die('California is credited with a rent field. Its only rent-shaped row is '
                    'a REGULATION flag, and crediting it once moved the ceiling from 7 to '
                    '14 — an edition that could not answer a single cash-flow question.')
        for name, c in cov.items():
            if c['ceiling'] > total:
                die('%s reports a ceiling of %d above the standard\'s %d requirements'
                    % (name, c['ceiling'], total))
            if c['now'] > c['ceiling']:
                die('%s answers %d now and has a ceiling of %d — a market cannot answer '
                    'more than its ceiling' % (name, c['now'], c['ceiling']))
        print('  · expansion rank: %d states, %d requirements, %d unclassified rows '
              '(none counted as capability)' % (len(cov), total, len(unclassified)))
        return 0
    report()
    return 0


if __name__ == '__main__':
    sys.exit(main())
