const rolMiddleware = (rolRequerido) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== rolRequerido) {
      return res.status(403).json({ message: 'Acceso denegado: permisos insuficientes' });
    }
    next();
  };
};

export default rolMiddleware;
