import * as THREE from 'three';

// Modelação procedural dos interiores. Todas as dimensões em metros.
export function createInteriors({scene,obstacles}){
  const interactables=[],rooms=[];
  const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.78});
  const oak=mat(0xb78a58),dark=mat(0x303b48),white=mat(0xece9df),black=mat(0x151b21),steel=mat(0x687785),blue=mat(0x276ba5),yellow=mat(0xe7ae28),cardboard=mat(0xb38a5d),fabric=mat(0x708881);
  const lit=new THREE.MeshBasicMaterial({color:0xe9f3ff});
  function room({x,z,w,d,h,wall,roof,floor,doorWidth=1.6}){
    const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
    const top=new THREE.Group();group.add(top);
    function box(W,H,D,X,Y,Z,M,collide=false,parent=group){
      const o=new THREE.Mesh(new THREE.BoxGeometry(W,H,D),M);
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
    }
    rooms.push({update});
    function light(X,Z,color=0xffecd4){const l=new THREE.PointLight(color,18,8,2);l.position.set(X,3.0,Z);group.add(l);box(.85,.06,.36,X,h-.12,Z,lit,false,top);}
    function partition(W,D,X,Z,H=2.7){box(W,H,D,X,.16+H/2,Z,wall,true);}
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
    return {box,light,partition,table,chair,computer,shelf,group};
  }
  // Apenas o prédio central é a casa. Os vizinhos são cenário.
  for(const [X,color] of [[-25.4,0xc5b4a3],[-12.6,0xd0b3a8]]){
    const body=new THREE.Mesh(new THREE.BoxGeometry(6.2,7.4,12),mat(color));
    body.position.set(X,3.7,34);body.castShadow=true;body.receiveShadow=true;scene.add(body);
    obstacles.push({type:'box',x:X,z:34,w:6.2,d:12});
    const roof=new THREE.Mesh(new THREE.BoxGeometry(6.3,.55,12.3),mat(0x995b4b));
    roof.position.set(X,7.675,34);roof.castShadow=true;scene.add(roof);
    const door=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.15,.12),dark);
    door.position.set(X,1.075,40.06);scene.add(door);
  }
  {
    const r=room({x:-19,z:34,w:6.2,d:12,h:7.4,wall:mat(0xb7c8c1),roof:mat(0x995b4b),floor:oak});
    const {box,light,partition,table,chair}=r;
    light(0,3);light(0,-.8);light(0,-4);
    // Sala e cozinha em open space; quarto separado por parede com vão.
    partition(4.0,.16,-.95,-2.05,3);
    box(1.78,.65,.16,1.94,2.835,-2.05,white);
    // Sala junto à entrada, corredor livre pelo centro.
    box(.87,.38,2.35,-2.36,.53,3.3,fabric,true);
    box(.18,.70,2.35,-2.72,.92,3.3,fabric);
    for(const Z of [2.22,4.38])box(.87,.44,.17,-2.36,.86,Z,fabric);
    box(.58,.12,1.05,-1.35,.65,3.3,oak,true);
    box(2.15,.025,2.85,-1.65,.177,3.3,mat(0xc0ad99));
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
    const r=room({x:20,z:34,w:16,d:13,h:7,wall:white,roof:steel,floor:mat(0xb8b3a6),doorWidth:2});
    const {box,table,chair,shelf,computer,light,partition,group}=r;
    for(const X of [-5,0,5]){light(X,-3);light(X,3);}
    // Parede transversal até ao teto, com passagem central de 2 m.
    for(const X of [-4.45,4.45])partition(6.90,.20,X,.4,6.84);
    box(2,4.45,.20,0,4.775,.4,white);
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
    for(const [name,Z,rotation] of [['BIBLIOTECA',.53,0],['SALA DE AULA',.27,Math.PI]]){
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
    const r=room({x:0,z:-33,w:24,d:13,h:8,wall:mat(0xc9cdd0),roof:dark,floor:mat(0x8b9094),doorWidth:2.8});
    const {box,partition,table,chair,computer,light}=r;
    const split=4.8;
    // Divisória com passagem de 1.8 m junto à entrada.
    partition(.18,8.8,split,-1.9,3.1);partition(.18,1.0,split,5.85,3.1);
    box(.18,.5,2.0,split,2.8,3.9,white);
    for(const X of [-9,-3,2,8]){light(X,-3,0xe8f2ff);light(X,3,0xe8f2ff);}
    // Racks longitudinais com paletes e caixas, corredores livres.
    for(const X of [-9.1,-4.7,2.5]){
      for(const Z of [-4.3,-1.5,1.3]){
        const W=1.35,D=2.3;
        obstacles.push({type:'box',x:X,z:-33+Z,w:W,d:D});
        for(const a of [-1,1])for(const b of [-1,1])box(.09,3.6,.09,X+a*.63,1.96,Z+b*1.1,blue);
        for(const Y of [.26,1.45,2.65]){
          box(W,.11,D,X,Y,Z,yellow);
          for(const P of [-.54,.54]){
            for(let k=0;k<3;k++)box(1.05,.085,.19,X,Y+.105,Z+P+(k-1)*.28,oak);
            box(.94,.65,.82,X,Y+.48,Z+P,cardboard);
            box(.055,.65,.83,X,Y+.48,Z+P,white);
          }
        }
      }
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
      obstacles.push({type:'box',x:X,z:-33+Z-1.15,w:.85,d:1.0});
    }
    forklift(-6.9,3.9);forklift(-1.9,-3.7);
    // Escritório: três postos, impressora e armário.
    for(const Z of [-3.9,-1.2,1.5]){table(8.7,Z,2.0,.85);computer(8.7,Z-.05);chair(8.7,Z+.85);}
    box(1.6,.85,.6,9.3,1.5- .91,5.4,white,true);box(.56,.38,.45,9.3,1.2,5.4,steel);
    box(.65,2.1,1.7,11.35,1.21,-4.8,steel,true);
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#13579b';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#fff';ctx.font='bold 126px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('DACHSER',512,128);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));sign.position.set(-4,4.4,-6.36);r.group.add(sign);
  }
  return {interactables,update(dt,p,mode){for(const r of rooms)r.update(dt,p,mode);}};
}
