// SS Wayfarer — SHIP LIFE (user, Nov 26: "I'm bored, there's not enough to do on the ship"). Shared by every page; plain JS.
//   WF_LIFE.credits() .add(n, why) .spend(n, why) → bool     one wallet ('wf-credits', the same one contracts pay into)
//   WF_LIFE.give(item, n) .take(item, n) → bool .count(item)  inventory ('wf-inv'); ITEMS = catalogue
//   WF_LIFE.event(name)   anything that happens: 'pet', 'treat', 'talk', 'room:<id>', 'dock', 'visit:<PLANET>', 'kill:<kind>',
//                          'contract', 'laser', 'wand', 'fix', 'order', 'win:<game>', 'dance', 'cook', 'scan' … → daily goals
//   WF_LIFE.goals()       today's three goals (seeded by date) with progress; finishing one pays, all three pays a bonus
//   WF_LIFE.open(tab)     the SHIP LOG glass panel: GOALS · DECK MAP · CARGO   (clipboard button in the top menu bar, key J)
//   WF_LIFE.toast(text)
// The deck map draws the ship from above with the live crew (localStorage 'wf-crew' + crew.js's layout) and you-are-here;
// tap a room to walk straight there. Goals only come from the pool of things that exist right now (POOL[].ok).
(function () {
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var DAY = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);   // local calendar day
  var PAGE = { '': 'corridor', 'index.html': 'corridor', 'quarters.html': 'quarters', 'medbay.html': 'medbay', 'xeno.html': 'xeno', 'mess.html': 'mess', 'maint.html': 'maint', 'firefly.html': 'firefly', 'engine.html': 'engine', 'core.html': 'core', 'bridge.html': 'bridge', 'holodeck.html': 'holodeck', 'lounge.html': 'lounge', 'media.html': 'media',
               'library.html': 'library', 'station.html': 'hiveport', 'minigame.html': 'flight' }[(location.pathname.split('/').pop() || '')] || 'other';

  // ── wallet + cargo ──
  var ITEMS = {
    treat:   { name: 'Cat treats', icon: '🐟', note: 'Tap a cat with treats in your cargo to feed it (Lounge cat play).' },
    laser:   { name: 'Laser pointer', icon: '🔴', note: 'Cats chase the dot. Lounge cat play.' },
    wand:    { name: 'Feather wand', icon: '🪶', note: 'Cats pounce on it. Lounge cat play.' },
    catnip:  { name: 'K’Vetar catnip', icon: '🌿', note: 'A cat goes wild: +12% trust. From Purr & Plenty at the Hiveport.' },
    idol:    { name: 'Resin idol of the Hive Mother', icon: '🗿', note: 'Trophy · Odds & Ends, Hiveport' },
    chart:   { name: 'Hand-inked star chart', icon: '🗺️', note: 'Trophy · Odds & Ends, Hiveport' },
    geode:   { name: 'Singing crystal geode', icon: '💎', note: 'Trophy · Odds & Ends, Hiveport' },
    tooth:   { name: 'Bioship tooth', icon: '🦷', note: 'Trophy · Odds & Ends, Hiveport' },
    model:   { name: 'Brass model of the Wayfarer', icon: '🚀', note: 'Trophy · Odds & Ends, Hiveport' }
  };
  function credits() { return load('wf-credits', 0); }
  function add(n, why) { var c = credits() + n; save('wf-credits', c); if (why) toast('+' + n + ' cr · ' + why); refresh(); return c; }
  function spend(n, why) { var c = credits(); if (c < n) { toast('Not enough credits (' + c + ' / ' + n + ')'); return false; } save('wf-credits', c - n); if (why) toast('−' + n + ' cr · ' + why); refresh(); return true; }
  function inv() { return load('wf-inv', null) || { treat: 5, laser: 1, wand: 1 }; }      // a starter kit for the cats
  function count(it) { return inv()[it] || 0; }
  function give(it, n) { var v = inv(); v[it] = (v[it] || 0) + (n || 1); save('wf-inv', v); refresh(); }
  function take(it, n) { var v = inv(); n = n || 1; if ((v[it] || 0) < n) return false; v[it] -= n; save('wf-inv', v); refresh(); return true; }

  // ── daily goals ──
  var POOL = [
    { id: 'pet3', text: 'Pet the ship’s cats 3 times', ev: 'pet', n: 3 },
    { id: 'treat2', text: 'Give the cats 2 treats', ev: 'treat', n: 2 },
    { id: 'talk2', text: 'Talk to 2 of your droids', ev: 'talk', n: 2 },
    { id: 'rooms', text: 'Visit 4 different rooms', ev: 'room:', n: 4, distinct: true },
    { id: 'dock', text: 'Dock at the Hiveport', ev: 'dock', n: 1 },
    { id: 'planet', text: 'Fly close to any planet', ev: 'visit:', n: 1 },
    { id: 'contract', text: 'Complete a Hiveport contract', ev: 'contract', n: 1 },
    { id: 'drinks', text: 'Order a drink at the Resin Spire', ev: 'drink', n: 1 },
    { id: 'kvetar', text: 'Talk to 3 K’Vetar', ev: 'kvetar', n: 3 },
    { id: 'laser', text: 'Play laser pointer with a cat', ev: 'laser', n: 1 },
    { id: 'wand', text: 'Play feather wand with a cat', ev: 'wand', n: 1 },
    { id: 'fix1', text: 'Fix a ship fault Forge reports', ev: 'fix', n: 1 },
    { id: 'order1', text: 'Give your crew an order from the Bridge', ev: 'order', n: 1 },
    { id: 'holo1', text: 'Play a Holodeck game', ev: 'holo', n: 1 },
    { id: 'holowin', text: 'Win a Holodeck game', ev: 'win:', n: 1 },
    { id: 'buy', text: 'Buy something at a Hiveport shop', ev: 'buy', n: 1 },
    { id: 'dance', text: 'Hit the Hiveport dance floor', ev: 'dance', n: 1 },
    { id: 'gamble', text: 'Try your luck at The Comb (gambling den)', ev: 'gamble', n: 2 },
    { id: 'peace', text: 'Break up a bar brawl', ev: 'peace', n: 1 },
    { id: 'bounty', text: 'Claim the Bounty Broker\u2019s bounty', ev: 'bounty', n: 1 },
    { id: 'cards', text: 'Win a hand of Starjack against the crew (Lounge table)', ev: 'cardwin', n: 1 },
    { id: 'scan', text: 'Scan a planet or anomaly in Flight Mode (SCAN button / G)', ev: 'scan', n: 1 },
    { id: 'ai', text: 'Ask Halcyon, the ship\u2019s mind, for a status report (eye icon / brain)', ev: 'ai', n: 1 }
  ];
  var REG = {};                                   // later features register more goals (WF_LIFE.addGoals)
  function pool() { return POOL.filter(function (g) { return !g.need || REG[g.need]; }); }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  function goals() {
    var st = load('wf-goals', null);
    if (!st || st.day !== DAY) {
      var r = rng(DAY * 9301 + 49297), p = pool().slice(), pick = [];
      while (pick.length < 3 && p.length) pick.push(p.splice(Math.floor(r() * p.length), 1)[0]);
      st = { day: DAY, list: pick.map(function (g) { return { id: g.id, text: g.text, ev: g.ev, n: g.n, distinct: !!g.distinct, have: 0, seen: [], done: false, reward: 150 }; }), bonus: false };
      save('wf-goals', st);
    }
    return st;
  }
  function event(name) {
    var st = goals(), changed = false;
    st.list.forEach(function (g) {
      if (g.done) return;
      var hit = g.ev.slice(-1) === ':' ? name.indexOf(g.ev) === 0 : name === g.ev; if (!hit) return;
      if (g.distinct) { if (g.seen.indexOf(name) >= 0) return; g.seen.push(name); }
      g.have++; changed = true;
      if (g.have >= g.n) { g.done = true; add(g.reward, 'Daily goal: ' + g.text); }
    });
    if (changed && !st.bonus && st.list.every(function (g) { return g.done; })) { st.bonus = true; save('wf-goals', st); add(300, 'All daily goals done!'); }
    if (changed) save('wf-goals', st);
    (window.WF_LIFE.listeners || []).forEach(function (f) { try { f(name); } catch (e) {} });
    refresh();
  }

  // ── toast ──
  function toast(t) {
    if (!document.body) return;
    var e = document.getElementById('wf-life-toast');
    if (!e) { e = document.createElement('div'); e.id = 'wf-life-toast'; document.body.appendChild(e); }
    e.textContent = t; e.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.opacity = 0; }, 3000);
  }

  // ── the SHIP LOG panel ──
  var css = document.createElement('style');
  css.textContent =
    '#wf-life-toast{position:fixed;left:50%;top:calc(80px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:70;padding:9px 15px;border-radius:15px;pointer-events:none;opacity:0;transition:opacity .4s;max-width:88vw;text-align:center;' +
      'background:rgba(28,22,10,.6);border:1px solid rgba(255,210,120,.45);color:#ffe6b0;font:700 13px -apple-system,system-ui,sans-serif;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}' +
    '#wf-log{position:fixed;inset:calc(40px + env(safe-area-inset-top,0px)) 0 0 0;margin:0 auto;z-index:65;display:none;width:min(94vw,460px);max-height:calc(100vh - 60px - env(safe-area-inset-top,0px));overflow:auto;padding:14px 14px 16px;border-radius:22px;box-sizing:border-box;height:max-content;' +
      'background:linear-gradient(140deg,rgba(255,255,255,.13),rgba(255,255,255,.03)),rgba(22,14,8,.66);-webkit-backdrop-filter:blur(24px) saturate(185%);backdrop-filter:blur(24px) saturate(185%);' +
      'border:1px solid rgba(255,200,140,.3);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 18px 44px rgba(0,0,0,.55);color:#fff;font:500 14px -apple-system,system-ui,sans-serif}' +
    '#wf-log .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}#wf-log .hd b{font:800 12px -apple-system,system-ui,sans-serif;letter-spacing:3px;color:#ffc98a}' +
    '#wf-log .hd span{font:700 13px -apple-system,system-ui,sans-serif;color:#ffe6b0}#wf-log .x{background:none;border:none;color:#e8d4bf;font-size:20px;padding:0 4px;cursor:pointer}' +
    '#wf-log .tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px}#wf-log .tabs button{padding:8px 2px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font:700 10.5px -apple-system,system-ui,sans-serif;letter-spacing:.3px;min-width:0;overflow:hidden;text-overflow:ellipsis}' +
    '#wf-log .tabs button.on{background:rgba(255,170,80,.3);border-color:rgba(255,200,140,.6)}' +
    '#wf-log .goal{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);margin-bottom:8px}' +
    '#wf-log .goal.done{opacity:.55}#wf-log .goal i{display:block;height:5px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:7px;overflow:hidden}#wf-log .goal i u{display:block;height:100%;background:linear-gradient(90deg,#ffb050,#ffe08a)}' +
    '#wf-log .goal small{float:right;color:#ffd58a;font-weight:700}#wf-log p.sub{color:#d9c4ae;font-size:12px;margin:2px 0 10px;text-align:center}' +
    '#wf-log svg.map{width:100%;height:auto;max-height:calc(100vh - 190px);display:block;margin:0 auto;border-radius:14px;background:#06121e}#wf-log svg.map .rm{cursor:pointer}#wf-log svg.map .rm:hover path,#wf-log svg.map .rm:hover rect,#wf-log svg.map .rm:hover circle{fill:rgba(255,180,90,.28)}' +
    '#wf-log .item{display:flex;gap:10px;align-items:center;padding:9px 11px;border-radius:13px;background:rgba(255,255,255,.06);margin-bottom:7px}#wf-log .item em{font-style:normal;font-size:22px}#wf-log .item div{flex:1}#wf-log .item small{display:block;color:#d9c4ae;font-size:11.5px}#wf-log .item b{color:#ffe6b0}' +
    '#wf-log.bp{background:#0a1424;border:1px solid rgba(127,227,255,.45);box-shadow:0 14px 34px rgba(0,0,0,.55);-webkit-backdrop-filter:none;backdrop-filter:none}' +
    '#wf-log.bp svg.map{touch-action:none}#wf-log.bp .mc{display:flex;flex-direction:column;gap:5px;margin:4px 0 6px}#wf-log.bp .mr{display:flex;gap:5px}' +
    '#wf-log.bp .mr button{flex:1;padding:7px 4px;border-radius:3px;border:1px solid rgba(127,227,255,.3);background:rgba(127,227,255,.05);color:#cfeeff;font:700 10px ui-monospace,Menlo,monospace;letter-spacing:1.1px}' +
    '#wf-log.bp{position:fixed!important;inset:0!important;top:0!important;bottom:0!important;width:100vw!important;max-width:none!important;height:100vh!important;height:100dvh!important;max-height:none!important;margin:0!important;border-radius:0;z-index:100001;display:none;flex-direction:column;overflow:hidden;padding:calc(env(safe-area-inset-top,0px) + 8px) 10px calc(env(safe-area-inset-bottom,0px) + 8px)}' +
    '#wf-log.bp .hd{margin-bottom:6px;flex:none}#wf-log.bp .mc{flex:none;margin:0 0 6px}#wf-log.bp .mc .mr.opt{display:none}#wf-log.bp .mc.open .mr.opt{display:flex}#wf-log.bp p.sub{flex:none;margin:2px 0 4px;font-size:9.5px}' +
    '#wf-log.bp svg.map{flex:1 1 auto;min-height:0;height:100%;max-height:none;width:100%}#wf-log.bp .go{flex:none}#wf-log.bp .mr .opt-t{flex:0 0 44px}' +
    '#wf-log.bp .go{display:none;align-items:center;gap:6px;margin:6px 0 2px}#wf-log.bp .go span{flex:1;color:#ffd27a;font:700 10.5px ui-monospace,Menlo,monospace;letter-spacing:.8px}#wf-log.bp .go button{padding:7px 14px;border-radius:3px;border:1px solid rgba(255,210,122,.5);background:rgba(255,210,122,.06);color:#ffd27a;font:700 10.5px ui-monospace,Menlo,monospace;letter-spacing:1.2px}#wf-log.bp .go button.on{background:rgba(255,210,122,.25);color:#fff;border-color:#ffd27a}' +
    '#wf-log.bp .mr button.on{background:rgba(127,227,255,.2);border-color:#7fe3ff;color:#fff}' +
    '#wf-log.bp .hd b{color:#f2f8ff;text-shadow:none}#wf-log.bp .hd span{color:#d6e6fa;font:700 10.5px ui-monospace,Menlo,monospace;letter-spacing:1.2px}#wf-log.bp .x{color:#f2f8ff}' +
    '#wf-log.bp p.sub{color:#d6e6fa;font:600 10.5px ui-monospace,Menlo,monospace;letter-spacing:.4px}' +
    '#wf-log.bp svg.map{background:#0a1424;border:1px solid rgba(127,227,255,.4);border-radius:2px;box-shadow:none;max-height:calc(100vh - 250px)}' +
    '#wf-log.bp svg.map .rm:hover path,#wf-log.bp svg.map .rm:hover rect,#wf-log.bp svg.map .rm:hover circle,#wf-log.bp svg.map .rm:hover polygon,#wf-log.bp svg.map .rm:hover ellipse{fill:rgba(255,255,255,.14)}' +
    '#wf-btns b.wf-logbtn{position:relative}#wf-btns b.wf-logbtn i{position:absolute;right:3px;top:2px;width:7px;height:7px;border-radius:50%;background:#ffb040;box-shadow:0 0 6px #ffb040;display:none}#wf-btns b.wf-logbtn.new i{display:block}';
  document.head.appendChild(css);
  var tab = 'goals', box = null, EXTRA = [];
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function open(t) {
    if (t) tab = t; else if (tab === 'map') tab = 'goals';    // the Ship Log has no MAP tab (user, Nov 27) — the map has its own button

    if (!box) { box = el('div'); box.id = 'wf-log'; document.body.appendChild(box);
      ['pointerdown', 'touchstart', 'mousedown', 'click', 'wheel'].forEach(function (n) { box.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); }); }
    box.style.display = tab === 'map' ? 'flex' : 'block'; document.body.classList.add('reading'); render();
    var b = document.querySelector('#wf-btns .wf-logbtn'); if (b) b.classList.remove('new');
  }
  function close() { if (box) box.style.display = 'none'; if (!document.querySelector('.panel[style*="block"]')) document.body.classList.remove('reading'); }
  function isOpen() { return box && box.style.display !== 'none' && box.style.display !== ''; }
  function refresh() { if (isOpen()) render(); }
  function render() {
    var c = credits(), rk = window.WF_MISSIONS ? WF_MISSIONS.rank(c).name : '';
    box.innerHTML = '';
    var isMap = tab === 'map'; box.classList.toggle('bp', isMap); if (box.style.display !== 'none') box.style.display = isMap ? 'flex' : 'block';
    var hd = el('div', 'hd', isMap ? '<b>DECK MAP</b><span>SS WAYFARER · NCC-WF01</span>' : '<b>SHIP LOG</b><span>' + c + ' cr' + (rk ? ' · ' + rk : '') + '</span>'), x = el('button', 'x', '✕'); x.onclick = close; hd.appendChild(x); box.appendChild(hd);
    var T = [['goals', 'GOALS'], ['cargo', 'CARGO'], ['disc', 'SCIENCE']].concat(EXTRA.map(function (x) { return [x.id, x.label]; }));
    if (!isMap) { var tabs = el('div', 'tabs'); tabs.style.gridTemplateColumns = 'repeat(' + T.length + ',1fr)';
    T.forEach(function (q) { var b = el('button', tab === q[0] ? 'on' : '', q[1]); b.onclick = function () { tab = q[0]; render(); }; tabs.appendChild(b); }); box.appendChild(tabs); }
    var ex = EXTRA.filter(function (x) { return x.id === tab; })[0];
    if (ex) ex.render(box, el, render); else if (tab === 'goals') renderGoals(); else if (tab === 'map') renderMap(); else if (tab === 'disc') renderDisc(); else renderCargo();
  }
  function renderGoals() {
    var st = goals();
    box.appendChild(el('p', 'sub', 'Three new goals every day · 150 cr each · +300 cr for all three'));
    st.list.forEach(function (g) { var d = el('div', 'goal' + (g.done ? ' done' : ''), (g.done ? '✓ ' : '') + g.text + '<small>' + Math.min(g.have, g.n) + ' / ' + g.n + '</small><i><u style="width:' + Math.min(100, g.have / g.n * 100) + '%"></u></i>'); box.appendChild(d); });
    if (st.bonus) box.appendChild(el('p', 'sub', 'All done for today — new goals tomorrow.'));
    var FL = load('wf-faults', []), RN = { corridor: 'atrium', bridge: 'Bridge', holodeck: 'Holodeck', lounge: 'Crew Lounge', media: 'Media Nexus', library: 'Library' };
    if (FL.length) box.appendChild(el('p', 'sub', '⚠ Forge reports: ' + FL.map(function (f) { return f.kind === 'spark' ? 'sparking conduit' : f.kind === 'coolant' ? 'coolant leak' : 'power relay'; }).map(function (k, i) { return k + ' (' + RN[FL[i].room] + ')'; }).join(' · ') + ' — 80 cr each'));
  }
  function renderDisc() {      // Vesper's science log: what you've scanned in Flight Mode
    var D = load('wf-discoveries', []), pl = D.filter(function (d) { return d.kind === 'planet'; }).length, an = D.length - pl;
    box.appendChild(el('p', 'sub', 'Vesper\u2019s science log · ' + pl + ' / 12 worlds scanned · ' + an + ' anomal' + (an === 1 ? 'y' : 'ies') + '<br>New anomalies appear every day near random planets — fly close and press SCAN.'));
    if (!D.length) box.appendChild(el('p', 'sub', 'Nothing logged yet. In Flight Mode, fly close to a planet and tap SCAN.'));
    D.slice().reverse().forEach(function (d) { box.appendChild(el('div', 'goal', '<b>' + (d.kind === 'planet' ? '🪐 ' : '✴️ ') + d.name + '</b><small>' + d.when + '</small><br><span style="font-size:12px;color:#d9c4ae">' + d.note + '</span>' +
      (d.facts ? '<ul style="margin:6px 0 0 16px;padding:0;font-size:12px;color:#f0e2d0">' + d.facts.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>' : ''))); });
  }
  function renderCargo() {
    var v = inv(), any = false;
    Object.keys(v).forEach(function (k) { if (!v[k]) return; any = true; var it = ITEMS[k] || { name: k, icon: '▪', note: '' };
      box.appendChild(el('div', 'item', '<em>' + it.icon + '</em><div><b>' + it.name + '</b><small>' + it.note + '</small></div><b>×' + v[k] + '</b>')); });
    if (!any) box.appendChild(el('p', 'sub', 'Your cargo hold is empty.'));
    var u = load('wf-upgrades', {}); var up = [];
    if (u.engine) up.push('Engines Mk ' + u.engine); if (u.shield) up.push('Shields Mk ' + u.shield); if (u.gun) up.push('Cannons Mk ' + u.gun); if (u.paint && u.paint !== 'copper') up.push(u.paint + ' paint');
    box.appendChild(el('p', 'sub', up.length ? '🛠 Ship: ' + up.join(' · ') : '🛠 Ship upgrades: buy them at Chitin & Thrust in the Hiveport'));
  }

  // ── DECK MAP (user, Nov 26: "a helluva lot more detailed and realistic, and live"): a blueprint of the whole deck, bow up.
  //    Every room is drawn in its true shape (Bridge guitar-pick outline, round rooms, the square Holodeck) with its REAL furniture
  //    footprints (maps/deck.json, baked from each page's collision scan), the corridor with its bookcases, doors and hull. A live
  //    layer redraws every 0.4 s: you (arrow = where you face), droids, cats (initials), faults ⚠. Tap a room to go there.
  var DECK = null; function deckData(cb) { if (DECK) return cb(DECK); fetch('maps/deck.json?v=1').then(function (r) { return r.json(); }).then(function (d) { DECK = d; cb(d); }).catch(function () { cb(null); }); }
  var SR = 7, KC = 1;                                      // px per metre inside rooms · the atrium maps itself (12 px/m across, 10.5 px/m along)
  var ROOMS = {   // map centre + how room-local metres turn on the map (each room's door faces its corridor doorway)
    bridge:   { c: [300, 183], m: function (x, z) { return [x, z]; }, page: 'bridge.html', name: 'COMMAND BRIDGE', em: '🛸' },
    holodeck: { c: [185, 345], m: function (x, z) { return [z, -x]; }, page: 'holodeck.html', name: 'HOLODECK', em: '🎮' },
    lounge:   { c: [416, 345], m: function (x, z) { return [-z, x]; }, page: 'lounge.html', name: 'CREW LOUNGE', em: '🐈' },
    media:    { c: [416, 585], m: function (x, z) { return [-z, x]; }, page: 'media.html', name: 'MEDIA NEXUS', em: '🎬' },
    library:  { c: [300, 836], m: function (x, z) { return [-x, -z]; }, page: 'library.html', name: 'THE LIBRARY', em: '🧠' },
    corridor: { c: [300, 500], m: function (x, z) { return [x * 12, (z - 0.9) * 10.5]; }, page: 'index.html', name: 'ATRIUM', em: '🚪' },
    quarters: { c: [300, 500], m: function (x, z) { return [x * 12, (z - 0.9) * 10.5]; }, page: 'quarters.html', name: "CAPTAIN'S QTRS", em: '🎖', nolabel: true }   /* ship coords, like the atrium */
  };
  var OFFR = { corridor: 0, bridge: 1, holodeck: 2, lounge: 3, media: 4, library: 5 };
  function mapPt(room, lx, lz) { var R = ROOMS[room], q = R.m(lx, lz), k = (room === 'corridor' || room === 'quarters') ? KC : SR; return [R.c[0] + q[0] * k, R.c[1] + q[1] * k]; }
  // TAP-TO-TRAVEL (user, Nov 28): a tap on the deck map is turned back into the room's own metres (inverse of ROOMS[id].m) and you are put on that exact spot.
  var INV = {   // map-px offset from the room centre (already divided by px/m) -> room-local [x, z]
    bridge: function (qx, qy) { return [qx, qy]; }, holodeck: function (qx, qy) { return [-qy, qx]; }, lounge: function (qx, qy) { return [qy, -qx]; },
    media: function (qx, qy) { return [qy, -qx]; }, library: function (qx, qy) { return [-qx, -qy]; }, corridor: function (qx, qy) { return [qx / 12, qy / 10.5 + 0.9]; }
  };
  function tapPt(svg, ev, inv) {
    var g = svg._rot && svg._rot.g; if (!g || !g.getScreenCTM) return null; var id = null, k;
    var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; var q = pt.matrixTransform(g.getScreenCTM().inverse());
    for (var r in INV) if (INV[r] === inv) id = r; if (!id) return null; var R = ROOMS[id]; k = id === 'corridor' ? KC : SR;
    var s = inv((q.x - R.c[0]) / k, (q.y - R.c[1]) / k); return [+s[0].toFixed(2), +s[1].toFixed(2)];
  }
  function gotoNow(g) {
    if (g.page === 'corridor') { var a = document.getElementById('atrium'), c = a && a.components && a.components['wf-atrium']; return !!(c && c.gotoSpot && c.gotoSpot(g.x, g.z, g.y || 0)); }
    var sc = document.querySelector('a-scene'), rig = document.getElementById('player'); if (!sc || !sc.camera || !rig) return false;
    var cw = new AFRAME.THREE.Vector3(); sc.camera.getWorldPosition(cw); rig.object3D.position.x += g.x - cw.x; rig.object3D.position.z += g.z - cw.z; return true;
  }
  (function arrive() {   // a map tap on another page sent us here: wait for the room to finish spawning, then step to the spot (the atrium does this itself in ready())
    var g; try { g = JSON.parse(sessionStorage.getItem('wf-goto') || 'null'); } catch (e) { g = null; }
    if (!g || g.page === 'corridor' || g.page !== PAGE) return; if (Date.now() - g.t > 90000) { sessionStorage.removeItem('wf-goto'); return; }
    var n = 0, iv = setInterval(function () { var sc = document.querySelector('a-scene'); if (++n > 60) { clearInterval(iv); sessionStorage.removeItem('wf-goto'); if (window.WF_LOADSCREEN) WF_LOADSCREEN.ready(); return; }
      if (!sc || !sc.hasLoaded || !sc.camera || n < 8) return; clearInterval(iv); sessionStorage.removeItem('wf-goto'); gotoNow(g); if (window.WF_LOADSCREEN) setTimeout(WF_LOADSCREEN.ready, 600); }, 400);
  })();
  var mapTimer = null;
  // HIVEPORT MAP (user, Nov 26: "I'm at the Hiveport so this map is wrong"): on station.html the MAP tab shows the station deck
  // (hiveport/layout.json: zones, walls, obstacles), the bar, holo stage, shops, bounty broker, airlock with the Wayfarer docked
  // beyond it, every K'Vetar live (red = today's WANTED) and you. Long axis runs down the phone: v = west→east, u = north→south.
  function renderHiveMap() {
    var go = function (LY) {
      if (!box || tab !== 'map') return;
      var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 300 600'); svg.setAttribute('class', 'map');
      function add(tag, at, parent) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); (parent || svg).appendChild(e); return e; }
      var K = 5.3, P = function (x, z) { return [150 + z * K, 290 + x * K]; };
      function rect(x0, z0, x1, z1, at, g) { var a = P(x0, z0), b = P(x1, z1); return add('rect', Object.assign({ x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), width: Math.abs(b[0] - a[0]), height: Math.abs(b[1] - a[1]) }, at), g); }
      var defs = add('defs', {}), pat = add('pattern', { id: 'hvgrid', width: 12, height: 12, patternUnits: 'userSpaceOnUse' }, defs); add('path', { d: 'M12 0H0V12', fill: 'none', stroke: 'rgba(200,140,255,.07)', 'stroke-width': 1 }, pat);
      add('rect', { x: 0, y: 0, width: 300, height: 600, fill: 'url(#hvgrid)' });
      var ZC = { nexus: 'rgba(160,80,255,.10)', gaming: 'rgba(80,200,255,.08)', detox: 'rgba(120,255,180,.07)', trade_lounge: 'rgba(255,190,80,.08)', dining: 'rgba(255,150,90,.07)' };
      (LY.rooms || []).forEach(function (r) { var b = r.bounds; rect(b[0], b[1], b[2], b[3], { fill: ZC[r.id] || 'rgba(255,255,255,.04)', stroke: 'rgba(210,160,255,.55)', 'stroke-width': 1.4 });
        var SHORT = { nexus: 'CENTRAL NEXUS', private_suites: '🛏 SUITES', trade_lounge: '🛒 TRADE LOUNGE', lounge_pods: '🛋 LOUNGE PODS', dining: '🍽 DINING HALL', service: '🛡 SECURITY', detox: '⚕ MEDICAL / DETOX', gaming: '🎲 GAMING ARENA', quiet_lounge: '🌙 QUIET LOUNGE' };
        var c = P((b[0] + b[2]) / 2, (b[1] + b[3]) / 2), side = r.id !== 'nexus', ty = side ? c[1] : c[1] - 112;
        var t = add('text', { x: c[0], y: ty, 'text-anchor': 'middle', fill: '#f2e6ff', 'font-size': side ? 8 : 9, 'font-weight': 800, 'letter-spacing': 0.8, stroke: 'rgba(0,0,0,.6)', 'stroke-width': 2.2, 'paint-order': 'stroke', transform: side ? 'rotate(-90 ' + c[0] + ' ' + ty + ')' : '' }); t.textContent = SHORT[r.id] || r.label.toUpperCase(); });
      (LY.obstacles || []).forEach(function (o) { rect(o.min[0], o.min[1], o.max[0], o.max[1], { fill: 'rgba(230,200,255,.38)' }); });
      add('circle', { cx: P(0, -15)[0], cy: P(0, -15)[1], r: 4 * K, fill: 'rgba(170,90,255,.2)', stroke: 'rgba(200,140,255,.8)', 'stroke-dasharray': '3 2' });                                     // holo stage
      rect(-6, -9, 6, -2.5, { fill: 'rgba(255,80,220,.12)', stroke: 'rgba(255,120,230,.5)', 'stroke-width': 0.8 });                                                                                   // dance floor
      rect(-6.5, 12.6, 6.5, 14.8, { fill: 'rgba(255,170,60,.35)', stroke: '#ffb050', 'stroke-width': 1, rx: 4 });                                                                                     // the Resin Spire bar
      var lab = function (x, z, txt, col) { var q = P(x, z), t = add('text', { x: q[0], y: q[1], 'text-anchor': 'middle', fill: col || '#ffe2b0', 'font-size': 7.5, 'font-weight': 800, stroke: 'rgba(0,0,0,.65)', 'stroke-width': 2.2, 'paint-order': 'stroke' }); t.textContent = txt; };
      lab(0, -15, '✨ HOLO STAGE', '#e8c8ff'); lab(0, -5.5, '🪩 DANCE FLOOR', '#ffc0f0'); lab(0, 11.8, '🍸 RESIN SPIRE BAR'); lab(4.2, 19.4, '🎯 BOUNTIES', '#ff9a8a'); 
      var al = P(0, 22); add('rect', { x: al[0] - 2, y: al[1] - 16, width: 10, height: 32, rx: 3, fill: 'rgba(120,230,255,.5)', stroke: '#8ff', 'stroke-width': 1 });
      var sh = P(0, 27); add('path', { d: 'M' + (sh[0] + 22) + ' ' + sh[1] + ' C' + (sh[0] + 4) + ' ' + (sh[1] - 16) + ' ' + (sh[0] - 6) + ' ' + (sh[1] - 12) + ' ' + (sh[0] - 6) + ' ' + sh[1] + ' C' + (sh[0] - 6) + ' ' + (sh[1] + 12) + ' ' + (sh[0] + 4) + ' ' + (sh[1] + 16) + ' ' + (sh[0] + 22) + ' ' + sh[1] + ' Z', fill: 'rgba(220,130,70,.45)', stroke: '#ffb070', 'stroke-width': 1 });
      var ts = add('text', { x: sh[0] + 4, y: sh[1] + 30, 'text-anchor': 'middle', fill: '#ffd0a0', 'font-size': 7, 'font-weight': 800 }); ts.textContent = 'AIRLOCK → WAYFARER';
      var live = add('g', {});
      box.appendChild(el('p', 'sub', '📍 You are aboard the K’Vetar <b>Hiveport</b> · <span style="color:#6ff">▲</span> you · <span style="color:#d8b8ff">●</span> K’Vetar · <span style="color:#ff6a5a">●</span> WANTED · the Wayfarer is docked at the airlock'));
      box.appendChild(svg);
      var back = el('button', 'wide', '🚀 Back to the Wayfarer'); back.style.cssText = 'display:block;margin:8px auto 0;padding:10px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;font:700 13px -apple-system,system-ui,sans-serif';
      back.onclick = function () { close(); toast('Undocking…'); setTimeout(function () { location.href = 'minigame.html?from=station'; }, 250); }; box.appendChild(back);
      function drawLive() {
        while (live.firstChild) live.removeChild(live.firstChild);
        var H = window.HIVE, N = (H && H.NPCS) || [];
        N.forEach(function (e) { if (!e.a || !e.a.p) return; var q = P(e.a.p[0], e.a.p[1]); add('circle', { cx: q[0], cy: q[1], r: e.bounty ? 4.5 : 3, fill: e.bounty ? '#ff6a5a' : '#d8b8ff', stroke: '#140a1e', 'stroke-width': 1 }, live); });
        var sc = document.querySelector('a-scene'); if (sc && sc.camera) {
          var cam = sc.camera, cp = new AFRAME.THREE.Vector3(), cd = new AFRAME.THREE.Vector3(); cam.getWorldPosition(cp); cam.getWorldDirection(cd);
          var p0 = P(cp.x, cp.z), p1 = P(cp.x + cd.x, cp.z + cd.z), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180 / Math.PI + 90;
          add('circle', { cx: p0[0], cy: p0[1], r: 10 + 3 * Math.sin(Date.now() / 250), fill: 'rgba(100,255,255,.18)' }, live);
          add('path', { d: 'M0 -8 L5.5 5.5 L0 2.7 L-5.5 5.5 Z', fill: '#6ffff0', stroke: '#032', 'stroke-width': 1.1, transform: 'translate(' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ') rotate(' + ang.toFixed(0) + ')' }, live); }
      }
      drawLive(); clearInterval(mapTimer); mapTimer = setInterval(function () { if (!box || box.style.display === 'none' || tab !== 'map' || !svg.isConnected) { clearInterval(mapTimer); return; } drawLive(); }, 400);
    };
    if (window.HIVE && HIVE.LAYOUT) go(HIVE.LAYOUT); else fetch('hiveport/layout.json').then(function (r) { return r.json(); }).then(go).catch(function () {});
  }
  // LOWER DECK MAP (Nov 26 atrium rebuild): the kit's lower rooms in ship coordinates (reference/atrium-kit/layout.json), the lower
  // atrium, the twin stairs and the Engine Room; you on any lower-deck page (or downstairs in the atrium). UPPER / LOWER toggle.
  var LOWER = ['medbay', 'xeno', 'mess', 'maint', 'firefly', 'engine'], LPAGE = { Medbay: 'medbay', Xenobiology: 'xeno', Mess_Hall: 'mess', Maintenance_Storage: 'maint', Firefly_Hangar: 'firefly' };
  var LNAME = { Medbay: '⚕ MEDBAY', Xenobiology: '🧪 XENOBIOLOGY', Mess_Hall: '🍽 MESS HALL', Maintenance_Storage: '🔧 MAINTENANCE', Firefly_Hangar: '🚀 FIREFLY HANGAR' };
  var mapDeck = null;
  function onLower() { if (LOWER.indexOf(PAGE) >= 0 || PAGE === 'core') return true; if (PAGE !== 'corridor') return false; var p = document.getElementById('player'); return !!(p && p.object3D.position.y < -3); }
  function deckTabs() { var row = el('div', 'sub', ''); row.style.cssText = 'display:flex;gap:8px;justify-content:center;margin:0 0 6px';
    [['upper', '⬆ UPPER DECK'], ['lower', '⬇ LOWER DECK']].forEach(function (q) { var b = el('button', '', q[1]); b.style.cssText = 'padding:6px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);font:700 11px -apple-system,system-ui,sans-serif;letter-spacing:1px;color:#fff;background:' + ((mapDeck || (onLower() ? 'lower' : 'upper')) === q[0] ? 'rgba(77,227,255,.22)' : 'rgba(255,255,255,.06)') + ';border-color:' + ((mapDeck || (onLower() ? 'lower' : 'upper')) === q[0] ? 'rgba(77,227,255,.7)' : 'rgba(255,255,255,.2)');
      b.onclick = function () { mapDeck = q[0]; render(); }; row.appendChild(b); }); box.appendChild(row); }
  // Nov 27 (user: the map should reflect where I'm facing): HEADING-UP — the blueprint group turns (and shrinks to stay in frame) so your arrow always points up; upside-down labels flip back
  var mapAng = null, rotCum = 0;
  function wrapRot(svg) { var vb = svg.getAttribute('viewBox').split(' ').map(Number), g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'rot'); while (svg.firstChild) g.appendChild(svg.firstChild); svg.appendChild(g); svg._rot = { g: g, w: vb[2], h: vb[3], cx: vb[0] + vb[2] / 2, cy: vb[1] + vb[3] / 2, cur: null, tgt: 0, k: 1, on: false }; mapAng = null; }
  function applyRot(svg) {
    var r = svg._rot; if (!r || mapAng == null) return; var d = (((-mapAng - rotCum) % 360) + 540) % 360 - 180; rotCum += d;
    var rad = rotCum * Math.PI / 180, c = Math.abs(Math.cos(rad)), sn = Math.abs(Math.sin(rad)), k = Math.min(1, r.w / (r.w * c + r.h * sn), r.h / (r.w * sn + r.h * c));
    r.tgt = rotCum; r.k = k; if (r.cur === null) r.cur = rotCum;
    if (!r.on) { r.on = true; (function step() { if (!svg.isConnected) { r.on = false; return; } r.cur += (r.tgt - r.cur) * 0.2; if (Math.abs(r.tgt - r.cur) < 0.05) r.cur = r.tgt;
      r.g.setAttribute('transform', 'translate(' + r.cx + ' ' + r.cy + ') rotate(' + r.cur.toFixed(2) + ') scale(' + r.k.toFixed(3) + ') translate(' + (-r.cx) + ' ' + (-r.cy) + ')'); requestAnimationFrame(step); }()); }
    var m = ((rotCum % 360) + 360) % 360, flip = m > 100 && m < 260;
    Array.prototype.forEach.call(svg.querySelectorAll('text'), function (t) { if (t.__o === undefined) { t.__o = t.getAttribute('transform') || ''; try { var b = t.getBBox(); t.__c = [b.x + b.width / 2, b.y + b.height / 2]; } catch (e) { t.__c = [0, 0]; } }
      var want = flip ? t.__o + ' rotate(180 ' + t.__c[0].toFixed(1) + ' ' + t.__c[1].toFixed(1) + ')' : t.__o; if (want) t.setAttribute('transform', want); else t.removeAttribute('transform'); });
  }
  // ═══ UNIFIED DECK MAP (user + ChatGPT review, Nov 28) ═══
  // ONE ship coordinate system (layout.json metres: x starboard +, z aft +, bow = −z), ONE uniform scale, ONE hull, both decks bow-up.
  // Rooms come from layout.json (ship coords); furniture from maps/deck.json (upper, page-local → ship via XF) and maps/deck-lower.json (lower).
  // Three views: DECK (upper/lower, navigation), ENGINEERING (adds machinery + metre grid), CUTAWAY (longitudinal section of both decks).
  var MS = 8, MOX = 300, MOZ = 500, LOWY = -5.95;
  function MP(x, z) { return [MOX + x * MS, MOZ + z * MS]; }
  var BZ = 0.765;   // the Bridge page is 18 m long, the kit's Command_Bridge shell 14 m: page furniture is squeezed by this to sit inside the kit outline (known mismatch)
  var XF = {   // room-local (page world) ↔ ship metres. rd = the local z of that room's door
    corridor: { to: function (x, z) { return [x, z]; }, from: function (x, z) { return [x, z]; } },
    xeno: null, mess: null, maint: null, firefly: null,
    bridge: { to: function (x, z) { return [x, -24 + (z - 7.9) * BZ]; }, from: function (x, z) { return [x, (z + 24) / BZ + 7.9]; } },
    holodeck: { to: function (x, z) { return [-4.6 + (z - 8.7), -14 - x]; }, from: function (x, z) { return [-(z + 14), x + 4.6 + 8.7]; } },
    lounge: { to: function (x, z) { return [4.6 - (z - 8.7), -14 + x]; }, from: function (x, z) { return [z + 14, 8.7 - (x - 4.6)]; } },
    media: { to: function (x, z) { return [4.6 - (z - 8.9), 9 + x]; }, from: function (x, z) { return [z - 9, 8.9 - (x - 4.6)]; } },
    library: { to: function (x, z) { return [-x, 36 - z]; }, from: function (x, z) { return [-x, 36 - z]; } },
    medbay: { to: function (x, z) { return [-4.6 + (z - 3.4), -14 - x]; }, from: function (x, z) { return [-(z + 14), x + 4.6 + 3.4]; } },
    core: { to: function (x, z) { return [x, 36 + z]; }, from: function (x, z) { return [x, z - 36]; } }
  };
  ['xeno', 'mess', 'maint', 'firefly'].forEach(function (k) { XF[k] = XF.corridor; });
  var RMS = [
    { k: 'Command_Bridge', id: 'bridge', name: 'COMMAND BRIDGE', deck: 'upper', page: 'bridge.html' }, { k: 'Holodeck', id: 'holodeck', name: 'HOLODECK', deck: 'upper', page: 'holodeck.html' },
    { k: 'Captains_Quarters', id: 'quarters', name: "CAPTAIN'S QUARTERS", deck: 'upper', page: 'quarters.html' }, { k: 'Crew_Lounge', id: 'lounge', name: 'CREW LOUNGE', deck: 'upper', page: 'lounge.html' },
    { k: 'Media_Nexus', id: 'media', name: 'MEDIA NEXUS', deck: 'upper', page: 'media.html' }, { k: 'Library_Halcyon', id: 'library', name: 'LIBRARY', deck: 'upper', page: 'library.html' },
    { k: 'Firefly_Hangar', id: 'firefly', name: 'FIREFLY HANGAR', deck: 'lower', page: 'firefly.html' }, { k: 'Medbay', id: 'medbay', name: 'MEDBAY', deck: 'lower', page: 'medbay.html' },
    { k: 'Xenobiology', id: 'xeno', name: 'XENOBIOLOGY', deck: 'lower', page: 'xeno.html' }, { k: 'Mess_Hall', id: 'mess', name: 'MESS HALL', deck: 'lower', page: 'mess.html' },
    { k: 'Maintenance_Storage', id: 'maint', name: 'MAINTENANCE', deck: 'lower', page: 'maint.html' }, { k: 'Engine_Room', id: 'core', name: 'ENGINE ROOM', deck: 'lower', page: 'core.html' }
  ];
  var mapTok = 0, mapDest = null, LAYOUT = null, DECK2 = null, mapMode = load('wf-mapmode', 'nav'), headUp = load('wf-maphead', false);
  function mapData(cb) {
    var n = 3; function done() { if (--n === 0) cb(); }
    if (LAYOUT) done(); else fetch('reference/atrium-kit/layout.json').then(function (r) { return r.json(); }).then(function (d) { LAYOUT = d; }).catch(function () {}).then(done);
    deckData(function () { done(); });
    if (DECK2) done(); else fetch('maps/deck-lower.json?v=1').then(function (r) { return r.json(); }).then(function (d) { DECK2 = d; }).catch(function () { DECK2 = {}; }).then(done);
  }
  function mapControls() {
    var which = mapDeck || (onLower() ? 'lower' : 'upper'), wrap = el('div', 'mc', '');
    function row(items, on, fn) { var r = el('div', 'mr', ''); items.forEach(function (q) { var b = el('button', on === q[0] ? 'on' : '', q[1]); b.onclick = function () { fn(q[0]); }; r.appendChild(b); }); wrap.appendChild(r); }
    row([['upper', 'UPPER'], ['lower', 'LOWER'], ['cut', 'CUTAWAY']], which, function (v) { mapDeck = v; render(); });
    var tg = el('button', '', 'VIEW ▾'); tg.style.flex = '0 0 76px'; tg.onclick = function () { wrap.classList.toggle('open'); }; wrap.firstChild.appendChild(tg);
    row([['nav', 'NAVIGATION'], ['eng', 'ENGINEERING']], mapMode, function (v) { mapMode = v; save('wf-mapmode', v); render(); }); wrap.lastChild.classList.add('opt');
    row([['n', 'BOW UP'], ['h', 'HEADING UP']], headUp ? 'h' : 'n', function (v) { headUp = v === 'h'; save('wf-maphead', headUp); render(); }); wrap.lastChild.classList.add('opt');
    box.appendChild(wrap);
  }
  function hullHW(prof, z) { if (!prof || z < prof[0][0] || z > prof[prof.length - 1][0]) return 0; for (var i = 1; i < prof.length; i++) if (z <= prof[i][0]) { var a = prof[i - 1], b = prof[i], t = (z - a[0]) / (b[0] - a[0] || 1); return a[1] + (b[1] - a[1]) * t; } return 0; }
  function profPoly(prof, pad) { var R = [], L = []; prof.forEach(function (q) { R.push([q[1] + pad, q[0]]); L.unshift([-q[1] - pad, q[0]]); }); return R.concat(L); }
  function renderMap() {
    if (PAGE === 'hiveport') return renderHiveMap();
    mapControls();
    var which = mapDeck || (onLower() ? 'lower' : 'upper');
    var tok = ++mapTok; mapData(function () { if (tok !== mapTok || !box || tab !== 'map' || !LAYOUT) return; if (which === 'cut') drawSection(); else drawDeck(which); });
  }
  function mapSvg(vb) {
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', vb); svg.setAttribute('class', 'map');
    var add = function (tag, at, parent) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); (parent || svg).appendChild(e); return e; };
    var V = vb.split(' ').map(Number), defs = add('defs', {});
    var g1 = add('pattern', { id: 'dg', width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, defs); add('path', { d: 'M8 0H0V8', fill: 'none', stroke: 'rgba(120,200,255,.07)', 'stroke-width': .6 }, g1);
    var g2 = add('pattern', { id: 'dgm', width: 80, height: 80, patternUnits: 'userSpaceOnUse', patternTransform: 'translate(' + (MOX % 80) + ' ' + (MOZ % 80) + ')' }, defs); add('path', { d: 'M80 0H0V80', fill: 'none', stroke: 'rgba(120,200,255,.15)', 'stroke-width': .8 }, g2);
    var hp = add('pattern', { id: 'dh', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs); add('path', { d: 'M0 0V5', stroke: 'rgba(127,227,255,.14)', 'stroke-width': .8 }, hp);
    add('rect', { x: V[0], y: V[1], width: V[2], height: V[3], fill: '#0a1424' }); add('rect', { x: V[0], y: V[1], width: V[2], height: V[3], fill: 'url(#dg)' }); add('rect', { x: V[0], y: V[1], width: V[2], height: V[3], fill: 'url(#dgm)' });
    return { svg: svg, add: add };
  }
  var C_HULL = '#c98a52', C_LINE = '#7fe3ff', C_BIO = '#4fbfa8', C_TXT = '#cfeeff', FONT = 'ui-monospace,Menlo,monospace';
  function drawDeck(which) {
    var M = mapSvg('56 62 488 876'), svg = M.svg, add = M.add, P = MP, eng = mapMode === 'eng', lower = which === 'lower', D1 = DECK, D2 = DECK2 || {};
    var ptsS = function (a) { return a.map(function (q) { var p = P(q[0], q[1]); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); };
    var PR = LAYOUT.deckProfiles, up = PR.upper, lo = PR.lower;
    // exterior hull = the widest of both deck profiles at each station (+ plating); each deck's own outline sits inside it (taper per elevation)
    var env = [], z; for (z = -52; z <= 52; z += 2) env.push([z, Math.max(hullHW(up, z), hullHW(lo, z))]); env = env.filter(function (q) { return q[1] > 0; });
    add('polygon', { points: ptsS(profPoly(env, 0.9)), fill: 'none', stroke: C_HULL, 'stroke-width': 2.4, 'stroke-linejoin': 'round' });
    add('polygon', { points: ptsS(profPoly(lower ? lo : up, 0)), fill: 'rgba(20,50,80,.35)', stroke: 'rgba(127,227,255,.55)', 'stroke-width': 1.2 });
    [-1, 1].forEach(function (sx) { var a = P(sx * 22.5, 24), b = P(sx * 18, 30); add('rect', { x: Math.min(a[0], P(sx * 27.5, 24)[0]), y: P(0, 24)[1], width: 5 * MS, height: 22 * MS, rx: 5, fill: 'none', stroke: C_HULL, 'stroke-width': 1.3, 'stroke-dasharray': '5 3' }); add('path', { d: 'M' + P(sx * 18.3, 31)[0] + ' ' + P(0, 31)[1] + 'H' + P(sx * 22.5, 31)[0], stroke: C_HULL, 'stroke-width': 1.3 }); });   // engine nacelles + struts
    add('path', { d: 'M' + MOX + ' 70V930', stroke: 'rgba(207,238,255,.5)', 'stroke-width': .6, 'stroke-dasharray': '12 3 2 3' });
    var gR = M.add('g', { id: 'mapnav' });
    var GR = function (at) { return add('g', at || {}, svg); };
    // ── atrium ──
    var ga = GR({ class: 'rm' }); ga.addEventListener('click', function (ev) { mapClick(svg, ev, 'corridor', lower); });
    add('polygon', { points: ptsS(LAYOUT.corridor.outerPolygon), fill: 'url(#dh)', stroke: C_LINE, 'stroke-width': 1.6 }, ga);
    var op = ptsS(LAYOUT.corridor.upperOpening); add('polygon', { points: op, fill: lower ? 'rgba(127,227,255,.10)' : 'rgba(0,0,0,.35)', stroke: lower ? 'rgba(127,227,255,.5)' : C_LINE, 'stroke-width': 1, 'stroke-dasharray': lower ? '3 3' : '' }, ga);
    var at = P(0, 0); var tA = add('text', { x: at[0], y: at[1], 'text-anchor': 'middle', fill: C_TXT, 'font-size': 8, 'letter-spacing': 3, 'font-family': FONT, transform: 'rotate(-90 ' + at[0] + ' ' + at[1] + ')', opacity: .85 }, ga); tA.textContent = lower ? 'LOWER ATRIUM' : 'UPPER ATRIUM';
    // ── rooms ──
    RMS.filter(function (r) { return r.deck === which; }).forEach(function (r) {
      var R = LAYOUT.rooms[r.k]; if (!R) return; var g = GR({ class: 'rm' }), cx, cz;
      g.addEventListener('click', function (ev) { mapClick(svg, ev, r.id, lower); });
      if (R.center) { cx = R.center[0]; cz = R.center[2]; var c = P(cx, cz), rr = R.radius * MS;
        add('circle', { cx: c[0], cy: c[1], r: rr, fill: 'url(#dh)', stroke: C_LINE, 'stroke-width': 1.8 }, g);
        if (lower) { add('circle', { cx: c[0], cy: c[1], r: 5.85 * MS, fill: 'rgba(0,0,0,.4)', stroke: 'rgba(127,227,255,.6)', 'stroke-width': 1 }, g); }
        add('circle', { cx: c[0], cy: c[1], r: 5 * MS, fill: 'rgba(79,191,168,.16)', stroke: C_BIO, 'stroke-width': 1.3, 'stroke-dasharray': lower ? '' : '4 2' }, g);          // the Second Brain's chamber: one structure through both decks
        add('circle', { cx: c[0], cy: c[1], r: lower ? 1.35 * MS : 2.2 * MS, fill: 'rgba(79,191,168,.38)', stroke: C_BIO, 'stroke-width': 1 }, g); }
      else { add('polygon', { points: ptsS(R.polygon), fill: 'url(#dh)', stroke: C_LINE, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, g); cx = 0; cz = 0; R.polygon.forEach(function (q) { cx += q[0]; cz += q[1]; }); cx /= R.polygon.length; cz /= R.polygon.length; }
      // furniture from the real collision scan, moved into ship coordinates
      var src = (lower ? D2 : D1) && (lower ? D2 : D1)[r.id], xf = XF[r.id];
      if (src && src.solids && xf) src.solids.forEach(function (b) { var q = [xf.to(b[0], b[1]), xf.to(b[2], b[1]), xf.to(b[2], b[3]), xf.to(b[0], b[3])]; add('polygon', { points: ptsS(q), fill: eng ? 'rgba(127,227,255,.30)' : 'rgba(127,227,255,.16)', stroke: 'rgba(127,227,255,.5)', 'stroke-width': .5 }, g); });
      if (r.id === 'firefly') {   // the Firefly on its cradle, nose to the forward launch jaw + the triangular loading ramp (schematic: anchors not measured)
        add('polygon', { points: ptsS([[0, -47], [3.2, -42], [4.4, -37], [3, -33.5], [-3, -33.5], [-4.4, -37], [-3.2, -42]]), fill: 'rgba(201,138,82,.25)', stroke: C_HULL, 'stroke-width': 1.4 }, g);
        add('polygon', { points: ptsS([[-4.2, -46.5], [4.2, -46.5], [0, -52]]), fill: 'none', stroke: C_HULL, 'stroke-width': 1.2, 'stroke-dasharray': '3 2' }, g);
        add('path', { d: 'M' + P(-6, -32)[0] + ' ' + P(0, -32)[1] + 'H' + P(6, -32)[0], stroke: C_HULL, 'stroke-width': 1, 'stroke-dasharray': '2 2' }, g); }
      var lp = P(cx, cz + (r.id === 'library' || r.id === 'core' ? 0 : -1.5)), lt = add('text', { x: lp[0], y: lp[1], 'text-anchor': 'middle', fill: C_TXT, 'font-size': 7.4, 'font-weight': 700, 'letter-spacing': 1.2, 'font-family': FONT, stroke: '#0a1424', 'stroke-width': 2.4, 'paint-order': 'stroke' }, g); lt.textContent = r.name;
      if (eng) { var a = R.radius ? Math.PI * R.radius * R.radius : (function () { var s = 0, p = R.polygon; for (var i = 0; i < p.length; i++) { var q = p[(i + 1) % p.length]; s += p[i][0] * q[1] - q[0] * p[i][1]; } return Math.abs(s) / 2; })();
        var at2 = add('text', { x: lp[0], y: lp[1] + 9, 'text-anchor': 'middle', fill: 'rgba(207,238,255,.6)', 'font-size': 6, 'font-family': FONT }, g); at2.textContent = Math.round(a) + ' m²'; }
      // door: a gap bar on the wall at the door
      var dr = R.door; if (dr) { var d = P(dr[0], dr[2]), vert = Math.abs(dr[0]) > 2.4; add('path', { d: vert ? 'M' + d[0] + ' ' + (d[1] - 1.05 * MS) + 'V' + (d[1] + 1.05 * MS) : 'M' + (d[0] - 1.05 * MS) + ' ' + d[1] + 'H' + (d[0] + 1.05 * MS), stroke: '#ffd27a', 'stroke-width': 3, 'stroke-linecap': 'butt' }, svg); }
    });
    if (lower) add('polygon', { points: ptsS(LAYOUT.corridor.outerPolygon), fill: 'none', stroke: C_LINE, 'stroke-width': 1.2, 'pointer-events': 'none' });
    // twin curved stairs: identical on both decks
    [-1, 1].forEach(function (sx) { var d = '', a, p; for (a = -0.35; a <= 1.16; a += 0.05) { p = P(sx * 11.35 * Math.cos(a), 36 + 11.35 * Math.sin(a)); d += (d ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
      add('path', { d: d, fill: 'none', stroke: '#ffd27a', 'stroke-width': 3.2, opacity: .85, 'stroke-dasharray': '1.5 2.5', 'pointer-events': 'none' }); var m = P(sx * 11.35 * Math.cos(.4), 36 + 11.35 * Math.sin(.4)), t = add('text', { x: m[0] + sx * 9, y: m[1], 'text-anchor': 'middle', fill: '#ffd27a', 'font-size': 6.2, 'font-family': FONT, 'letter-spacing': 1, 'pointer-events': 'none' }); t.textContent = lower ? 'UP' : 'DOWN'; });
    if (eng) { for (z = -50; z <= 50; z += 10) { var gz = P(0, z), tk = add('text', { x: 66, y: gz[1] + 2, fill: 'rgba(207,238,255,.45)', 'font-size': 6, 'font-family': FONT }); tk.textContent = (z > 0 ? '+' : '') + z + ' m'; add('path', { d: 'M62 ' + gz[1] + 'H68', stroke: 'rgba(207,238,255,.4)', 'stroke-width': .6 }); } }
    // title block + compass + scale
    var tb = add('rect', { x: 372, y: 892, width: 164, height: 38, fill: 'rgba(10,20,36,.9)', stroke: 'rgba(127,227,255,.5)', 'stroke-width': .8 });
    [['SS WAYFARER', 'font-weight:700', 902], [lower ? 'LOWER DECK · y −5.95' : 'UPPER DECK · y 0.00', '', 913], ['1:125 · layout.json ship coords', '', 924]].forEach(function (q) { var t = add('text', { x: 378, y: q[2], fill: C_TXT, 'font-size': 7, 'font-family': FONT, 'letter-spacing': .8 }); t.textContent = q[0]; });
    add('circle', { cx: 84, cy: 100, r: 16, fill: 'none', stroke: 'rgba(207,238,255,.6)', 'stroke-width': .8 }); add('path', { d: 'M84 86 L89 106 L84 102 L79 106 Z', fill: C_TXT }); var nt = add('text', { x: 84, y: 82, 'text-anchor': 'middle', fill: C_TXT, 'font-size': 7, 'font-family': FONT }); nt.textContent = 'BOW';
    add('path', { d: 'M62 920H142M62 916V924M102 917V923M142 916V924', stroke: 'rgba(160,220,255,.8)', 'stroke-width': 1, fill: 'none' }); var sc = add('text', { x: 102, y: 934, 'text-anchor': 'middle', fill: C_TXT, 'font-size': 6.5, 'font-family': FONT }); sc.textContent = '10 m';
    var rt = add('g', { 'pointer-events': 'none' }), live = add('g', { 'pointer-events': 'none' }), goBar = el('div', 'go', ''), dest = mapDest;
    box.appendChild(el('p', 'sub', 'Tap a spot to plan a route, then GO · drag to pan · pinch to zoom'));
    box.appendChild(svg); wrapRot(svg); mapZoom(svg); box.appendChild(goBar); var leg = el('p', 'sub', ''); box.appendChild(leg);
    function drawRoute() {
      while (rt.firstChild) rt.removeChild(rt.firstChild); goBar.style.display = dest ? 'flex' : 'none'; if (!dest) return; goBar.innerHTML = '';
      var rp = planRoute(dest), info = el('span', '', ''), go = el('button', 'on', 'GO'), clr = el('button', '', 'CLEAR');
      if (rp) rp.legs.forEach(function (lg) { if (lg.deck !== which) return; var d = '', i; lg.pts.forEach(function (q, k) { var p = P(q[0], q[1]); d += (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); });
        add('path', { d: d, fill: 'none', stroke: '#0a1424', 'stroke-width': 4.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, rt); var pa = add('path', { d: d, fill: 'none', stroke: '#ffd27a', 'stroke-width': 2, 'stroke-dasharray': '5 4', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, rt); var an = document.createElementNS('http://www.w3.org/2000/svg', 'animate'); an.setAttribute('attributeName', 'stroke-dashoffset'); an.setAttribute('from', '18'); an.setAttribute('to', '0'); an.setAttribute('dur', '0.9s'); an.setAttribute('repeatCount', 'indefinite'); pa.appendChild(an);
        if (lg.stair) { var sp = P(lg.stair[0], lg.stair[1]); add('circle', { cx: sp[0], cy: sp[1], r: 5, fill: 'none', stroke: '#ffd27a', 'stroke-width': 1.6 }, rt); var tt = add('text', { x: sp[0] + 8, y: sp[1] + 3, fill: '#ffd27a', 'font-size': 7, 'font-weight': 700, 'font-family': FONT, stroke: '#0a1424', 'stroke-width': 2, 'paint-order': 'stroke' }, rt); tt.textContent = lg.up ? 'STAIRS UP' : 'STAIRS DOWN'; } });
      if (dest.deck === which) { var dp = P(dest.s[0], dest.s[1]); add('circle', { cx: dp[0], cy: dp[1], r: 11, fill: 'rgba(255,210,122,.12)', stroke: '#ffd27a', 'stroke-width': 1 }, rt); add('circle', { cx: dp[0], cy: dp[1], r: 3.2, fill: '#ffd27a', stroke: '#0a1424', 'stroke-width': 1 }, rt); add('path', { d: 'M' + (dp[0] - 15) + ' ' + dp[1] + 'H' + (dp[0] - 7) + 'M' + (dp[0] + 7) + ' ' + dp[1] + 'H' + (dp[0] + 15) + 'M' + dp[0] + ' ' + (dp[1] - 15) + 'V' + (dp[1] - 7) + 'M' + dp[0] + ' ' + (dp[1] + 7) + 'V' + (dp[1] + 15), stroke: '#ffd27a', 'stroke-width': 1.2 }, rt); }
      info.textContent = dest.name.toUpperCase() + ' · ' + (rp ? Math.round(rp.len) + ' m' + (rp.legs.length > 1 ? ' · via stairs' : '') + ' · ~' + Math.max(1, Math.round(rp.len / 1.4)) + ' s' : (youShip() ? 'NO ROUTE' : 'ROUTE UNAVAILABLE HERE'));
      go.onclick = function () { mapTravel(dest); }; clr.onclick = function () { dest = mapDest = null; drawRoute(); }; goBar.appendChild(info); goBar.appendChild(go); goBar.appendChild(clr);
    }
    svg._setDest = function (d) { if (dest && Math.hypot(dest.s[0] - d.s[0], dest.s[1] - d.s[1]) < 1.6) return mapTravel(d); dest = mapDest = d; drawRoute(); };
    drawRoute(); var routeT = setInterval(function () { if (!svg.isConnected) clearInterval(routeT); else if (dest && you2key() !== lastKey) { lastKey = you2key(); drawRoute(); } }, 1500), lastKey = you2key();
    function you2key() { var y = youShip(); return y ? Math.round(y.s[0] / 2) + ',' + Math.round(y.s[1] / 2) + y.deck : ''; }
    function drawLive() {
      while (live.firstChild) live.removeChild(live.firstChild);
      var sc2 = document.querySelector('a-scene'), eng2 = window.WAYFARER && window.WAYFARER.crew && window.WAYFARER.crew.engine, L = window.WAYFARER && window.WAYFARER.crewLayout, snap = load('wf-crew', null), where = {};
      {
        var NAMES = { nav: 'Aster', eng: 'Forge', sci: 'Vesper', com: 'Echo', tac: 'Sentinel', sen: 'Prism', ember: 'Ember', nimbus: 'Nimbus', orbit: 'Orbit', pixel: 'Pixel' };
        var list = eng2 ? Array.from(eng2.npcs.values()).map(function (n) { return { id: n.id, node: n.node, x: n.pos.x, z: n.pos.z, cat: n.kind === 'cat' }; })
                        : ((snap && snap.npcs) || []).map(function (n) { return { id: n.id, node: n.node, x: n.pos && n.pos.x, z: n.pos && n.pos.z, cat: /ember|nimbus|orbit|pixel/.test(n.id) }; });
        list.forEach(function (n) { var nd = L && L.nodes[n.node], room = nd ? nd.room : null, xf = room && XF[room]; if (!xf) return; var ny = n.y != null ? n.y : (nd && nd.y != null ? nd.y : (n.pos && n.pos.y != null ? n.pos.y : 0)); if ((LOWER.indexOf(room) >= 0 || ny < -3) !== lower) return; var off = OFFR[room] || 0, lx = n.x != null ? n.x - off * 100 : nd.lx, lz = n.z != null ? n.z : nd.lz, s = xf.to(lx, lz), p = P(s[0], s[1]), col = n.cat ? '#ffb0e0' : '#7fd8ff';
          add('circle', { cx: p[0], cy: p[1], r: n.cat ? 3.4 : 4.4, fill: col, stroke: '#0a1424', 'stroke-width': 1 }, live);
          var t = add('text', { x: p[0] + 6, y: p[1] + 3, fill: col, 'font-size': 6.8, 'font-weight': 700, 'font-family': FONT, stroke: '#0a1424', 'stroke-width': 2, 'paint-order': 'stroke' }, live); t.textContent = NAMES[n.id]; (where[room] = where[room] || []).push(NAMES[n.id]); });
      }
      load('wf-faults', []).forEach(function (f) { var xf = XF[f.room]; if (!xf || lower !== (LOWER.indexOf(f.room) >= 0)) return; var s = xf.to(f.x, f.z), p = P(s[0], s[1]), o = (Date.now() / 400 | 0) % 2 ? 1 : .45; add('path', { d: 'M' + p[0] + ' ' + (p[1] - 8) + 'L' + (p[0] + 7) + ' ' + (p[1] + 5) + 'H' + (p[0] - 7) + 'Z', fill: 'none', stroke: '#ff6b5a', 'stroke-width': 1.3, opacity: o }, live); });
      if (sc2 && sc2.camera && onLower() === lower && PAGE !== 'quarters') {      // YOU
        var cp = new AFRAME.THREE.Vector3(), cd = new AFRAME.THREE.Vector3(), xf2 = XF[PAGE]; sc2.camera.getWorldPosition(cp); sc2.camera.getWorldDirection(cd);
        if (xf2) { var s0 = xf2.to(cp.x, cp.z), s1 = xf2.to(cp.x + cd.x, cp.z + cd.z), p0 = P(s0[0], s0[1]), p1 = P(s1[0], s1[1]), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180 / Math.PI + 90;
          add('circle', { cx: p0[0], cy: p0[1], r: 9, fill: 'none', stroke: '#ffe14d', 'stroke-width': .9 }, live);
          add('path', { d: 'M0 -8 L5.5 5.5 L0 2.5 L-5.5 5.5 Z', fill: '#ffe14d', stroke: '#0a1424', 'stroke-width': 1, transform: 'translate(' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ') rotate(' + ang.toFixed(0) + ')' }, live); if (headUp) { mapAng = ang; } }
      }
      if (headUp && mapAng != null) applyRot(svg);
      leg.innerHTML = Object.keys(where).map(function (r) { return r.toUpperCase() + ': ' + where[r].join(', '); }).join(' · ');
    }
    drawLive(); clearInterval(mapTimer); mapTimer = setInterval(function () { if (!box || box.style.display === 'none' || tab !== 'map' || !svg.isConnected) { clearInterval(mapTimer); return; } drawLive(); }, 400);
  }
  // ═══ ROUTES: A* over the deck's walkable floor (atrium + room shapes, minus furniture), stairs link the decks ═══
  var GRIDS = {}, CELL = 0.5, GX0 = -32, GZ0 = -56, GNX = 128, GNZ = 224, STAIR = [{ x: 0, z: 0 }, { x: 0, z: 0 }];
  function stairEnd(sx, a) { return [sx * 11.35 * Math.cos(a), 36 + 11.35 * Math.sin(a)]; }
  function inPoly(p, x, z) { var c = false, i, j; for (i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; }
  function walkGrid(which) {
    if (GRIDS[which]) return GRIDS[which]; var lower = which === 'lower', ok = new Uint8Array(GNX * GNZ), i, j, polys = [], circs = [], block = [], SRC = lower ? (DECK2 || {}) : (DECK || {});
    polys.push(LAYOUT.corridor.outerPolygon); var hole = lower ? null : LAYOUT.corridor.upperOpening;
    RMS.filter(function (r) { return r.deck === which; }).forEach(function (r) {
      var R = LAYOUT.rooms[r.k]; if (!R) return; if (R.center) circs.push({ x: R.center[0], z: R.center[2], r: R.radius, hole: r.id === 'core' ? 5.85 : 0 }); else polys.push(R.polygon);
      var s = SRC[r.id], xf = XF[r.id]; if (s && s.solids && xf) s.solids.forEach(function (b) { block.push([xf.to(b[0], b[1]), xf.to(b[2], b[1]), xf.to(b[2], b[3]), xf.to(b[0], b[3])]); });
    });
    var src = SRC.corridor; if (!lower && src && src.solids) src.solids.forEach(function (b) { block.push([[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]]); });
    var doors = []; RMS.filter(function (r) { return r.deck === which; }).forEach(function (r) { var R = LAYOUT.rooms[r.k]; if (R && R.door) doors.push(R.door); });
    for (j = 0; j < GNZ; j++) for (i = 0; i < GNX; i++) {
      var x = GX0 + (i + .5) * CELL, z = GZ0 + (j + .5) * CELL, w = false, k;
      if (inPoly(polys[0], x, z) && !(hole && inPoly(hole, x, z))) w = true;
      for (k = 1; k < polys.length && !w; k++) if (inPoly(polys[k], x, z)) w = true;
      for (k = 0; k < circs.length && !w; k++) { var d = Math.hypot(x - circs[k].x, z - circs[k].z); if (d < circs[k].r - 0.4 && d > circs[k].hole) w = true; }
      for (k = 0; k < doors.length && !w; k++) { var dr = doors[k], vert = Math.abs(dr[0]) > 2.4; if (Math.abs(x - dr[0]) < (vert ? 1.6 : 1.0) && Math.abs(z - dr[2]) < (vert ? 1.0 : 1.6)) w = true; }
      for (k = 0; k < 2 && !w; k++) { var se = stairEnd(k ? 1 : -1, k ? -0.35 : -0.35); if (Math.hypot(x - se[0], z - se[1]) < 2.2) w = true; var sf = stairEnd(k ? 1 : -1, 1.16); if (Math.hypot(x - sf[0], z - sf[1]) < 2.2) w = true; }
      if (!w && lower && Math.abs(x) < 6.2 && z > 44.2 && z < 47.6) w = true;   // stair-foot foyer, joins the Core door at (0, 45.4)
      if (w) for (k = 0; k < block.length; k++) if (inPoly(block[k], x, z)) { w = false; break; }
      if (!w && !lower) for (k = 0; k < 2; k++) { var e = stairEnd(k ? 1 : -1, -0.35), f = [e[0] * 0.55, 36 + (e[1] - 36) * 0.55], vx = f[0] - e[0], vz = f[1] - e[1], tt = Math.max(0, Math.min(1, ((x - e[0]) * vx + (z - e[1]) * vz) / (vx * vx + vz * vz))); if (Math.hypot(x - e[0] - vx * tt, z - e[1] - vz * tt) < 1.0) w = true; }   // stair-top door -> Library floor, through the bookcase ring
      ok[j * GNX + i] = w ? 1 : 0;
    }
    return (GRIDS[which] = ok);
  }
  function cellOf(x, z) { return [Math.max(0, Math.min(GNX - 1, Math.floor((x - GX0) / CELL))), Math.max(0, Math.min(GNZ - 1, Math.floor((z - GZ0) / CELL)))]; }
  function nearestFree(ok, c) { var r, i, j; for (r = 0; r < 30; r++) for (j = -r; j <= r; j++) for (i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue; var a = c[0] + i, b = c[1] + j; if (a >= 0 && b >= 0 && a < GNX && b < GNZ && ok[b * GNX + a]) return [a, b]; } return null; }
  function astar(which, a, b) {
    var ok = walkGrid(which), s = nearestFree(ok, cellOf(a[0], a[1])), g = nearestFree(ok, cellOf(b[0], b[1])); if (!s || !g) return null;
    var N = GNX * GNZ, gs = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N), heap = [], si = s[1] * GNX + s[0], gi = g[1] * GNX + g[0];
    function h(i) { return Math.hypot(i % GNX - g[0], (i / GNX | 0) - g[1]); }
    function push(i, f) { heap.push([f, i]); var n = heap.length - 1; while (n > 0) { var p = (n - 1) >> 1; if (heap[p][0] <= heap[n][0]) break; var t = heap[p]; heap[p] = heap[n]; heap[n] = t; n = p; } }
    function pop() { var top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; var n = 0; for (;;) { var l = 2 * n + 1, r = l + 1, m = n; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === n) break; var t = heap[m]; heap[m] = heap[n]; heap[n] = t; n = m; } } return top[1]; }
    gs[si] = 0; push(si, h(si)); var D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    while (heap.length) { var cur = pop(); if (closed[cur]) continue; closed[cur] = 1; if (cur === gi) break; var cx = cur % GNX, cz = cur / GNX | 0;
      for (var q = 0; q < 8; q++) { var nx = cx + D[q][0], nz = cz + D[q][1]; if (nx < 0 || nz < 0 || nx >= GNX || nz >= GNZ) continue; var ni = nz * GNX + nx; if (!ok[ni] || closed[ni]) continue; if (D[q][2] > 1.4 && (!ok[cz * GNX + nx] || !ok[nz * GNX + cx])) continue;
        var ng = gs[cur] + D[q][2]; if (ng < gs[ni]) { gs[ni] = ng; from[ni] = cur; push(ni, ng + h(ni)); } } }
    if (!closed[gi]) return null; var cells = [], c = gi; while (c >= 0) { cells.push([GX0 + (c % GNX + .5) * CELL, GZ0 + ((c / GNX | 0) + .5) * CELL]); c = from[c]; } cells.reverse();
    function los(p, q) { var n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.25), t; for (t = 1; t < n; t++) { var cc = cellOf(p[0] + (q[0] - p[0]) * t / n, p[1] + (q[1] - p[1]) * t / n); if (!ok[cc[1] * GNX + cc[0]]) return false; } return true; }
    var out = [[a[0], a[1]]], i0 = 0, k; while (i0 < cells.length - 1) { k = cells.length - 1; while (k > i0 + 1 && !los(cells[i0], cells[k])) k--; out.push(cells[k]); i0 = k; } out[out.length - 1] = [b[0], b[1]]; return out;
  }
  window.WF_MAPDBG = { astar: function () { return astar.apply(null, arguments); }, grid: function (w) { return walkGrid(w); }, cell: cellOf, GNX: GNX, GX0: GX0, GZ0: GZ0 };
  function plen(p) { var s = 0; for (var i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; }
  function youShip() { var sc = document.querySelector('a-scene'), xf = XF[PAGE]; if (!sc || !sc.camera || !xf || PAGE === 'quarters') return null; var cp = new AFRAME.THREE.Vector3(); sc.camera.getWorldPosition(cp); var py = document.getElementById('player'), s = xf.to(cp.x, cp.z), low = onLower(); if (PAGE === 'corridor' && py) low = py.object3D.position.y < -3; return { s: s, deck: low ? 'lower' : 'upper' }; }
  // route legs: [{deck, pts}] from the player to a destination {s:[x,z], deck}; a different deck means: to the nearest stairs, down/up, on to the goal
  function planRoute(dest) {
    var you = youShip(); if (!you) return null; if (you.deck === dest.deck) { var p = astar(you.deck, you.s, dest.s); return p ? { legs: [{ deck: you.deck, pts: p }], len: plen(p) } : null; }
    var up = you.deck === 'upper', best = null;
    [-1, 1].forEach(function (sx) { var ua = stairEnd(sx, -0.35), la = stairEnd(sx, 1.16), a = up ? ua : la, b = up ? la : ua, p1 = astar(you.deck, you.s, a), p2 = astar(dest.deck, b, dest.s); if (!p1 || !p2) return; var L = plen(p1) + plen(p2) + 17; if (!best || L < best.len) best = { legs: [{ deck: you.deck, pts: p1, stair: a, up: !up }, { deck: dest.deck, pts: p2, stair: b, up: up }], len: L }; });
    return best;
  }
  // tap → exact spot (in that room's own metres), unless the gesture was a pan
  function mapTravel(d) {
    var gs = d.gs, R = d.room; close();
    var LS = window.WF_LOADSCREEN;   // loadscreen.js: SS Wayfarer GIF covers every map teleport
    if (!d.lp) { if (LS) LS.leave(R.page); else toast('Heading to the ' + d.name + '…'); setTimeout(function () { location.href = R.page; }, LS ? 400 : 250); return; }
    if (PAGE === gs.page) { gs.t = Date.now(); if (!LS) { if (!gotoNow(gs)) toast('Nothing to stand on there'); return; }
      LS.show(2500, false, PAGE === 'corridor' ? 'index.html' : R.page); setTimeout(function () { if (!gotoNow(gs)) { toast('Nothing to stand on there'); LS.hide(); return; } LS.ready(); }, 450); return; }
    gs.t = Date.now(); if (LS) LS.leave(d.id === 'corridor' ? 'index.html' : R.page); else toast('Heading to that spot in the ' + d.name + '…'); try { sessionStorage.setItem('wf-goto', JSON.stringify(gs)); } catch (e) {} setTimeout(function () { location.href = d.id === 'corridor' ? 'index.html' : R.page; }, LS ? 400 : 250);
  }
  // tap = pick a destination (pin + route + GO); GO (or tapping the pin again) travels
  function mapClick(svg, ev, id, lowerDeck) {
    if (svg._dragged) return; var g = svg._rot && svg._rot.g; if (!g || !svg._setDest) return; var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; var q = pt.matrixTransform(g.getScreenCTM().inverse()), s = [(q.x - MOX) / MS, (q.y - MOZ) / MS];
    var R = RMS.filter(function (r) { return r.id === id; })[0], xf = XF[id], lp = xf ? xf.from(s[0], s[1]) : null, name = R ? R.name.toLowerCase() : 'atrium', page = id === 'corridor' ? 'corridor' : id;
    svg._setDest({ id: id, room: R, name: name, lp: lp, s: s, deck: lowerDeck ? 'lower' : 'upper', gs: { page: page, x: lp ? +lp[0].toFixed(2) : 0, z: lp ? +lp[1].toFixed(2) : 0, y: id === 'corridor' ? (lowerDeck ? LOWY : 0) : 0 } });
  }
  // pan (drag) + zoom (wheel / pinch) on the viewBox; a drag > 6 px suppresses the click that follows
  function mapZoom(svg) {
    var V0 = svg.getAttribute('viewBox').split(' ').map(Number), V = V0.slice(), pts = {}, last = null, moved = 0;
    function set() { var k = Math.min(1, V[2] / V0[2]); V[0] = Math.max(V0[0] - 40, Math.min(V0[0] + V0[2] - V[2] + 40, V[0])); V[1] = Math.max(V0[1] - 40, Math.min(V0[1] + V0[3] - V[3] + 40, V[1])); svg.setAttribute('viewBox', V.join(' ')); }
    function zoom(f, cx, cy) { var nw = Math.max(V0[2] / 5, Math.min(V0[2], V[2] * f)), r = nw / V[2], nh = V[3] * r; V[0] = cx - (cx - V[0]) * r; V[1] = cy - (cy - V[1]) * r; V[2] = nw; V[3] = nh; set(); }
    function toV(e) { var r = svg.getBoundingClientRect(); return [V[0] + (e.clientX - r.left) / r.width * V[2], V[1] + (e.clientY - r.top) / r.height * V[3]]; }
    svg.addEventListener('wheel', function (e) { e.preventDefault(); var c = toV(e); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, c[0], c[1]); }, { passive: false });
    svg.addEventListener('pointerdown', function (e) { pts[e.pointerId] = [e.clientX, e.clientY]; moved = 0; svg._dragged = false; last = null; });
    svg.addEventListener('pointermove', function (e) { if (!pts[e.pointerId]) return; var ids = Object.keys(pts), prev = pts[e.pointerId]; pts[e.pointerId] = [e.clientX, e.clientY];
      if (ids.length === 2) { var o = pts[ids.filter(function (i) { return +i !== e.pointerId; })[0]], d0 = Math.hypot(prev[0] - o[0], prev[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]); if (d0 > 0 && d1 > 0) { var c = toV({ clientX: (e.clientX + o[0]) / 2, clientY: (e.clientY + o[1]) / 2 }); zoom(d0 / d1, c[0], c[1]); } svg._dragged = true; return; }
      var r = svg.getBoundingClientRect(), dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved += Math.abs(dx) + Math.abs(dy); if (moved > 6 && V[2] < V0[2] - 1) { svg._dragged = true; V[0] -= dx / r.width * V[2]; V[1] -= dy / r.height * V[3]; set(); } });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { svg.addEventListener(n, function (e) { delete pts[e.pointerId]; if (!Object.keys(pts).length) setTimeout(function () { svg._dragged = false; }, 60); }); });
  }
  // CUTAWAY: longitudinal section, bow up, both decks stacked in one frame (z along the page, height across it)
  function drawSection() {
    var M = mapSvg('56 62 488 876'), svg = M.svg, add = M.add, SY = 16, X0 = 300, ZO = 500, Pz = function (z) { return ZO + z * MS; }, Py = function (y) { return X0 - y * SY; };   // y up → left is up? deck stack: upper at right of lower
    // horizontal axis = height (right = up); vertical axis = z (bow up)
    var PR = LAYOUT.deckProfiles;
    var hull = [[0, -52], [-2.8, -48], [-3.6, -40], [-4.2, -24], [-4.2, 30], [-3.8, 46], [-2, 52]];   // schematic keel line (below upper floor)
    var top = [[-52, 1.2], [-40, 2.6], [-24, 3.4], [20, 3.4], [26, 3.6], [34, 8.4], [38, 9.4], [46, 7.8], [52, 3]];
    var d = 'M' + Py(-4.6) + ' ' + Pz(-50); top.forEach(function (q) { d += 'L' + Py(q[1]) + ' ' + Pz(q[0]); }); d += 'L' + Py(-4.6) + ' ' + Pz(52) + 'Z';
    add('path', { d: d, fill: 'rgba(20,50,80,.35)', stroke: C_HULL, 'stroke-width': 2.2, 'stroke-linejoin': 'round' });
    function band(y0, y1, z0, z1, id, label, fill, stroke) { var g = add('g', { class: 'rm' }); var r = add('rect', { x: Py(y1), y: Pz(z0), width: (y1 - y0) * SY, height: (z1 - z0) * MS, fill: fill || 'rgba(127,227,255,.10)', stroke: stroke || C_LINE, 'stroke-width': 1.3 }, g);
      if (id) g.addEventListener('click', function (ev) { var R = RMS.filter(function (q) { return q.id === id; })[0]; if (R && !svg._dragged) { close(); if (PAGE !== id) { if (window.WF_LOADSCREEN) WF_LOADSCREEN.leave(R.page); else toast('Heading to the ' + R.name.toLowerCase() + '…'); setTimeout(function () { location.href = R.page; }, window.WF_LOADSCREEN ? 400 : 250); } } });
      if (label) { var t = add('text', { x: Py((y0 + y1) / 2), y: Pz((z0 + z1) / 2), 'text-anchor': 'middle', fill: C_TXT, 'font-size': 6.6, 'font-weight': 700, 'font-family': FONT, 'letter-spacing': 1, transform: 'rotate(-90 ' + Py((y0 + y1) / 2) + ' ' + Pz((z0 + z1) / 2) + ')', stroke: '#0a1424', 'stroke-width': 2, 'paint-order': 'stroke' }, g); t.textContent = label; } }
    var UY0 = 0, UY1 = 3.24, LY0 = LOWY, LY1 = -0.23;
    band(UY0, UY1, -38, -24, 'bridge', 'BRIDGE'); band(UY0, UY1, -24, 25.8, null, 'UPPER ATRIUM', 'rgba(127,227,255,.05)'); band(LY0, LY1, -24, 25.8, null, 'LOWER ATRIUM', 'rgba(127,227,255,.05)');
    band(LY0, LY1, -49, -24, 'firefly', 'FIREFLY HANGAR'); band(UY0, UY1, 26, 46, 'library', 'LIBRARY'); band(LY0, LY1, 26.6, 45.4, 'core', 'ENGINE ROOM');
    band(LOWY, 9.4 - 0, 31, 41, null, '', 'rgba(79,191,168,.14)', C_BIO);   // Second Brain: one column from the reactor pit up through the Library
    var br = add('text', { x: Py(2.7), y: Pz(36), 'text-anchor': 'middle', fill: C_BIO, 'font-size': 6.6, 'font-family': FONT, 'letter-spacing': 1, transform: 'rotate(-90 ' + Py(2.7) + ' ' + Pz(36) + ')' }); br.textContent = 'SECOND BRAIN';
    add('path', { d: 'M' + Py(0) + ' ' + Pz(30) + 'L' + Py(LOWY) + ' ' + Pz(46), stroke: '#ffd27a', 'stroke-width': 3, 'stroke-dasharray': '1.5 2.5' }); var st = add('text', { x: Py(-2.8) + 14, y: Pz(38), fill: '#ffd27a', 'font-size': 6.4, 'font-family': FONT }); st.textContent = 'STAIRS';
    add('path', { d: 'M' + Py(0) + ' 70V930', stroke: 'rgba(207,238,255,.35)', 'stroke-width': .6, 'stroke-dasharray': '4 3' });
    [['UPPER FLOOR y 0.00', 0], ['LOWER FLOOR y −5.95', LOWY]].forEach(function (q) { var t = add('text', { x: Py(q[1]), y: 76, 'text-anchor': 'middle', fill: 'rgba(207,238,255,.6)', 'font-size': 6.4, 'font-family': FONT }); t.textContent = q[0]; });
    var t2 = add('text', { x: 300, y: 920, 'text-anchor': 'middle', fill: C_TXT, 'font-size': 7, 'font-family': FONT, 'letter-spacing': 1 }); t2.textContent = 'LONGITUDINAL SECTION · BOW ▲ · VERTICAL SCALE ×2';
    var live = add('g', { 'pointer-events': 'none' });
    box.appendChild(el('p', 'sub', 'Cutaway: both decks stacked · the Second Brain runs from the reactor pit up through the Library · tap a room'));
    box.appendChild(svg); mapZoom(svg); svg._rot = { g: svg, w: 0, h: 0 };
    function drawLive() { while (live.firstChild) live.removeChild(live.firstChild); var sc2 = document.querySelector('a-scene'); if (!sc2 || !sc2.camera || !XF[PAGE]) return; var cp = new AFRAME.THREE.Vector3(); sc2.camera.getWorldPosition(cp); var s = XF[PAGE].to(cp.x, cp.z), py = document.getElementById('player'), y = onLower() ? LOWY : 0; if (PAGE === 'corridor' && py) y = py.object3D.position.y;
      add('circle', { cx: Py(y + 1.0), cy: Pz(s[1]), r: 5, fill: '#ffe14d', stroke: '#0a1424', 'stroke-width': 1 }, live); }
    drawLive(); clearInterval(mapTimer); mapTimer = setInterval(function () { if (!box || box.style.display === 'none' || tab !== 'map' || !svg.isConnected) { clearInterval(mapTimer); return; } drawLive(); }, 400);
  }

  // ── the menu-bar button (clipboard) ──
  var ICON = '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 11h7M8.5 14.5h7M8.5 18h4"/></svg>';
  function button() {
    var row = document.getElementById('wf-btns'); if (!row) return false; if (row.querySelector('.wf-logbtn')) return true;
    var b = document.createElement('b'); b.className = 'wf-logbtn'; b.setAttribute('aria-label', 'Ship log'); b.innerHTML = ICON + '<i></i>';
    ['pointerdown', 'touchstart'].forEach(function (n) { b.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); });
    b.addEventListener('click', function (e) { e.stopPropagation(); if (isOpen()) close(); else open(); });
    row.insertBefore(b, row.children[0] || null);
    var st = goals(); if (st.list.some(function (g) { return !g.done; }) && load('wf-goals-seen', 0) !== DAY) { b.classList.add('new'); save('wf-goals-seen', DAY); }
    return true;
  }
  function boot() { if (load('wf-ration', 0) !== DAY) { save('wf-ration', DAY); if (count('treat') < 15) give('treat', 3); }   /* daily treat ration */
    var n = 0; (function tryBtn() { if (!button() && n++ < 40) setTimeout(tryBtn, 250); }()); if (PAGE !== 'other' && PAGE !== 'flight') event('room:' + PAGE); }
  addEventListener('keydown', function (e) { if (e.code === 'KeyJ' && PAGE !== 'flight') { if (isOpen()) close(); else open(); } if (e.code === 'Escape' && isOpen()) close(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.WF_LIFE = { credits: credits, add: add, spend: spend, give: give, take: take, count: count, inv: inv, ITEMS: ITEMS, event: event, goals: goals, open: open, close: close, toast: toast, page: PAGE,
    listeners: [], on: function (f) { this.listeners.push(f); }, addGoals: function (feature, list) { REG[feature] = true; list.forEach(function (g) { g.need = feature; if (!POOL.some(function (q) { return q.id === g.id; })) POOL.push(g); }); },
    addItems: function (o) { for (var k in o) ITEMS[k] = o[k]; }, addTab: function (id, label, render) { EXTRA.push({ id: id, label: label, render: render }); } };
}());
