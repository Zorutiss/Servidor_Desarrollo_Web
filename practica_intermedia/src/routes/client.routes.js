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

// TODAS LAS RUTAS REQUIEREN TOKEN AUTENTICADO
router.use(authMiddleware);

// GET /api/client/archived
router.get('/archived', getArchivedClients); 

// GET /api/client
router.get('/', getClients);    

// GET /api/client/:id
router.get('/:id', getClientById);                

// POST /api/client
router.post('/', validate(clientSchema), createClient);   

 // PUT /api/client/:id        
router.put('/:id', validate(clientSchema), updateClient);  

// DELETE /api/client/:id      
router.delete('/:id', deleteClient);  

// PATCH /api/client/:id/restore               
router.patch('/:id/restore', restoreClient);         

export default router;
