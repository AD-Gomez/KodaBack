import type { Prisma } from '@prisma/client';

import type { User } from './User.js';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findMany(params: {
    skip: number;
    take: number;
    search?: string;
  }): Promise<User[]>;
  count(search?: string): Promise<number>;
  create(data: Prisma.UsuarioCreateInput): Promise<User>;
  update(id: string, data: Prisma.UsuarioUpdateInput): Promise<User>;
  delete(id: string): Promise<void>;
}