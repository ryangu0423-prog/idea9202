export class VideoPlaybackController {
 constructor(video,{onStatus=()=>{},onEnded=()=>{},assetUrl=null,loadTimeoutMs=12000}={}) {
  this.video=video;this.onStatus=onStatus;this.onEnded=onEnded;this.assetUrl=assetUrl??(clip=>new URL(`./public/assets/horse-${clip}.mp4`,video.baseURI).href);this.loadTimeoutMs=loadTimeoutMs;this.loadTimer=null;this.phase='idle';this.clip=null;this.generation=0;this.expectedSource='';
  video.addEventListener('loadeddata',()=>this.handleLoadedData());
  video.addEventListener('ended',()=>this.handleEnded());
  video.addEventListener('error',()=>this.handleError());
  video.addEventListener('pause',()=>this.handlePause());
 }
 requestClip(clip) {
    const generation=++this.generation;this.clip=clip;const source=new URL(this.assetUrl(clip),this.video.baseURI);source.searchParams.set('_play',String(generation));this.expectedSource=source.href;this.phase='loading';
    this.clearLoadTimer();this.loadTimer=setTimeout(()=>{if(generation===this.generation&&this.phase==='loading'){this.phase='failed';this.playError=new Error('Media loading timed out');this.notify();}},this.loadTimeoutMs);
    // load() resets playbackRate to defaultPlaybackRate in real browsers.
    this.video.pause();this.video.loop=clip<=6;this.video.defaultPlaybackRate=clip===3?0.6:1;this.video.playbackRate=this.video.defaultPlaybackRate;this.video.src=this.expectedSource;this.video.load();this.notify();return generation;
 }
 currentSourceMatches() {
  const source=this.video.currentSrc||this.video.src;
  return source===this.expectedSource;
 }
 handleLoadedData() {
  if(this.phase!=='loading'||!this.currentSourceMatches()||this.video.readyState<2)return;
  this.clearLoadTimer();
  const generation=this.generation;this.phase='ready';this.notify();this.attemptPlay(generation);
 }
 async attemptPlay(generation=this.generation) {
  if(generation!==this.generation||!['ready','blocked','paused'].includes(this.phase)||!this.currentSourceMatches())return false;
  this.phase='starting';this.notify();
  try { await this.video.play(); }
  catch(error) {
   if(generation!==this.generation||this.phase!=='starting')return false;
   this.phase=error.name==='NotAllowedError'?'blocked':'failed';this.playError=error;this.notify();return false;
  }
  if(generation!==this.generation||this.phase!=='starting'||!this.currentSourceMatches())return false;
  if(this.video.paused){this.phase='paused';this.notify();return false;}
  this.phase='playing';this.playError=null;this.notify();return true;
 }
 handlePause() {
  if(this.phase!=='playing'||this.video.ended||!this.currentSourceMatches())return;
  this.phase='paused';this.notify();
 }
 handleEnded() {
  if(this.phase!=='playing'||this.clip<=6||!this.video.ended||!this.currentSourceMatches())return;
  this.phase='ended';const completion={clip:this.clip,generation:this.generation};this.notify();this.onEnded(completion);
 }
 handleError() {
  if(!['loading','ready','starting','playing','paused'].includes(this.phase)||!this.currentSourceMatches())return;
  this.clearLoadTimer();this.phase='failed';this.playError=this.video.error??null;this.notify();
 }
 activate() {
  if(this.phase==='failed')return this.requestClip(this.clip);
  if(this.phase==='ready'||this.phase==='blocked'||this.phase==='paused')return this.attemptPlay();
  return false;
 }
 hold(clip=this.clip) {
  ++this.generation;this.clearLoadTimer();this.clip=clip;this.video.pause();this.phase='holding';this.notify();
 }
 clearLoadTimer() { if(this.loadTimer!==null){clearTimeout(this.loadTimer);this.loadTimer=null;} }
 notify() { this.onStatus({phase:this.phase,clip:this.clip,generation:this.generation,error:this.playError??null}); }
}
