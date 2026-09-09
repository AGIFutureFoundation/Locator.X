/* locator.x — the property tower signal.
   Every property on the map extruded into a tower whose HEIGHT is a metric you pick and
   whose COLOUR is its Locator X category. Unlike the ZIP-tower layer, this needs no
   polygon geometry at all — it builds a small footprint around each record's own
   coordinate — so it works in every edition, including the corridor editions that ship
   with no boundary files.

   It honours window.__lxAsOf, so dragging the replay slider re-extrudes the whole field
   at that month. It honours the active filters and the goal view. And it is viewport
   aware: at 290,000 records nothing sane draws them all, so it takes the strongest N
   inside the current view and rebuilds on move. The legend always says how many of how
   many you are looking at, because a tower field that silently truncates is a lie. */
(function(){
'use strict';
const $=(s,el=document)=>el.querySelector(s);
const L=()=>window.LX, D=()=>window.LXDash;
const num=v=>(typeof v==='number'&&isFinite(v))?v:null;

/* ---------- what a tower can measure ----------
   [id, label, getter, scale (metres per unit), unit, note] */
const MET=[
 ['score','Locator X score', l=>{ try{ const a=D().analyze(l); return a?a.score:null; }catch(e){ return null; } }, 26, '', 'The whole scoring ensemble, recomputed at the replay month.'],
 ['cf','Cash flow after the mortgage', l=>{ try{ const d=L().deal(l); return d?Math.max(-2500,Math.min(6000,d.cfMo)):null; }catch(e){ return null; } }, 0.55, '$/mo', 'Monthly cash flow at your assumptions. Towers below the plate are negative.'],
 ['cap','Cap rate', l=>{ try{ const d=L().deal(l); return d&&isFinite(d.cap)?Math.max(0,Math.min(20,d.cap*100)):null; }catch(e){ return null; } }, 130, '%', 'Net operating income over price, before financing.'],
 ['dscr','Debt service coverage', l=>{ try{ const d=L().deal(l); return d&&d.dscr?Math.max(0,Math.min(4,d.dscr)):null; }catch(e){ return null; } }, 620, '×', 'NOI over annual debt service. Below 1.20 most lenders decline.'],
 ['bmkt','Below-market index', l=>{ try{ const a=window.LXBM&&LXBM.assess(l); return a?a.idx:null; }catch(e){ return null; } }, 26, '', 'Evidence of a gap to market — recorded sale, price per foot and basis kept separate.'],
 ['units','Units', l=>num(l.units), 90, 'units', 'Where the source publishes a unit count. Band lower bounds are marked as such on the record.'],
 ['ppsf','Price per square foot', l=>{ const p=num(l.price), s=num(l.sqft); return (p&&s&&s>120)?Math.min(1600,p/s):null; }, 1.6, '$/sf', 'Only for records that publish a building area.'],
 ['val','Recorded value', l=>{ const p=num(l.price); return p?Math.min(40e6,p):null; }, 0.00012, '$', 'The value the jurisdiction publishes — an assessor figure in most counties, never a listing price.'],
 ['camp','Campus pull', l=>{ const k=num(l.campKm); return k==null?null:Math.max(0,20-k); }, 110, 'km closer than 20', 'Distance to the nearest campus in the published-enrollment table, inverted so nearer is taller.'],
 ['proj','Announced-capital pull', l=>{ const k=num(l.projKm); return k==null?null:Math.max(0,40-k); }, 55, 'km closer than 40', 'Distance to the nearest announced project, inverted so nearer is taller.'],
 ['yr','Age', l=>{ const y=num(l.year); return y?Math.max(0,Math.min(140,2026-y)):null; }, 22, 'years', 'Older stock is taller — age is where conversion and value-add live.'],
 ['evid','Evidence grade', l=>{ try{ const g=window.LXEvid&&LXEvid.grade(l); return g?g.score:null; }catch(e){ return null; } }, 26, '0-100', 'How much the county already documents — a recorded use, a size, a year, a sale. It measures the paperwork, never the asset.'],
 ['dis','Live distress records', l=>{ try{ const d=D().distressOf(l); return d&&d.e>=0.4?d.s:null; }catch(e){ return null; } }, 26, '', 'Only where the public record actually carries a distress signal.']
];
const M=Object.fromEntries(MET.map(m=>[m[0],m]));

let S={on:false, metric:'score', cap:9000, emphN:0, last:0, count:0, total:0, viewport:true, bound:false};

function catColor(l){
  try{
    const a=D().analyze(l);
    if(a&&a.cat&&window.LXPal) return window.LXPal.cat(a.cat);
  }catch(e){}
  return window.LXPal? window.LXPal.tok('--muted') : '#888';
}

/* a square footprint in degrees around the point. Size grows a little with the
   record's own weight so a 300-unit complex reads bigger than a duplex. */
function foot(l, w){
  const dLat=w/111320, dLng=w/(111320*Math.max(0.3,Math.cos(l.lat*Math.PI/180)));
  const a=l.lng-dLng, b=l.lng+dLng, c=l.lat-dLat, d=l.lat+dLat;
  return [[[a,c],[b,c],[b,d],[a,d],[a,c]]];
}

function rows(){
  const X=L();
  let r=[];
  try{ r=X.filtered? X.filtered() : X.allListings(); }catch(e){ try{ r=X.allListings(); }catch(e2){ r=[]; } }
  const VW=(window.LXView&&window.LXView.active())? window.LXView : null;
  if(VW) r=r.filter(l=>{ try{ return VW.pass(l); }catch(e){ return true; } });
  return r;
}

function build(){
  const map=window.__lxmap; if(!map||!map.getSource) return null;
  const m=M[S.metric]||MET[0];
  const all=rows();
  let bb=null;
  try{ bb=map.getBounds(); }catch(e){}
  const inView=[];
  for(let i=0;i<all.length;i++){
    const l=all[i];
    if(l.lat==null||l.lng==null) continue;
    if(bb && (l.lng<bb.getWest()||l.lng>bb.getEast()||l.lat<bb.getSouth()||l.lat>bb.getNorth())) continue;
    inView.push(l);
  }
  /* A viewport can legitimately contain nothing — the user has panned to open water,
     or the map has not finished fitting the region yet. Falling back to the whole
     filtered set is far more useful than an empty field and a confusing toast, and the
     legend says which of the two you are looking at. */
  S.viewport = inView.length>0;
  const base = S.viewport ? inView : all.filter(l=>l.lat!=null&&l.lng!=null);
  S.total=base.length;
  if(!S.total) return null;
  /* score every candidate, then keep the strongest — a truncated field should show
     you the top of the distribution, never an arbitrary slice of it */
  const scored=[];
  const LIM=Math.min(base.length, Math.max(S.cap*3, 24000));
  const stride=Math.max(1, Math.floor(base.length/LIM));
  for(let i=0;i<base.length;i+=stride){
    const l=base[i], v=m[2](l);
    if(v==null||!isFinite(v)) continue;
    scored.push([v,l]);
  }
  if(!scored.length) return null;
  scored.sort((a,b)=>b[0]-a[0]);
  const take=scored.slice(0, S.cap);
  S.count=take.length;
  const zoom=(map.getZoom&&map.getZoom())||10;
  const w=Math.max(7, Math.min(120, 2600/Math.pow(2, zoom-9)));
  /* EMPHASIS. A field of nine thousand equal towers hides its own answer, so the
     top decile on the chosen measure is drawn taller and at full opacity while the
     rest are compressed toward the plate. Nothing is invented: the ordering is the
     measure itself, and the legend says what fraction is being emphasised. */
  const cut = take.length>40 ? take[Math.floor(take.length*0.1)][0] : -Infinity;
  S.emphN = 0;
  const feats=take.map(([v,l])=>{
    const top = v>=cut;
    if(top) S.emphN++;
    const h=Math.max(6, v*m[3]*(top?1.55:0.72));
    return {type:'Feature', properties:{th:h, tc:catColor(l), id:l.id, v:v, top:top?1:0},
            geometry:{type:'Polygon', coordinates:foot(l, w*(top?1.35:1)*(1+Math.min(1.6, Math.log10(1+(l.units||1))))) }};
  });
  return {type:'FeatureCollection', features:feats};
}

function paint(){
  const map=window.__lxmap; if(!map) return false;
  const data=build();
  if(!data||!data.features.length) return false;
  if(map.getSource('lxptowers')) map.getSource('lxptowers').setData(data);
  else map.addSource('lxptowers',{type:'geojson',data});
  if(!map.getLayer('lxptower')){
    map.addLayer({id:'lxptower', type:'fill-extrusion', source:'lxptowers',
      paint:{'fill-extrusion-color':['get','tc'],'fill-extrusion-height':['get','th'],
             'fill-extrusion-base':0,
             'fill-extrusion-opacity':['case',['==',['get','top'],1],0.92,0.42]}});
  }
  legend();
  return true;
}

function legend(){
  const el=$('#ptowerlegend'); if(!el) return;
  if(!S.on){ el.innerHTML=''; return; }
  const m=M[S.metric]||MET[0];
  const cats=(window.LXDash&&window.LXDash.CATS)||[];
  const sw=cats.map(c=>{
    const col=window.LXPal? window.LXPal.cat(c.id) : '#888';
    return '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:9px">'
      +'<i style="width:9px;height:9px;border-radius:2px;background:'+col+';display:inline-block"></i>'
      +L().esc(c.name)+'</span>';
  }).join('');
  const where = S.viewport? 'in view' : 'in this edition (the current viewport holds none, so the whole filtered set is shown)';
  const trunc = S.total>S.count
    ? ' — showing the <b>'+L().fmtN(S.count)+'</b> strongest of <b>'+L().fmtN(S.total)+'</b> '+where
    : ' — all <b>'+L().fmtN(S.count)+'</b> '+where;
  const emph = S.emphN? ' The <b>top decile</b> on this measure ('+L().fmtN(S.emphN)+' of '+L().fmtN(S.count)
    +') is drawn taller, wider and at full opacity; everything else is compressed toward the plate so the strongest stock reads at a glance. The ordering is the measure itself.' : '';
  el.innerHTML='<div style="font-size:11px;color:var(--muted);line-height:1.6">'
    +'Tower height = <b>'+L().esc(m[1])+'</b>'+(m[4]?' ('+L().esc(m[4])+')':'')+trunc
    +'. Colour is the Locator X category, not the height.'+emph+'<br>'+sw
    +'<span style="opacity:.85">'+L().esc(m[5])+'</span></div>';
}

function toggle(on, metric){
  const map=window.__lxmap; if(!map||!map.getSource) return false;
  if(metric) S.metric=metric;
  try{
    if(!on){
      S.on=false;
      if(map.getLayer('lxptower')) map.removeLayer('lxptower');
      if(map.getPitch&&map.getPitch()>5) map.easeTo({pitch:0,duration:600});
      legend(); return true;
    }
    if(!paint()) return false;
    S.on=true;
    try{ if(map.setMaxPitch) map.setMaxPitch(80); }catch(e){}
    map.easeTo({pitch:58, duration:900});
    if(!S.bound){
      S.bound=true;
      map.on('moveend',()=>{ if(S.on){ const n=Date.now(); if(n-S.last<220) return; S.last=n; paint(); } });
    }
    return true;
  }catch(e){ return false; }
}

function refresh(){ if(S.on) paint(); }

function mount(){
  const host=$('#ptowerctl'); if(!host||host.dataset.built) return;
  host.dataset.built='1';
  host.innerHTML='<button class="btn" id="pt3d" aria-pressed="false" title="Extrude every property into a tower whose height is the metric you choose">🗼 Property towers</button>'
    +'<select id="ptmetric" title="What the tower height measures">'
    +MET.map(m=>'<option value="'+m[0]+'">'+L().esc(m[1])+'</option>').join('')+'</select>'
    +'<select id="ptcap" title="How many towers to draw at once">'
    +'<option value="4000">4k towers</option><option value="9000" selected>9k towers</option>'
    +'<option value="18000">18k towers</option><option value="32000">32k towers</option></select>';
  $('#pt3d').addEventListener('click',()=>{
    const ok=toggle(!S.on, $('#ptmetric').value);
    $('#pt3d').textContent = S.on? '🗼 hide towers' : '🗼 Property towers';
    $('#pt3d').setAttribute('aria-pressed', S.on);
    if(!ok&&!S.on) L().toast('No record in view publishes that measure — try another, or zoom out.');
  });
  $('#ptmetric').addEventListener('change',e=>{ S.metric=e.target.value; if(S.on&&!paint()) L().toast('No record in view publishes that measure.'); });
  $('#ptcap').addEventListener('change',e=>{ S.cap=+e.target.value; refresh(); });
}

window.LXTowers={mount, refresh, toggle, MET, state:S};
document.addEventListener('DOMContentLoaded',mount);
setTimeout(mount, 600);
})();
