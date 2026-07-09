import type { Prisma } from '@prisma/client';

import type { DepartamentoWithRelations, EstadoDepartamento } from './Departamento.js';

export interface DepartamentoFilters {
  estado?: EstadoDepartamento;
  search?: string;
}

export interface DepartamentoRepository {
  findMany(params: {
    filters: DepartamentoFilters;
    skip: number;
    take: number;
  }): Promise<DepartamentoWithRelations[]>;
  count(filters: DepartamentoFilters): Promise<number>;
  findById(id: string): Promise<DepartamentoWithRelations | null>;
  create(data: Prisma.DepartamentoCreateInput): Promise<DepartamentoWithRelations>;
  update(id: string, data: Prisma.DepartamentoUpdateInput): Promise<DepartamentoWithRelations>;
  delete(id: string): Promise<void>;
  getStats(): Promise<DepartamentoStats>;
}

export interface DepartamentoStats {
  total: number;
  ocupados: number;
  vacios: number;
  mantenimiento: number;
  reservados: number;
  ocupacionPorcentaje: number;
  ingresoMensual: number;
  profitMensual: number;
  inversionTotal: number;
}