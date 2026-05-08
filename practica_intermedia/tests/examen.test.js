import request from 'supertest';
import { app } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearDB } from './helpers/db.js';
import {
  createAdminUser, createGuestUser, createCompany,
  createClient, createProject, getToken,
} from './helpers/factories.js';
import DeliveryNote from '../src/models/DeliveryNote.js';

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => await teardownTestDB());

beforeEach(async () => await clearDB());

// ── 1) express-mongo-sanitize ────────────────────────────────
describe('express-mongo-sanitize', () => {
  test('sanitiza operadores $gt en el body — no permite acceso con inyección NoSQL', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({
        email: { $gt: '' },
        password: 'cualquiercosa',
      });
    // Con sanitize activo el $gt se elimina o Zod lo rechaza
    // En ningún caso debe devolver 200 (acceso concedido)
    expect(res.status).not.toBe(200);
  });
});

// ── 2) AppError.tooManyRequests ──────────────────────────────
describe('AppError.tooManyRequests — verificación de email', () => {
  test('3 intentos con código incorrecto devuelve 429', async () => {
    const res1 = await request(app).post('/api/user/register').send({
      email: 'verify@test.com',
      password: 'password123',
    });
    const token = res1.body.accessToken;

    // Intento 1
    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });

    // Intento 2
    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });

    // Intento 3 — debe devolver 429
    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });

    expect(res.status).toBe(429);
  });
});

// ── 3) Control de propiedad en signDeliveryNote ──────────────
describe('signDeliveryNote — control de propiedad', () => {
  test('guest no puede firmar albarán creado por admin — debe dar 403', async () => {
    const admin = await createAdminUser();
    const company = await createCompany(admin._id);
    const User = (await import('../src/models/User.js')).default;
    await User.findById(admin._id).populate('company');

    const guest = await createGuestUser(company._id);
    const guestToken = getToken(guest._id);

    const client = await createClient(admin._id, company._id);
    const project = await createProject(admin._id, company._id, client._id);

    const note = await DeliveryNote.create({
      user: admin._id,
      company: company._id,
      client: client._id,
      project: project._id,
      format: 'hours',
      workDate: new Date(),
      hours: 8,
    });

    const res = await request(app)
      .patch(`/api/deliverynote/${note._id}/sign`)
      .set('Authorization', `Bearer ${guestToken}`)
      .attach('signature', Buffer.from('fake-image'), 'firma.png');

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/creador|admin/i);
  });

  test('admin no recibe 403 al intentar firmar (puede fallar en Cloudinary pero no en permisos)', async () => {
    const admin = await createAdminUser();
    const company = await createCompany(admin._id);
    const adminToken = getToken(admin._id);

    const client = await createClient(admin._id, company._id);
    const project = await createProject(admin._id, company._id, client._id);

    const note = await DeliveryNote.create({
      user: admin._id,
      company: company._id,
      client: client._id,
      project: project._id,
      format: 'hours',
      workDate: new Date(),
      hours: 8,
    });

    const res = await request(app)
      .patch(`/api/deliverynote/${note._id}/sign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('signature', Buffer.from('fake-image'), 'firma.png');

    // No debe dar 403 (permisos) aunque falle por imagen inválida en Cloudinary
    expect(res.status).not.toBe(403);
  });
});