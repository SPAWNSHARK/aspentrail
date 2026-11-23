// SS Wayfarer — alien cats. Load AFTER aframe.min.js.
//   <a-entity alien-cat="pose: rest; fur: #2c5058; glow: #7dffe8; eyes: #7dffb8; stretchAt: 17"></a-entity>
//   poses: walk | sit | sleep | loaf | rest   ('stretch' is accepted as an alias of 'rest')
//   Every cat runs the same stretch cycle: rest -> stretch -> rest, once per `every` seconds,
//   first one at `stretchAt` seconds (stagger these so the cats don't all stretch together).
// Cat local frame: +z = nose, +y = up, ~0.8 m nose to tail.
//
// One shared skeleton drives every pose, so head, shoulders, legs and tail are parented to the body
// and can never come apart:   rig > body (pivot at the hips) > { rump, belly, chest, neck > head,
// 2 x foreleg (shoulder > elbow > paw), 2 x hind leg (hip > knee > paw), tail }.
// Angles are WORLD pitch angles (0 = hanging straight down, negative = pointing forward); the
// code subtracts the body pitch to get the joint rotation, so poses are easy to reason about.
(function () {
  var THREE = AFRAME.THREE;

  // ---- stretch timing (ms) ----
  var EASE_IN = 1200, HOLD = 3000, EASE_OUT = 1200;       // rest -> stretch -> hold 3 s -> rest
  var TOTAL = EASE_IN + HOLD + EASE_OUT;
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  // ---- pose presets (world-angle joint parameters) ----
  // hipY/hipZ: hip pivot; pitch: body pitch (+ = chest down); fW/fE: foreleg upper world angle / elbow;
  // hW/hK: thigh world angle / knee; headW: head world pitch (+ = nose down); headYaw; headDrop: neck height;
  // tP/tY: tail pitch / yaw; belly: body y-scale; eyes: 1 open, 0 closed.
  var P = {
    walk:  { hipY: 0.40, hipZ: 0,    pitch: 0,     fW: 0,    fE: 0,    hW: 0,    hK: 0,    headW: 0,    headYaw: 0,   headDrop: 0,     tP: 0.9, tY: 0,    belly: 1,    eyes: 1 },
    sit:   { hipY: 0.17, hipZ: -0.05, pitch: -1.0, fW: 0.02, fE: 0,    hW: -1.35, hK: 2.3,  headW: 0,    headYaw: 0,   headDrop: 0,     tP: -0.2, tY: 0.55, belly: 1,    eyes: 1 },
    rest:  { hipY: 0.19, hipZ: 0,    pitch: 0,     fW: -1.35, fE: -0.1, hW: -1.25, hK: 2.3,  headW: -0.08, headYaw: 0,  headDrop: -0.03, tP: -0.1, tY: 0.5,  belly: 1,    eyes: 1 },
    loaf:  { hipY: 0.2,  hipZ: 0,    pitch: 0,     fW: -0.25, fE: 1.8,  hW: -1.25, hK: 2.3,  headW: -0.05, headYaw: 0,  headDrop: 0,     tP: -0.1, tY: 0.7,  belly: 1.08, eyes: 1 },
    sleep: { hipY: 0.19, hipZ: 0,    pitch: 0.12,  fW: -0.4,  fE: 1.9,  hW: -1.25, hK: 2.3,  headW: 0.75, headYaw: 0.85, headDrop: -0.1,  tP: -0.1, tY: 1.1,  belly: 1.05, eyes: 0 }
  };
  // the stretch every cat reaches (a play-bow: paws forward, chest low, hindquarters lifted)
  var S = { hipY: 0.46, hipZ: -0.1, pitch: 0.78, fW: -1.2, fE: -0.15, hW: -0.1, hK: 0.12, headW: 0.7, headYaw: 0, headDrop: 0, tP: 1.0, tY: 0, belly: 1, eyes: 0 };
  var KEYS = ['hipY', 'hipZ', 'pitch', 'fW', 'fE', 'hW', 'hK', 'headW', 'headYaw', 'headDrop', 'tP', 'tY', 'belly', 'eyes'];

  AFRAME.registerComponent('alien-cat', {
    schema: {
      pose: { default: 'walk' }, fur: { default: '#7a4aa0' }, glow: { default: '#d6a8ff' },
      eyes: { default: '#ffb040' }, scale: { default: 1 }, dots: { default: 18 }, phase: { default: 0 },
      stretchAt: { default: 20 },       // seconds after load of this cat's first stretch (stagger per cat)
      every: { default: 60 }            // seconds between stretches
    },

    init: function () {
      var d = this.data, low = window.WAYFARER && window.WAYFARER.mobile;
      var pose = d.pose === 'stretch' ? 'rest' : d.pose; this.pose = pose; this.base = P[pose] || P.rest;
      var furC = new THREE.Color(d.fur);
      var fur = new THREE.MeshStandardMaterial({ color: furC, roughness: 0.97, metalness: 0, emissive: furC.clone().multiplyScalar(0.18) });
      var inner = new THREE.MeshStandardMaterial({ color: furC.clone().lerp(new THREE.Color('#ffb0b8'), 0.45), roughness: 0.9 });
      var glow = this.glowMat = new THREE.MeshBasicMaterial({ color: d.glow, fog: false });
      var eyeM = new THREE.MeshBasicMaterial({ color: d.eyes, fog: false });
      var dark = new THREE.MeshBasicMaterial({ color: 0x120a10 });
      var seg = low ? 10 : 16, seg2 = low ? 8 : 12;

      function ell(m, sx, sy, sz, x, y, z, par) {
        var o = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg2), m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); par.add(o); return o;
      }
      function cyl(m, r0, r1, h, par) { var c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 8), m); c.position.y = -h / 2; par.add(c); return c; }
      function grp(par, x, y, z) { var g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g; }

      var root = new THREE.Group();
      var body = this.body = grp(root, 0, 0.3, 0);
      // torso: three overlapping ellipsoids so it is one continuous mass
      ell(fur, 0.17, 0.17, 0.21, 0, 0, 0, body);                 // rump
      ell(fur, 0.16, 0.15, 0.26, 0, 0.005, 0.2, body);           // belly
      ell(fur, 0.17, 0.18, 0.21, 0, 0.015, 0.4, body);           // chest
      this.torsoParts = body.children.slice();

      // neck + head (head is a child of the neck, the neck of the chest)
      var neck = this.neck = grp(body, 0, 0.07, 0.5);
      ell(fur, 0.1, 0.11, 0.14, 0, -0.01, -0.02, neck);
      var head = this.head = grp(neck, 0, 0.06, 0.12);
      ell(fur, 0.15, 0.13, 0.14, 0, 0, 0, head);
      ell(fur, 0.075, 0.055, 0.07, 0, -0.04, 0.12, head);        // muzzle
      ell(dark, 0.02, 0.015, 0.015, 0, -0.01, 0.185, head);      // nose
      var open = this.eyesOpen = new THREE.Group(), shut = this.eyesShut = new THREE.Group(); head.add(open); head.add(shut);
      [-1, 1].forEach(function (s) {
        var ear = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.15, 6), fur); ear.position.set(s * 0.09, 0.13, -0.01); ear.rotation.z = -s * 0.22; head.add(ear);
        var ie = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.1, 6), inner); ie.position.set(s * 0.09, 0.12, 0.012); ie.rotation.z = -s * 0.22; head.add(ie);
        ell(eyeM, 0.026, 0.034, 0.014, s * 0.065, 0.025, 0.12, open);
        ell(dark, 0.03, 0.006, 0.01, s * 0.065, 0.02, 0.125, shut);
        for (var w = -1; w <= 1; w++) {                           // whiskers
          var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.2, 3), new THREE.MeshBasicMaterial({ color: 0xf0e8f4, transparent: true, opacity: 0.6 }));
          wh.rotation.z = Math.PI / 2 + w * 0.18; wh.rotation.y = s * 0.25; wh.position.set(s * 0.15, -0.035 + w * 0.02, 0.1); head.add(wh);
        }
      });

      // legs: pivot (shoulder/hip) > upper > knee pivot > lower > paw. Every joint has a sphere so the chain never shows a gap.
      this.fore = []; this.hind = [];
      [-1, 1].forEach(function (s) {
        var sh = grp(body, s * 0.1, -0.02, 0.4), el;
        ell(fur, 0.07, 0.08, 0.07, 0, 0, 0, sh);
        cyl(fur, 0.048, 0.04, 0.19, sh); el = grp(sh, 0, -0.19, 0);
        ell(fur, 0.042, 0.042, 0.042, 0, 0, 0, el); cyl(fur, 0.04, 0.034, 0.19, el);
        ell(fur, 0.05, 0.035, 0.075, 0, -0.19, 0.03, el);
        this.fore.push({ sh: sh, el: el });
        var hp = grp(body, s * 0.11, 0, 0), kn;
        ell(fur, 0.09, 0.11, 0.12, 0, -0.03, 0.0, hp);           // haunch
        cyl(fur, 0.055, 0.042, 0.2, hp); kn = grp(hp, 0, -0.2, 0);
        ell(fur, 0.045, 0.045, 0.045, 0, 0, 0, kn); cyl(fur, 0.04, 0.034, 0.19, kn);
        ell(fur, 0.052, 0.035, 0.08, 0, -0.19, 0.03, kn);
        this.hind.push({ hp: hp, kn: kn });
      }, this);

      // tail: base at the rump, glowing tip
      var tail = this.tail = grp(body, 0, 0.05, -0.17);
      var curve = new THREE.CatmullRomCurve3([[0, 0, 0], [0.04, 0.01, -0.17], [0.16, 0.03, -0.3], [0.3, 0.05, -0.28], [0.38, 0.07, -0.16]].map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }));
      tail.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.04, 8, false), fur));
      ell(fur, 0.045, 0.045, 0.045, 0, 0, 0, tail);
      ell(glow, 0.055, 0.055, 0.055, 0.38, 0.07, -0.16, tail);

      // glowing speckles ride on the belly ellipsoid
      this.dots = [];
      var nD = low ? Math.round(d.dots * 0.5) : d.dots;
      for (var i = 0; i < nD; i++) {
        var th = Math.random() * 6.283, ph = Math.acos(Math.random() * 1.6 - 0.8);
        var dx = Math.sin(ph) * Math.cos(th), dy = Math.cos(ph), dz = Math.sin(ph) * Math.sin(th);
        if (dy < -0.2) { i--; continue; }
        var sp = new THREE.Mesh(new THREE.SphereGeometry(0.011 + Math.random() * 0.008, 5, 4), glow);
        sp.position.set(dx * 0.162, 0.005 + dy * 0.152, 0.2 + dz * 0.262); body.add(sp); this.dots.push(sp);
      }

      root.scale.setScalar(d.scale);
      this.root = root; this.cur = {};
      this.nextStretch = d.stretchAt * 1000; this.stretchT0 = -1; this.k = 0;
      this.el.setObject3D('cat', root);
      this.applyPose(this.base, 0, 0);
    },

    // run the shared cycle right now (used by tests)
    startStretch: function (now) { this.stretchT0 = now === undefined ? this.el.sceneEl.time : now; },

    applyPose: function (p, t, walkSwing) {
      var pitch = p.pitch;
      this.body.position.set(0, p.hipY, p.hipZ); this.body.rotation.x = pitch; this.body.scale.y = p.belly;
      this.neck.position.y = 0.07 + p.headDrop;
      this.head.rotation.x = p.headW - pitch; this.head.rotation.y = p.headYaw;
      var eyesOpen = p.eyes > 0.5; this.eyesOpen.visible = eyesOpen; this.eyesShut.visible = !eyesOpen;
      for (var i = 0; i < 2; i++) {
        var sw = i === 0 ? walkSwing : -walkSwing;            // diagonal pairs
        this.fore[i].sh.rotation.x = p.fW - pitch + sw; this.fore[i].el.rotation.x = p.fE;
        this.hind[i].hp.rotation.x = p.hW - pitch - sw; this.hind[i].kn.rotation.x = p.hK;
      }
      this.tail.rotation.x = p.tP; this.tail.rotation.y = p.tY;
    },

    tick: function (t) {
      var d = this.data, ph = d.phase, s = Math.sin, base = this.base, c = this.cur;
      this.glowMat.color.set(d.glow).multiplyScalar(0.75 + 0.35 * s(t / 700 + ph));

      // ---- stretch scheduler: every `every` s, first at `stretchAt` s ----
      if (this.stretchT0 < 0 && t >= this.nextStretch) this.stretchT0 = t;
      var k = 0;
      if (this.stretchT0 >= 0) {
        var u = t - this.stretchT0;
        if (u >= TOTAL) { this.stretchT0 = -1; this.nextStretch = t + d.every * 1000 - TOTAL; this.el.stretching = false; }
        else { k = u < EASE_IN ? smooth(u / EASE_IN) : u < EASE_IN + HOLD ? 1 : smooth(1 - (u - EASE_IN - HOLD) / EASE_OUT); this.el.stretching = true; }
      }
      this.k = k;

      var moving = this.pose === 'walk' && this.el.walking !== false && !this.el.stretching;
      var swing = moving ? s(t / 140 + ph) * 0.6 : 0;
      for (var i = 0; i < KEYS.length; i++) c[KEYS[i]] = base[KEYS[i]] + (S[KEYS[i]] - base[KEYS[i]]) * k;
      if (this.pose === 'sleep' || this.pose === 'loaf') c.belly *= 1 + 0.025 * s(t / 900 + ph);   // breathing
      c.tY += s(t / 1100 + ph) * 0.06 * (1 - k);                                                    // tail sway
      this.applyPose(c, t, swing * (1 - k));
    },

    remove: function () { this.el.removeObject3D('cat'); }
  });

  // cat-roam: wander between waypoints inside a rectangle, pausing now and then. Cat faces where it goes.
  // A cat that is mid-stretch stands still and resumes afterwards.
  AFRAME.registerComponent('cat-roam', {
    schema: { speed: { default: 0.45 }, x0: { default: -3 }, x1: { default: 3 }, z0: { default: -5 }, z1: { default: -1 } },
    init: function () {
      this.t = { x: 0, z: -3 }; this.pause = 0; this.yaw = 0; this.pickTarget();
      this.p = { x: this.t.x, z: this.t.z };
      this.el.walking = true; this.pickTarget();
    },
    pickTarget: function () {
      var d = this.data; this.t = { x: d.x0 + Math.random() * (d.x1 - d.x0), z: d.z0 + Math.random() * (d.z1 - d.z0) };
    },
    tick: function (time, dt) {
      var s = Math.min(dt, 60) / 1000, d = this.data;
      if (this.el.stretching) { this.el.walking = false; }
      else if (this.pause > 0) { this.pause -= s; this.el.walking = false; if (this.pause <= 0) this.pickTarget(); }
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
