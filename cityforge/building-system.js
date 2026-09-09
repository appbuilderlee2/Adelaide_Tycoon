import {THREE,scene,terrainHeight,WATER_LEVEL} from './engine.js';
import {roadSamples} from './road-network.js';

export const parcels=[];
export const buildings=[];
const parcelMap=new Map();
const GRID=32;
let nextBuildingId=1;

const zoneColors={res:0x4ec66b,com:0x4f8fe8,ind:0xe0b34f};
const palette={
  res:[0xd8c9b7,0xc4d1d5,0xe4d7c7,0xb9c8b5],
  com:[0x93a8b3,0xa8b7c5,0xc1b7aa,0x8297a6],
  ind:[0x8f8d83,0x9b947f,0x777c77,0xaaa18d]
};
const materials={};
for(const k in palette)materials[k]=palette[k].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:k==='com'?.5:.82,metalness:k==='com'?.08:0}));
const constructionMat=new THREE.MeshStandardMaterial({color:0xa88b58,roughness:1,wireframe:true,transparent:true,opacity:.7});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const key=(x,z)=>`${Math.round(x/GRID)},${Math.round(z/GRID)}`;
function nearestRoadDistance(x,z){let best=Infinity;for(const p of roadSamples){const d=(p.x-x)**2+(p.z-z)**2;if(d<best)best=d}return Math.sqrt(best)}
function roadAccessScore(x,z){const d=nearestRoadDistance(x,z);return clamp(1-d/90,0,1)}
function terrainScore(x,z){const h=terrainHeight(x,z);return h<WATER_LEVEL+2?0:clamp(1-Math.abs(h)/260,.35,1)}

export function paintParcel(type,x,z){
  const gx=Math.round(x/GRID)*GRID,gz=Math.round(z/GRID)*GRID,k=key(gx,gz);if(parcelMap.has(k))return parcelMap.get(k);
  if(terrainHeight(gx,gz)<WATER_LEVEL+2)return null;
  const g=new THREE.PlaneGeometry(29,29);g.rotateX(-Math.PI/2);
  const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:zoneColors[type],transparent:true,opacity:.34,depthWrite:false}));
  mesh.position.set(gx,terrainHeight(gx,gz)+1.2,gz);scene.add(mesh);
  const p={id:k,type,x:gx,z:gz,mesh,status:'zoned',building:null,age:0,construction:0,landValue:35,desirability:0,serviceScore:.15,pollution:0,noise:0,demandScore:0,lastEval:0};
  parcels.push(p);parcelMap.set(k,p);return p;
}

function calcLandValue(p,ctx){
  const access=roadAccessScore(p.x,p.z),terrain=terrainScore(p.x,p.z);
  const service=clamp(ctx.serviceScore??p.serviceScore,0,1),education=clamp(ctx.educationScore??.15,0,1);
  const pollution=clamp((ctx.pollutionAt?.(p.x,p.z)??p.pollution),0,1),noise=clamp((ctx.noiseAt?.(p.x,p.z)??p.noise),0,1);
  const jobs=clamp(ctx.jobsAccess??.45,0,1);
  let value=18+access*28+terrain*8+service*20+education*12+jobs*10-pollution*32-noise*14;
  if(p.type==='ind')value+=pollution*10-noise*2;
  return clamp(value,1,100);
}
function demandFor(type,ctx){const d=ctx.demand||{};return clamp(d[type]??.5,0,1)}
function taxPressure(type,ctx){const tax=ctx.taxRates?.[type]??10;return clamp((tax-10)/12,-.3,.65)}
function developmentScore(p,ctx){
  const access=roadAccessScore(p.x,p.z);if(access<.2)return 0;
  const land=p.landValue/100,demand=demandFor(p.type,ctx),tax=taxPressure(p.type,ctx);
  const pollution=clamp(ctx.pollutionAt?.(p.x,p.z)??0,0,1);
  const service=clamp(ctx.serviceScore??.15,0,1);
  let score=demand*.5+access*.2+land*.18+service*.12-tax*.28;
  if(p.type==='res')score-=pollution*.35;
  if(p.type==='com')score+=clamp(ctx.populationFactor??.3,0,1)*.12;
  if(p.type==='ind')score+=clamp(ctx.freightAccess??.3,0,1)*.12;
  return clamp(score,0,1);
}
function dimensions(type,level){
  if(type==='res')return {w:18+level*2,d:18+level*1.5,h:12+level*14};
  if(type==='com')return {w:22+level*2.5,d:22+level*2,h:18+level*21};
  return {w:28+level*3,d:30+level*2,h:10+level*8};
}
function capacity(type,level,d){
  if(type==='res')return {households:Math.round((d.w*d.d*d.h)/1800),pop:Math.round((d.w*d.d*d.h)/640),jobs:Math.max(1,level)};
  if(type==='com')return {households:0,pop:0,jobs:Math.round((d.w*d.d*d.h)/1350)};
  return {households:0,pop:0,jobs:Math.round((d.w*d.d)/55*(1+level*.18))};
}
function createBuildingVisual(b,construction=false){
  if(b.group)scene.remove(b.group);
  const d=dimensions(b.type,b.level),group=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(d.w,d.h,d.d),construction?constructionMat:materials[b.type][(b.id+b.level)%materials[b.type].length]);
  body.position.y=d.h/2;body.castShadow=body.receiveShadow=true;group.add(body);
  if(!construction){
    const roofH=b.type==='ind'?2.5:1.8,roof=new THREE.Mesh(new THREE.BoxGeometry(d.w*.88,roofH,d.d*.88),new THREE.MeshStandardMaterial({color:0x596166,roughness:.9}));roof.position.y=d.h+roofH/2;group.add(roof);
    if(b.type!=='ind'){
      const floors=Math.max(1,Math.floor(d.h/8));const wm=new THREE.MeshStandardMaterial({color:0xaed0dd,emissive:0x17252b,roughness:.25,metalness:.05});
      for(let f=0;f<floors;f++)for(const side of [-1,1]){const win=new THREE.Mesh(new THREE.BoxGeometry(d.w*.58,2.1,.18),wm);win.position.set(0,4+f*7,side*(d.d/2+.11));group.add(win)}
    }
  }
  group.position.set(b.x,terrainHeight(b.x,b.z)+.9,b.z);scene.add(group);b.group=group;b.dim=d;
}
function startConstruction(p){
  const b={id:nextBuildingId++,parcel:p,type:p.type,x:p.x,z:p.z,status:'construction',level:1,occupancy:0,condition:1,households:0,pop:0,jobs:0,profitability:.5,upgradeProgress:0,abandonment:0,group:null,dim:null};
  p.status='construction';p.building=b;p.mesh.visible=false;buildings.push(b);createBuildingVisual(b,true);return b;
}
function completeConstruction(b){b.status='active';b.occupancy=.35;const c=capacity(b.type,b.level,b.dim||dimensions(b.type,b.level));Object.assign(b,c);createBuildingVisual(b,false)}
function applyLevel(b,newLevel){b.level=clamp(newLevel,1,5);const c=capacity(b.type,b.level,dimensions(b.type,b.level));Object.assign(b,c);createBuildingVisual(b,false)}
function evaluateBuilding(b,ctx,dt){
  const p=b.parcel;const demand=demandFor(b.type,ctx),tax=taxPressure(b.type,ctx),land=p.landValue/100,services=clamp(ctx.serviceScore??.15,0,1),pollution=clamp(ctx.pollutionAt?.(b.x,b.z)??0,0,1);
  let target=.35+demand*.45+services*.18+land*.15-tax*.22;
  if(b.type==='res')target-=pollution*.3;
  target=clamp(target,0,1);b.occupancy+=(target-b.occupancy)*Math.min(1,dt*.22);
  b.profitability=clamp(.35+b.occupancy*.5+land*.25-tax*.3-(b.type==='res'?pollution*.15:0),0,1);
  const upgradeScore=b.occupancy*.32+b.profitability*.3+services*.2+land*.18;
  if(upgradeScore>.72&&b.level<5)b.upgradeProgress+=dt*(upgradeScore-.68)*.12;else b.upgradeProgress=Math.max(0,b.upgradeProgress-dt*.03);
  if(b.upgradeProgress>=1){b.upgradeProgress=0;applyLevel(b,b.level+1)}
  if(b.occupancy<.12||b.profitability<.1)b.abandonment+=dt*.05;else b.abandonment=Math.max(0,b.abandonment-dt*.08);
  if(b.abandonment>1){b.status='abandoned';b.occupancy=0;b.group.traverse(o=>{if(o.material&&o.material.color)o.material.color.multiplyScalar(.55)})}
  if(b.status==='abandoned'&&demand>.72&&services>.45){b.abandonment-=dt*.08;if(b.abandonment<=.25){b.status='active';b.occupancy=.2;createBuildingVisual(b,false)}}
}

export function simulateBuildings(dt,ctx={}){
  for(const p of parcels){
    p.age+=dt;p.lastEval+=dt;if(p.lastEval>.8){p.lastEval=0;p.landValue=calcLandValue(p,ctx);p.desirability=developmentScore(p,ctx);p.demandScore=demandFor(p.type,ctx)}
    if(p.status==='zoned'&&p.desirability>.42&&Math.random()<dt*(.025+p.desirability*.035))startConstruction(p);
    if(p.status==='construction'&&p.building){p.construction+=dt*(.08+.05*p.desirability);if(p.construction>=1){p.construction=1;completeConstruction(p.building);p.status='built'}}
  }
  for(const b of buildings)if(b.status==='active'||b.status==='abandoned')evaluateBuilding(b,ctx,dt);
}

export function removeBuildingOrParcel(x,z,r=28){
  let target=null,best=r;for(const p of parcels){const d=Math.hypot(p.x-x,p.z-z);if(d<best){best=d;target=p}}
  if(!target)return false;
  if(target.building){const b=target.building;if(b.group)scene.remove(b.group);const i=buildings.indexOf(b);if(i>=0)buildings.splice(i,1)}
  if(target.mesh)scene.remove(target.mesh);parcelMap.delete(target.id);const pi=parcels.indexOf(target);if(pi>=0)parcels.splice(pi,1);return true;
}

export function buildingStats(){
  const s={population:0,jobs:0,households:0,active:0,construction:0,abandoned:0,levels:[0,0,0,0,0],avgLandValue:0};
  let lv=0;for(const p of parcels)lv+=p.landValue;
  for(const b of buildings){if(b.status==='construction')s.construction++;else if(b.status==='abandoned')s.abandoned++;else s.active++;if(b.status==='active'){s.population+=Math.round(b.pop*b.occupancy);s.jobs+=Math.round(b.jobs*b.occupancy);s.households+=Math.round(b.households*b.occupancy)}s.levels[b.level-1]++}
  s.avgLandValue=parcels.length?lv/parcels.length:0;return s;
}
