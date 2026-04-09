import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

// ──────────────────────────────────────────────
// Setup / Teardown
// ──────────────────────────────────────────────

let adminToken, userToken, librarianToken;
let testBookId, testLoanId, testReviewId;
let adminUser, normalUser;

beforeAll(async () => {
  await prisma.$connect();

  // Limpiar datos de test previos
  await prisma.review.deleteMany({ where: { user: { email: { endsWith: '@jest.test' } } } });
  await prisma.loan.deleteMany({ where: { user: { email: { endsWith: '@jest.test' } } } });
  await prisma.book.deleteMany({ where: { isbn: { startsWith: 'TEST-' } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: '@jest.test' } } });

  // Crear usuarios de test
  const hash = await bcrypt.hash('password123', 10);

  adminUser = await prisma.user.create({
    data: { email: 'admin@jest.test', name: 'Admin Jest', password: hash, role: 'ADMIN' },
  });
  normalUser = await prisma.user.create({
    data: { email: 'user@jest.test', name: 'User Jest', password: hash, role: 'USER' },
  });
  await prisma.user.create({
    data: { email: 'librarian@jest.test', name: 'Librarian Jest', password: hash, role: 'LIBRARIAN' },
  });

  // Login para obtener tokens
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@jest.test', password: 'password123' });
  adminToken = adminRes.body.token;

  const userRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@jest.test', password: 'password123' });
  userToken = userRes.body.token;

  const libRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'librarian@jest.test', password: 'password123' });
  librarianToken = libRes.body.token;
});

afterAll(async () => {
  await prisma.review.deleteMany({ where: { user: { email: { endsWith: '@jest.test' } } } });
  await prisma.loan.deleteMany({ where: { user: { email: { endsWith: '@jest.test' } } } });
  await prisma.book.deleteMany({ where: { isbn: { startsWith: 'TEST-' } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: '@jest.test' } } });
  await prisma.$disconnect();
});

// ──────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────

describe('Auth', () => {
  test('POST /api/auth/register → 201 con usuario creado', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'newreg@jest.test',
      name: 'New Reg',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  test('POST /api/auth/register → 400 si email duplicado', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'user@jest.test',
      name: 'Duplicate',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/register → 400 si faltan campos', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@jest.test' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login → 200 con token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@jest.test', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login → 401 si contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@jest.test', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me → 200 con datos del usuario', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('user@jest.test');
  });

  test('GET /api/auth/me → 401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────
// BOOKS
// ──────────────────────────────────────────────

describe('Books', () => {
  test('GET /api/books → 200 con array', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.books)).toBe(true);
  });

  test('POST /api/books → 201 con libro creado (librarian)', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        isbn: 'TEST-001',
        title: 'Libro de Test Jest',
        author: 'Autor Test',
        genre: 'Fiction',
        description: 'Descripción del libro de test',
        publishedYear: 2024,
        copies: 5,
      });
    expect(res.status).toBe(201);
    expect(res.body.book).toBeDefined();
    testBookId = res.body.book.id;
  });

  test('POST /api/books → 403 para usuario normal', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        isbn: 'TEST-002',
        title: 'Otro Libro',
        author: 'Autor',
        genre: 'Sci-Fi',
        publishedYear: 2020,
        copies: 2,
      });
    expect(res.status).toBe(403);
  });

  test('POST /api/books → 401 sin token', async () => {
    const res = await request(app).post('/api/books').send({
      isbn: 'TEST-003',
      title: 'Sin Auth',
      author: 'Autor',
      genre: 'Fiction',
      publishedYear: 2020,
      copies: 1,
    });
    expect(res.status).toBe(401);
  });

  test('GET /api/books/:id → 200 con libro', async () => {
    const res = await request(app).get(`/api/books/${testBookId}`);
    expect(res.status).toBe(200);
    expect(res.body.book.id).toBe(testBookId);
  });

  test('GET /api/books/:id → 404 si no existe', async () => {
    const res = await request(app).get('/api/books/999999');
    expect(res.status).toBe(404);
  });

  test('PUT /api/books/:id → 200 actualizado (admin)', async () => {
    const res = await request(app)
      .put(`/api/books/${testBookId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Descripción actualizada' });
    expect(res.status).toBe(200);
  });

  test('DELETE /api/books/:id → 403 para librarian', async () => {
    const res = await request(app)
      .delete(`/api/books/${testBookId}`)
      .set('Authorization', `Bearer ${librarianToken}`);
    expect(res.status).toBe(403);
  });
});

// ──────────────────────────────────────────────
// LOANS
// ──────────────────────────────────────────────

describe('Loans', () => {
  test('POST /api/loans → 401 sin token', async () => {
    const res = await request(app).post('/api/loans').send({ bookId: testBookId });
    expect(res.status).toBe(401);
  });

  test('POST /api/loans → 201 préstamo creado', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: testBookId });
    expect(res.status).toBe(201);
    expect(res.body.loan).toBeDefined();
    expect(res.body.loan.status).toBe('ACTIVE');
    testLoanId = res.body.loan.id;
  });

  test('POST /api/loans → 400 si ya tiene el libro prestado', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: testBookId });
    expect(res.status).toBe(400);
  });

  test('GET /api/loans → 200 mis préstamos', async () => {
    const res = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.loans)).toBe(true);
  });

  test('GET /api/loans/all → 403 para usuario normal', async () => {
    const res = await request(app)
      .get('/api/loans/all')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/loans/all → 200 para librarian', async () => {
    const res = await request(app)
      .get('/api/loans/all')
      .set('Authorization', `Bearer ${librarianToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.loans)).toBe(true);
  });

  test('PUT /api/loans/:id/return → 200 libro devuelto', async () => {
    const res = await request(app)
      .put(`/api/loans/${testLoanId}/return`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.loan.status).toBe('RETURNED');
  });

  test('PUT /api/loans/:id/return → 400 si ya fue devuelto', async () => {
    const res = await request(app)
      .put(`/api/loans/${testLoanId}/return`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
  });
});

// ──────────────────────────────────────────────
// REVIEWS
// ──────────────────────────────────────────────

describe('Reviews', () => {
  test('GET /api/books/:id/reviews → 200 con array', async () => {
    const res = await request(app).get(`/api/books/${testBookId}/reviews`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reviews)).toBe(true);
  });

  test('POST /api/books/:id/reviews → 403 sin préstamo devuelto', async () => {
    // El usuario no tiene préstamo devuelto de este libro (acabamos de devolver testBookId, pero creamos otro)
    const newBook = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isbn: 'TEST-REVIEW-BOOK',
        title: 'Libro Sin Préstamo',
        author: 'Autor',
        genre: 'Fiction',
        publishedYear: 2023,
        copies: 3,
      });
    const nbId = newBook.body.book.id;

    const res = await request(app)
      .post(`/api/books/${nbId}/reviews`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 4, comment: 'Sin haberlo devuelto' });
    expect(res.status).toBe(403);
  });

  test('POST /api/books/:id/reviews → 201 reseña creada (libro devuelto)', async () => {
    const res = await request(app)
      .post(`/api/books/${testBookId}/reviews`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5, comment: 'Excelente libro de test' });
    expect(res.status).toBe(201);
    expect(res.body.review).toBeDefined();
    testReviewId = res.body.review.id;
  });

  test('POST /api/books/:id/reviews → 400 si ya reseñó', async () => {
    const res = await request(app)
      .post(`/api/books/${testBookId}/reviews`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 3 });
    expect(res.status).toBe(400);
  });

  test('DELETE /api/reviews/:id → 200 reseña eliminada', async () => {
    const res = await request(app)
      .delete(`/api/reviews/${testReviewId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });
});

// ──────────────────────────────────────────────
// BOOKS DELETE (al final para no romper otros tests)
// ──────────────────────────────────────────────

describe('Books - Delete (Admin)', () => {
  test('DELETE /api/books/:id → 200 solo para admin', async () => {
    const res = await request(app)
      .delete(`/api/books/${testBookId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
