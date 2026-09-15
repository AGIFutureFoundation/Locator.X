#!/usr/bin/env python3
"""deck_figures — every number in the investor deck, measured at build time.

The rule the blog already follows (content/blog/*.md resolve their figures from
market/*.json rather than typing them inline) matters more in an investor deck
than anywhere else in this repository, because a deck is the one document that
gets screenshotted, forwarded and quoted back six months later. A figure typed
into a slide is a figure nobody will ever re-check.

So the deck source carries {{placeholders}} and no digits. This module produces
the figures, by RUNNING THE MEASUREMENT rather than reading a cached copy: it
counts the records in market/editions.json, counts the source files on disk,
counts the coverage gate rows, and reads the validators' own output. If a
measurement cannot be made, the figure is absent and the build fails rather
than substituting a plausible number.

Usage:
  python3 scripts/deck_figures.py           # prints every figure
  python3 scripts/deck_figures.py --json    # the same figures, for the video builder
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def die(msg):
    raise SystemExit('DECK FIGURES STOPPED — ' + msg)


def _run(args):
    r = subprocess.run([sys.executable] + args, capture_output=True, text=True, cwd=ROOT)
    if r.returncode != 0:
        die('%s failed, so its figures cannot be quoted:\n%s' % (args, (r.stdout + r.stderr)[-600:]))
    return r.stdout + r.stderr


def _n(pattern, text, what):
    m = re.search(pattern, text)
    if not m:
        die('could not measure %s — the validator output did not match %r. A deck figure '
            'that stops being measurable does not get a fallback.' % (what, pattern))
    return int(m.group(1).replace(',', ''))


def figures():
    f = {}

    # ---- the record layer, from the measured edition manifest ----
    ed = json.load(open(os.path.join(ROOT, 'market', 'editions.json'), encoding='utf-8'))
    rows = ed['editions']
    meas = [e for e in rows if e.get('records_measured')]
    if not meas:
        die('no edition in market/editions.json carries a live-measured record count')
    f['editions_total'] = len(rows)
    f['editions_measured'] = len(meas)
    f['records'] = sum(e['records_measured'] for e in meas)
    f['records_date'] = sorted({e.get('records_measured_on', '') for e in meas})[-1]
    big = max(meas, key=lambda e: e['records_measured'])
    f['largest_edition_records'] = big['records_measured']
    f['largest_edition_mb'] = round(big['bytes'] / 1e6)
    f['fleet_mb'] = round(sum(e['bytes'] for e in rows) / 1e6)

    # ---- the scale ceiling, measured not assumed ----
    sc = json.load(open(os.path.join(ROOT, 'market', 'edition_scale.json'), encoding='utf-8'))
    fd = sc['findings']
    f['bytes_per_record'] = int(fd['bytes_per_record'])
    f['heap_kb_per_record'] = int(fd['heap_kb_per_record'])

    # ---- coverage: the honest inventory ----
    cov = _run(['scripts/coverage_rollup.py'])
    f['coverage_rows'] = _n(r'(\d+) gate rows', cov, 'coverage gate rows')
    f['coverage_shipped'] = _n(r'(\d+) shipped', cov, 'shipped coverage rows')
    f['coverage_pulled'] = _n(r'(\d+) pulled', cov, 'pulled coverage rows')
    f['coverage_named'] = _n(r'(\d+) named', cov, 'named coverage rows')
    f['coverage_blocked'] = _n(r'(\d+) blocked', cov, 'blocked coverage rows')
    f['coverage_norecord'] = _n(r'(\d+) no public record', cov, 'no-public-record rows')

    # ---- crosswalk, curriculum, market ----
    cw = _run(['crosswalk/validate_usecodes.py'])
    f['jurisdictions'] = _n(r'(\d+) jurisdictions', cw, 'jurisdictions')
    f['usecodes'] = _n(r'(\d+) code mappings', cw, 'use-code mappings')

    cu = _run(['curriculum/validate.py'])
    f['curriculum_items'] = _n(r'(\d+) curriculum items', cu, 'curriculum items')
    f['tracks'] = _n(r'(\d+) tracks shipped', cu, 'tracks')
    f['lessons'] = _n(r'(\d+) lessons', cu, 'lessons')

    mk = _run(['market/validate_market.py'])
    f['corridors'] = _n(r'(\d+) corridor areas', mk, 'corridor areas')
    f['projects'] = _n(r'(\d+) announced projects', mk, 'announced projects')
    f['campuses'] = _n(r'(\d+) campuses', mk, 'campuses')
    f['submarkets'] = _n(r'([\d,]+) ranked submarkets', mk, 'ranked submarkets')
    f['submarket_states'] = _n(r'in (\d+) covered states', mk, 'covered states')
    f['lodging'] = _n(r'([\d,]+) lodging records', mk, 'lodging records')

    # ---- the platform itself, counted from disk ----
    src = [x for x in os.listdir(os.path.join(ROOT, 'src')) if x.endswith('.js')]
    f['modules'] = len(src)
    f['module_lines'] = sum(sum(1 for _ in open(os.path.join(ROOT, 'src', x), encoding='utf-8'))
                            for x in src)
    blog = [x for x in os.listdir(os.path.join(ROOT, 'content', 'blog')) if x.endswith('.md')]
    f['articles'] = len(blog)
    f['article_words'] = sum(len(open(os.path.join(ROOT, 'content', 'blog', x),
                                      encoding='utf-8').read().split()) for x in blog)

    # ---- governance, counted from the validators that enforce it ----
    wf = open(os.path.join(ROOT, '.github', 'workflows', 'validate.yml'), encoding='utf-8').read()
    steps = re.findall(r'^      - name: (.+)$', wf, re.M)
    gates = [s for s in steps if not s.lower().startswith('install')]
    f['gates'] = len(gates)

    co = _run(['scripts/validate_company.py'])
    f['entities'] = _n(r'(\d+) entities', co, 'entities in the register')
    f['risks'] = _n(r'(\d+) risks', co, 'risks in the register')
    f['linted_files'] = _n(r'(\d+) markdown files linted', co, 'linted files')

    ls = _run(['scripts/validate_landscape.py'])
    f['landscape_tools'] = _n(r'(\d+) tools registered', ls, 'tools in the register')
    f['landscape_verified'] = _n(r'(\d+) verified against a vendor page', ls,
                                 'verified competitor prices')
    f['capability_claims'] = _n(r'(\d+) measured capability claims', ls, 'capability claims')

    # ---- what is NOT built, counted from the positioning table ----
    pos = open(os.path.join(ROOT, 'docs', 'company', 'POSITIONING.md'), encoding='utf-8').read()
    brand = [l for l in pos.split('\n') if l.startswith('| **')]
    f['products'] = len(brand)
    f['products_notbuilt'] = sum(1 for l in brand if '**not built**' in l)
    f['products_partial'] = sum(1 for l in brand if '**partial**' in l)

    ag = open(os.path.join(ROOT, 'docs', 'company', 'AGENTS.md'), encoding='utf-8').read()
    arows = [l for l in ag.split('\n') if l.startswith('| **') and l.count('|') >= 6]
    f['agents'] = len(arows)
    f['agents_shipping'] = sum(1 for l in arows if '**ships**' in l)

    # ---- how far the record layer reaches on SALE PRICES ----
    # A public claim about sale-price coverage has to be a measured claim about
    # OUR inventory, never an assertion about what a state publishes - several
    # of the states without a sale row may publish one we have not written down.
    sys.path.insert(0, HERE)
    import expansion_rank as _ER
    cov, _total, _unk = _ER.by_state()
    f['states_inventoried'] = len(cov)
    f['states_with_sale'] = sum(1 for c in cov.values() if 'sale' in c['fields'])
    f['states_without_sale'] = f['states_inventoried'] - f['states_with_sale']

    return f


def main():
    f = figures()
    if '--json' in sys.argv:
        print(json.dumps(f, indent=1, sort_keys=True))
        return 0
    for k in sorted(f):
        v = f[k]
        print('  %-24s %s' % (k, ('{:,}'.format(v) if isinstance(v, int) else v)))
    print('\n  %d figures, every one measured at build time' % len(f))
    return 0


if __name__ == '__main__':
    sys.exit(main())
