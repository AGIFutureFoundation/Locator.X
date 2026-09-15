# Investor reporting and public-benefit reporting

Reporting is where "disciplined governance" stops being an adjective. A group that reports
the same sections every quarter — including the quarters that went badly — is
demonstrating the thing every other page here only claims.

## Quarterly investor report

To major equity investors, same sections every time, in this order:

| Section | Contents |
|---|---|
| Executive summary | Major wins, **misses**, decisions taken, next-quarter priorities |
| Cash and runway | Cash balance, burn rate, runway, financing plan |
| Revenue | ARR/MRR, contracted revenue, pipeline, churn and renewal, gross margin |
| Product | Releases, adoption, reliability, roadmap changes, security and accessibility status |
| Customers | Pilots, conversions, use cases, outcomes, retention, key risks |
| Team | Key hires, departures, open roles, advisors |
| Governance | Board decisions, **related-party disclosures**, material contracts, mission reporting |
| Risk register | New, elevated, mitigated and unresolved risks ([`RISK_REGISTER.md`](RISK_REGISTER.md)) |
| Ask | Introductions, customers, partners, expertise, hiring referrals |

Two sections carry more weight than their length suggests. **Misses** belong in the
executive summary, not in a footnote — an update with no misses is an update nobody
believes twice. **Related-party disclosures** appear every quarter whether or not there is
anything to report, because a section that appears only when it is empty teaches everyone
what a non-empty one means.

## Public-benefit report

Published or provided to stockholders **annually**, ahead of the biennial Delaware
statutory cadence ([`MISSION_RIGHTS.md`](MISSION_RIGHTS.md)):

- public-benefit objectives
- the defined impact metrics, and the standard used to measure them
- programme outputs and outcomes
- accessibility and equitable-access measures
- AI safety and governance activity
- fellowship, scholarship and community-impact activity
- **material incidents, lessons learned and corrective actions**
- how the board balanced commercial, stakeholder and public-benefit interests

The incidents line is the one that makes the rest credible. An impact report with no
incidents in it is a marketing document, and readers grade it accordingly.

## What reporting may never contain

The rules in [`FUNDING.md`](FUNDING.md) apply to every report, update, deck and email:
no return stated as guaranteed, no projection presented as a settled fact, no fund terms
presented as agreed, no solicitation, and never an implication that an interest in one
entity carries economics in another. `scripts/validate_company.py` lints this repository
for all of it; the same discipline applies to material that never reaches the repository,
where the only enforcement is the person writing it.

## The standard this is held to

The goal is not to make AGI appear risk-free. It is to show that the people running it
know **where risk lives, who owns each risk, how capital is protected from cross-entity
confusion, and what objective milestones must be met before more capital is spent or
raised.** A reader who finishes these pages should be able to state what they would own,
what it funds, who decides, where returns come from, and what would have to go wrong for
them to lose it. If any of those five is unclear, the document has failed, not the reader.
