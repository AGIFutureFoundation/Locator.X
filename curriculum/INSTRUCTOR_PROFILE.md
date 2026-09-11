# The instructor profile — the authoring guide

The courses carry a byline: **Custom training by Chris Barideaux**. This is the paved road
for the profile that introduces that person and leads a reader into the curriculum.

Like the annotation layer in [`INSTRUCTOR_NOTES.md`](INSTRUCTOR_NOTES.md), it **ships empty
by design**, and for the same reason, stated there as the founding rule:

> the platform asserts no words, **biography** or endorsement not supplied by the platform
> owner, and an empty layer renders as nothing rather than as a placeholder pretending to
> be a note.

That rule is why this guide contains **no drafted profile copy**. A biography is a set of
claims about a real person — what they built, who they led, what they played, what it
meant. Those claims are true or false about someone's actual life. The platform that
refuses to invent a parcel's sale price does not get to invent a person's history, and a
draft written to be corrected later is worse than a blank, because a draft is what gets
published when everyone is busy.

## What the profile is for

A reader arriving at a fifty-course curriculum needs to know why this instructor. Not a
résumé — a reason to trust the material. The sections below are the shape we think answers
that; the words are his.

## The shape

`content/instructor-profile.json`:

```json
{
  "supplied": true,
  "name": "Chris Barideaux",
  "role": "one line — how he describes what he does",
  "lede": "two or three sentences a reader meets first",
  "sections": [
    { "heading": "Community", "body": "his own words" },
    { "heading": "Leadership", "body": "his own words" },
    { "heading": "Basketball", "body": "his own words" },
    { "heading": "Why this curriculum", "body": "the lead-in to the courses" }
  ],
  "references": [
    { "what": "the claim this supports", "where": "publication, organisation or record",
      "url": "optional", "date": "YYYY-MM" }
  ]
}
```

Every field is his to write. The `sections` array is free — add, drop or rename any of
them.

## The one rule that is not stylistic

**`references` is where a checkable claim earns its place.** The platform's governing rule
is *measure before asserting*, and it does not get suspended for prose about a person.

- A claim about a *feeling, a value or a motive* — why he coaches, what he thinks the trade
  owes a neighbourhood — is his to state and needs no reference. It is a first-person
  statement and reads as one.
- A claim about a *checkable fact* — a role held, a programme founded, a season, a title, a
  number of people served — should carry a reference, so a reader who wants to verify can.

This is the same standard the record layer applies to a parcel and the case layer applies
to a disputed claim. It is not scepticism about the author; it is the thing that makes the
rest of the platform's claims worth anything.

## The supply workflow

1. Write the profile into `content/instructor-profile.json` and set `"supplied": true`.
2. `python3 scripts/build_blog.py --check` — fails on a supplied profile with an empty
   `lede`, an empty section body, or a reference missing its `what`.
3. `python3 scripts/build_blog.py <site>` — renders `articles/instructor.html` and links it
   from the article index as the lead-in to the courses.
4. `python3 tests/run.py` — the profile check runs inside the doctrine suite.

Until step 1 happens, the build writes no profile page and the courses keep their byline
with no biography attached — which is the honest state, not a missing feature.
