// SS Wayfarer — CREW SOCIAL BEHAVIOURS on top of Crew Social Intelligence V3 (user, Nov 26: "use a single shared NPC behaviour engine").
// Everything here runs INSIDE the one CrewEngine (no second movement loop): it wraps engine.decide / arrive / update and only ever moves
// crew with the engine's own go()/set()/route planner, so personalities, trust, navigation, emergency duties and inventory are untouched.
//   • PETTING CONTACT  — every droid→cat pet (V3 sessions and legacy pairs) aligns the cat in front of the droid at hand reach (standing
//                        0.55 m, seated 0.68 m), both facing each other; purr + droid chirp at the start, 8 s sound cooldown per cat.
//   • FEEDING          — cats get hungry over time; a hungry cat reserves the Lounge bowl (engine lock 'bowl'), walks there, plays Eat;
//                        hunger only drops once the meal is finished; the bowl is released on finish, interruption or alert.
//   • COMPANIONSHIP    — a cat may curl up and Sleep beside a droid that is seated/working (its console's social spot); it Wakes and
//                        gets up when that droid leaves.
//   • FOLLOWING        — a cat that trusts you (≥ 60 %) sometimes trails the Captain around the room it's in, with hysteresis
//                        (go when > 2.6 m, stop inside 1.6 m), never through a doorway, for up to a minute.
//   • PLAY             — two rested cats in the same room play chase: the runner dashes to a free spot, the chaser follows and Pounces,
//                        the runner Rolls; three rounds, then both rest. Uses free graph spots only (furniture-safe), yields to you.
//   • EMERGENCY        — on red alert every social action is cancelled, reservations released, and cats run to the Lounge's rest spots
//                        and Crouch until it's over; droids keep their emergency duties (Droid V2 dutyRecall).
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function attachBehaviours(engine, opts = {}) {
  if (engine.behavioursV3) return engine.behavioursV3;
  const E = engine, S = opts.social || null, B = { play: null, follow: new Map(), nap: new Map(), lastSound: new Map(), log: [] };
  const roomOf = n => E.layout.nodes[n.node]?.room;
  const cats = () => [...E.npcs.values()].filter(n => n.kind === 'cat');
  const droids = () => [...E.npcs.values()].filter(n => n.kind === 'droid');
  const busy = n => n.partner || ['SOCIAL', 'CONVERSATION', 'PLAYER_PET', 'TOY', 'SIT', 'STAND'].includes(n.state) || (S && S.active.has(n.id));
  const sound = (n, kind) => { const t = B.lastSound.get(n.id) || -99; if (E.time - t < 8) return; B.lastSound.set(n.id, E.time); E.emit('cat_sound', { npc: n.id, sound: kind }); };
  const note = (s) => { B.log.push(Math.round(E.time) + ' ' + s); if (B.log.length > 40) B.log.shift(); };
  const spotsIn = (room, type) => E.layout.spots.filter(s => s.room === room && (!type || s.type === type));
  const BOWL = opts.bowlNode || 'l_bowl';

  // ── feeding ──
  function feed(n) {
    if (!E.layout.nodes[BOWL] || n.needs.hunger < 0.7 || E.ship.alert) return false;
    const o = E.locks.get('bowl'); if (o && o !== n.id) return false;
    E.locks.set('bowl', n.id); if (!E.go(n, BOWL, { type: 'feed' })) { E.locks.delete('bowl'); return false; }
    sound(n, 'meow'); note(n.id + ' heads to the bowl'); return true;
  }
  // ── nap beside a working/seated droid ──
  function nap(n) {
    if (n.needs.energy > 0.55 || E.ship.alert || E.random() > 0.45) return false;
    const here = roomOf(n), d = droids().filter(d => ['SEATED', 'WORK'].includes(d.state) && roomOf(d) === here)[0]; if (!d) return false;
    const sp = E.layout.spots.filter(s => s.room === here && (s.type === 'social' || s.type === 'rest')).sort((a, b) => dist(E.layout.nodes[a.node], d.pos) - dist(E.layout.nodes[b.node], d.pos))[0];
    if (!sp || dist(E.layout.nodes[sp.node], d.pos) > 2.2) return false;
    if (!E.go(n, sp.node, { type: 'nap', with: d.id })) return false; note(n.id + ' goes to nap beside ' + d.id); return true;
  }
  // ── follow the Captain (same room only) ──
  function follow(n) {
    if (E.ship.alert || n.memory.trust < 0.6 || E.random() > 0.35) return false;
    const p = E.player(); if (!p) return false;
    const pn = Object.entries(E.layout.nodes).filter(([id, q]) => q.room === roomOf(n)).sort((a, b) => dist(a[1], p) - dist(b[1], p))[0]; if (!pn) return false;
    B.follow.set(n.id, { until: E.time + 60, room: roomOf(n), next: 0 }); note(n.id + ' starts following the Captain'); return true;
  }
  function followTick(n, f) {
    const p = E.player(); if (!p || E.time > f.until || roomOf(n) !== f.room || E.ship.alert || busy(n)) { B.follow.delete(n.id); return; }
    if (E.time < f.next) return; f.next = E.time + 1.5;
    const d = dist(n.pos, p);
    if (d > 2.6 && !n.route.length) {
      const ring = Object.entries(E.layout.nodes).filter(([id, q]) => q.room === f.room && dist(q, p) > 1.1 && dist(q, p) < 2.4 && !/_seat|_door/.test(id)).sort((a, b) => dist(a[1], n.pos) - dist(b[1], n.pos))[0];
      if (ring) E.go(n, ring[0], { type: 'follow' });
    } else if (d < 1.6 && n.state === 'WALK') { n.route = []; n.goal = null; E.face(n, p); E.set(n, 'GROOM', E.random() < 0.5 ? 'Rub_Legs' : 'Sit', 4, false); sound(n, 'purr'); }   /* Rub_Legs = Animation Library V6 */
    else if (d < 2.6 && n.state === 'IDLE' && E.random() < 0.2) { E.face(n, p); E.set(n, 'GROOM', E.pick(['TailFlick', 'LookAround', 'Chirp']), 1.6, false); }
  }
  // ── play chase ──
  function startPlay() {
    if (B.play || E.ship.alert) return;
    const cs = cats().filter(c => c.state === 'IDLE' && !busy(c) && c.needs.energy > 0.5 && !B.follow.has(c.id));
    for (const a of cs) for (const b of cs) {
      if (a === b || roomOf(a) !== roomOf(b) || dist(a.pos, b.pos) > 5) continue;
      B.play = { chaser: a, runner: b, round: 0, phase: 'run', room: roomOf(a), until: E.time + 40 }; note(a.id + ' and ' + b.id + ' start playing chase'); playStep(); return;
    }
  }
  function endPlay(why) { const P = B.play; if (!P) return; B.play = null; [P.chaser, P.runner].forEach(c => { c.speed = c._baseSpeed || c.speed; delete c._baseSpeed; if (c.state === 'WALK') { c.route = []; c.goal = null; } E.set(c, 'IDLE', 'Idle'); c.next = E.time + E.range(4, 10); c.needs.energy = Math.max(0.15, c.needs.energy - 0.12); }); note('play ends (' + why + ')'); }
  function playStep() {
    const P = B.play; if (!P) return;
    if (P.round >= 3 || E.time > P.until) return endPlay('done');
    const free = spotsIn(P.room).filter(s => s.node !== P.runner.node && dist(E.layout.nodes[s.node], P.runner.pos) > 1.2);
    if (!free.length) return endPlay('no room');
    [P.chaser, P.runner].forEach(c => { if (!c._baseSpeed) { c._baseSpeed = c.speed; c.speed = c.speed * 1.7; } });
    const t = E.pick(free); if (!E.go(P.runner, t.node, { type: 'play', role: 'runner' })) return endPlay('blocked');
    P.phase = 'chase'; P.target = t.node; P.chaseAt = E.time + 0.45; P.nextAt = 0; sound(P.runner, 'chirp');   /* engine time, not wall clock */
  }
  // ── emergency: shelter the cats ──
  function shelter() {
    B.follow.clear(); B.nap.clear(); if (B.play) endPlay('alert'); if (E.locks.get('bowl')) E.locks.delete('bowl');
    if (S) for (const s of new Set(S.active.values())) S.cancel(s);
    const rests = E.layout.spots.filter(s => s.room === 'lounge' && s.type === 'rest');
    cats().forEach((c, i) => { if (busy(c) && c.state !== 'TOY') return; const r = rests[i % Math.max(1, rests.length)]; if (!r) return;
      c.route = []; c.goal = null; if (!E.go(c, r.node, { type: 'shelter' })) { E.set(c, 'REST', 'Crouch', 30); } });
    note('RED ALERT: cats to shelter');
  }

  // ── engine hooks ──
  const baseDecide = E.decide.bind(E);
  E.decide = function (n) {
    if (n.kind === 'cat' && !busy(n)) {
      if (E.ship.alert) { if (roomOf(n) !== 'lounge') { const r = E.pick(E.layout.spots.filter(s => s.room === 'lounge' && s.type === 'rest')); if (r && E.go(n, r.node, { type: 'shelter' })) return; } E.set(n, 'REST', 'Crouch', 20); return; }
      if (feed(n) || nap(n)) return;
      if (!B.follow.has(n.id) && follow(n)) return;
    }
    return baseDecide(n);
  };
  const baseArrive = E.arrive.bind(E);
  E.arrive = function (n) {
    const g = n.goal; baseArrive(n); if (!g) return;
    if (g.type === 'feed') { const bowl = E.layout.nodes[BOWL]; if (bowl) n.yaw = Math.atan2(0.5, 0.7);   /* the feeding station sits just past the bowl node */ E.set(n, 'GROOM', 'Eat', 5, false); n._eating = E.time + 5; }
    else if (g.type === 'nap') { const d = E.npcs.get(g.with); if (d) E.face(n, d.pos); E.set(n, 'REST', 'Sleep', E.range(30, 80)); B.nap.set(n.id, g.with); sound(n, 'purr'); }
    else if (g.type === 'shelter') { E.set(n, 'REST', 'Crouch', 25); }
    else if (g.type === 'play' && B.play) {
      const P = B.play;
      if (g.role === 'chaser') { E.face(n, P.runner.pos); E.set(n, 'PLAY', 'Pounce', 1.2, false); sound(n, 'chirp'); E.set(P.runner, 'PLAY', 'Roll', 1.4, false); P.round++; P.phase = 'pounce'; P.nextAt = E.time + 1.5; }
      else { E.set(n, 'IDLE', 'LookAround'); }
    }
  };
  const baseSetShip = E.setShip.bind(E);
  E.setShip = function (patch) { const was = E.ship.alert; baseSetShip(patch); if (E.ship.alert && !was) shelter(); };
  const baseUpdate = E.update.bind(E);
  E.update = function (dt) {
    baseUpdate(dt); if (!Number.isFinite(dt) || dt <= 0) return;
    for (const c of cats()) {
      c.needs.hunger = Math.min(1, (c.needs.hunger ?? 0.25) + 0.0008 * Math.min(dt, 0.25));
      if (c._eating && E.time >= c._eating) { c._eating = 0; c.needs.hunger = 0.05; if (E.locks.get('bowl') === c.id) E.locks.delete('bowl'); E.record(c, 'ate'); sound(c, 'purr'); note(c.id + ' ate'); }
      if (c._eating && c.state !== 'GROOM') { c._eating = 0; if (E.locks.get('bowl') === c.id) E.locks.delete('bowl'); }   // interrupted: bowl released, still hungry
      if (E.locks.get('bowl') === c.id && !c._eating && c.goal?.type !== 'feed') E.locks.delete('bowl');
      const w = B.nap.get(c.id); if (w) { const d = E.npcs.get(w); if (!d || !['SEATED', 'WORK'].includes(d.state) || roomOf(d) !== roomOf(c) || c.state !== 'REST') { B.nap.delete(c.id); if (c.state === 'REST') { E.set(c, 'GROOM', 'Wake', 1.2, false); } } }
      const f = B.follow.get(c.id); if (f) followTick(c, f);
    }
    // petting contact: cat at the droid's hand, both facing
    for (const d of droids()) {
      if (d.state !== 'SOCIAL' || !d.partner) continue; const c = E.npcs.get(d.partner); if (!c || c.kind !== 'cat' || c.state !== 'SOCIAL') continue;
      if (!d._petStart || d._petWith !== c.id) { d._petStart = E.time; d._petWith = c.id; sound(c, 'purr'); E.emit('droid_sound', { npc: d.id, sound: 'chatter' }); }
      const reach = d.socialReturn === 'SEATED' ? 0.68 : 0.55, tx = d.pos.x + Math.sin(d.yaw) * reach, tz = d.pos.z + Math.cos(d.yaw) * reach, k = Math.min(1, dt * 4);
      const nx = c.pos.x + (tx - c.pos.x) * k, nz = c.pos.z + (tz - c.pos.z) * k;
      if (!E.adapter.canMove || E.adapter.canMove(c, { x: nx, y: c.pos.y, z: nz }) !== false) { c.pos.x = nx; c.pos.z = nz; }
      E.face(c, d.pos); if (d.socialReturn !== 'SEATED') E.face(d, c.pos);
    }
    for (const d of droids()) if (d.state !== 'SOCIAL') { d._petStart = 0; d._petWith = null; }
    if (B.play && B.play.phase === 'chase' && B.play.chaseAt && E.time >= B.play.chaseAt) { const P = B.play; P.chaseAt = 0; if (!busy(P.chaser)) E.go(P.chaser, P.target, { type: 'play', role: 'chaser' }) || E.go(P.chaser, P.runner.node, { type: 'play', role: 'chaser' }); }
    if (B.play && B.play.phase === 'pounce' && E.time >= B.play.nextAt) playStep();
    if (B.play) { const P = B.play; if (E.ship.alert || roomOf(P.chaser) !== P.room || roomOf(P.runner) !== P.room || busy(P.chaser) || busy(P.runner)) endPlay('interrupted'); }
    else if (E.random() < dt * 0.01) startPlay();
  };
  E.behavioursV3 = B; B.startPlay = startPlay; B.shelter = shelter; B.follow_ = follow; B.feed = feed;
  return B;
}
