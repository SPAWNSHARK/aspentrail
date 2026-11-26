// ES module. Supply the same THREE and GLTFLoader versions already used by your game.
// No automatic room placement, architecture changes, or NPC state machine replacement.
export class FurnitureLibrary {
  constructor({THREE, loader, baseURL}) {
    this.THREE = THREE; this.loader = loader;
    this.baseURL = new URL(baseURL, globalThis.location?.href ?? 'http://localhost/');
    this.cache = new Map(); this.records = new Map();
  }
  async init() {
    const r = await fetch(new URL('manifest.json', this.baseURL));
    if (!r.ok) throw new Error(`Furniture manifest: ${r.status}`);
    const manifest = await r.json();
    this.records = new Map(manifest.assets.map(a => [a.id, a])); return this;
  }
  async instantiate(id, {position=[0,0,0], yaw=0, parent}={}) {
    const a = this.records.get(id); if (!a) throw new Error(`Unknown furniture: ${id}`);
    if (!this.cache.has(id)) {
      const request = this.loader.loadAsync(new URL(a.file, this.baseURL).href).then(g=>g.scene);
      this.cache.set(id,request); request.catch(()=>this.cache.delete(id));
    }
    const object = (await this.cache.get(id)).clone(true);
    object.name = `furniture:${id}`; object.position.set(...position); object.rotation.y = yaw;
    object.userData.furnitureId = id; object.userData.anchors = a.anchors;
    parent?.add(object); object.updateWorldMatrix(true,true);
    return object;
  }
  anchors(object, kind) {
    object.updateWorldMatrix(true,false);
    const THREE=this.THREE;
    const orientation=object.getWorldQuaternion(new THREE.Quaternion());
    return (object.userData.anchors ?? []).filter(a=>!kind||a.kind===kind).map(a=>{
      const position=object.localToWorld(new THREE.Vector3(...a.position));
      const quaternion=orientation.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),a.yaw));
      return {kind:a.kind,position,quaternion};
    });
  }
  // Conservative world-space collision proxy; register with the actual game physics/navigation system.
  bounds(object) { object.updateWorldMatrix(true,true); return new this.THREE.Box3().setFromObject(object); }
  // Use the named surface as a target for the existing video texture; no playback is started here.
  videoSurface(object) { let mesh;object.traverse(n=>{if(n.isMesh && n.name.includes('video_surface')) mesh=n;});return mesh; }
}
// Optional seat occupancy helper. Existing animation/controller code must perform approach/sit/stand.
export class SeatReservations {
  constructor(){this.occupied=new WeakMap();}
  reserve(object,index,actor){if(!actor||!Number.isInteger(index)||index<0||index>=(object.userData.anchors??[]).filter(a=>a.kind==='sit').length)return false;let m=this.occupied.get(object);if(!m){m=new Map();this.occupied.set(object,m);}if(m.has(index)&&m.get(index)!==actor)return false;m.set(index,actor);return true;}
  release(object,index,actor){const m=this.occupied.get(object);if(m?.get(index)===actor){m.delete(index);return true;}return false;}
}
