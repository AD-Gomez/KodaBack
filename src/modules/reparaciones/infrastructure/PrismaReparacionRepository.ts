import type { Prisma, PrismaClient } from '@prisma/client';

import type {
  ReparacionStats,
  ReparacionFilters,
  ReparacionRepository,
} from '../domain/ReparacionRepository.js';
import type { ReparacionWithRelations } from '../domain/Reparacion.js';

const RELATIONS = {
  departamento: { select: { id: true, nombre: true } },
  solicitante: { select: { id: true, nombre: true } },
} as const;

export class PrismaReparacionRepository implements ReparacionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private buildWhere(filters: ReparacionFilters): Prisma.ReparacionWhereInput {
    const where: Prisma.ReparacionWhereInput = {};
    if (filters.estado) where.estado = filters.estado;
    if (filters.prioridad) where.prioridad = filters.prioridad;
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.departamentoId) where.departamentoId = filters.departamentoId;
    if (filters.search) {
      where.OR = [
        { titulo: { contains: filters.search, mode: 'insensitive' } },
        { descripcion: { contains: filters.search, mode: 'insensitive' } },
        { tecnico: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async findMany(params: {
    filters: ReparacionFilters;
    skip: number;
    take: number;
  }): Promise<ReparacionWithRelations[]> {
    return this.prisma.reparacion.findMany({
      where: this.buildWhere(params.filters),
      skip: params.skip,
      take: params.take,
      orderBy: [{ prioridad: 'desc' }, { fechaSolicitud: 'desc' }],
      include: RELATIONS,
    });
  }

  async count(filters: ReparacionFilters): Promise<number> {
    return this.prisma.reparacion.count({ where: this.buildWhere(filters) });
  }

  async findById(id: string): Promise<ReparacionWithRelations | null> {
    return this.prisma.reparacion.findUnique({ where: { id }, include: RELATIONS });
  }

  async create(data: Prisma.ReparacionCreateInput): Promise<ReparacionWithRelations> {
    return this.prisma.reparacion.create({ data, include: RELATIONS });
  }

  async update(id: string, data: Prisma.ReparacionUpdateInput): Promise<ReparacionWithRelations> {
    return this.prisma.reparacion.update({ where: { id }, data, include: RELATIONS });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reparacion.delete({ where: { id } });
  }

  async getStats(): Promise<ReparacionStats> {
    const [total, pendientes, enProceso, completadas, urgentes, financialAgg] = await Promise.all([
      this.prisma.reparacion.count(),
      this.prisma.reparacion.count({ where: { estado: 'PENDIENTE' } }),
      this.prisma.reparacion.count({ where: { estado: 'EN_PROCESO' } }),
      this.prisma.reparacion.count({ where: { estado: 'COMPLETADA' } }),
      this.prisma.reparacion.count({
        where: { prioridad: 'URGENTE', estado: { not: 'COMPLETADA' } },
      }),
      this.prisma.reparacion.aggregate({ _sum: { costo: true } }),
    ]);
    return {
      total,
      pendientes,
      enProceso,
      completadas,
      urgentes,
      inversionTotal: Number(financialAgg._sum.costo ?? 0),
    };
  }
}