import type { Prisma, PrismaClient } from '@prisma/client';

import type { ServicioActivoWithRelations } from '../domain/Reparacion.js';
import type {
  ServicioActivoRepository,
  ServicioFilters,
} from '../domain/ReparacionRepository.js';

const RELATIONS = {
  departamento: { select: { id: true, nombre: true } },
} as const;

export class PrismaServicioActivoRepository implements ServicioActivoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: ServicioFilters): Promise<ServicioActivoWithRelations[]> {
    const where: Prisma.ServicioActivoWhereInput = {};
    if (filters.estado) where.estado = filters.estado;
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.departamentoId) where.departamentoId = filters.departamentoId;
    if (filters.frecuencia) where.frecuencia = filters.frecuencia;
    return this.prisma.servicioActivo.findMany({
      where,
      orderBy: { proximaFecha: 'asc' },
      include: RELATIONS,
    });
  }

  async findById(id: string): Promise<ServicioActivoWithRelations | null> {
    return this.prisma.servicioActivo.findUnique({ where: { id }, include: RELATIONS });
  }

  async create(data: Prisma.ServicioActivoCreateInput): Promise<ServicioActivoWithRelations> {
    return this.prisma.servicioActivo.create({ data, include: RELATIONS });
  }

  async update(id: string, data: Prisma.ServicioActivoUpdateInput): Promise<ServicioActivoWithRelations> {
    return this.prisma.servicioActivo.update({ where: { id }, data, include: RELATIONS });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.servicioActivo.delete({ where: { id } });
  }
}