// SS Wayfarer — DIRT REALISM (user, Nov 26; Wayfarer Realism V9 pack → realism/src/realism.mjs + its small decal/sprite textures).
// On every interior page: dust motes in the air, a few grime / scuff / oil decals dropped onto real floor hits, boot prints while you walk
// the working decks (engine, maintenance, hangar, lower atrium), vent smoke in the Engine Room and Maintenance. The pack's footstep audio
// is NOT enabled (the avatar already plays footsteps). Quality 'low' on phones.
(function () {
  if (!window.AFRAME) return;
  var THREE = AFRAME.THREE, FILE = (location.pathname.split('/').pop() || 'index.html'), MOB = /iPhone|iPad|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
  var DIRTY = /engine|maint|firefly/.test(FILE);
  function start(sc) {
    import('./realism/src/realism.mjs?v=1').then(function (R) {
      var fx = R.createRealism({ THREE: THREE, scene: sc.object3D, quality: MOB ? 'low' : 'medium', baseURL: new URL('realism/', location.href) });
      var cam = sc.camera.el.object3D, cp = new THREE.Vector3(), down = new THREE.Vector3(0, -1, 0), ray = new THREE.Raycaster(); ray.far = 3;
      cam.getWorldPosition(cp); fx.addDustVolume({ center: new THREE.Vector3(cp.x, 1.8, cp.z - 2), size: new THREE.Vector3(8, 2.2, 8) });
      if (/engine/.test(FILE)) fx.addSmokeEmitter(new THREE.Vector3(0, 0.3, 36), { rate: 0.4, opacity: 0.08 });
      if (/maint/.test(FILE)) fx.addSmokeEmitter(new THREE.Vector3(9, 0.2, 12), { rate: 0.3, opacity: 0.07 });
      var meshes = [], scanned = -1;
      function floorHit(x, y, z) {   /* real meshes only (the pack's dust/smoke sprites can't be raycast without a camera) */
        var now = performance.now(); if (now - scanned > 2000) { scanned = now; meshes = []; sc.object3D.traverse(function (o) { if (o.isMesh && !o.isSprite && !o.isInstancedMesh && o.visible && !(o.userData && o.userData.wfPortal)) meshes.push(o); }); }
        ray.set(new THREE.Vector3(x, y + 1.2, z), down); var h = ray.intersectObjects(meshes, false).filter(function (q) { return q.face; })[0]; return h || null; }
      setTimeout(function () {   // grime: a handful of marks near where you are, on real floor hits
        var kinds = ['grime', 'scuff', 'oil_smudge', 'dust_patch', 'microbe_film'], n = DIRTY ? 14 : 7;
        for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, r = 1.5 + Math.random() * 6, h = floorHit(cp.x + Math.cos(a) * r, cp.y - 1.6, cp.z + Math.sin(a) * r);
          if (h && h.point.y < cp.y - 1.0) fx.decal(kinds[i % kinds.length], h.point, fx.worldNormal(h), { size: 0.5 + Math.random() * 0.7, opacity: 0.35 }); }
      }, 4000);
      var acc = 0, wp = new THREE.Vector3();
      AFRAME.registerComponent('wf-realism-tick', { tick: function (t, dt) { var s = Math.min(dt, 100) / 1000; fx.update(s, sc.camera); acc += s;
        if (acc > 0.12) { acc = 0; cam.getWorldPosition(wp); var lower = wp.y < -3, h = floorHit(wp.x, wp.y - 1.6, wp.z), dir = new THREE.Vector3(); cam.getWorldDirection(dir);
          if (h) fx.trackActor('player', h.point, { hit: h, grounded: true, heading: Math.atan2(-dir.x, -dir.z), dirty: DIRTY || lower, volume: 0, prints: DIRTY || lower }); } } });
      sc.setAttribute('wf-realism-tick', ''); window.WF_REALISM = fx;
    }).catch(function (e) { console.warn('realism', e); });
  }
  document.addEventListener('DOMContentLoaded', function () { var sc = document.querySelector('a-scene'); if (!sc) return; if (sc.hasLoaded) setTimeout(function () { start(sc); }, 2500); else sc.addEventListener('loaded', function () { setTimeout(function () { start(sc); }, 2500); }); });
}());
