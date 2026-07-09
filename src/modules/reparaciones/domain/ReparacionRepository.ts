import type { Prisma } from '@prisma/client';

import type {
  EstadoReparacion,
  EstadoServicio,
  FrecuenciaServicio,
  PrioridadReparacion,
  ReparacionWithRelations,
  ServicioActivoWithRelations,
  TipoReparacion,
} from './Reparacion.js';

export interface ReparacionFilters {
  estado?: EstadoReparacion;
  prioridad?: PrioridadReparacion;
  tipo?: TipoReparacion;
  departamentoId?: string;
  search?: string;
}

export interface ServicioFilters {
  estado?: EstadoServicio;
  tipo?: TipoReparacion;
  departamentoId?: string;
  frecuencia?: FrecuenciaServicio;
}

export interface ReparacionRepository {
  findMany(params: {
    filters: ReparacionFilters;
    skip: number;
    take: number;
  }): Promise<ReparacionWithRelations[]>;
  count(filters: ReparacionFilters): Promise<number>;
  findById(id: string): Promise<ReparacionWithRelations | null>;
  create(data: Prisma.ReparacionCreateInput): Promise<ReparacionWithRelations>;
  update(id: string, data: Prisma.ReparacionUpdateInput): Promise<ReparacionWithRelations>;
  delete(id: string): Promise<void>;
  getStats(): Promise<ReparacionStats>;
}

export interface ServicioActivoRepository {
  findMany(filters: ServicioFilters): Promise<ServicioActivoWithRelations[]>;
  findById(id: string): Promise<ServicioActivoWithRelations | null>;
  create(data: Prisma.ServicioActivoCreateInput): Promise<ServicioActivoWithRelations>;
  update(id: string, data: Prisma.ServicioActivoUpdateInput): Promise<ServicioActivoWithRelations>;
  delete(id: string): Promise<void>;
}

export interface ReparacionStats {
  total: number;
  pendientes: number;
  enProceso: number;
  completadas: number;
  urgentes: number;
  inversionTotal: number;
}