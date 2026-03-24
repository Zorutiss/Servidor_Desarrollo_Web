import mongoose from 'mongoose';

const podcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      minlength: [3, 'El título debe tener al menos 3 caracteres'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El autor es requerido'],
    },
    category: {
      type: String,
      enum: ['tech', 'science', 'history', 'comedy', 'news'],
    },
    duration: {
      type: Number,
      min: [60, 'La duración mínima es 60 segundos'],
    },
    episodes: {
      type: Number,
      default: 1,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Podcast = mongoose.model('Podcast', podcastSchema);
export default Podcast;
