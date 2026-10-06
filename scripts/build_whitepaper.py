#!/usr/bin/env python3
"""build_whitepaper — render the product whitepaper, with no typed figures.

content/whitepaper/WHITEPAPER.md carries {{placeholders}} and no digits, same
discipline as scripts/build_deck.py. This module reuses scripts/deck_figures.py
for every number — it does not remeasure anything deck_figures.py already
measures — and adds two charts rendered as inline SVG directly from those same
measured integers (no chart library, no separate data path that could drift
from the figure it draws).

Deliberately separate from build_deck.py: this document describes the
PLATFORM only, never the company, the entities, or any investor ask — mixing
the two is exactly what CLAUDE.md's "never mix mission, software, property,
robotics and investor economics" rule exists to prevent. The source carries
its own disclaimer saying so.

Usage:
  python3 scripts/build_whitepaper.py <out.html>
  python3 scripts/build_whitepaper.py --check     # verify without writing
"""
import html
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import deck_figures  # noqa: E402

SRC = os.path.join(ROOT, 'content', 'whitepaper', 'WHITEPAPER.md')

# These two placeholders resolve to rendered SVG, not a measured number — kept
# in a separate set so the "every figure must be a real measurement" check
# below does not try to format an SVG string as one.
CHART_KEYS = {'chart_coverage', 'chart_academy'}


def die(msg):
    raise SystemExit('WHITEPAPER STOPPED — ' + msg)


def fmt(v):
    return '{:,}'.format(v) if isinstance(v, int) else str(v)


def check_no_typed_numbers(body):
    """A digit in the whitepaper body must have come from a placeholder.

    Unlike build_deck.py, this file has no page-numbering headings to exempt
    — every heading here is plain prose, so a digit in one is checked exactly
    like a digit anywhere else: a heading is the most visible place a typed
    figure could hide."""
    for i, line in enumerate(body.split('\n'), start=1):
        s = line.strip()
        if s.startswith('<!--'):
            continue
        if re.search(r'\d', line):
            return i, line
    return None


# ---------------------------------------------------------------------------
# Charts — plain inline SVG, direct-labeled horizontal bars, the dataviz
# skill's validated default categorical palette (references/palette.md),
# light+dark declared per its documented pattern (media query AND
# data-theme, so a viewer's explicit toggle always wins over the OS setting).
# ---------------------------------------------------------------------------
CAT_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']
CAT_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181']


def bar_chart(chart_id, title, rows):
    """rows: list of (label, value). Horizontal bars, thin marks, rounded
    data-ends, direct-labeled (no legend needed — each bar names itself)."""
    maxv = max(v for _, v in rows) or 1
    bar_h, gap, label_w, track_w, pad = 22, 14, 190, 420, 10
    row_h = bar_h + gap
    height = row_h * len(rows) - gap + pad * 2
    width = label_w + track_w + 70

    bars = []
    for i, (label, v) in enumerate(rows):
        y = pad + i * row_h
        w = max(2, round(track_w * v / maxv))
        color_l, color_d = CAT_LIGHT[i % len(CAT_LIGHT)], CAT_DARK[i % len(CAT_DARK)]
        bars.append(
            '<text x="%d" y="%d" class="viz-label" dominant-baseline="middle">%s</text>'
            '<rect x="%d" y="%d" width="%d" height="%d" rx="4" ry="4" '
            'fill="var(--%s-c%d)"/>'
            '<text x="%d" y="%d" class="viz-value" dominant-baseline="middle">%s</text>'
            % (label_w - 10, y + bar_h / 2, html.escape(label),
               label_w, y, w, bar_h, chart_id, i,
               label_w + w + 8, y + bar_h / 2, '{:,}'.format(v))
        )
    css_vars_light = ' '.join(
        '--%s-c%d: %s;' % (chart_id, i, c) for i, c in enumerate(CAT_LIGHT))
    css_vars_dark = ' '.join(
        '--%s-c%d: %s;' % (chart_id, i, c) for i, c in enumerate(CAT_DARK))
    return (
        '<figure class="viz-root viz-%s">'
        '<style>'
        '.viz-%s{ --viz-surface:#fcfcfb; --viz-ink:#0b0b0b; --viz-muted:#898781; %s }'
        '@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .viz-%s{ '
        '--viz-surface:#1a1a19; --viz-ink:#fff; --viz-muted:#898781; %s } }'
        ':root[data-theme="dark"] .viz-%s{ --viz-surface:#1a1a19; --viz-ink:#fff; '
        '--viz-muted:#898781; %s }'
        '</style>'
        '<figcaption class="viz-title">%s</figcaption>'
        '<svg viewBox="0 0 %d %d" width="100%%" role="img" '
        'aria-label="%s" style="background:var(--viz-surface);border-radius:8px">'
        '<style>.viz-label{font:600 13px system-ui,sans-serif;fill:var(--viz-ink);text-anchor:end}'
        '.viz-value{font:600 13px system-ui,sans-serif;fill:var(--viz-muted)}</style>'
        '%s</svg></figure>'
        % (chart_id, chart_id, css_vars_light, chart_id, css_vars_dark, chart_id,
           css_vars_dark, html.escape(title), width, height, html.escape(title),
           ''.join(bars))
    )


def charts(f):
    return {
        'chart_coverage': bar_chart('cov', 'Coverage status, by row', [
            ('Shipped', f['coverage_shipped']),
            ('Pulled', f['coverage_pulled']),
            ('Named', f['coverage_named']),
            ('Blocked', f['coverage_blocked']),
            ('No public record', f['coverage_norecord']),
        ]),
        'chart_academy': bar_chart('aca', 'The Academy, measured', [
            ('Curriculum items', f['curriculum_items']),
            ('Tracks', f['tracks']),
            ('Lessons', f['lessons']),
        ]),
    }


def resolve(text, figs):
    used = set()

    def sub(m):
        k = m.group(1)
        if k not in figs:
            die('the whitepaper asks for {{%s}} and nothing measures it. A figure does not '
                'get a fallback — either it is measured or it is not claimed.' % k)
        used.add(k)
        return fmt(figs[k])

    out = re.sub(r'\{\{(\w+)\}\}', sub, text)
    return out, used


def render(figs):
    raw = open(SRC, encoding='utf-8').read()
    raw = re.sub(r'<!--.*?-->', '', raw, flags=re.S)

    stray = check_no_typed_numbers(re.sub(r'\{\{\w+\}\}', '', raw))
    if stray:
        i, line = stray
        die('content/whitepaper/WHITEPAPER.md line %d types a number instead of measuring '
            'it:\n  %s\nUse a {{placeholder}} and add the measurement to '
            'scripts/deck_figures.py.' % (i, line.strip()[:110]))

    all_figs = dict(figs)
    all_figs.update(charts(figs))
    body, used = resolve(raw, all_figs)

    # resolve() only confirms every PRESENT placeholder resolved - it says
    # nothing if a chart placeholder itself went missing from the source
    # (the body-level '<svg' in page check in main() used to accept this:
    # one surviving chart satisfies "at least one <svg exists" even if the
    # other chart's placeholder was deleted). Check the exact set here,
    # where "which charts are expected" is still known.
    missing_charts = CHART_KEYS - used
    if missing_charts:
        die('the whitepaper is missing its chart(s): %s — a {{chart_*}} placeholder was '
            'removed from the source. Either restore it or remove the chart from '
            'charts() too; a page with one of two charts ships silently incomplete.'
            % ', '.join(sorted(missing_charts)))

    return body, used - CHART_KEYS


PAGE_CSS = """
:root{--ink:#10151c;--ink2:#3d4a5c;--muted:#6b7a8f;--line:#dfe5ec;--bg:#fff;
      --panel:#f6f8fb;--accent:#1d6fd6}
*{box-sizing:border-box}
body{margin:0;background:#eef1f5;color:var(--ink);
     font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial,sans-serif}
.page{background:var(--bg);max-width:860px;margin:22px auto;padding:44px 52px 38px;
      border-radius:6px;box-shadow:0 2px 18px rgba(16,21,28,.10)}
h1{font-size:30px;line-height:1.2;margin:0 0 18px;letter-spacing:-.02em}
h2{font-size:22px;margin:38px 0 14px;letter-spacing:-.01em;padding-top:10px;border-top:1px solid var(--line)}
h1+h2,h1~h2:first-of-type{border-top:0}
p{margin:0 0 14px;color:var(--ink2)}
ul{margin:0 0 16px;padding-left:20px;color:var(--ink2)}
li{margin-bottom:8px}
li strong,p strong{color:var(--ink)}
.lede{font-size:18px;line-height:1.55;color:var(--ink);font-weight:600;
      border-left:3px solid var(--accent);padding-left:16px;margin:14px 0 20px}
figure.viz-root{margin:18px 0 20px}
.viz-title{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.fine{font-size:11.5px;line-height:1.6;color:var(--muted);margin-top:30px;
      padding-top:14px;border-top:1px solid var(--line)}
@media (max-width:700px){.page{padding:28px 20px;margin:10px}h1{font-size:24px}}
"""


def to_html(body):
    sections = [s.strip() for s in body.split('\n---\n') if s.strip()]
    fine = ''
    if sections and sections[-1].startswith('*This whitepaper'):
        fine = sections.pop().strip('*').strip()

    def inl(s):
        s = html.escape(s, quote=False)
        s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
        s = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', s)
        return s

    def md(chunk):
        out, in_ul = [], False
        for line in chunk.split('\n'):
            s = line.strip()
            if not s:
                if in_ul:
                    out.append('</ul>'); in_ul = False
                continue
            if s.startswith('- '):
                if not in_ul:
                    out.append('<ul>'); in_ul = True
                out.append('<li>%s</li>' % inl(s[2:]))
                continue
            if in_ul:
                out.append('</ul>'); in_ul = False
            if s.startswith('## '):
                out.append('<h2>%s</h2>' % inl(s[3:]))
            elif s.startswith('# '):
                out.append('<h1>%s</h1>' % inl(s[2:]))
            elif s.startswith('**') and s.endswith('**') and len(s) > 60:
                out.append('<p class="lede">%s</p>' % inl(s.strip('*')))
            elif s.startswith('<svg') or s.startswith('<figure'):
                out.append(s)
            else:
                out.append('<p>%s</p>' % inl(s))
        if in_ul:
            out.append('</ul>')
        return '\n'.join(out)

    inner = '\n'.join(md(s) for s in sections)
    fine_html = '<p class="fine">%s</p>' % html.escape(fine) if fine else ''
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>Locator.X — platform whitepaper</title>'
            '<style>%s</style></head><body><div class="page">%s%s</div></body></html>'
            % (PAGE_CSS, inner, fine_html))


def main():
    args = sys.argv[1:]
    check = '--check' in args
    out = next((a for a in args if not a.startswith('--')), None)
    if not check and not out:
        die('usage: build_whitepaper.py <out.html>  |  build_whitepaper.py --check')

    figs = deck_figures.figures()
    body, used = render(figs)

    page = to_html(body)
    # render() already confirmed both chart placeholders resolved in the
    # SOURCE. This only catches a <figure> tag being dropped or duplicated
    # outright during to_html's own markdown pass — NOT a chart surviving
    # with its opening tag intact but its later lines scattered into stray
    # <p> elements by a bug upstream (verified: an embedded newline inside
    # a chart's own CSS once did exactly that, and this count-based check
    # does not catch it — the Playwright screenshot pass that originally
    # caught it is still the real guard against that failure class).
    n_figures = page.count('<figure')
    if n_figures != len(CHART_KEYS):
        die('the rendered page carries %d chart(s), expected %d — a chart tag was lost or '
            'duplicated during HTML rendering.' % (n_figures, len(CHART_KEYS)))

    if check:
        print('  · whitepaper: %d placeholders, %d charts, %d bytes rendered'
              % (len(used), page.count('<figure'), len(page)))
        return 0
    open(out, 'w', encoding='utf-8').write(page)
    print('  · whitepaper: %d measured figures, %d charts · wrote %s (%.0f KB)'
          % (len(used), page.count('<figure'), out, len(page) / 1024))
    return 0


if __name__ == '__main__':
    sys.exit(main())
