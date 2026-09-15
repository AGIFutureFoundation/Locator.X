/* make_system_films — five long-form films, one per system, over live footage.
 *
 * The short promos (scripts/make_promos.js) each carry one claim over one still.
 * These are the detailed cut: ~34 seconds per system, with the APPLICATION
 * RUNNING inside the frame and the mechanism named beat by beat while it happens
 * on screen.
 *
 * Two passes. The first drives the built edition and records a clean clip per
 * film — no overlay, because the overlay belongs to the film, not to the app.
 * The second plays that clip into a canvas, draws the brand frame and the beats
 * over it, and records the canvas through MediaRecorder off captureStream() —
 * the technique src/uwexport.js already uses for a case's video reel.
 *
 * Nothing is generated or re-created. Every frame of footage is the running app
 * (docs/GENERATIVE_VIDEO.md), the fixture note stays on screen throughout, and
 * every figure a film states is measured and published in this repository.
 *
 * Codec: Chromium here has no H.264 encoder and its bare 'video/mp4' writes VP9
 * into an MP4 that Chromium itself cannot read back, so the browser writes WebM
 * and ffmpeg makes the H.264 MP4 every upload pipeline wants.
 *
 * Usage: node scripts/make_system_films.js <built-demo.html> <out-dir> [id ...]
 *        --keep-clips   leave the clean source clips in <out-dir>/clips
 * Chromium: PW_CHROMIUM names an executable, else playwright's own.
 * ffmpeg:   FFMPEG names one (npm i ffmpeg-static gives a full build).
 */
const fs = require('fs');
const path = require('path');

const SIZE = 1080;              // square: every feed takes it
const CLIP_W = 1280, CLIP_H = 720;
/* 38 s: four beats of about seven seconds each, then the refusal and the close
   in sequence rather than on top of each other — the first cut drew the stat box
   over the refusal line and buried it. */
const SECONDS = 38;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const enter = async (page) => {
  await page.click('#coverenter').catch(() => {});
  await page.evaluate(() => { const g = document.getElementById('lxguide'); if (g) g.style.display = 'none'; });
};

/* ---- the five systems -----------------------------------------------------
   Each film: a clip that drives the real app, and beats that name the mechanism
   at the moment it is visible. Beat times are seconds into the film.          */
const FILMS = [
  {
    id: 'system-1-record-layer',
    kicker: 'System 01 · The record layer',
    head: ['Where the', 'figure came from.'],
    beats: [
      { t: 5.5, k: 'The map', s: 'Every pin is a parcel from a county roll — nothing synthesised, nothing inferred from a listing.' },
      { t: 12.5, k: 'The drawer', s: 'Assessed value, tax line, use class, year, area — each with the field it came from.' },
      { t: 19.5, k: 'The tax line', s: 'Recomputed at a buyer’s basis. The seller’s bill answers a question about the seller.' },
      { t: 26, k: 'The use class', s: '48 local codes across 8 jurisdictions, each mapped from a measured query or a published manual — never from the label.' }
    ],
    refuse: 'An assessment is never called a price.',
    stat: { n: 749765, label: 'measured parcel records shipped' },
    clip: async (page) => {
      await enter(page);
      await page.evaluate(() => LX.showView('mapview'));
      await sleep(3500);
      await page.evaluate(() => { const m = window.__lxmap; if (m) m.easeTo({ zoom: m.getZoom() + 0.7, duration: 3000 }); });
      await sleep(4200);
      await page.evaluate(() => { const l = LX.filtered().find(x => (x.units || 1) >= 2) || LX.filtered()[0]; if (l) LX.select(l.id, true); });
      await sleep(5200);
      await page.evaluate(() => window.__scrollDrawer && window.__scrollDrawer(520));
      await page.evaluate(() => { const d = document.querySelector('#drawer .dbody'); if (d) d.scrollTo({ top: 520, behavior: 'smooth' }); });
      await sleep(4200);
      await page.evaluate(() => { const d = document.querySelector('#drawer .dbody'); if (d) d.scrollTo({ top: 1400, behavior: 'smooth' }); });
      await sleep(4200);
      await page.evaluate(() => { const d = document.querySelector('#drawer .dbody'); if (d) d.scrollTo({ top: 2400, behavior: 'smooth' }); });
      await sleep(5000);
      await page.evaluate(() => { const d = document.querySelector('#drawer .dbody'); if (d) d.scrollTo({ top: 3400, behavior: 'smooth' }); });
      await sleep(5000);
      await sleep(4200);   // tail, so the close plays over live footage
    }
  },
  {
    id: 'system-2-map-layers',
    kicker: 'System 02 · The map',
    head: ['Three layers,', 'one filtered set.'],
    beats: [
      { t: 5, k: 'City labels', s: 'Drawn from this edition’s own records, at the centroid of each city’s parcels. Click one and the map focuses it.' },
      { t: 11.5, k: 'Property towers', s: 'One extrusion per record, each carrying its record id — click a tower and that property opens.' },
      { t: 19, k: 'ZIP towers', s: 'Height is the ZIP median of the metric you pick. It reads the same filtered set as the pins.' },
      { t: 26, k: 'The legend', s: 'States how many ZIPs and how many records it drew from, and whether a filter was on.' }
    ],
    refuse: 'Nothing is drawn outside the records’ own footprint.',
    stat: { n: 354260, label: 'records in the largest single file' },
    clip: async (page) => {
      await enter(page);
      await page.evaluate(() => LX.showView('mapview'));
      await sleep(4200);
      await page.evaluate(() => { const l = document.querySelector('.citylbl[data-city]'); if (l) l.click(); });
      await sleep(4000);
      await page.evaluate(() => {
        const el = document.getElementById('fcity'); el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await sleep(1800);
      await page.evaluate(() => { try { LXTowers.mount(); LXTowers.toggle(true); } catch (e) {}
        const m = window.__lxmap; if (m) m.easeTo({ pitch: 56, bearing: -22, duration: 3200 }); });
      await sleep(6500);
      await page.evaluate(() => { try { LXTowers.toggle(false); LX3D.zipTowers(true, 'bmkt'); } catch (e) {} });
      await sleep(5200);
      await page.evaluate(() => {
        const city = [...new Set(LX.allListings().map(l => l.city))].filter(Boolean)[0];
        const el = document.getElementById('fcity'); el.value = city;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await sleep(5200);
      await page.evaluate(() => { const m = window.__lxmap; if (m) m.easeTo({ bearing: 24, duration: 3000 }); });
      await sleep(4000);
      await page.evaluate(() => { try { LX3D.zipTowers(false); } catch (e) {} });
      await sleep(1500);
      await sleep(4200);   // tail, so the close plays over live footage
    }
  },
  {
    id: 'system-3-underwriting',
    kicker: 'System 03 · Underwriting',
    head: ['Where the deal', 'stops working.'],
    beats: [
      { t: 5, k: 'From the record', s: 'The sheet opens on the parcel: recorded figure, units, area, year — then your assumptions on top.' },
      { t: 12, k: 'The stress block', s: 'Break-even rent, the cushion above it, the rate that overtakes the income, and the largest lender-ready loan.' },
      { t: 19.5, k: 'A missing input', s: 'Insurance is a quote, never an estimate. Unanswered, it leaves every ratio below it blank — and says why.' },
      { t: 26, k: 'The closing file', s: '12 clause families, 24 documents, 3 contingencies. 13 of the 24 must be demanded; only 7 are public record.' }
    ],
    refuse: 'Every state-sensitive clause is a question for counsel, never a statement of law.',
    stat: { n: 12, label: 'clause families, twelve questions, zero assertions' },
    clip: async (page) => {
      await enter(page);
      await page.evaluate(() => {
        const l = window.BA.listings.find(x => (x.units || 1) >= 2) || window.BA.listings[0];
        LX.showView('uw'); if (window.LXUW) LXUW.openSheet(l.id);
      });
      await sleep(5500);
      for (const y of [520, 1200, 1900, 2600, 3400, 4200]) {
        await page.evaluate(t => { const p = document.querySelector('#uw .page'); if (p) p.scrollTo({ top: t, behavior: 'smooth' }); }, y);
        await sleep(4600);
      }
      await sleep(4200);   // tail, so the close plays over live footage
    }
  },
  {
    id: 'system-4-interchange',
    kicker: 'System 04 · Interchange',
    head: ['It leaves with', 'its caveats.'],
    beats: [
      { t: 5, k: 'The filtered set', s: 'Whatever the map is showing is what exports — as RFC 7946 GeoJSON, or the same columns flat as CSV.' },
      { t: 12, k: 'The header', s: 'How many records were dropped for having no geometry, how many carry an estimated price, how many an approximate coordinate.' },
      { t: 19, k: 'Per feature', s: 'Each one states its own basis: what the price figure is, and what the point is. Strip the header and it still cannot be mistaken for a sale.' },
      { t: 26, k: 'The link', s: 'Screen, filters, sort and the open property go in the URL fragment — the one part of a URL a browser never sends to a server.' }
    ],
    refuse: 'A link that cannot be honoured names what it dropped, and applies none of it.',
    stat: { n: 7946, label: 'RFC 7946 GeoJSON — no private dialect' },
    clip: async (page) => {
      await enter(page);
      await page.evaluate(() => LX.showView('mapview'));
      await sleep(3000);
      await page.evaluate(() => {
        const city = [...new Set(LX.allListings().map(l => l.city))].filter(Boolean)[0];
        const el = document.getElementById('fcity'); el.value = city;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await sleep(3600);
      await page.hover('#expgeo').catch(() => {});
      await sleep(3600);
      await page.hover('#expcsv').catch(() => {});
      await sleep(3000);
      await page.evaluate(() => { const l = LX.filtered()[0]; if (l) LX.select(l.id, true); });
      await sleep(4200);
      await page.evaluate(() => LX.showView('deals'));
      await sleep(4000);
      await page.evaluate(() => LX.showView('mapview'));
      await sleep(2600);
      await page.click('#explink').catch(() => {});
      await sleep(5000);
      await page.evaluate(() => { const m = window.__lxmap; if (m) m.easeTo({ zoom: m.getZoom() + 0.5, duration: 2600 }); });
      await sleep(3600);
      await sleep(4200);   // tail, so the close plays over live footage
    }
  },
  {
    id: 'system-5-coverage',
    kicker: 'System 05 · Coverage & the gates',
    head: ['Published with', 'its holes labelled.'],
    beats: [
      { t: 5, k: 'The evidence view', s: 'What this edition’s record layer can answer, what it cannot, and which rows came back but are not yet packed.' },
      { t: 12, k: 'Five statuses', s: 'shipped · pulled · named · blocked · no public record. A status outside that vocabulary stops the build.' },
      { t: 19, k: 'The ceilings', s: 'Three rows say the jurisdiction publishes it nowhere. Nothing advances them — and the table says so rather than leaving a to-do.' },
      { t: 26, k: 'The gates', s: 'Six checks before every commit, a headless pass over all eleven editions, and a record-count check before anything is republished.' }
    ],
    refuse: 'Unknown is an answer. It is never a quiet pass.',
    stat: { n: 90, label: 'gate rows: 8 shipped, 50 pulled, 26 named, 3 blocked, 3 with no record' },
    clip: async (page) => {
      await enter(page);
      await page.evaluate(() => LX.showView('evidence'));
      await sleep(5200);
      for (const y of [420, 900, 1400]) {
        await page.evaluate(t => { const p = document.querySelector('#evidence .page'); if (p) p.scrollTo({ top: t, behavior: 'smooth' }); }, y);
        await sleep(4200);
      }
      await page.evaluate(() => LX.showView('sources'));
      await sleep(4600);
      await page.evaluate(() => { const p = document.querySelector('#sources .page'); if (p) p.scrollTo({ top: 700, behavior: 'smooth' }); });
      await sleep(4600);
      await page.evaluate(() => LX.showView('comps'));
      await sleep(5000);
      await sleep(4200);   // tail, so the close plays over live footage
    }
  }
];

/* ---- the compositor, run inside the page --------------------------------- */
const RENDER = `(clipUri, film, SIZE, SECONDS, CLIP_W, CLIP_H) => new Promise(async (resolve) => {
  document.body.style.margin = '0';
  const vid = document.createElement('video');
  vid.src = clipUri; vid.muted = true; vid.playsInline = true;
  await new Promise(r => { vid.onloadeddata = r; vid.onerror = r; });

  const cv = document.createElement('canvas');
  cv.width = SIZE; cv.height = SIZE;
  document.body.appendChild(cv);
  const g = cv.getContext('2d');

  const GROUND = '#100E0A', INK = '#F4F1EA', INK2 = '#B9B1A2', INK3 = '#8A8073',
        FIELD = '#37B871', FIELD2 = '#5FA483', FLAG = '#E0742F', RULE = '#2A251E';
  const SERIF = '"Bitstream Charter", "Liberation Serif", Georgia, serif';
  const SANS  = '"Liberation Sans", "DejaVu Sans", system-ui, sans-serif';
  const MONO  = '"DejaVu Sans Mono", monospace';

  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
  const win = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const fmtN = n => n.toLocaleString('en-US');

  function wrap(text, font, maxW){
    g.font = font;
    const words = String(text).split(' '); const out = []; let line = '';
    for (const w of words){
      const probe = line ? line + ' ' + w : w;
      if (g.measureText(probe).width > maxW && line){ out.push(line); line = w; }
      else line = probe;
    }
    if (line) out.push(line);
    return out;
  }
  function roundRect(x, y, w, h, r){
    g.beginPath(); g.moveTo(x+r, y);
    g.arcTo(x+w, y, x+w, y+h, r); g.arcTo(x+w, y+h, x, y+h, r);
    g.arcTo(x, y+h, x, y, r); g.arcTo(x, y, x+w, y, r); g.closePath();
  }
  function mark(x, y, s){
    // the brand mark, drawn to the same geometry as brand/locator-x-mark.svg
    const k = s / 120;
    g.save(); g.translate(x, y); g.scale(k, k);
    g.lineWidth = 2.5; g.strokeStyle = FIELD; g.globalAlpha = .9;
    roundRect(4, 4, 112, 112, 28); g.stroke();
    g.globalAlpha = .16; g.fillStyle = FIELD; g.fill(); g.globalAlpha = 1;
    g.save();
    g.beginPath(); g.rect(0, 0, 120, 120);
    g.arc(60, 60, 8, 0, Math.PI * 2, true);
    g.clip('evenodd');
    g.strokeStyle = FIELD; g.lineWidth = 13; g.lineCap = 'round';
    g.beginPath(); g.moveTo(32, 32); g.lineTo(88, 88); g.stroke();
    g.beginPath(); g.moveTo(88, 32); g.lineTo(32, 88); g.stroke();
    g.restore();
    g.fillStyle = FIELD; g.beginPath(); g.arc(60, 60, 4.5, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  const CARD_X = 40, CARD_W = SIZE - 80;
  const CARD_H = Math.round(CARD_W * CLIP_H / CLIP_W);
  const CARD_Y = 300;

  function frame(t){
    g.fillStyle = GROUND; g.fillRect(0, 0, SIZE, SIZE);
    g.strokeStyle = 'rgba(244,241,234,.045)'; g.lineWidth = 1;
    for (let x = 60; x < SIZE; x += 60){ g.beginPath(); g.moveTo(x+.5, 0); g.lineTo(x+.5, SIZE); g.stroke(); }
    for (let y = 60; y < SIZE; y += 60){ g.beginPath(); g.moveTo(0, y+.5); g.lineTo(SIZE, y+.5); g.stroke(); }

    // ---- title card: holds the frame alone, then rises to make room
    const lift = ease(win(t, 2.6, 4.0));
    const titleY = 150 - lift * 42;
    const kIn = ease(win(t, .25, 1.0));
    g.save(); g.globalAlpha = kIn;
    mark(40, titleY - 96, 58);
    g.font = '500 19px ' + MONO; g.fillStyle = FIELD2; g.letterSpacing = '3px';
    g.fillText(film.kicker.toUpperCase(), 112, titleY - 58);
    g.letterSpacing = '0px';
    g.restore();

    g.fillStyle = INK; g.font = '700 74px ' + SERIF;
    film.head.forEach((line, i) => {
      const p = ease(win(t, .7 + i * .3, 1.9 + i * .3));
      if (p <= 0) return;
      const y = titleY + 4 + i * 82;
      g.save();
      g.beginPath(); g.rect(40, y - 72, SIZE - 80, 86 * p); g.clip();
      g.globalAlpha = Math.min(1, p * 1.4);
      g.fillText(line, 40, y + (1 - p) * 14);
      g.restore();
    });

    // ---- the application, playing
    const cIn = ease(win(t, 2.8, 4.2));
    if (cIn > 0 && vid.videoWidth){
      const y = CARD_Y + (1 - cIn) * 46;
      g.save(); g.globalAlpha = cIn;
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 44; g.shadowOffsetY = 16;
      roundRect(CARD_X, y, CARD_W, CARD_H, 16); g.fillStyle = '#0B0F14'; g.fill();
      g.restore();
      g.save(); g.globalAlpha = cIn;
      roundRect(CARD_X, y, CARD_W, CARD_H, 16); g.clip();
      g.drawImage(vid, CARD_X, y, CARD_W, CARD_H);
      g.restore();
      g.save(); g.globalAlpha = cIn * .8;
      roundRect(CARD_X, y, CARD_W, CARD_H, 16);
      g.strokeStyle = 'rgba(244,241,234,.18)'; g.lineWidth = 1.5; g.stroke();
      g.restore();
    }

    // ---- the beats, each naming what is on screen while it happens
    const BEAT_TOP = CARD_Y + CARD_H + 26;
    let active = null;
    for (let i = 0; i < film.beats.length; i++){
      const b = film.beats[i];
      const next = film.beats[i + 1];
      const end = next ? next.t - .35 : SECONDS - 7;
      if (t >= b.t - .35 && t < end + .45) active = { b, p: ease(win(t, b.t - .35, b.t + .5)),
        out: 1 - ease(win(t, end, end + .45)) };
    }
    if (active){
      const a = Math.min(active.p, active.out);
      g.save(); g.globalAlpha = a;
      g.font = '500 17px ' + MONO; g.fillStyle = FIELD2; g.letterSpacing = '2.4px';
      g.fillText(active.b.k.toUpperCase(), 40, BEAT_TOP + 22 + (1 - a) * 8);
      g.letterSpacing = '0px';
      g.fillStyle = INK; g.font = '400 27px ' + SANS;
      wrap(active.b.s, '400 27px ' + SANS, SIZE - 96).slice(0, 3).forEach((l, i) => {
        g.fillText(l, 40, BEAT_TOP + 62 + i * 36 + (1 - a) * 8);
      });
      g.restore();
    }

    // ---- the refusal, then the close
    /* the refusal holds alone, then clears before the figure arrives */
    const rIn = ease(win(t, SECONDS - 6.6, SECONDS - 5.4))
      * (1 - ease(win(t, SECONDS - 4.0, SECONDS - 3.2)));
    if (rIn > 0){
      g.save(); g.globalAlpha = rIn;
      g.fillStyle = FLAG; g.font = '600 30px ' + SERIF;
      wrap(film.refuse, '600 30px ' + SERIF, SIZE - 96).slice(0, 2).forEach((l, i) => {
        g.fillText(l, 40, BEAT_TOP + 34 + i * 38 + (1 - rIn) * 10);
      });
      g.restore();
    }
    const sIn = ease(win(t, SECONDS - 3.1, SECONDS - 2.1));
    if (sIn > 0){
      g.save(); g.globalAlpha = sIn;
      const by = SIZE - 188, bh = 86;
      roundRect(40, by, SIZE - 80, bh, 14);
      g.fillStyle = 'rgba(16,14,10,.86)'; g.fill();
      roundRect(40, by, SIZE - 80, bh, 14); g.strokeStyle = RULE; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = INK; g.font = '700 42px ' + SANS;
      const v = fmtN(Math.round(film.stat.n * sIn));
      g.fillText(v, 64, by + 57);
      const w = g.measureText(v).width;
      g.fillStyle = INK2; g.font = '400 19px ' + SANS;
      wrap(film.stat.label, '400 19px ' + SANS, SIZE - 150 - w).slice(0, 2)
        .forEach((l, i) => g.fillText(l, 64 + w + 18, by + 46 + i * 24));
      g.restore();
    }

    // ---- the wordmark row and the note that never leaves
    const wIn = ease(win(t, SECONDS - 2.0, SECONDS - 1.2));
    if (wIn > 0){
      g.save(); g.globalAlpha = wIn;
      g.fillStyle = INK; g.font = '700 32px ' + SERIF;
      g.fillText('Locator', 40, SIZE - 60);
      const lw = g.measureText('Locator').width;
      g.fillStyle = FIELD; g.fillText('.X', 40 + lw, SIZE - 60);
      g.fillStyle = INK3; g.font = '400 15px ' + MONO;
      g.fillText('public-record real estate', 44 + lw + g.measureText('.X').width + 18, SIZE - 62);
      g.restore();
    }
    g.save(); g.globalAlpha = .6; g.fillStyle = INK3; g.font = '400 14px ' + MONO;
    g.textAlign = 'right'; g.fillText('screens: synthetic fixtures', SIZE - 40, SIZE - 22);
    g.textAlign = 'left'; g.restore();

    g.fillStyle = 'rgba(55,184,113,.85)';
    g.fillRect(0, SIZE - 5, SIZE * Math.min(1, t / SECONDS), 5);
  }

  frame(0);
  const mime = 'video/webm;codecs=vp9';
  const rec = new MediaRecorder(cv.captureStream(30),
    { mimeType: mime, videoBitsPerSecond: 7000000 });
  const parts = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };
  const stopped = new Promise(r => { rec.onstop = r; });
  rec.start();
  const t0 = performance.now();
  vid.currentTime = 0;
  await vid.play().catch(() => {});
  await new Promise(fin => {
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      frame(Math.min(t, SECONDS));
      if (t < SECONDS) requestAnimationFrame(tick); else fin();
    };
    requestAnimationFrame(tick);
  });
  rec.stop(); await stopped;
  const buf = await new Blob(parts, { type: mime }).arrayBuffer();
  const bytes = new Uint8Array(buf); let bin = ''; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  resolve(btoa(bin));
})`;

function toMp4(src, dest){
  const { spawnSync } = require('child_process');
  let bin = process.env.FFMPEG;
  if (!bin){ try { bin = require('ffmpeg-static'); } catch (e) { bin = null; } }
  if (!bin){
    const probe = spawnSync('ffmpeg', ['-version']);
    if (probe.status === 0) bin = 'ffmpeg'; else return null;
  }
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
    console.error('usage: node scripts/make_system_films.js <built-demo.html> <out-dir> [id ...]');
    process.exit(2);
  }
  const want = process.argv.slice(4).filter(a => !a.startsWith('--'));
  const keep = process.argv.includes('--keep-clips');
  const films = FILMS.filter(f => !want.length || want.includes(f.id));
  const target = 'file://' + path.resolve(file);
  const clipDir = path.join(out, 'clips');
  fs.mkdirSync(clipDir, { recursive: true });
  let chromium;
  try { chromium = require('playwright').chromium; }
  catch (e) { chromium = require('playwright-core').chromium; }
  const browser = await chromium.launch(process.env.PW_CHROMIUM
    ? { executablePath: process.env.PW_CHROMIUM } : {});

  for (const film of films){
    // ---- pass one: a clean clip of the application doing the thing
    const dir = path.join(clipDir, film.id);
    fs.mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: CLIP_W, height: CLIP_H },
      recordVideo: { dir, size: { width: CLIP_W, height: CLIP_H } }
    });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await page.goto(target, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(1500);
    await film.clip(page);
    await ctx.close();
    const made = fs.readdirSync(dir).filter(f => f.endsWith('.webm'));
    if (!made.length){ console.log('FAIL ' + film.id + ' — no clip recorded'); continue; }
    const clip = path.join(clipDir, film.id + '.webm');
    fs.renameSync(path.join(dir, made[0]), clip);
    fs.rmdirSync(dir);
    const clipKB = Math.round(fs.statSync(clip).size / 1024);

    // ---- pass two: the film, composited over that clip
    const uri = 'data:video/webm;base64,' + fs.readFileSync(clip).toString('base64');
    const ctx2 = await browser.newContext({ viewport: { width: 900, height: 900 } });
    const page2 = await ctx2.newPage();
    page2.on('pageerror', e => errs.push('render: ' + String(e).slice(0, 140)));
    await page2.goto('about:blank');
    /* the film's clip() drives Playwright and cannot cross into the page — pass
       only what the compositor draws */
    const spec = { id: film.id, kicker: film.kicker, head: film.head, beats: film.beats,
                   refuse: film.refuse, stat: film.stat };
    const b64 = await page2.evaluate(
      ({ r, uri, film, size, secs, cw, ch }) => eval(r)(uri, film, size, secs, cw, ch),
      { r: RENDER, uri, film: spec, size: SIZE, secs: SECONDS, cw: CLIP_W, ch: CLIP_H });
    await ctx2.close();
    const webm = path.join(out, film.id + '.webm');
    fs.writeFileSync(webm, Buffer.from(b64, 'base64'));
    const mp4 = toMp4(webm, path.join(out, film.id + '.mp4'));
    console.log('film   ' + film.id.padEnd(24)
      + ' clip ' + String(clipKB).padStart(5) + ' KB'
      + '  webm ' + (fs.statSync(webm).size / 1048576).toFixed(1) + ' MB'
      + (mp4 ? '  mp4 ' + mp4 : '  (no ffmpeg — mp4 skipped)')
      + (errs.length ? '  page errors: ' + errs[0] : ''));
    if (!keep) fs.unlinkSync(clip);
  }
  if (!keep) { try { fs.rmdirSync(clipDir); } catch (e) {} }
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
