"""Rank the second tranche and cut to 25,000 per area.

The ranking is deliberately simple and explainable — a user must be able to read a
record and see why it placed. Four things count: WHAT it is, HOW BIG it is, HOW CLOSE
it sits to the announced capital or to a campus, and HOW COMPLETE the record is.
A parcel selected by zoning alone scores below one whose use is actually recorded,
because the first is a permission and the second is a building.
"""
import os
import json, math, collections, re
R = os.path.dirname(os.path.abspath(__file__)) + os.sep
pool=json.load(open(R+'uscorridor_pool2_raw.json'))+json.load(open(R+'uscorridor_pool3_la.json'))
CORR=json.loads(open(R+'corridor_data.js').read().split('=',1)[1].rstrip(';\n'))
LAC=json.load(open(R+'la_college_metros.json'))
ALLC=json.load(open(R+'campus_enrollment.json'))

PROJ=[]
for m in CORR['metros']:
    for p in (m.get('projects') or []):
        if p.get('lat') and p.get('lng'): PROJ.append(p)
CAMP=[]
for m in CORR['metros']:
    for c in (m.get('campuses') or []) if isinstance(m.get('campuses'),list) else []:
        if c.get('lat') and c.get('lng'): CAMP.append(c)
for m in LAC['metros']:
    for c in (m.get('campuses') or []):
        if c.get('lat') and c.get('lng'): CAMP.append(c)
for c in ALLC:
    if c.get('lat') and c.get('lng'): CAMP.append(dict(name=c['name'], lat=c['lat'], lng=c['lng'],
        enrollment=c.get('enrollment'), type=c.get('type')))
    for p in (m.get('projects') or []):
        if p.get('lat') and p.get('lng'): PROJ.append(p)
seen=set(); C2=[]
for c in CAMP:
    k=(round(c['lat'],3),round(c['lng'],3))
    if k in seen: continue
    seen.add(k); C2.append(c)
CAMP=C2
print('projects', len(PROJ), 'campuses', len(CAMP))

def hav(a,b,c,d):
    t=math.pi/180; x=(c-a)*t; y=(d-b)*t
    h=math.sin(x/2)**2+math.cos(a*t)*math.cos(c*t)*math.sin(y/2)**2
    return 2*6371*math.asin(min(1,math.sqrt(h)))

MFRE=re.compile(r'apart|duplex|triplex|fourplex|multi|two family|three family|four family|multiple residence|townhouse|twin home|manufactured home park|accessory apartment|rooming',re.I)
LODGE=re.compile(r'hotel|motel|\binn\b|lodge|bed and breakfast|camp|cottage|bungalow|tourist cabin|accommodation|assisted living',re.I)
COMM=re.compile(r'commercial|office|retail|business|warehouse|shopping|bank|restaurant|store|market|industrial|manufacturing',re.I)
ZONED=re.compile(r'^zoned',re.I)
UNCL=re.compile(r'unclassified',re.I)

def score(o):
    s=0.0
    k=o.get('kind') or ''
    if MFRE.search(k): s+=34
    elif LODGE.search(k): s+=26
    elif COMM.search(k): s+=16
    # a zoning permission is weaker evidence than a recorded use
    if ZONED.search(k) and not o.get('units'): s-=9
    if UNCL.search(k): s-=13
    u=o.get('units') or 0
    if u: s+=min(24, math.log10(u+1)*20)
    best=None
    for p in PROJ:
        km=hav(o['lat'],o['lng'],p['lat'],p['lng'])
        if best is None or km<best[1]: best=(p,km)
    if best:
        p,km=best
        o['projKm']=round(km,2); o['projCo']=p.get('company'); o['projJobs']=p.get('jobs')
        s+=22*math.exp(-km/18)
        if p.get('jobs'): s+=min(8, math.log10(p['jobs']+1)*2.4)
    cb=None
    for c in CAMP:
        km=hav(o['lat'],o['lng'],c['lat'],c['lng'])
        if cb is None or km<cb[1]: cb=(c,km)
    if cb:
        c,km=cb
        o['campKm']=round(km,2); o['campName']=c.get('name'); o['campEnroll']=c.get('enrollment')
        e=c.get('enrollment') or 2000
        tw={'public4':1.0,'private4':0.95,'health':0.8,'community':0.55}.get(c.get('type'),0.85)
        s+=18*math.exp(-km/3.2)*min(1.0,(math.log10(max(1000,e))-2.8)/1.6)*tw
    if o.get('sqft'): s+=5
    if o.get('year'): s+=4
    if o.get('lot'): s+=3
    if o.get('beds'): s+=2
    if o.get('sale'): s+=2
    if o.get('price') and 40000<=o['price']<=25_000_000: s+=6
    return s

TARGET=33000
keep=[]
by=collections.defaultdict(list)
for o in pool: by[o['metro']].append(o)
for metro,lst in sorted(by.items()):
    for o in lst: o['_s']=score(o)
    lst.sort(key=lambda x:-x['_s'])
    take=lst[:TARGET]; keep.extend(take)
    mf=sum(1 for x in take if MFRE.search(x.get('kind') or ''))
    lg=sum(1 for x in take if LODGE.search(x.get('kind') or ''))
    cm=sum(1 for x in take if COMM.search(x.get('kind') or ''))
    zn=sum(1 for x in take if ZONED.search(x.get('kind') or ''))
    un=sum(1 for x in take if UNCL.search(x.get('kind') or ''))
    nearC=sum(1 for x in take if (x.get('campKm') or 99)<=1.6)
    print('%-36s pool %6d kept %5d | mf %5d lodge %4d comm %5d | zoned-only %5d unclassified %5d | walk-to-campus %4d'
          % (metro[:36], len(lst), len(take), mf, lg, cm, zn, un, nearC))
for o in keep: o.pop('_s',None)
json.dump(keep, open(R+'uscorridor_pool2.json','w'))
print('TOTAL kept', len(keep))
