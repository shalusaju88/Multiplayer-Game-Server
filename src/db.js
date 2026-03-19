'use strict';
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt  = require('bcryptjs');

// ── Open / create database file ──────────────────────────────────────────────
const DB_PATH = path.join(__dirname, '..', 'game.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('[DB] Open error:', err.message);
  else     console.log('[DB] Connected to game.db (SQLite)');
});

// ── Schema ────────────────────────────────────────────────────────────────────
function initDB() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Registered player accounts
      db.run(`
        CREATE TABLE IF NOT EXISTS players (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          name          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
          password_hash TEXT    NOT NULL,
          created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Every login event
      db.run(`
        CREATE TABLE IF NOT EXISTS login_history (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          player_name  TEXT    NOT NULL,
          ip_address   TEXT,
          logged_in_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Per-player results for every completed game
      db.run(`
        CREATE TABLE IF NOT EXISTS game_history (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          player_name TEXT    NOT NULL,
          room_name   TEXT,
          kills       INTEGER DEFAULT 0,
          deaths      INTEGER DEFAULT 0,
          score       INTEGER DEFAULT 0,
          played_at   DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else {
          console.log('[DB] Tables ready');
          resolve();
        }
      });
    });
  });
}

// ── Player accounts ───────────────────────────────────────────────────────────

/** Register a new player. Returns { success, error }. */
async function registerPlayer(name, password) {
  const hash = await bcrypt.hash(password, 10);
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO players (name, password_hash) VALUES (?, ?)`,
      [name.trim(), hash],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            resolve({ success: false, error: 'Name already taken' });
          } else {
            resolve({ success: false, error: err.message });
          }
        } else {
          resolve({ success: true, id: this.lastID });
        }
      }
    );
  });
}

/** Verify credentials. Returns { success, player, error }. */
async function loginPlayer(name, password) {
  return new Promise((resolve) => {
    db.get(
      `SELECT * FROM players WHERE name = ? COLLATE NOCASE`,
      [name.trim()],
      async (err, row) => {
        if (err)  return resolve({ success: false, error: err.message });
        if (!row) return resolve({ success: false, error: 'Player not found' });

        const match = await bcrypt.compare(password, row.password_hash);
        if (!match) return resolve({ success: false, error: 'Wrong password' });

        resolve({ success: true, player: { id: row.id, name: row.name, createdAt: row.created_at } });
      }
    );
  });
}

// ── History helpers ──────────────────────────────────────────────────────────

/** Record a login event (called on socket register or REST login). */
function recordLogin(playerName, ipAddress) {
  db.run(
    `INSERT INTO login_history (player_name, ip_address) VALUES (?, ?)`,
    [playerName, ipAddress || 'unknown'],
    (err) => { if (err) console.error('[DB] recordLogin error:', err.message); }
  );
}

/** Persist end-of-game stats for one player. */
function recordGameResult({ playerName, roomName, kills, deaths, score }) {
  db.run(
    `INSERT INTO game_history (player_name, room_name, kills, deaths, score)
     VALUES (?, ?, ?, ?, ?)`,
    [playerName, roomName, kills || 0, deaths || 0, score || 0],
    (err) => { if (err) console.error('[DB] recordGameResult error:', err.message); }
  );
}

/** Get login history for a player (newest first, limit 50). */
function getLoginHistory(playerName) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, ip_address, logged_in_at
       FROM   login_history
       WHERE  player_name = ? COLLATE NOCASE
       ORDER  BY logged_in_at DESC
       LIMIT  50`,
      [playerName],
      (err, rows) => { if (err) reject(err); else resolve(rows); }
    );
  });
}

/** Get game history for a player (newest first, limit 50). */
function getGameHistory(playerName) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, room_name, kills, deaths, score, played_at
       FROM   game_history
       WHERE  player_name = ? COLLATE NOCASE
       ORDER  BY played_at DESC
       LIMIT  50`,
      [playerName],
      (err, rows) => { if (err) reject(err); else resolve(rows); }
    );
  });
}

module.exports = { initDB, registerPlayer, loginPlayer, recordLogin, recordGameResult, getLoginHistory, getGameHistory };
