import {THREE,renderer,scene,camera,updateCamera,updateSun} from './engine.js';
import {state,simulate} from './city.js';
import {drawHUD,updateInput} from './ui.js';
const clock=new THREE.Clock();
function frame(){const dt=Math.min(.05,clock.getDelta());updateInput(dt);simulate(dt);updateSun(state.hour);updateCamera();renderer.render(scene,camera);drawHUD();requestAnimationFrame(frame)}
frame();
