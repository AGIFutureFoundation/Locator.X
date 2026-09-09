"""Locator.X — Louisiana University Cities edition.

Source of record: the East Baton Rouge Parish 2025 tax roll published by the
City-Parish on data.brla.gov (resource myfc-nh6n), joined on assessment number
to the City-Parish GIS cadastre (maps.brla.gov, Cadastral/Tax_Parcel and
Cadastral/Adjudicated_Parcel) for situs address, flood zone and geometry.

Honest-labelling rules this file obeys:
  * `price` is the assessor's FAIR MARKET VALUE for the parcel, not a listing
    price and not a sale price. Louisiana assesses residential at 10% of fair
    market value; the roll's fair-market figure is the assessor's opinion of
    value, which is what we carry, labelled as such on every record.
  * There is no sale date in this roll, so priceDate is null everywhere and the
    score's basis modality falls back to its evidence floor. We do not invent one.
  * `units` is the improvement-line unit count on the roll. It is the number of
    assessed improvement units, which for residential property is the dwelling
    count; it is not a verified rentable-unit count.
  * The roll carries no residential/commercial use class, so class is inferred
    only from unit count and homestead status, and the inference is stated in
    the class definition rather than dressed up as a use code.
  * Adjudicated parcels are parcels the City-Parish took for unpaid taxes. That
    is a public record of distress, carried as a flag, not as a discount.
"""
import os
import json, collections, math
R = os.path.dirname(os.path.abspath(__file__)) + os.sep

roll = json.load(open(R+'br_roll_full.json'))
par  = json.load(open(R+'br_parcels.json'))
camp = json.load(open(R+'campus_enrollment.json'))

# ---------------- parcels ----------------
P={}
for a,addr,fz,ward,lat,lng in par['parc']:
    if not a or a=='000-0000-0' or lat is None: continue
    if a in P and P[a][0]: continue
    P[a]=(addr,fz,ward,lat,lng)
ADJ={r[0] for r in par['adj'] if r[0]}
print('parcels',len(P),'adjudicated',len(ADJ))

# ---------------- roll aggregation ----------------
AG={}
for a,fmv,units,ut,vac,hs,addr2,atype,tot,frz in roll:
    g=AG.get(a)
    if g is None:
        g=AG[a]={'fmv':0,'imp':0,'land':0,'units':0,'hs':'NO','addr2':addr2,'frz':frz,'lines':0,'pub':False}
    g['fmv']+=fmv or 0
    g['lines']+=1
    if ut=='IMPROVEMENT':
        g['imp']+=fmv or 0
        g['units']=max(g['units'], units or 0)
    else:
        g['land']+=fmv or 0
    if hs=='YES': g['hs']='YES'
    if atype=='PUBLIC SERVICE': g['pub']=True
print('roll assessments',len(AG))

# ---------------- ZIP assignment from parcel centroid ----------------
zg=json.load(open(R+'geo/la_zips.json'))
def bbox(coords):
    xs=[];ys=[]
    def walk(c):
        if isinstance(c[0],(int,float)): xs.append(c[0]); ys.append(c[1]); return
        for k in c: walk(k)
    walk(coords)
    return min(xs),min(ys),max(xs),max(ys)
ZP=[]
for f in zg['features']:
    z=f['properties'].get('ZCTA5CE10')
    gm=f['geometry']
    polys = gm['coordinates'] if gm['type']=='MultiPolygon' else [gm['coordinates']]
    for poly in polys:
        ring=poly[0]
        x0,y0,x1,y1=bbox(ring)
        # only Baton Rouge region ZIPs, keeps the point-in-polygon loop small
        if x1< -91.7 or x0> -90.6 or y1<30.15 or y0>30.85: continue
        ZP.append((z,x0,y0,x1,y1,ring,poly[1:]))
print('candidate zip rings',len(ZP))
def inring(x,y,ring):
    ins=False; n=len(ring); j=n-1
    for i in range(n):
        xi,yi=ring[i][0],ring[i][1]; xj,yj=ring[j][0],ring[j][1]
        if ((yi>y)!=(yj>y)) and (x < (xj-xi)*(y-yi)/((yj-yi) or 1e-12)+xi): ins=not ins
        j=i
    return ins
_zc={}
def zipfor(lat,lng):
    k=(round(lat,3),round(lng,3))
    v=_zc.get(k)
    if v is not None: return v
    for z,x0,y0,x1,y1,ring,holes in ZP:
        if lng<x0 or lng>x1 or lat<y0 or lat>y1: continue
        if inring(lng,lat,ring) and not any(inring(lng,lat,h) for h in holes):
            _zc[k]=z; return z
    _zc[k]=''
    return ''

# ---------------- campus proximity ----------------
LAC=[c for c in camp if c['state']=='LA']
def hav(a,b,c,d):
    t=math.pi/180; x=(c-a)*t; y=(d-b)*t
    h=math.sin(x/2)**2+math.cos(a*t)*math.cos(c*t)*math.sin(y/2)**2
    return 2*6371*math.asin(min(1,math.sqrt(h)))
TYPEW={'public4':1,'private4':0.95,'health':0.8,'community':0.55}
def cw(c):
    e=max(500, c['enrollment'] or 500)
    return (math.log10(e)-2.5)/1.5*TYPEW.get(c['type'],0.7)
def campus_pull(lat,lng):
    tot=0.0; near=None; nd=1e9
    for c in LAC:
        km=hav(lat,lng,c['lat'],c['lng'])
        if km>32: continue
        if km<nd: nd=km; near=c
        if km<=16: tot+=cw(c)*math.exp(-km/2.6)
    return min(1.0,tot), (near['name'] if near else None), (nd if near else None)

# ---------------- classify ----------------
def classify(u, hs, has_imp):
    if not has_imp:
        return ('Land only — no improvement on the roll', 1, 1)
    if u>=60:  return ('Apartments (60+ units on roll)', u, 0)
    if u>=25:  return ('Apartments (25–59 units on roll)', u, 0)
    if u>=13:  return ('Apartments (13–24 units on roll)', u, 0)
    if u>=5:   return ('Apartments (5–12 units on roll)', u, 0)
    if u==4:   return ('Fourplex (4 units on roll)', 4, 0)
    if u==3:   return ('Triplex (3 units on roll)', 3, 0)
    if u==2:   return ('Duplex (2 units on roll)', 2, 0)
    if hs=='YES': return ('Single improvement — homestead exemption on file', 1, 0)
    return ('Single improvement — no homestead exemption (non-owner-occupied)', 1, 0)

SRC_BASE=('East Baton Rouge Parish 2025 tax roll (data.brla.gov myfc-nh6n) joined on assessment '
          'number to the City-Parish cadastre (maps.brla.gov). Price shown is the assessor’s '
          'fair market value for the parcel, not a listing or sale price; this roll carries no sale date.')
SRC_ADJ =('East Baton Rouge Parish 2025 tax roll joined to the City-Parish cadastre. This parcel also '
          'appears on the parish ADJUDICATED list — taken by the City-Parish for unpaid taxes. Price '
          'shown is the assessor’s fair market value, not a listing or sale price.')

L=[]
seen=set()
for a,g in AG.items():
    if g['pub']: continue
    p=P.get(a)
    if not p: continue
    addr,fz,ward,lat,lng = p
    if not addr: continue
    price=int(g['fmv'])
    if price < 25000: continue
    has_imp = g['imp']>0
    kind,units,is_land = classify(g['units'], g['hs'], has_imp)
    z=zipfor(lat,lng)
    pull, cname, ckm = campus_pull(lat,lng)
    adj = a in ADJ
    absentee = bool(g['addr2']) and ('BATON ROUGE' not in (g['addr2'] or '').upper()) and g['hs']!='YES'
    # ranking: campus pull, investable (non-homestead), multi-unit, distress, absentee owner
    s = (0.34*pull
         + 0.20*(0 if g['hs']=='YES' else 1)
         + 0.22*min(1, math.log10(max(1,units))/1.4)
         + 0.14*(1 if adj else 0)
         + 0.10*(1 if absentee else 0))
    if is_land: s*=0.55
    L.append((s, dict(
        addr=' '.join(w.capitalize() for w in str(addr).split()),
        city='Baton Rouge', zip=z, county='East Baton Rouge', lat=lat, lng=lng,
        kind=kind, units=units, price=price, priceDate=None, sqft=None, apn=a,
        cv=1 if (units>=5 or 'Land only' in kind) else None, est=None,
        land=int(g['land']) or None, imp=int(g['imp']) or None,
        adj=1 if adj else None, fz=fz or None, ward=ward or None,
        campus=cname, ckm=(round(ckm,2) if ckm is not None else None),
        src=SRC_ADJ if adj else SRC_BASE)))
L.sort(key=lambda x:-x[0])
print('candidates',len(L))
keep=[x[1] for x in L]
print(collections.Counter(x['kind'] for x in keep).most_common(12))
print('adjudicated kept',sum(1 for x in keep if x['adj']))
print('with zip',sum(1 for x in keep if x['zip']))
json.dump(keep, open(R+'launi_pool.json','w'))
print('pool saved')
