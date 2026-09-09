/* ===== Locator.X — construction cost & rebuild engine =====================
   What would it cost to turn this building into more rental units, is that
   even permitted where it stands, and does the arithmetic survive?

   THE COST BASIS IS SOURCED, AND IT IS NOT A BID. Every anchor in here comes
   from a published table with a link on the panel:
     * ICC Building Valuation Data (February 2026) — the semi-annual table of
       average construction cost per square foot by occupancy group and
       construction type. It is what many jurisdictions use to compute PERMIT
       FEES. It is not a contractor's price, it carries no site work, no
       demolition, no soft costs, no financing and no regional adjustment.
     * USACE Area Cost Factors (PAX Newsletter 3.2.1, FY2026) — a published
       location multiplier normalised to a US average of 1.00. Oakland 1.28,
       New Orleans 0.96. There is NO published Baton Rouge factor; the Louisiana
       state average of 0.93 is offered as a documented assumption and labelled
       as one, never as a Baton Rouge figure.
     * San Francisco DBI Cost Schedule — the city's own residential remodel
       valuation, $191/sf, $225/sf with seismic retrofit.
   Nothing here replaces a contractor's number. Every figure is editable, and
   the panel says so on every screen.

   ZONING IS QUOTED, NOT INFERRED. For East Baton Rouge the district standards
   are read from the adopted Unified Development Code chapter tables, district
   by district, and each row carries whether it was verified. Where a parcel's
   district is unknown, this module says it is unknown and sends you to the
   parish lookup — it never guesses a district from a use class, and it never
   invents a density cap.
   ========================================================================= */
(function(){
  const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const L=()=>window.LX;
  const fmtN=n=>n==null?'—':Math.round(n).toLocaleString();
  const $$$=n=>n==null?'—':(n<0?'-$':'$')+Math.abs(Math.round(n)).toLocaleString();

  /* ---------------- regional cost factor ---------------- */
  const REG=()=>window.LXREGION||[];
  function regionFor(l){
    const c=l.county||'';
    if(/^(San Francisco|Alameda|Santa Clara|San Mateo|Contra Costa)$/.test(c)){
      const r=REG().find(x=>/San Francisco/.test(x.metro));
      return {factor:r?r.factor:1.28, label:'Oakland ACF (Bay Area proxy)', sourced:true, src:r&&r.source, as_of:r&&r.as_of,
              note:'There is no published San Francisco entry; Oakland is the nearest published Bay Area point, so this is probably conservative for San Francisco proper.'};
    }
    if(/^(Orleans|Jefferson)$/.test(c)){
      const r=REG().find(x=>/New Orleans/.test(x.metro));
      return {factor:r?r.factor:0.96, label:'New Orleans ACF', sourced:true, src:r&&r.source, as_of:r&&r.as_of, note:''};
    }
    if(/East Baton Rouge/.test(c)){
      const r=REG().find(x=>/Baton Rouge/.test(x.metro));
      return {factor:0.93, label:'Louisiana state average ACF', sourced:false, src:r&&r.source, as_of:r&&r.as_of,
              note:'ASSUMPTION, not a published Baton Rouge figure. The Area Cost Factor table has no Baton Rouge entry; its own rule is to use the nearest listed area, and the Louisiana state average is 0.93. Change it if you have a local number.'};
    }
    return {factor:1.00, label:'US average', sourced:false, src:null, as_of:null, note:'No published factor matched this county; the national average is used until you set one.'};
  }

  /* ---------------- occupancy group for the ICC table ---------------- */
  function occFor(l, targetUnits){
    const k=String(l.kind||'').toLowerCase();
    if(/hotel|motel|lodging|sro|residential hotel/.test(k)) return {g:'R-1', name:'R-1 hotel / motel'};
    if((targetUnits||l.units||1)>=3) return {g:'R-2', name:'R-2 multi-family (3+ dwelling units)'};
    if(/office|bank|medical|dental|commercial|store|retail/.test(k)) return {g:'B', name:'B business'};
    return {g:'R-3', name:'R-3 one- and two-family'};
  }
  function bvd(occ, type){
    const v=(window.LXCOSTBASIS&&window.LXCOSTBASIS.values)||{};
    const key=occ+' '+(type||'VB');
    return v[key]!=null? v[key] : null;
  }

  /* ---------------- zoning ---------------- */
  function zoneOf(l){
    /* A district only counts as known if the record actually carries one. We do
       not infer a district from a use class — that is exactly the mistake that
       turns a screen into a false permission. */
    const code=((OV.zone&&OV.zone[l.id])||l.zoning||l.zone||'').toString().trim().toUpperCase();
    const byHand=!!(OV.zone&&OV.zone[l.id])&&!l.zoning;
    if(!code) return {known:false, code:null};
    if(/East Baton Rouge/.test(l.county||'')){
      const Z=window.LXZONE_BR;
      const d=Z&&Z.districts.find(x=>x.code.toUpperCase()===code);
      if(d) return {known:true, code, d, byHand, src:Z.code_url, as_of:Z.as_of, jur:Z.jurisdiction};
      return {known:true, code, d:null, src:Z&&Z.code_url, note:'That district is on the parcel record but not in the standards table read from the code.'};
    }
    return {known:true, code, d:null, note:'Locator.X has not read this jurisdiction’s code into a standards table yet — the district is shown as recorded, and the limits are yours to confirm.'};
  }
  function maxUnitsByZone(l){
    const z=zoneOf(l);
    const lot=dims(l).lot;
    if(!z.known || !z.d || !lot) return null;
    const den=z.d.density||{};
    if(den.value==null) return null;
    if(den.unit==='units/acre') return Math.floor(lot/43560*den.value);
    if(den.unit==='sf-lot-per-unit') return Math.floor(lot/den.value);
    return null;
  }

  /* ---------------- editable overrides ---------------- */
  const KEY='lxrebuild';
  let OV=(function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } })();
  const saveOV=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(OV)); }catch(e){} };
  const DEFS={
    soft:{v:22, l:'Soft costs %', n:'design, engineering, permits, survey, legal, insurance — on top of hard cost'},
    conting:{v:12, l:'Contingency %', n:'on hard + soft'},
    demo:{v:14, l:'Demolition $/sf', n:'interior strip-out; full structure demolition costs more'},
    site:{v:9, l:'Site work $/sf of added area', n:'utilities, drainage, paving, landscaping'},
    months:{v:11, l:'Construction months', n:'permit to certificate of occupancy'},
    carry:{v:9.5, l:'Construction loan rate %', n:'interest carried on half the budget for the build period'},
    vacancyLoss:{v:4, l:'Lost rent, months', n:'months of the existing rent given up during the work'},
    exitCap:{v:6.5, l:'Stabilised exit cap %', n:'the cap rate a buyer would pay for the finished income'}
  };
  const g=k=>OV[k]!=null? +OV[k] : DEFS[k].v;

  /* ---------------- the scenarios ---------------- */
  /* Some rolls publish no floor area or lot size at all — the East Baton Rouge
     roll is one. Rather than infer an area from an assessed value (which would
     be a guess wearing a number's clothes), the panel takes the two figures by
     hand and remembers them per parcel. Both are one click away on the
     assessor's page in the Record Locker. */
  function dims(l){
    const k=OV.dims&&OV.dims[l.id];
    return {sqft: l.sqft || (k&&k.sqft) || null,
            lot:  l.lot  || (k&&k.lot)  || null,
            entered: !l.sqft && !!(k&&k.sqft)};
  }
  function setDim(l, which, v){
    OV.dims=OV.dims||{}; OV.dims[l.id]=OV.dims[l.id]||{};
    if(v>0) OV.dims[l.id][which]=v; else delete OV.dims[l.id][which];
    saveOV();
  }
  function scenarios(l){
    const X=L(); if(!X) return [];
    const price=X.price(l)||0;
    const D0=dims(l); const sqft=D0.sqft, lot=D0.lot;
    const units=Math.max(1, l.units||1);
    const reg=regionFor(l);
    const zmax=maxUnitsByZone(l);
    const z=zoneOf(l);
    const d=(()=>{ try{ return X.deal(l); }catch(e){ return null; } })();
    const rentPerUnit = d && d.rentMo ? d.rentMo/units : null;
    const out=[];

    const cost=(hardPsf, area)=>{
      const hard=hardPsf*area*reg.factor;
      const soft=hard*g('soft')/100;
      const cont=(hard+soft)*g('conting')/100;
      const carry=(hard+soft+cont)*0.5*(g('carry')/100)*(g('months')/12);
      return {hard, soft, cont, carry, total:hard+soft+cont+carry};
    };
    const proforma=(c, addUnits, addRentPerUnit, note)=>{
      const lostRent=(d? d.rentMo:0)*g('vacancyLoss');
      const total=c.total+lostRent;
      const addRent=addUnits*(addRentPerUnit||rentPerUnit||0);
      const addNOI=addRent*12*0.62;                       // 38% opex load, the app's own default shape
      const addValue=addNOI/(g('exitCap')/100);
      return {cost:c, lostRent, total, addUnits, addRent, addNOI, addValue,
              profit:addValue-total, roc: total>0? (addValue-total)/total*100 : null, note};
    };

    /* 1. Reconfigure inside the existing envelope */
    if(sqft && sqft/Math.max(1,units) >= 1300){
      const newUnits=Math.min(Math.floor(sqft/850), zmax!=null? zmax : Math.floor(sqft/850));
      const add=Math.max(0, newUnits-units);
      if(add>0){
        const area=add*850;
        const c=cost(gutPsf(l, reg), area);
        out.push(Object.assign({
          id:'reconfig', name:'Subdivide inside the existing envelope',
          how:`The record shows ${fmtN(sqft)} sf across ${units} unit${units===1?'':'s'} — about ${fmtN(sqft/units)} sf each. Re-partitioning to roughly 850 sf units would yield ${newUnits}, adding ${add}. No new footprint, so no setback or lot-coverage question, but every new unit needs its own egress, separation, and in most codes its own parking.`,
          area, psf:gutPsf(l, reg)
        }, proforma(c, add, null, 'Interior conversion only.')));
      }
    }

    /* 2. Add a floor or a wing */
    if(lot && sqft){
      const add=Math.min(2, zmax!=null? Math.max(0, zmax-units) : 2);
      if(add>0){
        const area=add*900;
        const psf=bvd(occFor(l, units+add).g,'VB')||158;
        const c=cost(psf+g('site'), area);
        out.push(Object.assign({
          id:'addition', name:`Add ${add} unit${add===1?'':'s'} of new floor area`,
          how:`New construction of about ${fmtN(area)} sf at the ICC permit-valuation rate for ${occFor(l, units+add).name}, times the ${reg.label} of ${reg.factor}. Height, setbacks, lot coverage and parking all bind here — confirm them before you price it.`,
          area, psf:psf+g('site')
        }, proforma(c, add, null, 'New floor area.')));
      }
    }

    /* 3. Build to the zoned density */
    if(zmax!=null && zmax>units && lot){
      const add=zmax-units;
      const area=add*900;
      const psf=bvd('R-2','VB')||158;
      const c=cost(psf+g('site')+g('demo')*0.35, area);
      out.push(Object.assign({
        id:'todensity', name:`Build out to the zoned density — ${zmax} units`,
        how:`${z.code} permits ${z.d&&z.d.density.value} ${z.d&&z.d.density.unit==='units/acre'?'units per acre':'sq ft of lot per unit'} on this ${fmtN(lot)} sf lot, which is ${zmax} units against the ${units} on the record. That is the code's maximum, not an entitlement: overlays, historic designation, parking, drainage, tree and setback rules all cut into it, and the Planning Commission has the last word.`,
        area, psf:psf+g('site')
      }, proforma(c, add, null, 'To the code maximum.')));
    }

    /* 4. Hotel or SRO to apartments */
    if(/hotel|motel|sro|residential hotel|lodging/i.test(l.kind||'') && sqft){
      const newUnits=Math.max(units, Math.floor(sqft/620));
      const add=Math.max(0, newUnits-units);
      const c=cost(gutPsf(l, reg)*1.12, sqft);
      out.push(Object.assign({
        id:'hotel2apt', name:'Convert lodging to apartments',
        how:`A gut of the whole ${fmtN(sqft)} sf: kitchens where there were none, new stacks, egress and separation to residential code, and a change of occupancy from R-1 to R-2 that triggers a full code review. Priced at a gut rate plus 12% for the occupancy change.`,
        area:sqft, psf:gutPsf(l, reg)*1.12
      }, proforma(c, add, null, 'Occupancy change R-1 to R-2.')));
    }

    /* 5. Commercial to residential */
    if(/office|store|retail|commercial|bank|warehouse/i.test(l.kind||'') && sqft && (!z.d || z.d.multifamily!=='not-permitted')){
      const newUnits=Math.floor(sqft/950);
      if(newUnits>=2){
        const c=cost(gutPsf(l, reg)*1.25, sqft);
        out.push(Object.assign({
          id:'comm2res', name:'Convert commercial floor area to dwellings',
          how:`Commercial-to-residential is the most expensive conversion on this list and the most often abandoned halfway: floor plates are deep, so light and air rules bite; plumbing has to be added everywhere rather than extended; and the occupancy change pulls the whole building up to current residential code. Priced at a gut plus 25%.`,
          area:sqft, psf:gutPsf(l, reg)*1.25
        }, proforma(c, newUnits, null, 'Occupancy change to residential.')));
      }
    }

    out.forEach(s=>{ s.reg=reg; s.zone=z; s.zmax=zmax; });
    return out.sort((a,b)=>(b.profit||-1e12)-(a.profit||-1e12));
  }
  function gutPsf(l, reg){
    /* San Francisco publishes its own remodel valuation, so use the city's own
       number there rather than a national table. */
    if(l.county==='San Francisco'){
      const r=(window.LXREMODEL||[]).find(x=>/San Francisco/.test(x.metro));
      if(r&&r.low) return r.low;
    }
    const base=bvd(occFor(l).g,'VB');
    return base? base*0.72 : 150;         // a gut is a fraction of ground-up
  }

  /* ---------------- rendering ---------------- */
  function sheetHTML(l){
    const S=scenarios(l);
    const reg=regionFor(l);
    const z=zoneOf(l);
    const zmax=maxUnitsByZone(l);
    const cb=window.LXCOSTBASIS||{};
    const permit=(window.LXPERMIT||[]).find(p=>{
      const c=l.county||'';
      return (/East Baton Rouge/.test(c)&&/Baton Rouge/.test(p.jurisdiction))
          || (/Orleans|Jefferson/.test(c)&&/New Orleans/.test(p.jurisdiction))
          || (c==='San Francisco'&&/San Francisco/.test(p.jurisdiction));
    });
    return `<div class="sec" style="margin-top:12px" id="rbsec">
      <h3>Rebuild &amp; construction cost</h3>
      <div class="facts" style="margin-bottom:8px">
        <div><span>Zoning district</span><span>${z.known? '<b>'+esc(z.code)+'</b>'+(z.d?' — '+esc(z.d.name||''):'') : '<b>not on this record</b>'}</span></div>
        ${z.d? `<div><span>Multifamily</span><span>${esc({'by-right':'permitted by right','conditional':'conditional use','not-permitted':'not permitted'}[z.d.multifamily]||'not stated')}</span></div>`:''}
        ${z.d&&z.d.density.value!=null? `<div><span>Density limit</span><span>${z.d.density.value} ${esc(z.d.density.unit==='units/acre'?'units/acre':'sf of lot per unit')}</span></div>`:''}
        ${z.d&&z.d.height.feet!=null? `<div><span>Height limit</span><span>${z.d.height.feet} ft${z.d.height.stories?' / '+z.d.height.stories+' stories':''}</span></div>`:''}
        ${zmax!=null? `<div><span>Units the code allows</span><span><b>${zmax}</b> on ${fmtN(dims(l).lot)} sf (record shows ${l.units||1})</span></div>`:''}
        <div><span>Regional cost factor</span><span><b>${reg.factor.toFixed(2)}</b> — ${esc(reg.label)}${reg.sourced?'':' <span style="color:var(--warn)">(assumption)</span>'}</span></div>
      </div>
      ${(()=>{ const D0=dims(l); return (!D0.sqft||!D0.lot||!z.known)? `<div style="border:1px dashed var(--line2);border-radius:8px;padding:9px 11px;margin:0 0 10px">
        <p class="eyebrow" style="margin:0 0 6px">Fill the gaps this record does not carry</p>
        <div class="toolbar" style="gap:8px;flex-wrap:wrap">
          ${!D0.sqft? `<label style="font-size:12px">floor area sf <input type="number" id="rb_sqft" value="" placeholder="e.g. 6400" style="width:110px"></label>`:''}
          ${!D0.lot?  `<label style="font-size:12px">lot sf <input type="number" id="rb_lot" value="" placeholder="e.g. 12000" style="width:110px"></label>`:''}
          ${!z.known? `<label style="font-size:12px">zoning district <input type="text" id="rb_zone" value="" placeholder="e.g. A3.2" style="width:110px"></label>`:''}
        </div>
        <p class="chartnote" style="margin:6px 0 0">This jurisdiction's roll does not publish these, and Locator.X will not infer them from an assessed value. All three are on the assessor's and zoning pages linked in the Record Locker below; what you enter is kept in this browser against this parcel.</p>
      </div>`:''; })()}
      ${!z.known? `<p class="chartnote" style="color:var(--warn);margin:0 0 8px">This record carries no zoning district, so nothing below is checked against what is permitted here. Look the parcel up in the Record Locker below, then come back &mdash; the scenarios are priced either way, but only the code tells you which are legal.</p>`:''}
      ${z.d&&z.d.verified===false? `<p class="chartnote" style="color:var(--warn);margin:0 0 8px">The standards for district ${esc(z.code)} could not be confirmed from the code text, so its limits are shown as unknown rather than filled in.</p>`:''}
      ${reg.note? `<p class="chartnote" style="margin:0 0 8px">${esc(reg.note)}</p>`:''}
      ${S.length? S.map(s=>scenarioHTML(s)).join('') : '<p class="chartnote">No rebuild scenario fits this record — it needs a recorded floor area or lot size to price one, and this record has neither.</p>'}
      <p class="eyebrow" style="margin:14px 0 4px">Assumptions &mdash; edit these before you trust any number above</p>
      <div class="costgrid">${Object.keys(DEFS).map(k=>`<label>${esc(DEFS[k].l)}<input type="number" data-rb="${k}" value="${g(k)}" step="0.5"><span>${esc(DEFS[k].n)}</span></label>`).join('')}</div>
      <div class="toolbar" style="margin-top:6px"><button class="btn" id="rbreset">Reset to defaults</button></div>
      <div class="src">
        <b>Where the cost anchors come from.</b> Hard cost per square foot starts from the
        <a href="${esc(cb.source||'#')}" target="_blank" rel="noopener">ICC Building Valuation Data (${esc(cb.edition||'current edition')})</a>,
        the table many jurisdictions use to compute <b>permit fees</b>. It is not a contractor's bid: it carries no demolition,
        no site work, no soft costs, no financing and no regional adjustment &mdash; this module adds those separately and every one of them is editable above.
        The location multiplier is the published <a href="${esc(reg.src||'#')}" target="_blank" rel="noopener">USACE Area Cost Factor</a>${reg.as_of?' ('+esc(reg.as_of)+')':''}, normalised to a US average of 1.00.
        ${l.county==='San Francisco'? 'Remodel rates use San Francisco\\u2019s own published DBI Cost Schedule instead of the national table.':''}
        ${permit? '<br><b>Permit fees here:</b> '+esc(permit.basis)+(permit.source? ' <a href="'+esc(permit.source)+'" target="_blank" rel="noopener">source</a>':''):''}
        ${z.d? '<br><b>Zoning:</b> district standards quoted from the '+esc(z.jur||'')+' <a href="'+esc(z.src||'#')+'" target="_blank" rel="noopener">'+esc((window.LXZONE_BR&&window.LXZONE_BR.code_name)||'code')+'</a>. Overlays, historic districts and design districts add rules on top of the district table, and the Planning Commission decides any specific parcel.':''}
        <br><b>None of this is a bid.</b> Replace every figure with a contractor's number and a zoning verification before you commit money.
      </div>
    </div>`;
  }
  function scenarioHTML(s){
    const good=s.profit>0;
    return `<div style="border:1px solid var(--line);border-left:3px solid ${good?'var(--good)':'var(--bad)'};border-radius:8px;padding:10px 12px;margin:8px 0">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap">
        <b>${esc(s.name)}</b>
        <span class="num" style="font-size:15px;color:${good?'var(--good)':'var(--bad)'}"><b>${$$$(s.profit)}</b> <span style="font-size:11px;color:var(--muted)">value created less all-in cost</span></span>
      </div>
      <p style="font-size:12.5px;color:var(--ink2);margin:6px 0 8px">${esc(s.how)}</p>
      <div class="facts" style="font-size:12px">
        <div><span>Area worked</span><span>${fmtN(s.area)} sf @ ${$$$(s.psf)}/sf</span></div>
        <div><span>Hard cost</span><span>${$$$(s.cost.hard)}</span></div>
        <div><span>Soft + contingency</span><span>${$$$(s.cost.soft+s.cost.cont)}</span></div>
        <div><span>Construction carry</span><span>${$$$(s.cost.carry)}</span></div>
        <div><span>Rent given up</span><span>${$$$(s.lostRent)}</span></div>
        <div><span>All-in</span><span><b>${$$$(s.total)}</b></span></div>
        <div><span>Units added</span><span><b>+${s.addUnits}</b></span></div>
        <div><span>Added rent</span><span>${$$$(s.addRent)}/mo</span></div>
        <div><span>Value at ${g('exitCap')}% cap</span><span>${$$$(s.addValue)}</span></div>
        <div><span>Return on cost</span><span>${s.roc==null?'—':s.roc.toFixed(1)+'%'}</span></div>
      </div>
    </div>`;
  }
  function bindSheet(l){
    if(!$('#rbsec')) return;
    $$('#rbsec [data-rb]').forEach(i=>i.addEventListener('change',()=>{
      OV[i.dataset.rb]=+i.value; saveOV();
      const host=$('#rbsec'); const wrap=document.createElement('div'); wrap.innerHTML=sheetHTML(l);
      host.replaceWith(wrap.firstElementChild); bindSheet(l);
    }));
    const redraw=()=>{ const host=$('#rbsec'); const wrap=document.createElement('div'); wrap.innerHTML=sheetHTML(l); host.replaceWith(wrap.firstElementChild); bindSheet(l); };
    const sq=$('#rb_sqft'); if(sq) sq.addEventListener('change',()=>{ setDim(l,'sqft',+sq.value); redraw(); });
    const lt=$('#rb_lot');  if(lt) lt.addEventListener('change',()=>{ setDim(l,'lot',+lt.value); redraw(); });
    const zn=$('#rb_zone'); if(zn) zn.addEventListener('change',()=>{ OV.zone=OV.zone||{}; const v=(zn.value||'').trim().toUpperCase(); if(v) OV.zone[l.id]=v; else delete OV.zone[l.id]; saveOV(); redraw(); });
    const r=$('#rbreset'); if(r) r.addEventListener('click',()=>{
      OV={}; saveOV();
      const host=$('#rbsec'); const wrap=document.createElement('div'); wrap.innerHTML=sheetHTML(l);
      host.replaceWith(wrap.firstElementChild); bindSheet(l);
    });
  }

  window.LXRebuild={scenarios, sheetHTML, bindSheet, regionFor, zoneOf, maxUnitsByZone, bvd, occFor, DEFS};
})();
