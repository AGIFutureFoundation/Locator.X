"""build_crosswalk_page — the real record layer, rendered for the public site.

Generates crosswalk.html from crosswalk/usecodes.json: every jurisdiction the
platform has actually measured or transcribed, every use-code mapping with its
source and date, the measured parcel counts, the caveats found the hard way,
and the declared ranking fields. Nothing on the page is invented here — it is
a straight rendering of the repository's sourced data file, and rows the
crosswalk marks unverified are flagged unverified on the page too.

Run by .github/workflows/deploy-pages.yml at deploy time; output is generated,
never committed. Needs nothing but the standard library.

Usage: python3 scripts/build_crosswalk_page.py <output.html>
"""
import html
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def esc(s):
    return html.escape(str(s), quote=True)


def main():
    if len(sys.argv) < 2:
        raise SystemExit('usage: python3 scripts/build_crosswalk_page.py <output.html>')
    d = json.load(open(os.path.join(ROOT, 'crosswalk', 'usecodes.json'), encoding='utf-8'))
    juris = d['jurisdictions']
    classes = d['classes']
    n_codes = sum(len(j['codes']) for j in juris)
    n_measured = sum(1 for j in juris for c in j['codes'] if c.get('verified'))
    n_parcels = sum(c.get('measured_count') or 0 for j in juris for c in j['codes'])

    cards = []
    for j in juris:
        rows = []
        for c in j['codes']:
            status = ('<span class="ok">measured ' + esc(c['verified']) + '</span>'
                      if c.get('verified') else '<span class="warn">transcribed — unverified</span>')
            count = ('{:,}'.format(c['measured_count']) if c.get('measured_count') is not None else '—')
            label = (' <span class="lbl">' + esc(c['label']) + '</span>') if c.get('label') else ''
            rows.append('<tr><td class="code">' + esc(c['code']) + label + '</td>'
                        '<td>' + esc(c['class']) + '</td>'
                        '<td class="num">' + count + '</td>'
                        '<td>' + status + '</td></tr>')
        caveats = ''.join('<li>' + esc(x) + '</li>' for x in j.get('caveats', []))
        extras = []
        if j.get('value_field'):
            extras.append('<b>Value field:</b> <code>' + esc(j['value_field'])
                          + '</code> — an assessment, never a price')
        if j.get('ranking_note'):
            extras.append(esc(j['ranking_note']))
        cards.append(
            '<section class="j">'
            '<h2>' + esc(j['name']) + '</h2>'
            '<p class="meta">Use-class field <code>' + esc(j['field']) + '</code> · source: '
            + esc(j['source']) + '</p>'
            '<table><tr><th>Code</th><th>Class</th><th class="num">Measured parcels</th><th>Status</th></tr>'
            + ''.join(rows) + '</table>'
            + (('<p class="xtr">' + ' · '.join(extras) + '</p>') if extras else '')
            + (('<details><summary>Caveats found the hard way ('
                + str(len(j.get('caveats', []))) + ')</summary><ul>' + caveats + '</ul></details>')
               if caveats else '')
            + '</section>')

    legend = ''.join('<li><b>' + esc(k) + '</b> — ' + esc(v) + '</li>' for k, v in classes.items())
    page = (
        '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        '<meta name="color-scheme" content="light dark">\n'
        '<meta name="description" content="The Locator.X asset-class crosswalk: measured use-code '
        'vocabularies per jurisdiction, every row with its source and date.">\n'
        '<title>Locator.X Crosswalk</title>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">\n'
        '<style>\n'
        ':root{--paper:#F2EFE9;--card:#FBF9F5;--ink:#17140F;--ink-2:#4A443A;--ink-3:#7C7264;'
        '--rule:#D5CDBE;--field:#2C6B4E;--flag:#B9531F;'
        '--shadow:0 1px 2px rgba(23,20,15,.05),0 10px 26px -16px rgba(23,20,15,.22)}\n'
        '@media (prefers-color-scheme:dark){:root{--paper:#14120E;--card:#1D1A15;--ink:#F1ECE1;'
        '--ink-2:#BDB4A4;--ink-3:#8A8073;--rule:#332E26;--field:#5FA483;--flag:#E0742F;'
        '--shadow:0 1px 2px rgba(0,0,0,.4),0 10px 26px -16px rgba(0,0,0,.6)}}\n'
        '*{box-sizing:border-box}'
        'body{margin:0;background:var(--paper);color:var(--ink);'
        'font:15.5px/1.55 "IBM Plex Sans",system-ui,sans-serif;padding:0 16px}'
        '.wrap{max-width:920px;margin:0 auto;padding-block:48px 72px}'
        'h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(26px,5vw,38px);margin:0 0 6px}'
        '.kicker{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.14em;'
        'text-transform:uppercase;color:var(--field);margin:0 0 14px}'
        '.sub{color:var(--ink-2);max-width:72ch;margin:0 0 8px}'
        '.stats{font-family:"IBM Plex Mono",monospace;font-size:13px;color:var(--ink-3);margin:14px 0 0}'
        '.legend{background:var(--card);border:1px solid var(--rule);border-radius:10px;'
        'padding:14px 18px;margin:26px 0 0;box-shadow:var(--shadow)}'
        '.legend ul{margin:6px 0 0;padding-left:18px}.legend li{margin:3px 0;font-size:14px;color:var(--ink-2)}'
        '.legend p{margin:0;font-family:"IBM Plex Mono",monospace;font-size:12px;'
        'letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}'
        '.j{background:var(--card);border:1px solid var(--rule);border-radius:10px;'
        'padding:18px 20px;margin-top:22px;box-shadow:var(--shadow)}'
        '.j h2{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:21px;margin:0 0 4px}'
        '.meta{color:var(--ink-3);font-size:13px;margin:0 0 10px}'
        '.j code{font-family:"IBM Plex Mono",monospace;font-size:12.5px;background:var(--paper);'
        'padding:1px 5px;border-radius:4px}'
        '.j .overx{overflow-x:auto}'
        'table{border-collapse:collapse;width:100%;font-size:13.5px}'
        'th{text-align:left;font-family:"IBM Plex Mono",monospace;font-size:11px;'
        'letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);'
        'border-bottom:1px solid var(--rule);padding:4px 10px 6px 0}'
        'td{border-bottom:1px solid var(--rule);padding:6px 10px 6px 0;vertical-align:top}'
        'td.code{font-family:"IBM Plex Mono",monospace;font-size:12.5px;white-space:nowrap}'
        'td .lbl{font-family:"IBM Plex Sans",system-ui,sans-serif;color:var(--ink-3);'
        'font-size:12.5px;white-space:normal}'
        '.num{text-align:right;font-family:"IBM Plex Mono",monospace}'
        'th.num{text-align:right}'
        '.ok{color:var(--field);font-size:12.5px}.warn{color:var(--flag);font-size:12.5px}'
        '.xtr{font-size:13px;color:var(--ink-2);margin:10px 0 0}'
        'details{margin-top:10px;font-size:13.5px}summary{cursor:pointer;color:var(--ink-3)}'
        'details ul{margin:8px 0 0;padding-left:18px}details li{margin:4px 0;color:var(--ink-2)}'
        '.back{display:inline-block;margin-top:34px;color:var(--field);font-size:14px}\n'
        '</style>\n</head>\n<body>\n<div class="wrap">\n'
        '<p class="kicker">Locator.X · the real record layer</p>\n'
        '<h1>The asset-class crosswalk</h1>\n'
        '<p class="sub">' + esc(d['about']) + '</p>\n'
        '<p class="stats">' + str(len(juris)) + ' jurisdictions · ' + str(n_codes)
        + ' code mappings · ' + str(n_measured) + ' measured, ' + str(n_codes - n_measured)
        + ' transcribed-unverified (flagged) · ' + '{:,}'.format(n_parcels)
        + ' parcels behind the measured counts</p>\n'
        '<div class="legend"><p>The screening classes</p><ul>' + legend + '</ul></div>\n'
        + '\n'.join(cards)
        + '\n<a class="back" href="index.html">&larr; All companion pages</a>\n'
        '</div>\n</body>\n</html>\n')
    with open(sys.argv[1], 'w', encoding='utf-8') as f:
        f.write(page)
    print('crosswalk page: %d jurisdictions, %d codes (%d measured), %s parcels — wrote %s'
          % (len(juris), n_codes, n_measured, '{:,}'.format(n_parcels), sys.argv[1]))


if __name__ == '__main__':
    main()
