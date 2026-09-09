/* ===== Locator.X — US growth corridors ====================================
   Five metros outside the current footprint where very large announced
   industrial projects imply demand for rental housing, cross-tabbed against
   what those metros are actually permitting.

   THE PREDICTIVE SIGNAL HERE IS ONE RATIO, and it is worth being precise about
   what it is. Announced direct jobs divided by housing units permitted in the
   trailing twelve months is a crude measure of how much new demand is arriving
   per unit of new supply. Both halves are published figures with sources on the
   row. Neither half is a forecast, and the ratio is not one either:

     * An announced job is not a filled job. Intel's Ohio fabs have slipped at
       least five years. Micron's first Clay fab is a 2030 story. Announcements
       are downsized, delayed and cancelled, and this app says so on every row.
     * A permit is not a delivered unit, and a metro-wide permit count says
       nothing about where in the metro the units land.
     * Household formation per job is not 1.0 — it varies by wage level, by how
       many hires relocate, and by how many already live in the metro.
   So read the ratio as a way to RANK five markets against each other on the
   same published basis, and never as a number of households.
   ========================================================================= */
(function(){
  const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const P=()=>window.LXPal;
  const D=()=>window.LXCORRIDORS||{metros:[],dropped:[],caveats:[]};
  const fmtN=n=>n==null?'—':Math.round(n).toLocaleString();
  const cap=n=>n==null?'not disclosed':(n>=1e9?'$'+(n/1e9).toFixed(n>=1e10?0:1)+'B':n>=1e6?'$'+(n/1e6).toFixed(0)+'M':'$'+fmtN(n));

  function rows(){
    return D().metros.map((m,i)=>{
      const pressure = (m.jobs!=null && m.permits) ? m.jobs/m.permits : null;
      const perCap   = (m.jobs!=null && m.pop) ? m.jobs/m.pop*1e5 : null;
      const capPerJob= (m.capital!=null && m.jobs) ? m.capital/m.jobs : null;
      return {m, i, pressure, perCap, capPerJob};
    });
  }

  /* ---- a small horizontal bar chart, drawn as SVG so it prints ---- */
  function bars(list, val, fmt, title, note, dataNote){
    const have=list.filter(r=>val(r)!=null);
    if(!have.length) return `<div class="chart" data-panel data-panel-title="${esc(title)}"><div class="eyebrow">${esc(title)}</div><p class="chartnote">No metro in this set has both figures published, so this comparison is not drawn rather than drawn with gaps.</p></div>`;
    const max=Math.max(...have.map(val));
    const W=560, rowH=30, pl=176, pr=86, H=list.length*rowH+16;
    const svg=[`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="${esc(title)}">`];
    list.forEach((r,i)=>{
      const y=8+i*rowH, v=val(r);
      const col=P()? P().c((r.i%8)+1) : '#888';
      svg.push(`<text x="${pl-8}" y="${y+rowH/2+1}" text-anchor="end" font-size="11.5" fill="var(--ink)">${esc(r.m.metro.split(',')[0])}</text>`);
      if(v==null){
        svg.push(`<text x="${pl+4}" y="${y+rowH/2+1}" font-size="11" fill="var(--muted)" font-style="italic">not published &mdash; left blank rather than estimated</text>`);
      } else {
        const w=Math.max(2,(v/max)*(W-pl-pr));
        svg.push(`<rect x="${pl}" y="${y+5}" width="${w.toFixed(1)}" height="${rowH-14}" rx="4" fill="${col}"><title>${esc(r.m.metro)} — ${esc(fmt(v))}</title></rect>`);
        svg.push(`<text x="${(pl+w+6).toFixed(1)}" y="${y+rowH/2+1}" font-size="11.5" font-family="var(--mono)" fill="var(--ink2)">${esc(fmt(v))}</text>`);
      }
    });
    svg.push('</svg>');
    return `<div class="chart" data-panel data-panel-title="${esc(title)}">
      <div class="eyebrow">${esc(title)}</div>
      <p class="chartnote" style="margin:2px 0 6px">${note}</p>
      ${svg.join('')}
      ${dataNote? `<p class="src">${dataNote}</p>`:''}
    </div>`;
  }

  function render(){
    const host=$('#corridorroot'); if(!host) return;
    const d=D(), R=rows();
    if(!d.metros.length){ host.innerHTML='<p class="chartnote">No corridor data loaded in this edition.</p>'; return; }
    const totJobs=d.metros.reduce((a,m)=>a+(m.jobs||0),0);
    const totCap=d.metros.reduce((a,m)=>a+(m.capital||0),0);
    const nProj=d.metros.reduce((a,m)=>a+((m.projects&&m.projects.length)||0),0);

    host.innerHTML=`
    <div class="cards" style="margin:0 0 12px">
      ${tile('Corridors', d.metros.length, (d.metros.filter(m=>m.kind==='live').length)+' live in this build, the rest staged with their endpoints confirmed')}
      ${tile('Announced jobs', fmtN(totJobs), 'direct jobs as announced &mdash; not filled jobs')}
      ${tile('Announced capital', cap(totCap), 'where a figure was disclosed')}
      ${tile('Projects', nProj, 'every one carries a fetched source link')}
    </div>

    ${bars(R, r=>r.pressure, v=>v.toFixed(2)+' jobs / permit',
      'Housing pressure — announced jobs per unit permitted (12 months)',
      'The closest thing here to a predictive signal, and the most abused kind of number, so read the panel note above it. Above 1.0 means more announced jobs arriving than housing units permitted in a year.',
      'Jobs from company and state announcements; permits are trailing-twelve-month sums of Census Building Permits Survey monthly observations. Two metros have no published permit series in this set and are left blank rather than filled in.')}

    ${bars(R, r=>r.perCap, v=>v.toFixed(0)+' per 100k',
      'Announced jobs per 100,000 residents',
      'Scale relative to the metro that has to absorb it. A large number in a small metro moves a rental market far more than the same number in a large one.',
      'Population from the most recent published metro estimate; source on each row of the table below.')}

    ${bars(R, r=>r.capPerJob, v=>'$'+(v/1e6).toFixed(1)+'M / job',
      'Capital per announced job',
      'A sanity check on the jobs number, and a warning. Semiconductor fabs and data centres are enormously capital-intensive and employ far fewer people per dollar than an assembly plant &mdash; so a headline capital figure tells you very little about housing demand. This is why capital and jobs are never combined into one score here.',
      'Only metros that disclosed both figures appear.')}

    <div class="tablewrap" data-panel data-panel-title="The five corridors"><table class="grid"><thead><tr>
      <th>Metro</th><th>Status</th><th class="r">Announced jobs</th><th class="r">Students</th><th class="r">Capital</th><th class="r">Population</th><th class="r">Permits, 12&nbsp;mo</th><th class="r">Jobs / permit</th><th>Parcel data</th>
    </tr></thead><tbody>
    ${R.map(r=>{ const m=r.m; return `<tr>
      <td><b>${esc(m.metro)}</b><div style="font-size:11px;color:var(--muted)">${((m.projects&&m.projects.length)||0)} project${((m.projects&&m.projects.length)||0)===1?"":"s"}</div></td>
      <td style="font-size:11px">${m.kind==='live'?'<span class="badge good">in this build</span>':m.kind==='studied'?'<span class="badge bad">researched, not pulled</span>':'<span class="badge warn">staged</span>'}<div style="color:var(--muted)">${esc((m.counties||[]).join(', '))}</div></td>
      <td class="r"><b>${fmtN(m.jobs)}</b></td>
      <td class="r">${(m.campuses&&m.campuses.length)? '<b>'+fmtN(m.campuses.reduce((a2,c)=>a2+(c.enrollment||0),0))+'</b><div style="font-size:10px;color:var(--muted)">'+m.campuses.length+' campus'+(m.campuses.length===1?'':'es')+'</div>' : '—'}</td>
      <td class="r">${cap(m.capital)}</td>
      <td class="r">${m.pop?fmtN(m.pop):'—'}${m.popSrc?` <a href="${esc(m.popSrc)}" target="_blank" rel="noopener" style="font-size:10px">src</a>`:''}</td>
      <td class="r">${m.permits?fmtN(m.permits):'<span style="color:var(--muted)">not published</span>'}${m.permitsSrc?` <a href="${esc(m.permitsSrc)}" target="_blank" rel="noopener" style="font-size:10px">src</a>`:''}</td>
      <td class="r">${r.pressure!=null?'<b>'+r.pressure.toFixed(2)+'</b>':'—'}</td>
      <td style="font-size:11.5px">${(m.parcel||{}).available?'<span class="badge good">reachable</span>':'<span class="badge bad">none</span>'}<div style="color:var(--muted);font-size:10.5px;max-width:260px">${esc(((m.parcel||{}).note||(m.parcel||{}).verdict||'').slice(0,170))}</div></td>
    </tr>`; }).join('')}
    </tbody></table></div>
    ${(()=>{ const st=d.metros.filter(m=>m.kind==='studied'); if(!st.length) return '';
      return `<p class="src" style="border-left:3px solid var(--bad);padding-left:9px"><b>${st.length} corridor${st.length===1?' was':'s were'} researched and deliberately not pulled.</b>
      ${st.map(m=>esc(m.metro.split(',')[0])).join(', ')} carry verified enrolment, capital and permit figures here but hold no parcels on the map.
      The reason is a schema, not an effort: this platform will not classify a property without a use code or a published zoning key, and only one of them has one.
      Thibodaux, for instance, has two working 56,000-feature layers with assessed value on 90% of rows and <b>no use, class or zoning field of any kind</b> &mdash;
      every property in it would have to be classified by guessing, which is the one thing this app does not do. The finding is kept so the week is not spent twice.</p>`; })()}

    <h3 class="h2" style="font-size:17px;margin:16px 0 6px">The projects behind the ranking</h3>
    <div class="tablewrap" data-panel data-panel-title="Announced projects in the corridors"><table class="grid"><thead><tr>
      <th>Metro</th><th>Company</th><th>Project</th><th>Where</th><th class="r">Capital</th><th class="r">Jobs</th><th>Announced</th><th>Status</th><th></th>
    </tr></thead><tbody>
    ${d.metros.flatMap(m=>(m.projects||[]).map(p=>`<tr>
      <td style="font-size:11.5px">${esc(m.metro.split(',')[0])}</td>
      <td><b>${esc(p.company)}</b></td>
      <td style="font-size:11.5px;max-width:300px">${esc(p.project||'')}</td>
      <td style="font-size:11.5px">${esc(p.city||'')}</td>
      <td class="r">${cap(p.investment)}</td>
      <td class="r">${p.jobs?fmtN(p.jobs):'<span style="color:var(--muted)">not disclosed</span>'}</td>
      <td style="font-size:11.5px">${esc(p.announced||'—')}</td>
      <td style="font-size:11px;color:var(--ink2);max-width:230px">${esc(p.status||'')}</td>
      <td>${p.url?`<a href="${esc(p.url)}" target="_blank" rel="noopener" style="font-size:11px">source</a>`:'—'}</td>
    </tr>`)).join('')}
    </tbody></table></div>

    ${d.dropped&&d.dropped.length? `<h3 class="h2" style="font-size:17px;margin:16px 0 6px">Considered and not taken forward</h3>
    <p class="chartnote" style="margin:0 0 8px">Shown because a metro missing from a list is information too &mdash; and because three of these were dropped for a reason that has nothing to do with their prospects.</p>
    <div class="tablewrap"><table class="grid"><thead><tr><th>Metro</th><th class="r">Announced jobs</th><th>Parcel data</th><th>Why not</th></tr></thead><tbody>
    ${d.dropped.map(x=>`<tr><td>${esc(x.metro)}</td><td class="r">${fmtN(x.jobs)}</td><td>${x.parcel?'<span class="badge good">reachable</span>':'<span class="badge bad">none</span>'}</td><td style="font-size:11.5px;color:var(--ink2)">${esc(x.why||'')}</td></tr>`).join('')}
    </tbody></table></div>`:''}

    ${d.caveats&&d.caveats.length? `<h3 class="h2" style="font-size:17px;margin:16px 0 6px">What you must know before using any of this</h3>
    <ul style="font-size:12.5px;line-height:1.6;color:var(--ink2);max-width:88ch">${d.caveats.map(c=>`<li style="margin:5px 0">${esc(c)}</li>`).join('')}</ul>`:''}

    <p class="src">Researched ${esc(d.as_of||'')}. Every capital and jobs figure was taken from a source that was fetched, and where a source stated no number the field is blank rather than estimated. An announced project is an intention: it can be delayed, downsized or cancelled, and several in this table already have been. Nothing here is a recommendation to buy in any of these markets.</p>`;
    if(window.LXPanels) setTimeout(()=>LXPanels.scan('corridors'),140);
  }
  function tile(k,v,note){ return `<div class="tile"><p class="eyebrow" style="margin:0">${esc(k)}</p><p class="big num" style="margin:4px 0 2px">${v}</p><p style="font-size:11.5px;color:var(--muted);margin:0">${note}</p></div>`; }

  window.LXCorridor={render, rows};
})();
