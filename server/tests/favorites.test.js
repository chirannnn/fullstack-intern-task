const db = require('../src/db/knex');
const { resetDatabase } = require('./setup/testDb');
const { api, registerUser, bearer } = require('./helpers');

let templateIds;

beforeEach(async () => {
  await resetDatabase(db);
  templateIds = (await db('templates').select('id').orderBy('id')).map((row) => row.id);
});
afterAll(() => db.destroy());

describe('authentication', () => {
  it.each([
    ['get', '/api/favorites'],
    ['post', '/api/favorites/1'],
    ['delete', '/api/favorites/1'],
  ])('%s %s requires a token', async (method, path) => {
    const res = await api()[method](path);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an invalid token', async () => {
    const res = await api().get('/api/favorites').set(bearer('not.a.jwt'));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/favorites/:templateId', () => {
  it('adds a template to the user favorites', async () => {
    const { token } = await registerUser();
    const res = await api().post(`/api/favorites/${templateIds[0]}`).set(bearer(token));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ template_id: templateIds[0], created_at: expect.any(String) });
  });

  it('prevents favoriting the same template twice', async () => {
    const { token, user } = await registerUser();
    await api().post(`/api/favorites/${templateIds[0]}`).set(bearer(token));
    const res = await api().post(`/api/favorites/${templateIds[0]}`).set(bearer(token));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(await db('favorites').where({ user_id: user.id }).count({ n: '*' }).first()).toEqual({ n: '1' });
  });

  it('enforces uniqueness at the database level', async () => {
    const { user } = await registerUser();
    await db('favorites').insert({ user_id: user.id, template_id: templateIds[0] });

    await expect(db('favorites').insert({ user_id: user.id, template_id: templateIds[0] })).rejects.toMatchObject({
      code: '23505',
    });
  });

  it('handles concurrent duplicate requests safely', async () => {
    const { token } = await registerUser();
    const responses = await Promise.all(
      [1, 2, 3].map(() => api().post(`/api/favorites/${templateIds[1]}`).set(bearer(token))),
    );

    expect(responses.map((r) => r.status).sort()).toEqual([201, 409, 409]);
  });

  it('returns 404 for a template that does not exist', async () => {
    const { token } = await registerUser();
    const res = await api().post('/api/favorites/99999').set(bearer(token));

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Template not found');
  });

  it('returns 400 for an invalid template id', async () => {
    const { token } = await registerUser();
    const res = await api().post('/api/favorites/abc').set(bearer(token));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/favorites', () => {
  it('lists the user favorites newest first with template details', async () => {
    const { token } = await registerUser();
    await api().post(`/api/favorites/${templateIds[2]}`).set(bearer(token));
    await api().post(`/api/favorites/${templateIds[0]}`).set(bearer(token));

    const res = await api().get('/api/favorites').set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.data.map((t) => t.id)).toEqual([templateIds[0], templateIds[2]]);
    expect(res.body.data[0]).toMatchObject({
      name: expect.any(String),
      description: expect.any(String),
      thumbnail_url: expect.any(String),
      category: expect.any(String),
      is_favorited: true,
      favorited_at: expect.any(String),
    });
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 2, totalPages: 1 });
  });

  it('returns an empty list for a user with no favorites', async () => {
    const { token } = await registerUser();
    const res = await api().get('/api/favorites').set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('paginates favorites', async () => {
    const { token } = await registerUser();
    for (const id of templateIds.slice(0, 3)) {
      await api().post(`/api/favorites/${id}`).set(bearer(token));
    }

    const res = await api().get('/api/favorites?limit=2&page=2').set(bearer(token));
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });
});

describe('isolation between users', () => {
  it('only shows each user their own favorites', async () => {
    const alice = await registerUser({ name: 'Alice' });
    const bob = await registerUser({ name: 'Bob' });

    await api().post(`/api/favorites/${templateIds[0]}`).set(bearer(alice.token));
    await api().post(`/api/favorites/${templateIds[1]}`).set(bearer(bob.token));

    const aliceList = await api().get('/api/favorites').set(bearer(alice.token));
    const bobList = await api().get('/api/favorites').set(bearer(bob.token));

    expect(aliceList.body.data.map((t) => t.id)).toEqual([templateIds[0]]);
    expect(bobList.body.data.map((t) => t.id)).toEqual([templateIds[1]]);
  });

  it('lets two users favorite the same template independently', async () => {
    const alice = await registerUser();
    const bob = await registerUser();

    expect((await api().post(`/api/favorites/${templateIds[0]}`).set(bearer(alice.token))).status).toBe(201);
    expect((await api().post(`/api/favorites/${templateIds[0]}`).set(bearer(bob.token))).status).toBe(201);
  });

  it("does not let a user remove another user's favorite", async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    await api().post(`/api/favorites/${templateIds[0]}`).set(bearer(alice.token));

    const res = await api().delete(`/api/favorites/${templateIds[0]}`).set(bearer(bob.token));
    expect(res.status).toBe(404);

    const aliceList = await api().get('/api/favorites').set(bearer(alice.token));
    expect(aliceList.body.data).toHaveLength(1);
  });
});

describe('DELETE /api/favorites/:templateId', () => {
  it('removes a favorite', async () => {
    const { token } = await registerUser();
    await api().post(`/api/favorites/${templateIds[0]}`).set(bearer(token));

    const res = await api().delete(`/api/favorites/${templateIds[0]}`).set(bearer(token));
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const list = await api().get('/api/favorites').set(bearer(token));
    expect(list.body.data).toEqual([]);
  });

  it('returns 404 when the template is not favorited', async () => {
    const { token } = await registerUser();
    const res = await api().delete(`/api/favorites/${templateIds[0]}`).set(bearer(token));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for an invalid template id', async () => {
    const { token } = await registerUser();
    const res = await api().delete('/api/favorites/0').set(bearer(token));
    expect(res.status).toBe(400);
  });

  it('removes favorites automatically when the user is deleted', async () => {
    const { token, user } = await registerUser();
    await api().post(`/api/favorites/${templateIds[0]}`).set(bearer(token));
    await db('users').where({ id: user.id }).del();

    expect(await db('favorites').where({ user_id: user.id }).count({ n: '*' }).first()).toEqual({ n: '0' });
  });
});
