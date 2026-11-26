"""Run from a checkout with Python 3: python /path/install_felines.py /path/checkout"""
from pathlib import Path
import sys, shutil
root=Path(sys.argv[1]).resolve(); here=Path(__file__).parent
p=root/'crew.js'; e=root/'crew/crew-engine.mjs'; s=p.read_text(); t=e.read_text()
def replace(s,a,b):
 if s.count(a)!=1: raise SystemExit('Integration anchor changed; no files written: '+a[:100])
 return s.replace(a,b)
s=replace(s,"'models/crew/Kitty_' + n.name + '.glb?v=1'","'models/crew/Kitty_' + n.name + '.glb?v=2'")
s=replace(s,"if (!a) return; var old = this.cur[id];","if (!a) { console.warn('Missing crew animation', id, clip); return; } var old = this.cur[id];")
s=replace(s,"o.position.set(x, 0, z);","o.position.set(x, n.kind === 'cat' ? (n.pos.y || 0) : 0, z);")
s=replace(s,"if (self.mix[n.id]) self.mix[n.id].update(dt);","if (self.mix[n.id]) { var action = self.cur[n.id]; if (n.kind === 'cat' && action && n.state === 'WALK') action.setEffectiveTimeScale(Math.max(0.65, Math.min(1.6, n.speed / 0.72))); self.mix[n.id].update(dt); }")
t=replace(t,"const speed=n.speed,step=Math.min(d,speed*dt);","const speed=n.kind==='cat'? (n.currentSpeed=Math.min(n.speed,(n.currentSpeed??0)+dt*1.8), Math.min(n.currentSpeed,Math.max(.18,d*3))):n.speed,step=Math.min(d,speed*dt);")
t=replace(t,"n.state=state;n.until=this.time+duration;","if(n.kind==='cat'&&state!=='WALK')n.currentSpeed=0;n.state=state;n.until=this.time+duration;")
t=replace(t,"if(g.type==='social'){this.set(n,'IDLE','Idle');return;}","if(g.type==='social'){this.set(n,'IDLE','Idle');return;}if(n.kind==='cat'&&g.type==='rest'){this.set(n,'REST','Sleep',this.range(20,75));return;}")
t=replace(t,"if(r<.48){this.set(n,'GROOM','Groom',2.4,false);return;}","if(r<.48){this.set(n,'GROOM',this.pick(['Groom','Stretch','Sniff','LookAround','Knead']),2.4,false);return;}")
t=replace(t,"if(r<.62){this.set(n,'PLAY','Play',1.35,false);return;}","if(r<.62){this.set(n,'PLAY',this.pick(['Play','Pounce','TailFlick','Roll']),2.4,false);return;}")
# Validate every anchor before writing, preserve originals outside source paths.
backup=root/'feline-v2-backup'; backup.mkdir(exist_ok=False)
for f in [p,e,*[root/'models/crew'/x.name for x in (here/'models/crew').glob('*.glb')]]:
 dest=backup/f.relative_to(root);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
p.write_text(s);e.write_text(t)
for f in (here/'models/crew').glob('*.glb'):shutil.copy2(f,root/'models/crew'/f.name)
print('Installed prototype; original files in feline-v2-backup. Test before committing.')
