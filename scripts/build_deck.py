#!/usr/bin/env python3
"""build_deck — render the three-page investor deck, with no typed figures.

content/investor/DECK.md carries {{placeholders}} and no digits. This resolves
them against scripts/deck_figures.py, which measures each one at build time, and
refuses to render if:

  · a placeholder has no measured figure (no fallback, no plausible substitute)
  · a measured figure is never used (a figure nobody quotes is a figure that
    quietly stops being true)
  · a DIGIT survives in the deck body outside a placeholder or the round-terms
    block, which is a management plan and is labelled as one

The last check is the one that matters. Every other document in this repository
resolves its numbers from measured data; a deck is the one that gets
screenshotted, forwarded and quoted back six months later, so a figure typed
into it is a figure nobody will ever re-check.

Usage:
  python3 scripts/build_deck.py <out.html>
  python3 scripts/build_deck.py --check     # verify without writing
"""
import html
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import deck_figures  # noqa: E402

SRC = os.path.join(ROOT, 'content', 'investor', 'DECK.md')

# The round-terms block states a planning RANGE, which is a management plan and
# not a measurement. It is the one place a literal figure is correct, and it is
# fenced so the digit check can see exactly where it is allowed.
# The round-terms block states a management PLAN and cites a rule by number.
# Neither is a measurement, so both are fenced explicitly rather than pattern-
# matched: an exemption you can see in the source is one a reviewer can audit.
PLAN_OPEN = '<!--plan-->'
PLAN_CLOSE = '<!--/plan-->'
# Page headings are structure, not claims: "# PAGE 2 — ..." numbers the page.
PAGE_HEAD = re.compile(r'^#\s+PAGE \d+\b')


def die(msg):
    raise SystemExit('DECK STOPPED — ' + msg)


def fmt(v):
    return '{:,}'.format(v) if isinstance(v, int) else str(v)


def resolve(text, figs):
    used = set()

    def sub(m):
        k = m.group(1)
        if k not in figs:
            die('the deck asks for {{%s}} and nothing measures it. A deck figure does not '
                'get a fallback — either it is measured or it is not claimed.' % k)
        used.add(k)
        return fmt(figs[k])

    out = re.sub(r'\{\{(\w+)\}\}', sub, text)
    return out, used


def check_no_typed_numbers(body):
    """A digit in the deck body must have come from a placeholder.

    The only exception is the fenced plan block, which carries the round terms:
    a planning range the platform owner chose, and the rule number of the
    offering exemption. Neither is a measurement and neither can be one."""
    inplan = False
    for i, line in enumerate(body.split('\n'), start=1):
        s = line.strip()
        if s == PLAN_OPEN:
            inplan = True
            continue
        if s == PLAN_CLOSE:
            inplan = False
            continue
        if inplan or s.startswith('<!--') or PAGE_HEAD.match(s):
            continue
        if re.search(r'\d', line):
            return i, line
    if inplan:
        die('the plan fence in DECK.md is opened and never closed — everything after it '
            'would silently escape the typed-figure check')
    return None


def render(figs):
    raw = open(SRC, encoding='utf-8').read()
    # Comments are notes to the author, not deck content: they may legitimately
    # mention {{placeholder}} as a word, and they never reach the page.
    raw = re.sub(r'<!--(?!/?plan-->).*?-->', '', raw, flags=re.S)

    # Before substitution: the SOURCE must carry no stray figures.
    stray = check_no_typed_numbers(re.sub(r'\{\{\w+\}\}', '', raw))
    if stray:
        i, line = stray
        die('content/investor/DECK.md line %d types a number instead of measuring it:\n'
            '  %s\nUse a {{placeholder}} and add the measurement to '
            'scripts/deck_figures.py.' % (i, line.strip()[:110]))

    body, used = resolve(raw, figs)
    body = '\n'.join(l for l in body.split('\n')
                     if l.strip() not in (PLAN_OPEN, PLAN_CLOSE))
    unused = sorted(set(figs) - used)
    return body, used, unused


PAGE_CSS = """
:root{--ink:#10151c;--ink2:#3d4a5c;--muted:#6b7a8f;--line:#dfe5ec;--bg:#fff;
      --panel:#f6f8fb;--accent:#1d6fd6;--good:#137a4b;--warn:#a8650b}
*{box-sizing:border-box}
body{margin:0;background:#eef1f5;color:var(--ink);
     font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial,sans-serif}
.page{background:var(--bg);max-width:860px;margin:22px auto;padding:44px 52px 38px;
      border-radius:6px;box-shadow:0 2px 18px rgba(16,21,28,.10);position:relative}
.pnum{position:absolute;top:22px;right:26px;font-size:11px;letter-spacing:.14em;
      text-transform:uppercase;color:var(--muted)}
h1{font-size:30px;line-height:1.2;margin:0 0 4px;letter-spacing:-.02em}
h2{font-size:19px;margin:30px 0 10px;letter-spacing:-.01em}
h3{font-size:14px;margin:22px 0 8px;letter-spacing:.03em;text-transform:uppercase;color:var(--muted)}
.tag{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);
     font-weight:700;margin:0 0 14px}
.lede{font-size:17px;line-height:1.5;color:var(--ink);font-weight:600;
      border-left:3px solid var(--accent);padding-left:16px;margin:16px 0 22px}
p{margin:0 0 12px;color:var(--ink2)}
ul{margin:0 0 14px;padding-left:20px;color:var(--ink2)}
li{margin-bottom:7px}
li strong,p strong,td strong{color:var(--ink)}
table{width:100%;border-collapse:collapse;font-size:14px;margin:6px 0 16px}
td,th{text-align:left;padding:8px 12px 8px 0;border-bottom:1px solid var(--line);
      vertical-align:top;color:var(--ink2)}
th{color:var(--ink);width:34%}
hr{display:none}
.fine{font-size:11.5px;line-height:1.6;color:var(--muted);margin-top:26px;
      padding-top:14px;border-top:1px solid var(--line)}
.stamp{display:inline-block;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
       color:#8a2b2b;border:1px solid #e2c3c3;background:#fdf6f6;border-radius:3px;
       padding:3px 9px;margin-bottom:18px;font-weight:700}
.cta{background:var(--panel);border:1px solid var(--line);border-radius:6px;
     padding:16px 18px;margin:18px 0 6px}
.cta p:last-child{margin-bottom:0}
@media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none;
     padding:34px 40px;page-break-after:always;border-radius:0}}
@media (max-width:700px){.page{padding:28px 20px;margin:10px}h1{font-size:24px}}
"""


def to_html(body, figs):
    pages = [p.strip() for p in body.split('\n---\n') if p.strip()]
    fine = ''
    if pages and pages[-1].startswith('*Private and confidential'):
        fine = pages.pop().strip('*').strip()

    def md(chunk):
        out, in_ul, in_tbl = [], False, False
        for line in chunk.split('\n'):
            s = line.strip()
            if s.startswith('<!--'):
                continue
            if not s:
                if in_ul:
                    out.append('</ul>'); in_ul = False
                if in_tbl:
                    out.append('</table>'); in_tbl = False
                continue
            if s.startswith('|'):
                cells = [c.strip() for c in s.strip('|').split('|')]
                if all(set(c) <= set('-: ') for c in cells):
                    continue
                if not in_tbl:
                    out.append('<table>'); in_tbl = True
                if len(cells) == 2 and cells[1]:
                    out.append('<tr><th>%s</th><td>%s</td></tr>' % (inl(cells[0]), inl(cells[1])))
                else:
                    out.append('<tr>%s</tr>' % ''.join('<td>%s</td>' % inl(c) for c in cells))
                continue
            if in_tbl:
                out.append('</table>'); in_tbl = False
            if s.startswith('- '):
                if not in_ul:
                    out.append('<ul>'); in_ul = True
                out.append('<li>%s</li>' % inl(s[2:]))
                continue
            if in_ul:
                out.append('</ul>'); in_ul = False
            if s.startswith('### '):
                out.append('<h3>%s</h3>' % inl(s[4:]))
            elif s.startswith('## '):
                out.append('<h2>%s</h2>' % inl(s[3:]))
            elif s.startswith('# '):
                t = s[2:]
                m = re.match(r'PAGE (\d+) — (.+)', t)
                if m:
                    out.append('<p class="tag">%s</p>' % inl(m.group(2)))
                else:
                    out.append('<h1>%s</h1>' % inl(t))
            elif s.startswith('**') and s.endswith('**') and len(s) > 60:
                out.append('<p class="lede">%s</p>' % inl(s.strip('*')))
            else:
                out.append('<p>%s</p>' % inl(s))
        if in_ul:
            out.append('</ul>')
        if in_tbl:
            out.append('</table>')
        return '\n'.join(out)

    def inl(s):
        s = html.escape(s, quote=False)
        s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
        s = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', s)
        return s

    secs = []
    for i, p in enumerate(pages, start=1):
        inner = md(p)
        stamp = ('<span class="stamp">Private &amp; confidential · not an offer</span>'
                 if i == 1 else '')
        if i == len(pages):
            inner = inner.replace('<h3>Next step</h3>', '<h3>Next step</h3><div class="cta">')
            inner += '</div>'
        secs.append('<section class="page"><span class="pnum">%d / %d</span>%s%s%s</section>'
                    % (i, len(pages), stamp, inner,
                       ('<p class="fine">%s</p>' % inl(fine)) if (i == len(pages) and fine) else ''))

    return ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>Locator.X by AGI Corp</title>'
            '<meta name="robots" content="noindex,nofollow">'
            '<style>%s</style></head><body>%s</body></html>'
            % (PAGE_CSS, ''.join(secs)))


def main():
    args = [a for a in sys.argv[1:]]
    check = '--check' in args
    out = next((a for a in args if not a.startswith('--')), None)
    if not check and not out:
        die('usage: build_deck.py <out.html>  |  build_deck.py --check')

    figs = deck_figures.figures()
    body, used, unused = render(figs)

    if unused:
        die('%d measured figure(s) are never quoted: %s\nA figure nobody quotes is a '
            'figure that quietly stops being true. Use it or stop measuring it.'
            % (len(unused), ', '.join(unused)))

    page = to_html(body, figs)
    if check:
        print('  · deck: %d placeholders, all measured · %d bytes rendered · no typed figures'
              % (len(used), len(page)))
        return 0
    open(out, 'w', encoding='utf-8').write(page)
    print('  · deck: %d measured figures · wrote %s (%.0f KB)'
          % (len(used), out, len(page) / 1024))
    return 0


if __name__ == '__main__':
    sys.exit(main())
