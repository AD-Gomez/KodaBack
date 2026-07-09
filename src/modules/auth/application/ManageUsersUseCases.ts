import { ConflictError, NotFoundError } from '../../../shared/errors/index.js';
import { hashPassword } from '../../../shared/utils/password.js';

import type { PublicUser, User } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';

export interface UpdateUserInput {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: User['rol'];
  activo?: boolean;
}

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario');
    }

    const data: Record<string, unknown> = {};
    if (input.nombre !== undefined) data.nombre = input.nombre;
    if (input.email !== undefined) data.email = input.email.toLowerCase();
    if (input.rol !== undefined) data.rol = input.rol;
    if (input.activo !== undefined) data.activo = input.activo;
    if (input.password !== undefined) {
      data.passwordHash = await hashPassword(input.password);
    }

    const updated = await this.userRepository.update(id, data);
    const { passwordHash: _ph, ...publicUser } = updated;
    void _ph;
    return publicUser;
  }
}

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ data: PublicUser[]; total: number }> {
    const skip = (params.page - 1) * params.limit;
    const [users, total] = await Promise.all([
      this.userRepository.findMany({ skip, take: params.limit, search: params.search }),
      this.userRepository.count(params.search),
    ]);
    const data = users.map((u) => {
      const { passwordHash: _ph, ...rest } = u;
      void _ph;
      return rest;
    });
    return { data, total };
  }
}

export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario');
    }
    try {
      await this.userRepository.delete(id);
    } catch {
      throw new ConflictError('No se puede eliminar el usuario (puede tener datos relacionados)');
    }
  }
}