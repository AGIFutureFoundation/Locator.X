# Market intelligence — the register, the gap, the roadmap

Three documents, in the order they have to be read. They exist because a research
report arrived full of competitor pricing and product recommendations, and a report
is not evidence. Turning it into repository artifacts means each claim in it now
carries a source, a status and a check.

| Document | What it is | Its rule |
|---|---|---|
| [`LANDSCAPE.md`](LANDSCAPE.md) | 25 tools investors buy, with pricing **as reported**, each row carrying its source and a status from a five-word vocabulary | Until a row is `verified`, no public Locator.X material may quote its figure as fact |
| [`GAP.md`](GAP.md) | That register set against what this repository measurably ships, module by module, plus what the platform **refuses** to build | Every "ships" claim names a file and its line count |
| [`PREMIUM_ROADMAP.md`](PREMIUM_ROADMAP.md) | The feature and integration plan that follows, in three phases | Every item names its proof, its blocker, and the cost of getting it wrong |

`scripts/validate_landscape.py` enforces all of it and runs in `tests/run.py`. It fails
the build on a priced row with no source link, a status outside the vocabulary, an
undated `verified`/`changed`, a figure surviving in an `unsourced` row, counts that
disagree with the table, a module credited with a capability that does not exist, or a
line count that has drifted from the file.

**Not to be confused with `market/` at the repository root**, which is the *measured*
market layer — figures extracted from the shipped editions and rendered into the public
market pages, governed by `market/validate_market.py`. That directory holds this
platform's own measurements. This one holds claims about other people's products, which
is why every row here says who said it and when.

**Nothing in these three files is verified.** Five vendor hosts were probed from the
development container on 2026-09-15 and every one returned `000`; the same egress wall
the county-records work runs into. The register says so on every row rather than in a
footnote, and the honest status of the whole directory is *reported, awaiting a desk
session with a browser*.
