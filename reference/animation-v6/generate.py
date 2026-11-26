import json, math, pathlib
P=pathlib.Path(__file__).parent
common='Idle Walk_InPlace Run Sprint Backpedal Strafe_Left Strafe_Right Turn_Left Turn_Right Jump Fall Land Stair_Up Stair_Down Crouch Crouch_Walk Crawl Climb_Ladder Swim ZeroG Sit Stand Sleep Wake Stumble Yield Vault Climb_Obstacle Slide Pet_Give Petted Feed Play Console Repair Grab Drink Enter_Chair Exit_Chair Follow'.split()
extra={'cat':'Trot Pounce Groom Stretch Knead Sniff TailFlick EarTwitch Eat Roll Chirp LookAround Rub_Legs'.split(),'droid':'Scan Salute Recharge Emergency_Run'.split(),'kvetar':'Antenna_Scan Mandible_Talk Threat_Display'.split(),'player':'Wave Point Interact'.split()}
for kind in extra:
 cat=kind=='cat'; legs=['frontL','frontR','rearL','rearR'] if cat else ['leftLeg','rightLeg']; arms=[] if cat else ['leftArm','rightArm']; bones=['body','head']+legs+[x+'Knee' for x in legs]+arms+[x+'Elbow' for x in arms]+(['tail','earL','earR'] if cat else ['antennaL','antennaR'] if kind=='kvetar' else [])
 clips={}
 for name in common+extra[kind]:
  if cat and name in ['Climb_Ladder','Strafe_Left','Strafe_Right','Slide','Pet_Give','Console','Repair','Grab','Enter_Chair','Exit_Chair']:continue
  if kind=='droid' and name in ['Swim','Sleep','Crawl','Slide','Vault','Drink']:continue
  gait=name in ['Walk_InPlace','Run','Sprint','Backpedal','Strafe_Left','Strafe_Right','Stair_Up','Stair_Down','Crouch_Walk','Crawl','Trot','Follow','Emergency_Run','Climb_Ladder','Swim']; fast=name in ['Run','Sprint','Trot','Emergency_Run']; duration=.48 if fast else .9 if gait else 1.2; loop=gait or name in ['Idle','Fall','ZeroG','Sleep','Sit','Crouch','Console','Repair','Petted','Pet_Give','Groom','Eat','Drink','Play','Feed','Mandible_Talk','Recharge']; tracks={b:[] for b in bones}
  for i in range(25):
   t=i/24; s=math.sin(t*math.tau); pulse=math.sin(math.pi*t); pose={b:[0,0,0] for b in bones}
   pose['head'][1]=.04*s; pose['body'][0]=.025*s
   if gait:
    amp=.85 if fast else .48; amp*= -1 if name=='Backpedal' else 1
    for k,b in enumerate(legs):
     phase=t*math.tau+(math.pi if (k in ([1,2] if cat else [1])) else 0); v=math.sin(phase); pose[b][0]=amp*v; pose[b+'Knee'][0]=max(0,-v)*(.95 if fast else .65)
     if name.startswith('Stair'):pose[b+'Knee'][0]+=.22*max(0,-v);pose['body'][0]=.12 if name=='Stair_Up' else -.12
     if name.startswith('Strafe'):pose[b][2]=amp*v*.6;pose[b][0]*=.3
    for k,b in enumerate(arms):pose[b][0]=-.55*amp*math.sin(t*math.tau+k*math.pi)
   elif name in ['Jump','Pounce','Vault','Climb_Obstacle','Land','Fall','Stumble','Yield']:
    a=pulse if name!='Fall' else .5; pose['body'][0]=(.35 if name in ['Pounce','Vault'] else -.15)*a
    for b in legs:pose[b][0]=-.65*a;pose[b+'Knee'][0]=1.1*a
    for b in arms:pose[b][0]=-1.1*a
   elif name in ['Sit','Sleep','Crouch','Stand','Wake','Enter_Chair','Exit_Chair','Slide']:
    a=1 if loop else t if name=='Enter_Chair' else 1-t;pose['body'][0]=.25*a
    for b in legs:pose[b][0]=-.85*a;pose[b+'Knee'][0]=1.35*a
   elif name in ['Turn_Left','Turn_Right','LookAround','Scan','Sniff','Antenna_Scan']:pose['head'][1]=(.65 if name!='Turn_Right' else -.65)*pulse
   elif name in ['Pet_Give','Feed','Console','Repair','Grab','Drink','Wave','Point','Interact','Salute','Play']:
    if arms:pose['rightArm'][0]=-1.0*(.8+.2*s);pose['rightArmElbow'][0]=-.55+.2*s;pose['leftArm'][0]=-.35*pulse
    pose['body'][0]=.35 if name=='Pet_Give' else .1;pose['head'][0]=.2
   elif name in ['Groom','Eat','Petted','Rub_Legs','Stretch','Knead','Roll','Chirp','Threat_Display','Mandible_Talk','Recharge','ZeroG','TailFlick','EarTwitch']:
    pose['head'][0]=.3*s if name not in ['Eat','Groom'] else .45+.15*s;pose['body'][2]=.3*s if name in ['Roll','Rub_Legs'] else .03*s
    for k,b in enumerate(legs):pose[b][0]=.22*math.sin(t*math.tau+k*math.pi) if name in ['Knead','Stretch','ZeroG','Groom'] else 0
   if cat:pose['tail'][1]=(.6 if name=='TailFlick' else .2)*s;pose['earL'][2]=.18*s;pose['earR'][2]=-.18*s
   if kind=='kvetar':pose['antennaL'][2]=.18*s;pose['antennaR'][2]=-.18*s
   for b in bones:tracks[b].append([round(x,5) for x in pose[b]])
  if loop:
   for v in tracks.values():v[-1]=v[0][:]
  clips[name]={'duration':duration,'loop':loop,'tracks':tracks}
 (P/(kind+'.json')).write_text(json.dumps({'species':kind,'sampleCount':25,'units':'radians XYZ local rotation offsets','clips':clips},separators=(',',':')))
