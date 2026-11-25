import * as THREE from 'three';

// Centro Tecnológico — primeira sala transitável, 1 unidade = 1 metro.
// Os retângulos de colisão correspondem às paredes; a entrada não tem colisão.
export function createProjectsHall({scene, obstacles}) {
  const cx=20, cz=-8, width=17, depth=20, height=9;
  const wallMaterial=new THREE.MeshStandardMaterial({color:0xdce5e9,roughness:.8});
  const floorMaterial=new THREE.MeshStandardMaterial({color:0x71828b,roughness:.85});
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
  const mainLight=new THREE.PointLight(0xe1f5ff,7,18);
  mainLight.position.set(20,5,-8);scene.add(mainLight);

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
