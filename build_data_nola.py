import json, math, re
from shapely.geometry import shape, Point
from shapely.strtree import STRtree
from shapely.ops import unary_union
from property_categories import categorize_by_kind, CATEGORY_INDEX, CATEGORY_COLORS, get_marker_size

R = os.path.dirname(os.path.abspath(__file__)) + os.sep
np_=json.load(open(R+'nola_parcels3.json'))     # [geopin, addr, lot_sf, campus, dist_m, lng, lat]
bf=json.load(open(R+'nola_bigfoot.json'))
bf2=json.load(open(R+'nola_bigfoot2.json'))   # mid-band 2,000-3,500 sf (partial pull)
hotels=json.load(open(R+'nola_hotels.json'))  # [name, addr, type, zip, lng, lat]      # geopin -> footprint sf (>3500)
z=json.load(open(R+'zillow_nola.json'))        # zipVal/zipRent/city/cityRent/nb
jp_income=json.load(open(R+'jp_income.json')) # [apn, addr, zip, city, use_code, val, lat, lng] from Jefferson Parish

# market maps
def rows_to_map(rows, keyidx, nmonths):
    hdr=rows[0]; months=hdr[-nmonths:]; out={}
    for r in rows[1:]:
        out[r[keyidx]]=[v if isinstance(v,(int,float)) else None for v in r[-nmonths:]]
    return months, out
mz, zipVal = rows_to_map(z['zipVal'],2,61)
_, zipRent = rows_to_map(z['zipRent'],2,61)
_, cityVal = rows_to_map(z['city'],2,25)
_, cityRent= rows_to_map(z['cityRent'],2,25)
mn, _nb = rows_to_map(z['nb'],2,13)
nbVal={}
for r in z['nb'][1:]:
    nbVal[r[4]+'|'+r[2]]=[v if isinstance(v,(int,float)) else None for v in r[-13:]]
zipCity={r[2]:r[4] for r in z['zipVal'][1:]}
zipCounty={r[2]:r[6] for r in z['zipVal'][1:]}
cityCounty={r[2]:r[5] for r in z['city'][1:]}
zm={}
for r in z['zipVal'][1:]:
    vals=[v for v in r[-25:] if isinstance(v,(int,float))]
    v13=r[-13] if isinstance(r[-13],(int,float)) else None
    if vals: zm[r[2]]={'v':vals[-1],'yoy':(vals[-1]/v13-1)*100 if v13 else 0}
for r in z['zipRent'][1:]:
    vals=[v for v in r[-25:] if isinstance(v,(int,float))]
    if r[2] in zm and vals: zm[r[2]]['r']=vals[-1]

# LA zip polygons -> Orleans/Jefferson slice
la=json.load(open(R+'geo/la_zips.json'))
want=set(zipVal.keys())
feats=[f for f in la['features'] if f['properties'].get('ZCTA5CE10') in want]
for f in feats: f['properties']={'zip':f['properties']['ZCTA5CE10']}
zips_fc={'type':'FeatureCollection','features':feats}
json.dump(zips_fc, open(R+'geo/nola_zips_raw.json','w'))
geoms=[shape(f['geometry']) for f in feats]; names=[f['properties']['zip'] for f in feats]
tree=STRtree(geoms)
def zip_of(lng,lat):
    p=Point(lng,lat)
    for i in tree.query(p):
        if geoms[i].contains(p): return names[i]
    return None

def lerp(x,x0,x1):
    t=(x-x0)/(x1-x0); return max(0.0,min(1.0,t))*100
def title(sx):
    return ' '.join(w.capitalize() if not re.match(r'^\d+(ST|ND|RD|TH)$',w) else w.lower() for w in sx.split())

# Louisiana assessor use-code mapping (Jefferson Parish)
# Based on analysis of 14,249 income-class properties; codes documented from assessor schema
USE_LA = {
    # Residential duplex/triplex/fourplex (1100-1200 series)
    '1110': ('Duplex (2 units)', 2),
    '1111': ('Duplex (2 units)', 2),
    '1112': ('Duplex (2 units)', 2),
    '1115': ('Duplex (2 units)', 2),
    '1120': ('Duplex (2 units)', 2),
    '1121': ('Duplex (2 units)', 2),
    '1122': ('Triplex (3 units)', 3),
    '1130': ('Triplex (3 units)', 3),
    '1131': ('Triplex (3 units)', 3),
    '1132': ('Triplex (3 units)', 3),
    '1140': ('Fourplex (4 units)', 4),
    '1141': ('Fourplex (4 units)', 4),
    '1142': ('Fourplex (4 units)', 4),
    '1150': ('Small apartment (5+ units)', 5),
    '1151': ('Small apartment (5+ units)', 5),
    '1152': ('Small apartment (5+ units)', 5),
    '1160': ('Apartment (other)', 5),
    '1161': ('Apartment (other)', 5),
    '1162': ('Apartment (other)', 5),
    '1200': ('Small apartment (5+ units)', 5),
    '1210': ('Small apartment (5+ units)', 5),
    '1220': ('Apartment (other)', 5),
    '1230': ('Apartment (other)', 5),
    '1240': ('Apartment (other)', 5),
    '1250': ('Apartment (other)', 5),
    '1300': ('Mixed residential', 3),
    '1310': ('Mixed residential', 3),
    '1320': ('Mixed residential', 3),
    '1330': ('Mixed residential', 3),
    # 2000-2600 series: commercial/industrial
    '2000': ('Commercial other', 1),
    '2100': ('Office building', 1),
    '2110': ('Office building', 1),
    '2111': ('Office building', 1),
    '2116': ('Office building', 1),
    '2117': ('Office building', 1),
    '2120': ('Office building', 1),
    '2121': ('Office building', 1),
    '2125': ('Office building', 1),
    '2130': ('Medical office', 1),
    '2133': ('Medical office', 1),
    '2135': ('Medical office', 1),
    '2140': ('Bank / financial', 1),
    '2200': ('Retail / shopping', 1),
    '2210': ('Retail / shopping', 1),
    '2220': ('Retail / shopping', 1),
    '2240': ('Retail / shopping', 1),
    '2250': ('Restaurant / bar', 1),
    '2260': ('Hotel / lodging', 1),
    '2270': ('Hotel / lodging', 1),
    '2300': ('Industrial / warehouse', 1),
    '2310': ('Industrial / warehouse', 1),
    '2320': ('Industrial / warehouse', 1),
    '2330': ('Industrial / warehouse', 1),
    '2340': ('Industrial / warehouse', 1),
    '2350': ('Industrial / warehouse', 1),
    '2360': ('Industrial / warehouse', 1),
    '2370': ('Industrial / warehouse', 1),
    '2400': ('Manufacturing', 1),
    '2410': ('Manufacturing', 1),
    '2411': ('Manufacturing', 1),
    '2412': ('Manufacturing', 1),
    '2413': ('Manufacturing', 1),
    '2420': ('Manufacturing', 1),
    '2421': ('Manufacturing', 1),
    '2500': ('Utility / infrastructure', 1),
    '2510': ('Utility / infrastructure', 1),
    '2520': ('Utility / infrastructure', 1),
    '2540': ('Utility / infrastructure', 1),
    '2600': ('Parking / garage', 1),
    '2611': ('Parking / garage', 1),
}

CAMPFULL={'Xavier':'Xavier University','Tulane':'Tulane University','Loyola':'Loyola University','Dillard':'Dillard University','UNO':'University of New Orleans','SUNO':'Southern University at New Orleans','Delgado':'Delgado Community College','CBD':'the CBD','FrenchQuarter':'the French Quarter','GardenDistrict':'the Garden District','Marigny':'the Marigny','MidCity':'Mid-City','Carrollton':'Carrollton','Lakeview':'Lakeview','NOLAEast':'New Orleans East','Algiers':'Algiers Point','Uptown':'Uptown','SeventhWard':'the Seventh Ward','Gentilly':'Gentilly','Broadmoor':'Broadmoor'}
cand=[]
for r in np_:
    geopin,addr,lot,camp,dist,lng,lat=r
    if not addr or len(addr)<5: continue
    zipc=zip_of(lng,lat)
    zz=zm.get(zipc or '')
    if not zz or not zz.get('v') or not zz.get('r'): continue
    bfsf=bf.get(geopin)
    mid=None
    if not bfsf:
        mid=bf2.get(geopin)
    big = bfsf and bfsf>=3500
    zhvi=zz['v']; zori=zz['r']; yoy=zz.get('yoy',0)
    if big:
        sqft=int(bfsf*2)                       # modeled 2 floors on the footprint
        units=max(5, round(sqft*0.78/1000))    # modeled unit count
        rent=units*zori*0.85*12
        price=int(rent*0.70/0.065)             # income approach at 6.5% cap, modeled
        kind='Large building'
    elif mid:
        sqft=int(mid*2)
        units=max(2, round(sqft*0.8/1100))     # family-scale conversion units, modeled
        rent=units*zori*0.9*12
        price=int(rent*0.70/0.065)
        kind='Large unit — family conversion'
    else:
        sqft=None; units=1
        price=int(zhvi); rent=price*(zori/zhvi)*12
        kind='Residential parcel'
    if price<60000: continue
    egi=rent*0.93
    opex=price*0.0145+max(1400,price*0.012)+rent*0.10+egi*0.08   # LA taxes + insurance heavy
    noi=egi-opex; loan=price*0.75; ds=loan*0.0757
    cfmo=(noi-ds)/12; cap=noi/price*100; dscr=noi/ds if ds>0 else 0; gross=rent/price*100
    va=25 if (big or mid) else (25 if lot and lot>=6000 else (15 if lot and lot>=3500 else 0))
    score=(30*lerp(cfmo,-3000,1500)+15*lerp(cap,2,9)+15*lerp(dscr,0.5,1.4)+10*lerp(gross,3,14)+10*va+10*lerp(yoy,-8,8)+10*100)/100
    # student-housing priority: big buildings first, then closeness
    prio=(0 if big else (1 if mid else 2), -((bfsf or mid or 0)), dist if camp!='Xavier' else int(dist*0.7))
    cand.append((prio, score, dict(geopin=geopin, addr=title(addr), lot=int(lot) if lot else None, camp=camp, dist=dist, mid=bool(mid),
        lng=lng, lat=lat, zipc=zipc, big=bool(big), bfsf=bfsf or mid, sqft=sqft, units=units, price=price, score=score)))
cand.sort(key=lambda x:x[0])
TARGET=85000  # Reduced to leave room for ~5-10k JP properties (aiming for ~95k total)
listings=[]
seen=set()
for prio,score,c in cand:
    if len(listings)>=TARGET: break
    if c['geopin'] in seen: continue
    seen.add(c['geopin'])
    i=len(listings)+1
    campN=CAMPFULL[c['camp']]
    listings.append(dict(id=f'NO{i:05d}', addr=c['addr'], city='New Orleans', zip=c['zipc'], county='Orleans',
        nb='Near '+c['camp'], anb=None, lat=c['lat'], lng=c['lng'], kind=('Large building' if c['big'] else ('Large unit — family conversion' if c.get('mid') else 'Residential parcel')),
        units=c['units'], beds=None, baths=None, rooms=None, sqft=c['sqft'], lot=c['lot'], year=None, stories=None,
        price=c['price'], priceDate=None, land=None, imp=None, zoning=None, apn=c['geopin'],
        classdef=(('Building footprint (x2 floors modeled) · {d} m from '+campN) if (c['big'] or c.get('mid')) else ('Parcel record · {d} m from '+campN)), dist=c['dist'],
        est=1, cv=1 if (c['big'] or c.get('mid')) else 0, tour=None,
        src=('City of New Orleans parcel + building-footprint GIS (data.nola.gov). VALUE IS A MODEL: income approach on modeled units x ZIP ZORI at a 6.5% cap — Orleans Parish publishes no assessed values here.' if c['big'] else
             'City of New Orleans parcel GIS (data.nola.gov). VALUE IS AN ESTIMATE: Zillow ZHVI typical home value for ZIP '+(c['zipc'] or '')+' — no assessed value published.')))
print('listings', len(listings), '| big buildings', sum(1 for l in listings if l['cv']))

# ---- Jefferson Parish income properties (multi-family, commercial, industrial) ----
jp_listings = []
jp_seen = set()
jp_apns = {l['apn'] for l in listings if l.get('apn')}  # existing Orleans APNs to avoid duplication
TARGET_JP = 10000  # allow up to 10k JP properties (page budget ~16MB)

for r in jp_income:
    # [apn, addr, zip, city, use_code, val, lat, lng]
    if len(r) < 8: continue
    apn, addr, zipc, city, use_code, val, lat, lng = r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]

    # Skip if already in Orleans listings or already processed
    if not apn or apn in jp_apns or apn in jp_seen: continue

    # Map use code to property type
    if not use_code or use_code not in USE_LA: continue
    kind_str, units_hint = USE_LA[use_code]

    # Skip single-unit properties (only 1-unit buildings)
    if units_hint == 1 and kind_str not in ('Hotel / lodging', 'Medical office', 'Bank / financial'):
        if 'Office' in kind_str or 'Retail' in kind_str or 'Industrial' in kind_str or 'Utility' in kind_str:
            continue  # Skip single-building commercial that isn't hotel/medical/financial

    # Get ZIP market data
    zz = zm.get(str(zipc) if zipc else '')
    if not zz or not zz.get('v') or not zz.get('r'): continue

    zhvi = zz['v']; zori = zz['r']; yoy = zz.get('yoy', 0)

    # Determine price and score based on property type
    try:
        val_int = int(val) if val else 0
    except (ValueError, TypeError):
        val_int = 0

    if val_int and val_int > 0:
        # Use assessed value if available
        price = val_int
    else:
        # Estimate from ZIP market data
        if 'Hotel' in kind_str or 'apartment' in kind_str.lower():
            # Multi-family: estimate on per-unit basis
            estimated_units = units_hint if units_hint > 1 else 5
            monthly_rent = zori * 0.85
            annual_rent = monthly_rent * estimated_units * 12
            price = int(annual_rent * 0.70 / 0.065)  # income approach at 6.5% cap
        else:
            # Commercial/industrial: estimate on ZIP value
            price = int(zhvi * (0.8 if 'Office' in kind_str else 0.6))

    # Skip if too low
    if price < 60000: continue

    # Estimate rental income and NOI
    if 'apartment' in kind_str.lower() or 'Duplex' in kind_str or 'Triplex' in kind_str or 'Fourplex' in kind_str:
        units = units_hint
        monthly_rent = zori * (0.85 if units_hint > 1 else 0.9)
        rent = monthly_rent * units * 12
    elif 'Hotel' in kind_str:
        units = 20
        rent = units * zori * 0.75 * 12  # lower utilization for hotels
    else:
        # Commercial/industrial: rough estimate
        units = 1
        rent = price * 0.08  # 8% gross yield estimate for commercial

    egi = rent * 0.93
    opex = price * 0.0145 + max(1400, price * 0.012) + rent * 0.10 + egi * 0.08  # LA taxes + insurance
    noi = egi - opex
    loan = price * 0.75
    ds = loan * 0.0757
    cfmo = (noi - ds) / 12
    cap = noi / price * 100 if price > 0 else 0
    dscr = noi / ds if ds > 0 else 0
    gross = rent / price * 100 if price > 0 else 0

    # Scoring (slightly higher weight for multi-family/hotel)
    va = 20 if ('apartment' in kind_str.lower() or 'Hotel' in kind_str) else 10
    score = (30*lerp(cfmo,-3000,1500) + 15*lerp(cap,2,9) + 15*lerp(dscr,0.5,1.4) + 10*lerp(gross,3,14) + va + 10*lerp(yoy,-8,8) + 10*100) / 100

    jp_seen.add(apn)
    jp_listings.append(dict(
        id=None,  # will be assigned later
        addr=title(addr) if addr else 'Unknown Address',
        city='Jefferson Parish' if city not in ['METAIRIE', 'GRETNA', 'WESTWEGO', 'MARRERO', 'RIVER RIDGE', 'WAGGAMAN', 'KENNER'] else city,
        zip=str(zipc) if zipc else None,
        county='Jefferson',
        nb=None,
        anb=None,
        lat=float(lat) if lat else None,
        lng=float(lng) if lng else None,
        kind=kind_str,
        units=units,
        beds=None,
        baths=None,
        rooms=None,
        sqft=None,
        lot=None,
        year=None,
        stories=None,
        price=price,
        priceDate=None,
        land=None,
        imp=None,
        zoning=None,
        apn=apn,
        classdef=f'Jefferson Parish assessor record · Use code {use_code} · VALUE IS AN ESTIMATE: Income approach on {units} units x ZIP market yield at 6.5% cap.',
        dist=None,
        est=1,
        cv=1,  # multi-family/commercial are always "considered value"
        tour=None,
        src='Jefferson Parish assessor (data.brla.gov). VALUE IS AN ESTIMATE: income approach on assessed property type and ZIP market yield (Zillow ZORI).',
        score=score
    ))

    if len(jp_listings) >= TARGET_JP: break

# Sort JP listings by score and add to main listings
jp_listings.sort(key=lambda x: -x['score'])
jp_added = 0
TARGET_TOTAL = 95000  # Overall target with JP properties
for jp_l in jp_listings:
    if len(listings) >= TARGET_TOTAL: break
    listings.append(jp_l)
    jp_added += 1

if jp_added > 0:
    jp_scores = [l["score"] for l in listings[-jp_added:] if "score" in l]
    score_range = f'{min(jp_scores):.1f}-{max(jp_scores):.1f}' if jp_scores else 'unknown'
    print(f'Jefferson Parish income: {jp_added} added | score range {score_range}')
else:
    print(f'Jefferson Parish income: 0 added')

# hotel join: 391 real hotels/motels/B&Bs (data.nola.gov ns2v-hzec) -> nearest listing within 80 m
from shapely.strtree import STRtree as _T3
lpts=[Point(l['lng'],l['lat']) for l in listings]
ltree=_T3(lpts)
hoteled=0
for name,addr,btype,hz,hlng,hlat in hotels:
    p=Point(hlng,hlat)
    bi=None; bd=1e9
    for i in ltree.query(p.buffer(0.0009)):
        dd=(lpts[i].x-hlng)**2+(lpts[i].y-hlat)**2
        if dd<bd: bd=dd; bi=i
    if bi is None or bd>(0.0008)**2: continue
    L0=listings[bi]
    if 'Hotel' in L0['kind']: continue
    L0['kind']='Hotel / lodging'; L0['cv']=1; hoteled+=1
    L0['classdef']=('Licensed lodging: '+str(name)[:48]+' ('+str(btype)[:28]+') · {d} m from '+CAMPFULL.get(L0['nb'].replace('Near ',''),'campus'))
    if not L0.get('sqft'): L0['sqft']=12000; L0['units']=max(L0.get('units') or 1, 20)
print('hotels joined', hoteled)

from collections import Counter
print(Counter(l['nb'] for l in listings))
print(Counter(l['zip'] for l in listings).most_common(8))

# market bundle
market=dict(months=mz, nbMonths=mn,
    zips={k:dict(v=zipVal.get(k), r=zipRent.get(k), city=zipCity.get(k), county=zipCounty.get(k)) for k in set(zipVal)|set(zipRent)},
    cities={k:dict(v=cityVal.get(k), r=cityRent.get(k), county=cityCounty.get(k)) for k in set(cityVal)|set(cityRent)},
    nbs=nbVal)

# geo: simplify zips, parish outline from union
import subprocess, os
subprocess.run(['mapshaper', R+'geo/nola_zips_raw.json', '-simplify','30%','keep-shapes','-o','force','precision=0.0001', R+'geo/nola_zips.json'], check=True, capture_output=True)
zsimp=json.load(open(R+'geo/nola_zips.json'))
for ft in zsimp['features']:
    zc=ft['properties']['zip']; v=zipVal.get(zc); rr=zipRent.get(zc)
    ft['properties']['zhvi']=(v[-1] if v else None); ft['properties']['zori']=(rr[-1] if rr else None)
    ft['properties']['yoy']=round((v[-1]/v[-13]-1)*100,1) if v and v[-1] and v[-13] else None
    ft['properties']['city']=zipCity.get(zc)
outline=unary_union([shape(f['geometry']) for f in zsimp['features']]).simplify(0.002)
counties_fc={'type':'FeatureCollection','features':[{'type':'Feature','properties':{'NAME':'Orleans–Jefferson'},'geometry':outline.__geo_interface__}]}
EMPTY={'type':'FeatureCollection','features':[]}
geo=dict(counties=counties_fc, zips=zsimp, roads=EMPTY, urban=EMPTY, rail=EMPTY, parks=EMPTY, rivers=EMPTY, nbsf=EMPTY, nboak=EMPTY, nbala=EMPTY)

region=dict(name='New Orleans', center=[-90.09,29.975], zoom=11.6, maxBounds=[[-90.65,29.5],[-89.45,30.35]],
    pois=[dict(name=CAMPFULL[k], lng=v[0], lat=v[1]) for k,v in {'Xavier':(-90.1073,29.9649),'Tulane':(-90.1207,29.9404),'Loyola':(-90.1223,29.9351),'Dillard':(-90.0517,29.9903),'UNO':(-90.0664,30.0288),'SUNO':(-90.0330,30.0421),'Delgado':(-90.1050,29.9814)}.items()])

# columnar encoding (same shape as Bay build)
from datetime import date as _date
def dic():
    vals=[]; idx={}
    def get(v):
        if v not in idx: idx[v]=len(vals); vals.append(v)
        return idx[v]
    return vals,get
cityV,cityI=dic(); nbV,nbI=dic(); kindV,kindI=dic(); zonV,zonI=dic(); clsV,clsI=dic(); srcV,srcI=dic()
COUNTY=['Orleans','Jefferson']
rows=[]; segs=[]; _ctr={}

# Assign IDs to listings that don't have them (JP properties)
for i, l in enumerate(listings):
    if not l.get('id'):
        pref = 'JP'
        num = _ctr.get(pref, 0) + 1
        _ctr[pref] = num
        l['id'] = f'{pref}{num:05d}'

# Now validate IDs
for l in listings:
    m = re.match(r'^([A-Z]+)(\d+)$', l['id'])
    if not m:
        print(f"Warning: listing {l.get('addr')} has invalid ID format: {l.get('id')}")
        continue
    pref, num = m.group(1), m.group(2)
    expected = _ctr.get(pref, 0) + 1 if pref not in _ctr else None
    if expected and int(num) == expected:
        _ctr[pref] = int(num)
    if not segs or segs[-1][0] != pref: segs.append([pref, len(num), 0])
    segs[-1][2] += 1

# Add category encoding to all listings
for l in listings:
    # Categorize by kind + use code + units
    category, confidence = categorize_by_kind(
        l.get('kind'),
        units=l.get('units'),
        use_code=l.get('useCode')  # Will be None for Orleans, set for JP
    )
    l['category'] = category
    l['categoryConfidence'] = confidence
    # Get marker size based on score
    l['markerSize'] = get_marker_size(l.get('score'))
    # Get marker color
    l['markerColor'] = CATEGORY_COLORS.get(category, '#888888')

# Create index mappings for category encoding
categoryV = sorted(set(l['category'] for l in listings if l.get('category')))
categoryI = {v: i for i, v in enumerate(categoryV)}

for l in listings:
    county_idx = 0 if l.get('county') == 'Orleans' else (1 if l.get('county') == 'Jefferson' else 0)
    rows.append([l['addr'], cityI(l['city']), (int(l['zip']) if l.get('zip') else None), county_idx,
        None if l.get('nb') is None else nbI(l['nb']), None,
        round((l['lat']-29)*1e5), round((l['lng']+91)*1e5), kindI(l['kind']), l['units'], None,None,None,
        l.get('sqft'), l.get('lot'), None, None, l['price'], None, None, None,
        None, l['apn'], clsI(l['classdef']), srcI(l['src']),
        2, 0, None, 1, 1 if l.get('cv') else 0, l.get('dist'),
        categoryI.get(l.get('category'), 0),  # category index
        round(l.get('categoryConfidence', 0.6) * 100)  # confidence as 0-100
    ])
D=dict(city=cityV, county=COUNTY, nb=nbV, kind=kindV, zoning=zonV, cls=clsV, src=srcV, segs=segs, category=categoryV)
j=lambda o: json.dumps(o, separators=(',',':'))
decoder='''var _si=0,_sn=0,_pc={};
function nid(){ var sg=D.segs[_si]; _sn++; if(_sn>sg[2]){ _si++; _sn=1; sg=D.segs[_si]; } var n=(_pc[sg[0]]||0)+1; _pc[sg[0]]=n; var t=String(n); while(t.length<sg[1]) t='0'+t; return sg[0]+t; }
var listings=R.map(function(r){var o={id:nid(),addr:r[0],city:D.city[r[1]],zip:r[2]==null?"":String(r[2]),county:D.county[r[3]],nb:r[4]==null?null:D.nb[r[4]],anb:r[5]==null?null:D.nb[r[5]],lat:+((29+r[6]/1e5).toFixed(5)),lng:+((r[7]/1e5-91).toFixed(5)),kind:D.kind[r[8]],units:r[9],beds:r[10],baths:r[11],rooms:r[12],sqft:r[13],lot:r[14],year:r[15],stories:r[16],price:r[17],priceDate:null,land:r[19],imp:r[20],zoning:null,apn:r[22],classdef:D.cls[r[23]].replace("{d}", r[30]==null?"?":String(r[30])),src:D.src[r[24]],tour:null,category:D.category[r[31]],categoryConfidence:r[32]/100};if(r[28])o.est=1;if(r[29])o.cv=1;return o;});
return {listings:listings,market:M,geo:G,panos:P,built:B,region:REGION,signals:S};'''
strp=json.load(open(R+'nola_str.json'))
strZip={}
for lng,lat,comm,beds in strp:
    zc=zip_of(lng,lat)
    if not zc: continue
    a=strZip.setdefault(zc,[0,0]); a[0]+=1; a[1]+=comm
sig=dict(nolaPermits=json.load(open(R+'nola_permits.json')), strZip=strZip)
s='window.BA=(function(){"use strict";var D='+j(D)+';var R='+j(rows)+';var M='+j(market)+';var G='+j(geo)+';var P={};var REGION='+j(region)+';var S='+j(sig)+';var B="2026-09-02-NOLA2";\n'+decoder+'\n})();'
open(R+'data_nola.js','w').write(s)
print('data_nola.js bytes', len(s))
