"""placegen — synthetic geography that reads as a place.

Shared by anything in this family that needs an invented map: the fleet demo's
market islands, and campus or training grounds elsewhere. It exists because the
first version of that geography was one rectangle for the island, two for the
parks and three straight lines for the roads, with property scattered uniformly
inside the box. It rendered as confetti on a beige rectangle — which exercised
almost none of the renderer and looked like nothing.

Two profiles, one set of primitives:

  * `market_island(...)`  an inhabited island: irregular coast, a street grid
    rotated off true north, districts, parks, a river and a rail line. Parcels
    sit ON STREETS, which is the single thing that makes a parcel map read as a
    city rather than a scatter plot.
  * `campus(...)`         a training ground: an irregular boundary, building
    footprints on a quad, walking paths rather than car streets, zones by
    discipline, and stations placed along the path network.

Everything is deterministic given a seed, and everything is INVENTED. No
coordinate produced here corresponds to anywhere; callers place their output on
a fictional island and say so where a reader can see it. The point of this
module is to exercise a renderer honestly, never to imply a survey.

Coordinates are plain lon/lat degrees in a small neighbourhood of the origin, so
a caller can translate them wherever it likes.
"""
import math
import random


def fc(feats):
    return {"type": "FeatureCollection", "features": feats}


def poly(coords, props):
    return {"type": "Feature", "properties": props,
            "geometry": {"type": "Polygon", "coordinates": coords}}


def line(pts, props):
    return {"type": "Feature", "properties": props,
            "geometry": {"type": "LineString", "coordinates": pts}}


def ring(cx, cy, rx, ry, rng, n=72):
    """A closed, irregular coastline: an ellipse pushed around by three
    harmonics, so it has bays and headlands instead of corners."""
    a1, a2, a3 = rng.uniform(.06, .13), rng.uniform(.03, .08), rng.uniform(.02, .05)
    p1, p2, p3 = rng.uniform(0, 6.28), rng.uniform(0, 6.28), rng.uniform(0, 6.28)
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        r = 1 + a1 * math.sin(2 * t + p1) + a2 * math.sin(3 * t + p2) + a3 * math.sin(5 * t + p3)
        pts.append([round(cx + rx * r * math.cos(t), 5), round(cy + ry * r * math.sin(t), 5)])
    pts.append(pts[0])
    return [pts]


def inside(pt, ring):
    x, y = pt
    v, c = ring[0], False
    for i in range(len(v) - 1):
        x1, y1 = v[i]; x2, y2 = v[i + 1]
        if ((y1 > y) != (y2 > y)) and (x < (x2 - x1) * (y - y1) / ((y2 - y1) or 1e-12) + x1):
            c = not c
    return c


def clip(pts, ring):
    """Split a polyline into the runs that fall on land."""
    out, run = [], []
    for p0 in pts:
        if inside(p0, ring):
            run.append(p0)
        elif len(run) > 1:
            out.append(run); run = []
        else:
            run = []
    if len(run) > 1:
        out.append(run)
    return out


def streets(ring, cx, cy, rx, ry, rng):
    """A grid, rotated a little off true north the way a real downtown is, plus
    two diagonals. Returns (features, segments) - segments feed placement."""
    feats, segs = [], []
    rot = rng.uniform(-0.35, 0.35)
    cos_r, sin_r = math.cos(rot), math.sin(rot)
    def rotate(x, y):
        dx, dy = x - cx, y - cy
        return [round(cx + dx * cos_r - dy * sin_r, 5), round(cy + dx * sin_r + dy * cos_r, 5)]
    for i in range(-7, 8):
        x = cx + rx * i / 7.0
        line_pts = [rotate(x, cy + ry * j / 14.0) for j in range(-16, 17)]
        for run in clip(line_pts, ring):
            feats.append(line(run, {"type": "Road"})); segs.append(run)
    for j in range(-5, 6):
        y = cy + ry * j / 5.0
        line_pts = [rotate(cx + rx * i / 14.0, y) for i in range(-16, 17)]
        for run in clip(line_pts, ring):
            kind = "Major Highway" if j in (-2, 2) else "Road"
            feats.append(line(run, {"type": kind})); segs.append(run)
    for d in (1, -1):
        line_pts = [rotate(cx + rx * t / 12.0, cy + d * ry * t / 12.0) for t in range(-13, 14)]
        for run in clip(line_pts, ring):
            feats.append(line(run, {"type": "Major Highway"})); segs.append(run)
    return feats, segs


def blob(cx, cy, r, rng, n=26, squash=0.7):
    """A small irregular polygon — a park, a district, a green."""
    a = rng.uniform(.12, .3); p = rng.uniform(0, 6.28)
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        rr = r * (1 + a * math.sin(3 * t + p))
        pts.append([round(cx + rr * math.cos(t), 5), round(cy + rr * squash * math.sin(t), 5)])
    pts.append(pts[0])
    return [pts]


def on_street(segs, rng):
    """A point a few metres off a street centreline — which is where houses are."""
    run = segs[rng.randrange(len(segs))]
    i = rng.randrange(max(1, len(run) - 1))
    (x1, y1), (x2, y2) = run[i], run[min(i + 1, len(run) - 1)]
    t = rng.random()
    x, y = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1e-9
    off = (rng.random() * 2 - 1) * 0.0016
    return round(x - dy / L * off, 5), round(y + dx / L * off, 5)

def pick_in_cell(segs, x0, y0, cw, ch, rng):
    """A street point inside this ZIP cell, or the cell centre-ish if the cell
    has no street on it (an island edge cell, usually)."""
    for _ in range(18):
        x, y = on_street(segs, rng)
        if x0 <= x <= x0 + cw and y0 <= y <= y0 + ch:
            return x, y
    return (round(x0 + 0.006 + (cw - 0.012) * rng.random(), 5),
            round(y0 + 0.006 + (ch - 0.012) * rng.random(), 5))


# ---- profiles --------------------------------------------------------------

def market_island(seed, w, h, n_districts=3):
    """An inhabited island: coast, street grid, districts, parks, river, rail.

    Returns a dict of FeatureCollections plus the street segments, so a caller
    can place parcels ON the streets rather than scattering them in the bbox.
    """
    rng = random.Random(seed)
    cx, cy, rx, ry = w / 2, h / 2, w * 0.54, h * 0.54
    coast = ring(cx, cy, rx, ry, rng)
    road_feats, segs = streets(coast, cx, cy, rx * .92, ry * .92, rng)
    return {
        "coast": poly(coast, {"name": "Demo Island %d" % seed}),
        "urban": poly(ring(cx, cy, rx * .62, ry * .62, rng, n=40), {}),
        "roads": fc(road_feats),
        "segments": segs,
        "centre": (cx, cy), "radii": (rx, ry), "rng": rng,
    }


# A training campus is not a small city, and generating it as one produces a
# place that reads wrong: campuses have a quad rather than a grid, buildings
# with footprints rather than parcels on lots, paths that bend rather than
# streets that run, and zones organised by what is taught rather than by what
# land costs. These are the pieces that differ.

TRADES = ["Electrical", "Plumbing & pipefitting", "Welding & fabrication",
          "HVAC & controls", "Carpentry & framing", "Masonry & concrete",
          "Heavy equipment", "Instrumentation", "Safety & rescue",
          "Millwright & rigging", "Sheet metal", "Industrial coatings"]


def _footprint(cx, cy, w, h, rot, notch=0.0):
    """A building footprint: a rotated rectangle, optionally L-shaped. Real
    shop buildings are rarely square and almost never axis-aligned to the
    parcel, which is what makes a campus plan read as drawn rather than
    generated."""
    pts = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2)]
    if notch:
        pts += [(w / 2 - w * notch, h / 2), (w / 2 - w * notch, h / 2 - h * notch),
                (-w / 2, h / 2 - h * notch)]
    else:
        pts += [(-w / 2, h / 2)]
    c, s = math.cos(rot), math.sin(rot)
    out = [[round(cx + x * c - y * s, 6), round(cy + x * s + y * c, 6)] for x, y in pts]
    out.append(out[0])
    return [out]


def campus(seed, w, h, halls=12, stations=10):
    """A training ground: boundary, quad, hall footprints, walking paths, zones
    by trade, and stations placed along the path network.

    Every hall carries the trade it teaches and the zone it sits in, so a
    caller can colour, filter or route by discipline without inventing a join.
    """
    rng = random.Random(seed * 977 + 13)
    cx, cy = w / 2, h / 2
    rx, ry = w * 0.46, h * 0.46
    bound = ring(cx, cy, rx, ry, rng, n=48)
    quad = blob(cx, cy, min(rx, ry) * .22, rng, n=22, squash=0.85)

    # Halls sit on two arcs around the quad — an inner ring of teaching shops
    # and an outer ring of heavy bays, which is how a trades campus is actually
    # laid out: the loud, wide-door buildings go to the edge.
    hall_feats, doors = [], []
    for i in range(halls):
        inner = i < halls // 2
        t = 2 * math.pi * (i % max(1, halls // 2)) / max(1, halls // 2) + (0 if inner else .38)
        rr = (0.42 if inner else 0.74)
        hx, hy = cx + rx * rr * math.cos(t), cy + ry * rr * math.sin(t)
        bw = min(rx, ry) * (0.13 if inner else 0.2)
        bh = min(rx, ry) * (0.09 if inner else 0.12)
        rot = t + math.pi / 2 + rng.uniform(-.18, .18)
        trade = TRADES[i % len(TRADES)]
        hall_feats.append(poly(_footprint(hx, hy, bw, bh, rot, notch=.38 if i % 3 == 0 else 0),
                               {"name": "%s Hall" % trade, "trade": trade,
                                "kind": "teaching shop" if inner else "heavy bay",
                                "zone": "Inner quad" if inner else "Heavy yard"}))
        # the door faces the quad; that is where the path has to reach
        doors.append([round(hx - bw * .6 * math.cos(rot), 6),
                      round(hy - bw * .6 * math.sin(rot), 6)])

    # Paths: a ring around the quad plus a spur to every door. Bent, not
    # straight — a desire line is a curve, and a campus drawn with straight
    # spokes reads as a diagram.
    path_feats, segs = [], []
    ringpts = []
    for i in range(49):
        t = 2 * math.pi * i / 48
        rr = 1 + .06 * math.sin(3 * t + seed)
        ringpts.append([round(cx + rx * .5 * rr * math.cos(t), 6),
                        round(cy + ry * .5 * rr * math.sin(t), 6)])
    path_feats.append(line(ringpts, {"type": "Path", "name": "The Ring"}))
    segs.append(ringpts)
    for d in doors:
        near = min(ringpts, key=lambda p: (p[0] - d[0]) ** 2 + (p[1] - d[1]) ** 2)
        mid = [round((near[0] + d[0]) / 2 + rng.uniform(-1, 1) * rx * .02, 6),
               round((near[1] + d[1]) / 2 + rng.uniform(-1, 1) * ry * .02, 6)]
        spur = [near, mid, d]
        path_feats.append(line(spur, {"type": "Path"}))
        segs.append(spur)

    zones = fc([poly(blob(cx, cy, min(rx, ry) * .55, rng, n=30), {"name": "Inner quad"}),
                poly(blob(cx + rx * .35, cy - ry * .3, min(rx, ry) * .4, rng, n=30),
                     {"name": "Heavy yard"}),
                poly(blob(cx - rx * .4, cy + ry * .34, min(rx, ry) * .34, rng, n=30),
                     {"name": "Safety & rescue ground"})])

    # Stations sit ON the path network, for the same reason parcels sit on
    # streets: a waypoint floating between buildings is a coordinate, not a
    # place someone stands.
    st = []
    for i in range(stations):
        x, y = on_street(segs, rng)
        st.append({"id": "st-%d-%02d" % (seed, i + 1), "lng": x, "lat": y,
                   "name": "%s station" % TRADES[i % len(TRADES)],
                   "trade": TRADES[i % len(TRADES)]})

    return {
        "boundary": poly(bound, {"name": "Campus %d" % seed}),
        "quad": poly(quad, {"name": "The Quad"}),
        "halls": fc(hall_feats),
        "paths": fc(path_feats),
        "zones": zones,
        "stations": st,
        "segments": segs,
        "centre": (cx, cy),
    }
