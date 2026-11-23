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
      if (!touch) return;

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

      // ── hint text ──
      var hint = document.getElementById('controls-hint');
      if (hint) {
        hint.textContent = 'DRAG TO LOOK · LEFT STICK TO MOVE · TAP TO INTERACT';
        setTimeout(function () { hint.classList.add('wf-gone'); }, 9000);
      }

      // ── tap-to-interact + VR-only gaze reticle ──
      function wire() {
        var cur = sc.querySelector('a-cursor');
        var objs = cur && cur.getAttribute('raycaster') && cur.getAttribute('raycaster').objects;
        sc.setAttribute('raycaster', { objects: objs || '.clickable, .interactive', far: 60 });
        sc.setAttribute('cursor', { rayOrigin: 'mouse', fuse: false });
        if (cur) { cur.setAttribute('visible', false); cur.setAttribute('cursor', 'fuse', false); }
        sc.addEventListener('enter-vr', function () {
          document.body.classList.add('wf-vr');
          if (cur) { cur.setAttribute('visible', true); cur.setAttribute('cursor', 'fuse', true); }
        });
        sc.addEventListener('exit-vr', function () {
          document.body.classList.remove('wf-vr');
          if (cur) { cur.setAttribute('visible', false); cur.setAttribute('cursor', 'fuse', false); }
        });
      }
      if (sc.hasLoaded) wire(); else sc.addEventListener('loaded', wire);
    },

    tick: function (t, dt) {
      if (this.el.is('vr-mode')) return;
      if (!this.mover) {
        this.mover = this.el.querySelector('[wasd-controls]');
        if (!this.mover) return;
      }
      var m = this.mover.object3D, s = Math.min(dt, 50) / 1000, v = this.vec;
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
