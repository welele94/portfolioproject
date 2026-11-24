import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Primeiro protótipo do campus: volumes, caminhos e orientação.
// Escala de referência: 1 unidade = 1 metro virtual. Norte = Z negativo.
// A vista orbital atual não é first-person. A altura dos olhos será usada na FPV.
const HUMAN = Object.freeze({
  height: 1.75, eyeHeight: 1.68,
  doorHeight: 2.15, doorWidth: 1.20,
  seatHeight: .45, seatDepth: .43, benchLength: 1.60,
  fountainRimHeight: .50
});
const canvas = document.querySelector('#world');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9d4e8');
scene.fog = new THREE.Fog('#b9d4e8', 105, 175);
const camera = new THREE.PerspectiveCamera(48, 1, .1, 220);
camera.position.set(46, 68, 78);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.55;

scene.add(new THREE.HemisphereLight(0xe9f3ff, 0x6e8057, 2.0));
const sun = new THREE.DirectionalLight(0xffeed3, 2.7);
sun.position.set(-35, 66, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
sun.shadow.normalBias = .025;
scene.add(sun);

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .83, ...extra });
const ground = mat('#6b9657'), pavement = mat('#d0bc9a'), road = mat('#545c63');
const building = mat('#c9cdd0'), windowMat = mat('#779ba8', { metalness: .15, roughness: .24 });
const roofMat = mat('#707983'), dark = mat('#3c4b59'), white = mat('#f0e6ce');
const water = mat('#64bce5', { metalness: .2, roughness: .15 }), trunk = mat('#70523b'), leaves = [mat('#4d8955'), mat('#66a368'), mat('#387349')];
const blue = mat('#276eae', { emissive: '#124477', emissiveIntensity: .22 });
const plants = mat('#4e874a');

function block(w,h,d,x,y,z,material,parent=scene,shadow=true) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
  o.position.set(x,y,z); o.castShadow=shadow; o.receiveShadow=true; parent.add(o); return o;
}
function plane(w,d,x,z,material,y=.015){ return block(w,.05,d,x,y,z,material,scene,false); }
function label(text,x,y,z,width=14) {
  const c=document.createElement('canvas');c.width=1024;c.height=256;
  const ctx=c.getContext('2d'); ctx.fillStyle='#15232bea';ctx.fillRect(0,0,1024,256);
  ctx.fillStyle='#ffffff';ctx.font='bold 76px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(text,512,128,970);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const o=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  o.position.set(x,y,z);o.rotation.x=-Math.PI/2;scene.add(o);
}
function windows(x,z,w,d,height,floors=2){
  for(let f=0;f<floors;f++){
    const y=1.25+f*(height-1.2)/floors;
    for(let i=-w/2+1.5;i<w/2-1;i+=2.5){
      block(1.15,1.1,.08,x+i,y,z+d/2+.055,windowMat,scene,false);
      block(1.15,1.1,.08,x+i,y,z-d/2-.055,windowMat,scene,false);
    }
  }
}
function structure(name,x,z,w,d,h,accent=roofMat,floors=2){
  block(w,h,d,x,h/2,z,building);
  block(w+.7,.45,d+.7,x,h+.24,z,accent);
  // Porta com altura humana: ainda não é um vão real transitável.
  block(HUMAN.doorWidth,HUMAN.doorHeight,.14,x,HUMAN.doorHeight/2,z+d/2+.13,dark,scene,false);
  windows(x,z,w,d,h,floors);
  label(name,x,h+.55,z,w*.85);
}
function tree(x,z,scale=1) {
  // Árvore estilizada ~4 m no tamanho 1.
  const trunkHeight=1.9*scale, canopyRadius=1.1*scale;
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.13*scale,.24*scale,trunkHeight,7),trunk);
  c.position.set(x,trunkHeight/2,z);c.castShadow=true;scene.add(c);
  const canopy=new THREE.Mesh(new THREE.IcosahedronGeometry(canopyRadius,1),leaves[Math.floor((Math.abs(x*13+z*17))%leaves.length)]);
  canopy.position.set(x,trunkHeight+canopyRadius*.85,z);canopy.castShadow=true;scene.add(canopy);
}
function billboard(title,x,z) {
  // Base do painel a 2.2 m, para não obstruir a linha dos olhos.
  block(.12,3.3,.12,x,1.65,z,dark);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const context=canvas.getContext('2d');context.fillStyle='#192b43';context.fillRect(0,0,512,256);
  context.strokeStyle='#6dc9ff';context.lineWidth=12;context.strokeRect(8,8,496,240);
  context.fillStyle='#ffffff';context.font='bold 40px system-ui';context.textAlign='center';context.textBaseline='middle';
  context.fillText(title,256,128,470);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(4.5,2.0),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
  sign.position.set(x,3.2,z);scene.add(sign);
}
// Terreno vertical, 64 m de largura por 96 m de comprimento.
plane(64,96,0,0,ground,0);
plane(64,3.5,0,45,road,.06);
plane(64,3.5,0,-45,road,.06);
plane(3.8,92,-30,0,road,.06);
plane(3.8,92,30,0,road,.06);
// Caminhos: Casa (sudoeste) -> jardim -> Projetos (nordeste).
plane(5,74,0,0,pavement,.08);
plane(50,5,0,-5,pavement,.085);
plane(50,5,0,24,pavement,.085);
plane(5,31,17,-10,pavement,.085);
plane(5,31,-17,8,pavement,.085);

// Jardim central, fonte e bancos.
plane(32,28,0,13,plants,.09);
// Fonte: diâmetro 5 m; borda a 0.50 m, água pouco abaixo.
const fountainBase=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.55,HUMAN.fountainRimHeight,32),white);
fountainBase.position.set(0,HUMAN.fountainRimHeight/2,15);fountainBase.castShadow=true;scene.add(fountainBase);
const fountainWater=new THREE.Mesh(new THREE.CylinderGeometry(2.12,2.12,.05,32),water);
fountainWater.position.set(0,HUMAN.fountainRimHeight-.07,15);scene.add(fountainWater);
const fountainJet=new THREE.Mesh(new THREE.CylinderGeometry(.08,.15,1.10,12),water);
fountainJet.position.set(0,HUMAN.fountainRimHeight+.49,15);scene.add(fountainJet);
for(const [x,z] of [[-12,5],[-9,19],[11,7],[10,22],[-6,28],[7,30]]) tree(x,z,.85);
// Bancos: assento a 45 cm (antes ~81 cm), 1.60 x 0.43 m.
const benchWood=mat('#846348');
for(const [x,z] of [[-6,8],[7,8],[-7,25],[7,25]]) {
  const seatThickness=.10;
  block(HUMAN.benchLength,seatThickness,HUMAN.seatDepth,x,HUMAN.seatHeight-seatThickness/2,z,benchWood);
  for(const side of [-1,1]) block(.09,HUMAN.seatHeight-seatThickness,.09,x+side*.61,(HUMAN.seatHeight-seatThickness)/2,z,trunk);
  const back=block(HUMAN.benchLength,.35,.08,x,.65,z-HUMAN.seatDepth/2+.04,benchWood);
  back.rotation.x=-.12;
}

// Casa: três edifícios unidos na zona inferior esquerda, ponto inicial.
for(const [i,x] of [-1,0,1].map((i)=>[i,-19+i*6.4])){
  block(6.2,7.4,12,x,3.7,34,mat(['#c5b4a3','#b7c8c1','#d0b3a8'][i+1]));
  block(6.3,.55,12.3,x,7.7,34,mat('#995b4b'));
  block(HUMAN.doorWidth,HUMAN.doorHeight,.14,x,HUMAN.doorHeight/2,40.08,dark,scene,false);
}
label('CASA',-19,8.4,34,14);

// Centro Tecnológico / Projetos: lado direito, destino principal.
structure('PROJETOS',20,-8,17,20,9,blue,3);
block(15,.45,1.1,20,5.2,2.6,blue);
billboard('Geneva Drive',8,-5);
billboard('Help! App',8,6);
billboard('One more thing...',8,28);

// UAb: inferior direita.
structure('UAb',20,34,16,13,7,roofMat,2);
// Dachser: topo, mais distante e opcional.
structure('DACHSER',0,-33,24,13,8,dark,2);
// Blocos residenciais à esquerda e ao topo direito.
structure('APARTAMENTOS',-20,-11,12,21,11,roofMat,4);
structure('APARTAMENTOS',21,-34,14,12,11,roofMat,4);
// Árvores periféricas.
for(let z=-41;z<=41;z+=8){ tree(-27,z,.85); if(z>20||z< -22)tree(27,z,.85); }
for(let x=-25;x<=25;x+=8)tree(x,-41,.9);

// Referência de escala: H mostra/esconde silhueta de 1.75 m no jardim.
const humanReference=new THREE.Group();
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.23,1.29,5,10),mat('#e59b32'));
body.position.y=HUMAN.height/2;humanReference.add(body);
const eyes=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),mat('#1f3b60'));
eyes.position.y=HUMAN.eyeHeight;humanReference.add(eyes);
humanReference.position.set(-5,0,12);humanReference.visible=false;scene.add(humanReference);
window.addEventListener('keydown',event=>{
  if(event.code==='KeyH' && !event.repeat) humanReference.visible=!humanReference.visible;
});

const controls=new OrbitControls(camera,canvas);
controls.target.set(0,0,0); controls.enableDamping=true;
controls.maxPolarAngle=Math.PI/2.03;
controls.minDistance=18;controls.maxDistance=145;
controls.update();
function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(canvas);resize();
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
