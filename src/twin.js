/* locator.x — Digital Twin: procedural 3D massing of every cataloged site, walkable
   first-person mode, inside catalog, sector fabric layers, and an AR/VR export bridge.
   Buildings are PROCEDURAL: footprints are estimated from assessor living area, stories
   and lot size — massing models, not surveyed geometry. */
(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const L=()=>window.LX;
let tmap=null, ready=false, bldGeo=null, catAll=null, walking=false, keys={}, raf=0, satOn=false, sel=null, failedGL=false;
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ---------- procedural buildings ---------- */
function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0)/4294967295; }
function storiesOf(l){ if(l.stories) return Math.max(1,Math.min(6,l.stories)); if(l.units>=5) return 3; if(l.units>=3) return 3; if(l.units===2) return 2; return /condo/i.test(l.kind||'')?4:2; }
function footprint(l){
  const st=storiesOf(l);
  let m2=l.sqft? (l.sqft*0.0929)/st : (l.units>1? 120+40*l.units : 110);
  m2=Math.max(45, Math.min(500, m2));
  if(l.lot){ m2=Math.min(m2, l.lot*0.0929*0.75); m2=Math.max(m2,40); }
  const r=hash(l.id), asp=1.25+r*0.9, w=Math.sqrt(m2*asp), d=m2/w, th=r*Math.PI;
  const cosT=Math.cos(th), sinT=Math.sin(th);
  const kLat=1/111320, kLng=1/(111320*Math.cos(l.lat*Math.PI/180));
  const pts=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,y])=>[
    l.lng+(x*cosT-y*sinT)*kLng, l.lat+(x*sinT+y*cosT)*kLat ]);
  pts.push(pts[0]);
  return {poly:[pts], h: st*3.4+1.5, st};
}
function buildAll(){
  if(bldGeo) return bldGeo;
  const rows=L().allListings().filter(l=>l.lat&&l.lng&&!l.approx);
  catAll={};
  const feats=rows.map(l=>{
    let a=null; try{ a=window.LXDash? LXDash.analyze(l):null; }catch(e){}
    const cat=a&&a.cat? a.cat.id : 'liab';
    const fp=footprint(l);
    catAll[l.id]={cat, score:a?Math.round(a.score):null, va:a&&a.va?a.va.score:0, rc:a&&a.rc?a.rc.level:'good', sus:a?!!a.sus:false};
    return {type:'Feature', properties:{id:l.id, cat, h:fp.h, st:fp.st, hh:((window.LXHH&&LXHH.candidate)? LXHH.candidate(l) : ((l.units||1)>=2 && (l.units||1)<=4))?1:0, va:catAll[l.id].va>=25?1:0, rc:catAll[l.id].rc, score:catAll[l.id].score}, geometry:{type:'Polygon', coordinates:fp.poly}};
  });
  bldGeo={type:'FeatureCollection', features:feats};
  return bldGeo;
}

/* ---------- map ---------- */
function catColors(){ return {asset:css('--cat1'),hack:css('--cat2'),value:css('--cat3'),growth:css('--cat4'),liab:css('--cat5')}; }
function colorExpr(mode){
  const c=catColors();
  if(mode==='hack') return ['case',['==',['get','hh'],1], c.hack, '#54637a'];
  if(mode==='dev') return ['case',['==',['get','va'],1], c.value, '#54637a'];
  if(mode==='reg') return ['match',['get','rc'],'bad',window.LXPal.tok('--bad'),'warn',c.value,window.LXPal.tok('--good')];
  return ['match',['get','cat'],'asset',c.asset,'hack',c.hack,'value',c.value,'growth',c.growth,c.liab];
}
function initMap(){
  if(tmap || typeof maplibregl==='undefined') return;
  const G=L().BA.geo;
  const dark=document.documentElement.dataset.theme==='dark'||(matchMedia('(prefers-color-scheme: dark)').matches&&document.documentElement.dataset.theme!=='light');
  const style={version:8, sources:{
      land:{type:'geojson',data:G.counties}, urban:{type:'geojson',data:G.urban}, parks:{type:'geojson',data:G.parks},
      roads:{type:'geojson',data:G.roads}, bld:{type:'geojson',data:buildAll()}
    }, layers:[
      {id:'bg',type:'background',paint:{'background-color':dark?'#0b1524':'#bcd6e8'}},
      {id:'land',type:'fill',source:'land',paint:{'fill-color':dark?'#101c2e':'#eef3ec'}},
      {id:'urban',type:'fill',source:'urban',paint:{'fill-color':dark?'#152238':'#e3e8e0','fill-opacity':0.8}},
      {id:'parks',type:'fill',source:'parks',paint:{'fill-color':dark?'#12301f':'#cfe6c8','fill-opacity':0.7}},
      {id:'roads',type:'line',source:'roads',paint:{'line-color':dark?'#2b3c58':'#c9cfc4','line-width':['interpolate',['linear'],['zoom'],10,0.5,16,4]}},
      {id:'bld3d',type:'fill-extrusion',source:'bld',paint:{
        'fill-extrusion-color':colorExpr('estate'),
        'fill-extrusion-height':['get','h'], 'fill-extrusion-base':0, 'fill-extrusion-opacity':0.92}}
    ]};
  try{
    /* THE TWIN OPENED IN SAN FRANCISCO, IN EVERY EDITION.

       center was [-122.416, 37.762] and maxBounds was the Bay Area box, both
       hard-coded, while app.js has always taken BA.region for exactly this.
       Measured on the synthetic fleet 2026-09-16: the twin opened 11,566 km
       from the edition's own records, and because the records fell OUTSIDE
       maxBounds the user could not pan to them — the view was not merely
       misplaced, it was locked away from its own data.

       Same defect as the sixty-four hard-coded Bay Area city labels and the
       Bay-calibrated choropleth stops: Bay-Area-first code that was never
       revisited when the app went multi-edition. The region is used where it
       exists; otherwise the centroid of the records themselves, which is the
       one thing that is always right. */
    const TW = twinView();
    tmap=new maplibregl.Map({container:'twinmap', style, center:TW.center, zoom:15.4, pitch:58, bearing:-17, minZoom:9, maxZoom:19.5, attributionControl:false, maxBounds:TW.maxBounds, maxPitch:80, antialias:true});
    tmap.addControl(new maplibregl.NavigationControl({visualizePitch:true}), 'top-right');
    tmap.on('click','bld3d', e=>{ const f=e.features&&e.features[0]; if(f) openCatalog(f.properties.id); });
    tmap.on('mouseenter','bld3d',()=>tmap.getCanvas().style.cursor='pointer');
    tmap.on('mouseleave','bld3d',()=>tmap.getCanvas().style.cursor='');
    tmap.on('error', e=>{ if(e&&e.sourceId==='sat'){ satOn=false; const cb=$('#tw_sat'); if(cb) cb.checked=false; if(tmap.getLayer('sat')) tmap.removeLayer('sat'); if(tmap.getSource('sat')) tmap.removeSource('sat'); L().toast('Satellite ground could not load here — open the downloaded locator.x file for imagery under the twin.'); } });
  }catch(e){ failedGL=true; window.__twinErr=String(e); }
}
function setSector(mode){
  $$('#twinlayers button').forEach(b=>b.classList.toggle('on', b.dataset.sec===mode));
  if(tmap&&tmap.getLayer('bld3d')) tmap.setPaintProperty('bld3d','fill-extrusion-color',colorExpr(mode));
  const blurb={estate:'Real-estate fabric — every building colored by its Locator X category.',
    hack:'House-hack fabric — 2–4 unit sites inside FHA reach glow; everything else recedes.',
    dev:'Development fabric — sites with real value-add levers (lot, units, age) glow.',
    reg:'Regulatory fabric — rent-control exposure: green exempt, amber AB 1482, red local ordinance.'}[mode];
  $('#twinsecblurb').textContent=blurb||'';
}
function toggleSatGround(on){
  if(!tmap) return; satOn=on;
  if(on && !tmap.getSource('sat')){
    tmap.addSource('sat',{type:'raster', tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize:256, attribution:'Esri, Maxar, Earthstar Geographics'});
    tmap.addLayer({id:'sat',type:'raster',source:'sat',paint:{'raster-opacity':0.95}}, 'bld3d');
  } else if(!on){ if(tmap.getLayer('sat')) tmap.removeLayer('sat'); if(tmap.getSource('sat')) tmap.removeSource('sat'); }
}

/* ---------- walk mode ---------- */
function startWalk(){ if(!tmap||walking) return; walking=true; $('#walkhud').hidden=false; $('#tw_walk').textContent='Exit walk (Esc)';
  tmap.easeTo({zoom:Math.max(tmap.getZoom(),18.2), pitch:74, duration:600});
  keys={}; window.addEventListener('keydown',kd); window.addEventListener('keyup',ku); loop(); }
function stopWalk(){ if(!walking) return; walking=false; $('#walkhud').hidden=true; $('#tw_walk').textContent='Walk this block';
  window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku); cancelAnimationFrame(raf); }
function kd(e){ if(e.key==='Escape'){ stopWalk(); return; } keys[e.key.toLowerCase()]=true; if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault(); }
function ku(e){ keys[e.key.toLowerCase()]=false; }
function loop(){
  if(!walking) return;
  const b=tmap.getBearing()*Math.PI/180; const c=tmap.getCenter();
  const sp=(keys['shift']?2.6:1.15)*Math.pow(2,17.8-tmap.getZoom())*0.000011;
  let dx=0,dy=0;
  if(keys['w']||keys['arrowup']){ dx+=Math.sin(b)*sp; dy+=Math.cos(b)*sp; }
  if(keys['s']||keys['arrowdown']){ dx-=Math.sin(b)*sp; dy-=Math.cos(b)*sp; }
  if(keys['a']){ dx-=Math.cos(b)*sp; dy+=Math.sin(b)*sp; }
  if(keys['d']){ dx+=Math.cos(b)*sp; dy-=Math.sin(b)*sp; }
  let db=0, dp=0;
  if(keys['q']||keys['arrowleft']) db=-1.6;
  if(keys['e']||keys['arrowright']) db=1.6;
  if(keys['r']) dp=1.2; if(keys['f']) dp=-1.2;
  if(dx||dy||db||dp) tmap.jumpTo({center:[c.lng+dx, c.lat+dy], bearing:tmap.getBearing()+db, pitch:Math.max(30,Math.min(80,tmap.getPitch()+dp))});
  raf=requestAnimationFrame(loop);
}

/* ---------- inside catalog ---------- */
function openCatalog(id){
  const l=L().allListings().find(x=>x.id===id); if(!l) return; sel=id;
  const c=catAll&&catAll[id]||{}; const d=L().deal(l);
  const cat=c.cat||'liab';
  const names={asset:'Cash-flow asset',hack:'House-hack candidate',value:'Value-add / ADU play',growth:'Appreciation bet',liab:'Liability at this price'};
  const p=l.panos&&l.panos.length? l.panos[0] : (l.tour==='eb'? L().BA.panos.p6 : L().BA.panos.p0);
  const el=$('#twincat'); el.hidden=false;
  el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><div class="eyebrow">${L().esc(l.city)} · inside catalog</div><h3 style="margin:2px 0 4px">${L().esc(l.addr)}</h3></div><button class="iconbtn" id="twc_x">✕</button></div>
  <div style="position:relative;border-radius:10px;overflow:hidden;height:130px;margin-bottom:8px"><img src="${p}" alt="" style="width:100%;height:100%;object-fit:cover"></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="chip on" style="background:var(--cat${{asset:1,hack:2,value:3,growth:4,liab:5}[cat]});color:#fff;border:0">${names[cat]}</span>${c.score!=null?`<span class="chip">Score ${c.score}</span>`:''}${l.hh?'<span class="chip">FHA house hack</span>':''}${c.va>=25?'<span class="chip">Dev upside</span>':''}</div>
  <table class="pl" style="margin-bottom:8px"><tr><td>Type</td><td>${L().esc(l.kind)}${l.units>1?' · '+l.units+' units':''}</td></tr><tr><td>Price (assessed)</td><td>${L().fmt$(l.price)}</td></tr>${d?`<tr><td>Est. rent / cash flow</td><td>$${L().fmtN(d.rentMo)}/mo · <span class="${d.cf>0?'pos':'neg'}">${(d.cfMo>0?'+':'')+L().fmt$(d.cfMo)}/mo</span></td></tr>`:''}<tr><td>Built / stories</td><td>${l.year||'—'} · ${(catAll[id]&&bldStories(id))||'—'} modeled</td></tr></table>
  <div style="display:flex;gap:6px;flex-wrap:wrap">
    <button class="btn" id="twc_tour">Tour inside · 360°</button>
    <button class="btn" id="twc_uw">Underwrite</button>
    <button class="btn" id="twc_res">Research</button>
    <button class="btn" id="twc_map">Open on map</button>
  </div>
  <p class="src" style="margin-top:8px">Massing is procedural (assessor sf ÷ stories), not surveyed. Source: ${L().esc(l.src||'')}</p>`;
  $('#twc_x').onclick=()=>{ el.hidden=true; sel=null; };
  $('#twc_tour').onclick=()=>L().openTour(l);
  $('#twc_uw').onclick=()=>{ L().showView('uw'); setTimeout(()=>window.LXUW&&LXUW.openSheet(l.id),60); };
  $('#twc_res').onclick=()=>{ if(window.LXResearch){ LXResearch.subjectFrom(l); L().showView('research'); } };
  $('#twc_map').onclick=()=>L().select(l.id,true);
  if(tmap) tmap.easeTo({center:[l.lng,l.lat], zoom:Math.max(tmap.getZoom(),17.6), duration:700});
}

/* Where the twin should open, and how far it may be panned. */
function twinView(){
  const X = L();
  const REG = (X && X.BA && X.BA.region) ? X.BA.region : null;
  if(REG && REG.center) return {center: REG.center, maxBounds: REG.maxBounds || null};
  /* No declared region: derive from the records. A box padded around the
     footprint keeps the user inside their own edition without inventing a
     boundary the data does not support. */
  let sx=0, sy=0, n=0, x0=180, y0=90, x1=-180, y1=-90;
  try{
    (X.allListings()||[]).forEach(function(l){
      if(typeof l.lng!=='number' || typeof l.lat!=='number') return;
      sx+=l.lng; sy+=l.lat; n++;
      if(l.lng<x0) x0=l.lng; if(l.lng>x1) x1=l.lng;
      if(l.lat<y0) y0=l.lat; if(l.lat>y1) y1=l.lat;
    });
  }catch(e){}
  if(!n) return {center:[-122.416,37.762], maxBounds:null};
  const pad = 0.25;
  return {center:[sx/n, sy/n], maxBounds:[[x0-pad, y0-pad],[x1+pad, y1+pad]]};
}

function bldStories(id){ const f=bldGeo&&bldGeo.features.find(x=>x.properties.id===id); return f? f.properties.st+' stories':null; }
function scenario(){
  /* l.hh is set by NONE of the seventeen data builders, so this list was always
     empty and the training drop never fired. Candidacy comes from hacks.js,
     which derives it from the record's unit count. */
  const cand = (window.LXHH && LXHH.candidate) ? LXHH.candidate
             : function(l){ const u=l.units||1; return u>=2 && u<=4; };
  const rows=L().allListings().filter(function(l){ return cand(l) && !l.approx; });
  const l=rows[Math.floor(Math.random()*rows.length)]; if(!l) return;
  openCatalog(l.id);
  L().toast('Training drop: you are standing at a live house-hack site. Walk it, then underwrite it — the Academy house-hack missions use exactly this playbook.');
}

/* ---------- AR/VR export ---------- */
async function exportTwin(){
  const g=buildAll();
  const out={format:'locatorx-twin-1', crs:'EPSG:4326', built:L().BA.built, count:g.features.length,
    note:'Geo-anchored procedural massing of Bay Area investment sites. heights in meters. Load into any engine (Unity/Unreal/WebXR/RP-style fabrics) by extruding each footprint to h.',
    buildings:g.features.map(f=>({id:f.properties.id, cat:f.properties.cat, hh:!!f.properties.hh, h:f.properties.h, stories:f.properties.st, score:f.properties.score, footprint:f.geometry.coordinates[0]}))};
  const s=JSON.stringify(out);
  // Published viewer: the downloads capability mediates saves.
  try{
    if(window.claude&&window.claude.use){
      const dl=await window.claude.use('downloads');
      if(dl){
        try{ await dl.save({filename:'locatorx-twin.json', data:s}); L().toast('Twin bridge saved — '+out.count+' buildings, ready for any AR/VR engine.'); return; }
        catch(e){ if(e&&e.code==='declined') return; if(e&&e.code==='rate_limited'){ L().toast('A save prompt is already open — answer it first.'); return; } }
      }
    }
  }catch(e){}
  // Standalone file: plain download works.
  let saved=false;
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([s],{type:'application/json'})); a.download='locatorx-twin.json'; document.body.appendChild(a); a.click(); a.remove(); saved=true; }catch(e){}
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(()=>L().toast(saved?'Twin JSON downloaded and copied to clipboard.':'Twin JSON copied to clipboard ('+Math.round(s.length/1024)+' KB).')).catch(()=>L().toast(saved?'Twin JSON downloaded.':'Could not export in this viewer.'));
}

/* ---------- render ---------- */
const STEPS=[
  ['Living map & catalog','live','128,319 real sites from county records with prices, tours and underwriting — the base layer of the world.'],
  ['Satellite imagery','live','Esri World Imagery basemap on the main map plus per-property satellite closeups in the listing drawer.'],
  ['Walkable digital twin','live · v1','This tab: procedural 3D massing of every site, first-person walk mode, click any building to step inside the catalog.'],
  ['Simulation & training','v1 hook','Training drops put an Academy crew at a real site in the twin; missions reference the same buildings. Full scenario engine next.'],
  ['AR/VR fabric','bridge live','Sector layers blend into one fabric (RP1-style); the export bridge emits geo-anchored JSON any engine — WebXR, Unity, Unreal — can consume for a Pokémon-style AR layer.']];
function render(){
  const el=$('#twinbody'); if(!el) return;
  if(!el.dataset.init){
    el.dataset.init='1';
    el.innerHTML=`
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
      <div id="twinlayers" style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="chip on" data-sec="estate">Real estate</button><button class="chip" data-sec="hack">House hacks</button><button class="chip" data-sec="dev">Development</button><button class="chip" data-sec="reg">Regulation</button>
      </div>
      <label class="chip" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="tw_sat" style="accent-color:var(--accent)"> satellite ground</label>
      <span style="flex:1"></span>
      <button class="btn" id="tw_drop">Training drop</button>
      <button class="btn" id="tw_export">Export for AR/VR</button>
      <button class="btn primary" id="tw_walk">Walk this block</button>
    </div>
    <p id="twinsecblurb" class="src" style="margin:0 0 8px">Real-estate fabric — every building colored by its Locator X category.</p>
    <div style="position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line);height:min(66vh,640px)">
      <div id="twinmap" style="position:absolute;inset:0"></div>
      <div id="twincat" hidden style="position:absolute;top:10px;left:10px;width:min(340px,86%);max-height:calc(100% - 20px);overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px;box-shadow:var(--shadow);z-index:3"></div>
      <div id="walkhud" hidden style="position:absolute;left:50%;bottom:12px;transform:translateX(-50%);background:rgba(10,16,28,.78);color:#e7eefb;border-radius:999px;padding:8px 16px;font-size:12px;z-index:3;white-space:nowrap">W/S move · A/D strafe · Q/E or ←/→ turn · R/F pitch · Shift run · Esc exit</div>
      <div id="twinfallback" hidden style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--panel);z-index:4"><div style="max-width:520px;text-align:center;color:var(--muted)">This device is running the 2D fallback renderer (no WebGL), so the walkable 3D twin is unavailable here. The full catalog is still on the Map and Dashboard tabs; open locator.x on a WebGL-capable browser for the twin.</div></div>
    </div>
    <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:14px">${STEPS.map((s,i)=>`<div class="tile"><div class="eyebrow">Step ${i+1} · ${s[1]}</div><b>${s[0]}</b><div style="font-size:12px;color:var(--muted);margin-top:4px">${s[2]}</div></div>`).join('')}</div>
    <p class="src" style="margin-top:10px">The twin is built only from public records already in the catalog. Building shapes are procedural massing (living area ÷ stories on the parcel point) — good enough to walk, simulate and train against; swap in surveyed footprints or photogrammetry per neighborhood as they are acquired.</p>`;
    $$('#twinlayers button').forEach(b=>b.addEventListener('click',()=>setSector(b.dataset.sec)));
    $('#tw_sat').addEventListener('change',e=>toggleSatGround(e.target.checked));
    $('#tw_walk').addEventListener('click',()=>walking?stopWalk():startWalk());
    $('#tw_drop').addEventListener('click',scenario);
    $('#tw_export').addEventListener('click',exportTwin);
  }
  const canGL=typeof maplibregl!=='undefined' && (typeof USE_GL==='undefined'||USE_GL) && !failedGL;
  if(!canGL){ $('#twinfallback').hidden=false; return; }
  if(!tmap){ failedGL=false; $('#twinfallback').hidden=true; L().toast('Building the twin — extruding 128,319 sites…'); setTimeout(()=>{ initMap(); if(failedGL) $('#twinfallback').hidden=false; },30); }
  else setTimeout(()=>tmap.resize(),30);
}
window.LXTwin={render, openCatalog, twinView, get map(){return tmap;}};
})();
