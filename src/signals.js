/* locator.x — Cross-signals: ten researched forces outside the rent roll that move
   prices and future listings. Live public data where it exists (permits, STR licenses,
   HUD federal REO), research summaries with named sources where it doesn't. Sept 2026. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const L=()=>window.LX;
const SIG=()=>((L().BA||{}).signals)||{};
const gapOf=(l,mk)=> (!l.est && mk && mk.zhvi && l.price) ? Math.max(0, Math.min(1, (mk.zhvi*(l.units>1?l.units*0.62:1) - l.price)/(mk.zhvi*(l.units>1?l.units*0.62:1)) )) : null;

const SIGNALS=[
{id:'estate', name:'Estate & probate pipeline', tag:'computed on records',
 body:`The "silver tsunami" is real but slow: analysts now call it a <i>frozen</i> tsunami — boomer homes transfer to heirs gradually, and many are kept or rented rather than sold (HousingWire, NAHB, Cotality 2026). The tradable edge is local: a property whose <b>assessed basis sits far below its ZIP's typical value</b> has, under Prop 13, almost certainly been held for decades — precisely the stock most likely to surface through estates, trusts and probate over the next decade. Probate and trust sales often trade at a discount, favor as-is cash-friendly buyers, and never hit the MLS polish cycle.`,
 how:'Signal = how far the recorded assessed basis sits below the ZIP typical value, boosted for owner-occupied exemptions and pre-1975 construction. High signal = long-tenure stock; build relationships before it lists.',
 score(r){ const g=gapOf(r.l, r.d.mk); if(g==null) return null; let s=g*100; if(r.l.ownerOcc) s*=1.15; if(r.l.year&&r.l.year<1975) s*=1.1; return Math.min(100,Math.round(s)); },
 note(r){ const g=gapOf(r.l, r.d.mk); return g==null?'':('basis '+Math.round(g*100)+'% below ZIP typical'+(r.l.ownerOcc?' · owner-occupied':'')+(r.l.year&&r.l.year<1975?' · built '+r.l.year:'')); },
 src:'HousingWire · NAHB · Cotality / WORLD PROPERTY JOURNAL (2026)'},
{id:'lock', name:'Rate lock-in thaw (future listings)', tag:'computed on records',
 body:`Owners who bought 2015–2021 hold mortgages near 3–4% and have been refusing to trade them away — the lock-in effect that starved inventory. It is now easing: by spring 2026, <b>one in three sellers was giving up a sub-5% rate to list</b> (Coldwell Banker 2026 Home Shopping Season Report), and forecasters expect 2026 to be the year the 2–3% cohort finally moves. Every additional rate dip releases a tranche of these owners.`,
 how:'Signal = recorded purchase in the 2015–2021 cheap-money window (they hold the rates worth keeping). High signal = the properties most likely to LIST when rates ease — your future-listing watchlist, straight from the recorder.',
 score(r){ const d=r.l.priceDate; if(!d||r.l.est) return null; const y=+d.slice(0,4); if(y>=2015&&y<=2021) return 85; if(y>=2012&&y<=2014) return 60; if(y<=2011) return 40; return 12; },
 note(r){ const d=r.l.priceDate; return d? ('bought '+d.slice(0,4)+(+d.slice(0,4)>=2015&&+d.slice(0,4)<=2021?' — cheap-money cohort':'')) : ''; },
 src:'Coldwell Banker 2026 report · HousingWire (2026)'},
{id:'corp', name:'Corporate & employment shocks', tag:'research + exposure map',
 body:`WARN filings put <b>1,270 confirmed Bay Area cuts January–May 2026</b> (of ~25,700 announced company-wide): Amazon led with 769 local cuts at 525 Market St and 188 Spear St downtown, Meta's Reality Labs cut 272 in Burlingame, and SF city government noticed 127 — every employer framing it as AI-driven restructuring (SF Bay Area Times WARN tracker; CA EDD). Employment shocks land on housing with a lag: sublease space first, then rent softness, then listings from relocating owners. The same force runs in reverse around AI hiring hubs.`,
 how:'Signal = exposure of the listing\'s ZIP to shock-prone employment: SF downtown/SoMa office core highest, Burlingame and big-campus South Bay elevated. Watch these ZIPs\' rent series in the motion chart before believing their pro formas.',
 score(r){ const z=r.l.zip; if(['94103','94104','94105','94107','94108','94111','94158'].includes(z)) return 80; if(['94010','94043','94089','95054','95014','94025'].includes(z)) return 60; if(r.l.county==='San Francisco') return 40; if(['Santa Clara','San Mateo'].includes(r.l.county)) return 35; return 20; },
 note(r){ const z=r.l.zip; return ['94103','94104','94105','94107','94108','94111','94158'].includes(z)?'SF office-core exposure':['94010'].includes(z)?'Burlingame — Reality Labs cuts':''; },
 src:'CA EDD WARN · SF Bay Area Times layoffs tracker (2026)'},
{id:'ins', name:'Insurance stress', tag:'research + risk map',
 body:`California's insurer of last resort keeps swelling and just got pricier: the <b>FAIR Plan raised homeowner rates 29.1% for fall 2026</b> (KQED), on top of State Farm's approved 17% increase and its projection of shedding up to a million CA policies over five years. Where private coverage retreats — wildland edges, hills, older multifamily with knob-and-tube — carrying costs jump and buyer pools shrink; the Lost Coast and hills stock feels it first. Louisiana runs its own version of the same crisis on wind and flood.`,
 how:'Signal = insurance-stress exposure: very high for remote wildland (Shelter Cove), high for hills ZIPs and all of Orleans Parish (wind/flood), elevated for pre-1950 multifamily anywhere. The insurance line in your underwriting deserves a stress test at +30%.',
 score(r){ const z=r.l.zip; if(r.l.county==='Humboldt') return 90; if(r.l.county==='Orleans') return 75; if(['94611','94618','94705','94708','94530'].includes(z)) return 65; let s=25; if(r.l.year&&r.l.year<1950&&(r.l.units||1)>1) s+=20; return s; },
 note(r){ return r.l.county==='Humboldt'?'wildland-urban interface':r.l.county==='Orleans'?'wind/flood market':''; },
 src:'KQED (FAIR Plan +29.1%) · CA DOI / State Farm filings (2025–26)'},
{id:'fc2', name:'Foreclosure pipeline', tag:'LIVE public data (New Orleans) + eviction proxy (SF)',
 body:`The hardest distress records public data offers. <b>Orleans Parish:</b> the Civil Sheriff's lien-foreclosure sale docket is published open-data — 1,771 cases, <b>441 with sales pending</b> right now — and every case in this build is matched to the catalog by address. <b>San Francisco:</b> recorder NOD filings are not open data, so the closest live public proxy is wired instead: rent-board eviction notices by ZIP for the trailing 24 months, including the <b>non-payment and late-payment</b> counts — the leading edge of owner cash-flow stress. A building whose tenants stop paying is a building whose owner starts missing mortgage payments.`,
 how:'New Orleans: address-matched live sheriff-sale cases (pending sale scores highest). SF: the ZIP\'s non-payment + late-payment eviction rate. This same data feeds the new 11th scoring modality, so distress now moves every Locator X score directly.',
 score(r){ const dd=window.LXDash&&LXDash.distressOf? LXDash.distressOf(r.l):null; if(!dd) return null; if(r.l.county==='Orleans'){ return dd.hard? dd.s : null; } const S=window.LXSIG2||{}; if(S.ev&&S.ev[r.l.zip]){ return Math.round(dd.s); } return null; },
 note(r){ const dd=window.LXDash&&LXDash.distressOf? LXDash.distressOf(r.l):null; return dd? dd.v:''; },
 src:'Orleans Civil Sheriff lien foreclosures (data.nola.gov d52w-8nva) · SF Rent Board eviction notices (DataSF 5cei-gny5), pulled 2026-09-02'},
{id:'blight', name:'Code enforcement & blight docket', tag:'LIVE public data (New Orleans)',
 body:`New Orleans publishes every open code-enforcement case — <b>14,647 open cases</b> in this pull, from first inspection through hearing to demolition review. An open case is documented distress: deferred maintenance, an absent owner, or a stalled project, with the city\'s own file as your inspection head start. Cases deep in the pipeline (hearing and judgment stages) sit one step from the adjudication auctions. Every open case in this build is matched to the catalog by address; equivalent Bay feeds (SF DBI complaints, Oakland code cases) are documented in the research library for the next data pass.`,
 how:'Address-matched open cases score by how deep the case sits in the enforcement pipeline — later stage, higher signal. Pair with the estate and vacancy signals: a stage-4+ case on a long-hold absentee parcel is the strongest pre-listing combination this dataset can produce.',
 score(r){ if(r.l.county!=='Orleans') return null; const S=window.LXSIG2||{}; const k=window.LXDash&&LXDash.anorm? LXDash.anorm(r.l.addr):null; const v=k&&S.code&&S.code[k]; return v? Math.min(100, 40+v*8) : null; },
 note(r){ const S=window.LXSIG2||{}; const k=window.LXDash&&LXDash.anorm? LXDash.anorm(r.l.addr):null; const v=k&&S.code&&S.code[k]; return v? ('open case — stage '+v) : ''; },
 src:'City of New Orleans Code Enforcement all cases (data.nola.gov u6yx-v2tw), pulled 2026-09-02'},
{id:'perm', name:'Permit momentum', tag:'LIVE public data',
 body:`Building permits are the market voting with capital. The 12-month issued-permit tape by ZIP (San Francisco: DataSF; New Orleans: one-year counts by district) shows where owners are reinvesting — permit-heavy ZIPs tend to lead on value recovery, and a permit-quiet ZIP with rising rents is a value-add hunting ground. SF ZIP leaders this window include the Mission (94110, 1,884 permits) and the Sunset (94122, 1,364).`,
 how:'Signal = the listing ZIP\'s permit count percentile in the live table (SF), or its district\'s one-year permit count (New Orleans). No permit feed is wired for the other counties yet — treat those as unmeasured, not zero.',
 score(r){ const S=SIG(); if(S.sfPermits && S.sfPermits[r.l.zip]){ const n=S.sfPermits[r.l.zip][0]; return Math.min(100, Math.round(n/1900*100)); }
   if(S.nolaPermits && r.l.nb){ const k=(r.l.nb||'').replace('Near ',''); const n=S.nolaPermits[k]; if(n!=null) return Math.min(100, Math.round(n/900*100)); }
   return null; },
 note(r){ const S=SIG(); if(S.sfPermits && S.sfPermits[r.l.zip]) return S.sfPermits[r.l.zip][0].toLocaleString()+' permits / 12 mo · $'+Math.round(S.sfPermits[r.l.zip][1]/1e6)+'M est. cost'; if(S.nolaPermits){ const n=S.nolaPermits[(r.l.nb||'').replace('Near ','')]; if(n!=null) return n+' district permits / yr'; } return ''; },
 src:'DataSF Building Permits (live pull) · data.nola.gov permits (live pull)'},
{id:'str', name:'Short-term-rental regime', tag:'LIVE licenses + rules',
 body:`STR rules now decide income ceilings block by block. <b>New Orleans</b>: one residential permit per city square, owner-occupancy with homestead exemption, a lottery when squares are oversubscribed, and outright bans in the French Quarter and Historic Garden District; ~4,197 licenses are active citywide (data.nola.gov, live). <b>San Francisco</b>: registered primary residences only, 90 un-hosted nights a year. Where permits are scarce, an EXISTING license carries real transferable-business value; where they're banned, underwrite long-term only.`,
 how:'Signal = STR income headroom under the local regime: the app\'s short-term income method already applies these regulatory discounts. In New Orleans the live license density near the record shows where the lottery is already saturated.',
 score(r){ const S=SIG(); if(S.strZip && r.l.zip && S.strZip[r.l.zip]){ const n=S.strZip[r.l.zip][0]; return Math.min(100, Math.round(n/600*100)); }
   const c=(r.l.city||'').toLowerCase(); if(c==='new orleans') return /FrenchQuarter|GardenDistrict/.test(r.l.nb||'')?5:45; if(c==='san francisco') return 30; return null; },
 note(r){ const S=SIG(); if(S.strZip && S.strZip[r.l.zip]) return S.strZip[r.l.zip][0]+' active licenses in ZIP ('+S.strZip[r.l.zip][1]+' commercial)'; return ''; },
 src:'data.nola.gov Active STR Licenses (live pull) · Hostaway/City of New Orleans rules (2026)'},
{id:'fedreo', name:'Federal REO inventory (HUD FHA)', tag:'LIVE public data (HUD)',
 body:`HUD publishes its own foreclosed inventory as open data: every FHA-insured mortgage that finished foreclosure and passed to HUD becomes an "REO" case on a public ArcGIS feed — case number and address only, zero owner names, refreshed as the pipeline moves. It is the cleanest free federal distress source there is, and it is genuinely small nationwide (5,513 live US cases at this build's pull, 2026-09-07) — but address-matched, county by county, against every metro this platform covers, it lands <b>149 verified cases across 100+ ZIPs</b>: the Bay Area, greater New Orleans and Baton Rouge, and 13 of the 15 US Growth Corridor metros (Phoenix, Columbus, Milwaukee-Racine, Lake Charles, Shreveport-Bossier, Albany, Indianapolis, Hammond, Lafayette LA, Savannah, Syracuse, Reno and South Bend all have real hits; Greensboro-High Point and Ruston returned none in this pull). Where a case lands, it is not a comp or a signal by proxy — it is a government-owned, currently-for-sale distressed property, verified address by address against this build's coverage, never by city-name matching.`,
 how:'Signal = the listing ZIP currently carries at least one live HUD-REO case, scaled by how many. This is a sparse, mostly-binary flag rather than a graded score — treat any hit as worth a direct look, and treat the absence of a hit as "unmeasured" for that ZIP, not "clean": HUD REO is one narrow slice (FHA loans only) of all foreclosure activity, and a metro with zero hits here (Greensboro-High Point, Ruston) simply has no FHA REO right now, not zero distress.',
 score(r){ const S=window.LXSIG2||{}; if(!S.reo||!S.reo.zip) return null; const n=S.reo.zip[r.l.zip]; if(!n) return null; return Math.min(90, 45+n*15); },
 note(r){ const S=window.LXSIG2||{}; if(!S.reo||!S.reo.zip) return ''; const n=S.reo.zip[r.l.zip]; if(!n) return ''; const ex=(S.reo.ex||[]).filter(e=>e[3]===r.l.zip)[0]; return n+' active HUD-REO case'+(n>1?'s':'')+' in ZIP'+(ex?' — e.g. '+ex[1]+', '+ex[2]:''); },
 src:'HUD FHA Single Family REO Properties For Sale (egis.hud.gov ArcGIS, live pull 2026-09-07)'},
{id:'fmr', name:'Section 8 / FMR spread', tag:'HUD FY2026',
 body:`HUD's FY2026 Fair Market Rents set what a voucher pays: SF metro 2BR <b>$3,604</b>, San Jose metro <b>$3,483</b>, Oakland metro <b>$2,912</b> (New Orleans and Humboldt run near ~$1,350, approximate). California landlords cannot refuse vouchers (source-of-income protection). Where the FMR sits at or above achievable market rent — common in softer submarkets — a voucher tenancy is a rent FLOOR with government-backed payment: one of the most under-used income stabilizers in the toolkit.`,
 how:'Signal = FMR for the record\'s bedroom count vs. its modeled market rent. Positive spread = voucher tenancy pays as much or more than market with lower collection risk. Switch the income method to "Section 8 (HUD FMR)" to underwrite the whole catalog on it.',
 score(r){ const X=L(); const t={'San Francisco':3604,'San Mateo':3604,'Santa Clara':3483,'Alameda':2912,'Orleans':1350,'Humboldt':1350}[r.l.county]; if(!t||!r.d.rentMo) return null;
   const per=r.d.rentMo/Math.max(1,r.l.units||1); const spread=(t-per)/per; return Math.max(0, Math.min(100, Math.round(50+spread*120))); },
 note(r){ const t={'San Francisco':3604,'San Mateo':3604,'Santa Clara':3483,'Alameda':2912,'Orleans':1350,'Humboldt':1350}[r.l.county]; if(!t||!r.d.rentMo) return ''; const per=Math.round(r.d.rentMo/Math.max(1,r.l.units||1)); return 'FMR 2BR $'+t.toLocaleString()+' vs ~$'+per.toLocaleString()+'/unit market'; },
 src:'HUD FY2026 FMR (huduser.gov) · CA source-of-income law'}
];

function coverageChart(scoredBySig, total){
  const P=window.LXPal;
  const rowsSorted=SIGNALS.map(sg=>({sg, n:(scoredBySig[sg.id]||[]).length})).sort((a,b)=>b.n-a.n);
  const rh=24, gap=4, pl=176, pr=54, W=760, H=rowsSorted.length*(rh+gap)-gap+8;
  const maxN=Math.max(1, ...rowsSorted.map(r=>r.n));
  const xw=v=>Math.round((W-pl-pr)*v/maxN);
  let bars='';
  rowsSorted.forEach((r,i)=>{
    const y=i*(rh+gap);
    const pct=total? r.n/total*100 : 0;
    const bw=Math.max(r.n>0?3:0, xw(r.n));
    const col=P? P.seq(maxN? r.n/maxN : 0) : 'var(--seq3)';
    const live=/LIVE/.test(r.sg.tag);
    bars+=`<g class="covrow" data-sig="${r.sg.id}" style="cursor:pointer">
      <rect x="0" y="${y}" width="${W-pl-pr}" height="${rh}" transform="translate(${pl},0)" fill="var(--line2)" opacity="0.35" rx="4"/>
      <rect x="0" y="${y}" width="${bw}" height="${rh}" transform="translate(${pl},0)" fill="${col}" rx="4"><title>${r.sg.name}: ${r.n.toLocaleString()} of ${total.toLocaleString()} records (${pct.toFixed(1)}%) — ${live?'live public data':'computed from county rolls'}</title></rect>
      <text x="${pl-10}" y="${y+rh/2+4}" text-anchor="end" font-size="12" fill="var(--ink2)">${live?'●&#8202;':''}${r.sg.name.length>24?r.sg.name.slice(0,23)+'…':r.sg.name}</text>
      <text x="${pl+bw+8}" y="${y+rh/2+4}" font-size="11.5" font-family="var(--mono)" fill="var(--muted)">${r.n? pct.toFixed(pct<1?2:1)+'%':'—'}</text>
    </g>`;
  });
  return `<div class="chart" style="margin-bottom:14px">
    <div class="eyebrow">Signal coverage — this view</div>
    <h3 style="margin:2px 0 4px">How much of ${total.toLocaleString()} matched records each signal actually touches</h3>
    <p class="chartnote">Bar length = share of records with a real score from that signal, darkest = highest coverage. <b style="color:var(--good)">●</b> marks a live public-data feed; the rest score every record from what the county rolls already reveal. A short bar is not a weak signal — HUD federal REO is a small, real, high-value hit rate by design (see its card below). Click a bar to jump to that signal's detail.</p>
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;margin-top:6px">${bars}</svg>
  </div>`;
}
/* Scoring all ten signals against every analyzed row was measured at
   0.8-1.8s on the larger editions (up to 354,000 rows × 10 signals), and it
   ran again in full on every single revisit to the Scout tab even though the
   underlying rows had not changed. Dashboard's rows array is only ever
   replaced (never mutated) when its own signature actually changes — see
   dashboard.js's compute() — so its reference is a free, correct cache key. */
let _scoredCache={rowsRef:null, val:null};
function render(){
  const root=$('#sigroot'); if(!root || !window.LXDash) return;
  const X=L(); const rows=LXDash.rows; if(!rows.length) return;
  let scoredBySig;
  if(_scoredCache.rowsRef===rows){ scoredBySig=_scoredCache.val; }
  else{
    scoredBySig={};
    SIGNALS.forEach(sg=>{ try{ scoredBySig[sg.id]=rows.map(r=>({r, s:sg.score(r)})).filter(x=>x.s!=null).sort((a,b)=>b.s-a.s); }catch(e){ scoredBySig[sg.id]=[]; } });
    _scoredCache={rowsRef:rows, val:scoredBySig};
  }
  root.innerHTML=`<p class="lede" style="margin-top:0">Ten cross-signals researched Sept 2026 — forces outside the rent roll that move prices and future listings. Five run on live public data pulled into this build (lien foreclosures, code-enforcement cases, permits, STR licenses, federal HUD-REO inventory); the rest score every record from what the county rolls already reveal. Click any property to open it.</p>
  ${coverageChart(scoredBySig, rows.length)}
  <div class="grid2">${SIGNALS.map(sg=>{
    const top=(scoredBySig[sg.id]||[]).slice(0,6);
    return `<div class="chart" id="sig-${sg.id}"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><div class="eyebrow">Cross-signal</div><span class="chip" style="font-size:10px">${sg.tag}</span></div>
    <h3 style="margin:2px 0 6px">${sg.name}</h3>
    <p style="font-size:13px;color:var(--ink2);margin:0 0 8px">${sg.body}</p>
    <p class="src" style="margin:0 0 8px"><b>How Locator X reads it:</b> ${sg.how}</p>
    ${top.length?`<div style="border-top:1px solid var(--line);padding-top:6px">${top.map(x=>`<div class="row" data-id="${x.r.l.id}" style="display:flex;gap:8px;align-items:baseline;cursor:pointer;padding:3px 0;font-size:12px"><b style="font-family:var(--mono);color:var(--accent);flex:none">${x.s}</b><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${X.esc(x.r.l.addr)}, ${X.esc(x.r.l.city)}</span><span style="color:var(--muted);flex:none;font-size:11px">${X.esc(sg.note(x.r)||'')}</span></div>`).join('')}</div>`:'<p style="font-size:12px;color:var(--muted);border-top:1px solid var(--line);padding-top:6px;margin:0">No records score on this signal in the current view.</p>'}
    <p class="src" style="margin-top:6px">Sources: ${sg.src}</p></div>`; }).join('')}</div>`;
  root.querySelectorAll('[data-id]').forEach(el=>el.addEventListener('click',()=>X.select(el.dataset.id,true)));
  root.querySelectorAll('[data-sig]').forEach(el=>el.addEventListener('click',()=>{
    const t=document.getElementById('sig-'+el.dataset.sig); if(t) t.scrollIntoView({behavior:'smooth', block:'center'});
  }));
}
function docs(){ const strip=s=>String(s).replace(/<[^>]+>/g,''); return SIGNALS.map(sg=>({id:sg.id, t:sg.name, s:'Cross-signal · '+strip(sg.src), text:strip(sg.body)+' '+strip(sg.how)})); }
window.LXSig={render, SIGNALS, docs};
})();
