/* locator.x — the desk worksheet panel: bring a standalone analysis into the app.

   The companion underwriting worksheet (pages/locator-x-underwriting-worksheet.html)
   runs the per-class arithmetic on numbers a person typed at their desk and exports
   the whole thing — inputs, outputs, the missing-required list, the disclaimer — as
   one JSON record. This panel lets that record travel INTO an edition: load the file
   on the Underwriting tab and see it beside the record-driven pipeline.

   What it deliberately does NOT do: touch the app's own underwriting. Desk numbers
   are typed, not derived from the public record, so they render read-only under
   that exact caveat — merging them into the record-driven sheet silently would
   launder a guess into the record's voice. If the export carried unknowns, the
   panel says so with the missing fields named, because the count of unanswerable
   questions travels with every result here.

   Dependency-free on purpose (plain DOM + FileReader): it renders in any context
   that carries its container, and its absence breaks nothing. */
(function(){
'use strict';

function boot(){
  var root = document.getElementById('deskwsroot');
  if(!root){ return; } // edition without the container — nothing to do
  var esc = function(s){ var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; };
  var fmt$ = function(n){ return (n == null || !isFinite(n)) ? 'unknown' : '$' + Math.round(n).toLocaleString(); };

  root.innerHTML =
    '<div class="tile" style="margin:14px 0">' +
      '<p class="eyebrow">Desk worksheet — typed at the desk, not derived from the record</p>' +
      '<p style="font-size:12.5px;color:var(--muted);max-width:76ch;margin:4px 0 8px">Load a JSON export from the ' +
        'standalone underwriting worksheet to see that analysis beside the record-driven pipeline. It stays ' +
        'read-only: desk numbers were typed by a person, so they never overwrite anything this tab computed ' +
        'from the record.</p>' +
      '<input type="file" id="deskwsfile" accept=".json,application/json" aria-label="Load a desk worksheet JSON export">' +
      '<div id="deskwsout" style="margin-top:10px"></div>' +
    '</div>';

  var out = document.getElementById('deskwsout');
  document.getElementById('deskwsfile').addEventListener('change', function(ev){
    var f = ev.target.files && ev.target.files[0];
    if(!f) return;
    var r = new FileReader();
    r.onload = function(){
      var rec;
      try{ rec = JSON.parse(r.result); }
      catch(e){ out.innerHTML = '<p style="color:var(--muted);font-size:13px">Not valid JSON: ' + esc(e.message) + '</p>'; return; }
      if(!rec || rec.worksheet !== 'Locator.X per-class underwriting' || !rec.inputs || !rec.outputs){
        out.innerHTML = '<p style="color:var(--muted);font-size:13px">This file is not a Locator.X underwriting worksheet export.</p>';
        return;
      }
      var o = rec.outputs, miss = o.missing_required || [];
      var dscr = (o.dscr == null || !isFinite(o.dscr)) ? 'unknown' : Number(o.dscr).toFixed(2);
      var rows = Object.keys(rec.inputs).filter(function(k){ return rec.inputs[k] != null; })
        .map(function(k){ return '<tr><td>' + esc(k) + '</td><td style="text-align:right;font-family:var(--mono)">' + esc(String(rec.inputs[k])) + '</td></tr>'; })
        .join('');
      out.innerHTML =
        (miss.length
          ? '<p style="font-size:13px;color:var(--muted);border:1px dashed var(--line2);border-radius:8px;padding:8px 10px">' +
            '<b>Carries unknowns.</b> The desk left these blank, so its results are unknown, not zero: ' + miss.map(esc).join(', ') + '.</p>'
          : '') +
        '<div style="display:flex;gap:18px;flex-wrap:wrap;align-items:baseline;margin:6px 0 8px">' +
          '<span><b style="font-size:22px;font-family:var(--mono)">' + dscr + '</b> <span style="font-size:11px;color:var(--muted)">DSCR (desk)</span></span>' +
          '<span style="font-size:13px;color:var(--muted)">' + esc(rec.asset_class || '') + ' · exported ' + esc(String(rec.generated || '').slice(0, 10)) + '</span>' +
        '</div>' +
        '<table style="font-size:12.5px;border-collapse:collapse">' +
          '<tr><td style="padding-right:14px">NOI</td><td style="text-align:right;font-family:var(--mono)">' + fmt$(o.noi) + '</td></tr>' +
          '<tr><td>Annual debt service</td><td style="text-align:right;font-family:var(--mono)">' + fmt$(o.annual_debt_service) + '</td></tr>' +
        '</table>' +
        '<details style="margin-top:8px;font-size:12.5px"><summary style="cursor:pointer;color:var(--muted)">Every input the desk typed (' +
          (rows.split('<tr>').length - 1) + ')</summary><table style="border-collapse:collapse;margin-top:4px">' + rows + '</table></details>' +
        '<p style="font-size:11.5px;color:var(--muted);margin:8px 0 0">' + esc(rec.disclaimer || '') + '</p>';
    };
    r.readAsText(f);
  });
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
