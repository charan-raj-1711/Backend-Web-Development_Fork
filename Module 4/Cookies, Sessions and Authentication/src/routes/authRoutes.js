const express = require('express');

const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');
const sessionStore = require('../session/sessionStore');
const requireSession = require('../middleware/requireSession');

const router = express.Router();  

const cookieOptions = {
  httpOnly: true,
  signed: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  path: '/',
  maxAge: Number(process.env.SESSION_TTL_MS || 3600000),
};

router.post('/login', async (req, res, next) => {
  // TODO: validate credentials, create a server session, and set signed `sid` cookie.
  try {
    const { email, password } = req.body || {}; 

    if(
      typeof email !== 'string' || 
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res. status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Email and password are required',
        },
      });
    }
      const user = await prisma.user.findUnique({
        where: {email: email.trim().toLowerCase() },
      });

      if(!user || !(await bcrypt.compare(password, user.passwordHash))){
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message:  'Invalid emaail or password',
          },
        });
      }

      const session = sessionStore.create(user.id);

      res.cookie('sid', session.id, cookieOptions);

      return res.status(200).json({
        data: {
          user:{
            id: user.id,
            name: user.name,
            email: user.email,
          },
        },
      });
  } catch(error) {
    next(error);
  }
  // res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Implement login' } });
});

router.get('/me', requireSession, async (req, res, next) => {
  // TODO: resolve signed cookie through the server-side session store.
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email:true,
      },
    });

    if(!user){
      sessionStore.destroy(req.signedCookies.sid);
      return res.status(401).json({
        error:{
          code: UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
    }
    return res.status(200).json({
      data: {user},
    });
  } catch(error) {
    next(error);
  }
  // res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Implement protected identity' } });
});

router.post('/logout', async (req, res, next) => {
  // TODO: destroy server session and clear cookie using matching options.
  try{
    const sessionId = req.signedCookies.sid; 

    if(typeof sessionId === 'string') {
      sessionStore.destroy(sessionId);
    }

    res.clearCookie('sid', {
      httpOnly: cookieOptions.httpOnly,
      signed: cookieOptions.signed,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
    });

    return res.status(204).json({
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch(error){
    next(error);
  }
  // res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Implement logout' } });
});

module.exports = router;
