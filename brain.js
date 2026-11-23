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

  // Colour ramp: sulci (grooves) dark teal, gyri (ridges) pale gel-tinted tissue
  var C_SULCUS = new THREE.Color(0.03, 0.14, 0.10), C_GYRUS = new THREE.Color(0.27, 0.66, 0.46), C_TMP = new THREE.Color(), C_R = new THREE.Color(), C_FR = new THREE.Color(0.16,0.72,0.52), C_PA = new THREE.Color(0.14,0.52,0.86), C_OC = new THREE.Color(0.52,0.30,0.84), C_TP = new THREE.Color(0.86,0.66,0.30);
  // front = teal-green, crown = blue, back = violet, temporal = warm gold
  function region(dx, dy, dz) {
    C_R.copy(C_PA).lerp(C_FR, smooth(-0.1, 0.8, dz)).lerp(C_OC, smooth(-0.1, -0.85, dz));
    return C_R.lerp(C_TP, 0.75 * smooth(0.1, -0.5, dy) * smooth(0.0, 0.5, dx));
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
      var g1 = 1 - smooth(0, 0.115, Math.abs(f1));
      var g2 = (1 - smooth(0, 0.085, Math.abs(f2))) * 0.55;
      var g3 = (1 - smooth(0, 0.07, Math.abs(f3))) * 0.25;
      var groove = 1 - (1 - g1) * (1 - g2) * (1 - g3);
      var depth = 0.46 * g1 + 0.20 * g2 + 0.08 * g3;
      var bulge = 0.13 * Math.min(1, Math.abs(f1) / 0.35);
      var lateral = smooth(-0.55, -0.05, dx);        // medial wall stays smooth
      var disp = (bulge - depth) * lateral;
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      px += dx / len * disp; py += dy / len * disp; pz += dz / len * disp;

      pos.setXYZ(i, side * px, py, pz);

      // baked ambient occlusion in vertex colour
      var ao = 1 - 0.92 * Math.pow(groove, 0.8) * lateral;
      ao *= 0.80 + 0.20 * smooth(-1, 0.6, dy);        // underside a touch darker
      C_TMP.copy(C_SULCUS).lerp(region(dx, dy, dz), Math.pow(Math.max(0, ao), 1.3));
      C_TMP.r *= 0.93 + 0.12 * f3; C_TMP.g *= 0.97 + 0.06 * f3;
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
      C_TMP.copy(C_SULCUS).lerp(C_GYRUS, 0.78 * (1 - 0.9 * groove));
      C_TMP.r *= 1.05; C_TMP.g *= 0.92;
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
      C_TMP.copy(C_SULCUS).lerp(C_GYRUS, 0.55); col[i * 3] = C_TMP.r; col[i * 3 + 1] = C_TMP.g; col[i * 3 + 2] = C_TMP.b;
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
        ? new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, roughness: 0.4, metalness: 0,
            emissive: new THREE.Color(0x0c3038), emissiveIntensity: 0.22 })        // phones: no clearcoat pass
        : new THREE.MeshPhysicalMaterial({ vertexColors: true, color: 0xffffff, roughness: 0.52, metalness: 0,
            clearcoat: 0.75, clearcoatRoughness: 0.28,
            emissive: new THREE.Color(0x0c3038), emissiveIntensity: 0.20 });
      this.mat = tissue;
      [hemisphere(1, low), hemisphere(-1, low), cerebellum(low), stem(low)].forEach(function (g) { grp.add(new THREE.Mesh(g, tissue)); });

      // glowing filaments from the underside down to the tank floor / ring
      var fm = new THREE.MeshStandardMaterial({ color: 0x0a2a22, emissive: new THREE.Color(0x35ffc4), emissiveIntensity: 1.0, transparent: true, opacity: 0.8, roughness: 0.4 });
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
      this.motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: 0xbfffe8, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.5, depthWrite: false }));
      this.motes.frustumCulled = false;
      grp.add(this.motes);

      this.el.setObject3D('brain', grp);
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
      if (g) g.rotation.y += s * 0.16;               // slow turn (~40 s a revolution)
      if (this.mat) this.mat.emissiveIntensity = 0.20 + 0.14 * Math.sin(t / 1200);
    },

    remove: function () { this.el.removeObject3D('brain'); }
  });
}());
