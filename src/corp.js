/* locator.x — announced corporate projects layer.
   Verified expansion, campus, plant and data-center announcements with capital, jobs and a
   source URL, mapped and scored by proximity. Corporate capital lands on housing with a
   lag: construction crews first, then permanent staff, then rents. */
(function(){
'use strict';
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const L=()=>window.LX;
const P=()=>window.LXCORP||[];
const R=6371; // km
function dist(aLat,aLng,bLat,bLng){
  const dLat=(bLat-aLat)*Math.PI/180, dLng=(bLng-aLng)*Math.PI/180;
  const s=Math.sin(dLat/2)**2+Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(s)));
}
/* Weight a project by the capital and jobs it actually announced.

   A CANCELLED project weighs NOTHING. This is the whole reason the layer carries
   cancellations at all: Air Products' $4.5bn Burnside complex was announced in
   2021, permitted, paused in May 2025 and killed outright on 2026-06-30 with a
   pre-tax charge of up to $2.9bn. A parcel eight kilometres away must not score
   as though that capital were still coming. Left unguarded, the three dead
   Louisiana projects in this layer would add roughly $6.3bn of phantom pressure
   to the corridors they were cancelled out of - and they would do it invisibly,
   because the score is a number and the cancellation is a sentence.

   A project whose federal funding has been terminated but which has not formally
   died is halved rather than zeroed: it is genuinely less likely than it was and
   genuinely not yet nothing. */
function weight(p){
  if(p.dead) return 0;
  const inv=(typeof p.investment==='number'&&p.investment>0)?p.investment:0;
  const jbs=(typeof p.jobs==='number'&&p.jobs>0)?p.jobs:0;      // never log a loss
  const cap=inv? Math.log10(inv)-7 : 0;                          // $10M -> 0, $100B -> 4
  const job=jbs? Math.log10(jbs)/2 : 0;                          // 1000 jobs -> 1.5
  const w=Math.max(0.35, cap*0.9 + job*0.6);
  return p.atRisk ? w*0.5 : w;
}
function standing(p){ return p.dead?'dead' : p.atRisk?'at risk' : 'live'; }
let _near=null;
function nearest(l){
  if(!l||l.lat==null) return null;
  const ps=P(); if(!ps.length) return null;
  /* Two answers, kept apart on purpose. `best` is the nearest LIVE project,
     because that is the one that carries demand. `dead` is the nearest cancelled
     or closed one, surfaced separately - "the $4.5bn plant 8 km from here was
     cancelled in June" is exactly what someone underwriting this parcel needs,
     and folding it into the same field as a live announcement would erase it. */
  let best=null, bd=1e9, score=0, dead=null, dd=1e9;
  for(const p of ps){
    const d=dist(l.lat,l.lng,p.lat,p.lng);
    if(p.dead){ if(d<dd){ dd=d; dead=p; } continue; }
    if(d<bd){ bd=d; best=p; }
    if(d<40){ const w=weight(p); score+=w*Math.exp(-d/12); }   // 12 km decay
  }
  if(!best && !dead) return null;
  const out={p:best, km:best?bd:null, score:Math.min(100, Math.round(score*13))};
  if(dead && dd<=40){ out.dead=dead; out.deadKm=dd; }
  return out;
}
function counts(p, radiusKm){
  const X=L(); const all=X.allListings(); let n=0;
  const cap=Math.min(all.length, 60000);
  for(let i=0;i<cap;i++){ const l=all[i]; if(l.lat==null) continue; if(dist(l.lat,l.lng,p.lat,p.lng)<=radiusKm) n++; }
  return n;
}
function fmt$(v){ if(v==null) return 'not disclosed'; if(v>=1e9) return '$'+(v/1e9).toFixed(v%1e9?1:0)+'B'; if(v>=1e6) return '$'+Math.round(v/1e6)+'M'; return '$'+Math.round(v/1e3)+'k'; }

/* ---------- map markers ---------- */
let markers=[], on=true;
function addMarkers(map, Marker){
  const X=L(); if(!map||!Marker) return;
  const b=map.getBounds&&map.getBounds();
  P().forEach(p=>{
    if(b && (p.lat<b.getSouth()-1.5||p.lat>b.getNorth()+1.5||p.lng<b.getWest()-1.5||p.lng>b.getEast()+1.5)) return;
    const el=document.createElement('div');
    el.style.cssText='font-size:17px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));cursor:pointer';
    el.textContent=p.dead?'\u26D4':(p.atRisk?'\u26A0':'\uD83C\uDFD7');
    if(p.dead) el.style.opacity='0.75';
    el.title=p.company+' \u2014 '+p.project+' ('+p.city+') \u00b7 '+fmt$(p.investment)
      +(p.jobs?' \u00b7 '+p.jobs.toLocaleString()+' jobs':'')+' \u00b7 announced '+p.announced
      +(p.dead?'  \u2014 CANCELLED OR CLOSED, carries no weight in any score':(p.atRisk?'  \u2014 AT RISK, weighted at half':''));
    el.addEventListener('click',()=>{ L().showView('scout'); setTimeout(()=>{ const row=document.querySelector('[data-corp="'+esc(p.company+p.city)+'"]'); if(row) row.scrollIntoView({behavior:'smooth',block:'center'}); },350); });
    try{ const m=new Marker({element:el}).setLngLat([p.lng,p.lat]).addTo(map); markers.push(m); }catch(e){}
  });
  const btn=$('#corpbtn');
  if(btn) btn.addEventListener('click',()=>{ on=!on; markers.forEach(m=>{ m.getElement().style.display=on?'':'none'; }); btn.setAttribute('aria-pressed',on); });
}
const esc=s=>String(s).replace(/[^a-zA-Z0-9]/g,'');

/* ---------- panel ---------- */
function render(){
  const host=$('#corproot'); if(!host||host.dataset.built) return;
  const X=L();
  const ps=P().slice();
  if(!ps.length){ host.innerHTML=''; return; }
  host.dataset.built='1';
  // only projects with tracked properties nearby lead the list
  const rows=ps.map(p=>({p, n10:counts(p,10), n25:counts(p,25)}))
    .sort((a,b)=>(!!a.p.dead-!!b.p.dead)||(b.n10-a.n10)||((b.p.investment||0)-(a.p.investment||0)));
  const live=ps.filter(p=>!p.dead);
  const gone=ps.filter(p=>p.dead);
  const totCap=live.reduce((t,p)=>t+(p.investment||0),0);
  const totJobs=live.reduce((t,p)=>t+((typeof p.jobs==='number'&&p.jobs>0)?p.jobs:0),0);
  const lostCap=gone.reduce((t,p)=>t+(p.investment||0),0);
  const lostJobs=gone.reduce((t,p)=>t+(Math.abs(p.jobsLost||0)||(typeof p.jobs==='number'&&p.jobs>0?p.jobs:0)),0);
  host.innerHTML=`<div class="tile" data-panel data-panel-title="Announced corporate projects">
    <p class="eyebrow">Corporate capital · researched ${new Date().toISOString().slice(0,7)}</p>
    <h3 style="margin:2px 0 6px">${live.length} live projects — ${fmt$(totCap)} of disclosed capital, ${totJobs.toLocaleString()} announced jobs</h3>
    ${gone.length?`<p style="font-size:13px;color:var(--ink2);max-width:88ch;margin:0 0 8px;border-left:3px solid var(--bad);padding-left:9px"><b>${gone.length} further project${gone.length===1?' was':'s were'} cancelled or closed, removing ${fmt$(lostCap)} and ${lostJobs.toLocaleString()} jobs from ${gone.length===1?'its':'their'} corridor${gone.length===1?'':'s'}.</b> They are kept in this table and struck through. They carry <b>zero</b> weight in every proximity score in this app — a cancelled announcement must never read as pressure. A completed cancellation is often better evidence than a live announcement, because the story finished.</p>`:''}
    <p class="chartnote">Verified announcements from company newsrooms, Louisiana Economic Development and planning records. Corporate capital reaches housing on a lag — construction crews first, then permanent staff, then rents — so the useful window is the gap between the announcement and the ribbon cutting. Every row links to the source that was actually read; where a company did not disclose capital or jobs, this says so rather than guessing. Counts are tracked properties in THIS edition within 10 and 25 km.</p>
    <div class="tablewrap" style="margin-top:8px"><table class="grid"><thead><tr><th>Company</th><th>Project</th><th>Where</th><th class="r">Capital</th><th class="r">Jobs</th><th>Announced</th><th>Status</th><th class="r">≤10km</th><th class="r">≤25km</th><th></th></tr></thead>
    <tbody>${rows.map(r=>{ const p=r.p; return `<tr data-corp="${esc(p.company+p.city)}"${p.dead?' style="opacity:.72"':''}>
      <td><b${p.dead?' style="text-decoration:line-through"':''}>${X.esc(p.company)}</b>${p.dead?' <span style="color:var(--bad);font-size:10px;font-weight:700">CANCELLED</span>':(p.atRisk?' <span style="color:var(--warn);font-size:10px;font-weight:700">AT RISK</span>':'')}</td><td style="font-size:12px;max-width:340px">${X.esc(p.project)}</td>
      <td>${X.esc(p.city)}, ${p.state}${p.geo==='city'?' <span style="color:var(--muted);font-size:10px" title="Exact site not published — plotted at the city center">(city)</span>':''}</td>
      <td class="r">${p.investment?fmt$(p.investment):'<span style="color:var(--muted)">not disclosed</span>'}</td>
      <td class="r">${p.jobs?p.jobs.toLocaleString():'<span style="color:var(--muted)">—</span>'}</td>
      <td>${p.announced}</td><td style="font-size:12px">${p.status}</td>
      <td class="r"><button class="btn" data-cp="${esc(p.company+p.city)}" data-r="10" style="padding:1px 7px;font-size:11.5px"><b>${r.n10.toLocaleString()}</b></button></td><td class="r"><button class="btn" data-cp="${esc(p.company+p.city)}" data-r="25" style="padding:1px 7px;font-size:11.5px">${r.n25.toLocaleString()}</button></td>
      <td><a href="${X.esc(p.url)}" target="_blank" rel="noopener" style="font-size:11px">source</a></td></tr>`; }).join('')}</tbody></table></div>
    <p class="src">Proximity is a demand signal, not a promise: announced projects get cancelled, delayed and downsized, and a data center employs far fewer permanent staff than its capital suggests — which is why jobs are shown separately from dollars. Read the source before you underwrite anything on it.</p>
  </div>`;
  /* the two counts are the interface: click one to see exactly which tracked
     properties sit inside that radius of the announced site */
  Array.from(host.querySelectorAll('[data-cp]')).forEach(b=>b.addEventListener('click',()=>{
    const key=b.dataset.cp, km=+b.dataset.r;
    const p2=P().find(x=>esc(x.company+x.city)===key); if(!p2) return;
    const all=(window.LX&&LX.allListings())||[];
    const hits=all.filter(l=>l.lat!=null && dist(l.lat,l.lng,p2.lat,p2.lng)<=km);
    window.LXPal&&LXPal.drill(p2.company+' \u2014 within '+km+' km', hits,
      {eyebrow:'Tracked records near an announced project',
       note:p2.project+'. '+(p2.investment?fmt$(p2.investment)+' announced':'capital not disclosed')+(p2.jobs?', '+p2.jobs.toLocaleString()+' announced jobs':'')+', announced '+p2.announced+'. An announcement is an intention, not construction \u2014 read the source before underwriting anything on it.'});
  }));
  try{ if(window.LXPanels) LXPanels.scan('scout'); }catch(e){}
}
window.LXCorp={render, nearest, addMarkers, dist, weight, standing, fmt$};
})();
