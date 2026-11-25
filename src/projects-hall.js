import * as THREE from 'three';

// Centro Tecnológico — primeira sala transitável, 1 unidade = 1 metro.
// Os retângulos de colisão correspondem às paredes; a entrada não tem colisão.
export function createProjectsHall({scene, obstacles}) {
  const cx=20, cz=-8, width=17, depth=20, height=9;
  const wallMaterial=new THREE.MeshStandardMaterial({color:0xdce5e9,roughness:.8});
  const floorMaterial=new THREE.MeshStandardMaterial({color:0x222831,roughness:.82});
  const roofMaterial=new THREE.MeshStandardMaterial({
    color:0x2874ac,roughness:.7,transparent:true,opacity:1,depthWrite:false
  });
  const accent=new THREE.MeshStandardMaterial({color:0x36b8ec,emissive:0x124967,emissiveIntensity:.4});
  const stationMaterial=new THREE.MeshStandardMaterial({color:0x183149,roughness:.6});
  function solid(w,h,d,x,y,z,material,collision=false) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);
    mesh.castShadow=material!==roofMaterial;
    mesh.receiveShadow=true;
    scene.add(mesh);
    if(collision)obstacles.push({type:'box',x,z,w,d});
    return mesh;
  }
  function signTexture(title,subtitle) {
    const canvas=document.createElement('canvas'); canvas.width=1024;canvas.height=512;
    const c=canvas.getContext('2d');
    c.fillStyle='#18304b';c.fillRect(0,0,1024,512);
    c.fillStyle='#58dcfb';c.fillRect(18,18,988,12);
    c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';
    c.font='bold 74px system-ui';c.fillText(title,512,206,940);
    c.fillStyle='#a2daed';c.font='36px system-ui';c.fillText(subtitle,512,314,940);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
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
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.39,2.25,.10),stationMaterial);
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
    new THREE.MeshBasicMaterial({map:signTexture('CENTRO TECNOLÓGICO','Projetos · Entra e explora'),side:THREE.DoubleSide}));
  nameSign.position.set(cx,5.6,2.27);scene.add(nameSign);

  const interactables=[doorAction];
  // Galeria: quatro quadros à altura dos olhos, dois em cada parede lateral.
  const projects=[
    {title:'Buddha Club',subtitle:'Onde tudo começou',detail:'O meu primeiro projeto, desenvolvido antes de utilizar inteligência artificial. Um trabalho de que me orgulho especialmente.',url:'https://codepen.io/eutudo94/full/jOZJgKL',image:'./images/buddhaclub.png',x:11.78,z:-4,rotation:Math.PI/2},
    {title:'Hunt Red',subtitle:'Projeto web',detail:'Um projeto de desenvolvimento web disponível no CodePen.',url:'https://codepen.io/eutudo94/full/MWLVRLM',image:'./images/huntred.png',x:11.78,z:-12,rotation:Math.PI/2},
    {title:'NextSeat',subtitle:'Projeto de aplicação',detail:'Projeto de desenvolvimento de uma aplicação. O código-fonte está disponível no GitHub.',url:'https://github.com/welele94/NextSeatProject',image:'./images/nextseat.png',x:28.22,z:-4,rotation:-Math.PI/2},
    {title:'Help!',subtitle:'Aplicação de apoio e motivação',detail:'Projeto académico de programação orientada a objetos, persistência e interface, com atenção aos princípios SOLID.',url:'https://github.com/welele94/help_app',x:28.22,z:-12,rotation:-Math.PI/2}
  ];
  const frameMaterial=new THREE.MeshStandardMaterial({color:0x263440,roughness:.8});
  const loader=new THREE.TextureLoader();
  function artwork(p){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=768;
    const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    function draw(image){
      ctx.fillStyle='#f5f3ed';ctx.fillRect(0,0,1024,768);
      ctx.fillStyle='#182d42';ctx.fillRect(32,32,960,570);
      if(image){
        const scale=Math.min(960/image.width,570/image.height);
        const w=image.width*scale,h=image.height*scale;
        ctx.drawImage(image,512-w/2,317-h/2,w,h);
      }else{
        ctx.fillStyle='#fff';ctx.font='bold 100px system-ui';ctx.textAlign='center';
        ctx.fillText(p.title,512,340,880);
      }
      ctx.textAlign='center';ctx.fillStyle='#182d42';ctx.font='bold 54px system-ui';
      ctx.fillText(p.title,512,671,940);
      ctx.font='30px system-ui';ctx.fillText(p.subtitle,512,725,940);
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
    const backing=new THREE.Mesh(new THREE.BoxGeometry(3.35,2.55,.10),frameMaterial);
    frame.add(backing);
    const board=new THREE.Mesh(new THREE.PlaneGeometry(3.20,2.40),
      new THREE.MeshBasicMaterial({map:artwork(p),toneMapped:false}));
    board.position.z=.061;frame.add(board);
    interactables.push({meshes:[board,backing],label:()=> 'Explorar '+p.title,activate:()=>p});
  }
  // Interior tech: revestimento independente para preservar a fachada.
  const charcoal=new THREE.MeshStandardMaterial({color:0x11151e,roughness:.9});
  const graphite=new THREE.MeshStandardMaterial({color:0x272e39,roughness:.75});
  const metal=new THREE.MeshStandardMaterial({color:0x0d1118,metalness:.35,roughness:.45});
  const rubber=new THREE.MeshStandardMaterial({color:0x080b10,roughness:1});
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
  const labSign=new THREE.Mesh(new THREE.PlaneGeometry(6.4,1.1),new THREE.MeshBasicMaterial({map:signTexture('DEV LAB','CODE · CREATE · EXPLORE'),toneMapped:false}));
  labSign.position.set(20,4.05,-17.48);scene.add(labSign);

  // Texturas procedurais: terminais e editores fictícios, sem dependências.
  function screenMaterial(kind){
    const c=document.createElement('canvas');c.width=768;c.height=432;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#080e18';ctx.fillRect(0,0,768,432);
    ctx.fillStyle='#202c3c';ctx.fillRect(0,0,768,34);
    for(let i=0;i<3;i++){ctx.fillStyle=['#fa6e83','#ffcf70','#62dbad'][i];ctx.beginPath();ctx.arc(16+i*18,17,5,0,Math.PI*2);ctx.fill();}
    ctx.font='17px monospace';ctx.fillStyle='#b8c8de';ctx.fillText(kind===0?'workspace / main.js':kind===1?'dev@lab: ~/projects':'SYSTEM MONITOR',95,23);
    const lines=kind===0?['import * as THREE from "three";','','const scene = new THREE.Scene();','const camera = createCamera();','const renderer = createRenderer();','','function animate(dt) {','  world.update(dt);','  renderer.render(scene, camera);','}','','// build something new','export { scene, camera };']:kind===1?['$ npm run dev','[OK] Starting local workspace','[OK] Assets loaded','[OK] Scene initialized','','$ git status','On branch main','Working tree clean','','$ node diagnostics.js','[OK] Render pipeline ready','[OK] All systems online','dev@lab:~$ _']:['CPU / GPU TELEMETRY','=======================','CPU   [|||||||||     ]  64%','GPU   [|||||||||||   ]  78%','RAM   [||||||        ]  43%','','RENDER ENGINE: ONLINE','NETWORK: CONNECTED','BUILD: SUCCESS','','FRAME BUFFER: READY','STATUS: NOMINAL'];
    for(let j=0;j<lines.length;j++){
      ctx.fillStyle=kind===0?['#80d6ff','#c3a6ff','#9de7b5'][j%3]:kind===1?'#65e8a5':'#56d5ee';
      ctx.fillText(lines[j],24,67+j*25);
    }
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
  }
  const screens=[screenMaterial(0),screenMaterial(1),screenMaterial(2)];
  // Três estações de trabalho junto ao fundo, monitores voltados à entrada.
  // Colisões só nos móveis ao nível do jogador.
  for(let i=0;i<3;i++){
    const x=15.3+i*4.7,z=-15.5;
    const led=i===1?purple:cyan;
    solid(3.55,.10,1.30,x,.94,z,graphite,true);
    for(const dx of [-1.55,1.55])solid(.14,.84,1.08,x+dx,.55,z,metal);
    solid(3.38,.035,.035,x,.87,z+.67,led);
    // Dois monitores, com pé, moldura e conteúdo legível.
    for(let j=0;j<2;j++){
      const mx=x-.69+j*1.10,mz=z-.40;
      solid(.42,.04,.27,mx,1.02,mz,metal);
      solid(.09,.25,.09,mx,1.17,mz,metal);
      solid(1.04,.62,.095,mx,1.57,mz,metal);
      const display=new THREE.Mesh(new THREE.PlaneGeometry(.97,.55),screens[(i+j)%3]);
      display.position.set(mx,1.57,mz+.051);scene.add(display);
    }
    // Torre com painel RGB, teclado e rato.
    solid(.39,.73,.64,x+1.43,.56,z-.18,metal);
    solid(.29,.54,.018,x+1.43,.58,z+.151,graphite);
    for(const dy of [-.15,.11]){
      const fan=new THREE.Mesh(new THREE.TorusGeometry(.102,.016,8,24),led);
      fan.position.set(x+1.43,.58+dy,z+.166);scene.add(fan);
    }
    solid(.52,.035,.18,x-.15,1.015,z+.30,rubber);
    for(let k=0;k<4;k++)for(let j=0;j<10;j++)solid(.043,.014,.032,x-.37+j*.048,1.039,z+.238+k*.043,graphite);
    solid(.10,.045,.16,x+.43,1.025,z+.30,metal);
    solid(.022,.008,.08,x+.43,1.05,z+.30,led);
    // Cadeira de escritório virada para a secretária.
    const chairZ=z+1.40;
    solid(.61,.13,.62,x,.66,chairZ,rubber,true);
    solid(.58,.76,.13,x,1.08,chairZ+.28,graphite);
    solid(.10,.46,.10,x,.38,chairZ,metal);
    solid(.68,.065,.095,x,.21,chairZ,metal);
    solid(.095,.065,.68,x,.21,chairZ,metal);
    for(const dx of [-.35,.35])solid(.09,.10,.48,x+dx,.94,chairZ,metal);
  }
  // Luzes locais coloridas, sem sombras adicionais pesadas.
  for(const [x,z,color] of [[12.5,-7,0x15bfff],[27.5,-7,0x9b45ff],[20,-15,0x536bff]]){
    const light=new THREE.PointLight(color,15,9,2);
    light.position.set(x,3.4,z);scene.add(light);
  }
  const mainLight=new THREE.PointLight(0xa4c4ff,4,13);
  mainLight.position.set(20,4.2,-8);scene.add(mainLight);

  // Quando o jogador entra (mesmo em vista aérea), o teto desaparece gradualmente.
  let target=1, opacity=1;
  function update(dt,position){
    const targetAngle=doorOpen?Math.PI/2:0;
    const next=angle+Math.sign(targetAngle-angle)*Math.min(Math.abs(targetAngle-angle),dt*2.2);
    // Não empurrar nem prender o jogador durante a animação.
    if(!touchesDoor(position,next)){angle=next;syncDoor(angle);}
    const inside=position.x>11.7 && position.x<28.3 && position.z>-17.75 && position.z<1.85;
    target=inside?.025:1;
    const k=1-Math.exp(-dt*3);
    opacity+=(target-opacity)*k;
    roofMaterial.opacity=opacity;
    roof.visible=opacity>.035;
    return inside;
  }
  return {update,projects,interactables};
}
