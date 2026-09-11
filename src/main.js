import * as THREE from "three";
import { GameAudio } from "./audio.js";
import { FIXED_STEP, TABLE, createGame, setPower, setTarget, startGame, stepGame } from "./game/simulation.js";

const canvas = document.querySelector("#game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x120d09); scene.fog = new THREE.FogExp2(0x160f0a, .025);
const camera = new THREE.PerspectiveCamera(48, 1, .1, 80); camera.position.set(0, 6, 16); camera.lookAt(0, .3, -2);

scene.add(new THREE.HemisphereLight(0xffd19a, 0x100a08, 1.45));
const tableLight = new THREE.DirectionalLight(0xffd3a0, 2.4); tableLight.position.set(-3, 9, 7); scene.add(tableLight);
const opponentLight = new THREE.PointLight(0xe89a4b, 18, 12); opponentLight.position.set(0, 3, -8); scene.add(opponentLight);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(35, 36), new THREE.MeshStandardMaterial({ color: 0x080a0e, roughness: .85, metalness: .25 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.8; scene.add(floor);
const table = new THREE.Mesh(new THREE.BoxGeometry(TABLE.halfWidth * 2, .6, TABLE.halfLength * 2), new THREE.MeshStandardMaterial({ color: 0x332b22, roughness: .58, metalness: .48 })); table.position.y = -.35; scene.add(table);
const surface = new THREE.Mesh(new THREE.PlaneGeometry(TABLE.halfWidth * 2 - .2, TABLE.halfLength * 2), new THREE.MeshStandardMaterial({ color: 0x23413b, roughness: .62, metalness: .16 })); surface.rotation.x = -Math.PI / 2; surface.position.y = -.025; scene.add(surface);
const grid = new THREE.GridHelper(16, 12, 0x9e6e46, 0x4e6357); grid.position.y = -.01; grid.scale.x = .56; scene.add(grid);

const railMat = new THREE.MeshStandardMaterial({ color: 0x805c37, metalness: .72, roughness: .4, emissive: 0x241509 });
const addRail = (x, z, w, d) => { const rail = new THREE.Mesh(new THREE.BoxGeometry(w,.48,d),railMat); rail.position.set(x,.12,z); scene.add(rail); };
addRail(-TABLE.halfWidth-.15,0,.3,TABLE.halfLength*2+.5); addRail(TABLE.halfWidth+.15,0,.3,TABLE.halfLength*2+.5);

const glowMat = new THREE.MeshBasicMaterial({ color: 0x64ffe0 });
const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(8.7,.018), new THREE.MeshBasicMaterial({ color: 0x3b8d80, transparent: true, opacity: .38 })); centerLine.rotation.x=-Math.PI/2; centerLine.position.y=.005; scene.add(centerLine);
const goalGlow = (z,color) => { const m=new THREE.Mesh(new THREE.BoxGeometry(TABLE.halfWidth*2,.06,.06),new THREE.MeshBasicMaterial({color}));m.position.set(0,.08,z);scene.add(m); }; goalGlow(-TABLE.halfLength,0xf0a653); goalGlow(TABLE.halfLength,0xe56a62);

function disc(radius, color, emissive) { const group=new THREE.Group(); const body=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.22,40),new THREE.MeshStandardMaterial({color,metalness:.8,roughness:.22,emissive,emissiveIntensity:.5})); group.add(body); const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*.75,.045,10,32),glowMat);ring.rotation.x=Math.PI/2;ring.position.y=.13;group.add(ring);scene.add(group);return group; }
const puckMesh=disc(.27,0xd6fff7,0x30cdb2), playerMesh=disc(.58,0x282b31,0xff174f), enemyMesh=disc(.58,0x222c2b,0x2dffce);
const reticle=new THREE.Mesh(new THREE.RingGeometry(.16,.2,24),new THREE.MeshBasicMaterial({color:0xff668d,transparent:true,opacity:.65,side:THREE.DoubleSide}));reticle.rotation.x=-Math.PI/2;reticle.position.set(0,.025,5.6);scene.add(reticle);

const glassMaterial=(color)=>new THREE.MeshPhysicalMaterial({color,transparent:true,opacity:.22,roughness:.08,metalness:.1,transmission:.45,emissive:color,emissiveIntensity:.18,side:THREE.DoubleSide});
function createBarrier(z,color){
  const group=new THREE.Group(),panel=new THREE.Mesh(new THREE.BoxGeometry(TABLE.halfWidth*2,1.35,.07),glassMaterial(color));group.add(panel);
  const points=[];
  for(let i=0;i<12;i++){const x=(i%4-1.5)*.82,y=(Math.floor(i/4)-1)*.36;points.push(x,y,.05,x+(i%2?.48:-.42),y+.28,.05,x,y,.05,x+(i%3?.22:-.3),y-.25,.05);}
  const cracks=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position",new THREE.Float32BufferAttribute(points,3)),new THREE.LineBasicMaterial({color:0xeafffa,transparent:true,opacity:0}));group.add(cracks);
  const shards=[];
  for(let i=0;i<16;i++){const shard=new THREE.Mesh(new THREE.TetrahedronGeometry(.13+Math.random()*.1),glassMaterial(color));shard.position.set(THREE.MathUtils.randFloatSpread(TABLE.halfWidth*1.8),THREE.MathUtils.randFloatSpread(1),0);shard.visible=false;shard.userData.home=shard.position.clone();shard.userData.initialVelocity=new THREE.Vector3(THREE.MathUtils.randFloatSpread(2),Math.random()*2+.4,THREE.MathUtils.randFloatSpread(1));shard.userData.velocity=shard.userData.initialVelocity.clone();group.add(shard);shards.push(shard);}
  group.position.set(0,.58,z);scene.add(group);return{panel,cracks,shards,shattered:false};
}
const playerBarrier=createBarrier(TABLE.halfLength+.4,0xe45a58),enemyBarrier=createBarrier(-TABLE.halfLength-.4,0xe9a24f);
const silhouette = new THREE.Group();
const saintMat=new THREE.MeshStandardMaterial({color:0x32251b,emissive:0x382313,roughness:.9});
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(1.15,1.7,5,16),saintMat);torso.position.y=.75;silhouette.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.66,20,16),new THREE.MeshStandardMaterial({color:0x76523a,emissive:0x3c2415,roughness:.95}));head.position.y=2.35;silhouette.add(head);
for(const side of [-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.22,1.4,4,10),saintMat);arm.position.set(side*1.05,.55,.15);arm.rotation.z=side*.62;silhouette.add(arm);}
silhouette.position.set(0,.15,-10); scene.add(silhouette);
for(let i=0;i<18;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.08,THREE.MathUtils.randFloat(.6,2.3),.08),new THREE.MeshBasicMaterial({color:i%3?0x173d37:0xa71944}));bar.position.set(THREE.MathUtils.randFloatSpread(18),THREE.MathUtils.randFloat(0,2),-12-THREE.MathUtils.randFloat(0,5));scene.add(bar);}

const state=createGame(), audio=new GameAudio(); let accumulator=0,last=performance.now();
const DEBUG=new URLSearchParams(location.search).has("debug"); document.documentElement.classList.toggle("debug",DEBUG);
const keys=new Set();
const ui={message:document.querySelector("#message"),pause:document.querySelector("#pause-message"),start:document.querySelector("#start"),audio:document.querySelector("#audio-toggle"),enemyHp:document.querySelector("#enemy-hp"),playerHp:document.querySelector("#player-hp"),enemyBar:document.querySelector("#enemy-bar"),playerBar:document.querySelector("#player-bar"),speed:document.querySelector("#speed"),rally:document.querySelector("#rally"),power:document.querySelector("#power")};
function begin(){if(state.phase==="ended"){Object.assign(state,createGame());resetBarrier(playerBarrier);resetBarrier(enemyBarrier);}startGame(state);ui.message.classList.remove("visible");audio.startMusic();audio.hit("striker",.2);}
function togglePause(){if(state.phase==="playing"||state.phase==="serve"){state.pausedFrom=state.phase;state.phase="paused";ui.pause.classList.add("visible");}else if(state.phase==="paused"){state.phase=state.pausedFrom||"playing";ui.pause.classList.remove("visible");}}
ui.start.addEventListener("click",begin);
addEventListener("keydown",e=>{keys.add(e.code);if(e.code==="Enter"&&(state.phase==="ready"||state.phase==="ended"))begin();if(e.code==="Space")setPower(state,true);if(e.code==="KeyR"){Object.assign(state,createGame());resetBarrier(playerBarrier);resetBarrier(enemyBarrier);begin();}if(e.code==="KeyP"||e.code==="Escape")togglePause();});
addEventListener("keyup",e=>{keys.delete(e.code);if(e.code==="Space")setPower(state,false);});
function pointPaddle(e){const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*2-1,y=(e.clientY-box.top)/box.height*2-1;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(x,-y),camera);const hit=new THREE.Vector3();if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),hit)){setTarget(state,{x:hit.x,y:hit.z});reticle.position.set(state.playerTarget.x,.025,state.playerTarget.y);}}
canvas.addEventListener("pointermove",pointPaddle);
canvas.addEventListener("pointerdown",e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);pointPaddle(e);});
ui.audio.addEventListener("click",()=>{const enabled=audio.toggle();ui.audio.textContent=enabled?"AUDIO AN":"AUDIO AUS";ui.audio.setAttribute("aria-pressed",String(!enabled));});
const powerDown=event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);setPower(state,true);};
const powerUp=event=>{event.preventDefault();setPower(state,false);};
ui.power.addEventListener("pointerdown",powerDown); for(const type of ["pointerup","pointercancel","lostpointercapture"])ui.power.addEventListener(type,powerUp);

function shatter(barrier){if(barrier.shattered)return;barrier.shattered=true;barrier.panel.visible=false;barrier.cracks.visible=false;barrier.shards.forEach(shard=>shard.visible=true);}
function resetBarrier(barrier){barrier.shattered=false;barrier.panel.visible=true;barrier.cracks.visible=true;barrier.cracks.material.opacity=0;barrier.shards.forEach(shard=>{shard.visible=false;shard.position.copy(shard.userData.home);shard.userData.velocity.copy(shard.userData.initialVelocity);});}
function updateBarrier(barrier,hp,frame){barrier.cracks.material.opacity=Math.min(.95,(100-hp)/58);barrier.panel.material.opacity=.24;if(hp<=0)shatter(barrier);if(barrier.shattered)barrier.shards.forEach(shard=>{shard.userData.velocity.y-=3.2*frame;shard.position.addScaledVector(shard.userData.velocity,frame);shard.rotation.x+=frame*3;shard.rotation.z+=frame*2;});}
function processEvent(event){if(event.type==="rail"||event.type==="striker")audio.hit(event.type,event.intensity,event.x/TABLE.halfWidth);if(event.type==="striker")state.rally++;if(event.type==="goal")audio.hit("goal",event.intensity,event.x/TABLE.halfWidth);if(event.type==="win"){audio.hit("win",1);shatter(event.side==="player"?enemyBarrier:playerBarrier);ui.message.innerHTML=`<span class="eyebrow">VERTRAG BEENDET</span><h1>${event.side==="player"?"BARRIERE GEBROCHEN":"NACHT VORBEI"}</h1><p>${event.side==="player"?"OLD SAINT // BESIEGT":"DIE STADT VERGISST NICHTS"}</p><button id="restart">NOCH EIN DUELL <kbd>R</kbd></button>`;ui.message.classList.add("visible");document.querySelector("#restart")?.addEventListener("click",begin);}}
function syncBody(mesh,body){mesh.position.set(body.x,.17,body.y);}
function updateUi(){ui.enemyHp.textContent=String(state.enemyHp);ui.playerHp.textContent=String(state.playerHp);ui.enemyBar.style.width=`${state.enemyHp}%`;ui.playerBar.style.width=`${state.playerHp}%`;ui.speed.textContent=String(Math.round(Math.hypot(state.puck.vx,state.puck.vy)*9)).padStart(3,"0");ui.rally.textContent=String(state.rally).padStart(2,"0");ui.power.classList.toggle("active",state.power);}
function resize(){const portrait=innerHeight>innerWidth;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=portrait?54:48;camera.position.set(0,portrait?6.8:6,portrait?13.8:16);camera.lookAt(0,.3,portrait?-2.5:-2);camera.updateProjectionMatrix();}addEventListener("resize",resize);resize();
function animate(now){requestAnimationFrame(animate);const frame=Math.min(.05,(now-last)/1000);last=now;if(state.phase==="playing"||state.phase==="serve"){accumulator+=frame;const keyboard={x:(keys.has("KeyD")||keys.has("ArrowRight")?1:0)-(keys.has("KeyA")||keys.has("ArrowLeft")?1:0),y:(keys.has("KeyS")||keys.has("ArrowDown")?1:0)-(keys.has("KeyW")||keys.has("ArrowUp")?1:0)};if(keyboard.x||keyboard.y){setTarget(state,{x:state.playerTarget.x+keyboard.x*frame*8,y:state.playerTarget.y+keyboard.y*frame*8});reticle.position.set(state.playerTarget.x,.025,state.playerTarget.y);}while(accumulator>=FIXED_STEP){stepGame(state).forEach(processEvent);accumulator-=FIXED_STEP;}}else accumulator=0;syncBody(puckMesh,state.puck);syncBody(playerMesh,state.player);syncBody(enemyMesh,state.enemy);updateBarrier(playerBarrier,state.playerHp,frame);updateBarrier(enemyBarrier,state.enemyHp,frame);puckMesh.rotation.y+=frame*Math.hypot(state.puck.vx,state.puck.vy)*.8;silhouette.rotation.z=Math.sin(state.time*1.3)*.025;updateUi();renderer.render(scene,camera);}requestAnimationFrame(animate);
