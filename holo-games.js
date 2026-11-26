// SS Wayfarer — HOLODECK GAMES (user, Nov 26). Three programs in the SIM LIBRARY, all blue-violet hologram light (style guide):
//   TARGET RANGE — 45 s; holo orbs drift round the room; tap them. Violet 10 · gold (fast, small) 50 · red decoys −20; combo ×2 after 5.
//   QUICK DRAW   — a holographic K'Vetar duellist (hiveport performer GLB). Wait for DRAW!, tap first. Best of 5; jumping the gun = foul.
//   HOLO GOLF    — 3 holes on the deck. Face where you want to putt, HOLD to charge (power swings), RELEASE to putt. Fewest strokes.
// WF_HOLO_GAMES.launch('range'|'duel'|'golf') / .close(). Bests in localStorage 'wf-holo-best'; pays credits; WF_LIFE 'win:<game>'.
(function () {
  if (!window.AFRAME) return;
  var THREE = AFRAME.THREE, sc, cam, G = null, root = null, ray = new THREE.Raycaster(), V = new THREE.Vector2(), DOT = null;
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function best() { return load('wf-holo-best', {}); }
  function dot() { if (DOT) return DOT; var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); DOT = new THREE.CanvasTexture(c); return DOT; }
  function glowMat(col, op) { return new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op == null ? 0.85 : op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }); }
  function sfx(k) { var S = window.WF_SOUND; if (!S || S.muted()) return; if (k === 'hit') S.droid('affirm', 0, 0.6); else if (k === 'bad') S.chime(false); else if (k === 'win') S.chime(true); else if (k === 'shot') S.laser && S.laser(); else if (k === 'zap') S.zap(0, 0.7); else if (k === 'scan') S.droid('scan', 0, 0.5); }

  // ── HUD + results ──
  var css = document.createElement('style');
  css.textContent = '#hg-hud{position:fixed;left:50%;top:calc(40px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:30;display:none;gap:14px;padding:8px 16px;border-radius:16px;' +
    'background:rgba(16,10,40,.5);border:1px solid rgba(160,140,255,.45);color:#e6e0ff;font:800 13px -apple-system,system-ui,sans-serif;letter-spacing:1.5px;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);white-space:nowrap}' +
    '#hg-hud b{color:#fff}#hg-big{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:30;pointer-events:none;font:900 54px -apple-system,system-ui,sans-serif;color:#d8ccff;text-shadow:0 0 24px #8a6cff;letter-spacing:4px;opacity:0;transition:opacity .15s}' +
    '#hg-pow{position:fixed;left:50%;bottom:calc(160px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:30;width:min(70vw,300px);height:12px;border-radius:7px;background:rgba(255,255,255,.12);border:1px solid rgba(160,140,255,.5);display:none;overflow:hidden}#hg-pow u{display:block;height:100%;background:linear-gradient(90deg,#7fd8ff,#b08cff,#ff7ab0)}' +
    '#hg-end{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:66;display:none;width:min(88vw,340px);padding:18px;border-radius:22px;text-align:center;box-sizing:border-box;' +
    'background:linear-gradient(140deg,rgba(255,255,255,.14),rgba(255,255,255,.03)),rgba(16,10,40,.7);-webkit-backdrop-filter:blur(22px) saturate(185%);backdrop-filter:blur(22px) saturate(185%);border:1px solid rgba(160,140,255,.4);color:#fff;font:600 14px -apple-system,system-ui,sans-serif}' +
    '#hg-end h3{margin:0 0 6px;font:800 12px -apple-system,system-ui,sans-serif;letter-spacing:3px;color:#c8b8ff}#hg-end .sc{font:900 40px -apple-system,system-ui,sans-serif;margin:6px 0}#hg-end p{color:#d8d0f0;margin:4px 0 12px;font-size:13px}' +
    '#hg-end button{margin:4px;padding:10px 18px;border-radius:14px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:#fff;font:700 13px -apple-system,system-ui,sans-serif}' +
    '#hg-quit{position:fixed;right:calc(14px + env(safe-area-inset-right,0px));top:calc(40px + env(safe-area-inset-top,0px));z-index:30;display:none;padding:7px 12px;border-radius:13px;border:1px solid rgba(160,140,255,.45);background:rgba(16,10,40,.5);color:#e6e0ff;font:800 11px -apple-system,system-ui,sans-serif;letter-spacing:1.5px}';
  document.head.appendChild(css);
  function $(id, tag) { var e = document.getElementById(id); if (!e) { e = document.createElement(tag || 'div'); e.id = id; document.body.appendChild(e); ['pointerdown', 'touchstart', 'mousedown'].forEach(function (n) { e.addEventListener(n, function (ev) { ev.stopPropagation(); }, { passive: true }); }); } return e; }
  function hud(html) { var h = $('hg-hud'); h.style.display = html ? 'flex' : 'none'; if (html) h.innerHTML = html; }
  function big(t, ms) { var b = $('hg-big'); b.textContent = t; b.style.opacity = 1; clearTimeout(big.t); if (ms) big.t = setTimeout(function () { b.style.opacity = 0; }, ms); }
  function finish(kind, title, score, line, pay, win) {
    var bb = best(), isBest = kind === 'golf' ? (bb.golf == null || score < bb.golf) : (bb[kind] == null || score > bb[kind]); if (isBest) { bb[kind] = score; save('wf-holo-best', bb); }
    var e = $('hg-end'); e.innerHTML = '<h3>' + title + '</h3><div class="sc">' + score + '</div><p>' + line + (isBest ? '<br><b style="color:#ffe08a">NEW BEST!</b>' : '<br>Best: ' + bb[kind]) + (pay ? '<br>+' + pay + ' cr' : '') + '</p>';
    var again = document.createElement('button'); again.textContent = 'Play again'; again.onclick = function () { e.style.display = 'none'; launch(kind); };
    var x = document.createElement('button'); x.textContent = 'Close'; x.onclick = function () { e.style.display = 'none'; };
    e.appendChild(again); e.appendChild(x); e.style.display = 'block';
    if (pay && window.WF_LIFE) WF_LIFE.add(pay); if (window.WF_LIFE) { WF_LIFE.event('holo'); if (win) WF_LIFE.event('win:' + kind); }
    sfx(win ? 'win' : 'bad'); stop();
  }

  // ── shared plumbing ──
  function setup() {
    sc = document.querySelector('a-scene'); cam = sc.camera; root = new THREE.Group(); root.userData.noCollide = true; sc.object3D.add(root);
    var gx = document.getElementById('hd-house'); if (gx) gx.setAttribute('visible', false);
    var q = $('hg-quit', 'button'); q.textContent = 'END PROGRAM'; q.style.display = 'block'; q.onclick = function () { close(); };
  }
  function stop() { if (root) root.removeFromParent(); root = null; G = null; hud(null); $('hg-pow').style.display = 'none'; $('hg-quit', 'button').style.display = 'none'; big('', 1);
    var gx = document.getElementById('hd-house'); if (gx && !(window.WAYFARER_GARDEN && WAYFARER_GARDEN.self && WAYFARER_GARDEN.self.active)) gx.setAttribute('visible', true); }
  function close() { if (G && G.cleanup) G.cleanup(); stop(); var e = document.getElementById('hg-end'); if (e) e.style.display = 'none'; }
  function camPos() { var p = new THREE.Vector3(); cam.getWorldPosition(p); return p; }
  function camDir() { var d = new THREE.Vector3(); cam.getWorldDirection(d); return d; }
  function tapRay(e) {                     // touch: where you tapped · desktop with the mouse locked: the centre of the screen (where you look)
    var r = sc.canvas.getBoundingClientRect(); if (document.pointerLockElement) V.set(0, 0); else V.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(V, cam); return ray; }
  // pointer helpers: a TAP is a press that didn't drag (dragging is still looking around)
  function onCanvas(down, up) {
    var st = null;
    function d(e) { if (!G || e.target !== sc.canvas) return; st = { x: e.clientX, y: e.clientY, t: performance.now() }; if (down) down(e); }
    function u(e) { if (!G || !st) return; var moved = !document.pointerLockElement && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 12; st = null; if (up) up(e, moved); }
    addEventListener('pointerdown', d, true); addEventListener('pointerup', u, true);
    return function () { removeEventListener('pointerdown', d, true); removeEventListener('pointerup', u, true); };
  }

  // ── TARGET RANGE ──
  function range() {
    var orbs = [], score = 0, combo = 0, T = 45, t = 0, next = 0;
    function spawn() {
      var r = Math.random(), kind = r < 0.14 ? 'gold' : r < 0.3 ? 'red' : 'violet', col = { gold: 0xffd060, red: 0xff3050, violet: 0x9a7aff }[kind];
      var g = new THREE.Group(), size = kind === 'gold' ? 0.3 : 0.45;
      var core = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.9, toneMapped: false })); g.add(core);
      var inner = new THREE.Mesh(new THREE.SphereGeometry(size * 0.55, 16, 12), glowMat(col, 0.5)); g.add(inner);
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: col, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(size * 4); g.add(halo);
      var cp = camPos(), cd = camDir(), yaw = Math.atan2(cd.x, cd.z) + (Math.random() - 0.5) * 2.2, d = 3 + Math.random() * 3.5;   /* mostly in front of you */
      g.position.set(Math.max(-8, Math.min(8, cp.x + Math.sin(yaw) * d)), 1 + Math.random() * 2.2, Math.max(-8, Math.min(8, cp.z + Math.cos(yaw) * d)));
      var sp = kind === 'gold' ? 2.4 : 0.8; g.userData = { kind: kind, v: new THREE.Vector3((Math.random() - 0.5) * sp, (Math.random() - 0.5) * sp * 0.4, (Math.random() - 0.5) * sp), life: kind === 'gold' ? 3.5 : 7, hit: core };
      root.add(g); orbs.push(g);
    }
    function burst(p, col) { for (var i = 0; i < 12; i++) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.copy(p); s.scale.setScalar(0.12); s.userData.v = new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4); s.userData.life = 0.5; root.add(s); fx.push(s); } }
    var fx = [];
    var off = onCanvas(null, function (e, moved) {
      if (moved) return; var R = tapRay(e), hits = R.intersectObjects(orbs.map(function (o) { return o.userData.hit; }), false);
      if (!hits.length) { combo = 0; return; }
      var o = hits[0].object.parent, k = o.userData.kind, col = { gold: 0xffd060, red: 0xff3050, violet: 0x9a7aff }[k];
      if (k === 'red') { score = Math.max(0, score - 20); combo = 0; sfx('bad'); big('−20', 500); }
      else { combo++; var pts = (k === 'gold' ? 50 : 10) * (combo >= 5 ? 2 : 1); score += pts; sfx(k === 'gold' ? 'scan' : 'hit'); if (combo === 5) big('COMBO ×2', 700); }
      burst(o.position, col); o.removeFromParent(); orbs.splice(orbs.indexOf(o), 1);
    });
    return { cleanup: off, tick: function (dt) {
      t += dt; next -= dt; if (next <= 0 && orbs.length < 7) { spawn(); next = 0.5 + Math.random() * 0.5; }
      for (var i = orbs.length - 1; i >= 0; i--) { var o = orbs[i], u = o.userData; u.life -= dt; o.position.addScaledVector(u.v, dt); o.rotation.y += dt * 1.5; o.rotation.x += dt;
        if (Math.hypot(o.position.x, o.position.z) > 8 || o.position.y < 0.6 || o.position.y > 3.8) u.v.multiplyScalar(-1);
        if (u.life < 0) { o.removeFromParent(); orbs.splice(i, 1); } }
      for (var j = fx.length - 1; j >= 0; j--) { var s = fx[j]; s.userData.life -= dt; s.position.addScaledVector(s.userData.v, dt); s.material.opacity = s.userData.life * 2; if (s.userData.life <= 0) { s.removeFromParent(); fx.splice(j, 1); } }
      hud('TARGET RANGE &nbsp; <span>SCORE <b>' + score + '</b></span><span>TIME <b>' + Math.max(0, Math.ceil(T - t)) + '</b></span>' + (combo >= 5 ? '<span style="color:#ffe08a">×2</span>' : ''));
      if (t >= T) finish('range', 'TARGET RANGE', score, score >= 400 ? 'Sharpshooter!' : score >= 250 ? 'Nice shooting.' : 'Keep practising.', Math.min(120, Math.floor(score / 6)), score >= 300);
    } };
  }

  // ── QUICK DRAW ──
  function duel() {
    var me = 0, them = 0, round = 0, phase = 'load', at = 0, wait = 0, drawT = 0, foe = null, mixer = null, acts = {}, react = 0;
    var gp = new THREE.Group(); gp.position.set(0, 0, -6.5); root.add(gp);
    var pad = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.95, 48), glowMat(0x9a7aff, 0.6)); pad.rotation.x = -Math.PI / 2; pad.position.y = 0.02; gp.add(pad);
    new THREE.GLTFLoader().load('hiveport/characters/Kvetar_holographic_performer.glb', function (g) {
      if (!root) return; foe = g.scene; foe.rotation.y = 0; gp.add(foe); mixer = new THREE.AnimationMixer(foe); g.animations.forEach(function (c) { acts[c.name] = mixer.clipAction(c); });
      play('Idle'); phase = 'ready'; at = 0;
    });
    var cur = null;
    function play(n, once) { var a = acts[n]; if (!a) return; if (cur) cur.fadeOut(0.12); a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity); a.clampWhenFinished = !!once; a.fadeIn(0.12).play(); cur = a; }
    function face() { var p = camPos(); gp.rotation.y = Math.atan2(p.x - gp.position.x, p.z - gp.position.z); }
    function nextRound() { round++; phase = 'wait'; wait = 1.8 + Math.random() * 3; at = 0; react = Math.max(0.26, 0.52 - round * 0.04 - Math.random() * 0.06); big('READY…'); play('Idle'); }
    function score(who, why) { if (who === 'me') me++; else them++; phase = 'between'; at = 0; big(why, 1100); if (who === 'me') { play('Brawl_Recoil', true); sfx('hit'); } else { play('Brawl_Shove', true); sfx('zap'); } }
    var off = onCanvas(function () {
      if (phase === 'wait') { score('them', 'FOUL! Too early'); return; }
      if (phase === 'draw') { var rt = performance.now() / 1000 - drawT; if (rt < react) score('me', Math.round(rt * 1000) + ' ms — HIT!'); else score('them', 'Too slow (' + Math.round(rt * 1000) + ' ms)'); }
    }, null);
    return { cleanup: off, tick: function (dt) {
      if (mixer) mixer.update(dt); face(); at += dt;
      if (phase === 'ready' && at > 0.8) { big('QUICK DRAW', 900); phase = 'pre'; at = 0; }
      else if (phase === 'pre' && at > 1.2) nextRound();
      else if (phase === 'wait' && at > wait) { phase = 'draw'; drawT = performance.now() / 1000; big('DRAW!'); sfx('shot'); play('Brawl_Shove', true); }
      else if (phase === 'draw' && performance.now() / 1000 - drawT > react) score('them', 'Too slow!');
      else if (phase === 'between' && at > 1.6) { if (me >= 3 || them >= 3) { var win = me > them; finish('duel', 'QUICK DRAW', me + ' – ' + them, win ? 'You out-drew the K’Vetar.' : 'The duellist was faster this time.', win ? 60 : 0, win); return; } nextRound(); }
      hud('QUICK DRAW &nbsp; <span>YOU <b>' + me + '</b></span><span>K’VETAR <b>' + them + '</b></span><span>ROUND <b>' + Math.max(1, round) + '</b></span>');
    } };
  }

  // ── HOLO GOLF ──
  function golf() {
    var HOLES = [{ tee: [-5, 6], cup: [-5, -5.5], walls: [[-5, 0.3, 2.6, 0.3]] }, { tee: [-6, 5.5], cup: [5.8, -5.2], walls: [[-0.3, -2.5, 0.3, 5]] }, { tee: [6, 6], cup: [-6, -1], walls: [[0, 2.5, 6, 0.3], [-3.5, -3, 0.3, 4]] }];
    var hole = 0, strokes = 0, total = 0, ball = null, vel = new THREE.Vector2(), charging = false, power = 0, pt = 0, moving = false, objs = [];
    var pow = $('hg-pow'); pow.innerHTML = '<u></u>';
    function build() {
      objs.forEach(function (o) { o.removeFromParent(); }); objs = []; var H = HOLES[hole];
      var cup = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.28, 32), glowMat(0x7fffb0, 0.9)); cup.rotation.x = -Math.PI / 2; cup.position.set(H.cup[0], 0.02, H.cup[1]); root.add(cup); objs.push(cup);
      var flag = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.4, 6), glowMat(0x7fffb0, 0.8)); flag.position.set(H.cup[0], 0.7, H.cup[1]); root.add(flag); objs.push(flag);
      var fl = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.22), new THREE.MeshBasicMaterial({ color: 0x7fffb0, side: THREE.DoubleSide, transparent: true, opacity: 0.8, toneMapped: false })); fl.position.set(H.cup[0] + 0.18, 1.3, H.cup[1]); root.add(fl); objs.push(fl);
      H.walls.forEach(function (w) { var m = new THREE.Mesh(new THREE.BoxGeometry(w[2], 0.35, w[3]), new THREE.MeshBasicMaterial({ color: 0x9a7aff, wireframe: true, transparent: true, opacity: 0.7, toneMapped: false })); m.position.set(w[0], 0.175, w[1]); root.add(m); objs.push(m);
        var f = new THREE.Mesh(new THREE.BoxGeometry(w[2], 0.35, w[3]), glowMat(0x6a4aff, 0.12)); f.position.copy(m.position); root.add(f); objs.push(f); });
      ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), glowMat(0xffffff, 1)); ball.position.set(H.tee[0], 0.09, H.tee[1]); root.add(ball); objs.push(ball);
      var bh = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: 0xb8a8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); bh.scale.setScalar(0.5); ball.add(bh);
      strokes = 0; vel.set(0, 0); moving = false; big('HOLE ' + (hole + 1) + ' · PAR 3', 1300);
    }
    build();
    var off = onCanvas(function () { if (moving) return; charging = true; pt = 0; pow.style.display = 'block'; },
      function () { if (!charging) return; charging = false; pow.style.display = 'none'; if (moving) return;
        var d = camDir(), l = Math.hypot(d.x, d.z) || 1; vel.set(d.x / l, d.z / l).multiplyScalar(1.5 + power * 9); strokes++; moving = true; sfx('hit'); });
    return { cleanup: off, tick: function (dt) {
      if (charging) { pt += dt; power = 0.5 - 0.5 * Math.cos(pt * 3.2); pow.firstChild.style.width = (power * 100) + '%'; }
      if (moving) {
        var H = HOLES[hole], p = ball.position, n = Math.max(1, Math.ceil(vel.length() * dt / 0.05));
        for (var k = 0; k < n; k++) { var s = dt / n; p.x += vel.x * s; p.z += vel.y * s;
          if (Math.abs(p.x) > 8.5) { p.x = Math.sign(p.x) * 8.5; vel.x *= -0.8; } if (Math.abs(p.z) > 8.5) { p.z = Math.sign(p.z) * 8.5; vel.y *= -0.8; }
          H.walls.forEach(function (w) { var hx = w[2] / 2 + 0.09, hz = w[3] / 2 + 0.09, dx = p.x - w[0], dz = p.z - w[1];
            if (Math.abs(dx) < hx && Math.abs(dz) < hz) { if (hx - Math.abs(dx) < hz - Math.abs(dz)) { p.x = w[0] + Math.sign(dx) * hx; vel.x *= -0.8; } else { p.z = w[1] + Math.sign(dz) * hz; vel.y *= -0.8; } } });
          var kx = p.x - 0, kz = p.z + 1, kd = Math.hypot(kx, kz);   /* the centre console is solid */
          if (kd < 1.38) { p.x = kx / kd * 1.38; p.z = -1 + kz / kd * 1.38; var nx = kx / kd, nz = kz / kd, dot = vel.x * nx + vel.y * nz; if (dot < 0) { vel.x -= 1.8 * dot * nx; vel.y -= 1.8 * dot * nz; } }
          var cd = Math.hypot(p.x - H.cup[0], p.z - H.cup[1]);
          if (cd < 0.22 && vel.length() < 4.5) { moving = false; total += strokes; sfx('win'); big(strokes === 1 ? 'HOLE IN ONE!' : strokes < 3 ? 'BIRDIE!' : strokes === 3 ? 'PAR' : strokes + ' STROKES', 1400);
            hole++; if (hole >= HOLES.length) { var par = total - 9; setTimeout(function () { if (G) finish('golf', 'HOLO GOLF', total, par < 0 ? (-par) + ' under par!' : par === 0 ? 'Level par.' : par + ' over par.', Math.max(10, 90 - total * 6), total <= 9); }, 1400); }
            else setTimeout(function () { if (G) build(); }, 1500); return; } }
        vel.multiplyScalar(Math.pow(0.42, dt)); if (vel.length() < 0.08) { vel.set(0, 0); moving = false; }
        ball.rotation.x += vel.y * dt * 8; ball.rotation.z -= vel.x * dt * 8;
      }
      hud('HOLO GOLF &nbsp; <span>HOLE <b>' + Math.min(3, hole + 1) + '/3</b></span><span>STROKES <b>' + strokes + '</b></span><span>TOTAL <b>' + (total + strokes) + '</b></span>');
      if (!moving && !charging && strokes === 0 && hole < HOLES.length) { var c = camPos(), dd = Math.hypot(c.x - ball.position.x, c.z - ball.position.z); if (dd > 4 && !G._hint) { G._hint = true; if (window.WF_LIFE) WF_LIFE.toast('Walk to the ball, face the flag, hold to charge, release to putt'); } }
    } };
  }

  function launch(kind) {
    close(); if (window.WAYFARER_GARDEN) WAYFARER_GARDEN.close(); setup();
    G = (kind === 'range' ? range : kind === 'duel' ? duel : golf)(); G.kind = kind;
  }
  AFRAME.registerComponent('wf-holo-games', { tick: function (t, dtm) { if (G && G.tick) G.tick(Math.min(dtm || 16, 50) / 1000); } });
  function attach() { var s = document.querySelector('a-scene'); if (s && !s.hasAttribute('wf-holo-games')) s.setAttribute('wf-holo-games', ''); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
  if (window.WF_LIFE) WF_LIFE.addGoals('holo', [{ id: 'holo1', text: 'Play a Holodeck game', ev: 'holo', n: 1 }, { id: 'holowin', text: 'Win a Holodeck game (beat the duellist, 300+ on the range, or par in golf)', ev: 'win:', n: 1 }]);
  window.WF_HOLO_GAMES = { launch: launch, close: close, active: function () { return !!G; } };
}());
