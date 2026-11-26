// SS Wayfarer — iOS-STYLE MENU BAR (user, Nov 26: "the menu bar icons aren't showing up… more like the iOS layout: a clock at the
// top left, more emojis… obvious icons, a Google-Maps pin for the map, spread out more, a settings gear on the far right that
// pops down and contains the level, the VR and the 3rd-person settings"). Load LAST on every page that has #wf-btns.
// It doesn't create the old buttons — mobile.js (Gyro, Level), sound.js (Sound), avatar.js (View), life.js (Log) and ai.js
// (Halcyon) still do. This file re-dresses them as emoji, adds 📍 Map and 📖 Manual, a live clock, and moves Gyro / Level /
// View into the ⚙️ drop-down.
(function () {
  var css = document.createElement('style');
  css.textContent =
    '#wf-btns{justify-content:flex-end!important;gap:6px!important;height:calc(40px + env(safe-area-inset-top,0px))!important;background:rgba(14,10,12,.55)!important;padding-left:calc(14px + env(safe-area-inset-left,0px))!important}' +
    '#wf-btns:before{display:none!important}' +
    '#wf-clock{margin-right:auto;font:700 16px -apple-system,system-ui,sans-serif;color:#fff;letter-spacing:.3px;font-variant-numeric:tabular-nums;text-shadow:0 1px 3px rgba(0,0,0,.6)}' +
    '#wf-clock small{font:600 11px -apple-system,system-ui,sans-serif;color:#ffd58a;margin-left:8px;letter-spacing:.5px}' +
    '#wf-btns > b{width:38px!important;height:32px!important;border-radius:10px!important}' +
    '#wf-btns > b .em, #wf-set b .em{font:22px/1 "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));pointer-events:none}' +
    '#wf-btns > b svg{display:none!important}' +
    '#wf-btns > b:active,#wf-btns > b.open{background:rgba(255,255,255,.18)!important}' +
    '#wf-set{position:fixed;right:calc(8px + env(safe-area-inset-right,0px));top:calc(46px + env(safe-area-inset-top,0px));z-index:70;display:none;min-width:220px;padding:8px;border-radius:18px;' +
      'background:linear-gradient(140deg,rgba(255,255,255,.14),rgba(255,255,255,.04)),rgba(22,16,14,.72);-webkit-backdrop-filter:blur(24px) saturate(185%);backdrop-filter:blur(24px) saturate(185%);border:1px solid rgba(255,255,255,.18);box-shadow:0 14px 34px rgba(0,0,0,.5)}' +
    '#wf-set.open{display:block}#wf-set b{display:flex!important;align-items:center;gap:12px;width:auto!important;height:auto!important;padding:10px 12px!important;border-radius:12px!important;cursor:pointer;color:#fff;font:600 14px -apple-system,system-ui,sans-serif}' +
    '#wf-set b svg{display:none!important}#wf-set b .lb{flex:1}#wf-set b .st{color:#ffd58a;font-size:12px}#wf-set b:active,#wf-set b.on{background:rgba(255,255,255,.14)!important}' +
    '#wf-set .t{font:800 10.5px -apple-system,system-ui,sans-serif;letter-spacing:2.5px;color:#d9c4ae;padding:4px 12px 6px}';
  document.head.appendChild(css);

  function em(e) { return '<span class="em">' + e + '</span>'; }
  function stopper(b) { ['pointerdown', 'touchstart', 'mousedown'].forEach(function (n) { b.addEventListener(n, function (ev) { ev.stopPropagation(); }, { passive: true }); }); }
  function mk(label, emoji, fn) { var b = document.createElement('b'); b.className = 'wf-ctl wf-mb'; b.setAttribute('aria-label', label); b.innerHTML = em(emoji); stopper(b); b.addEventListener('click', function (e) { e.stopPropagation(); fn(); }); return b; }
  var row = null, set = null, gear = null;

  function clock() {
    var c = document.getElementById('wf-clock'); if (!c) return;
    var d = new Date(), h = d.getHours() % 12 || 12, m = ('0' + d.getMinutes()).slice(-2), cr = window.WF_LIFE ? WF_LIFE.credits() : null;
    c.innerHTML = h + ':' + m + (cr != null ? '<small>💰 ' + cr.toLocaleString() + '</small>' : '');
  }
  function dress() {
    row = document.getElementById('wf-btns'); if (!row) return false;
    if (!document.getElementById('wf-clock')) { var c = document.createElement('div'); c.id = 'wf-clock'; row.insertBefore(c, row.firstChild); clock(); setInterval(clock, 10000); }
    // the settings drop-down
    if (!set) { set = document.createElement('div'); set.id = 'wf-set'; set.className = 'wf-ctl'; set.innerHTML = '<div class="t">SETTINGS</div>'; document.body.appendChild(set); stopper(set);
      gear = mk('Settings', '⚙️', function () { var o = !set.classList.contains('open'); set.classList.toggle('open', o); gear.classList.toggle('open', o); });
      document.addEventListener('pointerdown', function (e) { if (set.classList.contains('open') && !set.contains(e.target) && e.target !== gear) { set.classList.remove('open'); gear.classList.remove('open'); } }); }
    // new buttons
    if (!row.querySelector('.wf-mapbtn') && window.WF_LIFE) { var mp = mk('Deck map', '📍', function () { WF_LIFE.open('map'); }); mp.classList.add('wf-mapbtn'); row.appendChild(mp); }
    if (!row.querySelector('.wf-manbtn') && window.WF_MANUAL) { var mn = mk('Manual', '📖', function () { WF_MANUAL.open(); }); mn.classList.add('wf-manbtn'); row.appendChild(mn); }
    // re-dress the existing ones
    var log = row.querySelector('.wf-logbtn'); if (log && !log.querySelector('.em')) { log.innerHTML = em('📋') + '<i></i>'; }
    var ai = row.querySelector('.wf-aibtn'); if (ai && !ai.querySelector('.em')) ai.innerHTML = em('🧠');
    var snd = document.querySelector('.wf-snd'); if (snd) { var want = em(window.WF_SOUND && WF_SOUND.muted() ? '🔇' : '🔊'); if (snd.innerHTML !== want) snd.innerHTML = want; if (snd.parentNode !== row) row.appendChild(snd); }
    // into the drop-down: Gyro (VR), Level, View
    [['[aria-label="Gyro"]', '🥽', 'VR / gyro look', function (b) { return b.classList.contains('sel') || b.classList.contains('on') ? 'on' : 'off'; }],
     ['[aria-label="Level"]', '📐', 'Level the view', null],
     ['#wf-view', '👤', '1st / 3rd person', function () { return window.WAYFARER && WAYFARER.avatar && WAYFARER.avatar.view ? (WAYFARER.avatar.view() === 'third' ? '3rd' : '1st') : ''; }]].forEach(function (q) {
      var b = document.querySelector(q[0]); if (!b) return;
      if (b.parentNode !== set) { set.appendChild(b); b.style.cssText = ''; }
      var st = q[3] ? q[3](b) : '', html = em(q[1]) + '<span class="lb">' + q[2] + '</span><span class="st">' + st + '</span>';
      if (b.getAttribute('data-h') !== html) { b.innerHTML = html; b.setAttribute('data-h', html); }
    });
    // order on the bar: 📍 📋 🧠 📖 🔊 ⚙️ (spread out)
    ['.wf-mapbtn', '.wf-logbtn', '.wf-aibtn', '.wf-manbtn', '.wf-snd'].forEach(function (sel) { var b = row.querySelector(sel); if (b) row.appendChild(b); });
    row.appendChild(gear);
    return true;
  }
  function loop() { try { dress(); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(loop, 300); }); else setTimeout(loop, 300);
  setInterval(loop, 700);       // buttons arrive late (sound.js 500 ms, avatar.js 400 ms) and re-render on toggles — keep them dressed
}());
