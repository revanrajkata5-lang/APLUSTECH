const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../db');

const router = express.Router();

// Basic email sanity check — not exhaustive, just catches typos/garbage.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_SERVICES = new Set([
  'Website', 'SEO', 'Ads', 'App', 'Software', 'Geofencing', 'Other', '',
]);

// Limit lead submissions per IP to stop the public form being used to spam the DB.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again later.' },
});

// POST /api/leads — public, called from the site's contact form.
router.post('/', submitLimiter, async (req, res) => {
  const { name, email, phone, service, message } = req.body || {};

  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
  const cleanService = typeof service === 'string' ? service.trim() : '';
  const cleanMessage = typeof message === 'string' ? message.trim() : '';

  if (!cleanName || cleanName.length > 200) {
    return res.status(400).json({ error: 'Please provide a valid name.' });
  }
  if (!cleanEmail || !EMAIL_RE.test(cleanEmail) || cleanEmail.length > 320) {
    return res.status(400).json({ error: 'Please provide a valid email.' });
  }
  if (cleanPhone.length > 40) {
    return res.status(400).json({ error: 'Phone number looks too long.' });
  }
  if (!VALID_SERVICES.has(cleanService)) {
    return res.status(400).json({ error: 'Invalid service selection.' });
  }
  if (cleanMessage.length > 5000) {
    return res.status(400).json({ error: 'Message is too long.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO leads (name, email, phone, service_interest, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [
        cleanName,
        cleanEmail,
        cleanPhone || null,
        cleanService || null,
        cleanMessage || null,
      ]
    );
    return res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Failed to insert lead:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
