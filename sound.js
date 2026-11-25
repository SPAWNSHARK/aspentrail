// SS Wayfarer — every sound, synthesised live with WebAudio (no audio files). Shared by every page.
// iOS only lets audio start after a touch, so the engine unlocks on the first tap / key. Mute: the speaker button or key M
// (localStorage 'wf-mute'). MUSIC plays only in Flight Mode and its transition scenes (user, Nov 25).
//   WF_SOUND.hum(on)        interior ship hum (auto on A-Frame pages)      WF_SOUND.warp(0..1)   light-speed whoosh layer
//   WF_SOUND.door() .step() .beep() .meow() .murmur(on)                     interior one-shots / beds
//   WF_SOUND.laser() .enemyLaser() .boom(big) .flyby(pan) .engine(on) .warpRise()   Flight Mode
//   WF_SOUND.music(mode|null)  'explore' | 'combat' | null (fade out)        WF_SOUND.button(parent)  adds the mute toggle
(function () {
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null, master = null, sfx = null, mus = null, noiseBuf = null;
  var muted = false; try { muted = localStorage.getItem('wf-mute') === '1'; } catch (e) {}
  var pending = [], humNodes = null, warpNodes = null, engineNodes = null, murmurNodes = null, musicState = null;
  function init() {
    if (ctx || !AC) return !!ctx;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(comp); mus = ctx.createGain(); mus.gain.value = 0.45; mus.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); var d = noiseBuf.getChannelData(0), last = 0;
    for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = w * 0.5 + last * 3.0; }   // white + brown
    return true;
  }
  function unlock() { if (!init()) return; if (ctx.state === 'suspended') ctx.resume(); var p = pending; pending = []; p.forEach(function (f) { f(); }); }
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(function (n) { addEventListener(n, unlock, { capture: true, passive: true }); });
  function ready(f) { if (ctx && ctx.state === 'running') f(); else { pending.push(f); if (ctx) ctx.resume(); } }
  function now() { return ctx.currentTime; }
  function noise(dur) { var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = dur == null; return s; }
  function env(g, t, a, peak, dcy) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy); }
  function osc(type, f) { var o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; }
  function out(node, pan, bus) { if (pan && ctx.createStereoPanner) { var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node.connect(p); p.connect(bus || sfx); } else node.connect(bus || sfx); }

  var S = {
    muted: function () { return muted; },
    setMute: function (m) { muted = m; try { localStorage.setItem('wf-mute', m ? '1' : '0'); } catch (e) {} if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, now(), 0.05); document.querySelectorAll('.wf-snd').forEach(function (b) { b.innerHTML = icon(); }); },
    // ── interior beds ──
    hum: function (on) { ready(function () {
      if (on && !humNodes) { var g = ctx.createGain(); g.gain.value = 0; g.connect(sfx); var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; lp.connect(g);
        var o1 = osc('sawtooth', 48), o2 = osc('sawtooth', 48.6), o3 = osc('sine', 96); [o1, o2].forEach(function (o) { o.connect(lp); o.start(); }); var g3 = ctx.createGain(); g3.gain.value = 0.25; o3.connect(g3); g3.connect(g); o3.start();
        var n = noise(), nl = ctx.createBiquadFilter(); nl.type = 'lowpass'; nl.frequency.value = 340; var ng = ctx.createGain(); ng.gain.value = 0.35; n.connect(nl); nl.connect(ng); ng.connect(g); n.start();
        var lfo = osc('sine', 0.13), lg = ctx.createGain(); lg.gain.value = 40; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
        g.gain.setTargetAtTime(0.11, now(), 1.2); humNodes = { g: g, stop: [o1, o2, o3, n, lfo] }; }
      if (!on && humNodes) { humNodes.g.gain.setTargetAtTime(0, now(), 0.4); var h = humNodes; humNodes = null; setTimeout(function () { h.stop.forEach(function (o) { try { o.stop(); } catch (e) {} }); }, 1500); }
    }); },
    warp: function (v) { if (!ctx || ctx.state !== 'running') return;   // light-speed whoosh layer, 0..1
      if (!warpNodes) { var g = ctx.createGain(); g.gain.value = 0; g.connect(sfx); var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.7; bp.connect(g); var n = noise(); n.connect(bp); n.start();
        var lfo = osc('sine', 0.4), lg = ctx.createGain(); lg.gain.value = 300; lfo.connect(lg); lg.connect(bp.frequency); lfo.start(); warpNodes = { g: g }; }
      warpNodes.g.gain.setTargetAtTime(0.18 * v, now(), 0.3); },
    murmur: function (on) { ready(function () {   // club crowd: many soft voices = band-limited noise with slow wobble
      if (on && !murmurNodes) { var g = ctx.createGain(); g.gain.value = 0; g.connect(sfx); var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 1.1; bp.connect(g); var n = noise(); n.connect(bp); n.start();
        var lfo = osc('sine', 0.7), lg = ctx.createGain(); lg.gain.value = 160; lfo.connect(lg); lg.connect(bp.frequency); lfo.start(); g.gain.setTargetAtTime(0.09, now(), 1); murmurNodes = { g: g }; }
      if (!on && murmurNodes) murmurNodes.g.gain.setTargetAtTime(0, now(), 0.3);
    }); },
    // ── interior one-shots ──
    door: function () { ready(function () { var t = now(), n = noise(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(2400, t); bp.frequency.exponentialRampToValueAtTime(500, t + 0.55);
      n.connect(bp); bp.connect(g); env(g, t, 0.02, 0.35, 0.6); out(g); n.start(t); n.stop(t + 0.8);
      var o = osc('sine', 90), og = ctx.createGain(); o.frequency.exponentialRampToValueAtTime(45, t + 0.25); o.connect(og); env(og, t + 0.45, 0.01, 0.4, 0.3); out(og); o.start(t + 0.45); o.stop(t + 0.9); }); },
    step: function () { if (!ctx || ctx.state !== 'running') return; var t = now(), n = noise(), lp = ctx.createBiquadFilter(), g = ctx.createGain(); lp.type = 'lowpass'; lp.frequency.value = 380 + Math.random() * 120;
      n.connect(lp); lp.connect(g); env(g, t, 0.005, 0.22, 0.12); out(g); n.start(t, Math.random()); n.stop(t + 0.2); },
    beep: function (pan) { ready(function () {   // droid chatter: quick chirps and warbles
      var t = now(), k = 3 + Math.floor(Math.random() * 6);
      for (var i = 0; i < k; i++) { var o = osc(Math.random() < 0.7 ? 'sine' : 'triangle', 900 + Math.random() * 2400), g = ctx.createGain(), d = 0.04 + Math.random() * 0.09;
        if (Math.random() < 0.4) o.frequency.exponentialRampToValueAtTime(600 + Math.random() * 3000, t + d); o.connect(g); env(g, t, 0.005, 0.07, d); out(g, pan); o.start(t); o.stop(t + d + 0.05); t += d + Math.random() * 0.05; } }); },
    meow: function (pan) { ready(function () {   // a cat: sawtooth through a moving formant, pitch rising then falling
      var t = now(), f0 = 520 + Math.random() * 260, dur = 0.5 + Math.random() * 0.4, o = osc('sawtooth', f0), bp = ctx.createBiquadFilter(), bp2 = ctx.createBiquadFilter(), g = ctx.createGain();
      o.frequency.setValueAtTime(f0 * 0.85, t); o.frequency.linearRampToValueAtTime(f0 * 1.25, t + dur * 0.35); o.frequency.linearRampToValueAtTime(f0 * 0.7, t + dur);
      bp.type = 'bandpass'; bp.Q.value = 6; bp.frequency.setValueAtTime(900, t); bp.frequency.linearRampToValueAtTime(1800, t + dur * 0.4); bp.frequency.linearRampToValueAtTime(700, t + dur);
      bp2.type = 'bandpass'; bp2.Q.value = 8; bp2.frequency.value = 2900; var g2 = ctx.createGain(); g2.gain.value = 0.4;
      o.connect(bp); o.connect(bp2); bp2.connect(g2); g2.connect(g); bp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.06); g.gain.setValueAtTime(0.22, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      out(g, pan); o.start(t); o.stop(t + dur + 0.05); }); },
    // ── Flight Mode ──
    laser: function () { if (!ctx || ctx.state !== 'running') return; var t = now(), o = osc('square', 1600), o2 = osc('sawtooth', 1210), g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800;
      [o, o2].forEach(function (x) { x.frequency.exponentialRampToValueAtTime(220, t + 0.16); x.connect(lp); x.start(t); x.stop(t + 0.2); }); lp.connect(g); env(g, t, 0.004, 0.16, 0.16); out(g, (Math.random() - 0.5) * 0.3); },
    enemyLaser: function (pan) { if (!ctx || ctx.state !== 'running') return; var t = now(), o = osc('sawtooth', 700), g = ctx.createGain(); o.frequency.exponentialRampToValueAtTime(140, t + 0.25); o.connect(g); env(g, t, 0.005, 0.09, 0.25); out(g, pan); o.start(t); o.stop(t + 0.3); },
    boom: function (big, pan) { if (!ctx || ctx.state !== 'running') return; var t = now(), n = noise(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), L = big ? 2.2 : 0.9;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(big ? 2400 : 1800, t); lp.frequency.exponentialRampToValueAtTime(120, t + L); n.connect(lp); lp.connect(g); env(g, t, 0.01, big ? 0.9 : 0.5, L); out(g, pan); n.start(t, Math.random()); n.stop(t + L + 0.1);
      var o = osc('sine', big ? 70 : 110), og = ctx.createGain(); o.frequency.exponentialRampToValueAtTime(30, t + 0.6); o.connect(og); env(og, t, 0.005, big ? 0.7 : 0.4, 0.6); out(og, pan); o.start(t); o.stop(t + 0.7); },
    flyby: function (pan, alien) { if (!ctx || ctx.state !== 'running') return;   // doppler whoosh past the ship
      var t = now(), n = noise(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = 'bandpass'; bp.Q.value = 2.5; bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(380, t + 0.9);
      n.connect(bp); bp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); out(g, pan); n.start(t, Math.random()); n.stop(t + 1.1);
      if (alien) { var o = osc('triangle', 420), og = ctx.createGain(); o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(210, t + 0.9); var tr = osc('sine', 18), tg = ctx.createGain(); tg.gain.value = 60; tr.connect(tg); tg.connect(o.frequency); tr.start(t); tr.stop(t + 1);
        o.connect(og); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.1, t + 0.35); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.95); out(og, pan); o.start(t); o.stop(t + 1); } },
    engine: function (on) { ready(function () {
      if (on && !engineNodes) { var g = ctx.createGain(); g.gain.value = 0; g.connect(sfx); var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(g);
        var n = noise(); n.connect(lp); n.start(); var o = osc('sawtooth', 62), og = ctx.createGain(); og.gain.value = 0.3; o.connect(og); og.connect(lp); o.start(); g.gain.setTargetAtTime(0.1, now(), 1); engineNodes = { g: g }; }
      if (!on && engineNodes) engineNodes.g.gain.setTargetAtTime(0, now(), 0.3); }); },
    warpRise: function () { ready(function () { var t = now(), n = noise(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = 'bandpass'; bp.Q.value = 1.5; bp.frequency.setValueAtTime(200, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 2.6);
      n.connect(bp); bp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.45, t + 2.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4); out(g); n.start(t); n.stop(t + 3.5);
      var o = osc('sawtooth', 80), og = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; o.frequency.exponentialRampToValueAtTime(640, t + 2.8); o.connect(lp); lp.connect(og); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.12, t + 2.4); og.gain.exponentialRampToValueAtTime(0.0001, t + 3.2); out(og); o.start(t); o.stop(t + 3.3); }); },
    // ── MUSIC: generative space score. explore = slow pads + sparse arpeggio; combat = adds a pulsing bass and a soft beat ──
    music: function (mode) { ready(function () {
      if (!mode) { if (musicState) { var ms = musicState; musicState = null; ms.bus.gain.setTargetAtTime(0, now(), 0.8); clearInterval(ms.iv); setTimeout(function () { ms.bus.disconnect(); }, 4000); } return; }
      if (musicState) { musicState.mode = mode; return; }
      var bus = ctx.createGain(); bus.gain.value = 0; bus.connect(mus); bus.gain.setTargetAtTime(1, now(), 1.5);
      var dly = ctx.createDelay(1.0), fb = ctx.createGain(), dg = ctx.createGain(); dly.delayTime.value = 0.42; fb.gain.value = 0.35; dg.gain.value = 0.35; dly.connect(fb); fb.connect(dly); dly.connect(dg); dg.connect(bus);
      var CH = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], BPM = 84, beat = 60 / BPM, step = 0, next = now() + 0.1;
      function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
      function pad(notes, t, d) { notes.forEach(function (m) { [-0.07, 0.07].forEach(function (dt) { var o = osc('sawtooth', hz(m - 12) * (1 + dt / 100)), lp = ctx.createBiquadFilter(), g = ctx.createGain(); lp.type = 'lowpass'; lp.frequency.value = 900; o.connect(lp); lp.connect(g); g.connect(bus);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + d * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + d * 1.05); o.start(t); o.stop(t + d * 1.1); }); }); }
      function pluck(m, t, v) { var o = osc('triangle', hz(m)), g = ctx.createGain(); o.connect(g); g.connect(bus); g.connect(dly); env(g, t, 0.005, v, 0.5); o.start(t); o.stop(t + 0.6); }
      function bass(m, t) { var o = osc('sawtooth', hz(m - 24)), lp = ctx.createBiquadFilter(), g = ctx.createGain(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(140, t + 0.2); o.connect(lp); lp.connect(g); g.connect(bus); env(g, t, 0.005, 0.12, 0.22); o.start(t); o.stop(t + 0.3); }
      function kick(t) { var o = osc('sine', 120), g = ctx.createGain(); o.frequency.exponentialRampToValueAtTime(42, t + 0.15); o.connect(g); g.connect(bus); env(g, t, 0.003, 0.35, 0.2); o.start(t); o.stop(t + 0.3); }
      function hat(t) { var n = noise(), hp = ctx.createBiquadFilter(), g = ctx.createGain(); hp.type = 'highpass'; hp.frequency.value = 7000; n.connect(hp); hp.connect(g); g.connect(bus); env(g, t, 0.002, 0.05, 0.05); n.start(t, Math.random()); n.stop(t + 0.08); }
      musicState = { bus: bus, mode: mode, iv: setInterval(function () {
        while (next < now() + 0.25) {                       // schedule a little ahead
          var bar = Math.floor(step / 8), ch = CH[bar % 4], s8 = step % 8, cb = musicState && musicState.mode === 'combat';
          if (s8 === 0) pad(ch, next, beat * 4);
          if (Math.random() < (cb ? 0.6 : 0.35)) pluck(ch[Math.floor(Math.random() * 3)] + 12 * (Math.random() < 0.4 ? 1 : 0), next, cb ? 0.05 : 0.04);
          if (cb) { if (s8 % 2 === 0) bass(ch[0], next); if (s8 % 4 === 0) kick(next); if (s8 % 2 === 1) hat(next); }
          next += beat / 2; step++;
        } }, 60) };
    }); },
    button: function (parent, style) {
      var b = document.createElement('b'); b.className = 'wf-snd'; b.setAttribute('aria-label', 'Sound'); b.innerHTML = icon();
      if (style) b.style.cssText = style;
      ['pointerdown', 'touchstart'].forEach(function (n) { b.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); });
      b.addEventListener('pointerup', function (e) { e.stopPropagation(); unlock(); S.setMute(!muted); });
      parent.appendChild(b); return b;
    }
  };
  function icon() { return '<svg viewBox="0 0 24 24" style="width:22px;height:22px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M4 9h4l5-4v14l-5-4H4z"/>' + (muted ? '<path d="M16 9l5 6M21 9l-5 6"/>' : '<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/>') + '</svg>'; }
  addEventListener('keydown', function (e) { if (e.code === 'KeyM') { unlock(); S.setMute(!muted); } });
  window.WF_SOUND = S;
  // A-Frame interior pages: the hum starts with the first touch, and a mute button joins the controls
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('a-scene')) return;
    S.hum(true);
    setTimeout(function () { var row = document.getElementById('wf-btns');
      if (row) { var b = S.button(row); b.classList.add('wf-ctl'); }
      else S.button(document.body, 'position:fixed;z-index:15;right:136px;bottom:16px;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;background:linear-gradient(140deg,rgba(255,255,255,.16),rgba(255,255,255,.03) 48%,rgba(255,255,255,.07)),rgba(22,22,28,.38);-webkit-backdrop-filter:blur(22px) saturate(185%);backdrop-filter:blur(22px) saturate(185%);border:1px solid rgba(255,255,255,.24)');
    }, 500);
  });
}());
