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
| `app-icon-source.jpg` | Source of the app icon (icons/ use it with the neon frame removed) |

Rules drawn from them:
- **Hull:** worn copper/bronze plating with rivets; engine glow and dome glass teal/cyan; deep navy space.
- **Interiors:** brushed-bronze arched ribs framing every room; a warm amber light ring/cove on every ceiling;
  dark walnut-brown/charcoal wall panels; polished dark reflective floors; small square amber sconces.
- **Colour:** amber is the default light. Teal = Library electrogel / dome. Blue-purple = holograms only
  (Holodeck galaxy, Bridge orb). Nothing grey or white-lit (the pre-Nov-2026 rooms were grey; that look is retired).
- **Lived-in:** plants, bookshelves, brass fittings — in rooms AND the corridor (user, Nov 24: inset bookshelves in the hall).
- **Outside the ship = light speed** (user, Nov 24): star streaks rushing aft over a streaked blue tunnel, not a static
  starfield. Ship flies toward the Bridge (+Z), so streaks move toward −Z. Any window/viewport should show the same.
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
- Shared scripts: `textures.js` (procedural textures), `mobile.js` (touch controls: ONE frosted-glass bottom bar —
  iOS glassmorphism, Safari-bar proportions, white YouTube-style line icons; movement pad left, look stick right, Gyro +
  Level in the middle; gyro off by default and the Gyro tap calls DeviceOrientationEvent.requestPermission so only
  Apple's native prompt shows; every a-scene has device-orientation-permission-ui="enabled: false")
  NO labels across the top of the screen (user, Nov 24): `#hud` is hidden everywhere by mobile.js. In a Safari tab the
  bar is lifted 78 px clear of Safari's floating toolbar (`html:not(.standalone)`); Home Screen app sits low., `brain.js`, `cats.js`, `stargarden.js`
- Pages that build lights in three.js must put `light="defaultLightsEnabled: false"` on `<a-scene>`, otherwise
  A-Frame adds a white directional light that puts a hotspot on glossy floors.
- Testing in a cloud session: aframe.io is blocked there; `npm pack aframe@1.5.0` and route the CDN URL to
  `package/dist/aframe-v1.5.0.min.js` in Playwright (headless Chromium, swiftshader GL).

## What's built (as of 2026-11-24)
- Live site == branch `claude/hello-mssbj4`. Push there only when the user says so.
- **Corridor** (`index.html`) — RESTYLED to the reference: dark panelled walls, bronze arched ribs every 3 m,
  curved amber-lit cove ceiling, full-length glass skylight with stars and faint light shafts (no side windows —
  user decision), polished deck with dashed amber centre line and glowing edges, square amber sconces
  (pairs flank each side door), glowing arch portals at the ends (amber = Bridge, teal = Library).
  One-step-outside-the-door spawn when returning from a room.
  SKYLIGHT shows light speed (`buildSky`: animated streak quads + scrolling tunnel texture). SEVEN recessed walnut
  bookcases between ribs (`SHELVES` table; 2 columns × 6 lit shelves; ~instanced books with gilt spines, leaning/stacked
  books, vases, frames, plants, globes). Default spawn faces the Bridge (user is fine with it).
  DOORS (user design, Nov 24): double doors modelled on a sci-fi double door photo the user sent (not saved
  in the repo) — moulded arched bronze frame with jamb blocks and side ribs; ONE nameplate per door, on the frame
  header; each leaf has a top light + X-braces to a centre octagon hub, glass tinted per room (`tint` in DOORS).
  The right leaf has a rounded tongue that carries the hub; the OPEN button sits in the hub at the door centre.
  Left leaf slides left, right leaf slides right (with the button). User sketch: seam is not straight, it jogs
  round the hub. Ribs, rib legs, cornice and sconces are bevelled extrusions — avoid raw boxes (user: "Minecraft").
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
- **Command Bridge** (`bridge.html`) — RESTYLED Nov 24 to the reference, all procedural three.js: round room r 8.2;
  panoramic curved window across the bow (−Z, 140°, eight panes, bronze mullions, sill + header) showing light speed
  coming at you (vanishing-point glow); amber ceiling ring + perimeter cove; dark panelled back walls with bronze
  ribs, sconces and two plant/book shelves; polished deck with amber inlay rings; raised dais, tan tufted leather
  captain's chair (tap → `minigame.html`), blue swirling orb on a brass stand; four white robots seated at curved
  consoles with teal screens (heads glance between screens). Exit = shared door at +Z (now has a wall behind it).
- **Light speed is shared code: `hyperspace.js`** (`WAYFARER.hyperspace(root, {fwd, arc, minR, center, core})`).
  Corridor: fwd +1, arc ±70°, minR 16, tunnel 0.6, width 0.55. Bridge: fwd −1, full circle, minR 14, core glow.
  Library dome: fwd +1 (its door faces the bow), arc ±75°, same settings as the corridor. Streaks are DoubleSide
  billboards (seen from below they face away — that once hid them entirely in the corridor).
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
  Touch: the same glass bottom bar (steer stick, Auto-fire toggle (on by default on touch), Bridge, Fire); aim assist
  bends shots toward the enemy nearest the crosshair; the scene is rendered shifted up above the bar (setViewOffset).
  Nov 24 (user): camera pulled back (ship small, low in a Starfield-style HUD reticle that is projected to where shots
  land; a rotating lock bracket marks the aim-assist target); lasers = long teal beam bolts alternating from the pods.
  Control bars everywhere are compact & centred (max ~420 px); in LANDSCAPE phones they split into corner pads. r128 GOTCHA: hex colours are linear there — run
  `fixColors()` on new objects or they render washed out (dark copper came out cream).
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
- **Library** (`library.html`) — pearly veined brain in a cabled electrogel tank, copper room, dome, scroll
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
- **Icons** — frameless ship icon (from `reference/app-icon-source.jpg`) at 180/192/512 + favicon; share image.

## What's next (agreed order: restyle room by room to the reference)
1. Media Nexus live channels — needs a YouTube Data API key from the user (a key in a Pages site is public:
   restrict it to the Pages domain in Google Cloud); swap the CHANNELS placeholders for real subscriptions
2. Library — load the user's real Obsidian markdown into the scrolls (user will add the files)
3. Lounge: YouTube on the TV (needs the API key, same as Media Nexus)
5. Collision / room boundaries everywhere

## Known issues
- RULE (found Nov 24): never use big single-fan discs / tall single-quad walls for floors, ceilings or walls the
  player walks next to. Their huge thin triangles get clipped wrong near the camera and leave holes (the Lounge's
  old "lavender floor" was the background showing through). Use RingGeometry(…, 96, 14) / segments-height ≥ 12.
- Mobile autoplay: test the 15 s video loop on an actual iPhone before committing to that UX.
