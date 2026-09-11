/* fleet_smoke — the whole application, driven, with no data tree.
 *
 * Loads the synthetic-fleet demo (scripts/build_fleet_demo.py output: the
 * complete 84-module shell over generated fixtures) in headless Chromium and
 * drives EVERY edition the page carries: load it, read its title and record
 * count, open the map, and on the first edition exercise the real controls:
 * the "Meets the Locator X criteria" chip, every screening class in the Type
 * filter, and the map-tools disclosure. Zero page errors per edition or
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
      await page.click('#chips .chip[data-f="bb"]');
      await page.waitForTimeout(400);

      // Every screening class the crosswalk defines must be reachable AND must
      // actually select something. A Type option that filters to nothing is the
      // same defect as no option at all, just harder to notice.
      for (const cls of ['lodging', 'student', 'mhp']) {
        await page.selectOption('#fkind', cls);
        await page.waitForTimeout(350);
        const c = (await page.textContent('#count')).trim();
        const n = parseInt(c.replace(/,/g, ''), 10);
        if (!(n > 0)) errs.push('Type filter "' + cls + '" selected nothing: ' + c);
      }
      await page.selectOption('#fkind', '');
      await page.waitForTimeout(250);

      // The map tools are a disclosure at every width: shut by default so the
      // map is visible, and really shut - visibility, not just the attribute,
      // because an explicit display beats [hidden] and that bug shipped once.
      if (await page.isVisible('#maptools')) errs.push('map tools are open before the toggle is pressed');
      await page.click('#maptoggle');
      await page.waitForTimeout(350);
      if (!(await page.isVisible('#maptools'))) errs.push('map tools did not open on the toggle');
      const held = await page.$$eval('#maptools select, #maptools button', n => n.length);
      if (held < 10) errs.push('map tools lost controls: only ' + held + ' present');
      await page.click('#maptoggle');
      await page.waitForTimeout(250);

      // The pooled backtest needs eight series and the fixture once shipped six,
      // so the measured-error band — the most distinctive thing this platform
      // does — could not draw in the public demo at all. Assert the band exists,
      // not merely that the page rendered.
      await page.evaluate(() => LX.showView('predict'));
      await page.waitForTimeout(2200);
      const predTxt = (await page.textContent('#predroot')) || '';
      if (/not testable/i.test(predTxt)) errs.push('backtest is not testable on the fixture — too few index series');
      if (!(await page.$('#predroot .pvband'))) errs.push('the measured error band did not draw');
      await page.evaluate(() => LX.showView('mapview'));
      await page.waitForTimeout(600);
      // The city rail: one map per city. Built from the records, so an edition
      // naming a single city renders none — assert the behaviour, not a count.
      // Click by selector, never by a retained handle: focusCity() rebuilds the
      // rail's innerHTML, so every chip element captured before a click is
      // detached by the time the next one is needed.
      const nChips = await page.$$eval('#cityrail .citychip', n => n.length);
      if (nChips) {
        if (nChips < 2) errs.push('city rail rendered with fewer than two choices');
        const all = parseInt(((await page.textContent('#count')) || '').replace(/,/g, ''), 10);
        await page.click('#cityrail .citychip:nth-of-type(2)');
        await page.waitForTimeout(900);
        const one = parseInt(((await page.textContent('#count')) || '').replace(/,/g, ''), 10);
        if (!(one > 0 && one < all)) {
          errs.push('selecting a city did not narrow the list: ' + all + ' -> ' + one);
        }
        const synced = await page.inputValue('#fcity');
        if (!synced) errs.push('the city rail did not sync the city dropdown');
        await page.click('#cityrail .citychip:nth-of-type(1)');
        await page.waitForTimeout(500);
        const back = parseInt(((await page.textContent('#count')) || '').replace(/,/g, ''), 10);
        if (back !== all) errs.push('clearing the city rail did not restore the list: ' + back + ' of ' + all);
      }

      // The closing packet: the transaction checklist, assembled from the
      // record. It replaced twelve hardcoded San Francisco strings that shipped
      // in every edition, so the assertions are the two things that were wrong:
      // the list must respond to the ASSET CLASS, and no paperwork may name a
      // state the record cannot support.
      const pk = await page.evaluate(() => {
        const pick = re => (window.BA.listings.find(l => re.test(l.kind || '')) || null);
        const hotel = pick(/hotel|motel|inn\b|lodg/i), sfr = pick(/single family/i);
        const ids = l => l ? LXPACKET.itemsFor(l).map(i => i.id) : null;
        return {
          hotel: ids(hotel), sfr: ids(sfr),
          addr: window.BA.listings[0] ? LXPACKET.addressLine(window.BA.listings[0]) : '',
          state: LXPACKET.stateName(window.BA.listings[0] || {}),
          clauses: (window.LXPACKETDATA || {}).clauses ? LXPACKETDATA.clauses.length : 0
        };
      });
      if (pk.clauses !== 12) errs.push('closing packet clause families: ' + pk.clauses + ', expected 12');
      if (pk.hotel && pk.sfr) {
        // A hotel needs the STR report and the franchise agreement; a house does
        // not. If these two sets are equal the packet is not reading the class.
        if (pk.hotel.length <= pk.sfr.length) {
          errs.push('closing packet does not vary by asset class: hotel ' + pk.hotel.length
            + ' items vs single-family ' + pk.sfr.length);
        }
        for (const need of ['str', 'franchise']) {
          if (pk.hotel.indexOf(need) < 0) errs.push('lodging packet is missing ' + need);
          if (pk.sfr.indexOf(need) >= 0) errs.push('single-family packet wrongly includes ' + need);
        }
      }
      // Paperwork must never invent a state. The fixture declares none, so the
      // address line has to say so rather than printing one.
      if (!pk.state && !/\[STATE — not in this record\]/.test(pk.addr)) {
        errs.push('paperwork named a state this edition does not declare: ' + pk.addr);
      }

      // The underwriting sheet, with the stress block that says where the deal
      // stops working rather than only how it looks today.
      await page.evaluate(() => {
        const l = window.BA.listings.find(x => (x.units || 1) >= 2) || window.BA.listings[0];
        LX.showView('underwrite'); LXUW.openSheet(l.id);
      });
      await page.waitForTimeout(1400);
      const sheet = await page.evaluate(() => {
        const box = document.getElementById('uwsheet');
        return {
          packet: !!box.querySelector('.packet'),
          ticks: box.querySelectorAll('.packet input[data-pk]').length,
          clauseRows: box.querySelectorAll('.pkclauses tr').length - 1,
          stress: (box.textContent.match(/Stresses still covering debt/) || []).length,
          rows: [...box.querySelectorAll('.sens')].some(t => /All three at once/.test(t.textContent)),
          loi: (document.getElementById('offerdraft') || {}).textContent || ''
        };
      });
      if (!sheet.packet) errs.push('the closing packet did not render on the underwriting sheet');
      if (!(sheet.ticks > 0)) errs.push('the closing packet rendered no checkable items');
      if (sheet.clauseRows !== 12) errs.push('clause question table rows: ' + sheet.clauseRows);
      if (!sheet.stress) errs.push('the stress block did not render');
      if (!sheet.rows) errs.push('the stress table did not render the combined case');
      if (/,\s*CA\s/.test(sheet.loi)) errs.push('the letter of intent still hardcodes a state: ' + sheet.loi.slice(0, 120));
      // The interchange export. The assertions are the two facts that vanish
      // the moment a record leaves the app: whether a price is an assessed
      // value or an index estimate, and whether a point is the parcel or a ZIP
      // centroid. The fixture happens to contain neither case, so the variants
      // are constructed here — otherwise this would assert nothing.
      const geo = await page.evaluate(() => {
        const base = LX.filtered()[0];
        if (!base) return null;
        const rows = [
          base,
          Object.assign({}, base, {id: 't-est', est: true}),
          Object.assign({}, base, {id: 't-apx', approx: true}),
          Object.assign({}, base, {id: 't-nog', lng: null, lat: null})
        ];
        const fc = LXGEO.featureCollection(rows, {derived: true});
        const csv = LXGEO.csv(rows, {derived: true});
        return {
          type: fc.type, features: fc.features.length, records: fc.lx.records,
          dropped: fc.lx.dropped_without_geometry,
          est: fc.lx.estimated_prices, approx: fc.lx.approximate_coordinates,
          bases: fc.features.map(f => f.properties['lx:price_basis']),
          geoms: fc.features.map(f => f.properties['lx:geometry_basis']),
          coords: fc.features[0].geometry.coordinates,
          csvCols: csv.split('\n')[0].split(','),
          csvRows: csv.split('\n').length
        };
      });
      if (geo) {
        if (geo.type !== 'FeatureCollection') errs.push('export is not a FeatureCollection');
        if (geo.features !== 3 || geo.dropped !== 1) {
          errs.push('a record with no coordinate was not dropped and counted: '
            + geo.features + ' features, ' + geo.dropped + ' dropped of ' + geo.records);
        }
        if (geo.est !== 1 || geo.approx !== 1) {
          errs.push('the export header lost a provenance count: ' + geo.est
            + ' estimated, ' + geo.approx + ' approximate');
        }
        if (!/NOT a price/.test(geo.bases[1] || '')) {
          errs.push('an index-estimate price exported without saying it is not a price');
        }
        if (!/NOT the parcel/.test(geo.geoms[2] || '')) {
          errs.push('a ZIP-centroid coordinate exported as if it were the parcel');
        }
        if (!(Array.isArray(geo.coords) && geo.coords.length === 2)) {
          errs.push('feature geometry is not a two-element position');
        }
        // CSV and GeoJSON must describe the same columns, or the two exports
        // can disagree about what a field means.
        for (const need of ['lx:price_basis', 'lx:geometry_basis', 'lng', 'lat']) {
          if (geo.csvCols.indexOf(need) < 0) errs.push('CSV export is missing ' + need);
        }
        if (geo.csvRows !== 5) errs.push('CSV rows: ' + geo.csvRows + ', expected 5 (header + 4)');
      }

      await page.evaluate(() => LX.showView('mapview'));
      await page.waitForTimeout(400);
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
