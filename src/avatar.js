import * as THREE from 'three';
export function createAvatar(){
 const root=new THREE.Group(), torso=new THREE.Group(), head=new THREE.Group();
 const skin=new THREE.MeshStandardMaterial({color:0xc58e72,roughness:.85}),hair=new THREE.MeshStandardMaterial({color:0x171719,roughness:.9}),beard=new THREE.MeshStandardMaterial({color:0x292322,roughness:.95}),navy=new THREE.MeshStandardMaterial({color:0x182735,roughness:.85}),cream=new THREE.MeshStandardMaterial({color:0xf1eee5,roughness:.9}),denim=new THREE.MeshStandardMaterial({color:0x6f92b3,roughness:.95}),shoe=new THREE.MeshStandardMaterial({color:0xf3f0e9}),glass=new THREE.MeshStandardMaterial({color:0x1d242b,metalness:.25,roughness:.45});
 const sphere=(parent,mat,pos,scale)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;parent.add(o);return o};
 const cylinder=(parent,mat,r1,r2,h,pos,segments=24)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat);o.position.set(...pos);o.castShadow=true;parent.add(o);return o};
 const limb=(parent,mat,a,b,r)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);const o=new THREE.Mesh(new THREE.CylinderGeometry(r*.92,r,d.length(),12),mat);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());o.castShadow=true;parent.add(o);return o};
 // Feet at y=0; avatar faces +Z.
 const hips=cylinder(root,denim,.29,.31,.24,[0,1.02,0]);
 const legs=[];
 for(const side of [-1,1]){const pivot=new THREE.Group();pivot.position.set(side*.17,1.02,0);root.add(pivot);cylinder(pivot,denim,.145,.12,.78,[0,-.39,0]);sphere(pivot,shoe,[0,-.83,.105],[.15,.105,.25]);legs.push(pivot)}
 torso.position.y=1.12;root.add(torso);
 cylinder(torso,cream,.35,.30,.72,[0,.28,0]);
 // Navy stripes on the cream shirt, slightly raised to avoid z-fighting.
 for(const y of [.04,.21,.38,.55]) cylinder(torso,navy,.352-(y*.045),.335-(y*.045),.075,[0,y,0],32);
 sphere(torso,skin,[0,.74,0],[.115,.13,.115]);
 head.position.y=.82;torso.add(head);
 sphere(head,skin,[0,.19,0],[.245,.295,.225]);
 sphere(head,beard,[0,.075,.095],[.207,.17,.159]);
 sphere(head,skin,[0,.13,.222],[.15,.115,.055]); // mouth/chin opening
 sphere(head,hair,[0,.395,-.018],[.252,.14,.224]);
 sphere(head,hair,[0,.47,-.14],[.17,.16,.15]); // tied bun
 sphere(head,hair,[0,.51,-.22],[.115,.105,.12]);
 sphere(head,skin,[0,.16,.24],[.055,.07,.075]); // nose
 for(const s of [-1,1]){
   sphere(head,skin,[s*.245,.19,0],[.045,.085,.065]); // ears
   const ring=new THREE.Mesh(new THREE.TorusGeometry(.091,.014,8,32),glass);ring.position.set(s*.115,.245,.203);ring.scale.y=.8;head.add(ring);
   sphere(head,glass,[s*.115,.245,.211],[.018,.018,.012]);
   limb(head,glass,[s*.205,.245,.165],[s*.25,.24,-.035],.012);
 }
 limb(head,glass,[-.024,.245,.204],[.024,.245,.204],.012);
 const arms=[];
 for(const s of [-1,1]){
   const pivot=new THREE.Group();pivot.position.set(s*.355,.56,0);torso.add(pivot);
   limb(pivot,cream,[0,0,0],[s*.08,-.27,0],.145);
   limb(pivot,navy,[s*.065,-.225,0],[s*.085,-.27,0],.145);
   limb(pivot,skin,[s*.085,-.27,0],[s*.12,-.57,.025],.104);
   sphere(pivot,skin,[s*.12,-.6,.035],[.105,.11,.075]);
   arms.push(pivot);
 }
 const update=(time,mode='idle')=>{
   const t=time;
   torso.position.y=1.12+Math.sin(t*2)*.009;
   head.rotation.y=Math.sin(t*.8)*.055;
   head.rotation.z=Math.sin(t*.6)*.018;
   if(mode==='wave'){arms[1].rotation.z=-1.9+Math.sin(t*7)*.23;arms[1].rotation.x=-.3;arms[0].rotation.z=.05;legs.forEach(l=>l.rotation.x=0)}
   else if(mode==='walk'){const v=Math.sin(t*5);arms[0].rotation.x=v*.52;arms[1].rotation.x=-v*.52;arms[0].rotation.z=.1;arms[1].rotation.z=-.1;legs[0].rotation.x=-v*.42;legs[1].rotation.x=v*.42;torso.rotation.z=Math.sin(t*5)*.025}
   else{arms[0].rotation.x=arms[1].rotation.x=0;arms[0].rotation.z=.08;arms[1].rotation.z=-.08;legs.forEach(l=>l.rotation.x=0);torso.rotation.z=0}
   if(mode!=='walk')torso.rotation.z=0;
 };
 root.traverse(o=>{if(o.isMesh)o.receiveShadow=true});
 return {group:root,update};
}