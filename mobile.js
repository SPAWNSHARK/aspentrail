// SS Wayfarer — mobile support, shared by every room.
// Load AFTER aframe.min.js, then put  wayfarer-mobile  on the <a-scene>
// (optionally  wayfarer-mobile="radius: 10.2"  to keep the player inside a round room).
//
//  • window.WAYFARER = { touch, mobile }  — quality profile for pages to read
//  • analog joystick (bottom-left) walks; look stick (bottom-right) looks; Gyro (VR headset) + Level (spirit level) bottom-centre
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
  if (navigator.standalone || (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches))) root.classList.add('standalone');

  // ── controls (user, Nov 24 v3: "like it was in the beginning"): two floating thumbsticks in the bottom corners —
  //    left = walk (analog), right = look — plus two small round buttons (Gyro = VR headset, Level = spirit level).
  //    Real frosted glass: dark translucent fill, heavy backdrop blur + saturation, bright top-edge highlight, sheen.
  var GLASS = 'background:linear-gradient(140deg,rgba(255,255,255,.16),rgba(255,255,255,.03) 48%,rgba(255,255,255,.07)),rgba(22,22,28,.38);' +
    '-webkit-backdrop-filter:blur(22px) saturate(185%);backdrop-filter:blur(22px) saturate(185%);border:1px solid rgba(255,255,255,.24);' +
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.38),inset 0 -1px 0 rgba(255,255,255,.06),0 10px 30px rgba(0,0,0,.45);';
  var css = document.createElement('style');
  css.textContent =
    '.wf-ctl,.wf-ctl *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;touch-action:none}' +
    '#wf-joy,#wf-stick{position:fixed;z-index:15;display:none;transition:opacity .25s}' +
    'html.touch #wf-joy,html.touch #wf-stick{display:block}' +
    '#wf-joy,#wf-stick{bottom:calc(18px + env(safe-area-inset-bottom,0px));width:118px;height:118px;border-radius:50%;' + GLASS + '}' +
    '#wf-joy{left:calc(18px + env(safe-area-inset-left,0px))}#wf-stick{right:calc(18px + env(safe-area-inset-right,0px))}' +
    '#wf-joy i,#wf-stick i{position:absolute;left:50%;top:50%;width:50px;height:50px;margin:-25px 0 0 -25px;border-radius:50%;pointer-events:none;display:flex;align-items:center;justify-content:center;' +
    'background:linear-gradient(160deg,rgba(255,255,255,.5),rgba(255,255,255,.18));border:1px solid rgba(255,255,255,.6);box-shadow:0 4px 14px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.7)}' +
    '#wf-joy.on i,#wf-stick.on i{background:linear-gradient(160deg,rgba(255,255,255,.7),rgba(255,255,255,.32))}' +
    // the small buttons live in a slim Mac-style MENU BAR across the top (user, Nov 25): ship icon left, status-style icons right
    '#wf-btns{position:fixed;z-index:16;left:0;right:0;top:0;display:flex;align-items:center;justify-content:flex-end;gap:2px;box-sizing:border-box;' +
    'height:calc(30px + env(safe-area-inset-top,0px));padding:env(safe-area-inset-top,0px) calc(10px + env(safe-area-inset-right,0px)) 0 calc(10px + env(safe-area-inset-left,0px));' +
    'background:rgba(24,20,22,.42);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);border-bottom:1px solid rgba(255,255,255,.12);transition:opacity .25s}' +
    '#wf-btns:before{content:"";width:18px;height:18px;border-radius:5px;margin-right:auto;background:url(icons/icon-192.png?v=2) center/cover;box-shadow:0 0 0 1px rgba(255,255,255,.15)}' +
    '#wf-btns b{display:inline-flex;align-items:center;justify-content:center;width:34px;height:26px;border-radius:7px;cursor:pointer;background:none;border:none;box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none}' +
    '#wf-btns b svg{width:18px!important;height:18px!important}' +
    '#wf-btns b.sel{background:rgba(255,180,90,.35)}#wf-btns b.on,#wf-btns b:active{background:rgba(255,255,255,.22)}' +
    '.wf-ctl svg{width:24px;height:24px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}' +
    '#wf-joy svg,#wf-stick svg{width:20px;height:20px;stroke:rgba(20,20,26,.75);color:rgba(20,20,26,.75)}' +
    '#hud,#controls-hint,#hint-shoot{display:none!important}' +                 // no labels across the screen (user)
    'body.reading .wf-ctl,body.wf-vr .wf-ctl{opacity:0;pointer-events:none}' +
    'body.wf-seated #wf-joy,body.wf-cine .wf-ctl{opacity:0;pointer-events:none}' +
    '.a-modal,.a-dialog{display:none!important}';                         // no A-Frame motion-permission box: Gyro asks iOS directly
  document.head.appendChild(css);

  var ICON = {
    gyro: '<svg viewBox="0 0 24 24"><path d="M3.5 8h17a1.5 1.5 0 0 1 1.5 1.5v5a2.5 2.5 0 0 1-2.5 2.5h-3.6l-1.8-2.6a1.3 1.3 0 0 0-2.2 0L10.1 17H6.5A2.5 2.5 0 0 1 4 14.5v0A1.5 1.5 0 0 1 2 13v-3.5A1.5 1.5 0 0 1 3.5 8z"/><path d="M6.5 8l1.2-2.5h8.6L17.5 8"/><circle cx="7.6" cy="12.2" r="1.6"/><circle cx="16.4" cy="12.2" r="1.6"/></svg>',   // VR headset
    level: '<svg viewBox="0 0 24 24"><rect x="1.5" y="8" width="21" height="8" rx="1.6"/><rect x="8.5" y="10.2" width="7" height="3.6" rx="1.8"/><circle cx="12" cy="12" r="0.9" fill="#fff"/><path d="M10.6 10.2v3.6M13.4 10.2v3.6M4.5 8v2M19.5 8v2"/></svg>',   // spirit level
    walk: '<svg viewBox="0 0 24 24"><path d="M12 4l3 3H9zM12 20l3-3H9zM4 12l3-3v6zM20 12l-3-3v6z" fill="currentColor"/></svg>',
    look: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg>'
  };
  // point-in-polygon + push back inside by `pad` (returns null when already fine). Shared with avatar.js via WAYFARER.clampPoly.
  function clampPoly(B, x, z, pad) {
    var inside = false, best = 1e9, bx = 0, bz = 0, nx = 0, nz = 0;
    for (var i = 0, j = B.length - 1; i < B.length; j = i++) {
      var xi = B[i][0], zi = B[i][1], xj = B[j][0], zj = B[j][1];
      if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) inside = !inside;
      var ex = xi - xj, ez = zi - zj, L = ex * ex + ez * ez || 1, t = Math.max(0, Math.min(1, ((x - xj) * ex + (z - zj) * ez) / L)), px = xj + ex * t, pz = zj + ez * t, d = Math.hypot(x - px, z - pz);
      if (d < best) { best = d; bx = px; bz = pz; var l = Math.sqrt(L); nx = -ez / l; nz = ex / l; }
    }
    if (inside && best >= pad) return null;
    var cx = 0, cz = 0; B.forEach(function (q) { cx += q[0]; cz += q[1]; }); cx /= B.length; cz /= B.length;
    if (nx * (cx - bx) + nz * (cz - bz) < 0) { nx = -nx; nz = -nz; }            // normal pointing into the room
    return [bx + nx * pad, bz + nz * pad];
  }
  window.WAYFARER.clampPoly = clampPoly;
  function menuBar() {
    var b = document.getElementById('wf-btns'); if (b) return b;
    b = document.createElement('div'); b.id = 'wf-btns'; b.className = 'wf-ctl';
    ['contextmenu', 'selectstart', 'dragstart'].forEach(function (n) { b.addEventListener(n, function (e) { e.preventDefault(); }); });
    (document.body || document.documentElement).appendChild(b); return b;
  }
  AFRAME.registerComponent('wayfarer-mobile', {
    schema: { speed: { default: 2.6 }, radius: { default: 0 }, collide: { default: true } },

    init: function () {
      var self = this, sc = this.el;
      this.vec = { x: 0, y: 0 };
      this.dir = new AFRAME.THREE.Vector3();
      this.wp = new AFRAME.THREE.Vector3();
      this.mover = null;
      if (!touch) menuBar();
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

      // ── left thumb: analog joystick. Push = walk that way (speed grows with the push); release = stop at once ──
      var joy = ctl(document.createElement('div')), jk = document.createElement('i'), jpid = null; joy.id = 'wf-joy'; jk.innerHTML = ICON.walk; joy.appendChild(jk); document.body.appendChild(joy);
      function joyUpdate(e) {
        var r = joy.getBoundingClientRect(), R = r.width / 2 - 8;
        var dx = (e.clientX - (r.left + r.width / 2)) / R, dy = (e.clientY - (r.top + r.height / 2)) / R, len = Math.sqrt(dx * dx + dy * dy);
        if (len > 1) { dx /= len; dy /= len; len = 1; }
        jk.style.transform = 'translate(' + (dx * r.width * 0.3) + 'px,' + (dy * r.width * 0.3) + 'px)';
        if (len < 0.12) { self.vec.x = 0; self.vec.y = 0; return; }
        self.vec.x = dx; self.vec.y = -dy;
      }
      function joyEnd(e) { if (e && e.pointerId !== undefined && jpid !== null && e.pointerId !== jpid) return; jpid = null; self.vec.x = 0; self.vec.y = 0; jk.style.transform = ''; joy.classList.remove('on'); }
      joy.addEventListener('pointerdown', function (e) { e.preventDefault(); if (jpid !== null) return; jpid = e.pointerId; try { joy.setPointerCapture(jpid); } catch (err) {} joy.classList.add('on'); joyUpdate(e); });
      joy.addEventListener('pointermove', function (e) { if (e.pointerId === jpid) joyUpdate(e); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { joy.addEventListener(n, joyEnd); });
      joy.addEventListener('touchend', function () { joyEnd(); }); joy.addEventListener('touchcancel', function () { joyEnd(); });

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

      // ── bottom centre: Gyro and Level. They fire only on a deliberate tap (press and release on the same button) ──
      var top = menuBar(); document.body.appendChild(stick);
      var gy = document.createElement('b'), lv = document.createElement('b'); gy.innerHTML = ICON.gyro; lv.innerHTML = ICON.level; gy.setAttribute('aria-label', 'Gyro'); lv.setAttribute('aria-label', 'Level'); ctl(gy); ctl(lv); top.appendChild(gy); top.appendChild(lv);
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
      function setGyro(on) { self.gyro = on; gy.classList.toggle('sel', on); self.applyGyro(); }
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
      function releaseAll() { joyEnd(); lookEnd(); }
      window.addEventListener('blur', releaseAll); document.addEventListener('visibilitychange', function () { if (document.hidden) releaseAll(); });

      // ── hint text ──
      var hint = document.getElementById('controls-hint');
      if (hint) {
        hint.remove();
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

    // ── furniture collision (user, Nov 25: "you can run straight into couches, chairs, robots"): scan the room for solid
    //    things at body height and keep the player's 0.28 m circle out of their footprints (axis-aligned boxes in XZ).
    //    Skipped: floors/rugs/steps (top < 0.45 m), ceiling fittings (bottom > 1.4 m), walls/shells (footprint > 12 m²), invisible hit
    //    targets, points/sprites/lines, instanced books, doorways (userData.noCollide) and the player rig. Rescanned while
    //    GLB props stream in. Only resolves while you're moving, so a seat you land in never shoves you.
    scanSolids: function () {
      var T = AFRAME.THREE, sc = this.el, rig = this.mover && this.mover.parentNode && this.mover.parentNode.object3D, out = [], bb = new T.Box3();
      function skip(o) { for (var q = o; q; q = q.parent) { if (q.userData && q.userData.noCollide) return true; if (rig && q === rig) return true; if (q.el && q.el.classList && q.el.classList.contains('no-collide')) return true; } return false; }
      sc.object3D.updateMatrixWorld(true);
      sc.object3D.traverse(function (o) {
        if (!o.isMesh || o.isInstancedMesh || !o.visible || !o.geometry) return;
        var m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || (m.transparent && m.opacity < 0.15) || m.visible === false) return;
        for (var q = o; q; q = q.parent) if (q.visible === false) return;
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
        var w = bb.max.x - bb.min.x, d = bb.max.z - bb.min.z;
        if (bb.max.y < 0.45 || bb.min.y > 1.4 || w * d > 12 || w > 7 || d > 7 || w * d < 0.0004) return;
        if (skip(o)) return;
        out.push([bb.min.x, bb.min.z, bb.max.x, bb.max.z]);
      });
      this.solids = out.concat(window.WAYFARER.extraSolids || []);   // pages can add footprint boxes (Hiveport walls/props from layout.json)
    },
    collide: function (m, lp) {
      var S = (this.data.collide && this.solids) || [], DS = window.WAYFARER.dynSolids;
      if (DS && DS.length) S = S.concat(DS);                 /* droids + cats: 5th entry = crew id, reported to WAYFARER.crewBump */
      if (!S.length) return;
      var T = AFRAME.THREE, wp = this._cw || (this._cw = new T.Vector3()); m.getWorldPosition(wp);
      var R = 0.28, px = wp.x - (m.position.x - lp.x), pz = wp.z - (m.position.z - lp.z);   // where we were last frame (world)
      var tx = wp.x, tz = wp.z, n = Math.max(1, Math.ceil(Math.hypot(tx - px, tz - pz) / 0.08)), x = px, z = pz;
      for (var k = 1; k <= n; k++) {                         // sub-steps: a fast move can't hop over a thin sofa segment
        var ox = x, oz = z; x = px + (tx - px) * k / n; z = pz + (tz - pz) * k / n;
        for (var pass = 0; pass < 3; pass++) for (var i = 0; i < S.length; i++) {
          var b = S[i], x0 = b[0] - R, z0 = b[1] - R, x1 = b[2] + R, z1 = b[3] + R;
          if (x <= x0 || x >= x1 || z <= z0 || z >= z1) continue;
          if (b[4] && window.WAYFARER.crewBump) window.WAYFARER.crewBump(b[4]);
          // push back out through the side we came in by (slides along the face); fall back to the shallowest side
          if (ox <= x0) x = x0; else if (ox >= x1) x = x1; else if (oz <= z0) z = z0; else if (oz >= z1) z = z1;
          else { var dl = x - x0, dr = x1 - x, dn = z - z0, df = z1 - z, mn = Math.min(dl, dr, dn, df); if (mn === dl) x = x0; else if (mn === dr) x = x1; else if (mn === dn) z = z0; else z = z1; }
        }
      }
      m.position.x += x - wp.x; m.position.z += z - wp.z;
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
      if ((v.x || v.y) && !window.WAYFARER.frozen) {   // frozen = seated in the command chair / a cut scene
        var cam = this.el.camera;
        if (cam) {
          cam.getWorldDirection(this.dir);
          var fx = this.dir.x, fz = this.dir.z, l = Math.sqrt(fx * fx + fz * fz) || 1;
          fx /= l; fz /= l;
          m.position.x += (fx * v.y - fz * v.x) * this.data.speed * s;
          m.position.z += (fz * v.y + fx * v.x) * this.data.speed * s;
        }
      }
      if (this.data.collide || window.WAYFARER.dynSolids) {    /* dynSolids = the living crew (crew.js), even in the corridor */
        if (!this.scanAt) { this.scanAt = t + 1500; this.scans = 0; }
        if (this.data.collide && t > this.scanAt && this.scans < 8) { this.scanSolids(); this.scans++; this.scanAt = t + 2000; }   // props stream in for a while
        var lp = this._lp || (this._lp = new AFRAME.THREE.Vector3(1e9, 0, 0));
        if (!window.WAYFARER.frozen && lp.x < 1e8 && Math.abs(m.position.x - lp.x) + Math.abs(m.position.z - lp.z) > 1e-5) this.collide(m, lp);   // only while moving
        lp.copy(m.position);
      }
      var B = window.WAYFARER && window.WAYFARER.bounds;
      if (window.WAYFARER.frozen) {} else if (B && B.length > 2) {                              // a shaped room (the Bridge's guitar pick): stay 0.35 m inside its outline
        m.getWorldPosition(this.wp); var q = clampPoly(B, this.wp.x, this.wp.z, 0.35);
        if (q) { m.position.x += q[0] - this.wp.x; m.position.z += q[1] - this.wp.z; }
      } else if (this.data.radius > 0) {                    // keep keyboard + stick inside the room
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
