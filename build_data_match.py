"""Locator X Match Fifty — 50,000 additional Bay records screened into the high-match band.
Recent recorded sales (2024+ documents / 2023+ SF sales) = highest evidence basis, plus
South Bay leftovers; pre-scored on basis gap, yield proxy and recency; top 50,000 kept."""
import os
import json, re
from shapely.geometry import shape, Point
from shapely.strtree import STRtree
R = os.path.dirname(os.path.abspath(__file__)) + os.sep

# ---- market lookup (zhvi/zori by zip) ----
zil=json.load(open(R+'zillow.json'))
zhvi={}; zori={}
for row in zil['zipVal'][1:]:
    vals=[v for v in row[-25:] if isinstance(v,(int,float))]
    if vals: zhvi[row[2]]=vals[-1]
for row in zil.get('zipRent',[[]])[1:]:
    vals=[v for v in row[-25:] if isinstance(v,(int,float))]
    if vals: zori[row[2]]=vals[-1]
print('zhvi zips',len(zhvi),'zori zips',len(zori))

# ---- existing holdings to dedupe against ----
have=set()
for l in json.load(open(R+'listings.json')):
    if l.get('apn'): have.add(l['apn']); have.add(str(l['apn']).replace('/',''))
for r in json.load(open(R+'al_mf24.json')): have.add(r[0])
for r in json.load(open(R+'sf_mf24.json')): have.add(r[1]); have.add(r[1].replace('/',''))
for r in json.load(open(R+'al_target.json')): have.add(r[0])
for r in json.load(open(R+'sf_target.json')): have.add(r[1])
src=open(R+'data_atlas_bay.js').read()
Rrows=json.loads(src[src.find(';var R=')+7:src.find(';var M=')])
for r in Rrows:
    if r[11]: have.add(str(r[11]))
print('have',len(have))

def title(sx):
    return ' '.join(w.capitalize() if not re.match(r'^\d+(ST|ND|RD|TH)$',w) else w.lower() for w in str(sx).split())
STYPE={'ST':'St','AV':'Ave','AVE':'Ave','BL':'Blvd','DR':'Dr','CT':'Ct','RD':'Rd','LN':'Ln','PL':'Pl','WY':'Way','TER':'Ter','CIR':'Cir','HY':'Hwy'}
def al_addr(raw, city, zipc):
    s2=re.sub(r'\s+'+re.escape(str(city))+r'\s+'+re.escape(str(zipc))+r'$','',str(raw).strip())
    parts=s2.split()
    return ' '.join([parts[0]]+[STYPE.get(p, title(p)) for p in parts[1:]]) if parts else s2
def sf_addr(raw):
    m=re.match(r'^(\d{4})\s+(\d{4})([A-Z]?)\s*(.+?)\s+([A-Z]{2,4})(\d{4})([A-Z]?)$', str(raw).strip())
    if not m: return title(str(raw).strip())
    to,frm,nsfx,name,st,unit,usfx=m.groups()
    frm=str(int(frm))+nsfx; to=str(int(to))
    num=frm if to=='0' or to==frm else frm+'-'+to
    name=re.sub(r'^0+(\d)',r'\1',name)
    return (num+' '+title(name)+' '+STYPE.get(st,st.title())).replace('  ',' ')

zg=json.load(open(R+'geo/bay_zips_raw.json'))
geoms=[shape(f['geometry']) for f in zg['features']]; names=[f['properties']['zip'] for f in zg['features']]
tree=STRtree(geoms)
def zip_of(lng,lat):
    p=Point(lng,lat)
    for i in tree.query(p):
        if geoms[i].contains(p): return names[i]
    return None

def prescore(price, zipc, dstr):
    zv=zhvi.get(zipc); zr=zori.get(zipc)
    if not zv or not price: return None
    gap=max(0,min(1,(zv-price)/zv))
    y=(zr*12/price) if zr else 0.03
    rec=1.0 if (dstr or '')>='2025-01-01' else 0.85 if (dstr or '')>='2024-01-01' else 0.7
    return 0.4*gap + 0.3*min(1,y/0.08) + 0.3*rec

cand=[]
# SF SRES recent sales
for r in json.load(open(R+'sf_sres_recent.json')):
    loc,apn,units,beds,baths,year,sqft,lot,imp,land,d,zoning,lng,lat=r
    if lng is None or apn in have: continue
    price=int(imp+land)
    if price<50000: continue
    zipc=zip_of(lng,lat) or ''
    ps=prescore(price,zipc,d)
    if ps is None: continue
    cand.append((ps, dict(addr=sf_addr(loc), city='San Francisco', zip=zipc, county='San Francisco', lat=lat, lng=lng,
        kind='Single-family', units=1, price=price, priceDate=d or None, sqft=int(sqft) if sqft else None, apn=apn, cv=None, est=None,
        src='SF Assessor secured roll, closed roll 2025 — recorded sale basis (sale date shown).')))
# AL residential recent documents
ALK={'1200':'SFR + second unit','1201':'SFR + junior ADU'}
for r in json.load(open(R+'al_res_recent.json')):
    apn,raw,city,zipc,land,imps,hoex,use,d,lng,lat=r
    if lng is None or apn in have: continue
    price=int((land or 0)+(imps or 0))
    if price<50000: continue
    city=str(city or '').strip() or 'Alameda County'
    zipc=str(zipc or '').strip()
    ps=prescore(price,zipc,d)
    if ps is None: continue
    cand.append((ps, dict(addr=al_addr(raw,city,zipc) if raw else '(no situs address on roll)', city=title(city), zip=zipc, county='Alameda', lat=lat, lng=lng,
        kind=ALK.get(use,'Single-family'), units=1, price=price, priceDate=d, sqft=None, apn=apn, cv=None, est=None,
        src='Alameda County Assessor parcels, roll 2025 — recent recorded document; assessed basis reflects the recent transaction.')))
# AL 2023 document window
for r in json.load(open(R+'al_res_2023.json')):
    apn,raw,city,zipc,land,imps,hoex,use,d,lng,lat=r
    if lng is None or apn in have: continue
    price=int((land or 0)+(imps or 0))
    if price<50000: continue
    city=str(city or '').strip() or 'Alameda County'
    zipc=str(zipc or '').strip()
    ps=prescore(price,zipc,d)
    if ps is None: continue
    cand.append((ps, dict(addr=al_addr(raw,city,zipc) if raw else '(no situs address on roll)', city=title(city), zip=zipc, county='Alameda', lat=lat, lng=lng,
        kind=ALK.get(use,'Single-family'), units=1, price=price, priceDate=d, sqft=None, apn=apn, cv=None, est=None,
        src='Alameda County Assessor parcels, roll 2025 — recent recorded document; assessed basis reflects the recent transaction.')))
print('candidates', len(cand))
# SCC leftovers to fill to 50k
SCC_CITIES=['LOS ALTOS HILLS','MONTE SERENO','MOUNTAIN VIEW','MORGAN HILL','SANTA CLARA','LOS GATOS','LOS ALTOS','SAN MARTIN','PALO ALTO','SUNNYVALE','CUPERTINO','SAN JOSE','CAMPBELL','SARATOGA','MILPITAS','STANFORD','GILROY','ALVISO']
def parse_scc(addr):
    if ' CA ' not in addr: return None,None,None
    left,right=addr.rsplit(' CA ',1)
    zipc=right.strip()[:5]
    for c in SCC_CITIES:
        if left.endswith(' '+c): return left[:-len(c)-1].strip(), c, zipc
    return None,None,None
for r in json.load(open(R+'scc_pool.json')):
    apn,addr2,year,lot,doc2,lng,lat=r
    if str(apn) in have or apn in have: continue
    street,city,zipc=parse_scc(addr2)
    if not street or zipc not in zhvi: continue
    price=int(zhvi[zipc])
    ps=prescore(price,zipc,None)
    if ps is None: continue
    cand.append((ps*0.9, dict(addr=title(street), city=title(city), zip=zipc, county='Santa Clara', lat=lat, lng=lng,
        kind='Residential parcel', units=1, price=price, priceDate=None, sqft=None, apn=str(apn), cv=None, est=1,
        src='Santa Clara County parcel GIS. VALUE IS AN ESTIMATE: ZIP-level Zillow ZHVI.')))
# SMC leftovers
for r in json.load(open(R+'smc_pool.json')):
    apn,addr2,city,area,lng,lat=r
    if apn in have or str(apn) in have: continue
    street=str(addr2).split(',')[0].strip()
    if not street: continue
    zipc=zip_of(lng,lat)
    if not zipc or zipc not in zhvi: continue
    price=int(zhvi[zipc])
    ps=prescore(price,zipc,None)
    if ps is None: continue
    cand.append((ps*0.9, dict(addr=title(street), city=title(city), zip=zipc, county='San Mateo', lat=lat, lng=lng,
        kind='Residential parcel', units=1, price=price, priceDate=None, sqft=None, apn=str(apn), cv=None, est=1,
        src='San Mateo County active parcels GIS. VALUE IS AN ESTIMATE: ZIP-level Zillow ZHVI.')))
print('with scc fill', len(cand))
cand.sort(key=lambda x:-x[0])
L=[c[1] for c in cand[:50000]]
print('kept', len(L), 'cut at prescore', round(cand[min(49999,len(cand)-1)][0],3), 'top', round(cand[0][0],3))

# market + geo reuse (from deep data.js)
dsrc=open(R+('raw/data.js' if __import__('os').path.exists(R+'raw/data.js') else 'data.js')).read()
market=json.loads(dsrc[dsrc.find('var M=')+6:dsrc.find(';var G=')])
geo=json.loads(dsrc[dsrc.find('var G=')+6:dsrc.find(';var P=')])
geo=dict(counties=geo['counties'], zips=geo['zips'], roads=geo['roads'], urban=geo['urban'], rail={'type':'FeatureCollection','features':[]}, parks=geo['parks'], rivers=geo['rivers'], nbsf={'type':'FeatureCollection','features':[]}, nboak={'type':'FeatureCollection','features':[]}, nbala={'type':'FeatureCollection','features':[]})
import importlib.util
spec=importlib.util.spec_from_file_location('bda', R+'build_data_atlas.py')
# reuse emit by exec of just the helpers: simpler to inline emit here
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
var listings=R.map(function(r){_n++;var f=r[13];var o={id:"AT"+String(_n).padStart(6,"0"),addr:r[0],city:D.city[r[1]],zip:r[2]==null?"":String(r[2]),county:D.county[r[3]],nb:null,anb:null,lat:+((LAT0+r[4]/1e5).toFixed(5)),lng:+((LNG0+r[5]/1e5).toFixed(5)),kind:D.kind[r[6]],units:r[7],beds:null,baths:null,rooms:null,sqft:r[10],lot:null,year:null,stories:null,price:r[8],priceDate:r[9]==null?null:new Date(E+r[9]*86400000).toISOString().slice(0,10),land:null,imp:null,zoning:null,apn:r[11],classdef:"Match Fifty record — screened into the high-match band on recent recorded basis, yield and basis gap.",src:D.src[r[12]],tour:null};if(f&1)o.cv=1;if(f&2)o.est=1;return o;});
return {listings:listings,market:M,geo:G,panos:{},built:B,region:null};'''
    s=('window.BA=(function(){"use strict";var D='+j(D)+';var R='+j(rows)+';var M='+j(market)+';var G='+j(geo)
       +';var LAT0='+str(lat0)+';var LNG0='+str(lng0)+';var B="'+built+'";\n'+dec+'\n})();')
    open(out,'w').write(s)
    print(out, len(s), 'rows', len(rows))
COUNTY=['San Francisco','Alameda','Santa Clara','San Mateo']
emit(L, market, geo, COUNTY, R+'data_match.js', '2026-09-02-MATCH50', 36.0, -123.0)
