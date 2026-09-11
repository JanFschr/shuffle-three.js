import { GAMEPLAY, TABLE } from "./config.js";

export { TABLE } from "./config.js";
export const FIXED_STEP = 1 / 120;

export function createGame() {
  return {
    puck: { x: 0, y: 0, vx: 0, vy: 0, radius: GAMEPLAY.puck.radius },
    player: { x: 0, y: 6.15, vx: 0, vy: 0, radius: GAMEPLAY.player.radius },
    enemy: { x: 0, y: -6.15, vx: 0, vy: 0, radius: GAMEPLAY.enemy.radius },
    playerTarget: { x: 0, y: 6.15 }, playerHp: 100, enemyHp: 100,
    power: false, rally: 0, phase: "ready", serveTimer: 0, inactiveTimer: 0, time: 0,
    enemyBrain: { phase: "idle", timer: 0, shot: 0, targetX: 0 },
  };
}

export function startGame(state) {
  if (state.phase === "ready" || state.phase === "ended") resetRound(state, "player");
}

export function setTarget(state, target) {
  state.playerTarget.x = clamp(target.x, -TABLE.halfWidth + GAMEPLAY.player.radius, TABLE.halfWidth - GAMEPLAY.player.radius);
  state.playerTarget.y = clamp(target.y, TABLE.playerMinY, TABLE.playerMaxY);
}

export function setPower(state, active) { state.power = Boolean(active); }

function resetRound(state, serving) {
  Object.assign(state.puck, { x: 0, y: serving === "player" ? 1.3 : -1.3, vx: 0, vy: 0 });
  Object.assign(state.player, { x: 0, y: 6.15, vx: 0, vy: 0 });
  Object.assign(state.enemy, { x: 0, y: -6.15, vx: 0, vy: 0 });
  state.playerTarget = { x: 0, y: 6.15 }; state.power = false;
  state.enemyBrain = { phase: "idle", timer: 0, shot: state.enemyBrain?.shot ?? 0, targetX: 0 };
  state.rally = 0; state.inactiveTimer = 0;
  state.serveTimer = serving === "player" ? .9 : -.9; state.phase = "serve";
}

export function stepGame(state, dt = FIXED_STEP) {
  const events = [];
  if (["paused", "ready", "ended"].includes(state.phase)) return events;
  state.time += dt;
  const profile = state.power ? GAMEPLAY.player.power : GAMEPLAY.player.normal;
  moveStriker(state.player, state.playerTarget, dt, profile.maxSpeed, profile.acceleration, TABLE.playerMinY, TABLE.playerMaxY);
  updateEnemy(state, dt);
  if (state.phase === "serve") {
    const servingPlayer = state.serveTimer > 0;
    state.serveTimer += servingPlayer ? -dt : dt;
    if ((servingPlayer && state.serveTimer <= 0) || (!servingPlayer && state.serveTimer >= 0)) {
      state.puck.vx = Math.sin(state.time * 13.7) * 1.5; state.puck.vy = servingPlayer ? -6.8 : 6.8;
      state.phase = "playing"; events.push({ type: "serve" });
    }
    return events;
  }
  state.puck.x += state.puck.vx * dt; state.puck.y += state.puck.vy * dt;
  const damping = Math.exp(-GAMEPLAY.puck.damping * dt); state.puck.vx *= damping; state.puck.vy *= damping;
  state.inactiveTimer += dt;
  if (state.inactiveTimer > 12) { const boost = Math.exp(.28 * dt); state.puck.vx *= boost; state.puck.vy *= boost; }
  const wall = TABLE.halfWidth - state.puck.radius;
  if (Math.abs(state.puck.x) > wall) {
    state.puck.x = Math.sign(state.puck.x) * wall; state.puck.vx = -state.puck.vx * .96;
    events.push({ type: "rail", x: state.puck.x, intensity: Math.abs(state.puck.vx) / GAMEPLAY.puck.maxSpeed });
  }
  const contacts = events.length;
  collideStriker(state.puck, state.player, events, profile.contactMultiplier);
  collideStriker(state.puck, state.enemy, events, 1);
  if (events.length > contacts) state.inactiveTimer = 0;
  capVelocity(state.puck);
  const line = TABLE.halfLength + state.puck.radius;
  if (state.puck.y < -line) scoreGoal(state, "player", events);
  else if (state.puck.y > line) scoreGoal(state, "enemy", events);
  return events;
}

function scoreGoal(state, scorer, events) {
  const speed = Math.hypot(state.puck.vx, state.puck.vy);
  const damage = Math.round(20 * clamp(speed / 8, .75, 1.5));
  if (scorer === "player") state.enemyHp = Math.max(0, state.enemyHp - damage); else state.playerHp = Math.max(0, state.playerHp - damage);
  events.push({ type: "goal", side: scorer, x: state.puck.x, damage, intensity: speed / GAMEPLAY.puck.maxSpeed });
  if (!state.playerHp || !state.enemyHp) {
    state.phase = "ended"; state.winner = !state.enemyHp ? "player" : "enemy"; state.puck.vx = state.puck.vy = 0;
    events.push({ type: "win", side: state.winner });
  } else resetRound(state, scorer === "player" ? "enemy" : "player");
}

function moveStriker(body, target, dt, maxSpeed, acceleration, minY, maxY) {
  const dx = target.x - body.x, dy = target.y - body.y, distance = Math.hypot(dx, dy);
  const desiredX = distance ? dx / distance * Math.min(maxSpeed, distance * 12) : 0;
  const desiredY = distance ? dy / distance * Math.min(maxSpeed, distance * 12) : 0;
  const maxChange = acceleration * dt;
  body.vx += clamp(desiredX - body.vx, -maxChange, maxChange); body.vy += clamp(desiredY - body.vy, -maxChange, maxChange);
  body.x = clamp(body.x + body.vx * dt, -TABLE.halfWidth + body.radius, TABLE.halfWidth - body.radius);
  body.y = clamp(body.y + body.vy * dt, minY, maxY);
}

function updateEnemy(state, dt) {
  const brain = state.enemyBrain; brain.timer += dt;
  if (brain.phase === "idle" && state.puck.vy < 0 && state.puck.y < 0) { brain.phase = "read"; brain.timer = 0; }
  if (brain.phase === "read" && brain.timer >= .11) {
    const travel = Math.max(0, (-6 - state.puck.y) / Math.min(-.1, state.puck.vy));
    brain.targetX = clamp(state.puck.x + state.puck.vx * travel, -3.75, 3.75); brain.phase = "intercept"; brain.timer = 0;
  }
  if (brain.phase === "intercept" && (state.puck.y < -4.9 || brain.timer > .55)) { brain.phase = "backswing"; brain.timer = 0; }
  if (brain.phase === "backswing" && brain.timer >= .09) { brain.phase = "return"; brain.timer = 0; brain.shot = (brain.shot + 1) % 20; }
  if (brain.phase === "return" && (state.puck.vy > 0 || brain.timer > .35)) { brain.phase = "recover"; brain.timer = 0; }
  if (brain.phase === "recover" && brain.timer >= .24 + (brain.shot % 3) * .04) { brain.phase = "idle"; brain.timer = 0; }
  const idleX = Math.sin(state.time * .8) * .55;
  const shotOffset = brain.shot < 9 ? 0 : brain.shot < 15 ? (brain.shot % 2 ? 1.25 : -1.25) : brain.shot < 18 ? (brain.shot % 2 ? 2 : -2) : .45;
  let target = { x: idleX, y: -6.15 };
  if (brain.phase === "intercept") target = { x: brain.targetX, y: -6.1 };
  if (brain.phase === "backswing") target = { x: brain.targetX, y: -6.75 };
  if (brain.phase === "return") target = { x: brain.targetX + shotOffset, y: -5.05 };
  if (brain.phase === "recover") target = { x: brain.targetX * .5, y: -6.65 };
  moveStriker(state.enemy, target, dt, GAMEPLAY.enemy.maxSpeed, GAMEPLAY.enemy.acceleration, TABLE.enemyMinY, TABLE.enemyMaxY);
}

function collideStriker(puck, striker, events, contactMultiplier) {
  const dx = puck.x - striker.x, dy = puck.y - striker.y, minDistance = puck.radius + striker.radius;
  const distanceSq = dx * dx + dy * dy; if (distanceSq >= minDistance * minDistance) return;
  const distance = Math.sqrt(distanceSq) || .0001, nx = dx / distance, ny = dy / distance;
  puck.x = striker.x + nx * minDistance; puck.y = striker.y + ny * minDistance;
  const relative = (puck.vx - striker.vx) * nx + (puck.vy - striker.vy) * ny;
  if (relative < 0) {
    const impulse = -(1 + .9) * relative * contactMultiplier;
    puck.vx += impulse * nx + striker.vx * .16 * contactMultiplier; puck.vy += impulse * ny + striker.vy * .16 * contactMultiplier;
    events.push({ type: "striker", x: puck.x, intensity: clamp(Math.abs(relative) / 14, .15, 1) });
  }
}

function capVelocity(body) { const speed = Math.hypot(body.vx, body.vy); if (speed > GAMEPLAY.puck.maxSpeed) { body.vx *= GAMEPLAY.puck.maxSpeed / speed; body.vy *= GAMEPLAY.puck.maxSpeed / speed; } }
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
