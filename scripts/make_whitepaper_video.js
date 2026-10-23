/* make_whitepaper_video — the product film that travels with the whitepaper.
   ----------------------------------------------------------------------------
   About two minutes, 1920x1080, H.264, rendered on the same stage as
   scripts/make_investor_video.js. It describes the PLATFORM only, never the
   company, its entities or any investor ask, for the same reason
   scripts/build_whitepaper.py is kept apart from scripts/build_deck.py
   (CLAUDE.md: never mix software and investor economics).

   Every figure is measured at render time: deck_figures.py --json for the
   platform, build_hive.py --json for the agent team. A missing figure stops
   the film; it never gets a placeholder or a round number.

   Silent by design: this container has no speech engine, and a voice track
   would be the one part of the film whose words nobody could diff.

   Usage: SP=<dir with node_modules/playwright-core> \
          node scripts/make_whitepaper_video.js <outdir>
*/
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { render } = require('./make_investor_video.js');

const ROOT = path.dirname(__dirname);
const py = (...a) => JSON.parse(execFileSync('python3', a.map((x, i) => i ? x : path.join(ROOT, x)),
                                             { cwd: ROOT, encoding: 'utf-8' }));

function figures() {
  const f = py('scripts/deck_figures.py', '--json');
  const need = ['records', 'records_date', 'editions_measured', 'editions_total', 'modules',
                'module_lines', 'usecodes', 'jurisdictions', 'coverage_rows', 'coverage_shipped',
                'coverage_blocked', 'coverage_norecord', 'curriculum_items', 'lessons',
                'articles', 'gates', 'products', 'products_notbuilt', 'products_partial',
                'agents', 'agents_shipping'];
  const missing = need.filter(k => f[k] === undefined || f[k] === null);
  if (missing.length) {
    console.error('WHITEPAPER FILM STOPPED — not measured: ' + missing.join(', '));
    process.exit(1);
  }
  const hive = py('scripts/build_hive.py', '--json');
  const hmiss = ['evals', 'beats_ok', 'beats', 'agents', 'holdout'].filter(k => hive[k] === undefined || hive[k] === null);
  if (hmiss.length) {
    console.error('WHITEPAPER FILM STOPPED — hive not measured: ' + hmiss.join(', '));
    process.exit(1);
  }
  return { f, hive };
}

const n = v => typeof v === 'number' ? v.toLocaleString('en-US') : String(v);
const dataUrl = (file, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(ROOT, file)).toString('base64');

function scenes({ f, hive }) {
  const gaps = f.coverage_rows - f.coverage_shipped;
  return [
    { key: 'open', secs: 12, kicker: 'LOCATOR.X',
      head: 'Public-record real estate,\nwith its gaps on the page.',
      sub: 'One self-contained file per market. No server, no account, no tracking.',
      stats: [[n(f.records), 'property records in the measured editions'],
              [n(f.editions_measured) + ' of ' + n(f.editions_total), 'editions measured']],
      note: 'Figures measured from the shipped editions on ' + f.records_date + '. Education and navigation of the public record — not advice.' },

    { key: 'measured', secs: 14, kicker: 'WHAT IS MEASURED',
      head: 'Every figure carries\nits evidence.',
      sub: 'A number without its source and date does not ship.',
      stats: [[n(f.usecodes), 'use codes mapped, each with a source'],
              [n(f.jurisdictions), 'jurisdictions in the crosswalk'],
              [n(f.modules), 'source modules'],
              [n(f.module_lines), 'lines of code']],
      note: 'An assessed value is never presented as a sale. A comparable is a recorded sale with a date, or it is not a comparable.' },

    { key: 'coverage', secs: 14, kicker: 'WHAT IT CANNOT ANSWER',
      head: '"Unknown" is an answer.',
      sub: 'The coverage table says what each state’s record can and cannot support.',
      stats: [[n(f.coverage_rows), 'coverage rows'],
              [n(f.coverage_shipped), 'shipped'],
              [n(f.coverage_blocked), 'blocked'],
              [n(f.coverage_norecord), 'no public record']],
      note: n(gaps) + ' rows are not shipped yet, and every one of them is published with its status rather than hidden.' },

    { key: 'academy', secs: 13, kicker: 'THE ACADEMY',
      head: 'Learn the record\nbefore you trust it.',
      sub: 'Courses generated from one curriculum source, gated by its own validator.',
      stats: [[n(f.curriculum_items), 'curriculum items'],
              [n(f.lessons), 'lessons'],
              [n(f.articles), 'articles, every figure resolved from data']],
      note: 'Instructor notes ship empty until the platform owner supplies the words.' },

    { key: 'hive', secs: 16, kicker: hive.team.toUpperCase() + ' — THE AGENT TEAM',
      head: n(hive.agents.length) + ' agents. Each one\nsays it is an AI.',
      sub: 'Synthetic voices, abstract avatars, and a hard boundary copied from the register word for word.',
      tiles: hive.agents.map(a => ({ img: dataUrl('brand/avatars/' + a.id + '.svg', 'image/svg+xml'),
                                     label: a.name, sub: a.status })),
      note: n(hive.evals) + ' probes tied to the prompt sentences that refuse them. Held-out: ' + n(hive.holdout.caught) + ' of '
            + n(hive.holdout.total) + ' unseen rephrasings caught, ' + n(hive.holdout.waved) + ' waved through; ' + n(hive.holdout.is_blocked) + ' of ' + n(hive.holdout.is_total) + ' legitimate requests wrongly blocked. Heartbeat: '
            + n(hive.beats_ok) + ' of ' + n(hive.beats) + ' agent modules match the register.' },

    { key: 'bounds', secs: 13, kicker: 'AN AGENT PROPOSES. A PERSON DECIDES.',
      head: 'The boundaries are\nthe product.',
      sub: hive.agents.slice(0, 4).map(a => a.name + ': ' + a.boundary.charAt(0).toLowerCase() + a.boundary.slice(1) + '.').join('  '),
      stats: [[n(f.agents_shipping) + ' of ' + n(f.agents), 'agents ship outright today']],
      note: 'Drafting for a human to review is in scope. Sending is not, and no agent acquires the ability to send by being asked nicely.' },

    { key: 'gates', secs: 13, kicker: 'THE PROOF IS MECHANICAL',
      head: 'Honesty enforced\nby the build.',
      sub: 'Not a value. A validator.',
      stats: [[n(f.gates), 'CI gates, each raising, none warning']],
      note: 'The persona gate is tested by breaking it: an upgraded status, a softened boundary, a cloned voice and a human avatar must each fail the build.' },

    { key: 'notbuilt', secs: 12, kicker: 'WHAT IS NOT BUILT',
      head: 'The gaps are in\nthe film too.',
      sub: 'A product whose own repository contradicts it has a worse problem than the gap.',
      stats: [[n(f.products_notbuilt) + ' of ' + n(f.products), 'products not built'],
              [n(f.products_partial), 'more are partial']],
      note: 'docs/KNOWN_GAPS.md lists every measured defect not fixed yet, with the stated cost of leaving it.' },

    { key: 'close', secs: 13, kicker: 'READ THE REPOSITORY',
      head: 'Every validator is readable.\nEvery figure is dated.',
      sub: 'github.com/agifuturefoundation/locator.x',
      stats: [[n(f.gates), 'gates run on every pull request'], [n(hive.evals), 'agent evals in the build']],
      note: 'Education and navigation of the public record. Verify before relying. Not advice, and not an offer of anything.' },
  ];
}

async function main() {
  const outdir = process.argv[2];
  if (!outdir) { console.error('usage: node scripts/make_whitepaper_video.js <outdir>'); process.exit(1); }
  await render(scenes(figures()), outdir, 'locator-x-whitepaper-film.mp4',
               { footer: 'PRODUCT WHITEPAPER \\u00b7 EDUCATION, NOT ADVICE', footerColor: 'rgba(143,163,189,0.6)',
                 brand: 'LOCATOR.X' });
}
main().catch(e => { console.error(e); process.exit(1); });
