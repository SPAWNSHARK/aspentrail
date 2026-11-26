// SS Wayfarer — ALIEN TV for the Crew Lounge (user, Nov 26: "an alien TV like interdimensional cable instead of the Wikipedia
// browser"). ORIGINAL channels, all drawn live on a canvas (no video files): tap the screen to flip channels (static burst + channel
// number). The droids and cats ignore it; you won't. Audio (alien babble, jingles) only when you're within ~8 m of the set.
(function () {
  if (!/lounge\.html/.test(location.pathname)) return;
  var W = 640, H = 360, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d'), tex = null, ch = 0, flip = 0, last = 0, nextSay = 0;
  var NEWS = ['Hiveport dice den reports record losses — house blames “a suspiciously lucky human”', 'Ship’s cat sits on navigation console; crew arrives at wrong galaxy, “honestly, it’s nicer”',
    'Cryovale snowman population votes to secede', 'Scientists confirm Bioships are “just misunderstood, and also very hungry”', 'Mandible Mints recalled for being “too minty”',
    'Pyraxis lava-surfing championship postponed: lava “a bit too hot this year”', 'Ferrum Prime machines deny having feelings, then cry quietly', 'Local droid wins Starjack, refuses to explain'];
  var ROCK = ['I have been here for four billion years.', 'You worry about time. I worry about erosion.', 'Every pebble was once a mountain with dreams.', 'Sit still. Longer. Longer. There. Now you understand.', 'I am not lazy. I am patient at a geological scale.'];
  var NAMES = ['KNN · K’VETAR NEWS', 'GLORPO’S KITCHEN', 'NEBULA NATURE HOUR', 'CRYOVALE WEATHER', 'BIOSHIP GRAND PRIX', 'MANDIBLE MINTS', 'THE TALKING ROCK'];
  function txt(s, X, Y, f, c, al) { x.font = f; x.fillStyle = c; x.textAlign = al || 'left'; x.fillText(s, X, Y); }
  function circ(X, Y, r, c) { x.beginPath(); x.arc(X, Y, r, 0, 6.283); x.fillStyle = c; x.fill(); }
  function kvetar(X, Y, s, talk, crest) {          // a friendly K'Vetar head: chitin oval, crest fins, big eyes, mandibles
    x.save(); x.translate(X, Y); x.scale(s, s);
    x.fillStyle = crest; for (var i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(i * 14 - 8, -46); x.lineTo(i * 14, -92 - (2 - Math.abs(i)) * 10); x.lineTo(i * 14 + 8, -46); x.fill(); }
    x.fillStyle = '#3a6a3c'; x.beginPath(); x.ellipse(0, 0, 52, 62, 0, 0, 6.283); x.fill(); x.fillStyle = '#4f8a4e'; x.beginPath(); x.ellipse(-8, -10, 34, 40, 0, 0, 6.283); x.fill();
    [-20, 20].forEach(function (ex) { circ(ex, -12, 13, '#f8e06a'); circ(ex + Math.sin(Date.now() / 900) * 3, -12, 6, '#121a10'); });
    var m = talk ? Math.abs(Math.sin(Date.now() / 90)) * 10 : 2; x.strokeStyle = '#1e3a1e'; x.lineWidth = 6; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-14, 26); x.lineTo(-22 - m, 44 + m); x.moveTo(14, 26); x.lineTo(22 + m, 44 + m); x.stroke();
    x.fillStyle = '#2a4a6a'; x.fillRect(-60, 62, 120, 60); x.restore();
  }
  var CH = [
    function (t) {   // KNN
      var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d2a5a'); g.addColorStop(1, '#061230'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (var i = 0; i < 9; i++) { x.fillStyle = 'rgba(120,180,255,' + (0.05 + 0.03 * Math.sin(t + i)) + ')'; x.fillRect(i * 80 - (t * 20 % 80), 40, 40, 200); }
      kvetar(320, 170, 1.15, (t * 2 % 7) < 5, '#3a7aff'); x.fillStyle = '#2a1a10'; x.fillRect(150, 250, 340, 40); txt('KNN', 320, 278, '800 22px sans-serif', '#ffd27a', 'center');
      x.fillStyle = '#c0182a'; x.fillRect(0, 300, W, 26); txt('BREAKING', 10, 319, '800 16px sans-serif', '#fff'); x.fillStyle = '#f2f2f2'; x.fillRect(100, 300, W - 100, 26);
      var tk = NEWS.join('   ✦   '), off = (t * 70) % (tk.length * 9); x.save(); x.beginPath(); x.rect(100, 300, W - 100, 26); x.clip(); txt(tk, 110 - off, 319, '600 16px sans-serif', '#111'); txt(tk, 110 - off + tk.length * 9, 319, '600 16px sans-serif', '#111'); x.restore();
      x.fillStyle = '#081030'; x.fillRect(0, 326, W, 34); txt('HIVEPORT  ▲ 3.2%    CRYOVALE ICE  ▼ 0.4%    TREAT FUTURES  ▲ 12%', 10, 348, '600 14px monospace', '#7fd8ff');
      x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(560, 16, 64, 28); txt('LIVE', 592, 36, '800 16px sans-serif', '#c0182a', 'center');
    },
    function (t) {   // Glorpo's Kitchen
      x.fillStyle = '#f6d9b8'; x.fillRect(0, 0, W, H); x.fillStyle = '#e8a878'; for (var i = 0; i < 16; i++) for (var j = 0; j < 9; j++) if ((i + j) % 2) x.fillRect(i * 40, j * 40, 40, 40);
      x.fillStyle = '#7a4a2a'; x.fillRect(0, 250, W, 110); var wob = Math.sin(t * 5) * 6;
      x.fillStyle = '#ff7ab0'; x.beginPath(); x.ellipse(250, 190 + wob * 0.3, 70 + wob, 80 - wob, 0, 0, 6.283); x.fill(); circ(230, 165, 10, '#fff'); circ(272, 165, 10, '#fff'); circ(232, 167, 5, '#222'); circ(274, 167, 5, '#222');
      x.strokeStyle = '#a02a5a'; x.lineWidth = 4; x.beginPath(); x.arc(252, 195, 18, 0.2, 2.9); x.stroke(); x.fillStyle = '#fff'; x.fillRect(205, 100, 90, 30); circ(220, 98, 20, '#fff'); circ(250, 90, 24, '#fff'); circ(280, 98, 20, '#fff');
      x.fillStyle = '#333'; x.beginPath(); x.ellipse(420, 250, 80, 22, 0, 0, 6.283); x.fill(); x.fillRect(340, 250, 160, 60); x.fillStyle = '#7aff6a'; x.beginPath(); x.ellipse(420, 250, 72, 16, 0, 0, 6.283); x.fill();
      for (var b = 0; b < 8; b++) { var by = 240 - ((t * 40 + b * 23) % 90); circ(380 + (b * 17) % 80, by, 4 + b % 3, 'rgba(160,255,140,.8)'); }
      x.strokeStyle = '#c08048'; x.lineWidth = 8; x.beginPath(); x.moveTo(310, 160); x.lineTo(400 + Math.sin(t * 4) * 25, 245); x.stroke();
      txt("GLORPO'S KITCHEN", 20, 44, '800 34px sans-serif', '#a02a5a'); txt('Today: Voidfruit soufflé (do not look directly at it)', 20, 72, '600 17px sans-serif', '#5a2a1a');
    },
    function (t) {   // Nebula Nature Hour
      x.fillStyle = '#020412'; x.fillRect(0, 0, W, H); var r = 1;
      for (var i = 0; i < 120; i++) { var sx = (i * 97 + (i % 3 + 1) * t * 30) % W, sy = (i * 53) % H; circ(W - sx, sy, (i % 3 === 0) ? 1.6 : 0.8, '#cfe0ff'); }
      var g = x.createRadialGradient(480, 120, 10, 480, 120, 200); g.addColorStop(0, 'rgba(160,80,255,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      var wx = ((t * 40) % (W + 400)) - 200, wy = 190 + Math.sin(t) * 20; x.save(); x.translate(wx, wy);
      x.fillStyle = '#4a6ab0'; x.beginPath(); x.ellipse(0, 0, 150, 55, 0, 0, 6.283); x.fill(); x.fillStyle = '#9ab8ff'; x.beginPath(); x.ellipse(10, 20, 120, 25, 0, 0, Math.PI); x.fill();
      var f = Math.sin(t * 2) * 30; x.fillStyle = '#3a58a0'; x.beginPath(); x.moveTo(-140, 0); x.lineTo(-210, -40 + f); x.lineTo(-200, 40 + f); x.fill(); x.beginPath(); x.moveTo(0, 20); x.lineTo(-30, 80 - f / 2); x.lineTo(30, 40); x.fill();
      circ(105, -10, 7, '#fff'); circ(107, -10, 3.5, '#111'); for (var k = 0; k < 6; k++) circ(-60 + k * 30, -30, 3, 'rgba(255,255,255,.7)'); x.restore();
      x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 310, W, 50); txt('“The void whale migrates 40,000 light-years to sing one note to its mother.”', W / 2, 342, 'italic 600 17px Georgia, serif', '#fff', 'center');
      txt('NEBULA NATURE HOUR', 20, 36, '800 22px sans-serif', '#b8c8ff');
    },
    function (t) {   // Cryovale Weather
      x.fillStyle = '#9ad0f0'; x.fillRect(0, 0, W, H); x.fillStyle = '#e8f6ff'; x.beginPath(); x.moveTo(60, 300); for (var i = 0; i <= 10; i++) x.lineTo(60 + i * 45, 120 + Math.sin(i * 1.7) * 50); x.lineTo(510, 300); x.fill();
      x.strokeStyle = 'rgba(40,90,140,.3)'; x.lineWidth = 1; for (i = 0; i < 12; i++) { x.beginPath(); x.moveTo(60 + i * 40, 60); x.lineTo(60 + i * 40, 300); x.stroke(); }
      for (i = 0; i < 18; i++) { var sx = 80 + (i * 67) % 420, sy = (t * 50 + i * 41) % 260 + 40; txt('❄', sx, sy, '18px sans-serif', '#fff'); }
      txt('−140°', 300, 200, '800 54px sans-serif', '#1a4a8a', 'center'); txt('TODAY: snow · TOMORROW: more snow · WEEKEND: a surprise (snow)', W / 2, 340, '700 16px sans-serif', '#0a2a5a', 'center');
      x.fillStyle = '#6a3aa0'; x.fillRect(540, 120, 40, 160); circ(560, 105, 28, '#9a6ad0'); circ(552, 100, 6, '#fff'); circ(568, 100, 6, '#fff');
      x.strokeStyle = '#6a3aa0'; x.lineWidth = 8; x.beginPath(); x.moveTo(545, 160); x.lineTo(470 + Math.sin(t * 2) * 30, 140); x.stroke(); txt('CRYOVALE WEATHER', 20, 36, '800 24px sans-serif', '#0a2a5a');
    },
    function (t) {   // Bioship Grand Prix
      x.fillStyle = '#100818'; x.fillRect(0, 0, W, H); x.strokeStyle = '#ffb050'; x.lineWidth = 34; x.beginPath(); x.ellipse(300, 190, 230, 120, 0, 0, 6.283); x.stroke(); x.strokeStyle = '#2a1830'; x.lineWidth = 28; x.stroke();
      x.setLineDash([12, 12]); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.beginPath(); x.ellipse(300, 190, 230, 120, 0, 0, 6.283); x.stroke(); x.setLineDash([]);
      var cols = ['#ff5a5a', '#5affb0', '#5ab0ff', '#ffd75a'], pos = [];
      cols.forEach(function (c, i) { var a = t * (0.9 + i * 0.07) + i * 0.4; pos.push([a, i]); var px = 300 + Math.cos(a) * 230, py = 190 + Math.sin(a) * 120; x.save(); x.translate(px, py); x.rotate(a + Math.PI / 2); x.fillStyle = c; x.beginPath(); x.ellipse(0, 0, 9, 16, 0, 0, 6.283); x.fill(); circ(0, 14, 5, 'rgba(255,200,120,.8)'); x.restore(); });
      pos.sort(function (a, b) { return b[0] - a[0]; }); x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(W - 160, 20, 150, 120);
      pos.forEach(function (p, k) { txt((k + 1) + '. ' + ['GOOPZILLA', 'SLIMEBOLT', 'TENTACLE TED', 'MAMA SPORE'][p[1]], W - 150, 46 + k * 26, '700 15px sans-serif', cols[p[1]]); });
      txt('BIOSHIP GRAND PRIX · LAP ' + (1 + Math.floor(t / 6.5) % 50), 20, 36, '800 20px sans-serif', '#ffb050');
    },
    function (t) {   // Mandible Mints ad
      var g = x.createRadialGradient(320, 180, 10, 320, 180, 400); g.addColorStop(0, '#7affd0'); g.addColorStop(1, '#0a6a5a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.save(); x.translate(320, 180); x.rotate(t * 0.3); for (var i = 0; i < 16; i++) { x.rotate(Math.PI / 8); x.fillStyle = i % 2 ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,0)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(400, -60); x.lineTo(400, 60); x.fill(); } x.restore();
      var b = Math.abs(Math.sin(t * 3)) * -30; x.fillStyle = '#e8f4f0'; x.fillRect(250, 150 + b, 140, 90); x.fillStyle = '#0a8a70'; x.fillRect(250, 180 + b, 140, 30); txt('MANDIBLE', 320, 201 + b, '800 18px sans-serif', '#fff', 'center');
      txt('MANDIBLE MINTS', W / 2, 70, '900 44px sans-serif', '#fff', 'center'); txt('Now with 40% more mandible!*', W / 2, 290, '800 24px sans-serif', '#063a30', 'center');
      txt('*Mandible not included. Do not feed to Bioships.', W / 2, 340, '600 13px sans-serif', 'rgba(0,40,30,.8)', 'center');
    },
    function (t) {   // The Talking Rock
      x.fillStyle = '#3a3048'; x.fillRect(0, 0, W, H); x.fillStyle = '#5a5070'; x.fillRect(0, 250, W, 110);
      x.fillStyle = '#8a8478'; x.beginPath(); x.moveTo(200, 270); x.bezierCurveTo(190, 150, 300, 110, 380, 150); x.bezierCurveTo(470, 190, 460, 270, 440, 270); x.fill();
      circ(290, 190, 18, '#fff'); circ(350, 190, 18, '#fff'); circ(292 + Math.sin(t) * 5, 192, 8, '#111'); circ(352 + Math.sin(t) * 5, 192, 8, '#111');
      var line = ROCK[Math.floor(t / 6) % ROCK.length]; x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 300, W, 60); txt('“' + line + '”', W / 2, 337, 'italic 600 19px Georgia, serif', '#fff', 'center');
      txt('THE TALKING ROCK', 20, 36, '800 22px sans-serif', '#d8d0c0');
    }
  ];
  function staticNoise() { var id = x.createImageData(W, H), d = id.data; for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } x.putImageData(id, 0, 0); }
  function near() { var sc = document.querySelector('a-scene'); if (!sc || !sc.camera) return false; var p = new AFRAME.THREE.Vector3(); sc.camera.getWorldPosition(p); return Math.hypot(p.x, p.z + 7.6) < 8.5; }
  function channel(n) { ch = (n + CH.length) % CH.length; flip = 0.35; if (window.WF_SOUND && near()) { WF_SOUND.zap(0, 0.5); setTimeout(function () { WF_SOUND.chime(true); }, 380); } if (window.WF_LIFE) WF_LIFE.event('tv'); }
  AFRAME.registerComponent('wf-alien-tv', {
    init: function () {
      var THREE = AFRAME.THREE, el = document.getElementById('tv-screen');
      tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      var put = function () { var m = el.getObject3D('mesh'); if (!m) return setTimeout(put, 200); m.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); };
      put();
      document.querySelectorAll('a-text').forEach(function (t) { var v = t.getAttribute('value') || ''; if (/CREW TERMINAL|TAP SCREEN TO BROWSE/.test(v)) t.parentNode.removeChild(t); });
      var bar = el.parentNode.querySelector('a-box[width="4.2"]'); if (bar) bar.parentNode.removeChild(bar);
      el.addEventListener('click', function (e) { e.stopPropagation && e.stopPropagation(); var p = document.getElementById('tv-panel'); if (p) p.classList.remove('open'); channel(ch + 1); });
    },
    tick: function (t, dt) {
      if (t - last < 66) return; last = t; var s = t / 1000;
      if (flip > 0) { flip -= 0.066; staticNoise(); txt('CH ' + (ch + 1), W - 30, 60, '800 44px monospace', '#7fff7f', 'right'); }
      else { CH[ch](s); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, W, 4); for (var y = 0; y < H; y += 3) { x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, y, W, 1); }   // scanlines
        if (s < 3 || flip > -1.4) { txt(NAMES[ch], W - 14, H - 14, '700 13px monospace', 'rgba(140,255,140,.85)', 'right'); flip -= 0.066; } }
      tex.needsUpdate = true;
      if (s > nextSay && near()) { nextSay = s + 4 + Math.random() * 5; if (window.WF_SOUND) { if (ch === 0) WF_SOUND.speak(NEWS[Math.floor(Math.random() * NEWS.length)], 'kvetar', { vol: 0.5 }); else if (ch === 2) WF_SOUND.alien('hum', 0, 0.5); else if (ch === 6) WF_SOUND.alien('growl', 0, 0.35); else if (ch === 1) WF_SOUND.alien('trill', 0, 0.4); } }
    }
  });
  function attach() { var s = document.querySelector('a-scene'); if (!s) return; if (s.hasLoaded) s.setAttribute('wf-alien-tv', ''); else s.addEventListener('loaded', function () { s.setAttribute('wf-alien-tv', ''); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
  window.WF_TV = { channel: function (n) { channel(n); }, next: function () { channel(ch + 1); } };
}());
