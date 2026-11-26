SS WAYFARER | FURNITURE UPGRADE 01
Standalone additive furniture layer designed for Architecture V8. Not a replacement for V8, movement/NPC packs, or existing functional command systems.

Unzip into a new asset folder. Keep manifest.json and models/ together. Import FurnitureLibrary from furniture-integration.js, supply your existing THREE and GLTFLoader instance, and use a baseURL ending in a slash. Example:
const furniture = await new FurnitureLibrary({THREE, loader, baseURL:'./assets/furniture-upgrade/'}).init();
const chair = await furniture.instantiate('captain_throne',{parent:bridge,position:[0,0,0],yaw:0});
const seat = furniture.anchors(chair,'sit')[0];

Example position is illustrative, NOT a verified placement. Match old object transforms and actual room clearances. +Z is the furniture's front, Y is up, units are meters, origin is floor level. Anchor sit/lie heights describe a contact point, not an avatar's root transform. The movement engine must apply rig offsets, collision, seat reservation, IK and animations. Keep captain-only access policy in the existing game. Bind droid consoles to existing behavior and cat props to existing cat logic. Treat perches/ramp anchors as target suggestions, not proof of path reachability. Use authored colliders for complex objects (table undersides, seats, cat paths) rather than a whole-object AABB when appropriate. The display case is an open-frame plinth, not transparent glazing; screen materials are static placeholders. No new rooms, walls, stairs or deck plan are included. Optional quarters props do not imply new quarters. No textures, rigged furniture animations or video playback are included. Material factors are embedded in GLB. No changes were made to the live site. Test on iOS Safari before deploying.
