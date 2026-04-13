import { AppError } from '../utils/AppError.js';

const errorHandler = (err, req, res, next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    err = AppError.conflict(`El ${field} ya está en uso`);
  }

  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map(e => e.message).join(', ');
    err = AppError.badRequest(msg);
  }

 
  if (err.name === 'JsonWebTokenError') err = AppError.unauthorized('Token inválido');
  if (err.name === 'TokenExpiredError') err = AppError.unauthorized('Token expirado');


  if (err.code === 'LIMIT_FILE_SIZE') err = AppError.badRequest('El archivo supera el tamaño máximo de 5 MB');

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Error interno del servidor';

  if (!err.isOperational) console.error('ERROR:', err);

  res.status(statusCode).json({ message });
};

export default errorHandler;
