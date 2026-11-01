const AppError = require('../errors/AppError');
const userRepository = require('../repositories/userRepository');
const sessionStore = require('../session/sessionStore');
const { COOKIE_NAME } = require('../config/sessionCookie.js');

module.exports = async function requireSession(req, res, next) {
  try {
    const sessionId = req.signedCookies && req.signedCookies[COOKIE_NAME];
    if (typeof sessionId !== 'string' || !sessionId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const session = sessionStore.get(sessionId);
    if (!session) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const user = await userRepository.findPublicById(session.userId);
    if (!user) {
      // Remove sessions whose user record no longer exists.
      sessionStore.destroy(sessionId);
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    req.sessionId = sessionId;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
