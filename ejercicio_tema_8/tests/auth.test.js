import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';

const TEST_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
});

afterAll(async () => {
  await User.deleteMany({ email: /@test\.com$/ });
  await mongoose.connection.close();
});

describe('Auth endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'user@test.com',
    password: 'password123',
  };

  let token;

  //POST /api/auth/register
  test('POST /api/auth/register → 201 con usuario creado', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.password).toBeUndefined();
  });

  test('POST /api/auth/register → 400 si email duplicado', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  test('POST /api/auth/register → 400 si faltan campos', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'noname@test.com' });
    expect(res.status).toBe(400);
  });

  //POST /api/auth/login
  test('POST /api/auth/login → 201 con token cuando credenciales válidas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    token = res.body.token;
  });

  test('POST /api/auth/login → 401 si contraseña incorrecta', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  //GET /api/auth/me
  test('GET /api/auth/me → 200 con datos del usuario (requiere token)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testUser.email);
  });

  test('GET /api/auth/me → 401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
