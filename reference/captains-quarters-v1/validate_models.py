import json,struct,pathlib
root=pathlib.Path(__file__).resolve().parents[1]; manifest=json.loads((root/'room_manifest.json').read_text());count=0
for name in manifest['models']:
 b=(root/'models'/f'{name}.glb').read_bytes();magic,version,total=struct.unpack_from('<4sII',b);assert magic==b'glTF' and version==2 and total==len(b)
 n,t=struct.unpack_from('<II',b,12);assert t==0x4e4f534a;j=json.loads(b[20:20+n]);off=20+n;size,typ=struct.unpack_from('<II',b,off);assert typ==0x004e4942 and off+8+size==len(b);assert j['buffers'][0]['byteLength']<=size
 for v in j['bufferViews']:assert v.get('byteOffset',0)+v['byteLength']<=size
 for mesh in j['meshes']:
  for p in mesh['primitives']:assert 'POSITION' in p['attributes'] and 'NORMAL' in p['attributes'];assert p['indices']<len(j['accessors'])
 for anim in j.get('animations',[]):
  for c in anim['channels']:assert c['target']['node']<len(j['nodes']) and c['sampler']<len(anim['samplers'])
 if name=='captains_quarters_assembled':
  names={x.get('name') for x in j['nodes']};assert all(p['id'] in names for p in manifest['placements']);assert len(j['animations'])==7
 count+=1
print(f'{count} GLB containers checked; assembled placements and 7 animation targets verified.')
