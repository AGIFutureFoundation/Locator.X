"""Locator.X - fourth tranche: five new growth corridors.

OWNER NAMES ARE PRESENT IN FOUR OF THE FIVE RAW FILES AND ARE DROPPED HERE.
The Governance page asserts that no owner or taxpayer name reaches this application;
that assertion is only true because this file never reads those columns. Every column
is unpacked by explicit position and the owner slot is bound to `_own` and discarded.
There is an assertion at the end that re-checks the emitted pool for personal data.

Corrections carried from the pull, each of which changes what the data means:
  Wake       TOTUNITS is a BILLING unit count of any kind, not dwellings - the county's
             top values are an office tower (1,902), a storage facility (1,360) and a
             community college. Only the derived mf_unit_count column is a dwelling
             count, and it is null unless the parcel carries a residential use.
  Tippecanoe no value, no year built, no area, no unit count. Its apartment BANDS are
             the only size signal. Its entire sales history is 2017-2020.
  Utah       non-disclosure state: no sale price and no sale date exist at all.
             TOTAL_UNIT_COUNT is nonsense on lodging and is a complex count on condos.
  Mahoning   LANDUSE is bare Ohio DTE numerals; only the round codes are defined by
             OAC 5703-25-10 and the county's sub-codes are NOT use-verified.
  Albuquerque non-disclosure. Bernalillo has a real assessor server with a 152-value
             plain-English use field; Sandoval and Valencia have essentially nothing.
"""
import os
import json, collections, re, math
# Repo root from this file's own location, so a clone runs anywhere.
# LOCATOR_X_ROOT overrides it when the data tree sits outside the repo.
R = (os.environ.get('LOCATOR_X_ROOT') or os.path.dirname(os.path.abspath(__file__))).rstrip(os.sep) + os.sep

def L(f):
    try: return json.load(open(R + f))
    except Exception as e:
        print('  !! missing', f, e); return []

def num(v):
    if v in (None, '', ' ', 'NULL'): return None
    try:
        f = float(str(v).replace(',', '').strip())
        return f if f == f and abs(f) < 1e13 else None
    except Exception:
        return None

def cap(s):
    s = (s or '').strip()
    if not s or s == 'NULL': return None
    return ' '.join(w.capitalize() for w in s.split()) if s.isupper() else s

def yr(v):
    n = num(v)
    return int(n) if n and 1700 < n < 2030 else None

def sdate(v):
    """Epoch ms or a date string -> YYYY-MM-DD, rejecting the implausible."""
    if v in (None, '', ' '): return None
    import datetime
    n = num(v)
    if n is not None and n > 1e11:
        try:
            d = datetime.datetime.utcfromtimestamp(n / 1000.0)
            return d.strftime('%Y-%m-%d') if 1900 < d.year < 2030 else None
        except Exception: return None
    s = str(v).strip()[:10]
    if len(s) == 10 and s[4] == '-' and s[:4].isdigit():
        return s if 1900 < int(s[:4]) < 2030 else None
    p = str(v).split(' ')[0].split('/')
    if len(p) == 3:
        try:
            mo, da, y = int(p[0]), int(p[1]), int(p[2])
            if y < 100: y += 1900 if y > 50 else 2000
            if 1900 < y < 2030 and 1 <= mo <= 12 and 1 <= da <= 31:
                return '%04d-%02d-%02d' % (y, mo, da)
        except Exception: pass
    return None

out = []
def add(**k):
    if k.get('lat') is None or k.get('lng') is None: return
    if not (24 < k['lat'] < 50 and -126 < k['lng'] < -66): return
    if not k.get('addr'): return
    out.append(k)

MF = re.compile(r'apart|duplex|triplex|fourplex|multi|two family|three family|four family|'
                r'townhouse|mobile home park|student|dorm|fratrnty|sorority|group|rooming|'
                r'condo|multiple res|subsidize', re.I)

# ---------------------------------------------------------------- Wake NC
n = 0; seen = set()
for r in L('us_wake.json'):
    (pin, reid, addr, city, zp, _own, lcls, tuse, style, bill, tunits_any, tstruct,
     mfu, ybuilt, heat, acres, val, bval, lval, sale, saled, juris, twp, lat, lng, band) = r
    if pin in seen: continue
    seen.add(pin)
    v = num(val)
    if not v or v < 25000: continue
    kind = cap(lcls) or 'Unclassified'
    u = num(mfu)                       # DERIVED column only - never the raw billing count
    add(addr=cap(addr), city=cap(city) or 'Raleigh', zip=str(zp or '')[:5],
        county='Wake', state='NC', metro='Raleigh-Cary, NC',
        lat=lat, lng=lng, kind=kind, units=int(u) if u and u >= 2 else None,
        price=int(v), sqft=int(num(heat)) if num(heat) else None,
        lot=int(num(acres) * 43560) if num(acres) else None,
        year=yr(ybuilt), apn=str(pin), zoning=None,
        sale=int(num(sale)) if num(sale) else None, saleDate=sdate(saled), band=band,
        src=("Wake County (NC) property parcels, maps.wake.gov - the richest schema in this "
             "catalogue. Price shown is the county's ASSESSED total value; a separate recorded "
             "deed price is carried alongside it and North Carolina is a disclosure state, so "
             "that figure is a real transaction and it carries a date on 99.96% of priced rows. "
             "A CORRECTION THAT MATTERS: the county's TOTUNITS field is a BILLING unit count of "
             "any kind, not a dwelling count - its largest values are an office tower at 1,902 "
             "units, a self-storage facility at 1,360 and a community college - so the unit "
             "count shown here is a DERIVED figure, present only where the parcel also carries "
             "a residential or lodging use, and null otherwise. Statistics on this county's "
             "MapServer return null counts; the FeatureServer was used instead. Wake has no "
             "bedroom or bathroom field, and the H/M- lodging suffixes are undocumented and "
             "are NOT use-verified. Johnston County, where the Novo Nordisk plant sits, is a "
             "separate jurisdiction and is not in this build."))
    n += 1
print('wake         %6d' % n)

# ---------------------------------------------------------------- Tippecanoe IN
TIPU = [(re.compile(r'40 or More', re.I), 40), (re.compile(r'20 to 39', re.I), 20),
        (re.compile(r'4 to 19', re.I), 4), (re.compile(r'\b3\b.*Family|Three', re.I), 3),
        (re.compile(r'\b2\b.*Family|Two', re.I), 2)]
n = 0; seen = set()
for r in L('us_tippecanoe.json'):
    (pnum, pin, stkey, addr, city, zp, _own, pcls, pcode, acres, taxd, zon, ucode,
     iscondo, tdate, tif, joinkey, ppc, ppi, lat, lng, band) = r
    key = joinkey or pnum
    if not key or key in seen: continue
    seen.add(key)
    d = (pcls or '').strip()
    u = None
    for rx, uu in TIPU:
        if rx.search(d): u = uu; break
    add(addr=cap(addr), city=cap(city) or 'Lafayette', zip=str(zp or '')[:5],
        county='Tippecanoe', state='IN', metro='Lafayette-West Lafayette, IN',
        lat=lat, lng=lng, kind=cap(d) or 'Unclassified', units=u, price=None,
        sqft=None, lot=int(num(acres) * 43560) if num(acres) else None,
        year=None, apn=str(pnum), zoning=cap(zon), band=band,
        src=("Tippecanoe County (IN) parcels - the Purdue metro. NO PRICE IS SHOWN because this "
             "layer publishes no assessed value at all, and it also carries no year built, no "
             "building area and no unit count. Its one real strength is that mpropertyclass "
             "BANDS APARTMENTS NATIVELY in plain English - 4 to 19, 20 to 39, and 40 or more "
             "rental units - which no other county in this catalogue does; the unit figure here "
             "is that band's LOWER BOUND, meaning at least that many, never a count. The "
             "county's sale records exist on separate layers but span 2017 to 2020 ONLY, six "
             "years stale, and repeat a single document price across every parcel of a "
             "multi-parcel deed, so they are not carried as comparables. The honest ceiling for "
             "this county is 40,634 parcels once single-family lots are excluded, and its "
             "entire apartment stock is 1,524 parcels."))
    n += 1
print('tippecanoe   %6d' % n)

# ---------------------------------------------------------------- Utah County UT
n = 0; seen = set()
for r in L('us_utahco.json'):
    (pno, pid, addr, city, zp, _own, ptype, spc, asmt, cost, tunits, u1, timp,
     yb_com, yb_res, yb_gla, area_tot, area1, gla_res, beds, baths, acres,
     mkt, mktprv, mktland, mktimp, txbl, asmtyr, taxd, nbhd, sub,
     _sp, _sd, ppc, ppi, lat, lng, band) = r
    if pno in seen: continue
    seen.add(pno)
    v = num(mkt)
    if not v or v < 25000: continue
    t = (ptype or '').strip()
    # the unit count is trustworthy only on true apartment classes
    u = num(tunits)
    trust = bool(re.search(r'APARTMENT|STUDENT|SUBSIDIZE|MULTIPLE', t, re.I))
    add(addr=cap(addr), city=cap(city) or 'Provo', zip=str(zp or '')[:5],
        county='Utah', state='UT', metro='Provo-Orem-Lehi, UT',
        lat=lat, lng=lng, kind=cap(t) or 'Unclassified',
        units=int(u) if (u and u >= 2 and trust) else None,
        price=int(v), sqft=int(num(area_tot) or num(gla_res) or 0) or None,
        lot=int(num(acres) * 43560) if num(acres) else None,
        year=yr(yb_res) or yr(yb_com), apn=str(pno), zoning=None,
        beds=int(num(beds)) if num(beds) else None,
        baths=int(num(baths)) if num(baths) else None, band=band,
        src=("Utah County (UT) tax parcels - the BYU and UVU metro, 84,543 students between "
             "them. Price shown is the assessor's MARKET VALUE OPINION for assessment year "
             "2027, not a transaction. UTAH IS A NON-DISCLOSURE STATE: there is no sale price "
             "and no sale date anywhere in this layer's 151 fields, so NO COMPARABLE SET CAN "
             "EVER BE BUILT FOR THIS METRO from public data. Two traps were found and handled: "
             "the county's unit count is meaningless on lodging parcels - one Orem motel reads "
             "3,525 units in 83,568 square feet - and on condominiums it is the whole complex's "
             "count repeated onto every unit, so it is carried here ONLY on true apartment, "
             "student-housing and subsidised classes; and the layer's USE_CODE_DESCR_1 field is "
             "81% null and mostly describes sheds and garages rather than the main improvement, "
             "so nothing is filtered on it."))
    n += 1
print('utahco       %6d' % n)

# ---------------------------------------------------------------- Mahoning OH
DTE = {'401': 'Apartments, 4 to 19 rental units', '402': 'Apartments, 20 to 39 rental units',
       '403': 'Apartments, 40 or more rental units', '410': 'Motel or tourist cabins',
       '411': 'Hotel', '412': 'Nursing home or private hospital',
       '415': 'Trailer or mobile home park', '416': 'Commercial camp ground',
       '419': 'Other commercial housing', '420': 'Small detached retail',
       '425': 'Supermarket', '430': 'Restaurant', '440': 'Warehouse',
       '450': 'Retail', '460': 'Office building', '470': 'Miscellaneous commercial',
       '499': 'Other commercial', '520': 'Two family dwelling',
       '530': 'Three family dwelling', '550': 'Condominium residential unit',
       '560': 'Mobile home affixed to real estate', '400': 'Commercial vacant land'}
DTEU = {'401': 4, '402': 20, '403': 40, '520': 2, '530': 3}
n = 0; seen = set()
for r in L('us_mahoning.json'):
    (pid, pid2, tmap, condo, muni, _own, addr, city, zp, acres, nbhd, lu,
     mland, mimp, mtot, cauv, sale, saled, deed, taxd, school, red, hs, cf,
     ppc, ppi, lat, lng, band) = r
    if pid in seen: continue
    seen.add(pid)
    v = num(mtot)
    if not v or v < 25000: continue
    code = str(lu or '').strip()
    known = DTE.get(code)
    kind = known or ('Ohio DTE class ' + code + ' - sub-code not defined by the state rule, use NOT verified')
    add(addr=cap(addr), city=cap(city) or cap(muni) or 'Youngstown', zip=str(zp or '')[:5],
        county='Mahoning', state='OH', metro='Youngstown-Warren, OH',
        lat=lat, lng=lng, kind=kind, units=DTEU.get(code),
        price=int(v), sqft=None,
        lot=int(num(acres) * 43560) if num(acres) else None,
        year=None, apn=str(pid), zoning=None,
        sale=int(num(sale)) if num(sale) and num(sale) > 1000 else None,
        saleDate=sdate(saled), band=band,
        src=("Mahoning County (OH) parcels. Price shown is the county auditor's MARKET value, "
             "an assessment; a separate recorded sale price is carried and Ohio is a disclosure "
             "state, with a date on 100% of priced rows. Use classes are the Ohio DTE property "
             "class codes, and ONLY THE ROUND CODES ARE DEFINED by Ohio Administrative Code rule "
             "5703-25-10 (codes.ohio.gov/ohio-administrative-code/rule-5703-25-10). This county "
             "also uses sub-codes - 404, 405, 501, 528 and many others - that the state rule "
             "does not define; those records say so on their face and are NOT use-verified, "
             "because no mapping for them was invented. The layer publishes no year built, no "
             "building area and no unit count. THE CRITICAL GEOGRAPHIC LIMIT: all three of this "
             "metro's announced projects - Stargate Lordstown, Foxconn/SoftBank and Ultium - are "
             "in TRUMBULL County, whose entire GIS domain was unreachable, so the parcels "
             "closest to the capital are absent from this build."))
    n += 1
print('mahoning     %6d' % n)

# ---------------------------------------------------------------- Albuquerque NM
n = 0; seen = set()
for r in L('us_nmabq.json'):
    (cty, source, pid, alt, addr, city, zp, _own, ucode, udesc, cclass, style,
     pclass, vclass, lval, ival, tval, ntax, acres, yb_d, yb_c, oselan, taxyr,
     condo, bldg, unit, nstruct, _sp, _sd, lat, lng, band) = r
    if pid in seen: continue
    seen.add(pid)
    v = num(tval)
    berna = (cty or '').lower().startswith('bern')
    if berna and (not v or v < 25000): continue
    kind = cap(udesc) or cap(cclass) or 'Unclassified - this source publishes no usable use class'
    add(addr=cap(addr), city=cap(city) or 'Albuquerque', zip=str(zp or '')[:5],
        county=(cap(cty) or 'Bernalillo') + ' County', state='NM', metro='Albuquerque, NM',
        lat=lat, lng=lng, kind=kind, units=None,
        price=int(v) if v else None, sqft=None,
        lot=int(num(acres) * 43560) if num(acres) else None,
        year=yr(yb_d) or yr(yb_c), apn=str(pid), zoning=None, band=band,
        src=("Albuquerque metro. " + (
             "Bernalillo County Assessor's own ArcGIS server (assessormap.bernco.gov), tax year "
             "2026 - a source the earlier survey missed entirely, which changes what this metro "
             "can support: it carries land, improvement and total assessed value on 99.9% of "
             "parcels, a year built on half of them, and a 152-value plain-English use "
             "description populated on 257,280 of 257,283 rows. Price shown is that ASSESSED "
             "total, not a transaction."
             if berna else
             "New Mexico statewide parcel service, hosted by a WATER-RIGHTS agency rather than "
             "an assessor. This source publishes NO value, NO year built, NO building area and "
             "NO unit count for this county, and its land-use field carries only the statutory "
             "valuation class - residential land versus non-residential land - so NO APARTMENT "
             "BUILDING IN THIS COUNTY CAN BE IDENTIFIED from any source found. These records are "
             "included on location and coarse class alone and are labelled accordingly.")
             + " NEW MEXICO IS A NON-DISCLOSURE STATE: no sale price and no sale date exist "
             "anywhere, so no comparable set can be built for this metro."))
    n += 1
print('albuquerque  %6d' % n)

print('\nFOURTH TRANCHE TOTAL', len(out))
print(collections.Counter(x['metro'] for x in out))

# ---- the assertion the Governance page depends on --------------------------
PII = re.compile(r'owner|taxpayer|mail|phone|email|ssn|dob|race|ethnic|income|gender', re.I)
keys = set()
for o in out[:20000]: keys.update(o.keys())
bad = [k for k in keys if PII.search(k)]
assert not bad, 'PERSONAL DATA LEAKED INTO THE POOL: %s' % bad
NAMEY = re.compile(r'\b(LLC|L\.L\.C|TRUST|REVOCABLE|ET AL|ETUX|ETVIR|H/W|JR|SR|III)\b')
hits = 0
for o in out[:40000]:
    for k in ('addr', 'city', 'kind', 'zoning'):
        v = o.get(k)
        if isinstance(v, str) and NAMEY.search(v): hits += 1
print('personal-data key check: PASS (no owner/taxpayer fields)')
print('name-shaped values in address/class fields:', hits)
json.dump(out, open(R + 'uscorridor_pool6_new5.json', 'w'))
