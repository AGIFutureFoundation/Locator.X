"""build_fleet_demo — the public site's live app: every edition, synthetic data.

Builds ONE self-contained page carrying the complete application shell (all 84
modules) with a version selector for every shipped edition in build_state.SPECS
— each over its OWN deterministic synthetic fixture with its own fictional-
island map — and the three wave templates listed disabled with their real
refusal reason. Nothing here is a real record: every coordinate sits on a
fictional island near 0°N 0°E, prices are generated, and the page
says so in a fixed banner. That is the test-suite doctrine (obviously
synthetic, asserting nothing about the world) applied to a build, so the
public site can carry the full app while real editions remain build products
of the data machine (docs/PUBLISH_MAP.md).

Run by .github/workflows/deploy-pages.yml at deploy time — the output is
generated, never committed. Needs node_modules (npm ci) for maplibre/fflate/
terser; needs no data tree and no network.

Usage: python3 scripts/build_fleet_demo.py <output.html>
"""
import json, math, random, sys, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import lxbuild as B
import build_state as BS

def rect(x0, y0, x1, y1):
    return [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]
def fc(feats): return {"type": "FeatureCollection", "features": feats}
def poly(coords, props):
    return {"type": "Feature", "properties": props,
            "geometry": {"type": "Polygon", "coordinates": coords}}
def line(pts, props):
    return {"type": "Feature", "properties": props,
            "geometry": {"type": "LineString", "coordinates": pts}}

CITY_POOL = ["Synthville", "Testport", "Fixtureton", "Demoport", "Sampleton",
             "Mockhaven", "Placeholder Point", "Fixture Bay", "Draft Harbor"]
NB_POOL = ["Fixture Heights", "Demo Docks", "Sample Row", "Mock Quarter",
           "Draft Flats", "Synthetic Shore"]
STREETS = ["Synthetic Ave", "Fixture St", "Placeholder Blvd", "Sample Way",
           "Demo Ct", "Mock Row"]
KINDS = [("Single family", 1), ("Condominium", 1), ("Duplex", 2), ("Triplex", 3),
         ("Fourplex", 4), ("Apartment 5+", 0)]

def make_ba(seed, count, wide, tall, campus):
    """One edition's fixture: its own island, grid, market and listings."""
    rng = random.Random(seed)
    W, H = 0.24 * wide, 0.16 * tall
    cities = [CITY_POOL[(seed + i * 2) % len(CITY_POOL)] for i in range(3)]
    nbs = [NB_POOL[(seed + i) % len(NB_POOL)] for i in range(3)]
    island = poly(rect(-0.02, -0.02, W + 0.02, H + 0.02), {"name": "Demo Island %d" % seed})
    urban = poly(rect(0.02, 0.01, W - 0.02, H - 0.01), {})
    parks = fc([poly(rect(W * .2, H * .6, W * .32, H * .8), {"name": "Fixture Park"}),
                poly(rect(W * .65, H * .15, W * .77, H * .32), {"name": "Sample Green"})])
    rivers = fc([line([[0, H], [W * .4, H * .55], [W * .55, H * .6], [W + .02, H * .1]], {})])
    rail = fc([line([[0, H * .4], [W * .5, H * .45], [W + .02, H * .5]], {})])
    roads = fc([line([[0, H * .28], [W + .02, H * .32]], {"type": "Major Highway"}),
                line([[W * .17, 0], [W * .2, H]], {"type": "Road"}),
                line([[W * .75, 0], [W * .72, H]], {"type": "Road"})])
    zids = ["%05d" % (seed * 100 + i + 11) for i in range(6)]
    cell_w, cell_h = (W - 0.04) / 3, (H - 0.02) / 2
    cells = {z: (0.02 + (i % 3) * cell_w, 0.01 + (i // 3) * cell_h) for i, z in enumerate(zids)}
    citymap = {z: cities[i % 3] for i, z in enumerate(zids)}
    zipfc = fc([poly(rect(x, y, x + cell_w, y + cell_h), {"zip": z, "city": citymap[z]})
                for z, (x, y) in cells.items()])
    nbsf = fc([poly(rect(0.03, H * .62, W * .3, H * .95), {"name": nbs[0]}),
               poly(rect(W * .4, 0.02, W * .62, H * .35), {"name": nbs[1]}),
               poly(rect(W * .7, H * .62, W * .95, H * .95), {"name": nbs[2]})])
    months = ['%d-%02d' % (2023 + (8 + m) // 12, (8 + m) % 12 + 1) for m in range(36)]
    def series(base, drift):
        return [round(base * (1 + drift * m / 36 + 0.006 * math.sin(m / 3.1))) for m in range(36)]
    zips_m, cities_m = {}, {}
    for i, z in enumerate(zids):
        v0 = 330000 + 80000 * ((seed + i) % 6)
        r0 = 1800 + 260 * ((seed + i) % 6)
        drift = [-.02, .01, .03, .04, .05, .07][(seed + i) % 6]
        zips_m[z] = {"v": series(v0, drift), "r": series(r0, drift + .02)}
    for c in set(citymap.values()):
        zs = [z for z in zids if citymap[z] == c]
        cities_m[c] = {"v": [round(sum(zips_m[z]["v"][m] for z in zs) / len(zs)) for m in range(36)],
                       "r": [round(sum(zips_m[z]["r"][m] for z in zs) / len(zs)) for m in range(36)]}
    listings = []
    for i in range(count):
        z = zids[i % 6]; x0, y0 = cells[z]
        kind, units = KINDS[i % len(KINDS)]
        if units == 0: units = rng.choice([6, 8, 12, 16, 24])
        zv = zips_m[z]["v"][0]
        price = int(round(zv * (0.55 + 0.9 * rng.random()) * (1 + 0.35 * math.log(max(1, units))), -3))
        listings.append({
            "id": "demo-%d-%03d" % (seed, i + 1),
            "addr": "%d %s" % (10 + i * 7, STREETS[i % len(STREETS)]),
            "city": citymap[z], "county": "Demo", "zip": z,
            "nb": nbs[i % 3] if i % 5 == 0 else None,
            "lat": round(y0 + 0.006 + (cell_h - 0.012) * rng.random(), 5),
            "lng": round(x0 + 0.006 + (cell_w - 0.012) * rng.random(), 5),
            "price": price, "units": units,
            "beds": None if units > 4 else max(1, units + i % 3),
            "sqft": int((900 if units == 1 else 700 * units) * (0.8 + 0.5 * rng.random())),
            "year": 1938 + (i * 7) % 85, "kind": kind,
            "src": "Synthetic demo fixture", "priceDate": "2026-01",
        })
    region = {"center": [W / 2, H / 2], "zoom": 11.0,
              "maxBounds": [[-0.2, -0.18], [W + 0.25, H + 0.22]], "pois": []}
    if campus:
        region["pois"] = [{"name": "Synthetic State University", "lat": H * .35, "lng": W * .77}]
    return {"listings": listings,
            "market": {"months": months, "zips": zips_m, "cities": cities_m, "nbs": {}},
            "geo": {"counties": fc([island]), "urban": fc([urban]), "parks": parks,
                    "zips": zipfc, "rivers": rivers, "rail": rail, "roads": roads,
                    "nbsf": nbsf, "nboak": fc([]), "nbala": fc([])},
            "panos": {}, "region": region}

# ---- one entry per real spec, in registry order ----------------------------
COUNTS = {"bay": 90, "nola": 90, "nola-classic": 90, "launi": 60, "below": 100,
          "income": 50, "match": 50, "sheltercove": 24, "uscorridor": 84,
          "usnew5": 84, "uswide": 84}
CAMPUS = {"launi", "nola-classic", "nola"}
order, editions, templates = [], {}, []
for i, key in enumerate(sorted(BS.SPECS)):
    spec = BS.SPECS[key]
    if any('REQUIRED' in str(spec.get(f, 'REQUIRED')) for f in ('output', 'title', 'self_id', 'data_module')):
        templates.append({"key": key,
                          "note": spec['data_module'].replace('REQUIRED: ', '')})
        continue
    order.append(key)
    editions[key] = {"label": spec['title'], "hide": spec['hide_tabs'],
                     "n": COUNTS.get(key, 60),
                     "BA": make_ba(3 + i * 7, COUNTS.get(key, 60),
                                   0.8 + (i % 4) * 0.18, 0.8 + ((i * 2) % 3) * 0.22,
                                   key in CAMPUS)}

fleet = {"order": order, "editions": editions, "templates": templates, "default": "bay"}
switcher = r"""
/* SYNTHETIC FLEET — all edition versions over generated fixtures. */
(function(){
  var F = window.LXFLEET;
  var k = null;
  try { k = localStorage.getItem('lx_fleet_edition'); } catch(e) {}
  if (!k || !F.editions[k]) k = F.default;
  var ed = F.editions[k];
  window.BA = ed.BA;
  document.title = ed.label + ' · Synthetic Demo';
  if (ed.hide && ed.hide.length) {
    var sels = [];
    ed.hide.forEach(function(t){ sels.push('button[data-view="' + t + '"]', '#' + t); });
    var st = document.createElement('style');
    st.textContent = sels.join(',') + '{display:none!important}';
    document.head.appendChild(st);
  }
  function wire(){
    var bar = document.getElementById('demobanner');
    if (!bar) return;
    var sel = document.createElement('select');
    sel.id = 'fleetsel';
    sel.setAttribute('aria-label', 'Edition version');
    sel.style.cssText = 'margin-left:10px;font:600 12px system-ui;padding:2px 6px;border-radius:6px;border:0;background:#fff;color:#3b1414;max-width:min(60vw,420px)';
    F.order.forEach(function(key){
      var o = document.createElement('option');
      o.value = key;
      o.textContent = F.editions[key].label + ' (' + F.editions[key].n + ' synthetic records)';
      if (key === k) o.selected = true;
      sel.appendChild(o);
    });
    F.templates.forEach(function(t){
      var o = document.createElement('option');
      o.disabled = true;
      o.textContent = t.key + ' — refuses to build until real data exists (' + t.note + ')';
      sel.appendChild(o);
    });
    sel.addEventListener('change', function(){
      try { localStorage.setItem('lx_fleet_edition', sel.value); } catch(e) {}
      location.reload();
    });
    bar.appendChild(sel);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
"""
data_js = ("/* SYNTHETIC FLEET DATA — generated fixtures for every edition version; "
           "no real property, price or coordinate appears anywhere in this file. */\n"
           "window.LXFLEET=" + json.dumps(fleet, separators=(",", ":")) + ";\n" + switcher)

head = B.read('src/head.html'); body = B.read('src/body.html')
head = re.sub(r'<title>[^<]*</title>', '<title>Locator X Synthetic Fleet</title>', head, 1)
for a, b in [
    ('Locator X dashboard · SF Bay Area',
     'Locator X dashboard · SYNTHETIC DEMO — generated fixture records'),
    ('Every one of the 128,319 sites', 'Every one of this edition’s synthetic fixture records'),
]:
    body = body.replace(a, b)
banner = ('<div id="demobanner" style="background:#8a2d2d;color:#fff;text-align:center;'
          'font:600 12px system-ui;padding:6px 10px;letter-spacing:.05em">'
          'SYNTHETIC FLEET DEMO — all edition versions; every record, price and coordinate is a '
          'generated fixture on a fictional island. Version:</div>')
body = banner + body
app = B.app_source('demo')
for a, b in [
    ('128,319 real sites from county records', 'synthetic fixture records (this demo)'),
    ('extruding 128,319 sites', 'extruding the synthetic records'),
]:
    app = app.replace(a, b)
# the five reference blobs live in the data tree; every consumer guards its
# absence, so the demo ships without them rather than faking them
B.REFDATA = []
stubs = 'window.LXCORP=[];window.LXCAMPUS=[];window.LXCORRIDORS=null;window.LXREO=null;'
if len(sys.argv) < 2:
    raise SystemExit('usage: python3 scripts/build_fleet_demo.py <output.html>')
out = sys.argv[1]
# standalone(): the complete, uncompressed, readable document — this app argues
# a tool should be checkable, and the public demo is the natural place to keep
# every rationale comment intact. No terser, no packing, no document surgery.
open(out, 'w').write(B.standalone(head, body, data_js, app, [stubs]))
print('editions: %d shipped + %d templates; wrote %s  %.2f MB'
      % (len(order), len(templates), out, os.path.getsize(out) / 1048576))
