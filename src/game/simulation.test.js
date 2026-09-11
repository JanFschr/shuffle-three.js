import test from "node:test";
import assert from "node:assert/strict";
import { FIXED_STEP, TABLE, createGame, setTarget, startGame, stepGame } from "./simulation.js";

test("serves the puck after the cue", () => {
  const game = createGame(); startGame(game);
  for (let i = 0; i < 120; i++) stepGame(game);
  assert.equal(game.phase, "playing"); assert.ok(game.puck.vy < 0);
});

test("reflects a puck from the side rail without tunneling", () => {
  const game = createGame(); game.phase = "playing"; game.puck.x = TABLE.halfWidth - .3; game.puck.vx = 12; game.puck.vy = 0;
  const events = stepGame(game, FIXED_STEP);
  assert.ok(game.puck.vx < 0); assert.ok(events.some(event => event.type === "rail"));
});

test("applies more damage to a faster goal", () => {
  const score = speed => { const game = createGame(); game.phase = "playing"; game.puck.y = -TABLE.halfLength - .26; game.puck.vy = -speed; return stepGame(game).find(event => event.type === "goal")?.damage ?? 0; };
  assert.ok(score(13) > score(4));
});

test("treats the entire end line as the goal and lets the damaged side serve", () => {
  const game = createGame(); game.phase = "playing"; game.puck.x = TABLE.halfWidth - game.puck.radius; game.puck.y = -TABLE.halfLength - game.puck.radius; game.puck.vy = -8;
  const events = stepGame(game);
  assert.ok(events.some(event => event.type === "goal" && event.side === "player"));
  assert.equal(game.phase, "serve");
  assert.ok(game.serveTimer < 0, "the enemy lost integrity and must take the next serve");
});

test("uses rectangular striker collision bounds", () => {
  const game = createGame(); game.phase = "playing";
  assert.equal(game.player.radius, undefined);
  assert.ok(game.player.halfWidth > game.player.halfLength);
  game.puck.x = game.player.x + game.player.halfWidth + game.puck.radius / 2;
  game.puck.y = game.player.y;
  game.puck.vx = -4;
  const events = stepGame(game, 0);
  assert.ok(events.some(event => event.type === "striker"));
  assert.ok(game.puck.vx > 0);
});

test("clamps pointer targets to the player half", () => {
  const game = createGame(); setTarget(game, { x: 99, y: -99 });
  assert.ok(game.playerTarget.x < TABLE.halfWidth); assert.ok(game.playerTarget.y > 0);
});

test("is deterministic for identical inputs", () => {
  const a = createGame(), b = createGame(); startGame(a); startGame(b);
  for (let i = 0; i < 800; i++) { stepGame(a); stepGame(b); }
  assert.deepEqual(a, b);
});

test("accelerates a rally after the anti-stall threshold", () => {
  const game = createGame(); game.phase = "playing"; game.puck.vx = .5;
  for (let i = 0; i < 12 / FIXED_STEP; i++) stepGame(game);
  const speedAtThreshold = Math.hypot(game.puck.vx, game.puck.vy);
  for (let i = 0; i < 2 / FIXED_STEP; i++) stepGame(game);
  assert.ok(Math.hypot(game.puck.vx, game.puck.vy) > speedAtThreshold);
});

test("plays a complete BREAK match through to a winner", () => {
  const game = createGame(); startGame(game);
  while (game.enemyHp > 0) {
    game.phase = "playing"; game.puck.x = 0; game.puck.y = -TABLE.halfLength - .26; game.puck.vy = -15;
    stepGame(game);
  }
  assert.equal(game.phase, "ended"); assert.equal(game.winner, "player"); assert.equal(game.enemyHp, 0);
});
