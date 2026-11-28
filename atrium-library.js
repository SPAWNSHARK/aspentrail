// SS Wayfarer — THE LIBRARY ON THE MEZZANINE (user, Nov 27: "move library contents into the mezzanine"). Everything that lived in
// library.html now stands on the atrium's mezzanine ring round the brain: painted bookcases on the outer wall, four scroll pedestals,
// the Science / WordPress console, the study corner (desk, chair, armchair, instruments) and the STAR MAP lectern (starmap.js,
// config WF_STARMAP_CFG: the galaxy unfolds under the mezzanine ceiling above the brain). Mezzanine = y 0.02, core axis (0, 36).
(function () {
  if (!window.AFRAME) return;
  var THREE = AFRAME.THREE, CZ = 36, FY = 0.02, SCROLLS = [["SECOND BRAIN \u2014 INDEX", "Your Obsidian vault lives here.\n\nMarkdown files will appear as physical scrolls once loaded.\nDrag your .md files into the repo and they will populate this room.\n\n[ PENDING: OBSIDIAN VAULT IMPORT ]"], ["THE SONS OF NAPHTALI \u2014 BOOK I", "Genetics, haplogroups, and the genetic trail of the tribe of Naphtali.\n\nBook 1 scope: comprehensive. Chapter structure in progress.\n\n[ PENDING: MANUSCRIPT FILES ]"], ["JEWISH GENETIC HAPLOGROUPS \u2014 BOOK II", "Spun off from Book I when the scope became too large to contain.\n\nFocuses on haplogroup distribution, migration patterns, and genetic markers across Jewish diaspora populations.\n\n[ PENDING: RESEARCH FILES ]"], ["DAILY NOTES \u2014 ACTIVE VAULT", "Neurodivergent idea capture. All the little things.\n\nEvery idea that lands here gets a home. Nothing lost.\n\n[ PENDING: DAILY NOTE FILES ]"]];
  window.WF_STARMAP_CFG = { x: 0, z: 36 + 7.0, Y: 2.95, S: 0.5, pitch: 0.42, cx: 0, cz: CZ, lx: -5.2, lz: CZ + 6.4 };
  function el(tag, attrs, parent) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function polar(R, th) { return [R * Math.sin(th), CZ + R * Math.cos(th)]; }
    const SHELF_T = [];
    function shelfTexture(v) {
      if (SHELF_T[v]) return SHELF_T[v];
      const W = 512, H = 640, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
      let sd = 1234 + v * 977; const r = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
      const Y = m => (1 - m / 4) * H, PAL = [['#6b1e1e', '#8a2a24', '#4a1414'], ['#1f4a32', '#2d6a44', '#163a28'], ['#1d2e55', '#2a4278', '#141f3a'], ['#9a6a1e', '#b88430', '#7a5214'], ['#4a2650', '#663a70', '#341a3a'],
        ['#1f5a5a', '#2a7a74', '#143e3e'], ['#e6d8b8', '#cdbb96', '#f2e6c8'], ['#1a1614', '#2a2420', '#0e0c0a'], ['#7a3a1a', '#a0522d', '#5a2a10']];
      const pal = PAL.slice().sort(() => r() - 0.5).slice(0, 5 + (v % 3));
      x.fillStyle = '#1a100a'; x.fillRect(0, 0, W, H);
      const rows = [[0.42, 1.06], [1.16, 1.81], [1.91, 2.56], [2.66, 3.31], [3.4, 3.93]];
      rows.forEach(([y0, y1]) => {
        const bot = Y(y0), top = Y(y1), hMax = bot - top; let px = 6;
        x.fillStyle = '#120a06'; x.fillRect(0, top, W, hMax);
        const g = x.createLinearGradient(0, top, 0, bot); g.addColorStop(0, 'rgba(255,170,80,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, top, W, hMax);
        while (px < W - 10) {
          const roll = r();
          if (roll < 0.1) {                                              // an ornament
            const ow = 34 + r() * 26, kind = Math.floor(r() * 6), cx = px + ow / 2, by = bot - 2;
            if (kind === 0) { x.fillStyle = '#c08a48'; x.fillRect(cx - 3, by - 14, 6, 14); x.beginPath(); x.arc(cx, by - 30, 16, 0, 6.28); x.fillStyle = '#2a6a8a'; x.fill(); x.strokeStyle = '#d8b070'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#5a9a5a'; x.fillRect(cx - 8, by - 36, 9, 7); }
            else if (kind === 1) { x.fillStyle = '#8a4a2a'; x.fillRect(cx - 10, by - 18, 20, 18); for (let k = 0; k < 7; k++) { x.fillStyle = k % 2 ? '#3f7a3a' : '#5aa04a'; x.beginPath(); x.ellipse(cx + Math.cos(k) * 9, by - 26 - (k % 3) * 7, 5, 11, Math.sin(k) * 0.8, 0, 6.28); x.fill(); } }
            else if (kind === 2) { x.fillStyle = '#e8dcc4'; x.fillRect(cx - 4, by - 30, 8, 30); x.fillStyle = '#ffcf6a'; x.beginPath(); x.ellipse(cx, by - 36, 4, 7, 0, 0, 6.28); x.fill(); x.fillStyle = 'rgba(255,190,90,.25)'; x.beginPath(); x.arc(cx, by - 36, 16, 0, 6.28); x.fill(); }
            else if (kind === 3) { x.fillStyle = '#e8e0cc'; x.beginPath(); x.arc(cx, by - 16, 12, Math.PI, 0); x.fill(); x.fillRect(cx - 9, by - 16, 18, 14); x.fillStyle = '#222'; x.fillRect(cx - 7, by - 19, 5, 5); x.fillRect(cx + 2, by - 19, 5, 5); }
            else if (kind === 4) { for (let k = 0; k < 4; k++) { x.fillStyle = ['#b08cff', '#7fd8ff', '#d0a8ff', '#9af0e0'][k]; x.beginPath(); x.moveTo(cx - 10 + k * 6, by); x.lineTo(cx - 6 + k * 6, by - 18 - k * 5); x.lineTo(cx - 2 + k * 6, by); x.fill(); } }
            else { x.fillStyle = '#c08a48'; x.fillRect(cx - 12, by - 4, 24, 4); x.fillRect(cx - 12, by - 34, 24, 4); x.fillStyle = 'rgba(200,230,255,.5)'; x.beginPath(); x.moveTo(cx - 9, by - 30); x.lineTo(cx + 9, by - 30); x.lineTo(cx, by - 17); x.lineTo(cx + 9, by - 4); x.lineTo(cx - 9, by - 4); x.lineTo(cx, by - 17); x.fill(); x.fillStyle = '#e8c890'; x.fillRect(cx - 5, by - 10, 10, 6); }
            px += ow + 4; continue;
          }
          if (roll < 0.17) {                                             // a horizontal stack
            let sy = bot; const sw = 40 + r() * 20; for (let k = 0; k < 3 + Math.floor(r() * 3); k++) { const th = 6 + r() * 5, cc = pal[Math.floor(r() * pal.length)]; x.fillStyle = cc[0]; x.fillRect(px + r() * 4, sy - th, sw, th); x.fillStyle = 'rgba(220,180,90,.6)'; x.fillRect(px + 6, sy - th + 2, sw - 12, 1); sy -= th; }
            px += sw + 6; continue;
          }
          const bw = 7 + r() * 13, bh = hMax * (0.62 + r() * 0.34), cc = pal[Math.floor(r() * pal.length)], lean = r() < 0.08 ? (r() - 0.5) * 0.35 : 0;
          x.save(); x.translate(px + bw / 2, bot); x.rotate(lean);
          const sg = x.createLinearGradient(-bw / 2, 0, bw / 2, 0); sg.addColorStop(0, cc[2]); sg.addColorStop(0.45, cc[1]); sg.addColorStop(1, cc[2]); x.fillStyle = sg; x.fillRect(-bw / 2, -bh, bw, bh);
          x.fillStyle = 'rgba(232,192,104,.75)'; if (r() < 0.8) { x.fillRect(-bw / 2, -bh + 6, bw, 2); x.fillRect(-bw / 2, -10, bw, 2); } if (r() < 0.5) x.fillRect(-bw / 2, -bh * 0.55, bw, 1.5);
          if (bw > 11 && r() < 0.6) { x.fillStyle = cc[0] === '#e6d8b8' ? '#3a2a1a' : 'rgba(240,214,150,.85)'; for (let k = 0; k < 4; k++) x.fillRect(-1.5, -bh * 0.75 + k * 7, 3, 4); }
          x.restore(); px += bw + (lean ? 6 : 1);
        }
      });
      for (let i = 0; i < 2500; i++) { x.fillStyle = 'rgba(0,0,0,' + r() * 0.06 + ')'; x.fillRect(r() * W, r() * H, 1, 2); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; SHELF_T[v] = t; return t;
    }

    // BOOKCASES — a row of lit bays around the back arc, between the two wings

  function hit(parent, x, y, z, r, fn) {                        // invisible tap target
    var h = document.createElement('a-entity'); h.setAttribute('class', 'interactive clickable');
    var m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); h.setObject3D('mesh', m); h.object3D.position.set(x, y, z); h.object3D.userData.noCollide = true;
    h.addEventListener('click', fn); parent.appendChild(h); return h;
  }
  function panel() {
    var p = document.getElementById('wf-scroll'); if (p) return p;
    var css = document.createElement('style'); css.textContent = '#wf-scroll{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(94vw,520px);max-height:62vh;overflow:auto;z-index:66;display:none;padding:18px 20px 20px;border-radius:22px;color:#f4ead8;background:rgba(18,14,10,.72);-webkit-backdrop-filter:blur(22px) saturate(180%);backdrop-filter:blur(22px) saturate(180%);border:1px solid rgba(255,200,140,.28);box-shadow:0 18px 50px rgba(0,0,0,.55);font:400 15px/1.55 Georgia,serif}#wf-scroll h2{margin:0 28px 10px 0;font:700 14px -apple-system,system-ui,sans-serif;letter-spacing:.12em;color:#ffcc66}#wf-scroll .x{position:absolute;top:10px;right:12px;width:30px;height:30px;border-radius:15px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font:600 15px sans-serif}';
    document.head.appendChild(css);
    p = document.createElement('div'); p.id = 'wf-scroll'; p.innerHTML = '<button class="x">✕</button><h2></h2><div class="b"></div>'; document.body.appendChild(p);
    ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach(function (n) { p.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); });
    p.querySelector('.x').onclick = function () { p.style.display = 'none'; document.body.classList.remove('reading'); };
    return p;
  }
  function readScroll(i) {
    var p = panel(), s = SCROLLS[i]; p.querySelector('h2').textContent = s[0]; p.querySelector('.b').innerHTML = s[1].split('\n').map(function (l) { return l ? '<div>' + l + '</div>' : '<br>'; }).join('');
    p.style.display = 'block'; document.body.classList.add('reading'); if (window.WF_LIFE) WF_LIFE.event('scroll');
  }

  function build(sc) {
    var root = new THREE.Group(); root.name = 'MezzanineLibrary'; sc.object3D.add(root);
    var bronze = new THREE.MeshStandardMaterial({ color: 0x8a6a46, roughness: 0.4, metalness: 0.85 }), wood = new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.75 });
    var amber = new THREE.MeshBasicMaterial({ color: 0xffb060, toneMapped: false });
    // BOOKCASES — painted bays on the outer wall (r 10.1), clear of the hall gap (θ π) and the two stair doorways (θ ±2.02)
    var thetas = [], k;
    for (k = 0; k < 14; k++) thetas.push(-1.8 + k * (3.6 / 13));
    [2.5, 2.8, -2.5, -2.8].forEach(function (t) { thetas.push(t); });
    thetas.forEach(function (th, i) {
      var q = polar(10.08, th), g = new THREE.Group(), vt = shelfTexture(i % 5);
      g.position.set(q[0], FY, q[1]); g.rotation.y = th + Math.PI;
      var face = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.1), new THREE.MeshStandardMaterial({ map: vt, emissiveMap: vt, emissive: new THREE.Color('#ffb070'), emissiveIntensity: 0.32, roughness: 0.8 }));
      face.position.set(0, 1.62, 0); face.userData.keepLook = true; face.userData.noCollide = true; g.add(face);
      [-1.33, 1.33].forEach(function (x) { var u = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 0.1), wood); u.position.set(x, 1.6, 0.02); u.userData.noCollide = true; g.add(u); });
      var top = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.1, 0.12), bronze); top.position.set(0, 3.2, 0.02); top.userData.noCollide = true; g.add(top);
      root.add(g);
    });
    // SCROLL PEDESTALS (r 8.1)
    [0.95, -0.95, 2.55, -2.55].forEach(function (th, i) {
      var q = polar(8.1, th), g = new THREE.Group(); g.position.set(q[0], FY, q[1]);
      var base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.2, 20), wood); base.position.y = 0.1; g.add(base);
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 12), bronze); stem.position.y = 0.55; g.add(stem);
      var dish = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20), bronze); dish.position.y = 0.92; g.add(dish);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 6, 32), amber); ring.rotation.x = Math.PI / 2; ring.position.y = 0.21; g.add(ring);
      var sr = new THREE.Group(); sr.position.y = 1.15; g.add(sr);
      var roll = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.46, 14), new THREE.MeshStandardMaterial({ color: 0xdcc08a, roughness: 0.85, emissive: 0x7a4a14, emissiveIntensity: 0.55 })); roll.rotation.z = Math.PI / 2; sr.add(roll);
      [-0.25, 0.25].forEach(function (x) { var c = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.035, 14), bronze); c.rotation.z = Math.PI / 2; c.position.x = x; sr.add(c); });
      var glow = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffa43c, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending })); sr.add(glow);
      g.traverse(function (o) { o.userData.noCollide = true; }); root.add(g);
      sr.userData.spin = 1; (root.userData.scrolls = root.userData.scrolls || []).push([sr, g]);
      hit(sc, q[0], FY + 1.0, q[1], 0.75, function () { readScroll(i); });
    });
    // SCIENCE / WORDPRESS CONSOLE (Vesper's console): desk + tilted screen showing the site, tap → the site reader
    (function () {
      var th = 2.28, q = polar(9.1, th), g = new THREE.Group(); g.position.set(q[0], FY, q[1]); g.rotation.y = th + Math.PI;
      var desk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.7), wood); desk.position.y = 0.45; g.add(desk);
      var trim = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.05, 0.76), bronze); trim.position.y = 0.92; g.add(trim);
      var scr = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.65), new THREE.MeshBasicMaterial({ color: 0x1a1008, toneMapped: false })); scr.position.set(0, 1.3, 0.05); scr.rotation.x = -0.22; g.add(scr);
      var fr = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.05), bronze); fr.position.set(0, 1.3, 0.02); fr.rotation.x = -0.22; g.add(fr);
      if (window.WF_WP) WF_WP.screenTexture(function (tex) { scr.material.map = tex; scr.material.color.set(0xffffff); scr.material.needsUpdate = true; });
      g.traverse(function (o) { o.userData.wfSolid = true; }); root.add(g);
      var w = new THREE.Vector3(); g.localToWorld(w.set(0, 1.2, 0.3));
      hit(sc, w.x, w.y, w.z, 0.8, function () { if (window.WF_WP) WF_WP.open(); });
    })();
    // STUDY CORNER: the writing desk, chair, armchair and instruments
    (function () {
      var th = -2.3, q = polar(8.6, th), yaw = th + Math.PI;
      if (window.WF_FURN) {
        WF_FURN.place('library_writing_desk', { position: [q[0], FY, q[1]], yaw: yaw, parent: root });
        var c = polar(7.5, th - 0.04); WF_FURN.place('desk_chair', { position: [c[0], FY, c[1]], yaw: yaw + Math.PI + 0.25, parent: root });
        var a = polar(8.2, th + 0.42); WF_FURN.place('reading_armchair', { position: [a[0], FY, a[1]], yaw: yaw - 0.45, parent: root });
        var s = polar(8.7, th + 0.62); WF_FURN.place('side_table', { position: [s[0], FY, s[1]], yaw: yaw, parent: root });
      }
      ['microscope', 'specimen_vial_rack', 'hourglass'].forEach(function (src, i) {
        var d = polar(8.65 + 0.0, th + (i - 1) * 0.05), e = el('a-entity', { 'wf-prop': 'src: ' + src + '; accent: teal', position: d[0].toFixed(2) + ' ' + (FY + 0.85) + ' ' + d[1].toFixed(2), rotation: '0 ' + ((yaw * 180 / Math.PI) | 0) + ' 0' }, sc);
      });
      var o = polar(9.4, th + 1.0); el('a-entity', { 'wf-prop': 'src: armillary_sphere; accent: teal; height: 0.6', position: o[0].toFixed(2) + ' ' + (FY + 0.92) + ' ' + o[1].toFixed(2) }, sc);
    })();
    // STAR MAP lectern (starmap.js reads WF_STARMAP_CFG)
    sc.setAttribute('wf-starmap', '');
    root.userData.ready = true;
    AFRAME.registerComponent('wf-mezz-library', { tick: function (t) { (root.userData.scrolls || []).forEach(function (p) { p[0].rotation.y = t / 2600; p[0].position.y = 1.15 + Math.sin(t / 900 + p[1].position.x) * 0.05; }); } });
    sc.setAttribute('wf-mezz-library', '');
    window.WF_MEZZ_LIBRARY = { root: root, readScroll: readScroll };
  }

  // CORE POLISH (Nov 27): hydrogel tint on the brain + a school of glowing eels orbiting it inside the chamber (r 4.1–4.9, clear of the r 5 glass)
  function core(sc) {
    var NE = (window.WAYFARER && WAYFARER.mobile) ? 3 : 5, SEG = 22, g = new THREE.Group(); g.position.set(0, 0, CZ); g.userData.noCollide = true; sc.object3D.add(g);
    var eelM = new THREE.MeshStandardMaterial({ color: 0x0c3a2a, roughness: 0.35, metalness: 0.2, emissive: 0x0b7a48, emissiveIntensity: 0.5 }),
        eel = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), eelM, NE * SEG), eyeM = new THREE.MeshBasicMaterial({ color: 0xc8ffe0, toneMapped: false }),
        eyes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 6, 4), eyeM, NE * 2);
    eel.frustumCulled = eyes.frustumCulled = false; g.add(eel); g.add(eyes);
    var E = []; for (var i = 0; i < NE; i++) E.push({ ph: i * 1.3, sp: 0.22 + (i % 3) * 0.07, dir: i % 2 ? -1 : 1, r: 4.05 + (i % 3) * 0.35, y: [-3.4, -1.2, 1.3, -2.2, 0.2][i], sz: 0.085 + (i % 2) * 0.02 });
    var M = new THREE.Matrix4(), Q = new THREE.Quaternion(), SC = new THREE.Vector3(), UP = new THREE.Vector3(0, 0, 1), P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), V = new THREE.Vector3();
    function at(e, T, k, out) { var a = e.ph + (T - k * 0.1) * e.sp * e.dir, w = Math.sin(T * 5 - k * 0.7) * 0.08 * (k / SEG); out.set(Math.cos(a) * (e.r + w), e.y + Math.sin((T - k * 0.1) * 0.5 + e.ph) * 0.9, Math.sin(a) * (e.r + w)); }
    AFRAME.registerComponent('wf-core-eels', { tick: function (t) {
      var T = t / 1000, ei, k;
      for (ei = 0; ei < NE; ei++) { var e = E[ei]; for (k = 0; k < SEG; k++) { at(e, T, k, P0); at(e, T, k + 1, P1); V.subVectors(P0, P1).normalize(); Q.setFromUnitVectors(UP, V);
          var tp = e.sz * (k < 2 ? 0.85 + k * 0.1 : 1 - (k - 2) / SEG * 0.85); SC.set(tp, tp * 0.75, tp * 1.9); M.compose(P0, Q, SC); eel.setMatrixAt(ei * SEG + k, M);
          if (k === 0) for (var s = 0; s < 2; s++) { M.makeTranslation(P0.x + V.z * (s ? 1 : -1) * tp * 0.6, P0.y + tp * 0.4, P0.z - V.x * (s ? 1 : -1) * tp * 0.6); eyes.setMatrixAt(ei * 2 + s, M); } } }
      eel.instanceMatrix.needsUpdate = eyes.instanceMatrix.needsUpdate = true;
      if (t - (core.tt || 0) > 1000) { core.tt = t; var b = document.getElementById('brain'), o = b && b.object3D; if (o) o.traverse(function (m) { if (m.isMesh && m.material && m.material.vertexColors) { m.material.color.set(0x5fa87a); if (m.material.sheenColor) m.material.sheenColor.set(0x70ffb0); m.material.envMapIntensity = 0.35; } }); }
    } });
    sc.setAttribute('wf-core-eels', '');
  }
  var sc = document.querySelector('a-scene');
  if (sc.hasLoaded) setTimeout(function () { build(sc); core(sc); }, 600); else sc.addEventListener('loaded', function () { setTimeout(function () { build(sc); core(sc); }, 600); });
})();
