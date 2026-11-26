// SS Wayfarer — HALCYON, the ship's mind (user, Nov 26: "a central AI computer that runs the ship that I can interact with and is
// integrated into the brain of the ship, and into various parts of the ship"). Every ship page: an eye icon in the top bar; in the
// Library, tap the brain itself (it brightens while Halcyon speaks: window.__aiTalk). Offline, no account needed: it reads the
// live ship (credits, goals, faults, crew, orders, the light-speed schedule, discoveries) and answers; it also follows simple
// commands ("take me to the library", "red alert", "open the manual") and searches the Captain's Manual for anything else.
// Speaks with the device voice (toggle in the panel; 'wf-ai-voice').
(function () {
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  var ROOMS = { bridge: ['bridge.html', 'the Command Bridge'], corridor: ['index.html', 'the atrium'], hallway: ['index.html', 'the atrium'], atrium: ['index.html', 'the atrium'], quarters: ['quarters.html', 'your quarters'], medbay: ['medbay.html', 'the Medbay'], xenobiology: ['xeno.html', 'Xenobiology'], mess: ['mess.html', 'the Mess Hall'], galley: ['mess.html', 'the Mess Hall'], maintenance: ['maint.html', 'Maintenance'], storage: ['maint.html', 'Maintenance'], hangar: ['firefly.html', 'the Firefly hangar'], firefly: ['firefly.html', 'the Firefly hangar'], engine: ['engine.html', 'the Engine Room'], reactor: ['engine.html', 'the Engine Room'], holodeck: ['holodeck.html', 'the Holodeck'],
    lounge: ['lounge.html', 'the Crew Lounge'], kitty: ['lounge.html', 'the Crew Lounge'], media: ['media.html', 'the Media Nexus'], theater: ['media.html', 'the Media Nexus'], library: ['library.html', 'the Library'],
    brain: ['library.html', 'the Library'], flight: ['minigame.html', 'Flight Mode'], fly: ['minigame.html', 'Flight Mode'], ship: ['hangar.html', 'Ship View'] };
  var RN = { corridor: 'the atrium', bridge: 'the Bridge', holodeck: 'the Holodeck', lounge: 'the Lounge', media: 'the Media Nexus', library: 'the Library' };
  var NAMES = { nav: 'Aster', eng: 'Forge', sci: 'Vesper', com: 'Echo', tac: 'Sentinel', sen: 'Prism', ember: 'Ember', nimbus: 'Nimbus', orbit: 'Orbit', pixel: 'Pixel' };
  function rankOf(c) { var R = [[0, 'Ensign'], [600, 'Lieutenant'], [1800, 'Lieutenant Commander'], [4000, 'Commander'], [8000, 'Captain'], [15000, 'Commodore']], n = R[0][1]; R.forEach(function (q) { if (c >= q[0]) n = q[1]; }); return n; }
  function crewWhere() {
    var L = window.WAYFARER && WAYFARER.crewLayout, E = window.WAYFARER && WAYFARER.crew && WAYFARER.crew.engine, out = {};
    var list = E ? Array.from(E.npcs.values()).map(function (n) { return [n.id, n.node, n.state]; }) : (load('wf-crew', {}).npcs || []).map(function (n) { return [n.id, n.node, n.state]; });
    list.forEach(function (q) { var nd = L && L.nodes[q[1]]; out[q[0]] = { room: nd ? nd.room : null, state: q[2] }; }); return out;
  }
  function nextJump() { var w = load('wf-warp', null); if (!w) return null; var now = Date.now(); if (now < w.until) return 0; return Math.max(0, Math.round((w.next - now) / 60000)); }
  function status() {
    var L = window.WF_LIFE, c = L ? L.credits() : 0, rk = rankOf(c), g = L ? L.goals() : null, done = g ? g.list.filter(function (q) { return q.done; }).length : 0;
    var F = load('wf-faults', []), o = load('wf-order', null), W = crewWhere(), seated = Object.keys(W).filter(function (k) { return /nav|eng|sci|com|tac|sen/.test(k) && W[k].state === 'SEATED'; }).length;
    var cats = Object.keys(W).filter(function (k) { return /ember|nimbus|orbit|pixel/.test(k) && W[k].room === 'lounge'; }).length, j = nextJump(), D = load('wf-discoveries', []);
    return 'All systems are being watched, Captain. You hold ' + c + ' credits — rank ' + rk + '. Daily goals: ' + done + ' of 3 complete. ' +
      (F.length ? F.length + ' fault' + (F.length > 1 ? 's' : '') + ' reported: ' + F.map(function (f) { return (f.kind === 'spark' ? 'a sparking conduit' : f.kind === 'coolant' ? 'a coolant leak' : 'a power relay') + ' in ' + RN[f.room]; }).join(', ') + '. ' : 'No faults on any deck. ') +
      seated + ' of 6 droids are at their Bridge stations' + (o ? ', under orders: ' + o.kind.replace('redalert', 'red alert').replace('shoreleave', 'shore leave').replace('stations', 'battle stations') : '') + '. ' +
      cats + ' cat' + (cats === 1 ? ' is' : 's are') + ' in the Lounge. ' + (j === 0 ? 'We are at light speed right now. ' : j != null ? 'Next evasive light-speed jump in about ' + j + ' minute' + (j === 1 ? '' : 's') + '. ' : '') +
      'Science log: ' + D.length + ' entr' + (D.length === 1 ? 'y' : 'ies') + '.';
  }
  function whereAll() { var W = crewWhere(), by = {}; Object.keys(W).forEach(function (k) { var r = W[k].room || 'somewhere'; (by[r] = by[r] || []).push(NAMES[k] || k); });
    return Object.keys(by).map(function (r) { return (RN[r] || r) + ': ' + by[r].join(', '); }).join(' · ') || 'I cannot see the crew from here.'; }
  function advice() {
    var L = window.WF_LIFE, out = [], g = L ? L.goals() : null; if (g) g.list.forEach(function (q) { if (!q.done) out.push(q.text + ' (' + q.have + '/' + q.n + ')'); });
    var F = load('wf-faults', []); if (F.length) out.push('fix the ' + F.length + ' fault' + (F.length > 1 ? 's' : '') + ' Forge reported');
    var b = load('wf-bounty', null); if (!b || !b.done) out.push('check the Bounty Broker at the Hiveport');
    var D = load('wf-discoveries', []); if (D.filter(function (d) { return d.kind === 'planet'; }).length < 12) out.push('scan more planets for Vesper');
    return out.length ? 'Suggestions, Captain: ' + out.slice(0, 4).join('; ') + '.' : 'Everything is in order. Perhaps a game of Starjack with the crew?';
  }
  function manualSearch(q) {
    var S = window.WF_MANUAL && WF_MANUAL.sections; if (!S) return null; var words = q.toLowerCase().split(/\W+/).filter(function (w) { return w.length > 3; }), best = null, bs = 0;
    S.forEach(function (sec) { sec[1].forEach(function (l) { var t = l.toLowerCase(), sc = 0; words.forEach(function (w) { if (t.indexOf(w) >= 0) sc++; }); if (sc > bs) { bs = sc; best = l; } }); });
    return bs ? best.replace(/<[^>]+>/g, '') : null;
  }
  function answer(q) {
    var t = q.toLowerCase().trim();
    if (!t) return 'I am listening.';
    var go = t.match(/(?:take me|go|head|walk|bring me)\s+(?:to\s+)?(?:the\s+)?(\w+)/);
    if (go && ROOMS[go[1]]) { var R = ROOMS[go[1]]; setTimeout(function () { location.href = R[0]; }, 1400); return 'Plotting a route to ' + R[1] + '. Mind the doors.'; }
    if (/status|report|how.*ship|systems/.test(t)) return status();
    if (/where.*(everyone|crew|droid|cat)|who.*where/.test(t)) return whereAll();
    var who = Object.keys(NAMES).filter(function (k) { return t.indexOf(NAMES[k].toLowerCase()) >= 0; })[0];
    if (who && /where/.test(t)) { var W = crewWhere()[who]; return W && W.room ? NAMES[who] + ' is in ' + RN[W.room] + '.' : 'I cannot locate ' + NAMES[who] + '.'; }
    if (/what.*(do|should)|bored|suggest|advice/.test(t)) return advice();
    if (/jump|light ?speed|warp|pirate/.test(t)) { var j = nextJump(); return j === 0 ? 'We are at light speed right now, Captain.' : j != null ? 'The next evasive jump is due in about ' + j + ' minute' + (j === 1 ? '' : 's') + '. I will sound red alert twenty seconds before.' : 'No jump is scheduled.'; }
    if (/credit|money|rank/.test(t)) { var c = window.WF_LIFE ? WF_LIFE.credits() : 0; return 'You have ' + c + ' credits. Rank: ' + rankOf(c) + '.'; }
    if (/manual|help|how to play|guide/.test(t)) { setTimeout(function () { close(); if (window.WF_MANUAL) WF_MANUAL.open(); }, 900); return 'Opening the Captain’s Manual.'; }
    if (/map|deck/.test(t)) { setTimeout(function () { close(); if (window.WF_LIFE) WF_LIFE.open('map'); }, 900); return 'Here is the deck map.'; }
    if (/goal/.test(t)) { var g = window.WF_LIFE && WF_LIFE.goals(); return g ? 'Today: ' + g.list.map(function (q) { return (q.done ? '✓ ' : '') + q.text; }).join(' · ') : 'No goals loaded.'; }
    if (/red alert/.test(t)) { if (window.WAYFARER && WAYFARER.crew && document.querySelector('a-scene').components['wf-crew'] && /bridge/.test(location.pathname)) { document.querySelector('a-scene').components['wf-crew'].applyOrder('redalert'); return 'Red alert. All hands to stations.'; } return 'Red alert must be called from the Bridge, Captain.'; }
    if (/hello|hi\b|hey/.test(t)) return 'Hello, Captain. I am Halcyon — the ship’s mind. I live in the brain beneath the Library.';
    if (/who are you|what are you|your name/.test(t)) return 'I am Halcyon, the Wayfarer’s mind: a living brain in electrogel, wired to every system. The eels keep me company.';
    if (/eel/.test(t)) return 'The eels? Electrogel eels. They keep the gel moving and the neurons warm. They are called Spark, Volt and Mrs. Fizzwhistle.';
    var m = manualSearch(t); if (m) return 'From the manual: ' + m;
    return 'I do not have an answer for that yet, Captain. Try “status report”, “where is everyone”, “what should I do”, or “take me to the Library”.';
  }

  // ── UI ──
  var css = document.createElement('style');
  css.textContent = '#wf-ai{position:fixed;left:50%;top:calc(40px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:66;display:none;width:min(94vw,440px);padding:14px;border-radius:22px;box-sizing:border-box;' +
    'background:linear-gradient(140deg,rgba(255,255,255,.12),rgba(255,255,255,.03)),rgba(6,26,24,.74);-webkit-backdrop-filter:blur(24px) saturate(185%);backdrop-filter:blur(24px) saturate(185%);border:1px solid rgba(120,255,220,.35);color:#fff;font:500 14px -apple-system,system-ui,sans-serif}' +
    '#wf-ai .hd{display:flex;align-items:center;gap:10px}#wf-ai .orb{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#d8fff4,#3fe0c8 40%,#0a4a44 75%);box-shadow:0 0 18px #3fe0c8;animation:aiP 3s ease-in-out infinite}#wf-ai.talk .orb{animation:aiT .35s ease-in-out infinite}' +
    '@keyframes aiP{50%{box-shadow:0 0 30px #3fe0c8;transform:scale(1.06)}}@keyframes aiT{50%{box-shadow:0 0 40px #9fffe8;transform:scale(1.15)}}' +
    '#wf-ai .hd b{font:800 12px -apple-system,system-ui,sans-serif;letter-spacing:3px;color:#9fffe8;flex:1}#wf-ai .hd button{background:none;border:none;color:#cfe;font-size:18px;cursor:pointer}' +
    '#wf-ai .log{max-height:38vh;overflow:auto;margin:10px 0;display:flex;flex-direction:column;gap:6px}#wf-ai .m{padding:8px 11px;border-radius:13px;font-size:13.5px;line-height:1.42}#wf-ai .m.a{background:rgba(63,224,200,.14);border:1px solid rgba(120,255,220,.25)}#wf-ai .m.u{align-self:flex-end;background:rgba(255,255,255,.1)}' +
    '#wf-ai .chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}#wf-ai .chips button{padding:6px 9px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#e8fff8;font:600 11.5px -apple-system,system-ui,sans-serif}' +
    '#wf-ai form{display:flex;gap:6px}#wf-ai input{flex:1;padding:10px 12px;border-radius:13px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.3);color:#fff;font:500 14px -apple-system,system-ui,sans-serif;outline:none}' +
    '#wf-ai form button{padding:10px 14px;border-radius:13px;border:none;background:#3fe0c8;color:#032;font:800 13px -apple-system,system-ui,sans-serif}';
  document.head.appendChild(css);
  var box = null, voice = load('wf-ai-voice', true);
  function say(t) {
    var log = box.querySelector('.log'), m = document.createElement('div'); m.className = 'm a'; m.textContent = t; log.appendChild(m); log.scrollTop = 1e6;
    box.classList.add('talk'); window.__aiTalk = performance.now() + Math.min(9000, 600 + t.length * 55);
    clearTimeout(say.t); say.t = setTimeout(function () { box.classList.remove('talk'); }, Math.min(9000, 600 + t.length * 55));
    if (voice && window.speechSynthesis && !(window.WF_SOUND && WF_SOUND.muted())) { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t.replace(/[✓·]/g, ',')); u.rate = 1.02; u.pitch = 0.92; var vs = speechSynthesis.getVoices(); var pick = vs.filter(function (v) { return /Samantha|Karen|Moira|Serena|Google UK English Female|Ava/.test(v.name); })[0]; if (pick) u.voice = pick; speechSynthesis.speak(u); } catch (e) {} }
  }
  function ask(q) { var log = box.querySelector('.log'), m = document.createElement('div'); m.className = 'm u'; m.textContent = q; log.appendChild(m); setTimeout(function () { say(answer(q)); }, 250); }
  function open() {
    if (!box) {
      box = document.createElement('div'); box.id = 'wf-ai'; document.body.appendChild(box);
      ['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown', 'wheel'].forEach(function (n) { box.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: n !== 'keydown' }); });
      box.innerHTML = '<div class="hd"><div class="orb"></div><b>HALCYON · SHIP’S MIND</b><button class="v" title="voice"></button><button class="x">✕</button></div><div class="log"></div><div class="chips"></div><form><input placeholder="Ask Halcyon…" autocomplete="off"><button>Ask</button></form>';
      ['Status report', 'Where is everyone?', 'What should I do?', 'Next light-speed jump?', 'Today’s goals', 'Take me to the Library'].forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.onclick = function () { ask(c); }; box.querySelector('.chips').appendChild(b); });
      box.querySelector('.x').onclick = close;
      var vb = box.querySelector('.v'); function vIcon() { vb.textContent = voice ? '🔊' : '🔇'; } vIcon(); vb.onclick = function () { voice = !voice; try { localStorage.setItem('wf-ai-voice', JSON.stringify(voice)); } catch (e) {} vIcon(); if (!voice && window.speechSynthesis) speechSynthesis.cancel(); };
      box.querySelector('form').onsubmit = function (e) { e.preventDefault(); var i = box.querySelector('input'); if (i.value.trim()) ask(i.value.trim()); i.value = ''; };
      say('Halcyon here, Captain. How can I help?');
    }
    box.style.display = 'block'; document.body.classList.add('reading'); if (window.WF_LIFE) WF_LIFE.event('ai');
  }
  function close() { if (box) box.style.display = 'none'; document.body.classList.remove('reading'); if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {} }
  // top-bar eye icon (every ship page)
  var ICON = '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3.2"/></svg>';
  function button() { var row = document.getElementById('wf-btns'); if (!row) return false; if (row.querySelector('.wf-aibtn')) return true;
    var b = document.createElement('b'); b.className = 'wf-aibtn'; b.setAttribute('aria-label', 'Halcyon'); b.innerHTML = ICON; b.style.color = '#9fffe8';
    ['pointerdown', 'touchstart'].forEach(function (n) { b.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); });
    b.addEventListener('click', function (e) { e.stopPropagation(); if (box && box.style.display === 'block') close(); else open(); });
    var log = row.querySelector('.wf-logbtn'); row.insertBefore(b, log ? log.nextSibling : row.children[0] || null); return true; }
  function boot() { var n = 0; (function t() { if (!button() && n++ < 40) setTimeout(t, 250); }());
    // the Library: the brain itself is Halcyon
    var br = document.getElementById('brain'); if (br) { var mk = function () { var T = AFRAME.THREE, h = document.createElement('a-entity'); h.setAttribute('class', 'interactive clickable');
        h.setObject3D('mesh', new T.Mesh(new T.SphereGeometry(4.5, 12, 8), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))); h.object3D.position.set(0, -6.5, 0); h.object3D.userData.noCollide = true;
        h.addEventListener('click', open); document.querySelector('a-scene').appendChild(h); }; if (document.querySelector('a-scene').hasLoaded) mk(); else document.querySelector('a-scene').addEventListener('loaded', mk); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  addEventListener('keydown', function (e) { if (e.code === 'KeyI' && !/INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) { if (box && box.style.display === 'block') close(); else open(); } });
  window.WF_AI = { open: open, close: close, answer: answer };
}());
