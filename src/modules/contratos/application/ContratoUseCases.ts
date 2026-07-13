import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors/index.js';

import type {
  ContratoCompleto,
  EstadoContrato,
  EstadoFirma,
  TipoFirma,
} from '../domain/Contrato.js';
import type { ContratoRepository } from '../domain/ContratoRepository.js';

export interface CreateContratoInput {
  departamentoId: string;
  arrendatarioId: string;
  version?: number;
  fechaInicio: string;
  fechaFin: string;
  estado?: EstadoContrato;
  titulo?: string;
  contenido?: string;
  url?: string;
  creadoPorId?: string;
  clausulasIniciales?: string[];
}

export type CreateContratoCompletoInput = CreateContratoInput;

export class ListContratosUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(filters: {
    departamentoId?: string;
    arrendatarioId?: string;
    estado?: string;
  }): Promise<ContratoCompleto[]> {
    return this.repository.findMany({
      departamentoId: filters.departamentoId,
      arrendatarioId: filters.arrendatarioId,
      estado: filters.estado as EstadoContrato | undefined,
    });
  }
}

export class GetContratoUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(id: string): Promise<ContratoCompleto> {
    const c = await this.repository.findById(id);
    if (!c) throw new NotFoundError('Contrato');
    return c;
  }
}

export class GetCurrentContratoByDepartamentoUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(departamentoId: string): Promise<ContratoCompleto> {
    const c = await this.repository.findCurrentByDepartamento(departamentoId);
    if (!c) throw new NotFoundError('Contrato vigente para este departamento');
    return c;
  }
}

export class CreateContratoUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(input: CreateContratoInput): Promise<ContratoCompleto> {
    if (new Date(input.fechaFin) <= new Date(input.fechaInicio)) {
      throw new ValidationError('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const contrato = await this.repository.create({
      departamento: { connect: { id: input.departamentoId } },
      arrendatario: { connect: { id: input.arrendatarioId } },
      version: input.version ?? 1,
      fechaInicio: new Date(input.fechaInicio),
      fechaFin: new Date(input.fechaFin),
      estado: input.estado ?? 'BORRADOR',
      titulo: input.titulo,
      contenido: input.contenido,
      url: input.url,
      creadoPor: input.creadoPorId ? { connect: { id: input.creadoPorId } } : undefined,
    });

    if (input.clausulasIniciales && input.clausulasIniciales.length > 0) {
      for (let i = 0; i < input.clausulasIniciales.length; i++) {
        await this.repository.addClausula(contrato.id, input.clausulasIniciales[i]!, i + 1);
      }
    }

    return this.repository.findById(contrato.id) as Promise<ContratoCompleto>;
  }
}

export class UpdateContratoUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(
    id: string,
    input: Partial<CreateContratoInput>,
  ): Promise<ContratoCompleto> {
    const data: Record<string, unknown> = {};
    if (input.fechaInicio !== undefined) data.fechaInicio = new Date(input.fechaInicio);
    if (input.fechaFin !== undefined) data.fechaFin = new Date(input.fechaFin);
    if (input.estado !== undefined) data.estado = input.estado;
    if (input.titulo !== undefined) data.titulo = input.titulo;
    if (input.contenido !== undefined) data.contenido = input.contenido;
    if (input.url !== undefined) data.url = input.url;
    if (input.version !== undefined) data.version = input.version;

    return this.repository.update(id, data);
  }
}

export class RenovarContratoUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(
    contratoAnteriorId: string,
    input: { fechaInicio: string; fechaFin: string; creadoPorId?: string },
  ): Promise<ContratoCompleto> {
    const anterior = await this.repository.findById(contratoAnteriorId);
    if (!anterior) throw new NotFoundError('Contrato');

    if (anterior.estado === 'VIGENTE') {
      throw new ConflictError('El contrato actual aún está vigente');
    }

    const nuevo = await this.repository.create({
      departamento: { connect: { id: anterior.departamentoId } },
      arrendatario: { connect: { id: anterior.arrendatarioId } },
      version: anterior.version + 1,
      fechaInicio: new Date(input.fechaInicio),
      fechaFin: new Date(input.fechaFin),
      estado: 'VIGENTE',
      creadoPor: input.creadoPorId ? { connect: { id: input.creadoPorId } } : undefined,
    });

    await this.repository.update(anterior.id, { estado: 'RENOVADO' });
    await this.repository.addHistorial({
      contratoId: nuevo.id,
      version: nuevo.version,
      fecha: new Date(),
      cambios: `Renovación desde contrato v${anterior.version}`,
    });

    // Copiar cláusulas activas del contrato anterior
    if (anterior.clausulas) {
      for (let i = 0; i < anterior.clausulas.length; i++) {
        await this.repository.addClausula(nuevo.id, anterior.clausulas[i]!.texto, i + 1);
      }
    }

    return this.repository.findById(nuevo.id) as Promise<ContratoCompleto>;
  }
}

export class DeleteContratoUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

// ============ Cláusulas ============

export class AddClausulaUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(contratoId: string, texto: string, orden: number) {
    return this.repository.addClausula(contratoId, texto, orden);
  }
}

export class UpdateClausulaUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(id: string, texto: string) {
    return this.repository.updateClausula(id, texto);
  }
}

export class RemoveClausulaUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.removeClausula(id);
  }
}

// ============ Firmas ============

export class AddFirmaUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(data: {
    contratoId: string;
    nombre: string;
    email?: string;
    tipo: TipoFirma;
    estado?: EstadoFirma;
  }) {
    return this.repository.addFirma({ ...data, fecha: new Date() });
  }
}

export class UpdateFirmaEstadoUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(id: string, estado: EstadoFirma) {
    return this.repository.updateFirmaEstado(id, estado);
  }
}

export class RemoveFirmaUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.removeFirma(id);
  }
}

// ============ Envíos de firma ============

export class AddEnvioFirmaUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(data: { contratoId: string; nombre: string; email: string }) {
    return this.repository.addEnvioFirma(data);
  }
}

export class RemoveEnvioFirmaUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.removeEnvioFirma(id);
  }
}

// ============ Documentos ============

export class AddDocumentoUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(data: {
    contratoId: string;
    nombre: string;
    tipo: string;
    url: string;
    fecha?: string;
  }) {
    return this.repository.addDocumento({
      ...data,
      fecha: data.fecha ? new Date(data.fecha) : undefined,
    });
  }
}

export class RemoveDocumentoUseCase {
  constructor(private readonly repository: ContratoRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.removeDocumento(id);
  }
}
