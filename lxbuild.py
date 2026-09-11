"""lxbuild — the shared build library.

Two problems this solves, both of which were costing real time.

1. THE MODULE LIST LIVED IN TWELVE PLACES. Every builder carried its own verbatim
   copy of the same 52-file concatenation, so adding a module meant patching
   twelve files and a mistake in any one of them shipped a broken edition. It is
   now here, once.

2. THE SHELL WAS SHIPPING RAW, TWELVE TIMES. The application is about 1.1 MB of
   JavaScript, a third of it English prose in string literals, and it is byte-for-
   byte identical in every package. Against a hard 16 MB page ceiling that is 1.1
   MB of the budget spent on something no edition varies. Compressed with the same
   gzip the parcel data already uses, it lands at roughly 0.43 MB — which is about
   700 KB of parcel headroom recovered per package, or another ~18,000 properties
   in every city, and it compounds with every city added.

   The decompressed source is injected as a dynamically created <script> element
   rather than eval'd. That distinction matters: an inserted classic script runs
   synchronously at global scope with exactly the semantics of an inline script,
   so top-level const/let/function all land where they did before. Indirect eval
   would silently scope top-level const and let to the eval, and the failure would
   be a handful of undefined references at runtime rather than a build error.

   The -standalone.html variant is deliberately left UNCOMPRESSED. This app argues
   that a tool should be checkable, and shipping only an opaque blob would quietly
   contradict that; the standalone file keeps every rationale comment readable.
"""
import os, re, gzip, base64, subprocess, hashlib, sys

# Repo root from this file's own location, so a clone runs anywhere.
# LOCATOR_X_ROOT overrides it when the data tree sits outside the repo.
R = (os.environ.get('LOCATOR_X_ROOT') or os.path.dirname(os.path.abspath(__file__))).rstrip(os.sep) + os.sep
TERSER = R + 'node_modules/.bin/terser'

# ---- the module list: ONE copy, in load order -----------------------------
# ---- curriculum integrity gate -------------------------------------------
# The declared curriculum and the shipped lesson content drifted twice before
# this existed (E1-E8 after Track 17, D7 after Track 18), and its first run also
# found three prerequisites sitting at higher levels than the items needing
# them. A build must not ship a curriculum that disagrees with itself, so this
# runs once per build process and raises rather than warning.
# Set LX_SKIP_CURRICULUM=1 to bypass (for debugging only).
def _curriculum_gate():
    if os.environ.get('LX_SKIP_CURRICULUM'):
        print('  ! curriculum check skipped (LX_SKIP_CURRICULUM)')
        return
    try:
        r = subprocess.run([sys.executable, R + 'curriculum/validate.py'],
                           capture_output=True, text=True, timeout=180)
    except Exception as e:
        print('  ! curriculum check could not run (%s) — continuing' % e)
        return
    out = (r.stdout or '').rstrip()
    if r.returncode == 0:
        last = [l for l in out.splitlines() if l.strip()]
        if last: print(last[-1])
        return
    raise SystemExit('\nBUILD STOPPED — the curriculum disagrees with the shipped content:\n'
                     + out + '\n' + (r.stderr or ''))

_curriculum_gate()

MODULES = [
  'src/secure.js', 'src/bubbles3d.js', 'src/palette.js', 'src/voice.js', 'src/canvasmap.js', 'src/app.js',
  'src/dashboard.js', 'src/research.js', 'src/dev.js', 'src/underwrite.js', 'src/locator.js', 'src/hacks.js',
  'src/scout.js', 'node_modules/d3-delaunay/dist/d3-delaunay.min.js', 'src/vis.js', 'src/twin.js',
  'src/academy.js', 'src/tradeschool.js', 'src/conv.js', 'src/signals.js', 'src/uwviz.js',
  'src/rag.js', 'src/uwexport.js', 'src/program.js', 'src/views.js', 'src/belowmarket.js',
  'src/dash3d.js', 'src/towers.js', 'src/sectors.js', 'src/panels.js', 'src/corp.js',
  'src/patterns.js', 'src/campus.js', 'src/records.js', 'src/recon.js', 'src/walk.js',
  'src/motion.js', 'src/rebuild.js', 'src/tradecraft.js', 'src/corridors.js',
  'src/corridormotion.js', 'src/evidence.js', 'src/comps.js', 'src/proptime.js',
  'src/compliance.js', 'src/predict.js', 'src/correlate.js', 'src/predictviz.js', 'src/outlook.js',
  'src/outlookviz.js', 'src/standards.js', 'src/standardsviz.js',
  'src/packages_data.js', '@SELF@', 'src/packages.js', 'src/tiers.js',
  'src/sources_data.js', 'src/sources.js', 'src/rooms.js',
  'src/network.js', 'src/reo.js', 'src/ar.js', 'src/nav.js', 'src/home.js',
  'src/gradschool.js', 'src/mindset.js', 'src/devcourse.js', 'src/pmcourse.js', 'src/datacourse.js', 'src/eqcourse.js', 'src/labcourse.js', 'src/widercourse.js', 'src/thesis.js', 'src/gate.js', 'src/routes.js', 'src/notes.js', 'src/telemetry.js', 'src/assistant.js', 'src/walkthrough.js', 'src/deskws.js', 'src/packet_data.js', 'src/packet.js', 'src/cover.js',
]

# reference data blobs, identical in every package
REFDATA = ['corp_data.js', 'campus_data.js', 'cost_data.js', 'corridor_data.js', 'reo_data.js']

_CACHE = {}

def read(p):
    with open(R + p, encoding='utf-8') as f: return f.read()

def app_source(self_id):
    parts = []
    for m in MODULES:
        if m == '@SELF@':
            parts.append('window.LXPACKAGES.self=%s;' % ('"%s"' % self_id if self_id else 'null'))
        else:
            parts.append(read(m))
    return '\n'.join(parts)

def minify(js):
    """terser, cached on a hash of the input so twelve builds do it once"""
    key = hashlib.sha1(js.encode()).hexdigest()
    if key in _CACHE: return _CACHE[key]
    cache = R + '.build_cache/' + key + '.js'
    os.makedirs(R + '.build_cache', exist_ok=True)
    if os.path.exists(cache):
        out = open(cache, encoding='utf-8').read()
    else:
        src = R + '.build_cache/in.js'
        open(src, 'w', encoding='utf-8').write(js)
        r = subprocess.run([TERSER, src, '-c', '-m', '-o', cache],
                           capture_output=True, text=True, timeout=600)
        if r.returncode != 0 or not os.path.exists(cache):
            # A minifier failure must never ship a half-built page. Fall back to
            # the raw source, which is correct and merely larger, and say so.
            print('  ! terser failed, shipping raw shell:', (r.stderr or '')[:160])
            return js
        out = open(cache, encoding='utf-8').read()
    _CACHE[key] = out
    return out

def pack(js):
    """gzip + base64 + the loader that re-inserts it as a real script element"""
    b64 = base64.b64encode(gzip.compress(js.encode('utf-8'), 9)).decode('ascii')
    return ('(function(){var b=atob("' + b64 + '"),n=b.length,u=new Uint8Array(n),i=0;'
            'for(;i<n;i++)u[i]=b.charCodeAt(i);'
            'var s=document.createElement("script");'
            's.textContent=fflate.strFromU8(fflate.gunzipSync(u));'
            'document.head.appendChild(s);})();')

def refdata_packed():
    """the shared reference blobs, compressed together as one payload"""
    js = '\n'.join(read(f) for f in REFDATA)
    return pack(js)

def refdata_raw():
    return '\n'.join(read(f) for f in REFDATA)

def assemble(head, body, data_js, app_js, extra_scripts=(), compress=True):
    ml = read('node_modules/maplibre-gl/dist/maplibre-gl.js').replace('</script', '<\\/script')
    fflate = read('node_modules/fflate/umd/index.js')
    mlcss = read('node_modules/maplibre-gl/dist/maplibre-gl.css')
    shell = pack(minify(app_js)) if compress else app_js
    ref = refdata_packed() if compress else refdata_raw()
    out = [head.replace('<style>', '<style>\n' + mlcss + '\n', 1), body,
           '\n<script>', ml, '</script>\n<script>', fflate, '</script>\n<script>', data_js, '</script>\n']
    for e in extra_scripts:
        out += ['<script>', e, '</script>\n']
    out += ['<script>', ref, '</script>\n<script>', shell, '</script>\n']
    return ''.join(out)

def standalone(head, body, data_js, app_js, extra_scripts=()):
    """the readable build: no compression, every comment intact"""
    ml = read('node_modules/maplibre-gl/dist/maplibre-gl.js').replace('</script', '<\\/script')
    fflate = read('node_modules/fflate/umd/index.js')
    mlcss = read('node_modules/maplibre-gl/dist/maplibre-gl.css')
    parts = ['<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
             '<meta name="viewport" content="width=device-width,initial-scale=1">\n',
             head.replace('<style>', '<style>\n' + mlcss + '\nbody{margin:0}\n', 1),
             '</head><body>', body,
             '\n<script>', ml, '</script>\n<script>', fflate, '</script>\n<script>', data_js, '</script>\n']
    for e in extra_scripts:
        parts += ['<script>', e, '</script>\n']
    parts += ['<script>', refdata_raw(), '</script>\n<script>', app_js, '</script>\n</body></html>']
    return ''.join(parts)

def report(path, before=None):
    mb = os.path.getsize(R + path) / 1048576
    msg = '%-24s %6.2f MB' % (path, mb)
    if before: msg += '   (was %.2f MB, saved %.2f)' % (before, before - mb)
    if mb > 15.5: msg += '   *** OVER THE 15.5 MB SAFETY LINE ***'
    print(msg)
    return mb
