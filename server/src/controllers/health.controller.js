const db = require('../db/knex');

async function health(_req, res) {
  let database = 'up';
  try {
    await db.raw('select 1');
  } catch {
    database = 'down';
  }

  const ok = database === 'up';
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    database,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

module.exports = { health };
