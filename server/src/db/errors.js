// PostgreSQL SQLSTATE codes we translate into HTTP responses.
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

const isUniqueViolation = (err) => err?.code === PG_UNIQUE_VIOLATION;
const isForeignKeyViolation = (err) => err?.code === PG_FOREIGN_KEY_VIOLATION;

module.exports = { isUniqueViolation, isForeignKeyViolation };
