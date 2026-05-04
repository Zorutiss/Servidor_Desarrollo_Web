import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import indexRouter from './routes/index.js';
import errorHandler from './middleware/error-handler.js';

const app = express();
const httpServer = createServer(app);

// ── Seguridad ──────────────────────────────────────────────
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas peticiones, inténtalo más tarde' },
}));

// ── Parsers ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas ──────────────────────────────────────────────────
app.use('/api', indexRouter);

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// ── Error handler ─────────────────────────────────────────
app.use(errorHandler);

export { app, httpServer };
