const db = require('../src/db/knex');
const catalog = require('../src/db/templateCatalog');
const { resetDatabase } = require('./setup/testDb');
const { api, registerUser, bearer } = require('./helpers');

beforeEach(() => resetDatabase(db));
afterAll(() => db.destroy());

describe('GET /api/templates', () => {
  it('lists templates with pagination metadata', async () => {
    const res = await api().get('/api/templates');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(Math.min(12, catalog.length));
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: catalog.length, totalPages: Math.ceil(catalog.length / 12) });
    expect(Object.keys(res.body.data[0]).sort()).toEqual(
      ['category', 'description', 'id', 'is_favorited', 'name', 'thumbnail_url'].sort(),
    );
  });

  it('paginates results', async () => {
    const first = await api().get('/api/templates?limit=5&page=1');
    const second = await api().get('/api/templates?limit=5&page=2');

    expect(first.body.data).toHaveLength(5);
    expect(first.body.meta.totalPages).toBe(Math.ceil(catalog.length / 5));
    const firstIds = first.body.data.map((t) => t.id);
    expect(second.body.data.every((t) => !firstIds.includes(t.id))).toBe(true);
  });

  it('searches by name, case-insensitively', async () => {
    const res = await api().get('/api/templates').query({ search: 'metricly' });

    expect(res.status).toBe(200);
    expect(res.body.data.map((t) => t.name)).toEqual(['Metricly']);
  });

  it('searches by description', async () => {
    const res = await api().get('/api/templates').query({ search: 'checkout' });

    expect(res.body.data.map((t) => t.name)).toEqual(['Northwind Store']);
  });

  it('treats LIKE wildcards in the search literally', async () => {
    const res = await api().get('/api/templates').query({ search: '%' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('filters by category', async () => {
    const res = await api().get('/api/templates').query({ category: 'Dashboard' });
    const expected = catalog.filter((t) => t.category === 'Dashboard').length;

    expect(res.body.data).toHaveLength(expected);
    expect(res.body.data.every((t) => t.category === 'Dashboard')).toBe(true);
    expect(res.body.meta.total).toBe(expected);
  });

  it('combines search and category filters', async () => {
    const res = await api().get('/api/templates').query({ category: 'E-commerce', search: 'fashion' });
    expect(res.body.data.map((t) => t.name)).toEqual(['Atelier']);
  });

  it('returns an empty list when nothing matches', async () => {
    const res = await api().get('/api/templates').query({ search: 'zzz-no-match' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 1 } });
  });

  it.each([['page=0'], ['limit=500'], ['page=abc'], [`search=${'a'.repeat(101)}`]])(
    'rejects invalid query parameters: %s',
    async (query) => {
      const res = await api().get(`/api/templates?${query}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    },
  );

  it('flags favorited templates for an authenticated user', async () => {
    const { token } = await registerUser();
    const template = await db('templates').where({ slug: 'pulse-landing' }).first();
    await api().post(`/api/favorites/${template.id}`).set(bearer(token));

    const res = await api().get('/api/templates').set(bearer(token));
    const flagged = res.body.data.filter((t) => t.is_favorited);
    expect(flagged.map((t) => t.id)).toEqual([template.id]);

    const anonymous = await api().get('/api/templates');
    expect(anonymous.body.data.some((t) => t.is_favorited)).toBe(false);
  });

  it('still serves the catalog when an invalid token is supplied', async () => {
    const res = await api().get('/api/templates').set(bearer('garbage'));
    expect(res.status).toBe(200);
  });
});

describe('GET /api/templates/categories', () => {
  it('returns each category with its template count', async () => {
    const res = await api().get('/api/templates/categories');
    const expectedNames = [...new Set(catalog.map((t) => t.category))].sort();

    expect(res.status).toBe(200);
    expect(res.body.data.map((c) => c.name)).toEqual(expectedNames);
    expect(res.body.data.reduce((sum, c) => sum + c.count, 0)).toBe(catalog.length);
  });
});

describe('GET /api/templates/:id', () => {
  it('returns a single template', async () => {
    const template = await db('templates').where({ slug: 'folio-portfolio' }).first();
    const res = await api().get(`/api/templates/${template.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: template.id, name: 'Folio', category: 'Portfolio', is_favorited: false });
  });

  it('returns 404 for a template that does not exist', async () => {
    const res = await api().get('/api/templates/99999');

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: 'Template not found' });
  });

  it.each(['abc', '0', '-3', '1.5', '99999999999'])('returns 400 for invalid id "%s"', async (id) => {
    const res = await api().get(`/api/templates/${id}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
