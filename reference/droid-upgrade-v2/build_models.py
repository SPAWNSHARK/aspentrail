import numpy as np, trimesh, struct, json, math, pathlib
from math import pi,sin,cos
OUT=pathlib.Path(__file__).parent/'models/crew';OUT.mkdir(parents=True,exist_ok=True)
roles={'Navigation':(.02,.65,.85),'Engineering':(.9,.36,.035),'Science':(.48,.15,.85),'Communications':(.02,.66,.26),'Tactical':(.85,.05,.045),'Sensors':(.9,.66,.08)}
class GLB:
 def __init__(self,color):
  self.b=bytearray(); self.views=[];self.acc=[];self.nodes=[];self.meshes=[];self.anims=[];self.cache={};self.mat=[]
  for name,c,m,r,e in [('Titanium',(.29,.32,.36),.91,.27,None),('Graphite',(.035,.044,.058),.65,.45,None),('Brushed copper',(.55,.25,.115),.88,.29,None),('Role enamel',color,.65,.24,None),('Optics',(.015,.035,.05),.75,.13,tuple(v*1.7 for v in color)),('Emitter',(.75,.89,1),.2,.24,(.65,.85,1)),('Ceramic',(.52,.56,.6),.34,.35,None)]:
   mt={'name':name,'pbrMetallicRoughness':{'baseColorFactor':[*c,1],'metallicFactor':m,'roughnessFactor':r}}
   if e:mt['emissiveFactor']=[min(1,v) for v in e]
   self.mat.append(mt)
 def accessor(self,a,typ,component=5126,target=None):
  while len(self.b)%4:self.b.append(0)
  off=len(self.b);a=np.asarray(a,dtype={5126:'<f4',5125:'<u4'}[component]);self.b.extend(a.tobytes());v={'buffer':0,'byteOffset':off,'byteLength':a.nbytes}
  if target:v['target']=target
  vi=len(self.views);self.views.append(v);x={'bufferView':vi,'componentType':component,'count':len(a),'type':typ}
  if typ in ['SCALAR','VEC3']:x.update(min=np.atleast_1d(a.min(axis=0)).tolist(),max=np.atleast_1d(a.max(axis=0)).tolist())
  self.acc.append(x);return len(self.acc)-1
 def node(self,name,parent=None,t=(0,0,0),mesh=None):
  n={'name':name,'translation':list(t)}
  if mesh is not None:n['mesh']=mesh
  idx=len(self.nodes);self.nodes.append(n)
  if parent is not None:self.nodes[parent].setdefault('children',[]).append(idx)
  return idx
 def mesh(self,shape,size,mat):
  key=(shape,tuple(size),mat)
  if key in self.cache:return self.cache[key]
  if shape=='box':m=trimesh.creation.box(extents=size)
  elif shape=='sphere':m=trimesh.creation.icosphere(subdivisions=2);m.apply_scale(size)
  else:m=trimesh.creation.cylinder(radius=size[0],height=size[1],sections=20);m.apply_transform(trimesh.transformations.rotation_matrix(pi/2,[1,0,0]))
  pos=self.accessor(m.vertices,'VEC3',target=34962);nor=self.accessor(m.vertex_normals,'VEC3',target=34962);ind=self.accessor(m.faces.reshape(-1),'SCALAR',5125,34963);idx=len(self.meshes);self.meshes.append({'primitives':[{'attributes':{'POSITION':pos,'NORMAL':nor},'indices':ind,'material':mat}]});self.cache[key]=idx;return idx
 def part(self,parent,name,shape,size,t,mat,rot=None):
  idx=self.node(name,parent,t,self.mesh(shape,size,mat));
  if rot:self.nodes[idx]['rotation']=quat(*rot)
  return idx
 def anim(self,name,times,poses):
  inp=self.accessor(times,'SCALAR');channels=[];samplers=[]
  for idx,path,vals in poses:
   out=self.accessor(vals,'VEC4' if path=='rotation' else 'VEC3');channels.append({'sampler':len(samplers),'target':{'node':idx,'path':path}});samplers.append({'input':inp,'output':out,'interpolation':'LINEAR'})
  self.anims.append({'name':name,'channels':channels,'samplers':samplers})
 def write(self,path):
  d={'asset':{'version':'2.0','generator':'Wayfarer procedural articulated droid V2'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':self.nodes,'meshes':self.meshes,'materials':self.mat,'animations':self.anims,'buffers':[{'byteLength':len(self.b)}],'bufferViews':self.views,'accessors':self.acc};j=json.dumps(d,separators=(',',':')).encode();j+=b' '*((-len(j))%4);self.b.extend(b'\0'*((-len(self.b))%4));path.write_bytes(struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(self.b))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(self.b),b'BIN\0')+self.b)
def quat(x=0,y=0,z=0):
 a,b,c=x/2,y/2,z/2;return [sin(a)*cos(b)*cos(c)-cos(a)*sin(b)*sin(c),cos(a)*sin(b)*cos(c)+sin(a)*cos(b)*sin(c),cos(a)*cos(b)*sin(c)-sin(a)*sin(b)*cos(c),cos(a)*cos(b)*cos(c)+sin(a)*sin(b)*sin(c)]
for role,col in roles.items():
 g=GLB(col);root=g.node('Droid_Root');hips=g.node('Pelvis',root,(0,.90,0));p=g.part
 p(hips,'Pelvis plating','sphere',(.175,.105,.113),(0,0,0),0);p(hips,'Waist actuator','cyl',(.075,.17),(0,.10,0),1);p(hips,'Belt plate','box',(.23,.06,.045),(0,.035,.115),2)
 torso=g.node('Torso',hips,(0,.15,0));p(torso,'Rib cage','sphere',(.235,.245,.135),(0,.18,0),0);p(torso,'Chest armor','sphere',(.218,.16,.045),(0,.23,.117),3);p(torso,'Central core','cyl',(.047,.035),(0,.23,.165),4,(pi/2,0,0));p(torso,'Core surround','cyl',(.065,.018),(0,.23,.15),2,(pi/2,0,0));p(torso,'Back power housing','box',(.20,.24,.085),(0,.18,-.145),1)
 for x in [-.115,.115]:
  for y in [.04,.085,.13]:p(torso,'Vented rib','box',(.079,.018,.025),(x,y,.12),1)
  for y in [.14,.20,.26]:p(torso,'Back vent','box',(.05,.015,.017),(x*.5,y,-.197),2)
 neck=g.node('HeadPivot',torso,(0,.43,0));p(neck,'Neck bearing','cyl',(.052,.075),(0,-.01,0),1);p(neck,'Helmet','sphere',(.13,.147,.12),(0,.125,0),0);p(neck,'Faceplate','sphere',(.113,.089,.043),(0,.132,.091),1);p(neck,'Optical visor','box',(.185,.043,.03),(0,.155,.126),4);p(neck,'Optical divider','box',(.013,.05,.034),(0,.155,.13),1);p(neck,'Jaw grille','box',(.083,.033,.025),(0,.085,.109),2)
 for s in [-1,1]:p(neck,'Ear actuator','cyl',(.048,.035),(s*.132,.125,0),3,(0,0,pi/2));p(neck,'Temple pin','cyl',(.019,.037),(s*.15,.125,0),4,(0,0,pi/2))
 limbs=[]
 for s in [-1,1]:
  side='L' if s<0 else 'R';hip=g.node(side+'_Hip',hips,(s*.112,-.028,0));p(hip,'Hip bearing','sphere',(.079,.079,.079),(0,0,0),1);p(hip,'Thigh frame','cyl',(.046,.29),(0,-.18,0),1);p(hip,'Thigh armor','sphere',(.075,.16,.074),(0,-.16,.009),0);p(hip,'Thigh accent','box',(.043,.14,.022),(s*.045,-.17,.063),3)
  knee=g.node(side+'_Knee',hip,(0,-.38,0));p(knee,'Knee bearing','sphere',(.066,.065,.066),(0,0,0),1);p(knee,'Knee cap','sphere',(.054,.053,.026),(0,0,.063),2);p(knee,'Shin strut','cyl',(.045,.29),(0,-.16,0),1);p(knee,'Shin armor','sphere',(.062,.145,.066),(0,-.16,.017),0);p(knee,'Calf piston','cyl',(.015,.19),(s*.045,-.17,-.046),2)
  ankle=g.node(side+'_Ankle',knee,(0,-.36,0));p(ankle,'Ankle joint','sphere',(.047,.044,.047),(0,0,0),1);p(ankle,'Foot','box',(.13,.075,.215),(0,-.058,.04),0);p(ankle,'Toe bumper','box',(.132,.032,.06),(0,-.083,.126),1);p(ankle,'Sole','box',(.135,.023,.22),(0,-.103,.04),1)
  shoulder=g.node(side+'_Shoulder',torso,(s*.236,.33,0));p(shoulder,'Shoulder bearing','sphere',(.084,.083,.083),(0,0,0),1);p(shoulder,'Shoulder armor','sphere',(.106,.097,.098),(s*.026,-.025,0),3);p(shoulder,'Arm strut','cyl',(.036,.20),(0,-.15,0),1);p(shoulder,'Upper arm armor','sphere',(.057,.105,.057),(0,-.135,0),0)
  elbow=g.node(side+'_Elbow',shoulder,(0,-.245,0));p(elbow,'Elbow joint','sphere',(.05,.05,.05),(0,0,0),1);p(elbow,'Forearm shell','sphere',(.06,.105,.059),(0,-.11,0),0);p(elbow,'Wrist stripe','cyl',(.042,.022),(0,-.21,0),3)
  hand=g.node(side+'_Hand',elbow,(0,-.224,0));p(hand,'Palm','box',(.071,.075,.039),(0,-.037,0),1)
  for f in range(4):p(hand,'Finger segment','box',(.013,.042,.023),(-.025+.016*f,-.087,.006),0);p(hand,'Finger tip','box',(.012,.023,.022),(-.025+.016*f,-.117,.013),1)
  p(hand,'Thumb','box',(.022,.055,.029),(s*.047,-.039,.018),0,(0,0,s*.4));limbs.append((hip,knee,ankle,shoulder,elbow,hand))
 # All clips key every articulation, so animation blending cannot leave stale poses.
 def pose(kind,u):
  w=2*pi*u;h=.90;tr=[0,0,0];hd=[0,0,0];ls=[]
  seated=kind.startswith('Seated') or kind=='Console_Operate';sit=1 if seated else (u if kind=='Sit' else 1-u if kind=='Stand' else 0)
  if sit:h=.90-.38*sit;tr[0]=.08*sit
  for i in range(2):
   s=-1 if i==0 else 1;phase=w+i*pi;hip=-pi/2*sit;knee=pi/2*sit;ank=0;arm=-.20*sit;el=-1.05*sit;hand=0
   if kind in ['Walk_InPlace','Run_InPlace']:
    run=kind.startswith('Run');amp=.67 if run else .43;hip=amp*sin(phase);knee=.10+(.78 if run else .53)*max(0,sin(phase-pi/2));ank=-.15*sin(phase);arm=-.7*hip;el=-.40 if run else -.16;h+=.018*(1-cos(2*w));tr[0]=.10 if run else .025;tr[1]=.06*sin(w)
   elif kind in ['Standing_Console','Console_Operate']:
    arm=-.60-.11*sin(phase);el=-.95-.10*cos(phase);hand=.12*sin(phase*2);hd[0]=.11+.05*sin(w)
   elif kind in ['Pet_Cat','Seated_Pet']:
    q=sin(pi*u);arm=-.12-.27*q if i==1 else -.15;el=-.15-.20*q;hand=.18*sin(w*2);tr[0]=.72*q;hd[0]=.20*q
    if not seated:h-=.32*q;hip-=.85*q;knee+=1.6*q;ank-=.55*q
   elif kind=='Talk':arm=-.12-.35*max(0,sin(phase));el=-.35-.45*max(0,sin(phase));hd[1]=.17*sin(w);hd[0]=.06*cos(w)
   elif kind=='Yield':arm=.18*sin(pi*u);el=-.2;tr[2]=.1*sin(pi*u);hd[1]=.28*sin(pi*u)
   else:hd[1]=.13*sin(w);hd[0]=.04*sin(w*2)
   ls.append((hip,knee,ank,arm,el,hand))
  return h,tr,hd,ls
 for name,dur in {'Idle':3.6,'Seated_Idle':3.6,'Walk_InPlace':1.12,'Run_InPlace':.76,'Stand':1.25,'Sit':1.25,'Console_Operate':3.2,'Standing_Console':3.2,'Talk':3.5,'Pet_Cat':3.1,'Seated_Pet':3.1,'Yield':.8}.items():
  ts=np.linspace(0,dur,21);poses=[pose(name,float(t/dur)) for t in ts];tracks=[(hips,'translation',[[0,k[0],0] for k in poses]),(torso,'rotation',[quat(*k[1]) for k in poses]),(neck,'rotation',[quat(*k[2]) for k in poses])]
  for i,limb in enumerate(limbs):
   for j,n in enumerate(limb):tracks.append((n,'rotation',[quat(k[3][i][j],0,0) for k in poses]))
  g.anim(name,ts,tracks)
 g.write(OUT/f'Droid_{role}_Living.glb')
 print(role,len(g.nodes),len(g.anims),(OUT/f'Droid_{role}_Living.glb').stat().st_size)
