const express = require('express');
const router = express.Router();
const gameManager = require('../GameManager');

// GET /api/rooms - List all active rooms
router.get('/rooms', (req, res) => {
  const rooms = gameManager.listRooms();
  res.json({ success: true, count: rooms.length, rooms });
});

// POST /api/rooms - Create a room (REST alternative)
router.post('/rooms', (req, res) => {
  const { roomName, playerName, socketId } = req.body;
  if (!socketId) return res.status(400).json({ success: false, error: 'socketId required' });

  // Ensure player exists (they must be connected via socket)
  const player = gameManager.getPlayer(socketId);
  if (!player) return res.status(404).json({ success: false, error: 'Player not found. Connect via Socket.IO first.' });

  const result = gameManager.createRoom(roomName, socketId);
  if (result.error) return res.status(400).json({ success: false, error: result.error });

  res.status(201).json({ success: true, room: result.room.toJSON() });
});

// GET /api/rooms/:id - Get specific room details
router.get('/rooms/:id', (req, res) => {
  const room = gameManager.getRoom(req.params.id);
  if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

  res.json({
    success: true,
    room: {
      ...room.toJSON(),
      leaderboard: room.getLeaderboard(),
    },
  });
});

// GET /api/leaderboard - Global leaderboard (top 10 players)
router.get('/leaderboard', (req, res) => {
  const leaderboard = gameManager.getGlobalLeaderboard();
  res.json({ success: true, leaderboard });
});

// GET /api/stats - Server statistics
router.get('/stats', (req, res) => {
  res.json({ success: true, stats: gameManager.getStats() });
});

module.exports = router;
