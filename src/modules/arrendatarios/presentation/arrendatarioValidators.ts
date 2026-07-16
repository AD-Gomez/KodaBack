import { z } from 'zod';

const decimalPositive = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .refine((n) => !Number.isNaN(n) && n > 0, 'Debe ser un número mayor a 0');

const dateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida');

const estadoEnum = z.enum(['ACTIVO', 'INACTIVO', 'MOROSO', 'PENDIENTE']);

export const listArrendatariosQuerySchema = z.object({
  estado: estadoEnum.optional(),
  departamentoId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const createArrendatarioSchema = z.object({
  nombre: z.string().min(1).max(150),
  email: z.string().email().toLowerCase(),
  telefono: z.string().min(7).max(30),
  telefonoFamiliar: z.string().max(30).optional(),
  nombreFamiliar: z.string().max(150).optional(),
  direccion: z.string().max(255).optional(),
  departamentoId: z.string().uuid().optional(),
  fechaIngreso: dateString,
  estado: estadoEnum.optional().default('ACTIVO'),
  renta: decimalPositive,
  historialPagos: z.string().optional(),
  avatar: z.string().optional(),
  notas: z.string().optional(),
  fechaExpedicion: dateString,
  fechaVencimiento: dateString,
});

export const updateArrendatarioSchema = createArrendatarioSchema.partial();

export type ListArrendatariosQuery = z.infer<typeof listArrendatariosQuerySchema>;
export type CreateArrendatarioDto = z.infer<typeof createArrendatarioSchema>;
export type UpdateArrendatarioDto = z.infer<typeof updateArrendatarioSchema>;