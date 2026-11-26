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
    { id: 'engine',   name: 'ENGINE ROOM',       x: 0,    z: 26.6, rot: 180,  y: LOW, tint: 0x3fe0c8},
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
    [0, LOW].forEach(function (y0) { var c = new THREE.Mesh(cyl, cm); c.position.set(0, y0 + H / 2, 36); if (y0 !== 0) { c.scale.set(9.4 / 10.2, HL / H, 9.4 / 10.2); c.position.y = y0 + HL / 2; } root.add(c); });
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
      var mat = M.floor.clone(); mat.side = THREE.DoubleSide;
      var mesh = new THREE.Mesh(geo, mat); mesh.name = 'V04_Upper_Stair_Landing_' + side;
      root.add(mesh); walk.push(mesh);
      // A solid-looking bronze edge and low-profile rails, kept outside walking width.
      [radius-width/2, radius+width/2].forEach(function (r) {
        var pts = []; for (var j=0;j<=12;j++) { var a=a0+(a1-a0)*j/12; pts.push(new THREE.Vector3(side*r*Math.cos(a),1.0,36+r*Math.sin(a))); }
        var curve = new THREE.CatmullRomCurve3(pts);
        root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,0.035,6,false),M.bronze));
        [a0+0.02,a1-0.02].forEach(function(a){var post=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,1,6),M.steel);post.position.set(side*r*Math.cos(a),0.5,36+r*Math.sin(a));root.add(post);});
      });
      // Light both approaches, not just the corridor center.
      [0, LOW].forEach(function (y) {
        var l = new THREE.PointLight(0xffc78a, 3.5, 12, 1.8);
        l.position.set(side * 11.35, y + 2.5, 36); root.add(l);
      });
    });
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
        'float z=fract(uv0.y*(3.+n*8.)-clock*(1.3+n*2.5)+n*31.);',
        'float line=pow(max(0.,1.-abs(fract(uv0.x*100.)-.5)*2.),5.);',
        'float tail=pow(max(0.,1.-z),5.);',
        'vec3 fast=vec3(.012,.025,.065)+line*tail*vec3(.24,.52,1.)*(.4+n*1.2);',
        'gl_FragColor=vec4(mix(quiet,fast,warp),1.);}'
      ].join('\n')
    });
    // Existing ceiling cutout spans x ±2.05, z −17.55 to +18.05.
    var pane = new THREE.Mesh(new THREE.PlaneGeometry(4.1,35.6),material);
    pane.rotation.x = -Math.PI/2; pane.position.set(0,3.29,0.25);
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
        page: P && !d.locked ? P.page : null, /* WF_INTERACTION_V11 */ autoPass: false, onPass: function () { go(d); }, startOpen: from === d.id, holdMs: from === d.id ? 900 : 8000, say: say });
      D.d = d; doors.push(D);
    });
    window.WAYFARER.corridorDoors = doors;
   /* crew.js waits on these when droids/cats pass a doorway */
  }
  function go(d) { if (navigating || d.locked) return; var P = window.WAYFARER.door.PORTALS[d.id]; if (!P) return; navigating = true; window.WAYFARER.door.leave(P.page, 'images/portals/room-' + d.id + '.jpg', 0); }
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
      mats(envMap(sc.renderer)); buildLights(flat); buildStairLandings(flat);
      var loader = new THREE.GLTFLoader(), parts = ['Split_Hall_Upper', 'Atrium_Lower', 'Aft_Transition_Upper', 'Aft_Transition_Lower', 'Twin_Curved_Stairs'], left = parts.length + 1, failed = [];
      parts.forEach(function (n) { loader.load(KIT + n + '.glb?v=1', function (g) { var m = merge(g.scene, walk); root.add(m); if (--left === 0) self.ready(failed); }, null, function (e) { console.error('atrium', n, e); failed.push(n); if (--left === 0) self.ready(failed); }); });
      fetch('reference/atrium-kit/layout.json').then(function(r){if(!r.ok)throw Error('layout '+r.status);return r.json();}).then(function(LY){buildWalls(flat,LY.corridor.outerPolygon);}).catch(function(e){console.error(e);failed.push('layout / walls');}).then(function(){if(--left===0)self.ready(failed);});
      buildDoors(sc, flat);
      // v0.4: exterior effects are confined to the real skylight.
      this.hyper = buildSkylightView(flat);
      this.spawn(); this.loadingPosition=this.cam.object3D.position.clone();
    },
    ready: function (failed) {
      this.el.object3D.updateMatrixWorld(true);
      var f=document.getElementById('wf-fade'); if(f)f.style.opacity='0';
      if(failed && failed.length){this.loadFailed=true;window.WAYFARER.frozen=true; say('ATRIUM LOAD ERROR: '+failed.join(', '),'#ff8f70'); console.error('Atrium missing required assets',failed);return;}
      var p=this.cam.object3D.position; if(this.loadingPosition)p.copy(this.loadingPosition); var y=floorAt(p.x,p.z,this.floorY);
      if(y===null){ this.spawnFallback=true; p.x=0; p.z=-21; this.floorY=0; y=floorAt(p.x,p.z,0); }
      if(y===null){this.loadFailed=true;window.WAYFARER.frozen=true;say('ATRIUM: NO SAFE SPAWN','#ff8f70');return;}
      if (window.WF_FURN) [[4.55, 0, 2, -Math.PI / 2], [-4.55, 0, 3.5, Math.PI / 2], [4.55, -5.95, 2, -Math.PI / 2], [-4.55, -5.95, 3.5, Math.PI / 2]].forEach(function (q) { WF_FURN.place('wall_service_terminal', { position: [q[0], q[1], q[2]], yaw: q[3] }); });   /* Furniture 01: service terminals on both decks */
      this.floorY=y; this.player.object3D.position.y=y; this.last={x:p.x,z:p.z}; this.walkReady=true;
      say(this.spawnFallback?'SAFE SPAWN · UPPER DECK':(y < -3 ? 'LOWER DECK':'UPPER DECK'));
    },
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
      if (this.hyper) this.hyper.update(t / 1000);
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
            if (y===null || insideCore) break;
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
        var a = d.rot * Math.PI / 180, dx = p.x - d.x, dz = p.z - d.z, lx = Math.cos(a) * dx - Math.sin(a) * dz, lz = Math.sin(a) * dx + Math.cos(a) * dz;
        if (D.p > 0.92 && Math.abs(lx) < 0.65 && lz < 0.55 && lz > -1.2) go(d);
      });
    }
  });
}());
