# Contributing to Locator.X

Contributions are welcome. The project runs on a small number of non-negotiable rules that
exist because real bugs got through without them — read this once and the review process will
make sense.

## The doctrine, as rules

1. **Measure before asserting.** A claim about size, cost, coverage or performance ships with
   the measurement that supports it. The project once blocked content growth over "several MB
   per edition" that measured at 104.8 KB; that mistake is why this rule is first.
2. **Unknown is an answer.** Code and content must never convert an unanswerable question
   into a quiet pass. A gate the record cannot answer returns unknown; a doc that cannot cite
   a source says so. Claiming certainty without ground is the one error we count separately.
3. **The curriculum is data.** `curriculum/curriculum.py` is the single source of truth.
   Never edit derived views by hand (`curriculum/courses/` is generated — run
   `python3 curriculum/gen_courses.py`); never store what can be derived (an item's status is
   computed by `status_of()`).
4. **Sources with dates.** Every factual row added to `docs/states/` or `docs/resources/`
   names what question it answers and its failure mode, and the file's *last reviewed* date
   moves when you verify. State-specific facts live in the state guides; national layers and
   taxonomies live in resources.
5. **No PII, ever.** Upstream property feeds carry owner names and mailing addresses; they
   are stripped on ingest and the `data/` tree stays out of git (history cannot be cleaned).
   A PR that commits data mirrors will be closed regardless of intent.

## Before you open a PR

```bash
python3 curriculum/validate.py     # the eight-check gate — must pass
python3 scripts/check_links.py     # every relative markdown link must resolve
node curriculum/extract_tracks.js  # if you touched Academy modules
```

CI runs the first two on every push and PR; a red check is a real failure, not a flake —
the validator raises rather than warns by design.

## What makes a good change

- **Small and sourced.** One concern per PR; docs changes cite where the fact came from.
- **Edition-safe.** If you touch `src/`, note which editions you rebuilt or why none needed
  it; the Playwright fleet sweep is the standard of proof for app changes.
- **Consistent voice.** Docs are written in complete sentences, name their failure modes,
  and say "verify before relying" where practice varies by county — match the register of
  the file you are editing.
- **No advice.** Nothing here is legal, tax, securities or investment advice; contributions
  that read as recommendations rather than navigation of the public record will be asked to
  reframe.

## Licensing of contributions

By contributing you agree your code contributions are licensed under the
[Apache License 2.0](LICENSE) and your documentation/content contributions under
[CC BY 4.0](LICENSE-docs), per the split described in the README's Licence section. Keep
third-party text out entirely — course material is original to Locator.X, and topic coverage
being standard is not a licence to copy anyone's syllabus, slides or prose.

## Questions

Open an issue. For anything touching the attribution and scope section of the README or the
no-affiliation notices, tag it for Foundation review — those statements are maintained
deliberately and change only by explicit decision.
