# Generative video — where it may appear, and where it never will

This platform's hardest rule is that it never fabricates a row, a coordinate, a
price or a use class ([`CLAUDE.md`](../CLAUDE.md)). Generative video is the one
capability that could break that rule without anyone noticing, because **a
synthesized picture of a real address is a stronger claim than a fabricated
number, not a weaker one** — it is more persuasive, harder to caveat, and it
survives being screenshotted away from every disclaimer attached to it.

So the boundary is decided once, here, and enforced by a gate.

## The line

| | |
|---|---|
| **Allowed** | Academy and brand material where nothing is depicted as a real place: title sequences, course openers, abstract architecture, light and landscape. |
| **Never** | Any generative picture attached to a parcel record, a property, an address, a real building, a real person, or a named real place — including a real city, county, parish or state. |

The existing **Render video reel** in the Underwriting tab is not generative and
is not affected. It is drawn on a canvas from the case's own measured numbers
(`src/uwexport.js` `exportReel`) — the address, the recorded price and its
basis, the metrics — and recorded with `MediaRecorder`. It depicts no place. It
is the model of what a property-facing video is allowed to be on this platform:
a rendering of the record, not an imagining of the asset.

## What is built

[`content/academy_scenes.json`](../content/academy_scenes.json) holds five scene
pairs for Academy title sequences, rendered to
[`ACADEMY_SCENES.md`](ACADEMY_SCENES.md) by
[`scripts/build_scenes.py`](../scripts/build_scenes.py). Each pair is an
**initial** prompt and an **evolution** sent mid-run, written to the model's own
steering rules.

Nothing connects to a model. There is no credential in this repository and no
runtime dependency in any edition: the library is text, and text is reviewable,
diffable and gated without a network. Running it needs a Reactor JWT the
platform owner supplies.

## What the gate enforces

`scripts/build_scenes.py` refuses to build, and `tests/run.py` fails, if a scene:

- **names a real place.** The vocabulary is built from the repository's own data
  — the state table, every county and parish named in
  [`states/coverage/`](states/coverage/), and the city list `src/app.js` ships —
  so it grows as coverage does and cannot go stale. Words that are both real
  places and ordinary English (`orange`, `plain`, `mobile`, …) are excluded, and
  the exclusions are named in the source rather than silently dropped.
- **reads like a street address.**
- **mentions a record** — parcel, listing, assessed, for sale.
- **is a tagline rather than a paragraph** (under 45 words). A terse prompt makes
  the model invent the rest every chunk and the picture drifts.
- **asks for more than one shot** — cut to, montage, meanwhile. The model
  generates a single unbroken take per prompt.
- **fails to re-establish its world** before morphing: an evolution must restate
  the setting and the camera ("the same …") and carry the distinctive words of
  the opening sentence, which is what makes a mid-run morph read as
  cinematography rather than a glitch.

Each of those was proven by writing a scene that breaks it and watching the
build refuse by name.

## The model, as measured from this container

| Fact | Measured |
|---|---|
| `@reactor-models/visko-orbis-stable` on npm | version **2.3.0** — matches the reference we were given |
| `registry.npmjs.org` | reachable (200) |
| `docs.reactor.inc` | **not reachable** from this container (000, probed 2026-09-12) |
| The published Agent Skill | fetched over `raw.githubusercontent.com` (200); `github.com` HTML returns 403 through the proxy |

The authoritative prose docs could not be read from here. The prompt rules above
come from the published skill, which was fetched and read.

## If this is ever revisited

Two things would have to change before generative video could touch a property,
and both are the platform owner's call rather than an implementation detail:

1. a labelling scheme that survives the picture being separated from the page,
   since that is the failure mode a disclaimer does not cover; and
2. an answer to what the video is *for* that is not "make the listing look
   better", because that is the purpose the non-fabrication rule exists to
   refuse.

Until then the gate holds.
