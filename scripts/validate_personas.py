#!/usr/bin/env python3
"""validate_personas — the hive speaks only the boundaries AGENTS.md wrote.

content/agents/personas.json gives each of the six agents in docs/company/AGENTS.md
a voice (browser speechSynthesis rate and pitch), a tone, an opening line that
states its boundary, and a list of things it will not say; plus a seventh persona,
the app-wide guide (src/assistant.js), which reads help text that already exists.
A persona is a way of reading an agent's output aloud. It is not a capability, and
the danger of a voice is that it drifts into a salesman: a brisk Scout that starts
calling a property "a good deal", a Diligence persona that states a C-graded record
as certain. So the file is held to AGENTS.md mechanically:

  1. the seven ids are exactly the six agents plus `guide`, in that order
  2. every agent persona's `name`, `scope` and `boundary` are the AGENTS.md table
     cells word for word (bold markers and whitespace aside), and `status` is the
     table's Status column — a persona cannot be more built than its agent
  3. the guide's status is `ships` only because the module it names exists
  4. the three binding rules (and the standing one) are quoted from AGENTS.md
  5. no `role`, `tone` or `opening_line` contains a banned phrase — the vocabulary
     of a pitch: good deal, you should, guaranteed, motivated, will appreciate,
     buy now, offer now
  6. `never_says` has three to five phrases; `traits` has three; `tone` is two
     sentences and `opening_line` and `role` are one
  7. only the guide carries an external preset voice id (used for pre-rendered
     narration outside the app); the app itself uses the browser engine for all
     seven, with rate and pitch inside 0.8–1.2
  8. src/personas.js carries an embedded copy of the JSON, and that copy is equal
     to the file — one source of truth, checked, not two maintained by hand

Usage: python3 scripts/validate_personas.py           fail on any of the above
       python3 scripts/validate_personas.py --sync    rewrite the embedded copy in
                                                     src/personas.js from the JSON,
                                                     then validate
"""
import json
import os
import re
import sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
JSON_PATH = R + 'content/agents/personas.json'
AGENTS_MD = R + 'docs/company/AGENTS.md'
JS_PATH = R + 'src/personas.js'

IDS = ['scout', 'diligence', 'underwriting', 'acquisitions', 'development', 'portfolio', 'guide']
STATUSES = ('ships', 'partial', 'not built')
BANNED = ['good deal', 'you should', 'guaranteed', 'motivated', 'will appreciate', 'buy now', 'offer now']
ENGINE = 'browser-speechSynthesis'
RATE_LO, RATE_HI = 0.8, 1.2
BLOCK_RE = re.compile(r'/\*@personas\.json\*/(.*?)/\*@end personas\.json\*/', re.S)

problems = []


def bad(msg):
    problems.append(msg)


def norm(s):
    """Words only: drop markdown bold, collapse whitespace."""
    return re.sub(r'\s+', ' ', str(s).replace('**', '')).strip()


def sentences(s):
    return [x for x in re.split(r'(?<=[.!?])\s+', str(s).strip()) if x]


def agent_rows(md):
    """The six-agent table: name -> (scope, boundary, status)."""
    rows = {}
    for line in md.splitlines():
        if not line.startswith('| **'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) != 5:
            continue
        m = re.match(r'\*\*(ships|partial|not built)\*\*', cells[4])
        if not m:
            bad('AGENTS.md row %r has no bold status at the head of its Status cell' % cells[0])
            continue
        rows[norm(cells[0])] = (norm(cells[1]), norm(cells[2]), m.group(1))
    return rows


def main():
    sync = '--sync' in sys.argv
    try:
        data = json.load(open(JSON_PATH, encoding='utf-8'))
    except Exception as e:  # noqa: BLE001
        print('personas: cannot load %s — %s' % (JSON_PATH, e))
        return 1
    md = open(AGENTS_MD, encoding='utf-8').read()
    md_norm = norm(md)
    rows = agent_rows(md)
    if len(rows) != 6:
        bad('AGENTS.md table parsed to %d agent rows, expected 6' % len(rows))

    for k in ('_about', 'reviewed', 'rules', 'always', 'personas'):
        if k not in data:
            bad('personas.json lacks %r' % k)
    if not re.match(r'^\d{4}-\d{2}$', str(data.get('reviewed', ''))):
        bad('reviewed must be YYYY-MM, got %r' % data.get('reviewed'))

    rules = data.get('rules') or []
    if len(rules) != 3:
        bad('rules: expected the three binding rules, got %d' % len(rules))
    for i, r in enumerate(rules):
        if norm(r) not in md_norm:
            bad('rules[%d] is not a quotation from AGENTS.md: %r' % (i, r[:60]))
    if data.get('always') and norm(data['always']) not in md_norm:
        bad('always: not a quotation from AGENTS.md')

    personas = data.get('personas') or []
    ids = [p.get('id') for p in personas]
    if ids != IDS:
        bad('persona ids must be exactly %s in that order, got %s' % (IDS, ids))

    counts = {s: 0 for s in STATUSES}
    n_guide = 0
    for p in personas:
        pid = p.get('id', '?')
        tag = 'persona %r' % pid
        for k in ('name', 'role', 'scope', 'boundary', 'status', 'personality', 'voice', 'opening_line', 'never_says'):
            if k not in p:
                bad('%s lacks %r' % (tag, k))
        status = p.get('status')
        if status not in STATUSES:
            bad('%s: status %r not in %s' % (tag, status, STATUSES))

        if pid == 'guide':
            n_guide += 1
            ships_as = p.get('ships_as')
            if status != 'ships' or not ships_as or not os.path.exists(R + str(ships_as)):
                bad('%s: status ships only because ships_as names a module that exists; '
                    'got status=%r ships_as=%r' % (tag, status, ships_as))
            v = p.get('voice') or {}
            if not isinstance(v.get('external_preset_voice_id'), str) or not v.get('external_preset_voice_id'):
                bad('%s: external_preset_voice_id must be the preset id string' % tag)
            if not v.get('external_engine'):
                bad('%s: external_engine must say what the preset id is for and that the app uses the browser engine' % tag)
        else:
            row = rows.get(norm(p.get('name', '')))
            if not row:
                bad('%s: name %r is not an agent in the AGENTS.md table' % (tag, p.get('name')))
            else:
                scope, boundary, tstatus = row
                if norm(p.get('scope', '')) != scope:
                    bad('%s: scope is not the AGENTS.md cell verbatim\n      json: %r\n      md:   %r'
                        % (tag, p.get('scope'), scope))
                if norm(p.get('boundary', '')) != boundary:
                    bad('%s: boundary is not the AGENTS.md cell verbatim\n      json: %r\n      md:   %r'
                        % (tag, p.get('boundary'), boundary))
                if status != tstatus:
                    bad('%s: status %r disagrees with the AGENTS.md Status column (%r)' % (tag, status, tstatus))
                if status in counts:
                    counts[status] += 1
            v = p.get('voice') or {}
            if v.get('external_preset_voice_id') is not None:
                bad('%s: only the guide may carry an external preset voice id' % tag)

        # the voice: browser engine, bounded rate and pitch
        v = p.get('voice') or {}
        if v.get('engine') != ENGINE:
            bad('%s: voice.engine must be %r' % (tag, ENGINE))
        if v.get('lang') != 'en-US':
            bad('%s: voice.lang must be en-US' % tag)
        for k in ('rate', 'pitch'):
            x = v.get(k)
            if not isinstance(x, (int, float)) or isinstance(x, bool) or not (RATE_LO <= x <= RATE_HI):
                bad('%s: voice.%s must be a number in %.1f–%.1f, got %r' % (tag, k, RATE_LO, RATE_HI, x))

        # the words: no pitch vocabulary, and the shape asked for
        pers = p.get('personality') or {}
        for field, text in (('role', p.get('role', '')), ('tone', pers.get('tone', '')),
                            ('opening_line', p.get('opening_line', ''))):
            low = str(text).lower()
            for b in BANNED:
                if b in low:
                    bad('%s: %s contains the banned phrase %r' % (tag, field, b))
        traits = pers.get('traits')
        if not isinstance(traits, list) or len(traits) != 3 or any(
                not isinstance(t, str) or not t.strip() or len(t.split()) > 2 for t in traits):
            bad('%s: traits must be three short adjectives, got %r' % (tag, traits))
        if len(sentences(pers.get('tone', ''))) != 2:
            bad('%s: tone must be two sentences, got %d' % (tag, len(sentences(pers.get('tone', '')))))
        if len(sentences(p.get('role', ''))) != 1:
            bad('%s: role must be one sentence' % tag)
        if len(sentences(p.get('opening_line', ''))) != 1:
            bad('%s: opening_line must be one sentence' % tag)
        ns = p.get('never_says')
        if not isinstance(ns, list) or not (3 <= len(ns) <= 5) or any(
                not isinstance(x, str) or not x.strip() for x in ns):
            bad('%s: never_says must be three to five phrases, got %r' % (tag, ns))

    # the embedded copy in src/personas.js
    if not os.path.exists(JS_PATH):
        bad('%s is missing' % JS_PATH)
    else:
        js = open(JS_PATH, encoding='utf-8').read()
        m = BLOCK_RE.search(js)
        if not m:
            bad('src/personas.js has no /*@personas.json*/ … /*@end personas.json*/ block')
        else:
            want = json.dumps(data, indent=2, ensure_ascii=False)
            if sync:
                new = js[:m.start(1)] + want + js[m.end(1):]
                if new != js:
                    open(JS_PATH, 'w', encoding='utf-8').write(new)
                    print('  · src/personas.js: embedded copy rewritten from content/agents/personas.json')
            else:
                try:
                    got = json.loads(m.group(1))
                except Exception as e:  # noqa: BLE001
                    got, e_ = None, e
                    bad('src/personas.js embedded block is not JSON: %s' % e_)
                if got is not None and got != data:
                    bad('src/personas.js embedded copy differs from content/agents/personas.json — '
                        'run: python3 scripts/validate_personas.py --sync')

    if problems:
        print('PERSONAS FAILED — %d problem(s):' % len(problems))
        for p in problems:
            print('  ✗ ' + p)
        return 1
    print('personas: %d · %d ship · %d partial · %d not built · %d guide ✓'
          % (len(personas), counts['ships'], counts['partial'], counts['not built'], n_guide))
    print('  · scope, boundary and status of six agents are the AGENTS.md table cells verbatim; '
          '%d rules quoted; no banned phrase in role, tone or opening line; rate/pitch in %.1f–%.1f; '
          'embedded copy in src/personas.js matches' % (len(rules), RATE_LO, RATE_HI))
    return 0


if __name__ == '__main__':
    sys.exit(main())
