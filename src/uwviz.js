/* locator.x — underwriting deal-space visuals: Voronoi bubble field + Gapminder-style motion over offer discount */
(function(){
'use strict';
const L=()=>window.LX, D=()=>window.LXDash, U=()=>window.LXUW;
const $=(s,el=document)=>el.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* This is a STATUS scale (healthy / watch / poor), not series identity, so it
   uses the reserved status tokens and never a categorical slot. */
const TIER=g=>g>=60?window.LXPal.tok('--good'):g>=45?window.LXPal.tok('--warn'):window.LXPal.tok('--bad');
/* One slot per county, fixed order — the old map gave Alameda and Orleans the
   same green and San Francisco and Humboldt the same blue. */
const CTYORDER=['San Francisco','Alameda','Contra Costa','Santa Clara','San Mateo','Orleans','Jefferson','East Baton Rouge','Humboldt'];
const ctyColor=n=>{ const i=CTYORDER.indexOf(n); return i>=0&&i<8? window.LXPal.c(i+1) : window.LXPal.tok('--muted'); };
let VZ={disc:0, playing:false, timer:null, mode:'deal'};
let cache=null, cacheSig='';

function prep(ms){
  // top matches only — the field stays legible and fast
  const top=ms.slice(0,320);
  return top.map(r=>{
    const l=r.l;
    return {l, id:l.id, score:r.score, cat:r.cat, price:L().price(l), rentMo:r.d.rentMo, county:l.county||'', city:l.city};
  });
}
function uwAt(p, disc){
  // re-underwrite at a discounted offer — the motion dimension
  const s={offer:Math.round(p.price*(1-disc/100))};
  const base=Object.assign({offer:s.offer, rehab:0, cont:10, rentMo:p.rentMo, finOpt:{id:'conv',down:25,rate:L().state.assump.rate,mi:0}}, {});
  const uw=U().underwrite(p.l, base);
  return {cap:uw.noi/s.offer*100, cfMo:uw.cfMo, dscr:uw.dscr};
}
function render(ms){
  const root=$('#uwviz'); if(!root) return;
  if(!ms || !ms.length){ root.innerHTML=''; return; }
  const pts=prep(ms);
  root.innerHTML=`
  <div class="chart" style="margin-top:14px">
    <div class="eyebrow">Deal space — live</div>
    <h3>Every buy-box match as a bubble: where the deals live, and how they move as you negotiate</h3>
    <p class="chartnote">Voronoi cells partition the field — each cell belongs to one property, tinted by its Locator&nbsp;X score tier (green ≥60, amber ≥45, red below). Bubbles: x = cap rate at the current offer, y = monthly cash flow (25% down, conventional), size = price. Drag the slider (or press play) to sweep the offer from recorded price to 20% below it, Rosling-style — watch which properties cross into positive cash flow first: those are your negotiation targets. Click any bubble to open its underwriting sheet.</p>
    <div class="toolbar" style="align-items:center;gap:10px;margin:8px 0">
      <button class="btn" id="vzplay">▶ Play</button>
      <input type="range" id="vzdisc" min="0" max="20" step="0.5" value="${VZ.disc}" style="flex:1;max-width:340px">
      <span style="font-family:var(--mono);font-size:12.5px" id="vzlab">offer = recorded price − ${VZ.disc}%</span>
    </div>
    <div id="vzfield"></div>
    <div id="vzcity" style="margin-top:18px"></div>
  </div>`;
  const slider=$('#vzdisc');
  slider.addEventListener('input', ()=>{ VZ.disc=+slider.value; draw(pts); });
  $('#vzplay').onclick=()=>{
    if(VZ.playing){ clearInterval(VZ.timer); VZ.playing=false; $('#vzplay').textContent='▶ Play'; return; }
    VZ.playing=true; $('#vzplay').textContent='⏸ Pause';
    VZ.timer=setInterval(()=>{ VZ.disc+=0.5; if(VZ.disc>20) VZ.disc=0; slider.value=VZ.disc; draw(pts); }, 220);
  };
  draw(pts);
}
function draw(pts){
  const X=L(); const lab=$('#vzlab'); if(lab) lab.textContent=`offer = recorded price − ${VZ.disc}%`;
  const box=$('#vzfield'); if(!box) return;
  const rows=pts.map(p=>Object.assign({p}, uwAt(p, VZ.disc)));
  const W=980,H=460,pl=64,pr=16,pt=14,pb=42;
  let xlo=0,xhi=8,ylo=-6000,yhi=3000;
  for(const r of rows){ if(r.cap>xhi)xhi=Math.min(16,r.cap); if(r.cfMo<ylo)ylo=Math.max(-12000,r.cfMo); if(r.cfMo>yhi)yhi=Math.min(15000,r.cfMo); }
  const xs=v=>pl+(clamp(v,xlo,xhi)-xlo)/(xhi-xlo)*(W-pl-pr);
  const ys=v=>pt+(1-(clamp(v,ylo,yhi)-ylo)/(yhi-ylo))*(H-pt-pb);
  const pmax=Math.max(...rows.map(r=>r.p.price));
  const rad=v=>3+Math.sqrt(v/pmax)*15;
  let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">`;
  // voronoi underlay
  if(window.d3 && d3.Delaunay && rows.length>2){
    try{
      const del=d3.Delaunay.from(rows, r=>xs(r.cap), r=>ys(r.cfMo));
      const vor=del.voronoi([pl,pt,W-pr,H-pb]);
      rows.forEach((r,i)=>{ const path=vor.renderCell(i); if(path) s+=`<path d="${path}" fill="${TIER(r.p.score)}" fill-opacity="0.10" stroke="var(--line2)" stroke-opacity="0.5"/>`; });
    }catch(e){}
  }
  // axes
  s+=`<line x1="${pl}" x2="${W-pr}" y1="${ys(0)}" y2="${ys(0)}" stroke="var(--ink2)" stroke-dasharray="4 3"/>`;
  for(let c=Math.ceil(xlo);c<=xhi;c+=2) s+=`<text x="${xs(c)}" y="${H-24}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${c}%</text>`;
  [[ylo,0],[0,0],[yhi,0]].forEach(t=>{ s+=`<text x="${pl-8}" y="${ys(t[0])+4}" text-anchor="end" font-size="10.5" font-family="var(--mono)" fill="var(--muted)">${X.fmt$(t[0])}</text>`; });
  s+=`<text x="${(pl+W-pr)/2}" y="${H-6}" text-anchor="middle" font-size="11" fill="var(--muted)">cap rate at this offer →</text>`;
  s+=`<text x="14" y="${(pt+H-pb)/2}" text-anchor="middle" font-size="11" fill="var(--muted)" transform="rotate(-90 14 ${(pt+H-pb)/2})">cash flow $/mo →</text>`;
  // bubbles
  rows.forEach(r=>{
    s+=`<circle cx="${xs(r.cap)}" cy="${ys(r.cfMo)}" r="${rad(r.p.price)}" fill="${TIER(r.p.score)}" fill-opacity="0.72" stroke="#fff" stroke-width="0.8" style="cursor:pointer" data-id="${r.p.id}"><title>${X.esc(r.p.l.addr)}, ${X.esc(r.p.city)} — ${X.fmt$(r.p.price)}${VZ.disc?` (offer ${X.fmt$(Math.round(r.p.price*(1-VZ.disc/100)))})`:''} · cap ${r.cap.toFixed(1)}% · ${r.cfMo>0?'+':''}${X.fmt$(r.cfMo)}/mo · score ${r.p.score}</title></circle>`;
  });
  const pos=rows.filter(r=>r.cfMo>0).length;
  s+=`<text x="${W-pr-6}" y="${pt+16}" text-anchor="end" font-size="12.5" font-family="var(--mono)" fill="var(--good)">${pos} of ${X.fmtN(rows.length)} cash-flow positive at −${VZ.disc}%</text>`;
  s+='</svg>';
  box.innerHTML=s;
  box.querySelectorAll('circle[data-id]').forEach(c=>c.addEventListener('click', ()=>{ U().openSheet(c.dataset.id); }));
  drawCity(rows);
}
function drawCity(rows){
  const X=L(); const box=$('#vzcity'); if(!box) return;
  const by={};
  rows.forEach(r=>{ (by[r.p.city]=by[r.p.city]||[]).push(r); });
  const cities=Object.entries(by).filter(([,v])=>v.length>=3).map(([city,v])=>{
    const med=a=>{ const s2=a.slice().sort((x,y)=>x-y); return s2[Math.floor(s2.length/2)]; };
    return {city, n:v.length, cap:med(v.map(r=>r.cap)), cf:med(v.map(r=>r.cfMo)), county:v[0].p.county};
  }).sort((a,b)=>b.n-a.n).slice(0,18);
  if(cities.length<3){ box.innerHTML=''; return; }
  const W=980,H=300,pl=64,pr=16,pt=26,pb=40;
  const xlo=Math.min(...cities.map(c=>c.cap))-0.4, xhi=Math.max(...cities.map(c=>c.cap))+0.4;
  const ylo=Math.min(...cities.map(c=>c.cf))-300, yhi=Math.max(...cities.map(c=>c.cf))+300;
  const xs=v=>pl+(v-xlo)/(xhi-xlo)*(W-pl-pr), ys=v=>pt+(1-(v-ylo)/(yhi-ylo))*(H-pt-pb);
  const nmax=Math.max(...cities.map(c=>c.n));
  let s=`<div class="eyebrow" style="margin-bottom:4px">City movers at −${VZ.disc}%</div><svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">`;
  if(ylo<0&&yhi>0) s+=`<line x1="${pl}" x2="${W-pr}" y1="${ys(0)}" y2="${ys(0)}" stroke="var(--ink2)" stroke-dasharray="4 3"/>`;
  cities.forEach(c=>{
    const r=8+Math.sqrt(c.n/nmax)*22, col=ctyColor(c.county);
    s+=`<circle cx="${xs(c.cap)}" cy="${ys(c.cf)}" r="${r}" fill="${col}" fill-opacity="0.55" stroke="${col}"><title>${X.esc(c.city)} — ${c.n} matches · median cap ${c.cap.toFixed(1)}% · median ${c.cf>0?'+':''}${X.fmt$(c.cf)}/mo</title></circle>`;
    s+=`<text x="${xs(c.cap)}" y="${ys(c.cf)-r-3}" text-anchor="middle" font-size="10.5" fill="var(--ink2)">${X.esc(c.city)}</text>`;
  });
  s+=`<text x="${(pl+W-pr)/2}" y="${H-6}" text-anchor="middle" font-size="11" fill="var(--muted)">median cap rate →</text>`;
  s+=`<text x="14" y="${(pt+H-pb)/2}" text-anchor="middle" font-size="11" fill="var(--muted)" transform="rotate(-90 14 ${(pt+H-pb)/2})">median cash flow →</text>`;
  s+='</svg>';
  box.innerHTML=s;
}
window.LXUWViz={render};
})();
