import Podcast from '../models/podcast.model.js';

export const getPublished = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const podcasts = await Podcast.find({ published: true })
      .populate('author', 'name email')
      .skip(skip)
      .limit(limit);

    const total = await Podcast.countDocuments({ published: true });

    return res.status(200).json({ podcasts, total, page, limit });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id).populate('author', 'name email');
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast no encontrado' });
    }
    return res.status(200).json({ podcast });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const podcast = await Podcast.create({
      ...req.body,
      author: req.user._id,
    });
    return res.status(201).json({ podcast });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast no encontrado' });
    }

    if (podcast.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el autor puede editar este podcast' });
    }

    const updated = await Podcast.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ podcast: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const podcast = await Podcast.findByIdAndDelete(req.params.id);
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast no encontrado' });
    }
    return res.status(200).json({ message: 'Podcast eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const podcasts = await Podcast.find().populate('author', 'name email');
    return res.status(200).json({ podcasts });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const togglePublish = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast no encontrado' });
    }
    podcast.published = !podcast.published;
    await podcast.save();
    return res.status(200).json({ podcast });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
