// Three.js injected by host; dimensions in meters. No automatic scene mutation.
export function createDeckKit(THREE, baseURL = './textures/') {
 const loader = new THREE.TextureLoader(), materials = new Map();
 const kinds = ['corridor','bridge','lounge','engineering','stairs'];
 function texture(kind, type, color=false) {
  const t=loader.load(baseURL+kind+'_'+type+'.png'); t.wrapS=t.wrapT=THREE.RepeatWrapping;
  if(color) {if(THREE.SRGBColorSpace) t.colorSpace=THREE.SRGBColorSpace; else if(THREE.sRGBEncoding) t.encoding=THREE.sRGBEncoding;}
  t.anisotropy=4; return t;
 }
 function material(kind='corridor') {
  if(!kinds.includes(kind)) throw Error('Unknown deck type');
  if(!materials.has(kind)) materials.set(kind,new THREE.MeshStandardMaterial({map:texture(kind,'base',true),roughnessMap:texture(kind,'rough'),normalMap:texture(kind,'normal'),normalScale:new THREE.Vector2(.45,.45),metalness:.42,roughness:.95,envMapIntensity:.35}));
  return materials.get(kind);
 }
 const frame=new THREE.MeshStandardMaterial({color:0x30383f,metalness:.55,roughness:.65});
 const copper=new THREE.MeshStandardMaterial({color:0xa66d43,metalness:.55,roughness:.58});
 const glass=new THREE.MeshStandardMaterial({color:0x93b4c3,transparent:true,opacity:.23,roughness:.35,metalness:0,depthWrite:false,side:THREE.DoubleSide});
 const light=new THREE.MeshStandardMaterial({color:0x92cde8,emissive:0x92cde8,emissiveIntensity:.35,roughness:.8});
 function box(w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);return o;}
 function deck(w,d,kind='corridor',tile=1.2){if(!(w>0&&d>0&&tile>0))throw Error('Invalid deck dimensions');const g=new THREE.Group();const m=material(kind).clone(); for(const key of ['map','roughnessMap','normalMap']){m[key]=m[key].clone();m[key].repeat.set(w/tile,d/tile);m[key].needsUpdate=true;}const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);mesh.rotation.x=-Math.PI/2;mesh.receiveShadow=true;g.add(mesh);return g;}
 function railing(length,height=1.05){if(!(length>0&&height>.2))throw Error('Invalid railing');const g=new THREE.Group(),n=Math.ceil(length/1.5),span=length/n;g.add(box(length,.045,.065,copper,0,height,0),box(length,.07,.09,frame,0,.06,0));for(let i=0;i<=n;i++)g.add(box(.045,height,.065,frame,-length/2+i*span,height/2,0));for(let i=0;i<n;i++)g.add(box(span-.05,height-.16,.018,glass,-length/2+(i+.5)*span,height/2,0));return g;}
 function stairs(width,steps,rise=.17,tread=.29){if(!(width>0&&Number.isInteger(steps)&&steps>0&&rise>0&&tread>0))throw Error('Invalid stairs');const g=new THREE.Group();for(let i=0;i<steps;i++){const h=(i+1)*rise,z=(i+.5)*tread;g.add(box(width,h,tread,frame,0,h/2,z));const top=deck(width,tread,'stairs');top.position.set(0,h+.001,z);g.add(top);g.add(box(width,.012,.025,copper,0,h+.008,z-tread/2+.015));}return g;}
 function guide(length){return box(.018,.006,length,light,0,.004,0);}
 return {material,deck,railing,stairs,guide};
}
