/* locator.x — the desk-browser pull protocol, driven end to end.
   ----------------------------------------------------------------------------
   Container egress to every county GIS host is policy-blocked: the gateway
   answers 403 to CONNECT for EVERY host, including example.com (re-measured
   2026-09-16, and the agent proxy reports itself healthy with
   bundleCoversEveryHost true, so the denial is upstream policy rather than a
   misconfiguration). That is exactly why the desk browser exists, and it is
   also why this test cannot reach a county.

   So it stands up a LOCAL ArcGIS-shaped fixture server and drives the real
   scripts/desk/pull_driver.js against it in a real browser: paging, retry, the
   polygon centroid, the gzip+base64 pack, the 240,000-character slicing, and
   then the real scripts/desk_ingest.py on the far side. Everything the protocol
   does except the one thing this container cannot do — talk to a county.

   THE FIXTURE ASSERTS NOTHING ABOUT THE REAL WORLD. Its parcels are generated
   from a seeded PRNG on a fictional island, in the same spirit as
   scripts/build_fleet_demo.py. No coordinate, price or use class here is a
   claim; the point is the transport, not the data.

   What this buys: when an operator finally gets a desk session, the protocol is
   known-good and the only untested thing left is the remote host, which is the
   only genuinely unknown part. Before this, every element of the transfer was
   also unknown, and a pull that died at slice 7 could not be told apart from a
   county that had refused. */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.dirname(__dirname);
const DRIVER = path.join(ROOT, 'scripts', 'desk', 'pull_driver.js');
const INGEST = path.join(ROOT, 'scripts', 'desk_ingest.py');
const SLICE = 240000;
const errs = [];

/* ---------- the fixture layer ------------------------------------------- */
/* Deterministic, so two runs agree and a failure is reproducible. */
function prng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function makeFeatures(n) {
  const r = prng(20260916);
  const USE = ['Single family', 'Duplex', 'Apartment 5+', 'Retail', 'Warehouse', 'Hotel'];
  const out = [];
  for (let i = 1; i <= n; i++) {
    const lng = -61.5 + r() * 0.4, lat = 15.2 + r() * 0.3, d = 0.0004;
    out.push({
      attributes: {
        OBJECTID: i,
        PIN: 'FX-' + String(100000 + i),
        SITEADDR: Math.floor(r() * 9000 + 100) + ' Fixture Way',
        USECLASS: USE[Math.floor(r() * USE.length)],
        ASSDVALUE: Math.round((60000 + r() * 900000) / 100) * 100,
        YRBLT: 1900 + Math.floor(r() * 125),
        OWN_NAME: 'REDACTED FIXTURE OWNER'   // present in the layer, never requested
      },
      geometry: { rings: [[[lng, lat], [lng + d, lat], [lng + d, lat + d], [lng, lat + d], [lng, lat]]] }
    });
  }
  return out;
}

/* N is sized so the packed payload EXCEEDS one 240,000-character slice: the
   browser-side slicer is the part of the transport this test exists to cover,
   and at 2,500 rows the whole pull fitted in a single slice, so the multi-slice
   path passed by never running. The happy path asserts it produced more than
   one slice, so the fixture cannot silently shrink back under the line. */
const N = 30000, MAXREC = 1000;
const FEATURES = makeFeatures(N);

/* An ArcGIS FeatureServer, in the shape the driver actually talks to, plus the
   failure modes the recipe's log records as real: a transient 500 that must be
   retried, and an HTML error page that must not read as an empty layer. */
function makeServer(opts) {
  opts = opts || {};
  let queryCount = 0;
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    if (u.pathname === '/blank.html') {
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end('<!doctype html><meta charset="utf-8"><title>fixture</title><body>fixture');
    }
    if (u.pathname === '/layer/query') {
      queryCount++;
      if (opts.flakyUntil && queryCount <= opts.flakyUntil) {
        res.writeHead(500, { 'content-type': 'text/plain' });
        return res.end('upstream hiccup');
      }
      /* `...From` errors on every request from that point on. An earlier
         version of this fixture failed ONE request, which the driver correctly
         retried and recovered from - so the case asserting "a mid-pull failure
         is never reported as clean" was testing a pull that legitimately
         succeeded. A failure has to outlast the retries to be a failure. */
      if (opts.htmlErrorFrom && queryCount >= opts.htmlErrorFrom) {
        res.writeHead(200, { 'content-type': 'text/html' });
        return res.end('<html><body><h1>Service Unavailable</h1></body></html>');
      }
      if (opts.jsonErrorFrom && queryCount >= opts.jsonErrorFrom) {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ error: { code: 500, message: 'Unable to complete operation' } }));
      }
      const off = parseInt(u.searchParams.get('resultOffset') || '0', 10);
      const cnt = Math.min(parseInt(u.searchParams.get('resultRecordCount') || '1000', 10), MAXREC);
      const wantGeom = u.searchParams.get('returnGeometry') === 'true';
      const slice = FEATURES.slice(off, off + cnt).map(f => wantGeom ? f : { attributes: f.attributes });
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ features: slice }));
    }
    res.writeHead(404); res.end('no');
  });
  srv.__queries = () => queryCount;
  return srv;
}

function listen(srv) {
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));
}

/* ---------- driving the real driver in a real browser -------------------- */
async function pull(page, base, cfg) {
  await page.addScriptTag({ path: DRIVER });
  const launched = await page.evaluate(c => window.lxrun({
    url: c.url, where: '1=1', fields: c.fields, geom: c.geom, step: c.step, cap: c.cap,
    /* The map function is the operator's, as it is in a real session. */
    map: (a, ll) => [a.PIN, a.SITEADDR, a.USECLASS, a.ASSDVALUE, a.YRBLT,
                     ll ? ll[1] : null, ll ? ll[0] : null]
  }), Object.assign({ url: base + '/layer/query' }, cfg));
  if (launched !== 'launched') return { launched };
  for (let i = 0; i < 200; i++) {
    const s = JSON.parse(await page.evaluate(() => window.lxpoll()));
    if (s.done) return Object.assign({ launched }, s);
    await page.waitForTimeout(100);
  }
  return { launched, timeout: true };
}

async function main() {
  let chromium;
  try { chromium = require('playwright').chromium; }
  catch (e) { chromium = require('playwright-core').chromium; }
  const launch = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
  const browser = await chromium.launch(launch);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lxdesk-'));

  /* ===== 1. the happy path, end to end ================================== */
  {
    const srv = makeServer({});
    const port = await listen(srv);
    const base = 'http://127.0.0.1:' + port;
    const page = await browser.newPage();
    await page.goto(base + '/blank.html', { waitUntil: 'load' });

    const st = await pull(page, base, { fields: 'PIN,SITEADDR,USECLASS,ASSDVALUE,YRBLT', geom: true, step: MAXREC });
    if (!st.done || !st.ok) errs.push('happy path did not complete: ' + JSON.stringify(st));
    if (st.n !== N) errs.push('pulled ' + st.n + ' rows, the layer holds ' + N);
    /* Paging really happened - a single page would mean the fixture served
       everything at once and the pager was never exercised. */
    if (!(st.pages >= Math.ceil(N / MAXREC))) errs.push('expected >= ' + Math.ceil(N / MAXREC) + ' pages, saw ' + st.pages);

    const packed = JSON.parse(await page.evaluate(() => window.lxpack({
      jurisdiction: 'fx_island', columns: ['pin', 'addr', 'use', 'assessed', 'year', 'lat', 'lng'],
      notes: 'synthetic fixture - asserts nothing about the real world'
    })));
    if (packed.error) errs.push('pack refused the happy path: ' + packed.error);
    if (packed.rows !== N) errs.push('packed ' + packed.rows + ' rows, pulled ' + st.n);
    if (!(packed.slices > 1)) {
      errs.push('the happy path packed into ' + packed.slices + ' slice(s) (' + packed.b64
        + ' base64 chars). It must exceed one slice or the browser-side slicer - the part '
        + 'of the transport this test exists to cover - is never exercised.');
    }

    /* Slice exactly as the bridge does, through the driver's own slicer. */
    const dir = path.join(tmp, 'happy');
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < packed.slices; i++) {
      const s = await page.evaluate(i => window.lxslice(i), i);
      const last = i === packed.slices - 1;
      if (!last && s.length !== SLICE) errs.push('slice ' + i + ' is ' + s.length + ' chars, not ' + SLICE);
      fs.writeFileSync(path.join(dir, 's.' + i), s);
    }

    /* ...and ingest with the REAL tool, not a reimplementation of it. */
    const out = path.join(tmp, 'happy.json');
    try {
      execFileSync('python3', [INGEST, '--slices', dir, '--out', out,
                               '--expect-b64', String(packed.b64), '--jurisdiction', 'fx_island'],
                   { stdio: 'pipe' });
    } catch (e) {
      errs.push('desk_ingest refused a clean pull: ' + (e.stderr || e.stdout || e).toString().slice(0, 400));
    }

    if (fs.existsSync(out)) {
      const env = JSON.parse(fs.readFileSync(out, 'utf8'));
      if (env.n !== N) errs.push('ingested ' + env.n + ' rows, pulled ' + N);
      if (env.rows.length !== N) errs.push('ingested envelope carries ' + env.rows.length + ' rows');
      /* THE ROWS MUST SURVIVE THE ROUND TRIP UNCHANGED. Every stage so far
         reported its own count and every count agreed - but a transport can
         preserve the count and corrupt the content, so this recomputes the
         expected rows from the fixture and compares them value by value. */
      const want = FEATURES.map(f => {
        const a = f.attributes, r0 = f.geometry.rings[0];
        let sx = 0, sy = 0, n = 0;
        for (const p of r0) { sx += p[0]; sy += p[1]; n++; }
        return [a.PIN, a.SITEADDR, a.USECLASS, a.ASSDVALUE, a.YRBLT,
                +(sy / n).toFixed(6), +(sx / n).toFixed(6)];
      });
      let firstBad = -1;
      for (let i = 0; i < N; i++) {
        if (JSON.stringify(want[i]) !== JSON.stringify(env.rows[i])) { firstBad = i; break; }
      }
      if (firstBad >= 0) {
        errs.push('row ' + firstBad + ' did not survive the round trip.\n'
          + '       want: ' + JSON.stringify(want[firstBad]) + '\n'
          + '       got:  ' + JSON.stringify(env.rows[firstBad]));
      }
      /* And no owner identity reached the far side, though the layer has it. */
      const blob = JSON.stringify(env);
      if (/REDACTED FIXTURE OWNER|OWN_NAME/.test(blob)) {
        errs.push('owner identity from the fixture layer reached the ingested file');
      }
      if (!env.source || !/127\.0\.0\.1/.test(env.source)) errs.push('the ingested envelope lost its source URL');
    }
    await page.close(); srv.close();
    if (!errs.length) console.log('ok   happy path: ' + N + ' rows, ' + st.pages + ' pages, '
      + packed.slices + ' slice(s), ingested and compared value by value');
  }

  /* ===== 2. PII is refused BEFORE any fetch ============================= */
  {
    const srv = makeServer({});
    const port = await listen(srv);
    const base = 'http://127.0.0.1:' + port;
    const page = await browser.newPage();
    await page.goto(base + '/blank.html', { waitUntil: 'load' });
    const st = await pull(page, base, { fields: 'PIN,OWN_NAME,ASSDVALUE', geom: false, step: MAXREC });
    if (!/REFUSED/.test(String(st.launched))) {
      errs.push('the driver accepted a pull requesting an owner-name field');
    }
    if (srv.__queries() !== 0) {
      errs.push('the driver fetched ' + srv.__queries() + ' page(s) before refusing a PII field - '
        + 'the cheapest place to not have PII is to never have fetched it');
    }
    await page.close(); srv.close();
    console.log('ok   refuses an owner-identity field before issuing a single fetch');
  }

  /* ===== 3. a mid-pull failure is never reported as a complete pull ===== */
  {
    for (const [name, opt] of [['a JSON error', { jsonErrorFrom: 3 }], ['an HTML error page', { htmlErrorFrom: 3 }]]) {
      const srv = makeServer(opt);
      const port = await listen(srv);
      const base = 'http://127.0.0.1:' + port;
      const page = await browser.newPage();
      await page.goto(base + '/blank.html', { waitUntil: 'load' });
      const st = await pull(page, base, { fields: 'PIN,ASSDVALUE', geom: false, step: MAXREC });
      if (st.ok) errs.push(name + ' mid-pull was reported as a clean pull');
      if (!st.err) errs.push(name + ' mid-pull recorded no error');
      const packed = JSON.parse(await page.evaluate(() => window.lxpack({ columns: ['pin', 'assessed'] })));
      if (!packed.error) errs.push(name + ': pack accepted a pull that did not complete');
      await page.close(); srv.close();
      console.log('ok   ' + name + ' mid-pull: partial, refused to pack, error kept');
    }
  }

  /* ===== 4. a transient 500 is retried, not surrendered to =============== */
  {
    const srv = makeServer({ flakyUntil: 2 });
    const port = await listen(srv);
    const base = 'http://127.0.0.1:' + port;
    const page = await browser.newPage();
    await page.goto(base + '/blank.html', { waitUntil: 'load' });
    const st = await pull(page, base, { fields: 'PIN,ASSDVALUE', geom: false, step: MAXREC });
    if (!st.ok) errs.push('two transient 500s defeated the retry: ' + JSON.stringify(st));
    if (st.n !== N) errs.push('after retrying, pulled ' + st.n + ' of ' + N);
    await page.close(); srv.close();
    console.log('ok   retries a transient 500 and still pulls every row');
  }

  /* ===== 5. hitting the row cap is a failure, not a result =============== */
  {
    const srv = makeServer({});
    const port = await listen(srv);
    const base = 'http://127.0.0.1:' + port;
    const page = await browser.newPage();
    await page.goto(base + '/blank.html', { waitUntil: 'load' });
    const st = await pull(page, base, { fields: 'PIN,ASSDVALUE', geom: false, step: MAXREC, cap: 900 });
    if (st.ok) errs.push('a pull stopped by the row cap was reported as complete');
    if (!/cap/.test(String(st.err))) errs.push('the cap stop did not say it hit the cap: ' + st.err);
    await page.close(); srv.close();
    console.log('ok   a pull stopped by the row cap is reported as incomplete');
  }

  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });

  if (errs.length) {
    console.error('\nDESK ROUNDTRIP FAILED — ' + errs.length + ' problem(s):');
    for (const e of errs) console.error('  ✗ ' + e);
    process.exit(1);
  }
  console.log('DESK ROUNDTRIP CLEAN — the pull protocol works end to end against a local fixture');
}

main().catch(e => { console.error(e); process.exit(1); });
