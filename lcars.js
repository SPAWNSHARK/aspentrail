// SS Wayfarer — animated LCARS-style console panels (reference/lcars-ui.jpg), in the ship's palette:
// tan/amber/peach frames on black, teal readouts, violet bar-graph cells. One canvas per panel, redrawn ~8×/s
// (cheap on phones). Works with A-Frame's THREE or plain three r128.
//   var p = WAYFARER.lcars({ w: 512, h: 320, seed: 3, layout: 'readout' | 'graph' | 'keys', label: 'NAV' });
//   material.map = p.texture;   then every frame:  p.update(timeSeconds)
(function () {
  window.WAYFARER = window.WAYFARER || {};
  var C = { tan: '#d9a066', amber: '#ffb347', peach: '#f5c48a', rose: '#a8645e', gold: '#ffd36b', teal: '#47d6c8', lilac: '#a99be0', violet: '#6a2cff', dim: '#3a2a1a' };
  var FRAME = [C.tan, C.amber, C.peach, C.rose, C.gold];
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function h(n) { n = Math.sin(n * 127.1) * 43758.5453; return n - Math.floor(n); }
  function pill(x, X, Y, W, H, col) { var r = H / 2; x.fillStyle = col; x.beginPath(); x.arc(X + r, Y + r, r, Math.PI / 2, Math.PI * 1.5); x.lineTo(X + W - r, Y); x.arc(X + W - r, Y + r, r, -Math.PI / 2, Math.PI / 2); x.closePath(); x.fill(); }
  function text(x, s, X, Y, size, col, align) { x.save(); x.font = '600 ' + size + 'px "Arial Narrow","Helvetica Neue",Arial,sans-serif'; x.fillStyle = col; x.textAlign = align || 'left'; x.translate(X, Y); x.scale(0.78, 1); x.fillText(s, 0, 0); x.restore(); }
  // the swept "elbow": thick bar along the top + thick column down the left, rounded outer corner, inner radius
  function elbow(x, X, Y, W, H, bw, bh, col) {
    var R = Math.min(bh * 1.6, W * 0.3), r = bh * 0.7; x.fillStyle = col; x.beginPath();
    x.moveTo(X + R, Y); x.lineTo(X + W, Y); x.lineTo(X + W, Y + bh); x.lineTo(X + bw + r, Y + bh); x.quadraticCurveTo(X + bw, Y + bh, X + bw, Y + bh + r);
    x.lineTo(X + bw, Y + H); x.lineTo(X, Y + H); x.lineTo(X, Y + R); x.quadraticCurveTo(X, Y, X + R, Y); x.fill();
  }

  window.WAYFARER.lcars = function (o) {
    o = o || {};
    var THREE = window.THREE || (window.AFRAME && AFRAME.THREE);
    var W = o.w || 512, H = o.h || 320, seed = o.seed || 1, lay = o.layout || 'readout', label = o.label || 'LCARS', r = rng(seed * 991 + 7);
    var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    var tex = new THREE.CanvasTexture(c);
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace; else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    var bw = W * 0.16, bh = H * 0.075, fc = FRAME[seed % FRAME.length], code = (10 + (seed * 37) % 89) + '-' + (1000 + (seed * 7919) % 8999);
    var topSegs = [0.42, 0.22, 0.2], last = -1;

    function draw(t) {
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      // frame: elbow top-left, segmented top bar, a bottom bar with button labels
      elbow(x, 0, 0, W * 0.5, H * 0.62, bw, bh, fc);
      var sx = W * 0.5 + 4; topSegs.forEach(function (f, k) { var w = (W - sx) * f; x.fillStyle = FRAME[(seed + k + 1) % FRAME.length]; x.fillRect(sx, 0, w - 4, bh); text(x, (100 + (seed * 13 + k * 71) % 899) + '', sx + w - 10, bh * 0.8, bh * 0.7, '#000', 'right'); sx += w; });
      pill(x, sx - 2, 0, W - sx + 2 + bh, bh, C.teal);
      var yb = H - bh;
      x.fillStyle = FRAME[(seed + 2) % FRAME.length]; x.beginPath(); x.moveTo(0, H * 0.64 + 4); x.lineTo(bw, H * 0.64 + 4); x.lineTo(bw, yb); x.lineTo(W, yb); x.lineTo(W, H); x.lineTo(bh, H); x.quadraticCurveTo(0, H, 0, H - bh); x.fill();
      ['INIT', 'CALIBRATE', 'REF', 'MODE'].forEach(function (s, k) { var bx = bw + 6 + k * (W - bw) / 4; x.fillStyle = '#000'; x.fillRect(bx - 4, yb, 4, bh); text(x, s, bx + 4, H - bh * 0.22, bh * 0.66, '#000'); });
      text(x, label, bw - 6, H * 0.6 - 6, bh * 0.75, '#000', 'right');
      text(x, code, bw - 6, H - bh - 6, bh * 0.6, '#000', 'right');
      // a light sweeping down the left column
      var sw = (t * 0.35 + seed * 0.13) % 1; var g = x.createLinearGradient(0, sw * H - 30, 0, sw * H + 30); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,240,200,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, bh * 1.5, bw, H - bh * 3);

      var cx = bw + 16, cy = bh + 14, cw = W - cx - 12, ch = yb - cy - 10;
      if (lay === 'graph') {
        // violet bar-graph grid, levels breathing
        var cols = 14, rows = 5, gw = cw / cols, gh = ch / rows;
        for (var rr = 0; rr < rows; rr++) { var lvl = Math.floor(cols * (0.35 + 0.3 * Math.sin(t * (0.6 + h(rr + seed) * 1.2) + rr * 1.7 + seed) + 0.2 * h(Math.floor(t * 2) + rr)));
          for (var cc = 0; cc < cols; cc++) { x.strokeStyle = 'rgba(255,170,90,0.35)'; x.lineWidth = 1; x.strokeRect(cx + cc * gw + 1, cy + rr * gh + 2, gw - 2, gh - 4); if (cc < lvl) { x.fillStyle = cc > cols * 0.8 ? C.lilac : C.violet; x.fillRect(cx + cc * gw + 2, cy + rr * gh + 3, gw - 4, gh - 6); } } }
        x.fillStyle = '#ff5a3a'; var mk = cx + ((t * 0.12 + seed * 0.3) % 1) * cw; x.fillRect(mk, cy - 4, 2, ch + 8);
      } else if (lay === 'keys') {
        // rows of pill keys; one lights at a time, walking along
        var kc = 6, kr = 3, kw = cw / kc, kh = ch / kr, on = Math.floor(t * 3 + seed * 5) % (kc * kr);
        for (var j = 0; j < kc * kr; j++) { var kx = cx + (j % kc) * kw, ky = cy + Math.floor(j / kc) * kh; pill(x, kx + 3, ky + 4, kw - 6, kh - 8, j === on ? '#fff3d0' : FRAME[(j * 7 + seed) % FRAME.length]); text(x, (10 + (j * 37 + seed) % 89) + '', kx + kw - 12, ky + kh * 0.66, kh * 0.4, '#000', 'right'); }
      } else {
        // number columns scrolling up with status dots, a pulsing core gauge on the right
        var lh = ch / 8, step = Math.floor(t * 2.5), off = (t * 2.5 % 1) * lh, tw = cw * 0.58;
        x.save(); x.beginPath(); x.rect(cx, cy, tw, ch); x.clip();
        for (var n = -1; n < 9; n++) { var row = step + n + seed * 31, yy = cy + (n + 1) * lh - off;
          var d1 = h(row) < 0.5, d2 = h(row + 0.5) < 0.4; if (d1) { x.fillStyle = C.teal; x.beginPath(); x.arc(cx + 6, yy - lh * 0.3, lh * 0.18, 0, 7); x.fill(); } if (d2) { x.fillStyle = C.tan; x.beginPath(); x.arc(cx + 18, yy - lh * 0.3, lh * 0.18, 0, 7); x.fill(); }
          var s = ''; for (var q = 0; q < 4; q++) s += ('00' + Math.floor(h(row * 4 + q) * 999)).slice(-3) + ' ';
          text(x, s, cx + 30, yy, lh * 0.72, h(row + 0.2) < 0.3 ? C.amber : C.teal); }
        x.restore();
        var gx = cx + tw + 10, gwid = cw - tw - 10, nseg = 7, sh = ch / (nseg + 1), pulse = Math.floor(t * 4) % nseg;
        for (var k2 = 0; k2 < nseg; k2++) pill(x, gx + gwid * 0.15, cy + k2 * sh + sh * 0.5, gwid * 0.7, sh * 0.75, k2 === pulse ? '#fff6d8' : (k2 % 2 ? C.gold : C.amber));
        x.fillStyle = '#000'; x.fillRect(gx + gwid * 0.48, cy + sh * 0.4, gwid * 0.04, ch - sh * 0.6);
        text(x, (Math.floor(t * 7 + seed * 100) % 1000 + '').padStart(3, '0'), gx + gwid * 0.5, cy + ch, sh * 0.8, C.peach, 'center');
      }
      tex.needsUpdate = true;
    }
    draw(0);
    return { canvas: c, texture: tex, update: function (t) { var f = Math.floor(t * 8); if (f !== last) { last = f; draw(t); } } };
  };
}());
