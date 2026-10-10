const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();
const api = () => request(app);

let userCounter = 0;

async function registerUser(overrides = {}) {
  userCounter += 1;
  const payload = {
    name: 'Test User',
    email: `user${userCounter}@example.com`,
    password: 'Password123',
    ...overrides,
  };
  const res = await api().post('/api/auth/register').send(payload);
  if (res.status !== 201) throw new Error(`Registration failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { ...res.body.data, password: payload.password };
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { app, api, registerUser, bearer };
