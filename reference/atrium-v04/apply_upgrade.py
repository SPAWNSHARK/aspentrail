#!/usr/bin/env python3
"""Apply SS Wayfarer atrium v0.4 against the audited Nov 26 source.
Run from anywhere: python3 apply_upgrade.py /path/to/aspentrail [--apply]
Default is dry run. All anchors must match uniquely before anything is written.
"""
import argparse, pathlib, re, shutil, subprocess, tempfile, sys, difflib
HERE = pathlib.Path(__file__).resolve().parent
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('repo', type=pathlib.Path)
p.add_argument('--apply', action='store_true')
args=p.parse_args(); repo=args.repo.resolve()
original={}; changed={}
def get(name):
    if name not in original: original[name]=(repo/name).read_text(encoding='utf-8')
    return changed.get(name,original[name])
def put(name,s): changed[name]=s
def replace(name,old,new):
    s=get(name)
    if s.count(old)!=1: raise ValueError(f'{name}: expected one anchor, got {s.count(old)}: {old[:100]!r}. Reconcile against current source; no files written.')
    put(name,s.replace(old,new,1))
def rx(name,pattern,new):
    s=get(name);out,n=re.subn(pattern,lambda m:new,s,flags=re.S)
    if n!=1: raise ValueError(f'{name}: regex anchor matched {n} times: {pattern[:100]}')
    put(name,out)
try:
    a='atrium.js'; d='door.js'; k='kitroom.js'
    # Engine threshold matches layout.json and navigation.json (z=26.6), not 25.8.
    replace(a,"name: 'ENGINE ROOM',       x: 0,    z: 25.8", "name: 'ENGINE ROOM',       x: 0,    z: 26.6")
    replace(d,"corr: { x: 0, y: -5.95, z: 25.8, rot: 180 },  room: { x: 0, z: 26.6", "corr: { x: 0, y: -5.95, z: 26.6, rot: 180 },  room: { x: 0, z: 26.6")
    replace(d,"bmax: [4.6, -0.23, 25.8]", "bmax: [4.6, -0.23, 26.6]")
    replace(a,"if (y0 !== 0) { c.scale.y = HL / H; c.position.y = y0 + HL / 2; }", "if (y0 !== 0) { c.scale.set(9.4 / 10.2, HL / H, 9.4 / 10.2); c.position.y = y0 + HL / 2; }")
    # Add landing surfaces and a window-only shader, using the existing scene state.
    replace(a,"  // ── lights ──", (HERE/'atrium_v04_helpers.js').read_text()+"\n  // ── lights ──")
    replace(a,"mats(envMap(sc.renderer)); buildLights(flat);", "mats(envMap(sc.renderer)); buildLights(flat); buildStairLandings(flat);")
    rx(a,r"      // light speed overhead through the skylight[^\n]*\n      if \(window\.WAYFARER\.hyperspace\) this\.hyper = window\.WAYFARER\.hyperspace\(flat, \{.*?\}\);\n", "      // v0.4: exterior effects are confined to the real skylight.\n      this.hyper = buildSkylightView(flat);\n")
    # Aft roof is made depth-writing and double-sided, including the lower opening's view.
    # Preserve roof cutout, transparent skylight mesh and both deck interiors.
    replace(a,"var w = new THREE.Mesh(g, mat); mat.side = THREE.DoubleSide; root.add(w);", "var w = new THREE.Mesh(g, mat); mat.side = THREE.DoubleSide; mat.depthWrite = true; root.add(w);")
    # Explicit room identity for correct return floor (including restricted iOS referrer).
    replace(a,"  function fromRoom() {\n    try", "  function fromRoom() {\n    var explicit = new URLSearchParams(location.search).get('fromRoom');\n    if (explicit && DOORS.some(function(d){return d.id === explicit;})) return explicit;\n    try")
    replace(d,"leave('index.html', 'images/portals/corr-' + id + '.jpg', CORR_YAW[id]);", "leave('index.html?fromRoom=' + encodeURIComponent(id), 'images/portals/corr-' + id + '.jpg', CORR_YAW[id]);")
    # Library stair portals spawn on repaired approach, facing down the curved route.
    replace(a,"if (st) { p.x = st === 'port' ? -10.2 : 10.2; p.z = 31.6; this.floorY = 0; yaw = Math.PI; if (this.last) { this.last.x = p.x; this.last.z = p.z; } }", "if (st) { var side = st === 'port' ? -1 : 1, angle = -0.51; p.x = side * 11.35 * Math.cos(angle); p.z = 36 + 11.35 * Math.sin(angle); this.floorY = 0; yaw = Math.atan2(side * Math.sin(angle), -Math.cos(angle)); if (this.last) { this.last.x = p.x; this.last.z = p.z; } }")
    # Block movement into the correct core at each deck; upper approach no longer blocks the stair's inner edge.
    replace(a,"var y = floorAt(p.x, p.z, this.floorY), lib = Math.hypot(p.x, p.z - 36) < 10.5 && p.z > 25.5;\n          if (y === null || lib) { p.x = this.last.x; p.z = this.last.z; }\n          else { this.floorY = y; this.last.x = p.x; this.last.z = p.z; }", """// Sweep short segments to prevent skipping treads or jumping across holes at low FPS.
          var dx = p.x - this.last.x, dz = p.z - this.last.z;
          var n = Math.max(1, Math.ceil(Math.hypot(dx,dz) / 0.09));
          var sx = this.last.x, sz = this.last.z;
          for (var i=1;i<=n;i++) {
            var x=sx+dx*i/n, z=sz+dz*i/n, y=floorAt(x,z,this.floorY);
            var radius = this.floorY < -3 ? 9.4 : 10.2;
            var insideCore = Math.hypot(x,z-36) < radius && z > 25.5;
            if (y===null || insideCore) break;
            this.floorY=y; this.last.x=x; this.last.z=z;
          }
          p.x=this.last.x; p.z=this.last.z;""")
    # Use validated support for the first tick; do not initialize walking until wall and all floor assets are loaded.
    replace(a,"left = parts.length;", "left = parts.length + 1, failed = [];")
    replace(a,"console.error('atrium', n, e); if (--left === 0) self.ready();", "console.error('atrium', n, e); failed.push(n); if (--left === 0) self.ready(failed);")
    replace(a,"root.add(m); if (--left === 0) self.ready();", "root.add(m); if (--left === 0) self.ready(failed);")
    replace(a,"fetch('reference/atrium-kit/layout.json').then(function (r) { return r.json(); }).then(function (LY) { buildWalls(flat, LY.corridor.outerPolygon); }).catch(function (e) { console.error(e); });", "fetch('reference/atrium-kit/layout.json').then(function(r){if(!r.ok)throw Error('layout '+r.status);return r.json();}).then(function(LY){buildWalls(flat,LY.corridor.outerPolygon);}).catch(function(e){console.error(e);failed.push('layout / walls');}).then(function(){if(--left===0)self.ready(failed);});")
    replace(a,"ready: function () { walk.forEach(function (m) { m.updateMatrixWorld(true); }); this.walkReady = true; var f = document.getElementById('wf-fade'); if (f) f.style.opacity = '0'; },", """ready: function (failed) {
      this.el.object3D.updateMatrixWorld(true);
      var f=document.getElementById('wf-fade'); if(f)f.style.opacity='0';
      if(failed && failed.length){this.loadFailed=true;window.WAYFARER.frozen=true; say('ATRIUM LOAD ERROR: '+failed.join(', '),'#ff8f70'); console.error('Atrium missing required assets',failed);return;}
      var p=this.cam.object3D.position, y=floorAt(p.x,p.z,this.floorY);
      if(y===null){ this.spawnFallback=true; p.x=0; p.z=-21; this.floorY=0; y=floorAt(p.x,p.z,0); }
      if(y===null){this.loadFailed=true;window.WAYFARER.frozen=true;say('ATRIUM: NO SAFE SPAWN','#ff8f70');return;}
      this.floorY=y; this.player.object3D.position.y=y; this.last={x:p.x,z:p.z}; this.walkReady=true;
      say(this.spawnFallback?'SAFE SPAWN · UPPER DECK':(y < -3 ? 'LOWER DECK':'UPPER DECK'));
    },""")
    # Reset player position each tick until loading completes (movement input can run while GLBs stream).
    replace(a,"      this.spawn();\n    },\n    ready:", "      this.spawn(); this.loadingPosition=this.cam.object3D.position.clone();\n    },\n    ready:")
    replace(a,"var p=this.cam.object3D.position, y=floorAt(p.x,p.z,this.floorY);", "var p=this.cam.object3D.position; if(this.loadingPosition)p.copy(this.loadingPosition); var y=floorAt(p.x,p.z,this.floorY);")
    replace(a,"if (this.hyper) this.hyper.update(t / 1000);", "if (this.hyper) this.hyper.update(t / 1000);\n      if(!this.walkReady){if(this.loadingPosition)p.copy(this.loadingPosition);return;}")
    # More reliable room load failure handling, no pretending failed models are present.
    replace(k,"left = list.length;", "left = list.length, failed = [];")
    replace(k,"console.error('kitroom', q[0], e); if (--left === 0) self.ready();", "console.error('kitroom', q[0], e); failed.push(q[0]); if (--left === 0) self.ready(failed);")
    s=get(k)
    if s.count('if (--left === 0) self.ready();')!=2: raise ValueError('kitroom.js: expected two success callback anchors')
    put(k,s.replace('if (--left === 0) self.ready();','if (--left === 0) self.ready(failed);'))
    replace(k,"ready: function () { var f = document.getElementById('wf-fade'); if (f) f.style.opacity = '0'; toast(R.hello);", "ready: function (failed) { var f = document.getElementById('wf-fade'); if (f) f.style.opacity = '0'; if(failed && failed.length){toast('ROOM LOAD ERROR: '+failed.join(', '));console.error('Room missing required assets',failed);return;} toast(R.hello);")
    # Cache bust the edited JS only; never replace unrelated versions or user assets.
    for f in repo.glob('*.html'):
        s=f.read_text(encoding='utf-8'); t=re.sub(r'((?:atrium|door|kitroom)\.js)(?:\?v=[^"\']+)?(?=["\'])',r'\1?v=atrium-v04',s)
        if s!=t: original[f.name]=s; changed[f.name]=t
    # Syntax checks on the actual patched JS, if Node is available. No repo files modified yet.
    node=shutil.which('node')
    if node:
        with tempfile.TemporaryDirectory() as tmp:
            for name,s in changed.items():
                if name.endswith('.js'):
                    f=pathlib.Path(tmp)/name; f.write_text(s,encoding='utf-8'); subprocess.run([node,'--check',str(f)],check=True)
    else: print('WARNING: Node unavailable; JavaScript syntax checks skipped.')
    for name,s in changed.items():
        print(f'{name}: {len(original[name])} -> {len(s)} chars')
    if args.apply:
        for name,s in changed.items(): (repo/name).write_text(s,encoding='utf-8')
        print('Applied. Review git diff and test in browser before deployment.')
    else: print('Dry run successful. No files written. Re-run with --apply after reviewing.')
except Exception as e:
    print('STOP:',e,file=sys.stderr);sys.exit(1)
