// THE CORE (Nov 27) — the brain + reactor, as its own room (user: the unified atrium loaded too heavily; segment it).
// Same design as the old atrium core, in room-local metres: floor (the engineering gallery) at y 0, entrance at +Z (door.js 'core').
// Hydrogel chamber r 5 holding the brain y 1.35…8.85 overhead; plasma-column reactor rising from a pit (y −5.55) to the chamber base;
// conduits + buttresses; eels orbiting the brain. Gallery ring r 5.55…10.45 is the only walkable floor; inner rail keeps you off the pit.
(function () {
  var THREE = AFRAME.THREE, MOB = /iPhone|iPad|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
  var CR = 5.0, CB = 1.35, CT = 8.85, GI = 5.55, PIT = -5.55, WR = 10.2, WH = 9.4, SEGS = MOB ? 40 : 72;
  var plasma = null;
  function mat(c, m, r, e, ei) { return new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r, emissive: e || 0, emissiveIntensity: ei || 0, side: THREE.DoubleSide }); }
  var steel = mat(0x30353b, 0.55, 0.5), dark = mat(0x1c2024, 0.6, 0.55), bronze = mat(0xa86a38, 0.8, 0.38), floor = mat(0x23282d, 0.5, 0.35),
      teal = new THREE.MeshBasicMaterial({ color: 0x7dfff0, fog: false }), white = new THREE.MeshBasicMaterial({ color: 0xd8f0ff, fog: false });
  var glass = new THREE.MeshStandardMaterial({ color: 0x7dffb8, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false });

  function build(sc) {
    var g = new THREE.Group(); sc.object3D.add(g);
    function cyl(r0, r1, y0, y1, m, open, seg) { var o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, y1 - y0, seg || SEGS, 1, !!open), m); o.position.y = (y0 + y1) / 2; g.add(o); return o; }
    function ring(r, y, t, m) { var o = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, MOB ? 48 : 96), m); o.rotation.x = Math.PI / 2; o.position.y = y; g.add(o); return o; }
    // chamber
    cyl(CR, CR, CB, CT, glass, true);
    cyl(CR - 0.06, CR - 0.06, CB, CT, new THREE.MeshBasicMaterial({ color: 0x0c9a4c, transparent: true, opacity: 0.42, side: THREE.BackSide, depthWrite: false, fog: false }), true);
    var cap = new THREE.Mesh(new THREE.CircleGeometry(CR, 64), glass); cap.rotation.x = -Math.PI / 2; cap.position.y = CT; g.add(cap);
    var plate = new THREE.Mesh(new THREE.CircleGeometry(CR + 0.35, 64), steel); plate.rotation.x = Math.PI / 2; plate.position.y = CB - 0.02; g.add(plate);
    var p2 = new THREE.Mesh(new THREE.CircleGeometry(CR, 64), mat(0x0c1a16, 0.7, 0.5, 0x0a3a2a, 0.6)); p2.rotation.x = -Math.PI / 2; p2.position.y = CB + 0.02; g.add(p2);
    [CB, CB + 1.6, CT - 3.6, CT - 0.05].forEach(function (y, i) { ring(CR + 0.05, y, i === 1 ? 0.07 : 0.16, i === 1 ? teal : bronze); });
    // reactor
    cyl(GI - 0.05, GI - 0.05, PIT, 0, mat(0x2a2e32, 0.6, 0.5), true);
    var pf = new THREE.Mesh(new THREE.CircleGeometry(GI, 64), steel); pf.rotation.x = -Math.PI / 2; pf.position.y = PIT; g.add(pf);
    var RC = 1.35, cg = glass.clone(); cg.opacity = 0.2; cyl(RC, RC, PIT, CB, cg, true, 40);
    plasma = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'uniform float t; varying vec3 p; void main(){ float a = atan(p.z,p.x); float f = .5+.5*sin(p.y*3.2 - t*2.4 + sin(a*3.+t)*1.5); float g = .5+.5*sin(a*6.+p.y*1.7+t*1.3); float c = f*.6+g*.4; vec3 col = mix(vec3(.05,.45,.9), vec3(.55,1.,.95), c*c); gl_FragColor = vec4(col, .35+.5*c); }' });
    cyl(RC * 0.62, RC * 0.62, PIT, CB, plasma, true, 28);
    cyl(0.3, 0.3, CB, CB + 3.1, new THREE.MeshBasicMaterial({ color: 0x9cffe0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), true, 16);
    [PIT + 0.5, -3.6, -1.9, -0.3, CB - 0.35].forEach(function (y) { ring(RC + 0.08, y, 0.12, bronze); });
    ring(RC + 0.1, PIT + 1.4, 0.05, teal);
    var pipe = mat(0x3b4146, 0.85, 0.4), i;
    for (i = 0; i < 8; i++) {
      var an = i / 8 * Math.PI * 2 + 0.2, c = Math.cos(an), s = Math.sin(an);
      var curve = new THREE.CatmullRomCurve3([new THREE.Vector3(c * (RC + 0.2), PIT + 1.6, s * (RC + 0.2)), new THREE.Vector3(c * 3.2, -3.0, s * 3.2), new THREE.Vector3(c * (CR + 0.45), -0.05, s * (CR + 0.45)), new THREE.Vector3(c * (CR + 0.45), CB + 0.6, s * (CR + 0.45)), new THREE.Vector3(c * (CR + 0.2), CT - 0.4, s * (CR + 0.2))]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, MOB ? 24 : 40, 0.13, 8, false), pipe));
    }
    for (i = 0; i < 4; i++) {
      var ab = i / 4 * Math.PI * 2 + Math.PI / 4, p0 = new THREE.Vector3(Math.cos(ab) * (GI + 0.1), 0, Math.sin(ab) * (GI + 0.1)), p1 = new THREE.Vector3(Math.cos(ab) * (CR + 0.1), CB, Math.sin(ab) * (CR + 0.1));
      var st = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, p0.distanceTo(p1), 10), bronze); st.position.copy(p0.clone().add(p1).multiplyScalar(0.5)); st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize()); g.add(st);
    }
    // walkable gallery + inner rail
    var gal = new THREE.Mesh(new THREE.RingGeometry(GI, 10.45, MOB ? 72 : 128, 6), floor); gal.rotation.x = -Math.PI / 2; gal.position.y = 0.0; g.add(gal);
    ring(GI + 0.08, 1.05, 0.04, bronze); ring(GI + 0.08, 0.55, 0.025, teal);
    for (i = 0; i < 36; i++) { var ap = i / 36 * Math.PI * 2, po = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.05, 6), steel); po.position.set(Math.cos(ap) * (GI + 0.08), 0.52, Math.sin(ap) * (GI + 0.08)); g.add(po); }
    // outer wall (θ from +z: the doorway gap faces +z), light bands, ceiling
    var wall = new THREE.Mesh(new THREE.CylinderGeometry(WR, WR, WH, 96, 6, true, 0.11, Math.PI * 2 - 0.22), dark); wall.position.y = WH / 2; g.add(wall);
    [0.12, 1.6, 3.4, 5.4, 7.4, 9.1].forEach(function (y, k) { var b = new THREE.Mesh(new THREE.CylinderGeometry(WR - 0.04, WR - 0.04, 0.07, 96, 1, true, 0.11, Math.PI * 2 - 0.22), k % 2 ? bronze : (k === 0 ? teal : white)); b.position.y = y; g.add(b); });
    var ce = new THREE.Mesh(new THREE.CircleGeometry(WR, MOB ? 72 : 128), steel); ce.rotation.x = Math.PI / 2; ce.position.y = WH; g.add(ce);
    ring(8.4, WH - 0.1, 0.07, white); ring(CR + 0.5, WH - 0.1, 0.06, teal);
    [[0, 8, 0x2dff7a, 2.2, 9, 5.5], [0, -2.5, 0x3fb8ff, 5, 12, 0], [7.4, 2.6, 0xd8e8ff, 4, 13, 0], [-7.4, 2.6, 0xd8e8ff, 4, 13, 0], [0, 2.6, 7.4, 0xd8e8ff, 4, 13, 0], [0, 2.6, -7.4, 0xd8e8ff, 4, 13, 0]];
    var LT = [[0, 5.5, 0, 0x2dff7a, 2.6, 10], [0, 3.0, 0, 0x2dffa0, 1.8, 9], [0, -2.8, 0, 0x3fb8ff, 5, 12], [7.4, 2.4, 0, 0xd8e8ff, 4, 14], [-7.4, 2.4, 0, 0xd8e8ff, 4, 14], [0, 2.4, 7.4, 0xd8e8ff, 4, 14], [0, 2.4, -7.4, 0xd8e8ff, 4, 14]];
    LT.forEach(function (q) { var l = new THREE.PointLight(q[3], q[4], q[5], 1.6); l.position.set(q[0], q[1], q[2]); g.add(l); });
    g.add(new THREE.HemisphereLight(0x9fb4c8, 0x20262c, 0.55));
    // brain (a-entity placed in the HTML at y 5.55) + eels
    var br = document.getElementById('brain'); if (br && AFRAME.components['brain-mesh']) br.setAttribute('brain-mesh', { detail: MOB ? 'low' : 'high' });
    eels(sc);
    // keep the player off the pit: inner rail r 5.8
    AFRAME.registerComponent('wf-core-clamp', { tick: function () { var pl = document.getElementById('player'); if (!pl || window.WAYFARER.frozen) return; var cam = document.getElementById('cam'), wp = new THREE.Vector3(); cam.object3D.getWorldPosition(wp); var r = Math.hypot(wp.x, wp.z); if (r < 5.85 && r > 1e-3) { var k = 5.85 / r; pl.object3D.position.x += wp.x * (k - 1); pl.object3D.position.z += wp.z * (k - 1); } } });
    sc.setAttribute('wf-core-clamp', '');
    document.getElementById('wf-fade').style.opacity = '0';
  }

  // eels: orbit r 4.05–4.75 inside the glass (chamber centre y 5.1); brain re-tinted green every second
  function eels(sc) {
    var NE = MOB ? 3 : 5, SEG = 22, g = new THREE.Group(); g.position.set(0, 5.95, 0); g.userData.noCollide = true; sc.object3D.add(g);
    var eelM = new THREE.MeshStandardMaterial({ color: 0x0c3a2a, roughness: 0.35, metalness: 0.2, emissive: 0x0b7a48, emissiveIntensity: 0.5 }),
        eel = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), eelM, NE * SEG), eyes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 6, 4), new THREE.MeshBasicMaterial({ color: 0xc8ffe0, toneMapped: false }), NE * 2);
    eel.frustumCulled = eyes.frustumCulled = false; g.add(eel); g.add(eyes);
    var E = []; for (var i = 0; i < NE; i++) E.push({ ph: i * 1.3, sp: 0.22 + (i % 3) * 0.07, dir: i % 2 ? -1 : 1, r: 4.05 + (i % 3) * 0.35, y: [-3.4, -1.2, 1.3, -2.2, 0.2][i], sz: 0.085 + (i % 2) * 0.02 });
    var M = new THREE.Matrix4(), Q = new THREE.Quaternion(), SC = new THREE.Vector3(), UP = new THREE.Vector3(0, 0, 1), P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), V = new THREE.Vector3(), tt = 0;
    function at(e, T, k, out) { var a = e.ph + (T - k * 0.1) * e.sp * e.dir, w = Math.sin(T * 5 - k * 0.7) * 0.08 * (k / SEG); out.set(Math.cos(a) * (e.r + w), e.y + Math.sin((T - k * 0.1) * 0.5 + e.ph) * 0.9, Math.sin(a) * (e.r + w)); }
    AFRAME.registerComponent('wf-core-eels', { tick: function (t) {
      var T = t / 1000, ei, k; if (plasma) plasma.uniforms.t.value = T;
      for (ei = 0; ei < NE; ei++) { var e = E[ei]; for (k = 0; k < SEG; k++) { at(e, T, k, P0); at(e, T, k + 1, P1); V.subVectors(P0, P1).normalize(); Q.setFromUnitVectors(UP, V);
          var tp = e.sz * (k < 2 ? 0.85 + k * 0.1 : 1 - (k - 2) / SEG * 0.85); SC.set(tp, tp * 0.75, tp * 1.9); M.compose(P0, Q, SC); eel.setMatrixAt(ei * SEG + k, M);
          if (k === 0) for (var s = 0; s < 2; s++) { M.makeTranslation(P0.x + V.z * (s ? 1 : -1) * tp * 0.6, P0.y + tp * 0.4, P0.z - V.x * (s ? 1 : -1) * tp * 0.6); eyes.setMatrixAt(ei * 2 + s, M); } } }
      eel.instanceMatrix.needsUpdate = eyes.instanceMatrix.needsUpdate = true;
      if (t - tt > 1000) { tt = t; var b = document.getElementById('brain'), o = b && b.object3D; if (o) o.traverse(function (m) { if (m.isMesh && m.material && m.material.vertexColors) { m.material.color.set(0x5fa87a); if (m.material.sheenColor) m.material.sheenColor.set(0x70ffb0); m.material.envMapIntensity = 0.35; } }); }
    } });
    sc.setAttribute('wf-core-eels', '');
  }
  var sc = document.querySelector('a-scene');
  if (sc.hasLoaded) build(sc); else sc.addEventListener('loaded', function () { build(sc); });
})();
