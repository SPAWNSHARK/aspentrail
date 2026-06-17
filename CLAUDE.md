# SS Wayfarer — Project Memory

## What this is
A personal dashboard built as a 3D walkable spaceship. Navigate the corridors, enter rooms, and each room is a functional workspace. Built with A-Frame (WebXR) so it works in a browser, on iPhone, and in Google Cardboard VR.

## User context
- Neurodivergent, very visual thinker — prefers whiteboards and infographics over flat lists
- Has an Obsidian second brain (converted to markdown) — wants it navigable as a physical space
- Writing two books:
  - *The Sons of Naphtali* — genetics (Book 1, scope got massive)
  - Jewish genetic haplogroups (Book 2, spun off from Book 1)
- Flipping a house — needs a digital version of the house for planning before buying supplies
- Wants YouTube subscriptions surfaced (latest video per channel, first 15s autoplaying, refresh noon + midnight)
- Wants a break room with alien cats roaming around
- Google Cardboard on iPhone is a target platform

## Ship layout

```
[FRONT +Z] Command Bridge — Star Trek style, robots at stations
                            mini-game: fly/fight 3rd person (only in that room)

[LEFT  +Z] Holodeck        — digital version of the house being flipped
                             rearrange rooms/furniture before buying supplies

[RIGHT +Z] Crew Lounge     — alien cats roaming, couch, giant TV = browser,
                             space window behind the TV

[RIGHT -Z] Media Nexus     — circular room, wall-to-wall screens (Matrix Architect style)
                             each screen = latest video from a YouTube subscription
                             first 15s autoplays on loop, refreshed noon + midnight

[BACK  -Z] The Library     — the second brain
                             glass floor: giant brain in electrogel below (Kamino/Star Wars)
                             glass ceiling: open space above
                             scrolls/markdown files as physical pickup objects (Fallout pip-reader style)
                             two book wings (Sons of Naphtali, Haplogroups)
```

## Aesthetic
- Bebop (Cowboy Bebop): warm amber, worn, lived-in
- Moya (Farscape): slightly organic, curved corridors
- Destiny (Stargate Universe): ancient, amber-lit, dusty
- Accent lighting: cool blue from screens and the Library electrogel
- The reference image was named "SS Wayfarer" — that's the ship name, use it

## Tech stack
- A-Frame 1.5.0 (CDN, no build step)
- Deployed via GitHub Pages from branch `claude/hello-mssbj4`
- No framework, no bundler — plain HTML/JS

## What's built
- `index.html`: the main corridor with all 5 labeled doors, atmospheric amber lighting,
  fog, floor guide strips, sconce fixtures, space viewport at Bridge end

## What's next (build order)
1. Command Bridge room — the visual centerpiece, sets style for all others
2. The Library — glass floor with brain, scroll pickup mechanic
3. Crew Lounge — alien cat models (find free glTF cats), browser TV, space window
4. Media Nexus — YouTube Data API v3 (user will provide API key), circular screen layout
5. Holodeck — house floor plan tool, drag furniture, export shopping list
6. Ship flying mini-game (Command Bridge only, when sitting in captain's chair)

## Notes
- YouTube API key needed from user before building Media Nexus
- Markdown files from Obsidian will be dragged into repo — build Library navigation around them
- Mobile autoplay restriction: test 15s loop on actual iPhone before committing to that UX
- iOS Cardboard: uses DeviceOrientation API (older), A-Frame handles this gracefully
- No physics/collision yet — player walks through walls. Add room boundaries when each room is built.
