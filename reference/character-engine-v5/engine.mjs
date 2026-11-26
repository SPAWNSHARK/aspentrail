import {profiles as base,cameraTarget} from './navigation.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,t,d)=>v+clamp(t-v,-d,d);
export const profiles=Object.fromEntries(Object.entries(base).map(([k,p])=>[k,{...p,jump:{player:4.5,droid:3,cat:5,kvetar:4.8}[k],height:{player:1.8,droid:1.9,cat:.4,kvetar:2.1}[k],radius:k==='cat'?.17:.3}]));
export class Character {
 constructor(kind='player',pos={x:0,y:0,z:0}){this.kind=kind;this.p=profiles[kind];if(!this.p)throw Error('Unknown species');this.pos={...pos};this.v={x:0,y:0,z:0};this.grounded=false;this.clip='Idle';this.jumpHeld=false;this.yaw=0;this.action=null;this.events=[];}
 act(clip,seconds){if(seconds>0)this.action={clip,left:seconds};}
 tick(dt,input={},world){this.events=[];let remaining=clamp(dt,0,.25);while(remaining>1e-8){const h=Math.min(remaining,1/120);this.step(h,input,world);remaining-=h;}return this.pos;}
 step(dt,i,w){const p=this.p,old={...this.pos},g=w.ground(old,p),gravity=w.gravity??9.81,zero=gravity===0,water=!!w.water?.(old),ladder=!!w.ladder?.(old)&&!!i.climb;const crouch=!!i.crouch, height=p.height*(crouch?.55:1);const shape={...p,height};let x=i.x??0,z=i.z??0;const mag=Math.max(1,Math.hypot(x,z));x/=mag;z/=mag;const speed=p.speed*(i.run?1.8:i.crawl?.25:crouch?.45:water?.55:1);const accel=this.grounded?9:zero?3:4;this.v.x=approach(this.v.x,x*speed,accel*dt);this.v.z=approach(this.v.z,z*speed,accel*dt);if(g&&Math.abs(old.y-g.y)<.035&&this.v.y<=0&&!zero)this.grounded=true;
 const jump=!!i.jump&&!this.jumpHeld;this.jumpHeld=!!i.jump;if(jump&&this.grounded&&!crouch){this.v.y=p.jump;this.grounded=false;this.events.push('jump');}
 if(ladder||water||zero){this.v.y=approach(this.v.y,(i.up??0)*speed,6*dt);this.grounded=false;}else this.v.y-=gravity*dt;
 let q={x:old.x+this.v.x*dt,y:old.y,z:old.z+this.v.z*dt};let floor=w.ground(q,p);const clear=(a,b)=>w.sweep?w.sweep(a,b,shape):w.clear?w.clear(b,shape):true;
 if((this.grounded&&floor&&floor.y-old.y>p.step)||!clear(old,q)){q={...old};this.v.x=this.v.z=0;this.events.push('blocked');floor=g;}
 let next={...q,y:old.y+this.v.y*dt};const was=this.grounded;const canSnap= floor&&this.v.y<=0&&!zero&&!water&&!ladder&&floor.y-old.y<=p.step&&((next.y<=floor.y&&old.y>=floor.y-p.step)||(was&&old.y-floor.y<=p.step));
 if(canSnap){if(!was&&this.v.y< -1)this.events.push('land');next.y=floor.y;this.v.y=0;this.grounded=true;}else this.grounded=false;
 if(!clear(q,next)){next.y=old.y;this.v.y=0;this.events.push('verticalBlocked');}this.pos=next;
 const moving=Math.hypot(this.v.x,this.v.z)>.08;if(moving)this.yaw=Math.atan2(this.v.x,this.v.z);const dy=next.y-old.y;this.clip=ladder?'Climb_Ladder':water?'Swim':zero?'ZeroG':!this.grounded?(this.v.y>0?'Jump':'Fall'):floor?.stair&&moving?(dy>=0?'Stair_Up':'Stair_Down'):i.crawl?'Crawl':crouch?(moving?'Crouch_Walk':'Crouch'):moving?(i.run?'Run':'Walk_InPlace'):'Idle';
 if(this.action){this.action.left-=dt;if(this.action.left<=0||moving||!this.grounded)this.action=null;else this.clip=this.action.clip;}}
 camera(mode,world){return cameraTarget(this.pos,this.yaw,mode,world,{height:this.p.height*.92,boom:3});}
}
export class Animator{constructor(mixer,clips){this.mixer=mixer;this.actions=new Map(clips.map(c=>[c.name,mixer.clipAction(c)]));this.current=null;} play(name,speed=1){const a=this.actions.get(name)||this.actions.get('Idle');if(!a)return false;if(a!==this.current){this.current?.fadeOut(.18);a.reset().fadeIn(.18).play();this.current=a;}a.setEffectiveTimeScale(clamp(speed,.25,2));return this.actions.has(name);} update(dt){this.mixer.update(dt);}}
export function footTargets(feet,world){return feet.map(f=>{const g=world.ground(f,{});return {...f,y:g?.tread??g?.y??f.y};});}
export function surfaceAudio(events,surface,kind){return events.filter(e=>['jump','land','step'].includes(e)).map(e=>`${kind}/${surface}/${e}`);}
