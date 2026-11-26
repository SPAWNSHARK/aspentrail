# SS Wayfarer — Atrium v0.4: Traversal & Hull Integrity

**Purpose:** integrate the existing v0.3 models into a usable two-deck atrium without replacing models or redesigning unrelated rooms. Target: SPAWNSHARK/aspentrail, branch `claude/hello-mssbj4`, source inspected November 26, 2026. This is a source patch, not a replacement asset kit.

## Install (Claude / Codex)

1. Keep the current assets and project files. Extract this ZIP outside the repository.
2. Create a new branch from the current working branch or take a backup. Do not merge over simultaneous work.
3. Run `python3 /path/to/wayfarer-v04/apply_upgrade.py /path/to/aspentrail` (dry run; no writes). Node.js, if available, checks the resulting JavaScript syntax before any writes.
4. If dry run succeeds, repeat with `--apply`. If an anchor has changed, reconcile the patch manually against the current source rather than force-replacing entire files.
5. Inspect `git diff`. Serve the repository locally and run the acceptance tests below before committing and deploying.

## Changes

- Two visible, raycast-enabled upper stair landing extensions at radius 11.35 m, width 1.8 m, around the core at (0,36). They bridge the audited gap between upper deck and first tread without altering the lower deck or stair GLBs.
- Movement is resolved in 9 cm segments along the raycast-supported floor; never accept a segment without support. Player movement is withheld during asset loading; failed required assets produce errors instead of silently revealing an incomplete scene.
- Dedicated opaque, depth-tested skylight plane at x ±2.05, z −17.55 to +18.05. Hyperspace is animated on the actual viewport only, with a smooth transition and the existing shared `wf-warp` schedule. This replaces the atrium's unrestricted exterior tunnel (bridge and other rooms unchanged). This is a contained shader approximation, not the original panoramic 3D warp effect.
- Upper and lower staircase approach lighting and bronze landing rails.
- Engine room threshold corrected from z=25.8 to z=26.6, matching layout.json and navigation.json; lower engine-room core radius corrected to 9.4 m.
- Library stairs shortcuts spawn on repaired landings, facing down the stairs. Shared room exits provide an explicit `fromRoom` URL parameter, avoiding dependence on referrer for return deck and orientation.
- Required room GLB load failures are reported explicitly. Edited script URLs have cache-busting revisions.

## Acceptance tests (required before merge)

| Test | Pass criterion |
| --- | --- |
| Port stairs | Walk from upper corridor to port landing, descend to lower apron, return to upper floor. No teleport, blocked step, or void. |
| Starboard stairs | Same in both directions, including library shortcut. |
| Low frame rate | Repeat at 15–30 fps; no skipping steps or crossing unsupported gaps. |
| Upper floor | Walk both split walkways and crossovers; no walking over central opening. Enter Captain's Quarters and return facing away from the same doorway on the upper deck. |
| Lower floor | Walk from the stair apron into the open lower atrium and visit Medbay, Xenobiology, Mess Hall, Maintenance, Firefly Hangar, Engine Room. Return from each room to the correct lower-deck doorway. |
| Warp | Test both idle and warp states. Blue streaks appear only through the overhead skylight. Look at closed/open bridge door, stairs, walls and floor: no streaks through solid surfaces. Bridge window remains unchanged. |
| Engine doorway | Enter at z=26.6. Door and round wall opening coincide; return outside the engine core. |
| Firefly | Confirm existing hangar model, cruiser orientation, board interaction and return. The cruiser should ultimately be visible rear-first from the lower atrium when hangar doors open. |
| Failure | Simulate one missing stair GLB: clear load error and no movement into unloaded geometry. |
| iPhone | Safari: movement, touch doors, return URLs, loading, warp visuals, and acceptable frame rate. |

## Boundaries and outstanding work

This patch was prepared from the repository source and an earlier direct inspection of the stair/floor GLB geometry. GitHub branch creation was denied (403), and the build container could not download the repository. The standalone helper passed `node --check`; the installer passed Python compilation. The complete patch has not been executed against a checkout or tested in WebGL/iOS. Its dry-run checks the exact source anchors and validates the resulting JavaScript. Do not represent this as deployed or play-tested.

Room interiors still use the existing separate-page/portal-preview architecture. This patch does not create a seamless walk-in hangar, real-time door views, new furnishings or a replacement Firefly GLB. Any missing portal images, room-specific collision defects, remaining physical hull gaps or NPC stair routing require follow-up runtime work. The open lower atrium and enclosed upper rooms are preserved.
