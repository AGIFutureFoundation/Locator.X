#!/usr/bin/env python3
"""Generate curriculum/courses/ — one markdown file per pillar, from curriculum-50.csv."""
import csv, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV = os.path.join(ROOT, "curriculum", "curriculum-50.csv")
OUT = os.path.join(ROOT, "curriculum", "courses")

PILLARS = [
    ("Emotional equity & relationships", "01-emotional-equity", "E",
     "The slab under everything else, not a pillar you finish. Trust is treated as a capital "
     "account: deposited, drawn down, compounding or not. Every other pillar assumes you can "
     "get a seller to talk, a lender to stretch, and a contractor to tell you bad news early — "
     "this is where those abilities are built."),
    ("Foundations & the Locator.X doctrine", "02-foundations", "F",
     "How a building pays you, the asset-or-liability test, and how to read every number the "
     "platform shows — including the ones it refuses to show. This pillar is the doctrine the "
     "product is built on: the buy box, the evidence grade, and the 90-day path from curiosity "
     "to a written offer."),
    ("The numbers", "03-the-numbers", "N",
     "NOI to sensitivity analysis, in order of consequence. The sequence runs from the number "
     "every valuation rests on (NOI) through the two survival numbers (cash-on-cash, DSCR) to "
     "the pro forma that does not lie and the one input that actually decides the outcome."),
    ("The asset", "04-the-asset", "A",
     "The physical and legal thing you are buying: the five commercial classes as five "
     "different businesses, valuation approaches and when each fails, the lease clause by "
     "clause, the rent roll you actually inherit, and conversion stock whose recorded use is "
     "not its best use."),
    ("Capital & structure", "05-capital-structure", "C",
     "Where the money comes from and what it really costs. Coverage as the only leverage test "
     "that matters, the loan beyond the rate, the lender's triangle, seller financing, equity "
     "waterfalls, and the capital-markets plumbing that prices your exit."),
    ("Development & delivery", "06-development-delivery", "D",
     "Eight actors, six gates, and the discipline of sequencing cheap reversible steps ahead "
     "of expensive irreversible ones. Zoning as three separate limits, entitlement risk, "
     "feasibility as a gate with kill criteria, construction cost and contingency, value "
     "engineering, and a lab that carries one parcel start to finish."),
    ("Evidence, data & judgment", "07-evidence-data-judgment", "V",
     "The pillar that keeps the platform honest. Framing before querying, keys and joins, "
     "medians and the sample-size floor, refusing to extrapolate, and drawing a number so it "
     "cannot mislead. Every rule here is enforced somewhere in the product."),
    ("Market, practice & the long game", "08-market-practice", "M",
     "From a jobs announcement to a rent, disruption in how space is used and priced, and the "
     "hold-tax-exit arithmetic that decides what you actually keep."),
]

LEVELS = {
    "1": ("Level 1 — Orientation", "First contact: vocabulary, the income streams, the platform's numbers."),
    "2": ("Level 2 — Practitioner", "Working skills: the buy box, survival numbers, coverage, the relationship map in practice."),
    "3": ("Level 3 — Operator", "Running deals: entitlement, feasibility, pro formas, the lender's triangle, hard conversations."),
    "4": ("Level 4 — Principal", "Structuring and judgment: waterfalls, capital markets, partnerships, the exit, the thesis."),
}

def load():
    with open(CSV, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [r for r in rows if r.get("ID")]

def main():
    rows = load()
    by_id = {r["ID"]: r for r in rows}
    os.makedirs(OUT, exist_ok=True)

    # ---------- per-pillar files ----------
    for pillar, slug, prefix, intro in PILLARS:
        items = [r for r in rows if r["Pillar"] == pillar]
        courses = sum(1 for r in items if r["Kind"] == "course")
        guides = len(items) - courses
        modules = sum(int(r["Modules"]) for r in items)
        lines = []
        lines.append(f"# {pillar}")
        lines.append("")
        lines.append(f"> Pillar {slug[:2]} of 8 · **{len(items)} items** ({courses} courses, {guides} guides) · "
                     f"**{modules} modules** · all {len(items)} live")
        lines.append("")
        lines.append(intro)
        lines.append("")
        lines.append("Source of truth: [`curriculum/curriculum-50.csv`](../curriculum-50.csv) and "
                     "[`curriculum/curriculum.py`](../curriculum.py). Status is derived by "
                     "`status_of()`, never stored; [`validate.py`](../validate.py) gates every build "
                     "on the eight checks. Edit the source, not this file — regenerate with "
                     "`python3 curriculum/gen_courses.py`, as noted in [`README.md`](README.md).")
        lines.append("")
        lines.append("## At a glance")
        lines.append("")
        lines.append("| ID | Level | Title | Kind | Modules | Prerequisites |")
        lines.append("|----|-------|-------|------|---------|---------------|")
        for r in items:
            pr = ", ".join(r["Prereqs"].split()) if r["Prereqs"] else "—"
            lines.append(f"| **{r['ID']}** | {r['Level']} | {r['Title']} | {r['Kind']} | {r['Modules']} | {pr} |")
        lines.append("")
        lines.append("## Prerequisite flow")
        lines.append("")
        lines.append("```mermaid")
        lines.append("graph LR")
        ids = {r["ID"] for r in items}
        exts = set()
        for r in items:
            lines.append(f"  {r['ID']}[\"{r['ID']} · {r['Title'].split(':')[0]}\"]")
        for r in items:
            for p in r["Prereqs"].split():
                if p in ids:
                    lines.append(f"  {p} --> {r['ID']}")
                else:
                    exts.add(p)
                    lines.append(f"  {p}([{p}]) -.-> {r['ID']}")
        lines.append("```")
        if exts:
            named = ", ".join(f"**{e}** ({by_id.get(e, {}).get('Title', '?')}, {by_id.get(e, {}).get('Pillar', '?')})" for e in sorted(exts))
            lines.append("")
            lines.append(f"Dashed nodes are prerequisites from other pillars: {named}.")
        lines.append("")
        # level-by-level detail
        for lvl in ("1", "2", "3", "4"):
            lvl_items = [r for r in items if r["Level"] == lvl]
            if not lvl_items:
                continue
            title, desc = LEVELS[lvl]
            lines.append(f"## {title}")
            lines.append("")
            lines.append(f"*{desc}*")
            lines.append("")
            for r in lvl_items:
                lines.append(f"### {r['ID']} — {r['Title']}")
                lines.append("")
                lines.append(f"*{r['Kind'].capitalize()} · {r['Modules']} modules · status: {r['Status']}*")
                lines.append("")
                lines.append(f"**The promise.** {r['Promise']}")
                lines.append("")
                if r["Prereqs"]:
                    parts = []
                    for p in r["Prereqs"].split():
                        t = by_id.get(p, {}).get("Title", "?")
                        parts.append(f"**{p}** ({t})")
                    lines.append(f"**Take first:** {', '.join(parts)}.")
                    lines.append("")
                lines.append(f"**Where it lands in the product:** {r['Lands on']}.")
                if r["Backed by"]:
                    lines.append("")
                    lines.append(f"**Backing tracks:** `{r['Backed by']}`")
                lines.append("")
        with open(os.path.join(OUT, slug + ".md"), "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        print("wrote", slug + ".md", len(items), "items")

    # ---------- index ----------
    lines = []
    lines.append("# The course catalog, separated by pillar")
    lines.append("")
    total_mod = sum(int(r["Modules"]) for r in rows)
    n_courses = sum(1 for r in rows if r["Kind"] == "course")
    lines.append(f"**{len(rows)} curriculum items** ({n_courses} courses, {len(rows)-n_courses} guides) · "
                 f"**{total_mod} modules** · **8 pillars** · **4 levels** · all {len(rows)} live.")
    lines.append("")
    lines.append("This directory splits the single-file curriculum into one readable document per "
                 "pillar. It is a **generated view**: the source of truth stays "
                 "[`curriculum/curriculum.py`](../curriculum.py) / "
                 "[`curriculum-50.csv`](../curriculum-50.csv), gated by the eight checks in "
                 "[`validate.py`](../validate.py). If a table here disagrees with the CSV, the CSV wins.")
    lines.append("")
    lines.append("## The eight pillars")
    lines.append("")
    lines.append("| # | Pillar | Items | Modules | Levels covered |")
    lines.append("|---|--------|-------|---------|----------------|")
    for pillar, slug, prefix, _ in PILLARS:
        items = [r for r in rows if r["Pillar"] == pillar]
        mods = sum(int(r["Modules"]) for r in items)
        lvls = sorted({r["Level"] for r in items})
        lines.append(f"| {slug[:2]} | [{pillar}]({slug}.md) | {len(items)} | {mods} | {', '.join(lvls)} |")
    lines.append("")
    lines.append("## The four levels")
    lines.append("")
    for lvl in ("1", "2", "3", "4"):
        title, desc = LEVELS[lvl]
        n = sum(1 for r in rows if r["Level"] == lvl)
        lines.append(f"- **{title}** — {desc} ({n} items)")
    lines.append("")
    lines.append("## Pillar × level matrix")
    lines.append("")
    lines.append("| Pillar | L1 | L2 | L3 | L4 |")
    lines.append("|--------|----|----|----|----|")
    for pillar, slug, prefix, _ in PILLARS:
        items = [r for r in rows if r["Pillar"] == pillar]
        cells = []
        for lvl in ("1", "2", "3", "4"):
            ids = [r["ID"] for r in items if r["Level"] == lvl]
            cells.append(" ".join(ids) if ids else "—")
        lines.append(f"| [{pillar}]({slug}.md) | {cells[0]} | {cells[1]} | {cells[2]} | {cells[3]} |")
    lines.append("")
    lines.append("## Suggested order")
    lines.append("")
    lines.append("Entry points (no prerequisites): " +
                 ", ".join(f"**{r['ID']}**" for r in rows if not r["Prereqs"]) + ".")
    lines.append("")
    lines.append("1. **Start on the slab.** E1 first — nearly half the catalog lists it upstream.")
    lines.append("2. **Foundations before numbers.** F1 → F2 → F3, then N1 → N2 → N3.")
    lines.append("3. **Level gates are capabilities, not badges.** `src/gate.js` grades each level "
                 "on a real parcel; the metric that matters is the certainty-error count, not the score.")
    lines.append("4. **The developer route** (`src/routes.js`) reorders the same lessons by the six "
                 "development gates — cheapest and most reversible step first.")
    lines.append("")
    lines.append("## Full index")
    lines.append("")
    lines.append("| ID | Title | Pillar | Level | Kind |")
    lines.append("|----|-------|--------|-------|------|")
    slug_of = {p: s for p, s, _, _ in PILLARS}
    for r in rows:
        lines.append(f"| {r['ID']} | {r['Title']} | [{r['Pillar']}]({slug_of[r['Pillar']]}.md) | {r['Level']} | {r['Kind']} |")
    lines.append("")
    lines.append("## Regenerating")
    lines.append("")
    lines.append("These files are emitted from the CSV. To regenerate after a curriculum change, "
                 "re-run `python3 curriculum/gen_courses.py`, or "
                 "rebuild the tables from `curriculum-50.csv` — then run `python3 curriculum/validate.py` "
                 "before committing.")
    with open(os.path.join(OUT, "README.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("wrote README.md index")

if __name__ == "__main__":
    main()
