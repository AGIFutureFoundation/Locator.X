/* locator.x - the room program, derived and labelled as derived.
   ----------------------------------------------------------------------------
   Nobody has walked these buildings. What the public record gives is, at best, a
   bedroom count, a bathroom count, a heated area, a storey count and a year. This
   module turns those into a plausible room-by-room program using published space
   standards, and then says on its face which parts came off the record and which
   are inference.

   The discipline is the same one the 3D massing uses: every line is tagged
   RECORDED, DERIVED or SCHEMATIC, and nothing is stated that the source does not
   support. A property with no bedroom count gets no bedroom list - it gets a
   sentence saying the county does not publish one. That is more useful than an
   invented three-bedroom layout, because an invented layout is indistinguishable
   from a real one once it is on the page.

   Areas come from typical residential space planning: a primary bedroom around
   14% of conditioned area, secondary bedrooms 9%, a full bath 5%, a half bath 2%,
   kitchen 11%, and the balance to living, circulation and storage. Those are
   planning rules of thumb, stated as such, not measurements of this building. */
(function(){
'use strict';
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }
function N(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; }

var SHARE = {primary:0.14, bedroom:0.09, full:0.050, half:0.020, kitchen:0.11, living:0.16, dining:0.07};

/* era language, from the year the county recorded - construction practice, not taste */
function era(y){
  if(!y) return null;
  if(y < 1900) return {name:'pre-1900', walls:'load-bearing masonry or heavy timber frame', ceil:'high, often over ten feet',
    note:'Plaster on lath, single-glazed openings and almost certainly no cavity insulation unless it was added later. Knob-and-tube wiring and galvanised supply lines are common enough at this age that both belong on an inspection list.'};
  if(y < 1940) return {name:'1900-1939', walls:'balloon or platform frame, often with brick veneer', ceil:'nine to ten feet',
    note:'Balloon framing runs stud cavities from sill to roof, which is why fire-blocking is a standard retrofit item. Expect original plaster and, in this era, a real chance of lead paint and asbestos in pipe lagging or floor tile.'};
  if(y < 1960) return {name:'1940-1959', walls:'platform frame', ceil:'eight feet',
    note:'Post-war standardisation: smaller rooms, minimal insulation by modern standards, and often an original single-panel service that a modern electrical load has outgrown.'};
  if(y < 1980) return {name:'1960-1979', walls:'platform frame', ceil:'eight feet',
    note:'Aluminium branch wiring appeared in part of this window and is a named insurance question. Pre-1978 construction carries the federal lead-paint disclosure obligation.'};
  if(y < 2000) return {name:'1980-1999', walls:'platform frame with sheathing', ceil:'eight to nine feet',
    note:'Insulation and glazing improve markedly across this window. Polybutylene supply piping was used in part of it and is a known failure mode worth identifying.'};
  if(y < 2015) return {name:'2000-2014', walls:'engineered frame', ceil:'nine feet',
    note:'Built to a recognisably modern energy code. The open plan and the attached garage are near-universal, which matters for any conversion that needs a second means of egress.'};
  return {name:'2015 and newer', walls:'engineered frame', ceil:'nine to ten feet',
    note:'Current energy code, sealed envelope and mechanical ventilation. A tight envelope is efficient and unforgiving of moisture, so ventilation performance is the thing to verify.'};
}

/* The reconciliation test.
   ---------------------------------------------------------------------------
   A published bedroom count describes ONE dwelling. A published unit count often
   does not describe dwellings at all - in several counties here it is a billing
   count or a band lower bound derived from a class description, and it is not
   unusual to find a record reading five bedrooms, four baths, 4,345 sq ft and
   "21 units". Dividing that area by that count yields a 207 sq ft home with
   29 sq ft bedrooms, which is not a cautious estimate - it is an invented
   building, and it looks exactly like a real one once it is laid out in a table.

   So the two fields must reconcile before either is used. The floor below is
   deliberately generous - a bedroom needs roughly 180 sq ft once its share of
   circulation, closet and wall is counted, plus about 200 sq ft of kitchen,
   bath and living that every dwelling has regardless. A per-unit area under
   that floor means the unit count is not counting dwellings, and the honest
   response is to show the recorded counts and NO room sizes at all. */
function reconcile(sqft, beds, units){
  if(!sqft) return {per:null, ok:false, why:null, beds:beds};
  if(!(units > 1)) return {per:sqft, ok:true, why:null, beds:beds};
  var per = sqft / units;
  if(!beds) return {per:per, ok:true, why:null, beds:beds};   /* apartment case: no beds to contradict */
  var floor = 200 + beds * 180;
  if(per >= floor) return {per:per, ok:true, why:null, beds:beds};
  /* Second reading, and the usual one on small multifamily: the bedroom count is
     the BUILDING's, not one unit's. A duplex recorded as four bedrooms is two
     two-bedroom flats. Test that reading before refusing - but only when it
     divides into at least one bedroom per unit, because a five-bedroom record
     over twenty-one units divides into nothing real either way. */
  var perUnitBeds = Math.floor(beds / units);
  if(perUnitBeds >= 1 && per >= 200 + perUnitBeds * 180){
    return {per:per, ok:true, beds:perUnitBeds, split:true, why:null,
      total:beds, units:units};
  }
  return {per:null, ok:false, beds:beds, why:'This record publishes ' + beds + ' bedroom' + (beds === 1 ? '' : 's')
    + ' and ' + L().fmtN(sqft) + ' sq ft, but also a unit count of ' + units + '. Those cannot both describe '
    + 'dwellings: dividing the area by that count leaves about ' + L().fmtN(Math.round(per)) + ' sq ft per unit, '
    + 'which is far too small for the bedroom count on the same record. In several counties here the unit figure '
    + 'is a billing count or a band lower bound read off a class description, not a number of homes. Rather than '
    + 'pick one field and lay out rooms from it, no room sizes are shown &mdash; an invented layout is '
    + 'indistinguishable from a real one once it is on a page.'};
}

function perUnitBedsText(n){ return n + ' bedroom' + (n === 1 ? '' : 's'); }

function program(l){
  var sqft = N(l.sqft), beds = N(l.beds), baths = N(l.baths), units = N(l.units) || 1;
  var rec = reconcile(sqft, beds, units);
  var per = rec.per;
  var rows = [], notes = [];
  var recorded = [], derived = [];
  if(rec.why) notes.push(rec.why);
  if(rec.split){
    notes.push('The county publishes ' + rec.total + ' bedrooms and ' + rec.units + ' units for this building, '
      + 'so the bedroom count is read as the <b>building</b> total and the program below is one unit of about '
      + perUnitBedsText(rec.beds) + '. That reading is an inference from two recorded numbers, not a recorded fact, '
      + 'and it assumes the units are alike.');
    beds = rec.beds;
  }

  if(beds) recorded.push(beds + ' bedroom' + (beds === 1 ? '' : 's'));
  if(baths) recorded.push(baths + ' full bath' + (baths === 1 ? '' : 's'));
  if(sqft) recorded.push(L().fmtN(sqft) + ' sq ft' + (units > 1 ? ' across ' + units + ' units' : ''));
  if(l.year) recorded.push('built ' + l.year);
  if(l.stories) recorded.push(l.stories + ' storey' + (l.stories === 1 ? '' : 's'));

  if(!beds && !baths && !sqft){
    return {none:true,
      why:'This county publishes no bedroom count, no bathroom count and no building area for this parcel, so there is nothing to derive a room program from. Any layout shown here would be invented, and an invented layout is indistinguishable from a real one once it is on a page.'};
  }
  /* THE ENVELOPE WINS.
     The shares below are planning rules of thumb calibrated on an ordinary three-
     or four-bedroom house. Applied literally to a nine-bedroom, nine-bath record
     they sum to well over the whole building - this produced a program totalling
     165% of the recorded area before it was caught. The published area is a
     recorded fact; the proportions are an assumption. So when the named rooms
     would exceed CEIL of the envelope, every share is scaled by one factor until
     they fit, the residual is preserved for circulation, and the page says the
     scaling happened. Never let an assumption overflow a measurement. */
  var CEIL = 0.86;
  var demand = (beds ? SHARE.primary + Math.max(0, beds - 1) * SHARE.bedroom : 0)
             + (baths ? baths * SHARE.full : 0)
             + SHARE.kitchen + SHARE.living + ((per && per > 1100) ? SHARE.dining : 0);
  var K = (demand > CEIL) ? CEIL / demand : 1;
  if(K < 1) notes.push('The published bedroom and bathroom counts are high relative to the recorded building '
    + 'area, so the ordinary planning proportions were scaled by ' + (K * 100).toFixed(0) + '% to fit inside it. '
    + 'The recorded area is a fact and the proportions are an assumption, so the assumption gives way. In '
    + 'practice a building with this many rooms in this much space has smaller rooms than the rule of thumb, '
    + 'or the counts and the area were recorded from different sources.');
  var SH = function(k){ return SHARE[k] * K; };

  if(beds && per){
    var a = Math.floor(per * SH('primary'));
    rows.push({room:'Primary bedroom', area:a, tag:'derived',
      note:'Roughly ' + Math.round(SHARE.primary * 100) + '% of conditioned area is the usual planning allowance for the largest bedroom.'});
    for(var i = 2; i <= beds; i++)
      rows.push({room:'Bedroom ' + i, area:Math.floor(per * SH('bedroom')), tag:'derived', note:null});
  } else if(beds){
    for(var j = 1; j <= beds; j++)
      rows.push({room:j === 1 ? 'Primary bedroom' : 'Bedroom ' + j, area:null, tag:'recorded-count',
        note:'The count is on the record; no area is published, so none is shown.'});
  }
  if(baths && per){
    for(var b = 1; b <= baths; b++)
      rows.push({room:b === 1 ? 'Full bathroom' : 'Full bathroom ' + b, area:Math.floor(per * SH('full')), tag:'derived', note:null});
  } else if(baths){
    for(var b2 = 1; b2 <= baths; b2++)
      rows.push({room:'Full bathroom' + (baths > 1 ? ' ' + b2 : ''), area:null, tag:'recorded-count', note:null});
  }
  if(per){
    rows.push({room:'Kitchen', area:Math.floor(per * SH('kitchen')), tag:'derived', note:null});
    rows.push({room:'Living area', area:Math.floor(per * SH('living')), tag:'derived', note:null});
    if(per > 1100) rows.push({room:'Dining area', area:Math.floor(per * SH('dining')), tag:'derived', note:null});
    var used = rows.reduce(function(s, r){ return s + (r.area || 0); }, 0);
    var rest = Math.floor(per - used);
    if(rest > 40) rows.push({room:'Circulation, storage and utility', area:rest, tag:'derived',
      note:'The balance of the conditioned area after the named rooms. In older stock this is corridor and closet; in newer stock more of it is absorbed into the open plan.'});
  }
  /* Each derived area is floored rather than rounded: N rounded shares can sum
     to as much as N/2 sq ft past the area actually on the record, and "the
     parts never exceed the whole" is a statement this page makes in public.
     Flooring gives the balance to circulation, which is where an unallocated
     remainder honestly belongs.  The clamp below is a belt-and-braces check on
     that arithmetic, not a substitute for it. */
  if(per){
    var tot = rows.reduce(function(s2, r){ return s2 + (r.area || 0); }, 0);
    if(tot > per){
      var over = tot - per;
      for(var z = rows.length - 1; z >= 0 && over > 0; z--){
        if(!rows[z].area) continue;
        var cut = Math.min(over, rows[z].area);
        rows[z].area -= cut; over -= cut;
      }
    }
  }
  if(!beds) notes.push('No bedroom count is published for this parcel, so no bedrooms are listed.');
  if(!baths) notes.push('No bathroom count is published.');
  if(!sqft) notes.push('No building area is published, so no room is given a size.');
  if(units > 1 && sqft && rec.ok && rec.per !== sqft) notes.push('The building area is for the whole property; the program above is one unit&rsquo;s share of ' + L().fmtN(sqft) + ' sq ft across ' + units + ' units, which assumes the units are alike. They frequently are not.');

  return {rows:rows, recorded:recorded, notes:notes, era:era(l.year), per:per, units:units};
}

/* the drawer block */
function drawer(l){
  var p;
  try{ p = program(l); }catch(e){ return ''; }
  if(!p) return '';
  var head = '<div class="sect"><p class="eyebrow" style="margin:0 0 4px">Rooms and construction</p>';
  if(p.none){
    return head + '<p style="font-size:12.5px;color:var(--ink2);margin:0">' + esc(p.why) + '</p></div>';
  }
  var body = '<div style="font-size:12.5px;line-height:1.6;margin-bottom:6px"><b>On the record:</b> '
    + esc(p.recorded.join(' · ')) + '</div>';
  if(p.rows.length){
    body += '<table style="width:100%;font-size:12.5px;border-collapse:collapse">'
      + p.rows.map(function(r){
          return '<tr><td style="padding:2px 0">' + esc(r.room) + '</td>'
            + '<td style="text-align:right;padding:2px 0;color:var(--ink2)">'
            + (r.area ? L().fmtN(r.area) + ' sq ft' : '<span style="color:var(--muted)">no area published</span>') + '</td></tr>';
        }).join('')
      + '</table>';
  }
  if(p.era){
    body += '<div style="font-size:12.5px;line-height:1.65;margin-top:7px"><b>' + esc(p.era.name) + '</b> — '
      + esc(p.era.walls) + ', ceilings ' + esc(p.era.ceil) + '. ' + p.era.note + '</div>';
  }
  body += '<p style="font-size:11.5px;color:var(--muted);margin:6px 0 0"><b>Every room size above is DERIVED, '
    + 'not measured.</b> Nobody has walked this building. Counts and areas come off the public record; the '
    + 'split between rooms uses ordinary residential space-planning proportions, and the construction notes '
    + 'describe what was typical in that year, not what was found here. '
    + (p.notes.length ? p.notes.join(' ') : '') + '</p></div>';
  return head + body;
}

window.LXRooms = {program: program, drawer: drawer, era: era};
})();
