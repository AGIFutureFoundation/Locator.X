"""Locator.X — the widened conversion / development bands for five corridors."""
import os
import json, collections, re, math
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

BANDNOTE=("This record comes from the WIDENED band of the corridor pull — stock that is not itself a "
          "multifamily building today but is conversion, subdivision or development context: condominium "
          "and townhouse inventory, vacant land inside districts that permit density, and large-lot "
          "residential where the district allows more. It is research context, not income inventory.")

# ------------------------------------------------------------ Guilford NC (20 cols)
n=0
for r in L('us_guilford2.json'):
    pin,addr,city,zp,lat,lng,cls,units,val,yr,sqft,ac,sale,saled,zon,bd,ba,bdesc,bcnt,band=r
    if not num(val) or num(val)<10000: continue
    k=(cls or 'Unclassified').strip()
    kind=cap(k)
    if 'VACANT' in k.upper(): kind='Vacant land'
    add(addr=cap(addr), city=cap(city) or 'Greensboro', zip=str(zp or '')[:5],
        county='Guilford', state='NC', metro='Greensboro-High Point, NC',
        lat=lat, lng=lng, kind=kind, units=int(units) if num(units) else None,
        price=int(num(val)), sqft=int(num(sqft)) if num(sqft) else None,
        lot=int(num(ac)*43560) if num(ac) else None,
        year=int(yr) if yr and 1700<yr<2030 else None, apn=str(pin), zoning=zon,
        beds=int(bd) if num(bd) else None, baths=int(ba) if num(ba) else None,
        sale=int(num(sale)) if num(sale) else None, band=band,
        src=("Guilford County (NC) tax parcels, gcgis.guilfordcountync.gov. Price is the county's TOTAL "
             "PROPERTY VALUE on the roll; a real recorded sale price is carried separately. This layer's "
             "ZONING field is fully self-documenting plain English, which is what makes a vacant-land and "
             "large-lot band defensible here — the district's own text states the permitted density, and "
             "nothing is inferred. Note the county spells the same concept both 'MULTI-FAMILY' and "
             "'MULTIFAMILY', and both spellings were matched. Large-lot parcels sitting in single-family-"
             "only districts were EXCLUDED, because those districts do not permit more. " + BANDNOTE))
    n+=1
print('guilford2     %6d' % n)

# ------------------------- Franklin / Maricopa / Onondaga / Chatham (16-17 cols)
SRC={
 'us_franklin2.json':('Franklin','OH','Columbus',
   "Franklin County Auditor parcel features (gis.franklincountyohio.gov). Price is the Ohio MARKET VALUE "
   "on the auditor's roll, not a listing or sale price. CLASSDSCRP is self-documenting, so every band here "
   "is built from literal published values. This tranche is the CONDOMINIUM RENTAL stock the first pull "
   "deliberately excluded — the largest single reserve in this metro. A separate plain 'CONDOMINIUM' class "
   "of 46,852 records also exists and was deferred, not missed. Floor area is absent on most condo units. "),
 'us_maricopa3.json':('Maricopa','AZ','Phoenix-Mesa-Chandler',
   "Maricopa County Assessor parcels (gis.mcassessor.maricopa.gov). Price is the assessor's FULL CASH "
   "VALUE, not a listing or sale price. Use class is the STATEWIDE Arizona DOR Property Use Code, and "
   "every prefix in this band was quoted from the published manual rather than guessed — condominium and "
   "townhouse stock is use code 07, whose fourth digit distinguishes conversions from apartments (07_3) "
   "and single-owner income-producing stock (07_9), and 87 is a manual-defined residential improvement on "
   "more than five acres. Address and city are populated on only about 71%% of this band because vacant "
   "land frequently has no situs address, and the year-built field on under 30%%. The layer's CITY_ZONING "
   "field reads the literal string 'CONTACT LOCAL JURISDICTION' on every row and is therefore useless — "
   "no zoning check is possible for this metro. "),
 'us_onondaga2.json':('Onondaga','NY','Syracuse',
   "New York State Tax Parcels Public layer (services6.arcgis.com), Onondaga County. Price is the NY FULL "
   "MARKET VALUE on the roll — an assessor estimate, not a sale or listing price. Classes are the NYS "
   "Department of Taxation and Finance property type codes. THIS METRO HAS REACHED ITS CEILING: after the "
   "widened bands, everything remaining in the county is class 210 one-family residence, and because this "
   "layer publishes no zoning field the 'district permits more' test cannot be evaluated at all, so that "
   "stock was deliberately not pulled rather than padded in. Worth knowing: the NYS 600 series contains no "
   "dormitory class — New York dorms sit inside the campus parcel or are coded as apartments. "),
 'us_chatham2.json':('Chatham','GA','Savannah',
   "Chatham County / SAGIS parcel digest (pub.sagis.org). Price is the Georgia FAIR MARKET VALUE, not a "
   "listing or sale price. This layer publishes no use class at all, so every record is selected by its "
   "ZONING description — what the district permits, not what stands there. Because there is no use field, "
   "an improvements-only fair market value of zero is the honest way to identify an unimproved development "
   "site, and that is how vacant sites are marked here. This layer carries NO building square footage "
   "anywhere. Bands overlap by design where a district description matches more than one theme. "),
}
# Arizona DOR major categories for the widened band, quoted from the published manual
# (azdor.gov PROPERTY_useCodeManual.pdf, p.9). Category 00 is VACANT LAND by subtype —
# without these labels the records carry raw PUC digits, which is both useless to read
# and invisible to any downstream test that needs to know a parcel is unimproved.
AZW={'001':'Vacant residential land','002':'Vacant commercial land','003':'Vacant industrial land',
     '004':'Vacant condominium land','007':'Vacant, incomplete subdivision parcel',
     '008':'Vacant manufactured-home land'}
def az_wide(puc):
    p=str(puc or '')
    if p[:3] in AZW: return AZW[p[:3]]
    if p[:2]=='00': return 'Vacant land (Arizona use code '+p+')'
    if p[:2]=='07':
        d=p[3:4]
        return ('Condominium or townhouse, converted from apartments or duplexes' if d=='3'
                else 'Condominium or townhouse, income producing under one owner' if d=='9'
                else 'Condominium or townhouse')
    if p[:2]=='87': return 'Residential improvement on more than five acres'
    return None

for f,(cty,st,metro,src) in SRC.items():
    rows=L(f); n=0
    for r in rows:
        pid,addr,city,zp,lat,lng,use,units,val,yr,sqft,lot,sale,saled,zon = r[:15]
        band=r[15] if len(r)>15 else 'widened'
        fmvb=r[16] if len(r)>16 else None
        if not num(val) or num(val)<10000: continue
        k=cap((use or '').strip()) or 'Unclassified'
        if f=='us_maricopa3.json':
            k=az_wide(use) or ('Arizona use code '+str(use))
        if f=='us_chatham2.json':
            k='Zoned '+k
            if num(fmvb) in (0,None) and 'vacant' not in k.lower(): k=k+' — no improvement value on the roll'
        add(addr=cap(addr), city=cap(city) or metro, zip=str(zp or '')[:5],
            county=cty, state=st, metro=(metro if ',' in metro else metro),
            lat=lat, lng=lng, kind=k, units=int(num(units)) if num(units) else None,
            price=int(num(val)), sqft=int(num(sqft)) if num(sqft) else None,
            lot=int(num(lot)) if num(lot) else None,
            year=int(num(yr)) if num(yr) and 1700<num(yr)<2030 else None,
            apn=str(pid), zoning=zon, sale=int(num(sale)) if num(sale) else None, band=band,
            src=src+BANDNOTE)
        n+=1
    print('%-14s%6d  (of %d raw)' % (f.replace('us_','').replace('.json',''), n, len(rows)))

# metro names must match the existing pool exactly
FIX={'Phoenix-Mesa-Chandler':'Phoenix-Mesa-Chandler','Columbus':'Columbus','Syracuse':'Syracuse','Savannah':'Savannah'}
for o in out: o['metro']=FIX.get(o['metro'], o['metro'])
json.dump(out, open(R+'uscorridor_pool4_wide.json','w'))
print('WIDENED TOTAL', len(out))
print(collections.Counter(x['metro'] for x in out))
print(collections.Counter(x['band'] for x in out).most_common(14))
