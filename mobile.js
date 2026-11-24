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

  // ── controls: one frosted-glass bar across the bottom (iOS glassmorphism, Safari-bottom-bar proportions), white
  //    rounded line icons in the YouTube tab-bar style. Left: movement pad. Right: look stick. Middle: Gyro, Level.
  var css = document.createElement('style');
  css.textContent =
    '.wf-ctl,.wf-ctl *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;touch-action:none}' +
    '#wf-bar{position:fixed;z-index:15;display:none;left:calc(10px + env(safe-area-inset-left,0px));right:calc(10px + env(safe-area-inset-right,0px));' +
    'bottom:calc(8px + env(safe-area-inset-bottom,0px));height:auto;border-radius:36px;padding:14px 12px;box-sizing:border-box;' +
    'background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.06));-webkit-backdrop-filter:blur(26px) saturate(170%);backdrop-filter:blur(26px) saturate(170%);' +
    'border:1px solid rgba(255,255,255,.22);box-shadow:0 10px 40px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.28);' +
    'align-items:center;justify-content:space-between;gap:10px;transition:opacity .25s}' +
    'html.touch #wf-bar{display:flex}' +
    '#wf-bar svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}' +
    // movement pad: a glass disc with four chevron petals
    '#wf-dpad{position:relative;flex:0 0 auto;width:min(28vh,36vw,176px);height:min(28vh,36vw,176px);border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18)}' +
    '#wf-dpad b{position:absolute;width:38%;height:38%;border-radius:18px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.10);transition:background .1s,transform .1s}' +
    '#wf-dpad b.on{background:rgba(255,255,255,.38);transform:scale(.94)}' +
    '#wf-dpad .u{left:31%;top:4%}#wf-dpad .d{left:31%;bottom:4%}#wf-dpad .l{left:4%;top:31%}#wf-dpad .r{right:4%;top:31%}' +
    '#wf-dpad .c{position:absolute;left:41%;top:41%;width:18%;height:18%;border-radius:50%;border:2px solid rgba(255,255,255,.35)}' +
    // middle: tab-bar style icon buttons with tiny labels
    '#wf-top{display:flex;flex-direction:column;gap:10px;align-items:center}' +
    '#wf-top b{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:60px;padding:10px 8px;border-radius:22px;color:#fff;' +
    'font:600 11px -apple-system,system-ui,sans-serif;letter-spacing:.2px;background:transparent}' +
    '#wf-top b.sel{background:rgba(255,255,255,.18)}#wf-top b.on{background:rgba(255,255,255,.32)}' +
    // look stick: glass ring with a soft knob
    '#wf-stick{position:relative;flex:0 0 auto;width:min(28vh,36vw,176px);height:min(28vh,36vw,176px);border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18)}' +
    '#wf-stick i{position:absolute;left:50%;top:50%;width:40%;height:40%;margin:-20% 0 0 -20%;border-radius:50%;background:rgba(255,255,255,.30);' +
    'border:1px solid rgba(255,255,255,.55);box-shadow:0 4px 18px rgba(0,0,0,.35);pointer-events:none;display:flex;align-items:center;justify-content:center}' +
    '#wf-stick.on i{background:rgba(255,255,255,.5)}' +
    'body.reading .wf-ctl,body.wf-vr .wf-ctl{opacity:0;pointer-events:none}' +
    '.a-modal,.a-dialog{display:none!important}' +                    // no A-Frame motion-permission box: Gyro asks iOS directly
    'html.touch #controls-hint{bottom:auto!important;top:48px;width:min(92vw,calc(100vw - 40px));text-align:center;white-space:normal!important;left:50%!important;' +
    'color:#c8d4f0!important;font-size:10px!important;letter-spacing:1.5px!important;transition:opacity 1.2s}' +
    'html.touch #controls-hint.wf-gone{opacity:0}' +
    'html.mobile #hud{font-size:9px!important;letter-spacing:1.5px!important;padding:12px 14px!important}html.mobile #hud span{white-space:nowrap}' +
    '@media (max-width:480px){html.mobile #hud span:nth-child(2){display:none}}';
  document.head.appendChild(css);

  var ICON = {
    u: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>', d: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    l: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>', r: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    gyro: '<svg viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M3 9a9 9 0 0 0 0 6M21 9a9 9 0 0 1 0 6"/></svg>',
    level: '<svg viewBox="0 0 24 24"><path d="M3 12h18M12 4v4M10 6l2-2 2 2M12 20v-4M10 18l2 2 2-2"/></svg>',
    look: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg>'
  };
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
        var b = document.createElement('b'), pidB = null; b.className = d[0]; b.innerHTML = ICON[d[0]]; ctl(b); dpad.appendChild(b);
        function stop(e) { if (e && pidB !== null && e.pointerId !== undefined && e.pointerId !== pidB) return; pidB = null; heldDir[d[0]] = 0; b.classList.remove('on'); applyDir(); }
        b.addEventListener('pointerdown', function (e) {
          e.preventDefault(); if (pidB !== null) return; pidB = e.pointerId; try { b.setPointerCapture(pidB); } catch (err) {}
          heldDir[d[0]] = 1; b.classList.add('on'); applyDir();
        });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { b.addEventListener(n, stop); });
        b.addEventListener('touchend', function () { stop(); }); b.addEventListener('touchcancel', function () { stop(); });
        b._stop = stop;
      });
      var centre = document.createElement('span'); centre.className = 'c'; dpad.appendChild(centre);
      var bar = ctl(document.createElement('div')); bar.id = 'wf-bar'; document.body.appendChild(bar); bar.appendChild(dpad);

      // ── right thumb: look stick. Push left/right to turn, up/down to look; release stops turning and keeps the view ──
      var stick = ctl(document.createElement('div')), knob = document.createElement('i'), look = this.look = { x: 0, y: 0, level: false }, lpid = null;
      stick.id = 'wf-stick'; knob.innerHTML = ICON.look; stick.appendChild(knob);
      function lookUpdate(e) {
        var r = stick.getBoundingClientRect(), R = r.width / 2 - 10;
        var dx = (e.clientX - (r.left + r.width / 2)) / R, dy = (e.clientY - (r.top + r.height / 2)) / R, len = Math.sqrt(dx * dx + dy * dy);
        if (len > 1) { dx /= len; dy /= len; len = 1; }
        var span = r.width * 0.3; knob.style.transform = 'translate(' + (dx * span) + 'px,' + (dy * span) + 'px)';
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
      var gy = document.createElement('b'), lv = document.createElement('b'); gy.innerHTML = ICON.gyro + '<span>Gyro</span>'; lv.innerHTML = ICON.level + '<span>Level</span>'; ctl(gy); ctl(lv); top.appendChild(gy); top.appendChild(lv);
      bar.appendChild(top); bar.appendChild(stick);
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
      function setGyro(on) { self.gyro = on; gy.classList.toggle('sel', on); gy.querySelector('span').textContent = on ? 'Gyro on' : 'Gyro'; self.applyGyro(); }
      tap(gy, function () {
        if (self.gyro) return setGyro(false);
        var D = window.DeviceOrientationEvent;
        if (D && typeof D.requestPermission === 'function') {            // iOS: this call shows Apple's own permission prompt
          D.requestPermission().then(function (st) { if (st === 'granted') setGyro(true); }).catch(function () {});
        } else setGyro(true);
      });
      tap(lv, function () { look.level = true; });
      sc.addEventListener('loaded', function () { self.applyGyro(); });
      // never keep moving or turning if the page loses focus mid-press
      function releaseAll() { Array.prototype.forEach.call(dpad.children, function (b) { b._stop(); }); lookEnd(); }
      window.addEventListener('blur', releaseAll); document.addEventListener('visibilitychange', function () { if (document.hidden) releaseAll(); });

      // ── hint text ──
      var hint = document.getElementById('controls-hint');
      if (hint) {
        hint.textContent = 'LEFT PAD WALK · RIGHT STICK LOOK · GYRO / LEVEL IN THE MIDDLE · TAP GLOWING BUTTONS';
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
