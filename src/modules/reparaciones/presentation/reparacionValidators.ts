import { z } from 'zod';

const decimalOptional = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .refine((n) => !Number.isNaN(n) && n >= 0, 'Debe ser un número válido')
  .optional();

const decimalPositive = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .refine((n) => !Number.isNaN(n) && n > 0, 'Debe ser un número mayor a 0');

const dateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida');

const prioridadEnum = z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']);
const estadoReparacionEnum = z.enum(['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA']);
const tipoReparacionEnum = z.enum([
  'PLOMERIA',
  'ELECTRICA',
  'AIRE_ACONDICIONADO',
  'JARDINERIA',
  'CERRAJERIA',
  'PINTURA',
  'OTRO',
]);
const frecuenciaEnum = z.enum(['SEMANAL', 'QUINCENAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']);
const estadoServicioEnum = z.enum(['ACTIVO', 'PROGRAMADO', 'PAUSADO', 'CANCELADO']);

export const idParamSchema = z.object({ id: z.string().uuid('ID inválido') });

export const listReparacionesQuerySchema = z.object({
  estado: estadoReparacionEnum.optional(),
  prioridad: prioridadEnum.optional(),
  tipo: tipoReparacionEnum.optional(),
  departamentoId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createReparacionSchema = z.object({
  titulo: z.string().min(1).max(200),
  descripcion: z.string().min(1),
  departamentoId: z.string().uuid(),
  prioridad: prioridadEnum,
  estado: estadoReparacionEnum.optional().default('PENDIENTE'),
  fechaSolicitud: dateString,
  fechaProgramada: dateString.optional(),
  fechaCompletada: dateString.optional(),
  costo: decimalOptional,
  solicitanteId: z.string().uuid().optional(),
  tecnico: z.string().max(150).optional(),
  tipo: tipoReparacionEnum,
  notas: z.string().optional(),
});

export const updateReparacionSchema = createReparacionSchema.partial();

export const listServiciosQuerySchema = z.object({
  estado: estadoServicioEnum.optional(),
  tipo: tipoReparacionEnum.optional(),
  departamentoId: z.string().uuid().optional(),
  frecuencia: frecuenciaEnum.optional(),
});

export const createServicioSchema = z.object({
  nombre: z.string().min(1).max(200),
  departamentoId: z.string().uuid(),
  tipo: tipoReparacionEnum,
  frecuencia: frecuenciaEnum,
  proximaFecha: dateString,
  estado: estadoServicioEnum.optional().default('ACTIVO'),
  proveedor: z.string().max(150).optional(),
  costoMensual: decimalPositive,
});

export const updateServicioSchema = createServicioSchema.partial();

export type ListReparacionesQuery = z.infer<typeof listReparacionesQuerySchema>;
export type CreateReparacionDto = z.infer<typeof createReparacionSchema>;
export type UpdateReparacionDto = z.infer<typeof updateReparacionSchema>;
export type ListServiciosQuery = z.infer<typeof listServiciosQuerySchema>;
export type CreateServicioDto = z.infer<typeof createServicioSchema>;
export type UpdateServicioDto = z.infer<typeof updateServicioSchema>;