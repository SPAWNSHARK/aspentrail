// SS Wayfarer — iOS-STYLE MENU BAR (user, Nov 26: "the menu bar icons aren't showing up… more like the iOS layout: a clock at the
// top left, more emojis… obvious icons, a Google-Maps pin for the map, spread out more, a settings gear on the far right that
// pops down and contains the level, the VR and the 3rd-person settings"). Load LAST on every page that has #wf-btns.
// Nov 27 (user: "not emojis — icons in a specific theme… space, digital, VR"): every glyph is now an inline SVG HUD icon on a dark
// glass tile with a neon accent (ICONS / ic()); no emoji anywhere on the bar, the credits chip or the settings sheet.
// It doesn't create the old buttons — mobile.js (Gyro, Level), sound.js (Sound), avatar.js (View), life.js (Log) and ai.js
// (Halcyon) still do. This file re-dresses them as emoji, adds Map and Manual, a live clock, and moves Gyro / Level /
// View into the settings drop-down.
(function () {
  var css = document.createElement('style');
  css.textContent =
    'html,body{position:fixed!important;top:0;left:0;right:0;bottom:0;width:100%!important;height:var(--wf-h,100%)!important;min-height:var(--wf-h,100%)!important;overflow:hidden;background:#000}' +
    'a-scene,a-scene .a-canvas,a-scene canvas.a-canvas{position:fixed!important;top:0!important;left:0!important;width:100%!important;height:var(--wf-h,100%)!important}' +
    '#wf-btns{justify-content:flex-end!important;gap:6px!important;box-sizing:border-box!important;height:calc(62px + env(safe-area-inset-top,0px))!important;padding-top:calc(env(safe-area-inset-top,0px) + 16px)!important;' +
      'background:linear-gradient(180deg,rgba(5,8,20,.97),rgba(10,16,34,.92))!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background-color:#070b1c!important;border-bottom:1px solid rgba(77,227,255,.30)!important;box-shadow:0 1px 14px rgba(60,140,255,.18)!important;' +
      'padding-left:calc(14px + env(safe-area-inset-left,0px))!important;padding-right:calc(8px + env(safe-area-inset-right,0px))!important}' +
    '#wf-btns:before{display:none!important}' +
    '#wf-clock{margin-right:auto;display:flex;align-items:center;font:700 16px -apple-system,system-ui,sans-serif;color:#e8f6ff;letter-spacing:.4px;font-variant-numeric:tabular-nums;text-shadow:0 0 8px rgba(77,227,255,.45)}' +
    '#wf-clock small{display:inline-flex;align-items:center;gap:4px;font:700 11px -apple-system,system-ui,sans-serif;color:#7fe8ff;margin-left:10px;letter-spacing:.6px}' +
    '#wf-btns > b{width:38px!important;height:36px!important;border-radius:10px!important;display:inline-flex!important;align-items:center;justify-content:center}' +
    '.ic{--c:#4de3ff;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;pointer-events:none;box-sizing:border-box;' +
      'background:radial-gradient(120% 120% at 25% 15%,rgba(255,255,255,.14),rgba(255,255,255,0) 45%),linear-gradient(160deg,#141c42,#080c20);border:1px solid color-mix(in srgb,var(--c) 55%,transparent);' +
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 0 10px color-mix(in srgb,var(--c) 38%,transparent)}' +
    '.ic svg{width:18px!important;height:18px!important;display:block!important;fill:none;stroke:var(--c);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px var(--c))}' +
    '#wf-set .ic{width:28px;height:28px;flex:none}' +
    '#wf-btns > b:active .ic,#wf-btns > b.open .ic{transform:scale(.92);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 0 16px color-mix(in srgb,var(--c) 70%,transparent)}' +
    '#wf-btns > b:active,#wf-btns > b.open{background:none!important}' +
    '#wf-set{position:fixed;right:calc(8px + env(safe-area-inset-right,0px));top:calc(72px + env(safe-area-inset-top,0px));z-index:70;display:none;min-width:230px;padding:8px;border-radius:18px;' +
      'background:linear-gradient(140deg,rgba(120,180,255,.12),rgba(120,180,255,.03)),rgba(8,12,28,.94);-webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);border:1px solid rgba(77,227,255,.30);box-shadow:0 14px 34px rgba(0,0,0,.55),0 0 18px rgba(60,140,255,.18)}' +
    '#wf-set.open{display:block}#wf-set b{display:flex!important;align-items:center;gap:12px;width:auto!important;height:auto!important;padding:8px 10px!important;border-radius:12px!important;cursor:pointer;color:#e8f6ff;font:600 14px -apple-system,system-ui,sans-serif}' +
    '#wf-set b svg.raw{display:none!important}#wf-set b .lb{flex:1}#wf-set b .st{color:#7fe8ff;font-size:12px}#wf-set b:active,#wf-set b.on{background:rgba(77,227,255,.14)!important}' +
    '#wf-set .t{font:800 10.5px -apple-system,system-ui,sans-serif;letter-spacing:2.5px;color:#7fa8d8;padding:4px 12px 6px}';
  document.head.appendChild(css);
  // Standalone (Home Screen app) fix, Nov 27: iOS reports a layout viewport ~44 pt shorter than the screen, leaving a black band under the
  // scene even with position:fixed 100%. Measure the real screen height and size everything in px.
  function fitH() {
    var sa = !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));
    if (!sa) { document.documentElement.style.removeProperty('--wf-h'); return; }
    var p = Math.abs(window.orientation) === 90 || innerWidth > innerHeight;
    var sh = p ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
    var h = Math.max(innerHeight, sh);
    document.documentElement.style.setProperty('--wf-h', h + 'px');
  }
  fitH(); addEventListener('resize', fitH); addEventListener('orientationchange', function () { setTimeout(fitH, 300); });


  // HUD line icons (24×24, stroke only) + each one's neon accent — space / digital / VR theme
  var ICONS = {
    map:    ['#4de3ff', '<path d="M12 21.5s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10.5" r="2.3"/>'],
    log:    ['#8aa4ff', '<rect x="5.5" y="4" width="13" height="17" rx="2.2"/><path d="M9.5 4V2.8h5V4M8.8 9.5h6.4M8.8 13h6.4M8.8 16.5h3.6"/>'],
    ai:     ['#c58bff', '<path d="M12 5.4v14.2"/><path d="M12 6c-1-1.8-3.8-2.2-5-.6-1.7-.2-3 1.3-2.6 2.9-1.4.9-1.4 3 0 4-.6 1.7.6 3.4 2.3 3.4.5 1.6 2.4 2.4 3.9 1.6"/><path d="M12 6c1-1.8 3.8-2.2 5-.6 1.7-.2 3 1.3 2.6 2.9 1.4.9 1.4 3 0 4 .6 1.7-.6 3.4-2.3 3.4-.5 1.6-2.4 2.4-3.9 1.6"/><path d="M8.2 10.4c1 0 1.9.5 2.1 1.6M15.8 10.4c-1 0-1.9.5-2.1 1.6M8.6 15c.8-.3 1.6 0 2 .7M15.4 15c-.8-.3-1.6 0-2 .7"/>'],
    manual: ['#6ff0c4', '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.5a2.8 2.8 0 1 1 4 2.5c-1 .5-1.3 1.1-1.3 2.1"/><path d="M12 17.2v.3"/>'],
    sound:  ['#4de3ff', '<path d="M4 9.6h3.2L12 5.8v12.4l-4.8-3.8H4z"/><path d="M15.2 9.2a4 4 0 0 1 0 5.6M17.8 6.6a7.6 7.6 0 0 1 0 10.8"/>'],
    mute:   ['#ff6f9a', '<path d="M4 9.6h3.2L12 5.8v12.4l-4.8-3.8H4z"/><path d="M15.6 9.6l5 4.8M20.6 9.6l-5 4.8"/>'],
    gear:   ['#b6c6ff', '<circle cx="12" cy="12" r="3.1"/><circle cx="12" cy="12" r="7.6" stroke-dasharray="3.3 2.55"/><circle cx="12" cy="12" r="9.6" opacity=".45"/>'],
    vr:     ['#c58bff', '<path d="M3.2 8.6h17.6v7.3a2.1 2.1 0 0 1-2.1 2.1h-3.5l-1.6-2.4h-3.2l-1.6 2.4H5.3a2.1 2.1 0 0 1-2.1-2.1z"/><path d="M7.2 8.6V7.2M16.8 8.6V7.2"/>'],
    level:  ['#6ff0c4', '<rect x="3" y="8.6" width="18" height="6.8" rx="3.4"/><circle cx="12" cy="12" r="1.4"/><path d="M8 8.6v6.8M16 8.6v6.8"/>'],
    person: ['#4de3ff', '<circle cx="12" cy="7.8" r="3.3"/><path d="M5.4 20.5c.6-3.7 3.2-5.6 6.6-5.6s6 1.9 6.6 5.6"/>'],
    stick:  ['#8aa4ff', '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>'],
    eye:    ['#c58bff', '<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.6"/>'],
    coin:   ['#7fe8ff', '<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><path d="M12 8v8M9.4 10.2h4.2a1.6 1.6 0 0 1 0 3.2H9.4"/>']
  };
  function ic(n) { var d = ICONS[n] || ICONS.stick; return '<span class="em ic" style="--c:' + d[0] + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + d[1] + '</svg></span>'; }
  function em(e) { return ic(e); }
  function stopper(b) { ['pointerdown', 'touchstart', 'mousedown'].forEach(function (n) { b.addEventListener(n, function (ev) { ev.stopPropagation(); }, { passive: true }); }); }
  function mk(label, emoji, fn) { var b = document.createElement('b'); b.className = 'wf-ctl wf-mb'; b.setAttribute('aria-label', label); b.innerHTML = em(emoji); stopper(b); b.addEventListener('click', function (e) { e.stopPropagation(); fn(); }); return b; }
  var row = null, set = null, gear = null;

  function clock() {
    var c = document.getElementById('wf-clock'); if (!c) return;
    var d = new Date(), h = d.getHours() % 12 || 12, m = ('0' + d.getMinutes()).slice(-2), cr = window.WF_LIFE ? WF_LIFE.credits() : null;
    c.innerHTML = h + ':' + m + (cr != null ? '<small><svg viewBox="0 0 24 24" width="13" height="13" style="fill:none;stroke:#7fe8ff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px #4de3ff)">' + ICONS.coin[1] + '</svg>' + cr.toLocaleString() + '</small>' : '');
  }
  function dress() {
    row = document.getElementById('wf-btns'); if (!row) return false;
    if (!document.getElementById('wf-clock')) { var c = document.createElement('div'); c.id = 'wf-clock'; row.insertBefore(c, row.firstChild); clock(); setInterval(clock, 10000); }
    // the settings drop-down
    if (!set) { set = document.createElement('div'); set.id = 'wf-set'; set.className = 'wf-ctl'; set.innerHTML = '<div class="t">SETTINGS</div>'; document.body.appendChild(set); stopper(set);
      gear = mk('Settings', 'gear', function () { var o = !set.classList.contains('open'); set.classList.toggle('open', o); gear.classList.toggle('open', o); });
      document.addEventListener('pointerdown', function (e) { if (set.classList.contains('open') && !set.contains(e.target) && e.target !== gear) { set.classList.remove('open'); gear.classList.remove('open'); } }); 
      // THUMBSTICK size + opacity (roadmap: adjustable mobile controls), saved in localStorage 'wf-stick' {s, o}
      var SZ = [['S', 92], ['M', 118], ['L', 148]], OP = [['100%', 1], ['70%', 0.7], ['40%', 0.4]], cfg = { s: 1, o: 0 }; try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem('wf-stick') || '{}')); } catch (e) {}
      var stSt = document.createElement('style'); document.head.appendChild(stSt);
      function applyStick() { var w = SZ[cfg.s][1]; stSt.textContent = '#wf-joy,#wf-stick{width:' + w + 'px!important;height:' + w + 'px!important;opacity:' + OP[cfg.o][1] + '}#wf-joy i,#wf-stick i{width:' + Math.round(w * 0.42) + 'px!important;height:' + Math.round(w * 0.42) + 'px!important;margin:-' + Math.round(w * 0.21) + 'px 0 0 -' + Math.round(w * 0.21) + 'px!important}';
        try { localStorage.setItem('wf-stick', JSON.stringify(cfg)); } catch (e) {} szB.querySelector('.st').textContent = SZ[cfg.s][0]; opB.querySelector('.st').textContent = OP[cfg.o][0]; }
      function setRow(icon, label, fn) { var b = document.createElement('b'); b.innerHTML = em(icon) + '<span class="lb">' + label + '</span><span class="st"></span>'; b.addEventListener('click', function (e) { e.stopPropagation(); fn(); applyStick(); }); set.appendChild(b); return b; }
      var szB = setRow('stick', 'Thumbstick size', function () { cfg.s = (cfg.s + 1) % 3; }), opB = setRow('eye', 'Thumbstick opacity', function () { cfg.o = (cfg.o + 1) % 3; }); applyStick(); }
    // new buttons
    if (!row.querySelector('.wf-mapbtn') && window.WF_LIFE) { var mp = mk('Deck map', 'map', function () { WF_LIFE.open('map'); }); mp.classList.add('wf-mapbtn'); row.appendChild(mp); }
    if (!set.querySelector('.wf-manrow') && window.WF_MANUAL) { var mn = document.createElement('b'); mn.className = 'wf-manrow'; mn.innerHTML = em('manual') + '<span class="lb">Captain\u2019s Manual</span><span class="st"></span>';
      mn.addEventListener('click', function (e) { e.stopPropagation(); set.classList.remove('open'); gear.classList.remove('open'); WF_MANUAL.open(); }); set.insertBefore(mn, set.children[1] || null); }
    // re-dress the existing ones
    var log = row.querySelector('.wf-logbtn'); if (log && !log.querySelector('.em')) { log.innerHTML = em('log') + '<i></i>'; }
    var ai = row.querySelector('.wf-aibtn'); if (ai && !ai.querySelector('.em')) ai.innerHTML = em('ai');
    // into the drop-down: Gyro (VR), Level, View
    [['[aria-label="Gyro"]', 'vr', 'VR / gyro look', function (b) { return b.classList.contains('sel') || b.classList.contains('on') ? 'on' : 'off'; }],
     ['[aria-label="Level"]', 'level', 'Level the view', null],
     ['#wf-view', 'person', '1st / 3rd person', function () { return window.WAYFARER && WAYFARER.avatar && WAYFARER.avatar.view ? (WAYFARER.avatar.view() === 'third' ? '3rd' : '1st') : ''; }]].forEach(function (q) {
      var b = document.querySelector(q[0]); if (!b) return;
      if (b.parentNode !== set) { set.appendChild(b); b.style.cssText = ''; }
      var st = q[3] ? q[3](b) : '', html = em(q[1]) + '<span class="lb">' + q[2] + '</span><span class="st">' + st + '</span>';
      if (b.getAttribute('data-h') !== html) { b.innerHTML = html; b.setAttribute('data-h', html); }
    });
    var sn = document.querySelector('.wf-snd'); if (sn) { var mu = !!(window.WF_SOUND && WF_SOUND.muted()), sh = em(mu ? 'mute' : 'sound') + '<span class="lb">Sound</span><span class="st">' + (mu ? 'off' : 'on') + '</span>';
      if (sn.parentNode !== set) { set.insertBefore(sn, set.children[1] || null); sn.style.cssText = ''; }
      if (sn.getAttribute('data-h') !== sh) { sn.innerHTML = sh; sn.setAttribute('data-h', sh); } }
    // order on the bar: map · log · Halcyon (brain) · settings (sound + the ? manual live in settings) (spread out)
    ['.wf-mapbtn', '.wf-logbtn', '.wf-aibtn'].forEach(function (sel) { var b = row.querySelector(sel); if (b) row.appendChild(b); });
    row.appendChild(gear);
    return true;
  }
  function loop() { try { dress(); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(loop, 300); }); else setTimeout(loop, 300);
  setInterval(loop, 700);       // buttons arrive late (sound.js 500 ms, avatar.js 400 ms) and re-render on toggles — keep them dressed
}());
