export const states = [
 ['Calm','Thank you. Keep it calm.'],
 ['Aware','Sound is rising. Please be mindful.'],
 ['Alert','It’s getting noisy. Let’s keep it down.'],
 ['Nervous','Your voices affect the horse. Speak softly.'],
 ['Distressed','Too loud here. Lower your voices together.'],
 ['Highly agitated','Help the horse settle. Please lower your voices.']
];
export const machineConfig=Object.freeze({
 boundaries:[18,34,50,66,82],
 hysteresis:3,
 riseDwellMs:1000,
 fallDwellMs:1600,
 severeDwellMs:1200,
 calmDwellMs:2000,
 recoveryInterruptDwellMs:1000,
 alertState:2,
 nervousState:3
});

export class HorseStateMachine {
 constructor(onChange=()=>{}) {
  this.state=0;this.desired=0;this.clip=1;this.phase='loop';this.recoveryKind=null;this.mediaPhase='playing';this.group=false;this.settling=false;this.pending=null;this.severeSince=null;this.calmSince=null;this.interruptSince=null;this.level=0;this.onChange=onChange;
 }
 target(level) {
  let next=this.desired;
  while(next<5&&level>machineConfig.boundaries[next]+machineConfig.hysteresis)next++;
  while(next>0&&level<machineConfig.boundaries[next-1]-machineConfig.hysteresis)next--;
  return next;
 }
 setGroupMode(group,level=this.level) {
  if(this.group===group)return false;
  const previousClip=this.clip,previousPhase=this.phase;
  this.group=group;this.level=level;this.desired=this.target(level);this.state=this.desired;this.phase='loop';this.recoveryKind=null;this.clearTimers();
  const nextClip=this.state+1;
  if(previousPhase!=='loop'||previousClip!==nextClip)this.play(nextClip);
  return true;
 }
 resetTimers() { this.clearTimers(); }
 setMediaPhase(phase) { if(phase!==this.mediaPhase)this.resetTimers();this.mediaPhase=phase; }
 clearTimers() { this.pending=null;this.severeSince=null;this.calmSince=null;this.interruptSince=null; }
 update(level,now) {
  this.level=level;this.desired=this.target(level);
  this.settling=this.desired<this.state||(this.phase==='recovery-playing'&&this.recoveryKind==='group'&&this.desired===0);
  if(this.phase==='loop'){this.updateLoop(now);return;}
    if(this.phase==='dispersal-playing'){this.updatePhaseState(now);return;}
    if(this.phase==='dispersal-hold'){this.updatePhaseState(now);this.updateCalmDwell(now);return;}
    if(this.recoveryKind==='group'){this.updatePhaseState(now);this.updateRecoveryInterrupt(now);}
    else this.updateOrdinaryRecovery(now);
 }
 updateLoop(now) {
  if(this.mediaPhase!=='playing'){this.pending=null;this.severeSince=null;return;}
  if(this.group&&this.state===5&&this.desired===5){
   if(this.severeSince===null)this.severeSince=now;
   else if(now-this.severeSince>=machineConfig.severeDwellMs)this.startDispersal();
  }else this.severeSince=null;
  if(this.phase!=='loop'||this.desired===this.state){this.pending=null;return;}
  if(!this.hasPending(this.desired,now))return;
  const target=this.desired,previous=this.state;this.pending=null;this.state=target;
  if(target>previous){this.severeSince=this.group&&target===5?now:null;this.play(target+1);return;}
  if(previous>=5&&target<=machineConfig.alertState){this.startOrdinaryRecovery(7,machineConfig.alertState);return;}
  if(previous>=machineConfig.nervousState){this.play(target+1);return;}
  if(previous===machineConfig.alertState&&target===0){this.startOrdinaryRecovery(8,0);return;}
  this.play(target+1);
 }
 updatePhaseState(now) {
  if(this.desired===this.state){this.pending=null;return;}
  if(!this.hasPending(this.desired,now))return;
  this.state=this.desired;this.pending=null;
 }
 hasPending(target,now) {
  if(this.pending?.target!==target){this.pending={target,since:now};return false;}
  const dwell=target>this.state?machineConfig.riseDwellMs:machineConfig.fallDwellMs;
  return now-this.pending.since>=dwell;
 }
 updateCalmDwell(now) {
  if(this.desired!==0){this.calmSince=null;return;}
  if(this.calmSince===null)this.calmSince=now;
  if(now-this.calmSince>=machineConfig.calmDwellMs){this.phase='recovery-playing';this.recoveryKind='group';this.calmSince=null;this.interruptSince=null;this.play(10);}
 }
 updateRecoveryInterrupt(now) {
  if(this.mediaPhase!=='playing'){this.interruptSince=null;return;}
  if(this.desired<machineConfig.nervousState){this.interruptSince=null;return;}
  if(this.interruptSince===null)this.interruptSince=now;
  if(now-this.interruptSince>=machineConfig.recoveryInterruptDwellMs){this.phase='dispersal-hold';this.recoveryKind=null;this.calmSince=null;this.clearTimers();this.clip=9;this.onChange(this,{type:'restore-dispersal'});}
 }
 updateOrdinaryRecovery(now) {
  if(this.mediaPhase!=='playing'){this.pending=null;return;}
  if(this.desired<this.state){
   if(!this.hasPending(this.desired,now))return;
   this.state=this.desired;this.pending=null;return;
  }
  if(this.desired===this.state){this.pending=null;return;}
  if(!this.hasPending(this.desired,now))return;
  this.state=this.desired;this.pending=null;this.phase='loop';this.recoveryKind=null;this.play(this.state+1);
 }
 startDispersal() {
  this.phase='dispersal-playing';this.recoveryKind=null;this.severeSince=null;this.calmSince=null;this.pending=null;this.play(9);
 }
 startOrdinaryRecovery(clip,goal) {
  this.phase='recovery-playing';this.recoveryKind='ordinary';this.state=goal;this.pending=null;this.play(clip);
 }
 ended(clip=this.clip) {
  if(clip!==this.clip)return false;
  if(this.phase==='dispersal-playing'&&clip===9){this.phase='dispersal-hold';this.pending=null;this.calmSince=null;this.onChange(this,{type:'hold-dispersal'});return true;}
  if(this.phase!=='recovery-playing')return false;
  if(this.recoveryKind==='group'&&clip===10){this.phase='loop';this.recoveryKind=null;this.state=0;this.desired=0;this.clearTimers();this.play(1);return true;}
  if(this.recoveryKind==='ordinary'&&clip===7){
    if(this.desired===0){this.state=0;this.play(8);return true;}
    this.phase='loop';this.recoveryKind=null;this.state=this.desired;this.play(this.state+1);return true;
  }
    if(this.recoveryKind==='ordinary'&&clip===8){this.phase='loop';this.recoveryKind=null;this.state=this.desired;this.play(this.state+1);return true;}
  return false;
 }
 play(clip){this.clip=clip;this.onChange(this,{type:'play',clip});}
}
