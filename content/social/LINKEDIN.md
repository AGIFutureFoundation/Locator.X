<!-- LinkedIn post source. Figures are {{placeholders}} resolved at build time by
     scripts/deck_figures.py, same rule as the investor deck: a number in a public
     post is the least correctable claim a company can make. It gets screenshotted,
     quoted and forwarded, and it cannot be edited in anyone else's feed.

     This file is linted by scripts/validate_company.py along with everything else
     under content/. That matters more here than anywhere: a LinkedIn post is a
     PUBLIC communication, and public solicitation of a securities offering would
     cost the Rule 506(b) exemption the round depends on. Nothing about the round
     goes in a post. Ever. -->

# LinkedIn — the platform and the Academy

Most real-estate software is built to tell you what it knows.

We spent the last stretch building one that can tell you what it doesn't.

That sounds like a small distinction. It isn't. Here's the problem it solves.

Of the {{states_inventoried}} states in our coverage inventory, our record layer carries a dated sale price in {{states_with_sale}}. In the other {{states_without_sale}}, every valuation tool on the market will still hand you a number — confidently, instantly, with a chart. It has to. Its whole pricing model depends on coverage looking complete.

Locator.X won't. If the record can't support a valuation, the screen says so and names the missing input.

We built that into the architecture rather than the marketing:

→ A comparable is a recorded sale with a date, or it isn't a comparable.
→ An assessed value is never presented as a transaction. A strategy priced off one is graded down for it, automatically.
→ Every edition carries a coverage panel stating what that edition CANNOT answer — measured when you open it, not written in advance.
→ {{gates}} continuous-integration gates enforce it. Each one was proven by deliberately breaking the thing it protects.

Where that stands today, measured rather than described:

• {{records}} parcel records live-measured across the shipped editions
• {{coverage_rows}} coverage rows tracked honestly — {{coverage_shipped}} shipped, {{coverage_pulled}} pulled, {{coverage_named}} named, {{coverage_blocked}} blocked, {{coverage_norecord}} with no public record at all
• {{usecodes}} use codes mapped across {{jurisdictions}} jurisdictions, each carrying its source and date
• {{submarkets}} ranked submarkets
• {{modules}} modules, {{module_lines}} lines, shipped as single self-contained files that run with no server

And the part I'd actually point you to: the Academy.

{{curriculum_items}} curriculum items. {{tracks}} tracks. {{lessons}} lessons. It teaches the thing the software is built around — how to underwrite a property when the public record is incomplete, which is most of the time, in most of the country.

Not "here are ten tips." The mechanics: what a comparable actually is. Why an assessment isn't a price. How to read a deal when the county publishes no sale data and the tool on your screen is pretending otherwise. Which questions a record can answer, and which it structurally cannot.

That last skill is the one nobody teaches, because teaching it requires admitting the problem exists.

We also published {{articles}} long-form technical articles on the same principle — every figure in them resolves from measured data rather than being typed into the prose.

If you underwrite property, or you're learning to, I'd genuinely like your read on it. Particularly if you work in a non-disclosure state and have opinions about what the tools get wrong there.

#RealEstateInvesting #PropTech #RealEstateAnalytics #Underwriting #DataQuality
