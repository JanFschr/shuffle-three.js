import test from "node:test";
import assert from "node:assert/strict";
import { GAMEPLAY } from "./config.js";
import { FIXED_STEP, TABLE, activateSurge, createGame, setTarget, startGame, stepGame } from "./simulation.js";

test("player serve starts near the player and never launches itself", () => {
  const game = createGame();
  startGame(game);
  assert.equal(game.phase, "serve");
  assert.ok(game.puck.y > 3.5);
  assert.equal(game.puck.vx, 0);
  assert.equal(game.puck.vy, 0);

  for (let i = 0; i < 360; i++) stepGame(game);
  assert.equal(game.phase, "serve");
  assert.equal(game.puck.vx, 0);
  assert.equal(game.puck.vy, 0);
});

test("player begins a rally by physically striking the serve", () => {
  const game = createGame();
  startGame(game);
  setTarget(game, { x: 0, y: TABLE.playerMinY });

  let served = false;
  for (let i = 0; i < 240 && !served; i++) {
    const events = stepGame(game);
    served = events.some(event => event.type === "serve" && event.side === "player");
  }

  assert.equal(served, true);
  assert.equal(game.phase, "playing");
  assert.ok(game.puck.vy < 0);
});

test("enemy serves with its striker instead of spawning puck velocity", () => {
  const game = createGame();
  game.phase = "playing";
  game.puck.y = -TABLE.halfLength - .3;
  game.puck.vy = -8;
  stepGame(game);
  assert.equal(game.phase, "serve");
  assert.equal(game.serveSide, "enemy");
  assert.equal(game.puck.vy, 0);

  let served = false;
  for (let i = 0; i < 300 && !served; i++) {
    const events = stepGame(game);
    served = events.some(event => event.type === "serve" && event.side === "enemy");
  }

  assert.equal(served, true);
  assert.ok(game.puck.vy > 0);
});

test("rectangular striker dimensions are used for movement bounds", () => {
  const game = createGame();
  assert.equal(game.player.halfWidth, GAMEPLAY.player.halfWidth);
  assert.equal(game.player.halfDepth, GAMEPLAY.player.halfDepth);
  setTarget(game, { x: 99, y: 99 });
  assert.equal(game.playerTarget.x, TABLE.halfWidth - GAMEPLAY.player.halfWidth);
  assert.equal(game.playerTarget.y, TABLE.playerMaxY);
});

test("wide rectangular front face returns an off-center puck", () => {
  const game = createGame();
  game.phase = "playing";
  Object.assign(game.player, { x: 0, y: 6, vx: 0, vy: -4 });
  game.playerTarget = { x: 0, y: 5 };
  Object.assign(game.puck, { x: .7, y: 5.48, vx: 0, vy: 1 });

  const events = stepGame(game);
  const hit = events.find(event => event.type === "striker" && event.side === "player");
  assert.ok(hit);
  assert.ok(hit.normalY < -.9);
  assert.ok(game.puck.vy < 0);
});

test("rectangular side face transfers lateral momentum", () => {
  const game = createGame();
  game.phase = "playing";
  Object.assign(game.player, { x: 0, y: 6, vx: 0, vy: 0 });
  game.playerTarget = { x: 0, y: 6 };
  Object.assign(game.puck, { x: .95, y: 6, vx: -5, vy: 0 });

  const events = stepGame(game);
  const hit = events.find(event => event.type === "striker" && event.side === "player");
  assert.ok(hit);
  assert.ok(hit.normalX > .9);
  assert.ok(game.puck.vx > 0);
});

test("puck outside a rectangular corner does not create a false hit", () => {
  const game = createGame();
  game.phase = "playing";
  Object.assign(game.player, { x: 0, y: 6, vx: 0, vy: 0 });
  game.playerTarget = { x: 0, y: 6 };
  Object.assign(game.puck, { x: 1.03, y: 5.61, vx: -2, vy: 2 });

  const events = stepGame(game);
  assert.ok(!events.some(event => event.type === "striker" && event.side === "player"));
});

test("reflects a puck from the side rail without tunneling", () => {
  const game = createGame();
  game.phase = "playing";
  game.puck.x = TABLE.halfWidth - .3;
  game.puck.vx = 12;
  game.puck.vy = 0;
  const events = stepGame(game, FIXED_STEP);
  assert.ok(game.puck.vx < 0);
  assert.ok(events.some(event => event.type === "rail"));
});

test("applies more damage to a faster goal", () => {
  const score = speed => {
    const game = createGame();
    game.phase = "playing";
    game.puck.y = -TABLE.halfLength - .26;
    game.puck.vy = -speed;
    return stepGame(game).find(event => event.type === "goal")?.damage ?? 0;
  };
  assert.ok(score(13) > score(4));
});

test("the full width of either end line scores without a rear-wall bounce", () => {
  for (const x of [0, TABLE.halfWidth - .27, -TABLE.halfWidth + .27]) {
    const game = createGame();
    game.phase = "playing";
    game.puck.x = x;
    game.puck.y = -TABLE.halfLength - .27;
    game.puck.vy = -8;
    const events = stepGame(game);
    assert.ok(events.some(event => event.type === "goal" && event.side === "player"));
    assert.ok(!events.some(event => event.type === "rail"));
  }
});

test("clamps pointer targets to the player defensive zone", () => {
  const game = createGame();
  setTarget(game, { x: 99, y: -99 });
  assert.equal(game.playerTarget.x, TABLE.halfWidth - GAMEPLAY.player.halfWidth);
  assert.equal(game.playerTarget.y, TABLE.playerMinY);
});

test("enemy remains inside its defensive zone", () => {
  const game = createGame();
  game.phase = "playing";
  game.puck.y = -1;
  game.puck.vy = -12;
  for (let i = 0; i < 240; i++) {
    stepGame(game);
    assert.ok(game.enemy.y <= TABLE.enemyMaxY);
  }
});

test("charge grows from player contact, bank shots, goals and concessions", () => {
  const contact = createGame();
  contact.phase = "playing";
  Object.assign(contact.player, { x: 0, y: 5, vx: 0, vy: -8 });
  contact.playerTarget = { x: 0, y: 5 };
  Object.assign(contact.puck, { x: 0, y: 4.48, vx: 0, vy: 1 });
  const before = contact.charge;
  stepGame(contact);
  assert.ok(contact.charge > before);

  const bank = createGame();
  bank.phase = "playing";
  bank.lastTouch = "player";
  bank.bankAvailable = true;
  bank.puck.x = TABLE.halfWidth - .3;
  bank.puck.vx = 12;
  const bankBefore = bank.charge;
  stepGame(bank);
  assert.ok(bank.charge >= bankBefore + 4);

  const goalFor = createGame();
  goalFor.phase = "playing";
  goalFor.puck.y = -TABLE.halfLength - .3;
  goalFor.puck.vy = -8;
  stepGame(goalFor);
  assert.ok(goalFor.charge >= 24);

  const goalAgainst = createGame();
  goalAgainst.phase = "playing";
  goalAgainst.puck.y = TABLE.halfLength + .3;
  goalAgainst.puck.vy = 8;
  stepGame(goalAgainst);
  assert.ok(goalAgainst.charge >= 16);
});

test("surge cannot activate before full charge and consumes a full meter", () => {
  const game = createGame();
  game.phase = "playing";
  game.charge = 99;
  assert.equal(activateSurge(game), false);
  game.charge = 100;
  assert.equal(activateSurge(game), true);
  assert.equal(game.charge, 0);
  assert.ok(game.surgeTimer > 0);
});

test("surge cannot move a puck without contact", () => {
  const game = createGame();
  game.phase = "playing";
  game.charge = 100;
  activateSurge(game);
  game.puck.x = 0;
  game.puck.y = 0;
  for (let i = 0; i < 30; i++) stepGame(game);
  assert.equal(game.puck.vx, 0);
  assert.equal(game.puck.vy, 0);
});

test("surge contact creates a stronger return than a normal contact", () => {
  const collide = surge => {
    const game = createGame();
    game.phase = "playing";
    if (surge) {
      game.charge = 100;
      activateSurge(game);
    }
    Object.assign(game.player, { x: 0, y: 6, vx: 0, vy: -4 });
    game.playerTarget = { x: 0, y: 5 };
    Object.assign(game.puck, { x: 0, y: 5.48, vx: 0, vy: 1 });
    stepGame(game);
    return -game.puck.vy;
  };
  assert.ok(collide(true) > collide(false));
});

test("surge activation is deterministic for identical charged states", () => {
  const a = createGame();
  const b = createGame();
  a.phase = b.phase = "playing";
  a.charge = b.charge = 100;
  assert.equal(activateSurge(a), true);
  assert.equal(activateSurge(b), true);
  setTarget(a, { x: 1.2, y: TABLE.playerMinY });
  setTarget(b, { x: 1.2, y: TABLE.playerMinY });
  for (let i = 0; i < 300; i++) {
    stepGame(a);
    stepGame(b);
  }
  assert.deepEqual(a, b);
});

test("is deterministic for identical inputs", () => {
  const a = createGame();
  const b = createGame();
  startGame(a);
  startGame(b);
  setTarget(a, { x: 0, y: TABLE.playerMinY });
  setTarget(b, { x: 0, y: TABLE.playerMinY });
  for (let i = 0; i < 800; i++) {
    stepGame(a);
    stepGame(b);
  }
  assert.deepEqual(a, b);
});

test("accelerates a rally after the anti-stall threshold", () => {
  const game = createGame();
  game.phase = "playing";
  game.puck.vx = .5;
  for (let i = 0; i < 12 / FIXED_STEP; i++) stepGame(game);
  const speedAtThreshold = Math.hypot(game.puck.vx, game.puck.vy);
  for (let i = 0; i < 2 / FIXED_STEP; i++) stepGame(game);
  assert.ok(Math.hypot(game.puck.vx, game.puck.vy) > speedAtThreshold);
});

test("plays a complete BREAK match through to a winner", () => {
  const game = createGame();
  startGame(game);
  while (game.enemyHp > 0) {
    game.phase = "playing";
    game.puck.x = 0;
    game.puck.y = -TABLE.halfLength - .26;
    game.puck.vy = -15;
    stepGame(game);
  }
  assert.equal(game.phase, "ended");
  assert.equal(game.winner, "player");
  assert.equal(game.enemyHp, 0);
});
