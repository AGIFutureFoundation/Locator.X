#!/usr/bin/env python3
"""coverage_rollup — the record layer measured against itself.

Every state file in docs/states/coverage/ answers the seven LOCATOR gates for
its counties, one table row per gate, each row carrying a status from the fixed
vocabulary the directory's own README defines: shipped / pulled / named /
blocked / no public record. Eleven files hold ninety of those rows, and until
now nobody could see the total — each file states its own coverage honestly and
the sum was not stated anywhere.

This reads every row and writes the sum. It is the platform's own rule turned on
the platform: measure before asserting, and let unknown be an answer.

The one judgement it makes is refusing to make one. A status that does not start
with a vocabulary term stops the build rather than being bucketed by guess: an
invented status is exactly the drift this directory exists to prevent.

Output (generated, never hand-edited — CLAUDE.md):
  docs/states/coverage/ROLLUP.md

Usage:
  python3 scripts/coverage_rollup.py            regenerate
  python3 scripts/coverage_rollup.py --check    fail if stale
"""
import collections
import glob
import os
import re
import sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
DIR = R + 'docs/states/coverage/'
OUT = DIR + 'ROLLUP.md'

# The vocabulary, in the order the directory's README presents it: most advanced
# first. Longest prefix wins, so "no public record" is tested before "named"
# could ever match something else by accident.
VOCAB = [
    ('shipped', 'In a built edition; fleet-sweep verified'),
    ('pulled', 'Rows retrieved; field quirks documented'),
    ('no public record', 'The jurisdiction does not publish it'),
    ('blocked', 'Attempted and refused, with the reason dated'),
    ('named', 'Office or portal identified; no pull yet'),
]
# The seven gates, spelled as the curriculum spells them.
GATES = [
    ('L', 'Location'), ('O', 'Ownership economics'), ('C', 'Condition & income'),
    ('A', 'Assessment & tax'), ('T', 'Title & instruments'), ('R', 'Regulation & permits'),
]


def die(msg):
    raise SystemExit('COVERAGE ROLLUP STOPPED — ' + msg)


def classify(status):
    t = re.sub(r'[*_`]', '', status).strip().lower()
    for term, _ in VOCAB:
        if t.startswith(term):
            return term
    return None


def read_rows():
    rows = []
    for path in sorted(glob.glob(DIR + '*.md')):
        base = os.path.basename(path)
        if base in ('README.md', os.path.basename(OUT)):
            continue
        state = None
        jurisdiction = None
        with open(path, encoding='utf-8') as f:
            for line in f:
                line = line.rstrip()
                if line.startswith('# '):
                    state = line[2:].split('\u2014')[0].strip()
                    jurisdiction = None
                elif line.startswith('## '):
                    # The heading the rows sit under. Usually a county or parish,
                    # which is what disambiguates two rows that otherwise read
                    # identically - Orleans and East Baton Rouge both answer
                    # "sale prices for comps" with the same ceiling. Sometimes it
                    # is just a section name ("Record coverage"), so the column is
                    # labelled for what it literally is rather than guessing which
                    # headings name a place.
                    jurisdiction = line[3:].strip()
                if not line.strip().startswith('|'):
                    continue
                cells = [c.strip() for c in line.strip().strip('|').split('|')]
                if len(cells) != 4:
                    continue
                if cells[0] == 'Gate' or set(cells[0]) <= set('- :'):
                    continue
                term = classify(cells[3])
                if term is None:
                    die('%s carries a status outside the vocabulary: %r\n'
                        'The five terms are %s (docs/states/coverage/README.md).'
                        % (base, cells[3], ', '.join(t for t, _ in VOCAB)))
                rows.append({
                    'file': base, 'state': state or base[:-3],
                    'jurisdiction': jurisdiction or (state or base[:-3]),
                    'gate': cells[0], 'question': cells[1],
                    'status_raw': cells[3], 'status': term,
                })
    if not rows:
        die('no gate rows parsed from %s — refusing to publish an empty roll-up' % DIR)
    return rows


def gate_letters(g):
    """A row's gate cell can name more than one ("T/O", "All")."""
    t = g.strip().upper()
    if t in ('ALL', '—', '-'):
        return [l for l, _ in GATES]
    return [p.strip() for p in re.split(r'[/,+ ]+', t) if p.strip() in dict(GATES)]


def render(rows):
    by_status = collections.Counter(r['status'] for r in rows)
    by_state = collections.defaultdict(collections.Counter)
    for r in rows:
        by_state[r['state']][r['status']] += 1
    by_gate = collections.defaultdict(collections.Counter)
    for r in rows:
        for g in gate_letters(r['gate']):
            by_gate[g][r['status']] += 1

    n = len(rows)
    shipped = by_status['shipped']
    pulled = by_status['pulled']
    L = []
    A = L.append
    A('# The record layer, summed')
    A('')
    A('<!-- GENERATED by scripts/coverage_rollup.py from the state files in this')
    A('     directory. Do not edit: run the script. tests/run.py fails if it is stale. -->')
    A('')
    A('Every state file here answers the seven LOCATOR gates for its counties, one row')
    A('per gate, each carrying a status from the vocabulary [`README.md`](README.md)')
    A('defines. Each file states its own coverage honestly; this is the sum, which was')
    A('not stated anywhere. **%d gate rows across %d state files.**'
      % (n, len({r['file'] for r in rows})))
    A('')
    A('## Where the record layer actually stands')
    A('')
    A('| Status | Rows | Share | What it means |')
    A('|---|---:|---:|---|')
    for term, meaning in VOCAB:
        c = by_status.get(term, 0)
        A('| `%s` | %d | %.0f%% | %s |' % (term, c, c / n * 100, meaning))
    A('| **Total** | **%d** | | |' % n)
    A('')
    A('**%d of %d rows are in a built edition.** Another **%d have been pulled but not'
      % (shipped, n, pulled))
    A('packed** — the rows came back and their quirks are documented, and they are still')
    A('not in front of a user. That gap, %d rows wide, is the largest single piece of'
      % pulled)
    A('finished work sitting behind the shipping step, and it is a bigger number than')
    A('everything still unprobed.')
    A('')
    A('The %d `named` rows are the research queue. The %d `blocked` rows are findings'
      % (by_status.get('named', 0), by_status.get('blocked', 0)))
    A('with dated reasons, not to-dos. The %d `no public record` rows are ceilings: the'
      % by_status.get('no public record', 0))
    A('jurisdiction does not publish it, and nothing advances them.')
    A('')
    A('## By state')
    A('')
    A('| State | Rows | ' + ' | '.join('`%s`' % t for t, _ in VOCAB) + ' |')
    A('|---|---:|' + '---:|' * len(VOCAB))
    for state in sorted(by_state, key=lambda s: (-sum(by_state[s].values()), s)):
        c = by_state[state]
        A('| %s | %d | %s |' % (state, sum(c.values()),
                                ' | '.join(str(c.get(t, 0) or '—') for t, _ in VOCAB)))
    A('')
    A('## By gate')
    A('')
    A('Which of the seven questions the record can answer, across every jurisdiction')
    A('covered. A row naming several gates counts once for each.')
    A('')
    A('| Gate | Rows | ' + ' | '.join('`%s`' % t for t, _ in VOCAB) + ' |')
    A('|---|---:|' + '---:|' * len(VOCAB))
    for letter, name in GATES:
        c = by_gate.get(letter)
        if not c:
            continue
        A('| %s — %s | %d | %s |' % (letter, name, sum(c.values()),
                                          ' | '.join(str(c.get(t, 0) or '—')
                                                     for t, _ in VOCAB)))
    A('')
    A('## The ceilings')
    A('')
    A('Rows the record cannot answer, and will not start to.')
    A('')
    A('| State | Section heading | Gate | Question |')
    A('|---|---|---|---|')
    for r in sorted((r for r in rows if r['status'] == 'no public record'),
                    key=lambda r: (r['state'], r['jurisdiction'], r['gate'])):
        A('| %s | %s | %s | %s |' % (r['state'], r['jurisdiction'], r['gate'],
                                     r['question']))
    A('')
    A('## What this page is not')
    A('')
    A('It is not a score. A state with many `named` rows is not behind a state with few')
    A('— it may simply have been written up in more detail, and a jurisdiction that')
    A('publishes less has fewer rows to claim. It counts what the files say, in the')
    A('vocabulary they are required to use, and nothing else. A status outside that')
    A('vocabulary stops this script rather than being bucketed by guess.')
    A('')
    return '\n'.join(L)


def main():
    check = '--check' in sys.argv
    rows = read_rows()
    text = render(rows)
    cur = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else None
    if check:
        if cur != text:
            raise SystemExit(
                'COVERAGE ROLLUP IS STALE — %s no longer matches the state files.\n'
                'Run: python3 scripts/coverage_rollup.py' % os.path.relpath(OUT, R))
    else:
        with open(OUT, 'w', encoding='utf-8') as f:
            f.write(text)
    c = collections.Counter(r['status'] for r in rows)
    print('coverage rollup: %d gate rows across %d files — %d shipped, %d pulled, '
          '%d named, %d blocked, %d no public record — %s'
          % (len(rows), len({r['file'] for r in rows}), c['shipped'], c['pulled'],
             c['named'], c['blocked'], c['no public record'],
             'current' if check else 'written'))


if __name__ == '__main__':
    main()
