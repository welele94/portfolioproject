// Screenshot gallery: add actual screenshots to images/nextseat/ and list paths here.
export const nextSeatScreens=[
 {title:'NextSeat',image:'./images/nextseat.png',description:'Apresentação do projeto. Mais capturas da aplicação serão adicionadas.'}
];
export function createNextSeatDemo(){
 const o=document.createElement('div');o.className='project-overlay';o.hidden=true;
 const panel=document.createElement('section');panel.className='project-card';panel.style.width='min(700px,100%)';
 const h=document.createElement('h2');h.textContent='NextSeat — Demonstração';const title=document.createElement('p'),img=document.createElement('img'),desc=document.createElement('p');img.style.cssText='display:block;width:100%;height:44vh;object-fit:contain;background:#0d1928;border-radius:8px';img.onerror=()=>{img.hidden=true;};img.onload=()=>{img.hidden=false;};
 const calm=document.createElement('div');calm.hidden=true;calm.style.cssText='text-align:center;padding:20px;background:#102d4c;border-radius:10px';
 const circle=document.createElement('div');circle.style.cssText='width:90px;height:90px;border-radius:50%;background:#76d6ff;margin:30px auto;box-shadow:0 0 24px #76d6ff88';const instruction=document.createElement('p');calm.append(circle,instruction);
 const buttons=document.createElement('div');buttons.className='project-buttons';
 function btn(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;buttons.append(b);return b;}
 let index=0,raf=0,onClose=()=>{},start=0,breathing=false;
 function show(){title.textContent=nextSeatScreens[index].title+' · '+(index+1)+'/'+nextSeatScreens.length;img.hidden=true;img.src=nextSeatScreens[index].image;img.alt=nextSeatScreens[index].title;desc.textContent=nextSeatScreens[index].description;prev.disabled=nextSeatScreens.length<2;next.disabled=prev.disabled;}
 const prev=btn('Anterior',()=>{index=(index+nextSeatScreens.length-1)%nextSeatScreens.length;show();});const next=btn('Seguinte',()=>{index=(index+1)%nextSeatScreens.length;show();});
 function stop(){breathing=false;cancelAnimationFrame(raf);calm.hidden=true;}
 function frame(now){if(!breathing)return;const t=((now-start)/1000)%10;const k=t<4?t/4:1-(t-4)/6;circle.style.transform='scale('+(.75+.5*k)+')';instruction.textContent=t<4?'Inspirar · '+Math.ceil(4-t)+' s':'Expirar · '+Math.ceil(10-t)+' s';raf=requestAnimationFrame(frame);}
 btn('Calm Mode',()=>{if(breathing){stop();return;}breathing=true;calm.hidden=false;start=performance.now();raf=requestAnimationFrame(frame);});
 const link=document.createElement('a');link.textContent='GitHub';link.href='https://github.com/welele94/NextSeatProject';link.target='_blank';link.rel='noopener noreferrer';buttons.append(link);
 function close(){stop();o.hidden=true;onClose();}
 const closeButton=btn('Fechar (Esc)',close);panel.append(h,title,img,desc,calm,buttons);o.append(panel);document.body.append(o);
 o.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}});o.addEventListener('click',e=>{if(e.target===o)close();});
 return {get active(){return !o.hidden;},open(cb){onClose=cb;index=0;o.hidden=false;show();closeButton.focus();}};
}
