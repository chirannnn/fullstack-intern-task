const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../src/db/knex');
const config = require('../src/config/env');
const { resetDatabase } = require('./setup/testDb');
const { api, registerUser, bearer } = require('./helpers');

beforeEach(() => resetDatabase(db));
afterAll(() => db.destroy());

const validUser = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'Analytical1' };

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token without the password hash', async () => {
    const res = await api().post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ id: expect.any(Number), name: 'Ada Lovelace', email: 'ada@example.com' });
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(JSON.stringify(res.body)).not.toContain(validUser.password);
  });

  it('normalizes the email address', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ ...validUser, email: '  Ada@Example.COM ' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ada@example.com');
  });

  it('stores a bcrypt hash instead of the plain password', async () => {
    await api().post('/api/auth/register').send(validUser);
    const row = await db('users').where({ email: validUser.email }).first();

    expect(row.password_hash).not.toBe(validUser.password);
    expect(row.password_hash).toMatch(/^\$2[aby]\$/);
    await expect(bcrypt.compare(validUser.password, row.password_hash)).resolves.toBe(true);
  });

  it('rejects a duplicate email, regardless of case', async () => {
    await api().post('/api/auth/register').send(validUser);
    const res = await api()
      .post('/api/auth/register')
      .send({ ...validUser, email: 'ADA@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: 'CONFLICT', message: expect.any(String) });
    expect(await db('users').count({ n: '*' }).first()).toEqual({ n: '1' });
  });

  it.each([
    ['missing name', { email: 'a@example.com', password: 'Password1' }, 'name'],
    ['invalid email', { ...validUser, email: 'not-an-email' }, 'email'],
    ['short password', { ...validUser, password: 'Ab1' }, 'password'],
    ['password without a number', { ...validUser, password: 'Passwordonly' }, 'password'],
    ['password longer than 72 chars', { ...validUser, password: `A1${'x'.repeat(71)}` }, 'password'],
  ])('rejects invalid input: %s', async (_label, body, field) => {
    const res = await api().post('/api/auth/register').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ field })]));
  });

  it('rejects malformed JSON with a consistent error body', async () => {
    const res = await api().post('/api/auth/register').set('Content-Type', 'application/json').send('{"name":');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => api().post('/api/auth/register').send(validUser));

  it('returns a signed JWT for valid credentials', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'ADA@example.com', password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user).not.toHaveProperty('password_hash');

    const payload = jwt.verify(res.body.data.token, config.jwt.secret);
    expect(payload).toMatchObject({ sub: String(res.body.data.user.id), iss: config.jwt.issuer, aud: config.jwt.audience });
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it('rejects a wrong password', async () => {
    const res = await api().post('/api/auth/login').send({ email: validUser.email, password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
  });

  it('rejects an unknown email with the same message', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Whatever1' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('validates the login payload', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'ada@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'password' })]));
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const { token, user } = await registerUser({ name: 'Grace Hopper' });
    const res = await api().get('/api/auth/me').set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ id: user.id, name: 'Grace Hopper' });
    expect(res.body.data.user).not.toHaveProperty('password_hash');
  });

  it('rejects requests without a token', async () => {
    const res = await api().get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a malformed Authorization header', async () => {
    const res = await api().get('/api/auth/me').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
  });

  it('rejects a token with an invalid signature', async () => {
    const { user } = await registerUser();
    const forged = jwt.sign({}, 'some-other-secret', {
      subject: String(user.id),
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    const res = await api().get('/api/auth/me').set(bearer(forged));
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid token');
  });

  it('rejects an expired token', async () => {
    const { user } = await registerUser();
    const expired = jwt.sign({ exp: Math.floor(Date.now() / 1000) - 60 }, config.jwt.secret, {
      subject: String(user.id),
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    const res = await api().get('/api/auth/me').set(bearer(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/expired/i);
  });

  it('rejects a token without the expected claims', async () => {
    const noSubject = jwt.sign({}, config.jwt.secret, { issuer: config.jwt.issuer, audience: config.jwt.audience });
    const wrongAudience = jwt.sign({}, config.jwt.secret, { subject: '1', issuer: config.jwt.issuer, audience: 'other' });

    expect((await api().get('/api/auth/me').set(bearer(noSubject))).status).toBe(401);
    expect((await api().get('/api/auth/me').set(bearer(wrongAudience))).status).toBe(401);
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const { token, user } = await registerUser();
    await db('users').where({ id: user.id }).del();

    const res = await api().get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(401);
  });
});
