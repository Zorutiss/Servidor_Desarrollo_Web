import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors[0].message;
    return next(AppError.badRequest(message));
  }
  req.body = result.data;
  next();
};
