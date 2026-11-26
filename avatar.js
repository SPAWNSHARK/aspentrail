// SS Wayfarer — the player's avatar + 1st / 3rd person toggle (user, Nov 25). Load after aframe.min.js and mobile.js.
// An original captain figure (navy uniform, copper trim, boots) built from rounded parts with real joints (hips, knees,
// shoulders, elbows), driven by a procedural walk cycle: stride and arm swing scale with your actual speed, the body bobs and
// leans into the walk, and it breathes when idle. It stands where the camera entity is and turns toward where you're walking.
// 3rd person pulls the view back over your shoulder (shortened so it never leaves the room); 1st person hides the body.
// Toggle: the person button (bottom centre, next to Gyro/Level) or key V. Remembered in localStorage 'wf-view'.
// window.WAYFARER.avatar.hide(true|false) — pages hide it during scripted camera moves (the Bridge chair jump).
(function () {
  var THREE = AFRAME.THREE;
  window.WAYFARER = window.WAYFARER || {};
  function cyl(rt, rb, h, m) { var g = new THREE.CylinderGeometry(rt, rb, h, 14, 1); g.translate(0, -h / 2, 0); return new THREE.Mesh(g, m); }   // hangs down from its joint
  function sph(r, m) { return new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); }

  function buildBody() {
    var M = {
      coat: new THREE.MeshStandardMaterial({ color: 0x1c2436, roughness: 0.6, metalness: 0.15 }),
      trim: new THREE.MeshStandardMaterial({ color: 0xd08a52, roughness: 0.3, metalness: 0.9 }),
      pants: new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.7 }),
      boot: new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 0.35, metalness: 0.3 }),
      skin: new THREE.MeshStandardMaterial({ color: 0xc89a7a, roughness: 0.6 }),
      hair: new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 0.8 })
    };
    var root = new THREE.Group(), hips = new THREE.Group(); hips.position.y = 0.95; root.add(hips);
    var pelvis = sph(0.17, M.pants); pelvis.scale.set(1.15, 0.7, 0.85); hips.add(pelvis);
    var spine = new THREE.Group(); hips.add(spine);
    var torso = cyl(0.19, 0.17, 0.5, M.coat); torso.geometry.translate(0, 0.5, 0); torso.scale.set(1.1, 1, 0.72); spine.add(torso);
    var chest = sph(0.2, M.coat); chest.position.y = 0.48; chest.scale.set(1.15, 0.75, 0.75); spine.add(chest);
    var belt = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.022, 6, 24), M.trim); belt.rotation.x = Math.PI / 2; belt.position.y = 0.05; belt.scale.set(1.08, 0.74, 1); spine.add(belt);
    var collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 6, 18), M.trim); collar.rotation.x = Math.PI / 2; collar.position.y = 0.62; spine.add(collar);
    var badge = new THREE.Mesh(new THREE.CircleGeometry(0.03, 12), M.trim); badge.position.set(-0.09, 0.45, -0.152); badge.rotation.y = Math.PI; spine.add(badge);
    var neck = cyl(0.05, 0.055, 0.1, M.skin); neck.geometry.translate(0, 0.1, 0); neck.position.y = 0.6; spine.add(neck);
    var head = new THREE.Group(); head.position.y = 0.78; spine.add(head);
    var skull = sph(0.11, M.skin); skull.scale.set(0.92, 1.1, 1); head.add(skull);
    var hair = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair); hair.position.set(0, 0.015, 0.01); hair.scale.set(0.95, 1.05, 1.05); head.add(hair);
    var nose = sph(0.018, M.skin); nose.position.set(0, -0.01, -0.105); head.add(nose);
    function arm(sd) {
      var sh = new THREE.Group(); sh.position.set(sd * 0.24, 0.55, 0); spine.add(sh);
      var pad = sph(0.065, M.trim); pad.scale.set(1.2, 0.6, 1); pad.position.y = 0.02; sh.add(pad);
      sh.add(cyl(0.055, 0.048, 0.3, M.coat));
      var el = new THREE.Group(); el.position.y = -0.3; sh.add(el); el.add(cyl(0.046, 0.04, 0.27, M.coat));
      var cuff = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.012, 6, 14), M.trim); cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.25; el.add(cuff);
      var hand = sph(0.045, M.skin); hand.position.y = -0.31; hand.scale.set(0.8, 1.1, 0.6); el.add(hand);
      return { sh: sh, el: el };
    }
    function leg(sd) {
      var hp = new THREE.Group(); hp.position.set(sd * 0.1, 0, 0); hips.add(hp);
      hp.add(cyl(0.075, 0.06, 0.44, M.pants));
      var kn = new THREE.Group(); kn.position.y = -0.44; hp.add(kn); kn.add(cyl(0.058, 0.05, 0.42, M.pants));
      var ft = new THREE.Group(); ft.position.y = -0.44; kn.add(ft);
      var boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.24), M.boot); boot.position.set(0, -0.02, -0.04); ft.add(boot);
      var shaft = cyl(0.055, 0.055, 0.14, M.boot); shaft.position.y = 0.12; ft.add(shaft);
      return { hp: hp, kn: kn, ft: ft };
    }
    var J = { root: root, hips: hips, spine: spine, head: head, aL: arm(-1), aR: arm(1), lL: leg(-1), lR: leg(1) };
    root.traverse(function (o) { if (o.isMesh) o.castShadow = false; });
    return J;
  }

  AFRAME.registerComponent('wf-avatar', {
    init: function () {
      var self = this, sc = this.el;
      this.J = buildBody(); this.J.root.userData.noCollide = true; this.J.root.userData.wfPortal = true;   // not solid, not in portal photos
      sc.object3D.add(this.J.root);
      // the user's EXPLORER suit (models/player/explorer.glb, skinned, Idle + Walk_InPlace) replaces the procedural figure once
      // it loads; walk/idle blend by real speed. Model forward = +Z, ours = −Z → turned 180°. Falls back to the procedural body.
      var self2 = this, holder = document.createElement('a-entity'); holder.setAttribute('gltf-model', 'models/player/explorer_mk2.glb?v=2');
      holder.addEventListener('model-error', function () { if (!holder._wfFallback) { holder._wfFallback = true; holder.setAttribute('gltf-model', 'models/player/explorer_command.glb?v=1'); } });   // + Sit_Down, Stand_Up, Seated_Idle (navigation kit)
      holder.addEventListener('model-loaded', function () {
        var m = holder.getObject3D('mesh'); if (!m) return; var clips = m.animations || [];
        // Warm ship lighting can leave metallic armor black: reuse the room reflection map if available.
        var env = sc.object3D.environment || (window.WF_KIT && WF_KIT.M && WF_KIT.M.copper && WF_KIT.M.copper.envMap);
        if (env) m.traverse(function (o) { if (!o.isMesh) return; [].concat(o.material || []).forEach(function (mat) { if (mat.isMeshStandardMaterial && mat.metalness > .35 && !mat.envMap) { mat.envMap = env; mat.envMapIntensity = .85; mat.needsUpdate = true; } }); });
        var box = new THREE.Group(); box.rotation.y = Math.PI; box.add(m); m.traverse(function (o) { if (o.isMesh) o.frustumCulled = false; });
        self2.J.hips.visible = false; self2.J.root.add(box);
        var mx = new THREE.AnimationMixer(m), idle = THREE.AnimationClip.findByName(clips, 'Idle'), walk = THREE.AnimationClip.findByName(clips, 'Walk_InPlace');
        self2.kit = { mx: mx, idle: idle && mx.clipAction(idle), walk: walk && mx.clipAction(walk), clips: clips, acts: {} };
        [self2.kit.idle, self2.kit.walk].forEach(function (a) { if (a) { a.play(); a.setEffectiveWeight(0); } });
      });
      sc.appendChild(holder);
      this.phase = 0; this.speed = 0; this.yaw = 0; this.stepClock = 0; this._camProbeAt = -1; this._camScanAt = -1; this.last = null; this.hidden = false; this.dist = 0;
      var v = 'first'; try { v = localStorage.getItem('wf-view') || 'first'; } catch (e) {} this.view = v;
      // the toggle: in the touch button row if there is one, else its own small glass button
      var b = document.createElement('b'); b.id = 'wf-view'; b.setAttribute('aria-label', 'Camera view');
      b.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3"/><path d="M3 9l2-2M21 9l-2-2" /></svg>';
      function place() {
        var row = document.getElementById('wf-btns');
        if (row) { row.appendChild(b); b.classList.add('wf-ctl'); }
        else { b.style.cssText = 'position:fixed;z-index:15;right:76px;bottom:16px;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;' +
          'background:linear-gradient(140deg,rgba(255,255,255,.16),rgba(255,255,255,.03) 48%,rgba(255,255,255,.07)),rgba(22,22,28,.38);-webkit-backdrop-filter:blur(22px) saturate(185%);backdrop-filter:blur(22px) saturate(185%);border:1px solid rgba(255,255,255,.24)';
          b.querySelector('svg').style.cssText = 'width:24px;height:24px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round'; document.body.appendChild(b); }
      }
      setTimeout(place, 400);
      ['pointerdown', 'touchstart'].forEach(function (n) { b.addEventListener(n, function (e) { e.stopPropagation(); if (n === 'touchstart') e.preventDefault(); }, { passive: false }); });
      b.addEventListener('pointerup', function (e) { e.stopPropagation(); self.toggle(); });
      addEventListener('keydown', function (e) { if (e.code === 'KeyV') self.toggle(); });
      this.btn = b; this.apply();
      window.WAYFARER.avatar = { hide: function (h) { self.hidden = h; self.apply(); }, view: function () { return self.view; }, toggle: function () { self.toggle(); },
        // SCRIPTED POSE (Bridge command chair): s = { x, y, z (feet), yaw (0 = facing −Z), clip: 'Walk_InPlace'|'Sit_Down'|
        // 'Stand_Up'|'Seated_Idle'|'Idle', time (seconds into the clip), show (force the body visible), cam: 'free'|'owned' }.
        // 'owned' = the caller writes the camera entity's world pose itself (cinematics): no 3rd-person lens offset.
        // 'free' = the caller places the camera entity (e.g. at the eye anchor) and the normal 1st/3rd view rules apply.
        script: function (st) { self.scripted = st || null; },
        ready: function () { return !!self.kit; } };
    },
    toggle: function () { this.view = this.view === 'third' ? 'first' : 'third'; try { localStorage.setItem('wf-view', this.view); } catch (e) {} this.apply(); },
    apply: function () { if (this.btn) this.btn.classList.toggle('sel', this.view === 'third'); },
    cameraEl: function () { return this.el.camera && this.el.camera.el; },
    // WAYFARER_PLAYER_MK2: follow the actual room geometry, not the legacy corridor rectangle.
    cameraClearance: function (t, origin, quaternion, up, back) {
      if (!this._camRay) { this._camRay = new THREE.Raycaster(); this._camDir = new THREE.Vector3(); this._camMeshes = []; }
      if (t >= this._camScanAt) {
        this._camScanAt = t + 1500; var list = [], own = this.J.root, camera = this.cameraEl().object3D;
        this.el.object3D.traverse(function (o) {
          if (!o.isMesh || !o.geometry || o.isInstancedMesh || o.isSkinnedMesh || !o.visible) return;
          for (var q = o; q; q = q.parent) { if (q === own || q === camera || !q.visible || (q.userData && (q.userData.noCollide || q.userData.wfPortal))) return; }
          var materials = [].concat(o.material || []);
          if (!materials.length || materials.every(function (m) { return !m.visible || (m.transparent && m.opacity < .3); })) return;
          list.push(o);
        }); this._camMeshes = list;
      }
      var dir = this._camDir.set(0, up, back).applyQuaternion(quaternion), len = dir.length(); if (len < .01) return 0;
      dir.multiplyScalar(1 / len);
      // 15 Hz probe; keep the last result only while the view is nearly unchanged.
      if (t >= this._camProbeAt || !this._camOrigin || this._camOrigin.distanceToSquared(origin) > .0225 || this._camPrevDir.dot(dir) < .985 || Math.abs(this._camLen - len) > .15) {
        this._camProbeAt = t + 66; this._camOrigin = (this._camOrigin || new THREE.Vector3()).copy(origin); this._camPrevDir = (this._camPrevDir || new THREE.Vector3()).copy(dir); this._camLen = len;
        this._camRay.set(origin, dir); this._camRay.near = .04; this._camRay.far = len + .13;
        var hits = this._camRay.intersectObjects(this._camMeshes, false); var hit = hits.find(function (h) { for (var q = h.object; q; q = q.parent) { if (!q.visible) return false; } return true; });
        this._camRatio = hit ? Math.max(0, Math.min(1, (hit.distance - .18) / len)) : 1;
      }
      return back * this._camRatio;
    },
    tick: function (t, dt) {
      var cel = this.cameraEl(); if (!cel) return; var cam3 = cel.getObject3D('camera'); if (!cam3) return;
      var J = this.J, s = Math.min(dt || 16, 50) / 1000, o = cel.object3D, wp = this._wp || (this._wp = new THREE.Vector3());
      o.getWorldPosition(wp);
      var third = this.view === 'third' && !this.hidden && !this.el.is('vr-mode');
      J.root.visible = third;
      var SC = this.scripted;
      if (SC) {                                             // the Bridge is driving: pose from the script, not from movement
        J.root.position.set(SC.x, SC.y, SC.z); J.root.rotation.y = SC.yaw; this.yaw = SC.yaw; this.last = null; this.speed = 0;
        J.root.visible = !!SC.show || (third && SC.cam !== 'owned');
        if (this.kit) {
          var K = this.kit, nm = SC.clip || 'Idle';
          if (K.cur !== nm) { K.mx.stopAllAction(); var c = THREE.AnimationClip.findByName(K.clips, nm); K.act = c ? K.mx.clipAction(c) : null; if (K.act) { K.act.reset(); K.act.setLoop(THREE.LoopRepeat); K.act.setEffectiveWeight(1); K.act.play(); } K.cur = nm; }
          if (K.act) { var D = K.act.getClip().duration; K.act.time = nm === 'Walk_InPlace' || nm === 'Seated_Idle' || nm === 'Idle' ? (SC.time || 0) % D : Math.min(SC.time || 0, D - 0.0001); K.mx.update(0); }
        }
        if (SC.cam === 'owned') { this.dist = 0; cam3.position.set(0, 0, 0); return; }
      } else if (this.kit && this.kit.cur) {               // script just ended: back to the idle/walk blend
        this.kit.mx.stopAllAction(); this.kit.cur = null; [this.kit.idle, this.kit.walk].forEach(function (a) { if (a) { a.reset(); a.play(); a.setEffectiveWeight(0); } });
      }
      // speed from how far the player actually moved this frame
      if (!this.last) this.last = wp.clone();
      var dx = wp.x - this.last.x, dz = wp.z - this.last.z, d = Math.hypot(dx, dz); this.last.copy(wp);
      var sp = d > 1.2 ? 0 : d / Math.max(s, 1e-3); this.speed += (Math.min(sp, 4) - this.speed) * (1 - Math.exp(-s * (sp > this.speed ? 9 : 13)));
      if (sp === 0 && this.speed < .045) this.speed = 0;
      // facing: toward the walk direction when moving, else the way the camera looks
      var e = new THREE.Euler().setFromQuaternion(o.getWorldQuaternion(this._q || (this._q = new THREE.Quaternion())), 'YXZ'), want = e.y;
      if (this.speed > 0.3 && d > 1e-4) want = Math.atan2(-dx, -dz);
      var df = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw)); this.yaw += df * Math.min(1, s * 9);
      if (!SC) { J.root.position.set(wp.x, wp.y - 1.6, wp.z); J.root.rotation.y = this.yaw; }
      if (SC) {} else if (this.kit) {                                       // kit avatar: blend idle → walk, stride rate follows speed
        var kw = Math.min(1, this.speed / 1.35), rate = Math.max(.35, Math.min(2.2, this.speed / 1.22)); kw = kw * kw * (3 - 2 * kw);
        if (this.kit.walk) { this.kit.walk.setEffectiveWeight(kw); this.kit.walk.setEffectiveTimeScale(rate); }
        if (this.kit.idle) this.kit.idle.setEffectiveWeight(1 - kw); this.kit.mx.update(s);
        // Two foot contacts per cycle, tied to clip cadence rather than an unrelated timer.
        if (this.speed > .25 && this.kit.walk) { var cycle = this.kit.walk.getClip().duration, prev = Math.floor(this.stepClock); this.stepClock += s * rate * 2 / Math.max(.1, cycle); if (Math.floor(this.stepClock) !== prev && this.speed > .55 && window.WF_SOUND && !this.el.is('vr-mode')) WF_SOUND.step(); } else this.stepClock = 0;
      } else {
      // walk cycle
      var k = Math.min(1, this.speed / 2.6), ph0 = Math.floor(this.phase); this.phase += s * (2.2 + this.speed * 2.4);
      if (this.speed > 0.6 && Math.floor(this.phase) !== ph0 && window.WF_SOUND && !this.el.is('vr-mode')) WF_SOUND.step();   // a footfall each half stride
      var ph = this.phase * Math.PI, sw = Math.sin(ph), cw = Math.cos(ph);
      J.lL.hp.rotation.x = sw * 0.55 * k; J.lR.hp.rotation.x = -sw * 0.55 * k;
      J.lL.kn.rotation.x = Math.max(0, -cw) * 0.9 * k + 0.04; J.lR.kn.rotation.x = Math.max(0, cw) * 0.9 * k + 0.04;
      J.lL.ft.rotation.x = -J.lL.kn.rotation.x * 0.4; J.lR.ft.rotation.x = -J.lR.kn.rotation.x * 0.4;
      J.aL.sh.rotation.x = -sw * 0.5 * k; J.aR.sh.rotation.x = sw * 0.5 * k; J.aL.sh.rotation.z = 0.08; J.aR.sh.rotation.z = -0.08;
      J.aL.el.rotation.x = -0.25 - 0.35 * k; J.aR.el.rotation.x = -0.25 - 0.35 * k;
      var breathe = Math.sin(t / 1000 * 1.6) * 0.008;
      J.hips.position.y = 0.95 - Math.abs(cw) * 0.035 * k + breathe; J.spine.rotation.x = 0.07 * k; J.spine.rotation.y = sw * 0.08 * k;
      J.head.rotation.x = -e.x * 0.5; J.head.rotation.y = Math.atan2(Math.sin(e.y - this.yaw), Math.cos(e.y - this.yaw)) * 0.6;
      }
      // camera: over the shoulder in 3rd person, shortened so it stays inside the room
      var back = 0, up = 0;
      if (third) {
        back = 2.4; up = SC && SC.up ? SC.up : 0.45;   /* seated: lift the lens so you see over the chair back */ var R = 0, mob = this.el.components['wayfarer-mobile']; if (mob) R = mob.data.radius;
        var fx = Math.sin(e.y), fz = Math.cos(e.y);                // camera's backward direction in XZ
        for (var i = 0; i < 12; i++) {
          var cx = wp.x + fx * back, cz = wp.z + fz * back, BB = window.WAYFARER.bounds, ok = BB && window.WAYFARER.clampPoly ? !window.WAYFARER.clampPoly(BB, cx, cz, 0.35) : R > 0 ? Math.hypot(cx, cz) < R - 0.35 : true;
          if (ok) break; back *= 0.8;
        }
        back = this.cameraClearance(t, wp, this._q, up * back / 2.4, back);
        if (back < .85) { back = 0; up = 0; third = false; J.root.visible = !!(SC && SC.show); }   // no room behind you (doorways, walls): drop to 1st person
      }
      // Retract immediately to avoid clipping, ease outward after the obstruction clears.
      this.dist = back < this.dist ? back : this.dist + (back - this.dist) * (1 - Math.exp(-s * 8));
      cam3.position.set(0, up * (this.dist / 2.4), this.dist);
    }
  });
  function attach() { var sc = document.querySelector('a-scene'); if (sc && !sc.hasAttribute('wf-avatar')) sc.setAttribute('wf-avatar', ''); }
  if (document.readyState !== 'loading') attach(); else document.addEventListener('DOMContentLoaded', attach);
}());
