#!/usr/bin/env python3
"""crosscheck_sources — the inventory and the crosswalk must agree.

This repository records the same fact twice, in two places, for two different
readers, and until now nothing checked that the two agreed:

  docs/states/coverage/*.md   says whether a jurisdiction's record publishes a
                              VALUE at all, for a human deciding where to expand
  crosswalk/usecodes.json     declares the `value_field` that top_screen.py is
                              allowed to rank on, measured against a live layer

Two independent records of one fact are a gift: when they disagree, one of them
is wrong, and which one it is tells you what to do. The four combinations:

  both say yes    consistent — the market can be valued and ranked
  both say no     consistent — a REAL gap. A data session, not a doc edit
  crosswalk yes,  a DOCUMENTATION gap: the field exists and was measured, and
  inventory no    the inventory never wrote the row. One row closes it
  inventory yes,  the dangerous one: the inventory promises a value the ranking
  crosswalk no    engine cannot use, so a market looks expandable and screens
                  into nothing

The last case is why this fails the build rather than printing a warning. It was
found the slow way: the expansion ranking reported four markets that a rent feed
barely helped, and the honest guess was "probably a documentation gap". The
crosswalk said otherwise for three of them. A guess that survives one round
becomes a plan in the next.

Usage: python3 scripts/crosscheck_sources.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import expansion_rank as ER  # the inventory parser and the jurisdiction mapping


def die(msg):
    raise SystemExit('CROSSCHECK STOPPED — ' + msg)


def main():
    cov, _total, _unk = ER.by_state()
    xw = ER.crosswalk_values()

    agree_yes, agree_no, doc_gap, contradiction = [], [], [], []
    for state, x in sorted(xw.items()):
        c = cov.get(state)
        if c is None:
            die('crosswalk maps %s but no coverage inventory parsed for it' % state)
        inv = 'price' in c['fields']
        xwv = bool(x['declared'])
        if inv and xwv:
            agree_yes.append(state)
        elif not inv and not xwv:
            agree_no.append(state)
        elif xwv and not inv:
            doc_gap.append((state, x['declared'][0], x['fields'][x['declared'][0]]))
        else:
            contradiction.append((state, x['ids']))

    if contradiction:
        state, ids = contradiction[0]
        die('%s records a VALUE row in its coverage inventory, and crosswalk/usecodes.json '
            'declares no value_field for %s. The inventory promises a value the ranking '
            'engine cannot rank on, so the market reads as expandable and screens into '
            'nothing. One of the two is wrong — fix the record, not the report.%s'
            % (state, ', '.join(ids),
               ('\n  Also: %s' % ', '.join(s for s, _ in contradiction[1:]))
               if len(contradiction) > 1 else ''))

    print('  · crosscheck: %d states valued in both records, %d absent from both '
          '(real gaps), %d documentation gaps'
          % (len(agree_yes), len(agree_no), len(doc_gap)))
    for state, jid, field in doc_gap:
        print('    · %s — the crosswalk measured `%s` on %s and the inventory never wrote '
              'the row. One row closes it.' % (state, field, jid))
    if agree_no:
        print('    · real gaps, corroborated by both records: %s' % ', '.join(agree_no))
    return 0


if __name__ == '__main__':
    sys.exit(main())
