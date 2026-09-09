"""Emit data_uscorridor.js — the US Growth Corridors edition."""
import os
import json, collections, math
R = os.path.dirname(os.path.abspath(__file__)) + os.sep

pool=json.load(open(R+'uscorridor_pool.json'))+json.load(open(R+'uscorridor_pool2.json'))+json.load(open(R+'uscorridor_pool5_hi.json'))
z=json.load(open(R+'zillow_corridor.json'))
CORR=json.loads(open(R+'corridor_data.js').read().split('=',1)[1].rstrip(';\n'))

MONTHS=61
def series(rows):
    out={}
    for r in rows[1:]:
        vals=[(float(v) if v not in (None,'','NA') else None) for v in r[7:]]
        out[r[2]]=vals[-MONTHS:]
    months=[h for h in rows[0][7:]][-MONTHS:]
    return out, months
zipVal, mz = series(z['zipVal'])
zipRent, _ = series(z['zipRent'])
zipCity={r[2]:r[4] for r in z['zipVal'][1:]}
zipCounty={r[2]:r[6] for r in z['zipVal'][1:]}
for r in z['zipRent'][1:]:
    zipCity.setdefault(r[2], r[4]); zipCounty.setdefault(r[2], r[6])
print('zip series — value', len(zipVal), 'rent', len(zipRent), 'months', mz[0], '->', mz[-1])
have=set(x['zip'] for x in pool if x['zip'])
print('edition zips', len(have), 'with a value series', len(have & set(zipVal)), 'with a rent series', len(have & set(zipRent)))

listings=[]
for i,o in enumerate(pool,1):
    # The classification note is the SOURCE note only, so it stays shared across every
    # record from that county. Per-record proximity used to be concatenated in here,
    # which made this string unique per record: 53,620 distinct values totalling 10.6
    # million characters in one edition. The distances are carried as their own fields
    # and the sentence is composed at render time instead.
    cd=o['src'].split('.')[0] + '.'
    listings.append(dict(id='UC%06d'%i, addr=o['addr'], city=o['city'], zip=o['zip'],
        county=o['county'], nb=o['metro'], anb=None, lat=o['lat'], lng=o['lng'],
        kind=o['kind'], units=o['units'] or 1, beds=o.get('beds'), baths=o.get('baths'), rooms=None,
        sqft=o['sqft'], lot=o['lot'], year=o['year'], stories=o.get('stories'),
        price=o['price'], priceDate=None, land=None, imp=None, zoning=o['zoning'],
        sale=o.get('sale'), saleDate=o.get('saleDate'), saleUndated=o.get('saleUndated'),
        campKm=o.get('campKm'), projKm=o.get('projKm'),
        apn=o['apn'], classdef=cd, src=o['src'], est=None,
        projCo=o.get('projCo'), projJobs=o.get('projJobs'), campName=o.get('campName'), campEnroll=o.get('campEnroll'),
        cv=1 if (o['units'] or 0)>=5 else None, hi=o.get('hi')))
seenk=set(); ded=[]
for l in sorted(listings, key=lambda x: -(1 if x.get('hi') else 0)):
    k=(l['apn'], l['nb'])
    if k in seenk: continue
    seenk.add(k); ded.append(l)
for i,l in enumerate(ded,1): l['id']='UC%06d'%i
listings=ded
print('listings', len(listings), '(de-duplicated on parcel + metro; high-value row wins)')
print(collections.Counter(x['county'] for x in listings))

market=dict(months=mz, nbMonths=[],
    zips={k:dict(v=zipVal.get(k), r=zipRent.get(k), city=zipCity.get(k), county=zipCounty.get(k))
          for k in set(zipVal)|set(zipRent)}, cities={}, nbs={})

EMPTY={'type':'FeatureCollection','features':[]}
geo=dict(counties=EMPTY, zips=EMPTY, roads=EMPTY, urban=EMPTY, rail=EMPTY,
         parks=EMPTY, rivers=EMPTY, nbsf=EMPTY, nboak=EMPTY, nbala=EMPTY)

pois=[]
for m in CORR['metros']:
    for p in m['projects']:
        if p.get('lat') and p.get('lng'):
            pois.append(dict(name=p['company']+' — '+p['city'], lng=p['lng'], lat=p['lat']))
region=dict(name='US Growth Corridors', center=[-95.0, 38.5], zoom=3.9,
            maxBounds=[[-125.0, 24.0],[-66.0, 49.5]], pois=pois)

def dic():
    vals=[]; idx={}
    def get(v):
        if v not in idx: idx[v]=len(vals); vals.append(v)
        return idx[v]
    return vals,get
cityV,cityI=dic(); nbV,nbI=dic(); kindV,kindI=dic(); clsV,clsI=dic(); srcV,srcI=dic(); zonV,zonI=dic()
pcoV,pcoI=dic(); cnmV,cnmI=dic()
COUNTY=sorted({x['county'] for x in listings})
rows=[]
for l in listings:
    rows.append([l['addr'], cityI(l['city']), (int(l['zip']) if l['zip'] and l['zip'].isdigit() else None),
        COUNTY.index(l['county']), nbI(l['nb']), None,
        round((l['lat']-24)*1e5), round((l['lng']+125)*1e5), kindI(l['kind']), l['units'],
        l['price'], l['sqft'], l['lot'], l['year'], l['apn'], clsI(l['classdef']), srcI(l['src']),
        (zonI(l['zoning']) if l['zoning'] else None), (1 if l.get('cv') else 0),
        l.get('beds'), l.get('baths'), l.get('stories'), l.get('sale'),
        (round(l['campKm']*10) if l.get('campKm') is not None else None),
        (round(l['projKm']*10) if l.get('projKm') is not None else None),
        (int(l['saleDate'].replace('-','')) if l.get('saleDate') else None),
        (1 if l.get('saleUndated') else 0),
        (pcoI(l['projCo']) if l.get('projCo') else None), l.get('projJobs'),
        (cnmI(l['campName']) if l.get('campName') else None), l.get('campEnroll')])
D=dict(city=cityV, county=COUNTY, nb=nbV, kind=kindV, cls=clsV, src=srcV, zoning=zonV, pco=pcoV, cnm=cnmV)
j=lambda o: json.dumps(o, separators=(',',':'))
decoder='''var _n=0;
var listings=R.map(function(r){_n++;var t=String(_n);while(t.length<6)t="0"+t;var o={id:"UC"+t,addr:r[0],city:D.city[r[1]],zip:r[2]==null?"":String(r[2]).padStart(5,"0"),county:D.county[r[3]],nb:r[4]==null?null:D.nb[r[4]],anb:null,lat:+((24+r[6]/1e5).toFixed(5)),lng:+((r[7]/1e5-125).toFixed(5)),kind:D.kind[r[8]],units:r[9],beds:r[19]==null?null:r[19],baths:r[20]==null?null:r[20],rooms:null,sqft:r[11],lot:r[12],year:r[13],stories:r[21]==null?null:r[21],price:r[10],priceDate:null,land:null,imp:null,zoning:r[17]==null?null:D.zoning[r[17]],apn:r[14],classdef:D.cls[r[15]],src:D.src[r[16]],tour:null,cv:r[18]?1:0,sale:r[22],campKm:r[23]==null?null:r[23]/10,projKm:r[24]==null?null:r[24]/10,saleDate:r[25]==null?null:(String(r[25]).slice(0,4)+"-"+String(r[25]).slice(4,6)+"-"+String(r[25]).slice(6,8)),saleUndated:r[26]?1:0,projCo:r[27]==null?null:D.pco[r[27]],projJobs:r[28],campName:r[29]==null?null:D.cnm[r[29]],campEnroll:r[30]};return o;});
R=null;D=null;
return {listings:listings,market:M,geo:G,panos:{},built:B,region:REGION};'''
s=('window.BA=(function(){"use strict";var D='+j(D)+';var R='+j(rows)+';var M='+j(market)
   +';var G='+j(geo)+';var REGION='+j(region)+';var B="2026-09-04-USCORRIDOR-15";\n'+decoder+'\n})();')
open(R+'raw/data_uscorridor.js','w').write(s)
print('raw bytes', len(s))
import sys; sys.path.insert(0,R)
from compress_data import compress
r=compress(R+'raw/data_uscorridor.js', R+'data_uscorridor.js')
print('data_uscorridor.js', round(r['before']/1e6,2),'->',round(r['after']/1e6,2),'MB', r['literals'])
