/* edition_sweep — the gate between "built with real data" and "republished".
 *
 * docs/PUBLISH_MAP.md says it in its own words: file size is NOT the integrity
 * check, the record count is. That check has been manual, which is how a short
 * build could reach an artifact URL that thousands of records are missing from
 * and look exactly like a good one. This runs it.
 *
 * On the data machine, after `python3 build_state.py --all`, each built edition
 * is driven in headless Chromium and checked against the map:
 *   - its <title> matches the one PUBLISH_MAP records for that file
 *   - its record count matches the documented figure, where one is documented
 *   - the page throws nothing, and the MAP throws nothing on its own error
 *     channel (where a refused layer speaks and nothing else hears it)
 *   - every city label names a city THIS edition's records carry, and sits
 *     inside that city's own records; no campus pin falls outside the
 *     edition's record footprint
 *
 * That last pair is here because the fleet demo could not have caught it alone:
 * every edition shipped 64 Bay Area city labels and 23 Bay Area university pins
 * for months, on maps of Louisiana and of the country.
 *
 * Usage: node tests/edition_sweep.js [dir]      (default: the repo root)
 *        node tests/edition_sweep.js --parse-only
 *          reads PUBLISH_MAP and prints what it would check - no browser, no
 *          data tree, so CI can verify the map still parses.
 * Chromium: PW_CHROMIUM names an executable, else playwright's own.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* ---- the published map, parsed from the document that governs it ---------- */
function publishMap() {
  const md = fs.readFileSync(path.join(ROOT, 'docs', 'PUBLISH_MAP.md'), 'utf8');
  const editions = new Map();
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
    if (cells.length < 3) continue;
    const file = cells[0];
    if (/\.html$/.test(file) && /^https?:/.test(cells[2])) {
      editions.set(file, { file, title: cells[1], url: cells[2].replace(/\s*\(m\)\s*$/, ''), records: null });
    }
  }
  // the record-count table keys by edition name without the extension
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
    if (cells.length < 2) continue;
    const m = /^([0-9][0-9,]*)/.exec(cells[1] || '');
    if (!m) continue;
    const key = cells[0];
    for (const e of editions.values()) {
      if (e.file.replace(/\.html$/, '') === key) e.records = parseInt(m[1].replace(/,/g, ''), 10);
    }
  }
  if (!editions.size) {
    console.error('edition_sweep: no editions parsed from docs/PUBLISH_MAP.md — refusing to '
      + 'report a clean sweep of nothing');
    process.exit(2);
  }
  return editions;
}

/* ---- the per-edition checks, shared with tests/fleet_smoke.js in spirit --- */
const PAGE_PROBE = () => {
  const cities = {};
  LX.allListings().forEach(l => {
    if (!l.city || typeof l.lat !== 'number' || typeof l.lng !== 'number') return;
    const c = cities[l.city] || (cities[l.city] = { n: 0, w: 1e9, s: 1e9, e: -1e9, nn: -1e9 });
    c.n++;
    if (l.lng < c.w) c.w = l.lng; if (l.lng > c.e) c.e = l.lng;
    if (l.lat < c.s) c.s = l.lat; if (l.lat > c.nn) c.nn = l.lat;
  });
  const labels = [...document.querySelectorAll('.citylbl[data-city]')]
    .map(e => ({ city: e.dataset.city, lng: +e.dataset.lng, lat: +e.dataset.lat }));
  const pins = [...document.querySelectorAll('.campuspin')]
    .map(e => ({ title: e.title, lat: +e.dataset.lat, lng: +e.dataset.lng }));
  return {
    title: document.title,
    records: (window.BA && window.BA.listings) ? window.BA.listings.length : 0,
    cityCount: Object.keys(cities).length, cities, labels, pins,
    foot: LX.editionFootprint(), cap: LX.CITY_LABEL_CAP,
    mapErrors: [...new Set(window.__mapErrors || [])]
  };
};

function checkGeo(info, errs) {
  const want = Math.min(info.cityCount, info.cap);
  if (info.labels.length !== want) {
    errs.push('city labels: ' + info.labels.length + ' drawn, expected ' + want
      + ' (this edition names ' + info.cityCount + ' cities)');
  }
  const strangers = info.labels.filter(l => !info.cities[l.city]);
  if (strangers.length) {
    errs.push(strangers.length + ' city label(s) name a place not in this edition: '
      + strangers.slice(0, 3).map(l => l.city).join(', '));
  }
  const eps = 1e-9;
  const misplaced = info.labels.filter(l => {
    const c = info.cities[l.city]; if (!c) return false;
    return !(l.lng >= c.w - eps && l.lng <= c.e + eps && l.lat >= c.s - eps && l.lat <= c.nn + eps);
  });
  if (misplaced.length) {
    errs.push(misplaced.length + ' city label(s) sit outside their own records: '
      + misplaced.slice(0, 3).map(l => l.city).join(', '));
  }
  const f = info.foot;
  const stray = f ? info.pins.filter(p => !(Number.isFinite(p.lat) && Number.isFinite(p.lng)
    && p.lng >= f.w && p.lng <= f.e && p.lat >= f.s && p.lat <= f.n)) : [];
  if (stray.length) {
    errs.push(stray.length + " campus pin(s) outside this edition's record footprint: "
      + stray.slice(0, 3).map(p => p.title || '(unnamed)').join(', '));
  }
}

async function main() {
  const map = publishMap();
  const parseOnly = process.argv.includes('--parse-only');
  const dir = process.argv.slice(2).find(a => !a.startsWith('--')) || ROOT;

  if (parseOnly) {
    console.log('edition_sweep: ' + map.size + ' editions in docs/PUBLISH_MAP.md, '
      + [...map.values()].filter(e => e.records != null).length
      + ' carrying a documented record count');
    for (const e of map.values()) {
      console.log('  ' + e.file.padEnd(18) + ' ' + e.title.padEnd(32) + ' '
        + (e.records == null ? 'records: not documented'
                             : 'records: ' + e.records.toLocaleString()));
    }
    return 0;
  }

  const present = [...map.values()].filter(e => fs.existsSync(path.join(dir, e.file)));
  const missing = map.size - present.length;
  if (!present.length) {
    console.error('edition_sweep: none of the ' + map.size + ' editions are built in ' + dir
      + '.\nThis runs on the DATA MACHINE after `python3 build_state.py --all`; a clean '
      + 'checkout has no data tree and builds none of them.');
    return 2;
  }
  let chromium;
  try { chromium = require('playwright').chromium; }
  catch (e) { chromium = require('playwright-core').chromium; }
  const browser = await chromium.launch(process.env.PW_CHROMIUM
    ? { executablePath: process.env.PW_CHROMIUM } : {});
  let failures = 0;
  for (const e of present) {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', err => errs.push(String(err).slice(0, 160)));
    await page.goto('file://' + path.resolve(dir, e.file), { waitUntil: 'load', timeout: 180000 });
    await page.evaluate(() => {
      window.__mapErrors = [];
      const attach = () => {
        const m = window.__lxmap;
        if (m && m.on && !m.__errHooked) {
          m.__errHooked = true;
          m.on('error', ev => window.__mapErrors.push(
            String((ev && ev.error && ev.error.message) || ev).slice(0, 200)));
          return true;
        }
        return false;
      };
      if (!attach()) { const iv = setInterval(() => { if (attach()) clearInterval(iv); }, 100); }
    });
    await page.click('#coverenter').catch(() => {});
    await page.evaluate(() => LX.showView('mapview')).catch(() => {});
    await page.waitForTimeout(2500);
    const info = await page.evaluate(PAGE_PROBE);
    if (info.title !== e.title) {
      errs.push('title is "' + info.title + '", PUBLISH_MAP says "' + e.title + '"');
    }
    if (e.records != null && info.records !== e.records) {
      errs.push('RECORD COUNT: built ' + info.records.toLocaleString() + ', documented '
        + e.records.toLocaleString() + ' — do not republish this file');
    }
    if (!info.records) errs.push('the edition holds no records at all');
    if (info.mapErrors.length) errs.push('the map rejected something: ' + info.mapErrors[0]);
    checkGeo(info, errs);
    const ok = errs.length === 0;
    if (!ok) failures++;
    console.log((ok ? 'ok   ' : 'FAIL ') + e.file.padEnd(18) + ' '
      + info.records.toLocaleString().padStart(9) + ' records  '
      + ('"' + info.title + '"').padEnd(34)
      + errs.map(x => '\n     ERR: ' + x).join(''));
    await ctx.close();
  }
  await browser.close();
  if (missing) {
    console.log(missing + ' edition(s) in PUBLISH_MAP are not built here — not checked, '
      + 'not cleared.');
  }
  console.log(failures
    ? failures + ' edition(s) must not be republished until fixed.'
    : 'EDITION SWEEP CLEAN — every built edition matches PUBLISH_MAP and draws only its own places.');
  return failures ? 1 : 0;
}

main().then(c => process.exit(c)).catch(e => { console.error(e); process.exit(2); });
