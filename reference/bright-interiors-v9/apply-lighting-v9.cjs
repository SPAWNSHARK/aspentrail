#!/usr/bin/env node
// Apply from the repository root, or pass the repository root as an argument.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || '.');
const file = path.join(root, 'interior-v8.js');
const source = fs.readFileSync(file, 'utf8');
const marker = 'WF_V9_BRIGHT_INTERIORS';
if (source.includes(marker)) { console.log('V9 already applied; no changes.'); process.exit(0); }
const edits = [
  ['warm lights → neutral white (same intensities)', 'warm lights → neutral white (preserve intensity); V9 neutral fill'],
  ["    sc.object3D.traverse(function (o) {", `    // WF_V9_BRIGHT_INTERIORS: neutral, non-shadow-casting fill for readable interiors.
    // One light per scene, including re-runs as models stream in.
    if (!sc.object3D.getObjectByName('WF_V9_InteriorFill')) {
      var fill = new THREE.HemisphereLight(0xfff4e6, 0x929ba8, 0.65);
      fill.name = 'WF_V9_InteriorFill';
      fill.userData.v8Skip = true;
      sc.object3D.add(fill);
    }
    sc.object3D.traverse(function (o) {`],
  ["      if (o.isLight) { if (done.has(o)) return; done.set(o, 1); if (o.color && warm(o.color) && !skip(o)) { o.color.copy(PAL.neutral); o.intensity *= o.isHemisphereLight ? 0.7 : 0.5; }   /* amber on walnut → white on grey reads ~2× brighter */ if (o.isHemisphereLight && o.groundColor) o.groundColor.set(0x14171b); return; }", `      if (o.isLight) {
        if (done.has(o) || skip(o)) return;
        done.set(o, 1);
        if (o.color && warm(o.color)) o.color.copy(PAL.neutral);
        // Preserve authored light intensity. Do not dim existing fixtures.
        if (o.isHemisphereLight && o.groundColor) o.groundColor.set(0x858b93);
        return;
      }`]
];
let result = source;
for (const [before, after] of edits) {
  if (result.split(before).length !== 2) throw new Error('Source changed; no files written. Manually reconcile the V9 patch: ' + before.slice(0,100));
  result = result.replace(before, after);
}
// Parse without executing browser-dependent code.
new (require('node:vm').Script)(result, {filename:file});
fs.writeFileSync(file, result, 'utf8');
console.log('V9 applied to interior-v8.js. Review git diff; test in Safari before committing.');
