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
