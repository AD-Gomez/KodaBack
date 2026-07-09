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
  departamento?: { id: string; nombre: string } | null;
  solicitante?: { id: string; nombre: string } | null;
}

export interface ServicioActivoWithRelations extends ServicioActivo {
  departamento?: { id: string; nombre: string } | null;
}