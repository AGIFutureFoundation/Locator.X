# -*- coding: utf-8 -*-
import os
import json, io, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import curriculum as K

# status is DERIVED from the backing map, never read from the stored tuple field —
# so a stale field cannot reach the published page even if the build gate is skipped.
ITEMS = [{"id":i,"p":i[0],"t":t,"kind":k,"promise":pr,"mods":m,"lands":l,
          "doc":d,"pre":q,"status":K.status_of(i),"backs":K.BACKS.get(i,[])}
         for (i,t,k,pr,m,l,d,q,_stored) in K.C]
LEVELS = [{"n":n,"name":nm,"tag":tg,"blurb":b,"gate":g,"ids":i} for (n,nm,tg,b,g,i) in K.LEVELS]
FW = [{"word":w,"name":nm,"hue":h,"blurb":b,"rows":[{"l":l,"t":t,"d":d} for (l,t,d) in r]} for (w,nm,h,b,r) in K.FRAMEWORKS]
DATA = json.dumps({"items":ITEMS,"levels":LEVELS,"fw":FW,
                   "pillars":[{"k":a,"name":b,"blurb":c,"hue":h} for (a,b,c,h) in K.PILLARS],
                   "doctrine":[{"t":a,"d":b} for (a,b) in K.DOCTRINE],
                   "paths":[{"name":n,"blurb":b,"ids":i} for (n,b,i) in K.PATHWAYS]},
                  ensure_ascii=False, separators=(',',':'))

# ---------------------------------------------------------------- graphics
ARCH_SVG = '''
<svg viewBox="0 0 940 400" role="img" aria-labelledby="archT archD" class="fig">
  <title id="archT">The curriculum architecture</title>
  <desc id="archD">Emotional equity and relationships forms the foundation slab. Seven subject
  pillars rise from it, and the six doctrine principles run across all of them.</desc>
  <line x1="30" y1="64" x2="910" y2="64" stroke="var(--rule-2)" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="30" y="52" class="fl">THE DOCTRINE &mdash; SIX PRINCIPLES, THROUGH EVERY PILLAR</text>
  <g class="cols">
    <g><rect x="34" y="108" width="112" height="184" rx="7" fill="var(--pf)" stroke="var(--rule)"/>
       <text x="90" y="134" class="pk" text-anchor="middle">F</text>
       <text x="90" y="158" class="pn" text-anchor="middle">Foundations</text>
       <text x="90" y="175" class="pn" text-anchor="middle">&amp; doctrine</text>
       <text x="90" y="278" class="pc" text-anchor="middle">6</text></g>
    <g><rect x="158" y="84" width="112" height="208" rx="7" fill="var(--pn)" stroke="var(--rule)"/>
       <text x="214" y="110" class="pk" text-anchor="middle">N</text>
       <text x="214" y="134" class="pn" text-anchor="middle">The numbers</text>
       <text x="214" y="278" class="pc" text-anchor="middle">7</text></g>
    <g><rect x="282" y="84" width="112" height="208" rx="7" fill="var(--pa)" stroke="var(--rule)"/>
       <text x="338" y="110" class="pk" text-anchor="middle">A</text>
       <text x="338" y="134" class="pn" text-anchor="middle">The asset</text>
       <text x="338" y="278" class="pc" text-anchor="middle">7</text></g>
    <g><rect x="406" y="84" width="112" height="208" rx="7" fill="var(--pc)" stroke="var(--rule)"/>
       <text x="462" y="110" class="pk" text-anchor="middle">C</text>
       <text x="462" y="134" class="pn" text-anchor="middle">Capital &amp;</text>
       <text x="462" y="151" class="pn" text-anchor="middle">structure</text>
       <text x="462" y="278" class="pc" text-anchor="middle">7</text></g>
    <g><rect x="530" y="84" width="112" height="208" rx="7" fill="var(--pd)" stroke="var(--rule)"/>
       <text x="586" y="110" class="pk" text-anchor="middle">D</text>
       <text x="586" y="134" class="pn" text-anchor="middle">Development</text>
       <text x="586" y="151" class="pn" text-anchor="middle">&amp; delivery</text>
       <text x="586" y="278" class="pc" text-anchor="middle">7</text></g>
    <g><rect x="654" y="132" width="112" height="160" rx="7" fill="var(--pv)" stroke="var(--rule)"/>
       <text x="710" y="158" class="pk" text-anchor="middle">V</text>
       <text x="710" y="182" class="pn" text-anchor="middle">Evidence</text>
       <text x="710" y="199" class="pn" text-anchor="middle">&amp; judgment</text>
       <text x="710" y="278" class="pc" text-anchor="middle">5</text></g>
    <g><rect x="778" y="180" width="112" height="112" rx="7" fill="var(--pm)" stroke="var(--rule)"/>
       <text x="834" y="206" class="pk" text-anchor="middle">M</text>
       <text x="834" y="230" class="pn" text-anchor="middle">Market &amp;</text>
       <text x="834" y="247" class="pn" text-anchor="middle">long game</text>
       <text x="834" y="278" class="pc" text-anchor="middle">3</text></g>
  </g>
  <rect x="34" y="304" width="856" height="66" rx="8" fill="var(--pe)" stroke="var(--hue-e)" stroke-width="1.5"/>
  <text x="56" y="332" class="pk">E</text>
  <text x="84" y="332" class="fn">Emotional equity &amp; relationships</text>
  <text x="84" y="352" class="fs">The foundation &mdash; 8 courses every other pillar rests on</text>
  <text x="866" y="341" class="pc" text-anchor="end">8</text>
</svg>'''

EQ_SVG = '''
<svg viewBox="0 0 640 330" role="img" aria-labelledby="eqT eqD" class="fig">
  <title id="eqT">Why goodwill compounds</title>
  <desc id="eqD">Two lines over successive deals. Transactional dealing returns roughly the same
  value each time. Relational dealing compounds, because each deal returns access, terms and
  referrals that make the next one cheaper.</desc>
  <line x1="62" y1="266" x2="608" y2="266" stroke="var(--rule-2)" stroke-width="1"/>
  <line x1="62" y1="34"  x2="62"  y2="266" stroke="var(--rule-2)" stroke-width="1"/>
  <text x="62" y="292" class="fl">DEAL 1</text>
  <text x="335" y="292" class="fl" text-anchor="middle">DEAL 5</text>
  <text x="608" y="292" class="fl" text-anchor="end">DEAL 10</text>
  <text x="62" y="24" class="fl">VALUE RETURNED BY EACH DEAL</text>
  <path d="M62 232 L122 230 L182 233 L242 229 L302 231 L362 230 L422 232 L482 229 L542 231 L602 230"
        fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="5 4"/>
  <path d="M62 232 L122 224 L182 211 L242 194 L302 172 L362 146 L422 118 L482 90 L542 66 L602 46"
        fill="none" stroke="var(--hue-e)" stroke-width="2.5"/>
  <circle cx="602" cy="46"  r="4.5" fill="var(--hue-e)"/>
  <circle cx="602" cy="230" r="4"   fill="var(--ink-3)"/>
  <text x="590" y="34" class="fnn" text-anchor="end">Relational &mdash; access, terms and referrals</text>
  <text x="590" y="216" class="fnn" text-anchor="end">Transactional &mdash; each deal starts over</text>
  <text x="62" y="316" class="fs">The gap is emotional equity. It is not measured on any statement, and it prices every term you are offered.</text>
</svg>'''

LOC_SVG = '''
<svg viewBox="0 0 940 250" role="img" aria-labelledby="locT locD" class="fig">
  <title id="locT">The LOCATOR screen</title>
  <desc id="locD">Seven gates a property passes through before it earns an offer. The band narrows
  left to right because each gate removes candidates.</desc>
  <polygon points="52,58 888,110 888,150 52,202" fill="var(--pf)" stroke="var(--rule)"/>
  <g>
   <g><line x1="52"  y1="52"  x2="52"  y2="208" stroke="var(--hue-f)" stroke-width="2.5"/>
      <text x="52"  y="38" class="lk" text-anchor="middle">L</text>
      <text x="52"  y="226" class="fl" text-anchor="middle">LOCATION</text>
      <text x="52"  y="240" class="fl" text-anchor="middle">&amp; CAPACITY</text></g>
   <g><line x1="191" y1="60"  x2="191" y2="200" stroke="var(--hue-f)" stroke-width="2.5"/>
      <text x="191" y="46" class="lk" text-anchor="middle">O</text>
      <text x="191" y="226" class="fl" text-anchor="middle">OWNERSHIP</text>
      <text x="191" y="240" class="fl" text-anchor="middle">ECONOMICS</text></g>
   <g><line x1="330" y1="68"  x2="330" y2="192" stroke="var(--hue-f)" stroke-width="2.5"/>
      <text x="330" y="54" class="lk" text-anchor="middle">C</text>
      <text x="330" y="226" class="fl" text-anchor="middle">CASH FLOW</text></g>
   <g><line x1="470" y1="77"  x2="470" y2="183" stroke="var(--hue-f)" stroke-width="2.5"/>
      <text x="470" y="63" class="lk" text-anchor="middle">A</text>
      <text x="470" y="226" class="fl" text-anchor="middle">ASSET TEST</text></g>
   <g><line x1="609" y1="86"  x2="609" y2="174" stroke="var(--hue-f)" stroke-width="2.5"/>
      <text x="609" y="72" class="lk" text-anchor="middle">T</text>
      <text x="609" y="226" class="fl" text-anchor="middle">TERMS &amp;</text>
      <text x="609" y="240" class="fl" text-anchor="middle">LEVERAGE</text></g>
   <g><line x1="748" y1="95"  x2="748" y2="165" stroke="var(--hue-f)" stroke-width="2.5"/>
      <text x="748" y="81" class="lk" text-anchor="middle">O</text>
      <text x="748" y="226" class="fl" text-anchor="middle">OUTLOOK</text></g>
   <g><line x1="888" y1="104" x2="888" y2="156" stroke="var(--flag)" stroke-width="3"/>
      <text x="888" y="90" class="lk" text-anchor="middle" fill="var(--flag)">R</text>
      <text x="888" y="226" class="fl" text-anchor="middle">RECORD</text></g>
  </g>
  <text x="52" y="18" class="fl">EVERY CANDIDATE ENTERS HERE</text>
  <text x="888" y="18" class="fl" text-anchor="end">WHAT SURVIVES EARNS AN OFFER</text>
</svg>'''

LEDG_SVG = '''
<svg viewBox="0 0 470 320" role="img" aria-labelledby="ldT ldD" class="fig">
  <title id="ldT">The emotional equity ledger</title>
  <desc id="ldD">A T-account. Deposits on the left are kept commitments; withdrawals on the right are
  the moments you were late, vague or absent. The balance is only proved when you draw on it.</desc>
  <line x1="30" y1="46" x2="440" y2="46" stroke="var(--rule-2)" stroke-width="1.5"/>
  <line x1="235" y1="46" x2="235" y2="252" stroke="var(--rule-2)" stroke-width="1.5"/>
  <text x="30"  y="34" class="fl">DEPOSITS</text>
  <text x="440" y="34" class="fl" text-anchor="end">WITHDRAWALS</text>
  <g class="ldg">
   <text x="30" y="74">Paid on the day you said</text>
   <text x="30" y="100">Decided inside the window</text>
   <text x="30" y="126">Answered the hard message</text>
   <text x="30" y="152">Sent the referral first</text>
   <text x="30" y="178">Told them early</text>
   <text x="30" y="204">Yielded what was cheap</text>
   <text x="440" y="74"  text-anchor="end">Went quiet</text>
   <text x="440" y="100" text-anchor="end">Paid late, said nothing</text>
   <text x="440" y="126" text-anchor="end">Slow, vague maybe</text>
   <text x="440" y="152" text-anchor="end">Won the last small point</text>
   <text x="440" y="178" text-anchor="end">Asked before ever giving</text>
  </g>
  <line x1="30" y1="252" x2="440" y2="252" stroke="var(--rule-2)" stroke-width="1.5"/>
  <text x="30"  y="276" class="ldb">Balance</text>
  <text x="440" y="276" class="ldb" text-anchor="end">Proved only when you draw on it</text>
  <text x="30"  y="302" class="fs">No statement is ever issued. The overdraft shows up as calls that stop coming.</text>
</svg>'''

CSS = r'''
:root{
  --paper:#F2EFE9; --paper-2:#E7E2D8; --card:#FBF9F5; --card-2:#F1EDE4;
  --ink:#17140F; --ink-2:#4A443A; --ink-3:#7C7264;
  --rule:#D5CDBE; --rule-2:#BFB4A1;
  --field:#2C6B4E; --flag:#B9531F;
  --hue-e:#7A4E86; --hue-f:#2C6B4E; --hue-n:#3E6291; --hue-a:#1F6E70;
  --hue-c:#8A5A18; --hue-d:#B9531F; --hue-v:#4A5A76; --hue-m:#6B5030;
  --pe:#EFE6F2; --pf:#E2EDE6; --pn:#E4EAF2; --pa:#DEEDED;
  --pc:#F3E9D8; --pd:#F6E5DB; --pv:#E6EAF0; --pm:#EFEADF;
  --shadow:0 1px 2px rgba(23,20,15,.05), 0 10px 26px -16px rgba(23,20,15,.22);
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:#14120E; --paper-2:#0F0D0A; --card:#1D1A15; --card-2:#252119;
  --ink:#F1ECE1; --ink-2:#BDB4A4; --ink-3:#8A8073;
  --rule:#332E26; --rule-2:#453E33;
  --field:#5FA483; --flag:#E0742F;
  --hue-e:#C79BD4; --hue-f:#5FA483; --hue-n:#7CA2D4; --hue-a:#5FB8B8;
  --hue-c:#D9A356; --hue-d:#E0742F; --hue-v:#93A5C4; --hue-m:#C4AC7A;
  --pe:#2A1F30; --pf:#1E2E26; --pn:#1E2833; --pa:#16302F;
  --pc:#302516; --pd:#33221A; --pv:#1F242E; --pm:#2A2519;
  --shadow:0 1px 2px rgba(0,0,0,.4), 0 12px 30px -18px rgba(0,0,0,.75);
}}
:root[data-theme="dark"]{
  --paper:#14120E; --paper-2:#0F0D0A; --card:#1D1A15; --card-2:#252119;
  --ink:#F1ECE1; --ink-2:#BDB4A4; --ink-3:#8A8073;
  --rule:#332E26; --rule-2:#453E33; --field:#5FA483; --flag:#E0742F;
  --hue-e:#C79BD4; --hue-f:#5FA483; --hue-n:#7CA2D4; --hue-a:#5FB8B8;
  --hue-c:#D9A356; --hue-d:#E0742F; --hue-v:#93A5C4; --hue-m:#C4AC7A;
  --pe:#2A1F30; --pf:#1E2E26; --pn:#1E2833; --pa:#16302F;
  --pc:#302516; --pd:#33221A; --pv:#1F242E; --pm:#2A2519;
  --shadow:0 1px 2px rgba(0,0,0,.4), 0 12px 30px -18px rgba(0,0,0,.75);
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:'IBM Plex Sans','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;
  -webkit-font-smoothing:antialiased}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
.wrap{max-width:1200px;margin:0 auto;padding:0 clamp(16px,3vw,30px)}

/* masthead */
.mh{border-bottom:1px solid var(--rule);background:var(--card);position:sticky;top:0;z-index:40}
.mh-in{max-width:1200px;margin:0 auto;padding:11px clamp(16px,3vw,30px);display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.bd{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.17em;text-transform:uppercase;color:var(--ink-3)}
.bd b{color:var(--ink);font-weight:600}
.sp{flex:1}
.ov{display:flex;align-items:center;gap:9px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink-3)}
.ovb{width:104px;height:6px;border-radius:3px;background:var(--paper-2);overflow:hidden}
.ovb i{display:block;height:100%;background:var(--field);border-radius:3px;transition:width .3s}
.mb{border:1px solid var(--rule-2);background:var(--card);color:var(--ink);border-radius:7px;padding:6px 11px;font-size:12px;cursor:pointer;font-family:inherit}
.mb:hover{background:var(--card-2)} .mb:focus-visible{outline:2px solid var(--field);outline-offset:2px}
.mb[aria-pressed="true"]{background:var(--field);border-color:var(--field);color:#fff}

/* hero */
.hero{padding:clamp(30px,4.5vw,58px) 0 clamp(24px,3vw,36px);border-bottom:1px solid var(--rule)}
.eyb{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--hue-e);margin:0 0 15px}
h1{font-family:'Fraunces',Georgia,serif;font-weight:600;letter-spacing:-.02em;font-size:clamp(34px,5.6vw,62px);line-height:1.02;margin:0 0 16px;text-wrap:balance;max-width:19ch}
.lede{font-size:clamp(15px,1.55vw,18px);line-height:1.55;color:var(--ink-2);max-width:62ch;margin:0 0 24px;text-wrap:pretty}
.by{display:flex;flex-direction:column;gap:2px;padding-top:16px;border-top:1px solid var(--rule);max-width:340px}
.bylb{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3)}
.byn{font-family:'Fraunces',Georgia,serif;font-size:23px;font-weight:600;letter-spacing:-.01em}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:12px;overflow:hidden;margin-top:26px;box-shadow:var(--shadow)}
@media(max-width:660px){.stats{grid-template-columns:repeat(2,1fr)}}
.st{background:var(--card);padding:14px 16px}
.st b{display:block;font-family:'Fraunces',Georgia,serif;font-size:clamp(23px,2.8vw,32px);font-weight:600;line-height:1;font-variant-numeric:tabular-nums}
.st span{display:block;margin-top:6px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3)}

/* sections */
section{padding:clamp(30px,4vw,50px) 0;border-bottom:1px solid var(--rule)}
section:last-of-type{border-bottom:0}
h2{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:clamp(21px,2.5vw,29px);margin:0 0 10px;letter-spacing:-.01em}
.note{font-size:14px;color:var(--ink-2);max-width:72ch;margin:0 0 22px;line-height:1.62}

/* figures */
.fig{width:100%;height:auto;display:block}
.figbox{border:1px solid var(--rule);background:var(--card);border-radius:12px;padding:clamp(14px,2vw,22px);box-shadow:var(--shadow);overflow-x:auto}
.fl{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.13em;fill:var(--ink-3)}
.fs{font-family:'IBM Plex Sans',sans-serif;font-size:11px;fill:var(--ink-3)}
.fnn{font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;fill:var(--ink-2)}
.fn{font-family:'Fraunces',Georgia,serif;font-size:17px;font-weight:600;fill:var(--ink)}
.pk{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;fill:var(--ink)}
.pn{font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;fill:var(--ink-2)}
.pc{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;fill:var(--ink-3)}
.figs{display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:start}
@media(max-width:900px){.figs{grid-template-columns:1fr}}


.lk{font-family:'IBM Plex Mono',monospace;font-size:19px;font-weight:600;fill:var(--ink)}
.ldg text{font-family:'IBM Plex Sans',sans-serif;font-size:12px;fill:var(--ink-2)}
.ldb{font-family:'Fraunces',Georgia,serif;font-size:14px;font-weight:600;fill:var(--ink)}
/* levels */
.lv{display:grid;gap:12px}
.lvc{border:1px solid var(--rule);background:var(--card);border-radius:12px;padding:16px 18px;box-shadow:var(--shadow)}
.lvh{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;margin-bottom:5px}
.lvn{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;color:#fff;background:var(--field);border-radius:11px;padding:3px 9px}
.lvt{font-family:'Fraunces',Georgia,serif;font-size:19px;font-weight:600;letter-spacing:-.01em}
.lvg{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink-3)}
.lvb{font-size:13px;color:var(--ink-2);margin:0 0 10px;line-height:1.5}
.lvgate{font-size:12.5px;color:var(--ink-2);background:var(--card-2);border:1px solid var(--rule);
  border-radius:9px;padding:10px 13px;margin:0 0 11px;line-height:1.55}
.lvgate b{color:var(--ink);display:block;font-family:'IBM Plex Mono',monospace;font-size:9px;
  letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px}
/* frameworks */
.fws{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
@media(max-width:820px){.fws{grid-template-columns:1fr}}
.fw{border:1px solid var(--rule);background:var(--card);border-radius:12px;padding:17px 18px;box-shadow:var(--shadow)}
.fww{font-family:'Fraunces',Georgia,serif;font-size:clamp(26px,3.2vw,34px);font-weight:600;
  letter-spacing:.04em;line-height:1;margin:0 0 3px}
.fwn{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3)}
.fwb{font-size:12.5px;color:var(--ink-2);margin:11px 0 13px;line-height:1.55}
.fwr{display:flex;gap:12px;padding:9px 0;border-top:1px solid var(--rule)}
.fwl{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;width:18px;flex:0 0 18px;line-height:1.25}
.fwr b{display:block;font-size:13px;color:var(--ink);margin-bottom:2px}
.fwr span{display:block;font-size:12px;color:var(--ink-2);line-height:1.5}
/* doctrine */
.doct{list-style:none;margin:0;padding:0;display:grid;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:12px;overflow:hidden}
.doct li{background:var(--card);padding:13px 17px;display:flex;gap:14px}
.doct .dn{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:var(--field);width:15px;flex:0 0 15px;padding-top:2px}
.doct b{display:block;font-size:14px;color:var(--ink);margin-bottom:3px}
.doct span{display:block;font-size:12.5px;line-height:1.55;color:var(--ink-2)}

/* filters + grid */
.filters{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 20px;align-items:center}
.srch{border:1px solid var(--rule-2);background:var(--card);color:var(--ink);border-radius:7px;padding:7px 11px;font:inherit;font-size:13px;min-width:190px}
.srch:focus-visible{outline:2px solid var(--field);outline-offset:1px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.crd{border:1px solid var(--rule);background:var(--card);border-radius:12px;padding:15px 16px;
  box-shadow:var(--shadow);display:flex;flex-direction:column;gap:9px;cursor:pointer;text-align:left;
  font:inherit;color:var(--ink);transition:transform .15s,border-color .15s}
.crd:hover{transform:translateY(-2px);border-color:var(--rule-2)}
.crd:focus-visible{outline:2px solid var(--field);outline-offset:2px}
.crd-h{display:flex;gap:9px;align-items:center}
.pill{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.05em;
  padding:3px 8px;border-radius:12px;color:#fff}
.crd-id{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--ink-3)}
.crd-k{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--ink-3);border:1px solid var(--rule-2);border-radius:10px;padding:2px 7px}
.crd-t{font-family:'Fraunces',Georgia,serif;font-size:16.5px;font-weight:600;line-height:1.22;letter-spacing:-.01em}
.crd-p{font-size:12.5px;line-height:1.5;color:var(--ink-2)}
.crd-f{display:flex;gap:8px;align-items:center;margin-top:auto;padding-top:9px;border-top:1px solid var(--rule);
  font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.dot{width:7px;height:7px;border-radius:50%;flex:0 0 7px}
.dot.live{background:var(--field)} .dot.designed{background:var(--rule-2)}
.crd.done{border-color:var(--field)}
.crd .tick{color:var(--field);font-size:12px}

/* pathways */
.paths{display:grid;grid-template-columns:repeat(auto-fit,minmax(258px,1fr));gap:14px}
.pth{border:1px solid var(--rule);background:var(--card);border-radius:12px;padding:15px 16px;box-shadow:var(--shadow)}
.pth h3{font-family:'Fraunces',Georgia,serif;font-size:17px;margin:0 0 5px;font-weight:600}
.pth p{font-size:12.5px;color:var(--ink-2);margin:0 0 11px;line-height:1.5}
.chain{display:flex;flex-wrap:wrap;gap:4px}
.chain button{font-family:'IBM Plex Mono',monospace;font-size:10px;border:1px solid var(--rule-2);
  background:var(--paper);color:var(--ink-2);border-radius:5px;padding:3px 6px;cursor:pointer}
.chain button:hover{background:var(--card-2);color:var(--ink)}
.chain button.done{background:var(--field);border-color:var(--field);color:#fff}

/* detail dialog */
.ovl{position:fixed;inset:0;background:rgba(10,8,6,.55);display:none;z-index:60;padding:clamp(12px,4vw,44px);overflow-y:auto}
.ovl.open{display:block}
.sheet{max-width:720px;margin:0 auto;background:var(--paper);border:1px solid var(--rule-2);
  border-radius:14px;padding:clamp(18px,3vw,30px);box-shadow:0 30px 70px -20px rgba(0,0,0,.55)}
.sheet h3{font-family:'Fraunces',Georgia,serif;font-size:clamp(21px,2.8vw,29px);font-weight:600;
  margin:12px 0 10px;line-height:1.16;letter-spacing:-.01em}
.sheet .lede2{font-size:14.5px;color:var(--ink-2);margin:0 0 20px;line-height:1.55}
.sh-lb{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;
  color:var(--ink-3);margin:20px 0 8px;display:block}
.mods{list-style:none;margin:0;padding:0;counter-reset:m}
.mods li{counter-increment:m;display:flex;gap:11px;padding:8px 0;border-top:1px solid var(--rule);font-size:13.5px;color:var(--ink-2)}
.mods li:first-child{border-top:0}
.mods li::before{content:counter(m,decimal-leading-zero);font-family:'IBM Plex Mono',monospace;
  font-size:10.5px;color:var(--field);font-weight:600;padding-top:3px}
.kv{display:flex;flex-direction:column}
.kv div{display:flex;justify-content:space-between;gap:14px;padding:7px 0;border-top:1px solid var(--rule);font-size:12.5px}
.kv div:first-child{border-top:0}
.kv .k{color:var(--ink-2)} .kv .v{color:var(--ink);text-align:right}
.tags{display:flex;flex-wrap:wrap;gap:5px}
.tags i{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.06em;
  text-transform:uppercase;padding:3px 7px;border-radius:11px;background:var(--card-2);
  border:1px solid var(--rule);color:var(--ink-2);line-height:1.35}
.sh-act{display:flex;gap:9px;margin-top:24px;padding-top:16px;border-top:1px solid var(--rule);flex-wrap:wrap}
.btn{border:1px solid var(--rule-2);background:var(--card);color:var(--ink);border-radius:8px;
  padding:9px 15px;font:inherit;font-size:13px;cursor:pointer}
.btn:hover{background:var(--card-2)}
.btn.primary{background:var(--field);border-color:var(--field);color:#fff;font-weight:600}
.btn:focus-visible{outline:2px solid var(--field);outline-offset:2px}
.legal{font-size:11.5px;line-height:1.65;color:var(--ink-3);padding:22px 0 46px}
.legal b{color:var(--ink-2)}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
'''

JS = r'''
var D = __DATA__;
var ITEMS = D.items, PILLARS = D.pillars, DOCTRINE = D.doctrine, PATHS = D.paths;
var LEVELS = D.levels, FW = D.fw;
var HUE = {}; PILLARS.forEach(function(p){ HUE[p.k] = p.hue; });
var NAME = {}; PILLARS.forEach(function(p){ NAME[p.k] = p.name; });
var BY = {}; ITEMS.forEach(function(x){ BY[x.id] = x; });
var LVL = {}; 
D.levels.forEach(function(l){ l.ids.forEach(function(i){ LVL[i] = l.n; }); });
var KEY = 'lx-curriculum-v1';
var done = {}; try{ done = JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ done = {}; }
var filter = 'all', q = '';

function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(done)); }catch(e){} }
function nDone(){ var n=0; for(var k in done) if(done[k]) n++; return n; }

function syncTop(){
  var n = nDone();
  document.getElementById('oc').textContent = n + ' / ' + ITEMS.length;
  document.getElementById('ob').style.width = (n/ITEMS.length*100) + '%';
  var s = document.getElementById('stDone'); if(s) s.textContent = n;
}

function cardHTML(x){
  return '<button class="crd' + (done[x.id]?' done':'') + '" data-open="' + x.id + '">'
    + '<span class="crd-h">'
    +   '<span class="pill" style="background:var(--hue-' + HUE[x.p] + ')">' + esc(x.p) + '</span>'
    +   '<span class="crd-id">' + esc(x.id) + '</span>'
    +   '<span class="crd-k">L' + LVL[x.id] + ' &middot; ' + esc(x.kind) + '</span>'
    + '</span>'
    + '<span class="crd-t">' + esc(x.t) + '</span>'
    + '<span class="crd-p">' + esc(x.promise) + '</span>'
    + '<span class="crd-f"><span class="dot ' + x.status + '"></span>'
    +   (x.status==='live' ? 'Content live in the Academy' : 'Designed &mdash; to be written')
    +   '<span style="margin-left:auto">' + x.mods.length + ' modules</span>'
    +   (done[x.id] ? '<span class="tick">&#10003;</span>' : '')
    + '</span></button>';
}
function renderGrid(){
  var qq = q.toLowerCase();
  var list = ITEMS.filter(function(x){
    if(filter !== 'all' && x.p !== filter) return false;
    if(!qq) return true;
    return (x.t + ' ' + x.promise + ' ' + x.mods.join(' ') + ' ' + x.id).toLowerCase().indexOf(qq) > -1;
  });
  document.getElementById('grid').innerHTML = list.map(cardHTML).join('')
    || '<p class="note" style="grid-column:1/-1">Nothing matches that.</p>';
  document.getElementById('cnt').textContent = list.length + (list.length===1?' item':' items');
}
function renderPaths(){
  document.getElementById('paths').innerHTML = PATHS.map(function(p){
    return '<div class="pth"><h3>' + esc(p.name) + '</h3><p>' + esc(p.blurb) + '</p>'
      + '<div class="chain">' + p.ids.map(function(id){
          return '<button data-open="' + id + '" class="' + (done[id]?'done':'') + '">' + esc(id) + '</button>';
        }).join('') + '</div>'
      + '<p style="margin:10px 0 0;font-size:11px;color:var(--ink-3)" class="mono">'
      + p.ids.filter(function(i){return done[i];}).length + ' / ' + p.ids.length + ' complete</p></div>';
  }).join('');
}

function openSheet(id){
  var x = BY[id]; if(!x) return;
  var pre = x.pre.length ? x.pre.map(function(p){
      return '<i>' + esc(p) + ' &middot; ' + esc(BY[p] ? BY[p].t : p) + '</i>'; }).join('') : '<i>None</i>';
  document.getElementById('sheet').innerHTML =
     '<span class="crd-h">'
   +   '<span class="pill" style="background:var(--hue-' + HUE[x.p] + ')">' + esc(x.p) + '</span>'
   +   '<span class="crd-id">' + esc(x.id) + ' &middot; ' + esc(NAME[x.p]) + '</span>'
   +   '<span class="crd-k">L' + LVL[x.id] + ' &middot; ' + esc(x.kind) + '</span>'
   + '</span>'
   + '<h3>' + esc(x.t) + '</h3>'
   + '<p class="lede2">' + esc(x.promise) + '</p>'
   + '<span class="sh-lb">Modules</span>'
   + '<ul class="mods">' + x.mods.map(function(m){ return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>'
   + '<span class="sh-lb">Doctrine this serves</span>'
   + '<div class="tags">' + x.doc.map(function(i){ return '<i>' + esc(DOCTRINE[i].t) + '</i>'; }).join('') + '</div>'
   + '<span class="sh-lb">Prerequisites</span><div class="tags">' + pre + '</div>'
   + '<span class="sh-lb">Detail</span>'
   + '<div class="kv">'
   +   '<div><span class="k">Lands on, in the platform</span><span class="v">' + esc(x.lands) + '</span></div>'
   +   '<div><span class="k">Status</span><span class="v">' + (x.status==='live'
         ? 'Live in the Academy' : 'Designed &mdash; lessons to be written') + '</span></div>'
   +   '<div><span class="k">Backed by</span><span class="v">' + (x.backs.length? esc(x.backs.join(', ')) : '&mdash;') + '</span></div>'
   +   '<div><span class="k">Level</span><span class="v">Level ' + LVL[x.id] + ' &mdash; ' + esc((LEVELS[LVL[x.id]-1]||{}).name) + '</span></div>'
   +   '<div><span class="k">Format</span><span class="v">' + esc(x.kind) + ', ' + x.mods.length + ' modules</span></div>'
   + '</div>'
   + '<div class="sh-act">'
   +   '<button class="btn primary" id="mark">' + (done[x.id] ? 'Mark not complete' : 'Mark complete') + '</button>'
   +   '<button class="btn" id="close">Close</button>'
   + '</div>';
  document.getElementById('mark').dataset.id = x.id;
  document.getElementById('ovl').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSheet(){
  document.getElementById('ovl').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('click', function(ev){
  var o = ev.target.closest && ev.target.closest('[data-open]');
  if(o){ openSheet(o.dataset.open); return; }
  if(ev.target.id === 'close' || ev.target.id === 'ovl'){ closeSheet(); return; }
  if(ev.target.id === 'mark'){
    var id = ev.target.dataset.id;
    done[id] = !done[id]; if(!done[id]) delete done[id];
    save(); syncTop(); renderGrid(); renderPaths(); renderLevels(); openSheet(id); return;
  }
  var f = ev.target.closest && ev.target.closest('[data-f]');
  if(f){
    filter = f.dataset.f;
    Array.prototype.forEach.call(document.querySelectorAll('[data-f]'), function(b){
      b.setAttribute('aria-pressed', b.dataset.f === filter); });
    renderGrid(); return;
  }
});
document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeSheet(); });
document.getElementById('srch').addEventListener('input', function(e){ q = e.target.value; renderGrid(); });
document.getElementById('reset').addEventListener('click', function(){
  done = {}; save(); syncTop(); renderGrid(); renderPaths(); renderLevels(); });

/* filter chips */
document.getElementById('filters').insertAdjacentHTML('afterbegin',
  '<button class="mb" data-f="all" aria-pressed="true">All 50</button>'
  + PILLARS.map(function(p){
      var n = ITEMS.filter(function(x){ return x.p === p.k; }).length;
      return '<button class="mb" data-f="' + p.k + '" aria-pressed="false">' + esc(p.k) + ' &middot; ' + n + '</button>';
    }).join(''));

/* doctrine list */
document.getElementById('doct').innerHTML = DOCTRINE.map(function(d, i){
  return '<li><span class="dn">' + (i+1) + '</span><div><b>' + esc(d.t) + '</b><span>' + esc(d.d) + '</span></div></li>';
}).join('');


/* levels */
function renderLevels(){
  document.getElementById('levels').innerHTML = LEVELS.map(function(l){
    var dn = l.ids.filter(function(i){ return done[i]; }).length;
    return '<div class="lvc"><div class="lvh">'
      + '<span class="lvn">Level ' + l.n + '</span>'
      + '<span class="lvt">' + esc(l.name) + '</span>'
      + '<span class="lvg mono">' + dn + ' / ' + l.ids.length + '</span></div>'
      + '<p class="lvb">' + esc(l.tag) + ' &mdash; ' + esc(l.blurb) + '</p>'
      + '<p class="lvgate"><b>Gate to the next level</b>' + esc(l.gate) + '</p>'
      + '<div class="chain">' + l.ids.map(function(id){
          return '<button data-open="' + id + '" class="' + (done[id]?'done':'') + '">' + esc(id) + '</button>';
        }).join('') + '</div></div>';
  }).join('');
}
/* frameworks */
document.getElementById('fws').innerHTML = FW.map(function(f){
  return '<div class="fw"><p class="fww" style="color:var(--hue-' + f.hue + ')">' + esc(f.word) + '</p>'
    + '<p class="fwn">' + esc(f.name) + '</p>'
    + '<p class="fwb">' + esc(f.blurb) + '</p>'
    + f.rows.map(function(r){
        return '<div class="fwr"><span class="fwl" style="color:var(--hue-' + f.hue + ')">' + esc(r.l) + '</span>'
          + '<span><b>' + esc(r.t) + '</b><span>' + esc(r.d) + '</span></span></div>';
      }).join('') + '</div>';
}).join('');

renderGrid(); renderPaths(); renderLevels(); syncTop();
'''
JS = JS.replace('__DATA__', DATA)

BODY = '''<div class="mh"><div class="mh-in">
  <span class="bd"><b>Locator.X</b> &nbsp;Learning Environment</span>
  <span class="sp"></span>
  <span class="ov"><span id="oc" class="mono">0 / 50</span><span class="ovb"><i id="ob" style="width:0%"></i></span></span>
  <button class="mb" id="reset">Reset</button>
</div></div>

<div class="wrap">
  <header class="hero">
    <p class="eyb">Locator.X Platform &middot; Custom Training</p>
    <h1>Fifty courses, on one foundation.</h1>
    <p class="lede">A complete real-estate curriculum &mdash; the numbers, the asset, the capital, the
    build and the evidence discipline underneath all of it. What holds it together is the pillar most
    programmes leave out: the relationships and the emotional equity that decide which deals you are
    shown, which terms you are offered, and who takes your call in a bad year.</p>
    <div class="by"><span class="bylb">Custom training by</span><span class="byn">Chris Barideaux</span>
    <!-- INSTRUCTOR BIO: paste a short bio here. Nothing is asserted about the instructor
         that was not supplied by the platform owner. --></div>
    <div class="stats">
      <div class="st"><b>50</b><span>Courses &amp; guides</span></div>
      <div class="st"><b>4</b><span>Levels &middot; 8 pillars</span></div>
      <div class="st"><b>209</b><span>Modules &middot; 4 frameworks</span></div>
      <div class="st"><b id="stDone">0</b><span>Marked complete</span></div>
    </div>
  </header>

  <section>
    <h2>The architecture</h2>
    <p class="note">Seven subject pillars rise from one foundation, and six doctrine principles run
    across all of them. Emotional equity is drawn as the slab rather than as a pillar because it is
    not a subject you finish &mdash; it is the thing every other subject is executed through.</p>
    <div class="figs">
      <div class="figbox">__ARCH__</div>
      <div class="figbox">__EQ__</div>
    </div>
    <div class="figbox" style="margin-top:18px;max-width:520px">__LEDG__</div>
    <div style="display:none">
    </div>
  </section>

  <section>
    <h2>The doctrine</h2>
    <p class="note">Every course resolves back to these. The sixth was added when relationships became
    a foundation rather than a footnote.</p>
    <ul class="doct" id="doct"></ul>
  </section>

  <section>
    <h2>The frameworks</h2>
    <p class="note">Four acronyms carry the whole curriculum. They are not decoration &mdash; each one is a
    working checklist an operator can run from memory, and the first spells the platform because it
    <em>is</em> the platform: every letter is a question Locator.X answers from the public record.</p>
    <div class="figbox" style="margin-bottom:18px">__LOC__</div>
    <div class="fws" id="fws"></div>
  </section>

  <section>
    <h2>Four levels, one gate each</h2>
    <p class="note">The fifty are sequenced into four levels. Each gate is a capability, not a course
    count &mdash; you are through when you can do the thing, and the emotional-equity courses are
    distributed across all four rather than finished at the start, because the account is never closed.</p>
    <div class="lv" id="levels"></div>
  </section>

  <section>
    <h2>Guided pathways</h2>
    <p class="note">Four routes through the fifty, each ordered so nothing arrives before what it
    depends on. Click any code to open it.</p>
    <div class="paths" id="paths"></div>
  </section>

  <section>
    <h2>The catalogue</h2>
    <p class="note">Filter by pillar or search titles, promises and module names. A green dot means the
    lesson content exists in the Locator.X Academy and opens there; a grey dot would mean an outline whose
    lessons are still to be written. All fifty now carry written lessons &mdash; 19 Academy tracks, 92
    lessons &mdash; so there are no grey dots left. Every card names the track it lands on.</p>
    <div class="filters" id="filters">
      <input class="srch" id="srch" type="search" placeholder="Search 50 courses&hellip;" aria-label="Search the catalogue">
      <span class="sp"></span><span class="mono" id="cnt" style="font-size:11px;color:var(--ink-3)"></span>
    </div>
    <div class="grid" id="grid"></div>
  </section>

  <p class="legal"><b>Original Locator.X material.</b> This curriculum covers subject matter that is
  standard in this field and taught widely; topic coverage is not ownable, the writing here is original,
  and nothing is copied, paraphrased at length, reskinned or adapted from any provider&rsquo;s syllabus,
  slides, video, book or programme. No university, business school, publisher, software vendor or course
  provider &mdash; named or unnamed, including any whose public course outline covers similar ground
  &mdash; has reviewed, endorsed, sponsored, or is affiliated with this material. Completing any part of
  it confers no accredited degree, diploma, licence or professional certification. Nothing here is legal,
  tax, securities or investment advice; construction, zoning and cost material is general education.
  Company and brand names are the trademarks of their respective owners. Progress is stored only in this
  browser.</p>
</div>

<div class="ovl" id="ovl"><div class="sheet" id="sheet"></div></div>'''

BODY = BODY.replace('__ARCH__', ARCH_SVG).replace('__EQ__', EQ_SVG).replace('__LOC__', LOC_SVG).replace('__LEDG__', LEDG_SVG)

page = ('<title>Locator.X Learning Environment</title>\n'
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
 'family=Fraunces:opsz,wght@9..144,400;9..144,600&'
 'family=IBM+Plex+Mono:wght@400;500;600&'
 'family=IBM+Plex+Sans:wght@400;500;600&display=swap">\n'
 '<style>' + CSS + '</style>\n' + BODY + '\n<script>\n' + JS + '\n</script>\n')
io.open(R + 'locator-x-learning-environment.html','w',encoding='utf-8').write(page)
print('written', len(page))
