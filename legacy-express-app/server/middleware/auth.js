const jwt = require('jsonwebtoken');
const config = require('../config');

const SESSION_COOKIE = 'agrovista_session';

function signSessionToken(email) {
  return jwt.sign({ email, type: 'session' }, config.jwtSecret, {
    expiresIn: `${config.sessionExpiryDays}d`
  });
}

function setSessionCookie(res, email) {
  const token = signSessionToken(email);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: config.sessionExpiryDays * 24 * 60 * 60 * 1000
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE);
}

/** Attaches req.userEmail if a valid session cookie is present, else leaves it undefined. */
function optionalAuth(req, res, next) {
  const token = req.cookies && req.cookies[SESSION_COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      if (payload.type === 'session' && payload.email) {
        req.userEmail = payload.email;
      }
    } catch (e) {
      // invalid/expired token — treat as logged out
    }
  }
  next();
}

/** Rejects the request with 401 unless a valid session cookie is present. */
function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.userEmail) {
      return res.status(401).json({ error: 'not_authenticated', message: 'Please sign in with your email to continue.' });
    }
    next();
  });
}

module.exports = {
  SESSION_COOKIE,
  signSessionToken,
  setSessionCookie,
  clearSessionCookie,
  optionalAuth,
  requireAuth
};
