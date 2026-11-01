const crypto = require('node:crypto');
const express = require('express');
const { verifyCredentials } = require('../services/authServices');
const sessionStore = require('../session/sessionStore');
const requireSession = require('../middleware/requireSession');
const { COOKIE_NAME, ttlMs, cookieOptions, clearCookieOptions } = require('../config/sessionCookie.js');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  // TODO: validate credentials, create a server session, and set signed `sid` cookie.
  try {
    const user = await verifyCredentials(req.body || {});
    // The browser receives only this random opaque identifier, never the user data.
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessionStore.create(sessionId, user.id, ttlMs);
    res.cookie(COOKIE_NAME, sessionId, { ...cookieOptions, signed: true });
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
  // res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Implement login' } });
});

router.get('/me', requireSession, async (req, res, next) => {
  // TODO: resolve signed cookie through the server-side session store.
  res.status(200).json({ user: req.user });
  // res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Implement protected identity' } });
});

router.post('/logout', async (req, res, next) => {
  // TODO: destroy server session and clear cookie using matching options.
  try {
    const sessionId = req.signedCookies && req.signedCookies[COOKIE_NAME];
    if (typeof sessionId === 'string' && sessionId) sessionStore.destroy(sessionId);
    res.clearCookie(COOKIE_NAME, clearCookieOptions);
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
  // res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Implement logout' } });
});

module.exports = router;
