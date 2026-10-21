const sessionStore = require('../session/sessionStore');

module.exports = function requireSession(req, res, next) {
  const sessionId = req.signedCookies && req.signedCookies.sid;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
    });
  }

  const session = sessionStore.getSession(sessionId);
  if (!session) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
    });
  }

  req.sessionId = sessionId;
  req.session = session;
  next();
};
