import sys, re, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lxbuild as B

head = B.read('src/head.html'); body = B.read('src/body.html')
app  = B.app_source('below')
data = B.read('data_below.js')


# ---- regionalization ----
for a,b in [
 ('Locator X dashboard · SF Bay Area','Locator X dashboard · Bay Area — Below Market 100k'),
 ('Every one of the 128,319 sites','Every one of the 100,000 below-market records'),
]: body=body.replace(a,b)
body=body.replace('<title>','<title>')  # title lives in head
head=head.replace('locator.x','locator.x')
import re
head=re.sub(r'<title>[^<]*</title>','<title>Locator X Below Market</title>',head,1)
for a,b in [
 ('128,319 real sites from county records','100,000 below-market records — condos, townhouses, multi-residence and upgrade candidates'),
 ('extruding 128,319 sites','extruding 100,000 below-market records'),
]: app=app.replace(a,b)
# hide Bay-specific tabs (guide, house hacks) on the NOLA edition
head=head.replace('</style>', 'button[data-view="hacks"],#hacks{display:none!important}\n</style>',1)


extra = [B.read('sig2_bay.js')]
open(B.R+'below100.html','w').write(B.assemble(head, body, data, app, extra))
open(B.R+'below100-standalone.html','w').write(B.standalone(head, body, data, app, extra))
B.report('below100.html')
