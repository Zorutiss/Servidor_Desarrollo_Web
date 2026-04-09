import { Router } from 'express';
import { getBookReviews, createReview, deleteReview } from '../controllers/reviews.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate, reviewSchema } from '../schemas/validation.js';

const router = Router();

/**
 * @swagger
 * /api/books/{id}/reviews:
 *   get:
 *     summary: Reseñas de un libro
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de reseñas con puntuación media
 *       404:
 *         description: Libro no encontrado
 */
router.get('/books/:id/reviews', getBookReviews);

/**
 * @swagger
 * /api/books/{id}/reviews:
 *   post:
 *     summary: Crear reseña (solo si has devuelto el libro)
 *     tags: [Reviews]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reseña creada
 *       400:
 *         description: Ya has reseñado este libro
 *       403:
 *         description: Solo puedes reseñar libros que hayas devuelto
 */
router.post('/books/:id/reviews', authMiddleware, validate(reviewSchema), createReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Eliminar mi reseña
 *     tags: [Reviews]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reseña eliminada
 *       403:
 *         description: No tienes permiso
 *       404:
 *         description: Reseña no encontrada
 */
router.delete('/reviews/:id', authMiddleware, deleteReview);

export default router;
