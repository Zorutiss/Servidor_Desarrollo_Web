import { z } from 'zod';
import { createMovieSchema } from './movie.schema.js';

export const updateMovieSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'ID no válido')
      .optional()
      .nullable(),
  }),
  body: createMovieSchema.shape.body.partial(),  
});