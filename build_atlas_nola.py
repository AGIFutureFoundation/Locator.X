import sys, re, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lxbuild as B

head = B.read('src/head.html'); body = B.read('src/body.html')
app  = B.app_source('atlasnola')
data = B.read('data_atlas_nola.js')


# ---- regionalization ----
for a,b in [
 ('locator.x — Bay Area','locator.x — New Orleans'),
 ('Locator X dashboard · SF Bay Area','Locator X dashboard · New Orleans'),
 ('SF Bay Area','New Orleans'),
 ('San Francisco bay area','New Orleans'),
 ('Every one of the 128,319 sites','Every one of the 125,803 parcels'),
]: body=body.replace(a,b)
body=body.replace('<title>','<title>')  # title lives in head
head=head.replace('locator.x','locator.x')
import re
head=re.sub(r'<title>[^<]*</title>','<title>Locator X New Orleans Atlas</title>',head,1)
for a,b in [
 ('128,319 real sites from county records','125,803 parcels across Orleans and Jefferson parishes'),
 ('extruding 128,319 sites','extruding 125,803 parcels'),
]: app=app.replace(a,b)
# hide Bay-specific tabs (guide, house hacks) on the NOLA edition
head=head.replace('</style>', 'button[data-view="guide"],button[data-view="hacks"],#guide,#hacks{display:none!important}\n</style>',1)


extra = [B.read('sig2_nola.js')]
open(B.R+'atlas_nola.html','w').write(B.assemble(head, body, data, app, extra))
open(B.R+'atlas_nola-standalone.html','w').write(B.standalone(head, body, data, app, extra))
B.report('atlas_nola.html')
