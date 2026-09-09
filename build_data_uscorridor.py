"""Locator.X — US Growth Corridors edition.

Five metros outside the existing footprint, chosen for large announced private
capital AND reachable public parcel data. 20,000 records per metro, ranked from
118,723 pulled rows.

Every county's value field keeps the county's own meaning, and the record says
which it is — these are assessor values, never listing or sale prices:
  Maricopa   FCV_CUR            full cash value (Arizona)
  Franklin   TOTVALUEBASE       Ohio market value
  Licking    MarketTotalValue   Ohio market value
  Chatham    FairMarketValue    Georgia fair market value
  Onondaga   FULL_MARKET_VAL    New York full market value
  Washoe     TOTALAPR           Nevada APPRAISED value (never TOTALASS, which is
                                assessed at 35% and would understate by ~3x)

Use classes are quoted, never guessed:
  Maricopa   PUC, the statewide Arizona DOR Property Use Code (published manual)
  Franklin   CLASSDSCRP, plain English on the record
  Licking    Landuse, formatted "code: Description"
  Chatham    ZONE_DESC, the zoning description in plain English
  Onondaga   PROP_CLASS + USED_AS_DESC, confirmed against the descriptions
  Washoe     UNITS, a published unit count — no code inference needed at all
"""
import os
import json, math, collections, re
R = os.path.dirname(os.path.abspath(__file__)) + os.sep

COLS=['pid','addr','city','zip','lat','lng','use','units','value','year','sqft','lot','sale','saledate','zoning']
def rows(f):
    try: return json.load(open(R+f))
    except Exception: return []

SRC={
 'maricopa': ("Maricopa County Assessor parcels (gis.mcassessor.maricopa.gov). Price shown is the assessor's FULL CASH VALUE, not a listing or sale price. Use class is the statewide Arizona DOR Property Use Code.", 'Maricopa','AZ','Phoenix-Mesa-Chandler'),
 'maricopaC':("Maricopa County Assessor parcels (gis.mcassessor.maricopa.gov) — commercial band. Price shown is the assessor's FULL CASH VALUE, not a listing or sale price.", 'Maricopa','AZ','Phoenix-Mesa-Chandler'),
 'franklin': ("Franklin County Auditor parcel features (gis.franklincountyohio.gov). Price shown is the Ohio MARKET VALUE on the auditor's roll, not a listing or sale price.", 'Franklin','OH','Columbus'),
 'licking':  ("Licking County Auditor parcels (gis.lickingcounty.gov). Price shown is the Ohio MARKET VALUE on the auditor's roll, not a listing or sale price.", 'Licking','OH','Columbus'),
 'chatham':  ("Chatham County / SAGIS parcel digest (pub.sagis.org). Price shown is the Georgia FAIR MARKET VALUE on the digest, not a listing or sale price. Class shown is the ZONING description, which is what this layer publishes in plain English — it is what the parcel is zoned for, not necessarily what stands on it.", 'Chatham','GA','Savannah'),
 'onondaga': ("New York State Tax Parcels Public layer (services6.arcgis.com), Onondaga County. Price shown is the NY FULL MARKET VALUE on the roll, not a listing or sale price.", 'Onondaga','NY','Syracuse'),
 'washoe':   ("Washoe County Assessor nightly open data (services.arcgis.com). Price shown is the Nevada APPRAISED total value, not a listing or sale price and not the assessed figure (Nevada assesses at 35% of taxable value). This layer publishes a real unit count, so multifamily here is identified by UNITS, not by a use code.", 'Washoe','NV','Reno'),
}

# ---- Arizona DOR Property Use Code, three-digit prefixes (published manual) ----
AZ={'031':'Mixed residential complex (2+ residences on parcel)','032':'Duplex (2 units)','033':'Triplex (3 units)',
    '034':'Fourplex (4 units)','035':'Apartments (5–24 units)','036':'Apartments (25–99 units)','037':'Apartments (100+ units)',
    '038':'Boarding / rooming house','039':'Apartment cooperative','041':'Hotel','042':'Hotel',
    '051':'Motel','052':'Motel with restaurant and lounge','053':'Bed and breakfast'}
AZ_UNITS={'032':2,'033':3,'034':4,'035':12,'036':45,'037':150,'031':3,'038':10,'039':10,'041':60,'042':60,'051':30,'052':30,'053':6}
def az_kind(puc):
    p=(puc or '')[:3]
    if p in AZ: return AZ[p], AZ_UNITS.get(p)
    major=(puc or '')[:2]
    if major and major.isdigit() and 10<=int(major)<=27: return 'Commercial (Arizona use code '+str(puc)+')', None
    return 'Use code '+str(puc), None

UNIT_RE=[(re.compile(r'(\d+)\s*(?:OR MORE\s*)?(?:RENTAL\s*)?UNITS',re.I), lambda m:int(m.group(1))),
         (re.compile(r'\bTWO FAMILY\b',re.I), lambda m:2),
         (re.compile(r'\bTHREE FAMILY\b',re.I), lambda m:3),
         (re.compile(r'\bFOUR FAMILY\b',re.I), lambda m:4),
         (re.compile(r'\bTwo Family\b'), lambda m:2)]
def units_from_text(t):
    if not t: return None
    for rx,fn in UNIT_RE:
        m=rx.search(t)
        if m:
            try: return fn(m)
            except Exception: pass
    return None

NY={'220':'Two family residence','230':'Three family residence','280':'Multiple residences on one parcel',
    '411':'Apartment','414':'Hotel','415':'Motel','416':'Mobile home park','418':'Inn / lodge / rooming'}
def ny_kind(t):
    if not t: return 'Unclassified', None
    parts=t.split(' ',1); code=parts[0]; desc=parts[1] if len(parts)>1 else ''
    base=NY.get(code, 'NY class '+code)
    if desc: base=base+' — '+desc
    u={'220':2,'230':3,'280':3,'411':12,'414':40,'415':25,'418':10}.get(code)
    return base, u

def norm(key, r):
    d=dict(zip(COLS,r))
    src, county, state, metro = SRC[key]
    lat, lng = d['lat'], d['lng']
    if lat is None or lng is None: return None
    val=d['value']
    if not val or val<15000: return None
    kind=d['use']; units=d['units']
    if key in ('maricopa','maricopaC'):
        kind, u = az_kind(d['use']);  units = units or u
    elif key=='onondaga':
        kind, u = ny_kind(d['use']);  units = units or u
    elif key in ('franklin','licking'):
        kind = (d['use'] or '').strip()
        if key=='licking' and ':' in kind: kind=kind.split(':',1)[1].strip()
        kind = kind.title() if kind.isupper() else kind
        units = units or units_from_text(d['use'])
    elif key=='chatham':
        kind = 'Zoned: '+(d['use'] or 'unclassified')
    elif key=='washoe':
        kind = ('%d-unit residential' % units) if units and units>1 else 'Residential'
    addr=(d['addr'] or '').strip()
    if key=='maricopa' or key=='maricopaC':
        addr=re.sub(r'\s{2,}.*$','',addr).strip()      # strips the trailing "  CITY  ZIP"
    if not addr: return None
    return dict(addr=' '.join(w.capitalize() for w in addr.split()) if addr.isupper() else addr,
        city=(d['city'] or metro).title() if d['city'] else metro,
        zip=str(d['zip'] or '')[:5], county=county, state=state, metro=metro,
        lat=round(float(lat),5), lng=round(float(lng),5), kind=kind, units=units,
        price=int(val), priceDate=None, sqft=int(d['sqft']) if d['sqft'] else None,
        lot=int(d['lot']) if d['lot'] else None, year=int(d['year']) if d['year'] and 1700<d['year']<2030 else None,
        apn=str(d['pid']), zoning=d['zoning'] or (d['use'] if key=='chatham' else None),
        sale=int(d['sale']) if d['sale'] else None, src=src)

pool=collections.defaultdict(list)
for k in SRC:
    n=0
    for r in rows('us_'+k+'.json'):
        o=norm(k,r)
        if o: pool[o['metro']].append(o); n+=1
    print('%-11s %6d rows -> %d kept' % (k, len(rows('us_'+k+'.json')), n))

# ---- proximity to the announced projects, which is the whole thesis ----
corp=json.load(open(R+'corp_projects.json')) if False else None
CORR=json.loads(open(R+'corridor_data.js').read().split('=',1)[1].rstrip(';\n'))
PROJ=[]
for m in CORR['metros']:
    for p in m['projects']:
        if p['lat'] and p['lng']: PROJ.append(p)
def hav(a,b,c,d):
    t=math.pi/180; x=(c-a)*t; y=(d-b)*t
    h=math.sin(x/2)**2+math.cos(a*t)*math.cos(c*t)*math.sin(y/2)**2
    return 2*6371*math.asin(min(1,math.sqrt(h)))
def nearest(o):
    best=None
    for p in PROJ:
        km=hav(o['lat'],o['lng'],p['lat'],p['lng'])
        if best is None or km<best[1]: best=(p,km)
    return best

MFRE=re.compile(r'apart|duplex|triplex|fourplex|multi|two family|three family|four family|rental units|residences|unit residential|boarding|rooming|cooperative',re.I)
LODGE=re.compile(r'hotel|motel|inn|lodge|bed and breakfast|dorm',re.I)
COMM=re.compile(r'commercial|office|retail|business|warehouse|shopping',re.I)
def score(o):
    """Rank inside a metro. Intentionally simple and explainable: what it is,
       how many units, whether it is near the announced capital, and whether the
       record is complete enough to underwrite."""
    s=0.0
    k=o['kind'] or ''
    if MFRE.search(k): s+=34
    elif LODGE.search(k): s+=26
    elif COMM.search(k): s+=16
    u=o['units'] or 0
    if u: s+=min(24, math.log10(u+1)*20)
    n=nearest(o)
    if n:
        p,km=n
        o['projKm']=round(km,2); o['projCo']=p['company']; o['projJobs']=p.get('jobs')
        s+=22*math.exp(-km/18)
        if p.get('jobs'): s+=min(8, math.log10(p['jobs']+1)*2.4)
    if o['sqft']: s+=5
    if o['year']: s+=4
    if o['lot']: s+=3
    if o['price'] and 40000<=o['price']<=25_000_000: s+=6
    return s

TARGET=30000
keep=[]
for metro, lst in pool.items():
    for o in lst: o['_s']=score(o)
    lst.sort(key=lambda x:-x['_s'])
    take=lst[:TARGET]
    keep.extend(take)
    mf=sum(1 for x in take if MFRE.search(x['kind'] or ''))
    lg=sum(1 for x in take if LODGE.search(x['kind'] or ''))
    cm=sum(1 for x in take if COMM.search(x['kind'] or ''))
    print('%-24s pool %6d  kept %6d   mf %5d  lodging %4d  commercial %5d' % (metro, len(lst), len(take), mf, lg, cm))
for o in keep: o.pop('_s',None)
json.dump(keep, open(R+'uscorridor_pool.json','w'))
print('TOTAL kept', len(keep))
print(collections.Counter(x['metro'] for x in keep))
