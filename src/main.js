import * as THREE from "three";
import { GameAudio } from "./audio.js";
import { GAMEPLAY } from "./game/config.js";
import { FIXED_STEP, TABLE, activateSurge, createGame, setTarget, startGame, stepGame } from "./game/simulation.js";
import { attachPointerControl } from "./input/pointer.js";
import { createBarrier, impactBarrier, resetBarrier, shatterBarrier, updateBarrier } from "./render/barrier.js";
import { createOldSaintBillboard } from "./render/opponent.js";
import { createRetroStage } from "./render/stage.js";
import { createRectangularAura, createRectangularStriker, createRetroPuck, createRetroTable } from "./render/table.js";

const canvas = document.querySelector("#game");
const stage = createRetroStage(canvas);
const { renderer, scene, camera } = stage;

createRetroTable(scene, TABLE);

const puckMesh = createRetroPuck(scene, GAMEPLAY.puck.radius);
const playerMesh = createRectangularStriker(scene, GAMEPLAY.player, {
  body: 0x8b3033,
  top: 0xd4b58d,
  face: 0xe2c89f,
  edge: 0xf0d9b7,
  grip: 0x6e242b,
}, -1);
const enemyMesh = createRectangularStriker(scene, GAMEPLAY.enemy, {
  body: 0x294a48,
  top: 0x91bdb3,
  face: 0xb7d8d0,
  edge: 0xd0e5dc,
  grip: 0x1e3535,
}, 1);
const playerAura = createRectangularAura(scene, GAMEPLAY.player);

const playerBarrier = createBarrier(scene, TABLE, TABLE.halfLength + .42, 0xc85e4d);
const enemyBarrier = createBarrier(scene, TABLE, -TABLE.halfLength - .42, 0xd19852);
const oldSaint = createOldSaintBillboard(scene);

const reticleGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-.18, 0, 0),
  new THREE.Vector3(.18, 0, 0),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -.18),
  new THREE.Vector3(0, 0, .18),
]);
const reticle = new THREE.LineSegments(
  reticleGeometry,
  new THREE.LineBasicMaterial({ color: 0xc56d55, transparent: true, opacity: .42 }),
);
reticle.position.set(0, .026, GAMEPLAY.player.startY);
reticle.visible = matchMedia("(pointer:fine)").matches;
scene.add(reticle);

const state = createGame();
const audio = new GameAudio();
let accumulator = 0;
let last = performance.now();
const keys = new Set();
const DEBUG = new URLSearchParams(location.search).has("debug");
document.documentElement.classList.toggle("debug", DEBUG);

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
  impactFlash: document.querySelector("#impact-flash"),
};

function resetPresentation() {
  resetBarrier(playerBarrier);
  resetBarrier(enemyBarrier);
  oldSaint.reset();
  ui.impactFlash?.classList.remove("burst", "player", "enemy");
}

function begin() {
  if (state.phase === "ended") {
    Object.assign(state, createGame());
    resetPresentation();
  }
  startGame(state);
  ui.message.classList.remove("visible", "final");
  ui.pause.classList.remove("visible");
  audio.startMusic();
  audio.hit("striker", .18);
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

function triggerImpactFlash(side, strong = false) {
  if (!ui.impactFlash) return;
  ui.impactFlash.classList.remove("burst", "player", "enemy", "strong");
  void ui.impactFlash.offsetWidth;
  ui.impactFlash.classList.add("burst", side);
  if (strong) ui.impactFlash.classList.add("strong");
}

ui.start.addEventListener("click", begin);
ui.surge.addEventListener("click", event => {
  event.preventDefault();
  if (activateSurge(state)) {
    audio.hit("surge", 1);
    stage.kick(.28);
  }
});

ui.audio.addEventListener("click", () => {
  const enabled = audio.toggle();
  ui.audio.textContent = enabled ? "AUDIO" : "MUTE";
  ui.audio.setAttribute("aria-pressed", String(!enabled));
});

addEventListener("keydown", event => {
  keys.add(event.code);
  if (event.code === "Enter" && (state.phase === "ready" || state.phase === "ended")) begin();
  if (event.code === "KeyR") {
    Object.assign(state, createGame());
    resetPresentation();
    begin();
  }
  if (event.code === "KeyP" || event.code === "Escape") togglePause();
});
addEventListener("keyup", event => keys.delete(event.code));

attachPointerControl({
  canvas,
  camera,
  state,
  setTarget,
  onTarget(target) {
    reticle.position.set(target.x, .026, target.y);
  },
});

function processEvent(event) {
  if (event.type === "rail" || event.type === "striker") {
    audio.hit(event.type, event.intensity, event.x / TABLE.halfWidth);
    if (event.type === "striker" && event.intensity > .72) stage.kick(.12);
  }

  if (event.type === "goal") {
    audio.hit("goal", event.intensity, event.x / TABLE.halfWidth);
    const barrier = event.side === "player" ? enemyBarrier : playerBarrier;
    impactBarrier(barrier, TABLE, event.x, event.damage);
    triggerImpactFlash(event.side, false);
    stage.kick(.32);
    if (event.side === "player") oldSaint.react("hit", .5);
    else oldSaint.react("taunt", .46);
  }

  if (event.type === "surge-ready") audio.hit("ready", .55);

  if (event.type === "win") {
    audio.hit("shatter", 1);
    const broken = event.side === "player" ? enemyBarrier : playerBarrier;
    shatterBarrier(broken);
    triggerImpactFlash(event.side, true);
    stage.kick(1);
    oldSaint.react(event.side === "player" ? "lose" : "taunt", Infinity);

    ui.message.innerHTML = `
      <span class="eyebrow">VERTRAG BEENDET</span>
      <h1>${event.side === "player" ? "BARRIERE GEBROCHEN" : "NACHT VORBEI"}</h1>
      <p>${event.side === "player" ? "OLD SAINT // BESIEGT" : "CINDER ROW // VERLOREN"}</p>
      <button id="restart">NOCH EIN DUELL <kbd>R</kbd></button>
    `;
    ui.message.classList.add("visible", "final");
    document.querySelector("#restart")?.addEventListener("click", begin);
  }
}

function syncBody(mesh, body, height = .17) {
  mesh.position.set(body.x, height, body.y);
}

function updateUi() {
  ui.enemyHp.textContent = String(state.enemyHp);
  ui.playerHp.textContent = String(state.playerHp);
  ui.enemyBar.style.width = `${state.enemyHp}%`;
  ui.playerBar.style.width = `${state.playerHp}%`;
  ui.speed.textContent = String(Math.round(Math.hypot(state.puck.vx, state.puck.vy) * 9)).padStart(3, "0");
  ui.rally.textContent = String(state.rally).padStart(2, "0");

  const charge = Math.round(state.charge);
  const ready = charge >= GAMEPLAY.charge.max;
  const active = state.surgeTimer > 0;
  ui.surge.disabled = !ready;
  ui.surge.classList.toggle("ready", ready && !active);
  ui.surge.classList.toggle("active", active);
  ui.surgeFill.style.width = `${charge}%`;
  ui.surgeValue.textContent = active ? "LIVE" : ready ? "READY" : String(charge);
  ui.surgeState.textContent = active
    ? `SURGE ${state.surgeTimer.toFixed(1)}s`
    : ready
      ? "TAP TO FIRE"
      : "KINETIC CELLS";

  playerAura.position.x = state.player.x;
  playerAura.position.z = state.player.y;
  playerAura.material.opacity = active ? .52 + Math.sin(state.time * 22) * .18 : 0;
  playerAura.scale.setScalar(active ? 1 + Math.sin(state.time * 15) * .055 : 1);
}

function resize() {
  stage.resize();
}

addEventListener("resize", resize);
window.visualViewport?.addEventListener("resize", resize);
window.visualViewport?.addEventListener("scroll", resize);
resize();

function keyboardInput(frame) {
  const x = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0)
    - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  const y = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0)
    - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
  if (!x && !y) return;

  setTarget(state, {
    x: state.playerTarget.x + x * frame * 8,
    y: state.playerTarget.y + y * frame * 8,
  });
  reticle.position.set(state.playerTarget.x, .026, state.playerTarget.y);
}

function animate(now) {
  requestAnimationFrame(animate);
  const frame = Math.min(.05, (now - last) / 1000);
  last = now;

  if (state.phase === "playing" || state.phase === "serve") {
    accumulator += frame;
    keyboardInput(frame);
    while (accumulator >= FIXED_STEP) {
      stepGame(state).forEach(processEvent);
      accumulator -= FIXED_STEP;
    }
  } else {
    accumulator = 0;
  }

  syncBody(puckMesh, state.puck, .1);
  syncBody(playerMesh, state.player);
  syncBody(enemyMesh, state.enemy);
  updateBarrier(playerBarrier, state.playerHp, frame);
  updateBarrier(enemyBarrier, state.enemyHp, frame);
  oldSaint.update(state.time, frame, state.enemy.x);
  stage.update(frame);

  puckMesh.rotation.y += frame * Math.hypot(state.puck.vx, state.puck.vy) * .7;
  updateUi();
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
