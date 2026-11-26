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
    firefly:  { glb: 'Firefly_Hangar', key: 'Firefly_Hangar', fy: -5.3, extra: [['Triangular_Jaw_Dock', 0, 0, 0, 'jaw'], ['Firefly_WF01_Mobile', 0, 0, 0, 'ship']], hello: 'Firefly Hangar — the Pathfinder cruiser WF-01. Tap her to board. Planet landings launch from here (coming soon).' },
    engine:   { glb: 'Engine_Room_Halcyon_Lower', circle: [0, 36, 9.0], core: 3.2, fy: -5.3, hello: 'Engine Room — the Halcyon power core, right under the Library.' }
  };
  var R = ROOMS[ID]; if (!R) return;
  var SHELL = /^(Trim|Wall|Rib|Light_strip|Ceiling|Door_header|Circular_bulkhead|Circular_walkway|Core_rim|Power_conduit|Dock_guide)|_floor$/;
  function toast(t) { var e = document.getElementById('room-prompt'); if (!e) return; e.textContent = t; e.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.opacity = 0; }, 4200); }

  function reskin(root, M) { root.traverse(function (o) { if (o.isMesh) o.material = M[(o.material && o.material.name) || 'steel'] || M.steel; }); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function L() { return window.WF_LIFE; }

  // ───────── ROOM JOBS (user, Nov 26: "Finish"): tap a piece of furniture (≤ 3.5 m) — a glowing ring on the deck marks each one ─────────
  var css = document.createElement('style');
  css.textContent = '#kr-panel{position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:60;display:none;width:min(94vw,460px);max-height:58vh;overflow:auto;padding:16px;border-radius:22px;box-sizing:border-box;' +
    'background:linear-gradient(150deg,rgba(255,255,255,.14),rgba(255,255,255,.03)),rgba(26,16,10,.72);-webkit-backdrop-filter:blur(22px) saturate(180%);backdrop-filter:blur(22px) saturate(180%);border:1px solid rgba(255,200,140,.3);color:#fff;font:500 14px -apple-system,system-ui,sans-serif}' +
    '#kr-panel h3{margin:0 0 8px;font:800 12px -apple-system,system-ui,sans-serif;letter-spacing:3px;color:#ffc98a;text-align:center}#kr-panel p{margin:6px 0;color:#f0e0cc;line-height:1.45}' +
    '#kr-panel button{display:block;width:100%;margin:8px 0 0;padding:11px;border-radius:13px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.09);color:#fff;font:600 14px -apple-system,system-ui,sans-serif;text-align:left}' +
    '#kr-panel textarea{width:100%;min-height:140px;box-sizing:border-box;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.3);color:#fff;font:15px Georgia,serif;padding:10px}' +
    '#kr-panel .row{display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.08)}#kr-panel .row b{font-size:22px}#kr-fadeb{position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:59;transition:opacity 1.2s}';
  document.head.appendChild(css);
  var JOBS = { models: {}, meshes: [], spots: [], panel: null };
  function panel(title, html, buttons) {
    var el = JOBS.panel || (JOBS.panel = document.createElement('div')); el.id = 'kr-panel'; if (!el.parentNode) { document.body.appendChild(el); ['pointerdown', 'touchstart', 'mousedown', 'click', 'wheel', 'keydown'].forEach(function (n) { el.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); }); }
    el.innerHTML = '<h3>' + title + '</h3>' + (html || ''); (buttons || []).concat([['Close', function () {}]]).forEach(function (b) { var x = document.createElement('button'); x.innerHTML = b[0]; x.onclick = function () { if (b[1]() !== false) closeP(); }; el.appendChild(x); });
    el.style.display = 'block'; window.WAYFARER.frozen = true;
  }
  function closeP() { if (JOBS.panel) JOBS.panel.style.display = 'none'; window.WAYFARER.frozen = false; }
  function blackout(ms, mid) { var f = document.getElementById('kr-fadeb'); if (!f) { f = document.createElement('div'); f.id = 'kr-fadeb'; document.body.appendChild(f); } f.style.opacity = 1; setTimeout(function () { if (mid) mid(); f.style.opacity = 0; }, ms); }
  function speak(t, v) { if (window.WF_SOUND && WF_SOUND.speak) WF_SOUND.speak(t, v || 'intercom'); }
  function findMesh(re) { for (var i = 0; i < JOBS.meshes.length; i++) if (re.test(JOBS.meshes[i].name)) return JOBS.meshes[i]; return null; }

  var DISHES = [['🍜', 'Nebula noodles', 'Spicy, glowing faintly. Forge disapproves.'], ['🥟', 'Cryovale dumplings', 'Ice-cold filling, somehow perfect.'], ['🍰', 'Amber resin cake', 'A K’Vetar recipe. Sticky. Wonderful.'], ['☕', 'Bridge coffee', 'Strong enough to fly the ship yourself.']];
  var ACTIONS = {
    quarters: [
      [/^Bed_base/, '🛏 Bunk', function () { panel('YOUR BUNK', '<p>Get some sleep, Captain?</p>', [['😴 Sleep', function () { closeP(); blackout(2200, function () { L() && L().toast('Rested. Morning, Captain.'); speak('Good morning, Captain. All decks report nominal.', 'ai'); L() && L().event('sleep'); }); }]]); }],
      [/^Locker/, '🏆 Trophy locker', function () { var v = (L() && L().inv()) || {}, I = (L() && L().ITEMS) || {}, list = ['idol', 'chart', 'geode', 'tooth', 'model'].filter(function (k) { return v[k]; });
        panel('TROPHY LOCKER', list.length ? list.map(function (k) { return '<div class="row"><b>' + I[k].icon + '</b><span>' + I[k].name + (v[k] > 1 ? ' ×' + v[k] : '') + '</span></div>'; }).join('') : '<p>Empty. Curios from <b>Odds & Ends</b> at the Hiveport end up here.</p>'); }],
      [/^Console_body|^ControlScreen|^Table_top/, '📓 Captain’s log', function () { var t = load('wf-captains-log', '');
        panel("CAPTAIN'S LOG", '<p>Private notes — kept on this device.</p><textarea id="kr-log">' + String(t).replace(/</g, '&lt;') + '</textarea>', [['💾 Save entry', function () { save('wf-captains-log', document.getElementById('kr-log').value); L() && L().toast('Log saved'); L() && L().event('log'); }]]); }]
    ],
    medbay: [
      [/^Bed_base|^Mattress/, '🩺 Recovery bed', function () { panel('MEDBAY', '<p>Lie down for a check-up? (After planet landings, this is where you’ll wake up if you pass out.)</p>', [['🩺 Check-up', function () { closeP(); blackout(1800, function () { speak('Vesper to the Captain. Vitals nominal. Hydrate. Fewer bar fights.'); L() && L().event('medbay'); }); }]]); }],
      [/^Console_body|^ControlScreen/, '📋 Medical record', function () { var days = load('wf-days', []).length || 1;
        panel('MEDICAL RECORD', '<p>Patient: the Captain · Rank: ' + (window.WF_MISSIONS && WF_MISSIONS.rank ? WF_MISSIONS.rank() : 'on file') + '</p><p>Bar fights won: ' + load('wf-brawlwins', 0) + ' · Drinks at the Resin Spire: plenty.</p><p>Status: <b style="color:#7fffb0">fit for duty</b>.</p>'); }]
    ],
    xeno: [
      [/^Specimen|^Console_body|^ControlScreen/, '🧪 Specimens', function () { var D = load('wf-discoveries', []);
        panel('XENOBIOLOGY', D.length ? D.slice(-12).reverse().map(function (d) { return '<div class="row"><b>' + (d.kind === 'anomaly' ? '🌀' : '🪐') + '</b><span><b style="font-size:14px">' + (d.name || d.id || 'Sample') + '</b><br><small style="color:#d8c0a0">' + (d.note || (d.facts && d.facts[0]) || '') + '</small></span></div>'; }).join('') : '<p>No samples yet. In Flight Mode, fly close to a planet or anomaly and press <b>SCAN</b> — results are catalogued here.</p>'); L() && L().event('xeno'); }]
    ],
    mess: [
      [/^Replicator|^Galley_counter/, '🍽 Replicator', function () {
        panel('GALLEY REPLICATOR', '<p>What’ll it be?</p>', DISHES.map(function (d) { return [d[0] + ' ' + d[1], function () { L() && L().toast(d[0] + ' ' + d[1] + ' — ' + d[2]); L() && L().event('cook'); if (window.WF_SOUND) WF_SOUND.droid('affirm', 0, 0.4); }]; }).concat([['🐟 Cat treats ×3 (20 cr)', function () { if (L() && L().spend(20, 'Replicated cat treats')) { L().give('treat', 3); L().event('cook'); } }]])); }],
      [/^Table_top/, '🪑 Table', function () { L() && L().toast('You sit for a minute. The hum of the ship is oddly calming.'); }]
    ],
    maint: [
      [/^Console_body|^ControlScreen/, '🔧 Ship systems', function () { var F = load('wf-faults', []);
        panel('MAINTENANCE', F.length ? '<p>Open faults — tap the hatch where Forge marked it:</p>' + F.map(function (f) { return '<div class="row"><b>⚠</b><span>' + f.kind + ' in the ' + f.room + '</span></div>'; }).join('') : '<p>All systems green. Forge is reorganising the spanners. Again.</p>'); L() && L().event('maint'); }],
      [/^Locker/, '🧰 Spare parts', function () { L() && L().toast('Spare couplings, relays and one very old sandwich.'); }]
    ],
    engine: [
      [/^Console_body|^ControlScreen|^Reactor/, '⚛ Halcyon core', function () { var w = load('wf-warp', null), now = Date.now(), nxt = w ? Math.max(0, Math.round((w.next - now) / 1000)) : null;
        panel('HALCYON POWER CORE', '<p>Output <b>' + (92 + Math.round(Math.random() * 7)) + '%</b> · induction rings stable · next light-speed jump ' + (nxt == null ? 'unscheduled' : 'in ' + Math.floor(nxt / 60) + ' min ' + (nxt % 60) + ' s') + '.</p>',
          [['🚀 Spin up a light-speed jump now', function () { save('wf-warp', { until: 0, next: Date.now() + 25000 }); speak('Engineering to all decks. Spooling the drive. Light speed in twenty five seconds.'); L() && L().event('reactor'); }]]); }]
    ],
    firefly: [
      [/^Console_body|^ControlScreen|^Firefly|Hull|Cockpit|Wing|Engine/, '🚀 Firefly WF-01', function () {
        if (JOBS.aboard) return cabinMenu();
        panel('FIREFLY WF-01 · PATHFINDER', '<p>The ship’s mission cruiser: one cabin, two seats, lockers and a quarantine alcove.</p>', [['🚪 Board her', function () { closeP(); board(true); }], ['🚀 Launch now', function () { closeP(); board(true); setTimeout(function () { launch(); }, 600); }]]); }]
    ]
  };
  // BOARDING (Firefly v1.0 kit: the cabin is inside the model; hiding Exterior_Shell + gear shows it — kit integration.mjs showCabin)
  function wpos(o) { o.updateMatrixWorld(true); return o.getWorldPosition(new THREE.Vector3()); }
  function placeEye(at, yaw) { var cam = document.getElementById('cam'), rig = document.getElementById('player'); cam.object3D.position.set(at.x, 1.6, at.z); rig.object3D.position.y = at.y - 1.6;
    var lc = cam.components['look-controls']; if (lc && yaw != null) { lc.yawObject.rotation.y = yaw; lc.pitchObject.rotation.x = -0.05; } }
  function shell(show) { var S = JOBS.models.ship && JOBS.models.ship.scene; if (!S) return; S.traverse(function (o) { if (/^Exterior_Shell|^Gear_/.test(o.name) && o.parent && !/^Exterior_Shell|^Gear_/.test(o.parent.name)) o.visible = show; }); }
  function board(on) {
    var S = JOBS.models.ship && JOBS.models.ship.scene; if (!S) return; JOBS.aboard = on; window.WAYFARER.frozen = on;
    if (on) { shell(false); var sp = S.getObjectByName('Cabin_Spawn') || S.getObjectByName('Pilot_Anchor') || S, p = wpos(sp); placeEye(new THREE.Vector3(p.x, p.y + (sp === S ? 1.2 : 1.55), p.z), 0);
      L() && L().toast('Aboard the Firefly — look around. Tap the cabin for the pilot’s seat or to step out.'); if (window.WF_SOUND) WF_SOUND.droid('servo', 0, 0.4); JOBS.menuT = setTimeout(cabinMenu, 1400); }
    else { shell(true); document.getElementById('player').object3D.position.y = 0; placeEye(new THREE.Vector3(5.5, 1.6, -33), Math.atan2(5.5, 5)); }
  }
  function cabinMenu() { panel('FIREFLY CABIN', '<p>Pilot and co-pilot seats up front, lockers and the quarantine alcove aft.</p>', [['🧑‍✈️ Take the pilot’s seat & launch', function () { closeP(); launch(); }], ['🚪 Step out', function () { closeP(); board(false); }]]); }

  // the hangar launch: the lower bow jaw swings open (kit Jaw_Open), the Firefly rides the dock down and away, then Flight Mode
  function launch() {
    clearTimeout(JOBS.menuT); closeP(); var J = JOBS.models.jaw, S = JOBS.models.ship; if (!J || !S) { location.href = 'minigame.html?ship=firefly'; return; }
    window.WAYFARER.frozen = true; if (window.WF_SOUND) WF_SOUND.alarm && WF_SOUND.alarm(); speak('Hangar control. Bow doors opening. Good hunting, Captain.');
    var mix = new THREE.AnimationMixer(J.scene), clip = THREE.AnimationClip.findByName(J.animations, 'Jaw_Open'); if (clip) { var a = mix.clipAction(clip); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.play(); }
    var gear = S.animations && THREE.AnimationClip.findByName(S.animations, 'Landing_Gear_Retract'), smix = new THREE.AnimationMixer(S.scene); if (gear) { var g = smix.clipAction(gear); g.setLoop(THREE.LoopOnce); g.clampWhenFinished = true; g.play(); }
    JOBS.launchT = 0; JOBS.mix = mix; JOBS.smix = smix; L() && L().event('launch');
    var S = JOBS.models.ship.scene, pilot = S.getObjectByName('Pilot_Anchor') || S.getObjectByName('Pilot_Seat_Anchor');
    if (JOBS.aboard && pilot) { JOBS.ride = pilot; var lc0 = document.getElementById('cam').components['look-controls']; if (lc0) { lc0.yawObject.rotation.y = 0; lc0.pitchObject.rotation.x = -0.1; } }   /* ride out in the pilot's seat */
    else { var cam = document.getElementById('cam'); cam.object3D.position.set(9, 1.6, -27); var lc = cam.components['look-controls']; if (lc) { lc.yawObject.rotation.y = Math.atan2(9, 11); lc.pitchObject.rotation.x = -0.32; } }   /* watch from the hangar's starboard side */
  }
  JOBS.setup = function (sc) {
    this.sc = sc;
    if (ID === 'firefly') {   // open space below/ahead of the bow jaw
      var n = 1500, pos = new Float32Array(n * 3); for (var i = 0; i < n; i++) { var u = Math.random() * 2 - 1, th = Math.random() * 6.283, q = Math.sqrt(1 - u * u); pos.set([q * Math.cos(th) * 400, u * 400, q * Math.sin(th) * 400], i * 3); }
      var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sc.object3D.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.4, sizeAttenuation: false, fog: false })));
    } var ringG = new THREE.RingGeometry(0.42, 0.5, 40), self = this;
    if (ID === 'firefly' && this.models.ship) { var anc = this.models.jaw && this.models.jaw.scene.getObjectByName('Firefly_Docking_Anchor'); if (anc) anc.add(this.models.ship.scene); this.models.ship.scene.traverse(function (o) { if (o.isMesh) self.meshes.push(o); }); }
    if (ID === 'firefly' && this.models.ship) { var sp0 = this.models.ship.scene, bb0 = new THREE.Box3().setFromObject(sp0), c0 = bb0.getCenter(new THREE.Vector3()), r0 = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.75, 60), new THREE.MeshBasicMaterial({ color: 0x6fd0ff, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
      r0.rotation.x = -Math.PI / 2; sc.object3D.add(r0); r0.position.set(c0.x, 0.03, c0.z + 2); this.spots.push({ A: ACTIONS.firefly[0], m: sp0, c: c0, ring: r0 }); }
    (ACTIONS[ID] || []).forEach(function (A) {
      var m = findMesh(A[0]); if (!m) return; var bb = new THREE.Box3().setFromObject(m), c = bb.getCenter(new THREE.Vector3());
      var ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2;
      sc.object3D.add(ring); ring.position.set(c.x, 0.02, c.z); self.spots.push({ A: A, m: m, c: c, ring: ring });
    });
    var down = null;
    addEventListener('pointerdown', function (e) { down = [e.clientX, e.clientY]; });
    addEventListener('pointerup', function (e) {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 12 || (JOBS.panel && JOBS.panel.style.display === 'block') || (e.target.closest && e.target.closest('#wf-btns,#wf-set,.wf-ctl,#wf-joy,#wf-stick'))) return;
      var cam = sc.camera, r = sc.renderer.domElement.getBoundingClientRect(), lock = !!document.pointerLockElement, nd = new THREE.Vector2(lock ? 0 : (e.clientX - r.left) / r.width * 2 - 1, lock ? 0 : -((e.clientY - r.top) / r.height) * 2 + 1);
      var rc = new THREE.Raycaster(); rc.setFromCamera(nd, cam); var hits = rc.intersectObjects(self.spots.map(function (s) { return s.m; }), true);
      if (!hits.length || hits[0].distance > 4.5) return;
      for (var i = 0; i < self.spots.length; i++) { var sp = self.spots[i], hit = false; hits[0].object.traverseAncestors(function (a) { if (a === sp.m) hit = true; }); if (hits[0].object === sp.m || hit) { sp.A[2](); return; } }
    });
  };
  JOBS.tick = function (t, dt) {
    var k = 0.5 + 0.5 * Math.sin(t / 400); this.spots.forEach(function (s) { s.ring.material.opacity = 0.3 + 0.35 * k; });
    if (this.launchT != null) { var s = Math.min(dt, 50) / 1000; this.launchT += s; this.mix.update(s); this.smix.update(s);
      var sh = this.models.ship.scene; if (this.launchT > 3.2) { var u = this.launchT - 3.2; sh.position.z -= u * u * 1.8 * s * 10; sh.position.y -= u * 0.4 * s * 10; }
      if (this.launchT > 6.2 && !this.gone) { this.gone = true; blackout(900, function () {}); setTimeout(function () { location.href = 'minigame.html?ship=firefly'; }, 800); }
      if (this.ride) { var rp = wpos(this.ride); placeEye(new THREE.Vector3(rp.x, rp.y + 0.15, rp.z), null); } }
  };

  window.WF_ROOMJOBS = { jobs: JOBS, actions: ACTIONS, launch: launch, panel: panel };
  AFRAME.registerComponent('wf-kitroom', {
    init: function () { var self = this, sc = this.el.sceneEl; if (sc.hasLoaded) this.build(sc); else sc.addEventListener('loaded', function () { self.build(sc); }); },
    build: function (sc) {
      var K = window.WF_KIT, M = K.mats(K.envMap(sc.renderer)); M.floor.roughness = 0.42; M.floor.envMapIntensity = 0.7; var root = new THREE.Group(), self = this; root.position.y = -R.fy; this.el.object3D.add(root);
      var walk = [], loader = new THREE.GLTFLoader(), list = [[R.glb, 0, 0, 0]].concat(R.extra || []), left = list.length;
      list.forEach(function (q) {
        loader.load('models/atrium/' + q[0] + '.glb?v=1', function (g) {
          if (q[4]) { JOBS.models[q[4]] = g; root.add(g.scene); if (q[4] !== 'ship') reskin(g.scene, M);   /* the Firefly keeps its own PBR copper */ if (--left === 0) self.ready(); return; }   // animated pieces stay whole
          var m = K.merge(g.scene, walk, function (o) { return !SHELL.test(o.name) && !SHELL.test((o.parent && o.parent.name) || ''); });
          m.position.set(q[1], q[2], q[3]); root.add(m); JOBS.meshes = JOBS.meshes.concat(m.children); if (--left === 0) self.ready();
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
    ready: function () { var f = document.getElementById('wf-fade'); if (f) f.style.opacity = '0'; toast(R.hello); JOBS.setup(this.el.sceneEl); if (window.WF_LIFE) WF_LIFE.event('room:' + ID); },
    spawn: function () {
      if (ID === 'firefly' && /[?&]from=fly/.test(location.search)) { var cam0 = document.getElementById('cam'); cam0.object3D.position.set(5.5, 1.6, -33); var l0 = cam0.components['look-controls']; if (l0 && l0.yawObject) l0.yawObject.rotation.y = Math.atan2(5.5, 5); setTimeout(function () { toast('The Firefly is back in her cradle. Welcome home, Captain.'); }, 1200); return; }
      var P = window.WAYFARER.door.PORTALS[ID].room, a = P.rot * Math.PI / 180, cam = document.getElementById('cam'), p = cam.object3D.position;
      p.x = P.x + Math.sin(a) * 1.4; p.z = P.z + Math.cos(a) * 1.4;
      var lc = cam.components['look-controls']; if (lc && lc.yawObject) lc.yawObject.rotation.y = a + Math.PI;   // facing into the room
    },
    tick: function (t, dt) {   // Engine Room: keep clear of the reactor core
      JOBS.tick(t, dt); if (!R.core) return; var p = document.getElementById('cam').object3D.position, dx = p.x - R.circle[0], dz = p.z - R.circle[1], d = Math.hypot(dx, dz);
      if (d < R.core && d > 1e-3) { p.x = R.circle[0] + dx / d * R.core; p.z = R.circle[1] + dz / d * R.core; }
    }
  });
}());
