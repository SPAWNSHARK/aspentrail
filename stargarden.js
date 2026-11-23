// SS Wayfarer — Star Garden (Holodeck program).
// Launched from the amber projector ring on the Holodeck table. Tap inside the projection to plant a star; drag
// through stars to bend their paths. Gestures that START outside the projection still look / walk as normal.
// Pause, Reset and Save Garden live in a small panel; the saved garden (positions, drift, colours) is kept in
// localStorage on this device and restored the next time the program is launched.
(function () {
  var THREE = AFRAME.THREE, KEY = 'wf-star-garden-v1';
  var C = new THREE.Vector3(0, 2.35, -1), R = 1.15, MAXN = 72;
  var PALETTE = [[1.0, 0.84, 0.62], [0.74, 0.83, 1.0], [1.0, 0.72, 0.80], [0.78, 0.95, 0.82], [0.88, 0.78, 1.0]];
  var NAMES = ['amber', 'blue', 'rose', 'mint', 'lilac'];

  function dotTex() { var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }

  var css = document.createElement('style');
  css.textContent =
    '#sg-panel{position:fixed;left:calc(14px + env(safe-area-inset-left,0px));top:calc(40px + env(safe-area-inset-top,0px));z-index:16;display:none;width:150px;font:600 10px system-ui,sans-serif;letter-spacing:1.5px;color:#cfe0ff}' +
    '#sg-panel.on{display:block}' +
    '#sg-panel .t{margin:0 0 6px;padding:2px 4px;color:#ffcf8a;text-shadow:0 0 8px rgba(255,150,40,.5)}' +
    '#sg-panel b{display:block;margin:0 0 6px;padding:8px 10px;min-height:32px;border-radius:12px;border:1px solid rgba(136,170,255,.42);background:rgba(8,14,34,.62);color:#9ab8ff;text-align:center;white-space:nowrap}' +
    '#sg-panel b.on{background:rgba(136,170,255,.38);color:#fff}' +
    '#sg-panel .s{position:fixed;left:50%;transform:translateX(-50%);top:calc(44px + env(safe-area-inset-top,0px));width:min(60vw,380px);text-align:center;font-weight:500;letter-spacing:.8px;color:#9ab8ff;text-shadow:0 0 6px #000;line-height:1.35;pointer-events:none}' +
    'body.reading #sg-panel,body.wf-vr #sg-panel{display:none}';
  document.head.appendChild(css);

  AFRAME.registerComponent('star-garden', {
    init: function () {
      var self = this, sc = this.el.sceneEl || this.el;
      this.sc = sc; this.active = false; this.paused = false; this.stars = []; this.ripples = []; this.sprite = dotTex();
      this.trailT = 0;
      var root = this.root = new THREE.Group(); root.position.copy(C); root.visible = false; sc.object3D.add(root);

      // projection boundary: faint shell + a soft pool on the table, so you can see where gestures count
      var shell = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 18), new THREE.MeshBasicMaterial({ color: 0x88aaff, wireframe: true, transparent: true, opacity: 0.03, depthWrite: false, fog: false }));
      var glow = new THREE.Mesh(new THREE.SphereGeometry(R * 1.0, 24, 16), new THREE.MeshBasicMaterial({ color: 0x1a2a66, transparent: true, opacity: 0.07, side: THREE.BackSide, depthWrite: false, fog: false }));
      root.add(shell); root.add(glow);
      var pool = new THREE.Mesh(new THREE.CircleGeometry(1.2, 40), new THREE.MeshBasicMaterial({ map: this.sprite, color: 0xffb060, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(0, -C.y + 0.96, 0); root.add(pool);

      // stars (additive sprites) + short trails
      var pos = this.pos = new Float32Array(MAXN * 3), col = this.col = new Float32Array(MAXN * 3);
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setDrawRange(0, 0);
      this.points = new THREE.Points(g, new THREE.PointsMaterial({ map: this.sprite, size: 0.24, sizeAttenuation: true, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.95 }));
      this.points.frustumCulled = false; root.add(this.points);
      var TL = this.TL = 9, tp = this.tpos = new Float32Array(MAXN * (TL - 1) * 6), tc = this.tcol = new Float32Array(MAXN * (TL - 1) * 6);
      var tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setAttribute('color', new THREE.BufferAttribute(tc, 3)); tg.setDrawRange(0, 0);
      this.trails = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.8 }));
      this.trails.frustumCulled = false; root.add(this.trails);
      for (var i = 0; i < 6; i++) { var rp = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32), new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })); rp.visible = false; rp.userData.t = 1; root.add(rp); this.ripples.push(rp); }

      this.buildPanel(); this.hook();
      window.WAYFARER_GARDEN = { launch: function () { self.launch(); }, close: function () { self.close(); }, stars: function () { return self.stars.length; }, self: self };
    },

    // ───────────── panel ─────────────
    buildPanel: function () {
      var self = this, p = this.panel = document.createElement('div'); p.id = 'sg-panel'; p.className = 'wf-ctl';
      p.innerHTML = '<div class="t">STAR GARDEN</div>';
      function btn(label, fn) {
        var b = document.createElement('b'); b.textContent = label; p.appendChild(b); var pid = null, x0 = 0, y0 = 0;
        ['contextmenu', 'selectstart', 'dragstart'].forEach(function (n) { b.addEventListener(n, function (e) { e.preventDefault(); }); });
        b.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
        b.addEventListener('pointerdown', function (e) { e.preventDefault(); pid = e.pointerId; x0 = e.clientX; y0 = e.clientY; b.classList.add('on'); try { b.setPointerCapture(pid); } catch (err) {} });
        b.addEventListener('pointerup', function (e) { if (e.pointerId !== pid) return; pid = null; b.classList.remove('on'); var r = b.getBoundingClientRect();
          if (e.clientX >= r.left - 4 && e.clientX <= r.right + 4 && e.clientY >= r.top - 4 && e.clientY <= r.bottom + 4 && Math.hypot(e.clientX - x0, e.clientY - y0) < 14) fn(b); });
        ['pointercancel', 'lostpointercapture'].forEach(function (n) { b.addEventListener(n, function () { pid = null; b.classList.remove('on'); }); });
        return b;
      }
      this.bPause = btn('PAUSE', function () { self.setPaused(!self.paused); });
      btn('RESET', function () { self.reset(); });
      btn('SAVE GARDEN', function () { self.save(); });
      btn('CLOSE', function () { self.close(); });
      this.status = document.createElement('div'); this.status.className = 's'; p.appendChild(this.status);
      p.classList.add('wf-ctl'); document.body.appendChild(p);
    },
    say: function (m) { this.status.textContent = m; },

    // ───────────── program state ─────────────
    launch: function () {
      if (this.active) return; this.active = true; this.root.visible = true; this.panel.classList.add('on');
      var house = document.getElementById('hd-house'); if (house) house.setAttribute('visible', false);
      var saved = this.load();
      if (saved && saved.length) { this.stars = saved; this.say('Your saved garden is back · ' + saved.length + ' stars. Tap inside the glow to add one; drag through stars to bend them.'); }
      else { this.seed(); this.say('Tap inside the glow to plant a star. Drag through stars to bend their paths.'); }
      this.paused = false; this.bPause.textContent = 'PAUSE'; this.sync();
    },
    close: function () {
      if (!this.active) return; this.active = false; this.gesture = null; this.root.visible = false; this.panel.classList.remove('on');
      var house = document.getElementById('hd-house'); if (house) house.setAttribute('visible', true);
    },
    setPaused: function (p) { this.paused = p; this.bPause.textContent = p ? 'RESUME' : 'PAUSE'; this.say(p ? 'Paused. You can still plant stars.' : 'Drifting.'); },
    seed: function () {
      this.stars = []; for (var i = 0; i < 9; i++) { var a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1), r = R * (0.25 + 0.5 * Math.random());
        this.addStar(new THREE.Vector3(r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a)), i % PALETTE.length, true); }
    },
    reset: function () { this.seed(); this.say('Garden reset to a fresh set of drifting stars. Your saved garden is untouched until you save again.'); this.sync(); },
    addStar: function (p, ci, quiet) {
      if (this.stars.length >= MAXN) this.stars.shift();
      var v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.05 + Math.random() * 0.03);
      var s = { p: p.clone(), v: v, ci: ci, age: quiet ? 0.4 : 0, turn: 0, w: new THREE.Vector3(0, 1, 0), hist: [] };
      this.stars.push(s); return s;
    },
    nextColor: function () { this.ci = ((this.ci === undefined ? -1 : this.ci) + 1) % PALETTE.length; return this.ci; },

    // ───────────── persistence (this device only) ─────────────
    save: function () {
      try {
        var d = this.stars.map(function (s) { return [+(s.p.x / R).toFixed(3), +(s.p.y / R).toFixed(3), +(s.p.z / R).toFixed(3), +s.v.x.toFixed(3), +s.v.y.toFixed(3), +s.v.z.toFixed(3), s.ci]; });
        localStorage.setItem(KEY, JSON.stringify({ v: 1, saved: Date.now(), stars: d }));
        this.say('Saved on this device · ' + d.length + ' stars. It will be here when you come back.');
      } catch (e) { this.say('Could not save here (storage blocked in this browser mode).'); }
    },
    load: function () {
      try {
        var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!j || !j.stars) return null;
        return j.stars.slice(0, MAXN).map(function (a) { return { p: new THREE.Vector3(a[0] * R, a[1] * R, a[2] * R), v: new THREE.Vector3(a[3], a[4], a[5]), ci: (a[6] | 0) % PALETTE.length, age: 0.4, turn: 0, w: new THREE.Vector3(0, 1, 0), hist: [] }; });
      } catch (e) { return null; }
    },

    // ───────────── gestures: only ones that START inside the projection are captured ─────────────
    worldPoint: function (cx, cy) {
      var sc = this.sc, cam = sc.camera, cv = sc.canvas; if (!cam || !cv) return null;
      var r = cv.getBoundingClientRect(), ndc = new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height * 2 - 1));
      var rc = this.rc = this.rc || new THREE.Raycaster(); rc.setFromCamera(ndc, cam);
      var fwd = cam.getWorldDirection(new THREE.Vector3()), plane = new THREE.Plane().setFromNormalAndCoplanarPoint(fwd, C), q = new THREE.Vector3();
      if (!rc.ray.intersectPlane(plane, q)) return null;
      var local = q.clone().sub(C); return { q: local, inside: local.length() < R, fwd: fwd };
    },
    hook: function () {
      var self = this, sc = this.sc;
      function isCanvas(e) { return e.target === sc.canvas; }
      function tpt(e, id) { var l = e.changedTouches; for (var i = 0; i < l.length; i++) if (l[i].identifier === id) return l[i]; return null; }
      function begin(cx, cy, id, e) {
        if (!self.active || self.gesture) return false;
        var w = self.worldPoint(cx, cy); if (!w || !w.inside) return false;
        self.gesture = { id: id, t0: performance.now(), x0: cx, y0: cy, q: w.q.clone(), q0: w.q.clone(), tq: performance.now(), moved: false, fwd: w.fwd };
        e.stopImmediatePropagation(); e.preventDefault(); return true;
      }
      function move(cx, cy, e) {
        var g = self.gesture; if (!g) return;
        e.stopImmediatePropagation(); e.preventDefault();
        if (!g.moved && Math.hypot(cx - g.x0, cy - g.y0) > 9) g.moved = true;
        var w = self.worldPoint(cx, cy); if (!w) return;
        var q = w.q, now = performance.now(), dt = Math.max(0.008, (now - g.tq) / 1000);
        if (g.moved) self.bend(g.q, q, dt, w.fwd);
        g.q.copy(q); g.tq = now; g.fwd = w.fwd;
      }
      function end(cx, cy, e, cancel) {
        var g = self.gesture; if (!g) return; e.stopImmediatePropagation(); e.preventDefault(); self.gesture = null;
        if (!cancel && !g.moved && performance.now() - g.t0 < 450) { var w = self.worldPoint(cx, cy); if (w && w.inside) self.plant(w.q); }
      }
      var cap = { capture: true, passive: false };
      window.addEventListener('touchstart', function (e) { if (!isCanvas(e) || self.gesture) return; var t = e.changedTouches[0]; if (e.touches.length > 1) return; begin(t.clientX, t.clientY, t.identifier, e); }, cap);
      window.addEventListener('touchmove', function (e) { var g = self.gesture; if (!g || g.id === 'mouse') return; var t = tpt(e, g.id); if (t) move(t.clientX, t.clientY, e); }, cap);
      window.addEventListener('touchend', function (e) { var g = self.gesture; if (!g || g.id === 'mouse') return; var t = tpt(e, g.id); if (t) end(t.clientX, t.clientY, e, false); }, cap);
      window.addEventListener('touchcancel', function (e) { var g = self.gesture; if (!g || g.id === 'mouse') return; var t = tpt(e, g.id); if (t) end(t.clientX, t.clientY, e, true); }, cap);
      window.addEventListener('mousedown', function (e) { if (!isCanvas(e) || e.button !== 0) return; begin(e.clientX, e.clientY, 'mouse', e); }, cap);
      window.addEventListener('mousemove', function (e) { if (self.gesture && self.gesture.id === 'mouse') move(e.clientX, e.clientY, e); }, cap);
      window.addEventListener('mouseup', function (e) { if (self.gesture && self.gesture.id === 'mouse') end(e.clientX, e.clientY, e, false); }, cap);
    },
    plant: function (q) {
      var s = this.addStar(q, this.nextColor(), false); s.age = 0;
      var rp = null; for (var i = 0; i < this.ripples.length; i++) if (this.ripples[i].userData.t >= 1) { rp = this.ripples[i]; break; }
      if (rp) { rp.position.copy(q); rp.userData.t = 0; rp.visible = true; }
      this.say(this.stars.length + ' stars · ' + NAMES[s.ci] + ' planted.');
    },
    bend: function (a, b, dt, fwd) {       // pointer moved a→b through the projection (volume-local coords)
      var seg = b.clone().sub(a), len = seg.length(); if (len < 1e-4) return;
      var dir = seg.clone().divideScalar(len), speed = Math.min(0.9, len / dt), tmp = new THREE.Vector3(), rel = new THREE.Vector3(), RAD = 0.3;
      for (var i = 0; i < this.stars.length; i++) {
        var s = this.stars[i]; rel.copy(s.p).sub(a); var t = Math.max(0, Math.min(1, rel.dot(dir) / len)); tmp.copy(a).addScaledVector(seg, t); var d = tmp.distanceTo(s.p);
        if (d < RAD) {
          var f = (1 - d / RAD); f *= f;
          s.v.addScaledVector(dir, speed * 0.55 * f); if (s.v.length() > 0.7) s.v.setLength(0.7);
          var side = Math.sign(new THREE.Vector3().crossVectors(dir, rel.copy(s.p).sub(tmp)).dot(fwd)) || 1;     // which side of the drag the star sits on
          s.w.copy(fwd); s.turn += side * 1.4 * f; s.turn = Math.max(-2.2, Math.min(2.2, s.turn));
        }
      }
    },

    // ───────────── per frame ─────────────
    sync: function () { this.points.geometry.setDrawRange(0, this.stars.length); },
    tick: function (t, dtms) {
      if (!this.active) return;
      var dt = Math.min(dtms, 50) / 1000, i, j, S = this.stars, n = S.length, TL = this.TL, rec = false;
      this.trailT += dt; if (this.trailT > 0.09) { this.trailT = 0; rec = !this.paused; }
      var up = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
      for (i = 0; i < n; i++) {
        var s = S[i]; s.age = Math.min(1, s.age + dt / 0.9);                        // fade in: no pop, no flash
        if (!this.paused) {
          // gentle swirl, soft wall, slow return to a drifting speed
          tmp.crossVectors(up, s.p).multiplyScalar(0.03); s.v.addScaledVector(tmp, dt);
          var rr = s.p.length(); if (rr > R * 0.86) s.v.addScaledVector(s.p, -(rr - R * 0.86) / R * 3.2 * dt / Math.max(rr, 0.001) * R);
          var sp = s.v.length(), target = 0.055; if (sp > 1e-4) s.v.multiplyScalar(1 + ((target - sp) / sp) * Math.min(1, 0.55 * dt));
          if (Math.abs(s.turn) > 0.005) { s.v.applyAxisAngle(s.w, s.turn * dt); s.turn *= Math.exp(-0.22 * dt); } else s.turn = 0;
          s.p.addScaledVector(s.v, dt);
          if (s.p.length() > R * 0.97) s.p.setLength(R * 0.97);
        }
        if (rec) { s.hist.unshift(s.p.x, s.p.y, s.p.z); if (s.hist.length > TL * 3) s.hist.length = TL * 3; }
        var c = PALETTE[s.ci], k = s.age * s.age * (3 - 2 * s.age);
        this.pos[i * 3] = s.p.x; this.pos[i * 3 + 1] = s.p.y; this.pos[i * 3 + 2] = s.p.z;
        this.col[i * 3] = c[0] * k; this.col[i * 3 + 1] = c[1] * k; this.col[i * 3 + 2] = c[2] * k;
      }
      var seg = 0;
      for (i = 0; i < n; i++) {
        var h = S[i].hist, cc = PALETTE[S[i].ci], kk = S[i].age;
        var pts = [S[i].p.x, S[i].p.y, S[i].p.z].concat(h.slice(3));            // head first, then recorded history
        for (j = 0; j + 1 < Math.min(TL, pts.length / 3); j++) {
          var f0 = (1 - j / (TL - 1)) * 0.5 * kk, f1 = (1 - (j + 1) / (TL - 1)) * 0.5 * kk, o = seg * 6;
          this.tpos[o] = pts[j * 3]; this.tpos[o + 1] = pts[j * 3 + 1]; this.tpos[o + 2] = pts[j * 3 + 2]; this.tpos[o + 3] = pts[j * 3 + 3]; this.tpos[o + 4] = pts[j * 3 + 4]; this.tpos[o + 5] = pts[j * 3 + 5];
          this.tcol[o] = cc[0] * f0; this.tcol[o + 1] = cc[1] * f0; this.tcol[o + 2] = cc[2] * f0; this.tcol[o + 3] = cc[0] * f1; this.tcol[o + 4] = cc[1] * f1; this.tcol[o + 5] = cc[2] * f1; seg++;
        }
      }
      this.points.geometry.attributes.position.needsUpdate = true; this.points.geometry.attributes.color.needsUpdate = true; this.points.geometry.setDrawRange(0, n);
      this.trails.geometry.attributes.position.needsUpdate = true; this.trails.geometry.attributes.color.needsUpdate = true; this.trails.geometry.setDrawRange(0, seg * 2);
      // soft tap ripples (billboarded, low opacity, no flash)
      var cam = this.sc.camera;
      this.ripples.forEach(function (rp) { if (rp.userData.t >= 1) { rp.visible = false; return; } rp.userData.t = Math.min(1, rp.userData.t + dt / 0.8); var u = rp.userData.t;
        rp.scale.setScalar(0.04 + 0.2 * u); rp.material.opacity = 0.4 * (1 - u) * Math.min(1, u * 8); if (cam) rp.quaternion.copy(cam.getWorldQuaternion(new THREE.Quaternion())); });
    }
  });
}());
