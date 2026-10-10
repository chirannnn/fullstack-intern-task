const ApiError = require('../utils/ApiError');
const config = require('../config/env');
const logger = require('../utils/logger');

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));
}

// Express recognises error handlers by their four-argument signature.
function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.details) body.error.details = err.details;
    return res.status(err.status).json(body);
  }

  // Errors raised by body-parser (malformed JSON, oversized payloads).
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
  }

  logger.error('Unhandled error', {
    method: req.method,
    path: req.path,
    message: err.message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isProduction ? 'Something went wrong' : err.message || 'Something went wrong',
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
