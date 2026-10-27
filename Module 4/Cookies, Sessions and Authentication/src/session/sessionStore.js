// TODO: implement create/get/destroy around an in-memory Map.
// Store opaque session id -> { userId, expiresAt }, never credentials.
// Remove expired sessions during reads.
const sessions = new Map();

function create(sessionId, userId, ttlMs) {
  const expiresAt = Date.now() + ttlMs;
  sessions.set(sessionId, { userId, expiresAt });
  return { userId, expiresAt };
}

function get(sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return { ...session };
}

function destroy(sessionId) {
  if (typeof sessionId === 'string' && sessionId) sessions.delete(sessionId);
}

module.exports = { create, get, destroy };
