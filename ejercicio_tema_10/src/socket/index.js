import { socketAuthMiddleware } from '../middleware/auth.middleware.js';
import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerChatHandlers } from './handlers/chat.handler.js';
import User from '../models/user.model.js';

// Map: userId → socketId
const onlineUsers = new Map();

export const initSocket = (io) => {
  // Autenticación en el handshake
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // Marcar como online
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Notificar a todos
    io.emit('user:online', { userId, username: socket.user.username });

    console.log(`🟢 ${socket.user.username} conectado (${socket.id})`);

    // Registrar handlers
    registerRoomHandlers(io, socket, onlineUsers);
    registerChatHandlers(io, socket);

    // Desconexión
    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false });
      io.emit('user:offline', { userId, username: socket.user.username });
      console.log(`🔴 ${socket.user.username} desconectado`);
    });
  });

  return onlineUsers;
};
