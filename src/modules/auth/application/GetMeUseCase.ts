import type { PublicUser } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';

export class GetMeUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(usuarioId: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(usuarioId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    const { passwordHash, ...publicUser } = user;
    void passwordHash;
    return publicUser;
  }
}