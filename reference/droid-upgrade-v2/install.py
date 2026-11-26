#!/usr/bin/env python3
"""Run from the extracted patch: python3 install.py /path/to/aspentrail [--apply] [--models]. Defaults to dry run."""
import argparse, pathlib, shutil, sys
p=argparse.ArgumentParser();p.add_argument('repo',type=pathlib.Path);p.add_argument('--apply',action='store_true');p.add_argument('--models',action='store_true',help='Also install optional replacement GLBs (review chair fit first)');a=p.parse_args();src=pathlib.Path(__file__).parent;root=a.repo.resolve()
def replace(s, old,new):
 if s.count(old)!=1: raise ValueError('Expected exactly one anchor: '+old[:100])
 return s.replace(old,new,1)
try:
 engine=root/'crew/crew-engine.mjs'; glue=root/'crew.js'; e=engine.read_text(); g=glue.read_text()
 e=replace(e,"import {roster} from './roster.mjs';","import {roster} from './roster.mjs';\nimport {dutyRecall,stride,dialogueExtension,extraChoices,resumeDuty} from './droid-v2.mjs';")
 e=replace(e,'const speed=n.speed,step=', 'const speed=stride(n,dt),step=')
 e=replace(e,'this.emit(\'console_work\',{npc:n.id,station:g.station});','this.record(n,\'console_work\',{station:g.station});this.emit(\'console_work\',{npc:n.id,station:g.station});')
 e=replace(e,"this.emit('seated_home',{npc:n.id,station:n.station});","this.record(n,'seated_home',{station:n.station});this.emit('seated_home',{npc:n.id,station:n.station});")
 e=replace(e,"else if(n.state==='WORK'&&this.time>=n.until){this.release(n);", "else if(n.state==='WORK'&&this.time>=n.until){this.record(n,'duty_complete',{station:n.station});this.emit('duty_complete',{npc:n.id,station:n.station});this.release(n);")
 e=replace(e,"for(const n of this.npcs.values()){if(n.kind==='cat'){n.needs.energy=", "for(const n of this.npcs.values()){dutyRecall(this,n);if(n.kind==='cat'){n.needs.energy=")
 e=replace(e,"social(n){if(this.time-n.lastSocial<35", "social(n){if(this.ship.alert)return false;if(this.time-n.lastSocial<35")
 e=replace(e,"const wasSeated=n.state==='SEATED';if(!wasSeated)","const wasSeated=n.state==='SEATED';n._dutyBeforeTalk={state:n.state,goal:n.goal,target:n.route.at(-1),returnHome:false};if(!wasSeated)")
 e=replace(e,"switch(topic){case 'greeting':", "const extended=dialogueExtension(this,n,topic);if(extended!==null){line=extended;}else switch(topic){case 'greeting':")
 e=replace(e,"case 'return_to_station':m.orders.push", "case 'return_to_station':if(n._dutyBeforeTalk)n._dutyBeforeTalk.returnHome=true;m.orders.push")
 e=replace(e,"['last_order','Recall last order'],['return_to_station'", "['last_order','Recall last order'],...extraChoices,['return_to_station'")
 e=replace(e,"this.set(n,'IDLE','Idle');n.next=this.time;this.home(n);}}", "this.set(n,'IDLE','Idle');n.next=this.time;resumeDuty(this,n,n._dutyBeforeTalk);}delete n._dutyBeforeTalk;}")
 # Reset acceleration on stop. Existing visual asset filenames are preserved, optional assets only with --models.
 e=replace(e,"set(n,state,clip,duration=0,loop=true){n.state=state;", "set(n,state,clip,duration=0,loop=true){if(n.kind==='droid'&&state!=='WALK'&&state!=='WAIT_DOOR')n._stride=0;n.state=state;")
 g=replace(g,"if (self.mix[n.id]) self.mix[n.id].update(dt);", "if (self.mix[n.id]) { var action=self.cur[n.id]; if(n.kind==='droid' && n.clip==='Walk_InPlace'){var gait=n.speed>1.65 && self.acts[n.id].Run_InPlace ? 'Run_InPlace':'Walk_InPlace';self.playClip(n.id,gait,true,0.15);action=self.cur[n.id];if(action)action.setEffectiveTimeScale(Math.max(0.5,Math.min(1.7,(n._stride||n.speed)/(gait==='Run_InPlace'?2.35:1.0))));}else if(action)action.setEffectiveTimeScale(1);self.mix[n.id].update(dt); }")
 g=replace(g,"./crew/crew-engine.mjs?v=1", "./crew/crew-engine.mjs?v=2")
 if a.models: g=replace(g,"n.role + '_Living.glb?v=1'", "n.role + '_Living.glb?v=2'")
except (OSError,ValueError) as exc: sys.exit('PATCH REFUSED; no files written: '+str(exc))
changes={engine:e,glue:g};files=[(src/'crew/droid-v2.mjs',root/'crew/droid-v2.mjs'),(src/'tests/droid-v2.test.mjs',root/'tests/droid-v2.test.mjs')]
if a.models: files += [(f,root/'models/crew'/f.name) for f in sorted((src/'models/crew').glob('*.glb'))]
print('Validated exact anchors. '+('Applying' if a.apply else 'Dry run only')+':');print('\n'.join(str(x.relative_to(root)) for x in [*changes,*[dst for _,dst in files]]))
if a.apply:
 for path,s in changes.items():path.write_text(s)
 for f,dst in files:dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dst)
 print('Run: node --test tests/droid-v2.test.mjs; node --check crew.js; node --check crew/crew-engine.mjs')
