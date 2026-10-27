const scene=document.querySelector('#scene'),wall=document.querySelector('#wall');
const video=document.querySelector('#source'),canvas=document.querySelector('#horse'),ctx=canvas.getContext('2d',{willReadFrequently:true});
// Four measured wall corners in the shared 1569 × 1002 photographic plate.
// Solve the projective mapping, so text, meter and horse share the same wall plane.
const corners=[[280,453],[730,479],[724,626],[265,645]];
function solve(a,b){for(let i=0;i<b.length;i++){let p=i;for(let j=i+1;j<b.length;j++)if(Math.abs(a[j][i])>Math.abs(a[p][i]))p=j;[a[i],a[p]]=[a[p],a[i]];[b[i],b[p]]=[b[p],b[i]];const t=a[i][i];for(let k=i;k<b.length;k++)a[i][k]/=t;b[i]/=t;for(let j=0;j<b.length;j++)if(i!==j){const f=a[j][i];for(let k=i;k<b.length;k++)a[j][k]-=f*a[i][k];b[j]-=f*b[i];}}return b;}
function place(){const scale=scene.clientWidth/1569,a=[],b=[];[[0,0],[1000,0],[1000,260],[0,260]].forEach(([x,y],i)=>{const [u,v]=corners[i].map(n=>n*scale);a.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);b.push(u,v);});const h=solve(a,b);wall.style.transform=`matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,1)`;}
new ResizeObserver(place).observe(scene);
// Restore the exact photograph over projection where the structural columns occlude it.
for(const polygon of ['polygon(14% 37.8%,18.1% 38.4%,15.3% 67.2%,11.6% 66.5%)','polygon(34.7% 36.5%,38.3% 37%,36.5% 69.3%,32.4% 68.7%)']){const img=document.createElement('img');img.src='./public/assets/scene-group.png';img.alt='';img.className='column-mask';img.setAttribute('aria-hidden','true');img.style.clipPath=polygon;scene.append(img);}
function render(){ctx.drawImage(video,0,0,1280,720);const frame=ctx.getImageData(0,0,1280,720),d=frame.data;for(let i=0;i<d.length;i+=4){const redness=d[i]-Math.max(d[i+1],d[i+2]);d[i+3]=Math.min(255,Math.max(0,(redness-22)*2.2));}ctx.putImageData(frame,0,0);document.querySelector('#status').textContent='Scene & projection preview · 01 Calm · original video artwork';}
video.addEventListener('loadeddata',()=>{video.currentTime=.5;});video.addEventListener('seeked',render);video.addEventListener('error',()=>document.querySelector('#status').textContent='Horse video could not load.');
document.querySelector('#closeup').onclick=e=>{const close=scene.classList.toggle('close');e.currentTarget.setAttribute('aria-pressed',String(close));e.currentTarget.textContent=close?'Wide view':'Close-up';};
document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.querySelector('#status').textContent='Fullscreen is unavailable in this browser.';}};
