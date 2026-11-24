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
  const panelMaterial=new THREE.MeshStandardMaterial({color:0x1b3656,emissive:0x0a1e39,emissiveIntensity:.4});
  const white=new THREE.MeshStandardMaterial({color:0xf4f1e9});
  const interiorLights=[];
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
  const projects=[
    {title:'Help! App',subtitle:'Aplicação de apoio e motivação',detail:'Aplicação desenvolvida para explorar programação orientada a objetos, persistência e interface. Projeto académico em evolução.',url:'https://github.com/welele94/help_app',x:15.1,z:-7.3},
    {title:'Geneva Drive',subtitle:'Animação e computação gráfica',detail:'Estudo e implementação de um mecanismo de engrenagens e cruz de Malta em Three.js, com medição de movimentos, luz e câmara.',url:'https://github.com/welele94/efoliocomputacaografia2627',x:20,z:-13.1},
    {title:'PortfolioProject',subtitle:'Este mundo em Three.js',detail:'Portfólio interativo com navegação 3D em tempo real, colisões, ambientes e transições de teto. Evolução e documentação no GitHub.',url:'https://github.com/welele94/portfolioproject',x:24.9,z:-7.3}
  ];
  for(const p of projects){
    solid(3.6,.85,2.1,p.x,.5,p.z,stationMaterial,true);
    solid(3.2,.12,1.9,p.x,1.02,p.z,accent);
    const board=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.7),
      new THREE.MeshBasicMaterial({map:signTexture(p.title,p.subtitle),side:THREE.DoubleSide}));
    board.position.set(p.x,2.35,p.z-.65);
    scene.add(board);
    interactables.push({meshes:[board],label:()=> 'Explorar '+p.title,activate:()=>p});
    solid(.16,1.25,.16,p.x,1.67,p.z-.7,stationMaterial);
    const spotlight=new THREE.PointLight(0x7acfff,4,7);
    spotlight.position.set(p.x,4.1,p.z);scene.add(spotlight);interiorLights.push(spotlight);
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
  function nearest(position){
    const inside=position.x>11.7 && position.x<28.3 && position.z>-17.75 && position.z<1.85;
    if(!inside)return null;
    const near=projects.map(p=>({p,dist:Math.hypot(position.x-p.x,position.z-p.z)})).sort((a,b)=>a.dist-b.dist)[0];
    return near?.dist<=2.7?near.p:null;
  }
  return {update,nearest,projects,interactables};
}
