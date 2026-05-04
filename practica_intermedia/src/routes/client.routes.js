import { Router } from 'express';
import {
  createClient,
  updateClient,
  getClients,
  getArchivedClients,
  getClientById,
  deleteClient,
  restoreClient,
} from '../controllers/client.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { clientSchema } from '../validators/client.validator.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/archived', getArchivedClients);         // GET /api/client/archived
router.get('/', getClients);                          // GET /api/client
router.get('/:id', getClientById);                   // GET /api/client/:id
router.post('/', validate(clientSchema), createClient);           // POST /api/client
router.put('/:id', validate(clientSchema), updateClient);         // PUT /api/client/:id
router.delete('/:id', deleteClient);                 // DELETE /api/client/:id
router.patch('/:id/restore', restoreClient);         // PATCH /api/client/:id/restore

export default router;
