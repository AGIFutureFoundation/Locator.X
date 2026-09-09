import json, re, base64, statistics
from shapely.geometry import shape, Point
from collections import defaultdict, Counter

# Repo root from this file's own location, so a clone runs anywhere.
# LOCATOR_X_ROOT overrides it when the data tree sits outside the repo.
R = (os.environ.get('LOCATOR_X_ROOT') or os.path.dirname(os.path.abspath(__file__))).rstrip(os.sep) + os.sep
sf = json.load(open(R+'sf_rows.json'))
al = json.load(open(R+'alameda_rows.json'))
z = json.load(open(R+'zillow.json'))

# ---------- geometry lookups ----------
def load_polys(path, key='name'):
    g = json.load(open(path)); out = []
    for f in g['features']:
        try: out.append((f['properties'][key], shape(f['geometry'])))
        except Exception: pass
    return out
zips = load_polys(R+'geo/bay_zips_raw.json', 'zip')
nb_sf = load_polys(R+'geo/out_nb_sf.json'); nb_oak = load_polys(R+'geo/out_nb_oak.json'); nb_ala = load_polys(R+'geo/out_nb_ala.json')
def pip(polys, lng, lat):
    p = Point(lng, lat)
    for name, geom in polys:
        if geom.contains(p): return name
    return None

# ---------- market data ----------
def rows_to_map(rows, keyidx, nmonths):
    hdr = rows[0]; months = hdr[-nmonths:]; out = {}
    for r in rows[1:]:
        vals = [v if isinstance(v, (int, float)) else None for v in r[-nmonths:]]
        out[r[keyidx]] = vals
    return months, out
mz, zipVal = rows_to_map(z['zipVal'], 2, 61)
_, zipRent = rows_to_map(z['zipRent'], 2, 61)
_, cityVal = rows_to_map(z['city'], 2, 25)
_, cityRent = rows_to_map(z['cityRent'], 2, 25)
mn, nbValAll = rows_to_map(z['nb'], 2, 13)
# neighborhoods keyed by city|name
nbVal = {}
for r in z['nb'][1:]:
    nbVal[r[4] + '|' + r[2]] = [v if isinstance(v, (int, float)) else None for v in r[-13:]]
zipCity = {r[2]: r[4] for r in z['zipVal'][1:]}
zipCounty = {r[2]: r[6] for r in z['zipVal'][1:]}
cityCounty = {r[2]: r[5] for r in z['city'][1:]}

# ---------- helpers ----------
def title(s):
    small = {'OF', 'THE', 'AND', 'DE', 'LA', 'DEL', 'LAS', 'LOS'}
    words = []
    for w in s.split():
        if re.match(r'^\d+(ST|ND|RD|TH)$', w): words.append(w.lower())
        elif w in small: words.append(w.lower())
        else: words.append(w.capitalize())
    return ' '.join(words)
STYPE = {'ST': 'St', 'AV': 'Ave', 'AVE': 'Ave', 'BL': 'Blvd', 'BLVD': 'Blvd', 'DR': 'Dr', 'CT': 'Ct', 'RD': 'Rd', 'LN': 'Ln', 'PL': 'Pl', 'WY': 'Way', 'WAY': 'Way', 'TR': 'Ter', 'TER': 'Ter', 'CR': 'Cir', 'CIR': 'Cir', 'PK': 'Park', 'HY': 'Hwy', 'HW': 'Hwy', 'TE': 'Ter', 'HL': 'Hill', 'SQ': 'Sq', 'PW': 'Pkwy', 'AL': 'Alley', 'PZ': 'Plaza', 'WK': 'Walk', 'RW': 'Row', 'LP': 'Loop', 'CMN': 'Cmn', 'ROW': 'Row'}
def sf_addr(raw):
    m = re.match(r'^(\d{4})\s+(\d{4})([A-Z]?)\s*(.+?)\s+([A-Z]{2,4})(\d{4})([A-Z]?)$', raw.strip())
    if not m: return title(raw.strip()), ''
    to, frm, nsfx, name, st, unit, usfx = m.groups()
    frm = str(int(frm)) + nsfx; to = str(int(to))
    num = frm if to == '0' or to == frm else f"{frm}-{to}"
    name = re.sub(r'^0+(\d)', r'\1', name)
    unit = '' if unit == '0000' and not usfx else ' #' + (unit.lstrip('0') or '') + usfx
    return f"{num} {title(name)} {STYPE.get(st, st.title())}{unit}".replace('  ', ' '), unit
def al_addr(raw, city, zipc):
    s = raw.strip()
    s = re.sub(r'\s+' + re.escape(city) + r'\s+' + re.escape(zipc) + r'$', '', s)
    parts = s.split()
    if parts and parts[-1] in STYPE: parts[-1] = STYPE[parts[-1]]
    else: parts = [title(p) for p in parts]
    return ' '.join([parts[0]] + [title(p) if p not in STYPE.values() else p for p in parts[1:]])

USE_AL = {'11': ('Single-family', 1), '12': ('Single-family + secondary unit', 2), '13': ('Single-family (other)', 1), '14': ('Condominium', 1), '15': ('Condominium', 1), '16': ('Mobile/manufactured', 1), '17': ('Residential (other)', 1), '18': ('Townhouse / PUD', 1), '19': ('Residential (other)', 1), '21': ('Duplex (2 units)', 2), '22': ('Duplex (2 units)', 2), '23': ('Triplex (3 units)', 3), '24': ('Fourplex (4 units)', 4), '25': ('Small apartment (5+ units)', 5), '26': ('Small apartment (5+ units)', 5), '27': ('Apartment (other)', 5), '28': ('Apartment (other)', 5)}

listings = []
# ---------- San Francisco: top 1000 by dashboard criteria from 3,486-sale pool ----------
pool = json.load(open(R+'sf_pool.json'))
zm = {}
zv2 = json.load(open(R+'zillow.json'))
for row in zv2['zipVal'][1:]:
    k=row[2]; vals=[v for v in row[-25:] if isinstance(v,(int,float))]
    if not vals: continue
    v13=row[-13] if isinstance(row[-13],(int,float)) else None
    zm[k]={'v':vals[-1], 'yoy': (vals[-1]/v13-1)*100 if v13 else 0}
for row in zv2['zipRent'][1:]:
    k=row[2]; vals=[v for v in row[-25:] if isinstance(v,(int,float))]
    if k in zm and vals: zm[k]['r']=vals[-1]
from shapely.strtree import STRtree
zip_geoms=[g for _,g in zips]; zip_names=[n for n,_ in zips]
tree=STRtree(zip_geoms)
def zip_of(lng,lat):
    p=Point(lng,lat)
    for i in tree.query(p):
        if zip_geoms[i].contains(p): return zip_names[i]
    return None
def lerp(x,x0,x1):
    t=(x-x0)/(x1-x0); return max(0.0,min(1.0,t))*100
A=dict(down=25,rate=6.4,term=30,vac=5,mgmt=8,maint=5,capex=3,ins=0.35,tax=1.18)
r_m=A['rate']/100/12; n_m=A['term']*12; payk=r_m/(1-(1+r_m)**-n_m)
pool = pool + json.load(open(R+'sf22.json'))
cand=[]
seen=set()
for r in pool:
    apn=r[1]
    if apn in seen: continue
    seen.add(apn)
    lng,lat=r[17],r[18]
    tot=(r[13]+r[14])
    price=tot/1.0404 if r[12]<='2022-12-31' else (tot/1.02 if r[12]<='2023-12-31' else tot)
    if price<250000 or price>6000000: continue
    zipc=zip_of(lng,lat)
    z=zm.get(zipc or '')
    ratio=(z['r']/z['v']) if z and z.get('r') and z.get('v') else 0.0028
    yoy=z['yoy'] if z else 0
    units=int(float(r[9])); condo='Condominium' in (r[3] or '')
    rent=price*ratio*(1.2 if units>1 else 1)*12
    egi=rent*(1-A['vac']/100)
    hoa=5400 if condo else 0
    opex=price*A['tax']/100+price*A['ins']/100+rent*(A['maint']+A['capex'])/100+egi*A['mgmt']/100+hoa
    noi=egi-opex
    loan=price*(1-A['down']/100); ds=loan*payk*12
    cf=noi-ds; cfmo=cf/12; cap=noi/price*100; dscr=noi/ds if ds>0 else 0; gross=rent/price*100
    lot=r[10]; year=int(r[4]) if r[4] and r[4]!='0' else None
    beds=float(r[6]); rooms=float(r[7])
    va=0
    if units>1: va+=25
    if not condo and lot>=4000: va+=25
    elif not condo and lot>=2500: va+=15
    if year and year<1960: va+=15
    if 'Flat' in (r[3] or '') or 'Store' in (r[3] or ''): va+=10
    if rooms-beds>=5: va+=10
    va=min(va,100)
    risk=100-(35 if (units>1 and year and year<1979) else 0)-(20 if condo else 0)
    score=(30*lerp(cfmo,-3000,1500)+15*lerp(cap,2,8)+15*lerp(dscr,0.5,1.35)+10*lerp(gross,3,12)+10*va+10*lerp(yoy,-8,8)+10*max(0,risk))/100
    cand.append((score, price, zipc, r))
cand.sort(key=lambda x:-x[0])
top=cand[:9700]  # real scored pool is 9,692 after price-band + dedup filters — this no longer truncates
print('pool scored', len(cand), 'top score', round(top[0][0]), 'cutoff', round(top[-1][0]))
for i,(score, price, zipc, r) in enumerate(top):
    lng,lat=r[17],r[18]
    addr, unit = sf_addr(r[0])
    znb = pip(nb_sf, lng, lat)
    units=int(float(r[9]))
    kind = 'Condominium' if 'Condominium' in (r[3] or '') else ('Single-family' if r[2]=='S' else (f'{units} units' if units>1 else 'Multi-family'))
    listings.append(dict(id=f'SF{i+1:04d}', addr=addr, city='San Francisco', zip=zipc or '', county='San Francisco', nb=znb or r[15], anb=r[15], lat=lat, lng=lng,
        kind=kind, units=units, beds=int(float(r[6])), baths=float(r[5]), rooms=int(float(r[7])), sqft=int(r[11]), lot=int(r[10]) or None, year=int(r[4]) if r[4] and r[4]!='0' else None,
        stories=int(float(r[8])) if r[8] else None, price=int(round(price)), priceDate=r[12], land=int(r[14]), imp=int(r[13]), zoning=r[16], apn=r[1], classdef=r[3],
        src='SF Assessor secured roll (DataSF wv5m-vpq2), closed roll 2025' + (' — Prop 13 factor removed for pre-2024 sale' if r[12]<='2023-12-31' else ''), tour='sf'))
from collections import Counter as C2
print(C2(l['kind'] for l in listings)); print(C2(l['anb'] for l in listings).most_common(12))
print('sale dates', min(l['priceDate'] for l in listings), max(l['priceDate'] for l in listings))
# ---------- Alameda County ----------
quota = {'OAKLAND': 6, 'BERKELEY': 4, 'ALAMEDA': 3, 'PIEDMONT': 2, 'ALBANY': 2, 'EMERYVILLE': 1, 'SAN LEANDRO': 3, 'CASTRO VALLEY': 2, 'HAYWARD': 3, 'FREMONT': 4, 'NEWARK': 2, 'UNION CITY': 2, 'DUBLIN': 2, 'PLEASANTON': 2, 'LIVERMORE': 2}
by_city = defaultdict(list)
for r in al: by_city[r[2]].append(r)
picked = []
for c, q in quota.items():
    rows = by_city[c]
    multi = [r for r in rows if r[8][:2] in ('21', '22', '23', '24')]
    single = [r for r in rows if r[8][:2] not in ('21', '22', '23', '24')]
    sel = multi[:max(1, q // 3)] + single
    picked.extend(sel[:q])
for i, r in enumerate(picked):
    apn, raw, city, zipc, land, imps, hoex, net, use, date, lng, lat, area = r
    kind, units = USE_AL.get(use[:2], ('Residential', 1))
    tot = land + imps
    cityT = title(city)
    listings.append(dict(id=f'AL{i+1:03d}', addr=al_addr(raw, city, zipc), city=cityT, zip=zipc, county='Alameda', nb=pip(nb_oak, lng, lat) if city == 'OAKLAND' else (pip(nb_ala, lng, lat) if city == 'ALAMEDA' else None), lat=lat, lng=lng,
        kind=kind, units=units, beds=None, baths=None, sqft=None, lot=int(area * 10.7639) if area else None, year=None, stories=None, price=int(tot), priceDate=date, land=land, imp=imps,
        zoning=None, apn=apn, classdef=f'Use code {use}', ownerOcc=bool(hoex), src='Alameda County Assessor parcels (ArcGIS FeatureServer), roll 2025', tour='eb'))
pass
# ---------- House-hack inventory: all 2-4 unit sales (SF 2022-24, Alameda 2023-24) ----------
FHA={1:1209750,2:1548975,3:1872225,4:2326875}
have_apn=set(l['apn'] for l in listings if l.get('apn'))
sfh=json.load(open(R+'sf_hacks.json'))
hh_sf=0
for r in sfh:
    apn=r[1]
    tot=r[13]+r[14]
    d=r[12]
    price = tot/1.0404 if d<='2022-12-31' else (tot/1.02 if d<='2023-12-31' else tot)
    if price>FHA[4] or price<250000: continue
    if apn in have_apn:
        for l in listings:
            if l.get('apn')==apn: l['hh']=1
        continue
    have_apn.add(apn)
    lng,lat=r[17],r[18]
    addr,unit=sf_addr(r[0]); units=int(float(r[9]))
    znb=pip(nb_sf,lng,lat)
    hh_sf+=1
    listings.append(dict(id=f'HSF{hh_sf:04d}', addr=addr, city='San Francisco', zip=zip_of(lng,lat) or '', county='San Francisco', nb=znb or r[15], anb=r[15], lat=lat, lng=lng,
        kind=f'{units} units', units=units, beds=int(float(r[6])) if r[6] else None, baths=float(r[5]) if r[5] else None, rooms=int(float(r[7])) if r[7] else None, sqft=int(r[11]) or None, lot=int(r[10]) or None,
        year=int(r[4]) if r[4] and r[4]!='0' else None, stories=int(float(r[8])) if r[8] else None, price=int(round(price)), priceDate=d, land=int(r[14]), imp=int(r[13]), zoning=r[16], apn=apn, classdef=r[3], hh=1,
        src='SF Assessor secured roll (DataSF wv5m-vpq2), closed roll 2025' + (' — Prop 13 factor removed for pre-2024 sale' if d<='2023-12-31' else ''), tour='sf'))
alh=json.load(open(R+'al_hacks.json'))
USE_HH={'12':('Single-family + secondary unit',2),'21':('Duplex (2 units)',2),'22':('Duplex (2 units)',2),'23':('Triplex (3 units)',3),'24':('Fourplex (4 units)',4)}
hh_al=0
for r in alh:
    apn,raw,city,zipc,land,imps,hoex,use,d,lng,lat,area=r
    if apn in have_apn:
        for l in listings:
            if l.get('apn')==apn: l['hh']=1
        continue
    kindu=USE_HH.get(use[:2])
    if not kindu: continue
    kind,units=kindu
    tot=land+imps
    price = tot/1.02 if d<='2023-12-31' else tot
    if price>FHA[4] or price<250000: continue
    have_apn.add(apn)
    hh_al+=1
    cityT=title(city)
    listings.append(dict(id=f'HAL{hh_al:04d}', addr=al_addr(raw, city, zipc), city=cityT, zip=zipc, county='Alameda', nb=pip(nb_oak,lng,lat) if city=='OAKLAND' else (pip(nb_ala,lng,lat) if city=='ALAMEDA' else None), lat=lat, lng=lng,
        kind=kind, units=units, beds=None, baths=None, sqft=None, lot=int(area*10.7639) if area else None, year=None, stories=None, price=int(round(price)), priceDate=d, land=int(land), imp=int(imps), zoning=None,
        apn=apn, classdef=f'Use code {use}', ownerOcc=bool(hoex), hh=1, src='Alameda County Assessor parcels (ArcGIS FeatureServer), roll 2025' + (' — Prop 13 factor removed for 2023 sale' if d<='2023-12-31' else ''), tour='eb'))
# ---------- Alameda 2024 residential, scored in-browser, fill to 5,000 ----------
al24=json.load(open(R+'al24.json'))
USE24={'11':('Single-family',1),'14':('Condominium',1),'15':('Condominium',1),'18':('Townhouse / PUD',1)}
added24=0
for r in al24:
    score,apn,raw,city,zipc,land,imps,hoex,use,d,lng,lat,area=r
    if apn in have_apn: continue
    ku=USE24.get(use[:2])
    if not ku: continue
    kind,units=ku
    tot=land+imps
    price=tot/1.02 if d<='2023-12-31' else tot
    have_apn.add(apn); added24+=1
    cityT=title(city)
    listings.append(dict(id=f'ALR{added24:04d}', addr=al_addr(raw, city, zipc), city=cityT, zip=zipc, county='Alameda', nb=pip(nb_oak,lng,lat) if city=='OAKLAND' else (pip(nb_ala,lng,lat) if city=='ALAMEDA' else None), lat=lat, lng=lng,
        kind=kind, units=units, beds=None, baths=None, sqft=None, lot=int(area*10.7639) if area else None, year=None, stories=None, price=int(round(price)), priceDate=d, land=int(land), imp=int(imps), zoning=None,
        apn=apn, classdef=f'Use code {use}', ownerOcc=bool(hoex), src='Alameda County Assessor parcels (ArcGIS FeatureServer), roll 2025', tour='eb'))
print('al24 added', added24, '| total listings', len(listings))
# ---------- Alameda 2023-24 expanded pool, scored in-browser ----------
alp2=json.load(open(R+'al_pool2.json'))
addedX=0
for r in alp2:
    score,apn,raw,city,zipc,land,imps,hoex,use,d,lng,lat,area=r
    if apn in have_apn: continue
    ku=USE24.get(use[:2])
    if not ku: continue
    kind,units=ku
    tot=land+imps
    price=tot/1.02 if d<='2023-12-31' else tot
    if price<250000: continue
    have_apn.add(apn); addedX+=1
    cityT=title(city)
    listings.append(dict(id=f'ALX{addedX:04d}', addr=al_addr(raw, city, zipc), city=cityT, zip=zipc, county='Alameda', nb=pip(nb_oak,lng,lat) if city=='OAKLAND' else (pip(nb_ala,lng,lat) if city=='ALAMEDA' else None), lat=lat, lng=lng,
        kind=kind, units=units, beds=None, baths=None, sqft=None, lot=int(area*10.7639) if area else None, year=None, stories=None, price=int(round(price)), priceDate=d, land=int(land), imp=int(imps), zoning=None,
        apn=apn, classdef=f'Use code {use}', ownerOcc=bool(hoex), src='Alameda County Assessor parcels (ArcGIS FeatureServer), roll 2025' + (' — Prop 13 factor removed for 2023 sale' if d<='2023-12-31' else ''), tour='eb'))
print('expanded pool added', addedX, '| total listings', len(listings))
# ---------- Alameda 2022-24 deep pool (score>8 band 2023-24 + score>12 2022), fill to 30,500 ----------
TARGET2=41000  # was an artificial 18,100-listing cumulative cap; the real al_pool3 deep pool
               # only needed 40,443 total to exhaust itself once data.js is gzip-packed instead
               # of shipped raw (see compress_data.py call at the bottom of this file)
alp3=json.load(open(R+'al_pool3.json'))   # already sorted by score desc in-browser
addedY=0
for r in alp3:
    if len(listings)>=TARGET2: break
    score,apn,raw,city,zipc,land,imps,hoex,use,d,lng,lat,area=r
    if apn in have_apn: continue
    ku=USE24.get(use[:2])
    if not ku: continue
    kind,units=ku
    tot=land+imps
    price=tot/1.0404 if d<='2022-12-31' else (tot/1.02 if d<='2023-12-31' else tot)
    if price<250000: continue
    have_apn.add(apn); addedY+=1
    cityT=title(city)
    listings.append(dict(id=f'ALY{addedY:05d}', addr=al_addr(raw, city, zipc), city=cityT, zip=zipc, county='Alameda', nb=pip(nb_oak,lng,lat) if city=='OAKLAND' else (pip(nb_ala,lng,lat) if city=='ALAMEDA' else None), lat=lat, lng=lng,
        kind=kind, units=units, beds=None, baths=None, sqft=None, lot=int(area*10.7639) if area else None, year=None, stories=None, price=int(round(price)), priceDate=d, land=int(land), imp=int(imps), zoning=None,
        apn=apn, classdef=f'Use code {use}', ownerOcc=bool(hoex), src='Alameda County Assessor parcels (ArcGIS FeatureServer), roll 2025' + (' — Prop 13 factor removed for pre-2024 sale' if d<='2023-12-31' else ''), tour='eb'))
print('deep pool added', addedY, '| total listings', len(listings))
# ---------- South Bay / Peninsula: Santa Clara + San Mateo parcels ----------
# Neither county publishes assessed values, so price is an ESTIMATE: the ZIP's latest
# Zillow ZHVI typical home value, clearly labeled per listing (est=1). Parcel facts
# (APN, address, lot, year built, last recorded doc) are real county GIS records.
import math
TARGET3=100000  # real total after the full Santa Clara + San Mateo filtered pools is 99,101
scc=json.load(open(R+'scc_pool.json'))
smc=json.load(open(R+'smc_pool.json'))
SCC_CITIES=['LOS ALTOS HILLS','MONTE SERENO','MOUNTAIN VIEW','MORGAN HILL','SANTA CLARA','LOS GATOS','LOS ALTOS','SAN MARTIN','PALO ALTO','SUNNYVALE','CUPERTINO','SAN JOSE','CAMPBELL','SARATOGA','MILPITAS','STANFORD','GILROY','ALVISO','COYOTE','REDWOOD ESTATES','HOLY CITY','MT HAMILTON','NEW ALMADEN']
def parse_scc(addr):
    if ' CA ' not in addr: return None,None,None
    left,right=addr.rsplit(' CA ',1)
    zipc=right.strip()[:5]
    for c in SCC_CITIES:
        if left.endswith(' '+c): return left[:-len(c)-1].strip(), c, zipc
    return None,None,None
sb_cand=[]
for r in scc:
    apn,addr,year,lot,doc2,lng,lat=r
    if apn in have_apn: continue
    street,city,zipc=parse_scc(addr)
    if not street or not zipc: continue
    z=zm.get(zipc)
    if not z or not z.get('v') or not z.get('r'): continue
    price=z['v']
    if price<250000 or price>6000000: continue
    ratio=z['r']/z['v']; yoy=z.get('yoy',0)
    rent=price*ratio*12; egi=rent*0.95
    opex=price*0.0129+max(1200,price*0.0035)+rent*0.08+egi*0.08
    noi=egi-opex; loan=price*0.75; ds=loan*0.0757
    cfmo=(noi-ds)/12; cap=noi/price*100; dscr=noi/ds if ds>0 else 0; gross=rent/price*100
    va=0
    if lot>=4000: va+=25
    elif lot>=2500: va+=15
    yr=int(year) if year and year.isdigit() else None
    if yr and yr<1960: va+=15
    score=(30*lerp(cfmo,-3000,1500)+15*lerp(cap,2,8)+15*lerp(dscr,0.5,1.35)+10*lerp(gross,3,12)+10*min(va,100)+10*lerp(yoy,-8,8)+10*100)/100
    if doc2 in ('24','25'): score+=0.01  # tie-break toward recent activity
    sb_cand.append((score,'SC',apn,street,city,zipc,int(price),yr,int(lot) if lot else None,doc2,lng,lat))
for r in smc:
    apn,addr,city,area,lng,lat=r
    if apn in have_apn: continue
    street=addr.split(',')[0].strip()
    if not street or street==',': continue
    zipc=zip_of(lng,lat)
    z=zm.get(zipc or '')
    if not z or not z.get('v') or not z.get('r'): continue
    price=z['v']
    if price<250000 or price>6000000: continue
    ratio=z['r']/z['v']; yoy=z.get('yoy',0)
    rent=price*ratio*12; egi=rent*0.95
    opex=price*0.0122+max(1200,price*0.0035)+rent*0.08+egi*0.08
    noi=egi-opex; loan=price*0.75; ds=loan*0.0757
    cfmo=(noi-ds)/12; cap=noi/price*100; dscr=noi/ds if ds>0 else 0; gross=rent/price*100
    lot_sf=int(area*(math.cos(lat*math.pi/180)**2)*10.7639) if area else None
    va=0
    if lot_sf and lot_sf>=4000: va+=25
    elif lot_sf and lot_sf>=2500: va+=15
    score=(30*lerp(cfmo,-3000,1500)+15*lerp(cap,2,8)+15*lerp(dscr,0.5,1.35)+10*lerp(gross,3,12)+10*min(va,100)+10*lerp(yoy,-8,8)+10*100)/100
    sb_cand.append((score,'SM',apn,street,city,zipc,int(price),None,lot_sf,None,lng,lat))
sb_cand.sort(key=lambda x:-x[0])
print('sb_cand pool: SC', sum(1 for t in sb_cand if t[1]=='SC'), 'SM', sum(1 for t in sb_cand if t[1]=='SM'))
addSC=addSM=0
for t in sb_cand:
    if len(listings)>=TARGET3: break
    score,kindc,apn,street,city,zipc,price,yr,lot_sf,doc2,lng,lat=t
    if apn in have_apn: continue
    if kindc=='SM' and addSM>=26000: continue  # real filtered SM pool is 25,505
    if kindc=='SC' and addSC>=34000: continue  # real filtered SC pool is 33,153
    have_apn.add(apn)
    cityT=title(city)
    if kindc=='SC':
        addSC+=1
        listings.append(dict(id=f'SC{addSC:05d}', addr=title(street), city=cityT, zip=zipc, county='Santa Clara', nb=None, lat=lat, lng=lng,
            kind='Residential parcel', units=1, beds=None, baths=None, sqft=None, lot=lot_sf, year=yr, stories=None, price=price, priceDate=None, land=None, imp=None, zoning=None,
            apn=apn, classdef=('Parcel record — last recorded document 20'+doc2 if doc2 in('22','23','24','25') else 'County parcel record'), est=1, tour=None,
            src='Santa Clara County parcel GIS (Parcels_Public_View). VALUE IS AN ESTIMATE: Zillow ZHVI typical home value for ZIP '+zipc+' — the county publishes no assessed values.'))
    else:
        addSM+=1
        listings.append(dict(id=f'SM{addSM:05d}', addr=title(street), city=cityT, zip=zipc, county='San Mateo', nb=None, lat=lat, lng=lng,
            kind='Residential parcel', units=1, beds=None, baths=None, sqft=None, lot=lot_sf, year=None, stories=None, price=price, priceDate=None, land=None, imp=None, zoning=None,
            apn=apn, classdef='County parcel record', est=1, tour=None,
            src='San Mateo County active parcels GIS. VALUE IS AN ESTIMATE: Zillow ZHVI typical home value for ZIP '+(zipc or '')+' — the county publishes no assessed values.'))
print('south bay added: Santa Clara', addSC, 'San Mateo', addSM, '| total listings', len(listings))
# ---------- Conversion lab inventory: hotels & 5+ unit apartment buildings ----------
# Real records (assessed values are Prop 13 basis, often far below market); the
# Conversion lab models market value and student-housing / 2-3BR splits, all labeled modeled.
TARGET4=118000  # real total after the conversion-lab pool (hotels & 5+ unit buildings) is 116,821
sfc=json.load(open(R+'sf_conv.json'))
alc=json.load(open(R+'al_conv.json'))
cv_cand=[]
for r in sfc:
    raw,apn,use,cls,year,units,rooms,stories,lot,sqft,d,imp,land,anb,zon,lng,lat=r
    if apn in have_apn: continue
    zipc=zip_of(lng,lat)
    z=zm.get(zipc or '')
    zori=z.get('r') if z else None
    if not zori: continue
    hotel = use=='COMH'
    u = int(rooms) if hotel and rooms else int(units)
    if u<5: continue
    beds = int(sqft*0.75/420) if sqft and sqft>1000 else int(u*1.6)
    key = beds*(zori*0.48)
    cv_cand.append(dict(k=key,src='SF',apn=apn,raw=raw,year=year,u=u,rooms=rooms,stories=stories,lot=lot,sqft=sqft,d=d,imp=imp,land=land,anb=anb,zon=zon,lng=lng,lat=lat,zipc=zipc,hotel=hotel,cls=cls))
for r in alc:
    apn,raw,city,zipc,land,imps,hoex,use,d,lng,lat,area=r
    if apn in have_apn: continue
    z=zm.get(zipc)
    zori=z.get('r') if z else None
    if not zori: continue
    key=8*(zori*0.48)*0.9 + imps/1e6
    cv_cand.append(dict(k=key,src='AL',apn=apn,raw=raw,city=city,zipc=zipc,land=land,imp=imps,hoex=hoex,use=use,d=d,lng=lng,lat=lat,area=area))
cv_cand.sort(key=lambda x:-x['k'])
print('cv_cand pool', len(cv_cand))
addCV=0
for t in cv_cand:
    if len(listings)>=TARGET4: break
    if t['apn'] in have_apn: continue
    have_apn.add(t['apn']); addCV+=1
    if t['src']=='SF':
        addr,_u2=sf_addr(t['raw'])
        listings.append(dict(id=f'CV{addCV:05d}', addr=addr, city='San Francisco', zip=t['zipc'] or '', county='San Francisco', nb=pip(nb_sf,t['lng'],t['lat']) or t['anb'], anb=t['anb'], lat=t['lat'], lng=t['lng'],
            kind=('SRO / residential hotel' if (t['hotel'] and 'SRO' in (t['cls'] or '')) else ('Hotel' if t['hotel'] else str(t['u'])+' units')), units=t['u'], beds=None, baths=None, rooms=int(t['rooms']) if t['rooms'] else None,
            sqft=int(t['sqft']) if t['sqft'] else None, lot=int(t['lot']) if t['lot'] else None, year=int(t['year']) if t['year'] and t['year']!='0' else None,
            stories=int(t['stories']) if t['stories'] else None, price=int(t['imp']+t['land']), priceDate=(t['d'] or None), land=int(t['land']), imp=int(t['imp']), zoning=t['zon'] or None,
            apn=t['apn'], classdef=t['cls'], cv=1, tour=None,
            src='SF Assessor secured roll (DataSF wv5m-vpq2), closed roll 2025. Price is the Prop 13 ASSESSED BASIS — long-held buildings are assessed far below market; see the Conversion lab for modeled market value.'))
    else:
        cityT=title(t['city'])
        listings.append(dict(id=f'CV{addCV:05d}', addr=al_addr(t['raw'], t['city'], t['zipc']), city=cityT, zip=t['zipc'], county='Alameda', nb=pip(nb_oak,t['lng'],t['lat']) if t['city']=='OAKLAND' else (pip(nb_ala,t['lng'],t['lat']) if t['city']=='ALAMEDA' else None), lat=t['lat'], lng=t['lng'],
            kind=USE_AL.get(t['use'][:2],('Apartment (5+ units)',5))[0], units=5, beds=None, baths=None, sqft=None, lot=int(t['area']*10.7639) if t['area'] else None, year=None, stories=None,
            price=int(t['imp']+t['land']), priceDate=(t['d'] or None), land=int(t['land']), imp=int(t['imp']), zoning=None, apn=t['apn'], classdef='Use code '+t['use'], ownerOcc=bool(t['hoex']), cv=1, tour=None,
            src='Alameda County Assessor parcels (ArcGIS FeatureServer), roll 2025. Price is the Prop 13 ASSESSED BASIS — long-held buildings are assessed far below market; see the Conversion lab for modeled market value.'))
print('conversion inventory added', addCV, '| total listings', len(listings))
# ---------- Santa Clara large buildings (footprints >=4,000 sf, height >=24 ft) ----------
# Joined to county parcel records within 50 m. Real building geometry + parcel address;
# unit counts / values are models, labeled. Upgrades existing SC records in place; adds
# new CV records for parcels not yet in the catalog (capped for page size).
scb=json.load(open(R+'scc_bigbld.json'))          # [lng, lat, footprint_sf, height_ft]
sccp=json.load(open(R+'scc_pool.json'))           # [apn, addrfull, year, lot, doc2, lng, lat]
from shapely.strtree import STRtree as _T2
ppts=[Point(r[5],r[6]) for r in sccp]
ptree=_T2(ppts)
best={}   # apn -> (area, height)
import math as _m
for lng,lat,area,hgt in scb:
    p=Point(lng,lat)
    cand_i=ptree.query(p.buffer(0.0006))
    bi=None; bd=1e9
    for i in cand_i:
        dd=(ppts[i].x-lng)**2+(ppts[i].y-lat)**2
        if dd<bd: bd=dd; bi=i
    if bi is None or bd>(0.0005)**2: continue
    apn=sccp[bi][0]
    a0,h0=best.get(apn,(0,0))
    best[apn]=(max(a0,area), max(h0,hgt))
byid={l['apn']:l for l in listings}
upg=0; newCV=0; CAP_NEW=4000
scc_rows={r[0]:r for r in sccp}
for apn,(area,hgt) in sorted(best.items(), key=lambda kv:-kv[1][0]*kv[1][1]):
    floors=max(1,round(hgt/11))
    sqft=int(area*min(floors,4))
    units=max(5, round(sqft*0.78/1000))
    r=scc_rows[apn]
    street,city,zipc=parse_scc(r[1])
    if not zipc: continue
    z=zm.get(zipc)
    if not z or not z.get('r'): continue
    noi=units*z['r']*0.85*12*0.72
    price=int(noi/0.055)
    if apn in byid:
        L0=byid[apn]
        if L0.get('cv'): continue
        L0['cv']=1; L0['kind']='Large building'; L0['units']=units; L0['sqft']=sqft; L0['price']=price; L0['est']=1
        L0['classdef']=f'Large building — {floors} floors modeled from GIS footprint'
        L0['src']='Santa Clara County parcel + building-footprint GIS. VALUE IS A MODEL: income approach on modeled units x ZIP ZORI at a 5.5% cap.'
        upg+=1
    elif newCV<CAP_NEW and len(listings)<TARGET4+CAP_NEW:
        addCV+=1; newCV+=1; have_apn.add(apn)
        listings.append(dict(id=f'CV{addCV:05d}', addr=title(street), city=title(city), zip=zipc, county='Santa Clara', nb=None, lat=r[6], lng=r[5],
            kind='Large building', units=units, beds=None, baths=None, sqft=sqft, lot=int(r[3]) if r[3] else None, year=int(r[2]) if r[2] and str(r[2]).isdigit() else None, stories=floors,
            price=price, priceDate=None, land=None, imp=None, zoning=None, apn=apn, classdef=f'Large building — {floors} floors modeled from GIS footprint', est=1, cv=1, tour=None,
            src='Santa Clara County parcel + building-footprint GIS. VALUE IS A MODEL: income approach on modeled units x ZIP ZORI at a 5.5% cap — the county publishes no assessed values.'))
print('SCC large buildings: upgraded', upg, 'added', newCV, '| total listings', len(listings))
# ---------- Larger commercial, hotels, motels, SROs (SF + Alameda rolls) ----------
sfcm=json.load(open(R+'sf_comm.json'))
alcm=json.load(open(R+'al_comm.json'))
SFUSE={'COMR':'Commercial — retail','COMO':'Commercial — office','COMM':'Commercial — misc','MISC':'Mixed-use / misc','IND':'Industrial / flex'}
addCM=0
for r in sfcm:
    raw,apn,use,cls,year,units,rooms,stories,lot,sqft,d,imp,land,anb,zon,lng,lat=r
    if apn in have_apn: continue
    zipc=zip_of(lng,lat)
    if not zipc: continue
    have_apn.add(apn); addCM+=1
    addr,_u=sf_addr(raw)
    listings.append(dict(id=f'CM{addCM:05d}', addr=addr, city='San Francisco', zip=zipc, county='San Francisco', nb=pip(nb_sf,lng,lat) or anb, anb=anb, lat=lat, lng=lng,
        kind=SFUSE.get(use,'Commercial'), units=int(units) if units else 1, beds=None, baths=None, rooms=int(rooms) if rooms else None,
        sqft=int(sqft) if sqft else None, lot=int(lot) if lot else None, year=int(year) if year and year!='0' else None,
        stories=int(stories) if stories else None, price=int(imp+land), priceDate=(d or None), land=int(land), imp=int(imp), zoning=zon or None,
        apn=apn, classdef=cls, cv=1, tour=None,
        src='SF Assessor secured roll (DataSF wv5m-vpq2), closed roll 2025. Price is the Prop 13 ASSESSED BASIS — long-held commercial is assessed far below market.'))
ALUSE=lambda u: ('SRO hotel' if u=='8901' else 'Hotel' if u.startswith('89') else 'Motel' if u.startswith('90') else ('Apartment + commercial (mixed)' if u.startswith('7705') else 'Apartment (5+ units)') if u.startswith('77') else 'Commercial')
for r in alcm:
    apn,raw,city,zipc,land,imps,hoex,use,d,lng,lat,area=r
    if apn in have_apn: continue
    have_apn.add(apn); addCM+=1
    cityT=title(city)
    listings.append(dict(id=f'CM{addCM:05d}', addr=al_addr(raw, city, zipc), city=cityT, zip=zipc, county='Alameda', nb=pip(nb_oak,lng,lat) if city=='OAKLAND' else (pip(nb_ala,lng,lat) if city=='ALAMEDA' else None), lat=lat, lng=lng,
        kind=ALUSE(use), units=(5 if use.startswith('77') else 1), beds=None, baths=None, sqft=None, lot=int(area*10.7639) if area else None, year=None, stories=None,
        price=int(land+imps), priceDate=(d or None), land=int(land), imp=int(imps), zoning=None, apn=apn, classdef='Use code '+use, ownerOcc=bool(hoex), cv=1, tour=None,
        src='Alameda County Assessor parcels (ArcGIS FeatureServer), roll 2025. Price is the Prop 13 ASSESSED BASIS — long-held buildings are assessed far below market.'))
# ---------- Contra Costa: income-class parcels (5th Bay county) ----------
# Real assessed parcels from the county's own GIS (gis.cccounty.us CCMAP), already
# fetched and verified for the Income Fifty edition — this is the same 53,907-record
# pool folded into the core map too, since it was never a competing allocation (a
# separate artifact has its own budget). Price is the Prop 13 assessed basis, exactly
# like the SF/Alameda commercial records above, labeled the same way.
CCC_KIND={13:('Multi-residence parcel (2+ homes)',2,1),21:('Duplex (2 units)',2,1),22:('Triplex (3 units)',3,1),23:('Fourplex (4 units)',4,1),
 24:('Combination multi-unit',3,1),25:('Apartments (5–12 units)',8,1),26:('Apartments (13–24 units)',18,1),27:('Apartments (25–59 units)',40,1),
 28:('Apartments (60+ units)',75,1),29:('Condominium (incl. commercial/industrial condos)',1,0),31:('Commercial — stores',1,1),
 33:('Commercial — office',1,1),34:('Medical–dental building',1,1),35:('Service station / car wash',1,1),36:('Auto repair',1,1),
 42:('Shopping center',1,1),44:('Hotel / motel / MH park',20,1),46:('Drive-in restaurant',1,1),47:('Restaurant',1,1),
 48:('Multiple & commercial — mixed use',2,1),49:('Auto agency',1,1),51:('Industrial park',1,1),53:('Light industrial',1,1),
 54:('Heavy industrial',1,1),55:('Mini-warehouse / storage',1,1),85:('Parking',1,1)}
import calendar as _cal
addCC=0
for r in json.load(open(R+'ccc_income.json')):
    apn,raw,city,zipc,use,land,imp,yr,sqft,acre,deed,lng,lat=r
    if lng is None or apn in have_apn: continue
    k=CCC_KIND.get(use)
    if not k: continue
    kind,units,cvflag=k
    price=int((land or 0)+(imp or 0))
    if price<20000: continue
    zipc=str(zipc) if zipc else ''
    d=None
    if deed and len(str(deed))==8:
        s=str(deed)
        try:
            mo=int(s[4:6]); dy=int(s[6:])
            if 1<=mo<=12 and 1<=dy<=31 and '1900'<=s[:4]<='2026':
                dy=min(dy, _cal.monthrange(int(s[:4]),mo)[1]); d=f"{s[:4]}-{mo:02d}-{dy:02d}"
        except Exception: d=None
    have_apn.add(apn); addCC+=1
    addr=title(raw.replace(' - '+city,'').replace(' -','').strip()) if raw else '(no situs address on roll)'
    listings.append(dict(id=f'CC{addCC:05d}', addr=addr, city=title(city) if city else 'Contra Costa County', zip=zipc, county='Contra Costa', nb=None, lat=lat, lng=lng,
        kind=kind, units=units, beds=None, baths=None, sqft=int(sqft) if sqft else None, lot=int(acre*43560) if acre else None, year=int(yr) if yr and str(yr).isdigit() else None, stories=None,
        price=price, priceDate=d, land=int(land) if land else None, imp=int(imp) if imp else None, zoning=None, apn=str(apn), classdef='Use code '+str(use), cv=cvflag, tour=None,
        src='Contra Costa County assessment parcels (gis.cccounty.us CCMAP). Price is the Prop 13 ASSESSED BASIS — long-held buildings are assessed far below market.'))
print('Contra Costa income-class parcels added', addCC, '| total listings', len(listings))
# ---------- public-record enrichment: +10 data points ----------
sfe={r[0]:r[1:] for r in json.load(open(R+'sf_enrich.json'))}
ale={r[0]:r[1:] for r in json.load(open(R+'al_enrich.json'))}
enr=0
for l in listings:
    if l['county']=='San Francisco' and l.get('apn') in sfe:
        e=sfe[l['apn']]
        if e[0]: l['ctype']=e[0]
        if e[1]: l['front']=int(e[1])
        if e[2]: l['depth']=int(e[2])
        if e[3]: l['bsmt']=int(e[3])
        if e[5] and int(e[5])>0: l['ownerOcc']=True
        if e[6]: l['dist2']=str(e[6])
        if e[7]: l['tra']=str(e[7])
        enr+=1
    elif l['county']=='Alameda' and l.get('apn') in ale:
        e=ale[l['apn']]
        if e[0]: l['tra']=str(e[0])
        if e[1]: l['exv']=int(e[1])
        if e[2]: l['netv']=int(e[2])
        if e[4] and e[5] and e[4]!=e[5]: l['absent']=1
        enr+=1
print('enriched with extra public-record fields:', enr)
json.dump([[apn, best[apn][0], best[apn][1]] for apn in best], open(R+'scc_conv_join.json','w'))
for l in listings:
    if not l.get('hh') and (l.get('units') or 1)>=2 and (l.get('units') or 1)<=4 and l['price']<=FHA[4]: l['hh']=1
print('house hacks added: SF', hh_sf, 'Alameda', hh_al, '| total listings', len(listings), '| hh total', sum(1 for l in listings if l.get('hh')))


# ---------- market bundle (only what the app needs) ----------
needZips = set(l['zip'] for l in listings if l['zip'])
market = dict(months=mz, nbMonths=mn,
    zips={k: dict(v=zipVal.get(k), r=zipRent.get(k), city=zipCity.get(k), county=zipCounty.get(k)) for k in set(zipVal) | set(zipRent)},
    cities={k: dict(v=cityVal.get(k), r=cityRent.get(k), county=cityCounty.get(k)) for k in set(cityVal) | set(cityRent)},
    nbs={k: v for k, v in nbVal.items() if k.split('|')[0] in ('San Francisco', 'Oakland', 'Berkeley', 'Alameda', 'Fremont', 'Hayward', 'San Leandro')})
missing = [l['id'] for l in listings if l['zip'] not in zipVal]
print('listings without zip ZHVI:', missing)
print('zip coverage', len(needZips), 'zips in market', len(market['zips']))
print(Counter(l['city'] for l in listings)); print(Counter(l['kind'] for l in listings))
print(statistics.median(l['price'] for l in listings))
for l in listings[:3] + listings[60:63]: print(l)

# ---------- basemap ----------
geo = {}
for k, f in [('counties', 'out_counties'), ('zips', 'out_zips'), ('roads', 'out_roads'), ('urban', 'out_urban'), ('rail', 'out_rail'), ('parks', 'out_parks'), ('rivers', 'out_rivers'), ('nbsf', 'out_nb_sf'), ('nboak', 'out_nb_oak'), ('nbala', 'out_nb_ala')]:
    g = json.load(open(R+'geo/'+f+'.json'))
    for ft in g['features']:
        p = ft['properties']; ft['properties'] = {kk: p[kk] for kk in p if kk in ('NAME', 'zip', 'type', 'name')}
    geo[k] = g
# attach latest ZHVI/ZORI to zip polygons for choropleth
for ft in geo['zips']['features']:
    zc = ft['properties']['zip']; v = zipVal.get(zc); r = zipRent.get(zc)
    ft['properties']['zhvi'] = (v[-1] if v else None); ft['properties']['zori'] = (r[-1] if r else None)
    ft['properties']['yoy'] = round((v[-1] / v[-13] - 1) * 100, 1) if v and v[-1] and v[-13] else None
    ft['properties']['city'] = zipCity.get(zc)

panos = {}
for i in range(12):
    panos[f'p{i}'] = 'data:image/webp;base64,' + base64.b64encode(open(R+f'panos/p{i}.webp', 'rb').read()).decode()

# ---------- columnar encoding: dictionaries + positional rows + inline decoder ----------
from datetime import date as _date
EPOCH=_date(2020,1,1)
def dic():
    vals=[]; idx={}
    def get(v):
        if v not in idx: idx[v]=len(vals); vals.append(v)
        return idx[v]
    return vals, get
cityV,cityI = dic(); nbV,nbI = dic(); kindV,kindI = dic(); zonV,zonI = dic(); clsV,clsI = dic(); srcV,srcI = dic()
ctypeV,ctypeI = dic(); traV,traI = dic()
COUNTY=['San Francisco','Alameda','Santa Clara','San Mateo','Contra Costa']
rows=[]
import re as _re
segs=[]
_ctr={}
for l in listings:
    m=_re.match(r'^([A-Z]+)(\d+)$', l['id']); pref,num=m.group(1),m.group(2)
    expected=_ctr.get(pref,0)+1
    assert int(num)==expected, ('id not sequential', l['id'], expected)
    _ctr[pref]=expected
    if not segs or segs[-1][0]!=pref:
        segs.append([pref,len(num),0])
    segs[-1][2]+=1
for l in listings:
    d=l.get('priceDate'); pdays=None if not d else (_date(int(d[:4]),int(d[5:7]),int(d[8:10]))-EPOCH).days
    rows.append([l['addr'], cityI(l['city']), (int(l['zip']) if l.get('zip') else None), COUNTY.index(l['county']),
        None if l.get('nb') is None else nbI(l['nb']), None if l.get('anb') is None else nbI(l['anb']),
        round((l['lat']-36)*1e5), round((l['lng']+123)*1e5), kindI(l['kind']), l['units'], l.get('beds'), l.get('baths'), l.get('rooms'),
        l.get('sqft'), l.get('lot'), l.get('year'), l.get('stories'), l['price'], pdays, l.get('land'), l.get('imp'),
        None if l.get('zoning') is None else zonI(l['zoning']), l['apn'], clsI(l['classdef']), srcI(l['src']),
        (2 if not l.get('tour') else (1 if l['tour']=='eb' else 0)), 1 if l.get('hh') else 0,
        (None if 'ownerOcc' not in l else (1 if l['ownerOcc'] else 0)), 1 if l.get('est') else 0, 1 if l.get('cv') else 0,
        (lambda parts: '|'.join(parts) if parts else None)([p for p in [
            ('c'+str(ctypeI(l['ctype']))) if l.get('ctype') else None,
            ('f'+str(l['front'])) if l.get('front') else None,
            ('e'+str(l['depth'])) if l.get('depth') else None,
            ('b'+str(l['bsmt'])) if l.get('bsmt') else None,
            ('s'+str(l['dist2'])) if l.get('dist2') else None,
            ('t'+str(traI(l['tra']))) if l.get('tra') else None,
            ('v'+str(l['exv'])) if l.get('exv') else None,
            ('n'+str(l['netv'])) if l.get('netv') else None,
            'a' if l.get('absent') else None] if p])])
D=dict(city=cityV, county=COUNTY, nb=nbV, kind=kindV, zoning=zonV, cls=clsV, src=srcV, segs=segs, ctype=ctypeV, tra=traV)
j=lambda o: json.dumps(o, separators=(',',':'))
decoder='''var E=Date.UTC(2020,0,1);function pd(n){return n==null?null:new Date(E+n*86400000).toISOString().slice(0,10);}
var _si=0,_sn=0,_pc={};
function nid(){ var sg=D.segs[_si]; _sn++; if(_sn>sg[2]){ _si++; _sn=1; sg=D.segs[_si]; } var n=(_pc[sg[0]]||0)+1; _pc[sg[0]]=n; var t=String(n); while(t.length<sg[1]) t='0'+t; return sg[0]+t; }
var listings=R.map(function(r){var o={id:nid(),addr:r[0],city:D.city[r[1]],zip:r[2]==null?"":String(r[2]),county:D.county[r[3]],nb:r[4]==null?null:D.nb[r[4]],anb:r[5]==null?null:D.nb[r[5]],lat:+((36+r[6]/1e5).toFixed(5)),lng:+((r[7]/1e5-123).toFixed(5)),kind:D.kind[r[8]],units:r[9],beds:r[10],baths:r[11],rooms:r[12],sqft:r[13],lot:r[14],year:r[15],stories:r[16],price:r[17],priceDate:pd(r[18]),land:r[19],imp:r[20],zoning:r[21]==null?null:D.zoning[r[21]],apn:r[22],classdef:D.cls[r[23]],src:D.src[r[24]],tour:r[25]===2?null:(r[25]?"eb":"sf")};if(r[26])o.hh=1;if(r[27]!=null)o.ownerOcc=!!r[27];if(r[28])o.est=1;if(r[29])o.cv=1;
if(r[30]){r[30].split("|").forEach(function(p){var k=p[0],v=p.slice(1);
 if(k==="c")o.ctype=D.ctype[+v];else if(k==="f")o.front=+v;else if(k==="e")o.depth=+v;else if(k==="b")o.bsmt=+v;
 else if(k==="s")o.dist2=v;else if(k==="t")o.tra=D.tra[+v];else if(k==="v")o.exv=+v;else if(k==="n")o.netv=+v;else if(k==="a")o.absent=1;});}
return o;});
return {listings:listings,market:M,geo:G,panos:P,built:B,signals:S};'''
sig=dict(sfPermits=json.load(open(R+'sf_permits.json')))
s='window.BA=(function(){"use strict";var D='+j(D)+';var R='+j(rows)+';var M='+j(market)+';var G='+j(geo)+';var P='+j(panos)+';var S='+j(sig)+';var B="2026-09-07T1";\n'+decoder+'\n})();'
import os
os.makedirs(R+'raw', exist_ok=True)
open(R+'raw/data.js','w').write(s)
print('data.js bytes (raw)', len(s), '| rows', len(rows), '| dicts', {k:len(v) for k,v in D.items()})
from compress_data import compress
rC=compress(R+'raw/data.js', R+'data.js')
print('data.js packed:', round(rC['before']/1e6,2), '->', round(rC['after']/1e6,2), 'MB', rC['literals'])
json.dump(listings, open(R+'listings.json','w'))
