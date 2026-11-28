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
 const names=['Avião','Globo e rota','Calm Mode','Modo offline','Progresso','Fases do voo'];
 const points=names.map((_,j)=>[nx+R*Math.sin(j*Math.PI/3),nz-R*Math.cos(j*Math.PI/3)]);
 for(let j=0;j<6;j++){const [x,z]=points[j];pedestal(x,z,blue);screen(names[j],'NEXTSEAT',x, .99,z+.48,.84,.38);}
 aircraft.position.set(points[0][0],1.22,points[0][1]);aircraft.scale.setScalar(.66);
 const [gx,gz]=points[1], globe=group(gx,1.30,gz);ball(.43,0,0,0,mat(0x276ba4),globe);
 const wire=mesh(new THREE.SphereGeometry(.437,16,10),new THREE.MeshBasicMaterial({color:0x9bdcff,wireframe:true,transparent:true,opacity:.35}),0,0,0,globe);
 const orbit=mesh(new THREE.TorusGeometry(.48,.015,6,40),blue,0,0,0,globe);orbit.rotation.x=.8;
 const marker=ball(.055,0,0,0,glow(0xffffff),globe);
 const [bx,bz]=points[2],breath=ball(.34,bx,1.27,bz,blue);
 const [px,pz]=points[3];box(.47,.78,.08,px,1.16,pz,dark);screen('OFFLINE','Ready to fly',px,1.16,pz+.045,.41,.69);
 const [qx,qz]=points[4];box(.83,.38,.09,qx,1.21,qz,dark);const bar=box(.73,.09,.04,qx,1.16,qz+.06,blue);screen('LIS → OPO','Journey',qx,1.48,qz+.06,.84,.35);
 const [fx,fz]=points[5],cloud=group(fx,1.24,fz);for(let j=0;j<4;j++)ball(.19,j*.16-.24,Math.sin(j)*.07,0,mat(0xe4f1ff),cloud);screen('Cruise','Next: arrival',fx,1.70,fz,.84,.40);
 const info=box(.70,1.25,.25,nx,.805,nz,dark);coll(nx,nz,.70,.25);const infoScreen=screen('NextSeat','E · Informação',nx,1.32,nz+.14,.9,.57);attach(infoScreen,projects[2],'Explorar NextSeat');attach(info,projects[2],'Explorar NextSeat');
 anim.push(t=>{globe.rotation.y=t*.25;marker.position.set(.48*Math.cos(t),.48*Math.sin(t)*.65,.48*Math.sin(t)*.76);const k=t%10;breath.scale.setScalar(.8+.55*(k<4?k/4:1-(k-4)/6));const v=.08+.92*((t%12)/12);bar.scale.x=v;bar.position.x=qx-.365+.365*v;cloud.position.y=1.24+.07*Math.sin(t);});
 // Help! east/north quadrant. Six floating emoji cards around a real desk.
 const hx=24.35,hz=-13.25;ring(hx,hz,3.35,green);
 const emojis=['😟','😞','😤','😴','😌','🔥'],moods=['Ansioso','Triste','Zangado','Cansado','Feliz','Motivado'];
 for(let j=0;j<6;j++){const a=j*Math.PI/3,x=hx+2.55*Math.sin(a),z=hz-2.55*Math.cos(a);pedestal(x,z,green);
  const o=screen(emojis[j],moods[j],x,1.45,z,.91,.85,'#75e7c4');o.rotation.y=Math.atan2(hx-x,hz-z);anim.push(t=>{o.position.y=1.45+.12*Math.sin(t*1.3+j);});
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
