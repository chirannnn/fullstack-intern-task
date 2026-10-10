const config = require('../config/env');

// Minimal structured logger. Callers must never pass request bodies, headers,
// passwords or tokens — only the fields they explicitly choose to log.
function write(level, message, meta) {
  // Keep test output clean; set LOG_TEST_ERRORS=true to debug a failing test.
  if (config.isTest && !(level === 'error' && process.env.LOG_TEST_ERRORS === 'true')) return;

  const entry = { level, time: new Date().toISOString(), message, ...meta };
  const line = config.isProduction ? JSON.stringify(entry) : `[${level}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`;
  (level === 'error' ? console.error : console.log)(line);
}

module.exports = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};
