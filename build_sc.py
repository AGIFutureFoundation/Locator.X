import sys, re, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lxbuild as B

head = B.read('src/head.html'); body = B.read('src/body.html')
app  = B.app_source('sc')
data = B.read('data_sc.js')

for a, b in [
 ('Locator X dashboard · SF Bay Area','Locator X dashboard · Shelter Cove'),
 ('Every one of the 128,319 sites','Every one of the 4,284 parcels'),
]: body = body.replace(a, b)
head = re.sub(r'<title>[^<]*</title>', '<title>Locator X Shelter Cove</title>', head, 1)
for a, b in [
 ('128,319 real sites from county records','4,284 real parcels from Humboldt County records'),
 ('extruding 128,319 sites','extruding 4,284 parcels'),
]: app = app.replace(a, b)
head = head.replace('</style>', 'button[data-view="guide"],button[data-view="hacks"],#guide,#hacks{display:none!important}\n</style>', 1)

extra = [B.read('sig2_bay.js')]
open(B.R+'sheltercove.html','w').write(B.assemble(head, body, data, app, extra))
open(B.R+'sheltercove-standalone.html','w').write(B.standalone(head, body, data, app, extra))
B.report('sheltercove.html', 2.78)
