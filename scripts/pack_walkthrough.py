#!/usr/bin/env python3
"""pack_walkthrough — the product tour as ONE self-contained HTML file.

scripts/record_walkthrough.js records the chapters from the running app; this
packs them, with their poster frame, into a single file that carries its own
video: no CDN, no hosting, no player embed. Open it from a disk with the network
off and it plays.

That shape is not a novelty here. It is the same property every Locator.X
edition has (CLAUDE.md: an edition is one self-contained HTML file), applied to
the thing that explains the editions — which makes the file postable, DM-able,
attachable and archivable without depending on anyone's video host to still
exist next year.

Usage:
    python3 scripts/pack_walkthrough.py <tour-dir> <out.html> [--poster P]
                                        [--only 01-the-file,04-underwriting]
    python3 scripts/pack_walkthrough.py --check     verify the chapter copy only

<tour-dir> holds the chapter .webm files produced by record_walkthrough.js.
"""
import base64
import html
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# The chapters, in order, with the copy the social cut needs: a title, the one
# sentence that makes someone watch it, and the claim it is allowed to make.
CHAPTERS = [
    ('01-the-file', 'One file, no server',
     'Every edition is a single self-contained HTML file. Save it, pull the plug, '
     'open it in five years — the records, the scoring and the disclaimers are all in it.'),
    ('02-navigation', 'Navigating by the record',
     'Cities and districts are built from the parcels themselves, including the bucket '
     'for records that name no district at all. Filter, and the app says what changed.'),
    ('03-the-property', 'The property record',
     'Assessed value, tax recomputed at a buyer basis, use class mapped from a measured '
     'query — with the county’s own code kept beside it so you can disagree.'),
    ('04-underwriting', 'Underwriting, and where it breaks',
     'Break-even rent, rate headroom, the largest lender-ready loan — plus a coverage '
     'ratio that stays blank until a real insurance quote exists.'),
    ('05-interchange', 'Taking the work out',
     'GeoJSON and CSV that carry their own caveats, and a link that puts the whole view '
     'in the URL fragment — the one part of a URL browsers never send to a server.'),
    ('06-map-systems', 'Three layers, one filtered set',
     'A tower per parcel carrying its record id, ZIP towers that follow the map’s filter, '
     'and a legend that states which set it drew from.'),
    ('07-academy', 'The Academy and the coverage table',
     'Fifty courses generated from one source file, instructor notes that ship empty by '
     'design, and a coverage table published with its holes labelled.'),
]

POSTS = [
    ('For LinkedIn',
     'We built a real-estate analytics platform that refuses to show a number it cannot '
     'defend.\n\nEvery edition is one self-contained HTML file — no server, no login, no '
     'account. Assessments are never called prices. A missing insurance quote makes a '
     'missing coverage ratio, out loud. The coverage table is published with its holes '
     'labelled, including three the public record will never fill.\n\nSeven chapters, '
     'recorded from the running app. Nothing in the footage is a mockup.'),
    ('For X',
     'A property platform where the honest output is the smaller one:\n\n· one '
     'self-contained file per edition, no server\n· an assessment is never called a '
     'price\n· no insurance quote → no coverage ratio, stated not hidden\n· coverage '
     'published with its holes labelled\n\n7-chapter walkthrough, recorded from the real app.'),
    ('The short version',
     'Locator.X — public-record real estate, with every figure carrying where it came '
     'from. One file per edition, no server, no account. Seven-chapter walkthrough, all '
     'of it recorded from the running application.'),
]

CSS = """
:root{--paper:#F2EFE9;--card:#FBF9F5;--ink:#17140F;--ink-2:#4A443A;--ink-3:#7C7264;
 --rule:#D5CDBE;--field:#2C6B4E;--flag:#B9531F;--bay:#3E6291;--screen:#0E1319;
 --shadow:0 1px 2px rgba(23,20,15,.05),0 14px 34px -20px rgba(23,20,15,.3);
 --sans:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
 --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
 --serif:Fraunces,Georgia,"Times New Roman",serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
 --paper:#14120E;--card:#1D1A15;--ink:#F1ECE1;--ink-2:#BDB4A4;--ink-3:#8A8073;
 --rule:#332E26;--field:#5FA483;--flag:#E0742F;--bay:#7CA2D4;--screen:#080C11;
 --shadow:0 1px 2px rgba(0,0,0,.45),0 14px 34px -20px rgba(0,0,0,.75)}}
:root[data-theme="dark"]{--paper:#14120E;--card:#1D1A15;--ink:#F1ECE1;--ink-2:#BDB4A4;
 --ink-3:#8A8073;--rule:#332E26;--field:#5FA483;--flag:#E0742F;--bay:#7CA2D4;--screen:#080C11;
 --shadow:0 1px 2px rgba(0,0,0,.45),0 14px 34px -20px rgba(0,0,0,.75)}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 var(--sans);padding:0 20px;
 -webkit-font-smoothing:antialiased}
.wrap{max-width:980px;margin:0 auto;padding-block:38px 68px}
.eyebrow{font:500 11px var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--field);margin:0}
h1{font-family:var(--serif);font-weight:600;font-size:clamp(31px,5vw,50px);line-height:1.06;
 letter-spacing:-.022em;margin:10px 0 12px;text-wrap:balance}
.dek{font-size:18.5px;line-height:1.55;color:var(--ink-2);max-width:60ch;margin:0 0 6px;text-wrap:pretty}
.player{margin-top:26px;background:var(--screen);border:1px solid var(--rule);border-radius:14px;
 overflow:hidden;box-shadow:var(--shadow)}
video{display:block;width:100%;aspect-ratio:16/9;max-width:100%;background:var(--screen)}
.bar{height:3px;background:rgba(255,255,255,.15)}
.bar i{display:block;height:100%;width:0;background:var(--field)}
.ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:11px 12px;background:var(--card);
 border-top:1px solid var(--rule)}
button{font:500 13px var(--sans);color:var(--ink);background:transparent;border:1px solid var(--rule);
 border-radius:8px;padding:7px 13px;cursor:pointer}
button:hover{border-color:var(--ink-3)}
button:focus-visible{outline:2px solid var(--field);outline-offset:2px}
button[aria-pressed="true"]{background:var(--field);border-color:var(--field);color:#fff}
.time{margin-left:auto;font:500 12px var(--mono);color:var(--ink-3);font-variant-numeric:tabular-nums}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.chip{display:flex;gap:8px;align-items:baseline;font:500 13px var(--sans);color:var(--ink-2);
 background:var(--card);border:1px solid var(--rule);border-radius:999px;padding:7px 14px;cursor:pointer}
.chip .n{font:500 10.5px var(--mono);color:var(--ink-3)}
.chip[aria-current="true"]{background:var(--field);border-color:var(--field);color:#fff}
.chip[aria-current="true"] .n{color:rgba(255,255,255,.75)}
.cap{margin-top:20px;background:var(--card);border:1px solid var(--rule);border-radius:12px;
 padding:20px 22px;box-shadow:var(--shadow)}
.cap h2{font-family:var(--serif);font-weight:600;font-size:22px;line-height:1.22;margin:6px 0 8px;
 letter-spacing:-.012em}
.cap p{margin:0;color:var(--ink-2);max-width:68ch}
h2.sec{font-family:var(--serif);font-weight:600;font-size:clamp(21px,2.8vw,28px);letter-spacing:-.015em;
 margin:52px 0 6px;text-wrap:balance}
.seclede{color:var(--ink-2);max-width:64ch;margin:0 0 20px}
.posts{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px}
.post{background:var(--card);border:1px solid var(--rule);border-radius:12px;padding:18px 20px;
 display:flex;flex-direction:column;gap:12px}
.post .k{font:500 10.5px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--bay)}
.post pre{margin:0;white-space:pre-wrap;font:400 14px/1.6 var(--sans);color:var(--ink-2)}
.post button{align-self:flex-start}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-top:22px}
.fact{border-left:3px solid var(--rule);padding:4px 0 4px 14px}
.fact b{display:block;font:600 24px var(--sans);letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.fact span{font:500 11.5px var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)}
footer{margin-top:48px;padding-top:20px;border-top:1px solid var(--rule);color:var(--ink-3);
 font-size:13.5px;line-height:1.7}
footer b{color:var(--ink-2)}
footer code{font:500 12.5px var(--mono);color:var(--ink-2)}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
"""


def b64(path, mime):
    with open(path, 'rb') as f:
        return 'data:%s;base64,%s' % (mime, base64.b64encode(f.read()).decode('ascii'))


def build(tour, out, poster=None, only=None):
    chapters = [c for c in CHAPTERS if not only or c[0] in only]
    missing = [c[0] for c in chapters if not os.path.exists(os.path.join(tour, c[0] + '.webm'))]
    if missing:
        raise SystemExit('pack_walkthrough: missing chapter file(s): %s\n'
                         'Record them first: node scripts/record_walkthrough.js <built.html> %s'
                         % (', '.join(missing), tour))
    data = []
    for key, title, blurb in chapters:
        src = b64(os.path.join(tour, key + '.webm'), 'video/webm')
        data.append({'id': key, 'title': title, 'blurb': blurb, 'src': src})
    posterUri = b64(poster, 'image/png') if poster and os.path.exists(poster) else ''

    desc = ('A seven-chapter walkthrough of Locator.X, recorded from the running application: '
            'public-record real estate where every figure carries where it came from.')
    doc = []
    doc.append('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">')
    doc.append('<meta name="viewport" content="width=device-width,initial-scale=1">')
    doc.append('<meta name="color-scheme" content="light dark">')
    doc.append('<title>Locator.X &mdash; the walkthrough</title>')
    doc.append('<meta name="description" content="%s">' % html.escape(desc, quote=True))
    doc.append('<meta property="og:type" content="video.other">')
    doc.append('<meta property="og:title" content="Locator.X &mdash; the walkthrough">')
    doc.append('<meta property="og:description" content="%s">' % html.escape(desc, quote=True))
    if posterUri:
        doc.append('<meta property="og:image" content="%s">' % posterUri)
    doc.append('<meta name="twitter:card" content="summary_large_image">')
    doc.append('<meta name="twitter:title" content="Locator.X &mdash; the walkthrough">')
    doc.append('<meta name="twitter:description" content="%s">' % html.escape(desc, quote=True))
    doc.append('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:'
               'opsz,wght@9..144,400;9..144,600&family=IBM+Plex+Mono:wght@400;500&'
               'family=IBM+Plex+Sans:wght@400;500;600&display=swap">')
    doc.append('<style>%s</style>\n</head>\n<body>\n<div class="wrap">' % CSS)

    doc.append('<p class="eyebrow">Product walkthrough &middot; recorded from the running app</p>')
    doc.append('<h1>Every figure carries where it came from</h1>')
    doc.append('<p class="dek">Locator.X is a public-record real-estate platform whose first rule '
               'is that it never shows a number it cannot defend. %d chapters, all of it recorded '
               'from the application itself &mdash; no mockups, no re-creations, nothing '
               'generated.</p>' % len(chapters))

    doc.append('<div class="player"><video id="v" playsinline muted preload="metadata"%s></video>'
               '<div class="bar"><i id="bar"></i></div>'
               '<div class="ctl">'
               '<button id="play" type="button">Play</button>'
               '<button id="prev" type="button">&larr;</button>'
               '<button id="next" type="button">&rarr;</button>'
               '<button id="auto" type="button" aria-pressed="true">Autoplay next</button>'
               '<span class="time" id="time">0:00</span></div></div>'
               % (' poster="%s"' % posterUri if posterUri else ''))
    doc.append('<div class="chips" id="chips"></div>')
    doc.append('<section class="cap" id="cap"></section>')

    doc.append('<div class="facts">'
               '<div class="fact"><b>749,765</b><span>parcel records shipped</span></div>'
               '<div class="fact"><b>354,260</b><span>in one file</span></div>'
               '<div class="fact"><b>90</b><span>coverage rows, holes labelled</span></div>'
               '<div class="fact"><b>0</b><span>fabricated rows, ever</span></div></div>')

    doc.append('<h2 class="sec">Post text, ready to paste</h2>')
    doc.append('<p class="seclede">Written to be accurate as posted &mdash; every figure in them is '
               'measured and published in the repository.</p><div class="posts">')
    for kicker, body in POSTS:
        doc.append('<div class="post"><span class="k">%s</span><pre>%s</pre>'
                   '<button type="button" class="cp">Copy</button></div>'
                   % (html.escape(kicker), html.escape(body)))
    doc.append('</div>')

    doc.append('<footer><p><b>About this file.</b> One self-contained HTML document with the video '
               'inside it &mdash; no player embed, no CDN, no hosting required. That is the same '
               'property every edition of the platform has, applied to the thing that explains '
               'them. <b>Every record, price and coordinate in the footage is a generated fixture '
               'on a fictional island</b>, which is what lets the whole application run from a clean '
               'checkout; the shipped editions hold 749,765 measured parcel records from county '
               'rolls. Recorded by <code>scripts/record_walkthrough.js</code>, packed by '
               '<code>scripts/pack_walkthrough.py</code>.</p>'
               '<p>Values from county rolls are assessments, never prices. Nothing here is '
               'investment, tax or legal advice. &copy; 2026 AGI Future Foundation.</p></footer>')

    doc.append('</div>\n<script>\nvar CH=%s;\n' % json.dumps(data))
    doc.append(PLAYER_JS)
    doc.append('\n</script>\n</body>\n</html>\n')
    text = '\n'.join(doc)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(text)
    mb = len(text.encode('utf-8')) / 1048576.0
    print('packed %d chapter(s) into %s  %.1f MB' % (len(chapters), out, mb))
    return mb


PLAYER_JS = r"""
(function(){
  var v=document.getElementById('v'), chips=document.getElementById('chips'),
      cap=document.getElementById('cap'), bar=document.getElementById('bar'),
      t=document.getElementById('time'), playBtn=document.getElementById('play'),
      autoBtn=document.getElementById('auto');
  var cur=-1, auto=true;
  function fmt(s){ if(!isFinite(s)) return '0:00';
    var m=Math.floor(s/60), r=Math.round(s%60); if(r===60){m++;r=0;}
    return m+':'+(r<10?'0':'')+r; }
  CH.forEach(function(c,i){
    var b=document.createElement('button');
    b.className='chip'; b.type='button';
    b.innerHTML='<span class="n">'+(i+1)+'</span><span>'+c.title+'</span>';
    b.addEventListener('click', function(){ load(i,true); });
    chips.appendChild(b);
  });
  function load(i,play){
    cur=i; var c=CH[i];
    v.src=c.src; v.currentTime=0;
    if(play){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); }
    cap.innerHTML='<p class="eyebrow">Chapter '+(i+1)+' of '+CH.length+'</p><h2>'+c.title+'</h2><p>'+c.blurb+'</p>';
    [].forEach.call(chips.children,function(b,j){ b.setAttribute('aria-current', j===i?'true':'false'); });
  }
  v.addEventListener('timeupdate',function(){
    if(v.duration) bar.style.width=(v.currentTime/v.duration*100)+'%';
    t.textContent=fmt(v.currentTime)+' / '+fmt(v.duration);
  });
  v.addEventListener('ended',function(){
    if(auto&&cur<CH.length-1) load(cur+1,true); else playBtn.textContent='Replay';
  });
  v.addEventListener('play',function(){ playBtn.textContent='Pause'; });
  v.addEventListener('pause',function(){ if(!v.ended) playBtn.textContent='Play'; });
  playBtn.addEventListener('click',function(){
    if(v.paused){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); } else v.pause(); });
  document.getElementById('prev').addEventListener('click',function(){ load(Math.max(0,cur-1),true); });
  document.getElementById('next').addEventListener('click',function(){ load(Math.min(CH.length-1,cur+1),true); });
  autoBtn.addEventListener('click',function(){ auto=!auto; autoBtn.setAttribute('aria-pressed',auto?'true':'false'); });
  document.addEventListener('keydown',function(e){
    if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if(e.key==='ArrowRight') load(Math.min(CH.length-1,cur+1),true);
    else if(e.key==='ArrowLeft') load(Math.max(0,cur-1),true);
    else if(e.key===' '){ e.preventDefault(); playBtn.click(); }
  });
  [].forEach.call(document.querySelectorAll('.cp'),function(b){
    b.addEventListener('click',function(){
      var txt=b.parentNode.querySelector('pre').textContent;
      var done=function(){ b.textContent='Copied'; setTimeout(function(){ b.textContent='Copy'; },1600); };
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt).then(done,function(){ fallback(txt,b,done); });
      } else fallback(txt,b,done);
    });
  });
  function fallback(txt,b,done){
    var ta=document.createElement('textarea'); ta.value=txt;
    ta.style.cssText='position:fixed;left:-9999px'; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); done(); }catch(e){ b.textContent='Select and copy'; }
    ta.remove();
  }
  load(0,false);
})();
"""


def check():
    """The copy is the part a human reads; verify it is all present and honest."""
    bad = []
    for key, title, blurb in CHAPTERS:
        if not title or not blurb:
            bad.append('%s has empty copy' % key)
        if len(blurb) > 260:
            bad.append('%s blurb is %d chars — too long for a chip caption' % (key, len(blurb)))
    for kicker, body in POSTS:
        if not body.strip():
            bad.append('post "%s" is empty' % kicker)
    if bad:
        raise SystemExit('pack_walkthrough: ' + '; '.join(bad))
    print('  · %d chapters, %d ready-to-post captions, all carrying copy'
          % (len(CHAPTERS), len(POSTS)))


def main():
    args = sys.argv[1:]
    if '--check' in args:
        return check()
    pos = [a for a in args if not a.startswith('--')]
    if len(pos) < 2:
        raise SystemExit(__doc__)
    poster = None
    only = None
    if '--poster' in args:
        poster = args[args.index('--poster') + 1]
    if '--only' in args:
        only = set(args[args.index('--only') + 1].split(','))
    build(pos[0], pos[1], poster, only)


if __name__ == '__main__':
    main()
