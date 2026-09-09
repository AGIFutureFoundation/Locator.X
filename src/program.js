/* locator.x — Program: access tiers, royalty licensing, investor & seed overview.
   AGI Corp — AGI Future Foundation. Planning page: describes the program's own proposed
   commercial model. Nothing here is an offer of securities. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const L=()=>window.LX;
const TIERS=[
 {id:'scout', name:'Scout', price:'Free', c:'#2563EB', who:'Students, new investors, community partners',
  feats:['Full market maps and Locator X scores','Cross-signal research library and RAG search','Academy and Trade School with verification drills','Read-only underwriting sheets']},
 {id:'operator', name:'Operator', price:'$49/mo · proposed', c:'#1F8A4C', who:'Active individual investors and agents',
  feats:['Everything in Scout','Full underwriting desk: solver, auto-screen, pipeline','PDF memoranda and video reels','Deal-space visuals and buy-box automation','Priority daily data refresh']},
 {id:'enterprise', name:'Enterprise', price:'$399/mo + seats · proposed', c:'#D97706', who:'Brokerages, funds, family offices',
  feats:['Everything in Operator','White-label exports: your mark, colors, custom data fields','Template distribution across the team (JSON rollout)','Custom buy boxes and scoring weight presets per desk','Onboarding built on the counterpart playbooks']},
 {id:'inst', name:'Institutional', price:'Custom', c:'#7C3AED', who:'Lenders, municipalities, universities, data partners',
  feats:['Everything in Enterprise','Custom regions built to order (any county with open records)','Dedicated signal feeds and refresh SLAs','Digital-twin and AR/VR fabric licensing','Co-branded training academies']}];
function render(){
  const root=$('#progroot'); if(!root||root.dataset.done) return; root.dataset.done='1';
  const X=L();
  root.innerHTML=`
  <div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));display:grid;gap:14px">
    ${TIERS.map(t=>`<div class="tile" style="border-top:3px solid ${t.c}">
      <div class="eyebrow">${t.name}</div>
      <div style="font-size:22px;font-weight:700;font-family:var(--mono);margin:2px 0">${t.price}</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:8px">${t.who}</div>
      ${t.feats.map(f=>`<div style="font-size:12.5px;padding:3px 0;border-top:1px solid var(--line2)">· ${f}</div>`).join('')}
    </div>`).join('')}
  </div>
  <p class="src" style="margin-top:8px">Tier prices are a proposed model for planning — set final pricing with your own market testing. The rating a user holds gates the tools exactly as listed; every tier keeps the honest-data rules (portal-sourced records, labeled estimates).</p>

  <h2 class="h2">Royalty-based licensing</h2>
  <div class="grid2">
    <div class="tile">
      <p style="font-size:13.5px;line-height:1.6;margin:0 0 8px">Partners can deploy Locator.X under their own brand — the white-label system already ships in the underwriting desk — and pay as a <b>royalty on what the deployment earns</b> instead of a fixed license. Two proposed structures, combinable:</p>
      <p style="font-size:13px;margin:0 0 6px"><b>Revenue royalty.</b> The partner keeps their subscription revenue and remits a percentage (proposed 15–20%) monthly. Zero upfront cost aligns both sides on the partner's growth.</p>
      <p style="font-size:13px;margin:0 0 6px"><b>Per-closing success fee.</b> A flat fee (proposed $250–500) when a deal sourced and underwritten through the platform closes — measured by memoranda exported against closed pipeline stages. Suits brokerages that would rather pay on outcomes.</p>
      <p style="font-size:13px;margin:0"><b>What partners get:</b> the full toolset under their mark, their custom data fields on every memo, the training academy for onboarding, and the daily data refresh. <b>What stays constant:</b> data honesty rules and source attribution to public records.</p>
    </div>
    <div class="tile">
      <p class="eyebrow">Royalty model — run the numbers</p>
      <div class="bbgrid" style="margin-top:8px">
        <label>Partner seats<input type="number" id="ry_seats" value="25"></label>
        <label>Seat price $/mo<input type="number" id="ry_price" value="49"></label>
        <label>Royalty %<input type="number" id="ry_pct" value="18"></label>
        <label>Closings /mo<input type="number" id="ry_close" value="4"></label>
        <label>Fee per closing $<input type="number" id="ry_fee" value="350"></label>
      </div>
      <div id="ry_out" style="margin-top:10px"></div>
    </div>
  </div>

  <h2 class="h2">Investor overview — seeding the expansion</h2>
  <div class="tile">
    <p style="font-size:13.5px;line-height:1.6;margin:0 0 10px">Locator.X is the mapping, scoring and training template AGI Corp uses to expand the AGI Future Foundation family of companies: each new metro is a repeatable build — open-records ingestion, the eleven-modality score, the conversion lab, the academy — and each deployment feeds the acquisition program it serves. Seed capital accelerates three lines: new-metro coverage, the live-data layer (recorder, court and delinquency feeds beyond the current portals), and the partner/royalty channel.</p>
    <div class="cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px">
      <div class="tile" style="background:var(--panel2)"><b style="font-size:13px">SAFE (post-money)</b><p style="font-size:12.5px;margin:6px 0 0;line-height:1.5">Simple agreement for future equity — fast, no interest or maturity, converts at the next priced round with a valuation cap and/or discount. The default instrument for early software seed checks.</p></div>
      <div class="tile" style="background:var(--panel2)"><b style="font-size:13px">Convertible note</b><p style="font-size:12.5px;margin:6px 0 0;line-height:1.5">Debt that converts to equity at the next round; carries interest and a maturity date. Suits investors who want downside seniority while the royalty channel proves out.</p></div>
      <div class="tile" style="background:var(--panel2)"><b style="font-size:13px">Revenue-share / royalty note</b><p style="font-size:12.5px;margin:6px 0 0;line-height:1.5">Investors are repaid as a fixed share of platform and royalty revenue up to a capped multiple — mirrors the partner model, no dilution, fits cash-flow-minded real-estate investors.</p></div>
      <div class="tile" style="background:var(--panel2)"><b style="font-size:13px">Priced equity round</b><p style="font-size:12.5px;margin:6px 0 0;line-height:1.5">A negotiated valuation with full shareholder rights — usually after SAFEs, when metrics (seats, royalty partners, closings) support the price.</p></div>
      <div class="tile" style="background:var(--panel2)"><b style="font-size:13px">Real-asset sidecar fund</b><p style="font-size:12.5px;margin:6px 0 0;line-height:1.5">A separate vehicle that buys the properties the platform surfaces — conversions near the universities on this map. Platform equity and property LP interests kept cleanly apart.</p></div>
    </div>
    <p class="src" style="margin-top:12px"><b>Read this before anything else:</b> This page is internal planning material for AGI Corp — AGI Future Foundation. It is <b>not an offer to sell, or a solicitation of an offer to buy, securities</b>. Any actual raise happens only through formal offering documents prepared with securities counsel, under the applicable exemptions (in the U.S., typically Regulation D 506(b)/506(c) with accredited-investor verification, or Regulation CF through a registered portal), with all the risk disclosures those require. No performance is promised or implied; the platform's data comes from public records and carries the estimate labels you see throughout.</p>
  </div>`;
  const calc=()=>{ const v=id=>+($('#'+id).value)||0;
    const rev=v('ry_seats')*v('ry_price'); const roy=rev*v('ry_pct')/100; const fees=v('ry_close')*v('ry_fee');
    $('#ry_out').innerHTML=`<div class="outs" style="grid-template-columns:repeat(2,1fr)">
      <div class="out"><div class="v">${L().fmt$(rev)}</div><div class="l">Partner revenue /mo</div></div>
      <div class="out good"><div class="v">${L().fmt$(roy+fees)}</div><div class="l">Royalty to Locator.X /mo</div></div>
      <div class="out"><div class="v">${L().fmt$(roy)}</div><div class="l">— revenue share</div></div>
      <div class="out"><div class="v">${L().fmt$(fees)}</div><div class="l">— closing fees</div></div>
    </div><div style="font-size:11px;color:var(--muted);margin-top:6px">${L().fmt$((roy+fees)*12)}/yr per partner at these inputs. Illustrative arithmetic on your inputs — not a projection.</div>`; };
  ['ry_seats','ry_price','ry_pct','ry_close','ry_fee'].forEach(id=>$('#'+id).addEventListener('input',calc));
  calc();
}
window.LXProg={render};
})();
