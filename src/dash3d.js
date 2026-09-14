/* locator.x — live 3D dashboards.
   A rotatable opportunity cube (cap rate x below-market index x cash flow) and an
   isometric market skyline, both drawn on canvas from the live filtered data, plus the
   GPU ZIP-tower layer that runs on the real map. No external 3D library. */
(function(){
'use strict';
const $=(s,el=document)=>el.querySelector(s);
const L=()=>window.LX, D=()=>window.LXDash;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TIER=s=>s>=60?window.LXPal.tok('--good'):s>=45?window.LXPal.tok('--warn'):window.LXPal.tok('--bad');
let V={yaw:0.6, pitch:0.38, zoom:520, auto:true, pts:[], hover:-1, drag:null, raf:0, metric:'cf'};
let SKY={cities:[], hover:-1};

/* ---------- projection ---------- */
function proj(p,W,H){
  const cy=Math.cos(V.yaw), sy=Math.sin(V.yaw), cp=Math.cos(V.pitch), sp=Math.sin(V.pitch);
  const x1=p.x*cy - p.z*sy, z1=p.x*sy + p.z*cy;
  const y1=p.y*cp - z1*sp,  z2=p.y*sp + z1*cp;
  const d=3.4, s=V.zoom/(d+z2);
  return {sx:W/2+x1*s, sy:H/2-y1*s, d:z2, s};
}
function edges(){
  const c=[]; for(const x of [-1,1]) for(const y of [-1,1]) for(const z of [-1,1]) c.push({x,y,z});
  const E=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
  return {c,E};
}

/* ---------- the cube ---------- */
/* The cube draws the first CUBE_CAP of the ranked candidates, not all of them -
   a spinning canvas of ten thousand spheres is neither readable nor fast. That
   cap used to be silent while the heading said "every candidate", which is the
   one thing it could not be; it is stated next to the cube now. */
const CUBE_CAP=900;
function buildPts(rows){
  const X=L();
  const src=rows.slice(0,CUBE_CAP);
  const pts=[];
  for(const r of src){
    const l=r.l, a=r.a;
    let d=null; try{ d=X.deal(l); }catch(e){}
    if(!d) continue;
    const an=D().analyze(l);
    const cap=clamp(d.cap,0,12), bmi=clamp(a.idx,0,90), cf=clamp(d.cfMo,-6000,4000);
    pts.push({
      x:(cap/12)*2-1,
      y:(bmi/90)*2-1,
      z:((cf+6000)/10000)*2-1,
      r:3+Math.sqrt(Math.min(60,l.units||1))*2.1,
      col:TIER(an.score), id:l.id,
      lab:l.addr+', '+l.city, sub:'cap '+d.cap.toFixed(1)+'% · index '+a.idx+' · '+(d.cfMo>0?'+':'')+X.fmt$(d.cfMo)+'/mo · score '+an.score+(l.units>1?' · '+l.units+' units':'')
    });
  }
  V.pts=pts;
}
function drawCube(){
  const cv=$('#bmcube'); if(!cv) return;
  const W=cv.width, H=cv.height, g=cv.getContext('2d');
  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#888';
  g.clearRect(0,0,W,H);
  const ink=css('--ink2'), line=css('--line2'), mut=css('--muted');
  const {c,E}=edges();
  const P=c.map(p=>proj(p,W,H));
  // floor grid
  g.strokeStyle=line; g.globalAlpha=.5; g.lineWidth=1;
  for(let i=0;i<=6;i++){ const t=-1+i*2/6;
    let a=proj({x:t,y:-1,z:-1},W,H), b=proj({x:t,y:-1,z:1},W,H);
    g.beginPath(); g.moveTo(a.sx,a.sy); g.lineTo(b.sx,b.sy); g.stroke();
    a=proj({x:-1,y:-1,z:t},W,H); b=proj({x:1,y:-1,z:t},W,H);
    g.beginPath(); g.moveTo(a.sx,a.sy); g.lineTo(b.sx,b.sy); g.stroke(); }
  g.globalAlpha=1;
  // box
  g.strokeStyle=line; g.lineWidth=1.2;
  E.forEach(([i,j])=>{ g.beginPath(); g.moveTo(P[i].sx,P[i].sy); g.lineTo(P[j].sx,P[j].sy); g.stroke(); });
  // axis labels
  g.font='11px system-ui'; g.fillStyle=mut; g.textAlign='center';
  const lx=proj({x:0,y:-1.22,z:1.12},W,H); g.fillText('cap rate  0 → 12%', lx.sx, lx.sy);
  const lz=proj({x:1.3,y:-1.15,z:0},W,H); g.fillText('cash flow  −$6k → +$4k/mo', lz.sx, lz.sy);
  g.save(); const ly=proj({x:-1.18,y:0,z:-1.15},W,H); g.translate(ly.sx,ly.sy); g.rotate(-Math.PI/2); g.fillText('below-market index  0 → 90',0,0); g.restore();
  // points, far to near
  const order=V.pts.map((p,i)=>({i,pr:proj(p,W,H)})).sort((a,b)=>b.pr.d-a.pr.d);
  order.forEach(o=>{
    const p=V.pts[o.i], pr=o.pr;
    const rr=Math.max(1.4, p.r*pr.s/230);
    g.globalAlpha=clamp(0.28+ (1-(pr.d+1.6)/3.4)*0.6, .2, .92);
    g.fillStyle=p.col; g.beginPath(); g.arc(pr.sx,pr.sy,rr,0,7); g.fill();
    if(o.i===V.hover){ g.globalAlpha=1; g.strokeStyle=css('--ink'); g.lineWidth=2; g.stroke(); }
    p._sx=pr.sx; p._sy=pr.sy; p._r=rr;
  });
  g.globalAlpha=1;
  // hover readout
  if(V.hover>=0 && V.pts[V.hover]){
    const p=V.pts[V.hover];
    g.font='600 12.5px system-ui'; g.textAlign='left'; g.fillStyle=css('--ink');
    g.fillText(p.lab, 14, H-30); g.font='11.5px system-ui'; g.fillStyle=mut; g.fillText(p.sub, 14, H-14);
  } else {
    g.font='11.5px system-ui'; g.textAlign='left'; g.fillStyle=mut;
    g.fillText(V.pts.length+' candidates plotted · drag to rotate · scroll to zoom · click a point to assess it', 14, H-14);
  }
}
function tick(){
  if(V.auto && !V.drag){ V.yaw+=0.0026; }
  drawCube();
  V.raf=requestAnimationFrame(tick);
}

/* ---------- isometric market skyline ---------- */
function buildSky(rows){
  const by={};
  rows.forEach(r=>{ const c=r.l.city||'—'; (by[c]=by[c]||[]).push(r); });
  SKY.cities=Object.entries(by).map(([city,v])=>{
    const idx=v.map(r=>r.a.idx).sort((a,b)=>a-b);
    const hard=v.filter(r=>r.a.hard).length;
    return {city, n:v.length, med:idx[Math.floor(idx.length/2)], hard};
  }).sort((a,b)=>b.n-a.n).slice(0,24);
}
function drawSky(){
  const cv=$('#bmsky'); if(!cv) return;
  const W=cv.width, H=cv.height, g=cv.getContext('2d');
  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#888';
  g.clearRect(0,0,W,H);
  const cities=SKY.cities; if(!cities.length) return;
  const cols=6, bw=52, bd=26, gap=16;
  const maxN=Math.max(...cities.map(c=>c.n));
  const ox=W/2-((cols*(bw+gap))/2)+40, oy=H-90;
  const iso=(cx,cy,h)=>({x: ox+(cx-cy)*(bw+gap)*0.62, y: oy+(cx+cy)*(bd+gap)*0.42 - h});
  const order=cities.map((c,i)=>({c,i,r:Math.floor(i/cols),k:i%cols})).sort((a,b)=>(a.r+a.k)-(b.r+b.k));
  order.forEach(({c,r,k})=>{
    const h=Math.max(6, (c.n/maxN)*150);
    const col=TIER(c.med>=45?60:c.med>=28?50:40);
    const b=iso(k,r,0), t=iso(k,r,h);
    // top face
    g.fillStyle=col; g.globalAlpha=.95;
    g.beginPath(); g.moveTo(t.x,t.y); g.lineTo(t.x+bw*0.6,t.y+bd*0.42); g.lineTo(t.x,t.y+bd*0.84); g.lineTo(t.x-bw*0.6,t.y+bd*0.42); g.closePath(); g.fill();
    // left face
    g.globalAlpha=.72;
    g.beginPath(); g.moveTo(t.x-bw*0.6,t.y+bd*0.42); g.lineTo(t.x,t.y+bd*0.84); g.lineTo(b.x,b.y+bd*0.84); g.lineTo(b.x-bw*0.6,b.y+bd*0.42); g.closePath(); g.fill();
    // right face
    g.globalAlpha=.55;
    g.beginPath(); g.moveTo(t.x,t.y+bd*0.84); g.lineTo(t.x+bw*0.6,t.y+bd*0.42); g.lineTo(b.x+bw*0.6,b.y+bd*0.42); g.lineTo(b.x,b.y+bd*0.84); g.closePath(); g.fill();
    g.globalAlpha=1;
    g.font='10px system-ui'; g.textAlign='center'; g.fillStyle=css('--ink2');
    g.fillText(c.city.length>13?c.city.slice(0,12)+'…':c.city, b.x, b.y+bd*0.84+13);
    g.font='600 10.5px var(--mono, monospace)'; g.fillStyle=css('--ink');
    g.fillText(c.n.toLocaleString(), t.x, t.y-4);
  });
  g.font='11.5px system-ui'; g.textAlign='left'; g.fillStyle=css('--muted');
  g.fillText('Tower height = below-market matches in that city · color = median index (green strongest) · numbers are match counts', 14, 18);
}

/* ---------- GPU ZIP towers on the live map ---------- */
const METRICS=[
 ['bmkt','Below-market index', l=>{ try{ const a=window.LXBM&&LXBM.assess(l); return a?a.idx:null; }catch(e){ return null; } }, 90, v=>v>=45?window.LXPal.tok('--good'):v>=28?window.LXPal.tok('--warn'):window.LXPal.tok('--bad')],
 ['score','Locator X score',   l=>{ try{ const a=D().analyze(l); return a?a.score:null; }catch(e){ return null; } }, 90, v=>v>=60?window.LXPal.tok('--good'):v>=45?window.LXPal.tok('--warn'):window.LXPal.tok('--bad')],
 ['cf','Monthly cash flow',    l=>{ try{ const d=L().deal(l); return d? Math.max(-3000,Math.min(4000,d.cfMo)) : null; }catch(e){ return null; } }, 1.6, v=>v>400?window.LXPal.tok('--good'):v>0?window.LXPal.tok('--warn'):window.LXPal.tok('--bad')],
 ['dis','Live distress records', l=>{ try{ const dd=D().distressOf(l); return dd&&dd.e>=0.4? dd.s : null; }catch(e){ return null; } }, 90, v=>v>=70?window.LXPal.tok('--good'):v>=45?window.LXPal.tok('--warn'):window.LXPal.tok('--bad')],
 ['fcast','12-month forecast', l=>{ try{ const z=window.LXScout&&LXScout.zipFC(l.zip); return (z&&z.v&&z.v.g12!=null)? z.v.g12*10 : null; }catch(e){ return null; } }, 700, v=>v>=25?window.LXPal.tok('--good'):v>=0?window.LXPal.tok('--warn'):window.LXPal.tok('--bad')]
];
let towerOn=false, towerMetric='bmkt';
/* This layer lives ON THE MAP, and every other thing on that map - the pins, the
   dots, the property towers, the sector aggregation - draws the FILTERED set. This
   one read the whole edition, so filtering the map to one city left the ZIP towers
   standing over the rest of the state, and nothing on screen said which set they
   described. It reads the same set as the map now, and the legend says how many
   records that was. */
function towerData(metricId){
  const X=L(); const M=METRICS.find(m=>m[0]===metricId)||METRICS[0];
  const by={};
  let rows; try{ rows = X.filtered ? X.filtered() : X.allListings(); }
  catch(e){ rows = X.allListings(); }
  rows.forEach(l=>{ if(!l.zip) return; (by[l.zip]=by[l.zip]||[]).push(l); });
  const H={}, C={}, N={};
  Object.keys(by).forEach(z=>{
    const v=by[z], s=[];
    for(let i=0;i<Math.min(v.length,200);i++){ const x=M[2](v[i]); if(x!=null&&isFinite(x)) s.push(x); }
    if(s.length<2) return;
    s.sort((a,b)=>a-b); const med=s[Math.floor(s.length/2)];
    H[z]=Math.max(30, med*M[3]); C[z]=M[4](med); N[z]=v.length;
  });
  return {H,C,N,name:M[1], records:rows.length, zips:Object.keys(H).length,
          whole:(function(){ try{ return rows.length >= X.allListings().length; }catch(e){ return true; } })()};
}
function zipTowers(on, metricId){
  const X=L(); const map=window.__lxmap;
  if(!map||!map.getSource) return false;
  if(metricId) towerMetric=metricId;
  try{
    if(!on){ towerOn=false; if(map.getLayer('ziptower')) map.removeLayer('ziptower'); if(map.getPitch&&map.getPitch()>5) map.easeTo({pitch:0,duration:600}); paintLegend(); return true; }
    const td=towerData(towerMetric); const {H,C,N,name}=td;
    if(!Object.keys(H).length) return false;
    /* New feature objects over the SAME geometry objects: the old deep clone of
       the whole ZIP collection ran on every toggle, and this layer now rebuilds
       whenever the filter moves. */
    const src=X.BA.geo.zips;
    const data={type:'FeatureCollection', features:[]};
    for(let i=0;i<src.features.length;i++){
      const f=src.features[i], z=f.properties && f.properties.zip;
      if(H[z]==null) continue;
      data.features.push({type:'Feature', geometry:f.geometry,
        properties:Object.assign({}, f.properties, {th:H[z], tc:C[z], tn:N[z]})});
    }
    if(!data.features.length) return false;
    if(map.getSource('ziptowers')) map.getSource('ziptowers').setData(data); else map.addSource('ziptowers',{type:'geojson',data});
    if(!map.getLayer('ziptower')){
      map.addLayer({id:'ziptower', type:'fill-extrusion', source:'ziptowers',
        paint:{'fill-extrusion-color':['get','tc'],'fill-extrusion-height':['get','th'],'fill-extrusion-base':0,'fill-extrusion-opacity':0.62}});
    }
    towerOn=true;
    try{ if(map.setMaxPitch) map.setMaxPitch(75); }catch(e){}
    map.easeTo({pitch:55, duration:900});
    setTimeout(()=>{ try{ if(map.getPitch()<20) map.setPitch(55); }catch(e){} }, 1100);
    paintLegend(name, td);
    return true;
  }catch(e){ return false; }
}
function paintLegend(name, td){
  const el=$('#towerlegend'); if(!el) return;
  if(!towerOn){ el.innerHTML=''; return; }
  const X=L(); const scope = td
    ? ' \u00b7 ' + X.fmtN(td.zips) + ' ZIPs from ' + X.fmtN(td.records) + ' record'
      + (td.records===1?'':'s') + (td.whole ? ' in this edition' : ' matching the current map filter')
    : '';
  el.innerHTML = '<span style="font-size:11px;color:var(--muted)">3D towers: <b>'+(name||'')
    + '</b> — height is the ZIP median, color is its band' + scope + '</span>';
}
/* The map's filter changes under a layer that is already drawn, so the layer has
   to be rebuilt with it - otherwise the towers silently describe the set the user
   had a moment ago. Called from LX.refresh(); a no-op when the towers are off. */
function refreshTowers(){
  if(!towerOn) return false;
  try{
    const map=window.__lxmap;
    if(map && map.getLayer && map.getLayer('ziptower')) map.removeLayer('ziptower');
    towerOn=false;
    return zipTowers(true, towerMetric);
  }catch(e){ return false; }
}

function mountControl(){
  const host=$('#towerctl'); if(!host||host.dataset.built) return;
  host.dataset.built='1';
  host.innerHTML='<button class="btn" id="tw3d" title="Extrude every ZIP into a 3D tower on the live map">🏙 3D towers</button>'
    +'<select id="twmetric" title="What the tower height measures">'+METRICS.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join('')+'</select>';
  $('#tw3d').addEventListener('click',()=>{
    const ok=zipTowers(!towerOn, $('#twmetric').value);
    $('#tw3d').textContent = towerOn? '🏙 hide towers' : '🏙 3D towers';
    $('#tw3d').setAttribute('aria-pressed', towerOn);
    if(!ok&&!towerOn) L().toast('Not enough data in this edition to build towers for that metric.');
  });
  $('#twmetric').addEventListener('change',e=>{ if(towerOn){ if(map0()) { try{ window.__lxmap.removeLayer('ziptower'); }catch(err){} } zipTowers(true, e.target.value); } });
  function map0(){ return window.__lxmap && window.__lxmap.getLayer && window.__lxmap.getLayer('ziptower'); }
}
/* ---------- mount ---------- */
function render(rows){
  const host=$('#bm3d'); if(!host) return;
  if(!host.dataset.built){
    host.dataset.built='1';
    host.innerHTML=`
    <div class="chart" data-panel data-panel-title="3D opportunity cube — live">
      <div class="eyebrow">Live 3D · dashboard</div>
      <h3>The opportunity cube — the ranked candidates in three dimensions at once</h3>
      <p class="chartnote">Each sphere is a property. Left-to-right is <b>cap rate</b>, vertical is the <b>below-market index</b>, depth is <b>monthly cash flow</b>; size is unit count and color is its Locator X score tier. The deals worth your week sit high, right and toward you. Drag to spin it, scroll to zoom, click a sphere to open its full assessment. <span id="cubescope"></span></p>
      <canvas id="bmcube" width="980" height="470" style="width:100%;height:auto;display:block;cursor:grab;touch-action:none"></canvas>
      <div class="toolbar" style="margin-top:6px"><button class="btn" id="bmauto">⏸ pause spin</button><button class="btn" id="bmreset">reset view</button><button class="btn" id="bmtowers">🏙 3D ZIP towers on the map</button></div>
    </div>
    <div class="chart" data-panel data-panel-title="Market skyline — below-market depth by city">
      <div class="eyebrow">Live 3D · dashboard</div>
      <h3>Market skyline — where the below-market stock actually is</h3>
      <p class="chartnote">An isometric tower per city: height is how many below-market candidates it holds under your current filter, color is the median index. Tall and green is a market worth a weekend.</p>
      <canvas id="bmsky" width="980" height="360" style="width:100%;height:auto;display:block"></canvas>
    </div>`;
    const cv=$('#bmcube');
    cv.addEventListener('pointerdown',e=>{ V.drag={x:e.clientX,y:e.clientY,yaw:V.yaw,pitch:V.pitch,moved:0}; cv.setPointerCapture(e.pointerId); cv.style.cursor='grabbing'; });
    cv.addEventListener('pointermove',e=>{
      const r=cv.getBoundingClientRect(), sx=(e.clientX-r.left)*cv.width/r.width, sy=(e.clientY-r.top)*cv.height/r.height;
      if(V.drag){ const dx=e.clientX-V.drag.x, dy=e.clientY-V.drag.y; V.drag.moved=Math.abs(dx)+Math.abs(dy);
        V.yaw=V.drag.yaw+dx*0.008; V.pitch=clamp(V.drag.pitch+dy*0.006,-0.9,1.2); return; }
      let best=-1, bd=1e9;
      V.pts.forEach((p,i)=>{ if(p._sx==null) return; const d=Math.hypot(p._sx-sx,p._sy-sy); if(d<Math.max(9,p._r+5)&&d<bd){ bd=d; best=i; } });
      V.hover=best; cv.style.cursor=best>=0?'pointer':'grab';
    });
    cv.addEventListener('pointerup',e=>{ const moved=V.drag&&V.drag.moved>4; V.drag=null; cv.style.cursor='grab';
      if(!moved && V.hover>=0){ const id=V.pts[V.hover].id; const b=document.querySelector('#bmtable [data-bm="'+id+'"]'); if(b) b.click(); else if(window.LXBM){ const ev=new CustomEvent('x'); } } });
    cv.addEventListener('pointerleave',()=>{ V.drag=null; V.hover=-1; });
    cv.addEventListener('wheel',e=>{ e.preventDefault(); V.zoom=clamp(V.zoom*(e.deltaY>0?0.92:1.08),200,1600); },{passive:false});
    $('#bmauto').onclick=()=>{ V.auto=!V.auto; $('#bmauto').textContent=V.auto?'⏸ pause spin':'▶ resume spin'; };
    $('#bmreset').onclick=()=>{ V.yaw=0.6; V.pitch=0.38; V.zoom=520; };
    $('#bmtowers').onclick=()=>{ const ok=zipTowers(!towerOn,'bmkt');
      $('#bmtowers').textContent=towerOn?'🏙 hide ZIP towers':'🏙 3D ZIP towers on the map';
      if(ok&&towerOn){ L().showView('mapview'); const t=$('#tw3d'); if(t){ t.textContent='🏙 hide towers'; const m=$('#twmetric'); if(m) m.value='bmkt'; }
        L().toast('3D ZIP towers on — height is the median below-market index for each ZIP'); }
      else if(!ok){ L().toast('Open the Map tab once so the map finishes loading, then try again.'); } };
  }
  buildPts(rows); buildSky(rows); drawSky();
  const sc=$('#cubescope');
  if(sc){ const X=L(); const total=(rows && rows.total) || (rows ? rows.length : 0);
    const drawn=Math.min(rows?rows.length:0, CUBE_CAP);
    sc.textContent = drawn < total
      ? 'Drawing the top ' + X.fmtN(drawn) + ' of ' + X.fmtN(total)
        + ' candidates that clear the threshold — the ranking is complete, the cube is a window on its head.'
      : ''; }
  if(!V.raf) tick();
}
window.LX3D={render, zipTowers, refreshTowers, drawCube, mountControl, METRICS};
if(document.readyState!=='loading') setTimeout(mountControl,900); else document.addEventListener('DOMContentLoaded',()=>setTimeout(mountControl,900));
})();
