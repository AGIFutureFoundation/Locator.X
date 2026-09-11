import sys, re, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lxbuild as B

head = B.read('src/head.html'); body = B.read('src/body.html')
app  = B.app_source('launi')
data = B.read('data_launi.js')


# ---- regionalization ----
for a,b in [
 ('Locator X dashboard · SF Bay Area','Locator X dashboard · Baton Rouge &amp; Louisiana university cities'),
 ('Every one of the 128,319 sites','Every one of the 90,000 parcels'),
]: body=body.replace(a,b)
body=body.replace('<title>','<title>')  # title lives in head
head=head.replace('locator.x','locator.x')
import re
head=re.sub(r'<title>[^<]*</title>','<title>Locator X Baton Rouge</title>',head,1)
for a,b in [
 ('128,319 real sites from county records','120,000 parcels from the East Baton Rouge Parish roll'),
 ('extruding 128,319 sites','extruding 120,000 parcels'),
 ('const EDITION_STATE = null;',
  "const EDITION_STATE = 'Louisiana';"),
]: app=app.replace(a,b)
body=body.replace('Which of these properties would pay you?','Student housing, rentals and land around Louisiana\u2019s biggest campuses')
body=body.replace('A walkable Bay Area, built from the catalog','A walkable Baton Rouge, built from the catalog')
# hide Bay-specific tabs (guide, house hacks) on the NOLA edition
head=head.replace('</style>', 'button[data-view="guide"],button[data-view="hacks"],#guide,#hacks{display:none!important}\n</style>',1)


extra = [B.read('sig2_launi.js')]
open(B.R+'launi.html','w').write(B.assemble(head, body, data, app, extra))
open(B.R+'launi-standalone.html','w').write(B.standalone(head, body, data, app, extra))
B.report('launi.html')
