/* ===== Locator.X — Record Locker =========================================
   For any property, assemble the public-record and imagery sources that
   actually exist for its jurisdiction, and keep whatever the user gathers
   in a per-property knowledgebase.

   Honesty rules baked into this module:
   * A link is marked DIRECT only where the deep-link pattern was actually
     tested and lands on this address. Everything else is marked SEARCH: it
     opens the correct official search page, and the address is copied to the
     clipboard so the user pastes it into the form. We never pretend a link
     goes somewhere it does not.
   * Nothing here fetches, scrapes or caches a portal. Several of these sites
     (San Francisco DBI among them) state plainly that automated access is
     abuse. The Locker opens doors; the person walks through them.
   * Photographs are never generated, inferred or described. The imagery links
     go to the real providers, and the vintage and coverage of what you find
     there is whatever those providers happen to hold.
   ========================================================================= */
(function(){
  const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const enc=encodeURIComponent;
  const KEY='lxkb';
  let KB=(function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } })();
  const saveKB=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(KB)); }catch(e){} };

  /* full mailing-style address, used for the search pastes and FEMA */
  function fullAddr(l){
    const st = /^(Orleans|Jefferson|East Baton Rouge)$/.test(l.county||'') ? 'LA' : 'CA';
    return [l.addr, l.city, st + (l.zip? ' '+l.zip : '')].filter(Boolean).join(', ');
  }

  /* ---- jurisdiction source tables -------------------------------------
     `deep:true` means the URL builder produces a link that lands on this
     specific property. `deep:false` means it opens the right search page.  */
  const UNIVERSAL = [
    {g:'Imagery', n:'Street-level panorama (Google)', deep:true, why:'Nearest available panorama to the parcel centroid. Google snaps to whatever pano is closest, which is sometimes a user photosphere rather than a road-level capture, and its vintage varies.',
     u:l=>`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${l.lat},${l.lng}`},
    {g:'Imagery', n:'Aerial / satellite (Google Maps)', deep:true, why:'Drops a pin on the parcel centroid.',
     u:l=>`https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}`},
    {g:'Imagery', n:'Historic aerials — 1970', deep:true, why:'NETROnline holds scanned aerial series going back decades. Change the year in the URL or the on-page selector to walk the site through time; what existed on the lot in 1970 often explains the building that is there now.',
     u:l=>`https://www.historicaerials.com/location/${l.lat}/${l.lng}/1970/18`},
    {g:'Imagery', n:'Historic aerials — recent', deep:true, why:'Same viewer at a recent series.',
     u:l=>`https://www.historicaerials.com/location/${l.lat}/${l.lng}/2020/19`},
    {g:'Imagery', n:'OpenStreetMap (building footprints)', deep:true, why:'Community-mapped footprints, building tags and address points; often carries a building:levels tag the assessor does not publish.',
     u:l=>`https://www.openstreetmap.org/#map=19/${l.lat}/${l.lng}`},
    {g:'Hazard', n:'FEMA Flood Map Service Center', deep:true, why:'Opens with the address pre-filled and a pin dropped. The effective FIRM panel is the document that governs the flood-insurance requirement — not any zone label carried in a parcel file.',
     u:l=>`https://msc.fema.gov/portal/search?AddressQuery=${enc(fullAddr(l))}#searchresultsanchor`},
    {g:'Hazard', n:'USGS National Map viewer', deep:true, why:'Topography, hydrography and elevation at the parcel.',
     u:l=>`https://apps.nationalmap.gov/viewer/?extent=${(+l.lng-0.004).toFixed(4)},${(+l.lat-0.003).toFixed(4)},${(+l.lng+0.004).toFixed(4)},${(+l.lat+0.003).toFixed(4)}`},
    {g:'Context', n:'Census geography for this point', deep:true, why:'Returns the tract, block group and block containing the parcel — the key for pulling ACS income, tenure and vacancy for the immediate neighborhood.',
     u:l=>`https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${l.lng}&y=${l.lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=html`}
  ];

  const BY_COUNTY = {
    'San Francisco': [
      {g:'Assessor & parcel', n:'SF Property Information Map', deep:true, why:'The single best starting point in San Francisco: zoning, historic status, planning applications, building permits, complaints and appeals for the parcel, all on one panel.',
       u:l=>`https://sfplanninggis.org/pim/?search=${enc(l.addr||'')}`},
      {g:'Assessor & parcel', n:'Assessor-Recorder (SF.gov)', deep:false, why:'The old standalone property-search page is retired; the office now routes public lookups through the community portal and the Property Information Map above.',
       u:()=>'https://www.sf.gov/departments/assessor-recorder'},
      {g:'Deeds & liens', n:'Assessor-Recorder public index search', deep:false, why:'Grantor/grantee, document type and address fields. There is a disclaimer gate and no address deep link, so paste the address into Address Line 1 on the Simple Search tab.',
       u:()=>'https://recorder.sfgov.org/#!/simple'},
      {g:'Permits & code', n:'DBI permit and complaint tracking', deep:false, why:'Every permit, complaint and inspection on the address. Use the site by hand — DBI states that automated scripting of this system is abuse, and Locator.X does not touch it.',
       u:()=>'https://dbiweb02.sfgov.org/dbipts/default.aspx?page=AddressQuery'}
    ],
    'Alameda': [
      {g:'Assessor & parcel', n:'Alameda County property search', deep:false, why:'Assessor and Tax Collector record for the parcel. Three modes — parcel number, type-ahead address, property address; paste into whichever you have.',
       u:()=>'https://propinfo.acgov.org/'},
      {g:'Deeds & liens', n:'Clerk-Recorder official records', deep:false, why:'Recorded documents by name and date range.',
       u:()=>'https://www.acgov.org/auditor/clerk/'},
      {g:'Permits & code', n:'Oakland permit and planning records', deep:false, why:'Use for Oakland addresses; other cities in the county run their own permit desks.',
       u:()=>'https://aca-prod.accela.com/OAKLAND/Default.aspx'}
    ],
    'Contra Costa': [
      {g:'Assessor & parcel', n:'Contra Costa Parcel Viewer', deep:false, why:'Replaced CCMap. Search by address or parcel number; there is a terms checkbox to tick before the map will respond.',
       u:()=>'https://gis.cccounty.us/'},
      {g:'Assessor & parcel', n:'Assessor — maps & property information', deep:false, why:'Parcel maps, ParcelQuest Lite and the county GIS downloads.',
       u:()=>'https://www.contracosta.ca.gov/552/Maps-Property-Information'}
    ],
    'Santa Clara': [
      {g:'Assessor & parcel', n:'Santa Clara County real-property search', deep:false, why:'Simple address, advanced address, or APN. The search sits behind a terms checkbox and a CAPTCHA, so it cannot be deep-linked — paste the address in by hand.',
       u:()=>'https://asr.santaclaracounty.gov/online-services/property-search/real-property'}
    ],
    'San Mateo': [
      {g:'Assessor & parcel', n:'San Mateo ACRE — parcel information', deep:false, why:'Parcel maps and the property-tax lookup that carries the address search.',
       u:()=>'https://www.smcacre.gov/assessor/parcel-information'},
      {g:'Deeds & liens', n:'Grantor / grantee index', deep:false, why:'Recorded document search by party name.',
       u:()=>'https://www.smcacre.gov/county-clerk-recorder/search-grantor-grantee-information'}
    ],
    'Humboldt': [
      {g:'Assessor & parcel', n:'Humboldt County Web GIS', deep:false, why:'Search by assessor parcel number, street address or road name. No terms gate.',
       u:()=>'https://experience.arcgis.com/experience/fc0d507756964ffcaec506c0cd59074f'}
    ],
    'Orleans': [
      {g:'Assessor & parcel', n:'Orleans Parish Assessor property search', deep:false, why:'The assessor routes the public through a disclaimer page and then into the Beacon parcel viewer. Accept the statement, then search by address.',
       u:()=>'https://nolaassessor.com/property-search/'},
      {g:'Permits & code', n:'New Orleans One Stop — permits, licenses, violations', deep:false, why:'Public search needs no login. Paste the address into the quick-search box; the site does not read an address from the URL, so a deep link would be a dead end.',
       u:()=>'https://onestopapp.nola.gov/'},
      {g:'Deeds & liens', n:'Orleans Parish land records (Clerk of Civil District Court)', deep:false, why:'Conveyance and mortgage records for the parish.',
       u:()=>'https://www.orleanscivilclerk.com/'},
      {g:'Assessor & parcel', n:'City of New Orleans open data — parcels', deep:false, why:'The same parcel layer this edition is built from, if you want the raw record rather than the viewer.',
       u:()=>'https://data.nola.gov/'}
    ],
    'Jefferson': [
      {g:'Assessor & parcel', n:'Jefferson Parish Assessor — real property search', deep:false, why:'Four search modes: owner, property address, parcel number, subdivision.',
       u:()=>'https://www.jpassessor.com/Parcel/Search?ParcelType=11'},
      {g:'Assessor & parcel', n:'Jefferson Parish GIS', deep:false, why:'The parish map service this edition reads its building functions from.',
       u:()=>'https://eweb.jeffparish.net/'}
    ],
    'East Baton Rouge': [
      {g:'Assessor & parcel', n:'EBR Assessor — assessment search (SmartCAMA)', deep:false, why:'Search by assessment number, or by physical street number and street name. No login. This is the source of record behind the value shown on this page.',
       u:()=>'https://eastbatonrouge.smartcama.com/Assessments/Search'},
      {g:'Assessor & parcel', n:'EBR Assessor — office site', deep:false, why:'Homestead exemption, assessment appeals and the office contacts.',
       u:()=>'https://www.ebrpa.org/'},
      {g:'Assessor & parcel', n:'EBRGIS Atlas map viewer', deep:false, why:'The City-Parish map atlas — zoning, land use, districts and the Lot Profile behind any parcel.',
       u:()=>'https://atlas.geoportalmaps.com/ebr/'},
      {g:'Permits & code', n:'Open Data BR', deep:false, why:'The parish open-data portal that publishes the tax roll, permits, blight and adjudicated-property datasets.',
       u:()=>'https://data.brla.gov/'}
    ]
  };

  function sourcesFor(l){
    const out=[];
    (BY_COUNTY[l.county]||[]).forEach(s=>out.push(s));
    UNIVERSAL.forEach(s=>out.push(s));
    return out;
  }

  /* ---- per-property knowledgebase ---- */
  function entry(id){ return KB[id] || (KB[id]={links:[], notes:'', updated:null}); }
  function addLink(id, url, label, kind){
    const e=entry(id);
    if(e.links.some(x=>x.url===url)) return false;
    e.links.push({url, label:label||url, kind:kind||'link', at:new Date().toISOString().slice(0,10)});
    e.updated=new Date().toISOString(); saveKB(); return true;
  }
  function removeLink(id, url){ const e=entry(id); e.links=e.links.filter(x=>x.url!==url); saveKB(); }
  function setNotes(id, t){ const e=entry(id); e.notes=t; e.updated=new Date().toISOString(); saveKB(); }
  function countAll(){ let n=0, p=0; for(const k in KB){ const e=KB[k]; if((e.links&&e.links.length)||(e.notes||'').trim()){ p++; n+=(e.links||[]).length; } } return {props:p, links:n}; }
  function exportKB(){ return JSON.stringify({kind:'locator.x-knowledgebase', v:1, saved:new Date().toISOString(), entries:KB}, null, 2); }
  function importKB(txt){
    const o=JSON.parse(txt);
    const src=o.entries||o;
    let merged=0;
    for(const id in src){
      const e=entry(id), s=src[id];
      (s.links||[]).forEach(x=>{ if(!e.links.some(y=>y.url===x.url)){ e.links.push(x); merged++; } });
      if((s.notes||'').trim() && !(e.notes||'').trim()) e.notes=s.notes;
    }
    saveKB(); return merged;
  }

  /* text a RAG index can search: every saved link and note, plus the source
     catalogue itself so "where do I find a deed in Orleans Parish" resolves. */
  function docs(){
    const out=[];
    for(const cty in BY_COUNTY) BY_COUNTY[cty].forEach(s=>{
      out.push({id:'rec:'+cty+':'+s.n, t:s.n+' — '+cty, s:'Record locker',
                x:s.n+'. '+cty+'. '+s.g+'. '+s.why});
    });
    UNIVERSAL.forEach(s=>out.push({id:'rec:*:'+s.n, t:s.n, s:'Record locker', x:s.n+'. '+s.g+'. '+s.why}));
    for(const id in KB){ const e=KB[id]; if(!e) continue;
      const body=(e.links||[]).map(x=>x.label+' '+x.url).join(' ')+' '+(e.notes||'');
      if(body.trim()) out.push({id:'kb:'+id, t:'Saved records for '+id, s:'Your knowledgebase', x:body});
    }
    return out;
  }

  /* ---- rendering ---- */
  function copyBtn(text, label){
    return `<button class="btn" data-copy="${esc(text)}" style="padding:2px 8px;font-size:11px">${esc(label||'Copy address')}</button>`;
  }
  function lockerHTML(l){
    if(!l) return '';
    const fa=fullAddr(l);
    const src=sourcesFor(l);
    const groups={};
    src.forEach(s=>(groups[s.g]=groups[s.g]||[]).push(s));
    const e=entry(l.id);
    const order=['Assessor & parcel','Deeds & liens','Permits & code','Imagery','Hazard','Context'];
    const gs=order.filter(g=>groups[g]);
    return `<div class="sec" style="margin-top:12px" id="lockersec">
      <h3>Record locker &mdash; ${esc(l.county)} County/Parish</h3>
      <p class="chartnote" style="margin:0 0 8px">Sources marked <b>direct</b> open on this address. Sources marked <b>search</b> open the correct official page &mdash; those forms cannot be addressed from a URL, so use Copy address and paste. Locator.X never scrapes these portals; several of them state that automated access is abuse.</p>
      <div class="toolbar" style="margin:0 0 8px">${copyBtn(fa,'Copy address')}${l.apn?copyBtn(l.apn,'Copy parcel number'):''}<span style="font-size:11.5px;color:var(--muted)">${esc(fa)}${l.apn?' &middot; parcel '+esc(l.apn):''}</span></div>
      ${gs.map(g=>`<p class="eyebrow" style="margin:10px 0 4px">${esc(g)}</p>
        <div style="display:grid;gap:6px">${groups[g].map(s=>{
          let href=''; try{ href=s.u(l)||''; }catch(err){ href=''; }
          if(!href) return '';
          return `<div style="display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);border-radius:8px;padding:7px 9px">
            <span style="flex:none;font-size:9.5px;font-weight:700;letter-spacing:.04em;padding:2px 5px;border-radius:4px;background:${s.deep?'rgba(46,134,193,.15)':'rgba(140,140,140,.15)'};color:${s.deep?'#1f6391':'var(--muted)'}">${s.deep?'DIRECT':'SEARCH'}</span>
            <span style="flex:1;min-width:0">
              <a href="${esc(href)}" target="_blank" rel="noopener"><b>${esc(s.n)}</b> &#8599;</a>
              <span style="display:block;font-size:11.5px;color:var(--ink2);margin-top:2px">${s.why}</span>
            </span>
            <button class="btn" data-kbadd="${esc(href)}" data-kblabel="${esc(s.n)}" style="flex:none;padding:2px 8px;font-size:11px">Save</button>
          </div>`; }).join('')}</div>`).join('')}
      <p class="eyebrow" style="margin:14px 0 4px">Your knowledgebase for this property</p>
      <div id="kblist">${kbListHTML(l.id)}</div>
      <div class="toolbar" style="margin:8px 0 0;gap:6px">
        <input type="text" id="kburl" placeholder="Paste a link you found — listing, photo set, deed PDF, permit record" style="flex:1;min-width:220px">
        <input type="text" id="kblab" placeholder="label" style="width:150px">
        <button class="btn" id="kbadd">Add to knowledgebase</button>
      </div>
      <textarea class="big" id="kbnotes" style="min-height:64px;margin-top:8px" placeholder="What the records actually said — assessed value, permit history, roof age, who owns it, what the aerials show changed.">${esc(e.notes||'')}</textarea>
      <div class="toolbar" style="margin-top:6px"><button class="btn" id="kbsave">Save notes</button><button class="btn" id="kbexport">Export knowledgebase</button><button class="btn" id="kbimport">Import</button></div>
      <div class="src">Saved links and notes live in this browser only. Export writes a JSON file you can keep with the deal file or hand to a partner; nothing is uploaded anywhere.</div>
    </div>`;
  }
  function kbListHTML(id){
    const e=entry(id);
    if(!e.links.length) return '<p class="chartnote" style="margin:0">Nothing saved yet. Press <b>Save</b> on any source above, or paste a link you found.</p>';
    return '<div style="display:grid;gap:4px">'+e.links.map(x=>
      `<div style="display:flex;gap:8px;align-items:center;font-size:12px"><a href="${esc(x.url)}" target="_blank" rel="noopener" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.label)}</a><span style="color:var(--muted);font-size:11px;flex:none">${esc(x.at||'')}</span><button class="btn" data-kbdel="${esc(x.url)}" style="flex:none;padding:1px 6px;font-size:11px">remove</button></div>`
    ).join('')+'</div>';
  }
  function bind(l){
    const root=$('#lockersec'); if(!root||!l) return;
    const refresh=()=>{ const c=$('#kblist'); if(c){ c.innerHTML=kbListHTML(l.id); bind(l); } };
    $$('#lockersec [data-copy]').forEach(b=>b.addEventListener('click',()=>{
      const t=b.getAttribute('data-copy'); if(!t) return;
      try{ navigator.clipboard.writeText(t); }catch(e){}
      const o=b.textContent; b.textContent='Copied'; setTimeout(()=>b.textContent=o,1200);
    }));
    $$('#lockersec [data-kbadd]').forEach(b=>b.addEventListener('click',()=>{
      addLink(l.id, b.getAttribute('data-kbadd'), b.getAttribute('data-kblabel'), 'source'); refresh();
    }));
    $$('#lockersec [data-kbdel]').forEach(b=>b.addEventListener('click',()=>{ removeLink(l.id, b.getAttribute('data-kbdel')); refresh(); }));
    const add=$('#kbadd'); if(add) add.addEventListener('click',()=>{
      const u=($('#kburl').value||'').trim(); if(!u) return;
      addLink(l.id, u, ($('#kblab').value||'').trim()||u, 'user');
      $('#kburl').value=''; $('#kblab').value=''; refresh();
    });
    const sv=$('#kbsave'); if(sv) sv.addEventListener('click',()=>{ setNotes(l.id, $('#kbnotes').value||''); sv.textContent='Saved'; setTimeout(()=>sv.textContent='Save notes',1200); });
    const ex=$('#kbexport'); if(ex) ex.addEventListener('click',()=>{
      const blob=new Blob([exportKB()],{type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
      a.download='locator.x-knowledgebase.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    });
    const im=$('#kbimport'); if(im) im.addEventListener('click',()=>{
      const i=document.createElement('input'); i.type='file'; i.accept='.json,application/json';
      i.onchange=()=>{ const f=i.files[0]; if(!f) return; const r=new FileReader();
        r.onload=()=>{ try{ const n=importKB(r.result); refresh(); if(window.LX&&LX.toast) LX.toast(n+' link'+(n===1?'':'s')+' merged into the knowledgebase'); }catch(e){ if(window.LX&&LX.toast) LX.toast('That file was not a Locator.X knowledgebase export'); } };
        r.readAsText(f); };
      i.click();
    });
  }

  window.LXRec={sourcesFor, lockerHTML, bind, docs, entry, addLink, countAll, exportKB, importKB, fullAddr};
})();
