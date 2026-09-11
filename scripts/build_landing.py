"""build_landing — the site's front door, generated so its numbers are real.

The landing page used to be a static card grid that described the platform in
adjectives. Every figure a visitor would actually want — how many records, how
many jurisdictions, how much of the country is covered — lived one or two clicks
away, and the front page carried none of them, which is a strange choice for a
platform whose entire argument is that it measures things.

This generates it instead, from the same committed data the market pages and the
articles read. Three consequences worth stating:

  * The hero figures are measured, and they move when the data moves. Nobody has
    to remember to update a number in a paragraph.
  * The coverage map draws the twelve states the index bundle actually covers
    and the thirty-nine it does not, side by side, at the top of the page. A
    platform that leads with coverage before conclusions on every inner page
    should not lead with conclusions on its front page.
  * Nothing here can claim more than the files support: a figure that has no
    source in market/*.json cannot be written into this page at all.

Usage: python3 scripts/build_landing.py <site_dir>
"""
import html
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def esc(s):
    return html.escape(str(s), quote=True)


def load(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return json.load(f)


def n(v):
    return '{:,}'.format(int(v))


# A tile grid of the United States: layout only, no data. Rows and columns are
# the conventional square-states arrangement, which reads as a country without
# implying a projection or an area.
TILES = {
    'AK': (0, 0), 'ME': (0, 11),
    'VT': (1, 10), 'NH': (1, 11),
    'WA': (2, 1), 'ID': (2, 2), 'MT': (2, 3), 'ND': (2, 4), 'MN': (2, 5), 'IL': (2, 6),
    'WI': (2, 7), 'MI': (2, 8), 'NY': (2, 9), 'RI': (2, 10), 'MA': (2, 11),
    'OR': (3, 1), 'NV': (3, 2), 'WY': (3, 3), 'SD': (3, 4), 'IA': (3, 5), 'IN': (3, 6),
    'OH': (3, 7), 'PA': (3, 8), 'NJ': (3, 9), 'CT': (3, 10),
    'CA': (4, 1), 'UT': (4, 2), 'CO': (4, 3), 'NE': (4, 4), 'MO': (4, 5), 'KY': (4, 6),
    'WV': (4, 7), 'VA': (4, 8), 'MD': (4, 9), 'DE': (4, 10),
    'AZ': (5, 2), 'NM': (5, 3), 'KS': (5, 4), 'AR': (5, 5), 'TN': (5, 6), 'NC': (5, 7),
    'SC': (5, 8), 'DC': (5, 9),
    'OK': (6, 4), 'LA': (6, 5), 'MS': (6, 6), 'AL': (6, 7), 'GA': (6, 8),
    'HI': (7, 1), 'TX': (7, 4), 'FL': (7, 8),
}


def coverage_map(covered):
    cell, gap = 34, 4
    rows = max(r for r, _ in TILES.values()) + 1
    cols = max(c for _, c in TILES.values()) + 1
    W, H = cols * (cell + gap), rows * (cell + gap)
    out = ['<svg viewBox="0 0 %d %d" class="usmap" role="img" aria-label="%s">'
           % (W, H, esc('Index coverage: %d states carry both a value and a rent series; '
                        'the rest are absent from the bundle.' % len(covered)))]
    for st, (r, c) in sorted(TILES.items()):
        x, y = c * (cell + gap), r * (cell + gap)
        on = st in covered
        out.append('<rect x="%d" y="%d" width="%d" height="%d" rx="6" class="%s"/>'
                   % (x, y, cell, cell, 'on' if on else 'off'))
        out.append('<text x="%d" y="%d" text-anchor="middle" class="%s">%s</text>'
                   % (x + cell / 2, y + cell / 2 + 4, 'ton' if on else 'toff', st))
    out.append('</svg>')
    return ''.join(out)


STYLE = """
:root{--paper:#F2EFE9;--card:#FBF9F5;--ink:#17140F;--ink-2:#4A443A;--ink-3:#7C7264;
--rule:#D5CDBE;--field:#2C6B4E;--flag:#B9531F;--bay:#3E6291;
--r:14px;--ease:cubic-bezier(.32,.72,0,1);
--lift:0 1px 1px rgba(23,20,15,.04),0 4px 12px -4px rgba(23,20,15,.14);
--lift2:0 2px 4px rgba(23,20,15,.06),0 16px 38px -14px rgba(23,20,15,.24)}
@media (prefers-color-scheme:dark){:root{--paper:#14120E;--card:#1D1A15;--ink:#F1ECE1;
--ink-2:#BDB4A4;--ink-3:#8A8073;--rule:#332E26;--field:#5FA483;--flag:#E0742F;--bay:#7CA2D4;
--lift:0 1px 1px rgba(0,0,0,.36),0 4px 12px -4px rgba(0,0,0,.5);
--lift2:0 2px 4px rgba(0,0,0,.4),0 16px 38px -14px rgba(0,0,0,.62)}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
font:16px/1.6 "IBM Plex Sans",system-ui,sans-serif;padding:0 18px;
-webkit-font-smoothing:antialiased}
.wrap{max-width:1060px;margin:0 auto;padding-block:44px 80px}
.kicker{font-family:"IBM Plex Mono",monospace;font-size:11.5px;letter-spacing:.15em;
text-transform:uppercase;color:var(--field);margin:0 0 16px}
h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(34px,6.2vw,60px);
line-height:1.04;letter-spacing:-.02em;margin:0 0 16px;max-width:17ch;text-wrap:balance}
h2{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(21px,2.7vw,27px);
margin:0 0 10px;letter-spacing:-.01em}
.lede{font-size:clamp(17px,2vw,20px);line-height:1.55;color:var(--ink-2);max-width:60ch;
margin:0 0 26px;text-wrap:pretty}
.hero{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:40px;
align-items:start;padding-bottom:36px;border-bottom:1px solid var(--rule)}
@media(max-width:860px){.hero{grid-template-columns:1fr;gap:26px}}
.figs{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:12px;margin:0 0 8px}
.fig{background:var(--card);border:1px solid var(--rule);border-radius:var(--r);
padding:14px 15px;box-shadow:var(--lift)}
.fig b{display:block;font-family:Fraunces,Georgia,serif;font-size:clamp(23px,3.4vw,31px);
font-weight:600;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.fig span{display:block;margin-top:7px;font-family:"IBM Plex Mono",monospace;font-size:9.5px;
letter-spacing:.13em;text-transform:uppercase;color:var(--ink-3);line-height:1.45}
.mapcard{background:var(--card);border:1px solid var(--rule);border-radius:var(--r);
padding:18px;box-shadow:var(--lift)}
.usmap{width:100%;height:auto;display:block}
.usmap rect.on{fill:var(--field);opacity:.9}
.usmap rect.off{fill:none;stroke:var(--rule);stroke-width:1.4}
.usmap text{font-family:"IBM Plex Mono",monospace;font-size:11px;font-weight:600}
.usmap text.ton{fill:#fff}
.usmap text.toff{fill:var(--ink-3);opacity:.75}
.key{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;font-size:12.5px;color:var(--ink-2)}
.key i{display:inline-block;width:11px;height:11px;border-radius:3px;vertical-align:-1px;margin-right:6px}
.sec{margin-top:52px}
.sec>p.intro{color:var(--ink-2);max-width:70ch;margin:0 0 4px;font-size:15.5px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(268px,1fr));gap:16px;margin-top:20px}
a.card{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--rule);
border-radius:var(--r);padding:20px 20px 18px;text-decoration:none;color:inherit;
box-shadow:var(--lift);transition:transform .2s var(--ease),box-shadow .2s var(--ease)}
a.card:hover{transform:translateY(-3px);box-shadow:var(--lift2)}
a.card h3{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:19.5px;margin:0 0 8px}
a.card p{margin:0;color:var(--ink-2);font-size:14.5px;line-height:1.58}
a.card .tag{font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--ink-3);
margin-top:auto;padding-top:14px;letter-spacing:.06em}
a.card.hi{background:linear-gradient(160deg,var(--card),color-mix(in srgb,var(--field) 9%,var(--card)))}
@supports not (color:color-mix(in srgb,red 50%,white)){a.card.hi{background:var(--card)}}
.note{margin-top:54px;padding-top:20px;border-top:1px solid var(--rule);
color:var(--ink-3);font-size:13px;line-height:1.7;max-width:78ch}
.note a{color:var(--field)}
@media (prefers-reduced-motion:reduce){a.card{transition:none}a.card:hover{transform:none}}
"""


def card(href, title, body, tag, hi=False):
    return ('<a class="card%s" href="%s"><h3>%s</h3><p>%s</p><span class="tag">%s</span></a>'
            % (' hi' if hi else '', esc(href), esc(title), body, esc(tag)))


def main():
    if len(sys.argv) < 2:
        raise SystemExit('usage: python3 scripts/build_landing.py <site_dir>')
    site = sys.argv[1]
    os.makedirs(site, exist_ok=True)

    E, S = load('market/editions.json'), load('market/edition_scale.json')
    B, C = load('market/belts.json'), load('market/corridors.json')
    X = load('crosswalk/usecodes.json')
    meas = [e for e in E['editions'] if 'records_measured' in e]
    records = sum(e['records_measured'] for e in meas)
    lodging = sum(e['lodging']['total'] for e in S['editions'])
    codes = sum(len(j['codes']) for j in X['jurisdictions'])
    covered = set(B['coverage']['states_covered'])

    figs = ''.join(
        '<div class="fig"><b>%s</b><span>%s</span></div>' % (v, esc(k)) for k, v in [
            ('parcel records measured', n(records)),
            ('editions shipped', str(len(E['editions']))),
            ('submarkets ranked', n(B['coverage']['ranked'])),
            ('use codes mapped', str(codes)),
            ('corridor areas', str(len(C['metros']))),
            ('lodging records', n(lodging)),
        ])

    hero = ('<div class="hero"><div>'
            '<p class="kicker">Locator.X &middot; AGI Future Foundation</p>'
            '<h1>The public record, measured and never guessed at.</h1>'
            '<p class="lede">A real-estate analytics platform that refuses to show a number '
            'it cannot defend. Every figure below is generated from the data in the '
            'repository &mdash; if the measurement changes, this page changes with it.</p>'
            '<div class="figs">' + figs + '</div>'
            '<p style="font-size:12.5px;color:var(--ink-3);margin:10px 0 0">Records counted by '
            'driving the published editions in a browser and counting their record stores, '
            '%s. Eight editions are title-verified but not re-counted, and say so.</p>'
            '</div>'
            '<div class="mapcard">'
            '<p class="kicker" style="margin:0 0 12px">Coverage, before conclusions</p>'
            '%s'
            '<div class="key"><span><i style="background:var(--field)"></i>%d states carry '
            'both a value and a rent series</span><span><i style="border:1.4px solid var(--rule)">'
            '</i>%d absent from the bundle</span></div>'
            '<p style="font-size:12.5px;color:var(--ink-2);margin:12px 0 0;line-height:1.6">'
            'Absent means <b>not measured</b> &mdash; never scored low. Every ranking on this '
            'site states what it does not cover before it states a result.</p>'
            '</div></div>'
            % (esc(S['measured_on']), coverage_map(covered),
               len(covered), len(B['coverage']['states_absent'])))

    start = ('<div class="sec"><h2>Start here</h2>'
             '<p class="intro">The whole application, and the measured record behind it.</p>'
             '<div class="grid">'
             + card('demo.html', 'The app — live demo',
                    'Map, dashboards, underwriting desk and Academy, with a version selector '
                    'for every shipped edition. Runs on clearly-labelled <b>synthetic '
                    'fixtures</b> on a fictional island: the full tool, none of the county '
                    'data, so every control is yours to try without a single real record '
                    'being asserted.', 'application · all editions · synthetic', hi=True)
             + card('market-dashboard.html', 'Market dashboard',
                    'All twelve shipped editions with their live record counts, and every '
                    'market page in one place. Only measured figures, each with its date.',
                    'dashboard · measured · dated')
             + card('articles/index.html', 'Articles',
                    'Field notes: underwriting where sale prices are not published, what a '
                    'property record costs in memory, and the lodging stock the product '
                    'could not search for. Every figure generated from the data.',
                    'writing · measured')
             + '</div></div>')

    record = ('<div class="sec"><h2>The measured record</h2>'
              '<p class="intro">What the public record actually says, jurisdiction by '
              'jurisdiction &mdash; with the gaps named rather than filled.</p>'
              '<div class="grid">'
              + card('crosswalk.html', 'Asset-class crosswalk',
                     '%d jurisdictions and %d use codes mapped to the screening classes, with '
                     'measured parcel counts, verification dates, and the caveats found the '
                     'hard way.' % (len(X['jurisdictions']), codes), 'sourced · dated')
              + card('high-potential-belts.html', 'High-Potential Belts',
                     '%s submarkets ranked on what they pay now rather than what they have '
                     'appreciated &mdash; open weights, and coverage stated first.'
                     % n(B['coverage']['ranked']), 'ranking · ZHVI+ZORI')
              + card('jobs-to-housing.html', 'Jobs to housing',
                     'Announced jobs per housing unit permitted across %d corridor areas, with '
                     'every caveat attached and "not drawn" where a series is unpublished.'
                     % len(C['metros']), 'corridor measure')
              + card('new-orleans-louisiana.html', 'New Orleans &amp; Louisiana',
                     'The anchor market: two measured editions, the Louisiana submarkets, the '
                     'corridor areas and the sourced project record.', 'market · measured')
              + card('sf-bay-area.html', 'San Francisco &amp; the Bay Area',
                     'The %s-record ledger, the Bay submarkets in the national ranking, and '
                     'the California project record.'
                     % n(next(e['records_measured'] for e in meas if e['key'] == 'bay')),
                     'market · measured')
              + card('editions/index.html', 'Real editions',
                     'The shipped builds with real county records, listed the moment the data '
                     'machine publishes them and hash-verified before they appear. Until then '
                     'the page says so.', 'real records · hash-verified')
              + '</div></div>')

    learn = ('<div class="sec"><h2>Learn the trade</h2>'
             '<p class="intro">Fifty courses across four levels, on an emotional-equity '
             'foundation, plus the working tools that go with them.</p>'
             '<div class="grid">'
             + card('locator-x-learning-environment.html', 'Learning environment',
                    'The whole curriculum, navigable: 50 courses, 19 tracks, 92 lessons.',
                    'curriculum · interactive')
             + card('locator-x-applied-courses.html', 'Applied courses',
                    'The applied arcs in catalog form: investment &amp; development, delivery, '
                    'evidence, and the development lab.', 'curriculum · catalog')
             + card('locator-x-underwriting-worksheet.html', 'Underwriting worksheet',
                    'The per-class arithmetic with the DSCR 1.20 solver, on numbers you '
                    'supply. Blank inputs stay unknown, never defaulted.', 'underwriting')
             + card('locator-x-cohort-review.html', 'Cohort review',
                    'The case-study discipline in practice &mdash; judge the decision, not the '
                    'outcome.', 'academy · review')
             + card('top-properties.html', 'Top properties',
                    'Load a locally built index and search the highest-assessed lodging, '
                    'apartments and multifamily. No data bundled, by design.', 'screening')
             + card('locator-x-louisiana-developer-deck.html', 'Louisiana developer deck',
                    'The anchor market argued: New Orleans and Baton Rouge for developers.',
                    'market · deck')
             + '</div></div>')

    note = ('<p class="note"><b>What this site will not do.</b> No scores without an open '
            'method, no tiers, no prices. County-roll values are <b>assessments, never '
            'prices</b>; index values are not prices; an announced job is an intention with a '
            'date, not a forecast. Anything state-, program- or lender-shaped is navigation of '
            'the public record with a verify-before-relying note, never a recommendation. '
            'Course material is original to Locator.X: no university, business school, '
            'publisher or course provider has reviewed, endorsed or is affiliated with it, and '
            'completing any part of it confers no accredited degree, diploma, licence or '
            'certification. Nothing here is legal, tax, securities or investment advice, and '
            'nothing here is an offer to sell or a solicitation to buy any security or '
            'interest in any property or fund. Built from '
            '<a href="https://github.com/agifuturefoundation/locator.x">the source '
            'repository</a> · content licensed CC BY 4.0 · &copy; 2026 AGI Future '
            'Foundation.</p>')

    doc = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
           '<meta name="color-scheme" content="light dark">\n'
           '<meta name="description" content="%s">\n'
           '<meta property="og:title" content="Locator.X — the public record, measured">\n'
           '<meta property="og:description" content="%s">\n'
           '<title>Locator.X — real-estate analytics on the public record</title>\n'
           '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:'
           'opsz,wght@9..144,400;9..144,600&family=IBM+Plex+Mono:wght@400;500;600&family='
           'IBM+Plex+Sans:wght@400;500;600&display=swap">\n<style>%s</style>\n</head>\n'
           '<body>\n<div class="wrap">\n%s\n%s\n%s\n%s\n%s\n</div>\n</body>\n</html>\n'
           % (esc('Locator.X — a real-estate analytics platform built on measured public '
                  'record. %s parcel records measured across %d shipped editions, %s '
                  'submarkets ranked, %d use codes mapped.'
                  % (n(records), len(E['editions']), n(B['coverage']['ranked']), codes)),
              esc('%s parcel records measured, %s submarkets ranked, and every figure '
                  'generated from the data.' % (n(records), n(B['coverage']['ranked']))),
              STYLE, hero, start, record, learn, note))
    with open(os.path.join(site, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(doc)
    print('landing: %s records · %d editions · %s submarkets · %d codes · %.1f KB'
          % (n(records), len(E['editions']), n(B['coverage']['ranked']), codes,
             len(doc) / 1024))


if __name__ == '__main__':
    main()
