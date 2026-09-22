const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { setSessionCookie, clearSessionCookie, optionalAuth } = require('../middleware/auth');
const { sendMagicLink } = require('../services/email');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/request-link  { email, redirect? }
 * Emails a one-time, short-lived sign-in link. The link itself is a signed
 * JWT (type "magic") so no server-side token storage is needed — anyone
 * without the JWT secret cannot forge one, and it expires automatically.
 */
router.post('/request-link', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const redirect = typeof req.body.redirect === 'string' ? req.body.redirect : '/';

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'invalid_email', message: 'Please enter a valid email address.' });
  }

  const magicToken = jwt.sign({ email, type: 'magic' }, config.jwtSecret, {
    expiresIn: `${config.magicLinkExpiryMinutes}m`
  });

  const link = `${config.baseUrl}/auth-callback.html?token=${encodeURIComponent(magicToken)}&redirect=${encodeURIComponent(redirect)}`;

  try {
    const result = await sendMagicLink(email, link);
    res.json({
      ok: true,
      message: 'Check your email for a sign-in link.',
      // In dev mode (no SMTP configured) we also return the link directly so
      // you can test the flow without setting up email. Remove this in prod.
      devLink: result.devMode ? link : undefined
    });
  } catch (err) {
    console.error('Failed to send magic link:', err);
    res.status(500).json({ error: 'send_failed', message: 'Could not send the sign-in email. Please try again.' });
  }
});

/**
 * GET /api/auth/verify?token=...
 * Called by auth-callback.html after the user clicks the emailed link.
 * Verifies the one-time token and issues a long-lived session cookie.
 */
router.get('/verify', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'missing_token' });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.type !== 'magic' || !payload.email) {
      return res.status(400).json({ error: 'invalid_token' });
    }
    setSessionCookie(res, payload.email);
    res.json({ ok: true, email: payload.email });
  } catch (err) {
    res.status(400).json({ error: 'expired_or_invalid', message: 'This sign-in link has expired or already been used. Request a new one.' });
  }
});

/** GET /api/auth/me — who is currently logged in, if anyone. */
router.get('/me', optionalAuth, (req, res) => {
  if (!req.userEmail) return res.json({ authenticated: false });
  res.json({ authenticated: true, email: req.userEmail });
});

/** POST /api/auth/logout */
router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

module.exports = router;
