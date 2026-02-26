import Movie from '../models/movie.model.js';
import { handleHttpError } from '../utils/handleError.js';

// Crear nueva película
export const createMovie = async (req, res) => {
  try {
    const { title, director, year, genre, copies, availableCopies, timesRented, cover } = req.body;

    const newMovie = new Movie({
      title,
      director,
      year,
      genre,
      copies: copies || 5,
      availableCopies: availableCopies || 5,
      timesRented: timesRented || 0,
      cover: cover || null,
    });

    await newMovie.save();
    console.log("Película guardada:", newMovie);  
    res.status(201).json({ data: newMovie });
  } catch (error) {
    handleHttpError(res, error.message, 400);
  }
};

// Actualizar película
export const updateMovie = async (req, res) => {
  try {
    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedMovie) {
      return handleHttpError(res, 'Película no encontrada', 404);
    }

    res.json({ data: updatedMovie });
  } catch (error) {
    handleHttpError(res, error.message, 400);
  }
};

// Eliminar película
export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return handleHttpError(res, 'Película no encontrada', 404);
    }

    res.status(204).send();
  } catch (error) {
    handleHttpError(res, error.message, 400);
  }
};

// Alquilar película
export const rentMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return handleHttpError(res, 'Película no encontrada', 404);
    }

    if (movie.availableCopies === 0) {
      return handleHttpError(res, 'No hay copias disponibles para alquilar', 400);
    }

    movie.availableCopies -= 1;
    movie.timesRented += 1;
    await movie.save();

    res.json({ data: movie });
  } catch (error) {
    handleHttpError(res, error.message, 400);
  }
};

// Devolver película
export const returnMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return handleHttpError(res, 'Película no encontrada', 404);
    }

    movie.availableCopies += 1;
    await movie.save();

    res.json({ data: movie });
  } catch (error) {
    handleHttpError(res, error.message, 400);
  }
};

// Subir carátula
export const uploadCover = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return handleHttpError(res, 'Película no encontrada', 404);
    }

    const cover = req.file.filename;
    movie.cover = cover;
    await movie.save();

    res.json({ data: movie });
  } catch (error) {
    handleHttpError(res, error.message, 400);
  }
};

// Obtener carátula
export const getCover = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie || !movie.cover) {
      return handleHttpError(res, 'Carátula no encontrada', 404);
    }

    res.sendFile(join(process.cwd(), 'storage', movie.cover));
  } catch (error) {
    handleHttpError(res, error.message, 400);
  }
};

// Obtener todas las películas
export const getMovies = async (req, res) => {
  try {
    const { genre, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (genre) {
      filter.genre = genre;
    }

    const skip = (page - 1) * limit;
    
    const [movies, total] = await Promise.all([
      Movie.find(filter).skip(skip).limit(Number(limit)),
      Movie.countDocuments(filter),
    ]);

    res.json({
      data: movies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    handleHttpError(res, 'Error obteniendo películas', 500);
  }
};

// Obtener película por ID
export const getMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return handleHttpError(res, 'Película no encontrada', 404);
    }
    res.json({ data: movie });
  } catch (error) {
    handleHttpError(res, 'Error obteniendo película', 500);
  }
};