"""Locator X Atlas builders — full-market slim editions for Bay and New Orleans.
Slim rows (14 cells) so ~110-130k records fit a single hosted page."""
import os
import json, re, math, sys
from shapely.geometry import shape, Point
from shapely.strtree import STRtree

R = os.path.dirname(os.path.abspath(__file__)) + os.sep
region=sys.argv[1] if len(sys.argv)>1 else 'bay'

def dic():
    vals=[]; idx={}
    def get(v):
        if v not in idx: idx[v]=len(vals); vals.append(v)
        return idx[v]
    return vals,get

def emit(listings, market, geo, regionObj, county_list, out, built, lat0, lng0):
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
var listings=R.map(function(r){_n++;var f=r[13];var o={id:"AT"+String(_n).padStart(6,"0"),addr:r[0],city:D.city[r[1]],zip:r[2]==null?"":String(r[2]),county:D.county[r[3]],nb:null,anb:null,lat:+((LAT0+r[4]/1e5).toFixed(5)),lng:+((LNG0+r[5]/1e5).toFixed(5)),kind:D.kind[r[6]],units:r[7],beds:null,baths:null,rooms:null,sqft:r[10],lot:null,year:null,stories:null,price:r[8],priceDate:r[9]==null?null:new Date(E+r[9]*86400000).toISOString().slice(0,10),land:null,imp:null,zoning:null,apn:r[11],classdef:"Atlas record — see the deep edition for full detail",src:D.src[r[12]],tour:null};if(f&1)o.cv=1;if(f&2)o.est=1;return o;});
return {listings:listings,market:M,geo:G,panos:{},built:B,region:REGION};'''
    s=('window.BA=(function(){"use strict";var D='+j(D)+';var R='+j(rows)+';var M='+j(market)+';var G='+j(geo)
       +';var REGION='+j(regionObj)+';var LAT0='+str(lat0)+';var LNG0='+str(lng0)+';var B="'+built+'";\n'+dec+'\n})();')
    open(out,'w').write(s)
    print(out, len(s), 'rows', len(rows))

if region=='bay':
    # base: everything already in the deep app
    base=json.load(open(R+'listings.json'))
    have=set(l['apn'] for l in base if l.get('apn'))
    L=[]
    for l in base:
        L.append(dict(addr=l['addr'], city=l['city'], zip=l.get('zip'), county=l['county'], lat=l['lat'], lng=l['lng'],
            kind=l['kind'], units=l.get('units'), price=l['price'], priceDate=l.get('priceDate'), sqft=l.get('sqft'),
            apn=l.get('apn') or '', cv=l.get('cv'), est=l.get('est'),
            src='In the deep Locator X Bay edition — full record there.'))
    # new multifamily backbone
    def title(sx):
        return ' '.join(w.capitalize() if not re.match(r'^\d+(ST|ND|RD|TH)$',w) else w.lower() for w in str(sx).split())
    STYPE={'ST':'St','AV':'Ave','AVE':'Ave','BL':'Blvd','DR':'Dr','CT':'Ct','RD':'Rd','LN':'Ln','PL':'Pl','WY':'Way','TER':'Ter','CIR':'Cir','HY':'Hwy'}
    def al_addr(raw, city, zipc):
        s2=re.sub(r'\s+'+re.escape(city)+r'\s+'+re.escape(zipc)+r'$','',str(raw).strip())
        parts=s2.split()
        return ' '.join([parts[0]]+[STYPE.get(p, title(p)) for p in parts[1:]]) if parts else s2
    U24={'21':'Duplex (2 units)','22':'Duplex (2 units)','23':'Triplex (3 units)','24':'Fourplex (4 units)'}
    for r in json.load(open(R+'al_mf24.json')):
        apn,raw,city,zipc,land,imps,hoex,use,d,lng,lat,area=r
        if apn in have: continue
        have.add(apn)
        L.append(dict(addr=al_addr(raw,city,zipc), city=title(city), zip=zipc, county='Alameda', lat=lat, lng=lng,
            kind=U24.get(use[:2],'2-4 units'), units=int(use[1]) if use[1].isdigit() else 2, price=int(land+imps), priceDate=d, sqft=None, apn=apn, cv=None, est=None,
            src='Alameda County Assessor parcels, roll 2025 — Prop 13 assessed basis (may be far below market).'))
    def sf_addr(raw):
        m=re.match(r'^(\d{4})\s+(\d{4})([A-Z]?)\s*(.+?)\s+([A-Z]{2,4})(\d{4})([A-Z]?)$', str(raw).strip())
        if not m: return title(str(raw).strip())
        to,frm,nsfx,name,st,unit,usfx=m.groups()
        frm=str(int(frm))+nsfx; to=str(int(to))
        num=frm if to=='0' or to==frm else frm+'-'+to
        name=re.sub(r'^0+(\d)',r'\1',name)
        return (num+' '+title(name)+' '+STYPE.get(st,st.title())).replace('  ',' ')
    # zip lookup for SF
    zg=json.load(open(R+'geo/bay_zips_raw.json'))
    geoms=[shape(f['geometry']) for f in zg['features']]; names=[f['properties']['zip'] for f in zg['features']]
    tree=STRtree(geoms)
    def zip_of(lng,lat):
        p=Point(lng,lat)
        for i in tree.query(p):
            if geoms[i].contains(p): return names[i]
        return None
    for r in json.load(open(R+'sf_mf24.json')):
        raw,apn,units,year,sqft,lot,d,imp,land,lng,lat=r
        if apn in have: continue
        have.add(apn)
        L.append(dict(addr=sf_addr(raw), city='San Francisco', zip=zip_of(lng,lat) or '', county='San Francisco', lat=lat, lng=lng,
            kind=str(units)+' units', units=units, price=int(imp+land), priceDate=(d or None), sqft=int(sqft) if sqft else None, apn=apn, cv=None, est=None,
            src='SF Assessor secured roll, closed roll 2025 — Prop 13 assessed basis (may be far below market).'))
    # target-class expansion: SF commercial/hotel/industrial/5+unit roll (2026-09 pull)
    SFK={'COMH':'Hotel','COMR':'Commercial — retail','COMM':'Commercial — misc','COMO':'Commercial — office','IND':'Industrial / flex'}
    for r in json.load(open(R+'sf_target.json')):
        loc,apn,use,units,year,sqft,lot,imp,land,zoning,stories,lng,lat=r
        if lng is None: continue
        k=apn.replace('/','')
        if k in have or apn in have: continue
        have.add(k); have.add(apn)
        units=int(units) if units else None
        kind=SFK.get(use, (str(units)+' units') if units and units>=2 else 'Commercial — misc')
        price=int(imp+land)
        if price<1000: continue
        L.append(dict(addr=sf_addr(loc), city='San Francisco', zip=zip_of(lng,lat) or '', county='San Francisco', lat=lat, lng=lng,
            kind=kind, units=units or 1, price=price, priceDate=None, sqft=int(sqft) if sqft else None, apn=apn, cv=1, est=None,
            src='SF Assessor secured roll, closed roll 2025 — Prop 13 assessed basis (may be far below market).'))
    # target-class expansion: Alameda industrial/office/parking/residential-income classes (verified acgov use codes)
    ALK={'4000':'Vacant industrial land','4100':'Warehouse','4101':'Industrial condo','4102':'Self-storage warehouse','4103':'Cold-storage warehouse',
         '4200':'Light industrial','4201':'Industrial flex / R&D','4202':'Data center','4205':'Advanced-tech manufacturing','4300':'Heavy industrial',
         '4400':'Industrial — misc','4800':'Trucking terminal / distribution','7000':'Vacant apartment land (5+ capable)','7040':'Vacant apartment land (5+ capable)',
         '7100':'5+ homes on one parcel','7200':'Converted 5+ units','7400':'Co-op housing','7430':'Co-op housing','7500':'Restricted income housing',
         '7600':'Fraternity / sorority house','7800':'Residential high-rise','7900':'Church home','8000':'Car wash','8100':'Repair garage','8200':'Auto dealership',
         '8300':'Parking lot','8400':'Parking garage','8500':'Service station','8600':'Funeral home','8700':'Nursing / custodial care','8800':'Hospital',
         '8801':'Medical clinic','8802':'Skilled nursing facility','9200':'Bank','9300':'Medical–dental building','9301':'Medical–dental building',
         '9400':'Office (1–5 story)','9401':'Office condo','9405':'Office condo','9500':'Office high-rise'}
    for r in json.load(open(R+'al_target.json')):
        apn,raw,city,zipc,land,imps,hoex,use,d,lng,lat=r
        if lng is None or apn in have: continue
        have.add(apn)
        price=int((land or 0)+(imps or 0))
        if price<1000: continue
        city=str(city or '').strip() or 'Alameda County'
        zipc=str(zipc or '').strip()
        L.append(dict(addr=al_addr(raw,city,zipc) if raw else '(no situs address on roll)', city=title(city), zip=zipc, county='Alameda', lat=lat, lng=lng,
            kind=ALK.get(use,'Commercial — recreation/other'), units=1, price=price, priceDate=d, sqft=None, apn=apn, cv=1, est=None,
            src='Alameda County Assessor parcels, roll 2025 — Prop 13 assessed basis (may be far below market).'))
    # leftovers from prior pools (South Bay parcels not shipped in the deep app)
    SCC_CITIES=['LOS ALTOS HILLS','MONTE SERENO','MOUNTAIN VIEW','MORGAN HILL','SANTA CLARA','LOS GATOS','LOS ALTOS','SAN MARTIN','PALO ALTO','SUNNYVALE','CUPERTINO','SAN JOSE','CAMPBELL','SARATOGA','MILPITAS','STANFORD','GILROY','ALVISO']
    def parse_scc(addr):
        if ' CA ' not in addr: return None,None,None
        left,right=addr.rsplit(' CA ',1)
        zipc=right.strip()[:5]
        for c in SCC_CITIES:
            if left.endswith(' '+c): return left[:-len(c)-1].strip(), c, zipc
        return None,None,None
    zil=json.load(open(R+'zillow.json'))
    zhvi={}
    for row in zil['zipVal'][1:]:
        vals=[v for v in row[-25:] if isinstance(v,(int,float))]
        if vals: zhvi[row[2]]=vals[-1]
    # target-class expansion: Santa Clara large buildings (GIS footprints joined to parcels)
    import math as _math
    _pool=json.load(open(R+'scc_pool.json'))
    _used_deep=set(str(x[0]) for x in json.load(open(R+'scc_conv_join.json')))
    _cell=0.0008; _gidx={}
    for _r in _pool:
        _gidx.setdefault((int(_r[5]/_cell),int(_r[6]/_cell)),[]).append(_r)
    def _near(lng,lat,rad=60):
        k=(int(lng/_cell),int(lat/_cell)); best=None; bd=1e9
        for dx in(-1,0,1):
            for dy in(-1,0,1):
                for _r in _gidx.get((k[0]+dx,k[1]+dy),[]):
                    d=_math.hypot((_r[5]-lng)*88000,(_r[6]-lat)*111000)
                    if d<bd: bd=d; best=_r
        return best if bd<=rad else None
    for f in json.load(open(R+'scc_bigbld.json')):
        blng,blat,area,hgt=f
        if area<3000: continue
        p=_near(blng,blat)
        if not p: continue
        apn,addr2,year,lot2,doc2,plng,plat=p
        if str(apn) in _used_deep or apn in have: continue
        street,city,zipc=parse_scc(addr2)
        if not street or zipc not in zhvi: continue
        have.add(apn)
        floors=max(1,round((hgt or 11)/11))
        sqft=int(area*floors)
        units=max(3,round(sqft*0.78/1000))
        L.append(dict(addr=title(street), city=title(city), zip=zipc, county='Santa Clara', lat=plat, lng=plng,
            kind='Large building', units=units, price=int(zhvi[zipc]*max(2,units*0.35)), priceDate=None, sqft=sqft, apn=str(apn), cv=1, est=1,
            src='Santa Clara County parcel GIS + building footprints. VALUE IS AN ESTIMATE scaled from ZIP-level Zillow ZHVI — county publishes no assessed values.'))
    CAP=161000
    for r in json.load(open(R+'scc_pool.json')):
        if len(L)>=CAP: break
        apn,addr,year,lot,doc2,lng,lat=r
        if apn in have: continue
        street,city,zipc=parse_scc(addr)
        if not street or zipc not in zhvi: continue
        have.add(apn)
        L.append(dict(addr=title(street), city=title(city), zip=zipc, county='Santa Clara', lat=lat, lng=lng,
            kind='Residential parcel', units=1, price=int(zhvi[zipc]), priceDate=None, sqft=None, apn=apn, cv=None, est=1,
            src='Santa Clara County parcel GIS. VALUE IS AN ESTIMATE: ZIP-level Zillow ZHVI.'))
    for r in json.load(open(R+'smc_pool.json')):
        if len(L)>=CAP: break
        apn,addr,city,area,lng,lat=r
        if apn in have: continue
        street=str(addr).split(',')[0].strip()
        if not street: continue
        zipc=zip_of(lng,lat)
        if not zipc or zipc not in zhvi: continue
        have.add(apn)
        L.append(dict(addr=title(street), city=title(city), zip=zipc, county='San Mateo', lat=lat, lng=lng,
            kind='Residential parcel', units=1, price=int(zhvi[zipc]), priceDate=None, sqft=None, apn=apn, cv=None, est=1,
            src='San Mateo County active parcels GIS. VALUE IS AN ESTIMATE: ZIP-level Zillow ZHVI.'))
    # market + geo (reuse from deep data by extracting)
    import subprocess
    exec_env={}
    src=open(R+('raw/data.js' if __import__('os').path.exists(R+'raw/data.js') else 'data.js')).read()
    iM=src.find('var M='); iG=src.find('var G='); iS=src.find('var S=')
    market=json.loads(src[iM+6:src.find(';var G=')])
    geo=json.loads(src[iG+6:src.find(';var P=')])
    geo=dict(counties=geo['counties'], zips=geo['zips'], roads=geo['roads'], urban=geo['urban'], rail={'type':'FeatureCollection','features':[]}, parks=geo['parks'], rivers=geo['rivers'], nbsf={'type':'FeatureCollection','features':[]}, nboak={'type':'FeatureCollection','features':[]}, nbala={'type':'FeatureCollection','features':[]})
    COUNTY=['San Francisco','Alameda','Santa Clara','San Mateo']
    emit(L, market, geo, None and {}, COUNTY, R+'data_atlas_bay.js', '2026-09-02-ATLAS', 36.0, -123.0)
else:
    np_=json.load(open(R+'nola_parcels4.json'))
    bf=json.load(open(R+'nola_bigfoot.json'))
    bf2=json.load(open(R+'nola_bigfoot2.json'))
    z=json.load(open(R+'zillow_nola.json'))
    zhvi={}; zori={}
    for row in z['zipVal'][1:]:
        vals=[v for v in row[-25:] if isinstance(v,(int,float))]
        if vals: zhvi[row[2]]=vals[-1]
    la=json.load(open(R+'geo/nola_zips.json'))
    geoms=[shape(f['geometry']) for f in la['features']]; names=[f['properties']['zip'] for f in la['features']]
    tree=STRtree(geoms)
    def zip_of(lng,lat):
        p=Point(lng,lat)
        for i in tree.query(p):
            if geoms[i].contains(p): return names[i]
        return None
    def title(sx):
        return ' '.join(w.capitalize() if not re.match(r'^\d+(ST|ND|RD|TH)$',w) else w.lower() for w in str(sx).split())
    L=[]
    for r in np_:
        geopin,addr,lot,camp,dist,lng,lat=r
        if not addr or len(str(addr))<5: continue
        zipc=zip_of(lng,lat)
        if not zipc or zipc not in zhvi: continue
        big=bf.get(geopin); mid=bf2.get(geopin) if not big else None
        if big:
            sqft=int(big*2); units=max(5,round(sqft*0.78/1000)); kind='Large building'; cv=1
            price=int(zhvi[zipc]*max(2,units*0.35))
        elif mid:
            sqft=int(mid*2); units=max(2,round(sqft*0.8/1100)); kind='Large unit — family conversion'; cv=1
            price=int(zhvi[zipc]*max(1.1,units*0.5))
        else:
            sqft=None; units=1; kind='Residential parcel'; cv=None; price=int(zhvi[zipc])
        L.append(dict(addr=title(addr), city='New Orleans', zip=zipc, county='Orleans', lat=lat, lng=lng,
            kind=kind, units=units, price=price, priceDate=None, sqft=sqft, apn=str(geopin), cv=cv, est=1,
            src='City of New Orleans parcel GIS. VALUE IS AN ESTIMATE scaled from ZIP-level Zillow ZHVI — no assessed values published.'))
    # ---- greater New Orleans: Jefferson Parish multi-unit, lodging and commercial stock ----
    JPK={'1120':('Duplex (2 units)',2,1),'1121':('Duplex (2 units)',2,1),'1122':('Duplex (2 units)',2,1),
         '1130':('Triplex / fourplex',3,1),'1131':('Triplex / fourplex',3,1),'1132':('Triplex / fourplex',4,1),
         '1140':('Multifamily (5+ units)',8,1),'1141':('Multifamily (5+ units)',8,1),'1142':('Multifamily (5+ units)',10,1),
         '1200':('Group quarters / boarding',12,1),'1205':('Group quarters / boarding',12,1),'1210':('Group quarters / boarding',12,1),
         '1230':('Group quarters / boarding',12,1),'1250':('Group quarters / boarding',12,1),
         '1300':('Hotel / motel / lodging',20,1),'1320':('Hotel / motel / lodging',20,1),'1330':('Hotel / motel / lodging',14,1)}
    jp_n=0
    try: jp=json.load(open(R+'jp_income.json'))
    except Exception: jp=[]
    for r in jp:
        num,street,zipc,area,fn,fac,lat,lng=r
        if lat is None or lng is None: continue
        zipc=str(zipc or '').strip()
        if zipc not in zhvi: continue
        fn=str(fn or '')
        if fn in JPK: kind,units,cv=JPK[fn]
        elif fn.startswith('2'): kind,units,cv=('Commercial / mixed-use building',1,1)
        else: continue
        base=zhvi[zipc]
        price=int(base*max(1.0, units*0.55)) if units>1 else int(base*1.4)
        addr=(str(num or '').strip()+' '+title(street or '')).strip()
        if len(addr)<4: continue
        L.append(dict(addr=addr, city=title(area or 'Jefferson Parish'), zip=zipc, county='Jefferson', lat=lat, lng=lng,
            kind=kind, units=units, price=price, priceDate=None, sqft=None, apn='JP-'+zipc+'-'+str(jp_n), cv=cv, est=1,
            src=('Jefferson Parish building-function records (parish GIS)'+(' — '+fac if fac else '')+'. VALUE IS AN ESTIMATE scaled from ZIP-level Zillow ZHVI — the parish publishes no assessed values in this layer.')))
        jp_n+=1
    print('Jefferson Parish records added', jp_n)
    src=open(R+'data_nola.js').read()
    market=json.loads(src[src.find('var M=')+6:src.find(';var G=')])
    geo=json.loads(src[src.find('var G=')+6:src.find(';var P=')])
    region_obj=json.loads(src[src.find('var REGION=')+11:src.find(';var S=')])
    COUNTY=['Orleans','Jefferson']
    emit(L, market, geo, region_obj, COUNTY, R+'data_atlas_nola.js', '2026-09-02-ATLAS-NOLA', 29.0, -91.0)
