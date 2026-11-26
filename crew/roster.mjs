export const crew = [
 ['nav','Aster','Navigation','cyan','precise','bridge','holodeck','Route planning and flight calculations.'],
 ['eng','Forge','Engineering','amber','dry','bridge','corridor','Diagnostics and maintenance.'],
 ['sci','Vesper','Science','violet','curious','bridge','library','Research and planetary analysis.'],
 ['com','Echo','Communications','emerald','warm','bridge','lounge','Transmissions and docking coordination.'],
 ['tac','Sentinel','Tactical','red','formal','bridge','media','Security and readiness.'],
 ['sen','Prism','Sensors','gold','observant','bridge','holodeck','Scanning and anomaly detection.']
].map(([id,name,role,color,personality,home,remote,description])=>({id,name,role,color,personality,home,remote,description,kind:'droid',model:`models/Droid_${role}_Living.glb`,speed:1.0,radius:.29}));
export const cats = [
 ['ember','Ember','playful','orange',.85,.85],['nimbus','Nimbus','sleepy','cream',.40,.75],['orbit','Orbit','observant','slate',.65,.65],['pixel','Pixel','independent','tuxedo',.55,.35]
].map(([id,name,personality,color,energy,affection])=>({id,name,personality,color,energy,affection,kind:'cat',home:'lounge',model:`models/Kitty_${name}.glb`,speed:.72,radius:.17}));
export const roster=[...crew,...cats];
// Coordinates below are illustrative TEST coordinates, NOT the production blueprint.
export const demoLayout={nodes:{},edges:[],stations:[],spots:[]};
const node=(id,x,z,room)=>demoLayout.nodes[id]={x,y:0,z,room};
const edge=(a,b,door)=>demoLayout.edges.push({a,b,...(door?{door}:{})});
node('hall0',0,0,'corridor');node('hall1',0,4,'corridor');node('hall2',0,8,'corridor');node('hall3',0,12,'corridor');node('hall4',0,16,'corridor');
for(let i=0;i<4;i++)edge('hall'+i,'hall'+(i+1));
for(const [room,x,z,hall] of [['bridge',0,-5,'hall0'],['lounge',-5,4,'hall1'],['media',-5,8,'hall2'],['holodeck',5,12,'hall3'],['library',0,21,'hall4']]){node(room,x,z,room);edge(hall,room,room+'_door');}
for(let i=0;i<crew.length;i++){const c=crew[i],id=c.id;node(id+'_seat',(i%2?1:-1)*(1+Math.floor(i/2)*.65),-6,'bridge');edge('bridge',id+'_seat');demoLayout.stations.push({id:id+'_home',node:id+'_seat',owner:id,type:'seat',yaw:0});const anchor=c.remote==='corridor'?'hall2':c.remote;const p=demoLayout.nodes[anchor];node(id+'_work',p.x+(i%2?1:-1)*1.25,p.z+1,c.remote);edge(anchor,id+'_work');demoLayout.stations.push({id:id+'_remote',node:id+'_work',owner:id,type:'console',yaw:Math.PI,asset:`Console_${c.role}.glb`});}
for(const room of ['lounge','media','holodeck','library','bridge','corridor']){const a=room==='corridor'?'hall3':room,p=demoLayout.nodes[a];for(let k=0;k<(room==='lounge'?4:2);k++){const id=room+'_spot'+k;node(id,p.x+(k%2?-.85:.85),p.z+.8+Math.floor(k/2)*.85,room);edge(a,id);demoLayout.spots.push({node:id,room,type:room==='lounge'?'rest':'explore'});}}

for(const s of demoLayout.stations.filter(s=>s.type==='console')){const p=demoLayout.nodes[s.node],id=s.id+'_visit';node(id,p.x+.62,p.z,p.room);const origin=s.owner==='eng'?'hall2':p.room;edge(origin,id);demoLayout.spots.push({node:id,room:p.room,type:'social'});}
