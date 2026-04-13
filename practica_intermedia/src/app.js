import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import userRoutes from './routes/user.routes.js';
import errorHandler from './middleware/error-handler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Seguridad
app.use(helmet());

//Sanitización manual
app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  next();
});

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas peticiones, inténtalo más tarde' },
}));

// Rate limit más estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Demasiados intentos de autenticación' },
});

//Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Archivos estáticos (logos)
app.use('/uploads', express.static(join(__dirname, '../uploads')));

//Routes
app.use('/api/user/register', authLimiter);
app.use('/api/user/login', authLimiter);
app.use('/api/user', userRoutes);

//404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

//Error handler centralizado
app.use(errorHandler);

export default app;