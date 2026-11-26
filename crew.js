// SS Wayfarer — LIVING CREW (user, Nov 26: "the droids upgrade"; kit = SS_Wayfarer_Living_Crew_Expansion.zip, guide in
// reference/living-crew/). Six specialist droids with home chairs on the Bridge and a satellite console somewhere else on the
// ship, plus four cats who roam. Load AFTER mobile.js / door.js on every A-Frame room page; it attaches itself to the scene.
//
// The kit's engine (crew/crew-engine.mjs, vendored unchanged) wants ONE continuous scene; our ship is six pages. So:
//  · one SHIP GRAPH for the whole ship. Each node is authored in its own room's local metres; the engine sees them shifted by
//    OFF[room] × 100 m so rooms never overlap (no phantom collisions / chats between rooms).
//  · a doorway is a door edge between a room's door node and the corridor's door node (`xfer`). Crossing one: wait for that
//    door to open (the real door.js door on this page, if it has one), walk into the doorway, vanish for 1.4 s, appear on the
//    other side. Doors not on this page count as open.
//  · the whole crew simulates on every page, but only the ones standing in THIS room are loaded/drawn (lazy GLB loads).
//  · state is saved to localStorage 'wf-crew' (every 4 s + on pagehide) and restored exactly — a droid half way down the
//    corridor is still there when you step out of a room. Nothing runs while the app is closed (kit rule: no offline sim).
// Player: tap a droid within 2.3 m → conversation (glass panel, walking frozen, view turns to them); tap a cat → it purrs.
// You can't walk through them (WAYFARER.dynSolids → mobile.js); bumping one makes it yield / a cat skip away.
(function () {
  if (!window.AFRAME) return;
  var FILE = (location.pathname.split('/').pop() || 'index.html').replace(/\?.*$/, '');
  var PAGE = { '': 'corridor', 'index.html': 'corridor', 'bridge.html': 'bridge', 'holodeck.html': 'holodeck', 'lounge.html': 'lounge', 'media.html': 'media', 'library.html': 'library' }[FILE];
  if (!PAGE) return;
  var CAPTURE = /[?&]capture/.test(location.search);                   // portal photo captures: the consoles, but never the crew
  var THREE = AFRAME.THREE, W = window.WAYFARER = window.WAYFARER || {};
  var OFF = { corridor: 0, bridge: 1, holodeck: 2, lounge: 3, media: 4, library: 5 };
  var KEY = 'wf-crew', VER = 2;

  // ───────────────────────── the ship graph (room-local metres; +x starboard on room pages, corridor = world) ─────────────────────────
  // Door frames (door.js PORTALS): corridor side bridge (0,12.5) · library (0,−12.5) · holodeck (−2.5,6) · lounge (2.5,4) · media (2.5,−4);
  // room side every exit door at x 0 on the +z wall: bridge z 7.85, library 10.65, holodeck 8.65, lounge 8.65, media 8.85.
  // Satellite consoles (kit's proposed jobs): Navigation + Sensors → Holodeck, Engineering → corridor maintenance alcove (port wall,
  // z −6, between bookcases), Science → Library, Communications → Crew Lounge, Tactical → Media Nexus.
  var BRIDGE_ST = [ ['nav', 'Navigation', [-2.27, 1.78], [-2.97, 2.24], -57], ['eng', 'Engineering', [-3.41, -0.33], [-4.19, -0.02], -68], ['sci', 'Science', [-4.02, -2.64], [-4.85, -2.52], -82],
                    ['sen', 'Sensors', [2.27, 1.78], [2.97, 2.24], 57], ['com', 'Communications', [3.41, -0.33], [4.19, -0.02], 68], ['tac', 'Tactical', [4.02, -2.64], [4.85, -2.52], 82] ];
  function buildLayout() {
    var L = { nodes: {}, edges: [], stations: [], spots: [], gates: {} };
    function N(id, room, x, z) { L.nodes[id] = { x: x + OFF[room] * 100, y: 0, z: z, room: room, lx: x, lz: z }; }
    function E(a, b, door) { var e = { a: a, b: b }; if (door) { e.door = door; e.xfer = true; } L.edges.push(e); }
    function chain(ids) { for (var i = 1; i < ids.length; i++) E(ids[i - 1], ids[i]); }
    function spot(id, type) { L.spots.push({ node: id, room: L.nodes[id].room, type: type }); }
    function gate(id, gx, gz) { L.gates[id] = { x: gx, z: gz }; }               // which way the doorway is from a door node (unit vector)

    // CORRIDOR — centre line x 0, door approach nodes one step off each doorway
    N('c_bd', 'corridor', 0, 11.4); N('c_b', 'corridor', 0, 9.5); N('c_6', 'corridor', 0, 6); N('c_4', 'corridor', 0, 4); N('c_0', 'corridor', 0, 0);
    N('c_m4', 'corridor', 0, -4); N('c_m6', 'corridor', 0, -6); N('c_l', 'corridor', 0, -9.5); N('c_ld', 'corridor', 0, -11.4);
    N('c_hd', 'corridor', -1.5, 6); N('c_lo', 'corridor', 1.5, 4); N('c_me', 'corridor', 1.5, -4);
    chain(['c_bd', 'c_b', 'c_6', 'c_4', 'c_0', 'c_m4', 'c_m6', 'c_l', 'c_ld']); E('c_6', 'c_hd'); E('c_4', 'c_lo'); E('c_m4', 'c_me');
    gate('c_bd', 0, 1); gate('c_ld', 0, -1); gate('c_hd', -1, 0); gate('c_lo', 1, 0); gate('c_me', 1, 0);
    N('c_s1', 'corridor', 1.3, 8.0); N('c_s2', 'corridor', -1.3, 1.0); N('c_s3', 'corridor', 1.3, -1.6); N('c_s4', 'corridor', -1.2, -9.2);
    E('c_b', 'c_s1'); E('c_0', 'c_s2'); E('c_0', 'c_s3'); E('c_l', 'c_s4');
    spot('c_s1', 'explore'); spot('c_s2', 'rest'); spot('c_s3', 'explore'); spot('c_s4', 'explore');

    // BRIDGE — ring round the dais (r 2.05), the six home chairs (kit arrangement ×1.45, same as bridge.html buildStations)
    N('b_door', 'bridge', 0, 7.0); N('b_back', 'bridge', 0, 4.6); gate('b_door', 0, 1);
    var ring = [];
    for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2, id = 'b_r' + i; N(id, 'bridge', Math.sin(a) * 3.0, Math.cos(a) * 3.0); ring.push(id); }
    chain(ring.concat(['b_r0'])); chain(['b_door', 'b_back', 'b_r0']);
    BRIDGE_ST.forEach(function (st) {
      var K = 1.45, cx = -st[2][0] * K, cz = -st[2][1] * K, yaw = (st[4] + 180) * Math.PI / 180;
      var rx = Math.cos(yaw), rz = -Math.sin(yaw), sgn = (cx * rx + cz * rz) > 0 ? -1 : 1;        // step out sideways, toward the room's middle
      var sid = st[0] + '_seat', oid = st[0] + '_out';
      N(sid, 'bridge', cx, cz); N(oid, 'bridge', cx + rx * sgn * 0.85 - Math.sin(yaw) * 0.25, cz + rz * sgn * 0.85 - Math.cos(yaw) * 0.25);
      E(sid, oid);
      var best = null, bd = 1e9; ring.forEach(function (r) { var d = Math.hypot(L.nodes[r].lx - L.nodes[oid].lx, L.nodes[r].lz - L.nodes[oid].lz); if (d < bd) { bd = d; best = r; } });
      E(oid, best);
      L.stations.push({ id: st[0] + '_home', node: sid, owner: st[0], type: 'seat', yaw: yaw });
    });
    N('b_s1', 'bridge', -1.6, 5.2); N('b_s2', 'bridge', 1.7, 5.6); N('b_s3', 'bridge', 0, -4.6); N('b_s4', 'bridge', 2.4, -5.2);
    E('b_back', 'b_s1'); E('b_back', 'b_s2'); E('b_r5', 'b_s3'); E('b_s3', 'b_s4');
    spot('b_s1', 'rest'); spot('b_s2', 'explore'); spot('b_s3', 'explore'); spot('b_s4', 'explore');

    // HOLODECK (square ±9) — Navigation + Sensors consoles on the starboard wall, facing it
    N('h_door', 'holodeck', 0, 7.9); N('h_s', 'holodeck', 0, 5.2); N('h_e', 'holodeck', 4.6, 4.2); N('h_e2', 'holodeck', 5.4, 0); N('h_w', 'holodeck', -4.6, 4.2);
    N('h_w2', 'holodeck', -5.6, -0.6); N('h_n', 'holodeck', 0, -5.6); N('h_ne', 'holodeck', 3.6, -3.4);
    gate('h_door', 0, 1);
    chain(['h_door', 'h_s', 'h_e', 'h_e2', 'h_ne', 'h_n', 'h_w2', 'h_w', 'h_s']);
    N('nav_work', 'holodeck', 6.75, -2.2); N('sen_work', 'holodeck', 6.75, 2.2); E('h_e2', 'nav_work'); E('h_e2', 'sen_work');
    L.stations.push({ id: 'nav_remote', node: 'nav_work', owner: 'nav', type: 'console', yaw: Math.PI / 2, asset: 'Console_Navigation.glb', placement: { room: 'holodeck', x: 7.5, z: -2.2, yaw: 90 } });
    L.stations.push({ id: 'sen_remote', node: 'sen_work', owner: 'sen', type: 'console', yaw: Math.PI / 2, asset: 'Console_Sensors.glb', placement: { room: 'holodeck', x: 7.5, z: 2.2, yaw: 90 } });
    spot('h_w', 'explore'); spot('h_w2', 'rest'); spot('h_n', 'explore'); spot('h_ne', 'explore');

    // CREW LOUNGE — Communications console against the starboard wall
    N('l_door', 'lounge', 0, 7.9); N('l_s', 'lounge', 0, 5.4); N('l_e', 'lounge', 5.0, 5.0); N('l_e2', 'lounge', 5.5, 0.9); N('l_w', 'lounge', -5.0, 5.0);
    N('l_w2', 'lounge', -5.6, 0.4); N('l_nw', 'lounge', -4.6, -3.6); N('l_ne', 'lounge', 4.4, -3.8);
    gate('l_door', 0, 1);
    chain(['l_door', 'l_s', 'l_e', 'l_e2', 'l_ne']); chain(['l_s', 'l_w', 'l_w2', 'l_nw']);
    N('com_work', 'lounge', 6.0, -1.05); E('l_e2', 'com_work'); E('l_ne', 'com_work');
    L.stations.push({ id: 'com_remote', node: 'com_work', owner: 'com', type: 'console', yaw: 98 * Math.PI / 180, asset: 'Console_Communications.glb', placement: { room: 'lounge', x: 6.75, z: -1.15, yaw: 98 } });
    N('l_r1', 'lounge', -2.8, 4.3); N('l_r2', 'lounge', 2.6, 4.4); E('l_s', 'l_r1'); E('l_s', 'l_r2');
    spot('l_r1', 'rest'); spot('l_r2', 'rest'); spot('l_nw', 'rest'); spot('l_w2', 'rest'); spot('l_ne', 'explore'); spot('l_e', 'explore');

    // MEDIA NEXUS — Tactical console at the back, port side, facing the wall
    N('m_door', 'media', 0, 8.1); N('m_back', 'media', 0, 5.4); N('m_aisle', 'media', 0, 3.4); N('m_front', 'media', 0, -3.2); N('m_l', 'media', -3.9, 3.8); N('m_r', 'media', 3.9, 3.8);
    gate('m_door', 0, 1);
    chain(['m_door', 'm_back', 'm_aisle', 'm_front']); E('m_back', 'm_l'); E('m_back', 'm_r');
    N('tac_work', 'media', -4.3, 5.4); E('m_l', 'tac_work'); E('m_back', 'tac_work');
    L.stations.push({ id: 'tac_remote', node: 'tac_work', owner: 'tac', type: 'console', yaw: -38 * Math.PI / 180, asset: 'Console_Tactical.glb', placement: { room: 'media', x: -4.76, z: 5.99, yaw: -38 } });
    N('m_f1', 'media', -2.6, -3.6); N('m_f2', 'media', 2.6, -3.6); E('m_front', 'm_f1'); E('m_front', 'm_f2');
    spot('m_r', 'rest'); spot('m_f1', 'explore'); spot('m_f2', 'explore'); spot('m_front', 'explore');

    // THE LIBRARY — Science console on the port side, facing the shelves
    N('li_door', 'library', 0, 9.9); N('li_s', 'library', 0, 7.2); N('li_w', 'library', -3.6, 5.6); N('li_e', 'library', 3.6, 5.6); N('li_c', 'library', 0, 3.4);
    N('li_wc', 'library', -4.6, 0); N('li_ec', 'library', 4.6, 0); N('li_nw', 'library', -3.6, -4.8); N('li_ne', 'library', 3.6, -4.8); N('li_n', 'library', 0, -5.6);
    gate('li_door', 0, 1);
    chain(['li_door', 'li_s', 'li_c']); chain(['li_s', 'li_w', 'li_wc', 'li_nw', 'li_n', 'li_ne', 'li_ec', 'li_e', 'li_s']);
    N('sci_work', 'library', -5.6, 3.25); E('li_w', 'sci_work'); E('li_wc', 'sci_work');
    L.stations.push({ id: 'sci_remote', node: 'sci_work', owner: 'sci', type: 'console', yaw: -60 * Math.PI / 180, asset: 'Console_Science.glb', placement: { room: 'library', x: -6.25, z: 3.62, yaw: -60 } });
    spot('li_nw', 'rest'); spot('li_ne', 'explore'); spot('li_e', 'explore'); spot('li_n', 'explore');

    // the corridor maintenance alcove: Engineering console on the port wall between the z −3 and z −9 bookcases
    N('eng_work', 'corridor', -1.2, -6); E('c_m6', 'eng_work');
    L.stations.push({ id: 'eng_remote', node: 'eng_work', owner: 'eng', type: 'console', yaw: -Math.PI / 2, asset: 'Console_Engineering.glb', placement: { room: 'corridor', x: -1.98, z: -6, yaw: -90 } });

    // doorways (corridor door node ⇄ room door node)
    E('c_bd', 'b_door', 'bridge'); E('c_ld', 'li_door', 'library'); E('c_hd', 'h_door', 'holodeck'); E('c_lo', 'l_door', 'lounge'); E('c_me', 'm_door', 'media');

    // somewhere for a cat to sit by each satellite console while its droid works (kit: social spots 0.5–0.8 m off a standing droid)
    L.stations.filter(function (s) { return s.type === 'console'; }).forEach(function (s) {
      var p = L.nodes[s.node], id = s.id + '_visit', rx = Math.cos(s.yaw), rz = -Math.sin(s.yaw);
      N(id, p.room, p.lx + rx * 0.7 - Math.sin(s.yaw) * 0.35, p.lz + rz * 0.7 - Math.cos(s.yaw) * 0.35); E(s.node, id); spot(id, 'social');
    });
    return L;
  }
  var LAYOUT = buildLayout();
  W.crewLayout = LAYOUT;
  function roomOf(n) { var nd = LAYOUT.nodes[n.node]; return nd ? nd.room : null; }

  // ───────────────────────── page glue ─────────────────────────
  function pageDoor(id) {
    if (PAGE === 'corridor') { var ds = W.corridorDoors || []; for (var i = 0; i < ds.length; i++) if (ds[i].d && ds[i].d.id === id) return ds[i]; return null; }
    return id === PAGE ? W.roomDoor || null : null;
  }
  function toast(t) {
    var e = document.getElementById('wf-crew-toast');
    if (!e) { e = document.createElement('div'); e.id = 'wf-crew-toast'; document.body.appendChild(e); }
    e.textContent = t; e.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.opacity = 0; }, 2600);
  }
  var css = document.createElement('style');
  css.textContent =
    '#wf-crew-toast{position:fixed;left:50%;top:calc(46px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:58;padding:9px 15px;border-radius:15px;pointer-events:none;opacity:0;transition:opacity .4s;' +
      'background:rgba(28,20,12,.55);border:1px solid rgba(255,200,140,.35);color:#ffe2bf;font:600 13px -apple-system,system-ui,sans-serif;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}' +
    '#wf-crew-talk{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:57;display:none;width:min(92vw,420px);max-height:62vh;overflow:auto;padding:16px 16px 12px;border-radius:22px;' +
      'background:linear-gradient(140deg,rgba(255,255,255,.14),rgba(255,255,255,.03)),rgba(26,16,10,.58);-webkit-backdrop-filter:blur(22px) saturate(185%);backdrop-filter:blur(22px) saturate(185%);' +
      'border:1px solid rgba(255,200,140,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 16px 40px rgba(0,0,0,.5);color:#fff;font:500 14px -apple-system,system-ui,sans-serif}' +
    '#wf-crew-talk h3{font:700 12px -apple-system,system-ui,sans-serif;letter-spacing:2.5px;color:#ffc98a;margin:0 0 8px;text-transform:uppercase}' +
    '#wf-crew-talk p{margin:0 0 10px;font-size:15px;line-height:1.4;color:#fff4e6}' +
    '#wf-crew-talk .ch{display:grid;grid-template-columns:1fr 1fr;gap:6px}' +
    '#wf-crew-talk button{padding:10px 8px;border-radius:13px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font:600 12.5px -apple-system,system-ui,sans-serif;text-align:left}' +
    '#wf-crew-talk button.x{grid-column:1/-1;text-align:center;color:#e8d4bf;background:none}' +
    'body.wf-crew-talking #wf-joy,body.wf-crew-talking #room-prompt{opacity:0;pointer-events:none}';
  document.head.appendChild(css);

  // ───────────────────────── the component ─────────────────────────
  AFRAME.registerComponent('wf-crew', {
    init: function () {
      var self = this, sc = this.el;
      this.ready = false; this.objs = {}; this.hits = {}; this.loading = {}; this.want = {}; this.mix = {}; this.acts = {}; this.cur = {}; this.vis = {};
      this.tmp = new THREE.Vector3(); this.lastSave = 0; this.talk = null; this.consoleBoxes = [];
      if (CAPTURE) { var go = function () { self.placeConsoles(); }; if (sc.hasLoaded) go(); else sc.addEventListener('loaded', go); return; }
      import('./crew/crew-engine.mjs?v=1').then(function (M) { self.boot(M); }).catch(function (e) { console.warn('crew engine', e); });
      addEventListener('pagehide', function () { self.save(); });
      document.addEventListener('visibilitychange', function () { if (document.hidden) self.save(); });
    },
    boot: function (M) {
      var self = this, sc = this.el;
      class ShipCrew extends M.CrewEngine {
        player() { if (this._mv && roomOf(this._mv) !== PAGE) return null; return super.player(); }
        move(n, dt) {
          if (!n.route.length) return super.move(n, dt);
          var next = n.route[0], e = this.edge(n.node, next);
          if (e && e.xfer) {                                   // through a doorway into another room/page
            if (!this.permitted(e)) { this.abortRoute(n); return; }
            if (!n.xferAt) {
              if (this.adapter.doorState(e.door) !== 'open') { this.adapter.requestDoor(e.door, n.id); n.blocked += dt; this.set(n, 'WAIT_DOOR', 'Idle'); if (n.blocked > 12) this.abortRoute(n); return; }
              n.xferAt = this.time + 1.4; n.xferFrom = n.node; n.blocked = 0; this.set(n, 'WALK', 'Walk_InPlace');
            }
            if (this.time < n.xferAt) return;
            n.xferAt = 0; var p = this.layout.nodes[next]; n.pos = { x: p.x, y: 0, z: p.z }; n.node = next; n.route.shift(); n.bestDist = Infinity; n.progressAt = this.time; n.emergeAt = this.time + 0.9;
            var g = this.layout.gates[next]; if (g) n.yaw = Math.atan2(-g.x, -g.z);
            this.emit('room_enter', { npc: n.id, room: p.room, door: e.door });
            if (!n.route.length) this.arrive(n);
            return;
          }
          this._mv = n; try { super.move(n, dt); } finally { this._mv = null; }
        }
      }
      var saved = null; try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
      var eng = this.eng = new ShipCrew({ layout: LAYOUT, seed: (Math.random() * 4294967296) >>> 0, adapter: {
        player: function () { var c = sc.camera && sc.camera.el; if (!c) return null; c.object3D.getWorldPosition(self.tmp); return { x: self.tmp.x + OFF[PAGE] * 100, y: 0, z: self.tmp.z, radius: 0.3 }; },
        canMove: function (n, p) { return self.canMove(n, p); },
        canInteract: function (n, p) { return roomOf(n) === PAGE; },
        doorState: function (id) { var D = pageDoor(id); if (!D) return 'open'; return D.p > 0.85 ? 'open' : 'closed'; },
        requestDoor: function (id) { var D = pageDoor(id); if (D && D.target !== 1) D.open(); },
        animate: function (n, clip, o) { self.animate(n, clip, o); },
        transform: function () {},
        dialogueCamera: function (n, on) { self.cam(n, on); },
        event: function (e) { self.onEvent(e); }
      } });
      if (saved && saved.v === VER) this.restore(saved);
      this.setShip();
      // pages already running: settle the doors and loop
      this.ready = true;
      W.crew = { engine: eng, save: function () { self.save(); }, talkTo: function (id) { self.tap(id); }, layout: LAYOUT, page: PAGE };
      W.crewBump = function (id) { var t = performance.now(); if (self._bumpAt && t - self._bumpAt < 700) return; self._bumpAt = t; eng.bump(id); };
      this.placeConsoles();
    },
    setShip: function () {
      var near = null; try { near = localStorage.getItem('wf-near'); } catch (e) {}
      var nm = near ? near.charAt(0) + near.slice(1).toLowerCase() : null; if (nm && /hiveport|argo/i.test(nm)) nm = 'the Hiveport';
      this.eng.setShip({ mode: 'cruise', destination: nm, alert: false, fault: null });
    },

    // ── persistence: the full live state, so routes continue across page changes ──
    save: function () {
      if (!this.eng) return; var e = this.eng;
      var s = { v: VER, wall: Date.now(), time: e.time, seed: e.seed, ship: e.ship, locks: Array.from(e.locks.entries()), npcs: [] };
      e.npcs.forEach(function (n) {
        s.npcs.push({ id: n.id, node: n.node, pos: n.pos, yaw: n.yaw, state: n.state, clip: n.clip, until: n.until, next: n.next, route: n.route, goal: n.goal, station: n.station,
          memory: n.memory, needs: n.needs, nextSound: n.nextSound, lastSocial: n.lastSocial, xferAt: n.xferAt || 0, xferFrom: n.xferFrom || null });
      });
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (err) {}
    },
    restore: function (s) {
      var e = this.eng, ok = true;
      e.time = s.time || 0; e.seed = s.seed >>> 0 || e.seed; Object.assign(e.ship, s.ship || {});
      (s.npcs || []).forEach(function (m) { if (!LAYOUT.nodes[m.node]) ok = false; });
      if (!ok) return;                                    // the graph changed since this save: start everyone fresh at home
      e.locks = new Map(s.locks || []);
      (s.npcs || []).forEach(function (m) {
        var n = e.npcs.get(m.id); if (!n) return;
        n.node = m.node; n.pos = m.pos; n.yaw = m.yaw || 0; n.state = m.state; n.clip = null; n.until = m.until; n.next = m.next;
        n.route = (m.route || []).filter(function (id) { return LAYOUT.nodes[id]; }); n.goal = m.goal; n.station = m.station;
        n.memory = Object.assign(n.memory, m.memory || {}); n.needs = Object.assign(n.needs, m.needs || {}); n.nextSound = m.nextSound; n.lastSocial = m.lastSocial || -1000;
        n.xferAt = m.xferAt || 0; n.xferFrom = m.xferFrom; n.partner = null; n.bestDist = Infinity; n.progressAt = e.time;
        if (['SOCIAL', 'CONVERSATION', 'PLAYER_PET'].indexOf(n.state) >= 0 || (['WALK', 'WAIT_DOOR', 'YIELD'].indexOf(n.state) >= 0 && !n.route.length)) { n.state = 'IDLE'; n.next = e.time + 1; }
        if (n.state === 'STAND') n.state = 'WALK'; if (n.state === 'SIT') { n.state = 'SEATED'; n.next = e.time + 40; }
        var want = { SEATED: 'Console_Operate', WORK: 'Standing_Console', WALK: 'Walk_InPlace', REST: 'Sleep', GROOM: 'Groom', PLAY: 'Play' }[n.state] || 'Idle';
        e.set(n, n.state, want, Math.max(0, n.until - e.time), true);
      });
    },

    // ── models: loaded the first time someone is actually in this room ──
    model: function (n) {
      var self = this, id = n.id; if (this.objs[id] || this.loading[id]) return; this.loading[id] = true;
      var url = n.kind === 'cat' ? 'models/crew/Kitty_' + n.name + '.glb?v=1' : 'models/crew/Droid_' + n.role + '_Living.glb?v=1';
      new THREE.GLTFLoader().load(url, function (g) {
        var root = new THREE.Group(); root.name = 'crew_' + id; root.userData.noCollide = true; root.userData.wfPortal = true;
        g.scene.traverse(function (o) { o.userData.noCollide = true; if (o.isMesh) { o.castShadow = false; [].concat(o.material).forEach(function (m) { if (m && m.envMapIntensity !== undefined) m.envMapIntensity = 0.9; }); } });
        if (n.kind === 'cat') g.scene.scale.setScalar(0.6);
        root.add(g.scene); self.el.object3D.add(root); self.objs[id] = root; root.visible = false;
        var mx = new THREE.AnimationMixer(g.scene), acts = {}; g.animations.forEach(function (c) { acts[c.name] = mx.clipAction(c); });
        self.mix[id] = mx; self.acts[id] = acts; self.cur[id] = null;
        var w = self.want[id]; if (w) self.playClip(id, w.clip, w.loop, 0);
        if (n.kind === 'droid' && w && /Console_Operate|Standing_Console/.test(w.clip)) mx.setTime(Math.random() * 2);
        // tap target: a plain invisible box that follows them (raycasting the GLB every frame would cost too much on a phone)
        var h = document.createElement('a-entity'); h.setAttribute('class', 'interactive clickable');
        h.setObject3D('mesh', new THREE.Mesh(n.kind === 'cat' ? new THREE.BoxGeometry(0.7, 0.55, 0.7) : new THREE.BoxGeometry(0.75, 1.75, 0.75), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })));
        h.object3D.userData.noCollide = true; h.object3D.visible = false;
        h.addEventListener('click', function () { self.tap(id); }); self.el.appendChild(h); self.hits[id] = h;
      }, undefined, function () { self.loading[id] = false; });
    },
    animate: function (n, clip, o) { this.want[n.id] = { clip: clip, loop: o.loop }; if (this.acts[n.id]) this.playClip(n.id, clip, o.loop, o.fade); },
    playClip: function (id, clip, loop, fade) {
      var acts = this.acts[id], a = acts && acts[clip]; if (!a) return; var old = this.cur[id]; if (old === a) return;
      if (old) old.fadeOut(fade || 0.22);
      a.reset(); a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1); a.clampWhenFinished = !loop; a.setEffectiveWeight(1); a.fadeIn(fade || 0.22).play(); this.cur[id] = a;
    },

    // ── geometry checks for crew standing in this room (mobile.js solids: XZ boxes) ──
    canMove: function (n, p) {
      if (roomOf(n) !== PAGE) return true;
      var last = n.route.length && LAYOUT.nodes[n.route[n.route.length - 1]];          // the final metre to its own chair / console:
      if (last && n.goal && (n.goal.type === 'work' || n.goal.type === 'home') && Math.hypot(p.x - last.x, p.z - last.z) < 1.4) return true;   // a rotated console's box covers it
      var mob = this.el.components['wayfarer-mobile'], S = mob && mob.data.collide && mob.solids; if (!S || !S.length) return true;
      var ox = OFF[PAGE] * 100, r = n.radius * 0.75;
      function hit(x, z) { for (var i = 0; i < S.length; i++) { var b = S[i]; if (b[4]) continue; if (x > b[0] - r && x < b[2] + r && z > b[1] - r && z < b[3] + r) return true; } return false; }
      return !hit(p.x - ox, p.z) || hit(n.pos.x - ox, n.pos.z);     // never step INTO furniture; free to step out of a chair it sits in
    },

    // ── satellite consoles (only the one(s) in this room; Bridge home chairs/consoles are bridge.html's own) ──
    placeConsoles: function () {
      var self = this;
      LAYOUT.stations.forEach(function (s, si) {
        var P = s.placement; if (!P || P.room !== PAGE) return;
        var e = document.createElement('a-entity');
        e.setAttribute('gltf-model', 'models/deck/' + s.asset + '?v=1'); e.setAttribute('position', P.x + ' 0 ' + P.z); e.setAttribute('rotation', '0 ' + P.yaw + ' 0');
        e.addEventListener('model-loaded', function () {
          var m = e.getObject3D('mesh');
          if (W.lcars) { var lc = W.lcars({ w: 512, h: 256, seed: si * 5 + 2, layout: ['readout', 'graph', 'keys'][si % 3], label: s.asset.replace('Console_', '').slice(0, 4).toUpperCase() }); self.lcars = (self.lcars || []).concat(lc.update);
            m.traverse(function (o) { if (!o.isMesh) return; [].concat(o.material).forEach(function (mt) { if (mt && /Screen/i.test(mt.name)) { mt.map = lc.texture; mt.emissiveMap = lc.texture; mt.emissive && mt.emissive.setRGB(1, 1, 1); mt.emissiveIntensity = 1; mt.needsUpdate = true; } }); }); }
          var mob = self.el.components['wayfarer-mobile']; if (mob && mob.scanSolids && mob.data.collide) mob.scanSolids();
          else { var bb = new THREE.Box3().setFromObject(m); self.consoleBoxes.push([bb.min.x, bb.min.z, bb.max.x, bb.max.z]); }   /* corridor: no furniture scan there, so this console blocks you via dynSolids */
        });
        self.el.appendChild(e);
      });
    },

    // ── talking / petting ──
    tap: function (id) {
      if (!this.eng || this.talk) return; var n = this.eng.npcs.get(id); if (!n) return;
      var r = this.eng.interact(id);
      if (!r) { var p = this.eng.player(); if (p && Math.hypot(p.x - n.pos.x, p.z - n.pos.z) > 2.3) toast(n.kind === 'cat' ? n.name + ' is too far away to pet' : 'Walk closer to talk to ' + n.name); return; }
      if (r.kind === 'cat') { toast(n.name + (r.trust > 0.75 ? ' purrs and leans into your hand' : r.trust > 0.55 ? ' purrs' : ' lets you pet them')); this.purr(n); return; }
      this.show(r);
    },
    show: function (r) {
      var self = this, box = document.getElementById('wf-crew-talk');
      if (!box) { box = document.createElement('div'); box.id = 'wf-crew-talk'; document.body.appendChild(box); }
      box.innerHTML = ''; var h = document.createElement('h3'); h.textContent = r.name + ' · ' + r.role; var p = document.createElement('p'); p.textContent = r.line; var ch = document.createElement('div'); ch.className = 'ch';
      box.appendChild(h); box.appendChild(p); box.appendChild(ch);
      r.choices.forEach(function (c) { var b = document.createElement('button'); b.textContent = c[1]; if (c[0] === 'exit') b.className = 'x';
        b.addEventListener('click', function (ev) { ev.stopPropagation(); if (window.WF_SOUND && !WF_SOUND.muted()) WF_SOUND.beep(0);
          if (c[0] === 'exit') { self.endTalk(); return; } var nx = self.eng.dialogue(r.id, c[0]); if (nx) self.show(nx); }); ch.appendChild(b); });
      box.style.display = 'block'; this.talk = r.id; document.body.classList.add('wf-crew-talking');
    },
    endTalk: function () { var box = document.getElementById('wf-crew-talk'); if (box) box.style.display = 'none'; this.talk = null; document.body.classList.remove('wf-crew-talking'); if (this.eng) this.eng.endDialogue(); },
    cam: function (n, on) {                                     // kit hook: freeze walking and turn the view to whoever you're talking to
      if (on) { this._wasFrozen = !!W.frozen; W.frozen = true; this.face = n.id; }
      else { if (!this._wasFrozen) W.frozen = false; this.face = null; }
    },
    purr: function (n) { this.sound(n, 'purr'); },
    sound: function (n, kind) {
      if (roomOf(n) !== PAGE || !window.WF_SOUND || WF_SOUND.muted()) return;
      var pan = 0, c = this.el.camera; if (c) { var v = new THREE.Vector3(n.pos.x - OFF[PAGE] * 100, 0.5, n.pos.z).project(c); pan = Math.max(-1, Math.min(1, v.x)); }
      if (kind === 'purr') { WF_SOUND.meow(pan * 0.6); return; }
      if (kind === 'chat') { WF_SOUND.beep(pan); return; }
      WF_SOUND.meow(pan);
    },
    onEvent: function (e) {
      var n = this.eng && this.eng.npcs.get(e.npc); if (!n) return;
      if (e.type === 'cat_sound' && e.sound !== 'purr') this.sound(n, 'meow');
      if (e.type === 'crew_chat') this.sound(n, 'chat');
      if (e.type === 'room_enter' && e.room === PAGE) { var D = pageDoor(e.door); if (D && D.target !== 1) D.open(); }
    },

    tick: function (t, dtm) {
      if (!this.ready) return;
      var dt = Math.min(dtm || 16, 100) / 1000, eng = this.eng, self = this, ox = OFF[PAGE] * 100, dyn = [];
      eng.update(dt);
      if (this.lcars) this.lcars.forEach(function (f) { f(t / 1000); });
      eng.npcs.forEach(function (n) {
        var here = roomOf(n) === PAGE, o;
        if (here) self.model(n);
        o = self.objs[n.id]; if (!o) return;
        var x = n.pos.x - ox, z = n.pos.z, show = here, k;
        if (n.xferAt && here) {                               // walking into the doorway, then gone
          var g = LAYOUT.gates[n.node]; k = 1 - (n.xferAt - eng.time) / 1.4;
          if (g) { x += g.x * Math.min(1, k) * 1.3; z += g.z * Math.min(1, k) * 1.3; }
          if (k > 0.55) show = false;
        } else if (n.emergeAt && eng.time < n.emergeAt && here) {   // stepping out of the doorway
          var g2 = LAYOUT.gates[n.node]; k = (n.emergeAt - eng.time) / 0.9;
          if (g2) { x += g2.x * k * 0.9; z += g2.z * k * 0.9; }
        }
        o.visible = show;
        if (!show) { if (self.hits[n.id]) self.hits[n.id].object3D.visible = false; return; }
        o.position.set(x, 0, z);
        var dy = n.yaw - o.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));            // turn smoothly (the engine snaps)
        o.rotation.y += (Math.abs(dy) > 2.6 && n.state === 'SEATED') ? dy : dy * Math.min(1, dt * 7);
        if (self.mix[n.id]) self.mix[n.id].update(dt);
        var h = self.hits[n.id]; if (h) { h.object3D.visible = true; h.object3D.position.set(x, n.kind === 'cat' ? 0.28 : 0.9, z); }
        var r = n.radius * 0.9; dyn.push([x - r, z - r, x + r, z + r, n.id]);
      });
      W.dynSolids = this.consoleBoxes.length ? dyn.concat(this.consoleBoxes) : dyn;
      if (this.face && this.el.camera) {                         // ease the view round to the droid you're talking to
        var n = eng.npcs.get(this.face), c = this.el.camera.el, lc = c && c.components['look-controls'];
        if (n && lc && lc.yawObject) { c.object3D.getWorldPosition(this.tmp); var want = Math.atan2(-(n.pos.x - ox - this.tmp.x), -(n.pos.z - this.tmp.z)), Y = lc.yawObject.rotation, d = Math.atan2(Math.sin(want - Y.y), Math.cos(want - Y.y)); Y.y += d * Math.min(1, dt * 4); lc.pitchObject.rotation.x *= 1 - Math.min(1, dt * 3); }
      }
      if (t - this.lastSave > 4000) { this.lastSave = t; this.save(); }
    }
  });

  function attach() { var sc = document.querySelector('a-scene'); if (sc && !sc.hasAttribute('wf-crew')) sc.setAttribute('wf-crew', ''); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
}());
