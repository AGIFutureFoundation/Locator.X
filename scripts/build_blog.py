"""build_blog — the Locator.X articles, rendered from content/blog/*.md.

Run by deploy-pages. Each article is markdown with a small frontmatter block;
this renders it to a self-contained page in the house style, generates an index,
and draws any chart the article asks for FROM THE COMMITTED MEASURED DATA rather
than from numbers typed into the prose.

That last part is the whole design. An article that quotes a figure in a
sentence and draws a different one in its chart is the ordinary failure of
marketing writing, and it is unrecoverable here because the numbers are the
product. So a chart is requested by name - {{chart:belts-yield}} - and the
series behind it is read from market/*.json at build time. If the data moves,
the chart moves with it, and the gate below fails any article whose stated
figures no longer match the file they came from.

Usage: python3 scripts/build_blog.py <site_dir>
       python3 scripts/build_blog.py --check      verify figures against data
"""
import collections
import html
import json
import os
import re
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'content', 'blog')


def esc(s):
    return html.escape(str(s), quote=True)


def load(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return json.load(f)


# --------------------------------------------------------------------------
# The figures an article is allowed to state, each resolved from committed data.
# An article writes {{fig:name}} and gets the number; nothing is typed twice.
# --------------------------------------------------------------------------
def _cov():
    """The coverage gate rows, read by the roll-up's own parser.

    An article that talks about coverage must not type the counts: they change
    every time a state file gains a row. This imports the same reader
    scripts/coverage_rollup.py uses to generate docs/states/coverage/ROLLUP.md,
    so the article, the roll-up and the state files cannot disagree."""
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        '_cov', os.path.join(HERE, 'coverage_rollup.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod, mod.read_rows()


def _curriculum():
    """The curriculum module, loaded from source.

    An article about the Academy must not state its own count of courses: the
    curriculum is the source of truth and gen_courses.py already derives
    everything else from it. Same rule as the coverage roll-up above.
    """
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        '_cur', os.path.join(ROOT, 'curriculum', 'curriculum.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _la_frictions():
    """The ranked frictions in docs/LOUISIANA_DEVELOPMENT_FRICTION.md, counted
    from the document's own numbered headings rather than typed."""
    path = os.path.join(ROOT, 'docs', 'LOUISIANA_DEVELOPMENT_FRICTION.md')
    with open(path, encoding='utf-8') as f:
        return len(re.findall(r'(?m)^## \d+\. ', f.read()))


def figures():
    S = load('market/edition_scale.json')
    B = load('market/belts.json')
    C = load('market/corridors.json')
    E = load('market/editions.json')
    X = load('crosswalk/usecodes.json')
    K = load('content/closing_packet.json')
    by = {e['key']: e for e in S['editions']}
    lodging = sum(e['lodging']['total'] for e in S['editions'])
    measured = [e for e in E['editions'] if 'records_measured' in e]
    lodge_juris = [j for j in X['jurisdictions']
                   if any(c.get('class') == 'lodging' for c in j['codes'])]
    f = S['findings']
    covmod, cov = _cov()
    ncov = lambda term: str(sum(1 for r in cov if r['status'] == term))
    gcount = collections.Counter()
    for r in cov:
        for letter in covmod.gate_letters(r['gate']):
            gcount[letter] += 1
    gname = dict(covmod.GATES)
    granked = gcount.most_common()
    corr_jobs = sum(m.get('jobs') or 0 for m in C['metros'])
    corr_cap = sum(m.get('capital') or 0 for m in C['metros'])
    corr_parcel = [m for m in C['metros'] if (m.get('parcel') or {}).get('available')]
    corr_recs = sum(m.get('records') or 0 for m in C['metros'])
    uc = by['uscorridor']
    xcodes = [c for j in X['jurisdictions'] for c in j['codes']]
    cur = _curriculum()
    projects = [p for m in C['metros'] for p in (m.get('projects') or [])]
    return {
        'bytes_per_record': '%.0f' % f['bytes_per_record'],
        'heap_kb_per_record': '%.0f' % f['heap_kb_per_record'],
        'corridor_heap_gb': '%.2f' % (by['uscorridor']['heap_mb'] / 1024),
        'corridor_records': '{:,}'.format(by['uscorridor']['records']),
        'corridor_bytes_mb': '%.0f' % (by['uscorridor']['bytes'] / 1048576),
        'bay_records': '{:,}'.format(by['bay']['records']),
        'bay_heap_mb': '%.0f' % by['bay']['heap_mb'],
        'nola_records': '{:,}'.format(by['nola']['records']),
        'nola_atlas_records': '{:,}'.format(by['nola-classic']['records']),
        'la_records': '{:,}'.format(by['nola']['records'] + by['nola-classic']['records']),
        'heap_per_50k': '%d' % f['per_50k']['added_heap_mb'],
        'mb_per_50k': '%.2f' % f['per_50k']['added_bytes_mb'],
        'lodging_total': '{:,}'.format(lodging),
        'lodging_corridor': '{:,}'.format(by['uscorridor']['lodging']['total']),
        'lodging_bay': '{:,}'.format(by['bay']['lodging']['total']),
        'lodging_nola': '{:,}'.format(by['nola']['lodging']['total']),
        'belts_ranked': '{:,}'.format(B['coverage']['ranked']),
        'belts_candidates': '{:,}'.format(B['coverage']['zips_with_both']),
        'belts_states': str(len(B['coverage']['states_covered'])),
        'belts_absent': str(len(B['coverage']['states_absent'])),
        'belts_metros': str(B['coverage']['metros']),
        'corridor_areas': str(len(C['metros'])),
        'corridor_dropped': str(len(C.get('dropped', []))),
        'corridor_caveats': str(len(C.get('caveats', []))),
        'editions_measured': str(len(measured)),
        'crosswalk_juris': str(len(X['jurisdictions'])),
        'crosswalk_codes': str(sum(len(j['codes']) for j in X['jurisdictions'])),
        'lodging_juris': str(len(lodge_juris)),
        'holdout_months': str(B['method']['holdout_months']),
        'belts_min_points': str(B['method']['min_points']),
        # --- the belts method, stated in the article exactly as the file has it
        'belts_metro_cap': str(B['method']['metro_cap']),
        'belts_counties': str(B['coverage']['counties']),
        'belts_skipped_thin': '{:,}'.format(B['coverage']['skipped']['thin series']),
        'belts_top2_share': '%d%%' % round(B['coverage']['concentration_top2_metros'] * 100),
        # --- the scale measurements
        'scale_editions': str(len(S['editions'])),
        'scale_measured_on': S['measured_on'],
        'total_records': '{:,}'.format(sum(e['records'] for e in S['editions'])),
        'corridor_heap_mb': '{:,.0f}'.format(uc['heap_mb']),
        'corridor_load_s': '%.1f' % (uc['load_ms'] / 1000.0),
        'corridor_scan_ms': '%.0f' % uc['scan_ms'],
        'corridor_sort_ms': '%.0f' % uc['sort_ms'],
        'heap_vs_wire': '%.0f' % (f['heap_kb_per_record'] * 1024 / f['bytes_per_record']),
        'nola_load_s': '%.1f' % (by['nola']['load_ms'] / 1000.0),
        'atlas_load_s': '%.1f' % (by['nola-classic']['load_ms'] / 1000.0),
        # --- the corridor file
        'corridor_jobs': '{:,}'.format(corr_jobs),
        'corridor_capital_b': '%.0f' % (corr_cap / 1e9),
        'corridor_parcel_confirmed': str(len(corr_parcel)),
        'corridor_metro_records': '{:,}'.format(corr_recs),
        'corridor_dropped_parcel': str(sum(1 for d in C.get('dropped', []) if d.get('parcel'))),
        # --- the coverage gate rows, from the state files themselves
        'gate_rows': str(len(cov)),
        'gate_files': str(len(set(r['file'] for r in cov))),
        'gate_juris': str(len(set(r['jurisdiction'] for r in cov))),
        'gate_shipped': ncov('shipped'),
        'gate_pulled': ncov('pulled'),
        'gate_named': ncov('named'),
        'gate_blocked': ncov('blocked'),
        'gate_norecord': ncov('no public record'),
        'gate_deepest': gname[granked[0][0]].lower(),
        'gate_deepest_rows': str(granked[0][1]),
        'gate_thinnest': gname[granked[-1][0]].lower(),
        'gate_thinnest_rows': str(granked[-1][1]),
        # --- the use-code crosswalk
        'crosswalk_classes': str(len(X['classes'])),
        'crosswalk_verified': str(sum(1 for c in xcodes if c.get('verified'))),
        'crosswalk_unverified': str(sum(1 for c in xcodes if not c.get('verified'))),
        'crosswalk_measured': '{:,}'.format(
            sum(c.get('measured_count') or 0 for c in xcodes)),
        'crosswalk_caveats': str(sum(len(j.get('caveats') or [])
                                     for j in X['jurisdictions'])),
        'crosswalk_value_fields': str(sum(1 for j in X['jurisdictions']
                                          if j.get('value_field'))),
        # --- the closing-file packet (content/closing_packet.json)
        'packet_clauses': str(len(K['clauses'])),
        'packet_documents': str(len(K['documents'])),
        'packet_contingencies': str(len(K['contingencies'])),
        'packet_state_sensitive': str(sum(1 for c in K['clauses']
                                          if c.get('state_sensitive'))),
        'packet_questions': str(sum(1 for c in K['clauses'] if c.get('ask_counsel'))),
        'packet_docs_document': str(sum(1 for d in K['documents']
                                        if d.get('kind') == 'document')),
        'packet_docs_record': str(sum(1 for d in K['documents']
                                      if d.get('kind') == 'public record')),
        'packet_reviewed': K['reviewed'],
        # --- the Academy, from curriculum/curriculum.py itself
        'course_items': str(len(cur.C)),
        'course_courses': str(sum(1 for c in cur.C if c[2] == 'course')),
        'course_guides': str(sum(1 for c in cur.C if c[2] == 'guide')),
        'course_pillars': str(len(cur.PILLARS)),
        'course_levels': str(len(cur.LEVELS)),
        'course_doctrine': str(len(cur.DOCTRINE)),
        'course_live': str(sum(1 for c in cur.C if cur.status_of(c[0]) == 'live')),
        'course_pathways': str(len(cur.PATHWAYS)),
        'course_with_prereq': str(sum(1 for c in cur.C if c[7])),
        'course_frameworks': str(len(cur.FRAMEWORKS)),
        # --- the corridor file, a little deeper
        'corridor_live': str(sum(1 for m in C['metros'] if m.get('kind') == 'live')),
        'corridor_projects': str(len(projects)),
        'corridor_projects_nojobs': str(sum(1 for p in projects if p.get('jobs') is None)),
        'corridor_permits_total': '{:,}'.format(
            sum(m.get('permits') or 0 for m in C['metros'])),
        'corridor_as_of': C['as_of'],
        'corridor_no_permits': str(sum(1 for m in C['metros'] if not m.get('permits'))),
        'corridor_jobs_null': str(sum(1 for m in C['metros'] if m.get('jobs') is None)),
        'corridor_studied': str(sum(1 for m in C['metros'] if m.get('kind') != 'live')),
        # --- the Louisiana friction page
        'la_frictions': str(_la_frictions()),
    }


# --------------------------------------------------------------------------
# Charts. Every series comes from a committed data file; none is drawn by hand.
# --------------------------------------------------------------------------
def _bars(rows, unit='', width=680, rowh=28, color='var(--field)'):
    """rows: [(label, value, note)] — a horizontal bar chart, tallest first."""
    if not rows:
        return '<p class="note">No data for this chart.</p>'
    top = max(r[1] for r in rows) or 1
    H = len(rows) * rowh + 18
    lab = 190
    out = ['<svg viewBox="0 0 %d %d" role="img" class="bchart">' % (width, H)]
    for i, (label, v, note) in enumerate(rows):
        y = 9 + i * rowh
        w = (width - lab - 96) * (v / top)
        out.append('<text x="%d" y="%d" text-anchor="end" class="bl">%s</text>'
                   % (lab - 8, y + 14, esc(label)))
        out.append('<rect x="%d" y="%d" width="%.1f" height="%d" rx="4" fill="%s"/>'
                   % (lab, y + 3, max(w, 1.5), rowh - 12, color))
        out.append('<text x="%.1f" y="%d" class="bv">%s%s</text>'
                   % (lab + max(w, 1.5) + 7, y + 14, esc(note or '{:,}'.format(int(v))), unit))
    out.append('</svg>')
    return ''.join(out)


def chart(name):
    if name == 'scale-heap':
        S = load('market/edition_scale.json')
        rows = [(e['key'], e['heap_mb'], '%.0f MB heap · %s records'
                 % (e['heap_mb'], '{:,}'.format(e['records'])))
                for e in sorted(S['editions'], key=lambda x: -x['heap_mb'])]
        return _bars(rows, color='var(--flag)')
    if name == 'scale-bytes':
        S = load('market/edition_scale.json')
        rows = [(e['key'], e['bytes'] / 1048576, '%.1f MB page · %s records'
                 % (e['bytes'] / 1048576, '{:,}'.format(e['records'])))
                for e in sorted(S['editions'], key=lambda x: -x['bytes'])]
        return _bars(rows, color='var(--bay)')
    if name == 'lodging-by-edition':
        S = load('market/edition_scale.json')
        rows = [(e['key'], e['lodging']['total'], None)
                for e in sorted(S['editions'], key=lambda x: -x['lodging']['total'])]
        return _bars(rows)
    if name == 'lodging-places':
        S = load('market/edition_scale.json')
        seen, rows = set(), []
        for e in S['editions']:
            for city, n in e['lodging']['cities']:
                if city.lower() in seen:
                    continue
                seen.add(city.lower()); rows.append((city, n, None))
        rows.sort(key=lambda r: -r[1])
        return _bars(rows[:10])
    if name == 'belts-states':
        B = load('market/belts.json')
        cnt = {}
        for r in B['top100']:
            cnt[r['state']] = cnt.get(r['state'], 0) + 1
        rows = sorted(((k, v, None) for k, v in cnt.items()), key=lambda r: -r[1])
        return _bars(rows, color='var(--accent)')
    if name == 'belts-weights':
        B = load('market/belts.json')
        w = B['method']['weights']
        names = {'yield': 'Gross yield — what it pays now',
                 'r12': 'Rent growth, 12 months', 'drift': 'Drift — rent minus value growth',
                 'stable': 'Volatility of the value series', 'model': 'Holdout error'}
        rows = [(names[k], abs(v) * 100, '%+d%%' % round(v * 100)) for k, v in w.items()]
        rows.sort(key=lambda r: -r[1])
        return _bars(rows, color='var(--field)')
    if name == 'jobs-per-permit':
        C = load('market/corridors.json')
        rows = []
        for m in C['metros']:
            if m.get('jobs') and m.get('permits'):
                rows.append((m['metro'].split(',')[0], m['jobs'] / m['permits'],
                             '%.1f jobs / unit permitted' % (m['jobs'] / m['permits'])))
        rows.sort(key=lambda r: -r[1])
        return _bars(rows[:12], color='var(--bay)')
    if name == 'crosswalk-classes':
        X = load('crosswalk/usecodes.json')
        cnt = {}
        for j in X['jurisdictions']:
            for c in j['codes']:
                cnt[c['class']] = cnt.get(c['class'], 0) + 1
        rows = sorted(((k.replace('_', ' '), v, None) for k, v in cnt.items()),
                      key=lambda r: -r[1])
        return _bars(rows, color='var(--field)')
    raise SystemExit('build_blog: unknown chart "%s"' % name)


CHARTS = ['scale-heap', 'scale-bytes', 'lodging-by-edition', 'lodging-places',
          'belts-states', 'belts-weights', 'jobs-per-permit', 'crosswalk-classes']


# --------------------------------------------------------------------------
# A deliberately small markdown subset — enough for an article, no dependency.
# --------------------------------------------------------------------------
def md_inline(t):
    t = esc(t)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\w)\*([^*]+)\*(?!\w)', r'<i>\1</i>', t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    return t


def md(body, figs):
    body = re.sub(r'\{\{fig:([a-z0-9_]+)\}\}',
                  lambda m: figs.get(m.group(1)) or _missing(m.group(1)), body)
    out, lines, i = [], body.split('\n'), 0
    while i < len(lines):
        ln = lines[i]
        m = re.match(r'\{\{chart:([a-z0-9-]+)\}\}\s*$', ln.strip())
        if m:
            out.append('<figure class="ch">' + chart(m.group(1)) + '</figure>'); i += 1; continue
        if ln.startswith('## '):
            out.append('<h2>' + md_inline(ln[3:]) + '</h2>'); i += 1; continue
        if ln.startswith('### '):
            out.append('<h3>' + md_inline(ln[4:]) + '</h3>'); i += 1; continue
        if ln.startswith('> '):
            block = []
            while i < len(lines) and lines[i].startswith('> '):
                block.append(lines[i][2:]); i += 1
            out.append('<blockquote>' + md_inline(' '.join(block)) + '</blockquote>'); continue
        if ln.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                rows.append(lines[i]); i += 1
            cells = [[c.strip() for c in r.strip().strip('|').split('|')] for r in rows]
            cells = [c for c in cells if not all(set(x) <= set('-: ') for x in c)]
            head = cells[0]
            out.append('<div class="scroll"><table><thead><tr>'
                       + ''.join('<th>' + md_inline(c) + '</th>' for c in head)
                       + '</tr></thead><tbody>'
                       + ''.join('<tr>' + ''.join('<td>' + md_inline(c) + '</td>' for c in r)
                                 + '</tr>' for r in cells[1:])
                       + '</tbody></table></div>')
            continue
        if re.match(r'^[-*] ', ln):
            items = []
            while i < len(lines) and re.match(r'^[-*] ', lines[i]):
                items.append(lines[i][2:]); i += 1
            out.append('<ul>' + ''.join('<li>' + md_inline(x) + '</li>' for x in items) + '</ul>')
            continue
        if re.match(r'^\d+\. ', ln):
            items = []
            while i < len(lines) and re.match(r'^\d+\. ', lines[i]):
                items.append(re.sub(r'^\d+\. ', '', lines[i])); i += 1
            out.append('<ol>' + ''.join('<li>' + md_inline(x) + '</li>' for x in items) + '</ol>')
            continue
        if not ln.strip():
            i += 1; continue
        para = []
        while i < len(lines) and lines[i].strip() and not re.match(
                r'^(#{2,3} |> |[-*] |\d+\. |\||\{\{chart:)', lines[i]):
            para.append(lines[i]); i += 1
        out.append('<p>' + md_inline(' '.join(para)) + '</p>')
    return '\n'.join(out)


def _missing(name):
    raise SystemExit('build_blog: article asks for unknown figure "%s" — add it to '
                     'figures() so it resolves from committed data, never inline' % name)


def parse(path):
    raw = open(path, encoding='utf-8').read()
    if not raw.startswith('---\n'):
        raise SystemExit('build_blog: %s has no frontmatter' % os.path.basename(path))
    _, fm, body = raw.split('---\n', 2)
    meta = {}
    for line in fm.strip().split('\n'):
        k, _, v = line.partition(':')
        meta[k.strip()] = v.strip()
    for need in ('title', 'slug', 'date', 'summary', 'topic'):
        if not meta.get(need):
            raise SystemExit('build_blog: %s is missing frontmatter "%s"'
                             % (os.path.basename(path), need))
    return meta, body


STYLE = (
    ':root{--paper:#F2EFE9;--card:#FBF9F5;--ink:#17140F;--ink-2:#4A443A;--ink-3:#7C7264;'
    '--rule:#D5CDBE;--field:#2C6B4E;--flag:#B9531F;--bay:#3E6291;--accent:#B9531F;'
    '--shadow:0 1px 2px rgba(23,20,15,.05),0 10px 26px -16px rgba(23,20,15,.22)}'
    '@media (prefers-color-scheme:dark){:root{--paper:#14120E;--card:#1D1A15;--ink:#F1ECE1;'
    '--ink-2:#BDB4A4;--ink-3:#8A8073;--rule:#332E26;--field:#5FA483;--flag:#E0742F;'
    '--bay:#7CA2D4;--accent:#E0742F;'
    '--shadow:0 1px 2px rgba(0,0,0,.4),0 10px 26px -16px rgba(0,0,0,.6)}}'
    '*{box-sizing:border-box}'
    'body{margin:0;background:var(--paper);color:var(--ink);'
    'font:17px/1.72 "IBM Plex Sans",system-ui,sans-serif;padding:0 16px}'
    '.wrap{max-width:720px;margin:0 auto;padding-block:44px 80px}'
    '.wide{max-width:980px}'
    'h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(30px,5.4vw,45px);'
    'line-height:1.12;margin:0 0 14px;letter-spacing:-.015em;text-wrap:balance}'
    'h2{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(22px,3vw,29px);'
    'margin:44px 0 12px;letter-spacing:-.01em;text-wrap:balance}'
    'h3{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:20px;margin:30px 0 8px}'
    '.kicker{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.14em;'
    'text-transform:uppercase;color:var(--field);margin:0 0 14px}'
    '.sub{color:var(--ink-2);font-size:19px;line-height:1.6;margin:0 0 10px;text-wrap:pretty}'
    '.byline{font-size:13.5px;color:var(--ink-3);margin:0 0 30px;'
    'padding-bottom:22px;border-bottom:1px solid var(--rule)}'
    'p{margin:0 0 20px;text-wrap:pretty}'
    'a{color:var(--field)}'
    'blockquote{margin:26px 0;padding:2px 0 2px 20px;border-left:3px solid var(--field);'
    'font-size:18px;color:var(--ink-2);font-style:italic}'
    'code{font-family:"IBM Plex Mono",monospace;font-size:.88em;background:var(--card);'
    'border:1px solid var(--rule);border-radius:5px;padding:1px 5px}'
    'ul,ol{margin:0 0 20px;padding-left:24px}li{margin:0 0 9px}'
    '.ch{margin:30px 0;padding:18px 16px 12px;background:var(--card);border:1px solid var(--rule);'
    'border-radius:12px;box-shadow:var(--shadow);overflow-x:auto}'
    '.bchart{width:100%;height:auto;min-width:520px;display:block}'
    '.bl{font:500 12.5px "IBM Plex Sans",system-ui,sans-serif;fill:var(--ink-2)}'
    '.bv{font:500 12px "IBM Plex Mono",monospace;fill:var(--ink-3)}'
    '.scroll{overflow-x:auto;border:1px solid var(--rule);border-radius:10px;'
    'background:var(--card);margin:0 0 24px;box-shadow:var(--shadow)}'
    'table{width:100%;border-collapse:collapse;font-size:14.5px;min-width:520px}'
    'th{text-align:left;padding:10px 12px;border-bottom:1px solid var(--rule);'
    'font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.12em;'
    'text-transform:uppercase;color:var(--ink-3);font-weight:500}'
    'td{padding:9px 12px;border-bottom:1px solid var(--rule);vertical-align:top}'
    'tr:last-child td{border-bottom:0}'
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:26px}'
    'a.card{display:block;background:var(--card);border:1px solid var(--rule);border-radius:12px;'
    'padding:20px;text-decoration:none;color:inherit;box-shadow:var(--shadow)}'
    'a.card h2{font-size:20px;margin:0 0 8px}'
    'a.card p{margin:0;color:var(--ink-2);font-size:14.5px;line-height:1.6}'
    'a.card .tag{font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--ink-3);'
    'display:block;margin-top:12px}'
    '.legal{margin-top:52px;padding-top:20px;border-top:1px solid var(--rule);'
    'color:var(--ink-3);font-size:13px;line-height:1.7}'
    '.back{display:inline-block;margin-top:28px;color:var(--field);font-size:14.5px}')

LEGAL = (
    '<p class="legal"><b>Every figure in this article is measured, and says where from.</b> '
    'The numbers and charts are generated at build time from the data files in '
    '<a href="https://github.com/agifuturefoundation/locator.x">the Locator.X repository</a> '
    '&mdash; not typed into the prose &mdash; so an article cannot quote one figure and draw '
    'another. Values from county rolls are <b>assessments, never prices</b>; index values are '
    'not prices; an announced job is an intention with a date, not a forecast. '
    'Nothing here is investment, tax or legal advice, and nothing here is an offer to sell or '
    'a solicitation to buy any security or interest in any property or fund. '
    '&copy; 2026 AGI Future Foundation.</p>')


def page(site, fname, title, desc, body, wide=False):
    doc = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
           '<meta name="color-scheme" content="light dark">\n'
           '<meta name="description" content="%s">\n'
           '<meta property="og:title" content="%s">\n'
           '<meta property="og:description" content="%s">\n'
           '<meta property="og:type" content="article">\n'
           '<title>%s</title>\n'
           '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,'
           'wght@9..144,400;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:'
           'wght@400;500;600&display=swap">\n<style>%s</style>\n</head>\n<body>\n'
           '<div class="wrap%s">\n%s\n%s\n</div>\n</body>\n</html>\n'
           % (esc(desc), esc(title), esc(desc), esc(title), STYLE,
              ' wide' if wide else '', body, LEGAL))
    with open(os.path.join(site, fname), 'w', encoding='utf-8') as f:
        f.write(doc)
    return len(doc)


def profile(site, check=False):
    """The instructor profile — rendered only when supplied, per
    curriculum/INSTRUCTOR_PROFILE.md. An unsupplied profile is not a gap to fill
    with a draft; it is the honest state, and it renders nothing."""
    path = os.path.join(ROOT, 'content', 'instructor-profile.json')
    if not os.path.exists(path):
        return None
    P = json.load(open(path, encoding='utf-8'))
    if not P.get('supplied'):
        if check:
            print('  · instructor profile: not supplied — no page rendered (by design)')
        return None
    errs = []
    if not P.get('lede'):
        errs.append('supplied profile has an empty lede')
    for sec in P.get('sections') or []:
        if not sec.get('body'):
            errs.append('section "%s" has an empty body' % sec.get('heading', '?'))
    for r in P.get('references') or []:
        if not r.get('what'):
            errs.append('a reference has no `what` — the claim it supports')
    if errs:
        raise SystemExit('build_blog: instructor profile: ' + '; '.join(errs))
    if check:
        print('  · instructor profile: supplied, %d sections, %d references'
              % (len(P.get('sections') or []), len(P.get('references') or [])))
        return P
    body = ('<p class="kicker">The instructor</p>\n<h1>' + esc(P['name']) + '</h1>\n'
            + ('<p class="sub">' + md_inline(P['role']) + '</p>\n' if P.get('role') else '')
            + '<p class="byline">Locator.X &middot; supplied by the instructor</p>\n'
            + '<p>' + md_inline(P['lede']) + '</p>\n'
            + ''.join('<h2>' + esc(s0['heading']) + '</h2>\n<p>' + md_inline(s0['body']) + '</p>'
                      for s0 in P.get('sections') or []))
    refs = P.get('references') or []
    if refs:
        body += ('\n<h2>References</h2>\n<div class="scroll"><table><thead><tr>'
                 '<th>Claim</th><th>Where</th><th>Date</th></tr></thead><tbody>'
                 + ''.join('<tr><td>%s</td><td>%s</td><td>%s</td></tr>'
                           % (md_inline(r['what']),
                              ('<a href="%s">%s</a>' % (esc(r['url']), esc(r.get('where') or r['url'])))
                              if r.get('url') else esc(r.get('where') or '—'),
                              esc(r.get('date') or '—')) for r in refs)
                 + '</tbody></table></div>')
    body += ('\n<h2>Start the courses</h2>\n<p>Fifty courses across four levels, on an '
             'emotional-equity foundation. <a href="../locator-x-learning-environment.html">'
             'Open the learning environment</a> or browse '
             '<a href="../locator-x-applied-courses.html">the applied arcs</a>.</p>'
             '\n<a class="back" href="index.html">&larr; All articles</a>')
    page(site, 'instructor.html', P['name'], P.get('role') or ('%s — instructor, Locator.X'
         % P['name']), body)
    print('  + instructor.html (supplied profile)')
    return P


def main():
    check = '--check' in sys.argv
    site = None
    if not check:
        if len(sys.argv) < 2:
            raise SystemExit('usage: python3 scripts/build_blog.py <site_dir> | --check')
        site = os.path.join(sys.argv[1], 'articles')
        os.makedirs(site, exist_ok=True)

    figs = figures()
    if not os.path.isdir(SRC):
        raise SystemExit('build_blog: no content/blog directory')
    arts = []
    for name in sorted(os.listdir(SRC)):
        if not name.endswith('.md'):
            continue
        meta, body = parse(os.path.join(SRC, name))
        words = len(re.sub(r'\{\{[^}]+\}\}', '', body).split())
        arts.append((meta, body, words))

    if check:
        for meta, body, words in arts:
            for m in re.finditer(r'\{\{fig:([a-z0-9_]+)\}\}', body):
                if m.group(1) not in figs:
                    raise SystemExit('build_blog: %s asks for unknown figure "%s"'
                                     % (meta['slug'], m.group(1)))
            for m in re.finditer(r'\{\{chart:([a-z0-9-]+)\}\}', body):
                if m.group(1) not in CHARTS:
                    raise SystemExit('build_blog: %s asks for unknown chart "%s"'
                                     % (meta['slug'], m.group(1)))
        lens = sorted(a[2] for a in arts)
        print('  · %d articles · %s words · shortest %s, longest %s · every figure '
              'and chart resolves from committed data'
              % (len(arts), '{:,}'.format(sum(lens)), '{:,}'.format(lens[0]),
                 '{:,}'.format(lens[-1])))
        profile(None, check=True)
        return

    prof = profile(site)
    arts.sort(key=lambda a: a[0]['date'], reverse=True)
    for meta, body, words in arts:
        art = ('<p class="kicker">' + esc(meta['topic']) + '</p>\n<h1>' + esc(meta['title'])
               + '</h1>\n<p class="sub">' + md_inline(meta['summary']) + '</p>\n'
               + '<p class="byline">Locator.X &middot; ' + esc(meta['date'])
               + ' &middot; ' + '{:,}'.format(words) + ' words &middot; every figure '
               + 'generated from measured data</p>\n' + md(body, figs)
               + '\n<a class="back" href="index.html">&larr; All articles</a>')
        n = page(site, meta['slug'] + '.html', meta['title'], meta['summary'], art)
        print('  + %-46s %5s words  %5.1f KB' % (meta['slug'] + '.html',
                                                 '{:,}'.format(words), n / 1024))

    cards = ''.join(
        '<a class="card" href="%s.html"><h2>%s</h2><p>%s</p>'
        '<span class="tag">%s &middot; %s &middot; %s words</span></a>'
        % (esc(m['slug']), esc(m['title']), esc(m['summary']), esc(m['topic']),
           esc(m['date']), '{:,}'.format(w)) for m, _, w in arts)
    lead = ('<a class="card" href="instructor.html"><h2>%s</h2><p>%s</p>'
            '<span class="tag">the instructor &middot; lead-in to the courses</span></a>'
            % (esc(prof['name']), esc(prof.get('role') or 'Instructor, Locator.X'))) if prof else ''
    idx = ('<p class="kicker">Locator.X &middot; articles</p>\n'
           '<h1>What the public record actually says</h1>\n'
           '<p class="sub">Field notes from building a real-estate analytics platform that '
           'refuses to show a number it cannot defend. Every figure in every article is '
           'generated from the measured data in the repository at build time &mdash; if the '
           'data moves, the article moves with it.</p>\n'
           '<div class="grid">' + lead + cards + '</div>\n'
           '<a class="back" href="../index.html">&larr; All companion pages</a>')
    page(site, 'index.html', 'Locator.X — Articles',
         'Field notes from a real-estate analytics platform that refuses to show a number '
         'it cannot defend.', idx, wide=True)
    print('articles: %d written, %s words total'
          % (len(arts), '{:,}'.format(sum(a[2] for a in arts))))


if __name__ == '__main__':
    main()
