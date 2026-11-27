// Nov 27: portal photos for the two Library ⇄ staircase-top doorways.
//   wing-<side>.jpg       = the Library interior seen from its stairs door (shown on the ATRIUM's Library doors)
//   lib-stairs-<side>.jpg = the atrium walkway/landing seen from the Library door (shown on the LIBRARY's stairs doors)
// Run (server on :8765, AF=<aframe-v1.5.0.min.js>):  node tools/capture-stairs.js      (needs `playwright`)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765/', OUT = path.join(__dirname, '..', 'images', 'portals');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  async function page(url) {
    const p = await b.newPage({ viewport: { width: 640, height: 360 } });
    if (process.env.AF) await p.route('**/aframe.min.js', r => r.fulfill({ path: process.env.AF }));
    p.on('pageerror', e => console.log('  page error:', e.message));
    await p.goto(BASE + url); await p.waitForTimeout(+process.env.WAIT || 14000); return p;
  }
  async function save(p, frame, file) {
    const data = await p.evaluate(f => window.WAYFARER.door.capture(f), frame);
    fs.writeFileSync(path.join(OUT, file), Buffer.from(data.split(',')[1], 'base64')); console.log('  wrote', file);
  }
  fs.mkdirSync(OUT, { recursive: true });
  let P = await page('library.html?capture=1');
  await save(P, { x: -10.42, z: -2, rot: 79.1 }, 'wing-starboard.jpg'); await save(P, { x: 10.42, z: -2, rot: -79.1 }, 'wing-port.jpg'); await P.close();
  P = await page('index.html?capture=1');
  await save(P, { x: 9.195, y: 0, z: 31.59, rot: 115.7 }, 'lib-stairs-starboard.jpg'); await save(P, { x: -9.195, y: 0, z: 31.59, rot: -115.7 }, 'lib-stairs-port.jpg'); await P.close();
  await b.close();
})();
