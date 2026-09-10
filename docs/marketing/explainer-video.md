# The explainer video — production record

*Production of 2026-09-10, run by the Foundation over the Higgsfield pipeline. This file is
the durable record of what was locked and what exists, so the production can be resumed or
regenerated without re-deriving anything. It records a marketing artifact; nothing here is
platform data, and the platform's no-advice rule applies to the video's own script (its
closing line says so on screen).*

## What the video is

A two-minute, twelve-block narrated explainer of the platform: evidence-first screening,
the seven LOCATOR gates, unknown-is-an-answer, the four asset classes and their underwriting
(apartments' DSCR 1.20 solver, hotels' nightly-lease volatility and quoted storm insurance,
student housing's campus ring), Louisiana as the proving ground (125,803 parcels across
Orleans and Jefferson; the New Orleans non-disclosure honesty), conversion stock with
restoration abatements and historic credits, and the closing turn: refusing to answer is
the feature. 16:9, 2K blocks, one narrator voice, burned subtitles.

## The visual style — from real screenshots, by decision

The Foundation redirected the style mid-production (2026-09-10): **use screenshots from the
app walkthrough**. The locked look is therefore derived from real captures of the shipped
companion pages — warm cream paper, ivory interface cards, data tables and bar meters,
forest-green and burnt-sienna accents — with on-screen lettering abstracted (video models
garble rendered text; the narration and subtitles carry the words). The captures came from
the pages as committed, taken the way [`scripts/shoot_pages.js`](../../scripts/shoot_pages.js)
now reproduces them; the style donors were the Louisiana developer brief, the pitch deck's
method slide, and its registry slide.

What this is not: a screen recording. The pipeline generates motion-graphics scenes anchored
on the real screens; pixel-exact UI capture is a different deliverable (and would need a
built edition plus the data tree).

## The locked narration (final wording, as measured)

Each line is one 10-second block; wording below is what passed the speech gates
(7.8–9.5 s spoken, no internal pauses, rate ceiling), so subtitles must use it verbatim.

1. Most property maps show you listings. Locator X shows you evidence, every parcel screened against the public record before anyone falls in love.
2. Seven gates spell locator, from location and ownership through cash flow and terms to outlook and record, every gate passing on evidence.
3. When the record cannot answer, the platform says unknown instead of guessing, because claiming false certainty is the one error it counts.
4. Hotels, apartments, multifamily and student housing are four businesses in one zoning word, and lease length sets the risk.
5. For apartments the survival number is coverage. The solver pins debt service at one point two and asks which rent level breaks you.
6. A hotel signs a new lease every night, so underwriting runs on revenue swings and quoted storm insurance, not imaginary rent rolls.
7. Student housing prices by the campus ring, so you draw the walking distance from the university gate, and the map reveals every dormitory bed inside. *(take pending — see state)*
8. Louisiana is the proving ground, where one edition maps one hundred twenty-five thousand parcels across Orleans and Jefferson along the river crescent.
9. New Orleans hides its sale prices. The comps desk refuses to guess there, so income, permits, and assessments carry the valuation honestly.
10. The opportunity lives in conversion stock, where restoration abatements freeze the property tax bill while stacked historic credits turn empty offices into housing math.
11. The turn is this, refusing to answer is the feature, and a tool that admits ignorance earns real lasting trust.
12. The top property is not the prettiest listing. It is the parcel whose record survives seven gates, education here, never investment advice.

Every figure the script asserts traces to this repository:
[`docs/OVERVIEW.md`](../OVERVIEW.md),
[`docs/states/coverage/louisiana.md`](../states/coverage/louisiana.md),
[`docs/asset-classes/README.md`](../asset-classes/README.md).

## Production state (as of 2026-09-10)

| Layer | State |
|---|---|
| Intake, style key, 15 assets | complete (style + assets regenerated after the screenshot redirect) |
| Motion script | locked, validator `valid: true`, narration sha `7b858e6d…` |
| Video blocks (12 × 10 s, 2K) | **9 of 12 rendered** — blocks 2, 11, 12 pending |
| Narration (voice: Benji) | **11 of 12 takes passed** the speech gates — block 7 retake pending |
| Assembly, subtitles, delivery | not started (needs the four pending generations first) |

The stop was external and is measured, not guessed: the Higgsfield workspace ran out of
credits mid-batch (balance 1.16 on the Plus monthly plan, checked 2026-09-10). The four
missing generations resume from the session's recorded job ledger; nothing completed needs
regenerating.

## Resuming

Say "resume the video" in a session that holds the production ledger, after topping up the
Higgsfield workspace. The remaining work is: 3 video blocks, 1 narration retake, then the
sandbox-side assembly, caption burn and delivery (which cost no generation credits).
