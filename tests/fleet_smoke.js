/* fleet_smoke — the whole application, driven, with no data tree.
 *
 * Loads the synthetic-fleet demo (scripts/build_fleet_demo.py output: the
 * complete 84-module shell over generated fixtures) in headless Chromium and
 * drives EVERY edition the page carries: load it, read its title and record
 * count, open the map, and on the first edition exercise one real control
 * (the "Meets the Locator X criteria" chip). Zero page errors per edition or
 * exit 1. This is the first gate that runs the full app from a clean checkout
 * — the fleet sweep on the data machine still covers real editions.
 *
 * Usage: node tests/fleet_smoke.js <built-demo.html>
 * Chromium: PW_CHROMIUM env names an executable (container pattern, same as
 * scripts/shoot_pages.js); otherwise playwright's own managed browser is used
 * (CI runs `npx playwright install chromium` first).
 */
const path = require('path');

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('usage: node tests/fleet_smoke.js <built-demo.html>'); process.exit(2); }
  const target = 'file://' + path.resolve(file);
  let chromium;
  try { chromium = require('playwright').chromium; }
  catch (e) { chromium = require('playwright-core').chromium; }
  const launch = process.env.PW_CHROMIUM
    ? { executablePath: process.env.PW_CHROMIUM }
    : {};
  const browser = await chromium.launch(launch);

  // the page itself declares the fleet — read it rather than hardcoding
  const probe = await browser.newContext();
  const p0 = await probe.newPage();
  await p0.goto(target, { waitUntil: 'load', timeout: 90000 });
  const fleet = await p0.evaluate(() => ({
    order: window.LXFLEET.order,
    templates: window.LXFLEET.templates.length,
    labels: Object.fromEntries(window.LXFLEET.order.map(k => [k, window.LXFLEET.editions[k].label])),
  }));
  await probe.close();
  const expectedOptions = fleet.order.length + fleet.templates;
  console.log('fleet: %d editions + %d refusing templates', fleet.order.length, fleet.templates);

  let failures = 0;
  for (let i = 0; i < fleet.order.length; i++) {
    const key = fleet.order[i];
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
    await page.addInitScript(k => { try { localStorage.setItem('lx_fleet_edition', k); } catch (e) {} }, key);
    await page.goto(target, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => ({
      title: document.title,
      n: window.BA.listings.length,
      options: document.getElementById('fleetsel') ? document.getElementById('fleetsel').options.length : 0,
    }));
    await page.click('#coverenter').catch(() => {});
    await page.evaluate(() => LX.showView('mapview'));
    await page.waitForTimeout(1800);
    let chipNote = '';
    if (i === 0) {
      await page.click('#chips .chip[data-f="bb"]');
      await page.waitForTimeout(900);
      const count = (await page.textContent('#count')).trim();
      if (!/Locator X criteria/.test(count)) { errs.push('criteria chip did not annotate the count line: ' + count); }
      chipNote = '  [chip: ' + count.split('·')[0].trim() + ']';
    }
    const ok = errs.length === 0 && info.n > 0 && info.options === expectedOptions
      && info.title.indexOf(fleet.labels[key]) === 0;
    if (!ok) failures++;
    console.log('%s %s  %d records  "%s"%s%s', ok ? 'ok  ' : 'FAIL', key.padEnd(13),
      info.n, info.title, chipNote, errs.length ? '  ERR: ' + errs[0] : '');
    await ctx.close();
  }
  await browser.close();
  console.log(failures ? failures + ' EDITION(S) FAILED' : 'FLEET SMOKE CLEAN — every edition ran with zero page errors');
  process.exit(failures ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
