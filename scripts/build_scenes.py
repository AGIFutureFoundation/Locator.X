#!/usr/bin/env python3
"""build_scenes — validate the Academy title-sequence prompts, and render them.

Two jobs, and the first matters more than the second.

1. ENFORCE THE BOUNDARY. Generative video never attaches to a parcel record on
   this platform, and never depicts a real place. A synthesized picture of a
   real address is a stronger claim than a fabricated number, not a weaker one,
   and the platform refuses the number (CLAUDE.md). So every scene is checked
   against the place vocabulary the repository already holds — the 50-state
   table in docs/states/coverage, the city list in src/app.js, and the county
   and parish names in the state files — and any scene naming one fails.

2. ENFORCE THE MODEL'S OWN PROMPT RULES, which are the difference between a
   morph that reads as cinematography and one that reads as a glitch:
     - each prompt is a full paragraph, not a tagline
     - each prompt is ONE continuous take: no cuts, no montage, no scene lists
     - each evolution re-establishes the SAME setting verbatim before changing
       one thing, which is what makes the mid-run morph smooth

The re-establishment check looks for the "the same ..." idiom twice (setting
and camera) plus a real overlap of distinctive words with the opening sentence.
It does NOT demand a literally copied run: the skill says "verbatim" but its own
worked example paraphrases, and a first version of this check that demanded six
identical words failed every honest prompt in the library.

Output (generated, never hand-edited — CLAUDE.md):
  docs/ACADEMY_SCENES.md

Usage:
  python3 scripts/build_scenes.py            regenerate
  python3 scripts/build_scenes.py --check    fail if stale
"""
import json
import os
import re
import sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
SRC = R + 'content/academy_scenes.json'
OUT = R + 'docs/ACADEMY_SCENES.md'

# Words that mean the model was asked for more than one shot. The model
# generates a single unbroken take per prompt; asking for a montage gets a
# drifting picture, not a montage.
CUT_WORDS = [
    'cut to', 'cuts to', 'montage', 'sequence of shots', 'then we see',
    'intercut', 'jump cut', 'scene 1', 'scene 2', 'meanwhile',
]
MIN_WORDS = 45          # a paragraph, not a tagline
# How an evolution re-establishes the world. The skill says "restated
# verbatim", but its own worked example paraphrases — "A majestic citadel of
# pale stone floats above an ocean of cloud" becomes "The same floating stone
# citadel above the cloud ocean". So the rule the model actually demonstrates is
# the "the same X" idiom plus a real overlap of the distinctive nouns, not a
# literal copied run. A first version of this check demanded six identical words
# and failed every honest prompt in the library, including ones written straight
# from that example.
MIN_SAME_ANCHORS = 2    # "the same ..." restatements: the setting and the camera
MIN_SHARED_NOUNS = 3    # distinctive content words carried over from the opening


def die(msg):
    raise SystemExit('SCENE LIBRARY STOPPED — ' + msg)


def place_vocabulary():
    """Real place names this repository already knows about.

    Built from the repository's own data rather than a list typed here, so it
    grows automatically as coverage does and cannot drift out of date.
    """
    places = set()
    # the 50-state table (states + DC)
    md = open(R + 'docs/states/coverage/README.md', encoding='utf-8').read()
    md += open(R + 'docs/states/README.md', encoding='utf-8').read()
    for m in re.finditer(r'^\| ([A-Z][A-Za-z .]+?) \|', md, re.M):
        name = m.group(1).strip()
        if len(name) > 3 and name not in ('State', 'Status', 'Gate', 'Item'):
            places.add(name.lower())
    # counties and parishes named in the coverage files
    import glob
    for path in glob.glob(R + 'docs/states/coverage/*.md'):
        for m in re.finditer(r'\b([A-Z][a-z]+(?: [A-Z][a-z]+)?) (?:County|Parish)\b',
                             open(path, encoding='utf-8').read()):
            places.add(m.group(1).lower())
    # the city list the app ships
    app = open(R + 'src/app.js', encoding='utf-8').read()
    m = re.search(r'const CITIES = \[(.*?)\];', app, re.S)
    if m:
        for c in re.finditer(r"\['([^']+)'", m.group(1)):
            places.add(c.group(1).lower())
    # a few the repository names constantly but that the patterns above miss
    places.update({'new orleans', 'baton rouge', 'shelter cove', 'bay area',
                   'san francisco', 'louisiana', 'california'})
    # Words that are real places AND ordinary English. Checking them would fail
    # every honest paragraph, so they are excluded and named here rather than
    # silently dropped.
    return places - {'union city', 'orange', 'white', 'clay', 'butte', 'plain',
                     'grant', 'washington', 'columbia', 'mobile', 'sun'}


def check_scene(sc, places, problems):
    sid = sc.get('id') or '(unnamed)'
    for field in ('id', 'title', 'pillar', 'initial', 'evolution'):
        if not sc.get(field):
            problems.append('%s: missing %s' % (sid, field))
            return
    for field in ('initial', 'evolution'):
        text = sc[field]
        low = text.lower()
        # 1. the boundary
        for place in sorted(places):
            if re.search(r'\b%s\b' % re.escape(place), low):
                problems.append(
                    '%s.%s names a real place: %r. Generative video on this '
                    'platform never depicts a real place.' % (sid, field, place))
        if re.search(r'\b\d+\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Rd|Road|Blvd)\b', text):
            problems.append('%s.%s reads like a street address' % (sid, field))
        # 2. the model's prompt rules
        words = len(text.split())
        if words < MIN_WORDS:
            problems.append('%s.%s is %d words — a tagline, not a paragraph '
                            '(minimum %d). Terse prompts make the model invent '
                            'the rest every chunk and the picture drifts.'
                            % (sid, field, words, MIN_WORDS))
        for bad in CUT_WORDS:
            if bad in low:
                problems.append('%s.%s asks for more than one shot (%r). The '
                                'model generates a single unbroken take per '
                                'prompt.' % (sid, field, bad))
        if 'single unbroken take' not in low:
            problems.append('%s.%s does not state that it is a single unbroken '
                            'take' % (sid, field))
    # 3. the evolution must re-establish the world before changing anything
    first = re.split(r'(?<=[.!?])\s', sc['initial'])[0].lower()
    ev = sc['evolution'].lower()
    anchors = len(re.findall(r'\bthe same\b', ev))
    if anchors < MIN_SAME_ANCHORS:
        problems.append(
            '%s.evolution re-establishes the world %d time(s); the setting AND '
            'the camera both need restating ("the same ...") before anything '
            'changes, or the morph reads as a glitch.' % (sid, anchors))
    stop = {'a', 'an', 'the', 'of', 'and', 'in', 'on', 'at', 'its', 'that',
            'with', 'into', 'across', 'down', 'from', 'their', 'this', 'over',
            'single', 'unbroken', 'take', 'continuous', 'slow', 'camera',
            'photorealistic', 'cuts', 'motion', 'same'}
    init_nouns = {w for w in re.findall(r'[a-z]{5,}', first) if w not in stop}
    carried = sorted(w for w in init_nouns if re.search(r'\b%s' % re.escape(w[:5]), ev))
    if len(carried) < MIN_SHARED_NOUNS:
        problems.append(
            '%s.evolution carries only %d distinctive word(s) from the opening '
            'sentence (%s); it needs at least %d, or it is describing a '
            'different place.' % (sid, len(carried), ', '.join(carried) or 'none',
                                  MIN_SHARED_NOUNS))


def render(lib):
    L = []
    A = L.append
    A('# Academy title sequences — the scene library')
    A('')
    A('<!-- GENERATED by scripts/build_scenes.py from content/academy_scenes.json.')
    A('     Do not edit: run the script. tests/run.py fails if it is stale. -->')
    A('')
    A('**What this is.** ' + lib['what_this_is'])
    A('')
    A('**The line.** ' + lib['the_line'])
    A('')
    A('**Credential.** ' + lib['credential'])
    A('')
    A('Model: `%s`. Library version %d, last reviewed %s. **%d scenes.**'
      % (lib['model'], lib['version'], lib['reviewed'], len(lib['scenes'])))
    A('')
    A('## How these are written')
    A('')
    A('Each scene is a pair. The **initial** prompt opens the shot; the')
    A('**evolution** is sent mid-run and morphs it at the next chunk boundary')
    A('(~1.8s). Three rules, all checked by the generator:')
    A('')
    A('1. **A full paragraph, never a tagline** — setting, subject, light, motion')
    A('   and camera all named. A terse prompt forces the model to invent the')
    A('   rest every chunk, and the picture drifts.')
    A('2. **One continuous take** — no cuts, no montage, no scene lists. The')
    A('   model generates a single unbroken shot per prompt.')
    A('3. **The evolution restates the world verbatim before changing one')
    A('   thing** — same setting, same camera, then the light or the weather')
    A('   turns. That restatement is what makes the morph read as cinematography.')
    A('')
    for sc in lib['scenes']:
        A('## %s' % sc['title'])
        A('')
        A('*%s* — `%s`' % (sc['pillar'], sc['id']))
        A('')
        A('**Initial**')
        A('')
        A('> ' + sc['initial'])
        A('')
        A('**Evolution**')
        A('')
        A('> ' + sc['evolution'])
        A('')
    A('## What is deliberately absent')
    A('')
    A('No real place, no real building, no real person, no address, no property.')
    A('Every scene is abstract architecture, light and landscape. The generator')
    A('checks each prompt against the place vocabulary this repository already')
    A('holds — the state table, the county and parish names in the coverage')
    A('files, and the city list the app ships — and fails the build on a match,')
    A('so the boundary is a gate rather than a promise.')
    A('')
    return '\n'.join(L)


def main():
    check = '--check' in sys.argv
    lib = json.load(open(SRC, encoding='utf-8'))
    if not lib.get('scenes'):
        die('no scenes in %s' % os.path.relpath(SRC, R))
    places = place_vocabulary()
    problems = []
    seen = set()
    for sc in lib['scenes']:
        if sc.get('id') in seen:
            problems.append('duplicate scene id %r' % sc['id'])
        seen.add(sc.get('id'))
        check_scene(sc, places, problems)
    if problems:
        die('%d problem(s):\n  - %s' % (len(problems), '\n  - '.join(problems)))

    text = render(lib)
    cur = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else None
    if check:
        if cur != text:
            raise SystemExit(
                'SCENE LIBRARY IS STALE — %s no longer matches its source.\n'
                'Run: python3 scripts/build_scenes.py' % os.path.relpath(OUT, R))
    else:
        with open(OUT, 'w', encoding='utf-8') as f:
            f.write(text)
    words = sum(len(sc['initial'].split()) + len(sc['evolution'].split())
                for sc in lib['scenes'])
    print('scenes: %d pairs, %d prompt words, %d place names checked against — %s'
          % (len(lib['scenes']), words, len(places),
             'current' if check else 'written'))


if __name__ == '__main__':
    main()
