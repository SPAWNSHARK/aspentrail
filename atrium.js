// SS Wayfarer — THE SPLIT-LEVEL ATRIUM (user, Nov 26: "Full rebuild" to the Wayfarer Atrium Asset Kit v0.3).
// Kit: models/atrium/*.glb + reference/atrium-kit/ (MASTER_SPEC, layout.json, navigation.json, Assembly_Guide.pdf).
// Ship-space coordinates straight from the kit (bow = −Z, port = −X); the whole kit is lowered 0.65 so the UPPER deck floor is y 0
// and the LOWER deck floor is y −5.95. The kit's blockout materials are re-skinned by NAME into the house style (copper, bronze,
// walnut, polished dark deck, amber light). Upper hall: walkways either side of a capsule opening looking down onto the lower
// hall; fore/aft crossovers; skylight. Aft: the hall's back end opens (beside the Library door) onto the apron that rings the
// Library, and twin curved stairs spiral down to the lower deck apron and the lower hall.
// Walking: wasd/thumbsticks move the camera; every frame a ray is cast DOWN onto the walkable meshes (floors, crossovers,
// landings, treads): steps up ≤ 0.5 m / down ≤ 0.7 m are taken (that is how the stairs work), anything else (the opening, a wall
// line, the end of a floor) puts you back where you were. Doors = the shared door.js, at the kit's thresholds.
(function () {
  var THREE = AFRAME.THREE, OFF = -0.65, LOW = -5.95, KIT = 'models/atrium/';
  var MOB = /iPhone|iPad|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));

  // ── the ship's doorways in the atrium: kit thresholds; frame +z faces INTO the hall ──
  // id = existing room page (PORTALS in door.js) or a new room (locked until its page exists)
  var DOORS = [
    { id: 'bridge',   name: 'COMMAND BRIDGE',    x: 0,    z: -24,  rot: 0,    y: 0,   tint: 0x4aa8ff },
    { id: 'library',  name: 'THE LIBRARY',       x: 0,    z: 25.8, rot: 180,  y: 0,   tint: 0x3fe0c8 },   // Nov 27 segmentation: own page again
    { id: 'corenorth', name: 'THE CORE', x: 0, z: 26.6, rot: 180, y: LOW, tint: 0x3fe0c8, inYaw: 180, noRecess: true, shallow: true },   // Nov 28: north doorway from the lower hall via a sealed tunnel
    { id: 'core',     name: 'THE CORE',          x: 0,    z: 45.4, rot: 0,    y: LOW, tint: 0x3fe0c8, noRecess: true, shallow: true },   // brain + reactor = core.html; Nov 27 (user sketch): the arch in the core wall at the foot of the stairs (was the forward door at z 26.6)
    { id: 'holodeck', name: 'HOLODECK',          x: -4.6, z: -14,  rot: 90,   y: 0,   tint: 0x8a5cff },
    { id: 'quarters', name: "CAPTAIN'S QUARTERS", x: -4.6, z: 9,   rot: 90,   y: 0,   tint: 0xc08a50 },
    { id: 'lounge',   name: 'CREW LOUNGE',       x: 4.6,  z: -14,  rot: -90,  y: 0,   tint: 0xffa060 },
    { id: 'media',    name: 'MEDIA NEXUS',       x: 4.6,  z: 9,    rot: -90,  y: 0,   tint: 0x4f8cff },
    { id: 'firefly',  name: 'FIREFLY HANGAR',    x: 0,    z: -24,  rot: 0,    y: LOW, tint: 0x6fd0ff},
    { id: 'medbay',   name: 'MEDBAY',            x: -4.6, z: -14,  rot: 90,   y: LOW, tint: 0x7fffd0},
    { id: 'xeno',     name: 'XENOBIOLOGY',       x: -4.6, z: 9,    rot: 90,   y: LOW, tint: 0x9aff6a},
    { id: 'mess',     name: 'MESS HALL',         x: 4.6,  z: -14,  rot: -90,  y: LOW, tint: 0xffc070},
    { id: 'maint',    name: 'MAINTENANCE',       x: 4.6,  z: 9,    rot: -90,  y: LOW, tint: 0xd0a080},
    { id: 'libstair-starboard', name: 'THE LIBRARY', x: 9.195, z: 31.59, rot: 115.7,  y: 0, tint: 0xffb040, wing: 'starboard' },   // Nov 27: back into the Library from the top of each staircase (core wall, same spot as the Library's own stairs door)
    { id: 'libstair-port',      name: 'THE LIBRARY', x: -9.195, z: 31.59, rot: -115.7, y: 0, tint: 0x4f8cff, wing: 'port' },
    { id: 'lowerhall', name: 'LOWER ATRIUM',     x: 0,    z: 24.9, rot: 180,  y: LOW, tint: 0x6fd0ff, pass: true }   // Nov 27: the stair apron's door into the lower hall (no page: just a doorway)
  ];
  window.WAYFARER = window.WAYFARER || {}; window.WAYFARER.atriumDoors = DOORS;
  window.WF_KIT = { M: M, mats: function (env) { mats(env); return M; }, envMap: function (r) { return envMap(r); }, merge: function (root, walk, keep) { return merge(root, walk, keep); } };   /* kitroom.js */

  // ── house-style materials, by the kit's material names ──
  var M = {};
  function mats(env) {
    function std(o) { var m = new THREE.MeshStandardMaterial(o); if (env && o.metalness > 0.2) { m.envMap = env; m.envMapIntensity = o.env || 0.8; } return m; }
    M.copper = std({ color: 0xb8703c, metalness: 0.85, roughness: 0.36 });
    M.bronze = std({ color: 0xc89050, metalness: 0.9, roughness: 0.28, env: 1 });
    M.gun = std({ color: 0x59626b, metalness: 0.85, roughness: 0.35, env: 0.5 });   // Nov 27: graphite-metal trim (user: no copper tone on stairs/rails)
    M.edge = new THREE.MeshStandardMaterial({ color: 0x2a1a0c, emissive: 0xffa040, emissiveIntensity: 1.6 });
    M.steel = std({ color: 0x2c2622, metalness: 0.55, roughness: 0.5 });
    M.floor = std({ color: 0x17110d, metalness: 0.4, roughness: 0.2, env: 1.2 });
    M.wood = new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.6 });
    M.leather = new THREE.MeshStandardMaterial({ color: 0x5a1c14, roughness: 0.55 });
    M.cream = new THREE.MeshStandardMaterial({ color: 0xf0dcb8, emissive: 0x553a20, emissiveIntensity: 0.5, roughness: 0.6 });
    M.glass = new THREE.MeshStandardMaterial({ color: 0x5fd0c8, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
    M.amber = new THREE.MeshStandardMaterial({ color: 0x3a2008, emissive: 0xffa040, emissiveIntensity: 2.0 });
    M.teal = new THREE.MeshStandardMaterial({ color: 0x0a2a28, emissive: 0x3fe0c8, emissiveIntensity: 1.6 });
    M.blue = new THREE.MeshStandardMaterial({ color: 0x101a40, emissive: 0x6a7cff, emissiveIntensity: 1.4 });
  }
  function envMap(renderer) {           // a warm gradient room for the metals to reflect (no PMREM of the whole scene: phone cost)
    var c = document.createElement('canvas'); c.width = 256; c.height = 128; var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#1a1410'); g.addColorStop(0.42, '#ffb060'); g.addColorStop(0.5, '#3a2414'); g.addColorStop(1, '#0a0806'); x.fillStyle = g; x.fillRect(0, 0, 256, 128);
    for (var i = 0; i < 9; i++) { x.fillStyle = 'rgba(255,200,130,.8)'; x.fillRect(i * 29, 50, 8, 6); }
    var t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    var pm = new THREE.PMREMGenerator(renderer), rt = pm.fromEquirectangular(t); pm.dispose(); return rt.texture;
  }

  // ── merge a loaded kit model into one mesh per material (the kit is hundreds of tiny nodes: ~1 draw call each on a phone) ──
  var WALK = /Floor|floor|Landing|Crossover|Stair_tread/;
  function merge(root, walkOut, keep) {
    root.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), buckets = {};
    root.traverse(function (o) {
      if (!o.isMesh) return; var name = (o.material && o.material.name) || 'steel', walk = WALK.test(o.name) || WALK.test(o.parent && o.parent.name || '');
      if (keep && keep(o)) { (buckets.__keep = buckets.__keep || []).push(o); return; }
      if (/^Ceiling_/.test(o.name)) name = 'steel';
      var key = (walk ? 'walk:' : '') + name, g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      if (/^(Upper|Lower)_Landing/.test(o.name)) g.translate(0, 0.012, 0);   /* Nov 27: the kit landings are coplanar with the apron floor slabs (both top faces at the deck height) = the pixel-smear flicker at the top of the stairs */
      (buckets[key] = buckets[key] || []).push(g);
    });
    var out = new THREE.Group(), kept = buckets.__keep || []; delete buckets.__keep;
    Object.keys(buckets).forEach(function (k) {
      var list = buckets[k], n = 0; list.forEach(function (g) { n += g.attributes.position.count; });
      var P = new Float32Array(n * 3), N = new Float32Array(n * 3), o = 0;
      list.forEach(function (g) { P.set(g.attributes.position.array, o * 3); if (g.attributes.normal) N.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; g.dispose(); });
      var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      var mn = k.replace('walk:', ''), mesh = new THREE.Mesh(geo, M[mn] || M.steel); out.add(mesh);
      if (k.indexOf('walk:') === 0) { mesh.material = mesh.material.clone(); mesh.material.side = THREE.DoubleSide; walkOut.push(mesh); }   /* some kit floor tops face down: rays must hit both sides */
    });
    kept.forEach(function (o) { var mt = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), m = new THREE.Mesh(o.geometry, M[(o.material && o.material.name) || 'steel'] || M.steel); m.name = o.name; m.applyMatrix4(mt); out.add(m); });
    return out;
  }

  // ── walls: walnut panels along the hall outline (both decks), with gaps for every door and the open aft end ──
  function wallTex() {
    var L = window.TEX && window.TEX.library({ lite: MOB, wallOnly: true }), t = new THREE.TextureLoader().load(L.wall.albedo); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
    var gl = new THREE.TextureLoader().load(L.wall.glow); gl.colorSpace = THREE.SRGBColorSpace; gl.wrapS = THREE.RepeatWrapping; return { map: t, glow: gl };
  }
  function buildWalls(root, outline) {
    var T = wallTex(), H = 3.2, HL = -0.23 - LOW,   /* the lower hall is open up to the underside of the upper floor */ mat = new THREE.MeshStandardMaterial({ map: T.map, emissiveMap: T.glow, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.6, metalness: 0.1, color: 0x9a8070 });
    [0, LOW].forEach(function (y0) {
      var pos = [], uv = [], idx = [], run = 0;
      for (var i = 0; i < outline.length; i++) {
        var a = outline[i], b = outline[(i + 1) % outline.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-3) continue;
        if (Math.abs(a[1] - b[1]) < 1e-3 && Math.abs(a[1] - 25.8) < 0.01) { run += L; continue; }   // the aft end stays open onto the Library apron
        var steps = Math.max(1, Math.ceil(L / 0.1));   /* 10 cm strips: the doorway cut hugs the frame (0.5 m left gaps the sky showed through) */
        for (var s = 0; s < steps; s++) {
          var k0 = s / steps, k1 = (s + 1) / steps, x0 = a[0] + (b[0] - a[0]) * k0, z0 = a[1] + (b[1] - a[1]) * k0, x1 = a[0] + (b[0] - a[0]) * k1, z1 = a[1] + (b[1] - a[1]) * k1;
          var mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
          if (DOORS.some(function (d) { return d.y === y0 && Math.hypot(mx - d.x, mz - d.z) < 1.05; })) {      // doorway: only the lintel above it
            var vv = pos.length / 3, top = y0 + (y0 === 0 ? H : HL), uu0 = run / 3, uu1 = (run + L / steps) / 3; run += L / steps;
            pos.push(x0, y0 + 2.95, z0, x1, y0 + 2.95, z1, x1, top, z1, x0, top, z0); uv.push(uu0, 0.9, uu1, 0.9, uu1, 1, uu0, 1); idx.push(vv, vv + 1, vv + 2, vv, vv + 2, vv + 3); continue; }
          var v = pos.length / 3, u0 = run / 3, u1 = (run + L / steps) / 3; run += L / steps;
          var hh = y0 === 0 ? H : HL; pos.push(x0, y0, z0, x1, y0, z1, x1, y0 + hh, z1, x0, y0 + hh, z0); uv.push(u0, 0, u1, 0, u1, 1, u0, 1); idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
        }
      }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      var w = new THREE.Mesh(g, mat); mat.side = THREE.DoubleSide; mat.depthWrite = true; root.add(w);
    });
    // the Library (upper) / Engine room (lower) round outer wall at the aft core, gap in front for its door
    var cyl = new THREE.CylinderGeometry(10.2, 10.2, H, 96, 6, true, Math.PI + 0.11, Math.PI * 2 - 0.22);   // θ measured from +z: front (toward the hall) = π
    var cm = mat.clone(); cm.map = T.map.clone(); cm.map.repeat.set(20, 1); cm.map.needsUpdate = true; cm.emissiveMap = T.glow.clone(); cm.emissiveMap.repeat.set(20, 1); cm.emissiveMap.needsUpdate = true;
    buildUpperCore(root, cm, H);   // Library wall (upper deck) with the two stair-top doorways
    buildLowerCore(root, cm, HL);   // lower deck: the same wall, but with glass windows onto the brain tank beside the stairs
    // upper hall ceiling (the kit's roof only covers the middle): the hall outline with the skylight cut out
    var sh = new THREE.Shape(outline.map(function (q) { return new THREE.Vector2(q[0], -q[1]); })), hole = new THREE.Path();
    hole.moveTo(-2.05, 17.55); hole.lineTo(2.05, 17.55); hole.lineTo(2.05, -18.05); hole.lineTo(-2.05, -18.05); hole.lineTo(-2.05, 17.55); sh.holes.push(hole);
    var hc = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.steel); hc.rotation.x = -Math.PI / 2; hc.position.y = 3.24; root.add(hc);
    // ceiling over the upper aft apron (the kit leaves it open), with an amber ring round the Library wall
    var rs = new THREE.Shape(), ra = Math.asin(-10.3 / 21.5), k;   // outer arc (through +z) closed by the line z = 25.7; the Library wall is the hole
    for (k = 0; k <= 96; k++) { var aa = ra + (Math.PI - 2 * ra) * k / 96, px = 21.5 * Math.cos(aa), pz = 36 + 21.5 * Math.sin(aa); if (k === 0) rs.moveTo(px, -pz); else rs.lineTo(px, -pz); }
    rs.lineTo(-21.5 * Math.cos(ra), -25.7); rs.lineTo(21.5 * Math.cos(ra), -25.7);
    var rh = new THREE.Path(); for (k = 0; k <= 96; k++) { var ab = 2 * Math.PI * k / 96, hx = 10.2 * Math.cos(ab), hz = 36 + 10.2 * Math.sin(ab); if (k === 0) rh.moveTo(hx, -hz); else rh.lineTo(hx, -hz); } rs.holes.push(rh);
    var cmat = M.steel.clone(); cmat.side = THREE.DoubleSide; cmat.polygonOffset = true; cmat.polygonOffsetFactor = 2; cmat.polygonOffsetUnits = 2;
    var ceil = new THREE.Mesh(new THREE.ShapeGeometry(rs, 24), cmat); ceil.rotation.x = -Math.PI / 2; ceil.position.set(0, 3.22, 0); root.add(ceil);   // (rotation.x −90°: shape y → world −z, so z was negated above)
    var ring = new THREE.Mesh(new THREE.TorusGeometry(10.35, 0.04, 6, 128), M.amber); ring.rotation.x = Math.PI / 2; ring.position.set(0, 3.12, 36); root.add(ring);
    // amber cove strips along the top of the hall walls (both decks) and a bronze sill line
    [0, LOW].forEach(function (y0) { [-1, 1].forEach(function (s) {
      var strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 34), M.amber); strip.position.set(s * 4.52, y0 + (y0 === 0 ? 3.05 : HL - 0.15), 0.75); root.add(strip);
      var sill = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 34), M.bronze); sill.position.set(s * 4.54, y0 + 0.9, 0.75); root.add(sill); }); });
  }

  // V0.4 — physical landing extensions in the kit's measured stair coordinate system.
  // Both treads and new landings participate in the same walking raycast.
  function buildStairLandings(root) {
    [-1, 1].forEach(function (side) {
      var vertices = [], indices = [], radius = 11.35, width = 1.8;
      var a0 = -0.56, a1 = -0.345, steps = 16;
      for (var i = 0; i <= steps; i++) {
        var a = a0 + (a1 - a0) * i / steps;
        [radius - width / 2, radius + width / 2].forEach(function (r) {
          vertices.push(side * r * Math.cos(a), 0, 36 + r * Math.sin(a));
        });
        if (i < steps) { var k = 2 * i; indices.push(k, k+1, k+2, k+1, k+3, k+2); }
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      // Set the actual winding based on its normal rather than assuming mirror orientation.
      geo.computeVertexNormals();
      if (geo.attributes.normal.getY(0) < 0) {
        for (var k = 0; k < indices.length; k += 3) { var tmp = indices[k+1]; indices[k+1] = indices[k+2]; indices[k+2] = tmp; }
        geo.setIndex(indices); geo.computeVertexNormals();
      }
      var mat = M.floor.clone(); mat.side = THREE.DoubleSide; mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;   /* Nov 27: coplanar with the kit floor = pixel flicker */
      var mesh = new THREE.Mesh(geo, mat); mesh.position.y = 0.03; mesh.name = 'V04_Upper_Stair_Landing_' + side;
      root.add(mesh); walk.push(mesh);
      // A solid-looking bronze edge and low-profile rails, kept outside walking width.
      [radius+width/2].forEach(function (r) {   /* Nov 27: the inner rail (core-wall side) ran straight across the Library door */
        var pts = []; for (var j=0;j<=12;j++) { var a=a0+(a1-a0)*j/12; pts.push(new THREE.Vector3(side*r*Math.cos(a),1.0,36+r*Math.sin(a))); }
        var curve = new THREE.CatmullRomCurve3(pts);
        root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,0.035,6,false),M.gun));
        [a0+0.02,a1-0.02].forEach(function(a){var post=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,1,6),M.steel);post.position.set(side*r*Math.cos(a),0.5,36+r*Math.sin(a));root.add(post);});
      });
      // Light both approaches, not just the corridor center.
      [0, LOW].forEach(function (y) {
        var l = new THREE.PointLight(0xffc78a, 0.8, 12, 1.8);
        l.position.set(side * 11.35, y + 2.5, 36); root.add(l);
      });
    });
  }

  // upper core (the Library's outer wall, r 10.2): solid except the front gap and a doorway at each staircase top (θ ±1.38 rad)
  function buildUpperCore(root, cm, H) {
    var R = 10.2, hw = 1.05 / R, gaps = [-2.02, 2.02], cur = -Math.PI + 0.11, parts = [];
    gaps.forEach(function (c) { parts.push([cur, c - hw]); cur = c + hw; }); parts.push([cur, Math.PI - 0.11]);
    function seg(a, b, y0, y1) { var g = new THREE.CylinderGeometry(R, R, y1 - y0, Math.max(4, Math.ceil((b - a) / 0.05)), Math.max(1, Math.round((y1 - y0) / 1.2)), true, a, b - a), m = new THREE.Mesh(g, cm); m.position.set(0, (y0 + y1) / 2, 36); root.add(m); }
    parts.forEach(function (q) { seg(q[0], q[1], 0, H); });
    gaps.forEach(function (c) { seg(c - hw, c + hw, 2.95, H); });                // lintel over each doorway
  }
  // ── Nov 27: STAIRWELL SHAFT, BRAIN WINDOWS, LIGHTING ─────────────────────────────────────────────────────────────
  // The twin stairs spiral round the Library/Engine core inside a shaft: outer wall r 16 from the lower floor to the upper ceiling
  // (D-shaped: it meets the hall mouth at z 25.8), lights, and glass windows in the lower core wall onto the electrogel tank + brain.
  var SH_R = 16.0, SH_TOP = 3.24, MOUTH = 25.8;
  function polyWall(root, mat, pts, y0, y1, rows, name) {
    var pos = [], uv = [], idx = [], run = 0, i, j;
    for (i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (j = 0; j < rows; j++) {
        var ya = y0 + (y1 - y0) * j / rows, yb = y0 + (y1 - y0) * (j + 1) / rows, v = pos.length / 3;
        pos.push(a[0], ya, a[1], b[0], ya, b[1], b[0], yb, b[1], a[0], yb, a[1]);
        uv.push(run / 3, ya / 3, (run + L) / 3, ya / 3, (run + L) / 3, yb / 3, run / 3, yb / 3); idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
      }
      run += L;
    }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    var m = new THREE.Mesh(g, mat); m.name = name || 'wall'; if (/^(ShaftArc|ShaftFront|Part)/.test(m.name)) m.userData.v8Skip = true; root.add(m); return m;
  }
  function arcPts(r, d0, d1, step, cx, cz) { var p = [], n = Math.max(2, Math.ceil(Math.abs(d1 - d0) / step)), k; for (k = 0; k <= n; k++) { var a = (d0 + (d1 - d0) * k / n) * Math.PI / 180; p.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); } return p; }
  // Nov 27 (user screenshot: a handrail ran across the Library door at the top of each staircase): drop rail segments + posts within 2.6 m of those doors
  function clearDoorRails(scene) {
    scene.updateMatrixWorld(true); var kill = [], v = new THREE.Vector3();
    scene.traverse(function (o) {
      if (!/^(Handrail|Rail_post)/.test(o.name)) return; new THREE.Box3().setFromObject(o).getCenter(v);
      var y = v.y + 0.65;   /* kit y → ship y (the whole kit is lowered 0.65) */
      kill.push(o);   /* Nov 27: ALL kit rails go (stepped ribbon floating off its posts); buildStairTunnels draws smooth ones on the tread slope */
    });
    kill.forEach(function (o) { o.parent && o.parent.remove(o); }); console.log('atrium: door rails removed', kill.length);
  }
  // Nov 27 (user, annotated: "the railing needs to be up against an actual wall"): each flight is a closed spiral TUNNEL — inner + outer wall just outside the rails, ceiling above, arched mouth at the foot
  function railRadii(scene) {
    scene.updateMatrixWorld(true); var lo = 99, hi = 0, v = new THREE.Vector3();
    scene.traverse(function (o) { if (!/^(Handrail|Rail_post)/.test(o.name)) return; new THREE.Box3().setFromObject(o).getCenter(v); if (Math.abs(v.x) < 3) return; var r = Math.hypot(v.x, v.z - 36); if (r < lo) lo = r; if (r > hi) hi = r; });
    console.log('atrium: stair rail radii', lo.toFixed(2), hi.toFixed(2)); return lo < hi ? [lo, hi] : null;
  }
  function buildStairTunnels(root, stairMesh, rr) {
    root.updateMatrixWorld(true);
    var ri = rr[0] - 0.12, ro = rr[1] + 0.12, rm = (rr[0] + rr[1]) / 2, HT = 2.9, STEP = 0.035, rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), o3 = new THREE.Vector3();
    var wallM = M.steel.clone(); wallM.side = THREE.DoubleSide; wallM.color.set(0x1b1f24); wallM.emissive = new THREE.Color(0x070a0d); wallM.roughness = 0.95; wallM.metalness = 0.1; wallM.envMapIntensity = 0.05;
    var lineM = new THREE.MeshBasicMaterial({ color: 0xa9d2f0, fog: false, side: THREE.DoubleSide });
    [1, -1].forEach(function (sg) {
      var pts = [], t;
      for (t = 0.28; t <= 2.6; t += STEP) {
        o3.set(sg * rm * Math.sin(t), 4, 36 + rm * Math.cos(t)); rc.set(o3, dn); var h = rc.intersectObject(stairMesh, true)[0];
        if (!h) { if (pts.length) break; else continue; } var y = h.point.y; if (y > 0.12) break; pts.push([t, y]);
      }
      if (pts.length < 6) { console.warn('stair tunnel: probe failed', sg, pts.length); return; }
      (function () { var raw = pts.map(function (q) { return q[1]; }), W2 = 5; pts.forEach(function (q, i) { var a = 0, n = 0, j; for (j = Math.max(0, i - W2); j <= Math.min(raw.length - 1, i + W2); j++) { a += raw[j]; n++; } q[1] = a / n; }); })();   /* smooth the step profile: walls, roof and light lines follow the slope, not each tread */
      function P(r, k, arr) { var t = (arr || pts)[k][0]; return [sg * r * Math.sin(t), 36 + r * Math.cos(t)]; }
      function strip(rA, yA, rB, yB, mat, name, arr) {                 // ribbon between two radius/height offsets along the flight
        arr = arr || pts; var pos = [], idx = [], k; for (k = 0; k < arr.length; k++) { var a = P(rA, k, arr), b = P(rB, k, arr); pos.push(a[0], arr[k][1] + yA, a[1], b[0], arr[k][1] + yB, b[1]); }
        for (k = 0; k < arr.length - 1; k++) { var q = k * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
        var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        var mm = new THREE.Mesh(g, mat); mm.name = name; mm.userData.v8Skip = true; root.add(mm); return mm;
      }
      // Nov 27 (user: "should feel like a stairwell, you shouldn't see around it"): the tunnel runs on over the top landing, a closed vestibule in front of the Library door (end cap at θ TE; core wall = inner side, gap kept at the door)
      var TE = 2.18, LY = pts[pts.length - 1][1] + 0.02, land = [], tl; for (tl = pts[pts.length - 1][0] + 0.04; tl <= TE + 1e-6; tl += 0.04) land.push([tl, LY]); if (land[land.length - 1][0] < TE - 1e-6) land.push([TE, LY]);
      var all = pts.concat(land), innerA = pts.filter(function (q) { return q[0] <= 1.9; }), innerB = land.filter(function (q) { return q[0] >= 2.14; });
      strip(ri, -0.3, ri, HT + 0.06, wallM, 'TunnelInner', innerA); if (innerB.length > 1) strip(ri, -0.3, ri, HT + 0.06, wallM, 'TunnelInnerL', innerB);
      strip(ro, -0.3, ro, HT + 0.06, wallM, 'TunnelOuter', all); strip(ri - 0.06, HT, ro + 0.06, HT, wallM, 'TunnelRoof', all);
      strip(ri + 0.01, HT - 0.18, ri + 0.01, HT - 0.1, lineM, 'TunnelLineI', innerA); strip(ro - 0.01, HT - 0.18, ro - 0.01, HT - 0.1, lineM, 'TunnelLineO', all);
      (function () { var cw = new THREE.Mesh(new THREE.PlaneGeometry(ro - ri, HT + 0.3), wallM), cc = Math.cos(TE), sc2 = Math.sin(TE); cw.name = 'TunnelCap'; cw.userData.v8Skip = true;
        cw.position.set(sg * (ri + ro) / 2 * sc2, LY - 0.3 + (HT + 0.3) / 2, 36 + (ri + ro) / 2 * cc); cw.rotation.y = Math.atan2(-cc, sg * sc2) + Math.PI; root.add(cw);
        var ll = new THREE.PointLight(0xd8e8ff, 0.35, 6, 1.6); ll.position.set(sg * rm * Math.sin(2.12), LY + 2.2, 36 + rm * Math.cos(2.12)); root.add(ll); })();   // pale-blue light line along the top of each wall
      // Nov 27 (user: handrail geometry detached/chunky): smooth gunmetal rail tube + posts on both sides of each flight, following the smoothed tread slope
      (function () {
        var rm2 = new THREE.MeshStandardMaterial({ color: 0x59626b, metalness: 0.85, roughness: 0.35 });
        [rr[0], rr[1]].forEach(function (R) {
          var cp = all.filter(function (q) { return !(R === rr[0] && q[0] >= 1.9 && q[0] <= 2.14); }).map(function (q) { return new THREE.Vector3(sg * R * Math.sin(q[0]), q[1] + 0.92, 36 + R * Math.cos(q[0])); });
          var seg = [cp]; if (R === rr[0]) { var ix = all.findIndex(function (q) { return q[0] >= 1.9; }), iy = all.findIndex(function (q) { return q[0] >= 2.14; }); seg = [all.slice(0, ix).map(function (q) { return new THREE.Vector3(sg * R * Math.sin(q[0]), q[1] + 0.92, 36 + R * Math.cos(q[0])); }), all.slice(iy).map(function (q) { return new THREE.Vector3(sg * R * Math.sin(q[0]), q[1] + 0.92, 36 + R * Math.cos(q[0])); })]; }
          seg.forEach(function (pp) {
            if (pp.length < 3) return; var tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pp), pp.length * 2, 0.028, 8, false), rm2); tube.name = 'StairHandrail'; tube.userData.v8Skip = true; root.add(tube);
            var k, last = -9; for (k = 0; k < pp.length; k++) { var d = k ? pp[k].distanceTo(pp[last < 0 ? 0 : last]) : 9; if (k && d < 1.1 && k < pp.length - 1) continue; last = k;
              var post = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.92, 6), rm2); post.position.set(pp[k].x, pp[k].y - 0.46, pp[k].z); post.name = 'StairPost'; post.userData.v8Skip = true; root.add(post); }
          });
        });
      })();
      // Nov 28 (user: "a stairwell with handrails and lighting at the base of each stair"): glowing baseboard light line along both walls of the flight + warm-white lamps at the foot
      (function () { var bm = new THREE.MeshBasicMaterial({ color: 0xcfe8ff, fog: false, side: THREE.DoubleSide });
        strip(ri + 0.015, 0.02, ri + 0.015, 0.11, bm, 'StairBaseI', innerA); strip(ro - 0.015, 0.02, ro - 0.015, 0.11, bm, 'StairBaseO', all);
        [0, 6, 14].forEach(function (k) { var q = pts[Math.min(k, pts.length - 1)], l = new THREE.PointLight(0xe4f0ff, 1.1, 6, 1.5); l.position.set(sg * rm * Math.sin(q[0]), q[1] + 1.2, 36 + rm * Math.cos(q[0])); root.add(l); });
        [ri + 0.06, ro - 0.06].forEach(function (R) { var q = pts[1], sc3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.1), bm); sc3.position.set(sg * R * Math.sin(q[0]), q[1] + 1.9, 36 + R * Math.cos(q[0])); sc3.name = 'StairSconce'; sc3.userData.v8Skip = true; root.add(sc3); }); })();
      // arched mouth at the foot: wall face with an arch-shaped doorway, bronze arc
      var t0 = pts[0][0], y0 = pts[0][1], W = ro - ri, sh = new THREE.Shape(), ho = new THREE.Path(), k2, aw = W / 2 - 0.12, hh = HT + 0.3 - 0.3;
      sh.moveTo(0, 0); sh.lineTo(W, 0); sh.lineTo(W, HT + 0.3); sh.lineTo(0, HT + 0.3); sh.lineTo(0, 0);
      var cx = W / 2, ah = 1.55; ho.moveTo(cx - aw, 0); ho.lineTo(cx + aw, 0); ho.lineTo(cx + aw, ah); for (k2 = 1; k2 <= 20; k2++) { var an = k2 / 20 * Math.PI; ho.lineTo(cx + aw * Math.cos(an), ah + aw * Math.sin(an)); } ho.lineTo(cx - aw, 0); sh.holes.push(ho);
      var face = new THREE.Mesh(new THREE.ShapeGeometry(sh), wallM); face.name = 'TunnelMouth'; face.userData.v8Skip = true;
      var cs = Math.cos(t0), sn = Math.sin(t0);       // radial plane at angle t0: local x → radial outward, local y → up
      face.position.set(sg * ri * sn, y0 - 0.3, 36 + ri * cs); face.rotation.order = 'YXZ'; face.rotation.y = Math.atan2(-cs, sg * sn); root.add(face);
      var arc = new THREE.Mesh(new THREE.TorusGeometry(aw + 0.03, 0.045, 6, 28, Math.PI), M.gun); arc.userData.v8Skip = true; arc.rotation.order = 'YXZ'; arc.rotation.y = face.rotation.y;
      var mid = [sg * rm * sn, y0 + ah, 36 + rm * cs]; arc.position.set(mid[0], mid[1], mid[2]); root.add(arc);
      [0.2, 0.5, 0.8].forEach(function (f) { var q = pts[Math.floor((pts.length - 1) * f)], l = new THREE.PointLight(0xd8e8ff, 0.3, 7, 1.6); l.position.set(sg * rm * Math.sin(q[0]), q[1] + 2.3, 36 + rm * Math.cos(q[0])); root.add(l); });
      console.log('atrium: stair tunnel', sg, pts.length, 'steps', pts[0][0].toFixed(2), pts[pts.length-1][0].toFixed(2), pts[pts.length-1][1].toFixed(2));
    });
  }
  // Nov 27 (user: stairs not looking right): the kit's glow strips went blown-out white under the shaft lights and the treads read as pale slabs
  function stairLook(g) {
    var cache = {};
    g.traverse(function (o) {
      if (!o.isMesh) return; var src = o.material, k = src.uuid; if (!cache[k]) {
        var m = src.clone();
        if (m.emissive && m.emissive.getHex() > 0) { m.emissive.set(0x7fb8e0); m.emissiveIntensity = 0.55; m.color.set(0x14181c); }          // handrail / edge strips: a soft pale-blue line, not a white bar
        else if (m.color) { var cu = m.color.r > m.color.b * 1.2 && m.side !== THREE.DoubleSide;   /* walkable (DoubleSide) = treads: graphite */ m.color.set(cu ? 0x59626b : 0x262b31); m.map = null; m.metalness = cu ? 0.8 : 0.5; m.roughness = cu ? 0.4 : 0.55; }       /* balusters keep thin copper; treads/risers graphite */       // treads, risers, balusters: darker graphite
        if (m.envMapIntensity !== undefined) m.envMapIntensity = Math.min(m.envMapIntensity, 0.5);
        cache[k] = m;
      }
      o.material = cache[k]; o.userData.v8Skip = true;
    });
  }
  function buildStairShaft(root) {
    var mat = M.steel.clone(); mat.side = THREE.DoubleSide; mat.color.set(0x24272b); mat.roughness = 0.7; mat.envMapIntensity = 0.3; root.userData.shaftMat = mat;
    var a0 = Math.asin(-(36 - MOUTH) / SH_R) * 180 / Math.PI;                 // where r 16 crosses z 25.8  (≈ −40.8°)
    var xE = SH_R * Math.cos(a0 * Math.PI / 180);
    polyWall(root, mat, arcPts(SH_R, a0, 180 - a0, 2, 0, 36), LOW, SH_TOP, 9, 'ShaftArc');               // round outer wall, through +z
    polyWall(root, mat, [[xE, MOUTH], [2.62, MOUTH]], LOW, SH_TOP, 9, 'ShaftFrontE');                     // flat front either side of the hall mouth
    polyWall(root, mat, [[-xE, MOUTH], [-2.62, MOUTH]], LOW, SH_TOP, 9, 'ShaftFrontW');
    // Nov 27 (user sketch: stairs live inside a CLOSED tower round the core): roof over the whole shaft, hole = the Library wall r 10.2
    (function () {
      var sh = new THREE.Shape(), k, n = 72;
      for (k = 0; k <= n; k++) { var an = (a0 + (180 - 2 * a0) * k / n) * Math.PI / 180; sh[k ? 'lineTo' : 'moveTo'](SH_R * Math.cos(an), 36 + SH_R * Math.sin(an)); }
      sh.lineTo(-xE, MOUTH); sh.lineTo(xE, MOUTH);
      var hole = new THREE.Path(); for (k = 0; k <= 64; k++) { var b2 = k / 64 * Math.PI * 2; hole[k ? 'lineTo' : 'moveTo'](10.2 * Math.cos(b2), 36 + 10.2 * Math.sin(b2)); } sh.holes.push(hole);
      var g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2);      /* shape x,y → x,z ; flip so y is up */
      var pos = g.attributes.position; for (k = 0; k < pos.count; k++) pos.setY(k, SH_TOP);
      var cm2 = mat.clone(); cm2.polygonOffset = true; cm2.polygonOffsetFactor = 1; cm2.polygonOffsetUnits = 1;
      var roof = new THREE.Mesh(g, cm2); roof.name = 'ShaftRoof'; roof.userData.v8Skip = true; root.add(roof);
      var lid = new THREE.Mesh(new THREE.CircleGeometry(10.25, 72), cm2); lid.rotation.x = Math.PI / 2; lid.position.set(0, SH_TOP, 36); lid.name = 'CoreLid'; lid.userData.v8Skip = true; root.add(lid);   /* the Library wall r 10.2 had no roof: looking up from the stairs showed the void */
    })();
    // upper-deck lintel over the hall mouth + lower-deck partition with its doorway (door 'lowerhall' at z 24.9)
    var pm = mat;
    polyWall(root, pm, [[-2.62, 24.9], [-1.05, 24.9]], LOW, -0.23, 3, 'PartL'); polyWall(root, pm, [[1.05, 24.9], [2.62, 24.9]], LOW, -0.23, 3, 'PartR');
    polyWall(root, pm, [[-1.05, 24.9], [1.05, 24.9]], LOW + 2.95, -0.23, 1, 'PartLintel');
    polyWall(root, pm, [[-2.62, 24.9], [-2.62, 27.1]], LOW, -0.23, 3, 'NTunnelL'); polyWall(root, pm, [[2.62, 24.9], [2.62, 27.1]], LOW, -0.23, 3, 'NTunnelR');   // Nov 28: sealed passage from the lower-hall door to the north Core door
    // thin light lines round the shaft + a bronze band at each deck
    [[LOW + 0.55, M.teal], [-0.34, M.gun], [2.95, M.amber]].forEach(function (q) { polyWall(root, q[1], arcPts(SH_R - 0.04, a0, 180 - a0, 2, 0, 36), q[0], q[0] + 0.07, 1, 'ShaftBand'); });
    // Nov 27 (user sketch IMG_7403: two stair arches left/right + a CENTRE ARCH both paths lead to): the stair feet open into a pocket closed by a wall across x at z 48.0 (x ±3.4, between the two tunnel mouths) with an arched doorway at x 0; the aft ring beyond leads round the core to the lower hall
    (function () {
      var H = -0.23 - LOW, ZW = 48.0, HW = 3.4, sh = new THREE.Shape(), k;
      sh.moveTo(0, 0); sh.lineTo(2 * HW, 0); sh.lineTo(2 * HW, H); sh.lineTo(0, H); sh.lineTo(0, 0);
      var hp = new THREE.Path(), cx0 = HW, aw = 1.3, ah = 2.5; hp.moveTo(cx0 - aw, 0); hp.lineTo(cx0 + aw, 0); hp.lineTo(cx0 + aw, ah); hp.absarc(cx0, ah, aw, 0, Math.PI, false); hp.lineTo(cx0 - aw, 0); /* Nov 28 (user: remove the left arch): foyer wall is solid again; hole path unused */   // Nov 28: arch back in (user: how do I get out to the hallway?) — core door -> foyer -> this arch -> aft ring -> lower hall
      var wm = mat.clone(); wm.polygonOffset = true; wm.polygonOffsetFactor = 1; wm.polygonOffsetUnits = 1;
      var w = new THREE.Mesh(new THREE.ShapeGeometry(sh), wm); w.position.set(-HW, LOW, ZW); w.name = 'ArchPartition'; w.userData.v8Skip = true; root.add(w);
      // Nov 28 (user: "I should not be able to see any of this"): ceiling over the foyer pocket (x ±3.4, core wall -> z 48) so you can't look up at the stair roofs / shaft; lamp fixtures on it
      (function () { var cs = new THREE.Shape(), n2 = 16, kk, xa = -HW, xb = HW; cs.moveTo(xa, ZW); cs.lineTo(xb, ZW);
        for (kk = 0; kk <= n2; kk++) { var xx = xb - (xb - xa) * kk / n2; cs.lineTo(xx, 36 + Math.sqrt(9.4 * 9.4 - xx * xx) - 0.05); }
        cs.lineTo(xa, ZW); var cg = new THREE.ShapeGeometry(cs); cg.rotateX(Math.PI / 2);   /* shape (x,y) -> world (x, ., y) */
        var cm3 = mat.clone(); cm3.color.set(0x2a2f35); cm3.polygonOffset = true; cm3.polygonOffsetFactor = 1; var cp3 = new THREE.Mesh(cg, cm3); cp3.position.y = LOW + 3.45; cp3.name = 'FoyerCeiling'; cp3.userData.v8Skip = true; root.add(cp3);
        var lm = new THREE.MeshBasicMaterial({ color: 0xdff0ff, fog: false }); [[-1.6, 46.7], [1.6, 46.7]].forEach(function (q) { var lb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.22), lm); lb.position.set(q[0], LOW + 3.42, q[1]); root.add(lb); }); })();
      var lt = new THREE.PointLight(0xd8e8ff, 1.5, 7, 1.5); lt.position.set(0, LOW + 2.5, ZW - 1.2); root.add(lt);
    })();
    // lights: white-blue, spread down the shaft (fewer on phones)
    var L = MOB ? [[0, -4.6], [90, -3.2], [180, -4.6], [60, 0.8], [120, 0.8]] : [[0, -4.6], [45, -3.0], [90, -4.6], [135, -3.0], [180, -4.6], [30, 0.8], [90, 0.8], [150, 0.8], [60, -1.6], [120, -1.6]];
    L.forEach(function (q) { var a = q[0] * Math.PI / 180, l = new THREE.PointLight(0xd8e8ff, 0.8, 13, 1.5); l.position.set(12.9 * Math.cos(a), q[1], 36 + 12.9 * Math.sin(a)); root.add(l); });
    [-1, 1].forEach(function (d) { var ll = new THREE.PointLight(0xd8e8ff, 0.6, 8, 1.5); ll.position.set(d * 9.9, 1.9, 30.2); root.add(ll); });   // upper landings: the Library wall beside the door read black
    var mid = new THREE.PointLight(0xd8e8ff, 0.8, 14, 1.5); mid.position.set(0, -2.8, 44.5); root.add(mid);       // base of the stairs, between the two flights
  }
  // glass portholes in the lower core wall (r 9.4, y LOW … −0.23): θ is CylinderGeometry's (from +z toward +x)
  function buildLowerCore(root, cm, HL) {
    var R = 9.4, h = HL, y0 = LOW, WIN = [], wins = [], k;
    WIN.forEach(function (w) { wins.push(w); wins.push([-w[1], -w[0]]); }); wins.sort(function (a, b) { return a[0] - b[0]; });
    var cursor = -Math.PI + 0.118, solid = [];
    wins.forEach(function (w) { solid.push([cursor, w[0]]); cursor = w[1]; }); solid.push([cursor, Math.PI - 0.118]);
    // Nov 27: gap for the 'core' door (θ 0, z 45.4) — the wall was solid behind the open door, so the portal photo sat inside it (user: 'flat grey wall in the arch')
    var GAPW = 0.118; solid = solid.reduce(function (o, q) { if (q[0] < 0 && q[1] > 0) { o.push([q[0], -GAPW]); o.push([GAPW, q[1]]); } else o.push(q); return o; }, []);
    function seg(a, b, mat, r, hh, yc) { var g = new THREE.CylinderGeometry(r, r, hh, Math.max(4, Math.ceil((b - a) / 0.05)), Math.max(1, Math.round(hh / 1.2)), true, a, b - a), m = new THREE.Mesh(g, mat); m.position.set(0, yc, 36); root.add(m); return m; }
    solid.forEach(function (s) { if (s[1] - s[0] > 0.01) seg(s[0], s[1], cm, R, h, y0 + h / 2); });
    seg(-GAPW, GAPW, cm, R, h - 3.1, y0 + 3.1 + (h - 3.1) / 2);   // lintel over the core door
    seg(Math.PI - GAPW, Math.PI + GAPW, cm, R, h - 3.1, y0 + 3.1 + (h - 3.1) / 2);   // lintel over the north core door
    var wy0 = y0 + 0.25, wy1 = -1.2, wh = wy1 - wy0;
    wins.forEach(function (w) {
      var gm = M.glass.clone(); gm.opacity = 0.10; seg(w[0], w[1], gm, R, wh, wy0 + wh / 2);                       // the pane
      seg(w[0], w[1], cm, R, y0 + h - wy1, (wy1 + y0 + h) / 2 - 0.0 + 0.0);                                         // wall above the window
      seg(w[0], w[1], cm, R, 0.25, y0 + 0.125);                                                                    // wall below it
      seg(w[0], w[1], M.bronze, R + 0.03, 0.1, wy1 - 0.05); seg(w[0], w[1], M.bronze, R + 0.03, 0.1, wy0 + 0.05); // bronze rails
      [w[0], w[1]].forEach(function (t) { var p = new THREE.Mesh(new THREE.BoxGeometry(0.14, wh, 0.14), M.bronze); p.position.set((R + 0.03) * Math.sin(t), wy0 + wh / 2, 36 + (R + 0.03) * Math.cos(t)); p.rotation.y = t; root.add(p); });
    });
  }
  // ── Nov 27: ONE VERTICAL CORE (user: brain over reactor, one structure) ──
  // upper: green-hydrogel chamber (glass, r CR) holding the brain, y CB…CT; lower: plasma-column reactor rising from a pit through the engineering
  // gallery to the chamber base; conduits + buttresses tie them together. Gallery ring (walkable, r GI…9.6) at the lower deck.
  var CR = 5.0, CB = -4.6, CT = 2.9, GI = 5.55, PIT = -11.5, CZ = 36, plasma = null;
  function buildCore(sc, root) {
    var g = new THREE.Group(); g.position.set(0, 0, CZ); root.add(g);
    function cyl(r0, r1, y0, y1, mat, open, seg) { var m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, y1 - y0, seg || (MOB ? 40 : 72), 1, !!open), mat); m.position.y = (y0 + y1) / 2; g.add(m); return m; }
    function ring(r, y, t, mat) { var m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, MOB ? 48 : 96), mat); m.rotation.x = Math.PI / 2; m.position.y = y; g.add(m); return m; }
    var gm = M.glass.clone(); gm.color.set(0x7dffb8); gm.opacity = 0.16; gm.side = THREE.DoubleSide; gm.depthWrite = false;
    cyl(CR, CR, CB, CT, gm, true);                                                                                         // chamber glass
    var gel = new THREE.MeshBasicMaterial({ color: 0x0c9a4c, transparent: true, opacity: 0.42, side: THREE.BackSide, depthWrite: false, fog: false });
    cyl(CR - 0.06, CR - 0.06, CB, CT, gel, true);                                                                          // hydrogel glow
    var cap = new THREE.Mesh(new THREE.CircleGeometry(CR, 64), gm); cap.rotation.x = -Math.PI / 2; cap.position.y = CT; g.add(cap);
    var plate = new THREE.Mesh(new THREE.CircleGeometry(CR + 0.35, 64), M.steel); plate.rotation.x = Math.PI / 2; plate.position.y = CB - 0.02; g.add(plate);   // chamber floor (faces down = underside seen from the gallery)
    var plate2 = new THREE.Mesh(new THREE.CircleGeometry(CR, 64), new THREE.MeshStandardMaterial({ color: 0x0c1a16, roughness: 0.5, metalness: 0.7, emissive: 0x0a3a2a, emissiveIntensity: 0.6 })); plate2.rotation.x = -Math.PI / 2; plate2.position.y = CB + 0.02; g.add(plate2);
    [CB, CB + 1.6, 0, CT - 0.05].forEach(function (y, i) { ring(CR + 0.05, y, i === 1 ? 0.07 : 0.16, i === 1 ? M.teal : M.bronze); });
    // reactor: dark housing in the pit, glass plasma column from pit floor to the chamber base
    var pitM = M.steel.clone(); pitM.side = THREE.DoubleSide; pitM.color.set(0x2a2e32);
    cyl(GI - 0.05, GI - 0.05, PIT, LOW, pitM, true);                                                                       // pit wall
    var pf = new THREE.Mesh(new THREE.CircleGeometry(GI, 64), M.steel); pf.rotation.x = -Math.PI / 2; pf.position.y = PIT; g.add(pf);
    var RC = 1.35, cg = gm.clone(); cg.opacity = 0.2; cyl(RC, RC, PIT, CB, cg, true, 40);
    plasma = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'uniform float t; varying vec3 p; void main(){ float a = atan(p.z,p.x); float f = .5+.5*sin(p.y*3.2 - t*2.4 + sin(a*3.+t)*1.5); float g = .5+.5*sin(a*6.+p.y*1.7+t*1.3); float c = f*.6+g*.4; vec3 col = mix(vec3(.05,.45,.9), vec3(.55,1.,.95), c*c); gl_FragColor = vec4(col, .35+.5*c); }' });
    cyl(RC * 0.62, RC * 0.62, PIT, CB, plasma, true, 28);                                                                    // plasma spine
    var spine = cyl(0.3, 0.3, CB, CB + 3.1, new THREE.MeshBasicMaterial({ color: 0x9cffe0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), true, 16);   // reactor → brain stem
    [PIT + 0.5, -9.5, -7.8, -6.2, CB - 0.35].forEach(function (y) { ring(RC + 0.08, y, 0.12, M.bronze); });
    ring(RC + 0.1, PIT + 1.4, 0.05, M.teal);
    // conduits: 8 pipes up the outside of the chamber from the pit to the chamber top, bracketed by the three rings
    var pipe = new THREE.MeshStandardMaterial({ color: 0x3b4146, roughness: 0.4, metalness: 0.85 }), i;
    for (i = 0; i < 8; i++) {
      var an = i / 8 * Math.PI * 2 + 0.2, c = Math.cos(an), s2 = Math.sin(an);
      var curve = new THREE.CatmullRomCurve3([new THREE.Vector3(c * (RC + 0.2), PIT + 1.6, s2 * (RC + 0.2)), new THREE.Vector3(c * 3.2, -9.0, s2 * 3.2), new THREE.Vector3(c * (CR + 0.45), -6.0, s2 * (CR + 0.45)), new THREE.Vector3(c * (CR + 0.45), CB + 0.6, s2 * (CR + 0.45)), new THREE.Vector3(c * (CR + 0.45), CT - 0.3, s2 * (CR + 0.45))]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.13, 8, false), pipe));
    }
    // structural buttresses: 4 struts from the gallery rail line up to the chamber base ring
    for (i = 0; i < 4; i++) {
      var ab = i / 4 * Math.PI * 2 + Math.PI / 4, p0 = new THREE.Vector3(Math.cos(ab) * (GI + 0.1), LOW, Math.sin(ab) * (GI + 0.1)), p1 = new THREE.Vector3(Math.cos(ab) * (CR + 0.1), CB, Math.sin(ab) * (CR + 0.1));
      var mid = p0.clone().add(p1).multiplyScalar(0.5), len = p0.distanceTo(p1), st = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, len, 10), M.bronze);
      st.position.copy(mid); st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize()); g.add(st);
    }
    // engineering gallery: walkable ring + inner rail + underside of the mezzanine above
    var gal = new THREE.Mesh(new THREE.RingGeometry(GI, 9.6, MOB ? 72 : 128, 6), (function () { var m = M.floor.clone(); m.side = THREE.DoubleSide; return m; })());
    gal.rotation.x = -Math.PI / 2; gal.position.set(0, LOW + 0.01, CZ); gal.name = 'Floor_gallery'; root.add(gal); walk.push(gal);
    ring(GI + 0.08, LOW + 1.05, 0.04, M.bronze); ring(GI + 0.08, LOW + 0.55, 0.025, M.teal);
    for (i = 0; i < 36; i++) { var ap = i / 36 * Math.PI * 2, po = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.05, 6), M.steel); po.position.set(Math.cos(ap) * (GI + 0.08), LOW + 0.52, Math.sin(ap) * (GI + 0.08)); g.add(po); }
    var ce = new THREE.Mesh(new THREE.RingGeometry(CR + 0.35, 9.6, 96, 2), (function () { var m = M.steel.clone(); m.side = THREE.DoubleSide; m.color.set(0x30343a); return m; })()); ce.rotation.x = -Math.PI / 2; ce.position.set(0, -0.23, CZ); root.add(ce);
    // upper mezzanine = the Library ring: walkable annulus round the chamber (Library door is gone: the hall opens straight onto it), inner rail, ceiling + cove
    var mz = new THREE.Mesh(new THREE.RingGeometry(CR + 0.8, 10.45, MOB ? 72 : 128, 6), (function () { var m = M.floor.clone(); m.side = THREE.DoubleSide; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; return m; })());
    mz.rotation.x = -Math.PI / 2; mz.position.set(0, 0.02, CZ); mz.name = 'Floor_mezz'; root.add(mz); walk.push(mz);
    var MR = CR + 0.85; ring(MR, 1.05, 0.04, M.bronze); ring(MR, 0.55, 0.025, M.teal);
    for (i = 0; i < 36; i++) { var aq = i / 36 * Math.PI * 2, pq = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.05, 6), M.steel); pq.position.set(Math.cos(aq) * MR, 0.52, Math.sin(aq) * MR); g.add(pq); }
    var mc = M.steel.clone(); mc.side = THREE.DoubleSide; mc.color.set(0x30343a); mc.polygonOffset = true; mc.polygonOffsetFactor = 2; mc.polygonOffsetUnits = 2;
    var mcm = new THREE.Mesh(new THREE.CircleGeometry(10.2, MOB ? 72 : 128), mc); mcm.rotation.x = Math.PI / 2; mcm.position.set(0, 3.24, CZ); root.add(mcm);
    ring(8.6, 3.1, 0.07, new THREE.MeshBasicMaterial({ color: 0xd8f0ff, fog: false })); ring(CR + 0.5, 3.1, 0.06, M.teal);
    [[0, 8], [90, 8], [180, 8], [270, 8]].forEach(function (q) { var a = q[0] * Math.PI / 180, l = new THREE.PointLight(0xd8e8ff, 4.5, 14, 1.6); l.position.set(Math.cos(a) * q[1], 2.5, CZ + Math.sin(a) * q[1]); root.add(l); });
    // brain in the chamber (scaled to sit inside it), lights: green in the chamber, cool white on the gallery, blue on the reactor
    if (AFRAME.components['brain-mesh']) { var br = document.createElement('a-entity'); br.id = 'brain'; br.setAttribute('position', '0 -0.4 ' + CZ); br.setAttribute('scale', '0.55 0.55 0.55'); br.setAttribute('brain-mesh', { detail: MOB ? 'low' : 'high' }); sc.appendChild(br); }
    [[0, -0.4, 0, 0x2dff7a, 2.2, 9], [0, -3.4, 0, 0x2dffa0, 1.6, 8], [0, -8.2, 0, 0x3fb8ff, 5, 12], [0, LOW + 2.4, 7.2, 0xd8e8ff, 4, 12], [0, LOW + 2.4, -7.2, 0xd8e8ff, 4, 12], [7.2, LOW + 2.4, 0, 0xd8e8ff, 4, 12], [-7.2, LOW + 2.4, 0, 0xd8e8ff, 4, 12]].forEach(function (q) { var l = new THREE.PointLight(q[3], q[4], q[5], 1.6); l.position.set(q[0], q[1], CZ + q[2]); root.add(l); });
  }
  // movement limits the floor ray can't see: the shaft wall, the hall-mouth jambs and the lower partition (door open = passable)
  function wallBlocked(fy, x0, z0, x1, z1, lowDoor) {
    if (z1 > MOUTH - 0.1 && Math.hypot(x1, z1 - 36) > SH_R - 0.35) return true;
    if ((z0 < MOUTH) !== (z1 < MOUTH)) { var t = (MOUTH - z0) / (z1 - z0), xx = x0 + (x1 - x0) * t; if (Math.abs(xx) > 2.45) return true; }
    if (fy < -3 && (z0 < 24.9) !== (z1 < 24.9)) { var t2 = (24.9 - z0) / (z1 - z0), x2 = x0 + (x1 - x0) * t2; if (Math.abs(x2) > 0.95 || !lowDoor || lowDoor.p < 0.55) return true; }
    if (fy < -3 && Math.abs(x0) < 3.4 && Math.abs(x1) < 3.4 && (z0 < 48.0) !== (z1 < 48.0)) { var t3 = (48.0 - z0) / (z1 - z0), x3 = x0 + (x1 - x0) * t3; return true; }   // solid wall closing the stair-foot foyer (z 48.0); the way out is the arch into the core
    if (fy > -1.0) { var sgn = x0 >= 0 ? 1 : -1, a0 = Math.atan2(sgn * x0, z0 - 36), a1 = Math.atan2(sgn * x1, z1 - 36), r0 = Math.hypot(x0, z0 - 36), r1 = Math.hypot(x1, z1 - 36);
      var in0 = a0 > 1.5 && a0 < 2.18 && r0 > 10.2 && r0 < 12.4, in1 = a1 > 1.5 && a1 < 2.18 && r1 > 10.2 && r1 < 12.4;
      if (in0 && !in1 && (r1 >= 12.4 || a1 >= 2.18)) return true; if (!in0 && in1 && (r0 >= 12.4 || a0 >= 2.18)) return true; }   // stair-top vestibule: the Library door and the flight are the only ways in or out
    return false;
  }

  // An opaque, depth-tested viewport surface. No hyperspace particles or exterior
  // tunnel geometry exist anywhere else in the atrium scene. Bridge/room effects
  // remain untouched. Sync with the existing ship-wide wf-warp schedule.
  function buildSkylightView(root) {
    var uniforms = { clock: {value:0}, warp: {value:0} };
    var material = new THREE.ShaderMaterial({
      uniforms:uniforms, side:THREE.DoubleSide, depthTest:true, depthWrite:true,
      transparent:false, toneMapped:false, fog:false,
      vertexShader:'varying vec2 uv0; void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:[
        'uniform float clock; uniform float warp; varying vec2 uv0;',
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'void main(){',
        'vec2 s=uv0*vec2(80.,700.);vec2 id=floor(s);vec2 f=fract(s)-.5;',
        'float star=step(.983,h(id))*(1.-smoothstep(.025,.16,length(f)));',
        'vec3 quiet=vec3(.009,.014,.034)+star*vec3(.72,.83,1.);',
        'float lane=floor(uv0.x*100.);float n=h(vec2(lane,4.));',
        'float z=fract(uv0.y*(3.+n*8.)+clock*(1.3+n*2.5)+n*31.);',
        'float line=pow(max(0.,1.-abs(fract(uv0.x*100.)-.5)*2.),5.);',
        'float tail=pow(max(0.,1.-z),5.);',
        'vec3 fast=vec3(.012,.025,.065)+line*tail*vec3(.24,.52,1.)*(.4+n*1.2);',
        'gl_FragColor=vec4(mix(quiet,fast,warp),1.);}'
      ].join('\n')
    });
    // Existing ceiling cutout spans x ±2.05, z −17.55 to +18.05.
    var pane = new THREE.Mesh(new THREE.PlaneGeometry(4.1,35.6),material);
    pane.rotation.x = -Math.PI/2; pane.position.set(0,3.40,0.25);   /* Nov 27: was 3.29 = 1 cm over the kit's Skylight_glass (top 3.28) and inside its cross ribs (3.21–3.37): z-fight */
    pane.name='V04_Skylight_Only'; root.add(pane);
    var last=null, nextCheck=-1, target=0, current=0, soundCheck=-1;
    function scheduled(){
      var now=Date.now(),w=null;
      try{w=JSON.parse(localStorage.getItem('wf-warp')||'null');}catch(e){}
      if(!w){w={until:0,next:now+(4+Math.random()*8)*60000};try{localStorage.setItem('wf-warp',JSON.stringify(w));}catch(e){}}
      if(now>w.next){w={until:now+75000,next:now+(7+Math.random()*6)*60000,at:now};try{localStorage.setItem('wf-warp',JSON.stringify(w));}catch(e){}}
      return now<w.until?1:0;
    }
    current=target=scheduled(); uniforms.warp.value=current;
    return {update:function(t){
      var dt=last===null?0:Math.min(.1,Math.max(0,t-last));last=t;
      if(Math.floor(t)!==nextCheck){nextCheck=Math.floor(t);target=scheduled();}
      current+=Math.sign(target-current)*Math.min(Math.abs(target-current),dt/2.5);
      uniforms.clock.value=t;uniforms.warp.value=current;
      if(window.WF_SOUND&&Math.floor(t*4)!==soundCheck){soundCheck=Math.floor(t*4);WF_SOUND.warp(current);}
    }};
  }

  // ── lights ──
  function buildLights(root) {
    root.add(new THREE.HemisphereLight(0xffd8b0, 0x1a0e06, 0.35));
    var L = MOB ? [[0, 2.6, -12], [0, 2.6, 12], [0, -3.4, -10], [0, -3.4, 10]] : [[0, 2.6, -16], [0, 2.6, 0], [0, 2.6, 16], [0, -3.4, -14], [0, -3.4, 0], [0, -3.4, 14], [-10, 2.4, 32], [10, -3.4, 40]];
    L.forEach(function (p) { var l = new THREE.PointLight(0xffb060, (p[0] === 0 ? 6 : 1.2), 18, 1.8); l.position.set(p[0], p[1], p[2]); root.add(l); });
  }

  // ── doors (shared door.js) ──
  var promptEl, promptT; function say(msg, col) { promptEl = promptEl || document.getElementById('room-prompt'); promptEl.textContent = msg; promptEl.style.color = col || '#ffcc66'; promptEl.style.opacity = '1'; clearTimeout(promptT); promptT = setTimeout(function () { promptEl.style.opacity = '0'; }, 1800); }
  var doors = [], navigating = false;
  function buildDoors(sc, root) {
    var PT = window.WAYFARER.door.PORTALS, from = fromRoom();
    DOORS.forEach(function (d) {
      var P = PT[d.id];
      var D = window.WAYFARER.door.create({ sc: sc, parent: root, frame: { x: d.x, y: d.y, z: d.z, rot: d.rot }, name: d.name, tint: d.tint, depth: 0.1, noRecess: !!d.noRecess, shallow: !!d.shallow,
        other: P ? P.room : null, space: P ? P.space : null, img: d.wing ? 'images/portals/wing-' + d.wing + '.jpg' : (P && !d.locked ? 'images/portals/room-' + d.id + '.jpg' : null), locked: !!d.locked,
        page: d.wing ? 'library.html' : (P && !d.locked ? P.page : null), /* WF_INTERACTION_V11 */ autoPass: false, onPass: function () { go(d); }, startOpen: from === d.id, holdMs: from === d.id ? 900 : 8000, say: say });
      D.d = d; doors.push(D);
    });
    window.WAYFARER.corridorDoors = doors;
   /* crew.js waits on these when droids/cats pass a doorway */
  }
  function go(d) { if (navigating || d.locked) return; if (d.wing) { navigating = true; window.WAYFARER.door.leave('library.html?wing=' + d.wing, 'images/portals/wing-' + d.wing + '.jpg', d.wing === 'starboard' ? -100.8 : 100.8); return; } var P = window.WAYFARER.door.PORTALS[d.id]; if (!P) return; navigating = true; window.WAYFARER.door.leave(P.page, 'images/portals/room-' + d.id + '.jpg', d.inYaw || 0); }
  function fromRoom() {
    var explicit = new URLSearchParams(location.search).get('fromRoom');
    if (explicit && DOORS.some(function(d){return d.id === explicit;})) return explicit;
    try { var nav = performance.getEntriesByType('navigation')[0]; if (nav && nav.type !== 'navigate') return null; var ref = document.referrer || ''; if (ref.indexOf(location.host) < 0) return null;
      var m = ref.split('?')[0].split('#')[0].split('/').pop(), PT = window.WAYFARER.door.PORTALS; for (var k in PT) if (PT[k].page === m) return k; } catch (e) {}
    return null;
  }

  // ── walking on two decks: downward ray onto the walkable meshes ──
  var walk = [], ray = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0), O = new THREE.Vector3();
  function floorAt(x, z, cur) {
    O.set(x, cur + 1.0, z); ray.set(O, DOWN); ray.far = 1.8; var hits = ray.intersectObjects(walk, false), best = null;
    for (var i = 0; i < hits.length; i++) { var y = hits[i].point.y; if (y <= cur + 0.5 && y >= cur - 0.7) { if (best === null || y > best) best = y; } }
    return best;
  }

  AFRAME.registerComponent('wf-atrium', {
    init: function () {
      var self = this, sc = this.el.sceneEl; this.cam = document.getElementById('cam'); this.player = document.getElementById('player'); this.floorY = 0; this.last = null;
      var go2 = function () { self.build(sc); }; if (sc.hasLoaded) go2(); else sc.addEventListener('loaded', go2);
    },
    build: function (sc) {
      var self = this, root = new THREE.Group(); root.position.y = OFF; this.el.object3D.add(root);   // kit space (upper floor at kit y 0.65)
      var flat = new THREE.Group(); this.el.object3D.add(flat);                                          // game space (upper floor y 0)
      mats(envMap(sc.renderer)); buildLights(flat); buildStairLandings(flat); buildStairShaft(flat);   /* Nov 27: the core + mezzanine Library moved to core.html / library.html (loading weight) */
      var loader = new THREE.GLTFLoader(), parts = ['Split_Hall_Upper', 'Atrium_Lower', 'Aft_Transition_Upper', 'Aft_Transition_Lower', 'Twin_Curved_Stairs'], left = parts.length + 1, failed = [];
      parts.forEach(function (n) { loader.load(KIT + n + '.glb?v=1', function (g) { var railR = null; if (n === 'Twin_Curved_Stairs') { clearDoorRails(g.scene); railR = railRadii(g.scene); } var m = merge(g.scene, walk); if (n === 'Twin_Curved_Stairs') { stairLook(m); } root.add(m); if (railR) { try { buildStairTunnels(root, m, railR); } catch (e) { console.warn('stair tunnel', e); } } if (--left === 0) self.ready(failed); }, null, function (e) { console.error('atrium', n, e); failed.push(n); if (--left === 0) self.ready(failed); }); });
      fetch('reference/atrium-kit/layout.json').then(function(r){if(!r.ok)throw Error('layout '+r.status);return r.json();}).then(function(LY){buildWalls(flat,LY.corridor.outerPolygon);}).catch(function(e){console.error(e);failed.push('layout / walls');}).then(function(){if(--left===0)self.ready(failed);});
      buildDoors(sc, flat);
      // v0.4: exterior effects are confined to the real skylight.
      this.hyper = buildSkylightView(flat);
      this.spawn(); this.loadingPosition=this.cam.object3D.position.clone();
    },
    ready: function (failed) {
      this.el.object3D.updateMatrixWorld(true);
      var f=document.getElementById('wf-fade'); if(f)setTimeout(function(){f.style.opacity='0';},1700);   /* hold the cover until interior-v8's material passes finish (no copper flash) */
      if(failed && failed.length){this.loadFailed=true;window.WAYFARER.frozen=true; say('ATRIUM LOAD ERROR: '+failed.join(', '),'#ff8f70'); console.error('Atrium missing required assets',failed);return;}
      var p=this.cam.object3D.position; if(this.loadingPosition)p.copy(this.loadingPosition); var y=floorAt(p.x,p.z,this.floorY);
      if(y===null){ this.spawnFallback=true; p.x=0; p.z=-21; this.floorY=0; y=floorAt(p.x,p.z,0); }
      if(y===null){this.loadFailed=true;window.WAYFARER.frozen=true;say('ATRIUM: NO SAFE SPAWN','#ff8f70');return;}
      if (window.WF_FURN) [[4.55, 0, 2, -Math.PI / 2], [-4.55, 0, 3.5, Math.PI / 2], [4.55, -5.95, 2, -Math.PI / 2], [-4.55, -5.95, 3.5, Math.PI / 2]].forEach(function (q) { WF_FURN.place('wall_service_terminal', { position: [q[0], q[1], q[2]], yaw: q[3] }); });   /* Furniture 01: service terminals on both decks */
      this.floorY=y; this.player.object3D.position.y=y; this.last={x:p.x,z:p.z}; this.walkReady=true;
      try { var gg = JSON.parse(sessionStorage.getItem('wf-goto') || 'null'); if (gg && gg.page === 'corridor' && Date.now() - gg.t < 90000) { sessionStorage.removeItem('wf-goto'); if (this.gotoSpot(gg.x, gg.z, gg.y || 0)) y = this.floorY; } } catch (e) {}   /* arrived from a map tap */
      say(this.spawnFallback?'SAFE SPAWN · UPPER DECK':(y < -3 ? 'LOWER DECK':'UPPER DECK'));
    },
    gotoSpot: function (x, z, fy) { var fl = floorAt(x, z, fy); if (fl === null || !this.walkReady) return false; var p = this.cam.object3D.position; p.x = x; p.z = z; this.floorY = fl; this.last = { x: x, z: z }; this.player.object3D.position.y = fl; return true; },   /* map tap-to-travel (life.js) */
    spawn: function () {
      var from = fromRoom(), d = from && DOORS.filter(function (q) { return q.id === from; })[0], p = this.cam.object3D.position, yaw = Math.PI;   // default: facing aft (+Z) down the atrium
      if (d) { var a = d.rot * Math.PI / 180; p.x = d.x + Math.sin(a) * 1.3; p.z = d.z + Math.cos(a) * 1.3; this.floorY = d.y; yaw = Math.atan2(-Math.sin(a), -Math.cos(a)); }   // one step out, facing away from the door
      else { p.x = 0; p.z = -20; this.floorY = 0; }
      var st = (location.search.match(/[?&]stairs=(port|starboard)/) || [])[1];   // through a Library stairs door: top of that staircase
      if (st) { var side = st === 'port' ? -1 : 1, angle = -0.51; p.x = side * 11.35 * Math.cos(angle); p.z = 36 + 11.35 * Math.sin(angle); this.floorY = 0; yaw = Math.atan2(side * Math.sin(angle), -Math.cos(angle)); if (this.last) { this.last.x = p.x; this.last.z = p.z; } }
      this.player.object3D.position.y = this.floorY;
      var lc = this.cam.components['look-controls']; if (lc && lc.yawObject) lc.yawObject.rotation.y = yaw;
    },
    tick: function (t, dt) {
      var p = this.cam.object3D.position, s = Math.min(dt, 60) / 1000, wp = new THREE.Vector3();
      if (this.hyper) this.hyper.update(t / 1000); if (plasma) plasma.uniforms.t.value = t / 1000;
      if(!this.walkReady){if(this.loadingPosition)p.copy(this.loadingPosition);return;}
      if (this.walkReady && !window.WAYFARER.frozen) {
        if (!this.last) this.last = { x: p.x, z: p.z };
        var moved = Math.abs(p.x - this.last.x) + Math.abs(p.z - this.last.z) > 1e-5;
        if (moved) {
          // Sweep short segments to prevent skipping treads or jumping across holes at low FPS.
          var dx = p.x - this.last.x, dz = p.z - this.last.z;
          var n = Math.max(1, Math.ceil(Math.hypot(dx,dz) / 0.09));
          var sx = this.last.x, sz = this.last.z;
          for (var i=1;i<=n;i++) {
            var x=sx+dx*i/n, z=sz+dz*i/n, y=floorAt(x,z,this.floorY);
            var radius = this.floorY < -3 ? 9.4 : 10.2;
            var insideCore = Math.hypot(x,z-36) < radius && z > 25.5;
            if (this.floorY >= -3) { var u0 = Math.hypot(this.last.x, this.last.z - 36), u1 = Math.hypot(x, z - 36), th = Math.atan2(x, z - 36); insideCore = (u0 - 10.2) * (u1 - 10.2) < 0 && !((Math.abs(x) < 0.95 && z < 36) || Math.abs(Math.abs(th) - 2.02) < 0.1); }   // upper deck: the Library wall is crossed only at the hall gap and the two stair doorways
            if (this.floorY < -3) { var rr0 = Math.hypot(this.last.x, this.last.z - 36), rr1 = Math.hypot(x, z - 36); insideCore = (rr0 - 9.4) * (rr1 - 9.4) < 0 && !(Math.abs(x) < 0.95 && z < 36); }   // lower deck: the core is the open engineering gallery, entered only by the old Engine doorway
            if (y===null || insideCore || wallBlocked(this.floorY, this.last.x, this.last.z, x, z, doors.filter(function (q) { return q.d.id === 'lowerhall'; })[0])) break;
            this.floorY=y; this.last.x=x; this.last.z=z;
          }
          p.x=this.last.x; p.z=this.last.z;
        }
        var py = this.player.object3D.position; py.y += (this.floorY - py.y) * Math.min(1, s * 12);   // ease up/down the stairs
      }
      this.cam.object3D.getWorldPosition(wp);
      var fy = this.floorY;
      doors.forEach(function (D) {
        var d = D.d; if (Math.abs(fy - d.y) > 1.5) { D.update(dt, new THREE.Vector3(1e4, 0, 1e4)); return; }
        D.update(dt, wp);
        if (d.pass) { if (Math.hypot(p.x - d.x, p.z - d.z) < 3 && D.target === 0) D.open(true); return; }
        var a = d.rot * Math.PI / 180, dx = p.x - d.x, dz = p.z - d.z, lx = Math.cos(a) * dx - Math.sin(a) * dz, lz = Math.sin(a) * dx + Math.cos(a) * dz;
        if (D.p > 0.92 && Math.abs(lx) < 0.65 && lz < 0.55 && lz > -1.2) go(d);
      });
    }
  });
}());
