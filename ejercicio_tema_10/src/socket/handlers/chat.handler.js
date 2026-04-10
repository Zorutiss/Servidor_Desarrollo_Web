import Message from '../../models/message.model.js';

export const registerChatHandlers = (io, socket) => {

  // Enviar mensaje
  socket.on('chat:message', async ({ roomId, content }) => {
    try {
      if (!content?.trim()) return;

      const message = await Message.create({
        room: roomId,
        user: socket.user._id,
        content: content.trim(),
      });

      const populated = await message.populate('user', 'username avatar');

      io.to(roomId).emit('chat:message', {
        _id: populated._id,
        content: populated.content,
        user: populated.user,
        timestamp: populated.createdAt,
        roomId,
      });
    } catch (e) {
      socket.emit('error', { message: e.message });
    }
  });

  // Indicador escribiendo
  let typingTimeout;
  socket.on('chat:typing', ({ roomId }) => {
    socket.to(roomId).emit('chat:typing', {
      user: { _id: socket.user._id, username: socket.user.username },
      roomId,
    });

    // Auto-stop typing después de 3 segundos
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.to(roomId).emit('chat:stop-typing', {
        user: { _id: socket.user._id, username: socket.user.username },
        roomId,
      });
    }, 3000);
  });
};
