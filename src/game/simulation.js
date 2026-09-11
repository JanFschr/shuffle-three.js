export const TABLE = { halfWidth: 4.5, halfLength: 8, goalHalfWidth: 1.55 };
export const FIXED_STEP = 1 / 120;
const PUCK_RADIUS = 0.27;
const STRIKER_RADIUS = 0.58;
const MAX_PUCK_SPEED = 15;

export function createGame() {
  return {
    puck: { x: 0, y: 0, vx: 0, vy: 0, radius: PUCK_RADIUS },
    player: { x: 0, y: 5.6, vx: 0, vy: 0, radius: STRIKER_RADIUS },
    enemy: { x: 0, y: -5.6, vx: 0, vy: 0, radius: STRIKER_RADIUS },
    playerTarget: { x: 0, y: 5.6 }, playerHp: 100, enemyHp: 100,
    rally: 0, phase: "ready", serveTimer: 0, inactiveTimer: 0, time: 0,
  };
}

export function startGame(state) {
  if (state.phase === "ready" || state.phase === "ended") resetRound(state, "player");
}

export function setTarget(state, target) {
  state.playerTarget.x = clamp(target.x, -TABLE.halfWidth + .65, TABLE.halfWidth - .65);
  state.playerTarget.y = clamp(target.y, .45, TABLE.halfLength - .75);
}

export function activateImpulse(state) {
  if (state.phase !== "playing") return;
  const dx = state.puck.x - state.player.x;
  const dy = state.puck.y - state.player.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1.8 && distance > 0) {
    state.puck.vx += dx / distance * 3.2;
    state.puck.vy += dy / distance * 3.2;
  }
}

function resetRound(state, serving) {
  Object.assign(state.puck, { x: 0, y: serving === "player" ? 1.3 : -1.3, vx: 0, vy: 0 });
  Object.assign(state.player, { x: 0, y: 5.6, vx: 0, vy: 0 });
  Object.assign(state.enemy, { x: 0, y: -5.6, vx: 0, vy: 0 });
  state.playerTarget = { x: 0, y: 5.6 };
  state.rally = 0;
  state.inactiveTimer = 0;
  state.serveTimer = serving === "player" ? .9 : -.9;
  state.phase = "serve";
}

export function stepGame(state, dt = FIXED_STEP) {
  const events = [];
  if (state.phase === "paused" || state.phase === "ready" || state.phase === "ended") return events;
  state.time += dt;
  moveStriker(state.player, state.playerTarget, dt, 22, 90, { minY: .4, maxY: 7.3 });
  updateEnemy(state, dt);
  if (state.phase === "serve") {
    const servingPlayer = state.serveTimer > 0;
    state.serveTimer += servingPlayer ? -dt : dt;
    if ((servingPlayer && state.serveTimer <= 0) || (!servingPlayer && state.serveTimer >= 0)) {
      state.puck.vx = (Math.sin(state.time * 13.7)) * 1.5;
      state.puck.vy = servingPlayer ? -6.8 : 6.8;
      state.phase = "playing";
      events.push({ type: "serve" });
    }
    return events;
  }

  state.puck.x += state.puck.vx * dt;
  state.puck.y += state.puck.vy * dt;
  const damping = Math.exp(-.045 * dt);
  state.puck.vx *= damping; state.puck.vy *= damping;
  state.inactiveTimer += dt;
  if (state.inactiveTimer > 12) {
    const speed = Math.hypot(state.puck.vx, state.puck.vy);
    if (speed > 0) {
      const boost = Math.exp(.28 * dt);
      state.puck.vx *= boost;
      state.puck.vy *= boost;
    }
  }

  const wall = TABLE.halfWidth - state.puck.radius;
  if (Math.abs(state.puck.x) > wall) {
    state.puck.x = Math.sign(state.puck.x) * wall;
    state.puck.vx = -state.puck.vx * .96;
    events.push({ type: "rail", intensity: Math.abs(state.puck.vx) / MAX_PUCK_SPEED });
  }
  const contactsBefore = events.length;
  collideStriker(state.puck, state.player, events);
  collideStriker(state.puck, state.enemy, events);
  if (events.length > contactsBefore) state.inactiveTimer = 0;
  capVelocity(state.puck);

  const line = TABLE.halfLength + state.puck.radius;
  if (Math.abs(state.puck.y) > line) {
    if (Math.abs(state.puck.x) <= TABLE.goalHalfWidth) scoreGoal(state, state.puck.y < 0 ? "player" : "enemy", events);
    else {
      state.puck.y = Math.sign(state.puck.y) * line;
      state.puck.vy *= -.93;
      events.push({ type: "rail", intensity: Math.abs(state.puck.vy) / MAX_PUCK_SPEED });
    }
  } else if (Math.abs(state.puck.y) > TABLE.halfLength - state.puck.radius && Math.abs(state.puck.x) > TABLE.goalHalfWidth) {
    state.puck.y = Math.sign(state.puck.y) * (TABLE.halfLength - state.puck.radius);
    state.puck.vy *= -.93;
    events.push({ type: "rail", intensity: Math.abs(state.puck.vy) / MAX_PUCK_SPEED });
  }
  return events;
}

function scoreGoal(state, scorer, events) {
  const speed = Math.hypot(state.puck.vx, state.puck.vy);
  const damage = Math.round(20 * clamp(speed / 8, .75, 1.5));
  if (scorer === "player") state.enemyHp = Math.max(0, state.enemyHp - damage);
  else state.playerHp = Math.max(0, state.playerHp - damage);
  events.push({ type: "goal", side: scorer, damage, intensity: speed / MAX_PUCK_SPEED });
  if (state.playerHp === 0 || state.enemyHp === 0) {
    state.phase = "ended"; state.winner = state.enemyHp === 0 ? "player" : "enemy";
    state.puck.vx = state.puck.vy = 0;
    events.push({ type: "win", side: state.winner });
  } else resetRound(state, scorer === "player" ? "enemy" : "player");
}

function moveStriker(body, target, dt, maxSpeed, acceleration, bounds) {
  const dx = target.x - body.x, dy = target.y - body.y;
  const distance = Math.hypot(dx, dy);
  const desiredX = distance ? dx / distance * Math.min(maxSpeed, distance * 12) : 0;
  const desiredY = distance ? dy / distance * Math.min(maxSpeed, distance * 12) : 0;
  const maxChange = acceleration * dt;
  body.vx += clamp(desiredX - body.vx, -maxChange, maxChange);
  body.vy += clamp(desiredY - body.vy, -maxChange, maxChange);
  body.x = clamp(body.x + body.vx * dt, -TABLE.halfWidth + body.radius, TABLE.halfWidth - body.radius);
  body.y = clamp(body.y + body.vy * dt, bounds.minY, bounds.maxY);
}

function updateEnemy(state, dt) {
  const puckComing = state.puck.vy < 0;
  const predictedX = clamp(state.puck.x + state.puck.vx * Math.max(0, (-5.5 - state.puck.y) / Math.min(-.1, state.puck.vy)), -3.8, 3.8);
  const error = Math.sin(state.time * 1.71) * .18;
  const target = puckComing ? { x: predictedX + error, y: -6.05 } : { x: state.puck.x * .42, y: -5.35 };
  moveStriker(state.enemy, target, dt, 14.5, 58, { minY: -7.3, maxY: -.4 });
}

function collideStriker(puck, striker, events) {
  const dx = puck.x - striker.x, dy = puck.y - striker.y;
  const minDistance = puck.radius + striker.radius;
  const distanceSq = dx * dx + dy * dy;
  if (distanceSq >= minDistance * minDistance) return;
  const distance = Math.sqrt(distanceSq) || .0001;
  const nx = dx / distance, ny = dy / distance;
  puck.x = striker.x + nx * minDistance; puck.y = striker.y + ny * minDistance;
  const relative = (puck.vx - striker.vx) * nx + (puck.vy - striker.vy) * ny;
  if (relative < 0) {
    const impulse = -(1 + .9) * relative;
    puck.vx += impulse * nx + striker.vx * .16;
    puck.vy += impulse * ny + striker.vy * .16;
    events.push({ type: "striker", intensity: clamp(Math.abs(relative) / 14, .15, 1) });
  }
}

function capVelocity(body) {
  const speed = Math.hypot(body.vx, body.vy);
  if (speed > MAX_PUCK_SPEED) { body.vx *= MAX_PUCK_SPEED / speed; body.vy *= MAX_PUCK_SPEED / speed; }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
