import type { PrismaClient } from '@prisma/client';

import type { RefreshTokenRepository } from '../domain/RefreshTokenRepository.js';

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: { token: string; usuarioId: string; expiresAt: Date }): Promise<void> {
    await this.prisma.refreshToken.create({ data });
  }

  async findByToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      select: { id: true, usuarioId: true, revoked: true, expiresAt: true },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({ where: { id }, data: { revoked: true } });
  }

  async revokeAllForUser(usuarioId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId, revoked: false },
      data: { revoked: true },
    });
  }
}