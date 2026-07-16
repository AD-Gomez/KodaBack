import type { Prisma, PrismaClient } from '@prisma/client';

import type { ArrendatarioWithRelations } from '../domain/Arrendatario.js';
import type {
  ArrendatarioFilters,
  ArrendatarioRepository,
} from '../domain/ArrendatarioRepository.js';

const RELATIONS = {
  departamento: { select: { id: true, nombre: true, direccion: true } },
  documentos: true,
  contratos: {
    select: {
      id: true,
      version: true,
      estado: true,
      fechaInicio: true,
      fechaFin: true,
    },
    orderBy: { version: 'desc' as const },
  },
} as const;

export class PrismaArrendatarioRepository implements ArrendatarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private buildWhere(filters: ArrendatarioFilters): Prisma.ArrendatarioWhereInput {
    const where: Prisma.ArrendatarioWhereInput = {};
    if (filters.estado) where.estado = filters.estado;
    if (filters.departamentoId) where.departamentoId = filters.departamentoId;
    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async findMany(params: {
    filters: ArrendatarioFilters;
    skip: number;
    take: number;
  }): Promise<ArrendatarioWithRelations[]> {
    return this.prisma.arrendatario.findMany({
      where: this.buildWhere(params.filters),
      skip: params.skip,
      take: params.take,
      orderBy: { nombre: 'asc' },
      include: RELATIONS,
    });
  }

  async count(filters: ArrendatarioFilters): Promise<number> {
    return this.prisma.arrendatario.count({ where: this.buildWhere(filters) });
  }

  async findById(id: string): Promise<ArrendatarioWithRelations | null> {
    return this.prisma.arrendatario.findUnique({ where: { id }, include: RELATIONS });
  }

  async findByEmail(email: string): Promise<ArrendatarioWithRelations | null> {
    return this.prisma.arrendatario.findUnique({
      where: { email: email.toLowerCase() },
      include: RELATIONS,
    });
  }

  async findByDepartamentoId(departamentoId: string): Promise<ArrendatarioWithRelations | null> {
    return this.prisma.arrendatario.findUnique({
      where: { departamentoId },
      include: RELATIONS,
    });
  }

  async create(data: Prisma.ArrendatarioCreateInput): Promise<ArrendatarioWithRelations> {
    return this.prisma.arrendatario.create({ data, include: RELATIONS });
  }

  async update(id: string, data: Prisma.ArrendatarioUpdateInput): Promise<ArrendatarioWithRelations> {
    return this.prisma.arrendatario.update({ where: { id }, data, include: RELATIONS });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.arrendatario.delete({ where: { id } });
  }
}