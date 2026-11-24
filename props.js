// SS Wayfarer — shared prop loader for the GLB props in models/props/ (from the user's ChatGPT asset kit, Nov 2026).
// Load after aframe.min.js.  <a-entity wf-prop="src: cat_tree; height: 1.3" position="…" rotation="…"></a-entity>
//
// The kit's props are graphite-grey with cyan accents. The style guide is walnut, bronze and amber, so every prop is
// recoloured on load by material name: hull → dark walnut, trim → bronze, brass stays brass, fabric/leather → tan,
// black → near-black brown, and the glowing 'teal' accents → amber (or kept teal with accent: teal, e.g. the Library).
// One GLB is fetched per name and cloned for repeats.
(function () {
  var THREE = AFRAME.THREE, cache = {};
  var TINT = {
    hull:    { color: 0x5a3a24, metal: 0.15, rough: 0.6 },
    trim:    { color: 0xb07840, metal: 0.8, rough: 0.38 },
    brass:   { color: 0xd8a860, metal: 0.85, rough: 0.32 },
    black:   { color: 0x1e140e, metal: 0.2, rough: 0.6 },
    wood:    { color: 0x6a4428, metal: 0.05, rough: 0.6 },
    fabric:  { color: 0xb88a5a, metal: 0.0, rough: 0.9 },
    leather: { color: 0x8a4e2a, metal: 0.05, rough: 0.5 },
    rubber:  { color: 0x2a1c14, metal: 0.0, rough: 0.85 }
  };
  function load(name) {
    if (!cache[name]) cache[name] = new Promise(function (res, rej) { new THREE.GLTFLoader().load('models/props/' + name + '.glb', function (g) { res(g.scene); }, undefined, rej); });
    return cache[name];
  }
  AFRAME.registerComponent('wf-prop', {
    schema: { src: { type: 'string' }, height: { default: 0 }, accent: { default: 'amber' } },
    init: function () {
      var self = this, d = this.data;
      load(d.src).then(function (proto) {
        var m = proto.clone(true), amber = d.accent !== 'teal';
        m.traverse(function (o) {
          if (!o.isMesh) return;
          o.material = o.material.clone();
          var mt = o.material, key = (mt.name || '').toLowerCase(), t = TINT[key];
          if (t) { mt.map = mt.map && key !== 'hull' && key !== 'trim' ? mt.map : null; mt.color.setHex(t.color); mt.metalness = t.metal; mt.roughness = t.rough; mt.metalnessMap = mt.roughnessMap = null; }
          else if (key === 'teal' && amber) { mt.color.setHex(0xffa040); mt.emissive.setHex(0xff8a20); mt.emissiveIntensity = 1.2; }
          mt.needsUpdate = true;
        });
        // sit the model on the floor, centred, and optionally scale it to a height in metres
        var box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3()), k = d.height > 0 ? d.height / size.y : 1;
        m.scale.multiplyScalar(k); box.setFromObject(m); var c = box.getCenter(new THREE.Vector3());
        m.position.set(-c.x, -box.min.y, -c.z);
        self.el.setObject3D('mesh', m);
      }).catch(function (e) { console.warn('wf-prop: could not load', d.src, e); });
    }
  });
}());
