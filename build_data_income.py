"""Locator X Income Fifty — 50,000 income-property records (multifamily, apartments,
hotels/motels, commercial multi-purpose, condos) from the Contra Costa County
assessment roll, classified by the county's own use-code descriptions."""
import os
import json
R = os.path.dirname(os.path.abspath(__file__)) + os.sep
KIND={13:('Multi-residence parcel (2+ homes)',2,1),21:('Duplex (2 units)',2,1),22:('Triplex (3 units)',3,1),23:('Fourplex (4 units)',4,1),
 24:('Combination multi-unit',3,1),25:('Apartments (5–12 units)',8,1),26:('Apartments (13–24 units)',18,1),27:('Apartments (25–59 units)',40,1),
 28:('Apartments (60+ units)',75,1),29:('Condominium (incl. commercial/industrial condos)',1,0),31:('Commercial — stores',1,1),
 33:('Commercial — office',1,1),34:('Medical–dental building',1,1),35:('Service station / car wash',1,1),36:('Auto repair',1,1),
 42:('Shopping center',1,1),44:('Hotel / motel / MH park',20,1),46:('Drive-in restaurant',1,1),47:('Restaurant',1,1),
 48:('Multiple & commercial — mixed use',2,1),49:('Auto agency',1,1),51:('Industrial park',1,1),53:('Light industrial',1,1),
 54:('Heavy industrial',1,1),55:('Mini-warehouse / storage',1,1),85:('Parking',1,1)}
zil=json.load(open(R+'zillow.json'))
zhvi={}; zori={}
for row in zil['zipVal'][1:]:
    vals=[v for v in row[7:] if isinstance(v,(int,float))]
    if vals: zhvi[row[2]]=vals[-1]
for row in zil['zipRent'][1:]:
    vals=[v for v in row[7:] if isinstance(v,(int,float))]
    if vals: zori[row[2]]=vals[-1]
def title(sx):
    return ' '.join(w.capitalize() for w in str(sx).split())
def prescore(price, zipc, dstr, mult):
    zv=zhvi.get(zipc); zr=zori.get(zipc)
    if not zv or not price: return None
    base=zv*max(1,mult*0.62)
    gap=max(0,min(1,(base-price)/base))
    y=((zr or 2200)*12*max(1,mult*0.85)/price)
    rec=1.0 if (dstr or '')>='2024' else 0.85 if (dstr or '')>='2022' else 0.7
    return 0.4*gap + 0.3*min(1,y/0.09) + 0.3*rec
L=[]
for r in json.load(open(R+'ccc_income.json')):
    apn,addr,city,zipc,use,land,imp,yr,sqft,acre,deed,lng,lat=r
    if lng is None: continue
    k=KIND.get(use)
    if not k: continue
    kind,units,cv=k
    price=int((land or 0)+(imp or 0))
    if price<20000: continue
    zipc=str(zipc) if zipc else ''
    d=None
    if deed and len(str(deed))==8:
        s=str(deed)
        try:
            mo=int(s[4:6]); dy=int(s[6:])
            if 1<=mo<=12 and 1<=dy<=31 and '1900'<=s[:4]<='2026':
                import calendar
                dy=min(dy, calendar.monthrange(int(s[:4]),mo)[1])
                d=f"{s[:4]}-{mo:02d}-{dy:02d}"
        except Exception: d=None
    a2=title(addr.replace(' - '+city,'').replace(' -','').strip()) if addr else '(no situs address on roll)'
    ps=prescore(price,zipc,d,units)
    if ps is None: ps=0.25
    L.append((ps, dict(addr=a2, city=title(city) if city else 'Contra Costa County', zip=zipc, county='Contra Costa', lat=lat, lng=lng,
        kind=kind, units=units, price=price, priceDate=d, sqft=int(sqft) if sqft else None, apn=str(apn), cv=cv or None, est=None,
        src='Contra Costa County assessment parcels — Prop 13 assessed basis (may be far below market); use class per county description.')))
L.sort(key=lambda x:-x[0])
keep=[x[1] for x in L[:50000]]
from collections import Counter
print('candidates',len(L),'kept',len(keep))
print(Counter(x['kind'] for x in keep).most_common(10))
# market: extend M with CCC zips
src=open(R+('raw/data.js' if __import__('os').path.exists(R+'raw/data.js') else 'data.js')).read()
market=json.loads(src[src.find('var M=')+6:src.find(';var G=')])
rentBy={}
for row in zil['zipRent'][1:]:
    rentBy[row[2]]=[v if isinstance(v,(int,float)) else None for v in row[7:]]
added=0
for row in zil['zipVal'][1:]:
    z=row[2]
    if row[6]=='Contra Costa County' and z not in market['zips']:
        market['zips'][z]={'v':[v if isinstance(v,(int,float)) else None for v in row[7:]], 'r':rentBy.get(z), 'county':'Contra Costa', 'city':row[4]}
        added+=1
print('M zips added', added)
# geo: counties + CCC boundary
geo=json.loads(src[src.find('var G=')+6:src.find(';var P=')])
ccb=json.load(open(R+'geo/ccc_boundary.json'))
geo['counties']['features'].append(ccb)
geo=dict(counties=geo['counties'], zips=geo['zips'], roads=geo['roads'], urban=geo['urban'], rail={'type':'FeatureCollection','features':[]}, parks=geo['parks'], rivers=geo['rivers'], nbsf={'type':'FeatureCollection','features':[]}, nboak={'type':'FeatureCollection','features':[]}, nbala={'type':'FeatureCollection','features':[]})
def dic():
    vals=[]; idx={}
    def get(v):
        if v not in idx: idx[v]=len(vals); vals.append(v)
        return idx[v]
    return vals,get
def emit(listings, market, geo, county_list, out, built, lat0, lng0):
    cityV,cityI=dic(); kindV,kindI=dic(); srcV,srcI=dic()
    rows=[]
    from datetime import date as _date
    EPOCH=_date(2020,1,1)
    for l in listings:
        d=l.get('priceDate'); pd=None if not d else (_date(int(d[:4]),int(d[5:7]),int(d[8:10]))-EPOCH).days
        rows.append([l['addr'], cityI(l['city']), (int(l['zip']) if l.get('zip') else None), county_list.index(l['county']),
            round((l['lat']-lat0)*1e5), round((l['lng']-lng0)*1e5), kindI(l['kind']), l.get('units') or 1,
            l['price'], pd, l.get('sqft'), l['apn'], srcI(l['src']), (1 if l.get('cv') else 0)+(2 if l.get('est') else 0)])
    D=dict(city=cityV, county=county_list, kind=kindV, src=srcV)
    j=lambda o: json.dumps(o, separators=(',',':'))
    dec='''var E=Date.UTC(2020,0,1);
var _n=0;
var listings=R.map(function(r){_n++;var f=r[13];var o={id:"AT"+String(_n).padStart(6,"0"),addr:r[0],city:D.city[r[1]],zip:r[2]==null?"":String(r[2]),county:D.county[r[3]],nb:null,anb:null,lat:+((LAT0+r[4]/1e5).toFixed(5)),lng:+((LNG0+r[5]/1e5).toFixed(5)),kind:D.kind[r[6]],units:r[7],beds:null,baths:null,rooms:null,sqft:r[10],lot:null,year:null,stories:null,price:r[8],priceDate:r[9]==null?null:new Date(E+r[9]*86400000).toISOString().slice(0,10),land:null,imp:null,zoning:null,apn:r[11],classdef:"Income Fifty record — income-property class per Contra Costa County use-code description; apartment unit counts are the class midpoint.",src:D.src[r[12]],tour:null};if(f&1)o.cv=1;if(f&2)o.est=1;return o;});
return {listings:listings,market:M,geo:G,panos:{},built:B,region:null};'''
    s=('window.BA=(function(){"use strict";var D='+j(D)+';var R='+j(rows)+';var M='+j(market)+';var G='+j(geo)
       +';var LAT0='+str(lat0)+';var LNG0='+str(lng0)+';var B="'+built+'";\n'+dec+'\n})();')
    open(out,'w').write(s)
    print(out, len(s), 'rows', len(rows))
COUNTY=['San Francisco','Alameda','Santa Clara','San Mateo','Contra Costa']
emit(keep, market, geo, COUNTY, R+'data_income.js', '2026-09-02-INCOME50', 36.0, -123.0)
