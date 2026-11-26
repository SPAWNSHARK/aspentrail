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
    { id: 'library',  name: 'THE LIBRARY',       x: 0,    z: 25.8, rot: 180,  y: 0,   tint: 0x3fe0c8 },
    { id: 'holodeck', name: 'HOLODECK',          x: -4.6, z: -14,  rot: 90,   y: 0,   tint: 0x8a5cff },
    { id: 'quarters', name: "CAPTAIN'S QUARTERS", x: -4.6, z: 9,   rot: 90,   y: 0,   tint: 0xc08a50 },
    { id: 'lounge',   name: 'CREW LOUNGE',       x: 4.6,  z: -14,  rot: -90,  y: 0,   tint: 0xffa060 },
    { id: 'media',    name: 'MEDIA NEXUS',       x: 4.6,  z: 9,    rot: -90,  y: 0,   tint: 0x4f8cff },
    { id: 'firefly',  name: 'FIREFLY HANGAR',    x: 0,    z: -24,  rot: 0,    y: LOW, tint: 0x6fd0ff},
    { id: 'engine',   name: 'ENGINE ROOM',       x: 0,    z: 25.8, rot: 180,  y: LOW, tint: 0x3fe0c8},
    { id: 'medbay',   name: 'MEDBAY',            x: -4.6, z: -14,  rot: 90,   y: LOW, tint: 0x7fffd0},
    { id: 'xeno',     name: 'XENOBIOLOGY',       x: -4.6, z: 9,    rot: 90,   y: LOW, tint: 0x9aff6a},
    { id: 'mess',     name: 'MESS HALL',         x: 4.6,  z: -14,  rot: -90,  y: LOW, tint: 0xffc070},
    { id: 'maint',    name: 'MAINTENANCE',       x: 4.6,  z: 9,    rot: -90,  y: LOW, tint: 0xd0a080}
  ];
  window.WAYFARER = window.WAYFARER || {}; window.WAYFARER.atriumDoors = DOORS;
  window.WF_KIT = { M: M, mats: function (env) { mats(env); return M; }, envMap: function (r) { return envMap(r); }, merge: function (root, walk, keep) { return merge(root, walk, keep); } };   /* kitroom.js */

  // ── house-style materials, by the kit's material names ──
  var M = {};
  function mats(env) {
    function std(o) { var m = new THREE.MeshStandardMaterial(o); if (env && o.metalness > 0.2) { m.envMap = env; m.envMapIntensity = o.env || 0.8; } return m; }
    M.copper = std({ color: 0xb8703c, metalness: 0.85, roughness: 0.36 });
    M.bronze = std({ color: 0xc89050, metalness: 0.9, roughness: 0.28, env: 1 });
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
    var L = window.TEX && window.TEX.library({ lite: MOB }), t = new THREE.TextureLoader().load(L.wall.albedo); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
    var gl = new THREE.TextureLoader().load(L.wall.glow); gl.colorSpace = THREE.SRGBColorSpace; gl.wrapS = THREE.RepeatWrapping; return { map: t, glow: gl };
  }
  function buildWalls(root, outline) {
    var T = wallTex(), H = 3.2, HL = -0.23 - LOW,   /* the lower hall is open up to the underside of the upper floor */ mat = new THREE.MeshStandardMaterial({ map: T.map, emissiveMap: T.glow, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.6, metalness: 0.1, color: 0x9a8070 });
    [0, LOW].forEach(function (y0) {
      var pos = [], uv = [], idx = [], run = 0;
      for (var i = 0; i < outline.length; i++) {
        var a = outline[i], b = outline[(i + 1) % outline.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-3) continue;
        if (Math.abs(a[1] - b[1]) < 1e-3 && Math.abs(a[1] - 25.8) < 0.01) { run += L; continue; }   // the aft end stays open onto the Library apron
        var steps = Math.max(1, Math.ceil(L / 0.5));
        for (var s = 0; s < steps; s++) {
          var k0 = s / steps, k1 = (s + 1) / steps, x0 = a[0] + (b[0] - a[0]) * k0, z0 = a[1] + (b[1] - a[1]) * k0, x1 = a[0] + (b[0] - a[0]) * k1, z1 = a[1] + (b[1] - a[1]) * k1;
          var mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
          if (DOORS.some(function (d) { return d.y === y0 && Math.hypot(mx - d.x, mz - d.z) < 1.15; })) {      // doorway: only the lintel above it
            var vv = pos.length / 3, top = y0 + (y0 === 0 ? H : HL), uu0 = run / 3, uu1 = (run + L / steps) / 3; run += L / steps;
            pos.push(x0, y0 + 2.95, z0, x1, y0 + 2.95, z1, x1, top, z1, x0, top, z0); uv.push(uu0, 0.9, uu1, 0.9, uu1, 1, uu0, 1); idx.push(vv, vv + 1, vv + 2, vv, vv + 2, vv + 3); continue; }
          var v = pos.length / 3, u0 = run / 3, u1 = (run + L / steps) / 3; run += L / steps;
          var hh = y0 === 0 ? H : HL; pos.push(x0, y0, z0, x1, y0, z1, x1, y0 + hh, z1, x0, y0 + hh, z0); uv.push(u0, 0, u1, 0, u1, 1, u0, 1); idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
        }
      }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      var w = new THREE.Mesh(g, mat); mat.side = THREE.DoubleSide; root.add(w);
    });
    // the Library (upper) / Engine room (lower) round outer wall at the aft core, gap in front for its door
    var cyl = new THREE.CylinderGeometry(10.2, 10.2, H, 96, 6, true, Math.PI + 0.11, Math.PI * 2 - 0.22);   // θ measured from +z: front (toward the hall) = π
    var cm = mat.clone(); cm.map = T.map.clone(); cm.map.repeat.set(20, 1); cm.map.needsUpdate = true; cm.emissiveMap = T.glow.clone(); cm.emissiveMap.repeat.set(20, 1); cm.emissiveMap.needsUpdate = true;
    [0, LOW].forEach(function (y0) { var c = new THREE.Mesh(cyl, cm); c.position.set(0, y0 + H / 2, 36); if (y0 !== 0) { c.scale.y = HL / H; c.position.y = y0 + HL / 2; } root.add(c); });
    // upper hall ceiling (the kit's roof only covers the middle): the hall outline with the skylight cut out
    var sh = new THREE.Shape(outline.map(function (q) { return new THREE.Vector2(q[0], -q[1]); })), hole = new THREE.Path();
    hole.moveTo(-2.05, 17.55); hole.lineTo(2.05, 17.55); hole.lineTo(2.05, -18.05); hole.lineTo(-2.05, -18.05); hole.lineTo(-2.05, 17.55); sh.holes.push(hole);
    var hc = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.steel); hc.rotation.x = -Math.PI / 2; hc.position.y = 3.24; root.add(hc);
    // ceiling over the upper aft apron (the kit leaves it open), with an amber ring round the Library wall
    var cg = new THREE.RingGeometry(10.2, 21.5, 96, 4), ceil = new THREE.Mesh(cg, M.steel); M.steel.side = THREE.DoubleSide; ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.22, 36); root.add(ceil);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(10.35, 0.04, 6, 128), M.amber); ring.rotation.x = Math.PI / 2; ring.position.set(0, 3.12, 36); root.add(ring);
    // amber cove strips along the top of the hall walls (both decks) and a bronze sill line
    [0, LOW].forEach(function (y0) { [-1, 1].forEach(function (s) {
      var strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 34), M.amber); strip.position.set(s * 4.52, y0 + (y0 === 0 ? 3.05 : HL - 0.15), 0.75); root.add(strip);
      var sill = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 34), M.bronze); sill.position.set(s * 4.54, y0 + 0.9, 0.75); root.add(sill); }); });
  }

  // ── lights ──
  function buildLights(root) {
    root.add(new THREE.HemisphereLight(0xffd8b0, 0x1a0e06, 0.35));
    var L = MOB ? [[0, 2.6, -12], [0, 2.6, 12], [0, -3.4, -10], [0, -3.4, 10]] : [[0, 2.6, -16], [0, 2.6, 0], [0, 2.6, 16], [0, -3.4, -14], [0, -3.4, 0], [0, -3.4, 14], [-10, 2.4, 32], [10, -3.4, 40]];
    L.forEach(function (p) { var l = new THREE.PointLight(0xffb060, 6, 18, 1.8); l.position.set(p[0], p[1], p[2]); root.add(l); });
  }

  // ── doors (shared door.js) ──
  var promptEl, promptT; function say(msg, col) { promptEl = promptEl || document.getElementById('room-prompt'); promptEl.textContent = msg; promptEl.style.color = col || '#ffcc66'; promptEl.style.opacity = '1'; clearTimeout(promptT); promptT = setTimeout(function () { promptEl.style.opacity = '0'; }, 1800); }
  var doors = [], navigating = false;
  function buildDoors(sc, root) {
    var PT = window.WAYFARER.door.PORTALS, from = fromRoom();
    DOORS.forEach(function (d) {
      var P = PT[d.id];
      var D = window.WAYFARER.door.create({ sc: sc, parent: root, frame: { x: d.x, y: d.y, z: d.z, rot: d.rot }, name: d.name, tint: d.tint, depth: 0.1,
        other: P ? P.room : null, space: P ? P.space : null, img: P && !d.locked ? 'images/portals/room-' + d.id + '.jpg' : null, locked: !!d.locked,
        autoPass: false, onPass: function () { go(d); }, startOpen: from === d.id, holdMs: from === d.id ? 900 : 8000, say: say });
      D.d = d; doors.push(D);
    });
    window.WAYFARER.corridorDoors = doors;   /* crew.js waits on these when droids/cats pass a doorway */
  }
  function go(d) { if (navigating || d.locked) return; var P = window.WAYFARER.door.PORTALS[d.id]; if (!P) return; navigating = true; window.WAYFARER.door.leave(P.page, 'images/portals/room-' + d.id + '.jpg', 0); }
  function fromRoom() {
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
      mats(envMap(sc.renderer)); buildLights(flat);
      var loader = new THREE.GLTFLoader(), parts = ['Split_Hall_Upper', 'Atrium_Lower', 'Aft_Transition_Upper', 'Aft_Transition_Lower', 'Twin_Curved_Stairs'], left = parts.length;
      parts.forEach(function (n) { loader.load(KIT + n + '.glb?v=1', function (g) { var m = merge(g.scene, walk); root.add(m); if (--left === 0) self.ready(); }, null, function (e) { console.error('atrium', n, e); if (--left === 0) self.ready(); }); });
      fetch('reference/atrium-kit/layout.json').then(function (r) { return r.json(); }).then(function (LY) { buildWalls(flat, LY.corridor.outerPolygon); }).catch(function (e) { console.error(e); });
      buildDoors(sc, flat);
      // light speed overhead through the skylight (bow = −Z: streaks rush toward +Z)
      if (window.WAYFARER.hyperspace) this.hyper = window.WAYFARER.hyperspace(flat, { fwd: -1, arc: [-70, 70], count: MOB ? 900 : 1500, minR: 16, maxR: 190, tunnel: 0.6, width: 0.55, bright: 0.9,
        spill: [{ p: [0, 3.0, -10], i: 1.4, d: 11 }, { p: [0, 3.0, 8], i: 1.4, d: 11 }] });
      this.spawn();
    },
    ready: function () { walk.forEach(function (m) { m.updateMatrixWorld(true); }); this.walkReady = true; var f = document.getElementById('wf-fade'); if (f) f.style.opacity = '0'; },
    spawn: function () {
      var from = fromRoom(), d = from && DOORS.filter(function (q) { return q.id === from; })[0], p = this.cam.object3D.position, yaw = Math.PI;   // default: facing aft (+Z) down the atrium
      if (d) { var a = d.rot * Math.PI / 180; p.x = d.x + Math.sin(a) * 1.3; p.z = d.z + Math.cos(a) * 1.3; this.floorY = d.y; yaw = Math.atan2(-Math.sin(a), -Math.cos(a)); }   // one step out, facing away from the door
      else { p.x = 0; p.z = -20; this.floorY = 0; }
      this.player.object3D.position.y = this.floorY;
      var lc = this.cam.components['look-controls']; if (lc && lc.yawObject) lc.yawObject.rotation.y = yaw;
    },
    tick: function (t, dt) {
      var p = this.cam.object3D.position, s = Math.min(dt, 60) / 1000, wp = new THREE.Vector3();
      if (this.hyper) this.hyper.update(t / 1000);
      if (this.walkReady && !window.WAYFARER.frozen) {
        if (!this.last) this.last = { x: p.x, z: p.z };
        var moved = Math.abs(p.x - this.last.x) + Math.abs(p.z - this.last.z) > 1e-5;
        if (moved) {
          var y = floorAt(p.x, p.z, this.floorY), lib = Math.hypot(p.x, p.z - 36) < 10.5 && p.z > 25.5;
          if (y === null || lib) { p.x = this.last.x; p.z = this.last.z; }
          else { this.floorY = y; this.last.x = p.x; this.last.z = p.z; }
        }
        var py = this.player.object3D.position; py.y += (this.floorY - py.y) * Math.min(1, s * 12);   // ease up/down the stairs
      }
      this.cam.object3D.getWorldPosition(wp);
      var fy = this.floorY;
      doors.forEach(function (D) {
        var d = D.d; if (Math.abs(fy - d.y) > 1.5) { D.update(dt, new THREE.Vector3(1e4, 0, 1e4)); return; }
        D.update(dt, wp);
        var a = d.rot * Math.PI / 180, dx = p.x - d.x, dz = p.z - d.z, lx = Math.cos(a) * dx - Math.sin(a) * dz, lz = Math.sin(a) * dx + Math.cos(a) * dz;
        if (D.p > 0.92 && Math.abs(lx) < 0.65 && lz < 0.55 && lz > -1.2) go(d);
      });
    }
  });
}());
