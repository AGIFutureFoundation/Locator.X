#!/usr/bin/env node
/* locator.x — reproducible screenshots of the companion pages.

   Marketing, docs and the explainer video all need the same thing: honest frames
   of what the shipped pages actually render, at a known viewport, including the
   deck pages' later slides (the decks are 100svh scroll-snap documents driven by
   ArrowRight, so a plain full-page screenshot only ever shows slide one). This
   was first done by hand in a working session (2026-09-10, for the explainer
   video's style lock — docs/marketing/explainer-video.md); this script makes the
   capture a one-command artifact instead of a lost one-off.

   Only shipped, self-contained pages are captured — never a mockup: the frames
   these produce are the app surfaces as committed, which is what "use real
   screenshots" has to mean in this repo.

   Usage:   node scripts/shoot_pages.js [outdir]        (default: shots/)
   Needs:   playwright-core (npm i playwright-core) and a Chromium the caller
            names via PW_CHROMIUM, or Playwright's own browser install. The
            data tree is NOT needed — these pages ship without it by design
            (top-properties renders its honest empty state).
*/
'use strict';

let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch (e) {
  console.error('playwright-core is not installed. Run: npm install playwright-core');
  console.error('(node_modules is deliberately not committed — see CLAUDE.md.)');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'shots'));
const VIEWPORT = { width: 1920, height: 1080 };

// [name, file, mode, count] — mode 'scroll' screenshots evenly spaced viewport
// stops down the document; mode 'deck' walks slides with ArrowRight (count =
// total slides, matching each deck's "NN / NN" footer).
const PAGES = [
  ['index',   'pages/index.html',                                'scroll', 1],
  ['top',     'pages/top-properties.html',                       'scroll', 1],
  ['ladeck',  'pages/locator-x-louisiana-developer-deck.html',   'deck',   3],
  ['pitch',   'pages/locator-x-pitch-deck.html',                 'deck',   3],
  ['cohort',  'pages/locator-x-cohort-review.html',              'scroll', 4],
  ['learn',   'pages/locator-x-learning-environment.html',       'scroll', 6],
  ['courses', 'pages/locator-x-applied-courses.html',            'scroll', 6],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const launch = {};
  if (process.env.PW_CHROMIUM) launch.executablePath = process.env.PW_CHROMIUM;
  const browser = await chromium.launch(launch);
  const ctx = await browser.newContext({ viewport: VIEWPORT, colorScheme: 'light' });
  let shot = 0, failed = 0;

  for (const [name, rel, mode, count] of PAGES) {
    const page = await ctx.newPage();
    try {
      await page.goto('file://' + path.join(ROOT, rel), { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(1500); // webfonts settle or fall back — either is honest
      if (mode === 'deck') {
        await page.click('body');
        for (let i = 0; i < count; i++) {
          if (i > 0) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1200); }
          await page.screenshot({ path: path.join(OUT, `${name}_${String(i).padStart(2, '0')}.png`) });
          shot++;
        }
      } else {
        const H = await page.evaluate(() => document.documentElement.scrollHeight);
        const maxScroll = Math.max(0, H - VIEWPORT.height);
        const stops = count === 1 || maxScroll === 0
          ? [0]
          : Array.from({ length: count }, (_, i) => Math.round(maxScroll * i / (count - 1)));
        for (let i = 0; i < stops.length; i++) {
          await page.evaluate(y => window.scrollTo(0, y), stops[i]);
          await page.waitForTimeout(600);
          await page.screenshot({ path: path.join(OUT, `${name}_${String(i).padStart(2, '0')}.png`) });
          shot++;
        }
      }
      console.log(`  ${name}: ok`);
    } catch (e) {
      failed++;
      console.error(`  ${name}: FAILED — ${String(e.message).split('\n')[0]}`);
    }
    await page.close();
  }

  await browser.close();
  console.log(`${shot} screenshot(s) in ${OUT}` + (failed ? `; ${failed} page(s) FAILED` : ''));
  process.exit(failed ? 1 : 0);
})();
