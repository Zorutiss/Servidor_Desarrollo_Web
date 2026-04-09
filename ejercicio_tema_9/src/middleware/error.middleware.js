import { Prisma } from '@prisma/client';

const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'campo';
      return res.status(400).json({ message: `El ${field} ya está en uso` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Recurso no encontrado' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ message: 'Referencia inválida' });
    }
  }

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token inválido' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expirado' });
  }

  return res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
  });
};

export default errorMiddleware;
