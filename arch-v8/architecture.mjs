import {createDeckKit} from './decking.mjs';
export function createArchitectureKit(T, baseURL='./textures/') {
 const deck=createDeckKit(T,baseURL);
 const mat=(color,metalness=.35,roughness=.78)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const graphite=mat(0x30363c), gunmetal=mat(0x505960), charcoal=mat(0x171c21), copper=mat(0xa66d43,.55,.65);
 const glow=(color)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.45,roughness:.8});
 const white=glow(0xe0e5eb), blue=glow(0x92cde8);
 const glass=new T.MeshStandardMaterial({color:0x9bc4df,transparent:true,opacity:.10,depthWrite:false,roughness:.28,side:T.DoubleSide});
 const loader=new T.TextureLoader();
 function surface(name){const maps={};for(const [key,suffix] of [['map','base'],['normalMap','normal'],['roughnessMap','rough']]){const t=loader.load(baseURL+name+'_'+suffix+'.png');if(key==='map'){if(T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;else if(T.sRGBEncoding)t.encoding=T.sRGBEncoding;}maps[key]=t;}return new T.MeshStandardMaterial({...maps,metalness:.35,roughness:.9,normalScale:new T.Vector2(.35,.35)});}
 const wallMat=surface('wall'), ceilingMat=surface('ceiling');
 function box(w,h,d,m,x=0,y=0,z=0){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);return o;}
 function check(...v){if(v.some(x=>!Number.isFinite(x)||x<=0))throw Error('Invalid dimensions');}
 // Wall faces +Z, origin at floor center. Build only in uninterrupted wall spans.
 function wall(w,h,kind='corridor'){check(w,h);const g=new T.Group(),n=Math.ceil(w/1.6),s=w/n;g.add(box(w,h,.12,charcoal,0,h/2,-.06));for(let i=0;i<n;i++){const x=-w/2+(i+.5)*s;g.add(box(s-.025,h*.76,.07,wallMat,x,h*.53,.015));g.add(box(s-.04,h*.12,.09,kind==='lounge'?graphite:gunmetal,x,h*.10,.025));}g.add(box(w,.045,.08,copper,0,h*.92,.045),box(w,.025,.045,blue,0,h*.17,.06));return g;}
 // Ceiling centered on X/Z, underside at y=0. Split into strips around openings.
 function ceiling(w,d){check(w,d);const g=new T.Group(),n=Math.ceil(d/2),s=d/n;for(let i=0;i<n;i++)g.add(box(w,.08,s-.025,ceilingMat,0,.04,-d/2+(i+.5)*s));for(const x of [-w*.35,w*.35])g.add(box(.045,.012,d,white,x,-.008,0));return g;}
 // Barrel vault rises above y=0; open ends; glass can be disabled for low-end devices.
 function skylight(w,d,rise=.45,{showGlass=true,ribSpacing=2.4}={}){check(w,d,rise,ribSpacing);const g=new T.Group(),segments=16,n=Math.ceil(d/ribSpacing);const y=x=>rise*(1-(2*x/w)**2);if(showGlass){const verts=[],idx=[];for(let i=0;i<=segments;i++){const x=-w/2+w*i/segments;verts.push(x,y(x),-d/2,x,y(x),d/2);if(i<segments){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();g.add(new T.Mesh(geo,glass));}for(let j=0;j<=n;j++){const z=-d/2+j*d/n;for(let i=0;i<segments;i++){const a=-w/2+w*i/segments,b=a+w/segments,dy=y(b)-y(a);const rib=box(Math.hypot(b-a,dy)+.008,.045,.055,gunmetal,(a+b)/2,(y(a)+y(b))/2,z);rib.rotation.z=Math.atan2(dy,b-a);g.add(rib);}}for(const x of [-w/2,w/2])g.add(box(.08,.10,d,graphite,x,0,0),box(.022,.018,d,white,x*.98,-.055,0));return g;}
 // Open portal only; existing door animation and collider remain authoritative.
 function portal(w,h){check(w,h);const g=new T.Group();for(const x of [-w/2-.055,w/2+.055])g.add(box(.11,h,.15,gunmetal,x,h/2,0),box(.018,h*.75,.025,copper,x,h/2,.09));g.add(box(w+.22,.12,.15,graphite,0,h+.06,0),box(w*.55,.022,.025,blue,0,h+.02,.09));return g;}
 function threshold(w){check(w);return box(w,.008,.18,gunmetal,0,.004,0);}
 return {...deck,wall,ceiling,skylight,portal,threshold,materials:{graphite,gunmetal,charcoal,copper,white,blue,glass}};
}
// Motion values for host's existing star renderer; no new render loop.
export function skyMotion(mode,seconds){if(!Number.isFinite(seconds))throw Error('Invalid time');const speed={docked:0,orbit:.015,cruise:.12,hyperspace:2.5}[mode];if(speed===undefined)throw Error('Invalid sky mode');return {offset:seconds*speed,stretch:mode==='hyperspace'?18:1,opacity:mode==='hyperspace'?.85:1};}
