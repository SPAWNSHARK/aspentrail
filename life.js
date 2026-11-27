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
    '#wf-log.bp{background:linear-gradient(160deg,rgba(60,140,255,.10),rgba(10,20,50,.0)),rgba(5,10,26,.94);border:1px solid rgba(77,227,255,.38);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 18px 44px rgba(0,0,0,.6),0 0 22px rgba(60,140,255,.18)}' +
    '#wf-log.bp .hd b{color:#7fe8ff;text-shadow:0 0 8px rgba(77,227,255,.5)}#wf-log.bp .hd span{color:#8fb4d8;font:700 10.5px ui-monospace,Menlo,monospace;letter-spacing:1.2px}#wf-log.bp .x{color:#9fd8f0}' +
    '#wf-log.bp p.sub{color:#8fb4d8;font:600 10.5px ui-monospace,Menlo,monospace;letter-spacing:.4px}' +
    '#wf-log.bp svg.map{background:#040a1a;border:1px solid rgba(77,227,255,.30);box-shadow:inset 0 0 30px rgba(40,120,255,.15);max-height:calc(100vh - 210px)}' +
    '#wf-log.bp svg.map .rm:hover path,#wf-log.bp svg.map .rm:hover rect,#wf-log.bp svg.map .rm:hover circle,#wf-log.bp svg.map .rm:hover polygon{fill:rgba(77,227,255,.22)}' +
    '#wf-btns b.wf-logbtn{position:relative}#wf-btns b.wf-logbtn i{position:absolute;right:3px;top:2px;width:7px;height:7px;border-radius:50%;background:#ffb040;box-shadow:0 0 6px #ffb040;display:none}#wf-btns b.wf-logbtn.new i{display:block}';
  document.head.appendChild(css);
  var tab = 'goals', box = null, EXTRA = [];
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function open(t) {
    if (t) tab = t; else if (tab === 'map') tab = 'goals';    // the Ship Log has no MAP tab (user, Nov 27) — the map has its own button

    if (!box) { box = el('div'); box.id = 'wf-log'; document.body.appendChild(box);
      ['pointerdown', 'touchstart', 'mousedown', 'click', 'wheel'].forEach(function (n) { box.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); }); }
    box.style.display = 'block'; document.body.classList.add('reading'); render();
    var b = document.querySelector('#wf-btns .wf-logbtn'); if (b) b.classList.remove('new');
  }
  function close() { if (box) box.style.display = 'none'; if (!document.querySelector('.panel[style*="block"]')) document.body.classList.remove('reading'); }
  function isOpen() { return box && box.style.display === 'block'; }
  function refresh() { if (isOpen()) render(); }
  function render() {
    var c = credits(), rk = window.WF_MISSIONS ? WF_MISSIONS.rank(c).name : '';
    box.innerHTML = '';
    var isMap = tab === 'map'; box.classList.toggle('bp', isMap);
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
      drawLive(); clearInterval(mapTimer); mapTimer = setInterval(function () { if (!box || box.style.display !== 'block' || tab !== 'map' || !svg.isConnected) { clearInterval(mapTimer); return; } drawLive(); }, 400);
    };
    if (window.HIVE && HIVE.LAYOUT) go(HIVE.LAYOUT); else fetch('hiveport/layout.json').then(function (r) { return r.json(); }).then(go).catch(function () {});
  }
  // LOWER DECK MAP (Nov 26 atrium rebuild): the kit's lower rooms in ship coordinates (reference/atrium-kit/layout.json), the lower
  // atrium, the twin stairs and the Engine Room; you on any lower-deck page (or downstairs in the atrium). UPPER / LOWER toggle.
  var LOWER = ['medbay', 'xeno', 'mess', 'maint', 'firefly', 'engine'], LPAGE = { Medbay: 'medbay', Xenobiology: 'xeno', Mess_Hall: 'mess', Maintenance_Storage: 'maint', Firefly_Hangar: 'firefly' };
  var LNAME = { Medbay: '⚕ MEDBAY', Xenobiology: '🧪 XENOBIOLOGY', Mess_Hall: '🍽 MESS HALL', Maintenance_Storage: '🔧 MAINTENANCE', Firefly_Hangar: '🚀 FIREFLY HANGAR' };
  var mapDeck = null;
  function onLower() { if (LOWER.indexOf(PAGE) >= 0) return true; if (PAGE !== 'corridor') return false; var p = document.getElementById('player'); return !!(p && p.object3D.position.y < -3); }
  function deckTabs() { var row = el('div', 'sub', ''); row.style.cssText = 'display:flex;gap:8px;justify-content:center;margin:0 0 6px';
    [['upper', '⬆ UPPER DECK'], ['lower', '⬇ LOWER DECK']].forEach(function (q) { var b = el('button', '', q[1]); b.style.cssText = 'padding:6px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);font:700 11px -apple-system,system-ui,sans-serif;letter-spacing:1px;color:#fff;background:' + ((mapDeck || (onLower() ? 'lower' : 'upper')) === q[0] ? 'rgba(77,227,255,.22)' : 'rgba(255,255,255,.06)') + ';border-color:' + ((mapDeck || (onLower() ? 'lower' : 'upper')) === q[0] ? 'rgba(77,227,255,.7)' : 'rgba(255,255,255,.2)');
      b.onclick = function () { mapDeck = q[0]; render(); }; row.appendChild(b); }); box.appendChild(row); }
  function renderLower() {
    fetch('reference/atrium-kit/layout.json').then(function (r) { return r.json(); }).then(function (LY) {
      if (!box || tab !== 'map') return;
      var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '40 60 520 900'); svg.setAttribute('class', 'map');
      function add(tag, at, parent) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); (parent || svg).appendChild(e); return e; }
      var P = function (x, z) { return [300 + x * 12.5, 505 + z * 8.7]; }, pts = function (a) { return a.map(function (q) { var p = P(q[0], q[1]); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); };
      var WALL = 'rgba(140,220,255,.85)', FILL = 'rgba(90,200,255,.07)';
      add('polygon', { points: pts([[0, -52], [-9, -46], [-15, -30], [-17, 0], [-17, 30], [-14, 47], [0, 52], [14, 47], [17, 30], [17, 0], [15, -30], [9, -46]]), fill: 'rgba(140,80,40,.10)', stroke: 'rgba(230,150,80,.5)', 'stroke-width': 2 });
      add('polygon', { points: pts(LY.corridor.outerPolygon), fill: FILL, stroke: WALL, 'stroke-width': 2 });
      Object.keys(LPAGE).forEach(function (k) { var R = LY.rooms[k]; if (!R || !R.polygon) return; var g = add('g', { class: 'rm' }); g.addEventListener('click', function () { close(); location.href = LPAGE[k] + '.html'; });
        add('polygon', { points: pts(R.polygon), fill: FILL, stroke: WALL, 'stroke-width': 2 }, g); var cx = 0, cz = 0; R.polygon.forEach(function (q) { cx += q[0]; cz += q[1]; }); var c = P(cx / R.polygon.length, cz / R.polygon.length);
        var t = add('text', { x: c[0], y: c[1], 'text-anchor': 'middle', fill: '#e6f6ff', 'font-size': 9.5, 'font-weight': 800, stroke: 'rgba(0,0,0,.6)', 'stroke-width': 2.4, 'paint-order': 'stroke' }, g); t.textContent = LNAME[k]; });
      var ge = add('g', { class: 'rm' }); ge.addEventListener('click', function () { close(); location.href = 'core.html'; }); var ec = P(0, 36);
      add('ellipse', { cx: ec[0], cy: ec[1], rx: 9.4 * 12.5, ry: 9.4 * 8.7, fill: 'rgba(60,230,200,.08)', stroke: 'rgba(80,240,210,.8)', 'stroke-width': 2 }, ge); add('ellipse', { cx: ec[0], cy: ec[1], rx: 3 * 12.5, ry: 3 * 8.7, fill: 'rgba(60,230,200,.25)' }, ge);
      var te = add('text', { x: ec[0], y: ec[1] + 4, 'text-anchor': 'middle', fill: '#dffff8', 'font-size': 9.5, 'font-weight': 800, stroke: 'rgba(0,0,0,.6)', 'stroke-width': 2.4, 'paint-order': 'stroke' }, ge); te.textContent = '⚛ ENGINE ROOM';
      [-1, 1].forEach(function (sx) { var d = ''; for (var a = -0.35; a <= 1.16; a += 0.05) { var p = P(sx * 11.35 * Math.cos(a), 36 + 11.35 * Math.sin(a)); d += (d ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); } add('path', { d: d, fill: 'none', stroke: '#ffd27a', 'stroke-width': 5, 'stroke-dasharray': '2 3' }); });
      var ta = add('text', { x: 300, y: 505, 'text-anchor': 'middle', fill: '#cfeeff', 'font-size': 8, 'font-weight': 800, transform: 'rotate(-90 300 505)' }); ta.textContent = 'LOWER ATRIUM  ·  stairs ⤴ aft';
      var live = add('g', {});
      box.appendChild(el('p', 'sub', 'Lower deck · tap a room to go there · <span style="color:#ffd27a">┅</span> stairs up · <span style="color:#6ff">▲</span> you'));
      box.appendChild(svg);
      function drawLive() { while (live.firstChild) live.removeChild(live.firstChild); var sc = document.querySelector('a-scene'); if (!onLower() || !sc || !sc.camera) return;
        var cp = new AFRAME.THREE.Vector3(), cd = new AFRAME.THREE.Vector3(); sc.camera.getWorldPosition(cp); sc.camera.getWorldDirection(cd);
        var p0 = P(cp.x, cp.z), p1 = P(cp.x + cd.x, cp.z + cd.z), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180 / Math.PI + 90;
        add('circle', { cx: p0[0], cy: p0[1], r: 11 + 3 * Math.sin(Date.now() / 250), fill: 'rgba(100,255,255,.18)' }, live);
        add('path', { d: 'M0 -9 L6 6 L0 3 L-6 6 Z', fill: '#6ffff0', stroke: '#032', 'stroke-width': 1.2, transform: 'translate(' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ') rotate(' + ang.toFixed(0) + ')' }, live); }
      drawLive(); clearInterval(mapTimer); mapTimer = setInterval(function () { if (!box || box.style.display !== 'block' || tab !== 'map' || !svg.isConnected) { clearInterval(mapTimer); return; } drawLive(); }, 400);
    }).catch(function () {});
  }
  function renderMap() {
    if (PAGE === 'hiveport') return renderHiveMap();
    deckTabs(); if ((mapDeck || (onLower() ? 'lower' : 'upper')) === 'lower') return renderLower();
    deckData(function (D) {
      if (!box || tab !== 'map') return;
      var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '40 80 520 860'); svg.setAttribute('class', 'map');
      function add(tag, at, parent) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); (parent || svg).appendChild(e); return e; }
      var defs = add('defs', {}); var pat = add('pattern', { id: 'bpgrid', width: 14, height: 14, patternUnits: 'userSpaceOnUse' }, defs); add('path', { d: 'M14 0H0V14', fill: 'none', stroke: 'rgba(120,200,255,.07)', 'stroke-width': 1 }, pat);
      var hp = add('pattern', { id: 'bphatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs); add('rect', { width: 6, height: 6, fill: 'rgba(40,120,220,.07)' }, hp); add('path', { d: 'M0 0V6', stroke: 'rgba(120,200,255,.16)', 'stroke-width': 1 }, hp);
      var mp2 = add('pattern', { id: 'bpmajor', width: 70, height: 70, patternUnits: 'userSpaceOnUse' }, defs); add('path', { d: 'M70 0H0V70', fill: 'none', stroke: 'rgba(120,200,255,.16)', 'stroke-width': 1 }, mp2);
      add('rect', { x: 40, y: 80, width: 520, height: 860, fill: '#040a1a' }); add('rect', { x: 40, y: 80, width: 520, height: 860, fill: 'url(#bpgrid)' }); add('rect', { x: 40, y: 80, width: 520, height: 860, fill: 'url(#bpmajor)' });
      add('rect', { x: 46, y: 86, width: 508, height: 848, fill: 'none', stroke: 'rgba(120,200,255,.35)', 'stroke-width': 1 });      // drawing border
      // title block, compass, scale bar
      add('rect', { x: 396, y: 892, width: 156, height: 40, fill: 'rgba(6,16,40,.85)', stroke: 'rgba(120,200,255,.5)', 'stroke-width': 1 });
      [['SS WAYFARER · DECK PLAN', 902, 8, '#cfeeff'], ['UPPER / LOWER · SCALE 1:200', 913, 6.5, '#7fa8d8'], ['REV 27.11.2026 · BOW ▲', 924, 6.5, '#7fa8d8']].forEach(function (q) { var t = add('text', { x: 402, y: q[1], fill: q[3], 'font-size': q[2], 'font-family': 'ui-monospace,Menlo,monospace', 'font-weight': 700, 'letter-spacing': 0.6 }); t.textContent = q[0]; });
      add('circle', { cx: 86, cy: 126, r: 17, fill: 'none', stroke: 'rgba(120,225,255,.6)', 'stroke-width': 1 }); add('path', { d: 'M86 106 L91 128 L86 124 L81 128 Z', fill: '#7fe8ff' }); var nt = add('text', { x: 86, y: 101, 'text-anchor': 'middle', fill: '#7fe8ff', 'font-size': 8, 'font-weight': 800 }); nt.textContent = 'BOW';
      add('path', { d: 'M60 912 H130 M60 908 V916 M95 909.5 V914.5 M130 908 V916', stroke: 'rgba(160,220,255,.8)', 'stroke-width': 1.2, fill: 'none' }); var st2 = add('text', { x: 95, y: 925, 'text-anchor': 'middle', fill: '#7fa8d8', 'font-size': 6.5, 'font-family': 'ui-monospace,Menlo,monospace' }); st2.textContent = '10 m';
      // hull: a teardrop with the engine pods and the dome
      add('path', { d: 'M300 92 C220 100 150 190 132 300 L100 360 L100 760 C100 900 200 935 300 935 C400 935 500 900 500 760 L500 360 L468 300 C450 190 380 100 300 92 Z', fill: 'rgba(40,100,200,.07)', stroke: 'rgba(120,200,255,.55)', 'stroke-width': 2.4 });
      add('path', { d: 'M300 104 C228 112 164 196 146 302 L116 362 L116 758 C116 886 208 920 300 920 C392 920 484 886 484 758 L484 362 L454 302 C436 196 372 112 300 104 Z', fill: 'none', stroke: 'rgba(120,200,255,.22)', 'stroke-width': 1, 'stroke-dasharray': '2 3' });   // inner hull line
      [[68, 780], [532, 780]].forEach(function (q) { add('rect', { x: q[0] - 18, y: q[1] - 70, width: 36, height: 140, rx: 16, fill: 'rgba(80,200,255,.08)', stroke: 'rgba(120,220,255,.45)', 'stroke-width': 1.4 }); add('circle', { cx: q[0], cy: q[1] + 74, r: 9, fill: 'rgba(120,230,255,.6)' }); });
      var WALL = 'rgba(120,225,255,.95)', FILL = 'url(#bphatch)', FURN = 'rgba(140,205,255,.34)';
      function roomG(id) { var g = add('g', { class: 'rm' }); g.addEventListener('click', function () { var R = ROOMS[id]; if (PAGE === id) { close(); return; } close(); toast('Heading to the ' + R.name.toLowerCase() + '…'); setTimeout(function () { location.href = R.page; }, 250); }); return g; }
      function poly(room, pts, g, at) { return add('polygon', Object.assign({ points: pts.map(function (p) { var q = mapPt(room, p[0], p[1]); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') }, at), g); }
      function circle(room, r, g, at) { var c = ROOMS[room].c; return add('circle', Object.assign({ cx: c[0], cy: c[1], r: r * SR }, at), g); }
      function furniture(room, g) { var d = D && D[room]; if (!d) return; d.solids.forEach(function (b) { poly(room, [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]], g, { fill: FURN, stroke: 'rgba(255,230,200,.35)', 'stroke-width': 0.5 }); }); }
      // corridor
      var gc = roomG('corridor');   // the split-level atrium (upper deck): walkways round the opening down to the lower deck
      poly('corridor', [[-2.5, -24], [-4.6, -17], [-4.6, 18.5], [-2.5, 25.8], [2.5, 25.8], [4.6, 18.5], [4.6, -17], [2.5, -24]], gc, { fill: FILL, stroke: WALL, 'stroke-width': 2 });
      poly('corridor', [[-2.05, -16], [2.05, -16], [2.05, 16], [-2.05, 16]], gc, { fill: 'rgba(60,200,255,.12)', stroke: 'rgba(160,240,255,.7)', 'stroke-width': 1.2, 'stroke-dasharray': '4 2' });
      var qa = mapPt('corridor', -4.6, -1), qb = mapPt('corridor', -4.6, 25.8);   // Captain's Quarters (sealed until its page exists)
      var gq = roomG('quarters'); qa = mapPt('quarters', -15, -1); qb = mapPt('quarters', -4.6, 25.8);
      add('rect', { x: qa[0], y: qa[1], width: qb[0] - qa[0], height: qb[1] - qa[1], fill: 'rgba(60,160,255,.05)', stroke: 'rgba(120,200,255,.45)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, gq);
      var tq = add('text', { x: (qa[0] + qb[0]) / 2, y: (qa[1] + qb[1]) / 2, 'text-anchor': 'middle', fill: '#9fc4e8', 'font-size': 8.5, 'font-weight': 800 }); tq.textContent = "🎖 CAPTAIN'S QTRS"; gq.appendChild(tq);
      furniture('corridor', gc);
      // rooms
      var gb = roomG('bridge'); if (D && D.bridge && D.bridge.bounds) poly('bridge', D.bridge.bounds, gb, { fill: FILL, stroke: WALL, 'stroke-width': 2 }); furniture('bridge', gb);
      add('circle', { cx: ROOMS.bridge.c[0], cy: ROOMS.bridge.c[1] - 6.4 * SR, r: 3.3 * SR * 0.55, fill: 'rgba(150,120,255,.18)', stroke: 'rgba(170,150,255,.6)', 'stroke-dasharray': '2 2' }, gb);   // navigator galaxy
      var gh = roomG('holodeck'); poly('holodeck', [[-9, -9], [9, -9], [9, 9], [-9, 9]], gh, { fill: FILL, stroke: WALL, 'stroke-width': 2 });
      for (var gx = -6; gx <= 6; gx += 3) { poly('holodeck', [[gx, -9], [gx + 0.02, -9], [gx + 0.02, 9], [gx, 9]], gh, { fill: 'rgba(120,200,255,.22)' }); poly('holodeck', [[-9, gx], [9, gx], [9, gx + 0.02], [-9, gx + 0.02]], gh, { fill: 'rgba(120,200,255,.22)' }); }
      furniture('holodeck', gh);
      ['lounge', 'media', 'library'].forEach(function (id) { var g = roomG(id); circle(id, id === 'library' ? 10.6 : 9.2, g, { fill: FILL, stroke: WALL, 'stroke-width': 2 }); if (id === 'library') circle(id, 7.6, g, { fill: 'rgba(60,230,255,.14)', stroke: 'rgba(120,240,255,.7)', 'stroke-width': 1.2, 'stroke-dasharray': '3 2' }); furniture(id, g); });
      // doorways
      [['bridge', 0, 7.9], ['holodeck', 0, 8.7], ['lounge', 0, 8.7], ['media', 0, 8.9], ['library', 0, 10.7]].forEach(function (q) { var p = mapPt(q[0], q[1], q[2]); add('circle', { cx: p[0], cy: p[1], r: 5.5, fill: 'rgba(77,227,255,.18)', stroke: '#7fe8ff', 'stroke-width': 1 }); add('circle', { cx: p[0], cy: p[1], r: 2, fill: '#dffaff' }); });
      // labels
      Object.keys(ROOMS).forEach(function (id) { var R = ROOMS[id]; if (R.nolabel) return; var y = id === 'bridge' ? R.c[1] + 46 : id === 'corridor' ? 500 : R.c[1] + 4, x = id === 'corridor' ? 300 : R.c[0];
        var t = add('text', { x: x, y: y, 'text-anchor': 'middle', fill: '#dff6ff', 'font-family': 'ui-monospace,Menlo,monospace', 'font-size': id === 'corridor' ? 8 : 9.5, 'font-weight': 800, 'letter-spacing': 1.4, stroke: 'rgba(2,8,24,.85)', 'stroke-width': 2.5, 'paint-order': 'stroke', transform: id === 'corridor' ? 'rotate(-90 300 500)' : '' }); t.textContent = R.em + ' ' + R.name; });
      // live layer
      var live = add('g', {});
      box.appendChild(el('p', 'sub', 'Live · tap a room to go there · <span style="color:#6ff">▲</span> you · <span style="color:#7fd8ff">●</span> droids · <span style="color:#ffb0e0">●</span> cats · ⚠ faults'));
      box.appendChild(svg); var leg = el('p', 'sub', ''); box.appendChild(leg);
      function drawLive() {
        while (live.firstChild) live.removeChild(live.firstChild);
        var L = window.WAYFARER && window.WAYFARER.crewLayout, eng = window.WAYFARER && window.WAYFARER.crew && window.WAYFARER.crew.engine, snap = load('wf-crew', null);
        var NAMES = { nav: 'Aster', eng: 'Forge', sci: 'Vesper', com: 'Echo', tac: 'Sentinel', sen: 'Prism', ember: 'Ember', nimbus: 'Nimbus', orbit: 'Orbit', pixel: 'Pixel' }, where = {};
        var list = eng ? Array.from(eng.npcs.values()).map(function (n) { return { id: n.id, node: n.node, x: n.pos.x, z: n.pos.z, cat: n.kind === 'cat', st: n.state }; })
                       : ((snap && snap.npcs) || []).map(function (n) { return { id: n.id, node: n.node, x: n.pos && n.pos.x, z: n.pos && n.pos.z, cat: /ember|nimbus|orbit|pixel/.test(n.id), st: n.state }; });
        list.forEach(function (n) { var nd = L && L.nodes[n.node], room = nd ? nd.room : null; if (!room || !ROOMS[room]) return;
          var lx = n.x != null ? n.x - OFFR[room] * 100 : nd.lx, lz = n.z != null ? n.z : nd.lz, p = mapPt(room, lx, lz), col = n.cat ? '#ffb0e0' : '#7fd8ff';
          add('circle', { cx: p[0], cy: p[1], r: n.cat ? 4 : 5, fill: col, stroke: '#081018', 'stroke-width': 1.2 }, live);
          var t = add('text', { x: p[0] + 6, y: p[1] + 3, fill: col, 'font-size': 7.5, 'font-weight': 700, stroke: 'rgba(0,0,0,.6)', 'stroke-width': 2, 'paint-order': 'stroke' }, live); t.textContent = NAMES[n.id];
          (where[room] = where[room] || []).push(NAMES[n.id]); });
        load('wf-faults', []).forEach(function (f) { if (!ROOMS[f.room]) return; var p = mapPt(f.room, f.x, f.z); var t = add('text', { x: p[0], y: p[1] + 5, 'text-anchor': 'middle', 'font-size': 14, opacity: (Date.now() / 400 | 0) % 2 ? 1 : 0.45 }, live); t.textContent = '⚠'; });
        if (ROOMS[PAGE] && document.querySelector('a-scene') && document.querySelector('a-scene').camera) {        // YOU: position + facing
          var cam = document.querySelector('a-scene').camera, cp = new AFRAME.THREE.Vector3(), cd = new AFRAME.THREE.Vector3(); cam.getWorldPosition(cp); cam.getWorldDirection(cd);
          var p0 = mapPt(PAGE, cp.x, cp.z), p1 = mapPt(PAGE, cp.x + cd.x, cp.z + cd.z), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180 / Math.PI + 90;
          add('circle', { cx: p0[0], cy: p0[1], r: 11 + 3 * Math.sin(Date.now() / 250), fill: 'rgba(100,255,255,.18)' }, live);
          add('path', { d: 'M0 -9 L6 6 L0 3 L-6 6 Z', fill: '#6ffff0', stroke: '#032', 'stroke-width': 1.2, transform: 'translate(' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ') rotate(' + ang.toFixed(0) + ')' }, live);
        }
        leg.innerHTML = Object.keys(where).map(function (r) { return ROOMS[r].em + ' ' + where[r].join(', '); }).join(' · ');
      }
      drawLive(); clearInterval(mapTimer); mapTimer = setInterval(function () { if (!box || box.style.display !== 'block' || tab !== 'map' || !svg.isConnected) { clearInterval(mapTimer); return; } drawLive(); }, 400);
    });
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
