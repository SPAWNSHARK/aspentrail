/** Wayfarer V9: dependency-injected Three.js, no DOM assumptions, Y-up, meters. */
export const SURFACES={graphite_deck:'metal',brushed_titanium:'metal',copper_trim:'metal',rubber_tread:'rubber',ceramic_tile:'ceramic',woven_carpet:'carpet',grating:'grating',glass:'glass',stairs:'stairs'};
export const QUALITY={low:{dust:70,smoke:6,decals:36},medium:{dust:160,smoke:12,decals:72},high:{dust:320,smoke:24,decals:128}};
const materialIds=['graphite_deck','brushed_titanium','copper_trim','rubber_tread','ceramic_tile','woven_carpet'];
export function createRealism({THREE:T,scene,baseURL=new URL('../',import.meta.url),quality='low',random=Math.random}={}){
 if(!T||!scene)throw Error('Provide THREE and scene');
 const base=new URL(baseURL,import.meta.url), q=QUALITY[quality]||QUALITY.low, loader=new T.TextureLoader(), textures=new Map(), owned=new Set(), materials=new Set(), emitters=[], volumes=[], decals=[], smoke=[], actors=new Map();
 const group=new T.Group();group.name='Wayfarer V9 transient effects';scene.add(group);
 const url=p=>new URL(p,base).href;
 const tex=(name,srgb=false)=>{const key=name+':'+srgb;if(!textures.has(key)){const t=loader.load(url('textures/'+name+'.png'));if(srgb){if(T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;else if(T.sRGBEncoding)t.encoding=T.sRGBEncoding;}t.anisotropy=2;textures.set(key,t);}return textures.get(key);};
 const own=g=>{owned.add(g);return g;}; const mat=m=>{materials.add(m);return m;};
 const plane=own(new T.PlaneGeometry(1,1));
 let ctx=null, audioEnabled=false, audioBuffers=new Map(), lastAudio=0, disposed=false, clock=0;
 function makeMaterial(id,{repeat=[1,1],normalStrength=.45,envMapIntensity=.75}={}){
  if(!materialIds.includes(id))throw Error('Unknown V9 material '+id);
  const maps=['basecolor','normal','orm'].map((kind,i)=>{const x=tex(id+'_'+kind,i===0).clone();x.wrapS=x.wrapT=T.RepeatWrapping;x.repeat.set(...repeat);x.needsUpdate=true;owned.add(x);return x;});
  return mat(new T.MeshStandardMaterial({map:maps[0],normalMap:maps[1],normalScale:new T.Vector2(normalStrength,normalStrength),aoMap:maps[2],roughnessMap:maps[2],metalnessMap:maps[2],roughness:1,metalness:1,envMapIntensity}));
 }
 // Existing V8 objects are not modified unless the host explicitly requests it.
 function tagSurface(mesh,id){if(!SURFACES[id])throw Error('Unknown surface '+id);mesh.userData.wayfarerSurface=id;return mesh;}
 function surfaceOf(hit){let obj=hit?.object;while(obj){if(obj.userData?.wayfarerSurface)return obj.userData.wayfarerSurface;obj=obj.parent;}return 'graphite_deck';}
 function worldNormal(hit){if(!hit?.face||!hit.object)return new T.Vector3(0,1,0);return hit.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();}
 function decal(kind,pos,normal=new T.Vector3(0,1,0),{size=.6,opacity=.6,angle=0,lifetime=Infinity}={}){
  if(disposed)return; if(decals.length>=q.decals){const i=decals.findIndex(x=>Number.isFinite(x.life));removeDecal(i<0?0:i);}
  const m=mat(new T.MeshBasicMaterial({map:tex(kind,true),transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:T.DoubleSide}));
  const mesh=new T.Mesh(plane,m);mesh.position.copy(pos).addScaledVector(normal,.003);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),normal.clone().normalize());mesh.rotateZ(angle);mesh.scale.set(size,size,1);mesh.renderOrder=2;group.add(mesh);decals.push({mesh,life:lifetime,max:lifetime,opacity});return mesh;
 }
 function removeDecal(i){const d=decals.splice(i,1)[0];if(!d)return;group.remove(d.mesh);materials.delete(d.mesh.material);d.mesh.material.dispose();}
 // Smoke is explicitly opt-in and originates from tagged vents or machinery, never randomly throughout the ship.
 function addSmokeEmitter(position,{rate=.75,velocity=new T.Vector3(0,.12,0),life=5,size=.28,opacity=.16}={}){const e={position,rate,velocity,life,size,opacity,acc:0,enabled:true};emitters.push(e);return e;}
 function addDustVolume({center,size,count=q.dust}={}){
  const available=q.dust-volumes.reduce((sum,v)=>sum+v.count,0);count=Math.min(count,available);if(count<1)return;
  const arr=new Float32Array(count*3);const velocity=new Float32Array(count*3);for(let i=0;i<arr.length;i++){arr[i]=(random()-.5)*size.getComponent(i%3);velocity[i]=(random()-.5)*.025;}
  const geo=own(new T.BufferGeometry());geo.setAttribute('position',new T.BufferAttribute(arr,3));const m=mat(new T.PointsMaterial({map:tex('dust_sprite'),color:0xd7d5ca,transparent:true,opacity:.27,depthWrite:false,size:.014,sizeAttenuation:true}));
  const pts=new T.Points(geo,m);pts.position.copy(center);group.add(pts);volumes.push({geo,pts,size,count,arr,velocity});return pts;
 }
 function spawnSmoke(e){if(smoke.length>=q.smoke)return;const m=mat(new T.SpriteMaterial({map:tex('smoke_sprite'),color:0xa5b1ba,transparent:true,opacity:0,depthWrite:false}));const s=new T.Sprite(m);s.position.copy(e.position);s.scale.setScalar(e.size);group.add(s);smoke.push({s,e,age:0,drift:new T.Vector3((random()-.5)*.05,0,(random()-.5)*.05)});}
 async function enableAudio(){if(disposed)return false;const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return false;ctx??=new AC();await ctx.resume();audioEnabled=true;return true;}
 async function getBuffer(surface,variant){const key=surface+'_'+variant;if(!audioBuffers.has(key)){const p=fetch(url('sounds/'+key+'.wav')).then(r=>{if(!r.ok)throw Error('Audio fetch '+r.status);return r.arrayBuffer();}).then(a=>ctx.decodeAudioData(a)).catch(()=>{audioBuffers.delete(key);return null;});audioBuffers.set(key,p);}return audioBuffers.get(key);}
 async function playStep(surface,position,volume=.28){if(!audioEnabled||!ctx||ctx.state!=='running'||disposed)return;const stamp=ctx.currentTime;if(stamp-lastAudio<.035)return;lastAudio=stamp;const id=SURFACES[surface]||surface;if(!['metal','grating','rubber','ceramic','carpet','glass','stairs'].includes(id))return;const b=await getBuffer(id,1+Math.floor(random()*4));if(!b||disposed||ctx.state!=='running')return;const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;s.playbackRate.value=.92+random()*.16;g.gain.value=volume;let p;if(position&&ctx.createPanner){p=ctx.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=1.5;p.maxDistance=18;p.rolloffFactor=1.4;if(p.positionX){p.positionX.value=position.x;p.positionY.value=position.y;p.positionZ.value=position.z;}else p.setPosition(position.x,position.y,position.z);s.connect(g).connect(p).connect(ctx.destination);}else s.connect(g).connect(ctx.destination);s.onended=()=>{s.disconnect();g.disconnect();p?.disconnect();};s.start();}
 function setListener(camera){if(!ctx||!camera)return;const v=camera.getWorldPosition(new T.Vector3()),d=camera.getWorldDirection(new T.Vector3()),u=new T.Vector3(0,1,0).applyQuaternion(camera.getWorldQuaternion(new T.Quaternion()));const l=ctx.listener;if(l.positionX){for(const [k,val] of Object.entries({positionX:v.x,positionY:v.y,positionZ:v.z,forwardX:d.x,forwardY:d.y,forwardZ:d.z,upX:u.x,upY:u.y,upZ:u.z}))l[k].value=val;}else{l.setPosition(v.x,v.y,v.z);l.setOrientation(d.x,d.y,d.z,u.x,u.y,u.z);}}
 // Call at actual animation foot contact. Hit should come from host ground raycast, never from decorative decals.
 function footContact({hit,actor='player',foot='left',heading=0,dirty=false,volume=.28,prints=true}={}){if(!hit?.point)return false;const surface=surfaceOf(hit);playStep(surface,actor==='player'?null:hit.point,volume);const n=worldNormal(hit);if(dirty&&prints&&n.y>.6&&!['woven_carpet','grating','glass'].includes(surface))decal(foot==='right'?'boot_right':'boot_left',hit.point,n,{size:.37,opacity:.24,angle:heading,lifetime:80});return true;}
 // Fallback for first-person controllers without foot animation events. Ground hit must be valid.
 function trackActor(id,position,{hit,grounded=true,stride=.72,heading=0,dirty=false,volume=.28,prints=true}={}){let a=actors.get(id);if(!a){actors.set(id,{last:position.clone(),distance:0,foot:'left'});return;}const d=Math.hypot(position.x-a.last.x,position.z-a.last.z);a.last.copy(position);if(!grounded||!hit||d>2){a.distance=0;return;}a.distance+=d;if(a.distance>=stride){a.distance%=stride;footContact({hit,actor:id,foot:a.foot,heading,dirty,volume,prints});a.foot=a.foot==='left'?'right':'left';}}
 function update(dt,camera){if(disposed)return;dt=Math.max(0,Math.min(.1,dt));clock+=dt;setListener(camera);for(const e of emitters){if(!e.enabled)continue;e.acc=Math.min(1,e.acc+dt*e.rate);if(e.acc>=1){spawnSmoke(e);e.acc=0;}}
  for(let i=smoke.length-1;i>=0;i--){const p=smoke[i];p.age+=dt;const a=p.age/p.e.life;if(a>=1){group.remove(p.s);materials.delete(p.s.material);p.s.material.dispose();smoke.splice(i,1);continue;}p.s.position.addScaledVector(p.e.velocity,dt).addScaledVector(p.drift,dt);p.s.scale.setScalar(p.e.size*(1+a*2.5));p.s.material.opacity=p.e.opacity*Math.sin(Math.PI*a);}
  for(const v of volumes){for(let i=0;i<v.arr.length;i++){let bound=v.size.getComponent(i%3)*.5;v.arr[i]+=v.velocity[i]*dt;if(v.arr[i]>bound)v.arr[i]=-bound;if(v.arr[i]<-bound)v.arr[i]=bound;}v.geo.attributes.position.needsUpdate=true;}
  for(let i=decals.length-1;i>=0;i--){const d=decals[i];if(!Number.isFinite(d.life))continue;d.life-=dt;if(d.life<=0)removeDecal(i);else d.mesh.material.opacity=d.opacity*Math.min(1,d.life/Math.min(12,d.max));}}
 function dispose(){if(disposed)return;disposed=true;scene.remove(group);for(const x of materials)x.dispose();for(const x of owned)x.dispose();for(const x of textures.values())x.dispose();if(ctx)ctx.close().catch(()=>{});actors.clear();audioBuffers.clear();}
 return {makeMaterial,tagSurface,surfaceOf,worldNormal,decal,addSmokeEmitter,addDustVolume,enableAudio,playStep,footContact,trackActor,update,dispose,group};
}
