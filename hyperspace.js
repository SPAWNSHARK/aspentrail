// SS Wayfarer — the view outside every window: light speed. Shared by the corridor skylight, the Bridge window, and
// any future viewport. Load after aframe.min.js.
//   var hs = WAYFARER.hyperspace(parentObject3D, { fwd: +1 | -1, arc: [minDeg, maxDeg], count, core })
//   hs.update(timeSeconds)   — call every frame
// fwd   = the ship's forward direction along this page's Z axis (corridor: +1 toward the Bridge; bridge page: −1).
//         Streaks rush the opposite way (aft).
// arc   = where streaks are placed around the ship's axis, degrees from straight up (0 = overhead, 180 = below).
//         Corridor only sees up through the skylight: [-80, 80]. The Bridge window sees everything: [-180, 180].
// core  = a bright vanishing point dead ahead (Bridge).
// tunnel = opacity of the streaked backdrop (0.85); bright / width scale the streaks; maxR = outer radius of the streak field.
// minR  = keep streaks at least this far from the axis (outside the room you're in); center = [x, y] of the axis.
(function () {
  var THREE = AFRAME.THREE;
  window.WAYFARER = window.WAYFARER || {};
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  window.WAYFARER.hyperspace = function (root, o) {
    o = o || {};
    var fwd = o.fwd || 1, arc = o.arc || [-180, 180], N = o.count || 1600, SPAN = 700, r = rng(o.seed || 77), cx0 = (o.center || [0, 0])[0], cy0 = (o.center || [0, 0])[1];
    var base = new Float32Array(N * 4 * 3), corner = new Float32Array(N * 4 * 2), info = new Float32Array(N * 4 * 3), col = new Float32Array(N * 4 * 3), idx = [];
    for (var i = 0; i < N; i++) {
      var ang = (arc[0] + r() * (arc[1] - arc[0])) * Math.PI / 180, rad = (o.minR || 7) + Math.pow(r(), 1.5) * ((o.maxR || 187) - (o.minR || 7));
      var x = Math.sin(ang) * rad + cx0, y = Math.cos(ang) * rad + cy0, z = (r() - 0.5) * SPAN;
      var len = 30 + r() * 160, wid = (0.15 + r() * 0.25 + Math.min(rad * 0.012, 0.5)) * (o.width || 1), spd = 260 + r() * 340, hue = r();
      var c = hue < 0.7 ? [0.75, 0.85, 1.0] : hue < 0.9 ? [1, 1, 1] : [0.55, 0.7, 1.0], br = (0.5 + r() * 0.8) * (o.bright || 1);
      [[0, -1], [0, 1], [1, -1], [1, 1]].forEach(function (k, j) {
        var q = i * 4 + j; base.set([x, y, z], q * 3); corner.set(k, q * 2); info.set([len, wid, spd], q * 3); col.set([c[0] * br, c[1] * br, c[2] * br], q * 3);
      });
      var q0 = i * 4; idx.push(q0, q0 + 2, q0 + 1, q0 + 1, q0 + 2, q0 + 3);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(base, 3)); g.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
    g.setAttribute('aInfo', new THREE.BufferAttribute(info, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
    var sm = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uSpan: { value: SPAN }, uFwd: { value: fwd } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false, side: THREE.DoubleSide,   // billboards can face away (seen from below)
      vertexShader: [
        'attribute vec2 aCorner; attribute vec3 aInfo, aCol; uniform float uT, uSpan, uFwd; varying vec2 vC; varying vec3 vCol;',
        'void main(){ vec3 b = position; b.z = mod(b.z - uFwd * uT * aInfo.z + uSpan * 0.5, uSpan) - uSpan * 0.5;',
        ' vec3 wb = (modelMatrix * vec4(b, 1.0)).xyz, ax = normalize((modelMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);',   // the streaks' own axis (rotated groups, e.g. the Lounge window)
        ' vec3 side = normalize(cross(ax, cameraPosition - wb));',
        ' vec3 p = wb + ax * (uFwd * aCorner.x * aInfo.x) + side * aCorner.y * aInfo.y;',      // head leads aft, tail trails toward the bow
        ' vC = aCorner; vCol = aCol; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }'].join('\n'),
      // soft round head + tapered body: the old head was a flat full-width bar, so wide far streaks showed as hard-edged blocks (user video, Nov 24)
      fragmentShader: 'varying vec2 vC; varying vec3 vCol; void main(){ float y2 = vC.y * vC.y; float a = pow(1.0 - vC.x, 2.2) * smoothstep(0.0, 0.05, vC.x) * (1.0 - y2) * (1.0 - y2); a += 1.4 * pow(max(0.0, 1.0 - length(vec2(vC.x * 14.0, vC.y))), 2.0); gl_FragColor = vec4(vCol * a, 1.0); }' });
    var streaks = new THREE.Mesh(g, sm); streaks.frustumCulled = false; streaks.renderOrder = -9; root.add(streaks);

    // the tunnel: faint streaked walls far out, scrolling aft
    var c = document.createElement('canvas'); c.width = c.height = 512; var x2 = c.getContext('2d'); x2.fillStyle = '#000'; x2.fillRect(0, 0, 512, 512);
    for (var k = 0; k < 420; k++) {
      var u = r() * 512, v = r() * 512, L = 60 + r() * 380, a = 0.12 + r() * 0.5, gr = x2.createLinearGradient(0, v, 0, v + L);
      gr.addColorStop(0, 'rgba(120,160,255,0)'); gr.addColorStop(1, 'rgba(180,210,255,' + a + ')');
      var wpx = 0.6 + r() * 1.4; x2.fillStyle = gr;                      // thin, soft-sided (wide hard rects read as blocks overhead)
      [[2.2, 0.25], [1.4, 0.45], [1, 1]].forEach(function (q) { x2.globalAlpha = q[1]; var ww = wpx * q[0], uu = u - (ww - wpx) / 2; x2.fillRect(uu, v, ww, L); if (v + L > 512) x2.fillRect(uu, v - 512, ww, L); });
      x2.globalAlpha = 1;
    }
    var tt = new THREE.CanvasTexture(c); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(6, 1.5); tt.anisotropy = 4;
    var tun = new THREE.Mesh(new THREE.CylinderGeometry(260, 260, 1400, 48, 1, true), new THREE.MeshBasicMaterial({ map: tt, color: 0x9fc0ff, transparent: true, opacity: o.tunnel == null ? 0.85 : o.tunnel, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, fog: false, toneMapped: false }));
    tun.rotation.x = fwd * Math.PI / 2; tun.renderOrder = -10; root.add(tun);   // texture v runs toward the bow; the bright end of each streak leads aft
    var haze = new THREE.Mesh(new THREE.CylinderGeometry(250, 250, 1400, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x0a1630, side: THREE.BackSide, fog: false, depthWrite: false }));
    haze.rotation.x = Math.PI / 2; haze.renderOrder = -11; root.add(haze);

    var coreS = null;
    if (o.core) {                          // the vanishing point: a soft white-blue glow far ahead
      var cc = document.createElement('canvas'); cc.width = cc.height = 128; var cx = cc.getContext('2d'), rg = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
      rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.15, 'rgba(200,225,255,0.8)'); rg.addColorStop(0.5, 'rgba(90,140,255,0.18)'); rg.addColorStop(1, 'rgba(40,80,200,0)');
      cx.fillStyle = rg; cx.fillRect(0, 0, 128, 128);
      coreS = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cc), color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, transparent: true }));
      coreS.position.set(cx0, cy0, fwd * 600); coreS.scale.set(240, 240, 1); coreS.renderOrder = -8; root.add(coreS);
    }
    // light spill: the streaks throw a cool, restless blue glow onto the room (floor gloss, walls).
    // spill: [{ p: [x,y,z], i: intensity, d: distance }] creates point lights in (o.spillRoot || root); lights: existing ones to animate
    var spills = [];
    (o.spill || []).forEach(function (q) { var l = new THREE.PointLight(0x8fb2ff, q.i, q.d || 12, q.decay == null ? 1.3 : q.decay); l.position.set(q.p[0], q.p[1], q.p[2]); (o.spillRoot || root).add(l); spills.push([l, q.i]); });
    (o.lights || []).forEach(function (l) { spills.push([l, l.intensity]); });
    function hsh(n) { n = Math.sin(n * 91.7) * 43758.5; return n - Math.floor(n); }
    return {
      update: function (ts) {
        if (spills.length) { var k = Math.floor(ts * 4), f = ts * 4 - k, burst = hsh(k) * (1 - f) + hsh(k + 1) * f;   // smooth random surges as bright streaks pass
          var m = 0.72 + 0.1 * Math.sin(ts * 7.3) + 0.06 * Math.sin(ts * 13.7 + 1.3) + 0.35 * burst * burst;
          spills.forEach(function (e, j) { e[0].intensity = e[1] * (m + 0.05 * Math.sin(ts * 9.1 + j * 2.1)); }); }
        sm.uniforms.uT.value = ts; tt.offset.y = (ts * 0.9) % 1; if (coreS) coreS.material.opacity = 0.85 + 0.15 * Math.sin(ts * 3.1); },
      objects: [streaks, tun, haze].concat(coreS ? [coreS] : []), spills: spills
    };
  };
}());
