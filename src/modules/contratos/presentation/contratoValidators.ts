import { z } from 'zod';

const dateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida');

const estadoContratoEnum = z.enum(['BORRADOR', 'VIGENTE', 'VENCIDO', 'RENOVADO', 'CANCELADO']);
const estadoFirmaEnum = z.enum(['PENDIENTE', 'FIRMADO', 'RECHAZADO']);
const tipoFirmaEnum = z.enum(['ARRENDATARIO', 'PROPIETARIO', 'TESTIGO']);

export const uuidParam = z.object({ id: z.string().uuid('ID inválido') });

export const listContratosQuerySchema = z.object({
  departamentoId: z.string().uuid().optional(),
  arrendatarioId: z.string().uuid().optional(),
  estado: estadoContratoEnum.optional(),
});

export const createContratoSchema = z.object({
  departamentoId: z.string().uuid(),
  arrendatarioId: z.string().uuid(),
  version: z.coerce.number().int().min(1).optional().default(1),
  fechaInicio: dateString,
  fechaFin: dateString,
  estado: estadoContratoEnum.optional().default('BORRADOR'),
  titulo: z.string().trim().min(3).max(160).optional(),
  contenido: z.string().max(20000).optional(),
  url: z.string().url().optional(),
  clausulasIniciales: z.array(z.string().min(1)).optional(),
});

export const updateContratoSchema = z.object({
  fechaInicio: dateString.optional(),
  fechaFin: dateString.optional(),
  estado: estadoContratoEnum.optional(),
  titulo: z.string().trim().min(3).max(160).optional(),
  contenido: z.string().max(20000).optional(),
  url: z.string().url().optional(),
  version: z.coerce.number().int().min(1).optional(),
});

export const renovarContratoSchema = z.object({
  fechaInicio: dateString,
  fechaFin: dateString,
});

export const clausulaSchema = z.object({
  texto: z.string().min(1),
  orden: z.coerce.number().int().min(1),
});

export const updateClausulaSchema = z.object({
  texto: z.string().min(1),
});

export const firmaSchema = z.object({
  nombre: z.string().min(1).max(150),
  email: z.string().email().optional(),
  tipo: tipoFirmaEnum,
  estado: estadoFirmaEnum.optional().default('PENDIENTE'),
});

export const updateFirmaEstadoSchema = z.object({
  estado: estadoFirmaEnum,
});

export const envioFirmaSchema = z.object({
  nombre: z.string().min(1).max(150),
  email: z.string().email(),
});

export const documentoContratoSchema = z.object({
  nombre: z.string().min(1).max(200),
  tipo: z.string().min(1).max(50),
  url: z.string().url(),
  fecha: dateString.optional(),
});

export type CreateContratoDto = z.infer<typeof createContratoSchema>;
export type UpdateContratoDto = z.infer<typeof updateContratoSchema>;
export type RenovarContratoDto = z.infer<typeof renovarContratoSchema>;
export type ClausulaDto = z.infer<typeof clausulaSchema>;
export type UpdateClausulaDto = z.infer<typeof updateClausulaSchema>;
export type FirmaDto = z.infer<typeof firmaSchema>;
export type UpdateFirmaEstadoDto = z.infer<typeof updateFirmaEstadoSchema>;
export type EnvioFirmaDto = z.infer<typeof envioFirmaSchema>;
export type DocumentoContratoDto = z.infer<typeof documentoContratoSchema>;
