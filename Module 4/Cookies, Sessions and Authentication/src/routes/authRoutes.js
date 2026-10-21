const express = require('express');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const sessionStore = require('../session/sessionStore');
const requireSession = require('../middleware/requireSession');

const router = express.Router();
const COOKIE_NAME = 'sid';
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 60 * 60 * 1000);
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

if (!Number.isSafeInteger(SESSION_TTL_MS) || SESSION_TTL_MS <= 0) {
  throw new Error('SESSION_TTL_MS must be a positive integer');
}

const cookieOptions = {
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: 'lax',
  signed: true,
  path: '/',
  maxAge: SESSION_TTL_MS,
};

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function unauthenticated(res) {
  return res.status(401).json({
    error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
  });
}

function clearSessionCookie(res) {
  const { maxAge, signed, ...clearOptions } = cookieOptions;
  res.clearCookie(COOKIE_NAME, clearOptions);
}

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password || email.length > 254 || password.length > 1024) {
      return unauthenticated(res);
    }

    const user = await userRepository.findUserByEmail(email);
    // Keep unknown-email failures on a password-comparison path too.
    const dummyPasswordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    const passwordMatches = await bcrypt.compare(
      password,
      user ? user.passwordHash : dummyPasswordHash
    );

    if (!user || !passwordMatches) return unauthenticated(res);

    const sessionId = crypto.randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + SESSION_TTL_MS;
    sessionStore.createSession(sessionId, user.id, expiresAt);

    res.cookie(COOKIE_NAME, sessionId, cookieOptions);
    return res.status(200).json({ data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireSession, async (req, res, next) => {
  try {
    const user = await userRepository.findUserById(req.session.userId);
    if (!user) {
      sessionStore.destroySession(req.sessionId);
      clearSessionCookie(res);
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      });
    }

    return res.status(200).json({ data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  try {
    const sessionId = req.signedCookies && req.signedCookies.sid;
    if (typeof sessionId === 'string' && sessionId) {
      sessionStore.destroySession(sessionId);
    }

    clearSessionCookie(res);
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
