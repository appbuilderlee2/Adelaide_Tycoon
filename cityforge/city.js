import {THREE,scene,terrainHeight,WATER_LEVEL} from './engine.js';
import {makeRoad as buildRoad,previewRoad as roadPreview,roadSamples,randomLane,lanePoint,laneTangent,roadStats,ROAD_TYPES,setRoadType,getRoadType} from './road-network.js';

export {ROAD_TYPES,setRoadType,getRoadType,roadStats};
export const state={money:1250000,population:0,jobs:0,hour:8,speed:1,paused:false};
export const zones=[],buildings=[],cars=[];const zoneSet=new Map();
export function previewRoad(points,typeId){return roadPreview(points,typeId)}
export function makeRoad(points,typeId){const res=buildRoad(points,state.money,typeId);if(res.ok)state.money-=res.cost;return res}

const mats={res:[0xd7c9b5,0xc1d3d8,0xe3d7c8,0xb9c9b6],com:[0x8fa8b4,0xa7b5c4,0xc2b8a8],ind:[0x8e8c83,0x9d957f,0x797d78]};for(const k in mats)mats[k]=mats[k].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:k==='com'?.52:.8,metalness:k==='com'?.08:0}));
function nearRoad(x,z,max=68){let best=Infinity;for(const p of roadSamples)best=Math.min(best,(p.x-x)**2+(p.z-z)**2);return Math.sqrt(best)<=max}
const key=(x,z)=>`${Math.round(x/32)},${Math.round(z/32)}`;
export function paintZone(type,x,z){const gx=Math.round(x/32)*32,gz=Math.round(z/32)*32,k=key(gx,gz);if(zoneSet.has(k))return;const y=terrainHeight(gx,gz)+1.2;if(y<WATER_LEVEL+2)return;const color={res:0x4ec66b,com:0x4f8fe8,ind:0xe0b34f}[type],g=new THREE.PlaneGeometry(29,29);g.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.38,depthWrite:false}));mesh.position.set(gx,y,gz);scene.add(mesh);const zt={type,x:gx,z:gz,mesh,built:false};zones.push(zt);zoneSet.set(k,zt)}
function grow(zt){if(!nearRoad(zt.x,zt.z))return false;let w=20,d=20,h=22;if(zt.type==='res'){h=18+Math.random()*55;w=d=18+Math.random()*10}if(zt.type==='com'){h=28+Math.random()*92;w=d=22+Math.random()*14}if(zt.type==='ind'){h=13+Math.random()*18;w=26+Math.random()*14;d=28+Math.random()*18}const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats[zt.type][(Math.random()*mats[zt.type].length)|0]);mesh.position.set(zt.x,terrainHeight(zt.x,zt.z)+h/2+.8,zt.z);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);zt.mesh.visible=false;zt.built=true;const b={type:zt.type,mesh,pop:0,jobs:0};if(zt.type==='res')b.pop=Math.round(8+h*.9);if(zt.type==='com')b.jobs=Math.round(8+h*.65);if(zt.type==='ind')b.jobs=Math.round(10+w*d/95);buildings.push(b);state.population+=b.pop;state.jobs+=b.jobs;return true}
export function bulldoze(x,z,r=28){let best=null,bd=Infinity;for(const b of buildings){const d=Math.hypot(b.mesh.position.x-x,b.mesh.position.z-z);if(d<bd){bd=d;best=b}}if(best&&bd<r){scene.remove(best.mesh);state.population-=best.pop;state.jobs-=best.jobs;buildings.splice(buildings.indexOf(best),1);return}for(const zt of zones){if(Math.hypot(zt.x-x,zt.z-z)<r){scene.remove(zt.mesh);zoneSet.delete(key(zt.x,zt.z));zones.splice(zones.indexOf(zt),1);return}}}

function spawnCar(){if(cars.length>140)return;const lane=randomLane();if(!lane)return;const mesh=new THREE.Mesh(new THREE.BoxGeometry(4.1,2.0,8.2),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(Math.random(),.55,.48),roughness:.45,metalness:.15}));mesh.castShadow=true;scene.add(mesh);cars.push({mesh,lane,t:Math.random(),speedMps:(lane.speedKph/3.6)*(.72+Math.random()*.25)})}
function updateCar(c,dt){const len=Math.max(1,c.lane.length),ahead=cars.find(o=>o!==c&&o.lane.id===c.lane.id&&o.t>c.t&&o.t-c.t<22/len);const factor=ahead?Math.max(.05,Math.min(1,(ahead.t-c.t)*len/18)):1;c.t+=c.speedMps*factor*dt/len;if(c.t>=1){const lane=randomLane();if(lane){c.lane=lane;c.t=0}else c.t=0}const p=lanePoint(c.lane,c.t),tg=laneTangent(c.lane,c.t);c.mesh.position.copy(p);c.mesh.rotation.y=Math.atan2(tg.x,tg.z)}

makeRoad([new THREE.Vector3(-1150,0,-280),new THREE.Vector3(0,0,-120),new THREE.Vector3(1180,0,80)],'avenue4');
makeRoad([new THREE.Vector3(-340,0,-1050),new THREE.Vector3(-160,0,0),new THREE.Vector3(-40,0,1020)],'local2');
for(let i=0;i<28;i++)spawnCar();let growT=0,carT=0;
export function simulate(dt){if(state.paused)return;const sdt=dt*state.speed;state.hour=(state.hour+sdt*.07)%24;growT+=sdt;carT+=sdt;const rs=roadStats();state.money+=sdt*(state.population*.035+state.jobs*.012-rs.segments*7.5-rs.lanes*.28);if(growT>.7){growT=0;for(const z of zones)if(!z.built&&Math.random()<.07*state.speed){grow(z);break}}if(carT>1.2){carT=0;spawnCar()}for(const c of cars)updateCar(c,sdt)}
