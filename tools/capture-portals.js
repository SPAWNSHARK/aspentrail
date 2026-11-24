// Regenerates the 360° doorway photos in images/portals/ that the doors show when they open.
// Run it whenever a room or the corridor changes:   node tools/capture-portals.js
//   BASE  = URL the site is served at (default http://localhost:8765/ — run `python3 -m http.server 8765` in the repo)
//   AF    = optional local path to aframe-v1.5.0.min.js (use when aframe.io is unreachable, e.g. cloud sessions:
//           `npm pack aframe@1.5.0 && tar xzf aframe-1.5.0.tgz` → package/dist/aframe-v1.5.0.min.js)
// Output: room-<id>.jpg (seen from the corridor, captured inside the room) and corr-<id>.jpg (seen from the room).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765/';
const OUT = path.join(__dirname, '..', 'images', 'portals');
const ROOMS = (process.env.ONLY || 'bridge,library,holodeck,lounge,media').split(',');   // ONLY=lounge,media to redo some
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  async function page(url) {
    const p = await b.newPage({ viewport: { width: 640, height: 360 } });
    if (process.env.AF) await p.route('**/aframe.min.js', r => r.fulfill({ path: process.env.AF }));
    p.on('pageerror', e => console.log('  page error:', e.message));
    await p.goto(BASE + url); await p.waitForTimeout(9000);
    return p;
  }
  async function save(p, frameExpr, file) {
    const data = await p.evaluate(f => window.WAYFARER.door.capture(eval(f)), frameExpr);
    fs.writeFileSync(path.join(OUT, file), Buffer.from(data.split(',')[1], 'base64'));
    console.log('  wrote', file);
  }
  fs.mkdirSync(OUT, { recursive: true });
  for (const id of ROOMS) {
    const P = await page(id + '.html?capture=1');
    await save(P, `window.WAYFARER.door.PORTALS.${id}.room`, `room-${id}.jpg`); await P.close();
  }
  if (process.env.SKIP_CORRIDOR) return b.close();
  const C = await page('index.html?capture=1');
  for (const id of ROOMS) await save(C, `window.WAYFARER.door.PORTALS.${id}.corr`, `corr-${id}.jpg`);
  await b.close();
})();
