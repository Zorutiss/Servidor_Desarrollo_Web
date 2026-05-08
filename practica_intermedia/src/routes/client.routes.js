import { Router } from 'express';
import {
  createClient, updateClient, getClients,
  getArchivedClients, getClientById,
  deleteClient, restoreClient,
} from '../controllers/client.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { clientSchema } from '../validators/client.validator.js';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/client:
 *   get:
 *     summary: Listar clientes de la compañía
 *     tags: [Clientes]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Filtrar por nombre
 *     responses:
 *       200:
 *         description: Lista de clientes con paginación
 *       401:
 *         description: No autenticado
 */
router.get('/', getClients);

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     summary: Listar clientes archivados (soft delete)
 *     tags: [Clientes]
 *     security:
 *       - BearerToken: []
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 *       401:
 *         description: No autenticado
 */
router.get('/archived', getArchivedClients);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/:id', getClientById);

/**
 * @swagger
 * /api/client:
 *   post:
 *     summary: Crear nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - BearerToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Empresa Cliente S.L.
 *               cif:
 *                 type: string
 *                 example: B12345678
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       409:
 *         description: CIF duplicado en la compañía
 */
router.post('/', validate(clientSchema), createClient);

/**
 * @swagger
 * /api/client/{id}:
 *   put:
 *     summary: Actualizar cliente
 *     tags: [Clientes]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               cif: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Cliente no encontrado
 */
router.put('/:id', validate(clientSchema), updateClient);

/**
 * @swagger
 * /api/client/{id}:
 *   delete:
 *     summary: Archivar o eliminar cliente
 *     tags: [Clientes]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         schema: { type: boolean, default: true }
 *         description: true = archivar, false = eliminar definitivamente
 *     responses:
 *       200:
 *         description: Cliente archivado o eliminado
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Cliente no encontrado
 */
router.delete('/:id', deleteClient);

/**
 * @swagger
 * /api/client/{id}/restore:
 *   patch:
 *     summary: Restaurar cliente archivado
 *     tags: [Clientes]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cliente restaurado correctamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Cliente archivado no encontrado
 */
router.patch('/:id/restore', restoreClient);

export default router;
