/* build_brand — the brand assets, rasterised from their sources.
 *
 * brand/ holds the SOURCES: the mark, the two lockups and the cover page, as SVG
 * and HTML. This renders the PNGs from them in headless Chromium. The PNGs are
 * build products and are not committed — the same rule the editions follow, so a
 * logo cannot drift from the file it is supposed to be a picture of.
 *
 * Usage: node scripts/build_brand.js <out-dir>
 * Chromium: PW_CHROMIUM names an executable, else playwright's own.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BRAND = path.join(ROOT, 'brand');

/* svg source → [width, height, transparent] renders */
const SVGS = [
  ['locator-x-mark.svg', [[512, 512], [1024, 1024]]],
  ['locator-x-logo.svg', [[1120, 280], [2240, 560]]],
  ['locator-x-logo-dark.svg', [[1120, 280], [2240, 560]]],
];

async function main(){
  const out = process.argv[2];
  if (!out){ console.error('usage: node scripts/build_brand.js <out-dir>'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  let chromium;
  try { chromium = require('playwright').chromium; }
  catch (e) { chromium = require('playwright-core').chromium; }
  const browser = await chromium.launch(process.env.PW_CHROMIUM
    ? { executablePath: process.env.PW_CHROMIUM } : {});

  for (const [file, sizes] of SVGS){
    const svg = fs.readFileSync(path.join(BRAND, file), 'utf8');
    for (const [w, h] of sizes){
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.setContent('<body style="margin:0">'
        + svg.replace('<svg ', '<svg style="display:block;width:' + w + 'px;height:' + h + 'px" ')
        + '</body>');
      await page.waitForTimeout(200);
      const name = file.replace('.svg', '') + '-' + w + 'x' + h + '.png';
      await page.screenshot({ path: path.join(out, name), omitBackground: true });
      console.log('  ' + name.padEnd(42) + (fs.statSync(path.join(out, name)).size / 1024).toFixed(0) + ' KB');
      await ctx.close();
    }
  }

  /* the cover, at feed size and at share-card size */
  for (const [w, h, cls, name] of [
    [1600, 900, '', 'locator-x-cover-1600x900.png'],
    [1200, 630, 'og', 'locator-x-cover-og-1200x630.png'],
  ]){
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(BRAND, 'cover.html'), { waitUntil: 'load' });
    if (cls) await page.evaluate(c => document.getElementById('sheet').classList.add(c), cls);
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: w, height: h } });
    console.log('  ' + name.padEnd(42) + (fs.statSync(path.join(out, name)).size / 1024).toFixed(0) + ' KB');
    await ctx.close();
  }
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
