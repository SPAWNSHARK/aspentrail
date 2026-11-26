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

    // CORRIDOR = the split-level ATRIUM's upper deck (Nov 26 rebuild, kit navigation.json): port + starboard walkways either side of
    // the opening (x ±3.35), fore/aft crossovers; door approach nodes one step off each doorway (bridge z −24, library z 25.8,
    // holodeck port z −14, lounge starboard z −14, media starboard z 9)
    N('c_fore', 'corridor', 0, -21.5); N('c_aft', 'corridor', 0, 23.5); N('c_bd', 'corridor', 0, -22.9); N('c_ld', 'corridor', 0, 24.7);
    N('c_p0', 'corridor', -2.45, -21); N('c_p1', 'corridor', -3.25, -18.2); N('c_hd', 'corridor', -3.5, -14); N('c_p3', 'corridor', -3.35, 0); N('c_p4', 'corridor', -3.35, 9); N('c_p5', 'corridor', -3.35, 18.4); N('c_p6', 'corridor', -2.65, 21.5); N('c_p7', 'corridor', -1.7, 23.5);
    N('c_s0', 'corridor', 2.45, -21); N('c_s1', 'corridor', 3.25, -18.2); N('c_lo', 'corridor', 3.5, -14); N('c_s3', 'corridor', 3.35, 0); N('c_me', 'corridor', 3.5, 9); N('c_s5', 'corridor', 3.35, 18.4); N('c_s6', 'corridor', 2.65, 21.5); N('c_s7', 'corridor', 1.7, 23.5);
    chain(['c_fore', 'c_p0', 'c_p1', 'c_hd', 'c_p3', 'c_p4', 'c_p5', 'c_p6', 'c_p7', 'c_aft']); chain(['c_fore', 'c_s0', 'c_s1', 'c_lo', 'c_s3', 'c_me', 'c_s5', 'c_s6', 'c_s7', 'c_aft']);
    E('c_fore', 'c_bd'); E('c_aft', 'c_ld');
    gate('c_bd', 0, -1); gate('c_ld', 0, 1); gate('c_hd', -1, 0); gate('c_lo', 1, 0); gate('c_me', 1, 0);
    N('c_x1', 'corridor', 3.4, -6); N('c_x2', 'corridor', -3.4, 5); N('c_x3', 'corridor', 3.4, 15); N('c_x4', 'corridor', -3.4, -9);
    E('c_s3', 'c_x1'); E('c_p4', 'c_x2'); E('c_s5', 'c_x3'); E('c_hd', 'c_x4');
    spot('c_x1', 'explore'); spot('c_x2', 'rest'); spot('c_x3', 'explore'); spot('c_x4', 'explore');

    // BRIDGE — ring round the dais (r 2.05), the six home chairs (kit arrangement ×1.45, same as bridge.html buildStations)
    N('b_door', 'bridge', 0, 7.0); N('b_back', 'bridge', 0, 4.6); gate('b_door', 0, 1);
    var ring = [];
    for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2, id = 'b_r' + i, rr = 3.0; N(id, 'bridge', Math.sin(a) * rr, Math.cos(a) * rr); ring.push(id); }   /* plain ring round the dais (the navigator now stands at the bow, z −6.4) */
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
    N('b_s1', 'bridge', -1.6, 5.2); N('b_s2', 'bridge', 1.7, 5.6); N('b_s3', 'bridge', -2.6, -6.0); N('b_s4', 'bridge', 2.4, -5.2);
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

    // the atrium maintenance station: Engineering console (= the Captain's Manual, labelled GUIDE) on the port wall, upper deck
    N('eng_work', 'corridor', -3.3, -3); E('c_p3', 'eng_work');
    L.stations.push({ id: 'eng_remote', node: 'eng_work', owner: 'eng', type: 'console', yaw: -Math.PI / 2, asset: 'Console_Engineering.glb', placement: { room: 'corridor', x: -4.1, z: -3, yaw: -90 } });

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
    'body.wf-crew-talking #wf-joy,body.wf-crew-talking #room-prompt{opacity:0;pointer-events:none}' +
    '#wf-redalert{position:fixed;inset:0;z-index:15;pointer-events:none;display:none;background:rgba(255,40,30,.55);mix-blend-mode:multiply;box-shadow:inset 0 0 160px 50px rgba(255,0,0,.7);animation:wfRA 1.6s ease-in-out infinite}' +
    '@keyframes wfRA{0%,100%{opacity:.45}50%{opacity:1}}' +
    '#wf-cat-menu{position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:57;display:none;width:min(94vw,440px);padding:12px 12px 10px;border-radius:20px;box-sizing:border-box;' +
      'background:linear-gradient(140deg,rgba(255,255,255,.14),rgba(255,255,255,.03)),rgba(30,16,22,.6);-webkit-backdrop-filter:blur(22px) saturate(185%);backdrop-filter:blur(22px) saturate(185%);border:1px solid rgba(255,180,210,.3);color:#fff;font:600 13px -apple-system,system-ui,sans-serif}' +
    '#wf-cat-menu h3{margin:0 0 8px;font:800 13px -apple-system,system-ui,sans-serif;letter-spacing:1px;display:flex;gap:8px;align-items:baseline}#wf-cat-menu h3 small{color:#e6c8d8;font-weight:500;flex:1}#wf-cat-menu h3 span{color:#ff8ab8;letter-spacing:2px}' +
    '#wf-cat-menu div{display:flex;flex-wrap:wrap;gap:6px}#wf-cat-menu button{flex:1 1 28%;padding:10px 6px;border-radius:13px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font:700 13px -apple-system,system-ui,sans-serif}' +
    '#wf-cat-menu button.x{flex:0 0 44px;background:none}' +
    '#wf-toy-stop{position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:57;display:none;padding:10px 20px;border-radius:18px;border:1px solid rgba(255,180,210,.45);' +
      'background:rgba(30,16,22,.55);color:#ffd6e8;font:800 12px -apple-system,system-ui,sans-serif;letter-spacing:2px;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}';
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
        decide(n) {                                          // CREW ORDERS from the Bridge override the droids' own routine
          var o = self.order && self.order.kind;
          if (n.kind === 'cat') {                             // the Lounge always keeps at least two cats (user, Nov 26)
            var eng = this, inLounge = function (c) { var last = c.route.length ? c.route[c.route.length - 1] : c.node; return eng.layout.nodes[last] && eng.layout.nodes[last].room === 'lounge'; };
            var cats = Array.from(this.npcs.values()).filter(function (c) { return c.kind === 'cat'; });
            var others = cats.filter(function (c) { return c !== n && inLounge(c); }).length;
            var here = this.layout.nodes[n.node] && this.layout.nodes[n.node].room === 'lounge';
            if (others < 2 && !here) { var rs = this.layout.spots.filter(function (q) { return q.room === 'lounge'; }); if (this.go(n, this.pick(rs).node, { type: 'rest' })) return; }
            super.decide(n);
            if (here && others < 2 && !inLounge(n)) { n.route = []; n.goal = null; this.set(n, 'GROOM', 'Groom', 2.4, false); }   // stay put
            return;
          }
          if (n.kind !== 'droid' || !o) return super.decide(n);
          if (o === 'shoreleave') {
            if (this.social(n)) return;
            var sp = this.layout.spots.filter(function (q) { return q.room === 'lounge' || q.room === 'media'; });
            this.release(n); if (this.go(n, this.pick(sp).node, { type: 'patrol' })) n.next = this.time + 25; else n.next = this.time + 6; return;
          }
          if (n.state === 'SEATED') { n.next = this.time + 20; return; }   // battle stations / red alert: stay in your chair
          if (!this.home(n)) n.next = this.time + 5;
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
      this.order = null; try { this.order = JSON.parse(localStorage.getItem('wf-order') || 'null'); } catch (e) {}
      if (this.order) this.applyOrder(this.order.kind, true);
      if (window.WF_LIFE) {
        WF_LIFE.addGoals('orders', [{ id: 'order1', text: 'Give your crew an order from the Bridge', ev: 'order', n: 1 }]);
        WF_LIFE.addTab('orders', 'ORDERS', function (box, el, rerender) { self.ordersTab(box, el, rerender); });
      }
    },
    // ── CREW ORDERS (user, Nov 26): battle stations · red alert · shore leave · stand down — given from the Bridge, obeyed shipwide ──
    ordersTab: function (box, el, rerender) {
      var self = this, cur = this.order && this.order.kind;
      var O = [['stations', '🪑 Battle stations', 'Every droid returns to its Bridge chair and stays there.'], ['redalert', '🚨 Red alert', 'Klaxons, red lights on every deck, all hands to the Bridge.'],
               ['shoreleave', '🍹 Shore leave', 'Droids knock off and hang out in the Lounge and Media Nexus.'], ['standdown', '✅ Stand down', 'Back to the normal routine.']];
      box.appendChild(el('p', 'sub', PAGE === 'bridge' ? 'Current order: <b>' + (cur ? O.filter(function (q) { return q[0] === cur; })[0][1] : 'normal duty') + '</b>' : 'Orders are given from the Command Bridge. Current: <b>' + (cur || 'normal duty') + '</b>'));
      O.forEach(function (q) {
        var b = el('div', 'goal' + (cur === q[0] || (!cur && q[0] === 'standdown') ? ' done' : ''), '<b>' + q[1] + '</b><br><span style="font-size:12px;color:#d9c4ae">' + q[2] + '</span>');
        b.style.cursor = 'pointer';
        b.onclick = function () { if (PAGE !== 'bridge') { WF_LIFE.toast('Go to the Command Bridge to give orders'); return; } self.applyOrder(q[0]); rerender(); };
        box.appendChild(b);
      });
    },
    applyOrder: function (kind, quiet) {
      var e = this.eng, self = this;
      if (kind === 'standdown') { this.order = null; try { localStorage.removeItem('wf-order'); } catch (er) {} }
      else { this.order = { kind: kind, at: Date.now() }; try { localStorage.setItem('wf-order', JSON.stringify(this.order)); } catch (er) {} }
      e.setShip({ alert: kind === 'redalert' });
      e.npcs.forEach(function (n) { if (n.kind !== 'droid' || n.state === 'CONVERSATION') return;
        if (kind === 'standdown') { n.next = Math.min(n.next, e.time + 3 + Math.random() * 8); return; }
        if (n.state === 'WORK' || n.state === 'IDLE') { e.release(n); e.set(n, 'IDLE', 'Idle'); n.next = e.time + Math.random() * 2; }
        else if (n.state === 'SEATED' && kind === 'shoreleave') n.next = e.time + Math.random() * 6; });
      var ra = document.getElementById('wf-redalert');
      if (kind === 'redalert') { if (!ra) { ra = document.createElement('div'); ra.id = 'wf-redalert'; document.body.appendChild(ra); } ra.style.display = 'block';
        if (!quiet && window.WF_SOUND) { WF_SOUND.alarm(); setTimeout(function () { if (self.order && self.order.kind === 'redalert') WF_SOUND.alarm(); }, 1600); } }
      else if (ra) ra.style.display = 'none';
      if (!quiet) {
        var msg = { stations: 'All droids to battle stations.', redalert: 'RED ALERT — all hands to the Bridge!', shoreleave: 'Shore leave granted. Enjoy yourselves, crew.', standdown: 'Standing down. Normal duty.' }[kind];
        if (window.WF_LIFE) { WF_LIFE.toast(msg); WF_LIFE.event('order'); } if (window.WF_SOUND && WF_SOUND.speak) WF_SOUND.speak(msg, 'intercom');
        var d = []; e.npcs.forEach(function (n) { if (n.kind === 'droid') d.push(n); }); d.forEach(function (n, i) { setTimeout(function () { self.sound(n, kind === 'standdown' || kind === 'shoreleave' ? 'whistle' : 'affirm'); }, 200 + i * 260); });
      }
    },
    setShip: function () {
      var near = null; try { near = localStorage.getItem('wf-near'); } catch (e) {}
      var nm = near ? near.charAt(0) + near.slice(1).toLowerCase() : null; if (nm && /hiveport/i.test(nm)) nm = 'the Hiveport';
      this.eng.setShip({ mode: 'cruise', destination: nm, alert: false, fault: null });
    },

    // ── persistence: the full live state, so routes continue across page changes ──
    save: function () {
      if (!this.eng) return; var e = this.eng;
      var s = { v: VER, wall: Date.now(), time: e.time, seed: e.seed, ship: e.ship, locks: Array.from(e.locks.entries()), npcs: [] };
      e.npcs.forEach(function (n) {
        s.npcs.push({ id: n.id, node: n.node, pos: n.pos, yaw: n.yaw, state: n.state === 'TOY' ? 'IDLE' : n.state, clip: n.clip, until: n.until, next: n.next, route: n.route, goal: n.goal, station: n.station,
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
        if (/Engineering/.test(s.asset) && P.room === 'corridor' && !CAPTURE) { e.setAttribute('class', 'clickable interactive'); e.addEventListener('click', function () { if (window.WF_MANUAL) WF_MANUAL.open(); }); }   /* the hallway console = the CAPTAIN'S MANUAL */
        if (/Science/.test(s.asset) && !CAPTURE) { e.setAttribute('class', 'clickable interactive'); e.addEventListener('click', function () { if (window.WF_WP) WF_WP.open(); else if (window.WF_LIFE) WF_LIFE.open('disc'); }); }   /* the Library console = the user's WordPress site (wp-console.js) */
        e.addEventListener('model-loaded', function () {
          var m = e.getObject3D('mesh');
          if (W.lcars) { var lc = W.lcars({ w: 512, h: 256, seed: si * 5 + 2, layout: ['readout', 'graph', 'keys'][si % 3], label: P.room === 'corridor' ? 'GUIDE' : s.asset.replace('Console_', '').slice(0, 4).toUpperCase() }); self.lcars = (self.lcars || []).concat(lc.update);
            var useTex = function (tx) { m.traverse(function (o) { if (!o.isMesh) return; [].concat(o.material).forEach(function (mt) { if (mt && /Screen/i.test(mt.name)) { mt.map = tx; mt.emissiveMap = tx; mt.emissive && mt.emissive.setRGB(1, 1, 1); mt.emissiveIntensity = 1; mt.needsUpdate = true; } }); }); };
            if (/Science/.test(s.asset) && window.WF_WP) WF_WP.screenTexture(useTex); else useTex(lc.texture); }
          var mob = self.el.components['wayfarer-mobile']; if (mob && mob.scanSolids && mob.data.collide) mob.scanSolids();
          else { e.object3D.updateMatrixWorld(true); var bb = new THREE.Box3().setFromObject(m);   /* world matrix first: computing it straight away put an invisible box in the MIDDLE of the hallway (user, Nov 26) */ self.consoleBoxes.push([bb.min.x, bb.min.z, bb.max.x, bb.max.z]); }   /* corridor: no furniture scan there, so this console blocks you via dynSolids */
        });
        self.el.appendChild(e);
      });
    },

    // ── talking / petting ──
    tap: function (id) {
      if (!this.eng || this.talk) return; var n = this.eng.npcs.get(id); if (!n) return;
      if (n.kind === 'cat') { this.catMenu(n); return; }
      var r = this.eng.interact(id);
      if (!r) { var p = this.eng.player(); if (p && Math.hypot(p.x - n.pos.x, p.z - n.pos.z) > 2.3) toast(n.kind === 'cat' ? n.name + ' is too far away to pet' : 'Walk closer to talk to ' + n.name); return; }
      if (r.kind === 'cat') { toast(n.name + (r.trust > 0.75 ? ' purrs and leans into your hand' : r.trust > 0.55 ? ' purrs' : ' lets you pet them')); this.purr(n); return; }
      this.show(r); this.say(id, 'greeting'); if (window.WF_LIFE) WF_LIFE.event('talk');
    },

    // ── LOUNGE CAT PLAY (user, Nov 26): tap a cat → Pet · Treat · Laser · Wand · Trick (trust ≥ 70 %) ──
    pdist: function (n) { var p = this.eng.player(); return p ? Math.hypot(p.x - n.pos.x, p.z - n.pos.z) : 99; },
    catMenu: function (n) {
      var self = this, L = window.WF_LIFE, box = document.getElementById('wf-cat-menu');
      if (!box) { box = document.createElement('div'); box.id = 'wf-cat-menu'; document.body.appendChild(box);
        ['pointerdown', 'touchstart', 'mousedown'].forEach(function (e) { box.addEventListener(e, function (ev) { ev.stopPropagation(); }, { passive: true }); }); }
      var tr = n.memory.trust, hearts = '♥♥♥♥♥'.slice(0, Math.max(1, Math.round(tr * 5))) + '<span style="opacity:.3">' + '♥♥♥♥♥'.slice(Math.max(1, Math.round(tr * 5))) + '</span>';
      var treats = L ? L.count('treat') : 0, opts = [['pet', '✋ Pet'], ['treat', '🐟 Treat ×' + treats], ['laser', '🔴 Laser'], ['wand', '🪶 Wand']];
      if (L && L.count('catnip')) opts.push(['catnip', '🌿 Catnip ×' + L.count('catnip')]);
      if (tr >= 0.7) opts.push(['trick', '✨ Trick']);
      box.innerHTML = '<h3>' + n.name + ' <small>' + n.personality + '</small><span>' + hearts + '</span></h3><div></div>';
      var row = box.querySelector('div');
      opts.concat([['x', '✕']]).forEach(function (o) { var b = document.createElement('button'); b.innerHTML = o[1]; if (o[0] === 'x') b.className = 'x';
        b.addEventListener('click', function (ev) { ev.stopPropagation(); box.style.display = 'none'; if (o[0] !== 'x') self.catDo(n, o[0]); }); row.appendChild(b); });
      box.style.display = 'block';
    },
    catDo: function (n, what) {
      var L = window.WF_LIFE, d = this.pdist(n), self = this;
      if (this.toy) this.stopToy();
      if (what === 'catnip') {
        if (d > 2.3) { toast('Walk closer to ' + n.name); return; }
        if (!(L && L.take('catnip'))) return; n.memory.trust = Math.min(1, n.memory.trust + 0.12);
        n.route = []; n.goal = null; this.eng.release(n); n.state = 'TOY'; this.toy = { n: n, kind: 'trick', t: 0, dur: 4 }; this.animate(n, 'Run_InPlace', { loop: true, fade: 0.15 });
        this.sound(n, 'yowl'); setTimeout(function () { self.sound(n, 'chatter'); }, 1400); toast(n.name + ' rolls in the catnip and zooms in circles! · trust ' + Math.round(n.memory.trust * 100) + '%'); if (L) L.event('catnip'); return;
      }
      if (what === 'pet' || what === 'treat' || what === 'trick') {
        if (d > 2.3) { toast('Walk closer to ' + n.name); return; }
        if (what === 'treat' && !(L && L.take('treat'))) { toast('No treats left — new ration tomorrow (and soon at the Hiveport shops)'); return; }
        var r = this.eng.interact(n.id); if (!r) return;
        var bump = what === 'treat' ? 0.06 : what === 'trick' ? 0.01 : 0; n.memory.trust = Math.min(1, n.memory.trust + bump);
        if (what === 'pet') { toast(n.name + (r.trust > 0.75 ? ' purrs and leans into your hand' : r.trust > 0.55 ? ' purrs' : ' lets you pet them')); this.purr(n); if (L) L.event('pet'); }
        if (what === 'treat') { toast(n.name + ' crunches the treat happily (' + (L ? L.count('treat') : 0) + ' left)'); this.sound(n, 'chirp'); setTimeout(function () { self.sound(n, 'purr'); }, 900); if (L) L.event('treat'); }
        if (what === 'trick') { n.state = 'TOY'; this.toy = { n: n, kind: 'trick', t: 0, dur: 1.6 }; this.animate(n, 'Play', { loop: false, fade: 0.15 }); this.sound(n, 'trill'); toast(n.name + ' does a twirl!'); if (L) L.event('trick'); }
        return;
      }
      if (d > 8) { toast(n.name + ' is too far away to see it'); return; }
      n.route = []; n.goal = null; this.eng.release(n); n.state = 'TOY';
      this.toy = { n: n, kind: what, t: 0, dur: what === 'laser' ? 22 : 14, dot: null, pounce: 0 };
      if (what === 'laser') this.makeDot(); else this.makeWand();
      toast(what === 'laser' ? 'Look around to move the dot — ' + n.name + ' is watching it…' : 'Wiggle the feather — ' + n.name + ' wants it!');
      if (L) L.event(what);
      this.toyBtn(true);
    },
    makeDot: function () {
      var g = new THREE.Group(), core = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshBasicMaterial({ color: 0xff2a2a, toneMapped: false, depthWrite: false }));
      var glow = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      [core, glow].forEach(function (m) { m.rotation.x = -Math.PI / 2; m.position.y = 0.012; g.add(m); }); g.userData.noCollide = true; this.el.object3D.add(g); this.toy.dot = g;
    },
    makeWand: function () {
      var cam = this.el.camera, g = new THREE.Group(), rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.7, 6), new THREE.MeshStandardMaterial({ color: 0xc08848, metalness: 0.7, roughness: 0.35 }));
      rod.rotation.x = -1.0; rod.position.set(0.18, -0.25, -0.45); g.add(rod);
      var str = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.5, 4), new THREE.MeshBasicMaterial({ color: 0xffe8c0 })); g.add(str);
      var fe = new THREE.Group(); [0xff6aa0, 0xffd070, 0x7fd8ff].forEach(function (c, i) { var f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 })); f.scale.set(0.5, 2.4, 0.5); f.rotation.z = (i - 1) * 0.5; f.position.y = -0.05; fe.add(f); }); g.add(fe);
      g.userData.noCollide = true; cam.add(g); this.toy.wand = { g: g, str: str, fe: fe };
    },
    toyBtn: function (on) {
      var b = document.getElementById('wf-toy-stop'), self = this;
      if (!b) { b = document.createElement('button'); b.id = 'wf-toy-stop'; b.textContent = 'STOP PLAYING'; document.body.appendChild(b);
        ['pointerdown', 'touchstart'].forEach(function (e) { b.addEventListener(e, function (ev) { ev.stopPropagation(); }, { passive: true }); });
        b.addEventListener('click', function (ev) { ev.stopPropagation(); self.stopToy(); }); }
      b.style.display = on ? 'block' : 'none';
    },
    stopToy: function () {
      var T = this.toy; if (!T) return; this.toy = null; this.toyBtn(false);
      if (T.dot) T.dot.removeFromParent(); if (T.wand) T.wand.g.removeFromParent();
      var n = T.n; if (n.state === 'TOY') { n.state = 'IDLE'; n.next = this.eng.time + 2; this.eng.set(n, 'IDLE', 'Idle'); }
      if (T.kind !== 'trick') { n.memory.trust = Math.min(1, n.memory.trust + 0.03); toast(n.name + ' had fun · trust ' + Math.round(n.memory.trust * 100) + '%'); }
    },
    toyTick: function (dt) {
      var T = this.toy; if (!T) return; var n = T.n, ox = OFF[PAGE] * 100, cam = this.el.camera; T.t += dt;
      if (roomOf(n) !== PAGE || T.t > T.dur) { this.stopToy(); return; }
      if (T.kind === 'trick') { n.yaw += dt * Math.PI * 2 / T.dur * 1.0; return; }
      var tx, tz;
      if (T.kind === 'laser') {                                   // the dot: where you're looking on the floor, with a nervous jitter
        var o = new THREE.Vector3(), dir = new THREE.Vector3(); cam.getWorldPosition(o); cam.getWorldDirection(dir);
        var dist = dir.y < -0.08 ? Math.min(7, o.y / -dir.y) : 3.5, hl = Math.hypot(dir.x, dir.z) || 1;
        tx = o.x + dir.x / hl * dist; tz = o.z + dir.z / hl * dist;
        tx += Math.sin(T.t * 23) * 0.04; tz += Math.cos(T.t * 19) * 0.04;
        var B = W.bounds, rr = Math.hypot(tx, tz), R = this.roomR();
        if (B && B.length > 2 && W.clampPoly) { var q = W.clampPoly(B, tx, tz, 0.6); if (q) { tx = q[0]; tz = q[1]; } }
        else if (R && rr > R - 0.6) { tx *= (R - 0.6) / rr; tz *= (R - 0.6) / rr; }
        if (PAGE === 'corridor') { tx = (tx < 0 ? -1 : 1) * Math.max(2.4, Math.min(4.2, Math.abs(tx))); tz = Math.max(-21, Math.min(23, tz)); }   /* atrium walkways */
        T.dot.position.set(tx, 0, tz);
      } else {                                                    // the wand: dangle in front of you, cat jumps at it
        var w = T.wand, sw = Math.sin(T.t * 3.1) * 0.12; w.fe.position.set(0.18 + sw, -0.62 - Math.abs(Math.sin(T.t * 5)) * 0.08, -0.7); w.str.position.set(0.18 + sw / 2, -0.47, -0.6);
        var c2 = new THREE.Vector3(); w.fe.getWorldPosition(c2); tx = c2.x; tz = c2.z;
        var p0 = new THREE.Vector3(); cam.getWorldPosition(p0); var ddx = tx - p0.x, ddz = tz - p0.z, dl = Math.hypot(ddx, ddz) || 1; tx = p0.x + ddx / dl * 0.75; tz = p0.z + ddz / dl * 0.75;
      }
      var px = n.pos.x - ox, pz = n.pos.z, dx = tx - px, dz = tz - pz, d = Math.hypot(dx, dz);
      if (T.pounce > 0) { T.pounce -= dt; return; }
      if (d > 0.35) {
        var sp = (T.kind === 'laser' ? 2.4 : 1.6) * (d > 1.5 ? 1 : 0.6), st = Math.min(d, sp * dt), nx = px + dx / d * st, nz = pz + dz / d * st;
        if (this.canMove(n, { x: nx + ox, z: nz }) !== false) { n.pos.x = nx + ox; n.pos.z = nz; }
        n.yaw = Math.atan2(dx, dz); this.animate(n, d > 1.2 ? 'Run_InPlace' : 'Walk_InPlace', { loop: true, fade: 0.15 });
      } else { T.pounce = 0.9; this.animate(n, 'Play', { loop: false, fade: 0.1 }); if (Math.random() < 0.5) this.sound(n, Math.random() < 0.5 ? 'chirp' : 'chatter'); n.yaw = Math.atan2(dx, dz); }
    },
    // GET OUT OF THE WAY (user, Nov 26): anyone standing/walking within 1.3 m of you steps aside (away from you and off your heading)
    dodge: function (dt) {
      var cam = this.el.camera; if (!cam || W.frozen) return; var c = cam.el.object3D, cp = this.tmp; c.getWorldPosition(cp);
      var ox = OFF[PAGE] * 100, fwd = new THREE.Vector3(); cam.getWorldDirection(fwd); var fl = Math.hypot(fwd.x, fwd.z) || 1, fx = fwd.x / fl, fz = fwd.z / fl, self = this;
      this.eng.npcs.forEach(function (n) {
        if (n._dodged > 0 && (n._dodged -= dt) <= 0) self.animate(n, n.clip || 'Idle', { loop: true, fade: 0.2 });   // back to what the engine thinks they're doing
        if (roomOf(n) !== PAGE || n.xferAt || /SEATED|SIT|STAND|WORK|CONVERSATION|TOY|SOCIAL|PLAYER_PET/.test(n.state)) return;
        var x = n.pos.x - ox, z = n.pos.z, dx = x - cp.x, dz = z - cp.z, d = Math.hypot(dx, dz); if (d > 1.3 || d < 1e-3) return;
        var side = (dx * fz - dz * fx) >= 0 ? 1 : -1, ax = dx / d * 0.6 + fz * side * 0.8, az = dz / d * 0.6 - fx * side * 0.8, al = Math.hypot(ax, az) || 1, sp = (n.kind === 'cat' ? 2.2 : 1.6) * dt;
        var p = { x: n.pos.x + ax / al * sp, y: 0, z: n.pos.z + az / al * sp };
        if (self.canMove(n, p) !== false) { n.pos.x = p.x; n.pos.z = p.z; if (n.state === 'YIELD' || n.state === 'IDLE') self.animate(n, 'Walk_InPlace', { loop: true, fade: 0.15 }); n.yaw = Math.atan2(ax, az); n._dodged = 0.6; }
      });
    },
    roomR: function () { var m = this.el.components['wayfarer-mobile']; return m && m.data.radius > 0 ? m.data.radius : 0; },
    show: function (r) {
      var self = this, box = document.getElementById('wf-crew-talk');
      if (!box) { box = document.createElement('div'); box.id = 'wf-crew-talk'; document.body.appendChild(box); }
      box.innerHTML = ''; var h = document.createElement('h3'); h.textContent = r.name + ' · ' + r.role; var p = document.createElement('p'); p.textContent = r.line; var ch = document.createElement('div'); ch.className = 'ch';
      box.appendChild(h); box.appendChild(p); box.appendChild(ch);
      r.choices.forEach(function (c) { var b = document.createElement('button'); b.textContent = c[1]; if (c[0] === 'exit') b.className = 'x';
        b.addEventListener('click', function (ev) { ev.stopPropagation(); self.say(r.id, c[0]);
          if (c[0] === 'exit') { self.endTalk(); return; } var nx = self.eng.dialogue(r.id, c[0]); if (nx) self.show(nx); }); ch.appendChild(b); });
      box.style.display = 'block'; this.talk = r.id; document.body.classList.add('wf-crew-talking'); if (window.WF_SOUND && WF_SOUND.speak) WF_SOUND.speak(r.line, 'robot');
    },
    endTalk: function () { var box = document.getElementById('wf-crew-talk'); if (box) box.style.display = 'none'; this.talk = null; document.body.classList.remove('wf-crew-talking'); if (this.eng) this.eng.endDialogue(); },
    cam: function (n, on) {                                     // kit hook: freeze walking and turn the view to whoever you're talking to
      if (on) { this._wasFrozen = !!W.frozen; W.frozen = true; this.face = n.id; }
      else { if (!this._wasFrozen) W.frozen = false; this.face = null; }
    },
    purr: function (n) { this.sound(n, 'purr'); var self = this; setTimeout(function () { self.sound(n, Math.random() < 0.5 ? 'trill' : 'chirp'); }, 1500); },
    // varied voices (user, Nov 26): sound.js droid()/cat() kinds, panned and quieter with distance; kind null = random
    sound: function (n, kind) {
      if (!n || roomOf(n) !== PAGE || !window.WF_SOUND || WF_SOUND.muted()) return;
      var pan = 0, vol = 1, c = this.el.camera, x = n.pos.x - OFF[PAGE] * 100;
      if (c) { var v = new THREE.Vector3(x, 0.5, n.pos.z).project(c); pan = Math.max(-1, Math.min(1, v.x)) * 0.8; c.el.object3D.getWorldPosition(this.tmp); vol = 1 / (1 + Math.hypot(x - this.tmp.x, n.pos.z - this.tmp.z) / 4); }
      if (n.kind === 'cat') WF_SOUND.cat(kind === 'meow' ? null : kind, pan, vol); else WF_SOUND.droid(kind, pan, vol);
    },
    say: function (id, topic) {                                   // droids answer in a voice that fits what they say
      var n = this.eng && this.eng.npcs.get(id), K = { greeting: Math.random() < 0.5 ? 'whistle' : 'affirm', status: 'chatter', destination: 'scan', crew: 'ponder', specialty: 'chatter', last_order: 'ponder', return_to_station: 'affirm', exit: 'affirm' };
      this.sound(n, K[topic] || null);
    },
    onEvent: function (e) {
      var self = this, n = this.eng && this.eng.npcs.get(e.npc); if (!n) return;
      var o = e.other && this.eng.npcs.get(e.other);
      if (e.type === 'cat_sound' && e.sound !== 'purr') this.sound(n, n.state === 'REST' ? ['chirp', 'trill', 'purr'][Math.floor(Math.random() * 3)] : null);
      if (e.type === 'crew_chat') { this.sound(n, null); setTimeout(function () { self.sound(o, null); }, 700); setTimeout(function () { self.sound(n, Math.random() < 0.5 ? 'affirm' : 'ponder'); }, 1600); }
      if (e.type === 'pet') { this.sound(o, 'purr'); setTimeout(function () { self.sound(n, 'whistle'); }, 900); }
      if (e.type === 'player_bump') this.sound(n, n.kind === 'cat' ? 'mew' : 'negative');
      if (e.type === 'room_enter' && e.room === PAGE) { var D = pageDoor(e.door); if (D && D.target !== 1) D.open(); this.sound(n, n.kind === 'cat' ? 'chirp' : 'servo'); }
    },
    // RANDOM LIGHT-SPEED ESCAPES (user, Nov 26): the shared 'wf-warp' schedule (hyperspace.js; same {until, next} the windows use).
    // 20 s before each jump: RED ALERT on every deck (#wf-redalert + klaxon), and every droid not already in its Bridge chair runs
    // (×2.6 speed) back to it. The red light holds until 6 s into the jump, then everyone goes back to work.
    warpAlert: function () {
      var now = Date.now(), w = null; try { w = JSON.parse(localStorage.getItem('wf-warp') || 'null'); } catch (e) {}
      if (!w) { w = { until: 0, next: now + (4 + Math.random() * 8) * 60000 }; try { localStorage.setItem('wf-warp', JSON.stringify(w)); } catch (e) {} }
      if (now > w.next) { w = { until: now + 75000, next: now + (7 + Math.random() * 6) * 60000, at: now }; try { localStorage.setItem('wf-warp', JSON.stringify(w)); } catch (e) {} }
      var jumpAt = w.at || (w.until - 75000), pre = now > w.next - 20000 && now < w.next, during = now >= jumpAt && now < jumpAt + 6000 && now < w.until;
      var on = (pre || during) && !(this.order && this.order.kind === 'standdown'), e = this.eng, self = this;
      var ra = document.getElementById('wf-redalert'); if (!ra) { ra = document.createElement('div'); ra.id = 'wf-redalert'; document.body.appendChild(ra); }
      var manual = this.order && this.order.kind === 'redalert';
      ra.style.display = on || manual ? 'block' : 'none';
      if (on && !this._escape) {
        this._escape = true; if (window.WF_SOUND) { WF_SOUND.alarm(); setTimeout(function () { if (self._escape) WF_SOUND.alarm(); }, 1700); }
        if (window.WF_LIFE) WF_LIFE.toast(pre ? 'RED ALERT — pirates on sensors! All hands to the Bridge, jumping to light speed…' : 'Jumping to light speed!');
        if (window.WF_SOUND && WF_SOUND.speak) setTimeout(function () { WF_SOUND.speak(pre ? 'Red alert. Pirate vessel on sensors. All hands to the Bridge. Preparing light speed jump.' : 'Engaging light speed.', 'intercom'); }, 900);
        e.setShip({ alert: true });
        e.npcs.forEach(function (n) { if (n.kind !== 'droid' || n.state === 'CONVERSATION') return; n._spd = n._spd || n.speed; n.speed = n._spd * 2.6;
          if (n.state !== 'SEATED' && n.state !== 'SIT') { e.release(n); e.set(n, 'IDLE', 'Idle'); n.next = e.time; e.home(n); } });
      } else if (!on && this._escape) {
        this._escape = false; e.setShip({ alert: !!manual });
        e.npcs.forEach(function (n) { if (n._spd) { n.speed = n._spd; n._spd = 0; } if (n.kind === 'droid' && n.state === 'SEATED') n.next = e.time + 20 + Math.random() * 40; });
      }
    },
    ambient: function (s) {                                       // now and then someone in this room makes a noise
      if (!this.eng || s < (this._amb || 3)) return; this._amb = s + 5 + Math.random() * 9;
      var here = []; this.eng.npcs.forEach(function (n) { if (roomOf(n) === PAGE && !n.xferAt) here.push(n); }); if (!here.length) return;
      var n = here[Math.floor(Math.random() * here.length)];
      if (n.kind === 'cat') { if (Math.random() < 0.45) this.sound(n, n.state === 'REST' ? 'purr' : null); return; }
      this.sound(n, n.state === 'WALK' ? 'servo' : ['chatter', 'scan', 'ponder', 'whistle', 'chatter'][Math.floor(Math.random() * 5)]);
    },

    tick: function (t, dtm) {
      if (!this.ready) return;
      var dt = Math.min(dtm || 16, 100) / 1000, eng = this.eng, self = this, ox = OFF[PAGE] * 100, dyn = [];
      eng.update(dt); this.ambient(t / 1000); this.toyTick(dt);
      if (t - (this._wa || 0) > 1000) { this._wa = t; this.warpAlert(); }
      if (this.lcars) this.lcars.forEach(function (f) { f(t / 1000); });
      this.dodge(dt);
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
        var r = n.radius * (n.kind === 'cat' ? 0.6 : 0.8); dyn.push([x - r, z - r, x + r, z + r, n.id]);
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
