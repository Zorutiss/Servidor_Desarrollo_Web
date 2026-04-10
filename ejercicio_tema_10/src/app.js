import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import roomRoutes from './routes/rooms.routes.js';
import { initSocket } from './socket/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middlewares
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Servir index.html en /
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});
app.get('/chat', (req, res) => {
  res.sendFile(join(__dirname, '../public/chat.html'));
});

// Socket.IO
initSocket(io);

// Arrancar
const PORT = process.env.PORT || 3000;

connectDB(process.env.MONGODB_URI).then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`💬 Chat disponible en http://localhost:${PORT}/chat`);
  });
});
