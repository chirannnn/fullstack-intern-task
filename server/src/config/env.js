const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

const PLACEHOLDER_SECRETS = new Set([
  'change-me',
  'replace-with-a-long-random-secret',
  'your-jwt-secret',
]);

function readInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be an integer (received "${raw}").`);
  }
  return value;
}

function readBool(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (isTest) return secret || 'test-only-secret-that-is-at-least-32-characters-long';

  if (!secret) {
    throw new Error('JWT_SECRET is required. Copy server/.env.example to server/.env and set it.');
  }
  if (isProduction && (secret.length < 32 || PLACEHOLDER_SECRETS.has(secret))) {
    throw new Error('JWT_SECRET must be a unique, random value of at least 32 characters in production.');
  }
  return secret;
}

function resolveCorsOrigins() {
  const raw = process.env.CORS_ORIGIN || (isProduction ? '' : 'http://localhost:5173');
  const origins = raw
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (isProduction && origins.length === 0) {
    throw new Error('CORS_ORIGIN is required in production (e.g. https://your-app.vercel.app).');
  }
  return origins;
}

function resolveDatabase() {
  const ssl = readBool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false;
  const url = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

  if (url) return { connectionString: url, ssl };

  if (isProduction) {
    throw new Error('DATABASE_URL is required in production.');
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: readInt('DB_PORT', 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: isTest
      ? process.env.DB_NAME_TEST || 'template_store_test'
      : process.env.DB_NAME || 'template_store',
    ssl,
  };
}

const config = Object.freeze({
  env: NODE_ENV,
  isProduction,
  isTest,
  port: readInt('PORT', 4000),
  trustProxy: readInt('TRUST_PROXY', 0),
  corsOrigins: resolveCorsOrigins(),
  jwt: Object.freeze({
    secret: resolveJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    issuer: 'template-store-api',
    audience: 'template-store-client',
  }),
  bcryptRounds: isTest ? 4 : readInt('BCRYPT_ROUNDS', 12),
  database: resolveDatabase(),
  authRateLimit: Object.freeze({
    windowMs: readInt('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    // Tests register many users from one IP; keep the limiter active but out of the way.
    max: isTest ? 1000 : readInt('AUTH_RATE_LIMIT_MAX', 20),
  }),
});

module.exports = config;
