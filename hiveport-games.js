// SS Wayfarer — HIVEPORT GAMES (user, Nov 26). Loaded after station.html's own script; uses window.HIVE (its crowd, sounds, panels).
//  · DANCE FLOOR (in front of the holo stage, x ±6, z −9…−2.5): step on → DANCE button → 32-beat rhythm round locked to the club
//    loop (124 BPM, beat clock = the music's own Web Audio time). Tap anywhere as each note hits the ring. PERFECT ±70 ms, GOOD ±140.
//    Nearby K'Vetar dance with you and cheer at combos. Pays score/40 ≤ 80 cr. Best 'wf-dance-best'. Event 'dance'.
//  · THE COMB (gambling den, the six consoles in the GAMING zone, x 28–42, z 2.5 / 8.5): HIVE DICE (3 dice each vs the house, higher
//    total wins, triples pay ×3) and the HONEY WHEEL (12 hexes: 5 amber, 5 jade ×2, 2 violet ×5). Bets 10 / 50 / 100. Event 'gamble'.
//  · BRAWLS: every 2.5–5 min two nearby K'Vetar start shoving. Tap one → Break it up (timing rings, +40 cr) · Join in (FISTFIGHT) ·
//    Walk away. Any soldier/general also takes "Fancy a fight?" in conversation.
//  · BOUNTIES: the BOUNTY BROKER by the airlock (x 4.2, z 20.8) posts one WANTED K'Vetar a day (crest + eye colour + where last
//    seen). They walk in the crowd like anyone else; find and talk to them → "You're coming with me" → FISTFIGHT → 200 cr.
//  · FISTFIGHT: watch their stance — GUARD (wait) · OPEN! (PUNCH lands) · SWING! (BLOCK within 0.6 s or take a hit). You 5 HP.
(function () {
  var H = null, THREE = AFRAME.THREE;
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var DAY = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  function L() { return window.WF_LIFE; }
  function camP() { var p = new THREE.Vector3(); H.sc.camera.el.object3D.getWorldPosition(p); return p; }
  function stop(e) { ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach(function (n) { e.addEventListener(n, function (ev) { ev.stopPropagation(); }, { passive: true }); }); }
  function div(id, cls) { var e = document.getElementById(id); if (!e) { e = document.createElement('div'); e.id = id; if (cls) e.className = cls; document.body.appendChild(e); stop(e); } return e; }
  var css = document.createElement('style');
  css.textContent =
    '.hg-btn{position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:45;display:none;padding:11px 22px;border-radius:20px;border:1px solid rgba(255,150,220,.6);' +
      'background:linear-gradient(140deg,rgba(255,120,200,.4),rgba(140,80,255,.3));color:#fff;font:800 13px -apple-system,system-ui,sans-serif;letter-spacing:2px;box-shadow:0 0 24px rgba(255,100,200,.45)}' +
    '#hg-dance{position:fixed;left:0;right:0;bottom:calc(120px + env(safe-area-inset-bottom,0px));height:90px;z-index:44;display:none;pointer-events:none}' +
    '#hg-dance .lane{position:absolute;left:8%;right:8%;top:38px;height:14px;border-radius:7px;background:rgba(255,255,255,.08);border:1px solid rgba(255,150,220,.3)}' +
    '#hg-dance .ring{position:absolute;left:20%;top:22px;width:44px;height:44px;margin-left:-22px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 18px #ff7ad0}' +
    '#hg-dance .n{position:absolute;top:30px;width:28px;height:28px;margin-left:-14px;border-radius:50%;background:radial-gradient(circle,#fff,#ff7ad0 60%,#8a4cff);box-shadow:0 0 12px #ff7ad0}' +
    '#hg-dance .j{position:absolute;left:20%;top:-14px;transform:translateX(-50%);font:900 20px -apple-system,system-ui,sans-serif;color:#fff;text-shadow:0 0 14px #ff7ad0;letter-spacing:2px}' +
    '#hg-dance .s{position:absolute;right:8%;top:-14px;font:800 14px -apple-system,system-ui,sans-serif;color:#ffd6f0;letter-spacing:1.5px}' +
    '#hg-fight{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:62;display:none;width:min(92vw,380px);padding:16px;border-radius:22px;box-sizing:border-box;text-align:center;' +
      'background:linear-gradient(140deg,rgba(255,255,255,.12),rgba(255,255,255,.03)),rgba(40,10,10,.62);-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,120,90,.45);color:#fff;font:600 13px -apple-system,system-ui,sans-serif}' +
    '#hg-fight h3{margin:0 0 8px;font:800 12px -apple-system,system-ui,sans-serif;letter-spacing:3px;color:#ffb09a}#hg-fight .hp{display:flex;gap:10px;justify-content:space-between;margin:6px 0;font-size:12px}#hg-fight .hp i{flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden;align-self:center}#hg-fight .hp u{display:block;height:100%;background:linear-gradient(90deg,#ff5a3a,#ffc070)}' +
    '#hg-fight .st{font:900 34px -apple-system,system-ui,sans-serif;letter-spacing:3px;margin:12px 0;min-height:42px}#hg-fight .row{display:flex;gap:10px}#hg-fight .row button{flex:1;padding:16px;border-radius:16px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;font:900 16px -apple-system,system-ui,sans-serif;letter-spacing:2px}' +
    '#hg-fight .row button:active{background:rgba(255,160,120,.35)}#hg-fight p{margin:6px 0 0;color:#f0d0c8;font-size:12px}' +
    '#hg-den .dice{font:900 38px -apple-system,system-ui,sans-serif;letter-spacing:6px;margin:8px 0}#hg-den .bets{display:flex;gap:6px;margin:8px 0}#hg-den .bets button{flex:1;text-align:center}#hg-den .bets button.on{border-color:#ffd27a;background:rgba(255,200,100,.2)}' +
    '#hg-den .wheel{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin:8px 0}#hg-den .wheel span{height:26px;border-radius:7px;opacity:.55;transition:all .08s}#hg-den .wheel span.on{opacity:1;transform:scale(1.15);box-shadow:0 0 12px #fff}' +
    '#hg-ring{position:fixed;left:50%;top:50%;width:90px;height:90px;margin:-45px 0 0 -45px;border-radius:50%;border:5px solid #7fffb0;z-index:61;display:none;pointer-events:none;box-shadow:0 0 22px #7fffb0}' +
    '#hg-core{position:fixed;left:50%;top:50%;width:90px;height:90px;margin:-45px 0 0 -45px;border-radius:50%;background:rgba(127,255,176,.18);border:2px dashed rgba(255,255,255,.6);z-index:61;display:none}';
  document.head.appendChild(css);

  // ────────────────────────── DANCE FLOOR ──────────────────────────
  var BPM = 124, BEAT = 60 / BPM, dance = null, danceBtn = null, DZ = { x0: -6, x1: 6, z0: -9, z1: -2.5 };
  var clockMusic = false;      // chosen once per round: the music's own clock if it's playing, else the page clock (never switches mid-round)
  function musicOn() { var A = H.AUD; return !!(A && A.ctx && A.ctx.state === 'running' && A.musicAt != null); }
  function beatNow() { var A = H.AUD; if (clockMusic && musicOn()) return (A.ctx.currentTime - A.musicAt) / BEAT; return performance.now() / 1000 / BEAT; }
  function startDance() {
    danceBtn.style.display = 'none'; clockMusic = musicOn(); var b0 = Math.ceil(beatNow()) + 4, notes = [];
    for (var i = 0; i < 32; i++) { var b = b0 + i; notes.push({ b: b, hit: false }); if (i % 4 === 3 && Math.random() < 0.6) notes.push({ b: b + 0.5, hit: false }); }
    var el = div('hg-dance'); el.innerHTML = '<div class="lane"></div><div class="ring"></div><div class="j"></div><div class="s"></div>'; el.style.display = 'block';
    dance = { notes: notes, end: b0 + 33, score: 0, combo: 0, best: 0, el: el, dom: [] };
    notes.forEach(function (n) { var d = document.createElement('div'); d.className = 'n'; el.appendChild(d); n.d = d; });
    judge('GET READY'); crowdDance(true);
    if (L()) L().toast('Tap anywhere on the beat as the lights hit the ring');
  }
  function judge(t) { var j = dance.el.querySelector('.j'); j.textContent = t; j.style.opacity = 1; clearTimeout(judge.t); judge.t = setTimeout(function () { if (dance) j.style.opacity = 0; }, 450); }
  function danceTap() {
    var now = beatNow(), best = null, bd = 9;
    dance.notes.forEach(function (n) { if (n.hit) return; var d = Math.abs(n.b - now) * BEAT; if (d < bd) { bd = d; best = n; } });
    if (!best || bd > 0.2) { dance.combo = 0; judge('MISS'); return; }
    best.hit = true; best.d.style.display = 'none';
    if (bd <= 0.07) { dance.score += 100; dance.combo++; judge('PERFECT'); } else if (bd <= 0.14) { dance.score += 50; dance.combo++; judge('GOOD'); } else { dance.combo = 0; judge('MISS'); }
    dance.best = Math.max(dance.best, dance.combo);
    if (dance.combo && dance.combo % 8 === 0) cheer();
  }
  function cheer() { var p = camP(); H.NPCS.forEach(function (e) { if (Math.hypot(e.a.p[0] - p.x, e.a.p[1] - p.z) < 12 && Math.random() < 0.5) { e.a.state = 'Toast'; setTimeout(function () { if (dance) e.a.state = 'Dance'; }, 1500); } });
    H.alienSay(p.x + 2, p.z - 2, 'trill', true); setTimeout(function () { H.alienSay(p.x - 2, p.z - 1, 'chitter', true); }, 300); if (L()) L().toast('The crowd loves it! ×' + dance.combo); }
  function crowdDance(on) { var p = camP(); H.NPCS.forEach(function (e) { if (on && Math.hypot(e.a.p[0] - p.x, e.a.p[1] - p.z) < 12) { e.a.path = []; H.CROWD.release(e.a); e.a.wait = 999; e.a.state = 'Dance'; e._danced = true; } else if (!on && e._danced) { e._danced = false; e.a.wait = 0.5 + Math.random(); } }); }
  function danceTick() {
    var now = beatNow(), W = window.innerWidth, x0 = W * 0.2, span = W * 0.72;
    dance.notes.forEach(function (n) { if (n.hit) return; var dt = n.b - now; if (dt < -0.6) { n.hit = true; n.d.style.display = 'none'; dance.combo = 0; judge('MISS'); return; }
      n.d.style.display = dt < 6 ? 'block' : 'none'; n.d.style.left = (x0 + dt / 6 * span) + 'px'; });
    dance.el.querySelector('.s').textContent = 'SCORE ' + dance.score + (dance.combo > 2 ? '  ×' + dance.combo : '');
    if (now > dance.end) {
      var sc = dance.score, pay = Math.min(80, Math.floor(sc / 40)), bb = load('wf-dance-best', 0); if (sc > bb) save('wf-dance-best', sc);
      dance.el.style.display = 'none'; crowdDance(false); dance = null;
      if (L()) { if (pay) L().add(pay, 'Dance floor · ' + sc + ' pts' + (sc > bb ? ' · NEW BEST' : '')); else L().toast('Dance floor · ' + sc + ' pts'); L().event('dance'); }
    }
  }
  addEventListener('pointerdown', function (e) { if (dance && H && e.target === H.sc.canvas) danceTap(); }, true);
  addEventListener('keydown', function (e) { if (dance && (e.code === 'Space' || e.code === 'KeyK')) { e.preventDefault(); danceTap(); } });

  // ────────────────────────── THE COMB (gambling) ──────────────────────────
  var CONSOLES = [[29, 2.5], [29, 8.5], [35, 2.5], [35, 8.5], [41, 2.5], [41, 8.5]], bet = 10;
  function den() {
    var el = div('hg-den', 'panel'); el.style.display = 'block'; document.body.classList.add('reading');
    function render(game, msg, dice) {
      var cr = L().credits();
      el.innerHTML = '<h2>THE COMB · GAMBLING DEN</h2><p><b>' + cr + ' cr</b></p><div class="bets"></div>' +
        (game === 'wheel' ? '<p class="say">Honey Wheel — amber or jade pay ×2, violet ×5</p><div class="wheel"></div>' : '<p class="say">Hive Dice — beat the house’s three dice. Triples pay ×3.</p><div class="dice">' + (dice || '⚀ ⚀ ⚀ · ⚀ ⚀ ⚀') + '</div>') +
        '<p id="den-msg">' + (msg || '') + '</p><div class="acts"></div><button class="close">Leave the table</button>';
      var bets = el.querySelector('.bets'); [10, 50, 100].forEach(function (v) { var b = document.createElement('button'); b.textContent = v + ' cr'; if (v === bet) b.className = 'on'; b.onclick = function () { bet = v; render(game, msg, dice); }; bets.appendChild(b); });
      var acts = el.querySelector('.acts');
      if (game === 'wheel') {
        var wh = el.querySelector('.wheel'), C = ['#ffb040', '#40d890', '#ffb040', '#40d890', '#ffb040', '#a060ff', '#40d890', '#ffb040', '#40d890', '#ffb040', '#40d890', '#a060ff'];
        C.forEach(function (c) { var s = document.createElement('span'); s.style.background = c; wh.appendChild(s); });
        [['amber', '#ffb040'], ['jade', '#40d890'], ['violet', '#a060ff']].forEach(function (q) { var b = document.createElement('button'); b.innerHTML = 'Bet on ' + q[0]; b.style.borderColor = q[1]; b.onclick = function () { spin(q[0], C, wh); }; acts.appendChild(b); });
        var sw = document.createElement('button'); sw.textContent = '🎲 Switch to Hive Dice'; sw.onclick = function () { render('dice'); }; acts.appendChild(sw);
      } else {
        var r = document.createElement('button'); r.textContent = '🎲 Roll for ' + bet + ' cr'; r.onclick = function () { roll(); }; acts.appendChild(r);
        var sw2 = document.createElement('button'); sw2.textContent = '🍯 Switch to the Honey Wheel'; sw2.onclick = function () { render('wheel'); }; acts.appendChild(sw2);
      }
      el.querySelector('.close').onclick = function () { el.style.display = 'none'; document.body.classList.remove('reading'); };
    }
    var F = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    function roll() {
      if (!L().spend(bet)) return; L().event('gamble'); var k = 0, iv = setInterval(function () {
        var a = [0, 0, 0].map(function () { return 1 + Math.floor(Math.random() * 6); }), h = [0, 0, 0].map(function () { return 1 + Math.floor(Math.random() * 6); });
        render('dice', 'Rolling…', a.map(function (v) { return F[v - 1]; }).join(' ') + ' · ' + h.map(function (v) { return F[v - 1]; }).join(' '));
        if (++k < 10) return; clearInterval(iv);
        var sa = a.reduce(function (x, y) { return x + y; }), sh = h.reduce(function (x, y) { return x + y; }), triple = a[0] === a[1] && a[1] === a[2], win = 0, msg;
        if (sa > sh) { win = bet * (triple ? 4 : 2); msg = 'You ' + sa + ' · House ' + sh + ' — you win ' + win + ' cr' + (triple ? ' (TRIPLE!)' : ''); }
        else if (sa === sh) { win = bet; msg = 'Tie at ' + sa + ' — bet returned'; } else msg = 'You ' + sa + ' · House ' + sh + ' — the house wins';
        if (win) L().add(win); if (win > bet) { L().event('gamblewin'); H.alienSay(35, 5, 'chitter', true); } else if (!win) H.alienSay(35, 5, 'click', true);
        render('dice', msg, a.map(function (v) { return F[v - 1]; }).join(' ') + ' · ' + h.map(function (v) { return F[v - 1]; }).join(' '));
      }, 90);
    }
    function spin(pickC, C, wh) {
      if (!L().spend(bet)) return; L().event('gamble'); var spans = wh.children, steps = 24 + Math.floor(Math.random() * 12), i = 0, at = Math.floor(Math.random() * 12);
      (function step() { [].forEach.call(spans, function (s) { s.classList.remove('on'); }); at = (at + 1) % 12; spans[at].classList.add('on'); if (window.WF_SOUND && !WF_SOUND.muted()) WF_SOUND.droid('chatter', 0, 0.15);
        if (++i < steps) { setTimeout(step, 40 + i * i * 0.35); return; }
        var col = { '#ffb040': 'amber', '#40d890': 'jade', '#a060ff': 'violet' }[C[at]], win = col === pickC ? bet * (col === 'violet' ? 5 : 2) : 0;
        if (win) { L().add(win); L().event('gamblewin'); H.alienSay(35, 5, 'trill', true); }
        el.querySelector('#den-msg').textContent = 'It lands on ' + col + (win ? ' — you win ' + win + ' cr!' : ' — no luck.'); el.querySelector('p b').textContent = L().credits() + ' cr';
      }());
    }
    render('dice');
  }

  // ────────────────────────── FISTFIGHT (brawls + bounties) ──────────────────────────
  var fight = null;
  function startFight(e, opts) {
    opts = opts || {}; var el = div('hg-fight'); el.style.display = 'block'; document.body.classList.add('reading');
    var hpMax = opts.hp || (/soldier|general/.test(e.caste) ? 4 : 3);
    fight = { e: e, me: 5, them: hpMax, max: hpMax, stance: 'guard', t: 0, next: 1.2, swingAt: 0, el: el, opts: opts, blocked: false };
    e.a.path = []; H.CROWD.release(e.a); e.a.wait = 999; e.a.state = 'Idle';
    el.innerHTML = '<h3>' + (opts.title || 'BAR FIGHT') + '</h3><div class="hp"><span>YOU</span><i><u class="me"></u></i></div><div class="hp"><span>' + (opts.name || 'K’VETAR') + '</span><i><u class="th"></u></i></div>' +
      '<div class="st">GUARD</div><div class="row"><button class="pu">👊 PUNCH</button><button class="bl">🛡 BLOCK</button></div><p>Punch when they’re OPEN · Block when they SWING</p>';
    el.querySelector('.pu').onclick = function () { act('punch'); }; el.querySelector('.bl').onclick = function () { act('block'); };
    W().frozen = true; drawFight(); H.alienSay(e.a.p[0], e.a.p[1], 'growl', true);
  }
  function W() { return window.WAYFARER; }
  function drawFight() { var f = fight; f.el.querySelector('.me').style.width = (f.me / 5 * 100) + '%'; f.el.querySelector('.th').style.width = (f.them / f.max * 100) + '%';
    var st = f.el.querySelector('.st'); st.textContent = { guard: 'GUARD', open: 'OPEN!', swing: 'SWING!' }[f.stance]; st.style.color = { guard: '#c8b8b0', open: '#7fffb0', swing: '#ff6a4a' }[f.stance]; }
  function act(k) {
    var f = fight; if (!f) return;
    if (k === 'punch') { if (f.stance === 'open') { f.them--; f.stance = 'guard'; f.next = f.t + 0.7 + Math.random() * 0.8; f.e.a.state = 'Brawl_Recoil'; if (window.WF_SOUND) WF_SOUND.boom && WF_SOUND.boom(false); H.alienSay(f.e.a.p[0], f.e.a.p[1], 'growl', true); }
      else { f.me--; f.e.a.state = 'Brawl_Shove'; shake(); } }
    else if (k === 'block') { if (f.stance === 'swing') { f.blocked = true; f.stance = 'guard'; f.next = f.t + 0.5 + Math.random() * 0.6; if (window.WF_SOUND) WF_SOUND.zap(0, 0.5); } }
    drawFight(); checkEnd();
  }
  function shake() { var c = document.querySelector('canvas.a-canvas'); if (!c) return; c.style.transition = 'transform .06s'; c.style.transform = 'translate(8px,-4px)'; setTimeout(function () { c.style.transform = 'translate(-6px,3px)'; }, 60); setTimeout(function () { c.style.transform = ''; }, 140); }
  function fightTick(dt) {
    var f = fight; f.t += dt; var cp = camP(); f.e.a.heading = Math.atan2(cp.x - f.e.a.p[0], cp.z - f.e.a.p[1]);
    if (f.stance === 'swing' && f.t > f.swingAt + 0.6) { f.me--; f.stance = 'guard'; f.next = f.t + 0.8 + Math.random(); shake(); drawFight(); checkEnd(); return; }
    if (f.stance === 'open' && f.t > f.swingAt + 0.75) { f.stance = 'guard'; f.next = f.t + 0.4 + Math.random() * 0.8; drawFight(); }
    if (f.stance === 'guard' && f.t > f.next) { f.stance = Math.random() < 0.5 ? 'open' : 'swing'; f.swingAt = f.t; f.e.a.state = f.stance === 'swing' ? 'Brawl_Shove' : 'Idle'; drawFight(); }
  }
  function checkEnd() {
    var f = fight; if (!f || (f.me > 0 && f.them > 0)) return; var won = f.them <= 0; fight = null; f.el.style.display = 'none'; document.body.classList.remove('reading'); W().frozen = false;
    f.e.a.wait = 1 + Math.random(); f.e.a.state = won ? 'Deescalate' : 'Toast';
    if (f.opts.onEnd) f.opts.onEnd(won);
    else if (won) { L().add(50, 'Won the bar fight'); L().event('brawlwin'); } else { var lose = Math.min(30, L().credits()); if (lose) L().spend(lose, 'Medical bay fee — you lost the fight'); else L().toast('You lost the fight'); }
  }

  // ────────────────────────── BRAWLS ──────────────────────────
  var brawl = null, nextBrawl = 60 + Math.random() * 60;
  function startBrawl() {
    var N = H.NPCS, cp = camP(), best = null, bd = 1e9;
    for (var i = 0; i < N.length; i++) for (var j = i + 1; j < N.length; j++) { var a = N[i].a, b = N[j].a, d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1]); if (d < 3 && d > 0.8 && !N[i].bounty && !N[j].bounty) { var dp = Math.hypot(a.p[0] - cp.x, a.p[1] - cp.z); if (dp < bd) { bd = dp; best = [N[i], N[j]]; } } }
    if (!best) return; brawl = { pair: best, t: 0, ph: 0 };
    best.forEach(function (e, k) { e.a.path = []; H.CROWD.release(e.a); e.a.wait = 999; var o = best[1 - k].a; e.a.heading = Math.atan2(o.p[0] - e.a.p[0], o.p[1] - e.a.p[1]); });
    if (bd < 30) { L().toast('A brawl broke out ' + (bd < 8 ? 'right next to you' : 'nearby') + '! Tap one of them to step in.'); H.alienSay(best[0].a.p[0], best[0].a.p[1], 'growl', true); }
  }
  function brawlTick(dt) {
    brawl.t += dt; brawl.ph += dt; var P = brawl.pair;
    if (brawl.ph > 1.1) { brawl.ph = 0; var k = Math.random() < 0.5 ? 0 : 1; P[k].a.state = 'Brawl_Shove'; P[1 - k].a.state = 'Brawl_Recoil'; if (Math.random() < 0.5) H.alienSay(P[k].a.p[0], P[k].a.p[1], Math.random() < 0.5 ? 'growl' : 'chitter'); }
    if (brawl.t > 40) endBrawl('Deescalate');
  }
  function endBrawl(state) { if (!brawl) return; brawl.pair.forEach(function (e) { e.a.state = state || 'Idle'; e.a.wait = 1.5 + Math.random(); }); brawl = null; nextBrawl = 150 + Math.random() * 150; }
  function brawlMenu(e) {
    var other = brawl.pair[0] === e ? brawl.pair[1] : brawl.pair[0], t = H.talking(); if (t) H.closeP('talk');
    var el = div('hg-brawl', 'panel'); el.style.display = 'block'; document.body.classList.add('reading');
    el.innerHTML = '<h2>BRAWL!</h2><p class="say">Two K’Vetar are trading shoves and the crowd is egging them on.</p>';
    [['🕊 Break it up', function () { calm(e, other); }], ['👊 Join in', function () { var pr = brawl.pair; endBrawl('Toast'); pr.forEach(function (q) { if (q !== e) q.a.state = 'Toast'; }); startFight(e); }], ['🚶 Walk away', function () {}]].forEach(function (q) {
      var b = document.createElement('button'); b.textContent = q[0]; b.onclick = function () { el.style.display = 'none'; document.body.classList.remove('reading'); q[1](); }; el.appendChild(b); });
  }
  function calm(e, other) {   // break it up: tap as the shrinking ring meets the circle, 4 times
    var ring = div('hg-ring'), core = div('hg-core'), n = 0, good = 0, t0 = performance.now(), dur = 1300; ring.style.display = core.style.display = 'block'; W().frozen = true;
    function frame() { if (n >= 4) return; var k = ((performance.now() - t0) % dur) / dur, s = 3.2 - k * 2.6; ring.style.transform = 'scale(' + s + ')'; ring._s = s; requestAnimationFrame(frame); }
    frame();
    function tap(ev) { ev.stopPropagation(); ev.preventDefault(); var ok = Math.abs(ring._s - 1) < 0.22; if (ok) { good++; ring.style.borderColor = '#7fffb0'; if (window.WF_SOUND) WF_SOUND.droid('affirm', 0, 0.4); } else { ring.style.borderColor = '#ff6a4a'; if (window.WF_SOUND) WF_SOUND.zap(0, 0.5); }
      n++; t0 = performance.now(); if (n >= 4) done(); }
    addEventListener('pointerdown', tap, true);
    function done() { removeEventListener('pointerdown', tap, true); ring.style.display = core.style.display = 'none'; W().frozen = false;
      if (good >= 3) { endBrawl('Deescalate'); L().add(40, 'You broke up the fight — the bartender pays you'); L().event('peace'); H.alienSay(0, 7.9, 'hum', true); }
      else { L().toast('They shove you aside and keep going…'); shake(); } }
  }

  // ────────────────────────── BOUNTIES ──────────────────────────
  var CRESTS = { blue_civilian_male: 'a blue civilian crest', yellow_soldier: 'a yellow soldier’s crest', orange_commander: 'an orange commander’s crest', red_general_king: 'a red general’s crest' };
  var NAMES = ['Krexx Vol’tar', 'Siss the Quiet', 'Ozzek Ninefingers', 'Varrik Dun', 'Thelk the Smuggler', 'Ruuq Ashmandible', 'Pexa Kol', 'Grezz Two-Crest'];
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  function todays() { var r = rng(DAY * 7477 + 31), crests = Object.keys(CRESTS), eyes = ['yellow', 'blue', 'red', 'black'];
    return { day: DAY, name: NAMES[Math.floor(r() * NAMES.length)], crest: crests[Math.floor(r() * crests.length)], eye: eyes[Math.floor(r() * eyes.length)], reward: 200,
      crime: ['running Bioship spores through customs', 'skimming the dice den', 'stealing a hauler’s cargo manifest', 'selling fake star charts'][Math.floor(r() * 4)] }; }
  function bstate() { var s = load('wf-bounty', null); if (!s || s.day !== DAY) { s = { day: DAY, accepted: false, done: false }; save('wf-bounty', s); } return s; }
  var target = null;
  function spawnTarget() {
    var B = todays(), st = bstate(); if (!st.accepted || st.done || target || !H.male || !H.CROWD) return;
    var kit = H.male.kit, vi = kit.names.findIndex(function (n) { return n.indexOf(B.crest) >= 0 && n.indexOf(B.eye + ' eyes') >= 0; }); if (vi < 0) vi = 0;
    var spots = [[30, 5], [-35, 5], [10, -5], [-12, 12], [35, -6], [-30, -15]], p = null;
    for (var i = 0; i < 30 && !p; i++) { var s = spots[Math.floor(Math.random() * spots.length)], q = [s[0] + (Math.random() - 0.5) * 3, s[1] + (Math.random() - 0.5) * 3]; if (H.CROWD.free(q)) p = q; }
    if (!p) return; var a = H.CROWD.add('bounty', p); if (!a) return;
    var e = H.makeActor(H.male.base, kit, vi); e.a = a; e.caste = B.crest; e.bounty = true;
    var hit = document.createElement('a-entity'); hit.setAttribute('class', 'clickable'); hit.setObject3D('mesh', H.invisibleBox(1, 3.2, 1)); hit.addEventListener('click', function () { tapNPC(e); }); H.sc.appendChild(hit); e.hit = hit;
    H.NPCS.push(e); target = e;
  }
  function broker() {
    if (!H.male) return; var kit = H.male.kit, vi = kit.names.findIndex(function (n) { return n.indexOf('red_general_king') >= 0 && n.indexOf('black eyes') >= 0; });
    var v = H.makeActor(H.male.base, kit, vi < 0 ? 0 : vi); v.model.position.set(4.2, 0, 20.6); v.model.rotation.y = Math.PI; H.play(v, 'Idle'); brokerNPC = v;
    var c = document.createElement('canvas'); c.width = 512; c.height = 150; var x = c.getContext('2d'); x.fillStyle = '#ff5a3a'; x.shadowColor = '#ff5a3a'; x.shadowBlur = 16; x.font = '800 54px -apple-system, Helvetica, sans-serif'; x.textAlign = 'center'; x.fillText('BOUNTIES', 256, 80); x.shadowBlur = 0; x.fillStyle = '#fff'; x.font = '600 28px -apple-system, Helvetica, sans-serif'; x.fillText('wanted dead or embarrassed', 256, 124);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; var sign = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); sign.position.set(4.2, 3.4, 21.3); sign.rotation.y = Math.PI; H.sc.object3D.add(sign);
    var hit = document.createElement('a-entity'); hit.setAttribute('class', 'clickable'); hit.setObject3D('mesh', H.invisibleBox(1.4, 3.2, 1.2)); hit.object3D.position.set(4.2, 1.6, 20.6); hit.addEventListener('click', brokerMenu); H.sc.appendChild(hit);
  }
  var brokerNPC = null;
  function brokerMenu() {
    var B = todays(), st = bstate(), el = div('hg-broker', 'panel'); el.style.display = 'block'; document.body.classList.add('reading');
    H.alienSay(4.2, 20.6, 'growl', true);
    var desc = '<b>' + B.name + '</b> — wanted for ' + B.crime + '.<br>Look for ' + CRESTS[B.crest] + ' and <b>' + B.eye + ' eyes</b>. Somewhere on the deck tonight.';
    el.innerHTML = '<h2>BOUNTY BROKER</h2><p class="say">“One name a day, Captain. Bring them to me, I pay. No questions.”</p><p>' + (st.done ? 'Today’s bounty is claimed. Come back tomorrow.' : desc + '<br>Reward <b>' + B.reward + ' cr</b>') + '</p>';
    if (!st.done && !st.accepted) { var b = document.createElement('button'); b.textContent = 'Take the contract'; b.onclick = function () { st.accepted = true; save('wf-bounty', st); spawnTarget(); el.style.display = 'none'; document.body.classList.remove('reading'); L().toast('Find ' + B.name + ': ' + CRESTS[B.crest] + ', ' + B.eye + ' eyes. Talk to them.'); }; el.appendChild(b); }
    var x = document.createElement('button'); x.className = 'close'; x.textContent = 'Close'; x.onclick = function () { el.style.display = 'none'; document.body.classList.remove('reading'); }; el.appendChild(x);
  }
  function tapNPC(e) { if (brawl && brawl.pair.indexOf(e) >= 0) { brawlMenu(e); return; } if (H.talkTo) H.talkTo(e); }

  // talk hook: extra lines in a K'Vetar conversation
  function talkHook(e, list) {
    if (brawl && brawl.pair.indexOf(e) >= 0) { setTimeout(function () { H.closeP('talk'); brawlMenu(e); }, 0); return; }
    var B = todays(), st = bstate();
    if (e.bounty && st.accepted && !st.done) {
      var b = document.createElement('button'); b.textContent = '“' + B.name + '. You’re coming with me.”'; b.style.borderColor = '#ff6a4a';
      b.onclick = function () { H.closeP('talk'); startFight(e, { hp: 5, title: 'BOUNTY: ' + B.name.toUpperCase(), name: B.name, onEnd: function (won) {
        if (won) { st.done = true; save('wf-bounty', st); L().add(B.reward, 'Bounty claimed: ' + B.name); L().event('bounty'); target = null; e.model.visible = false; e.hit.object3D.visible = false; e.a.p = [999, 999]; e.a.wait = 1e9; H.alienSay(4.2, 20.6, 'chitter', true); }
        else L().toast(B.name + ' shoves you down and melts into the crowd…'); } }); };
      list.insertBefore(b, list.firstChild);
    }
    if (/soldier|general/.test(e.caste) && !e.bounty) { var f = document.createElement('button'); f.textContent = 'Fancy a fight?'; f.onclick = function () { H.closeP('talk'); startFight(e); }; list.appendChild(f); }
  }

  // ────────────────────────── per-frame ──────────────────────────
  var dancePrompt = false, started = false;
  AFRAME.registerComponent('wf-hive-games', {
    tick: function (t, dtm) {
      H = window.HIVE; if (!H || !H.NPCS) return; var dt = Math.min(dtm || 16, 60) / 1000;
      if (!started && H.male && H.CROWD) { started = true; broker(); spawnTarget(); }
      if (brokerNPC) brokerNPC.mixer.update(dt);
      var p = camP(), on = p.x > DZ.x0 && p.x < DZ.x1 && p.z > DZ.z0 && p.z < DZ.z1;
      if (!danceBtn) { danceBtn = document.createElement('button'); danceBtn.className = 'hg-btn'; danceBtn.textContent = '💃 DANCE'; document.body.appendChild(danceBtn); stop(danceBtn); danceBtn.onclick = startDance; }
      danceBtn.style.display = on && !dance && !fight ? 'block' : 'none';
      if (dance) danceTick();
      if (fight) fightTick(dt);
      if (brawl) brawlTick(dt); else if (!fight && !dance) { nextBrawl -= dt; if (nextBrawl < 0) { startBrawl(); if (!brawl) nextBrawl = 30; } }
    }
  });
  function attach() { var s = document.querySelector('a-scene'); if (s && !s.hasAttribute('wf-hive-games')) s.setAttribute('wf-hive-games', ''); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
  // gambling consoles: tap targets over the six gaming consoles
  function consoles() {
    var sc = document.querySelector('a-scene'); if (!sc || !window.HIVE) return setTimeout(consoles, 500);
    CONSOLES.forEach(function (c) { var h = document.createElement('a-entity'); h.setAttribute('class', 'clickable'); h.setObject3D('mesh', window.HIVE.invisibleBox(2.2, 2, 1.4)); h.object3D.position.set(c[0], 1, c[1]); sc.appendChild(h);
      h.addEventListener('click', function () { var p = camP(); if (Math.hypot(p.x - c[0], p.z - c[1]) > 5) { L().toast('Walk up to the gaming consoles (east side) to play'); return; } den(); }); });
  }
  consoles();
  window.HIVE_GAMES = { _dbg: function () { return dance ? { now: beatNow(), notes: dance.notes.map(function (n) { return [n.b, n.hit]; }), beat: BEAT } : null; }, talkHook: talkHook, tapNPC: tapNPC, startBrawl: function () { startBrawl(); }, dance: function () { startDance(); }, den: den, fight: startFight, brokerMenu: brokerMenu, state: function () { return { dance: !!dance, fight: !!fight, brawl: !!brawl, target: !!target }; } };
}());
