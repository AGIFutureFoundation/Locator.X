"""Locator.X — third tranche: the three staged Louisiana college parishes plus the
widened conversion / development bands for five existing corridors.

Every layer keeps its own meaning and says what it cannot do:
  Tangipahoa LA  NO valuation, NO use class. purchase_price is an UNVERIFIED conveyance
                 consideration carrying a 99999900 sentinel on 20,785 rows.
  Lincoln LA     TotalValue is an assessor fair-market figure with NO STATED VINTAGE.
                 ParcelType is 22 undocumented codes and is NOT decoded. Use comes only
                 from a 2013 Ruston land-use join covering half the rows.
  Calcasieu LA   NO value of any kind. Zoning only, and 86% blind within 5 km of McNeese.
  Guilford NC    widened by ZONING, which this layer publishes in plain English.
  Franklin OH    condominium rental bands, previously excluded.
  Maricopa AZ    vacant + condo/townhouse bands, prefixes quoted from the AZ DOR manual.
  Onondaga NY    commercial, vacant and community-service bands. CEILING REACHED.
  Chatham GA     widened zoning bands; FMV_Building = 0 marks an unimproved site.
"""
import os
import json, collections, re
R = os.path.dirname(os.path.abspath(__file__)) + os.sep

def L(f):
    try: return json.load(open(R+f))
    except Exception as e: print('  !! missing', f, e); return []
def num(v):
    if v in (None,'',' ','NULL'): return None
    try:
        f=float(v); return f if f==f and abs(f)<1e12 else None
    except Exception: return None
def cap(s):
    s=(s or '').strip()
    if not s or s=='NULL': return None
    return ' '.join(w.capitalize() for w in s.split()) if s.isupper() else s

out=[]
def add(**k):
    if k.get('lat') is None or k.get('lng') is None: return
    if not (24<k['lat']<50 and -126<k['lng']<-66): return
    if not k.get('addr'): return
    out.append(k)

# ---------------------------------------------------- Tangipahoa (Hammond) apartments
n=0
for r in L('la_tangipahoa_apts.json'):
    name,addr,assess,ham,lat,lng=r
    add(addr=cap(addr) or cap(name), city='Hammond', zip=None,
        county='Tangipahoa Parish', state='LA', metro='Hammond, LA',
        lat=lat, lng=lng, kind='Apartment address point', units=None, price=None,
        sqft=None, lot=None, year=None, apn=(str(assess) if assess else None), zoning=None,
        band='apartment_inventory', name=cap(name),
        src=("Tangipahoa Parish Assessor's own ArcGIS server (tangis.tangipahoa.org), dedicated apartment "
             "point layer. NO PRICE IS SHOWN because this parish publishes no valuation of any kind. "
             "Read this layer for what it is: 1,922 address points resolving to only 158 distinct names "
             "and 143 distinct assessment numbers, of which 1,778 in-city points carry assessment 0 and "
             "no parcel join key, and 1,189 of those are named simply 'Apartments'. It is an address "
             "inventory, not a sized or valued complex inventory."))
    n+=1
print('tangipahoa apts   %6d' % n)

# ---------------------------------------------------- Tangipahoa parcels near campus
SLU=(30.5161,-90.4681)
import math
def hav(a,b,c,d):
    t=math.pi/180; x=(c-a)*t; y=(d-b)*t
    h=math.sin(x/2)**2+math.cos(a*t)*math.cos(c*t)*math.sin(y/2)**2
    return 2*6371*math.asin(min(1,math.sqrt(h)))
n=0; seenp=set()
for r in L('la_tangipahoa.json'):
    (pno,assess,owner,tname,ta1,ta3,addr,city,zp,ward,subd,subyr,tdate,pprice,ver,instr,
     tdist,ccd,mpa,tyear,area,lat,lng)=r
    if lat is None or lng is None: continue
    if hav(lat,lng,SLU[0],SLU[1])>8: continue
    if pno in seenp: continue
    seenp.add(pno)
    p=num(pprice)
    if p is not None and (p==99999900 or p<10000 or p>10_000_000): p=None
    add(addr=cap(addr), city=cap(city) or 'Hammond', zip=str(zp or '')[:5],
        county='Tangipahoa Parish', state='LA', metro='Hammond, LA',
        lat=lat, lng=lng, kind='Unclassified — this parish publishes no use class',
        units=None, price=None, sqft=None,
        lot=int(num(area)) if num(area) else None, year=None, apn=str(pno), zoning=None,
        sale=int(p) if p else None, band='campus_proximate', subdiv=cap(subd),
        src=("Tangipahoa Parish Assessor's own ArcGIS server (tangis.tangipahoa.org), %s roll — the "
             "strongest provenance of any Louisiana source in this catalogue and one of the thinnest "
             "datasets. NO ASSESSED OR MARKET VALUE IS PUBLISHED, so no price is shown. There is also no "
             "use class (the occupancy field is null on all 76,236 rows) and no building characteristics, "
             "so these parcels are included on CAMPUS PROXIMITY ALONE — within 8 km of Southeastern "
             "Louisiana University — and are labelled unclassified rather than guessed. Where a sale "
             "figure appears it is a recorded conveyance consideration that THE ASSESSOR MARKS UNVERIFIED "
             "ON EVERY ROW, and a 99999900 sentinel plus implausible extremes have been dropped." % (tyear or 'current')))
    n+=1
print('tangipahoa parcels%6d' % n)

# ---------------------------------------------------- Lincoln (Ruston / Grambling)
n=0; seenl=set()
for r in L('la_lincoln.json'):
    (pid,owner,mail,adr,zp,ptype,landv,impv,totv,assv,subd,strr,taxa,cama,sref,sdate,
     nlat,ngram,lu,luac,lat,lng)=r
    if lat is None or lng is None: continue
    if pid in seenl: continue
    seenl.add(pid)
    v=num(totv)
    if not v or v<15000: continue
    kind=('%s (Ruston 2013 land use)' % cap(lu)) if lu else 'Unclassified — no published key for this parish’s use codes'
    camp=[]
    if nlat: camp.append('Louisiana Tech')
    if ngram: camp.append('Grambling State')
    add(addr=cap(adr), city='Ruston' if nlat and not ngram else ('Grambling' if ngram and not nlat else 'Ruston'),
        zip=None, county='Lincoln Parish', state='LA', metro='Ruston, LA',
        lat=lat, lng=lng, kind=kind, units=None, price=int(v), sqft=None,
        lot=int(num(luac)*43560) if num(luac) else None, year=None, apn=str(pid), zoning=None,
        band=('use_2013' if lu else 'campus_proximate'), subdiv=cap(subd),
        src=("Lincoln Parish GIS District's own public server (maps.lincolnparish.org). Price shown is the "
             "assessor's TOTAL fair-market value, not a listing or sale price; the separate assessed figure "
             "is the Louisiana statutory taxable base. THE VALUATION VINTAGE IS NOT STATED ANYWHERE ON THIS "
             "LAYER. The parcel layer's own ParcelType field holds 22 two-letter codes with NO PUBLISHED KEY "
             "— the field has a null domain, the legend is empty, and no manual exists — so it is carried "
             "raw and DELIBERATELY NOT DECODED. Where a use appears it comes instead from the parish's "
             "Ruston land-use layer, WHOSE NEWEST SNAPSHOT IS 2013 and which covers only about half these "
             "parcels; the rest are included on proximity to Louisiana Tech and Grambling State alone. The "
             "parcel layer publishes no geometry, so every coordinate here comes from that land-use join."))
    n+=1
print('lincoln           %6d' % n)

# ---------------------------------------------------- Calcasieu (Lake Charles)
n=0; seenc=set()
for r in L('la_calcasieu.json'):
    (st,pin,name,paddr,a1,a2,assess,ward,zone,zdesc,prior,ordno,area,lat,lng)=r
    if lat is None or lng is None: continue
    if pin in seenc: continue
    seenc.add(pin)
    zd=(zdesc or '').strip()
    if zd.startswith('http'): zd=''
    blind = st!='zoned'
    kind=('Zoning not published by the parish — inside a municipality that zones its own land'
          if blind else ('Zoned %s' % cap(re.sub(r'^\(\w+\)\s*','',zd)) if zd else 'Zoned, district unstated'))
    add(addr=cap(paddr) or cap(a1), city='Lake Charles', zip=None,
        county='Calcasieu Parish', state='LA', metro='Lake Charles, LA',
        lat=lat, lng=lng, kind=kind, units=None, price=None, sqft=None,
        lot=int(num(area)) if num(area) else None, year=None, apn=str(pin),
        zoning=(zd or None), band=('zoned' if not blind else 'zoning_unknown_campus_proximate'),
        src=("Calcasieu Parish Police Jury GIS, the parish's own server. NO PRICE IS SHOWN because this "
             "layer publishes no assessed value, no market value and no sale price; it also carries no year "
             "built, no building area and no unit count, so multifamily can be LOCATED here but never SIZED "
             "or VALUED. Its zoning description is plain English where it exists, but 49%% of the parish and "
             "86%% of everything within 5 km of McNeese State reads only that the land is zoned by its local "
             "municipality — the source is blind precisely where this metro's student-housing thesis lives. "
             "Those blind parcels are kept as a separate, clearly labelled band on campus proximity alone. A "
             "City of Lake Charles zoning service was searched for and does not exist: the two ArcGIS Online "
             "'Calcasieu Parish Zoning' services are byte-identical parish-only extracts with no city class."))
    n+=1
print('calcasieu         %6d' % n)
json.dump(out, open(R+'uscorridor_pool3_la.json','w'))
print('LOUISIANA TOTAL', len(out))
print(collections.Counter(x['metro'] for x in out))
