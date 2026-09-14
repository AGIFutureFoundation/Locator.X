/* make_promos — five short promotional films, rendered from the real app.
 *
 * Each film is one claim this platform can actually defend, set against a still
 * captured from the running application in the same run. Nothing is a mockup and
 * nothing is generated: docs/GENERATIVE_VIDEO.md allows synthesized imagery only
 * where nothing is depicted as a real place, and a promotional film about a
 * records platform is exactly where an invented screen would do the most damage.
 *
 * The frames are drawn on a canvas and recorded through MediaRecorder off
 * canvas.captureStream() — the same technique src/uwexport.js already uses to
 * render a case's video reel from its measured numbers.
 *
 * CODEC, measured rather than assumed: Chromium's MediaRecorder has no H.264
 * encoder here (isTypeSupported('video/mp4;codecs=avc1') === false) and its bare
 * 'video/mp4' writes VP9 into an MP4 that Chromium itself then refuses to read
 * back - duration null, videoWidth 0. So the browser writes WebM, which is what
 * MediaRecorder is actually good at, and ffmpeg makes the H.264 MP4 every social
 * platform wants. Both files are written side by side.
 *
 * Usage: node scripts/make_promos.js <built-demo.html> <out-dir> [id ...]
 * Chromium: PW_CHROMIUM names an executable, else playwright's own.
 * ffmpeg:   FFMPEG names one (npm i ffmpeg-static gives a full build); without
 *           it the WebM files are still written and the MP4 step says it skipped.
 */
const fs = require('fs');
const path = require('path');

const SIZE = 1080;          // square, which every feed accepts
const FPS = 30;
const SECONDS = 14;

/* ---- the stills each film needs, captured from the running app ----------- */
const SHOTS = {
  cover: async (page) => { /* the edition's own opening screen */ },
  map: async (page) => {
    await page.click('#coverenter').catch(() => {});
    await page.evaluate(() => { LX.showView('mapview'); const g = document.getElementById('lxguide'); if (g) g.style.display = 'none'; });
    await page.waitForTimeout(2400);
  },
  drawer: async (page) => {
    await page.click('#coverenter').catch(() => {});
    await page.evaluate(() => { LX.showView('mapview'); const g = document.getElementById('lxguide'); if (g) g.style.display = 'none'; });
    await page.waitForTimeout(1600);
    await page.evaluate(() => { const l = LX.filtered().find(x => (x.units || 1) >= 2) || LX.filtered()[0]; if (l) LX.select(l.id, true); });
    await page.waitForTimeout(2600);
  },
  uw: async (page) => {
    await page.click('#coverenter').catch(() => {});
    await page.evaluate(() => {
      const g = document.getElementById('lxguide'); if (g) g.style.display = 'none';
      const l = window.BA.listings.find(x => (x.units || 1) >= 2) || window.BA.listings[0];
      LX.showView('uw'); if (window.LXUW) LXUW.openSheet(l.id);
    });
    await page.waitForTimeout(2600);
  },
  towers: async (page) => {
    await page.click('#coverenter').catch(() => {});
    await page.evaluate(() => { LX.showView('mapview'); const g = document.getElementById('lxguide'); if (g) g.style.display = 'none'; });
    await page.waitForTimeout(1600);
    await page.evaluate(() => {
      try { LXTowers.mount(); LXTowers.toggle(true); } catch (e) {}
      const m = window.__lxmap; if (m) m.easeTo({ pitch: 58, bearing: -24, zoom: m.getZoom() + 0.3, duration: 1400 });
    });
    await page.waitForTimeout(3600);
  },
  evidence: async (page) => {
    await page.click('#coverenter').catch(() => {});
    await page.evaluate(() => { LX.showView('evidence'); const g = document.getElementById('lxguide'); if (g) g.style.display = 'none'; });
    await page.waitForTimeout(2600);
  }
};

/* ---- the five films ------------------------------------------------------
   Every line below is a claim the repository can support, and the stat under
   each one is measured and published. Nothing here says "leading", "AI-powered"
   or "revolutionary", because none of those can be checked.                  */
const PROMOS = [
  {
    id: 'promo-1-one-file', shot: 'map',
    kicker: 'The architecture',
    head: ['One file.', 'No server.'],
    sub: 'Every edition is a single self-contained HTML document — the interface, the '
       + 'analytics and every property record in one file. No login, no key, nothing '
       + 'phoning home.',
    stat: { n: 354260, label: 'records in the largest single file' },
    close: 'Open it offline in five years. It still works.'
  },
  {
    id: 'promo-2-not-a-price', shot: 'drawer',
    kicker: 'The rule',
    head: ['An assessment', 'is not a price.'],
    sub: 'County rolls publish an assessed value. It is not what the building trades for, '
       + 'and this platform never labels it as though it were.',
    stat: { n: 749765, label: 'measured parcel records shipped' },
    close: 'Where the comparable-sales desk cannot function, it says so.'
  },
  {
    id: 'promo-3-no-quote-no-ratio', shot: 'uw',
    kicker: 'Underwriting',
    head: ['No quote,', 'no ratio.'],
    sub: 'Insurance is a quote, never an estimate. Leave it unanswered and the coverage '
       + 'ratio stays blank, with a line saying why.',
    stat: { n: 12, label: 'clause families, each a question for counsel' },
    close: 'Unknown is an answer here.'
  },
  {
    id: 'promo-4-every-parcel', shot: 'towers',
    kicker: 'The map',
    head: ['Every parcel,', 'a tower.'],
    sub: 'One extrusion per record, each carrying its record id: click a tower and that '
       + 'property opens. The layer above it follows the same filter as the pins.',
    stat: { n: 2500, label: 'parcels drawn in this frame' },
    close: 'Three layers. One filtered set.'
  },
  {
    id: 'promo-5-coverage', shot: 'evidence',
    kicker: 'The record layer',
    head: ['Coverage,', 'holes labelled.'],
    sub: 'Ninety gate rows across eleven states: 8 shipped, 50 pulled but not yet packed, '
       + '26 named, 3 blocked, 3 with no public record at all.',
    stat: { n: 90, label: 'coverage rows, every status published' },
    close: 'The map with holes in it is the honest one.'
  }
];

/* ---- the renderer, run inside the page ---------------------------------- */
const RENDER = `(shots, promo, SIZE, SECONDS) => new Promise(async (resolve) => {
  const cv = document.createElement('canvas');
  cv.width = SIZE; cv.height = SIZE;
  document.body.style.margin = '0';
  document.body.appendChild(cv);
  const g = cv.getContext('2d');

  const img = new Image();
  await new Promise(r => { img.onload = r; img.onerror = r; img.src = shots[promo.shot]; });

  const PAPER = '#12100C', CARD = '#1C1913', INK = '#F4F1EA', INK2 = '#B9B1A2',
        FIELD = '#5FA483', FLAG = '#E0742F', RULE = '#332E26';
  const SERIF = '"Bitstream Charter", "Liberation Serif", Georgia, serif';
  const SANS  = '"Liberation Sans", "DejaVu Sans", system-ui, sans-serif';
  const MONO  = '"DejaVu Sans Mono", monospace';

  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
  const win = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const fmt = n => n.toLocaleString('en-US');

  function wrap(text, font, maxW){
    g.font = font;
    const words = text.split(' '); const lines = []; let line = '';
    for (const w of words){
      const probe = line ? line + ' ' + w : w;
      if (g.measureText(probe).width > maxW && line){ lines.push(line); line = w; }
      else line = probe;
    }
    if (line) lines.push(line);
    return lines;
  }

  function roundRect(x, y, w, h, r){
    g.beginPath();
    g.moveTo(x+r, y); g.arcTo(x+w, y, x+w, y+h, r); g.arcTo(x+w, y+h, x, y+h, r);
    g.arcTo(x, y+h, x, y, r); g.arcTo(x, y, x+w, y, r); g.closePath();
  }

  function frame(t){
    // ---- ground
    g.fillStyle = PAPER; g.fillRect(0, 0, SIZE, SIZE);
    g.strokeStyle = 'rgba(244,241,234,.045)'; g.lineWidth = 1;
    for (let x = 60; x < SIZE; x += 60){ g.beginPath(); g.moveTo(x+.5, 0); g.lineTo(x+.5, SIZE); g.stroke(); }
    for (let y = 60; y < SIZE; y += 60){ g.beginPath(); g.moveTo(0, y+.5); g.lineTo(SIZE, y+.5); g.stroke(); }

    // ---- the still from the app, rising into frame with a slow push in
    const sIn = ease(win(t, .45, 2.1));
    if (img.width && sIn > 0){
      /* a band of the real interface rather than the whole 16:9 frame: the
         screen is the evidence, not the subject, and a cropped band leaves the
         column below it for the measured figure and the close. */
      const cardW = SIZE - 128, cardH = 342;
      const cx = 64, cy = 512 + (1 - sIn) * 60;
      g.save();
      g.globalAlpha = sIn;
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 48; g.shadowOffsetY = 18;
      roundRect(cx, cy, cardW, cardH, 18); g.fillStyle = CARD; g.fill();
      g.restore();
      g.save();
      g.globalAlpha = sIn;
      roundRect(cx, cy, cardW, cardH, 18); g.clip();
      const k = 1.02 + win(t, 0, SECONDS) * 0.08;          // the slow push in
      const scale = Math.max(cardW / img.width, cardH / img.height) * k;
      const dw = img.width * scale, dh = img.height * scale;
      const dx = cx + (cardW - dw) / 2, dy = cy + (cardH - dh) * 0.34;
      g.drawImage(img, dx, dy, dw, dh);
      g.restore();
      g.save(); g.globalAlpha = sIn * .9;
      roundRect(cx, cy, cardW, cardH, 18);
      g.strokeStyle = 'rgba(244,241,234,.16)'; g.lineWidth = 1.5; g.stroke();
      g.restore();
    }

    // ---- kicker
    const kIn = ease(win(t, .15, .9));
    g.save(); g.globalAlpha = kIn;
    g.font = '500 20px ' + MONO; g.fillStyle = FIELD;
    g.letterSpacing = '5px';
    g.fillText(promo.kicker.toUpperCase(), 64, 96);
    g.letterSpacing = '0px';
    g.restore();

    // ---- headline, revealed line by line behind a rising mask
    g.font = '700 88px ' + SERIF; g.fillStyle = INK; g.textBaseline = 'alphabetic';
    promo.head.forEach((line, i) => {
      const p = ease(win(t, .5 + i * .28, 1.5 + i * .28));
      if (p <= 0) return;
      const y = 194 + i * 100;
      g.save();
      g.beginPath(); g.rect(64, y - 84, SIZE - 128, 96 * p); g.clip();
      g.globalAlpha = Math.min(1, p * 1.3);
      g.fillText(line, 64, y + (1 - p) * 16);
      g.restore();
    });

    // ---- rule + supporting paragraph
    const rIn = ease(win(t, 1.5, 2.3));
    if (rIn > 0){
      g.strokeStyle = RULE; g.lineWidth = 2;
      g.beginPath(); g.moveTo(64, 344); g.lineTo(64 + (SIZE - 128) * rIn, 344); g.stroke();
    }
    const pIn = ease(win(t, 1.9, 3.1));
    if (pIn > 0){
      g.save(); g.globalAlpha = pIn;
      g.fillStyle = INK2; g.font = '400 26px ' + SANS;
      wrap(promo.sub, '400 26px ' + SANS, SIZE - 128).slice(0, 3).forEach((l, i) => {
        g.fillText(l, 64, 392 + i * 38 + (1 - pIn) * 8);
      });
      g.restore();
    }

    // ---- the measured figure, counting up over the still
    const nIn = ease(win(t, 3.4, 5.2));
    if (nIn > 0){
      const val = Math.round(promo.stat.n * nIn);
      g.save(); g.globalAlpha = Math.min(1, nIn * 1.6);
      const bx = 64, by = 892, bw = SIZE - 128, bh = 88;
      roundRect(bx, by, bw, bh, 14); g.fillStyle = 'rgba(18,16,12,.82)'; g.fill();
      roundRect(bx, by, bw, bh, 14); g.strokeStyle = RULE; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = INK; g.font = '700 46px ' + SANS;
      g.fillText(fmt(val), bx + 26, by + 59);
      const w = g.measureText(fmt(val)).width;
      g.fillStyle = INK2; g.font = '400 21px ' + SANS;
      g.fillText(promo.stat.label, bx + 26 + w + 18, by + 57);
      g.restore();
    }

    // ---- closing line, and the honesty note that never leaves
    const cIn = ease(win(t, 6.2, 7.4));
    if (cIn > 0){
      g.save(); g.globalAlpha = cIn;
      g.fillStyle = FLAG; g.font = '600 27px ' + SERIF;
      g.fillText(promo.close, 64, 1020 + (1 - cIn) * 10);
      g.restore();
    }
    const wIn = ease(win(t, 7.0, 8.2));
    if (wIn > 0){
      g.save(); g.globalAlpha = wIn;
      g.fillStyle = INK; g.font = '700 32px ' + SERIF;
      g.fillText('Locator', 64, 1062);
      const lw = g.measureText('Locator').width;
      g.fillStyle = FIELD; g.fillText('.X', 64 + lw, 1062);
      g.fillStyle = 'rgba(185,177,162,.8)'; g.font = '400 15px ' + MONO;
      g.fillText('public-record real estate', 232, 1060);
      g.restore();
    }
    g.save();
    g.globalAlpha = .62; g.fillStyle = INK2; g.font = '400 15px ' + MONO;
    g.textAlign = 'right';
    g.fillText('screens: synthetic fixtures', SIZE - 64, 1060);
    g.textAlign = 'left';
    g.restore();

    // ---- progress hairline
    g.fillStyle = 'rgba(95,164,131,.85)';
    g.fillRect(0, SIZE - 5, SIZE * Math.min(1, t / SECONDS), 5);
  }

  frame(0);
  const stream = cv.captureStream(${FPS});
  const out = {};
  for (const [ext, mime] of [['webm', 'video/webm;codecs=vp9']]){
    if (!MediaRecorder.isTypeSupported(mime)) continue;
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
    const parts = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };
    const done = new Promise(r => { rec.onstop = r; });
    rec.start();
    const t0 = performance.now();
    await new Promise(fin => {
      const tick = () => {
        const t = (performance.now() - t0) / 1000;
        frame(Math.min(t, SECONDS));
        if (t < SECONDS) requestAnimationFrame(tick); else fin();
      };
      requestAnimationFrame(tick);
    });
    rec.stop(); await done;
    const blob = new Blob(parts, { type: mime });
    const buf = await blob.arrayBuffer();
    let bin = ''; const bytes = new Uint8Array(buf);
    const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH){
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    }
    out[ext] = btoa(bin);
  }
  resolve(out);
})`;

/* H.264 in MP4, yuv420p, moov at the front: the combination every upload
   pipeline accepts. Silent by design - these play muted in a feed. */
function toMp4(src, dest){
  const { spawnSync } = require('child_process');
  let bin = process.env.FFMPEG;
  if (!bin){
    try { bin = require('ffmpeg-static'); } catch (e) { bin = null; }
  }
  if (!bin){
    const probe = spawnSync('ffmpeg', ['-version']);
    if (probe.status === 0) bin = 'ffmpeg'; else return null;
  }
  /* -r 30 normalises what MediaRecorder actually captured: the canvas stream
     followed requestAnimationFrame, so clips came out at 30, 59.94 and 60 fps
     from the same run. A fixed frame rate is one less thing for an upload
     pipeline to reinterpret. */
  const r = spawnSync(bin, ['-y', '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
    '-r', '30', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-an', dest],
    { stdio: 'pipe' });
  if (r.status !== 0){
    console.error('  ffmpeg failed: ' + String(r.stderr || '').slice(-300));
    return null;
  }
  return (fs.statSync(dest).size / 1048576).toFixed(1) + ' MB';
}

async function main(){
  const file = process.argv[2], out = process.argv[3];
  if (!file || !out){
    console.error('usage: node scripts/make_promos.js <built-demo.html> <out-dir> [id ...]');
    process.exit(2);
  }
  const want = process.argv.slice(4);
  const films = PROMOS.filter(p => !want.length || want.includes(p.id));
  const target = 'file://' + path.resolve(file);
  fs.mkdirSync(out, { recursive: true });
  let chromium;
  try { chromium = require('playwright').chromium; }
  catch (e) { chromium = require('playwright-core').chromium; }
  const browser = await chromium.launch(process.env.PW_CHROMIUM
    ? { executablePath: process.env.PW_CHROMIUM } : {});

  // ---- phase one: the stills, from the running application
  const shots = {};
  const needed = [...new Set(films.map(f => f.shot))];
  for (const key of needed){
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    await page.goto(target, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(1500);
    await SHOTS[key](page);
    const buf = await page.screenshot();
    shots[key] = 'data:image/png;base64,' + buf.toString('base64');
    console.log('still  ' + key.padEnd(10) + ' ' + Math.round(buf.length / 1024) + ' KB');
    await ctx.close();
  }

  // ---- phase two: render and record each film
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('  page error: ' + String(e).slice(0, 160)));
  await page.goto('about:blank');
  for (const film of films){
    const res = await page.evaluate(
      ({ r, shots, promo, size, secs }) => eval(r)(shots, promo, size, secs),
      { r: RENDER, shots, promo: film, size: SIZE, secs: SECONDS });
    const made = [];
    for (const ext of Object.keys(res)){
      const dest = path.join(out, film.id + '.' + ext);
      fs.writeFileSync(dest, Buffer.from(res[ext], 'base64'));
      made.push(ext + ' ' + (fs.statSync(dest).size / 1048576).toFixed(1) + ' MB');
    }
    const mp4 = toMp4(path.join(out, film.id + '.webm'), path.join(out, film.id + '.mp4'));
    if (mp4) made.push('mp4 ' + mp4);
    console.log('film   ' + film.id.padEnd(26) + ' ' + made.join('  ·  '));
  }
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
