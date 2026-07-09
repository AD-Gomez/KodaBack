import { UnauthorizedError } from '../../../shared/errors/index.js';
import { verifyPassword } from '../../../shared/utils/password.js';
import { signAccessToken, signRefreshToken, refreshExpiresAt } from '../../../shared/utils/jwt.js';

import type { RefreshTokenRepository } from '../domain/RefreshTokenRepository.js';
import type { UserRepository } from '../domain/UserRepository.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user || !user.activo) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const passwordValid = await verifyPassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      rol: user.rol,
    });

    const refreshToken = signRefreshToken({ sub: user.id });

    await this.refreshTokenRepository.create({
      token: refreshToken,
      usuarioId: user.id,
      expiresAt: refreshExpiresAt(),
    });

    return { accessToken, refreshToken };
  }
}