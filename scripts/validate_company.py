#!/usr/bin/env python3
"""validate_company — the company layer cannot drift into a pitch deck.

docs/company/ holds AGI Corp's positioning, pricing, portfolio strategy, entity
model and agent specification. Two things make it the most dangerous directory
in this repository, and both get a check here rather than a policy:

  1. It is where a product NAME meets a product. A brand is a promise and a
     promise is a claim, so every module a branded name claims is verified to
     exist at the line count stated — the same rule scripts/validate_landscape.py
     applies to docs/market/GAP.md, for the same reason: nobody re-counts a
     module they wrote themselves.

  2. It is where securities-adjacent language would first appear. Being wrong
     about a competitor's price is embarrassing; stating a projected return as a
     settled fact, soliciting an investment, or implying that software equity
     conveys ownership of portfolio property is a legal exposure. The operating
     brief forbids all three pending counsel review, and a rule that matters is
     a rule with a validator — every other one in this project got one.

Checks:
  1. every document the index names exists, and every document is indexed
  2. every branded name carries a status from the fixed vocabulary
  3. a name claiming `ships` or `partial` names at least one real module
  4. every `src/x.js` (N lines) claim in docs/company/ is re-counted
  5. PRICING.md labels every tier management-set and states the no-comparison rule
  6. no registered-trademark symbol anywhere in the repository's documentation
  7. PROHIBITED LANGUAGE across docs/ and content/ — return projections stated as
     fact, solicitation, fund terms presented as agreed, and any claim that a
     software investor receives portfolio property

The language lint is blunt and will occasionally object to an innocent sentence.
That is the correct trade: the failure it prevents is not a typo. A sentence it
objects to can be rewritten; a sentence it would have caught cannot be unsent.

Usage: python3 scripts/validate_company.py
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DIR = os.path.join(ROOT, 'docs', 'company')

INDEX = 'README.md'
DOCS = ['POSITIONING.md', 'PRICING.md', 'PORTFOLIO_STRATEGY.md', 'FUNDING.md', 'AGENTS.md',
        'CAPITAL_STRUCTURE.md', 'MISSION_RIGHTS.md', 'INSTRUMENTS.md', 'CAP_TABLE.md',
        'USE_OF_PROCEEDS.md', 'RISK_REGISTER.md', 'INVESTOR_REPORTING.md']
STATUS = ('ships', 'partial', 'not built')

# ---- the prohibited-language lint ----------------------------------------
# Each entry: (compiled pattern, what it is, why it may not appear).
FORBIDDEN = [
    (re.compile(r'\b(guarantee[ds]?|guaranteed)\s+(return|yield|income|profit|appreciation)', re.I),
     'a guaranteed return',
     'No return is guaranteed. There is no counsel-approved basis for the word.'),
    (re.compile(r'\b(projected|expected|target(?:ed)?)\s+(?:annual\s+)?(?:return|yield|irr|roi)\s+(?:of|is|will be)\s+[\d$]', re.I),
     'a return projection stated as a settled figure',
     'Scenario arithmetic for one property on stated assumptions is not a projection of '
     'what an investor receives, and must never be relayed as one.'),
    (re.compile(r'\b(invest now|invest today|join the (?:fund|raise)|limited (?:spots|allocation)|'
                r'accepting investors|minimum investment of|now raising|open to investors)\b', re.I),
     'public solicitation language',
     'A securities offering may not be solicited without counsel-approved materials.'),
    (re.compile(r'\b(?:preferred return|carried interest|waterfall|management fee)\s+(?:of|is|will be)\s+[\d]', re.I),
     'a fund term presented as agreed',
     'Fund terms are settled in counsel-approved documents, not in repository prose.'),
    (re.compile(r'invest in AGI[^.]{0,60}\b(?:exposure|access|stake|interest)\b[^.]{0,80}'
                r'(?:portfolio|real estate|robotics|foundation)', re.I),
     'a single offering pitched as exposure across the whole group',
     'One cheque does not buy the group. Every offering names one issuer, one security '
     'and one approved budget; anything else is the ambiguity that produces litigation.'),
    (re.compile(r'software (?:equity|investors?|shareholders?)[^.]{0,80}\b(?:own|receive|entitled to|'
                r'stake in|share of)\b[^.]{0,40}\b(?:propert|portfolio|asset|real estate)', re.I),
     'a claim that software equity conveys property ownership',
     'An equity investment in the operating company conveys rights in the operating '
     'company only, unless legal documents separately establish otherwise.'),
]
# Files that are ABOUT the prohibition necessarily quote it.
LINT_EXEMPT = {os.path.join('docs', 'company', 'FUNDING.md'),
               # states the never-pitch in order to forbid it
               os.path.join('docs', 'company', 'CAPITAL_STRUCTURE.md'),
               os.path.join('scripts', 'validate_company.py')}


def die(msg):
    raise SystemExit('COMPANY STOPPED — ' + msg)


def lint_language():
    """Scan documentation and article content for language that may not ship."""
    hits, scanned = [], 0
    for base in ('docs', 'content'):
        top = os.path.join(ROOT, base)
        if not os.path.isdir(top):
            continue
        for dirpath, _dirs, files in os.walk(top):
            for fn in files:
                if not fn.endswith('.md'):
                    continue
                full = os.path.join(dirpath, fn)
                rel = os.path.relpath(full, ROOT)
                if rel in LINT_EXEMPT:
                    continue
                scanned += 1
                text = open(full, encoding='utf-8').read()
                for pat, what, why in FORBIDDEN:
                    m = pat.search(text)
                    if m:
                        line = text[:m.start()].count('\n') + 1
                        hits.append((rel, line, what, why, m.group(0)[:70]))
    return hits, scanned



def check_entity_register():
    """Every entity states what an investor does NOT automatically own.

    That last column is the whole design. An empty cell there is exactly the
    ambiguity the capital structure exists to remove, and it is the cell a
    hurried edit drops first because it is the only one that is awkward to
    write."""
    path = os.path.join(DIR, 'CAPITAL_STRUCTURE.md')
    text = open(path, encoding='utf-8').read()
    rows = []
    for line in text.split('\n'):
        if not line.startswith('| **'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) != 5:
            die('an entity-register row has %d cells, not 5:\n  %s' % (len(cells), line[:110]))
        name = re.sub(r'\*', '', cells[0])
        labels = ['a capital purpose', 'what an investor owns', 'a use of proceeds',
                  'what investors do NOT automatically own']
        for i, lab in enumerate(labels, start=1):
            if len(cells[i]) < 12:
                die('%s does not state %s. The last column in particular is the one that '
                    'prevents an investor believing one cheque bought the group.'
                    % (name, lab))
        rows.append(name)
    if len(rows) < 6:
        die('only %d entities parsed from the register; the group names more. A row that '
            'stops parsing is a disclosure that stops being made.' % len(rows))
    return rows


def check_risk_register():
    """Every risk names a mitigation and an OWNER.

    A risk owned by "the company" is owned by nobody, and a register without
    owners is a disclaimer with a table around it."""
    path = os.path.join(DIR, 'RISK_REGISTER.md')
    text = open(path, encoding='utf-8').read()
    n = 0
    for line in text.split('\n'):
        if not re.match(r'^\| \d+ \|', line):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) != 6:
            die('a risk row has %d cells, not 6:\n  %s' % (len(cells), line[:110]))
        num, risk, exposure, why, mit, owner = cells
        if len(mit) < 25:
            die('risk %s (%s) states no real mitigation. A risk with no mitigation is a '
                'disclaimer, and a disclaimer persuades nobody.' % (num, risk))
        if not owner or len(owner) < 3 or owner.lower() in ('tbd', 'n/a', 'the company', 'everyone'):
            die('risk %s (%s) has owner %r. A risk owned by nobody in particular is owned '
                'by nobody.' % (num, risk, owner))
        if re.search(r'\b(eliminat|remov|no risk|risk[- ]free)\w*\b', mit, re.I):
            die('risk %s (%s) claims its mitigation eliminates the risk. Several of these '
                'are permanent conditions of the business; the honest mitigation is a '
                'control, not a cure.' % (num, risk))
        n += 1
    if n < 15:
        die('only %d risk rows parsed; the register lists far more' % n)
    return n


def check_budgets():
    """A percentage-range budget must be able to add up to 100%.

    Ranges look reasonable individually and can still be collectively
    impossible. If the low ends sum above 100, or the high ends sum below it,
    no allocation satisfies the table — and nobody notices by reading."""
    checked = 0
    for fn in ('USE_OF_PROCEEDS.md', 'PORTFOLIO_STRATEGY.md'):
        path = os.path.join(DIR, fn)
        if not os.path.exists(path):
            continue
        block, lo, hi = None, 0.0, 0.0
        for line in open(path, encoding='utf-8').read().split('\n') + ['']:
            m = re.search(r'\|\s*(\d+(?:\.\d+)?)%\s*[\u2013-]\s*(\d+(?:\.\d+)?)%\s*\|', line)
            if m:
                block = True
                lo += float(m.group(1)); hi += float(m.group(2))
            elif block and not line.strip().startswith('|'):
                if lo > 100.0001:
                    die('%s has a percentage table whose MINIMUM shares sum to %.0f%% — no '
                        'allocation can satisfy it.' % (fn, lo))
                if hi < 99.9999:
                    die('%s has a percentage table whose MAXIMUM shares sum to %.0f%% — the '
                        'budget cannot reach 100%%.' % (fn, hi))
                checked += 1
                block, lo, hi = None, 0.0, 0.0
    return checked


def main():
    if not os.path.isdir(DIR):
        die('docs/company/ is missing — the company layer is where a product name '
            'meets a product, and it is not optional')

    # 1. index and documents agree
    idx_path = os.path.join(DIR, INDEX)
    if not os.path.exists(idx_path):
        die('docs/company/README.md is missing; the layer has no index')
    idx = open(idx_path, encoding='utf-8').read()
    for d in DOCS:
        if not os.path.exists(os.path.join(DIR, d)):
            die('docs/company/%s is missing' % d)
        if d not in idx:
            die('docs/company/%s exists and the index does not name it — an unindexed '
                'document is one nobody reviews' % d)
    present = sorted(f for f in os.listdir(DIR) if f.endswith('.md') and f != INDEX)
    extra = [f for f in present if f not in DOCS]
    if extra:
        die('docs/company/ carries %s, which this validator does not know about. Add it '
            'to DOCS and to the index, or remove it.' % ', '.join(extra))

    # 2-3. branded names carry a status, and a claimed name names a module
    pos = open(os.path.join(DIR, 'POSITIONING.md'), encoding='utf-8').read()
    names, claimed = 0, 0
    for line in pos.split('\n'):
        if not line.startswith('| **'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) != 4:
            die('a branded-name row has %d cells, not 4:\n  %s' % (len(cells), line[:110]))
        name = re.sub(r'\*', '', cells[0])
        st = cells[3]
        head = next((s for s in STATUS if ('**%s**' % s) in st or st.startswith(s)), None)
        if head is None:
            die('%s carries status %r, outside the vocabulary POSITIONING.md defines (%s)'
                % (name, st[:60], ', '.join(STATUS)))
        names += 1
        if head in ('ships', 'partial'):
            if not re.search(r'`src/[a-z0-9_]+\.js`', cells[2]):
                die('%s claims status %r and names no module that implements it. A brand '
                    'is a promise and a promise is a claim.' % (name, head))
            claimed += 1
    if names < 6:
        die('only %d branded names parsed from POSITIONING.md; the brief names eight. '
            'A row that stops parsing is a claim that stops being checked.' % names)

    # 4. every module claim in the layer is re-counted
    blob = ''.join(open(os.path.join(DIR, f), encoding='utf-8').read() for f in [INDEX] + DOCS)
    mods = re.findall(r'`(src/[a-z0-9_]+\.js)` \((\d+)(?: lines?)?\)', blob)
    if len(mods) < 12:
        die('only %d measured module claims parsed from docs/company/; it makes far more'
            % len(mods))
    for rel, stated in mods:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            die('docs/company/ credits %s with a capability and the file does not exist' % rel)
        real = sum(1 for _ in open(path, encoding='utf-8'))
        if real != int(stated):
            die('docs/company/ says %s is %s lines; it is %d. Re-measure before you '
                're-assert.' % (rel, stated, real))

    # 5. pricing is labelled for what it is
    pr = open(os.path.join(DIR, 'PRICING.md'), encoding='utf-8').read()
    tiers = [l for l in pr.split('\n') if l.startswith('| **')]
    if len(tiers) < 5:
        die('only %d pricing tiers parsed; the brief names five' % len(tiers))
    for l in tiers:
        if 'management-set' not in l:
            die('a pricing tier is not labelled management-set:\n  %s\nA price is chosen, '
                'not measured, and this repository says which kind of claim a number is.'
                % l[:110])
    if 'until a row is verified' not in pr.lower():
        die('PRICING.md does not carry the no-comparison rule. A price-comparison chart '
            'built on unverified competitor figures is the easiest way to be publicly '
            'wrong about somebody else.')

    # 6. no registered-trademark claim
    for dirpath, _d, files in os.walk(os.path.join(ROOT, 'docs')):
        for fn in files:
            if not fn.endswith('.md'):
                continue
            full = os.path.join(dirpath, fn)
            t = open(full, encoding='utf-8').read()
            if '®' in t:
                die('%s uses the registered-trademark symbol. Registration is a fact of '
                    'record at a trademark office and this project does not assert a fact '
                    'it has not checked — least of all about itself.'
                    % os.path.relpath(full, ROOT))

    # 7. structural disclosures
    entities = check_entity_register()
    risks = check_risk_register()
    budgets = check_budgets()

    # 8. the language lint
    hits, scanned = lint_language()
    if hits:
        rel, line, what, why, frag = hits[0]
        die('%s:%d contains %s — "%s"\n  %s\n  (%d further match(es))'
            % (rel, line, what, frag, why, len(hits) - 1))

    print('  · %d branded names, %d claiming a module, all re-counted · %d module claims verified'
          % (names, claimed, len(mods)))
    print('  · %d pricing tiers, every one labelled management-set · no comparison claim'
          % len(tiers))
    print('  · %d entities, each stating what an investor does NOT automatically own'
          % len(entities))
    print('  · %d risks, every one with a mitigation and a named owner · %d budget tables '
          'that can sum to 100%%' % (risks, budgets))
    print('  · %d markdown files linted for return projections, solicitation, fund terms, '
          'commingled offerings and property-ownership claims — none found' % scanned)
    return 0


if __name__ == '__main__':
    sys.exit(main())
