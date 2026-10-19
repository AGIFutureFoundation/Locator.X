# The environment layer — what is drawn, what is derived, what is rendered elsewhere

Everything in an edition that looks like a place — the 3D massing, the room program, the
block in AR, the tower field, the title sequences behind the Academy, the voices in the hive —
sits on top of the same public record the tables do, and it is held to the same rule: nothing
on screen says more than the record supports. A picture is the easiest place to break that
rule, because a drawn building reads as a real one, so this page says of every drawn thing
where it came from. Every count here was measured by a command listed at the end.

---

## Contents

1. [Three kinds of thing on screen](#1-three-kinds-of-thing-on-screen)
2. [The scene library](#2-the-scene-library)
3. [The hive](#3-the-hive)
4. [The lesson chips](#4-the-lesson-chips)
5. [What this layer cannot honestly do](#5-what-this-layer-cannot-honestly-do)
6. [What checks it](#6-what-checks-it)
7. [Measurements](#7-measurements)

---

## 1. Three kinds of thing on screen

The Twin tab's own lede (`src/body.html`) sets the vocabulary every module below uses:
each field is labelled **recorded** (the jurisdiction publishes it), **derived** (computed from
recorded values) or **schematic** (a regional convention used only to draw a picture).

| Kind | What it is | Examples |
|------|------------|----------|
| **Recorded** | A value the jurisdiction publishes, shown as published | A point on the map; a storey count; a heated area; a bedroom count; the value the county assesses |
| **Derived** | Computed from recorded values by a stated rule | A massing footprint (recorded area ÷ storeys); a tower's height (a metric at the replay month); a room program (recorded counts and areas through published space standards) |
| **Schematic** | A convention used only so there is something to draw | A box in AR; a roof form; a prompt for a title sequence; a persona's voice |

Each module states its own kind on its own page. Quoted, so the boundary is theirs and not
this page's paraphrase:

- **`src/twin.js`** — the 3D twin. *"Buildings are PROCEDURAL: footprints are estimated from
  assessor living area, stories and lot size — massing models, not surveyed geometry."* The
  catalog card under every site repeats it in the app: *"Massing is procedural (assessor sf ÷
  stories), not surveyed."*
- **`src/rooms.js`** — the room program. *"Nobody has walked these buildings."* Every line is
  *"tagged RECORDED, DERIVED or SCHEMATIC, and nothing is stated that the source does not
  support. A property with no bedroom count gets no bedroom list — it gets a sentence saying
  the county does not publish one."* The area shares are *"planning rules of thumb, stated as
  such, not measurements of this building."*
- **`src/ar.js`** — the block in your room. *"This is NOT a scan of the building and NOT a
  model of it. It is the SAME schematic massing the 3D tab draws."* The page says it before the
  block opens: *"This is a SCHEMATIC BLOCK, not the building. Nobody has scanned or modelled
  this property."* The module is careful for a stated reason: a number in a table that says
  derived is read as derived; *"the same number extruded into a solid object standing on your
  floor at 1:1 reads as measured."* So the provenance is drawn in the scene, the block is a
  translucent shell, and the word SCHEMATIC is on it.
- **`src/towers.js`** — the property tower signal. Height is a metric you pick (13 of them),
  colour is the category, and the footprint is built around the record's own coordinate. It is
  viewport-aware and says so: *"the legend always says how many of how many you are looking at,
  because a tower field that silently truncates is a lie."*
- **`src/dash3d.js`** — the opportunity cube and the market skyline, *"drawn on canvas from the
  live filtered data … No external 3D library."* The cube draws the first 900 ranked
  candidates, not all of them, and that cap *"is stated next to the cube now"* — it used to be
  silent under a heading that said "every candidate".
- **`src/canvasmap.js`** — the *"dependency-free fallback renderer for the built-in vector
  basemap"*: the same map, drawn on a 2D canvas when WebGL is not there.

None of these loads a 3D engine, fetches a tile the edition did not ship, or draws a shape the
record did not give it a number for. Where the record is silent, the drawing is too: a parcel
with no area and no storeys gets no block in AR (`LXAR.boxFor` returns nothing, and the chip
that would open it is not drawn).

## 2. The scene library

The Academy's title sequences are **prompts, not pictures**. The library is
[`../content/academy_scenes.json`](../content/academy_scenes.json): **21 scene pairs** — 5
`title` sequences that open an Academy pillar, 4 `exterior` and 5 `interior` scenes behind
Trade School tracks and pillars, and 7 `avatar` presences, one per persona. Each pair is an
*initial* prompt and an *evolution* sent mid-run, written as one continuous take
([`ACADEMY_SCENES.md`](ACADEMY_SCENES.md) is generated from it; the rules the prompts follow
are in [`GENERATIVE_VIDEO.md`](GENERATIVE_VIDEO.md)).

**The no-real-place gate.** `scripts/build_scenes.py` refuses to build, and `tests/run.py`
fails, if a scene names a real place, reads like a street address, mentions a record, is a
tagline rather than a paragraph, or asks for more than one shot. The place vocabulary is built
from the repository's own data — the state table, every county and parish in
[`states/coverage/`](states/coverage/), the city list the app ships — so it grows as coverage
does. The library's own line, carried into every edition as `the_line`: *"Nothing here depicts
a real place, a real building, a real person or a real property. Generative video never
attaches to a parcel record on this platform."* All seven avatar scenes say, in both halves of
the pair, that the figure is *seen from behind* or that *no face is shown*.

**Where a render would live.** Renders are produced **outside this repository**, against a
model the library names, with a credential the platform owner supplies at runtime — *"none is
stored in this repository"*, and no edition carries a runtime dependency on the model. A render,
when one exists, is stored outside git in the data tree like every other large artefact, and
the only thing the repository will carry about it is its **scene id and the date it was made**.
Inside the app, `src/scenecards.js` shows the prompts as text cards beside the track or persona
they back — *"TEXT ONLY. Nothing here is an image or a video … this module does not reference,
embed or fetch one"* — and every card ends with the library's boundary sentence.

**None exist yet.** Measured on the date below: there are **0** raster or video files under
`brand/` or `content/`; the only images in either tree are the three SVG logos in `brand/`,
none of which is a scene. The scene library is a complete, reviewable set of prompts with no
output, and this page will say so until a render is made and recorded by id and date.

## 3. The hive

The hive console on Home gives each agent in [`company/AGENTS.md`](company/AGENTS.md) a voice.
**Seven personas**: the six agents in the AGENTS table — Scout, Diligence, Underwriting,
Acquisitions, Development, Portfolio Learning — plus the app-wide guide. A persona is a way of
*reading* an agent's output aloud — a rate, a pitch, a tone, an opening line that states the
agent's boundary, and a list of things it never says. In `src/personas.js`'s words: *"It is not
a capability: nothing here lets an agent do anything AGENTS.md forbids, and nothing here puts
words in an agent's mouth."* The only text a persona ever utters unprompted is its own opening
line, and that line is its boundary.

- **The validator.** `scripts/validate_personas.py` holds every persona's scope, boundary and
  status to the AGENTS.md table word for word, bans the vocabulary of a pitch from role, tone
  and opening line (*good deal*, *you should*, *guaranteed*, *motivated*, *will appreciate*,
  *buy now*, *offer now*), bounds rate and pitch to 0.8–1.2, and diffs the copy embedded in
  `src/personas.js` against [`../content/agents/personas.json`](../content/agents/personas.json)
  — one source of truth, checked.
- **Browser-only speech.** `src/voice.js` reads with `window.speechSynthesis`, *"which is built
  into the browser and runs without a network request in every engine that ships it"*. A persona
  changes how a block is read, never what it says. Where there is no engine, `speak` returns
  `false` and *"nothing is simulated"*. The one capability that does leave the device is
  disclosed on the page rather than discovered: dictation, where the browser implements it,
  is Chrome sending audio to Google's recognition service; where the browser does not implement
  it, the mic control does not render.
- **The external preset id.** One persona, the guide, carries an `external_preset_voice_id`.
  It is *"data for pre-rendered narration outside the app: nothing in the app reads it, sends
  anything, or names an engine other than the browser's."* It sits in the JSON as an inert
  string so that narration recorded elsewhere can be matched to the voice the app describes; the
  validator fails the build if any other persona acquires one.

## 4. The lesson chips

A Trade School lesson names a real listing from the edition and writes one sentence about it.
`src/lessonmap.js` puts **four chips** after that sentence so the learner can go and look at
the record the lesson used: *Open on map*, *Massing in 3D*, *Room program (derived)*,
*Massing in AR*. Three of the four open a drawn view, and each of those says what it is
in its own label or title — *massing* or *derived* — so the button does not promise more than
the view delivers. Every chip is feature-detected at render time **and** at click time: a chip
is never drawn for a view the edition hides or a module the build did not ship, and a click
that finds the view gone says so in a toast instead of failing silently. The only listing field
the module reads is `id`; nothing from the record is displayed by the chip itself.

## 5. What this layer cannot honestly do

- **Show a real building.** Every block is a footprint from area ÷ storeys and a height from
  storeys × a typical floor-to-floor. No elevation, no roof, no facade is measured; the shape is
  a convention and is labelled one.
- **Show a face.** The avatar scenes are figure-presences seen from behind or in silhouette;
  the gate reads both halves of every pair. No persona has a likeness.
- **Speak a sentence the app did not already hold.** A persona reads the help, the lesson, the
  answer that is on the page. `speak(id, text)` prefixes nothing and appends nothing, and there
  is no engine behind it that composes.
- **Decide anything.** Nothing drawn here feeds a score, a gate or a recommendation. The twin,
  the room program, the AR block and the scenes are ways of looking at the record, and the
  record is what the platform scores. An agent proposes; a person decides
  ([`company/AGENTS.md`](company/AGENTS.md)).

## 6. What checks it

| Check | What it holds |
|-------|---------------|
| `tests/env_check.js` (`tests/run.py` 12e) | Every chip that opens a drawn view says *massing* or *derived*; the shipped scene count equals the library's; every avatar scene shows no face in both halves; every persona has a non-empty *never says* list and no pitch phrase in its opening line; the scene card's note names the no-real-place boundary; and `personas.js`, `lessonmap.js` and `scenecards.js` contain no `fetch(`, `XMLHttpRequest` or `WebSocket` |
| `scripts/validate_personas.py` (12d) | Personas bounded by AGENTS.md verbatim; embedded copy equals the JSON |
| `scripts/gen_scenes_js.py --check` (12d) | `src/scenes_data.js` is exactly what the JSON generates |
| `scripts/build_scenes.py` | No scene names a real place, an address or a record; `ACADEMY_SCENES.md` is not stale |

## 7. Measurements

Measured 2026-10-19, from the tree as committed:

- 21 scenes, 5 title / 4 exterior / 5 interior / 7 avatar —
  `python3 -c "import json,collections;d=json.load(open('content/academy_scenes.json'));s=d['scenes'];print(len(s),dict(collections.Counter(x['kind'] for x in s)))"`
- 7 avatar scenes faceless in both halves —
  `python3 -c "import json;d=json.load(open('content/academy_scenes.json'));print(sum(1 for s in d['scenes'] if s['kind']=='avatar' and all(('no face is shown' in s[k]) or ('seen from behind' in s[k]) for k in ('initial','evolution'))))"`
- 7 personas — `python3 -c "import json;print(len(json.load(open('content/agents/personas.json'))['personas']))"`
- 6 agents in the AGENTS table — `grep -c "^| \*\*" docs/company/AGENTS.md`
- 1 persona with an external preset id (the guide) —
  `python3 -c "import json;P=json.load(open('content/agents/personas.json'))['personas'];print([p['id'] for p in P if p['voice'].get('external_preset_voice_id')])"`
- 4 lesson chips — `grep -c "^  {label:" src/lessonmap.js`
- 13 tower metrics — `grep -c "^ \['" src/towers.js`
- 900 candidates drawn by the cube — `grep -n "^const CUBE_CAP=" src/dash3d.js`
- 0 raster or video files under `brand/` and `content/` —
  `find brand content -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o -iname '*.gif' -o -iname '*.mp4' -o -iname '*.webm' -o -iname '*.mov' \) | wc -l`
- 0 network calls in the hive, chip and scene-card modules —
  `grep -c "fetch(\|XMLHttpRequest\|WebSocket" src/personas.js src/lessonmap.js src/scenecards.js src/voice.js`
