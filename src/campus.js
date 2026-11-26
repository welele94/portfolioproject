import * as THREE from 'three';
import { exteriorMaterial, metricBox, metricCylinder, organicGrass } from './materials.js';
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
plane(64,96,0,0,ground,0);
plane(64,3.5,0,45,road,.06);
plane(64,3.5,0,-45,road,.06);
plane(3.8,92,-30,0,road,.06);
plane(3.8,92,30,0,road,.06);
// Marcações discretas no eixo das estradas periféricas.
const roadPaint=mat('#d6d5ca');
for(let x=-28;x<=28;x+=6)for(const z of [-45,45])plane(2.2,.09,x,z,roadPaint,.091);
for(let z=-36;z<=36;z+=6)for(const x of [-30,30])plane(.09,2.2,x,z,roadPaint,.091);
// Jardim e rede pedonal contínua. O pavimento fica acima da relva.
// O jardim usa o mesmo terreno contínuo; sem placa sobreposta nem fronteira reta.
const pathWidth=3;
const pedestrianAreas=[];
function walk(x1,z1,x2,z2,width=pathWidth){
  if(x1!==x2&&z1!==z2)throw new Error('Segmento pedonal deve ser axial');
  pedestrianAreas.push({x:(x1+x2)/2,z:(z1+z2)/2,w:Math.abs(x2-x1)+width,d:Math.abs(z2-z1)+width});
  plane(Math.abs(x2-x1)+width,Math.abs(z2-z1)+width,
    (x1+x2)/2,(z1+z2)/2,pavement,.125);
}
// Eixo norte-sul: contorna a fonte pelo lado direito.
walk(0,-26.5,0,8);
walk(0,8,5,8);
walk(5,8,5,24);
walk(5,24,0,24);
walk(0,24,0,42);
// Ligações transversais do jardim, evitando os edifícios.
walk(-12,-5,10,-5);
walk(-23,24,20,24);
walk(-10,-5,-10,24);
walk(16,5,16,24);
walk(0,5,20,5);
walk(20,5,20,2);
// Acessos às fachadas dos apartamentos e UAb.
walk(-20,-.5,-20,3);
walk(-20,3,-10,3);
walk(21,-28,21,-23);
walk(0,-23,21,-23);

// Passeio sul, em frente à Casa e UAb.
walk(-25.4,42,20,42);
walk(-25.4,40,-25.4,42);
walk(-19,40,-19,42);
walk(-12.6,40,-12.6,42);
walk(20,40.5,20,42);
// Ligação sul-norte pelo corredor entre Casa e jardim.
walk(-9,24,-9,42);
// Fonte: diâmetro 5 m; borda a 0.50 m, água pouco abaixo.
addCircleObstacle(0,15,2.55);
const fountainBase=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.55,HUMAN.fountainRimHeight,32),white);
fountainBase.position.set(0,HUMAN.fountainRimHeight/2,15);fountainBase.castShadow=true;scene.add(fountainBase);
const fountainWater=new THREE.Mesh(new THREE.CylinderGeometry(2.12,2.12,.05,32),water);
fountainWater.position.set(0,HUMAN.fountainRimHeight-.07,15);scene.add(fountainWater);
const fountainJet=new THREE.Mesh(new THREE.CylinderGeometry(.08,.15,1.10,12),water);
fountainJet.position.set(0,HUMAN.fountainRimHeight+.49,15);scene.add(fountainJet);
for(const [x,z] of [[-13,7],[-7,19],[11,9],[10,20],[-6,28],[7,30]]) tree(x,z,.85);
// Bancos: assento a 45 cm (antes ~81 cm), 1.60 x 0.43 m.
const benchWood=exteriorMaterial('wood','#a1805d');
for(const [x,z] of [[-6,8],[8,11],[-7,27],[7,27]]) {
  addBoxObstacle(x,z,HUMAN.benchLength,HUMAN.seatDepth);
  const seatThickness=.10;
  block(HUMAN.benchLength,seatThickness,HUMAN.seatDepth,x,HUMAN.seatHeight-seatThickness/2,z,benchWood);
  for(const side of [-1,1]) block(.09,HUMAN.seatHeight-seatThickness,.09,x+side*.61,(HUMAN.seatHeight-seatThickness)/2,z,trunk);
  const back=block(HUMAN.benchLength,.35,.08,x,.65,z-HUMAN.seatDepth/2+.04,benchWood);
  back.rotation.x=-.12;
}

// Casa, UAb e Dachser: volumes transitáveis e mobiliário procedural.
const interiors=createInteriors({scene,obstacles});
label('CASA',-19,8.4,34,14);
label('UAb',20,7.65,34,13.6);
label('DACHSER',0,8.65,-33,20.4);

// Centro Tecnológico: paredes reais com abertura transitável, quatro quadros
// interativos e teto separado, sem o antigo bloco maciço.
const projectsHall=createProjectsHall({scene,obstacles});
billboard('Galeria de Projetos',8,-5);
billboard('Centro Tecnológico',8,6);
billboard('One more thing...',8,28);

// UAb: inferior direita.

// Dachser: topo, mais distante e opcional.

// Blocos residenciais à esquerda e ao topo direito.
structure('APARTAMENTOS',-20,-11,12,21,11,roofMat,4);
structure('APARTAMENTOS',21,-34,14,12,11,roofMat,4);
// Árvores periféricas.
for(let z=-41;z<=41;z+=8){ tree(-27,z,.85); if(z>20||z< -22)tree(27,z,.85); }
for(let x=-25;x<=25;x+=8)tree(x,-41,.9);

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
  const buildings=[[-19,34,19,12],[20,34,16,13],[0,-33,24,13],[20,-8,17,20],[-20,-11,12,21],[21,-34,14,12]];
  function clear(x,z){
    if(Math.abs(x)>27.5||Math.abs(z)>42)return false;
    if(buildings.some(([X,Z,W,D])=>Math.abs(x-X)<W/2+.5&&Math.abs(z-Z)<D/2+.5))return false;
    if(pedestrianAreas.some(p=>Math.abs(x-p.x)<p.w/2+.65&&Math.abs(z-p.z)<p.d/2+.65))return false;
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
  // Pequenos grupos de flores silvestres, margaridas e flores lilases.
  const flowers=[];
  const centers=[[-5,12],[-4,20],[9,16],[12,21],[-13,8],[-6,28],[7,30],[11,8],[-5,4],[12,1],[-13,19],[3,-13],[-5,-18]];
  for(const [cx,cz] of centers)for(let k=0;k<65;k++){
    const a=rand()*Math.PI*2,r=Math.sqrt(rand())*1.65,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
    if(clear(x,z))flowers.push({x,z,h:.95+rand()*.38,size:1.35+rand()*.65,kind:Math.floor(rand()*5),a:rand()*Math.PI*2});
  }
  const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.006,.009,1,5,4),windMaterial(new THREE.MeshStandardMaterial({color:0x527b36,roughness:1})),flowers.length);
  const petals=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),windMaterial(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85})),flowers.length*5);
  const hearts=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,5),windMaterial(new THREE.MeshStandardMaterial({color:0xf3be38,roughness:.8})),flowers.length);
  const palette=[0xfff4dd,0xfff7ef,0xf4c448,0xb18ce3,0xe9a4c5];
  flowers.forEach((f,i)=>{
    dummy.rotation.set(0,0,0);dummy.position.set(f.x,.025+f.h/2,f.z);dummy.scale.set(1,f.h,1);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);
    const y=.025+f.h;
    dummy.position.set(f.x,y+.008,f.z);dummy.scale.set(.018*f.size,.012*f.size,.018*f.size);dummy.updateMatrix();hearts.setMatrixAt(i,dummy.matrix);
    for(let k=0;k<5;k++){
      const a=f.a+k*Math.PI*2/5;
      dummy.position.set(f.x+Math.cos(a)*.027*f.size,y,f.z+Math.sin(a)*.027*f.size);
      dummy.rotation.set(0,-a,0);dummy.scale.set(.027*f.size,.008*f.size,.014*f.size);dummy.updateMatrix();
      petals.setMatrixAt(i*5+k,dummy.matrix);petals.setColorAt(i*5+k,color.setHex(palette[f.kind]));
    }
  });
  for(const mesh of [stems,petals,hearts]){mesh.userData.decoration=true;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.7;scene.add(mesh);}
}
addGardenPlants();
function updateGrassLOD(camera,mode){
  for(const cell of grassCells){
    const d=Math.hypot(camera.position.x-cell.x,camera.position.z-cell.z,camera.position.y-0.8);
    const next=mode==='aerial'?2:d<11?0:d<24?1:d<58?2:-1;
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
controls.target.set(0,0,0); controls.enableDamping=true;
controls.maxPolarAngle=Math.PI/2.03;
controls.minDistance=18;controls.maxDistance=145;
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

const prompt=document.querySelector('#project-prompt');
const modal=document.querySelector('#project-modal');
const title=document.querySelector('#project-title');
const subtitle=document.querySelector('#project-subtitle');
const description=document.querySelector('#project-description');
const projectLink=document.querySelector('#project-link');
const projectImage=document.querySelector('#project-image');
const raycaster=new THREE.Raycaster();
const targets=new Map();
for(const action of [...projectsHall.interactables,...interiors.interactables])
  for(const mesh of action.meshes)targets.set(mesh,action);
function getInteraction(){
  if(navigation.getMode()!=='first'||(modal&&!modal.hidden))return null;
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  raycaster.far=3;
  const hit=raycaster.intersectObjects(scene.children.filter(o=>!o.userData.decoration),true).find(h=>h.object.visible&&h.object.material?.depthTest!==false);
  return hit?targets.get(hit.object)||null:null;
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
renderer.setAnimationLoop(()=>{
  const dt=Math.min(clock.getDelta(),.05);
  gardenWindTime.value+=dt;
  if(!modal || modal.hidden)navigation.update(dt);
  const playerPosition=navigation.getPlayerPosition();
  projectsHall.update(dt,playerPosition,navigation.getMode());
  interiors.update(dt,playerPosition,navigation.getMode());
  const action=getInteraction();
  if(prompt){
    prompt.hidden=!action;
    if(action)prompt.textContent='E — '+action.label();
  }
  if(navigation.getMode()==='aerial')controls.update();
  destinationMarker.material.opacity=.68+.24*Math.sin(clock.elapsedTime*3);
  destinationMarker.material.transparent=true;
  updateGrassLOD(camera,navigation.getMode());
  renderer.render(scene,camera);
});
