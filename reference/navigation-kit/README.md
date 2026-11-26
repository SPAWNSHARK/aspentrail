# SS Wayfarer — Galactic Navigation & Command Systems

Add this folder alongside the existing assets, do not replace the original ZIPs. This extension is a development prototype based on the actual Command Deck, Orbital and Argo exterior packs. The live game source was not available. No existing game files were changed.

## Claude / developer handoff

1. Extract this ZIP. Retain existing `GLB/Planet_*.glb`, `Views/`, and `ArgoExterior/` directories at your asset base. If your actual asset structure differs, remap `data/galaxy.json` paths or supply the correct asset base (include trailing slash). Preserve all 12 existing planet IDs. `Argo_Hiveport` is a proposed new ID; alias to your existing station ID if different.
2. Use `models/Explorer_Player_Command.glb` in place of the old Explorer GLB for the **player character only**. Same mesh, skeleton, materials, Idle and Walk_InPlace, plus Sit_Down, Stand_Up and Seated_Idle. Do not spawn a second avatar. Keep movement root separate from GLTF scene (identity transform/scale on avatar recommended).
3. Use the existing assembled bridge; install the controller with `assembledBridge` to hide only the old commander and selector subtrees, retaining their exact world mounts. If using separately placed props, remove/hide the originals and pass `chairMount` and `orbMount` empty Y-up groups at their original floor positions. Chair and orb are meters, Y-up, bow +Z. Don't run chair/swivel or orb demo mixers on replacement models; this module owns them.
4. Pass the existing THREE and GLTFLoader imports; do not install a second Three.js version. Run over the game's normal local HTTP server or bundler, not `file://`. WebGL context and browser DOM are required for the galaxy overlay. No HTML deliverable is needed.
5. Call `command.update(dtSeconds)` once per animation frame, **after** the host camera and movement update. While locked, suspend movement, gravity, pointer lock, touch look, and host camera writes. `canMove` should check the player's swept collision capsule, ignoring the chair only for controlled boarding; make sure entry and exit zones are free. Pause the normal player mixer while the command system owns the player bones. Host controls must provide a standing/exit button (mobile included).
6. Connect the existing interaction raycast to `command.handleInteraction(hit.object)`. While seated, a dedicated Navigation button calls `command.openNavigation('chair')`, and Stand calls `command.stand()`. Standing orb interaction calls `command.openNavigation('orb')`. The map has mouse/touch drag, zoom buttons, system and planet list, clickable 3D markers, back and close. Escape also closes the map. A route preview uses cyan current position and a gold line; within-system transfers report zero interstellar distance.
7. Implement the actual `onTravel` callback. It must await **confirmed arrival**, or reject/return false. The module shows a charging and star-streak transit visual while it awaits the host, but does not teleport or replace your flight engine. For planets, use `destination.glb` or `destination.views.Orbit` (no baked window frame); for Argo, use the existing `ArgoExterior` station and docking controller. Do not display an orbit background for Hiveport. Update exterior/window assets only when arrival is confirmed. Supply `saveDestination` to write the ID to your existing save game.
8. Verify actual chair approach clearance, hand-to-armrest/boot-to-footrest alignment, seated camera height, player root forward, NPC clearance and accessibility on iPhone. The clips are keyframed prototypes, not motion-captured or IK solved. Adjust if the host rig was modified. Test docking and undocking in the full game before shipping. No claim of live integration or photorealistic rendering is made.

## Integration sketch (adapt existing names, do not paste as a second game)

```js
import {installCommandSystem} from './Wayfarer_Navigation/systems/command-system.mjs';
// playerGltf is loaded from models/Explorer_Player_Command.glb above.
// playerRoot is the existing movement/physics root that contains playerGltf.scene.
const command = await installCommandSystem({
  THREE, GLTFLoader, scene, camera, playerRoot, playerGltf,
  assembledBridge: bridgeGltf.scene,
  kitBase: './Wayfarer_Navigation/', assetBase: './',
  initialDestination: saveGame.currentDestination,
  audioListener: cameraAudioListener, // optional existing THREE.AudioListener
  setInputLocked: locked => setCommandInputLock(locked),
  setPlayerAnimationPaused: paused => setExistingPlayerMixerPaused(paused),
  canMove: (from, to) => sweepPlayerCapsule(from, to),
  onState: ({chair, navigation}) => updateExistingCommandButtons(chair, navigation),
  onTravel: async (destination, route) => {
    // Implement these callbacks using the real game functions, not these illustrative names.
    if (destination.id === 'Argo_Hiveport') {
      await flyToArgoAndConfirmDocked();
    } else {
      await flyToPlanetAndConfirmOrbit(destination.id, destination.glb, destination.views.Orbit);
    }
    return true;
  },
  saveDestination: id => { saveGame.currentDestination = id; persistSaveGame(); }
});
// existing frame update:
command.update(deltaSeconds);
// existing raycast interaction:
if (hit) command.handleInteraction(hit.object);
// existing seated UI: command.openNavigation('chair'); command.stand();
// before scene destruction: command.dispose();
```

## Galaxy canon

Seven mapped systems, four unknown systems, 12 existing planets plus Argo/Hiveport. Coordinates, pairings, faction labels and orbit periods are newly proposed fiction, not imported game canon. Veskaris System is the proposed K’Vetar region; no new Veskaris IV surface asset is fabricated. The unknown systems cannot be selected as travel destinations. Light-years are fictional, not simulation time; all travel duration is host-owned. Influence rings represent schematic regions, not literal faction borders. Current ID persists via the callback.

## Test

`node tests/test-core.mjs` tests route calculations, existing destination IDs, unknown systems, local transfers, save fallback, rejected arrival, successful arrival and orbit periodicity. `node --check systems/*.mjs` individually checks module syntax. GLB validation: original buffer headers and animation accessors checked; independently loaded with trimesh. The runtime has not been executed with the live game or tested on device. WAV files are synthesized originals; no music or licensed clips. Spatial audio is optional and requires the existing AudioListener and user gesture/audio permission.
