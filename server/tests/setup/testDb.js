const catalog = require('../../src/db/templateCatalog');

function databaseName(connection) {
  if (connection.database) return connection.database;
  return new URL(connection.connectionString).pathname.replace(/^\//, '');
}

/** Refuses to touch any database whose name does not clearly mark it as a test database. */
function assertTestDatabase(connection) {
  const name = databaseName(connection);
  if (!/_test$/.test(name)) {
    throw new Error(
      `Refusing to run tests against database "${name}". ` +
        'Use a dedicated database whose name ends with "_test" (TEST_DATABASE_URL or DB_NAME_TEST).',
    );
  }
}

/** Wipes all tables and reloads the sample catalog so every test starts from a known state. */
async function resetDatabase(db) {
  assertTestDatabase(db.client.config.connection);
  await db.raw('TRUNCATE favorites, users, templates RESTART IDENTITY CASCADE');
  await db('templates').insert(catalog);
}

module.exports = { assertTestDatabase, resetDatabase };
