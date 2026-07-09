import { ConflictError } from '../../../shared/errors/index.js';
import { hashPassword } from '../../../shared/utils/password.js';

import type { PublicUser, User } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';

export interface RegisterUserInput {
  nombre: string;
  email: string;
  password: string;
  rol?: User['rol'];
}

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: RegisterUserInput): Promise<PublicUser> {
    const email = input.email.toLowerCase();

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Ya existe un usuario con ese email');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await this.userRepository.create({
      nombre: input.nombre,
      email,
      passwordHash,
      rol: input.rol ?? 'ABOGADO',
      activo: true,
    });

    const { passwordHash: _ph, ...publicUser } = user;
    void _ph;
    return publicUser;
  }
}