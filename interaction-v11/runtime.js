/* V11 — A-Frame 1.5 / existing WAYFARER avatar and crew integration. */
(function(){'use strict';if(!window.AFRAME||!window.WFInteractionCore)return;
const T=AFRAME.THREE,W=window.WAYFARER=window.WAYFARER||{},C=window.WFInteractionCore,ctl=new C.Controller();
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z), names=['Hips','Spine','Head','Shoulder_R','Elbow_R','Hand_R','Shoulder_L','Elbow_L','Hand_L','Thigh_R','Knee_R','Foot_R','Thigh_L','Knee_L','Foot_L'];
let avatar=null,rig=null,saved=null,dialogue=null; const prefetched=new Set();
function getRig(a){if(!a||!a.kit)return null;if(rig&&rig.owner===a&&rig.kit===a.kit)return rig;let nodes={};for(const n of names)nodes[n]=a.J.root.getObjectByName(n);if(!nodes.Hips||!nodes.Shoulder_R||!nodes.Elbow_R||!nodes.Hand_R)return null;rig={owner:a,kit:a.kit,nodes};return rig;}
function world(o){return o.getWorldPosition(V());}
function snapshot(r,cam){let transforms=Object.values(r.nodes).filter(Boolean).map(n=>[n,n.position.clone(),n.quaternion.clone()]);return {transforms,cam,camPos:cam.position.clone(),camQ:cam.quaternion.clone(),visible:r.owner.J.root.visible,root:r.owner.J.root,meshes:[]};}
function restore(){if(!saved)return;for(const [n,p,q] of saved.transforms){n.position.copy(p);n.quaternion.copy(q);}for(const [m,v] of saved.meshes)m.visible=v;saved.cam.position.copy(saved.camPos);saved.cam.quaternion.copy(saved.camQ);saved.root.visible=saved.visible;saved=null;}
function pre(a){if(saved&&saved.root===a.J.root)restore();avatar=a;}
function localRotate(node,x,y,z,w){if(!node)return;node.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(x*w,y*w,z*w,'XYZ')));}
function aimJoint(j,end,target,w){if(!j||!end)return; j.updateWorldMatrix(true,true);const p=world(j),u=world(end).sub(p),v=target.clone().sub(p);if(u.lengthSq()<1e-8||v.lengthSq()<1e-8)return;u.normalize();v.normalize();const d=new T.Quaternion().setFromUnitVectors(u,v);const par=j.parent.getWorldQuaternion(new T.Quaternion());const local=par.clone().invert().multiply(d).multiply(par);j.quaternion.premultiply(new T.Quaternion().slerp(local,w));}
function solve(r,target,w){const n=r.nodes;const original=[n.Shoulder_R.quaternion.clone(),n.Elbow_R.quaternion.clone()];for(let i=0;i<7;i++){aimJoint(n.Elbow_R,n.Hand_R,target,.75);aimJoint(n.Shoulder_R,n.Hand_R,target,.75);}const solved=[n.Shoulder_R.quaternion.clone(),n.Elbow_R.quaternion.clone()];n.Shoulder_R.quaternion.copy(original[0]).slerp(solved[0],w);n.Elbow_R.quaternion.copy(original[1]).slerp(solved[1],w);}
function targetOf(o){try{const p=typeof o.target==='function'?o.target():o.target;return p&&p.isVector3&&[p.x,p.y,p.z].every(Number.isFinite)?p:null;}catch(e){return null;}}
function nearTarget(a,p,kind){if(!p||!a)return false;const base=world(a.J.root);const d=Math.hypot(base.x-p.x,base.z-p.z);return d<=(kind==='pet'||kind==='treat'?.85:.78)&&Math.abs(p.y-base.y)<2.1;}
function facing(a,p){const b=world(a.J.root),y=a.J.root.rotation.y;let d=V(p.x-b.x,0,p.z-b.z);if(d.lengthSq()<.01)return true;return d.normalize().dot(V(-Math.sin(y),0,-Math.cos(y)))>0.30;}
function start(kind,opts={}){if(!avatar||!getRig(avatar)||avatar.scripted||avatar.el.is('vr-mode')||W.frozen||ctl.active)return false;const p=targetOf(opts);if(!nearTarget(avatar,p,kind)||!facing(avatar,p))return false;const prior=W.frozen;const finish=opts.finish;const wrapped={...opts,finish:(reason,fired)=>{if(W.frozen===true)W.frozen=prior;if(finish)finish(reason,fired);}};if(!ctl.begin(kind,wrapped))return false;W.frozen=true;return true;}
function firstPersonArm(r){const n=r.nodes;r.owner.J.root.visible=true;r.owner.J.root.traverse(o=>{if(!o.isMesh)return;let keep=false;for(let p=o;p;p=p.parent){if(p===n.Shoulder_R){keep=true;break;}}saved.meshes.push([o,o.visible]);o.visible=keep&&o.visible;});}
function post(a,t,dt,cam,third){avatar=a;const r=getRig(a);if(!r||a.scripted||a.el.is('vr-mode')){if(ctl.active)ctl.end('camera-owned');return;}if(ctl.active){const p=targetOf(ctl.active.opts);if(!p||!nearTarget(a,p,ctl.active.kind)){ctl.end('target-moved');return;}}
let s;try{s=ctl.step(Math.min((dt||16)/1000,.05));}catch(e){console.warn('[V11] interaction callback',e);return;}
if(!s&&!dialogue)return;const n=r.nodes;saved=snapshot(r,cam);
if(s){const w=s.weight,p=targetOf(s.opts);if(!p){ctl.end('target-lost');return;}const low=s.kind==='pet'||s.kind==='treat';if(low){n.Hips.position.y-=.42*w;localRotate(n.Spine,.58,0,0,w);localRotate(n.Thigh_L,-.8,0,0,w);localRotate(n.Thigh_R,-.8,0,0,w);localRotate(n.Knee_L,1.45,0,0,w);localRotate(n.Knee_R,1.45,0,0,w);localRotate(n.Foot_L,-.65,0,0,w);localRotate(n.Foot_R,-.65,0,0,w);if(s.kind==='pet'&&s.hold){p.y+=.025*Math.sin(s.t*10);p.z+=.055*Math.sin(s.t*7);}}
if(!third){firstPersonArm(r);if(low){cam.position.y-=.38*w;cam.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(-.40*w,0,0)));}}
a.J.root.updateWorldMatrix(true,true);solve(r,p,w);
}else if(dialogue){const age=(t-dialogue.at)/1000;const w=C.ease(age/.35)*(dialogue.end?1-C.ease((t-dialogue.end)/350):1);if(dialogue.end&&w<=0){dialogue=null;return;}localRotate(n.Head,.06*Math.sin(age*3),.07*Math.sin(age*1.8),0,w);if(third){localRotate(n.Shoulder_R,-.26-.14*Math.sin(age*3),0,-.12,w);localRotate(n.Elbow_R,-.42-.22*Math.sin(age*2.4),0,0,w);}}
}
function catTarget(crew,n){const obj=crew.objs[n.id];if(!obj||!obj.visible)return null;return world(obj).add(V(0,.32,0));}
function cat(crew,n,kind,commit){if(!['pet','treat'].includes(kind))return false;return start(kind,{target:()=>catTarget(crew,n),contact:commit});}
function door(holder,commit){return start('door',{target:()=>holder&&holder.visible?world(holder):null,contact:commit});}
function talk(id){if(ctl.active)ctl.end('dialogue');if(dialogue&&dialogue.id===id&&!dialogue.end)return;dialogue={id,at:performance.now()};}
function endTalk(){if(dialogue)dialogue.end=performance.now();}
function prefetch(page){try{const u=new URL(page,location.href);if(u.origin!==location.origin||prefetched.has(u.href))return;prefetched.add(u.href);const l=document.createElement('link');l.rel='prefetch';l.href=u.href;document.head.appendChild(l);}catch(e){}}
function cancel(){ctl.end('cancelled');dialogue=null;restore();}
window.addEventListener('pagehide',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});window.addEventListener('keydown',e=>{if(e.code==='Escape'&&ctl.active)ctl.end('cancelled');});
W.interaction={start,door,cat,talk,endTalk,pre,post,cancel,prefetch,active:()=>!!ctl.active,attachProp:(obj,side='R')=>{const r=getRig(avatar),hand=r&&r.nodes['Hand_'+side];if(!hand||!obj)return null;const parent=obj.parent;hand.attach(obj);return ()=>{if(parent)parent.attach(obj);else hand.remove(obj);};}};
})();
