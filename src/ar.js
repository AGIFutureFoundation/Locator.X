/* locator.x - augmented reality, and what it is honestly showing you.
   ----------------------------------------------------------------------------
   WHAT THIS IS. WebXR places the property's massing block in the room you are
   standing in, at true scale, so a footprint and a storey count stop being
   numbers and become something you can walk around. On a phone that supports
   immersive-ar it uses the camera and the floor plane; everywhere else it falls
   back to an orbit view of the same geometry.

   WHAT THIS IS NOT, and the page says so before it opens. This is NOT a scan of
   the building and NOT a model of it. It is the SAME schematic massing the 3D
   tab draws: a box whose footprint comes from the recorded building area divided
   by the storey count, and whose height comes from that storey count times a
   typical floor-to-floor. Where the county publishes no area or no storeys, the
   figure is inferred from the class and is labelled as such - and the AR view
   inherits every one of those labels rather than dropping them because a box in
   your living room looks convincing.

   That last point is the whole reason this module is careful. A number in a
   table that says "derived" is read as derived. The same number extruded into a
   solid object standing on your floor at 1:1 reads as measured, because that is
   what physical presence does to a viewer. So the provenance is shown IN the
   scene, the block is drawn as a translucent shell with an open wireframe rather
   than a photoreal solid, and the word SCHEMATIC is on it.

   No library. WebXR gives a WebGL context; this draws to it directly. That keeps
   the page inside its content-security policy and avoids shipping a 3D engine
   for one box. */
(function(){
'use strict';
var $ = function(s, el){ return (el || document).querySelector(s); };
var L = function(){ return window.LX; };
function esc(s){ return L().esc(s); }

var FT = 0.3048;

/* ---- can this device do it? ------------------------------------------- */
var SUPPORT = null;
function support(cb){
  if(SUPPORT){ cb(SUPPORT); return; }
  if(!navigator.xr){ SUPPORT = {ok:false, why:'This browser has no WebXR. On iPhone that means Safari — Apple has not shipped WebXR, so AR is not available here; the orbit view below shows the same geometry.'}; cb(SUPPORT); return; }
  navigator.xr.isSessionSupported('immersive-ar').then(function(ok){
    SUPPORT = ok ? {ok:true}
      : {ok:false, why:'This device reports WebXR but not immersive-ar, which usually means a desktop browser or a headset without passthrough. The orbit view below shows the same geometry.'};
    cb(SUPPORT);
  }).catch(function(){
    SUPPORT = {ok:false, why:'This browser refused the AR capability check.'};
    cb(SUPPORT);
  });
}

/* ---- the geometry, straight from the massing the 3D tab already uses --- */
function boxFor(l){
  var m = null;
  try{ m = window.LXRecon && LXRecon.massing ? LXRecon.massing(l) : null; }catch(e){}
  if(!m) return null;
  /* Use the massing's OWN W/D/H rather than recomputing from the footprint.
     The first version of this read m.footprint, a field massing() does not
     return, so every property produced no box at all. Sharing the exact
     dimensions the 3D tab draws also means the two views cannot disagree —
     an AR block that differed from the on-screen model by even a little would
     be a second, unexplained answer to the same question. */
  var W = m.W, D = m.D, H = m.H;
  if(!(W > 0) || !(D > 0) || !(H > 0)) return null;
  if(m.cls === 'land' || m.floors === 0) return null;   /* nothing built to stand up */
  return {w:W*FT, d:D*FT, h:H*FT, floors:m.floors, foot:m.foot,
          ftW:W, ftD:D, ftH:H, prov:m.prov || {}, m:m};
}

/* ---- minimal WebGL --------------------------------------------------- */
var VS = 'attribute vec3 p;uniform mat4 mvp;void main(){gl_Position=mvp*vec4(p,1.0);}';
var FS = 'precision mediump float;uniform vec4 c;void main(){gl_FragColor=c;}';
function prog(gl){
  function sh(t, s){ var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
  var p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(p); return p;
}
function boxBuffers(gl, w, h, d){
  var x = w/2, z = d/2;
  var v = [ -x,0,-z,  x,0,-z,  x,0,z,  -x,0,z,
            -x,h,-z,  x,h,-z,  x,h,z,  -x,h,z ];
  var lines = [0,1,1,2,2,3,3,0, 4,5,5,6,6,7,7,4, 0,4,1,5,2,6,3,7];
  var tris  = [0,1,2, 0,2,3, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 1,2,6, 1,6,5, 2,3,7, 2,7,6, 3,0,4, 3,4,7];
  var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
  var lb = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lb);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lines), gl.STATIC_DRAW);
  var tb = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tb);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tris), gl.STATIC_DRAW);
  return {vb:vb, lb:lb, nl:lines.length, tb:tb, nt:tris.length};
}
function mul(a, b){
  var o = new Float32Array(16);
  for(var i=0;i<4;i++) for(var j=0;j<4;j++){ var s=0;
    for(var k=0;k<4;k++) s += a[k*4+j]*b[i*4+k]; o[i*4+j]=s; }
  return o;
}
function trans(x, y, z){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]); }
function rotY(a){ var c=Math.cos(a), s=Math.sin(a);
  return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }
function persp(fov, asp, n, f){
  var t = 1/Math.tan(fov/2);
  return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)/(n-f),-1, 0,0,2*f*n/(n-f),0]);
}

/* ---- the orbit fallback: same box, no camera --------------------------- */
function orbit(canvas, box){
  var gl = canvas.getContext('webgl', {alpha:true, antialias:true});
  if(!gl) return false;
  var P = prog(gl); gl.useProgram(P);
  var B = boxBuffers(gl, box.w, box.h, box.d);
  var loc = gl.getAttribLocation(P, 'p'), mvp = gl.getUniformLocation(P, 'mvp'), col = gl.getUniformLocation(P, 'c');
  var ang = 0.6, raf = 0;
  function frame(){
    if(!canvas.isConnected){ cancelAnimationFrame(raf); return; }
    var dpr = Math.min(2, window.devicePixelRatio||1);
    var w = canvas.clientWidth||400, h = canvas.clientHeight||280;
    if(canvas.width !== Math.round(w*dpr)){ canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); }
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    var span = Math.max(box.w, box.h, box.d);
    var view = mul(trans(0, -box.h*0.5, -span*2.4), rotY(ang));
    var m = mul(persp(0.9, w/h, 0.05, 500), view);
    gl.uniformMatrix4fv(mvp, false, m);
    gl.bindBuffer(gl.ARRAY_BUFFER, B.vb);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(col, 0.16, 0.54, 0.30, 0.22);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.tb);
    gl.drawElements(gl.TRIANGLES, B.nt, gl.UNSIGNED_SHORT, 0);
    gl.uniform4f(col, 0.16, 0.54, 0.30, 0.95);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.lb);
    gl.drawElements(gl.LINES, B.nl, gl.UNSIGNED_SHORT, 0);
    ang += 0.006;
    raf = requestAnimationFrame(frame);
  }
  frame();
  return true;
}

/* ---- the AR session ---------------------------------------------------- */
function startAR(l, box, statusEl){
  var canvas = document.createElement('canvas');
  var gl = canvas.getContext('webgl', {xrCompatible:true, alpha:true, antialias:true});
  if(!gl){ statusEl.textContent = 'This device would not give a WebGL context for AR.'; return; }
  navigator.xr.requestSession('immersive-ar', {requiredFeatures:['local-floor']}).then(function(session){
    session.updateRenderState({baseLayer: new XRWebGLLayer(session, gl)});
    var P = prog(gl);
    var B = boxBuffers(gl, box.w, box.h, box.d);
    var loc = gl.getAttribLocation(P, 'p'), mvp = gl.getUniformLocation(P, 'mvp'), col = gl.getUniformLocation(P, 'c');
    session.requestReferenceSpace('local-floor').then(function(ref){
      session.requestAnimationFrame(function onFrame(t, frame){
        session.requestAnimationFrame(onFrame);
        var pose = frame.getViewerPose(ref); if(!pose) return;
        var layer = session.renderState.baseLayer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(P);
        pose.views.forEach(function(v){
          var vp = layer.getViewport(v);
          gl.viewport(vp.x, vp.y, vp.width, vp.height);
          /* stand the block a few metres in front of the viewer, on the floor */
          var model = trans(0, 0, -Math.max(4, box.w * 1.2));
          var m = mul(v.projectionMatrix, mul(v.transform.inverse.matrix, model));
          gl.uniformMatrix4fv(mvp, false, m);
          gl.bindBuffer(gl.ARRAY_BUFFER, B.vb);
          gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
          /* translucent shell + hard wireframe: legible as a diagram, never
             mistakable for a photoreal building */
          gl.uniform4f(col, 0.16, 0.54, 0.30, 0.18);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.tb);
          gl.drawElements(gl.TRIANGLES, B.nt, gl.UNSIGNED_SHORT, 0);
          gl.uniform4f(col, 0.16, 0.54, 0.30, 1.0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.lb);
          gl.drawElements(gl.LINES, B.nl, gl.UNSIGNED_SHORT, 0);
        });
      });
    });
    session.addEventListener('end', function(){ statusEl.textContent = 'AR session ended.'; });
    statusEl.textContent = 'AR running — look around; the block stands on the floor a few metres ahead.';
  }).catch(function(e){
    statusEl.textContent = 'The device declined the AR session (' + String(e && e.name || e).slice(0,40)
      + '). Camera permission is required, and the page must be opened directly rather than in an embedded frame.';
  });
}

/* ---- the drawer block --------------------------------------------------- */
var SEQ = 0;
function drawer(l){
  var box = boxFor(l);
  if(!box) return '';
  var X = L(), id = 'ar' + (++SEQ);
  var ftW = box.ftW, ftD = box.ftD, ftH = box.ftH;
  var pr = box.prov || {};
  var derived = [];
  if(pr.floors && pr.floors !== 'recorded') derived.push('storey count');
  if(pr.footprint && pr.footprint !== 'recorded') derived.push('footprint');
  if(!l.sqft) derived.push('building area (not published)');
  if(!l.stories) derived.push('storeys (not published)');

  setTimeout(function(){
    var host = document.getElementById(id); if(!host || host.dataset.w) return;
    host.dataset.w = '1';
    var cv = host.querySelector('canvas');
    if(cv) orbit(cv, box);
    var btn = host.querySelector('[data-ar]'), st = host.querySelector('[data-arstatus]');
    support(function(sp){
      if(!btn) return;
      if(sp.ok){
        btn.disabled = false;
        btn.addEventListener('click', function(){
          st.textContent = 'Requesting camera and floor…';
          startAR(l, box, st);
        });
      } else {
        btn.disabled = true;
        btn.textContent = 'AR not available on this device';
        if(st) st.textContent = sp.why;
      }
    });
  }, 80);

  return '<div class="sect" id="' + id + '"><p class="eyebrow" style="margin:0 0 4px">Massing in your space</p>'
    + '<div style="font-size:12.5px;line-height:1.65;margin-bottom:6px">'
    + 'Roughly <b>' + X.fmtN(Math.round(ftW)) + ' \u00d7 ' + X.fmtN(Math.round(ftD)) + ' ft</b> by <b>'
    + X.fmtN(Math.round(ftH)) + ' ft</b> tall — '
    + box.floors + ' storey' + (box.floors === 1 ? '' : 's') + ' over a '
    + X.fmtN(Math.round(box.foot)) + ' sq ft footprint.</div>'
    + '<canvas style="width:100%;height:190px;display:block;background:var(--panel2);border-radius:var(--r-sm)"></canvas>'
    + '<div style="margin-top:7px"><button class="btn" data-ar disabled>View at full size in your space</button></div>'
    + '<div data-arstatus style="font-size:11.5px;color:var(--muted);margin-top:5px"></div>'
    + '<p style="font-size:11.5px;color:var(--muted);margin:7px 0 0"><b>This is a SCHEMATIC BLOCK, not the '
    + 'building.</b> Nobody has scanned or modelled this property. The footprint is the recorded building area '
    + 'divided by the storey count, the plan proportions are assumed because a record gives an area and never '
    + 'a shape, and the height is the storey count times a typical floor-to-floor. It is the same block the 3D '
    + 'tab draws, from the same numbers.'
    + (derived.length ? ' Here, <b>' + esc(derived.join(', ')) + '</b> ' + (derived.length === 1 ? 'is' : 'are')
        + ' inferred rather than recorded.' : '')
    + ' It is drawn as an open wireframe on purpose: a solid object standing on your floor at full size reads as '
    + 'measured whatever the caption says, and this one is not.</p></div>';
}

window.LXAR = {drawer: drawer, support: support, boxFor: boxFor};
})();
