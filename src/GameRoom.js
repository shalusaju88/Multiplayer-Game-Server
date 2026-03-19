const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class GameRoom {
  constructor(name, hostId, hostName, io) {
    this.id = uuidv4();
    this.name = name;
    this.hostId = hostId;
    this.hostName = hostName;
    this.io = io;
    this.players = new Map();   // socketId -> Player
    this.bullets = [];
    this.status = 'waiting';    // waiting | in-progress | finished
    this.createdAt = Date.now();
    this.startedAt = null;
    this.gameLoop = null;
    this.bulletIdCounter = 0;
  }

  addPlayer(player) {
    player.roomId = this.id;
    // Assign spawn position
    player.x = Math.random() * (config.MAP_WIDTH - 100) + 50;
    player.y = Math.random() * (config.MAP_HEIGHT - 100) + 50;
    this.players.set(player.id, player);
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      player.roomId = null;
      this.players.delete(socketId);
    }
    // If host left, assign a new host
    if (this.hostId === socketId && this.players.size > 0) {
      const newHost = this.players.values().next().value;
      this.hostId = newHost.id;
      this.hostName = newHost.name;
    }
    return player;
  }

  startGame() {
    if (this.status !== 'waiting') return false;
    if (this.players.size < config.MIN_PLAYERS_TO_START) return false;
    this.status = 'in-progress';
    this.startedAt = Date.now();
    this._runGameLoop();
    return true;
  }

  endGame() {
    this.status = 'finished';
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    const leaderboard = this.getLeaderboard();
    this.io.to(this.id).emit('gameOver', { leaderboard });
  }

  _runGameLoop() {
    const tickInterval = Math.floor(1000 / config.GAME_TICK_RATE);
    this.gameLoop = setInterval(() => {
      this._tick();
    }, tickInterval);

    // Auto-end game after GAME_DURATION
    setTimeout(() => {
      if (this.status === 'in-progress') this.endGame();
    }, config.GAME_DURATION);
  }

  _tick() {
    // Update player positions
    this.players.forEach(player => {
      if (!player.isAlive) return;
      if (player.keys.w) player.y -= config.PLAYER_SPEED;
      if (player.keys.s) player.y += config.PLAYER_SPEED;
      if (player.keys.a) player.x -= config.PLAYER_SPEED;
      if (player.keys.d) player.x += config.PLAYER_SPEED;

      // Clamp to map
      player.x = Math.max(config.PLAYER_RADIUS, Math.min(config.MAP_WIDTH - config.PLAYER_RADIUS, player.x));
      player.y = Math.max(config.PLAYER_RADIUS, Math.min(config.MAP_HEIGHT - config.PLAYER_RADIUS, player.y));
    });

    // Update bullets
    this.bullets = this.bullets.filter(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life--;

      // Check out-of-bounds
      if (bullet.x < 0 || bullet.x > config.MAP_WIDTH ||
          bullet.y < 0 || bullet.y > config.MAP_HEIGHT || bullet.life <= 0) {
        return false;
      }

      // Check player collision
      let hit = false;
      this.players.forEach(player => {
        if (hit || !player.isAlive || player.id === bullet.ownerId) return;
        const dx = player.x - bullet.x;
        const dy = player.y - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.PLAYER_RADIUS + config.BULLET_RADIUS) {
          const died = player.takeDamage(config.BULLET_DAMAGE);
          this.io.to(this.id).emit('playerHit', {
            targetId: player.id,
            shooterId: bullet.ownerId,
            damage: config.BULLET_DAMAGE,
            hp: player.hp,
          });
          if (died) {
            this.io.to(this.id).emit('playerDied', {
              playerId: player.id,
              shooterId: bullet.ownerId,
            });
            const shooter = this.players.get(bullet.ownerId);
            if (shooter) shooter.addKill();
            // Auto-respawn
            setTimeout(() => {
              if (this.status === 'in-progress' && this.players.has(player.id)) {
                player.respawn(config.MAP_WIDTH, config.MAP_HEIGHT);
                this.io.to(this.id).emit('playerRespawned', { playerId: player.id, x: player.x, y: player.y });
              }
            }, config.RESPAWN_TIME);
          }
          hit = true;
        }
      });
      return !hit;
    });

    // Broadcast game state
    this.io.to(this.id).emit('gameState', this._buildState());
  }

  spawnBullet(ownerId, x, y, angle) {
    if (this.status !== 'in-progress') return;
    const player = this.players.get(ownerId);
    if (!player || !player.isAlive) return;
    this.bullets.push({
      id: this.bulletIdCounter++,
      ownerId,
      ownerColor: player.color,
      x,
      y,
      vx: Math.cos(angle) * config.BULLET_SPEED,
      vy: Math.sin(angle) * config.BULLET_SPEED,
      life: 80, // ticks before auto-expire
    });
  }

  _buildState() {
    return {
      players: Array.from(this.players.values()).map(p => p.toJSON()),
      bullets: this.bullets.map(b => ({
        id: b.id, x: b.x, y: b.y, ownerColor: b.ownerColor,
      })),
      timestamp: Date.now(),
    };
  }

  getLeaderboard() {
    return Array.from(this.players.values())
      .map(p => ({ id: p.id, name: p.name, score: p.score, kills: p.kills, deaths: p.deaths, color: p.color }))
      .sort((a, b) => b.score - a.score);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      hostName: this.hostName,
      playerCount: this.players.size,
      maxPlayers: config.MAX_PLAYERS_PER_ROOM,
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}

module.exports = GameRoom;
