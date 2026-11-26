// SS Wayfarer — STARJACK (user, Nov 26: "a sit-down card game against the droids in the Lounge, betting credits").
// Tap the deck on the Lounge's brass coffee table (world 0, 0.5, −1.1) → the card table. Blackjack rules with a space deck
// (suits ☀ suns · ☾ moons · ✦ stars · ☄ comets): get closer to 21 than the dealer without going over. A droid deals (the one
// sitting closest, else Echo), two more droids play their own hands beside you and chat. Bet 10/25/50 cr; Starjack (21 with
// two cards) pays 3:2; Double down doubles the bet for one card. Events 'cards', 'cardwin'.
(function () {
  if (!window.AFRAME) return;
  var THREE = AFRAME.THREE, TABLE = new THREE.Vector3(0, 0.5, -1.1);
  var SUITS = ['☀', '☾', '✦', '☄'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var LINES = {
    nav: ['Calculating optimal play.', 'The odds favour standing, Captain.', 'A precise outcome.'], eng: ['I would rather be fixing something.', 'Hit me. Gently.', 'Statistically irritating.'],
    sci: ['Fascinating distribution!', 'I am observing the deck for patterns.', 'Hypothesis: you are bluffing.'], com: ['Good luck, Captain!', 'Well played, everyone.', 'Oh, that is a lovely card.'],
    tac: ['Engaging.', 'Holding position.', 'Acceptable losses.'], sen: ['I sensed that coming.', 'The cards whisper, Captain.', 'Anomaly detected: luck.']
  };
  var NAMES = { nav: 'Aster', eng: 'Forge', sci: 'Vesper', com: 'Echo', tac: 'Sentinel', sen: 'Prism' };
  function L() { return window.WF_LIFE; }
  function snd(k, v) { if (window.WF_SOUND && !WF_SOUND.muted()) WF_SOUND.droid(k, 0, v || 0.5); }
  var css = document.createElement('style');
  css.textContent = '#sj{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:62;display:none;width:min(94vw,440px);max-height:90vh;overflow:auto;padding:14px;border-radius:22px;box-sizing:border-box;' +
    'background:linear-gradient(140deg,rgba(255,255,255,.12),rgba(255,255,255,.03)),rgba(10,32,20,.72);-webkit-backdrop-filter:blur(22px) saturate(185%);backdrop-filter:blur(22px) saturate(185%);border:1px solid rgba(255,210,140,.35);color:#fff;font:600 13px -apple-system,system-ui,sans-serif}' +
    '#sj h3{margin:0 0 6px;text-align:center;font:800 12px -apple-system,system-ui,sans-serif;letter-spacing:3px;color:#ffd58a}#sj .who{font:700 11px -apple-system,system-ui,sans-serif;letter-spacing:1.5px;color:#cfe8d6;margin:8px 0 4px;display:flex;justify-content:space-between}' +
    '#sj .hand{display:flex;gap:5px;flex-wrap:wrap;min-height:52px}#sj .c{width:36px;height:50px;border-radius:6px;background:linear-gradient(160deg,#fffaf0,#e8dcc4);color:#1a1a2a;font:800 13px -apple-system,system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.4)}' +
    '#sj .c.r{color:#b02a1a}#sj .c.back{background:repeating-linear-gradient(45deg,#7a3a1a,#7a3a1a 4px,#a8542a 4px,#a8542a 8px);color:transparent}#sj .c i{font-style:normal;font-size:15px}' +
    '#sj .bots{display:grid;grid-template-columns:1fr 1fr;gap:8px}#sj .bots .c{width:26px;height:36px;font-size:10px}#sj .bots .c i{font-size:11px}' +
    '#sj .say{font-style:italic;color:#e8f4ea;text-align:center;margin:8px 0;min-height:18px}#sj .msg{text-align:center;font:800 15px -apple-system,system-ui,sans-serif;color:#ffe08a;min-height:20px;margin:6px 0}' +
    '#sj .row{display:flex;gap:6px;margin-top:6px}#sj .row button{flex:1;padding:11px 4px;border-radius:13px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.09);color:#fff;font:800 12.5px -apple-system,system-ui,sans-serif}' +
    '#sj .row button.on{border-color:#ffd27a;background:rgba(255,200,100,.22)}#sj .row button:disabled{opacity:.35}';
  document.head.appendChild(css);

  var G = null, box = null, bet = 10;
  function deck() { var d = []; for (var k = 0; k < 2; k++) SUITS.forEach(function (s) { RANKS.forEach(function (r) { d.push({ r: r, s: s }); }); }); for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = d[i]; d[i] = d[j]; d[j] = t; } return d; }
  function val(h) { var v = 0, a = 0; h.forEach(function (c) { if (c.r === 'A') { a++; v += 11; } else v += /[JQK]/.test(c.r) ? 10 : +c.r; }); while (v > 21 && a) { v -= 10; a--; } return v; }
  function cardHtml(c, hidden) { if (hidden) return '<div class="c back">?</div>'; return '<div class="c' + (c.s === '☀' || c.s === '✦' ? ' r' : '') + '">' + c.r + '<i>' + c.s + '</i></div>'; }
  function crew() {   // dealer + two players: droids currently in the Lounge first
    var e = window.WAYFARER && WAYFARER.crew && WAYFARER.crew.engine, here = [], all = Object.keys(NAMES);
    if (e) e.npcs.forEach(function (n) { if (n.kind === 'droid' && WAYFARER.crewLayout.nodes[n.node] && WAYFARER.crewLayout.nodes[n.node].room === 'lounge') here.push(n.id); });
    var pick = here.concat(all.filter(function (id) { return here.indexOf(id) < 0; }).sort(function () { return Math.random() - 0.5; }));
    return pick.slice(0, 3);
  }
  function open() {
    if (!box) { box = document.createElement('div'); box.id = 'sj'; document.body.appendChild(box); ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach(function (n) { box.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); }); }
    var c = crew(); G = { dealer: c[0], bots: [{ id: c[1], h: [] }, { id: c[2], h: [] }], d: deck(), me: [], dh: [], phase: 'bet', say: 'Place your bet, Captain.', msg: '', bet: bet };
    G.sayWho = G.dealer; box.style.display = 'block'; document.body.classList.add('reading'); window.WAYFARER.frozen = true; snd('whistle'); render();
    if (L()) L().event('cards');
  }
  function close() { if (box) box.style.display = 'none'; document.body.classList.remove('reading'); window.WAYFARER.frozen = false; G = null; }
  function draw() { if (G.d.length < 15) G.d = deck(); return G.d.pop(); }
  function deal() {
    if (!L().spend(bet)) return; G.bet = bet; G.me = [draw(), draw()]; G.dh = [draw(), draw()]; G.bots.forEach(function (b) { b.h = [draw(), draw()]; b.done = false; }); G.phase = 'play'; G.msg = ''; G.double = false;
    talk(G.dealer, 0); snd('chatter', 0.4);
    if (val(G.me) === 21) { finish(); return; } render();
  }
  function talk(id, k) { var l = LINES[id] || ['…'], line = l[k == null ? Math.floor(Math.random() * l.length) : Math.min(k, l.length - 1)]; G.say = NAMES[id] + ': “' + line + '”'; if (window.WF_SOUND && WF_SOUND.speak) WF_SOUND.speak(line, 'robot', { vol: 0.8 }); }
  function hit() { G.me.push(draw()); snd('chatter', 0.3); if (val(G.me) > 21) finish(); else if (G.double) finish(); else render(); }
  function stand() { finish(); }
  function dbl() { if (!L().spend(G.bet)) return; G.bet *= 2; G.double = true; hit(); }
  function finish() {
    G.phase = 'done'; var mine = val(G.me), sj = mine === 21 && G.me.length === 2;
    G.bots.forEach(function (b) { while (val(b.h) < 17) b.h.push(draw()); });
    if (mine <= 21 && !sj) while (val(G.dh) < 17) G.dh.push(draw());
    var dv = val(G.dh), win = 0, msg;
    if (mine > 21) msg = 'Bust at ' + mine + ' — the house takes it';
    else if (sj && !(dv === 21 && G.dh.length === 2)) { win = Math.floor(G.bet * 2.5); msg = 'STARJACK! +' + (win - G.bet) + ' cr'; }
    else if (dv > 21 || mine > dv) { win = G.bet * 2; msg = 'You win with ' + mine + (dv > 21 ? ' (dealer bust)' : ' vs ' + dv) + ' · +' + G.bet + ' cr'; }
    else if (mine === dv) { win = G.bet; msg = 'Push at ' + mine + ' — bet returned'; }
    else msg = 'Dealer ' + dv + ' beats your ' + mine;
    if (win) L().add(win); if (win > G.bet) { L().event('cardwin'); snd('affirm', 0.6); } else if (!win) snd('ponder', 0.5);
    var b = G.bots[Math.floor(Math.random() * 2)]; talk(b.id, val(b.h) > 21 ? 2 : win > G.bet ? 1 : 0);
    G.msg = msg; render();
  }
  function render() {
    var dealerHidden = G.phase === 'play', h = '<h3>STARJACK · CREW LOUNGE</h3>';
    h += '<div class="who"><span>DEALER · ' + NAMES[G.dealer].toUpperCase() + '</span><span>' + (G.phase === 'done' ? val(G.dh) : G.phase === 'play' ? '?' : '') + '</span></div><div class="hand">' + G.dh.map(function (c, i) { return cardHtml(c, dealerHidden && i === 1); }).join('') + '</div>';
    h += '<div class="bots">' + G.bots.map(function (b) { return '<div><div class="who"><span>' + NAMES[b.id].toUpperCase() + '</span><span>' + (b.h.length ? val(b.h) : '') + '</span></div><div class="hand">' + b.h.map(function (c) { return cardHtml(c); }).join('') + '</div></div>'; }).join('') + '</div>';
    h += '<div class="who"><span>YOU · BET ' + G.bet + ' cr</span><span>' + (G.me.length ? val(G.me) : '') + '</span></div><div class="hand">' + G.me.map(function (c) { return cardHtml(c); }).join('') + '</div>';
    h += '<p class="say">' + G.say + '</p><p class="msg">' + G.msg + '</p><p style="text-align:center;color:#cfe8d6;margin:0">' + L().credits() + ' cr</p>';
    box.innerHTML = h;
    var row = document.createElement('div'); row.className = 'row';
    if (G.phase === 'play') { [['HIT', hit], ['STAND', stand], ['DOUBLE', dbl]].forEach(function (q, i) { var b = document.createElement('button'); b.textContent = q[0]; if (i === 2 && G.me.length > 2) b.disabled = true; b.onclick = q[1]; row.appendChild(b); }); }
    else { [10, 25, 50].forEach(function (v) { var b = document.createElement('button'); b.textContent = v + ' cr'; if (v === bet) b.className = 'on'; b.onclick = function () { bet = v; G.bet = v; render(); }; row.appendChild(b); });
      var d = document.createElement('button'); d.textContent = G.phase === 'done' ? 'DEAL AGAIN' : 'DEAL'; d.onclick = deal; row.appendChild(d); }
    box.appendChild(row);
    var r2 = document.createElement('div'); r2.className = 'row'; var x = document.createElement('button'); x.textContent = 'Leave the table'; x.onclick = close; r2.appendChild(x); box.appendChild(r2);
  }

  // the deck on the coffee table + its tap target
  function build() {
    var sc = document.querySelector('a-scene'); if (!sc || !sc.hasLoaded) return setTimeout(build, 400);
    var g = new THREE.Group(); g.position.set(0.2, 0.495, -1.0); g.rotation.y = 0.4; g.userData.noCollide = true;
    var cm = new THREE.MeshStandardMaterial({ color: 0xa8542a, roughness: 0.6 }), wm = new THREE.MeshStandardMaterial({ color: 0xf2e8d4, roughness: 0.7 });
    var stack = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.13), [wm, wm, cm, wm, wm, wm]); g.add(stack);
    for (var i = 0; i < 5; i++) { var c = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.002, 0.13), wm); c.position.set(-0.16 + i * 0.07, -0.012, 0.12); c.rotation.y = (i - 2) * 0.25; g.add(c); }
    var glow = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.15, 32), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.02; g.add(glow);
    sc.object3D.add(g);
    var hit = document.createElement('a-entity'); hit.setAttribute('class', 'clickable interactive'); hit.setObject3D('mesh', new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })));
    hit.object3D.position.copy(TABLE); hit.object3D.userData.noCollide = true; sc.appendChild(hit);
    hit.addEventListener('click', function () { var p = new THREE.Vector3(); sc.camera.el.object3D.getWorldPosition(p); if (Math.hypot(p.x - TABLE.x, p.z - TABLE.z) > 3.6) { if (L()) L().toast('Sit down at the coffee table to play Starjack with the crew'); return; } open(); });
    var t0 = 0; (function pulse() { t0 += 0.05; glow.material.opacity = 0.35 + 0.25 * Math.sin(t0 * 2); requestAnimationFrame(pulse); }());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
  window.WF_CARDS = { open: open, close: close };
}());
