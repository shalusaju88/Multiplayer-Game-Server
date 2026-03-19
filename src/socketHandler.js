const gameManager = require('./GameManager');
const db = require('./db');

module.exports = function registerSocketHandlers(io) {
  gameManager.setIO(io);

  io.on('connection', (socket) => {
    console.log(`[+] Client connected: ${socket.id}`);

    // ── 1. Register player ───────────────────────────────────────────────────
    socket.on('register', ({ name }) => {
      const player = gameManager.addPlayer(socket.id, name);
      socket.emit('registered', { player: player.toJSON() });

      // Record this session as a login event
      const ip = socket.handshake.headers['x-forwarded-for'] ||
                 socket.handshake.address || 'unknown';
      db.recordLogin(player.name, ip);

      console.log(`    Registered: ${player.name} (${socket.id})`);
    });

    // ── 2. Create Room ───────────────────────────────────────────────────────
    socket.on('createRoom', ({ roomName }) => {
      const result = gameManager.createRoom(roomName, socket.id);
      if (result.error) return socket.emit('error', { message: result.error });

      socket.join(result.room.id);
      socket.emit('roomCreated', { room: result.room.toJSON() });
      io.emit('roomListUpdated', { rooms: gameManager.listRooms() });
      console.log(`    Room created: ${result.room.name} (${result.room.id})`);
    });

    // ── 3. Join Room ─────────────────────────────────────────────────────────
    socket.on('joinRoom', ({ roomId }) => {
      const result = gameManager.joinRoom(roomId, socket.id);
      if (result.error) return socket.emit('error', { message: result.error });

      socket.join(roomId);
      socket.emit('roomJoined', { room: result.room.toJSON() });
      socket.to(roomId).emit('playerJoined', {
        player: result.player.toJSON(),
        playerCount: result.room.players.size,
      });
      io.emit('roomListUpdated', { rooms: gameManager.listRooms() });
      console.log(`    ${result.player.name} joined room ${result.room.name}`);
    });

    // ── 4. Leave Room ────────────────────────────────────────────────────────
    socket.on('leaveRoom', () => {
      const player = gameManager.getPlayer(socket.id);
      const roomId = player?.roomId;
      const room = gameManager.leaveRoom(socket.id);

      if (room) {
        socket.leave(roomId);
        socket.emit('leftRoom');
        io.to(roomId).emit('playerLeft', {
          playerId: socket.id,
          playerName: player?.name,
          newHostId: room.hostId,
        });
        io.emit('roomListUpdated', { rooms: gameManager.listRooms() });
      }
    });

    // ── 5. Start Game ────────────────────────────────────────────────────────
    socket.on('startGame', ({ roomId }) => {
      const result = gameManager.startGame(roomId, socket.id);
      if (result.error) return socket.emit('error', { message: result.error });

      io.to(roomId).emit('gameStarted', {
        roomId,
        mapWidth: require('../config').MAP_WIDTH,
        mapHeight: require('../config').MAP_HEIGHT,
        players: Array.from(result.room.players.values()).map(p => p.toJSON()),
      });
      io.emit('roomListUpdated', { rooms: gameManager.listRooms() });
      console.log(`    Game started in room ${result.room.name}`);
    });

    // ── 6. Player Movement ───────────────────────────────────────────────────
    socket.on('playerMove', ({ keys, angle }) => {
      const player = gameManager.getPlayer(socket.id);
      if (!player || !player.roomId) return;
      if (keys) player.keys = keys;
      if (angle !== undefined) player.angle = angle;
    });

    // ── 7. Player Shoot ──────────────────────────────────────────────────────
    socket.on('playerShoot', ({ x, y, angle }) => {
      const player = gameManager.getPlayer(socket.id);
      if (!player || !player.roomId) return;
      const room = gameManager.getRoom(player.roomId);
      if (room) room.spawnBullet(socket.id, x, y, angle);
    });

    // ── 8. Chat Message ──────────────────────────────────────────────────────
    socket.on('chatMessage', ({ roomId, message }) => {
      const player = gameManager.getPlayer(socket.id);
      if (!player || !message.trim()) return;
      const sanitized = message.slice(0, 200);
      io.to(roomId).emit('chatMessage', {
        playerId: socket.id,
        playerName: player.name,
        playerColor: player.color,
        message: sanitized,
        timestamp: Date.now(),
      });
    });

    // ── 9. Request room list ─────────────────────────────────────────────────
    socket.on('getRooms', () => {
      socket.emit('roomList', { rooms: gameManager.listRooms() });
    });

    // ── 10. Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const player = gameManager.getPlayer(socket.id);
      const roomId = player?.roomId;
      const playerName = player?.name;

      gameManager.removePlayer(socket.id);

      if (roomId) {
        io.to(roomId).emit('playerLeft', {
          playerId: socket.id,
          playerName,
        });
        io.emit('roomListUpdated', { rooms: gameManager.listRooms() });
      }
      console.log(`[-] Disconnected: ${playerName || socket.id}`);
    });
  });
};
