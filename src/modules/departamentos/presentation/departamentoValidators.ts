import { z } from 'zod';

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .refine((n) => !Number.isNaN(n) && n >= 0, 'Debe ser un número válido');

const decimalPositive = decimalString.refine((n) => n > 0, 'Debe ser mayor a 0');

const dateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida')
  .nullable()
  .optional();

const estadoEnum = z.enum(['OCUPADO', 'VACIO', 'MANTENIMIENTO', 'RESERVADO']);

export const listDepartamentosQuerySchema = z.object({
  estado: estadoEnum.optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const createDepartamentoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  direccion: z.string().min(1, 'La dirección es requerida').max(255),
  puntoReferencia: z.string().max(255).optional(),
  montoCompra: decimalPositive,
  alquiler: decimalPositive,
  distribucion: z.string().min(1, 'La distribución es requerida'),
  inmobiliario: z.string().min(1, 'El inmobiliario es requerido'),
  serviciosActivos: z.string().optional(),
  renovacionContrato: dateString,
  estado: estadoEnum.optional().default('VACIO'),
  imagen: z.string().optional(),
});

export const updateDepartamentoSchema = createDepartamentoSchema.partial();

export type ListDepartamentosQuery = z.infer<typeof listDepartamentosQuerySchema>;
export type CreateDepartamentoDto = z.infer<typeof createDepartamentoSchema>;
export type UpdateDepartamentoDto = z.infer<typeof updateDepartamentoSchema>;
