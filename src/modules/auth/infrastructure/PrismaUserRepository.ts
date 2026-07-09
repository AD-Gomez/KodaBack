import { Prisma, type PrismaClient } from '@prisma/client';

import type { User } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  async findMany(params: { skip: number; take: number; search?: string }): Promise<User[]> {
    const where: Prisma.UsuarioWhereInput = params.search
      ? {
          OR: [
            { nombre: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {};
    return this.prisma.usuario.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { nombre: 'asc' },
    });
  }

  async count(search?: string): Promise<number> {
    const where: Prisma.UsuarioWhereInput = search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    return this.prisma.usuario.count({ where });
  }

  async create(data: Prisma.UsuarioCreateInput): Promise<User> {
    return this.prisma.usuario.create({ data });
  }

  async update(id: string, data: Prisma.UsuarioUpdateInput): Promise<User> {
    return this.prisma.usuario.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }
}