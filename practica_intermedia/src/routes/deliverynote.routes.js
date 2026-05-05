import { Router } from 'express';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  updateDeliveryNote,
  deleteDeliveryNote,
} from '../controllers/deliverynote.controller.js';
import { signDeliveryNote, getDeliveryNotePDF } from '../controllers/sign.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { deliveryNoteSchema } from '../validators/deliverynote.validator.js';
import { uploadSignature } from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getDeliveryNotes);
router.get('/:id', getDeliveryNoteById);
router.get('/:id/pdf', getDeliveryNotePDF);
router.post('/', validate(deliveryNoteSchema), createDeliveryNote);
router.put('/:id', updateDeliveryNote);
router.delete('/:id', deleteDeliveryNote);
router.patch('/:id/sign', uploadSignature.single('signature'), signDeliveryNote);

export default router;
