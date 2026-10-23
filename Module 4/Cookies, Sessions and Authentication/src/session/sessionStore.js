const crypto = require('crypto');
const sessions = new Map();
const sessionTtlMs = Number(process.env.SESSION_TTL_MS || 3600000);

// TODO: implement create/get/destroy around an in-memory Map.
// Store opaque session id -> { userId, expiresAt }, never credentials.
// Remove expired sessions during reads.
function create(userId){
    const id = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + sessionTtlMs;

    sessions.set(id, {
        userId,
        expiresAt
    });
    return {
        id,
        expiresAt,
    };
}

function get(id){
    if(!id){
        return null;
    }
    const session = sessions.get(id);

    if(!session){
        return null;
    }

    if(session.expiresAt <= Date.now()){
        sessions.delete(id);
        return null;
    }
    return session;
}

function destroy(id){
    if(id){
        sessions.delete(id);
    }
}

module.exports = {
    create,
    get,
    destroy
};
