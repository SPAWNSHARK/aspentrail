// SS Wayfarer — alien cats. Load AFTER aframe.min.js.
//   <a-entity alien-cat="pose: sit; fur: #efe6dc; glow: #bfa0ff; eyes: #ffb040"></a-entity>
//   poses: walk | sit | sleep | loaf | stretch      (walk cats are moved around by cat-roam)
// Cat local frame: +z = nose, +y = up, ~0.8 m nose to tail.
(function () {
  var THREE = AFRAME.THREE;

  AFRAME.registerComponent('alien-cat', {
    schema: {
      pose: { default: 'walk' }, fur: { default: '#7a4aa0' }, glow: { default: '#d6a8ff' },
      eyes: { default: '#ffb040' }, scale: { default: 1 }, dots: { default: 18 }, phase: { default: 0 }
    },

    init: function () {
      var d = this.data, low = window.WAYFARER && window.WAYFARER.mobile, root = new THREE.Group(), self = this;
      var furC = new THREE.Color(d.fur);
      var fur = new THREE.MeshStandardMaterial({ color: furC, roughness: 0.97, metalness: 0, emissive: furC.clone().multiplyScalar(0.18) });
      var inner = new THREE.MeshStandardMaterial({ color: furC.clone().lerp(new THREE.Color('#ffb0b8'), 0.45), roughness: 0.9 });
      var glow = this.glowMat = new THREE.MeshBasicMaterial({ color: d.glow, fog: false });
      var eyeM = new THREE.MeshBasicMaterial({ color: d.eyes, fog: false });
      var dark = new THREE.MeshBasicMaterial({ color: 0x120a10 });
      var seg = low ? 10 : 16, seg2 = low ? 8 : 12;

      function ell(m, sx, sy, sz, x, y, z, par) {
        var o = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg2), m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); (par || root).add(o); return o;
      }
      function limb(m, r, h, x, y, z, par) {                    // vertical leg hanging from a pivot
        var piv = new THREE.Group(); piv.position.set(x, y, z);
        var l = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.85, h, 8), m); l.position.y = -h / 2; piv.add(l);
        var paw = ell(m, r * 1.25, r * 0.8, r * 1.7, 0, -h, r * 0.6, piv);
        (par || root).add(piv); return piv;
      }
      function tube(points, r, m, par) {
        var t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); })), 20, r, 8, false), m);
        (par || root).add(t); return t;
      }
      function head(par, x, y, z, open, tilt) {
        var h = new THREE.Group(); h.position.set(x, y, z); h.rotation.x = tilt || 0; par.add(h);
        ell(fur, 0.15, 0.13, 0.14, 0, 0, 0, h);
        ell(fur, 0.075, 0.055, 0.07, 0, -0.04, 0.12, h);                       // muzzle
        ell(dark, 0.02, 0.015, 0.015, 0, -0.01, 0.185, h);                      // nose
        [-1, 1].forEach(function (s) {
          var ear = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.15, 6), fur); ear.position.set(s * 0.09, 0.13, -0.01); ear.rotation.z = -s * 0.22; h.add(ear);
          var ie = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.1, 6), inner); ie.position.set(s * 0.09, 0.12, 0.012); ie.rotation.z = -s * 0.22; h.add(ie);
          if (open) { var e = ell(eyeM, 0.026, 0.034, 0.014, s * 0.065, 0.025, 0.12, h); }
          else { ell(dark, 0.03, 0.006, 0.01, s * 0.065, 0.02, 0.125, h); }
          for (var w = -1; w <= 1; w++) {                                       // whiskers
            var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.2, 3), new THREE.MeshBasicMaterial({ color: 0xf0e8f4, transparent: true, opacity: 0.6 }));
            wh.rotation.z = Math.PI / 2 + w * 0.18; wh.rotation.y = s * 0.25; wh.position.set(s * 0.15, -0.035 + w * 0.02, 0.1); h.add(wh);
          }
        });
        return h;
      }

      var body = null, tail = null, legs = [], dotBody = null, pose = d.pose, tip;

      if (pose === 'walk') {
        body = ell(fur, 0.17, 0.16, 0.34, 0, 0.4, -0.02); dotBody = [0, 0.4, -0.02, 0.17, 0.16, 0.34];
        ell(fur, 0.19, 0.19, 0.2, 0, 0.42, 0.2);
        head(root, 0, 0.56, 0.46, true);
        legs = [limb(fur, 0.042, 0.34, -0.11, 0.36, 0.22), limb(fur, 0.042, 0.34, 0.11, 0.36, 0.22),
                limb(fur, 0.045, 0.34, -0.11, 0.36, -0.22), limb(fur, 0.045, 0.34, 0.11, 0.36, -0.22)];
        tail = new THREE.Group(); tail.position.set(0, 0.42, -0.34); root.add(tail);
        tube([[0, 0, 0], [0, 0.12, -0.2], [0, 0.4, -0.3], [0.04, 0.62, -0.22]], 0.036, fur, tail);
        tip = ell(glow, 0.05, 0.05, 0.05, 0.04, 0.63, -0.22, tail);
      } else if (pose === 'sit') {
        body = ell(fur, 0.2, 0.3, 0.22, 0, 0.32, -0.04); dotBody = [0, 0.32, -0.04, 0.2, 0.3, 0.22];
        ell(fur, 0.17, 0.15, 0.2, -0.13, 0.15, -0.1); ell(fur, 0.17, 0.15, 0.2, 0.13, 0.15, -0.1);
        head(root, 0, 0.76, 0.06, true, -0.05);
        [-1, 1].forEach(function (s) { var l = limb(fur, 0.045, 0.4, s * 0.07, 0.42, 0.16); legs.push(l); });
        tail = new THREE.Group(); root.add(tail);
        tube([[0.1, 0.05, -0.16], [0.28, 0.04, -0.12], [0.42, 0.04, 0.12], [0.32, 0.04, 0.3]], 0.04, fur, tail);
        tip = ell(glow, 0.055, 0.055, 0.055, 0.32, 0.05, 0.3, tail);
      } else if (pose === 'sleep') {
        body = ell(fur, 0.3, 0.17, 0.27, 0, 0.17, 0); dotBody = [0, 0.17, 0, 0.3, 0.17, 0.27];
        var hd = head(root, 0.1, 0.15, 0.27, false, 0.35);
        tail = new THREE.Group(); root.add(tail);
        tube([[-0.22, 0.09, -0.12], [-0.3, 0.09, 0.1], [-0.12, 0.08, 0.32], [0.14, 0.07, 0.4]], 0.04, fur, tail);
        tip = ell(glow, 0.05, 0.05, 0.05, 0.14, 0.07, 0.4, tail);
      } else if (pose === 'loaf') {
        body = ell(fur, 0.22, 0.2, 0.34, 0, 0.2, -0.04); dotBody = [0, 0.2, -0.04, 0.22, 0.2, 0.34];
        ell(fur, 0.19, 0.12, 0.2, 0, 0.12, 0.22);
        head(root, 0, 0.42, 0.3, true, 0.05);
        tail = new THREE.Group(); root.add(tail);
        tube([[0.08, 0.1, -0.34], [0.24, 0.06, -0.5], [0.5, 0.05, -0.4], [0.58, 0.06, -0.14]], 0.045, fur, tail);
        tip = ell(glow, 0.06, 0.06, 0.06, 0.58, 0.06, -0.14, tail);
      } else { // stretch: play-bow, rump up
        var bg = new THREE.Group(); bg.rotation.x = -0.4; bg.position.set(0, 0.34, -0.02); root.add(bg);
        body = ell(fur, 0.16, 0.15, 0.4, 0, 0, 0, bg); dotBody = [0, 0.34, -0.02, 0.16, 0.15, 0.4];
        head(root, 0, 0.2, 0.55, false, 0.5);
        [-1, 1].forEach(function (s) {
          tube([[s * 0.1, 0.16, 0.22], [s * 0.1, 0.07, 0.5], [s * 0.11, 0.04, 0.82]], 0.04, fur);
          ell(fur, 0.05, 0.035, 0.08, s * 0.11, 0.035, 0.86);
          legs.push(limb(fur, 0.05, 0.4, s * 0.1, 0.4, -0.3));
        });
        tail = new THREE.Group(); tail.position.set(0, 0.5, -0.4); root.add(tail);
        tube([[0, 0, 0], [0, 0.22, -0.16], [0.02, 0.5, -0.1], [0.14, 0.7, 0.02]], 0.04, fur, tail);
        tip = ell(glow, 0.055, 0.055, 0.055, 0.14, 0.71, 0.02, tail);
      }

      // glowing speckles scattered over the fur
      this.dots = [];
      var nD = low ? Math.round(d.dots * 0.5) : d.dots, B = dotBody;
      for (var i = 0; i < nD; i++) {
        var th = Math.random() * 6.283, ph = Math.acos(Math.random() * 1.6 - 0.8);
        var dx = Math.sin(ph) * Math.cos(th), dy = Math.cos(ph), dz = Math.sin(ph) * Math.sin(th);
        if (dy < -0.2) { i--; continue; }
        var s = new THREE.Mesh(new THREE.SphereGeometry(0.011 + Math.random() * 0.008, 5, 4), glow);
        s.position.set(B[0] + dx * B[3] * 1.02, B[1] + dy * B[4] * 1.02, B[2] + dz * B[5] * 1.02);
        (pose === 'stretch' ? root : root).add(s); this.dots.push(s);
      }

      root.scale.setScalar(d.scale);
      this.root = root; this.body = body; this.tail = tail; this.legs = legs; this.pose = pose;
      this.el.setObject3D('cat', root);
    },

    tick: function (t) {
      var d = this.data, ph = d.phase, s = Math.sin;
      this.glowMat.color.set(d.glow).multiplyScalar(0.75 + 0.35 * s(t / 700 + ph));
      if (this.tail) {
        if (this.pose === 'walk') this.tail.rotation.y = s(t / 520 + ph) * 0.35;
        else if (this.pose === 'sit') this.tail.rotation.y = s(t / 900 + ph) * 0.06;
        else this.tail.rotation.z = s(t / 1100 + ph) * 0.05;
      }
      if (this.pose === 'walk' && this.legs.length === 4) {
        var moving = this.el.walking !== false, k = moving ? 0.6 : 0, w = t / 140 + ph;
        this.legs[0].rotation.x = s(w) * k; this.legs[3].rotation.x = s(w) * k;
        this.legs[1].rotation.x = -s(w) * k; this.legs[2].rotation.x = -s(w) * k;
      }
      if (this.pose === 'sleep' || this.pose === 'loaf') {
        var b = 1 + 0.025 * s(t / 900 + ph); this.body.scale.y = (this.body.userData.sy = this.body.userData.sy || this.body.scale.y) * b;
      }
    },

    remove: function () { this.el.removeObject3D('cat'); }
  });

  // cat-roam: wander between waypoints inside a rectangle, pausing now and then. Cat faces where it goes.
  AFRAME.registerComponent('cat-roam', {
    schema: { speed: { default: 0.45 }, x0: { default: -3 }, x1: { default: 3 }, z0: { default: -5 }, z1: { default: -1 } },
    init: function () {
      this.t = { x: 0, z: -3 }; this.pause = 0; this.yaw = 0; this.pickTarget();
      var p = this.el.object3D.position; this.p = { x: this.t.x, z: this.t.z };
      this.el.walking = true; this.pickTarget();
    },
    pickTarget: function () {
      var d = this.data; this.t = { x: d.x0 + Math.random() * (d.x1 - d.x0), z: d.z0 + Math.random() * (d.z1 - d.z0) };
    },
    tick: function (time, dt) {
      var s = Math.min(dt, 60) / 1000, d = this.data;
      if (this.pause > 0) { this.pause -= s; this.el.walking = false; if (this.pause <= 0) this.pickTarget(); }
      else {
        var dx = this.t.x - this.p.x, dz = this.t.z - this.p.z, L = Math.sqrt(dx * dx + dz * dz);
        if (L < 0.1) { this.pause = 1.5 + Math.random() * 4; }
        else {
          this.el.walking = true;
          this.p.x += dx / L * d.speed * s; this.p.z += dz / L * d.speed * s;
          var want = Math.atan2(dx, dz), diff = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw));
          this.yaw += diff * Math.min(1, s * 4);
        }
      }
      this.el.object3D.position.set(this.p.x, 0, this.p.z); this.el.object3D.rotation.y = this.yaw;
    }
  });
}());
