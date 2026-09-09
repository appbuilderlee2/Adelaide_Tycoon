import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
export {THREE};
export const WORLD=16000, HALF=WORLD/2, WATER_LEVEL=-18;
export const gameCanvas=document.getElementById('gameCanvas');
export const renderer=new THREE.WebGLRenderer({canvas:gameCanvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
export const scene=new THREE.Scene();scene.background=new THREE.Color(0xa8c6d2);scene.fog=new THREE.FogExp2(0xb8ced7,.000085);
export const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,2,40000);
export const cam={target:new THREE.Vector3(0,0,0),yaw:Math.PI*.25,pitch:THREE.MathUtils.degToRad(48),distance:1350};
export function terrainHeight(x,z){const coast=-.0028*x-8,hills=78*Math.sin(x/1150)*Math.cos(z/1420)+42*Math.sin((x+z)/620)+22*Math.cos(z/390),basin=-115*Math.exp(-((x+2800)**2+(z-1400)**2)/(2*1800**2)),plateau=110*Math.exp(-((x-3100)**2+(z+2200)**2)/(2*2100**2));return coast+hills+basin+plateau}
export function updateCamera(){const cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);camera.position.set(cam.target.x+Math.sin(cam.yaw)*cp*cam.distance,cam.target.y+sp*cam.distance,cam.target.z+Math.cos(cam.yaw)*cp*cam.distance);camera.lookAt(cam.target)}
scene.add(new THREE.HemisphereLight(0xe7f5ff,0x405347,1.55));
export const sun=new THREE.DirectionalLight(0xfff3d2,3.1);sun.position.set(-2200,3300,-1200);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-3000,right:3000,top:3000,bottom:-3000,near:100,far:9000});scene.add(sun);
const tg=new THREE.PlaneGeometry(WORLD,WORLD,256,256);tg.rotateX(-Math.PI/2);const pos=tg.attributes.position,cols=[];for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=terrainHeight(x,z);pos.setY(i,y);let c=y<WATER_LEVEL+4?new THREE.Color(0x6f8770):y<30?new THREE.Color(0x7f936f):y<105?new THREE.Color(0x738963):new THREE.Color(0x69795b);c.offsetHSL(0,0,(Math.sin(x*.021)+Math.cos(z*.017))*.015);cols.push(c.r,c.g,c.b)}pos.needsUpdate=true;tg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));tg.computeVertexNormals();
export const terrain=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.97}));terrain.receiveShadow=true;scene.add(terrain);
const water=new THREE.Mesh(new THREE.PlaneGeometry(WORLD*1.08,WORLD*1.08),new THREE.MeshPhysicalMaterial({color:0x4d91a7,transparent:true,opacity:.72,roughness:.18,metalness:.05,transmission:.08}));water.rotation.x=-Math.PI/2;water.position.y=WATER_LEVEL;scene.add(water);
const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.6,2.2,10,6),new THREE.MeshStandardMaterial({color:0x5b4732,roughness:1}),1100),crowns=new THREE.InstancedMesh(new THREE.ConeGeometry(7,18,7),new THREE.MeshStandardMaterial({color:0x355f3d,roughness:1}),1100),m=new THREE.Matrix4();for(let i=0;i<1100;i++){const x=(Math.random()-.5)*WORLD*.9,z=(Math.random()-.5)*WORLD*.9,y=terrainHeight(x,z),s=.7+Math.random()*1.2;m.makeScale(s,s,s);m.setPosition(x,y+5*s,z);trunks.setMatrixAt(i,m);m.makeScale(s,s,s);m.setPosition(x,y+16*s,z);crowns.setMatrixAt(i,m)}scene.add(trunks,crowns);
export const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();
export function screenToTerrain(x,y){ndc.x=x/innerWidth*2-1;ndc.y=-(y/innerHeight)*2+1;raycaster.setFromCamera(ndc,camera);return raycaster.intersectObject(terrain,false)[0]?.point.clone()||null}
export function updateSun(hour){const a=hour/24*Math.PI*2-Math.PI/2,e=Math.max(-.2,Math.sin(a));sun.position.set(Math.cos(a)*4200,500+Math.max(0,e)*3800,Math.sin(a)*2600);sun.intensity=.35+Math.max(0,e)*2.8;scene.background.setHSL(.55,.28,.22+Math.max(0,e)*.5);scene.fog.color.copy(scene.background)}
export function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();updateCamera();
