import { body, validationResult } from 'express-validator';

export const validatePodcast = [
  body('title').trim().isLength({ min: 3 }).withMessage('El título debe tener al menos 3 caracteres'),
  body('description').isLength({ min: 10 }).withMessage('La descripción debe tener al menos 10 caracteres'),
  body('category')
    .optional()
    .isIn(['tech', 'science', 'history', 'comedy', 'news'])
    .withMessage('Categoría inválida'),
  body('duration').optional().isInt({ min: 60 }).withMessage('La duración mínima es 60 segundos'),
  body('episodes').optional().isInt({ min: 1 }).withMessage('El número de episodios debe ser al menos 1'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
];
