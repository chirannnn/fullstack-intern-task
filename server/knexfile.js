const path = require('node:path');
const config = require('./src/config/env');

const shared = {
  client: 'pg',
  connection: config.database,
  pool: { min: 0, max: config.isProduction ? 10 : 5 },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
  },
};

// Knex CLI picks the block matching NODE_ENV; the config itself is already env-aware.
module.exports = {
  development: shared,
  test: shared,
  production: shared,
};
