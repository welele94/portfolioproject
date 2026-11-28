import * as THREE from 'three';
import { exteriorMaterial, interiorMaterial, metricBox } from './materials.js';

// Centro Tecnológico — primeira sala transitável, 1 unidade = 1 metro.
// Os retângulos de colisão correspondem às paredes; a entrada não tem colisão.
export function createProjectsHall({scene, obstacles}) {
  const cx=20, cz=-8, width=17, depth=20, height=9;
  const wallMaterial=exteriorMaterial('concrete',0xe1e6e9);
  const floorMaterial=interiorMaterial('epoxy',0x444b58,{roughness:.48});
  const roofMaterial=exteriorMaterial('metal',0x232934);
  const accent=new THREE.MeshStandardMaterial({color:0x36b8ec,emissive:0x124967,emissiveIntensity:.4});
  const stationMaterial=interiorMaterial('brushed',0x30465a,{metalness:.25});
  function solid(w,h,d,x,y,z,material,collision=false) {
    const mesh=new THREE.Mesh(metricBox(w,h,d,material),material);
    mesh.position.set(x,y,z);
    mesh.castShadow=material!==roofMaterial;
    mesh.receiveShadow=true;
    scene.add(mesh);
    if(collision)obstacles.push({type:'box',x,z,w,d});
    return mesh;
  }
  // Canvas de alta resolução, com filtragem para leitura em ângulos oblíquos.
  function sharpTexture(canvas){
    const t=new THREE.CanvasTexture(canvas);
    t.colorSpace=THREE.SRGBColorSpace;
    t.anisotropy=16;
    t.minFilter=THREE.LinearMipmapLinearFilter;
    t.magFilter=THREE.LinearFilter;
    return t;
  }
  function signTexture(title,subtitle) {
    const canvas=document.createElement('canvas'); canvas.width=2048;canvas.height=1024;
    const c=canvas.getContext('2d');c.scale(2,2);
    c.fillStyle='#18304b';c.fillRect(0,0,1024,512);
    c.fillStyle='#58dcfb';c.fillRect(18,18,988,12);
    c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';
    c.font='bold 116px system-ui';c.fillText(title,512,206,940);
    c.fillStyle='#a2daed';c.font='bold 62px system-ui';c.fillText(subtitle,512,314,940);
    const texture=sharpTexture(canvas);
    return texture;
  }

  // Perímetro: frente em Z positivo, com vão aberto de 2.8 m.
  // Interior x=11.5…28.5, z=-18…2. Entrada central x=18.6…21.4.
  solid(width,.16,depth,cx,.10,cz,floorMaterial);
  solid(.45,height,depth,11.5,height/2,cz,wallMaterial,true);
  solid(.45,height,depth,28.5,height/2,cz,wallMaterial,true);
  solid(width,height,.45,cx,height/2,-18,wallMaterial,true);
  solid(7.1,height,.45,15.05,height/2,2,wallMaterial,true);
  solid(7.1,height,.45,24.95,height/2,2,wallMaterial,true);
  // Viga superior da entrada, sem colisão horizontal (a personagem tem altura < 2.2 m).
  solid(2.8,height-2.5,.45,cx,2.5+(height-2.5)/2,2,wallMaterial);
  solid(2.8,.12,.65,cx,2.48,2,accent);
  // Entrada transitável, chão nivelado e dois pilares de luz.
  for(const x of [18.45,21.55])solid(.12,2.5,.18,x,1.25,2.37,accent);
  // Duas folhas articuladas para dentro da sala, com colisão orientada.
  const doorMeshes=[];
  const leaves=[];
  let doorOpen=false, angle=0;
  for(const side of [-1,1]){
    const hinge=new THREE.Group();
    hinge.position.set(cx+side*1.4,.18,2);
    scene.add(hinge);
    const mesh=new THREE.Mesh(metricBox(1.39,2.25,.10,stationMaterial),stationMaterial);
    mesh.position.set(-side*.695,1.125,0);
    mesh.castShadow=true;mesh.receiveShadow=true;hinge.add(mesh);
    const handle=new THREE.Mesh(new THREE.BoxGeometry(.08,.22,.18),accent);
    handle.position.set(-side*1.23,1.02,0);hinge.add(handle);
    const collider={type:'oriented',x:0,z:0,w:1.39,d:.10,angle:0};
    obstacles.push(collider);
    leaves.push({side,hinge,collider});doorMeshes.push(mesh,handle);
  }
  function syncDoor(a){
    for(const {side,hinge,collider} of leaves){
      hinge.rotation.y=-side*a;
      collider.angle=hinge.rotation.y;
      collider.x=hinge.position.x-side*.695*Math.cos(a);
      collider.z=hinge.position.z-.695*Math.sin(a);
    }
  }
  function touchesDoor(position,a){
    return leaves.some(({side,hinge})=>{
      const dx=position.x-(hinge.position.x-side*.695*Math.cos(a));
      const dz=position.z-(hinge.position.z-.695*Math.sin(a));
      const t=-side*a,c=Math.cos(t),s=Math.sin(t);
      const x=dx*c-dz*s,z=dx*s+dz*c;
      return Math.hypot(Math.max(0,Math.abs(x)-.695),Math.max(0,Math.abs(z)-.05))<.36;
    });
  }
  syncDoor(0);
  const doorAction={meshes:doorMeshes,label:()=>doorOpen?'Fechar porta':'Abrir porta',activate:()=>{doorOpen=!doorOpen;}};
  const roof=solid(width+.7,.38,depth+.7,cx,height+.21,cz,roofMaterial);
  // A placa de fachada continua visível; não flutua no teto.
  const nameSign=new THREE.Mesh(new THREE.PlaneGeometry(10,2.4),
    new THREE.MeshBasicMaterial({map:signTexture('PROJETOS','Explora · Experimenta · Descobre'),side:THREE.DoubleSide,toneMapped:false}));
  nameSign.position.set(cx,5.6,2.27);scene.add(nameSign);

  const interactables=[doorAction];
  // Galeria: quatro quadros à altura dos olhos, dois em cada parede lateral.
  const projects=[
    {title:'Buddha Club',subtitle:'Onde tudo começou',detail:'O meu primeiro projeto, desenvolvido antes de utilizar inteligência artificial. Um trabalho de que me orgulho especialmente.',url:'https://codepen.io/eutudo94/full/jOZJgKL',image:'./images/buddhaclub.png',x:11.78,z:-4,rotation:Math.PI/2},
    {title:'HuntRed',subtitle:'Desafio de lógica · 100 casas',detail:'Preenche as 100 casas sem repetir: avança três posições na horizontal ou vertical, ou duas na diagonal. Joga no tabuleiro 3D ou abre a versão original.',url:'https://codepen.io/eutudo94/full/MWLVRLM',image:'./images/huntred.png',x:11.78,z:-12,rotation:Math.PI/2},
    {title:'NextSeat',subtitle:'Projeto de aplicação',detail:'Projeto de desenvolvimento de uma aplicação. O código-fonte está disponível no GitHub.',url:'https://github.com/welele94/NextSeatProject',image:'./images/nextseat.png',x:28.22,z:-4,rotation:-Math.PI/2},
    {title:'Help!',subtitle:'Aplicação de apoio e motivação',detail:'Projeto académico de programação orientada a objetos, persistência e interface, com atenção aos princípios SOLID.',url:'https://github.com/welele94/help_app',x:28.22,z:-12,rotation:-Math.PI/2}
  ];
  const frameMaterial=interiorMaterial('brushed',0x3c4650,{metalness:.25});
  const loader=new THREE.TextureLoader();
  function artwork(p){
    const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1536;
    const ctx=canvas.getContext('2d');ctx.scale(2,2);
    const texture=sharpTexture(canvas);
    function draw(image){
      ctx.fillStyle='#f5f3ed';ctx.fillRect(0,0,1024,768);
      ctx.fillStyle='#182d42';ctx.fillRect(32,32,960,490);
      if(image){
        const scale=Math.min(960/image.width,490/image.height);
        const w=image.width*scale,h=image.height*scale;
        ctx.drawImage(image,512-w/2,277-h/2,w,h);
      }else{
        ctx.fillStyle='#fff';ctx.font='bold 100px system-ui';ctx.textAlign='center';
        ctx.fillText(p.title,512,340,880);
      }
      ctx.textAlign='center';ctx.fillStyle='#182d42';ctx.font='bold 104px system-ui';
      ctx.fillText(p.title,512,637,940);
      ctx.font='bold 46px system-ui';ctx.fillText(p.subtitle,512,716,940);
      texture.needsUpdate=true;
    }
    draw(null);
    if(p.image)loader.load(p.image,t=>{draw(t.image);t.dispose();},undefined,()=>{});
    return texture;
  }
  for(const p of projects){
    const frame=new THREE.Group();
    frame.position.set(p.x,1.85,p.z);frame.rotation.y=p.rotation;
    scene.add(frame);
    const backing=new THREE.Mesh(metricBox(3.35,2.55,.10,frameMaterial),frameMaterial);
    frame.add(backing);
    const board=new THREE.Mesh(new THREE.PlaneGeometry(3.20,2.40),
      new THREE.MeshBasicMaterial({map:artwork(p),toneMapped:false}));
    board.position.z=.061;frame.add(board);
    interactables.push({meshes:[board,backing],label:()=> 'Explorar '+p.title,activate:()=>p});
  }
  // Interior tech: revestimento independente para preservar a fachada.
  const charcoal=interiorMaterial('acoustic',0x303641);
  const graphite=interiorMaterial('laminate',0x414955);
  const metal=interiorMaterial('brushed',0x29313b,{metalness:.25});
  const rubber=interiorMaterial('upholstery',0x22262d);
  const neon=(color)=>new THREE.MeshBasicMaterial({color,toneMapped:false});
  const cyan=neon(0x19dcff),purple=neon(0xa45bff),pink=neon(0xff459d);
  solid(.045,8.9,19.5,11.75,4.5,-8,charcoal);
  solid(.045,8.9,19.5,28.25,4.5,-8,charcoal);
  solid(16.45,8.9,.045,20,4.5,-17.74,charcoal);
  for(const x of [15.05,24.95])solid(7.06,8.9,.045,x,4.5,1.75,charcoal);
  // Rodapés e linhas RGB altas, sem bloquear os quadros ou a entrada.
  for(const x of [11.80,28.20]){
    solid(.08,.16,19.45,x,.26,-8,graphite);
    solid(.06,.065,19.35,x,3.65,-8,cyan);
    solid(.06,.065,19.35,x,6.9,-8,purple);
    for(const z of [-16,-8,0]){
      solid(.10,3.05,.18,x,1.72,z,graphite);
      solid(.12,2.85,.035,x,1.72,z, z===-8?pink:purple);
    }
  }
  solid(16.3,.07,.07,20,3.65,-17.66,cyan);
  solid(16.3,.07,.07,20,6.9,-17.66,purple);
  // Juntas discretas do pavimento, sem colisão.
  for(let x=12.5;x<28;x+=2)solid(.018,.005,19.4,x,.184,-8,metal);
  for(let z=-17;z<2;z+=2)solid(16.4,.005,.018,20,.184,z,metal);
  // Pórtico de entrada e painéis de parede de fundo.
  for(const x of [18.35,21.65])solid(.08,2.4,.09,x,1.4,1.70,cyan);
  solid(3.38,.06,.09,20,2.62,1.70,purple);
  for(let x=12.2;x<28;x+=.48)solid(.14,2.0,.12,x,5.05,-17.60,graphite);
  const labSign=new THREE.Mesh(new THREE.PlaneGeometry(6.4,2.1),new THREE.MeshBasicMaterial({map:signTexture('PROJETOS','CODE · CREATE · EXPLORE'),toneMapped:false}));
  labSign.position.set(20,4.35,-17.43);scene.add(labSign);

  // Teto escuro com vigas e luminárias; ocultável em vista aérea.
  const ceilingDetails=new THREE.Group();scene.add(ceilingDetails);
  function ceilingPiece(w,h,d,x,y,z,material){
    const mesh=new THREE.Mesh(metricBox(w,h,d,material),material);
    mesh.position.set(x,y,z);ceilingDetails.add(mesh);return mesh;
  }
  for(const z of [-15,-10,-5,0]){
    ceilingPiece(16.4,.24,.32,20,8.85,z,metal);
    ceilingPiece(14.8,.045,.07,20,8.70,z,z===-10||z===0?purple:cyan);
  }
  // Revestimento do teto por baixo da cobertura, mantém o exterior intacto.
  const ceilingFinish=interiorMaterial('acoustic',0x20252d);
  ceilingPiece(16.40,.065,19.35,20,8.96,-8,ceilingFinish);
  // Juntas entre painéis do revestimento, acima dos quadros e da circulação.
  for(const z of [-14,-10,-6,-2])ceilingPiece(16.30,.025,.025,20,8.915,z,metal);
  // NextSeat: exposição dedicada, fora do corredor central.
  solid(3.2,.95,2.25,24.8,.655,-5.7,graphite,true);
  solid(3.25,.065,2.3,24.8,1.165,-5.7,cyan);
  // Maquete de avião comercial, referência visual ao NextSeat.
  const aircraft=new THREE.Group();aircraft.position.set(24.8,1.78,-5.7);scene.add(aircraft);
  const fuselageMat=new THREE.MeshStandardMaterial({color:0xe5eaf2,metalness:.18,roughness:.42});
  const aircraftBlue=new THREE.MeshStandardMaterial({color:0x3179be,roughness:.5});
  function airMesh(geometry,material,x,y,z){
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;aircraft.add(mesh);return mesh;
  }
  const body=airMesh(new THREE.CapsuleGeometry(.125,1.28,6,16),fuselageMat,0,0,0);
  body.rotation.z=Math.PI/2;
  function wing(points,material,y){
    const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);
    for(const p of points.slice(1))shape.lineTo(p[0],p[1]);shape.closePath();
    const mesh=airMesh(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false}),material,0,y,0);
    mesh.rotation.x=-Math.PI/2;
  }
  for(const side of [-1,1]){
    wing([[.25,0],[-.32,side*.66],[-.53,side*.66],[-.25,0]],fuselageMat,-.035);
    wing([[-.49,0],[-.72,side*.29],[-.79,side*.29],[-.74,0]],aircraftBlue,.025);
    const engine=airMesh(new THREE.CylinderGeometry(.067,.067,.25,16),aircraftBlue,-.04,-.09,side*.32);
    engine.rotation.z=Math.PI/2;
    for(let k=0;k<9;k++)airMesh(new THREE.BoxGeometry(.042,.036,.018),metal,-.47+k*.105,.035,side*.119);
  }
  const finShape=new THREE.Shape();finShape.moveTo(-.75,0);finShape.lineTo(-.70,.30);finShape.lineTo(-.52,.30);finShape.lineTo(-.40,0);finShape.closePath();
  airMesh(new THREE.ExtrudeGeometry(finShape,{depth:.035,bevelEnabled:false}),aircraftBlue,0,.04,-.0175);
  airMesh(new THREE.SphereGeometry(.064,12,8),metal,.60,.075,0);
  solid(.48,.055,.48,24.8,1.215,-5.7,metal);
  solid(.055,.50,.055,24.8,1.49,-5.7,graphite);
  // HuntRed: tabuleiro jogável no chão, uma única textura e um único mesh.
  const boardX=12.1,boardZ=-16.6,cellSize=.68,boardSize=10*cellSize;
  const boardCanvas=document.createElement('canvas');boardCanvas.width=2048;boardCanvas.height=2048;
  const boardCtx=boardCanvas.getContext('2d'),boardTexture=sharpTexture(boardCanvas);
  const boardMesh=new THREE.Mesh(new THREE.PlaneGeometry(boardSize,boardSize),new THREE.MeshBasicMaterial({map:boardTexture,toneMapped:false}));
  boardMesh.userData.decoration=true;boardMesh.rotation.x=-Math.PI/2;boardMesh.position.set(boardX+boardSize/2,.196,boardZ+boardSize/2);scene.add(boardMesh);
  const red=neon(0xf25050);
  for(const z of [boardZ-.035,boardZ+boardSize+.035])solid(boardSize+.14,.018,.05,boardX+boardSize/2,.197,z,red);
  for(const x of [boardX-.035,boardX+boardSize+.035])solid(.05,.018,boardSize,x,.197,boardZ+boardSize/2,red);
  const values=new Uint8Array(100);let last=-1,score=0,hover=-1,error=-1,errorUntil=0,allowed=new Set();
  const hud=document.createElement('div');
  hud.style.cssText='position:fixed;left:16px;bottom:80px;z-index:6;max-width:330px;background:#151a24ed;color:#fff;padding:12px 16px;border:1px solid #f25050;border-radius:8px;font:14px/1.5 system-ui;pointer-events:none;white-space:pre-line';
  hud.hidden=true;document.body.appendChild(hud);
  function legal(from,to){
    if(from<0||to<0||values[to])return false;
    const dr=Math.abs(Math.floor(from/10)-Math.floor(to/10)),dc=Math.abs(from%10-to%10);
    return (dr===0&&dc===3)||(dr===3&&dc===0)||(dr===2&&dc===2);
  }
  function redraw(){
    const n=boardCanvas.width/10;
    boardCtx.fillStyle='#151a24';boardCtx.fillRect(0,0,2048,2048);
    boardCtx.textAlign='center';boardCtx.textBaseline='middle';boardCtx.font='bold 112px system-ui';
    for(let k=0;k<100;k++){
      const x=k%10*n,y=Math.floor(k/10)*n;
      boardCtx.fillStyle=k===error?'#f27059':values[k]?'#ffcc00':allowed.has(k)?'#ffeb99':'#f5f5f5';
      boardCtx.fillRect(x+5,y+5,n-10,n-10);
      
      if(values[k]){boardCtx.fillStyle='#282015';boardCtx.fillText(String(values[k]),x+n/2,y+n/2);}
    }
    boardTexture.needsUpdate=true;
    const status=score===100?'Parabéns! Completaste o HuntRed.':score>0&&!allowed.size?'Sem movimentos válidos. Resultado: '+score+'/100':score===0?'Escolhe qualquer casa para começar.':'Escolhe uma casa amarela clara.';
    hud.textContent='HuntRed   '+score+' / 100\n'+status+'\nMira + E ou clique — marcar · F — reiniciar\nSalta 2 casas em linha ou 1 na diagonal.';
  }
  function play(){
    if(hover<0||score===100||(score>0&&!allowed.size))return;
    if(score>0&&!legal(last,hover)){error=hover;errorUntil=performance.now()+500;redraw();return;}
    values[hover]=++score;last=hover;error=-1;allowed=new Set();
    for(let k=0;k<100;k++)if(legal(last,k))allowed.add(k);
    redraw();
  }
  function resetHunt(){values.fill(0);last=-1;score=0;error=-1;allowed.clear();redraw();}
  // Seleção por mira central: interseção com o plano do tabuleiro.
  // O contorno é uma geometria leve e não obriga a redesenhar a textura ao mirar.
  const aimRay=new THREE.Raycaster(),aimCenter=new THREE.Vector2(0,0);
  const aimOutline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.32,0,-.32),new THREE.Vector3(.32,0,-.32),
    new THREE.Vector3(.32,0,.32),new THREE.Vector3(-.32,0,.32)
  ]),new THREE.LineBasicMaterial({color:0xe13434,toneMapped:false}));
  aimOutline.visible=false;aimOutline.userData.decoration=true;scene.add(aimOutline);
  function nearHunt(position,mode){
    return mode==='first'&&position.x>11.8&&position.x<20.5&&position.z>-17.7&&position.z<-8.2;
  }
  function aimedCell(position,mode,camera){
    if(!camera||!nearHunt(position,mode))return -1;
    camera.updateMatrixWorld(true);
    aimRay.setFromCamera(aimCenter,camera);aimRay.far=9;
    const hit=aimRay.intersectObject(boardMesh,false)[0];
    if(!hit)return -1;
    const col=Math.floor((hit.point.x-boardX)/cellSize),row=Math.floor((hit.point.z-boardZ)/cellSize);
    return col>=0&&col<10&&row>=0&&row<10?row*10+col:-1;
  }
  function huntAction(position,mode,camera){
    const cell=aimedCell(position,mode,camera);
    if(cell<0)return null;
    return {label:()=>score===100?'HuntRed concluído':score>0&&!allowed.size?'HuntRed — F para reiniciar':'Marcar casa no HuntRed',activate:()=>{hover=cell;play();}};
  }
  function updateHunt(position,mode,camera){
    hud.hidden=!nearHunt(position,mode);
    hover=aimedCell(position,mode,camera);
    aimOutline.visible=hover>=0;
    if(hover>=0)aimOutline.position.set(boardX+(hover%10+.5)*cellSize,.207,boardZ+(Math.floor(hover/10)+.5)*cellSize);
    if(error>=0&&performance.now()>errorUntil){error=-1;redraw();}
  }
  redraw();
  const huntSign=new THREE.Mesh(new THREE.PlaneGeometry(5.5,1.15),new THREE.MeshBasicMaterial({map:signTexture('HuntRed','100 casas · E para jogar'),toneMapped:false}));
  huntSign.position.set(15.5,2.8,-17.63);scene.add(huntSign);
  // Help! e Buddha Club: bases dedicadas, reservadas para os modelos finais.
  solid(2.4,.78,1.25,25.9,.57,-12.1,graphite,true);
  solid(2.45,.045,1.30,25.9,.99,-12.1,neon(0x54f19a));
  solid(2.4,.78,1.25,14.4,.57,-3.6,graphite,true);
  solid(2.45,.045,1.30,14.4,.99,-3.6,purple);
  const labLights=[];
  // Luzes locais coloridas, sem sombras adicionais pesadas.
  for(const [x,z,color] of [[12.5,-7,0x15bfff],[27.5,-7,0x9b45ff],[20,-15,0x536bff]]){
    const light=new THREE.PointLight(color,15,9,2);
    light.position.set(x,3.4,z);light.visible=false;labLights.push(light);scene.add(light);
  }
  const mainLight=new THREE.PointLight(0xa4c4ff,4,13);
  mainLight.position.set(20,4.2,-8);mainLight.visible=false;labLights.push(mainLight);scene.add(mainLight);

  // O teto permanece fechado em primeira pessoa; apenas a vista aérea permite inspeção.
  function update(dt,position,mode='first',camera){
    updateHunt(position,mode,camera);
    aircraft.rotation.y+=dt*.55;
    const targetAngle=doorOpen?Math.PI/2:0;
    const next=angle+Math.sign(targetAngle-angle)*Math.min(Math.abs(targetAngle-angle),dt*2.2);
    // Não empurrar nem prender o jogador durante a animação.
    if(!touchesDoor(position,next)){angle=next;syncDoor(angle);}
    const inside=position.x>11.7 && position.x<28.3 && position.z>-17.75 && position.z<1.85;
    for(const light of labLights)light.visible=inside&&mode==='first';
    roof.visible=mode!=='aerial'||!inside;
    ceilingDetails.visible=roof.visible;
    return inside;
  }
  return {update,projects,interactables,huntAction,resetHunt,nearHunt};
}
