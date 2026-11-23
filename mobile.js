// SS Wayfarer — mobile support, shared by every room.
// Load AFTER aframe.min.js, then put  wayfarer-mobile  on the <a-scene>
// (optionally  wayfarer-mobile="radius: 10.2"  to keep the player inside a round room).
//
//  • window.WAYFARER = { touch, mobile }  — quality profile for pages to read
//  • four arrow buttons (bottom-left) walk the player; a thumbstick (bottom-right) looks; Gyro + Level sit top-right under the deck label
//  • tap-to-interact: reuses the page's gaze-cursor selector as a mouse/touch ray
//  • gaze reticle + fuse are switched on only in VR (Cardboard) mode
//  • optional round-room bounds so you can't walk through the walls
(function () {
  var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  var small = Math.min(screen.width, screen.height) <= 1024;
  var mobile = AFRAME.utils.device.isMobile() || (touch && small);
  window.WAYFARER = { touch: touch, mobile: mobile };
  var root = document.documentElement;
  if (touch) root.classList.add('touch');
  if (mobile) root.classList.add('mobile');

  var css = document.createElement('style');
  css.textContent =
    // every control shares .wf-ctl: no text selection, no long-press callout, no tap flash — scoped to the controls only
    '.wf-ctl,.wf-ctl *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;touch-action:none}' +
    '#wf-dpad,#wf-stick,#wf-top{position:fixed;z-index:15;display:none;transition:opacity .25s}' +
    'html.touch #wf-dpad,html.touch #wf-stick,html.touch #wf-top{display:block}' +
    // left thumb: four arrows in a cross
    '#wf-dpad{left:calc(16px + env(safe-area-inset-left,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px));width:140px;height:140px}' +
    '#wf-dpad b{position:absolute;width:56px;height:56px;border-radius:16px;border:1px solid rgba(136,170,255,.42);' +
    'background:rgba(8,14,34,.58);color:#9ab8ff;font:600 22px/54px system-ui,sans-serif;text-align:center}' +
    '#wf-dpad b.on{background:rgba(136,170,255,.42);color:#fff;border-color:rgba(190,215,255,.9)}' +
    '#wf-dpad .u{left:42px;top:0}#wf-dpad .d{left:42px;bottom:0}#wf-dpad .l{left:0;top:42px}#wf-dpad .r{right:0;top:42px}' +
    // right thumb: look stick
    '#wf-stick{right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px));width:128px;height:128px;border-radius:50%;' +
    'border:1px solid rgba(136,170,255,.42);background:radial-gradient(circle,rgba(20,30,60,.30),rgba(2,4,12,.52))}' +
    '#wf-stick i{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;' +
    'background:rgba(136,170,255,.28);border:1px solid rgba(170,200,255,.7);box-shadow:0 0 14px rgba(60,120,255,.35);pointer-events:none}' +
    '#wf-stick.on i{background:rgba(136,170,255,.45)}' +
    // top right, just under the deck label, clear of the notch / rounded corners
    '#wf-top{right:calc(14px + env(safe-area-inset-right,0px));top:calc(46px + env(safe-area-inset-top,0px));display:none;text-align:right}' +
    '#wf-top b{display:block;margin:0 0 6px auto;padding:7px 12px;border-radius:14px;border:1px solid rgba(136,170,255,.42);background:rgba(8,14,34,.58);' +
    'color:#9ab8ff;font:600 10px system-ui,sans-serif;letter-spacing:1.5px;white-space:nowrap}' +
    '#wf-top b.on{background:rgba(136,170,255,.35);color:#fff}' +
    'body.reading .wf-ctl,body.wf-vr .wf-ctl{opacity:0;pointer-events:none}' +
    'html.touch #controls-hint{bottom:auto!important;top:48px;width:min(92vw,calc(100vw - 230px));text-align:center;white-space:normal!important;left:50%!important;' +
    'color:#5878b8!important;font-size:10px!important;letter-spacing:1.5px!important;transition:opacity 1.2s}' +
    'html.touch #controls-hint.wf-gone{opacity:0}';
  document.head.appendChild(css);

  AFRAME.registerComponent('wayfarer-mobile', {
    schema: { speed: { default: 2.6 }, radius: { default: 0 } },

    init: function () {
      var self = this, sc = this.el;
      this.vec = { x: 0, y: 0 };
      this.dir = new AFRAME.THREE.Vector3();
      this.wp = new AFRAME.THREE.Vector3();
      this.mover = null;
      if (!touch) {                                         // desktop: the gaze fuse would auto-click whatever you look at (TV, doors); use it in VR only
        sc.addEventListener('loaded', function () {
          var cur = sc.querySelector('a-cursor'); if (!cur) return;
          cur.setAttribute('cursor', 'fuse', false);
          sc.addEventListener('enter-vr', function () { cur.setAttribute('cursor', 'fuse', true); });
          sc.addEventListener('exit-vr', function () { cur.setAttribute('cursor', 'fuse', false); });
        });
        return;
      }

      // ── shared helpers: every control element is .wf-ctl (no selection / callout) and swallows the context menu ──
      function ctl(el) {
        el.classList.add('wf-ctl');
        ['contextmenu', 'selectstart', 'dragstart'].forEach(function (n) { el.addEventListener(n, function (e) { e.preventDefault(); }); });
        el.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
        return el;
      }

      // ── left thumb: four arrow buttons. Hold = move; release, cancel or losing the pointer = stop at once ──
      var dpad = ctl(document.createElement('div')); dpad.id = 'wf-dpad';
      var dirs = { u: [0, 1], d: [0, -1], l: [-1, 0], r: [1, 0] }, heldDir = { u: 0, d: 0, l: 0, r: 0 };
      function applyDir() { self.vec.x = heldDir.r - heldDir.l; self.vec.y = heldDir.u - heldDir.d; }
      [['u', '↑'], ['d', '↓'], ['l', '←'], ['r', '→']].forEach(function (d) {
        var b = document.createElement('b'), pidB = null; b.className = d[0]; b.textContent = d[1]; ctl(b); dpad.appendChild(b);
        function stop(e) { if (e && pidB !== null && e.pointerId !== undefined && e.pointerId !== pidB) return; pidB = null; heldDir[d[0]] = 0; b.classList.remove('on'); applyDir(); }
        b.addEventListener('pointerdown', function (e) {
          e.preventDefault(); if (pidB !== null) return; pidB = e.pointerId; try { b.setPointerCapture(pidB); } catch (err) {}
          heldDir[d[0]] = 1; b.classList.add('on'); applyDir();
        });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { b.addEventListener(n, stop); });
        b.addEventListener('touchend', function () { stop(); }); b.addEventListener('touchcancel', function () { stop(); });
        b._stop = stop;
      });
      document.body.appendChild(dpad);

      // ── right thumb: look stick. Push left/right to turn, up/down to look; release stops turning and keeps the view ──
      var stick = ctl(document.createElement('div')), knob = document.createElement('i'), look = this.look = { x: 0, y: 0, level: false }, lpid = null;
      stick.id = 'wf-stick'; stick.appendChild(knob); document.body.appendChild(stick);
      function lookUpdate(e) {
        var r = stick.getBoundingClientRect(), R = r.width / 2 - 10;
        var dx = (e.clientX - (r.left + r.width / 2)) / R, dy = (e.clientY - (r.top + r.height / 2)) / R, len = Math.sqrt(dx * dx + dy * dy);
        if (len > 1) { dx /= len; dy /= len; len = 1; }
        knob.style.transform = 'translate(' + (dx * 38) + 'px,' + (dy * 38) + 'px)';
        if (len < 0.14) { look.x = 0; look.y = 0; return; }
        var mag = Math.pow(len, 1.5) / len;                  // finer control near the centre
        look.x = -dx * mag; look.y = -dy * mag;              // push right → turn right; push up → look up
        look.level = false;
      }
      function lookEnd(e) { if (e && e.pointerId !== undefined && lpid !== null && e.pointerId !== lpid) return; lpid = null; look.x = 0; look.y = 0; knob.style.transform = ''; stick.classList.remove('on'); }
      stick.addEventListener('pointerdown', function (e) { e.preventDefault(); if (lpid !== null) return; lpid = e.pointerId; try { stick.setPointerCapture(lpid); } catch (err) {} stick.classList.add('on'); lookUpdate(e); });
      stick.addEventListener('pointermove', function (e) { if (e.pointerId === lpid) lookUpdate(e); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { stick.addEventListener(n, lookEnd); });
      stick.addEventListener('touchend', function () { lookEnd(); }); stick.addEventListener('touchcancel', function () { lookEnd(); });

      // ── top right, under the deck label: Gyro and Level. They fire only on a deliberate tap (press and release on the same button) ──
      var top = ctl(document.createElement('div')); top.id = 'wf-top';
      var gy = document.createElement('b'), lv = document.createElement('b'); gy.textContent = 'GYRO OFF'; lv.textContent = 'LEVEL'; ctl(gy); ctl(lv); top.appendChild(gy); top.appendChild(lv); document.body.appendChild(top);
      this.gyro = false;
      function tap(btn, fn) {
        var pid2 = null, x0 = 0, y0 = 0, t0 = 0;
        btn.addEventListener('pointerdown', function (e) { e.preventDefault(); pid2 = e.pointerId; x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); btn.classList.add('on'); try { btn.setPointerCapture(pid2); } catch (err) {} });
        btn.addEventListener('pointerup', function (e) {
          if (e.pointerId !== pid2) return; pid2 = null; btn.classList.remove('on');
          var r = btn.getBoundingClientRect(), inside = e.clientX >= r.left - 4 && e.clientX <= r.right + 4 && e.clientY >= r.top - 4 && e.clientY <= r.bottom + 4;
          if (inside && Math.hypot(e.clientX - x0, e.clientY - y0) < 12 && performance.now() - t0 < 700) fn();
        });
        ['pointercancel', 'lostpointercapture'].forEach(function (n) { btn.addEventListener(n, function () { pid2 = null; btn.classList.remove('on'); }); });
      }
      tap(gy, function () { self.gyro = !self.gyro; gy.textContent = self.gyro ? 'GYRO ON' : 'GYRO OFF'; self.applyGyro(); });
      tap(lv, function () { look.level = true; });
      sc.addEventListener('loaded', function () { self.applyGyro(); });
      // never keep moving or turning if the page loses focus mid-press
      function releaseAll() { Array.prototype.forEach.call(dpad.children, function (b) { b._stop(); }); lookEnd(); }
      window.addEventListener('blur', releaseAll); document.addEventListener('visibilitychange', function () { if (document.hidden) releaseAll(); });

      // ── hint text ──
      var hint = document.getElementById('controls-hint');
      if (hint) {
        hint.textContent = 'LEFT ARROWS WALK · RIGHT THUMBSTICK LOOK · TOP RIGHT GYRO / LEVEL · DRAG THE VIEW TO LOOK · TAP GLOWING BUTTONS';
        setTimeout(function () { hint.classList.add('wf-gone'); }, 9000);
      }

      // ── tap-to-interact + VR-only gaze reticle ──

      // ── doors: on touch devices a door only opens from its on-door OPEN button (tap it from anywhere) ──
      function doorButtons() {
        var V = AFRAME.THREE.Vector3, CLS = 'door-face interactive clickable';
        sc.querySelectorAll('.door-face, #exit-panel, #exit-door').forEach(function (d) {
          if (d.getAttribute('data-wf-btn')) return; d.setAttribute('data-wf-btn', '1');
          var w = +d.getAttribute('width') || 1.6, dp = +d.getAttribute('depth') || 0.05, wp = new V();
          d.classList.remove('door-face', 'interactive', 'clickable');       // the door body itself is no longer tappable
          d.object3D.updateMatrixWorld(true); d.object3D.getWorldPosition(wp);
          var inside = d.object3D.worldToLocal(new V(0, wp.y, 0)), sgn = inside.z >= 0 ? 1 : -1, R = Math.min(0.24, w * 0.14);
          var btn = document.createElement('a-entity');
          btn.setAttribute('class', CLS);
          btn.setAttribute('position', { x: 0, y: 0, z: sgn * (dp / 2 + 0.05) });
          btn.setAttribute('rotation', { x: 0, y: sgn > 0 ? 0 : 180, z: 0 });
          btn.setAttribute('geometry', { primitive: 'circle', radius: R, segments: 28 });
          btn.setAttribute('material', { shader: 'flat', color: '#ffb35c' });
          btn.setAttribute('animation', { property: 'scale', from: '1 1 1', to: '1.12 1.12 1.12', dir: 'alternate', loop: true, dur: 900, easing: 'easeInOutSine' });
          var ring = document.createElement('a-entity');
          ring.setAttribute('geometry', { primitive: 'ring', radiusInner: R * 1.04, radiusOuter: R * 1.22, segmentsTheta: 28 });
          ring.setAttribute('material', { shader: 'flat', color: '#6b4a1e' }); ring.setAttribute('position', '0 0 -0.002');
          var label = document.createElement('a-text');
          label.setAttribute('value', 'OPEN'); label.setAttribute('align', 'center'); label.setAttribute('color', '#1a0f05');
          label.setAttribute('width', R * 4.4); label.setAttribute('position', '0 0 0.01');
          var hit = document.createElement('a-entity');                      // generous finger target
          hit.setAttribute('class', CLS); hit.setAttribute('geometry', { primitive: 'circle', radius: R * 2.2 });
          hit.setAttribute('material', { shader: 'flat', transparent: true, opacity: 0, depthWrite: false }); hit.setAttribute('position', '0 0 0.004');
          btn.appendChild(ring); btn.appendChild(label); btn.appendChild(hit);
          d.appendChild(btn);
        });
        var rc = sc.components.raycaster; if (rc) setTimeout(function () { rc.refreshObjects(); }, 50);
      }
      function wire() {
        var cur = sc.querySelector('a-cursor');
        var objs = cur && cur.getAttribute('raycaster') && cur.getAttribute('raycaster').objects;
        sc.setAttribute('raycaster', { objects: objs || '.clickable, .interactive', far: 60 });
        sc.setAttribute('cursor', { rayOrigin: 'mouse', fuse: false });
        // the page's centre-of-screen gaze cursor would also 'click' whatever sits mid-screen on every tap: off outside VR
        if (cur) { cur.setAttribute('visible', false); cur.setAttribute('cursor', 'fuse', false); cur.setAttribute('raycaster', 'enabled', false); }
        // refresh what's under the finger at touch-down, so a slow frame can never click a stale target
        function onTouch() { var cv = sc.canvas; if (!cv) return; cv.addEventListener('touchstart', function () { var rc = sc.components.raycaster; if (rc) rc.checkIntersections(); }, { passive: true }); }
        if (sc.canvas) onTouch(); else sc.addEventListener('render-target-loaded', onTouch);
        sc.addEventListener('enter-vr', function () {
          document.body.classList.add('wf-vr');
          if (cur) { cur.setAttribute('visible', true); cur.setAttribute('raycaster', 'enabled', true); cur.setAttribute('cursor', 'fuse', true); }
        });
        sc.addEventListener('exit-vr', function () {
          document.body.classList.remove('wf-vr');
          if (cur) { cur.setAttribute('visible', false); cur.setAttribute('cursor', 'fuse', false); cur.setAttribute('raycaster', 'enabled', false); }
        });
      }
      function ready() { wire(); doorButtons(); }
      if (sc.hasLoaded) ready(); else sc.addEventListener('loaded', ready);
    },

    applyGyro: function () {
      var c = this.el.querySelector('[camera]');
      if (c && c.components['look-controls']) c.setAttribute('look-controls', 'magicWindowTrackingEnabled', this.gyro);
    },

    tick: function (t, dt) {
      if (this.el.is('vr-mode')) return;
      if (!this.mover) {
        this.mover = this.el.querySelector('[wasd-controls]');
        if (!this.mover) return;
      }
      var m = this.mover.object3D, s = Math.min(dt, 50) / 1000, v = this.vec;
      var lk = this.look;
      if (lk) {
        var c = this.el.querySelector('[camera]'), lc = c && c.components['look-controls'];
        if (lc && lc.pitchObject) {
          var P = lc.pitchObject.rotation, Y = lc.yawObject.rotation;
          if (lk.x || lk.y) { Y.y += lk.x * 1.3 * s; P.x = Math.max(-1.3, Math.min(1.3, P.x + lk.y * 1.0 * s)); }
          else if (lk.level) { P.x *= Math.max(0, 1 - 6 * s); if (Math.abs(P.x) < 0.004) { P.x = 0; lk.level = false; } }
        }
      }
      if (v.x || v.y) {
        var cam = this.el.camera;
        if (cam) {
          cam.getWorldDirection(this.dir);
          var fx = this.dir.x, fz = this.dir.z, l = Math.sqrt(fx * fx + fz * fz) || 1;
          fx /= l; fz /= l;
          m.position.x += (fx * v.y - fz * v.x) * this.data.speed * s;
          m.position.z += (fz * v.y + fx * v.x) * this.data.speed * s;
        }
      }
      if (this.data.radius > 0) {                           // keep keyboard + stick inside the room
        m.getWorldPosition(this.wp);
        var r = Math.sqrt(this.wp.x * this.wp.x + this.wp.z * this.wp.z);
        if (r > this.data.radius) {
          var k = this.data.radius / r - 1;
          m.position.x += this.wp.x * k; m.position.z += this.wp.z * k;
        }
      }
    }
  });
}());
