# 🎮 Multiplayer Game Server

A real-time multiplayer game server built with **Node.js**, **Express**, and **Socket.IO**.

![ArenaBlast](https://img.shields.io/badge/Game-ArenaBlast-6c63ff?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)

---

## ✨ Features

- 🏠 **Game Rooms** – Create, join, and leave lobbies in real time
- 👥 **Multiplayer** – Up to 8 players per room
- 🎮 **Live Arena** – Top-down shooter with WASD movement + mouse aim
- 💥 **Bullet Physics** – Collision detection, damage, kill tracking
- ⚕️ **Auto Respawn** – Players respawn 3 seconds after dying
- 💬 **In-game Chat** – Per-room chat with T key
- 🏆 **Leaderboard** – Live score/kill tracking + end-of-game summary
- ⏱️ **Game Timer** – 3-minute matches with auto game-over
- 📡 **REST API** – 5 JSON endpoints for rooms, stats & leaderboard

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) v18 or higher

### Installation

```bash
git clone https://github.com/shalusaju88/Multiplayer-Game-Server.git
cd Multiplayer-Game-Server
npm install
```

### Run the Server

```bash
npm start
```

Open your browser at **http://localhost:3000**

---

## 🎮 How to Play

| Key | Action |
|-----|--------|
| `W A S D` | Move your character |
| `Mouse` | Aim your weapon |
| `Left Click` | Shoot bullets |
| `T` | Toggle in-game chat |
| `ESC` | Leave the game |

**To play multiplayer:** Open `http://localhost:3000` in **two browser tabs**:
1. Tab 1 → Enter name → **Create Room**
2. Tab 2 → Enter name → **Join** the room
3. Tab 1 (host) → Click **Start Game**

---

## 📡 REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rooms` | List all active rooms |
| `POST` | `/api/rooms` | Create a new room |
| `GET` | `/api/rooms/:id` | Get room details & leaderboard |
| `GET` | `/api/leaderboard` | Top 10 players by score |
| `GET` | `/api/stats` | Server stats (rooms, players) |
| `GET` | `/health` | Server health check |

---

## 🗂️ Project Structure

```
├── server.js              # Main entry point (Express + Socket.IO)
├── config.js              # Game configuration constants
├── package.json
├── src/
│   ├── Player.js          # Player model (position, HP, score)
│   ├── GameRoom.js        # Room + 60-tick game loop
│   ├── GameManager.js     # Singleton room/player manager
│   ├── socketHandler.js   # All Socket.IO event handlers
│   └── routes/
│       └── gameRoutes.js  # REST API routes
└── public/
    ├── index.html         # Lobby + Game arena UI
    ├── style.css          # Dark glassmorphism theme
    └── game.js            # Canvas game engine client
```

---

## ⚙️ Configuration

Edit `config.js` to change game settings:

```js
MAX_PLAYERS_PER_ROOM: 8
GAME_DURATION: 3 * 60 * 1000   // 3 minutes
PLAYER_SPEED: 4
PLAYER_HP: 100
BULLET_DAMAGE: 20
```

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Real-time:** Socket.IO
- **Frontend:** Vanilla HTML/CSS/JS + Canvas API
- **Game Loop:** 60 ticks/second server-side physics

---

## 📄 License

MIT License — IBM Project
