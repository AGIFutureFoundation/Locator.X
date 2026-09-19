/* locator.x — comparable recorded sales, and what the roll is not telling you.
   ----------------------------------------------------------------------------
   An underwriting platform lives or dies on comparables, so this module is strict
   about what one is. A comparable here is a RECORDED SALE WITH A DATE. Not an
   assessor value dressed up as a price. Not a sale price whose year is unknown.
   Not a parcel in another metro.

   That strictness costs coverage and it is the point. Marion County publishes no
   sale price at all. St. Joseph County publishes 4,347 sale prices and a date on
   twelve of them — those prices could be 1994 or 2024, so they are excluded and
   the reason is shown rather than hidden. Washoe publishes prices with no dates
   at all. Where there are not enough real comps this module says so and stops,
   which is the only defensible behaviour. */
(function(){
'use strict';
const $=(s,el=document)=>el.querySelector(s);
const L=()=>window.LX;
const esc=s=>L().esc(s);
const N=v=>(typeof v==='number'&&isFinite(v))?v:null;
const YR=d=>{ if(!d) return null; const y=+String(d).slice(0,4); return (y>1900&&y<2030)?y:null; };
const NOW=2026;

const MF=/apart|duplex|triplex|fourplex|multi|two family|three family|four family|multiple residence|townhouse|twin home|manufactured home park|accessory apartment|rooming|unit resid|-unit/i;
const LODGE=/hotel|motel|\binn\b|lodge|bed and breakfast|resort|tourist cabin|assisted living|dorm/i;
const COMM=/commercial|office|retail|business|warehouse|shopping|bank|restaurant|store|market|industrial|manufactur/i;
function cls(l){ const k=l.kind||''; if(MF.test(k)) return 'mf'; if(LODGE.test(k)) return 'lodge'; if(COMM.test(k)) return 'comm'; return 'other'; }

function hav(a,b,c,d){ const t=Math.PI/180, x=(c-a)*t, y=(d-b)*t;
  const h=Math.sin(x/2)**2+Math.cos(a*t)*Math.cos(c*t)*Math.sin(y/2)**2;
  return 2*6371*Math.asin(Math.min(1,Math.sqrt(h))); }
function q(a,p){ if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
  const i=(s.length-1)*p, lo=Math.floor(i), hi=Math.ceil(i);
  return lo===hi? s[lo] : s[lo]+(s[hi]-s[lo])*(i-lo); }

/* ---- the pool of things that are genuinely comparable ------------------- */
let POOL=null, DIAG=null, POOL_BY_METRO=null;
/* Two bases exist in this catalogue and they are NEVER mixed in one median.

   'sale'     — a recorded sale price carrying a recorded date. The real thing.
   'postsale' — a POST-SALE ASSESSED VALUE with the date it was set. In California
                a transfer resets the assessed basis to the purchase price, so this
                tracks the transaction closely, but it is an assessment and not the
                deed: partial transfers, exclusions and reassessment exemptions all
                make it diverge. It is offered as its own basis, labelled on every
                figure it produces, and never averaged together with a real sale. */
function basisOf(l){
  if(N(l.sale)>=10000 && l.saleDate && YR(l.saleDate)) return 'sale';
  if(N(l.price)>=10000 && l.priceDate && YR(l.priceDate)) return 'postsale';
  return null;
}
function amt(l,b){ return b==='sale'? N(l.sale) : N(l.price); }
function when(l,b){ return b==='sale'? l.saleDate : l.priceDate; }
const BASIS={sale:'recorded sale prices', postsale:'post-sale assessed values'};
/* PORTFOLIO DEEDS — the single most dangerous artifact in county sale data.
   When an entire complex trades, many counties write the WHOLE transaction price
   onto every individual parcel in it. Franklin County has condominium units carried
   on the roll at $53,500 each with a recorded sale price of $170,000,000 — the price
   of the building, repeated across every unit. Used unchecked, one such deed becomes
   hundreds of comparables, each of them wrong by three orders of magnitude, and it
   pushed a county's median sale-to-value ratio to 162x before this was caught.

   A price that appears on the same date against more than three parcels is not a
   parcel price. It is detected here, excluded from both comparables and the roll
   signal, and counted so the exclusion is visible rather than silent. */
const BULK_AT=4;
function bulkKeys(all){
  const c=new Map();
  for(let i=0;i<all.length;i++){
    const l=all[i]; const b=basisOf(l); if(b!=='sale') continue;
    const k=l.sale+'@'+l.saleDate;
    c.set(k,(c.get(k)||0)+1);
  }
  const s=new Set(); let parcels=0, deeds=0;
  c.forEach((n,k)=>{ if(n>=BULK_AT){ s.add(k); parcels+=n; deeds++; } });
  return {set:s, parcels:parcels, deeds:deeds};
}
function isBulk(l,B){ return B.set.has(l.sale+'@'+l.saleDate); }

function pool(){
  if(POOL) return POOL;
  const all=L().allListings();
  const B=bulkKeys(all);
  let undated=0, sale=0, post=0, bulk=0;
  const p=[];
  for(let i=0;i<all.length;i++){
    const l=all[i], b=basisOf(l);
    if(!b){ if(l.saleUndated||(N(l.sale)&&!l.saleDate)) undated++; continue; }
    if(b==='sale' && isBulk(l,B)){ bulk++; continue; }
    if(b==='sale') sale++; else post++;
    p.push(l);
  }
  DIAG={total:all.length, usable:p.length, undated:undated, sale:sale, post:post,
        bulk:bulk, bulkDeeds:B.deeds};
  POOL=p;
  /* find() below never compares a property against another metro's records —
     "never across metros" is a rule this desk enforces, not a filter it merely
     applies — so bucketing the pool by that same key once means every drawer
     render walks its own metro's few thousand records instead of every record
     in the edition. On the 288,949-record edition this is what took a single
     property drawer from several seconds to well under one. */
  POOL_BY_METRO={};
  for(let i=0;i<p.length;i++){ const k=(p[i].nb||p[i].county); (POOL_BY_METRO[k]||(POOL_BY_METRO[k]=[])).push(p[i]); }
  return p;
}
function invalidate(){ POOL=null; POOL_BY_METRO=null; }

/* ---- comps for one property -------------------------------------------- */
function find(l, opt){
  opt=opt||{};
  const want=cls(l), P=pool();
  pool(); // ensure POOL_BY_METRO is built alongside it
  const B=basisOf(l) || (DIAG&&DIAG.sale>=DIAG.post? 'sale':'postsale');
  const maxKm=opt.km||14, maxAge=opt.years||6, need=opt.min||5;
  const out=[]; let dropU=0, dropS=0;
  /* A ZIP centroid (l.approx / c.approx — set only in src/app.js's mk(), for
     a pasted listing whose import carried no coordinates) is not a distance.
     Two records placed at the same centroid with a few hundred metres of
     random jitter would read "0.1 km apart" while their real parcels could
     sit on opposite sides of the ZIP. Neither side of the haversine call
     below may be a guess: an approximate subject gets no comps at all
     (its own distance to anything is fabricated), and an approximate
     candidate is skipped the same way a wrong basis or class already is. */
  const bucket = l.approx? [] : ((POOL_BY_METRO&&POOL_BY_METRO[(l.nb||l.county)])||[]);
  for(let i=0;i<bucket.length;i++){
    const c=bucket[i];
    if(c.id===l.id) continue;
    if(c.approx) continue;
    if(cls(c)!==want) continue;
    if(basisOf(c)!==B) continue;                          // never mix the two bases
    const y=YR(when(c,B)); if(NOW-y>maxAge) continue;
    const km=hav(l.lat,l.lng,c.lat,c.lng); if(km>maxKm) continue;
    if(N(l.units)&&N(c.units)){ const r=c.units/l.units; if(r<0.4||r>2.5) continue; }
    if(N(l.sqft)&&N(c.sqft)){ const r=c.sqft/l.sqft; if(r<0.45||r>2.2) continue; }
    if(N(l.year)&&N(c.year)&&Math.abs(c.year-l.year)>30) continue;
    /* Bound both ratios to a plausible band and count what falls outside it.
       Two known defects make an unbounded per-unit figure meaningless: several
       counties publish a COMPLEX-LEVEL unit count stamped on every row of a
       development (Guilford is documented as doing exactly this, and it is absent
       on the largest apartments), and the unit counts this catalogue derives from
       a class description are BAND LOWER BOUNDS, not counts. Dividing a whole
       complex's sale price by either produces a per-unit number that is wrong by
       an order of magnitude, so anything outside the band is discarded and the
       count of discards is reported rather than hidden. */
    const A=amt(c,B);
    let ppu=N(c.units)? A/c.units : null;
    let ppsf=(N(c.sqft)&&c.sqft>150)? A/c.sqft : null;
    if(ppu!=null && (ppu<8000 || ppu>900000)){ ppu=null; dropU++; }
    if(ppsf!=null && (ppsf<8 || ppsf>1500)){ ppsf=null; dropS++; }
    out.push({l:c, km:km, yr:y, ppu:ppu, ppsf:ppsf});
  }
  out.sort((a,b)=>a.km-b.km);
  const ppu=out.map(x=>x.ppu).filter(N), ppsf=out.map(x=>x.ppsf).filter(N);
  const yrs=out.map(x=>x.yr);
  const res={n:out.length, comps:out.slice(0,40), want:want, need:need,
    ppu:{n:ppu.length, med:q(ppu,0.5), lo:q(ppu,0.25), hi:q(ppu,0.75)},
    ppsf:{n:ppsf.length, med:q(ppsf,0.5), lo:q(ppsf,0.25), hi:q(ppsf,0.75)},
    from:yrs.length?Math.min.apply(null,yrs):null, to:yrs.length?Math.max.apply(null,yrs):null,
    dropU:dropU, dropS:dropS, basis:B, basisName:BASIS[B],
    km:out.length?out[out.length-1].km:null, diag:DIAG};
  res.enough = out.length>=need;
  /* Why there is nothing, when there is nothing — the useful half of the answer. */
  if(!res.enough){
    if(l.approx){
      res.why = 'This subject has no real coordinate — it was placed at a ZIP centroid because the import carried none. '
        +'A distance measured from a guess is not a distance, so no comparable can meet the standard this desk uses. '
        +'Re-import with the address’s real coordinates.';
    } else {
      const metro=(l.nb||l.county);
      let inMetro=0, dated=0;
      const all=L().allListings();
      for(let i=0;i<all.length;i++){ const c=all[i]; if((c.nb||c.county)!==metro) continue; inMetro++;
        if(basisOf(c) && !c.approx) dated++; }
      res.why = dated===0
        ? 'This county publishes no dated sale price at all, so no comparable in it can meet the standard this desk uses. '
          +(inMetro? L().fmtN(inMetro)+' records here carry a value, but a value is an assessor opinion, not a transaction.' : '')
        : 'Only '+L().fmtN(dated)+' of '+L().fmtN(inMetro)+' records in this market carry a dated sale, and '+out.length
          +' of them are close enough in class, size and distance to compare. Widen the radius or the age window, or treat this as unpriced.';
    }
  }
  return res;
}

/* ---- what the roll is not telling you ----------------------------------
   Median recorded sale over the published value, by county, on dated sales in
   the last three years. Sustained above 1 means the roll is behind the market —
   a repricing signal that costs nothing to compute and that no single record
   reveals on its own. */
const VACANT=/vacant|unimproved|incomplete subdivision|\bland\b|no improvement value/i;
function rolls(){
  const P=pool(), by={}; let skipVac=0;
  for(let i=0;i<P.length;i++){
    const l=P[i];
    if(basisOf(l)!=='sale') continue;   // a post-sale assessed value IS the roll; dividing it by itself says nothing
    /* The ratio is only meaningful where the assessor is valuing the same thing the
       buyer bought. On VACANT LAND it is not: a lot can sit on the roll at a nominal
       few thousand and sell for a development price, which produced a median ratio
       above fifty in one county before this exclusion — arithmetically correct and
       completely misleading. Improved property only, and the exclusion is reported. */
    if(VACANT.test(l.kind||'') || VACANT.test(l.band||'')){ skipVac++; continue; }
    const v=N(l.price), s=N(l.sale), y=YR(l.saleDate);
    if(!v||!s||v<25000||s<25000||NOW-y>3) continue;
    const k=l.county||l.nb||'—';
    (by[k]=by[k]||{key:k, r:[], n:0, nb:l.nb}).r.push(s/v);
    by[k].n++;
  }
  rolls.skippedVacant=skipVac;
  const out=Object.values(by).filter(g=>g.n>=40).map(g=>({
    key:g.key, nb:g.nb, n:g.n, med:q(g.r,0.5), lo:q(g.r,0.25), hi:q(g.r,0.75)}));
  out.sort((a,b)=>b.med-a.med);
  return out;
}

/* ---- rendering ---------------------------------------------------------- */
function money(v){ return v==null? '—' : L().fmt$(Math.round(v)); }
function drawer(l){
  let r=null; try{ r=find(l); }catch(e){ return ''; }
  const head='<p class="eyebrow" style="margin:0 0 4px">Comparable recorded sales</p>';
  if(!r.enough){
    return '<div class="sect">'+head
      +'<p style="font-size:12.5px;color:var(--ink2);margin:0">'+esc(r.why||'')+'</p>'
      +'<p style="font-size:11.5px;color:var(--muted);margin:5px 0 0">A comparable here is a <b>recorded sale with a date</b>. '
      +'Assessor values are never used as comparables, and a sale price whose year is unknown is not one either.</p></div>';
  }
  const band=(o,u)=>o.n>=3? money(o.lo)+' – '+money(o.hi)+' <span style="color:var(--muted)">(median '+money(o.med)+', n='+o.n+')</span>'+u : '<span style="color:var(--muted)">too few to state</span>';
  return '<div class="sect">'+head
    +'<div style="font-size:12.5px;line-height:1.7">'
    +'<div><b>'+r.n+'</b> dated '+(r.basis==='sale'?'sales':'post-sale assessments')+' within '+r.km.toFixed(1)+' km, '+r.from+'–'+r.to+', same class</div>'
    +'<div>Per unit: '+band(r.ppu,'')+'</div>'
    +'<div>Per sq ft: '+band(r.ppsf,'')+'</div></div>'
    +'<p style="font-size:11.5px;color:var(--muted);margin:5px 0 0">Interquartile range, not an average — the spread is the information. '
    +(r.basis==='sale'
      ? 'Every figure is a recorded transaction with a known date; no assessor value is included.'
      : 'This market publishes no recorded sale prices, so these are <b>post-sale assessed values</b> — in California a transfer resets the assessed basis to the purchase price, which tracks the deal closely but is an assessment, not the deed. The two bases are never averaged together.')
    +((r.dropU||r.dropS)? ' <b>'+(r.dropU+r.dropS)+'</b> ratio'+((r.dropU+r.dropS)===1?'':'s')+' fell outside a plausible band and '
      +'were discarded — several counties publish a complex-level unit count on every row of a development, and unit counts derived '
      +'from a class description are band lower bounds, so a per-unit figure built on either can be wrong by an order of magnitude.' : '')
    +'</p></div>';
}

function render(){
  const host=$('#compsroot'); if(!host) return;
  invalidate();
  const P=pool(), R=rolls();
  const n=DIAG.total;
  let h='<div class="tiles" style="margin-bottom:14px">'
    + tile('Usable comparables', L().fmtN(DIAG.usable), DIAG.sale&&DIAG.post? L().fmtN(DIAG.sale)+' recorded sales, '+L().fmtN(DIAG.post)+' post-sale assessments' : (DIAG.sale? 'recorded sales with a known date' : 'post-sale assessed values with a known date'))
    + tile('Excluded — no date', L().fmtN(DIAG.undated), 'a price whose year is unknown is not a comparable')
    + tile('Excluded — portfolio deeds', L().fmtN(DIAG.bulk), L().fmtN(DIAG.bulkDeeds)+' bulk sales written onto every parcel in them')
    + tile('Coverage', Math.round(DIAG.usable/n*100)+'%', 'of '+L().fmtN(n)+' records in this edition')
    + tile('Counties with a roll signal', R.length, 'at least 40 dated sales in the last three years')
    + '</div>';

  if(R.length){
    const mx=Math.max(1.4, ...R.map(r=>r.hi||0));
    const W=700, rh=22, lab=190, bw=W-lab-96;
    let svg='<svg viewBox="0 0 '+W+' '+(R.length*rh+30)+'" style="width:100%;height:auto;display:block" role="img">';
    const x=v=>lab+Math.max(0,Math.min(1,v/mx))*bw;
    [0.5,0.75,1,1.25].forEach(g=>{ svg+='<line x1="'+x(g)+'" y1="6" x2="'+x(g)+'" y2="'+(R.length*rh+6)+'" stroke="var(--line)" stroke-width="1"/>'
      +'<text x="'+x(g)+'" y="'+(R.length*rh+20)+'" font-size="10" text-anchor="middle" fill="var(--muted)">'+g.toFixed(2)+'</text>'; });
    svg+='<line x1="'+x(1)+'" y1="6" x2="'+x(1)+'" y2="'+(R.length*rh+6)+'" stroke="var(--ink2)" stroke-width="1.5"/>';
    R.forEach((r,i)=>{
      const y=i*rh+6, c=r.med>=1.08? window.LXPal.tok('--good') : r.med<=0.85? window.LXPal.tok('--bad') : window.LXPal.tok('--warn');
      svg+='<text x="'+(lab-6)+'" y="'+(y+rh*0.68)+'" font-size="11" text-anchor="end" fill="var(--ink2)">'+esc(r.key.slice(0,28))+'</text>'
        +'<line x1="'+x(r.lo)+'" y1="'+(y+rh/2)+'" x2="'+x(r.hi)+'" y2="'+(y+rh/2)+'" stroke="'+c+'" stroke-width="2"/>'
        +'<circle cx="'+x(r.med)+'" cy="'+(y+rh/2)+'" r="4.5" fill="'+c+'"><title>'+esc(r.key)+' — median recorded sale is '
        +(r.med*100).toFixed(0)+'% of the published value, from '+L().fmtN(r.n)+' dated sales in the last three years</title></circle>'
        +'<text x="'+(W-4)+'" y="'+(y+rh*0.68)+'" font-size="10.5" text-anchor="end" fill="var(--muted)">'+r.med.toFixed(2)+'× · n='+L().fmtN(r.n)+'</text>';
    });
    svg+='</svg>';
    h+='<div class="chart"><p class="eyebrow">Cross-referencing two public records</p>'
      +'<h3 style="margin:2px 0 8px">Where the assessment roll is behind the market</h3>'
      +'<p style="font-size:13px;color:var(--ink2);max-width:82ch;margin:0 0 10px">Every county here publishes two numbers about the same parcel: what its assessor thinks it is worth, and what somebody actually paid. Dividing the second by the first, across every dated sale in the last three years, says how current the roll is. <b>Above 1.00 the roll is behind the market</b> — buyers are paying more than the published value, and a screen that trusts assessed values will systematically understate that county. Below 1.00 the roll is ahead, or the recorded transfers include non-arm’s-length deeds. The dot is the median, the line is the interquartile range.</p>'
      +svg
      +'<p class="src">Recorded sales only, each with a published date, minimum forty per county, <b>improved property only</b> — '
      +L().fmtN(window.LXComps&&LXComps.rolls.skippedVacant||0)+' vacant-land sales were excluded, because a lot carried on the roll at a nominal few thousand and sold at a development price makes the ratio arithmetically correct and completely misleading. Both sides must also exceed $25,000. This does not adjust for non-arm’s-length transfers, family conveyances or portfolio deeds, which is why the spread matters as much as the median. Louisiana parishes in particular record donations and successions alongside cash sales, and Tangipahoa marks every one of its transfers unverified.</p></div>';
  } else {
    h+='<div class="chart"><p style="font-size:13px;color:var(--ink2);margin:0">No county in this edition carries at least forty dated sales in the last three years, so the roll signal cannot be computed here. That is a fact about the sources, not about the markets.</p></div>';
  }

  h+='<div class="chart" style="margin-top:14px"><p class="eyebrow">What counts as a comparable</p>'
    +'<h3 style="margin:2px 0 8px">Four rules, and what they cost</h3>'
    +'<ul style="font-size:13px;color:var(--ink2);line-height:1.75;max-width:82ch;margin:0;padding-left:18px">'
    +'<li><b>A recorded sale, never an assessor value.</b> Most records in this catalogue carry a published value; almost none of those are transactions. Using them as comparables would let one county’s opinion set another’s price.</li>'
    +'<li><b>The sale must carry a date.</b> This is the expensive rule. St. Joseph County publishes 4,347 sale prices and a date on <b>twelve</b> of them, so an entire county drops out — a $50,000 sale there could be 1994 or 2024. Washoe publishes prices with no dates at all. Marion publishes no sale price whatsoever.</li>'
    +'<li><b>Same market, same class, similar size.</b> Comparables are drawn only from the same metro, the same broad class (multifamily, lodging, commercial), within 0.4–2.5× on units, 0.45–2.2× on floor area and thirty years on age.</li>'
    +'<li><b>Portfolio deeds are removed.</b> When a whole complex trades, many counties write the entire transaction price onto every parcel in it. Franklin County carries condominium units valued at $53,500 each with a recorded sale price of <b>$170,000,000</b> — the price of the building, repeated across every unit. Any price appearing on the same date against four or more parcels is treated as a portfolio deed and excluded from both the comparables and the roll signal. Left in, a single such deed becomes hundreds of comparables that are each wrong by three orders of magnitude.</li>'
    +'<li><b>Refuse rather than guess.</b> Under five qualifying sales the desk states why and stops. An unpriced asset is an honest output; a comparable set of two is not.</li>'
    +'</ul>'
    +'<p class="src">Ranges are quoted as an interquartile spread rather than an average, because the dispersion is what tells you whether a market is priced or merely traded.</p></div>';

  host.innerHTML=h;
  if(window.LXPanels) setTimeout(()=>LXPanels.scan('comps'),140);
}
function tile(k,v,note){ return '<div class="tile"><p class="eyebrow" style="margin:0">'+esc(k)+'</p><p class="big num" style="margin:4px 0 2px">'+v+'</p><p style="font-size:11.5px;color:var(--muted);margin:0">'+esc(note)+'</p></div>'; }

window.LXComps={render, find, rolls, drawer, invalidate, pool};
})();
