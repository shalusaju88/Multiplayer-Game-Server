const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const registerSocketHandlers = require('./src/socketHandler');
const gameRoutes = require('./src/routes/gameRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
});

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── REST API ─────────────────────────────────────────────────────────────────
app.use('/api', gameRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ── SPA fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Socket.IO ────────────────────────────────────────────────────────────────
registerSocketHandlers(io);

// ── Start Server ─────────────────────────────────────────────────────────────
server.listen(config.PORT, () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║    🎮  Multiplayer Game Server  🎮            ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Server  : http://localhost:${config.PORT}             ║`);
  console.log(`║  API     : http://localhost:${config.PORT}/api         ║`);
  console.log(`║  Health  : http://localhost:${config.PORT}/health      ║`);
  console.log('╚══════════════════════════════════════════════╝');
});

module.exports = { app, server, io };
