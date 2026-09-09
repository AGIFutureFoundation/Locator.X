# Instructor notes — the authoring guide (roadmap v1.3, first tier)

The annotation layer exists in the app (`src/notes.js`) and **ships empty by design**: the
platform asserts no words, biography or endorsement not supplied by the platform owner, and
an empty layer renders as nothing rather than as a placeholder pretending to be a note.
That founding rule is why this guide contains **no drafted note copy** — it is the paved
road for the person whose byline the courses carry to write their own, and have every
anchor machine-checked before anything ships.

## What a note is

A practitioner speaking in a visibly different register from doctrine text, one or two
sentences, attached to a stable anchor:

```js
{ on: 'lesson', id: 'invdev.i6', by: 'Chris Barideaux',
  body: 'One or two sentences, in the instructor's own words.' }
```

| `on` | `id` vocabulary | Example |
|------|-----------------|---------|
| `'lesson'` | `track.lesson` — track key + lesson id from the shipped modules | `found.f1`, `read.r2`, `equity.q3`, `evidence.e4`, `wider.w1`, `invdev.i6`, `zone.z2`, `lab.x3` |
| `'gate'` | a LOCATOR letter: `L O C A T O2 R` | `T` |
| `'stage'` | a developer-route stage: `site feas ent fin build stab` | `feas` |

The live track keys and lesson ids come from the modules themselves — list them any time
with `node curriculum/extract_tracks.js` (the `lessonIds` field). Never guess an id: the
build gate (check 8) fails on an anchor that resolves to nothing, and a bodyless note
fails the same check.

## The supply workflow

1. Write notes into the `NOTES` array in `src/notes.js` — supplied copy goes there and
   nowhere else.
2. `node curriculum/extract_tracks.js` — confirms the notes parse and the anchors exist.
3. `python3 curriculum/validate.py` — check 8 goes from *"none supplied yet"* to a counted
   note set; any broken anchor or empty body raises.
4. Update the **expected output block in `README.md`** (the quick-start shows the "none
   supplied yet" line verbatim — it must change in the same commit, or CI's honest-output
   story breaks).
5. Rebuild and fleet-sweep the editions per the README's Verification section.

## Prioritizing: use the queue, not a list of 92

`src/notes.js` is half mechanism, half **queue**: in the app it reads what learners
actually recorded — certainty errors first (the one habit the Academy exists to break),
then gate disagreements, unsourced thesis figures, skipped route stages, failed drills —
ranks where a practitioner's note is worth the most, and exports that queue as markdown
to write against offline. When telemetry exists, the queue beats any editorial guess,
including the worksheet below.

## First-tier worksheet: the ten Level-1 items

The roadmap's first tier is one note per Level-1 course. For each, the anchor to use and
the question the note is best placed to answer — *prompts to write against, not words to
adopt*. Confirm each lesson id against `extract_tracks.js` output before anchoring
(item order and lesson order usually align, but the module is the truth).

| Item | Course | Suggested anchor | The question a practitioner can answer that doctrine cannot |
|------|--------|------------------|-------------------------------------------------------------|
| E1 | Emotional equity: the balance sheet nobody keeps | `equity.q1` | What did a real trust withdrawal cost you, and how long did the redeposit take? |
| E2 | The relationship map | `equity.q2` | Which of the eight people did you underestimate on your first deal? |
| F1 | How a building pays you | `found.f1` | Which of the four income streams did you once treat as interchangeable, and what did it cost? |
| F2 | Asset or liability: the Locator.X test | `found.f2` (or gate `A`) | What did a "position, not an asset" look like the day you realized it? |
| F3 | Income you work for | `found.f3` | When did you discover you had bought a job? |
| F5 | Reading Locator.X | gate `R` (or the Evidence tab's lesson anchor) | What convinced you to trust a tool that says "unknown"? |
| N1 | NOI, and the four things people leave out | `read.r1` | Which of the four omissions have you actually been burned by? |
| N2 | Cap rate is a market opinion | `read.r2` (or gate `O2`) | Whose cap rate priced your exit, and how different was it from your model? |
| A1 | Introduction to the real estate industry | `wider.w1` | What did you wish someone had told you about who actually pays whom? |
| A2 | The five commercial classes | `invdev.i2` | Which class did you learn is a different business the hard way? |

## What done looks like (roadmap §6)

Check 8 reports a counted, non-zero note set with zero unresolved anchors; the README's
expected output block matches; the fleet sweep is green. Ten notes is the tier — the
queue decides what comes after.
