/* geoexport — the filtered set as an interchange file.
 *
 * The platform imports well (MLS exports, Zillow-shaped JSON, spreadsheets) and
 * exports a PDF memo and a desk worksheet, but there was no way to take a
 * screened set OUT as geography: into QGIS, into ArcGIS, into a Mapbox tileset,
 * into anyone else's map. This is that file — RFC 7946 GeoJSON, plus the same
 * columns flat as CSV.
 *
 * THE RULE THIS MODULE EXISTS TO KEEP (docs/INTEROP.md): a number must not
 * migrate to a stronger kind by being written into a file. Facts about this
 * catalog used to get lost the moment a record left the app; each is now
 * carried explicitly on every feature rather than dropped:
 *
 *   lx:price_basis     A price here is normally the POST-SALE ASSESSED VALUE
 *                      from a county roll. In counties that publish no assessed
 *                      values it is a ZIP-level index ESTIMATE (l.est), which
 *                      is not a price at all. An export that emitted both as
 *                      "price" would launder the second into the first.
 *   lx:geometry_basis  Most coordinates are the parcel. Some are the ZIP
 *                      CENTROID (l.approx) because the record carried no
 *                      parcel geometry. Silently shipping a centroid as a
 *                      point is how a fabricated coordinate enters someone
 *                      else's dataset.
 *   sale_price/
 *   sale_date          comps.js already names this app's own strongest fact
 *                      type: an actual recorded transaction (l.sale +
 *                      l.saleDate), populated only in disclosure-state
 *                      editions and only on parcels that actually traded --
 *                      distinct from `price`, which is present on every
 *                      record and is not necessarily a sale at all. This
 *                      file carried the weaker fact and silently dropped the
 *                      stronger one whenever a record had both: a consumer
 *                      taking this into QGIS or ArcGIS got the assessed value
 *                      with no way to know a real closing price and date
 *                      existed on the same parcel. Exported now, null where
 *                      the record carries no sale -- which most records,
 *                      honestly, do not.
 *
 * Derived numbers (cap rate, cash flow, DSCR) are exported under names that
 * begin lx:derived_ and the file's own header says they are arithmetic over
 * assumptions, not measurements.
 */
(function(){
'use strict';
const X = () => window.LX;

/* RESO Data Dictionary aliases for the fields where the correspondence is
   direct. ASSERTED, NOT VERIFIED: this build container has no egress to
   reso.org (probed 2026-09-11), so these names could not be checked against the
   published dictionary or pinned to a version. They ship as a convenience
   mapping for a consumer to check, never as a conformance claim — which is why
   the alias block is a separate member of the file rather than the property
   names themselves. Fields with no confident equivalent are simply absent;
   inventing one would be worse than omitting it. */
const RESO = {
  addr: 'UnparsedAddress', city: 'City', zip: 'PostalCode', state: 'StateOrProvince',
  county: 'CountyOrParish', lat: 'Latitude', lng: 'Longitude', apn: 'ParcelNumber',
  year: 'YearBuilt', sqft: 'LivingArea', lot: 'LotSizeSquareFeet',
  beds: 'BedroomsTotal', baths: 'BathroomsTotalInteger', stories: 'Stories',
  sale_price: 'ClosePrice', sale_date: 'CloseDate'
};

function priceBasis(l){
  if(l.src === 'imp') return 'imported by this user — not a public record';
  if(l.est) return 'ZIP-level index estimate — this county publishes no assessed values; NOT a price';
  return 'post-sale assessed value from the county roll — not necessarily today’s market value';
}
function geometryBasis(l){
  return l.approx ? 'ZIP centroid — the record carried no parcel geometry; NOT the parcel'
                  : 'parcel location as published by the record';
}

/* One record's exported properties. Null stays null: a blank is unknown, and a
   consumer that fills it with zero is doing so on its own. */
function props(l, opts){
  const A = X();
  const p = {
    'lx:id': l.id,
    addr: l.addr || null, city: l.city || null, county: l.county || null,
    zip: l.zip || null, state: (window.LXPACKET ? LXPACKET.stateName(l) : null),
    apn: l.apn || null, kind: l.kind || null, units: l.units != null ? l.units : null,
    beds: l.beds != null ? l.beds : null, baths: l.baths != null ? l.baths : null,
    sqft: l.sqft || null, lot: l.lot || null, year: l.year || null,
    stories: l.stories || null, zoning: l.zoning || null,
    price: l.price || null, price_date: l.priceDate || null,
    sale_price: l.sale || null, sale_date: l.saleDate || null,
    assessed_land: l.land != null ? l.land : null, assessed_improvements: l.imp != null ? l.imp : null,
    'lx:price_basis': priceBasis(l),
    'lx:geometry_basis': geometryBasis(l),
    'lx:source': l.src || null
  };
  if(opts && opts.derived){
    try{
      const d = A.deal(l);
      p['lx:derived_cap_pct'] = d && d.cap != null ? Math.round(d.cap * 100) / 100 : null;
      p['lx:derived_cashflow_month'] = d && d.cfMo != null ? Math.round(d.cfMo) : null;
      p['lx:derived_dscr'] = d && d.dscr != null ? Math.round(d.dscr * 100) / 100 : null;
      p['lx:derived_rent_month'] = d && d.rentMo != null ? Math.round(d.rentMo) : null;
      p['lx:derived_rent_basis'] = (d && d.rentHow) || 'unknown';
    }catch(e){ /* a record the deal math cannot answer exports without it */ }
  }
  return p;
}

function meta(rows, opts){
  const A = X();
  let edition = null;
  try{ edition = document.title || null; }catch(e){}
  return {
    format: 'Locator.X geospatial interchange',
    version: 1,
    spec: 'RFC 7946 (GeoJSON). The `lx` member is a foreign member, which RFC 7946 permits; consumers that ignore it still read a valid FeatureCollection.',
    generated: new Date().toISOString(),
    edition: edition,
    records: rows.length,
    selection: (opts && opts.selection) || 'the set currently filtered in the app',
    coordinate_reference_system: 'WGS 84 (EPSG:4326), as RFC 7946 requires — longitude first',
    approximate_coordinates: rows.filter(l => l.approx).length,
    estimated_prices: rows.filter(l => l.est).length,
    /* Published for the same reason approximate_coordinates and
       estimated_prices are: a consumer reading only sale_price should not
       have to scan every feature to learn how few of them carry one. */
    recorded_sales: rows.filter(l => l.sale != null && l.saleDate).length,
    /* A record with no coordinate cannot be a GeoJSON feature, so it is
       dropped — but the count is published rather than left as a silent gap
       between `records` and `features.length`. A consumer that reads only the
       features is entitled to know how many rows never made it. */
    dropped_without_geometry: rows.filter(
      l => !(typeof l.lng === 'number' && typeof l.lat === 'number')).length,
    kinds_of_number: {
      'public record': 'price, assessed values, parcel attributes — re-pullable from the agency named in lx:source',
      'recorded transaction': 'sale_price and sale_date — an actual closing, not an assessed value; null on any parcel that has not traded since the county last reassessed, which in a non-disclosure state is every parcel',
      derived: 'every lx:derived_ field — arithmetic over this app’s assumptions, not a measurement, and not a valuation'
    },
    reso_alias: RESO,
    reso_alias_note: 'RESO Data Dictionary names, ASSERTED from the published dictionary and NOT verified against reso.org from the build container (no egress, probed 2026-09-11). A convenience mapping to check, never a conformance claim. Fields with no confident equivalent are absent rather than guessed.',
    disclaimer: 'Education, not advice; not a valuation and not a listing feed. A price here is an assessed value or an index estimate — lx:price_basis says which, per record. Verify every row against the agency that published it before relying on it.'
  };
}

function featureCollection(rows, opts){
  rows = rows || [];
  const feats = rows
    .filter(l => typeof l.lng === 'number' && typeof l.lat === 'number')
    .map(l => ({
      type: 'Feature',
      id: l.id,
      geometry: {type: 'Point', coordinates: [+l.lng.toFixed(6), +l.lat.toFixed(6)]},
      properties: props(l, opts)
    }));
  return {type: 'FeatureCollection', lx: meta(rows, opts), features: feats};
}

/* CSV over exactly the same properties, so the two exports can never disagree
   about what a column means. */
function csv(rows, opts){
  rows = rows || [];
  if(!rows.length) return '';
  const objs = rows.map(l => Object.assign({lng: l.lng, lat: l.lat}, props(l, opts)));
  const cols = [];
  objs.forEach(o => Object.keys(o).forEach(k => { if(cols.indexOf(k) < 0) cols.push(k); }));
  const cell = v => {
    if(v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [cols.join(',')].concat(objs.map(o => cols.map(c => cell(o[c])).join(','))).join('\n');
}

function download(name, text, mime){
  try{
    const b = new Blob([text], {type: mime});
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 1500);
    return true;
  }catch(e){ return false; }
}

function stamp(){ return new Date().toISOString().slice(0, 10); }

function exportGeoJSON(){
  const A = X(); const rows = A.filtered();
  const fc = featureCollection(rows, {derived: true});
  const ok = download('locator-x-' + stamp() + '.geojson',
                      JSON.stringify(fc, null, 1), 'application/geo+json');
  A.toast(ok ? fc.features.length.toLocaleString('en-US') + ' features exported — every one carries its price basis and whether the point is the parcel or a ZIP centroid'
             : 'Export failed — this page could not create a download');
}
function exportCSV(){
  const A = X(); const rows = A.filtered();
  const ok = download('locator-x-' + stamp() + '.csv', csv(rows, {derived: true}), 'text/csv');
  A.toast(ok ? rows.length.toLocaleString('en-US') + ' rows exported'
             : 'Export failed — this page could not create a download');
}

window.LXGEO = {featureCollection, csv, props, meta, exportGeoJSON, exportCSV, RESO};
})();
