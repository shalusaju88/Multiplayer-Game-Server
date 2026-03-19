-- 🎮 ArenaBlast Multiplayer Game Server Database Schema
-- This file defines the SQLite schema used in src/db.js
-- It serves as documentation for the database architecture.

-- ─────────────────────────────────────────────────────────────────
-- 1. Registered Player Accounts
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────
-- 2. Login History Tracking
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_history (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name  TEXT    NOT NULL,
    ip_address   TEXT,
    logged_in_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────
-- 3. End of Game Results History
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT    NOT NULL,
    room_name   TEXT,
    kills       INTEGER DEFAULT 0,
    deaths      INTEGER DEFAULT 0,
    score       INTEGER DEFAULT 0,
    played_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Useful queries for manual database inspection:
-- SELECT * FROM players ORDER BY created_at DESC;
-- SELECT player_name, MAX(score) as high_score FROM game_history GROUP BY player_name ORDER BY high_score DESC;
