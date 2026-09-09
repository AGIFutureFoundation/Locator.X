"""Emit sig2 distress-data layers: sig2_nola.js (sheriff foreclosure + open code-case
address sets, normalized), sig2_bay.js (SF eviction ZIP aggregates, 24-mo), and
sig2_launi.js (Baton Rouge). All three also carry a 'reo' block: federal HUD FHA
REO (government-owned foreclosed) inventory, pulled live from HUD's public ArcGIS
REST endpoint (egis.hud.gov/.../REOProperties/MapServer/0 — no auth, no PII, case
number + address only) and filtered to a hand-verified list of case numbers that
fall inside each edition's actual covered counties/parishes (matched by address,
not by city-name string matching, to avoid false positives from same-named cities
in other states)."""
import json, re
R = os.path.dirname(os.path.abspath(__file__)) + os.sep

# Hand-verified HUD FHA REO case numbers that fall inside each edition's coverage,
# checked one by one against real city/ZIP against the county/parish boundaries this
# platform actually covers (see hud_reo.json for the full national pull this is
# drawn from, and the research notes in foreclosure_sources.json for how the source
# was vetted). Pulled/verified 2026-09-07.
REO_BAY_CASES = {'042-858553','042-859501','042-846462'}       # SF, South SF (San Mateo), Richmond (Contra Costa)
REO_NOLA_CASES = {'221-413221','221-446142','221-361377',       # Orleans (New Orleans)
                   '221-509086','221-449358','221-391246','221-250035','221-396666','221-457216'}  # Jefferson (Harvey/Marrero/Westwego)
REO_LAUNI_CASES = {'221-511422','221-423459'}                   # East Baton Rouge (Baton Rouge)

# US Growth Corridors (uscorridor.html / usnew5.html / uswide.html) — same method,
# applied across all 15 covered metros. Matched by STATE_CODE + CITY against each
# metro's real constituent cities (not a metro-name string match), verified 2026-09-07.
# Two of the fifteen metros (Guilford County NC / Greensboro-High Point, and Lincoln
# Parish LA / Ruston) returned zero matching cases in this national pull — reported
# as zero, not padded; a metro with no hits here is "unmeasured," not "clean."
REO_USCORRIDOR_CASES = {
  # Maricopa AZ (Phoenix-Mesa-Chandler) — 8
  '023-293980','023-359434','023-495362','023-559518','023-563027','023-582978','023-591622','023-254312',
  # Franklin + Licking OH (Columbus / Newark) — 15
  '413-493311','413-464942','413-497388','413-432917','413-493812','413-494060','413-506440','413-495953',
  '413-483951','413-469380','413-377076','413-406366','413-595423','413-527526','413-276766',
  # Milwaukee-Waukesha + Racine WI — 36
  '581-293333','581-200638','581-250526','581-356597','581-348858','581-464329','581-382812','581-452678',
  '581-416259','581-375773','581-400081','581-422430','581-393507','581-358613','581-257116','581-301173',
  '581-245489','581-294581','581-391447','581-392174','581-264142','581-439789','581-322494','581-319543',
  '581-407872','581-262001','581-299997','581-316568','581-308495','581-338280','581-339066','581-331846',
  '581-376358','581-377871','581-281474','581-267708',
  # Calcasieu LA (Lake Charles) — 5
  '221-473732','221-521326','221-525519','221-361904','221-462775',
  # Caddo/Bossier LA (Shreveport-Bossier City) — 17
  '222-177100','222-170924','222-176747','222-167282','222-186527','222-168700','222-169257','222-169405',
  '222-206916','222-208124','222-182984','222-193163','222-174214','222-179822','222-180953','222-174448',
  '222-171677',
  # Albany-Schenectady-Troy NY — 10
  '371-350245','371-347551','371-356096','371-379755','371-390805','371-373235','371-383444','371-370860',
  '371-366255','371-366531',
  # Marion IN (Indianapolis-Carmel-Greenwood) — 19
  '151-686972','151-716575','151-507971','151-682931','151-617281','151-630882','151-721848','156-074487',
  '156-079278','156-177144','156-178847','151-916226','151-867440','151-846141','151-771091','151-915536',
  '151-853655','156-030800','156-106800',
  # Tangipahoa LA (Hammond) — 2
  '221-499250','221-398984',
  # Lafayette Parish LA — 4
  '221-378272','221-439710','221-518957','221-454714',
  # Chatham GA (Savannah) — 3
  '105-794350','105-382124','105-390881',
  # Onondaga NY (Syracuse) — 10
  '371-329884','371-351728','371-342268','371-286734','371-289403','371-293389','371-285147','371-344624',
  '371-339228','371-362315',
  # Washoe NV (Reno-Sparks) — 2
  '331-089752','331-120346',
  # St. Joseph IN (South Bend-Mishawaka) — 4
  '151-922093','151-722958','151-876793','156-101524',
}

def reo_block(case_ids):
    try:
        all_reo = json.load(open(R+'hud_reo.json'))
    except FileNotFoundError:
        return {}, []
    byzip = {}
    examples = []
    for r in all_reo:
        case, addr, city, state, zipc, step, lat, lng = r
        if case not in case_ids: continue
        byzip[zipc] = byzip.get(zipc, 0) + 1
        examples.append([case, addr.title(), city.title(), zipc, lat, lng])
    return byzip, examples
SUF={'STREET':'ST','AVENUE':'AVE','DRIVE':'DR','ROAD':'RD','BOULEVARD':'BLVD','COURT':'CT','PLACE':'PL','LANE':'LN','HIGHWAY':'HWY','PARKWAY':'PKWY','CIRCLE':'CIR','TERRACE':'TER','ALLEY':'ALY','WAY':'WAY','SAINT':'ST'}
def norm(a):
    s=re.sub(r'[^A-Z0-9 ]',' ',str(a).upper())
    s=re.sub(r'\s+',' ',s).strip()
    parts=[SUF.get(p,p) for p in s.split()]
    # drop unit tails like "UNIT 2" / "APT B"
    out=[]
    for p in parts:
        if p in ('UNIT','APT','STE','SUITE','#'): break
        out.append(p)
    return ' '.join(out)

sh=json.load(open(R+'nola_sheriff.json'))     # [addr,status,date,amount]
cd=json.load(open(R+'nola_code.json'))        # [addr,stageDigit,filed]
fc={}
for a,st,d,amt in sh:
    n=norm(a)
    if len(n)<6: continue
    pr=fc.get(n)
    code=1 if st=='Pending' else 2   # 1=pending sale, 2=other recorded case
    if pr is None or code<pr: fc[n]=code
code={}
for a,stg,d in cd:
    n=norm(a)
    if len(n)<6: continue
    try: s=int(stg)
    except: s=1
    code[n]=max(code.get(n,0), min(9,s))
ev=json.load(open(R+'sf_evict.json'))
evz={r['zip']:[int(r['n']),int(r['np']),int(r['lp']),int(r['ellis']),int(r['omi'])] for r in ev if r.get('zip') and str(r['zip']).startswith('941')}
j=lambda o: json.dumps(o,separators=(',',':'))

reo_bay_zip, reo_bay_ex = reo_block(REO_BAY_CASES)
reo_nola_zip, reo_nola_ex = reo_block(REO_NOLA_CASES)
reo_launi_zip, reo_launi_ex = reo_block(REO_LAUNI_CASES)
reo_usc_zip, reo_usc_ex = reo_block(REO_USCORRIDOR_CASES)
REO_SRC = "HUD FHA Single Family REO Properties For Sale (egis.hud.gov ArcGIS REST, live pull), snapshot 2026-09-07 — federal government-owned inventory, no owner PII"

open(R+'sig2_nola.js','w').write('window.LXSIG2={fc:'+j(fc)+',code:'+j(code)+',reo:'+j({'zip':reo_nola_zip,'ex':reo_nola_ex})+',asof:"2026-09-02",src:{fc:"Orleans Parish Civil Sheriff sales — lien foreclosures (data.nola.gov d52w-8nva)",code:"City of New Orleans Code Enforcement open cases (u6yx-v2tw)",reo:"'+REO_SRC+'"}};\n')
open(R+'sig2_bay.js','w').write('window.LXSIG2={ev:'+j(evz)+',reo:'+j({'zip':reo_bay_zip,'ex':reo_bay_ex})+',asof:"2026-09-02",src:{ev:"SF Rent Board eviction notices, trailing 24 months (DataSF 5cei-gny5)",reo:"'+REO_SRC+'"}};\n')
open(R+'sig2_launi.js','w').write('window.LXSIG2={reo:'+j({'zip':reo_launi_zip,'ex':reo_launi_ex})+',asof:"2026-09-07",src:{reo:"'+REO_SRC+'"}};\n')
open(R+'sig2_uscorridor.js','w').write('window.LXSIG2={reo:'+j({'zip':reo_usc_zip,'ex':reo_usc_ex})+',asof:"2026-09-07",src:{reo:"'+REO_SRC+'"}};\n')
import os
print('fc addrs',len(fc),'code addrs',len(code),'ev zips',len(evz))
print('reo bay',reo_bay_zip,'| reo nola',reo_nola_zip,'| reo launi',reo_launi_zip)
print('reo uscorridor zips',len(reo_usc_zip),'cases matched',sum(reo_usc_zip.values()),'of',len(REO_USCORRIDOR_CASES))
print('sig2_nola',os.path.getsize(R+'sig2_nola.js'),'sig2_bay',os.path.getsize(R+'sig2_bay.js'),'sig2_launi',os.path.getsize(R+'sig2_launi.js'),'sig2_uscorridor',os.path.getsize(R+'sig2_uscorridor.js'))
