// SS Wayfarer — SHIP REPAIRS (user, Nov 26: "Forge reports faults around the ship; you fix them with a quick minigame").
// Load after crew.js on every room page. Faults live in localStorage 'wf-faults' (max 3, one new every 5–11 minutes of play,
// schedule 'wf-fault-next'): a floor service hatch with its lid up — sparking conduit (amber sparks), coolant leak (teal vapour)
// or power relay (flickering violet) — on a free crew-graph node of some room. Forge announces new ones, the deck map/ship log
// lists them, the droids' "status" line reports them. Tap a hatch within 3.5 m → CIRCUIT TRACE: tap the numbered nodes in order
// before the bar runs out (5–7 nodes). Fixed = +80 cr, WF_LIFE 'fix'. Wrong order = start again; timeout = try again later.
(function () {
  if (!window.AFRAME || /[?&]capture/.test(location.search)) return;
  var THREE = AFRAME.THREE, W = window.WAYFARER = window.WAYFARER || {};
  var FILE = (location.pathname.split('/').pop() || 'index.html');
  var PAGE = { '': 'corridor', 'index.html': 'corridor', 'bridge.html': 'bridge', 'holodeck.html': 'holodeck', 'lounge.html': 'lounge', 'media.html': 'media', 'library.html': 'library' }[FILE];
  if (!PAGE) return;
  var OFF = { corridor: 0, bridge: 1, holodeck: 2, lounge: 3, media: 4, library: 5 };
  var KINDS = { spark: { name: 'sparking conduit', col: 0xffa040 }, coolant: { name: 'coolant leak', col: 0x40e8d8 }, relay: { name: 'failing power relay', col: 0xb070ff } };
  var NAMES = { corridor: 'the corridor', bridge: 'the Bridge', holodeck: 'the Holodeck', lounge: 'the Crew Lounge', media: 'the Media Nexus', library: 'the Library' };
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function faults() { return load('wf-faults', []); }
  function say(t) { if (window.WF_LIFE) WF_LIFE.toast(t); }

  function spawn() {
    var L = W.crewLayout; if (!L) return null;
    var list = faults(); if (list.length >= 3) return null;
    var cand = Object.keys(L.nodes).filter(function (id) { return !/_seat|_work|_door|_out|_visit|^c_(bd|ld|hd|lo|me)$|^c_b$|^c_l$/.test(id) && !list.some(function (f) { return f.node === id; }); });
    var id = cand[Math.floor(Math.random() * cand.length)], nd = L.nodes[id], kinds = Object.keys(KINDS), k = kinds[Math.floor(Math.random() * kinds.length)];
    var a = Math.random() * Math.PI * 2, f = { id: 'f' + Date.now(), node: id, room: nd.room, x: nd.lx + Math.cos(a) * 0.45, z: nd.lz + Math.sin(a) * 0.45, kind: k, born: Date.now() };
    if (nd.room === 'corridor') f.x = Math.max(-1.6, Math.min(1.6, f.x));
    list.push(f); save('wf-faults', list);
    say('Forge: "Captain, a ' + KINDS[k].name + ' in ' + NAMES[nd.room] + '. Could you take a look?"');
    if (window.WF_SOUND && !WF_SOUND.muted()) WF_SOUND.droid('negative', 0, 0.8);
    return f;
  }
  function setStatus() {
    var e = W.crew && W.crew.engine; if (!e) return; var list = faults();
    e.ship.fault = list.length ? list.length + ' open (' + list.map(function (f) { return KINDS[f.kind].name + ' in ' + NAMES[f.room]; }).join('; ') + ')' : null;
  }

  // ── visuals for the faults in THIS room ──
  var shown = {}, root = null, TEX = null;
  function dotTex() { if (TEX) return TEX; var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); TEX = new THREE.CanvasTexture(c); return TEX; }
  function hatch(f, sc) {
    var g = new THREE.Group(), K = KINDS[f.kind], cu = new THREE.MeshStandardMaterial({ color: 0xa8743c, metalness: 0.85, roughness: 0.35 }), dk = new THREE.MeshStandardMaterial({ color: 0x15110e, roughness: 0.8 });
    g.position.set(f.x, 0, f.z); g.userData.noCollide = true;
    var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.04, 8), cu); rim.position.y = 0.02; g.add(rim);
    var hole = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.045, 8), dk); hole.position.y = 0.022; g.add(hole);
    var lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.025, 8), cu); lid.position.set(0, 0.2, -0.3); lid.rotation.x = -1.2; g.add(lid);
    var glow = new THREE.Mesh(new THREE.CircleGeometry(0.26, 16), new THREE.MeshBasicMaterial({ color: K.col, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.05; g.add(glow);
    var light = new THREE.PointLight(K.col, 0.8, 4, 2); light.position.y = 0.4; g.add(light);
    var parts = []; for (var i = 0; i < 14; i++) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: K.col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); s.scale.setScalar(0.05); g.add(s); parts.push({ s: s, t: Math.random(), v: new THREE.Vector3() }); }
    sc.object3D.add(g);
    var hit = document.createElement('a-entity'); hit.setAttribute('class', 'interactive clickable');
    hit.setObject3D('mesh', new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })));
    hit.object3D.position.set(f.x, 0.45, f.z); hit.object3D.userData.noCollide = true; hit.addEventListener('click', function () { tryFix(f.id); }); sc.appendChild(hit);
    return { g: g, hit: hit, glow: glow, light: light, parts: parts, kind: f.kind, x: f.x, z: f.z };
  }
  function sync(sc) {
    var list = faults().filter(function (f) { return f.room === PAGE; }), ids = {};
    list.forEach(function (f) { ids[f.id] = 1; if (!shown[f.id]) shown[f.id] = hatch(f, sc); });
    Object.keys(shown).forEach(function (id) { if (!ids[id]) { shown[id].g.removeFromParent(); shown[id].hit.parentNode && shown[id].hit.parentNode.removeChild(shown[id].hit); delete shown[id]; } });
  }
  function animate(dt, s, sc) {
    var cam = sc.camera, cp = new THREE.Vector3(); if (cam) cam.getWorldPosition(cp);
    Object.keys(shown).forEach(function (id) { var H = shown[id];
      H.light.intensity = H.kind === 'relay' ? (Math.random() < 0.15 ? 0.1 : 1.1) : 0.6 + Math.random() * 0.5; H.glow.material.opacity = 0.4 + 0.4 * H.light.intensity;
      H.parts.forEach(function (p) {
        p.t += dt * (H.kind === 'coolant' ? 0.5 : 1.6);
        if (p.t > 1) { p.t = 0; p.v.set((Math.random() - 0.5) * (H.kind === 'spark' ? 1.6 : 0.3), H.kind === 'spark' ? 1.2 + Math.random() : 0.5 + Math.random() * 0.3, (Math.random() - 0.5) * (H.kind === 'spark' ? 1.6 : 0.3)); }
        var t = p.t; p.s.position.set(p.v.x * t, 0.05 + p.v.y * t - (H.kind === 'spark' ? 2.2 * t * t : 0), p.v.z * t);
        p.s.scale.setScalar(H.kind === 'coolant' ? 0.12 + t * 0.45 : 0.045); p.s.material.opacity = (1 - t) * (H.kind === 'coolant' ? 0.35 : 1);
      });
      if (H.kind === 'spark' && Math.random() < dt * 1.2 && window.WF_SOUND && !WF_SOUND.muted()) { var d = Math.hypot(cp.x - H.x, cp.z - H.z); if (d < 10) WF_SOUND.zap(0, 0.7 / (1 + d / 3)); }
    });
  }

  // ── CIRCUIT TRACE minigame ──
  var game = null;
  var css = document.createElement('style');
  css.textContent = '#wf-fix{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:66;display:none;width:min(92vw,380px);padding:14px;border-radius:22px;box-sizing:border-box;text-align:center;' +
    'background:linear-gradient(140deg,rgba(255,255,255,.13),rgba(255,255,255,.03)),rgba(10,18,22,.72);-webkit-backdrop-filter:blur(22px) saturate(185%);backdrop-filter:blur(22px) saturate(185%);border:1px solid rgba(120,230,255,.3);color:#fff;font:600 13px -apple-system,system-ui,sans-serif}' +
    '#wf-fix h3{margin:0 0 4px;font:800 12px -apple-system,system-ui,sans-serif;letter-spacing:3px;color:#8fe8ff}#wf-fix p{margin:0 0 8px;color:#cfe6ee;font-size:12px}#wf-fix canvas{width:100%;aspect-ratio:1;border-radius:14px;background:rgba(0,0,0,.35);touch-action:none}' +
    '#wf-fix i{display:block;height:5px;border-radius:3px;background:rgba(255,255,255,.12);margin:8px 0;overflow:hidden}#wf-fix i u{display:block;height:100%;background:linear-gradient(90deg,#40e8d8,#ffe08a)}#wf-fix button{margin-top:4px;padding:8px 18px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:none;color:#ddd;font:700 12px -apple-system,system-ui,sans-serif}';
  document.head.appendChild(css);
  function tryFix(id) {
    var f = faults().filter(function (q) { return q.id === id; })[0], sc = document.querySelector('a-scene'); if (!f || game) return;
    var cp = new THREE.Vector3(); sc.camera.el.object3D.getWorldPosition(cp);
    if (Math.hypot(cp.x - f.x, cp.z - f.z) > 3.5) { say('Walk up to the ' + KINDS[f.kind].name + ' to fix it'); return; }
    var box = document.getElementById('wf-fix');
    if (!box) { box = document.createElement('div'); box.id = 'wf-fix'; box.innerHTML = '<h3>CIRCUIT TRACE</h3><p></p><canvas width="600" height="600"></canvas><i><u></u></i><button>Leave it</button>'; document.body.appendChild(box);
      ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach(function (n) { box.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); });
      box.querySelector('button').onclick = function () { end(false, true); };
      box.querySelector('canvas').addEventListener('pointerdown', function (e) { pick(e); }); }
    var N = 5 + Math.min(2, Math.floor(Math.random() * 3)), pts = [], tries = 0;
    while (pts.length < N && tries++ < 500) { var p = [70 + Math.random() * 460, 70 + Math.random() * 460]; if (pts.every(function (q) { return Math.hypot(q[0] - p[0], q[1] - p[1]) > 120; })) pts.push(p); }
    game = { f: f, pts: pts, next: 0, t: 0, dur: 6 + N * 1.6, box: box, cv: box.querySelector('canvas'), err: 0 };
    box.querySelector('p').textContent = 'Reroute the ' + KINDS[f.kind].name + ': tap the nodes 1 → ' + N + ' in order.';
    box.style.display = 'block'; document.body.classList.add('reading'); W.frozen = true; draw();
  }
  function pick(e) {
    if (!game) return; var r = game.cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 600, y = (e.clientY - r.top) / r.height * 600;
    var i = -1; game.pts.forEach(function (p, k) { if (Math.hypot(p[0] - x, p[1] - y) < 46) i = k; }); if (i < 0) return;
    if (i === game.next) { game.next++; if (window.WF_SOUND) WF_SOUND.droid('affirm', 0, 0.4); if (game.next >= game.pts.length) { end(true); return; } }
    else if (i >= game.next) { game.next = 0; game.err = 0.4; if (window.WF_SOUND) WF_SOUND.zap(0, 0.9); }
    draw();
  }
  function draw() {
    var x = game.cv.getContext('2d'), P = game.pts, K = KINDS[game.f.kind], col = '#' + K.col.toString(16).padStart(6, '0');
    x.clearRect(0, 0, 600, 600); x.lineWidth = 2; x.strokeStyle = 'rgba(140,230,255,.12)';
    for (var g = 0; g <= 600; g += 50) { x.beginPath(); x.moveTo(g, 0); x.lineTo(g, 600); x.moveTo(0, g); x.lineTo(600, g); x.stroke(); }
    x.lineWidth = 8; x.strokeStyle = col; x.shadowColor = col; x.shadowBlur = 18; x.beginPath();
    for (var i = 0; i < game.next; i++) x[i ? 'lineTo' : 'moveTo'](P[i][0], P[i][1]); x.stroke(); x.shadowBlur = 0;
    P.forEach(function (p, k) { x.beginPath(); x.arc(p[0], p[1], 34, 0, Math.PI * 2); x.fillStyle = k < game.next ? col : game.err > 0 ? 'rgba(255,80,60,.5)' : 'rgba(255,255,255,.1)'; x.fill(); x.lineWidth = 3; x.strokeStyle = k === game.next ? '#fff' : 'rgba(255,255,255,.4)'; x.stroke();
      x.fillStyle = k < game.next ? '#081014' : '#fff'; x.font = '800 30px -apple-system, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(k + 1, p[0], p[1] + 1); });
  }
  function end(ok, quit) {
    var G = game; if (!G) return; game = null; G.box.style.display = 'none'; document.body.classList.remove('reading'); W.frozen = false;
    if (ok) { save('wf-faults', faults().filter(function (f) { return f.id !== G.f.id; })); if (window.WF_SOUND) WF_SOUND.chime(true);
      if (window.WF_LIFE) { WF_LIFE.add(80, 'Repaired the ' + KINDS[G.f.kind].name); WF_LIFE.event('fix'); } say('Forge: "Nicely done, Captain. ' + (faults().length ? faults().length + ' fault' + (faults().length > 1 ? 's' : '') + ' still open."' : 'All systems nominal."')); }
    else if (!quit) { if (window.WF_SOUND) WF_SOUND.chime(false); say('The relay tripped — try again'); }
    setStatus();
  }

  AFRAME.registerComponent('wf-repairs', {
    init: function () { this.lastSync = 0; this.lastSched = 0; },
    tick: function (t, dtm) {
      var dt = Math.min(dtm || 16, 100) / 1000, sc = this.el;
      if (t - this.lastSched > 5000) { this.lastSched = t;                 // one new fault every 5–11 minutes you spend aboard
        var nx = load('wf-fault-next', 0), now = Date.now();
        if (!nx || nx - now > 11 * 60000) { save('wf-fault-next', now + (1 + Math.random() * 2) * 60000); }
        else if (now > nx) { spawn(); save('wf-fault-next', now + (5 + Math.random() * 6) * 60000); }
        setStatus();
      }
      if (t - this.lastSync > 1000) { this.lastSync = t; sync(sc); }
      animate(dt, t / 1000, sc);
      if (game) { game.t += dt; if (game.err > 0) { game.err -= dt; if (game.err <= 0) draw(); } var u = game.box.querySelector('u'); u.style.width = Math.max(0, 100 - game.t / game.dur * 100) + '%'; if (game.t > game.dur) end(false); }
    }
  });
  if (window.WF_LIFE) WF_LIFE.addGoals('repairs', [{ id: 'fix1', text: 'Fix a ship fault Forge reports', ev: 'fix', n: 1 }]);
  W.repairs = { faults: faults, spawn: spawn, NAMES: NAMES, KINDS: KINDS };
  function attach() { var sc = document.querySelector('a-scene'); if (sc && !sc.hasAttribute('wf-repairs')) sc.setAttribute('wf-repairs', ''); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
}());
