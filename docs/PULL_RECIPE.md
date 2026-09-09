# Locator.X browser-pane parcel pull — proven recipe (2026-09-04)

Container egress to every county GIS host is BLOCKED (403 CONNECT). The ONLY route is
the desktop browser pane: `mcp__remote-devices__Claude_Browser__*`.

## HARD RULES
- NEVER fabricate a row, a coordinate, a price or a use class. If a layer fails, report
  zero rows and say exactly why. A stub file is worse than no file.
- NEVER guess a use code or a zoning district. Use only a field that is self-documenting
  (plain English) or a code you verified against a published manual you can cite.
- Assessor values are NOT listing or sale prices. Record which is which.

## STEP 1 — open a tab on an HTML page of the SAME ORIGIN
A `?f=json` URL renders as a raw JSON document and has NO JavaScript context: scripts
return undefined. Navigate to the layer's HTML page instead (the REST endpoint WITHOUT
`?f=json`), then all fetches are same-origin.

    tabs_create({url: "<endpoint URL, no ?f=json>"})   -> gives you a tabId

## STEP 2 — call the tool correctly
The tool takes `action` and `text` (NOT `code`). REPL semantics: top-level `await` works
and the LAST EXPRESSION is the return value — do NOT write `return`.

    javascript_tool({action:"javascript_exec", tabId:"tab-N", text:"1+1"})

## STEP 3 — learn the layer before pulling
    const B=location.origin+'<layer path>/query';
    const q=async(p)=>{const r=await fetch(B+'?'+new URLSearchParams(Object.assign({f:'json'},p)));return r.json();};
    const c=await q({where:"1=1",returnCountOnly:true});
    const g=await q({where:"1=1",groupByFieldsForStatistics:"<CLASS FIELD>",
      outStatistics:JSON.stringify([{statisticType:"count",onStatisticField:"OBJECTID",outStatisticFieldName:"n"}]),
      returnGeometry:false});
    JSON.stringify({count:c.count, classes:(g.features||[]).map(f=>[f.attributes['<CLASS FIELD>'],f.attributes.n]).sort((x,y)=>y[1]-x[1]).slice(0,80)})

`returnDistinctValues` often 400s; groupByFieldsForStatistics is reliable.
Field list + maxRecordCount: `await (await fetch(location.origin+'<layer>?f=json')).json()` then map `.fields`.

## STEP 4 — paged pull driver (paste once per tab)
    window.LXPULL={rows:[],done:false,err:null,pages:0};
    window.lxrun=async function(cfg){
      const S=window.LXPULL; S.rows=[];S.done=false;S.err=null;S.pages=0;
      const step=cfg.step||2000; let off=0;
      try{
        while(true){
          const p=Object.assign({f:'json',where:cfg.where,outFields:cfg.fields,returnGeometry:cfg.geom?'true':'false',
            outSR:4326,resultOffset:off,resultRecordCount:step,orderByFields:cfg.order||'OBJECTID'},cfg.extra||{});
          let j=null,tries=0;
          while(tries<4){ try{ const r=await fetch(cfg.url+'?'+new URLSearchParams(p)); j=await r.json(); if(!j.error) break; }catch(e){}
            tries++; await new Promise(x=>setTimeout(x,1200*tries)); }
          if(!j||j.error){ S.err=JSON.stringify(j&&j.error||'fetch failed')+' @off '+off; break; }
          const fs=j.features||[];
          for(const f of fs){
            const a=f.attributes; let ll=null;
            if(f.geometry){
              if(f.geometry.x!=null) ll=[f.geometry.x,f.geometry.y];
              else if(f.geometry.rings){ let sx=0,sy=0,n=0; for(const r of f.geometry.rings) for(const pt of r){sx+=pt[0];sy+=pt[1];n++;}
                if(n) ll=[+(sx/n).toFixed(6),+(sy/n).toFixed(6)]; }
            }
            S.rows.push(cfg.map(a,ll));
          }
          S.pages++;
          if(fs.length<step || fs.length===0) break;
          off+=fs.length;
          if(off>(cfg.cap||400000)) break;
        }
      }catch(e){ S.err='EX '+e.message; }
      S.done=true; return S.rows.length;
    };
    'driver ready'

Launch (returns immediately; poll):
    window.lxrun({url:..., where:..., fields:"A,B,C", geom:true, step:<maxRecordCount>,
      map:(a,ll)=>[a.PIN, a.ADDR, ..., ll?ll[1]:null, ll?ll[0]:null]});
    'launched'
Poll:
    JSON.stringify({n:LXPULL.rows.length,pages:LXPULL.pages,done:LXPULL.done,err:LXPULL.err})

NOTE on geometry: most parcel layers have no lat/lng attribute fields. Request
`geom:true` — the driver averages the polygon ring to a centroid IN THE BROWSER and
throws the polygon away, so nothing heavy crosses the bridge. If the layer DOES publish
lat/lng attributes (e.g. Maricopa LATITUDE/LONGITUDE), use `geom:false` and read them
from the attributes instead — much faster.

## STEP 5 — transfer (gzip + base64, 240,000-char slices)
    window.lxpack=async function(rows){
      const s=new Blob([JSON.stringify(rows)]).stream().pipeThrough(new CompressionStream('gzip'));
      const b=new Uint8Array(await new Response(s).arrayBuffer());
      let t=''; const C=8192; for(let i=0;i<b.length;i+=C) t+=String.fromCharCode.apply(null,b.subarray(i,i+C));
      window.__B=btoa(t); return {rows:rows.length, b64:window.__B.length, slices:Math.ceil(window.__B.length/240000)};
    };
    JSON.stringify(await window.lxpack(LXPULL.rows))

Then, one call per slice — each WILL exceed the bridge cap and auto-save to a file whose
path the error message names. That is expected and is the transport, not a failure:
    window.__B.slice(0,240000)
    window.__B.slice(240000,480000)
    ... last one: window.__B.slice(N*240000)

Record each saved path in order. Then in the container:
    python3 /root/bayarea/grab.py <saved-path> /root/bayarea/pull/<name>.<i>

`grab.py` json-parses the saved envelope, takes text[0] between the first and last
double-quote, and strips non-base64 characters. Do NOT hand-slice the raw file: the
envelope's own `"type"`/`"text"` keys are alphanumeric and survive a naive regex.

Reassemble and ASSERT the length:
    python3 -c "
    import base64,gzip,json
    s=''.join(open('/root/bayarea/pull/<name>.%d'%i).read() for i in range(<K>))
    assert len(s)==<b64 length reported by lxpack>, len(s)
    rows=json.loads(gzip.decompress(base64.b64decode(s)))
    print(len(rows), rows[0])
    json.dump(rows,open('/root/bayarea/us_<name>.json','w'))"

Every intermediate slice must be exactly 240,000 characters except the last.

## STEP 3b — the 45-second tool timeout (learned the hard way)
A slow query (a groupBy over 350k parcels can take 60s) will time out the tool and look
exactly like an empty or broken field. It is neither. NEVER conclude a field is
unpopulated from a timeout. Launch async into a window variable and poll:

    window.__q=null;
    (async()=>{ try{ const r=await fetch(URL); window.__q=await r.json(); }
                catch(e){ window.__q={error:String(e)}; } })();
    'launched'
then, in later calls:
    window.__q ? JSON.stringify(window.__q).slice(0,4000) : 'pending'

This resolved Indianapolis, where four prior attempts had wrongly written off a field
that turned out to be 100% populated.

## KNOWN FAILURE MODES
- The browser pane can crash and destroy every tab. Pulled rows live only in page memory,
  so transfer each layer as soon as it finishes; do not batch several layers before
  transferring.
- A `where` clause longer than a URL will make the server return an HTML error page.
  POST the query instead of GET.
- `groupByFieldsForStatistics` returns a null count on some services (NYS). Fall back to
  one `returnCountOnly` call per group.
- A parcel with multi-part geometry emits ONE ROW PER POLYGON, each repeating the full
  assessed value. De-duplicate on the parcel key before summing anything.

## ADDITIONS (2026-09-04, corridor expansion pull)
- The bridge caps a returned string at ~240,300 chars, so `__B.slice(N,N+240000)` always
  overflows to a file — including the LAST slice unless it happens to be short. When the
  tail is short, call `window.__B.slice(window.__B.length-240000)` instead and take its
  last `(total - N*240000)` characters. Never retype an inline tail by hand.
- `LENGTH()` is NOT supported in a `where` on ArcGIS hosted feature services (NYS layer
  400s). Use an explicit `IN (...)` list built from the groupBy result instead.
- Maricopa `MapServer/0` has the Services Directory disabled — the HTML page renders an
  error but is still same-origin, so `/query` and `?f=json` both work from it.
- NYS `PRINT_KEY` is unique only WITHIN a municipality. Key Onondaga/Albany parcels on
  (PRINT_KEY, CITYTOWN_NAME), never PRINT_KEY alone.
- Guilford `PIN` is likewise not unique — the same PIN appears on separate lots in one
  subdivision, at different addresses and centroids.
- On the NYS_Tax_Parcels_Public FeatureServer/1, `COUNTY_NAME` IS reliable: for Onondaga
  it is exactly congruent with `SWIS LIKE '31%'` (181,909 both ways, zero either-way
  discrepancy). The SWIS-prefix workaround is only needed on the sibling MapServer.
- A pattern-defined band set is not automatically disjoint. Chatham `ZONE_DESC` strings
  such as "Planned Unit Development Institutional" match two band patterns, so 407 PINs
  carry two rows with different band labels. Treat the band column as a multi-label.

## ADDITIONS (2026-09-04, high-value / high-unit-count pull)
Field-level corrections found by running the "richest schema" bands. Each was verified by
a count or a groupBy against the live endpoint, not inferred.

- **Guilford `APT_SC_SQRFT` is 100% NULL** — `count` on the field returns 0 non-null over
  all 223,275 parcels. It is in the schema and carries no data. Do not plan around it.
- **Guilford `TOTAL_UNITS` is not a per-parcel apartment unit count.** Max county-wide is
  110; only 316/3,426 rows in the high-value band have it. It is a COMPLEX-level count
  repeated onto every row of the complex (one condo development shows 36 on each of its
  unit rows), and it is absent on the largest apartments — the $76M, 2024-built, 24.8-acre
  `APART` parcel has TOTAL_UNITS = null. Rank Guilford on TOTAL_PROP_VALUE + ACREAGE, not
  on TOTAL_UNITS. `LAND_CLASS` is plain English and is the reliable use field.
- **Franklin `RESFLRAREA` and `RESYRBLT` are single-family-only cards.** Across the 12,397
  apartment/commercial rows, RESFLRAREA is 0% populated and RESYRBLT is 5%. `BLDGAREA`
  (74%) is the only floor-area field that works for apartments, and there is NO year-built
  for an apartment parcel in this layer.
- **Franklin `CLASSCD` is the Ohio DTE land-use code** and uses the SAME 401/402/403/410/
  411/419 numbering as Marion County IN. Prefix 3=industrial, 4=commercial, 5=residential,
  6=exempt, 1=agricultural. Filtering `CLASSCD LIKE '3%' OR '4%'` is cleaner than a
  CLASSDSCRP string list.
- **Franklin `CONDO 40+ RENTAL UNITS` (58,563 rows) are individually-owned condo units,
  not complexes.** ZERO of them reach $2M; the maximum is $794,500. Including that class
  floods a pull with 58k small units. Excluded deliberately.
- **Franklin `X_COORD`/`Y_COORD` are Ohio State Plane feet, not lat/lon.** Use geom:true.
- **Marion has no building area, no year built, no bedrooms and no sale price at all.**
  The layer's only completeness fields are ACREAGE (a STRING) and the assessed values.
  ESTSQFT is lot area (trap confirmed). Multi-polygon duplication confirmed: 3,861
  polygons collapsed to 3,681 parcels on STATEPARCELNUMBER.
- **Maricopa `04-2` is not a separate hotel class.** Per the ADOR manual, HOTELS is
  `04-1` only, with 4th-digit variants 0/1/2/8 (0=default, 1=2-4 stories, 2=5+ stories).
  A filter of "041x/042x" happens to work but for the wrong reason. MOTELS are `05-x`
  (05-1 motel, 05-2 motel w/ restaurant, 05-3 B&B) and RESORTS are `06-x` — 503 resort
  parcels, including the single highest-value parcel in the band at $280M.
- **Maricopa `FCV_CUR` is a string with embedded commas AND leading spaces**: `"  39,490,000"`.
  Server-side `CAST(FCV_CUR AS FLOAT)` DOES work correctly on this service (cross-checked:
  2,712 both server-side and by client-side comma-stripping). Safer pattern is still to
  keep the raw string and add a parsed numeric column beside it.
- **Maricopa `LIVING_SPACE` is 0% populated** (31/13,732) — but `CONST_YEAR` is 100% and
  `SALE_PRICE` 50%, so the layer is far richer than "LATITUDE/LONGITUDE + FCV".
- **Onondaga `SQ_FT` is LOT square footage, not floor area.** `GFA` is the gross floor
  area (89% populated in the 4xx band). The brief's "SQ_FT / GFA" wording conflates them.
  `USED_AS_DESC` is a plain-English use string ("Highrise apt", "Garden apt", "Walk-up
  apt", "Room/dorm") and is the best in the catalogue for describing multifamily form.
- Onondaga `COUNTY_NAME='Onondaga'` re-verified at 181,909 on FeatureServer/1.

## ADDITIONS (2026-09-05, five-corridor pull: Wake / Tippecanoe / Utah Co / Mahoning / NM ABQ)

- **Wake MapServer returns NULL for EVERY statistic, not just count.** `outStatistics` with
  count/sum/max all come back null on `Property/Parcels/MapServer/0`. The sibling
  **`Property/Parcels/FeatureServer/0` returns correct counts** (cross-checked against 24
  per-value `returnCountOnly` calls: exact match on all 24). Always try the FeatureServer
  sibling before falling back to one count call per group.
- **Wake `TOTUNITS`/`UNITS` is NOT a dwelling-unit count.** It is a billing/appraisal unit
  count of any kind. The highest values county-wide are a HIGH-RISE OFFICE (1,902 at 201
  MetLife Way), a Public Storage MINI-WAREHOUSE (1,360), a state MUNICIPAL BUILDING (1,319)
  and Wake Tech (1,296 - a SCHOOL). `TOTUNITS>=20` alone returns 1,454, of which 433 are
  non-residential. It is only a real unit count when ANDed with a residential
  `TYPE_USE_DECODE`/`LAND_CLASS_DECODE`.
- Wake has **no bedroom or bathroom field**. `HEATEDAREA` is the only floor area.
- Wake `LAND_CLASS_DECODE` has **24 values, not 18**; the missing ones include `Apartment`
  (1,074), `Commercial` (6,560), `Condominium` (45), `Acres Greater Than 10 With House` (879),
  `Acre With Improvement, No House` (1,031), `State Assessed` (402).
- Wake `TYPE_USE_DECODE` full 110-value distribution obtained from the FeatureServer:
  `GRDN APT` 829, `ELEV APT` 281, `THSE APT` 70, `TWOFAM` 2,224, `FOURFAM` 514, `THREEFAM` 387,
  `RES CONV` 307, `MUTFAM` 33, `STOR/APT` 32, `OFC/APT` 12, `ST/OFC/A` 8; hotels are the
  `H/M-*` family (`H/M-LIMT` 111, `H/M-ES` 21, `H/M-FULL` 17, `H/M-HR` 9, `H/M-INDE` 6).
  The `H/M-` suffixes are NOT documented anywhere public - treat the family as lodging and
  keep the raw string.
- Wake `TOTAL_VALUE_ASSD` is **0 on HOA and Condo-Complex shell parcels** (the Dillon,
  Tower 4 at 4200 Six Forks); their value sits on the individual unit rows.
- **Tippecanoe `Assessor2/MapServer/200` "Sales Current Year" is not current: it is 2020.**
  Measured: layer 200 SoldDate spans 2020-01-01 to 2020-10-22; layer 210 "Sales Past" spans
  2017-01-31 to 2019-12-31. The whole sales history available is 2017-2020, six years stale.
  SoldDate is 100% populated (16,574/16,574); SoldPrice on 15,835 (95.5%).
- Tippecanoe sales join: `Sales.ParcelNumber` == parcel layer `STKEY` == `StKeyFull` with
  punctuation stripped (verified: STKEY='791525400006000007' returns exactly 1 parcel).
  Note the sales layers use a DIFFERENT `mpropertyclass` vocabulary from the parcel layer
  ("Res-1-Family 0 - 9.99 acres" vs "1 Family Dwell - Platted Lot").
- Tippecanoe SoldPrice is a **document price repeated onto every parcel in a multi-parcel
  deed** - one $48,375,000 Willowbrook portfolio deed appears on many rows.
- Tippecanoe parcel layer is heavily multi-polygon: 40,634 polygon rows collapse to 30,852
  distinct StKeyFull + 515 null-key rows. `PIN` is null on 7,431 parcels; `StKeyFull` on 515.
  `mtransferDate` IS current (max 2025-11-03) even though the sales layers stop in 2020.
- **Utah County `YEARBLT_RES` is worthless for apartments**: populated on 18 of 718
  `APARTMENTS` parcels (2.5%). `YEAR_BUILT_1` is populated on 675 (94%). Use YEAR_BUILT_1
  for anything non-single-family.
- Utah County `PROP_TYPE_DESCR` has **37 values**, including three the earlier study missed
  and which matter most: `LODGING` 126, `STUDENT HOUSING` 114, `MULTIPLE UNIT MIX` 37,
  plus `MOBILE HOME PARK` 57 and `OFFICE >50,000 sf` 96.
- **Utah County `TOTAL_UNIT_COUNT` is not a room count on LODGING parcels.** 1240 E 800
  North, Orem shows 3,525 "units" in 83,568 sq ft on 2 acres. It is trustworthy on
  APARTMENTS / STUDENT HOUSING / SUBSIDIZE HOUSING (max 478, median 12).
  On CONDO rows it is the COMPLEX unit count repeated onto every individual unit row.
- Utah County `ASMT_YEAR` is **2027** on 36,333 of 36,350 rows - the roll is the 2027 tax year.
- **Ohio DTE land-use codes are published as Ohio Administrative Code Rule 5703-25-10**
  (https://codes.ohio.gov/ohio-administrative-code/rule-5703-25-10). It defines ONLY the
  round codes: 401 "Apartments - 4 to 19 rental units", 402 "20 to 39", 403 "40 or more",
  410 "Motels and tourist cabins", 411 "Hotels", 412 "Nursing homes and private hospitals",
  415 "Trailer or mobile home park", 416 "Commercial camp grounds", 419 "Other commercial
  housing", 500/510/520/530/550/560, 300-399 industrial, 400 "Commercial - vacant land",
  600s exempt. **The single-digit variants counties add (404-409, 413, 414, 417, 501, 508,
  511, 512, 518, 521, 528, 531, 538, 540, 598 ...) are NOT in the state rule** - Mahoning has
  many. Band those by prefix only and label them not-use-verified.
- Mahoning `SALEDATE` is populated on 100% of rows but most carry `SALEAMOUNT=0`; every
  priced sale IS dated (71,769 priced / 71,769 dated, 0 price-without-date). 355 of 35,292
  pulled rows carry an implausible date (1889 ... 9999); only 1 of those has a price.
- **Trumbull County remains completely unreachable** (2026-09-05). `webgis.co.trumbull.oh.us`,
  `gis.co.trumbull.oh.us` and `property.co.trumbull.oh.us` are all refused by the browser
  pane. The whole `*.co.trumbull.oh.us` domain, not just the expired-cert host.
- **BERNALILLO COUNTY HAS ITS OWN ASSESSOR ARCGIS SERVER AND IT IS GOOD.**
  `https://assessormap.bernco.gov/server/rest/services/GIS/Assessor_Parcels_Public/MapServer/0`
  - 257,283 parcels, 79 fields, no token, maxRecordCount 2000. It carries LANDVALUE /
  IMPTVALUE / TOTVALUE / NETTAXABLE (99.9% populated), `LUC_MSG` (a 152-value plain-English
  use description, 100% populated, with `LOW RISE APARTMENTS O4U (TO 3 STY)` 1,279,
  `HIGH RISE APARTMENTS O4U (OVER 3 STY)` 43, `MULTIFAMILY RES U4U` 4,211, `HOTEL/MOTEL
  LOW RISE` 115, `HOTEL/MOTEL HI RISE` 47, `MOBILE HOME PARK` 228), `C_DESCR` (commercial
  class, 12,325), `DWEL_YRBLT` (208,804) and `COM_YRBLT` (12,325), `PAR_CALCAC`, `STYLE`.
  The previous study's conclusion that Bernalillo has "no value, no year built, no use
  description" was drawn from the WRONG SERVER. Siblings worth knowing: folders
  `Commercial_Sales` (empty of services) and `Enterprise_Assessment_And_Tax`
  (`Public_Access_Parcel_Data_EAT/MapServer/0`, 256,034 rows, 53 fields, values but no LUC).
  Still NO sale price and NO sale date - New Mexico remains non-disclosure.
- **The NM OSE statewide layer has NO latitude/longitude fields.** The 84-field schema on
  `County_Parcels_2025/MapServer/23` (Sandoval) contains no lat/lon column; a query on
  `latitude` 400s. Request geometry. `StructureCount` is 0% populated in Sandoval.
- Sandoval County (OSE layer 23) has NO usable use class at all: `LandUseDescription` is
  the NM statutory valuation class only (`0200 - NON-RESIDENTIAL LAND` 87,219,
  `0100 - RESIDENTIAL LAND` 53,654), `CountyImprovementDescription` is blank on 147,293 and
  null on 2,469 (100% empty), `StructureType` 100% empty. No apartment can be identified.
