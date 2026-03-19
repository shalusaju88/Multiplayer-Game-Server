const GameRoom = require('./GameRoom');
const Player = require('./Player');
const config = require('../config');

class GameManager {
  constructor() {
    this.rooms = new Map();      // roomId -> GameRoom
    this.players = new Map();    // socketId -> Player
    this.allTimePlayers = [];    // For global leaderboard persistence
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  // ─── Player ────────────────────────────────────────────────────────────────

  addPlayer(socketId, name) {
    const player = new Player(socketId, name);
    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;

    if (player.roomId) {
      this.leaveRoom(socketId);
    }
    this.players.delete(socketId);
    return player;
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  // ─── Rooms ─────────────────────────────────────────────────────────────────

  createRoom(name, hostSocketId) {
    const host = this.players.get(hostSocketId);
    if (!host) return { error: 'Player not found' };

    if (this.rooms.size >= 50) return { error: 'Server is full – maximum rooms reached' };

    const room = new GameRoom(name || `${host.name}'s Room`, hostSocketId, host.name, this.io);
    room.addPlayer(host);
    this.rooms.set(room.id, room);
    return { room };
  }

  joinRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    const player = this.players.get(socketId);

    if (!room) return { error: 'Room not found' };
    if (!player) return { error: 'Player not found' };
    if (room.status !== 'waiting') return { error: 'Game already in progress' };
    if (room.players.size >= config.MAX_PLAYERS_PER_ROOM) return { error: 'Room is full' };
    if (player.roomId) this.leaveRoom(socketId); // leave old room first

    room.addPlayer(player);
    return { room, player };
  }

  leaveRoom(socketId) {
    const player = this.players.get(socketId);
    if (!player || !player.roomId) return null;

    const room = this.rooms.get(player.roomId);
    if (!room) return null;

    room.removePlayer(socketId);

    // Destroy empty room
    if (room.players.size === 0) {
      if (room.gameLoop) clearInterval(room.gameLoop);
      this.rooms.delete(room.id);
    }
    return room;
  }

  startGame(roomId, requesterId) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.hostId !== requesterId) return { error: 'Only the host can start the game' };
    if (room.players.size < config.MIN_PLAYERS_TO_START)
      return { error: `Need at least ${config.MIN_PLAYERS_TO_START} players to start` };

    const started = room.startGame();
    if (!started) return { error: 'Could not start game' };
    return { room };
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  listRooms() {
    return Array.from(this.rooms.values()).map(r => r.toJSON());
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: this.players.size,
      activeGames: Array.from(this.rooms.values()).filter(r => r.status === 'in-progress').length,
    };
  }

  getGlobalLeaderboard() {
    // Aggregate scores from all rooms
    const scoreMap = new Map();
    this.players.forEach(player => {
      scoreMap.set(player.id, {
        id: player.id,
        name: player.name,
        score: player.score,
        kills: player.kills,
        deaths: player.deaths,
        color: player.color,
      });
    });
    return Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
}

module.exports = new GameManager(); // singleton
