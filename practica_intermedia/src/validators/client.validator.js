import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  postal: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
}).optional();

export const clientSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  cif: z.string().trim().min(1, 'El CIF es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  address: addressSchema,
});
