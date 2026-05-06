import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/auth.middleware.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Autenticación JWT en el handshake
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const user = socket.user;
    const companyId = user.company?._id?.toString() || user.company?.toString();

    if (companyId) {
      // Unirse a la room de la compañía
      socket.join(companyId);
      console.log(`${user.email} conectado a room ${companyId}`);
    }

    socket.on('disconnect', () => {
      console.log(`${user.email} desconectado`);
    });
  });

  return io;
};

// Obtener la instancia de io desde cualquier controlador
export const getIO = () => {
  if (!io) throw new Error('Socket.IO no inicializado');
  return io;
};
