# ✅ Multiplayer Game Server – Complete

## Live Screenshots

````carousel
![ArenaBlast Lobby – http://localhost:3000](arena_blast_lobby_1773937726323.png)
<!-- slide -->
![REST API /api/stats response](arena_blast_stats_json_1773937740125.png)
````


## Project Structure

```
c:\Users\shalu\Desktop\ibm\
├── game.db                    ← SQLite database file
├── server.js                  ← Main entry point
├── config.js                  ← All game constants
├── package.json               ← Dependencies
├── src\
│   ├── Player.js              ← Player model
│   ├── GameRoom.js            ← Room + game loop
│   ├── GameManager.js         ← Singleton manager
│   ├── socketHandler.js       ← All Socket.IO events
│   ├── db.js                  ← Database integration
│   └── routes\
│       ├── gameRoutes.js      ← REST API (5 endpoints)
│       └── authRoutes.js      ← Authentication API
└── public\
    ├── index.html             ← Lobby + Game arena UI
    ├── style.css              ← Glassmorphism dark theme
    └── game.js                ← Canvas game engine client
```

---

## How to Run

> [!IMPORTANT]
> Node.js was **not detected** on the system PATH. You need to install it first if you haven't already.

### Step 1 – Install Node.js (if not installed)
Download and install from **[nodejs.org](https://nodejs.org)** (LTS version recommended).  
After installing, **restart your terminal / PowerShell**.

### Step 2 – Install dependencies
```powershell
cd "c:\Users\shalu\Desktop\ibm"
npm install
```

### Step 3 – Start the server
```powershell
npm start
```

You should see:
```
╔══════════════════════════════════════════════╗
║    🎮  Multiplayer Game Server  🎮            ║
╠══════════════════════════════════════════════╣
║  Server  : http://localhost:3000             ║
║  API     : http://localhost:3000/api         ║
║  Health  : http://localhost:3000/health      ║
╚══════════════════════════════════════════════╝
```

### Step 4 – Play!
Open **`http://localhost:3000`** in **two browser tabs/windows**:

| Tab | Action |
|-----|--------|
| Tab 1 | Enter name → Create Room |
| Tab 2 | Enter name → Click **Join** |
| Tab 1 | Click **Start Game** |
| Both | Play! WASD move, click to shoot |

---

## REST API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/rooms` | List all active rooms |
| `POST` | `/api/rooms` | Create a room |
| `GET` | `/api/rooms/:id` | Room details + leaderboard |
| `GET` | `/api/leaderboard` | Top 10 players |
| `GET` | `/api/stats` | Server stats |
| `GET` | `/health` | Server health check |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Login with existing account |

---

## Key Features Implemented

| Feature | Details |
|---------|---------|
| **Real-time multiplayer** | Socket.IO with 60-tick game loop |
| **Game rooms** | Create, join, leave, host migration |
| **Player physics** | WASD movement, clamped to arena bounds |
| **Bullet physics** | Mouse-aim shooting, collision detection |
| **Kill/death tracking** | Score +100 per kill, auto-respawn after 3s |
| **Authentication** | User register/login with persistent state |
| **Persistent Data** | SQLite database (`game.db`) integration |
| **In-game chat** | T to toggle, real-time per room |
| **Game timer** | 3-minute matches, auto game-over |
| **Leaderboard** | Live sidebar + end-of-game modal |
| **REST API** | 7 endpoints with JSON responses |
| **Premium UI** | Dark glassmorphism, animated orbs, neon effects |
