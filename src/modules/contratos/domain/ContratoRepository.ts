import type { Prisma } from '@prisma/client';

import type {
  Clausula,
  ContratoCompleto,
  DocumentoContrato,
  EnvioFirma,
  EstadoContrato,
  EstadoFirma,
  Firma,
  HistorialContrato,
  TipoFirma,
} from './Contrato.js';

export interface ContratoFilters {
  departamentoId?: string;
  arrendatarioId?: string;
  estado?: EstadoContrato;
}

export interface ContratoRepository {
  findMany(filters: ContratoFilters): Promise<ContratoCompleto[]>;
  findById(id: string): Promise<ContratoCompleto | null>;
  findCurrentByDepartamento(departamentoId: string): Promise<ContratoCompleto | null>;
  create(data: Prisma.ContratoCreateInput): Promise<ContratoCompleto>;
  update(id: string, data: Prisma.ContratoUpdateInput): Promise<ContratoCompleto>;
  delete(id: string): Promise<void>;

  // Sub-entities
  addClausula(contratoId: string, texto: string, orden: number): Promise<Clausula>;
  updateClausula(id: string, texto: string): Promise<Clausula>;
  removeClausula(id: string): Promise<void>;

  addFirma(data: { contratoId: string; nombre: string; email?: string; tipo: TipoFirma; estado?: EstadoFirma; fecha?: Date }): Promise<Firma>;
  updateFirmaEstado(id: string, estado: EstadoFirma): Promise<Firma>;
  removeFirma(id: string): Promise<void>;

  addEnvioFirma(data: {
    contratoId: string;
    nombre: string;
    email: string;
    token?: string;
    estado?: EstadoFirma;
  }): Promise<EnvioFirma>;
  findEnvioFirmaByToken(token: string): Promise<EnvioFirma | null>;
  markEnvioFirmaFirmado(id: string, data: { nombreLegal: string; firmaData: string }): Promise<EnvioFirma>;
  removeEnvioFirma(id: string): Promise<void>;

  addDocumento(data: { contratoId: string; nombre: string; tipo: string; url: string; fecha?: Date }): Promise<DocumentoContrato>;
  removeDocumento(id: string): Promise<void>;

  addHistorial(data: { contratoId: string; version: number; fecha: Date; cambios: string }): Promise<HistorialContrato>;
}