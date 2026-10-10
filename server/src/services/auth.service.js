const bcrypt = require('bcryptjs');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const { isUniqueViolation } = require('../db/errors');
const userService = require('./user.service');
const { signToken } = require('./token.service');

const INVALID_CREDENTIALS = 'Invalid email or password';
// Compared against when the email is unknown so both failure paths take similar time.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-password', config.bcryptRounds);

function toSession(user) {
  const { password_hash: _omit, ...publicUser } = user;
  return { user: publicUser, token: signToken(publicUser.id) };
}

async function register({ name, email, password }) {
  if (await userService.findByEmailWithHash(email)) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  try {
    const user = await userService.create({ name, email, passwordHash });
    return toSession(user);
  } catch (err) {
    // Two concurrent registrations can both pass the check above; the DB constraint decides.
    if (isUniqueViolation(err)) throw ApiError.conflict('An account with this email already exists');
    throw err;
  }
}

async function login({ email, password }) {
  const user = await userService.findByEmailWithHash(email);
  const passwordMatches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }
  return toSession(user);
}

module.exports = { register, login };
