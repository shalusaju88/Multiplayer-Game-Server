# 🎮 Multiplayer Game Server

A real-time multiplayer game server built with **Node.js**, **Express**, **Socket.IO**, and **SQLite**.

![ArenaBlast](https://img.shields.io/badge/Game-ArenaBlast-6c63ff?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)

---

## ✨ Features

- 🔐 **User Accounts** – Register and login using SQLite (passwords securely hashed with bcrypt)
- 📋 **Play History** – View your past logins and game results (kills, deaths, score)
- 🏠 **Game Rooms** – Create, join, and leave lobbies in real time
- 👥 **Multiplayer** – Up to 8 players per room
- 🎮 **Live Arena** – Top-down shooter with WASD movement + mouse aim
- 💥 **Bullet Physics** – Collision detection, damage, kill tracking
- ⚕️ **Auto Respawn** – Players respawn 3 seconds after dying
- 💬 **In-game Chat** – Per-room chat with T key
- 🏆 **Leaderboard** – Live score/kill tracking + end-of-game summary
- ⏱️ **Game Timer** – 3-minute matches with auto game-over

---

## 🚀 Getting Started (How to Run on Any System)

### Prerequisites
1. Download and install [Node.js](https://nodejs.org) (v18 or higher is recommended).
2. Download this project folder to your computer and extract it if it's a ZIP file.

### Installation

1. Open your terminal (Command Prompt or PowerShell on Windows, Terminal on Mac/Linux).
2. Navigate into the project folder using the `cd` command. For example:
   ```bash
   cd Desktop/ibm
   ```
3. Install the required Node modules:
   ```bash
   npm install
   ```

### Run the Server

1. Start the server by running:
   ```bash
   npm start
   ```
2. You should see a message saying the server is running on port 3000.
3. Open your web browser and go to **http://localhost:3000**

---

## 🎮 How to Play

| Key | Action |
|-----|--------|
| `W A S D` | Move your character |
| `Mouse` | Aim your weapon |
| `Left Click` | Shoot bullets |
| `T` | Toggle in-game chat |
| `ESC` | Leave the game |

**To play multiplayer with yourself (for testing):** 
1. Open `http://localhost:3000` in **two separate browser windows** (or one normal, one incognito).
2. **Window 1:** Register a new user, login, and **Create a Room**.
3. **Window 2:** Register a second user, login, and click **Join** on the room created by Window 1.
4. **Window 1 (host):** Click **Start Game**.

---

## 🗂️ Project Structure

```text
├── server.js              # Main entry point 
├── config.js              # Game configuration constants
├── package.json           # Dependencies
├── game.db                # Auto-generated SQLite database
├── src/
│   ├── db.js              # SQLite database layer (Login/History)
│   ├── Player.js          # Player model (position, HP, score)
│   ├── GameRoom.js        # Room + 60-tick game loop
│   ├── GameManager.js     # Singleton room/player manager
│   ├── socketHandler.js   # All Socket.IO event handlers
│   └── routes/
│       ├── authRoutes.js  # REST API (Login, Register)
│       └── gameRoutes.js  # REST API (History, Rooms, Stats)
└── public/
    ├── index.html         # Login, Lobby, and Game UI
    ├── style.css          # Dark glassmorphism theme
    └── game.js            # Canvas game engine client
```

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite3, bcryptjs
- **Real-time:** Socket.IO
- **Frontend:** Vanilla HTML/CSS/JS + Canvas API
- **Game Loop:** 60 ticks/second server-side physics

---

## 📄 License

MIT License — IBM Project
