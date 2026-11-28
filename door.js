// SS Wayfarer — the one door used everywhere (corridor side and room side), plus "portal" previews.
// Load AFTER aframe.min.js.  API: window.WAYFARER.door.create({...}), .capture(...), .PORTALS
//
// Door design (user, Nov 2026): moulded arched bronze frame, ONE nameplate on the frame header, two leaves with a top
// light + X-braces to a centre octagon hub, glass tinted per room. The right leaf has a rounded tongue that carries the
// hub; the OPEN button sits in the hub at the door centre. Left leaf slides left, right leaf (with button) slides right.
//
// Portals: when a door opens, the opening shows the space on the other side: a 360° photo (equirect JPEG in
// images/portals/) captured from that doorway, box/cylinder-projected onto a proxy of the other room so it shifts
// correctly as you move. Regenerate the photos with tools/capture-portals.js whenever a room changes.
(function () {
  var THREE = AFRAME.THREE;
  window.WAYFARER = window.WAYFARER || {};

  // ───────── geometry constants (door-local metres; +z faces the viewer, −z is "through the door") ─────────
  var DOOR_W = 1.72, DOOR_H = 2.55, LW = DOOR_W / 2, FR_X = 1.1, FR_TOP = 2.9, R_IN = 0.35, R_OUT = 0.55, HUB_Y = 1.2, TONGUE = 0.3;
  var PORTAL_Z = -0.30, CAP_IN = 0.6, EYE = 1.6;

  // ───────── the ship's doorways: corridor side + room side, and a proxy shape for each space ─────────
  // frame: x, z, rot (deg) of the door group; the group's +z faces into the space it belongs to.
  var CORRIDOR = { kind: 'box', bmin: [-4.6, 0, -24], bmax: [4.6, 3.2, 25.8] };   // the split-level ATRIUM's upper hall (Nov 26 rebuild; bow = −Z)
  var LOWS = { kind: 'box', bmin: [-4.6, -5.95, -24], bmax: [4.6, -0.23, 26.6] };   // the lower atrium (photo projection box for lower-deck doors)
  var PORTALS = {
    bridge:   { name: 'COMMAND BRIDGE', page: 'bridge.html',   tint: 0x4aa8ff, corr: { x: 0,    z: -24,   rot: 0 }, room: { x: 0, z: 7.85,  rot: 180 }, space: { kind: 'cyl', radius: 8.2, bmin: [-8.2, 0, -8.2], bmax: [8.2, 5.2, 8.2] } },
    library:  { name: 'THE LIBRARY',    page: 'library.html',  tint: 0x3fe0c8, corr: { x: 0,    z: 25.8,  rot: 180 },   room: { x: 0, z: 10.65, rot: 180 }, space: { kind: 'cyl', radius: 11, bmin: [-11, 0, -11], bmax: [11, 5, 11] } },
    holodeck: { name: 'HOLODECK',       page: 'holodeck.html', tint: 0x8a5cff, corr: { x: -4.6, z: -14,   rot: 90 },  room: { x: 0, z: 8.65,  rot: 180 }, space: { kind: 'box', bmin: [-9, 0, -9], bmax: [9, 4, 9] } },
    lounge:   { name: 'CREW LOUNGE',    page: 'lounge.html',   tint: 0xffa060, corr: { x: 4.6,  z: -14,   rot: -90 }, room: { x: 0, z: 8.65,  rot: 180 }, space: { kind: 'cyl', radius: 9, bmin: [-9, 0, -9], bmax: [9, 5.5, 9] } },
    media:    { name: 'MEDIA NEXUS',    page: 'media.html',    tint: 0x4f8cff, corr: { x: 4.6,  z: 9,     rot: -90 }, room: { x: 0, z: 8.85,  rot: 180 }, space: { kind: 'cyl', radius: 9.2, bmin: [-9.2, 0, -9.2], bmax: [9.2, 7, 9.2] } },
    // the Atrium Kit rooms (Nov 26 rebuild; kitroom.js): room pages keep the kit's ship coordinates with their floor moved to y 0
    quarters: { name: "CAPTAIN'S QUARTERS", page: 'quarters.html', tint: 0xc08a50, corr: { x: -4.6, z: 9, rot: 90 }, room: { x: 0, z: 3.85, rot: 180 }, space: { kind: 'box', bmin: [-5, 0, -4], bmax: [5, 3.2, 4] } },   // Captain's Quarters V1 pack (rooms/quarters), local metres
    medbay:   { name: 'MEDBAY',      page: 'medbay.html',  tint: 0x7fffd0, corr: { x: -4.6, y: -5.95, z: -14, rot: 90 },  room: { x: 0, z: 3.4, rot: 180 }, space: { kind: 'box', bmin: [-4, 0, -3.5], bmax: [4, 3, 3.5] }, corrSpace: LOWS },   // Medbay V1 pack (rooms/medbay), local metres
    xeno:     { name: 'XENOBIOLOGY', page: 'xeno.html',    tint: 0x9aff6a, corr: { x: -4.6, y: -5.95, z: 9, rot: 90 },    room: { x: -4.6, z: 9, rot: -90 },   space: { kind: 'box', bmin: [-16.2, 0, -1], bmax: [-2.5, 3.2, 25.8] }, corrSpace: LOWS },
    mess:     { name: 'MESS HALL',   page: 'mess.html',    tint: 0xffc070, corr: { x: 4.6, y: -5.95, z: -14, rot: -90 },  room: { x: 4.6, z: -14, rot: 90 },   space: { kind: 'box', bmin: [2.5, 0, -24], bmax: [14.2, 3.2, -1] }, corrSpace: LOWS },
    maint:    { name: 'MAINTENANCE', page: 'maint.html',   tint: 0xd0a080, corr: { x: 4.6, y: -5.95, z: 9, rot: -90 },    room: { x: 4.6, z: 9, rot: 90 },     space: { kind: 'box', bmin: [2.5, 0, -1], bmax: [16.2, 3.2, 25.8] }, corrSpace: LOWS },
    firefly:  { name: 'FIREFLY HANGAR', page: 'firefly.html', tint: 0x6fd0ff, corr: { x: 0, y: -5.95, z: -24, rot: 0 },   room: { x: 0, z: -24, rot: 180 },    space: { kind: 'box', bmin: [-13.1, 0, -49], bmax: [13.1, 3.2, -24] }, corrSpace: LOWS },
    core:     { name: 'THE CORE', page: 'core.html', tint: 0x3fe0c8, corr: { x: 0, y: -5.95, z: 45.4, rot: 0 }, room: { x: 0, z: 10.65, rot: 180 }, space: { kind: 'cyl', radius: 10.4, bmin: [-10.4, 0, -10.4], bmax: [10.4, 9.4, 10.4] }, corrSpace: { kind: 'box', bmin: [-3.4, -5.95, 45.4], bmax: [3.4, -0.23, 48.0] } },
    engine:   { name: 'ENGINE ROOM', page: 'engine.html',  tint: 0x3fe0c8, corr: { x: 0, y: -5.95, z: 26.6, rot: 180 },  room: { x: 0, z: 26.6, rot: 0 },     space: { kind: 'box', bmin: [-9.4, 0, 26.6], bmax: [9.4, 3.2, 45.4] }, corrSpace: LOWS }
  };
  function frameMatrix(f) { return new THREE.Matrix4().makeRotationY(f.rot * Math.PI / 180).setPosition(f.x, f.y || 0, f.z); }   // y: lower-deck doors (atrium −5.95)

  // ───────── small helpers ─────────
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function soft(shape, depth, bev) { return new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 8 }); }
  function rrectShape(w, h, r) { var x = -w / 2, y = -h / 2, sh = new THREE.Shape(); sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r); sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h); sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r); sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y); return sh; }
  function octagon(r) { var sh = new THREE.Shape(); for (var i = 0; i < 8; i++) { var a = (i + 0.5) / 8 * Math.PI * 2; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } return sh; }
  function dotTexture() { var c = cv(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
  var AC; function beep(f, d, type) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = 0.05; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d); o.stop(AC.currentTime + d); } catch (e) {} }

  // ───────── shapes ─────────
  function seam(sh, up) {               // seam between the leaves, bottom→top (up) or top→bottom; jogs round the hub
    // user sketch (Nov 24 v2): straight down the middle, then the seam hugs the LEFT half of the octagon hub and carries on
    // straight down — the whole hub rides on the right leaf. Octagon is flat-topped, outline just outside the hub (r 0.24).
    var R = 0.265, c = 0.924 * R, d = 0.383 * R, P = [[0, HUB_Y - c], [-d, HUB_Y - c], [-c, HUB_Y - d], [-c, HUB_Y + d], [-d, HUB_Y + c], [0, HUB_Y + c]];
    if (up) { P.forEach(function (q) { sh.lineTo(q[0], q[1]); }); sh.lineTo(0, DOOR_H); }
    else { P.slice().reverse().forEach(function (q) { sh.lineTo(q[0], q[1]); }); sh.lineTo(0, 0); }
  }
  function leafShape(right) {
    var sh = new THREE.Shape(), r = R_IN;
    if (right) { sh.moveTo(0, 0); sh.lineTo(LW, 0); sh.lineTo(LW, DOOR_H - r); sh.quadraticCurveTo(LW, DOOR_H, LW - r, DOOR_H); sh.lineTo(0, DOOR_H); seam(sh, false); }
    else { sh.moveTo(-LW, 0); sh.lineTo(0, 0); seam(sh, true); sh.lineTo(-LW + r, DOOR_H); sh.quadraticCurveTo(-LW, DOOR_H, -LW, DOOR_H - r); sh.lineTo(-LW, 0); }
    return sh;
  }
  function openingShape() {
    var sh = new THREE.Shape(), x = LW, r = R_IN;
    sh.moveTo(-x, 0); sh.lineTo(x, 0); sh.lineTo(x, DOOR_H - r); sh.quadraticCurveTo(x, DOOR_H, x - r, DOOR_H); sh.lineTo(-x + r, DOOR_H); sh.quadraticCurveTo(-x, DOOR_H, -x, DOOR_H - r); sh.lineTo(-x, 0);
    return sh;
  }
  function frameShape() {               // arched U: outer outline up and over, inner opening back down
    var sh = new THREE.Shape(), X = FR_X, r = R_OUT, x = LW, ri = R_IN;
    sh.moveTo(-X, 0); sh.lineTo(-X, FR_TOP - r); sh.quadraticCurveTo(-X, FR_TOP, -X + r, FR_TOP); sh.lineTo(X - r, FR_TOP); sh.quadraticCurveTo(X, FR_TOP, X, FR_TOP - r); sh.lineTo(X, 0);
    sh.lineTo(x, 0); sh.lineTo(x, DOOR_H - ri); sh.quadraticCurveTo(x, DOOR_H, x - ri, DOOR_H); sh.lineTo(-x + ri, DOOR_H); sh.quadraticCurveTo(-x, DOOR_H, -x, DOOR_H - ri); sh.lineTo(-x, 0); sh.lineTo(-X, 0);
    return sh;
  }

  // ───────── surface painting (colour + bump + roughness on one layout; ExtrudeGeometry cap UVs are door metres) ─────────
  function painter(x0, x1, y1, pxPerM) {
    var W = Math.round((x1 - x0) * pxPerM), Hh = Math.round(y1 * pxPerM), out = {};
    ['col', 'bump', 'rough'].forEach(function (k) { out[k] = cv(W, Hh); out[k + 'X'] = out[k].getContext('2d'); });
    out.X = function (x) { return (x - x0) * pxPerM; }; out.Y = function (y) { return (y1 - y) * pxPerM; }; out.S = function (m) { return m * pxPerM; };
    out.all = function (fn) { fn(out.colX, 'col'); fn(out.bumpX, 'bump'); fn(out.roughX, 'rough'); };
    out.tex = function (k) { var t = new THREE.CanvasTexture(out[k]); if (k === 'col') t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1 / (x1 - x0), 1 / y1); t.offset.set(-x0 / (x1 - x0), 0); t.anisotropy = 4; return t; };
    return out;
  }
  function doorPaint(tint) {
    var P = painter(-LW, LW, DOOR_H, 300), X = P.X, Y = P.Y, S = P.S, tc = new THREE.Color(tint), r = rng(Math.floor(tint % 997));
    var rail = { col: '#4b3725', bump: '#d0d0d0', rough: '#8a8a8a' }, glass = { col: '#070b14', bump: '#202020', rough: '#4a4a4a' };
    P.all(function (x, k) { x.fillStyle = rail[k]; x.fillRect(0, 0, 9999, 9999); });
    function pane(pts) {
      P.all(function (x, k) {
        x.beginPath(); pts.forEach(function (q, i) { x[i ? 'lineTo' : 'moveTo'](X(q[0]), Y(q[1])); }); x.closePath();
        if (k === 'col') {
          var cx = pts.reduce(function (a, q) { return a + q[0]; }, 0) / pts.length, cy = pts.reduce(function (a, q) { return a + q[1]; }, 0) / pts.length;
          var g = x.createRadialGradient(X(cx), Y(cy + 0.15), 2, X(cx), Y(cy), S(0.6));
          g.addColorStop(0, 'rgba(' + Math.round(tc.r * 190) + ',' + Math.round(tc.g * 190) + ',' + Math.round(tc.b * 190) + ',1)'); g.addColorStop(1, '#07090f');
          x.fillStyle = g; x.fill();
          x.save(); x.clip(); for (var i = 0; i < 90; i++) { x.fillStyle = 'rgba(' + Math.round(150 + tc.r * 100) + ',' + Math.round(150 + tc.g * 100) + ',' + Math.round(130 + tc.b * 100) + ',' + (0.04 + r() * 0.1) + ')'; x.beginPath(); x.arc(X(cx) + (r() - 0.5) * S(0.7), Y(cy) + (r() - 0.5) * S(1.0), 1 + r() * 4, 0, 6.3); x.fill(); } x.restore();
          x.strokeStyle = 'rgba(255,215,150,0.35)'; x.lineWidth = 2; x.stroke();
        } else { x.fillStyle = glass[k]; x.fill(); if (k === 'bump') { x.strokeStyle = '#707070'; x.lineWidth = 5; x.stroke(); } }
      });
    }
    [-1, 1].forEach(function (sd) {
      var i0 = sd * 0.1, o0 = sd * 0.72, hx = sd * 0.28;
      pane([[i0, 1.78], [o0, 1.78], [o0, 2.2], [sd * 0.6, 2.34], [i0, 2.34]]);
      pane([[o0, 1.56], [o0, 0.3], [hx, HUB_Y]]);
      pane([[i0 + sd * 0.02, 1.62], [o0 - sd * 0.06, 1.62], [hx + sd * 0.02, HUB_Y + 0.12], [i0 + sd * 0.02, HUB_Y + 0.42]]);
      pane([[i0 + sd * 0.02, 0.16], [o0 - sd * 0.06, 0.16], [hx + sd * 0.02, HUB_Y - 0.12], [i0 + sd * 0.02, HUB_Y - 0.36]]);
      P.all(function (x, k) {
        x.strokeStyle = k === 'col' ? '#8a6136' : k === 'bump' ? '#ffffff' : '#606060'; x.lineWidth = S(0.035);
        x.strokeRect(X(sd > 0 ? 0.04 : -LW + 0.04), Y(DOOR_H - 0.04), S(LW - 0.08), S(DOOR_H - 0.08));
      });
    });
    P.all(function (x, k) {
      if (k === 'rough') return;
      x.strokeStyle = k === 'col' ? '#120c06' : '#000000'; x.lineWidth = 3; x.beginPath(); x.moveTo(X(0), Y(DOOR_H));
      var R = 0.265, c = 0.924 * R, d = 0.383 * R; [[0, HUB_Y + c], [-d, HUB_Y + c], [-c, HUB_Y + d], [-c, HUB_Y - d], [-d, HUB_Y - c], [0, HUB_Y - c], [0, 0]].forEach(function (q) { x.lineTo(X(q[0]), Y(q[1])); }); x.stroke();   // same path as seam()
    });
    return { map: P.tex('col'), bump: P.tex('bump'), rough: P.tex('rough') };
  }
  function framePaint() {
    var P = painter(-FR_X - 0.05, FR_X + 0.05, FR_TOP + 0.05, 220), X = P.X, Y = P.Y, S = P.S, rr = rng(31);
    P.all(function (x, k) {
      x.fillStyle = k === 'col' ? '#8f6436' : k === 'bump' ? '#b0b0b0' : '#707070'; x.fillRect(0, 0, 9999, 9999);
      if (k === 'col') for (var i = 0; i < 900; i++) { var yy = rr() * 9999; x.fillStyle = rr() < 0.5 ? 'rgba(255,215,150,0.05)' : 'rgba(40,20,6,0.06)'; x.fillRect(0, yy % x.canvas.height, x.canvas.width, 1); }
      var groove = k === 'col' ? 'rgba(30,16,4,0.85)' : k === 'bump' ? '#303030' : '#909090', hi = k === 'col' ? 'rgba(255,220,160,0.35)' : k === 'bump' ? '#ffffff' : '#606060';
      function box(xa, ya, xb, yb) { x.strokeStyle = groove; x.lineWidth = S(0.018); x.strokeRect(X(xa), Y(yb), S(xb - xa), S(yb - ya)); x.strokeStyle = hi; x.lineWidth = S(0.006); x.strokeRect(X(xa) + S(0.012), Y(yb) + S(0.012), S(xb - xa) - S(0.024), S(yb - ya) - S(0.024)); }
      function cut(ya) { x.fillStyle = groove; x.fillRect(X(-FR_X - 0.05), Y(ya) - S(0.008), S(2 * FR_X + 0.1), S(0.016)); }
      [-1, 1].forEach(function (sd) {
        var a = sd * (LW + 0.04), b = sd * (FR_X - 0.04), xa = Math.min(a, b), xb = Math.max(a, b);
        box(xa, 0.08, xb, 1.12); box(xa, 1.22, xb, 2.0);
        for (var j = 0; j < 14; j++) { var yy = 0.15 + j * 0.135; x.fillStyle = groove; x.fillRect(X(sd > 0 ? FR_X - 0.035 : -FR_X + 0.005), Y(yy), S(0.03), S(0.025)); }
      });
      cut(1.17); cut(2.05);
      box(-0.5, DOOR_H + 0.05, 0.5, FR_TOP - 0.05);
    });
    return { map: P.tex('col'), bump: P.tex('bump'), rough: P.tex('rough') };
  }
  // nameplate in the SS Wayfarer logo style (reference/logo-wordmark.jpg): gold wide-geometric lettering on black, with
  // three-bar 'wings' either side. Font: Michroma (OFL, fonts/michroma.woff2); plates redraw once it has loaded.
  var PLATES = [], FONT = 'Michroma, "Eurostile", "Helvetica Neue", Arial, sans-serif';
  if (window.FontFace && document.fonts) {
    var base = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
    new FontFace('Michroma', 'url(' + base + 'fonts/michroma.woff2)').load().then(function (f) { document.fonts.add(f); PLATES.forEach(function (p) { p.draw(); p.tex.needsUpdate = true; }); }).catch(function () {});
  }
  // the plaque itself (user, Nov 25): the oxblood leather + gold-filigree panel from their book (images/nameplate.png, the
  // 'MENU' plaque with its lettering removed); our gold Michroma lettering + logo wings sit on it, inside the corner leaves.
  var PLAQUE = new Image(); PLAQUE.src = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '') + 'images/nameplate.png?v=1';
  PLAQUE.onload = function () { PLATES.forEach(function (p) { p.draw(); p.tex.needsUpdate = true; }); };
  function plate(text, w, h) {
    var c = cv(w, h), x = c.getContext('2d'), t = new THREE.CanvasTexture(c);
    function draw() {
      x.clearRect(0, 0, w, h);
      if (PLAQUE.complete && PLAQUE.naturalWidth) x.drawImage(PLAQUE, 0, 0, w, h);
      else { x.fillStyle = '#5a1414'; x.fillRect(w * 0.02, h * 0.06, w * 0.96, h * 0.88); }
      var gold = x.createLinearGradient(0, h * 0.3, 0, h * 0.72); gold.addColorStop(0, '#fff1c8'); gold.addColorStop(0.45, '#e8bc70'); gold.addColorStop(0.55, '#b07a34'); gold.addColorStop(1, '#f6d690');
      x.textAlign = 'center'; x.textBaseline = 'middle';
      var cy = h * 0.5, inner = w * 0.66, wing = w * 0.055, room = inner - wing * 2 - 30, fs = Math.min(h * 0.26, room / (text.length * 0.92));
      x.font = '400 ' + fs + 'px ' + FONT; if (x.letterSpacing !== undefined) x.letterSpacing = (fs * 0.06) + 'px';
      var tw = x.measureText(text).width;
      if (tw > room) { fs *= room / tw; x.font = '400 ' + fs + 'px ' + FONT; if (x.letterSpacing !== undefined) x.letterSpacing = (fs * 0.06) + 'px'; tw = x.measureText(text).width; }
      x.fillStyle = 'rgba(20,4,2,0.75)'; x.fillText(text, w / 2 + 2, cy + 3);          // pressed into the leather
      x.fillStyle = gold; x.fillText(text, w / 2, cy + 1);
      [-1, 1].forEach(function (sd) {                                                    // small logo wings, clear of the corner leaves
        var st = w / 2 + sd * (tw / 2 + 14);
        for (var k = 0; k < 3; k++) {
          var y = cy - h * 0.075 + k * h * 0.075, len = wing * (1 - k * 0.2), th = h * 0.032;
          x.fillStyle = gold; x.beginPath();
          x.moveTo(st, y - th / 2); x.lineTo(st + sd * len * 0.82, y - th / 2); x.lineTo(st + sd * len, y); x.lineTo(st + sd * len * 0.82, y + th / 2); x.lineTo(st, y + th / 2); x.closePath(); x.fill();
        }
      });
    }
    draw(); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; PLATES.push({ draw: draw, tex: t }); return t;
  }
  function buttonFace(state) {           // open | close | press
    var S = 256, c = cv(S, S), x = c.getContext('2d'), hot = state === 'press';
    x.fillStyle = '#1b1208'; x.beginPath(); x.arc(128, 128, 126, 0, 6.3); x.fill();
    var g = x.createRadialGradient(128, 118, 8, 128, 128, 112);
    g.addColorStop(0, hot ? '#fff6d8' : '#ffd37a'); g.addColorStop(0.6, hot ? '#ffcf70' : '#f59a2a'); g.addColorStop(1, hot ? '#f0a040' : '#b4600e');
    x.fillStyle = g; x.beginPath(); x.arc(128, 128, 108, 0, 6.3); x.fill();
    x.strokeStyle = 'rgba(70,30,0,0.7)'; x.lineWidth = 5; x.beginPath(); x.arc(128, 128, 108, 0, 6.3); x.stroke();
    x.fillStyle = '#2a1500';                // symbol only (user): two arrows apart = open, together = close
    var dir = state === 'close' ? -1 : 1;
    [-1, 1].forEach(function (sd) { var cx = 128 + sd * 40, b = cx - sd * 26 * dir, tip = cx + sd * 26 * dir; x.beginPath(); x.moveTo(b, 92); x.lineTo(tip, 128); x.lineTo(b, 164); x.closePath(); x.fill(); });
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  // ───────── shared resources (built once per page) ─────────
  var R = null;
  function res(renderer) {
    if (R) return R;
    R = {};
    R.side = new THREE.MeshStandardMaterial({ color: 0x7a5530, roughness: 0.45, metalness: 0.7 });
    var fp = framePaint(); R.frame = new THREE.MeshStandardMaterial({ map: fp.map, bumpMap: fp.bump, bumpScale: 2.5, roughnessMap: fp.rough, roughness: 1, metalness: 0.75, color: 0xe0c8a8 }); R.frame.userData.v8Paint = true;   /* interior-v8.js: copper paint → gunmetal */
    R.leafL = soft(leafShape(false), 0.05, 0.01); R.leafR = soft(leafShape(true), 0.05, 0.01);
    var hubO = octagon(0.24); hubO.holes.push(octagon(0.15)); R.hub = soft(hubO, 0.03, 0.012);
    R.opening = new THREE.ShapeGeometry(openingShape(), 10);
    R.faces = { open: buttonFace('open'), close: buttonFace('close'), press: buttonFace('press') };
    R.dot = dotTexture();
    R.black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); R.black.needsUpdate = true;
    R.mats = [R.frame, R.side];
    // a soft warm environment so bronze reads as metal in rooms that have none (the corridor swaps in its own bake)
    try {
      var es = new THREE.Scene(), sky = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide,
        vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = mix(vec3(0.05,0.03,0.02), vec3(0.9,0.55,0.25), smoothstep(-0.2, 0.9, h)); gl_FragColor = vec4(c, 1.0); }' }));
      es.add(sky); var pm = new THREE.PMREMGenerator(renderer); R.env = pm.fromScene(es, 0.04).texture; pm.dispose();
      R.mats.forEach(function (m) { m.envMap = R.env; m.envMapIntensity = 0.6; });
    } catch (e) { R.env = null; }
    return R;
  }

  // ───────── portal material: box/cylinder-projected 360° photo of the other side ─────────
  function portalMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: { map: { value: R.black }, toCap: { value: new THREE.Matrix4() }, capPos: { value: new THREE.Vector3() }, kind: { value: 0 }, radius: { value: 1 },
        bmin: { value: new THREE.Vector3() }, bmax: { value: new THREE.Vector3() }, fade: { value: 0 } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: [
        'uniform sampler2D map; uniform mat4 toCap; uniform vec3 capPos, bmin, bmax; uniform int kind; uniform float radius, fade; varying vec3 vW;',
        'void main(){',
        '  vec3 P = (toCap * vec4(vW, 1.0)).xyz, C = (toCap * vec4(cameraPosition, 1.0)).xyz, d = normalize(P - C), inv = 1.0 / (d + vec3(1e-6));',
        '  vec3 t1 = (bmin - P) * inv, t2 = (bmax - P) * inv, tm = max(t1, t2); float t = min(min(tm.x, tm.y), tm.z);',
        '  if (kind == 1) { float a = dot(d.xz, d.xz), b = dot(P.xz, d.xz), c = dot(P.xz, P.xz) - radius * radius; float tc = (-b + sqrt(max(b * b - a * c, 0.0))) / max(a, 1e-5); t = min(tc, tm.y); }',
        '  vec3 s = normalize(P + d * max(t, 0.0) - capPos);',
        '  vec2 uv = vec2(atan(s.x, -s.z) / 6.2831853 + 0.5, 0.5 + asin(clamp(s.y, -1.0, 1.0)) / 3.1415927);',
        '  gl_FragColor = vec4(texture2D(map, uv).rgb * fade, 1.0);',
        '  #include <colorspace_fragment>',
        '}'].join('\n'),
      toneMapped: false, fog: false
    });
  }

  // ───────── create one door ─────────
  // opts: sc (a-scene element), parent (Object3D), frame {x,z,rot}, name, tint, depth (frame block depth), other (frame of the
  // other side, in the other page's world), space (proxy of the other side), img (portal photo URL), autoPass, onPass,
  // startOpen, say(msg), holdMs, locked (message: the button refuses to open)
  function create(o) {
    var renderer = o.sc.renderer; res(renderer);
    var g = new THREE.Group(); g.position.set(o.frame.x, o.frame.y || 0, o.frame.z); g.rotation.y = o.frame.rot * Math.PI / 180; (o.parent || o.sc.object3D).add(g);
    g.userData.noCollide = true;   // doorways stay walkable (mobile.js obstacle scan skips this subtree)
    var depth = o.depth || 0.1;
    var fr = new THREE.Mesh(soft(frameShape(), depth, 0.025), [R.frame, R.side]); fr.position.z = 0.12 - depth; g.add(fr);
    // a dark recess behind every doorway (user, Nov 26: the sky showed round the frames): back plate + sides + top, behind the portal
    var rb = R.recess || (R.recess = new THREE.MeshStandardMaterial({ color: 0x0c0806, roughness: 0.9 }));
    (o.noRecess ? [] : [[0, 1.55, -0.9, 2.5, 3.1, 0.05], [-1.22, 1.55, -0.45, 0.05, 3.1, 0.9], [1.22, 1.55, -0.45, 0.05, 3.1, 0.9], [0, 3.08, -0.45, 2.5, 0.05, 0.9]]).forEach(function (q) {   // noRecess (Nov 27): doors set in front of a solid wall (Library stairs doors) showed the box as a dark frame
      var b = new THREE.Mesh(new THREE.BoxGeometry(q[3], q[4], q[5]), rb); b.position.set(q[0], q[1], q[2]); g.add(b); });
    var nm = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.36), new THREE.MeshBasicMaterial({ map: plate(o.name, 1024, 330), transparent: true, alphaTest: 0.02, fog: false, toneMapped: false }));
    nm.position.set(0, (DOOR_H + FR_TOP) / 2, 0.16); g.add(nm);
    if (depth > 0.2 && !o.noPockets) {  // free-standing (room) door: threshold, plus pocket housings the leaves slide into
      var th = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, 0.02, depth), R.side); th.position.set(0, 0.01, 0.12 - depth / 2); g.add(th);
      [[-1.1, -1.9], [1.1, 2.2]].forEach(function (q) {
        var w = Math.abs(q[1] - q[0]), pk = new THREE.Mesh(soft(rrectShape(w, 2.62, 0.06), 0.16, 0.02), [R.frame, R.side]);
        pk.position.set((q[0] + q[1]) / 2, 1.31, -0.35); g.add(pk);
      });
    }
    var dp = doorPaint(o.tint || 0xffa040), leafM = new THREE.MeshStandardMaterial({ map: dp.map, bumpMap: dp.bump, bumpScale: 3, roughnessMap: dp.rough, roughness: 1, metalness: 0.55, color: 0xf0e0cc, envMap: R.env, envMapIntensity: 0.35 });
    leafM.userData.v8Tint = true; var lL = new THREE.Mesh(R.leafL, [leafM, R.side]), lR = new THREE.Mesh(R.leafR, [leafM, R.side]); lL.position.z = lR.position.z = -0.27; g.add(lL); g.add(lR);
    var hub = new THREE.Mesh(R.hub, R.side); hub.position.set(0, HUB_Y, 0.06); lR.add(hub);

    // portal
    var pm = portalMaterial(), portal = new THREE.Mesh(R.opening, pm); portal.position.z = PORTAL_Z; portal.visible = false; portal.userData.wfPortal = true; g.add(portal);
    if (o.other && o.space) {
      var Gt = frameMatrix(o.frame), Go = frameMatrix(o.other);
      pm.uniforms.toCap.value.copy(Go).multiply(new THREE.Matrix4().makeRotationY(Math.PI)).multiply(Gt.clone().invert());
      pm.uniforms.capPos.value.set(0, EYE, CAP_IN).applyMatrix4(Go);
      pm.uniforms.kind.value = o.space.kind === 'cyl' ? 1 : 0; pm.uniforms.radius.value = o.space.radius || 1;
      pm.uniforms.bmin.value.fromArray(o.space.bmin); pm.uniforms.bmax.value.fromArray(o.space.bmax);
    }
    var loaded = false;
    function loadImg() {
      if (loaded || !o.img || /[?&]capture/.test(location.search)) return; loaded = true;
      new THREE.TextureLoader().load(o.img, function (t) { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; pm.uniforms.map.value = t; });
    }
    setTimeout(loadImg, 9000 + Math.random() * 9000);   // Nov 27: photos wait until the scene is up (open() loads on demand)

    // button (rides with the right leaf) and a tap target on the open doorway
    var ent = document.createElement('a-entity');
    var holder = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    holder.position.set(0, HUB_Y, 0.115);
    var face = new THREE.Mesh(new THREE.CircleGeometry(0.12, 32), new THREE.MeshBasicMaterial({ map: R.faces.open, toneMapped: false, fog: false })); face.position.z = 0.004;
    var glow = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), new THREE.MeshBasicMaterial({ map: R.dot, color: 0xff9a2e, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); glow.position.z = 0.001;
    holder.add(glow); holder.add(face); ent.setObject3D('mesh', holder); ent.setAttribute('class', 'interactive clickable'); o.sc.appendChild(ent);
    ent.addEventListener('loaded', function () { lR.add(ent.object3D); });
    var tap = document.createElement('a-entity');
    var tapM = new THREE.Mesh(R.opening, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); tapM.position.z = PORTAL_Z + 0.01; tapM.visible = false;
    tap.setObject3D('mesh', tapM); tap.setAttribute('class', 'interactive clickable'); o.sc.appendChild(tap);
    tap.addEventListener('loaded', function () { g.add(tap.object3D); });

    var D = { g: g, lL: lL, lR: lR, p: 0, target: 0, openAt: 0, flash: 0, face: face, glow: glow, holder: holder, portal: portal, mats: [leafM].concat(R.mats), passed: false, opts: o };
    D.open = function (silent) { if (D.target === 1) return; D.target = 1; D.openAt = performance.now(); loadImg(); /* WF_INTERACTION_V11 */ if (!silent && o.page && window.WAYFARER.interaction) window.WAYFARER.interaction.prefetch(o.page); if (!silent) { if (window.WF_SOUND) WF_SOUND.door(); else { beep(880, 0.12, 'triangle'); setTimeout(function () { beep(520, 0.2, 'sine'); }, 90); } o.say && o.say('OPENING — ' + o.name); } };
    D.close = function () { if (D.target === 0) return; D.target = 0; if (window.WF_SOUND) WF_SOUND.door(); else beep(520, 0.12, 'triangle'); };
    D.pass = function () { if (D.passed || !o.onPass) return; D.passed = true; o.onPass(); };
    ent.addEventListener('click', function () {
      if (D.p > 0.25) return; D.flash = 0.22; face.material.map = R.faces.press;
      if (o.locked) { beep(220, 0.25, 'square'); o.say && o.say(o.locked); return; }       // a doorway that doesn't lead anywhere yet
      /* WF_INTERACTION_V11 */ var I = window.WAYFARER.interaction; if (I && I.active()) return;
      var operate = function () { if (D.target === 0) D.open(); else { D.close(); o.say && o.say('CLOSING — ' + o.name); } };
      if (!I || !I.door(holder, operate)) operate(); });
    tap.addEventListener('click', function () { if (D.p > 0.85) D.pass(); });
    if (o.startOpen) { D.p = 1; D.target = 1; D.openAt = performance.now(); loadImg(); }

    var inv = new THREE.Matrix4(), lp = new THREE.Vector3();
    // per frame: camWorld = camera world position; returns the camera in door-local coordinates
    D.update = function (dt, camWorld) {
      var s = Math.min(dt, 50) / 1000;
      g.updateMatrixWorld(); inv.copy(g.matrixWorld).invert(); lp.copy(camWorld).applyMatrix4(inv);
      var near = Math.abs(lp.x) < 0.8 && lp.z < 0.7;          // standing in the doorway: never shut the door on someone
      if (D.target === 1 && performance.now() - D.openAt > (o.holdMs || 8000) && !near) D.target = 0;
      D.p += (D.target - D.p) * Math.min(1, s * 5.5); if (Math.abs(D.target - D.p) < 0.002) D.p = D.target;
      lL.position.x = -D.p * (LW + 0.06); lR.position.x = D.p * (LW + 0.25 + 0.08);   // the right leaf carries the hub's left half past the frame
      holder.visible = D.p < 0.3; portal.visible = D.p > 0.001; tapM.visible = D.p > 0.85;
      pm.uniforms.fade.value = Math.min(1, D.p * 2.5);
      if (D.flash > 0) { D.flash -= s; if (D.flash <= 0) face.material.map = D.target ? R.faces.close : R.faces.open; }
      else { var want = D.target ? R.faces.close : R.faces.open; if (face.material.map !== want) face.material.map = want; }
      glow.material.opacity = 0.42 + 0.14 * Math.sin(performance.now() / 420) + (D.flash > 0 ? 0.4 : 0);
      face.scale.setScalar(D.flash > 0 ? 0.86 : 1);
      if (o.autoPass && D.p > 0.9 && Math.abs(lp.x) < 0.7 && lp.z < 0.6 && lp.z > -1.5) D.pass();
      return lp;
    };
    return D;
  }

  // ───────── room side: replace a room's exit with the shared door (one call per room page) ─────────
  // Fades to black and returns to the corridor when you step (or tap) through.
  function roomExit(id, opts) {
    opts = opts || {};
    var P = PORTALS[id], sc = document.querySelector('a-scene');
    function go() {
      var f = document.getElementById('wf-door-fade');
      leave('index.html?fromRoom=' + encodeURIComponent(id), 'images/portals/corr-' + id + '.jpg', CORR_YAW[id]);
    }
    function start() {
      var fromCorr = false;
      try { var nav = performance.getEntriesByType('navigation')[0]; fromCorr = (!nav || nav.type === 'navigate') && /index\.html$|\/aspentrail\/?$|\/$/.test((document.referrer || '').split('?')[0].split('#')[0]) && document.referrer.indexOf(location.host) >= 0; } catch (e) {}
      var D = create({ sc: sc, frame: P.room, name: '← ATRIUM', tint: 0xffd090, depth: 0.45, other: P.corr, space: P.corrSpace || CORRIDOR, img: 'images/portals/corr-' + id + '.jpg',
        page: 'index.html?fromRoom=' + encodeURIComponent(id), /* WF_INTERACTION_V11 */ autoPass: true, onPass: go, startOpen: fromCorr, holdMs: fromCorr ? 900 : 8000, say: opts.say });
      window.WAYFARER.roomDoor = D;
      var cam = sc.camera, wp = new THREE.Vector3();
      AFRAME.registerComponent('wf-door-tick-' + id, { tick: function (t, dt) { if (!sc.camera) return; /* the player, not the 3rd-person lens */ (sc.camera.el ? sc.camera.el.object3D : sc.camera).getWorldPosition(wp); D.update(dt, wp); } });
      sc.setAttribute('wf-door-tick-' + id, '');
    }
    if (sc.hasLoaded) start(); else sc.addEventListener('loaded', start);
  }

  // ───────── capture (tooling): 360° photo of this page's space from a doorway, as a JPEG data URL ─────────
  // frame = the door frame on THIS page whose +z faces into this space. Used by tools/capture-portals.js.
  function capture(frame, W) {
    // Renders six 90° views through the page's normal on-screen pipeline (so tone mapping, colour space and glow
    // blending match exactly what you see), then stitches them into an equirectangular JPEG.
    W = W || 2048; var N = 1024, H = W / 2;
    var sc = document.querySelector('a-scene'), r = sc.renderer, scene = sc.object3D;
    var hidden = [];
    scene.traverse(function (ob) { if (ob.userData.wfPortal && ob.visible) { ob.visible = false; hidden.push(ob); } });
    var rig = document.getElementById('player'); [rig && rig.object3D, sc.camera && sc.camera.parent].forEach(function (o) { if (o && o.visible) { o.visible = false; hidden.push(o); } });   // the player's own rig (cursor etc.)
    var pos = new THREE.Vector3(0, EYE, CAP_IN).applyMatrix4(frameMatrix(frame));
    var size = r.getSize(new THREE.Vector2()), pr = r.getPixelRatio(), xr = r.xr.enabled; r.xr.enabled = false;
    r.setPixelRatio(1); r.setSize(N, N, false);
    var dirs = [[1, 0, 0, 0, 1, 0], [-1, 0, 0, 0, 1, 0], [0, 1, 0, 0, 0, 1], [0, -1, 0, 0, 0, -1], [0, 0, 1, 0, 1, 0], [0, 0, -1, 0, 1, 0]], faces = [];
    dirs.forEach(function (dd) {
      var cam = new THREE.PerspectiveCamera(90, 1, 0.05, 3000); cam.position.copy(pos); cam.up.set(dd[3], dd[4], dd[5]);
      cam.lookAt(pos.x + dd[0], pos.y + dd[1], pos.z + dd[2]); cam.updateMatrixWorld(true);
      r.setRenderTarget(null); r.render(scene, cam); r.render(scene, cam);          // twice: the first frame after a resize can come out wrong
      var c = cv(N, N); c.getContext('2d').drawImage(r.domElement, 0, 0, N, N);
      faces.push({ m: cam.matrixWorldInverse.clone(), px: c.getContext('2d').getImageData(0, 0, N, N).data });
    });
    r.setPixelRatio(pr); r.setSize(size.x, size.y, false); r.xr.enabled = xr;
    hidden.forEach(function (ob) { ob.visible = true; });
    var out = cv(W, H), ox = out.getContext('2d'), id = ox.createImageData(W, H), v = new THREE.Vector3();
    for (var y = 0; y < H; y++) {
      var lat = (0.5 - (y + 0.5) / H) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
      for (var x = 0; x < W; x++) {
        var lon = ((x + 0.5) / W - 0.5) * 2 * Math.PI, dx = Math.sin(lon) * cl, dz = -Math.cos(lon) * cl;
        var ax = Math.abs(dx), ay = Math.abs(sl), az = Math.abs(dz), f = ax >= ay && ax >= az ? (dx > 0 ? 0 : 1) : ay >= az ? (sl > 0 ? 2 : 3) : (dz > 0 ? 4 : 5);
        v.set(dx, sl, dz).transformDirection(faces[f].m);
        var u = (v.x / -v.z + 1) / 2, w = (1 - v.y / -v.z) / 2, i = (Math.min(N - 1, Math.max(0, Math.floor(w * N))) * N + Math.min(N - 1, Math.max(0, Math.floor(u * N)))) * 4, o = (y * W + x) * 4, P = faces[f].px;
        id.data[o] = P[i]; id.data[o + 1] = P[i + 1]; id.data[o + 2] = P[i + 2]; id.data[o + 3] = 255;
      }
    }
    ox.putImageData(id, 0, 0);
    return out.toDataURL('image/jpeg', 0.84);
  }

  // ───────── seamless doorways (roadmap: no black screens) ─────────
  // Leaving: remember which 360° photo shows the other side + which way you'll face, and go straight away (no black fade).
  // Arriving: before the heavy room has built, a tiny second renderer shows that photo at your arrival heading, then
  // crossfades into the live scene. You see the destination the whole time.
  var CORR_YAW = { bridge: 180, library: 0, holodeck: -90, lounge: 90, media: 90, quarters: -90, medbay: -90, xeno: -90, mess: 90, maint: 90, firefly: 180, engine: 0, core: 180 };   // atrium arrival headings (0 = facing −Z): one step out, facing away from the door
  function leave(page, img, yaw) {
    try { sessionStorage.setItem('wf-arrive', JSON.stringify({ img: img, yaw: yaw || 0, t: Date.now() })); } catch (e) {}
    document.documentElement.style.background = '#120c08'; location.href = page;
  }
  (function arrive() {
    var rec = null; try { rec = JSON.parse(sessionStorage.getItem('wf-arrive') || 'null'); sessionStorage.removeItem('wf-arrive'); } catch (e) {}
    if (!rec || Date.now() - rec.t > 20000) return;
    document.documentElement.style.background = '#120c08';
    function start() {
      var c = document.createElement('canvas'); c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:55;pointer-events:none;transition:opacity .5s ease-out';
      document.body.appendChild(c);
      var r; try { r = new THREE.WebGLRenderer({ canvas: c, antialias: false }); } catch (e) { c.remove(); return; }
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(innerWidth, innerHeight, false);
      var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(80, innerWidth / innerHeight, 0.1, 100); cam.rotation.y = (rec.yaw || 0) * Math.PI / 180;
      var mat = new THREE.ShaderMaterial({ uniforms: { map: { value: null } }, side: THREE.BackSide, depthWrite: false,
        vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform sampler2D map; varying vec3 vP; void main(){ vec3 s = normalize(vP); vec2 uv = vec2(atan(s.x, -s.z) / 6.2831853 + 0.5, 0.5 + asin(clamp(s.y, -1.0, 1.0)) / 3.1415927); gl_FragColor = vec4(texture2D(map, uv).rgb, 1.0); }' });
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 32), mat));
      var alive = true, born = performance.now();
      new THREE.TextureLoader().load(rec.img, function (t) { t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; mat.uniforms.map.value = t; });
      (function draw() { if (!alive) return; if (mat.uniforms.map.value) r.render(scene, cam); requestAnimationFrame(draw); }());
      var sc = document.querySelector('a-scene'), loadedAt = 0, frames = 0;
      function ready() {
        if (!sc || !sc.hasLoaded) return false; if (!loadedAt) loadedAt = performance.now(); frames++;
        var f = document.getElementById('wf-fade'), fo = f ? parseFloat(getComputedStyle(f).opacity) : 0;   // the corridor's own spawn fade
        return frames > 8 && fo < 0.05 && performance.now() - loadedAt > 500;
      }
      (function wait() {
        if (ready() || performance.now() - born > 9000) {
          document.documentElement.style.background = ''; c.style.opacity = '0';
          setTimeout(function () { alive = false; c.remove(); try { mat.dispose(); r.dispose(); r.forceContextLoss(); } catch (e) {} }, 600);
          return;
        }
        requestAnimationFrame(wait);
      }());
    }
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }());

  window.WAYFARER.door = { leave: leave, create: create, roomExit: roomExit, capture: capture, PORTALS: PORTALS, CORRIDOR: CORRIDOR, frameMatrix: frameMatrix,
    dims: { DOOR_W: DOOR_W, DOOR_H: DOOR_H, FR_X: FR_X, FR_TOP: FR_TOP, HUB_Y: HUB_Y, PORTAL_Z: PORTAL_Z } };
}());
