"""build_editions_index — the site's real-editions section, from the companion repo.

Run by deploy-pages after the rest of the site is staged. Clones the public
Locator.X-editions companion repo (published from the data machine by
scripts/publish_editions.sh), verifies every file against the manifest's
sha256 before it is allowed onto the site, copies the verified editions into
<site>/editions/, and generates <site>/editions/index.html listing exactly
what is live — title, size, build date, source commit.

Honesty rules built in:
  * No companion repo, or an empty one, is NOT an error — the page then says
    plainly that no real editions are published yet and what publishes them.
    The link from the landing page always resolves; it never lies.
  * A file whose hash does not match its manifest row is REFUSED (skipped and
    named on the page), because serving a corrupted edition silently would be
    worse than serving none.

Usage: python3 scripts/build_editions_index.py <site_dir>
       EDITIONS_SRC=<local dir> overrides the clone (used by tests).
"""
import hashlib
import html
import json
import os
import shutil
import subprocess
import sys
import tempfile

REPO = os.environ.get('EDITIONS_REPO_URL',
                      'https://github.com/AGIFutureFoundation/Locator.X-editions')


def esc(s):
    return html.escape(str(s), quote=True)


STYLE = (
    ':root{--paper:#F2EFE9;--card:#FBF9F5;--ink:#17140F;--ink-2:#4A443A;--ink-3:#7C7264;'
    '--rule:#D5CDBE;--field:#2C6B4E;--flag:#B9531F;'
    '--shadow:0 1px 2px rgba(23,20,15,.05),0 10px 26px -16px rgba(23,20,15,.22)}'
    '@media (prefers-color-scheme:dark){:root{--paper:#14120E;--card:#1D1A15;--ink:#F1ECE1;'
    '--ink-2:#BDB4A4;--ink-3:#8A8073;--rule:#332E26;--field:#5FA483;--flag:#E0742F;'
    '--shadow:0 1px 2px rgba(0,0,0,.4),0 10px 26px -16px rgba(0,0,0,.6)}}'
    '*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);'
    'font:16px/1.55 "IBM Plex Sans",system-ui,sans-serif;padding:0 16px}'
    '.wrap{max-width:860px;margin:0 auto;padding-block:48px 72px}'
    'h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(26px,5vw,38px);margin:0 0 6px}'
    '.kicker{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.14em;'
    'text-transform:uppercase;color:var(--field);margin:0 0 14px}'
    '.sub{color:var(--ink-2);max-width:64ch;margin:0 0 8px}'
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin-top:30px}'
    'a.card{display:block;background:var(--card);border:1px solid var(--rule);border-radius:10px;'
    'padding:18px;text-decoration:none;color:inherit;box-shadow:var(--shadow)}'
    'a.card h2{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:19px;margin:0 0 6px}'
    'a.card p{margin:0;color:var(--ink-2);font-size:14px}'
    'a.card .tag{font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--ink-3);'
    'display:block;margin-top:12px}'
    '.empty{background:var(--card);border:1px dashed var(--rule);border-radius:10px;'
    'padding:22px;margin-top:30px;color:var(--ink-2);max-width:70ch}'
    '.warn{color:var(--flag)}'
    '.note{margin-top:36px;padding-top:16px;border-top:1px solid var(--rule);'
    'color:var(--ink-3);font-size:13.5px;max-width:70ch}'
    '.back{display:inline-block;margin-top:28px;color:var(--field);font-size:14px}')

HEAD = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        '<meta name="color-scheme" content="light dark">\n'
        '<title>Locator.X Real Editions</title>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">\n'
        '<style>' + STYLE + '</style>\n</head>\n<body>\n<div class="wrap">\n'
        '<p class="kicker">Locator.X · real editions</p>\n<h1>The shipped editions</h1>\n')

FOOT = ('\n<p class="note">Values shown inside every edition are county-roll assessments, never '
        'prices; each edition names its record sources on its own Sources panel. Built editions '
        'are published from the data machine by <code>scripts/publish_editions.sh</code> and '
        'verified against their manifest hashes before this page lists them.</p>\n'
        '<a class="back" href="../index.html">&larr; All companion pages</a>\n'
        '</div>\n</body>\n</html>\n')


def main():
    if len(sys.argv) < 2:
        raise SystemExit('usage: python3 scripts/build_editions_index.py <site_dir>')
    site = sys.argv[1]
    ed_dir = os.path.join(site, 'editions')
    os.makedirs(ed_dir, exist_ok=True)

    src = os.environ.get('EDITIONS_SRC')
    tmp = None
    if not src:
        tmp = tempfile.mkdtemp(prefix='editions_')
        r = subprocess.run(['git', 'clone', '--depth', '1', REPO, tmp],
                           capture_output=True, text=True)
        src = tmp if r.returncode == 0 else None

    manifest = None
    if src and os.path.exists(os.path.join(src, 'editions.json')):
        manifest = json.load(open(os.path.join(src, 'editions.json'), encoding='utf-8'))

    if not manifest or not manifest.get('editions'):
        page = (HEAD
                + '<p class="sub">The full editions — the map, the underwriting engine and the '
                'packed county records for their real markets.</p>'
                '<div class="empty"><b>No real editions are published yet.</b> They build on '
                'the machine that holds the data tree and go live with one command there — '
                '<code>bash scripts/publish_editions.sh</code> — which publishes them to the '
                'companion repository this page reads. Nothing is faked in the meantime: until '
                'that publish happens, this page says so instead.</div>' + FOOT)
        open(os.path.join(ed_dir, 'index.html'), 'w', encoding='utf-8').write(page)
        print('editions: none published — wrote honest empty state')
        return

    cards, refused = [], []
    for row in manifest['editions']:
        path = os.path.join(src, row['file'])
        ok = os.path.exists(path)
        if ok:
            digest = hashlib.sha256(open(path, 'rb').read()).hexdigest()
            ok = digest == row['sha256']
        if not ok:
            refused.append(row)
            print('  ! REFUSED %s — missing or hash mismatch against manifest' % row['file'])
            continue
        shutil.copy(path, os.path.join(ed_dir, row['file']))
        cards.append(
            '<a class="card" href="' + esc(row['file']) + '">'
            '<h2>' + esc(row['title']) + '</h2>'
            '<p>' + esc('%.2f MB · built %s' % (row['bytes'] / 1048576, row['built'])) + '</p>'
            '<span class="tag">' + esc(row['key']) + ' · Locator.X@'
            + esc(row['source_commit']) + '</span></a>')
        print('  + %s verified and staged' % row['file'])

    body = ('<p class="sub">The full editions — the map, the underwriting engine and the packed '
            'county records for their real markets. Published from the data machine on '
            + esc(str(manifest.get('generated', ''))[:10]) + '.</p>'
            '<div class="grid">' + ''.join(cards) + '</div>')
    if refused:
        body += ('<div class="empty warn"><b>Refused, not hidden:</b> '
                 + esc(', '.join(r['file'] for r in refused))
                 + ' failed manifest verification and were left off rather than served corrupt.</div>')
    open(os.path.join(ed_dir, 'index.html'), 'w', encoding='utf-8').write(HEAD + body + FOOT)
    print('editions: %d live, %d refused' % (len(cards), len(refused)))
    if tmp:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
