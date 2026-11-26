// SS Wayfarer — PACK ROOMS (user, Nov 26): the LOWER-deck MEDBAY (SS_Wayfarer_Medbay_V1, rooms/medbay/) and the UPPER-deck CAPTAIN'S
// QUARTERS (SS_Wayfarer_Captains_Quarters_V1, rooms/quarters/) replace the kit blockouts of those two rooms. Both are mounted at the room
// origin in their own local metres (entrance = +Z) and use the SHARED ship door (door.js roomExit at the pack's entrance; the packs' own
// door leaves are removed so there is one door system), mobile.js bounds + furniture collision, interior-v8.js styling.
//   Medbay: the pack's MedbayState — tap the biobed / scanner (bioscan), recovery pod or its button (12 s recovery cycle), xeno vet bed,
//           lab bench, console / wall monitor (status), cabinet / dispenser / medkit (supplies → a medkit in your cargo), privacy screen,
//           the med droid (it talks and walks to each procedure on its own waypoints). Events show as toasts and are spoken by the droid.
//   Quarters: the pack's own runtime + panels — bed (sleep), sofa / desk chair (sit), TV + remote, Captain's journal, galaxy table (opens
//           the ship's deck map), refreshment station + mug, wardrobe outfits, Orbit Match arcade, discoveries case, cat tree / bed,
//           lighting modes; saves to 'wayfarer.captain.v1'. Stars show through its open ceiling aperture.
(function () {
  var THREE = AFRAME.THREE, ID = document.body.getAttribute('data-room');
  function toast(t) { var e = document.getElementById('room-prompt'); if (!e) return; e.textContent = t; e.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.opacity = 0; }, 4200); }
  function rect(x0, z0, x1, z1) { return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }
  function stars(sc, n) { var pos = new Float32Array(n * 3); for (var i = 0; i < n; i++) { var u = Math.random() * 0.9 + 0.1, t = Math.random() * 6.283, q = Math.sqrt(1 - u * u); pos.set([q * Math.cos(t) * 300, u * 300, q * Math.sin(t) * 300], i * 3); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); var p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.5, sizeAttenuation: false, fog: false })); p.userData.v8Skip = true; sc.object3D.add(p); }
  function lights(sc, list) { sc.object3D.add(new THREE.HemisphereLight(0xe8eef5, 0x14171b, 0.45)); list.forEach(function (q) { var l = new THREE.PointLight(0xf0f3f7, q[3] || 3, 12, 1.8); l.position.set(q[0], q[1], q[2]); sc.object3D.add(l); }); }
  function spawn(z) { var cam = document.getElementById('cam'), p = cam.object3D.position; p.x = 0; p.z = z; var lc = cam.components['look-controls']; if (lc && lc.yawObject) lc.yawObject.rotation.y = 0; }

  function medbay(sc) {
    window.WAYFARER.bounds = rect(-3.75, -3.25, 3.75, 3.35);
    lights(sc, [[0, 2.6, 0, 3.2], [-2.4, 2.5, -1, 2], [2.4, 2.5, -1, 2]]);
    import('./rooms/medbay/src/install-medbay.mjs?v=1').then(function (M) {
      return M.installMedbay({ THREE: THREE, GLTFLoader: THREE.GLTFLoader, scene: sc.object3D, baseURL: 'rooms/medbay/', audio: true,
        onEvent: function (e) {
          var say = { job_start: { scan: 'Bioscan starting — hold still, Captain.', recover: 'Recovery cycle engaged. Twelve seconds.', xeno_scan: 'Xenofauna scan started.', analyze: 'Analysing the specimen.' }[e.kind],
            job_end: e.result + (e.kind === 'recover' ? ' Vitals ' + e.health + '%.' : ''), dialogue: e.text, status: 'Vitals ' + e.health + '% · supplies ' + e.supplies + (e.job ? ' · in progress: ' + e.job : ''),
            item: 'Medkit dispensed (' + e.remaining + ' left) — added to your cargo.', empty: 'Supplies exhausted.', busy: 'A procedure is already running.', privacy: e.active ? 'Privacy screen up.' : 'Privacy screen down.', canopy: e.open ? 'Pod canopy open.' : 'Pod canopy closed.' }[e.type];
          if (e.type === 'job_start' && typeof say === 'undefined') say = 'Procedure started.';
          if (say) { toast(say); if (window.WF_SOUND && WF_SOUND.speak && /job_|dialogue/.test(e.type)) WF_SOUND.speak(say, 'robot'); }
          if (e.type === 'job_end' && window.WF_LIFE) WF_LIFE.event('medbay');
          if (e.type === 'item' && window.WF_LIFE) { WF_LIFE.ITEMS.medkit = WF_LIFE.ITEMS.medkit || { name: 'Medkit', icon: '🩹', note: 'From the Medbay dispenser. Planet landings will use these.' }; WF_LIFE.give('medkit', 1); }
        } });
    }).then(function (R) {
      ['left_door', 'right_door', 'door_button'].forEach(function (k) { var o = R.objects.get(k); if (o) o.removeFromParent(); });   /* one door system: door.js */
      R.root.updateMatrixWorld(true); window.WF_MEDBAY = R; var f = document.getElementById('wf-fade'); if (f) f.style.opacity = 0;
      toast('Medbay — tap the biobed, recovery pod, scanner, console, cabinet or the med droid.');
      var down = null, cv = sc.renderer.domElement;
      cv.addEventListener('pointerdown', function (e) { down = [e.clientX, e.clientY]; });
      cv.addEventListener('pointerup', function (e) {
        if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 10) return; down = null;
        var r = cv.getBoundingClientRect(), lock = !!document.pointerLockElement, rc = new THREE.Raycaster();
        rc.setFromCamera({ x: lock ? 0 : (e.clientX - r.left) / r.width * 2 - 1, y: lock ? 0 : -((e.clientY - r.top) / r.height) * 2 + 1 }, sc.camera); rc.far = 4.5;
        var id = R.pick(rc); if (id) R.interact(id);
      });
      AFRAME.registerComponent('wf-medbay-tick', { tick: function (t, dt) { R.update(Math.min(dt, 100) / 1000); } }); sc.setAttribute('wf-medbay-tick', '');
    }).catch(function (e) { console.error('medbay', e); toast('MEDBAY LOAD ERROR'); });
    window.WAYFARER.door.roomExit('medbay'); spawn(2.3);
  }

  function quarters(sc) {
    window.WAYFARER.bounds = rect(-4.75, -3.75, 4.75, 3.85);
    lights(sc, [[0, 2.7, 0, 2.6], [-3, 2.5, 1.2, 1.6], [3, 2.5, -2, 1.6]]); stars(sc, 1400);
    Promise.all([import('./rooms/quarters/runtime/captains-quarters.mjs?v=1')]).then(function (L) {
      var loader = new THREE.GLTFLoader();
      return L[0].installCaptainsQuarters({ THREE: THREE, loader: loader, scene: sc.object3D, camera: sc.camera, renderer: sc.renderer,
        baseURL: new URL('rooms/quarters/', location.href),
        hooks: {
          registerColliders: function (boxes) { window.WAYFARER.extraSolids = (boxes || []).filter(function (b) { return !/^(west|east|north|south)/.test(b.id || ''); }).map(function (b) { var bb = b.box || b; if (bb.min) return [bb.min.x, bb.min.z, bb.max.x, bb.max.z]; var c = b.center, z = b.size; return [c[0] - z[0] / 2, c[2] - z[2] / 2, c[0] + z[0] / 2, c[2] + z[2] / 2]; }); },
          onPanel: function (open) { window.WAYFARER.frozen = !!open; },
          exit: function () { window.WAYFARER.door.leave('index.html?fromRoom=quarters', 'images/portals/corr-quarters.jpg', -90); },
          openGalaxyMap: function () { if (window.WF_LIFE) WF_LIFE.open('map'); },
          playerPose: function (pose) { if (pose === 'sleep') { var f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;transition:opacity 1s;z-index:90;pointer-events:none'; document.body.appendChild(f); requestAnimationFrame(function () { f.style.opacity = 1; }); setTimeout(function () { f.style.opacity = 0; setTimeout(function () { f.remove(); }, 1100); if (window.WF_LIFE) WF_LIFE.event('sleep'); }, 1800); } },
          setTVChannel: function (i, label) { toast('Now showing: ' + label); },
          inviteCat: function () { toast('You call the cats — they’re in the Crew Lounge for now.'); },
          petCat: function () { toast('Purr.'); },
          setOutfit: function (o) { toast('Outfit: ' + o); },
          notify: function (m) { toast(m); }
        } });
    }).then(function (Q) {
      window.WF_QUARTERS = Q; var room = sc.object3D.getObjectByName('SS_Wayfarer_Captains_Quarters'), ent = room && room.getObjectByName('entry'); if (ent) ent.removeFromParent();   /* one door system: door.js */
      var f = document.getElementById('wf-fade'); if (f) f.style.opacity = 0; toast('Captain’s Quarters — tap the bed, sofa, TV, desk, galaxy table, wardrobe, arcade, refreshments or the display case.');
      AFRAME.registerComponent('wf-quarters-tick', { tick: function (t, dt) { if (Q.update) Q.update(Math.min(dt, 100) / 1000); } }); sc.setAttribute('wf-quarters-tick', '');
      if (window.WF_LIFE) WF_LIFE.event('room:quarters');
    }).catch(function (e) { console.error('quarters', e); toast('QUARTERS LOAD ERROR'); });
    window.WAYFARER.door.roomExit('quarters'); spawn(3.0);
  }

  AFRAME.registerComponent('wf-roompack', { init: function () { var sc = this.el.sceneEl, go = function () { (ID === 'medbay' ? medbay : quarters)(sc); }; if (sc.hasLoaded) go(); else sc.addEventListener('loaded', go); } });
}());
