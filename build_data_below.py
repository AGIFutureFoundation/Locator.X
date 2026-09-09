"""Locator X Below Market — 100,000 income-property and upgrade-candidate records whose
recorded basis sits farthest under their ZIP's typical value. Alameda condo / townhouse /
PUD classes + Contra Costa condo / townhouse / multi-residence classes, all with published
assessed values, server-side filtered to the low-basis cohort."""
import os
import json, re, calendar
R = os.path.dirname(os.path.abspath(__file__)) + os.sep
ALK={'7300':('Condominium',1),'7301':('Live/work condominium',1),'7302':('Condo above retail / office',1),'7305':('Townhouse-style condominium',1),
 '7320':('Condominium',1),'7321':('Live/work condominium',1),'7322':('Condo above retail / office',1),'7325':('Townhouse-style condominium',1),
 '7330':('Condominium',1),'7335':('Townhouse-style condominium',1),'7340':('Condominium',1),'7341':('Live/work condominium',1),
 '7342':('Condo above retail / office',1),'7345':('Townhouse-style condominium',1),'7400':('Cooperative unit',1),'7430':('Cooperative unit',1),
 '1500':('Townhouse — planned development',1),'1505':('Townhouse condominium',1),'1520':('Townhouse — planned development',1),'1525':('Townhouse condominium',1),
 '1530':('Townhouse — planned development',1),'1535':('Townhouse condominium',1),'1540':('Townhouse — planned development',1),'1545':('Townhouse condominium',1),
 '1600':('Detached site condominium',1),'1620':('Detached site condominium',1),'1630':('Detached site condominium',1),'1640':('Detached site condominium',1),
 '1800':('Single-family in PUD tract',1),'1820':('Single-family in PUD tract',1),'1830':('Single-family in PUD tract',1),'1840':('Single-family in PUD tract',1),
 '1850':('Duet / duplex / triplex in PUD',2),'1860':('Duet / duplex / triplex in PUD',2)}
CCK={29:('Condominium',1),16:('Townhouse / attached PUD / duet',1),19:('Single-family with common area',1),
 13:('Multi-residence parcel (2+ homes)',2),14:('Single-family on non-SF land',1)}
zil=json.load(open(R+'zillow.json'))
zhvi={}; zori={}
for row in zil['zipVal'][1:]:
    v=[x for x in row[7:] if isinstance(x,(int,float))]
    if v: zhvi[row[2]]=v[-1]
for row in zil['zipRent'][1:]:
    v=[x for x in row[7:] if isinstance(x,(int,float))]
    if v: zori[row[2]]=v[-1]
def title(s):
    return ' '.join(w.capitalize() if not re.match(r'^\d+(ST|ND|RD|TH)$',w) else w.lower() for w in str(s).split())
STYPE={'ST':'St','AV':'Ave','AVE':'Ave','BL':'Blvd','DR':'Dr','CT':'Ct','RD':'Rd','LN':'Ln','PL':'Pl','WY':'Way','TER':'Ter','CIR':'Cir','HY':'Hwy'}
def al_addr(raw, city, zipc):
    s=re.sub(r'\s+'+re.escape(str(city))+r'\s+'+re.escape(str(zipc))+r'$','',str(raw).strip())
    p=s.split()
    return ' '.join([p[0]]+[STYPE.get(x,title(x)) for x in p[1:]]) if p else s
have=set()
for l in json.load(open(R+'listings.json')):
    if l.get('apn'): have.add(str(l['apn'])); have.add(str(l['apn']).replace('/',''))
for f,ix in [('al_mf24.json',0),('al_target.json',0),('al_res_recent.json',0),('al_res_2023.json',0),('ccc_income.json',0)]:
    try:
        for r in json.load(open(R+f)): have.add(str(r[ix]))
    except Exception: pass
src=open(R+'raw/data_atlas_bay.js').read()
for r in json.loads(src[src.find(';var R=')+7:src.find(';var M=')]):
    if r[11]: have.add(str(r[11]))
print('already held', len(have))
cand=[]
skipped_common=0
for r in json.load(open(R+'bm_pool.json')):
    if r[9]=='AL':
        apn,addr,city,zipc,use,val,d,lng,lat,_ = r[:10]
        sqft=None; yr=None
        use=str(use)
        if use not in ALK: skipped_common+=1; continue
        kind,units=ALK[use]
        src_txt='Alameda County Assessor parcels, roll 2025 — Prop 13 assessed basis (long-held stock; basis is tenure, not a market price).'
        addr2=al_addr(addr,city,zipc) if addr else '(no situs address on roll)'
        county='Alameda'
    else:
        apn,addr,city,zipc,use,val,d,lng,lat,_,sqft,yr = r
        if use not in CCK: continue
        kind,units=CCK[use]
        src_txt='Contra Costa County assessment parcels — Prop 13 assessed basis (long-held stock; basis is tenure, not a market price).'
        addr2=title(str(addr).replace(' - '+str(city),'').replace(' -','').strip()) if addr else '(no situs address on roll)'
        county='Contra Costa'
    if lng is None or lat is None: continue
    if str(apn) in have: continue
    if not val or val<30000: continue
    zipc=str(zipc).strip()
    zv=zhvi.get(zipc)
    if not zv: continue
    typical=zv*(1+(units-1)*0.62)
    gap=(typical-val)/typical
    if gap<=0.05: continue
    date=None
    if d:
        s=str(d)
        if r[9]=='CC' and len(s)==8:
            try:
                mo=int(s[4:6]); dy=int(s[6:])
                if 1<=mo<=12 and '1900'<=s[:4]<='2026':
                    dy=min(dy, calendar.monthrange(int(s[:4]),mo)[1]); date=f"{s[:4]}-{mo:02d}-{dy:02d}"
            except Exception: pass
        elif len(s)==10 and s[4]=='-': date=s
    cand.append((gap, dict(addr=addr2, city=title(city) if city else county, zip=zipc, county=county, lat=lat, lng=lng,
        kind=kind, units=units, price=int(val), priceDate=date, sqft=int(sqft) if sqft else None,
        apn=str(apn), cv=(1 if units>1 else None), est=None, src=src_txt)))
# Alameda deep-basis single-family — the ADU / second-unit upgrade candidates
try: sfr=json.load(open(R+'al_sfr_low.json'))
except Exception: sfr=[]
for r in sfr:
    apn,addr,city,zipc,use,val,d,lng,lat,_ = r[:10]
    if lng is None or lat is None: continue
    if str(apn) in have: continue
    if not val or val<30000: continue
    zipc=str(zipc).strip(); zv=zhvi.get(zipc)
    if not zv: continue
    gap=(zv-val)/zv
    if gap<=0.05: continue
    date=d if (d and len(str(d))==10) else None
    cand.append((gap, dict(addr=al_addr(addr,city,zipc) if addr else '(no situs address on roll)', city=title(city) if city else 'Alameda County',
        zip=zipc, county='Alameda', lat=lat, lng=lng, kind='Single-family residence', units=1, price=int(val), priceDate=date,
        sqft=None, apn=str(apn), cv=None, est=None,
        src='Alameda County Assessor parcels, roll 2025 — Prop 13 assessed basis on a long-held single-family home (basis is tenure, not a market price). Upgrade candidate: ADU and second-unit plays are assessed on the Below market tab.')))
print('SFR upgrade candidates added', len([1 for _ in sfr]))
cand.sort(key=lambda x:-x[0])
keep=[c[1] for c in cand[:100000]]
from collections import Counter
print('candidates',len(cand),'skipped common-area',skipped_common,'kept',len(keep))
print('cut gap %', round(cand[min(99999,len(cand)-1)][0]*100,1), 'top gap %', round(cand[0][0]*100,1))
print(Counter(x['kind'] for x in keep).most_common(8))
print(Counter(x['county'] for x in keep).most_common())
dsrc=open(R+('raw/data.js' if __import__('os').path.exists(R+'raw/data.js') else 'data.js')).read()
market=json.loads(dsrc[dsrc.find('var M=')+6:dsrc.find(';var G=')])
rentBy={row[2]:[v if isinstance(v,(int,float)) else None for v in row[7:]] for row in zil['zipRent'][1:]}
add=0
for row in zil['zipVal'][1:]:
    z=row[2]
    if row[6]=='Contra Costa County' and z not in market['zips']:
        market['zips'][z]={'v':[v if isinstance(v,(int,float)) else None for v in row[7:]],'r':rentBy.get(z),'county':'Contra Costa','city':row[4]}; add+=1
print('market zips added',add)
geo=json.loads(dsrc[dsrc.find('var G=')+6:dsrc.find(';var P=')])
try:
    ccb=json.load(open(R+'geo/ccc_boundary.json'))
    if not any(f.get('properties',{}).get('name')=='Contra Costa' for f in geo['counties']['features']):
        geo['counties']['features'].append(ccb)
except Exception: pass
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
var listings=R.map(function(r){_n++;var f=r[13];var o={id:"AT"+String(_n).padStart(6,"0"),addr:r[0],city:D.city[r[1]],zip:r[2]==null?"":String(r[2]),county:D.county[r[3]],nb:null,anb:null,lat:+((LAT0+r[4]/1e5).toFixed(5)),lng:+((LNG0+r[5]/1e5).toFixed(5)),kind:D.kind[r[6]],units:r[7],beds:null,baths:null,rooms:null,sqft:r[10],lot:null,year:null,stories:null,price:r[8],priceDate:r[9]==null?null:new Date(E+r[9]*86400000).toISOString().slice(0,10),land:null,imp:null,zoning:null,apn:r[11],classdef:"Below Market record — recorded assessed basis sits under the ZIP typical value. Prop 13 basis is TENURE, not a purchase discount; see the Below market tab for what the evidence actually supports.",src:D.src[r[12]],tour:null};if(f&1)o.cv=1;if(f&2)o.est=1;return o;});
return {listings:listings,market:M,geo:G,panos:{},built:B,region:null};'''
    s=('window.BA=(function(){"use strict";var D='+j(D)+';var R='+j(rows)+';var M='+j(market)+';var G='+j(geo)
       +';var LAT0='+str(lat0)+';var LNG0='+str(lng0)+';var B="'+built+'";\n'+dec+'\n})();')
    open(out,'w').write(s)
    print(out, len(s), 'rows', len(rows))
emit(keep, market, geo, ['San Francisco','Alameda','Santa Clara','San Mateo','Contra Costa'], R+'data_below.js', '2026-09-02-BELOW100', 36.0, -123.0)
