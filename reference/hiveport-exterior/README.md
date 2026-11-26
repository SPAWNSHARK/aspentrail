# ARGO STATION / K’VETAR EXTERIOR • prototype v1
Add this folder next to the existing `Hiveport/` folder. Do not overwrite the interior pack. Replace the old orbital station exterior only (Orbital_Station_Assembled.glb); retain the planets, window views, NPCs and other orbital assets.

## Load in Three.js
```js
import {createArgoExterior} from './ArgoExterior/systems/three-integration.mjs';
const argo = await createArgoExterior({THREE, GLTFLoader, scene,
  base:'./ArgoExterior/', ship:wayfarerObject, // omit ship to see supplied proxy
  onState:(state)=>console.log(state)
});
argo.beginArrival();
// In your existing frame loop: argo.update(deltaSeconds);
// Once docked: argo.beginDeparture();
```
The controller takes ownership of ship pose during docking; suspend other ship movement controllers during the sequence. Host code must place the real ship in world units, +Z bow, Y up, origin at bounding-box center, and provide measured `shipEnvelope: [width,height,length]`. It does not rescale the real ship. The scripted path is 42 seconds in, 36 seconds out, with easing and doors/clamps coordinated. `spinRate` is adjustable (degrees/second); default .35. Only the upper habitation belt rotates. It is a visual rotation, not a calculation of artificial gravity. The station root must remain meter scale. If supplying a real ship with an offset origin, use a centered parent group.

## Models
- Master contains fixed spine, separate rotor, Hiveport envelope, docking shell and animated door/clamp nodes. Load it OR assemble the four modular models at identity, never both.
- Door/clamp GLB animation clips: Bay_Open, Bay_Close, Clamps_Engage, Clamps_Release. Do not run an AnimationMixer on these at the same time as the docking controller. Each clip is a one-shot with a known start pose. If playing manually, use LoopOnce and clampWhenFinished.
- Wayfarer_Scale_Proxy.glb is only a conservative bounding-scale representation, not the canonical ship or a replacement for it. It is 72.4 × 18.2 × 10.6 m (L/W/H). An earlier cutaway also used ~42.7 × 14.6 × 9.1 m. The actual ship GLB was not included in the provided archives; validate dimensions and contact offsets before shipping.
- Textures embedded in GLBs (emerald chitin base color, normal, ORM). Texture source images are provided for edits. Use an HDR environment/PMREM, tone mapping and bloom to bring out the metallic surfaces; VTK previews use material-color shading, not the complete game PBR pipeline.

## Hiveport mapping
Authoritative original `Hiveport/blueprints/layout.json` gives a 96 × 44 m footprint, floor Y=0, max Y=12, +Z entrance. Exterior registration origin is station-local [0,14,110]; entrance is [0,14,132]. The envelope surrounds it; the upper rotor bottom is ~39.8 m, above the envelope (~34.2 m). The original interior room GLB is not duplicated in this pack. Docking berth center is [0,-24,151.5]. A side lift housing and vestibule indicate the connection; they are exterior geometry only, not a traversable interior or lift implementation. The bay deck is at Y=-32.
For interior load, pass `scene: argo.interiorAnchor` to the existing `createHiveport` with a proper `base:'./Hiveport/'`; transform the player position to anchor-local coordinates before feeding the crowd system. The exterior shell can occlude the inside; use the existing interior as a separate scene or configure an interior camera/layer and shell visibility. The original open-top room geometry remains unchanged. Scene transition and physical transfer corridor/airlocks are host tasks.

## Checks and limits
Master static bounds approximately 337 W × 305 H × 341 D m. Dock door opening 34 × 20 m; conservative travel corridor 26 × 20 × 100 m accounts for clamp housing. Actual collision shapes, docking latch/landing gear alignment, live game performance and browser rendering are not validated. The clamp stroke is an illustrative mechanical action, not a verified hull-contact simulation. The timeline tests are pure Node assertions, not a physics test. The visual design is a procedural, PBR-equipped prototype rather than a photorealistic hand-sculpted production model; roof, walls, doors and lift need a final art/physics pass. The hull has decorative structural seams, not modeled mechanical pressure seals.
