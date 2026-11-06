'use strict';
// middleware/rateLimiter.js
//
// YOUR TASK: replace this pass-through with a real rate limiter.
//
// Right now this middleware lets EVERY request through, so the login route can be
// brute-forced without limit. Build a strict limiter with `express-rate-limit`
// (already in package.json) that is exported as the middleware used by the three
// auth routes in src/routes/auth.js.
//
// Requirements (checked by the tests):
//   - windowMs: 15 minutes
//   - max: 5 attempts per window per IP
//   - after the limit, respond with 429 and a `Retry-After` header
//   - standardHeaders: true, legacyHeaders: false
//   - (recommended) skipSuccessfulRequests: true so only FAILED attempts count
//
// Also add a COMMENT explaining how a Redis-backed store (rate-limit-redis) would
// replace the default in-memory store in a multi-instance deployment, and why the
// in-memory store is not enough when several instances run behind a load balancer.
//
// Hint: express-rate-limit returns a middleware function — export it directly:
//   const rateLimit = require('express-rate-limit');
//   module.exports = rateLimit({ ...options });

// module.exports = (req, res, next) => next(); // TODO: replace this stub

const { rateLimit } = require('express-rate-limit');

const authLimiter = rateLimit({
  // Allow 5 attempts within 15 minutes per IP address
  windowMs: 15 * 60 * 1000,
  max: 5,

  // Use standard rate-limit headers
  standardHeaders: true,
  legacyHeaders: false,

  // Do not count successful requests
  skipSuccessfulRequests: true,

  // Return 429 with the Retry-After header
  handler: (req, res, next, options) => {
    const resetTime = req.rateLimit?.resetTime;

    const retryAfter = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : Math.ceil(options.windowMs / 1000);

    res.setHeader('Retry-After', String(retryAfter));

    res.status(429).json({
      message: 'Too many requests. Please try again later.',
    });
  },

  // In a multi-instance deployment, use rate-limit-redis as the
  // rate limiter's shared store. All application instances should
  // connect to the same Redis database so they share rate-limit
  // counters. The default in-memory store is not sufficient because
  // each instance maintains separate counters, allowing requests
  // distributed by a load balancer to bypass the intended limit.
});

module.exports = authLimiter;