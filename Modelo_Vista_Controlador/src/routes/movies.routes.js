import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { createMovieSchema } from '../schemas/movie.schema.js';
import { updateMovieSchema } from '../schemas/updateMovie.schema.js';
import {
  createMovie,
  updateMovie,
  deleteMovie,
  rentMovie,
  returnMovie,
  uploadCover,
  getCover,
  getMovies,
  getMovie,
} from '../controllers/movies.controller.js';

const router = Router();

//Rutas de pelis
router.get('/', getMovies);
router.get('/:id', getMovie); 

router.post('/', validate(createMovieSchema), createMovie); 
router.put('/:id', validate(updateMovieSchema), updateMovie); 
router.delete('/:id', deleteMovie);  

//Alquiler y devolución
router.post('/:id/rent', rentMovie);  
router.post('/:id/return', returnMovie);  

//Caratulas
router.patch('/:id/cover', uploadCover);  
router.get('/:id/cover', getCover); 

export default router;