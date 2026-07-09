import { UnauthorizedError } from '../../../shared/errors/index.js';
import {
  signAccessToken,
  signRefreshToken,
  refreshExpiresAt,
  verifyRefreshToken,
} from '../../../shared/utils/jwt.js';

import type { RefreshTokenRepository } from '../domain/RefreshTokenRepository.js';
import type { UserRepository } from '../domain/UserRepository.js';
import type { AuthTokens } from './LoginUseCase.js';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(refreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    const stored = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!stored || stored.revoked) {
      throw new UnauthorizedError('Refresh token revocado');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.activo) {
      throw new UnauthorizedError('Usuario no disponible');
    }

    // Rotación de refresh token
    await this.refreshTokenRepository.revoke(stored.id);

    const newAccess = signAccessToken({
      sub: user.id,
      email: user.email,
      rol: user.rol,
    });
    const newRefresh = signRefreshToken({ sub: user.id });

    await this.refreshTokenRepository.create({
      token: newRefresh,
      usuarioId: user.id,
      expiresAt: refreshExpiresAt(),
    });

    return { accessToken: newAccess, refreshToken: newRefresh };
  }
}