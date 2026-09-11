import * as THREE from "three";
import { GameAudio } from "./audio.js";
import { FIXED_STEP, TABLE, activateSurge, createGame, setTarget, startGame, stepGame } from "./game/simulation.js";

const canvas = document.querySelector("#game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x160f0a);
scene.fog = new THREE.FogExp2(0x1b120d, .022);

const camera = new THREE.PerspectiveCamera(48, 1, .1, 90);
camera.position.set(0, 6, 16);
camera.lookAt(0, .3, -2);

scene.add(new THREE.HemisphereLight(0xffd3a3, 0x0d0b0a, 1.25));
const tableLight = new THREE.DirectionalLight(0xffc987, 2.6);
tableLight.position.set(-3, 9, 6);
scene.add(tableLight);
const opponentLight = new THREE.PointLight(0xe19a54, 20, 13);
opponentLight.position.set(0, 3.2, -8.7);
scene.add(opponentLight);
const coolRim = new THREE.PointLight(0x5bbfab, 8, 10);
coolRim.position.set(4.5, 1.4, 1);
scene.add(coolRim);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(38, 40),
  new THREE.MeshStandardMaterial({ color: 0x0b0a09, roughness: .9, metalness: .18 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -.82;
scene.add(floor);

const tableBase = new THREE.Mesh(
  new THREE.BoxGeometry(TABLE.halfWidth * 2 + .32, .72, TABLE.halfLength * 2 + .34),
  new THREE.MeshStandardMaterial({ color: 0x3a281a, roughness: .66, metalness: .28 }),
);
tableBase.position.y = -.4;
scene.add(tableBase);

const surface = new THREE.Mesh(
  new THREE.PlaneGeometry(TABLE.halfWidth * 2 - .16, TABLE.halfLength * 2),
  new THREE.MeshStandardMaterial({ color: 0x233d34, roughness: .74, metalness: .08 }),
);
surface.rotation.x = -Math.PI / 2;
surface.position.y = -.025;
scene.add(surface);

function addTableGrid() {
  const positions = [];
  const xInset = .24;
  const zInset = .18;
  const xMin = -TABLE.halfWidth + xInset;
  const xMax = TABLE.halfWidth - xInset;
  const zMin = -TABLE.halfLength + zInset;
  const zMax = TABLE.halfLength - zInset;

  for (let i = 1; i < 8; i++) {
    const x = THREE.MathUtils.lerp(xMin, xMax, i / 8);
    positions.push(x, .008, zMin, x, .008, zMax);
  }
  for (let i = 1; i < 12; i++) {
    const z = THREE.MathUtils.lerp(zMin, zMax, i / 12);
    positions.push(xMin, .008, z, xMax, .008, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x728473, transparent: true, opacity: .24 }),
  );
  scene.add(lines);
}
addTableGrid();

const railMat = new THREE.MeshStandardMaterial({
  color: 0x7f5735,
  metalness: .64,
  roughness: .48,
  emissive: 0x1e1008,
  emissiveIntensity: .34,
});
const boltMat = new THREE.MeshStandardMaterial({ color: 0xb88b5f, metalness: .8, roughness: .33 });
const boltGeo = new THREE.CylinderGeometry(.075, .075, .05, 14);

function addRail(x) {
  const rail = new THREE.Mesh(new THREE.BoxGeometry(.34, .52, TABLE.halfLength * 2 + .5), railMat);
  rail.position.set(x, .13, 0);
  scene.add(rail);
  for (const z of [-6.4, -3.2, 0, 3.2, 6.4]) {
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.set(x, .415, z);
    scene.add(bolt);
  }
}
addRail(-TABLE.halfWidth - .15);
addRail(TABLE.halfWidth + .15);

const centerLine = new THREE.Mesh(
  new THREE.PlaneGeometry(TABLE.halfWidth * 2 - .32, .025),
  new THREE.MeshBasicMaterial({ color: 0x9e6945, transparent: true, opacity: .42 }),
);
centerLine.rotation.x = -Math.PI / 2;
centerLine.position.y = .01;
scene.add(centerLine);

function goalGlow(z, color) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(TABLE.halfWidth * 2, .055, .065),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .78 }),
  );
  line.position.set(0, .075, z);
  scene.add(line);
}
goalGlow(-TABLE.halfLength, 0xd89b5a);
goalGlow(TABLE.halfLength, 0xc95d50);

function roundedDisc(radius, color, emissive, topColor, height = .28) {
  const group = new THREE.Group();
  const half = height / 2;
  const profile = [
    new THREE.Vector2(0, -half),
    new THREE.Vector2(radius * .72, -half),
    new THREE.Vector2(radius * .91, -half * .76),
    new THREE.Vector2(radius, -half * .18),
    new THREE.Vector2(radius, half * .2),
    new THREE.Vector2(radius * .93, half * .72),
    new THREE.Vector2(radius * .73, half),
    new THREE.Vector2(0, half),
  ];
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 48),
    new THREE.MeshStandardMaterial({
      color,
      metalness: .65,
      roughness: .3,
      emissive,
      emissiveIntensity: .28,
    }),
  );
  group.add(body);

  const top = new THREE.Mesh(
    new THREE.CircleGeometry(radius * .66, 40),
    new THREE.MeshStandardMaterial({ color: topColor, metalness: .35, roughness: .42, emissive, emissiveIntensity: .12 }),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = half + .008;
  group.add(top);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * .73, Math.max(.026, radius * .055), 12, 40),
    new THREE.MeshStandardMaterial({ color: topColor, emissive: topColor, emissiveIntensity: .36, metalness: .25, roughness: .35 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = half + .018;
  group.add(ring);
  scene.add(group);
  return group;
}

const puckMesh = roundedDisc(.27, 0xc9d9cf, 0x4cae9a, 0xe2efe9, .18);
const playerMesh = roundedDisc(.58, 0x872c32, 0x8e1e2f, 0xe0c5aa, .3);
const enemyMesh = roundedDisc(.58, 0x25433b, 0x216c5b, 0xb2d4c8, .3);

const playerAura = new THREE.Mesh(
  new THREE.RingGeometry(.67, .73, 44),
  new THREE.MeshBasicMaterial({ color: 0xd8a063, transparent: true, opacity: 0, side: THREE.DoubleSide }),
);
playerAura.rotation.x = -Math.PI / 2;
playerAura.position.y = .02;
scene.add(playerAura);

const reticle = new THREE.Mesh(
  new THREE.RingGeometry(.13, .17, 24),
  new THREE.MeshBasicMaterial({ color: 0xc26b5d, transparent: true, opacity: .28, side: THREE.DoubleSide }),
);
reticle.rotation.x = -Math.PI / 2;
reticle.position.set(0, .025, 5.7);
reticle.visible = matchMedia("(pointer:fine)").matches;
scene.add(reticle);

const glassMaterial = color => new THREE.MeshPhysicalMaterial({
  color,
  transparent: true,
  opacity: .28,
  roughness: .14,
  metalness: .08,
  transmission: .38,
  emissive: color,
  emissiveIntensity: .12,
  side: THREE.DoubleSide,
});

const barrierFrameMat = new THREE.MeshStandardMaterial({ color: 0x6e4a30, metalness: .72, roughness: .45 });

function createBarrier(z, color) {
  const group = new THREE.Group();
  const width = TABLE.halfWidth * 2;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(width, 1.35, .07), glassMaterial(color));
  group.add(panel);

  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(width + .16, .09, .14), barrierFrameMat);
  topFrame.position.y = .72;
  group.add(topFrame);
  const bottomFrame = topFrame.clone();
  bottomFrame.position.y = -.72;
  group.add(bottomFrame);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(.1, 1.48, .14), barrierFrameMat);
    post.position.x = side * (width / 2 + .03);
    group.add(post);
  }

  const cracks = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([], 3)),
    new THREE.LineBasicMaterial({ color: 0xf4ead7, transparent: true, opacity: 0 }),
  );
  group.add(cracks);

  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(width, 1.45),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
  flash.position.z = .055;
  group.add(flash);

  const shards = [];
  const shardGeometries = [
    new THREE.TetrahedronGeometry(.11),
    new THREE.TetrahedronGeometry(.16),
    new THREE.TetrahedronGeometry(.22),
  ];
  for (let i = 0; i < 42; i++) {
    const shard = new THREE.Mesh(shardGeometries[i % shardGeometries.length], glassMaterial(color));
    shard.position.set(
      THREE.MathUtils.randFloatSpread(width * .94),
      THREE.MathUtils.randFloatSpread(1.08),
      THREE.MathUtils.randFloatSpread(.04),
    );
    shard.scale.set(THREE.MathUtils.randFloat(.55, 1.15), THREE.MathUtils.randFloat(.45, 1.35), THREE.MathUtils.randFloat(.45, 1));
    shard.visible = false;
    shard.userData.home = shard.position.clone();
    shard.userData.velocity = new THREE.Vector3();
    group.add(shard);
    shards.push(shard);
  }

  group.position.set(0, .58, z);
  scene.add(group);
  return {
    group,
    panel,
    cracks,
    flash,
    shards,
    crackPoints: [],
    shattered: false,
    lastImpactX: 0,
    impact: 0,
    scatterZ: z < 0 ? 1 : -1,
  };
}

const playerBarrier = createBarrier(TABLE.halfLength + .4, 0xc9594e);
const enemyBarrier = createBarrier(-TABLE.halfLength - .4, 0xd29b58);

function addBarrierCrack(barrier, worldX, damage) {
  const x = THREE.MathUtils.clamp(worldX, -TABLE.halfWidth + .2, TABLE.halfWidth - .2);
  const y = THREE.MathUtils.randFloat(-.28, .28);
  const branchCount = 7 + Math.round(damage / 8);
  const lengthBase = .16 + damage * .008;

  for (let branch = 0; branch < branchCount; branch++) {
    let sx = x;
    let sy = y;
    let angle = (branch / branchCount) * Math.PI * 2 + THREE.MathUtils.randFloatSpread(.34);
    const segments = branch % 3 === 0 ? 4 : 3;
    for (let segment = 0; segment < segments; segment++) {
      const length = lengthBase * THREE.MathUtils.randFloat(.55, 1.05) * (1 - segment * .12);
      angle += THREE.MathUtils.randFloatSpread(.25);
      const ex = THREE.MathUtils.clamp(sx + Math.cos(angle) * length, -TABLE.halfWidth + .08, TABLE.halfWidth - .08);
      const ey = THREE.MathUtils.clamp(sy + Math.sin(angle) * length, -.61, .61);
      barrier.crackPoints.push(sx, sy, .052, ex, ey, .052);
      sx = ex;
      sy = ey;
    }
  }

  barrier.cracks.geometry.dispose();
  barrier.cracks.geometry = new THREE.BufferGeometry().setAttribute(
    "position",
    new THREE.Float32BufferAttribute(barrier.crackPoints, 3),
  );
}

function impactBarrier(barrier, x, damage) {
  barrier.lastImpactX = x;
  barrier.impact = 1;
  addBarrierCrack(barrier, x, damage);
  barrier.flash.material.opacity = .55;
  barrier.panel.material.emissiveIntensity = .42;
}

function shatter(barrier) {
  if (barrier.shattered) return;
  barrier.shattered = true;
  barrier.panel.visible = false;
  barrier.cracks.visible = false;
  barrier.flash.material.opacity = .78;

  barrier.shards.forEach(shard => {
    shard.visible = true;
    const dx = shard.position.x - barrier.lastImpactX;
    const outward = Math.sign(dx || THREE.MathUtils.randFloatSpread(1));
    shard.userData.velocity.set(
      outward * THREE.MathUtils.randFloat(.6, 2.8) + THREE.MathUtils.randFloatSpread(.8),
      THREE.MathUtils.randFloat(1.1, 4.2),
      barrier.scatterZ * THREE.MathUtils.randFloat(1.4, 4.8),
    );
  });
}

function resetBarrier(barrier) {
  barrier.shattered = false;
  barrier.lastImpactX = 0;
  barrier.impact = 0;
  barrier.panel.visible = true;
  barrier.cracks.visible = true;
  barrier.flash.material.opacity = 0;
  barrier.panel.material.emissiveIntensity = .12;
  barrier.crackPoints = [];
  barrier.cracks.geometry.dispose();
  barrier.cracks.geometry = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([], 3));
  barrier.cracks.material.opacity = 0;
  barrier.group.position.x = 0;
  barrier.shards.forEach(shard => {
    shard.visible = false;
    shard.position.copy(shard.userData.home);
    shard.rotation.set(0, 0, 0);
    shard.userData.velocity.set(0, 0, 0);
  });
}

function updateBarrier(barrier, hp, frame) {
  barrier.cracks.material.opacity = Math.min(.98, .18 + (100 - hp) / 72);
  barrier.panel.material.opacity = .28;
  barrier.panel.material.emissiveIntensity += (.12 - barrier.panel.material.emissiveIntensity) * Math.min(1, frame * 8);
  barrier.flash.material.opacity = Math.max(0, barrier.flash.material.opacity - frame * 2.6);

  if (barrier.impact > 0) {
    barrier.impact = Math.max(0, barrier.impact - frame * 7.5);
    barrier.group.position.x = Math.sin(barrier.impact * 32) * barrier.impact * .035;
  } else {
    barrier.group.position.x *= Math.max(0, 1 - frame * 18);
  }

  if (hp <= 0) shatter(barrier);
  if (!barrier.shattered) return;

  barrier.shards.forEach(shard => {
    shard.userData.velocity.y -= 4.5 * frame;
    shard.position.addScaledVector(shard.userData.velocity, frame);
    shard.rotation.x += frame * (3.2 + Math.abs(shard.userData.velocity.z));
    shard.rotation.y += frame * 2.4;
    shard.rotation.z += frame * (2 + Math.abs(shard.userData.velocity.x));
  });
}

const backPlate = new THREE.Mesh(
  new THREE.PlaneGeometry(8.5, 5.6),
  new THREE.MeshStandardMaterial({ color: 0x1d140f, roughness: .94, metalness: .05 }),
);
backPlate.position.set(0, 2.1, -11.5);
scene.add(backPlate);

const silhouette = new THREE.Group();
const saintMat = new THREE.MeshStandardMaterial({ color: 0x36261b, emissive: 0x27160d, roughness: .92 });
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(1.2, 1.75, 5, 18), saintMat);
torso.position.y = .72;
silhouette.add(torso);
const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(.48, 2.15, 4, 16), saintMat);
shoulders.rotation.z = Math.PI / 2;
shoulders.position.y = 1.3;
silhouette.add(shoulders);
const head = new THREE.Mesh(
  new THREE.SphereGeometry(.69, 24, 18),
  new THREE.MeshStandardMaterial({ color: 0x815a3d, emissive: 0x3a2113, emissiveIntensity: .45, roughness: .94 }),
);
head.position.y = 2.47;
silhouette.add(head);
for (const side of [-1, 1]) {
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.23, 1.5, 4, 12), saintMat);
  arm.position.set(side * 1.05, .55, .12);
  arm.rotation.z = side * .66;
  silhouette.add(arm);
}
silhouette.position.set(0, .12, -10.15);
silhouette.scale.setScalar(1.1);
scene.add(silhouette);

for (let i = 0; i < 14; i++) {
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(.07, THREE.MathUtils.randFloat(.55, 2), .07),
    new THREE.MeshBasicMaterial({ color: i % 4 ? 0x31554b : 0x7d2a38, transparent: true, opacity: .6 }),
  );
  bar.position.set(THREE.MathUtils.randFloatSpread(17), THREE.MathUtils.randFloat(.1, 2), -12 - THREE.MathUtils.randFloat(0, 4));
  scene.add(bar);
}

const state = createGame();
const audio = new GameAudio();
let accumulator = 0;
let last = performance.now();
const DEBUG = new URLSearchParams(location.search).has("debug");
document.documentElement.classList.toggle("debug", DEBUG);
const keys = new Set();

const ui = {
  message: document.querySelector("#message"),
  pause: document.querySelector("#pause-message"),
  start: document.querySelector("#start"),
  audio: document.querySelector("#audio-toggle"),
  enemyHp: document.querySelector("#enemy-hp"),
  playerHp: document.querySelector("#player-hp"),
  enemyBar: document.querySelector("#enemy-bar"),
  playerBar: document.querySelector("#player-bar"),
  speed: document.querySelector("#speed"),
  rally: document.querySelector("#rally"),
  surge: document.querySelector("#surge-meter"),
  surgeFill: document.querySelector("#surge-fill"),
  surgeValue: document.querySelector("#surge-value"),
  surgeState: document.querySelector("#surge-state"),
};

function begin() {
  if (state.phase === "ended") {
    Object.assign(state, createGame());
    resetBarrier(playerBarrier);
    resetBarrier(enemyBarrier);
  }
  startGame(state);
  ui.message.classList.remove("visible", "final");
  audio.startMusic();
  audio.hit("striker", .2);
}

function togglePause() {
  if (state.phase === "playing" || state.phase === "serve") {
    state.pausedFrom = state.phase;
    state.phase = "paused";
    ui.pause.classList.add("visible");
  } else if (state.phase === "paused") {
    state.phase = state.pausedFrom || "playing";
    ui.pause.classList.remove("visible");
  }
}

ui.start.addEventListener("click", begin);
ui.surge.addEventListener("click", event => {
  event.preventDefault();
  if (activateSurge(state)) audio.hit("surge", 1);
});

addEventListener("keydown", event => {
  keys.add(event.code);
  if (event.code === "Enter" && (state.phase === "ready" || state.phase === "ended")) begin();
  if (event.code === "KeyR") {
    Object.assign(state, createGame());
    resetBarrier(playerBarrier);
    resetBarrier(enemyBarrier);
    begin();
  }
  if (event.code === "KeyP" || event.code === "Escape") togglePause();
});
addEventListener("keyup", event => keys.delete(event.code));

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();

function pointPaddle(event) {
  const box = canvas.getBoundingClientRect();
  pointer.x = (event.clientX - box.left) / box.width * 2 - 1;
  pointer.y = -((event.clientY - box.top) / box.height * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(tablePlane, hitPoint)) {
    setTarget(state, { x: hitPoint.x, y: hitPoint.z });
    reticle.position.set(state.playerTarget.x, .025, state.playerTarget.y);
  }
}

canvas.addEventListener("pointermove", pointPaddle);
canvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  pointPaddle(event);
});

ui.audio.addEventListener("click", () => {
  const enabled = audio.toggle();
  ui.audio.textContent = enabled ? "AUDIO AN" : "AUDIO AUS";
  ui.audio.setAttribute("aria-pressed", String(!enabled));
});

function processEvent(event) {
  if (event.type === "rail" || event.type === "striker") {
    audio.hit(event.type, event.intensity, event.x / TABLE.halfWidth);
  }

  if (event.type === "goal") {
    audio.hit("goal", event.intensity, event.x / TABLE.halfWidth);
    impactBarrier(event.side === "player" ? enemyBarrier : playerBarrier, event.x, event.damage);
  }

  if (event.type === "surge-ready") audio.hit("ready", .55);

  if (event.type === "win") {
    audio.hit("shatter", 1);
    const broken = event.side === "player" ? enemyBarrier : playerBarrier;
    shatter(broken);
    ui.message.innerHTML = `
      <span class="eyebrow">VERTRAG BEENDET</span>
      <h1>${event.side === "player" ? "BARRIERE GEBROCHEN" : "NACHT VORBEI"}</h1>
      <p>${event.side === "player" ? "OLD SAINT // BESIEGT" : "DIE STADT VERGISST NICHTS"}</p>
      <button id="restart">NOCH EIN DUELL <kbd>R</kbd></button>
    `;
    ui.message.classList.add("visible", "final");
    document.querySelector("#restart")?.addEventListener("click", begin);
  }
}

function syncBody(mesh, body) {
  mesh.position.set(body.x, .17, body.y);
}

function updateUi() {
  ui.enemyHp.textContent = String(state.enemyHp);
  ui.playerHp.textContent = String(state.playerHp);
  ui.enemyBar.style.width = `${state.enemyHp}%`;
  ui.playerBar.style.width = `${state.playerHp}%`;
  ui.speed.textContent = String(Math.round(Math.hypot(state.puck.vx, state.puck.vy) * 9)).padStart(3, "0");
  ui.rally.textContent = String(state.rally).padStart(2, "0");

  const charge = Math.round(state.charge);
  const ready = charge >= 100;
  const active = state.surgeTimer > 0;
  ui.surge.disabled = !ready;
  ui.surge.classList.toggle("ready", ready && !active);
  ui.surge.classList.toggle("active", active);
  ui.surgeFill.style.width = `${charge}%`;
  ui.surgeValue.textContent = active ? "LIVE" : ready ? "READY" : String(charge);
  ui.surgeState.textContent = active
    ? `SURGE // ${state.surgeTimer.toFixed(1)}s`
    : ready
      ? "TAP // KINETIC SURGE"
      : "CONTACTS // GOALS";

  playerAura.position.x = state.player.x;
  playerAura.position.z = state.player.y;
  playerAura.material.opacity = active ? .32 + Math.sin(state.time * 22) * .12 : 0;
  playerAura.scale.setScalar(active ? 1 + Math.sin(state.time * 15) * .04 : 1);
}

function resize() {
  const box = canvas.getBoundingClientRect();
  const width = Math.max(1, box.width || innerWidth);
  const height = Math.max(1, box.height || innerHeight);
  const aspect = width / height;
  renderer.setSize(width, height, false);
  camera.aspect = aspect;

  if (aspect < .62) {
    camera.fov = 60;
    camera.position.set(0, 13, 22);
    camera.lookAt(0, .05, -4);
  } else if (aspect < 1) {
    camera.fov = 56;
    camera.position.set(0, 7.6, 19.2);
    camera.lookAt(0, .12, -3.2);
  } else {
    camera.fov = 48;
    camera.position.set(0, 6, 16);
    camera.lookAt(0, .3, -2);
  }

  camera.updateProjectionMatrix();
}

addEventListener("resize", resize);
window.visualViewport?.addEventListener("resize", resize);
window.visualViewport?.addEventListener("scroll", resize);
resize();

function animate(now) {
  requestAnimationFrame(animate);
  const frame = Math.min(.05, (now - last) / 1000);
  last = now;

  if (state.phase === "playing" || state.phase === "serve") {
    accumulator += frame;
    const keyboard = {
      x: (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0),
      y: (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0),
    };
    if (keyboard.x || keyboard.y) {
      setTarget(state, {
        x: state.playerTarget.x + keyboard.x * frame * 8,
        y: state.playerTarget.y + keyboard.y * frame * 8,
      });
      reticle.position.set(state.playerTarget.x, .025, state.playerTarget.y);
    }

    while (accumulator >= FIXED_STEP) {
      stepGame(state).forEach(processEvent);
      accumulator -= FIXED_STEP;
    }
  } else {
    accumulator = 0;
  }

  syncBody(puckMesh, state.puck);
  syncBody(playerMesh, state.player);
  syncBody(enemyMesh, state.enemy);
  updateBarrier(playerBarrier, state.playerHp, frame);
  updateBarrier(enemyBarrier, state.enemyHp, frame);

  puckMesh.rotation.y += frame * Math.hypot(state.puck.vx, state.puck.vy) * .8;
  silhouette.rotation.z = Math.sin(state.time * 1.25) * .02;
  silhouette.position.y = .12 + Math.sin(state.time * .75) * .018;
  updateUi();
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
