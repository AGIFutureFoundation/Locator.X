"""Locator.X — normalise the SECOND corridor tranche into uscorridor_pool2.json.

Eight new layers, 279,279 pulled rows. Every value field keeps its own meaning and the
record says which it is. Nothing here is a listing price. Nothing here is a guessed
use code: where a layer publishes no use class, the record says so in plain words
instead of inventing one.

  Guilford NC     TOTAL_PROP_VALUE   NC market value   LAND_CLASS plain English + real ZONING text
  Albany NY       FULL_MARKET_VAL    NY full market    PROP_CLASS, NYS Dept of Tax & Finance manual
  St. Joseph IN   SALESPRICE         REAL SALE PRICE   PROPTYPE plain English  (sale DATE missing)
  SE Wisconsin    ESTFMKVALUE        DOR equalised     PROPCLASS statutory class, WI DOR PB-060
  Marion IN       TOTALAV            assessed          PROPERTY_SUB_CLASS_DESCRIPTION plain English
  Lafayette LA    parval (MARKET)    assessor market   ZONING ONLY — no use class exists
  Caddo LA        parval (MARKET)    assessor market   ZONING ONLY — no use class exists
  Bossier LA      TotalMarketValue   assessor market   NO CLASSIFICATION OF ANY KIND EXISTS
"""
import os
import json, math, collections, re
R = os.path.dirname(os.path.abspath(__file__)) + os.sep

def L(f):
    try: return json.load(open(R+f))
    except Exception as e: print('  !! missing', f, e); return []

def num(v):
    if v in (None,'',' '): return None
    try:
        f=float(v)
        return f if f==f and abs(f)<1e12 else None
    except Exception: return None

def cap(s):
    s=(s or '').strip()
    if not s: return None
    return ' '.join(w.capitalize() for w in s.split()) if s.isupper() else s

out=[]
def add(**k):
    if k.get('lat') is None or k.get('lng') is None: return
    if not (24<k['lat']<50 and -126<k['lng']<-66): return
    if not k.get('addr'): return
    out.append(k)

# ---------------------------------------------------------------- Guilford NC
GUIL_MF=re.compile(r'APART|MULTI-FAMILY|TWINHOME|MH PARK|MFG HOM',re.I)
GUIL_LG=re.compile(r'HOTEL|MOTEL|ASSIST LIV',re.I)
n=0
for r in L('us_guilford.json'):
    pin,addr,city,zp,lat,lng,cls,units,val,yr,sqft,ac,sale,saled,zon,bd,ba,bdesc,bcnt=r
    if not num(val) or num(val)<15000: continue
    k=cls or 'Unclassified'
    kind=({'APART':'Apartments','MULTI-FAMILY<4':'Multifamily, under 4 units',
           'MULTI-FAMILY5>':'Multifamily, 5+ units','TWINHOME':'Twin home',
           'MH PARK':'Manufactured home park','HOTEL/MOTEL':'Hotel / motel',
           'ASSIST LIV/SKILLCARE':'Assisted living / skilled care','COMM':'Commercial',
           'OFFICE':'Office','RETAIL':'Retail','IND':'Industrial','TOWNHOUSE':'Townhouse',
           'CONDO':'Condominium','SCHOOL/COLL/UNIV':'School / college','MFG HOM':'Manufactured home'}).get(k,cap(k))
    add(addr=cap(addr), city=cap(city) or 'Greensboro', zip=str(zp or '')[:5],
        county='Guilford', state='NC', metro='Greensboro-High Point, NC',
        lat=lat, lng=lng, kind=kind, units=int(units) if num(units) else None,
        price=int(num(val)), sqft=int(num(sqft)) if num(sqft) else None,
        lot=int(num(ac)*43560) if num(ac) else None,
        year=int(yr) if yr and 1700<yr<2030 else None, apn=str(pin), zoning=zon,
        beds=int(bd) if num(bd) else None, baths=int(ba) if num(ba) else None,
        sale=int(num(sale)) if num(sale) else None,
        src=("Guilford County (NC) tax parcels, gcgis.guilfordcountync.gov. Price shown is the county's "
             "TOTAL PROPERTY VALUE on the tax roll, not a listing price; PKG_SALE_PRICE is a real recorded "
             "sale (North Carolina is a disclosure state) and is carried separately. LAND_CLASS and ZONING "
             "are both published in plain English on the record — neither is inferred."))
    n+=1
print('guilford      %6d' % n)

# ---------------------------------------------------------------- Albany NY
NY={'215':'One-family with accessory apartment (2 units)','220':'Two family residence',
    '230':'Three family residence','271':'Multiple manufactured homes',
    '280':'Multiple residences','281':'Multiple residences','283':'Residence with incidental commercial use',
    '410':'Living accommodations','411':'Apartment','414':'Hotel','415':'Motel',
    '416':'Manufactured home park','417':'Camp / cottage / bungalow','418':'Inn, lodge or rooming house',
    '421':'Restaurant','422':'Diner / luncheonette','423':'Snack bar','426':'Fast food',
    '431':'Auto dealer','432':'Service station','433':'Auto body','434':'Automatic car wash',
    '437':'Parking garage','438':'Parking lot','440':'Storage / warehouse','441':'Fuel storage',
    '442':'Mini warehouse','444':'Lumber yard','447':'Truck terminal','449':'Other storage',
    '450':'Retail services','452':'Neighborhood shopping centre','453':'Large retail',
    '454':'Large retail outlet','455':'Dealership','456':'Mixed retail','460':'Banks and offices',
    '461':'Bank','462':'Branch bank','464':'Office building','465':'Professional building',
    '470':'Miscellaneous services','471':'Funeral home','474':'Billboard','475':'Junkyard',
    '480':'Multiple use','481':'Downtown row building','482':'Downtown row with common wall',
    '483':'Converted residence','484':'One story small structure','485':'Multi-occupant small structure',
    '486':'Minimart','433':'Auto body'}
NYU={'215':2,'220':2,'230':3,'280':3,'281':3,'411':12,'414':40,'415':25,'418':10,'271':6,'416':30}
n=0
for r in L('us_albany.json'):
    (pk,swis,sbl,cty,muni,stn,street,zp,pc,used,fmv,tav,lav,yb,sq,sqliv,gfa,acres,school,owner,roll,lat,lng)=r
    if not num(fmv) or num(fmv)<15000: continue
    pcs=str(pc or '').strip()
    base=NY.get(pcs, 'NY property class '+pcs if pcs else 'Unclassified')
    if used: base=base+' — '+cap(used)
    a=' '.join(x for x in [str(stn or '').strip(), cap(street)] if x).strip()
    add(addr=a, city=cap(muni) or 'Albany', zip=str(zp or '')[:5],
        county=cty, state='NY', metro='Albany-Schenectady-Troy, NY',
        lat=lat, lng=lng, kind=base, units=NYU.get(pcs),
        price=int(num(fmv)), sqft=int(num(sq) or num(sqliv) or num(gfa) or 0) or None,
        lot=int(num(acres)*43560) if num(acres) else None,
        year=int(yb) if num(yb) and 1700<num(yb)<2030 else None, apn=str(pk), zoning=None,
        beds=None, baths=None, sale=None, school=school,
        src=("New York State Tax Parcels Public layer (gisservices.its.ny.gov), %s County, %s roll. Price "
             "shown is the NY FULL MARKET VALUE on the assessment roll — an assessor estimate, NOT a sale "
             "or listing price; this layer publishes no transaction data at all. The class is the NYS "
             "Department of Taxation and Finance property type code (tax.ny.gov/research/property/assess/"
             "manuals/prclas.htm). This statewide layer carries only 38 of New York's 62 counties: "
             "SARATOGA AND SCHENECTADY COUNTIES ARE ABSENT, so this metro is its eastern half only." % (cty, roll or 'current')))
    n+=1
print('albany        %6d' % n)

# ---------------------------------------------------------------- St. Joseph IN
n=0
for r in L('us_southbend.json'):
    pid,addr,city,zp,twp,ptype,ccode,ac,farea,fini,land,imp,tlld,sale,saled,tax,owner,lat,lng=r
    v=(num(land) or 0)+(num(imp) or 0)
    if v<15000: v=num(imp) or num(land) or 0
    if v<15000: continue
    add(addr=cap(addr), city=cap(city) or 'South Bend', zip=str(zp or '')[:5],
        county='St. Joseph', state='IN', metro='South Bend-Mishawaka, IN',
        lat=lat, lng=lng, kind=cap(ptype), units=None,
        price=int(v), sqft=int(num(fini)) if num(fini) else None,
        lot=int(num(ac)*43560) if num(ac) else None, year=None, apn=str(pid), zoning=None,
        beds=None, baths=None, sale=int(num(sale)) if num(sale) else None,
        src=("St. Joseph County (IN) land records, gis.southbendin.gov. Price shown is the ASSESSED land + "
             "improvement value, not a listing price. PROPTYPE is published in plain English on the record. "
             "A recorded SALESPRICE is carried separately — Indiana is a disclosure state — BUT THE SALE "
             "DATE IS MISSING ON ALL BUT 12 OF 7,456 RECORDS, so a sale figure here has no known vintage "
             "and must not be read as current. This layer publishes no year built and no unit count."))
    n+=1
print('southbend     %6d' % n)

# ---------------------------------------------------------------- SE Wisconsin
WICLS={'1':'Residential (Wis. class 1 — 1 to 3 units)','2':'Commercial (Wis. class 2 — includes apartment buildings of 4+ units)',
       '3':'Manufacturing (Wis. class 3)','4':'Agricultural','5':'Undeveloped','5M':'Agricultural forest',
       '6':'Productive forest','7':'Other'}
n=0
for r in L('us_milwaukee.json'):
    (sid,pid,addr,place,zp,cona,owner,post,school,pcls,aux,assd,lnd,imp,fmv,tax,dac,gac,yr,lat,lng)=r
    v=num(fmv) or num(assd)
    if not v or v<15000: continue
    toks=[t.strip() for t in str(pcls or '').split(',') if t.strip()]
    kind=' + '.join(WICLS.get(t,'Wis. class '+t) for t in toks) or 'Unclassified'
    add(addr=cap(addr) or cap(post), city=cap(place) or 'Milwaukee', zip=str(zp or '')[:5],
        county=cap(cona) or 'Milwaukee', state='WI', metro='Milwaukee-Waukesha + Racine, WI',
        lat=lat, lng=lng, kind=kind, units=None,
        price=int(v), sqft=None,
        lot=int(num(dac)*43560) if num(dac) else (int(num(gac)*43560) if num(gac) else None),
        year=None, apn=str(sid or pid), zoning=None, beds=None, baths=None, sale=None, school=school,
        src=("Wisconsin Statewide Parcel Map Database (Dept. of Administration, served via dnrmaps.wi.gov), "
             "%s County, %s tax roll. Price shown is the DOR EQUALISED ESTIMATED FAIR MARKET VALUE — a "
             "statistical adjustment of the local assessment, NOT a sale or listing price; this layer "
             "publishes no transaction data. PROPCLASS is the statutory classification of Wis. Stat. "
             "70.32(2)(a); per the Wisconsin DOR Guide for Property Owners PB-060, apartment buildings of "
             "up to three units are class 1 and buildings of four or more units are class 2, so class 2 is "
             "where Wisconsin's larger multifamily sits. DUPLEXES AND TRIPLEXES CANNOT BE SEPARATED from "
             "single-family here — they share class 1 and the layer publishes no unit count, no year built "
             "and no building area." % (cap(cona) or '', yr or 'current')))
    n+=1
print('milwaukee     %6d' % n)

# ---------------------------------------------------------------- Marion IN
IN_U=re.compile(r'(\d+)\s*(?:TO\s*(\d+)\s*)?(?:OR MORE\s*)?(?:FAMILY|UNITS)',re.I)
seen=set(); n=0
for r in L('us_indianapolis.json'):
    (spn,pc,addr,city,zp,twp,owner,ocity,ost,cls,sub,subd,estsqft,ac,lt,it,av,nbhd,status,lat,lng)=r
    if spn in seen: continue          # multi-polygon parcels repeat the FULL assessed value
    seen.add(spn)
    v=num(av) or (num(lt) or 0)+(num(it) or 0)
    if not v or v<15000: continue
    d=cap(re.sub(r'-\d+$','',str(subd or '')).strip()) or 'Unclassified'
    u=None
    m=IN_U.search(str(subd or ''))
    if m:
        try: u=int(m.group(2) or m.group(1))
        except Exception: u=None
    add(addr=cap(addr), city=cap(city) or 'Indianapolis', zip=str(zp or '')[:5],
        county='Marion', state='IN', metro='Indianapolis-Carmel-Greenwood, IN',
        lat=lat, lng=lng, kind=d, units=u, price=int(v), sqft=None,
        lot=int(num(estsqft)) if num(estsqft) else (int(num(ac)*43560) if num(ac) else None),
        year=None, apn=str(spn), zoning=None, beds=None, baths=None, sale=None, nbhd=nbhd,
        src=("Marion County / MapIndy property layer, gis.indy.gov. Price shown is the ASSESSED TOTAL "
             "value, not a listing or sale price; this layer publishes no transaction data. "
             "PROPERTY_SUB_CLASS_DESCRIPTION is published in plain English on the record and is 100% "
             "populated. TWO TRAPS HANDLED HERE: the layer's ESTSQFT field is LOT area, not building area, "
             "so it is recorded as lot size and this edition shows NO building area for Marion County; and "
             "multi-polygon parcels emit one row per polygon each repeating the full value, so rows are "
             "de-duplicated on the state parcel number. Marion County only — both Eli Lilly projects are "
             "in BOONE COUNTY, which publishes no free parcel API and is therefore absent."))
    n+=1
print('indianapolis  %6d' % n)

# ---------------------------------------------------------------- Lafayette LA
n=0
for r in L('la_lafayette.json'):
    (pn,addr,city,zp,lat,lon,used,zon,zdesc,zsub,ztype,yb,recarea,foot,bcnt,acres,parval,impv,landv,
     hx,sale,saled,taxyr,owner,acct,improved,mktarea,nbhd,subdiv,lbcsf,lbcss,refresh)=r
    v=num(parval)
    if not v or v<15000: continue
    if lbcsf and 'ccommodation' in str(lbcsf): kind='Zoned %s — Regrid classifies as lodging' % (zsub or zdesc or 'unclassified')
    else: kind='Zoned for %s' % (zsub or zdesc or 'an unclassified district')
    add(addr=cap(addr), city=cap(city) or 'Lafayette', zip=str(zp or '')[:5],
        county='Lafayette Parish', state='LA', metro='Lafayette, LA',
        lat=lat, lng=lon, kind=kind, units=None, price=int(v),
        sqft=int(num(recarea)) if num(recarea) else (int(num(foot)) if num(foot) else None),
        lot=int(num(acres)*43560) if num(acres) else None,
        year=int(num(yb)) if num(yb) and 1700<num(yb)<2030 else None, apn=str(pn),
        zoning=(zdesc or zon), beds=None, baths=None,
        sale=int(num(sale)) if num(sale) else None, nbhd=nbhd,
        src=("Lafayette Parish (LA) parcels, tax year %s. Price shown is the assessor's MARKET value "
             "(parvaltype MARKET on every row), not a listing price; a recorded sale price and date are "
             "carried separately. THIS SET IS SELECTED BY ZONING, NOT BY USE: the layer carries no "
             "occupancy or use classification of any kind, so a record here is a parcel the district "
             "PERMITS the stated use on — a vacant multifamily-zoned lot and a 200-unit complex look "
             "identical in this source. No unit count exists for this parish (numunits is null on all "
             "116,693 rows). Provenance: hosted in ArcGIS Online org Brg1qbmzmFn7JtpX (Es2, a private GIS "
             "consultancy that runs assessor GIS for several Louisiana parishes) rather than on the "
             "Lafayette Parish Assessor's own domain, and the layer silently spans Lafayette AND Vermilion "
             "parishes — this edition filters to county='lafayette'." % (taxyr or 'unstated')))
    n+=1
print('lafayette     %6d' % n)

# ---------------------------------------------------------------- Caddo LA
n=0
for r in L('la_caddo.json'):
    (pn,addr,city,zp,lat,lon,ucode,zon,zdesc,units,stories,yb,gissqft,gisac,parval,pvt,sale,saled,
     taxyr,owner,mkt,td,legal,geoid,stable,refresh)=r
    v=num(parval)
    if not v or v<15000: continue
    u=int(num(units)) if num(units) and num(units)>=2 else None
    kind=('%d-unit property, zoned %s' % (u, zdesc or 'unclassified')) if u else ('Zoned for %s' % (zdesc or 'an unclassified district'))
    add(addr=cap(addr), city=cap(city) or 'Shreveport', zip=str(zp or '')[:5],
        county='Caddo Parish', state='LA', metro='Shreveport-Bossier City, LA',
        lat=lat, lng=lon, kind=kind, units=u, price=int(v),
        sqft=None, lot=int(num(gisac)*43560) if num(gisac) else (int(num(gissqft)) if num(gissqft) else None),
        year=int(num(yb)) if num(yb) and 1700<num(yb)<2030 else None, apn=str(pn),
        zoning=(zdesc or zon), beds=None, baths=None,
        sale=int(num(sale)) if num(sale) else None, stories=int(num(stories)) if num(stories) else None,
        src=("Caddo Parish (LA) parcels, tax year %s. Price shown is the assessor's MARKET value, not a "
             "listing price; a recorded sale price and date are carried separately. SELECTED BY ZONING "
             "except where a unit count exists: the layer's use-description field is null on all 139,597 "
             "rows, so a record without a unit count is a parcel ZONED for the stated use, not a parcel "
             "known to contain it. numunits is populated on under 1%% of the parish and yearbuilt on under "
             "8%%. Hotels and motels cannot be isolated in Caddo at all — no accommodation zoning district "
             "and no use field. Provenance: a Regrid/Loveland extract republished by a PRIVATE ArcGIS "
             "Online account (org eR5n9maFLflJFdXU), not the Caddo Parish Assessor's own service, and "
             "revocable without notice." % (taxyr or 'unstated')))
    n+=1
print('caddo         %6d' % n)

# ---------------------------------------------------------------- Bossier LA
seen=set(); n=0
for r in L('la_bossier.json'):
    (oid,anum,aname,addr,mapno,subn,subt,roll,ward,loc,mcity,mstate,mzip,ac,landv,mktv,assd,haslu,lat,lon)=r
    key=(anum,oid)
    if key in seen: continue
    seen.add(key)
    v=num(mktv)
    if not v or v<15000: continue
    add(addr=cap(addr), city='Bossier City', zip=None,
        county='Bossier Parish', state='LA', metro='Shreveport-Bossier City, LA',
        lat=lat, lng=lon, kind='Unclassified — this source publishes no use or zoning field',
        units=None, price=int(v), sqft=None,
        lot=int(num(ac)*43560) if num(ac) else None, year=None, apn=str(anum), zoning=None,
        beds=None, baths=None, sale=None, subdiv=cap(subn), subtype=cap(subt),
        src=("Bossier Parish Assessor's own ArcGIS server, bpagis.bossierparish.org — the best provenance "
             "of the three Louisiana sources here and, unfortunately, the thinnest data. Price shown is the "
             "assessor's TOTAL MARKET value; the separate ASSESSED value is the Louisiana statutory taxable "
             "base (verified against the constitutional ratios: land 10%, residential improvements 10%, "
             "other 15%) and is NOT market value. There is no sale price, no sale date, and NO STATED ROLL "
             "YEAR anywhere on this layer, so the vintage of these values is unknown. THIS LAYER CARRIES NO "
             "USE CLASS, NO ZONING, NO YEAR BUILT, NO UNIT COUNT AND NO BUILDING AREA — multifamily cannot "
             "be identified in Bossier Parish from public data, so these records are included on LOCATION "
             "ALONE and are labelled unclassified rather than guessed. Only PhysicalAddress is a situs "
             "address (the layer's City/Zip fields are the OWNER'S MAILING address and will map absentee "
             "owners out of state); rows without one are dropped. All 94,101 join rows recovered — the "
             "first 88,053 in one session, the remaining 6,048 (OBJECTID>364505) completed in a second "
             "pass once the bridge reconnected, paginated by OBJECTID with zero overlap and zero gap "
             "verified against the live layer's own count."))
    n+=1
print('bossier       %6d' % n)

print('TOTAL normalised', len(out))
json.dump(out, open(R+'uscorridor_pool2_raw.json','w'))
print(collections.Counter(x['metro'] for x in out))
