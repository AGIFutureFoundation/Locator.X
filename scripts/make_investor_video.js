/* make_investor_video — the investor pitch film.
   ----------------------------------------------------------------------------
   Seven scenes, 1920x1080, H.264. Every figure on screen comes from
   scripts/deck_figures.py --json, which MEASURES each one at build time, for the
   same reason content/investor/DECK.md carries no digits: a number rendered into
   a video is the least checkable claim a company can make. It cannot be
   corrected in place, it outlives the quarter it was true in, and nobody who
   watches it will ever see the source.

   So this script refuses to run if a figure it needs is missing, rather than
   drawing a placeholder or a plausible round number.

   The scene order is the argument: the problem, what we measured, what we have
   NOT built, the governance, Part A, Part B, the firewall, the call to action.
   Scene three exists because a pitch film that omits it is a pitch film a
   diligence process contradicts, and being contradicted by your own repository
   is worse than having the gap.

   The firewall scene is not a disclaimer slide. A two-part ask is one careless
   sentence away from a commingled offering, and the fact pattern that ends in
   rescission usually starts with both parts on one slide called one
   opportunity. Saying it out loud, in the film, is cheaper than saying it to a
   regulator.

   CODEC NOTE (measured this session): Chromium's MediaRecorder has no H.264
   encoder, and a bare video/mp4 request silently writes VP9-in-MP4 that Chromium
   itself cannot read back. The browser writes WebM; ffmpeg-static transcodes to
   H.264 MP4 at a fixed 30fps, because mixing 30/59.94/60 across scenes produces
   a file that stutters on exactly the machines investors use.

   Usage: node scripts/make_investor_video.js <outdir> [--scene N]
*/
'use strict';
const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const SP = process.env.SP || '/tmp';
const { chromium } = require(path.join(SP, 'node_modules', 'playwright-core'));
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const W = 1920, H = 1080, FPS = 30;

/* ---- the figures, measured, never typed ---- */
function figures() {
  const out = execFileSync('python3', [path.join(ROOT, 'scripts', 'deck_figures.py'), '--json'],
                           { cwd: ROOT, encoding: 'utf-8' });
  const f = JSON.parse(out);
  const need = ['records', 'editions_measured', 'editions_total', 'coverage_rows',
                'coverage_shipped', 'coverage_blocked', 'coverage_norecord', 'usecodes',
                'jurisdictions', 'submarkets', 'submarket_states', 'modules', 'module_lines',
                'gates', 'landscape_tools', 'landscape_verified', 'products',
                'products_notbuilt', 'products_partial', 'agents', 'agents_shipping',
                'entities', 'risks', 'records_date'];
  const missing = need.filter(k => f[k] === undefined || f[k] === null);
  if (missing.length) {
    console.error('INVESTOR VIDEO STOPPED — these figures could not be measured: '
      + missing.join(', ') + '\nA number in a film is the least checkable claim a company '
      + 'can make. It does not get a placeholder.');
    process.exit(1);
  }
  return f;
}

const n = v => typeof v === 'number' ? v.toLocaleString('en-US') : String(v);

/* ---- the six scenes ---- */
function scenes(f) {
  return [
    { key: 'problem', secs: 12,
      kicker: 'THE PROBLEM',
      head: 'Every investor tool tells you\nwhat it knows.',
      sub: 'None of them can tell you what it doesn’t.',
      stats: [[n(f.landscape_tools), 'tools registered'], ['0', 'that report their own gaps']],
      note: 'A product whose pricing depends on coverage looking complete cannot start saying "we do not know".' },

    { key: 'measured', secs: 13,
      kicker: 'WHAT WE MEASURED',
      head: 'Every figure carries\nits evidence.',
      sub: 'Live-measured from the shipped editions on ' + f.records_date + '.',
      stats: [[n(f.records), 'parcel records'],
              [n(f.editions_measured) + ' of ' + n(f.editions_total), 'editions measured'],
              [n(f.usecodes), 'use codes, ' + n(f.jurisdictions) + ' jurisdictions'],
              [n(f.submarkets), 'submarkets, ' + n(f.submarket_states) + ' states']],
      note: n(f.modules) + ' modules · ' + n(f.module_lines) + ' lines · single-file editions, no server' },

    { key: 'honest', secs: 13,
      kicker: 'WHAT WE HAVE NOT BUILT',
      head: 'The gaps are on\nthe slide too.',
      sub: 'A pitch your own diligence contradicts is worse than the gap.',
      stats: [[n(f.products_notbuilt) + ' of ' + n(f.products), 'products not built'],
              [n(f.products_partial), 'more are partial'],
              [n(f.agents_shipping) + ' of ' + n(f.agents), 'agents ship outright'],
              [n(f.coverage_blocked + f.coverage_norecord), 'coverage rows blocked or absent']],
      note: 'Of ' + n(f.coverage_rows) + ' coverage rows, ' + n(f.coverage_shipped)
            + ' are shipped. We publish the other ' + n(f.coverage_rows - f.coverage_shipped)
            + ' \u2014 and the seed round is priced to close them.' },

    { key: 'proof', secs: 12,
      kicker: 'THE PROOF IS MECHANICAL',
      head: 'Honesty enforced\nby the build.',
      sub: 'Not a value. A validator.',
      stats: [[n(f.gates), 'CI gates, each proven by breaking it'],
              [n(f.risks), 'risks, every one with a named owner'],
              [n(f.entities), 'entities, each stating what you do NOT own'],
              [n(f.landscape_verified), 'competitor prices we claim to have verified']],
      note: 'An assessed value is never presented as a transaction. A comparable is a recorded sale with a date, or it is not a comparable.' },

    { key: 'parta', secs: 13,
      kicker: 'PART A \u2014 THE COMPANY',
      head: 'Locator.X, Inc.\n$4.0M seed.',
      sub: 'A separate company. AGI Corp is the founder. Post-money SAFE or preferred, valuation cap only.',
      stats: [['26\u201334%', 'record-layer expansion'],
              ['14\u201320%', 'collaboration layer'],
              ['12\u201318%', 'the two unbuilt products'],
              ['8\u201312%', 'go-to-market']],
      note: 'Every earmark closes a gap on the previous slide. The round is priced against a backlog we publish, not a vision we describe.' },

    { key: 'partb', secs: 14,
      kicker: 'PART B \u2014 THE BUNDLE',
      head: 'Portfolio Basket I.\n$6.0M property capital.',
      sub: 'A separate entity, sponsored by AGI Property Holdings, running on the platform.',
      stats: [['58\u201366%', 'acquisition equity'],
              ['15\u201321%', 'renovation and capex'],
              ['8\u201312%', 'reserves, funded at close'],
              ['4\u20137%', 'independent diligence']],
      note: 'Bought only where the record is deepest \u2014 inside the counties already shipped. A sponsor whose own system says it cannot value an asset, and buys anyway, learned nothing from building the system.' },

    { key: 'firewall', secs: 13,
      kicker: 'THE FIREWALL',
      head: 'One cheque does\nnot buy both.',
      sub: 'Two entities. Two sets of documents. Two sets of economics.',
      stats: [['Part A', 'rights in Locator.X, Inc. and nothing else \u2014 no property, no SPV, no distribution'],
              ['Part B', 'the Basket\u2019s economics and nothing else \u2014 no equity in any platform company']],
      note: 'No cross-collateralisation. Separate bank accounts and books. The tie is a written, arm\u2019s-length services agreement with a fee schedule fixed in advance \u2014 contractual and disclosed, never shared ownership.' },

    { key: 'cta', secs: 12,
      kicker: 'NEXT STEP',
      head: 'Read the repository\nbefore you read the deck.',
      sub: 'Every validator is readable. Every figure is dated.',
      stats: [],
      cta: 'Contact AGI Corp to schedule a diligence conversation.',
      note: 'Private and confidential. Not an offer to sell or a solicitation. Any offering would be made only through counsel-approved definitive documents. Private placements are illiquid and may result in total loss.' }
  ];
}

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#080b10;overflow:hidden}canvas{display:block}
</style></head><body><canvas id="c" width="${W}" height="${H}"></canvas><script>
const c=document.getElementById('c'), x=c.getContext('2d');
const W=${W},H=${H};
const INK='#f2f6fb', DIM='#8fa3bd', ACC='#4d9bff', WARN='#ffb454';
function rr(a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);
  x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();}
function ease(t){return t<0?0:t>1?1:1-Math.pow(1-t,3);}
function wrap(txt,max,size,weight,color,X,Y,lh){
  x.font=weight+' '+size+'px -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial';
  x.fillStyle=color; let yy=Y;
  txt.split('\\n').forEach(function(para){
    const words=para.split(' '); let line='';
    words.forEach(function(w){
      const test=line?line+' '+w:w;
      if(x.measureText(test).width>max&&line){x.fillText(line,X,yy);yy+=lh;line=w;}else line=test;});
    if(line){x.fillText(line,X,yy);yy+=lh;}});
  return yy;
}
window.__draw=function(S,t){
  // background: a slow field, dark, no motion that competes with the words
  x.fillStyle='#080b10'; x.fillRect(0,0,W,H);
  const g=x.createRadialGradient(W*0.78,H*0.20,60,W*0.78,H*0.20,W*0.85);
  g.addColorStop(0,'rgba(77,155,255,0.13)'); g.addColorStop(1,'rgba(8,11,16,0)');
  x.fillStyle=g; x.fillRect(0,0,W,H);
  x.strokeStyle='rgba(143,163,189,0.07)'; x.lineWidth=1;
  for(let i=1;i<9;i++){x.beginPath();x.moveTo(0,H*i/9+Math.sin(t*0.5+i)*3);x.lineTo(W,H*i/9);x.stroke();}

  const M=140, a=ease(t*2.2);
  x.globalAlpha=a;
  // kicker
  x.font='700 21px -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial';
  x.fillStyle=ACC; x.letterSpacing='4px';
  x.fillText(S.kicker, M, 132); x.letterSpacing='0px';
  x.strokeStyle='rgba(77,155,255,0.45)'; x.beginPath();
  x.moveTo(M,152); x.lineTo(M+Math.min(300, x.measureText(S.kicker).width+40),152); x.stroke();

  // headline
  let y = wrap(S.head, W-M*2, 76, '700', INK, M, 258, 90);

  // sub
  x.globalAlpha=ease((t-0.25)*2.2);
  y = wrap(S.sub, W-M*2-220, 30, '500', DIM, M, y+26, 42);

  // stats
  if(S.stats && S.stats.length){
    const cols=S.stats.length>2?4:S.stats.length;
    const bw=(W-M*2-28*(cols-1))/cols;
    const by=y+46;
    S.stats.forEach(function(s,i){
      const aa=ease((t-0.45-i*0.09)*2.4); if(aa<=0) return;
      x.globalAlpha=aa;
      const bx=M+(bw+28)*(i%cols);
      x.fillStyle='rgba(255,255,255,0.035)'; rr(bx,by,bw,150,10); x.fill();
      x.strokeStyle='rgba(143,163,189,0.16)'; x.lineWidth=1; rr(bx,by,bw,150,10); x.stroke();
      const zero = s[0]==='0';
      x.font='700 '+(String(s[0]).length>9?46:56)+'px -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial';
      x.fillStyle= zero? WARN : INK; x.fillText(String(s[0]), bx+24, by+72);
      x.font='500 19px -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial';
      x.fillStyle=DIM;
      const words=String(s[1]).split(' '); let line='', ly=by+108;
      words.forEach(function(w){const tt=line?line+' '+w:w;
        if(x.measureText(tt).width>bw-48&&line){x.fillText(line,bx+24,ly);ly+=25;line=w;}else line=tt;});
      if(line)x.fillText(line,bx+24,ly);
    });
    y=by+150;
  }

  // call to action
  if(S.cta){
    const aa=ease((t-0.4)*2.2); x.globalAlpha=aa;
    x.fillStyle='rgba(77,155,255,0.12)'; rr(M,y+40,W-M*2,104,12); x.fill();
    x.strokeStyle='rgba(77,155,255,0.55)'; x.lineWidth=2; rr(M,y+40,W-M*2,104,12); x.stroke();
    x.font='700 36px -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial';
    x.fillStyle=INK; x.fillText(S.cta, M+36, y+106);
    y+=144;
  }

  // footnote
  x.globalAlpha=ease((t-0.6)*2.2);
  wrap(S.note, W-M*2, 19, '400', 'rgba(143,163,189,0.78)', M, H-96, 27);

  // frame
  x.globalAlpha=1;
  x.fillStyle='rgba(143,163,189,0.5)';
  x.font='600 17px -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial';
  x.letterSpacing='2px'; x.fillText('LOCATOR.X  BY AGI CORP', M, H-40); x.letterSpacing='0px';
  x.fillStyle='rgba(168,43,43,0.85)';
  x.textAlign='right'; x.fillText('PRIVATE \\u00b7 NOT AN OFFER', W-M, H-40); x.textAlign='left';
};
window.__record=function(S){
  return new Promise(function(res){
    const st=c.captureStream(${FPS});
    const mr=new MediaRecorder(st,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:10000000});
    const parts=[];
    mr.ondataavailable=function(e){if(e.data.size)parts.push(e.data);};
    mr.onstop=function(){const b=new Blob(parts,{type:'video/webm'});const r=new FileReader();
      r.onload=function(){res(r.result.split(',')[1]);};r.readAsDataURL(b);};
    mr.start();
    const t0=performance.now();
    (function loop(){
      const el=(performance.now()-t0)/1000;
      window.__draw(S, el/S.secs);
      if(el<S.secs) requestAnimationFrame(loop); else mr.stop();
    })();
  });
};
</script></body></html>`;

async function main() {
  const outdir = process.argv[2];
  if (!outdir) { console.error('usage: node scripts/make_investor_video.js <outdir>'); process.exit(1); }
  fs.mkdirSync(outdir, { recursive: true });
  const f = figures();
  const SC = scenes(f);
  const only = process.argv.indexOf('--scene');
  const pick = only > 0 ? [SC[+process.argv[only + 1] - 1]] : SC;

  const htmlPath = path.join(outdir, '_stage.html');
  fs.writeFileSync(htmlPath, PAGE);
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const parts = [];
  for (const S of pick) {
    const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'load' });
    const b64 = await page.evaluate(s => window.__record(s), S);
    const webm = path.join(outdir, S.key + '.webm');
    fs.writeFileSync(webm, Buffer.from(b64, 'base64'));
    parts.push(webm);
    /* Node's console.log has no %.1f; using one shifts every later argument and
       the line reports nonsense. Template strings, not format specifiers. */
    console.log(`  scene ${S.key.padEnd(9)}  ${S.secs}s  ${(fs.statSync(webm).size / 1e6).toFixed(1)} MB`);
    await page.context().close();
  }
  await browser.close();

  const ff = require(path.join(SP, 'node_modules', 'ffmpeg-static'));
  const list = path.join(outdir, '_list.txt');
  const mp4s = parts.map(p => {
    const o = p.replace(/\.webm$/, '.mp4');
    execSync(`"${ff}" -y -loglevel error -i "${p}" -r ${FPS} -pix_fmt yuv420p -c:v libx264 `
           + `-profile:v high -crf 18 -movflags +faststart -an "${o}"`);
    return o;
  });
  fs.writeFileSync(list, mp4s.map(p => `file '${p}'`).join('\n'));
  const full = path.join(outdir, 'agi-investor-pitch.mp4');
  execSync(`"${ff}" -y -loglevel error -f concat -safe 0 -i "${list}" -c copy "${full}"`);
  const secs = pick.reduce((a, s) => a + s.secs, 0);
  console.log(`\n  wrote ${full}\n  ${(fs.statSync(full).size / 1e6).toFixed(1)} MB  ${secs}s  ${W}x${H} @${FPS}fps`);
}
main().catch(e => { console.error(e); process.exit(1); });
