"""build_market_pages — the site's measured market layer, from market/*.json.

Run by deploy-pages after pages/ is staged. Renders seven pages out of the
sourced data files in market/ — the shipped-editions dashboard, the two market
pages, the submarket ranking, the two corridor measures and the campus record —
so the site's market layer is a straight rendering of committed data and can
never drift from it. Nothing is computed at build time beyond arithmetic the
data file's own fields define (a ratio of two published figures, a sum, a
count); no figure is estimated, defaulted or filled in.

The honesty rules are in the rendering, not in prose bolted on afterwards:

  * A field the data file omits renders as a dash or an explicit "not
    published" / "not disclosed" — never zero, never a neighbour's value.
  * Every derived ratio states what it is not, next to where it is drawn.
  * Every row that carries a source renders that source as a link, and every
    edition renders whether its record count was measured or only inherited.

<<<<<<< HEAD
Usage: python3 scripts/build_market_pages.py <site_dir> [market_dir]
=======
Usage: python3 scripts/build_market_pages.py <site_dir>
>>>>>>> origin/main
"""
import html
import json
import os
import sys
from collections import Counter, OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
<<<<<<< HEAD
# Defaults to the committed data; tests/run.py passes a synthetic market dir to
# exercise the unknown-handling paths the live data happens not to reach.
=======
>>>>>>> origin/main
MARKET = os.path.join(os.path.dirname(HERE), 'market')

PUBLISH_MAP = ('https://github.com/agifuturefoundation/locator.x/blob/main/docs/PUBLISH_MAP.md')
BELTS_URL = 'https://claude.ai/code/artifact/5dc4d95d-84e2-46b0-916f-60e928a3bd76'


def esc(s):
    return html.escape(str(s), quote=True)


def num(v):
    """Thousands-separated integer, or an em dash when the source has no figure."""
    return format(int(round(v)), ',') if isinstance(v, (int, float)) else '—'


def usd(v):
    if not isinstance(v, (int, float)):
        return 'not disclosed'
    if v >= 1e10:
        return '$%.0fB' % (v / 1e9)
    if v >= 1e9:
        return '$%.1fB' % (v / 1e9)
    if v >= 1e6:
        return '$%.0fM' % (v / 1e6)
    return '$' + num(v)


def pct(v, dp=1):
    return ('%.*f%%' % (dp, v * 100)) if isinstance(v, (int, float)) else '—'


STYLE = (
    ':root{--paper:#F2EFE9;--card:#FBF9F5;--ink:#17140F;--ink-2:#4A443A;--ink-3:#7C7264;'
    '--rule:#D5CDBE;--field:#2C6B4E;--flag:#B9531F;'
    '--shadow:0 1px 2px rgba(23,20,15,.05),0 10px 26px -16px rgba(23,20,15,.22)}'
    '@media (prefers-color-scheme:dark){:root{--paper:#14120E;--card:#1D1A15;--ink:#F1ECE1;'
    '--ink-2:#BDB4A4;--ink-3:#8A8073;--rule:#332E26;--field:#5FA483;--flag:#E0742F;'
    '--shadow:0 1px 2px rgba(0,0,0,.4),0 10px 26px -16px rgba(0,0,0,.6)}}'
    '*{box-sizing:border-box}'
    'body{margin:0;background:var(--paper);color:var(--ink);'
    'font:15.5px/1.6 "IBM Plex Sans",system-ui,sans-serif;padding:0 16px}'
    '.wrap{max-width:980px;margin:0 auto;padding-block:48px 72px}'
    'h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(27px,5vw,40px);'
    'margin:0 0 8px;letter-spacing:-.01em}'
    'h2{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(19px,2.4vw,24px);margin:38px 0 8px}'
    '.kicker{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.14em;'
    'text-transform:uppercase;color:var(--field);margin:0 0 14px}'
    '.sub,.note{color:var(--ink-2);max-width:72ch}'
    '.sub{margin:0 0 6px;font-size:16px}'
    '.note{font-size:13.5px;margin:0 0 14px}'
    '.mono{font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums}'
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin-top:16px}'
    'a.card{display:block;background:var(--card);border:1px solid var(--rule);border-radius:10px;'
    'padding:16px 17px 14px;text-decoration:none;color:inherit;box-shadow:var(--shadow)}'
    'a.card h3{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:18px;margin:0 0 6px}'
    'a.card p{margin:0;color:var(--ink-2);font-size:13.5px}'
    'a.card .tag{font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--ink-3);'
    'display:block;margin-top:10px}'
    '.scroll{overflow-x:auto;border:1px solid var(--rule);border-radius:10px;background:var(--card);'
    'box-shadow:var(--shadow)}'
    'table{width:100%;border-collapse:collapse;font-size:13px;min-width:640px}'
    'th{text-align:left;padding:9px 11px;border-bottom:1px solid var(--rule);'
    'font-family:"IBM Plex Mono",monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;'
    'color:var(--ink-3);font-weight:500;white-space:nowrap;background:var(--card)}'
    'td{padding:8px 11px;border-bottom:1px solid var(--rule);vertical-align:top}'
    'tr:last-child td{border-bottom:0}'
    'th.r,td.r{text-align:right;font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;'
    'white-space:nowrap}'
    '.small{font-size:11.5px;color:var(--ink-3)}'
    '.tag{font-family:"IBM Plex Mono",monospace;font-size:10.5px;border:1px solid var(--rule);'
    'border-radius:5px;padding:1px 7px;color:var(--ink-2);white-space:nowrap}'
    '.tag.warn{color:var(--flag);border-color:var(--flag)}'
    '.tag.ok{color:var(--field);border-color:var(--field)}'
    '.panel{border:1px solid var(--rule);background:var(--card);border-radius:10px;padding:16px 18px;'
    'box-shadow:var(--shadow);margin:16px 0}'
    'details{margin:14px 0}summary{cursor:pointer;color:var(--ink-2);font-size:13.5px}'
    '.legal{margin-top:44px;padding-top:16px;border-top:1px solid var(--rule);'
    'color:var(--ink-3);font-size:12.5px;line-height:1.65;max-width:76ch}'
    '.back{display:inline-block;margin-top:22px;color:var(--field);font-size:14px}'
    'a{color:var(--field)}')

LEGAL = (
    '<p class="legal"><b>Original Locator.X analysis, rendered from the committed market data.</b> '
    'Every figure on this page comes from <code>market/*.json</code> in '
    '<a href="https://github.com/agifuturefoundation/locator.x">the source repository</a>, extracted '
    '2026-09-11 from the live published editions and carrying the source and as-of date those '
    'editions publish. An announced job is an intention with a date, never a forecast; a permit is '
    'not a delivered unit; index values are not prices and county-roll values are assessments, never '
    'prices. Blank cells mean the source publishes no figure — they are never filled in. Nothing '
    'here is investment, tax or legal advice.</p>\n'
    '<a class="back" href="index.html">&larr; All companion pages</a>')


def write(site, fname, title, kicker, body, desc):
    doc = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
           '<meta name="color-scheme" content="light dark">\n'
           '<meta name="description" content="%s">\n<title>%s</title>\n'
           '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,'
           'wght@9..144,400;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:'
           'wght@400;500;600&display=swap">\n<style>%s</style>\n</head>\n<body>\n<div class="wrap">\n'
           '<p class="kicker">%s</p>\n%s\n%s\n</div>\n</body>\n</html>\n'
           % (esc(desc), esc(title), STYLE, esc(kicker), body, LEGAL))
    path = os.path.join(site, fname)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(doc)
    print('  + %-30s %6.1f KB' % (fname, len(doc) / 1024))


# ---- shared renderers ----------------------------------------------------

BELTS_BASIS = ('Rank is the national position among all ranked submarkets. Values are public '
               'home-value and rent <em>index</em> figures (ZHVI / ZORI) — an index value is not a '
               'price. Gross yield is rent before every operating cost. Drift is rent growth minus '
               'value growth over twelve months.')


def belts_table(rows, wide=False):
    tr = []
    for r in rows:
        metro = '<td class="small">%s</td>' % esc(r['metro']) if wide else ''
        tr.append('<tr><td class="r">%s</td><td class="mono">%s</td><td>%s</td>%s'
                  '<td class="small">%s</td><td class="r">%s</td><td class="r">%s</td>'
                  '<td class="r">%s</td><td class="r">%s</td><td class="r">%s</td>'
                  '<td class="r">%s</td></tr>'
                  % (r['rank'], esc(r['zip']), esc(r['city']), metro, esc(r['county']),
                     '$' + num(r['value']), '$' + num(r['rent']), pct(r['yield']),
                     pct(r['r12']), pct(r['drift']), '%.1f' % r['score']))
    mh = '<th>Metro</th>' if wide else ''
    return ('<div class="scroll"><table><thead><tr><th class="r">#</th><th>ZIP</th><th>City</th>%s'
            '<th>County</th><th class="r">Index value</th><th class="r">Index rent</th>'
            '<th class="r">Gross yield</th><th class="r">Rent 12m</th><th class="r">Drift</th>'
            '<th class="r">Score</th></tr></thead><tbody>%s</tbody></table></div>'
            % (mh, ''.join(tr)))


def status_tag(status):
    up = (status or '').upper()
    if up.startswith('ANNOUNCED'):
        return '<span class="tag warn">announced only</span>'
    if 'UNDER CONSTRUCTION' in up:
        return '<span class="tag ok">under construction</span>'
    if 'CANCEL' in up or 'CLOSED' in up:
        return '<span class="tag warn">cancelled / closed</span>'
    first = (status or '—').split(' ')[0].strip('.,;').lower()
    return '<span class="tag">%s</span>' % esc(first or '—')


def jobs_basis(p):
    """Whose figure the headcount is — and, where the record never captured that,
    a line saying exactly that rather than a dash the reader will read as 'none'."""
    basis = str(p.get('jobsBasis', '')).strip()
    if basis:
        return esc(basis)
    if p.get('jobs'):
        return ('<i>no basis line in the record — read the headcount as the '
                'announcement\'s own, unconfirmed</i>')
    return 'no headcount announced'


def projects_table(rows):
    tr = []
    for p in sorted(rows, key=lambda x: -(x.get('investment') or 0)):
        where = esc(p.get('city', '—'))
        if p.get('parish'):
            where += ', ' + esc(p['parish']) + ' Parish'
        tr.append('<tr><td><b>%s</b><div class="small">%s</div></td>'
                  '<td>%s%s</td><td class="r">%s</td><td class="r">%s</td>'
                  '<td><div class="small" style="max-width:38ch">%s</div>'
                  '<div class="small" style="max-width:38ch;margin-top:4px"><b>Jobs basis:</b> %s</div>'
                  '<div class="small" style="margin-top:4px">%s · announced %s</div></td></tr>'
                  % (esc(p.get('company', '—')), esc(p.get('project', '')),
                     where, '<div style="margin-top:4px">%s</div>' % status_tag(p.get('status')),
                     usd(p.get('investment')),
                     num(p['jobs']) if p.get('jobs') else 'not disclosed',
                     esc(p.get('status', '—')), jobs_basis(p),
                     ('<a href="%s">source</a>' % esc(p['url'])) if p.get('url') else 'no source link',
                     esc(p.get('announced', '—'))))
    return ('<div class="scroll"><table><thead><tr><th>Company &amp; project</th>'
            '<th>Where · status</th><th class="r">Announced capital</th>'
            '<th class="r">Announced jobs</th><th>The record</th></tr></thead>'
            '<tbody>%s</tbody></table></div>' % ''.join(tr))


def editions_table(eds, only=None):
    tr = []
    rows = [e for e in eds if only is None or e['file'] in only]
    for e in rows:
        tr.append('<tr><td><b>%s</b><div class="small">%s</div></td><td>%s</td>'
                  '<td class="r">%s</td><td class="small">%s</td><td><a href="%s">open</a></td></tr>'
                  % (esc(e['title']), esc(e['key']), esc(e['market']),
                     num(e['records_measured']) if 'records_measured' in e else '—',
                     esc(e['records_note']), esc(e['url'])))
    return ('<div class="scroll"><table><thead><tr><th>Edition</th><th>Market</th>'
            '<th class="r">Records</th><th>Count status</th><th>Live</th></tr></thead>'
            '<tbody>%s</tbody></table></div>' % ''.join(tr))


# ---- the pages -----------------------------------------------------------

def page_dashboard(site, ED, B, C, P, K):
    eds = ED['editions']
    measured = [e for e in eds if 'records_measured' in e]
    body = f'''
<h1>Market dashboard</h1>
<p class="sub">Every shipped edition and every market page, on one screen — and only figures
that were measured, each with its date. What is not measured says so.</p>

<h2>The shipped editions — {len(eds)}, all live</h2>
<p class="note">Record counts were measured {esc(measured[0]['records_measured_on'])} by driving the
live published artifacts in headless Chromium and counting each edition's record store, zero page
errors; the {len(measured)} measured match the documented verification in
<a href="{PUBLISH_MAP}">docs/PUBLISH_MAP.md</a> exactly. "Fetched, not re-counted" is an honest
status, not a gap being papered over.</p>
{editions_table(eds)}
<p class="note" style="margin-top:10px">The hash-verified <a href="editions/index.html">editions
channel</a> lists these on this site the moment the data machine publishes them; the
<a href="demo.html">app demo</a> runs the same application on clearly-labeled synthetic fixtures.</p>

<h2>The market pages — the record, by market and by measure</h2>
<div class="grid">
  <a class="card" href="new-orleans-louisiana.html"><h3>New Orleans &amp; Louisiana</h3>
    <p>The measured Louisiana editions, the Louisiana submarkets in the national ranking, the
    corridor areas, and {len([p for p in P if p.get('state') == 'LA'])} sourced project
    announcements.</p>
    <span class="tag">market · measured · sourced</span></a>
  <a class="card" href="sf-bay-area.html"><h3>San Francisco &amp; the Bay Area</h3>
    <p>The Bay ledger and atlases, the Bay submarkets in the national ranking, and the California
    project record.</p>
    <span class="tag">market · measured · sourced</span></a>
  <a class="card" href="high-potential-belts.html"><h3>High-Potential Belts</h3>
    <p>{B['coverage']['ranked']} submarkets ranked on rent versus price — both published views, the
    score's open weights, and the coverage stated before anything derived from it.</p>
    <span class="tag">ranking · ZHVI+ZORI</span></a>
  <a class="card" href="jobs-to-housing.html"><h3>Jobs to Housing</h3>
    <p>Announced jobs per housing unit permitted, across {len(C['metros'])} corridor areas — a
    ranking measure with its caveats attached, never a count of households.</p>
    <span class="tag">corridor measure · sourced per cell</span></a>
  <a class="card" href="core-cities.html"><h3>Core Cities</h3>
    <p>The corridor anchors: live, staged, and the {len(C.get('dropped', []))} considered and
    dropped — named rather than hidden.</p>
    <span class="tag">corridor anchors · honest statuses</span></a>
  <a class="card" href="louisiana-universities.html"><h3>Louisiana Universities</h3>
    <p>The campus record behind the Baton Rouge edition — every enrolment figure with its own
    source and term.</p>
    <span class="tag">campus record · sourced · dated</span></a>
</div>

<h2>What this dashboard will not show</h2>
<div class="panel"><p class="note" style="margin:0">No scores without an open method, no tiers,
no prices, no strategies. The record layer publishes <b>assessments, never prices</b>; the belts
ranking publishes its weights and its coverage before its rows; the ratio pages say what their
ratios are not. Anything shaped like "which market should I buy in" is navigation of the public
record with a verify-before-relying disclaimer — never a recommendation. The corridor-era
dashboards that did carry illustrative scores and strategies are preserved as lineage, behind a
banner that says so: <a href="legacy/locator-x-master-dashboard.html">the corridor-era master
dashboard</a> (<a href="https://github.com/agifuturefoundation/locator.x/blob/main/docs/CORRIDOR_PROJECT_COMPLETION_SUMMARY.md">figures
reconciliation</a>).</p></div>
'''
    write(site, 'market-dashboard.html', 'Locator.X — Market Dashboard',
          'Locator.X · the measured record layer', body,
          'Locator.X market dashboard — the shipped editions and the measured record layer, '
          'every figure with its source and date.')


def corridor_rows(metros, with_ratio=True):
    out = []
    for m in metros:
        jobs, permits = m.get('jobs'), m.get('permits')
        have = jobs is not None and permits
        if have:
            v = jobs / permits
            ratio = ('<td class="r"><b%s>%.1f</b>%s</td>'
                     % (' style="color:var(--flag)"' if v < 0 else '', v,
                        '<div class="small">net loss</div>' if v < 0 else ''))
        else:
            ratio = '<td class="r">not drawn</td>'
        out.append('<tr><td><b>%s</b><div class="small">%s</div></td>'
                   '<td class="r">%s</td>'
                   '<td class="r">%s<div class="small">%s</div></td>%s'
                   '<td class="r">%s<div class="small">%s</div></td></tr>'
                   % (esc(m['metro']), esc(', '.join(m.get('counties', [])) or ''),
                      num(jobs) if jobs is not None else '—',
                      num(m['permits']) if m.get('permits') else 'not published',
                      esc(m.get('permitsAsOf') or ''),
                      ratio if with_ratio else '',
                      num(m['pop']) if m.get('pop') else '—',
                      esc(m.get('popAsOf') or '')))
    rh = '<th class="r">Jobs per unit permitted</th>' if with_ratio else ''
    return ('<div class="scroll"><table><thead><tr><th>Metro / area</th>'
            '<th class="r">Announced jobs</th><th class="r">Housing units permitted (TTM)</th>%s'
            '<th class="r">Population</th></tr></thead><tbody>%s</tbody></table></div>'
            % (rh, ''.join(out)))


def page_market(site, fname, title, kicker, heading, lede, ED, files, B, P, state,
                metros=None, extra=''):
    belts_rows = [r for r in B['top100'] if r['state'] == state] if metros is None else \
                 [r for r in B['top100'] if r['metro'] in metros]
    projects = [p for p in P if p.get('state') == state]
    body = f'''
<h1>{heading}</h1>
<p class="sub">{lede}</p>

<h2>The shipped editions</h2>
<p class="note">Record counts measured by driving the live published editions headless and counting
their record stores; the measured ones match the documented verification in
<a href="{PUBLISH_MAP}">docs/PUBLISH_MAP.md</a> exactly.</p>
{editions_table(ED['editions'], only=files)}
{extra}
<h2>Submarkets in the High-Potential Belts ranking</h2>
<p class="note">{len(belts_rows)} of the national top 100 (from {B['coverage']['ranked']} ranked
submarkets) fall here. {BELTS_BASIS}</p>
{belts_table(belts_rows)}
<p class="note" style="margin-top:8px">The full ranking, its weights and its coverage:
<a href="high-potential-belts.html">High-Potential Belts</a>.</p>

<h2>The announced-project record — {len(projects)} projects</h2>
<p class="note">Every row carries its own source link, announcement date, status and a jobs-basis
line saying whose figure the headcount is. An announcement is an intention with a date: several of
the largest are announced only, and the record says so.</p>
{projects_table(projects)}
'''
    write(site, fname, title, kicker, body,
          '%s — the measured Locator.X record layer, every figure with its source and date.' % heading)


def page_belts(site, B):
    cov, meth, w = B['coverage'], B['method'], B['method']['weights']
    top100, belts = B['top100'], B['belts']
    state_counts = Counter(r['state'] for r in top100)
    metro_counts = Counter(r['metro'] for r in top100)
    sc = ''.join('<tr><td><b>%s</b></td><td class="r">%d</td><td class="small">%s</td></tr>'
                 % (esc(st), c, esc(', '.join(sorted({r['city'] for r in top100 if r['state'] == st}))))
                 for st, c in state_counts.most_common())
    mc = ''.join('<tr><td><b>%s</b></td><td class="r">%d</td></tr>' % (esc(m), c)
                 for m, c in metro_counts.most_common())
    weights = ''.join('<tr><td>%s</td><td class="r" style="color:var(--%s)">%+d%%</td></tr>'
                      % (esc(lbl), 'field' if v > 0 else 'flag', round(v * 100))
                      for lbl, v in [
                          ('Gross yield — what it pays now', w['yield']),
                          ('Rent growth, 12 months — demand in rent, not price', w['r12']),
                          ('Drift — rent growth minus value growth', w['drift']),
                          ('Volatility of the value series', w['stable']),
                          ('Holdout error — can this be modelled at all', w['model'])])
    dropped = cov['zips_with_both'] - cov['ranked']
    body = f'''
<h1>The High-Potential Belts</h1>
<p class="sub">Where rent is outrunning price: {cov['ranked']} US submarkets ranked on what they
pay now rather than what they have appreciated — scored in the open, leading with the
{len(cov['states_covered'])} states this covers and the {len(cov['states_absent'])} it does not.</p>

<h2>Coverage, before anything derived from it</h2>
<p class="note"><b>This is not a map of the United States.</b> The index bundle carries both a
value and a rent series for ZIPs in {len(cov['states_covered'])} states; the other
{len(cov['states_absent'])} are absent — not scored low, <em>not measured</em>. Of
{num(cov['zips_with_both'])} ZIPs carrying both series, {cov['ranked']} cleared the data floor
({meth['min_points']}+ monthly points); {num(dropped)} were dropped for a series too thin to trust.</p>
<div class="panel">
<p class="note" style="margin:0 0 6px"><b>Covered ({len(cov['states_covered'])}):</b>
<span class="mono">{esc(' '.join(cov['states_covered']))}</span></p>
<p class="note" style="margin:0"><b>Absent entirely ({len(cov['states_absent'])}):</b>
<span class="mono">{esc(' '.join(cov['states_absent']))}</span></p></div>

<h2>How the score is built, and how to disagree with it</h2>
<p class="note">Each component is percentile-ranked across the {cov['ranked']} candidates, then
weighted over only the components a submarket can actually answer — a missing component is counted
and shown, never imputed as average. Cash flow before capital gains: price appreciation alone never
drives a rank. Ranked at ZIP grain because that is what the data supports — only {cov['metros']}
metros carry both series, so a hundred <em>metros</em> does not exist to be listed.</p>
<div class="scroll" style="max-width:560px"><table style="min-width:0"><thead>
<tr><th>Component</th><th class="r">Weight</th></tr></thead><tbody>{weights}</tbody></table></div>
<p class="note" style="margin-top:10px"><b>Drift</b> is the component most rankings leave out:
rent growth minus value growth. A submarket where rents are outrunning prices has not yet repriced
its own demand; one where prices outran rents is selling you someone else's optimism.
<b>Holdout error</b> fits the model without the last {meth['holdout_months']} months and asks it to
predict them — a large error does not mean the submarket is bad, it means this method cannot see
it, which is a different warning and worth more.</p>

<h2>The belts — capped at {meth['metro_cap']} per metro ({len(belts)} submarkets)</h2>
<p class="note">The two largest metros supply 44% of all candidates, which is why this view exists:
a national-sounding list drawn mostly from two cities is a description of those two cities. The cap
surfaces the belts — clusters of neighbouring submarkets where the same rent-versus-price story
holds across ZIP after ZIP.</p>
{belts_table(belts, wide=True)}

<h2>The top 100 as ranked, uncapped</h2>
{belts_table(top100, wide=True)}

<h2>Where the top 100 falls</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px">
<div class="scroll"><table style="min-width:0"><thead><tr><th>State</th><th class="r">In top 100</th>
<th>Cities</th></tr></thead><tbody>{sc}</tbody></table></div>
<div class="scroll"><table style="min-width:0"><thead><tr><th>Metro</th><th class="r">In top 100</th>
</tr></thead><tbody>{mc}</tbody></table></div></div>
<p class="note" style="margin-top:14px">Market extracts joined to the shipped editions' measured
record layers: <a href="new-orleans-louisiana.html">New Orleans &amp; Louisiana</a> ·
<a href="sf-bay-area.html">San Francisco &amp; the Bay Area</a>. The live interactive version of
this analysis: <a href="{BELTS_URL}">High-Potential Belts</a>.</p>
<p class="note"><b>Expanding the belts is a data job, not an edit:</b> the
{len(cov['states_absent'])} absent states join this page when their ZIPs carry both a value and a
rent series in the index bundle, and the {num(dropped)} dropped ZIPs join when their series clear
the {meth['min_points']}-point floor — never before. This ranks <em>submarkets</em>: a ZIP that
scores well here still has to survive the seven LOCATOR gates on the parcel itself.</p>
'''
    write(site, 'high-potential-belts.html', 'Locator.X — High-Potential Belts',
          'Locator.X · submarket ranking · rent vs price', body,
          'Locator.X High-Potential Belts — US submarkets ranked on rent versus price, with open '
          'weights and coverage stated first.')


def page_jobs_housing(site, C):
    ordered = sorted(C['metros'],
                     key=lambda x: -(x['jobs'] / x['permits'])
                     if (x.get('jobs') and x.get('permits')) else 1)
    caveats = ''.join('<li>%s</li>' % esc(c) for c in C.get('caveats', []))
    body = f'''
<h1>Jobs to housing</h1>
<p class="sub">Announced direct jobs divided by housing units permitted in the trailing twelve
months — a crude measure of how much new demand is arriving per unit of new supply, computed only
where both halves are published figures with sources.</p>
<div class="panel"><p class="note" style="margin:0"><b>What this ratio is, precisely.</b>
An announced job is not a filled job — announcements are downsized, delayed and cancelled, and the
project record says so on every row. A permit is not a delivered unit, and a metro-wide permit
count says nothing about where in the metro the units land. Household formation per job is never
1.0 — it varies by wage level, by how many hires relocate, and by how many already live in the
metro. So read the ratio as a way to <b>rank these areas against each other on the same published
basis</b>, and never as a number of households. An area missing either half shows "not drawn"
rather than a number invented to fill the cell.</p></div>
<p class="note">Jobs are company and state announcements (the per-project record with sources:
<a href="new-orleans-louisiana.html">Louisiana</a> · <a href="sf-bay-area.html">California</a>);
permits are trailing-twelve-month sums of Census Building Permits Survey monthly observations;
population is the most recent published metro estimate. As-of dates shown per cell.</p>
{corridor_rows(ordered)}
<details><summary>Every caveat carried on the corridor record ({len(C.get('caveats', []))})</summary>
<div class="panel"><ul style="margin:0;padding-left:20px;font-size:13px;color:var(--ink-2)">{caveats}</ul></div></details>
'''
    write(site, 'jobs-to-housing.html', 'Locator.X — Jobs to Housing',
          'Locator.X · corridor measure · jobs / permits', body,
          'Locator.X jobs-to-housing — announced jobs per housing unit permitted across the '
          'corridor areas, with every caveat attached.')


def page_core_cities(site, C):
    live = [m for m in C['metros'] if m.get('kind') == 'live']
    staged = [m for m in C['metros'] if m.get('kind') != 'live']
    dropped = C.get('dropped', [])

    def rows(ms):
        out = []
        for m in sorted(ms, key=lambda x: -(x.get('records') or 0)):
            nproj = len(m.get('projects') or [])
            out.append('<tr><td><b>%s</b><div class="small">%s</div></td><td class="small">%s</td>'
                       '<td class="r">%s</td><td class="r">%s</td><td class="r">%s</td></tr>'
                       % (esc(m['metro'].split(',')[0]), esc(m['metro']),
                          esc(', '.join(m.get('counties', [])) or '—'),
                          num(m['records']) if m.get('records') else '—',
                          nproj or '—', num(m['pop']) if m.get('pop') else '—'))
        return ('<div class="scroll"><table><thead><tr><th>Core city</th><th>Counties</th>'
                '<th class="r">Records held</th><th class="r">Projects</th>'
                '<th class="r">Population</th></tr></thead><tbody>%s</tbody></table></div>'
                % ''.join(out))

    drows = ''.join(
        '<li><b>%s</b>%s</li>' % (esc(d.get('metro', '')), ' — ' + esc(d['why']) if d.get('why') else '')
        if isinstance(d, dict) else '<li>%s</li>' % esc(d) for d in dropped)
    body = f'''
<h1>Core cities</h1>
<p class="sub">The cities anchoring the corridor record: {len(live)} live in the shipped builds,
{len(staged)} staged with their endpoints confirmed, and {len(dropped)} considered and dropped —
named rather than hidden, because a list that only shows what made it in overstates itself.</p>

<h2>Live in the shipped builds</h2>
<p class="note">"Records held" is how much of the metro the current catalogue actually holds — a
short count is either a real market ceiling or a thin source, and each edition's corridor panel
says which.</p>
{rows(live)}

<h2>Staged — endpoints confirmed, build pending</h2>
{rows(staged)}

<h2>Considered and dropped</h2>
<p class="note">Dropped is an honest status, not a judgement on the market — most drops are a
source that publishes too little to rank.</p>
<div class="panel"><ul style="margin:0;padding-left:20px;font-size:13px;color:var(--ink-2)">{drows}</ul></div>

<p class="note" style="margin-top:20px">The cross-measures on these cities live on
<a href="jobs-to-housing.html">the jobs-to-housing page</a>, and the per-project evidence on the
<a href="new-orleans-louisiana.html">Louisiana</a> and <a href="sf-bay-area.html">Bay Area</a> pages.</p>
'''
    write(site, 'core-cities.html', 'Locator.X — Core Cities', 'Locator.X · corridor anchors', body,
          'Locator.X core cities — the corridor anchors: live, staged, and the ones considered '
          'and dropped.')


KIND = {'public4': 'public four-year', 'private4': 'private four-year',
        'community': 'community college', 'hbcu': 'HBCU', 'tech': 'technical college'}


def page_campuses(site, K, fields):
    idx = {k: i for i, k in enumerate(fields)}
    enr = lambda c: c[idx['enrolled']] if isinstance(c[idx['enrolled']], (int, float)) else None
    la = sorted([c for c in K if c[idx['state']] == 'LA'],
                key=lambda c: (enr(c) is None, -(enr(c) or 0)))
    by_city = OrderedDict()
    for c in la:
        by_city.setdefault(c[idx['city']], []).append(c)
    rows = ''.join(
        '<tr><td><b>%s</b></td><td>%s</td><td><span class="tag">%s</span></td>'
        '<td class="r">%s</td><td class="small">%s</td><td class="small"><a href="%s">source</a></td>'
        '<td class="r mono small">%.4f, %.4f</td></tr>'
        % (esc(c[idx['name']]), esc(c[idx['city']]),
           esc(KIND.get(c[idx['kind']], c[idx['kind']])),
           num(enr(c)) if enr(c) is not None else 'not published',
           esc(c[idx['term']] or 'no term published'), esc(c[idx['source']]),
           c[idx['lat']], c[idx['lng']])
        for c in la)
    city_total = lambda cs: sum(enr(x) or 0 for x in cs)
    city_rows = ''.join(
        '<tr><td><b>%s</b></td><td class="r">%d</td><td class="r">%s%s</td></tr>'
        % (esc(city), len(cs), num(city_total(cs)),
           '<div class="small">%d with no published enrolment</div>' % unknown
           if (unknown := sum(1 for x in cs if enr(x) is None)) else '')
        for city, cs in sorted(by_city.items(), key=lambda kv: -city_total(kv[1])))
    total = sum(enr(c) or 0 for c in la)
    unknown_la = sum(1 for c in la if enr(c) is None)
    body = f'''
<h1>Louisiana universities</h1>
<p class="sub">The campus record behind the Baton Rouge edition: {len(la)} Louisiana campuses,
{num(total)} enrolled{f' across the {len(la) - unknown_la} whose source publishes an enrolment figure'
if unknown_la else ''}, every row carrying that figure's own source and the term it was published
for. Enrolment is a demand floor that does not track the general economy, and campuses
cannot relocate — which is why the corridor record carries students per 100k as its own measure.</p>

<h2>Enrolment by city</h2>
<div class="scroll" style="max-width:560px"><table style="min-width:0"><thead>
<tr><th>City</th><th class="r">Campuses</th><th class="r">Enrolled</th></tr></thead>
<tbody>{city_rows}</tbody></table></div>
<p class="note" style="margin-top:8px">Different campuses publish for different terms (shown per
row), so city totals mix terms — they rank cities, they do not census them.
{f'{unknown_la} Louisiana campus(es) publish no enrolment figure at all: they are listed, counted '
 f'as campuses, and left out of every total rather than given a number they never published.'
 if unknown_la else 'Every Louisiana campus here publishes an enrolment figure.'}</p>

<h2>Every campus, with its source</h2>
<div class="scroll"><table><thead><tr><th>Campus</th><th>City</th><th>Kind</th>
<th class="r">Enrolled</th><th>Term</th><th>Source</th><th class="r">Coordinates</th></tr></thead>
<tbody>{rows}</tbody></table></div>
<p class="note" style="margin-top:14px">These campuses on the map with the parcel record around
them: <a href="https://claude.ai/code/artifact/4cacba36-41fb-46a7-ae73-a900860a4015">Locator X
Baton Rouge</a>. The parish-grain parcel maps live in
<a href="https://claude.ai/code/artifact/219b9628-d80f-4cdf-9c6b-8a94bde665a3">the New Orleans
Atlas</a>.</p>
'''
    write(site, 'louisiana-universities.html', 'Locator.X — Louisiana Universities',
          'Locator.X · the campus record · Louisiana', body,
          'Locator.X Louisiana campus record — enrolment by campus, each with its own source '
          'and term.')


BAY_METROS = {'San Francisco-Oakland-Berkeley, CA', 'San Jose-Sunnyvale-Santa Clara, CA',
              'Vallejo, CA', 'Santa Rosa-Petaluma, CA', 'Napa, CA'}


def main():
    if len(sys.argv) < 2:
<<<<<<< HEAD
        raise SystemExit('usage: python3 scripts/build_market_pages.py <site_dir> [market_dir]')
    site = sys.argv[1]
    market = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else MARKET
    os.makedirs(site, exist_ok=True)

    def load(name):
        with open(os.path.join(market, name), encoding='utf-8') as f:
=======
        raise SystemExit('usage: python3 scripts/build_market_pages.py <site_dir>')
    site = sys.argv[1]
    os.makedirs(site, exist_ok=True)

    def load(name):
        with open(os.path.join(MARKET, name), encoding='utf-8') as f:
>>>>>>> origin/main
            return json.load(f)

    ED, B, C = load('editions.json'), load('belts.json'), load('corridors.json')
    P, KJ = load('projects.json')['projects'], load('campuses.json')

    page_dashboard(site, ED, B, C, P, KJ)

    la_metros = [m for m in C['metros'] if ', LA' in m['metro']]
    page_market(
        site, 'new-orleans-louisiana.html', 'Locator.X — New Orleans & Louisiana',
        'Locator.X · the measured layer · Louisiana', 'New Orleans &amp; Louisiana',
        'The measured layer for the anchor market — the shipped editions, the ranked submarkets, '
        'the corridor areas, and the announced-project record, each figure with its source.',
        ED, {'nola.html', 'atlas_nola.html', 'launi.html'}, B, P, 'LA',
        extra=('<h2>Louisiana corridor areas</h2>\n<p class="note">The %d Louisiana metro and '
               'micropolitan areas carried on the corridor record. Jobs are company and state '
               'announcements; permits are trailing-twelve-month sums of the Census Building '
               'Permits Survey; a blank cell means no published series, never zero. The ratio '
               'ranks areas against each other on the same published basis — it is not a count '
               'of households (<a href="jobs-to-housing.html">the full measure, with its '
               'caveats</a>).</p>\n%s\n' % (len(la_metros), corridor_rows(la_metros))))

    page_market(
        site, 'sf-bay-area.html', 'Locator.X — San Francisco & the Bay Area',
        'Locator.X · the measured layer · Bay Area', 'San Francisco &amp; the Bay Area',
        'The measured layer for the Bay — the shipped editions with their measured record counts, '
        'and every Bay Area submarket that made the national belts ranking.',
        ED, {'bay-ledger.html', 'atlas_bay.html', 'sheltercove.html'}, B, P, 'CA',
        metros=BAY_METROS)

    page_belts(site, B)
    page_jobs_housing(site, C)
    page_core_cities(site, C)
    page_campuses(site, KJ['campuses'], KJ['fields'])
    print('market pages: 7 written from market/*.json')


if __name__ == '__main__':
    main()
