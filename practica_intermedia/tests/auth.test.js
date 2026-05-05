import request from 'supertest';
import { app } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearDB } from './helpers/db.js';
import { createAdminUser, getToken } from './helpers/factories.js';

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test_access_secret_32chars_minimum';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32chars_minimum';
  await setupTestDB();
});

afterAll(async () => await teardownTestDB());
afterEach(async () => await clearDB());

describe('POST /api/user/register', () => {
  test('201 — registro correcto', async () => {
    const res = await request(app).post('/api/user/register').send({
      email: 'nuevo@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('nuevo@test.com');
    expect(res.body.user.status).toBe('pending');
  });

  test('400 — email inválido', async () => {
    const res = await request(app).post('/api/user/register').send({
      email: 'no-es-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  test('400 — contraseña corta', async () => {
    const res = await request(app).post('/api/user/register').send({
      email: 'test@test.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  test('409 — email duplicado verificado', async () => {
    const user = await createAdminUser();
    const res = await request(app).post('/api/user/register').send({
      email: user.email,
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/user/login', () => {
  test('200 — login correcto', async () => {
    await createAdminUser();
    const res = await request(app).post('/api/user/login').send({
      email: 'admin@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  test('401 — contraseña incorrecta', async () => {
    await createAdminUser();
    const res = await request(app).post('/api/user/login').send({
      email: 'admin@test.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  test('401 — usuario no existe', async () => {
    const res = await request(app).post('/api/user/login').send({
      email: 'noexiste@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/user', () => {
  test('200 — perfil del usuario', async () => {
    const user = await createAdminUser();
    const token = getToken(user._id);
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@test.com');
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });

  test('401 — token inválido', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', 'Bearer tokeninvalido');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/user/logout', () => {
  test('200 — logout correcto', async () => {
    const user = await createAdminUser();
    const token = getToken(user._id);
    const res = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/user', () => {
  test('200 — soft delete', async () => {
    const user = await createAdminUser();
    const token = getToken(user._id);
    const res = await request(app)
      .delete('/api/user?soft=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/desactivado/i);
  });

  test('200 — hard delete', async () => {
    const user = await createAdminUser();
    const token = getToken(user._id);
    const res = await request(app)
      .delete('/api/user?soft=false')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/definitivamente/i);
  });
});
