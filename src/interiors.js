import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { dutchFacade } from './architecture.js';
import { exteriorMaterial, interiorMaterial, metricBox } from './materials.js';

// Modelação procedural dos interiores. Todas as dimensões em metros.
export function createInteriors({scene,obstacles}){
  const interactables=[],rooms=[],internalDoors=[];
  const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.78});
  const oak=mat(0xb78a58),dark=mat(0x303b48),white=mat(0xece9df),black=mat(0x151b21),steel=mat(0x687785),blue=mat(0x276ba5),yellow=mat(0xe7ae28),cardboard=mat(0xb38a5d),fabric=mat(0x708881);
  const lit=new THREE.MeshBasicMaterial({color:0xe9f3ff});
  function room({x,z,w,d,h,wall,roof,floor,doorWidth=1.6,interiorWall=wall}){
    const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
    const top=new THREE.Group();group.add(top);
    const localLights=[];
    function box(W,H,D,X,Y,Z,M,collide=false,parent=group){
      const o=new THREE.Mesh(metricBox(W,H,D,M),M);
      o.position.set(X,Y,Z);o.castShadow=parent!==top;o.receiveShadow=true;parent.add(o);
      if(collide)obstacles.push({type:'box',x:x+X,z:z+Z,w:W,d:D});return o;
    }
    const t=.22,front=d/2,side=(w-doorWidth)/2;
    box(w,.16,d,0,.08,0,floor);
    box(t,h,d,-w/2+t/2,h/2,0,wall,true);box(t,h,d,w/2-t/2,h/2,0,wall,true);
    box(w,h,t,0,h/2,-d/2+t/2,wall,true);
    for(const sign of [-1,1])box(side,h,t,sign*(doorWidth/2+side/2),h/2,front-t/2,wall,true);
    box(doorWidth,h-2.35,t,0,(h+2.35)/2,front-t/2,wall);
    box(w+.35,.36,d+.35,0,h+.18,0,roof,false,top);
    // Porta articulada: collider orientado acompanha a folha.
    const hinge=new THREE.Group();hinge.position.set(-doorWidth/2,.16,front-t/2);group.add(hinge);
    const leaf=box(doorWidth-.035,2.18,.085,(doorWidth-.035)/2,1.09,0,dark,false,hinge);
    const handle=box(.08,.15,.15,doorWidth-.19,1.0,0,steel,false,hinge);
    const col={type:'oriented',x:0,z:0,w:doorWidth-.035,d:.085,angle:0};obstacles.push(col);
    let angle=0,open=false;
    const half=col.w/2;
    function center(a){return {x:x+hinge.position.x+half*Math.cos(a),z:z+hinge.position.z-half*Math.sin(a)};}
    function sync(a){hinge.rotation.y=a;Object.assign(col,center(a),{angle:a});}
    sync(0);
    interactables.push({meshes:[leaf,handle],label:()=>open?'Fechar porta':'Abrir porta',activate:()=>{open=!open;}});
    function update(dt,p,mode){
      const goal=open?Math.PI/2:0;
      const a=angle+Math.sign(goal-angle)*Math.min(Math.abs(goal-angle),dt*2);
      const q=center(a),dx=p.x-q.x,dz=p.z-q.z,co=Math.cos(a),si=Math.sin(a);
      const lx=dx*co-dz*si,lz=dx*si+dz*co;
      if(Math.hypot(Math.max(0,Math.abs(lx)-half),Math.max(0,Math.abs(lz)-.043))>.36){angle=a;sync(a);}
      const inside=Math.abs(p.x-x)<w/2&&Math.abs(p.z-z)<d/2;
      top.visible=!(inside&&mode==='aerial');
      const nearby=mode==='first'&&Math.abs(p.x-x)<w/2+2&&Math.abs(p.z-z)<d/2+2;
      // Só as duas luzes mais próximas entram no shader global.
      const closest=nearby?localLights.slice().sort((a,b)=>Math.hypot(p.x-x-a.position.x,p.z-z-a.position.z)-Math.hypot(p.x-x-b.position.x,p.z-z-b.position.z)).slice(0,2):[];
      for(const l of localLights)l.visible=closest.includes(l);
    }
    rooms.push({update});
    function light(X,Z,color=0xffecd4){const l=new THREE.PointLight(color,18,8,2);l.position.set(X,3.0,Z);l.visible=false;localLights.push(l);group.add(l);box(.85,.06,.36,X,h-.12,Z,lit,false,top);}
    function partition(W,D,X,Z,H=2.7){box(W,H,D,X,.16+H/2,Z,interiorWall,true);}
    function table(X,Z,W=1.5,D=.75){
      box(W,.09,D,X,.93,Z,oak,true);
      for(const a of [-1,1])for(const b of [-1,1])box(.075,.75,.075,X+a*(W/2-.09),.535,Z+b*(D/2-.09),dark);
    }
    function chair(X,Z,dir=1){
      box(.48,.10,.48,X,.62,Z,fabric,true);box(.48,.48,.085,X,.89,Z+dir*.21,fabric);
      for(const a of [-1,1])for(const b of [-1,1])box(.045,.41,.045,X+a*.18,.365,Z+b*.18,dark);
    }
    function computer(X,Z){
      box(.48,.04,.22,X,.995,Z,black);box(.07,.22,.07,X,1.11,Z,steel);
      box(.64,.39,.07,X,1.36,Z,black);box(.59,.34,.012,X,1.36,Z+.043,blue);
      box(.42,.025,.14,X,.995,Z+.29,black);box(.075,.035,.12,X+.31,1,Z+.29,black);
    }
    function shelf(X,Z,W=1.8){
      box(W,.10,.40,X,2.25,Z,oak);box(.08,2.1,.4,X-W/2+.04,1.2,Z,oak,true);box(.08,2.1,.4,X+W/2-.04,1.2,Z,oak,true);
      obstacles.push({type:'box',x:x+X,z:z+Z,w:W,d:.4});
      for(let j=0;j<4;j++){const Y=.27+j*.53;box(W,.07,.4,X,Y,Z,oak);for(let k=0;k<Math.floor((W-.2)/.14);k++)box(.10,.29+(k%3)*.035,.25,X-W/2+.15+k*.14,Y+.19,Z,[blue,fabric,cardboard,dark][(k+j)%4]);}
    }
    return {box,light,partition,table,chair,computer,shelf,group,top};
  }
  // Apenas o prédio central é a casa. Os vizinhos são cenário.
  for(const [X,color] of [[-25.4,0xc5b4a3],[-12.6,0xd0b3a8]]){
    const body=new THREE.Mesh(metricBox(6.2,7.4,12,{userData:{tileMeters:3}}),exteriorMaterial('plaster',color));
    body.position.set(X,3.7,34);body.castShadow=true;body.receiveShadow=true;scene.add(body);
    obstacles.push({type:'box',x:X,z:34,w:6.2,d:12});
    const roof=new THREE.Mesh(metricBox(6.3,.55,12.3,{userData:{tileMeters:2}}),exteriorMaterial('roof',0xb26954));
    roof.position.set(X,7.675,34);roof.castShadow=true;scene.add(roof);
    const door=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.15,.12),dark);
    door.position.set(X,1.075,40.06);scene.add(door);
    dutchFacade({scene,x:X,z:34,w:6.2,d:12,h:7.4,floors:3});
  }
  {
    const oak=interiorMaterial('wood',0xe8c69b),fabric=interiorMaterial('upholstery',0x9ca99b);
    const white=interiorMaterial('laminate',0xfffdf5),dark=interiorMaterial('laminate',0x4c4946);
    const steel=interiorMaterial('brushed',0xc4c9cf,{metalness:.25});
    const warmWall=interiorMaterial('plaster',0xfff6e7),trim=interiorMaterial('laminate',0xf3eee3);
    const r=room({x:-19,z:34,w:6.2,d:12,h:7.4,wall:warmWall,interiorWall:warmWall,roof:exteriorMaterial('roof',0xb26954),floor:interiorMaterial('parquet',0xffffff)});
    const {box,light,partition,table,chair}=r;
    dutchFacade({scene,x:-19,z:34,w:6.2,d:12,h:7.4,floors:3,roofParent:r.top});
    light(0,3);light(0,-.8);light(0,-4);
    // Teto à escala doméstica; a fachada mantém os pisos exteriores decorativos.
    box(5.76,.10,11.56,0,3.18,0,warmWall,false,r.top);
    for(const X of [-2.84,2.84])box(.065,.13,11.5,X,.225,0,trim);
    box(5.7,.13,.065,0,.225,-5.84,trim);
    // Azulejos e pavimento cerâmico na zona da cozinha.
    const ceramic=interiorMaterial('ceramic',0xf0f0eb);
    box(1.48,.018,3.6,-2.16,.172,-.10,ceramic);
    box(.025,.68,2.8,-2.965,1.44,-.30,ceramic);
    // Painéis interiores decorativos que correspondem às janelas da fachada.
    const pane=mat(0x7794aa);
    for(const Z of [3.9,.8,-2.3,-4.8]){
      box(.045,1.30,1.08,-2.86,1.82,Z,trim);
      box(.025,1.17,.95,-2.83,1.82,Z,pane);
      box(.03,1.18,.05,-2.81,1.82,Z,trim);
    }
    // Abertura do quarto com aro de madeira, sem novo obstáculo na passagem.
    for(const X of [1.09,2.79])box(.075,2.45,.24,X,1.385,-2.05,trim);
    box(1.78,.09,.24,1.94,2.57,-2.05,trim);
    // Sala e cozinha em open space; quarto separado por parede com vão.
    partition(4.0,.16,-.95,-2.05,3);
    box(1.78,.65,.16,1.94,2.835,-2.05,white);
    // Sala junto à entrada, corredor livre pelo centro.
    box(.87,.38,2.35,-2.36,.53,3.3,fabric,true);
    box(.18,.70,2.35,-2.72,.92,3.3,fabric);
    for(const Z of [2.22,4.38])box(.87,.44,.17,-2.36,.86,Z,fabric);
    box(.58,.12,1.05,-1.35,.65,3.3,oak,true);
    box(2.15,.025,2.85,-1.65,.177,3.3,interiorMaterial('upholstery',0xc7b19c));
    box(.40,.48,1.65,2.66,.40,3.4,oak,true);
    box(.08,.92,1.43,2.54,1.10,3.4,black);
    // Cozinha linear e pequena mesa, sem ocupar o acesso ao quarto.
    for(const Z of [-1.35,-.65,.05,.75])box(.60,.82,.67,-2.59,.57,Z,white,true);
    box(.67,.09,2.79,-2.59,1.03,-.30,dark);
    box(.40,.025,.48,-2.59,1.09,-1.15,steel);
    for(const Z of [.25,.60])for(const X of [-2.72,-2.46])box(.20,.015,.20,X,1.09,Z,black);
    box(.69,1.85,.70,-2.50,1.085,1.48,steel,true);
    table(1.85,.1,1.15,.65);chair(1.85,.80,1);
    // Quarto: cama, roupeiro e pequeno posto de trabalho.
    box(1.65,.34,2.10,-1.72,.33,-4.55,oak,true);
    box(1.60,.24,2.05,-1.72,.62,-4.55,white);
    box(1.60,.12,1.35,-1.72,.79,-4.25,fabric);
    box(.66,.12,.38,-1.72,.80,-5.30,white);
    box(1.65,.85,.10,-1.72,.9,-5.61,oak);
    box(.48,.50,.48,-.55,.41,-5.22,oak,true);
    box(1.4,2.05,.60,1.85,1.185,-5.53,oak,true);
    table(1.94,-3.45,1.35,.65);r.computer(1.94,-3.45);chair(1.94,-2.76,1);
  }
  // UAb: duas divisões reais, biblioteca à entrada e sala de aula no fundo.
  {
    const libraryWall=interiorMaterial('plaster',0xe9e5d7);
    const classroomWall=interiorMaterial('plaster',0xe5edf5);
    const libraryFloor=interiorMaterial('parquet',0xe5d3b5);
    const classroomFloor=interiorMaterial('terrazzo',0xf0f2f4);
    const frame=interiorMaterial('brushed',0x536c7e,{metalness:.12});
    const bluePanel=interiorMaterial('acoustic',0x557c9c);
    const r=room({x:20,z:34,w:16,d:13,h:7,wall:libraryWall,interiorWall:libraryWall,roof:exteriorMaterial('metal',0x7d8b98),floor:libraryFloor,doorWidth:2});
    const {box,table,chair,shelf,computer,light,partition,group}=r;
    for(const X of [-5,0,5]){light(X,-3);light(X,3);}
    // Separação física completa: parede espessa e portal de 2 m.
    for(const X of [-4.445,4.445])box(6.89,6.84,.32,X,3.58,.4,libraryWall,true);
    box(2,4.45,.32,0,4.775,.4,libraryWall);
    // Materiais distintos dos dois lados, com soleira e portal em azul UAb.
    box(15.56,.018,6.49,0,.172,-2.845,classroomFloor);
    for(const X of [-4.445,4.445])box(6.89,3.3,.025,X,1.81,.225,classroomWall);
    for(const X of [-1.045,1.045])box(.09,2.39,.43,X,1.355,.4,frame);
    box(2.18,.13,.43,0,2.55,.4,frame);
    box(2,.019,.42,0,.174,.4,frame);
    // Porta articulada de acesso à sala de aula, com colisão dinâmica.
    const hinge=new THREE.Group();hinge.position.set(-.98,.16,.4);group.add(hinge);
    const leaf=box(1.94,2.29,.085,.97,1.145,0,frame,false,hinge);
    const handle=box(.12,.10,.19,1.77,1.0,0,steel,false,hinge);
    const plaque=box(1.38,.29,.025,.97,1.79,.055,white,false,hinge);
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#e7edf2';ctx.fillRect(0,0,512,128);
    ctx.fillStyle='#23384b';ctx.font='bold 54px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('SALA DE AULA',256,64,480);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    const nameMaterial=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});
    const doorSign=new THREE.Mesh(new THREE.PlaneGeometry(1.32,.25),nameMaterial);doorSign.position.set(.97,1.79,.071);hinge.add(doorSign);
    let angle=0,opened=false;
    const collider={type:'oriented',x:20,z:34.4,w:1.94,d:.085,angle:0};obstacles.push(collider);
    const sync=a=>{hinge.rotation.y=a;Object.assign(collider,{x:20-.98+.97*Math.cos(a),z:34.4-.97*Math.sin(a),angle:a});};
    sync(0);
    interactables.push({meshes:[leaf,handle,plaque,doorSign],label:()=>opened?'Fechar sala de aula':'Abrir sala de aula',activate:()=>{opened=!opened;}});
    internalDoors.push((dt,p)=>{
      const goal=opened?Math.PI/2:0,a=angle+Math.sign(goal-angle)*Math.min(Math.abs(goal-angle),dt*2);
      const dx=p.x-(20-.98+.97*Math.cos(a)),dz=p.z-(34.4-.97*Math.sin(a));
      const lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a);
      if(Math.hypot(Math.max(0,Math.abs(lx)-.97),Math.max(0,Math.abs(lz)-.043))>.36){angle=a;sync(a);}
    });
    // Revestimentos próprios e teto mais baixo para distinguir os ambientes.
    for(const X of [-7.86,7.86]){
      box(.025,3.05,6.38,X,1.685,-2.87,classroomWall);
      box(.045,.15,6.38,X,.245,-2.87,frame);
      box(.045,.15,5.75,X,.245,3.34,oak);
    }
    box(15.55,3.05,.025,0,1.685,-6.365,classroomWall);
    box(15.55,.11,5.77,0,3.65,3.34,libraryWall,false,r.top);
    box(15.55,.11,6.35,0,3.48,-2.95,classroomWall,false,r.top);
    for(const X of [-5.2,0,5.2]){
      box(2.2,.055,.22,X,3.56,3.1,lit,false,r.top);
      box(2.2,.055,.22,X,3.39,-3.0,lit,false,r.top);
    }
    for(const X of [-5.8,5.8])box(3.0,1.25,.04,X,2.40,-6.32,bluePanel);
    // Faixa de cor na biblioteca e painel de referência na sala de aulas.
    for(const X of [-4.5,4.5])box(6.7,.24,.035,X,2.85,.58,oak);
    box(4.95,.11,.08,0,3.1,-6.23,frame);
    // Biblioteca: estantes junto à divisória e mesas de leitura.
    for(const X of [-6.4,-4.4,4.4,6.4])shelf(X,.78,1.8);
    for(const X of [-5.0,5.0]){
      table(X,3.2,2.1,1.0);chair(X-.5,4.1);chair(X+.5,4.1);
      chair(X-.5,2.3,-1);chair(X+.5,2.3,-1);
    }
    // Sala de aula: filas de mesas orientadas para o quadro.
    for(const X of [-5.2,-2.1,2.1,5.2])for(const Z of [-1.2,-3.25]){
      table(X,Z,1.7,.70);chair(X,Z+.75);
    }
    box(4.8,1.6,.09,0,2.1,-6.27,dark);
    box(4.6,1.42,.018,0,2.1,-6.21,white);
    table(0,-5.0,2.0,.75);computer(0,-5.0);
    // Identificação de ambas as divisões com texto grande.
    for(const [name,Z,rotation] of [['SALA DE AULA',.58,0],['BIBLIOTECA',.22,Math.PI]]){
      const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#23384b';ctx.fillRect(0,0,1024,256);
      ctx.fillStyle='#fff';ctx.font='bold 115px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,512,128,970);
      const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=16;
      const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.0,.75),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));
      sign.position.set(0,3.15,Z);sign.rotation.y=rotation;group.add(sign);
    }
  }
  // Dachser: 70% do comprimento em X para armazém, 30% para escritório.
  {
    const industrialFloor=interiorMaterial('epoxy',0x92989c,{roughness:.65});
    const r=room({x:0,z:-56,w:51,d:26,h:10,wall:exteriorMaterial('concrete',0xe0e2e4),roof:exteriorMaterial('metal',0x57616b),floor:industrialFloor,doorWidth:2.8});
    const {box,partition,table,chair,computer,light}=r;
    const split=10.2;
    const stripe=mat(0xe5b632),officeFloor=interiorMaterial('terrazzo',0xf2f1e8);
    // Escritório separado por parede completa e entrada junto à fachada sul.
    partition(.22,21.69,split,-2.045,9.84);partition(.22,1.49,split,12.035,9.84);
    box(.22,7.44,2.6,split,6.28,9.99,white);
    box(14.85,.018,25.55,17.73,.172,0,officeFloor);
    box(14.85,.10,25.55,17.73,3.55,0,white,false,r.top);
    for(const X of [-20,-11,-2,7,18])for(const Z of [-8,2,9])light(X,Z,0xe8f2ff);
    const rackStart=r.group.children.length;
    // Racks com quatro níveis, corredores de 3–4 m e paletes em escala humana.
    for(const X of [-22,-16,-10,-4,2,7])for(const Z of [-9,-4,1]){
      const W=2.2,D=3.8;
      obstacles.push({type:'box',x:X,z:-56+Z,w:W,d:D});
      for(const a of [-1,1])for(const b of [-1,1])box(.12,6.2,.12,X+a*1.04,3.26,Z+b*1.82,blue);
      for(const Y of [.26,1.80,3.34,4.88]){
        box(W,.13,D,X,Y,Z,yellow);
        for(const P of [-1.2,0,1.2]){
          for(let k=0;k<3;k++)box(1.75,.09,.26,X,Y+.11,Z+P+(k-1)*.34,oak);
          box(1.65,.95,1.04,X,Y+.65,Z+P,cardboard);
          box(.07,.95,1.05,X,Y+.65,Z+P,white);
        }
      }
    }
    // Agrupar caixas, paletes e prateleiras em lotes por material e corredor.
    const rackBatches=new Map();
    for(const mesh of r.group.children.slice(rackStart)){
      if(!mesh.isMesh)continue;
      const key=mesh.material.uuid+':'+Math.floor(mesh.position.x/6)+':'+Math.floor(mesh.position.z/10);
      if(!rackBatches.has(key))rackBatches.set(key,[]);
      rackBatches.get(key).push(mesh);
    }
    for(const batch of rackBatches.values()){
      if(batch.length<2)continue;
      const parts=batch.map(mesh=>{mesh.updateMatrix();return mesh.geometry.clone().applyMatrix4(mesh.matrix);});
      const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!geometry)continue;
      const merged=new THREE.Mesh(geometry,batch[0].material);merged.castShadow=true;merged.receiveShadow=true;r.group.add(merged);
      for(const mesh of batch){mesh.removeFromParent();mesh.geometry.dispose();}
    }
    // Marcações de segurança no chão e corredor pedonal junto ao escritório.
    for(const X of [-24,-19,-13,-7,-1,5,9])box(.075,.012,21,X,.169,-1.0,stripe);
    for(const Z of [-11.6,5.0,7.2])box(35,.012,.075,-7.5,.169,Z,stripe);
    for(let k=0;k<10;k++)box(.48,.012,1.7,-9+k*1.65,.169,9.7,white);
    // Portões de cais no interior, alinhados com as docas exteriores.
    const dock=interiorMaterial('metal',0x9ca5ae);
    for(const X of [-21,-14,-7,0,7]){
      box(3.2,4.0,.07,X,2.16,-12.84,dark);
      box(2.85,3.65,.085,X,2.02,-12.79,dock);
      for(let j=1;j<8;j++)box(2.84,.045,.02,X,.35+j*.44,-12.735,dark);
    }
    // Dois empilhadores estáticos, com garfos, rodas, mastro e cabine.
    function forklift(X,Z){
      box(1.03,.64,1.55,X,.62,Z,yellow,true);box(.88,.16,1.13,X,1.0,Z,black);
      box(.44,.12,.43,X,1.11,Z,black);box(.44,.48,.12,X,1.32,Z-.18,black);
      for(const a of [-1,1]){
        for(const b of [-1,1]){
          const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.16,16),black);wheel.rotation.z=Math.PI/2;wheel.position.set(X+a*.53,.36,Z+b*.52);r.group.add(wheel);
          box(.065,1.4,.065,X+a*.46,1.62,Z+b*.43,dark);
        }
        box(.08,1.95,.10,X+a*.35,1.30,Z-.87,steel);
        box(.12,.08,.92,X+a*.30,.29,Z-1.28,steel);
      }
      box(1.04,.10,1.15,X,2.36,Z,dark);box(.82,.09,.09,X,.85,Z-.87,steel);
      obstacles.push({type:'box',x:X,z:-56+Z-1.15,w:.85,d:1.0});
    }
    forklift(-12,7.0);forklift(3,8.0);
    // Escritório: três postos, impressora e armário.
    for(const Z of [-7,-2,3]){table(15.0,Z,2.0,.85);computer(15.0,Z-.05);chair(15.0,Z+.85);}
    box(1.6,.85,.6,20.5,1.5- .91,8.4,white,true);box(.56,.38,.45,20.5,1.2,8.4,steel);
    box(.65,2.1,1.7,24.0,1.21,-9.8,steel,true);
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#13579b';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#fff';ctx.font='bold 126px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('DACHSER',512,128);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));sign.position.set(-6,7.1,-12.86);r.group.add(sign);
  }
  return {interactables,update(dt,p,mode){for(const r of rooms)r.update(dt,p,mode);for(const update of internalDoors)update(dt,p);}};
}
