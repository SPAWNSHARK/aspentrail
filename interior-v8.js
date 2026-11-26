// SS Wayfarer — INTERIOR RESTYLE: Architecture V8 (user, Nov 26: "the interior of both ships has to change"; exteriors, droids and the
// Captain stay copper). One shared pass on every interior page (Wayfarer rooms + the Firefly cabin), re-run while models stream in:
//   • warm copper/bronze/walnut/leather materials → V8 graphite / gunmetal / charcoal; thin trims stay copper (V8's accent line)
//   • amber/orange emissive glows → V8 white; warm lights → neutral white (same intensities), warm fog → neutral
//   • big floors / walls / ceilings (≥ 10 m²) get V8's tiled base + normal + roughness maps (arch-v8/textures; deck kind per room)
// Never touched: anything under userData.wfPortal (crew, cats, the avatar, door portals), userData.keepLook (screens, art, shelves, the
// brain), the Firefly's Exterior_Shell / Gear_*, ShaderMaterials, transparent/additive glass and effects, basic-material signage.
(function () {
  if (!window.AFRAME) return;
  var THREE = AFRAME.THREE, FILE = (location.pathname.split('/').pop() || 'index.html');
  var DECK = { 'bridge.html': 'bridge', 'lounge.html': 'lounge', 'engine.html': 'engineering', 'maint.html': 'engineering', 'firefly.html': 'engineering' }[FILE] || 'corridor';
  var BASE = 'arch-v8/textures/', TL = new THREE.TextureLoader(), cache = {};
  function tex(name, color) { if (cache[name]) return cache[name]; var t = TL.load(BASE + name + '.png'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (color) t.colorSpace = THREE.SRGBColorSpace; return (cache[name] = t); }
  function surf(kind) { return { map: tex(kind + '_base', true), normalMap: tex(kind + '_normal'), roughnessMap: tex(kind + '_rough') }; }
  var PAL = { graphite: new THREE.Color(0x30363c), gunmetal: new THREE.Color(0x505960), charcoal: new THREE.Color(0x171c21), copper: new THREE.Color(0xa66d43), white: new THREE.Color(0xe0e5eb), blue: new THREE.Color(0x92cde8), neutral: new THREE.Color(0xf0f3f7) };
  var hsl = {}, done = new WeakMap(), swapped = new WeakMap();
  function warm(c) { c.getHSL(hsl); return hsl.s > 0.18 && (hsl.h < 0.15 || hsl.h > 0.96); }
  function skip(o) { for (var q = o; q; q = q.parent) { var u = q.userData || {}; if (u.wfPortal || u.keepLook || u.v8Skip) return true; if (/^Exterior_Shell|^Gear_/.test(q.name || '')) return true; if (q.el && q.el.id === 'brain') return true; } return false; }
  function planarUV(geo, tile) {
    var p = geo.attributes.position, n = geo.attributes.normal; if (!p || !n) return;
    var uv = new Float32Array(p.count * 2);
    for (var i = 0; i < p.count; i++) { var ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (ay > 0.7) { uv[i * 2] = x / tile; uv[i * 2 + 1] = z / tile; } else if (ax > az) { uv[i * 2] = z / tile; uv[i * 2 + 1] = y / tile; } else { uv[i * 2] = x / tile; uv[i * 2 + 1] = y / tile; } }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }
  var bb = new THREE.Box3(), sz = new THREE.Vector3(), wn = new THREE.Vector3();
  function restyle(m, mesh) {
    if (!m || !(m.isMeshStandardMaterial || m.isMeshPhongMaterial || m.isMeshLambertMaterial) || m.transparent && m.opacity < 0.95 || m.blending === THREE.AdditiveBlending) return m;
    if (m.userData && (m.userData.v8Paint || m.userData.v8Tint)) { var k0 = swapped.get(m); if (k0) return k0; var p0 = m.clone(); p0.userData = { v8: true };
      if (m.userData.v8Paint) { p0.map = null; p0.color = PAL.gunmetal.clone(); p0.metalness = 0.6; p0.roughness = 0.55; } else { p0.color = new THREE.Color(0x8e979f); }   /* door frames gunmetal; leaves keep their tinted glass, metal desaturated */
      p0.needsUpdate = true; swapped.set(m, p0); return p0; }
    var canvasMap = m.map && m.map.isCanvasTexture;
    bb.setFromObject(mesh); bb.getSize(sz); var dims = [sz.x, sz.y, sz.z].sort(function (a, b) { return b - a; }), area = dims[0] * dims[1], thin = dims[1] < 0.16;
    var big = area >= 10 && !mesh.isInstancedMesh && !mesh.isSkinnedMesh;
    var emissiveWarm = m.emissive && m.emissiveIntensity > 0.05 && m.emissive.getHSL(hsl) && hsl.l > 0.08 && warm(m.emissive);
    var colourWarm = m.color && warm(m.color);
    if (!big && !emissiveWarm && !colourWarm) return m;
    if (canvasMap && !big) return m;                           // small canvas = a screen / painting / label: leave it
    var k = swapped.get(m); if (k && !big) return k;
    var n = m.clone(); n.userData = Object.assign({}, m.userData, { v8: true });
    if (big) {
      var g = mesh.geometry; if (!g.userData.v8uv) { g = mesh.geometry = g.clone(); planarUV(g, 1.6); g.userData.v8uv = true; }
      mesh.updateMatrixWorld(true); var nz = g.attributes.normal; wn.set(0, 0, 0); if (nz) { for (var i = 0; i < Math.min(nz.count, 60); i++) wn.add(new THREE.Vector3(nz.getX(i), nz.getY(i), nz.getZ(i))); wn.transformDirection(mesh.matrixWorld); }
      var kind = wn.y > 0.6 ? DECK : wn.y < -0.6 ? 'ceiling' : 'wall', S = surf(kind);
      n.map = S.map; n.normalMap = S.normalMap; n.roughnessMap = S.roughnessMap; n.normalScale = new THREE.Vector2(0.4, 0.4); n.color = new THREE.Color(0xffffff); n.metalness = 0.38; n.roughness = 0.9; if (n.envMap) n.envMapIntensity = 0.22;   /* the atrium's bright PMREM washed V8 panels out to white */
      if (n.emissiveMap) { n.emissiveMap = null; n.emissive = new THREE.Color(0x000000); }
    } else if (colourWarm) {
      m.color.getHSL(hsl); var metal = (m.metalness || 0) > 0.45;
      n.color = (thin && metal ? PAL.copper : hsl.l < 0.16 ? PAL.charcoal : metal ? PAL.gunmetal : PAL.graphite).clone(); if (n.envMap && n.envMapIntensity > 0.6) n.envMapIntensity = 0.6;
      if (canvasMap) n.map = null;
    }
    if (emissiveWarm) { n.emissive = (m.emissive.getHSL(hsl), hsl.s > 0.5 && hsl.h > 0.5 ? PAL.blue : PAL.white).clone(); }
    n.needsUpdate = true; if (!big) swapped.set(m, n); return n;
  }
  function pass() {
    var sc = document.querySelector('a-scene'); if (!sc || !sc.object3D) return;
    sc.object3D.traverse(function (o) {
      if (o.isLight) { if (done.has(o)) return; done.set(o, 1); if (o.color && warm(o.color) && !skip(o)) { o.color.copy(PAL.neutral); o.intensity *= o.isHemisphereLight ? 0.7 : 0.5; }   /* amber on walnut → white on grey reads ~2× brighter */ if (o.isHemisphereLight && o.groundColor) o.groundColor.set(0x14171b); return; }
      if (!o.isMesh || done.get(o) === o.material || skip(o)) return;   /* re-check whenever A-Frame swaps a material in */
      o.material = Array.isArray(o.material) ? o.material.map(function (m) { return restyle(m, o); }) : restyle(o.material, o); done.set(o, o.material);
    });
    if (sc.object3D.fog && warm(sc.object3D.fog.color)) sc.object3D.fog.color.set(0x0c0e11);
  }
  var n = 0; (function loop() { pass(); if (++n < 24) setTimeout(loop, n < 6 ? 500 : 1500); }());
  window.WF_V8 = { pass: pass };
}());
