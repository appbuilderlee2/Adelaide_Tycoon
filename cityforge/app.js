import {THREE,renderer,scene,camera,updateCamera,updateSun} from './engine.js?v=road2';
import {state,simulate} from './city.js?v=road2';
import {drawHUD,updateInput} from './ui.js?v=road2';
const clock=new THREE.Clock();
function frame(){const dt=Math.min(.05,clock.getDelta());updateInput(dt);simulate(dt);updateSun(state.hour);updateCamera();renderer.render(scene,camera);drawHUD();requestAnimationFrame(frame)}
frame();
