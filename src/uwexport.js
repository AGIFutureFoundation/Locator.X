/* locator.x — underwriting exports: white-label template, PDF memorandum (self-contained
   PDF writer, no external libraries), and a rendered video reel using the browser's
   built-in open-source WebM encoder (canvas.captureStream + MediaRecorder). */
(function(){
'use strict';
const L=()=>window.LX, U=()=>window.LXUW;
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>Array.from(el.querySelectorAll(s));

/* ================= white-label template ================= */
const DEF_WL={org:'AGI Corp \u2014 AGI Future Foundation', tagline:'Real-asset expansion program', accent:'#1F8A4C', preparedBy:'', logo:null,
  fields:[], disclaimer:'Prepared from public county records and licensed index data by locator.x. Values marked as estimates are ZIP-level index scaling, not appraisals. This memorandum is not an offer, appraisal, legal, tax or investment advice. Verify every figure independently before acting.'};
let WL=null;
function wl(){ if(!WL){ WL=Object.assign({},DEF_WL,L().store('wl')||{}); if(!Array.isArray(WL.fields)) WL.fields=[]; } return WL; }
function saveWL(){ L().store('wl', WL); }

function panel(){
  const root=$('#wlroot'); if(!root) return;
  const w=wl(); const X=L();
  const open=root.dataset.open==='1';
  root.innerHTML=`<div class="tile" style="margin-top:14px">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap">
      <div><p class="eyebrow">Enterprise template — white label</p>
      <p style="font-size:13px;color:var(--muted);margin:2px 0 0;max-width:640px">Every exported memorandum and video reel carries this identity: your organization, mark, accent color, custom data fields and disclaimer. Settings stay in this browser; export the template as JSON to roll it out across a team.</p></div>
      <button class="btn" id="wltoggle">${open?'Close':'Customize'}</button>
    </div>
    ${open?`<div class="bbgrid" style="margin-top:12px">
      <label>Organization<input id="wl_org" value="${X.esc(w.org)}"></label>
      <label>Tagline<input id="wl_tagline" value="${X.esc(w.tagline)}"></label>
      <label>Accent color<input id="wl_accent" type="color" value="${w.accent}"></label>
      <label>Prepared by<input id="wl_preparedBy" value="${X.esc(w.preparedBy)}" placeholder="Analyst name / desk"></label>
      <label>Logo (PNG/JPG)<input id="wl_logo" type="file" accept="image/*" style="font-size:12px"></label>
      <label>Logo now<span style="font-size:12px;color:var(--muted)">${w.logo?'✓ set — exports use it':'none'}${w.logo?' · <a href="#" id="wl_logoclear">remove</a>':''}</span></label>
    </div>
    <div style="margin-top:10px"><span class="eyebrow" style="letter-spacing:.05em">Custom data fields (appear on the memo)</span>
      <div id="wlfields" style="margin-top:6px">${w.fields.map((f,i)=>`<div class="toolbar" style="gap:6px;margin-bottom:6px"><input data-k="${i}" value="${X.esc(f[0])}" placeholder="Label" style="max-width:200px"><input data-v="${i}" value="${X.esc(f[1])}" placeholder="Value" style="flex:1;max-width:380px"><button class="btn" data-del="${i}">×</button></div>`).join('')}</div>
      <button class="btn" id="wlfadd">+ Add field</button></div>
    <div style="margin-top:10px"><span class="eyebrow" style="letter-spacing:.05em">Disclaimer</span><textarea id="wl_disclaimer" style="width:100%;min-height:64px;margin-top:4px;font-size:12.5px">${X.esc(w.disclaimer)}</textarea></div>
    <div class="toolbar" style="margin-top:10px;gap:8px"><button class="btn" id="wlexp">Export template JSON</button><button class="btn" id="wlimp">Import template</button><button class="btn" id="wlreset">Reset to default</button></div>
    <div id="wlio" style="display:none;margin-top:8px"><textarea id="wliotxt" style="width:100%;min-height:90px;font-family:var(--mono);font-size:11.5px"></textarea><div class="toolbar" style="margin-top:6px"><button class="btn primary" id="wlioapply">Apply pasted template</button></div></div>`:''}
  </div>`;
  $('#wltoggle').onclick=()=>{ root.dataset.open=open?'0':'1'; panel(); };
  if(!open) return;
  ['org','tagline','accent','preparedBy'].forEach(k=>{ const el=$('#wl_'+k); el&&el.addEventListener('change',()=>{ WL[k]=el.value; saveWL(); }); });
  $('#wl_disclaimer').addEventListener('change',e=>{ WL.disclaimer=e.target.value; saveWL(); });
  const lc=$('#wl_logoclear'); if(lc) lc.addEventListener('click',e=>{ e.preventDefault(); WL.logo=null; saveWL(); panel(); });
  $('#wl_logo').addEventListener('change',e=>{
    const f=e.target.files&&e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=()=>{ const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); const s=Math.min(1,360/im.width); c.width=Math.round(im.width*s); c.height=Math.round(im.height*s); const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); g.drawImage(im,0,0,c.width,c.height); WL.logo=c.toDataURL('image/jpeg',0.85); WL.logoW=c.width; WL.logoH=c.height; saveWL(); panel(); L().toast('Logo set — exports now carry it'); }; im.src=rd.result; };
    rd.readAsDataURL(f);
  });
  $$('#wlfields [data-k]').forEach(el=>el.addEventListener('change',()=>{ WL.fields[+el.dataset.k][0]=el.value; saveWL(); }));
  $$('#wlfields [data-v]').forEach(el=>el.addEventListener('change',()=>{ WL.fields[+el.dataset.v][1]=el.value; saveWL(); }));
  $$('#wlfields [data-del]').forEach(el=>el.addEventListener('click',()=>{ WL.fields.splice(+el.dataset.del,1); saveWL(); panel(); root.dataset.open='1'; }));
  $('#wlfadd').onclick=()=>{ WL.fields.push(['','']); saveWL(); root.dataset.open='1'; panel(); };
  $('#wlreset').onclick=()=>{ WL=JSON.parse(JSON.stringify(DEF_WL)); saveWL(); root.dataset.open='1'; panel(); };
  $('#wlexp').onclick=()=>{ $('#wlio').style.display=''; $('#wliotxt').value=JSON.stringify(WL,null,1); };
  $('#wlimp').onclick=()=>{ $('#wlio').style.display=''; $('#wliotxt').value=''; $('#wliotxt').placeholder='Paste a template JSON here, then Apply.'; };
  $('#wlioapply').onclick=()=>{ try{ const o=JSON.parse($('#wliotxt').value); WL=Object.assign({},DEF_WL,o); if(!Array.isArray(WL.fields)) WL.fields=[]; saveWL(); root.dataset.open='1'; panel(); L().toast('Template applied'); }catch(e){ L().toast('Not valid template JSON'); } };
}

/* ================= minimal PDF writer ================= */
function hexRGB(h){ const m=/^#?([0-9a-f]{6})$/i.exec(h||''); if(!m) return [0.12,0.54,0.3]; const n=parseInt(m[1],16); return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255]; }
const PDFTXT=s=>String(s).replace(/[\u2014\u2013\u2212]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/\u00B7/g,'*').replace(/\u00D7/g,'x').replace(/\u2265/g,'>=').replace(/\u2264/g,'<=').replace(/\u2026/g,'...').replace(/\u2192/g,'->').replace(/\u00A0/g,' ').replace(/\u00E2\u0080[\u0093\u0094]/g,'-').replace(/\u00C3\u0097/g,'x').replace(/[^\x20-\x7E\n]/g,'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
function Doc(){
  const pages=[]; let cur=null; let jpeg=null;
  const H=792, Wd=612;
  function page(){ cur={ops:[]}; pages.push(cur); }
  function col(c,stroke){ const [r,g,b]=Array.isArray(c)?c:hexRGB(c); cur.ops.push(r.toFixed(3)+' '+g.toFixed(3)+' '+b.toFixed(3)+(stroke?' RG':' rg')); }
  function text(x,y,s,o){ o=o||{}; const size=o.size||10; col(o.color||[0.1,0.11,0.13]);
    let str=PDFTXT(s); if(o.align==='right'){ x-=str.length*size*0.5; } else if(o.align==='center'){ x-=str.length*size*0.25; }
    cur.ops.push('BT /'+(o.bold?'F2':'F1')+' '+size+' Tf 1 0 0 1 '+x.toFixed(1)+' '+(H-y).toFixed(1)+' Tm ('+str+') Tj ET'); }
  function rect(x,y,w2,h2,c){ col(c); cur.ops.push(x.toFixed(1)+' '+(H-y-h2).toFixed(1)+' '+w2.toFixed(1)+' '+h2.toFixed(1)+' re f'); }
  function line(x1,y1,x2,y2,c,w2){ col(c||[0.85,0.86,0.88],true); cur.ops.push((w2||0.7)+' w '+x1.toFixed(1)+' '+(H-y1).toFixed(1)+' m '+x2.toFixed(1)+' '+(H-y2).toFixed(1)+' l S'); }
  function image(x,y,w2,h2){ if(!jpeg) return; cur.ops.push('q '+w2.toFixed(1)+' 0 0 '+h2.toFixed(1)+' '+x.toFixed(1)+' '+(H-y-h2).toFixed(1)+' cm /Im1 Do Q'); }
  function setLogo(dataURI){ try{ const b64=dataURI.split(',')[1]; const bin=atob(b64); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); jpeg=u; }catch(e){ jpeg=null; } }
  function wrap(s,chars){ const out=[]; String(s).split('\n').forEach(ln=>{ let line2=''; ln.split(' ').forEach(w2=>{ if((line2+' '+w2).trim().length>chars){ out.push(line2.trim()); line2=w2; } else line2+=' '+w2; }); out.push(line2.trim()); }); return out; }
  function build(wlogo){
    const enc=s=>{ const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i)&255; return u; };
    const chunks=[]; const offs=[]; let pos=0;
    const push=u=>{ chunks.push(u); pos+=u.length; };
    const obj=(s)=>{ offs.push(pos); push(enc(s)); };
    push(enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
    const nPages=pages.length;
    const kids=pages.map((_,i)=>(5+(jpeg?1:0)+i*2)+' 0 R').join(' ');
    obj('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n');
    obj('2 0 obj << /Type /Pages /Kids ['+kids+'] /Count '+nPages+' >> endobj\n');
    obj('3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj\n');
    obj('4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj\n');
    if(jpeg){
      offs.push(pos);
      push(enc('5 0 obj << /Type /XObject /Subtype /Image /Width '+(wlogo&&wlogo.w||360)+' /Height '+(wlogo&&wlogo.h||120)+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >> stream\n'));
      push(jpeg); push(enc('\nendstream endobj\n'));
    }
    const base=5+(jpeg?1:0);
    pages.forEach((p,i)=>{
      const pid=base+i*2, cid=base+i*2+1;
      obj(pid+' 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>'+(jpeg?' /XObject << /Im1 5 0 R >>':'')+' >> /Contents '+cid+' 0 R >> endobj\n');
      const stream=p.ops.join('\n');
      obj(cid+' 0 obj << /Length '+stream.length+' >> stream\n'+stream+'\nendstream endobj\n');
    });
    const xref=pos;
    let x='xref\n0 '+(offs.length+1)+'\n0000000000 65535 f \n';
    offs.forEach(o=>{ x+=String(o).padStart(10,'0')+' 00000 n \n'; });
    x+='trailer << /Size '+(offs.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
    push(enc(x));
    const total=chunks.reduce((s,c)=>s+c.length,0); const out=new Uint8Array(total); let q=0;
    chunks.forEach(c=>{ out.set(c,q); q+=c.length; });
    return out;
  }
  return {page, text, rect, line, image, setLogo, wrap, build, get pageCount(){ return pages.length; }};
}

/* ================= the memorandum ================= */
function fm$(v){ return v==null?'-':(v<0?'-$':'$')+Math.abs(Math.round(v)).toLocaleString('en-US'); }
function buildMemo(l,u,uw,extra){
  const w=wl(); const X=L(); const A=hexRGB(w.accent);
  const d=Doc(); if(w.logo) d.setLogo(w.logo);
  const today=new Date().toISOString().slice(0,10);
  const foot=(n)=>{ d.line(48,752,564,752); d.text(48,766,(w.preparedBy?w.preparedBy+' * ':'')+w.org+' * '+today,{size:8,color:[0.45,0.47,0.5]}); d.text(564,766,'Page '+n,{size:8,color:[0.45,0.47,0.5],align:'right'}); };
  const head=(title)=>{ d.rect(0,0,612,64,A); d.text(48,40,w.org,{size:15,bold:true,color:[1,1,1]}); d.text(48,56,w.tagline+'  *  '+title,{size:9,color:[1,1,1]});
    if(w.logo){ const lw=Math.min(90,(w.logoW||360)/((w.logoH||120)/34)); d.image(564-lw,15,lw,34); } };
  // -------- page 1 --------
  d.page(); head('UNDERWRITING MEMORANDUM');
  d.text(48,100,l.addr+', '+l.city+', '+(l.county==='Orleans'?'LA':'CA')+' '+(l.zip||''),{size:19,bold:true});
  d.text(48,120,(l.kind||'')+((l.units||1)>1&&!/unit/i.test(l.kind||'')?' * '+l.units+' units':'')+(l.sqft?' * '+l.sqft.toLocaleString()+' sf':'')+(l.year?' * built '+l.year:'')+' * APN '+(l.apn||'-'),{size:10,color:[0.35,0.37,0.4]});
  d.text(48,136,'Recorded '+fm$(L().price(l))+(l.priceDate?' on '+l.priceDate:'')+(l.est?'  (VALUE IS AN ESTIMATE - ZIP-level index scaling)':'  (county-recorded basis)'),{size:10,color:l.est?[0.77,0.17,0.33]:[0.35,0.37,0.4]});
  d.line(48,148,564,148,A,1.4);
  // Evidence grade — what the county actually published about this parcel.
  try{
    const g=window.LXEvid&&LXEvid.grade(l);
    if(g){
      const gc = g.band==='A'?[0.05,0.51,0.26] : g.band==='B'?[0.16,0.47,0.84] : g.band==='C'?[0.85,0.44,0.05] : [0.85,0.24,0.24];
      d.rect(48,154,16,16,gc); d.text(53,166,g.band,{size:11,bold:true,color:[1,1,1]});
      d.text(70,166,'EVIDENCE '+g.band+' - '+g.label.toUpperCase()+'  ('+g.score+'/100)',{size:8.5,bold:true,color:[0.35,0.37,0.4]});
      const noun = g.missing.length? 'This source does not publish '+g.missing.map(t=>t[3]).join(', ')+'.' : 'This source publishes every field the grade tests for.';
      const ceil = g.zoningOnly? ' SELECTED BY ZONING, NOT USE - the district permits this; that is not evidence a building stands here.'
                 : g.unclassified? ' The source publishes NO USE CLASS for this parcel; it is included on location alone.' : '';
      d.wrap(noun+ceil,118).forEach((ln,i)=>{ d.text(70,178+i*10,ln,{size:7.5,color:[0.45,0.47,0.5]}); });
    }
  }catch(e){}
  // metric grid
  const mets=[['Offer price',fm$(u.offer)],['Rent (all units)',fm$(u.rentMo)+'/mo'],['NOI',fm$(uw.noi)+'/yr'],['Cash flow',fm$(uw.cfMo)+'/mo'],
    ['DSCR',uw.dscr?uw.dscr.toFixed(2):'-'],['Cash-on-cash',uw.coc!=null?uw.coc.toFixed(1)+'%':'-'],['Cap on total cost',uw.capCost.toFixed(2)+'%'],['Break-even occupancy',uw.beOcc?uw.beOcc.toFixed(0)+'%':'-'],
    ['Cash to close',fm$(uw.cash)],['5-yr IRR (sold yr 5)',uw.irr!=null?(uw.irr*100).toFixed(1)+'%':'-'],['Max offer @ target',extra.maxOffer?fm$(extra.maxOffer):'-'],['Gap vs recorded',extra.gap!=null?(extra.gap>0?'+':'')+extra.gap.toFixed(0)+'%':'-']];
  mets.forEach((m,i)=>{ const cx=48+(i%4)*130, cy=204+Math.floor(i/4)*54;
    d.rect(cx,cy,122,46,[0.965,0.97,0.975]); d.rect(cx,cy,3,46,A);
    d.text(cx+10,cy+18,m[0],{size:7.5,color:[0.45,0.47,0.5]}); d.text(cx+10,cy+36,m[1],{size:13,bold:true}); });
  // income vs outflow bars
  d.text(48,382,'WHERE THE RENT GOES (ANNUAL)',{size:9,bold:true,color:[0.35,0.37,0.4]});
  const bars=[['Gross rent',uw.rent,A],['Vacancy',-uw.vac,[0.85,0.44,0.05]],['Operating costs',-uw.opex,[0.85,0.44,0.05]],['Debt service',-uw.ds,[0.55,0.35,0.75]],['Cash flow',uw.cf,uw.cf>=0?[0.12,0.54,0.3]:[0.77,0.17,0.33]]];
  const bmax=Math.max(uw.rent,1);
  bars.forEach((b,i)=>{ const by=378+i*24; const bw=Math.abs(b[1])/bmax*330;
    d.text(150,by+11,b[0],{size:9,align:'right'}); d.rect(160,by,Math.max(2,bw),14,b[2]);
    d.text(166+bw,by+11,fm$(Math.abs(b[1]))+(b[1]<0?' out':''),{size:9,color:[0.3,0.32,0.35]}); });
  // financing structure
  d.text(48,520,'FINANCING - '+(u.finOpt.name||'').toUpperCase(),{size:9,bold:true,color:[0.35,0.37,0.4]});
  d.text(48,538,u.finOpt.down+'% down at ~'+u.finOpt.rate.toFixed(2)+'%  *  loan '+fm$(uw.loan)+'  *  annual debt service '+fm$(uw.ds)+(u.finOpt.mi?'  *  incl. MIP':''),{size:10});
  if(u.rehab>0) d.text(48,556,'Rehab budget '+fm$(uw.rehabAll)+' (incl. '+u.cont+'% contingency)  *  after-repair value '+fm$(uw.arv),{size:10});
  // custom fields
  if(w.fields.length){ d.text(48,586,'PROGRAM DATA',{size:9,bold:true,color:[0.35,0.37,0.4]});
    w.fields.filter(f=>f[0]).slice(0,8).forEach((f,i)=>{ const fy=604+i*17; d.text(48,fy,f[0]+':',{size:9.5,bold:true}); d.text(200,fy,String(f[1]||''),{size:9.5}); }); }
  foot(1);
  // -------- page 2: sensitivity + statement --------
  d.page(); head('SENSITIVITY & OPERATING DETAIL');
  d.text(48,100,'MONTHLY CASH FLOW - OFFER vs RATE',{size:9,bold:true,color:[0.35,0.37,0.4]});
  const rates=[u.finOpt.rate-1,u.finOpt.rate-0.5,u.finOpt.rate,u.finOpt.rate+0.5,u.finOpt.rate+1];
  const offers=[0.85,0.9,0.95,1,1.05].map(k=>Math.round(u.offer*k/1000)*1000);
  d.text(120,120,'',{size:8});
  rates.forEach((r,j)=>d.text(190+j*76,120,r.toFixed(2)+'%',{size:8.5,bold:true,align:'center'}));
  offers.forEach((of,i)=>{ const ry=134+i*24; d.text(160,ry+12,fm$(of)+(of===u.offer?' <':''),{size:8.5,align:'right'});
    rates.forEach((rt,j)=>{ const t=U().underwrite(l,Object.assign({},u,{offer:of,finOpt:Object.assign({},u.finOpt,{rate:rt})}));
      const good=t.cfMo>0; d.rect(166+j*76,ry,70,20,good?[0.85,0.94,0.88]:[0.98,0.88,0.9]);
      d.text(201+j*76,ry+13,(t.cfMo>0?'+':'')+Math.round(t.cfMo),{size:8.5,align:'center',color:good?[0.08,0.4,0.22]:[0.6,0.12,0.25]}); }); });
  d.text(48,300,'ANNUAL OPERATING STATEMENT',{size:9,bold:true,color:[0.35,0.37,0.4]});
  const rows2=[['Gross scheduled rent ('+fm$(u.rentMo)+'/mo)',uw.rent],['Vacancy',-uw.vac],['Property tax',-uw.tax],['Insurance',-uw.ins],['Maintenance + capital reserve',-(uw.maint+uw.capex)]];
  if(uw.mgmt) rows2.push(['Management',-uw.mgmt]); if(uw.hoa) rows2.push(['HOA',-uw.hoa]); if(uw.util) rows2.push(['Owner-paid utilities',-uw.util]);
  rows2.push(['NET OPERATING INCOME',uw.noi],['Debt service',-uw.ds],['CASH FLOW',uw.cf]);
  rows2.forEach((r2,i)=>{ const ry=318+i*19; const tot=/NET|CASH/.test(r2[0]);
    if(tot) d.line(48,ry-4,400,ry-4);
    d.text(48,ry+10,r2[0],{size:9.5,bold:tot}); d.text(400,ry+10,(r2[1]<0?'-':'')+fm$(Math.abs(r2[1])).slice(0,14),{size:9.5,bold:tot,align:'right',color:tot&&r2[1]<0?[0.77,0.17,0.33]:tot?[0.08,0.4,0.22]:[0.1,0.11,0.13]}); });
  let yy=318+rows2.length*19+22;
  if(extra.applied&&extra.applied.length){
    d.text(48,yy,'DEVELOPMENT & CONVERSION PLAYS APPLIED',{size:9,bold:true,color:[0.35,0.37,0.4]}); yy+=18;
    extra.applied.forEach(o=>{ d.text(48,yy,'* '+o.name+' - cost '+fm$(o.capex)+(o.addRent?', adds '+fm$(o.addRent)+'/mo rent':'')+', adds value '+fm$(o.addValue),{size:9.5}); yy+=16; });
    yy+=6;
  }
  // below-market assessment
  try{
    const bm=window.LXBM&&window.LXBM.assess(l);
    if(bm){
      d.text(48,yy,'BELOW-MARKET ASSESSMENT',{size:9,bold:true,color:[0.35,0.37,0.4]});
      d.text(400,yy,'index '+bm.idx+' / 100',{size:11,bold:true,align:'right',color:A}); yy+=16;
      bm.parts.forEach(p=>{
        d.rect(48,yy-9,3,13, p.strong? [0.12,0.54,0.3] : [0.72,0.74,0.77]);
        d.text(56,yy,p.label,{size:9.5,bold:true}); yy+=13;
        d.wrap(p.sub,104).forEach(ln=>{ d.text(56,yy,ln,{size:8.5,color:[0.45,0.47,0.5]}); yy+=11; });
        yy+=3;
      });
      if(!bm.hard){ d.wrap('No transaction or comparable price-per-square-foot evidence supports this one - only the assessed basis, which under Prop 13 reflects how long the owner has held, not what the property is worth. Treat it as a lead, not a discount.',104).forEach(ln=>{ d.text(48,yy,ln,{size:8.5,color:[0.77,0.17,0.33]}); yy+=11; }); }
      yy+=8;
    }
    const up=window.LXBM&&window.LXBM.upgrades(l);
    if(up&&up.best&&up.best.length){
      d.text(48,yy,'UPGRADE OPTIONS THAT CLOSE THE GAP',{size:9,bold:true,color:[0.35,0.37,0.4]});
      d.text(400,yy,fm$(up.unlocked)+' combined upside',{size:10,bold:true,align:'right',color:[0.08,0.4,0.22]}); yy+=16;
      up.best.forEach(o=>{ d.text(48,yy,'* '+o.name+' - '+fm$(o.capex)+' cost'+(o.addRent?', +'+fm$(o.addRent)+'/mo rent':'')+', '+fm$(o.addValue)+' added value, ~'+o.months+' mo',{size:9.5}); yy+=14; });
      yy+=8;
    }
  }catch(e){}
  // Comparable recorded sales — or a plain statement of why there are none.
  try{
    const c=window.LXComps&&LXComps.find(l);
    if(c){
      if(yy>640){ foot(2); d.page(); head('UNDERWRITING MEMORANDUM'); yy=100; }
      d.text(48,yy,'COMPARABLE SALES',{size:9,bold:true,color:[0.35,0.37,0.4]});
      if(c.enough){
        d.text(400,yy,c.n+' dated '+(c.basis==='sale'?'sales':'post-sale assessments'),{size:10,bold:true,align:'right',color:A}); yy+=16;
        const rng=(o)=> o.n>=3? fm$(Math.round(o.lo))+' - '+fm$(Math.round(o.hi))+'   (median '+fm$(Math.round(o.med))+', n='+o.n+')' : 'too few to state';
        d.text(48,yy,'Per unit:   '+rng(c.ppu),{size:9.5}); yy+=13;
        d.text(48,yy,'Per sq ft:  '+rng(c.ppsf),{size:9.5}); yy+=13;
        d.text(48,yy,'Within '+c.km.toFixed(1)+' km, sold '+c.from+' to '+c.to+', same class and comparable size.',{size:8.5,color:[0.45,0.47,0.5]}); yy+=12;
        const basisNote = c.basis==='sale'
          ? 'Interquartile range, not an average - the spread is the information. Every figure is a recorded transaction with a known date; no assessor value is included. Portfolio deeds, where a county writes one complex sale price onto every parcel in it, are detected and excluded.'
          : 'This market publishes no recorded sale prices. These are POST-SALE ASSESSED VALUES: in California a transfer resets the assessed basis to the purchase price, which tracks the deal closely but is an assessment, not the deed. The two bases are never averaged together.';
        d.wrap(basisNote,116).forEach(ln=>{ d.text(48,yy,ln,{size:8,color:[0.45,0.47,0.5]}); yy+=10; });
        if(c.dropU||c.dropS){ d.wrap((c.dropU+c.dropS)+' ratios fell outside a plausible band and were discarded - several counties publish a complex-level unit count on every row of a development, and unit counts derived from a class description are band lower bounds.',116).forEach(ln=>{ d.text(48,yy,ln,{size:8,color:[0.45,0.47,0.5]}); yy+=10; }); }
      } else {
        yy+=16;
        d.wrap('NO DEFENSIBLE COMPARABLE SET. '+(c.why||''),112).forEach(ln=>{ d.text(48,yy,ln,{size:9},0); yy+=12.5; });
        d.wrap('A comparable here is a recorded sale carrying a recorded date. An assessor value is not one, and a sale price whose year is unknown is not one either. This asset is unpriced by comparables and must be underwritten on its income alone.',116).forEach(ln=>{ d.text(48,yy,ln,{size:8,color:[0.45,0.47,0.5]}); yy+=10; });
      }
      yy+=10;
    }
  }catch(e){}
  d.text(48,yy,'RENT BASIS',{size:9,bold:true,color:[0.35,0.37,0.4]}); yy+=16;
  d.wrap((u.analysis&&u.analysis.d.rentHow)||'ZIP-level rent index estimate - verify with local property-manager comps.',100).forEach(ln=>{ d.text(48,yy,ln,{size:9.5}); yy+=14; });
  foot(2);
  // -------- page 3: offer terms + disclaimer --------
  d.page(); head('DRAFT OFFER TERMS');
  let y3=100;
  d.wrap(extra.draft||'',100).forEach(ln=>{ if(y3>700) return; d.text(48,y3,ln,{size:9.5,bold:/^[A-Z ]{6,}/.test(ln)}); y3+=14.5; });
  y3=Math.min(700,y3+10); d.line(48,y3,564,y3,A,1); y3+=16;
  d.wrap('DISCLAIMER - '+w.disclaimer,108).forEach(ln=>{ d.text(48,y3,ln,{size:8,color:[0.45,0.47,0.5]}); y3+=11.5; });
  foot(3);
  // -------- page 4: what could not be verified --------
  // The section that makes the rest of the document defensible. Everything above
  // rests on what a county chose to publish; this says exactly where that stops.
  d.page(); head('WHAT COULD NOT BE VERIFIED');
  let y4=100;
  d.wrap('Every figure in this memorandum rests on what a public source actually published. This page states where that evidence stops. It is not boilerplate: each line below was determined from this specific record and this specific county.',112)
    .forEach(ln=>{ d.text(48,y4,ln,{size:9.5}); y4+=14; });
  y4+=8;
  const gaps=[];
  try{
    const g=window.LXEvid&&LXEvid.grade(l);
    if(g){
      g.missing.forEach(t=>gaps.push([t[3].replace(/^a /,'').toUpperCase(), 'Not published by this source. '+t[4]]));
      if(g.zoningOnly) gaps.push(['USE CLASS','This record was selected by ZONING, not by use. The district permits the stated use; nothing in the public record says a building of that kind stands on the parcel. Treat it as an option on a use, not as income inventory.']);
      if(g.unclassified) gaps.push(['USE CLASS','This source publishes no use classification of any kind for this parcel. It is included on location alone and was deliberately not guessed.']);
    }
  }catch(e){}
  try{
    const c=window.LXComps&&LXComps.find(l);
    if(c&&!c.enough) gaps.push(['COMPARABLE SALES', (c.why||'No defensible comparable set could be assembled.')]);
    else if(c&&c.basis==='postsale') gaps.push(['SALE PRICES','This market publishes no recorded sale prices. The comparable range shown is built from post-sale assessed values, which track a transfer closely in California but are an assessment and not the deed.']);
  }catch(e){}
  try{ if(l.est) gaps.push(['PRICE','The price shown is a ZIP-level index ESTIMATE, used only because this county publishes no assessed values. It is not a figure anyone has paid or assessed for this parcel.']); }catch(e){}
  try{ if(l.saleUndated) gaps.push(['SALE DATE','This record carries a sale price with no recorded date. A price whose year is unknown cannot be used as a comparable and is excluded from every range in this memorandum.']); }catch(e){}
  try{ if(!l.year) gaps.push(['AGE','No year built. Condition, code path, rent-regulation exposure and conversion feasibility all turn on it, so each of those is unassessed here.']); }catch(e){}
  try{ if(l.approx) gaps.push(['LOCATION','The coordinate is approximate - a ZIP centroid rather than a parcel point. Any distance, walkability or campus figure in this memorandum inherits that error.']); }catch(e){}
  if(!gaps.length) gaps.push(['NONE FOUND','Every field this desk tests for is published for this parcel. That is a statement about the completeness of the county record, not a warranty about the property.']);
  gaps.forEach(g=>{
    if(y4>700) return;
    d.rect(48,y4-9,3,13,[0.85,0.44,0.05]);
    d.text(56,y4,g[0],{size:9.5,bold:true}); y4+=13;
    d.wrap(g[1],108).forEach(ln=>{ if(y4>716) return; d.text(56,y4,ln,{size:8.5,color:[0.45,0.47,0.5]}); y4+=11; });
    y4+=4;
  });
  if(y4<700){
    y4=Math.min(700,y4+6); d.line(48,y4,564,y4,A,1); y4+=14;
    d.wrap('None of the above is a judgement about the property. A parcel with a thin public record can be an excellent purchase; it simply means more of the diligence falls to you. Verify on the ground before relying on anything here.',112)
      .forEach(ln=>{ if(y4>740) return; d.text(48,y4,ln,{size:8.5,color:[0.45,0.47,0.5]}); y4+=11; });
  }
  foot(4);
  return d.build({w:WL&&WL.logoW||360,h:WL&&WL.logoH||120});
}
async function deliver(filename, data, kind){
  try{
    if(window.claude&&window.claude.use){
      const dl=await window.claude.use('downloads');
      if(dl){ try{ await dl.save({filename, data}); L().toast(kind+' saved.'); return true; }
        catch(e){ if(e&&e.code==='declined') return false; if(e&&e.code==='rate_limited'){ L().toast('A save prompt is already open - answer it first.'); return false; } } }
    }
  }catch(e){}
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(data instanceof Blob? data : new Blob([data])); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); L().toast(kind+' downloaded.'); return true; }
  catch(e){ L().toast('This viewer blocks saves.'); return false; }
}
async function exportPDF(l,u,uw,extra){
  const bytes=buildMemo(l,u,uw,extra);
  const name=('underwriting-'+(l.addr||'property').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)+'.pdf');
  await deliver(name, bytes.buffer, 'Memorandum PDF');
}

/* ================= video reel ================= */
function ease(t){ return t<0?0:t>1?1:t*t*(3-2*t); }
async function exportReel(l,u,uw,extra,onProg){
  const w=wl(); const X=L(); const A=w.accent;
  const cv=document.createElement('canvas'); cv.width=1280; cv.height=720; const g=cv.getContext('2d');
  let mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m));
  if(!mime){ X.toast('This browser cannot record video.'); return; }
  const stream=cv.captureStream(30); const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5e6});
  const chunks=[]; rec.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  const done=new Promise(res=>{ rec.onstop=res; });
  let logoImg=null; if(w.logo){ logoImg=new Image(); logoImg.src=w.logo; await new Promise(r=>{ logoImg.onload=r; logoImg.onerror=()=>{logoImg=null;r();}; }); }
  const DUR=22; const t0=performance.now(); rec.start(200);
  const money=v=>(v<0?'-$':'$')+Math.abs(Math.round(v)).toLocaleString('en-US');
  function frame(){
    const t=(performance.now()-t0)/1000;
    g.fillStyle='#0e1116'; g.fillRect(0,0,1280,720);
    g.textAlign='left';
    if(t<4.5){ // title
      const p=ease(t/1.2);
      g.fillStyle=A; g.fillRect(0,640,1280*p,10);
      g.globalAlpha=p; g.fillStyle='#fff'; g.font='700 54px system-ui'; g.fillText(w.org,80,180);
      g.fillStyle='#9aa3ad'; g.font='400 26px system-ui'; g.fillText(w.tagline,80,222);
      if(logoImg){ const lw=Math.min(220,logoImg.width); g.drawImage(logoImg,1280-80-lw,110,lw,lw*logoImg.height/logoImg.width); }
      const p2=ease((t-1.2)/1.2);
      if(p2>0){ g.globalAlpha=p2; g.fillStyle='#fff'; g.font='700 40px system-ui'; g.fillText(l.addr+', '+l.city,80,330);
        g.fillStyle='#9aa3ad'; g.font='400 24px system-ui'; g.fillText((l.kind||'')+((l.units||1)>1&&!/unit/i.test(l.kind||'')?' * '+l.units+' units':'')+(l.sqft?' * '+l.sqft.toLocaleString()+' sf':''),80,368);
        g.fillText('Recorded '+money(X.price(l))+(l.est?'  (estimate)':''),80,402); }
      g.globalAlpha=1;
    } else if(t<10){ // metrics count-up
      g.fillStyle=A; g.fillRect(0,0,10,720);
      g.fillStyle='#9aa3ad'; g.font='600 22px system-ui'; g.fillText('THE NUMBERS - '+(u.finOpt.name||'').toUpperCase(),80,90);
      const p=ease((t-4.5)/2.2);
      const M2=[['Cash flow / month',uw.cfMo,money],['DSCR',uw.dscr||0,v=>v.toFixed(2)],['Cash-on-cash',uw.coc||0,v=>v.toFixed(1)+'%'],['5-yr IRR',(uw.irr||0)*100,v=>v.toFixed(1)+'%'],['NOI / year',uw.noi,money],['Cash to close',uw.cash,money]];
      M2.forEach((m,i)=>{ const cx=80+(i%3)*400, cy=180+Math.floor(i/3)*220;
        g.fillStyle='#1a212b'; g.fillRect(cx,cy,360,160); g.fillStyle=A; g.fillRect(cx,cy,6,160);
        g.fillStyle='#9aa3ad'; g.font='400 20px system-ui'; g.fillText(m[0],cx+28,cy+44);
        g.fillStyle=(i===0&&uw.cfMo<0)?'#e5484d':'#fff'; g.font='700 46px system-ui'; g.fillText(m[2](m[1]*p),cx+28,cy+110); });
    } else if(t<16){ // income waterfall bars
      g.fillStyle='#9aa3ad'; g.font='600 22px system-ui'; g.fillText('WHERE THE RENT GOES (ANNUAL)',80,90);
      const bars=[['Gross rent',uw.rent,A],['Vacancy',-uw.vac,'#d96f0e'],['Operating costs',-uw.opex,'#d96f0e'],['Debt service',-uw.ds,'#8b5cf6'],['Cash flow',uw.cf,uw.cf>=0?'#30a46c':'#e5484d']];
      const bmax=Math.max(uw.rent,1); const p=ease((t-10)/1.6);
      bars.forEach((b,i)=>{ const by=160+i*100; const bw=Math.abs(b[1])/bmax*820*p;
        g.fillStyle='#9aa3ad'; g.font='400 24px system-ui'; g.textAlign='right'; g.fillText(b[0],300,by+40); g.textAlign='left';
        g.fillStyle=b[2]; g.fillRect(320,by,Math.max(3,bw),56);
        g.fillStyle='#fff'; g.font='600 24px system-ui'; g.fillText(money(Math.abs(b[1]))+(b[1]<0?' out':''),336+bw,by+38); });
    } else { // outro
      const p=ease((t-16)/1.2);
      g.globalAlpha=p; g.fillStyle=A; g.fillRect(0,340,1280,8);
      g.fillStyle='#fff'; g.font='700 44px system-ui'; g.fillText(extra.maxOffer? 'Max offer at target: '+money(extra.maxOffer) : 'Underwritten at '+money(u.offer),80,300);
      if(extra.gap!=null){ g.fillStyle=extra.gap>=0?'#30a46c':'#d96f0e'; g.font='600 30px system-ui'; g.fillText((extra.gap>0?'+':'')+extra.gap.toFixed(0)+'% vs recorded price',80,410); }
      g.fillStyle='#9aa3ad'; g.font='400 22px system-ui'; g.fillText(w.org+(w.preparedBy?' * '+w.preparedBy:''),80,560);
      g.font='400 15px system-ui'; g.fillText('From public records and index data. Estimates labeled. Not an appraisal or investment advice.',80,600);
      g.globalAlpha=1;
    }
    if(onProg) onProg(Math.min(1,t/DUR));
    if(t<DUR) requestAnimationFrame(frame); else rec.stop();
  }
  requestAnimationFrame(frame);
  await done;
  const ext=mime.startsWith('video/mp4')?'mp4':'webm';
  const blob=new Blob(chunks,{type:mime});
  const name='underwriting-reel-'+(l.addr||'property').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)+'.'+ext;
  await deliver(name, blob, 'Video reel');
}
window.LXUWX={panel, exportPDF, exportReel, wl};
})();
