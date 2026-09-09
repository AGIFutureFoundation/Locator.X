#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Locator.X — curriculum integrity check.

The Academy's declared curriculum and its shipped lesson content drifted twice:
E1-E8 stayed marked "designed" after Track 17 shipped them, and D7 after Track
18. Both were caught by hand, late. This makes that class of error impossible to
ship: it loads the real track modules, compares them against curriculum.py, and
exits non-zero on any disagreement.

Run standalone, or let lxbuild call it before every build.
"""
import json, subprocess, sys, os

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + os.sep
sys.path.insert(0, R + 'curriculum')
import curriculum as K


def shipped_tracks():
    """Every track the app actually registers, by loading the real modules."""
    r = subprocess.run(['node', R + 'curriculum/extract_tracks.js'],
                       capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        raise RuntimeError('could not load track modules:\n' + (r.stderr or '')[:800])
    return json.loads(r.stdout)


def _norm(raw):
    """extract_tracks.js emits {tracks, lessonIds, routes, notes, stages}."""
    return (raw['tracks'], raw.get('lessonIds') or {}, raw.get('routes'),
            raw.get('notes'), raw.get('stages') or [])


def check():
    errs, warns, out_notes = [], [], []
    tracks, lesson_ids, routes, notes, stages = _norm(shipped_tracks())
    ids = [x[0] for x in K.C]

    # 1. every item has a BACKS entry, and no stray keys
    for i in ids:
        if i not in K.BACKS:
            errs.append('%s has no BACKS entry — cannot determine whether it is written' % i)
    for k in K.BACKS:
        if k not in ids:
            errs.append('BACKS names "%s", which is not a curriculum item' % k)

    # 2. every backing track actually ships, and has lessons in it
    for item, bs in K.BACKS.items():
        for b in bs:
            if b not in tracks:
                errs.append('%s claims backing track "%s", which does not ship' % (item, b))
            elif tracks[b]['lessons'] < 1:
                errs.append('%s claims backing track "%s", which ships with no lessons' % (item, b))

    # 3. THE DRIFT CHECK: the stored status field must match the derived one
    for (i, t, kind, pr, m, l, d, q, stored) in K.C:
        derived = K.status_of(i)
        if stored != derived:
            errs.append('%s status drift: curriculum.py says "%s", its backing says "%s"%s'
                        % (i, stored, derived,
                           ' (backed by %s)' % ', '.join(K.BACKS.get(i, [])) if K.BACKS.get(i) else ' (no backing declared)'))

    # 4. every shipped track is either a backing or declared supporting
    used = set(b for bs in K.BACKS.values() for b in bs)
    for tid in tracks:
        if tid not in used and tid not in K.SUPPORTING_TRACKS:
            warns.append('track "%s" (%s, %d lessons) backs no curriculum item and is not '
                         'listed in SUPPORTING_TRACKS — is an item missing?'
                         % (tid, tracks[tid]['name'], tracks[tid]['lessons']))

    # 5. referential integrity across prerequisites, levels and pathways
    idset = set(ids)
    for x in K.C:
        for p in x[7]:
            if p not in idset:
                errs.append('%s lists prerequisite "%s", which is not an item' % (x[0], p))
    seen = {}
    for (n, nm, tg, b, g, items) in K.LEVELS:
        for i in items:
            if i not in idset:
                errs.append('level %d lists "%s", which is not an item' % (n, i))
            if i in seen:
                errs.append('"%s" is assigned to level %d and level %d' % (i, seen[i], n))
            seen[i] = n
    for i in ids:
        if i not in seen:
            errs.append('%s is not assigned to any level' % i)
    for (nm, b, items) in K.PATHWAYS:
        for i in items:
            if i not in idset:
                errs.append('pathway "%s" lists "%s", which is not an item' % (nm, i))

    # 6. a prerequisite must not sit at a higher level than the item needing it
    for x in K.C:
        for p in x[7]:
            if p in seen and x[0] in seen and seen[p] > seen[x[0]]:
                errs.append('%s (level %d) requires %s, which sits at level %d'
                            % (x[0], seen[x[0]], p, seen[p]))

    out_notes.append('%d curriculum items · %d live · %d designed'
                 % (len(ids), sum(1 for i in ids if K.status_of(i) == 'live'),
                    sum(1 for i in ids if K.status_of(i) == 'designed')))
    out_notes.append('%d tracks shipped · %d lessons'
                 % (len(tracks), sum(t['lessons'] for t in tracks.values())))

    # 7. the developer route may only point at lessons that actually ship.
    #    These references sit in routes.js, far from the lessons themselves, so
    #    a rename elsewhere would leave a dead chip and nothing would say so.
    if routes is None:
        warns.append('developer route could not be loaded — its lesson references are unchecked')
    else:
        dead = []
        for r in routes:
            have = lesson_ids.get(r['track'])
            if have is None:
                dead.append('gate %s → track "%s" does not ship' % (r['gate'], r['track']))
            elif r['lesson'] not in have:
                dead.append('gate %s → %s/%s is not a lesson in that track'
                            % (r['gate'], r['track'], r['lesson']))
        for d in dead:
            errs.append('developer route: ' + d)
        out_notes.append('developer route: %d lesson references across %d tracks%s'
                     % (len(routes), len({r['track'] for r in routes}),
                        '' if not dead else ' — %d BROKEN' % len(dead)))
    # 8. an instructor note may only anchor to something that exists. Notes are
    #    supplied copy living apart from the lessons, so a rename would leave a
    #    note attached to nothing and the page would simply not render it.
    GATE_KEYS = {'L', 'O', 'C', 'A', 'T', 'O2', 'R'}
    if notes is None:
        warns.append('instructor notes could not be loaded — their anchors are unchecked')
    else:
        bad = []
        for n in notes:
            on, nid = n.get('on'), n.get('id')
            if not n.get('hasBody'):
                bad.append('a note anchored to %s:%s has no body' % (on, nid))
            if on == 'lesson':
                track, _, lesson = (nid or '').partition('.')
                have = lesson_ids.get(track)
                if have is None or lesson not in have:
                    bad.append('lesson anchor "%s" does not exist' % nid)
            elif on == 'gate':
                if nid not in GATE_KEYS:
                    bad.append('gate anchor "%s" is not a LOCATOR gate' % nid)
            elif on == 'stage':
                if nid not in stages:
                    bad.append('route-stage anchor "%s" is not a stage' % nid)
            else:
                bad.append('unknown anchor kind "%s"' % on)
        for d in bad:
            errs.append('instructor note: ' + d)
        notes_msg = ('none supplied yet — the layer renders nothing, by design'
                     if not notes else '%d supplied%s' % (len(notes), '' if not bad else ' — %d BROKEN' % len(bad)))
        out_notes.append('instructor notes: ' + notes_msg)

    return errs, warns, out_notes


def main():
    try:
        errs, warns, notes = check()
    except Exception as e:
        print('CURRICULUM CHECK — could not run: %s' % e)
        return 2
    for n in notes:
        print('  · ' + n)
    for w in warns:
        print('  ! ' + w)
    if errs:
        print('\nCURRICULUM CHECK FAILED — %d problem%s:' % (len(errs), '' if len(errs) == 1 else 's'))
        for e in errs:
            print('  ✕ ' + e)
        return 1
    print('  ✓ curriculum and shipped content agree')
    return 0


if __name__ == '__main__':
    sys.exit(main())
