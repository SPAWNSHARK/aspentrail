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
  var PAGE = { '': 'corridor', 'index.html': 'corridor', 'bridge.html': 'bridge', 'holodeck.html': 'holodeck', 'lounge.html': 'lounge', 'media.html': 'media',
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
    '#wf-log .tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px}#wf-log .tabs button{padding:8px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font:700 12px -apple-system,system-ui,sans-serif;letter-spacing:1px}' +
    '#wf-log .tabs button.on{background:rgba(255,170,80,.3);border-color:rgba(255,200,140,.6)}' +
    '#wf-log .goal{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);margin-bottom:8px}' +
    '#wf-log .goal.done{opacity:.55}#wf-log .goal i{display:block;height:5px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:7px;overflow:hidden}#wf-log .goal i u{display:block;height:100%;background:linear-gradient(90deg,#ffb050,#ffe08a)}' +
    '#wf-log .goal small{float:right;color:#ffd58a;font-weight:700}#wf-log p.sub{color:#d9c4ae;font-size:12px;margin:2px 0 10px;text-align:center}' +
    '#wf-log svg.map{width:100%;height:auto;max-height:calc(100vh - 230px);display:block;margin:0 auto}#wf-log svg.map .rm{cursor:pointer}#wf-log svg.map .rm:hover path,#wf-log svg.map .rm:hover rect,#wf-log svg.map .rm:hover circle{fill:rgba(255,180,90,.28)}' +
    '#wf-log .item{display:flex;gap:10px;align-items:center;padding:9px 11px;border-radius:13px;background:rgba(255,255,255,.06);margin-bottom:7px}#wf-log .item em{font-style:normal;font-size:22px}#wf-log .item div{flex:1}#wf-log .item small{display:block;color:#d9c4ae;font-size:11.5px}#wf-log .item b{color:#ffe6b0}' +
    '#wf-btns b.wf-logbtn{position:relative}#wf-btns b.wf-logbtn i{position:absolute;right:3px;top:2px;width:7px;height:7px;border-radius:50%;background:#ffb040;box-shadow:0 0 6px #ffb040;display:none}#wf-btns b.wf-logbtn.new i{display:block}';
  document.head.appendChild(css);
  var tab = 'goals', box = null, EXTRA = [];
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function open(t) {
    if (t) tab = t;
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
    var hd = el('div', 'hd', '<b>SHIP LOG</b><span>' + c + ' cr' + (rk ? ' · ' + rk : '') + '</span>'), x = el('button', 'x', '✕'); x.onclick = close; hd.appendChild(x); box.appendChild(hd);
    var T = [['goals', 'GOALS'], ['map', 'MAP'], ['cargo', 'CARGO'], ['disc', 'SCIENCE']].concat(EXTRA.map(function (x) { return [x.id, x.label]; }));
    var tabs = el('div', 'tabs'); tabs.style.gridTemplateColumns = 'repeat(' + T.length + ',1fr)';
    T.forEach(function (q) { var b = el('button', tab === q[0] ? 'on' : '', q[1]); b.onclick = function () { tab = q[0]; render(); }; tabs.appendChild(b); }); box.appendChild(tabs);
    var ex = EXTRA.filter(function (x) { return x.id === tab; })[0];
    if (ex) ex.render(box, el, render); else if (tab === 'goals') renderGoals(); else if (tab === 'map') renderMap(); else if (tab === 'disc') renderDisc(); else renderCargo();
  }
  function renderGoals() {
    var st = goals();
    box.appendChild(el('p', 'sub', 'Three new goals every day · 150 cr each · +300 cr for all three'));
    st.list.forEach(function (g) { var d = el('div', 'goal' + (g.done ? ' done' : ''), (g.done ? '✓ ' : '') + g.text + '<small>' + Math.min(g.have, g.n) + ' / ' + g.n + '</small><i><u style="width:' + Math.min(100, g.have / g.n * 100) + '%"></u></i>'); box.appendChild(d); });
    if (st.bonus) box.appendChild(el('p', 'sub', 'All done for today — new goals tomorrow.'));
    var FL = load('wf-faults', []), RN = { corridor: 'corridor', bridge: 'Bridge', holodeck: 'Holodeck', lounge: 'Crew Lounge', media: 'Media Nexus', library: 'Library' };
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

  // ── DECK MAP: the ship from above (bow up), live crew dots, tap a room to go there ──
  var ROOMS = {   // map centre (px), how room-local metres turn on the map, page
    bridge:   { c: [150, 70], m: function (x, z) { return [x, z]; }, page: 'bridge.html', name: 'COMMAND BRIDGE' },
    holodeck: { c: [58, 196], m: function (x, z) { return [z, -x]; }, page: 'holodeck.html', name: 'HOLODECK' },
    lounge:   { c: [242, 206], m: function (x, z) { return [-z, x]; }, page: 'lounge.html', name: 'CREW LOUNGE' },
    media:    { c: [242, 304], m: function (x, z) { return [-z, x]; }, page: 'media.html', name: 'MEDIA NEXUS' },
    library:  { c: [150, 420], m: function (x, z) { return [-x, -z]; }, page: 'library.html', name: 'THE LIBRARY' },
    corridor: { c: [150, 255], m: function (x, z) { return [x * 1.8, -z * 6.4]; }, page: 'index.html', name: 'CORRIDOR' }
  };
  var S = 4.2;   // px per metre inside rooms
  function mapPt(room, lx, lz) { var R = ROOMS[room], q = R.m(lx, lz), k = room === 'corridor' ? 1 : S; return [R.c[0] + q[0] * k, R.c[1] + q[1] * k]; }
  function renderMap() {
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 300 480'); svg.setAttribute('class', 'map');
    function add(tag, at, parent) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); (parent || svg).appendChild(e); return e; }
    var line = 'rgba(255,190,120,.75)', fill = 'rgba(255,170,90,.08)';
    add('path', { d: 'M150 6 C110 6 70 40 60 120 L60 400 C60 470 240 470 240 400 L240 120 C230 40 190 6 150 6 Z', fill: 'rgba(120,70,30,.12)', stroke: 'rgba(200,120,60,.35)', 'stroke-width': 1.5 });   // hull
    function room(id, shape) {
      var g = add('g', { class: 'rm' }); shape(g); var R = ROOMS[id];
      var t = add('text', { x: R.c[0], y: id === 'bridge' ? R.c[1] - 22 : id === 'library' ? R.c[1] + 4 : R.c[1] + (id === 'corridor' ? -100 : 4), 'text-anchor': 'middle', fill: '#ffd8a8', 'font-size': 8.5, 'font-weight': 700, 'letter-spacing': 1.2 }, g); t.textContent = R.name;
      if (PAGE === id) { var y = add('text', { x: R.c[0], y: (id === 'corridor' ? R.c[1] - 90 : R.c[1] + 14), 'text-anchor': 'middle', fill: '#7fffb0', 'font-size': 7.5, 'font-weight': 700 }, g); y.textContent = '● YOU ARE HERE'; }
      g.addEventListener('click', function () { if (PAGE === id) { close(); return; } close(); toast('Heading to the ' + R.name.toLowerCase() + '…'); setTimeout(function () { location.href = R.page; }, 250); });
    }
    room('corridor', function (g) { add('rect', { x: 139, y: 172, width: 22, height: 168, rx: 5, fill: fill, stroke: line, 'stroke-width': 1.4 }, g); });
    room('bridge', function (g) { add('path', { d: 'M150 22 C126 30 112 60 112 86 C112 104 130 112 150 112 C170 112 188 104 188 86 C188 60 174 30 150 22 Z', fill: fill, stroke: line, 'stroke-width': 1.4 }, g); });
    room('holodeck', function (g) { add('rect', { x: 20, y: 158, width: 76, height: 76, rx: 6, fill: fill, stroke: line, 'stroke-width': 1.4 }, g); });
    room('lounge', function (g) { add('circle', { cx: 242, cy: 206, r: 38, fill: fill, stroke: line, 'stroke-width': 1.4 }, g); });
    room('media', function (g) { add('circle', { cx: 242, cy: 304, r: 39, fill: fill, stroke: line, 'stroke-width': 1.4 }, g); });
    room('library', function (g) { add('circle', { cx: 150, cy: 420, r: 46, fill: fill, stroke: line, 'stroke-width': 1.4 }, g); });
    [[150, 112, 150, 172], [96, 196, 139, 196], [161, 206, 204, 206], [161, 304, 203, 304], [150, 340, 150, 374]].forEach(function (d) { add('line', { x1: d[0], y1: d[1], x2: d[2], y2: d[3], stroke: line, 'stroke-width': 3, 'stroke-dasharray': '3 2' }); });   // doorways
    // the crew, where they are right now
    var snap = load('wf-crew', null), L = window.WAYFARER && window.WAYFARER.crewLayout, live = window.WAYFARER && window.WAYFARER.crew && window.WAYFARER.crew.engine;
    var NAMES = { nav: 'Aster', eng: 'Forge', sci: 'Vesper', com: 'Echo', tac: 'Sentinel', sen: 'Prism', ember: 'Ember', nimbus: 'Nimbus', orbit: 'Orbit', pixel: 'Pixel' };
    var list = live ? Array.from(live.npcs.values()).map(function (n) { return { id: n.id, node: n.node, x: n.pos.x, z: n.pos.z, cat: n.kind === 'cat' }; })
                    : (snap && snap.npcs || []).map(function (n) { return { id: n.id, node: n.node, x: n.pos && n.pos.x, z: n.pos && n.pos.z, cat: /ember|nimbus|orbit|pixel/.test(n.id) }; });
    var legend = [];
    list.forEach(function (n, i) {
      var nd = L && L.nodes[n.node], room = nd ? nd.room : null; if (!room || !ROOMS[room]) return;
      var OFF = { corridor: 0, bridge: 1, holodeck: 2, lounge: 3, media: 4, library: 5 };
      var lx = n.x != null ? n.x - OFF[room] * 100 : nd.lx, lz = n.z != null ? n.z : nd.lz, p = mapPt(room, lx, lz);
      add('circle', { cx: p[0], cy: p[1], r: n.cat ? 2.6 : 3.4, fill: n.cat ? '#ffb0e0' : '#7fd8ff', stroke: '#000', 'stroke-width': 0.6 });
      legend.push((n.cat ? '🐈 ' : '🤖 ') + NAMES[n.id] + ' — ' + ROOMS[room].name.toLowerCase());
    });
    var FL = load('wf-faults', []), FOFF = { corridor: 0, bridge: 1, holodeck: 2, lounge: 3, media: 4, library: 5 };
    FL.forEach(function (f) { if (!ROOMS[f.room]) return; var p = mapPt(f.room, f.x, f.z); var t = add('text', { x: p[0], y: p[1] + 4, 'text-anchor': 'middle', 'font-size': 11, fill: '#ff6a40' }); t.textContent = '⚠'; });
    if (FL.length) legend.unshift('⚠ ' + FL.length + ' fault' + (FL.length > 1 ? 's' : '') + ' to fix');
    box.appendChild(el('p', 'sub', 'Tap a room to go there · <span style="color:#7fd8ff">●</span> droids <span style="color:#ffb0e0">●</span> cats'));
    box.appendChild(svg);
    if (legend.length) box.appendChild(el('p', 'sub', legend.join(' · ')));
    else box.appendChild(el('p', 'sub', 'Crew positions show once you’ve been aboard.'));
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
