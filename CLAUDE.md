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

**STYLE CHANGE (user, Nov 26 — Architecture V8, reference/architecture-v8/): ALL INTERIORS of both ships (Wayfarer rooms + Firefly cabin) are
now the V8 look — graphite / gunmetal / charcoal panels, white + pale-blue light strips, copper only as thin accent trim, neutral white
lighting. The SHIP EXTERIORS (Wayfarer hull, Firefly hull), the DROIDS and the CAPTAIN stay copper. The amber/walnut rules below now apply
only to those exteriors/characters and are history for interiors.** Implemented by interior-v8.js (see What's built).

Rules drawn from them (pre-V8):
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
- Local scripts are loaded with `?v=<date+letter>` (Safari cached old door.js/mobile.js) — bump it in every page on each push (now 20261127o).
- Shared scripts: `textures.js` (procedural textures), `mobile.js` (touch controls, Nov 24 v3 — user: "like it was in the
  beginning"): NO bar. Two floating frosted-glass thumbsticks in the bottom corners: left = analog walk joystick, right = look
  stick. MENU BAR (Nov 25, user: "like the Mac's menu bar"): #wf-btns is a slim 30 px frosted bar across the TOP on every
  device (mobile.js `menuBar()`), ship icon left, small status-style icons right: Gyro (VR headset, touch only), Level
  (spirit level, touch only), Sound (sound.js), View 1st/3rd (avatar.js). Real glassmorphism (dark
  translucent fill + blur 22px saturate 185% + top-edge highlight + sheen). Gyro off by default; its tap calls
  DeviceOrientationEvent.requestPermission so only Apple's prompt shows; every a-scene has device-orientation-permission-ui=
  "enabled: false". NO labels or hint text anywhere (#hud, #controls-hint, #hint-shoot hidden). Door button = symbol only (◀▶).
  The user has changed their mind on this several times — keep it simple and ask before redesigning again, `brain.js`, `stargarden.js`
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
  match minigame SYSTEM names + the Hiveport); tap → STAR CHART glass panel → pick a world → chair jump → `minigame.html?from=bridge&
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
  HIVEPORT STATION (originally built Nov 25 as a procedural station; user asked for a dockable DS9/Afterlife-style station — ORIGINAL design): `STATION` in minigame.html at
  (-150,30,-460) near the start: lit core + spires, habitat ring on spokes, outer docking ring, 3 up + 3 down curved pylons,
  blinking lights (now the fallback); in NAV (NAV = planets + station); solid. Within 170 → "DOCK AT HIVEPORT" button / key F → flash
  → `station.html?from=dock`. FRIENDLY TRAFFIC: 6 rounded haulers ply lanes station⇄planets; tap one → hail panel (#hail), never shot.
  **station.html — "The Ember Room"** club (A-Frame): LED shader dance floor, 10–16 dancing NPCs (solid via mobile.js collision),
  DJ booth + hologram waveform, curved copper bar + bottle wall + robot bartender (tap → drinks menu; drinks add a 'tipsy'
  canvas wobble), booths, sweeping beams, wall washers, PMREM gradient env (copper is black without it), LCARS JOB BOARD by the
  entrance → CONTRACTS, AIRLOCK arch at +Z (walk in / tap) → `minigame.html?from=station` = undock from the Hiveport.
  CONTRACTS (Nov 25) — shared `missions.js` (WF_MISSIONS, localStorage wf-mission / wf-credits / wf-done): 3 offers per day
  (bounty: kill N drones|strikers; survey: fly within r×1.8+80 of a planet; courier: visit planet then DOCK; boss: kill a Bioship).
  Accept at the Hiveport job board; Flight Mode shows an #objective chip under NAV and reports 'kill:<kind>' / 'visit:<PLANET>' /
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
  as the station exterior (since replaced by the Hiveport exterior). destinations.json + catalog + manifest in reference/orbital-kit/.
  THE GALAXY is now these 12: VARKESH (start), AURALIS, ORINTH (rings), CRYOVALE, PYRAXIS, MYCELION, NYXARA, FERRUM PRIME,
  THALASSA, VESPERA, SELENITE, KHARON FRACTURE — names shared by minigame SYSTEM, bridge WF_STARS/PLANET_MAP, missions.js
  PLANETS, hyperspace.js W table (window planet uses the same texture). Planets use a self-lit ShaderMaterial from SUN_DIR
  (day/terminator/night glow/atmosphere rim); the old procedural PLANET_FS now only paints moons. NOT used: the 12 planet GLBs
  (1–1.8 MB each; same textures), station interior modules (Observation Lounge, Research Lab, Engineering, Crew Quarters,
  Command Ops, Hangar, Transfer Corridor) + props, Views/*.png renders, Window_Frame_Overlay — candidates for walkable
  station rooms later.
- **HIVEPORT EXTERIOR (Nov 26, the station exterior asset pack; README + hero render in reference/hiveport-exterior/)** —
  the station is the K'Vetar HIVEPORT STATION (user, Nov 26: never call it Argo — every 'Argo' string was removed from the code):
  models/station/hiveport_exterior.glb (the pack's station master, 102k tris, 3.6 MB) at scale 0.45, its 'Rotor' habitation belt
  turning slowly; STATION.name 'HIVEPORT' (galaxy-map id 'Hiveport'); collision
  sphere 42; DOCK AT HIVEPORT. The orbital-kit wheel (models/station/orbital_station.glb) is no longer loaded.
  DOCKING CUTSCENE (Nov 26): the pack's docking.mjs timeline ported inline in minigame.html (dockArrival/dockDeparture, station-local
  metres; Door_L/R ±20, Clamp_L/R ±4 driven directly — never the GLB clips at the same time), ×1.6 speed, ship scaled ×3 while it
  docks, engine sprites hidden in the bay, 3 camera shots each way (dockCam), SKIP button / Space / Esc. Arrival ends in the
  flash to station.html; ?from=station starts in the berth and backs out (undockSeq), turns 180° and hands control back.
- **SHIP LIFE (Nov 26, user: "I'm bored, not enough to do") — 10-batch plan the user picked ALL of: 1 economy + daily goals + deck
  map [x], 2 Lounge cat play [x], 3 ship repairs + crew orders [x], 4 Holodeck games [x], 5 Hiveport shops + ship upgrades [x], 6 dance floor /
  K'Vetar gambling / bar brawl + bounties [x], 7 card game with the crew [x], 8 science scans [x], 9 Captain's quarters + galley (behind the
  Library's two SEALED wing doors), 10 story missions.** `life.js` (every page incl. station + minigame, after mobile/sound):
  WF_LIFE wallet (= 'wf-credits', shared with contracts), cargo 'wf-inv' (starter treats/laser/wand; +3 treats daily ration),
  event(name) → 3 daily goals/day ('wf-goals', seeded by local date, 150 cr each + 300 bonus; POOL = only things that exist —
  new features add goals with WF_LIFE.addGoals), SHIP LOG glass panel (clipboard button first in #wf-btns, key J): GOALS / DECK MAP
  (SVG ship from above, live crew dots from crew.js engine or the 'wf-crew' save, you-are-here, tap a room → go there) / CARGO.
  Events fired: crew.js 'talk' 'pet' 'treat' 'laser' 'wand' 'trick'; 'room:<id>' on every page load; station 'dock' 'kvetar' 'drink'
  'contract'; minigame every missionEvent (visit:/kill:) + 'contract'. CAT PLAY (crew.js): tapping a cat opens #wf-cat-menu (name,
  trust hearts): Pet (≤2.3 m) · Treat (−1 treat, +6 % trust) · Laser (red dot where you look on the floor; cat in state 'TOY' runs
  at it, pounces with Play; 22 s) · Wand (feather on a rod hanging off the camera; cat jumps at it; 14 s) · Trick (trust ≥ 70 %:
  twirl). STOP PLAYING button; toy state is never saved (saved as IDLE).
  REPAIRS (`repairs.js`, every room page after crew.js; auto-attaches `wf-repairs`): faults in localStorage 'wf-faults' (max 3; a new
  one every 5–11 min aboard, 'wf-fault-next') on a free crew-graph node of any room: floor service hatch, lid up — spark (amber
  sparks + WF_SOUND.zap), coolant (teal vapour), relay (flickering violet). Forge announces it; the deck map shows ⚠; GOALS tab lists
  them; droids' status line reports them (engine ship.fault). Tap ≤3.5 m → CIRCUIT TRACE (#wf-fix canvas: tap nodes 1→N, 5–7 nodes,
  timer 6+1.6N s; wrong = restart) → +80 cr, event 'fix'. CREW ORDERS (crew.js, ship-log ORDERS tab via WF_LIFE.addTab; only
  usable on the Bridge): battle stations / red alert (engine alert, #wf-redalert pulsing red vignette on every deck + WF_SOUND.alarm)
  / shore leave (droids wander Lounge + Media spots) / stand down; ShipCrew.decide override; persisted 'wf-order'; event 'order'.
  HOLODECK GAMES (`holo-games.js`, holodeck.html; SIM LIBRARY entries → simRun('range'|'duel'|'golf'), RESET/END PROGRAM close;
  hides #hd-house while running): TARGET RANGE 45 s (wireframe holo orbs spawned mostly in front of you; violet 10 / gold 50 / red
  −20; combo ×2 after 5; pays score/6 ≤ 120 cr), QUICK DRAW (hiveport holographic performer GLB as the duellist: READY… DRAW!, tap
  first, best of 5, early tap = foul; Brawl_Shove / Brawl_Recoil clips; win 60 cr), HOLO GOLF (3 holes, wireframe walls + the
  centre console as a solid circle; hold to charge an oscillating power bar, release to putt toward where you face; pays
  90−6×strokes). Taps: touch = tap point; desktop with pointer lock = screen centre. Bests 'wf-holo-best'; events 'holo', 'win:<game>'.
  SHOPS (station.html buildShops/SHOPS, 3 counters + K'Vetar traders (caste variants) on the TRADE LOUNGE west wall x −46,
  z −8.5/−5.5/−2.5, counter footprints added to extraSolids; tap within 6 m → #shop panel): CHITIN & THRUST = ship upgrades in
  localStorage 'wf-upgrades' {engine 0–3 (+12% SHIP_SPEED each: 400/900/1800), shield 0–2 (+1 hull bar: 600/1400), gun 0–2
  (SHOOT_DELAY ×0.8: 500/1200), paints[], paint} — minigame.html reads UPG at load; HULL PAINT is applied by shipskin.js itself
  (PAINTS copper/gunmetal/verdigris/gold/crimson → uPaintA/B uniforms; 300 cr each, switching owned ones is free; shows in
  Flight Mode + Ship View). PURR & PLENTY = treats ×5 (40), catnip ×3 (90; cat menu 'Catnip': +12% trust, zoomies). ODDS & ENDS =
  5 curios (idol/chart/geode/tooth/model) kept in cargo for the future Captain's quarters trophy shelf. Events 'shop', 'buy'.
  HIVEPORT GAMES (`hiveport-games.js`, loaded after station.html's script; uses window.HIVE = its NPCS/CROWD/AUD/play/talkTo/
  alienSay/toast/openP/closeP/makeActor + HIVE.male {base,kit}; station's talkTo calls HIVE_GAMES.talkHook): DANCE FLOOR (x ±6,
  z −9…−2.5 in front of the stage → .hg-btn DANCE → 32 beats + offbeats; clock = club loop's Web Audio time (AUD.musicAt) chosen ONCE
  per round, else page clock; PERFECT ±70 ms 100 / GOOD ±140 ms 50; nearby NPCs dance, cheer every 8 combo; pays ≤80 cr; 'wf-dance-best';
  event 'dance'). THE COMB (tap the 6 GAMING-zone consoles ≤5 m → #hg-den: Hive Dice vs the house, triples ×4 total / Honey Wheel
  amber·jade ×2, violet ×5; bets 10/50/100; 'gamble', 'gamblewin'). BRAWLS (every 2.5–5 min the closest pair of NPCs <3 m apart
  shove each other for 40 s: tap → Break it up (shrinking-ring timing ×4, ≥3 good = +40 cr, 'peace') / Join in / Walk away;
  soldiers & generals offer "Fancy a fight?"). FISTFIGHT #hg-fight: stance GUARD / OPEN! (PUNCH) / SWING! (BLOCK ≤0.6 s), you 5 HP,
  them 3–4 (bounty 5); win +50 cr 'brawlwin', lose ≤30 cr. NPC animation is driven by setting e.a.state (station's loop plays
  a.state every frame) with a.wait large to freeze the crowd agent. BOUNTIES: broker NPC (black-eyed general) + red BOUNTIES sign at
  (4.2, 20.6) by the airlock; one WANTED K'Vetar a day ('wf-bounty' {day, accepted, done}; name/crest/eyes/crime seeded by date);
  accepting spawns them as an extra crowd member with that variant; talk → "You're coming with me" → fistfight → 200 cr, 'bounty'.
  STARJACK (`cards.js`, lounge.html): a card deck + pulsing ring on the brass coffee table (world 0, 0.5, −1.1); tap within 3.6 m →
  #sj blackjack panel, suits ☀☾✦☄, 2 decks; dealer = a droid in the Lounge if any (else random), two more droids play their own
  hands (stand on 17) and quip in character (LINES per droid); bets 10/25/50, Hit/Stand/Double, Starjack 3:2. Events 'cards', 'cardwin'.
  SCIENCE SCANS (minigame.html updateScan/startScan/finishScan; SCAN button #scan / key G): planets within r×2.6+400 (loses lock past
  r×3.2+600), 5 s scan with teal rings; 3 daily ANOMALIES (seeded by date: gravitational lens / ion storm / derelict beacon / crystal
  shoal / dark-matter eddy) parked r×2.6+260 from random planets as spinning additive torus rings; results → 'wf-discoveries'
  (SCAN_FACTS per planet); planet 80 cr once, anomaly 150 cr; event 'scan'. Ship-log SCIENCE tab lists them; in the Library, tapping
  Vesper's Science console opens it.
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
  Route check: scratchpad lay.js validated every in-room edge against the scanned solids (0 hits). Old Lounge alien cats REMOVED (user, Nov 26: "just the new cats"); cats.js deleted (user, Nov 26).
- **HIVEPORT INTERIOR (Nov 26, the Hiveport prototype pack; README + concept in reference/hiveport-interior/)** —
  station.html is now the K'Vetar HIVEPORT (old Ember Room club kept as station-ember-room.html, unlinked). hiveport/rooms/
  Hiveport_complete.glb (96 × 44 m deck: nexus with the Resin Spire bar + holo stage, 8 side zones; hex-pattern ceilings added per
  layout room), hiveport/layout.json (rooms, lights, 42 crowd targets, obstacles → WAYFARER.extraSolids for mobile.js collision,
  bounds ±48 × ±22), hiveport/systems/crowd.mjs (pack's grid-A* crowd). NPCs = Kvetar_male/female_rigged.glb cloned per NPC
  (cloneSkinned) with KHR_materials_variants castes (civilian 45 / soldier 30 / commander 18 / general 7 %, 22 % female purple
  crest); 8 on mobile, 16 desktop; tap → dialogue.json small talk. Bartender behind the bar → drinks menu (Serve_Drink, glass in
  hand, tipsy wobble). Violet holographic performer dances on the stage. Job board + AIRLOCK at +Z (z 21.55) → minigame
  ?from=station. Audio: Web Audio context made at load; loops (m4a, mp3 fallback) decoded at once and every touch/click/key resumes the
  context until it runs (iOS unlocks only on touchend/click — the first version gave up after pointerdown, so no music on iPhone).
  MUSIC (user: always on, in the background; style "like Afterlife in Mass Effect 2" — that soundtrack is copyrighted, so it's an
  ORIGINAL loop rendered by tools/make-club-loop.py: 124 BPM dark electro-industrial, A minor/phrygian, 31 s seamless) =
  hiveport/audio/hiveport_club_loop.m4a (+.mp3) 0.30, up to 0.52 by the holo stage (the pack's dance/lounge loops are unused); crowd wash 0.3, hum 0.18. K'Vetar
  voices = WF_SOUND.alien (crowd member every 2–6 s within 22 m, talk/bar replies by caste). Crowd 12 phone / 20 desktop.
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
  navigation-core.mjs, nav/galaxy.json patched: planet previews use images/planets textures, glb null; station id 'Hiveport'); dynamic import(); its own renderer overlay. Confirm → travel(id): seated → launch(id); standing (from the
  navigator) → walks to the chair, sits, launches. minigame `?dest=` accepts map ids (Ferrum_Prime, Hiveport). Sounds:
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

## SPLIT-LEVEL ATRIUM REBUILD (user, Nov 26: "Full rebuild" to the Wayfarer Atrium Asset Kit v0.3 — reference/atrium-kit/, models/atrium/)
The kit = a two-deck re-layout (procedural blockout GLBs, 12 shared material names, ship-space coords, bow = −Z, port = −X).
Upper: Bridge (bow) · Holodeck + Captain's Quarters (port) · Crew Lounge + Media Nexus (starboard) · split-level atrium hall · Library (aft).
Lower: Firefly hangar (bow, opening jaw) · Medbay + Xenobiology (port) · Mess Hall + Maintenance (starboard) · Engine Room under the Library.
- [x] STEP 1+2 (Nov 26): index.html IS NOW THE ATRIUM (atrium.js; old corridor kept unlinked as corridor-old.html). Kit pieces loaded:
  Split_Hall_Upper, Atrium_Lower, Aft_Transition_Upper/Lower, Twin_Curved_Stairs; whole kit lowered 0.65 → upper floor y 0, lower floor
  y −5.95 (LOW). merge(): every kit model collapsed to one mesh per material (draw calls), re-skinned by material name (M table: copper,
  bronze, edge, steel, floor, wood, leather, cream, glass, amber, teal, blue) + a gradient PMREM env. Walls (buildWalls): walnut panels
  along layout.json corridor.outerPolygon on both decks (lower walls run up to the upper floor's underside, −0.23), gaps + lintels at doors,
  aft end open onto the Library apron; Library/Engine round outer wall r 10.2 at (0, 36); hall ceiling with the skylight cut out; apron
  ceiling ring. WALKING: wayfarer-mobile collide:false; each frame a DOWNWARD RAY onto the walkable meshes (WALK names: Floor|Landing|
  Crossover|Stair_tread, DoubleSide) — step up ≤ 0.5 / down ≤ 0.7 accepted (= stairs), else back to the last good spot; #player rig y eases
  to the floor. Doors (DOORS in atrium.js) at the kit thresholds: upper bridge (0,−24) · library (0,25.8) · holodeck (−4.6,−14) · quarters
  (−4.6,9, locked) · lounge (4.6,−14) · media (4.6,9); lower (y −5.95, all locked until their pages exist): hangar, engine, medbay, xeno,
  mess, maint. door.js PORTALS.corr + CORRIDOR box + CORR_YAW updated; corr-*.jpg recaptured. crew.js corridor graph = the upper
  walkways (x ±3.35) + crossovers; Engineering/GUIDE console on the port walkway (−4.1, −3). life.js map: atrium outline + opening + sealed
  Captain's Quarters; rooms re-placed by their doors. repairs: corridor faults stay on the walkways (old ones over the opening dropped).
- [x] STEP 3 (Nov 26): kitroom.js + quarters/medbay/xeno/mess/maint/firefly/engine.html (<body data-room>, wf-kitroom): the kit room GLB in
  ship coords, floor moved to y 0, shell (Trim|Wall|Rib|Light_strip|Ceiling|Door_header|…|_floor) merged per material, furniture kept as
  separate re-skinned meshes (mobile.js collision); bounds = layout.json room polygon (Engine Room: circle r 9 + reactor keep-out r 3.2);
  Firefly_Pathfinder_WF01 parked at Hangar_Center_Anchor. door.js PORTALS quarters/medbay/xeno/mess/maint/firefly/engine (corr frames carry
  y −5.95 for the lower deck: frameMatrix/create honour frame.y; corrSpace = lower atrium box), photos captured; atrium doors unlocked;
  WF_KIT (atrium.js) = shared mats/envMap/merge(root, walk, keep). Halcyon: "take me to the medbay/engine/quarters/hangar…". Not yet:
  crew/map/repairs on these pages (crew.js + life.js PAGE tables), room jobs (medbay recovery, xeno specimens, galley, reactor, landings).
- [ ] (was STEP 3) lower-deck room pages from the kit GLBs (Firefly_Hangar, Medbay, Xenobiology, Mess_Hall, Maintenance_Storage,
  Engine_Room_Halcyon_Lower) + Captain's Quarters (upper) — restyled; unlock their atrium doors; PORTALS entries + photos; crew/map.
- [x] ROOM JOBS (Nov 26, kitroom.js ACTIONS/JOBS; tap furniture ≤ 4.5 m, pulsing amber floor ring; glass #kr-panel bottom sheet):
  quarters Bed=sleep (blackout, Halcyon good-morning, 'sleep') · Locker=trophy curios (idol/chart/geode/tooth/model) · Console/Table=Captain's
  log textarea ('wf-captains-log', 'log'); medbay Bed=check-up ('medbay') · Console=record; xeno Specimen/Console = 'wf-discoveries' list
  ('xeno'); mess Replicator = 4 dishes ('cook') + cat treats ×3 for 20 cr; maint Console = 'wf-faults' ('maint'); engine Console = core
  status + spin-up jump (wf-warp.next = now+25 s, 'reactor'); firefly = LAUNCH: Triangular_Jaw_Dock (Jaw_Open via AnimationMixer) with the
  Firefly parented to Firefly_Docking_Anchor (gear retracts), camera on the starboard side, stars below, then minigame.html ('launch').
  window.WF_ROOMJOBS for tests. life.js PAGE knows the new pages (room:<id> events); MAP has UPPER/LOWER DECK tabs (renderLower: layout.json
  polygons in ship coords, engine ring, twin stairs, you) and the Captain's Quarters is a tappable room on the upper map with your arrow.
- [x] Doors (Nov 26, user screenshot: the sky showed round every frame): door.js create() adds a dark RECESS behind every door (back plate
  z −0.9, sides ±1.22, top) on every page; atrium walls cut in 10 cm strips, doorway gap ±1.05.
- [x] Library side doors (old SONS OF NAPHTALI / HAPLOGROUPS wings) = 'STAIRS · LOWER DECK': unlocked, walk/tap through → index.html?stairs=
  starboard|port (library-local −x = ship starboard) → atrium spawns on that staircase's upper landing (±10.2, 31.6) facing down it.
- [x] CREW LOUNGE upgrade (lounge-plus.js; user: "pretty lame", crossed out the plaques + white slot lamps → removed): ALIEN AQUARIUM in the
  port wall (deg −103…−67, glass r 8.25, water shader back r 8.85, kelp, 10/18 glowing fish, a ray, bubbles, teal light), STAR HEARTH on the
  starboard wall (deg 86, copper surround, additive flame sprites, flickering light, mantel clock/frames), 3 brass PENDANT lamps over the
  table, BAR CABINET by the door (deg 132, lit bottles). Lounge photo recaptured.
- [x] FIREFLY WF-01 v1.0 (Nov 26, user's Firefly_WF01_Rebuild_Update.zip; README/VALIDATION/integration.mjs/preview in reference/firefly-kit/):
  models/atrium/Firefly_WF01_Mobile.glb (44k tris, own PBR copper — NOT reskinned; root sits on the jaw dock's Firefly_Docking_Anchor; clips
  Landing_Gear_Deploy/Retract, Quarantine_Open/Close; cabin built in: hide Exterior_Shell + Gear_* to see it); the kit's patched
  Lower_Deck_Complete/Wayfarer_Dual_Deck_Assembled replaced ours; old Firefly_Interior.glb removed (HD 120k-tri model not copied: phone cost).
  Hangar (kitroom.js): tap → BOARD (shell hidden, eye at Cabin_Spawn, look-only) → cabin menu: pilot's seat & LAUNCH (camera rides
  Pilot_Anchor out through the opening jaw) / step out; or watch the launch from the hangar. Launch → minigame.html?ship=firefly
  (FIREFLY flag: Firefly GLB ×0.85 in the player group, gear retracted, nacelle plumes from its bbox) and its exit → firefly.html?from=fly
  (spawn beside the cradle).
- [x] LIVING FELINES 2.0 (Nov 26, user's Wayfarer_Living_Felines_2_Prototype.zip; README + install_felines.py in reference/living-felines-2/):
  models/crew/Kitty_{Ember,Nimbus,Orbit,Pixel}.glb replaced (rigid-part rigs, 26 clips: Idle Walk_InPlace Trot Sprint Sleep Groom Play Petted
  Yield Stretch Pounce Jump Land Knead Sit Stand Sniff LookAround TailFlick EarTwitch Eat Drink Roll Chirp Crouch Wake; ~1.5 MB each). The
  installer's patches were applied BY HAND (its anchors matched; no backup dir in the repo): crew.js kitty ?v=2, missing-clip warning, cat
  y from n.pos.y, walk clip time-scaled to speed; crew-engine.mjs (now ?v=2) cats accelerate/settle, rest = Sleep 20–75 s, idle variety
  (Groom/Stretch/Sniff/LookAround/Knead), play variety (Play/Pounce/TailFlick/Roll). Our cat-play calls' Run_InPlace → Sprint (new rigs lack it).
- [x] DROID UPGRADE V2 (Nov 26, user's Droid_Upgrade_V2.zip; README/install.py/build_models.py in reference/droid-upgrade-v2/): six new
  articulated Droid_*_Living.glb (titanium/graphite/copper, role-coloured plates, 12 clips incl. Run_InPlace; old 'Inspect' clip gone, unused)
  → crew.js ?v=2. crew/droid-v2.mjs (vendored) + its install.py patches applied BY HAND, merged with Felines 2.0 where both touched the same
  lines: engine imports droid-v2 (dutyRecall on red alert, stride() role-tempo acceleration for droids while cats keep their own, records
  console_work / duty_complete / seated_home, no socialising during alerts, talk interrupts work and resumeDuty() resumes it, dialogue
  extension: role greetings + 'Recent duty log' / 'Maintenance register' / 'Personal log' choices); crew.js mixer: droid walk → Run_InPlace
  above 1.65 m/s (warp-alert dash) with time-scaled gait; engine import ?v=3. tests/droid-v2.test.mjs (node --test) 5/5 pass.
- [x] PLAYER CHARACTER MK II (Nov 26, user's Player_Character.zip; README + installer in reference/player-mk2/): installer RUN (check, then
  apply) → avatar.js loads models/player/explorer_mk2.glb (≈1.86 m articulated suit, Idle/Walk_InPlace/Sit_Down/Stand_Up/Seated_Idle) with
  explorer_command.glb kept as the model-error FALLBACK; smoother speed + walk blend, footsteps on clip cadence; 3rd-person camera
  clearance = 15 Hz ray probe against real room meshes (old corridor rectangle removed), retracts instantly, eases out. The installer's
  avatar.js?v=player-mk2-2 tags were normalised back to our date version. Headless tests (3rd person): atrium upper walk, stairs (camera
  pulled in to ~1 m), lower deck, Firefly cabin, Bridge sit → seated → stand; no errors. NOT verified: real iPhone Safari frame rate
  (swiftshader isn't representative), seat/hip calibration in the chair.
- [x] ATRIUM v0.4 (Nov 26, user's Ship_Layout_Problems.zip; installer + helpers in reference/atrium-v04/): installer dry run → apply (anchors
  matched). Upper stair landing extensions (walkable), movement swept in 9 cm segments (never onto unsupported floor), walking withheld until
  every required asset has loaded (missing asset → 'ATRIUM LOAD ERROR', frozen), skylight-only warp pane (V04_Skylight_Only shader; the old
  free hyperspace tunnel is gone from the atrium), engine threshold z 26.6 + lower core r 9.4, room exits pass ?fromRoom=<id> (return deck/
  heading without the referrer), Library stair shortcuts land on the new landings. Its ?v=atrium-v04 tags were normalised to the date version.
  ACCEPTANCE (headless, scratchpad acc.js/acc2.js): both staircases down AND up at a 15 fps step (0.17 m/frame) with no stall/void; walking into
  the opening blocked; crossover loop OK; Library shortcuts port/starboard; returns from all 12 rooms land on the right deck at the right door
  facing away; warp streaks only through the skylight; missing Twin_Curved_Stairs → load error + frozen; Engine door z 26.6, spawn outside the
  core. NOT done: live iPhone Safari.
- [x] FIREFLY v1.1 CABIN (Nov 26, Firefly_Cabin_Upgrade_v11.zip; reference/firefly-v11/): models/atrium/Firefly_WF01_Mobile_v11.glb (64k tris,
  textured, 16 clips) in the hangar with v1.0 Firefly_WF01_Mobile.glb as load-error fallback; patched deck GLBs replaced; crew/firefly-cabin.mjs
  (= cabin_runtime.mjs): six live displays fed by real state (cabinState: NAV last world/berth, SYSTEMS upgrades + faults, MISSION wf-mission,
  QUARANTINE wf-discoveries, HATCH docked/pressure, COMMS credits), boarding plays Boarding_Hatch_Open then closes; cabin menu toggles
  Locker_1/2/3, Quarantine, Work_Tray, Mission_Display and shows each display. Flight Mode keeps the lighter v1.0 model.
- [x] CREW SOCIAL INTELLIGENCE V3 (Cat_droid_Intelligence_V3.zip; reference/crew-social-v3/): crew/social-controller.mjs attached to the ONE
  CrewEngine (attachSocial, bonds saved in 'wf-social-v3'; its 6 tests pass) + crew/social-behaviours.mjs (attachBehaviours wraps decide/
  arrive/update/setShip — no second loop): petting contact alignment (cat at droid hand reach 0.55 / seated 0.68, facing; purr + chatter with
  cooldowns), FEEDING (hunger rises; bowl node l_bowl at the Lounge feeding station, engine lock 'bowl', Eat, hunger drops only after eating,
  released on finish/interrupt/alert), NAP beside a seated/working droid (wakes when it leaves), FOLLOW the Captain (trust ≥ 0.6, hysteresis
  2.6/1.6 m, same room only, 60 s; Rub_Legs/Sit on arrival), PLAY chase (3 rounds, engine-time phases, Pounce/Roll), EMERGENCY (cancel all
  social + reservations, cats shelter in Lounge rest spots and Crouch; droids keep Droid V2 duties). Verified on the live Lounge page with a
  fast-forwarded engine: all of the above. NOT done: true IK hand-on-head contact, live iPhone.
- [x] ANIMATION LIBRARY V6 (reference/animation-v6/; crew/anim-v6/ adapter + cat/droid JSON): crew.js addV6() binds the procedural clips to
  the real joints (cats: the pack's felineMap; droids: Torso/HeadPivot/L|R_Shoulder/Elbow/Hip/Knee) and adds ONLY clips the GLB lacks
  (authored win): cats +17 (Run, Stair_Up/Down, Rub_Legs, Feed…), droids +33 (Salute, Scan, Repair, Recharge, Emergency_Run…). Tests 4/4.
- [x] ARCHITECTURE V8 INTERIORS (Nov 26; arch-v8/ = the pack's architecture.mjs, decking.mjs and 21 textures): interior-v8.js on all 13
  interior pages re-runs a material pass while models stream in (24 passes, 0.5 → 1.5 s; re-checks when A-Frame swaps a material): warm
  colour/emissive materials → V8 palette (graphite/gunmetal/charcoal; thin metal ≤ 16 cm → copper accent; amber glows → white, violet→blue
  stays), surfaces ≥ 10 m² get V8 base/normal/rough maps with planar UVs (floor kind by page: bridge/lounge/engineering/corridor; walls;
  ceilings) and envMapIntensity 0.22; warm lights → neutral white at ×0.5 (hemisphere ×0.7); warm fog → neutral. Skips: userData.wfPortal
  (crew, cats, avatar, portals), keepLook (Library shelf faces), #brain, Firefly Exterior_Shell/Gear_*, ShaderMaterials, transparent/additive,
  MeshBasic (screens, TV, signage), small canvas maps (screens/art). door.js frame paint (v8Paint → gunmetal) and leaves (v8Tint, glass kept).
  All portal photos recaptured. NOT used yet: the kit's skylight canopy / wall / portal builders (the shader pass covers the look).
- [x] INTERDIMENSIONAL TV V10 (Nov 26; reference/tv-v10/): installer run (dry → apply; backups in .wf-tv-v10-backup/, git-ignored) —
  alien-tv.js replaced + wayfarer-tv-v10/programs.js (16 channels, shared wall-clock schedule, 3 storylines each), remote GLB on a floor dock
  at (−2.44, 0.145, 4.3) by l_r1, control panel (power/mute/last/ch±/vol±/cats), cats autonomously press the remote. Its test passes
  (48 episode draw paths); live page: all 16 channels tune, remote present, panel opens. Cache tags normalised to the date version.
- [x] FURNITURE UPGRADE 01 (Nov 26; furniture/ = 28 GLBs + manifest; reference/furniture-01/): furniture.js (WF_FURN.place / swapEntity; pieces keep
  their own V8 materials via userData.v8Skip, stay solid for mobile.js). Lounge: cat_tree / cat_sleep_pod / cat_feeding_station swapped at the
  old prop transforms. Library: library_writing_desk at the study corner + desk_chair. Kit rooms (kitroom.js SWAP/swapFurniture): kit blockout
  hidden but still tappable for room jobs, pack piece at the same spot (long axis matched, front toward the room centre, chairs face the
  nearest table): Quarters bed/5 lockers/desk/chair, Medbay beds, Mess 2 tables/4 chairs/bar counter, Maintenance lockers/utility table.
  Bridge chairs/consoles and Media seats NOT swapped (droid seat calibration, command chair).
- [x] MEDBAY V1 + CAPTAIN'S QUARTERS V1 (Nov 26; rooms/medbay, rooms/quarters; docs in reference/medbay-v1, reference/captains-quarters-v1):
  medbay.html + quarters.html now run roompack.js (wf-roompack) instead of kitroom.js — each pack mounted at its own local origin, entrance
  +Z; door.js PORTALS medbay room (0, 3.4, rot 180) / quarters room (0, 3.85, rot 180) with matching space boxes; the packs' own door
  leaves/buttons are REMOVED (one door system); WAYFARER.bounds = room rectangles; quarters colliderBoxes → WAYFARER.extraSolids.
  Medbay: installMedbay + MedbayState (taps via R.pick → bioscan, 12 s recovery pod, xeno vet bed, lab, console/monitor status, supplies →
  'medkit' cargo item, privacy screen, med droid dialogue + waypoint walking); events → toasts + robot voice, 'medbay' life event.
  Quarters: installCaptainsQuarters with hooks (onPanel freezes walking, exit → atrium, galaxy table → ship-log map, sleep fade, TV/outfit/
  cat notices) — its own panels/arcade/journal/wardrobe/refreshments/discoveries; saves 'wayfarer.captain.v1'; star field through the open
  ceiling aperture. Not yet: cats actually visiting the Quarters (crew.js has no quarters graph), real outfit change on the Mk II suit,
  planetside pass-out → wake in the Medbay recovery pod.
- [x] BRIGHT INTERIORS V9 (Nov 26, user: "lighting across both decks is too dim"; reference/bright-interiors-v9/): its patch applied to
  interior-v8.js (guarded, idempotent) — converted warm lights keep their authored intensity (no more ×0.5), hemisphere ground lifted to
  0x858b93, one non-shadow neutral fill HemisphereLight 'WF_V9_InteriorFill' (0.65) per interior scene. Exposure unchanged (1.1).
  Renders: atrium, Bridge, Lounge, Mess brighter, no clipping. NOT checked on iPhone.
- [x] PROPS PASS (Nov 26, Furniture 01 leftovers; furniture.js swapEntity now keeps risers): Media 8 cinema_seat → cinema_recliner (back row
  on its riser); Library reading_armchair + side_table by the study desk; Lounge 2 bar_stools at the bar (deg ~128/136, r 7.35) + cat_ramp
  by the tree; Holodeck holodeck_control_desk (port, by the planner) + holodeck_utility_table (starboard); atrium 4 wall_service_terminals
  (both decks, x ±4.55). Not re-done: portal photos of Media/Lounge/Library/Holodeck (props only), maps/deck.json footprints.
  UNUSED UPLOADS (by choice): Character Engine V5 (motor migration), Part 01–03 kit GLBs (0.6–1.3 MB each), Firefly/Spaceship HD, Medbay
  assembled preview, bronze TV, orbital station interiors, Kvetar 140 variants, V8 geometry builders, remaining Furniture 01 pieces.
- [x] INTERACTION V11 (Nov 26; installer run, backups in .interaction-v11-backup/ git-ignored; interaction-v11/core.js + runtime.js; its 7
  tests + installer test pass): the Mk II avatar reaches out to press door buttons, crouches to pet/feed cats (trust/treats on contact),
  head/upper-body gestures in dialogue; WAYFARER.interaction.start(kind,{target,contact,finish}). Pages load ?v=11.0.0 tags.
- [x] OTHER ALIEN SPECIES (Nov 26; Argo species V2 pack → hiveport/species/*_v2_01.glb, docs in reference/species-v2/): Khorath, Velari,
  Thalassari, Morren, Nethrak, Serva-7 join the Hiveport crowd (3 on phones, 6 desktop) as CROWD agents with the K'Vetar; Walk aliased to
  Walk_InPlace; tap → talk panel titled with the species and its own line. Only variant 01 of each is loaded.
- [x] DIRT REALISM (Nov 26; Wayfarer Realism V9 → realism/src/realism.mjs + only the small decal/sprite PNGs; docs in reference/realism-v9/):
  realism-loader.js on all 13 interior pages (2.5 s after load): dust-mote volume around the spawn, 7 (14 in engine/maint/hangar) grime /
  scuff / oil / dust / microbe decals on real floor hits, boot prints while walking the dirty decks (engine, maint, firefly, lower atrium),
  vent smoke in the Engine Room and Maintenance. Pack footstep audio OFF (avatar already steps). Floor rays only hit real meshes (sprites
  broke raycasts). The pack's 14 MB of PBR material textures are NOT used.
- [x] STAIRWELL PASS (Nov 27, user videos): atrium.js buildUpperCore/buildStairShaft/buildLowerCore/buildBrainTank (shaft walls, lighting, brain visible through glass windows, base door 'lowerhall', wallBlocked); Library wing doors = rot ±79.1, noRecess, preview photos wing-*/lib-stairs-* (tools/capture-stairs.js), ?wing= arrival spawn. Z-FIGHT FIX: kit landings +1.2 cm, V04 landing y 0.03, skylight pane 3.40, apron ceiling = ShapeGeometry clipped to z>=25.7 with polygonOffset, camera near 0.12. Headless: stair top/mid clean. NOT verified: live iPhone, full walk-through of lower ring -> hall door. NOT pushed.
- [~] UNIFIED CORE (Nov 27; CONCEPT ART reference/atrium-concept-v031.png = ChatGPT blueprint: tall green hydrogel chamber, brain at mezzanine height, teal-lit reactor base, curved twin stairs; chamber now y −4.6…+2.9, brain y −0.4; user: brain over reactor as ONE structure; atrium.js buildCore, replaces buildBrainTank/gel-tank in the atrium): glass hydrogel chamber r 5 (y −4.6…0) with the brain (scale 0.55, y −2.3), plasma-column reactor (ShaderMaterial, r 1.35) from a pit (y −11.5) up to the chamber base, spinal stem into the brain, 8 conduits + 4 bronze buttresses, walkable engineering gallery ring r 5.55–9.6 at the lower deck (mesh Floor_gallery, rail + pit edge block movement), mezzanine underside ceiling at y −0.23. The 'engine' atrium door is GONE: the old doorway (0, 26.6) is an open entrance (movement: lower deck may cross r 9.4 only there). Headless: walk door → gallery OK, pit edge blocks. engine.html is now unlinked/stale. NOT done: Library mezzanine merged into the atrium (Library page + its own brain still separate, door at (0, 25.8)), eels, gallery doors to lower rooms, crew graph + Stair clips on both flights, brain still pink-white (hydrogel tint faint), live iPhone. NOT pushed.
- [x] STAGE 2 — MEZZANINE (Nov 27, atrium.js buildCore): the 'library' atrium door is GONE; the hall gap (0, 25.8) opens straight onto a walkable mezzanine ring (Floor_mezz, r 5.85–10.45 at y 0.02, inner rail r 5.85, ceiling disc r 10.2 at y 3.24 + cove rings, 4 point lights). Library-wall stair doorways MOVED from θ ±1.38 to ±2.02 (= the landings at (±9.1, 31.5)); upper-deck movement may cross the r 10.2 wall only at the hall gap and those two doorways. Hydrogel = dark green NormalBlending cylinder (additive washed out to white). Headless walk: hall → mezzanine → ring → stair door → landing OK. NOT done: Library contents (bookcases, scrolls, WP console, study desk, star map) are still ONLY in library.html (its door is now gone from the atrium, page reachable by the Library wing doors/Halcyon only); brain still pink-white; crew graph + Stair clips; eels; gallery doors; live iPhone; portal photos corr-library/corr-engine are stale. PUSHED Nov 27 (1518854).
- [x] CREW ON THE CORE (Nov 27, crew.js buildLayout 'ATRIUM CORE' block; nodes carry y): mezzanine ring mz0–9 (r 8.1, y 0; gap node mz_gap off c_ld), stair doorway st_d{p,q} + landing st_l{p,q}, 8 flight nodes per stair (r 11.35, y from the probed tread profile −0.7…−5.95, end → lr_1 / lr_9), lower ring lr_0–9 (r 10.6, y −5.95), gal_in (0, 26.6) + gallery ring gal0–11 (r 7.6). Droids and cats now take n.pos.y (was cats only); cats on a slope switch to Stair_Up / Stair_Down (V6 clips) and back to Walk_InPlace. Headless: BFS reaches every new node; a cat and a droid walked mezzanine → stairs → lower ring → gallery (y −5.95), 118 s / 82 s. NOT done: aliens (Hiveport-only), life.js map dots for z > 30.
- [x] LIBRARY MOVED TO THE MEZZANINE (Nov 27, PUSHED c560723, `atrium-library.js` loaded by index.html before starmap.js; library.html now redirects to index.html?mezz=1 unless ?old=1 — file kept, nothing deleted): 18 painted bookcase bays on the outer wall (shelfTexture copied), 4 scroll pedestals (same texts as the old scrolls; #wf-scroll glass panel), Science/WordPress console at θ 2.28 (WF_WP.open), study corner at θ −2.3 (writing desk, chair, armchair, side table, microscope / vial rack / hourglass / armillary), STAR MAP lectern at (0, 43) — starmap.js is now config-driven (WF_STARMAP_CFG {x,z,Y,S,pitch,cx,cz}; galaxy unfolds above the brain at y 2.95, scale 0.5, view pitch 0.42 turned toward the core). `?mezz=1` spawns at the hall mouth (0, 28.6) facing the brain; ai.js 'brain' and life.js map Library entry point there. The Library's own dome/lamps/glass floor are NOT recreated. NOT done: Library brain interactions (tap brain → Halcyon), eels, portal photos, scroll-reading from the player's real vault.
- [x] CORE POLISH (Nov 27, atrium-library.js core(); NOT pushed): hydrogel tint on the brain (vertexColors materials colour 0x5fa87a, green sheen, env 0.35, re-applied every 1 s) + 3 (phone) / 5 eels (InstancedMesh, 22 segments, orbits r 4.05–4.75, y −3.4…1.3, component wf-core-eels). NOT done: gallery doors to lower rooms (lower rooms are reached via the hall's 'lowerhall' door; no geometry for gallery doors), portal photos corr-library/corr-engine (unused by the atrium now).
- [ ] CHARACTER ENGINE V5 (reference/character-engine-v5/): NOT integrated — it replaces the player/NPC motors ("never run both motors");
  needs a deliberate migration of mobile.js + atrium walking + crew movement. Kept for that.
- [ ] Crew (crew.js PAGE/OFF/graph) + repairs on the new rooms; lower-deck goals; planet landings from the Firefly.
- [ ] STEP 4: exterior jaw (Wayfarer_Exterior_Mobile_Animated_Jaw.glb) + Firefly launch (Triangular_Jaw_Dock, Firefly_Pathfinder_WF01).
- [ ] Lower deck on the ship-log map; crew using the lower deck; tank see-through to the Engine Room.

- [x] ICON v3 + SHARE IMAGE (Nov 27): reference/app-icon-source-v3.png → icons/ (cropped 7.5 % inset) linked ?v=3; Home Screen title 'SS WAYFARER' (manifest name/short_name + apple-mobile-web-app-title); share image reference/share-image-source-v2.png → images/wayfarer-share.jpg 1200×630 (og:image ?v=3). Simplified art = icon/favicon, detailed art = link previews.
- [x] ATRIUM SEGMENTED (Nov 27, user: loading screen too heavy; "Library page + core into its own room"; NOT pushed): atrium.js no longer builds the core/mezzanine (buildCore left as dead code; atrium-library.js file kept but not loaded; index.html drops brain/wp-console/atrium-library/starmap scripts; lower core wall = solid, no brain windows). Doors: 'library' (0, 25.8, upper) → library.html (redirect removed; its own dome/glass floor/brain/shelves/scrolls/starmap/wing stair doors again) and 'core' (0, 26.6, lower, tint teal) → NEW core.html + core-room.js (room-local: gallery floor y 0 ring r 5.55–10.45, hydrogel chamber r 5 y 1.35–8.85 with the brain at y 5.55 scale 0.55, plasma reactor in a pit −5.55, 8 conduits, 4 buttresses, 3/5 eels, wall r 10.2, ceiling 9.4, wf-core-clamp keeps you off the pit r<5.85; door.js PORTALS.core room (0, 10.65, rot 180)). libstair doors moved to the stair-top wall gaps (±9.195, 31.59, rot ±115.7). crew.js ATRIUM CORE graph removed. ai 'brain' → core.html, life.js map/PAGE updated; portal photos room/corr-core + library recaptured. Headless: atrium 223 draw calls / 41k tris (was heavier), core 111 / 165k, doors → library.html / core.html, ?stairs= landing + libstair → library.html?wing=. NOT verified: live iPhone load time, crew/repairs on core.html (none), life.js lower-deck map ring for the core.

- [x] STAIRS PASS (Nov 27, user: stairs not right, rail across the Library door, door preview wrong; NOT pushed; atrium.js ?v=20261127ze): stairLook() = graphite treads/risers, thin copper balusters, pale-blue handrail line (was blown-out white); shaft walls/partition v8Skip + darker; shaft lights 5→2.2; clearDoorRails() drops kit rails/posts within 2.6 m of the libstair doors; V04 landing inner rail removed; capture-stairs.js frames moved to the real doors (±9.195, 31.59, rot ±115.7) and wing-*/lib-stairs-* recaptured. CLOSED TOWER (user sketch, 'whole stair shaft floor to ceiling'; PUSHED 0df9504): atrium.js buildStairShaft adds ShaftRoof (D-shape at y 3.24, hole r 10.2) + CoreLid (disc r 10.25) — the Library wall had no roof, looking up from the stairs showed black void; ray test from the flights: 0 escaping rays. ?v=20261127zg.

## BIG ROADMAP (user, Nov 26 — second wish list; supersedes batch 9 "quarters/galley behind the Library wing doors")
Record of everything asked for; tick items off as they ship.
- [x] MENU BAR iOS-style (`menubar.js`, loaded last on every #wf-btns page): clock + 💰 credits top-left; 📍 map (Google-pin) · 📋 log · 🧠 Halcyon · 📖 manual · 🔊 sound · ⚙️ settings drop-down (#wf-set: 🥽 VR/gyro, 📐 level, 👤 1st/3rd — the original mobile.js / avatar.js buttons moved in); re-dresses every 700 ms
- [x] Invisible obstacle in the middle of the hallway = the corridor console's dyn box computed before its world matrix existed (crew.js updateMatrixWorld first)
- [x] VOICES: sound.js WF_SOUND.speak(text, 'robot'|'intercom'|'kvetar'|'ai'): device TTS with the most robotic voice available (Zarvox/Trinoids/Fred/Ralph, else pitch 0.35) wrapped in chirps; 'intercom' adds crackle + two-tone chime; K'Vetar = a click/chitter per word. Used by droid dialogue, Forge fault reports, red alert, orders, Starjack quips, Flight Mode hails (Vesper = intercom, Hiveport Control = K'Vetar), Hiveport conversations
- [x] Eels avoid the brain (pushed off a padded ellipsoid, orbits r 5.9–7, bands above/below/middle); brain hemispheres now meet at a narrow fissure (medial extent 0.07·W, GAP 0.012) + MeshPhysical sheen
- [x] COMMAND DECK: no bookshelves (wallDisplays() instead of plantShelfAt: per wall bay a 1.5×0.84 LCARS screen, two small ones and a status strip in bronze frames, 6 shared lcars textures); NAVIGATOR = giant barred-spiral Milky Way hologram (buildOrb: 14k / 6k-phone stars, R 3.3, tilt 0.78, bar + 4 log-spiral arms, YOU-ARE-HERE cyan pulse, cone + 3 rings) over a bronze emitter at the bow (ORB_Z −6.4, NAV_C y 2.35); blooms while navigating (NAV_FX.want); the kit Planet_Selector GLB is no longer loaded; tap → sit, then the galactic map
- [x] Ship/deck map (life.js renderMap): blueprint SVG 520×860 — true room shapes (Bridge outline from WAYFARER.bounds, round rooms, square Holodeck grid) with REAL furniture footprints from maps/deck.json (baked from each page's mobile.js solids scan, contained boxes merged; REBAKE when a room's furniture changes), corridor + runner + bookcases, doorways, hull with engine pods, navigator galaxy; LIVE layer every 0.4 s: you (cyan arrow = facing), droids/cats with names, blinking ⚠ faults; rooms scale SR 7 px/m, corridor stretched KC 20 px/m
- [x] Lounge ALIEN TV (`alien-tv.js`): 7 ORIGINAL canvas-drawn channels (KNN K'Vetar news + ticker, Glorpo's Kitchen, Nebula Nature Hour, Cryovale Weather, Bioship Grand Prix, Mandible Mints ad, The Talking Rock), scanlines, tap = static burst + next channel, babble/jingles only within 8.5 m; the old browser panel is no longer opened. WINDOW: wall gap ±28.6° (theta-start 208.6 / length 302.8), 8 × 4.4 m rounded-rect opening with bronze extruded frame, amber glow line, two mullions
- [~] More props all over the ship [~ corridor done: index.html buildArt() = 4 original painted canvases (paintCanvas: planets/nebulae/ridges) in bronze frames with picture lights + potted plants in the freed alcoves L −3, L 3, R −9, R 9; other rooms still to do]; Library bookshelves with more variety/colour [x] (library.html shelfTexture: 5 painted variants on plain three.js planes — a-plane faces came out blank white on iPhone); FEWER bookcases in the corridor [x] (SHELVES 7 → 3: L −9, R 0, L 9; maps/deck.json shelves updated)
- [ ] BELOW DECK (new level, industrial alien vibe) for all new rooms (quarters, galley, medbay, cruiser hangar…); the two Library back doors become two STAIRCASES down to it
- [x] STAR GARDEN → `starmap.js` (library.html only): bronze STAR MAP lectern at the centre of the glass floor; tap → beam to the dome, galaxy (16k / 7k-phone stars, bar + 4 arms, R 7 at y 6.1 under the dome) unfolds while your view tilts up to pitch 1.25; every nav/galaxy.json system as a labelled star with its worlds' emoji, cyan WAYFARER-IS-HERE ring at the 'wf-near' system; drag to spin/tilt, wheel/pinch zoom; ✕ CLOSE reverses. Holodeck no longer loads stargarden.js (file kept, unused) and its SIM LIBRARY entry is gone
- [x] NAVIGATOR redesign (bridge.html buildOrb: ORB_Z −3.5, ORB_S 2.0 on its own bronze plinth r 1.64 joined to the dais by a neck; NAV_FX holo cone + 3 gyroscope rings + rising sparks that spin up while navigating (NAV_FX.want); tap → WF_CMD.navigator() = sit then openNav; seated #cmd-hud: Cruising (wf-mode2 explore + launch) / Hunting (combat) / Ship (hangar.html?from=bridge, back link → Bridge) / Navigate / Stand; keys N L K X; crew ring bulges round the plinth): much bigger, at the front of the helm, integrated with the captain's chair (not separate consoles); nicer + animations; planets pickable only once inside the navigator; never shoved through the chair; tapping the navigator = sit in the chair. Tapping the CHAIR → menu: Cruising (peaceful) / Hunting (fighter) / Ship inspect (view ship) / Navigate (turn to the navigator, pick a destination, travel)
- [x] Galactic map (nav/galaxy-map.mjs patched, ?v=2): the Wayfarer GLB (shipskin) marks your position; lit 32×20 sphere stars; system-view planets wear their textures; planet emojis in the lists + ✓ for visited ('wf-visited', written by minigame checkVisits + station dock)
- [ ] HOLODECK = 3D interactive HOUSE BUILDER filling the whole room (Star Trek holodeck × Sims house builder × Home Depot), the main purpose of the Holodeck
- [~] Crew: droids and cats get out of the player's way (crew.js dodge(): anyone idle/walking within 1.3 m sidesteps away from you and off your heading) [x]; always ≥2 cats in the Lounge (ShipCrew.decide cat rule) [x]; more droids throughout the ship [ ]
- [x] Ship hum quieter (0.045) and on at the first touch: the real cause was iOS's silent switch muting Web Audio until an <audio> file played — sound.js now sets navigator.audioSession.type='playback', plays a silent clip on the first touch, creates the context at load and resumes it on every touch/click/key
- [x] Random light-speed jumps: crew.js warpAlert() reads/rolls the shared 'wf-warp' schedule ({until,next,at}); 20 s before a jump until 6 s into it: #wf-redalert (red multiply tint + pulsing vignette) on every deck, klaxon (WF_SOUND.alarm), every droid not seated runs home at ×2.6 speed
- [x] SHIP AI = HALCYON (`ai.js`, every ship page): eye icon in #wf-btns, key I, tap the Library brain; offline answers from live state (status, crew whereabouts, advice, next jump, credits, goals), commands (take me to X, open manual/map, red alert on the Bridge), manual search fallback; speechSynthesis voice ('wf-ai-voice'); brain.js flickers while it talks (window.__aiTalk); event 'ai'
- [x] Library console (Vesper's Science console) = the user's WordPress site sonsofnaphtali.wordpress.com (`wp-console.js`): #wf-wp panel, LIVE SITE iframe by default (its own scrolling/animations) + READER tab (public-api.wordpress.com v1.1 posts?type=any, cards fade/slide in via IntersectionObserver, full articles, scroll progress bar), ↗ opens the site; the console's 3D screen shows the masthead + latest title. Site had 0 posts on Nov 26 (pages-based). Science log stays in the ship log SCIENCE tab. [ ] other consoles
- [~] Library tank: fewer bubbles (120), lightning every 10–24 s and dimmer, EELS (brain.js gel-tank: InstancedMesh tapered segments placed by arc length along each eel's path history, glowing eyes) [x]; partly see-through down to the below deck [ ] (with Phase D)
- [x] Flight Mode EXIT (minigame toBridge/updateExit): no light speed — 1.5 s camera swoop onto the bow + FOV narrowing + amber #zoom-fade → bridge.html?from=fly (html.from-fly: amber #fly-fade clears with you seated, then WF_CMD stand() plays the get-up sequence). Exit control = round glass ✕ (#exit-x) top-left; the bar's back arrow (#fm-mid) is hidden. LASERS: tapered white core + cyan inner + teal outer glow, pulsing head, 5-sprite tracer, muzzle flash + expanding ring, impactFX spark burst on hits; fx()/updateFX() short-lived effect list
- [x] Ship View model windows (shipskin.js, Nov 26): the flat teal slab across the nose is gone; BRIDGE WINDOWS (user markup, Nov 26) = the curved wall under the lip of the raised forward deck (y 0.012–0.036, z < −0.11, non-horizontal normals) wrapping the bow and both flanks, tall dark-glass panes split by bronze mullions (arc length round z −0.12), faint amber/teal glow + reflection streak — NOT the lower nose slope; the flank recesses get lit cabin glass via an `aInset` vertex attribute (depth inside the hull's side envelope). Ship View's back link → bridge.html?from=fly&seat=1 = you arrive SEATED (no stand-up)
- [x] Hiveport: talk + fight panels are bottom sheets (2-column answers) and `faceOff(e)` hides your avatar and turns the view to the K'Vetar so their reactions are visible; ship-log MAP on station.html = live Hiveport map (renderHiveMap: zones, obstacles, bar, stage, dance floor, bounties, airlock + docked Wayfarer, every K'Vetar, WANTED in red, you) + "Back to the Wayfarer"
- [x] Flight Mode: shooting works in EXPLORE too (Fire + reticle shown; no enemies, friendlies are never hit)
- [x] Library: 5 painted bookshelf variants (shelfTexture: coloured spines, gilt bands, stacks, leaning books, ornaments)
- [~] Flight Mode: ZOOM (wheel / pinch / Z X, 0.4–2.6×, 'wf-zoom') [x]; far more space traffic, more ship types, ships fighting each other [ ]
- [ ] A cast of ALIEN RACES, each with a home planet; the Hiveport has all of them; Hiveport much more crowded and detailed ("feel like a damn club")
- [ ] PLANET LANDINGS: cruiser docked below deck flies down (mothership stays in orbit animation); planets: desert traders, ice world with giant monsters, tropical world with friendly monkey aliens, dead cyber wasteland, lava world with huge monsters; enter/exit animations; on foot with a gun + ammo, red screen edges when hit, pass-out scene (never die) → wake in the MEDBAY with a droid
- [ ] Space defeat: the ship warps out and hides behind a planet (animation); shields designed properly
- [x] HALLWAY CONSOLE = the CAPTAIN'S MANUAL (`manual.js`, every A-Frame page; corridor Engineering console labelled GUIDE, or key H): collapsible sections for every system + Easter eggs + coming next. KEEP IT CURRENT with every feature.

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
- [~] Reduce floor glare / better ambient shadows [ ]; adjustable mobile controls [x] (⚙️ menu: Thumbstick size S 92 / M 118 / L 148 px, opacity 100/70/40 %, localStorage 'wf-stick', menubar.js applyStick)
- [x] VOICES (Nov 26, user: "more than one type of sound"): sound.js WF_SOUND.droid(kind) chatter/whistle/affirm/negative/ponder/
  servo/scan, .cat(kind) meow/mew/trill/yowl/purr/chirp/chatter, .alien(kind) click/chitter/hum/trill/growl/query — (kind, pan, vol).
  crew.js picks them per event (chats, petting, bumps, dialogue topic, door entries) + an ambient voice every 5–14 s in the room;
  bridge.html's old random beep timer is gone.
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

- [x] STAIR FOOT ARCH (Nov 27, user's 5 annotated screenshots; NOT pushed; atrium.js ?v=20261127zi): buildStairShaft adds 'ArchPartition' at x 0 on the lower deck (z 45.2…51.95, floor→upper-floor underside) between the two flights' feet, arched doorway z 45.9…48.5 (bronze arc + posts, light); wallBlocked forbids crossing x 0 there outside the doorway. Two landing point lights (±9.9, 1.9, 30.2) lift the black Library wall beside each stair-top door. Stair previews recaptured. NOT verified: live iPhone, whether this is the opening the user circled. PUSHED 25058d9.
- [x] STAIR TUNNELS (Nov 27, user annotated IMG_7402: 'the railing needs to be up against an actual wall'; NOT pushed; ?v=20261127zj): atrium.js railRadii() reads the kit rail radii (10.45–12.25) and buildStairTunnels() probes the tread height down each flight (rays onto the merged stair mesh at r 11.35, θ 0.28…≈2.0, stops at y −1.25 before the Library door) and builds per flight inner + outer wall (±0.12 outside the rails), roof at +2.9 m, pale-blue light line, 3 point lights, and an arched mouth wall (TunnelMouth + bronze arc) at the foot. Walls/roof v8Skip.
- [x] STAIR FOYER CENTRE ARCH (Nov 27, user sketch IMG_7403 = two stair arches left/right + a centre arch both paths lead to; user chose 'corridor to the lower hall'; NOT pushed; ?v=20261127zk): the radial ArchPartition is replaced by a wall across x at z 48.0 (x ±3.4, between the two tunnel mouths) with an arched doorway (half-width 1.3, bronze arc + posts, light) at x 0; wallBlocked forbids crossing z 48 for |x|<3.4 outside the doorway. The foyer pocket = core wall (z 45.4) / tunnel mouths / this wall; beyond the arch the aft ring leads round the core to the lower hall door. NOT built: a dedicated passage walled round the ring.
- [x] CORE DOOR AT THE STAIR FOOT (Nov 27, user IMG_7404/7405 + answers: left wall solid, right-wall arch 'into the core room'; NOT pushed; atrium.js ?v=20261127zl, door.js ?v=20261127zl): the foyer wall (z 48.0) is now SOLID (centre arch removed; wallBlocked blocks all crossings); the 'core' door moved from (0, 26.6) to (0, 45.4) rot 0 in the lower core wall inside the foyer (door.js PORTALS.core corr + corrSpace box, CORR_YAW core 180); corr-core.jpg recaptured. The core is now reached by the stairs; the old forward doorway at z 26.6 has no door.
- [x] STAIR-TOP VESTIBULE (Nov 27, user: "the staircase should feel like a stairwell, you shouldn't be able to see around it"; NOT pushed; atrium.js ?v=20261127zm): buildStairTunnels no longer stops 1.25 m below the top — the walls/roof run the whole flight to y 0 and on over the landing to θ 2.3 (outer wall, roof, light line, 'TunnelCap' end wall, point light); inner side = the Library core wall, with 'TunnelInner' stopping at θ 1.9 and 'TunnelInnerL' resuming at 2.14 so the door stays clear. wallBlocked (upper deck, fy > −1) keeps the player inside the vestibule (r 10.2–12.4, θ 1.5–2.3). Earlier "NOT pushed" markers on the tunnel/foyer/core-door entries are stale: pushed (208d81a, c5c5def).
- [x] VESTIBULE SEAL (Nov 27, user screenshots: gaps still visible; NOT pushed; ?v=20261127zn): the landing strips stopped 0.03 rad short of the TunnelCap (a slit); last landing point now = TE exactly, walls/roof overlap 6 cm at the corners. Ray audit (scratchpad ray.js/ray2.js, ~1000 rays per stand point along both flights + landing): no ray reaches the shaft wall; only the arched mouth at the foot is open.

- [x] MENU BAR ICONS + STANDALONE FIX (Nov 27, user: "not emojis — space digital VR theme"; reference icons = glossy rounded squares; NOT pushed; menubar.js ?v=20261127zo on all pages): no emoji anywhere on the bar — `ICONS`/`ic(name)` inline SVG HUD glyphs (map, log, ai, manual, sound, mute, gear, vr, level, person, stick, eye, coin) on 30 px dark-glass squircle tiles with a per-icon neon accent (cyan/periwinkle/violet/mint, mute = pink); credits chip = hex coin glyph; settings sheet rows use the same tiles. Bar is now near-opaque navy glass (rgba .97→.92) with cyan hairline; `box-sizing:border-box` + `padding-top: env(safe-area-inset-top)` so icons sit BELOW the iOS status bar (before: 40 px + safe-area height with no top padding → icons centred in the status-bar band, translucent .55 fill washed out over the bright atrium in black-translucent standalone mode). Cause of the "disappearing" bar is a hypothesis from the screenshot, NOT verified on a real iPhone Home Screen app.
- [x] MENU BAR OFFSET + BOTTOM BLACK BAND (Nov 27, user screenshot IMG_7422: icons ~½" too low, 44 pt black band under the scene in the Home Screen app; NOT pushed; menubar.js ?v=20261127zp): bar top padding = max(safe-area-top − 14 px, 0) (icons hug the status bar); html/body/a-scene/.a-canvas forced position:fixed 100%×100% (the layout viewport in standalone was ~44 pt short, A-Frame sized the canvas from innerHeight). Unverified on device; if the band stays, next try manifest display 'standalone' or screen.height sizing.
- [x] MENU BAR SPACING (Nov 27, user: bottom band fixed on device, wants the bar pushed down with space; NOT pushed; ?v=20261127zq): bar padding-top = safe-area + 6 px, height 52 px + safe-area.
- [~] STANDALONE DIM BAR (Nov 27, user: bar looks right in Safari but ghosted/dim in the Home Screen app; NOT pushed; ?v=20261127zr): headless standalone emulation shows no overlay/opacity, so cause unknown; trying: bar backdrop-filter removed (iOS standalone + WebGL canvas) and solid #070b1c base colour. Unverified on device.
- [x] MENU BAR DECLUTTER (Nov 27, user: Halcyon = brain icon, sound into settings; NOT pushed; ?v=20261127zs): ICONS.ai = line-art brain; the .wf-snd button moves into the #wf-set sheet as first row 'Sound on/off' (icon swaps sound/mute); bar = map · log · brain · manual · gear.
- [x] MAP / MANUAL / BLUEPRINT (Nov 27, user; PUSHED 70910fa; life.js + menubar.js ?v=20261127zt): the Ship Log has NO MAP tab (GOALS · CARGO · SCIENCE · ORDERS); the map button opens WF_LIFE.open('map') as its own 'DECK MAP' panel (#wf-log.bp, no tabs). Blueprint restyle of renderMap: cyan-on-navy, hatched room floors, minor + major grid, drawing border, BOW compass, scale bar, title block, inner hull line, mono labels, cyan door nodes; UPPER/LOWER buttons cyan. Captain's Manual = '?' icon, now a row in the settings sheet (bar = map · log · brain · gear). Geometry/furniture unchanged (maps/deck.json).

- [x] LOAD SPEED (Nov 27, user: atrium 'loading reallyyy slow'; PUSHED d0e261a; textures/atrium/door ?v=20261127zu): textures.js window.TEX is LAZY (getters; was painting starfield/panels/grate/etc. on every page) and TEX.library({wallOnly:true}) = atrium wall albedo+glow only (no floor/shelf/wood/normal maps); index.html <link rel=preload> for the 5 atrium GLBs + layout.json; door.js portal photos background-load at 9–18 s (open() still loads on demand). Throttled test (4x CPU, ~1.6 Mbps, 150 ms) fade-clear 13.8 s -> 12.0 s. Remaining cost is script/A-Frame start (~7 s throttled before GLBs) + kit merge/walls/stair tunnels; NOT verified on iPhone.
- [x] STAIR-TOP TRIM (Nov 27, user: excess space at the top of the stairs; PUSHED d0e261a; atrium.js ?v=20261127zv): vestibule end cap TE 2.3 -> 2.18 rad (was ~3 m of dead floor beyond the Library door at θ 2.02); wallBlocked limits 2.3 -> 2.18. Map is still bow-up (user wants it to reflect facing — heading-up rotation pending a decision); menu bar offset question open.
- [x] HEADING-UP MAP + MENU BAR LOWER (Nov 27, user: map should reflect facing; icons too high; PUSHED d0e261a; life.js/menubar.js ?v=20261127zv): life.js wrapRot/applyRot — upper + lower deck maps rotate (rAF-eased, scaled to stay in frame) so your arrow always points up, upside-down labels flip 180; BOW compass turns with it. Hiveport map unchanged. Bar: padding-top safe-area + 16 px, height 62 px + safe-area, #wf-set top 72 px + safe-area. NOT verified on iPhone.

- [~] STANDALONE BLACK BAND v3 (Nov 27, user screenshots IMG_7428-35: ~44 pt black band under the scene + gap above the bar still there after position:fixed 100%; NOT pushed; menubar.js ?v=20261127zw): fitH() sets --wf-h = max(innerHeight, screen height) in px when navigator.standalone / display-mode standalone; html/body/a-scene/canvas heights use var(--wf-h,100%). A-Frame's drawing buffer still follows innerHeight (CSS stretches it ~5 %). Unverified on device.
- [x] STAIRS LIGHTING + MENU BAR WITH PANELS (Nov 27, user screenshots IMG_7428-37; NOT pushed; atrium.js ?v=20261127zy, menubar.js ?v=20261127zy): tunnel walls were blown out pale grey by the shaft lights (kit-converted 3.5/6 lamps + 2.2 shaft lamps at 1 m from the walls) → lamps 0.3–0.8, wallM 0x1b1f24 rough 0.95 env 0.05; tunnel y profile smoothed (±5-step moving average) so wall tops/roof/light lines follow the slope instead of each tread. Menu bar vanished while Ship Log/Halcyon was open: mobile.js `body.reading .wf-ctl{opacity:0}` also hit #wf-btns and its buttons → menubar.js overrides; #wf-ai / #wf-log now start at top 72 px + safe-area (below the bar). NOT verified: rail geometry, stair-top door frame, live iPhone.
- [x] CORE DOOR GAP (Nov 27, user screenshot IMG_7438 'THE CORE' = open arch with a flat grey wall in it; NOT pushed; atrium.js ?v=20261127zz): buildLowerCore's cylinder wall (r 9.4) was solid at θ 0, so the portal photo (door-local z −0.3) sat INSIDE the wall. Now a gap ±0.118 rad at θ 0 (door half-width 1.05) + lintel above y +3.1 over the lower deck. Headless (door forced open via WAYFARER.corridorDoors, camera facing −Z): the hydrogel chamber + brain show through the arch. HARNESS GOTCHA: THREE.Camera.getWorldDirection returns the LOOK direction (−Z local) but an Object3D's returns +Z, so `cam.object3D.getWorldDirection` reads reversed; scene.renderer.render + canvas.toDataURL gives true frames when screenshots lag.
- [x] NO COPPER ON RAILS (Nov 27, user: copper tone in the handrails; NOT pushed; atrium.js ?v=20261127zzb, interior-v8.js ?v=20261127zb): stairLook copper balusters/warm metals -> gunmetal 0x59626b; new M.gun for stair mouth arcs + shaft ring; interior-v8 PAL.copper (thin-trim accent) 0xa66d43 -> steel 0x6b7680 on every interior page. Wayfarer exterior, droids and the captain stay copper.
- [x] STAIR HANDRAILS (Nov 27, user: handrail geometry detached/chunky; PUSHED; atrium.js ?v=20261127zzc): ALL kit Handrail*/Rail_post* removed (clearDoorRails); buildStairTunnels draws 'StairHandrail' (gunmetal tube r 0.028, 0.92 m above the smoothed tread profile, at the kit rail radii 10.45 / 12.25, inner one split at the Library door) + 'StairPost' every ~1.1 m. Headless only; not verified on iPhone. The two earlier "NOT pushed" markers on CORE DOOR GAP / NO COPPER ON RAILS are stale (pushed 03faad8, 8d39856). Blueprint map: user says it still reads fake (plain pill hull, rooms scattered) — awaiting what to change.
- [x] BLUEPRINT RESTYLE + CORE GLASS CEILING + SAME BRAIN (Nov 27, user: map "non-believable" → blueprint styling; lower deck should look up into the Library; brain must match on both decks; PUSHED; life.js ?v=20261127zzc, core-room.js ?v=20261127zzc): life.js map = flat chalk-white linework on cyanotype blue (#123f73), no glow/emoji, door nodes as plain symbols, centreline, flat title block, red-triangle faults, yellow you-arrow; core-room.js ceiling = solid disc round the chamber + glass annulus (12 spokes) onto a painted Library above (shelf wall canvas, star dome, ring lamp); library.html tints its brain with the same hydrogel green (0x5fa87a) as the core. NOT done: tap a map point → go to that exact spot (user request; needs sessionStorage 'wf-goto' + per-page arrival), the dark-brown slab by the stair-top Library door (IMG_7440, mesh not identified), Library tank gel still teal vs the core's green.
- [x] CORE POLAR FLOOR + NORTH DOOR (Nov 27, user: floor was random squares; no door on the Core's other side; PUSHED; core-room.js ?v=20261127zze, atrium.js ?v=20261127zzd, door.js ?v=20261127zzf): gallery floor UVs are polar (48 plates round × 4 rows out, own canvas texture, v8Skip, lit inlay rings); core.html has TWO doorways (walls split at θ 0 and π): +Z = stairs foot ('core'), −Z = new 'corenorth' (PORTALS.corenorth: corr (0, LOW, 26.6, rot 180), room (0, −10.65, rot 0), page core.html?from=north, atrium DOORS inYaw 180, CORR_YAW corenorth 0; lower core wall gap + lintel at θ π; photos room-corenorth / corr-corenorth captured, room-core recaptured). Arriving ?from=north puts you at (0, 0, −8) facing +Z. NOT verified: walking through on a real phone; crew/map unaware of the north door.

- [x] LIBRARY TANK GREEN + 3 FIXES (Nov 28; brain.js ?v=20261128a, atrium.js/menubar.js ?v=20261128b): brain.js gel-tank (gel gradient, vents, floor grid, light shafts, bubbles) + library.html tank lights recoloured teal → hydrogel green (0x5fa87a family). Atrium: skylight warp streaks ran toward the bow (−Z) — flipped to aft (clock sign in V04_Skylight_Only shader); #wf-fade held 1.7 s after ready() so the pre-V8 copper materials never show; fade colour neutral. Menu bar: glow shadow removed; heights = max(--wf-h, 100lvh, 100%) for the standalone bottom band. NOT verified on iPhone.

- [x] MAP TAP-TO-TRAVEL (Nov 28, user; life.js/atrium.js ?v=20261128c): tapping a point on the deck map goes to that exact spot. life.js INV[room] inverts ROOMS[id].m (map px via the rotated group's getScreenCTM → room metres); same page → gotoNow (atrium: wf-atrium.gotoSpot checks floorAt, sets floorY/last; other pages shift #player so the camera lands on x,z); other page → sessionStorage 'wf-goto' {page,x,z,y,t} then navigate; arrive() in life.js (rooms) or atrium ready() applies it (≤90 s old). Lower-deck map: tapping the hall polygon (not a room) goes to that spot at y −5.95. Lower-deck ROOMS (medbay, xeno, mess, maint, firefly, quarters) and the core still open the room at its door (their pack-local origins aren't mapped). Bridge/furniture bounds still push you out of solids. Headless verified atrium upper (3.35,−3 → 3.37,−2.93) and Lounge arrival; not iPhone.

- [x] UNIFIED DECK MAP (Nov 28, user + ChatGPT review; life.js ?v=20261128d, maps/deck-lower.json NEW): renderMap/renderLower replaced by ONE renderer (drawDeck) in ship coords (layout.json; MS 8 px/m, origin MOX 300/MOZ 500, bow up), hull = widest of layout deckProfiles + inner per-deck outline (taper), twin stairs at r 11.35 on both decks (UP/DOWN), Library + Engine Room round rooms with the Second Brain chamber ring through both, Firefly + jaw + ramp (SCHEMATIC, GLB anchors not measured), furniture from deck.json (upper, XF local→ship transforms) / deck-lower.json (baked from page solids scans; medbay pack-local approximate). Controls: UPPER/LOWER/CUTAWAY, NAVIGATION/ENGINEERING (adds m² + z ruler), BOW UP/HEADING UP ('wf-mapmode','wf-maphead'); pan/zoom via viewBox (mapZoom); live markers (you, droids, cats, faults) upper deck only; tap = go to exact spot via XF.from (corridor, rooms), lower rooms open at door. Bridge furniture squeezed ×0.765 (page 18 m vs kit shell 14 m). NOT done: nav paths over walkable geometry, destination highlight, crew/NPC on lower deck, live iPhone. Old ROOMS/INV tables still in life.js (unused by the map).
- [x] MAP FULLSCREEN (Nov 28, user: no scrolling to room-jump; life.js ?v=20261128g): #wf-log.bp is a fixed 100dvh overlay above the menu bar (!important beats menubar.js top/height), flex column, svg.map flex:1; controls = UPPER/LOWER/CUTAWAY + VIEW ▾ toggle (NAV/ENG, BOW/HEADING rows collapsed).
- [x] MAP ROUTES + PIN (Nov 28; life.js ?v=20261128e): tap = DESTINATION PIN + route + GO/CLEAR bar (tapping the pin again, or GO, travels; was instant). walkGrid(deck): 0.5 m grid of the atrium outer polygon (minus upperOpening on the upper deck) + room polygons/circles (Core ring r>5.85) + door strips + stair-end discs + a stair-foot foyer rectangle (lower) and a carved strip stair-top→Library (upper, bookcases blocked it) minus furniture polygons; astar() 8-way + line-of-sight smoothing; planRoute() splits across the decks via the nearer twin stair (stair arc r 11.35, a −0.35 top / 1.16 foot, +17 m); route redrawn when you move. Lower-deck droid/cat markers: marker layer is deck-aware (room in LOWER or node y < −3) but the crew graph has NO lower-deck nodes, so none appear yet. window.WF_MAPDBG for tests. Not done: crew graph lower deck, quarters route (no XF), live iPhone.

- [x] CORE: ONE DOOR + CEILING FIX (Nov 28, user: two doors to the Core; ceiling had floor where glass should be, glass where floor should be, big gaps above the doors; core-room.js/atrium.js/door.js ?v=20261128h): the hall door 'corenorth' (z 26.6) is REMOVED (atrium DOORS, door.js PORTALS/CORR_YAW, core.html roomExit, lower core wall now solid at θ π); the stair-foot door 'core' (z 45.4) is the only way in. core.html outer wall is one arc with a single +Z doorway + a lintel (y 3.3→9.4) over it. Ceiling at y 9.4: centre disc r 5.6 = GLASS (look up at the Library + brain), annulus 5.6→10.2 = solid floor underside (steel), spokes on the glass. Headless NOT run; live iPhone NOT verified. Stale portal photos room-corenorth/corr-corenorth are unused.

- [x] CEILINGS 4.0 m (Nov 28, user: "meet in the middle" for room sizes, 4.0 m everywhere; PUSHED): holodeck H 4.0, lounge walls/ceil/TV wall/window 4.0 (window 3.0 tall, TV block 2.5 centre), media R 9.2 H 4.0 (main screen 6.4×2.6 at y 2.0, channel rows 1.45/2.75). Core ceiling plates are polar (36 round × 2 rows, v8Skip) instead of V8 planar squares. NOT yet: Bridge, Library (dome excepted), kit rooms (3.2 m GLBs), atrium, Quarters/Firefly cabin resize, map re-bake. 4.0 m is above "two stacked players" (~3.7 m) — user picked it.
