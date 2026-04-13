import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Token no proporcionado'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const user = await User.findById(decoded.userId).select('-password -verificationCode');
    if (!user || user.deleted) {
      return next(AppError.unauthorized('Usuario no encontrado'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(AppError.unauthorized('Token inválido o expirado'));
  }
};
