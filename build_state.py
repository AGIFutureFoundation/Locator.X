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

The existing hand builders remain the canonical builders until a fleet sweep
verifies this builder's output at parity — every shipped edition now has a spec
below, transcribed pair-for-pair from its builder for exactly that comparison
(2026-09-10; tests/run.py holds the two in lockstep by AST comparison). Do not
delete the originals on the strength of a dry run.

Usage:
    python3 build_state.py --list
    python3 build_state.py --dry-run nola
    python3 build_state.py --dry-run --all   # every filled spec; templates skipped, named
    python3 build_state.py nola          # full build; needs data + node_modules
    python3 build_state.py --all         # build the whole fleet (data machine)
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
# ---------------------------------------------------------------------------
# Views that ship in every edition and are reachable in none.
#
# Each shipped spec lists the tabs it hides. Nothing prevented a view from being
# hidden by ALL of them, and one was: the house-hack finder is inlined into all
# eleven editions (10,424 bytes of source, 8,488 minified, inside the packed
# payload) and cannot be opened in any of them. Every spec author made a local
# decision; the emergent result — surface that ships and cannot be reached — was
# nobody's decision and was invisible.
#
# It is now a declaration rather than an accident. tests/run.py fails BOTH ways:
# a view hidden everywhere that is not declared here, and a view declared here
# that some edition has started showing again. The second half matters as much
# as the first, or this table quietly rots into a lie.
#
# Declaring one is not endorsing it. These are open questions for the platform
# owner: drop the module from MODULES, or give some edition a reason to show it.
# Empty, and the check above is what keeps it honest either way. The one entry
# this table ever held - the house-hack finder - is resolved rather than removed:
# it was hidden everywhere because it required a flag only the Bay data builder
# set, so in every other edition it computed over nothing. Candidacy now comes
# from the record's own unit count (src/hacks.js), every edition carries 2-4 unit
# stock, and the tab is shown.
UNREACHABLE_VIEWS = {}


SPECS = {
    'nola': dict(
        output='atlas_nola.html',
        title='Locator X New Orleans Atlas',
        self_id='atlasnola',
        data_module='data_atlas_nola.js',
        extra_modules=['sig2_nola.js'],
        hide_tabs=['guide'],
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
            ('const EDITION_STATE = null;',
             "const EDITION_STATE = 'Louisiana';"),
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
        hide_tabs=[],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area',
             'Locator X dashboard · Bay Area — full-market atlas'),
            ('Every one of the 128,319 sites', 'Every one of the 161,000 records'),
        ],
        app_pairs=[
            ('128,319 real sites from county records', '161,000 records across four counties'),
            ('extruding 128,319 sites', 'extruding 161,000 records'),
            ('const EDITION_STATE = null;',
             "const EDITION_STATE = 'California';"),
        ],
        known_stale=[],
        standalone=True,
    ),
    # ---- the rest of the fleet, transcribed 2026-09-10 ---------------------
    # One spec per remaining hand builder, pair-for-pair and in the builder's
    # own execution order (order matters: _apply mutates as it goes, which is
    # how the shadowed-eyebrow bug fixed the same day was even possible).
    # tests/run.py holds builder and spec in lockstep by comparing this
    # registry against the AST-extracted pairs of each hand builder.
    'below': dict(
        output='below100.html',
        title='Locator X Below Market',
        self_id='below',
        data_module='data_below.js',
        extra_modules=['sig2_bay.js'],
        hide_tabs=[],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area',
             'Locator X dashboard · Bay Area — Below Market 100k'),
            ('Every one of the 128,319 sites', 'Every one of the 100,000 below-market records'),
        ],
        app_pairs=[
            ('128,319 real sites from county records',
             '100,000 below-market records — condos, townhouses, multi-residence and upgrade candidates'),
            ('extruding 128,319 sites', 'extruding 100,000 below-market records'),
            ('const EDITION_STATE = null;',
             "const EDITION_STATE = 'California';"),
        ],
        standalone=True,
    ),
    'income': dict(
        output='income50.html',
        title='Locator X Income Fifty',
        self_id='income',
        data_module='data_income.js',
        extra_modules=['sig2_bay.js'],
        hide_tabs=[],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area',
             'Locator X dashboard · Bay Area — Income Fifty (income-property classes)'),
            ('Every one of the 128,319 sites', 'Every one of the 50,000 income-class records'),
        ],
        app_pairs=[
            ('128,319 real sites from county records',
             '50,000 income-property records — multifamily, apartments, hotels, commercial'),
            ('extruding 128,319 sites', 'extruding 50,000 income-class records'),
            ('const EDITION_STATE = null;',
             "const EDITION_STATE = 'California';"),
        ],
        standalone=True,
    ),
    'launi': dict(
        output='launi.html',
        title='Locator X Baton Rouge',
        self_id='launi',
        data_module='data_launi.js',
        extra_modules=['sig2_launi.js'],
        hide_tabs=['guide'],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area',
             'Locator X dashboard · Baton Rouge &amp; Louisiana university cities'),
            ('Every one of the 128,319 sites', 'Every one of the 90,000 parcels'),
            ('Which of these properties would pay you?',
             'Student housing, rentals and land around Louisiana’s biggest campuses'),
            ('A walkable Bay Area, built from the catalog',
             'A walkable Baton Rouge, built from the catalog'),
        ],
        app_pairs=[
            ('128,319 real sites from county records',
             '120,000 parcels from the East Baton Rouge Parish roll'),
            ('extruding 128,319 sites', 'extruding 120,000 parcels'),
            ('const EDITION_STATE = null;',
             "const EDITION_STATE = 'Louisiana';"),
        ],
        standalone=True,
    ),
    'match': dict(
        output='match50.html',
        title='Locator X Match Fifty',
        self_id='match',
        data_module='data_match.js',
        extra_modules=['sig2_bay.js'],
        hide_tabs=[],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area',
             'Locator X dashboard · Bay Area — Match Fifty (high-match band)'),
            ('Every one of the 128,319 sites', 'Every one of the 50,000 match-band records'),
        ],
        app_pairs=[
            ('128,319 real sites from county records',
             '50,000 recent-basis records in the 85–90% match band'),
            ('extruding 128,319 sites', 'extruding 50,000 match-band records'),
            ('const EDITION_STATE = null;',
             "const EDITION_STATE = 'California';"),
        ],
        standalone=True,
    ),
    # build_nola.py — the original New Orleans edition (Orleans Parish only);
    # distinct from 'nola' above, which is the two-parish atlas. It opens on
    # the Map view, not Home: the campus pins and highlighted candidate deals
    # (src/campus.js) are the point of this edition, and they live on the map.
    'nola-classic': dict(
        output='nola.html',
        title='Locator X New Orleans',
        self_id='nola',
        data_module='data_nola.js',
        extra_modules=['sig2_nola.js'],
        hide_tabs=['guide'],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area', 'Locator X dashboard · New Orleans'),
            ('Every one of the 128,319 sites', 'Every one of the 90,000 parcels'),
            ('Basemap: Natural Earth · US Census TIGER · Zillow neighborhood boundaries '
             '· Market data © Zillow Research · Records: SF Assessor, Alameda County Assessor',
             'Basemap: Natural Earth · US Census TIGER · Zillow neighborhood boundaries '
             '· Market data © Zillow Research · Records: City of New Orleans parcel + '
             'building-footprint GIS (data.nola.gov)'),
            ('<button data-gsel="start" aria-selected="true">Start</button>',
             '<button data-gsel="start">Start</button>'),
            ('<button data-gsel="find">Find</button>',
             '<button data-gsel="find" aria-selected="true">Find</button>'),
            ('<button role="tab" data-view="home" data-group="start" aria-selected="true">Home</button>',
             '<button role="tab" data-view="home" data-group="start">Home</button>'),
            ('<button role="tab" data-view="mapview" data-group="find">Map</button>',
             '<button role="tab" data-view="mapview" data-group="find" aria-selected="true">Map</button>'),
            ('<section id="mapview" class="view">',
             '<section id="mapview" class="view active">'),
            ('<section id="home" class="view active"><div class="page"><div class="inner wide">',
             '<section id="home" class="view"><div class="page"><div class="inner wide">'),
        ],
        app_pairs=[
            ('128,319 real sites from county records',
             '90,000 real parcels from Orleans Parish records'),
            ('extruding 128,319 sites', 'extruding 90,000 parcels'),
            ('const EDITION_STATE = null;',
             "const EDITION_STATE = 'Louisiana';"),
        ],
        standalone=True,
    ),
    'sheltercove': dict(
        output='sheltercove.html',
        title='Locator X Shelter Cove',
        self_id='sc',
        data_module='data_sc.js',
        extra_modules=['sig2_bay.js'],
        hide_tabs=['guide'],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area', 'Locator X dashboard · Shelter Cove'),
            ('Every one of the 128,319 sites', 'Every one of the 4,284 parcels'),
        ],
        app_pairs=[
            ('128,319 real sites from county records',
             '4,284 real parcels from Humboldt County records'),
            ('extruding 128,319 sites', 'extruding 4,284 parcels'),
            ('const EDITION_STATE = null;',
             "const EDITION_STATE = 'California';"),
        ],
        standalone=True,
    ),
    'uscorridor': dict(
        output='uscorridor.html',
        title='Locator X US Corridors',
        self_id='corr',
        data_module='data_uscorridor.js',
        extra_modules=['sig2_uscorridor.js'],
        hide_tabs=['guide'],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area', 'Locator X dashboard · US growth corridors'),
            ('Every one of the 128,319 sites', 'Every one of the 90,000 parcels'),
            ('Which of these properties would pay you?',
             'Multifamily, lodging and commercial where the capital is landing'),
            ('A walkable Bay Area, built from the catalog',
             'Five corridors, built from five county assessors'),
        ],
        app_pairs=[
            ('128,319 real sites from county records',
             '84,116 parcels from five county assessors'),
            ('extruding 128,319 sites', 'extruding 84,116 parcels'),
        ],
        standalone=True,
    ),
    'usnew5': dict(
        output='usnew5.html',
        title='Locator X New Corridors',
        self_id='new5',
        data_module='data_usnew5.js',
        extra_modules=['sig2_uscorridor.js'],
        hide_tabs=['guide'],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area', 'Locator X dashboard · US growth corridors'),
            ('Every one of the 128,319 sites', 'Every one of the 90,000 parcels'),
            ('Which of these properties would pay you?',
             'Multifamily, lodging and commercial where the capital is landing'),
            ('A walkable Bay Area, built from the catalog',
             'Five corridors, built from five county assessors'),
        ],
        app_pairs=[
            ('128,319 real sites from county records',
             '84,116 parcels from five county assessors'),
            ('extruding 128,319 sites', 'extruding 84,116 parcels'),
        ],
        standalone=True,
    ),
    'uswide': dict(
        output='uswide.html',
        title='Locator X Conversion Stock',
        self_id='wide',
        data_module='data_uswide.js',
        extra_modules=['sig2_uscorridor.js'],
        hide_tabs=['guide'],
        body_pairs=[
            ('Locator X dashboard · SF Bay Area', 'Locator X dashboard · US growth corridors'),
            ('Every one of the 128,319 sites', 'Every one of the 90,000 parcels'),
            ('Which of these properties would pay you?',
             'Multifamily, lodging and commercial where the capital is landing'),
            ('A walkable Bay Area, built from the catalog',
             'Five corridors, built from five county assessors'),
        ],
        app_pairs=[
            ('128,319 real sites from county records',
             '84,116 parcels from five county assessors'),
            ('extruding 128,319 sites', 'extruding 84,116 parcels'),
        ],
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
    # Wave two (Foundation-directed, docs/states/coverage/nebraska.md). Both
    # refuse to build until the desktop pull session delivers real data —
    # pull queue #1 (Douglas groupBy) and #4 (Lancaster groupBy) — and the
    # REQUIRED fields are filled from what the pull actually returned.
    'omaha-template': dict(
        output='atlas_omaha.html',
        title='REQUIRED: edition title',
        self_id='REQUIRED',
        data_module='REQUIRED: data_atlas_omaha.js — Douglas County groupBy through '
                    'the crosswalk gate and class_screen (pull queue #1)',
        extra_modules=[],
        # Nebraska is a disclosure state (documentary stamp; recorded
        # consideration exists — coverage row, 2026-09-04): the comps desk
        # stays once the deed pull backs it. Until then hiding it here would
        # assert a pull that has not happened, so the decision is deferred to
        # whoever fills this spec from the measured result.
        hide_tabs=[],
        body_pairs=[],  # REQUIRED: regionalize the shell prose, pair by pair
        app_pairs=[],
        standalone=True,
    ),
    'lincoln-template': dict(
        output='launi_lincoln.html',
        title='REQUIRED: edition title',
        self_id='REQUIRED',
        data_module='REQUIRED: data_launi_lincoln.js — Lancaster County groupBy plus '
                    'the UNL campus ring (pull queue #4; the launi method\'s second market)',
        extra_modules=[],
        hide_tabs=[],
        body_pairs=[],  # REQUIRED: campus-ring prose is Louisiana's today — re-pair it
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
    missing_extra = [m for m in spec['extra_modules'] if not os.path.exists(B.R + m)]
    print('spec %r:' % key)
    print('  output        %s (+ standalone)' % spec['output'] if spec.get('standalone')
          else '  output        %s' % spec['output'])
    print('  data module   %s — %s' % (spec['data_module'],
          'present' if data_ok else 'ABSENT (build will refuse; see data/README.md)'))
    print('  modules       %d in registry, %d extra%s' % (len(B.MODULES), len(spec['extra_modules']),
          '' if not missing_extra else ' — ABSENT: %s (generated locally, e.g. build_sig2.py; build will refuse)'
          % ', '.join(missing_extra)))
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
    for m in spec['extra_modules']:
        if not os.path.exists(B.R + m):
            raise SystemExit('BUILD STOPPED — extra module missing: %s\n'
                             'It is generated locally (e.g. build_sig2.py) and never '
                             'committed; rebuild it first.' % (B.R + m))
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
    if '--all' in args:
        # every spec whose fields are filled; templates are skipped BY NAME so
        # the skip is visible, never silent — a template is a refusal, not a no-op
        filled = [k for k in sorted(SPECS)
                  if not any('REQUIRED' in str(SPECS[k].get(f, 'REQUIRED'))
                             for f in ('output', 'title', 'self_id', 'data_module'))]
        skipped = [k for k in sorted(SPECS) if k not in filled]
        if skipped:
            print('--all: skipping %d unfilled template(s): %s'
                  % (len(skipped), ', '.join(skipped)))
        keys = filled + [k for k in keys if k not in filled]
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
