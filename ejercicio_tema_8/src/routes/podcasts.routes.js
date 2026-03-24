import { Router } from 'express';
import {
  getPublished,
  getById,
  create,
  update,
  remove,
  getAll,
  togglePublish,
} from '../controllers/podcasts.controller.js';
import { validatePodcast } from '../validators/podcast.validator.js';
import sessionMiddleware from '../middleware/session.middleware.js';
import rolMiddleware from '../middleware/rol.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/podcasts:
 *   get:
 *     summary: Listar podcasts publicados
 *     tags: [Podcasts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de podcasts publicados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 podcasts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Podcast'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get('/', getPublished);

/**
 * @swagger
 * /api/podcasts/admin/all:
 *   get:
 *     summary: Listar todos los podcasts (incluye no publicados) — Solo Admin
 *     tags: [Podcasts]
 *     security:
 *       - BearerToken: []
 *     responses:
 *       200:
 *         description: Lista completa de podcasts
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.get('/admin/all', sessionMiddleware, rolMiddleware('admin'), getAll);

/**
 * @swagger
 * /api/podcasts/{id}:
 *   get:
 *     summary: Obtener un podcast por ID
 *     tags: [Podcasts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 podcast:
 *                   $ref: '#/components/schemas/Podcast'
 *       404:
 *         description: Podcast no encontrado
 */
router.get('/:id', getById);

/**
 * @swagger
 * /api/podcasts:
 *   post:
 *     summary: Crear podcast — Requiere autenticación
 *     tags: [Podcasts]
 *     security:
 *       - BearerToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *               description:
 *                 type: string
 *                 minLength: 10
 *               category:
 *                 type: string
 *                 enum: [tech, science, history, comedy, news]
 *               duration:
 *                 type: number
 *                 minimum: 60
 *               episodes:
 *                 type: number
 *     responses:
 *       201:
 *         description: Podcast creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post('/', sessionMiddleware, validatePodcast, create);

/**
 * @swagger
 * /api/podcasts/{id}:
 *   put:
 *     summary: Actualizar propio podcast — Solo el autor
 *     tags: [Podcasts]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Podcast'
 *     responses:
 *       200:
 *         description: Podcast actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No es el autor
 *       404:
 *         description: Podcast no encontrado
 */
router.put('/:id', sessionMiddleware, update);

/**
 * @swagger
 * /api/podcasts/{id}:
 *   delete:
 *     summary: Eliminar cualquier podcast — Solo Admin
 *     tags: [Podcasts]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Podcast no encontrado
 */
router.delete('/:id', sessionMiddleware, rolMiddleware('admin'), remove);

/**
 * @swagger
 * /api/podcasts/{id}/publish:
 *   patch:
 *     summary: Publicar/despublicar podcast — Solo Admin
 *     tags: [Podcasts]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de publicación actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.patch('/:id/publish', sessionMiddleware, rolMiddleware('admin'), togglePublish);

export default router;
