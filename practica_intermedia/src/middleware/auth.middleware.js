import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';

// Middleware REST
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Token no proporcionado'));
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findById(decoded.userId)
      .select('-password -verificationCode')
      .populate('company');
    if (!user || user.deleted) return next(AppError.unauthorized('Usuario no encontrado'));
    req.user = user;
    next();
  } catch {
    next(AppError.unauthorized('Token inválido o expirado'));
  }
};

// Middleware Socket.IO
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) return next(new Error('Token no proporcionado'));

    const decoded = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findById(decoded.userId)
      .select('-password -verificationCode')
      .populate('company');

    if (!user || user.deleted) return next(new Error('Usuario no encontrado'));

    socket.user = user;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
};
