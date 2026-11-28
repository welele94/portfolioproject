import * as THREE from 'three';
export function buildExhibits({scene,obstacles,projects,interactables,aircraft}){
 const g=new THREE.Group();scene.add(g);const anim=[];
 const mat=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness:.48});
 const glow=color=>new THREE.MeshBasicMaterial({color,toneMapped:false});
 const dark=mat(0x26303d),gold=mat(0xd5a64a,.55),blue=glow(0x59bdff),green=glow(0x5de4b1),violet=glow(0xc15dff);
 function mesh(geo,m,x,y,z,parent=g){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o;}
 function box(w,h,d,x,y,z,m,parent=g){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);}
 function ball(r,x,y,z,m,parent=g,s=[1,1,1]){const o=mesh(new THREE.SphereGeometry(r,16,12),m,x,y,z,parent);o.scale.set(...s);return o;}
 function cyl(r,h,x,y,z,m,parent=g){return mesh(new THREE.CylinderGeometry(r,r,h,32),m,x,y,z,parent);}
 function group(x,y,z){const o=new THREE.Group();o.position.set(x,y,z);g.add(o);return o;}
 function coll(x,z,w,d){obstacles.push({type:'box',x,z,w,d});}
 function screen(text,sub,x,y,z,w,h,color='#69c8ff',rot=0){
  const cv=document.createElement('canvas');cv.width=512;cv.height=256;const ctx=cv.getContext('2d');ctx.fillStyle='#111b28';ctx.fillRect(0,0,512,256);ctx.strokeStyle=color;ctx.lineWidth=7;ctx.strokeRect(4,4,504,248);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.font='bold 54px system-ui';ctx.fillText(text,256,100,480);ctx.fillStyle='#e1ecf5';ctx.font='28px system-ui';ctx.fillText(sub,256,175,480);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const o=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,toneMapped:false,side:THREE.DoubleSide}),x,y,z);o.rotation.y=rot;return o;
 }
 function ring(x,z,r,m){const o=mesh(new THREE.RingGeometry(r-.035,r,64),m,x,.192,z);o.rotation.x=-Math.PI/2;}
 function pedestal(x,z,m){cyl(.45,.55,x,.455,z,dark);cyl(.47,.035,x,.747,z,m);coll(x,z,.85,.85);}
 function attach(target,project,label,terminal=false){interactables.push({meshes:[target],label:()=>label,activate:()=>terminal?{...project,terminal:true}:project});}
 // NextSeat, east/south quadrant. Small individual plinths, no raised floor.
 const nx=24.35,nz=-3.9,R=2.65;ring(nx,nz,3.35,blue);
 // Physical objects immediately associated with a passenger's journey.
 const names=['Avião','Globo terrestre','Banco de avião','Janela de cabine','Bagagem','NextSeat App'];
 const points=names.map((_,j)=>[nx+R*Math.sin(j*Math.PI/3),nz-R*Math.cos(j*Math.PI/3)]);
 for(let j=0;j<6;j++){const [x,z]=points[j];pedestal(x,z,blue);}
 aircraft.position.set(points[0][0],1.27,points[0][1]);aircraft.scale.setScalar(.85);
 const [gx,gz]=points[1],globe=group(gx,1.30,gz);
 const earthCanvas=document.createElement('canvas');earthCanvas.width=1024;earthCanvas.height=512;const ec=earthCanvas.getContext('2d');ec.fillStyle='#2163a0';ec.fillRect(0,0,1024,512);
 // Simplified continent silhouettes, decorative rather than navigation data.
 ec.fillStyle='#73ab70';
 for(const poly of [[[.08,.22],[.17,.13],[.28,.17],[.31,.28],[.23,.37],[.22,.47],[.16,.41],[.12,.31]],[[.24,.47],[.33,.49],[.36,.62],[.30,.82],[.26,.72]],[[.43,.22],[.50,.17],[.60,.18],[.66,.25],[.78,.17],[.91,.25],[.88,.41],[.78,.45],[.72,.38],[.65,.50],[.59,.37],[.53,.39],[.49,.29]],[[.45,.40],[.57,.39],[.61,.53],[.54,.72],[.48,.61]],[[.78,.66],[.90,.64],[.94,.76],[.82,.81]],[[.31,.09],[.39,.08],[.37,.19],[.32,.20]]]){ec.beginPath();poly.forEach(([x,y],j)=>j?ec.lineTo(x*1024,y*512):ec.moveTo(x*1024,y*512));ec.closePath();ec.fill();}
 ec.fillStyle='#e2f1ff';ec.fillRect(0,0,1024,20);ec.fillRect(0,488,1024,24);
 const et=new THREE.CanvasTexture(earthCanvas);et.colorSpace=THREE.SRGBColorSpace;
 mesh(new THREE.SphereGeometry(.48,32,20),new THREE.MeshStandardMaterial({map:et,roughness:.65}),0,0,0,globe);
 const arc=mesh(new THREE.TorusGeometry(.53,.012,6,48),blue,0,0,0,globe);arc.rotation.x=.8;
 const [sx,sz]=points[2],seat=group(sx,.78,sz);const fabric=mat(0x244d86),shell=mat(0xc5cbd6);
 box(.66,.09,.57,0,.12,0,shell,seat);box(.60,.17,.55,0,.24,.02,fabric,seat);
 const back=box(.64,.80,.16,0,.62,-.25,shell,seat);back.rotation.x=-.12;
 const cushion=box(.55,.65,.11,0,.63,-.15,fabric,seat);cushion.rotation.x=-.12;
 box(.39,.20,.13,0,1.02,-.16,fabric,seat);
 for(const side of [-1,1]){box(.06,.32,.06,side*.33,.30,.15,shell,seat);box(.10,.07,.50,side*.34,.45,0,dark,seat);}
 seat.rotation.y=Math.atan2(nx-sx,nz-sz);
 const [wx,wz]=points[3],windowGroup=group(wx,1.25,wz);windowGroup.rotation.y=Math.atan2(nx-wx,nz-wz);
 function ovalShape(w,h){const sh=new THREE.Shape();sh.absellipse(0,0,w,h,0,Math.PI*2,false,0);return sh;}
 const frame=ovalShape(.44,.55);const hole=new THREE.Path();hole.absellipse(0,0,.34,.44,0,Math.PI*2,true,0);frame.holes.push(hole);
 mesh(new THREE.ExtrudeGeometry(frame,{depth:.10,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2}),shell,0,0,0,windowGroup);
 const sky=mesh(new THREE.ShapeGeometry(ovalShape(.345,.445)),glow(0x81c9fa),0,0,-.015,windowGroup);
 const clouds= new THREE.Group();windowGroup.add(clouds);for(let j=0;j<4;j++)ball(.11,-.18+j*.11,-.18+Math.sin(j)*.04,.015,glow(0xeaf6ff),clouds,[1.15,.55,.18]);
 const [lx,lz]=points[4],luggage=group(lx,.76,lz);const bag=mat(0x254269);box(.51,.68,.32,0,.40,0,bag,luggage);for(const side of [-1,1]){box(.035,.67,.035,side*.19,.40,.175,shell,luggage);ball(.065,side*.17,.045,.02,dark,luggage);box(.035,.30,.035,side*.12,.91,0,shell,luggage);}box(.28,.055,.06,0,1.05,0,dark,luggage);luggage.rotation.y=Math.atan2(nx-lx,nz-lz);
 const [px,pz]=points[5],phone=group(px,1.29,pz);phone.rotation.y=Math.atan2(nx-px,nz-pz);box(.51,.88,.075,0,0,0,dark,phone);
 const display=mesh(new THREE.PlaneGeometry(.46,.79),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),0,0,.042,phone);
 new THREE.TextureLoader().load('./images/nextseat.png',t=>{t.colorSpace=THREE.SRGBColorSpace;display.material.map=t;display.material.needsUpdate=true;},undefined,()=>{display.material.color.setHex(0x0d3b8c);});
 // The central panel explains the actual features rather than labelling props as features.
 const info=box(.70,1.25,.25,nx,.805,nz,dark);coll(nx,nz,.70,.25);const infoScreen=screen('NextSeat','E · Informação',nx,1.32,nz+.14,.9,.57);attach(infoScreen,projects[2],'Explorar NextSeat');attach(info,projects[2],'Explorar NextSeat');
 anim.push(t=>{globe.rotation.y=t*.20;clouds.position.x=.035*Math.sin(t*.8);});
 // Help! east/north quadrant. Six floating emoji cards around a real desk.
 const hx=24.35,hz=-13.25;ring(hx,hz,3.35,green);
 const moods=['Ansioso','Triste','Zangado','Cansado','Feliz','Motivado'];
 const faceYellow=mat(0xffcc37),angryYellow=mat(0xffad39),ink=mat(0x42291b),eyeWhite=mat(0xfff9e9),tear=mat(0x5dcaff),flameOrange=mat(0xff651b),flameYellow=glow(0xffcf43);
 function stroke(parent,pts,r=.025,m=ink){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),18,r,6,false),m,0,0,0,parent);}
 function flame(parent,size,m,z){const sh=new THREE.Shape();sh.moveTo(0,-.43*size);sh.bezierCurveTo(-.56*size,-.35*size,-.52*size,.08*size,-.23*size,.35*size);sh.bezierCurveTo(-.27*size,.05*size,-.03*size,.16*size,.04*size,.61*size);sh.bezierCurveTo(.47*size,.30*size,.57*size,.02*size,.35*size,-.25*size);sh.quadraticCurveTo(.23*size,-.44*size,0,-.43*size);const o=mesh(new THREE.ExtrudeGeometry(sh,{depth:.14*size,bevelEnabled:true,bevelThickness:.055*size,bevelSize:.045*size,bevelSegments:3,curveSegments:12}),m,0,0,z,parent);return o;}
 function emoji3d(j,x,z){
  const o=group(x,1.42,z);o.rotation.y=Math.atan2(hx-x,hz-z);
  if(j===5){flame(o,.90,flameOrange,-.075);flame(o,.54,flameYellow,.09).position.y=-.11;return o;}
  ball(.43,0,0,0,j===2?angryYellow:faceYellow,o,[1,1,.95]);
  for(const side of [-1,1]){
   const ex=side*.16;
   if(j===3||j===4){stroke(o,[[ex-.09,.09,.366],[ex,.065+(j===4?.07:-.025),.405],[ex+.09,.09,.366]],.027);}
   else{ball(.103,ex,.075,.366,eyeWhite,o,[.78,1.15,.39]);ball(.046,ex,.06,.403,ink,o,[.85,1.15,.48]);}
   if(j===0)stroke(o,[[ex-.10,.19+(side===1?.06:0),.33],[ex,.23,.365],[ex+.10,.19+(side===-1?.06:0),.33]],.023);
   if(j===1)stroke(o,[[ex-.09,.19+(side===1?.04:0),.34],[ex,.22,.366],[ex+.09,.19+(side===-1?.04:0),.34]],.024);
   if(j===2)stroke(o,[[ex-.10,.22-side*.07,.335],[ex,.19,.373],[ex+.10,.22+side*.07,.335]],.035);
  }
  if(j===0){ball(.11,0,-.15,.397,ink,o,[1,.65,.23]);}
  if(j===1){stroke(o,[[-.13,-.20,.357],[0,-.125,.414],[.13,-.20,.357]],.028);ball(.065,.24,-.12,.345,tear,o,[.58,1.35,.4]);}
  if(j===2){stroke(o,[[-.14,-.18,.36],[0,-.14,.42],[.14,-.18,.36]],.039);}
  if(j===3){ball(.10,0,-.16,.402,ink,o,[.80,1.1,.22]);const zz=stroke(o,[[.27,.36,.15],[.40,.36,.15],[.27,.48,.15],[.40,.48,.15]],.018,blue);}
  if(j===4){stroke(o,[[-.16,-.10,.371],[0,-.21,.39],[.16,-.10,.371]],.029);for(const side of [-1,1])ball(.07,side*.27,-.06,.31,mat(0xf39b50),o,[1,.45,.28]);}
  return o;
 }
 for(let j=0;j<6;j++){const a=j*Math.PI/3,x=hx+2.55*Math.sin(a),z=hz-2.55*Math.cos(a);pedestal(x,z,green);
  const o=emoji3d(j,x,z);const baseYaw=o.rotation.y;anim.push(t=>{o.position.y=1.42+.12*Math.sin(t*1.3+j);o.rotation.y=baseYaw+.15*Math.sin(t*.65+j);});
 }
 box(1.48,.10,.72,hx,.98,hz,dark);coll(hx,hz,1.48,.72);for(const dx of [-.64,.64])box(.09,.79,.60,hx+dx,.535,hz,dark);
 box(.11,.29,.12,hx,1.17,hz-.15,dark);const pc=box(.91,.57,.10,hx,1.53,hz-.15,dark);
 const terminal=screen('Help! >_','E · Executar',hx,1.53,hz-.092,.84,.50,'#71e7b5');box(.58,.035,.23,hx,1.05,hz+.20,dark);box(.10,.04,.16,hx+.43,1.06,hz+.20,dark);attach(terminal,projects[3],'Executar Help!',true);attach(pc,projects[3],'Executar Help!',true);
 // Buddha Club, west/south: dance floor flush with ground.
 const dx=15.45,dz=-3.3;const tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(.83,.018,.83),glow(0xffffff),36);const m=new THREE.Matrix4();for(let j=0;j<36;j++){m.makeTranslation(dx+(j%6-2.5)*.88,.198,dz+(Math.floor(j/6)-2.5)*.88);tiles.setMatrixAt(j,m);tiles.setColorAt(j,new THREE.Color(0x723b9f));}g.add(tiles);
 const dj=box(2.4,1.02,.68,dx,.69,-7.0,dark);coll(dx,-7,2.4,.68);box(2.5,.07,.74,dx,1.24,-7,violet);for(const s of [-1,1]){cyl(.29,.06,dx+s*.65,1.30,-7,dark);cyl(.09,.065,dx+s*.65,1.32,-7,gold);}
 const djSign=screen('BUDDHA CLUB','E · Ver projeto',dx,1.7,-7.35,2.4,.8,'#e2a2ff');attach(djSign,projects[0],'Explorar Buddha Club');attach(dj,projects[0],'Explorar Buddha Club');
 // Stylised seated Buddha sculptures, low-poly lathe and ellipsoids.
 function buddha(x,z,s){const o=group(x,.20,z);o.scale.setScalar(s);cyl(.60,.17,0,.085,0,gold,o);ball(.54,0,.28,0,gold,o,[1.15,.42,.77]);ball(.39,0,.76,0,gold,o,[.78,1.16,.60]);ball(.24,0,1.32,0,gold,o,[.83,1.05,.86]);ball(.13,0,1.57,0,gold,o,[.85,1,.85]);for(const sign of [-1,1]){ball(.12,sign*.24,1.27,0,gold,o,[.52,1.25,.65]);const arm=ball(.15,sign*.30,.63,.08,gold,o,[.75,1.75,.8]);arm.rotation.z=sign*.47;ball(.13,sign*.15,.42,.29,gold,o,[1,.55,.8]);}return o;}
 buddha(dx,-8.25,1.42);buddha(12.65,-7.25,.72);buddha(18.25,-7.25,.72);coll(dx,-8.25,1.5,1.1);coll(12.65,-7.25,.9,.75);coll(18.25,-7.25,.9,.75);
 for(const x of [12.6,18.3]){box(.54,1.45,.52,x,.905,-6.6,dark);coll(x,-6.6,.54,.52);for(const y of [.65,1.15]){const o=cyl(.20,.045,x,y,-6.32,gold);o.rotation.x=Math.PI/2;}}
 const beams=[];for(const [x,z] of [[12.65,-5.7],[18.25,-5.7],[12.65,-.8],[18.25,-.8]]){box(.26,3.0,.26,x,1.7,z,dark);coll(x,z,.26,.26);const pivot=group(x,3.35,z);ball(.19,0,0,0,dark,pivot);const beam=mesh(new THREE.ConeGeometry(.92,3.4,18,1,true),new THREE.MeshBasicMaterial({color:0xc951ff,transparent:true,opacity:.10,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}),0,-1.7,0,pivot);beam.rotation.z=Math.PI;beam.userData.decoration=true;beams.push({pivot,beam});}
 for(const x of [13,17.9]){const lantern=group(x,3.5,-7);ball(.24,0,0,0,glow(0xe36248),lantern,[1,1.25,1]);cyl(.13,.06,0,.31,0,gold,lantern);cyl(.13,.06,0,-.31,0,gold,lantern);}
 let lastFrame=-1;anim.push(t=>{for(let j=0;j<beams.length;j++){const {pivot,beam}=beams[j];pivot.rotation.z=Math.sin(t*.8+j*1.7)*.53;pivot.rotation.x=Math.cos(t*.62+j)*.48;beam.material.color.setHSL((.74+t*.035+j*.13)%1,.85,.6);}const tick=Math.floor(t*5);if(tick!==lastFrame){lastFrame=tick;for(let j=0;j<36;j++)tiles.setColorAt(j,new THREE.Color().setHSL((.68+.17*Math.sin(j*.5+t*1.5)+t*.045)%1,.8,.42+.14*Math.sin(j+t*2)));tiles.instanceColor.needsUpdate=true;}});
 // Keep animated groups intact when the campus merges static geometry.
 g.traverse(o=>{if(o.isMesh)o.userData.noBatch=true;});
 let elapsed=0;return {update(dt,inside){if(!inside)return;elapsed+=dt;for(const fn of anim)fn(elapsed);}};
}
