import * as THREE from 'three';

// Materiais exteriores procedurais locais, sem downloads ou dependências adicionais.
// O UV das caixas é medido em metros; cada padrão tem uma escala física consistente.
const SIZE=512;
const cache=new Map();
const fract=n=>n-Math.floor(n);
function hash(x,y,seed){let n=Math.imul(x+seed,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function noise(x,y,n,seed){
  const u=x*n,v=y*n,ix=Math.floor(u),iy=Math.floor(v),fx=fract(u),fy=fract(v);
  const a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy),wrap=k=>(k%n+n)%n;
  const h=(dx,dy)=>hash(wrap(ix+dx),wrap(iy+dy),seed);
  return (h(0,0)*(1-a)+h(1,0)*a)*(1-b)+(h(0,1)*(1-a)+h(1,1)*a)*b;
}
const configs={
  parquet:{scale:2.4,roughness:.58,bump:.003,color:[202,161,117]},
  terrazzo:{scale:1.2,roughness:.58,bump:.002,color:[211,211,203]},
  ceramic:{scale:1.2,roughness:.42,bump:.004,color:[224,225,222]},
  brick:{scale:1.2,roughness:.94,bump:.012,color:[174,112,83]},
  grass:{scale:7.3,roughness:.96,bump:.009,color:[185,198,160]},
  pavement:{scale:2,roughness:.91,bump:.012,color:[217,211,197]},
  asphalt:{scale:2,roughness:.96,bump:.006,color:[164,165,165]},
  plaster:{scale:3,roughness:.93,bump:.006,color:[237,233,225]},
  concrete:{scale:3,roughness:.88,bump:.009,color:[211,212,210]},
  roof:{scale:2,roughness:.86,bump:.018,color:[221,196,183]},
  metal:{scale:2,roughness:.72,bump:.009,color:[207,211,215]},
  bark:{scale:1,roughness:1,bump:.035,color:[202,176,145]},
  foliage:{scale:1,roughness:1,bump:.012,color:[179,207,155]},
  wood:{scale:2,roughness:.83,bump:.007,color:[219,187,154]},
  epoxy:{scale:2.4,roughness:.32,bump:.0015,color:[196,199,204]},
  acoustic:{scale:1.2,roughness:.94,bump:.004,color:[190,193,201]},
  brushed:{scale:1,roughness:.43,bump:.001,color:[215,219,225]},
  laminate:{scale:1.2,roughness:.55,bump:.002,color:[212,215,220]},
  upholstery:{scale:.35,roughness:.95,bump:.0015,color:[200,200,200]}
};
function texturePair(kind){
  if(cache.has(kind))return cache.get(kind);
  const cfg=configs[kind];
  const canvas=document.createElement('canvas'),height=document.createElement('canvas');
  canvas.width=canvas.height=height.width=height.height=SIZE;
  const ctx=canvas.getContext('2d'),hc=height.getContext('2d'),img=ctx.createImageData(SIZE,SIZE),hm=hc.createImageData(SIZE,SIZE);
  const clamp=v=>Math.max(0,Math.min(255,v));
  for(let py=0;py<SIZE;py++)for(let px=0;px<SIZE;px++){
    const x=px/SIZE,y=py/SIZE,k=(py*SIZE+px)*4;
    const fine=hash(px,py,43)-.5,macro=noise(x,y,8,79)-.5,mid=noise(x,y,32,31)-.5;
    let v=1,b=.5,r=0,g=0;
    if(kind==='grass'){
      const blades=noise(x,y,192,19)-.5;
      v=.96+.045*macro+.075*mid+.15*fine+.23*blades;
      g=3*mid;r=3*mid;b=.48+.32*blades+.18*fine;
    }else if(kind==='foliage'){
      const blades=noise(x,y,128,19)-.5;
      v=.91+.24*macro+.18*mid+.22*fine+.23*blades;
      g=12*macro;r=8*mid;b=.48+.35*blades+.18*fine;
    }else if(kind==='parquet'){
      const row=Math.floor(x*16),u=fract(y*3+(row%3)/3),w=fract(x*16);
      const edge=Math.min(u*0.8,(1-u)*0.8,w*.15,(1-w)*.15);
      const joint=Math.max(0,Math.min(1,edge/.0035));
      const plank=hash(row,Math.floor(y*3+(row%3)/3)%3,51)-.5;
      const grain=Math.sin(x*Math.PI*2*150+noise(x,y,8,59)*4);
      v=(.75+.25*joint)*(.96+.22*plank+.06*grain+.07*fine);b=.28+.38*joint+.055*grain;
    }else if(kind==='terrazzo'){
      const speck=hash(Math.floor(px/3),Math.floor(py/3),57);
      v=.96+.06*mid+.04*fine+(speck>.91?.12:speck<.10?-.24:0);
      b=.50+.08*fine;
    }else if(kind==='ceramic'){
      const u=fract(x*4),w=fract(y*4),edge=Math.min(u,1-u,w,1-w);
      const joint=Math.max(0,Math.min(1,(edge-.009)/.012));
      v=(.72+.28*joint)*(.97+.04*mid+.03*fine);b=.25+.45*joint;
    }else if(kind==='brick'){
      const rows=16,cols=5,row=Math.floor(y*rows);
      const u=fract(x*cols+(row%2)*.5),w=fract(y*rows);
      const edge=Math.min(u*1.2/cols,(1-u)*1.2/cols,w*1.2/rows,(1-w)*1.2/rows);
      const joint=Math.max(0,Math.min(1,(edge-.003)/.004));
      const brick=hash((Math.floor(x*cols+(row%2)*.5)+cols)%cols,row,77)-.5;
      v=.94+.30*brick+.12*mid+.09*fine;
      const mortar=143+fine*15+mid*10;
      r=(mortar-cfg.color[0]*v)*(1-joint);
      g=(mortar-cfg.color[1]*v)*(1-joint);
      img.data[k+2]=clamp(cfg.color[2]*v*joint+mortar*(1-joint));
      b=.22+.58*joint+.10*fine;
      img.data[k]=clamp(cfg.color[0]*v+r);img.data[k+1]=clamp(cfg.color[1]*v+g);
      img.data[k+3]=255;hm.data[k]=hm.data[k+1]=hm.data[k+2]=clamp(b*255);hm.data[k+3]=255;
      continue;
    }else if(kind==='pavement'){
      const rows=8,cols=6,row=Math.floor(y*rows);
      const u=fract(x*cols+(row%2)*.5),w=fract(y*rows);
      const edge=Math.min(u,1-u,w,1-w);
      const joint=Math.max(0,Math.min(1,(edge-.012)/.035));
      const stone=hash((Math.floor(x*cols+(row%2)*.5)+cols)%cols,row,17)-.5;
      v=(.65+.35*joint)*(1+.12*stone+.12*mid+.10*fine);b=.20+.58*joint+.10*fine;
    }else if(kind==='asphalt'){
      v=.90+.18*macro+.22*fine+.12*mid;b=.48+.37*fine+.12*mid;
      if(fine>.46)v+=.14;
    }else if(kind==='roof'){
      const row=Math.floor(y*7),u=fract(x*7+(row%2)*.5),w=fract(y*7);
      const seam=Math.min(u,1-u,w,1-w);
      const tile=Math.max(0,Math.min(1,seam/.035));
      v=(.72+.28*tile)*(.9+.13*Math.sin(u*Math.PI)+.10*macro+.08*fine);b=.25+.4*tile+.16*Math.sin(u*Math.PI);
    }else if(kind==='metal'){
      const u=fract(x*8),ridge=Math.pow(Math.abs(Math.cos(u*Math.PI)),14);
      v=.96-.22*ridge+.06*fine+.07*macro;b=.38+.46*ridge;
    }else if(kind==='epoxy'){
      const fleck=hash(px,py,101);
      v=.96+.08*macro+.06*mid+.06*fine;
      if(fleck>.982)v+=.14;else if(fleck<.018)v-=.15;
      b=.50+.12*fine;
    }else if(kind==='acoustic'){
      const row=Math.floor(y*48);
      const u=fract(x*48+(row%2)*.5)-.5,w=fract(y*48)-.5;
      const hole=1-Math.max(0,Math.min(1,(Math.hypot(u,w)-.14)/.09));
      v=.96-.29*hole+.05*mid+.045*fine;b=.55-.35*hole+.04*fine;
    }else if(kind==='brushed'){
      const streak=hash(0,py,105)-.5;
      v=.97+.13*streak+.04*macro+.025*fine;b=.50+.13*streak;
    }else if(kind==='laminate'){
      v=.97+.045*macro+.035*mid+.07*fine;b=.50+.13*fine;
    }else if(kind==='upholstery'){
      const weave=Math.sin(x*Math.PI*2*128)*Math.sin(y*Math.PI*2*128);
      v=.96+.075*weave+.035*fine;b=.50+.25*weave;
    }else if(kind==='bark'||kind==='wood'){
      const stripe=Math.sin(2*Math.PI*(x*18+noise(x,y,4,91)*1.8));
      const groove=Math.pow((1+stripe)/2,4);
      v=.98-.32*groove+.15*macro+.12*fine;b=.65-.35*groove+.1*fine;
    }else{
      v=.98+.10*macro+.10*mid+.10*fine;b=.5+.16*mid+.20*fine;
      if(kind==='concrete'&&fine>.48)v-=.15;
    }
    img.data[k]=clamp(cfg.color[0]*v+r);img.data[k+1]=clamp(cfg.color[1]*v+g);img.data[k+2]=clamp(cfg.color[2]*v);
    img.data[k+3]=255;hm.data[k]=hm.data[k+1]=hm.data[k+2]=clamp(b*255);hm.data[k+3]=255;
  }
  ctx.putImageData(img,0,0);hc.putImageData(hm,0,0);
  function tex(c,color){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;return t;}
  const pair={map:tex(canvas,true),bumpMap:tex(height,false)};
  cache.set(kind,pair);return pair;
}
export function exteriorMaterial(kind,color=0xffffff){
  const cfg=configs[kind];return new THREE.MeshStandardMaterial({color,...texturePair(kind),roughness:cfg.roughness,bumpScale:cfg.bump,userData:{tileMeters:cfg.scale}});
}
// Materiais interiores reutilizam a mesma cache e escala UV.
export function interiorMaterial(kind,color,options={}){
  const material=exteriorMaterial(kind,color);
  Object.assign(material,options);
  return material;
}
// BoxGeometry tem seis faces e UV 0..1 por face. Reescala pelas dimensões reais.
export function metricBox(w,h,d,material){
  const geometry=new THREE.BoxGeometry(w,h,d),tile=material?.userData?.tileMeters;
  if(!tile)return geometry;
  const uv=geometry.attributes.uv;
  const sizes=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let face=0;face<6;face++)for(let j=0;j<4;j++){
    const k=face*4+j;uv.setXY(k,uv.getX(k)*sizes[face][0]/tile,uv.getY(k)*sizes[face][1]/tile);
  }
  uv.needsUpdate=true;return geometry;
}
export function metricCylinder(geometry,material,radius,height){
  const uv=geometry.attributes.uv,tile=material.userData.tileMeters||1;
  for(let j=0;j<uv.count;j++)uv.setXY(j,uv.getX(j)*Math.max(1,Math.round(2*Math.PI*radius/tile)),uv.getY(j)*height/tile);
  uv.needsUpdate=true;return geometry;
}

// Variação contínua da relva em coordenadas mundiais, sem grelha de tiles.
// O detalhe fino vem da textura; as manchas de vários metros nunca se repetem no campus.
export function organicGrass(){
  const material=exteriorMaterial('grass',0x82a85d);
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vGrassWorld;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGrassWorld = (modelMatrix * vec4(position,1.0)).xz;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec2 vGrassWorld;
float grassHash(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
}
float grassNoise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(grassHash(i),grassHash(i+vec2(1.,0.)),f.x),
             mix(grassHash(i+vec2(0.,1.)),grassHash(i+vec2(1.,1.)),f.x),f.y);
}
`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
vec2 gp=vGrassWorld;
float warp=grassNoise(gp*.13+vec2(19.2,7.4));
float broad=grassNoise(gp*.17+vec2(warp*1.6,warp*.9));
float medium=grassNoise(gp*.67+vec2(13.7,28.2));
float small=grassNoise(gp*2.7+vec2(3.1,7.8));
float dry=smoothstep(.55,.88,broad*.65+medium*.35);
vec3 tint=mix(vec3(.84,.98,.89),vec3(1.13,1.03,.71),dry);
float shade=.88+.22*broad+.13*medium+.055*small;
diffuseColor.rgb*=tint*shade;
`);
  };
  material.customProgramCacheKey=()=> 'organic-grass-world-v1';
  return material;
}
