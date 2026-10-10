const db = require('../db/knex');

// Columns that are safe to return to clients. password_hash is never included.
const PUBLIC_COLUMNS = ['id', 'name', 'email', 'created_at'];

function findById(id) {
  return db('users').select(PUBLIC_COLUMNS).where({ id }).first();
}

/** Includes the password hash; for credential checks only, never for responses. */
function findByEmailWithHash(email) {
  return db('users').select([...PUBLIC_COLUMNS, 'password_hash']).where({ email }).first();
}

async function create({ name, email, passwordHash }) {
  const [user] = await db('users')
    .insert({ name, email, password_hash: passwordHash })
    .returning(PUBLIC_COLUMNS);
  return user;
}

module.exports = { findById, findByEmailWithHash, create };
