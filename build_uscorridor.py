import sys, re, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lxbuild as B

head = B.read('src/head.html'); body = B.read('src/body.html')
app  = B.app_source('corr')
data = B.read('data_uscorridor.js')


# ---- regionalization ----
for a,b in [
 ('Locator X dashboard · SF Bay Area','Locator X dashboard · US growth corridors'),
 ('Every one of the 128,319 sites','Every one of the 90,000 parcels'),
]: body=body.replace(a,b)
body=body.replace('<title>','<title>')  # title lives in head
head=head.replace('locator.x','locator.x')
import re
head=re.sub(r'<title>[^<]*</title>','<title>Locator X US Corridors</title>',head,1)
for a,b in [
 ('128,319 real sites from county records','84,116 parcels from five county assessors'),
 ('extruding 128,319 sites','extruding 84,116 parcels'),
]: app=app.replace(a,b)
body=body.replace('Which of these properties would pay you?','Multifamily, lodging and commercial where the capital is landing')
body=body.replace('A walkable Bay Area, built from the catalog','Five corridors, built from five county assessors')
# hide Bay-specific tabs (guide, house hacks) on the NOLA edition
head=head.replace('</style>', 'button[data-view="guide"],button[data-view="hacks"],#guide,#hacks{display:none!important}\n</style>',1)


extra = [B.read('sig2_uscorridor.js')]
open(B.R+'uscorridor.html','w').write(B.assemble(head, body, data, app, extra))
open(B.R+'uscorridor-standalone.html','w').write(B.standalone(head, body, data, app, extra))
B.report('uscorridor.html')
