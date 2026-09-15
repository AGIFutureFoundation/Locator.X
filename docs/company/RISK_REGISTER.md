# The risk register — what we know about, who owns it, and what we did

A risk section written as a disclaimer protects nobody and persuades nobody. Its real
message is *"our lawyer made us say this."* A risk register written properly says
something an investor cannot learn any other way: **that the people running this have
already found the places it breaks, assigned each one to a person, and built something
against it.** That is evidence of governance, and it is the reason this page exists in the
repository rather than in a slide.

So every row carries four things, and a row missing any of them fails the build:

- the **specific** risk, not the category
- **why it matters** — the mechanism by which it costs money
- the **mitigation** that exists or is planned, stated concretely enough to be checked
- an **owner** — a role accountable for it. A risk owned by "the company" is owned by
  nobody

**No row claims a risk is eliminated.** Several of these are permanent conditions of the
business, and the honest mitigation is a control, not a cure.

## How risk is presented, by audience

| Layer | Contents |
|---|---|
| Investor deck | A brief, balanced, non-alarmist summary — the paragraph below |
| Investor memo / data room | This register in full, with mitigation and ownership |
| Legal offering materials | Counsel-reviewed risk factors, conflicts, disclosures and subscription documents |

Material risks are not buried in any of the three.

### The deck paragraph

> **Risk management:** AGI operates in early-stage, regulated, and technically evolving
> markets. Key risks include product execution, AI-model reliability, customer adoption,
> long enterprise sales cycles, data privacy and security, robotics safety, capital
> availability, and mission-governance complexity. We mitigate these risks through a
> phased product roadmap, simulation-first robotics strategy, human oversight,
> standards-based interoperability, separate legal entities and capital pools, rigorous
> data controls, customer-funded pilots, and board-level governance.

## The register

| # | Risk | Specific exposure | Why it matters | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | Early-stage execution | Products take longer or cost more than planned | Delays revenue, raises burn, may force an earlier raise on worse terms | Stage-gated roadmap; narrow initial use cases; quarterly milestone review; 12–18 months runway maintained; paid pilots prioritised | CEO |
| 2 | Market adoption | Customers adopt AI training, simulation, robotics or investor platforms slower than assumed | Delays product-market fit and the revenue that funds the next stage | Start at urgent use cases; sell pilots before platforms; measurable outcomes; sectors with recurring training and compliance need | CEO |
| 3 | Enterprise sales cycle | Procurement, security review, legal review and integration delay contracts | Revenue timing becomes unpredictable even when demand is real | Standing pilot offer; procurement package prepared early; deliberate mid-market and institutional mix | Head of Revenue |
| 4 | Product differentiation | Incumbent LMS, AI, simulation, robotics, CRM and property-data vendors copy visible features | Competitive pressure and lower pricing power | Compete on integrated evidence-based workflows, proprietary content, data models, partner ecosystem and actual-performance learning loops — the things that are expensive to fake | CPO |
| 5 | AI quality and hallucination | Generative output may be incorrect, biased, unsafe or misleading | Most serious in education, governance, cybersecurity and robotics contexts, where a confident wrong answer is acted on | Retrieval from approved sources; constrained agents; human review; model evaluations; monitoring; a correction and appeal path; **no AI-only high-stakes decisions** | Head of AI |
| 6 | AI governance and regulation | AI law, procurement rules, model-provider policy and sector standards change | Raises compliance cost or blocks deployment in a segment | NIST AI RMF-based governance; data minimisation; configurable policy; legal review; model-provider diversification | General Counsel |
| 7 | Data privacy | Learner, customer, worker, property or financial data mishandled or breached | Legal liability, lost trust, contract loss | Encryption; role-based access; MFA; tenant separation; data-processing agreements; retention policy; vendor review; incident response; privacy by design | Head of Security |
| 8 | Cybersecurity | SaaS platforms, AI agents, integrations, APIs and robotics systems are attack targets | Breach, ransomware, unsafe control actions, reputational damage | Secure SDLC; penetration tests; logging; secrets management; least privilege; network segmentation; incident response; third-party assessment roadmap | Head of Security |
| 9 | Robotics safety | Misuse, insufficient training, or malfunction | Physical injury, property damage, liability, insurance exposure | Simulation-first training; site-specific procedures; manufacturer guidance; qualified supervision; emergency procedures; insurance; **no unauthorised operational-certification claims** | Head of Robotics |
| 10 | Hardware and supply chain | Robotics hardware is costly, scarce, incompatible or quickly obsolete | Capex, deployment delay, maintenance cost | Hardware-agnostic platform; leasing and partner labs; OEM integration; no large early inventory; customer-funded equipment where possible | Head of Robotics |
| 11 | Training efficacy | Learners complete modules without improved job performance | Weak renewals and insufficient customer return | Baseline and post-training assessment; practical scenarios; supervisor validation; outcomes study; content iteration; **no unsupported efficacy claims** | Head of Learning |
| 12 | Content quality | Content becomes outdated or misses domain requirements | Safety, trust and procurement risk | Subject-matter review board; versioning; source citations; scheduled review cycles; customer feedback and change management | Head of Learning |
| 13 | Interoperability | SCORM, xAPI, cmi5, LTI, identity, HRIS, LMS or hardware integrations fail or cost more than scoped | Delayed enterprise deployment and higher service cost | API-first design; phased standards support; integration testing; certified partners where justified; standard implementation scope | CTO |
| 14 | Accessibility | Learning and simulation experiences do not meet accessibility needs | Exclusion, legal risk, lost public-sector and enterprise contracts | WCAG 2.2 AA roadmap; testing; captions; keyboard access; screen-reader design; non-XR alternatives; accessibility review | CPO |
| 15 | Property-data quality | Locator.X relies on incomplete, stale, licensed or inconsistent public records | Bad underwriting, customer dissatisfaction, legal claims | Source provenance and per-source grading; freshness labels; confidence scoring; multi-source verification; the in-app coverage panel that states what an edition **cannot** answer; contract controls | Locator.X Lead |
| 16 | Real-estate market | Values, rents, rates, liquidity, insurance cost, construction cost or regulation move | Direct impact on property SPV investors and portfolio economics | Separate SPVs; conservative underwriting; stress tests; reserves; independent appraisal and inspection; **no cross-collateralisation without disclosure** | Head of Real Estate |
| 17 | Capital availability | Future capital is unavailable or highly dilutive | Constrains growth or forces restructuring | Runway discipline; milestone-based fundraising; customer revenue; grants; strategic partners; no premature fixed repayment obligations | CFO |
| 18 | Dilution | SAFEs, options, warrants and future rounds materially dilute earlier investors and founders | Investors misunderstand their eventual ownership | Fully diluted cap table maintained; every financing scenario-modelled; SAFE stack disclosed; option reserve set deliberately ([`CAP_TABLE.md`](CAP_TABLE.md)) | CFO |
| 19 | Illiquidity | Private securities are not easily sold or transferred | Capital may be tied up indefinitely | Explicit disclosure; transfer restrictions stated; **no implied liquidity promise**; realistic exit discussion | CFO |
| 20 | Founder and key person | Heavy dependence on founders and a small technical and content team | Loss or underperformance disrupts execution | Vesting; IP assignment; hiring plan; advisor bench; documented operating procedures; key-person insurance where appropriate | Board |
| 21 | Governance conflict | PBC mission rights conflict with investor preference or an acquisition | Complicates exits, fundraising and board decisions | Narrowly defined mission rights; independent directors; reserved-matters schedule; conflict policy; transparent impact reporting ([`MISSION_RIGHTS.md`](MISSION_RIGHTS.md)) | Board Chair |
| 22 | Related-party transactions | AGI entities licence IP, share employees and contract with each other | Conflicts, hidden economics, investor distrust | Written intercompany agreements; arm's-length pricing; board approval; independent review above a materiality threshold; disclosure in quarterly reporting | General Counsel |
| 23 | Regulatory and securities compliance | Improper fundraising, marketing or investor communication | Enforcement and rescission risk | Securities counsel; correct offering exemption; accredited-investor process where needed; Form D and state filings; controlled communications; the language lint in `scripts/validate_company.py` | General Counsel |
| 24 | Reputation and public trust | AI, robotics and "AGI" claims attract scrutiny | Trust loss reaches customers, partners and investors at once | Avoid AGI hype; publish safety practices; transparent impact reporting; controlled claims; incident communication plan | CEO |

## Risk 15 is the one this repository can prove

Most rows above describe a control that exists in a policy. Risk 15 — property-data
quality — describes controls that are **in the code and enforced by CI**, and it is worth
separating because it is the difference between a stated intention and a demonstrated one:

- per-source evidence grading and a source catalogue that says how each source attaches
- a comparable is a recorded sale with a date, or it is not a comparable
- an assessed value is never presented as a transaction, and a strategy graded on one is
  graded down for it
- an in-app coverage panel stating what an edition cannot answer at all, recounted
  independently by the test fleet
- eight CI gates, each with failure modes proven by breaking the thing they protect

An investor evaluating risk 15 can read the validators. That is the standard the other
twenty-three rows are working toward, and saying so is more useful than claiming they are
already there.
