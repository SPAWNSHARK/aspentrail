// Shared, optional adapter for the existing CrewEngine. No independent movement loop.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const distance=(a,b)=>Math.hypot(a.pos.x-b.pos.x,a.pos.z-b.pos.z);
const idle=n=>['IDLE','SEATED','WORK','REST'].includes(n.state)&&!n.partner;
const key=(d,c)=>`${d.id}:${c.id}`;
export class SocialController {
 constructor(engine,{saved={},hooks={}}={}){this.e=engine;this.hooks=hooks;this.bonds=new Map(Object.entries(saved.bonds||{}));this.active=new Map();this.next=0;this.cooldowns=new Map();}
 bond(d,c){const k=key(d,c);if(!this.bonds.has(k))this.bonds.set(k,{affinity:.35,encounters:0,last:null});return this.bonds.get(k);}
 room(n){return this.e.layout.nodes[n.node]?.room;}
 available(d,c){return idle(d)&&idle(c)&&this.room(d)===this.room(c)&&!this.e.ship.alert&&!this.e.conversation&&distance(d,c)>=.38&&distance(d,c)<=.85&&!this.active.has(d.id)&&!this.active.has(c.id);}
 start(d,c,type='pet'){if(!this.available(d,c))return false;const k=key(d,c);if((this.cooldowns.get(k)||0)>this.e.time)return false;const before={d:d.state,c:c.state};if(!this.e.pair(d,c,'pet',3.1))return false;const session={d,c,type,before,end:this.e.time+3.1};this.active.set(d.id,session);this.active.set(c.id,session);this.hooks.begin?.(session);return true;}
 finish(s,success){this.active.delete(s.d.id);this.active.delete(s.c.id);this.cooldowns.set(key(s.d,s.c),this.e.time+45);if(success){const b=this.bond(s.d,s.c);b.affinity=clamp(b.affinity+.025);b.encounters++;b.last=s.type;}this.hooks.end?.(s,success);}
 cancel(s){for(const n of [s.d,s.c]){if(n.partner!== (n===s.d?s.c.id:s.d.id))continue;n.partner=null;if(n.state==='SOCIAL'){if(n.socialReturn==='SEATED'){n.socialReturn=null;this.e.set(n,'SEATED','Console_Operate');}else{this.e.set(n,'IDLE','Idle');}n.next=this.e.time;}}this.finish(s,false);}
 tick(){for(const s of new Set(this.active.values())){if(this.e.ship.alert||this.e.conversation||this.room(s.d)!==this.room(s.c)){this.cancel(s);continue;}if(this.e.time>=s.end)this.finish(s,true);else if(s.d.state!=='SOCIAL'||s.c.state!=='SOCIAL')this.cancel(s);}
 if(this.e.time<this.next||this.e.ship.alert)return;this.next=this.e.time+4;const ns=[...this.e.npcs.values()];for(const d of ns.filter(n=>n.kind==='droid')){const cats=ns.filter(c=>c.kind==='cat'&&this.available(d,c)).sort((a,b)=>this.bond(d,b).affinity-this.bond(d,a).affinity);for(const c of cats){if(this.e.random()<.15+.45*this.bond(d,c).affinity&&this.start(d,c))break;}}}
 favorite(c){return [...this.e.npcs.values()].filter(d=>d.kind==='droid').sort((a,b)=>this.bond(b,c).affinity-this.bond(a,c).affinity)[0]?.id??null;}
 snapshot(){return {version:1,bonds:Object.fromEntries(this.bonds)};}
}
// Install once. Existing droid-droid social behavior remains; cat petting is owned here.
export function attachSocial(engine,options={}){if(engine.socialV3)return engine.socialV3;const s=new SocialController(engine,options);const update=engine.update.bind(engine);const social=engine.social.bind(engine);engine.social=function(n){if(n.kind==='droid'){const nearby=[...this.npcs.values()].some(c=>c.kind==='cat'&&s.available(n,c));if(nearby)return false;}return social(n);};engine.update=function(dt){update(dt);s.tick();};engine.socialV3=s;return s;}
