// SS Wayfarer — ONE SOURCE OF TRUTH for the aft stair shaft (Nov 28 remediation).
// atrium.js (render + walking), life.js (deck map, routes), crew.js (NPC nodes) and spawns all read these numbers.
// Ship coordinates: bow −Z, port −X, upper floor y 0, lower floor y LOW. θ is measured from +Z toward +X: x = sg·r·sinθ, z = cz + r·cosθ.
(function () {
  var S = {
    decks: { upper: 0, lower: -5.95 },
    shaft: { cx: 0, cz: 36, roofY: 3.24, wallR: 16.0, libraryWallR: 10.2, coreWallR: 9.4, mouthZ: 25.8 },
    // Built stair: ONE wide flight per side wall to wall (Library wall → shaft wall). layout.json's 1.8 m / r 11.35 was the blockout of the
    // retired Twin_Curved_Stairs GLB; with the shaft walls at 16.05 it would leave a 3.8 m open void, so the built width (5.85 m) is the truth.
    stairs: { ri: 10.2, ro: 16.05, t0: 0.41, t1: 1.92, te: 2.18, n: 34, sides: [-1, 1] },
    headroom: 2.1, bodyRadius: 0.28
  };
  S.stairs.rc = (S.stairs.ri + S.stairs.ro) / 2;
  S.stairs.rise = (S.decks.upper - S.decks.lower) / S.stairs.n;
  S.stairs.dTheta = (S.stairs.t1 - S.stairs.t0) / S.stairs.n;
  S.pt = function (sg, r, th) { return [sg * r * Math.sin(th), S.shaft.cz + r * Math.cos(th)]; };
  S.stairTop = function (sg) { return S.pt(sg, S.stairs.rc, S.stairs.t1); };     // where the flight meets the upper landing
  S.stairFoot = function (sg) { return S.pt(sg, S.stairs.rc, S.stairs.t0); };    // where it meets the lower foyer
  // floor height of the flight at (x, z); null when off the flight
  S.stairY = function (x, z) {
    var st = S.stairs, dx = x, dz = z - S.shaft.cz, r = Math.hypot(dx, dz), th = Math.atan2(Math.abs(dx), dz);
    if (r < st.ri || r > st.ro || th < st.t0 || th > st.te) return null;
    if (th >= st.t1) return S.decks.upper;
    return Math.min(S.decks.upper, S.decks.lower + st.rise + (th - st.t0) / st.dTheta * st.rise);
  };
  window.WF_SPEC = S;
})();
