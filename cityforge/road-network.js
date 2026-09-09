import {THREE,scene,terrainHeight,WATER_LEVEL} from './engine.js';

export const ROAD_TYPES={
  local2:{id:'local2',label:'2 Lane Road',lanes:2,oneWay:false,width:12,speed:50,costPerM:42,color:0x353a3e},
  avenue4:{id:'avenue4',label:'4 Lane Avenue',lanes:4,oneWay:false,width:19,speed:60,costPerM:68,color:0x32373b},
  arterial6:{id:'arterial6',label:'6 Lane Boulevard',lanes:6,oneWay:false,width:27,speed:70,costPerM:96,color:0x303539},
  one2:{id:'one2',label:'2 Lane One-way',lanes:2,oneWay:true,width:11,speed:60,costPerM:48,color:0x34393d},
  highway4:{id:'highway4',label:'4 Lane Highway',lanes:4,oneWay:true,width:16,speed:100,costPerM:110,color:0x292e32}
};
export let activeRoadType='local2';
export function setRoadType(id){if(ROAD_TYPES[id])activeRoadType=id}
export function getRoadType(){return ROAD_TYPES[activeRoadType]}

export const nodes=[];
export const segments=[];
export const roadSamples=[];
export const lanes=[];
let nextNodeId=1,nextSegmentId=1,nextLaneId=1;
const asphaltMats=new Map();
const previewGood=new THREE.MeshBasicMaterial({color:0x58cfff,transparent:true,opacity:.58,depthWrite:false});
const previewBad=new THREE.MeshBasicMaterial({color:0xff6b61,transparent:true,opacity:.62,depthWrite:false});
const laneMarkMat=new THREE.LineDashedMaterial({color:0xe7e6d7,dashSize:6,gapSize:7,transparent:true,opacity:.7});
const nodeMat=new THREE.MeshStandardMaterial({color:0x3c4246,roughness:.9});

function asphalt(type){if(!asphaltMats.has(type.id))asphaltMats.set(type.id,new THREE.MeshStandardMaterial({color:type.color,roughness:.93}));return asphaltMats.get(type.id)}
function terrainPoint(p,lift=0.85){return new THREE.Vector3(p.x,terrainHeight(p.x,p.z)+lift,p.z)}
function tangent(curve,t){const a=curve.getPointAt(Math.max(0,t-.002)),b=curve.getPointAt(Math.min(1,t+.002));return b.sub(a).setY(0).normalize()}
function offsetPoint(curve,t,offset,lift=1.3){const p=curve.getPointAt(t),tg=tangent(curve,t),side=new THREE.Vector3(-tg.z,0,tg.x).multiplyScalar(offset);p.x+=side.x;p.z+=side.z;p.y=terrainHeight(p.x,p.z)+lift;return p}

export function ribbon(curve,width,mat,lift=.85){
  const segs=Math.max(10,Math.ceil(curve.getLength()/12)),pts=curve.getPoints(segs),v=[],idx=[];
  for(let i=0;i<pts.length;i++){
    const p=pts[i],p0=pts[Math.max(0,i-1)],p1=pts[Math.min(pts.length-1,i+1)],tg=p1.clone().sub(p0).setY(0).normalize(),side=new THREE.Vector3(-tg.z,0,tg.x).multiplyScalar(width/2);
    const l=p.clone().add(side),r=p.clone().sub(side);l.y=terrainHeight(l.x,l.z)+lift;r.y=terrainHeight(r.x,r.z)+lift;v.push(l.x,l.y,l.z,r.x,r.y,r.z);
    if(i<pts.length-1){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c)}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,mat);mesh.castShadow=mesh.receiveShadow=true;return mesh;
}

export function findNearestNode(point,maxDist=38){let best=null,dist=maxDist;for(const n of nodes){const d=Math.hypot(n.position.x-point.x,n.position.z-point.z);if(d<dist){dist=d;best=n}}return best}
export function snapPoint(point,maxDist=38){const n=findNearestNode(point,maxDist);if(n)return {point:n.position.clone(),node:n,snapped:true};return {point:point.clone(),node:null,snapped:false}}

function maxSlopePct(curve){const pts=curve.getPoints(Math.max(10,Math.ceil(curve.getLength()/20)));let max=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dy=Math.abs(terrainHeight(b.x,b.z)-terrainHeight(a.x,a.z)),dx=Math.max(1,Math.hypot(b.x-a.x,b.z-a.z));max=Math.max(max,dy/dx*100)}return max}
function tooCloseToExisting(curve,width,startNode,endNode){const pts=curve.getPoints(Math.max(10,Math.ceil(curve.getLength()/20)));for(let i=2;i<pts.length-2;i++){const p=pts[i];for(const s of roadSamples){if((startNode&&s.nodeId===startNode.id)||(endNode&&s.nodeId===endNode.id))continue;if(Math.hypot(p.x-s.x,p.z-s.z)<Math.max(5,width*.34))return true}}return false}
function validate(points,type,startNode=null,endNode=null){
  if(points.length<3)return {ok:false,reason:'Need start, control and end points'};
  const curve=new THREE.CatmullRomCurve3(points,false,'centripetal',.45),len=curve.getLength();
  if(len<20)return {ok:false,reason:'Road is too short'};
  const slope=maxSlopePct(curve);if(slope>14)return {ok:false,reason:`Slope ${slope.toFixed(1)}% exceeds 14%`};
  for(const p of curve.getPoints(12))if(terrainHeight(p.x,p.z)<WATER_LEVEL+1)return {ok:false,reason:'Road cannot be built through water'};
  if(tooCloseToExisting(curve,type.width,startNode,endNode))return {ok:false,reason:'Road overlaps existing road'};
  return {ok:true,curve,len,slope};
}

function makeNode(position){const n={id:nextNodeId++,position:terrainPoint(position,1.05),segments:new Set(),mesh:null};const g=new THREE.CylinderGeometry(8,8,1.3,18),m=new THREE.Mesh(g,nodeMat);m.position.copy(n.position);m.position.y-=.25;m.receiveShadow=true;scene.add(m);n.mesh=m;nodes.push(n);return n}
function getOrCreateNode(position,existing){return existing||makeNode(position)}
function refreshNodeVisual(n){const degree=n.segments.size,r=degree>=3?13:degree===2?9:7;n.mesh.geometry.dispose();n.mesh.geometry=new THREE.CylinderGeometry(r,r,1.5,24)}
function addLane(segment,offset,direction,index){const curve=segment.curve;const lane={id:nextLaneId++,segmentId:segment.id,index,offset,direction,curve,length:segment.length,speedKph:segment.type.speed};lanes.push(lane);segment.lanes.push(lane);return lane}
function buildLanes(segment){const t=segment.type,laneW=3.35,count=t.lanes;segment.lanes=[];if(t.oneWay){for(let i=0;i<count;i++){const off=(i-(count-1)/2)*laneW;addLane(segment,off,1,i)}}else{const perDir=count/2;for(let i=0;i<perDir;i++){const off=(i+.5)*laneW;addLane(segment,off,1,i);addLane(segment,-off,-1,i+perDir)}}}
function addMarkings(segment){const t=segment.type,marks=[];if(t.lanes<=2&&!t.oneWay){const pts=[];const n=Math.max(12,Math.ceil(segment.length/8));for(let i=0;i<=n;i++)pts.push(offsetPoint(segment.curve,i/n,0,1.6));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),laneMarkMat.clone());line.computeLineDistances();scene.add(line);marks.push(line)}else{const divs=t.lanes-1;for(let j=1;j<=divs;j++){const offset=-t.width/2+j*(t.width/t.lanes);const pts=[];const n=Math.max(12,Math.ceil(segment.length/8));for(let i=0;i<=n;i++)pts.push(offsetPoint(segment.curve,i/n,offset,1.55));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),laneMarkMat.clone());line.computeLineDistances();scene.add(line);marks.push(line)}}segment.markings=marks}

export function previewRoad(points,typeId=activeRoadType){
  const type=ROAD_TYPES[typeId],a=snapPoint(points[0]),b=snapPoint(points[points.length-1]),pts=points.map(p=>p.clone());pts[0]=a.point;pts[pts.length-1]=b.point;
  const val=validate(pts,type,a.node,b.node);const curve=val.curve||new THREE.CatmullRomCurve3(pts,false,'centripetal',.45);const mesh=ribbon(curve,type.width,val.ok?previewGood:previewBad,1.8);mesh.userData.validation=val;mesh.userData.snapStart=a.snapped;mesh.userData.snapEnd=b.snapped;return mesh;
}

export function makeRoad(points,budget,typeId=activeRoadType){
  const type=ROAD_TYPES[typeId],a=snapPoint(points[0]),b=snapPoint(points[points.length-1]),pts=points.map(p=>p.clone());pts[0]=a.point;pts[pts.length-1]=b.point;
  const val=validate(pts,type,a.node,b.node);if(!val.ok)return {ok:false,reason:val.reason};const cost=Math.round(val.len*type.costPerM);if(budget<cost)return {ok:false,reason:'Not enough budget'};
  const start=getOrCreateNode(pts[0],a.node),end=getOrCreateNode(pts[pts.length-1],b.node),mesh=ribbon(val.curve,type.width,asphalt(type));scene.add(mesh);
  const segment={id:nextSegmentId++,type,curve:val.curve,length:val.len,cost,startNode:start,endNode:end,mesh,lanes:[],markings:[]};segments.push(segment);start.segments.add(segment.id);end.segments.add(segment.id);refreshNodeVisual(start);refreshNodeVisual(end);buildLanes(segment);addMarkings(segment);
  const samples=val.curve.getPoints(Math.max(8,Math.ceil(val.len/24)));samples.forEach((p,i)=>roadSamples.push({x:p.x,z:p.z,segmentId:segment.id,nodeId:i===0?start.id:i===samples.length-1?end.id:null}));
  return {ok:true,cost,len:val.len,slope:val.slope,segment};
}

export function lanePoint(lane,t){const seg=segments.find(s=>s.id===lane.segmentId);if(!seg)return new THREE.Vector3();const tt=lane.direction===1?t:1-t;return offsetPoint(seg.curve,THREE.MathUtils.clamp(tt,0,1),lane.offset,2.2)}
export function laneTangent(lane,t){const seg=segments.find(s=>s.id===lane.segmentId);if(!seg)return new THREE.Vector3(0,0,1);const tt=lane.direction===1?t:1-t,tg=tangent(seg.curve,tt);return lane.direction===1?tg:tg.multiplyScalar(-1)}
export function randomLane(){return lanes.length?lanes[(Math.random()*lanes.length)|0]:null}
export function roadStats(){return {nodes:nodes.length,segments:segments.length,lanes:lanes.length}}
