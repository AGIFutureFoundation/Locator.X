#!/usr/bin/env bash
# publish_editions — run on the DATA MACHINE to put the real editions live.
#
# Builds every filled edition (build_state.py --all needs the local data tree
# and node_modules) and publishes the built HTML plus an integrity manifest to
# the public companion repo Locator.X-editions. The site's deploy-pages
# workflow clones that repo, verifies each file against the manifest, and
# lists the editions at /editions/ — so this script is the whole "install the
# real maps" step. The source repo itself never carries built editions
# (CLAUDE.md rule); the companion repo exists precisely so it doesn't have to.
#
# One-time setup:   gh repo create AGIFutureFoundation/Locator.X-editions --public
# Each publish:     bash scripts/publish_editions.sh
# Then either push anything to Locator.X or run:
#                   gh workflow run "deploy pages" -R AGIFutureFoundation/Locator.X
# (the site deploy triggers on the source repo, not on the editions repo).
#
# EDITIONS_REPO overrides the target (default: the Foundation companion repo).
# SKIP_BUILD=1 publishes whatever built files already sit in the repo root.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${SKIP_BUILD:-}" != "1" ]; then
  python3 build_state.py --all
fi

REPO_URL="${EDITIONS_REPO:-https://github.com/AGIFutureFoundation/Locator.X-editions.git}"
STAGE="$(mktemp -d)"
python3 - "$STAGE" <<'PYEOF'
import hashlib, json, os, shutil, subprocess, sys, datetime
sys.path.insert(0, os.getcwd())
import build_state as BS

stage = sys.argv[1]
src_commit = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'],
                            capture_output=True, text=True).stdout.strip()
rows = []
for key in sorted(BS.SPECS):
    spec = BS.SPECS[key]
    if any('REQUIRED' in str(spec.get(f, 'REQUIRED'))
           for f in ('output', 'title', 'self_id', 'data_module')):
        continue
    out = spec['output']
    if not os.path.exists(out):
        print('  ! %-14s %s missing — not built; skipping' % (key, out))
        continue
    data = open(out, 'rb').read()
    shutil.copy(out, os.path.join(stage, out))
    rows.append({'key': key, 'file': out, 'title': spec['title'],
                 'bytes': len(data),
                 'sha256': hashlib.sha256(data).hexdigest(),
                 'built': datetime.date.today().isoformat(),
                 'source_commit': src_commit})
    print('  + %-14s %s  %.2f MB' % (key, out, len(data) / 1048576))
if not rows:
    raise SystemExit('REFUSED: no built editions found — run without SKIP_BUILD, '
                     'or build first. Publishing an empty set would take the '
                     'listed editions DOWN, so it does not happen silently.')
json.dump({'generated': datetime.datetime.now(datetime.timezone.utc)
                        .isoformat(timespec='seconds'),
           'source_commit': src_commit, 'editions': rows},
          open(os.path.join(stage, 'editions.json'), 'w'), indent=1)
print('manifest: %d editions' % len(rows))
PYEOF

cd "$STAGE"
git init -q -b main
git add -A
git commit -q -m "editions build $(date -u +%F) from Locator.X@$(git -C "$OLDPWD" rev-parse --short HEAD)"
git push -f "$REPO_URL" main
echo
echo "Published. Now trigger the site deploy so it goes live:"
echo "  gh workflow run 'deploy pages' -R AGIFutureFoundation/Locator.X"
