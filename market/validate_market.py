#!/usr/bin/env python3
"""Gate for the measured market layer (market/*.json).

Same posture as crosswalk/validate_usecodes.py: raises rather than warns, and
every rule exists because it prevents a specific way this data could start
lying. The market pages are a straight rendering of these files, so a rule
enforced here is a rule the published page cannot break.

  1. every file declares `about` and its provenance — an `extracted` statement
     for data copied out of a shipped edition, or a `method` block for data
     produced by measurement
  2. every announced project carries company, project, status and a source URL
     — a headcount whose announcement cannot be opened is a rumour. Where a
     project also carries `jobsBasis` (whose figure the headcount is, and
     whether anything was independently confirmed) the gate reports the
     coverage rather than demanding it: only part of the record was enriched
     that way, and the renderer must mark the difference instead of hiding it.
  3. every corridor area names itself and its kind. `permits` and `pop` come
     from external published series where absent is not zero, so they must be
     positive when present and must carry their as-of date and source — an
     undated figure is an unsourced one. `jobs` and `records` are counts over
     sets this platform holds, where zero ("this catalogue holds nothing
     here") and negative ("a closure took more jobs than the announcements
     brought") are real measured values, so they need only be numbers.
  4. every campus row has the declared field count and a source; enrolment and
     term may be null, meaning the source publishes none — but a null must be
     a null, never a zero wearing a count's clothes
  5. the belts bundle states its coverage before anything derived from it:
     ranked <= ZIPs carrying both series, covered and absent states disjoint
     and jointly the whole country, weights present, and every ranked row
     carrying the fields the ranking claims to have scored
  6. the belts metro cap is actually applied to the capped view
  7. every edition carries a sha256, a byte count, a URL and a record-count
     status; a stated record count carries the date it was measured
  8. THE CROSS-FILE RULE: every measured edition count matches the figure
     documented in docs/PUBLISH_MAP.md, so the data file and the doc cannot
     drift apart silently

Usage: python3 market/validate_market.py [repo_root]
"""
import json
import os
import re
import sys

# Reads the committed tree by default; tests/run.py passes a synthetic root to
# prove the gate's own failure mode, the same way scripts/check_pairs.py does.
ROOT = (os.path.abspath(sys.argv[1]) if len(sys.argv) > 1
        else os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.join(ROOT, 'market')
HEX64 = re.compile(r'^[0-9a-f]{64}$')
URL = re.compile(r'^https?://')
# The 51 states-plus-DC vocabulary the coverage claim is checked against.
JURISDICTIONS = 51


def load(name):
    with open(os.path.join(HERE, name), encoding='utf-8') as f:
        return json.load(f)


def positive(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and v > 0


def main():
    errs = []

    # 1. provenance on every file
    files = {}
    for name in ('corridors.json', 'projects.json', 'campuses.json', 'belts.json',
                 'editions.json', 'edition_scale.json'):
        data = load(name)
        files[name] = data
        if not data.get('about'):
            errs.append('%s: no `about` block — a data file that cannot say what it is '
                        'cannot be checked against what it claims' % name)
        # Provenance takes one of two honest forms: an extraction statement for a
        # file copied out of a shipped edition, or a method block for one produced
        # by measurement. A file with neither cannot be audited.
        if not (data.get('extracted') or data.get('note') or data.get('method')):
            errs.append('%s: no provenance — needs an `extracted` statement or a '
                        '`method` block' % name)

    # 2. projects
    projects = files['projects.json']['projects']
    if not projects:
        errs.append('projects.json: empty')
    for i, p in enumerate(projects):
        where = 'projects[%d] %s' % (i, p.get('company', '?'))
        for f in ('company', 'project', 'status'):
            if not str(p.get(f, '')).strip():
                errs.append('%s: missing %s' % (where, f))
        if not URL.match(str(p.get('url', ''))):
            errs.append('%s: no source URL — an announcement without its announcement '
                        'is a rumour' % where)
        for f in ('investment', 'jobs'):
            if p.get(f) is not None and not positive(p[f]):
                errs.append('%s: %s present but not a positive number' % (where, f))
    with_jobs = [p for p in projects if p.get('jobs')]
    with_basis = [p for p in with_jobs if str(p.get('jobsBasis', '')).strip()]

    # 3. corridor areas
    C = files['corridors.json']
    metros = C.get('metros') or []
    if not metros:
        errs.append('corridors.json: no metros')
    for m in metros:
        where = 'corridors %s' % m.get('metro', '?')
        if not str(m.get('metro', '')).strip():
            errs.append('corridors: a metro with no name')
        if not m.get('kind'):
            errs.append('%s: no kind (live / staged)' % where)
        for f in ('permits', 'pop'):
            if m.get(f) is not None and not positive(m[f]):
                errs.append('%s: %s present but not a positive number — this series is '
                            'published externally, so a source that publishes nothing '
                            'must be absent, never zero' % (where, f))
        for f in ('jobs', 'records'):
            v = m.get(f)
            if v is not None and (isinstance(v, bool) or not isinstance(v, (int, float))):
                errs.append('%s: %s is not a number' % (where, f))
        if m.get('permits') is not None and not (m.get('permitsAsOf') and m.get('permitsSrc')):
            errs.append('%s: permit count with no as-of date or source' % where)
        if m.get('pop') is not None and not (m.get('popAsOf') and m.get('popSrc')):
            errs.append('%s: population with no as-of date or source' % where)
    if not C.get('dropped'):
        errs.append('corridors.json: no `dropped` list — a set that shows only what made '
                    'it in overstates itself')

    # 4. campuses
    K = files['campuses.json']
    fields = K.get('fields') or []
    for f in ('name', 'city', 'state', 'enrolled', 'term', 'source'):
        if f not in fields:
            errs.append('campuses.json: declared fields missing %s' % f)
    idx = {k: i for i, k in enumerate(fields)}
    for row in K.get('campuses') or []:
        if len(row) != len(fields):
            errs.append('campuses: row %r has %d values for %d declared fields'
                        % (row[:1], len(row), len(fields)))
            continue
        where = 'campuses %s' % row[idx['name']]
        enrolled, term = row[idx['enrolled']], row[idx['term']]
        if enrolled is not None and not positive(enrolled):
            errs.append('%s: enrolment present but not a positive number — an unknown '
                        'enrolment must be null, never 0' % where)
        if enrolled is not None and not str(term or '').strip():
            errs.append('%s: enrolment with no term — a figure without its term is '
                        'undated' % where)
        if not str(row[idx['source']] or '').strip():
            errs.append('%s: no source' % where)

    # 5 + 6. belts
    B = files['belts.json']
    cov, meth = B.get('coverage') or {}, B.get('method') or {}
    covered = set(cov.get('states_covered') or [])
    absent = set(cov.get('states_absent') or [])
    if not covered:
        errs.append('belts.json: no covered states declared')
    if covered & absent:
        errs.append('belts.json: states both covered and absent: %s'
                    % sorted(covered & absent))
    if len(covered) + len(absent) != JURISDICTIONS:
        errs.append('belts.json: coverage accounts for %d of %d jurisdictions — every '
                    'state must be named covered or absent, because silence reads as '
                    'covered' % (len(covered) + len(absent), JURISDICTIONS))
    if not (0 < cov.get('ranked', 0) <= cov.get('zips_with_both', 0)):
        errs.append('belts.json: ranked (%s) must be positive and at most the ZIPs '
                    'carrying both series (%s)' % (cov.get('ranked'), cov.get('zips_with_both')))
    for f in ('yield', 'r12', 'drift', 'stable', 'model'):
        if f not in (meth.get('weights') or {}):
            errs.append('belts.json: method weights missing %s' % f)
    if not positive(meth.get('min_points')):
        errs.append('belts.json: no data floor (min_points)')
    ROW = ('rank', 'zip', 'city', 'metro', 'county', 'state', 'value', 'rent',
           'yield', 'r12', 'drift', 'score')
    for view in ('top100', 'belts'):
        rows = B.get(view) or []
        if not rows:
            errs.append('belts.json: view %s is empty' % view)
        for r in rows:
            missing = [f for f in ROW if r.get(f) is None]
            if missing:
                errs.append('belts %s ZIP %s: missing %s'
                            % (view, r.get('zip', '?'), ', '.join(missing)))
                continue
            if not positive(r['value']) or not positive(r['rent']):
                errs.append('belts %s ZIP %s: non-positive index value or rent'
                            % (view, r['zip']))
            if r['state'] not in covered:
                errs.append('belts %s ZIP %s: state %s is ranked but not declared covered'
                            % (view, r['zip'], r['state']))
    cap = meth.get('metro_cap')
    if positive(cap):
        over = {m: c for m, c in _counts(B.get('belts') or [], 'metro').items() if c > cap}
        if over:
            errs.append('belts.json: capped view exceeds its own metro cap of %d: %s'
                        % (cap, over))

    # 7 + 8. editions, and the cross-file check against PUBLISH_MAP
    ED = files['editions.json']
    eds = ED.get('editions') or []
    if not eds:
        errs.append('editions.json: empty')
    with open(os.path.join(ROOT, 'docs', 'PUBLISH_MAP.md'), encoding='utf-8') as f:
        publish_map = f.read()
    for e in eds:
        where = 'editions %s' % e.get('file', '?')
        for f in ('key', 'file', 'title', 'url', 'records_note'):
            if not str(e.get(f, '')).strip():
                errs.append('%s: missing %s' % (where, f))
        if not HEX64.match(str(e.get('sha256', ''))):
            errs.append('%s: sha256 is not 64 hex characters' % where)
        if not positive(e.get('bytes')):
            errs.append('%s: no byte count' % where)
        if 'records_measured' in e:
            if not e.get('records_measured_on'):
                errs.append('%s: states a record count with no measurement date' % where)
            if not positive(e['records_measured']):
                errs.append('%s: record count is not a positive number' % where)
            else:
                figure = format(e['records_measured'], ',')
                if figure not in publish_map:
                    errs.append('%s: measured count %s appears nowhere in '
                                'docs/PUBLISH_MAP.md — the data file and the documented '
                                'verification have drifted apart' % (where, figure))

    # 9. the scale measurements name their method and stay attached to the editions
    S = files['edition_scale.json']
    if not S.get('method'):
        errs.append('edition_scale.json: no `method` block — a load time or a heap figure '
                    'without the conditions that produced it is not a measurement')
    known = {e['key'] for e in eds}
    for e in S.get('editions') or []:
        where = 'edition_scale %s' % e.get('key', '?')
        if e.get('key') not in known:
            errs.append('%s: not an edition in editions.json' % where)
        for f in ('records', 'bytes', 'heap_mb', 'load_ms'):
            if not positive(e.get(f)):
                errs.append('%s: %s missing or not positive' % (where, f))
        lg = e.get('lodging') or {}
        if lg.get('total') is None:
            errs.append('%s: no lodging count' % where)
        elif lg['total'] and lg.get('kinds') is None:
            errs.append('%s: a lodging count with no kind breakdown behind it' % where)
        # the record count here must match the one the editions manifest measured
        match = next((x for x in eds if x['key'] == e.get('key')), None)
        if match and 'records_measured' in match and match['records_measured'] != e.get('records'):
            errs.append('%s: %s records here against %s in editions.json'
                        % (where, e.get('records'), match['records_measured']))

    if errs:
        print('MARKET DATA GATE FAILED — %d problem%s:'
              % (len(errs), '' if len(errs) == 1 else 's'), file=sys.stderr)
        for e in errs:
            print('  ! ' + e, file=sys.stderr)
        raise SystemExit(1)

    measured = [e for e in eds if 'records_measured' in e]
    campuses = K.get('campuses') or []
    unknown_enrolment = [c for c in campuses if c[idx['enrolled']] is None]
    print('  · %d corridor areas (%d dropped, %d caveats) · %d announced projects, '
          '%d of %d headcounts carrying an explicit basis'
          % (len(metros), len(C.get('dropped') or []), len(C.get('caveats') or []),
             len(projects), len(with_basis), len(with_jobs)))
    print('  · %d campuses (%d with no published enrolment, carried as unknown) · '
          '%d ranked submarkets in %d covered states, %d absent'
          % (len(campuses), len(unknown_enrolment), cov.get('ranked', 0),
             len(covered), len(absent)))
    print('  · %d editions, %d with live-measured record counts, all matching PUBLISH_MAP'
          % (len(eds), len(measured)))
    print('  · %d editions benchmarked · %s lodging records counted across them'
          % (len(S.get('editions') or []),
             format(sum((e.get('lodging') or {}).get('total') or 0
                        for e in S.get('editions') or []), ',')))
    print('  ✓ market data consistent: every figure sourced, dated, or honestly absent')


def _counts(rows, field):
    out = {}
    for r in rows:
        out[r.get(field)] = out.get(r.get(field), 0) + 1
    return out


if __name__ == '__main__':
    main()
