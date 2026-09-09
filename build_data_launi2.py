"""Locator.X — Louisiana University Cities edition, data emit.

Reads launi_pool.json (built by build_data_launi.py from the East Baton Rouge
Parish tax roll joined to the City-Parish cadastre) and zillow_launi.json
(ZHVI / ZORI series for Louisiana ZIPs), and emits data_launi.js in the same
columnar shape the other editions use.

Nothing here invents a price. `price` is the assessor's fair market value for
the parcel, carried through unchanged and labelled as such on every record;
this roll publishes no sale date, so priceDate is null throughout.
"""
import os
import json, math, collections
from property_categories import categorize_by_kind, CATEGORY_INDEX, CATEGORY_COLORS, get_marker_size
R = os.path.dirname(os.path.abspath(__file__)) + os.sep

pool=json.load(open(R+'launi_pool.json'))
z=json.load(open(R+'zillow_launi.json'))
camp=[c for c in json.load(open(R+'campus_enrollment.json')) if c['state']=='LA']

MONTHS=61
def series(rows, key_i=2):
    hdr=rows[0]; out={}; months=None
    for r in rows[1:]:
        vals=[(float(v) if v not in (None,'','NA') else None) for v in r[7:]]
        out[r[key_i]]=vals[-MONTHS:]
    months=[h for h in hdr[7:]][-MONTHS:]
    return out, months

zipVal, mz = series(z['zipVal'])
zipRent, _ = series(z['zipRent'])
zipCity={r[2]:r[4] for r in z['zipVal'][1:]}
zipCounty={r[2]:r[6] for r in z['zipVal'][1:]}
for r in z['zipRent'][1:]:
    zipCity.setdefault(r[2], r[4]); zipCounty.setdefault(r[2], r[6])
print('zip series — value', len(zipVal), 'rent', len(zipRent), 'months', mz[0], '->', mz[-1])

# keep the edition's own ZIPs plus the rest of the region for the market tab
EBR_ZIPS={l['zip'] for l in pool if l['zip']}
print('edition zips', len(EBR_ZIPS), 'covered by zhvi', len(EBR_ZIPS & set(zipVal)))

TARGET=120000
listings=[]
for i,l in enumerate(pool[:TARGET]):
    n=len(listings)+1
    nb = ('Near '+l['campus']) if (l.get('campus') and l.get('ckm') is not None and l['ckm']<=4.8) else None
    cd=('East Baton Rouge Parish 2025 roll · assessor fair market value'
        + (' · parcel is on the parish ADJUDICATED list (taken for unpaid taxes)' if l.get('adj') else '')
        + (' · FEMA flood zone '+str(l['fz']) if l.get('fz') else '')
        + (' · nearest campus '+l['campus']+' at '+('%.1f'%l['ckm'])+' km' if l.get('campus') and l.get('ckm') is not None else ''))
    listings.append(dict(id='LU%06d'%n, addr=l['addr'], city=l['city'], zip=l['zip'], county='East Baton Rouge',
        nb=nb, anb=None, lat=l['lat'], lng=l['lng'], kind=l['kind'], units=l['units'],
        beds=None, baths=None, rooms=None, sqft=None, lot=None, year=None, stories=None,
        price=l['price'], priceDate=None, land=l['land'], imp=l['imp'], zoning=None, apn=l['apn'],
        classdef=cd, src=l['src'], est=None, cv=l.get('cv'), adj=l.get('adj')))
print('listings', len(listings))
print(collections.Counter(x['kind'] for x in listings).most_common(12))

# Add category encoding to all listings
for l in listings:
    # Categorize by kind + units (EBR doesn't have use-codes until ebr_income.json is fetched)
    category, confidence = categorize_by_kind(
        l.get('kind'),
        units=l.get('units'),
        use_code=None  # Will be set to use_code when ebr_income.json is integrated
    )
    l['category'] = category
    l['categoryConfidence'] = confidence
    # Get marker size based on price (rough proxy for score until full scoring is added)
    price = l.get('price', 0)
    if price > 300000:
        l['markerSize'] = 'large'
    elif price > 150000:
        l['markerSize'] = 'medium'
    else:
        l['markerSize'] = 'small'
    # Get marker color
    l['markerColor'] = CATEGORY_COLORS.get(category, '#888888')

market=dict(months=mz, nbMonths=[],
    zips={k:dict(v=zipVal.get(k), r=zipRent.get(k), city=zipCity.get(k), county=zipCounty.get(k))
          for k in set(zipVal)|set(zipRent)},
    cities={}, nbs={})

# ---- geometry: EBR parish outline + the ZIP polygons that intersect it ----
zg=json.load(open(R+'geo/la_zips.json'))
feats=[]
for f in zg['features']:
    zc=f['properties'].get('ZCTA5CE10')
    if zc not in EBR_ZIPS: continue
    v=zipVal.get(zc); rr=zipRent.get(zc)
    props=dict(zip=zc, city=zipCity.get(zc), zhvi=(v[-1] if v and v[-1] else None),
               zori=(rr[-1] if rr and rr[-1] else None),
               yoy=(round((v[-1]/v[-13]-1)*100,1) if v and v[-1] and len(v)>12 and v[-13] else None))
    feats.append({'type':'Feature','properties':props,'geometry':f['geometry']})
zips_fc={'type':'FeatureCollection','features':feats}
print('zip polygons', len(feats))

cf=json.load(open(R+'geo/geojson-counties-fips.json'))
ebr=[f for f in cf['features'] if f['id']=='22033'][0]
counties_fc={'type':'FeatureCollection','features':[
    {'type':'Feature','properties':{'NAME':'East Baton Rouge Parish'},'geometry':ebr['geometry']}]}
EMPTY={'type':'FeatureCollection','features':[]}
geo=dict(counties=counties_fc, zips=zips_fc, roads=EMPTY, urban=EMPTY, rail=EMPTY,
         parks=EMPTY, rivers=EMPTY, nbsf=EMPTY, nboak=EMPTY, nbala=EMPTY)

BR=[c for c in camp if c['city']=='Baton Rouge']
region=dict(name='Baton Rouge', center=[-91.13, 30.44], zoom=11.2,
            maxBounds=[[-91.55,30.13],[-90.75,30.75]],
            pois=[dict(name=c['name'], lng=c['lng'], lat=c['lat']) for c in BR])

def dic():
    vals=[]; idx={}
    def get(v):
        if v not in idx: idx[v]=len(vals); vals.append(v)
        return idx[v]
    return vals,get
cityV,cityI=dic(); nbV,nbI=dic(); kindV,kindI=dic(); clsV,clsI=dic(); srcV,srcI=dic(); categoryV,categoryI=dic()
COUNTY=['East Baton Rouge']
rows=[]
for l in listings:
    rows.append([l['addr'], cityI(l['city']), (int(l['zip']) if l['zip'] else None), 0,
        None if l['nb'] is None else nbI(l['nb']), None,
        round((l['lat']-30)*1e5), round((l['lng']+92)*1e5), kindI(l['kind']), l['units'],
        l['price'], l['land'], l['imp'], l['apn'], clsI(l['classdef']), srcI(l['src']),
        (1 if l.get('cv') else 0)+(2 if l.get('adj') else 0),
        categoryI(l.get('category', 'RESIDENTIAL')),
        round(l.get('categoryConfidence', 0.6) * 100)])
D=dict(city=cityV, county=COUNTY, nb=nbV, kind=kindV, cls=clsV, src=srcV, category=categoryV)
j=lambda o: json.dumps(o, separators=(',',':'))
decoder='''var _n=0;
var listings=R.map(function(r){_n++;var t=String(_n);while(t.length<6)t="0"+t;var f=r[16];var o={id:"LU"+t,addr:r[0],city:D.city[r[1]],zip:r[2]==null?"":String(r[2]),county:D.county[r[3]],nb:r[4]==null?null:D.nb[r[4]],anb:null,lat:+((30+r[6]/1e5).toFixed(5)),lng:+((r[7]/1e5-92).toFixed(5)),kind:D.kind[r[8]],units:r[9],beds:null,baths:null,rooms:null,sqft:null,lot:null,year:null,stories:null,price:r[10],priceDate:null,land:r[11],imp:r[12],zoning:null,apn:r[13],classdef:D.cls[r[14]],src:D.src[r[15]],tour:null,category:D.category[r[17]],categoryConfidence:r[18]/100};if(f&1)o.cv=1;if(f&2)o.adj=1;return o;});
return {listings:listings,market:M,geo:G,panos:{},built:B,region:REGION};'''
s=('window.BA=(function(){"use strict";var D='+j(D)+';var R='+j(rows)+';var M='+j(market)
   +';var G='+j(geo)+';var REGION='+j(region)+';var B="2026-09-03-LAUNI";\n'+decoder+'\n})();')
open(R+'raw/data_launi.js','w').write(s)
print('raw/data_launi.js bytes', len(s))
import sys; sys.path.insert(0,R)
from compress_data import compress
r=compress(R+'raw/data_launi.js', R+'data_launi.js')
print('data_launi.js', round(r['before']/1e6,2), '->', round(r['after']/1e6,2), 'MB', r['literals'])
