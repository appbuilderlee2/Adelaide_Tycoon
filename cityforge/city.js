import {THREE,scene} from './engine.js';
import {makeRoad as buildRoad,previewRoad as roadPreview,randomLane,lanePoint,laneTangent,roadStats,ROAD_TYPES,setRoadType,getRoadType} from './road-network.js';
import {paintParcel,removeBuildingOrParcel,simulateBuildings,buildingStats,parcels,buildings} from './building-system.js';

export {ROAD_TYPES,setRoadType,getRoadType,roadStats,parcels,buildings};
export const state={
  money:1250000,population:0,jobs:0,households:0,hour:8,speed:1,paused:false,
  taxRates:{res:10,com:10,ind:10},
  demand:{res:.66,com:.46,ind:.52},
  averageLandValue:0,
  services:{education:.12,healthcare:.10,police:.08,fire:.08,garbage:.08,electricity:.18,water:.18,sewage:.18},
  pollution:.08
};
export const cars=[];
export function previewRoad(points,typeId){return roadPreview(points,typeId)}
export function makeRoad(points,typeId){const res=buildRoad(points,state.money,typeId);if(res.ok)state.money-=res.cost;return res}
export function paintZone(type,x,z){return paintParcel(type,x,z)}
export function bulldoze(x,z,r=28){return removeBuildingOrParcel(x,z,r)}

function serviceScore(){const s=state.services,v=Object.values(s);return v.reduce((a,b)=>a+b,0)/Math.max(1,v.length)}
function pollutionAt(x,z){let p=state.pollution;for(const b of buildings)if(b.type==='ind'&&b.status==='active'){const d=Math.hypot(b.x-x,b.z-z);if(d<480)p+=Math.max(0,1-d/480)*.22}return Math.min(1,p)}
function noiseAt(x,z){let n=0;for(const b of buildings)if((b.type==='com'||b.type==='ind')&&b.status==='active'){const d=Math.hypot(b.x-x,b.z-z);if(d<260)n+=Math.max(0,1-d/260)*.12}return Math.min(1,n)}
function updateDemand(stats){
  const employment=stats.population?Math.min(1,stats.jobs/(stats.population*.48)):0;
  const taxR=(state.taxRates.res-10)*.025,taxC=(state.taxRates.com-10)*.025,taxI=(state.taxRates.ind-10)*.025;
  state.demand.res=Math.max(0,Math.min(1,.56+(stats.jobs-stats.population*.42)/Math.max(200,stats.population*.8)-taxR-serviceScore()*.05));
  state.demand.com=Math.max(0,Math.min(1,.34+stats.population/Math.max(500,stats.jobs*2.4+500)-taxC));
  state.demand.ind=Math.max(0,Math.min(1,.48+(1-employment)*.28-taxI-state.pollution*.08));
}

function spawnCar(){if(cars.length>160)return;const lane=randomLane();if(!lane)return;const mesh=new THREE.Mesh(new THREE.BoxGeometry(4.1,2.0,8.2),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(Math.random(),.55,.48),roughness:.45,metalness:.15}));mesh.castShadow=true;scene.add(mesh);cars.push({mesh,lane,t:Math.random(),speedMps:(lane.speedKph/3.6)*(.72+Math.random()*.25)})}
function updateCar(c,dt){const len=Math.max(1,c.lane.length),ahead=cars.find(o=>o!==c&&o.lane.id===c.lane.id&&o.t>c.t&&o.t-c.t<22/len);const factor=ahead?Math.max(.05,Math.min(1,(ahead.t-c.t)*len/18)):1;c.t+=c.speedMps*factor*dt/len;if(c.t>=1){const lane=randomLane();if(lane){c.lane=lane;c.t=0}else c.t=0}const p=lanePoint(c.lane,c.t),tg=laneTangent(c.lane,c.t);c.mesh.position.copy(p);c.mesh.rotation.y=Math.atan2(tg.x,tg.z)}

makeRoad([new THREE.Vector3(-1150,0,-280),new THREE.Vector3(0,0,-120),new THREE.Vector3(1180,0,80)],'avenue4');
makeRoad([new THREE.Vector3(-340,0,-1050),new THREE.Vector3(-160,0,0),new THREE.Vector3(-40,0,1020)],'local2');
for(let i=0;i<28;i++)spawnCar();
let economyT=0,carT=0;
export function simulate(dt){
  if(state.paused)return;
  const sdt=dt*state.speed;state.hour=(state.hour+sdt*.07)%24;economyT+=sdt;carT+=sdt;
  const bs0=buildingStats();
  simulateBuildings(sdt,{
    demand:state.demand,taxRates:state.taxRates,serviceScore:serviceScore(),educationScore:state.services.education,
    pollutionAt,noiseAt,jobsAccess:Math.min(1,.25+bs0.jobs/Math.max(100,bs0.population*.55)),
    populationFactor:Math.min(1,bs0.population/6000),freightAccess:.45
  });
  const bs=buildingStats();state.population=bs.population;state.jobs=bs.jobs;state.households=bs.households;state.averageLandValue=bs.avgLandValue;
  updateDemand(bs);
  if(economyT>.5){economyT=0;const rs=roadStats();const taxableRes=state.population*state.taxRates.res*.012,taxableCom=state.jobs*.46*state.taxRates.com*.016,taxableInd=state.jobs*.54*state.taxRates.ind*.018;const roadCost=rs.segments*9+rs.lanes*.35;const serviceCost=state.population*serviceScore()*.018;state.money+=(taxableRes+taxableCom+taxableInd-roadCost-serviceCost)*state.speed}
  if(carT>1.2){carT=0;if(cars.length<Math.min(160,28+Math.floor(state.population/45)))spawnCar()}
  for(const c of cars)updateCar(c,sdt)
}
