SS WAYFARER / PLAYER CHARACTER MK II

INSTALL (from a local checkout, not the live website)
  python3 install_player_mk2.py /path/to/aspentrail --check
  python3 install_player_mk2.py /path/to/aspentrail

Alternatively ask Claude/Codex to apply the installer to its checkout. It will stop before writing if source anchors no longer match. Review git diff and commit only after testing. The original explorer_command.glb is retained as load-error fallback. The installer updates shared avatar.js and cache-busts HTML pages referencing it; it does not change rooms, mobile controls, NPCs or chair scripts.

ASSET
models/player/explorer_mk2.glb — original articulated hard-surface suit, +Z forward, approximately 1.86 m tall, copper/graphite/ceramic finishes, cobalt visor, wrist screen, emissive backpack and suit accents. Five named glTF animation clips: Idle, Walk_InPlace, Sit_Down, Stand_Up, Seated_Idle. Uses joint hierarchy rather than weighted skin; no external texture files. PBR materials, geometry details and emissive elements, not photorealistic baked textures. 102 mesh primitives; mobile frame rate not benchmarked.

PATCH
- Switches to the MkII model with old suit fallback on model load failure.
- Adjusts speed smoothing, walk blend and clip-rate-based footstep cadence.
- Removes obsolete narrow corridor rectangle and adds periodic geometry ray probes for third-person camera clearance. Obstruction handling is approximate; instanced, skinned and explicitly non-collidable meshes are excluded.
- Maintains existing V/mobile toggle, localStorage view, and WAYFARER.avatar.script/ready/hide interface for chair and cinematics.

TEST BEFORE MERGING
1. Atrium upper and lower decks, curved stairs, tight doors; first/third-person toggle and camera retraction.
2. Idle/walk transitions, stop/start, actual foot placement on stairs, footsteps.
3. Bridge approach, sit, seated idle, stand and camera handoff; verify hips/feet align with chair. The animation timing matches the named interface but seat placement has not been visually calibrated.
4. Check GLB loading on iOS Safari and performance; if required temporarily restore original model URL.
5. Check other pages and VR mode. No runtime browser test was possible in this session.

Repository inspected: SPAWNSHARK/aspentrail, branch claude/hello-mssbj4, commit 5b742b81c2db41d75d896f184da4d244ffb7f831. GitHub branch creation returned 403, so nothing has been pushed or deployed.
