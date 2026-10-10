const logger = require('../utils/logger');

/** Logs method, path, status and duration only — never headers, bodies or query strings. */
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info('request', {
      method: req.method,
      // originalUrl keeps the mount prefix; the query string is dropped on purpose.
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs),
    });
  });
  next();
}

module.exports = requestLogger;
