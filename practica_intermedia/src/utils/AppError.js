export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg) { return new AppError(msg, 400); }
  static unauthorized(msg = 'No autorizado') { return new AppError(msg, 401); }
  static forbidden(msg = 'Acceso denegado') { return new AppError(msg, 403); }
  static notFound(msg = 'Recurso no encontrado') { return new AppError(msg, 404); }
  static conflict(msg) { return new AppError(msg, 409); }
  static tooManyRequests(msg = 'Demasiados intentos') { return new AppError(msg, 429); }
  static internal(msg = 'Error interno del servidor') { return new AppError(msg, 500); }
}
