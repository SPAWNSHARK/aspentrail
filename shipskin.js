// SS Wayfarer — clean "skin" for the sculpted ship GLBs (models/ship/*.glb).
// The kit's baked texture is scrambled noise (an AI texture atlas), which is what made the ship look blotchy. This
// throws it away and paints the hull in the shader from the model's own shape (object space, model length = 1, nose −Z):
//   copper plates with dark seams, rivet rows and per-plate tone, light verdigris and grime;
//   the Library dome (centre x 0, z 0.31, r ≈ 0.135, top of hull) as dark teal glass with bronze ribs and an inner glow;
//   a lit window strip down the spine, bridge windows in the wall under the raised forward deck, lit glass in the flank recesses.
// It also smooths the shading normals (not the shape) so the crumpled sculpt reads as panels instead of foil.
// Usage (three r128):  WAYFARER_SHIPSKIN(gltf.scene)
(function () {
  function smoothNormals(geo, passes) {
    var p = geo.attributes.position, n = geo.attributes.normal, idx = geo.index, N = p.count, key = {}, id = new Int32Array(N), K = 0;
    for (var i = 0; i < N; i++) { var k = Math.round(p.getX(i) * 2e4) + ',' + Math.round(p.getY(i) * 2e4) + ',' + Math.round(p.getZ(i) * 2e4); if (key[k] === undefined) key[k] = K++; id[i] = key[k]; }
    var acc = new Float32Array(K * 3), nb = [];
    for (i = 0; i < K; i++) nb.push([]);
    var tri = idx ? idx.array : null, T = tri ? tri.length : N;
    for (i = 0; i < T; i += 3) { var a = id[tri ? tri[i] : i], b = id[tri ? tri[i + 1] : i + 1], c = id[tri ? tri[i + 2] : i + 2]; nb[a].push(b, c); nb[b].push(a, c); nb[c].push(a, b); }
    var cur = new Float32Array(K * 3), cnt = new Float32Array(K);
    for (i = 0; i < N; i++) { var q = id[i] * 3; cur[q] += n.getX(i); cur[q + 1] += n.getY(i); cur[q + 2] += n.getZ(i); cnt[id[i]]++; }
    for (var s = 0; s < passes; s++) {
      for (i = 0; i < K; i++) { var x = cur[i * 3] * 2, y = cur[i * 3 + 1] * 2, z = cur[i * 3 + 2] * 2, L = nb[i];
        for (var j = 0; j < L.length; j++) { x += cur[L[j] * 3]; y += cur[L[j] * 3 + 1]; z += cur[L[j] * 3 + 2]; }
        var l = Math.hypot(x, y, z) || 1; acc[i * 3] = x / l; acc[i * 3 + 1] = y / l; acc[i * 3 + 2] = z / l; }
      cur.set(acc);
    }
    for (i = 0; i < N; i++) { var r = id[i] * 3; n.setXYZ(i, cur[r], cur[r + 1], cur[r + 2]); }
    n.needsUpdate = true;
  }

  var VERT_DECL = 'varying vec3 vOP; varying vec3 vON;\n';
  var FRAG = [
    'varying vec3 vOP; varying vec3 vON;',
    'float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }',
    // plate pattern on one projection plane: returns (seam, rivet, plate tone, plate id)
    'vec4 plates(vec2 uv){ vec2 g = uv * vec2(28.0, 14.0); float row = floor(g.y); g.x += mod(row, 2.0) * 0.5; vec2 c = floor(g), f = fract(g);',
    '  float seam = 1.0 - smoothstep(0.0, 0.045, min(min(f.x, 1.0 - f.x) * 0.5, min(f.y, 1.0 - f.y)));',
    '  vec2 rv = vec2(fract(f.x * 6.0), f.y); float rivet = (1.0 - smoothstep(0.1, 0.2, length((rv - vec2(0.5, 0.12)) * vec2(1.0, 2.2)))) + (1.0 - smoothstep(0.1, 0.2, length((rv - vec2(0.5, 0.88)) * vec2(1.0, 2.2))));',
    '  return vec4(seam, rivet, h21(c), h21(c + 7.0)); }',
  ].join('\n');

  // HULL PAINT (user, Nov 26 — ship upgrades): bought at the Hiveport shipwright, stored in localStorage 'wf-upgrades'.paint
  var PAINTS = { copper: [0.2, 0.07, 0.028, 0.34, 0.13, 0.05], gunmetal: [0.05, 0.055, 0.065, 0.13, 0.14, 0.16], verdigris: [0.035, 0.11, 0.085, 0.09, 0.24, 0.18],
                 gold: [0.32, 0.2, 0.035, 0.6, 0.4, 0.08], crimson: [0.17, 0.02, 0.02, 0.33, 0.045, 0.04] };
  function paintName() { try { return (JSON.parse(localStorage.getItem('wf-upgrades') || '{}').paint) || 'copper'; } catch (e) { return 'copper'; } }
  function skinMaterial(THREE) {
    var m = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.55, roughness: 0.5 });
    m.onBeforeCompile = function (sh) {
      sh.vertexShader = VERT_DECL + 'attribute float aInset; varying float vIn;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vOP = position; vON = normal; vIn = aInset;');
      var P = PAINTS[paintName()] || PAINTS.copper; sh.uniforms.uPaintA = { value: new THREE.Vector3(P[0], P[1], P[2]) }; sh.uniforms.uPaintB = { value: new THREE.Vector3(P[3], P[4], P[5]) };
      sh.fragmentShader = 'uniform vec3 uPaintA; uniform vec3 uPaintB; varying float vIn;\n' + FRAG + '\n' + sh.fragmentShader
        .replace('#include <map_fragment>', [
          'vec3 P = vOP, An = abs(normalize(vON)); An = pow(An, vec3(4.0)); An /= (An.x + An.y + An.z);',
          'vec4 pt = plates(P.zx) * An.y + plates(P.zy * vec2(1.0, 2.0)) * An.x + plates(P.xy * vec2(2.0, 2.0)) * An.z;',
          'float seam = clamp(pt.x, 0.0, 1.0), rivet = clamp(pt.y, 0.0, 1.0), tone = pt.z;',
          'float grime = vnoise(P.zx * 14.0 + P.y * 9.0) * 0.6 + vnoise(P.zx * 47.0) * 0.4, verd = smoothstep(0.62, 0.8, vnoise(P.zx * 9.0 + 31.0));',
          'vec3 cu = mix(uPaintA, uPaintB, tone);',              // hull paint (linear): copper unless bought at the Hiveport shipwright
          'cu = mix(cu, vec3(0.20, 0.32, 0.26), verd * 0.35); cu *= 0.75 + 0.35 * grime;',
          'cu = mix(cu, vec3(0.05, 0.025, 0.012), seam * 0.85); cu = mix(cu, vec3(0.55, 0.3, 0.14), rivet * 0.6);',
          // the Library dome
          'float dr = length(P.xz - vec2(0.0, 0.31)); float dome = (1.0 - smoothstep(0.128, 0.135, dr)) * step(0.06, P.y);',
          'float ang = atan(P.x, P.z - 0.31), ribs = 1.0 - smoothstep(0.0, 0.035, abs(fract(ang / 6.2832 * 8.0 + 0.5) - 0.5) * 6.2832 / 8.0 * dr * 40.0);',
          'float rings = 1.0 - smoothstep(0.0, 0.004, abs(dr - 0.085)); float hub = 1.0 - smoothstep(0.016, 0.02, dr);',
          'float frame = max(max(ribs, rings), hub); float rim = smoothstep(0.112, 0.12, dr) * dome;',
          'vec3 glass = mix(vec3(0.005, 0.03, 0.03), vec3(0.015, 0.08, 0.075), 1.0 - dr / 0.135);',
          'vec3 col = mix(cu, mix(glass, vec3(0.5, 0.28, 0.12), max(frame, rim)), dome);',
          // spine window strip
          'float spine = step(abs(P.x), 0.02) * step(-0.24, P.z) * step(P.z, 0.165) * step(0.05, P.y);',
          'float pane = step(0.18, fract((P.z + 0.24) * 26.0)) * step(abs(P.x), 0.015);',
          // BRIDGE WINDOWS (user, Nov 26, marked up on a screenshot): the curved WALL under the lip of the raised forward deck — between
          // the deck top (y ≈ 0.036) and the lower ledge (y ≈ 0.012) — wrapping the bow and running back along both flanks, cut into
          // tall panes by vertical bronze mullions (arc length round a centre at z −0.12)
          'float wallY = step(0.012, P.y) * step(P.y, 0.036) * (1.0 - smoothstep(0.75, 0.9, normalize(vON).y)) * step(P.z, -0.11);',
          'float arcS = atan(P.x, -(P.z + 0.12)) * 0.16, ca = fract(arcS / 0.028 + 0.5), e = (P.y - 0.012) / 0.024;',
          'float pe = min(min(ca, 1.0 - ca) * 0.028 / 0.0035, min(e, 1.0 - e) * 0.024 / 0.0035);',
          'float nose = wallY * smoothstep(0.7, 1.0, pe);',                       // the glass
          'float noseFrame = wallY * (1.0 - smoothstep(0.7, 1.0, pe));',           // bronze mullions, sill and header
          // SIDE WINDOWS: the sculpt's recessed openings along the flanks were painted copper and read as holes — their back faces
          // (inset from the hull envelope, facing sideways: aInset from WAYFARER_SHIPSKIN) are now lit cabin glass
          'float side = smoothstep(0.005, 0.011, vIn) * (1.0 - smoothstep(0.05, 0.07, vIn)) * smoothstep(0.55, 0.8, abs(normalize(vON).x)) * step(abs(P.y), 0.065) * step(-0.33, P.z) * step(P.z, 0.15);',
          'float sMull = step(0.12, fract(P.z * 70.0));',
          'vec3 glassC = mix(vec3(0.006, 0.014, 0.022), vec3(0.03, 0.07, 0.085), smoothstep(-0.02, 0.06, P.y));',
          'col = mix(col, mix(vec3(0.35, 0.2, 0.08), vec3(0.02, 0.06, 0.06), pane), spine);',
          'col = mix(col, vec3(0.5, 0.29, 0.13), max(noseFrame, side * (1.0 - sMull)));',
          'col = mix(col, glassC, max(nose, side * sMull));',
                    'diffuseColor.rgb *= col;',
          'vec3 shipEmit = vec3(1.0, 0.62, 0.28) * pane * spine * 2.4',
          '              + nose * (vec3(0.95, 0.5, 0.18) * 0.09 * smoothstep(0.2, 0.0, e) + vec3(0.04, 0.2, 0.24) * 0.05 * e + vec3(0.25, 0.5, 0.6) * 0.07 * (1.0 - smoothstep(0.0, 0.06, abs(ca - 0.3 - e * 0.4))))',
          '              + side * sMull * vec3(1.0, 0.6, 0.26) * (0.08 + 0.12 * step(0.5, h21(vec2(floor(P.z * 70.0), sign(P.x)))))',
          '              + vec3(0.02, 0.16, 0.15) * dome * (1.0 - max(frame, rim)) * (0.35 + 0.65 * (1.0 - dr / 0.135));',
          'float glassK = max(nose, side * sMull);',
          'float shipRough = mix(mix(mix(0.5, 0.8, seam), 0.08, max(dome * (1.0 - max(frame, rim)), max(glassK, spine * pane))), 0.3, noseFrame);',
          'float shipMetal = mix(mix(0.5, 0.15, max(dome * (1.0 - frame), max(glassK, spine))), 0.85, noseFrame);'
        ].join('\n'))
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = shipRough;')
        .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = shipMetal;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += shipEmit;');
    };
    return m;
  }

  // how far each vertex sits INSIDE the hull's side envelope (max |x| over a z×y grid, dilated one cell): > 0 on the back faces of
  // the sculpt's recessed openings, ≈ 0 on the outer skin
  function insetAttr(THREE, geo) {
    var p = geo.attributes.position, N = p.count, NZ = 220, NY = 50, Z0 = -0.52, ZS = 1.04 / NZ, Y0 = -0.11, YS = 0.22 / NY, env = new Float32Array(NZ * NY), out = new Float32Array(N), i, a, b;
    var cz = function (z) { return Math.max(0, Math.min(NZ - 1, Math.floor((z - Z0) / ZS))); }, cy = function (y) { return Math.max(0, Math.min(NY - 1, Math.floor((y - Y0) / YS))); };
    for (i = 0; i < N; i++) { var k = cz(p.getZ(i)) * NY + cy(p.getY(i)), ax = Math.abs(p.getX(i)); if (ax > env[k]) env[k] = ax; }
    var d = new Float32Array(env.length);
    for (a = 0; a < NZ; a++) for (b = 0; b < NY; b++) { var m = 0; for (var u = -1; u <= 1; u++) for (var v = -1; v <= 1; v++) { var A = a + u, B = b + v; if (A >= 0 && A < NZ && B >= 0 && B < NY) m = Math.max(m, env[A * NY + B]); } d[a * NY + b] = m; }
    for (i = 0; i < N; i++) out[i] = d[cz(p.getZ(i)) * NY + cy(p.getY(i))] - Math.abs(p.getX(i));
    return new THREE.BufferAttribute(out, 1);
  }

  window.WAYFARER_SHIPSKIN = function (root) {
    var THREE = window.THREE || (window.AFRAME && AFRAME.THREE), mat = skinMaterial(THREE);
    root.traverse(function (o) {
      if (!o.isMesh) return;
      if (o.geometry.attributes.normal) smoothNormals(o.geometry, 3);
      if (!o.geometry.attributes.aInset) o.geometry.setAttribute('aInset', insetAttr(THREE, o.geometry));
      o.material = mat;
    });
    return root;
  };
}());
