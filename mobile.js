// SS Wayfarer — mobile support, shared by every room.
// Load AFTER aframe.min.js, then put  wayfarer-mobile  on the <a-scene>
// (optionally  wayfarer-mobile="radius: 10.2"  to keep the player inside a round room).
//
//  • window.WAYFARER = { touch, mobile }  — quality profile for pages to read
//  • on-screen joystick (bottom-left) that walks the player; drag anywhere else to look
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
    '#wf-joy{position:fixed;left:calc(20px + env(safe-area-inset-left,0px));bottom:calc(24px + env(safe-area-inset-bottom,0px));' +
    'width:128px;height:128px;border-radius:50%;border:1px solid rgba(136,170,255,.38);' +
    'background:radial-gradient(circle,rgba(20,30,60,.30),rgba(2,4,12,.50));z-index:15;touch-action:none;' +
    '-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;display:none;transition:opacity .25s}' +
    'html.touch #wf-joy{display:block}' +
    '#wf-joy i{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;' +
    'background:rgba(136,170,255,.26);border:1px solid rgba(170,200,255,.65);box-shadow:0 0 14px rgba(60,120,255,.35);pointer-events:none}' +
    'body.reading #wf-joy,body.wf-vr #wf-joy{opacity:0;pointer-events:none}' +
    'html.touch #controls-hint{bottom:auto!important;top:48px;width:92vw;text-align:center;white-space:normal!important;' +
    'color:#5878b8!important;font-size:10px!important;letter-spacing:1.5px!important;transition:opacity 1.2s}' +
    'html.touch #controls-hint.wf-gone{opacity:0}' +
    '#wf-pad{position:fixed;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(24px + env(safe-area-inset-bottom,0px));' +
    'width:132px;height:132px;z-index:15;display:none;touch-action:none;-webkit-user-select:none;user-select:none;transition:opacity .25s}' +
    'html.touch #wf-pad{display:block}' +
    '#wf-pad b{position:absolute;width:44px;height:44px;border-radius:50%;border:1px solid rgba(136,170,255,.38);' +
    'background:rgba(8,14,34,.55);color:#9ab8ff;font:600 16px/42px system-ui,sans-serif;text-align:center;touch-action:none}' +
    '#wf-pad b.on{background:rgba(136,170,255,.35)}' +
    '#wf-pad .u{left:44px;top:0}#wf-pad .d{left:44px;bottom:0}#wf-pad .l{left:0;top:44px}#wf-pad .r{right:0;top:44px}' +
    '#wf-pad .c{left:44px;top:44px;font-size:11px}' +
    '#wf-gyro{position:fixed;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(164px + env(safe-area-inset-bottom,0px));z-index:15;' +
    'display:none;padding:6px 10px;border-radius:14px;border:1px solid rgba(136,170,255,.38);background:rgba(8,14,34,.55);' +
    'color:#9ab8ff;font:600 10px system-ui,sans-serif;letter-spacing:1.5px;touch-action:none}' +
    'html.touch #wf-gyro{display:block}' +
    'body.reading #wf-pad,body.wf-vr #wf-pad,body.reading #wf-gyro,body.wf-vr #wf-gyro{opacity:0;pointer-events:none}';
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

      // ── joystick ──
      var joy = document.createElement('div'), thumb = document.createElement('i'), pid = null;
      joy.id = 'wf-joy'; joy.appendChild(thumb); document.body.appendChild(joy);
      function update(e) {
        var r = joy.getBoundingClientRect(), R = r.width / 2 - 10;
        var dx = (e.clientX - (r.left + r.width / 2)) / R, dy = (e.clientY - (r.top + r.height / 2)) / R;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len > 1) { dx /= len; dy /= len; len = 1; }
        thumb.style.transform = 'translate(' + (dx * 38) + 'px,' + (dy * 38) + 'px)';
        if (len < 0.14) { self.vec.x = 0; self.vec.y = 0; return; }
        var mag = Math.pow(len, 1.4) / len;               // finer control near the centre
        self.vec.x = dx * mag; self.vec.y = -dy * mag;
      }
      function end(e) {
        if (e.pointerId !== pid) return;
        pid = null; self.vec.x = 0; self.vec.y = 0; thumb.style.transform = '';
      }
      joy.addEventListener('pointerdown', function (e) {
        if (pid !== null) return; pid = e.pointerId;
        try { joy.setPointerCapture(pid); } catch (err) {}
        e.preventDefault(); update(e);
      });
      joy.addEventListener('pointermove', function (e) { if (e.pointerId === pid) update(e); });
      joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
      joy.addEventListener('contextmenu', function (e) { e.preventDefault(); });

      // ── look pad (right thumb): look without tilting your neck or the phone ──
      var pad = document.createElement('div'), look = this.look = { x: 0, y: 0, level: false };
      pad.id = 'wf-pad';
      [['u', '\u25B2', 0, 1], ['d', '\u25BC', 0, -1], ['l', '\u25C0', 1, 0], ['r', '\u25B6', -1, 0], ['c', 'LEVEL', 0, 0]].forEach(function (d) {
        var b = document.createElement('b'); b.className = d[0]; b.textContent = d[1]; pad.appendChild(b);
        var held = null;
        b.addEventListener('pointerdown', function (e) {
          held = e.pointerId; try { b.setPointerCapture(held); } catch (err) {}
          e.preventDefault(); b.classList.add('on');
          if (d[0] === 'c') look.level = true; else { look.x = d[2]; look.y = d[3]; look.level = false; }
        });
        function up(e) { if (e.pointerId !== held) return; held = null; b.classList.remove('on'); if (d[0] !== 'c') { look.x = 0; look.y = 0; } }
        b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
      });
      document.body.appendChild(pad);
      var gy = document.createElement('div'); gy.id = 'wf-gyro'; gy.textContent = 'GYRO OFF'; document.body.appendChild(gy);
      this.gyro = false;
      gy.addEventListener('pointerdown', function (e) {
        e.preventDefault(); self.gyro = !self.gyro; gy.textContent = self.gyro ? 'GYRO ON' : 'GYRO OFF'; self.applyGyro();
      });
      sc.addEventListener('loaded', function () { self.applyGyro(); });

      // ── hint text ──
      var hint = document.getElementById('controls-hint');
      if (hint) {
        hint.textContent = 'LEFT STICK MOVE · RIGHT ARROWS LOOK · DRAG ANYWHERE TO LOOK · TAP TO INTERACT';
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
