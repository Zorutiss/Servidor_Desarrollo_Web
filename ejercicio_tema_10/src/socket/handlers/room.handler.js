import Room from '../../models/room.model.js';
import Message from '../../models/message.model.js';

export const registerRoomHandlers = (io, socket, onlineUsers) => {

  // Unirse a sala
  socket.on('room:join', async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId).populate('members', 'username avatar isOnline');
      if (!room) return socket.emit('error', { message: 'Sala no encontrada' });

      // Añadir a miembros si no está
      if (!room.members.find(m => m._id.toString() === socket.user._id.toString())) {
        await Room.findByIdAndUpdate(roomId, { $addToSet: { members: socket.user._id } });
      }

      socket.join(roomId);

      // Historial de mensajes (últimos 50)
      const messages = await Message.find({ room: roomId })
        .populate('user', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(50);

      // Usuarios online en la sala
      const roomSockets = await io.in(roomId).fetchSockets();
      const usersInRoom = roomSockets.map(s => ({
        _id: s.user._id,
        username: s.user.username,
        avatar: s.user.avatar,
      }));

      socket.emit('room:joined', {
        room: { _id: room._id, name: room.name, description: room.description },
        messages: messages.reverse(),
        users: usersInRoom,
      });

      // Notificar a los demás
      socket.to(roomId).emit('room:user-joined', {
        user: { _id: socket.user._id, username: socket.user.username, avatar: socket.user.avatar },
      });

    } catch (e) {
      socket.emit('error', { message: e.message });
    }
  });

  // Salir de sala
  socket.on('room:leave', async ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('room:user-left', {
      user: { _id: socket.user._id, username: socket.user.username },
    });
  });
};
