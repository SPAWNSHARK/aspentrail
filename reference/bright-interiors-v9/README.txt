SS WAYFARER | BRIGHT INTERIORS V9
Target: SPAWNSHARK/aspentrail, shared interior-v8.js as inspected on claude/hello-mssbj4.

Run from the Git checkout: node path/to/apply-lighting-v9.cjs
Or: node path/to/apply-lighting-v9.cjs /path/to/repo

Changes only interior-v8.js. Does not replace the V8 floor, walls, ceilings,
GLBs, NPCs, navigation, textures, or any other asset pack. Existing warm lights
keep their authored power when converted to neutral white; hemisphere ground
lighting is lifted; a single non-shadow-casting fill is added to the scene.
Protected portal/keepLook/v8Skip lights are left alone. The new global fill can
still illuminate any lit objects in the same scene, including NPCs or exterior
geometry visible through windows. Verify the Firefly and any portal previews.

For Claude: apply, inspect git diff, update the cache-busting version on each
interior-v8.js script include and any relevant service worker cache, test all
interiors in iOS Safari, and check exposed viewports and bright displays for
clipping. Keep ACES exposure 1.1 initially; do not globally boost exposure or
bloom. If necessary tune the new fill's 0.65 intensity by scene after visual
review. Add this same lighting baseline to new captain/xenobiology scenes when
integrating their packs. Do not apply to open-space or planetary scenes blindly.

The patch is intentionally guarded: it refuses to write if its expected source
lines have changed. A second application makes no edits. To revert before
commit, review and reverse just this patch; do not discard concurrent changes.
No live deployment or visual testing was performed by ChatGPT.
