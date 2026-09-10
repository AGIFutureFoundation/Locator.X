import sys, re, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lxbuild as B

head = B.read('src/head.html'); body = B.read('src/body.html')
app  = B.app_source('nola')
data = B.read('data_nola.js')


# ---- regionalization ----
for a,b in [
 ('Locator X dashboard · SF Bay Area','Locator X dashboard · New Orleans'),
 ('SF Bay Area','New Orleans'),
 ('Every one of the 128,319 sites','Every one of the 90,000 parcels'),
 ('Basemap: Natural Earth · US Census TIGER · Zillow neighborhood boundaries · Market data © Zillow Research · Records: SF Assessor, Alameda County Assessor',
  'Basemap: Natural Earth · US Census TIGER · Zillow neighborhood boundaries · Market data © Zillow Research · Records: City of New Orleans parcel + building-footprint GIS (data.nola.gov)'),
]: body=body.replace(a,b)

# ---- default view: open on the Map (not Home), highlighting the university
# corridors where student-housing conversions pencil — this edition leads
# with the map, not a dashboard, because the map is where the campus pins
# and the highlighted candidate deals (src/campus.js) actually show up.
for a,b in [
 ('<button data-gsel="start" aria-selected="true">Start</button>',
  '<button data-gsel="start">Start</button>'),
 ('<button data-gsel="find">Find</button>',
  '<button data-gsel="find" aria-selected="true">Find</button>'),
 ('<button role="tab" data-view="home" data-group="start" aria-selected="true">Home</button>',
  '<button role="tab" data-view="home" data-group="start">Home</button>'),
 ('<button role="tab" data-view="mapview" data-group="find">Map</button>',
  '<button role="tab" data-view="mapview" data-group="find" aria-selected="true">Map</button>'),
 ('<section id="mapview" class="view">',
  '<section id="mapview" class="view active">'),
 ('<section id="home" class="view active"><div class="page"><div class="inner wide">',
  '<section id="home" class="view"><div class="page"><div class="inner wide">'),
]: body=body.replace(a,b)
body=body.replace('<title>','<title>')  # title lives in head
head=head.replace('locator.x','locator.x')
import re
head=re.sub(r'<title>[^<]*</title>','<title>Locator X New Orleans</title>',head,1)
for a,b in [
 ('128,319 real sites from county records','90,000 real parcels from Orleans Parish records'),
 ('extruding 128,319 sites','extruding 90,000 parcels'),
]: app=app.replace(a,b)
# hide Bay-specific tabs (guide, house hacks) on the NOLA edition
head=head.replace('</style>', 'button[data-view="guide"],button[data-view="hacks"],#guide,#hacks{display:none!important}\n</style>',1)


extra = [B.read('sig2_nola.js')]
open(B.R+'nola.html','w').write(B.assemble(head, body, data, app, extra))
open(B.R+'nola-standalone.html','w').write(B.standalone(head, body, data, app, extra))
B.report('nola.html')
