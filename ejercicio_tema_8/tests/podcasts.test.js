import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Podcast from '../src/models/podcast.model.js';

const TEST_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;

let userToken;
let adminToken;
let podcastId;

beforeAll(async () => {
  await mongoose.connect(TEST_URI);

  //Crear un usuario normal
  await request(app).post('/api/auth/register').send({
    name: 'Normal User',
    email: 'normaluser@test.com',
    password: 'password123',
  });
  const userLogin = await request(app).post('/api/auth/login').send({
    email: 'normaluser@test.com',
    password: 'password123',
  });
  userToken = userLogin.body.token;

  //Crear un usuario admin directamente en la base de datos
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('password123', 10);
  await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: hashedPassword,
    role: 'admin',
  });
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@test.com',
    password: 'password123',
  });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await Podcast.deleteMany({});
  await User.deleteMany({ email: /@test\.com$/ });
  await mongoose.connection.close();
});

describe('Podcasts endpoints', () => {
  //GET /api/podcasts
  test('GET /api/podcasts → 200 con array (solo publicados)', async () => {
    const res = await request(app).get('/api/podcasts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.podcasts)).toBe(true);
    //Todos deben estar publicados
    res.body.podcasts.forEach((p) => expect(p.published).toBe(true));
  });

  //POST /api/podcasts
  test('POST /api/podcasts → 201 con podcast creado (requiere token)', async () => {
    const res = await request(app)
      .post('/api/podcasts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Mi Podcast de Test',
        description: 'Descripción larga del podcast de prueba',
        category: 'tech',
        duration: 1800,
        episodes: 3,
      });
    expect(res.status).toBe(201);
    expect(res.body.podcast).toBeDefined();
    expect(res.body.podcast.title).toBe('Mi Podcast de Test');
    podcastId = res.body.podcast._id;
  });

  test('POST /api/podcasts → 401 sin token', async () => {
    const res = await request(app).post('/api/podcasts').send({
      title: 'Podcast sin auth',
      description: 'Descripción del podcast sin autenticación',
    });
    expect(res.status).toBe(401);
  });

  //DELETE /api/podcasts/:id
  test('DELETE /api/podcasts/:id → 403 para user normal', async () => {
    const res = await request(app)
      .delete(`/api/podcasts/${podcastId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('DELETE /api/podcasts/:id → 200 solo para admin', async () => {
    const res = await request(app)
      .delete(`/api/podcasts/${podcastId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  //GET /api/podcasts/admin/all
  test('GET /api/podcasts/admin/all → 200 solo para admin', async () => {
    const res = await request(app)
      .get('/api/podcasts/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.podcasts)).toBe(true);
  });

  test('GET /api/podcasts/admin/all → 403 para user normal', async () => {
    const res = await request(app)
      .get('/api/podcasts/admin/all')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});
