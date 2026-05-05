import { z } from 'zod';

const workerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del trabajador es requerido'),
  hours: z.number().min(0, 'Las horas no pueden ser negativas'),
});

const materialNoteSchema = z.object({
  format: z.literal('material'),
  client: z.string().min(1, 'El cliente es requerido'),
  project: z.string().min(1, 'El proyecto es requerido'),
  description: z.string().trim().optional(),
  workDate: z.string().min(1, 'La fecha de trabajo es requerida'),
  material: z.string().trim().min(1, 'El material es requerido'),
  quantity: z.number().min(0, 'La cantidad no puede ser negativa'),
  unit: z.string().trim().min(1, 'La unidad es requerida'),
});

const hoursNoteSchema = z.object({
  format: z.literal('hours'),
  client: z.string().min(1, 'El cliente es requerido'),
  project: z.string().min(1, 'El proyecto es requerido'),
  description: z.string().trim().optional(),
  workDate: z.string().min(1, 'La fecha de trabajo es requerida'),
  hours: z.number().min(0, 'Las horas no pueden ser negativas').optional(),
  workers: z.array(workerSchema).optional(),
});

export const deliveryNoteSchema = z.discriminatedUnion('format', [
  materialNoteSchema,
  hoursNoteSchema,
]);
