import { GAMEPLAY, SERVE, TABLE } from "./config.js";

export { TABLE } from "./config.js";
export const FIXED_STEP = 1 / 120;

export function createGame() {
  return {
    puck: { x: 0, y: SERVE.playerPuckY, vx: 0, vy: 0, radius: GAMEPLAY.puck.radius },
    player: {
      x: 0,
      y: GAMEPLAY.player.startY,
      vx: 0,
      vy: 0,
      halfWidth: GAMEPLAY.player.halfWidth,
      halfDepth: GAMEPLAY.player.halfDepth,
    },
    enemy: {
      x: 0,
      y: GAMEPLAY.enemy.startY,
      vx: 0,
      vy: 0,
      halfWidth: GAMEPLAY.enemy.halfWidth,
      halfDepth: GAMEPLAY.enemy.halfDepth,
    },
    playerTarget: { x: 0, y: GAMEPLAY.player.startY },
    playerHp: 100,
    enemyHp: 100,
    charge: 0,
    surgeTimer: 0,
    rally: 0,
    phase: "ready",
    serveSide: "player",
    inactiveTimer: 0,
    time: 0,
    lastTouch: null,
    bankAvailable: false,
    winner: null,
    enemyBrain: { phase: "idle", timer: 0, shot: 0, targetX: 0 },
  };
}

export function startGame(state) {
  if (state.phase === "ready" || state.phase === "ended") resetRound(state, "player");
}

export function setTarget(state, target) {
  state.playerTarget.x = clamp(
    target.x,
    -TABLE.halfWidth + GAMEPLAY.player.halfWidth,
    TABLE.halfWidth - GAMEPLAY.player.halfWidth,
  );
  state.playerTarget.y = clamp(target.y, TABLE.playerMinY, TABLE.playerMaxY);
}

export function activateSurge(state) {
  if (state.charge < GAMEPLAY.charge.max || state.surgeTimer > 0 || state.phase === "ended") return false;
  state.charge = 0;
  state.surgeTimer = GAMEPLAY.player.surge.duration;
  return true;
}

function resetRound(state, serving) {
  Object.assign(state.puck, {
    x: 0,
    y: serving === "player" ? SERVE.playerPuckY : SERVE.enemyPuckY,
    vx: 0,
    vy: 0,
  });
  Object.assign(state.player, { x: 0, y: GAMEPLAY.player.startY, vx: 0, vy: 0 });
  Object.assign(state.enemy, { x: 0, y: GAMEPLAY.enemy.startY, vx: 0, vy: 0 });
  state.playerTarget = { x: 0, y: GAMEPLAY.player.startY };
  state.enemyBrain = { phase: "idle", timer: 0, shot: state.enemyBrain?.shot ?? 0, targetX: 0 };
  state.rally = 0;
  state.inactiveTimer = 0;
  state.lastTouch = null;
  state.bankAvailable = false;
  state.surgeTimer = 0;
  state.serveSide = serving;
  state.phase = "serve";
}

export function stepGame(state, dt = FIXED_STEP) {
  const events = [];
  if (["paused", "ready", "ended"].includes(state.phase)) return events;

  state.time += dt;
  state.surgeTimer = Math.max(0, state.surgeTimer - dt);
  const profile = state.surgeTimer > 0 ? GAMEPLAY.player.surge : GAMEPLAY.player.normal;

  moveStriker(
    state.player,
    state.playerTarget,
    dt,
    profile.maxSpeed,
    profile.acceleration,
    TABLE.playerMinY,
    TABLE.playerMaxY,
  );
  updateEnemy(state, dt);

  state.puck.x += state.puck.vx * dt;
  state.puck.y += state.puck.vy * dt;
  const damping = Math.exp(-GAMEPLAY.puck.damping * dt);
  state.puck.vx *= damping;
  state.puck.vy *= damping;

  if (state.phase === "playing") {
    state.inactiveTimer += dt;
    if (state.inactiveTimer > 12) {
      const boost = Math.exp(.28 * dt);
      state.puck.vx *= boost;
      state.puck.vy *= boost;
    }
  }

  const wall = TABLE.halfWidth - state.puck.radius;
  if (Math.abs(state.puck.x) > wall) {
    state.puck.x = Math.sign(state.puck.x) * wall;
    state.puck.vx = -state.puck.vx * .96;
    const intensity = Math.abs(state.puck.vx) / GAMEPLAY.puck.maxSpeed;
    events.push({ type: "rail", x: state.puck.x, intensity });
    if (state.lastTouch === "player" && state.bankAvailable) {
      grantCharge(state, GAMEPLAY.charge.bankShot, events, "bank");
      state.bankAvailable = false;
    }
  }

  const playerHit = collideStriker(state.puck, state.player, events, profile.contactMultiplier, "player");
  if (playerHit) {
    state.lastTouch = "player";
    state.bankAvailable = true;
    state.rally += 1;
    const charge = GAMEPLAY.charge.strikerBase + Math.round(playerHit.intensity * GAMEPLAY.charge.strikerIntensity);
    grantCharge(state, charge, events, "contact");
  }

  const enemyHit = collideStriker(state.puck, state.enemy, events, 1, "enemy");
  if (enemyHit) {
    state.lastTouch = "enemy";
    state.bankAvailable = false;
    state.rally += 1;
  }

  if (playerHit || enemyHit) state.inactiveTimer = 0;

  if (state.phase === "serve") {
    const served = (state.serveSide === "player" && playerHit) || (state.serveSide === "enemy" && enemyHit);
    if (served) {
      events.push({ type: "serve", side: state.serveSide });
      state.phase = "playing";
      state.serveSide = null;
    }
  }

  capVelocity(state.puck);
  const line = TABLE.halfLength + state.puck.radius;
  if (state.puck.y < -line) scoreGoal(state, "player", events);
  else if (state.puck.y > line) scoreGoal(state, "enemy", events);

  return events;
}

function scoreGoal(state, scorer, events) {
  const speed = Math.hypot(state.puck.vx, state.puck.vy);
  const damage = Math.round(20 * clamp(speed / 8, .75, 1.5));

  if (scorer === "player") {
    state.enemyHp = Math.max(0, state.enemyHp - damage);
    grantCharge(state, GAMEPLAY.charge.goalFor, events, "goal-for");
  } else {
    state.playerHp = Math.max(0, state.playerHp - damage);
    grantCharge(state, GAMEPLAY.charge.goalAgainst, events, "goal-against");
  }

  events.push({
    type: "goal",
    side: scorer,
    x: state.puck.x,
    damage,
    intensity: speed / GAMEPLAY.puck.maxSpeed,
  });

  if (!state.playerHp || !state.enemyHp) {
    state.phase = "ended";
    state.winner = !state.enemyHp ? "player" : "enemy";
    state.puck.vx = 0;
    state.puck.vy = 0;
    state.surgeTimer = 0;
    events.push({ type: "win", side: state.winner });
  } else {
    resetRound(state, scorer === "player" ? "enemy" : "player");
  }
}

function grantCharge(state, amount, events, reason) {
  if (amount <= 0 || state.charge >= GAMEPLAY.charge.max) return;
  const previous = state.charge;
  state.charge = Math.min(GAMEPLAY.charge.max, state.charge + amount);
  events.push({ type: "charge", amount: state.charge - previous, value: state.charge, reason });
  if (previous < GAMEPLAY.charge.max && state.charge === GAMEPLAY.charge.max) {
    events.push({ type: "surge-ready" });
  }
}

function moveStriker(body, target, dt, maxSpeed, acceleration, minY, maxY) {
  const dx = target.x - body.x;
  const dy = target.y - body.y;
  const distance = Math.hypot(dx, dy);
  const desiredX = distance ? dx / distance * Math.min(maxSpeed, distance * 12) : 0;
  const desiredY = distance ? dy / distance * Math.min(maxSpeed, distance * 12) : 0;
  const maxChange = acceleration * dt;

  body.vx += clamp(desiredX - body.vx, -maxChange, maxChange);
  body.vy += clamp(desiredY - body.vy, -maxChange, maxChange);
  body.x = clamp(body.x + body.vx * dt, -TABLE.halfWidth + body.halfWidth, TABLE.halfWidth - body.halfWidth);
  body.y = clamp(body.y + body.vy * dt, minY, maxY);
}

function updateEnemy(state, dt) {
  if (state.phase === "serve" && state.serveSide === "enemy") {
    const serveTarget = { x: state.puck.x, y: TABLE.enemyMaxY };
    moveStriker(
      state.enemy,
      serveTarget,
      dt,
      GAMEPLAY.enemy.maxSpeed * .86,
      GAMEPLAY.enemy.acceleration,
      TABLE.enemyMinY,
      TABLE.enemyMaxY,
    );
    return;
  }

  const brain = state.enemyBrain;
  brain.timer += dt;

  if (brain.phase === "idle" && state.puck.vy < 0 && state.puck.y < 0) {
    brain.phase = "read";
    brain.timer = 0;
  }
  if (brain.phase === "read" && brain.timer >= .11) {
    const travel = Math.max(0, (-6 - state.puck.y) / Math.min(-.1, state.puck.vy));
    brain.targetX = clamp(state.puck.x + state.puck.vx * travel, -3.75, 3.75);
    brain.phase = "intercept";
    brain.timer = 0;
  }
  if (brain.phase === "intercept" && (state.puck.y < -4.9 || brain.timer > .55)) {
    brain.phase = "backswing";
    brain.timer = 0;
  }
  if (brain.phase === "backswing" && brain.timer >= .09) {
    brain.phase = "return";
    brain.timer = 0;
    brain.shot = (brain.shot + 1) % 20;
  }
  if (brain.phase === "return" && (state.puck.vy > 0 || brain.timer > .35)) {
    brain.phase = "recover";
    brain.timer = 0;
  }
  if (brain.phase === "recover" && brain.timer >= .24 + (brain.shot % 3) * .04) {
    brain.phase = "idle";
    brain.timer = 0;
  }

  const idleX = Math.sin(state.time * .8) * .55;
  const shotOffset = brain.shot < 9
    ? 0
    : brain.shot < 15
      ? (brain.shot % 2 ? 1.25 : -1.25)
      : brain.shot < 18
        ? (brain.shot % 2 ? 2 : -2)
        : .45;

  let target = { x: idleX, y: GAMEPLAY.enemy.startY };
  if (brain.phase === "intercept") target = { x: brain.targetX, y: -6.1 };
  if (brain.phase === "backswing") target = { x: brain.targetX, y: -6.75 };
  if (brain.phase === "return") target = { x: brain.targetX + shotOffset, y: TABLE.enemyMaxY - .05 };
  if (brain.phase === "recover") target = { x: brain.targetX * .5, y: -6.65 };

  moveStriker(
    state.enemy,
    target,
    dt,
    GAMEPLAY.enemy.maxSpeed,
    GAMEPLAY.enemy.acceleration,
    TABLE.enemyMinY,
    TABLE.enemyMaxY,
  );
}

function collideStriker(puck, striker, events, contactMultiplier, side) {
  const minX = striker.x - striker.halfWidth;
  const maxX = striker.x + striker.halfWidth;
  const minY = striker.y - striker.halfDepth;
  const maxY = striker.y + striker.halfDepth;
  const closestX = clamp(puck.x, minX, maxX);
  const closestY = clamp(puck.y, minY, maxY);
  const dx = puck.x - closestX;
  const dy = puck.y - closestY;
  const distanceSq = dx * dx + dy * dy;
  const radiusSq = puck.radius * puck.radius;
  if (distanceSq > radiusSq) return null;

  let nx = 0;
  let ny = 0;

  if (distanceSq > 1e-10) {
    const distance = Math.sqrt(distanceSq);
    nx = dx / distance;
    ny = dy / distance;
    const penetration = puck.radius - distance;
    puck.x += nx * penetration;
    puck.y += ny * penetration;
  } else {
    const faces = [
      { distance: puck.x - minX, nx: -1, ny: 0, x: minX - puck.radius, y: puck.y },
      { distance: maxX - puck.x, nx: 1, ny: 0, x: maxX + puck.radius, y: puck.y },
      { distance: puck.y - minY, nx: 0, ny: -1, x: puck.x, y: minY - puck.radius },
      { distance: maxY - puck.y, nx: 0, ny: 1, x: puck.x, y: maxY + puck.radius },
    ];
    const face = faces.reduce((best, candidate) => candidate.distance < best.distance ? candidate : best);
    nx = face.nx;
    ny = face.ny;
    puck.x = face.x;
    puck.y = face.y;
  }

  const relative = (puck.vx - striker.vx) * nx + (puck.vy - striker.vy) * ny;
  if (relative >= 0) return null;

  const impulse = -(1 + .9) * relative * contactMultiplier;
  puck.vx += impulse * nx + striker.vx * .16 * contactMultiplier;
  puck.vy += impulse * ny + striker.vy * .16 * contactMultiplier;
  const intensity = clamp(Math.abs(relative) / 14, .15, 1);
  const event = { type: "striker", side, x: puck.x, intensity, normalX: nx, normalY: ny };
  events.push(event);
  return event;
}

function capVelocity(body) {
  const speed = Math.hypot(body.vx, body.vy);
  if (speed > GAMEPLAY.puck.maxSpeed) {
    body.vx *= GAMEPLAY.puck.maxSpeed / speed;
    body.vy *= GAMEPLAY.puck.maxSpeed / speed;
  }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
