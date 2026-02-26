import { z } from 'zod';

export const createMovieSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'El título es requerido' })
      .min(2, 'El título debe tener al menos 2 caracteres')
      .max(200, 'El título no puede tener más de 200 caracteres'),
    director: z
      .string({ required_error: 'El director es requerido' })
      .min(2, 'El director debe tener al menos 2 caracteres')
      .max(100, 'El nombre del director no puede tener más de 100 caracteres'),
    year: z
      .number({ required_error: 'El año es requerido' })
      .min(1888, 'El año debe ser igual o mayor a 1888')
      .max(new Date().getFullYear(), `El año no puede ser mayor al año actual`),
    genre: z
      .enum(['action', 'comedy', 'drama', 'horror', 'scifi'], { required_error: 'El género es requerido' }),
    copies: z
      .number({ required_error: 'El número de copias es requerido' })
      .min(1, 'El número de copias debe ser al menos 1'),
    availableCopies: z
      .number()
      .min(0, 'El número de copias disponibles no puede ser negativo')
      .optional()
      .default(5),
    cover: z.string().url().optional().nullable(),
  }),
});