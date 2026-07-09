export interface RefreshTokenRepository {
  create(data: { token: string; usuarioId: string; expiresAt: Date }): Promise<void>;
  findByToken(token: string): Promise<{ id: string; usuarioId: string; revoked: boolean } | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(usuarioId: string): Promise<void>;
}