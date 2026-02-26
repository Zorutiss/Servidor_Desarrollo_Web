import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      minlength: 2,
    },
    director: {
      type: String,
      required: [true, 'El director es requerido'],
    },
    year: {
      type: Number,
      required: [true, 'El año es requerido'],
      min: [1888, 'El año debe ser igual o mayor a 1888'],
      max: [new Date().getFullYear(), 'El año no puede ser mayor al actual'],
    },
    genre: {
      type: String,
      enum: ['action', 'comedy', 'drama', 'horror', 'scifi'],
      required: [true, 'El género es requerido'],
    },
    copies: {
      type: Number,
      default: 5,
    },
    availableCopies: {
      type: Number,
      default: 5,
    },
    timesRented: {
      type: Number,
      default: 0,
    },
    cover: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const Movie = mongoose.model('Movie', movieSchema);

export default Movie;