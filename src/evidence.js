/* locator.x — evidence grading and the corridor scorecard.
   ----------------------------------------------------------------------------
   This app pulls from ~30 county sources of wildly unequal quality. Guilford
   publishes a recorded use, a real zoning string, bedrooms and a disclosure-state
   sale price. Bossier publishes a value and a coordinate and nothing else — not a
   use, not a year, not a unit count. Both arrive as a row on the same map, and a
   row is not evidence.

   So every record is graded on WHAT ITS SOURCE ACTUALLY PUBLISHES, never on how
   good the deal looks. A grade is a statement about the paperwork, not the asset:
   an A record can be a terrible buy and a D record can be a great one you cannot
   yet verify. The grade tells you how much of your diligence is already done.

   The corridor scorecard then ranks the fifteen areas twice — once on announced
   capital, once on stock you can actually underwrite — because the two rankings
   disagree, and the disagreement is the finding. */
(function(){
'use strict';
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const L=()=>window.LX, D=()=>window.LXDash;
const esc=s=>L().esc(s);
const N=v=>(typeof v==='number'&&isFinite(v))?v:null;
/* comps.js's own basisOf() and uwexport.js's gap check both treat a sale
   price with no recorded date as unusable — "a price whose year is unknown
   cannot be used as a comparable" (uwexport.js) — and build_data_uswide.py
   etc. genuinely ship that combination as l.saleUndated. This grade used to
   award full credit for l.sale alone, calling an undated price "a recorded
   sale price... the one figure here that is not an opinion" while the
   underwriting export excluded the same record from every range in its
   memorandum. A recorded sale needs its date, same as anywhere else in this
   app the phrase is used. */
const hasSale=l=>!!N(l.sale)&&!!l.saleDate;

const ZONED=/^zoned\b/i, UNCL=/unclassified/i, APOINT=/address point/i;

/* ---------- the grade ---------------------------------------------------- */
const TESTS=[
  ['use',   22, l=>!ZONED.test(l.kind||'') && !UNCL.test(l.kind||'') && !!(l.kind||'').trim(),
   'a recorded use', 'The jurisdiction says what the property IS, not merely what its district permits.'],
  ['price', 20, l=>!!N(l.price),
   'a published value', 'An assessor figure in almost every county here — never a listing price.'],
  ['size',  18, l=>!!(N(l.units)||N(l.sqft)),
   'a size', 'A unit count or a building area. Without one you cannot price per unit or per foot.'],
  ['year',  13, l=>!!N(l.year),
   'a year built', 'Age drives condition, code path, rent regulation and conversion feasibility.'],
  ['lot',   9,  l=>!!N(l.lot),
   'a lot area', 'Needed for any density, subdivision or add-a-unit test.'],
  ['sale',  12, hasSale,
   'a recorded sale price', 'A real, dated transaction, only in disclosure states — the one figure here that is not an opinion.'],
  ['rooms', 6,  l=>!!(N(l.beds)||N(l.baths)||N(l.stories)),
   'building detail', 'Bedrooms, baths or storeys — the difference between a record and a description.']
];
const BANDS=[[78,'A','Underwritable from the record'],[58,'B','Most of the work is done'],
             [36,'C','Enough to shortlist, not to offer'],[0,'D','A location and little else']];

function grade(l){
  let s=0, mask=0; const has=[], missing=[];
  for(let i=0;i<TESTS.length;i++){ const t=TESTS[i]; let ok=false; try{ ok=!!t[2](l); }catch(e){}
    if(ok){ s+=t[1]; has.push(t); mask|=(1<<i); } else missing.push(t); }
  if(ZONED.test(l.kind||'')) s=Math.min(s, 55);      // a permission is not a building
  if(UNCL.test(l.kind||'')||APOINT.test(l.kind||'')) s=Math.min(s, 34);
  const b=BANDS.find(x=>s>=x[0]);
  return {score:Math.round(s), band:b[1], label:b[2], has, missing, hasSet:mask,
          zoningOnly:ZONED.test(l.kind||''), unclassified:UNCL.test(l.kind||'')};
}
const BANDCOL={A:1,B:2,C:3,D:5};
function col(band){ try{ return window.LXPal.cat(['','asset','hack','value','growth','liab'][BANDCOL[band]]); }catch(e){ return '#888'; } }
const SHAPE={A:'circle',B:'square',C:'diamond',D:'cross'};

/* ---------- the scorecard ------------------------------------------------ */
let _sc=null, _scKey=null;
function scorecard(){
  const X=L(); const rows=X.allListings();
  const key=rows.length;
  if(_sc && _scKey===key) return _sc;
  /* Group at whatever level actually separates the sources. In the corridor
     editions that is the metro; in a single-region edition the neighbourhood
     field can run to a couple of hundred values, which tells you nothing about
     data quality — every one of them came from the same county recorder — so
     fall back to the county. */
  let nb=new Set(), cty=new Set();
  for(let i=0;i<rows.length;i+=Math.max(1,Math.floor(rows.length/4000))){
    if(rows[i].nb) nb.add(rows[i].nb); if(rows[i].county) cty.add(rows[i].county);
  }
  const useCounty = nb.size>40 && cty.size>=1;
  const by={}; const hits=TESTS.map(()=>0);
  for(let i=0;i<rows.length;i++){
    const l=rows[i], k=(useCounty? (l.county||l.nb) : (l.nb||l.county))||'—';
    const g=by[k]||(by[k]={key:k, n:0, A:0,B:0,C:0,D:0, zoned:0, uncl:0,
                            units:[], price:[], camp:0, campN:0, proj:0, sale:0, big:0});
    g.n++;
    const e=grade(l); g[e.band]++;
    for(let t=0;t<TESTS.length;t++){ if(e.hasSet&(1<<t)) hits[t]++; }
    if(e.zoningOnly) g.zoned++; if(e.unclassified) g.uncl++;
    if(N(l.units)) g.units.push(l.units);
    if(N(l.price)) g.price.push(l.price);
    if(hasSale(l)) g.sale++;
    if(N(l.campKm)!=null){ g.campN++; if(l.campKm<=1.6) g.camp++; }
    if(N(l.projKm)!=null && l.projKm<=16) g.proj++;
    if((N(l.price)||0)>=5e6) g.big++;
  }
  const med=a=>{ if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
  const out=Object.values(by).map(g=>({
    key:g.key, n:g.n, A:g.A, B:g.B, C:g.C, D:g.D,
    gradeShare:(g.A+g.B)/g.n,
    zonedShare:g.zoned/g.n, unclShare:g.uncl/g.n,
    medUnits:med(g.units), medPrice:med(g.price),
    saleShare:g.sale/g.n, campShare:g.campN? g.camp/g.campN : null,
    projShare:g.proj/g.n, big:g.big
  }));
  out.sort((a,b)=>b.gradeShare-a.gradeShare || b.n-a.n);
  out.level = useCounty? 'county' : 'area';
  out.testHits = hits;          // per-test population, counted in this same pass
  _sc=out; _scKey=key;
  return out;
}

/* the disagreement: announced capital rank against underwritable-stock rank */
function disagree(){
  const C=window.LXCORRIDORS; if(!C) return null;
  const sc=scorecard(); const byKey={}; sc.forEach(r=>byKey[r.key]=r);
  const MAPN={'Phoenix-Mesa-Chandler, AZ':'Phoenix-Mesa-Chandler','Columbus, OH':'Columbus',
    'Savannah, GA':'Savannah','Syracuse, NY':'Syracuse','Reno, NV':'Reno',
    'South Bend-Mishawaka, IN-MI':'South Bend-Mishawaka, IN','Lafayette, LA (MSA)':'Lafayette, LA',
    'Shreveport-Bossier City, LA (MSA)':'Shreveport-Bossier City, LA','Hammond, LA (MSA)':'Hammond, LA',
    'Ruston, LA (Micropolitan)':'Ruston, LA','Lake Charles, LA (MSA)':'Lake Charles, LA',
    'Milwaukee-Waukesha, WI + Racine-Mount Pleasant, WI':'Milwaukee-Waukesha + Racine, WI'};
  const rows=[];
  C.metros.forEach(m=>{
    const k=MAPN[m.metro]||m.metro;
    const r=byKey[k]; if(!r) return;
    rows.push({metro:m.metro, jobs:m.jobs||0, capital:m.capital||0,
      n:r.n, ab:r.A+r.B, abShare:r.gradeShare, medUnits:r.medUnits, big:r.big, key:k});
  });
  if(rows.length<3) return null;
  const rank=(arr,f)=>{ const s=arr.slice().sort((a,b)=>f(b)-f(a)); const m=new Map(); s.forEach((x,i)=>m.set(x.metro,i+1)); return m; };
  const rc=rank(rows,x=>x.capital), rj=rank(rows,x=>x.jobs), ru=rank(rows,x=>x.ab);
  rows.forEach(r=>{ r.rCap=rc.get(r.metro); r.rJobs=rj.get(r.metro); r.rStock=ru.get(r.metro); r.gap=r.rCap-r.rStock; });
  rows.sort((a,b)=>a.rStock-b.rStock);
  return rows;
}

/* ---------- rendering ---------------------------------------------------- */
function bar(rows, w, h){
  const max=Math.max(...rows.map(r=>r.n));
  const lab=Math.min(230, Math.max(...rows.map(r=>r.key.length))*6.4+10);
  const rh=Math.max(17, Math.floor((h-16)/rows.length));
  let s='<svg viewBox="0 0 '+w+' '+(rows.length*rh+20)+'" style="width:100%;height:auto;display:block" role="img">';
  rows.forEach((r,i)=>{
    const y=i*rh+4, bw=w-lab-70;
    s+='<text x="'+(lab-6)+'" y="'+(y+rh*0.66)+'" font-size="11" text-anchor="end" fill="var(--ink2)">'+esc(r.key.slice(0,32))+'</text>';
    let x=lab;
    ['A','B','C','D'].forEach(b=>{
      const v=r[b]; if(!v) return;
      const ww=Math.max(0.6, v/max*bw);
      s+='<rect x="'+x.toFixed(1)+'" y="'+(y+2)+'" width="'+ww.toFixed(1)+'" height="'+(rh-6)+'" fill="'+col(b)+'" rx="1.5">'
        +'<title>'+esc(r.key)+' — grade '+b+': '+L().fmtN(v)+' records ('+Math.round(v/r.n*100)+'%)</title></rect>';
      x+=ww+2;
    });
    s+='<text x="'+(w-4)+'" y="'+(y+rh*0.66)+'" font-size="10.5" text-anchor="end" fill="var(--muted)">'
      +Math.round(r.gradeShare*100)+'% A/B</text>';
  });
  return s+'</svg>';
}

function render(){
  const host=$('#evidroot'); if(!host) return;
  const sc=scorecard(); const dis=disagree();
  const all=L().allListings();
  const tot={A:0,B:0,C:0,D:0};
  sc.forEach(r=>{ tot.A+=r.A; tot.B+=r.B; tot.C+=r.C; tot.D+=r.D; });
  const n=all.length;
  const leg=['A','B','C','D'].map(b=>{
    const sw=window.LXPal? window.LXPal.swatch(col(b), SHAPE[b], 12) : '';
    const band=BANDS.find(x=>x[1]===b);
    return '<span>'+sw+'<b>'+b+'</b> — '+esc(band[2])+' <span style="color:var(--muted)">('
      +L().fmtN(tot[b])+', '+Math.round(tot[b]/n*100)+'%)</span></span>';
  }).join('');

  let h='<div class="tiles" style="margin-bottom:14px">'
    + tile('Records graded', L().fmtN(n), 'every record in this edition')
    + tile('Underwritable from the record', Math.round((tot.A+tot.B)/n*100)+'%', 'grade A or B')
    + tile('A location and little else', Math.round(tot.D/n*100)+'%', 'grade D — real parcels, unusable paperwork')
    + tile('Carry a recorded sale', L().fmtN(all.filter(hasSale).length), 'the only figure here that is not an opinion')
    + '</div>';

  h+='<div class="chart"><p class="eyebrow">Evidence by area</p>'
    +'<h3 style="margin:2px 0 8px">What each source actually publishes</h3>'
    +'<p style="font-size:12px;color:var(--muted);margin:0 0 4px">Grouped by '+(sc.level==='county'?'county — the level at which a recorder\u2019s practice actually varies':'area')+'.</p>'
    +'<p style="font-size:13px;color:var(--ink2);max-width:82ch;margin:0 0 10px">Bar length is the record count; the split is the evidence grade. This is a statement about paperwork, not about markets — <b>a grade A record can be a bad buy and a grade D record can be a good one you cannot yet verify.</b> What it tells you is how much diligence the county has already done for you.</p>'
    +bar(sc.slice(0,26), 700, Math.min(560, sc.length*20+24))
    +'<div class="legend2" style="margin-top:8px">'+leg+'<span style="color:var(--muted)">· shape and colour both carry the grade</span></div></div>';

  if(dis){
    h+='<div class="chart" style="margin-top:14px"><p class="eyebrow">The disagreement</p>'
      +'<h3 style="margin:2px 0 8px">Where the capital is announced versus where you can actually buy</h3>'
      +'<p style="font-size:13px;color:var(--ink2);max-width:82ch;margin:0 0 10px">Each corridor is ranked twice: once by <b>announced private capital</b>, once by <b>how many records here are good enough to underwrite</b> (grade A or B). A positive gap means the buyable stock is better than the capital ranking suggests; a negative gap means the money is arriving somewhere the public record cannot yet describe. Neither ranking is the truth — the spread between them is where the work is.</p>'
      +'<div class="tablewrap"><table class="tbl"><thead><tr><th>Corridor</th><th class="r">Capital rank</th><th class="r">Underwritable rank</th><th class="r">Gap</th><th class="r">Grade A/B</th><th class="r">Records</th><th class="r">$5M+</th></tr></thead><tbody>'
      + dis.map(r=>{
          const g=r.gap, c=g>2?'var(--good)':g<-2?'var(--bad)':'var(--ink2)';
          return '<tr><td><b>'+esc(r.metro)+'</b></td><td class="r">'+r.rCap+'</td><td class="r">'+r.rStock+'</td>'
            +'<td class="r" style="color:'+c+';font-weight:600">'+(g>0?'+':'')+g+'</td>'
            +'<td class="r">'+L().fmtN(r.ab)+' <span style="color:var(--muted)">('+Math.round(r.abShare*100)+'%)</span></td>'
            +'<td class="r">'+L().fmtN(r.n)+'</td><td class="r">'+L().fmtN(r.big)+'</td></tr>';
        }).join('')
      +'</tbody></table></div>'
      +'<p class="src">Capital and job figures are the announced totals carried on the Growth corridors tab, each with its own source and announcement date. An announced project is an intention, never a forecast. The underwritable ranking counts only records this edition actually holds, so a corridor with a thin public source ranks low on evidence even where the market may be strong — that is a fact about the county recorder, not about the market.</p></div>';
  }

  h+='<div class="chart" style="margin-top:14px"><p class="eyebrow">How the grade is computed</p>'
    +'<h3 style="margin:2px 0 8px">Seven tests, and two ceilings</h3>'
    +'<div class="tablewrap"><table class="tbl"><thead><tr><th>Test</th><th class="r">Weight</th><th>What it means</th><th class="r">Share of this edition</th></tr></thead><tbody>'
    + TESTS.map((t,i)=>{
        const c=(sc.testHits&&sc.testHits[i])||0;
        return '<tr><td><b>'+esc(t[3])+'</b></td><td class="r">'+t[1]+'</td><td style="font-size:12.5px">'+esc(t[4])+'</td>'
          +'<td class="r">'+Math.round(c/n*100)+'%</td></tr>';
      }).join('')
    +'</tbody></table></div>'
    +'<p style="font-size:13px;color:var(--ink2);max-width:82ch;margin:10px 0 0"><b>Two ceilings override the arithmetic.</b> A record selected by <b>zoning rather than use</b> can never exceed 55 — the district permits something, which is not evidence that it stands there. A record the source leaves <b>unclassified</b> can never exceed 34, however complete the rest of it is. Both are common in this catalogue and both are stated on the record itself.</p>'
    +'<p class="src">Nothing in this grade is a judgement about the property. It measures the county, not the building.</p></div>';

  host.innerHTML=h;
  if(window.LXPanels) setTimeout(()=>LXPanels.scan('evidence'),140);
}
function tile(k,v,note){ return '<div class="tile"><p class="eyebrow" style="margin:0">'+esc(k)+'</p><p class="big num" style="margin:4px 0 2px">'+v+'</p><p style="font-size:11.5px;color:var(--muted);margin:0">'+esc(note)+'</p></div>'; }

/* TESTS is exported for the coverage panel (src/coverage.js), which measures
   each of these across a whole edition. A second list there would drift from
   this one, and the panel would then report coverage of fields the grade no
   longer uses. */
window.LXEvid={render, grade, scorecard, disagree, BANDS, TESTS, col};
})();
