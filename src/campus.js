import * as THREE from 'three';
import { dutchFacade, dutchRow } from './architecture.js';
import { exteriorMaterial, metricBox, metricCylinder, organicGrass } from './materials.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createNavigation } from './navigation.js';
import { createProjectsHall } from './projects-hall.js';
import { createInteriors } from './interiors.js';

// Primeiro protótipo do campus: volumes, caminhos e orientação.
// Escala de referência: 1 unidade = 1 metro virtual. Norte = Z negativo.
// A vista aérea serve para depuração; a navegação FPV é implementada em navigation.js.
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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate=false;
renderer.shadowMap.needsUpdate=true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.55;

scene.add(new THREE.HemisphereLight(0xe9f3ff, 0x6e8057, 2.0));
const sun = new THREE.DirectionalLight(0xffeed3, 2.7);
sun.position.set(-35, 66, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 115;
sun.shadow.camera.bottom = -115;
sun.shadow.normalBias = .025;
scene.add(sun);

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .83, ...extra });
const ground = organicGrass(), pavement = exteriorMaterial('pavement','#ded1b9'), road = exteriorMaterial('asphalt','#666c72');
const building = exteriorMaterial('plaster','#e0e0df'), windowMat = mat('#779ba8', { metalness: .15, roughness: .24 });
const roofMat = exteriorMaterial('metal','#858b92'), dark = mat('#3c4b59'), white = mat('#f0e6ce');
const water = mat('#64bce5', { metalness: .2, roughness: .15 }), trunk = exteriorMaterial('bark','#87684a'), leaves = [exteriorMaterial('foliage','#5e9b56'),exteriorMaterial('foliage','#78ac65'),exteriorMaterial('foliage','#4c804b')];
const blue = mat('#276eae', { emissive: '#124477', emissiveIntensity: .22 });

// Obstáculos simplificados em coordenadas do mundo (XZ).
const obstacles = [];
const addBoxObstacle=(x,z,w,d)=>obstacles.push({type:'box',x,z,w,d});
const addCircleObstacle=(x,z,r)=>obstacles.push({type:'circle',x,z,r});

function block(w,h,d,x,y,z,material,parent=scene,shadow=true) {
  const o = new THREE.Mesh(metricBox(w,h,d,material), material);
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
  addBoxObstacle(x,z,w,d);
  block(w,h,d,x,h/2,z,building);
  block(w+.7,.45,d+.7,x,h+.24,z,accent);
  // Porta com altura humana: ainda não é um vão real transitável.
  block(HUMAN.doorWidth,HUMAN.doorHeight,.14,x,HUMAN.doorHeight/2,z+d/2+.13,dark,scene,false);
  windows(x,z,w,d,h,floors);
  label(name,x,h+.55,z,w*.85);
}
function tree(x,z,scale=1) {
  // Colisão apenas com o tronco, não com toda a copa.
  addCircleObstacle(x,z,.31*scale);
  // Árvores de parque: ~6 m de altura para escala 1, sem copa ao nível dos olhos.
  const trunkHeight=3.25*scale, canopyRadius=1.55*scale;
  const c=new THREE.Mesh(metricCylinder(new THREE.CylinderGeometry(.19*scale,.29*scale,trunkHeight,12),trunk,.24*scale,trunkHeight),trunk);
  c.position.set(x,trunkHeight/2,z);c.castShadow=true;scene.add(c);
  const canopy=new THREE.Mesh(new THREE.IcosahedronGeometry(canopyRadius,2),leaves[Math.floor((Math.abs(x*13+z*17))%leaves.length)]);
  canopy.position.set(x,trunkHeight+canopyRadius*.85,z);canopy.castShadow=true;scene.add(canopy);
}
function billboard(title,x,z) {
  addCircleObstacle(x,z,.14);
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
plane(64,146,0,-25,ground,0);
plane(64,3.5,0,45,road,.06);
plane(64,5.5,0,-94,road,.06);
plane(5.5,139,-29,-24,road,.06);
plane(5.5,139,29,-24,road,.06);
// Marcações discretas no eixo das estradas periféricas.
const roadPaint=mat('#d6d5ca');
for(let x=-28;x<=28;x+=6)for(const z of [-94,45])plane(2.2,.09,x,z,roadPaint,.091);
for(let z=-90;z<=36;z+=6)for(const x of [-29,29])plane(.09,2.2,x,z,roadPaint,.091);
// Rede pedonal orgânica: curvas suaves, praça central e acessos por destino.
const pedestrianAreas=[];
function pathDistance(x,z,p){
  if(p.type==='circle')return Math.hypot(x-p.x,z-p.z)-p.r;
  const dx=p.bx-p.ax,dz=p.bz-p.az,l=dx*dx+dz*dz;
  const t=l?Math.max(0,Math.min(1,((x-p.ax)*dx+(z-p.az)*dz)/l)):0;
  return Math.hypot(x-p.ax-t*dx,z-p.az-t*dz)-p.r;
}
function pavedCircle(x,z,r){
  pedestrianAreas.push({type:'circle',x,z,r});
  const g=new THREE.CircleGeometry(r,64);
  const uv=g.attributes.uv;
  for(let j=0;j<uv.count;j++)uv.setXY(j,(g.attributes.position.getX(j)+x)/2,(z-g.attributes.position.getY(j))/2);
  const mesh=new THREE.Mesh(g,pavement);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.150,z);mesh.receiveShadow=true;scene.add(mesh);
}
function walkCurve(points,width=3){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
  const samples=curve.getPoints(Math.max(8,Math.ceil(curve.getLength()/0.65)));
  const positions=[],uv=[],indices=[];
  for(let j=0;j<samples.length;j++){
    const p=samples[j],prev=samples[Math.max(0,j-1)],next=samples[Math.min(samples.length-1,j+1)];
    const dx=next.x-prev.x,dz=next.z-prev.z,len=Math.hypot(dx,dz)||1;
    for(const side of [-1,1]){
      const x=p.x+side*(-dz/len)*width/2,z=p.z+side*(dx/len)*width/2;
      positions.push(x,.149,z);uv.push(x/2,z/2);
    }
    if(j){
      const k=2*j;indices.push(k-2,k-1,k,k-1,k+1,k);
      pedestrianAreas.push({type:'segment',ax:prev.x,az:prev.z,bx:p.x,bz:p.z,r:width/2});
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
  // Corrigir orientação das faces para cima.
  if(geo.attributes.normal.getY(0)<0){for(let j=0;j<indices.length;j+=3)[indices[j+1],indices[j+2]]=[indices[j+2],indices[j+1]];geo.setIndex(indices);geo.computeVertexNormals();}
  const mesh=new THREE.Mesh(geo,pavement);mesh.receiveShadow=true;scene.add(mesh);
  for(const p of [samples[0],samples[samples.length-1]])pavedCircle(p.x,p.z,width/2);
}
function walk(x1,z1,x2,z2,width=3){walkCurve([[x1,z1],[x2,z2]],width);}
// Passeio sul contínuo e acessos às entradas reais.
walk(-25.4,42,20,42,3);
for(const x of [-25.4,-19,-12.6])walk(x,40,x,42,2.4);
walk(20,40.5,20,42,2.4);
// Eixo principal: saída da Casa, praça e porta dos Projetos.
walkCurve([[-9,42],[-8.5,31],[-6,23],[-3.4,18.3]],3.2);
pavedCircle(0,15,5.6);
walkCurve([[3.5,11.8],[7.8,7.3],[13.2,5.2],[20,5],[20,2.4]],3.2);
// Acesso à UAb pelo corredor livre entre os edifícios.
walkCurve([[4.2,18.4],[8.5,24],[9.2,32],[9.8,42]],2.2);
// Apartamentos ocidentais e ligação pedonal norte.
// Rua residencial à frente da nova fachada, entre prédio e jardim.
const residentialRoad={x:-10.4,z:-2.5,w:4.6,d:47};
plane(residentialRoad.w,residentialRoad.d,residentialRoad.x,residentialRoad.z,road,.075);
for(let z=-23;z<20;z+=5)plane(.075,1.7,-10.4,z,roadPaint,.106);
// Passeios de ambos os lados, fora da faixa de rodagem.
walk(-13.7,-26,-13.7,21,1.7);
walk(-7.15,-26,-7.15,21,1.5);
// Ligações aos extremos da rua e à praça, sem pavimento sobre o asfalto.
walkCurve([[-4.8,13],[-6.2,14],[-7.15,14]],2.0);
for(let k=0;k<5;k++)plane(4.5,.23,-10.4,13.4+k*.36,roadPaint,.112);
for(let k=0;k<5;k++)plane(4.5,.23,-10.4,-25.5+k*.36,roadPaint,.112);
walkCurve([[-7.15,-25],[0,-25]],2.1);
// Ramais rodoviários transversais nas extremidades, ligados à avenida exterior.
plane(19.2,4.6,-19.7,23.5,road,.075);
plane(4.6,4.6,-10.4,21.5,road,.075);
for(let k=0;k<5;k++)plane(.23,4.5,-9.6+k*.36,23.5,roadPaint,.112);
walk(0,10,0,-41.6,3.0);
walk(0,-41.6,18,-41.6,2.0);
walk(18,-41.6,18,-43,2.0);
// Novos apartamentos em banda, orientados no eixo horizontal.
walkCurve([[-13.7,-26],[-15,-26.3],[-15,-27]],1.8);
// Apartamentos orientais: passagem a sul do edifício.
walkCurve([[0,-23],[8,-23],[15,-24],[21,-25],[21,-28]],2.3);
// Fonte: diâmetro 5 m; borda a 0.50 m, água pouco abaixo.
addCircleObstacle(0,15,2.55);
const fountainBase=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.55,HUMAN.fountainRimHeight,32),white);
fountainBase.position.set(0,HUMAN.fountainRimHeight/2,15);fountainBase.castShadow=true;scene.add(fountainBase);
const fountainWater=new THREE.Mesh(new THREE.CylinderGeometry(2.12,2.12,.05,32),water);
fountainWater.position.set(0,HUMAN.fountainRimHeight-.07,15);scene.add(fountainWater);
const fountainJet=new THREE.Mesh(new THREE.CylinderGeometry(.08,.15,1.10,12),water);
fountainJet.position.set(0,HUMAN.fountainRimHeight+.49,15);scene.add(fountainJet);
for(const [x,z] of [[-5,8],[-4.5,22],[12,11],[15,19],[-5,30],[5,30]]) tree(x,z,.85);
// Bancos: assento a 45 cm (antes ~81 cm), 1.60 x 0.43 m.
const benchWood=exteriorMaterial('wood','#a1805d');
for(const [x,z] of [[-3.7,14],[3.7,16],[0,19.5],[-5,27]]) {
  addBoxObstacle(x,z,HUMAN.benchLength,HUMAN.seatDepth);
  const seatThickness=.10;
  block(HUMAN.benchLength,seatThickness,HUMAN.seatDepth,x,HUMAN.seatHeight-seatThickness/2,z,benchWood);
  for(const side of [-1,1]) block(.09,HUMAN.seatHeight-seatThickness,.09,x+side*.61,(HUMAN.seatHeight-seatThickness)/2,z,trunk);
  const back=block(HUMAN.benchLength,.35,.08,x,.65,z-HUMAN.seatDepth/2+.04,benchWood);
  back.rotation.x=-.12;
}

// Casa, UAb e Dachser: volumes transitáveis e mobiliário procedural.
const interiors=createInteriors({scene,obstacles});
label('CASA',-19,10.1,34,14);
label('UAb',20,7.65,34,13.6);
label('DACHSER',0,10.65,-56,42);

// Centro Tecnológico: paredes reais com abertura transitável, quatro quadros
// interativos e teto separado, sem o antigo bloco maciço.
const projectsHall=createProjectsHall({scene,obstacles});
billboard('Galeria de Projetos',8,-5);
billboard('Centro Tecnológico',10,3);
billboard('One more thing...',5,25);

// UAb: inferior direita.

// Dachser: pátio logístico e vias de acesso ligadas à estrada periférica.
plane(55,23,0,-80.5,road,.065);
for(const x of [-25.75,25.75])plane(.5,26,x,-56,road,.065);
// Revestimento exterior azul em chapa perfilada, mantendo o betão interior.
const dachserCladding=exteriorMaterial('metal',0x24559d);
const dachserBase=exteriorMaterial('concrete',0x91b3c9);
const dockRubber=mat('#20252a'),dockTrim=mat('#c5c8c8'),dockDoor=exteriorMaterial('metal',0xb7bdc3);
const dockYellow=0xf5c52b;
for(const side of [-1,1]){
  block(.065,8.85,26,side*25.54,5.575,-56,dachserCladding,scene,false);
  block(.075,1.15,26,side*25.55,.575,-56,dachserBase,scene,false);
}
block(51,8.85,.065,0,5.575,-69.04,dachserCladding,scene,false);
block(51,1.15,.075,0,.575,-69.05,dachserBase,scene,false);
// Entrada principal deslocada para o escritório (X=18).
for(const [X,W] of [[-4.45,42.1],[22.45,6.1]]){
  block(W,10,.065,X,5,-42.96,dachserCladding,scene,false);
  block(W,1.15,.075,X,.575,-42.91,dachserBase,scene,false);
}
block(2.8,7.65,.065,18,6.175,-42.96,dachserCladding,scene,false);
for(const X of [16.52,19.48])block(.14,2.4,.18,X,1.2,-42.80,dockTrim,scene,false);
block(3.1,.15,.18,18,2.43,-42.8,dockTrim,scene,false);
block(3.55,.18,.95,18,2.72,-42.45,dockTrim,scene,false);
// Letras de fachada, em amarelo sobre a chapa azul.
function industrialSign(text,x,y,z,w,h,back=false){
  const cv=document.createElement('canvas');cv.width=1024;cv.height=256;
  const ctx=cv.getContext('2d');ctx.clearRect(0,0,1024,256);
  ctx.fillStyle='#f5c52b';ctx.font='bold 174px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128,1000);
  const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}));
  mesh.position.set(x,y,z);mesh.rotation.y=back?Math.PI:0;scene.add(mesh);
}
industrialSign('DACHSER',0,7.5,-42.88,16,3.0);
industrialSign('RECEÇÃO',18,3.22,-42.86,3.8,.62);
// Cais numerados, com abrigos de borracha, molduras e plataforma de betão.
for(const [idx,X] of [-21,-14,-7,0,7].entries()){
  plane(.10,18,X-1.85,-79,roadPaint,.11);
  plane(.10,18,X+1.85,-79,roadPaint,.11);
  plane(3.7,.12,X,-88,roadPaint,.11);
  block(3.6,4.0,.22,X,2.50,-69.20,dockTrim,scene,false);
  block(3.42,3.82,.26,X,2.50,-69.34,dockRubber,scene,false);
  block(2.65,3.22,.10,X,2.37,-69.50,dockDoor,scene,false);
  for(const side of [-1,1])block(.36,3.7,.48,X+side*1.50,2.48,-69.54,dockRubber,scene,false);
  block(3.36,.40,.48,X,4.23,-69.54,dockRubber,scene,false);
  block(3.4,.78,.70,X,.39,-69.42,dachserBase,scene,false);
  for(const side of [-1,1])block(.18,.22,.21,X+side*1.05,.86,-69.86,dockRubber,scene,false);
  industrialSign(String(106-idx),X,5.42,-69.10,1.5,.65,true);
}
// Faixa de janelas do escritório, sem alterar as paredes ou colisões existentes.
const officeGlass=mat('#536d85',{metalness:.18,roughness:.27});
for(const X of [12,14.8,21.4,24]){
  block(2.5,1.30,.10,X,2.35,-42.87,dockTrim,scene,false);
  block(2.36,1.16,.045,X,2.35,-42.79,officeGlass,scene,false);
  block(.055,1.16,.04,X,2.35,-42.75,dockTrim,scene,false);
}
const truckBlue=mat('#175b98'),truckWhite=mat('#e7e9e9'),truckTire=mat('#22262b'),truckGlass=mat('#526d82',{roughness:.35});
function parkedTruck(x,z){
  // Camião articulado de ~16 m, traseira junto ao cais.
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  block(2.55,2.75,12.0,0,2.48,0,truckWhite,g);
  block(2.4,.30,14.4,0,.92,-.65,dark,g);
  block(2.48,2.60,3.2,0,2.0,-7.7,truckBlue,g);
  block(2.12,.78,.08,0,2.72,-9.34,truckGlass,g);
  for(const s of [-1,1]){
    block(.055,.70,1.15,s*1.25,2.72,-7.7,truckGlass,g);
    block(.09,.18,12.0,s*1.28,1.31,0,truckBlue,g);
    for(const zz of [3.7,2.4,1.1,-5.4,-8.5]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.50,.50,.29,12),truckTire);
      wheel.rotation.z=Math.PI/2;wheel.position.set(s*1.18,.53,zz);g.add(wheel);
    }
    const cv=document.createElement('canvas');cv.width=512;cv.height=128;
    const ctx=cv.getContext('2d');ctx.fillStyle='#e7e9e9';ctx.fillRect(0,0,512,128);ctx.fillStyle='#175b98';ctx.font='bold 90px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('DACHSER',256,64,480);
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(7.5,1.875),new THREE.MeshBasicMaterial({map:t}));sign.position.set(s*1.281,2.5,0);sign.rotation.y=s*Math.PI/2;g.add(sign);
  }
  addBoxObstacle(x,z-1.6,2.65,15.5);
}
parkedTruck(-21,-75.5);parkedTruck(-7,-75.5);parkedTruck(7,-75.5);

// Blocos residenciais à esquerda e ao topo direito.
for(const [x,z,w,d] of [[21,-34,14,12],[-15,-33,20,12]]){
  addBoxObstacle(x,z,w,d);
  block(w,11,d,x,5.5,z,building);
  block(w+.25,.34,d+.25,x,11.17,z,roofMat);
  block(1.2,2.15,.14,x,1.075,z+d/2+.10,dark,scene,false);
  dutchFacade({scene,x,z,w,d,h:11,floors:4,segments:3});
  label('APARTAMENTOS',x,13.3,z,w*.85);
}
// Prédio comprido de três pisos, na faixa residencial ocidental.
dutchRow({scene,x:-20.2,z:-3,length:40,depth:11.2,height:8.7});
addBoxObstacle(-20.2,-3,11.2,40);
label('APARTAMENTOS',-20.2,10.6,-3,10.5);
// Árvores periféricas.
for(const z of [27,41])tree(-25.5,z,.85);
for(let z=25;z<=41;z+=8)tree(25.5,z,.85);
// O antigo limite norte passa a ser o acesso pedonal à Dachser.

// Vegetação baixa: distribuição determinística em manchas, sem colisões.
const gardenWindTime={value:0};
const grassCells=[];
// Deslocamento em coordenadas do mundo: a base mantém-se fixa e as pontas ondulam.
// Usado em todas as peças das flores, com a mesma altura de referência.
function windMaterial(material){
  material.onBeforeCompile=shader=>{
    shader.uniforms.uGardenTime=gardenWindTime;
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
uniform float uGardenTime;
`);
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
vec4 mvPosition=vec4(transformed,1.0);
#ifdef USE_INSTANCING
  mvPosition=instanceMatrix*mvPosition;
  vec3 plantWorld=(modelMatrix*mvPosition).xyz;
  float heightAboveGround=max(0.0,plantWorld.y-0.025);
  float phase=plantWorld.x*0.58+plantWorld.z*0.34;
  float gust=0.65+0.35*sin(uGardenTime*0.72+plantWorld.z*0.23);
  float sway=sin(phase-uGardenTime*1.65)*0.65+sin(phase*1.8-uGardenTime*2.35)*0.22;
  float bend=heightAboveGround*heightAboveGround*gust/(1.0+heightAboveGround*1.6);
  mvPosition.x+=bend*(0.28+0.65*sway);
  mvPosition.z+=bend*(0.15+0.34*sway);
#endif
mvPosition=modelViewMatrix*mvPosition;
gl_Position=projectionMatrix*mvPosition;
`);
  };
  material.customProgramCacheKey=()=> 'garden-wind-v1';
  return material;
}
function addGardenPlants(){
  let seed=84621;
  function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const buildings=[[-19,34,19,12],[20,34,16,13],[0,-56,51,26],[20,-8,17,20],[-20.2,-3,11.2,40],[21,-34,14,12],[-15,-33,20,12]];
  function clear(x,z){
    if(Math.abs(x)>25.9||Math.abs(z)>42)return false;
    if(Math.abs(x-residentialRoad.x)<residentialRoad.w/2+.18&&Math.abs(z-residentialRoad.z)<residentialRoad.d/2+.18)return false;
    if(Math.abs(x+19.7)<9.6+.18&&Math.abs(z-23.5)<2.3+.18)return false;
    if(Math.abs(x+10.4)<2.3+.18&&Math.abs(z-21.5)<2.3+.18)return false;
    if(buildings.some(([X,Z,W,D])=>Math.abs(x-X)<W/2+.5&&Math.abs(z-Z)<D/2+.5))return false;
    if(pedestrianAreas.some(p=>pathDistance(x,z,p)<.65))return false;
    return !obstacles.some(o=>o.type==='circle'?Math.hypot(x-o.x,z-o.z)<o.r+.32:Math.abs(x-o.x)<o.w/2+.3&&Math.abs(z-o.z)<o.d/2+.3);
  }
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  // Relva alta de prado, com folhas estreitas e curvadas.
  const positions=[];
  // Folhas estreitas, curvas em dois segmentos, com base larga apenas alguns milímetros.
  for(let k=0;k<7;k++){
    const a=k*2.39996,dx=Math.cos(a),dz=Math.sin(a);
    const w=.013+(k%3)*.002,h=.65+(k%4)*.10,lean=.09+(k%3)*.045;
    const bx=dx*.042,bz=dz*.042;
    const L=[bx-dz*w,0,bz+dx*w],R=[bx+dz*w,0,bz-dx*w];
    const M1=[bx+dx*lean*.32-dz*w*.62,h*.58,bz+dz*lean*.32+dx*w*.62];
    const M2=[bx+dx*lean*.32+dz*w*.62,h*.58,bz+dz*lean*.32-dx*w*.62];
    const T=[bx+dx*lean,h,bz+dz*lean];
    positions.push(...L,...R,...M1,...R,...M2,...M1,...M1,...M2,...T);
  }
  const blades=new THREE.BufferGeometry();blades.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));blades.computeVertexNormals();
  // Normais orientadas para cima evitam o brilho artificial das faces verticais.
  const normals=blades.attributes.normal;
  for(let k=0;k<normals.count;k++)normals.setXYZ(k,0,1,0);
  normals.needsUpdate=true;
  // Distribuição por células de 8 m, com amostragem irregular dentro de cada célula.
  // Os lotes independentes permitem frustum culling e evitam desenhar todo o campus.
  const grassMaterial=windMaterial(new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide}));
  // Geometria simplificada para distâncias médias e longas.
  function simpleBlades(count,width){
    const p=[];
    for(let k=0;k<count;k++){
      const a=k*2.39996,dx=Math.cos(a),dz=Math.sin(a),h=.70+(k%3)*.10;
      p.push(-dz*width,0,dx*width,dz*width,0,-dx*width,dx*.14,h,dz*.14);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(Array.from({length:p.length},(_,i)=>i%3===1?1:0),3));return g;
  }
  const midBlades=simpleBlades(4,.016),farBlades=simpleBlades(3,.026);
  const grassSpacing=.18; // ~31 posições/m²; folhas ligeiramente mais largas preservam cobertura
  for(let tz=-42;tz<42;tz+=8)for(let tx=-27;tx<27;tx+=8){
    const samples=[];
    const xEnd=Math.min(tx+8,27),zEnd=Math.min(tz+8,42);
    for(let gz=tz;gz<zEnd;gz+=grassSpacing)for(let gx=tx;gx<xEnd;gx+=grassSpacing){
      const x=gx+rand()*grassSpacing,z=gz+rand()*grassSpacing;
      if(!clear(x,z))continue;
      const density=.91+.045*Math.sin(x*.71+Math.cos(z*.32))+.035*Math.cos(z*.93+x*.29);
      if(rand()>density)continue;
      const height=.83+rand()*.45+(rand()<.08?.15:0);
      samples.push({x,z,height,spread:.82+rand()*.38,angle:rand()*Math.PI*2,hue:.225+rand()*.065,sat:.42+rand()*.19,light:.12+rand()*.075});
    }
    if(!samples.length)continue;
    // Baralhar deterministicamente antes de reduzir a contagem, evitando faixas vazias.
    for(let j=samples.length-1;j>0;j--){const k=Math.floor(rand()*(j+1));[samples[j],samples[k]]=[samples[k],samples[j]];}
    const levels=[];
    for(const [geometry,fraction,spreadBoost] of [[blades,1,1],[midBlades,.48,1.35],[farBlades,.15,1.9]]){
      const count=Math.max(1,Math.floor(samples.length*fraction));
      const grass=new THREE.InstancedMesh(geometry,grassMaterial,count);
      grass.userData.decoration=true;grass.castShadow=false;grass.receiveShadow=false;
      for(let n=0;n<count;n++){
        const v=samples[n];dummy.position.set(v.x,.025,v.z);dummy.rotation.set(0,v.angle,0);
        dummy.scale.set(v.spread*spreadBoost,v.height,v.spread*spreadBoost);dummy.updateMatrix();
        grass.setMatrixAt(n,dummy.matrix);grass.setColorAt(n,color.setHSL(v.hue,v.sat,v.light));
      }
      grass.instanceMatrix.needsUpdate=true;grass.instanceColor.needsUpdate=true;
      grass.computeBoundingSphere();grass.boundingSphere.radius+=.7;
      grass.visible=false;scene.add(grass);levels.push(grass);
    }
    grassCells.push({x:(tx+xEnd)/2,z:(tz+zEnd)/2,levels,current:-1});
  }
  // Flores baixas nas margens da relva alta, sem invadir o pavimento.
  function flowerClear(x,z){
    if(Math.abs(x)>25.9||Math.abs(z)>42)return false;
    if(Math.abs(x-residentialRoad.x)<residentialRoad.w/2+.18&&Math.abs(z-residentialRoad.z)<residentialRoad.d/2+.18)return false;
    if(Math.abs(x+19.7)<9.6+.18&&Math.abs(z-23.5)<2.3+.18)return false;
    if(Math.abs(x+10.4)<2.3+.18&&Math.abs(z-21.5)<2.3+.18)return false;
    if(buildings.some(([X,Z,W,D])=>Math.abs(x-X)<W/2+.24&&Math.abs(z-Z)<D/2+.24))return false;
    if(pedestrianAreas.some(p=>pathDistance(x,z,p)<.16))return false;
    return !obstacles.some(o=>o.type==='circle'?Math.hypot(x-o.x,z-o.z)<o.r+.20:Math.abs(x-o.x)<o.w/2+.20&&Math.abs(z-o.z)<o.d/2+.20);
  }
  const flowers=[];
  const palette=[0xfff4dd,0xfff7ef,0xf4c448,0xb18ce3,0xe9a4c5,0xaac6ff];
  // Cobertura densa das margens, com pequenos agrupamentos de cor.
  // Evitar duplicações nas interseções através de uma grelha de ocupação.
  const occupied=new Set();
  function addFlower(x,z,h,size,kind){
    const key=Math.floor(x/.12)+':'+Math.floor(z/.12);
    if(occupied.has(key)||flowers.length>=6500)return;
    occupied.add(key);flowers.push({x,z,h,size,kind,a:rand()*Math.PI*2});
  }
  // Amostrar as margens das curvas e da praça, em vez de retângulos.
  for(const p of pedestrianAreas){
    const len=p.type==='circle'?2*Math.PI*p.r:Math.hypot(p.bx-p.ax,p.bz-p.az);
    const count=Math.max(1,Math.ceil(len/.28));
    for(let j=0;j<count;j++){
      const t=(j+rand())/count,kind=Math.floor(rand()*palette.length);
      for(const side of p.type==='circle'?[1]:[-1,1])for(let k=0;k<6;k++){
        const offset=p.r+.20+rand()*.45;
        let x,z;
        if(p.type==='circle'){
          const a=t*Math.PI*2+(rand()-.5)*.045;x=p.x+Math.cos(a)*offset;z=p.z+Math.sin(a)*offset;
        }else{
          const dx=p.bx-p.ax,dz=p.bz-p.az;
          x=p.ax+dx*t-side*dz/len*offset+(rand()-.5)*.12;
          z=p.az+dz*t+side*dx/len*offset+(rand()-.5)*.12;
        }
        if(flowerClear(x,z)&&!clear(x,z))addFlower(x,z,.24+rand()*.26,1.15+rand()*.85,kind);
      }
    }
  }
  // Manchas densas e visíveis acima da relva, sem cobrir todo o prado.
  const centers=[[-5,12],[-4,20],[9,16],[12,21],[-13,8],[-6,28],[7,30],[11,8],[-5,4],[12,1],[-13,19],[3,-13],[-5,-18],[-18,18],[12,17],[-5,-12],[9,25],[-14,25],[3,-18],[7,-9],[15,10],[-5,32]];
  for(const [cx,cz] of centers){
    const kind=Math.floor(rand()*palette.length);
    for(let k=0;k<110;k++){
      const a=rand()*Math.PI*2,r=Math.sqrt(rand())*2.15,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
      if(clear(x,z))addFlower(x,z,1.10+rand()*.40,1.45+rand()*.75,rand()<.75?kind:Math.floor(rand()*palette.length));
    }
  }
  // Cada flor usa um único disco de pétalas de baixo custo, em vez de várias esferas.
  function blossomGeometry(count,inner,outer,wide){
    const pos=[];
    for(let k=0;k<count;k++){
      const a=k*Math.PI*2/count,dx=Math.cos(a),dz=Math.sin(a);
      const root=[dx*inner,0,dz*inner],tip=[dx*outer,0,dz*outer];
      const left=[dx*(inner+outer)/2-dz*wide,.009,dz*(inner+outer)/2+dx*wide];
      const right=[dx*(inner+outer)/2+dz*wide,.009,dz*(inner+outer)/2-dx*wide];
      pos.push(...root,...left,...tip,...root,...tip,...right);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
  }
  const stemMat=windMaterial(new THREE.MeshLambertMaterial({color:0x527b36}));
  const flowerMat=windMaterial(new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide}));
  const heartMat=windMaterial(new THREE.MeshLambertMaterial({color:0xf3be38}));
  const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.005,.0075,1,4,2),stemMat,flowers.length);
  const petals=new THREE.InstancedMesh(blossomGeometry(6,.012,.057,.018),flowerMat,flowers.length);
  const hearts=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,3),heartMat,flowers.length);
  function finish(mesh){mesh.userData.decoration=true;mesh.castShadow=false;mesh.receiveShadow=false;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius+=1;scene.add(mesh);}
  flowers.forEach((f,i)=>{
    dummy.rotation.set(0,0,0);dummy.position.set(f.x,.025+f.h/2,f.z);dummy.scale.set(1,f.h,1);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);
    dummy.position.set(f.x,.025+f.h+.008,f.z);dummy.scale.set(.018*f.size,.012*f.size,.018*f.size);dummy.updateMatrix();hearts.setMatrixAt(i,dummy.matrix);
    dummy.position.set(f.x,.025+f.h,f.z);dummy.rotation.set(0,f.a,0);dummy.scale.setScalar(f.size);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);petals.setColorAt(i,color.setHex(palette[f.kind]));
  });
  for(const mesh of [stems,petals,hearts])finish(mesh);
  // Três pequenos núcleos de girassóis em terra livre, com cabeças verticais.
  const sunflowers=[];
  for(const [cx,cz] of [[-18,18],[12,17],[-5,-12]]){
    const wanted=5+Math.floor(rand()*3);let placed=0;
    for(let attempt=0;attempt<80&&placed<wanted;attempt++){
      const a=rand()*Math.PI*2,r=.35+rand()*1.25,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
      if(!clear(x,z)||sunflowers.some(f=>Math.hypot(x-f.x,z-f.z)<.38))continue;
      sunflowers.push({x,z,h:1.30+rand()*.38,size:.9+rand()*.35,rot:(rand()-.5)*1.25});placed++;
    }
  }
  const n=sunflowers.length;
  if(n){
    const sunflowerStems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.012,.017,1,6,4),stemMat,n);
    const sunflowerPetals=new THREE.InstancedMesh(blossomGeometry(14,.078,.19,.037),windMaterial(new THREE.MeshLambertMaterial({color:0xf5c52a,side:THREE.DoubleSide})),n);
    const sunflowerCenters=new THREE.InstancedMesh(new THREE.CylinderGeometry(.082,.082,.035,16),windMaterial(new THREE.MeshLambertMaterial({color:0x624023})),n);
    const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.14,.07,.07,.32,.14,0,0,0,0,.32,.14,0,.14,.07,-.07],3));leafGeo.computeVertexNormals();
    const sunflowerLeaves=new THREE.InstancedMesh(leafGeo,windMaterial(new THREE.MeshLambertMaterial({color:0x58893d,side:THREE.DoubleSide})),n*2);
    sunflowers.forEach((f,i)=>{
      dummy.position.set(f.x,.025+f.h/2,f.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,f.h,1);dummy.updateMatrix();sunflowerStems.setMatrixAt(i,dummy.matrix);
      dummy.position.set(f.x,.025+f.h,f.z);dummy.rotation.set(Math.PI/2,f.rot,0,'YXZ');dummy.scale.setScalar(f.size);dummy.updateMatrix();sunflowerPetals.setMatrixAt(i,dummy.matrix);sunflowerCenters.setMatrixAt(i,dummy.matrix);
      for(let k=0;k<2;k++){
        dummy.position.set(f.x,.025+f.h*(.38+k*.23),f.z);dummy.rotation.set(0,f.rot+k*Math.PI,0,'YXZ');dummy.scale.setScalar(f.size);dummy.updateMatrix();sunflowerLeaves.setMatrixAt(i*2+k,dummy.matrix);
      }
    });
    for(const mesh of [sunflowerStems,sunflowerPetals,sunflowerCenters,sunflowerLeaves])finish(mesh);
  }
}
addGardenPlants();
function updateGrassLOD(camera,mode){
  for(const cell of grassCells){
    const d=Math.hypot(camera.position.x-cell.x,camera.position.z-cell.z,camera.position.y-0.8);
    const next=mode==='aerial'?2:d<8?0:d<19?1:d<50?2:-1;
    if(next===cell.current)continue;
    cell.levels.forEach((mesh,i)=>mesh.visible=i===next);cell.current=next;
  }
}

// Referência de escala: H mostra/esconde silhueta de 1.75 m no jardim.
const humanReference=new THREE.Group();
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.23,1.29,5,10),mat('#e59b32'));
body.position.y=HUMAN.height/2;humanReference.add(body);
const eyes=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),mat('#1f3b60'));
eyes.position.y=HUMAN.eyeHeight;humanReference.add(eyes);
// Colocada num caminho aberto, junto à fonte, para não ficar escondida pela relva.
humanReference.position.set(-4,0,15);
const calibrationRing = new THREE.Mesh(
  new THREE.TorusGeometry(.68,.065,10,40),
  new THREE.MeshBasicMaterial({ color: 0xffa82e, depthTest:false })
);
calibrationRing.rotation.x=-Math.PI/2;
calibrationRing.position.y=.14;
humanReference.add(calibrationRing);
humanReference.visible=false;
scene.add(humanReference);
// O indicador no ecrã confirma o estado, mesmo quando a pessoa é pequena na vista aérea.
const toggleCalibration=()=>{
  humanReference.visible=!humanReference.visible;
  const status=document.querySelector('#scale-status');
  const button=document.querySelector('#scale-toggle');
  if(status)status.textContent=humanReference.visible?'Referência humana: visível (1,75 m)':'Referência humana: oculta';
  if(button)button.setAttribute('aria-pressed',String(humanReference.visible));
  if(humanReference.visible) {
    // Aproxima a vista à referência apenas na primeira ativação.
    if(controls.enabled){
      controls.target.set(-4,1,15);
      camera.position.set(5,8,29);
      controls.update();
    }
  }
};
document.querySelector('#scale-toggle')?.addEventListener('click',toggleCalibration);
window.addEventListener('keydown',event=>{
  if((event.key?.toLowerCase()==='h'||event.code==='KeyH') && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    toggleCalibration();
  }
});

const controls=new OrbitControls(camera,canvas);
controls.target.set(0,0,-18); controls.enableDamping=true;
controls.maxPolarAngle=Math.PI/2.03;
controls.minDistance=18;controls.maxDistance=185;
controls.update();

// Meta fora do edifício: as paredes ainda não têm aberturas físicas.
// A seta/círculo assinala a chegada à porta dos Projetos.
const destination={x:20,z:3.8};
const destinationMarker=new THREE.Mesh(
  new THREE.RingGeometry(1.1,1.45,40),
  new THREE.MeshBasicMaterial({color:0x28e4bd,side:THREE.DoubleSide,depthTest:false})
);
destinationMarker.rotation.x=-Math.PI/2;
destinationMarker.position.set(destination.x,.18,destination.z);
scene.add(destinationMarker);
const navigation=createNavigation({
  camera,canvas,controls,obstacles,
  spawn:{x:-19,z:42},destination,eyeHeight:HUMAN.eyeHeight
});

// Agrupar geometria estática por material e célula espacial, mantendo portas,
// quadros, instâncias, luzes e grupos de teto com comportamento próprio.
const dynamicMeshes=new Set([...projectsHall.interactables,...interiors.interactables].flatMap(a=>a.meshes));
function batchStatic(){
  scene.updateMatrixWorld(true);
  const buckets=new Map(),tmp=new THREE.Vector3();
  scene.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||o.userData.decoration||dynamicMeshes.has(o)||Array.isArray(o.material)||o.material.transparent||o.material.depthTest===false||o===destinationMarker) return;
    // Evitar mover objetos de grupos que podem rodar ou desaparecer.
    if(o.parent!==scene && (o.parent.parent!==scene || o.parent===humanReference))return;
    if(o.parent!==scene && o.parent.children.some(child=>dynamicMeshes.has(child)||child.isLight))return;
    if(o.parent!==scene && o.parent.children.some(child=>child.isGroup && child.children.some(m=>dynamicMeshes.has(m))))return;
    if(o.geometry.type!=='BoxGeometry' || o.geometry.attributes.position.count!==24)return;
    const dim=o.geometry.parameters;if(dim.width>8||dim.depth>8)return;
    if(o.parent!==scene && o.parent.children.some(child=>child.isGroup))return;
    o.getWorldPosition(tmp);
    const key=[o.material.uuid,Math.floor(tmp.x/12),Math.floor(tmp.z/12),o.castShadow,o.receiveShadow].join(':');
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(o);
  });
  for(const meshes of buckets.values()){
    if(meshes.length<4)continue;
    const geos=meshes.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld));
    const geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());
    if(!geometry)continue;
    geometry.computeBoundingSphere();
    const mesh=new THREE.Mesh(geometry,meshes[0].material);
    mesh.castShadow=meshes[0].castShadow;mesh.receiveShadow=meshes[0].receiveShadow;
    scene.add(mesh);
    for(const o of meshes)o.removeFromParent();
  }
}
batchStatic();
const prompt=document.querySelector('#project-prompt');
const modal=document.querySelector('#project-modal');
const title=document.querySelector('#project-title');
const subtitle=document.querySelector('#project-subtitle');
const description=document.querySelector('#project-description');
const projectLink=document.querySelector('#project-link');
const projectImage=document.querySelector('#project-image');
const raycaster=new THREE.Raycaster();
const targets=new Map(),interactionPosition=new THREE.Vector3();
for(const action of [...projectsHall.interactables,...interiors.interactables])
  for(const mesh of action.meshes)targets.set(mesh,action);
function getInteraction(){
  if(navigation.getMode()!=='first'||(modal&&!modal.hidden))return null;
  camera.updateMatrixWorld(true);
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  raycaster.far=3;
  const candidates=[...targets.keys()].filter(o=>{o.getWorldPosition(interactionPosition);return interactionPosition.distanceToSquared(camera.position)<25;});
  if(!candidates.length)return null;
  const hit=raycaster.intersectObjects(candidates,false).find(h=>h.object.visible);
  if(!hit)return null;
  raycaster.far=hit.distance+.015;
  const blocker=raycaster.intersectObjects(scene.children.filter(o=>!o.userData.decoration&&o.visible),true).find(h=>h.object.visible&&h.object.material?.depthTest!==false);
  return blocker?targets.get(blocker.object)||null:null;
}
function closeProject(){
  if(modal)modal.hidden=true;
  navigation.setPaused(false);
}
function openProject(project){
  if(!project || !modal)return;
  if(document.pointerLockElement===canvas)document.exitPointerLock?.();
  title.textContent=project.title;
  subtitle.textContent=project.subtitle;
  description.textContent=project.detail;
  projectLink.href=project.url;
  if(projectImage){projectImage.hidden=true;projectImage.removeAttribute('src');if(project.image){projectImage.alt=project.title;projectImage.onload=()=>{projectImage.hidden=false;};projectImage.onerror=()=>{projectImage.hidden=true;};projectImage.src=project.image;}}
  modal.hidden=false;
  navigation.setPaused(true);
  projectLink.textContent=project.url.includes('codepen.io')?'Abrir no CodePen':'Abrir no GitHub';
  document.querySelector('#project-close')?.focus();
}
document.querySelector('#project-close')?.addEventListener('click',closeProject);
modal?.addEventListener('click',(event)=>{if(event.target===modal)closeProject();});
window.addEventListener('keydown',(event)=>{
  if(event.code==='Escape' && modal && !modal.hidden)closeProject();
  if(event.code==='KeyE' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && navigation.getMode()==='first') {
    event.preventDefault();
    if(modal && !modal.hidden) closeProject();
    else {const action=getInteraction();const project=action?.activate();if(project)openProject(project);}
  }
});
function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(canvas);resize();
const clock=new THREE.Clock();
let interactionTick=0,cachedAction=null,shadowTick=0;
let frames=0,frameTime=0;
const fpsLabel=document.createElement('span');fpsLabel.style.cssText='position:fixed;right:12px;bottom:12px;background:#172634dd;color:white;padding:5px 8px;border-radius:5px;font:12px system-ui;pointer-events:none;z-index:5';document.body.appendChild(fpsLabel);
renderer.setAnimationLoop(()=>{
  const rawDt=clock.getDelta(),dt=Math.min(rawDt,.05);
  frames++;frameTime+=rawDt;shadowTick+=rawDt;
  if(frameTime>=1){fpsLabel.textContent=Math.round(frames/frameTime)+' FPS · '+renderer.info.render.calls+' draws';frames=0;frameTime=0;}
  if(shadowTick>=.25){renderer.shadowMap.needsUpdate=true;shadowTick=0;}
  gardenWindTime.value+=dt;
  if(!modal || modal.hidden)navigation.update(dt);
  const playerPosition=navigation.getPlayerPosition();
  projectsHall.update(dt,playerPosition,navigation.getMode());
  interiors.update(dt,playerPosition,navigation.getMode());
  interactionTick+=dt;
  if(interactionTick>=.10){interactionTick=0;cachedAction=getInteraction();}
  const action=cachedAction;
  if(prompt){
    prompt.hidden=!action;
    if(action)prompt.textContent='E — '+action.label();
  }
  if(navigation.getMode()==='aerial'){controls.update();scene.fog.near=200;scene.fog.far=300;}else{scene.fog.near=105;scene.fog.far=175;}
  destinationMarker.material.opacity=.68+.24*Math.sin(clock.elapsedTime*3);
  destinationMarker.material.transparent=true;
  updateGrassLOD(camera,navigation.getMode());
  renderer.render(scene,camera);
});
