import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import indexRouter from './routes/index.js';
import userRoutes from './routes/user.routes.js';
import clientRoutes from './routes/client.routes.js';
import projectRoutes from './routes/project.routes.js';
import errorHandler from './middleware/error-handler.js';
import deliveryNoteRoutes from './routes/deliverynote.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';

const app = express();
const httpServer = createServer(app);

// SEGURIDAD
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas peticiones, inténtalo más tarde' },
}));

// PARSERS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// RUTAS
app.use('/api', indexRouter);
app.use('/api/user', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/deliverynote', deliveryNoteRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// MANEJO DE ERRORES
app.use(errorHandler);

export { app, httpServer }; 