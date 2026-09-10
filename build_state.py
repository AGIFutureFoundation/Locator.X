"""build_state.py — the parameterised state/market edition builder (roadmap v2.0).

The twelve builders grew one copy-paste at a time; build_atlas_nola.py and
build_atlas_bay.py differ only in a handful of strings. This builder makes that
difference a SPEC — a dict of parameters — so a new state edition is a spec entry,
not a new file.

Honesty rules, inherited from the rest of the build:

  * The curriculum gate still runs (lxbuild imports it) and still raises.
  * A spec whose data module is absent fails with the exact path it wanted —
    data is rebuilt locally, never committed (data/README.md).
  * --dry-run VERIFIES WITHOUT BUILDING: it checks that every regionalization
    replacement actually matches the current shell source, so a stale pair is
    caught before it silently ships the wrong city's prose. Measure before
    asserting, applied to string replacement.
  * The evidence ceiling is a parameter: hide_tabs removes app tabs the state's
    record cannot support (the NOLA edition hides the Bay guide and house-hack
    tabs today; a non-disclosure state would hide the comps desk the same way).

The existing build_atlas_*.py remain the canonical builders until a fleet sweep
verifies this builder's output at parity — the 'nola' and 'bay' specs below are
transcribed from them for exactly that comparison. Do not delete the originals
on the strength of a dry run.

Usage:
    python3 build_state.py --list
    python3 build_state.py --dry-run nola
    python3 build_state.py nola          # full build; needs data + node_modules
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lxbuild as B

# ---- the spec registry -----------------------------------------------------
# body/app pairs are (find, replace); every 'find' must exist in the current
# source or the dry run fails — unless listed in known_stale (empty today; it
# existed to keep parity with stale pairs in the original builders, fixed
# 2026-09-09). Regionalization decision of record for the NOLA edition: the
# guide and hacks tabs are HIDDEN (hide_tabs), so their Bay-specific prose
# (rent-control tables, the "Bay Area big four" inspection list, the 5,000-
# record verification claim) is deliberately retained-but-hidden, not
# reworded; the four visible "Bay Area" phrasings are replaced below — the
# market-panel lines with region-neutral wording, because asserting a
# specific ZIP footprint the data module may not carry would be a certainty
# error in prose. Second pass (2026-09-10): the visible SF/Oakland strings
# gained pairs too (map footer credits, research address/city placeholders,
# scout/data preset searches). The map footer needed an app-side fix as
# well — src/app.js used to RESTORE a hard-coded SF credit string when
# switching back to vector basemap, which would have undone the body pair
# at runtime; it now captures the shell's regionalized footer on first
# switch and restores that. Deliberately unchanged everywhere: the academy
# biography (factual history) and the mapping-review dataset table (facts
# about the datasets that review actually used).
SPECS = {
    'nola': dict(
        output='atlas_nola.html',
        title='Locator X New Orleans Atlas',
        self_id='atlasnola',
        data_module='data_atlas_nola.js',
        extra_modules=['sig2_nola.js'],
        hide_tabs=['guide', 'hacks'],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area', 'Locator X dashboard · New Orleans'),
            ('where most Bay Area buyers end up', 'where most buyers in this market end up'),
            ('A walkable Bay Area, built from the catalog',
             'A walkable New Orleans, built from the catalog'),
            ('for every Bay Area ZIP and city', 'for every ZIP and city this edition covers'),
            ('see where the Bay Area can cash-flow', 'see where this market can cash-flow'),
            ('Live mapping for a Bay Area listings app',
             'Live mapping for a New Orleans listings app'),
            ('Records: SF Assessor, Alameda County Assessor',
             'Records: Orleans & Jefferson Parish Assessors'),
            ('1500 Grand Ave, Oakland, CA 94610', '1500 Canal St, New Orleans, LA 70112'),
            ('placeholder="Oakland"', 'placeholder="New Orleans"'),
            ('location=Oakland%2C%20CA', 'location=New%20Orleans%2C%20LA'),
            ('Oakland for-sale', 'New Orleans for-sale'),
            ('Every one of the 128,319 sites', 'Every one of the 125,803 parcels'),
        ],
        app_pairs=[
            ('128,319 real sites from county records',
             '125,803 parcels across Orleans and Jefferson parishes'),
            ('extruding 128,319 sites', 'extruding 125,803 parcels'),
        ],
        known_stale=[],
        standalone=True,
    ),
    'bay': dict(
        output='atlas_bay.html',
        title='Locator X Bay Atlas',
        self_id='atlasbay',
        data_module='data_atlas_bay.js',
        extra_modules=['sig2_bay.js'],
        hide_tabs=['hacks'],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area',
             'Locator X dashboard · Bay Area — full-market atlas'),
            ('Every one of the 128,319 sites', 'Every one of the 161,000 records'),
        ],
        app_pairs=[
            ('128,319 real sites from county records', '161,000 records across four counties'),
            ('extruding 128,319 sites', 'extruding 161,000 records'),
        ],
        known_stale=[],
        standalone=True,
    ),
    # Template for the next wave state. Copy, fill, dry-run. It deliberately
    # raises until every REQUIRED field is real — a stub must not build.
    'florida-template': dict(
        output='atlas_fl.html',
        title='REQUIRED: edition title',
        self_id='REQUIRED',
        data_module='REQUIRED: data_atlas_fl.js, built from the NAL probe pipeline',
        extra_modules=[],
        hide_tabs=[],   # Florida discloses prices — the comps desk can stay
        body_pairs=[],  # REQUIRED: regionalize the shell prose, pair by pair
        app_pairs=[],
        standalone=True,
    ),
}


def _hide_css(tabs):
    if not tabs:
        return ''
    sels = []
    for t in tabs:
        sels += ['button[data-view="%s"]' % t, '#%s' % t]
    return ','.join(sels) + '{display:none!important}\n'


def _apply(text, pairs, label, errors, known_stale=()):
    for find, repl in pairs:
        if find not in text:
            msg = '%s pair not found in source: %r' % (label, find)
            if find in known_stale:
                errors.append(('warn', msg + ' (known stale — no-ops, parity with original builder)'))
            else:
                errors.append(('error', msg))
        text = text.replace(find, repl)
    return text


def _src_concat():
    # src modules only — enough to verify app_pairs without node_modules
    return '\n'.join(B.read(m) for m in B.MODULES
                     if m.startswith('src/') and m != '@SELF@')


def check(key, spec):
    """Dry-run verification: no data, no node_modules, no output."""
    errors = []
    for field in ('output', 'title', 'self_id', 'data_module'):
        if 'REQUIRED' in str(spec.get(field, 'REQUIRED')):
            errors.append(('error', 'field %r is not filled in' % field))
    head, body = B.read('src/head.html'), B.read('src/body.html')
    _apply(body, spec['body_pairs'], 'body', errors, spec.get('known_stale', ()))
    if not re.search(r'<title>[^<]*</title>', head):
        errors.append(('error', 'no <title> in src/head.html to replace'))
    src = _src_concat()
    for find, _ in spec['app_pairs']:
        if find not in src:
            kind = 'warn' if find in spec.get('known_stale', ()) else 'error'
            errors.append((kind, 'app pair not found in src modules: %r' % find))
    data_path = B.R + spec['data_module']
    data_ok = os.path.exists(data_path)
    print('spec %r:' % key)
    print('  output        %s (+ standalone)' % spec['output'] if spec.get('standalone')
          else '  output        %s' % spec['output'])
    print('  data module   %s — %s' % (spec['data_module'],
          'present' if data_ok else 'ABSENT (build will refuse; see data/README.md)'))
    print('  modules       %d in registry, %d extra' % (len(B.MODULES), len(spec['extra_modules'])))
    print('  hidden tabs   %s' % (', '.join(spec['hide_tabs']) or 'none'))
    hard = [m for k, m in errors if k == 'error']
    soft = [m for k, m in errors if k == 'warn']
    print('  replacements  %d body, %d app — %s' % (len(spec['body_pairs']), len(spec['app_pairs']),
          'all live pairs match current source' if not hard else 'PROBLEMS:'))
    for m in hard:
        print('    ! ' + m)
    for m in soft:
        print('    ~ ' + m)
    return not hard


def build(key, spec):
    errors = []
    head, body = B.read('src/head.html'), B.read('src/body.html')
    body = _apply(body, spec['body_pairs'], 'body', errors, spec.get('known_stale', ()))
    head = re.sub(r'<title>[^<]*</title>', '<title>%s</title>' % spec['title'], head, 1)
    css = _hide_css(spec['hide_tabs'])
    if css:
        head = head.replace('</style>', css + '</style>', 1)
    data_path = B.R + spec['data_module']
    if not os.path.exists(data_path):
        raise SystemExit('BUILD STOPPED — data module missing: %s\n'
                         'Rebuild it locally first; the data tree is never committed '
                         '(data/README.md).' % data_path)
    app = _apply(B.app_source(spec['self_id']), spec['app_pairs'], 'app', errors,
                 spec.get('known_stale', ()))
    hard = [m for k, m in errors if k == 'error']
    if hard:
        raise SystemExit('BUILD STOPPED — stale regionalization pairs:\n  '
                         + '\n  '.join(hard))
    data = B.read(spec['data_module'])
    extra = [B.read(m) for m in spec['extra_modules']]
    open(B.R + spec['output'], 'w').write(B.assemble(head, body, data, app, extra))
    if spec.get('standalone'):
        open(B.R + spec['output'].replace('.html', '-standalone.html'), 'w').write(
            B.standalone(head, body, data, app, extra))
    B.report(spec['output'])


def main():
    args = [a for a in sys.argv[1:]]
    if not args or args == ['--list']:
        print('specs: ' + ', '.join(sorted(SPECS)))
        print(__doc__.strip().splitlines()[0])
        return
    dry = '--dry-run' in args
    keys = [a for a in args if not a.startswith('--')]
    if not keys:
        raise SystemExit('name a spec: ' + ', '.join(sorted(SPECS)))
    ok = True
    for key in keys:
        if key not in SPECS:
            raise SystemExit('unknown spec %r — have: %s' % (key, ', '.join(sorted(SPECS))))
        if dry:
            ok = check(key, SPECS[key]) and ok
        else:
            build(key, SPECS[key])
    if dry and not ok:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
