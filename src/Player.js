const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class Player {
  constructor(socketId, name) {
    this.id = socketId;
    this.name = name || `Player_${socketId.slice(0, 5)}`;
    this.roomId = null;
    this.x = Math.random() * (config.MAP_WIDTH - 100) + 50;
    this.y = Math.random() * (config.MAP_HEIGHT - 100) + 50;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.hp = config.PLAYER_HP;
    this.maxHp = config.PLAYER_HP;
    this.score = 0;
    this.kills = 0;
    this.deaths = 0;
    this.isAlive = true;
    this.color = this._randomColor();
    this.keys = { w: false, a: false, s: false, d: false };
    this.joinedAt = Date.now();
  }

  _randomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
                    '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#82e0aa'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  respawn(mapWidth, mapHeight) {
    this.x = Math.random() * (mapWidth - 100) + 50;
    this.y = Math.random() * (mapHeight - 100) + 50;
    this.hp = this.maxHp;
    this.isAlive = true;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) {
      this.isAlive = false;
      this.deaths++;
    }
    return !this.isAlive;
  }

  addKill() {
    this.kills++;
    this.score += 100;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      angle: this.angle,
      hp: this.hp,
      maxHp: this.maxHp,
      score: this.score,
      kills: this.kills,
      deaths: this.deaths,
      isAlive: this.isAlive,
      color: this.color,
    };
  }
}

module.exports = Player;
