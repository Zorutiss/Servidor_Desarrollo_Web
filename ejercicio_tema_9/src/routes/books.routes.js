import { Router } from 'express';
import {
  getBooks, getBookById, createBook, updateBook, deleteBook, getStats,
} from '../controllers/books.controller.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { validate, bookSchema } from '../schemas/validation.js';

const router = Router();

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Listar libros con filtros y paginación
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema: { type: string }
 *       - in: query
 *         name: author
 *         schema: { type: string }
 *       - in: query
 *         name: available
 *         schema: { type: boolean }
 *         description: Filtrar por disponibilidad
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Búsqueda por título, autor o ISBN
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Lista de libros
 */
router.get('/', getBooks);

/**
 * @swagger
 * /api/books/stats:
 *   get:
 *     summary: Estadísticas de la biblioteca (BONUS)
 *     tags: [Books]
 *     security:
 *       - BearerToken: []
 *     responses:
 *       200:
 *         description: Estadísticas, libros más prestados y mejor valorados
 */
router.get('/stats', authMiddleware, requireRole('LIBRARIAN', 'ADMIN'), getStats);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Obtener libro por ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Libro encontrado
 *       404:
 *         description: Libro no encontrado
 */
router.get('/:id', getBookById);

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Crear libro — Librarian/Admin
 *     tags: [Books]
 *     security:
 *       - BearerToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookInput'
 *     responses:
 *       201:
 *         description: Libro creado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.post('/', authMiddleware, requireRole('LIBRARIAN', 'ADMIN'), validate(bookSchema), createBook);

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Actualizar libro — Librarian/Admin
 *     tags: [Books]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Libro actualizado
 *       404:
 *         description: Libro no encontrado
 */
router.put('/:id', authMiddleware, requireRole('LIBRARIAN', 'ADMIN'), updateBook);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Eliminar libro — Solo Admin
 *     tags: [Books]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Libro eliminado
 *       403:
 *         description: Acceso denegado
 */
router.delete('/:id', authMiddleware, requireRole('ADMIN'), deleteBook);

export default router;
