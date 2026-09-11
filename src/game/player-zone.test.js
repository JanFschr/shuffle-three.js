import test from "node:test";
import assert from "node:assert/strict";
import { GAMEPLAY, SERVE, TABLE } from "./config.js";
import { createGame, setTarget, startGame } from "./simulation.js";

test("player paddle reaches deeper without moving the serve puck", () => {
  assert.equal(GAMEPLAY.table.playerZoneDepth, 4.8);
  assert.equal(GAMEPLAY.table.serveDepth, 3);
  assert.ok(Math.abs(TABLE.playerMinY - 3.2) < 1e-9);
  assert.ok(TABLE.playerMinY > 0, "player must still stop well before the table midpoint");

  const game = createGame();
  const initialPuckY = game.puck.y;
  assert.equal(initialPuckY, SERVE.playerPuckY);
  assert.equal(initialPuckY, 4.52);

  startGame(game);
  assert.equal(game.puck.y, initialPuckY);

  setTarget(game, { x: 0, y: 0 });
  assert.ok(Math.abs(game.playerTarget.y - 3.2) < 1e-9);
});

test("enemy zone and both serve positions stay unchanged", () => {
  assert.equal(TABLE.enemyMaxY, -5);
  assert.equal(SERVE.playerPuckY, 4.52);
  assert.equal(SERVE.enemyPuckY, -4.52);
});
