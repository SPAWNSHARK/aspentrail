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
- **Lived-in:** plants, bookshelves, brass fittings in rooms (not the corridor).
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
- Shared scripts: `textures.js` (procedural textures), `mobile.js` (touch controls: arrow pad + look stick,
  gyro off by default, tap-to-interact), `brain.js`, `cats.js`, `stargarden.js`
- Pages that build lights in three.js must put `light="defaultLightsEnabled: false"` on `<a-scene>`, otherwise
  A-Frame adds a white directional light that puts a hotspot on glossy floors.
- Testing in a cloud session: aframe.io is blocked there; `npm pack aframe@1.5.0` and route the CDN URL to
  `package/dist/aframe-v1.5.0.min.js` in Playwright (headless Chromium, swiftshader GL).

## What's built (as of 2026-11-24)
- **Corridor** (`index.html`) — RESTYLED to the reference: dark panelled walls, bronze arched ribs every 3 m,
  curved amber-lit cove ceiling, full-length glass skylight with stars and faint light shafts (no side windows —
  user decision), polished deck with dashed amber centre line and glowing edges, square amber sconces
  (pairs flank each side door), single-leaf sliding doors with nameplates, OPEN buttons, glowing arch portals at
  the ends (amber = Bridge, teal = Library). One-step-outside-the-door spawn when returning from a room.
- **Command Bridge** (`bridge.html`) — glass walls, robots, captain's chair → Flight Mode. OLD grey style.
- **Flight Mode** (`minigame.html`) — 3rd-person fly/fight mini-game.
- **Library** (`library.html`) — pearly veined brain in a cabled electrogel tank, copper room, dome, scroll
  reader. Scrolls hold placeholder text, not the user's Obsidian notes yet.
- **Crew Lounge** (`lounge.html`) — curved leather sofa, brass table, woven rug, rigged alien cats on a shared
  60 s stretch cycle, browser TV, painting, plaque.
- **Media Nexus** (`media.html`) — circular room, 11 screens on placeholder searches. Needs the hybrid rebuild
  and a YouTube Data API v3 key.
- **Holodeck** (`holodeck.html`) — 2D house blueprint planner (drag furniture, shopping-list export) and the
  Star Garden program on the amber projector ring.
- **Icons** — frameless ship icon (from `reference/app-icon-source.jpg`) at 180/192/512 + favicon; share image.

## What's next (agreed order: restyle room by room to the reference)
1. Command Bridge restyle (circular, amber ceiling ring, panoramic window, orb pedestal)
2. Holodeck restyle (bronze console + 3 buttons; SIM LIBRARY is a candidate home for the blueprint planner)
3. Media Nexus hybrid rebuild — needs YouTube API key from the user (a key in a Pages site is public:
   restrict it to the Pages domain in Google Cloud)
4. Library — load the user's real Obsidian markdown into the scrolls (user will add the files)
5. Lounge touch-up to the reference (bookshelf, lamp, plants, YouTube on the TV)
6. Collision / room boundaries everywhere

## Known issues
- Default Home-Screen spawn faces the Bridge end, although the code comment says it faces the Library.
  Seen in headless tests of both the old and new corridor; not yet checked on a real iPhone.
- Mobile autoplay: test the 15 s video loop on an actual iPhone before committing to that UX.
