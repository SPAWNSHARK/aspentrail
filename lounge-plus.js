// SS Wayfarer — CREW LOUNGE UPGRADE (user, Nov 26: "the crew lounge is pretty lame"; the plaques and the white slot lamps are gone).
//  • ALIEN AQUARIUM: a curved tank set into the port wall — deep-teal water with moving caustics, swaying kelp, rising bubbles and a
//    shoal of glowing alien fish (and one big drifting ray) swimming the length of the glass, in a bronze frame.
//  • STAR HEARTH: a copper wall fireplace on the starboard wall with flickering amber-to-violet star-fire and a warm flickering light.
//  • THREE BRASS PENDANT LAMPS over the coffee table.  • A BAR CABINET by the door with lit bottles and glasses.
// Room-local metres; wall convention as lounge.html wallAt(): deg 0 = −Z (the TV window), x = r·sin, z = −r·cos.
(function () {
  var THREE = AFRAME.THREE, MOB = /iPhone|iPad|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
  var D2R = Math.PI / 180, T = { t: 0 }, fish = [], kelp = [], bubbles = null, flames = [], hearthLight = null, ray = null, water = null;
  function wall(deg, r, y) { return new THREE.Vector3(r * Math.sin(deg * D2R), y, -r * Math.cos(deg * D2R)); }
  var BRASS = new THREE.MeshStandardMaterial({ color: 0xc89050, metalness: 0.85, roughness: 0.3 }), DARK = new THREE.MeshStandardMaterial({ color: 0x1c120a, roughness: 0.7 });

  function aquarium(g) {
    var A0 = -103, A1 = -67, RG = 8.25, RB = 8.85, Y0 = 0.9, Y1 = 3.5, len = (A1 - A0) * D2R, th0 = (180 + A0) * D2R;   // cylinder θ: x = r sin θ, z = r cos θ → our deg d ↔ θ = 180° − d … mirrored below
    // back wall: water shader (gradient + caustics), inside face visible
    water = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 } }, side: THREE.BackSide,
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: ['uniform float t; varying vec2 vU;',
        'float c(vec2 p){ p *= 9.0; float a = sin(p.x + t * 0.9) + sin(p.y * 1.3 - t * 0.7) + sin((p.x + p.y) * 0.8 + t * 0.5); return pow(abs(sin(a * 1.4)), 6.0); }',
        'void main(){ vec3 deep = vec3(0.0, 0.05, 0.09), top = vec3(0.02, 0.32, 0.38); vec3 col = mix(deep, top, smoothstep(0.0, 1.0, vU.y));',
        ' col += vec3(0.15, 0.55, 0.6) * c(vU * vec2(3.0, 1.0)) * (0.25 + 0.6 * vU.y);',
        ' col += vec3(0.2, 0.5, 0.45) * smoothstep(0.92, 1.0, vU.y) * 0.6; col *= 0.75 + 0.25 * smoothstep(0.0, 0.25, vU.y);',
        ' gl_FragColor = vec4(col, 1.0); }'].join('\n') });
    // our deg d ↔ three cylinder angle θ with x = sin θ·r, z = cos θ·r: we need z = −cos d·r → θ = 180° − d
    function cyl(r, a0, a1, h, y, mat, side) { var gg = new THREE.CylinderGeometry(r, r, h, 48, 1, true, (180 - a1) * D2R, (a1 - a0) * D2R); var m = new THREE.Mesh(gg, mat); m.position.y = y; g.add(m); return m; }
    cyl(RB, A0, A1, Y1 - Y0, (Y0 + Y1) / 2, water);
    // glass front (very faint teal) + bronze frame: sill, header, two posts
    var glass = new THREE.MeshStandardMaterial({ color: 0x6fd8d0, transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
    cyl(RG, A0, A1, Y1 - Y0, (Y0 + Y1) / 2, glass);
    [[Y0 - 0.06, 0.16], [Y1 + 0.06, 0.16]].forEach(function (q) { var m = new THREE.Mesh(new THREE.CylinderGeometry(RG + 0.02, RG + 0.02, q[1], 48, 1, true, (180 - A1 - 1) * D2R, (A1 - A0 + 2) * D2R), BRASS); m.material.side = THREE.DoubleSide; m.position.y = q[0]; g.add(m); });
    var cab = new THREE.Mesh(new THREE.CylinderGeometry(RG + 0.05, RG + 0.05, Y0 - 0.05, 48, 1, true, (180 - A1 - 1) * D2R, (A1 - A0 + 2) * D2R), new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.5, side: THREE.DoubleSide })); cab.position.y = (Y0 - 0.05) / 2; g.add(cab);
    [A0 - 0.6, A1 + 0.6].forEach(function (a) { var p = new THREE.Mesh(new THREE.BoxGeometry(0.14, Y1 - Y0 + 0.4, 0.7), BRASS), c = wall(a, (RG + RB) / 2, (Y0 + Y1) / 2); p.position.copy(c); p.rotation.y = -a * D2R; g.add(p); });
    var glowL = new THREE.PointLight(0x3fd8d0, 2.2, 7, 2); glowL.position.copy(wall((A0 + A1) / 2, RG - 0.6, 2.4)); g.add(glowL);
    // kelp
    var kelpM = new THREE.MeshStandardMaterial({ color: 0x2f7a46, emissive: 0x0a3a1a, emissiveIntensity: 0.5, roughness: 0.8, side: THREE.DoubleSide });
    for (var i = 0; i < (MOB ? 8 : 14); i++) { var a = A0 + 2 + Math.random() * (A1 - A0 - 4), h = 0.9 + Math.random() * 1.4, k = new THREE.Mesh(new THREE.PlaneGeometry(0.16, h, 1, 6), kelpM.clone());
      k.material.color.offsetHSL((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.1); k.geometry.translate(0, h / 2, 0); k.position.copy(wall(a, RB - 0.12 - Math.random() * 0.3, Y0)); k.rotation.y = -a * D2R; k.userData = { p0: k.geometry.attributes.position.array.slice(), ph: Math.random() * 6 }; g.add(k); kelp.push(k); }
    // fish: glowing tear-drops with a tail, swimming along the arc both ways
    var COLS = [0xff7a3a, 0x3ff0ff, 0xffd23a, 0xff4fa0, 0x8aff6a, 0xb08cff];
    for (i = 0; i < (MOB ? 10 : 18); i++) {
      var col = COLS[i % COLS.length], f = new THREE.Group(), sz = 0.07 + Math.random() * 0.07;
      var body = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: col })); body.scale.set(sz * 0.55, sz * 0.7, sz * 1.5); f.add(body);
      var tail = new THREE.Mesh(new THREE.ConeGeometry(sz * 0.6, sz * 1.1, 4), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 })); tail.rotation.x = Math.PI / 2; tail.position.z = sz * 1.8; f.add(tail);
      var eye = new THREE.Mesh(new THREE.SphereGeometry(sz * 0.16, 6, 4), new THREE.MeshBasicMaterial({ color: 0x000000 })); eye.position.set(sz * 0.4, sz * 0.2, -sz * 0.9); f.add(eye);
      f.userData = { a: A0 + 2 + Math.random() * (A1 - A0 - 4), dir: Math.random() < 0.5 ? -1 : 1, sp: 2 + Math.random() * 4, y: Y0 + 0.3 + Math.random() * (Y1 - Y0 - 0.6), r: RG + 0.15 + Math.random() * (RB - RG - 0.3), ph: Math.random() * 6, tail: tail, A0: A0, A1: A1 };
      g.add(f); fish.push(f);
    }
    // a big slow alien ray
    ray = new THREE.Mesh(new THREE.CircleGeometry(0.45, 3), new THREE.MeshBasicMaterial({ color: 0x9a7aff, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); ray.scale.set(1, 0.55, 1);
    ray.userData = { a: (A0 + A1) / 2, dir: 1, sp: 1.2, y: Y1 - 0.7, r: RB - 0.25, ph: 0, A0: A0, A1: A1 }; g.add(ray);
    // bubbles
    var n = MOB ? 50 : 90, pos = new Float32Array(n * 3), meta = []; for (i = 0; i < n; i++) { var aa = A0 + Math.random() * (A1 - A0), rr = RG + 0.1 + Math.random() * (RB - RG - 0.2), v = wall(aa, rr, Y0 + Math.random() * (Y1 - Y0)); pos.set([v.x, v.y, v.z], i * 3); meta.push(0.25 + Math.random() * 0.5); }
    var bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bubbles = new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xcfffff, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false })); bubbles.userData = { meta: meta, Y0: Y0, Y1: Y1 }; g.add(bubbles);
  }

  function hearth(g) {
    var a = 86, c = wall(a, 8.55, 0), h = new THREE.Group(); h.position.copy(c); h.rotation.y = -a * D2R; g.add(h);
    // copper surround + mantel + dark firebox
    var cop = new THREE.MeshStandardMaterial({ color: 0xb8703c, metalness: 0.85, roughness: 0.35 });
    [[-1.05, 0.95, 0.3, 1.9, 0.5], [1.05, 0.95, 0.3, 1.9, 0.5]].forEach(function (q) { var b = new THREE.Mesh(new THREE.BoxGeometry(q[2], q[3], q[4]), cop); b.position.set(q[0], q[1], 0.1); h.add(b); });
    var mant = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.16, 0.7), BRASS); mant.position.set(0, 1.98, 0.15); h.add(mant);
    var top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.3), cop); top.position.set(0, 2.8, -0.05); h.add(top);
    var box = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 0.5), DARK); box.position.set(0, 0.95, -0.22); h.add(box);
    var grate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.35), BRASS); grate.position.set(0, 0.32, 0.1); h.add(grate);
    var hearthStone = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.12, 0.9), new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.6 })); hearthStone.position.set(0, 0.06, 0.35); h.add(hearthStone);
    // star-fire: additive flame sprites from a soft canvas
    var cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; var x = cv.getContext('2d'), gr = x.createRadialGradient(32, 92, 2, 32, 80, 60);
    gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(255,170,60,.9)'); gr.addColorStop(0.6, 'rgba(200,60,160,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 128);
    var ft = new THREE.CanvasTexture(cv);
    for (var i = 0; i < 9; i++) { var m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.85), new THREE.MeshBasicMaterial({ map: ft, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85 }));
      m.position.set(-0.55 + i * 0.14, 0.78, 0.12 + (i % 2) * 0.04); m.userData = { ph: Math.random() * 6, s: 0.8 + Math.random() * 0.5 }; h.add(m); flames.push(m); }
    hearthLight = new THREE.PointLight(0xff9a40, 3, 9, 2); hearthLight.position.set(0, 1.0, 0.9); h.add(hearthLight);
    // a few framed photos + a brass clock on the mantel
    [[-0.85, 0xc89050], [0.85, 0x8a6a3a]].forEach(function (q) { var fr = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.04), new THREE.MeshStandardMaterial({ color: q[1], metalness: 0.7, roughness: 0.4 })); fr.position.set(q[0], 2.24, 0.2); fr.rotation.x = -0.12; h.add(fr); });
    var clock = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24), BRASS); clock.rotation.x = Math.PI / 2; clock.position.set(0, 2.24, 0.22); h.add(clock);
  }

  function pendants(g) {
    [[-1.1, 0.9], [0, 0.6], [1.1, 0.9]].forEach(function (p, i) {
      var y = 2.75 + (i === 1 ? -0.2 : 0), cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 5.4 - y, 6), BRASS); cord.position.set(p[0], (5.4 + y) / 2, p[1]); g.add(cord);
      var shade = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc89050, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide })); shade.position.set(p[0], y, p[1]); g.add(shade);
      var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe6b8, emissive: 0xffa648, emissiveIntensity: 3 })); bulb.position.set(p[0], y - 0.06, p[1]); g.add(bulb);
      if (!MOB || i === 1) { var l = new THREE.PointLight(0xffb060, MOB ? 2.4 : 1.4, 6, 2); l.position.set(p[0], y - 0.2, p[1]); g.add(l); }
    });
  }

  function bar(g) {
    var a = 132, c = wall(a, 8.25, 0), b = new THREE.Group(); b.position.copy(c); b.rotation.y = -a * D2R; g.add(b);
    var wood = new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.45, metalness: 0.2 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.55), wood); base.position.set(0, 0.5, 0); b.add(base);
    var top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 0.6), BRASS); top.position.set(0, 1.02, 0); b.add(top);
    var shelf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.3), BRASS); shelf.position.set(0, 1.75, -0.15); b.add(shelf);
    var back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.3, 0.04), new THREE.MeshStandardMaterial({ color: 0x150c06, roughness: 0.4, metalness: 0.5 })); back.position.set(0, 1.7, -0.28); b.add(back);
    var strip = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: 0x3a2008, emissive: 0xffa040, emissiveIntensity: 2.2 })); strip.position.set(0, 2.3, -0.2); b.add(strip);
    var BC = [0x3fd8a0, 0xffa040, 0xb04aff, 0xff4a4a, 0x6ab0ff, 0xffe080, 0x8aff6a];
    for (var i = 0; i < 9; i++) { var col = BC[i % BC.length], h = 0.24 + (i % 3) * 0.06, y0 = i < 5 ? 1.05 : 1.77, x0 = i < 5 ? -0.8 + i * 0.32 : -0.6 + (i - 5) * 0.4;
      var bt = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, h, 10), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.55, transparent: true, opacity: 0.85, roughness: 0.1 })); bt.position.set(x0, y0 + h / 2, i < 5 ? 0.05 : -0.15); b.add(bt);
      var nk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.09, 8), BRASS); nk.position.set(x0, y0 + h + 0.045, bt.position.z); b.add(nk); }
    [0.55, 0.75].forEach(function (x0) { var gl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05 })); gl.position.set(x0, 1.1, 0.12); b.add(gl); });
  }

  AFRAME.registerComponent('wf-lounge-plus', {
    init: function () { var self = this, sc = this.el.sceneEl; var go = function () { var g = new THREE.Group(); sc.object3D.add(g); aquarium(g); hearth(g); pendants(g); bar(g); self.ready = true; }; if (sc.hasLoaded) go(); else sc.addEventListener('loaded', go); },
    tick: function (t, dt) {
      if (!this.ready) return; var s = Math.min(dt, 50) / 1000, T0 = t / 1000; if (water) water.uniforms.t.value = T0;
      fish.forEach(function (f) { var u = f.userData; u.a += u.dir * u.sp * s; if (u.a > u.A1 - 1.5) { u.a = u.A1 - 1.5; u.dir = -1; } if (u.a < u.A0 + 1.5) { u.a = u.A0 + 1.5; u.dir = 1; }
        var y = u.y + Math.sin(T0 * 0.8 + u.ph) * 0.12, p = wall(u.a, u.r, y); f.position.copy(p); f.rotation.y = -u.a * D2R + (u.dir > 0 ? -Math.PI / 2 : Math.PI / 2); u.tail.rotation.y = Math.sin(T0 * 9 + u.ph) * 0.5; });
      if (ray) { var u = ray.userData; u.a += u.dir * u.sp * s; if (u.a > u.A1 - 3) u.dir = -1; if (u.a < u.A0 + 3) u.dir = 1; ray.position.copy(wall(u.a, u.r, u.y + Math.sin(T0 * 0.5) * 0.15)); ray.rotation.set(-0.3, -u.a * D2R, Math.sin(T0 * 2) * 0.25); }
      kelp.forEach(function (k) { var p = k.geometry.attributes.position, a0 = k.userData.p0; for (var i = 0; i < p.count; i++) { var y = a0[i * 3 + 1]; p.array[i * 3] = a0[i * 3] + Math.sin(T0 * 1.3 + k.userData.ph + y * 2.2) * 0.08 * y; } p.needsUpdate = true; });
      if (bubbles) { var bp = bubbles.geometry.attributes.position, M = bubbles.userData; for (var i = 0; i < bp.count; i++) { var y = bp.array[i * 3 + 1] + M.meta[i] * s; if (y > M.Y1 - 0.05) y = M.Y0 + 0.05; bp.array[i * 3 + 1] = y; } bp.needsUpdate = true; }
      flames.forEach(function (m) { var u = m.userData, k = 0.75 + 0.25 * Math.sin(T0 * 7 * u.s + u.ph) + 0.1 * Math.sin(T0 * 17 + u.ph * 2); m.scale.set(0.9 + 0.2 * k, k, 1); m.material.opacity = 0.55 + 0.35 * k; });
      if (hearthLight) hearthLight.intensity = 2.6 + Math.sin(T0 * 9) * 0.4 + Math.sin(T0 * 23) * 0.25;
    }
  });
  document.addEventListener('DOMContentLoaded', function () { var sc = document.querySelector('a-scene'); if (sc) sc.setAttribute('wf-lounge-plus', ''); });
}());
