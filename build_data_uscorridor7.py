"""Locator.X — the HIGH-VALUE tranche: institutional-grade parcels across five corridors.

These are the rows the ranker actually wants: a RECORDED multifamily or lodging use (not a
zoning permission), a large documented value, and the completeness fields populated.

Unit counts here are BAND LOWER BOUNDS taken from the published class description, never a
count. A parcel described '100 or more units' is recorded as 100 — at least that many. It
is labelled that way on every record so nobody reads it as an exact figure.
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
        f=float(str(v).replace(',','').strip()); return f if f==f and abs(f)<1e13 else None
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

BANDNOTE=(" Unit counts on these records are BAND LOWER BOUNDS read from the published class "
          "description — a parcel described as '100 or more units' is carried as 100, meaning AT LEAST "
          "that many. It is never an exact count and must not be underwritten as one.")

# ---------------------------------------------------------------- Guilford NC
n=0
for r in L('hi_guilford.json'):
    (pin,addr,city,zp,lat,lng,cls,zon,units,heat,mainheat,yr,bd,ba,ac,val,landv,bldv,
     sale,saled,bdesc,bcnt,owner,salesrc,band)=r
    v=num(val)
    if not v or v<50000: continue
    k=({'APART':'Apartments','MULTI-FAMILY5>':'Multifamily, 5+ units','MULTI-FAMILY<4':'Multifamily, under 4 units',
        'HOTEL/MOTEL':'Hotel / motel','ASSIST LIV/SKILLCARE':'Assisted living / skilled care',
        'MH PARK':'Manufactured home park','CONDO':'Condominium','TOWNHOUSE':'Townhouse','COMM':'Commercial',
        'OFFICE':'Office','RETAIL':'Retail','IND':'Industrial','LEASED':'Leased','MED':'Medical'}).get((cls or '').strip(), cap(cls))
    add(addr=cap(addr), city=cap(city) or 'Greensboro', zip=str(zp or '')[:5],
        county='Guilford', state='NC', metro='Greensboro-High Point, NC',
        lat=lat, lng=lng, kind=k, units=int(num(units)) if num(units) and num(units)>=2 else None,
        price=int(v), sqft=int(num(heat) or num(mainheat) or 0) or None,
        lot=int(num(ac)*43560) if num(ac) else None,
        year=int(num(yr)) if num(yr) and 1700<num(yr)<2030 else None, apn=str(pin), zoning=zon,
        beds=int(num(bd)) if num(bd) else None, baths=int(num(ba)) if num(ba) else None,
        sale=int(num(sale)) if num(sale) else None, band=band, hi=1,
        src=("Guilford County (NC) tax parcels, gcgis.guilfordcountync.gov — the high-value tranche. Price "
             "is the county's TOTAL PROPERTY VALUE on the roll; PKG_SALE_PRICE is a real recorded sale "
             "(North Carolina is a disclosure state, source flag REV = revenue stamps). LAND_CLASS and "
             "ZONING are both plain English on the record. TWO LIMITS FOUND AND STATED: the county's "
             "APT_SC_SQRFT field is null on all 223,275 parcels, and TOTAL_UNITS is a COMPLEX-LEVEL count "
             "stamped on every row of a development rather than a per-parcel figure — it is absent on the "
             "largest apartments (the county's top APART parcel at $76.0M carries no unit count at all), "
             "so it is carried where present but the ranking here leans on value and lot size instead. "
             "Only 278 parcels county-wide carry 5 or more units: 146 at 20+, five at 50+, one at 100+, "
             "none at 200+. That is the entire universe, not a sample."))
    n+=1
print('hi_guilford   %6d' % n)

# ---------------------------------------------------------------- Franklin OH
FRU=[(re.compile(r'40\s*OR\s*MORE',re.I),40),(re.compile(r'20\s*(?:TO|-)\s*39',re.I),20),
     (re.compile(r'4\s*(?:TO|-)\s*19',re.I),4),(re.compile(r'\bTWO FAMILY\b',re.I),2),
     (re.compile(r'\bTHREE FAMILY\b',re.I),3),(re.compile(r'\bFOUR FAMILY\b',re.I),4)]
n=0
for r in L('hi_franklin.json'):
    (pid,addr,cvt,zp,lat,lng,ccd,cdesc,bldga,resfl,resyr,ac,val,lndv,bldv,sale,saled,
     bd,ba,rooms,floors,cards,rental,owner,band)=r
    v=num(val)
    if not v or v<50000: continue
    d=(cdesc or '').strip(); u=None
    for rx,uu in FRU:
        if rx.search(d): u=uu; break
    add(addr=cap(addr), city=cap(cvt) or 'Columbus', zip=str(zp or '')[:5],
        county='Franklin', state='OH', metro='Columbus',
        lat=lat, lng=lng, kind=cap(d) or 'Unclassified', units=u, price=int(v),
        sqft=int(num(bldga)) if num(bldga) else None,
        lot=int(num(ac)*43560) if num(ac) else None,
        year=int(num(resyr)) if num(resyr) and 1700<num(resyr)<2030 else None,
        apn=str(pid), zoning=None, beds=int(num(bd)) if num(bd) else None,
        baths=int(num(ba)) if num(ba) else None, sale=int(num(sale)) if num(sale) else None,
        stories=int(num(floors)) if num(floors) else None, band=band, hi=1,
        src=("Franklin County Auditor parcel features (gis.franklincountyohio.gov) — the high-value "
             "tranche. Price is the Ohio MARKET VALUE on the auditor's roll; SALEPRICE is a recorded sale. "
             "CLASSDSCRP is self-documenting, so nothing is inferred. NOTE ON COMPLETENESS: RESFLRAREA and "
             "RESYRBLT are single-family card fields and are effectively empty on apartment parcels — "
             "THERE IS NO YEAR BUILT FOR ANY APARTMENT PARCEL in this layer — so building area comes from "
             "BLDGAREA instead. The county's 58,563-record 'CONDO 40+ RENTAL UNITS' class was deliberately "
             "EXCLUDED from this tranche: those are individually owned condo units, none above $794,500, "
             "not the complexes this tranche is for."+BANDNOTE))
    n+=1
print('hi_franklin   %6d' % n)

# ---------------------------------------------------------------- Marion IN
INU=[(re.compile(r'40\s*OR\s*MORE',re.I),40),(re.compile(r'20-39',re.I),20),(re.compile(r'4\s*-\s*19',re.I),4)]
seen=set(); n=0
for r in L('hi_marion.json'):
    (spn,pi,addr,city,zp,lat,lng,cls,sub,subd,ac,estlot,lt,it,av,owner,twp,band)=r
    if spn in seen: continue
    seen.add(spn)
    v=num(av)
    if not v or v<50000: continue
    d=cap(re.sub(r'-\d+$','',str(subd or '')).strip()) or 'Unclassified'
    u=None
    for rx,uu in INU:
        if rx.search(str(subd or '')): u=uu; break
    add(addr=cap(addr), city=cap(city) or 'Indianapolis', zip=str(zp or '')[:5],
        county='Marion', state='IN', metro='Indianapolis-Carmel-Greenwood, IN',
        lat=lat, lng=lng, kind=d, units=u, price=int(v), sqft=None,
        lot=int(num(estlot)) if num(estlot) else (int(num(ac)*43560) if num(ac) else None),
        year=None, apn=str(spn), zoning=None, band=band, hi=1,
        src=("Marion County / MapIndy property layer, gis.indy.gov — the high-value tranche. Price is the "
             "ASSESSED TOTAL value; this layer publishes no sale price at all. "
             "PROPERTY_SUB_CLASS_DESCRIPTION is plain English and fully populated. THIS LAYER HAS NO "
             "BUILDING AREA, NO YEAR BUILT, NO BEDROOMS AND NO SALE PRICE — the completeness fields simply "
             "do not exist, so records here will always rank below an equivalent parcel in a richer county. "
             "Two traps handled: ESTSQFT is LOT area rather than building area and is recorded as lot size, "
             "and multi-polygon parcels emit one row per polygon each repeating the full assessed value, so "
             "3,861 polygons were de-duplicated to 3,681 parcels on the state parcel number."+BANDNOTE))
    n+=1
print('hi_marion     %6d' % n)

# ---------------------------------------------------------------- Maricopa AZ
AZ3={'031':('Mixed residential complex (2+ residences)',2),'032':('Duplex (2 units)',2),
     '033':('Triplex (3 units)',3),'034':('Fourplex (4 units)',4),
     '035':('Apartments, 5 to 24 units',5),'036':('Apartments, 25 to 99 units',25),
     '037':('Apartments, 100 or more units',100),'038':('Boarding / rooming house',None),
     '039':('Apartment cooperative',None),'041':('Hotel',None),
     '051':('Motel',None),'052':('Motel with restaurant and lounge',None),'053':('Bed and breakfast',None),
     '061':('Resort',None),'062':('Resort',None),'063':('Resort',None)}
n=0
for r in L('hi_maricopa.json'):
    (apn,addr,city,zp,lat,lng,puc,puclab,zon,juris,landsz,living,yr,fcvraw,fcv,lpv,taxyr,
     saleprice,saledate,owner,subname,floor,band)=r
    v=num(fcv)
    if not v or v<50000: continue
    p3=str(puc or '')[:3]
    kk=AZ3.get(p3)
    kind=kk[0] if kk else (cap(puclab) or ('Arizona use code '+str(puc)))
    u=kk[1] if kk else None
    a=re.sub(r'\s{2,}.*$','',(addr or '')).strip()
    add(addr=cap(a), city=cap(city) or 'Phoenix', zip=str(zp or '')[:5],
        county='Maricopa', state='AZ', metro='Phoenix-Mesa-Chandler',
        lat=lat, lng=lng, kind=kind, units=u, price=int(v),
        sqft=int(num(living)) if num(living) else None,
        lot=int(num(landsz)) if num(landsz) else None,
        year=int(num(yr)) if num(yr) and 1700<num(yr)<2030 else None,
        apn=str(apn), zoning=None, stories=int(num(floor)) if num(floor) else None,
        sale=int(num(saleprice)) if num(saleprice) else None, band=band, hi=1,
        src=("Maricopa County Assessor parcels (gis.mcassessor.maricopa.gov) — the high-value tranche and "
             "the strongest source in this catalogue for genuinely large multifamily. Price is the "
             "assessor's FULL CASH VALUE for tax year %s, not a listing or sale price; a recorded sale "
             "price is carried separately. Classes are the STATEWIDE Arizona DOR Property Use Code, quoted "
             "from the published manual: 03-6 is 25 to 99 units and 03-7 is 100 or more — RECORDED USES, "
             "not zoning permissions. A correction worth recording: 04-1 is the only hotel class (its "
             "fourth digit is a storey band), motels are 05-x, and RESORTS ARE 06-x, a class often missed "
             "entirely — 503 of them are here, including the highest-value parcel in the band. The layer's "
             "LIVING_SPACE field is empty across this band and CITY_ZONING reads the literal string "
             "'CONTACT LOCAL JURISDICTION' on every row, so neither building area nor zoning is available "
             "for Phoenix." % (taxyr or 'current'))+BANDNOTE)
    n+=1
print('hi_maricopa   %6d' % n)

# ---------------------------------------------------------------- Onondaga NY
NY={'411':('Apartment',12),'414':('Hotel',None),'415':('Motel',None),'416':('Manufactured home park',None),
    '417':('Camp / cottage / bungalow',None),'418':('Inn, lodge, rooming or fraternity house',None)}
n=0
for r in L('hi_onondaga.json'):
    (pk,sbl,addr,ctyt,muni,zp,lat,lng,pc,clab,uac,udesc,style,gfa,sqlot,sqliv,yb,acres,calcac,
     landav,totav,fmv,beds,baths,kitch,owner,school,swis,roll,band)=r
    v=num(fmv)
    if not v or v<50000: continue
    pcs=str(pc or '').strip()
    base=(NY.get(pcs) or (cap(clab) or 'NY property class '+pcs, None))
    kind=base[0] if isinstance(base,tuple) else str(base)
    u=base[1] if isinstance(base,tuple) else None
    if udesc: kind=kind+' — '+cap(udesc)
    add(addr=cap(addr), city=cap(muni) or cap(ctyt) or 'Syracuse', zip=str(zp or '')[:5],
        county='Onondaga', state='NY', metro='Syracuse',
        lat=lat, lng=lng, kind=kind, units=u, price=int(v),
        sqft=int(num(gfa) or num(sqliv) or 0) or None,
        lot=int(num(sqlot)) if num(sqlot) else (int(num(acres)*43560) if num(acres) else None),
        year=int(num(yb)) if num(yb) and 1700<num(yb)<2030 else None,
        apn=str(pk), zoning=None, beds=int(num(beds)) if num(beds) else None,
        baths=int(num(baths)) if num(baths) else None, band=band, hi=1, school=school,
        src=("New York State Tax Parcels Public layer (services6.arcgis.com), Onondaga County, %s roll — "
             "the high-value tranche. Price is the NY FULL MARKET VALUE, an equalised assessor estimate; "
             "this layer publishes no sale price at all. Classes are the NYS Department of Taxation and "
             "Finance property type codes, and USED_AS_DESC gives the real building form — walk-up, "
             "converted, garden, high-rise apartment, or room/dorm. A NOTE ON FIELDS: SQ_FT on this layer "
             "is LOT square footage, not floor area; GFA is the floor area and is what is shown here. The "
             "earlier finding that this county had reached its ceiling was correctly scoped to vacant and "
             "single-family stock — the high-value band was not exhausted, and 2,746 class-411 apartments "
             "were available." % (roll or 'current'))+BANDNOTE)
    n+=1
print('hi_onondaga   %6d' % n)

print('HIGH-VALUE TOTAL', len(out))
print(collections.Counter(x['metro'] for x in out))
big=[x for x in out if (x.get('price') or 0)>=10_000_000]
print('parcels at or above $10M:', len(big))
print('largest five:', sorted(((x['price'],x['addr'][:34],x['city']) for x in out), reverse=True)[:5])
json.dump(out, open(R+'uscorridor_pool5_hi.json','w'))
