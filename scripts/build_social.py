#!/usr/bin/env python3
"""build_social — render social copy with no typed figures.

Same rule as the investor deck, for a sharper reason. A number in a public post
is the least correctable claim a company can make: it gets screenshotted,
quoted and forwarded, and it cannot be edited in anybody else's feed. So
content/social/*.md carries {{placeholders}} and no digits, resolved at build
time by scripts/deck_figures.py, which RUNS the measurement.

Checks, each of which fails the build:
  * a placeholder nothing measures
  * a digit surviving in the body outside a placeholder
  * a rendered post over the platform's character limit, which would be
    truncated mid-sentence in the feed - and the sentence it truncates is
    usually the qualifier
  * markdown emphasis, which these platforms do NOT render: **cannot** appears
    in the feed with its asterisks showing, on the one word that was meant to
    carry weight

Usage:
  python3 scripts/build_social.py <out-dir>
  python3 scripts/build_social.py --check
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import deck_figures  # noqa: E402

SRC = os.path.join(ROOT, 'content', 'social')
LIMITS = {'LINKEDIN': 3000}
HEAD = re.compile(r'^#\s')


def die(msg):
    raise SystemExit('SOCIAL STOPPED — ' + msg)


def fmt(v):
    return '{:,}'.format(v) if isinstance(v, int) else str(v)


def render_one(path, figs):
    raw = open(path, encoding='utf-8').read()
    raw = re.sub(r'<!--.*?-->', '', raw, flags=re.S)
    name = os.path.basename(path)[:-3]

    stray = [(i, l) for i, l in enumerate(re.sub(r'\{\{\w+\}\}', '', raw).split('\n'), 1)
             if re.search(r'\d', l) and not HEAD.match(l.strip())]
    if stray:
        i, l = stray[0]
        die('content/social/%s line %d types a number instead of measuring it:\n  %s'
            % (os.path.basename(path), i, l.strip()[:100]))

    used = set()

    def sub(m):
        k = m.group(1)
        if k not in figs:
            die('%s asks for {{%s}} and nothing measures it' % (name, k))
        used.add(k)
        return fmt(figs[k])

    body = re.sub(r'\{\{(\w+)\}\}', sub, raw)
    body = '\n'.join(l for l in body.split('\n') if not HEAD.match(l.strip())).strip()

    md = re.search(r'\*\*[^*]+\*\*|(?<!\w)_[^_]+_(?!\w)', body)
    if md:
        die('%s uses markdown emphasis (%r). LinkedIn and X render the asterisks '
            'literally, so the emphasis lands as punctuation on the one word meant to '
            'carry weight. Use capitals or rewrite the sentence.' % (name, md.group(0)[:40]))

    limit = LIMITS.get(name)
    if limit and len(body) > limit:
        die('%s renders to %d characters, over the %d-character limit. The feed would '
            'truncate it mid-sentence, and the sentence it truncates is usually the '
            'qualifier.' % (name, len(body), limit))
    return name, body, used, limit


def main():
    if not os.path.isdir(SRC):
        die('content/social/ is missing')
    figs = deck_figures.figures()
    srcs = sorted(f for f in os.listdir(SRC) if f.endswith('.md'))
    if not srcs:
        die('content/social/ holds no post source')
    out_dir = next((a for a in sys.argv[1:] if not a.startswith('--')), None)
    check = '--check' in sys.argv
    for f in srcs:
        name, body, used, limit = render_one(os.path.join(SRC, f), figs)
        head = body.split('\n')[0]
        print('  · %-9s %4d chars%s · %d measured figures · opens: "%s"'
              % (name, len(body), ('/%d' % limit) if limit else '', len(used),
                 head[:56] + ('…' if len(head) > 56 else '')))
        if not check:
            if not out_dir:
                die('usage: build_social.py <out-dir>  |  build_social.py --check')
            os.makedirs(out_dir, exist_ok=True)
            open(os.path.join(out_dir, name.lower() + '.txt'), 'w',
                 encoding='utf-8').write(body + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
