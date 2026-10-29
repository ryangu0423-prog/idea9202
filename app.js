import {HorseStateMachine,states} from './state-machine.js';
import {VideoPlaybackController} from './video-playback.js';
import {SceneProjection,sceneCalibration} from './scene-projection.js?v=9c7e4be';
const $=s=>document.querySelector(s);
const scene=$('#scene'),wall=$('#wall'),video=$('#source'),canvas=$('#horse'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const projection=new SceneProjection(scene,wall,document.querySelector('[data-mode][aria-pressed="true"]').dataset.mode);
const status=message=>$('#status').textContent=message;
const oldFrame=document.createElement('canvas');oldFrame.width=640;oldFrame.height=360;
const working=document.createElement('canvas');working.width=640;working.height=360;const work=working.getContext('2d',{willReadFrequently:true});
const holdFrame=document.createElement('canvas');holdFrame.width=640;holdFrame.height=360;const holdContext=holdFrame.getContext('2d');
let fadeStart=0,fadeOnPlayback=true,renderAt=0,source='manual',inputMessage='Manual input · microphone off',mediaMessage='',manual=0,sensitivity=1,meter=0,slow=0,last=performance.now(),db=-65,baseline=-60,stream,audio,analyser,samples,micRequestId=0,calibration=null,demoStart=0,inputReady=true,manualAvailable=true,seedLevel=true,hasHoldFrame=false;
let machine;
function rememberFrame(target,context){context.clearRect(0,0,target.width,target.height);context.drawImage(canvas,0,0,target.width,target.height);}
function restoreHoldFrame(){if(!hasHoldFrame)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(holdFrame,0,0);}
function reportPlayback({phase,clip}){
 machine?.setMediaPhase(phase);
 if(phase==='loading'||phase==='ready'||phase==='starting')mediaMessage=`Loading animation ${clip}…`;
 else if(phase==='blocked')mediaMessage=`Playback was blocked. Click the scene to retry animation ${clip}.`;
 else if(phase==='paused')mediaMessage=`Animation ${clip} paused. Click the scene to resume.`;
 else if(phase==='failed'){mediaMessage=`Animation ${clip} failed to load. Click the scene to retry.`;ctx.clearRect(0,0,canvas.width,canvas.height);}
 else if(phase==='holding')mediaMessage='The horse is holding its final frame until sound stays calm.';
 else if(phase==='playing'){
  if(fadeOnPlayback){fadeStart=performance.now();fadeOnPlayback=false;}
  mediaMessage='';
 }else if(phase==='ended')mediaMessage='';
 status(mediaMessage||inputMessage);
}
const player=new VideoPlaybackController(video,{
 onStatus:reportPlayback,
 onEnded:({clip})=>{
  draw(performance.now(),true);
  if(clip===9&&machine?.phase==='dispersal-playing'){rememberFrame(holdFrame,holdContext);hasHoldFrame=true;}
  machine?.ended(clip);
 }
});
function machineChanged(current,change){
 wall.dataset.clip=String(current.clip);wall.dataset.phase=current.phase;
 if(change.type==='play'){
  rememberFrame(oldFrame,oldFrame.getContext('2d'));fadeOnPlayback=true;player.requestClip(change.clip);
 }else if(change.type==='hold-dispersal'){
  player.hold(9);restoreHoldFrame();
 }else if(change.type==='restore-dispersal'){
  player.hold(9);restoreHoldFrame();
 }
}
machine=new HorseStateMachine(machineChanged);
machine.setGroupMode(document.querySelector('[data-mode][aria-pressed="true"]')?.dataset.mode==='Group',slow);
machine.play(1);
function draw(now,force=false){
 if(player.phase==='holding'){restoreHoldFrame();return;}
 if(!force&&!['playing','paused','ended'].includes(player.phase))return;
 if(video.readyState<2||!video.videoWidth||!video.videoHeight)return;
 const scale=Math.min(working.width/video.videoWidth,working.height/video.videoHeight),width=video.videoWidth*scale,height=video.videoHeight*scale;
 work.clearRect(0,0,working.width,working.height);work.drawImage(video,(working.width-width)/2,(working.height-height)/2,width,height);
 const frame=work.getImageData(0,0,working.width,working.height),pixels=frame.data;
 for(let index=0;index<pixels.length;index+=4){const redness=pixels[index]-Math.max(pixels[index+1],pixels[index+2]);pixels[index+3]=Math.min(255,Math.max(0,(redness-22)*2.2));}
 work.putImageData(frame,0,0);const fade=force?1:Math.min(1,(now-fadeStart)/280);
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1-fade;ctx.drawImage(oldFrame,0,0);ctx.globalAlpha=fade;ctx.drawImage(working,0,0);ctx.globalAlpha=1;
}
function updateSourceControls(){
 const track=stream?.getAudioTracks()[0],micLive=source==='microphone'&&document.visibilityState==='visible'&&audio?.state==='running'&&track?.readyState==='live';
 $('#input-label').textContent=$('#mic').disabled?'MICROPHONE REQUESTING':source==='microphone'?(micLive?'LIVE MICROPHONE':'MICROPHONE PAUSED'):source==='demo'?'Simulated demonstration':inputReady?'MANUAL SOUND INPUT':'MANUAL INPUT PAUSED';
 $('#mic').setAttribute('aria-pressed',String(source==='microphone'));$('#mic').textContent=source==='microphone'?(micLive?'Stop microphone':'Resume microphone'):'Enable microphone';
 $('#demo').setAttribute('aria-pressed',String(source==='demo'));$('#demo').textContent=source==='demo'?'Stop simulated demonstration':'Start simulated demonstration';
}
function stopMic(){micRequestId++;const oldStream=stream,oldAudio=audio;stream=null;audio=null;analyser=null;samples=null;calibration=null;if(oldStream)oldStream.getTracks().forEach(track=>track.stop());if(oldAudio)oldAudio.close().catch(()=>{});$('#mic').disabled=false;$('#baseline').disabled=true;$('#baseline-status').textContent='Enable the microphone, then stay quiet to set the baseline.';}
function setSource(next,message=null,{available=true}={}){
 const changed=source!==next;
 if(next!=='microphone')stopMic();
 source=next;
 if(changed){machine.resetTimers();last=performance.now();seedLevel=true;}
 inputReady=next==='microphone'?document.visibilityState==='visible'&&audio?.state==='running'&&stream?.getAudioTracks()[0]?.readyState==='live':available;
 if(next==='demo'){demoStart=performance.now();inputReady=true;}
 if(next==='manual')manualAvailable=available;
 inputMessage=message??(next==='microphone'?(audio?.state==='running'?'Live microphone · processed locally, no recording':'Microphone paused. Resume it or use the manual slider.'):next==='demo'?'Simulated demonstration · microphone off':'Manual input · microphone off');
 updateSourceControls();status(mediaMessage||inputMessage);
}
$('#mic').onclick=async()=>{
 if(source==='microphone'){
  if(audio?.state==='running'){setSource('manual');return;}
    if(audio?.state==='suspended'){try{await audio.resume();inputReady=document.visibilityState==='visible'&&audio.state==='running';machine.resetTimers();last=performance.now();seedLevel=true;setSource('microphone',inputReady?'Live microphone · processed locally, no recording':'Microphone remains paused. Use the manual slider if needed.');}catch{setSource('microphone','Microphone is paused. Click Resume microphone again or use the manual slider.');}return;}
  setSource('manual','Microphone is unavailable. Manual input is active.');return;
 }
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){setSource('manual','Microphone needs HTTPS and browser support. Use the manual slider in Settings.');return;}
 const id=++micRequestId;$('#mic').disabled=true;inputReady=false;machine.resetTimers();last=performance.now();$('#input-label').textContent='MICROPHONE REQUESTING';inputMessage='Waiting for microphone permission…';status(inputMessage);let incoming,context;
 try{
  incoming=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
  if(id!==micRequestId){incoming.getTracks().forEach(track=>track.stop());return;}
  context=new AudioContext();await context.resume();
  if(id!==micRequestId){incoming.getTracks().forEach(track=>track.stop());await context.close();return;}
  stream=incoming;audio=context;analyser=audio.createAnalyser();analyser.fftSize=2048;audio.createMediaStreamSource(stream).connect(analyser);samples=new Float32Array(analyser.fftSize);
  context.addEventListener('statechange',()=>{
   if(audio!==context||source!=='microphone')return;
    machine.resetTimers();last=performance.now();seedLevel=true;inputReady=document.visibilityState==='visible'&&context.state==='running';
    calibration=null;$('#baseline').disabled=!inputReady;$('#baseline-status').textContent=inputReady?`Quiet baseline: ${baseline.toFixed(0)} dBFS (digital level).`:'Microphone paused. Set the quiet baseline again after resuming.';
   inputMessage=context.state==='running'?'Live microphone · processed locally, no recording':'Microphone paused. Click Resume microphone or use the manual slider.';
   updateSourceControls();status(mediaMessage||inputMessage);
  });
  stream.getAudioTracks()[0].addEventListener('ended',()=>{if(source==='microphone')setSource('manual','Microphone disconnected. Move the manual slider to provide sound input.',{available:false});});
  setSource('microphone','Live microphone · processed locally, no recording');$('#baseline').disabled=false;$('#baseline-status').textContent=`Quiet baseline: ${baseline.toFixed(0)} dBFS (digital level).`;
 }catch(error){incoming?.getTracks().forEach(track=>track.stop());await context?.close().catch(()=>{});if(id===micRequestId)setSource('manual',error.name==='NotAllowedError'?'Microphone permission denied. Move the manual slider to provide sound input.':`Microphone unavailable (${error.name}). Move the manual slider to provide sound input.`,{available:false});}
 finally{if(id===micRequestId)$('#mic').disabled=false;}
};
$('#manual-level').oninput=e=>{manual=Number(e.target.value);$('#manual-value').value=`${manual}%`;setSource('manual',null,{available:true});};
$('#sensitivity').oninput=e=>{sensitivity=Number(e.target.value);$('#sensitivity-value').value=`${sensitivity.toFixed(1)}×`;};
$('#baseline').onclick=()=>{if(source!=='microphone')return;calibration={start:performance.now(),values:[]};$('#baseline').disabled=true;$('#baseline-status').textContent='Listening for quiet baseline… stay quiet for two seconds.';};
$('#demo').onclick=()=>setSource(source==='demo'?'manual':'demo');
let modeVersion=0;
for(const button of document.querySelectorAll('[data-mode]'))button.onclick=async()=>{const version=++modeVersion,mode=button.dataset.mode;const path=sceneCalibration[mode].asset;const image=new Image();image.src=path;try{await image.decode();if(version!==modeVersion)return;$('#scene-image').src=path;$('#scene-image').alt=mode==='Passive'?'Gate 1 forecourt with no active participant':mode==='Individual'?'One spectator watching the Gate 1 wall projection':'Football supporters arriving at Gate 1 in Group mode';projection.setScene(mode,path);for(const modeButton of document.querySelectorAll('[data-mode]')){const selected=modeButton===button;modeButton.setAttribute('aria-pressed',String(selected));modeButton.classList.toggle('selected',selected);}machine.setGroupMode(mode==='Group',slow);$('#scenario-label').textContent=`${mode} · manually selected scenario`;}catch{status(`${mode} scene could not load. Current scene retained.`);}};
$('#settings-toggle').onclick=()=>{const open=$('#settings').hidden;$('#settings').hidden=!open;$('#settings-toggle').setAttribute('aria-expanded',String(open));};
function closeSettings(){$('#settings').hidden=true;$('#settings-toggle').setAttribute('aria-expanded','false');$('#settings-toggle').focus();}
$('#settings-close').onclick=closeSettings;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#settings').hidden)closeSettings();});
$('#closeup').onclick=e=>{const close=scene.classList.toggle('close');e.currentTarget.setAttribute('aria-pressed',String(close));e.currentTarget.textContent=close?'Wide view':'Close-up';};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{status('Fullscreen is unavailable in this browser.');}};
document.addEventListener('fullscreenchange',()=>$('#fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen');
scene.addEventListener('click',()=>{player.activate();});
document.addEventListener('visibilitychange',()=>{
 machine.resetTimers();last=performance.now();seedLevel=true;calibration=null;
 if(document.visibilityState==='hidden')inputReady=false;
 else inputReady=source==='microphone'?(audio?.state==='running'&&stream?.getAudioTracks()[0]?.readyState==='live'):source==='demo'||(manualAvailable&&!$('#mic').disabled);
 if(source==='microphone')inputMessage=inputReady?'Live microphone · processed locally, no recording.':'Microphone paused. Resume it or use the manual slider.';
 $('#baseline').disabled=source!=='microphone'||!inputReady;
 updateSourceControls();status(mediaMessage||(inputReady?inputMessage:'Microphone paused while the page is hidden.'));
});
window.addEventListener('pagehide',()=>{if(source==='microphone')setSource('manual','Microphone stopped when leaving the page. Move the manual slider to provide sound input.',{available:false});else stopMic();});
// A single timed loop keeps the meter responsive while the horse uses slower sound + dwell + hysteresis.
function tick(now){
 const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;let raw=manual;
 const track=stream?.getAudioTracks()[0];
 inputReady=source!=='microphone'||(document.visibilityState==='visible'&&audio?.state==='running'&&track?.readyState==='live');
 if(inputReady){
  if(source==='microphone'&&analyser){
   analyser.getFloatTimeDomainData(samples);let square=0;for(const sample of samples)square+=sample*sample;
   db=Math.max(-100,20*Math.log10(Math.max(1e-5,Math.sqrt(square/samples.length))));raw=Math.max(0,Math.min(100,(db-baseline)*2.4*sensitivity));
   if(calibration){calibration.values.push(db);if(now-calibration.start>=2000){const sorted=calibration.values.sort((a,b)=>a-b);baseline=Math.max(-90,Math.min(-15,sorted[Math.floor(sorted.length*.5)]));calibration=null;$('#baseline').disabled=false;$('#baseline-status').textContent=`Quiet baseline set: ${baseline.toFixed(0)} dBFS (digital level).`;}}
  }else{if(source==='demo'){const time=(now-demoStart)/1000%48;raw=time<6?5:time<21?Math.min(98,5+(time-6)*6.2):time<27?98:time<30?98-(time-27)*31:5;}db=-65+raw*.55;raw=Math.min(100,raw*sensitivity);}
  if(seedLevel){meter=raw;slow=raw;seedLevel=false;}else{meter+=(raw-meter)*(1-Math.exp(-dt/(raw>meter?.09:.22)));slow+=(meter-slow)*(1-Math.exp(-dt/.65));}
  machine.update(slow,now);
 }
 const state=states[machine.state],settling=machine.settling||meter<slow-7;
 $('#reading').textContent=Math.max(0,100+db).toFixed(0);$('.volume i').style.height=`${meter}%`;$('.volume').setAttribute('aria-valuenow',String(Math.round(meter)));$('#horse-state').textContent=`${String(machine.state+1).padStart(2,'0')} ${state[0]}`;$('#horse-feedback').textContent=settling?'Sound is falling. The horse is settling.':state[1];wall.dataset.clip=machine.clip;wall.dataset.phase=machine.phase;
 if(now-renderAt>33){draw(now);renderAt=now;}requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
