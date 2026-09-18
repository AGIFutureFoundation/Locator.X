/* ===== Locator.X — reconstruction & 3D =====================================
   Takes everything the public record actually says about a property, states
   plainly where each fact came from, and from that builds a schematic massing
   model that can be drawn in 3D — on its own and in the context of its block.

   WHAT THIS IS NOT. It is not a photograph, a survey, a rendering of the real
   building, or a claim about what the building looks like. Every surface here
   is drawn from rules applied to recorded attributes: unit count, floor area,
   lot size, year built, use class, region. Where the record is silent the
   model fills in with a regional convention and says so, field by field, in
   the provenance column. A 1920 New Orleans double with no floor area on the
   roll is drawn as a 1920 New Orleans double because that is what the roll
   implies — not because anyone has looked at it. Go look at it: the Record
   Locker on the same drawer opens the aerials, the panorama and the permit
   file for exactly that purpose.
   ========================================================================= */
(function(){
  const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmtN=n=>n==null?'—':Math.round(n).toLocaleString();
  const LA_COUNTIES=/^(Orleans|Jefferson|East Baton Rouge)$/;

  /* stable per-property pseudo-random so a building looks the same every time */
  function hash(s){ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0); }
  function rngOf(seed){ let x=seed||1; return ()=>{ x^=x<<13; x^=x>>>17; x^=x<<5; x>>>=0; return x/4294967296; }; }

  /* ---------------------------------------------------------------- extract */
  const P={REC:'recorded', DER:'derived', SCH:'schematic'};
  function extract(l){
    const X=window.LX, f=[];
    const add=(k,v,p,note)=>f.push({k, v, p, note});
    const LA=LA_COUNTIES.test(l.county||'');
    add('Address', l.addr||'—', P.REC, 'as carried on the parcel or roll record');
    add('City / county', (l.city||'—')+' · '+(l.county||'—'), P.REC);
    add('ZIP', l.zip||'—', l.zip? P.REC : P.DER, l.zip? '' : 'not on the record');
    add('Parcel / assessment no.', l.apn||'—', P.REC, 'the key that opens every other record');
    add('Coordinates', (+l.lat).toFixed(5)+', '+(+l.lng).toFixed(5), l.approx? P.DER : P.REC, l.approx? 'ZIP centroid — the record carried no geometry' : 'parcel centroid from the county cadastre');
    add('Use class', l.kind||'—', P.REC, 'the jurisdiction’s own class description, not our label');
    add('Units on record', l.units||'—', l.units? P.REC : P.DER);
    add('Floor area', l.sqft? fmtN(l.sqft)+' sf' : 'not published', l.sqft? P.REC : P.DER);
    add('Lot area', l.lot? fmtN(l.lot)+' sf' : 'not published', l.lot? P.REC : P.DER);
    add('Year built', l.year||'not published', l.year? P.REC : P.DER);
    add('Stories', l.stories||'not published', l.stories? P.REC : P.DER);
    add('Zoning', l.zoning||'not published', l.zoning? P.REC : P.DER);
    if(l.fz) add('Flood zone', l.fz, P.REC, 'from the parcel file — the effective FIRM panel governs, check FEMA');
    /* comps.js names this app's own strongest fact type: an actual recorded
       transaction (l.sale + l.saleDate), distinct from the assessed value
       every record carries. This panel used to omit it entirely — the same
       gap geoexport.js had (#110) — while labelling the weaker field below
       "Sale recorded" and "what the buyer paid", which overclaims what a
       reassessment date means: under Prop 13 a transfer usually resets the
       assessed basis, but new construction, partial transfers and exclusions
       reset it too, with no sale at all (comps.js's own basisOf() caveat). */
    if(l.sale!=null && l.saleDate) add('Sale price', '$'+fmtN(l.sale), P.REC, 'a recorded transaction — this record’s strongest fact');
    if(l.saleDate) add('Sale recorded', l.saleDate, P.REC);
    add('Value on record', l.price? ('$'+fmtN(l.price)) : '—', P.REC,
        l.est? 'ZIP-index ESTIMATE — this jurisdiction publishes no assessed value'
        : LA_COUNTIES.test(l.county) && l.county==='East Baton Rouge' ? 'assessor’s fair market value; this roll carries no sale date'
        : l.priceDate? 'assessed value — the reassessment date below is not necessarily a sale' : 'assessed value');
    if(l.priceDate) add('Assessed', l.priceDate, P.REC);
    if(l.land!=null) add('Land / improvement split', '$'+fmtN(l.land)+' / $'+fmtN(l.imp||0), P.REC, 'the assessor’s allocation');
    if(l.adj) add('Adjudicated', 'yes — taken by the parish for unpaid taxes', P.REC, 'a distress record, not a discount');
    add('Source', l.src||'—', P.REC);
    return f;
  }

  /* ---------------------------------------------------------------- massing */
  const KINDRE=(l,re)=>re.test(String(l.kind||'').toLowerCase());
  function classOf(l){
    const k=String(l.kind||'').toLowerCase();
    if(/land only|vacant|lot\b|acreage/.test(k)) return 'land';
    if(/hotel|motel|lodging|sro|residential hotel|rooming/.test(k)) return 'hotel';
    if(/apartment|apt|25–59|13–24|5–12|60\+/.test(k)) return 'apartment';
    if(/duplex|triplex|fourplex|multi|plex|double|2 units|3 units|4 units/.test(k)) return 'small-multi';
    if(/industrial|warehouse|storage|mini-warehouse/.test(k)) return 'industrial';
    if(/office|bank|medical|dental/.test(k)) return 'office';
    if(/store|shopping|commercial|restaurant|retail|service station|auto|parking/.test(k)) return 'retail';
    if(/condo/.test(k)) return 'condo';
    return 'house';
  }
  const FLOORH={house:10, 'small-multi':10, apartment:10, condo:10, hotel:10.5, office:12.5, retail:14, industrial:18, land:0};

  function massing(l){
    const cls=classOf(l);
    const LA=LA_COUNTIES.test(l.county||'');
    const yr=l.year||null;
    const units=Math.max(1, +l.units||1);
    const rnd=rngOf(hash(l.id||l.apn||l.addr));
    const prov={};

    /* floors */
    let floors, fp=P.DER;
    if(l.stories){ floors=Math.max(1,Math.round(l.stories)); fp=P.REC; }
    else if(cls==='land'){ floors=0; fp=P.REC; }
    else if(cls==='apartment') floors = units>=60?6 : units>=25?4 : units>=13?3 : 2;
    else if(cls==='hotel') floors = units>=40?5 : units>=15?3 : 2;
    else if(cls==='office') floors = 2;
    else if(cls==='industrial'||cls==='retail') floors = 1;
    else if(cls==='small-multi') floors = LA? 1 : 2;             // LA doubles are side-by-side; Bay plexes stack
    else floors = (l.sqft&&l.sqft>2200)? 2 : (LA? 1 : (rnd()<0.45?2:1));
    prov.floors=fp;

    /* footprint */
    let foot, fpp=P.DER;
    if(l.sqft && floors>0) foot=l.sqft/floors;
    else if(cls==='land') foot=0;
    else { const per = LA? 950 : 850; foot = units*per/Math.max(1,floors); fpp=P.SCH; }
    if(l.lot) foot=Math.min(foot, l.lot*0.62);
    prov.footprint = l.sqft? fpp : P.SCH;

    /* plan aspect: New Orleans and Baton Rouge shotguns and doubles are deep
       and narrow on the lot; ranches and commercial boxes are wide. */
    let aspect;
    if(cls==='land') aspect=1.4;
    else if(LA && (cls==='house'||cls==='small-multi') && (!yr || yr<1945)) aspect=0.36;   // narrow street frontage
    else if(cls==='house') aspect = yr && yr>=1945 && yr<1980 ? 1.7 : 1.0;
    else if(cls==='small-multi') aspect=0.75;
    else if(cls==='apartment'||cls==='hotel') aspect=1.5;
    else if(cls==='retail'||cls==='office') aspect=1.35;
    else aspect=1.25;
    const W=Math.sqrt(Math.max(200,foot)*aspect), D=Math.max(200,foot)/Math.max(1,W);
    const H=floors*(FLOORH[cls]||10);

    /* roof */
    let roof;
    if(cls==='land') roof='none';
    else if(cls==='apartment'&&floors>=3) roof='flat';
    else if(cls==='hotel'||cls==='office'||cls==='industrial'||cls==='retail') roof='flat';
    else if(!LA && yr && yr<1930 && (l.city==='San Francisco')) roof='flat';   // parapeted SF flats
    else if(LA && yr && yr<1945) roof='gable';
    else if(yr && yr>=1945 && yr<1980) roof='hip';
    else roof = rnd()<0.55?'gable':'hip';
    if(cls==='industrial') roof='flat';

    /* facade material */
    let mat;
    if(cls==='land') mat='none';
    else if(cls==='industrial') mat='metal';
    else if(cls==='office') mat = (yr&&yr>=1980)?'glass':'masonry';
    else if(cls==='retail') mat = (yr&&yr<1950)?'brick':'stucco';
    else if(cls==='hotel') mat = LA? 'brick' : 'masonry';
    else if(cls==='apartment') mat = LA? 'brick' : 'stucco';
    else if(LA) mat = (!yr||yr<1945)? 'clapboard' : (yr<1985? 'brick':'clapboard');
    else if(l.city==='San Francisco') mat='stucco';
    else mat = (yr&&yr<1940)? 'shingle' : 'stucco';

    const porch = LA && (cls==='house'||cls==='small-multi') && (!yr || yr<1960);
    return {cls, LA, yr, units, floors, foot, W, D, H, roof, mat, porch, prov,
            floorH:FLOORH[cls]||10, seed:hash(l.id||l.apn||l.addr)};
  }

  /* ------------------------------------------------------- procedural texture
     Small tiles drawn once per (material, colour) and reused. These are
     schematic surfaces — brick coursing, board lap, stucco tooth — not
     photographs of any building. */
  const TXC={};
  function palette(m, seed){
    const r=rngOf(seed);
    const pick=a=>a[Math.floor(r()*a.length)];
    switch(m){
      case 'brick':     return pick(['#8c4b3a','#9d5a44','#7d4436','#a86a52','#6f3d31']);
      case 'clapboard': return pick(['#e6e2d6','#d8dfd6','#e9dcc9','#cfd8dd','#efe9dd','#d9c9b4','#c8d3c8']);
      case 'shingle':   return pick(['#8a7a63','#7d7566','#96856d','#6f6a5c']);
      case 'stucco':    return pick(['#e8e2d8','#ded6c8','#e5dcd2','#d4cec2','#efe6d9','#cfd3cf']);
      case 'masonry':   return pick(['#b9b2a4','#a9a294','#c4beb0','#9d978a']);
      case 'metal':     return pick(['#9aa3a8','#8d969c','#a7b0b4']);
      case 'glass':     return pick(['#5f7f92','#547588','#6b8b9c']);
      default:          return '#c9c4b8';
    }
  }
  function shade(hex, f){
    const n=parseInt(hex.slice(1),16);
    const r=Math.max(0,Math.min(255,Math.round(((n>>16)&255)*f)));
    const g=Math.max(0,Math.min(255,Math.round(((n>>8)&255)*f)));
    const b=Math.max(0,Math.min(255,Math.round((n&255)*f)));
    return 'rgb('+r+','+g+','+b+')';
  }
  function texture(m, col, seed){
    const key=m+'|'+col+'|'+(seed&255);
    if(TXC[key]) return TXC[key];
    const S=128, c=document.createElement('canvas'); c.width=c.height=S;
    const g=c.getContext('2d'); const r=rngOf(seed||1);
    g.fillStyle=col; g.fillRect(0,0,S,S);
    const noise=(a)=>{ for(let i=0;i<1400;i++){ g.fillStyle='rgba(0,0,0,'+(r()*a).toFixed(3)+')'; g.fillRect(r()*S, r()*S, 1, 1); }
                       for(let i=0;i<900;i++){ g.fillStyle='rgba(255,255,255,'+(r()*a).toFixed(3)+')'; g.fillRect(r()*S, r()*S, 1, 1); } };
    if(m==='brick'){
      const bh=S/10, bw=S/5;
      for(let row=0;row<10;row++){
        const off=(row%2)?bw/2:0;
        for(let cx=-1;cx<6;cx++){
          const x=cx*bw+off, y=row*bh;
          g.fillStyle=shade(col, 0.86+r()*0.28); g.fillRect(x+1, y+1, bw-2, bh-2);
        }
      }
      g.strokeStyle='rgba(240,238,232,.55)'; g.lineWidth=1.2;
      for(let row=0;row<=10;row++){ g.beginPath(); g.moveTo(0,row*bh); g.lineTo(S,row*bh); g.stroke(); }
      noise(0.10);
    } else if(m==='clapboard'){
      const bh=S/9;
      for(let row=0;row<9;row++){
        g.fillStyle=shade(col, 0.97+r()*0.06); g.fillRect(0, row*bh, S, bh-1);
        g.fillStyle='rgba(0,0,0,.16)'; g.fillRect(0, row*bh+bh-2, S, 2);          // shadow under each lap
        g.fillStyle='rgba(255,255,255,.16)'; g.fillRect(0, row*bh, S, 1);
      }
      noise(0.05);
    } else if(m==='shingle'){
      const bh=S/12, bw=S/8;
      for(let row=0;row<12;row++){ const off=(row%2)?bw/2:0;
        for(let cx=-1;cx<9;cx++){ g.fillStyle=shade(col,0.85+r()*0.3);
          g.fillRect(cx*bw+off, row*bh, bw-1.5, bh-1); } }
      noise(0.09);
    } else if(m==='stucco'){
      noise(0.13);
      for(let i=0;i<260;i++){ g.fillStyle='rgba(0,0,0,'+(r()*0.05).toFixed(3)+')';
        g.beginPath(); g.arc(r()*S, r()*S, r()*2.4, 0, 6.28); g.fill(); }
    } else if(m==='masonry'){
      const bh=S/6, bw=S/3;
      for(let row=0;row<6;row++){ const off=(row%2)?bw/2:0;
        for(let cx=-1;cx<4;cx++){ g.fillStyle=shade(col,0.9+r()*0.2);
          g.fillRect(cx*bw+off+1.5, row*bh+1.5, bw-3, bh-3); } }
      noise(0.07);
    } else if(m==='metal'){
      for(let x=0;x<S;x+=8){ g.fillStyle=shade(col,0.9); g.fillRect(x,0,4,S);
                             g.fillStyle=shade(col,1.08); g.fillRect(x+4,0,4,S); }
      noise(0.04);
    } else if(m==='glass'){
      for(let y=0;y<S;y+=16){ for(let x=0;x<S;x+=16){
        g.fillStyle=shade(col, 0.8+r()*0.5); g.fillRect(x+1,y+1,14,14); } }
      g.strokeStyle='rgba(230,240,245,.35)'; g.lineWidth=1;
      for(let y=0;y<=S;y+=16){ g.beginPath(); g.moveTo(0,y); g.lineTo(S,y); g.stroke(); }
      for(let x=0;x<=S;x+=16){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,S); g.stroke(); }
    } else if(m==='roofcomp'){
      const bh=S/14;
      for(let row=0;row<14;row++){ for(let x=0;x<S;x+=18){
        g.fillStyle=shade(col,0.85+r()*0.28); g.fillRect(x+((row%2)?9:0), row*bh, 17, bh-1); } }
      noise(0.08);
    } else if(m==='roofmembrane'){
      noise(0.06);
      g.strokeStyle='rgba(0,0,0,.10)'; g.lineWidth=1;
      for(let x=0;x<S;x+=32){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,S); g.stroke(); }
    }
    TXC[key]={canvas:c, pattern:null};
    return TXC[key];
  }

  /* --------------------------------------------------------------- 3D engine */
  function makeCam(opt){
    const az=opt.az, el=opt.el, d=opt.dist, f=opt.f||1.6;
    const ca=Math.cos(az), sa=Math.sin(az), ce=Math.cos(el), se=Math.sin(el);
    return function(p){
      const x=p[0], y=p[1], z=p[2];
      const x1= x*ca + y*sa;
      const y1=-x*sa + y*ca;
      const y2= y1*ce - z*se;
      const z2= y1*se + z*ce;
      const depth = y2 + d;
      const s = (depth<=0.15) ? 0 : f/depth;
      return {x:x1*s, y:-z2*s, d:depth, ok:depth>0.15};
    };
  }
  /* affine-map an image onto a quad using two triangles */
  function texQuad(ctx, img, q, w, h){
    if(q.some(p=>!p.ok)) return false;
    const tri=(a,b,c, ua,va, ub,vb, uc,vc)=>{
      const d=(ub-ua)*(vc-va)-(uc-ua)*(vb-va); if(!d) return;
      const m11=((b.x-a.x)*(vc-va)-(c.x-a.x)*(vb-va))/d;
      const m12=((b.y-a.y)*(vc-va)-(c.y-a.y)*(vb-va))/d;
      const m21=((c.x-a.x)*(ub-ua)-(b.x-a.x)*(uc-ua))/d;
      const m22=((c.y-a.y)*(ub-ua)-(b.y-a.y)*(uc-ua))/d;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(c.x,c.y); ctx.closePath(); ctx.clip();
      ctx.transform(m11,m12,m21,m22, a.x-m11*ua-m21*va, a.y-m12*ua-m22*va);
      ctx.drawImage(img, 0,0, img.width, img.height, 0,0, w,h);
      ctx.restore();
    };
    tri(q[0],q[1],q[2], 0,0, w,0, w,h);
    tri(q[0],q[2],q[3], 0,0, w,h, 0,h);
    return true;
  }
  function poly(ctx, q, fill, stroke){
    if(q.some(p=>!p.ok)) return;
    ctx.beginPath(); ctx.moveTo(q[0].x,q[0].y);
    for(let i=1;i<q.length;i++) ctx.lineTo(q[i].x,q[i].y);
    ctx.closePath();
    if(fill){ ctx.fillStyle=fill; ctx.fill(); }
    if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=1; ctx.stroke(); }
  }

  /* ---- one building ---- */
  function buildFaces(m, ox, oy, scale){
    const w=m.W*scale/2, d=m.D*scale/2, h=m.H*scale;
    const x0=ox-w, x1=ox+w, y0=oy-d, y1=oy+d;
    const F=[];
    const wallH = m.roof==='flat' ? h+ (m.cls==='apartment'||m.cls==='hotel'||m.cls==='office'? 2.2*scale : 1.4*scale) : h;
    // four walls; v = (u across, up)
    F.push({t:'wall', n:'S', p:[[x0,y0,0],[x1,y0,0],[x1,y0,wallH],[x0,y0,wallH]], lw:m.W, lh:m.H, light:1.00, front:true});
    F.push({t:'wall', n:'E', p:[[x1,y0,0],[x1,y1,0],[x1,y1,wallH],[x1,y0,wallH]], lw:m.D, lh:m.H, light:0.86});
    F.push({t:'wall', n:'N', p:[[x1,y1,0],[x0,y1,0],[x0,y1,wallH],[x1,y1,wallH]], lw:m.W, lh:m.H, light:0.70});
    F.push({t:'wall', n:'W', p:[[x0,y1,0],[x0,y0,0],[x0,y0,wallH],[x0,y1,wallH]], lw:m.D, lh:m.H, light:0.78});
    if(m.roof==='flat'){
      F.push({t:'roof', p:[[x0,y0,wallH],[x1,y0,wallH],[x1,y1,wallH],[x0,y1,wallH]], light:1.12, mat:'roofmembrane'});
    } else if(m.roof==='gable'){
      const rh=h+Math.min(m.W,m.D)*scale*0.30, mx=ox;
      F.push({t:'roof', p:[[x0,y0,h],[x1,y0,h],[mx,y0,rh]], light:1.0, mat:null, gableEnd:true});
      F.push({t:'roof', p:[[x1,y1,h],[x0,y1,h],[mx,y1,rh]], light:0.72, mat:null, gableEnd:true});
      F.push({t:'roof', p:[[x0,y0,h],[mx,y0,rh],[mx,y1,rh],[x0,y1,h]], light:0.90, mat:'roofcomp', lw:m.D, lh:m.W*0.6});
      F.push({t:'roof', p:[[x1,y1,h],[mx,y1,rh],[mx,y0,rh],[x1,y0,h]], light:1.10, mat:'roofcomp', lw:m.D, lh:m.W*0.6});
    } else { // hip
      const rh=h+Math.min(m.W,m.D)*scale*0.22, ix=Math.min(w,d)*0.55;
      const a=[ox-w+ix, oy-d+ix, rh], b=[ox+w-ix, oy-d+ix, rh], c=[ox+w-ix, oy+d-ix, rh], e=[ox-w+ix, oy+d-ix, rh];
      F.push({t:'roof', p:[[x0,y0,h],[x1,y0,h],b,a], light:1.10, mat:'roofcomp', lw:m.W, lh:m.D*0.5});
      F.push({t:'roof', p:[[x1,y0,h],[x1,y1,h],c,b], light:0.92, mat:'roofcomp', lw:m.D, lh:m.W*0.5});
      F.push({t:'roof', p:[[x1,y1,h],[x0,y1,h],e,c], light:0.74, mat:'roofcomp', lw:m.W, lh:m.D*0.5});
      F.push({t:'roof', p:[[x0,y1,h],[x0,y0,h],a,e], light:0.84, mat:'roofcomp', lw:m.D, lh:m.W*0.5});
      /* the ridge plateau between the four hips — without it the roof reads as
         a hole punched in the top */
      F.push({t:'roof', p:[a,b,c,e], light:1.16, mat:'roofcomp', lw:m.W*0.4, lh:m.D*0.4});
    }
    if(m.porch){
      const pd=8*scale;
      F.push({t:'porch', p:[[x0,y0-pd,0],[x1,y0-pd,0],[x1,y0-pd,m.floorH*scale*0.95],[x0,y0-pd,m.floorH*scale*0.95]], light:0.95});
      F.push({t:'porchroof', p:[[x0,y0-pd,m.floorH*scale*0.95],[x1,y0-pd,m.floorH*scale*0.95],[x1,y0,m.floorH*scale*1.05],[x0,y0,m.floorH*scale*1.05]], light:1.05});
    }
    return F;
  }

  /* window grid for one wall, in wall-local units (0..1 across, 0..1 up) */
  function windowsFor(m, face){
    if(m.cls==='land') return [];
    const cols = Math.max(1, Math.min(9, Math.round(face.lw/ (m.cls==='apartment'||m.cls==='hotel'?13: m.cls==='office'?11:12))));
    const rows = Math.max(1, m.floors);
    const out=[];
    const wide = m.cls==='retail' && face.front;
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const cw = wide && r===0 ? 0.78/cols*cols*0.9 : 0.52/cols;
        const u0 = (c+0.5)/cols - (wide&&r===0 ? 0.42/cols*cols*0.9/2 : cw/2);
        const fh = 1/rows;
        const v0 = r*fh + fh*0.22, vh = fh*(wide&&r===0?0.66:0.5);
        out.push({u0, u1:u0+ (wide&&r===0? 0.42/cols*cols*0.9 : cw), v0, v1:v0+vh, lit:false});
      }
    }
    if(face.front && m.cls!=='land'){
      const dw=0.38/cols, du=(0.5-dw/2);
      out.push({u0:du, u1:du+dw, v0:0.012, v1:0.012+ (1/rows)*0.60, door:true});
    }
    return out;
  }

  function drawBuilding(ctx, cam, m, ox, oy, scale, opt){
    opt=opt||{};
    const col=palette(m.mat, m.seed);
    const roofCol = m.roof==='flat' ? '#5b5f63' : (m.LA? '#5d5b57' : '#4f5358');
    const faces=buildFaces(m, ox, oy, scale);
    const items=faces.map(f=>{
      const q=f.p.map(cam);
      const dep=q.reduce((a,p)=>a+p.d,0)/q.length;
      return {f, q, dep};
    }).filter(i=>i.q.every(p=>p.ok));
    items.sort((a,b)=>b.dep-a.dep);
    for(const it of items){
      const f=it.f, q=it.q;
      if(f.t==='wall'){
        if(m.cls==='land'){ continue; }
        const tx=texture(m.mat, col, m.seed);
        ctx.save();
        if(!texQuad(ctx, tx.canvas, q, 128, 128)) { ctx.restore(); continue; }
        ctx.restore();
        // light wash
        poly(ctx, q, 'rgba('+(f.light>=1?'255,252,240':'10,14,26')+','+Math.abs(1-f.light).toFixed(2)+')', 'rgba(0,0,0,.30)');
        // windows, drawn as true projected quads on the wall plane
        const A=f.p[0], B=f.p[1], C=f.p[3];
        const ux=[B[0]-A[0],B[1]-A[1],B[2]-A[2]], vy=[C[0]-A[0],C[1]-A[1],C[2]-A[2]];
        const at=(u,v)=>cam([A[0]+ux[0]*u+vy[0]*v, A[1]+ux[1]*u+vy[1]*v, A[2]+ux[2]*u+vy[2]*v]);
        windowsFor(m, f).forEach(w=>{
          const qq=[at(w.u0,w.v0), at(w.u1,w.v0), at(w.u1,w.v1), at(w.u0,w.v1)];
          if(w.door){ poly(ctx, qq, shade(m.LA?'#6b4b3a':'#3f4a55', f.light), 'rgba(0,0,0,.45)'); return; }
          poly(ctx, qq, m.mat==='glass'? 'rgba(150,190,210,.55)' : shade('#2b3a46', f.light*(0.85+((w.u0*97)%7)/40)), 'rgba(255,255,255,.28)');
          // sill / reveal
          const sill=[at(w.u0,w.v0), at(w.u1,w.v0), at(w.u1,w.v0-0.008), at(w.u0,w.v0-0.008)];
          poly(ctx, sill, shade('#ffffff', 0.82*f.light), null);
        });
      } else if(f.t==='roof'){
        if(m.cls==='land') continue;
        if(f.mat){ const tx=texture(f.mat, roofCol, m.seed+7);
          if(!texQuad(ctx, tx.canvas, q.length===4?q:[q[0],q[1],q[2],q[2]], 128,128)) poly(ctx,q,shade(roofCol,f.light),null);
          poly(ctx, q, 'rgba('+(f.light>=1?'255,250,235':'8,12,22')+','+Math.abs(1-f.light).toFixed(2)+')', 'rgba(0,0,0,.35)');
        } else {
          poly(ctx, q, shade(col, f.light*0.97), 'rgba(0,0,0,.35)');   // gable end wall
        }
      } else if(f.t==='porch'){
        poly(ctx, q, 'rgba(0,0,0,0)', null);
        // posts
        const A=f.p[0], B=f.p[1], C=f.p[3];
        const ux=[B[0]-A[0],B[1]-A[1],B[2]-A[2]], vy=[C[0]-A[0],C[1]-A[1],C[2]-A[2]];
        const at=(u,v)=>cam([A[0]+ux[0]*u+vy[0]*v, A[1]+ux[1]*u+vy[1]*v, A[2]+ux[2]*u+vy[2]*v]);
        for(let i=0;i<=3;i++){ const u=i/3, w=0.018;
          poly(ctx, [at(u-w,0), at(u+w,0), at(u+w,1), at(u-w,1)], shade(col,1.03), 'rgba(0,0,0,.25)'); }
        poly(ctx, [at(0,0), at(1,0), at(1,0.06), at(0,0.06)], shade('#b9ac97',0.95), 'rgba(0,0,0,.3)');
      } else if(f.t==='porchroof'){
        poly(ctx, q, shade(roofCol, f.light), 'rgba(0,0,0,.32)');
      }
    }
    return items.length;
  }

  /* ------------------------------------------------------- single-property 3D */
  function drawSubject(cv, l, state){
    const ctx=cv.getContext('2d');
    const DPR=Math.min(2, window.devicePixelRatio||1);
    const W=cv.clientWidth||520, H=cv.clientHeight||300;
    cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
    const m=massing(l);
    // sky + ground
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#dfe8f0'); g.addColorStop(0.62,'#eef1f2'); g.addColorStop(0.621,'#cfd3cb'); g.addColorStop(1,'#b7bcae');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.translate(W/2, H*0.72);
    /* geometry is in feet; framing is controlled by focal length and camera
       distance alone, so a 5-storey hotel and a shotgun single both fill the
       frame without either being drawn at a misleading relative size. */
    const scale=1;
    const span=Math.max(m.W, m.D, m.H, 34);
    const cam=makeCam({az:state.az, el:state.el, dist: span*2.55 + 18, f: Math.min(W,H)*1.42});
    // ground pad = the lot, when the record gives one
    if(l.lot){
      const side=Math.sqrt(l.lot*1.0)/2;
      poly(ctx, [cam([-side,-side,0]),cam([side,-side,0]),cam([side,side,0]),cam([-side,side,0])],
           'rgba(120,135,110,.30)', 'rgba(60,70,55,.45)');
    }
    // soft shadow
    const sw=m.W/2, sd=m.D/2;
    poly(ctx, [cam([-sw+9,-sd+7,0.2]),cam([sw+20,-sd+7,0.2]),cam([sw+20,sd+17,0.2]),cam([-sw+9,sd+17,0.2])], 'rgba(30,36,28,.20)', null);
    if(m.cls==='land'){
      ctx.restore();
      ctx.fillStyle='#4b5245'; ctx.font='600 13px ui-sans-serif,system-ui'; ctx.textAlign='center';
      ctx.fillText('Land only — the roll records no improvement on this parcel', W/2, H*0.86);
      return m;
    }
    drawBuilding(ctx, cam, m, 0, 0, scale, {});
    ctx.restore();
    return m;
  }

  /* --------------------------------------------------------- block overview 3D */
  function neighbours(l, n, rad){
    rad=rad||430;
    const X=window.LX; if(!X) return [];
    const all=X.allListings(); const out=[];
    const cy=Math.cos(l.lat*Math.PI/180);
    for(let i=0;i<all.length;i++){
      const o=all[i]; if(o.id===l.id||o.lat==null) continue;
      const dx=(o.lng-l.lng)*111320*cy, dy=(o.lat-l.lat)*110540;
      const d2=dx*dx+dy*dy;
      const fx=dx*3.281, fy=dy*3.281;               // metres -> feet, model units
      if(fx*fx+fy*fy > rad*rad) continue;
      out.push({l:o, x:fx, y:fy, d2:fx*fx+fy*fy});
    }
    out.sort((a,b)=>a.d2-b.d2);
    return out.slice(0, n||26);
  }
  function drawOverview(cv, l, state){
    const ctx=cv.getContext('2d');
    const DPR=Math.min(2, window.devicePixelRatio||1);
    const W=cv.clientWidth||760, H=cv.clientHeight||420;
    cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#d9e4ee'); g.addColorStop(0.55,'#edf0f1'); g.addColorStop(0.551,'#c7ccc0'); g.addColorStop(1,'#aeb4a6');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    const nb=neighbours(l, state.count||40, state.radius||430);
    const scale=1;
    const R=state.radius||430;
    ctx.save(); ctx.translate(W/2, H*0.74);
    const cam=makeCam({az:state.az, el:state.el, dist:R*1.95, f:Math.min(W,H)*1.30});
    // ground grid, 100 ft
    ctx.globalAlpha=0.5;
    const gN=Math.ceil(R/100);
    for(let i=-gN;i<=gN;i++){
      const a=cam([i*100, -R, 0]), b=cam([i*100, R, 0]);
      const c=cam([-R, i*100, 0]), d=cam([R, i*100, 0]);
      if(a.ok&&b.ok){ ctx.strokeStyle='rgba(90,100,85,.30)'; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
      if(c.ok&&d.ok){ ctx.beginPath(); ctx.moveTo(c.x,c.y); ctx.lineTo(d.x,d.y); ctx.stroke(); }
    }
    ctx.globalAlpha=1;
    const items=[{l, x:0, y:0, subject:true}].concat(nb);
    // paint far-to-near
    items.sort((a,b)=>{
      const ca=makeCam({az:state.az, el:state.el, dist:1e6, f:1});
      return cam([b.x*scale,b.y*scale,0]).d - cam([a.x*scale,a.y*scale,0]).d;
    });
    let drawn=0;
    for(const it of items){
      const m=massing(it.l);
      if(m.cls==='land'){
        const s=Math.sqrt(Math.max(400,(it.l.lot||3000)))*scale/2;
        poly(ctx, [cam([it.x*scale-s,it.y*scale-s,0]),cam([it.x*scale+s,it.y*scale-s,0]),cam([it.x*scale+s,it.y*scale+s,0]),cam([it.x*scale-s,it.y*scale+s,0])],
             'rgba(150,160,120,.45)','rgba(70,80,60,.5)');
        continue;
      }
      drawBuilding(ctx, cam, m, it.x*scale, it.y*scale, scale, {});
      drawn++;
      if(it.subject){
        const top=cam([it.x*scale, it.y*scale, m.H*scale+ (m.roof==='flat'?10:26)*scale]);
        if(top.ok){
          ctx.fillStyle='#c0392b'; ctx.beginPath(); ctx.arc(top.x, top.y-8, 5.5, 0, 6.28); ctx.fill();
          ctx.strokeStyle='#c0392b'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(top.x, top.y-3); ctx.lineTo(top.x, top.y+9); ctx.stroke();
        }
      }
    }
    ctx.restore();
    ctx.fillStyle='rgba(20,24,20,.62)'; ctx.font='11px ui-sans-serif,system-ui'; ctx.textAlign='left';
    ctx.fillText(drawn+' structures modelled within '+(state.radius||430)+' ft · schematic massing from recorded attributes, not a survey', 10, H-9);
    return drawn;
  }

  /* ------------------------------------------------------------------ drawer */
  function sheetHTML(l){
    const m=massing(l), f=extract(l);
    const badge=p=>`<span style="font-size:9.5px;font-weight:700;letter-spacing:.03em;padding:1px 5px;border-radius:4px;background:${p===P.REC?'rgba(39,174,96,.16)':p===P.DER?'rgba(46,134,193,.16)':'rgba(160,160,160,.18)'};color:${p===P.REC?'#1e8449':p===P.DER?'#1f6391':'var(--muted)'}">${p}</span>`;
    return `<div class="sec" style="margin-top:12px">
      <h3>Reconstruction &mdash; what the record actually supports</h3>
      <p class="chartnote" style="margin:0 0 8px">Every line says where it came from. <b>recorded</b> is published by the jurisdiction. <b>derived</b> is computed from recorded values. <b>schematic</b> is a regional convention used to draw the picture and nothing more &mdash; it is not evidence about this building.</p>
      <div style="display:grid;gap:3px;font-size:12.5px">
        ${f.map(x=>`<div style="display:flex;gap:8px;align-items:baseline;border-bottom:1px solid var(--line);padding:3px 0">
           <span style="flex:0 0 150px;color:var(--ink2)">${esc(x.k)}</span>
           <span style="flex:1;min-width:0"><b>${esc(x.v)}</b>${x.note?`<span style="display:block;font-size:11px;color:var(--muted)">${esc(x.note)}</span>`:''}</span>
           ${badge(x.p)}</div>`).join('')}
      </div>
      <p class="eyebrow" style="margin:12px 0 4px">Massing model</p>
      <div class="facts">
        <div><span>Class</span><span>${esc(m.cls)}</span></div>
        <div><span>Floors</span><span>${m.floors} <span style="font-size:10px;color:var(--muted)">${m.prov.floors}</span></span></div>
        <div><span>Footprint</span><span>${fmtN(m.foot)} sf <span style="font-size:10px;color:var(--muted)">${m.prov.footprint}</span></span></div>
        <div><span>Plan</span><span>${fmtN(m.W)} × ${fmtN(m.D)} ft</span></div>
        <div><span>Height to eave</span><span>${fmtN(m.H)} ft</span></div>
        <div><span>Roof form</span><span>${esc(m.roof)} <span style="font-size:10px;color:var(--muted)">schematic</span></span></div>
        <div><span>Facade material</span><span>${esc(m.mat)} <span style="font-size:10px;color:var(--muted)">schematic</span></span></div>
      </div>
      <div style="position:relative;margin-top:10px"><canvas id="recon3d" style="width:100%;height:230px;border-radius:10px;border:1px solid var(--line);display:block;cursor:grab"></canvas></div>
      <div class="toolbar" style="margin-top:6px"><button class="btn" id="reconspin">Spin</button><button class="btn" id="reconblock">Block overview</button><span style="font-size:11px;color:var(--muted)">drag to orbit</span></div>
      <div class="src">Schematic massing generated from the recorded attributes above. Colours, materials, window rhythm and roof pitch are regional conventions chosen by rule &mdash; they are not observations of this building and should never be shown to a lender, seller or partner as an image of the property. Use the Record Locker below for the actual aerials, panorama and permit file.</div>
    </div>`;
  }

  function bindSheet(l){
    const cv=$('#recon3d'); if(!cv) return;
    const st={az:0.72, el:0.42, mode:'subject', radius:430, count:26, spin:null};
    const paint=()=>{ try{ st.mode==='subject'? drawSubject(cv,l,st) : drawOverview(cv,l,st); }catch(e){} };
    paint();
    let drag=null;
    cv.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY,az:st.az,el:st.el}; cv.setPointerCapture(e.pointerId); cv.style.cursor='grabbing'; });
    cv.addEventListener('pointermove',e=>{ if(!drag) return;
      st.az=drag.az+(e.clientX-drag.x)*0.008;
      st.el=Math.max(0.06, Math.min(1.30, drag.el+(e.clientY-drag.y)*0.005));
      paint(); });
    const end=()=>{ drag=null; cv.style.cursor='grab'; };
    cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
    const sp=$('#reconspin'); if(sp) sp.addEventListener('click',()=>{
      if(st.spin){ clearInterval(st.spin); st.spin=null; sp.textContent='Spin'; return; }
      sp.textContent='Stop'; st.spin=setInterval(()=>{ st.az+=0.022; paint(); }, 60);
    });
    const bb=$('#reconblock'); if(bb) bb.addEventListener('click',()=>{
      st.mode = st.mode==='subject'?'block':'subject';
      bb.textContent = st.mode==='subject'?'Block overview':'This building';
      paint();
    });
  }

  /* ---------------------------------------------------------------- 3D tab */
  let vState={az:0.72, el:0.40, radius:430, count:26, spin:null, id:null};
  function render(){
    const root=$('#reconroot'); if(!root) return;
    const X=window.LX; if(!X) return;
    const all=X.allListings();
    let l=null;
    if(vState.id) l=all.find(x=>x.id===vState.id);
    if(!l && X.state && X.state.sel) l=all.find(x=>x.id===X.state.sel);
    if(!l){
      // default to the highest-scoring record with real recorded geometry
      const D=window.LXDash;
      const rows=(D&&D.rows&&D.rows.length)? D.rows : null;
      if(rows){ const best=rows.filter(r=>r.l.sqft||r.l.units>1).sort((a,b)=>b.score-a.score)[0]; if(best) l=best.l; }
      if(!l) l=all[0];
    }
    if(!l){ root.innerHTML='<p class="chartnote">No records loaded.</p>'; return; }
    vState.id=l.id;
    const m=massing(l);
    const kb=window.LXRec? LXRec.countAll() : {props:0,links:0};
    root.innerHTML=`
    <div class="cards" style="margin:0 0 12px">
      ${tile('Subject', esc(l.addr||l.id), esc((l.city||'')+' · '+(l.kind||'')))}
      ${tile('Modelled floors', m.floors, m.prov.floors+' · '+fmtN(m.foot)+' sf footprint')}
      ${tile('Recorded fields', extract(l).filter(x=>x.p===P.REC).length+' of '+extract(l).length, 'the rest are derived or schematic')}
      ${tile('Knowledgebase', kb.links+' links', kb.props+' propert'+(kb.props===1?'y':'ies')+' with saved records')}
    </div>
    <div class="grid2">
      <div class="chart tall" data-panel data-panel-title="Subject in 3D">
        <div class="eyebrow">Subject</div><h3 style="margin:2px 0 6px">${esc(l.addr||'')}</h3>
        <canvas id="v3d_sub" style="width:100%;height:300px;border-radius:10px;border:1px solid var(--line);display:block;cursor:grab"></canvas>
      </div>
      <div class="chart tall" data-panel data-panel-title="Block overview in 3D">
        <div class="eyebrow">Block overview</div><h3 style="margin:2px 0 6px">Everything tracked within ${vState.radius} ft</h3>
        <canvas id="v3d_blk" style="width:100%;height:300px;border-radius:10px;border:1px solid var(--line);display:block;cursor:grab"></canvas>
      </div>
    </div>
    <div class="toolbar" style="margin:10px 0">
      <input type="text" id="v3dq" placeholder="Jump to an address in this edition" style="flex:1;min-width:220px">
      <button class="btn" id="v3dgo">Load</button>
      <button class="btn" id="v3dspin">Spin both</button>
      <label style="font-size:12px;color:var(--ink2)">radius
        <select id="v3drad"><option value="240">240 ft</option><option value="430" selected>430 ft</option><option value="700">700 ft</option><option value="1100">1,100 ft</option></select></label>
      <button class="btn" id="v3dpng">Save both as PNG</button>
    </div>
    <div id="reconsheet"></div>`;

    const sub=$('#v3d_sub'), blk=$('#v3d_blk');
    const paint=()=>{ try{ drawSubject(sub,l,vState); }catch(e){} try{ drawOverview(blk,l,vState); }catch(e){} };
    paint();
    [[sub,'sub'],[blk,'blk']].forEach(([cv])=>{
      let drag=null;
      cv.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY,az:vState.az,el:vState.el}; cv.setPointerCapture(e.pointerId); cv.style.cursor='grabbing'; });
      cv.addEventListener('pointermove',e=>{ if(!drag) return;
        vState.az=drag.az+(e.clientX-drag.x)*0.008;
        vState.el=Math.max(0.06, Math.min(1.30, drag.el+(e.clientY-drag.y)*0.005)); paint(); });
      const end=()=>{ drag=null; cv.style.cursor='grab'; };
      cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
    });
    const sp=$('#v3dspin'); sp.addEventListener('click',()=>{
      if(vState.spin){ clearInterval(vState.spin); vState.spin=null; sp.textContent='Spin both'; return; }
      sp.textContent='Stop'; vState.spin=setInterval(()=>{ vState.az+=0.02; paint(); }, 60); });
    $('#v3drad').addEventListener('change',e=>{ vState.radius=+e.target.value; paint(); });
    const go=()=>{ const q=($('#v3dq').value||'').trim().toLowerCase(); if(!q) return;
      const hit=all.find(x=>String(x.addr||'').toLowerCase().includes(q));
      if(hit){ vState.id=hit.id; render(); } else if(window.LX&&LX.toast) LX.toast('No address in this edition matches “'+q+'”'); };
    $('#v3dgo').addEventListener('click',go);
    $('#v3dq').addEventListener('keydown',e=>{ if(e.key==='Enter') go(); });
    $('#v3dpng').addEventListener('click',()=>{
      const out=document.createElement('canvas');
      out.width=sub.width+blk.width; out.height=Math.max(sub.height, blk.height);
      const c=out.getContext('2d'); c.fillStyle='#eef1f2'; c.fillRect(0,0,out.width,out.height);
      c.drawImage(sub,0,0); c.drawImage(blk,sub.width,0);
      c.fillStyle='rgba(20,24,20,.75)'; c.font='16px ui-sans-serif,system-ui';
      c.fillText('Locator.X schematic massing — not a photograph or survey — '+(l.addr||''), 14, out.height-14);
      out.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b);
        a.download='locator.x-3d-'+String(l.addr||l.id).replace(/[^A-Za-z0-9]+/g,'-').toLowerCase()+'.png';
        a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); });
    });
    const sheet=$('#reconsheet');
    /* one optional block must not be able to take the whole tab down with it -
       the Record Locker threw a ReferenceError here for months and the symptom
       was a half-rendered 3D & records page, not an error anyone could see */
    let locker='';
    try{ locker = window.LXRec? LXRec.lockerHTML(l) : ''; }
    catch(e){ locker = '<div class="sect"><p style="font-size:12.5px;color:var(--muted)">The record locker could not be built for this property.</p></div>'; }
    sheet.innerHTML = sheetHTML(l).replace('id="recon3d"','id="recon3d_tab"') + locker;
    const t=$('#recon3d_tab'); if(t) t.parentNode.parentNode.removeChild(t.parentNode);
    if(window.LXRec) LXRec.bind(l);
    if(window.LXPanels) setTimeout(()=>LXPanels.scan('recon'),160);
  }
  function tile(k,v,note){ return '<div class="tile"><p class="eyebrow" style="margin:0">'+esc(k)+'</p><p class="big num" style="margin:4px 0 2px;font-size:'+(String(v).length>16?'15px':'22px')+'">'+v+'</p><p style="font-size:11.5px;color:var(--muted);margin:0">'+note+'</p></div>'; }

  window.LXRecon={render, sheetHTML, bindSheet, massing, extract, drawSubject, drawOverview,
                  setSubject(id){ vState.id=id; }};
})();
