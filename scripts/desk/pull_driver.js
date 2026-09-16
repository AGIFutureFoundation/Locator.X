/* locator.x — the desk-browser pull driver.
   ----------------------------------------------------------------------------
   WHY THIS IS A FILE AND NOT A CODE BLOCK IN A MARKDOWN DOC.

   Container egress to every county GIS host is policy-blocked (the gateway
   answers 403 to CONNECT for every host, re-measured 2026-09-16), so the only
   route to the public record is a browser on a machine that HAS egress — the
   desk browser. That protocol used to live entirely as prose in
   docs/PULL_RECIPE.md: paste this driver, poll that expression, pack with gzip,
   slice at 240,000 characters, then reassemble with a script at
   /root/bayarea/grab.py. Two problems with that. The driver was retyped by hand
   every session, so it could not be fixed once and stay fixed; and grab.py was
   never in the repository and no longer exists anywhere, so an operator
   following the recipe today fails at the transfer step with a missing file.

   This is that driver, versioned. It is deliberately ONE self-contained blob
   with no imports and no build step, because the way it gets into a page is a
   copy-paste or a javascript_exec call, and anything requiring a module loader
   could not be pasted. It sets the same window globals the recipe has always
   polled (LXPULL, lxrun, lxpack), so the recipe's poll lines keep working.

   WHAT IT REFUSES TO DO, which is the point:

     - It will not launch a pull whose requested field list contains an owner or
       fiduciary name field. PII is stripped on ingest everywhere else in this
       repository; here it is refused BEFORE it crosses the bridge, because the
       cheapest place to not have PII is to never have fetched it. The refusal
       names the offending field rather than dropping it silently — an operator
       who asked for a field and got rows back without it would reasonably
       assume the county does not publish it.
     - It will not report a partial pull as a complete one. Any page error ends
       the run with the error recorded, `done` true and `ok` FALSE, and the rows
       it did collect stay readable so the operator can see how far it got — but
       the ingest side refuses an envelope whose ok is false.
     - It will not invent a coordinate. A feature with no usable geometry gets a
       null lat/lng pair, never a zero and never the centre of the county.

   Every number it reports about itself — row count, page count, byte length —
   is counted, and the ingest side recounts all three independently. */
(function () {
  'use strict';

  var VERSION = '1.0.0';

  /* Field names that carry a person's identity. Matched case-insensitively
     against every requested field. The list is deliberately broader than the
     Florida NAL prefixes scripts/fl_nal_probe.py drops, because this driver
     faces arbitrary county schemas rather than one documented roll. */
  var PII = [
    /^own[_ ]?/i, /^fidu/i, /owner.*name/i, /name.*owner/i,
    /^grantee/i, /^grantor/i, /^taxpayer/i, /^mail.*name/i,
    /^deed.*name/i, /^first.?name$/i, /^last.?name$/i, /^full.?name$/i
  ];

  function piiHits(fields) {
    var out = [];
    (String(fields || '').split(',')).forEach(function (f) {
      var t = f.trim();
      if (!t) return;
      for (var i = 0; i < PII.length; i++) {
        if (PII[i].test(t)) { out.push(t); return; }
      }
    });
    return out;
  }

  /* A polygon's centroid, averaged over its rings. Returns null rather than a
     guess when the geometry is absent or unusable — a fabricated coordinate is
     the single most expensive thing this file could emit, because it looks
     exactly like a real one on a map. */
  function centroid(g) {
    if (!g) return null;
    if (g.x != null && g.y != null && isFinite(g.x) && isFinite(g.y)) return [g.x, g.y];
    var rings = g.rings || (g.paths ? g.paths : null);
    if (!rings || !rings.length) return null;
    var sx = 0, sy = 0, n = 0;
    for (var i = 0; i < rings.length; i++) {
      for (var j = 0; j < rings[i].length; j++) {
        var p = rings[i][j];
        if (!p || !isFinite(p[0]) || !isFinite(p[1])) continue;
        sx += p[0]; sy += p[1]; n++;
      }
    }
    if (!n) return null;
    return [+(sx / n).toFixed(6), +(sy / n).toFixed(6)];
  }

  var S = {
    rows: [], pages: 0, done: false, ok: false, err: null,
    started: null, finished: null, cfg: null, version: VERSION
  };
  window.LXPULL = S;

  /* Launch a paged pull. Returns immediately with a string; poll LXPULL. */
  window.lxrun = function (cfg) {
    if (!cfg || !cfg.url) return 'REFUSED: no url';
    if (typeof cfg.map !== 'function') return 'REFUSED: no map(a, ll) function';

    var bad = piiHits(cfg.fields);
    if (bad.length) {
      S.err = 'REFUSED before fetching: requested field(s) carry owner identity: ' + bad.join(', ');
      S.done = true; S.ok = false;
      return S.err;
    }

    S.rows = []; S.pages = 0; S.done = false; S.ok = false; S.err = null;
    S.started = new Date().toISOString(); S.finished = null;
    S.cfg = {url: cfg.url, where: cfg.where || '1=1', fields: cfg.fields || '*',
             geom: !!cfg.geom, step: cfg.step || 2000, cap: cfg.cap || 400000};

    (async function () {
      var off = 0, step = S.cfg.step;
      try {
        while (true) {
          var p = Object.assign({
            f: 'json', where: S.cfg.where, outFields: S.cfg.fields,
            returnGeometry: S.cfg.geom ? 'true' : 'false', outSR: 4326,
            resultOffset: off, resultRecordCount: step,
            orderByFields: cfg.order || 'OBJECTID'
          }, cfg.extra || {});

          var j = null, tries = 0, lastErr = null;
          while (tries < 4) {
            try {
              var r = await fetch(S.cfg.url + '?' + new URLSearchParams(p));
              /* An HTML error page parses as neither JSON nor a finding. Say so
                 rather than letting it read as an empty layer. */
              var txt = await r.text();
              try { j = JSON.parse(txt); }
              catch (e) {
                lastErr = 'non-JSON response (HTTP ' + r.status + '), first 200 chars: '
                        + txt.slice(0, 200);
                j = null;
              }
              if (j && !j.error) break;
              if (j && j.error) lastErr = JSON.stringify(j.error);
            } catch (e) { lastErr = 'fetch threw: ' + e.message; }
            tries++;
            await new Promise(function (x) { setTimeout(x, 1200 * tries); });
          }

          if (!j || j.error) { S.err = (lastErr || 'fetch failed') + ' @offset ' + off; break; }

          var fs = j.features || [];
          for (var i = 0; i < fs.length; i++) {
            S.rows.push(cfg.map(fs[i].attributes, S.cfg.geom ? centroid(fs[i].geometry) : null));
          }
          S.pages++;
          if (fs.length < step || fs.length === 0) { S.ok = true; break; }
          off += fs.length;
          if (off > S.cfg.cap) {
            /* Hitting the cap is NOT a complete pull, and must never be
               reported as one. */
            S.err = 'stopped at the ' + S.cfg.cap + '-row cap with more rows available';
            break;
          }
        }
      } catch (e) { S.err = 'EX ' + e.message; }
      S.finished = new Date().toISOString();
      S.done = true;
      if (S.err) S.ok = false;
      return S.rows.length;
    })();

    return 'launched';
  };

  /* One-line poll, for pasting between calls. */
  window.lxpoll = function () {
    return JSON.stringify({n: S.rows.length, pages: S.pages, done: S.done, ok: S.ok, err: S.err});
  };

  /* Pack the pulled rows into the transfer envelope: gzip, then base64. The
     envelope carries its own provenance and its own counts, so the ingest side
     can recount everything rather than trusting a number typed by hand. */
  window.lxpack = async function (meta) {
    if (!S.done) return JSON.stringify({error: 'pull is not finished'});
    if (!S.ok) return JSON.stringify({error: 'pull did not complete cleanly: ' + S.err});
    if (!S.rows.length) return JSON.stringify({error: 'zero rows — nothing to pack'});

    var env = {
      desk_pull: 1,
      driver: 'scripts/desk/pull_driver.js@' + VERSION,
      source: S.cfg.url,
      where: S.cfg.where,
      requested_fields: S.cfg.fields,
      jurisdiction: (meta && meta.jurisdiction) || null,
      columns: (meta && meta.columns) || null,
      pulled_utc: S.finished,
      pages: S.pages,
      n: S.rows.length,
      notes: (meta && meta.notes) || null,
      rows: S.rows
    };
    var json = JSON.stringify(env);
    var stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
    var buf = new Uint8Array(await new Response(stream).arrayBuffer());
    var s = '', C = 8192;
    for (var i = 0; i < buf.length; i += C) {
      s += String.fromCharCode.apply(null, buf.subarray(i, i + C));
    }
    window.__B = btoa(s);
    return JSON.stringify({
      rows: env.n, json_bytes: json.length, gzip_bytes: buf.length,
      b64: window.__B.length, slices: Math.ceil(window.__B.length / 240000),
      slice_size: 240000
    });
  };

  /* One slice of the packed payload, by index. The bridge caps a tool result,
     so each slice is expected to overflow and auto-save to a file — that is the
     transport, not a failure. */
  window.lxslice = function (i) {
    if (!window.__B) return 'REFUSED: nothing packed';
    return window.__B.slice(i * 240000, (i + 1) * 240000);
  };

  return 'lx desk pull driver ' + VERSION + ' ready';
})();
