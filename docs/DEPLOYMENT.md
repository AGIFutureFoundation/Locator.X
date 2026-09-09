# Deployment

What is deployable, over which routes, and what each route needs. Last verified: 2026-09-09.

## What deploys from this repo

| Content | Deployable now? | Route |
|---------|-----------------|-------|
| `pages/` — the five standalone companion pages + `index.html` landing | **Yes** — pure static HTML, no build, no data | The two workflows below |
| The twelve full editions (`uswide.html`, `nola.html`, …) | Only after a local build — they are build products with ~2–16 MB of packed data and are **not committed** | Published as claude.ai artifacts, per the authoritative [`PUBLISH_MAP.md`](PUBLISH_MAP.md); any static host works for a built file |

## Route 1 — GitHub Pages (`.github/workflows/deploy-pages.yml`)

Zero external accounts. Deploys `pages/` to
`https://agifuturefoundation.github.io/Locator.X/` on every `pages/**` push and on manual
dispatch.

**Current state: blocked by repository visibility.** The first run (2026-09-09) failed at
site creation — *"Resource not accessible by integration"* — because Pages cannot be
created on this private repository under the organization's plan. It activates with no
further work the moment the repository is public (or the org moves to a plan with private
Pages): re-run the workflow or push any `pages/` change.

**Public-exposure note:** a Pages site is publicly reachable even from a private repo.
`pages/` contains only content already published as artifacts, so nothing new becomes
public — keep that property in mind before adding files there.

## Route 2 — Vercel (`.github/workflows/deploy-vercel.yml`)

Armed but dormant until credentials exist. To activate:

1. Create a token: vercel.com → Account Settings → Tokens.
2. Repo → Settings → Secrets and variables → Actions → **New repository secret**,
   name `VERCEL_TOKEN`, paste the token.
3. Optional, to pin an existing Vercel project: add `VERCEL_ORG_ID` and
   `VERCEL_PROJECT_ID` the same way (both appear in the project's settings). Without
   them the first deploy creates a project automatically.
4. Push any `pages/` change or run the workflow manually — it deploys `pages/` as a
   static production site and prints the live URL in the run log.

Until the secret exists the workflow **skips with a notice** — no failure, no noise.

**No-workflow alternative:** import the repo at vercel.com/new and set the project's
root directory to `pages/`. It is static HTML with no build step; every push to `main`
then deploys through Vercel's own GitHub integration, and the workflow becomes redundant
(remove it or leave it skipping).

## Deploying a full edition

Build it locally first (data tree required — see [`../data/README.md`](../data/README.md)
and [`PULL_RECIPE.md`](PULL_RECIPE.md)), then treat the output file like any static
asset: an artifact republish per [`PUBLISH_MAP.md`](PUBLISH_MAP.md) keeps the canonical
URL; a copy dropped into a Vercel project or any static host also works, since each
edition is one self-contained file. Do **not** commit built editions to the repo —
`.gitignore` blocks them deliberately.

## Verifying a deploy

- The landing page and all five companion pages load with no console errors.
- `index.html` links resolve (relative — they survive any host or subpath).
- The learning environment renders 50 courses, all live (the standalone page carries its
  own doctype/head; if a host serves it truncated, check for HTML minification or
  size-limit middleware — none should apply at ~70 KB).
