import {
  type EstadoReparacion,
  type EstadoServicio,
  type FrecuenciaServicio,
  type PrioridadReparacion,
  type ReparacionWithRelations,
  type ServicioActivoWithRelations,
  type TipoReparacion,
} from '../domain/Reparacion.js';
import type {
  ReparacionRepository,
  ReparacionStats,
  ServicioActivoRepository,
  ServicioFilters,
} from '../domain/ReparacionRepository.js';

export interface CreateReparacionInput {
  titulo: string;
  descripcion: string;
  departamentoId: string;
  prioridad: PrioridadReparacion;
  estado?: EstadoReparacion;
  fechaSolicitud: string;
  fechaProgramada?: string;
  fechaCompletada?: string;
  costo?: number;
  solicitanteId?: string;
  tecnico?: string;
  tipo: TipoReparacion;
  notas?: string;
}

export class ListReparacionesUseCase {
  constructor(private readonly repository: ReparacionRepository) {}

  async execute(params: {
    filters: {
      estado?: string;
      prioridad?: string;
      tipo?: string;
      departamentoId?: string;
      search?: string;
    };
    page: number;
    limit: number;
  }): Promise<{ data: ReparacionWithRelations[]; total: number }> {
    const skip = (params.page - 1) * params.limit;
    const filters = {
      estado: params.filters.estado as EstadoReparacion | undefined,
      prioridad: params.filters.prioridad as PrioridadReparacion | undefined,
      tipo: params.filters.tipo as TipoReparacion | undefined,
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

export class GetReparacionUseCase {
  constructor(private readonly repository: ReparacionRepository) {}

  async execute(id: string): Promise<ReparacionWithRelations> {
    const r = await this.repository.findById(id);
    if (!r) throw new Error('Reparación no encontrada');
    return r;
  }
}

export class CreateReparacionUseCase {
  constructor(private readonly repository: ReparacionRepository) {}

  async execute(input: CreateReparacionInput): Promise<ReparacionWithRelations> {
    return this.repository.create({
      titulo: input.titulo,
      descripcion: input.descripcion,
      departamento: { connect: { id: input.departamentoId } },
      prioridad: input.prioridad,
      estado: input.estado ?? 'PENDIENTE',
      fechaSolicitud: new Date(input.fechaSolicitud),
      fechaProgramada: input.fechaProgramada ? new Date(input.fechaProgramada) : null,
      fechaCompletada: input.fechaCompletada ? new Date(input.fechaCompletada) : null,
      costo: input.costo,
      solicitante: input.solicitanteId ? { connect: { id: input.solicitanteId } } : undefined,
      tecnico: input.tecnico,
      tipo: input.tipo,
      notas: input.notas,
    });
  }
}

export class UpdateReparacionUseCase {
  constructor(private readonly repository: ReparacionRepository) {}

  async execute(id: string, input: Partial<CreateReparacionInput>): Promise<ReparacionWithRelations> {
    const data: Record<string, unknown> = {};
    if (input.titulo !== undefined) data.titulo = input.titulo;
    if (input.descripcion !== undefined) data.descripcion = input.descripcion;
    if (input.departamentoId !== undefined) data.departamento = { connect: { id: input.departamentoId } };
    if (input.prioridad !== undefined) data.prioridad = input.prioridad;
    if (input.estado !== undefined) data.estado = input.estado;
    if (input.fechaSolicitud !== undefined) data.fechaSolicitud = new Date(input.fechaSolicitud);
    if (input.fechaProgramada !== undefined) {
      data.fechaProgramada = input.fechaProgramada ? new Date(input.fechaProgramada) : null;
    }
    if (input.fechaCompletada !== undefined) {
      data.fechaCompletada = input.fechaCompletada ? new Date(input.fechaCompletada) : null;
    }
    if (input.costo !== undefined) data.costo = input.costo;
    if (input.tecnico !== undefined) data.tecnico = input.tecnico;
    if (input.tipo !== undefined) data.tipo = input.tipo;
    if (input.notas !== undefined) data.notas = input.notas;
    return this.repository.update(id, data);
  }
}

export class DeleteReparacionUseCase {
  constructor(private readonly repository: ReparacionRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

export class GetReparacionStatsUseCase {
  constructor(private readonly repository: ReparacionRepository) {}

  async execute(): Promise<ReparacionStats> {
    return this.repository.getStats();
  }
}

export interface CreateServicioInput {
  nombre: string;
  departamentoId: string;
  tipo: TipoReparacion;
  frecuencia: FrecuenciaServicio;
  proximaFecha: string;
  estado?: EstadoServicio;
  proveedor?: string;
  costoMensual: number;
}

export class ListServiciosUseCase {
  constructor(private readonly repository: ServicioActivoRepository) {}

  async execute(filters: ServicioFilters): Promise<ServicioActivoWithRelations[]> {
    return this.repository.findMany(filters);
  }
}

export class GetServicioUseCase {
  constructor(private readonly repository: ServicioActivoRepository) {}

  async execute(id: string): Promise<ServicioActivoWithRelations> {
    const s = await this.repository.findById(id);
    if (!s) throw new Error('Servicio no encontrado');
    return s;
  }
}

export class CreateServicioUseCase {
  constructor(private readonly repository: ServicioActivoRepository) {}

  async execute(input: CreateServicioInput): Promise<ServicioActivoWithRelations> {
    return this.repository.create({
      nombre: input.nombre,
      departamento: { connect: { id: input.departamentoId } },
      tipo: input.tipo,
      frecuencia: input.frecuencia,
      proximaFecha: new Date(input.proximaFecha),
      estado: input.estado ?? 'ACTIVO',
      proveedor: input.proveedor,
      costoMensual: input.costoMensual,
    });
  }
}

export class UpdateServicioUseCase {
  constructor(private readonly repository: ServicioActivoRepository) {}

  async execute(id: string, input: Partial<CreateServicioInput>): Promise<ServicioActivoWithRelations> {
    const data: Record<string, unknown> = {};
    if (input.nombre !== undefined) data.nombre = input.nombre;
    if (input.departamentoId !== undefined) data.departamento = { connect: { id: input.departamentoId } };
    if (input.tipo !== undefined) data.tipo = input.tipo;
    if (input.frecuencia !== undefined) data.frecuencia = input.frecuencia;
    if (input.proximaFecha !== undefined) data.proximaFecha = new Date(input.proximaFecha);
    if (input.estado !== undefined) data.estado = input.estado;
    if (input.proveedor !== undefined) data.proveedor = input.proveedor;
    if (input.costoMensual !== undefined) data.costoMensual = input.costoMensual;
    return this.repository.update(id, data);
  }
}

export class DeleteServicioUseCase {
  constructor(private readonly repository: ServicioActivoRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}