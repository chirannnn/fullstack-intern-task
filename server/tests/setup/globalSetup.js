module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test';
  const knex = require('knex');
  const knexfile = require('../../knexfile');
  const { assertTestDatabase } = require('./testDb');

  assertTestDatabase(knexfile.test.connection);

  const db = knex(knexfile.test);
  try {
    await db.migrate.latest();
  } catch (err) {
    throw new Error(
      `Could not prepare the test database (${err.code || err.message}). ` +
        'Create it first (e.g. `createdb template_store_test`) and check TEST_DATABASE_URL / DB_* settings.',
      { cause: err },
    );
  } finally {
    await db.destroy();
  }
};
