/* record_walkthrough — the product tour, recorded from the real application.
 *
 * Every frame is the app running. Nothing here is a mockup, a re-creation or a
 * generated image of a place: docs/GENERATIVE_VIDEO.md draws that line and this
 * is the side of it product footage belongs on. The captions are written into
 * the page as an overlay so the explanation and the thing being explained are
 * the same recording.
 *
 * One chapter per browser context, because Playwright finalises a video when its
 * context closes and a chaptered file set is both smaller per file and better to
 * watch than one long take. Each chapter opens the edition at a shareable-view
 * URL (src/permalink.js) rather than clicking its way back to a state.
 *
 * Usage: node scripts/record_walkthrough.js <built-demo.html> <out-dir> [chapter...]
 * Chromium: PW_CHROMIUM names an executable, else playwright's own.
 */
const fs = require('fs');
const path = require('path');

const W = 1280, H = 720;

/* ---- the overlay: a lower third in the app's own type ------------------- */
const OVERLAY = `(() => {
  if (document.getElementById('lxwt')) return;
  const el = document.createElement('div');
  el.id = 'lxwt';
  el.innerHTML = '<div id="lxwt-k"></div><div id="lxwt-t"></div><div id="lxwt-s"></div>';
  const css = document.createElement('style');
  css.textContent = \`
   /* right of the 360px filter rail, so the caption never covers the controls
      it is describing */
   #lxwt{position:fixed;left:392px;bottom:34px;z-index:99999;max-width:620px;
     padding:16px 20px 17px;border-radius:14px;pointer-events:none;
     background:rgba(11,16,24,.82);backdrop-filter:blur(9px);
     border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 50px -18px rgba(0,0,0,.8);
     opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .45s ease;
     font-family:var(--sans,system-ui,sans-serif);color:#f3f1ec}
   #lxwt.on{opacity:1;transform:none}
   #lxwt-k{font:600 10.5px var(--mono,ui-monospace,monospace);letter-spacing:.2em;
     text-transform:uppercase;color:#7fd2a6;margin-bottom:7px}
   #lxwt-t{font:600 22px/1.25 var(--sans,system-ui,sans-serif);letter-spacing:-.01em}
   #lxwt-s{font:400 14.5px/1.55 var(--sans,system-ui,sans-serif);color:#c9c5bc;margin-top:7px}
   #lxwt-badge{position:fixed;right:30px;top:26px;z-index:99999;pointer-events:none;
     font:600 10.5px var(--mono,ui-monospace,monospace);letter-spacing:.18em;
     text-transform:uppercase;color:#f3f1ec;background:rgba(11,16,24,.7);
     border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:7px 13px}\`;
  document.head.appendChild(css);
  document.body.appendChild(el);
  const b = document.createElement('div');
  b.id = 'lxwt-badge';
  b.textContent = 'Locator.X \\u00b7 synthetic fixtures';
  document.body.appendChild(b);
  window.__cap = (kicker, title, sub) => {
    const box = document.getElementById('lxwt');
    box.classList.remove('on');
    setTimeout(() => {
      document.getElementById('lxwt-k').textContent = kicker || '';
      document.getElementById('lxwt-t').textContent = title || '';
      document.getElementById('lxwt-s').textContent = sub || '';
      box.classList.add('on');
    }, 260);
  };
  window.__capOff = () => document.getElementById('lxwt').classList.remove('on');
  /* the in-app guide popover sits exactly where the caption does */
  const g = document.getElementById('lxguide'); if (g) g.style.display = 'none';
  /* Views scroll through their own .page child and the drawer through .dbody, so
     a recording scrolls THOSE, smoothly - setting scrollTop on the view element
     did nothing at all and left twelve seconds of a static screen. */
  window.__scroll = (sel, to, ms) => new Promise(res => {
    const el = document.querySelector(sel); if (!el) return res(false);
    const from = el.scrollTop, d = to - from, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / ms);
      const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      el.scrollTop = from + d * e;
      if (k < 1) requestAnimationFrame(step); else res(true);
    };
    requestAnimationFrame(step);
  });
})()`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function caption(page, kicker, title, sub, hold = 3400) {
  await page.evaluate(([k, t, s]) => window.__cap(k, t, s), [kicker, title, sub]);
  await sleep(hold);
}

/* ---- the chapters ------------------------------------------------------- */
const CHAPTERS = [
  {
    id: '01-the-file', title: 'One file, no server',
    hash: '',
    run: async (page) => {
      await caption(page, 'Chapter 1', 'An edition is one file',
        'No server, no login, no key. Open it offline in five years and every record, '
        + 'every score and every disclaimer is still in it.', 4200);
      await page.click('#coverenter').catch(() => {});
      await sleep(900);
      await page.evaluate(() => LX.showView('mapview'));
      await sleep(2200);
      await caption(page, 'What you are looking at', 'Public records, drawn as they are',
        'Every pin is a parcel from a county roll. Values are assessments and are labelled '
        + 'as assessments — this platform never calls one a price.', 4600);
      await page.evaluate(() => { const m = window.__lxmap; if (m) m.easeTo({ zoom: m.getZoom() + 0.8, duration: 2600 }); });
      await sleep(3000);
      await caption(page, 'This recording', 'Synthetic fixtures, deliberately',
        'These records are generated so the whole app runs from a clean checkout. The '
        + 'shipped editions hold 749,765 measured parcel records.', 4200);
    }
  },
  {
    id: '02-navigation', title: 'Navigating by the record',
    hash: '#v=mapview',
    run: async (page) => {
      await page.click('#coverenter').catch(() => {});
      await sleep(600);
      await page.evaluate(() => LX.showView('mapview'));
      await sleep(1400);
      await caption(page, 'Chapter 2', 'The rails come from the records',
        'Cities and districts are derived from the parcels themselves — including the '
        + 'bucket for records that carry no district at all.', 4200);
      await page.evaluate(() => {
        const c = document.querySelector('#cityrail .citychip[data-city]:not([data-city=""])');
        if (c) c.click();
      });
      await sleep(2600);
      await caption(page, 'Every count is stated', 'Filter, and the app says what changed',
        'The result line names the set. Nothing narrows silently.', 3600);
      await page.evaluate(() => {
        const d = document.querySelectorAll('#districtrail .citychip');
        if (d.length > 1) d[1].click();
      });
      await sleep(2400);
      await caption(page, 'Scope honesty', 'Two screens, one truth',
        'The Dashboard scores the whole edition while the map is filtered — so the app '
        + 'says so out loud rather than letting two counts disagree in silence.', 4200);
      await page.evaluate(() => LX.showView('dash'));
      await sleep(3000);
    }
  },
  {
    id: '03-the-property', title: 'The property record',
    hash: '#v=mapview',
    run: async (page) => {
      await page.click('#coverenter').catch(() => {});
      await sleep(600);
      await page.evaluate(() => LX.showView('mapview'));
      await sleep(1200);
      await caption(page, 'Chapter 3', 'Open one record',
        'Everything in the drawer traces to a field in the public record, or says that '
        + 'it cannot.', 3800);
      await page.evaluate(() => {
        const l = LX.filtered().find(x => (x.units || 1) >= 2) || LX.filtered()[0];
        if (l) LX.select(l.id, true);
      });
      await sleep(3000);
      await caption(page, 'Evidence, not vibes', 'Assessed value, tax line, use class',
        'The tax line is recomputed at a buyer basis rather than carrying the seller’s '
        + 'bill forward. The use class is mapped from a measured query, never guessed '
        + 'from a label.', 5000);
      await page.evaluate(() => window.__scroll('#drawer .dbody', 520, 2400));
      await sleep(3000);
      await page.evaluate(() => window.__scroll('#drawer .dbody', 1250, 2600));
      await sleep(3000);
    }
  },
  {
    id: '04-underwriting', title: 'Underwriting and the closing file',
    hash: '#v=uw',
    run: async (page) => {
      await page.click('#coverenter').catch(() => {});
      await sleep(700);
      await page.evaluate(() => {
        const l = window.BA.listings.find(x => (x.units || 1) >= 2) || window.BA.listings[0];
        LX.showView('uw'); if (window.LXUW) LXUW.openSheet(l.id);
      });
      await sleep(2200);
      await caption(page, 'Chapter 4', 'Underwrite from the record',
        'Rent, expenses, debt — and a stress block that says where the deal stops working, '
        + 'not just how it looks today.', 4400);
      await page.evaluate(() => window.__scroll('#uw .page', 620, 2600));
      await sleep(3200);
      await caption(page, 'Unknown is an answer', 'A missing quote makes a missing ratio',
        'Insurance is a quote, never an estimate. Leave it blank and the coverage ratio '
        + 'stays blank — the app will not launder a guess into a fact.', 5000);
      await page.evaluate(() => window.__scroll('#uw .page', 1500, 2800));
      await sleep(3200);
      await caption(page, 'The closing file', 'Twelve clause families, twelve questions',
        'Every state-sensitive clause is written as a question for counsel. Not one is a '
        + 'statement of what the law is — and a build gate fails if one stops being a question.', 5200);
      await page.evaluate(() => window.__scroll('#uw .page', 2600, 3000));
      await sleep(3400);
    }
  },
  {
    id: '05-interchange', title: 'Taking the work out',
    hash: '#v=mapview',
    run: async (page) => {
      await page.click('#coverenter').catch(() => {});
      await sleep(600);
      await page.evaluate(() => LX.showView('mapview'));
      await sleep(1200);
      await caption(page, 'Chapter 5', 'The filtered set, exported',
        'GeoJSON for QGIS, ArcGIS or a tileset, and CSV beside it. Each feature carries '
        + 'whether its price is an assessment and whether its point is the parcel or a '
        + 'ZIP centroid.', 5000);
      await page.hover('#expgeo').catch(() => {});
      await sleep(1800);
      await page.evaluate(() => {
        const el = document.getElementById('fcity');
        const city = [...new Set(LX.allListings().map(l => l.city))].filter(Boolean)[0];
        el.value = city; el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await sleep(1600);
      await caption(page, 'A view you can send', 'The link carries the whole screen',
        'Filters, the open property, the screen you are on — in the URL fragment, which '
        + 'browsers never send to a server. Nothing is uploaded and nothing is logged.', 5200);
      await page.click('#explink').catch(() => {});
      await sleep(2600);
      await caption(page, 'And when it half-works', 'A link from another edition says so',
        'Ask for a record this edition does not carry and the app names what it could not '
        + 'show instead of quietly handing you the unfiltered catalogue.', 4800);
    }
  },
  {
    id: '06-map-systems', title: 'The map systems',
    hash: '#v=mapview',
    run: async (page) => {
      await page.click('#coverenter').catch(() => {});
      await sleep(600);
      await page.evaluate(() => LX.showView('mapview'));
      await sleep(1400);
      await caption(page, 'Chapter 6', 'Every property, as a tower',
        'One extrusion per parcel, carrying its record id — click a tower and the property '
        + 'opens. Dimmed where the record is thin.', 4400);
      await page.evaluate(() => { try { LXTowers.mount(); LXTowers.toggle(true); } catch (e) {} });
      await page.evaluate(() => { const m = window.__lxmap; if (m) m.easeTo({ pitch: 55, bearing: -22, duration: 3200 }); });
      await sleep(4200);
      await caption(page, 'Aggregate, on the same filter', 'ZIP towers follow the map',
        'Height is the ZIP median of the metric you choose. The legend states how many '
        + 'ZIPs and how many records it was built from, and whether a filter was on.', 5000);
      await page.evaluate(() => { try { LXTowers.toggle(false); LX3D.zipTowers(true, 'bmkt'); } catch (e) {} });
      await sleep(4200);
      await page.evaluate(() => { const m = window.__lxmap; if (m) m.easeTo({ bearing: 26, duration: 3400 }); });
      await sleep(3600);
      await page.evaluate(() => { try { LX3D.zipTowers(false); } catch (e) {} });
      await sleep(1200);
    }
  },
  {
    id: '07-academy', title: 'The Academy and the record layer',
    hash: '#v=academy',
    run: async (page) => {
      await page.click('#coverenter').catch(() => {});
      await sleep(700);
      await page.evaluate(() => LX.showView('academy'));
      await sleep(2200);
      await caption(page, 'Chapter 7', 'Fifty courses, four levels',
        'Generated from one source file, with a build gate that fails if a rendered page '
        + 'and the source disagree. Instructor notes ship empty until the platform owner '
        + 'writes them.', 5200);
      await page.evaluate(() => window.__scroll('#academy .page', 1100, 3000));
      await sleep(3400);
      await page.evaluate(() => LX.showView('evidence'));
      await sleep(2400);
      await caption(page, 'What it will not do', 'Unknown is an answer',
        'No fabricated row, coordinate, price or use class. Coverage is published with its '
        + 'holes labelled — including the ones that will never close.', 5200);
      await page.evaluate(() => window.__scroll('#evidence .page', 760, 2800));
      await sleep(3400);
    }
  }
];

async function main() {
  const file = process.argv[2], out = process.argv[3];
  if (!file || !out) {
    console.error('usage: node scripts/record_walkthrough.js <built-demo.html> <out-dir> [chapter...]');
    process.exit(2);
  }
  const want = process.argv.slice(4);
  const target = 'file://' + path.resolve(file);
  fs.mkdirSync(out, { recursive: true });
  let chromium;
  try { chromium = require('playwright').chromium; }
  catch (e) { chromium = require('playwright-core').chromium; }
  const browser = await chromium.launch(process.env.PW_CHROMIUM
    ? { executablePath: process.env.PW_CHROMIUM } : {});
  for (const ch of CHAPTERS) {
    if (want.length && !want.includes(ch.id)) continue;
    const dir = path.join(out, ch.id);
    fs.mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: W, height: H },
      recordVideo: { dir, size: { width: W, height: H } }
    });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await page.goto(target + (ch.hash || ''), { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(1600);
    await page.evaluate(OVERLAY);
    await ch.run(page);
    await page.evaluate(() => window.__capOff());
    await page.waitForTimeout(900);
    await ctx.close();
    const made = fs.readdirSync(dir).filter(f => f.endsWith('.webm'));
    const dest = path.join(out, ch.id + '.webm');
    if (made.length) { fs.renameSync(path.join(dir, made[0]), dest); fs.rmdirSync(dir); }
    const kb = made.length ? Math.round(fs.statSync(dest).size / 1024) : 0;
    console.log((made.length ? 'ok   ' : 'FAIL ') + ch.id.padEnd(18) + ' '
      + String(kb).padStart(6) + ' KB'
      + (errs.length ? '  page errors: ' + errs[0] : ''));
  }
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
