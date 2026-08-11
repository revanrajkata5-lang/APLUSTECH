const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const { requireAdmin, COOKIE_NAME } = require('../middleware/auth');

const router = express.Router();

const VALID_STATUSES = new Set(['new', 'contacted', 'won', 'lost']);

// Slow down brute-force login attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
  path: '/',
};

// POST /api/admin/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash FROM admin_users WHERE email = $1',
      [String(email).toLowerCase().trim()]
    );
    const user = result.rows[0];

    // Compare against a dummy hash even when the user doesn't exist, so
    // response timing doesn't reveal which emails are registered.
    const hashToCheck = user ? user.password_hash : '$2a$12$invalidsaltinvalidsaltin.invalidhashinvalidhashinvalidhas';
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie(COOKIE_NAME, token, cookieOptions);
    return res.json({ ok: true, email: user.email });
  } catch (err) {
    console.error('Login failed:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: 0 });
  res.json({ ok: true });
});

// GET /api/admin/me — lets the dashboard check whether the session is still valid.
router.get('/me', requireAdmin, (req, res) => {
  res.json({ email: req.admin.email });
});

// GET /api/admin/leads — protected, returns all leads newest first.
router.get('/leads', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, service_interest, message, status, created_at
       FROM leads ORDER BY created_at DESC`
    );
    res.json({ leads: result.rows });
  } catch (err) {
    console.error('Failed to fetch leads:', err);
    res.status(500).json({ error: 'Failed to fetch leads.' });
  }
});

// PATCH /api/admin/leads/:id — protected, updates a lead's status.
router.patch('/leads/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid lead id.' });
  }
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: `Status must be one of: ${[...VALID_STATUSES].join(', ')}` });
  }

  try {
    const result = await pool.query(
      'UPDATE leads SET status = $1 WHERE id = $2 RETURNING id',
      [status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to update lead:', err);
    res.status(500).json({ error: 'Failed to update lead.' });
  }
});

module.exports = router;
