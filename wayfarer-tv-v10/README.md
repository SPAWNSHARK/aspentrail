# Wayfarer TV V10

Targets the `claude/hello-mssbj4` branch of SPAWNSHARK/aspentrail inspected 2026-11-26. Existing A-Frame 1.5.0 screen is retained. This is an additive pack relative to prior crew/furniture packs, but replaces the root alien-tv.js. No repository changes have been pushed.

## Install

1. Back up `lounge.html` and `alien-tv.js`.
2. Copy the `wayfarer-tv-v10` directory into repository root. Replace root `alien-tv.js` with the file in this ZIP.
3. In lounge.html, replace the existing alien-tv.js script tag with these two tags, in order (after A-Frame and crew.js):

```html
<script src="wayfarer-tv-v10/programs.js?v=10"></script>
<script src="alien-tv.js?v=10"></script>
```

Or run `python3 install.py /path/to/aspentrail` for a dry run, then add `--apply`. Never load both the old and new alien-tv engines at once.

## Behavior
- Tap the in-world screen or the remote to open touch-friendly controls. Direct channel selection, previous/next, last channel, standby, mute, volume and cat-autonomy toggle. Controls persist locally. Audio is original procedural synthesized music/babble/effects; starts only after a user gesture, fades by distance, respects the existing sound mute when available. No recorded dialogue, external television stream, or network feed.
- Sixteen fictional broadcasts share a wall-clock timeline. Each has three scripted story lines on a 24-second cycle, with procedural visuals. Galactic Emergency reads current crew engine `ship.alert` and `ship.destination`. `SIM LIVE` means simulated live, not internet streaming.
- Cat integration: selects an available, energetic, non-interacting lounge cat after an initial 90–180 seconds; retries every 120–300 seconds. Uses existing `eng.go` to l_r1; no extra animals or teleportation. At arrival uses an existing Pounce/Play clip and changes station with a remote press visual and chirp. No autonomous switches during alerts, recent player activity, toys or interactions. The approach, floor dock placement and paw alignment require in-engine visual testing. Optional disable from remote.
- Remote located at x=-2.44, y=.145, z=4.3, beside existing rest node l_r1. The remote is on a floor dock so the cats can reach it. No sofa/table collision is added. Adjust placement and existing nav anchor together if the lounge changes.
- `tv-bronze-optional.glb` is a replacement mesh asset only, NOT installed automatically. Existing 5.2 × 2.93 m TV screen and bronze frame preserve the current window composition. If replacing the mesh later, keep #tv-screen as the texture target or explicitly bind the canvas texture to the named screen material.
- `WF_TV.channel(n)` remains zero-based for compatibility with the old API; `next()`, `prev()`, `power()`, `open()`, `getState()` are available. `wf-tv-change` fires with one-based channel, source, power.

## Acceptance tests in actual ship
Open lounge on desktop and iPhone Safari, verify no double screen handler; window unobstructed; all channels tune; sound unlock/attenuate/mute; remote visible and accessible; walk/pet cats as usual. Observe at least 6 minutes with idle TV and free cats, verify natural paw interaction, no clipping or walking disruption. Check alert suppression. Reload to confirm TV settings persist. Test existing navigation and cat toys. Revert using backed-up files if necessary. No full ship or iOS run was available during pack creation.
