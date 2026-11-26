// SS Wayfarer — procedural brain (real 3D folds) + electrogel motes + filaments.
// Load AFTER aframe.min.js. Usage: <a-entity brain-mesh position="0 -7.3 0"></a-entity>
// Front of the brain faces +Z (the corridor side). Everything is built from
// code: no model files. Left and right hemispheres use different noise
// regions so they're asymmetric like a real brain.
(function () {
  var THREE = AFRAME.THREE;

  // ── Seeded 3D gradient noise (improved Perlin) ────────────────────────────
  var P = new Uint8Array(512);
  (function () {
    var p = [], i, s = 1337;
    for (i = 0; i < 256; i++) p[i] = i;
    function r() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    for (i = 255; i > 0; i--) { var j = (r() * (i + 1)) | 0, t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) P[i] = p[i & 255];
  }());
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function grad(h, x, y, z) {
    h &= 15; var u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function noise(x, y, z) {
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    var u = fade(x), v = fade(y), w = fade(z);
    var A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z), u), lerp(grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1), u), lerp(grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  // Average normals across the sphere's UV seam and poles so there are no lines.
  function fixSeams(g, w, h) {
    var n = g.attributes.normal, row = w + 1, iy, ix, a, b, x, y, z, l;
    for (iy = 0; iy <= h; iy++) {
      if (iy === 0 || iy === h) {
        x = y = z = 0;
        for (ix = 0; ix <= w; ix++) { a = iy * row + ix; x += n.getX(a); y += n.getY(a); z += n.getZ(a); }
        l = Math.sqrt(x * x + y * y + z * z) || 1;
        for (ix = 0; ix <= w; ix++) n.setXYZ(iy * row + ix, x / l, y / l, z / l);
      } else {
        a = iy * row; b = iy * row + w;
        x = n.getX(a) + n.getX(b); y = n.getY(a) + n.getY(b); z = n.getZ(a) + n.getZ(b);
        l = Math.sqrt(x * x + y * y + z * z) || 1;
        n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
      }
    }
  }

  // Colour ramp: sulci dark vein-red/purple, gyri pearly grey-sage with pink drift
  var C_SULCUS = new THREE.Color(0.17, 0.02, 0.03), C_TMP = new THREE.Color(), C_R = new THREE.Color(),
      C_PEARL = new THREE.Color(0.56, 0.43, 0.40), C_ROSE = new THREE.Color(0.62, 0.32, 0.32);   // real tissue: pink-beige, redder underneath (user: more realistic)
  function region(dx, dy, dz) {
    return C_R.copy(C_PEARL).lerp(C_ROSE, 0.55 * smooth(-0.1, -0.7, dy) + 0.25 * smooth(0.2, -0.9, dz));
  }

  // ── One cerebral hemisphere. side = +1 (right) / -1 (left) ────────────────
  function hemisphere(side, low) {
    var W = 3.2, H = 2.8, L = 4.5, GAP = 0.05, WS = low ? 96 : 170, HS = low ? 64 : 116, ox = side < 0 ? 31.7 : 0;
    var g = new THREE.SphereGeometry(1, WS, HS);
    g.rotateZ(Math.PI / 2);                       // poles on ±x (medial/lateral): hidden spots
    var pos = g.attributes.position, n = pos.count, col = new Float32Array(n * 3), i;
    for (i = 0; i < n; i++) {
      var dx = pos.getX(i), dy = pos.getY(i), dz = pos.getZ(i);
      // base lobe shape (right hemisphere; lateral = +x, front = +z)
      var lx = dx < 0 ? dx * W * 0.20 : dx * W;
      var ly = dy < 0 ? dy * H * 0.60 : dy * H * 0.96;
      var lz = dz * L;
      // temporal lobe bulging down and out
      var tb = Math.exp(-Math.pow((dz + 0.05) / 0.42, 2)) * smooth(0.0, 0.6, dx) * smooth(0.15, -0.45, dy);
      ly -= tb * 0.95; lx += tb * 0.22;
      // narrower frontal pole, tapered occipital pole
      lx *= 1 - 0.15 * smooth(0.3, 1, dz) - 0.10 * smooth(-0.3, -1, dz);
      ly -= 0.35 * smooth(0.5, 1, dz);
      var px = lx + W * 0.20 + GAP, py = ly, pz = lz;

      // folds: three noise scales, domain-warped; grooves live on the noise zero-set
      var wx = noise(px * 0.6 + ox + 5, py * 0.6, pz * 0.6) * 0.9;
      var wy = noise(px * 0.6 + ox, py * 0.6 + 9, pz * 0.6 + 3) * 0.9;
      var wz = noise(px * 0.6 + ox + 17, py * 0.6 + 2, pz * 0.6 + 11) * 0.9;
      var f1 = noise((px + wx) * 1.05 + ox, (py + wy) * 1.05, (pz + wz) * 1.05);
      var f2 = noise(px * 2.3 + ox + 11, py * 2.3 + 7, pz * 2.3 + 3);
      var f3 = noise(px * 4.6 + ox + 19, py * 4.6, pz * 4.6 + 13);
      var g1 = 1 - smooth(0, 0.135, Math.abs(f1));
      var g2 = (1 - smooth(0, 0.085, Math.abs(f2))) * 0.30;
      var g3 = (1 - smooth(0, 0.07, Math.abs(f3))) * 0.10;
      var groove = 1 - (1 - g1) * (1 - g2) * (1 - g3);
      var depth = 0.46 * g1 + 0.20 * g2 + 0.08 * g3;
      var bulge = 0.20 * Math.min(1, Math.abs(f1) / 0.35);
      var lateral = smooth(-0.55, -0.05, dx);        // medial wall stays smooth
      var disp = (bulge - depth) * lateral;
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      px += dx / len * disp; py += dy / len * disp; pz += dz / len * disp;

      pos.setXYZ(i, side * px, py, pz);

      // baked ambient occlusion in vertex colour
      var ao = 1 - 0.92 * Math.pow(groove, 0.8) * lateral;
      ao *= 0.80 + 0.20 * smooth(-1, 0.6, dy);        // underside a touch darker
      C_TMP.copy(C_SULCUS).lerp(region(dx, dy, dz), Math.pow(Math.max(0, ao), 1.9));
      C_TMP.r *= 0.94 + 0.12 * f3; C_TMP.g *= 0.96 + 0.08 * f2;
      col[i * 3] = C_TMP.r; col[i * 3 + 1] = C_TMP.g; col[i * 3 + 2] = C_TMP.b;
    }
    if (side < 0) {                                  // mirrored => flip winding
      var idx = g.index.array, t, k;
      for (k = 0; k < idx.length; k += 3) { t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    fixSeams(g, WS, HS);
    return g;
  }

  // ── Cerebellum: ellipsoid with fine parallel folia ────────────────────────
  function cerebellum(low) {
    var WS = low ? 64 : 110, HS = low ? 40 : 70, g = new THREE.SphereGeometry(1, WS, HS), pos = g.attributes.position, n = pos.count;
    var col = new Float32Array(n * 3), i;
    for (i = 0; i < n; i++) {
      var dx = pos.getX(i), dy = pos.getY(i), dz = pos.getZ(i);
      var px = dx * 2.5, py = dy * 1.05 - (dy < 0 ? 0.2 * -dy : 0), pz = dz * 1.6;
      px *= 1 - 0.25 * smooth(0.2, 1, dy * -1);
      var f = noise(px * 0.7 + 50, py * 0.7, pz * 0.7);
      var fol = Math.abs(Math.sin(py * 15.5 + f * 2.2 + px * 0.25));
      var groove = 1 - smooth(0.0, 0.22, fol);
      var disp = -0.15 * groove + 0.04 * fol;
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      px += dx / len * disp; py += dy / len * disp; pz += dz / len * disp;
      pos.setXYZ(i, px, py - 1.95, pz - 3.9);
      C_TMP.copy(C_SULCUS).lerp(C_ROSE, 0.85 * (1 - 0.9 * groove));
      col[i * 3] = C_TMP.r; col[i * 3 + 1] = C_TMP.g; col[i * 3 + 2] = C_TMP.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals(); fixSeams(g, WS, HS);
    return g;
  }

  // ── Brainstem + spinal cord: a tapered, slightly bent tube ───────────────
  function stem(low) {
    var curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -1.5, -1.1), new THREE.Vector3(0, -3.1, -1.7),
      new THREE.Vector3(0, -5.0, -2.2), new THREE.Vector3(0.25, -7.0, -2.6), new THREE.Vector3(0.1, -8.7, -2.5)]);
    var TS = low ? 50 : 90, RS = low ? 14 : 24;
    var g = new THREE.TubeGeometry(curve, TS, 1, RS, false), pos = g.attributes.position, n = pos.count, i;
    var seg = RS + 1, col = new Float32Array(n * 3);
    for (i = 0; i < n; i++) {
      var ring = Math.floor(i / seg), t = ring / TS, c = curve.getPointAt(Math.min(1, t));
      var rad = 0.64 - 0.40 * smooth(0, 0.4, t) - 0.06 * smooth(0.4, 1, t);
      var x = pos.getX(i) - c.x, y = pos.getY(i) - c.y, z = pos.getZ(i) - c.z;
      var wob = 1 + 0.07 * noise(c.x * 3 + 70, c.y * 2.4, c.z * 3 + ring * 0.07);
      pos.setXYZ(i, c.x + x * rad * wob, c.y + y * rad * wob, c.z + z * rad * wob);
      C_TMP.copy(C_SULCUS).lerp(C_ROSE, 0.6); col[i * 3] = C_TMP.r; col[i * 3 + 1] = C_TMP.g; col[i * 3 + 2] = C_TMP.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }

  AFRAME.registerComponent('brain-mesh', {
    schema: { detail: { default: 'high' }, motes: { default: 520 }, filaments: { default: 16 } },

    init: function () {
      var grp = new THREE.Group(), self = this, i, low = this.data.detail === 'low';
      var nMotes = low ? 160 : this.data.motes, nFil = low ? 8 : this.data.filaments;

      // wet tissue: glossy clearcoat under the brain lights
      var tissue = low
        ? new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, roughness: 0.42, metalness: 0,
            emissive: new THREE.Color(0x2a1012), emissiveIntensity: 0.22 })        // phones: no clearcoat pass
        : new THREE.MeshPhysicalMaterial({ vertexColors: true, color: 0xffffff, roughness: 0.52, metalness: 0,
            clearcoat: 1.0, clearcoatRoughness: 0.18,
            emissive: new THREE.Color(0x2a1012), emissiveIntensity: 0.20 });
      this.mat = tissue;
      [hemisphere(1, low), hemisphere(-1, low), cerebellum(low), stem(low)].forEach(function (g) { grp.add(new THREE.Mesh(g, tissue)); });

      // glowing neural paths hugging the cortex (surface points found by raycasting)
      // blood vessels (not glowing wires): dark red, flushing with each heartbeat
      var pathMat = this.pathMat = new THREE.MeshStandardMaterial({ color: 0x5a0a0e, roughness: 0.35, emissive: new THREE.Color(0x8a0a10), emissiveIntensity: 0.2 });
      var surf = this.surf = [];
      grp.updateMatrixWorld(true);
      var rc = new THREE.Raycaster(), hits = [grp.children[0], grp.children[1]], nP = low ? 5 : 12, ORG = new THREE.Vector3(), DIR = new THREE.Vector3();
      for (var pi = 0; pi < nP; pi++) {
        var side = pi % 2 ? 1 : -1, kind = pi % 3, pts = [], ph = pi * 3.7;
        for (var k = 0; k <= 26; k++) {
          var u = k / 26, z = (0.5 - u) * 8.4 + noise(u * 3.5, ph, 1) * 1.1;
          if (kind < 2) { var x = side * (1.1 + 1.7 * (0.5 + 0.5 * noise(u * 4.2, ph, 4))); ORG.set(x, 9, z); DIR.set(0, -1, 0); }
          else { var yy = 0.4 + noise(u * 2.2, ph, 8) * 1.2; ORG.set(side * 9, yy, z); DIR.set(-side, 0, 0); }
          rc.set(ORG, DIR);
          var h = rc.intersectObjects(hits, false)[0];
          if (h) { var sp = h.point.clone().addScaledVector(h.face.normal.clone().transformDirection(h.object.matrixWorld), 0.045); pts.push(sp); surf.push(sp); }
        }
        if (pts.length > 6) grp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.026 + (pi % 3) * 0.01, 5, false), pathMat));
      }

      // glowing filaments from the underside down to the tank floor / ring
      var fm = new THREE.MeshStandardMaterial({ color: 0x2a1204, emissive: new THREE.Color(0xff9a3a), emissiveIntensity: 1.0, transparent: true, opacity: 0.8, roughness: 0.4 });
      this.filMat = fm;
      for (i = 0; i < nFil; i++) {
        var a = (i / nFil) * Math.PI * 2 + noise(i * 1.7, 3, 9) * 0.6;
        var sx = Math.cos(a) * (0.6 + Math.abs(noise(i, 1, 2)) * 2.0), sz = -0.8 + Math.sin(a) * (0.8 + Math.abs(noise(i, 4, 7)) * 2.2);
        var R = 5.2 + Math.abs(noise(i * 2.1, 5, 1)) * 2.0;
        var curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sx, -1.3, sz),
          new THREE.Vector3(sx * 1.6 + Math.cos(a) * 1.2, -3.2, sz * 1.4 + Math.sin(a) * 1.2),
          new THREE.Vector3(Math.cos(a) * (R * 0.7), -5.4, Math.sin(a) * (R * 0.7)),
          new THREE.Vector3(Math.cos(a) * R, -8.6, Math.sin(a) * R)]);
        grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.025 + (i % 3) * 0.012, 6, false), fm));
      }

      // drifting electrogel motes (local y: tank floor ≈ -8.7 … glass floor ≈ +7.3)
      var N = nMotes, mp = new Float32Array(N * 3);
      this.moteSpeed = new Float32Array(N);
      for (i = 0; i < N; i++) {
        var r = Math.sqrt(Math.random()) * 7.2, th = Math.random() * 6.283;
        mp[i * 3] = Math.cos(th) * r; mp[i * 3 + 1] = -8.7 + Math.random() * 16; mp[i * 3 + 2] = Math.sin(th) * r;
        this.moteSpeed[i] = 0.05 + Math.random() * 0.12;
      }
      var mg = new THREE.BufferGeometry();
      mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
      this.motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: 0xffd9a8, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.5, depthWrite: false }));
      this.motes.frustumCulled = false;
      grp.add(this.motes);

      // electrical discharge: a few jagged bolts across the cortex, rebuilt each strike, plus a flash light
      this.arcs = [];
      var arcMat = this.arcMat = new THREE.MeshBasicMaterial({ color: 0x6fd8ff, transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false, toneMapped: false });   // drawn over the folds so it reads as a strike
      for (i = 0; i < 6; i++) { var ln = new THREE.Mesh(new THREE.BufferGeometry(), arcMat); ln.frustumCulled = false; ln.renderOrder = 5; grp.add(ln); this.arcs.push(ln); }
      var gc = document.createElement('canvas'); gc.width = gc.height = 64; var gx = gc.getContext('2d'), gg = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gg.addColorStop(0, 'rgba(230,250,255,1)'); gg.addColorStop(0.3, 'rgba(120,220,255,0.45)'); gg.addColorStop(1, 'rgba(60,160,255,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 64, 64);
      this.spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      this.spark.scale.set(3.2, 3.2, 1); this.spark.material.depthTest = false; this.spark.renderOrder = 5; grp.add(this.spark);
      this.zap = new THREE.PointLight(0x9fe8ff, 0, 14, 2); grp.add(this.zap);
      this.nextZap = 2.5; this.zapT = -1;

      this.el.setObject3D('brain', grp);
    },

    strike: function () {                // pick a spot on the cortex and throw jagged bolts across nearby folds
      var S = this.surf; if (!S || S.length < 4) return;
      var top = this.top || (this.top = S.filter(function (q) { return q.y > 0.8; })), a = (top.length ? top : S)[Math.floor(Math.random() * (top.length || S.length))], self = this;   // start on the visible crown
      this.arcs.forEach(function (ln, k) {
        var b = S[Math.floor(Math.random() * S.length)], pts = [];
        if (a.distanceTo(b) > 6) b = a.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 1.2, (Math.random() - 0.5) * 3));
        for (var j = 0; j < 14; j++) { var u = j / 13, j2 = Math.sin(u * Math.PI) * 0.35;
          pts.push(new THREE.Vector3(a.x + (b.x - a.x) * u + (Math.random() - 0.5) * j2, a.y + (b.y - a.y) * u + Math.sin(u * Math.PI) * 0.4 + (Math.random() - 0.5) * j2, a.z + (b.z - a.z) * u + (Math.random() - 0.5) * j2)); }
        ln.geometry.dispose(); ln.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 40, 0.05 + Math.random() * 0.05, 5, false); ln.visible = k < 3 + Math.floor(Math.random() * 4);
      });
      this.spark.position.copy(a); this.zap.position.copy(a).add(new THREE.Vector3(0, 1, 0));
      this.zapT = 0;
    },

    tick: function (t, dt) {
      if (!this.motes) return;
      var s = Math.min(dt, 50) / 1000, p = this.motes.geometry.attributes.position, a = p.array, i, n = p.count;
      for (i = 0; i < n; i++) {
        a[i * 3 + 1] += this.moteSpeed[i] * s;
        a[i * 3] += Math.sin(t / 2300 + i) * 0.002;
        if (a[i * 3 + 1] > 7.3) a[i * 3 + 1] = -8.7;
      }
      p.needsUpdate = true;
      this.filMat.emissiveIntensity = 0.85 + 0.45 * Math.sin(t / 700);
      var g = this.el.getObject3D('brain');
      // no turning (user): it PUMPS — a lub-dub heartbeat (~66 bpm) swells it slightly and flushes the vessels with blood
      var bt = (t / 1000) % 0.9, beat = Math.exp(-Math.pow((bt - 0.08) / 0.05, 2)) + 0.6 * Math.exp(-Math.pow((bt - 0.3) / 0.06, 2));
      if (g) { g.scale.set(1 + 0.018 * beat, 1 + 0.024 * beat, 1 + 0.018 * beat); }
      if (this.pathMat) this.pathMat.emissiveIntensity = 0.15 + 0.9 * beat;
      if (this.mat) { this.mat.emissive.setRGB(0.32, 0.03, 0.05); this.mat.emissiveIntensity = 0.08 + 0.22 * beat; }
      // electrical discharges every few seconds: flicker for ~0.35 s
      var ts = t / 1000;
      if (this.zapT < 0 && ts > this.nextZap) { this.strike(); this.nextZap = ts + 10 + Math.random() * 14; }   /* toned down (user, Nov 26) */
      if (this.zapT >= 0) {
        this.zapT += s; var f = this.zapT < 0.35 ? (Math.random() < 0.7 ? 1 : 0.15) * (1 - this.zapT / 0.35) : 0;
        this.arcMat.opacity = f * 0.6; this.spark.material.opacity = f * 0.5; this.zap.intensity = f * 1.6;
        if (this.zapT >= 0.35) { this.zapT = -1; this.arcMat.opacity = 0; this.spark.material.opacity = 0; this.zap.intensity = 0; }
      }
    },

    remove: function () { this.el.removeObject3D('brain'); }
  });
}());

// ── Electrogel tank: fills the void around the brain ─────────────────────────
(function () {
  var THREE = AFRAME.THREE;
  function gradTex() {
    var c = document.createElement('canvas'); c.width = 4; c.height = 256; var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, 256);          // top (y=0) → bottom (y=-16)
    g.addColorStop(0.00, 'rgba(40,200,170,0.10)');
    g.addColorStop(0.30, 'rgba(30,170,190,0.32)');
    g.addColorStop(0.48, 'rgba(60,220,210,0.55)');         // glow around the brain
    g.addColorStop(0.70, 'rgba(20,110,150,0.38)');
    g.addColorStop(1.00, 'rgba(10,40,90,0.60)');
    x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    var t = new THREE.CanvasTexture(c); return t;
  }
  function sprite() {
    var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d');
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    // a real bubble: clear middle, bright rim, a specular glint
    g.addColorStop(0, 'rgba(200,255,240,0.05)'); g.addColorStop(0.62, 'rgba(200,255,240,0.18)'); g.addColorStop(0.82, 'rgba(230,255,250,0.95)'); g.addColorStop(0.95, 'rgba(200,255,240,0.25)'); g.addColorStop(1, 'rgba(200,255,240,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.fillStyle = 'rgba(255,255,255,0.95)'; x.beginPath(); x.ellipse(22, 20, 7, 4, -0.7, 0, 7); x.fill();
    return new THREE.CanvasTexture(c);
  }
  AFRAME.registerComponent('gel-tank', {
    init: function () {
      var low = window.WAYFARER && window.WAYFARER.mobile, grp = new THREE.Group(), i;
      // gel volume (inside of the cylinder wall, so it reads as a lit liquid behind the brain)
      var vol = new THREE.Mesh(new THREE.CylinderGeometry(7.9, 7.9, 16, low ? 40 : 72, 1, true),
        new THREE.MeshBasicMaterial({ map: gradTex(), side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      vol.position.set(0, -8, 0); grp.add(vol);
      // ── paneled machinery wall with lit teal vents ──
      var wc = document.createElement('canvas'), we = document.createElement('canvas'); wc.width = we.width = 1024; wc.height = we.height = 512;
      var x = wc.getContext('2d'), xe = we.getContext('2d'), px, py, rr = 11;
      x.fillStyle = '#1b2523'; x.fillRect(0, 0, 1024, 512); xe.fillStyle = '#000'; xe.fillRect(0, 0, 1024, 512);
      for (px = 0; px < 8; px++) for (py = 0; py < 4; py++) {
        var X = px * 128 + 6, Y = py * 128 + 6, shade = 24 + ((px * 7 + py * 13) % 5) * 5;
        x.fillStyle = 'rgb(' + shade + ',' + (shade + 10) + ',' + (shade + 8) + ')'; x.fillRect(X, Y, 116, 116);
        x.strokeStyle = '#0a1110'; x.lineWidth = 3; x.strokeRect(X, Y, 116, 116);
        x.fillStyle = '#6b5a35'; [[X + 8, Y + 8], [X + 108, Y + 8], [X + 8, Y + 108], [X + 108, Y + 108]].forEach(function (p) { x.beginPath(); x.arc(p[0], p[1], 4, 0, 6.3); x.fill(); });
        x.fillStyle = 'rgba(0,0,0,0.35)'; for (var gy = 0; gy < 5; gy++) x.fillRect(X + 24, Y + 30 + gy * 14, 68, 6);   // slat grilles
        if ((px * 3 + py * 5) % 4 === 0) { xe.fillStyle = '#3affd0'; xe.fillRect(X + 22, Y + 24, 72, 16); x.fillStyle = '#146a5c'; x.fillRect(X + 22, Y + 24, 72, 16); }
        if ((px + py * 2) % 5 === 1) { xe.fillStyle = '#ffa23c'; xe.fillRect(X + 90, Y + 94, 14, 10); }
      }
      var wt = new THREE.CanvasTexture(wc), wet = new THREE.CanvasTexture(we);
      wt.wrapS = wt.wrapT = wet.wrapS = wet.wrapT = THREE.RepeatWrapping; wt.repeat.set(3, 2); wet.repeat.set(3, 2);
      var wallM = new THREE.Mesh(new THREE.CylinderGeometry(8.12, 8.12, 16, low ? 48 : 96, 1, true),
        new THREE.MeshStandardMaterial({ map: wt, emissiveMap: wet, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.55, metalness: 0.7, side: THREE.BackSide }));
      wallM.position.y = -8; grp.add(wallM);

      var brass = new THREE.MeshStandardMaterial({ color: 0xa8843e, roughness: 0.38, metalness: 0.95, emissive: 0x2a1a06, emissiveIntensity: 0.6 });
      var tealM = new THREE.MeshBasicMaterial({ color: 0x3affd0, fog: false });
      [-3.5, -9.5, -14.5].forEach(function (y) {                          // brass hoops on the wall
        var r = new THREE.Mesh(new THREE.TorusGeometry(8.0, 0.14, 8, low ? 64 : 128), brass); r.rotation.x = Math.PI / 2; r.position.y = y; grp.add(r);
      });

      // ── floor: grated plate + concentric ring + brass clamp ring around the brain's base ──
      var gc = document.createElement('canvas'), gce = document.createElement('canvas'); gc.width = gc.height = gce.width = gce.height = 256;
      var g2 = gc.getContext('2d'), g2e = gce.getContext('2d'); g2.fillStyle = '#0b1514'; g2.fillRect(0, 0, 256, 256); g2e.fillStyle = '#000'; g2e.fillRect(0, 0, 256, 256);
      g2.strokeStyle = '#2b4a45'; g2.lineWidth = 3; g2e.strokeStyle = '#1fbfa0'; g2e.lineWidth = 2;
      for (i = 0; i <= 256; i += 32) { g2.beginPath(); g2.moveTo(i, 0); g2.lineTo(i, 256); g2.moveTo(0, i); g2.lineTo(256, i); g2.stroke(); g2e.beginPath(); g2e.moveTo(i, 0); g2e.lineTo(i, 256); g2e.moveTo(0, i); g2e.lineTo(256, i); g2e.stroke(); }
      var gt = new THREE.CanvasTexture(gc), get = new THREE.CanvasTexture(gce); gt.wrapS = gt.wrapT = get.wrapS = get.wrapT = THREE.RepeatWrapping; gt.repeat.set(8, 8); get.repeat.set(8, 8);
      var floor = new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshStandardMaterial({ map: gt, emissiveMap: get, emissive: 0xffffff, emissiveIntensity: 1.0, roughness: 0.6, metalness: 0.8 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -15.9; grp.add(floor);
      var fr = new THREE.Mesh(new THREE.TorusGeometry(7.8, 0.08, 6, 96), tealM); fr.rotation.x = Math.PI / 2; fr.position.y = -15.85; grp.add(fr);
      var base = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.3, 10, 64), brass); base.rotation.x = Math.PI / 2; base.position.y = -13.2; grp.add(base);
      var base2 = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 1.5, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a2a26, roughness: 0.5, metalness: 0.8, side: THREE.DoubleSide, emissive: 0x0a2a24, emissiveIntensity: 0.6 }));
      base2.position.y = -14.5; grp.add(base2);
      for (i = 0; i < 6; i++) {                                           // clamp blocks
        var ca = i / 6 * Math.PI * 2 + 0.3, cb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), brass);
        cb.position.set(Math.cos(ca) * 3.7, -13.1, Math.sin(ca) * 3.7); cb.rotation.y = -ca; grp.add(cb);
      }

      // ── vessel cables: wall ports → brain ──
      var vessel = new THREE.MeshStandardMaterial({ color: 0x5a2432, roughness: 0.45, metalness: 0.1, emissive: 0x2a0a14, emissiveIntensity: 0.5 });
      var strand = new THREE.MeshStandardMaterial({ color: 0xc58a92, roughness: 0.4, metalness: 0.1, emissive: 0x401820, emissiveIntensity: 0.5 });
      var strand2 = new THREE.MeshStandardMaterial({ color: 0x5e6fb0, roughness: 0.4, metalness: 0.1, emissive: 0x101840, emissiveIntensity: 0.5 });
      var nC = low ? 6 : 10, FR = new THREE.Vector3();
      for (i = 0; i < nC; i++) {
        var ang = i / nC * Math.PI * 2 + 0.15, py0 = -5.6 - (i % 3) * 1.7, dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
        var P0 = dir.clone().multiplyScalar(7.7).setY(py0), P3 = dir.clone().multiplyScalar(2.3).setY(-7.3 + ((i % 3) - 1) * 0.8 - 0.4);
        var P1 = dir.clone().multiplyScalar(6.0).setY(py0 - 1.4 - (i % 2) * 0.6), P2 = dir.clone().multiplyScalar(3.9).setY(P3.y - 1.0 - (i % 2) * 0.5);
        var cv = new THREE.CatmullRomCurve3([P0, P1, P2, P3]);
        grp.add(new THREE.Mesh(new THREE.TubeGeometry(cv, low ? 24 : 48, 0.27, low ? 8 : 12, false), vessel));
        if (!low) {
          var fr2 = cv.computeFrenetFrames(60, false);
          [[0, strand], [Math.PI, strand2]].forEach(function (hh) {
            var hp = [], q, pt;
            for (q = 0; q <= 60; q++) {
              pt = cv.getPointAt(q / 60); var ang2 = q * 0.45 + hh[0];
              hp.push(pt.clone().addScaledVector(fr2.normals[q], Math.cos(ang2) * 0.3).addScaledVector(fr2.binormals[q], Math.sin(ang2) * 0.3));
            }
            grp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp), 120, 0.075, 6, false), hh[1]));
          });
        }
        var flange = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.14, 8, 24), brass), collar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.5, 20), brass);
        var inward = dir.clone().multiplyScalar(-1);
        flange.position.copy(P0).addScaledVector(dir, 0.25); flange.lookAt(flange.position.clone().add(dir));
        collar.position.copy(P0).addScaledVector(dir, 0.05); collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward);
        grp.add(flange); grp.add(collar);
        var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb04a, fog: false })); lamp.position.copy(P0).addScaledVector(dir, 0.55).setY(py0 + 0.75); grp.add(lamp);
      }

      // soft light shafts from the floor vents
      var shaft = new THREE.MeshBasicMaterial({ color: 0x2fe8c0, transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
      for (i = 0; i < (low ? 3 : 5); i++) {
        var sa = i / (low ? 3 : 5) * Math.PI * 2 + 0.7, sm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1.3, 15, 16, 1, true), shaft);
        sm.position.set(Math.cos(sa) * 5.8, -8.5, Math.sin(sa) * 5.8); grp.add(sm);
      }

      // rising bubbles / plankton
      var n = low ? 60 : 120, p = new Float32Array(n * 3);   /* fewer bubbles (user, Nov 26) */ this.sp = new Float32Array(n); this.ph = new Float32Array(n);
      for (i = 0; i < n; i++) {
        var vent = i % 3 === 0, r = vent ? 5.8 + Math.random() * 0.4 : Math.sqrt(Math.random()) * 7.4, th = vent ? Math.floor(Math.random() * 8) / 8 * 6.283 + Math.random() * 0.08 : Math.random() * 6.283;   // a third rise in streams from vents
        p[i * 3] = Math.cos(th) * r; p[i * 3 + 1] = -15.5 + Math.random() * 15; p[i * 3 + 2] = Math.sin(th) * r;
        this.sp[i] = 0.9 + Math.random() * 1.6; this.ph[i] = Math.random() * 6.283;
      }
      var bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(p, 3));
      this.bub = new THREE.Points(bg, new THREE.PointsMaterial({ map: sprite(), size: 0.3, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xd8fff4, fog: false }));
      this.bub.frustumCulled = false; this.bub.renderOrder = -2; grp.add(this.bub);   // before the glass floor (it writes depth)
      // EELS (user, Nov 26): long dark electrogel eels with glowing stripes, swimming lazy loops round the brain.
      //   One InstancedMesh of tapered body segments; each eel's head follows a wandering path and the body trails its history.
      var NE = low ? 3 : 5, SEG = 18, eelM = new THREE.MeshStandardMaterial({ color: 0x0e2a2c, roughness: 0.35, metalness: 0.2, emissive: 0x0a6a60, emissiveIntensity: 0.55 });
      this.eel = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), eelM, NE * SEG); this.eel.frustumCulled = false; this.eel.renderOrder = -1; grp.add(this.eel);
      var eyeM = new THREE.MeshBasicMaterial({ color: 0x9fffe8, toneMapped: false }); this.eyes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 6, 4), eyeM, NE * 2); this.eyes.frustumCulled = false; grp.add(this.eyes);
      this.eels = []; for (i = 0; i < NE; i++) { var hist = []; for (var k = 0; k < 160; k++) { var a0 = i * 1.7 - k * 0.012; hist.push(new THREE.Vector3(Math.cos(a0) * (3.6 + i * 0.75), -4.5 - i * 1.6, Math.sin(a0) * (3.6 + i * 0.75))); } this.eels.push({ r: 3.6 + i * 0.75, y: -4.5 - i * 1.6, sp: 0.22 + i * 0.05, ph: i * 1.7, dir: i % 2 ? 1 : -1, hist: hist, seg: SEG, size: 0.24 + (i % 3) * 0.05 }); }
      this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._sc = new THREE.Vector3(); this._up = new THREE.Vector3(0, 0, 1);
      this.el.setObject3D('tank', grp);
    },
    tickEels: function (t) {
      var T = t / 1000, M = this._m, Q = this._q, V = this._v, SC = this._sc;
      for (var e = 0; e < this.eels.length; e++) {
        var E = this.eels[e], a = E.ph + T * E.sp * E.dir, head = new THREE.Vector3(Math.cos(a) * (E.r + Math.sin(T * 0.37 + e) * 1.2), E.y + Math.sin(T * 0.5 + e * 2) * 2.2, Math.sin(a) * (E.r + Math.sin(T * 0.37 + e) * 1.2));
        if (head.distanceTo(E.hist[0]) > 0.03) { E.hist.unshift(head); E.hist.pop(); } else E.hist[0].copy(head);
        // body segments sit at fixed ARC LENGTHS behind the head (so the eel stays joined at any frame rate)
        var gap = E.size * 1.1, hi = 0, acc = 0, PTS = this._pts || (this._pts = []);
        for (var k2 = 0; k2 <= E.seg; k2++) { var want = k2 * gap; while (hi < E.hist.length - 2 && acc + E.hist[hi].distanceTo(E.hist[hi + 1]) < want) { acc += E.hist[hi].distanceTo(E.hist[hi + 1]); hi++; }
          var seglen = E.hist[hi].distanceTo(E.hist[hi + 1]) || 1e-6, f = Math.min(1, Math.max(0, (want - acc) / seglen)); PTS[k2] = (PTS[k2] || new THREE.Vector3()).lerpVectors(E.hist[hi], E.hist[hi + 1], f); }
        for (var k = 0; k < E.seg; k++) {
          var p0 = PTS[k], p1 = PTS[k + 1], w = Math.sin(T * 6 - k * 0.6) * 0.12 * (k / E.seg);   // a swimming wiggle that grows toward the tail
          V.subVectors(p0, p1); if (V.lengthSq() < 1e-6) V.set(1, 0, 0); V.normalize(); Q.setFromUnitVectors(this._up, V);
          var taper = E.size * (k < 2 ? 0.8 + k * 0.15 : 1 - (k - 2) / (E.seg - 1) * 0.85);
          SC.set(taper, taper * 0.75, taper * 1.9); M.compose(new THREE.Vector3(p0.x + V.z * w, p0.y, p0.z - V.x * w), Q, SC); this.eel.setMatrixAt(e * E.seg + k, M);
          if (k === 0) { for (var s2 = 0; s2 < 2; s2++) { var side = new THREE.Vector3(V.z, 0, -V.x).normalize().multiplyScalar((s2 ? 1 : -1) * taper * 0.6); M.makeTranslation(p0.x + side.x + V.x * taper, p0.y + taper * 0.4, p0.z + side.z + V.z * taper); this.eyes.setMatrixAt(e * 2 + s2, M); } }
        }
      }
      this.eel.instanceMatrix.needsUpdate = true; this.eyes.instanceMatrix.needsUpdate = true;
    },
    tick: function (t, dt) {
      if (this.eel) this.tickEels(t);
      var s = Math.min(dt, 50) / 1000, a = this.bub.geometry.attributes.position, d = a.array, i, n = a.count;
      for (i = 0; i < n; i++) {
        d[i * 3 + 1] += this.sp[i] * s;
        d[i * 3] += Math.sin(t / 250 + this.ph[i]) * 0.006; d[i * 3 + 2] += Math.cos(t / 310 + this.ph[i]) * 0.006;   // wobble as they rise
        if (d[i * 3 + 1] > -0.6) d[i * 3 + 1] = -15.6;
      }
      a.needsUpdate = true;
    },
    remove: function () { this.el.removeObject3D('tank'); }
  });
}());
