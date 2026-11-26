# SS Wayfarer — Droid Upgrade V2

Prepared against `SPAWNSHARK/aspentrail`, default branch `claude/hello-mssbj4`, inspected November 26, 2026. This is an **integration patch**, not a deployed release. GitHub returned HTTP 403 when creating a branch.

## Integrate in this order

1. Extract this archive outside the repository. Work on a new Git branch; do not overwrite Claude's current ship reconstruction.
2. Run `python3 install.py /path/to/aspentrail` for a dry run. The installer refuses to write if an expected source anchor is missing or duplicated. All 16 anchors (including the optional model cache anchor) matched the inspected source exactly once. If the branch has changed, merge the changes manually; do not bypass the checks.
3. Run `python3 install.py /path/to/aspentrail --apply` to integrate behavior only. Then from the repository root run `node --test tests/droid-v2.test.mjs`, `node --check crew.js`, and `node --check crew/crew-engine.mjs`.
4. To install replacement models, first test on a clean checkout or branch and run `python3 install.py /path/to/aspentrail --apply --models` **instead of** the behavior-only apply command. The patch is intentionally single-use; after behavior installation, manually copy the six GLBs and update the model cache version in crew.js. Keep original models available in Git for rollback.
5. Verify bridge chairs, console reach, door clearance, walk speed, and floor contact in A-Frame and mobile Safari. Then merge when ready.

## Behavior changes

- Role-specific greetings, personal and recent-duty logs, actual maintenance fault status; no fabricated sensor results.
- Logs real console arrivals, work completion, and home seating in the existing NPC memory.
- Conversation interrupts a work assignment and resumes it afterward unless the captain orders a return to station or an alert is active.
- Emergency recall interrupts remote work and patrol routes; suppresses social activity during red alert. Preserves conversations and in-progress doorway transfer until safe to recall. Retries blocked recall after 3 seconds.
- Accelerating gait with role-specific walking speed; run clip used for existing warp-emergency speed increase when provided by replacement assets.
- Existing NPC persistence, six specialist identities, cat AI, rooms, repairs minigame, and normal command system retained. No external dependencies in game code.

## Optional GLB models

Six standalone, glTF 2.0 binary models with articulated rigid-body joint hierarchies, titanium/graphite/copper PBR materials, role-colored plates, illuminated optics, finger geometry, vents, and visible mechanical joints. Each has 12 named clips matching the existing crew interface, plus Run_InPlace (included in the 12). Approximate height 1.75 m, forward +Z. They are original procedural assets, not photorealistic or professionally hand-rigged motion capture. They use metallic materials rather than baked image textures. The model generation script is included (requires Python, numpy, trimesh).

## Validation and remaining integration

- Five standalone Node unit tests passed. Tests cover the extension logic, not the complete A-Frame runtime.
- Six GLBs parsed successfully as scenes using trimesh; binary headers, buffer bounds, and required named clips checked.
- The installer was syntax-checked and its anchors checked against current GitHub source; the full patched game has not been executed.
- Chair fit, actual foot planting, hand-to-console/kitty contact and iOS performance need gameplay testing and pose calibration. Lower-deck paths are intentionally not invented: connect the actual atrium stair graph, deck heights, doorways, xeno lab, medbay, mess and cruiser bay when the new layout is stable. Existing cross-page transfer logic and collision checks remain.
- No speech-model integration: dialogue is contextual scripted logic; existing synthesized voice/beep system remains. No autonomous physical repair animation or fault clearing has been added; repair minigame remains the source of truth.

## Claude handoff

Integrate this as a narrowly scoped crew patch. Do not regenerate index.html, atrium.js, bridge.html, room geometry, cat AI, or repairs.js. Start with behavior-only installation and tests. Preview each replacement GLB next to the existing bridge chair and workstation; calibrate before replacing existing models. Add lower-deck navigation only using the real latest layout and explicitly test stair movement, y-coordinate collision separation, floor height, chair locks and door transitions. Preserve the current six role identities and the original save key. Do not claim a feature is implemented until it is verified in the running game.
