// SS Wayfarer — FURNITURE UPGRADE 01 (user, Nov 26; reference/furniture-01/: README, guide, contact sheet, the pack's ES module).
// A classic-script twin of the pack's FurnitureLibrary for our A-Frame pages: loads furniture/manifest.json + furniture/models/*.glb once,
// clones per placement, keeps the pack's own V8 materials (userData.v8Skip so interior-v8.js leaves them), and leaves them SOLID for
// mobile.js's obstacle scan. Pages swap pieces in at the transforms of the old ones:  WF_FURN.place(id, {position, yaw, parent}).
(function () {
  if (!window.AFRAME) return;
  var THREE = AFRAME.THREE, man = null, cache = {};
  function manifest() { return man || (man = fetch('furniture/manifest.json?v=1').then(function (r) { return r.json(); }).then(function (m) { var d = {}; m.assets.forEach(function (a) { d[a.id] = a; }); return d; })); }
  function proto(id, rec) { return cache[id] || (cache[id] = new Promise(function (res, rej) { new THREE.GLTFLoader().load('furniture/' + rec.file + '?v=1', function (g) { res(g.scene); }, null, rej); })); }
  function place(id, o) {
    o = o || {};
    return manifest().then(function (M) { var rec = M[id]; if (!rec) throw Error('Unknown furniture ' + id);
      return proto(id, rec).then(function (p) {
        var obj = p.clone(true); obj.name = 'furniture:' + id; obj.userData.v8Skip = true; obj.userData.furnitureId = id; obj.userData.anchors = rec.anchors;
        if (o.position) obj.position.set(o.position[0], o.position[1] || 0, o.position[2]); obj.rotation.y = o.yaw || 0; if (o.scale) obj.scale.setScalar(o.scale);
        var parent = o.parent || document.querySelector('a-scene').object3D; parent.add(obj); obj.updateWorldMatrix(true, true); return obj; }); });
  }
  // swap an existing <a-entity> (e.g. a wf-prop) for a furniture piece at the same position/heading; the old one is hidden (and so not solid)
  function swapEntity(sel, id, extraYaw) {
    var el = typeof sel === 'string' ? document.querySelector(sel) : sel; if (!el) return Promise.resolve(null);
    var go = function () { var p = el.object3D.position, yaw = el.object3D.rotation.y + (extraYaw || 0); el.object3D.visible = false; el.setAttribute('visible', false); return place(id, { position: [p.x, 0, p.z], yaw: yaw }); };
    return el.hasLoaded ? go() : new Promise(function (r) { el.addEventListener('loaded', function () { r(go()); }); });
  }
  window.WF_FURN = { place: place, swapEntity: swapEntity, manifest: manifest };
}());
