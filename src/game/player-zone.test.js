import test from "node:test";
import assert from "node:assert/strict";
import { GAMEPLAY, SERVE, TABLE } from "./config.js";
import { createGame, setTarget, startGame } from "./simulation.js";

test("player paddle reaches one third deeper without moving the serve puck", () => {
  assert.equal(GAMEPLAY.table.playerZoneDepth, 4);
  assert.equal(GAMEPLAY.table.serveDepth, 3);
  assert.equal(TABLE.playerMinY, 4);

  const game = createGame();
  const initialPuckY = game.puck.y;
  assert.equal(initialPuckY, SERVE.playerPuckY);
  assert.equal(initialPuckY, 4.52);

  startGame(game);
  assert.equal(game.puck.y, initialPuckY);

  setTarget(game, { x: 0, y: 0 });
  assert.equal(game.playerTarget.y, 4);
});

test("enemy zone and enemy serve position stay unchanged", () => {
  assert.equal(TABLE.enemyMaxY, -5);
  assert.equal(SERVE.enemyPuckY, -4.52);
});
