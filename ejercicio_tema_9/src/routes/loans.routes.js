import { Router } from 'express';
import { getMyLoans, getAllLoans, createLoan, returnBook } from '../controllers/loans.controller.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/loans:
 *   get:
 *     summary: Mis préstamos activos e histórico
 *     tags: [Loans]
 *     security:
 *       - BearerToken: []
 *     responses:
 *       200:
 *         description: Lista de préstamos del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/', authMiddleware, getMyLoans);

/**
 * @swagger
 * /api/loans/all:
 *   get:
 *     summary: Todos los préstamos — Librarian/Admin
 *     tags: [Loans]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, RETURNED, OVERDUE]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Lista completa de préstamos
 *       403:
 *         description: Acceso denegado
 */
router.get('/all', authMiddleware, requireRole('LIBRARIAN', 'ADMIN'), getAllLoans);

/**
 * @swagger
 * /api/loans:
 *   post:
 *     summary: Solicitar préstamo de un libro
 *     tags: [Loans]
 *     security:
 *       - BearerToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId]
 *             properties:
 *               bookId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Préstamo creado (14 días)
 *       400:
 *         description: Sin ejemplares, límite alcanzado o libro ya prestado
 *       401:
 *         description: No autenticado
 */
router.post('/', authMiddleware, createLoan);

/**
 * @swagger
 * /api/loans/{id}/return:
 *   put:
 *     summary: Devolver un libro
 *     tags: [Loans]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Libro devuelto correctamente
 *       404:
 *         description: Préstamo no encontrado
 */
router.put('/:id/return', authMiddleware, returnBook);

export default router;
