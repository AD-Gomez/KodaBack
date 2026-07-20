import type { Prisma, PrismaClient } from '@prisma/client';

import type {
  Clausula,
  ContratoCompleto,
  DocumentoContrato,
  EnvioFirma,
  EstadoContrato,
  EstadoFirma,
  Firma,
  HistorialContrato,
  TipoFirma,
} from '../domain/Contrato.js';
import type {
  ContratoFilters,
  ContratoRepository,
} from '../domain/ContratoRepository.js';

const FULL_INCLUDE = {
  departamento: { select: { id: true, nombre: true, direccion: true } },
  arrendatario: { select: { id: true, nombre: true, email: true } },
  clausulas: { orderBy: { orden: 'asc' as const } },
  firmas: true,
  envios: { orderBy: { fechaEnvio: 'desc' as const } },
  documentos: { orderBy: { fecha: 'desc' as const } },
  historial: { orderBy: { version: 'desc' as const } },
};

export class PrismaContratoRepository implements ContratoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private buildWhere(filters: ContratoFilters): Prisma.ContratoWhereInput {
    const where: Prisma.ContratoWhereInput = {};
    if (filters.departamentoId) where.departamentoId = filters.departamentoId;
    if (filters.arrendatarioId) where.arrendatarioId = filters.arrendatarioId;
    if (filters.estado) where.estado = filters.estado;
    return where;
  }

  async findMany(filters: ContratoFilters): Promise<ContratoCompleto[]> {
    return this.prisma.contrato.findMany({
      where: this.buildWhere(filters),
      orderBy: [{ departamentoId: 'asc' }, { version: 'desc' }],
      include: FULL_INCLUDE,
    });
  }

  async findById(id: string): Promise<ContratoCompleto | null> {
    return this.prisma.contrato.findUnique({ where: { id }, include: FULL_INCLUDE });
  }

  async findCurrentByDepartamento(departamentoId: string): Promise<ContratoCompleto | null> {
    return this.prisma.contrato.findFirst({
      where: { departamentoId, estado: 'FIRMADO' as EstadoContrato },
      orderBy: { version: 'desc' },
      include: FULL_INCLUDE,
    });
  }

  async create(data: Prisma.ContratoCreateInput): Promise<ContratoCompleto> {
    return this.prisma.contrato.create({ data, include: FULL_INCLUDE });
  }

  async update(id: string, data: Prisma.ContratoUpdateInput): Promise<ContratoCompleto> {
    return this.prisma.contrato.update({ where: { id }, data, include: FULL_INCLUDE });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contrato.delete({ where: { id } });
  }

  async addClausula(contratoId: string, texto: string, orden: number): Promise<Clausula> {
    return this.prisma.clausula.create({ data: { contratoId, texto, orden } });
  }

  async updateClausula(id: string, texto: string): Promise<Clausula> {
    return this.prisma.clausula.update({ where: { id }, data: { texto } });
  }

  async removeClausula(id: string): Promise<void> {
    await this.prisma.clausula.delete({ where: { id } });
  }

  async addFirma(data: {
    contratoId: string;
    nombre: string;
    email?: string;
    tipo: TipoFirma;
    estado?: EstadoFirma;
    fecha?: Date;
  }): Promise<Firma> {
    return this.prisma.firma.create({ data });
  }

  async updateFirmaEstado(id: string, estado: EstadoFirma): Promise<Firma> {
    return this.prisma.firma.update({
      where: { id },
      data: { estado, fecha: estado === 'FIRMADO' ? new Date() : undefined },
    });
  }

  async removeFirma(id: string): Promise<void> {
    await this.prisma.firma.delete({ where: { id } });
  }

  async addEnvioFirma(data: {
    contratoId: string;
    nombre: string;
    email: string;
    token?: string;
    estado?: EstadoFirma;
  }): Promise<EnvioFirma> {
    return this.prisma.envioFirma.create({ data });
  }

  async findEnvioFirmaByToken(token: string): Promise<EnvioFirma | null> {
    return this.prisma.envioFirma.findUnique({ where: { token } });
  }

  async markEnvioFirmaFirmado(
    id: string,
    data: { nombreLegal: string; firmaData: string; ip?: string | null; userAgent?: string | null },
  ): Promise<EnvioFirma> {
    return this.prisma.envioFirma.update({
      where: { id },
      data: {
        estado: 'FIRMADO',
        fechaFirmado: new Date(),
        nombreLegal: data.nombreLegal,
        firmaData: data.firmaData,
        ipFirmado: data.ip ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async updateEnvioFirmaCedula(
    id: string,
    data: { cedulaFrenteUrl?: string | null; cedulaReversoUrl?: string | null },
  ): Promise<EnvioFirma> {
    return this.prisma.envioFirma.update({ where: { id }, data });
  }

  async updateEnvioFirmaPdf(id: string, data: { pdfUrl: string; pdfGeneradoAt: Date }): Promise<EnvioFirma> {
    return this.prisma.envioFirma.update({ where: { id }, data });
  }

  async removeEnvioFirma(id: string): Promise<void> {
    await this.prisma.envioFirma.delete({ where: { id } });
  }

  async addDocumento(data: {
    contratoId: string;
    nombre: string;
    tipo: string;
    url: string;
    fecha?: Date;
  }): Promise<DocumentoContrato> {
    return this.prisma.documentoContrato.create({ data });
  }

  async removeDocumento(id: string): Promise<void> {
    await this.prisma.documentoContrato.delete({ where: { id } });
  }

  async addHistorial(data: {
    contratoId: string;
    version: number;
    fecha: Date;
    cambios: string;
  }): Promise<HistorialContrato> {
    return this.prisma.historialContrato.create({ data });
  }
}