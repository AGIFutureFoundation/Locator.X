"""build_fleet_demo — the public site's live app: every edition, synthetic data.

Builds ONE self-contained page carrying the complete application shell (all 85
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
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import placegen as PG
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
# One entry per screening class the Type filter offers, so the demo exercises
# every branch of kindClass() rather than only the residential ones. The three
# non-residential labels deliberately mirror the shapes the real records use -
# a flat "Hotel", a compound "Hotel / motel / MH park", and Onondaga's
# "Room/dorm" - because those are the strings the classifier has to get right.
KINDS = [("Single family", 1), ("Condominium", 1), ("Duplex", 2), ("Triplex", 3),
         ("Fourplex", 4), ("Apartment 5+", 0), ("Hotel", 0),
         ("Hotel / motel / MH park", 0), ("Room/dorm", 0),
         ("Mobile home park", 0)]


# The geography primitives live in scripts/placegen.py so a campus or a
# training ground can use the same machinery as a market island. See that
# module's docstring for what the two profiles are and what they refuse to
# imply.

def make_ba(seed, count, wide, tall, campus):
    """One edition's fixture: its own island, grid, market and listings."""
    rng = random.Random(seed)
    W, H = 0.24 * wide, 0.16 * tall
    cities = [CITY_POOL[(seed + i * 2) % len(CITY_POOL)] for i in range(3)]
    nbs = [NB_POOL[(seed + i) % len(NB_POOL)] for i in range(3)]
    cx, cy, rx, ry = W / 2, H / 2, W * 0.54, H * 0.54
    coast = PG.ring(cx, cy, rx, ry, rng)
    island = poly(coast, {"name": "Demo Island %d" % seed})
    urban = poly(PG.ring(cx, cy, rx * .62, ry * .62, rng, n=40), {})
    road_feats, segs = PG.streets(coast, cx, cy, rx * .92, ry * .92, rng)
    roads = fc(road_feats)
    parks = fc([poly(PG.blob(cx - rx * .38, cy + ry * .34, min(rx, ry) * .16, rng),
                     {"name": "Fixture Park"}),
                poly(PG.blob(cx + rx * .42, cy - ry * .3, min(rx, ry) * .13, rng),
                     {"name": "Sample Green"}),
                poly(PG.blob(cx + rx * .05, cy + ry * .52, min(rx, ry) * .1, rng),
                     {"name": "Harbour Common"})])
    # A river that meanders and takes a tributary, clipped to the coast.
    def _meander(x0, y0, x1, y1, amp, k):
        pts = []
        for i in range(41):
            t = i / 40.0
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            pts.append([round(x + amp * math.sin(t * k + seed), 5),
                        round(y + amp * math.cos(t * k * 1.3 + seed), 5)])
        return pts
    riv = PG.clip(_meander(cx - rx, cy + ry * .5, cx + rx, cy - ry * .45,
                         min(rx, ry) * .12, 5.5), coast)
    trib = PG.clip(_meander(cx - rx * .1, cy - ry, cx + rx * .2, cy + ry * .1,
                          min(rx, ry) * .07, 4.0), coast)
    rivers = fc([line(r, {}) for r in riv + trib])
    rail_main = PG.clip(_meander(cx - rx, cy - ry * .2, cx + rx, cy + ry * .25,
                               min(rx, ry) * .05, 3.0), coast)
    rail_spur = PG.clip(_meander(cx + rx * .1, cy, cx + rx * .35, cy + ry * .7,
                               min(rx, ry) * .03, 2.0), coast)
    rail = fc([line(r, {}) for r in rail_main + rail_spur])
    # The index bundle covers NZIP ZIPs; property sits in a subset of them. Two
    # reasons, and the first one is a bug this fixture used to hide.
    #
    # predict.js pools a backtest across series and returns null below EIGHT of
    # them (`if(errs.length < 8) return null`). The fixture generated SIX, so the
    # measured-error band - the single most distinctive thing this platform does -
    # could never draw in the public demo, and the predictions page advertised
    # "not testable, too few series" as though that were a property of the method
    # rather than of the fixture. Off by two.
    #
    # The subset is the second reason: in a real edition the index bundle and the
    # parcel bundle are separate deliveries that do not cover the same ZIPs, which
    # is what the coverage panel exists to state. A fixture where every index ZIP
    # holds property makes that panel say something trivially true and leaves the
    # partial-coverage path unexercised.
    NZIP, COLS = 24, 6
    ROWS = NZIP // COLS
    zids = ["%05d" % (seed * 100 + i + 11) for i in range(NZIP)]
    # Property lands in half the ZIPs, chosen by a seeded shuffle rather than by
    # taking every other one: on a six-wide grid "every other" is alternating
    # COLUMNS, which drew the whole catalogue as three vertical stripes down the
    # island. A scatter looks like a market; a stripe looks like a bug, because
    # it was one.
    pzids = sorted(random.Random(seed * 31 + 7).sample(zids, len(zids) // 2))
    cell_w, cell_h = (W - 0.04) / COLS, (H - 0.02) / ROWS
    cells = {z: (0.02 + (i % COLS) * cell_w, 0.01 + (i // COLS) * cell_h)
             for i, z in enumerate(zids)}
    citymap = {z: cities[i % 3] for i, z in enumerate(zids)}
    zipfc = fc([poly(rect(x, y, x + cell_w, y + cell_h), {"zip": z, "city": citymap[z]})
                for z, (x, y) in cells.items()])
    nbsf = fc([poly(PG.blob(cx + rx * dxi, cy + ry * dyi, min(rx, ry) * .26, rng, n=30),
                    {"name": nbs[i]})
               for i, (dxi, dyi) in enumerate([(-.42, .3), (.12, -.4), (.46, .28)])])
    months = ['%d-%02d' % (2023 + (8 + m) // 12, (8 + m) % 12 + 1) for m in range(36)]
    # Each ZIP gets its own wobble. A set of perfectly smooth curves would let the
    # log-linear fit land almost exactly, and the honest consequence of that is a
    # band near zero width - a demo that advertises an accuracy the method does
    # not have on real series. The amplitudes are drawn from the seeded rng, so
    # the build stays deterministic while the backtest sees a real spread of
    # error to measure.
    def series(base, drift, amp, phase):
        out = []
        for m in range(36):
            wob = amp * (math.sin(m * 0.9 + phase) + 0.6 * math.sin(m * 2.3 + phase * 1.7))
            out.append(round(base * (1 + drift * m / 36 + 0.006 * math.sin(m / 3.1) + wob)))
        return out
    zips_m, cities_m = {}, {}
    for i, z in enumerate(zids):
        # ---- the spread that decides whether anything can pay for itself ----
        # Measured before this change: of 14,024 records across twelve editions,
        # ZERO were cash-flow positive. Not one. The Cash-flow asset category —
        # the platform's own headline definition, "an asset puts money in your
        # pocket" — was never assigned to a single record anywhere, and neither
        # was Appreciation bet. The PASS branch of the LOCATOR cash-flow gate,
        # the "Asset" verdict on its asset test, and the dashboard's cash-flow
        # card were all dead: every positive path in the app was exercised only
        # in the failure direction.
        #
        # The cause was the market spread, not the arithmetic. Every ZIP ran
        # between 0.545% and 0.425% of value in monthly rent, so nothing came
        # near the 1% rule this app teaches and underwrite.js measures. That is
        # a coastal spread applied to every edition, including the Louisiana and
        # Midwest markets this platform actually covers, where a cheaper house on
        # a better ratio is the normal case.
        #
        # The ratio now FALLS as value rises, which is how real markets behave:
        # roughly 0.92%/mo at $140k down to 0.37%/mo at $730k. The curve is set so
        # the MAJORITY still do not pay for themselves — that is the honest state,
        # and the reason the buy box exists at all — while the ones that can now
        # exist. A fixture where everything cash-flows would be as useless as one
        # where nothing does, in the opposite direction.
        k = (seed + i) % 6
        v0 = 140000 + 118000 * k
        r0 = round(v0 * (0.0092 - 0.0011 * k) / 10) * 10
        drift = [-.02, .01, .03, .04, .05, .07][k]
        amp, phase = rng.uniform(.004, .022), rng.uniform(0, 6.28)
        zips_m[z] = {"v": series(v0, drift, amp, phase),
                     "r": series(r0, drift + .02, amp * .8, phase + 1.1)}
    # sorted(), not set(): iteration order over a set of strings depends on
    # PYTHONHASHSEED, so this emitted the city series in a different order on
    # every run and the "deterministic" fixture was nothing of the kind — three
    # builds of identical code produced three different files. Nothing about the
    # VALUES changed, which is why it went unnoticed: only the key order moved,
    # and only inside a packed payload nobody diffs.
    for c in sorted(set(citymap.values())):
        zs = [z for z in zids if citymap[z] == c]
        cities_m[c] = {"v": [round(sum(zips_m[z]["v"][m] for z in zs) / len(zs)) for m in range(36)],
                       "r": [round(sum(zips_m[z]["r"][m] for z in zs) / len(zs)) for m in range(36)]}
    # Sorted, so the band assignment is identical on every build — the fixture
    # determinism guard in tests/run.py compares decompressed payloads.
    _ys = sorted({cells[z][1] for z in pzids})
    def nb_band(z):
        i = _ys.index(cells[z][1])
        return nbs[min(len(nbs) - 1, i * len(nbs) // max(1, len(_ys)))]

    listings = []
    for i in range(count):
        z = pzids[i % len(pzids)]; x0, y0 = cells[z]
        kind, units = KINDS[i % len(KINDS)]
        if units == 0: units = rng.choice([6, 8, 12, 16, 24])
        # ---- records whose USE the county did not publish -------------------
        # evidence.js caps a zoning-district record at 55 (grade C) and an
        # unclassified one at 34 (grade D), because a permission is not a
        # building and an unclassified parcel cannot be underwritten from the
        # record. Both rules are doctrine and neither had ever been exercised:
        # every fixture record carried a clean recorded use, so the caps, the C
        # and D bands, the evidence lens's lower colours and the coverage
        # panel's zoning-only and unclassified tallies were all dead paths.
        # Roughly one record in twelve now carries a zoning district instead of
        # a use, and one in twenty-five is unclassified — which is what the
        # thinner county rolls this app actually reads look like.
        bare = (i % 17 == 3)
        # ---- vacant land: a parcel with no building on it --------------------
        # Roughly one parcel in thirty-one. No fixture record had ever been
        # vacant, which left three separate things unexercised: the VACANT
        # exclusion in comps.js rolls(), added because a lot carried on the roll
        # at a nominal few thousand and sold at a development price produced a
        # median ratio above fifty in one real county; the land-versus-improved
        # structure selector in views.js, which could only ever return the
        # improved set; and the land-only asset class. A vacant parcel carries a
        # lot area — that IS what was bought — and no building area, beds, baths,
        # storeys or year, because there is no building to describe.
        vacant = (i % 31 == 7)
        if vacant:
            kind, units = "Vacant land", 1
        # ---- commercial and industrial stock ---------------------------------
        # views.js defines nine asset classes and the fixture exercised six: the
        # Commercial and Industrial & storage tests matched nothing across all
        # 14,024 records, because every fixture kind was residential or lodging.
        # A filter that can only ever return an empty set is not a filter anybody
        # has tested. These are single-tenant by unit count, which is what the
        # roll says of a store or a warehouse.
        elif i % 23 == 5:
            kind, units = ("Retail store", "Office building", "Restaurant",
                           "Mixed-use commercial")[(i // 23) % 4], 1
        elif i % 29 == 9:
            kind, units = ("Warehouse", "Self-storage facility",
                           "Light industrial")[(i // 29) % 3], 1
        if i % 25 == 11:
            kind = "Unclassified"
        elif i % 12 == 5:
            kind = "Zoned %s" % ("R-1", "R-2", "C-2", "M-1")[(i // 12) % 4]
        zv = zips_m[z]["v"][0]
        price = int(round(zv * (0.55 + 0.9 * rng.random()) * (1 + 0.35 * math.log(max(1, units))), -3))
        listings.append({
            "id": "demo-%d-%03d" % (seed, i + 1),
            "addr": "%d %s" % (10 + i * 7, STREETS[i % len(STREETS)]),
            "city": citymap[z], "county": "Demo", "zip": z,
            # A neighborhood is a PLACE, so it comes from where the parcel is,
            # not from its position in the loop. This used to be nbs[i % 3],
            # which scattered every neighborhood across the whole island and
            # made a district's extent the whole map — so the district rail's
            # map framing could not be demonstrated or tested on the fixture.
            # Three contiguous bands by cell latitude; still only one record in
            # five carries one, because a roll that names a neighborhood for
            # every parcel is not the roll anybody actually gets.
            "nb": nb_band(z) if i % 5 == 0 else None,
            # on a street, and inside the ZIP cell it claims: a parcel map reads
            # as a place because buildings line roads, not because there are more
            # of them. Fall back to the cell if this ZIP has no street in it.
            **dict(zip(("lng", "lat"), PG.pick_in_cell(segs, x0, y0, cell_w, cell_h, rng))),
            "price": price, "units": units,
            "beds": None if bare or vacant or units > 4 else max(1, units + i % 3),
            "sqft": None if vacant else int((900 if units == 1 else 700 * units) * (0.8 + 0.5 * rng.random())),
            "year": None if vacant else 1938 + (i * 7) % 85, "kind": kind,
            "src": "Synthetic demo fixture", "priceDate": "2026-01",
            # ---- the fields the app is built to read, which no fixture carried --
            # Measured across the whole fleet before this was added: of 14,024
            # records, ZERO carried lot, sale, baths or stories. Two of the seven
            # fields evidence.js grades on were therefore permanently absent, and
            # the code that depends on them never ran in any test — the ADU and
            # lot-split tests in dashboard.js (gated at 2,500 and 4,000 sf of lot),
            # the whole recorded-sale comparables engine in comps.js (gated on
            # sale + saleDate), and the sale tile on the evidence scorecard.
            #
            # They are PARTIAL on purpose, in the same spirit as the neighborhood
            # above: a roll that carries every field for every parcel is not a roll
            # anybody actually gets, and a fixture where every field is always
            # present would stop exercising the missing-field paths that are just
            # as real. The fractions below are chosen so both sides of every gate
            # run: lot crosses both ADU thresholds, some sales are undated (a case
            # comps.js handles explicitly), and condos carry no lot at all because
            # a condo has no lot of its own.
            # One record in seventeen is a BARE roll row: a clean recorded use,
            # a price, a size and a year, and nothing else. That is grade B on
            # evidence.js's scale — "most of the work is done" — and it was the
            # one band the fixture could not produce, because every other record
            # picks up a lot, a sale or a room count somewhere and lands in A.
            # Without it the B colour on the evidence lens, the B row on the
            # scorecard and the B branch of the LOCATOR location gate were all
            # unreachable in any test.
            "lot": (None if (bare and not vacant) or "condo" in kind.lower() or (i % 10 < 3 and not vacant) or i % 25 == 11
                    else int(1800 + 7800 * rng.random())),
            "sale": (None if bare or i % 5 < 3
                     else int(price * (0.55 + 0.38 * rng.random()))),
            # a recorded price with no recorded date — rarer, and its own branch
            # The YEAR here decides whether a sale is usable, not just present:
            # comps.js rolls() only counts a sale within three years, because an
            # older one no longer says what the assessor thinks of today's
            # building. The first version of this line used (i * 3) % 9, which
            # cycles through {0, 3, 6} and nothing else — every synthetic sale
            # landed in 2016, 2019 or 2022, all of them outside the window, and
            # the roll-ratio analysis stayed exactly as dead as it was before the
            # sale field existed. A coprime step spreads across the full range so
            # both sides run: recent sales feed the ratio, older ones exercise
            # the exclusion.
            "saleDate": (None if bare or i % 5 < 3 or i % 60 == 4
                         else "%d-%02d" % (2018 + (i * 5) % 8, 1 + (i * 7) % 12)),
            "baths": (None if bare or vacant or units > 4 or i % 9 == 0
                      else max(1, (units + i % 3) - (i % 2))),
            "stories": None if bare or vacant or i % 12 < 6 else 1 + (i % 3),
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
# a LARGE synthetic database: ~11,500 records across the fleet, so the demo
# exercises the app at scale (list virtualization caps, map pin caps, the
# ranking engine) while remaining obviously synthetic end to end
COUNTS = {"bay": 2500, "nola": 1200, "nola-classic": 1000, "launi": 800,
          "below": 1500, "income": 600, "match": 600, "sheltercove": 24,
          "uscorridor": 1200, "usnew5": 900, "uswide": 1200}
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

# ---- a market with NO RENT FEED, because that is the common case ----------
# Every edition above carries a full ZORI series, so the app's rent-blind path -
# the `price x 0.004` rule of thumb LX.rentEstimate falls back to - never fired
# in any test. That is not the rare case: rent is never public record, and of the
# fourteen markets this repository has measured, EIGHT publish no rent at all,
# including Orleans, whose 213,381 shipped records answer 6 of the Investment
# Standard's 15 requirements precisely because rent is missing.
#
# So the fleet carries one. It is the `bay` fixture with every rent series
# removed - same parcels, same values, same geography, no rent - which isolates
# exactly one variable. tests/fleet_smoke.js drives it like any other edition and
# additionally asserts that nothing SCORES on the rule of thumb.
_nr = make_ba(3, COUNTS["bay"], 0.8, 0.8, False)
for _z in _nr["market"]["zips"].values():
    _z.pop("r", None)
for _c in _nr["market"]["cities"].values():
    _c.pop("r", None)
for _l in _nr["listings"]:
    _l.pop("rent", None)
order.append("norent")
editions["norent"] = {
    "label": "Locator X No-Rent Market",
    "hide": editions[order[0]]["hide"] if order else [],
    "n": COUNTS["bay"], "BA": _nr,
}

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
    raise SystemExit('usage: python3 scripts/build_fleet_demo.py <output.html> [--fragment]')
out = sys.argv[1]

# ---- the optimized composition ---------------------------------------------
# Same machinery every compressed edition uses (lxbuild.pack: gzip + base64 +
# a loader that re-inserts the source as a real synchronous script element),
# applied to all three heavy payloads:
#   shell      terser-minified then packed  (~1.1 MB of source -> ~0.4 MB)
#   fleet data minified then packed         (eleven editions' fixtures)
#   maplibre   packed as-is (its dist is already minified)
# fflate itself must ship raw — it is the decompressor — and execution order
# guarantees each global exists before the next script needs it. An earlier
# revision shipped this page uncompressed so its comments stayed readable;
# with the repository public, the readable source is one click away, and the
# page a visitor downloads should be as small as the build system can make it.
mlcss = B.read('node_modules/maplibre-gl/dist/maplibre-gl.css')
ml = B.read('node_modules/maplibre-gl/dist/maplibre-gl.js')
ff = B.read('node_modules/fflate/umd/index.js')
shell = B.pack(B.minify(app))
data_packed = B.pack(B.minify(data_js))
ml_packed = B.pack(ml)
head_doc = head.replace('<style>', '<style>\n' + mlcss + '\nbody{margin:0}\n', 1)
scripts = ('\n<script>' + ff + '</script>\n<script>' + ml_packed + '</script>\n'
           '<script>' + data_packed + '</script>\n<script>' + stubs + '</script>\n'
           '<script>' + shell + '</script>\n')
if '--fragment' in sys.argv:
    # head-fragment form (no document skeleton) for hosts that supply their own
    open(out, 'w').write(head.replace('<style>', '<style>\n' + mlcss + '\n', 1)
                         + body + scripts)
else:
    open(out, 'w').write(
        '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        + head_doc + '</head><body>' + body + scripts + '</body></html>')
print('editions: %d shipped + %d templates; wrote %s  %.2f MB'
      % (len(order), len(templates), out, os.path.getsize(out) / 1048576))
