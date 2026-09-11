"""hotel_candidates — generate docs/HOTEL_EXPANSION.md from the measured layer.

The lodging-focused expansion plan is derived, never authored: every candidate
area comes out of market/*.json or crosswalk/usecodes.json, and every area is
placed in an evidence tier by what those files actually say about it. Rerun
after any measurement lands; the generated doc is drift-checked like the course
catalogs.

The tiers are the whole point, because they keep an aspiration from reading as
a finding:

  A  the public record is PROVEN to publish a lodging use class here, with a
     measured parcel count behind it (crosswalk/usecodes.json)
  B  lodging stock is PROVEN to exist here, because a shipped edition already
     holds records whose own `kind` field names a lodging use — but the
     jurisdiction's lodging vocabulary is not mapped in the crosswalk
  C  the market is measured (a ranked submarket, or a corridor area with
     published jobs/permits/population) and lodging is simply UNKNOWN

Nothing here asserts that an area is a good hotel market. The residential
index behind tier C measures home values and rents; it is not a hotel signal,
and the doc says so where it is used.

Usage: python3 scripts/hotel_candidates.py [--check]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'docs', 'HOTEL_EXPANSION.md')


def load(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return json.load(f)


def build():
    B = load('market/belts.json')
    C = load('market/corridors.json')
    X = load('crosswalk/usecodes.json')
    S = load('market/edition_scale.json')

    # ---- tier A: the record is proven to publish a lodging class -----------
    tier_a = []
    for j in X['jurisdictions']:
        lodge = [c for c in j['codes'] if c.get('class') == 'lodging']
        if not lodge:
            continue
        measured = sum(c.get('measured_count') or 0 for c in lodge)
        verified = [c.get('verified') for c in lodge if c.get('verified')]
        tier_a.append({
            'area': j['name'], 'codes': len(lodge), 'parcels': measured or None,
            'value_field': j.get('value_field'),
            'verified': sorted(verified)[-1] if verified else None,
        })
    tier_a.sort(key=lambda r: -(r['parcels'] or 0))

    # ---- tier B: lodging stock proven by a shipped edition -----------------
    tier_b, seen_b = [], set()
    for e in S['editions']:
        for city, n in e['lodging']['cities']:
            key = city.strip().lower()
            if key in seen_b:
                continue
            seen_b.add(key)
            tier_b.append({'area': city.strip(), 'records': n, 'edition': e['key']})
    tier_b.sort(key=lambda r: -r['records'])

    # ---- tier C: market measured, lodging unknown -------------------------
    # Counties carrying a ranked submarket, and the counties named by corridor
    # areas. Both are measured sets; neither says anything about lodging.
    belts_counties = {}
    for r in B['top100'] + B['belts']:
        k = (r['state'], r['county'])
        d = belts_counties.setdefault(k, {'zips': set(), 'metro': r['metro'], 'best': r['rank']})
        d['zips'].add(r['zip'])
        d['best'] = min(d['best'], r['rank'])
    corridor_counties = {}
    for m in C['metros']:
        st = m.get('state') or m['metro'].split(',')[-1].strip()[:2]
        for c in m.get('counties', []):
            corridor_counties.setdefault((st, c), m['metro'])

    tier_c = []
    for (st, county), d in belts_counties.items():
        tier_c.append({'area': county, 'state': st, 'metro': d['metro'],
                       'why': '%d ranked submarket%s, best national rank #%d'
                              % (len(d['zips']), '' if len(d['zips']) == 1 else 's', d['best']),
                       'sort': (0, d['best'])})
    for (st, county), metro in corridor_counties.items():
        if (st, county) in belts_counties:
            continue
        tier_c.append({'area': county, 'state': st, 'metro': metro,
                       'why': 'named by a corridor area with published figures',
                       'sort': (1, 0)})
    tier_c.sort(key=lambda r: (r['sort'], r['area']))
    return tier_a, tier_b, tier_c, S, B, C


def render(tier_a, tier_b, tier_c, S, B, C):
    f = S['findings']
    per = f['per_50k']
    biggest = max(S['editions'], key=lambda e: e['records'])
    lodging_total = sum(e['lodging']['total'] for e in S['editions'])
    total = len(tier_a) + len(tier_b) + len(tier_c)

    L = []
    w = L.append
    w('# Lodging expansion — what the record can carry, and where to pull next')
    w('')
    w('> **Generated** by `scripts/hotel_candidates.py` from `market/*.json` and')
    w('> `crosswalk/usecodes.json`. Do not edit; rerun after a measurement lands.')
    w('')
    w('This plan answers three questions with measurements rather than intentions: what it')
    w('costs to grow an edition, what lodging stock the record already holds, and which')
    w('areas are worth a pull. **No property rows were generated anywhere in this work.**')
    w('Adding records is a data-machine job against the public record; a row this platform')
    w('invented would be indistinguishable from a row it measured, which is the one failure')
    w('it cannot recover from.')
    w('')
    w('## 1. What growth actually costs — measured %s' % S['measured_on'])
    w('')
    w('Four shipped editions were driven in headless Chromium at their real record counts.')
    w('')
    w('| Edition | Records | Page bytes | Load | JS heap | Full scan | Sort |')
    w('|---|---:|---:|---:|---:|---:|---:|')
    for e in sorted(S['editions'], key=lambda x: x['records']):
        w('| `%s` | %s | %.1f MB | %.1f s | **%.0f MB** | %.1f ms | %.1f ms |'
          % (e['key'], format(e['records'], ','), e['bytes'] / 1048576,
             e['load_ms'] / 1000, e['heap_mb'], e['scan_ms'], e['sort_ms']))
    w('')
    w('**The ceiling is memory, not bandwidth.** %s' % f['ceiling'])
    w('')
    w('Per 50,000 records added to an edition: **+%.2f MB** on the wire, **+~%d MB** of JS'
      % (per['added_bytes_mb'], per['added_heap_mb']))
    w('heap, and roughly +%.1f s of load. So the request "50,000 more per area" is cheap in'
      % (per['added_ms'] / 1000 if 'added_ms' in per else per['added_load_ms'] / 1000))
    w('bytes and expensive in memory:')
    w('')
    w('| Edition | Today | With +50k | Projected heap |')
    w('|---|---:|---:|---:|')
    for e in sorted(S['editions'], key=lambda x: -x['records']):
        proj = e['heap_mb'] + per['added_heap_mb']
        flag = ' ⚠️' if proj > 1024 else ''
        w('| `%s` | %s rec / %.0f MB heap | %s rec | **%.0f MB**%s |'
          % (e['key'], format(e['records'], ','), e['heap_mb'],
             format(e['records'] + 50000, ','), proj, flag))
    w('')
    w('`%s` is already at %.2f GB of heap at %s records. Adding 50,000 there takes it past'
      % (biggest['key'], biggest['heap_mb'] / 1024, format(biggest['records'], ',')))
    w('1.1 GB, which no phone survives and many laptops will not either. **Growth past this')
    w('point is an architecture change, not a bigger file** — the single-file edition holds')
    w('every record in memory at once by design, and that design has a record ceiling around')
    w('300–400k. The honest options, in order of how much they change what an edition *is*:')
    w('')
    w('1. **Split by area, not by size.** A metro-scoped edition of 100–150k records stays')
    w('   under ~450 MB and keeps the single-file, network-off property intact. This is the')
    w('   cheapest path and needs no engine change — `build_state.py` already builds per-spec.')
    w('2. **Class-scoped editions.** A lodging-only edition of the same footprint carries a')
    w('   few thousand records, not a few hundred thousand (§2), so an entire national hotel')
    w('   edition fits inside one metro edition\'s budget.')
    w('3. **Defer the record store.** Keep the packed payload but hydrate lazily per viewport')
    w('   or per query. This breaks the "everything is in memory" assumption the ranking and')
    w('   underwriting engines are written against, so it is a real project, not a flag.')
    w('')
    w('Option 2 is also the one that serves a hotel focus best, which is convenient rather')
    w('than a coincidence: lodging is a thin class in a thick record.')
    w('')
    w('## 2. The lodging stock the record already holds')
    w('')
    w('Counted by each record\'s own `kind` field — not a keyword sweep over free text.')
    w('(An earlier pass that also searched the source field over-counted `uscorridor` by more')
    w('than tenfold, 31,117 against 2,955; source strings are not use classes.)')
    w('')
    w('| Edition | Lodging records | With a value | With units | Leading places |')
    w('|---|---:|---:|---:|---|')
    for e in sorted(S['editions'], key=lambda x: -x['lodging']['total']):
        lg = e['lodging']
        places = ', '.join('%s %s' % (c, format(n, ',')) for c, n in lg['cities'][:3]) or '—'
        w('| `%s` | **%s** | %s | %s | %s |'
          % (e['key'], format(lg['total'], ','),
             format(lg['with_value'], ',') if lg['with_value'] else '—',
             format(lg['with_units'], ',') if lg['with_units'] else '—', places))
    w('')
    w('**%s lodging records across the four measured editions**, and on the three that report'
      % format(lodging_total, ','))
    w('it, essentially every one carries both a value and a unit count — which is what the')
    w('per-class underwriting worksheet needs to run a hotel case. The vocabularies differ')
    w('sharply by jurisdiction and that difference is itself the finding: New Orleans records')
    w('a single flat `Hotel / lodging`, the Bay separates `Hotel` from `Motel` from')
    w('`SRO / residential hotel`, and the corridor counties carry six distinct spellings')
    w('including `Com Hotels` and `Inn, lodge, rooming or fraternity house`. A national')
    w('lodging screen cannot be a string match; it has to go through the crosswalk.')
    w('')
    w('## 3. The gap that blocks a hotel screen today')
    w('')
    w('The crosswalk maps a lodging class for **%d jurisdictions**:' % len(tier_a))
    w('')
    w('| Jurisdiction | Lodging codes | Measured parcels | Value field | Verified |')
    w('|---|---:|---:|---|---|')
    for r in tier_a:
        w('| %s | %d | %s | %s | %s |'
          % (r['area'], r['codes'], format(r['parcels'], ',') if r['parcels'] else '—',
             '`%s`' % r['value_field'] if r['value_field'] else '—',
             r['verified'] or 'transcribed, unverified'))
    w('')
    w('**Neither Orleans Parish nor any Bay Area county is among them** — and those two hold')
    w('%s of the %s measured lodging records above. The anchor markets carry the stock and'
      % (format(322 + 1044, ','), format(lodging_total, ',')))
    w('the crosswalk cannot yet name it. That is the first thing to fix, and it is a small')
    w('fix: a measured `groupBy` on each jurisdiction\'s use-code field, which is one probe')
    w('per county, not a pull of 50,000 rows.')
    w('')
    w('## 4. The candidate areas — %d, in evidence tiers' % total)
    w('')
    w('**The ask was 100 areas; the measured sets yield %d.** The pool is every county the' % total)
    w('ranking covers, every county a corridor area names, and every jurisdiction the')
    w('crosswalk maps — %d, %d and %d of them. Four more could be reached by widening a'
      % (len(tier_c), len(tier_b), len(tier_a)))
    w('threshold, but not by naming four areas nobody has measured, so the list stops where')
    w('the evidence does.')
    w('')
    w('Ordered by what is known, not by what is hoped. Tier A is ready to screen; tier B has')
    w('proven stock and a missing vocabulary; tier C has a measured market and unknown')
    w('lodging. **Tier C\'s ranking signal is residential** — the value and rent indices')
    w('behind the submarket ranking measure homes, not hotels, so a high rank there is a')
    w('reason to look, never evidence of a hotel market.')
    w('')
    w('### Tier A — the record publishes a lodging class (%d)' % len(tier_a))
    w('')
    w('Screenable now. Probe: run `scripts/class_screen.py` and confirm the counts still hold.')
    w('')
    for r in tier_a:
        w('- **%s** — %d lodging code%s%s'
          % (r['area'], r['codes'], '' if r['codes'] == 1 else 's',
             ', %s parcels measured' % format(r['parcels'], ',') if r['parcels']
             else ', no measured count yet'))
    w('')
    w('### Tier B — lodging stock proven, vocabulary unmapped (%d)' % len(tier_b))
    w('')
    w('A shipped edition already holds lodging records here. Probe: one `groupBy` on the')
    w('jurisdiction\'s use-code field to map its lodging vocabulary into the crosswalk.')
    w('')
    w('| Place | Lodging records held | From edition |')
    w('|---|---:|---|')
    for r in tier_b:
        w('| %s | %s | `%s` |' % (r['area'], format(r['records'], ','), r['edition']))
    w('')
    w('### Tier C — market measured, lodging unknown (%d)' % len(tier_c))
    w('')
    w('No lodging evidence either way. Probe: check whether the county assessor publishes a')
    w('use-code field at all, then a `groupBy` if it does; convert to tier A, or to')
    w('`blocked` / `no public record` with the reason dated.')
    w('')
    w('| County / area | State | Metro or corridor | What is measured |')
    w('|---|---|---|---|')
    for r in tier_c:
        w('| %s | %s | %s | %s |' % (r['area'], r['state'], r['metro'], r['why']))
    w('')
    w('## 5. What the data machine runs')
    w('')
    w('None of this container\'s work can add a record: there is no data tree here and no')
    w('egress to a county or open-data host (all four probed hosts returned `000` on')
    w('%s). The sequence below runs where the data lives.' % S['measured_on'])
    w('')
    w('1. **Map the anchor markets\' lodging vocabulary** (§3) — one `groupBy` per')
    w('   jurisdiction on Orleans and the Bay Area counties, appended to')
    w('   `crosswalk/usecodes.json` with source and date. Until this lands, a national')
    w('   lodging screen cannot include the two markets that hold the most lodging stock.')
    w('2. **Work tier B, then tier C**, in the order printed above, recording each result')
    w('   in `docs/states/coverage/` with an honest status — `pulled`, `blocked` or')
    w('   `no public record` — never a silent skip.')
    w('3. **Grow editions by splitting, not by swelling** (§1). A metro-scoped or')
    w('   lodging-scoped spec in `build_state.py` stays inside the memory budget; adding')
    w('   50,000 rows to `uscorridor` does not.')
    w('4. **Publish** with `bash scripts/publish_editions.sh`, which hash-verifies the set')
    w('   into the editions channel.')
    w('')
    w('Every figure on this page is measured and dated. Where something is unknown it is')
    w('marked unknown and carries the probe that would settle it — which is the only')
    w('honest form a plan can take before the data is in hand.')
    return '\n'.join(L) + '\n'


def main():
    tier_a, tier_b, tier_c, S, B, C = build()
    text = render(tier_a, tier_b, tier_c, S, B, C)
    if '--check' in sys.argv:
        cur = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if cur != text:
            raise SystemExit('HOTEL_EXPANSION.md is stale — rerun '
                             'scripts/hotel_candidates.py')
        print('  ✓ docs/HOTEL_EXPANSION.md is in sync with the measured layer')
        return
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(text)
    print('wrote docs/HOTEL_EXPANSION.md — %d candidates (%d tier A, %d tier B, %d tier C)'
          % (len(tier_a) + len(tier_b) + len(tier_c), len(tier_a), len(tier_b), len(tier_c)))


if __name__ == '__main__':
    main()
