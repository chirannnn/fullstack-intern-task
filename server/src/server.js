let config;
try {
  config = require('./config/env');
} catch (err) {
  // Configuration problems are fatal: refuse to start rather than run insecurely.
  console.error(`[config] ${err.message}`);
  process.exit(1);
}

const logger = require('./utils/logger');
const db = require('./db/knex');
const { createApp } = require('./app');

async function start() {
  try {
    await db.raw('select 1');
  } catch (err) {
    logger.error('Could not connect to PostgreSQL. Check DATABASE_URL / DB_* settings and that the server is running.', {
      reason: err.code || err.message,
    });
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`API listening on port ${config.port}`, { env: config.env });
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await db.destroy();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
