import { Router } from 'express';
import Room from '../models/room.model.js';
import Message from '../models/message.model.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json({ rooms });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre es requerido' });

    const exists = await Room.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Ya existe una sala con ese nombre' });

    const room = await Room.create({
      name,
      description,
      isPrivate: isPrivate || false,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({ room });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const query = { room: req.params.id };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ messages: messages.reverse() });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
