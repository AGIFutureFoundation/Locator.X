import sys, re, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lxbuild as B

head = B.read('src/head.html'); body = B.read('src/body.html')
app  = B.app_source('atlasnola')
data = B.read('data_atlas_nola.js')


# ---- regionalization ----
for a,b in [
 ('Locator X dashboard · SF Bay Area','Locator X dashboard · New Orleans'),
 ('where most Bay Area buyers end up','where most buyers in this market end up'),
 ('A walkable Bay Area, built from the catalog','A walkable New Orleans, built from the catalog'),
 ('for every Bay Area ZIP and city','for every ZIP and city this edition covers'),
 ('see where the Bay Area can cash-flow','see where this market can cash-flow'),
 ('Live mapping for a Bay Area listings app','Live mapping for a New Orleans listings app'),
 ('Records: SF Assessor, Alameda County Assessor','Records: Orleans & Jefferson Parish Assessors'),
 ('1500 Grand Ave, Oakland, CA 94610','1500 Canal St, New Orleans, LA 70112'),
 ('placeholder="Oakland"','placeholder="New Orleans"'),
 ('location=Oakland%2C%20CA','location=New%20Orleans%2C%20LA'),
 ('Oakland for-sale','New Orleans for-sale'),
 ('Every one of the 128,319 sites','Every one of the 125,803 parcels'),
]: body=body.replace(a,b)
body=body.replace('<title>','<title>')  # title lives in head
head=head.replace('locator.x','locator.x')
import re
head=re.sub(r'<title>[^<]*</title>','<title>Locator X New Orleans Atlas</title>',head,1)
for a,b in [
 ('128,319 real sites from county records','125,803 parcels across Orleans and Jefferson parishes'),
 ('extruding 128,319 sites','extruding 125,803 parcels'),
 ('const EDITION_STATE = null;',
  "const EDITION_STATE = 'Louisiana';"),
]: app=app.replace(a,b)
# hide Bay-specific tabs (guide, house hacks) on the NOLA edition
head=head.replace('</style>', 'button[data-view="guide"],button[data-view="hacks"],#guide,#hacks{display:none!important}\n</style>',1)


extra = [B.read('sig2_nola.js')]
open(B.R+'atlas_nola.html','w').write(B.assemble(head, body, data, app, extra))
open(B.R+'atlas_nola-standalone.html','w').write(B.standalone(head, body, data, app, extra))
B.report('atlas_nola.html')
