// Walk-through NextSeat cabin. A 3D exhibition, not an aircraft simulator.
import * as THREE from 'three';
export function createCabin({parent,obstacles,project,interactables}){
 const g=new THREE.Group();parent.add(g);const cx=24.65,front=-7.55,rear=.35,half=2.42,floor=.18;
 const mat=(color,roughness=.55)=>new THREE.MeshStandardMaterial({color,roughness});
 const lit=color=>new THREE.MeshBasicMaterial({color,toneMapped:false});
 const white=mat(0xe4e9f1),trim=mat(0x9baac0),navy=mat(0x24446d),fabric=mat(0x385f91,.85),black=mat(0x182737),carpet=mat(0x344459,.95),blue=lit(0x8dd7ff),warm=lit(0xe5f1ff);
 function m(geo,material,x,y,z,par=g){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.userData.noBatch=true;par.add(o);return o;}
 function b(w,h,d,x,y,z,material,par=g){return m(new THREE.BoxGeometry(w,h,d),material,x,y,z,par);}
 function coll(x,z,w,d){const o={type:'box',x,z,w,d};obstacles.push(o);return o;}
 function action(meshes,label,activate){interactables.push({meshes,label:typeof label==='function'?label:()=>label,activate});}
 function label(text,sub,w,h,x,y,z,rot=0){const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const ctx=cv.getContext('2d');ctx.fillStyle='#0d3b8c';ctx.fillRect(0,0,1024,512);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.font='bold 110px system-ui';ctx.fillText(text,512,180,960);ctx.font='48px system-ui';ctx.fillText(sub,512,330,940);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const o=m(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,toneMapped:false,side:THREE.DoubleSide}),x,y,z);o.rotation.y=rot;return o;}
 const len=rear-front,mid=(front+rear)/2;
 b(2*half,.022,len,cx,floor+.012,mid,carpet);b(1.35,.008,len,cx,floor+.028,mid,navy);
 // Curved roof; full-width arch with inner surface visible from below.
 const pos=[],uv=[],idx=[],N=28;
 for(let j=0;j<=N;j++){const a=Math.PI*j/N,x=cx+half*Math.cos(a),y=2.05+1.05*Math.sin(a);pos.push(x,y,front,x,y,rear);uv.push(j/N,0,j/N,1);if(j<N){const k=2*j;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
 const roofMat=white.clone();roofMat.side=THREE.DoubleSide;m(geo,roofMat,0,0,0);
 for(const side of [-1,1]){
  const x=cx+side*half;coll(x,mid,.13,len);
  b(.13,.88,len,x,.62,mid,white);b(.13,.48,len,x,1.81,mid,white);
  // Side wall window cut-outs, visible from both inside and outside.
  const windows=[-6.85,-5.35,-3.85,-2.35,-.85];let cursor=front;
  for(const z of windows){const start=z-.38; if(start>cursor)b(.13,.52,start-cursor,x,1.32,(cursor+start)/2,white);cursor=z+.38;}
  if(cursor<rear)b(.13,.52,rear-cursor,x,1.32,(cursor+rear)/2,white);
  b(.70,.40,len-.42,cx+side*1.93,2.27,mid,white);b(.045,.065,len-.5,cx+side*1.56,2.13,mid,blue);
  for(let z=front+.75;z<rear;z+=1.25)b(.66,.018,.025,cx+side*1.93,2.05,z,trim);
 }
 // A shared animated sky texture, with a window mask from the oval geometry.
 const cv=document.createElement('canvas');cv.width=512;cv.height=320;const ctx=cv.getContext('2d');const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 function sky(t){const gr=ctx.createLinearGradient(0,0,0,320);gr.addColorStop(0,'#438bc8');gr.addColorStop(1,'#d7efff');ctx.fillStyle=gr;ctx.fillRect(0,0,512,320);for(let j=0;j<9;j++){const x=((j*151+t*13)%680)-85,y=165+(j%3)*37;ctx.fillStyle='rgba(255,255,255,.82)';ctx.beginPath();ctx.ellipse(x,y,85,19,0,0,Math.PI*2);ctx.ellipse(x+25,y-15,44,25,0,0,Math.PI*2);ctx.fill();}}
 sky(0);
 function oval(rx,ry){const sh=new THREE.Shape();sh.absellipse(0,0,rx,ry,0,Math.PI*2,false,0);return sh;}
 const windowMat=new THREE.MeshBasicMaterial({map:tex,toneMapped:false,side:THREE.DoubleSide});
 for(const side of [-1,1])for(const z of [-6.85,-5.35,-3.85,-2.35,-.85]){
  const x=cx+side*(half-.08);const wg=new THREE.Group();wg.position.set(x,1.32,z);wg.rotation.y=-side*Math.PI/2;g.add(wg);
  const sh=oval(.43,.34),hole=new THREE.Path();hole.absellipse(0,0,.32,.235,0,Math.PI*2,true,0);sh.holes.push(hole);
  m(new THREE.ExtrudeGeometry(sh,{depth:.045,bevelEnabled:true,bevelThickness:.018,bevelSize:.02,bevelSegments:2,curveSegments:18}),trim,0,0,0,wg);
  const sg=new THREE.ShapeGeometry(oval(.325,.24));const uv=sg.attributes.uv,ps=sg.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,ps.getX(i)/.65+.5,ps.getY(i)/.48+.5);uv.needsUpdate=true;
  m(sg,windowMat,0,0,-.012,wg);
 }
 // Front bulkhead and rear boarding doorway with two sliding leaves.
 b(2*half,2.05,.14,cx,1.21,front,white);coll(cx,front,2*half,.14);
 const doorW=1.36,wing=half-doorW/2;
 for(const side of [-1,1]){b(wing,2.05,.16,cx+side*(doorW/2+wing/2),1.205,rear,white);coll(cx+side*(doorW/2+wing/2),rear,wing,.16);}
 b(doorW,.35,.17,cx,2.40,rear,white);
 const sign=label('NEXTSEAT','E · Embarcar / sair',2.55,.65,cx,2.75,rear+.12);
 const leaves=[];let opened=false,slide=0;
 for(const side of [-1,1]){
  const leaf=b(doorW/2-.012,2.04,.10,cx+side*doorW/4,1.20,rear,trim);
  const handle=b(.055,.20,.07,leaf.position.x-side*.23,1.22,rear+.083,blue);
  const innerHandle=b(.055,.20,.07,handle.position.x,1.22,rear-.083,blue);
  const collider=coll(leaf.position.x,rear,doorW/2,.10);
  leaves.push({side,leaf,handle,innerHandle,collider});
 }
 const toggle=()=>{opened=!opened;};
 action([sign,...leaves.flatMap(l=>[l.leaf,l.handle,l.innerHandle])],()=>opened?'Fechar porta da cabine':'Abrir porta da cabine',toggle);
 // Permanent jamb switch is reachable even when the doors are fully open.
 const switchOut=b(.18,.24,.05,cx-.87,1.38,rear+.105,blue),switchIn=b(.18,.24,.05,cx-.87,1.38,rear-.105,blue);
 action([switchOut,switchIn],()=>opened?'Fechar porta da cabine':'Abrir porta da cabine',toggle);
 const info=label('NextSeat','E · Projeto e GitHub',1.64,.72,cx,1.63,front+.085);
 action([info],'Explorar NextSeat',()=>project);
 // 3 rows, two seats on each side, central aisle 1.36 m clear.
 const rows=[-5.8,-3.85,-1.90];const seats=[];
 for(let row=0;row<rows.length;row++)for(const side of [-1,1])for(let j=0;j<2;j++){
  const x=cx+side*(1.02+j*.68),z=rows[row];const seat=new THREE.Group();seat.position.set(x,floor,z);g.add(seat);
  const seatParts=[];
  seatParts.push(b(.60,.17,.62,0,.46,0,fabric,seat));
  b(.52,.27,.40,0,.22,.02,trim,seat);
  const back=b(.62,.82,.16,0,.85,.30,navy,seat);back.rotation.x=-.10;seatParts.push(back);
  const head=b(.42,.25,.19,0,1.24,.32,fabric,seat);seatParts.push(head);
  for(const k of [-1,1]){b(.055,.31,.06,k*.32,.58,.04,trim,seat);b(.08,.065,.51,k*.32,.74,0,black,seat);}
  coll(x,z,.64,.78);
  // Every aisle seat can be used, with stand-up restoring the old position.
  if(j===0)action(seatParts,'Sentar no banco',()=>({seat:{x,y:1.37,z:z-.02,yaw:0,pitch:0}}));
  const monitor=b(.37,.25,.035,0,.99,.43,black,seat);
  const screenMat=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  const display=m(new THREE.PlaneGeometry(.325,.20),screenMat,0,.99,.451,seat);
  const map=new THREE.TextureLoader().load('./images/nextseat.png',t=>{t.colorSpace=THREE.SRGBColorSpace;},undefined,()=>{screenMat.map=null;screenMat.color.setHex(0x0d3b8c);screenMat.needsUpdate=true;});
  screenMat.map=map;action([monitor,display],'Ver aplicação NextSeat',()=>({...project,nextseatDemo:true}));
  seats.push(seat);
 }
 // A larger demo screen at the forward bulkhead, and a visible sign outside.
 const demo=label('NextSeat App','E · Demonstração',1.40,.64,cx+1.4,1.55,front+.085);action([demo],'Ver aplicação NextSeat',()=>({...project,nextseatDemo:true}));
 const outer=label('NEXTSEAT','Cabine interativa',2.6,.65,cx-half-.09,2.50,-3.4,-Math.PI/2);
 action([outer],'Explorar NextSeat',()=>project);
 for(const x of [cx-.48,cx+.48])b(.07,.025,len-.32,x,2.91,mid,warm);
 let skyTick=-1;
 return {update(dt,t,player){
  const next=slide+Math.sign((opened?1:0)-slide)*Math.min(Math.abs((opened?1:0)-slide),dt*2);
  if(!opened&&Math.abs(player?.z-rear)<.48&&Math.abs(player?.x-cx)<.95)opened=true;
  else slide=next;
  for(const l of leaves){const x=cx+l.side*(doorW/4+slide*(doorW/2+.03));l.leaf.position.x=x;l.handle.position.x=x-l.side*.23;l.innerHandle.position.x=l.handle.position.x;l.collider.x=x;}
  const tick=Math.floor(t*8);if(tick!==skyTick){skyTick=tick;sky(t);tex.needsUpdate=true;}
 }};
}
