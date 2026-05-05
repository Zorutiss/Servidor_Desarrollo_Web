import request from 'supertest';
import { app } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearDB } from './helpers/db.js';
import {
  createAdminUser, createCompany,
  createClient, createProject, getToken,
} from './helpers/factories.js';

let adminUser, company, client, project, token;

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
  const User = (await import('../src/models/User.js')).default;
  adminUser = await User.findById(adminUser._id).populate('company');
  token = getToken(adminUser._id);
  client = await createClient(adminUser._id, company._id);
  project = await createProject(adminUser._id, company._id, client._id);
});

const baseNote = () => ({
  format: 'hours',
  client: client._id.toString(),
  project: project._id.toString(),
  description: 'Trabajo de prueba',
  workDate: '2026-05-01',
  hours: 8,
  workers: [{ name: 'Trabajador Test', hours: 8 }],
});

describe('POST /api/deliverynote', () => {
  test('201 — albarán de horas creado', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(baseNote());
    expect(res.status).toBe(201);
    expect(res.body.deliveryNote.format).toBe('hours');
    expect(res.body.deliveryNote.signed).toBe(false);
  });

  test('201 — albarán de material creado', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        format: 'material',
        client: client._id.toString(),
        project: project._id.toString(),
        workDate: '2026-05-01',
        material: 'Cemento',
        quantity: 10,
        unit: 'sacos',
      });
    expect(res.status).toBe(201);
    expect(res.body.deliveryNote.material).toBe('Cemento');
  });

  test('400 — formato inválido', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...baseNote(), format: 'invalido' });
    expect(res.status).toBe(400);
  });

  test('401 — sin token', async () => {
    const res = await request(app).post('/api/deliverynote').send(baseNote());
    expect(res.status).toBe(401);
  });
});

describe('GET /api/deliverynote', () => {
  test('200 — lista de albaranes', async () => {
    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(baseNote());

    const res = await request(app)
      .get('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.deliveryNotes.length).toBe(1);
  });

  test('200 — filtro por formato', async () => {
    const res = await request(app)
      .get('/api/deliverynote?format=hours')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/deliverynote/:id', () => {
  test('200 — albarán eliminado (no firmado)', async () => {
    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(baseNote());

    const id = created.body.deliveryNote._id;
    const res = await request(app)
      .delete(`/api/deliverynote/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/deliverynote/:id', () => {
  test('200 — albarán actualizado', async () => {
    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(baseNote());

    const id = created.body.deliveryNote._id;
    const res = await request(app)
      .put(`/api/deliverynote/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Descripción actualizada', hours: 10 });
    expect(res.status).toBe(200);
    expect(res.body.deliveryNote.description).toBe('Descripción actualizada');
  });
});
