import type {
  Reparacion,
  PrioridadReparacion,
  EstadoReparacion,
  TipoReparacion,
  ServicioActivo,
  FrecuenciaServicio,
  EstadoServicio,
} from '@prisma/client';

export type {
  Reparacion,
  PrioridadReparacion,
  EstadoReparacion,
  TipoReparacion,
  ServicioActivo,
  FrecuenciaServicio,
  EstadoServicio,
};

export interface ReparacionWithRelations extends Reparacion {
  departamento?: {
    id: string;
    nombre: string;
    direccion?: string;
    arrendatario?: { nombre: string; email: string; telefono: string } | null;
  } | null;
  solicitante?: { id: string; nombre: string } | null;
  fotos?: FotoReparacion[];
}

export interface FotoReparacion {
  id: string;
  nombreArchivo: string;
  mimeType: string;
  datos: string;
  observacion: string | null;
  createdAt: Date;
}

export interface ServicioActivoWithRelations extends ServicioActivo {
  departamento?: { id: string; nombre: string } | null;
}
