import type { RefreshTokenRepository } from '../domain/RefreshTokenRepository.js';

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async execute(refreshToken: string | undefined, usuarioId: string): Promise<void> {
    if (refreshToken) {
      const stored = await this.refreshTokenRepository.findByToken(refreshToken);
      if (stored) {
        await this.refreshTokenRepository.revoke(stored.id);
      }
    } else {
      await this.refreshTokenRepository.revokeAllForUser(usuarioId);
    }
  }
}