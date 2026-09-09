/* ===== Locator.X — campus demand layer (student housing) ===================
   Enrollment figures are published headcounts from the institution, its
   system office, the Louisiana Board of Regents fact book, or IPEDS. Each
   row carries the term the figure refers to and the source it came from.
   Proximity to a campus is a demand hypothesis, not a rent premium: it has
   to be tested against the rent the property can actually document.
   ========================================================================= */
(function(){
  const C = (window.LXCAMPUS||[]).map(r=>({name:r[0],city:r[1],state:r[2],lat:r[3],lng:r[4],enroll:r[5],term:r[6],type:r[7],src:r[8]}));
  const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmtN=n=>n==null?'—':Number(n).toLocaleString();

  const R=6371;
  function dist(a,b,c,d){ const t=Math.PI/180, x=(c-a)*t, y=(d-b)*t;
    const h=Math.sin(x/2)**2 + Math.cos(a*t)*Math.cos(c*t)*Math.sin(y/2)**2;
    return 2*R*Math.asin(Math.min(1,Math.sqrt(h))); }

  /* A degree of latitude is ~111.32 km everywhere; a degree of longitude
     shrinks by cos(lat).  Comparing two floats against a precomputed box is
     perhaps forty times cheaper than a haversine, and on these editions the
     overwhelming majority of (property, campus) pairs are hundreds of
     kilometres apart, so the box rejects them before any trigonometry runs.
     This is what took the campus tab from twelve seconds to well under one on
     the 302,612-record edition. */
  function boxes(km){
    const dLat = km/111.32;
    return C.map(c=>({lat:c.lat, lng:c.lng,
      dLat: dLat,
      /* cos(lat) is taken at the campus, but a point up to `km` away sits at a
         slightly different latitude, so the longitude half-width carries a 2%
         margin.  The box only has to be a superset of the circle — the exact
         haversine still decides membership. */
      dLng: 1.02*km/(111.32*Math.max(0.12, Math.cos(c.lat*Math.PI/180)))}));
  }

  /* Weight: enrollment on a log scale so a 45,000-student flagship counts
     more than a 5,000-student campus without swamping it 9:1. Community
     colleges get a 0.55 factor — they draw commuters far more than they
     draw renters, which is the whole point of the housing thesis. */
  const TYPEW={public4:1, private4:0.95, health:0.8, community:0.55};
  function weight(c){
    if(!c.enroll) return 0.25;
    const e=Math.max(500, c.enroll);
    return (Math.log10(e)-2.5)/1.5 * (TYPEW[c.type]||0.7);   // ~0.1 .. 1.0
  }

  /* Student-housing walk/bike bands. Inside 1.6 km is walkable; 1.6-4.8 km
     is a bike or a shuttle; past 8 km the campus stops being the reason a
     tenant picks the unit. Decay is exponential on a 2.6 km scale, cut at
     16 km. */
  const CUT=16, SCALE=2.6;
  const BOX32 = boxes(CUT*2);   /* nearest() searches out to CUT*2 */
  const BOX16 = boxes(CUT);     /* counts() bands top out at CUT */
  function scoreOne(c, km){
    if(km>CUT) return 0;
    return weight(c) * Math.exp(-km/SCALE);
  }

  function nearest(l){
    if(!l || l.lat==null || l.lng==null || !C.length) return null;
    let best=null, tot=0;
    for(let i=0;i<C.length;i++){
      const b=BOX32[i];
      if(Math.abs(l.lat-b.lat)>b.dLat) continue;
      if(Math.abs(l.lng-b.lng)>b.dLng) continue;
      const c=C[i];
      const km=dist(l.lat,l.lng,c.lat,c.lng);
      if(km>CUT*2) continue;
      const s=scoreOne(c,km);
      tot+=s;
      if(!best || km<best.km) best={c,km,score:s};
    }
    if(!best) return null;
    best.stack=Math.min(1, tot);      // several campuses in range stack
    return best;
  }

  /* Suitability for a student-housing play: campus pull, then whether the
     physical asset can actually be leased by the bedroom. */
  function suitability(l){
    const n=nearest(l); if(!n) return null;
    const pull=n.stack;                                   // 0..1
    const u=+l.units||0, bd=+l.beds||0;
    // by-the-bed capacity: a 4-plex of 2-beds leases 8 beds
    const beds = bd>0 ? bd : (u>0 ? u*2 : 0);
    const cap = beds<=0 ? 0 : Math.min(1, Math.log10(beds+1)/1.2);   // 0..1
    const kind=String(l.kind||'').toLowerCase();
    const kindFit = /apart|multi|duplex|triplex|four|sro|dorm|rooming/.test(kind) ? 1
                  : /hotel|motel|condo/.test(kind) ? 0.75
                  : /single|sfr|residen/.test(kind) ? 0.6 : 0.45;
    const s = Math.round(100*(0.5*pull + 0.3*cap + 0.2*kindFit));
    return {score:s, pull, cap, kindFit, campus:n.c, km:n.km, beds};
  }

  /* The three distance bands used to be three separate full sweeps of the
     listing set per campus — on 302,612 records and this many campuses that
     is over a hundred million haversines, and it measured at 11.9 seconds.
     One pass now fills all three bands for every campus at once, behind the
     bounding-box reject, and the result is memoised until the inventory
     changes. */
  let _bands=null, _bandsN=-1;
  function bands(){
    const L=(window.LX&&window.LX.allListings&&window.LX.allListings())||[];
    if(_bands && _bandsN===L.length) return _bands;
    const out=C.map(()=>({n1:0,n5:0,n16:0}));
    for(let j=0;j<L.length;j++){
      const l=L[j]; if(l.lat==null||l.lng==null) continue;
      const la=l.lat, ln=l.lng;
      for(let i=0;i<C.length;i++){
        const b=BOX16[i];
        if(Math.abs(la-b.lat)>b.dLat) continue;
        if(Math.abs(ln-b.lng)>b.dLng) continue;
        const km=dist(la,ln,b.lat,b.lng);
        if(km<=16){ const o=out[i]; o.n16++; if(km<=4.8){ o.n5++; if(km<=1.6) o.n1++; } }
      }
    }
    _bandsN=L.length; return _bands=out;
  }
  /* kept for callers outside this module; band counts come from bands() */
  function counts(c, km){
    const i=C.indexOf(c); if(i<0) return 0;
    const o=bands()[i];
    return km<=1.6? o.n1 : km<=4.8? o.n5 : o.n16;
  }

  let markers=[]; window.__campusOn=true;
  function addMarkers(map, Marker){
    if(!map||!Marker||!C.length) return;
    const L=(window.LX&&window.LX.allListings&&window.LX.allListings())||[];
    // only mount campuses that are actually near tracked inventory
    const B40=boxes(40);
    const near=C.filter((c,ci)=>{ const b=B40[ci];
      for(let i=0;i<L.length;i+=7){ const l=L[i]; if(!l||l.lat==null) continue;
        if(Math.abs(l.lat-b.lat)>b.dLat || Math.abs(l.lng-b.lng)>b.dLng) continue;
        if(dist(l.lat,l.lng,c.lat,c.lng)<40) return true; }
      return false; });
    near.forEach(c=>{
      const el=document.createElement('div');
      const r=6+Math.round(10*weight(c));
      el.style.cssText='width:'+(r*2)+'px;height:'+(r*2)+'px;border-radius:50%;background:rgba(46,134,193,.22);border:2px solid #2e86c1;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px';
      el.textContent='🎓';
      el.title=c.name+' — '+fmtN(c.enroll)+' enrolled ('+(c.term||'term n/a')+')';
      const m=new Marker({element:el}).setLngLat([c.lng,c.lat]).addTo(map);
      markers.push(m);
    });
    return near.length;
  }
  function toggle(on){ window.__campusOn=on==null?!window.__campusOn:!!on; markers.forEach(m=>{m.getElement().style.display=window.__campusOn?'':'none'}); }

  /* Highlights the actual candidate deals on the map itself — not just the
     campuses — using the same suitability>=55, inside-4.8km rule the Scout
     tab's table uses. Capped at 80 so a 128,000-listing edition doesn't
     carpet the map; click opens the same drawer the list row does. */
  let dealMarkers=[]; window.__campusDealsOn=true;
  function highlightMarkers(map, Marker){
    if(!map||!Marker||!C.length) return 0;
    const L=(window.LX&&window.LX.allListings&&window.LX.allListings())||[];
    const cand=[];
    for(const l of L){
      const s=suitability(l);
      if(s && s.score>=55 && s.km<=4.8) cand.push({l,s});
    }
    cand.sort((a,b)=>b.s.score-a.s.score);
    const top=cand.slice(0,80);
    top.forEach(({l,s})=>{
      if(l.lat==null||l.lng==null) return;
      const el=document.createElement('div');
      const r=7+Math.round(4*Math.max(0,Math.min(1,(s.score-55)/45)));
      el.style.cssText='width:'+(r*2)+'px;height:'+(r*2)+'px;border-radius:50%;background:rgba(217,111,14,.30);border:2.5px solid #D96F0E;cursor:pointer;box-shadow:0 0 0 2px rgba(217,111,14,.14)';
      el.title=(l.addr||'Property')+' — student-housing fit '+s.score+' · '+s.km.toFixed(1)+' km from '+s.campus.name;
      el.addEventListener('click', e=>{ e.stopPropagation(); if(window.LX&&LX.select) LX.select(l.id,true); });
      const m=new Marker({element:el}).setLngLat([l.lng,l.lat]).addTo(map);
      dealMarkers.push(m);
    });
    return top.length;
  }
  function toggleDeals(on){ window.__campusDealsOn=on==null?!window.__campusDealsOn:!!on; dealMarkers.forEach(m=>{m.getElement().style.display=window.__campusDealsOn?'':'none'}); }

  function render(){
    /* Every input here — allListings(), the static campus list, suitability()
       — is fixed for the life of the page, so this table and its 60-candidate
       scan (a per-listing nearest-campus lookup on top of the already-memoized
       bands()) only need to run once. Measured at ~0.8-1.1s per call and paid
       again, unchanged, on every single revisit to the Scout tab; corp.js and
       rag.js already use this same one-render guard for the same reason. */
    const root=$('#campusroot'); if(!root||root.dataset.built) return; root.dataset.built='1';
    const L=(window.LX&&window.LX.allListings&&window.LX.allListings())||[];
    const BD=bands();
    const rows=C.map((c,i)=>({c, n1:BD[i].n1, n5:BD[i].n5, n16:BD[i].n16}))
      .filter(r=>r.n16>0).sort((a,b)=>(b.c.enroll||0)-(a.c.enroll||0));

    if(!rows.length){ root.innerHTML='<p class="chartnote">No campus in this edition’s footprint falls within 16&nbsp;km of tracked inventory.</p>'; return; }

    // top student-housing candidates in this edition
    const cand=[];
    for(const l of L){
      const s=suitability(l);
      if(s && s.score>=55 && s.km<=4.8) cand.push({l,s});
    }
    cand.sort((a,b)=>b.s.score-a.s.score);
    const top=cand.slice(0,60);

    const totEnroll=rows.reduce((a,r)=>a+(r.c.enroll||0),0);
    root.innerHTML =
    '<div class="cards" style="margin:0 0 12px">'
    + tile('Campuses in footprint', rows.length, 'within 16 km of tracked inventory')
    + tile('Enrolled headcount', fmtN(totEnroll), 'published figures, term shown per row')
    + tile('Units inside 1.6 km', fmtN(rows.reduce((a,r)=>a+r.n1,0)), 'walkable band, may double-count overlapping campuses')
    + tile('Scored candidates', fmtN(cand.length), 'suitability ≥ 55 and inside 4.8 km')
    + '</div>'
    + '<div class="tablewrap" data-panel data-panel-title="Campuses &amp; tracked inventory"><table class="grid"><thead><tr>'
    + '<th>Campus</th><th>City</th><th class="num">Enrolled</th><th>Term</th><th>Type</th>'
    + '<th class="num">&le;1.6 km</th><th class="num">&le;4.8 km</th><th class="num">&le;16 km</th><th>Source</th><th>Records</th></tr></thead><tbody>'
    + rows.map(r=>'<tr><td><b>'+esc(r.c.name)+'</b></td><td>'+esc(r.c.city)+', '+esc(r.c.state)+'</td>'
      + '<td class="num">'+fmtN(r.c.enroll)+'</td><td style="font-size:11.5px;color:var(--muted)">'+esc(r.c.term||'—')+'</td>'
      + '<td style="font-size:11.5px">'+esc({public4:'Public 4-yr',private4:'Private 4-yr',community:'Community',health:'Health sciences'}[r.c.type]||r.c.type)+'</td>'
      + '<td class="num">'+fmtN(r.n1)+'</td><td class="num">'+fmtN(r.n5)+'</td><td class="num">'+fmtN(r.n16)+'</td>'
      + '<td>'+(r.c.src?'<a href="'+esc(r.c.src)+'" target="_blank" rel="noopener">source</a>':'—')+'</td>'
      + '<td><button class="btn" data-camp="'+esc(r.c.name)+'" data-r="1.6">walk</button> <button class="btn" data-camp="'+esc(r.c.name)+'" data-r="4.8">bike</button></td></tr>').join('')
    + '</tbody></table></div>'
    + '<h3 class="h2" style="font-size:17px;margin:18px 0 6px">Student-housing candidates &mdash; inside the bike band</h3>'
    + '<p class="chartnote" style="margin:0 0 8px">Suitability blends campus pull (half), by-the-bed capacity (three tenths) and whether the structure can actually be leased that way (one fifth). It says nothing about whether by-the-bed leasing is permitted at the address &mdash; occupancy caps, rental registration and any campus-adjacent overlay are yours to check before you underwrite a bed count.</p>'
    + '<div class="tablewrap" data-panel data-panel-title="Student-housing candidates"><table class="grid"><thead><tr>'
    + '<th class="num">Fit</th><th>Address</th><th>City</th><th>Kind</th><th class="num">Units</th><th class="num">Beds</th><th class="num">Price</th><th>Nearest campus</th><th class="num">km</th></tr></thead><tbody>'
    + top.map(({l,s})=>'<tr data-id="'+esc(l.id)+'" style="cursor:pointer">'
      + '<td class="num"><b>'+s.score+'</b></td><td>'+esc(l.addr||'—')+'</td><td>'+esc(l.city||'—')+'</td>'
      + '<td style="font-size:11.5px">'+esc(l.kind||'—')+'</td><td class="num">'+(l.units||'—')+'</td><td class="num">'+(s.beds||'—')+'</td>'
      + '<td class="num">'+(l.price?('$'+fmtN(l.price)):'—')+'</td>'
      + '<td style="font-size:11.5px">'+esc(s.campus.name)+'</td><td class="num">'+s.km.toFixed(1)+'</td></tr>').join('')
    + '</tbody></table></div>'
    + (top.length? '' : '<p class="chartnote">No property in this edition scores 55 or better inside the 4.8&nbsp;km band.</p>');

    $$('#campusroot tbody tr[data-id]').forEach(tr=>tr.addEventListener('click',()=>{ if(window.LX&&LX.select) LX.select(tr.dataset.id,true); }));
    /* every count in that table opens the records it counted */
    $$('#campusroot [data-camp]').forEach(b=>b.addEventListener('click',e=>{
      e.stopPropagation();
      const c=C.find(x=>x.name===b.dataset.camp); if(!c) return;
      const km=+b.dataset.r;
      const hits=L.filter(l=>l.lat!=null && dist(l.lat,l.lng,c.lat,c.lng)<=km);
      window.LXPal&&LXPal.drill(c.name+' \u2014 within '+km+' km', hits,
        {eyebrow:(km<=1.6?'Walkable band':'Bike or shuttle band'),
         note:'Proximity to '+fmtN(c.enroll)+' enrolled students ('+(c.term||'term n/a')+') is a demand hypothesis to test against documented rent, not a rent premium, and it says nothing about whether leasing by the bed is permitted at any of these addresses.'});
    }));
    if(window.LXPanels) setTimeout(()=>LXPanels.scan('campus'),120);
  }
  function tile(k,v,note){ return '<div class="tile"><p class="eyebrow" style="margin:0">'+esc(k)+'</p><p class="big num" style="margin:4px 0 2px">'+esc(v)+'</p><p style="font-size:11.5px;color:var(--muted);margin:0">'+esc(note)+'</p></div>'; }

  window.LXCampus={render, nearest, suitability, addMarkers, highlightMarkers, toggle, toggleDeals, dist, weight, LIST:C};
})();
