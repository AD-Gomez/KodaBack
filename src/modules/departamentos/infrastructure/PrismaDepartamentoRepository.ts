import { Prisma, type PrismaClient } from '@prisma/client';

import type {
  DepartamentoFilters,
  DepartamentoRepository,
  DepartamentoStats,
} from '../domain/DepartamentoRepository.js';
import type { DepartamentoWithRelations } from '../domain/Departamento.js';

const RELATIONS = {
  arrendatario: {
    select: { id: true, nombre: true, telefono: true, email: true },
  },
  _count: {
    select: { contratos: true, reparaciones: true },
  },
} as const;

export class PrismaDepartamentoRepository implements DepartamentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private buildWhere(filters: DepartamentoFilters): Prisma.DepartamentoWhereInput {
    const where: Prisma.DepartamentoWhereInput = {};
    if (filters.estado) where.estado = filters.estado;
    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { direccion: { contains: filters.search, mode: 'insensitive' } },
        { puntoReferencia: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async findMany(params: {
    filters: DepartamentoFilters;
    skip: number;
    take: number;
  }): Promise<DepartamentoWithRelations[]> {
    return this.prisma.departamento.findMany({
      where: this.buildWhere(params.filters),
      skip: params.skip,
      take: params.take,
      orderBy: { nombre: 'asc' },
      include: RELATIONS,
    });
  }

  async count(filters: DepartamentoFilters): Promise<number> {
    return this.prisma.departamento.count({ where: this.buildWhere(filters) });
  }

  async findById(id: string): Promise<DepartamentoWithRelations | null> {
    return this.prisma.departamento.findUnique({
      where: { id },
      include: RELATIONS,
    });
  }

  async create(data: Prisma.DepartamentoCreateInput): Promise<DepartamentoWithRelations> {
    return this.prisma.departamento.create({ data, include: RELATIONS });
  }

  async update(id: string, data: Prisma.DepartamentoUpdateInput): Promise<DepartamentoWithRelations> {
    return this.prisma.departamento.update({ where: { id }, data, include: RELATIONS });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.departamento.delete({ where: { id } });
  }

  async getStats(): Promise<DepartamentoStats> {
    const [total, ocupados, vacios, mantenimiento, reservados, financialAgg] =
      await Promise.all([
        this.prisma.departamento.count(),
        this.prisma.departamento.count({ where: { estado: 'OCUPADO' } }),
        this.prisma.departamento.count({ where: { estado: 'VACIO' } }),
        this.prisma.departamento.count({ where: { estado: 'MANTENIMIENTO' } }),
        this.prisma.departamento.count({ where: { estado: 'RESERVADO' } }),
        this.prisma.departamento.aggregate({
          _sum: { alquiler: true, montoCompra: true },
          where: { estado: 'OCUPADO' },
        }),
      ]);

    const ingresoMensual = Number(financialAgg._sum.alquiler ?? 0);
    const inversionTotal = Number(financialAgg._sum.montoCompra ?? 0);
    const profitMensual = Math.round(ingresoMensual * 0.65);
    const ocupacionPorcentaje = total === 0 ? 0 : Math.round((ocupados / total) * 100);

    return {
      total,
      ocupados,
      vacios,
      mantenimiento,
      reservados,
      ocupacionPorcentaje,
      ingresoMensual,
      profitMensual,
      inversionTotal,
    };
  }
}