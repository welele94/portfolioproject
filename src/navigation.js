import * as THREE from 'three';

// Movimento FPS com colisão horizontal simplificada (círculo contra AABB/círculo).
// A câmara orbital continua disponível para inspeção da cena.
export function createNavigation({camera, canvas, controls, obstacles, spawn, destination, eyeHeight=1.68}) {
  const radius = 0.32;
  const WALK_SPEED = 3.8; // m/s virtuais
  const RUN_SPEED = 6.2;  // sprint: ~10 s até à porta dos Projetos
  const BOUNDS = {minX:-28.8,maxX:28.8,minZ:-43.0,maxZ:43.0};
  const player = new THREE.Vector3(spawn.x,eyeHeight,spawn.z);
  let mode='aerial',yaw=-.75,pitch=0,clockStarted=false,elapsed=0,completed=false;
  let aerialPosition = camera.position.clone();
  let aerialTarget = controls.target.clone();
  const keys = new Set();
  const status = document.querySelector('#nav-status');
  const timer = document.querySelector('#route-timer');
  const distance = document.querySelector('#route-distance');
  const viewButton = document.querySelector('#view-toggle');
  const restartButton = document.querySelector('#route-restart');
  const crosshair = document.querySelector('#crosshair');
  const hud = document.querySelector('#player-hud');
  const help = document.querySelector('#fps-hint');

  function collides(x,z) {
    if(x-radius<BOUNDS.minX||x+radius>BOUNDS.maxX||z-radius<BOUNDS.minZ||z+radius>BOUNDS.maxZ)return true;
    for(const o of obstacles) {
      if(o.type==='circle'){
        const dx=x-o.x,dz=z-o.z;
        if(dx*dx+dz*dz<(radius+o.r)**2)return true;
      } else {
        const qx=Math.max(o.x-o.w/2,Math.min(x,o.x+o.w/2));
        const qz=Math.max(o.z-o.d/2,Math.min(z,o.z+o.d/2));
        if((x-qx)**2+(z-qz)**2<radius*radius)return true;
      }
    }
    return false;
  }
  function updateHud(){
    if(timer) timer.textContent=completed?'Concluído: '+elapsed.toFixed(1)+' s':clockStarted?elapsed.toFixed(1)+' s':'0.0 s';
    if(distance)distance.textContent=Math.hypot(destination.x-player.x,destination.z-player.z).toFixed(1)+' m';
  }
  function look() {
    camera.rotation.order='YXZ';
    camera.rotation.set(pitch,yaw,0);
  }
  function setMode(next) {
    if(next===mode)return;
    keys.clear();
    if(next==='first') {
      aerialPosition.copy(camera.position);
      aerialTarget.copy(controls.target);
      controls.enabled=false;
      camera.fov=70;
      camera.position.copy(player);
      look();
    } else {
      if(document.pointerLockElement===canvas)document.exitPointerLock?.();
      controls.enabled=true;
      camera.fov=48;
      camera.position.copy(aerialPosition);
      controls.target.copy(aerialTarget);
      controls.update();
    }
    camera.updateProjectionMatrix();
    mode=next;
    if(viewButton)viewButton.textContent=mode==='first'?'Vista aérea (V)':'Jogar em first-person (V)';
    if(hud)hud.hidden=mode!=='first';
    if(crosshair)crosshair.hidden=mode!=='first';
    if(status)status.textContent=mode==='first'?'First-person: clica no mundo para ativar o rato':'Vista aérea: roda e aproxima a câmara';
    if(help)help.hidden=mode!=='first';
  }
  function reset() {
    player.set(spawn.x,eyeHeight,spawn.z);
    elapsed=0;clockStarted=false;completed=false;
    yaw=-.75;pitch=0;
    if(mode==='first'){camera.position.copy(player);look();}
    if(status)status.textContent='Percurso reiniciado: Casa → Projetos';
    updateHud();
  }
  viewButton?.addEventListener('click',()=>setMode(mode==='first'?'aerial':'first'));
  restartButton?.addEventListener('click',reset);
  canvas.addEventListener('click',()=>{
    if(mode==='first'&&document.pointerLockElement!==canvas) {
      canvas.requestPointerLock?.();
    }
  });
  document.addEventListener('pointerlockchange',()=>{
    if(mode==='first'&&status) status.textContent=document.pointerLockElement===canvas?'WASD andar · Shift correr · V vista aérea · R reiniciar':'Clica no cenário para controlar o rato';
  });
  document.addEventListener('mousemove',event=>{
    if(mode!=='first'||document.pointerLockElement!==canvas)return;
    const sensitivity=.0022;
    yaw-=event.movementX*sensitivity;
    pitch=Math.max(-Math.PI/2+.08,Math.min(Math.PI/2-.08,pitch-event.movementY*sensitivity));
    look();
  });
  document.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey)return;
    const key=event.code;
    if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyV','KeyR'].includes(key)) event.preventDefault();
    if(key==='KeyV'&&!event.repeat)setMode(mode==='first'?'aerial':'first');
    else if(key==='KeyR'&&!event.repeat)reset();
    else keys.add(key);
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',()=>keys.clear());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();});
  function update(dt) {
    if(mode!=='first')return;
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    const strafe=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    const length=Math.hypot(forward,strafe);
    if(length>0) {
      const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight'))?RUN_SPEED:WALK_SPEED;
      const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)/length*speed*dt;
      const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)/length*speed*dt;
      // Separar os eixos permite deslizar ao longo dos obstáculos.
      if(!collides(player.x+dx,player.z)) player.x+=dx;
      if(!collides(player.x,player.z+dz)) player.z+=dz;
      if(!completed) {
        if(!clockStarted)clockStarted=true;
        elapsed+=dt;
      }
    }
    camera.position.copy(player);
    if(!completed&&Math.hypot(player.x-destination.x,player.z-destination.z)<1.8) {
      completed=true;
      if(status)status.textContent='Chegaste à porta dos Projetos! Tempo: '+elapsed.toFixed(1)+' s';
      if(help)help.textContent='Destino alcançado! R reinicia o percurso.';
    }
    updateHud();
  }
  updateHud();
  return { update, getMode:()=>mode, getPlayerPosition:()=>player, setMode };
}
