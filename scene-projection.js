// Landmarks in each supplied photograph's native pixels (clockwise from top left).
// Keep projection and foreground masks in the same coordinate system.
const columns=[
 [[358,377],[381,375],[414,381],[393,660],[376,666],[350,665],[331,662]],
 [[706,372],[728,370],[764,377],[749,687],[731,695],[707,695],[685,690]],
];
// The two Group spectators standing immediately in front of the wall.
const groupSpectators=[
 [[765,565],[773,559],[783,560],[793,567],[796,572],[790,576],[789,585],[786,594],[793,598],[805,604],[815,617],[822,645],[818,672],[807,684],[804,770],[792,782],[773,779],[765,775],[751,782],[746,772],[757,733],[758,685],[748,668],[743,650],[746,627],[752,610],[763,600],[768,594],[766,587],[762,580],[765,573]],
 [[833,576],[843,574],[852,576],[858,582],[863,595],[872,603],[881,615],[887,641],[887,667],[877,680],[876,727],[867,771],[865,781],[853,785],[839,782],[837,775],[843,765],[843,714],[832,748],[830,767],[823,773],[814,771],[811,766],[815,755],[818,710],[818,673],[812,659],[815,632],[819,614],[827,602],[830,592],[828,585]],
];
const wallCorners=[[430,452],[882,494],[876,620],[418,637]];
export const sceneCalibration={
 Passive:{asset:'./public/assets/passive.png?v=9c7e4be',width:1672,height:941,corners:wallCorners,occluders:columns},
 Individual:{asset:'./public/assets/individual%20mode.png?v=9c7e4be',width:1672,height:941,corners:wallCorners,occluders:columns},
 Group:{asset:'./public/assets/group%20mode.png?v=9c7e4be',width:1672,height:941,corners:wallCorners,occluders:[...columns,...groupSpectators]},
};

function solve(a,b){
 for(let i=0;i<b.length;i++){
  let pivot=i;
  for(let j=i+1;j<b.length;j++)if(Math.abs(a[j][i])>Math.abs(a[pivot][i]))pivot=j;
  [a[i],a[pivot]]=[a[pivot],a[i]];[b[i],b[pivot]]=[b[pivot],b[i]];
  const divisor=a[i][i];
  for(let k=i;k<b.length;k++)a[i][k]/=divisor;
  b[i]/=divisor;
  for(let j=0;j<b.length;j++)if(i!==j){
   const factor=a[j][i];
   for(let k=i;k<b.length;k++)a[j][k]-=factor*a[i][k];
   b[j]-=factor*b[i];
  }
 }
 return b;
}

const polygon=(points,{width,height})=>`polygon(${points.map(([x,y])=>`${x/width*100}% ${y/height*100}%`).join(',')})`;

export class SceneProjection {
 constructor(scene,wall,mode){
  this.scene=scene;this.wall=wall;this.layer=wall.parentElement;
  this.masks=[];
  this.setScene(mode,scene.querySelector('#scene-image').getAttribute('src'));
  this.observer=new ResizeObserver(()=>this.place());this.observer.observe(scene);
 }
 setScene(mode,path){
  this.calibration=sceneCalibration[mode];
  const calibration=this.calibration;
  this.scene.style.aspectRatio=`${calibration.width} / ${calibration.height}`;
  this.scene.style.setProperty('--scene-ratio',calibration.width/calibration.height);
  this.layer.style.clipPath=polygon(calibration.corners,calibration);
  while(this.masks.length>calibration.occluders.length)this.masks.pop().remove();
  while(this.masks.length<calibration.occluders.length){
   const image=new Image();image.alt='';image.className='column-mask';
   image.setAttribute('aria-hidden','true');this.scene.append(image);this.masks.push(image);
  }
  this.masks.forEach((image,index)=>{
   image.src=path;image.style.clipPath=polygon(calibration.occluders[index],calibration);
  });
  this.place();
 }
 place(){
  const {width,height,corners}=this.calibration;
  // Layout dimensions exclude the close-up transform, which moves every layer together.
  const size=getComputedStyle(this.scene);
  const scaleX=parseFloat(size.width)/width,scaleY=parseFloat(size.height)/height,a=[],b=[];
  [[0,0],[1000,0],[1000,260],[0,260]].forEach(([x,y],index)=>{
   const [u,v]=[corners[index][0]*scaleX,corners[index][1]*scaleY];
   a.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);b.push(u,v);
  });
  const h=solve(a,b);
  this.wall.style.transform=`matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,1)`;
 }
}
