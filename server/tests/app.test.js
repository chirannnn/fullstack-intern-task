const db = require('../src/db/knex');
const { api } = require('./helpers');

afterAll(() => db.destroy());

describe('application', () => {
  it('reports health including database status', async () => {
    const res = await api().get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await api().get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('sets security headers and hides the framework', async () => {
    const res = await api().get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('allows the configured frontend origin via CORS', async () => {
    const res = await api().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not grant CORS to unknown origins', async () => {
    const res = await api().get('/api/health').set('Origin', 'https://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects oversized request bodies', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'x'.repeat(20_000) });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('applies rate limiting headers to auth endpoints', async () => {
    const res = await api().post('/api/auth/login').send({});
    expect(res.headers['ratelimit-policy'] || res.headers.ratelimit).toBeDefined();
  });
});
