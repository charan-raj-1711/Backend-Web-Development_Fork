const sessions = new Map();

function createSession(sessionId, userId, expiresAt) {
  sessions.set(sessionId, { userId, expiresAt });
}

function getSession(sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return { userId: session.userId, expiresAt: session.expiresAt };
}

function destroySession(sessionId) {
  if (typeof sessionId === 'string' && sessionId) {
    sessions.delete(sessionId);
  }
}

module.exports = { createSession, getSession, destroySession };
