// SS Wayfarer — THE STAR GARDEN, reborn as the Library's CEILING STAR MAP (user, Nov 26: "remove it from the Holodeck, place it in
// the centre of the brain library room; when activated it's visualised on the ceiling — an animation where you look up and it fills
// the ceiling — a real map of the galaxy, not an editable game, one you can spin like the navigator").
// A bronze lectern stands at the centre of the Library's glass floor. Tap it: a beam climbs to the dome, the galaxy unfolds from
// the crown and spreads under the glass (r ≈ 7 m), your view tilts up to it. Drag to spin it (and tilt a little), wheel / pinch to
// zoom. Every charted system from nav/galaxy.json is a labelled star with its worlds' emoji; a cyan ring marks where the Wayfarer is.
(function () {
  if (!window.AFRAME || !/library\.html/.test(location.pathname)) return;
  var THREE = AFRAME.THREE, sc, root, gal, beam, labels = [], state = 'off', t0 = 0, prev = null, spin = 0, tilt = 0, zoom = 1, drag = null, pinch = 0, btn = null;
  var Y = 6.1, R = 7.0, EM = { Auralis: '🌍', Varkesh: '🏜️', Nyxara: '🟣', Ferrum_Prime: '🤖', Kharon_Fracture: '💥', Cryovale: '❄️', Thalassa: '🌊', Vespera: '☣️', Orinth: '🪐', Pyraxis: '🌋', Mycelion: '🍄', Selenite: '💎', Hiveport: '🛰️' };
  function dot() { var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
  function label(text, col) {
    var c = document.createElement('canvas'), x = c.getContext('2d'); x.font = '700 40px -apple-system, Helvetica, sans-serif'; var w = Math.ceil(x.measureText(text).width) + 40; c.width = w; c.height = 64;
    x.font = '700 40px -apple-system, Helvetica, sans-serif'; x.fillStyle = 'rgba(8,10,30,.55)'; x.beginPath(); x.roundRect ? x.roundRect(0, 6, w, 52, 26) : x.rect(0, 6, w, 52); x.fill();
    x.fillStyle = col || '#e8ecff'; x.textBaseline = 'middle'; x.fillText(text, 20, 34);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(w / 64 * 0.32, 0.32, 1); s.renderOrder = 5; return s;
  }
  function nearSys(G) { var n = 'VARKESH'; try { n = localStorage.getItem('wf-near') || 'VARKESH'; } catch (e) {} var id = /HIVEPORT/.test(n) ? 'Hiveport' : n.toLowerCase().split(' ').map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join('_'); return (G.systems.filter(function (s) { return s.destinations.indexOf(id) >= 0; })[0] || G.systems[0]).id; }
  function build(G) {
    var D = dot(); root = new THREE.Group(); root.position.set(0, Y, 0); root.userData.noCollide = true; sc.object3D.add(root);
    gal = new THREE.Group(); root.add(gal);
    var N = /iPhone|iPad|Android/.test(navigator.userAgent) ? 7000 : 16000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = 7;
    function r() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    for (var i = 0; i < N; i++) {
      var x, z, y, c;
      if (r() < 0.12) { var bl = (r() - 0.5) * 2.6, bw = (r() - 0.5) * 0.5; x = bl * Math.cos(0.5) - bw * Math.sin(0.5); z = bl * Math.sin(0.5) + bw * Math.cos(0.5); y = (r() - 0.5) * 0.2; c = [1, 0.84, 0.62]; }
      else { var arm = i % 4, d = 0.8 + Math.pow(r(), 0.8) * (R - 0.8), a = arm * Math.PI / 2 + Math.log(d / 0.8) * 2.2 + (r() - 0.5) * 0.5 / (d * 0.25 + 0.4);
        x = Math.cos(a) * d + (r() - 0.5) * 0.3; z = Math.sin(a) * d + (r() - 0.5) * 0.3; y = (r() - 0.5) * 0.25 * (1.2 - d / R);
        c = d < 1.6 ? [1, 0.82, 0.62] : r() < 0.5 ? [0.55, 0.65, 1] : r() < 0.55 ? [0.75, 0.55, 1] : r() < 0.3 ? [1, 0.5, 0.7] : [0.85, 0.9, 1]; }
      var b = 0.25 + r() * 0.55; pos.set([x, y, z], i * 3); col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: D, size: 0.09, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 })); gal.add(pts); gal.userData.pts = pts;
    var core = new THREE.Sprite(new THREE.SpriteMaterial({ map: D, color: 0xffe2b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); core.scale.set(3.4, 3.4, 1); gal.add(core); gal.userData.core = core;
    var neb = new THREE.Sprite(new THREE.SpriteMaterial({ map: D, color: 0x5a3cff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); neb.scale.set(16, 16, 1); gal.add(neb); gal.userData.neb = neb;
    // charted systems + their worlds
    var K = (R - 0.6) / 62, here = nearSys(G);
    G.systems.forEach(function (s) {
      var p = new THREE.Vector3(s.position[0] * K, 0.05, s.position[2] * K), st = new THREE.Sprite(new THREE.SpriteMaterial({ map: D, color: s.destinations.length ? 0xffffff : 0x8899bb, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      st.position.copy(p); st.scale.setScalar(s.destinations.length ? 0.55 : 0.3); gal.add(st);
      var txt = (s.destinations.map(function (d) { return EM[d] || '🪐'; }).join('') + ' ' + s.name).trim(), lb = label(txt, s.destinations.length ? '#ffffff' : '#9aa4c0'); lb.position.copy(p).add(new THREE.Vector3(0, -0.32, 0)); gal.add(lb); labels.push(lb);
      if (s.id === here) { var ring = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.42, 48), new THREE.MeshBasicMaterial({ color: 0x6ffff0, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.position.copy(p); gal.add(ring); gal.userData.here = ring;
        var yl = label('◉ THE WAYFARER IS HERE', '#6ffff0'); yl.position.copy(p).add(new THREE.Vector3(0, -0.62, 0)); gal.add(yl); labels.push(yl); }
    });
    gal.scale.setScalar(0.001); gal.visible = false;
    beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.25, 1, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xb08cff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    beam.position.set(0, 1.15, 0); sc.object3D.add(beam);
  }
  // the lectern at the centre of the glass floor
  function lectern() {
    var g = new THREE.Group(), bz = new THREE.MeshStandardMaterial({ color: 0xc08a48, roughness: 0.35, metalness: 0.85 });
    var prof = [[0, 0], [0.42, 0], [0.44, 0.05], [0.24, 0.16], [0.14, 0.5], [0.16, 0.92], [0.34, 1.02], [0.36, 1.08], [0, 1.08]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 48), bz));
    var lens = new THREE.Mesh(new THREE.CircleGeometry(0.3, 40), new THREE.MeshBasicMaterial({ color: 0xb08cff, transparent: true, opacity: 0.85, toneMapped: false })); lens.rotation.x = -Math.PI / 2; lens.position.y = 1.085; g.add(lens);
    var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: 0x9a7aff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.y = 1.2; halo.scale.set(1.1, 1.1, 1); g.add(halo);
    var c = document.createElement('canvas'); c.width = 512; c.height = 96; var x = c.getContext('2d'); x.fillStyle = '#e8dcff'; x.font = '700 44px -apple-system, Helvetica, sans-serif'; x.textAlign = 'center'; x.fillText('✦ STAR MAP ✦', 256, 62);
    var tt = new THREE.CanvasTexture(c); tt.colorSpace = THREE.SRGBColorSpace; var sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: tt, transparent: true, depthWrite: false })); sign.position.y = 1.55; sign.scale.set(1.3, 0.24, 1); g.add(sign);
    g.position.set(0, 0, 0); sc.object3D.add(g);
    var hit = document.createElement('a-entity'); hit.setAttribute('class', 'interactive clickable'); hit.setObject3D('mesh', new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.8, 16), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })));
    hit.object3D.position.set(0, 0.9, 0); hit.object3D.userData.noCollide = true; hit.addEventListener('click', toggle); sc.appendChild(hit);
    lectern.halo = halo;
  }
  function look() { var c = sc.camera && sc.camera.el; return c && c.components['look-controls']; }
  function toggle() { if (state === 'off') open(); else if (state === 'on') close(); }
  function open() {
    if (!gal) return; state = 'opening'; t0 = performance.now(); gal.visible = true; window.WAYFARER.frozen = true; var lc = look(); if (lc) prev = { yaw: lc.yawObject.rotation.y, pitch: lc.pitchObject.rotation.x };
    if (window.WF_SOUND) { WF_SOUND.warpRise && WF_SOUND.warpRise(); WF_SOUND.droid('scan', 0, 0.6); }
    if (!btn) { btn = document.createElement('button'); btn.textContent = '✕ CLOSE STAR MAP'; btn.style.cssText = 'position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:60;padding:11px 20px;border-radius:18px;border:1px solid rgba(170,150,255,.55);background:rgba(20,14,50,.55);color:#e8e0ff;font:800 12px -apple-system,system-ui,sans-serif;letter-spacing:2px;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)';
      ['pointerdown', 'touchstart'].forEach(function (n) { btn.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); }); btn.onclick = function (e) { e.stopPropagation(); close(); }; document.body.appendChild(btn); }
    btn.style.display = 'block'; if (window.WF_LIFE) WF_LIFE.event('starmap'); if (window.WF_SOUND && WF_SOUND.speak) WF_SOUND.speak('Star map projected. The Wayfarer is marked in cyan.', 'ai');
  }
  function close() { if (state !== 'on') return; state = 'closing'; t0 = performance.now(); if (btn) btn.style.display = 'none'; }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  // drag to spin (and tilt a little), wheel/pinch to zoom — only while the map is up
  addEventListener('pointerdown', function (e) { if (state === 'on' && e.target === (sc && sc.canvas)) drag = { x: e.clientX, y: e.clientY }; }, true);
  addEventListener('pointermove', function (e) { if (!drag || state !== 'on') return; spin += (e.clientX - drag.x) * 0.006; tilt = Math.max(-0.45, Math.min(0.45, tilt + (e.clientY - drag.y) * 0.003)); drag = { x: e.clientX, y: e.clientY }; }, true);
  addEventListener('pointerup', function () { drag = null; }, true);
  addEventListener('wheel', function (e) { if (state === 'on') zoom = Math.max(0.6, Math.min(1.6, zoom * Math.pow(0.999, e.deltaY))); }, { passive: true });
  addEventListener('touchmove', function (e) { if (state !== 'on' || e.touches.length !== 2) return; var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch) zoom = Math.max(0.6, Math.min(1.6, zoom * d / pinch)); pinch = d; }, { passive: true });
  addEventListener('touchend', function () { pinch = 0; }, { passive: true });
  AFRAME.registerComponent('wf-starmap', {
    init: function () { sc = this.el; var self = this; fetch('nav/galaxy.json?v=2').then(function (r) { return r.json(); }).then(function (G) { build(G); }); lectern(); },
    tick: function (t) {
      if (lectern.halo) lectern.halo.material.opacity = 0.4 + 0.25 * Math.sin(t / 400);
      if (!gal || state === 'off') return; var lc = look(), k;
      if (state === 'opening') {
        k = (performance.now() - t0) / 3200;
        beam.material.opacity = Math.sin(Math.min(1, k * 1.6) * Math.PI) * 0.6; beam.scale.y = Math.min(1, k * 2.2) * (Y - 1.1); beam.position.y = 1.1 + beam.scale.y / 2;
        var u = ease((k - 0.25) / 0.75); gal.scale.setScalar(0.001 + u * zoom); gal.userData.pts.material.opacity = u; gal.userData.core.material.opacity = 0.9 * u; gal.userData.neb.material.opacity = 0.3 * u; spin += 0.02 * (1 - u) + 0.002;
        if (lc && prev) { lc.pitchObject.rotation.x = prev.pitch + (1.25 - prev.pitch) * ease(k * 1.3); }
        if (k >= 1) state = 'on';
      } else if (state === 'on') {
        spin += drag ? 0 : 0.0008; gal.scale.setScalar(gal.scale.x + (zoom - gal.scale.x) * 0.1);
        if (gal.userData.here) { var p = (t / 1000) % 1; gal.userData.here.scale.setScalar(1 + p * 1.2); gal.userData.here.material.opacity = 1 - p; }
      } else if (state === 'closing') {
        k = (performance.now() - t0) / 1600; var v = 1 - ease(k); gal.scale.setScalar(0.001 + v * zoom); gal.userData.pts.material.opacity = v; gal.userData.core.material.opacity = 0.9 * v; gal.userData.neb.material.opacity = 0.3 * v;
        if (lc && prev) lc.pitchObject.rotation.x = 1.25 + (prev.pitch - 1.25) * ease(k);
        if (k >= 1) { state = 'off'; gal.visible = false; window.WAYFARER.frozen = false; }
      }
      gal.rotation.set(Math.PI + tilt, spin, 0);                       // seen from below: the disc faces down at you
    }
  });
  function attach() { var s = document.querySelector('a-scene'); if (s && !s.hasAttribute('wf-starmap')) { if (s.hasLoaded) s.setAttribute('wf-starmap', ''); else s.addEventListener('loaded', function () { s.setAttribute('wf-starmap', ''); }); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
  window.WF_STARMAP = { open: open, close: close, state: function () { return state; } };
}());
