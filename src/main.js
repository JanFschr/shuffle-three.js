import * as THREE from "three";
import { GameAudio } from "./audio.js";
import { FIXED_STEP, TABLE, activateImpulse, createGame, setTarget, startGame, stepGame } from "./game/simulation.js";

const canvas = document.querySelector("#game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x040609); scene.fog = new THREE.FogExp2(0x05080c, .032);
const camera = new THREE.PerspectiveCamera(47, 1, .1, 80); camera.position.set(0, 11.4, 14.7); camera.lookAt(0, 0, -1.2);

scene.add(new THREE.HemisphereLight(0x417a76, 0x080507, 1.25));
const redLight = new THREE.PointLight(0xff205c, 28, 18); redLight.position.set(-5, 3, -5); scene.add(redLight);
const cyanLight = new THREE.PointLight(0x50ffdc, 20, 13); cyanLight.position.set(4, 2, 3); scene.add(cyanLight);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(35, 36), new THREE.MeshStandardMaterial({ color: 0x080a0e, roughness: .85, metalness: .25 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.8; scene.add(floor);
const table = new THREE.Mesh(new THREE.BoxGeometry(TABLE.halfWidth * 2, .6, TABLE.halfLength * 2), new THREE.MeshStandardMaterial({ color: 0x10191a, roughness: .5, metalness: .72 })); table.position.y = -.35; scene.add(table);
const surface = new THREE.Mesh(new THREE.PlaneGeometry(TABLE.halfWidth * 2 - .2, TABLE.halfLength * 2 - .15), new THREE.MeshStandardMaterial({ color: 0x0a2523, roughness: .4, metalness: .32 })); surface.rotation.x = -Math.PI / 2; surface.position.y = -.025; scene.add(surface);
const grid = new THREE.GridHelper(16, 32, 0x277f70, 0x173a36); grid.position.y = -.01; grid.scale.x = .56; scene.add(grid);

const railMat = new THREE.MeshStandardMaterial({ color: 0x263b3b, metalness: .85, roughness: .25, emissive: 0x081413 });
const addRail = (x, z, w, d) => { const rail = new THREE.Mesh(new THREE.BoxGeometry(w,.48,d),railMat); rail.position.set(x,.12,z); scene.add(rail); };
addRail(-4.65,0,.3,16.5); addRail(4.65,0,.3,16.5);

const glowMat = new THREE.MeshBasicMaterial({ color: 0x64ffe0 });
const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(8.7,.018), new THREE.MeshBasicMaterial({ color: 0x3b8d80, transparent: true, opacity: .38 })); centerLine.rotation.x=-Math.PI/2; centerLine.position.y=.005; scene.add(centerLine);
function disc(radius, color, emissive) { const group=new THREE.Group(); const body=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.22,40),new THREE.MeshStandardMaterial({color,metalness:.8,roughness:.22,emissive,emissiveIntensity:.5})); group.add(body); const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*.75,.045,10,32),glowMat);ring.rotation.x=Math.PI/2;ring.position.y=.13;group.add(ring);scene.add(group);return group; }
function striker(color,emissive){const group=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(1.44,.28,.84),new THREE.MeshStandardMaterial({color,metalness:.8,roughness:.22,emissive,emissiveIntensity:.5}));group.add(body);const top=new THREE.Mesh(new THREE.BoxGeometry(1.12,.025,.52),new THREE.MeshBasicMaterial({color:emissive,transparent:true,opacity:.7}));top.position.y=.155;group.add(top);scene.add(group);return group;}
const puckMesh=disc(.27,0xd6fff7,0x30cdb2), playerMesh=striker(0x282b31,0xff174f), enemyMesh=striker(0x222c2b,0x2dffce);
const reticle=new THREE.Mesh(new THREE.RingGeometry(.16,.2,24),new THREE.MeshBasicMaterial({color:0xff668d,transparent:true,opacity:.65,side:THREE.DoubleSide}));reticle.rotation.x=-Math.PI/2;reticle.position.set(0,.025,5.6);scene.add(reticle);

const glassMaterial=(color)=>new THREE.MeshPhysicalMaterial({color,transparent:true,opacity:.22,roughness:.08,metalness:.1,transmission:.45,emissive:color,emissiveIntensity:.18,side:THREE.DoubleSide});
function createBarrier(z,color){
  const group=new THREE.Group(),panel=new THREE.Mesh(new THREE.BoxGeometry(8.7,1.3,.07),glassMaterial(color));group.add(panel);
  const points=[];
  for(let i=0;i<20;i++){const x=(i%5-2)*1.65,y=(Math.floor(i/5)-1.5)*.28;points.push(x,y,.05,x+(i%2?.48:-.42),y+.28,.05,x,y,.05,x+(i%3?.22:-.3),y-.25,.05);}
  const cracks=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position",new THREE.Float32BufferAttribute(points,3)),new THREE.LineBasicMaterial({color:0xeafffa,transparent:true,opacity:0}));group.add(cracks);
  const shards=[];
  for(let i=0;i<24;i++){const shard=new THREE.Mesh(new THREE.TetrahedronGeometry(.13+Math.random()*.1),glassMaterial(color));shard.position.set(THREE.MathUtils.randFloatSpread(8),THREE.MathUtils.randFloatSpread(1),0);shard.visible=false;shard.userData.home=shard.position.clone();shard.userData.initialVelocity=new THREE.Vector3(THREE.MathUtils.randFloatSpread(2),Math.random()*2+.4,THREE.MathUtils.randFloatSpread(1));shard.userData.velocity=shard.userData.initialVelocity.clone();group.add(shard);shards.push(shard);}
  group.position.set(0,.58,z);scene.add(group);return{group,panel,cracks,shards,shattered:false,impact:0};
}
const playerBarrier=createBarrier(8.45,0xff245c),enemyBarrier=createBarrier(-8.45,0x45ffd5);
const silhouette = new THREE.Group();
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.7,1.2,5,12),new THREE.MeshStandardMaterial({color:0x101516,emissive:0x172f2b}));torso.position.y=.5;silhouette.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.48,16,12),new THREE.MeshStandardMaterial({color:0x151b1b,emissive:0x18332e}));head.position.y=1.75;silhouette.add(head);
silhouette.position.set(0,.3,-10.2); scene.add(silhouette);
for(let i=0;i<18;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.08,THREE.MathUtils.randFloat(.6,2.3),.08),new THREE.MeshBasicMaterial({color:i%3?0x173d37:0xa71944}));bar.position.set(THREE.MathUtils.randFloatSpread(18),THREE.MathUtils.randFloat(0,2),-12-THREE.MathUtils.randFloat(0,5));scene.add(bar);}

const state=createGame(), audio=new GameAudio(); let accumulator=0,last=performance.now(), impulseCooldown=0;
const keys=new Set();
const ui={message:document.querySelector("#message"),pause:document.querySelector("#pause-message"),start:document.querySelector("#start"),pauseButton:document.querySelector("#pause-toggle"),resume:document.querySelector("#resume"),audio:document.querySelector("#audio-toggle"),enemyHp:document.querySelector("#enemy-hp"),playerHp:document.querySelector("#player-hp"),enemyBar:document.querySelector("#enemy-bar"),playerBar:document.querySelector("#player-bar"),speed:document.querySelector("#speed"),rally:document.querySelector("#rally"),ability:document.querySelector("#ability-state")};
function begin(){if(state.phase==="ended"){Object.assign(state,createGame());resetBarrier(playerBarrier);resetBarrier(enemyBarrier);}startGame(state);ui.message.classList.remove("visible");audio.startMusic();audio.hit("striker",.2);}
function useImpulse(){if(state.phase!=="playing"||impulseCooldown>0)return;activateImpulse(state);impulseCooldown=2.5;audio.hit("striker",1);}
function togglePause(){if(state.phase==="playing"||state.phase==="serve"){state.pausedFrom=state.phase;state.phase="paused";ui.pause.classList.add("visible");ui.pauseButton.textContent="FORTSETZEN";ui.pauseButton.setAttribute("aria-pressed","true");}else if(state.phase==="paused"){state.phase=state.pausedFrom||"playing";ui.pause.classList.remove("visible");ui.pauseButton.textContent="PAUSE";ui.pauseButton.setAttribute("aria-pressed","false");}}
ui.start.addEventListener("click",begin);
ui.pauseButton.addEventListener("click",togglePause);ui.resume.addEventListener("click",togglePause);
addEventListener("keydown",e=>{keys.add(e.code);if(e.code==="Enter"&&(state.phase==="ready"||state.phase==="ended"))begin();if(e.code==="Space")useImpulse();if(e.code==="KeyR"){Object.assign(state,createGame());resetBarrier(playerBarrier);resetBarrier(enemyBarrier);begin();}if(e.code==="KeyP"||e.code==="Escape")togglePause();});
addEventListener("keyup",e=>keys.delete(e.code));
canvas.addEventListener("pointermove",e=>{const x=e.clientX/innerWidth*2-1,y=e.clientY/innerHeight*2-1;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(x,-y),camera);const hit=new THREE.Vector3();ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),hit);setTarget(state,{x:hit.x,y:hit.z});reticle.position.set(state.playerTarget.x,.025,state.playerTarget.y);});
canvas.addEventListener("pointerdown",e=>{if(e.button===0)useImpulse();});
ui.audio.addEventListener("click",()=>{const enabled=audio.toggle();ui.audio.textContent=enabled?"AUDIO AN":"AUDIO AUS";ui.audio.setAttribute("aria-pressed",String(!enabled));});
document.querySelectorAll(".move[data-code]").forEach(button=>{
  const code=button.dataset.code;
  const press=event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(code);button.classList.add("active");};
  const release=event=>{event.preventDefault();keys.delete(code);button.classList.remove("active");};
  button.addEventListener("pointerdown",press);button.addEventListener("pointerup",release);button.addEventListener("pointercancel",release);button.addEventListener("lostpointercapture",release);
});
document.querySelector("#mobile-impulse").addEventListener("pointerdown",event=>{event.preventDefault();useImpulse();});

function shatter(barrier){if(barrier.shattered)return;barrier.shattered=true;barrier.panel.visible=false;barrier.cracks.visible=false;barrier.shards.forEach(shard=>shard.visible=true);}
function damageBarrier(barrier,damage,destroyed){barrier.impact=.55;barrier.cracks.material.opacity=Math.min(1,barrier.cracks.material.opacity+damage/35);barrier.shards.slice(0,Math.min(barrier.shards.length,Math.max(4,Math.ceil(damage/3)))).forEach(shard=>{shard.visible=true;shard.material.opacity=.75;shard.position.copy(shard.userData.home);shard.userData.velocity.copy(shard.userData.initialVelocity);});if(destroyed)shatter(barrier);}
function resetBarrier(barrier){barrier.shattered=false;barrier.impact=0;barrier.group.position.x=0;barrier.panel.visible=true;barrier.cracks.visible=true;barrier.cracks.material.opacity=0;barrier.shards.forEach(shard=>{shard.visible=false;shard.material.opacity=.22;shard.position.copy(shard.userData.home);shard.userData.velocity.copy(shard.userData.initialVelocity);});}
function updateBarrier(barrier,hp,frame){barrier.cracks.material.opacity=Math.max(barrier.cracks.material.opacity,Math.min(.9,(100-hp)/65));barrier.panel.material.opacity=.12+hp/100*.18;if(barrier.impact>0){barrier.impact=Math.max(0,barrier.impact-frame);barrier.group.position.x=Math.sin(barrier.impact*90)*barrier.impact*.16;}else barrier.group.position.x=0;if(hp<=0)shatter(barrier);barrier.shards.forEach(shard=>{if(!shard.visible)return;shard.userData.velocity.y-=3.2*frame;shard.position.addScaledVector(shard.userData.velocity,frame);shard.rotation.x+=frame*3;shard.rotation.z+=frame*2;if(!barrier.shattered){shard.material.opacity=Math.max(0,shard.material.opacity-frame*1.5);if(shard.material.opacity===0)shard.visible=false;}});}
function processEvent(event){if(event.type==="rail"||event.type==="striker")audio.hit(event.type,event.intensity);if(event.type==="striker")state.rally++;if(event.type==="goal"){audio.hit("goal",event.intensity);const damaged=event.side==="player"?enemyBarrier:playerBarrier;damageBarrier(damaged,event.damage,event.side==="player"?state.enemyHp===0:state.playerHp===0);}if(event.type==="win"){audio.hit("win",1);ui.message.innerHTML=`<span class="eyebrow">VERTRAG BEENDET</span><h1>${event.side==="player"?"BARRIERE GEBROCHEN":"NACHT VORBEI"}</h1><p>${event.side==="player"?"OLD SAINT // BESIEGT":"DIE STADT VERGISST NICHTS"}</p><button id="restart">NOCH EIN DUELL <kbd>R</kbd></button>`;ui.message.classList.add("visible");document.querySelector("#restart")?.addEventListener("click",begin);}}
function syncBody(mesh,body){mesh.position.set(body.x,.17,body.y);}
function updateUi(){ui.enemyHp.textContent=String(state.enemyHp);ui.playerHp.textContent=String(state.playerHp);ui.enemyBar.style.width=`${state.enemyHp}%`;ui.playerBar.style.width=`${state.playerHp}%`;ui.speed.textContent=String(Math.round(Math.hypot(state.puck.vx,state.puck.vy)*9)).padStart(3,"0");ui.rally.textContent=String(state.rally).padStart(2,"0");ui.ability.textContent=impulseCooldown>0?`${impulseCooldown.toFixed(1)} S`:"BEREIT";}
function resize(){const portrait=innerWidth<=700&&innerHeight>innerWidth;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=portrait?68:47;camera.position.set(0,portrait?13.6:11.4,portrait?18.5:14.7);camera.lookAt(0,0,-1.2);camera.updateProjectionMatrix();}addEventListener("resize",resize);resize();
function animate(now){requestAnimationFrame(animate);const frame=Math.min(.05,(now-last)/1000);last=now;impulseCooldown=Math.max(0,impulseCooldown-frame);if(state.phase==="playing"||state.phase==="serve"){accumulator+=frame;const keyboard={x:(keys.has("KeyD")||keys.has("ArrowRight")?1:0)-(keys.has("KeyA")||keys.has("ArrowLeft")?1:0),y:(keys.has("KeyS")||keys.has("ArrowDown")?1:0)-(keys.has("KeyW")||keys.has("ArrowUp")?1:0)};if(keyboard.x||keyboard.y){setTarget(state,{x:state.playerTarget.x+keyboard.x*frame*8,y:state.playerTarget.y+keyboard.y*frame*8});reticle.position.set(state.playerTarget.x,.025,state.playerTarget.y);}while(accumulator>=FIXED_STEP){stepGame(state).forEach(processEvent);accumulator-=FIXED_STEP;}}else accumulator=0;syncBody(puckMesh,state.puck);syncBody(playerMesh,state.player);syncBody(enemyMesh,state.enemy);updateBarrier(playerBarrier,state.playerHp,frame);updateBarrier(enemyBarrier,state.enemyHp,frame);puckMesh.rotation.y+=frame*Math.hypot(state.puck.vx,state.puck.vy)*.8;silhouette.rotation.z=Math.sin(state.time*1.3)*.025;updateUi();renderer.render(scene,camera);}requestAnimationFrame(animate);
