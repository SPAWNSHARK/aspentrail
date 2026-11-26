// Adapt this example to your actual V8 scene, rather than importing it as an installer.
import {createRealism} from './realism.mjs';
export function installExample({THREE,scene,floor,wall,stairs,vent,skylightCenter}){
 const fx=createRealism({THREE,scene,quality:'low'});
 fx.tagSurface(floor,'graphite_deck');fx.tagSurface(stairs,'stairs');
 // Optional: change selected material only after comparing UVs and V8 appearance.
 // floor.material=fx.makeMaterial('graphite_deck',{repeat:[4,8]});
 // wall.material=fx.makeMaterial('brushed_titanium',{repeat:[2,2]});
 // Keep existing scene.environment, or install a PMREM-filtered environment matching the room.
 if(skylightCenter)fx.addDustVolume({center:skylightCenter,size:new THREE.Vector3(3,1.2,4)});
 if(vent)fx.addSmokeEmitter(vent.getWorldPosition(new THREE.Vector3()),{rate:.4,opacity:.09});
 // Example floor mark: use a real surface hit, not a guessed position.
 const addGrime=(hit)=>fx.decal('grime',hit.point,fx.worldNormal(hit),{size:.8,opacity:.5});
 // In the host's user-gesture handler: await fx.enableAudio();
 // Each render frame: fx.update(deltaSeconds,camera);
 // On animation foot contact: fx.footContact({hit,actor:'player',foot:'left',heading,dirty:true});
 // OR first-person fallback: fx.trackActor('player',position,{hit,grounded,heading,dirty:true});
 // On room unload: fx.dispose();
 return {fx,addGrime};
}
