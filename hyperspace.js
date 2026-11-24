// SS Wayfarer — the view outside every window: light speed. Shared by the corridor skylight, the Bridge window, and
// any future viewport. Load after aframe.min.js.
//   var hs = WAYFARER.hyperspace(parentObject3D, { fwd: +1 | -1, arc: [minDeg, maxDeg], count, core })
//   hs.update(timeSeconds)   — call every frame
// fwd   = the ship's forward direction along this page's Z axis (corridor: +1 toward the Bridge; bridge page: −1).
//         Streaks rush the opposite way (aft).
// arc   = where streaks are placed around the ship's axis, degrees from straight up (0 = overhead, 180 = below).
//         Corridor only sees up through the skylight: [-80, 80]. The Bridge window sees everything: [-180, 180].
// core  = a bright vanishing point dead ahead (Bridge).
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
      var ang = (arc[0] + r() * (arc[1] - arc[0])) * Math.PI / 180, rad = (o.minR || 7) + Math.pow(r(), 1.5) * 180;
      var x = Math.sin(ang) * rad + cx0, y = Math.cos(ang) * rad + cy0, z = (r() - 0.5) * SPAN;
      var len = 30 + r() * 160, wid = 0.15 + r() * 0.25 + rad * 0.012, spd = 260 + r() * 340, hue = r();
      var c = hue < 0.7 ? [0.75, 0.85, 1.0] : hue < 0.9 ? [1, 1, 1] : [0.55, 0.7, 1.0], br = 0.5 + r() * 0.8;
      [[0, -1], [0, 1], [1, -1], [1, 1]].forEach(function (k, j) {
        var q = i * 4 + j; base.set([x, y, z], q * 3); corner.set(k, q * 2); info.set([len, wid, spd], q * 3); col.set([c[0] * br, c[1] * br, c[2] * br], q * 3);
      });
      var q0 = i * 4; idx.push(q0, q0 + 2, q0 + 1, q0 + 1, q0 + 2, q0 + 3);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(base, 3)); g.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
    g.setAttribute('aInfo', new THREE.BufferAttribute(info, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
    var sm = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uSpan: { value: SPAN }, uFwd: { value: fwd } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false,
      vertexShader: [
        'attribute vec2 aCorner; attribute vec3 aInfo, aCol; uniform float uT, uSpan, uFwd; varying vec2 vC; varying vec3 vCol;',
        'void main(){ vec3 b = position; b.z = mod(b.z - uFwd * uT * aInfo.z + uSpan * 0.5, uSpan) - uSpan * 0.5;',
        ' vec3 wb = (modelMatrix * vec4(b, 1.0)).xyz; vec3 side = normalize(cross(vec3(0.0, 0.0, 1.0), cameraPosition - wb));',
        ' vec3 p = wb + vec3(0.0, 0.0, uFwd * aCorner.x * aInfo.x) + side * aCorner.y * aInfo.y;',      // head leads aft, tail trails toward the bow
        ' vC = aCorner; vCol = aCol; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }'].join('\n'),
      fragmentShader: 'varying vec2 vC; varying vec3 vCol; void main(){ float a = pow(1.0 - vC.x, 2.2) * (1.0 - vC.y * vC.y); a += smoothstep(0.06, 0.0, vC.x) * 1.5 * (1.0 - abs(vC.y)); gl_FragColor = vec4(vCol * a, 1.0); }' });
    var streaks = new THREE.Mesh(g, sm); streaks.frustumCulled = false; streaks.renderOrder = -9; root.add(streaks);

    // the tunnel: faint streaked walls far out, scrolling aft
    var c = document.createElement('canvas'); c.width = c.height = 512; var x2 = c.getContext('2d'); x2.fillStyle = '#000'; x2.fillRect(0, 0, 512, 512);
    for (var k = 0; k < 420; k++) {
      var u = r() * 512, v = r() * 512, L = 60 + r() * 380, a = 0.12 + r() * 0.5, gr = x2.createLinearGradient(0, v, 0, v + L);
      gr.addColorStop(0, 'rgba(120,160,255,0)'); gr.addColorStop(1, 'rgba(180,210,255,' + a + ')');
      var wpx = 1.5 + r() * 4.5; x2.fillStyle = gr; x2.fillRect(u, v, wpx, L); if (v + L > 512) x2.fillRect(u, v - 512, wpx, L);
    }
    var tt = new THREE.CanvasTexture(c); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(3, 1.5);
    var tun = new THREE.Mesh(new THREE.CylinderGeometry(260, 260, 1400, 48, 1, true), new THREE.MeshBasicMaterial({ map: tt, color: 0x9fc0ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, fog: false, toneMapped: false }));
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
    return {
      update: function (ts) { sm.uniforms.uT.value = ts; tt.offset.y = (ts * 0.9) % 1; if (coreS) coreS.material.opacity = 0.85 + 0.15 * Math.sin(ts * 3.1); },
      objects: [streaks, tun, haze].concat(coreS ? [coreS] : [])
    };
  };
}());
