#!/usr/bin/env python3
"""heartbeat — one command that says whether the repository is healthy, and what it cannot say.

    python3 scripts/heartbeat.py            # human report, exit 1 if anything is red
    python3 scripts/heartbeat.py --json     # the same, as data (for the operator console)
    python3 scripts/heartbeat.py --selftest # the date rules against fixtures (run by tests/run.py)

Three parts, and the third is the reason this file exists:

  GATES      Every `run:` step of .github/workflows/validate.yml, executed exactly as CI
             executes it. The list is READ from the workflow, never typed here, so the
             heartbeat cannot quietly check fewer things than CI does.
  FRESHNESS  The age of every dated source the repo carries. Stale at 90 days, expired at
             180. A date IN THE FUTURE is an error, not a fresh reading: a typo'd year would
             otherwise read "fresh" forever, which is the most confident kind of wrong.
  UNCHECKED  What a green heartbeat does NOT mean. Each item is re-probed every run, so the
             list shrinks by itself the day the thing becomes checkable — and a heartbeat
             that silently skipped these would be the most dangerous file in the repo.
"""
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKFLOW = os.path.join(ROOT, '.github', 'workflows', 'validate.yml')
STALE, EXPIRED = 90, 180
SKIP = ('npm ci', 'python3 -m pip install')   # environment setup, not a gate


def gates_from_workflow(path=WORKFLOW):
    """[(name, shell, workdir)] for every `run:` step of every job, parsed as YAML.

    A hand parser here was found (2026-10-23 review) to drop a whole step whose body
    merely began with `npm ci`, to run `|-` literally, and to crash on a trailing
    block. So: real YAML, only the `npm ci` *command* is stripped from a body, and any
    step shape this file does not understand stops the heartbeat instead of being
    skipped — a gate that is silently not run is the failure this file exists to stop."""
    import yaml
    wf = yaml.safe_load(open(path, encoding='utf-8'))
    out = []
    for job in (wf.get('jobs') or {}).values():
        for st in job.get('steps') or []:
            if 'run' not in st:
                continue
            unknown = set(st) - {'name', 'run', 'env', 'working-directory', 'id', 'shell'}
            if unknown:
                raise SystemExit('heartbeat: workflow step %r has keys it cannot honour: %s'
                                 % (st.get('name'), ', '.join(sorted(unknown))))
            cmds = [c.strip() for line in str(st['run']).splitlines()
                    for c in line.split('&&') if c.strip()]
            cmds = [c for c in cmds if not any(c.startswith(k) for k in SKIP)]
            if not cmds:
                continue
            out.append((st.get('name') or cmds[0], ' && '.join(cmds),
                        st.get('working-directory'), st.get('env') or {}))
    return out


def run_gates():
    res = []
    for name, cmd, wd, env in gates_from_workflow():
        t = time.time()
        p = subprocess.run(cmd, shell=True, cwd=os.path.join(ROOT, wd or ''), capture_output=True,
                           text=True, env=dict(os.environ, **{k: str(v) for k, v in env.items()}))
        tail = (p.stdout + p.stderr).strip().splitlines()[-3:]
        res.append({'gate': name, 'cmd': cmd, 'ok': p.returncode == 0,
                    'rc': p.returncode, 'seconds': round(time.time() - t, 1),
                    'tail': tail if p.returncode else []})
    return res


def classify(date_str, today):
    """('fresh'|'stale'|'expired'|'future'|'unreadable', age_days or None)."""
    # strict YYYY-MM-DD: fromisoformat also accepts 20261020, which hides a malformed source
    # (an ISO timestamp is fine — its date part is read)
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}(T[0-9:.+\-Z]+)?', str(date_str)):
        return 'unreadable', None
    try:
        d = dt.date.fromisoformat(str(date_str)[:10])
    except ValueError:
        return 'unreadable', None
    age = (today - d).days
    if age < 0:
        return 'future', age
    if age >= EXPIRED:
        return 'expired', age
    if age >= STALE:
        return 'stale', age
    return 'fresh', age


def _j(rel, *keys):
    d = json.load(open(os.path.join(ROOT, rel), encoding='utf-8'))
    for k in keys:
        d = d[k]
    return d


def dated_sources():
    """(label, date, where) for every date the repo stakes a claim on. A source whose file or
    key has gone missing is reported as unreadable, never dropped from the list."""
    out = []
    probes = [
        ('Corridor market data as_of', lambda: _j('market/corridors.json', 'as_of'), 'market/corridors.json'),
        ('Edition scale measured_on', lambda: _j('market/edition_scale.json', 'measured_on'), 'market/edition_scale.json'),
        ('Agent register reviewed', lambda: _j('content/agents/hive.json', 'reviewed'), 'content/agents/hive.json'),
        ('Editions manifest generated', lambda: _j('market/editions.json', 'generated'), 'market/editions.json'),
    ]
    for label, get, where in probes:
        try:
            out.append((label, get(), where))
        except Exception as e:   # missing file or key is a finding, not a skip
            out.append((label, 'missing: %s' % type(e).__name__, where))
    # newest date recorded in the publish map = last republish anyone wrote down
    try:
        dates = re.findall(r'20\d\d-\d\d-\d\d', open(os.path.join(ROOT, 'docs/PUBLISH_MAP.md'),
                                                      encoding='utf-8').read())
        out.append(('Last republish recorded', max(dates) if dates else 'missing: none', 'docs/PUBLISH_MAP.md'))
    except OSError:
        out.append(('Last republish recorded', 'missing: file', 'docs/PUBLISH_MAP.md'))
    return out


def unchecked():
    """What green does not mean. Each probe re-runs; an item that becomes checkable drops off."""
    items = []
    data = os.path.join(ROOT, 'data')
    has_data = os.path.isdir(data) and any(n for n in os.listdir(data) if n not in ('README.md', '.gitkeep'))
    if not has_data:
        items.append(('Editions build', 'No data tree in this checkout (data/ is gitignored), so no '
                      'edition can be rebuilt or record-counted here. Gates check source, not output.'))
    if not os.path.exists(os.path.join(ROOT, 'scripts', 'compress_data.py')):
        items.append(('compress_data.py', 'Not committed; the build cannot be reproduced from a clean clone '
                      'even with the data tree.'))
    if not os.path.isdir(os.path.join(ROOT, 'licensing')):
        items.append(('Licensing dataset', 'The 51-jurisdiction licensing/commerce/evals layer built 2026-10-05 '
                      'is not in this repository, so none of its figures are verified by any gate.'))
    items.append(('Live published pages', 'This container has no egress; the heartbeat cannot fetch a '
                  'published edition to confirm it matches HEAD. Only the publish map\'s own dates are read.'))
    items.append(('Rendered UI', 'Gates do not drive a browser. Visual and accessibility regressions are '
                  'caught only by fleet-smoke.yml or a manual sweep.'))
    items.append(('External links', 'Outbound links are swept quarterly by link-rot.yml, not by these gates; '
                  'a dead source link can sit between sweeps.'))
    return [{'item': a, 'why': b} for a, b in items]


def report(today=None):
    today = today or dt.date.today()
    gates = run_gates()
    fresh = []
    for label, d, where in dated_sources():
        st, age = classify(d, today)
        fresh.append({'source': label, 'date': d, 'where': where, 'status': st, 'age_days': age})
    red = [g for g in gates if not g['ok']] + [f for f in fresh if f['status'] in ('future', 'unreadable')]
    amber = [f for f in fresh if f['status'] in ('stale', 'expired')]
    try:
        head = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT,
                              capture_output=True, text=True).stdout.strip()
    except OSError:
        head = None
    verdict = 'red' if red else ('amber' if amber else 'green')
    return {'schema': 'locator.x/heartbeat/1', 'run_on': today.isoformat(), 'head': head,
            'verdict': verdict, 'gates_total': len(gates), 'gates_passed': sum(g['ok'] for g in gates),
            'gates': gates, 'freshness': fresh, 'unchecked': unchecked(),
            'thresholds_days': {'stale': STALE, 'expired': EXPIRED}}


def selftest():
    t = dt.date(2026, 10, 23)
    cases = [('2026-10-20', 'fresh'), ('2026-07-25', 'stale'), ('2026-04-26', 'expired'),
             ('2027-10-20', 'future'), ('2026-10-24', 'future'), ('20261020', 'unreadable'),
             ('2026-09-11T19:16:04+00:00', 'fresh'), ('2026-13-01', 'unreadable'),
             ('missing: KeyError', 'unreadable')]
    bad = [(d, w, classify(d, t)[0]) for d, w in cases if classify(d, t)[0] != w]
    g = gates_from_workflow()
    if len(g) < 10:
        bad.append(('workflow', '>=10 gates', len(g)))
    if not any('tests/run.py' in c for _, c, _, _ in g):
        bad.append(('workflow', 'tests/run.py present', 'absent'))
    if any('npm ci' in c for _, c, _, _ in g):
        bad.append(('workflow', 'setup step skipped', 'npm ci counted as a gate'))
    # parser mutations the 2026-10-23 review found: a step that begins with npm ci keeps its
    # gate; |- and folded blocks parse as YAML; a trailing block does not crash
    import tempfile
    wf = ('jobs:\n  g:\n    steps:\n      - name: a\n        run: npm ci && python3 tests/run.py\n'
          '      - name: b\n        run: |-\n          python3 x.py\n          python3 y.py\n'
          '      - name: c\n        run: >\n          python3 scripts/build_deck.py\n          --check\n'
          '      - name: d\n        run: |\n')
    tmp = os.path.join(tempfile.mkdtemp(), 'wf.yml')
    open(tmp, 'w').write(wf)
    try:
        got = [c for _, c, _, _ in gates_from_workflow(tmp)]
    except Exception as e:
        got = ['CRASH %s' % e]
    want = ['python3 tests/run.py', 'python3 x.py && python3 y.py', 'python3 scripts/build_deck.py --check']
    if got != want:
        bad.append(('parser', want, got))
    if bad:
        print('heartbeat selftest FAILED: %r' % bad)
        return 1
    print('heartbeat selftest ok — %d date cases, %d gates read from CI' % (len(cases), len(g)))
    return 0


def main(argv):
    if '--selftest' in argv:
        return selftest()
    r = report()
    if '--json' in argv:
        print(json.dumps(r, indent=1))
    else:
        print('HEARTBEAT %s · HEAD %s · %s' % (r['verdict'].upper(), r['head'], r['run_on']))
        print('\nGates (read from CI): %d/%d pass' % (r['gates_passed'], r['gates_total']))
        for g in r['gates']:
            print('  %s %-58s %5.1fs' % ('✓' if g['ok'] else '✗', g['gate'][:58], g['seconds']))
            for l in g['tail']:
                print('      ' + l)
        print('\nFreshness (stale %dd, expired %dd, future = error):' % (STALE, EXPIRED))
        for f in r['freshness']:
            age = '' if f['age_days'] is None else '%dd' % f['age_days']
            print('  %-9s %-32s %-12s %5s  %s' % (f['status'], f['source'], f['date'], age, f['where']))
        print('\nNOT checked by a green heartbeat:')
        for u in r['unchecked']:
            print('  · %s — %s' % (u['item'], u['why']))
    return 1 if r['verdict'] == 'red' else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
