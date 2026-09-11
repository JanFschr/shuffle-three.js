export const GAMEPLAY = Object.freeze({
  table: Object.freeze({
    halfWidth: 4.5,
    halfLength: 8,
    strikerZoneDepth: 3,
  }),
  puck: Object.freeze({
    radius: .27,
    maxSpeed: 15,
    damping: .045,
    serveInset: .48,
  }),
  player: Object.freeze({
    halfWidth: .74,
    halfDepth: .29,
    startY: 6.15,
    normal: Object.freeze({ maxSpeed: 18, acceleration: 85, contactMultiplier: 1 }),
    surge: Object.freeze({ maxSpeed: 25, acceleration: 145, contactMultiplier: 1.3, duration: 2.4 }),
  }),
  enemy: Object.freeze({
    halfWidth: .74,
    halfDepth: .29,
    startY: -6.15,
    maxSpeed: 14.5,
    acceleration: 58,
  }),
  charge: Object.freeze({
    max: 100,
    strikerBase: 3,
    strikerIntensity: 5,
    bankShot: 4,
    goalFor: 24,
    goalAgainst: 16,
  }),
});

export const TABLE = Object.freeze({
  ...GAMEPLAY.table,
  playerMinY: GAMEPLAY.table.halfLength - GAMEPLAY.table.strikerZoneDepth,
  playerMaxY: GAMEPLAY.table.halfLength - GAMEPLAY.player.halfDepth - .12,
  enemyMinY: -GAMEPLAY.table.halfLength + GAMEPLAY.enemy.halfDepth + .12,
  enemyMaxY: -GAMEPLAY.table.halfLength + GAMEPLAY.table.strikerZoneDepth,
});

export const SERVE = Object.freeze({
  playerPuckY: TABLE.playerMinY - GAMEPLAY.puck.serveInset,
  enemyPuckY: TABLE.enemyMaxY + GAMEPLAY.puck.serveInset,
});
