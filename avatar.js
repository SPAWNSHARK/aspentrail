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
      this.phase = 0; this.speed = 0; this.yaw = 0; this.last = null; this.hidden = false; this.dist = 0;
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
      window.WAYFARER.avatar = { hide: function (h) { self.hidden = h; self.apply(); }, view: function () { return self.view; }, toggle: function () { self.toggle(); } };
    },
    toggle: function () { this.view = this.view === 'third' ? 'first' : 'third'; try { localStorage.setItem('wf-view', this.view); } catch (e) {} this.apply(); },
    apply: function () { if (this.btn) this.btn.classList.toggle('sel', this.view === 'third'); },
    cameraEl: function () { return this.el.camera && this.el.camera.el; },
    tick: function (t, dt) {
      var cel = this.cameraEl(); if (!cel) return; var cam3 = cel.getObject3D('camera'); if (!cam3) return;
      var J = this.J, s = Math.min(dt || 16, 50) / 1000, o = cel.object3D, wp = this._wp || (this._wp = new THREE.Vector3());
      o.getWorldPosition(wp);
      var third = this.view === 'third' && !this.hidden && !this.el.is('vr-mode');
      J.root.visible = third;
      // speed from how far the player actually moved this frame
      if (!this.last) this.last = wp.clone();
      var dx = wp.x - this.last.x, dz = wp.z - this.last.z, d = Math.hypot(dx, dz); this.last.copy(wp);
      var sp = d > 1.2 ? 0 : d / Math.max(s, 1e-3); this.speed += (Math.min(sp, 4) - this.speed) * Math.min(1, s * 8);
      // facing: toward the walk direction when moving, else the way the camera looks
      var e = new THREE.Euler().setFromQuaternion(o.getWorldQuaternion(this._q || (this._q = new THREE.Quaternion())), 'YXZ'), want = e.y;
      if (this.speed > 0.3 && d > 1e-4) want = Math.atan2(-dx, -dz);
      var df = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw)); this.yaw += df * Math.min(1, s * 9);
      J.root.position.set(wp.x, wp.y - 1.6, wp.z); J.root.rotation.y = this.yaw;
      // walk cycle
      var k = Math.min(1, this.speed / 2.6); this.phase += s * (2.2 + this.speed * 2.4);
      var ph = this.phase * Math.PI, sw = Math.sin(ph), cw = Math.cos(ph);
      J.lL.hp.rotation.x = sw * 0.55 * k; J.lR.hp.rotation.x = -sw * 0.55 * k;
      J.lL.kn.rotation.x = Math.max(0, -cw) * 0.9 * k + 0.04; J.lR.kn.rotation.x = Math.max(0, cw) * 0.9 * k + 0.04;
      J.lL.ft.rotation.x = -J.lL.kn.rotation.x * 0.4; J.lR.ft.rotation.x = -J.lR.kn.rotation.x * 0.4;
      J.aL.sh.rotation.x = -sw * 0.5 * k; J.aR.sh.rotation.x = sw * 0.5 * k; J.aL.sh.rotation.z = 0.08; J.aR.sh.rotation.z = -0.08;
      J.aL.el.rotation.x = -0.25 - 0.35 * k; J.aR.el.rotation.x = -0.25 - 0.35 * k;
      var breathe = Math.sin(t / 1000 * 1.6) * 0.008;
      J.hips.position.y = 0.95 - Math.abs(cw) * 0.035 * k + breathe; J.spine.rotation.x = 0.07 * k; J.spine.rotation.y = sw * 0.08 * k;
      J.head.rotation.x = -e.x * 0.5; J.head.rotation.y = Math.atan2(Math.sin(e.y - this.yaw), Math.cos(e.y - this.yaw)) * 0.6;
      // camera: over the shoulder in 3rd person, shortened so it stays inside the room
      var back = 0, up = 0;
      if (third) {
        back = 2.4; up = 0.45; var R = 0, mob = this.el.components['wayfarer-mobile']; if (mob) R = mob.data.radius;
        var fx = Math.sin(e.y), fz = Math.cos(e.y);                // camera's backward direction in XZ
        for (var i = 0; i < 12; i++) {
          var cx = wp.x + fx * back, cz = wp.z + fz * back, ok = R > 0 ? Math.hypot(cx, cz) < R - 0.35 : (Math.abs(cx) < 2.3 && Math.abs(cz) < 12.3);
          if (ok) break; back *= 0.8;
        }
        if (back < 1.1) { back = 0; up = 0; third = false; J.root.visible = false; }   // no room behind you (doorways, walls): drop to 1st person
      }
      this.dist += (back - this.dist) * Math.min(1, s * 6);
      cam3.position.set(0, up * (this.dist / 2.4), this.dist);
    }
  });
  function attach() { var sc = document.querySelector('a-scene'); if (sc && !sc.hasAttribute('wf-avatar')) sc.setAttribute('wf-avatar', ''); }
  if (document.readyState !== 'loading') attach(); else document.addEventListener('DOMContentLoaded', attach);
}());
