import { ConflictError } from '../../../shared/errors/index.js';

import type { ArrendatarioWithRelations, EstadoArrendatario } from '../domain/Arrendatario.js';
import type { ArrendatarioRepository } from '../domain/ArrendatarioRepository.js';

export interface CreateArrendatarioInput {
  nombre: string;
  email: string;
  telefono: string;
  telefonoFamiliar?: string;
  nombreFamiliar?: string;
  direccion?: string;
  departamentoId?: string;
  fechaIngreso: string;
  estado?: EstadoArrendatario;
  renta: number;
  historialPagos?: string | null;
  avatar?: string | null;
  notas?: string;
  tipoIdentidad: string;
  numeroIdentidad: string;
}

export class ListArrendatariosUseCase {
  constructor(private readonly repository: ArrendatarioRepository) {}

  async execute(params: {
    filters: { estado?: string; departamentoId?: string; search?: string };
    page: number;
    limit: number;
  }): Promise<{ data: ArrendatarioWithRelations[]; total: number }> {
    const skip = (params.page - 1) * params.limit;
    const filters = {
      estado: params.filters.estado as EstadoArrendatario | undefined,
      departamentoId: params.filters.departamentoId,
      search: params.filters.search,
    };
    const [data, total] = await Promise.all([
      this.repository.findMany({ filters, skip, take: params.limit }),
      this.repository.count(filters),
    ]);
    return { data, total };
  }
}

export class GetArrendatarioUseCase {
  constructor(private readonly repository: ArrendatarioRepository) {}

  async execute(id: string): Promise<ArrendatarioWithRelations> {
    const arrendatario = await this.repository.findById(id);
    if (!arrendatario) throw new Error('Arrendatario no encontrado');
    return arrendatario;
  }
}

export class CreateArrendatarioUseCase {
  constructor(private readonly repository: ArrendatarioRepository) {}

  async execute(input: CreateArrendatarioInput): Promise<ArrendatarioWithRelations> {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) throw new ConflictError('Ya existe un arrendatario con ese email');

    if (input.departamentoId) {
      const occupying = await this.repository.findByDepartamentoId(input.departamentoId);
      if (occupying) throw new ConflictError('El departamento ya tiene un arrendatario asignado');
    }

    return this.repository.create({
      nombre: input.nombre,
      email: input.email.toLowerCase(),
      telefono: input.telefono,
      telefonoFamiliar: input.telefonoFamiliar,
      nombreFamiliar: input.nombreFamiliar,
      direccion: input.direccion,
      departamento: input.departamentoId ? { connect: { id: input.departamentoId } } : undefined,
      fechaIngreso: new Date(input.fechaIngreso),
      estado: input.estado ?? 'ACTIVO',
      renta: input.renta,
      historialPagos: input.historialPagos,
      avatar: input.avatar,
      notas: input.notas,
      tipoIdentidad: input.tipoIdentidad,
      numeroIdentidad: input.numeroIdentidad,
    });
  }
}

export class UpdateArrendatarioUseCase {
  constructor(private readonly repository: ArrendatarioRepository) {}

  async execute(id: string, input: Partial<CreateArrendatarioInput>): Promise<ArrendatarioWithRelations> {
    const data: Record<string, unknown> = {};
    if (input.nombre !== undefined) data.nombre = input.nombre;
    if (input.email !== undefined) data.email = input.email.toLowerCase();
    if (input.telefono !== undefined) data.telefono = input.telefono;
    if (input.telefonoFamiliar !== undefined) data.telefonoFamiliar = input.telefonoFamiliar;
    if (input.nombreFamiliar !== undefined) data.nombreFamiliar = input.nombreFamiliar;
    if (input.direccion !== undefined) data.direccion = input.direccion;
    if (input.fechaIngreso !== undefined) data.fechaIngreso = new Date(input.fechaIngreso);
    if (input.estado !== undefined) data.estado = input.estado;
    if (input.renta !== undefined) data.renta = input.renta;
    if (input.historialPagos !== undefined) data.historialPagos = input.historialPagos;
    if (input.avatar !== undefined) data.avatar = input.avatar;
    if (input.notas !== undefined) data.notas = input.notas;
    if (input.tipoIdentidad !== undefined) data.tipoIdentidad = input.tipoIdentidad;
    if (input.numeroIdentidad !== undefined) data.numeroIdentidad = input.numeroIdentidad;
    if (input.departamentoId !== undefined) {
      data.departamento = input.departamentoId ? { connect: { id: input.departamentoId } } : { disconnect: true };
    }
    return this.repository.update(id, data);
  }
}

export class DeleteArrendatarioUseCase {
  constructor(private readonly repository: ArrendatarioRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}