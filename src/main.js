import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createAvatar} from './avatar.js';
const canvas=document.querySelector('#avatar-canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.set(3.2,2.2,5.3);
scene.add(new THREE.HemisphereLight(0xd9edff,0x243248,2.2));
const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,7,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);
const floor=new THREE.Mesh(new THREE.CircleGeometry(1.5,64),new THREE.MeshStandardMaterial({color:0x26394e,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;scene.add(floor);
const {group,update}=createAvatar();scene.add(group);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,1.15,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=9;controls.maxPolarAngle=Math.PI/2;controls.update();
let mode='idle';document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.action;document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}));
document.querySelector('#reset').addEventListener('click',()=>{camera.position.set(3.2,2.2,5.3);controls.target.set(0,1.15,0);controls.update()});
function resize(){const {width,height}=canvas.getBoundingClientRect();const w=Math.max(1,Math.round(width)),h=Math.max(1,Math.round(height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(canvas);resize();
const clock=new THREE.Clock();let elapsed=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(!reduced||mode!=='idle')elapsed+=dt;update(elapsed,mode);controls.update();renderer.render(scene,camera)});
