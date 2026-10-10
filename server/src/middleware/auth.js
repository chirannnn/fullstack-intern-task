const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../services/token.service');
const userService = require('../services/user.service');

function extractBearerToken(req) {
  const header = req.get('authorization');
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw ApiError.unauthorized('Authorization header must use the Bearer scheme');
  }
  return token;
}

async function resolveUser(token) {
  const userId = verifyToken(token);
  const user = await userService.findById(userId);
  // The token may outlive the account it was issued for.
  if (!user) throw ApiError.unauthorized('Invalid token');
  return user;
}

/** Rejects the request unless it carries a valid token for an existing user. */
async function requireAuth(req, _res, next) {
  const token = extractBearerToken(req);
  if (!token) throw ApiError.unauthorized();
  req.user = await resolveUser(token);
  next();
}

/**
 * Attaches `req.user` when a valid token is present, but never rejects. Used on public
 * endpoints that can personalise their response (e.g. favorite state in the catalog).
 */
async function optionalAuth(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (token) req.user = await resolveUser(token);
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    // Invalid or expired tokens are ignored here; protected routes will reject them.
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
