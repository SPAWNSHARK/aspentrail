# Firefly WF-01 — Pathfinder-class mission cruiser, v1.0

Firefly is the separate, single-cabin spacecraft that docks at the lower bow of the SS Wayfarer. This update replaces Firefly only, not the mothership architecture or lower jaw.

## Files
- `models/Firefly_WF01_HD.glb`: full geometry and material detail, 119,418 instanced triangles.
- `models/Firefly_WF01_Mobile.glb`: same envelope and cabin, simplified geometry, 43,868 instanced triangles and 46 renderable mesh nodes, batched static geometry.
- `patched/Wayfarer_Dual_Deck_Assembled.glb` and `patched/Lower_Deck_Complete.glb`: replacement for the same-named files in the extracted v0.3.1 kit. Each contains exactly one reachable new mobile Firefly at the original dock anchor. Other active deck geometry is unchanged. Old orphaned geometry buffers remain but are not scene-referenced.
- `integration.mjs`: revised standalone Three.js adapter. It uses the embedded cabin rather than loading the obsolete external cabin. `showCabin(true)` hides the exterior shell and gear to expose interior furnishings. No changes to the live A-Frame site have been made.
- `patch_v031.py`: reproducible offline patcher for the original v0.3.1 GLBs; can also embed HD if desired. Never overwrites the original files.
- `build_firefly.py`: procedural source; Python dependencies: numpy, scipy, trimesh, shapely 2.1+, Pillow.
- `VALIDATION.json`: measured geometry and structural checks. `Firefly_WF01_Rebuilt_Preview.png` is a render of the actual HD model, not AI concept art.

## Install in a copy of v0.3.1
1. Keep the complete v0.3.1 archive and all original Wayfarer files. Add this update alongside them.
2. Copy both new standalone GLBs to your extracted v0.3.1 `models/` folder. If existing code expects `Firefly_Pathfinder_WF01.glb`, copy the mobile GLB to that name as well; do not instantiate both.
3. Replace the two assembled GLBs in the extracted copy's `models/` folder with the matching files from `patched/`. Replace `integration.mjs` in the extracted copy with this version.
4. Retire `Firefly_Interior.glb` for the new cruiser. Its new cabin is included in both new GLBs. Do not attach the old cabin or load a second Firefly.
5. Keep the Wayfarer jaw animation, docking anchor, lower-deck room geometry and manifest/layout/nav coordinates intact. The existing manifest predates this patch; use VALIDATION.json for updated model metadata.

## Scene contract
Y up, nose -Z, engines +Z. Provisional length 10 existing kit units, not an approved real-world length. The root `Firefly_WF01` sits at existing local jaw anchor [0, 2.36, -6]. Its landed gear touches local y=-0.56. Bow remains fixed to -Z while docked. Root children `Exterior_Shell`, `Firefly_Single_Room_Interior`, `Gear_Nose`, `Gear_Port`, `Gear_Starboard`. Anchors: `Boarding_Anchor`, `Pilot_Anchor`, `Pilot_Seat_Anchor`, `Copilot_Seat_Anchor`, `Cabin_Spawn`, `Quarantine_Anchor`, `Dock_Origin`, `Forward_Axis`.

Clips: `Landing_Gear_Deploy`, `Landing_Gear_Retract` (1.8 s each; translation + rotation); `Quarantine_Open`, `Quarantine_Close` (1.2 s). Default gear state is deployed. The aft boarding hatch is decorative, not an animated traversable portal. The quarantine compartment is compact; gameplay use needs collision/interactivity implementation.

## Limits
The two models are custom procedural assets with PBR material factors and brushed-alloy base-color/metallic-roughness textures on UV-bearing armor. Preview lighting is simplified and does not reproduce the texture maps or full PBR environment. They are not photorealistic production art. Sampled cabin vertices and stowed gear vertices fit the analytical outer hull cross-sections. This is not a swept collision test: gear may intersect other interior elements during or after retraction; the hull has no modeled gear-door openings. No launch swept-clearance, full cabin locomotion, hatch/airlock operation, WebGL/iPhone/VR performance or live integration tests have been performed. The inherited Wayfarer clearance and integration issues remain. Test before deploying.
