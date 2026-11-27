import * as THREE from 'three';
import { exteriorMaterial, metricBox } from './materials.js';

// Fachadas inspiradas nas casas em banda neerlandesas.
// Janelas de representação exterior: caixilho, vidro opaco e peitoril.
const brick=exteriorMaterial('brick',0xffffff);
const cream=new THREE.MeshStandardMaterial({color:0xe9e1d0,roughness:.8});
const sill=new THREE.MeshStandardMaterial({color:0xb8b4aa,roughness:.85});
const dark=new THREE.MeshStandardMaterial({color:0x273b42,roughness:.65});
const glass=new THREE.MeshStandardMaterial({color:0x506d83,metalness:.15,roughness:.28});
const tile=exteriorMaterial('roof',0x8e6961);
function box(parent,w,h,d,x,y,z,mat){
  const mesh=new THREE.Mesh(metricBox(w,h,d,mat),mat);
  mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function windowAt(parent,x,y,z,w,h,rotation=0){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);
  box(g,w+.16,h+.16,.085,0,0,0,cream);
  box(g,w,h,.03,0,0,.057,dark);
  box(g,w-.10,h-.10,.025,0,0,.081,glass);
  box(g,.055,h-.08,.035,0,0,.105,cream);
  box(g,w-.08,.055,.035,0,h*.12,.105,cream);
  box(g,w+.25,.095,.23,0,-h/2-.10,.05,sill);
  box(g,w+.24,.10,.12,0,h/2+.11,.02,cream);
}
export function dutchFacade({scene,x,z,w,d,h,floors=3,segments=1,roofParent=null,frontDoor=true}){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const top=new THREE.Group();
  if(roofParent){roofParent.add(top);top.position.set(0,0,0);}else g.add(top);
  const bay=w/segments;
  // Fachada fina sobre a construção existente; deixa o vão da porta intacto.
  const opening=2.0;
  if(frontDoor){
    const sw=(w-opening)/2;
    for(const side of [-1,1])box(g,sw,h,.045,side*(opening/2+sw/2),h/2,d/2+.025,brick);
    box(g,opening,h-2.40,.045,0,(h+2.40)/2,d/2+.025,brick);
  }else box(g,w,h,.045,0,h/2,d/2+.025,brick);
  box(g,w,h,.045,0,h/2,-d/2-.025,brick);
  for(const side of [-1,1])box(g,.045,h,d,side*(w/2+.025),h/2,0,brick);
  for(const side of [-1,1]){
    const faceZ=side*(d/2+.08),rot=side===1?0:Math.PI;
    for(let f=0;f<floors;f++){
      const y=1.35+f*(h-1.6)/floors;
      for(let j=0;j<segments;j++){
        const center=-w/2+bay*(j+.5);
        for(const dx of [-bay*.27,bay*.27]){
          const xx=center+dx,ww=Math.min(1.15,bay*.30),hh=Math.min(1.65,(h-1.6)/floors*.70);
          if(side===1&&frontDoor&&f===0&&Math.abs(xx)<opening/2+ww/2+.15)continue;
          windowAt(g,xx,y,faceZ,ww,hh,rot);
        }
      }
    }
    for(let f=1;f<floors;f++)box(g,w,.075,.09,0,1.35+(f-.5)*(h-1.6)/floors,faceZ,cream);
    box(g,w+.10,.15,.17,0,h-.20,faceZ,cream);
  }
  // Janelas laterais regulares, sem ocupar o passeio.
  for(const side of [-1,1])for(let f=0;f<floors;f++){
    const y=1.35+f*(h-1.6)/floors;
    for(let zz=-d/2+2;zz<d/2-1;zz+=3.1)
      windowAt(g,side*(w/2+.08),y,zz,1.02,Math.min(1.5,(h-1.6)/floors*.70),side*Math.PI/2);
  }
  // Frontões escalonados, um por módulo; cobertura inclinada atrás.
  for(let j=0;j<segments;j++){
    const xx=-w/2+bay*(j+.5),rise=1.45+(j%2)*.35;
    for(let k=0;k<4;k++){
      const ww=bay*(.94-k*.19),yy=h+.36+k*rise/4;
      for(const side of [-1,1]){
        box(top,ww,rise/4+.018,.25,xx,yy+rise/8,side*(d/2-.03),brick);
        box(top,ww+.09,.08,.32,xx,yy+rise/4,side*(d/2-.03),cream);
      }
    }
    const half=bay*.48,roofRise=rise*.77,angle=Math.atan2(roofRise,half),slope=Math.hypot(half,roofRise);
    for(const sign of [-1,1]){
      const r=box(top,slope,.13,d-.40,xx+sign*half/2,h+.39+roofRise/2,0,tile);
      r.rotation.z=-sign*angle;
    }
  }
  // Aro de porta sem cobrir a folha interativa.
  if(frontDoor){
    for(const side of [-1,1])box(g,.12,2.4,.15,side*1.04,1.20,d/2+.055,cream);
    box(g,2.20,.12,.17,0,2.43,d/2+.055,cream);
  }
  return g;
}
