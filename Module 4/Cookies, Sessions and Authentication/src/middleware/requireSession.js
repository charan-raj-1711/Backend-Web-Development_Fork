const sessionStore = require('../session/sessionStore');

// TODO: read req.signedCookies.sid, resolve the server session,
// attach identity to the request, and return generic 401 when invalid.
module.exports = function requireSession(req, res, next) {
  const sessionId = req.signedCookies.sid;

  // Missing or invalid signed cookie
  if(!sessionId){
    return res.status(401).json({
      error:{
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  // Find the session stored on the server
  const session = sessionStore.get(sessionId);

  // Session does not exist or has expired
  if(!session){
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }
  
  // Make the authenticated user's ID available to the route
  req.userId = session.userId;
  next();
};
