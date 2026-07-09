import type {
  Contrato,
  Clausula,
  Firma,
  EnvioFirma,
  DocumentoContrato,
  HistorialContrato,
  EstadoContrato,
  EstadoFirma,
  TipoFirma,
} from '@prisma/client';

export type {
  Contrato,
  Clausula,
  Firma,
  EnvioFirma,
  DocumentoContrato,
  HistorialContrato,
  EstadoContrato,
  EstadoFirma,
  TipoFirma,
};

export interface ContratoCompleto extends Contrato {
  departamento?: { id: string; nombre: string; direccion: string };
  arrendatario?: { id: string; nombre: string; email: string };
  clausulas?: Clausula[];
  firmas?: Firma[];
  envios?: EnvioFirma[];
  documentos?: DocumentoContrato[];
  historial?: HistorialContrato[];
}