import type {
  Arrendatario,
  Documento,
  EstadoArrendatario,
} from '@prisma/client';

export type { Arrendatario, Documento, EstadoArrendatario };

export interface ArrendatarioWithRelations extends Arrendatario {
  departamento?: {
    id: string;
    nombre: string;
    direccion: string;
  } | null;
  documentos?: Documento[];
  contratos?: Array<{
    id: string;
    version: number;
    estado: string;
    fechaInicio: Date;
    fechaFin: Date;
  }>;
}