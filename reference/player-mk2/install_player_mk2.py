#!/usr/bin/env python3
"""Apply to a local SS Wayfarer checkout; no network or external packages required."""
import argparse, pathlib, re, shutil, sys
p=argparse.ArgumentParser(); p.add_argument('repo',type=pathlib.Path);p.add_argument('--check',action='store_true');a=p.parse_args(); root=a.repo.resolve(); avatar=root/'avatar.js'; src=pathlib.Path(__file__).parent/'models/player/explorer_mk2.glb'
if not avatar.is_file():sys.exit('No avatar.js at checkout root.')
s=avatar.read_text(); changes={}
if 'WAYFARER_PLAYER_MK2' in s:sys.exit('MkII patch already present; nothing changed.')
def sub(old,new):
 global s
 if s.count(old)!=1:sys.exit('Source changed; stopped without writing. Missing or ambiguous anchor: '+old[:95])
 s=s.replace(old,new,1)
sub("holder.setAttribute('gltf-model', 'models/player/explorer_command.glb?v=1');", "holder.setAttribute('gltf-model', 'models/player/explorer_mk2.glb?v=2');\n      holder.addEventListener('model-error', function () { if (!holder._wfFallback) { holder._wfFallback = true; holder.setAttribute('gltf-model', 'models/player/explorer_command.glb?v=1'); } });")
sub('var m = holder.getObject3D(\'mesh\'), clips = m.animations || [];', '''var m = holder.getObject3D('mesh'); if (!m) return; var clips = m.animations || [];
        // Warm ship lighting can leave metallic armor black: reuse the room reflection map if available.
        var env = sc.object3D.environment || (window.WF_KIT && WF_KIT.M && WF_KIT.M.copper && WF_KIT.M.copper.envMap);
        if (env) m.traverse(function (o) { if (!o.isMesh) return; [].concat(o.material || []).forEach(function (mat) { if (mat.isMeshStandardMaterial && mat.metalness > .35 && !mat.envMap) { mat.envMap = env; mat.envMapIntensity = .85; mat.needsUpdate = true; } }); });''')
sub('this.phase = 0; this.speed = 0; this.yaw = 0;', 'this.phase = 0; this.speed = 0; this.yaw = 0; this.stepClock = 0; this._camProbeAt = -1; this._camScanAt = -1;')
sub('cameraEl: function () { return this.el.camera && this.el.camera.el; },', '''cameraEl: function () { return this.el.camera && this.el.camera.el; },
    // WAYFARER_PLAYER_MK2: follow the actual room geometry, not the legacy corridor rectangle.
    cameraClearance: function (t, origin, quaternion, up, back) {
      if (!this._camRay) { this._camRay = new THREE.Raycaster(); this._camDir = new THREE.Vector3(); this._camMeshes = []; }
      if (t >= this._camScanAt) {
        this._camScanAt = t + 1500; var list = [], own = this.J.root, camera = this.cameraEl().object3D;
        this.el.object3D.traverse(function (o) {
          if (!o.isMesh || !o.geometry || o.isInstancedMesh || o.isSkinnedMesh || !o.visible) return;
          for (var q = o; q; q = q.parent) { if (q === own || q === camera || !q.visible || (q.userData && (q.userData.noCollide || q.userData.wfPortal))) return; }
          var materials = [].concat(o.material || []);
          if (!materials.length || materials.every(function (m) { return !m.visible || (m.transparent && m.opacity < .3); })) return;
          list.push(o);
        }); this._camMeshes = list;
      }
      var dir = this._camDir.set(0, up, back).applyQuaternion(quaternion), len = dir.length(); if (len < .01) return 0;
      dir.multiplyScalar(1 / len);
      // 15 Hz probe; keep the last result only while the view is nearly unchanged.
      if (t >= this._camProbeAt || !this._camOrigin || this._camOrigin.distanceToSquared(origin) > .0225 || this._camPrevDir.dot(dir) < .985 || Math.abs(this._camLen - len) > .15) {
        this._camProbeAt = t + 66; this._camOrigin = (this._camOrigin || new THREE.Vector3()).copy(origin); this._camPrevDir = (this._camPrevDir || new THREE.Vector3()).copy(dir); this._camLen = len;
        this._camRay.set(origin, dir); this._camRay.near = .04; this._camRay.far = len + .13;
        var hits = this._camRay.intersectObjects(this._camMeshes, false); var hit = hits.find(function (h) { for (var q = h.object; q; q = q.parent) { if (!q.visible) return false; } return true; });
        this._camRatio = hit ? Math.max(0, Math.min(1, (hit.distance - .18) / len)) : 1;
      }
      return back * this._camRatio;
    },''')
sub('this.speed += (Math.min(sp, 4) - this.speed) * Math.min(1, s * 8);','''this.speed += (Math.min(sp, 4) - this.speed) * (1 - Math.exp(-s * (sp > this.speed ? 9 : 13)));
      if (sp === 0 && this.speed < .045) this.speed = 0;''')
sub('var kw = Math.min(1, this.speed / 1.6); if (this.kit.walk) { this.kit.walk.setEffectiveWeight(kw); this.kit.walk.setEffectiveTimeScale(0.6 + this.speed * 0.45); }\n        if (this.kit.idle) this.kit.idle.setEffectiveWeight(1 - kw); this.kit.mx.update(s);\n        var ph1 = Math.floor(this.phase); this.phase += s * (2.2 + this.speed * 2.4); if (this.speed > 0.6 && Math.floor(this.phase) !== ph1 && window.WF_SOUND && !this.el.is(\'vr-mode\')) WF_SOUND.step();', '''var kw = Math.min(1, this.speed / 1.35), rate = Math.max(.35, Math.min(2.2, this.speed / 1.22)); kw = kw * kw * (3 - 2 * kw);
        if (this.kit.walk) { this.kit.walk.setEffectiveWeight(kw); this.kit.walk.setEffectiveTimeScale(rate); }
        if (this.kit.idle) this.kit.idle.setEffectiveWeight(1 - kw); this.kit.mx.update(s);
        // Two foot contacts per cycle, tied to clip cadence rather than an unrelated timer.
        if (this.speed > .25 && this.kit.walk) { var cycle = this.kit.walk.getClip().duration, prev = Math.floor(this.stepClock); this.stepClock += s * rate * 2 / Math.max(.1, cycle); if (Math.floor(this.stepClock) !== prev && this.speed > .55 && window.WF_SOUND && !this.el.is('vr-mode')) WF_SOUND.step(); } else this.stepClock = 0;''')
sub('var cx = wp.x + fx * back, cz = wp.z + fz * back, BB = window.WAYFARER.bounds, ok = BB ? !window.WAYFARER.clampPoly(BB, cx, cz, 0.35) : R > 0 ? Math.hypot(cx, cz) < R - 0.35 : (Math.abs(cx) < 2.3 && Math.abs(cz) < 12.3);','var cx = wp.x + fx * back, cz = wp.z + fz * back, BB = window.WAYFARER.bounds, ok = BB && window.WAYFARER.clampPoly ? !window.WAYFARER.clampPoly(BB, cx, cz, 0.35) : R > 0 ? Math.hypot(cx, cz) < R - 0.35 : true;')
sub('if (back < 1.1) { back = 0; up = 0; third = false; J.root.visible = false; }', '''back = this.cameraClearance(t, wp, this._q, up * back / 2.4, back);
        if (back < .85) { back = 0; up = 0; third = false; J.root.visible = !!(SC && SC.show); }''')
sub('this.dist += (back - this.dist) * Math.min(1, s * 6);', '''// Retract immediately to avoid clipping, ease outward after the obstruction clears.
      this.dist = back < this.dist ? back : this.dist + (back - this.dist) * (1 - Math.exp(-s * 8));''')
changes[avatar]=s
for html in root.glob('*.html'):
 t=html.read_text(); new=re.sub(r'(src=["\']avatar\.js)(?:\?[^"\']*)?(["\'])',r'\1?v=player-mk2-2\2',t)
 if new!=t:changes[html]=new
print('Would update:' if a.check else 'Updating:',', '.join(x.name for x in changes)); print('Asset:',src.name,src.stat().st_size,'bytes')
if a.check:sys.exit(0)
# Do not overwrite a different MkII asset silently.
dst=root/'models/player/explorer_mk2.glb'
if dst.exists() and dst.read_bytes()!=src.read_bytes():sys.exit('Different MkII GLB already exists; no changes written.')
dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst)
for f,content in changes.items():f.write_text(content)
print('Applied. Review git diff and test in browser before publishing.')
