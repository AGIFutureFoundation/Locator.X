# Florida — record coverage

*Status vocabulary and rules: [`README.md`](README.md). State process context:
[the Florida entry](../southeast.md#florida). Florida is wave one's **new** state, chosen
by data availability: the Department of Revenue publishes statewide assessment rolls in a
documented format — the best bulk entry point of any large state. Nothing here is pulled
yet; this inventory is the probe plan, held honestly at `named`.*

**The state's signature corrections:** Save Our Homes caps make the seller's tax bill
non-inheritable (recompute at purchase, like California) — and the insurance line, not the
tax line, is the survival number on the coasts. Both are graded as first-class rows.

## Statewide layers (the bulk-first entry)

| Gate | Question | Source of record | Status |
|------|----------|------------------|--------|
| L/A | Every parcel's use code, assessed and just value, sale history | **FL DOR NAL roll** (Name–Address–Legal, annual, all 67 counties, documented layout) | named — the single highest-value probe in wave one |
| O | Owner of record statewide | NAL roll owner fields | named — PII-stripping rule applies on ingest, same as Louisiana |
| O (outlook) | Recorded sales with prices | NAL SDF (Sales Data File) — Florida is a **disclosure state**; doc stamps imply consideration | named — would give the Comps desk a large state where it *can* function, the deliberate contrast to Orleans/EBR |
| L | Statewide parcel geometry | FGDL / DOR statewide parcel GIS | named |
| A | Millage by authority | DOR millage tables per county/authority | named |
| O | Tax-sale pipeline | County lien auctions (LienHub/RealAuction pattern) + tax-deed applications at clerks | named — hybrid system; the two stages are different datasets |
| T | Foreclosure dockets | Clerks of court (judicial state; dockets online) | named |
| C/A | Insurance context | Citizens policy counts / depopulation; My Safe Florida Home | named — the survival line; quoted premiums stay deal-level evidence |

## Probe order (why these counties first)

| County | Why | Status |
|--------|-----|--------|
| Orange (Orlando) | Large, growth-driven, strong appraiser portal; university ring (UCF) fits the `launi` campus lens | named |
| Hillsborough (Tampa) | Deep rental stock; port/industrial mix exercises the use-code map | named |
| Duval (Jacksonville) | Affordability profile closest to the platform's value thesis | named |
| Miami-Dade | Stress-tests everything: condo regimes, insurance repricing, foreign ownership chains | named |
| Escambia/Leon | Panhandle qPublic-pattern counties to verify the vendor-pattern assumption | named |

## What would move the grade most

1. **One NAL + SDF county probe** (Orange): parse the documented layout, verify the
   use-code dictionary and sale-qualification flags, record the quirks in
   [`PULL_RECIPE.md`](../../PULL_RECIPE.md) — then the same parser lifts all 67 counties.
2. The **use-code dictionary** (DOR land-use codes) verified against the published
   manual — the pull recipe's hard rule: never guess a use code.
3. A lien-auction calendar scrape for the June sales — the distress pipeline's metronome
   in this state.

Success for wave one here is defined in the roadmap: every row above either advances to
`pulled` with findings logged, or converts to `blocked`/`no public record` with the reason
dated — no row stays `named` without a probe attempt recorded.
