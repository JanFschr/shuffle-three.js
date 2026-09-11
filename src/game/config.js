export const GAMEPLAY = Object.freeze({
  table: Object.freeze({ halfWidth: 4.5, halfLength: 8, strikerZoneDepth: 3 }),
  puck: Object.freeze({ radius: .27, maxSpeed: 15, damping: .045 }),
  player: Object.freeze({
    radius: .58,
    normal: Object.freeze({ maxSpeed: 18, acceleration: 85, contactMultiplier: 1 }),
    power: Object.freeze({ maxSpeed: 23, acceleration: 125, contactMultiplier: 1.22 }),
  }),
  enemy: Object.freeze({ radius: .58, maxSpeed: 14.5, acceleration: 58 }),
});

export const TABLE = Object.freeze({
  ...GAMEPLAY.table,
  playerMinY: GAMEPLAY.table.halfLength - GAMEPLAY.table.strikerZoneDepth,
  playerMaxY: GAMEPLAY.table.halfLength - GAMEPLAY.player.radius - .12,
  enemyMinY: -GAMEPLAY.table.halfLength + GAMEPLAY.enemy.radius + .12,
  enemyMaxY: -GAMEPLAY.table.halfLength + GAMEPLAY.table.strikerZoneDepth,
});
