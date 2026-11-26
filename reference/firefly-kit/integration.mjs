// Standalone Three.js integration adapter; pass the application's THREE and GLTFLoader.
// This is not a drop-in replacement for the existing A-Frame multi-page game.
export async function loadWayfarer({THREE,loader,scene,base='./models/'}) {
  const [deck,exterior]=await Promise.all([
    loader.loadAsync(base+'Wayfarer_Dual_Deck_Assembled.glb'),
    loader.loadAsync(base+'Wayfarer_Exterior_Mobile_Animated_Jaw.glb')]);
  const ship=new THREE.Group();ship.name='Wayfarer_Atrium_Prototype';scene.add(ship);
  ship.add(deck.scene,exterior.scene);const dm=new THREE.AnimationMixer(deck.scene),em=new THREE.AnimationMixer(exterior.scene);
  const jaw=deck.scene.getObjectByName('Wayfarer_Lower_Jaw_Hinge');
  const firefly=deck.scene.getObjectByName('Firefly_WF01');
  const dock=deck.scene.getObjectByName('Firefly_Docking_Anchor');
  const doorMixer=new THREE.AnimationMixer(deck.scene);
  const gearMixer=new THREE.AnimationMixer(firefly); // use gear clips from deck asset, bound to firefly only
  const clip=(g,n)=>g.animations.find(a=>a.name===n);
  const active=new Map();
  function play(m,g,n){let old=active.get(m);if(old)old.stop();const c=clip(g,n);if(!c)throw Error('Missing clip '+n);let a=m.clipAction(c);a.reset();a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();active.set(m,a);return c.duration;}
  // Separate gear mixer uses tracks named for the three Gear_* nodes.
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const tween=(obj,target,ms)=>new Promise(resolve=>{const from=obj.position.clone();const start=performance.now();function frame(t){const u=Math.min(1,(t-start)/ms);obj.position.lerpVectors(from,target,u*u*(3-2*u));if(u<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
  let mode='docked',busy=false;
  const doorActions=new Map();
  function setDoor(name,open){const key=name;const n=name+'_Door_'+(open?'Open':'Close');const c=clip(deck,n);if(!c)throw Error('Missing door clip '+n);const old=doorActions.get(key);if(old)old.stop();const a=doorMixer.clipAction(c);a.reset();a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();doorActions.set(key,a);return c.duration;}
  async function gate(open){await delay(setDoor('Hangar_Pressure_Gate',open)*1000+100);}

  async function openJaw(){const a=play(dm,deck,'Jaw_Open'),b=play(em,exterior,'Jaw_Open');await delay(Math.max(a,b)*1000+100);}
  async function closeJaw(){const a=play(dm,deck,'Jaw_Close'),b=play(em,exterior,'Jaw_Close');await delay(Math.max(a,b)*1000+100);}
  async function launch(){if(busy||mode!=='docked')return;busy=true;try{await gate(false);await openJaw();ship.updateMatrixWorld(true);ship.attach(firefly);play(gearMixer,deck,'Landing_Gear_Retract');await tween(firefly,new THREE.Vector3(0,-17,-69),2200);await closeJaw();await gate(true);mode='flight';}finally{busy=false;}}
  async function recover(){if(busy||mode!=='flight')return;busy=true;try{await gate(false);await openJaw();ship.updateMatrixWorld(true);const target=dock.getWorldPosition(new THREE.Vector3());ship.worldToLocal(target);await tween(firefly,target,2200);jaw.attach(firefly);firefly.position.copy(dock.position);firefly.quaternion.identity();play(gearMixer,deck,'Landing_Gear_Deploy');await delay(1800);await closeJaw();await gate(true);mode='docked';}finally{busy=false;}}
  function cutaway(enabled){exterior.scene.visible=!enabled;deck.scene.traverse(o=>{if(o.name.startsWith('Ceiling_'))o.visible=!enabled;});}
  function showCabin(enabled){const shell=firefly.getObjectByName('Exterior_Shell');if(shell)shell.visible=!enabled;const cabin=firefly.getObjectByName('Firefly_Single_Room_Interior');if(cabin)cabin.visible=true;for(const name of ['Gear_Nose','Gear_Port','Gear_Starboard']){const gear=firefly.getObjectByName(name);if(gear)gear.visible=!enabled;}}
  return {ship,deck:deck.scene,exterior:exterior.scene,firefly,launch,recover,cutaway,showCabin,setUpperDoor(name,open){if(!['Command_Bridge','Holodeck','Captains_Quarters','Crew_Lounge','Media_Nexus','Library_Halcyon'].includes(name))throw Error('Unknown upper room');return setDoor(name,open);},update(dt){dm.update(dt);em.update(dt);gearMixer.update(dt);doorMixer.update(dt);},get mode(){return mode;}};
}
