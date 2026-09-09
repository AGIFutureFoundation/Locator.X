/* CanvasMap — dependency-free fallback renderer for the built-in vector basemap.
   Implements the subset of the MapLibre Map/Marker API that app.js uses. */
(function(){
'use strict';
const TAU=Math.PI*2;
function lng2x(lng){ return (lng+180)/360; }
function lat2y(lat){ const s=Math.sin(lat*Math.PI/180); return 0.5-Math.log((1+s)/(1-s))/(4*Math.PI); }
function x2lng(x){ return x*360-180; }
function y2lat(y){ return Math.atan(Math.sinh(Math.PI*(1-2*y)))*180/Math.PI; }
class CMarker{
  constructor(o){ this.el=o.element; this.el.style.position='absolute'; this.el.style.left='0'; this.el.style.top='0'; this.el.classList.add('cm-marker'); this._ll=null; this._map=null; }
  setLngLat(ll){ this._ll=ll; if(this._map) this._map._place(this); return this; }
  addTo(map){ this._map=map; map._markers.add(this); map.markerLayer.appendChild(this.el); map._place(this); return this; }
  remove(){ if(this._map){ this._map._markers.delete(this); this.el.remove(); this._map=null; } return this; }
  getElement(){ return this.el; }
}
class CanvasMap{
  constructor(o){
    this.container=typeof o.container==='string'? document.getElementById(o.container) : o.container;
    this.container.classList.add('cm-map'); this.container.style.overflow='hidden'; this.container.style.position=this.container.style.position||'absolute';
    this.canvas=document.createElement('canvas'); this.canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab'; this.container.appendChild(this.canvas);
    this.markerLayer=document.createElement('div'); this.markerLayer.style.cssText='position:absolute;inset:0;pointer-events:none'; this.container.appendChild(this.markerLayer);
    this.ctx=this.canvas.getContext('2d'); this._markers=new Set(); this._ev={}; this.geo=o.geo; this.colors=o.colors; this.choro=null; this.raster=null; this.tiles={}; this.hideVector=false;
    this.center=o.center; this.zoom=o.zoom; this.minZoom=o.minZoom||7; this.maxZoom=o.maxZoom||17; this.maxBounds=o.maxBounds; this._hover=null;
    this._bind(); this._buildControls(); this.resize(); requestAnimationFrame(()=>{ this._loaded=true; this._emit('load',{}); this.draw(); });
    this._ro=new ResizeObserver(()=>this.resize()); this._ro.observe(this.container);
  }
  on(ev, a, b){ if(typeof a==='string'){ (this._ev[ev+':'+a]=this._ev[ev+':'+a]||[]).push(b); } else (this._ev[ev]=this._ev[ev]||[]).push(a); return this; }
  _emit(ev, d, layer){ (this._ev[layer?ev+':'+layer:ev]||[]).forEach(f=>f(d)); }
  addControl(){ return this; } setFeatureState(){} isStyleLoaded(){ return true; } loaded(){ return !!this._loaded; }
  getZoom(){ return this.zoom; } getCenter(){ return {lng:this.center[0], lat:this.center[1]}; }
  _scale(){ return 512*Math.pow(2,this.zoom); }
  project(ll){ const s=this._scale(); const cx=lng2x(this.center[0])*s, cy=lat2y(this.center[1])*s; return {x:this.w/2+(lng2x(ll[0])*s-cx), y:this.h/2+(lat2y(ll[1])*s-cy)}; }
  unproject(p){ const s=this._scale(); const cx=lng2x(this.center[0])*s, cy=lat2y(this.center[1])*s; return [x2lng((p.x-this.w/2+cx)/s), y2lat((p.y-this.h/2+cy)/s)]; }
  resize(){ const r=this.container.getBoundingClientRect(); this.w=Math.max(1,r.width); this.h=Math.max(1,r.height); const d=devicePixelRatio||1; this.canvas.width=this.w*d; this.canvas.height=this.h*d; this.ctx.setTransform(d,0,0,d,0,0); this.draw(); }
  jumpTo(o){ if(o.center) this.center=o.center.slice(); if(o.zoom!=null) this.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,o.zoom)); this._clampCenter(); this.draw(); this._emit('zoom',{}); this._emit('move',{}); }
  flyTo(o){ const from={c:this.center.slice(), z:this.zoom}; const pad=o.padding&&o.padding.right? o.padding.right : 0; const toZ=o.zoom!=null? Math.max(this.minZoom,Math.min(this.maxZoom,o.zoom)) : this.zoom; let toC=o.center? o.center.slice() : from.c;
    if(pad){ const s=512*Math.pow(2,toZ); toC=[x2lng(lng2x(toC[0])+pad/2/s), toC[1]]; }
    const t0=performance.now(), dur=o.duration||600; const step=now=>{ const k=Math.min(1,(now-t0)/dur); const e=k<.5? 2*k*k : -1+(4-2*k)*k; this.center=[from.c[0]+(toC[0]-from.c[0])*e, from.c[1]+(toC[1]-from.c[1])*e]; this.zoom=from.z+(toZ-from.z)*e; this.draw(); this._emit('zoom',{}); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
  fitBounds(b, o){ const pad=(o&&o.padding)||40; const [[w,s],[e,n]]=b; const dx=lng2x(e)-lng2x(w), dy=lat2y(s)-lat2y(n); const z=Math.min((o&&o.maxZoom)||this.maxZoom, Math.log2(Math.min((this.w-2*pad)/(dx*512||1e-9),(this.h-2*pad)/(dy*512||1e-9)))); this.flyTo({center:[(w+e)/2, y2lat((lat2y(s)+lat2y(n))/2)], zoom:z, duration:(o&&o.duration)||600}); }
  _clampCenter(){ if(!this.maxBounds) return; const [[w,s],[e,n]]=this.maxBounds; this.center=[Math.max(w,Math.min(e,this.center[0])), Math.max(s,Math.min(n,this.center[1]))]; }
  setChoropleth(fn){ this.choro=fn; this.draw(); }
  setPoints(pts, onClick){ this.points=pts; this.pointClick=onClick; this.draw(); }
  setRaster(tiles, tileSize){ this.raster=tiles? {tpl:tiles[0], size:tileSize||256} : null; this.tiles={}; this.hideVector=!!tiles; this.draw(); }
  _place(m){ if(!m._ll) return; const p=this.project(m._ll); m.el.style.transform=`translate(-50%,-50%) translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`; m.el.style.pointerEvents='auto'; }
  _buildControls(){ const c=document.createElement('div'); c.className='cm-ctrl'; c.innerHTML='<button aria-label="Zoom in">+</button><button aria-label="Zoom out">−</button>'; this.container.appendChild(c); const [a,b]=c.querySelectorAll('button'); a.onclick=()=>this.flyTo({zoom:this.zoom+1, duration:250}); b.onclick=()=>this.flyTo({zoom:this.zoom-1, duration:250}); }
  _bind(){ const cv=this.canvas; let drag=null, pinch=null; const self=this;
    cv.addEventListener('pointerdown', e=>{ if(e.button!==0) return; drag={x:e.clientX,y:e.clientY,c:self.center.slice(),moved:false}; cv.setPointerCapture(e.pointerId); cv.style.cursor='grabbing'; });
    cv.addEventListener('pointermove', e=>{ const r=cv.getBoundingClientRect(); const pt={x:e.clientX-r.left,y:e.clientY-r.top};
      if(drag){ const s=self._scale(); const dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.abs(dx)+Math.abs(dy)>2) drag.moved=true; self.center=[x2lng(lng2x(drag.c[0])-dx/s), y2lat(lat2y(drag.c[1])-dy/s)]; self._clampCenter(); self.draw(); self._emit('move',{}); return; }
      const f=self._zipAt(pt); if(f!==self._hover){ if(self._hover) self._emit('mouseleave',{point:pt},'zipfill'); self._hover=f; } if(f) self._emit('mousemove',{point:pt, features:[{id:f.properties.zip, properties:f.properties}]},'zipfill'); });
    const up=e=>{ if(drag && !drag.moved){ const r=cv.getBoundingClientRect(); const pt={x:e.clientX-r.left,y:e.clientY-r.top}; if(self.points&&self.points.length&&self.pointClick){ let best=null,bd=100; for(const p of self.points){ const q=self.project([p.lng,p.lat]); const d2=(q.x-pt.x)**2+(q.y-pt.y)**2; if(d2<bd){ bd=d2; best=p; } } if(best&&bd<=81){ self.pointClick(best.id); drag=null; cv.style.cursor='grab'; return; } } const f=self._zipAt(pt); if(f) self._emit('click',{point:pt, features:[{properties:f.properties}]},'zipfill'); } drag=null; cv.style.cursor='grab'; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', ()=>{ drag=null; cv.style.cursor='grab'; });
    cv.addEventListener('pointerleave', ()=>{ if(self._hover){ self._emit('mouseleave',{},'zipfill'); self._hover=null; } });
    cv.addEventListener('wheel', e=>{ e.preventDefault(); const r=cv.getBoundingClientRect(); const pt={x:e.clientX-r.left,y:e.clientY-r.top}; const before=self.unproject(pt); self.zoom=Math.max(self.minZoom,Math.min(self.maxZoom,self.zoom-e.deltaY*0.0025)); const after=self.unproject(pt); self.center=[self.center[0]+(before[0]-after[0]), self.center[1]+(before[1]-after[1])]; self._clampCenter(); self.draw(); self._emit('zoom',{}); }, {passive:false});
    cv.addEventListener('dblclick', e=>{ const r=cv.getBoundingClientRect(); self.flyTo({center:self.unproject({x:e.clientX-r.left,y:e.clientY-r.top}), zoom:self.zoom+1, duration:300}); });
    cv.addEventListener('touchstart', e=>{ if(e.touches.length===2){ pinch={d:Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY), z:self.zoom}; } }, {passive:true});
    cv.addEventListener('touchmove', e=>{ if(pinch && e.touches.length===2){ const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY); self.zoom=Math.max(self.minZoom,Math.min(self.maxZoom,pinch.z+Math.log2(d/pinch.d))); self.draw(); self._emit('zoom',{}); } }, {passive:true});
    cv.addEventListener('touchend', ()=>{ pinch=null; });
  }
  _zipAt(pt){ const ll=this.unproject(pt); if(!this.choro) return null; for(const f of this.geo.zips.features){ if(this._pip(f.geometry, ll)) return f; } return null; }
  _pip(g, ll){ const rings = g.type==='Polygon'? [g.coordinates] : g.coordinates; for(const poly of rings){ let inside=false; const ring=poly[0]; for(let i=0,j=ring.length-1;i<ring.length;j=i++){ const xi=ring[i][0], yi=ring[i][1], xj=ring[j][0], yj=ring[j][1]; if(((yi>ll[1])!==(yj>ll[1])) && (ll[0] < (xj-xi)*(ll[1]-yi)/(yj-yi)+xi)) inside=!inside; } if(inside){ for(let h=1;h<poly.length;h++){ const hr=poly[h]; let inH=false; for(let i=0,j=hr.length-1;i<hr.length;j=i++){ const xi=hr[i][0], yi=hr[i][1], xj=hr[j][0], yj=hr[j][1]; if(((yi>ll[1])!==(yj>ll[1])) && (ll[0] < (xj-xi)*(ll[1]-yi)/(yj-yi)+xi)) inH=!inH; } if(inH){ inside=false; break; } } } if(inside) return true; } return false; }
  _path(g){ const ctx=this.ctx; const s=this._scale(); const cx=lng2x(this.center[0])*s-this.w/2, cy=lat2y(this.center[1])*s-this.h/2; const ring=r=>{ for(let i=0;i<r.length;i++){ const x=lng2x(r[i][0])*s-cx, y=lat2y(r[i][1])*s-cy; if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); } };
    if(g.type==='Polygon'){ g.coordinates.forEach(r=>{ ring(r); ctx.closePath(); }); } else if(g.type==='MultiPolygon'){ g.coordinates.forEach(p=>p.forEach(r=>{ ring(r); ctx.closePath(); })); } else if(g.type==='LineString'){ ring(g.coordinates); } else if(g.type==='MultiLineString'){ g.coordinates.forEach(ring); } }
  _fill(fc, color, each){ const ctx=this.ctx; ctx.beginPath(); if(!each){ fc.features.forEach(f=>this._path(f.geometry)); ctx.fillStyle=color; ctx.fill('evenodd'); return; } fc.features.forEach(f=>{ const c=each(f); if(!c) return; ctx.beginPath(); this._path(f.geometry); ctx.fillStyle=c; ctx.fill('evenodd'); }); }
  _stroke(fc, color, width, dash, filter){ const ctx=this.ctx; ctx.beginPath(); fc.features.forEach(f=>{ if(filter && !filter(f)) return; this._path(f.geometry); }); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.setLineDash(dash||[]); ctx.stroke(); ctx.setLineDash([]); }
  _drawRaster(){ const r=this.raster; if(!r) return; const z=Math.round(this.zoom); const n=Math.pow(2,z); const s=this._scale(); const cx=lng2x(this.center[0])*s-this.w/2, cy=lat2y(this.center[1])*s-this.h/2; const ts=s/n; const x0=Math.floor(cx/ts), y0=Math.floor(cy/ts), x1=Math.floor((cx+this.w)/ts), y1=Math.floor((cy+this.h)/ts);
    for(let x=x0;x<=x1;x++) for(let y=y0;y<=y1;y++){ if(y<0||y>=n) continue; const xx=((x%n)+n)%n; const key=z+'/'+xx+'/'+y; let t=this.tiles[key]; if(!t){ t=new Image(); t.crossOrigin='anonymous'; t.onload=()=>this.draw(); t.onerror=()=>{ t.bad=true; if(!this._rasterErr){ this._rasterErr=true; this._emit('error',{sourceId:'raster'}); } }; t.src=r.tpl.replace('{z}',z).replace('{x}',xx).replace('{y}',y); this.tiles[key]=t; } if(t.complete && t.naturalWidth) this.ctx.drawImage(t, x*ts-cx, y*ts-cy, ts+0.5, ts+0.5); } }
  draw(){ const ctx=this.ctx, c=this.colors(), g=this.geo, z=this.zoom; ctx.clearRect(0,0,this.w,this.h); ctx.fillStyle=c.water; ctx.fillRect(0,0,this.w,this.h);
    if(this.hideVector){ this._drawRaster(); } else { this._fill(g.counties, c.land); this._fill(g.urban, c.urban); this._fill(g.parks, c.park); }
    if(this.choro){ ctx.globalAlpha=this.hideVector?0.55:0.78; this._fill(g.zips, null, f=>this.choro(f.properties)); ctx.globalAlpha=1; this._stroke(g.zips, c.ink, 0.5); }
    if(!this.hideVector){ this._stroke(g.rivers, c.water, 1.2); this._stroke(g.counties, c.line, 1, [3,2]); if(z>=10.5) this._stroke(g.nb, c.nb, 0.8); this._stroke(g.rail, c.rail, 1, [4,3]); const rw=1.2+(z-7)/5*2.4; this._stroke(g.roads, c.line, Math.max(1.5,rw)); this._stroke(g.roads, c.road, Math.max(0.8,rw*0.64), null, f=>f.properties.type==='Major Highway'); this._stroke(g.roads, c.road2, Math.max(0.8,rw*0.64), null, f=>f.properties.type!=='Major Highway'); }
    if(this._hover && this.choro){ ctx.beginPath(); this._path(this._hover.geometry); ctx.strokeStyle=c.ink; ctx.lineWidth=2; ctx.stroke(); }
    if(this.points && this.points.length){ const r=this.zoom>=12?5:this.zoom>=10?4:3; for(const p of this.points){ const q=this.project([p.lng,p.lat]); if(q.x<-10||q.y<-10||q.x>this.w+10||q.y>this.h+10) continue; ctx.beginPath(); ctx.arc(q.x,q.y,r,0,6.2832); ctx.fillStyle=p.col; ctx.fill(); ctx.strokeStyle=c.land; ctx.lineWidth=1; ctx.stroke(); } }
    this._markers.forEach(m=>this._place(m)); }
}
window.CanvasMap=CanvasMap; window.CMarker=CMarker;
})();
