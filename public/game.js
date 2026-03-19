/* =============================================================================
   ArenaBlast – Game Client (Socket.IO + Canvas)
   ============================================================================= */

const socket = io();

// ── State ─────────────────────────────────────────────────────────────────────
let myId = null;
let myRoomId = null;
let myName = '';
let isHost = false;
let gameRunning = false;
let gameState = null;        // latest state from server
let mapW = 1200, mapH = 700;
let timerSec = 180;
let timerInterval = null;
let chatVisible = false;

// Canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Key state
const keys = { w: false, a: false, s: false, d: false };
let mouseX = 0, mouseY = 0;

// ── Lobby DOM refs ────────────────────────────────────────────────────────────
const lobbyView   = document.getElementById('lobby-view');
const gameView    = document.getElementById('game-view');
const playerInput = document.getElementById('player-name');
const roomInput   = document.getElementById('room-name');
const btnCreate   = document.getElementById('btn-create');
const roomList    = document.getElementById('room-list');
const statsEl     = document.getElementById('server-stats');

// ── Game HUD refs ─────────────────────────────────────────────────────────────
const hudRoomName = document.getElementById('hud-room-name');
const hudTimer    = document.getElementById('hud-timer');
const hudHpFill   = document.getElementById('hud-hp-fill');
const hudHpText   = document.getElementById('hud-hp-text');
const hudScore    = document.getElementById('hud-score');
const hudKills    = document.getElementById('hud-kills');
const lbList      = document.getElementById('leaderboard-list');
const killFeed    = document.getElementById('kill-feed');
const chatPanel   = document.getElementById('chat-panel');
const chatMsgs    = document.getElementById('chat-messages');
const chatInput   = document.getElementById('chat-input');
const overlay     = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');

// ── Helpers ───────────────────────────────────────────────────────────────────
function switchView(show) {
  lobbyView.classList.toggle('active', show === 'lobby');
  gameView.classList.toggle('active', show === 'game');
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function showOverlay(html) {
  overlayContent.innerHTML = html;
  overlay.classList.remove('hidden');
}
function hideOverlay() {
  overlay.classList.add('hidden');
}

// ── Lobby input logic ─────────────────────────────────────────────────────────
playerInput.addEventListener('input', () => {
  btnCreate.disabled = !playerInput.value.trim();
});

btnCreate.addEventListener('click', () => {
  const name = playerInput.value.trim();
  const room = roomInput.value.trim() || `${name}'s Room`;
  if (!name) return;
  myName = name;
  socket.emit('register', { name });
});

// ── Socket: Registered → then create room ────────────────────────────────────
socket.on('registered', ({ player }) => {
  myId = player.id;
  const roomName = roomInput.value.trim() || `${myName}'s Room`;
  socket.emit('createRoom', { roomName });
});

// ── Socket: Room Created ──────────────────────────────────────────────────────
socket.on('roomCreated', ({ room }) => {
  myRoomId = room.id;
  isHost = true;
  hudRoomName.textContent = room.name;
  switchView('game');
  resizeCanvas();
  showWaitingScreen(room);
});

// ── Socket: Room Joined ───────────────────────────────────────────────────────
socket.on('roomJoined', ({ room }) => {
  myRoomId = room.id;
  isHost = room.hostId === myId;
  hudRoomName.textContent = room.name;
  switchView('game');
  resizeCanvas();
  showWaitingScreen(room);
});

// ── Socket: Player Joined/Left (while waiting) ────────────────────────────────
socket.on('playerJoined', ({ player, playerCount }) => {
  // update waiting screen counter
  const counter = document.getElementById('waiting-count');
  if (counter) counter.textContent = playerCount;
  appendKillFeed(`🟢 ${player.name} joined the room`);
});

socket.on('playerLeft', ({ playerName }) => {
  appendKillFeed(`🔴 ${playerName} left the room`);
});

// ── Waiting Screen ────────────────────────────────────────────────────────────
function showWaitingScreen(room) {
  gameRunning = false;
  drawWaitingCanvas(room);

  let startBtnHtml = '';
  if (isHost) {
    startBtnHtml = `<button class="btn btn-success" id="btn-start" style="margin-top:16px; width:100%">🚀 Start Game</button>`;
  }

  showOverlay(`
    <h2 style="font-size:1.6rem">🎮 Waiting for Players</h2>
    <p style="color:var(--muted); font-size:0.9rem; margin-bottom:14px">${room.name}</p>
    <p style="font-size:1rem">Players: <strong id="waiting-count">${room.playerCount}</strong> / ${room.maxPlayers}</p>
    <p style="color:var(--muted); font-size:0.8rem; margin-top:8px">Need at least 2 players to start</p>
    ${startBtnHtml}
  `);

  if (isHost) {
    document.getElementById('btn-start')?.addEventListener('click', () => {
      socket.emit('startGame', { roomId: myRoomId });
    });
  }
}

function drawWaitingCanvas(room) {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.fillStyle = '#090b13';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawArenaGrid(canvas.width, canvas.height);
}

// ── Socket: Game Started ──────────────────────────────────────────────────────
socket.on('gameStarted', ({ mapWidth, mapHeight, players }) => {
  mapW = mapWidth; mapH = mapHeight;
  gameRunning = true;
  timerSec = 180;
  hideOverlay();
  updateHUD(players.find(p => p.id === myId));
  startTimer();
  requestAnimationFrame(renderLoop);
});

// ── Socket: Game State ────────────────────────────────────────────────────────
socket.on('gameState', (state) => {
  gameState = state;
  const me = state.players.find(p => p.id === myId);
  if (me) updateHUD(me);
  updateLeaderboard(state.players);
});

// ── Socket: Player Hit ────────────────────────────────────────────────────────
socket.on('playerHit', ({ targetId, damage }) => {
  if (targetId === myId) {
    flashScreen('rgba(255,0,0,0.25)');
  }
});

// ── Socket: Player Died ───────────────────────────────────────────────────────
socket.on('playerDied', ({ playerId, shooterId }) => {
  const killerName = getPlayerName(shooterId);
  const victimName = getPlayerName(playerId);
  appendKillFeed(`💀 <span style="color:#ff6b6b">${killerName}</span> → ${victimName}`);
  if (playerId === myId) {
    flashScreen('rgba(0,0,0,0.6)');
    showOverlay(`
      <h2 style="color:#ff6b6b">💀 You Died!</h2>
      <p style="color:var(--muted); margin-top:8px">Respawning in 3 seconds…</p>
    `);
    setTimeout(hideOverlay, 3000);
  }
});

socket.on('playerRespawned', ({ playerId }) => {
  if (playerId === myId) hideOverlay();
});

// ── Socket: Game Over ─────────────────────────────────────────────────────────
socket.on('gameOver', ({ leaderboard }) => {
  gameRunning = false;
  clearInterval(timerInterval);
  showGameOver(leaderboard);
});

// ── Socket: Room List ─────────────────────────────────────────────────────────
socket.on('roomList', ({ rooms }) => renderRoomList(rooms));
socket.on('roomListUpdated', ({ rooms }) => renderRoomList(rooms));

// ── Socket: Error ─────────────────────────────────────────────────────────────
socket.on('error', ({ message }) => {
  alert('⚠️ ' + message);
});

// ── Socket: Chat ──────────────────────────────────────────────────────────────
socket.on('chatMessage', ({ playerName, playerColor, message }) => {
  appendChat(playerName, playerColor, message);
});

// ── Connect → fetch room list ─────────────────────────────────────────────────
socket.on('connect', () => {
  socket.emit('getRooms');
  fetchStats();
});

// ── HUD ───────────────────────────────────────────────────────────────────────
function updateHUD(player) {
  if (!player) return;
  hudScore.textContent = player.score;
  hudKills.textContent = player.kills;
  const pct = Math.max(0, (player.hp / player.maxHp) * 100);
  hudHpFill.style.width = pct + '%';
  hudHpFill.style.background = pct > 50 ? 'linear-gradient(90deg,#66bb6a,#a5d6a7)'
                              : pct > 25 ? 'linear-gradient(90deg,#ffa726,#ffcc80)'
                                         : 'linear-gradient(90deg,#ef5350,#ff8a80)';
  hudHpText.textContent = `${player.hp} HP`;
}

function startTimer() {
  clearInterval(timerInterval);
  timerSec = 180;
  timerInterval = setInterval(() => {
    timerSec = Math.max(0, timerSec - 1);
    hudTimer.textContent = formatTime(timerSec);
    if (timerSec === 0) clearInterval(timerInterval);
  }, 1000);
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function updateLeaderboard(players) {
  const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 5);
  lbList.innerHTML = sorted.map((p, i) => `
    <li>
      <span class="lb-name" style="color:${p.color || '#fff'}">
        ${i + 1}. ${escHtml(p.name)}
      </span>
      <span class="lb-score">${p.score}</span>
    </li>
  `).join('');
}

// ── Kill Feed ─────────────────────────────────────────────────────────────────
function appendKillFeed(html) {
  const div = document.createElement('div');
  div.className = 'kill-entry';
  div.innerHTML = html;
  killFeed.prepend(div);
  setTimeout(() => div.remove(), 3500);
}

// ── Chat ──────────────────────────────────────────────────────────────────────
function appendChat(name, color, msg) {
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="author" style="color:${color}">${escHtml(name)}:</span> ${escHtml(msg)}`;
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

document.getElementById('chat-send')?.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); e.stopPropagation(); });
function sendChat() {
  const msg = chatInput.value.trim();
  if (!msg || !myRoomId) return;
  socket.emit('chatMessage', { roomId: myRoomId, message: msg });
  chatInput.value = '';
}

// ── Room List Rendering ───────────────────────────────────────────────────────
function renderRoomList(rooms) {
  if (!rooms || rooms.length === 0) {
    roomList.innerHTML = '<p class="empty-msg">No rooms yet. Create one!</p>';
    return;
  }
  roomList.innerHTML = rooms.map(r => `
    <div class="room-card">
      <div class="room-info">
        <div class="room-name">${escHtml(r.name)}</div>
        <div class="room-meta">Host: ${escHtml(r.hostName)} · ${r.playerCount}/${r.maxPlayers} players</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="room-status ${r.status}">${r.status === 'waiting' ? 'Open' : 'Live'}</span>
        ${r.status === 'waiting'
          ? `<button class="btn btn-success btn-sm" onclick="joinRoom('${r.id}')">Join</button>`
          : ''}
      </div>
    </div>
  `).join('');
}

window.joinRoom = function(roomId) {
  const name = playerInput.value.trim();
  if (!name) { alert('Please enter your name first!'); playerInput.focus(); return; }
  myName = name;
  socket.emit('register', { name });
  socket.once('registered', () => {
    socket.emit('joinRoom', { roomId });
  });
};

// ── Leave Game ────────────────────────────────────────────────────────────────
document.getElementById('btn-leave-game')?.addEventListener('click', leaveGame);
function leaveGame() {
  socket.emit('leaveRoom');
  gameRunning = false;
  clearInterval(timerInterval);
  switchView('lobby');
  hideOverlay();
  socket.emit('getRooms');
  fetchStats();
}

// ── Game Over Screen ──────────────────────────────────────────────────────────
function showGameOver(leaderboard) {
  const rows = leaderboard.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="color:${p.color}">${escHtml(p.name)}</td>
      <td>${p.kills}</td>
      <td>${p.deaths}</td>
      <td style="color:#ffd700;font-weight:700">${p.score}</td>
    </tr>
  `).join('');

  showOverlay(`
    <h2>🏆 Game Over!</h2>
    <table class="lb-table">
      <thead><tr><th>#</th><th>Player</th><th>Kills</th><th>Deaths</th><th>Score</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <button class="btn btn-primary" style="margin-top:16px;width:100%" onclick="leaveGame()">Back to Lobby</button>
  `);
}

// ── Canvas Rendering ──────────────────────────────────────────────────────────
function resizeCanvas() {
  canvas.width = gameView.offsetWidth;
  canvas.height = gameView.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);

function getCamera(me) {
  if (!me) return { x: 0, y: 0 };
  return {
    x: me.x - canvas.width / 2,
    y: me.y - canvas.height / 2,
  };
}

function renderLoop() {
  if (!gameRunning) return;
  const me = gameState?.players.find(p => p.id === myId);
  const cam = getCamera(me);

  // Background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Draw arena boundary
  ctx.strokeStyle = 'rgba(108,99,255,0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, mapW, mapH);

  // Draw arena grid
  drawArenaGrid(mapW, mapH, cam);

  // Draw bullets
  if (gameState?.bullets) {
    gameState.bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = b.ownerColor || '#fff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.ownerColor || '#fff';
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  // Draw players
  if (gameState?.players) {
    gameState.players.forEach(p => drawPlayer(p, p.id === myId));
  }

  ctx.restore();

  // Crosshair
  drawCrosshair(canvas.width / 2, canvas.height / 2);

  requestAnimationFrame(renderLoop);
}

function drawArenaGrid(w, h, cam) {
  const spacing = 80;
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

function drawPlayer(p, isMe) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  if (!p.isAlive) {
    // Draw ghost
    ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = p.color; ctx.fill();
    ctx.restore(); return;
  }

  // Glow
  ctx.shadowBlur = isMe ? 24 : 12;
  ctx.shadowColor = p.color;

  // Body
  ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.fill();

  // Border
  ctx.strokeStyle = isMe ? '#fff' : 'rgba(255,255,255,0.25)';
  ctx.lineWidth = isMe ? 3 : 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Gun barrel
  ctx.fillStyle = isMe ? '#fff' : 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.rect(14, -5, 16, 10);
  ctx.fill();

  ctx.restore();

  // Name tag
  ctx.font = `bold 11px Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = isMe ? '#fff' : 'rgba(255,255,255,0.7)';
  ctx.fillText(p.name, p.x, p.y - 26);

  // HP bar
  const barW = 40;
  const pct = p.hp / p.maxHp;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(p.x - barW / 2, p.y + 22, barW, 5);
  ctx.fillStyle = pct > 0.6 ? '#66bb6a' : pct > 0.3 ? '#ffa726' : '#ef5350';
  ctx.fillRect(p.x - barW / 2, p.y + 22, barW * pct, 5);
}

function drawCrosshair(cx, cy) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  const size = 12;
  ctx.beginPath();
  ctx.moveTo(cx - size, cy); ctx.lineTo(cx - 4, cy);
  ctx.moveTo(cx + 4,    cy); ctx.lineTo(cx + size, cy);
  ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy - 4);
  ctx.moveTo(cx, cy + 4);    ctx.lineTo(cx, cy + size);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function flashScreen(color) {
  const f = document.createElement('div');
  f.style.cssText = `position:fixed;inset:0;background:${color};z-index:100;pointer-events:none;`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 120);
}

// ── Input Handling ────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 't') { chatVisible = !chatVisible; chatPanel.classList.toggle('hidden', !chatVisible); if (chatVisible) chatInput.focus(); }
  if (k === 'escape') { if (gameRunning) leaveGame(); }
  if (['w','a','s','d'].includes(k)) { keys[k] = true; emitMove(); }
});
document.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (['w','a','s','d'].includes(k)) { keys[k] = false; emitMove(); }
});

canvas.addEventListener('mousemove', e => {
  if (!gameRunning) return;
  const me = gameState?.players.find(p => p.id === myId);
  if (!me) return;
  const cam = getCamera(me);
  const worldX = e.offsetX + cam.x;
  const worldY = e.offsetY + cam.y;
  const angle = Math.atan2(worldY - me.y, worldX - me.x);
  socket.emit('playerMove', { keys, angle });
});

canvas.addEventListener('click', e => {
  if (!gameRunning) return;
  const me = gameState?.players.find(p => p.id === myId);
  if (!me || !me.isAlive) return;
  const cam = getCamera(me);
  const worldX = e.offsetX + cam.x;
  const worldY = e.offsetY + cam.y;
  const angle = Math.atan2(worldY - me.y, worldX - me.x);
  socket.emit('playerShoot', { x: me.x, y: me.y, angle });
});

function emitMove() {
  if (!gameRunning) return;
  socket.emit('playerMove', { keys });
}

// Movement interval for smooth physics
setInterval(() => {
  if (gameRunning) socket.emit('playerMove', { keys });
}, 1000 / 30);

// ── Utility ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getPlayerName(id) {
  if (!gameState) return id;
  const p = gameState.players.find(p => p.id === id);
  return p ? p.name : id.slice(0, 6);
}

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const { stats } = await res.json();
    statsEl.textContent = `${stats.totalRooms} rooms · ${stats.totalPlayers} players online · ${stats.activeGames} active games`;
  } catch { statsEl.textContent = 'Server online'; }
}
