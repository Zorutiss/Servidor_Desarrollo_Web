import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  postal: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
}).optional();

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  projectCode: z.string().trim().min(1, 'El código de proyecto es requerido'),
  client: z.string().min(1, 'El cliente es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: addressSchema,
  notes: z.string().trim().optional(),
});
