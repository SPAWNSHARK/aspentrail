// SS Wayfarer — the ATRIUM KIT ROOMS (Nov 26 rebuild): Captain's Quarters (upper) and the lower deck — Medbay, Xenobiology, Mess Hall,
// Maintenance, Firefly Hangar, Engine Room. One loader for all of them: <body data-room="medbay"> + <a-entity wf-kitroom>.
// Each page loads that room's kit GLB (models/atrium/) in the kit's SHIP coordinates with its floor moved to y 0, re-skinned in the
// house style by material name (WF_KIT from atrium.js). Shell pieces (walls, trim, ribs, light strips, floor, ceiling) are merged per
// material; furniture stays as separate meshes so mobile.js's obstacle scan makes it solid. You're kept inside the room's kit outline
// (layout.json polygon → WAYFARER.bounds) or, in the round Engine Room, inside its circle and out of the reactor.
// Exit = the shared door.js room door at the kit's Door_Anchor (PORTALS[id].room) back to the atrium.
(function () {
  var THREE = AFRAME.THREE, ID = document.body.getAttribute('data-room');
  var ROOMS = {
    quarters: { glb: 'Captains_Quarters', key: 'Captains_Quarters', fy: 0.65, hello: "Captain's Quarters — your bunk, lockers and desk." },
    medbay:   { glb: 'Medbay', key: 'Medbay', fy: -5.3, hello: 'Medbay — recovery beds. You’ll wake up here if you ever pass out planetside.' },
    xeno:     { glb: 'Xenobiology', key: 'Xenobiology', fy: -5.3, hello: 'Xenobiology — specimen tanks for whatever you bring back from the surface.' },
    mess:     { glb: 'Mess_Hall', key: 'Mess_Hall', fy: -5.3, hello: 'Mess Hall & Galley.' },
    maint:    { glb: 'Maintenance_Storage', key: 'Maintenance_Storage', fy: -5.3, hello: 'Maintenance & Storage.' },
    firefly:  { glb: 'Firefly_Hangar', key: 'Firefly_Hangar', fy: -5.3, extra: [['Firefly_Pathfinder_WF01', 0, -5.3, -38]], hello: 'Firefly Hangar — the Pathfinder cruiser WF-01. Planet landings launch from here (coming soon).' },
    engine:   { glb: 'Engine_Room_Halcyon_Lower', circle: [0, 36, 9.0], core: 3.2, fy: -5.3, hello: 'Engine Room — the Halcyon power core, right under the Library.' }
  };
  var R = ROOMS[ID]; if (!R) return;
  var SHELL = /^(Trim|Wall|Rib|Light_strip|Ceiling|Door_header|Circular_bulkhead|Circular_walkway|Core_rim|Power_conduit|Dock_guide)|_floor$/;
  function toast(t) { var e = document.getElementById('room-prompt'); if (!e) return; e.textContent = t; e.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.opacity = 0; }, 4200); }

  AFRAME.registerComponent('wf-kitroom', {
    init: function () { var self = this, sc = this.el.sceneEl; if (sc.hasLoaded) this.build(sc); else sc.addEventListener('loaded', function () { self.build(sc); }); },
    build: function (sc) {
      var K = window.WF_KIT, M = K.mats(K.envMap(sc.renderer)); M.floor.roughness = 0.42; M.floor.envMapIntensity = 0.7; var root = new THREE.Group(), self = this; root.position.y = -R.fy; this.el.object3D.add(root);
      var walk = [], loader = new THREE.GLTFLoader(), list = [[R.glb, 0, 0, 0]].concat(R.extra || []), left = list.length;
      list.forEach(function (q) {
        loader.load('models/atrium/' + q[0] + '.glb?v=1', function (g) {
          var m = K.merge(g.scene, walk, function (o) { return !SHELL.test(o.name) && !SHELL.test((o.parent && o.parent.name) || ''); });
          m.position.set(q[1], q[2], q[3]); root.add(m); if (--left === 0) self.ready();
        }, null, function (e) { console.error('kitroom', q[0], e); if (--left === 0) self.ready(); });
      });
      // lights: warm amber pools over the room
      var flat = new THREE.Group(); this.el.object3D.add(flat); flat.add(new THREE.HemisphereLight(0xffd8b0, 0x1a0e06, 0.5));
      fetch('reference/atrium-kit/layout.json').then(function (r) { return r.json(); }).then(function (LY) {
        var poly = R.circle ? null : (LY.rooms[R.key] && LY.rooms[R.key].polygon), cx = 0, cz = 0;
        if (poly) { poly.forEach(function (p) { cx += p[0]; cz += p[1]; }); cx /= poly.length; cz /= poly.length; window.WAYFARER.bounds = poly.map(function (p) { return [p[0], p[1]]; }); }
        else { cx = R.circle[0]; cz = R.circle[1]; var c = []; for (var i = 0; i < 48; i++) { var a = i / 48 * Math.PI * 2; c.push([cx + Math.sin(a) * R.circle[2], cz + Math.cos(a) * R.circle[2]]); } window.WAYFARER.bounds = c; }
        [[0, 0], [3, 2], [-3, -2]].forEach(function (o, i) { var l = new THREE.PointLight(i ? 0xffb060 : 0xffc890, i ? 3 : 5, 14, 1.8); l.position.set(cx + o[0], 2.7, cz + o[1]); flat.add(l); });
        if (ID === 'engine') { var core = new THREE.PointLight(0x3fe0c8, 10, 16, 1.6); core.position.set(0, 1.6, 36); flat.add(core); }
      }).catch(function (e) { console.error(e); });
      window.WAYFARER.door.roomExit(ID);
      this.spawn();
    },
    ready: function () { var f = document.getElementById('wf-fade'); if (f) f.style.opacity = '0'; toast(R.hello); },
    spawn: function () {
      var P = window.WAYFARER.door.PORTALS[ID].room, a = P.rot * Math.PI / 180, cam = document.getElementById('cam'), p = cam.object3D.position;
      p.x = P.x + Math.sin(a) * 1.4; p.z = P.z + Math.cos(a) * 1.4;
      var lc = cam.components['look-controls']; if (lc && lc.yawObject) lc.yawObject.rotation.y = a + Math.PI;   // facing into the room
    },
    tick: function () {   // Engine Room: keep clear of the reactor core
      if (!R.core) return; var p = document.getElementById('cam').object3D.position, dx = p.x - R.circle[0], dz = p.z - R.circle[1], d = Math.hypot(dx, dz);
      if (d < R.core && d > 1e-3) { p.x = R.circle[0] + dx / d * R.core; p.z = R.circle[1] + dz / d * R.core; }
    }
  });
}());
