import { z } from 'zod';

import { RolUsuario } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener mínimo 8 caracteres')
  .max(100, 'La contraseña es demasiado larga')
  .refine(
    (v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v),
    'La contraseña debe contener al menos una letra y un número',
  );

export const registerSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(150),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: passwordSchema,
  rol: z.nativeEnum(RolUsuario).optional(),
});

export const updateUserSchema = z
  .object({
    nombre: z.string().min(1).max(150).optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    password: passwordSchema.optional(),
    rol: z.nativeEnum(RolUsuario).optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Debe enviar al menos un campo a actualizar');

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;