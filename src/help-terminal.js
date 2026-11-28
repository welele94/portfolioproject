// Browser demo of Help!: temporary anonymous profile, original catalog.
import { messages } from './help-messages.js';
export function createHelpTerminal(){
 const overlay=document.createElement('div');overlay.className='project-overlay';overlay.hidden=true;
 const panel=document.createElement('section');panel.className='project-card';panel.style.cssText='width:min(720px,100%);background:#101820;border-color:#51c6cb;font:15px/1.6 monospace';
 const heading=document.createElement('h2');heading.textContent='Help! — Terminal';heading.style.color='#66d9e8';
 const output=document.createElement('pre');output.style.cssText='white-space:pre-wrap;overflow:auto;max-height:48vh;color:#d9e9e9;font:inherit';
 const form=document.createElement('form'),input=document.createElement('input');input.placeholder='Escreve um comando e Enter';input.autocomplete='off';input.setAttribute('aria-label','Comando Help!');input.style.cssText='width:100%;padding:12px;background:#071016;color:#72e5c4;border:1px solid #51c6cb;font:inherit';form.append(input);
 const buttons=document.createElement('div');buttons.className='project-buttons';
 const link=document.createElement('a');link.href='https://github.com/welele94/help_app';link.target='_blank';link.rel='noopener noreferrer';link.textContent='GitHub';
 const close=document.createElement('button');close.type='button';close.textContent='Fechar (Esc)';buttons.append(link,close);panel.append(heading,output,form,buttons);overlay.append(panel);document.body.append(overlay);
 const states=['ansioso','triste','zangado','cansado','feliz','motivado'],emoji=['😟','😞','😤','😴','😌','🔥'];
 let last=null,streak=0,values={},history=[],name='visitante',stage='name',onClose=()=>{};
 function menu(){return '╭─ Escolha o seu estado ─────────────╮\n'+states.map((s,i)=>(i+1)+'  '+emoji[i]+'  '+s).join('\n')+'\n╰───────────────────────────────────╯\nH Histórico | Q Sair\nEscolha (1-6 ou H/Q):';}
 function append(s){output.textContent+='\n'+s;output.scrollTop=output.scrollHeight;}
 function finish(){overlay.hidden=true;onClose();}
 close.onclick=finish;overlay.addEventListener('click',e=>{if(e.target===overlay)finish();});
 overlay.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();finish();}});
 form.addEventListener('submit',async e=>{e.preventDefault();const raw=input.value.trim();input.value='';if(!raw)return;
 if(stage==='name'){name=raw.slice(0,40);stage='menu';append('Bem-vindo, '+name+'!\n'+menu());return;}
 const cmd=raw.toLowerCase();if(cmd==='q'){finish();return;}if(cmd==='h'){append(history.length?history.slice(-5).map(x=>x.state+' | '+x.intensity+'/5 | '+x.msg).join('\n'):'Ainda não há histórico.');append(menu());return;}
 if(!/^[1-6]$/.test(cmd)){append('Comando inválido. Escolha 1-6, H ou Q.');return;}
 const state=states[Number(cmd)-1];let v=values[state]??3;
 if(last!==state){for(const k of Object.keys(values))if(k!==state)values[k]=Math.max(0,values[k]-.25);last=state;streak=1;v*=1.05;}else{streak++;v*=streak===2?1.25:streak===3?1.15:1.05;}
 values[state]=Math.min(5,v);const intensity=Math.max(1,Math.floor(values[state]));const pool=messages[state]?.[String(intensity)]??[];
 const msg=pool.length?pool[Math.floor(Math.random()*pool.length)]:'Vamos com calma.';
 history.push({state,intensity,msg});append('╭─ Mensagem do dia ─────────────────╮\nEstado: '+state+'\nIntensidade: '+intensity+'/5\n\n'+msg.toUpperCase()+'\n╰───────────────────────────────────╯\nStats: total='+history.length+'\n'+menu());
 });
 return {get active(){return !overlay.hidden;},open(cb){onClose=cb;last=null;streak=0;values={};history=[];stage='name';output.textContent='$ python3 main.py\nHelp! — A sua app de estados de espírito\nDemonstração web · perfil temporário\nNome de Utilizador:';overlay.hidden=false;input.focus();}};
}
