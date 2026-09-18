/* fleet_smoke — the whole application, driven, with no data tree.
 *
 * Loads the synthetic-fleet demo (scripts/build_fleet_demo.py output: the
 * complete 85-module shell over generated fixtures) in headless Chromium and
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
  /* Asset-class coverage accumulates ACROSS editions: a market of houses need
     not contain a warehouse, but no class may be dead in the whole fleet. */
  const clsTotal = {};
  const catTotal = {};
  for (let i = 0; i < fleet.order.length; i++) {
    const key = fleet.order[i];
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
    await page.addInitScript(k => { try { localStorage.setItem('lx_fleet_edition', k); } catch (e) {} }, key);
    await page.goto(target, { waitUntil: 'load', timeout: 90000 });
    /* The map has its own error channel, and it is where a whole class of
       failure speaks that neither pageerror nor an exception ever sees. The
       property-tower layer asked for a data expression MapLibre does not
       support on fill-extrusion-opacity; MapLibre said so HERE and refused the
       layer, while addLayer returned, paint() returned true and the button
       flipped. The field had never rendered in any edition and every signal the
       tests looked at said it worked. Nothing was listening to this channel. */
    await page.evaluate(() => {
      window.__mapErrors = [];
      const attach = () => {
        const m = window.__lxmap;
        if (m && m.on && !m.__errHooked) {
          m.__errHooked = true;
          m.on('error', e => window.__mapErrors.push(
            String((e && e.error && e.error.message) || e).slice(0, 220)));
          return true;
        }
        return false;
      };
      if (!attach()) { const iv = setInterval(() => { if (attach()) clearInterval(iv); }, 100); }
    });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => ({
      title: document.title,
      n: window.BA.listings.length,
      options: document.getElementById('fleetsel') ? document.getElementById('fleetsel').options.length : 0,
    }));
    await page.click('#coverenter').catch(() => {});
    await page.evaluate(() => LX.showView('mapview'));
    await page.waitForTimeout(1800);
    /* THE FOOTPRINT RULE, checked on EVERY edition because the bug was on every
       edition: 64 Bay Area city labels and 23 Bay Area university pins were being
       drawn on all eleven maps - correct coordinates for real places, on entirely
       the wrong map, with nothing tying any of them to the records in front of the
       user. Measured before the fix: 67 labels per edition, ZERO of which named a
       city the edition's own records carry.

       So: every city label must name a city in THIS edition and sit inside that
       city's own record bounding box, and every campus pin must fall inside the
       edition's record footprint. */
    const geo = await page.evaluate(() => {
      const cities = {};
      LX.allListings().forEach(l => {
        if (!l.city || typeof l.lat !== 'number' || typeof l.lng !== 'number') return;
        const c = cities[l.city] || (cities[l.city] =
          { n: 0, w: 1e9, s: 1e9, e: -1e9, nn: -1e9 });
        c.n++;
        if (l.lng < c.w) c.w = l.lng; if (l.lng > c.e) c.e = l.lng;
        if (l.lat < c.s) c.s = l.lat; if (l.lat > c.nn) c.nn = l.lat;
      });
      const labels = [...document.querySelectorAll('.citylbl[data-city]')]
        .map(e => ({ city: e.dataset.city, lng: +e.dataset.lng, lat: +e.dataset.lat }));
      const pins = [...document.querySelectorAll('.campuspin')]
        .map(e => ({ title: e.title, lat: +e.dataset.lat, lng: +e.dataset.lng }));
      return { cities, labels, pins, foot: LX.editionFootprint(), cap: LX.CITY_LABEL_CAP };
    });
    {
      const names = Object.keys(geo.cities);
      const want = Math.min(names.length, geo.cap);
      if (geo.labels.length !== want) {
        errs.push('city labels: ' + geo.labels.length + ' drawn, expected ' + want
          + ' (this edition names ' + names.length + ' cities)');
      }
      const strangers = geo.labels.filter(l => !geo.cities[l.city]);
      if (strangers.length) {
        errs.push(strangers.length + ' city label(s) name a place not in this edition: '
          + strangers.slice(0, 3).map(l => l.city).join(', '));
      }
      const misplaced = geo.labels.filter(l => {
        const c = geo.cities[l.city]; if (!c) return false;
        const eps = 1e-9;
        return !(l.lng >= c.w - eps && l.lng <= c.e + eps
              && l.lat >= c.s - eps && l.lat <= c.nn + eps);
      });
      if (misplaced.length) {
        errs.push(misplaced.length + ' city label(s) sit outside their own records: '
          + misplaced.slice(0, 3).map(l => l.city).join(', '));
      }
      const f = geo.foot;
      const stray = f ? geo.pins.filter(p => !(Number.isFinite(p.lat) && Number.isFinite(p.lng)
        && p.lng >= f.w && p.lng <= f.e && p.lat >= f.s && p.lat <= f.n)) : [];
      if (stray.length) {
        errs.push(stray.length + ' campus pin(s) outside this edition\'s record footprint: '
          + stray.slice(0, 3).map(p => p.title || '(unnamed)').join(', '));
      }
    }

    /* The house-hack finder, on EVERY edition, because the defect was on every
       edition: it required a flag (l.hh) that only the Bay data builder ever
       sets, so everywhere else it computed over an empty set and drew an empty
       screen - which is why all eleven specs hid the tab and why the surface
       shipped into eleven editions and opened in none.

       Candidacy comes from the record's unit count now. So: if the edition
       carries 2-4 unit stock the tab must be REACHABLE and the finder must find
       them, and the FHA column must never say "eligible" - the constant behind
       it is the national high-cost ceiling, and the real limit is set per
       county, so eligibility is not ours to assert. */
    const hh = await page.evaluate(async () => {
      const u24 = LX.allListings().filter(l => (l.units || 1) >= 2 && (l.units || 1) <= 4).length;
      /* Read the tab AFTER opening the view: the nav groups its tabs and only the
         active group's buttons are displayed, so a tab read from another group is
         legitimately display:none and says nothing about whether the EDITION
         hides it. Opening the view activates its group. */
      LX.showView('hacks');
      if (window.LXHH) LXHH.render();
      await new Promise(r => setTimeout(r, 900));
      const tab = document.querySelector('nav.tabs button[data-view="hacks"], [data-view="hacks"]');
      const tabShown = !!tab && getComputedStyle(tab).display !== 'none' && !tab.hidden;
      const view = document.getElementById('hacks');
      const rows = document.querySelectorAll('#hhtable tbody tr[data-id]').length;
      const head = (document.querySelector('#hhtable thead') || {}).textContent || '';
      const body = (document.querySelector('#hhtable tbody') || {}).textContent || '';
      const lede = (view ? view.textContent : '') || '';
      /* The default list opens on the 3-4 unit rows, which all render the
         self-sufficiency badge — so the "within ceiling" badge, the one that used
         to read "eligible", never appears and an assertion about it could not
         fail. Narrow to two-unit rows, where that badge is what renders. */
      const sel = document.getElementById('hh_units');
      let twoUnit = '', badgeText = [];
      if (sel) {
        sel.value = '2'; sel.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 700));
        twoUnit = (document.querySelector('#hhtable tbody') || {}).textContent || '';
        badgeText = [...document.querySelectorAll('#hhtable tbody .badge')]
          .map(e => e.textContent.trim());
        sel.value = ''; sel.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 400));
      }
      badgeText = badgeText.concat([...document.querySelectorAll('#hhtable tbody .badge')]
        .map(e => e.textContent.trim()));
      return { u24, tabShown, rows, head, badges: body, twoUnitRows: twoUnit.length > 0,
               visible: !!view && getComputedStyle(view).display !== 'none',
               /* Read the BADGE ELEMENTS, not the row text: textContent runs the
                  cells together, so "38% of PITI" + "eligible" became
                  "PITIeligible" and a word-boundary test could never match the
                  very word it was written to catch. */
               badgeText: badgeText,
               claimsEligible: badgeText.some(t => /eligible/i.test(t)),
               saysCeiling: /ceiling/i.test(lede),
               staleRegion: /San Francisco and Alameda|2022.2024 in San Francisco/i.test(lede),
               total: (document.getElementById('hhtotal') || {}).textContent || '' };
    });
    if (!hh.tabShown) errs.push('the house-hack tab is still hidden in this edition');
    if (!hh.visible) errs.push('the house-hack view did not open');
    if (hh.u24 > 0 && !(hh.rows > 0)) {
      errs.push('the finder found none of this edition\'s ' + hh.u24 + ' two-to-four-unit records');
    }
    if (hh.u24 === 0 && hh.rows > 0) {
      errs.push('the finder listed ' + hh.rows + ' rows in an edition with no 2-4 unit records');
    }
    if (hh.claimsEligible) {
      errs.push('the finder calls a property FHA "eligible" from a national ceiling — '
        + 'the limit is set per county');
    }
    if (!hh.saysCeiling) errs.push('the FHA ceiling caveat is missing from the house-hack view');
    const strayBadge = (hh.badgeText || []).find(t => !/^(within ceiling|over ceiling)/.test(t));
    if (strayBadge) {
      errs.push('an FHA badge says something outside the ceiling vocabulary: "' + strayBadge + '"');
    }
    if (hh.staleRegion) {
      errs.push('the house-hack lede still names San Francisco and Alameda County');
    }
    /* THE STRATEGY SWITCHBOARD, on every edition.

       The failure this guards against is not a crash, it is a POLITE BLANK. Five
       strategies over one record, and the inputs behind them are wildly unequal:
       a flip needs recorded comparable sales, which roughly half the counties in
       this catalogue do not publish at all. The tempting rendering of a column
       with no input is an empty cell or a zero. An empty cell reads as "small"
       and a zero reads as "none", and both are claims the record does not
       support.

       So the assertions are about what a NON-COMPUTED column says, not about how
       many columns compute. An edition where four of five columns are blocked is
       a correct edition, as long as each one names what is missing. */
    const sb = await page.evaluate(async () => {
      LX.showView('switchboard');
      if (window.LXSB) LXSB.render();
      await new Promise(r => setTimeout(r, 1200));
      const view = document.getElementById('switchboard');
      const tab = document.querySelector('nav.tabs button[data-view="switchboard"]');
      const cols = [...document.querySelectorAll('#sbgrid .sbcol')];
      const states = cols.map(c => c.classList.contains('sbna') ? 'n/a'
                              : c.classList.contains('sbblocked') ? 'blocked' : 'computed');
      /* A non-computed column must carry a REASON. Measure the reason element,
         not the column's whole text: the heading alone would satisfy a length
         test and say nothing. */
      const reasons = cols.map((c, i) => states[i] === 'computed' ? null
                              : ((c.querySelector('.sbwhy') || {}).textContent || '').trim());
      const graded = cols.map((c, i) => states[i] !== 'computed' ? null
                              : !!c.querySelector('.sbband') && !!c.querySelector('.sbbasis li'));
      /* No computed column may print a bare zero as its headline: a zero here is
         almost always a missing input that reached the arithmetic anyway. */
      const heads = cols.map((c, i) => states[i] !== 'computed' ? null
                              : ((c.querySelector('.sbhead .sbval') || {}).textContent || '').trim());
      const note = (document.getElementById('sbnote') || {}).textContent || '';
      let api = null;
      try {
        const l = LX.filtered()[0] || LX.allListings()[0];
        const c = LXSB.compare(l);
        api = { n: c.length, keys: c.map(x => x.key).join(','),
                allStated: c.every(x => x.state === 'computed'
                                     ? (!!x.grade && x.basis && x.basis.length > 0)
                                     : (typeof x.why === 'string' && x.why.length > 25)),
                ranked: LXSB.comparable(c).ok };
      } catch (e) { api = { err: String(e && e.message || e) }; }
      return {
        visible: !!view && getComputedStyle(view).display !== 'none',
        tabShown: !!tab && getComputedStyle(tab).display !== 'none' && !tab.hidden,
        n: cols.length, states, reasons, graded, heads, note, api
      };
    });
    if (!sb.visible) errs.push('the strategy switchboard did not open');
    if (!sb.tabShown) errs.push('the strategy-switchboard tab is hidden in this edition');
    if (sb.n !== 5) errs.push('the switchboard rendered ' + sb.n + ' columns, not the five strategies');
    sb.states.forEach((st, i) => {
      if (st !== 'computed' && !(sb.reasons[i] && sb.reasons[i].length > 25)) {
        errs.push('switchboard column ' + (i + 1) + ' is "' + st
          + '" and gives no reason — a blank column reads as an oversight, and a '
          + 'blocked one is usually the most important thing on the screen');
      }
      if (st === 'computed' && sb.graded[i] !== true) {
        errs.push('switchboard column ' + (i + 1) + ' computed a number with no grade band '
          + 'or no basis list — the grade IS the claim');
      }
      if (st === 'computed' && /^\$?0$/.test((sb.heads[i] || '').replace(/[,\s]/g, ''))) {
        errs.push('switchboard column ' + (i + 1) + ' headlines a bare zero; a zero here is a '
          + 'missing input that reached the arithmetic');
      }
      /* A COLUMN THAT CLAIMS TO HAVE COMPUTED SOMETHING MUST SHOW A NUMBER.

         money() and pct() print an em-dash for a null, so a computed column
         headlining a dash has failed quietly and kept its grade band — strictly
         worse than being blocked, because the grade is a claim about a number
         that does not exist. That caught a real defect: the switchboard read
         LXUW.sheetFor() as if it returned the input object when it returns
         {u, uw}, so three of five columns rendered fully graded dashes.

         This used to test for the PRESENCE of a dash, which was wrong and only
         looked right because no fixture record had ever produced the other case.
         A full cash-out BRRRR legitimately headlines "none — $20k out": the dash
         is punctuation in a real answer, not a missing value. Measured once the
         fixtures carried lot and sale data: 4,928 computed headlines across the
         fleet, none of them without a digit, and 209 carrying a dash AND a digit
         — every one of which the old rule would have failed.

         So the rule is the stronger and simpler one. A bare "—" has no digit and
         is still caught; a sentence containing a dash and a figure is not. */
      if (st === 'computed' && !/\d/.test(sb.heads[i] || '')) {
        errs.push('switchboard column ' + (i + 1) + ' is graded "computed" and headlines "'
          + sb.heads[i] + '" - a computed column must show a figure, and this one carries no '
          + 'digit at all, so the column is claiming a grade for nothing');
      }
    });
    if (sb.api && sb.api.err) errs.push('LXSB.compare threw: ' + sb.api.err);
    else {
      if (sb.api.n !== 5) errs.push('LXSB.compare returned ' + sb.api.n + ' strategies, not 5');
      if (!sb.api.allStated) {
        errs.push('a strategy came back neither graded nor explained — every column is '
          + 'either computed with a basis or refused with a reason, never silent');
      }
    }
    /* The note line must say something about comparability either way: the whole
       point is that alignment in a table is an argument it has to earn. */
    if (!/strateg/i.test(sb.note)) errs.push('the switchboard states no summary of what it could evaluate');

    /* THE COVERAGE PANEL, on every edition.

       The stated cost of getting this wrong is specific: a panel that
       UNDER-REPORTS gaps is worse than no panel, because it converts an unknown
       into an implied pass. Asserting that it rendered something would not catch
       that. So this RECOUNTS the field coverage independently, straight from
       LX.allListings() through evidence.js's own tests, and fails if the panel's
       numbers disagree with the records by even one. A panel that drifts from
       the data it describes is the whole failure mode, caught arithmetically. */
    const cov = await page.evaluate(async () => {
      const c = document.getElementById('coverpage'); if (c) c.remove();
      document.getElementById('covopen').click();
      await new Promise(r => setTimeout(r, 2500));
      /* The recount below compares against LX.allListings(), so the panel is put
         on EDITION scope explicitly rather than relying on "no filter is active,
         so the view happens to be the edition" — an accident that would stop
         holding the first time a default filter appeared. */
      LXCov.setScope('edition');
      const rep = LXCov.report();
      const rows = LX.allListings();
      const recount = (window.LXEvid && LXEvid.TESTS || []).map(t => {
        let n = 0; for (const l of rows) { try { if (t[2](l)) n++; } catch (e) {} }
        return t[0] + '=' + n;
      }).join(' ');
      const printed = rep.fields.map(f => f.key + '=' + f.have).join(' ');
      const body = (document.getElementById('covbody') || {}).textContent || '';
      /* Every gap the report names must also be ON SCREEN. A report object that
         knows about a gap the panel does not draw is the same failure wearing a
         different hat. */
      const drawn = rep.gaps.every(g => body.indexOf(g.name) >= 0);
      const s = rep.strategies;
      return {
        open: document.getElementById('covpanel').classList.contains('open'),
        bodyLen: body.length, printed, recount, agree: printed === recount, drawn,
        nFields: rep.fields.length, nGaps: rep.gaps.length,
        total: rows.length, clsN: rep.classification.n,
        /* A blocked or inapplicable play must carry its OWN reason; the two are
           counted separately and must never be pooled. */
        stratOk: !s ? null : s.insufficient ? 'insufficient'
          : s.rows.every(r => (r.blocked === 0 || (r.topBlock || '').length > 25)
                           && (r.na === 0 || (r.topNa || '').length > 25)
                           && r.computed + r.blocked + r.na === r.sampled),
        counties: rep.footprint.counties.length,
        fpTotal: rep.footprint.counties.reduce((a, x) => a + x.n, 0),
        /* THE REASON MUST REACH THE SCREEN. The report object carried topBlock
           and topNa for a year while the table read a field named `top` that the
           tally never produced, so every non-evaluable play printed an empty
           cell: the panel promised a reason and showed none, and the object-level
           assertion above could not see it. This checks the rendered text. */
        reasonsDrawn: !s || s.insufficient ? null
          : s.rows.every(r => (!r.blocked || body.indexOf(r.topBlock.slice(0, 40)) >= 0)
                           && (!r.na || body.indexOf(r.topNa.slice(0, 40)) >= 0)),
        /* THE PANEL MUST NAME THE SET IT IS DESCRIBING. */
        scopeNamed: /Describing/.test(body) && body.indexOf('in this edition') >= 0,
        scopeN: rep.scope.n, scopeAll: rep.scope.all, scopeEff: rep.scope.effective
      };
    });
    if (!cov.open) errs.push('the coverage panel did not open');
    if (!(cov.bodyLen > 400)) errs.push('the coverage panel rendered almost nothing: ' + cov.bodyLen + ' chars');
    if (!cov.agree) {
      errs.push('the coverage panel DISAGREES with the records it describes.\n'
        + '       panel:   ' + cov.printed + '\n'
        + '       recount: ' + cov.recount
        + '\n       A panel that under-reports a gap converts an unknown into an implied pass.');
    }
    if (!cov.drawn) errs.push('the coverage report names a gap that the panel does not draw on screen');
    if (cov.nFields < 5) errs.push('the coverage panel measured only ' + cov.nFields + ' record fields');
    if (cov.clsN !== cov.total) {
      errs.push('the classification count (' + cov.clsN + ') does not cover every record (' + cov.total + ')');
    }
    if (cov.fpTotal !== cov.total) {
      errs.push('the footprint accounts for ' + cov.fpTotal + ' records out of ' + cov.total
        + ' — every record belongs to somewhere, even if that somewhere is unnamed');
    }
    if (cov.stratOk === false) {
      errs.push('a coverage strategy row is missing its reason, or its three states do not sum '
        + 'to the sample — blocked and inapplicable are opposite findings and are never pooled');
    }
    if (cov.reasonsDrawn === false) {
      errs.push('the coverage panel reports a blocked or inapplicable play but does not PRINT its '
        + 'reason — an empty cell where the record layer was supposed to be stated');
    }
    if (!cov.scopeNamed) errs.push('the coverage panel does not say which set of records it is describing');
    if (cov.scopeEff !== 'edition' || cov.scopeN !== cov.scopeAll) {
      errs.push('the coverage panel was put on edition scope and did not take it: '
        + cov.scopeEff + ', ' + cov.scopeN + ' of ' + cov.scopeAll);
    }

    /* SCOPE FOLLOWS THE FILTER.

       The panel used to read allListings() everywhere, so it described the whole
       edition even while the screen showed one filtered city — silently answering
       "what can this edition answer" under a heading the user read as "what can
       THESE answer". The two are different questions and the second is the one an
       offer is made against. This filters to the edition's largest county, then
       recounts the panel's field figures against THAT set: a panel still reading
       the edition would disagree by the whole remainder. */
    const scoped = await page.evaluate(async () => {
      /* A PRICE FLOOR, not a county filter. The synthetic fleet gives every
         record the same county, so a county filter narrows nothing and the whole
         assertion would skip itself silently on every edition — a guard that
         passes because it never ran. A floor at the median narrows any edition
         holding two distinct prices, which every shipped one does. */
      const all = LX.allListings();
      const ps = all.map(l => LX.price(l)).filter(v => typeof v === 'number' && isFinite(v)).sort((a, b) => a - b);
      if (ps.length < 4) return { skip: 'this edition prices fewer than four records' };
      const mid = ps[Math.floor(ps.length / 2)];
      if (mid <= ps[0]) return { skip: 'this edition has no price spread to filter on' };
      const prev = LX.state.filters.min;
      LX.state.filters.min = String(mid);
      LXCov.setScope('view');
      const rep = LXCov.report();
      const rows = LX.filtered();
      const recount = (window.LXEvid && LXEvid.TESTS || []).map(t => {
        let n = 0; for (const l of rows) { try { if (t[2](l)) n++; } catch (e) {} }
        return t[0] + '=' + n;
      }).join(' ');
      const printed = rep.fields.map(f => f.key + '=' + f.have).join(' ');
      const body = (document.getElementById('covbody') || {}).textContent || '';
      const title = (document.getElementById('covtitle') || {}).textContent || '';
      LX.state.filters.min = prev; LXCov.setScope('edition');
      return {
        cut: mid, view: rows.length, all: all.length,
        eff: rep.scope.effective, n: rep.scope.n, fpTotal: rep.footprint.counties.reduce((a, x) => a + x.n, 0),
        agree: printed === recount, printed, recount,
        /* And it must SAY it is describing the smaller set — a panel that silently
           narrows is as misleading as one that silently widens. */
        saysView: /now on the map/.test(body), titleMoved: !/this edition/.test(title)
      };
    });
    if (!scoped.skip) {
      if (scoped.view >= scoped.all) {
        errs.push('a price floor at ' + scoped.cut + ' did not narrow the record set, so scope could not be tested');
      } else {
        if (scoped.eff !== 'view' || scoped.n !== scoped.view) {
          errs.push('the coverage panel did not follow the active filter: it reports ' + scoped.eff
            + ' / ' + scoped.n + ' while the map shows ' + scoped.view + ' of ' + scoped.all);
        }
        if (!scoped.agree) {
          errs.push('with a filter active the coverage panel DISAGREES with the records on screen.\n'
            + '       panel:   ' + scoped.printed + '\n'
            + '       recount: ' + scoped.recount);
        }
        if (scoped.fpTotal !== scoped.view) {
          errs.push('the filtered footprint accounts for ' + scoped.fpTotal + ' records out of ' + scoped.view);
        }
        if (!scoped.saysView || !scoped.titleMoved) {
          errs.push('the coverage panel narrowed to the filtered set without saying so — a silent '
            + 'narrowing misleads exactly as much as a silent widening');
        }
      }
    }

    await page.evaluate(() => LXCov.close());
    await page.waitForTimeout(200);

    /* EVERY SECTION, OPENED, ON EVERY EDITION.

       This suite drove seven of the app's thirty views. The other twenty-three —
       the Academy, the evidence scorecard, comps, the Standard, Scout, the
       relational map, the Digital Twin, recon, the pattern miner, the import
       page and the rest — were never opened by any test, on any edition. They
       work; driving all thirty by hand found no errors and nothing empty. But
       "works today" and "guarded" are different states, and a regression in any
       of the twenty-three would have reached a published edition without a
       single check going red.

       The bar here is deliberately low and absolute: open it, and it must not
       throw and must not come back blank. Anything richer belongs in the
       dedicated blocks above, which is where the panels that carry real
       invariants are checked. What this catches is the failure those blocks
       cannot: a view that stopped rendering at all. */
    const sections = await page.evaluate(() =>
      [...document.querySelectorAll('nav.tabs button[data-view]')].map(b => b.dataset.view));
    if (sections.length < 20) {
      errs.push('only ' + sections.length + ' views are reachable from the tab bar; the section '
        + 'sweep would silently cover a fraction of the app');
    }
    const thin = [], broke = [], missing = [];
    for (const v of sections) {
      const before = errs.length;
      const ok = await page.evaluate(x => { try { LX.showView(x); return true; } catch (e) { return String(e); } }, v);
      if (ok !== true) { broke.push(v + ' (' + ok + ')'); continue; }
      await page.waitForTimeout(260);
      const got = await page.evaluate(x => {
        const el = document.getElementById(x);
        if (!el) return {found: false};
        return {found: true, chars: ((el.innerText || '').trim()).length};
      }, v);
      if (!got.found) { missing.push(v); continue; }
      /* 120 characters is below every real view's content and above an empty
         shell's stray label — the thinnest genuine view in the fleet renders
         about 800. */
      if (got.chars < 120) thin.push(v + ' (' + got.chars + ' chars)');
      if (errs.length > before) broke.push(v + ' threw: ' + errs[before]);
    }
    if (missing.length) errs.push('no container rendered for view(s): ' + missing.join(', '));
    if (thin.length) errs.push('view(s) opened but rendered almost nothing: ' + thin.join(', '));
    if (broke.length) errs.push('view(s) failed to open: ' + broke.join(' | '));
    await page.evaluate(() => { try { LX.showView('mapview'); } catch (e) {} });
    await page.waitForTimeout(250);

    /* NOTHING SCORES ON A RULE OF THUMB.

       LX.rentEstimate() always returns a number. Where a market publishes no
       rent - no record rent, no ZORI, no city median, no FMR - the last branch
       is `price x 0.004`, a rule of thumb anchored to nothing. Rent is never
       public record, and of the fourteen markets this repository has measured,
       eight publish none, so that branch is the COMMON case rather than a
       corner. It produced a cap rate, a cash flow and a DSCR to three decimals,
       and those sailed through the buy box's rent floors: a record "met the
       Locator X criteria" on a number nobody measured.

       Note which half was already handled, because it is instructive: an
       UNKNOWN dscr becomes 0 via `||0` and was correctly excluded. The case that
       looked broken was fine; the fabricated one looked fine and passed.

       Every fixture in this fleet used to carry a full rent series, so the
       branch never fired in any test. The fleet now carries a rent-less edition
       and this asserts, on EVERY edition, that a rent-derived floor never admits
       a record whose rent has no basis. */
    const rent = await page.evaluate(() => {
      const ls = LX.allListings();
      let none = 0;
      for (const l of ls) { try { if (LX.rentEstimate(l).basis === 'none') none++; } catch (e) {} }
      const bb = LXUW.bb;
      const keep = {cap: bb.minCap, dscr: bb.minDscr, score: bb.minScore, price: bb.maxPrice,
                    units: bb.minUnits, evid: bb.minEvid};
      const relax = (cap, dscr) => { bb.minCap = cap; bb.minDscr = dscr; bb.minScore = 0;
        bb.maxPrice = 1e12; bb.minUnits = 0; bb.minEvid = 'any'; LX.dealBump(); LXUW.render(); };
      /* THE FLOOR MUST BE ONE THE INVENTED NUMBER CLEARS.

         At a floor of 1.0 the rule-of-thumb DSCR (~0.4) fails the comparison on
         its own, so the gate is never what excludes it and removing the gate
         changes nothing - this assertion passed while testing nothing, which is
         how it was first written. The floor is therefore set just under the
         smallest positive DSCR present, so ONLY the rent-basis gate can keep
         these records out. */
      relax(0, 0);
      const rows = (LXDash.rows && LXDash.rows.length) ? LXDash.rows : [];
      const pos = rows.map(r => (r.d && r.d.dscr) || 0).filter(v => v > 0);
      const low = pos.length ? Math.max(0.001, Math.min.apply(null, pos) / 2) : 0.01;
      relax(0, low);
      const gated = LXUW.matches();
      const leaked = gated.filter(r => r.d && r.d.rentBasis === 'none').length;
      const funnel = (document.getElementById('funnel') || {}).textContent || '';
      const saysBlind = /publishes no rent/.test(funnel);
      relax(0, 0);
      const open = LXUW.matches().length;
      Object.assign(bb, {minCap: keep.cap, minDscr: keep.dscr, minScore: keep.score,
                         maxPrice: keep.price, minUnits: keep.units, minEvid: keep.evid});
      LX.dealBump(); LXUW.render();
      /* THE TEACHING SURFACE MUST NOT RULE ON AN INVENTED RENT.

         Three of the LOCATOR screen's seven gates are rent questions. Where a
         market publishes none they used to return confident negatives: C said
         "this fails the first test" and A said "Liability - well documented, and
         it takes money out of your pocket", about a building nobody has a rent
         for. The record is well documented; the rent is not documented at all.
         This is the framework the curriculum is built on, so a wrong verdict
         here is a lesson. */
      /* NO RECORD IS CALLED A LIABILITY FOR WANT OF A RENT.

         Every branch of the category chain except the fall-through is a rent
         question, so a rent-blind market used to label everything it could not
         place "Liability at this price" - a confident negative claim about a
         building whose rent the app had invented. The `unrated` state is the
         absence of a verdict, not a sixth kind of property: muted rather than
         given a sixth hue (five is already at the colour-blind ceiling), and off
         by default in the buy box because nothing should rank on it. */
      /* THE ACADEMY MUST NOT GRADE A DRILL AGAINST AN INVENTED RENT SILENTLY.

         Its missions pose an exercise on a real address, ask the student to
         compute DSCR or cap rate, and mark the answer against LX.deal(l). Where
         a market publishes no rent every one of those keys descends from a
         0.4%/mo rule of thumb, and the explainer then teaches that the result
         "is the line between an asset and a liability". The student cannot tell.
         That makes this the worst surface in the app for the defect.

         The picker prefers a rent-sourced subject, but a mission's own
         eligibility filter comes first and can leave none — so the invariant is
         not "the subject always has rent", it is "a subject without rent always
         says so". */
      /* A PLACEHOLDER TAX RATE MUST NOT BE CALLED THE COUNTY'S RATE.

         CITY_TAX covers ten counties; every other county falls to a 1.2%
         national-average placeholder, and the assumptions panel used to render
         that as "East Baton Rouge: 1.2" — attributing a constant to a county
         that publishes its own millage. Two shipped editions run on it.

         This is labelled rather than refused, unlike rent: tax is one line of
         the operating stack and 1.2% is defensible, whereas a rule-of-thumb rent
         makes DSCR itself fictional. Both directions are checked, because a
         label that fires on a county the table DOES cover would be a new
         falsehood rather than a fix. */
      /* A FIGURE THE USER DID NOT SET MUST NOT LOOK LIKE ONE THEY DID.

         opexOf floors insurance at $1,200, because no carrier writes a policy
         for $250 a year. The floor is right; applying it SILENTLY was not. A
         user who sets 0.35% and opens a $200,000 record was shown a number that
         works out to 0.6%, with nothing saying the floor had bound — measured at
         581 of 14,024 fleet records. This is narrower than rent or the tax
         placeholder: the figure is defensible and nothing is invented. The
         defect is only that it disagreed with the stated input in silence. */
      /* A COUNT IN THE SHELL MUST BE COUNTED, NOT WRITTEN DOWN.

         The import page said "the map ships with 100 public-record properties"
         on every edition. It was written when one edition held a hundred records
         and never revisited: the Bay Atlas ships 213,381, the largest edition
         354,260, and Shelter Cove 24 — wrong everywhere by two to four orders of
         magnitude. Unlike the "walkable Bay Area" strings beside it, which
         build_state.py rewrites per edition through its regionalisation pairs,
         this one carried no pair, so the build could not correct it either. */
      /* A FILTER THAT CAN ONLY EVER RETURN NOTHING IS NOT A FILTER ANYBODY TESTED.

         views.js defines nine asset classes. Three of them classified NOTHING
         across all 14,024 fixture records: Commercial and Industrial & storage,
         because every fixture kind was residential or lodging; and the
         Conversion class, which was still gated on the `l.cv` builder flag.

         That third one was an app defect, not a fixture gap, and one this
         repository had already fixed once. conv.js derives candidacy from the
         RECORD — a lodging use, or five or more units — precisely because `cv`
         is written by a minority of the data builders, so the Conversion lab and
         the conversion lens rendered empty in every edition whose builder
         omitted it. The view builder's class was the surface that got missed.

         Not every class can be non-empty in every edition — Shelter Cove holds
         24 records and a market of houses need not contain a warehouse. What
         must hold is that no class is dead across the WHOLE fleet, which is what
         the totals below accumulate. */
      /* THE HEADLINE CATEGORY MUST BE REACHABLE SOMEWHERE.

         Measured before the fixture carried a realistic rent-to-value spread: of
         14,024 records across twelve editions, ZERO were cash-flow positive. Not
         one. So the Cash-flow asset category — this platform's own definition,
         "an asset puts money in your pocket" — was never assigned to a single
         record anywhere, and neither was Appreciation bet. The PASS branch of the
         LOCATOR cash-flow gate, the "Asset" verdict on its asset test and the
         dashboard's cash-flow card were all dead. Every positive path in the app
         was exercised only in the failure direction.

         Fleet-wide, like the asset classes: a rent-blind edition cannot produce a
         cash-flow asset and should not be asked to. */
      /* THE STRATEGY COMPARISON MUST GRADE AN INVENTED RENT AS AN INVENTION.

         switchboard.js classified rent by regex over LX.rentEstimate's `how`
         sentence — 'record' if it matched "your figure" or "from your data",
         'model' for everything else. Everything else included the 0.4%/mo rule
         of thumb that fires wherever a market publishes no rent, so a hold column
         in a rent-blind market carried the same basis band as one in the Bay. It
         reads the basis field now. Measured: the same record grades C on a
         modelled rent and D on a rule of thumb, where both were C before. */
      /* A RENT METHOD THAT CANNOT BE APPLIED MUST SAY SO.

         The HUD Fair Market Rent table covers six counties. Everywhere else the
         fmr branch fell through to the ratio method, which is the right FIGURE —
         a usable rent beats a blank — and named the ratio honestly in its `how`.
         But the selector still read "Section 8 / HUD Fair Market Rent" while
         showing something else. Measured across the fleet before the fix: fmr
         returned output identical to the default for every record, because no
         fixture county is in the table.

         Both directions, as ever: a county without a table entry must say the
         method does not apply, and a county WITH one must return a real FMR
         figure and no such note. */
      /* THE DESK NOW MEASURES ITSELF, AND MUST REFUSE TO BELOW ITS OWN FLOOR.

         docs/market/GAP.md carried one row that named itself: "Post-acquisition
         feedback into underwriting ... the honest name for this is *not built*."
         The pipeline ran new → screened → underwritten → offer drafted → passed
         and stopped, so the desk never learned whether its own arithmetic had
         been right about anything it screened.

         src/actuals.js is that row. What it must not do is the thing this
         repository refuses everywhere else: print a rate below a sample floor.
         One building's error is a fact about one building; a median from two is
         a decoration. So this drives it to floor-1 and to floor, and checks it
         refuses at one and reports with its denominator at the other. */
      /* "SALE DATE" ON A RECORD THAT WAS NEVER SOLD, ANYWHERE THAT VALUE APPEARS.

         Four places called LX.priceDate a "sale date": the map/list sort
         dropdown, the Deals table column, the house-hack table column, and the
         guide's worked-example sentence ("sold {priceDate}"). priceDate is the
         assessor's recorded or reassessed value date - present on every record -
         while l.sale/l.saleDate is a real transaction, populated only in
         disclosure-state editions and only on the parcels that actually traded.
         comps.js already names this distinction its own doctrine (basisOf():
         'sale' vs the weaker 'postsale'); docs/PULL_RECIPE.md states the rule -
         "Assessor values are NOT listing or sale prices." Every OTHER place that
         shows this date already says "recorded" or "assessed"; these four did
         not.

         LX.recordDate() / LX.recordDateLabel() are the fix: prefer the real sale
         date, fall back to the recorded date, and label honestly either way.
         Checked both directions across every record sampled - a "sold" label
         must never appear without a real saleDate, and "recorded" must never
         appear when one exists, because a refusal that fires on the wrong side
         is a new falsehood the same size as the one it replaced. */
      /* And the labels THEMSELVES: a regression that reverted just the option
         text (not the logic) would pass every check above. */
      let dateLabels = null;
      try {
        const sortOpt = document.querySelector('#sort option[value="date"]');
        dateLabels = {
          sortText: sortOpt ? sortOpt.textContent.trim() : null,
          sortOverclaims: sortOpt ? /^Sale date$/.test(sortOpt.textContent.trim()) : false
        };
      } catch (e) { dateLabels = {err: String(e)}; }

      let dates = null;
      try {
        let bad = 0, sampled = 0;
        for (const l of ls.slice(0, 400)) {
          const lab = LX.recordDateLabel(l);
          sampled++;
          if (/^sold /.test(lab) && !l.saleDate) bad++;
          if (/^recorded /.test(lab) && l.saleDate) bad++;
        }
        dates = {sampled, bad};
      } catch (e) { dates = {err: String(e)}; }

      let acts = null;
      try {
        const A = window.LXActuals;
        const el = () => (document.getElementById('actualsroot') || {}).innerText || '';
        const keep = JSON.parse(JSON.stringify(A.book));
        for (const k of Object.keys(A.book)) delete A.book[k];
        A.render();
        const zero = {chars: el().trim().length, says: /Nothing is marked acquired/.test(el())};
        const load = n => {
          for (const k of Object.keys(A.book)) delete A.book[k];
          ls.slice(0, n).forEach((l, i) => {
            A.markOwned(l.id, true);
            const d = LX.deal(l);
            A.book[l.id].paid = Math.round(LX.price(l));
            A.book[l.id].rentMo = Math.round((d.rentMo || 1000) * 0.9);
            A.book[l.id].opexYr = Math.round((d.opex || 1000) * 1.1);
          });
          A.render();
        };
        const F = A.BIAS_FLOOR;
        load(F - 1);
        const below = {owned: A.bias().owned, refuses: /below the/i.test(el()),
                       median: /median error/i.test(el())};
        load(F);
        const at = {owned: A.bias().owned, refuses: /below the/i.test(el()),
                    median: /median error/i.test(el()), saysN: /n=/i.test(el())};
        for (const k of Object.keys(A.book)) delete A.book[k];
        Object.assign(A.book, keep); A.render();
        acts = {floor: F, zero, below, at};
      } catch (e) { acts = {err: String(e)}; }

      let fmr = null;
      try {
        const l0 = ls[0], savedC = l0.county, savedM = LX.state.assump.rentMethod;
        LX.state.assump.rentMethod = 'fmr'; LX.dealBump();
        const away = LX.rentEstimate(l0).how || '';
        l0.county = 'Orleans'; LX.dealBump();
        const have = LX.rentEstimate(l0).how || '';
        l0.county = savedC; LX.state.assump.rentMethod = savedM; LX.dealBump();
        fmr = {awayNotes: /does not apply here/.test(away),
               haveIsFmr: /Fair Market Rent/.test(have),
               haveNotes: /does not apply here/.test(have),
               inTable: /Fair Market Rent/.test(away)};
      } catch (e) { fmr = {err: String(e)}; }

      let sbRent = null;
      try {
        const cols = LXSB.compare(ls[0]);
        const hold = cols.find(c => c.key === 'hold');
        const rb = hold && (hold.basis || []).find(x => /Rent/i.test(x.what));
        sbRent = {kind: rb && rb.kind, band: hold && hold.grade && hold.grade.band,
                  basis: (LX.deal(ls[0]) || {}).rentBasis};
      } catch (e) { sbRent = {err: String(e)}; }

      let catTally = null;
      try {
        LX.dealBump(); LXDash.render();
        catTally = {};
        for (const r of (LXDash.rows || [])) catTally[r.cat] = (catTally[r.cat] || 0) + 1;
      } catch (e) { catTally = {err: String(e)}; }

      let cls = null;
      try {
        cls = {};
        for (const c of (window.LXView && LXView.CLASSES) || []) {
          let n = 0;
          for (const l of ls) { try { if (c.test(l)) n++; } catch (e) {} }
          cls[c.id] = n;
        }
      } catch (e) { cls = {err: String(e)}; }

      let ship = null;
      try {
        const el = document.getElementById('dataShipN');
        const txt = el ? el.textContent.replace(/[,\s]/g, '') : null;
        ship = {found: !!el, txt, expect: ls.filter(x => x.src !== 'imp').length};
      } catch (e) { ship = {err: String(e)}; }

      let ins = null;
      try {
        const a2 = LX.state.assump;
        const lo = ls.filter(x => LX.price(x) * a2.ins / 100 < 1200)[0];
        const hi = ls.filter(x => LX.price(x) * a2.ins / 100 >= 1200)[0];
        ins = {
          loFlag: lo ? LX.deal(lo).insFloored : null,
          loIns:  lo ? Math.round(LX.deal(lo).ins) : null,
          hiFlag: hi ? LX.deal(hi).insFloored : null
        };
      } catch (e) { ins = {err: String(e)}; }

      let tax = null;
      try {
        const l0 = LX.allListings()[0];
        const saved = l0.county;
        l0.county = 'Alameda';           // in CITY_TAX
        const known = {basis: LX.taxBasis(l0), rate: LX.taxRate(l0)};
        l0.county = '\u200bNowhere Parish';  // cannot be in the table
        const unknown = {basis: LX.taxBasis(l0), rate: LX.taxRate(l0)};
        l0.county = saved;
        tax = {known, unknown, def: LX.TAX_DEFAULT};
      } catch (e) { tax = {err: String(e)}; }

      let acad = null;
      try {
        const A = window.LXAcad;
        acad = {missions: 0, blind: 0, noted: 0};
        for (const m of A.MISSIONS) {
          let inst = null;
          try { inst = m.make(); } catch (e) { continue; }
          if (!inst || !inst.l) continue;
          acad.missions++;
          if (!A.rentSourced(inst.l)) { acad.blind++; if (A.rentBlindNote(inst.l)) acad.noted++; }
        }
      } catch (e) { acad = {err: String(e)}; }

      LX.dealBump(); LXDash.render();
      const tally = {};
      for (const r of (LXDash.rows || [])) tally[r.cat] = (tally[r.cat] || 0) + 1;

      let gate = null;
      try {
        const sh = LXUW.sheetFor(ls[0]);
        const g = LXLocator.gates(ls[0], sh.uw);
        const at = k => g.find(x => x.k === k) || {};
        gate = {basis: sh.uw.rentBasis, C: at('C').v, A: at('A').v, Aval: at('A').val,
                O: at('O').v, Cnote: at('C').note || ''};
      } catch (e) { gate = {err: String(e)}; }

      return {n: ls.length, none, leaked, saysBlind, open, floor: low, gate, tally, acad, tax, ins, ship, cls, catTally, sbRent, fmr, acts, dates, dateLabels,
              basisOfFirst: (LX.deal(ls[0]) || {}).rentBasis};
    });
    if (rent.leaked > 0) {
      errs.push(rent.leaked + ' record(s) passed the buy box at a DSCR floor of ' + rent.floor
        + ' while their rent is a 0.4%/mo rule of thumb - the criteria were met on a number '
        + 'nobody measured');
    }
    if (!rent.basisOfFirst) {
      errs.push('deal() no longer carries rentBasis, so nothing downstream can tell a measured '
        + 'rent from a rule of thumb');
    }
    if (rent.none > 0) {
      /* A rent-blind market must SAY it is rent-blind. A buy box that quietly
         returns nothing here reads as "no good deals", not "this question
         cannot be asked here", and those are opposite findings. */
      if (!rent.saysBlind) {
        errs.push('this edition publishes no rent for ' + rent.none + ' of ' + rent.n
          + ' records, and the funnel does not say so - silently returning nothing reads as '
          + '"no good deals here" when the truth is "this cannot be asked here"');
      }
      /* ...and the advice that note gives must be true: clearing the rent floors
         must actually rank on what the record does carry. */
      if (!(rent.open > 0)) {
        errs.push('with both rent floors cleared this rent-blind edition still matches nothing, '
          + 'so the funnel note telling the user to clear them is wrong');
      }
    } else if (rent.saysBlind) {
      errs.push('this edition publishes rent for every record but the funnel claims it is rent-blind');
    }
    {
      const t = rent.tally || {};
      if (rent.none === rent.n && rent.n > 0) {
        /* Wholly rent-blind: not one record may be called a liability. */
        if (t.liab) {
          errs.push(t.liab + ' record(s) are categorised "Liability at this price" in a market '
            + 'that publishes no rent - a confident negative claim about a building whose rent '
            + 'the app invented');
        }
        if (!t.unrated) {
          errs.push('no record is marked unrated in a wholly rent-blind edition, so the absence '
            + 'of a rent feed is not visible in the categories at all');
        }
      } else if (rent.none === 0 && t.unrated) {
        /* ...and the control: where rent IS published, nothing should be unrated. */
        errs.push(t.unrated + ' record(s) are marked unrated although this market publishes rent '
          + 'for every one - the state is leaking beyond the case it exists for');
      }
    }
    if (rent.cls && !rent.cls.err) {
      for (const k in rent.cls) clsTotal[k] = (clsTotal[k] || 0) + rent.cls[k];
    }
    if (rent.catTally && !rent.catTally.err) {
      for (const k in rent.catTally) catTotal[k] = (catTotal[k] || 0) + rent.catTally[k];
    }
    if (rent.ship && rent.ship.err) {
      errs.push('the shipped-count claim could not be read: ' + rent.ship.err);
    } else if (rent.ship) {
      if (!rent.ship.found) {
        errs.push('the import page no longer carries a countable shipped-record figure — if the '
          + 'number went back to being written into the markup it is wrong on every other edition');
      } else if (rent.ship.txt !== String(rent.ship.expect)) {
        errs.push('the import page says it ships ' + rent.ship.txt + ' records; this edition holds '
          + rent.ship.expect);
      }
    }
    if (rent.ins && rent.ins.err) {
      errs.push('the insurance floor could not be evaluated: ' + rent.ins.err);
    } else if (rent.ins) {
      if (rent.ins.loFlag === false) {
        errs.push('a record whose insurance comes from the $1,200 floor does not say so — its '
          + 'pro-forma shows a figure the user did not set and nothing marks it');
      }
      if (rent.ins.loFlag === true && rent.ins.loIns !== 1200) {
        errs.push('a record is flagged as floored but its insurance is ' + rent.ins.loIns);
      }
      if (rent.ins.hiFlag === true) {
        errs.push('a record whose insurance exceeds the floor is flagged as floored — the label '
          + 'would appear over a figure that IS the stated assumption');
      }
    }
    if (rent.tax && rent.tax.err) {
      errs.push('the tax-rate basis could not be evaluated: ' + rent.tax.err);
    } else if (rent.tax) {
      if (rent.tax.known.basis !== 'county') {
        errs.push('a county WITH a published rate in CITY_TAX reports basis "' + rent.tax.known.basis
          + '" — the placeholder label would appear over a real figure');
      }
      if (rent.tax.unknown.basis !== 'placeholder') {
        errs.push('a county absent from CITY_TAX reports basis "' + rent.tax.unknown.basis
          + '" — a national-average constant is being presented as that county\'s published rate');
      }
      if (rent.tax.unknown.rate !== rent.tax.def) {
        errs.push('the fallback tax rate is ' + rent.tax.unknown.rate + ', not the declared default');
      }
    }
    if (rent.acad && rent.acad.err) {
      errs.push('the Academy missions could not be evaluated: ' + rent.acad.err);
    } else if (rent.acad && rent.acad.missions > 0) {
      if (rent.acad.blind !== rent.acad.noted) {
        errs.push((rent.acad.blind - rent.acad.noted) + ' Academy mission(s) are set on a property '
          + 'whose rent is a 0.4%/mo rule of thumb and say nothing about it — the drill is graded '
          + 'against an invented number and the student cannot tell');
      }
      if (rent.none === 0 && rent.acad.blind > 0) {
        errs.push(rent.acad.blind + ' Academy mission(s) drew a rent-blind subject in a market that '
          + 'publishes rent for every record — the picker is not preferring sourced subjects');
      }
      if (rent.none === rent.n && rent.acad.noted !== rent.acad.missions) {
        errs.push('only ' + rent.acad.noted + ' of ' + rent.acad.missions + ' Academy missions carry '
          + 'the rent notice in a wholly rent-blind edition');
      }
    }
    if (rent.dateLabels && rent.dateLabels.err) {
      errs.push('the sort dropdown could not be read: ' + rent.dateLabels.err);
    } else if (rent.dateLabels && rent.dateLabels.sortOverclaims) {
      errs.push('the "date" sort option reads exactly "Sale date" — it sorts by priceDate, the '
        + 'assessor\'s recorded value, on any record without a real sale; the label overclaims '
        + 'again');
    }
    if (rent.dates && rent.dates.err) {
      errs.push('the record-date labelling could not be exercised: ' + rent.dates.err);
    } else if (rent.dates && rent.dates.bad) {
      errs.push(rent.dates.bad + ' of ' + rent.dates.sampled + ' records carry a "sold" or '
        + '"recorded" label that disagrees with whether they have a real sale date — a sale on a '
        + 'record that was never sold, or the reverse');
    }
    if (rent.acts && rent.acts.err) {
      errs.push('the acquired ledger could not be exercised: ' + rent.acts.err);
    } else if (rent.acts) {
      if (!(rent.acts.zero.chars > 200) || !rent.acts.zero.says) {
        errs.push('with nothing acquired the feedback panel does not explain itself');
      }
      if (!rent.acts.below.refuses || rent.acts.below.median) {
        errs.push('the underwriting feedback printed a median error from ' + rent.acts.below.owned
          + ' properties, below its own ' + rent.acts.floor + '-property floor — a tendency computed '
          + 'from that many is a decoration, which is what this repository refuses everywhere else');
      }
      if (!rent.acts.at.median || rent.acts.at.refuses) {
        errs.push('the underwriting feedback still refuses at ' + rent.acts.at.owned
          + ' properties, its own floor — the measurement never becomes available');
      }
      if (!rent.acts.at.saysN) {
        errs.push('the underwriting feedback reports a median without its denominator');
      }
    }
    if (rent.fmr && rent.fmr.err) {
      errs.push('the FMR method could not be exercised: ' + rent.fmr.err);
    } else if (rent.fmr) {
      if (!rent.fmr.inTable && !rent.fmr.awayNotes) {
        errs.push('the Fair Market Rent method silently returned another method\'s figure for a '
          + 'county HUD does not publish — the selector says Section 8 while the number is not');
      }
      if (!rent.fmr.haveIsFmr) {
        errs.push('the Fair Market Rent method did not return an FMR figure for a county that IS '
          + 'in the table — the method is broken, not merely inapplicable');
      }
      if (rent.fmr.haveNotes) {
        errs.push('a county with a published FMR still carries the does-not-apply note — the '
          + 'caveat is leaking past the case it exists for');
      }
    }
    if (rent.sbRent && rent.sbRent.err) {
      errs.push('the switchboard rent basis could not be read: ' + rent.sbRent.err);
    } else if (rent.sbRent && rent.sbRent.kind) {
      if (rent.sbRent.basis === 'none' && rent.sbRent.kind !== 'assumption') {
        errs.push('the switchboard grades this market\'s rent as "' + rent.sbRent.kind
          + '" while it is a 0.4%/mo rule of thumb — the strategy comparison is treating an '
          + 'invented figure as a modelled one');
      }
      if (rent.sbRent.basis !== 'none' && rent.sbRent.kind === 'assumption') {
        errs.push('the switchboard grades a rent with a real basis (' + rent.sbRent.basis
          + ') as an assumption — the refusal is too broad');
      }
    }
    if (rent.gate && rent.gate.err) {
      errs.push('the LOCATOR screen could not be evaluated: ' + rent.gate.err);
    } else if (rent.gate && rent.gate.basis === 'none') {
      if (rent.gate.C !== 'unknown') {
        errs.push('the LOCATOR cash-flow gate returned "' + rent.gate.C + '" in a market that '
          + 'publishes no rent - a verdict on a 0.4%/mo rule of thumb, on the teaching surface');
      }
      if (rent.gate.A !== 'unknown' || /Liabilit/i.test(rent.gate.Aval || '')) {
        errs.push('the LOCATOR asset test returned "' + rent.gate.Aval + '" (' + rent.gate.A
          + ') with no rent published - it asks whether the cash flows can be SOURCED, and they cannot');
      }
      if (rent.gate.O !== 'unknown') {
        errs.push('the LOCATOR ownership-economics gate counted cash flow as known with no rent published');
      }
      if (!/publishes no rent/.test(rent.gate.Cnote)) {
        errs.push('the LOCATOR cash-flow gate refused without saying the market publishes no rent');
      }
    } else if (rent.gate && rent.gate.basis && rent.gate.basis !== 'none') {
      /* ...and the control: where rent IS anchored to something published, the
         gates must still be willing to return a negative. A screen that answers
         "unknown" everywhere is not honest, it is useless. */
      if (rent.gate.C === 'unknown' && rent.gate.A === 'unknown' && rent.gate.O === 'unknown') {
        errs.push('every rent-derived LOCATOR gate returned unknown even though this market '
          + 'publishes rent (basis ' + rent.gate.basis + ') - the refusal is too broad');
      }
    }

    /* EVERY MAP LENS, on every edition.

       A lens that leaves every property dim draws a uniformly grey map, and the
       user cannot tell "this market publishes no distress records" from "the
       distress layer is broken". Those are opposite findings and they look
       identical. Measured on the fleet: three of eight lenses placed nothing,
       and exactly one of the three was a defect - the conversion lens was gated
       on a builder flag (l.cv) that two of seventeen data builders set, so the
       Conversion lab AND the lens rendered empty everywhere else. Same shape as
       the l.hh house-hack defect, different flag.

       So: the conversion lens must place SOMETHING wherever the edition carries
       lodging or 5+ unit stock, and every lens must state its own reach. */
    const lens = await page.evaluate(async () => {
      LX.showView('mapview');
      await new Promise(r => setTimeout(r, 1200));
      const sel = document.getElementById('lens');
      if (!sel) return { err: 'no lens control' };
      const all = LX.allListings();
      const convStock = all.filter(l => /hotel|motel|lodging|sro/i.test(l.kind || '')
                                     || (l.units || 0) >= 5).length;
      const out = { convStock, cvFlag: all.filter(l => l.cv).length, lenses: [] };
      for (const v of [...sel.options].map(o => o.value)) {
        sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 320));
        const el = document.getElementById('lensnote');
        out.lenses.push({ lens: v,
          note: (el && el.textContent || '').trim(),
          blind: !!(el && el.classList.contains('blind')) });
      }
      sel.value = 'fit'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      return out;
    });
    if (lens.err) {
      errs.push('map lens audit: ' + lens.err);
    } else {
      /* Every lens states its reach. A silent note is the failure this whole
         check exists for: it is what a broken lens and an empty market share. */
      lens.lenses.forEach(L => {
        if (!(L.note.length > 20)) {
          errs.push('the "' + L.lens + '" lens states no reach — a grey map with no note '
            + 'cannot be told apart from a broken layer');
        }
      });
      /* THE EVIDENCE LENS. docs/market/GAP.md records source grading as the one
         capability with no equivalent in the category, and until now it reached
         a single surface: the drawer of a property already opened. A lens that
         shows WHERE the record is thin is the map's version of the coverage
         panel, and it must colour from LXEvid's own palette rather than a
         second copy — the drift that has cost this project four rules already. */
      const ev = lens.lenses.find(L => L.lens === 'evid');
      if (!ev) {
        errs.push('the evidence lens is missing from the lens control');
      } else if (!/\d/.test(ev.note)) {
        errs.push('the evidence lens states no grade counts — the whole point is the '
          + 'distribution of record quality, not another colour ramp');
      }
      const conv = lens.lenses.find(L => L.lens === 'conv');
      if (conv && lens.convStock > 0 && conv.blind) {
        errs.push('the conversion lens placed NOTHING while this edition carries '
          + lens.convStock + ' lodging or 5+ unit records. Candidacy comes from the '
          + 'record (src/conv.js candidate()), never from a builder flag — l.cv is set '
          + 'by 2 of 17 builders and ' + lens.cvFlag + ' records here carry it.');
      }
      if (conv && lens.convStock === 0 && !conv.blind) {
        errs.push('the conversion lens placed properties in an edition with no lodging '
          + 'or 5+ unit stock at all');
      }
    }

    /* THE ZIP CHOROPLETH OVERLAYS, on every edition.

       Four of the five painted NOTHING, in every edition ever built. They read
       zhvi / zori / yoy off the ZIP geojson feature properties, and the only
       code that ever wrote a property onto those features was scout.js writing
       `fc` for the forecast layer. The series existed the whole time in
       M.zips - the same data marketFor() reads for every property panel - and
       was never joined to the geometry.

       Worse than blank: applyLayer() still drew a legend with a colour ramp,
       dollar endpoints and a "Zillow Research" attribution under a fully
       transparent map. A blank layer looks broken; a legend under a blank layer
       asserts that data is shown and names a source for it.

       Two further defects found while fixing it, both of which this checks:
       maplibre keeps its own copy of a source's data, so mutating the geojson
       left the paint reading pre-bake properties while every console probe saw
       correct values; and the stops were Bay Area constants ($500k-$2.5M)
       applied to every edition, so a market spanning $319k-$775k occupied 22.8%
       of the ramp with everything under $500k clamped flat. */
    const ovl = await page.evaluate(async () => {
      LX.showView('mapview');
      await new Promise(r => setTimeout(r, 1400));
      const sel = document.getElementById('layer');
      if (!sel) return { err: 'no layer control' };
      const PROP = { zhvi: 'zhvi', zori: 'zori', yoy: 'yoy', fcast: 'fc' };
      const out = { layers: [] };
      for (const v of [...sel.options].map(o => o.value)) {
        if (v === 'none') continue;
        sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 300));
        const zf = (window.BA && BA.geo && BA.geo.zips && BA.geo.zips.features) || [];
        const painted = v === 'yield'
          ? zf.filter(f => typeof f.properties.zhvi === 'number'
                        && typeof f.properties.zori === 'number').length
          : zf.filter(f => typeof f.properties[PROP[v]] === 'number').length;
        const leg = (document.getElementById('legend') || {}).textContent || '';
        out.layers.push({ layer: v, painted, of: zf.length, leg: leg.trim() });
      }
      sel.value = 'none'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      return out;
    });
    if (ovl.err) {
      errs.push('ZIP overlay audit: ' + ovl.err);
    } else {
      ovl.layers.forEach(L => {
        /* A legend is a claim that data is displayed. It may only appear with a
           colour ramp when something is actually shaded. */
        const hasRamp = /\$|%/.test(L.leg) && !/nothing is shaded/.test(L.leg);
        if (L.painted === 0 && hasRamp) {
          errs.push('the "' + L.layer + '" ZIP overlay shades none of ' + L.of
            + ' ZIPs and still draws a legend with a scale — a legend under a '
            + 'transparent map asserts data that is not there');
        }
        if (L.painted > 0 && !/scale from this edition|default scale/.test(L.leg)) {
          errs.push('the "' + L.layer + '" overlay shades ' + L.painted + ' ZIPs but its '
            + 'legend does not say where the scale came from — hard-coded Bay Area stops '
            + 'were applied to every edition once already');
        }
        if (L.painted === 0 && !/nothing is shaded/.test(L.leg)) {
          errs.push('the "' + L.layer + '" overlay shades nothing and does not say so');
        }
      });
      /* At least one overlay must work wherever the edition carries ZIP series
         at all - the join that was missing for the entire life of the app. */
      const anyPainted = ovl.layers.some(L => L.painted > 0);
      const zipCount = ovl.layers.length ? ovl.layers[0].of : 0;
      if (zipCount > 0 && !anyPainted) {
        errs.push('NO ZIP overlay shades anything in an edition carrying ' + zipCount
          + ' ZIP polygons — bakeZipStats() is not joining M.zips to the geometry, or '
          + 'the GL source was not re-set after the bake');

      }
    }
    /* THE OVERLAY AUDIT ABOVE READS FEATURE PROPERTIES. THE USER READS PIXELS.

       That distinction is the whole reason the choropleth shipped broken for the
       life of the app, and the audit above — written after finding it — still
       cannot see the failure it was written for. MapLibre keeps its OWN copy of
       a source's data. bakeZipStats() writes zhvi/zori/yoy onto the geojson
       features, so `f.properties.zhvi` reads back correctly from the console and
       from that audit; if updateZipsSource() does not then re-set the source,
       the paint expression keeps reading the pre-bake copy and the map does not
       change. Properties correct, map wrong, every JS probe satisfied.

       Measured, by deleting the updateZipsSource() call and rebuilding: zhvi,
       zori, yield and yoy all rendered the IDENTICAL image — four different
       datasets drawing one picture — and the full suite came back CLEAN. Only
       fcast survived, because scout.js writes `fc` onto the features directly
       rather than through the bake.

       So this compares rendered pixels. Two invariants, both measured across
       every edition before being asserted:

         - every overlay must differ from no-overlay at all;
         - zhvi must differ from yoy, and from zori.

       Not "all four must differ": in a market that publishes no rent, zori and
       yield legitimately collapse onto each other, which is honest rather than
       broken, and `norent` shows exactly that (3 distinct of 4 while the other
       eleven editions show 4). An invariant that failed there would be punishing
       the app for telling the truth. */
    {
      const shot = async () => {
        const box = await page.evaluate(() => {
          const m = document.getElementById('map');
          if (!m) return null;
          const r = m.getBoundingClientRect();
          if (r.width < 80 || r.height < 80) return null;
          return {x: Math.round(r.x) + 10, y: Math.round(r.y) + 10,
                  width: Math.min(600, Math.round(r.width) - 20),
                  height: Math.min(420, Math.round(r.height) - 20)};
        });
        if (!box) return null;
        const buf = await page.screenshot({clip: box});
        return require('crypto').createHash('md5').update(buf).digest('hex').slice(0, 10);
      };
      const setLayer = async v => {
        await page.evaluate(x => {
          const sel = document.getElementById('layer');
          if (sel) { sel.value = x; sel.dispatchEvent(new Event('change', {bubbles: true})); }
        }, v);
        await page.waitForTimeout(1400);
      };
      await page.evaluate(() => { try { LX.showView('mapview'); } catch (e) {} });
      await page.waitForTimeout(900);
      const pix = {};
      for (const v of ['none', 'zhvi', 'zori', 'yield', 'yoy']) { await setLayer(v); pix[v] = await shot(); }
      await setLayer('none');
      if (pix.none == null) {
        errs.push('the map could not be captured, so no overlay was checked against what it draws');
      } else {
        const flat = ['zhvi', 'zori', 'yield', 'yoy'].filter(v => pix[v] === pix.none);
        if (flat.length) {
          errs.push('ZIP overlay(s) ' + flat.join(', ') + ' draw the map exactly as it looks with '
            + 'no overlay at all — the feature properties may be baked, but MapLibre is painting '
            + 'from its own stale copy of the source');
        }
        if (pix.zhvi === pix.yoy) {
          errs.push('the zhvi and yoy overlays render an IDENTICAL image — a value level and a '
            + 'year-over-year change are never the same picture, so the GL source is stale');
        }
        if (pix.zhvi === pix.zori) {
          errs.push('the zhvi and zori overlays render an IDENTICAL image — values and rents are '
            + 'never the same picture, so the GL source is stale');
        }
      }
    }

    /* THE DIGITAL TWIN, on every edition.

       It opened in San Francisco everywhere. center was [-122.416, 37.762] and
       maxBounds was the Bay Area box, both hard-coded, while app.js has always
       read BA.region for exactly this. Measured on the synthetic fleet: the twin
       opened 11,566 km from the edition's own records and, because the records
       fell OUTSIDE maxBounds, the user could not pan to them. The view was not
       misplaced; it was locked away from its own data.

       Third instance of one defect: Bay-Area-first code never revisited when the
       app went multi-edition (the sixty-four city labels, the choropleth stops,
       this). So the check is geographic, not cosmetic: the twin must open near
       the records and must be able to reach them. */
    const twin = await page.evaluate(() => {
      if (!window.LXTwin || !LXTwin.twinView) return { err: 'twinView not exported' };
      const v = LXTwin.twinView();
      const all = LX.allListings();
      let sx = 0, sy = 0, n = 0, inB = 0;
      all.forEach(l => {
        if (typeof l.lng !== 'number' || typeof l.lat !== 'number') return;
        sx += l.lng; sy += l.lat; n++;
        if (!v.maxBounds) { inB++; return; }
        if (l.lng >= v.maxBounds[0][0] && l.lng <= v.maxBounds[1][0]
         && l.lat >= v.maxBounds[0][1] && l.lat <= v.maxBounds[1][1]) inB++;
      });
      if (!n) return { none: true };
      const cen = [sx / n, sy / n];
      return { km: Math.hypot((v.center[0] - cen[0]) * 88, (v.center[1] - cen[1]) * 111),
               inB, n, hh: all.filter(l => window.LXHH && LXHH.candidate
                                        && LXHH.candidate(l)).length,
               u24: all.filter(l => (l.units || 1) >= 2 && (l.units || 1) <= 4).length };
    });
    if (twin.err) errs.push('digital twin: ' + twin.err);
    else if (!twin.none) {
      if (!(twin.km < 200)) {
        errs.push('the digital twin opens ' + Math.round(twin.km) + ' km from this '
          + 'edition\'s own records — it is reading a hard-coded centre instead of '
          + 'BA.region or the record centroid');
      }
      if (twin.inB < twin.n) {
        errs.push('the digital twin\'s maxBounds excludes ' + (twin.n - twin.inB)
          + ' of ' + twin.n + ' records — the view is locked away from its own data');
      }
      /* The training drop and the house-hack fabric were gated on l.hh, which no
         data builder sets. Candidacy comes from hacks.js candidate(). */
      if (twin.u24 > 0 && twin.hh === 0) {
        errs.push('house-hack candidacy resolves to zero against ' + twin.u24
          + ' two-to-four-unit records — twin.js is back on the l.hh flag, which '
          + '0 of 17 data builders set');
      }
    }

    await page.evaluate(() => LX.showView('mapview'));
    await page.waitForTimeout(500);

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

      // The property-tower field. Every tower is one property and carries its
      // record id, and the layer had NEVER RENDERED in any edition: it asked for
      // a data expression on fill-extrusion-opacity, which MapLibre does not
      // support, so it answered on the map's error channel and refused the
      // layer. addLayer returned, paint() returned true, toggle() reported
      // success and the button flipped — a completely silent failure.
      //
      // So this asserts the layer is really in the style and its features
      // really carry ids, and it watches the map's own error channel, which is
      // where that class of failure speaks and where nothing was listening.
      const tw = await page.evaluate(async () => {
        const m = window.__lxmap;
        if (!m || !m.getStyle || !window.LXTowers) return null;
        const mapErrors = [];
        m.on('error', e => mapErrors.push(String((e && e.error && e.error.message) || e).slice(0, 200)));
        try { LXTowers.mount(); } catch (e) {}
        const toggled = LXTowers.toggle(true);
        await new Promise(r => setTimeout(r, 1500));
        const ids = m.getStyle().layers.map(l => l.id).filter(id => id.indexOf('lxptower') === 0);
        let feats = [];
        try { feats = m.querySourceFeatures('lxptowers'); } catch (e) {}
        const withId = feats.filter(f => f.properties && f.properties.id);
        // the chain a click runs: feature id -> LX.select -> drawer
        let opened = false;
        if (withId.length) {
          LX.select(withId[0].properties.id, false);
          await new Promise(r => setTimeout(r, 500));
          opened = !!document.querySelector('#drawer.open');
        }
        LXTowers.toggle(false);
        await new Promise(r => setTimeout(r, 400));
        const after = m.getStyle().layers.map(l => l.id).filter(id => id.indexOf('lxptower') === 0);
        return {toggled, layers: ids, features: feats.length, withId: withId.length,
                opened, layersAfterOff: after.length, mapErrors};
      });
      if (tw) {
        if (tw.toggled !== true) errs.push('property towers did not switch on: ' + tw.toggled);
        if (!tw.layers.length) {
          errs.push('the property-tower layer is not in the style — it was refused, '
            + 'not drawn: ' + (tw.mapErrors[0] || 'no map error captured'));
        }
        if (tw.mapErrors.length) {
          errs.push('the map rejected a tower layer: ' + tw.mapErrors[0]);
        }
        if (!(tw.withId > 0)) {
          errs.push('tower features carry no record id, so a click cannot open a property');
        }
        if (tw.withId > 0 && !tw.opened) {
          errs.push('selecting a tower\'s record did not open the drawer');
        }
        if (tw.layersAfterOff !== 0) {
          errs.push('switching towers off left ' + tw.layersAfterOff + ' layer(s) behind');
        }
      }

      // The Dashboard and the Deals table score the WHOLE edition while the map
      // shows the filtered set, and both leaded with "Every property on the
      // map" — false whenever a filter was on. The copy is corrected and the
      // difference is now stated out loud. Assert the BEHAVIOUR: silent with no
      // filter, visible and naming both counts with one.
      const sc = await page.evaluate(async () => {
        const seen = () => { const e = document.querySelector('#dashscope');
          return !!e && getComputedStyle(e).display !== 'none' && e.offsetParent !== null; };
        LX.showView('dash');
        await new Promise(r => setTimeout(r, 1800));
        const quiet = seen();
        const lede = (document.getElementById('dash').innerText || '');
        LX.showView('mapview');
        await new Promise(r => setTimeout(r, 900));
        const chip = document.querySelector('#cityrail .citychip:nth-of-type(2)');
        if (!chip) return {skip: true, quiet, lede};
        chip.click();
        await new Promise(r => setTimeout(r, 1200));
        LX.showView('dash');
        await new Promise(r => setTimeout(r, 1800));
        const el = document.querySelector('#dashscope');
        const out = {skip: false, quiet, lede, loud: seen(),
                     text: (el && el.textContent || '').trim(),
                     filtered: LX.filtered().length, all: LX.allListings().length};
        document.querySelector('#cityrail .citychip').click();
        await new Promise(r => setTimeout(r, 700));
        LX.showView('mapview');
        await new Promise(r => setTimeout(r, 600));
        return out;
      });
      if (sc) {
        if (/Every property on the map/.test(sc.lede)) {
          errs.push('a view still claims it scores "every property on the map" while '
            + 'it scores the whole edition');
        }
        if (sc.quiet) errs.push('the scope note shows with no map filter applied');
        if (!sc.skip) {
          if (!sc.loud) {
            errs.push('the scope note stayed hidden while the map was filtered to '
              + sc.filtered + ' of ' + sc.all);
          }
          if (sc.loud && !(sc.text.indexOf(sc.all.toLocaleString()) >= 0
                        && sc.text.indexOf(sc.filtered.toLocaleString()) >= 0)) {
            errs.push('the scope note does not name both counts: ' + sc.text.slice(0, 90));
          }
        }
      }

      // The search box is debounced, and that is load-bearing rather than
      // cosmetic: one filter pass costs 332 ms on the largest shipped edition's
      // record count (354,260 measured), so an undebounced field spent ~3.2
      // seconds of blocked main thread on a five-letter word. Assert the
      // BEHAVIOUR — the count must not move on the keystroke itself, and must
      // have moved once the window passes — not that a constant exists.
      const dq = await page.evaluate(async () => {
        const q = document.getElementById('q');
        const countOf = () => (document.getElementById('count').textContent || '').trim();
        q.value = ''; q.dispatchEvent(new Event('input', {bubbles: true}));
        await new Promise(r => setTimeout(r, 500));
        const before = countOf();
        const term = (window.BA.listings[0].addr || '').split(' ').pop().slice(0, 4);
        q.value = term;
        q.dispatchEvent(new Event('input', {bubbles: true}));
        const immediate = countOf();          // read synchronously: no await
        await new Promise(r => setTimeout(r, 600));
        const settled = countOf();
        q.value = ''; q.dispatchEvent(new Event('input', {bubbles: true}));
        await new Promise(r => setTimeout(r, 600));
        return {term, before, immediate, settled, restored: countOf()};
      });
      if (dq.term && dq.term.length >= 3) {
        if (dq.immediate !== dq.before) {
          errs.push('the search box is not debounced — the count moved on the keystroke itself ('
            + dq.before + ' -> ' + dq.immediate + ')');
        }
        if (dq.settled === dq.before) {
          errs.push('the debounced search never applied: still ' + dq.settled
            + ' after the window for "' + dq.term + '"');
        }
        if (dq.restored !== dq.before) {
          errs.push('clearing the search box did not restore the list: '
            + dq.restored + ' of ' + dq.before);
        }
      }

      // The district rail. Districts come from the record's own nb/anb, and on
      // this fixture four in five records carry neither, so the assertions are
      // the coverage story rather than the happy path.
      //
      // The expectation is derived from the DATA, never from the markup. An
      // earlier version asked the chips whether a no-district bucket existed and
      // only then checked it — so when the bucket's marker regressed, the test
      // skipped its own most important assertion and passed. If the edition has
      // unnamed records, a bucket MUST exist and MUST select exactly them.
      const dExpect = await page.evaluate(() => ({
        unnamed: LX.allListings().filter(l => !(l.nb || l.anb)).length,
        named: new Set(LX.allListings().map(l => l.nb || l.anb).filter(Boolean)).size
      }));
      const dchips = await page.$$eval('#districtrail .citychip', n => n.length);
      if (dExpect.named >= 2) {
        if (!dchips) errs.push('district rail rendered nothing though the edition names '
          + dExpect.named + ' districts');
        const total = await page.evaluate(() => LX.filtered().length);
        await page.click('#districtrail .citychip:nth-of-type(2)');
        await page.waitForTimeout(900);
        const one = await page.evaluate(() => LX.filtered().length);
        if (!(one > 0 && one < total)) {
          errs.push('selecting a district did not narrow the list: ' + total + ' -> ' + one);
        }

        if (dExpect.unnamed > 0) {
          // The bucket is where the bug was: the sentinel contains a NUL, which
          // does not survive a round-trip through an HTML attribute, so writing
          // it into data-district made the bucket select nothing at all.
          const marked = await page.$$eval('#districtrail .citychip',
            n => n.filter(c => c.dataset.none).length);
          if (marked !== 1) {
            errs.push('expected exactly one no-district bucket for ' + dExpect.unnamed
              + ' unnamed records, found ' + marked);
          }
          await page.evaluate(() => {
            const cs = document.querySelectorAll('#districtrail .citychip');
            cs[cs.length - 1].click();
          });
          await page.waitForTimeout(900);
          const r = await page.evaluate(() => ({
            n: LX.filtered().length,
            allUnnamed: LX.filtered().every(l => !(l.nb || l.anb))
          }));
          if (r.n !== dExpect.unnamed) {
            errs.push('the no-district bucket selected ' + r.n + ', expected '
              + dExpect.unnamed + ' — the sentinel did not round-trip');
          }
          if (!(r.n > 0 && r.allUnnamed)) {
            errs.push('the no-district bucket did not select exactly the records with no district');
          }
        }

        await page.evaluate(() => { document.querySelector('#districtrail .citychip').click(); });
        await page.waitForTimeout(700);
        const dback = await page.evaluate(() => LX.filtered().length);
        if (dback !== total) {
          errs.push('clearing the district rail did not restore the list: ' + dback + ' of ' + total);
        }
      }

      // A city label is drawn from the records, so it is also a control: clicking
      // one focuses that city exactly as its rail chip does. And the ZIP-tower
      // layer lives on the map, so the map's filter governs it — it used to read
      // the whole edition, leaving towers standing over records the filter had
      // removed with nothing on screen saying so.
      const mapScope = await page.evaluate(async () => {
        const out = {};
        const lbl = document.querySelector('.citylbl[data-city]');
        out.label = lbl ? lbl.dataset.city : null;
        if (lbl) { lbl.click(); await new Promise(r => setTimeout(r, 900)); }
        out.afterClick = LX.state.filters.city;
        out.filtered = LX.filtered().length;
        out.all = LX.allListings().length;
        // towers with the label's filter still on, then with no filter
        out.onFiltered = LX3D.zipTowers(true, 'bmkt');
        await new Promise(r => setTimeout(r, 1200));
        out.legendFiltered = (document.getElementById('towerlegend') || {}).textContent || '';
        const el = document.getElementById('fcity');
        el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 1500));
        out.legendAll = (document.getElementById('towerlegend') || {}).textContent || '';
        LX3D.zipTowers(false);
        await new Promise(r => setTimeout(r, 400));
        return out;
      });
      if (mapScope.label && mapScope.afterClick !== mapScope.label) {
        errs.push('clicking the ' + mapScope.label + ' label did not focus that city: '
          + (mapScope.afterClick || '(none)'));
      }
      if (mapScope.onFiltered !== true) {
        errs.push('the ZIP-tower layer would not build: ' + mapScope.onFiltered);
      }
      if (!/matching the current map filter/.test(mapScope.legendFiltered)) {
        errs.push('the ZIP towers did not say they were drawn from the filtered set: '
          + (mapScope.legendFiltered || '(silent)'));
      }
      if (!/in this edition/.test(mapScope.legendAll)) {
        errs.push('the ZIP towers did not follow the filter being cleared: '
          + (mapScope.legendAll || '(silent)'));
      }

      // The shareable view. An edition is one file with no server, so a link in
      // the URL fragment is the only way two people can look at the same thing
      // in it — and the failure that matters is not "the link does not work",
      // it is "the link half-works silently": a record id from another edition
      // that simply does not open, leaving the reader looking at the whole
      // catalogue believing it is what they were sent.
      //
      // So this asserts both halves, and the second one by RELOADING the page
      // at the link rather than by calling restore() in place — a restore that
      // only works against an already-booted app is not a link.
      const linkMade = await page.evaluate(async () => {
        // clear whatever the district assertions left behind
        LX.focusDistrict('');
        const city = [...new Set(LX.allListings().map(l => l.city))].filter(Boolean)[0];
        const set = (id, v) => { const el = document.getElementById(id); el.value = v;
          el.dispatchEvent(new Event('input', { bubbles: true })); };
        set('fcity', city);
        await new Promise(r => setTimeout(r, 500));
        const first = LX.filtered()[0];
        if (first) LX.select(first.id, false);
        LX.showView('deals');
        await new Promise(r => setTimeout(r, 400));
        return { hash: location.hash, city: city, sel: first ? first.id : null,
                 filtered: LX.filtered().length };
      });
      if (!/city=/.test(linkMade.hash) || !/v=deals/.test(linkMade.hash)) {
        errs.push('the view did not reach the URL: ' + (linkMade.hash || '(empty)'));
      }
      if (!(linkMade.filtered > 0)) {
        errs.push('the link fixture filtered to nothing, so the round trip proves nothing');
      }
      {
        const p2 = await ctx.newPage();
        p2.on('pageerror', e => errs.push('link reload: ' + String(e).slice(0, 160)));
        await p2.goto(target + linkMade.hash, { waitUntil: 'load', timeout: 90000 });
        await p2.waitForTimeout(3000);
        const back = await p2.evaluate(() => ({
          city: LX.state.filters.city, sel: LX.state.sel,
          filtered: LX.filtered().length,
          view: (document.querySelector('.view.active') || {}).id,
          drawer: !!document.querySelector('#drawer.open'),
          ignored: (LXLINK.lastReport || {}).ignored || []
        }));
        if (back.city !== linkMade.city) {
          errs.push('the link did not restore the city filter: ' + back.city + ' vs ' + linkMade.city);
        }
        if (back.filtered !== linkMade.filtered) {
          errs.push('the link restored a different set: ' + back.filtered + ' vs ' + linkMade.filtered);
        }
        if (back.view !== 'deals') errs.push('the link did not restore the screen: ' + back.view);
        if (linkMade.sel && (back.sel !== linkMade.sel || !back.drawer)) {
          errs.push('the link did not reopen the property it named: sel=' + back.sel
            + ' drawer=' + back.drawer);
        }
        if (back.ignored.length) {
          errs.push('a link this edition produced could not be read back: '
            + JSON.stringify(back.ignored));
        }
        await p2.close();
      }
      {
        // The half-works case, which is the one worth a test: three keys this
        // edition cannot honour. Every one must be named to the reader and NONE
        // of them applied — a link that quietly drops its filter is worse than
        // one that fails.
        const p3 = await ctx.newPage();
        p3.on('pageerror', e => errs.push('link report: ' + String(e).slice(0, 160)));
        await p3.goto(target + '#sel=not-a-real-id&city=Nowheresville&v=nosuchview',
          { waitUntil: 'load', timeout: 90000 });
        await p3.waitForTimeout(2500);
        const bad = await p3.evaluate(() => ({
          report: LXLINK.lastReport, sel: LX.state.sel, city: LX.state.filters.city,
          toastOn: document.getElementById('toast').classList.contains('on'),
          toast: document.getElementById('toast').textContent
        }));
        const keys = ((bad.report || {}).ignored || []).map(x => x.key).sort().join(',');
        if (keys !== 'city,sel,v') {
          errs.push('a link asking for three absent things reported: ' + keys);
        }
        if (bad.sel || bad.city) {
          errs.push('a link applied something this edition does not carry: sel=' + bad.sel
            + ' city=' + bad.city);
        }
        if (!bad.toastOn || !/cannot show/.test(bad.toast || '')) {
          errs.push('the reader was never told the link half-worked: ' + (bad.toast || '(silent)'));
        }
        await p3.close();
      }
      await page.evaluate(() => {
        const set = (id, v) => { const el = document.getElementById(id); el.value = v;
          el.dispatchEvent(new Event('input', { bubbles: true })); };
        set('fcity', ''); LX.closeDrawer(); LX.showView('mapview');
      });
      await page.waitForTimeout(700);

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
      // The view id is 'uw'. This block used to say 'underwrite', which is not a
      // view at all — showView switched every view off, and the sheet
      // assertions below then ran against a DOM that was rendered but never
      // displayed. Same class of mistake as asserting [hidden] instead of
      // visibility, so this one checks the container is really on screen.
      await page.evaluate(() => {
        const l = window.BA.listings.find(x => (x.units || 1) >= 2) || window.BA.listings[0];
        LX.showView('uw'); LXUW.openSheet(l.id);
      });
      await page.waitForTimeout(1400);
      if (!(await page.isVisible('#uwsheet .packet'))) {
        errs.push('the underwriting sheet is not visible after showView(\'uw\')');
      }
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
    const mapErrs = await page.evaluate(() => [...new Set(window.__mapErrors || [])]);
    if (mapErrs.length) {
      errs.push('the map rejected something on its error channel: ' + mapErrs[0]
        + (mapErrs.length > 1 ? ' (+' + (mapErrs.length - 1) + ' more)' : ''));
    }
    const ok = errs.length === 0 && info.n > 0 && info.options === expectedOptions
      && info.title.indexOf(fleet.labels[key]) === 0;
    if (!ok) failures++;
    console.log('%s %s  %d records  "%s"%s%s', ok ? 'ok  ' : 'FAIL', key.padEnd(13),
      /* every error, not the first: a loud one masks the quiet ones, and this
         run has already been debugged twice by finding what errs[0] hid. */
      info.n, info.title, chipNote,
      errs.length ? errs.map(e => '\n     ERR: ' + e).join('') : '');
    await ctx.close();
  }
  await browser.close();

  /* ---- second pass: the OTHER map renderer -----------------------------
     This platform ships two map implementations — MapLibre GL, and the
     CanvasMap fallback for machines with no WebGL — and every run above used
     the GL one, so the fallback had never been driven by any test. It was
     broken: CanvasMap implemented thirty methods of the MapLibre shim and not
     getCanvasContainer, so the sector-fabric overlay threw a TypeError the
     moment it was switched on and its control silently did nothing.
     Launching with WebGL disabled is the only way to reach that path. */
  const noGL = await chromium.launch(Object.assign({}, launch, {
    args: ['--disable-3d-apis', '--disable-webgl', '--disable-webgl2']
  }));
  const fctx = await noGL.newContext({ viewport: { width: 1400, height: 900 } });
  const fp = await fctx.newPage();
  const ferrs = [];
  fp.on('pageerror', e => ferrs.push(String(e).slice(0, 160)));
  await fp.goto(target, { waitUntil: 'load', timeout: 90000 });
  await fp.waitForTimeout(2000);
  await fp.click('#coverenter').catch(() => {});
  await fp.evaluate(() => LX.showView('mapview'));
  await fp.waitForTimeout(2500);
  const fb = await fp.evaluate(() => {
    const m = window.__lxmap;
    let sectors = null;
    try { sectors = window.LXSectors ? LXSectors.toggle(true) : 'absent'; }
    catch (e) { sectors = 'threw: ' + String(e).slice(0, 90); }
    return {
      webgl: (() => { const c = document.createElement('canvas');
                      return !!(c.getContext('webgl2') || c.getContext('webgl')); })(),
      isGL: !!(m && m.getStyle),
      canvases: document.querySelectorAll('#map canvas').length,
      all: LX.allListings().length, filtered: LX.filtered().length,
      chips: document.querySelectorAll('#cityrail .citychip').length,
      sectors: sectors,
      /* toggle() returning true only means it did not throw. The overlay
         mounts its own canvas into the map's canvas container, so THAT is the
         evidence it actually drew — without it, a missing shim method degrades
         quietly and a weaker assertion passes while the overlay is dead. */
      sectorCanvas: !!document.getElementById('lxsectorcv')
    };
  });
  const fbErrs = [];
  if (fb.webgl) {
    // The browser ignored the flags, so this pass proved nothing. Say so
    // rather than reporting a pass it did not earn.
    fbErrs.push('WebGL is still available with --disable-webgl — the fallback renderer was NOT exercised');
  } else {
    if (fb.isGL) fbErrs.push('no WebGL, yet the GL renderer was selected anyway');
    if (!fb.canvases) fbErrs.push('the canvas renderer drew no canvas');
    if (!(fb.all > 0)) fbErrs.push('the fallback pass loaded no records');
    if (fb.sectors !== true) fbErrs.push('the sector overlay did not switch on: ' + fb.sectors);
    if (!fb.sectorCanvas) fbErrs.push('the sector overlay mounted no canvas on the fallback renderer');
  }
  if (fb.chips > 1) {
    await fp.click('#cityrail .citychip:nth-of-type(2)');
    await fp.waitForTimeout(1200);
    const narrowed = await fp.evaluate(() => LX.filtered().length);
    if (!(narrowed > 0 && narrowed < fb.all)) {
      fbErrs.push('the city rail did not narrow on the fallback renderer: ' + narrowed + ' of ' + fb.all);
    }
  }
  const fok = fbErrs.length === 0 && ferrs.length === 0;
  if (!fok) failures++;
  console.log('%s %s  renderer=%s  %d records  sectors=%s%s',
    fok ? 'ok  ' : 'FAIL', 'no-webgl'.padEnd(13),
    fb.isGL ? 'maplibre-gl' : 'canvas', fb.all, fb.sectors + (fb.sectorCanvas ? '/drawn' : '/NOT DRAWN'),
    fok ? '' : (fbErrs.concat(ferrs).map(e => '\n     ERR: ' + e).join('')));
  await noGL.close();

  const CATS_EXPECTED = ['asset', 'hack', 'value', 'growth', 'liab', 'unrated'];
  const deadCats = CATS_EXPECTED.filter(k => !catTotal[k]);
  if (deadCats.length) {
    failures++;
    console.log('FAIL %s  categor(ies) never assigned anywhere in the fleet: %s',
      'categories'.padEnd(13), deadCats.join(', '));
    console.log('     ERR: every record in the fleet was once cash-flow negative, so "Cash-flow '
      + 'asset" — the platform\'s own definition of an asset — was assigned to nothing, and every '
      + 'positive branch downstream of it was dead.');
  } else if (Object.keys(catTotal).length) {
    console.log('ok   %s  all %d categories assigned somewhere (%s)',
      'categories'.padEnd(13), CATS_EXPECTED.length,
      CATS_EXPECTED.map(k => k + ':' + (catTotal[k] || 0)).join(' '));
  }

  const deadClasses = Object.keys(clsTotal).filter(k => !clsTotal[k]);
  if (deadClasses.length) {
    failures++;
    console.log('FAIL %s  asset class(es) match NOTHING across the whole fleet: %s',
      'asset-classes'.padEnd(13), deadClasses.join(', '));
    console.log('     ERR: a filter that can only ever return an empty set is a filter nobody has '
      + 'tested. Either the fixture carries no stock of that kind, or the class is gated on '
      + 'something the records do not carry — which is how the Conversion class stayed dead on '
      + 'the `l.cv` builder flag after conv.js had already been fixed to read the record.');
  } else if (Object.keys(clsTotal).length) {
    console.log('ok   %s  all %d asset classes match records somewhere in the fleet (%s)',
      'asset-classes'.padEnd(13), Object.keys(clsTotal).length,
      Object.keys(clsTotal).map(k => k + ':' + clsTotal[k]).join(' '));
  }

  console.log(failures ? failures + ' EDITION(S) FAILED' : 'FLEET SMOKE CLEAN — every edition ran with zero page errors');
  process.exit(failures ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
