import { z } from 'zod';

const tipoInspeccion = z.enum(['ENTRADA', 'SALIDA', 'RUTINA']);
const estadoInspeccion = z.enum(['EN_CURSO', 'COMPLETADA']);
const condicionInspeccion = z.enum(['SIN_REVISAR', 'BIEN', 'OBSERVACION', 'DANO']);

export const inspeccionIdParamSchema = z.object({ id: z.string().uuid('ID inválido') });

export const ambienteParamSchema = z.object({
  id: z.string().uuid('ID de inspección inválido'),
  ambienteId: z.string().uuid('ID de ambiente inválido'),
});

export const fotoParamSchema = z.object({
  id: z.string().uuid('ID de inspección inválido'),
  fotoId: z.string().uuid('ID de foto inválido'),
});

export const listInspeccionesQuerySchema = z.object({
  departamentoId: z.string().uuid().optional(),
  estado: estadoInspeccion.optional(),
  tipo: tipoInspeccion.optional(),
});

export const createInspeccionSchema = z.object({
  departamentoId: z.string().uuid(),
  tipo: tipoInspeccion,
});

export const updateInspeccionSchema = z.object({
  estado: estadoInspeccion.optional(),
  tipo: tipoInspeccion.optional(),
  notasGenerales: z.string().max(4000).nullable().optional(),
});

export const createAmbienteSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  requerido: z.boolean().optional().default(false),
});

export const updateAmbienteSchema = z.object({
  nombre: z.string().trim().min(2).max(80).optional(),
  condicion: condicionInspeccion.optional(),
  observaciones: z.string().max(2000).nullable().optional(),
});

export const uploadFotoSchema = z.object({
  nombreArchivo: z.string().trim().min(1).max(180),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  datos: z
    .string()
    .max(6_000_000, 'La imagen supera el tamaño permitido')
    .regex(/^data:image\/(jpeg|png|webp);base64,/, 'Formato de imagen inválido'),
  observacion: z.string().max(500).nullable().optional(),
});

export type ListInspeccionesQuery = z.infer<typeof listInspeccionesQuerySchema>;
export type CreateInspeccionDto = z.infer<typeof createInspeccionSchema>;
export type UpdateInspeccionDto = z.infer<typeof updateInspeccionSchema>;
export type CreateAmbienteDto = z.infer<typeof createAmbienteSchema>;
export type UpdateAmbienteDto = z.infer<typeof updateAmbienteSchema>;
export type UploadFotoDto = z.infer<typeof uploadFotoSchema>;
