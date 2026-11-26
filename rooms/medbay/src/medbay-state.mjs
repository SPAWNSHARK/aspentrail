// Engine-neutral simulation. This is fictional game logic, not medical advice.
export class MedbayState {
  constructor({emit=()=>{}, random=Math.random}={}) {this.emit=emit;this.random=random;this.time=0;this.door=false;this.canopy=false;this.privacy=false;this.health=100;this.supplies=6;this.job=null;this.history=[];this.alert=false;}
  event(type,data={}) {const e={type,time:this.time,...data}; this.history.push(e); if(this.history.length>100)this.history.shift();this.emit(e);return e;}
  setHealth(n) {if(!Number.isFinite(n))throw Error('Invalid health');this.health=Math.max(0,Math.min(100,n));}
  interact(id) {
    if(id==='door_button'){this.door=!this.door;return this.event('door',{open:this.door});}
    if(id==='canopy'){if(this.job?.kind==='recover')return this.event('busy');this.canopy=!this.canopy;return this.event('canopy',{open:this.canopy});}
    if(id==='privacy'||id==='privacy_button'){this.privacy=!this.privacy;return this.event('privacy',{active:this.privacy});}
    if(id==='console'||id==='monitor')return this.event('status',{health:this.health,supplies:this.supplies,job:this.job?.kind??null});
    if(id==='cabinet'||id==='dispenser'||id==='medkit'){if(!this.supplies)return this.event('empty');this.supplies--;return this.event('item',{item:'fictional_medkit',remaining:this.supplies});}
    if(id==='droid')return this.event('dialogue',{text:this.job?'Procedure in progress. Please remain still.': ['Medical systems nominal.','Organic crew: remarkably fragile.','The feline patient has rejected my professional opinion.'][Math.floor(this.random()*3)]});
    if(this.job)return this.event('busy');
    const kinds={bed_a:['scan',6,'exam'],scanner_a:['scan',6,'exam'],pod:['recover',12,'pod'],pod_button:['recover',12,'pod'],vet:['xeno_scan',5,'vet'],lab:['analyze',8,'console']};
    if(!kinds[id])return this.event('unknown',{id});
    const [kind,duration,target]=kinds[id];if(kind==='recover'&&!this.supplies)return this.event('empty');
    if(kind==='recover'){this.supplies--;this.canopy=false;}
    this.job={kind,duration,elapsed:0,target};return this.event('job_start',{kind,target,duration});
  }
  cancel(){if(!this.job)return false; const kind=this.job.kind;this.job=null;if(kind==='recover')this.canopy=true;this.event('cancel',{kind});return true;}
  tick(dt){if(!Number.isFinite(dt)||dt<0)throw Error('Invalid dt');this.time+=dt;if(!this.job)return;this.job.elapsed+=dt;if(this.job.elapsed<this.job.duration)return;const {kind}=this.job;this.job=null;if(kind==='recover'){this.setHealth(this.health+35);this.canopy=true;}const results={scan:'Bioscan complete.',recover:'Recovery cycle complete.',xeno_scan:'Xenofauna scan complete. No real animal health data.',analyze:'Specimen catalogued.'};this.event('job_end',{kind,result:results[kind],health:this.health});}
  snapshot(){return {health:this.health,supplies:this.supplies,door:this.door,canopy:this.canopy,privacy:this.privacy,job:this.job?{...this.job}:null};}
}
