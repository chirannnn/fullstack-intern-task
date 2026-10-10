const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

const { secret, expiresIn, issuer, audience } = config.jwt;

function signToken(userId) {
  return jwt.sign({}, secret, {
    algorithm: 'HS256',
    subject: String(userId),
    expiresIn,
    issuer,
    audience,
  });
}

/** Verifies signature, expiry, issuer and audience, and returns the numeric user id. */
function verifyToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ['HS256'], issuer, audience });
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token';
    throw ApiError.unauthorized(message);
  }

  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw ApiError.unauthorized('Invalid token');
  }
  return userId;
}

module.exports = { signToken, verifyToken };
