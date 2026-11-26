// SS Wayfarer — contracts, credits and rank, shared by the Hiveport's job board (station.html) and Flight Mode (minigame.html).
// Everything lives in localStorage, so progress survives between visits. Plain JS, no three.js.
//   WF_MISSIONS.offers()          → today's three contracts (stable for the day)
//   WF_MISSIONS.accept(offer)     WF_MISSIONS.active()   WF_MISSIONS.abandon()
//   WF_MISSIONS.progress(kind, n) → Flight Mode reports events: 'kill:drone' | 'kill:striker' | 'kill:brute' | 'kill:carrier' |
//                                   'visit:<PLANET>' | 'dock'. Returns { done, text } when something changed.
//   WF_MISSIONS.credits()  WF_MISSIONS.rank()
(function () {
  var PLANETS = ['VARKESH', 'AURALIS', 'ORINTH', 'CRYOVALE', 'PYRAXIS', 'MYCELION', 'NYXARA', 'FERRUM PRIME', 'THALASSA', 'VESPERA', 'SELENITE', 'KHARON FRACTURE'];
  var RANKS = [[0, 'Ensign'], [600, 'Lieutenant'], [1800, 'Lt. Commander'], [4000, 'Commander'], [8000, 'Captain'], [15000, 'Commodore']];
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  function offers() {
    var day = Math.floor(Date.now() / 86400000), r = rng(day * 7919 + 13), out = [], used = {};
    function pick() { var p; do { p = PLANETS[1 + Math.floor(r() * (PLANETS.length - 1))]; } while (used[p]); used[p] = 1; return p; }
    var n = 4 + Math.floor(r() * 5), kind = r() < 0.5 ? 'drone' : 'striker';
    out.push({ id: 'bounty-' + day, type: 'bounty', title: 'Bounty: ' + (kind === 'drone' ? 'drone swarm' : 'striker raiders'), need: 'combat',
      text: 'Raiders are hitting the trade lanes. Destroy ' + n + ' ' + kind + 's.', goal: n, target: kind, reward: n * (kind === 'drone' ? 60 : 110) });
    var p = pick();
    out.push({ id: 'survey-' + day, type: 'survey', title: 'Survey: ' + p, need: 'any',
      text: 'The Hiveport\'s cartographers want fresh scans. Warp to ' + p + ' and fly in close.', goal: 1, target: p, reward: 250 + Math.floor(r() * 150) });
    var q = pick();
    if (r() < 0.5) out.push({ id: 'courier-' + day, type: 'courier', title: 'Courier: medical crates to ' + q, need: 'any',
      text: 'Deliver crates to the outpost at ' + q + ', then dock back at the Hiveport to get paid.', goal: 2, target: q, reward: 450, stage: 0 });
    else out.push({ id: 'boss-' + day, type: 'boss', title: 'Contract: bring down a Bioship', need: 'combat',
      text: 'An organic carrier is preying on haulers. Survive to wave 3 and destroy it.', goal: 1, target: 'carrier', reward: 1500 });
    return out;
  }
  function active() { return load('wf-mission', null); }
  function accept(o) { var m = JSON.parse(JSON.stringify(o)); m.progress = 0; m.stage = 0; save('wf-mission', m); return m; }
  function abandon() { save('wf-mission', null); }
  function credits() { return load('wf-credits', 0); }
  function rank(c) { c = c == null ? credits() : c; var name = RANKS[0][1], next = null; for (var i = 0; i < RANKS.length; i++) { if (c >= RANKS[i][0]) name = RANKS[i][1]; else { next = RANKS[i]; break; } } return { name: name, next: next }; }
  function pay(m) { var c = credits() + m.reward; save('wf-credits', c); var done = load('wf-done', []); done.push(m.id); save('wf-done', done.slice(-50)); save('wf-mission', null); return c; }
  function isDone(id) { return load('wf-done', []).indexOf(id) >= 0; }
  function status(m) {
    if (!m) return '';
    if (m.type === 'bounty') return m.title + ' · ' + m.progress + '/' + m.goal;
    if (m.type === 'survey') return m.title + ' · warp there (NAV) and fly in close';
    if (m.type === 'courier') return m.stage ? 'Courier · return and DOCK at the Hiveport' : m.title + ' · fly close to deliver';
    if (m.type === 'boss') return m.title + ' · reach wave 3';
    return m.title;
  }
  function progress(ev) {
    var m = active(); if (!m) return null; var hit = false;
    if (m.type === 'bounty' && ev === 'kill:' + m.target) { m.progress++; hit = true; }
    if (m.type === 'boss' && ev === 'kill:carrier') { m.progress = 1; hit = true; }
    if (m.type === 'survey' && ev === 'visit:' + m.target) { m.progress = 1; hit = true; }
    if (m.type === 'courier' && m.stage === 0 && ev === 'visit:' + m.target) { m.stage = 1; save('wf-mission', m); return { done: false, text: 'Crates delivered to ' + m.target + '. Return to the Hiveport and dock.' }; }
    if (m.type === 'courier' && m.stage === 1 && ev === 'dock') { m.progress = 2; hit = true; }
    if (!hit) return null;
    if (m.progress >= m.goal) { var c = pay(m); return { done: true, text: 'CONTRACT COMPLETE  +' + m.reward + ' cr  ·  ' + rank(c).name, credits: c }; }
    save('wf-mission', m); return { done: false, text: status(m) };
  }
  window.WF_MISSIONS = { offers: offers, active: active, accept: accept, abandon: abandon, progress: progress, credits: credits, rank: rank, status: status, isDone: isDone };
}());
