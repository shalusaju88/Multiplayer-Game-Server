module.exports = {
  PORT: process.env.PORT || 3000,
  MAX_PLAYERS_PER_ROOM: 8,
  MIN_PLAYERS_TO_START: 2,
  GAME_TICK_RATE: 60,           // ticks per second
  GAME_DURATION: 3 * 60 * 1000, // 3 minutes in ms
  MAP_WIDTH: 1200,
  MAP_HEIGHT: 700,
  PLAYER_SPEED: 4,
  PLAYER_HP: 100,
  BULLET_SPEED: 10,
  BULLET_DAMAGE: 20,
  BULLET_RADIUS: 5,
  PLAYER_RADIUS: 18,
  RESPAWN_TIME: 3000,           // ms
};
