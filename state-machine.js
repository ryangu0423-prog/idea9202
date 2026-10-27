export const states = [
 ['Calm','Thank you. Keep it calm.'],
 ['Aware','Sound is rising. Please be mindful.'],
 ['Alert','It’s getting noisy. Let’s keep it down.'],
 ['Nervous','Your voices affect the horse. Speak softly.'],
 ['Distressed','Too loud here. Lower your voices together.'],
 ['Highly agitated','Help the horse settle. Please lower your voices.']
];
const boundaries=[18,34,50,66,82];
export class HorseStateMachine {
 constructor(onChange=()=>{}) { this.state=0;this.clip=1;this.recovering=false;this.pending=null;this.onChange=onChange;this.desired=0;this.settling=false; }
 target(level) {let next=this.desired;while(next<5&&level>boundaries[next]+3)next++;while(next>0&&level<boundaries[next-1]-3)next--;return next;}
 update(level,now) {
  this.desired=this.target(level);this.settling=this.desired<this.state||this.recovering;
  const target=this.desired;
  const actionable=this.recovering?target>this.recoveryGoal:target!==this.state;
  if(!actionable){this.pending=null;return;}
  if(this.pending?.target!==target){this.pending={target,since:now};return;}
  const dwell=this.recovering||target>this.state?1000:1600;
  if(now-this.pending.since<dwell)return;
  this.pending=null;
  if(this.recovering||target>this.state){this.recovering=false;this.state=target;this.change(target+1);}
  else if(this.state>=3){this.beginRecovery(7,2);}
  else {this.beginRecovery(8,0);}
 }
 beginRecovery(clip,goal){this.recovering=true;this.recoveryGoal=goal;this.change(clip);}
 ended(){if(!this.recovering)return;const previous=this.clip;this.state=this.recoveryGoal;this.pending=null;
  if(previous===7&&this.desired<2){this.beginRecovery(8,0);}
  else {this.recovering=false;this.change(this.state+1);}
 }
 change(clip){this.clip=clip;this.onChange(this);}
}
