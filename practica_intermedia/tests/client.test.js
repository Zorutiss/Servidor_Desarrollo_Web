import request from 'supertest';
import { app } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearDB } from './helpers/db.js';
import {
  createAdminUser, createCompany,
  createClient, getToken,
} from './helpers/factories.js';

let adminUser, company, token;

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test_access_secret_32chars_minimum';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32chars_minimum';
  await setupTestDB();
});

afterAll(async () => await teardownTestDB());

beforeEach(async () => {
  await clearDB();
  adminUser = await createAdminUser();
  company = await createCompany(adminUser._id);
  // Recargar usuario con company
  const User = (await import('../src/models/User.js')).default;
  adminUser = await User.findById(adminUser._id).populate('company');
  token = getToken(adminUser._id);
});

describe('POST /api/client', () => {
  test('201 — cliente creado', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cliente Nuevo S.L.',
        cif: 'B11111111',
        email: 'nuevo@cliente.com',
      });
    expect(res.status).toBe(201);
    expect(res.body.client.name).toBe('Cliente Nuevo S.L.');
  });

  test('400 — faltan campos requeridos', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'solo@email.com' });
    expect(res.status).toBe(400);
  });

  test('409 — CIF duplicado en la misma compañía', async () => {
    await createClient(adminUser._id, company._id);
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Otro Cliente', cif: 'A11111111' });
    expect(res.status).toBe(409);
  });

  test('401 — sin token', async () => {
    const res = await request(app).post('/api/client').send({ name: 'Test', cif: 'X11111111' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/client', () => {
  test('200 — lista de clientes', async () => {
    await createClient(adminUser._id, company._id);
    const res = await request(app)
      .get('/api/client')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.clients)).toBe(true);
    expect(res.body.clients.length).toBe(1);
  });

  test('200 — paginación funciona', async () => {
    const res = await request(app)
      .get('/api/client?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
  });
});

describe('GET /api/client/:id', () => {
  test('200 — cliente encontrado', async () => {
    const client = await createClient(adminUser._id, company._id);
    const res = await request(app)
      .get(`/api/client/${client._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.client._id).toBe(client._id.toString());
  });

  test('404 — cliente no existe', async () => {
    const res = await request(app)
      .get('/api/client/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/client/:id', () => {
  test('200 — soft delete (archivar)', async () => {
    const client = await createClient(adminUser._id, company._id);
    const res = await request(app)
      .delete(`/api/client/${client._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/archivado/i);
  });

  test('200 — hard delete', async () => {
    const client = await createClient(adminUser._id, company._id);
    const res = await request(app)
      .delete(`/api/client/${client._id}?soft=false`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/definitivamente/i);
  });
});

describe('PATCH /api/client/:id/restore', () => {
  test('200 — cliente restaurado', async () => {
    const client = await createClient(adminUser._id, company._id);
    // Primero archivar
    await request(app)
      .delete(`/api/client/${client._id}`)
      .set('Authorization', `Bearer ${token}`);
    // Luego restaurar
    const res = await request(app)
      .patch(`/api/client/${client._id}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/restaurado/i);
  });
});
