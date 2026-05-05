import { Router } from 'express';
import {
  createProject,
  updateProject,
  getProjects,
  getArchivedProjects,
  getProjectById,
  deleteProject,
  restoreProject,
} from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { projectSchema } from '../validators/project.validator.js';

const router = Router();

router.use(authMiddleware);

router.get('/archived', getArchivedProjects);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', validate(projectSchema), createProject);
router.put('/:id', validate(projectSchema), updateProject);
router.delete('/:id', deleteProject);
router.patch('/:id/restore', restoreProject);

export default router;
