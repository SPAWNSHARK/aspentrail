// SS Wayfarer droid V2: no dependencies, no changes to the cat decision logic.
const ROLES={
 nav:{greet:['Navigation online. Your course is mine to calculate.','Standing by, Captain.'],task:'I am maintaining our course solution and checking the navigation console.',tempo:1.04},
 eng:{greet:['Engineering ready. Nothing has caught fire yet.','Forge reporting. What needs attention?'],task:'I inspect the maintenance console and monitor the live fault register.',tempo:.94},
 sci:{greet:['An interesting day for discovery, Captain.','Science station standing by.'],task:'I review research records and prepare scientific analyses.',tempo:.96},
 com:{greet:['Good to see you, Captain.','Communications here. How can I help?'],task:'I monitor the communications console and coordinate docking messages.',tempo:1.02},
 tac:{greet:['Sentinel reporting for duty.','Awaiting your orders, Captain.'],task:'I maintain tactical readiness and respond to ship alerts.',tempo:1.10},
 sen:{greet:['Prism online. Monitoring the instruments.','Sensors ready, Captain.'],task:'I monitor sensor readings and investigate reported anomalies.',tempo:1.00}
};
export function dutyRecall(engine,n){
 if(n.kind!=='droid'||!engine.ship.alert)return false;
 if(['SEATED','SIT','CONVERSATION'].includes(n.state)||n.xferAt||n.goal?.type==='home')return false;
 if(engine.time<(n._recallRetry??0))return false;
 n._recallRetry=engine.time+3;
 if(n.partner){const other=engine.npcs.get(n.partner); if(other&&other.partner===n.id){other.partner=null;if(other.state==='SOCIAL'){engine.set(other,'IDLE','Idle');other.next=engine.time+2;}} n.partner=null;n.socialReturn=null;}
 engine.release(n);n.route=[];n.goal=null;engine.set(n,'IDLE','Idle');
 if(engine.home(n)){engine.record(n,'emergency_recall');engine.emit('emergency_recall',{npc:n.id});return true;}
 n.next=engine.time+3;return false;
}
export function stride(n,dt){if(n.kind!=='droid')return n.speed;const target=n.speed*(ROLES[n.id]?.tempo??1);n._stride=Math.min(target,(n._stride??target*.45)+Math.max(0,dt)*3.4);return n._stride;}
export function dialogueExtension(engine,n,topic){
 const m=n.memory, role=ROLES[n.id]; if(!role)return null;
 if(topic==='greeting'){if(engine.ship.alert)return 'Red alert, Captain. Awaiting your orders.';if(m.meetings>1&&m.lastTopic&&m.lastTopic!=='greeting')return `Welcome back, Captain. We last discussed ${m.lastTopic.replaceAll('_',' ')}.`;return engine.pick(role.greet);}
 if(topic==='assignment_log'){const recent=m.events.filter(e=>['console_work','duty_complete','seated_home','emergency_recall','pet','crew_chat'].includes(e.type)).slice(-3).map(e=>e.type.replaceAll('_',' '));return role.task+(recent.length?' Recent activity: '+recent.join(', ')+'.':' No additional activity recorded.');}
 if(topic==='maintenance'){return engine.ship.fault?'Open maintenance register: '+engine.ship.fault+'. The repair interface is available at the affected hatch.':'No open faults are reported by the ship maintenance system.';}
 if(topic==='personal'){const count=m.events.filter(e=>e.type==='crew_chat'||e.type==='pet').length;return `${n.name}. ${role.task} ${m.meetings} captain conversations; ${count} recent crew social interactions recorded.`;}
 if(topic==='specialty')return role.task;
 return null;
}
export const extraChoices=[['assignment_log','Recent duty log'],['maintenance','Maintenance register'],['personal','Personal log']];
export function resumeDuty(engine,n,context){
 if(!context||engine.ship.alert||context.returnHome){engine.home(n);return;}
 if(context.goal?.type==='work'||context.state==='WORK'){if(engine.work(n))return;}
 if(context.goal?.type==='patrol'&&context.target&&engine.go(n,context.target,context.goal))return;
 engine.home(n);
}
