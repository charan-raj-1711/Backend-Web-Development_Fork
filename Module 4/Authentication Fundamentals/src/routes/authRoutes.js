const express = require('express');
const router = express.Router();
const authontroller = require('../controllers/authControllers');

// router.post('/register', async (req, res, next) => {
//   // TODO: validate, hash, persist, and return a safe 201 response.
//   return res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Implement registration' } });
// });
router.post('/register', authontroller.register);

// router.post('/login', async (req, res, next) => {
//   // TODO: verify credentials and return the required generic failure response.
//   return res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Implement login' } });
// });
router.post('/login', authontroller.login);

module.exports = router;
