/* locator.x - the Investment Standard, shown.
   ----------------------------------------------------------------------------
   Two views of the same spec. On a property: every requirement with its status
   and, where it is not met, the sentence saying why in the reader's terms. On
   the edition: how many properties clear the whole standard, which requirements
   do the rejecting, and - the number nobody else prints - how much of the
   standard can even be TESTED against the record this county publishes. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }

var DOT = {meets:'var(--good)', fails:'var(--bad)', unknown:'var(--muted)'};
var WORD = {meets:'meets', fails:'fails', unknown:'not published'};
/* shape as well as colour, so status never rests on colour alone */
var MARK = {meets:'●', fails:'■', unknown:'○'};

function drawer(l, uw){
  var A; try{ A = window.LXStd && LXStd.assess(l, uw); }catch(e){ return ''; }
  if(!A) return '';
  var byCat = {};
  A.rows.forEach(function(r){ (byCat[r.cat] = byCat[r.cat] || []).push(r); });
  var pctTxt = A.pct == null ? '—' : Math.round(A.pct * 100) + '%';
  var col = A.pct == null ? 'var(--muted)' : A.pct >= 0.8 ? 'var(--good)' : A.pct >= 0.5 ? 'var(--warn)' : 'var(--bad)';

  var h = '<div class="sect"><p class="eyebrow" style="margin:0 0 4px">Investment standard v' + LXStd.VERSION + '</p>'
    + '<div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px">'
    + '<b style="font-size:15px;color:' + col + '">' + A.meets + ' of ' + A.known + ' testable requirements met</b>'
    + '<span style="font-size:12px;color:var(--muted)">' + pctTxt + ' of what can be checked'
    + (A.unknown ? ' · <b>' + A.unknown + ' of ' + A.total + ' cannot be checked at all</b> on this county’s record' : '')
    + '</span></div>';

  (window.LXStd.CATS || []).forEach(function(c){
    var rs = byCat[c.id]; if(!rs || !rs.length) return;
    h += '<div style="margin:6px 0 2px"><span style="font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)">'
      + esc(c.name) + '</span></div>';
    rs.forEach(function(r){
      h += '<div style="display:flex;gap:7px;align-items:flex-start;font-size:12.5px;line-height:1.55;padding:1px 0">'
        + '<span style="color:' + DOT[r.status] + ';flex:none;font-size:11px;line-height:1.7">' + MARK[r.status] + '</span>'
        + '<span style="flex:1;min-width:0"><b>' + esc(r.name) + '</b> <span style="color:var(--muted)">' + WORD[r.status] + '</span>'
        + (r.why ? '<div style="color:var(--ink2);font-size:11.5px">' + esc(r.why) + '</div>' : '')
        + '</span></div>';
    });
  });
  h += '<p style="font-size:11.5px;color:var(--muted);margin:7px 0 0"><b>A requirement that cannot be checked is '
    + 'not a pass and not a fail.</b> Where a county publishes no year, no area or no use code, this says so rather '
    + 'than scoring the gap. Nothing in this standard concerns who lives anywhere: every test is about the building, '
    + 'the money or the record.</p></div>';
  return h;
}

/* ---- the edition rollup, as a page ------------------------------------- */
function render(){
  var host = $('#stdroot'); if(!host) return;
  var R; try{ R = LXStd.rollup(); }catch(e){ R = null; }
  if(!R){ host.innerHTML = '<div class="chart"><p style="font-size:13.5px;color:var(--ink2);margin:0">'
    + 'Nothing is loaded to assess yet.</p></div>'; return; }
  var X = L();
  var h = '<div class="tiles" style="margin-bottom:14px">'
    + tile('Clear the whole standard', X.fmtN(R.full),
           'of ' + X.fmtN(R.n) + ' assessed — no failed requirement')
    + tile('Assessed', X.fmtN(R.n), 'stride sample of ' + X.fmtN(R.sampled) + ' filtered records')
    + tile('Testable on this record', Math.round(R.meanConfidence * 100) + '%',
           'the average share of the standard this county’s schema can answer')
    + tile('Requirements', String((LXStd.REQS || []).length), 'in ' + ((LXStd.CATS||[]).length) + ' categories, version ' + LXStd.VERSION)
    + '</div>';

  /* the distribution is the useful screen when nothing clears everything */
  if(R.dist && R.dist.length){
    var cum = 0, bars = [];
    for(var k = 0; k < Math.min(R.dist.length, 7); k++){
      cum += R.dist[k];
      bars.push({k:k, n:R.dist[k], cum:cum});
    }
    h += '<div class="chart"><p class="eyebrow">How close properties get</p>'
      + '<h3 style="margin:2px 0 6px">'
      + (R.full ? X.fmtN(R.full) + ' properties fail nothing' : 'No property in this edition fails nothing')
      + '</h3>'
      + '<p style="font-size:13px;color:var(--ink2);max-width:86ch;margin:0 0 10px">'
      + (R.full ? '' : '<b>That is a finding, not a bug.</b> ')
      + 'A pass/fail line that nothing crosses ranks nothing, so what matters is the distribution: how many '
      + 'requirements a property misses. Two failures on a market&rsquo;s own terms is a different property from '
      + 'seven, and the sortable screens elsewhere in this app are built on that difference.</p>'
      + '<div class="tablewrap"><table class="tbl"><thead><tr><th>Requirements failed</th>'
      + '<th class="r">Properties</th><th class="r">Cumulative</th><th>Share</th></tr></thead><tbody>'
      + bars.map(function(b2){
          return '<tr><td><b>' + (b2.k === 0 ? 'none' : b2.k) + '</b></td>'
            + '<td class="r">' + X.fmtN(b2.n) + '</td>'
            + '<td class="r">' + X.fmtN(b2.cum) + '</td>'
            + '<td><div style="height:9px;border-radius:3px;background:var(--panel2);min-width:120px">'
            + '<i style="display:block;height:9px;border-radius:3px;width:' + (b2.n/R.n*100).toFixed(1) + '%;background:'
            + (b2.k <= 1 ? 'var(--good)' : b2.k <= 3 ? 'var(--warn)' : 'var(--bad)') + '"></i></div></td></tr>';
        }).join('')
      + '</tbody></table></div></div>';
  }

  h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">Requirement by requirement</p>'
    + '<h3 style="margin:2px 0 6px">What passes, what rejects, and what this county does not publish</h3>'
    + '<p style="font-size:13px;color:var(--ink2);max-width:86ch;margin:0 0 10px">The third column is the one worth '
    + 'reading. A requirement with a large <b>not published</b> share is not screening anything here — it is silent, '
    + 'and a tool that folded it into "fail" would be rejecting properties for a gap in a county schema rather than '
    + 'for anything about the property.</p>'
    + '<div class="tablewrap"><table class="tbl"><thead><tr><th>Requirement</th><th>Category</th>'
    + '<th class="r">Meets</th><th class="r">Fails</th><th class="r">Not published</th><th>Share</th></tr></thead><tbody>';
  (LXStd.REQS || []).forEach(function(r){
    var p = R.per[r.id]; if(!p) return;
    var tot = p.meets + p.fails + p.unknown || 1;
    var cat = (LXStd.CATS.find ? LXStd.CATS.find(function(c){ return c.id === r.cat; }) : null);
    h += '<tr><td class="wrap" style="max-width:300px"><b>' + esc(r.name) + '</b><div style="font-size:11px;color:var(--muted)">' + esc(r.want) + '</div></td>'
      + '<td style="font-size:12px">' + esc(cat ? cat.name : r.cat) + '</td>'
      + '<td class="r">' + X.fmtN(p.meets) + '</td>'
      + '<td class="r">' + X.fmtN(p.fails) + '</td>'
      + '<td class="r"' + (p.unknown / tot > 0.5 ? ' style="color:var(--warn);font-weight:700"' : '') + '>'
      + X.fmtN(p.unknown) + '</td>'
      + '<td style="min-width:150px"><div style="display:flex;height:9px;border-radius:3px;overflow:hidden;background:var(--panel2)">'
      + '<i style="width:' + (p.meets/tot*100).toFixed(1) + '%;background:var(--good)"></i>'
      + '<i style="width:' + (p.fails/tot*100).toFixed(1) + '%;background:var(--bad)"></i>'
      + '<i style="width:' + (p.unknown/tot*100).toFixed(1) + '%;background:var(--line2)"></i>'
      + '</div></td></tr>';
  });
  h += '</tbody></table></div>'
    + '<p class="src">Green meets, red fails, grey is a requirement this county’s published record cannot answer '
    + 'either way. The three always sum to the assessed count.</p></div>';

  h += '<div class="chart" style="margin-top:14px"><p class="eyebrow">The standard itself</p>'
    + '<h3 style="margin:2px 0 8px">Written down so it can be argued with</h3>'
    + '<div style="font-size:13.5px;color:var(--ink2);line-height:1.8;max-width:86ch">'
    + '<p style="margin:0 0 8px">A screening tool that will not say what it screens for is asking to be trusted '
    + 'rather than checked. These are the requirements, in plain terms, with their thresholds. Disagree with a '
    + 'threshold and the honest response is to change it, not to hide it.</p>'
    + (LXStd.CATS || []).map(function(c){
        var rs = (LXStd.REQS || []).filter(function(r){ return r.cat === c.id; });
        return '<p style="margin:0 0 6px"><b>' + esc(c.name) + '</b> — ' + esc(c.blurb) + '<br>'
          + rs.map(function(r){ return '<span style="color:var(--muted)">' + esc(r.name) + ':</span> ' + esc(r.want); }).join('<br>')
          + '</p>';
      }).join('')
    + '<p style="margin:8px 0 0"><b>No requirement here concerns who lives anywhere.</b> Race, ethnicity, national '
    + 'origin, income, household composition, school ratings and crime statistics are the classic proxies for '
    + 'protected class in a property-targeting tool, and this platform holds none of them. Every test above is about '
    + 'the building, the money or the published record.</p>'
    + '</div></div>';

  host.innerHTML = h;
  if(window.LXPanels) setTimeout(function(){ LXPanels.scan('standard'); }, 140);
}
function tile(k, v, note){
  return '<div class="tile"><p class="eyebrow" style="margin:0">' + esc(k) + '</p>'
    + '<p class="big num" style="margin:4px 0 2px">' + v + '</p>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:0">' + esc(note) + '</p></div>';
}

window.LXStdViz = {render: render, drawer: drawer};
})();
