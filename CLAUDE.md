# SS Wayfarer — Project Memory

READ THIS FIRST, then look at the images in `reference/` before changing any room.
Keep this file current: update "What's built" and "What's next" at the end of every session.

## What this is
A personal dashboard built as a 3D walkable spaceship. Walk the corridor, enter rooms; each room is a
functional workspace. A-Frame (WebXR), so it runs in a browser, on iPhone, and in Google Cardboard.

## User context
- Neurodivergent, very visual thinker — prefers whiteboards and infographics over flat lists
- Has an Obsidian second brain (markdown) — wants it navigable as a physical space
- Writing two books: *The Sons of Naphtali* (genetics, Book 1) and a Jewish genetic haplogroups book (Book 2)
- Flipping a house — needs a digital version of the house for planning before buying supplies
- Wants YouTube subscriptions surfaced (latest video per channel, first 15 s autoplaying, refresh noon + midnight)
- iPhone + Google Cardboard is a target platform: every change must hold up on a phone

## Style guide — the reference images are the authority
`reference/` holds the art direction (made in ChatGPT, Nov 2026):

| File | Use it for |
|---|---|
| `interiors-doors-closed.jpg` | The look of every room and the corridor (primary interior reference) |
| `interiors-doors-open.jpg` | Same rooms seen through open doors |
| `cutaway-layout.jpg` | Floor plan: which room sits where. Its near engine is misplaced — ignore it for the exterior |
| `exterior-views.jpg` | Hull shape, engines, dome (orthographic sheet) — authority for anything exterior |
| `exterior-hero.jpg` | Hull materials and mood |
| `ship-topdown-interior.jpg` | Top-down exterior + cutaway (Nov 25): Bridge is a POINTED, guitar-pick room in the nose; consoles along the front window |
| `app-icon-source-v2.png` | CURRENT app icon source (Nov 25, user's new art; neon frame cropped off, 64 px inset) → icons/ 1024/512/192/180 + favicon |
| `app-icon-source.jpg` | Old icon source (superseded) |

Rules drawn from them:
- **Hull:** worn copper/bronze plating with rivets; engine glow and dome glass teal/cyan; deep navy space.
- **Interiors:** brushed-bronze arched ribs framing every room; a warm amber light ring/cove on every ceiling;
  dark walnut-brown/charcoal wall panels; polished dark reflective floors; small square amber sconces.
- **Colour:** amber is the default light. Teal = Library electrogel / dome. Blue-purple = holograms only
  (Holodeck galaxy, Bridge orb). Nothing grey or white-lit (the pre-Nov-2026 rooms were grey; that look is retired).
- **Lived-in:** plants, bookshelves, brass fittings — in rooms AND the corridor (user, Nov 24: inset bookshelves in the hall).
- **Outside the ship** (user, Nov 25 — supersedes Nov 24): windows normally show NORMAL SPACE — still stars, soft nebulae and the
  planet you were last near (localStorage 'wf-near', saved by Flight Mode). LIGHT SPEED (streaks rushing aft, toward −Z) only
  runs in bursts: back rooms on a shared random schedule (~75 s every 7–13 min, localStorage 'wf-warp'), the Bridge ONLY when
  you launch into flight / arrive back (`mode: 'manual'`, `hs.setWarp(on, instant)`). Light spill dims when not warping.
- **Fidelity:** the images are paintings. Match layout, palette, light mood and silhouettes; fake glow/gloss with
  emissive strips, additive gradient planes and a one-off PMREM reflection bake. No post-processing bloom (phone cost).

## Ship layout (matches cutaway-layout.jpg)
```
[FRONT +Z end ] Command Bridge  — circular, panoramic window, 4 robots at stations, captain's chair on a
                                  raised ring, blue orb on a pedestal. Chair → minigame.html (Flight Mode)
[LEFT  z=+6   ] Holodeck        — bronze console with FIT SCENE / RESET / SIM LIBRARY buttons, galaxy hologram,
                                  grid walls. Also hosts the house blueprint planner
[RIGHT z=+4   ] Crew Lounge     — curved leather sofa, brass table, rug, alien cats, wall TV (= browser)
[RIGHT z=-4   ] Media Nexus     — HYBRID (user decision): theater recliners + one big main screen, side walls
                                  fully covered in channel screens (one per subscription)
[BACK  -Z end ] The Library     — round room under the glass dome; bookshelves around the wall; brain in
                                  teal electrogel under a glass floor; scrolls = markdown notes
```

## Tech
- A-Frame 1.5.0 from the aframe.io CDN, no build step, plain HTML/JS
- GitHub Pages deploys from branch `claude/hello-mssbj4` (site: spawnshark.github.io/aspentrail).
  Session work happens on a `claude/...` branch; it is live only after it reaches `claude/hello-mssbj4`.
- Local scripts are loaded with `?v=<date+letter>` (Safari cached old door.js/mobile.js) — bump it in every page on each push (now 20261126f).
- Shared scripts: `textures.js` (procedural textures), `mobile.js` (touch controls, Nov 24 v3 — user: "like it was in the
  beginning"): NO bar. Two floating frosted-glass thumbsticks in the bottom corners: left = analog walk joystick, right = look
  stick. MENU BAR (Nov 25, user: "like the Mac's menu bar"): #wf-btns is a slim 30 px frosted bar across the TOP on every
  device (mobile.js `menuBar()`), ship icon left, small status-style icons right: Gyro (VR headset, touch only), Level
  (spirit level, touch only), Sound (sound.js), View 1st/3rd (avatar.js). Real glassmorphism (dark
  translucent fill + blur 22px saturate 185% + top-edge highlight + sheen). Gyro off by default; its tap calls
  DeviceOrientationEvent.requestPermission so only Apple's prompt shows; every a-scene has device-orientation-permission-ui=
  "enabled: false". NO labels or hint text anywhere (#hud, #controls-hint, #hint-shoot hidden). Door button = symbol only (◀▶).
  The user has changed their mind on this several times — keep it simple and ask before redesigning again, `brain.js`, `cats.js`, `stargarden.js`
- AVATAR + VIEW (Nov 25, `avatar.js`, every A-Frame page, auto-attaches `wf-avatar` to the scene): original captain figure (navy
  coat, copper trim/epaulettes/belt/cuffs, boots) with jointed hips/knees/shoulders/elbows and a procedural walk cycle driven by
  real movement speed (stride, knee bend, arm swing, bob, lean, idle breathing); faces the walk direction. 1st/3rd person toggle =
  person button in #wf-btns (touch) or bottom-right glass button (desktop) or key V; localStorage 'wf-view'. 3rd person offsets
  the THREE camera inside the a-camera (back 2.4, up 0.45), shortened to stay inside the room (radius / corridor box) and drops
  to 1st person when < 1.1 m of room. Avatar is noCollide + wfPortal (hidden in portal captures). `WAYFARER.avatar.hide(bool)`
  (Bridge chair sequence). door.js roomExit now measures the PLAYER (camera entity), not the lens.
- FURNITURE COLLISION (Nov 25, mobile.js, every room; corridor has `wayfarer-mobile="collide: false"` and its own clamps):
  scans meshes at body height into XZ boxes (skips top < 0.45 m, bottom > 1.4 m, footprint > 12 m², invisible/transparent,
  instanced, `userData.noCollide` subtrees = door.js doors, the rig); rescans 8× while GLBs load; player circle r 0.28,
  swept in 8 cm sub-steps, pushed back out the side it entered (slides along). Only acts while moving.
  Headless tests: the Library renders < 5 fps in swiftshader so wasd-controls (MAX_DELTA 0.2 s) never moves there — move the
  camera directly to test it.
- HOME SCREEN APP (Nov 25): `manifest.webmanifest` (scope ./, start ./index.html, display fullscreen) + apple-mobile-web-app-capable
  meta on EVERY page. Without it iOS opened each room in an in-app Safari sheet with a URL banner (user screenshots). Any new
  page must carry the same head tags. The user must delete and re-add the Home Screen icon once for the manifest to apply.
- PLAYER RIG RULE (fixed Nov 24): `#player` is a bare entity; wasd-controls + look-controls live ONLY on the camera, with
  `magicWindowTrackingEnabled: false` (Gyro button turns it on). Holodeck/Lounge once had look-controls on the rig AND on
  a-camera's defaults: gyro on from the start, doubled rotation ("felt like VR") and a 3.2 m eye height in the Holodeck.
- Pages that build lights in three.js must put `light="defaultLightsEnabled: false"` on `<a-scene>`, otherwise
  A-Frame adds a white directional light that puts a hotspot on glossy floors.
- Testing in a cloud session: aframe.io is blocked there; `npm pack aframe@1.5.0` and route the CDN URL to
  `package/dist/aframe-v1.5.0.min.js` in Playwright (headless Chromium, swiftshader GL).

## What's built (as of 2026-11-24)
- Live site == branch `claude/hello-mssbj4`. Push there only when the user says so.
- **Corridor** (`index.html`) — RESTYLED to the reference: dark panelled walls, bronze arched ribs every 3 m,
  curved amber-lit cove ceiling, full-length glass skylight with stars and faint light shafts (no side windows —
  user decision), polished deck with a 3 m STAINED-GLASS RUNNER (Nov 25, user reference = ammonite-spiral stained-glass rug;
  images/runner.jpg 1024×4096 tiling, generated by tools/make-runner.py: amber/red ammonite in blue/teal/violet glass shards, dark
  leading; repeats twice down the hall, brass rods at both edges; replaced the oxblood woven runner) and glowing edges, square amber sconces
  (pairs flank each side door), glowing arch portals at the ends (amber = Bridge, teal = Library).
  One-step-outside-the-door spawn when returning from a room; leaving the Bridge/Library you face AWAY from it (SPAWN yaw:
  0 = facing −Z, 180 = facing +Z; the old heading check read the entity +Z axis and turned every spawn round — fixed).
  DOOR RUGS (Nov 25, user: tell the doors apart from down the hall): `buildRugs` lays a half-round mat (r 1.3, 0.18 m in from
  the wall) flat-edge to every door, drawn by `rugTexture(tint)` in that door's own glass colour (DOORS.tint): circuit-key border,
  mosaic tile band with diamonds, spoke ring, petal sunburst with an octagon hub; additive glowing rim. Style per the user's
  half-round door-mat references (they rejected the two plain-printed ones).
  SKYLIGHT shows light speed (`buildSky`: animated streak quads + scrolling tunnel texture). SEVEN recessed walnut
  bookcases between ribs (`SHELVES` table; 2 columns × 6 lit shelves; ~instanced books with gilt spines, leaning/stacked
  books, vases, frames, plants, globes). Default spawn faces the Bridge (user is fine with it).
  DOORS (user design, Nov 24): double doors modelled on a sci-fi double door photo the user sent (not saved
  in the repo) — moulded arched bronze frame with jamb blocks and side ribs; ONE nameplate per door, on the frame
  header; each leaf has a top light + X-braces to a centre octagon hub, glass tinted per room (`tint` in DOORS).
  The right leaf has a rounded tongue that carries the hub; the OPEN button sits in the hub at the door centre.
  Left leaf slides left, right leaf slides right (with the button). User sketch (v2, Nov 24): the seam runs straight down
  the middle and hugs the LEFT half of the octagon hub (r 0.265 outline), so the whole hub rides out on the right leaf. Ribs, rib legs, cornice and sconces are bevelled extrusions — avoid raw boxes (user: "Minecraft").
- **Doors are ONE shared component: `door.js`** (user, Nov 24: "feels like one game, not 6 separate games").
  Corridor uses `WAYFARER.door.create(...)`; every room calls `WAYFARER.door.roomExit('<id>')` (its old exit box is gone).
  Room exits sit on each room's +Z wall at x=0 as free-standing doors with bronze pocket housings for the leaves.
  `WAYFARER.door.PORTALS` (in door.js) is the single table of doorways: corridor frame, room frame, proxy shape.
  - **Portals:** an open door shows the other side — a 360° photo from that doorway (`images/portals/room-<id>.jpg`
    seen from the corridor, `corr-<id>.jpg` seen from a room), box/cylinder-projected so it shifts as you move.
    Photos are STATIC (cats/screens don't move in them). Walking or tapping through fades to the other page;
    you arrive with that door open behind you and it closes.
  - **Regenerate the photos whenever a room or the corridor changes:** `python3 -m http.server 8765` in the repo,
    then `node tools/capture-portals.js` (env: `AF=<local aframe-v1.5.0.min.js>` in cloud sessions,
    `ONLY=lounge,media` to redo some, `SKIP_CORRIDOR=1`). Stale photos = the preview won't match the room.
- **Command Bridge** (`bridge.html`) — GUITAR-PICK ROOM (Nov 25, user + reference/ship-topdown-interior.jpg): outline = closed
  centripetal CatmullRom through CP (tip z −10.4, back edge z 8.3, max half-width 8.6), walls/window/floor/ceiling/cove built
  from it (`strip`, `tube`, `fan` helpers; fan = tessellated rings, never one big fan). Window = outline points with z < −2.2,
  wrapping the tip; the 4 consoles sit 1.7 m inside it (`__SPOTS`) facing the glass. Movement uses `WAYFARER.bounds` (polygon,
  mobile.js `clampPoly`, 0.35 m pad; wayfarer-mobile radius 0) — avatar 3rd-person camera respects it too. Droids are polished
  GOLD (M.shell) with dark bronze joints. NAVIGATION ORB (Nov 25): the glass orb holds a live mini star system (WF_STARS, must
  match minigame SYSTEM names + the Argo); tap → STAR CHART glass panel → pick a world → chair jump → `minigame.html?from=bridge&
  dest=NAME` arrives beside it on the sunlit side, mid-warp. ALL METAL (user, Nov 25: "looks like a 1970s wooden trailer"): NO wood anywhere — brushed
  copper (bronzeTexture), riveted copper wall plates, copper ceiling, polished ribbed-copper captain's chair (M.leather name kept),
  copper shelves (M.wood name kept), and the shared exit door re-tinted to copper on this page only. RESTYLED Nov 24 to the reference, all procedural three.js: round room r 8.2;
  panoramic curved window across the bow (−Z, 140°, eight panes, bronze mullions, sill + header) showing light speed
  coming at you (vanishing-point glow); amber ceiling ring + perimeter cove; dark panelled back walls with bronze
  ribs, sconces and two plant/book shelves; polished deck with amber inlay rings; raised dais, copper
  captain's chair (tap → `minigame.html`), blue swirling orb on a brass stand; four white robots seated at curved
  consoles with teal screens (heads glance between screens). Exit = shared door at +Z (now has a wall behind it).
- **Light speed is shared code: `hyperspace.js`** (`WAYFARER.hyperspace(root, {fwd, arc, minR, center, core})`).
  Corridor: fwd +1, arc ±70°, minR 16, tunnel 0.6, width 0.55. Bridge: fwd −1, full circle, minR 14, core glow.
  Library dome: fwd +1 (its door faces the bow), arc ±75°, same settings as the corridor. LIGHT SPILL (user, Nov 24): `spill: [{p,i,d}]` / `lights: [existing]`
  options flicker cool-blue point lights with passing streaks (corridor ×3 under the skylight, Bridge window + 2, Library dome,
  Lounge window light). Streaks are DoubleSide
  billboards (seen from below they face away — that once hid them entirely in the corridor). Streak heads are soft round
  caps and widths are capped; the backdrop tunnel texture uses thin soft-sided streaks (wide hard rects showed as flickering
  blocks through the skylight on iPhone — user video Nov 24).
- **Library ceiling** restyled Nov 24 to match: glass dome under 12 bevelled bronze ribs + mid ring + glowing crown,
  big amber light ring at the dome base, amber cove at the wall top, dark ceiling panels. Library WALLS restyled Nov 24 too:
  walnut panels + bronze rails (procedural `wallTexture`), bevelled bronze ribs with lamps, polished dark deck ring,
  14 bookcase bays all round (not over the entrance or wings). Wing doorways = shared door.js doors with `locked`
  (button buzzes 'SEALED (COMING SOON)') and `noPockets`. The glass floor/brain/scroll pedestals are unchanged.
- **Flight Mode** (`minigame.html`, plain three.js r128) — REBUILT Nov 24 to the user's TOP and REAR views
  (reference/exterior-views.jpg): lofted teardrop copper hull (beam ≈ ⅓ length), U-shaped bridge window band following the
  nose, continuous framed spine window strip, big dark-teal Library dome ≈ full beam at 80% aft in a thick bronze ring
  with amber lights, wide stepped stern block with amber strips, engine pods on struts beside the dome with glowing blue
  faces. Planet = terracotta/clay world with wrinkled relief (normal map from ridged noise; user's material reference was
  an organic-sphere sheet), warm rim, poles turned away from view. Space: per-pixel fbm nebula sky, layered stars, dust.
  Enemies (Nov 24): three kinds — DRONE (green/blue, 1 HP, weaves in to ram), STRIKER (red, 2 HP, holds an arc in front
  of you, fires led red-magenta plasma bolts, rams after 3 shots), BRUTE (violet, ×1.9, crown ring, 4 HP, wave 3+, 3-bolt
  spread). Hit flash on enemies, blue shield flash + camera shake when you're hit, 3 s invincibility. Score 100/200/400 × wave. Explosions: flash + ring + sparks.
  GOTCHA: loftHull winding must face outward (it was inside-out once: windows painted on top were never visible).
  MODES (Nov 25): EXPLORE IS THE DEFAULT (localStorage key 'wf-mode2'; old 'wf-mode' ignored). COMBAT or EXPLORE (no enemies; score/hull/reticle/Fire hidden via body.explore). Title buttons, compass button
  on the touch bar, key E. Stored in localStorage 'wf-mode' — the Bridge chair jump lands you in the last-used mode.
  ARGO WAYSTATION (Nov 25, user asked for a dockable DS9/Afterlife-style station — ORIGINAL design): `STATION` in minigame.html at
  (-150,30,-460) near the start: lit core + spires, habitat ring on spokes, outer docking ring, 3 up + 3 down curved pylons,
  blinking lights; in NAV (NAV = planets + station); solid (core sphere 26). Within 170 → "DOCK AT ARGO" button / key F → flash
  → `station.html?from=dock`. FRIENDLY TRAFFIC: 6 rounded haulers ply lanes station⇄planets; tap one → hail panel (#hail), never shot.
  **station.html — "The Ember Room"** club (A-Frame): LED shader dance floor, 10–16 dancing NPCs (solid via mobile.js collision),
  DJ booth + hologram waveform, curved copper bar + bottle wall + robot bartender (tap → drinks menu; drinks add a 'tipsy'
  canvas wobble), booths, sweeping beams, wall washers, PMREM gradient env (copper is black without it), LCARS JOB BOARD by the
  entrance → CONTRACTS, AIRLOCK arch at +Z (walk in / tap) → `minigame.html?from=station` = undock beside the Argo.
  CONTRACTS (Nov 25) — shared `missions.js` (WF_MISSIONS, localStorage wf-mission / wf-credits / wf-done): 3 offers per day
  (bounty: kill N drones|strikers; survey: fly within r×1.8+80 of a planet; courier: visit planet then DOCK; boss: kill a Bioship).
  Accept at the Argo job board; Flight Mode shows an #objective chip under NAV and reports 'kill:<kind>' / 'visit:<PLANET>' /
  'dock'; completion pays credits immediately → rank (Ensign → Lieutenant 600 → Lt Cdr 1800 → Commander 4000 → Captain 8000 →
  Commodore 15000), shown on the board.
  COMPACT HUD (Nov 25, user): reticle min(24vmin,130px) at 75%, lock bracket 36 px, touch bar max 300 px with 74 px pads and
  icon-only buttons in one row; camera CAM_OFFSET (0,5.2,26) × camK (portrait pulls back up to ~1.4×) so the ship is small.
  SHOOTING (user, Nov 25): NO auto-fire (toggle hidden). TAP/CLICK AN ENEMY anywhere on screen → `tapShoot` locks it (`lockTarget`,
  generous screen radius) and fires HOMING shots (bullet.target steers to it); tap empty space → a shot along that ray; Fire/Space
  keep hitting the lock. Touch: glass bottom bar (steer stick, Bridge, Fire); aim assist
  bends shots toward the enemy nearest the crosshair; the scene is rendered shifted up above the bar (setViewOffset).
  Nov 24 (user): camera pulled back (ship small, low in a Starfield-style HUD reticle that is projected to where shots
  land; a rotating lock bracket marks the aim-assist target); lasers = long teal beam bolts alternating from the pods.
  Control bars everywhere are compact & centred (max ~420 px); in LANDSCAPE phones they split into corner pads. r128 GOTCHA: hex colours are linear there — run
  `fixColors()` on new objects or they render washed out (dark copper came out cream).
- **Orbital kit (user, Nov 25)** — 3 zips: Models_Textures, Views_Guides, and a duplicate of the Command Deck pack (byte-identical,
  ignored). Used: the 12 worlds' albedo/emission textures → images/planets/<id>.jpg (+ _glow.jpg for Nyxara, Ferrum Prime, Kharon
  Fracture, Pyraxis, Mycelion, Selenite); Orbital_Station_Assembled.glb → models/station/orbital_station.glb (80k tris, scale 0.8)
  as the Argo's exterior (procedural build = fallback). destinations.json + catalog + manifest in reference/orbital-kit/.
  THE GALAXY is now these 12: VARKESH (start), AURALIS, ORINTH (rings), CRYOVALE, PYRAXIS, MYCELION, NYXARA, FERRUM PRIME,
  THALASSA, VESPERA, SELENITE, KHARON FRACTURE — names shared by minigame SYSTEM, bridge WF_STARS/PLANET_MAP, missions.js
  PLANETS, hyperspace.js W table (window planet uses the same texture). Planets use a self-lit ShaderMaterial from SUN_DIR
  (day/terminator/night glow/atmosphere rim); the old procedural PLANET_FS now only paints moons. NOT used: the 12 planet GLBs
  (1–1.8 MB each; same textures), station interior modules (Observation Lounge, Research Lab, Engineering, Crew Quarters,
  Command Ops, Hangar, Transfer Corridor) + props, Views/*.png renders, Window_Frame_Overlay — candidates for walkable
  station rooms later.
- **HIVEPORT EXTERIOR (Nov 26, Argo_Station_Exterior_Asset_Pack.zip; README + hero render in reference/hiveport-exterior/)** —
  the station is now the K'Vetar HIVEPORT (Argo Station): models/station/hiveport_exterior.glb (= Argo_Station_Master, 102k tris,
  3.6 MB) at scale 0.45, its 'Rotor' habitation belt turning slowly; STATION.name 'HIVEPORT' (map id Argo_Hiveport); collision
  sphere 42; DOCK AT HIVEPORT. The orbital-kit wheel (models/station/orbital_station.glb) is no longer loaded. Pack's scripted
  docking controller (42 s path, bay doors/clamps clips) NOT used yet — docking is still the flash into station.html.
- **LIVING CREW (Nov 26, SS_Wayfarer_Living_Crew_Expansion.zip; START_HERE + Integration.pdf in reference/living-crew/)** — `crew.js`
  (every room page, after door.js; auto-attaches `wf-crew`) runs the kit's engine (crew/crew-engine.mjs + roster.mjs, vendored
  UNCHANGED) for 6 droids (Aster nav, Forge eng, Vesper sci, Echo com, Sentinel tac, Prism sen; models/crew/Droid_*_Living.glb) and
  4 cats (Ember, Nimbus, Orbit, Pixel; models/crew/Kitty_*.glb at scale 0.6). The kit's consoles/operator chair are byte-identical
  to models/deck → reused, not copied. Bridge's old seated droids (models/deck/Droid_*_Seated.glb) are no longer loaded; the living
  droids sit in those same operator chairs. SHIP GRAPH (buildLayout in crew.js): nodes in each room's own metres, shifted by
  OFF[room]×100 m for the engine so rooms never overlap; doorway = `xfer` edge (wait for that page's real door.js door, walk in,
  vanish 1.4 s, appear on the other side; doors not on this page count as open). Satellite consoles: nav+sen Holodeck starboard
  wall, eng corridor port wall z −6, sci Library port side, com Lounge starboard, tac Media back-left (placement in LAYOUT.stations;
  shown in portal captures too). Whole crew simulates on every page, only those in THIS room are loaded/drawn; full state in
  localStorage 'wf-crew' (v 2) every 4 s + pagehide (a graph change resets them home). Tap a droid ≤2.3 m → glass dialogue
  panel (kit's 7 choices; walking frozen, view eases to them); tap a cat → petted/purr + trust. Player can't walk through them
  (WAYFARER.dynSolids → mobile.js collide, also in the corridor; bump → engine.bump). canMove = never step INTO a mobile.js
  solid, except the last 1.4 m to its own chair/console. GOTCHA: never name a component method `play`/`pause` (A-Frame lifecycle).
  Route check: scratchpad lay.js validated every in-room edge against the scanned solids (0 hits). Old Lounge alien cats kept.
- **HIVEPORT INTERIOR (Nov 26, Hiveport_Argo_Station_Prototype.zip; README + concept in reference/hiveport-interior/)** —
  station.html is now the K'Vetar HIVEPORT (old Ember Room club kept as station-ember-room.html, unlinked). hiveport/rooms/
  Hiveport_complete.glb (96 × 44 m deck: nexus with the Resin Spire bar + holo stage, 8 side zones; hex-pattern ceilings added per
  layout room), hiveport/layout.json (rooms, lights, 42 crowd targets, obstacles → WAYFARER.extraSolids for mobile.js collision,
  bounds ±48 × ±22), hiveport/systems/crowd.mjs (pack's grid-A* crowd). NPCs = Kvetar_male/female_rigged.glb cloned per NPC
  (cloneSkinned) with KHR_materials_variants castes (civilian 45 / soldier 30 / commander 18 / general 7 %, 22 % female purple
  crest); 8 on mobile, 16 desktop; tap → dialogue.json small talk. Bartender behind the bar → drinks menu (Serve_Drink, glass in
  hand, tipsy wobble). Violet holographic performer dances on the stage. Job board + AIRLOCK at +Z (z 21.55) → minigame
  ?from=station. Audio: hiveport/audio/*.m4a loops (crowd wash + station hum), NO music (user rule).
  Kvetar_Complete_Modular_140_Variants.zip = OLD/redundant (static; same 112 male + 28 female variants live in the rigged GLBs) — unused.
- **COMMAND SYSTEM (Nov 26, navigation kit = SS_Wayfarer_Galactic_Navigation_Command_Systems.zip; README/guide in
  reference/navigation-kit/)** — bridge.html `wf-cmd` component + window.WF_CMD {sit, stand, launch, openNav, state}. Models:
  models/deck/Commander_Chair_Animated.glb (Swivel/Armrest/Seat_Anchor/Eye_Anchor nodes, Z-up inside; BASIS = rotX +90° → Y-up),
  Planet_Selector_Animated.glb = the NAVIGATOR, placed IN FRONT of the chair (user: CHAIR_Z 0.65, ORB_Z −1.3, scale 0.72) with
  Hologram_Rotation + Galaxy_Spin looping, Orb_Open/Orb_Close on use; models/player/explorer_command.glb = avatar (+ Sit_Down,
  Stand_Up, Seated_Idle). SIT: approach (avatar walks via waypoints to the chair's side, cinematic front-side camera) → turn (chair
  swivels toward you, armrests up) → Sit_Down sliding into seatXform() → lock (chair carries you to face the bow) → settle (camera
  into Eye_Anchor or, 3rd person, a raised lens). SEATED: look stays on, walking frozen (WAYFARER.frozen; mobile.js skips movement/
  collision/bounds), glass #cmd-hud: Navigation / Launch / Stand (keys N / L / X|Esc). STAND = reverse. avatar.js
  WAYFARER.avatar.script({x,y,z,yaw,clip,time,show,cam:'owned'|'free',up}). GALACTIC MAP = vendored nav/galaxy-map.mjs (+
  navigation-core.mjs, nav/galaxy.json patched: planet previews use images/planets textures, glb null; Argo_Hiveport named
  'Hiveport'); dynamic import(); its own renderer overlay. Confirm → travel(id): seated → launch(id); standing (from the
  navigator) → walks to the chair, sits, launches. minigame `?dest=` accepts map ids (Ferrum_Prime, Argo_Hiveport). Sounds:
  audio/nav/*.m4a (kit WAVs transcoded). The kit's own command-system.mjs is NOT used (its rig/camera assumptions don't fit A-Frame).
- **Command-deck kit (user, Nov 25)** — `models/deck/` (from Command_Deck.zip; catalog + manifest in reference/command-deck-kit/):
  Commander_Chair, Planet_Selector (Hologram_Rotation; tappable Planet_01..06 → PLANET_MAP in bridge.html → launch), Operator_Chair,
  6 Console_* (their 'ControlScreen' materials get live LCARS textures), 6 Droid_*_Seated (rigid node rigs, Console_Operate loops).
  Placed by `kitModel()` in bridge.html using the kit's own arrangement (Command_Deck_Assembled positions, ×1.45 spread, kit bow
  is +Z so everything is turned 180°). Kit shell/ceiling/floor pieces and the 152k-tri assembled GLB are NOT used (our
  guitar-pick shell stays; too heavy for phones). `models/player/explorer.glb` (= the user's Me.glb) is the avatar: skinned,
  Idle/Walk_InPlace blended by speed in avatar.js (procedural figure is the fallback). Old procedural Bridge robots/consoles/orb
  code (`robot`, SPOTS, plantShelf) is now unused.
- **User asset kit (ChatGPT, Nov 24)** — 62 GLBs; most interior pieces are graphite/cyan low-poly and CLASH with the style
  guide, so only these are used (in `models/`): `ship/wayfarer_mobile.glb` (25k tris, Flight Mode player ship — replaces the
  hand-built hull once loaded; that hull stays as the fallback), `ship/wayfarer_high.glb` (75k tris, Ship View), and
  `props/` (cat tree/bed/feeding station → Lounge; writing desk + microscope + vial rack + hourglass + armillary →
  Library study corner at the back wall; orrery + crystal cluster on bronze plinths → Holodeck corners).
  `props.js` (`wf-prop="src: name; height: m; accent: teal|amber"`) RECOLOURS kit materials by name (hull→walnut,
  trim→bronze, teal glow→amber unless accent: teal). The user's 294k-tri SpaceshipHD.glb is the same mesh+texture as
  the kit's "full" variant: too heavy for phones, kept out of the repo.
  SKIN (Nov 24): the kit's baked texture is scrambled AI noise — `shipskin.js` (`WAYFARER_SHIPSKIN(gltf.scene)`) drops it
  and paints the hull in the shader from object-space position: triplanar copper plates/seams/rivets, verdigris, dome
  (x0 z0.31 r0.135, y>0.06) as dark teal glass with 8 ribs, lit spine window strip, nose window band; also smooths
  shading normals. Used by Flight Mode and Ship View.
  Ship GLB notes: model units length 1, nose −Z, pods at x ±0.195, y 0.015, outlets z 0.475; its material says fully
  metallic → set metalness ≈0.45, tint 0xe8a878; DON'T give it a PMREM env map on r128 (renders pure black).
- **Ship View** (`hangar.html`, three r128 + GLTFLoader + OrbitControls) — the high-detail ship in space by the terracotta
  planet; drag to orbit, pinch zoom, glass bar: Turntable / Top / Rear / Hero. Linked from Flight Mode's title screen.
- **Library** (`library.html`) — brain (Nov 24 v2, user): realistic pink-beige tissue with dark-red blood vessels, NO turning:
  a lub-dub heartbeat swells it and flushes the vessels; electrical discharges every 2.5–7.5 s (tube bolts drawn over the folds,
  spark sprite, flash light); rising bubbles look like real bubbles (rim + glint, vent streams, wobble; renderOrder −2 and the
  glass floor has depthWrite off, or they vanish behind it). Cabled electrogel tank, copper room, dome, scroll
  reader. Scrolls hold placeholder text, not the user's Obsidian notes yet.
- **Crew Lounge** (`lounge.html`) — curved leather sofa, brass table, woven rug, rigged alien cats on a shared
  60 s stretch cycle, browser TV, bookshelf, sideboard, painting, plants, plaques. SHELL restyled Nov 24 (`buildShell`):
  walnut walls + bronze ribs, polished deck + amber rings, dark ceiling with bronze rims round the amber ring, amber
  cove; the wall has a real gap behind the TV with a round window showing light speed running SIDEWAYS (the Lounge
  faces starboard; ship forward = +X in this room, so the hyperspace group is rotated 90°).
- **Media Nexus** (`media.html`) — REBUILT Nov 24 as the HYBRID theatre: walnut round room, amber ceiling ring, two rows of
  kit cinema seats (back row on a carpeted riser, centre aisle), big main screen in a bronze proscenium at −Z with kit
  speaker towers either side, 12 channel screens on the side walls (CHANNELS list in the page). Tap a wall screen → it
  goes on the main screen; tap the main screen → opens a YouTube search for that channel. Placeholder cards until the
  user supplies a YouTube Data API key (then fetch each channel's latest video + thumbnail into the cards).
- **Holodeck** (`holodeck.html`) — RESTYLED Nov 24: square room (±9 m, 4.4 m high), dark panels with glowing amber
  grid + `+` marks (emissive grid texture), bronze ribs/beams/posts, amber ceiling ring over a round bronze console with
  a violet emitter lens and a spiral GALAXY hologram (entity `#hd-house`, auto-hidden by stargarden.js while Star Garden
  runs). Three console buttons: FIT SCENE (step back to view), RESET (close programs), SIM LIBRARY (HTML menu → Star
  Garden). HOUSE PLANNER is its own wall terminal on the port wall (x=−9): live blueprint preview, tap → 2D planner
  (user, Nov 24). Furniture placements are NOT saved between visits yet. The 2D blueprint planner and Star Garden code are unchanged.
- **Icons** — Nov 25: the user's new SS WAYFARER art (reference/app-icon-source-v2.png, frame cropped) at 1024/512/192/180 + favicon,
  linked with ?v=2 to beat icon caches. Share image (Nov 25): user's new art (reference/share-image-source.jpg) cropped to
  images/wayfarer-share.jpg 1200×630, og:image ?v=2.

## What's next (agreed order: restyle room by room to the reference)
1. Media Nexus live channels — needs a YouTube Data API key from the user (a key in a Pages site is public:
   restrict it to the Pages domain in Google Cloud); swap the CHANNELS placeholders for real subscriptions
2. Library — load the user's real Obsidian markdown into the scrolls (user will add the files)
3. Lounge: YouTube on the TV (needs the API key, same as Media Nexus)
5. [x] Collision (Nov 25): mobile.js `scanSolids()` / `collide()` — see Tech

## User backlog (Nov 24 — "one at a time"; refs: reference/roadmap-next-updates.jpg, roadmap-key-features.jpg,
## core-inspiration.jpg, bridge-combat-concept.jpg, lcars-ui.jpg, alien-bioship.jpg, logo-wordmark.jpg)
Guidelines, not orders: don't destroy what's built if an item doesn't fit.
- [x] Holodeck console buttons cut by the bronze rim (fixed)
- [x] Door nameplates: gold Michroma lettering + small triple-bar wings (door.js `plate`) on the user's OXBLOOD LEATHER plaque with
  gold filigree corners (Nov 25, from their book: images/nameplate.png = the 'MENU' plaque with the lettering painted out;
  full UI sheet in reference/oxblood-ui-assets.png — other frames/buttons there are candidates for menus). Mesh 1.12×0.36.
- [x] No lettering across the top of the screen (#hud hidden everywhere)
- [x] LCARS-style animated panels: shared `lcars.js` (`WAYFARER.lcars({w,h,seed,layout:'readout'|'graph'|'keys',label})`,
  redraws ~8 fps). On the Bridge's 8 console screens + 4 key panels (screens were hidden inside their frames before — fixed).
  Next candidates: Holodeck console, Media Nexus, Flight Mode HUD.
- [x] Bio-engineered alien ship: BIOSHIP carrier boss in Flight Mode every 3rd wave (`buildBioship`, procedural flesh textures,
  pale carapace, scalloped drooping skirt, red-orange window rows, spiky drone pods). 30 HP, boss bar, volleys, launches drones.
- [x] Space outside (Flight Mode): SYSTEM table of 7 worlds (terran, clay desert, ringed gas giants, ice, lava, toxic), moons,
  slow-turning Milky Way band in the sky shader; NAV chip (‹ name/distance › WARP, keys N/J) warps with a streak tunnel.
  Planets are real world-space objects (camera far 40000); one procedural PLANET_FS shader paints every biome.
  Planets + moons are SOLID (`collidePlanets()`): ship is pushed back to r×1.04+4 and slides along, shake + "PULL UP".
- [x] HIGHEST PRIORITY (roadmap): Bridge ⇄ Flight Mode as ONE continuous trip (Nov 25): chair tap → camera glides into the seat,
  pushes through the window while light speed accelerates (warpK, FOV +30) → blue-white flash (#jump; html bg #dff0ff so the page
  switch is never black) → `minigame.html?from=bridge` skips the title and opens mid-warp, decelerating out (`arriveFromBridge`).
  Every Flight Mode exit calls `toBridge()`: warp-out flash → `bridge.html?from=flight` → you're in the seat, flash fades, streaks
  slow down, then controls return. DOORS too (Nov 25): `WAYFARER.door.leave(page, img, yaw)` stores the portal photo + arrival
  heading in sessionStorage and navigates with no fade; on arrival door.js draws that 360° photo in a tiny second renderer at
  the arrival heading until the live scene has built (and the corridor's #wf-fade is gone), then crossfades. CORR_YAW in door.js
  must match index.html SPAWN.
- [ ] Space combat run from the Bridge (bridge-combat-concept.jpg: tactical sphere, LCARS side panels)
- [x] Visible warp jump (Flight Mode NAV → WARP). [x] missions/contracts, rewards, rank (missions.js). [ ] ship upgrades, crew
- [ ] Interactive objects in rooms; real-time planetary window views; upgraded Holodeck visuals
- [ ] Reduce floor glare / better ambient shadows; adjustable mobile controls (size, opacity)
- [x] Sounds (Nov 25): `sound.js` (WF_SOUND, all WebAudio synthesis, no files; unlocks on first touch/key; mute = speaker button
  in #wf-btns / Flight bar / desktop corner, key M, localStorage 'wf-mute'). Interior: ship hum bed, light-speed whoosh layer
  (hyperspace.js calls WF_SOUND.warp), door hiss+thunk (door.js), footsteps from the avatar walk cycle, droid chatter (Bridge),
  cat meows (Lounge, every 12–38 s), crowd murmur (club). Flight: engine, blaster, enemy fire, explosions (big for Bioship),
  alien/friendly fly-bys, warp rise. MUSIC only in Flight Mode + the chair-jump / arrival scenes (generative: explore = pads +
  arpeggio, combat adds bass/kick/hats; follows the mode). iOS: a page reached by navigation stays silent until the first tap.
- [ ] Interactive ship blueprint (deck map, room indicators, quick navigation)
- [ ] Performance pass for mobile + VR

## Known issues
- RULE (found Nov 24): never use big single-fan discs / tall single-quad walls for floors, ceilings or walls the
  player walks next to. Their huge thin triangles get clipped wrong near the camera and leave holes (the Lounge's
  old "lavender floor" was the background showing through). Use RingGeometry(…, 96, 14) / segments-height ≥ 12.
- Mobile autoplay: test the 15 s video loop on an actual iPhone before committing to that UX.
