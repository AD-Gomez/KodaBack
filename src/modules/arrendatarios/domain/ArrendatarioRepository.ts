import type { Prisma } from '@prisma/client';

import type { ArrendatarioWithRelations, EstadoArrendatario } from './Arrendatario.js';

export interface ArrendatarioFilters {
  estado?: EstadoArrendatario;
  departamentoId?: string;
  search?: string;
}

export interface ArrendatarioRepository {
  findMany(params: {
    filters: ArrendatarioFilters;
    skip: number;
    take: number;
  }): Promise<ArrendatarioWithRelations[]>;
  count(filters: ArrendatarioFilters): Promise<number>;
  findById(id: string): Promise<ArrendatarioWithRelations | null>;
  findByEmail(email: string): Promise<ArrendatarioWithRelations | null>;
  findByDepartamentoId(departamentoId: string): Promise<ArrendatarioWithRelations | null>;
  create(data: Prisma.ArrendatarioCreateInput): Promise<ArrendatarioWithRelations>;
  update(id: string, data: Prisma.ArrendatarioUpdateInput): Promise<ArrendatarioWithRelations>;
  delete(id: string): Promise<void>;
}