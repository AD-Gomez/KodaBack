import type { DepartamentoWithRelations } from '../domain/Departamento.js';
import type { DepartamentoRepository, DepartamentoStats } from '../domain/DepartamentoRepository.js';

export class ListDepartamentosUseCase {
  constructor(private readonly repository: DepartamentoRepository) {}

  async execute(params: {
    filters: { estado?: string; search?: string };
    page: number;
    limit: number;
  }): Promise<{ data: DepartamentoWithRelations[]; total: number }> {
    const filters = {
      estado: params.filters.estado as DepartamentoWithRelations['estado'] | undefined,
      search: params.filters.search,
    };
    const skip = (params.page - 1) * params.limit;
    const [data, total] = await Promise.all([
      this.repository.findMany({ filters, skip, take: params.limit }),
      this.repository.count(filters),
    ]);
    return { data, total };
  }
}

export class GetDepartamentoUseCase {
  constructor(private readonly repository: DepartamentoRepository) {}

  async execute(id: string): Promise<DepartamentoWithRelations> {
    const departamento = await this.repository.findById(id);
    if (!departamento) {
      throw new Error('Departamento no encontrado');
    }
    return departamento;
  }
}

export interface CreateDepartamentoInput {
  nombre: string;
  direccion: string;
  puntoReferencia?: string;
  montoCompra: number;
  alquiler: number;
  distribucion: string;
  inmobiliario: string;
  serviciosActivos?: string;
  renovacionContrato?: string;
  estado?: string;
  imagen?: string;
}

export class CreateDepartamentoUseCase {
  constructor(private readonly repository: DepartamentoRepository) {}

  async execute(input: CreateDepartamentoInput): Promise<DepartamentoWithRelations> {
    return this.repository.create({
      nombre: input.nombre,
      direccion: input.direccion,
      puntoReferencia: input.puntoReferencia,
      montoCompra: input.montoCompra,
      alquiler: input.alquiler,
      distribucion: input.distribucion,
      inmobiliario: input.inmobiliario,
      serviciosActivos: input.serviciosActivos,
      renovacionContrato: input.renovacionContrato ? new Date(input.renovacionContrato) : undefined,
      estado: input.estado as DepartamentoWithRelations['estado'] | undefined,
      imagen: input.imagen,
    });
  }
}

export class UpdateDepartamentoUseCase {
  constructor(private readonly repository: DepartamentoRepository) {}

  async execute(id: string, input: Partial<CreateDepartamentoInput>): Promise<DepartamentoWithRelations> {
    const data: Record<string, unknown> = {};
    if (input.nombre !== undefined) data.nombre = input.nombre;
    if (input.direccion !== undefined) data.direccion = input.direccion;
    if (input.puntoReferencia !== undefined) data.puntoReferencia = input.puntoReferencia;
    if (input.montoCompra !== undefined) data.montoCompra = input.montoCompra;
    if (input.alquiler !== undefined) data.alquiler = input.alquiler;
    if (input.distribucion !== undefined) data.distribucion = input.distribucion;
    if (input.inmobiliario !== undefined) data.inmobiliario = input.inmobiliario;
    if (input.serviciosActivos !== undefined) data.serviciosActivos = input.serviciosActivos;
    if (input.renovacionContrato !== undefined) {
      data.renovacionContrato = input.renovacionContrato
        ? new Date(input.renovacionContrato)
        : null;
    }
    if (input.estado !== undefined) data.estado = input.estado;
    if (input.imagen !== undefined) data.imagen = input.imagen;
    return this.repository.update(id, data);
  }
}

export class DeleteDepartamentoUseCase {
  constructor(private readonly repository: DepartamentoRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

export class GetDepartamentoStatsUseCase {
  constructor(private readonly repository: DepartamentoRepository) {}

  async execute(): Promise<DepartamentoStats> {
    return this.repository.getStats();
  }
}