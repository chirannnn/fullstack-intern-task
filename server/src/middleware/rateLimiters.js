const { rateLimit } = require('express-rate-limit');
const config = require('../config/env');

const rateLimitBody = (message) => ({ error: { code: 'RATE_LIMITED', message } });

/** Throttles credential endpoints to slow down brute-force and credential-stuffing attempts. */
const authLimiter = rateLimit({
  windowMs: config.authRateLimit.windowMs,
  limit: config.authRateLimit.max,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: rateLimitBody('Too many authentication attempts. Please try again later.'),
});

/** A generous ceiling for the whole API. */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.isTest ? 10_000 : 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: rateLimitBody('Too many requests. Please slow down.'),
});

module.exports = { authLimiter, apiLimiter };
