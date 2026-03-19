'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password)
    return res.status(400).json({ success: false, error: 'name and password are required' });
  if (name.trim().length < 2)
    return res.status(400).json({ success: false, error: 'Name must be at least 2 characters' });
  if (password.length < 4)
    return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });

  const result = await db.registerPlayer(name, password);
  if (!result.success)
    return res.status(400).json({ success: false, error: result.error });

  res.status(201).json({ success: true, message: `Account created for "${name.trim()}"` });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password)
    return res.status(400).json({ success: false, error: 'name and password are required' });

  const result = await db.loginPlayer(name, password);
  if (!result.success)
    return res.status(401).json({ success: false, error: result.error });

  // Record login event
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  db.recordLogin(result.player.name, ip);

  res.json({ success: true, player: result.player });
});

module.exports = router;
