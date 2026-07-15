import type { PrismaClient } from '@prisma/client';

import type {
  CreateNotificacionInput,
  Notificacion,
  NotificacionRepository,
} from '../domain/NotificacionRepository.js';

export class PrismaNotificacionRepository implements NotificacionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUsuario(usuarioId: string, limit: number): Promise<Notificacion[]> {
    return this.prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async upsert(data: CreateNotificacionInput): Promise<Notificacion> {
    return this.prisma.notificacion.upsert({
      where: {
        usuarioId_clave: {
          usuarioId: data.usuarioId,
          clave: data.clave,
        },
      },
      create: data,
      update: {},
    });
  }

  async markAsRead(id: string, usuarioId: string): Promise<Notificacion | null> {
    const result = await this.prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leidaAt: new Date() },
    });
    if (result.count === 0) return null;
    return this.prisma.notificacion.findUnique({ where: { id } });
  }

  async markAllAsRead(usuarioId: string): Promise<number> {
    const result = await this.prisma.notificacion.updateMany({
      where: { usuarioId, leidaAt: null },
      data: { leidaAt: new Date() },
    });
    return result.count;
  }
}
