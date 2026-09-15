# The Locator.X mark

The sources live here; the PNGs do not. `node scripts/build_brand.js <out-dir>`
renders them, the same way every other derived thing in this repository is
generated rather than committed.

| File | What it is |
|---|---|
| [`locator-x-mark.svg`](locator-x-mark.svg) | The mark alone — app icon, avatar, favicon |
| [`locator-x-logo.svg`](locator-x-logo.svg) | Horizontal lockup for light grounds |
| [`locator-x-logo-dark.svg`](locator-x-logo-dark.svg) | The same lockup for dark grounds |
| [`cover.html`](cover.html) | The cover image, authored as a page so the type is real type |

## What the mark says

An X over a dot. The X marks the spot, and the dot at the crossing is **the
record** — the thing the platform will not draw without. It is the whole
argument of the product in two shapes: a place, and the evidence for it.

The dot's surround is a **knockout**, not a disc painted in the background
colour. The app's own copy of the mark painted it `var(--bg)`, which is the page
ground rather than the card the mark actually sits on, and which does not exist
at all outside the app — so the mark could only be correct in one place. It
composites over anything now.

## Using it

- **Clear space**: one X-height of the mark (28 units at the source scale) on
  every side. Nothing sets inside it.
- **Minimum size**: 24 px for the mark, 120 px wide for the lockup. Below that
  the knockout closes up and the dot stops reading — use the mark alone.
- **Colour**: the green gradient `#37B871 → #1E6B3E` on light grounds,
  `#37B871 → #2C9E5C` on dark. One flat colour is fine where a gradient cannot
  go: `#2C7A4B` light, `#5FBF84` dark.
- **The wordmark** is *Locator.X* — one word, no space, the `.X` in the accent
  colour. Not "LocatorX", not "Locator X", not all caps.

## What not to do

- Do not re-colour the mark to match a campaign. It has one colour family.
- Do not put the mark on a photograph of a building, or beside one. This
  platform does not attach imagery to places it has not measured
  ([`docs/GENERATIVE_VIDEO.md`](../docs/GENERATIVE_VIDEO.md)), and a logo over a
  stock skyline implies exactly that.
- Do not set the tagline in anything but the mono face, and do not change its
  words to a claim: **public-record real estate** is a description, and the
  cover's figures are measured and published.
